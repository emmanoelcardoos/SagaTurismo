from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import os
import uuid
from supabase import create_client, Client

router = APIRouter()

# 1. Configurações de Ambiente
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
PAGBANK_TOKEN = os.environ.get("PAGBANK_TOKEN")
CHAVE_PAGBANK_PREFEITURA = os.environ.get("CHAVE_PAGBANK_PREFEITURA") # A "Conta Mãe"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 2. O Modelo de Dados que o Frontend vai enviar
class PedidoPagamento(BaseModel):
    pacote_id: str
    hotel_id: Optional[str] = None
    tipo_quarto: Optional[str] = "standard"
    guia_id: Optional[str] = None
    nome_cliente: str
    cpf_cliente: str
    email_cliente: str
    
    # Novos campos para lidar com Cartão e PIX
    metodo_pagamento: str # "pix" ou "cartao"
    encrypted_card: Optional[str] = None
    parcelas: Optional[int] = 1

@router.post("/api/v1/pagamentos/processar")
async def processar_pagamento(pedido: PedidoPagamento):
    try:
        valor_hotel = 0.0
        valor_guia = 0.0
        valor_atracoes = 0.0
        conta_pagbank_hotel = None
        conta_pagbank_guia = None
        
        codigo_pedido = f"SAGA-{uuid.uuid4().hex[:8].upper()}" # Ex: SAGA-A1B2C3D4

        # ==========================================
        # FASE 1: VALIDAÇÃO E CÁLCULO NO SUPABASE
        # ==========================================
        
        # 1.1 Validar Hotel
        if pedido.hotel_id:
            res_hotel = supabase.table("hoteis").select("*").eq("id", pedido.hotel_id).single().execute()
            if res_hotel.data:
                valor_hotel = float(res_hotel.data["quarto_luxo_preco"] if pedido.tipo_quarto == 'luxo' else res_hotel.data["quarto_standard_preco"])
                conta_pagbank_hotel = res_hotel.data.get("pagbank_recebedor_id")

        # 1.2 Validar Guia
        if pedido.guia_id:
            res_guia = supabase.table("guias").select("*").eq("id", pedido.guia_id).single().execute()
            if res_guia.data:
                valor_guia = float(res_guia.data["preco_diaria"])
                conta_pagbank_guia = res_guia.data.get("pagbank_recebedor_id")

        # 1.3 Validar Atrações do Pacote (O lucro da Prefeitura)
        res_itens = supabase.table("pacote_itens").select("atracao_id").eq("pacote_id", pedido.pacote_id).execute()
        for item in res_itens.data:
            if item.get("atracao_id"):
                res_atracao = supabase.table("atracoes").select("preco_entrada").eq("id", item["atracao_id"]).single().execute()
                if res_atracao.data:
                    valor_atracoes += float(res_atracao.data["preco_entrada"])

        valor_total = valor_hotel + valor_guia + valor_atracoes
        
        if valor_total <= 0:
            raise HTTPException(status_code=400, detail="Valor do pacote inválido.")

        # ==========================================
        # FASE 2: PREPARAÇÃO DA DIVISÃO (SPLIT)
        # ==========================================
        # O PagBank exige os valores em centavos (ex: R$ 50,00 = 5000)
        
        splits_array = []
        
        # Repasse do Hotel
        if valor_hotel > 0 and conta_pagbank_hotel:
            splits_array.append({
                "method": "FIXED",
                "receivers": [{"account": {"public_key": conta_pagbank_hotel}, "amount": {"value": int(valor_hotel * 100)}}]
            })
            
        # Repasse do Guia
        if valor_guia > 0 and conta_pagbank_guia:
            splits_array.append({
                "method": "FIXED",
                "receivers": [{"account": {"public_key": conta_pagbank_guia}, "amount": {"value": int(valor_guia * 100)}}]
            })
            
        # Repasse da Prefeitura (Atrações e Taxas)
        if valor_atracoes > 0:
            splits_array.append({
                "method": "FIXED",
                "receivers": [{"account": {"public_key": CHAVE_PAGBANK_PREFEITURA}, "amount": {"value": int(valor_atracoes * 100)}}]
            })

        # ==========================================
        # FASE 3: MONTAGEM DO PAYLOAD PARA O PAGBANK
        # ==========================================
        
        payload_pagbank = {
            "reference_id": codigo_pedido,
            "customer": {
                "name": pedido.nome_cliente,
                "email": pedido.email_cliente,
                "tax_id": pedido.cpf_cliente.replace(".", "").replace("-", "")
            },
            "items": [
                {
                    "name": "Pacote Turístico - SagaTurismo",
                    "quantity": 1,
                    "unit_amount": int(valor_total * 100)
                }
            ],
            "notification_urls": [
                "https://seu-backend.railway.app/api/v1/webhooks/pagbank" # Substituiremos pelo seu link da Railway
            ]
        }

        # 3.1 Se for PIX
        if pedido.metodo_pagamento.lower() == "pix":
            payload_pagbank["qr_codes"] = [
                {
                    "amount": {"value": int(valor_total * 100)},
                    "splits": splits_array # O Split do PIX entra aqui!
                }
            ]

        # 3.2 Se for CARTÃO DE CRÉDITO
        elif pedido.metodo_pagamento.lower() == "cartao":
            if not pedido.encrypted_card:
                raise HTTPException(status_code=400, detail="Cartão criptografado não fornecido.")
                
            payload_pagbank["charges"] = [
                {
                    "reference_id": codigo_pedido,
                    "description": "Pacote Turístico - SagaTurismo",
                    "amount": {
                        "value": int(valor_total * 100),
                        "currency": "BRL"
                    },
                    "payment_method": {
                        "type": "CREDIT_CARD",
                        "installments": pedido.parcelas,
                        "capture": True,
                        "card": {
                            "encrypted": pedido.encrypted_card
                        },
                        "holder": {
                            "name": pedido.nome_cliente,
                            "tax_id": pedido.cpf_cliente.replace(".", "").replace("-", "")
                        }
                    },
                    "splits": splits_array # O Split do Cartão entra aqui!
                }
            ]
        else:
            raise HTTPException(status_code=400, detail="Método de pagamento inválido.")

        # ==========================================
        # FASE 4: DISPARO PARA A API DO PAGBANK
        # ==========================================
        
        headers = {
            "Authorization": f"Bearer {PAGBANK_TOKEN}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # IMPORTANTE: Usar api.pagseguro.com para produção ou sandbox.api.pagseguro.com para testes
        URL_PAGBANK = "https://sandbox.api.pagseguro.com/orders" 

        async with httpx.AsyncClient() as client:
            resposta = await client.post(URL_PAGBANK, json=payload_pagbank, headers=headers, timeout=30.0)
            dados_pagbank = resposta.json()

            if resposta.status_code not in [200, 201]:
                print("Erro PagBank:", dados_pagbank)
                raise HTTPException(status_code=400, detail="Pagamento recusado pela operadora.")

            # Resposta para PIX
            if pedido.metodo_pagamento == "pix":
                qr_code_info = dados_pagbank.get("qr_codes", [{}])[0]
                links = qr_code_info.get("links", [])
                qrcode_image = next((l.get("href", "") for l in links if l.get("rel") == "QRCODE.PNG"), "")
                qrcode_text = qr_code_info.get("text", "")
                
                return {
                    "sucesso": True,
                    "metodo": "pix",
                    "codigo_pedido": codigo_pedido,
                    "pix_qrcode_img": qrcode_image,
                    "pix_copia_cola": qrcode_text
                }
                
            # Resposta para CARTÃO
            elif pedido.metodo_pagamento == "cartao":
                return {
                    "sucesso": True,
                    "metodo": "cartao",
                    "codigo_pedido": codigo_pedido,
                    "status_pagamento": dados_pagbank["charges"][0]["status"] # "AUTHORIZED" ou "PAID"
                }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro fatal ao processar pagamento: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")