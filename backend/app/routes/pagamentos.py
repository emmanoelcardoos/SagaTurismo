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
    region_code: str
    country: str = "BRA"
    postal_code: str

class PedidoPagamento(BaseModel):
    tipo_item: str # 'carteira', 'hotel', 'pacote' ou 'passeio'
    quantidade: Optional[int] = 1 
    adultos: Optional[int] = 2 

    # IDs dinâmicos
    pacote_id: Optional[str] = None # Serve de mapeamento para id do passeio avulso também
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
    metodo_pagamento: str
    encrypted_card: Optional[str] = None
    parcelas: Optional[int] = 1

# ── FUNÇÃO AUXILIAR INTERNA: CALCULAR PREÇO DO HOTEL NOITE POR NOITE COM REVENUE MANAGEMENT ──
def calcular_preco_hotel_dinamico(hotel_id: str, tipo_quarto: str, checkin_str: str, checkout_str: str, quantidade_quartos: int = 1, quantidade_pessoas: int = 2) -> float:
    res_h = supabase.table("hoteis").select("*").eq("id", hotel_id).single().execute()
    if not res_h.data:
        raise HTTPException(status_code=404, detail="Alojamento não encontrado.")
    
    hotel_data = res_h.data
    base_preco = float(hotel_data["quarto_luxo_preco"] if tipo_quarto == 'luxo' else hotel_data["quarto_standard_preco"])
    pct_acompanhante = float(hotel_data.get("porcentagem_acompanhante") or 0.0)
    
    res_custom = supabase.table("disponibilidade_hoteis") \
        .select("*") \
        .eq("hotel_id", hotel_id) \
        .eq("tipo_quarto", tipo_quarto) \
        .order("criado_em", desc=True) \
        .execute()
        
    excecoes_calendario = res_custom.data or []
    
    d_atual = datetime.strptime(checkin_str, "%Y-%m-%d").date()
    d_fim = datetime.strptime(checkout_str, "%Y-%m-%d").date()
    
    acompanhantes = quantidade_pessoas - quantidade_quartos
    if acompanhantes < 0: acompanhantes = 0
    
    subtotal_hospedagem = 0.0
    
    while d_atual < d_fim:
        preco_da_noite = None
        for CircleRegra in excecoes_calendario:
            regra_inicio_raw = str(CircleRegra["data_inicio"]).split("T")[0]
            regra_fim_raw = str(CircleRegra["data_fim"]).split("T")[0]
            
            regra_inicio = datetime.strptime(regra_inicio_raw, "%Y-%m-%d").date()
            regra_fim = datetime.strptime(regra_fim_raw, "%Y-%m-%d").date()
            
            if regra_inicio <= d_atual <= regra_fim:
                if not CircleRegra.get("disponivel", True):
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Pedimos desculpa, mas a acomodação está esgotada para a data de {d_atual.strftime('%d/%m/%Y')}."
                    )
                preco_da_noite = float(CircleRegra["preco"])
                break
        
        preco_quarto_noite = preco_da_noite if preco_da_noite is not None else base_preco
        valor_noite = (preco_quarto_noite * quantidade_quartos) + (preco_quarto_noite * (pct_acompanhante / 100.0) * acompanhantes)
        subtotal_hospedagem += valor_noite
        
        d_atual += timedelta(days=1)
        
    return subtotal_hospedagem


