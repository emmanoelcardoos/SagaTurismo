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

# 2. O Modelo de Dados unificado
class PedidoPagamento(BaseModel):
    tipo_item: str # 'carteira', 'hotel' ou 'pacote'
    
    # IDs dinâmicos (dependendo do que está a ser comprado)
    pacote_id: Optional[str] = None
    hotel_id: Optional[str] = None
    tipo_quarto: Optional[str] = "standard"
    guia_id: Optional[str] = None
    
    # Dados do Cidadão/Turista
    nome_cliente: str
    cpf_cliente: str
    email_cliente: str
    
    # Pagamento
    metodo_pagamento: str # "pix" ou "cartao"
    encrypted_card: Optional[str] = None
    parcelas: Optional[int] = 1

@router.post("/api/v1/pagamentos/processar")
async def processar_pagamento(pedido: PedidoPagamento):
    try:
        valor_total = 0.0
        splits_array = []
        nome_item_checkout = ""
        item_id_db = None
        
        codigo_pedido = f"SAGA-{uuid.uuid4().hex[:8].upper()}"

        # ==========================================
        # FASE 1: O MAESTRO (Decisão de Preços e Splits)
        # ==========================================
        
        # --- CENÁRIO A: CARTEIRA DIGITAL ---
        if pedido.tipo_item == "carteira":
            valor_total = 10.00
            nome_item_checkout = "Taxa de Emissão - Carteira Digital de Residente"
            item_id_db = None
            # Sem split: 100% do valor vai automaticamente para a conta principal (Prefeitura)

        # --- CENÁRIO B: HOTEL AVULSO ---
        elif pedido.tipo_item == "hotel":
            if not pedido.hotel_id:
                raise HTTPException(status_code=400, detail="ID do hotel não fornecido.")
                
            res_hotel = supabase.table("hoteis").select("*").eq("id", pedido.hotel_id).single().execute()
            if not res_hotel.data:
                raise HTTPException(status_code=404, detail="Hotel não encontrado.")
                
            hotel_data = res_hotel.data
            valor_total = float(hotel_data["quarto_luxo_preco"] if pedido.tipo_quarto == 'luxo' else hotel_data["quarto_standard_preco"])
            nome_item_checkout = f"Reserva de Hospedagem - {hotel_data['nome']}"
            item_id_db = pedido.hotel_id
            
            # Repasse para o Hotel
            conta_pagbank_hotel = hotel_data.get("pagbank_recebedor_id")
            if conta_pagbank_hotel:
                splits_array.append({
                    "method": "FIXED",
                    "receivers": [{"account": {"public_key": conta_pagbank_hotel}, "amount": {"value": int(valor_total * 100)}}]
                })

        # --- CENÁRIO C: PACOTE TURÍSTICO ---
        elif pedido.tipo_item == "pacote":
            if not pedido.pacote_id:
                raise HTTPException(status_code=400, detail="ID do pacote não fornecido.")
                
            valor_hotel = 0.0
            valor_guia = 0.0
            valor_atracoes = 0.0
            
            if pedido.hotel_id:
                res_hotel = supabase.table("hoteis").select("*").eq("id", pedido.hotel_id).single().execute()
                if res_hotel.data:
                    valor_hotel = float(res_hotel.data["quarto_luxo_preco"] if pedido.tipo_quarto == 'luxo' else res_hotel.data["quarto_standard_preco"])
                    if res_hotel.data.get("pagbank_recebedor_id"):
                        splits_array.append({"method": "FIXED", "receivers": [{"account": {"public_key": res_hotel.data["pagbank_recebedor_id"]}, "amount": {"value": int(valor_hotel * 100)}}]})

            if pedido.guia_id:
                res_guia = supabase.table("guias").select("*").eq("id", pedido.guia_id).single().execute()
                if res_guia.data:
                    valor_guia = float(res_guia.data["preco_diaria"])
                    if res_guia.data.get("pagbank_recebedor_id"):
                        splits_array.append({"method": "FIXED", "receivers": [{"account": {"public_key": res_guia.data["pagbank_recebedor_id"]}, "amount": {"value": int(valor_guia * 100)}}]})

            res_itens = supabase.table("pacote_itens").select("atracao_id").eq("pacote_id", pedido.pacote_id).execute()
            for item in res_itens.data:
                if item.get("atracao_id"):
                    res_atracao = supabase.table("atracoes").select("preco_entrada").eq("id", item["atracao_id"]).single().execute()
                    if res_atracao.data:
                        valor_atracoes += float(res_atracao.data["preco_entrada"])
            
            if valor_atracoes > 0 and CHAVE_PAGBANK_PREFEITURA:
                 splits_array.append({"method": "FIXED", "receivers": [{"account": {"public_key": CHAVE_PAGBANK_PREFEITURA}, "amount": {"value": int(valor_atracoes * 100)}}]})

            valor_total = valor_hotel + valor_guia + valor_atracoes
            nome_item_checkout = "Pacote Turístico Oficial - SagaTurismo"
            item_id_db = pedido.pacote_id

        else:
            raise HTTPException(status_code=400, detail="Tipo de item inválido.")

        if valor_total <= 0:
            raise HTTPException(status_code=400, detail="Valor de pagamento inválido.")

        # ==========================================
        # FASE 2: GRAVAR NO SUPABASE (O Cofre)
        # ==========================================
        # Anotamos o pedido ANTES de ir para o PagBank. Assim, o Webhook já sabe quem cobrar!
        
        pedido_db = {
            "codigo_pedido": codigo_pedido,
            "tipo_item": pedido.tipo_item,
            "item_id": item_id_db,
            "nome_cliente": pedido.nome_cliente,
            "cpf_cliente": pedido.cpf_cliente,
            "email_cliente": pedido.email_cliente,
            "valor_total": valor_total,
            "metodo_pagamento": pedido.metodo_pagamento,
            "status_pagamento": "aguardando"
        }
        
        # Insere na nova tabela unificada que criámos
        supabase.table("pedidos").insert(pedido_db).execute()

        # ==========================================
        # FASE 3: COMUNICAÇÃO COM PAGBANK
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
                    "name": nome_item_checkout,
                    "quantity": 1,
                    "unit_amount": int(valor_total * 100)
                }
            ],
            "notification_urls": [
                "https://seu-backend.railway.app/api/v1/webhooks/pagbank"
            ]
        }

        if pedido.metodo_pagamento.lower() == "pix":
            payload_pagbank["qr_codes"] = [{"amount": {"value": int(valor_total * 100)}}]
            if splits_array:
                payload_pagbank["qr_codes"][0]["splits"] = splits_array

        elif pedido.metodo_pagamento.lower() == "cartao":
            if not pedido.encrypted_card:
                raise HTTPException(status_code=400, detail="Cartão criptografado em falta.")
                
            charge_block = {
                "reference_id": codigo_pedido,
                "description": nome_item_checkout,
                "amount": {"value": int(valor_total * 100), "currency": "BRL"},
                "payment_method": {
                    "type": "CREDIT_CARD",
                    "installments": pedido.parcelas,
                    "capture": True,
                    "card": {"encrypted": pedido.encrypted_card},
                    "holder": {
                        "name": pedido.nome_cliente,
                        "tax_id": pedido.cpf_cliente.replace(".", "").replace("-", "")
                    }
                }
            }
            if splits_array:
                charge_block["splits"] = splits_array
                
            payload_pagbank["charges"] = [charge_block]

        headers = {
            "Authorization": f"Bearer {PAGBANK_TOKEN}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        URL_PAGBANK = "https://sandbox.api.pagseguro.com/orders" 

        async with httpx.AsyncClient() as client:
            resposta = await client.post(URL_PAGBANK, json=payload_pagbank, headers=headers, timeout=30.0)
            dados_pagbank = resposta.json()

            if resposta.status_code not in [200, 201]:
                print("Erro PagBank:", dados_pagbank)
                raise HTTPException(status_code=400, detail="Pagamento recusado pela operadora.")

            if pedido.metodo_pagamento == "pix":
                qr_code_info = dados_pagbank.get("qr_codes", [{}])[0]
                links = qr_code_info.get("links", [])
                return {
                    "sucesso": True,
                    "metodo": "pix",
                    "codigo_pedido": codigo_pedido,
                    "pix_qrcode_img": next((l.get("href", "") for l in links if l.get("rel") == "QRCODE.PNG"), ""),
                    "pix_copia_cola": qr_code_info.get("text", "")
                }
                
            elif pedido.metodo_pagamento == "cartao":
                return {
                    "sucesso": True,
                    "metodo": "cartao",
                    "codigo_pedido": codigo_pedido,
                    "status_pagamento": dados_pagbank["charges"][0]["status"]
                }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro fatal ao processar pagamento: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")