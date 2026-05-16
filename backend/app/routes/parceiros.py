from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import os
import resend
from supabase import create_client, Client
from datetime import datetime

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── MODELOS DE DADOS (SCHEMAS) ──

class LoginParceiroSchema(BaseModel):
    email: str
    senha: str

class InteresseParceiroSchema(BaseModel):
    nome: str
    empresa: str
    tipo: str
    telefone: str

class DisponibilidadeParceiroSchema(BaseModel):
    tipo_quarto: str
    data_inicio: str
    data_fim: str
    preco: float
    disponivel: bool

# ── FUNÇÃO AUXILIAR INTERNA: BUSCAR TAXAS E CALCULAR LÍQUIDO ──
def obter_fator_liquido(tipo_item: str) -> float:
    """
    Consulta a tabela 'taxas_servicos' no Supabase para descobrir a taxa.
    Retorna o multiplicador líquido (ex: 10% de taxa retorna 0.90).
    """
    try:
        res = supabase.table("taxas_servicos").select("porcentagem").eq("tipo_servico", tipo_item).execute()
        if res.data:
            taxa_pct = float(res.data[0]["porcentagem"])
            return 1.0 - (taxa_pct / 100.0)
        return 1.0 # Se não achar a taxa, assume repasse de 100% por segurança
    except Exception as e:
        print(f"[ERRO AO BUSCAR TAXA DINÂMICA] {e}")
        return 1.0

# ── ROTA DE AUTENTICAÇÃO DO PARCEIRO ──

@router.post("/api/v1/parceiros/login", tags=["Portal dos Parceiros"])
async def login_parceiro(payload: LoginParceiroSchema):
    try:
        res = supabase.table("parceiros") \
            .select("*") \
            .eq("email", payload.email.strip()) \
            .execute()
            
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais inválidas ou utilizador não cadastrado."
            )
            
        parceiro = res.data[0]
        
        if parceiro.get("senha") != payload.senha:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais inválidas. Verifique a palavra-passe."
            )
            
        if parceiro.get("status") != "ativo":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="A sua conta ainda está em fase de análise ou encontra-se suspensa pela Secretaria de Turismo."
            )
            
        return {
            "sucesso": True,
            "mensagem": "Autenticação realizada com sucesso!",
            "parceiro_id": parceiro.get("id"),
            "nome_negocio": parceiro.get("nome_negocio")
        }
        
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"[ERRO LOGIN PARCEIRO] {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar a autenticação.")

# ── ROTA PARA RECEBER O PEDIDO DE INTERESSE E ENVIAR E-MAIL ──

