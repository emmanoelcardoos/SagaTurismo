from fastapi import APIRouter, Request, HTTPException
import os
import uuid
from datetime import datetime
from supabase import create_client, Client

router = APIRouter()

# 1. Configurações de Ambiente
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def gerar_token_carteirinha() -> str:
    """Gera um token alfanumérico único e elegante em maiúsculas"""
    return uuid.uuid4().hex.upper()

@router.post("/api/v1/webhooks/pagbank")
async def webhook_pagbank(request: Request):
    try:
        # 1. Receber e Logar o Payload (Essencial para depurar no Railway)
        payload = await request.json()
        print(f"--- [WEBHOOK RECEBIDO] ---")
        
        charges = payload.get("charges", [])
        primeira_charge = charges[0] if charges else {}

        # Mineração robusta do Reference ID
        reference_id = (
            payload.get("reference_id")
            or payload.get("data", {}).get("reference_id")
            or primeira_charge.get("reference_id")
            or payload.get("id") # Fallback para ID da ordem
        )

        # Mineração do Status
        status_raw = (
            payload.get("status")
            or primeira_charge.get("status")
            or payload.get("data", {}).get("status")
            or "PENDING"
        )
        
        status_normalizado = status_raw.upper()
        print(f"[WEBHOOK] Pedido: {reference_id} | Status: {status_normalizado}")

        if not reference_id:
            return {"status": "error", "message": "Reference ID não encontrado no payload"}

        # 2. Verificar existência do pedido no Supabase
        res_pedido = supabase.table("pedidos").select("*").eq("codigo_pedido", reference_id).single().execute()
        
        if not res_pedido.data:
            print(f"[WEBHOOK] AVISO: Pedido {reference_id} ignorado (não consta na base).")
            return {"status": "ok", "message": "Pedido inexistente"}
            
        pedido = res_pedido.data

        # 3. Evitar reprocessamento (Idempotência)
        if pedido.get("status_pagamento") == "pago":
            return {"status": "ok", "message": "Pagamento já processado anteriormente"}

        # 4. Processar Sucesso
        status_sucesso = ["PAID", "AUTHORIZED", "COMPLETED", "APPROVED"]
        
        if status_normalizado in status_sucesso:
            # A. CORREÇÃO: Removido o 'pago_em' que causava erro PGRST204 por não existir na tabela
            supabase.table("pedidos").update({
                "status_pagamento": "pago"
            }).eq("codigo_pedido", reference_id).execute()
            
            print(f"[WEBHOOK] SUCESSO: O pagamento de {reference_id} foi confirmado.")

            # B. Ações por Tipo de Item
            tipo = pedido.get("tipo_item")
            
            if tipo == "carteira":
                qtd = pedido.get("quantidade", 1)
                for _ in range(qtd):
                    token = gerar_token_carteirinha()
                    supabase.table("cidadaos").insert({
                        "token": token,
                        "nome_completo": pedido.get("nome_cliente"),
                        "cpf": pedido.get("cpf_cliente"),
                        "data_nascimento": pedido.get("data_nascimento"),
                        "telefone": pedido.get("telefone_cliente"),
                        "status": "aprovado",
                        "pagamento_status": "pago",
                        "pedido_id": pedido.get("id")
                    }).execute()
                print(f"[WEBHOOK] {qtd} carteira(s) residente(s) gerada(s).")

            elif tipo == "hotel":
                print(f"[WEBHOOK] Reserva de Hotel confirmada para {pedido.get('nome_cliente')}.")
                # Espaço reservado para envio de e-mail com voucher PDF

            elif tipo == "pacote":
                print(f"[WEBHOOK] Pacote turístico confirmado para {pedido.get('nome_cliente')}.")

        elif status_normalizado in ["DECLINED", "CANCELED", "REFUNDED"]:
            supabase.table("pedidos").update({"status_pagamento": "recusado"}).eq("codigo_pedido", reference_id).execute()
            print(f"[WEBHOOK] Pagamento {reference_id} marcado como RECUSADO.")

        return {"status": "ok"}

    except Exception as e:
        print(f"[WEBHOOK ERRO] Falha crítica: {str(e)}")
        # Retornamos 200 para o PagBank não ficar em loop infinito de tentativas se houver bug no código
        return {"status": "ok", "error": "Internal process handled"}