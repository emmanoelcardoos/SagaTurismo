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
    enviar_voucher_passeio
)

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.post("/api/v1/webhooks/asaas")
async def webhook_asaas(request: Request):
    try:
        payload = await request.json()
        print(f"--- [WEBHOOK ASAAS RECEBIDO] ---")
        
        # O Asaas envia o tipo de evento e os dados dentro da chave "payment"
        evento = payload.get("event", "")
        payment_data = payload.get("payment", {})

        # No pagamentos.py, nós enviámos o nosso codigo_pedido (SAGA-XXXX) no 'externalReference'
        reference_id = payment_data.get("externalReference")
        asaas_payment_id = payment_data.get("id")

        status_normalizado = payment_data.get("status", "").upper()
        print(f"[WEBHOOK] Evento: {evento} | Referência: {reference_id} | Status: {status_normalizado}")

        # Se não vier o reference_id, tentamos usar o ID do pagamento como fallback
        if not reference_id:
            reference_id = asaas_payment_id

        if not reference_id:
            return {"status": "error", "message": "Reference ID e Payment ID ausentes no payload."}

        # Tenta buscar pelo código SAGA-XXX ou pelo ID pay_XXX
        res_pedido = supabase.table("pedidos").select("*").or_(f"codigo_pedido.eq.{reference_id},codigo_pedido.eq.{asaas_payment_id}").maybe_single().execute()
        
        if not res_pedido.data:
            print(f"[WEBHOOK] AVISO: Pedido {reference_id} ignorado (não consta na base de dados).")
            return {"status": "ok", "message": "Pedido inexistente"}
            
        pedido = res_pedido.data

        if pedido.get("status_pagamento") == "pago":
            return {"status": "ok", "message": "Pagamento já processado anteriormente"}

        # Eventos do Asaas que significam "Dinheiro na conta"
        eventos_sucesso = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_DUNNING_RECEIVED"]
        
        if evento in eventos_sucesso or status_normalizado in ["CONFIRMED", "RECEIVED"]:
            
            # 1. Atualiza o status do pedido na tabela 'pedidos'
            supabase.table("pedidos").update({
                "status_pagamento": "pago"
            }).eq("id", pedido.get("id")).execute()
            
            # 2. Atualiza os repasses financeiros para o painel dos parceiros
            supabase.table("repasses_financeiros").update({
                "status_repasse": "pago"
            }).eq("pedido_id", pedido.get("id")).execute()
            
            print(f"[WEBHOOK] SUCESSO: O pagamento de {pedido.get('codigo_pedido')} foi confirmado.")

            tipo = pedido.get("tipo_item")
            email_cliente = pedido.get("email_cliente")
            nome_cliente = pedido.get("nome_cliente")
            
            # ────────────────────────────────────────────────────────
            # CASO A: CARTEIRA DIGITAL DE RESIDENTE
            # ────────────────────────────────────────────────────────
            if tipo == "carteira":
                token_id = pedido.get("item_id") 
                residentes_encontrados = []

                if token_id:
                    # Busca o titular
                    titular_res = supabase.table("rd_residentes").select("*").eq("id", token_id).execute()
                    # Busca os dependentes amarrados ao titular
                    deps_res = supabase.table("rd_residentes").select("*").eq("titular_id", token_id).execute()
                    
                    # Junta todos os encontrados
                    residentes_encontrados = (titular_res.data or []) + (deps_res.data or [])
                
                # Se mesmo assim falhar (backup de segurança via CPF)
                if not residentes_encontrados:
                    res_res = supabase.table("rd_residentes").select("*").eq("cpf", pedido.get("cpf_cliente")).execute()
                    residentes_encontrados = res_res.data or []

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
            # CASO C: COMPRA DE PACOTE TURÍSTICO
            # ────────────────────────────────────────────────────────
            elif tipo == "pacote":
                pacote_id = pedido.get("item_id")
                nome_pacote = "Pacote de Expedição SagaTurismo"
                nome_hotel = "Alojamento Oficial Incluso"
                nome_guia = "Guia Credenciado Atribuído"
                ponto_encontro = "Centro de Atendimento ao Turista (CAT) de São Geraldo do Araguaia."

                try:
                    res_p = supabase.table("pacotes").select("titulo, roteiro_detalhado").eq("id", pacote_id).execute()
                    if res_p.data and len(res_p.data) > 0:
                        nome_pacote = res_p.data[0].get("titulo", nome_pacote)

                    hotel_id_pedido = pedido.get("hotel_id")
                    if hotel_id_pedido:
                        res_h = supabase.table("hoteis").select("nome").eq("id", hotel_id_pedido).execute()
                        if res_h.data and len(res_h.data) > 0: 
                            nome_hotel = res_h.data[0].get("nome")

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

                try:
                    caminho_pdf = gerar_pdf_voucher(pedido, dados_pacote)
                    enviar_voucher_pacote(email_cliente, nome_cliente, dados_pacote, caminho_pdf)
                    print(f"[WEBHOOK] Voucher do Pacote c/ PDF enviado para {email_cliente}")
                except Exception as e_mail:
                    print(f"[WEBHOOK] Erro ao disparar voucher do pacote: {e_mail}")

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

        # Tratamento de recusas e falhas
        elif evento in ["PAYMENT_DELETED", "PAYMENT_OVERDUE", "PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_REPROVED"]:
            supabase.table("pedidos").update({"status_pagamento": "recusado"}).eq("id", pedido.get("id")).execute()
            print(f"[WEBHOOK] Pagamento {pedido.get('codigo_pedido')} marcado como RECUSADO/CANCELADO.")

        return {"status": "ok"}

    except Exception as e:
        print(f"[WEBHOOK ERRO] Falha crítica: {str(e)}")
        return {"status": "ok", "error": "Internal process handled"}

