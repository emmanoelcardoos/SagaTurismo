from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List
import httpx
import os
import uuid
import base64
import qrcode
import tempfile
import string
import random
from io import BytesIO
from datetime import datetime, timedelta
from supabase import create_client, Client

# Importação dos serviços que já tens criados
from app.services.pdf_service import gerar_pdf_carteira, gerar_pdf_voucher
from app.services.email_service import (
    enviar_carteiras_por_email, 
    enviar_voucher_hotel, 
    enviar_voucher_pacote, 
    enviar_voucher_passeio
)

router = APIRouter()

# ==========================================
# 1. Configurações de Ambiente - ASAAS & SUPABASE
# ==========================================
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
ASAAS_API_KEY = os.environ.get("ASAAS_API_KEY")
ASAAS_API_URL = os.environ.get("ASAAS_API_URL", "https://sandbox.asaas.com/api/v3")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# 2. Configurações Banco do Brasil (mTLS & Env)
# ==========================================
BB_CLIENT_ID = os.environ.get("BB_CLIENT_ID")
BB_CLIENT_SECRET = os.environ.get("BB_CLIENT_SECRET")
BB_DEV_APP_KEY = os.environ.get("BB_DEVELOPER_APPLICATION_KEY", os.environ.get("BB_DEV_APP_KEY")) 
BB_PIX_KEY = os.environ.get("BB_PIX_KEY", "7a26f8d0-e1db-40a2-9b0d-b2a0c64eb3d0")

# Deteta o ambiente (producao ou sandbox)
BB_ENV = os.environ.get("BB_ENV", "sandbox")

if BB_ENV == "producao":
    BB_OAUTH_URL = "https://oauth.bb.com.br/oauth/token"
    BB_API_URL = "https://api-pix.bb.com.br/pix/v2"
else:
    BB_OAUTH_URL = "https://oauth.hm.bb.com.br/oauth/token"
    BB_API_URL = "https://api.hm.bb.com.br/pix/v2"


# ==========================================
# SCHEMAS (Pydantic Models)
# ==========================================
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

class CartaoDados(BaseModel):
    nome: str
    numero: str
    mes: str
    ano: str
    cvv: str

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
    dados_cartao: Optional[CartaoDados] = None
    parcelas: Optional[int] = 1

    hospedes_extras: Optional[List[AcompanhanteSchema]] = []

class PedidoCarteiraGratuita(BaseModel):
    nome_cliente: str
    cpf_cliente: str
    email_cliente: str
    telefone_cliente: str
    foto_url: Optional[str] = None
    data_nascimento: Optional[str] = None
    token_id: Optional[str] = None
    quantidade: Optional[int] = 1 # <-- ADICIONADO AQUI PARA RECEBER A QUANTIDADE DO FRONTEND


# ==========================================
# FUNÇÕES AUXILIARES
# ==========================================
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

def obter_certificados_mtls():
    """Lê as variáveis do Railway e cria ficheiros temporários para o mTLS"""
    if BB_ENV != "producao":
        return None, None

    cert_pub = os.environ.get("BB_CERT_PUB")
    cert_priv = os.environ.get("BB_CERT_PRIV")
    
    if not cert_pub or not cert_priv:
        raise HTTPException(status_code=500, detail="Certificados mTLS não configurados nas variáveis de ambiente (Produção).")

    pub_fd, pub_path = tempfile.mkstemp(suffix=".pem")
    priv_fd, priv_path = tempfile.mkstemp(suffix=".key")
    
    with os.fdopen(pub_fd, 'w') as f:
        f.write(cert_pub)
        
    with os.fdopen(priv_fd, 'w') as f:
        f.write(cert_priv)
        
    return pub_path, priv_path

class PedidoReenvio(BaseModel):
    pedido_id: str


