from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
import httpx
import os
import uuid
from datetime import datetime, timedelta
from supabase import create_client, Client

router = APIRouter()

# 1. Configurações de Ambiente
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
PAGBANK_TOKEN = os.environ.get("PAGBANK_TOKEN")
PAGBANK_API_URL = os.environ.get("PAGBANK_API_URL", "https://sandbox.api.pagseguro.com")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Modelo para o Endereço (Requisito PagBank para Cartão/Antifraude)
class EnderecoFaturacao(BaseModel):
    street: str
    number: str
    complement: Optional[str] = None
    locality: str
    city: str
    region_code: str # Ex: PA, TO, SP
    country: str = "BRA"
    postal_code: str

class PedidoPagamento(BaseModel):
    tipo_item: str # 'carteira', 'hotel', 'pacote' ou 'passeio'
    quantidade: Optional[int] = 1 

    # IDs dinâmicos
    pacote_id: Optional[str] = None
    hotel_id: Optional[str] = None
    tipo_quarto: Optional[str] = "standard"
    guia_id: Optional[str] = None
    
    # Dados de Reserva
    data_checkin: Optional[str] = None
    data_checkout: Optional[str] = None
    
    # Dados do Cidadão + Compliance
    nome_cliente: str
    cpf_cliente: str
    email_cliente: str
    telefone_cliente: str 
    endereco_faturacao: EnderecoFaturacao 
    
    # Dados Específicos Adicionais
    foto_url: Optional[str] = None
    data_nascimento: Optional[str] = None
    
    # Pagamento
    metodo_pagamento: str # "pix" ou "cartao"
    encrypted_card: Optional[str] = None
    parcelas: Optional[int] = 1

# ── FUNÇÃO AUXILIAR INTERNA: CALCULAR PREÇO DO HOTEL NOITE POR NOITE ──
def calcular_preco_hotel_dinamico(hotel_id: str, tipo_quarto: str, checkin_str: str, checkout_str: str) -> float:
    """
    Verifica noite por noite se existem exceções de preços ou bloqueios na agenda 
    dentro da tabela 'disponibilidade_hoteis'. Se não existirem, usa a tarifa base do hotel.
    """
    # 1. Procurar as tarifas base do hotel
    res_h = supabase.table("hoteis").select("*").eq("id", hotel_id).single().execute()
    if not res_h.data:
        raise HTTPException(status_code=404, detail="Alojamento não encontrado.")
    
    hotel_data = res_h.data
    base_preco = float(hotel_data["quarto_luxo_preco"] if tipo_quarto == 'luxo' else hotel_data["quarto_standard_preco"])
    
    # 2. Busca TODAS as regras deste quarto ORDENADAS PELA MAIS RECENTE
    res_custom = supabase.table("disponibilidade_hoteis") \
        .select("*") \
        .eq("hotel_id", hotel_id) \
        .eq("tipo_quarto", tipo_quarto) \
        .order("criado_em", desc=True) \
        .execute()
        
    excecoes_calendario = res_custom.data or []
    
    # Convertemos as strings em objetos de data para fazer matemática de dias
    d_atual = datetime.strptime(checkin_str, "%Y-%m-%d").date()
    d_fim = datetime.strptime(checkout_str, "%Y-%m-%d").date()
    
    subtotal_hospedagem = 0.0
    
    # Loop que avalia cada noite individualmente antes do checkout
    while d_atual < d_fim:
        preco_da_noite = None
        
        # Verifica se o dia corrente coincide com algum intervalo customizado do empresário
        for regra in excecoes_calendario:
            # Limpeza do fuso horário que vem do banco de dados ("YYYY-MM-DDT...")
            regra_inicio_raw = str(regra["data_inicio"]).split("T")[0]
            regra_fim_raw = str(regra["data_fim"]).split("T")[0]
            
            regra_inicio = datetime.strptime(regra_inicio_raw, "%Y-%m-%d").date()
            regra_fim = datetime.strptime(regra_fim_raw, "%Y-%m-%d").date()
            
            if regra_inicio <= d_atual <= regra_fim:
                # Regra de Segurança: Se estiver bloqueado (disponivel = false), barramos o checkout
                if not regra.get("disponivel", True):
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Pedimos desculpa, mas a acomodação está esgotada para a data de {d_atual.strftime('%d/%m/%Y')}."
                    )
                preco_da_noite = float(regra["preco"])
                break # Encontrou a regra mais recente para este dia, sai do loop interno
        
        # Se encontrou uma regra customizada usa-a, senão cai na tarifa padrão do hotel
        if preco_da_noite is not None:
            subtotal_hospedagem += preco_da_noite
        else:
            subtotal_hospedagem += base_preco
            
        d_atual += timedelta(days=1)
        
    return subtotal_hospedagem


