from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
import os
from supabase import create_client, Client
from datetime import datetime

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── MODELO DE DADOS PARA RECEBER O LOGIN ──
class LoginParceiroSchema(BaseModel):
    email: str
    senha: str

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
        
        # 2. Validar a Senha Simples (Comparação direta conforme solicitado)
        if parceiro.get("senha") != payload.senha:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais inválidas. Verifique a palavra-passe."
            )
            
        # 3. Validar a Ativação Manual da Equipa
        # Se o status não for 'ativo', bloqueia o login mesmo com a senha correta
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
            .select("valor_total, quantidade, data_checkin") \
            .eq("item_id", item_id) \
            .eq("status_pagamento", "pago") \
            .execute()
            
        pedidos = res.data
        faturamento_total = sum(float(p.get("valor_total", 0.0)) for p in pedidos)
        total_itens_vendidos = sum(int(p.get("quantidade", 1)) for p in pedidos)
        
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