@router.post("/api/v1/pagamentos/processar")
async def processar_pagamento(pedido: PedidoPagamento):
    try:
        valor_total = 0.0
        recebedores_split = []
        splits_array = []
        nome_item_checkout = ""
        item_id_db = None
        
        codigo_pedido = f"SAGA-{uuid.uuid4().hex[:8].upper()}"

        tax_id_limpo = pedido.cpf_cliente.replace(".", "").replace("-", "")
        telefone_limpo = pedido.telefone_cliente.replace("(", "").replace(")", "").replace("-", "").replace(" ", "")
        ddd = telefone_limpo[:2]
        numero_tel = telefone_limpo[2:]

        taxa_prefeitura_pct = 0.0
        res_taxa = supabase.table("taxas_servicos").select("porcentagem").eq("tipo_servico", pedido.tipo_item).execute()
        if res_taxa.data:
            taxa_prefeitura_pct = float(res_taxa.data[0]["porcentagem"])

        fator_liquido = 1.0 - (taxa_prefeitura_pct / 100.0)

        # Variáveis internas para armazenamento do Ledger
        v_hospedagem_total = 0.0
        v_guia_total = 0.0
        lista_atracoes_calculadas = []

        # ==========================================
        # FASE 1: LÓGICA DE PRECIFICAÇÃO E REPASSES
        # ==========================================
        
        if pedido.tipo_item == "carteira":
            valor_total = 10.00 * pedido.quantidade
            nome_item_checkout = f"Taxa de Emissão - Carteira Digital ({pedido.quantidade}x)"

        elif pedido.tipo_item == "hotel":
            valor_total = calcular_preco_hotel_dinamico(
                pedido.hotel_id, pedido.tipo_quarto, pedido.data_checkin, pedido.data_checkout,
                quantidade_quartos=pedido.quantidade, quantidade_pessoas=pedido.adultos
            )
            v_hospedagem_total = valor_total
            
            res_hotel_info = supabase.table("hoteis").select("nome, pagbank_recebedor_id").eq("id", pedido.hotel_id).single().execute()
            nome_item_checkout = f"Hospedagem - {res_hotel_info.data['nome']}"
            item_id_db = pedido.hotel_id
            
            rec_id = res_hotel_info.data.get("pagbank_recebedor_id")
            if rec_id and str(rec_id).startswith("ACC_"):
                recebedores_split.append({
                    "account": {"id": rec_id},
                    "amount": {"value": int((valor_total * fator_liquido) * 100)}
                })

        # ◄── BLINDAGEM ADICIONADA: AGORA PROCESSA CORRETAMENTE OS PASSEIOS AVULSOS
        elif pedido.tipo_item == "passeio":
            id_passeio = pedido.pacote_id or pedido.hotel_id # Captura de segurança do ID do roteiro
            res_passeio = supabase.table("passeios").select("*").eq("id", id_passeio).single().execute()
            if not res_passeio.data:
                raise HTTPException(status_code=404, detail="Passeio turístico não encontrado no catálogo.")
            
            dados_p = res_passeio.data
            valor_total = float(dados_p.get("valor_total", 0.0)) * (pedido.quantidade or 1)
            v_guia_total = valor_total
            nome_item_checkout = f"Passeio: {dados_p.get('titulo')}"
            item_id_db = id_passeio

            # Localiza o ID do recebedor PagBank do Guia associado
            guia_proprietario_id = dados_p.get("guia_id")
            if guia_proprietario_id:
                res_g = supabase.table("parceiros").select("pagbank_recebedor_id").eq("id", guia_proprietario_id).single().execute()
                if res_g.data:
                    rec_id = res_g.data.get("pagbank_recebedor_id")
                    if rec_id and str(rec_id).startswith("ACC_"):
                        recebedores_split.append({
                            "account": {"id": rec_id},
                            "amount": {"value": int((valor_total * fator_liquido) * 100)}
                        })

        elif pedido.tipo_item == "pacote":
            res_pacote = supabase.table("pacotes").select("*").eq("id", pedido.pacote_id).single().execute()
            if not res_pacote.data: 
                raise HTTPException(status_code=404, detail="Pacote não encontrado")
            
            nome_item_checkout = f"Pacote: {res_pacote.data.get('titulo', 'Turístico')}"
            if pedido.pacote_id and str(pedido.pacote_id).lower() not in ["none", "null"]:
                item_id_db = pedido.pacote_id

            v_atracoes_total = 0.0

            # 1. Split Dinâmico do Hotel no Pacote com Revenue Management
            if pedido.hotel_id:
                v_hospedagem_total = calcular_preco_hotel_dinamico(
                    pedido.hotel_id, pedido.tipo_quarto, pedido.data_checkin, pedido.data_checkout,
                    quantidade_quartos=pedido.quantidade, quantidade_pessoas=pedido.adultos
                )
                
                res_h_info = supabase.table("hoteis").select("pagbank_recebedor_id").eq("id", pedido.hotel_id).single().execute()
                rec_id = res_h_info.data.get("pagbank_recebedor_id") if res_h_info.data else None
                if rec_id and str(rec_id).startswith("ACC_"):
                    recebedores_split.append({
                        "account": {"id": rec_id},
                        "amount": {"value": int((v_hospedagem_total * fator_liquido) * 100)}
                    })

            # Cálculo do número de noites exato para o Guia
            d_ci = datetime.strptime(pedido.data_checkin, "%Y-%m-%d")
            d_co = datetime.strptime(pedido.data_checkout, "%Y-%m-%d")
            noites_calculadas = (d_co - d_ci).days
            noites_finais = noites_calculadas if noites_calculadas > 0 else 1

            # 2. Split do Guia de Turismo
            if pedido.guia_id:
                res_g = supabase.table("guias").select("pagbank_recebedor_id, preco_diaria").eq("id", pedido.guia_id).single().execute()
                if res_g.data:
                    v_guia_total = float(res_g.data["preco_diaria"]) * (noites_finais + 1)
                    rec_id = res_g.data.get("pagbank_recebedor_id")
                    if rec_id and str(rec_id).startswith("ACC_"):
                        recebedores_split.append({
                            "account": {"id": rec_id},
                            "amount": {"value": int((v_guia_total * fator_liquido) * 100)}
                        })

            # 3. Split das Atrações Turísticas inclusas
            res_itens = supabase.table("pacote_itens").select("atracao_id").eq("pacote_id", pedido.pacote_id).execute()
            for item in res_itens.data:
                atr_id = item.get("atracao_id")
                if atr_id:
                    res_atr = supabase.table("atracoes").select("pagbank_recebedor_id, preco_entrada").eq("id", atr_id).single().execute()
                    if res_atr.data:
                        v_individual_atr = float(res_atr.data["preco_entrada"]) * pedido.adultos
                        v_atracoes_total += v_individual_atr
                        
                        rec_id = res_atr.data.get("pagbank_recebedor_id")
                        if rec_id and str(rec_id).startswith("ACC_"):
                            recebedores_split.append({
                                "account": {"id": rec_id},
                                "amount": {"value": int((v_individual_atr * fator_liquido) * 100)}
                            })
                        lista_atracoes_calculadas.append({"id": atr_id, "valor": v_individual_atr})

            valor_total = v_hospedagem_total + v_guia_total + v_atracoes_total

        # ==========================================
        # FASE 2: VALIDAÇÃO DA REGRA DE NEGÓCIO DO SPLIT
        # ==========================================
        soma_splits_centavos = sum(r["amount"]["value"] for r in recebedores_split)
        valor_total_centavos = int(valor_total * 100)

        if recebedores_split and (soma_splits_centavos < valor_total_centavos):
            splits_array = [{
                "method": "FIXED",
                "receivers": recebedores_split
            }]
        else:
            splits_array = []

        # ==========================================
        # FASE 3: PERSISTÊNCIA NO SUPABASE
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
            "quantidade": pedido.quantidade,
            "hotel_id": pedido.hotel_id if pedido.hotel_id else None,
            "guia_id": pedido.guia_id if pedido.guia_id else None,
            "tipo_quarto": pedido.tipo_quarto if pedido.tipo_quarto else "standard",
            "quantidade_pessoas": pedido.adultos if pedido.adultos else 2,
            "quantidade_quartos": pedido.quantidade if pedido.tipo_item in ["hotel", "pacote"] else 1,
            "nome_item": nome_item_checkout
        }
        
        if item_id_db:
            pedido_db["item_id"] = item_id_db

        res_pedido = supabase.table("pedidos").insert(pedido_db).execute()

        # ── ESCRITA DO LEDGER IMUTÁVEL DE REPASSES FINANCEIROS ──
        if res_pedido.data:
            pedido_id_gerado = res_pedido.data[0]["id"]
            repasses_db = []
            
            if pedido.tipo_item == "hotel" and pedido.hotel_id:
                repasses_db.append({
                    "pedido_id": pedido_id_gerado,
                    "parceiro_id": pedido.hotel_id,
                    "tipo_parceiro": "hotel",
                    "valor_bruto": v_hospedagem_total,
                    "taxa_plataforma": round(v_hospedagem_total * (taxa_prefeitura_pct / 100.0), 2),
                    "valor_liquido": round(v_hospedagem_total * fator_liquido, 2),
                    "status_repasse": "processando"
                })
            
            # Repasse do Guia de passeio avulso salvaguardado no Ledger
            elif pedido.tipo_item == "passeio" and item_id_db:
                # Localiza qual parceiro é o detentor do roteiro
                res_pass_g = supabase.table("passeios").select("guia_id").eq("id", item_id_db).single().execute()
                g_id = res_pass_g.data.get("guia_id") if res_pass_g.data else pedido.guia_id
                
                repasses_db.append({
                    "pedido_id": pedido_id_gerado,
                    "parceiro_id": g_id,
                    "tipo_parceiro": "guia",
                    "valor_bruto": v_guia_total,
                    "taxa_plataforma": round(v_guia_total * (taxa_prefeitura_pct / 100.0), 2),
                    "valor_liquido": round(v_guia_total * fator_liquido, 2),
                    "status_repasse": "processando"
                })
            
            elif pedido.tipo_item == "pacote":
                if pedido.hotel_id and v_hospedagem_total > 0:
                    repasses_db.append({
                        "pedido_id": pedido_id_gerado,
                        "parceiro_id": pedido.hotel_id,
                        "tipo_parceiro": "hotel",
                        "valor_bruto": v_hospedagem_total,
                        "taxa_plataforma": round(v_hospedagem_total * (taxa_prefeitura_pct / 100.0), 2),
                        "valor_liquido": round(v_hospedagem_total * fator_liquido, 2),
                        "status_repasse": "processando"
                    })
                if pedido.guia_id and v_guia_total > 0:
                    repasses_db.append({
                        "pedido_id": pedido_id_gerado,
                        "parceiro_id": pedido.guia_id,
                        "tipo_parceiro": "guia",
                        "valor_bruto": v_guia_total,
                        "taxa_plataforma": round(v_guia_total * (taxa_prefeitura_pct / 100.0), 2),
                        "valor_liquido": round(v_guia_total * fator_liquido, 2),
                        "status_repasse": "processando"
                    })
                for atr in lista_atracoes_calculadas:
                    if atr["valor"] > 0:
                        repasses_db.append({
                            "pedido_id": pedido_id_gerado,
                            "parceiro_id": atr["id"],
                            "tipo_parceiro": "atracao",
                            "valor_bruto": atr["valor"],
                            "taxa_plataforma": round(atr["valor"] * (taxa_prefeitura_pct / 100.0), 2),
                            "valor_liquido": round(atr["valor"] * fator_liquido, 2),
                            "status_repasse": "processando"
                        })
            
            if repasses_db:
                supabase.table("repasses_financeiros").insert(repasses_db).execute()

        # ==========================================
        # FASE 4: PAYLOAD PAGBANK
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