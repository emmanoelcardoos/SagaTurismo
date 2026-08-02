import base64
import os
import requests
from typing import List, Dict, Any, Optional

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
EMAIL_FROM = "SagaTurismo Oficial <nao-responda@sagatur.com.br>" # Domínio verificado no Resend

LOGO_URL = "https://sagaturismo-production.up.railway.app/public/logop.png" 

# ==========================================
# MOTOR PRINCIPAL DE ENVIO (AGORA SUPORTA MÚLTIPLOS ANEXOS)
# ==========================================
def enviar_email(
    destinatario: str,
    assunto: str,
    corpo_html: str,
    anexos_paths: List[str] = None,
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

    # Tratamento de múltiplos anexos em Base64
    if anexos_paths:
        payload["attachments"] = []
        for path in anexos_paths:
            if os.path.exists(path):
                with open(path, "rb") as f:
                    conteudo_base64 = base64.b64encode(f.read()).decode("utf-8")
                
                payload["attachments"].append({
                    "filename": os.path.basename(path),
                    "content": conteudo_base64
                })

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

# ==========================================
# 4. CARTEIRA DIGITAL DE RESIDENTE (FLUXO CONCLUÍDO NO WEBHOOK)
# ==========================================
from typing import List

# Substitua pela constante já existente no seu projeto (ex.: importada de um config.py)
LOGO_URL = "https://sagatur.com.br/logop.png"


def enviar_carteiras_por_email(email_destino: str, nome_titular: str, caminhos_pdfs: List[str]):
    primeiro_nome = nome_titular.strip().split()[0] if nome_titular else "Cidadão"

    FONT_STACK = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

    html = f"""
    <div style="background-color:#F8FAFC; margin:0; padding:0; width:100%;">

        <!-- Preheader (texto de pré-visualização, invisível no corpo do e-mail) -->
        <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; color:#F8FAFC;">
            O seu cadastro foi aprovado e a emissão foi concluída. A Carteira Digital do Residente já está pronta.
            &#8203;&nbsp;&zwnj;&nbsp;&#8203;&nbsp;&zwnj;&nbsp;&#8203;&nbsp;&zwnj;&nbsp;
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC; width:100%;">
            <tr>
                <td align="center" style="padding:48px 16px;">

                    <!-- Container principal -->
                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background-color:#FFFFFF; border-radius:24px; overflow:hidden; box-shadow:0 4px 24px rgba(15,23,42,0.06);">

                        <!-- Header: apenas o logo, muito limpo -->
                        <tr>
                            <td align="center" style="padding:48px 40px 8px 40px; background-color:#FFFFFF;">
                                <img src="{LOGO_URL}" width="140" alt="Prefeitura Municipal de São Geraldo do Araguaia" style="display:block; width:140px; max-width:140px; height:auto; margin:0 auto; border:0;">
                            </td>
                        </tr>

                        <!-- Boas-vindas -->
                        <tr>
                            <td style="padding:40px 40px 0 40px;">
                                <p style="margin:0 0 12px 0; font-family:{FONT_STACK}; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#00577C;">
                                    Carteira Digital de Residente
                                </p>
                                <h1 style="margin:0 0 16px 0; font-family:{FONT_STACK}; font-size:28px; line-height:1.3; font-weight:700; color:#0f172a;">
                                    Olá, {primeiro_nome}!
                                </h1>
                                <p style="margin:0; font-family:{FONT_STACK}; font-size:16px; line-height:1.6; color:#475569;">
                                    O seu cadastro foi aprovado e a sua emissão concluída. Em anexo, enviamos a(s) Carteira(s) Digital(is) de Residente da sua família.
                                </p>
                            </td>
                        </tr>

                        <!-- Card de benefícios -->
                        <tr>
                            <td style="padding:32px 40px 0 40px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; background-color:#F8FAFC; border-radius:18px;">
                                    <tr>
                                        <td style="padding:28px 28px 24px 28px;">

                                            <p style="margin:0 0 20px 0; font-family:{FONT_STACK}; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#009640;">
                                                O seu benefício
                                            </p>

                                            <!-- Benefício 1 -->
                                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                                                <tr>
                                                    <td width="32" valign="top" style="width:32px; padding-right:14px;">
                                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:24px; height:24px;">
                                                            <tr>
                                                                <td align="center" valign="middle" style="width:24px; height:24px; border-radius:50%; background-color:#009640; font-family:{FONT_STACK}; font-size:13px; font-weight:700; line-height:24px; color:#FFFFFF;">&#10003;</td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                    <td valign="top" style="font-family:{FONT_STACK}; font-size:15px; line-height:1.5; color:#334155;">
                                                        <strong style="color:#0f172a;">50% de desconto automático</strong> na entrada do Parque Três Quedas.
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Espaçador -->
                                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr><td style="height:16px; line-height:16px; font-size:0;">&nbsp;</td></tr>
                                            </table>

                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Aviso sutil sobre os anexos -->
                        <tr>
                            <td style="padding:24px 40px 0 40px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; background-color:#FFFBEB; border-radius:14px;">
                                    <tr>
                                        <td style="padding:16px 20px; font-family:{FONT_STACK}; font-size:13px; line-height:1.6; color:#92620A;">
                                            📎&nbsp; Faça o download dos PDFs em anexo e guarde-os no seu celular — vai precisar de apresentar o QR Code quando solicitado.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Espaço final -->
                        <tr>
                            <td style="padding-top:40px; line-height:1px; font-size:1px;">&nbsp;</td>
                        </tr>

                    </table>
                    <!-- Fim do container principal -->

                    <!-- Footer -->
                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">
                        <tr>
                            <td align="center" style="padding:28px 24px 0 24px; font-family:{FONT_STACK}; font-size:12px; line-height:1.6; color:#94A3B8;">
                                &copy; 2026 SagaTurismo &bull; Prefeitura Municipal de São Geraldo do Araguaia
                            </td>
                        </tr>
                    </table>

                </td>
            </tr>
        </table>
    </div>
    """
    return enviar_email(email_destino, "A sua Carteira de Residente está pronta! 🎉", html, anexos_paths=caminhos_pdfs)

# ==========================================
# 1. VOUCHER DE HOTEL
# ==========================================
def enviar_voucher_hotel(email_destino: str, nome_cliente: str, dados_reserva: Dict[str, Any], pdf_path: str = None):
    html = f"""
    <div style="font-family: Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden;">
        <div style="background: #00577C; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Reserva de Alojamento Confirmada 🛏️</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
            <p style="font-size: 16px;">Olá, <strong>{nome_cliente}</strong>. A sua reserva está garantida!</p>
            
            <div style="margin: 20px 0; padding: 20px; border: 2px solid #E2E8F0; border-radius: 12px;">
                <h2 style="margin-top: 0; color: #00577C; font-size: 20px;">{dados_reserva.get('nome_hotel', 'Hotel Parceiro')}</h2>
                <p style="margin: 5px 0;"><strong>Check-in:</strong> {dados_reserva.get('checkin')} (A partir das 14h)</p>
                <p style="margin: 5px 0;"><strong>Check-out:</strong> {dados_reserva.get('checkout')} (Até às 12h)</p>
                <p style="margin: 5px 0;"><strong>Acomodação:</strong> {dados_reserva.get('tipo_quarto', 'Standard').capitalize()}</p>
                <p style="margin: 5px 0;"><strong>Hóspedes:</strong> {dados_reserva.get('quantidade_pessoas', 2)} pessoa(s)</p>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: #F8FAFC; border-left: 4px solid #F9C400;">
                <p style="margin: 0; font-size: 14px;"><strong>Políticas da Propriedade:</strong> {dados_reserva.get('politicas', 'Apresente o seu documento de identificação com foto no balcão de check-in.')}</p>
            </div>
        </div>
    </div>
    """
    anexos = [pdf_path] if pdf_path else None
    return enviar_email(email_destino, f"Voucher de Reserva - {dados_reserva.get('nome_hotel', 'SagaTurismo')}", html, anexos_paths=anexos)

# ==========================================
# 2. VOUCHER DE PACOTE TURÍSTICO
# ==========================================
def enviar_voucher_pacote(email_destino: str, nome_cliente: str, dados_pacote: Dict[str, Any], pdf_path: str = None):
    html = f"""
    <div style="font-family: Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden;">
        <div style="background: #0085FF; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Expedição Oficial Confirmada 🧭</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
            <p style="font-size: 16px;">Olá, <strong>{nome_cliente}</strong>. Prepare as malas!</p>
            
            <div style="margin: 20px 0; padding: 20px; background: #F1F5F9; border-radius: 12px;">
                <h2 style="margin-top: 0; color: #0085FF;">{dados_pacote.get('nome_pacote', 'Pacote Turístico')}</h2>
                <p style="margin: 5px 0;"><strong>Período:</strong> {dados_pacote.get('checkin')} a {dados_pacote.get('checkout')}</p>
                <p style="margin: 5px 0;"><strong>Alojamento:</strong> {dados_pacote.get('nome_hotel', 'Incluso no pacote')}</p>
                <p style="margin: 5px 0;"><strong>Guia Oficial:</strong> {dados_pacote.get('nome_guia', 'Atribuído no check-in')}</p>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; border: 1px dashed #CBD5E1; border-radius: 8px;">
                <h3 style="margin-top: 0; font-size: 16px; color: #334155;">Ponto de Encontro</h3>
                <p style="margin: 0; font-size: 14px;">{dados_pacote.get('ponto_encontro', 'Será contatado pelo guia até 24h antes do início da expedição.')}</p>
            </div>
        </div>
    </div>
    """
    anexos = [pdf_path] if pdf_path else None
    return enviar_email(email_destino, "Voucher do Pacote Turístico - SagaTurismo", html, anexos_paths=anexos)

# ==========================================
# 3. VOUCHER DE PASSEIO (AVULSO)
# ==========================================
def enviar_voucher_passeio(email_destino: str, nome_cliente: str, dados_passeio: Dict[str, Any], pdf_path: str = None):
    html = f"""
    <div style="font-family: Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden;">
        <div style="background: #009640; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Passeio Confirmado 🌿</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
            <p style="font-size: 16px;">Aventura à vista, <strong>{nome_cliente}</strong>!</p>
            
            <div style="margin: 20px 0; padding: 20px; border-left: 4px solid #009640; background: #F0FDF4; border-radius: 0 12px 12px 0;">
                <h2 style="margin-top: 0; color: #009640;">{dados_passeio.get('nome_passeio', 'Passeio Oficial')}</h2>
                <p style="margin: 5px 0;"><strong>Data e Hora:</strong> {dados_passeio.get('data_hora', 'A confirmar')}</p>
                <p style="margin: 5px 0;"><strong>Ponto de Encontro:</strong> {dados_passeio.get('endereco', 'A confirmar com o guia')}</p>
                <p style="margin: 5px 0;"><strong>Guia Responsável:</strong> {dados_passeio.get('nome_guia', 'Guia Credenciado')}</p>
                <p style="margin: 5px 0;"><strong>Contato do Guia:</strong> {dados_passeio.get('contato_guia', 'Disponível no WhatsApp')}</p>
            </div>
            
            <p style="font-size: 14px; color: #64748B;">Recomendamos o uso de roupas confortáveis, protetor solar e repelente.</p>
        </div>
    </div>
    """
    anexos = [pdf_path] if pdf_path else None
    return enviar_email(email_destino, "Voucher do Seu Passeio - SagaTurismo", html, anexos_paths=anexos)

# ==========================================
# 5. SISTEMA DE SUBMISSÃO DE GUIAS (ADMIN E GUIA)
# ==========================================
def notificar_admin_novo_passeio(nome_guia: str, dados_passeio: Dict[str, Any]):
    email_admin = "emmanoel.cardoso09@gmail.com"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px;">
        <h2 style="color: #0F172A;">Nova Submissão de Passeio 🚨</h2>
        <p>O guia <strong>{nome_guia}</strong> acabou de submeter um novo roteiro para análise.</p>
        <div style="background: #F8FAFC; padding: 15px; border-radius: 8px;">
            <p><strong>Nome do Passeio:</strong> {dados_passeio.get('titulo')}</p>
            <p><strong>Preço:</strong> R$ {dados_passeio.get('preco', 0):,.2f}</p>
            <p><strong>Descrição:</strong> {dados_passeio.get('descricao')}</p>
        </div>
        <p style="margin-top: 20px;">Acesse o painel do Supabase para alterar a coluna <code>ativo</code> para TRUE se o roteiro respeitar as normas.</p>
    </div>
    """
    return enviar_email(email_admin, f"Pendente de Aprovação: {dados_passeio.get('titulo')}", html)

def notificar_guia_passeio_aprovado(email_guia: str, nome_guia: str, nome_passeio: str, link_vendas: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden;">
        <div style="background: #F9C400; padding: 30px; text-align: center;">
            <h1 style="color: #00577C; margin: 0; font-size: 22px;">Passeio Aprovado! 🚀</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
            <p style="font-size: 16px;">Parabéns, <strong>{nome_guia}</strong>!</p>
            <p style="font-size: 16px;">A Secretaria de Turismo revisou e aprovou o seu roteiro <strong>"{nome_passeio}"</strong>. Ele já está visível para turistas de todo o Brasil.</p>
            
            <div style="margin: 25px 0; text-align: center;">
                <a href="{link_vendas}" style="background: #00577C; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Ver Minha Página de Vendas</a>
            </div>
            
            <p style="font-size: 14px; color: #64748B; text-align: center;">Copie o link acima e partilhe nas suas redes sociais (Instagram, WhatsApp) para impulsionar as suas reservas diretas.</p>
        </div>
    </div>
    """
    return enviar_email(email_guia, "O seu passeio foi ativado na SagaTurismo!", html)