from fastapi import APIRouter, Request, HTTPException
import os
import uuid
from datetime import datetime
from supabase import create_client, Client

# ◄── IMPORTAÇÃO DE TODAS AS FUNÇÕES DO MOTOR DE E-MAILS TRANSACIONAIS
from app.services.pdf_service import gerar_pdf_carteira
from app.services.email_service import (
    enviar_carteiras_por_email,
    enviar_voucher_hotel,
    enviar_voucher_pacote,
    enviar_voucher_passeio
)

router = APIRouter()

# 1. Configurações de Ambiente
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.post("/api/v1/webhooks/pagbank")
async def webhook_pagbank(request: Request):
    try:
        # 1. Receber e Logar o Payload
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
            # A. Atualiza o status geral do pedido para "pago"
            supabase.table("pedidos").update({
                "status_pagamento": "pago"
            }).eq("codigo_pedido", reference_id).execute()
            
            print(f"[WEBHOOK] SUCESSO: O pagamento de {reference_id} foi confirmado.")

            # B. Lógica de Disparos de Negócio baseados no Tipo de Item
            tipo = pedido.get("tipo_item")
            email_cliente = pedido.get("email_cliente")
            nome_cliente = pedido.get("nome_cliente")
            
            # ────────────────────────────────────────────────────────
            # CASO A: CARTEIRA DIGITAL DE RESIDENTE
            # ────────────────────────────────────────────────────────
            if tipo == "carteira":
                res_residentes = supabase.table("rd_residentes").select("*").eq("email", email_cliente).eq("status", "aguardando_pagamento").execute()
                residentes_pendentes = res_residentes.data

                if not residentes_pendentes:
                    res_residentes = supabase.table("rd_residentes").select("*").eq("cpf", pedido.get("cpf_cliente")).eq("status", "aguardando_pagamento").execute()
                    residentes_pendentes = res_residentes.data

                if residentes_pendentes:
                    caminhos_pdfs = []
                    for res in residentes_pendentes:
                        supabase.table("rd_residentes").update({"status": "ativo"}).eq("id", res["id"]).execute()
                        try:
                            dados_pdf = {
                                "nome": res["nome_completo"],
                                "cpf": res["cpf"],
                                "data_nascimento": res["data_nascimento"],
                                "foto_url": res["foto_url"]
                            }
                            caminho_pdf = gerar_pdf_carteira(dados_pdf, res["qrcode_token"])
                            if caminho_pdf:
                                caminhos_pdfs.append(caminho_pdf)
                        except Exception as e_pdf:
                            print(f"[WEBHOOK] Erro ao gerar PDF da carteira: {e_pdf}")
                    
                    try:
                        enviar_carteiras_por_email(email_cliente, nome_cliente, caminhos_pdfs)
                    except Exception as e_email:
                        print(f"[WEBHOOK] Erro ao enviar e-mail das carteiras: {e_email}")
                else:
                    print(f"[WEBHOOK] Carteira Paga, mas nenhum registo 'aguardando_pagamento' encontrado para {email_cliente}")

            # ────────────────────────────────────────────────────────
            # CASO B: RESERVA AVULSA DE HOTEL (AÇÃO 1)
            # ────────────────────────────────────────────────────────
            elif tipo == "hotel":
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
                except Exception as e_db:
                    print(f"[WEBHOOK HOTEL] Falha ao extrair metadados do alojamento: {e_db}")

                dados_reserva = {
                    "nome_hotel": nome_hotel,
                    "checkin": pedido.get("data_checkin"),
                    "checkout": pedido.get("data_checkout"),
                    "tipo_quarto": pedido.get("tipo_quarto", "standard"),
                    "quantidade_pessoas": pedido.get("quantidade_pessoas", 2),
                    "politicas": politicas_texto
                }
                
                try:
                    enviar_voucher_hotel(email_cliente, nome_cliente, dados_reserva)
                    print(f"[WEBHOOK] Voucher de Hotel enviado com sucesso para {email_cliente}")
                except Exception as e_mail:
                    print(f"[WEBHOOK] Erro ao disparar voucher do hotel: {e_email}")

            # ────────────────────────────────────────────────────────
            # CASO C: COMPRA DE PACOTE TURÍSTICO COMPÓSITO (AÇÃO 2)
            # ────────────────────────────────────────────────────────
            elif tipo == "pacote":
                pacote_id = pedido.get("item_id")
                nome_pacote = "Pacote de Expedição SagaTurismo"
                nome_hotel = "Alojamento Oficial Incluso"
                nome_guia = "Guia Credenciado Atribuído"
                ponto_encontro = "Centro de Atendimento ao Turista (CAT) de São Geraldo do Araguaia."

                try:
                    res_p = supabase.table("pacotes").select("titulo, roteiro_detalhado").eq("id", pacote_id).single().execute()
                    if res_p.data:
                        nome_pacote = res_p.data.get("titulo", nome_pacote)

                    if pedido.get("hotel_id"):
                        res_h = supabase.table("hoteis").select("nome").eq("id", pedido.get("hotel_id")).single().execute()
                        if res_h.data: nome_hotel = res_h.data.get("nome")

                    if pedido.get("guia_id"):
                        res_g = supabase.table("guias").select("nome").eq("id", pedido.get("guia_id")).single().execute()
                        if res_g.data: nome_guia = res_g.data.get("nome")
                except Exception as e_db:
                    print(f"[WEBHOOK PACOTE] Erro ao minerar dados relacionais: {e_db}")

                dados_pacote = {
                    "nome_pacote": nome_pacote,
                    "checkin": pedido.get("data_checkin"),
                    "checkout": pedido.get("data_checkout"),
                    "nome_hotel": nome_hotel,
                    "nome_guia": nome_guia,
                    "ponto_encontro": ponto_encontro
                }

                try:
                    enviar_voucher_pacote(email_cliente, nome_cliente, dados_pacote)
                    print(f"[WEBHOOK] Voucher do Pacote Oficial enviado para {email_cliente}")
                except Exception as e_mail:
                    print(f"[WEBHOOK] Erro ao disparar voucher do pacote: {e_email}")

            # ────────────────────────────────────────────────────────
            # CASO D: COMPRA DE PASSEIO AVULSO (AÇÃO 3)
            # ────────────────────────────────────────────────────────
            elif tipo == "passeio":
                passeio_id = pedido.get("item_id")
                nome_passeio = "Passeio Ecológico Oficial"
                nome_guia = "Guia de Turismo Credenciado"
                contato_guia = "Disponível via Central SagaTurismo"

                try:
                    res_pass = supabase.table("passeios").select("nome, guia_id").eq("id", passeio_id).single().execute()
                    if res_pass.data:
                        nome_passeio = res_pass.data.get("nome", nome_passeio)
                        g_id = res_pass.data.get("guia_id") or pedido.get("guia_id")
                        
                        if g_id:
                            res_g = supabase.table("guias").select("nome, telefone").eq("id", g_id).single().execute()
                            if res_g.data:
                                nome_guia = res_g.data.get("nome", nome_guia)
                                contato_guia = res_g.data.get("telefone", contato_guia)
                except Exception as e_db:
                    print(f"[WEBHOOK PASSEIO] Falha ao ler a tabela de passeios/guias: {e_db}")

                dados_passeio = {
                    "nome_passeio": nome_passeio,
                    "data_hora": pedido.get("data_checkin") or "Agendado (Consultar painel)",
                    "endereco": "Orla de São Geraldo do Araguaia - Ponto de Embarque Oficial",
                    "nome_guia": nome_guia,
                    "contato_guia": contato_guia
                }

                try:
                    enviar_voucher_passeio(email_cliente, nome_cliente, dados_passeio)
                    print(f"[WEBHOOK] Voucher de Passeio enviado com sucesso para {email_cliente}")
                except Exception as e_mail:
                    print(f"[WEBHOOK] Erro ao disparar voucher do passeio: {e_email}")

        elif status_normalizado in ["DECLINED", "CANCELED", "REFUNDED"]:
            supabase.table("pedidos").update({"status_pagamento": "recusado"}).eq("codigo_pedido", reference_id).execute()
            print(f"[WEBHOOK] Pagamento {reference_id} marcado como RECUSADO.")

        return {"status": "ok"}

    except Exception as e:
        print(f"[WEBHOOK ERRO] Falha crítica: {str(e)}")
        return {"status": "ok", "error": "Internal process handled"}