@router.post("/api/v1/webhooks/bb")
async def webhook_bb(request: Request):
    try:
        payload = await request.json()
        print("--- [WEBHOOK BANCO DO BRASIL RECEBIDO] ---")
        
        # O Banco do Brasil envia os pagamentos confirmados dentro de uma lista chamada "pix"
        pagamentos_pix = payload.get("pix", [])
        
        for pix in pagamentos_pix:
            txid = pix.get("txid")
            
            if not txid:
                continue
                
            print(f"[WEBHOOK BB] Confirmação de Pix Recebida! TXID: {txid}")
            
            # 1. Procura o pedido na base de dados pelo código SAGA (txid)
            res_pedido = supabase.table("pedidos").select("*").eq("codigo_pedido", txid).maybe_single().execute()
            
            if not res_pedido.data:
                print(f"[WEBHOOK BB] Pedido {txid} não encontrado na base de dados.")
                continue
                
            pedido = res_pedido.data
            
            # Se já estiver pago, ignora para não enviar e-mails duplicados
            if pedido.get("status_pagamento") == "pago":
                continue
                
            # 2. Atualiza o status do pedido para "pago"
            supabase.table("pedidos").update({
                "status_pagamento": "pago"
            }).eq("id", pedido["id"]).execute()
            
            print(f"[WEBHOOK BB] SUCESSO: O pedido {txid} foi marcado como pago!")
            
            # 3. Lógica de Emissão (Carteira Digital)
            tipo = pedido.get("tipo_item")
            email_cliente = pedido.get("email_cliente")
            nome_cliente = pedido.get("nome_cliente")
            
            if tipo == "carteira":
                token_id = pedido.get("item_id") 
                residentes_encontrados = []

                if token_id:
                    titular_res = supabase.table("rd_residentes").select("*").eq("id", token_id).execute()
                    deps_res = supabase.table("rd_residentes").select("*").eq("titular_id", token_id).execute()
                    residentes_encontrados = (titular_res.data or []) + (deps_res.data or [])
                
                if not residentes_encontrados:
                    res_res = supabase.table("rd_residentes").select("*").eq("cpf", pedido.get("cpf_cliente")).execute()
                    residentes_encontrados = res_res.data or []

                if residentes_encontrados:
                    caminhos_pdfs = []
                    email_real_destino = email_cliente
                    nome_real_destino = nome_cliente

                    for res in residentes_encontrados:
                        # Muda o status do morador para ativo!
                        supabase.table("rd_residentes").update({"status": "ativo"}).eq("id", res["id"]).execute()
                        
                        if res.get("email"): email_real_destino = res["email"]
                        if res.get("nome_completo"): nome_real_destino = res["nome_completo"]

                        try:
                            dados_pdf = {
                                "nome": res.get("nome_completo") or res.get("nome", "Residente Oficial"),
                                "cpf": res.get("cpf", pedido.get("cpf_cliente")),
                                "data_nascimento": res.get("data_nascimento", "--/--/----"),
                                "foto_url": res.get("foto_url")
                            }
                            # Gera o PDF
                            caminho_pdf = gerar_pdf_carteira(dados_pdf, res.get("qrcode_token") or res["id"])
                            if caminho_pdf: caminhos_pdfs.append(caminho_pdf)
                        except Exception as e_pdf:
                            print(f"[WEBHOOK BB] Erro ao gerar PDF: {e_pdf}")
                    
                    if caminhos_pdfs:
                        try:
                            # Envia o E-mail com os PDFs em anexo
                            enviar_carteiras_por_email(email_real_destino, nome_real_destino, caminhos_pdfs)
                            print(f"[WEBHOOK BB] Carteira enviada com sucesso para: {email_real_destino}")
                        except Exception as e_email:
                            print(f"[WEBHOOK BB] Erro ao enviar e-mail: {e_email}")
                else:
                    print(f"[WEBHOOK BB] Residente não encontrado para o token {token_id}")

        # O Banco do Brasil exige uma resposta de HTTP 200 OK para saber que recebemos o aviso
        return {"status": "200 OK"}

    except Exception as e:
        print(f"[WEBHOOK BB ERRO] Falha crítica: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno no webhook")

