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
    """Gera um token alfanumérico único para a carteira digital"""
    return uuid.uuid4().hex

@router.post("/api/v1/webhooks/pagbank")
async def webhook_pagbank(request: Request):
    try:
        # 1. Ler o payload do PagBank
        payload = await request.json()
        print(f"[WEBHOOK PAGBANK] Payload Recebido: {payload}")

        # O PagBank tem formatos diferentes dependendo de como e quando notifica (PIX vs Cartão)
        charges = payload.get("charges") or []
        primeira_charge = charges[0] if charges else {}

        reference_id = (
            payload.get("reference_id")
            or payload.get("data", {}).get("reference_id")
            or payload.get("charge", {}).get("reference_id")
            or primeira_charge.get("reference_id")
            or ""
        )

        status_pagbank = (
            payload.get("status")
            or payload.get("data", {}).get("status")
            or payload.get("charge", {}).get("status")
            or primeira_charge.get("status")
            or ""
        )
        
        status_normalizado = status_pagbank.lower()

        if not reference_id:
            print("[WEBHOOK PAGBANK] AVISO: Payload sem código de referência. Ignorado.")
            return {"status": "ok", "mensagem": "Sem reference_id"}

        # 2. Procurar o Pedido no Supabase
        res_pedido = supabase.table("pedidos").select("*").eq("codigo_pedido", reference_id).single().execute()
        
        if not res_pedido.data:
            print(f"[WEBHOOK PAGBANK] AVISO: Pedido {reference_id} não encontrado.")
            return {"status": "ok", "mensagem": "Pedido não encontrado"}
            
        pedido = res_pedido.data

        # Prevenção contra execução dupla (se já pagou, ignora)
        if pedido.get("status_pagamento") == "pago":
            print(f"[WEBHOOK PAGBANK] Pedido {reference_id} já estava marcado como PAGO.")
            return {"status": "ok", "mensagem": "Já processado"}

        # 3. Analisar o Status
        status_sucesso = ["paid", "authorized", "completed", "approved"]
        
        if status_normalizado in status_sucesso:
            # 3.1 MARCAR PEDIDO COMO PAGO
            supabase.table("pedidos").update({"status_pagamento": "pago"}).eq("codigo_pedido", reference_id).execute()
            print(f"[WEBHOOK PAGBANK] SUCESSO: Pedido {reference_id} marcado como PAGO!")

            # =================================================================
            # 4. REGRAS DE NEGÓCIO PÓS-PAGAMENTO
            # =================================================================
            tipo_item = pedido.get("tipo_item")
            quantidade = pedido.get("quantidade", 1)
            
            # --- SE COMPROU A CARTEIRINHA DIGITAL ---
            if tipo_item == "carteira":
                tokens_gerados = []
                # Gera uma carteirinha para cada pessoa paga (dependente)
                for _ in range(quantidade):
                    token = gerar_token_carteirinha()
                    tokens_gerados.append(token)
                    
                    nova_carteira = {
                        "token": token,
                        "nome_completo": pedido.get("nome_cliente"),
                        "cpf": pedido.get("cpf_cliente"),
                        "data_nascimento": pedido.get("data_nascimento"),
                        "telefone": pedido.get("telefone_cliente"),
                        "status": "aprovado",
                        "pagamento_status": "pago",
                        "foto_url": pedido.get("foto_url"), 
                        "pedido_id": pedido.get("id")
                    }
                    supabase.table("cidadaos").insert(nova_carteira).execute()
                
                print(f"[WEBHOOK PAGBANK] Emitidas {quantidade} carteiras para {pedido.get('nome_cliente')}. Tokens: {tokens_gerados}")
                
                # [AQUI: Você pode chamar uma função que envia um E-mail/WhatsApp com o(s) link(s) gerados]
                
            # --- SE COMPROU HOTEL ---
            elif tipo_item == "hotel":
                print(f"[WEBHOOK PAGBANK] Hotel confirmado para {pedido.get('nome_cliente')}.")
                # [AQUI: Enviar e-mail com voucher de hotel]
                
            # --- SE COMPROU PACOTE ---
            elif tipo_item == "pacote":
                print(f"[WEBHOOK PAGBANK] Pacote confirmado para {pedido.get('nome_cliente')}.")
                # [AQUI: Avisar Guia e Hotel]

            return {"status": "ok", "mensagem": f"Pedido {reference_id} pago com sucesso."}
            
        elif status_normalizado in ["declined", "canceled", "refunded"]:
            supabase.table("pedidos").update({"status_pagamento": "recusado"}).eq("codigo_pedido", reference_id).execute()
            print(f"[WEBHOOK PAGBANK] Pedido {reference_id} recusado.")
            return {"status": "ok", "mensagem": "Pagamento recusado"}
            
        else:
             print(f"[WEBHOOK PAGBANK] Status em andamento: {status_normalizado} ({reference_id}).")
             return {"status": "ok", "mensagem": "Status em processamento"}

    except Exception as e:
        print(f"[WEBHOOK PAGBANK] ERRO FATAL: {e}")
        # Retorna 200 para o PagBank parar de enviar notificações de erro
        return {"status": "ok", "mensagem": "Erro interno capturado."}