from fastapi import APIRouter, Request, HTTPException
import os
import uuid
from datetime import datetime
from supabase import create_client, Client

# ◄── IMPORTAÇÃO DE TODAS AS FUNÇÕES DO MOTOR DE E-MAILS TRANSACIONAIS (COM VOUCHER PDF)
from app.services.pdf_service import gerar_pdf_carteira, gerar_pdf_voucher
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
            # CASO A: CARTEIRA DIGITAL DE RESIDENTE (ATUALIZADO)
            # ────────────────────────────────────────────────────────
            if tipo == "carteira":
                token_id = pedido.get("item_id") # O token foi guardado aqui no pagamentos.py
                residentes_encontrados = []

                # Tenta procurar diretamente pelo Token (ID único)
                if token_id:
                    res_res = supabase.table("rd_residentes").select("*").eq("id", token_id).execute()
                    if not res_res.data:
                        # Fallback caso o token seja a chave do QRCode
                        res_res = supabase.table("rd_residentes").select("*").eq("qrcode_token", token_id).execute()
                    residentes_encontrados = res_res.data
                
                # Se não encontrar pelo token, usa o CPF como salva-vidas
                if not residentes_encontrados:
                    res_res = supabase.table("rd_residentes").select("*").eq("cpf", pedido.get("cpf_cliente")).execute()
                    residentes_encontrados = res_res.data

                if residentes_encontrados:
                    caminhos_pdfs = []
                    for res in residentes_encontrados:
                        # Atualiza o residente para "ativa" (é o que o frontend espera)
                        supabase.table("rd_residentes").update({"status": "ativa"}).eq("id", res["id"]).execute()
                        try:
                            # Prepara os dados para o PDF
                            dados_pdf = {
                                "nome": res.get("nome_completo") or res.get("nome", "Residente Oficial"),
                                "cpf": res.get("cpf", pedido.get("cpf_cliente")),
                                "data_nascimento": res.get("data_nascimento", "--/--/----"),
                                "foto_url": res.get("foto_url")
                            }
                            # Gera o PDF
                            caminho_pdf = gerar_pdf_carteira(dados_pdf, res.get("qrcode_token") or res["id"])
                            if caminho_pdf:
                                caminhos_pdfs.append(caminho_pdf)
                        except Exception as e_pdf:
                            print(f"[WEBHOOK] Erro ao gerar PDF da carteira: {e_pdf}")
                    
                    # Dispara o email
                    if caminhos_pdfs:
                        try:
                            enviar_carteiras_por_email(email_cliente, nome_cliente, caminhos_pdfs)
                            print(f"[WEBHOOK] Carteira(s) c/ PDF enviada(s) com sucesso para {email_cliente}")
                        except Exception as e_email:
                            print(f"[WEBHOOK] Erro ao enviar e-mail das carteiras: {e_email}")
                else:
                    print(f"[WEBHOOK] Carteira Paga, mas nenhum registo de residente encontrado para o token {token_id}")

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
                    # ◄── GERA O PDF E GUARDA O CAMINHO
                    caminho_pdf = gerar_pdf_voucher(pedido, dados_reserva)
                    
                    # ◄── ENVIA O EMAIL PASSANDO O CAMINHO DO PDF PARA ANEXO
                    enviar_voucher_hotel(email_cliente, nome_cliente, dados_reserva, caminho_pdf)
                    print(f"[WEBHOOK] Voucher de Hotel c/ PDF enviado com sucesso para {email_cliente}")
                except Exception as e_mail:
                    print(f"[WEBHOOK] Erro ao disparar voucher do hotel: {e_mail}")

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
                        res_g = supabase.table("parceiros").select("nome_negocio").eq("id", pedido.get("guia_id")).single().execute()
                        if res_g.data: nome_guia = res_g.data.get("nome_negocio")
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
                    # ◄── GERA O PDF E GUARDA O CAMINHO
                    caminho_pdf = gerar_pdf_voucher(pedido, dados_pacote)
                    
                    # ◄── ENVIA O EMAIL PASSANDO O CAMINHO DO PDF PARA ANEXO
                    enviar_voucher_pacote(email_cliente, nome_cliente, dados_pacote, caminho_pdf)
                    print(f"[WEBHOOK] Voucher do Pacote c/ PDF enviado para {email_cliente}")
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
                    res_pass = supabase.table("passeios").select("titulo, guia_id, ponto_encontro").eq("id", passeio_id).single().execute()
                    if res_pass.data:
                        nome_passeio = res_pass.data.get("titulo", nome_passeio)
                        endereco_local = res_pass.data.get("ponto_encontro") or "Orla de São Geraldo do Araguaia - Ponto de Embarque Oficial"
                        g_id = res_pass.data.get("guia_id") or pedido.get("guia_id")
                        
                        if g_id:
                            res_g = supabase.table("parceiros").select("nome_negocio, telefone").eq("id", g_id).single().execute()
                            if res_g.data:
                                nome_guia = res_g.data.get("nome_negocio", nome_guia)
                                contato_guia = res_g.data.get("telefone", contato_guia)
                except Exception as e_db:
                    print(f"[WEBHOOK PASSEIO] Falha ao ler a tabela de passeios/parceiros: {e_db}")

                dados_passeio = {
                    "nome_passeio": nome_passeio,
                    "data_hora": pedido.get("data_checkin") or "Agendado (Consultar painel)",
                    "endereco": endereco_local if 'endereco_local' in locals() else "Orla de São Geraldo do Araguaia",
                    "nome_guia": nome_guia,
                    "contato_guia": contato_guia
                }

                try:
                    # ◄── GERA O PDF E GUARDA O CAMINHO
                    caminho_pdf = gerar_pdf_voucher(pedido, dados_passeio)
                    
                    # ◄── ENVIA O EMAIL PASSANDO O CAMINHO DO PDF PARA ANEXO
                    enviar_voucher_passeio(email_cliente, nome_cliente, dados_passeio, caminho_pdf)
                    print(f"[WEBHOOK] Voucher de Passeio c/ PDF enviado com sucesso para {email_cliente}")
                except Exception as e_mail:
                    print(f"[WEBHOOK] Erro ao disparar voucher do passeio: {e_email}")

        elif status_normalizado in ["DECLINED", "CANCELED", "REFUNDED"]:
            supabase.table("pedidos").update({"status_pagamento": "recusado"}).eq("codigo_pedido", reference_id).execute()
            print(f"[WEBHOOK] Pagamento {reference_id} marcado como RECUSADO.")

        return {"status": "ok"}

    except Exception as e:
        print(f"[WEBHOOK ERRO] Falha crítica: {str(e)}")
        return {"status": "ok", "error": "Internal process handled"}