# ==========================================
# ROTAS ASAAS E SISTEMA GERAL
# ==========================================
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
        
        codigo_pedido = f"SAGA-{uuid.uuid4().hex[:8].upper()}"

        tax_id_limpo = pedido.cpf_cliente.replace(".", "").replace("-", "")
        telefone_limpo = pedido.telefone_cliente.replace("(", "").replace(")", "").replace("-", "").replace(" ", "")

        taxa_prefeitura_pct = 0.0
        res_taxa = supabase.table("taxas_servicos").select("porcentagem").eq("tipo_servico", pedido.tipo_item).execute()
        if res_taxa.data:
            taxa_prefeitura_pct = float(res_taxa.data[0]["porcentagem"])

        fator_liquido = 1.0 - (taxa_prefeitura_pct / 100.0)

        v_hospedagem_total = 0.0
        v_guia_total = 0.0
        v_atracoes_total = 0.0
        lucro_agente = 0.0
        pacote_hotel_id = None
        pacote_guia_id = None
        parceiro_agente_id = None
        lista_atracoes_calculadas = []
        
        if pedido.tipo_item == "carteira":
            valor_total = 0.01 * pedido.quantidade
            nome_item_checkout = f"Taxa de Emissão - Carteira Digital ({pedido.quantidade}x)"
            item_id_db = pedido.token_id

            taxa_empresa_saas = 0.00
            valor_prefeitura = (0.01 - taxa_empresa_saas) * pedido.quantidade
            
            rec_id_prefeitura = os.environ.get("ID_ASAAS_PREFEITURA", "wallet_id_da_prefeitura_aqui")
            valor_repasse = round(valor_prefeitura, 2)
            recebedores_split.append({ "walletId": rec_id_prefeitura, "fixedValue": valor_repasse })

        elif pedido.tipo_item == "hotel":
            if not hotel_id_sanitizado or not quarto_tipo_id_sanitizado:
                raise HTTPException(status_code=400, detail="Identificador do hotel ou quarto ausente.")
                
            valor_total = calcular_preco_hotel_dinamico(
                hotel_id_sanitizado, quarto_tipo_id_sanitizado, pedido.data_checkin, pedido.data_checkout,
                quantidade_quartos=pedido.quantidade, quantidade_pessoas=pedido.adultos
            )
            v_hospedagem_total = valor_total
            
            res_hotel_info = supabase.table("hoteis").select("nome, asaas_wallet_id").eq("id", hotel_id_sanitizado).single().execute()
            nome_item_checkout = f"Hospedagem - {res_hotel_info.data['nome']}"
            item_id_db = hotel_id_sanitizado

            res_q_info = supabase.table("tipos_quarto").select("nome_quarto").eq("id", quarto_tipo_id_sanitizado).single().execute()
            if res_q_info.data: nome_quarto_real_texto = res_q_info.data["nome_quarto"]
            
            rec_id = res_hotel_info.data.get("asaas_wallet_id")
            if rec_id:
                valor_repasse = round(valor_total * fator_liquido, 2)
                recebedores_split.append({ "walletId": rec_id, "fixedValue": valor_repasse })

        elif pedido.tipo_item == "passeio":
            id_passeio = passeio_id_sanitizado or item_id_sanitizado
            if not id_passeio:
                raise HTTPException(status_code=400, detail="Identificador do passeio ausente.")
                
            res_passeio = supabase.table("passeios").select("*").eq("id", id_passeio).single().execute()
            if not res_passeio.data:
                raise HTTPException(status_code=404, detail="Passeio turístico não encontrado.")
            
            dados_p = res_passeio.data
            valor_total = float(dados_p.get("valor_total", 0.0)) * (pedido.quantidade or 1)
            v_guia_total = valor_total
            nome_item_checkout = f"Passeio: {dados_p.get('titulo')}"
            item_id_db = id_passeio

            guia_proprietario_id = limpar_uuid(dados_p.get("guia_id"))
            if guia_proprietario_id:
                res_g = supabase.table("guias").select("asaas_wallet_id").eq("id", guia_proprietario_id).single().execute()
                if res_g.data:
                    rec_id = res_g.data.get("asaas_wallet_id")
                    if rec_id:
                        valor_repasse = round(valor_total * fator_liquido, 2)
                        recebedores_split.append({ "walletId": rec_id, "fixedValue": valor_repasse })

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

            res_itens = supabase.table("pacote_itens").select("*").eq("pacote_id", pacote_id_sanitizado).execute()
            for item in res_itens.data:
                if item.get("hotel_id"): pacote_hotel_id = limpar_uuid(item["hotel_id"])
                if item.get("guia_id"): pacote_guia_id = limpar_uuid(item["guia_id"])
                if item.get("atracao_id"):
                    atr_id = limpar_uuid(item["atracao_id"])
                    res_atr = supabase.table("atracoes").select("asaas_wallet_id, preco_entrada").eq("id", atr_id).single().execute()
                    if res_atr.data:
                        v_individual_atr = float(res_atr.data["preco_entrada"]) * pedido.adultos
                        v_atracoes_total += v_individual_atr
                        rec_id = res_atr.data.get("asaas_wallet_id")
                        if rec_id:
                            valor_repasse = round(v_individual_atr * fator_liquido, 2)
                            recebedores_split.append({ "walletId": rec_id, "fixedValue": valor_repasse })
                        lista_atracoes_calculadas.append({"id": atr_id, "valor": v_individual_atr})

            v_hospedagem_standard = 0.0
            acrescimo_upgrade = 0.0

            if pacote_hotel_id and quarto_tipo_id_sanitizado:
                v_hospedagem_total = calcular_preco_hotel_dinamico(
                    pacote_hotel_id, quarto_tipo_id_sanitizado, pedido.data_checkin, pedido.data_checkout,
                    quantidade_quartos=pedido.quantidade, quantidade_pessoas=pedido.adultos
                )
                
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

                res_h_info = supabase.table("hoteis").select("asaas_wallet_id").eq("id", pacote_hotel_id).single().execute()
                if res_h_info.data:
                    rec_id = res_h_info.data.get("asaas_wallet_id")
                    if rec_id:
                        valor_repasse = round(v_hospedagem_total * fator_liquido, 2)
                        recebedores_split.append({ "walletId": rec_id, "fixedValue": valor_repasse })

            d_ci = datetime.strptime(pedido.data_checkin, "%Y-%m-%d")
            d_co = datetime.strptime(pedido.data_checkout, "%Y-%m-%d")
            noites_calculadas = (d_co - d_ci).days
            noites_finais = noites_calculadas if noites_calculadas > 0 else 1

            if pacote_guia_id:
                res_g = supabase.table("guias").select("asaas_wallet_id, preco_diaria").eq("id", pacote_guia_id).single().execute()
                if res_g.data:
                    v_guia_total = float(res_g.data["preco_diaria"]) * (noites_finais + 1)
                    rec_id = res_g.data.get("asaas_wallet_id")
                    if rec_id:
                        valor_repasse = round(v_guia_total * fator_liquido, 2)
                        recebedores_split.append({ "walletId": rec_id, "fixedValue": valor_repasse })

            preco_base_pacote = float(dados_pacote.get("preco") or 0.0)
            valor_total = preco_base_pacote + acrescimo_upgrade 
            
            custo_terceiros_base = v_hospedagem_standard + v_guia_total + v_atracoes_total
            lucro_agente = preco_base_pacote - custo_terceiros_base
            lucro_agente_split = lucro_agente if lucro_agente > 0 else 0.0

            if parceiro_agente_id and lucro_agente_split > 0:
                res_agente = supabase.table("agencias").select("asaas_wallet_id").eq("id", parceiro_agente_id).execute()
                if res_agente.data and len(res_agente.data) > 0:
                    rec_id_agente = res_agente.data[0].get("asaas_wallet_id")
                    if rec_id_agente:
                        valor_repasse = round(lucro_agente_split * fator_liquido, 2)
                        recebedores_split.append({ "walletId": rec_id_agente, "fixedValue": valor_repasse })

        # Lógica de Split Asaas
        soma_splits_reais = sum(r["fixedValue"] for r in recebedores_split)
        valor_total_arredondado = round(valor_total, 2)

        if recebedores_split and (soma_splits_reais <= valor_total_arredondado):
            splits_array = recebedores_split
        else:
            splits_array = []

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

        # ==============================================================
        # INTEGRAÇÃO OFICIAL COM ASAAS API
        # ==============================================================
        async with httpx.AsyncClient() as client:
            headers = {"access_token": ASAAS_API_KEY, "Content-Type": "application/json"}

            # 1. Cria ou regista o Cliente no Asaas
            customer_payload = {
                "name": pedido.nome_cliente,
                "email": pedido.email_cliente,
                "cpfCnpj": tax_id_limpo,
                "mobilePhone": telefone_limpo
            }
            resp_cust = await client.post(f"{ASAAS_API_URL}/customers", json=customer_payload, headers=headers)
            if resp_cust.status_code not in [200, 201]:
                print(f"Erro ao criar cliente Asaas: {resp_cust.json()}")
                raise HTTPException(status_code=400, detail="Erro ao registrar cliente financeiro.")
            
            customer_id = resp_cust.json()["id"]

            # 2. Monta a Fatura
            asaas_payload = {
                "customer": customer_id,
                "billingType": "PIX" if pedido.metodo_pagamento == "pix" else "CREDIT_CARD",
                "value": valor_total_arredondado,
                "dueDate": datetime.now().strftime("%Y-%m-%d"),
                "description": nome_item_checkout,
                "externalReference": codigo_pedido, # A chave mestra para o webhook!
            }

            if splits_array:
                asaas_payload["split"] = splits_array

            # 3. Adiciona dados do Cartão se for Cartão
            if pedido.metodo_pagamento == "cartao":
                if not pedido.dados_cartao:
                    raise HTTPException(status_code=400, detail="Dados do cartão ausentes.")
                    
                asaas_payload["installmentCount"] = pedido.parcelas
                asaas_payload["installmentValue"] = round(valor_total_arredondado / pedido.parcelas, 2)
                asaas_payload["creditCard"] = {
                    "holderName": pedido.dados_cartao.nome,
                    "number": pedido.dados_cartao.numero,
                    "expiryMonth": pedido.dados_cartao.mes,
                    "expiryYear": pedido.dados_cartao.ano,
                    "ccv": pedido.dados_cartao.cvv
                }
                asaas_payload["creditCardHolderInfo"] = {
                    "name": pedido.nome_cliente,
                    "email": pedido.email_cliente,
                    "cpfCnpj": tax_id_limpo,
                    "postalCode": pedido.endereco_faturacao.postal_code.replace("-", ""),
                    "addressNumber": pedido.endereco_faturacao.number,
                    "phone": telefone_limpo
                }

            # 4. Dispara a Cobrança
            resp_pay = await client.post(f"{ASAAS_API_URL}/payments", json=asaas_payload, headers=headers)
            if resp_pay.status_code not in [200, 201]:
                print(f"Erro Asaas Payment: {resp_pay.json()}")
                raise HTTPException(status_code=400, detail="Transação recusada pelo banco.")

            dados_asaas = resp_pay.json()
            asaas_payment_id = dados_asaas["id"]

            # ◄── A MAGIA ACONTECE AQUI: Atualiza o pedido com a chave do Asaas ──►
            supabase.table("pedidos").update({
                "asaas_payment_id": asaas_payment_id
            }).eq("codigo_pedido", codigo_pedido).execute()

            base_retorno = {"sucesso": True, "codigo_pedido": codigo_pedido}

            if pedido.metodo_pagamento == "pix":
                resp_qr = await client.get(f"{ASAAS_API_URL}/payments/{asaas_payment_id}/pixQrCode", headers=headers)
                qr_data = resp_qr.json()
                
                # Tratamento seguro caso o Asaas demore a gerar a imagem
                base64_img = qr_data.get('encodedImage') or ''
                payload_copia_cola = qr_data.get('payload') or ''

                base_retorno.update({
                    "metodo": "pix",
                    "pix_qrcode_img": f"data:image/jpeg;base64,{base64_img}" if base64_img else "",
                    "pix_copia_cola": payload_copia_cola,
                    "codigo_pedido": asaas_payment_id 
                })
            else:
                base_retorno.update({
                    "metodo": "cartao",
                    "status_pagamento": dados_asaas["status"],
                    "codigo_pedido": asaas_payment_id
                })

            return base_retorno

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"Erro: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/v1/pagamentos/carteira-gratuita")
async def processar_carteira_gratuita(pedido: PedidoCarteiraGratuita):
    try:
        codigo_pedido = f"SAGA-FREE-{uuid.uuid4().hex[:8].upper()}"
        
        pedido_db = {
            "codigo_pedido": codigo_pedido,
            "tipo_item": "carteira",
            "nome_cliente": pedido.nome_cliente,
            "cpf_cliente": pedido.cpf_cliente,
            "email_cliente": pedido.email_cliente,
            "telefone_cliente": pedido.telefone_cliente,
            "valor_total": 0.0, 
            "status_pagamento": "pago",
            "metodo_pagamento": "isento_prefeitura",
            "data_nascimento": pedido.data_nascimento,
            "foto_url": pedido.foto_url,
            "quantidade": 1,
            "nome_item": "Emissão Gratuita - Carteira Digital de Turismo",
            "item_id": pedido.token_id
        }
        
        res = supabase.table("pedidos").insert(pedido_db).execute()
        
        if not res.data:
            raise HTTPException(status_code=400, detail="Erro ao registar a emissão gratuita na base de dados.")
            
        if pedido.token_id:
            titular_res = supabase.table("rd_residentes").select("*").eq("id", pedido.token_id).execute()
            deps_res = supabase.table("rd_residentes").select("*").eq("titular_id", pedido.token_id).execute()
            
            membros_familia = (titular_res.data or []) + (deps_res.data or [])
            caminhos_pdfs = []
            
            if membros_familia:
                for residente in membros_familia:
                    supabase.table("rd_residentes").update({"status": "ativo"}).eq("id", residente["id"]).execute()
                    
                    dados_pdf = {
                        "nome": residente.get("nome_completo") or pedido.nome_cliente,
                        "cpf": residente.get("cpf") or pedido.cpf_cliente,
                        "data_nascimento": residente.get("data_nascimento") or pedido.data_nascimento or "--/--/----",
                        "foto_url": residente.get("foto_url") or pedido.foto_url
                    }
                    caminho_pdf = gerar_pdf_carteira(dados_pdf, residente.get("qrcode_token") or residente["id"])
                    
                    if caminho_pdf:
                        caminhos_pdfs.append(caminho_pdf)
                
                if caminhos_pdfs:
                    try:
                        enviar_carteiras_por_email(pedido.email_cliente, pedido.nome_cliente, caminhos_pdfs)
                        print(f"[EMISSÃO GRATUITA] E-mail com {len(caminhos_pdfs)} carteira(s) enviado com sucesso para {pedido.email_cliente}")
                    except Exception as err_email:
                        print(f"[ERRO E-MAIL] Falha ao enviar carteira gratuita: {err_email}")

        return {
            "sucesso": True,
            "codigo_pedido": codigo_pedido,
            "mensagem": "Carteiras aprovadas e emitidas com sucesso!"
        }

    except Exception as e:
        print(f"Erro na emissão gratuita: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/v1/pagamentos/status/{payment_id}")
