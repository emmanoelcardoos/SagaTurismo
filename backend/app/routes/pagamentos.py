from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List
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

class EnderecoFaturacao(BaseModel):
    street: str
    number: str
    complement: Optional[str] = None
    locality: str
    city: str
    region_code: str
    country: str = "BRA"
    postal_code: str

class AcompanhanteSchema(BaseModel):
    nome: str
    cpf: Optional[str] = None
    data_nascimento: Optional[str] = None

class PedidoPagamento(BaseModel):
    tipo_item: str
    quantidade: Optional[int] = 1 
    adultos: Optional[int] = 2 

    pacote_id: Optional[str] = None 
    hotel_id: Optional[str] = None
    passeio_id: Optional[str] = None 
    item_id: Optional[str] = None

    token_id: Optional[str] = None
    
    quarto_tipo_id: Optional[str] = None 
    tipo_quarto: Optional[str] = "standard"
    guia_id: Optional[str] = None
    
    data_checkin: Optional[str] = None
    data_checkout: Optional[str] = None
    
    nome_cliente: str
    cpf_cliente: str
    email_cliente: str
    telefone_cliente: str 
    endereco_faturacao: EnderecoFaturacao 
    
    foto_url: Optional[str] = None
    data_nascimento: Optional[str] = None
    
    metodo_pagamento: str
    encrypted_card: Optional[str] = None
    parcelas: Optional[int] = 1

    hospedes_extras: Optional[List[AcompanhanteSchema]] = []

def calcular_preco_hotel_dinamico(hotel_id: str, quarto_tipo_id: str, checkin_str: str, checkout_str: str, quantidade_quartos: int = 1, quantidade_pessoas: int = 2) -> float:
    res_h = supabase.table("hoteis").select("*").eq("id", hotel_id).single().execute()
    if not res_h.data:
        raise HTTPException(status_code=404, detail="Alojamento não encontrado.")
        
    res_q = supabase.table("tipos_quarto").select("*").eq("id", quarto_tipo_id).single().execute()
    if not res_q.data:
        raise HTTPException(status_code=404, detail="Tipo de quarto não configurado para este hotel.")
    
    hotel_data = res_h.data
    quarto_data = res_q.data
    
    base_preco = float(quarto_data["preco_quarto"])
    pct_acompanhante = float(hotel_data.get("porcentagem_acompanhante") or 0.0)
    
    res_custom = supabase.table("disponibilidade_hoteis") \
        .select("*") \
        .eq("hotel_id", hotel_id) \
        .eq("quarto_tipo_id", quarto_tipo_id) \
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
        for regra in excecoes_calendario:
            regra_inicio_raw = str(regra["data_inicio"]).split("T")[0]
            regra_fim_raw = str(regra["data_fim"]).split("T")[0]
            
            regra_inicio = datetime.strptime(regra_inicio_raw, "%Y-%m-%d").date()
            regra_fim = datetime.strptime(regra_fim_raw, "%Y-%m-%d").date()
            
            if regra_inicio <= d_atual <= regra_fim:
                if not regra.get("disponivel", True):
                    raise HTTPException(status_code=400, detail=f"A acomodação está esgotada para a data de {d_atual.strftime('%d/%m/%Y')}.")
                preco_da_noite = float(regra["preco"])
                break
        
        preco_quarto_noite = preco_da_noite if preco_da_noite is not None else base_preco
        valor_noite = (preco_quarto_noite * quantidade_quartos) + (preco_quarto_noite * (pct_acompanhante / 100.0) * acompanhantes)
        subtotal_hospedagem += valor_noite
        d_atual += timedelta(days=1)
        
    return subtotal_hospedagem