@router.get("/api/v1/admin/processar-pendentes")
async def processar_carteiras_pendentes():
    try:
        # 1. Busca todos os pedidos de carteira que estão "aguardando"
        res_pedidos = supabase.table("pedidos").select("*").eq("tipo_item", "carteira").eq("status_pagamento", "aguardando").execute()
        pedidos_pendentes = res_pedidos.data or []

        if not pedidos_pendentes:
            return {"sucesso": True, "mensagem": "Não há pagamentos pendentes para processar."}

        processados = 0
        emails_enviados = 0

        # 2. Percorre todos os pedidos pendentes
        for pedido in pedidos_pendentes:
            # Atualiza o pedido para pago
            supabase.table("pedidos").update({"status_pagamento": "pago"}).eq("id", pedido["id"]).execute()
            
            token_id = pedido.get("item_id")
            residentes_encontrados = []

            # Busca os residentes (titular e dependentes)
            if token_id:
                titular_res = supabase.table("rd_residentes").select("*").eq("id", token_id).execute()
                deps_res = supabase.table("rd_residentes").select("*").eq("titular_id", token_id).execute()
                residentes_encontrados = (titular_res.data or []) + (deps_res.data or [])
            
            # Fallback pelo CPF
            if not residentes_encontrados:
                res_res = supabase.table("rd_residentes").select("*").eq("cpf", pedido.get("cpf_cliente")).execute()
                residentes_encontrados = res_res.data or []

            # 3. Ativa os residentes, gera PDFs e envia e-mail
            if residentes_encontrados:
                caminhos_pdfs = []
                email_real = pedido.get("email_cliente")
                nome_real = pedido.get("nome_cliente")

                for res in residentes_encontrados:
                    # Muda o status para ativo na base de dados
                    supabase.table("rd_residentes").update({"status": "ativo"}).eq("id", res["id"]).execute()
                    
                    if res.get("email"): email_real = res["email"]
                    if res.get("nome_completo"): nome_real = res["nome_completo"]

                    try:
                        dados_pdf = {
                            "nome": res.get("nome_completo") or res.get("nome", "Residente Oficial"),
                            "cpf": res.get("cpf", pedido.get("cpf_cliente")),
                            "data_nascimento": res.get("data_nascimento", "--/--/----"),
                            "foto_url": res.get("foto_url")
                        }
                        caminho_pdf = gerar_pdf_carteira(dados_pdf, res.get("qrcode_token") or res["id"])
                        if caminho_pdf: caminhos_pdfs.append(caminho_pdf)
                    except Exception as e_pdf:
                        print(f"Erro ao gerar PDF: {e_pdf}")
                
                if caminhos_pdfs:
                    try:
                        enviar_carteiras_por_email(email_real, nome_real, caminhos_pdfs)
                        emails_enviados += 1
                    except Exception as e_mail:
                        print(f"Erro ao enviar e-mail: {e_mail}")
            
            processados += 1

        return {
            "sucesso": True, 
            "mensagem": f"Simulação concluída! {processados} pedido(s) atualizado(s) para 'pago'. {emails_enviados} e-mail(s) enviado(s) com as carteiras em anexo."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar pagamentos pendentes: {str(e)}")