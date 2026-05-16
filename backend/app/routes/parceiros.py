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

# ── ROTA DE AUTENTICAÇÃO DO PARCEIRO ──

@router.post("/api/v1/parceiros/login", tags=["Portal dos Parceiros"])
async def login_parceiro(payload: LoginParceiroSchema):
    """
    Realiza a autenticação do parceiro no Supabase.
    Apenas concede acesso se o status do parceiro for 'ativo' (validado manualmente).
    """
    try:
        # 1. Procurar o parceiro pelo e-mail fornecido
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
        
        # 2. Validar a Senha Simples
        if parceiro.get("senha") != payload.senha:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais inválidas. Verifique a palavra-passe."
            )
            
        # 3. Validar a Ativação Manual da Equipa
        if parceiro.get("status") != "ativo":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="A sua conta ainda está em fase de análise ou encontra-se suspensa pela Secretaria de Turismo."
            )
            
        # 4. Sucesso: Retorna o ID do estabelecimento para o Frontend gerir a sessão
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
    """
    Recebe os dados do formulário 'Seja um Parceiro' do frontend e dispara 
    um e-mail de notificação para a equipa avaliar o credenciamento.
    """
    try:
        # Puxa a API Key configurada nas variáveis da Railway
        resend.api_key = os.environ.get("RESEND_API_KEY")
        if not resend.api_key:
            print("[AVISO] RESEND_API_KEY não encontrada nas variáveis de ambiente.")
            raise HTTPException(status_code=500, detail="Configuração de e-mail ausente no servidor.")
        
        # Estrutura visual do e-mail em HTML
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

        # Configuração dos parâmetros de envio
        params = {
            "from": "SagaTurismo <sistema@sagatur.com.br>", 
            "to": ["emmanoel.cardoso09@gmail.com"],
            "subject": f"Novo Parceiro Pendente: {payload.empresa}",
            "html": html_content,
        }

        # Envia através do SDK do Resend
        resend.Emails.send(params)

        return {"sucesso": True, "mensagem": "Pedido de registro recebido com sucesso!"}
        
    except Exception as e:
        print(f"[ERRO ENVIO EMAIL INTERESSE] {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar o formulário.")

# ── ROTAS DE CONSULTA DO PAINEL (MANTIDAS) ──

@router.get("/api/v1/parceiros/{item_id}/reservas", tags=["Portal dos Parceiros"])
async def listar_reservas_parceiro(item_id: str):
    try:
        res = supabase.table("pedidos") \
            .select("codigo_pedido, tipo_item, nome_cliente, email_cliente, telefone_cliente, quantidade, valor_total, data_checkin, data_checkout") \
            .eq("item_id", item_id) \
            .eq("status_pagamento", "pago") \
            .execute()
            
        return {
            "sucesso": True,
            "total_reservas": len(res.data),
            "reservas": res.data
        }
    except Exception as e:
        print(f"[ERRO PORTAL PARCEIROS] {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar lista de reservas.")

@router.get("/api/v1/parceiros/{item_id}/dashboard", tags=["Portal dos Parceiros"])
async def obter_metricas_dashboard(item_id: str):
    try:
        res = supabase.table("pedidos") \
            .select("valor_total, quantity:quantidade, data_checkin") \
            .eq("item_id", item_id) \
            .eq("status_pagamento", "pago") \
            .execute()
            
        pedidos = res.data
        faturamento_total = sum(float(p.get("valor_total", 0.0)) for p in pedidos)
        total_itens_vendidos = sum(int(p.get("quantity", 1)) for p in pedidos)
        
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
                "faturamento_total": faturamento_total,
                "total_vendas": len(pedidos),
                "total_produtos_entregues": total_itens_vendidos,
                "clientes_a_chegar": proximos_clientes
            }
        }
    except Exception as e:
        print(f"[ERRO METRICAS PARCEIROS] {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar métricas.")