import base64
import os
import requests
from typing import Optional

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
EMAIL_FROM = "SagaTurismo Oficial <nao-responda@sagatur.com.br>" # Substitui pelo teu domínio oficial amanhã

LOGO_URL = "https://sagaturismo-production.up.railway.app/public/logop.png" 

def enviar_email(
    destinatario: str,
    assunto: str,
    corpo_html: str,
    attachment_path: str | None = None,
    attachment_filename: str | None = None,
) -> bool:
    if not RESEND_API_KEY:
        print("[EMAIL] Erro: RESEND_API_KEY não configurada no Railway.")
        return False

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "from": EMAIL_FROM,
        "to": [destinatario],
        "subject": assunto,
        "html": corpo_html
    }

    # Tratamento do anexo em Base64 para o Resend
    if attachment_path and os.path.exists(attachment_path):
        with open(attachment_path, "rb") as f:
            conteudo_base64 = base64.b64encode(f.read()).decode("utf-8")
        
        nome_arquivo = attachment_filename or os.path.basename(attachment_path)
        payload["attachments"] = [
            {
                "filename": nome_arquivo,
                "content": conteudo_base64
            }
        ]

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        if response.status_code in [200, 201]:
            print(f"[EMAIL RESEND] Enviado com sucesso para {destinatario}")
            return True
        print(f"[EMAIL RESEND] Erro ({response.status_code}): {response.text}")
        return False
    except Exception as e:
        print(f"[EMAIL RESEND] Falha crítica: {e}")
        return False

def montar_html_sucesso(nome_cliente: str, codigo_pedido: str, tipo_item: str, valor_total: float) -> str:
    primeiro_nome = nome_cliente.strip().split()[0] if nome_cliente else "Cidadão"
    
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; color: #334155; background-color: #F8F9FA; margin: 0; padding: 30px 10px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #E2E8F0;">
            <div style="background: #00577C; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">PAGAMENTO CONFIRMADO! 🎉</h1>
            </div>
            <div style="padding: 30px;">
                <p style="font-size: 16px; line-height: 1.6;">Olá, <strong>{primeiro_nome}</strong>.</p>
                <p style="font-size: 16px; line-height: 1.6;">O seu pagamento foi recebido com sucesso pelo sistema de turismo municipal. O seu voucher oficial em PDF já foi gerado e encontra-se em anexo a esta mensagem.</p>
                
                <div style="margin: 25px 0; padding: 20px; background: #F1F5F9; border-radius: 12px; border-left: 5px solid #009640;">
                    <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Código do Pedido:</strong> {codigo_pedido}</p>
                    <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Serviço Contratado:</strong> {tipo_item.upper()}</p>
                    <p style="margin: 0; font-size: 15px;"><strong>Valor Total:</strong> R$ {valor_total:,.2f}</p>
                </div>
                
                <p style="font-size: 14px; color: #64748B; text-align: center; margin-top: 30px;">
                    Apresente o PDF anexo impresso ou no telemóvel ao utilizar o serviço.
                </p>
            </div>
            <div style="background: #00577C; color: #ffffff; padding: 20px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">&copy; SagaTurismo • Secretaria Municipal de Turismo</p>
            </div>
        </div>
    </body>
    </html>
    """

def enviar_carteiras_por_email(email_destino: str, nome: str, pdf_path: str = None):
    """
    Função mantida para compatibilidade com o routes/residentes.py
    """
    html = f"""
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2 style="color: #00577C;">Olá, {nome}!</h2>
        <p>A sua carteira de residente está em processamento.</p>
    </div>
    """
    return enviar_email(email_destino, "Carteira de Residente - SagaTurismo", html, attachment_path=pdf_path)