@router.post("/api/v1/pagamentos/processar")
async def processar_pagamento(pedido: PedidoPagamento):
    try:
        def limpar_uuid(valor: Optional[str]) -> Optional[str]:
            if not valor: return None
            v_str = str(valor).strip()
            if v_str.lower() in ["none", "null", "", "undefined", "false"]: return None
            return v_str

        hotel_id_sanitizado = limpar_uuid(pedido.hotel_id)
        guia_id_sanitizado = limpar_uuid(pedido.guia_id)
        pacote_id_sanitizado = limpar_uuid(pedido.pacote_id)
        passeio_id_sanitizado = limpar_uuid(pedido.passeio_id)
        item_id_sanitizado = limpar_uuid(pedido.item_id)
        quarto_tipo_id_sanitizado = limpar_uuid(pedido.quarto_tipo_id)

        # SALVA-VIDAS DA DEMONSTRAÇÃO E RESOLUÇÃO DE IDENTIDADE DO QUARTO
        if not quarto_tipo_id_sanitizado and hotel_id_sanitizado:
            if pedido.tipo_quarto:
                res_fb = supabase.table("tipos_quarto").select("id").eq("hotel_id", hotel_id_sanitizado).ilike("nome_quarto", f"%{pedido.tipo_quarto}%").execute()
                if res_fb.data: quarto_tipo_id_sanitizado = res_fb.data[0]["id"]
                else:
                    res_fb_slug = supabase.table("tipos_quarto").select("id").eq("hotel_id", hotel_id_sanitizado).eq("slug", pedido.tipo_quarto.lower()).execute()
                    if res_fb_slug.data: quarto_tipo_id_sanitizado = res_fb_slug.data[0]["id"]
            
            if not quarto_tipo_id_sanitizado:
                res_any = supabase.table("tipos_quarto").select("id").eq("hotel_id", hotel_id_sanitizado).limit(1).execute()
                if res_any.data: quarto_tipo_id_sanitizado = res_any.data[0]["id"]

        valor_total = 0.0
        recebedores_split = []
        splits_array = []
        nome_item_checkout = ""
        item_id_db = None
        nome_quarto_real_texto = pedido.tipo_quarto
        limite_juros_hotel = 0
        
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

        # Variáveis globais para o relatório financeiro
        v_hospedagem_total = 0.0
        v_guia_total = 0.0
        v_atracoes_total = 0.0
        lucro_agente = 0.0
        pacote_hotel_id = None
        pacote_guia_id = None
        parceiro_agente_id = None
        lista_atracoes_calculadas = []
        
        if pedido.tipo_item == "carteira":
            valor_total = 20.00 * pedido.quantidade
            nome_item_checkout = f"Taxa de Emissão - Carteira Digital ({pedido.quantidade}x)"
            item_id_db = pedido.token_id

        elif pedido.tipo_item == "hotel":
            if not hotel_id_sanitizado or not quarto_tipo_id_sanitizado:
                raise HTTPException(status_code=400, detail="Identificador do hotel ou quarto ausente.")
                
            valor_total = calcular_preco_hotel_dinamico(
                hotel_id_sanitizado, quarto_tipo_id_sanitizado, pedido.data_checkin, pedido.data_checkout,
                quantidade_quartos=pedido.quantidade, quantidade_pessoas=pedido.adultos
            )
            v_hospedagem_total = valor_total
            
            res_hotel_info = supabase.table("hoteis").select("nome, pagbank_recebedor_id, max_parcelas_sem_juros").eq("id", hotel_id_sanitizado).single().execute()
            nome_item_checkout = f"Hospedagem - {res_hotel_info.data['nome']}"
            item_id_db = hotel_id_sanitizado
            limite_juros_hotel = int(res_hotel_info.data.get("max_parcelas_sem_juros") or 0)

            res_q_info = supabase.table("tipos_quarto").select("nome_quarto").eq("id", quarto_tipo_id_sanitizado).single().execute()
            if res_q_info.data: nome_quarto_real_texto = res_q_info.data["nome_quarto"]
            
            rec_id = res_hotel_info.data.get("pagbank_recebedor_id")
            if rec_id and str(rec_id).startswith("ACC_"):
                # Proteção contra falha de arredondamento de centavos
                valor_repasse = int(round(valor_total * fator_liquido, 2) * 100)
                recebedores_split.append({ "account": {"id": rec_id}, "amount": {"value": valor_repasse} })

        elif pedido.tipo_item == "passeio":
            id_passeio = passeio_id_sanitizado or item_id_sanitizado
            if not id_passeio:
                raise HTTPException(status_code=400, detail="Identificador do passeio ausente no payload.")
                
            res_passeio = supabase.table("passeios").select("*").eq("id", id_passeio).single().execute()
            if not res_passeio.data:
                raise HTTPException(status_code=404, detail="Passeio turístico não encontrado no catálogo.")
            
            dados_p = res_passeio.data
            valor_total = float(dados_p.get("valor_total", 0.0)) * (pedido.quantidade or 1)
            v_guia_total = valor_total
            nome_item_checkout = f"Passeio: {dados_p.get('titulo')}"
            item_id_db = id_passeio

            guia_proprietario_id = limpar_uuid(dados_p.get("guia_id"))
            if guia_proprietario_id:
                res_g = supabase.table("guias").select("pagbank_recebedor_id").eq("id", guia_proprietario_id).single().execute()
                if res_g.data:
                    rec_id = res_g.data.get("pagbank_recebedor_id")
                    if rec_id and str(rec_id).startswith("ACC_"):
                        valor_repasse = int(round(valor_total * fator_liquido, 2) * 100)
                        recebedores_split.append({ "account": {"id": rec_id}, "amount": {"value": valor_repasse} })

        elif pedido.tipo_item == "pacote":
            if not pacote_id_sanitizado:
                raise HTTPException(status_code=400, detail="Identificador do pacote ausente.")
                
            res_pacote = supabase.table("pacotes").select("*").eq("id", pacote_id_sanitizado).single().execute()
            if not res_pacote.data: 
                raise HTTPException(status_code=404, detail="Pacote não encontrado")
            
            dados_pacote = res_pacote.data
            parceiro_agente_id = limpar_uuid(dados_pacote.get("agencia_id"))
            
            vagas_totais = int(dados_pacote.get("vagas_totais") or 0)
            vagas_vendidas = int(dados_pacote.get("vagas_vendidas") or 0)
            qtd_solicitada = int(pedido.adultos or 1)

            if vagas_totais > 0 and (vagas_vendidas + qtd_solicitada) > vagas_totais:
                vagas_restantes = vagas_totais - vagas_vendidas
                raise HTTPException(status_code=400, detail=f"Esgotado! O pacote tem apenas {vagas_restantes} vaga(s).")
            
            nome_item_checkout = f"Pacote: {dados_pacote.get('titulo', 'Turístico')}"
            item_id_db = pacote_id_sanitizado

            # Busca Itens reais do pacote
            res_itens = supabase.table("pacote_itens").select("*").eq("pacote_id", pacote_id_sanitizado).execute()
            for item in res_itens.data:
                if item.get("hotel_id"): pacote_hotel_id = limpar_uuid(item["hotel_id"])
                if item.get("guia_id"): pacote_guia_id = limpar_uuid(item["guia_id"])
                if item.get("atracao_id"):
                    atr_id = limpar_uuid(item["atracao_id"])
                    res_atr = supabase.table("atracoes").select("pagbank_recebedor_id, preco_entrada").eq("id", atr_id).single().execute()
                    if res_atr.data:
                        v_individual_atr = float(res_atr.data["preco_entrada"]) * pedido.adultos
                        v_atracoes_total += v_individual_atr
                        rec_id = res_atr.data.get("pagbank_recebedor_id")
                        if rec_id and str(rec_id).startswith("ACC_"):
                            valor_repasse = int(round(v_individual_atr * fator_liquido, 2) * 100)
                            recebedores_split.append({ "account": {"id": rec_id}, "amount": {"value": valor_repasse} })
                        lista_atracoes_calculadas.append({"id": atr_id, "valor": v_individual_atr})

            # 3. Calcula o Custo do Hotel e o Upgrade Estático (Igual ao Frontend)
            v_hospedagem_standard = 0.0
            acrescimo_upgrade = 0.0

            if pacote_hotel_id and quarto_tipo_id_sanitizado:
                # Custo dinâmico que o Hotel RECEBE
                v_hospedagem_total = calcular_preco_hotel_dinamico(
                    pacote_hotel_id, quarto_tipo_id_sanitizado, pedido.data_checkin, pedido.data_checkout,
                    quantidade_quartos=pedido.quantidade, quantidade_pessoas=pedido.adultos
                )
                
                # UPGRADE cobrado do cliente segue a diferença ESTÁTICA
                res_std = supabase.table("tipos_quarto").select("id, preco_quarto").eq("hotel_id", pacote_hotel_id).order("preco_quarto").limit(1).execute()
                res_escolhido = supabase.table("tipos_quarto").select("preco_quarto, nome_quarto").eq("id", quarto_tipo_id_sanitizado).single().execute()
                
                if res_std.data and res_escolhido.data:
                    preco_std = float(res_std.data[0]["preco_quarto"])
                    preco_escolhido = float(res_escolhido.data["preco_quarto"])
                    
                    if preco_escolhido > preco_std:
                        diferenca_diaria = preco_escolhido - preco_std
                        d_ci = datetime.strptime(pedido.data_checkin, "%Y-%m-%d")
                        d_co = datetime.strptime(pedido.data_checkout, "%Y-%m-%d")
                        noites_finais = max(1, (d_co - d_ci).days)
                        acrescimo_upgrade = diferenca_diaria * noites_finais * pedido.quantidade
                        
                if res_escolhido.data: nome_quarto_real_texto = res_escolhido.data["nome_quarto"]

                res_h_info = supabase.table("hoteis").select("pagbank_recebedor_id").eq("id", pacote_hotel_id).single().execute()
                if res_h_info.data:
                    rec_id = res_h_info.data.get("pagbank_recebedor_id")
                    if rec_id and str(rec_id).startswith("ACC_"):
                        valor_repasse = int(round(v_hospedagem_total * fator_liquido, 2) * 100)
                        recebedores_split.append({ "account": {"id": rec_id}, "amount": {"value": valor_repasse} })

            # Calcula Guia
            d_ci = datetime.strptime(pedido.data_checkin, "%Y-%m-%d")
            d_co = datetime.strptime(pedido.data_checkout, "%Y-%m-%d")
            noites_calculadas = (d_co - d_ci).days
            noites_finais = noites_calculadas if noites_calculadas > 0 else 1

            if pacote_guia_id:
                res_g = supabase.table("guias").select("pagbank_recebedor_id, preco_diaria").eq("id", pacote_guia_id).single().execute()
                if res_g.data:
                    v_guia_total = float(res_g.data["preco_diaria"]) * (noites_finais + 1)
                    rec_id = res_g.data.get("pagbank_recebedor_id")
                    if rec_id and str(rec_id).startswith("ACC_"):
                        valor_repasse = int(round(v_guia_total * fator_liquido, 2) * 100)
                        recebedores_split.append({ "account": {"id": rec_id}, "amount": {"value": valor_repasse} })

            # Matemática Agência
            preco_base_pacote = float(dados_pacote.get("preco") or 0.0)
            valor_total = preco_base_pacote + acrescimo_upgrade 
            
            custo_terceiros_base = v_hospedagem_standard + v_guia_total + v_atracoes_total
            lucro_agente = preco_base_pacote - custo_terceiros_base
            lucro_agente_split = lucro_agente if lucro_agente > 0 else 0.0

            if parceiro_agente_id and lucro_agente_split > 0:
                res_agente = supabase.table("agencias").select("pagbank_recebedor_id").eq("id", parceiro_agente_id).execute()
                if res_agente.data and len(res_agente.data) > 0:
                    rec_id_agente = res_agente.data[0].get("pagbank_recebedor_id")
                    if rec_id_agente and str(rec_id_agente).startswith("ACC_"):
                        valor_repasse = int(round(lucro_agente_split * fator_liquido, 2) * 100)
                        recebedores_split.append({ "account": {"id": rec_id_agente}, "amount": {"value": valor_repasse} })

        # Lógica Fina de Split
        soma_splits_centavos = sum(r["amount"]["value"] for r in recebedores_split)
        valor_total_centavos = int(round(valor_total, 2) * 100)

        if recebedores_split and (soma_splits_centavos < valor_total_centavos):
            splits_array = [{
                "method": "FIXED",
                "receivers": recebedores_split
            }]
        else:
            splits_array = []

        # HACK SANDBOX: Mantenho para prevenir o erro de conta inexistente nos testes
        # Se quiseres testar o PagBank a rejeitar ou aceitar o Split REAL, podes comentar a linha abaixo.
        #if "sandbox" in PAGBANK_API_URL:
          #  splits_array = []

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
            "hotel_id": hotel_id_sanitizado,
            "guia_id": guia_id_sanitizado,
            "tipo_quarto": nome_quarto_real_texto, 
            "quarto_tipo_id": quarto_tipo_id_sanitizado, 
            "quantidade_pessoas": pedido.adultos if pedido.adultos else 2,
            "quantidade_quartos": pedido.quantidade if pedido.tipo_item in ["hotel", "pacote"] else 1,
            "nome_item": nome_item_checkout,
            "item_id": limpar_uuid(item_id_db),
            "hospedes_extras": [h.dict() for h in pedido.hospedes_extras] if pedido.hospedes_extras else []
        }

        res_pedido = supabase.table("pedidos").insert(pedido_db).execute()

        if res_pedido.data:
            pedido_id_gerado = res_pedido.data[0]["id"]
            repasses_db = []
            
            # Geração das guias de repasse financeiro...
            if pedido.tipo_item == "hotel" and hotel_id_sanitizado:
                repasses_db.append({
                    "pedido_id": pedido_id_gerado, "parceiro_id": hotel_id_sanitizado, "tipo_parceiro": "hotel",
                    "valor_bruto": v_hospedagem_total, "taxa_plataforma": round(v_hospedagem_total * (taxa_prefeitura_pct / 100.0), 2),
                    "valor_liquido": round(v_hospedagem_total * fator_liquido, 2), "status_repasse": "processando"
                })
            elif pedido.tipo_item == "passeio" and pedido_db["item_id"]:
                res_pass_g = supabase.table("passeios").select("guia_id").eq("id", pedido_db["item_id"]).single().execute()
                g_id = limpar_uuid(res_pass_g.data.get("guia_id")) if res_pass_g.data else guia_id_sanitizado
                if g_id:
                    repasses_db.append({
                        "pedido_id": pedido_id_gerado, "parceiro_id": g_id, "tipo_parceiro": "guia",
                        "valor_bruto": v_guia_total, "taxa_plataforma": round(v_guia_total * (taxa_prefeitura_pct / 100.0), 2),
                        "valor_liquido": round(v_guia_total * fator_liquido, 2), "status_repasse": "processando"
                    })
            elif pedido.tipo_item == "pacote":
                # Decremento de estoque na DB apenas para cartões de crédito síncronos
                if pedido.metodo_pagamento == 'cartao':
                    supabase.table("pacotes").update({
                        "vagas_vendidas": vagas_vendidas + qtd_solicitada
                    }).eq("id", pacote_id_sanitizado).execute()

                if pacote_hotel_id and v_hospedagem_total > 0:
                    repasses_db.append({
                        "pedido_id": pedido_id_gerado, "parceiro_id": pacote_hotel_id, "tipo_parceiro": "hotel",
                        "valor_bruto": v_hospedagem_total, "taxa_plataforma": round(v_hospedagem_total * (taxa_prefeitura_pct / 100.0), 2),
                        "valor_liquido": round(v_hospedagem_total * fator_liquido, 2), "status_repasse": "processando"
                    })
                if pacote_guia_id and v_guia_total > 0:
                    repasses_db.append({
                        "pedido_id": pedido_id_gerado, "parceiro_id": pacote_guia_id, "tipo_parceiro": "guia",
                        "valor_bruto": v_guia_total, "taxa_plataforma": round(v_guia_total * (taxa_prefeitura_pct / 100.0), 2),
                        "valor_liquido": round(v_guia_total * fator_liquido, 2), "status_repasse": "processando"
                    })
                for atr in lista_atracoes_calculadas:
                    repasses_db.append({
                        "pedido_id": pedido_id_gerado, "parceiro_id": atr["id"], "tipo_parceiro": "atracao",
                        "valor_bruto": atr["valor"], "taxa_plataforma": round(atr["valor"] * (taxa_prefeitura_pct / 100.0), 2),
                        "valor_liquido": round(atr["valor"] * fator_liquido, 2), "status_repasse": "processando"
                    })
                if parceiro_agente_id:
                    repasses_db.append({
                        "pedido_id": pedido_id_gerado, "parceiro_id": parceiro_agente_id, "tipo_parceiro": "agencia",
                        "valor_bruto": lucro_agente,
                        "taxa_plataforma": round(max(lucro_agente, 0) * (taxa_prefeitura_pct / 100.0), 2),
                        "valor_liquido": round(lucro_agente * fator_liquido, 2), "status_repasse": "processando"
                    })
            
            if repasses_db:
                supabase.table("repasses_financeiros").insert(repasses_db).execute()

        payload_pagbank = {
            "reference_id": codigo_pedido,
            "customer": {
                "name": pedido.nome_cliente,
                "email": pedido.email_cliente,
                "tax_id": tax_id_limpo,
                "phones": [{"country": "55", "area": ddd, "number": numero_tel, "type": "MOBILE"}]
            },
            "items": [{"name": nome_item_checkout, "quantity": 1, "unit_amount": int(round(valor_total, 2) * 100)}],
            "notification_urls": ["https://sagaturismo-production.up.railway.app/api/v1/webhooks/pagbank"]
        }

        if pedido.metodo_pagamento == "pix":
            payload_pagbank["qr_codes"] = [{"amount": {"value": int(round(valor_total, 2) * 100)}}]
            if splits_array: 
                payload_pagbank["qr_codes"][0]["splits"] = splits_array
        else:
            charge = {
                "reference_id": codigo_pedido,
                "description": nome_item_checkout,
                "amount": {"value": int(round(valor_total, 2) * 100), "currency": "BRL"},
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
            if splits_array: charge["splits"] = splits_array
            if limite_juros_hotel > 1: charge["payment_method"]["installment_no_interest"] = limite_juros_hotel

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
                base_retorno.update({ "metodo": "pix", "pix_qrcode_img": link_qr, "pix_copia_cola": qr["text"] })
            else:
                base_retorno.update({ "metodo": "cartao", "status_pagamento": dados_pb["charges"][0]["status"] })
            
            return base_retorno

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"Erro: {e}")
        raise HTTPException(status_code=500, detail=str(e))