async def verificar_status_pagamento(payment_id: str):
    try:
        # 1. VERIFICA NA BASE DE DADOS (Funciona para BB e Pix!)
        res = supabase.table("pedidos").select("status_pagamento").eq("codigo_pedido", payment_id).execute()
        if res.data:
            if res.data[0]["status_pagamento"] == "pago":
                return {"success": True, "status": "CONFIRMED"}

        # 2. FALLBACK PARA O ASAAS (Mantém a compatibilidade do teu sistema de Cartão de Crédito)
        headers = {"access_token": ASAAS_API_KEY}
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{ASAAS_API_URL}/payments/{payment_id}", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "success": True,
                    "status": data.get("status"),
                    "value": data.get("value"),
                    "description": data.get("description"),
                    "billingType": data.get("billingType")
                }
            return {"success": False, "error": "Pagamento não encontrado no Asaas."}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/api/v1/parceiros/criar-carteira")
async def criar_carteira_asaas(dados: dict):
    try:
        headers = {
            "access_token": ASAAS_API_KEY,
            "Content-Type": "application/json"
        }
        
        payload_asaas = {
            "name": dados.get("name"),
            "email": dados.get("email"),
            "loginEmail": dados.get("email"),
            "cpfCnpj": dados.get("cpfCnpj"),
            "birthDate": dados.get("birthDate"),
            "incomeValue": 5000.00,
            "phone": dados.get("phone"),
            "mobilePhone": dados.get("phone"),
            "postalCode": dados.get("postalCode"),
            "address": dados.get("address"),
            "addressNumber": dados.get("addressNumber"),
            "province": dados.get("province"),
        }
        
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{ASAAS_API_URL}/accounts", json=payload_asaas, headers=headers)
            data = resp.json()
            
            if resp.status_code == 200 and data.get("walletId"):
                return {"sucesso": True, "asaas_wallet_id": data["walletId"]}
            else:
                erro_msg = data.get("errors", [{"description": "Erro ao criar carteira no Asaas"}])[0]["description"]
                return {"sucesso": False, "erro": erro_msg}
                
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}