@router.post("/api/v1/parceiros/interesse", tags=["Portal dos Parceiros"])
async def registrar_interesse_parceiro(payload: InteresseParceiroSchema):
    try:
        resend.api_key = os.environ.get("RESEND_API_KEY")
        if not resend.api_key:
            raise HTTPException(status_code=500, detail="Configuração de e-mail ausente no servidor.")
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 10px;">
            <h2 style="color: #00577C; margin-bottom: 5px;">Novo Pedido de Parceria! 🎯</h2>
            <p style="color: #64748B; font-size: 14px; margin-top: 0;">O portal SagaTurismo recebeu um novo interesse de credenciamento.</p>
            <div style="background-color: #F8FAFC; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F9C400;">
                <p style="margin: 5px 0;"><strong>👤 Nome do Responsável:</strong> {payload.nome}</p>
                <p style="margin: 5px 0;"><strong>🏢 Nome do Negócio:</strong> {payload.empresa}</p>
                <p style="margin: 5px 0;"><strong>🏷️ Categoria:</strong> {payload.tipo.upper()}</p>
                <p style="margin: 5px 0;"><strong>📱 WhatsApp:</strong> {payload.telefone}</p>
            </div>
            <p style="color: #0F172A; font-size: 14px; line-height: 1.5;">
                Por favor, faça a validação dos dados. Após o contacto, crie as credenciais de acesso do parceiro na tabela <strong>parceiros</strong> do Supabase e defina o status como <strong>'ativo'</strong> para libertar o login.
            </p>
        </div>
        """

        params = {
            "from": "SagaTurismo <sistema@sagatur.com.br>", 
            "to": ["emmanoel.cardoso09@gmail.com"],
            "subject": f"Novo Parceiro Pendente: {payload.empresa}",
            "html": html_content,
        }

        resend.Emails.send(params)
        return {"sucesso": True, "mensagem": "Pedido de registro recebido com sucesso!"}
        
    except Exception as e:
        print(f"[ERRO ENVIO EMAIL INTERESSE] {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar o formulário.")

# ── ROTAS DE CONSULTA DO PAINEL (COM DESCONTO DINÂMICO DE TAXAS) ──

@router.get("/api/v1/parceiros/{item_id}/reservas", tags=["Portal dos Parceiros"])
async def listar_reservas_parceiro(item_id: str):
    try:
        res = supabase.table("pedidos") \
            .select("codigo_pedido, tipo_item, nome_cliente, email_cliente, telefone_cliente, quantidade, valor_total, data_checkin, data_checkout") \
            .eq("item_id", item_id) \
            .eq("status_pagamento", "pago") \
            .execute()
            
        reservas_processadas = []
        for r in res.data:
            tipo = r.get("tipo_item")
            valor_bruto = float(r.get("valor_total") or 0.0)
            
            # Descobre a taxa na base de dados e aplica
            fator = obter_fator_liquido(tipo)
            
            # Adicionamos o campo 'valor_liquido' diretamente na resposta da API
            r["valor_liquido"] = round(valor_bruto * fator, 2)
            reservas_processadas.append(r)
            
        return {
            "sucesso": True,
            "total_reservas": len(reservas_processadas),
            "reservas": reservas_processadas
        }
    except Exception as e:
        print(f"[ERRO PORTAL PARCEIROS] {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar lista de reservas.")

@router.get("/api/v1/parceiros/{item_id}/dashboard", tags=["Portal dos Parceiros"])
async def obter_metricas_dashboard(item_id: str):
    try:
        res = supabase.table("pedidos") \
            .select("valor_total, tipo_item, quantity:quantidade, data_checkin") \
            .eq("item_id", item_id) \
            .eq("status_pagamento", "pago") \
            .execute()
            
        pedidos = res.data
        faturamento_liquido_total = 0.0
        total_itens_vendidos = sum(int(p.get("quantity", 1)) for p in pedidos)
        
        # Calcula o faturamento já com os descontos dinâmicos da base de dados
        for p in pedidos:
            tipo = p.get("tipo_item")
            v_bruto = float(p.get("valor_total") or 0.0)
            fator = obter_fator_liquido(tipo)
            faturamento_liquido_total += (v_bruto * fator)
        
        hoje = datetime.now().date()
        proximos_clientes = 0
        for p in pedidos:
            data_checkin_str = p.get("data_checkin")
            if data_checkin_str:
                try:
                    data_checkin = datetime.strptime(data_checkin_str, "%Y-%m-%d").date()
                    if data_checkin >= hoje:
                        proximos_clientes += 1
                except ValueError:
                    pass

        return {
            "sucesso": True,
            "metricas": {
                "faturamento_total": round(faturamento_liquido_total, 2), # Envia o líquido calculado direto do banco
                "total_vendas": len(pedidos),
                "total_produtos_entregues": total_itens_vendidos,
                "clientes_a_chegar": proximos_clientes
            }
        }
    except Exception as e:
        print(f"[ERRO METRICAS PARCEIROS] {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar métricas.")
    
@router.post("/api/v1/parceiros/{item_id}/disponibilidade", tags=["Portal dos Parceiros"])
async def atualizar_disponibilidade_parceiro(item_id: str, payload: DisponibilidadeParceiroSchema):
    """
    Recebe as alterações de tarifas e bloqueios de datas enviadas pelo calendário
    do parceiro e grava na tabela do Supabase.
    """
    try:
        # Prepara o dicionário para inserir na nova tabela
        dados_disponibilidade = {
            "hotel_id": item_id,
            "tipo_quarto": payload.tipo_quarto,
            "data_inicio": payload.data_inicio,
            "data_fim": payload.data_fim,
            "preco": payload.preco,
            "disponivel": payload.disponivel
        }
        
        # Grava os dados no Supabase
        res = supabase.table("disponibilidade_hoteis").insert(dados_disponibilidade).execute()
        
        return {
            "sucesso": True, 
            "mensagem": "Tarifário atualizado com sucesso na base de dados!",
            "dados": res.data
        }
        
    except Exception as e:
        print(f"[ERRO ATUALIZAR DISPONIBILIDADE] {e}")
        raise HTTPException(
            status_code=500, 
            detail="Erro interno ao salvar as alterações do calendário no servidor."
        )
    
@router.get("/api/v1/public/hoteis/{hotel_id}/calcular-preco", tags=["Consultas Públicas"])
async def obter_preco_hospedagem_publico(
    hotel_id: str, 
    tipo_quarto: str = "standard", 
    checkin: str = None, 
    checkout: str = None,
    quantidade: int = 1
):
    if not checkin or not checkout:
        raise HTTPException(status_code=400, detail="Check-in and Check-out dates are required.")
        
    try:
        # 1. Busca a tarifa base do hotel
        res_h = supabase.table("hoteis").select("*").eq("id", hotel_id).single().execute()
        if not res_h.data:
            raise HTTPException(status_code=404, detail="Hotel não encontrado.")
        
        hotel_data = res_h.data
        base_preco = float(hotel_data["quarto_luxo_preco"] if tipo_quarto == 'luxo' else hotel_data["quarto_standard_preco"])
        
        # 2. Busca TODAS as regras deste quarto ORDENADAS PELA MAIS RECENTE
        res_custom = supabase.table("disponibilidade_hoteis") \
            .select("*") \
            .eq("hotel_id", hotel_id) \
            .eq("tipo_quarto", tipo_quarto) \
            .order("criado_em", desc=True) \
            .execute()
            
        excecoes = res_custom.data or []
        
        from datetime import datetime, timedelta
        d_atual = datetime.strptime(checkin, "%Y-%m-%d").date()
        d_fim = datetime.strptime(checkout, "%Y-%m-%d").date()
        
        valor_total_bruto = 0.0
        
        # Calcula noite por noite
        while d_atual < d_fim:
            preco_noite = None
            for regra in excecoes:
                # CORREÇÃO DEFINITIVA AQUI: Garantir que se a DB vier com TIMEZONE, o python corta e lê apenas o YYYY-MM-DD
                regra_inicio_raw = str(regra["data_inicio"]).split("T")[0]
                regra_fim_raw = str(regra["data_fim"]).split("T")[0]
                
                regra_inicio = datetime.strptime(regra_inicio_raw, "%Y-%m-%d").date()
                regra_fim = datetime.strptime(regra_fim_raw, "%Y-%m-%d").date()
                
                if regra_inicio <= d_atual <= regra_fim:
                    if not regra.get("disponivel", True):
                        return {"sucesso": False, "disponivel": False, "mensagem": "Esgotado para as datas selecionadas."}
                    preco_noite = float(regra["preco"])
                    break
            
            valor_total_bruto += preco_noite if preco_noite is not None else base_preco
            d_atual += timedelta(days=1)
            
        valor_final = valor_total_bruto * quantidade
        
        return {
            "sucesso": True,
            "disponivel": True,
            "valor_total": valor_final,
            "noites": (d_fim - datetime.strptime(checkin, "%Y-%m-%d").date()).days
        }
        
    except Exception as e:
        print(f"[ERRO CALCULO PUBLICO PRECO] {e}")
        raise HTTPException(status_code=500, detail="Erro ao calcular preço dinâmico.")