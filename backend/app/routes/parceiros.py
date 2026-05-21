from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import os
from supabase import create_client, Client
from datetime import datetime, timedelta

# ── IMPORTAÇÃO DO NOSSO MOTOR UNIFICADO DE E-MAILS
from app.services.email_service import enviar_email

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── MODELOS DE DADOS (SCHEMAS) ──

class LoginParceiroSchema(BaseModel):
    email: str
    senha: str

class InteresseParceiroSchema(BaseModel):
    name: str
    empresa: str
    tipo: str
    telefone: str

class DisponibilidadeParceiroSchema(BaseModel):
    tipo_quarto: str
    data_inicio: str
    data_fim: str
    preco: float
    disponivel: bool

# ── FUNÇÕES AUXILIARES INTERNAS CORRIGIDAS (PADRÃO DINÂMICO) ──

def obter_fator_liquido(tipo_item: str) -> float:
    try:
        tipo_busca = tipo_item.lower()
        if "hotel" in tipo_busca: tipo_busca = "hotel"
        elif "guia" in tipo_busca: tipo_busca = "guia"
        
        res = supabase.table("taxas_servicos").select("porcentagem").eq("tipo_servico", tipo_busca).execute()
        if res.data:
            taxa_pct = float(res.data[0]["porcentagem"])
            return 1.0 - (taxa_pct / 100.0)
        return 1.0 
    except Exception as e:
        print(f"[ERRO AO BUSCAR TAXA DINÂMICA] {e}")
        return 1.0

def calcular_recorte_hotel_pacote(hotel_id: str, tipo_quarto: str, checkin_str: str, checkout_str: str, quantidade_quartos: int = 1, quantidade_pessoas: int = 2) -> float:
    try:
        if not checkin_str or not checkout_str: return 0.0
        
        # 1. Busca a taxa de acompanhante na tabela pai (hoteis)
        res_h = supabase.table("hoteis").select("porcentagem_acompanhante").eq("id", hotel_id).single().execute()
        pct_acompanhante = float(res_h.data.get("porcentagem_acompanhante") or 0.0) if res_h.data else 0.0
        
        # 2. Busca o preço estrutural correto na tabela tipos_quarto
        res_q = supabase.table("tipos_quarto").select("preco_quarto", "nome_quarto").eq("hotel_id", hotel_id).eq("nome_quarto", tipo_quarto).execute()
        if not res_q.data:
            res_q = supabase.table("tipos_quarto").select("preco_quarto", "nome_quarto").eq("hotel_id", hotel_id).eq("slug", tipo_quarto.lower()).execute()
        if not res_q.data:
            res_q = supabase.table("tipos_quarto").select("preco_quarto", "nome_quarto").eq("hotel_id", hotel_id).execute()
            
        if not res_q.data: return 0.0
        
        quarto_data = res_q.data[0]
        base_preco = float(quarto_data["preco_quarto"])
        
        # 3. Mapeia o calendário de exceções para esta categoria específica
        res_custom = supabase.table("disponibilidade_hoteis") \
            .select("*") \
            .eq("hotel_id", hotel_id) \
            .eq("tipo_quarto", quarto_data["nome_quarto"]) \
            .order("criado_em", desc=True) \
            .execute()
            
        excecoes = res_custom.data or []
        d_atual = datetime.strptime(checkin_str, "%Y-%m-%d").date()
        d_fim = datetime.strptime(checkout_str, "%Y-%m-%d").date()
        
        acompanhantes = quantidade_pessoas - quantidade_quartos
        if acompanhantes < 0: acompanhantes = 0
        
        subtotal = 0.0
        while d_atual < d_fim:
            preco_noite = None
            for regra in excecoes:
                regra_inicio = datetime.strptime(str(regra["data_inicio"]).split("T")[0], "%Y-%m-%d").date()
                regra_fim = datetime.strptime(str(regra["data_fim"]).split("T")[0], "%Y-%m-%d").date()
                if regra_inicio <= d_atual <= regra_fim:
                    if not regra.get("disponivel", True):
                        return 0.0 # Bloqueado por overbooking na extranet
                    preco_noite = float(regra["preco"])
                    break
            
            preco_quarto_noite = preco_noite if preco_noite is not None else base_preco
            valor_noite = (preco_quarto_noite * quantidade_quartos) + (preco_quarto_noite * (pct_acompanhante / 100.0) * acompanhantes)
            subtotal += valor_noite
            d_atual += timedelta(days=1)
            
        return subtotal
    except Exception as e:
        print(f"[ERRO CALCULO RECORTE HOTEL] {e}")
        return 0.0