@router.post("/api/v1/pedidos/reenviar-voucher")
async def reenviar_voucher(payload: PedidoReenvio):
    try:
        res_pedido = supabase.table("pedidos").select("*").eq("id", payload.pedido_id).single().execute()
        if not res_pedido.data:
            raise HTTPException(status_code=404, detail="Pedido não encontrado.")
            
        pedido = res_pedido.data
        tipo = pedido.get("tipo_item")
        email_cliente = pedido.get("email_cliente")
        nome_cliente = pedido.get("nome_cliente")

        if not email_cliente:
            raise HTTPException(status_code=400, detail="E-mail do cliente não registado neste pedido.")

        if tipo == "hotel":
            hotel_id = pedido.get("hotel_id") or pedido.get("item_id")
            politicas_texto = "Apresente o seu documento de identificação original com foto no balcão de check-in."
            nome_hotel = "Hotel Parceiro"
            
            try:
                res_h = supabase.table("hoteis").select("nome, politicas").eq("id", hotel_id).single().execute()
                if res_h.data:
                    nome_hotel = res_h.data.get("nome", "Hotel Parceiro")
                    p_raw = res_h.data.get("politicas")
                    if p_raw:
                        politicas_texto = p_raw.get("checkin_checkout") if isinstance(p_raw, dict) else str(p_raw)
            except Exception as e:
                print(f"[REENVIO HOTEL] Erro dados hotel: {e}")

            dados_reserva = {
                "nome_hotel": nome_hotel,
                "checkin": pedido.get("data_checkin"),
                "checkout": pedido.get("data_checkout"),
                "tipo_quarto": pedido.get("tipo_quarto", "standard"),
                "quantidade_pessoas": pedido.get("quantidade_pessoas", 2),
                "politicas": politicas_texto
            }
            
            caminho_pdf = gerar_pdf_voucher(pedido, dados_reserva)
            sucesso = enviar_voucher_hotel(email_cliente, nome_cliente, dados_reserva, caminho_pdf)

        elif tipo == "pacote":
            pacote_id = pedido.get("item_id")
            nome_pacote = "Pacote de Expedição SagaTurismo"
            nome_hotel = "Alojamento Oficial Incluso"
            nome_guia = "Guia Credenciado Atribuído"
            ponto_encontro = "Centro de Atendimento ao Turista (CAT)."

            try:
                res_p = supabase.table("pacotes").select("titulo").eq("id", pacote_id).single().execute()
                if res_p.data: nome_pacote = res_p.data.get("titulo", nome_pacote)
                
                hotel_id_pedido = pedido.get("hotel_id")
                if hotel_id_pedido:
                    res_h = supabase.table("hoteis").select("nome").eq("id", hotel_id_pedido).single().execute()
                    if res_h.data: nome_hotel = res_h.data.get("nome")
                        
                guia_id_pedido = pedido.get("guia_id")
                if guia_id_pedido:
                    res_g = supabase.table("guias").select("nome").eq("id", guia_id_pedido).single().execute()
                    if res_g.data: nome_guia = res_g.data.get("nome")
            except Exception as e:
                print(f"[REENVIO PACOTE] Erro dados pacote: {e}")

            dados_pacote = {
                "nome_pacote": nome_pacote,
                "checkin": pedido.get("data_checkin"),
                "checkout": pedido.get("data_checkout"),
                "nome_hotel": nome_hotel,
                "nome_guia": nome_guia,
                "ponto_encontro": ponto_encontro
            }
            
            caminho_pdf = gerar_pdf_voucher(pedido, dados_pacote)
            sucesso = enviar_voucher_pacote(email_cliente, nome_cliente, dados_pacote, caminho_pdf)

        elif tipo == "passeio":
            passeio_id = pedido.get("item_id")
            nome_passeio = "Passeio Ecológico Oficial"
            nome_guia = "Guia de Turismo Credenciado"
            contato_guia = "Disponível via Central SagaTurismo"
            endereco_local = "Orla de São Geraldo do Araguaia"

            try:
                res_pass = supabase.table("passeios").select("titulo, guia_id, ponto_encontro").eq("id", passeio_id).single().execute()
                if res_pass.data:
                    nome_passeio = res_pass.data.get("titulo", nome_passeio)
                    if res_pass.data.get("ponto_encontro"): endereco_local = res_pass.data.get("ponto_encontro")
                    g_id = res_pass.data.get("guia_id") or pedido.get("guia_id")
                    if g_id:
                        res_g = supabase.table("guias").select("nome, whatsapp").eq("id", g_id).single().execute()
                        if res_g.data:
                            nome_guia = res_g.data.get("nome", nome_guia)
                            contato_guia = res_g.data.get("whatsapp", contato_guia)
            except Exception as e:
                print(f"[REENVIO PASSEIO] Erro dados passeio: {e}")

            dados_passeio = {
                "nome_passeio": nome_passeio,
                "data_hora": pedido.get("data_checkin") or "Agendado",
                "endereco": endereco_local,
                "nome_guia": nome_guia,
                "contato_guia": contato_guia
            }
            
            caminho_pdf = gerar_pdf_voucher(pedido, dados_passeio)
            sucesso = enviar_voucher_passeio(email_cliente, nome_cliente, dados_passeio, caminho_pdf)
            
        else:
            raise HTTPException(status_code=400, detail="Tipo de reserva não suporta voucher em PDF.")

        if sucesso:
            return {"sucesso": True, "mensagem": f"Voucher enviado com sucesso para {email_cliente}"}
        else:
            raise HTTPException(status_code=500, detail="Falha ao disparar o e-mail via Resend.")

    except HTTPException as http_e:
        raise http_e
    except Exception as e:
        print(f"[REENVIO ERRO FATAL] {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ROTAS BANCO DO BRASIL (mTLS e PIX)
# ==========================================
@router.get("/api/v1/pagamentos/teste-bb")
async def testar_conexao_bb():
    pub_path, priv_path = obter_certificados_mtls()
    try:
        auth_string = f"{BB_CLIENT_ID}:{BB_CLIENT_SECRET}"
        auth_b64 = base64.b64encode(auth_string.encode()).decode("utf-8")
        
        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        # Configura o client mTLS apenas se for produção
        client_kwargs = {}
        if pub_path and priv_path:
            client_kwargs["cert"] = (pub_path, priv_path)
            
        async with httpx.AsyncClient(**client_kwargs) as client:
            resp = await client.post(
                BB_OAUTH_URL, 
                headers=headers, 
                data={"grant_type": "client_credentials", "scope": "cob.write pix.read"},
                params={"gw-dev-app-key": BB_DEV_APP_KEY}
            )
            
            if resp.status_code == 200:
                token = resp.json().get("access_token", "")
                return {
                    "sucesso": True, 
                    "ambiente": BB_ENV.upper(),
                    "mensagem": "Ligação com o Banco do Brasil estabelecida com sucesso!",
                    "token_recebido": token[:15] + "... (oculto por segurança)"
                }
            else:
                return {"sucesso": False, "erro": resp.text, "status_code": resp.status_code}
                
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}
    finally:
        # Limpeza de segurança dos certificados temporários
        if pub_path and os.path.exists(pub_path): os.remove(pub_path)
        if priv_path and os.path.exists(priv_path): os.remove(priv_path)

