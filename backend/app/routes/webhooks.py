from fastapi import APIRouter, Request, HTTPException
import os
import uuid
from datetime import datetime
from supabase import create_client, Client

# Importação dos serviços customizados (Necessários para gerar e enviar após o pagamento)
from app.services.pdf_service import gerar_pdf_carteira
from app.services.email_service import enviar_carteiras_por_email

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

            # B. Lógica Híbrida: Disparos de negócio baseados no tipo de item
            tipo = pedido.get("tipo_item")
            
            if tipo == "carteira":
                email_cliente = pedido.get("email_cliente")
                
                # ◄── BUSCAR A FAMÍLIA PENDENTE: Procura quem está aguardando pagamento
                res_residentes = supabase.table("rd_residentes").select("*").eq("email", email_cliente).eq("status", "aguardando_pagamento").execute()
                residentes_pendentes = res_residentes.data

                # Fallback: Se por acaso o email da compra for diferente do registo, tenta pelo CPF
                if not residentes_pendentes:
                    cpf_cliente = pedido.get("cpf_cliente")
                    res_residentes = supabase.table("rd_residentes").select("*").eq("cpf", cpf_cliente).eq("status", "aguardando_pagamento").execute()
                    residentes_pendentes = res_residentes.data

                if residentes_pendentes:
                    caminhos_pdfs = []
                    
                    for res in residentes_pendentes:
                        # 1. Ativar o residente na base de dados (Luz Verde da Prefeitura)
                        supabase.table("rd_residentes").update({"status": "ativo"}).eq("id", res["id"]).execute()
                        
                        # 2. Gerar o PDF individual com a foto e os dados
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
                            print(f"[WEBHOOK] Erro ao gerar PDF da carteira para {res['nome_completo']}: {e_pdf}")
                    
                    # 3. Disparar o Email 
                    # ◄── CORREÇÃO DE SINTAXE: Enviando EXATAMENTE 3 argumentos para a função de e-mail (Email, Nome, PDFs)
                    try:
                        nome_titular = pedido.get("nome_cliente")
                        enviar_carteiras_por_email(email_cliente, nome_titular, caminhos_pdfs)
                        print(f"[WEBHOOK] MAGIA: E-mail com {len(caminhos_pdfs)} carteira(s) enviado com sucesso para {email_cliente}")
                    except Exception as e_email:
                        print(f"[WEBHOOK] Erro Crítico ao enviar o e-mail das carteiras: {e_email}")
                else:
                    print(f"[WEBHOOK] Carteira Paga, mas nenhum registo 'aguardando_pagamento' encontrado para {email_cliente}")

            elif tipo == "hotel":
                print(f"[WEBHOOK] Reserva de Hotel confirmada para {pedido.get('nome_cliente')}.")
                # Opcional no futuro: enviar_voucher_hotel_por_email(...)

            elif tipo == "pacote":
                print(f"[WEBHOOK] Pacote turístico confirmado para {pedido.get('nome_cliente')}.")
                # Opcional no futuro: enviar_voucher_pacote_por_email(...)

        elif status_normalizado in ["DECLINED", "CANCELED", "REFUNDED"]:
            supabase.table("pedidos").update({"status_pagamento": "recusado"}).eq("codigo_pedido", reference_id).execute()
            print(f"[WEBHOOK] Pagamento {reference_id} marcado como RECUSADO.")

        return {"status": "ok"}

    except Exception as e:
        print(f"[WEBHOOK ERRO] Falha crítica: {str(e)}")
        # Retornamos 200 para o PagBank não ficar em loop infinito de tentativas se houver bug de código nosso
        return {"status": "ok", "error": "Internal process handled"}