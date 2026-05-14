from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import os
import uuid
from datetime import datetime
from supabase import create_client, Client

router = APIRouter()

# 1. Configurações de Ambiente
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
PAGBANK_TOKEN = os.environ.get("PAGBANK_TOKEN")
CHAVE_PAGBANK_PREFEITURA = os.environ.get("CHAVE_PAGBANK_PREFEITURA") # A "Conta Mãe"
PAGBANK_API_URL = os.environ.get("PAGBANK_API_URL", "https://sandbox.api.pagseguro.com")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 2. O Modelo de Dados Unificado Completo
class PedidoPagamento(BaseModel):
    tipo_item: str # 'carteira', 'hotel' ou 'pacote'
    quantidade: Optional[int] = 1 # Usado para número de carteiras ou número de quartos

    # IDs dinâmicos
    pacote_id: Optional[str] = None
    hotel_id: Optional[str] = None
    tipo_quarto: Optional[str] = "standard"
    guia_id: Optional[str] = None
    
    # Dados Específicos para Hotel
    data_checkin: Optional[str] = None
    data_checkout: Optional[str] = None
    endereco_completo: Optional[str] = None
    
    # Dados Específicos para Carteirinha
    foto_url: Optional[str] = None
    data_nascimento: Optional[str] = None
    telefone_cliente: Optional[str] = None
    
    # Dados do Cidadão/Turista (Comuns)
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
            valor_total = 10.00 * pedido.quantidade # Multiplica por 10 reais
            nome_item_checkout = f"Taxa de Emissão - Carteira Digital ({pedido.quantidade}x)"
            item_id_db = None

        # --- CENÁRIO B: HOTEL AVULSO ---
        elif pedido.tipo_item == "hotel":
            if not all([pedido.hotel_id, pedido.data_checkin, pedido.data_checkout]):
                raise HTTPException(status_code=400, detail="Dados de reserva de hotel incompletos.")
                
            res_hotel = supabase.table("hoteis").select("*").eq("id", pedido.hotel_id).single().execute()
            if not res_hotel.data:
                raise HTTPException(status_code=404, detail="Hotel não encontrado.")
            
            # Cálculo de Noites
            d1 = datetime.strptime(pedido.data_checkin, "%Y-%m-%d")
            d2 = datetime.strptime(pedido.data_checkout, "%Y-%m-%d")
            quantidade_noites = (d2 - d1).days
            if quantidade_noites <= 0:
                raise HTTPException(status_code=400, detail="A data de checkout deve ser posterior ao checkin.")
                
            hotel_data = res_hotel.data
            preco_diaria = float(hotel_data["quarto_luxo_preco"] if pedido.tipo_quarto == 'luxo' else hotel_data["quarto_standard_preco"])
            
            # Valor Total = Diária * Noites * Quartos (quantidade)
            valor_total = preco_diaria * quantidade_noites * pedido.quantidade
            nome_item_checkout = f"Hospedagem - {hotel_data['nome']} ({quantidade_noites} noites)"
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
        
        pedido_db = {
            "codigo_pedido": codigo_pedido,
            "tipo_item": pedido.tipo_item,
            "quantidade": pedido.quantidade,
            "item_id": item_id_db,
            "nome_cliente": pedido.nome_cliente,
            "cpf_cliente": pedido.cpf_cliente,
            "email_cliente": pedido.email_cliente,
            "valor_total": valor_total,
            "metodo_pagamento": pedido.metodo_pagamento,
            "status_pagamento": "aguardando",
            # Novos campos que o Frontend agora envia
            "data_checkin": pedido.data_checkin,
            "data_checkout": pedido.data_checkout,
            "endereco_completo": pedido.endereco_completo,
            "telefone_cliente": pedido.telefone_cliente,
            "data_nascimento": pedido.data_nascimento,
            "foto_url": pedido.foto_url
        }
        
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
        
        URL_PAGBANK = f"{PAGBANK_API_URL}/orders"

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