def calcular_recorte_guia_pacote(guia_id: str, checkin_str: str, checkout_str: str) -> float:
    try:
        if not checkin_str or not checkout_str: return 0.0
        res_g = supabase.table("guias").select("preco_diaria").eq("id", guia_id).single().execute()
        if not res_g.data: return 0.0
        
        preco_diaria = float(res_g.data["preco_diaria"])
        d_ci = datetime.strptime(checkin_str, "%Y-%m-%d")
        d_co = datetime.strptime(checkout_str, "%Y-%m-%d")
        noites = (d_co - d_ci).days
        noites_finais = noites if noites > 0 else 1
        
        return preco_diaria * (noites_finais + 1)
    except Exception as e:
        print(f"[ERRO CALCULO RECORTE GUIA] {e}")
        return 0.0

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
            "nome_negocio": parceiro.get("nome_negocio"),
            "tipo": parceiro.get("tipo")
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
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden;">
            <div style="background: #00577C; padding: 25px; text-align: center;">
                <h1 style="color: #F9C400; margin: 0; font-size: 22px; letter-spacing: 0.5px;">Novo Pedido de Parceria! 🎯</h1>
            </div>
            <div style="padding: 30px; background: #ffffff; color: #334155;">
                <p style="font-size: 15px; line-height: 1.6;">O portal <strong>SagaTurismo</strong> recebeu uma nova manifestação de interesse para credenciamento na plataforma municipal.</p>
                
                <div style="background-color: #F8FAFC; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #009640;">
                    <p style="margin: 6px 0; font-size: 15px;"><strong>👤 Nome do Responsável:</strong> {payload.name}</p>
                    <p style="margin: 6px 0; font-size: 15px;"><strong>🏢 Nome do Negócio:</strong> {payload.empresa}</p>
                    <p style="margin: 6px 0; font-size: 15px;"><strong>🏷️ Categoria:</strong> <span style="background: #00577C; color: #ffffff; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase;">{payload.tipo.upper()}</span></p>
                    <p style="margin: 6px 0; font-size: 15px;"><strong>📱 WhatsApp:</strong> {payload.telefone}</p>
                </div>
                
                <p style="font-size: 13px; color: #64748B; line-height: 1.6; background: #FFFBEB; padding: 15px; border-radius: 8px; border: 1px solid #FDE68A;">
                    <strong>Próximos Passos:</strong> Realize a auditoria comercial dos dados fornecidos. Após acordar as taxas, insira as credenciais oficiais deste parceiro na tabela <code>parceiros</code> do Supabase e mude o status para <code>'ativo'</code> para autorizar o acesso imediato ao painel.
                </p>
            </div>
            <div style="background: #002f40; color: #ffffff; padding: 15px; text-align: center; font-size: 11px;">
                <p style="margin: 0;">&copy; 2026 SagaTurismo • Secretaria Municipal de Turismo</p>
            </div>
        </div>
        """

        emails_destino = ["emmanoel.cardoso09@gmail.com"]
        
        for email in emails_destino:
            enviar_email(
                destinatario=email,
                assunto=f"Novo Parceiro Pendente: {payload.empresa}",
                corpo_html=html_content
            )
            
        return {
            "sucesso": True, 
            "mensagem": "Pedido de registo recebido com sucesso! As autoridades competentes foram notificadas."
        }
        
    except Exception as e:
        print(f"[ERRO ENVIO EMAIL INTERESSE] {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar o formulário.")

# ── ROTAS DE CONSULTA DO PAINEL COM SISTEMA HÍBRIDO ──

@router.get("/api/v1/parceiros/{item_id}/reservas", tags=["Portal dos Parceiros"])
async def listar_reservas_parceiro(item_id: str):
    try:
        res = supabase.table("pedidos") \
            .select("codigo_pedido, tipo_item, nome_cliente, email_cliente, telefone_cliente, quantidade, valor_total, data_checkin, data_checkout, tipo_quarto, hotel_id, guia_id, quantidade_pessoas, quantidade_quartos, nome_item, repasses_financeiros(parceiro_id, valor_bruto, valor_liquido)") \
            .or_(f"item_id.eq.{item_id},hotel_id.eq.{item_id},guia_id.eq.{item_id}") \
            .eq("status_pagamento", "pago") \
            .execute()
            
        reservas_processadas = []
        for r in res.data:
            tipo = r.get("tipo_item")
            lista_repasses = r.get("repasses_financeiros") or []
            repasse_exato = next((rep for rep in lista_repasses if str(rep.get("parceiro_id")) == str(item_id)), None)
            
            if repasse_exato:
                valor_bruto = float(repasse_exato["valor_bruto"])
                valor_liquido = float(repasse_exato["valor_liquido"])
                if tipo == "pacote":
                    if r.get("hotel_id") == item_id: r["tipo_item"] = "Pacote (Hospedagem)"
                    elif r.get("guia_id") == item_id: r["tipo_item"] = "Pacote (Serviço de Guia)"
            else:
                if tipo == "pacote":
                    if r.get("hotel_id") == item_id:
                        valor_bruto = calcular_recorte_hotel_pacote(
                            item_id, r.get("tipo_quarto", "standard"), r.get("data_checkin"), r.get("data_checkout"), int(r.get("quantidade_quartos") or 1), int(r.get("quantidade_pessoas") or 2)
                        )
                        r["tipo_item"] = "Pacote (Hospedagem)"
                        fator = obter_fator_liquido("hotel")
                    elif r.get("guia_id") == item_id:
                        valor_bruto = calcular_recorte_guia_pacote(item_id, r.get("data_checkin"), r.get("data_checkout"))
                        r["tipo_item"] = "Pacote (Serviço de Guia)"
                        fator = obter_fator_liquido("guia")
                    else:
                        valor_bruto = float(r.get("valor_total") or 0.0)
                        fator = 1.0
                else:
                    valor_bruto = float(r.get("valor_total") or 0.0)
                    tipo_real = "hotel" if "hotel" in tipo else "guia" if "guia" in tipo else tipo
                    fator = obter_fator_liquido(tipo_real)
                
                valor_liquido = valor_bruto * fator
            
            r["valor_total"] = round(valor_bruto, 2)
            r["valor_liquido"] = round(valor_liquido, 2)
            
            if "repasses_financeiros" in r:
                del r["repasses_financeiros"]
                
            reservas_processadas.append(r)
            
        return {"sucesso": True, "total_reservas": len(reservas_processadas), "reservas": reservas_processadas}
    except Exception as e:
        print(f"[ERRO PORTAL PARCEIROS RESERVAS] {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar lista de reservas.")

@router.get("/api/v1/parceiros/{item_id}/dashboard", tags=["Portal dos Parceiros"])
async def obter_metricas_dashboard(item_id: str):
    try:
        res = supabase.table("pedidos") \
            .select("valor_total, tipo_item, quantity:quantidade, data_checkin, data_checkout, tipo_quarto, hotel_id, guia_id, quantidade_pessoas, quantidade_quartos, nome_item, repasses_financeiros(parceiro_id, valor_bruto, valor_liquido)") \
            .or_(f"item_id.eq.{item_id},hotel_id.eq.{item_id},guia_id.eq.{item_id}") \
            .eq("status_pagamento", "pago") \
            .execute()
            
        pedidos = res.data
        faturamento_liquido_total = 0.0
        total_itens_vendidos = sum(int(p.get("quantity", 1)) for p in pedidos)
        
        for p in pedidos:
            tipo = p.get("tipo_item")
            lista_repasses = p.get("repasses_financeiros") or []
            repasse_exato = next((rep for rep in lista_repasses if str(rep.get("parceiro_id")) == str(item_id)), None)
            
            if repasse_exato:
                faturamento_liquido_total += float(repasse_exato["valor_liquido"])
            else:
                if tipo == "pacote":
                    if p.get("hotel_id") == item_id:
                        v_bruto = calcular_recorte_hotel_pacote(
                            item_id, p.get("tipo_quarto", "standard"), p.get("data_checkin"), p.get("data_checkout"), int(p.get("quantidade_quartos") or 1), int(p.get("quantidade_pessoas") or 2)
                        )
                        fator = obter_fator_liquido("hotel")
                    elif p.get("guia_id") == item_id:
                        v_bruto = calcular_recorte_guia_pacote(item_id, p.get("data_checkin"), p.get("data_checkout"))
                        fator = obter_fator_liquido("guia")
                    else:
                        v_bruto = float(p.get("valor_total") or 0.0)
                        fator = 1.0
                else:
                    v_bruto = float(p.get("valor_total") or 0.0)
                    tipo_real = "hotel" if "hotel" in tipo else "guia" if "guia" in tipo else tipo
                    fator = obter_fator_liquido(tipo_real)
                    
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
                "faturamento_total": round(faturamento_liquido_total, 2),
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
    try:
        dados_disponibilidade = {
            "hotel_id": item_id,
            "tipo_quarto": payload.tipo_quarto,
            "data_inicio": payload.data_inicio,
            "data_fim": payload.data_fim,
            "preco": payload.preco,
            "disponivel": payload.disponivel
        }
        res = supabase.table("disponibilidade_hoteis").insert(dados_disponibilidade).execute()
        return {"sucesso": True, "mensagem": "Tarifário atualizado com sucesso na base de dados!", "dados": res.data}
    except Exception as e:
        print(f"[ERRO ATUALIZAR DISPONIBILIDADE] {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao salvar as alterações.")
    
# ── 🔄 MOTOR DE CÁLCULO PÚBLICO ULTRA REATIVO REESCRITO DESDE O ZERO ──

@router.get("/api/v1/public/hoteis/{hotel_id}/calcular-preco", tags=["Consultas Públicas"])
async def obter_preco_hospedagem_publico(
    hotel_id: str, tipo_quarto: str = "standard", checkin: str = None, checkout: str = None, quantidade: int = 1, adultos: int = 2
):
    if not checkin or not checkout:
        raise HTTPException(status_code=400, detail="Check-in and Check-out dates are required.")
    try:
        # 1. Busca a taxa de acompanhante extra e o limite de parcelas diretamente na tabela hoteis ◄── MODIFICADO
        res_h = supabase.table("hoteis").select("porcentagem_acompanhante, max_parcelas_sem_juros").eq("id", hotel_id).single().execute()
        pct_acompanhante = float(res_h.data.get("porcentagem_acompanhante") or 0.0) if res_h.data else 0.0
        max_parcelas = int(res_h.data.get("max_parcelas_sem_juros") or 0) if res_h.data else 0
        
        # 2. Varre a tabela estrutural tipos_quarto para encontrar o preço base definido na extranet
        res_q = supabase.table("tipos_quarto").select("*").eq("hotel_id", hotel_id).eq("nome_quarto", tipo_quarto).execute()
        if not res_q.data:
            # Fallback seguro para buscar por slug (ex: standard -> standard-simples)
            res_q = supabase.table("tipos_quarto").select("*").eq("hotel_id", hotel_id).eq("slug", tipo_quarto.lower()).execute()
        if not res_q.data:
            # Fallback final se o hotel só tiver uma única categoria cadastrada
            res_q = supabase.table("tipos_quarto").select("*").eq("hotel_id", hotel_id).execute()
            
        if not res_q.data: 
            raise HTTPException(status_code=404, detail="Nenhuma categoria estruturada de quartos localizada.")
        
        quarto_selecionado = res_q.data[0]
        base_preco = float(quarto_selecionado["preco_quarto"])
        
        # 3. Mapeia o histórico de exceções de diárias temporárias cadastradas no calendário
        res_custom = supabase.table("disponibilidade_hoteis") \
            .select("*") \
            .eq("hotel_id", hotel_id) \
            .eq("tipo_quarto", quarto_selecionado["nome_quarto"]) \
            .order("criado_em", desc=True) \
            .execute()
            
        excecoes = res_custom.data or []
        
        d_atual = datetime.strptime(checkin, "%Y-%m-%d").date()
        d_fim = datetime.strptime(checkout, "%Y-%m-%d").date()
        
        # Lógica matemática de acompanhantes extras por quarto solicitado
        acompanhantes = adultos - quantidade
        if acompanhantes < 0: acompanhantes = 0
        
        valor_total_real = 0.0
        while d_atual < d_fim:
            preco_noite = None
            for regra in excecoes:
                regra_inicio = datetime.strptime(str(regra["data_inicio"]).split("T")[0], "%Y-%m-%d").date()
                regra_fim = datetime.strptime(str(regra["data_fim"]).split("T")[0], "%Y-%m-%d").date()
                if regra_inicio <= d_atual <= regra_fim:
                    # Trava instantânea de OVERBOOKING (Se marcado como Indisponível/Falso)
                    if not regra.get("disponivel", True):
                        return {"sucesso": True, "disponivel": False, "mensagem": "Bloqueado: Acomodação esgotada para as datas selecionadas.", "valor_total": 0, "noites": 0}
                    preco_noite = float(regra["preco"])
                    break
            
            preco_quarto_noite = preco_noite if preco_noite is not None else base_preco
            # Cálculo exato: (Preço da Noite * Qtd de Quartos) + Adicional por hóspedes extras instalado
            valor_noite = (preco_quarto_noite * quantidade) + (preco_quarto_noite * (pct_acompanhante / 100.0) * acompanhantes)
            valor_total_real += valor_noite
            d_atual += timedelta(days=1)
            
        total_noites = (d_fim - datetime.strptime(checkin, "%Y-%m-%d").date()).days
        
        # Retorno limpo e corrigido com a injeção do parcelamento seletivo ◄── MODIFICADO
        return {
            "sucesso": True, 
            "disponivel": True, 
            "valor_total": round(valor_total_real, 2), 
            "noites": total_noites if total_noites > 0 else 1,
            "max_parcelas_sem_juros": max_parcelas
        }
    except Exception as e:
        print(f"[ERRO CALCULO PUBLICO PRECO] {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar o preço dinâmico com o inventário.")