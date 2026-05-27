from fastapi import APIRouter, Request, HTTPException
import os
import uuid
from datetime import datetime
from supabase import create_client, Client

from app.services.pdf_service import gerar_pdf_carteira, gerar_pdf_voucher
from app.services.email_service import (
    enviar_carteiras_por_email,
    enviar_voucher_hotel,
    enviar_voucher_pacote,
    enviar_voucher_passeio,
    enviar_notificacao_hotel_pacote,  # ◄── Nova automação para o Hotel
    enviar_balanco_secretaria         # ◄── Nova automação para a Prefeitura
)

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.post("/api/v1/webhooks/pagbank")
async def webhook_pagbank(request: Request):
    try:
        payload = await request.json()
        print(f"--- [WEBHOOK RECEBIDO] ---")
        
        charges = payload.get("charges", [])
        primeira_charge = charges[0] if charges else {}

        reference_id = (
            payload.get("reference_id")
            or payload.get("data", {}).get("reference_id")
            or primeira_charge.get("reference_id")
            or payload.get("id") 
        )

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

        res_pedido = supabase.table("pedidos").select("*").eq("codigo_pedido", reference_id).single().execute()
        
        if not res_pedido.data:
            print(f"[WEBHOOK] AVISO: Pedido {reference_id} ignorado (não consta na base).")
            return {"status": "ok", "message": "Pedido inexistente"}
            
        pedido = res_pedido.data

        if pedido.get("status_pagamento") == "pago":
            return {"status": "ok", "message": "Pagamento já processado anteriormente"}

        status_sucesso = ["PAID", "AUTHORIZED", "COMPLETED", "APPROVED"]
        
        if status_normalizado in status_sucesso:
            # 1. Atualiza o pedido para Pago
            supabase.table("pedidos").update({
                "status_pagamento": "pago"
            }).eq("codigo_pedido", reference_id).execute()
            
            # 2. ◄── NOVA SINCRONIZAÇÃO: Atualiza os repasses financeiros para 'pago' ──►
            supabase.table("repasses_financeiros").update({
                "status_repasse": "pago"
            }).eq("pedido_id", pedido.get("id")).execute()
            
            print(f"[WEBHOOK] SUCESSO: O pagamento de {reference_id} e os repasses foram confirmados.")

            tipo = pedido.get("tipo_item")
            email_cliente = pedido.get("email_cliente")
            nome_cliente = pedido.get("nome_cliente")
            
            # ────────────────────────────────────────────────────────
            # CASO A: CARTEIRA DIGITAL DE RESIDENTE (E-MAIL CORRIGIDO)
            # ────────────────────────────────────────────────────────
            if tipo == "carteira":
                token_id = pedido.get("item_id") 
                residentes_encontrados = []

                if token_id:
                    res_res = supabase.table("rd_residentes").select("*").eq("id", token_id).execute()
                    if not res_res.data:
                        res_res = supabase.table("rd_residentes").select("*").eq("qrcode_token", token_id).execute()
                    residentes_encontrados = res_res.data
                
                if not residentes_encontrados:
                    res_res = supabase.table("rd_residentes").select("*").eq("cpf", pedido.get("cpf_cliente")).execute()
                    residentes_encontrados = res_res.data

                if residentes_encontrados:
                    caminhos_pdfs = []
                    email_real_destino = email_cliente
                    nome_real_destino = nome_cliente

                    for res in residentes_encontrados:
                        supabase.table("rd_residentes").update({"status": "ativo"}).eq("id", res["id"]).execute()
                        
                        if res.get("email"):
                            email_real_destino = res["email"]
                        if res.get("nome_completo"):
                            nome_real_destino = res["nome_completo"]

                        try:
                            dados_pdf = {
                                "nome": res.get("nome_completo") or res.get("nome", "Residente Oficial"),
                                "cpf": res.get("cpf", pedido.get("cpf_cliente")),
                                "data_nascimento": res.get("data_nascimento", "--/--/----"),
                                "foto_url": res.get("foto_url")
                            }
                            caminho_pdf = gerar_pdf_carteira(dados_pdf, res.get("qrcode_token") or res["id"])
                            if caminho_pdf:
                                caminhos_pdfs.append(caminho_pdf)
                        except Exception as e_pdf:
                            print(f"[WEBHOOK] Erro ao gerar PDF da carteira: {e_pdf}")
                    
                    if caminhos_pdfs:
                        try:
                            enviar_carteiras_por_email(email_real_destino, nome_real_destino, caminhos_pdfs)
                            print(f"[WEBHOOK] Carteira c/ PDF enviada com sucesso para o morador: {email_real_destino}")
                        except Exception as e_email:
                            print(f"[WEBHOOK] Erro ao enviar e-mail das carteiras: {e_email}")
                else:
                    print(f"[WEBHOOK] Carteira Paga, mas nenhum registo de residente encontrado para o token {token_id}")

            # ────────────────────────────────────────────────────────
            # CASO B: RESERVA AVULSA DE HOTEL
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
                    caminho_pdf = gerar_pdf_voucher(pedido, dados_reserva)
                    enviar_voucher_hotel(email_cliente, nome_cliente, dados_reserva, caminho_pdf)
                    print(f"[WEBHOOK] Voucher de Hotel c/ PDF enviado com sucesso para {email_cliente}")
                except Exception as e_mail:
                    print(f"[WEBHOOK] Erro ao disparar voucher do hotel: {e_mail}")

            # ────────────────────────────────────────────────────────
            # CASO C: COMPRA DE PACOTE TURÍSTICO COMPÓSITO
            # ────────────────────────────────────────────────────────
            elif tipo == "pacote":
                pacote_id = pedido.get("item_id")
                nome_pacote = "Pacote de Expedição SagaTurismo"
                nome_hotel = "Alojamento Oficial Incluso"
                email_hotel_destino = None  # ◄── Armazenará o email do hotel
                nome_guia = "Guia Credenciado Atribuído"
                ponto_encontro = "Centro de Atendimento ao Turista (CAT) de São Geraldo do Araguaia."

                try:
                    res_p = supabase.table("pacotes").select("titulo, roteiro_detalhado").eq("id", pacote_id).execute()
                    if res_p.data and len(res_p.data) > 0:
                        nome_pacote = res_p.data[0].get("titulo", nome_pacote)

                    # Busca o hotel com segurança e captura o e-mail cadastrado dele
                    hotel_id_pedido = pedido.get("hotel_id")
                    if hotel_id_pedido:
                        res_h = supabase.table("hoteis").select("nome, email").eq("id", hotel_id_pedido).execute()
                        if res_h.data and len(res_h.data) > 0: 
                            nome_hotel = res_h.data[0].get("nome")
                            email_hotel_destino = res_h.data[0].get("email")

                    guia_id_pedido = pedido.get("guia_id")
                    if guia_id_pedido:
                        res_g = supabase.table("guias").select("nome").eq("id", guia_id_pedido).execute()
                        if res_g.data and len(res_g.data) > 0: 
                            nome_guia = res_g.data[0].get("nome")

                except Exception as e_db:
                    print(f"[WEBHOOK PACOTE] Aviso na mineração de dados relacionais: {e_db}")

                dados_pacote = {
                    "nome_pacote": nome_pacote,
                    "checkin": pedido.get("data_checkin"),
                    "checkout": pedido.get("data_checkout"),
                    "nome_hotel": nome_hotel,
                    "nome_guia": nome_guia,
                    "ponto_encontro": ponto_encontro
                }

                # Envia o voucher normal do Cliente
                try:
                    caminho_pdf = gerar_pdf_voucher(pedido, dados_pacote)
                    enviar_voucher_pacote(email_cliente, nome_cliente, dados_pacote, caminho_pdf)
                    print(f"[WEBHOOK] Voucher do Pacote c/ PDF enviado para {email_cliente}")
                except Exception as e_mail:
                    print(f"[WEBHOOK] Erro ao disparar voucher do pacote: {e_mail}")

                # ◄── NOVIDADE: DISPARO DE E-MAILS DE PARCEIROS (ITEM 4) ──►
                try:
                    # 1. Lógica matemática de diárias
                    d_in = datetime.strptime(pedido.get("data_checkin"), "%Y-%m-%d")
                    d_out = datetime.strptime(pedido.get("data_checkout"), "%Y-%m-%d")
                    m_diarias = max(1, (d_out - d_in).days)
                    n_pessoas = pedido.get("quantidade_pessoas", 2)

                    # 2. Enviar e-mail de alerta para o Hotel
                    if email_hotel_destino:
                        enviar_notificacao_hotel_pacote(
                            email_hotel=email_hotel_destino,
                            nome_hotel=nome_hotel,
                            nome_hospede=nome_cliente,
                            data_checkin=pedido.get("data_checkin"),
                            nome_pacote=nome_pacote,
                            diarias=m_diarias,
                            pessoas=n_pessoas
                        )
                    else:
                        print(f"[WEBHOOK AVISO] Hotel {nome_hotel} não possui e-mail cadastrado para notificações.")

                    # 3. Enviar e-mail de balanço para a Secretaria de Turismo
                    email_secretaria = os.environ.get("EMAIL_SECRETARIA", "turismo@saogeraldo.pa.gov.br")
                    enviar_balanco_secretaria(
                        email_secretaria=email_secretaria,
                        nome_pacote=nome_pacote,
                        valor_venda=pedido.get("valor_total", 0.0),
                        nome_cliente=nome_cliente,
                        codigo_pedido=reference_id
                    )

                except Exception as e_parceiros:
                    print(f"[WEBHOOK PARCEIROS] Falha ao processar notificações de e-mail: {e_parceiros}")

            # ────────────────────────────────────────────────────────
            # CASO D: COMPRA DE PASSEIO AVULSO
            # ────────────────────────────────────────────────────────
            elif tipo == "passeio":
                passeio_id = pedido.get("item_id")
                nome_passeio = "Passeio Ecológico Oficial"
                nome_guia = "Guia de Turismo Credenciado"
                contato_guia = "Disponível via Central SagaTurismo"
                endereco_local = "Orla de São Geraldo do Araguaia - Ponto de Embarque Oficial"

                try:
                    res_pass = supabase.table("passeios").select("titulo, guia_id, ponto_encontro").eq("id", passeio_id).execute()
                    if res_pass.data and len(res_pass.data) > 0:
                        nome_passeio = res_pass.data[0].get("titulo", nome_passeio)
                        if res_pass.data[0].get("ponto_encontro"):
                            endereco_local = res_pass.data[0].get("ponto_encontro")
                        
                        g_id = res_pass.data[0].get("guia_id") or pedido.get("guia_id")
                        
                        if g_id:
                            res_g = supabase.table("guias").select("nome, whatsapp").eq("id", g_id).execute()
                            if res_g.data and len(res_g.data) > 0:
                                nome_guia = res_g.data[0].get("nome", nome_guia)
                                contato_guia = res_g.data[0].get("whatsapp", contato_guia)
                except Exception as e_db:
                    print(f"[WEBHOOK PASSEIO] Aviso ao ler a tabela de passeios/guias: {e_db}")

                dados_passeio = {
                    "nome_passeio": nome_passeio,
                    "data_hora": pedido.get("data_checkin") or "Agendado (Consultar painel)",
                    "endereco": endereco_local,
                    "nome_guia": nome_guia,
                    "contato_guia": contato_guia
                }

                try:
                    caminho_pdf = gerar_pdf_voucher(pedido, dados_passeio)
                    enviar_voucher_passeio(email_cliente, nome_cliente, dados_passeio, caminho_pdf)
                    print(f"[WEBHOOK] Voucher de Passeio c/ PDF enviado com sucesso para {email_cliente}")
                except Exception as e_mail:
                    print(f"[WEBHOOK] Erro ao disparar voucher do passeio: {e_mail}")

                    
        elif status_normalizado in ["DECLINED", "CANCELED", "REFUNDED"]:
            supabase.table("pedidos").update({"status_pagamento": "recusado"}).eq("codigo_pedido", reference_id).execute()
            print(f"[WEBHOOK] Pagamento {reference_id} marcado como RECUSADO.")

        return {"status": "ok"}

    except Exception as e:
        print(f"[WEBHOOK ERRO] Falha crítica: {str(e)}")
        return {"status": "ok", "error": "Internal process handled"}