@router.post("/api/v1/pagamentos/processar")
async def processar_pagamento(pedido: PedidoPagamento):
    try:
        valor_total = 0.0
        splits_array = []
        nome_item_checkout = ""
        item_id_db = None
        
        codigo_pedido = f"SAGA-{uuid.uuid4().hex[:8].upper()}"

        # Limpeza de dados para o PagBank
        tax_id_limpo = pedido.cpf_cliente.replace(".", "").replace("-", "")
        telefone_limpo = pedido.telefone_cliente.replace("(", "").replace(")", "").replace("-", "").replace(" ", "")
        ddd = telefone_limpo[:2]
        numero_tel = telefone_limpo[2:]

        # ==========================================
        # BUSCA DA TAXA DINÂMICA DA PREFEITURA
        # ==========================================
        taxa_prefeitura_pct = 0.0
        res_taxa = supabase.table("taxas_servicos").select("porcentagem").eq("tipo_servico", pedido.tipo_item).execute()
        if res_taxa.data:
            taxa_prefeitura_pct = float(res_taxa.data[0]["porcentagem"])

        fator_liquido = 1.0 - (taxa_prefeitura_pct / 100.0)

        # ==========================================
        # FASE 1: LÓGICA DE PRECIFICAÇÃO E REPASSES (AGORA DINÂMICA!)
        # ==========================================
        
        if pedido.tipo_item == "carteira":
            valor_total = 10.00 * pedido.quantidade
            nome_item_checkout = f"Taxa de Emissão - Carteira Digital ({pedido.quantidade}x)"

        elif pedido.tipo_item == "hotel":
            # ◄── CHAMA O MOTOR DINÂMICO DA DIÁRIA NOITE POR NOITE
            v_diarias_calculado = calcular_preco_hotel_dinamico(
                pedido.hotel_id, pedido.tipo_quarto, pedido.data_checkin, pedido.data_checkout
            )
            
            valor_total = v_diarias_calculado * pedido.quantidade
            
            res_hotel_info = supabase.table("hoteis").select("nome, pagbank_recebedor_id").eq("id", pedido.hotel_id).single().execute()
            nome_item_checkout = f"Hospedagem - {res_hotel_info.data['nome']}"
            item_id_db = pedido.hotel_id
            
            # Repasse Automático Líquido baseado nas regras encontradas
            if res_hotel_info.data.get("pagbank_recebedor_id"):
                valor_parceiro_liquido = valor_total * fator_liquido
                splits_array.append({
                    "method": "FIXED",
                    "receivers": [{"account": {"id": res_hotel_info.data["pagbank_recebedor_id"]}, "amount": {"value": int(valor_parceiro_liquido * 100)}}]
                })

        elif pedido.tipo_item == "pacote":
            res_pacote = supabase.table("pacotes").select("*").eq("id", pedido.pacote_id).single().execute()
            if not res_pacote.data: 
                raise HTTPException(status_code=404, detail="Pacote não encontrado")
            
            pacote_info = res_pacote.data
            valor_total = float(pacote_info.get("preco") or 0)
            nome_item_checkout = f"Pacote: {pacote_info.get('titulo', 'Turístico')}"
            
            if pedido.pacote_id and str(pedido.pacote_id).lower() not in ["none", "null"]:
                item_id_db = pedido.pacote_id

            # 1. Repasse Inteligente para o Hotel se ele estiver inserido dentro de um pacote
            if pedido.hotel_id:
                res_h_info = supabase.table("hoteis").select("pagbank_recebedor_id").eq("id", pedido.hotel_id).single().execute()
                if res_h_info.data and res_h_info.data.get("pagbank_recebedor_id"):
                    # ◄── Também calcula o repasse do hotel usando o calendário se estiver em pacote
                    v_hotel_dinamico = calcular_preco_hotel_dinamico(
                        pedido.hotel_id, pedido.tipo_quarto, pedido.data_checkin, pedido.data_checkout
                    )
                    v_hotel = v_hotel_dinamico * pedido.quantidade
                    v_hotel_liquido = v_hotel * fator_liquido
                    splits_array.append({
                        "method": "FIXED",
                        "receivers": [{"account": {"id": res_h_info.data["pagbank_recebedor_id"]}, "amount": {"value": int(v_hotel_liquido * 100)}}]
                    })

            # 2. Repasse para o Guia (se incluído no pacote)
            if pedido.guia_id:
                res_g = supabase.table("guias").select("pagbank_recebedor_id, preco_diaria").eq("id", pedido.guia_id).single().execute()
                if res_g.data and res_g.data.get("pagbank_recebedor_id"):
                    v_guia = float(res_g.data["preco_diaria"])
                    v_guia_liquido = v_guia * fator_liquido
                    splits_array.append({
                        "method": "FIXED",
                        "receivers": [{"account": {"id": res_g.data["pagbank_recebedor_id"]}, "amount": {"value": int(v_guia_liquido * 100)}}]
                    })

            # 3. Repasse para as Atrações/Parques
            res_itens = supabase.table("pacote_itens").select("atracao_id").eq("pacote_id", pedido.pacote_id).execute()
            for item in res_itens.data:
                atr_id = item.get("atracao_id")
                if atr_id:
                    res_atr = supabase.table("atracoes").select("pagbank_recebedor_id, preco_entrada").eq("id", atr_id).single().execute()
                    if res_atr.data and res_atr.data.get("pagbank_recebedor_id"):
                        v_atr = float(res_atr.data["preco_entrada"])
                        v_atr_liquido = v_atr * fator_liquido
                        splits_array.append({
                            "method": "FIXED",
                            "receivers": [{"account": {"id": res_atr.data["pagbank_recebedor_id"]}, "amount": {"value": int(v_atr_liquido * 100)}}]
                        })

        # ==========================================
        # FASE 2: PERSISTÊNCIA NO SUPABASE
        # ==========================================
        pedido_db = {
            "codigo_pedido": codigo_pedido,
            "tipo_item": pedido.tipo_item,
            "nome_cliente": pedido.nome_cliente,
            "cpf_cliente": pedido.cpf_cliente,
            "email_cliente": pedido.email_cliente,
            "telefone_cliente": pedido.telefone_cliente,
            "valor_total": valor_total,
            "status_pagamento": "aguardando",
            "metodo_pagamento": pedido.metodo_pagamento,
            "data_checkin": pedido.data_checkin,
            "data_checkout": pedido.data_checkout,
            "data_nascimento": pedido.data_nascimento,
            "foto_url": pedido.foto_url,
            "quantidade": pedido.quantidade
        }
        
        if item_id_db:
            pedido_db["item_id"] = item_id_db

        supabase.table("pedidos").insert(pedido_db).execute()

        # ==========================================
        # FASE 3: PAYLOAD PAGBANK (USANDO O SPLITS_ARRAY)
        # ==========================================
        payload_pagbank = {
            "reference_id": codigo_pedido,
            "customer": {
                "name": pedido.nome_cliente,
                "email": pedido.email_cliente,
                "tax_id": tax_id_limpo,
                "phones": [{"country": "55", "area": ddd, "number": numero_tel, "type": "MOBILE"}]
            },
            "items": [{"name": nome_item_checkout, "quantity": 1, "unit_amount": int(valor_total * 100)}],
            "notification_urls": ["https://sagaturismo-production.up.railway.app/api/v1/webhooks/pagbank"]
        }

        if pedido.metodo_pagamento == "pix":
            payload_pagbank["qr_codes"] = [{"amount": {"value": int(valor_total * 100)}}]
            if splits_array: 
                payload_pagbank["qr_codes"][0]["splits"] = splits_array
        else:
            charge = {
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
                        "tax_id": tax_id_limpo,
                        "address": pedido.endereco_faturacao.dict()
                    }
                }
            }
            if splits_array: 
                charge["splits"] = splits_array
            payload_pagbank["charges"] = [charge]

        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {PAGBANK_TOKEN}", "Content-Type": "application/json"}
            resp = await client.post(f"{PAGBANK_API_URL}/orders", json=payload_pagbank, headers=headers, timeout=30.0)
            
            if resp.status_code not in [200, 201]:
                print(f"Erro PagBank Detalhado: {resp.json()}")
                raise HTTPException(status_code=400, detail="Erro no processamento financeiro.")

            dados_pb = resp.json()
            base_retorno = {"sucesso": True, "codigo_pedido": codigo_pedido}
            
            if pedido.metodo_pagamento == "pix":
                qr = dados_pb["qr_codes"][0]
                link_qr = next((l["href"] for l in qr["links"] if l["rel"] == "QRCODE.PNG"), qr["links"][0]["href"])
                base_retorno.update({
                    "metodo": "pix",
                    "pix_qrcode_img": link_qr,
                    "pix_copia_cola": qr["text"]
                })
            else:
                base_retorno.update({
                    "metodo": "cartao",
                    "status_pagamento": dados_pb["charges"][0]["status"]
                })
            
            return base_retorno

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"Erro: {e}")
        raise HTTPException(status_code=500, detail=str(e))