@router.post("/api/v1/pagamentos/carteira-bb")
async def processar_carteira_bb(pedido: PedidoCarteiraGratuita): 
    pub_path, priv_path = obter_certificados_mtls()
    try:
        # 1. Gera um TXID rigoroso: 30 caracteres
        caracteres_txid = string.ascii_letters + string.digits
        txid = ''.join(random.choices(caracteres_txid, k=30))
        
        # --- CÁLCULO DO VALOR ---
        # Como queres testar com 1 cêntimo por pessoa, preco_unitario = 0.01
        # (Quando fores para produção real, muda apenas este 0.01 para 20.00)
        preco_unitario = 0.01
        valor_carteira = preco_unitario * (pedido.quantidade or 1)
        
        tax_id_limpo = pedido.cpf_cliente.replace(".", "").replace("-", "")

        auth_string = f"{BB_CLIENT_ID}:{BB_CLIENT_SECRET}"
        auth_b64 = base64.b64encode(auth_string.encode()).decode("utf-8")
        
        token_headers = {
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        client_kwargs = {}
        if pub_path and priv_path:
            client_kwargs["cert"] = (pub_path, priv_path)
            
        async with httpx.AsyncClient(**client_kwargs) as client:
            # 2. Forçar URL de Produção para o Token
            oauth_url_oficial = "https://oauth.bb.com.br/oauth/token"
            
            resp_token = await client.post(
                oauth_url_oficial, 
                headers=token_headers, 
                data={"grant_type": "client_credentials", "scope": "cob.write pix.read"},
                params={"gw-dev-app-key": BB_DEV_APP_KEY}
            )
            
            if resp_token.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Falha na autenticação bancária: {resp_token.text}")
                
            access_token = resp_token.json()["access_token"]

            # 3. Preparar a chamada da Cobrança Pix
            cob_headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            
            payload_cob = {
                "calendario": { "expiracao": 600 },
                "devedor": { 
                    "cpf": tax_id_limpo, 
                    "nome": pedido.nome_cliente[:80] 
                },
                "valor": { "original": f"{valor_carteira:.2f}" },
                "chave": BB_PIX_KEY,
                "solicitacaoPagador": f"Taxa Carteira Digital SGA ({pedido.quantidade or 1}x)"
            }

            # 4. Cria a cobrança usando a variável global
            url_cob = f"{BB_API_URL}/cob/{txid}"

            resp_cob = await client.put(
                url_cob,
                headers=cob_headers,
                json=payload_cob,
                params={"gw-dev-app-key": BB_DEV_APP_KEY}
            )

            if resp_cob.status_code not in [200, 201]:
                raise HTTPException(status_code=500, detail=f"Erro no BB: {resp_cob.text}")

            dados_cob = resp_cob.json()
            pix_copia_cola = dados_cob.get("pixCopiaECola")
            
            # 5. GERAR A IMAGEM DO QR CODE
            qr = qrcode.QRCode(box_size=8, border=2)
            qr.add_data(pix_copia_cola)
            qr.make(fit=True)
            img_qr = qr.make_image(fill_color="black", back_color="white")
            
            buffered = BytesIO()
            img_qr.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
            qr_data_uri = f"data:image/png;base64,{img_base64}"

            # 6. Registo na Base de Dados Supabase
            pedido_db = {
                "codigo_pedido": txid,
                "tipo_item": "carteira",
                "nome_cliente": pedido.nome_cliente,
                "cpf_cliente": tax_id_limpo,
                "email_cliente": pedido.email_cliente,
                "telefone_cliente": pedido.telefone_cliente,
                "valor_total": valor_carteira,
                "status_pagamento": "aguardando",
                "metodo_pagamento": "pix",
                "quantidade": pedido.quantidade or 1,
                "nome_item": f"Taxa de Emissão - Carteira Digital ({pedido.quantidade or 1}x)",
                "item_id": pedido.token_id,
                "foto_url": pedido.foto_url,
                "data_nascimento": pedido.data_nascimento
            }
            supabase.table("pedidos").insert(pedido_db).execute()

            # Retorna com a imagem do QR Code em Base64
            return {
                "sucesso": True,
                "codigo_pedido": txid,
                "metodo": "pix",
                "pix_copia_cola": pix_copia_cola,
                "pix_qrcode_img": qr_data_uri 
            }

    except Exception as e:
        print(f"ERRO BB COBRANÇA: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if pub_path and os.path.exists(pub_path): os.remove(pub_path)
        if priv_path and os.path.exists(priv_path): os.remove(priv_path)