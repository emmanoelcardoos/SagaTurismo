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

# ==========================================
# 6. NEWSLETTER COMERCIAL DA PREFEITURA
# ==========================================
# ==========================================
# 6. NEWSLETTER COMERCIAL DA PREFEITURA
# ==========================================
def enviar_newsletter_comercial(emails_destino: List[str], assunto: str, texto_html: str) -> int:
    """
    Envia a newsletter comercial em lote para os inscritos utilizando o motor Resend existente.
    Agora aceita HTML livre (raw) colado diretamente do editor Drag & Drop.
    """
    sucessos = 0
    for email in emails_destino:
        # Usa diretamente o texto_html fornecido pelo frontend sem envolver em outro template
        if enviar_email(email, assunto, texto_html):
            sucessos += 1
            
    return sucessos


# Adicione no final do email_service.py

def enviar_email_boas_vindas(email_destino: str) -> bool:
    html = """
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="pt">
 <head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>🌿 Bem-vindo a São Geraldo do Araguaia</title><!--[if (mso 16)]>
    <style type="text/css">
        a {
            text-decoration: none;
        }
    </style>
    <![endif]--><!--[if gte mso 9]>
    <style>sup {
        font-size: 100% !important;
    }</style><![endif]--><!--[if gte mso 9]>
    <noscript>
         <xml>
           <o:OfficeDocumentSettings>
           <o:AllowPNG></o:AllowPNG>
           <o:PixelsPerInch>96</o:PixelsPerInch>
           </o:OfficeDocumentSettings>
         </xml>
      </noscript>
    <![endif]--><!--[if mso]><xml>
    <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
      <w:DontUseAdvancedTypographyReadingMail/>
    </w:WordDocument>
    </xml><![endif]-->
  <style type="text/css">
#outlook a {
  padding:0;
}
span.MsoHyperlink,
span.MsoHyperlinkFollowed {
  color:inherit;
  mso-style-priority:99;
}
a.es-button {
  mso-style-priority:100!important;
  text-decoration:none!important;
}
a[x-apple-data-detectors],
#MessageViewBody a {
  color:inherit!important;
  text-decoration:none!important;
  font-size:inherit!important;
  font-family:inherit!important;
  font-weight:inherit!important;
  line-height:inherit!important;
}
.es-desk-hidden {
  display:none;
  float:left;
  overflow:hidden;
  width:0;
  max-height:0;
  line-height:0;
  mso-hide:all;
}
@media only screen and (max-width:600px) {.es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0px!important } .es-p-default { } *[class="gmail-fix"] { display:none!important } p, a { line-height:150%!important } h1, h1 a { line-height:120%!important } h2, h2 a { line-height:120%!important } h3, h3 a { line-height:120%!important } h4, h4 a { line-height:120%!important } h5, h5 a { line-height:120%!important } h6, h6 a { line-height:120%!important } h1 { font-size:30px!important; text-align:left; margin-bottom:0px!important } h2 { font-size:24px!important; text-align:left; margin-bottom:0px!important } h3 { font-size:20px!important; text-align:left; margin-bottom:0px!important } h4 { font-size:24px!important; text-align:left } h5 { font-size:20px!important; text-align:left } h6 { font-size:16px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:24px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-header-body h4 a, .es-content-body h4 a, .es-footer-body h4 a { font-size:24px!important } .es-header-body h5 a, .es-content-body h5 a, .es-footer-body h5 a { font-size:20px!important } .es-header-body h6 a, .es-content-body h6 a, .es-footer-body h6 a { font-size:16px!important } .es-header-body p, .es-header-body a { font-size:12px!important } .es-content-body p, .es-content-body a { font-size:14px!important } .es-footer-body p, .es-footer-body a { font-size:12px!important } .es-infoblock p, .es-infoblock a { font-size:12px!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3, .es-m-txt-c h4, .es-m-txt-c h5, .es-m-txt-c h6 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3, .es-m-txt-r h4, .es-m-txt-r h5, .es-m-txt-r h6 { text-align:right!important } .es-m-txt-j, .es-m-txt-j h1, .es-m-txt-j h2, .es-m-txt-j h3, .es-m-txt-j h4, .es-m-txt-j h5, .es-m-txt-j h6 { text-align:justify!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3, .es-m-txt-l h4, .es-m-txt-l h5, .es-m-txt-l h6 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-m-txt-r .es-menu td { float:right!important } .es-m-txt-l .es-menu td { float:left!important } .es-m-txt-c .es-menu td { display:inline-block } .es-spacer { display:inline-table } a.es-button, button.es-button { display:inline-block!important; font-size:18px!important; padding:10px 20px 10px 20px!important; line-height:120%!important } .es-button-border { display:inline-block!important } .es-m-fw, .es-m-fw.es-fw, .es-m-fw .es-button { display:block!important } .es-m-il, .es-m-il .es-button, .es-social, .es-social td, .es-menu.es-table-not-adapt { display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important; border-collapse:separate!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important } .es-adapt-td { display:block!important; width:100%!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-container-hidden { display:none!important } .es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-hidden { display:table-cell!important } td.es-desk-menu-hidden { display:table-cell!important } .es-m-txt-c .es-menu td.es-desk-menu-hidden { display:inline-block!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table, .es-m-txt-r .es-menu td, .es-m-txt-l .es-menu td, .es-m-txt-c .es-menu td { width:auto!important } .h-auto { height:auto!important } }
@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
</style>
 </head>
 <body class="body" style="width:100%;height:100%;font-family:Poppins, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
  <span style="display:none !important;font-size:0px;line-height:0;color:#ffffff;visibility:hidden;opacity:0;height:0;width:0;mso-hide:all">Descubra as paisagens, histórias e experiências que fazem do nosso destino um lugar único.</span>
  <div dir="ltr" class="es-wrapper-color" lang="pt" style="background-color:#F6F6F6"><!--[if gte mso 9]>
    <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
        <v:fill type="tile" color="#f6f6f6"></v:fill>
    </v:background>
    <![endif]-->
   <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top">
    <tbody>
     <tr>
      <td valign="top" style="padding:0;Margin:0">
       <table cellpadding="0" cellspacing="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr>
          <td align="center" bgcolor="transparent" style="padding:0;Margin:0">
           <table align="center" cellpadding="0" cellspacing="0" bgcolor="#ffffff" class="es-header-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px">
            <tbody>
             <tr>
              <td align="left" style="Margin:0;padding:20px 30px 15px">
               <table cellspacing="0" width="100%" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                <tbody>
                 <tr>
                  <td align="left" style="padding:0;Margin:0;width:540px">
                   <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                    <tbody>
                     <tr>
                      <td align="center" style="padding:0;Margin:0;font-size:0px"><a target="_blank" href="https://viewstripo.email" class="companyWebsite" style="mso-line-height-rule:exactly;text-decoration:underline;color:#B1CF5F;font-size:13px;font-weight:inherit"><img alt="" height="83" src="https://faxkalg.stripocdn.email/content/guids/CABINET_61e7a7a9115805467844872aa2a5e818c191ab60c72f02dda715ebd1c39bf87a/images/logop.png" class="companyLogo adapt-img" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0"></a></td>
                     </tr>
                    </tbody>
                   </table></td>
                 </tr>
                </tbody>
               </table></td>
             </tr>
            </tbody>
           </table></td>
         </tr>
        </tbody>
       </table>
       <table cellpadding="0" cellspacing="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr>
          <td align="center" bgcolor="transparent" style="padding:0;Margin:0">
           <table cellpadding="0" cellspacing="0" bgcolor="#ffffff" align="center" class="es-content-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#DEF4C6;width:600px">
            <tbody>
             <tr>
              <td align="left" style="Margin:0;padding:15px 30px">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                <tbody>
                 <tr>
                  <td align="left" style="padding:0;Margin:0;width:540px">
                   <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                    <tbody>
                     <tr>
                      <td align="center" style="padding:0;Margin:0;font-size:0px"><a target="_blank" href="https://www.sagatur.com.br" style="mso-line-height-rule:exactly;text-decoration:underline;color:#B1CF5F;font-size:14px;font-weight:inherit"><img src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/atracoes/casapedra.png" alt="Conheça os nossos atrativos" width="540" title="Conheça os nossos atrativos" class="adapt-img p_image" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0"></a></td>
                     </tr>
                     <tr>
                      <td align="center" style="padding:15px 0 5px;Margin:0"><h2 class="p_title" style="Margin:0;font-family:Poppins, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:24px;font-style:normal;font-weight:bold;line-height:29px;color:#1B512D;margin-bottom:0px">Seja Bem-vindo a&nbsp;São Geraldo do Araguaia</h2></td>
                     </tr>
                     <tr>
                      <td align="justify" class="p_description" style="padding:10px 0 20px;Margin:0;text-align:justify"><p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:21px;letter-spacing:0;font-weight:normal;color:#1B512D;font-size:14px;margin-bottom:11px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:21px;letter-spacing:0;font-weight:normal;color:#1B512D;font-size:14px;margin-bottom:11px">Há lugares que você visita. E há lugares que você vive.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:21px;letter-spacing:0;font-weight:normal;color:#1B512D;font-size:14px;margin-bottom:11px"><strong style="font-weight:bolder !important">São Geraldo do Araguaia é um desses lugares.</strong></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:21px;letter-spacing:0;font-weight:normal;color:#1B512D;font-size:14px;margin-bottom:11px">Entre as águas do Rio Araguaia e as paisagens imponentes da Serra das Andorinhas, nosso município reúne natureza, história, cultura e experiências que revelam a verdadeira essência do sul do Pará.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:21px;letter-spacing:0;font-weight:normal;color:#1B512D;font-size:14px;margin-bottom:11px">Aqui, cada caminho pode levar a uma nova descoberta: uma praia de rio para contemplar o pôr do sol, uma trilha entre as montanhas, uma cachoeira escondida na serra, uma comunidade que preserva seus costumes ou uma história que atravessa gerações.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:21px;letter-spacing:0;font-weight:normal;color:#1B512D;font-size:14px;margin-bottom:11px">Criamos este portal para aproximar você de tudo isso.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:21px;letter-spacing:0;font-weight:normal;color:#1B512D;font-size:14px;margin-bottom:11px">Aqui você poderá conhecer nossos atrativos, descobrir lugares para visitar, encontrar experiências, conhecer empreendedores locais e planejar sua próxima viagem por São Geraldo do Araguaia.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:21px;letter-spacing:0;font-weight:normal;color:#1B512D;font-size:14px;margin-bottom:11px"><strong style="font-weight:bolder !important">Este é o nosso convite: venha conhecer, explorar e viver São Geraldo do Araguaia.</strong></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:21px;letter-spacing:0;font-weight:normal;color:#1B512D;font-size:14px;margin-bottom:11px">O Araguaia está esperando por você.<br><strong style="font-weight:bolder !important">Seja bem-vindo ao nosso destino.</strong></p></td>
                     </tr>
                     <tr>
                      <td align="center" style="padding:0;Margin:0"><!--[if mso]><a href="https://www.sagatur.com.br" target="_blank" hidden>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="https://www.sagatur.com.br" style="height:41px; v-text-anchor:middle; width:173px" arcsize="37%" stroke="f"  fillcolor="#b1cf5f">
        <w:anchorlock></w:anchorlock>
        <center style='color:#1b512d; font-family:Poppins, sans-serif; font-size:15px; font-weight:400; line-height:15px;  mso-text-raise:1px'>Explore Agora</center>
    </v:roundrect></a>
<![endif]--><!--[if !mso]><!-- --><span class="es-button-border msohide" style="border-style:solid;border-color:#2CB543;background:#B1CF5F;border-width:0px;display:inline-block;border-radius:15px;width:auto;mso-hide:all"><a target="_blank" href="https://www.sagatur.com.br" class="es-button p_button" style="mso-style-priority:100 !important;text-decoration:none !important;mso-line-height-rule:exactly;color:#1B512D;font-size:18px;font-weight:normal;padding:10px 20px;display:inline-block;background:#B1CF5F;border-radius:15px;font-family:Poppins, sans-serif;font-style:normal;line-height:22px;width:auto;text-align:center;letter-spacing:0;mso-padding-alt:0;mso-border-alt:10px solid #B1CF5F;text-transform:none">Explore Agora</a></span><!--<![endif]--></td>
                     </tr>
                    </tbody>
                   </table></td>
                 </tr>
                </tbody>
               </table></td>
             </tr>
            </tbody>
           </table></td>
         </tr>
        </tbody>
       </table>
       <table cellpadding="0" cellspacing="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr>
          <td align="center" bgcolor="transparent" style="padding:0;Margin:0">
           <table align="center" cellpadding="0" cellspacing="0" bgcolor="#ffffff" class="es-footer-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#1B512D;width:600px">
            <tbody>
             <tr>
              <td align="left" style="padding:30px;Margin:0">
               <table align="right" cellpadding="0" cellspacing="0" width="100%" class="es-right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                <tbody>
                 <tr>
                  <td align="left" style="padding:0;Margin:0;width:540px">
                   <table width="100%" role="presentation" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                    <tbody>
                     <tr>
                      <td align="center" style="padding:0 0 15px;Margin:0;font-size:0">
                       <table cellpadding="0" cellspacing="0" class="es-table-not-adapt es-social" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tbody>
                         <tr>
                          <td valign="top" align="center" style="padding:0;Margin:0"><a target="_blank" href="https://www.instagram.com/semtursaga/" style="mso-line-height-rule:exactly;text-decoration:underline;color:#73E2A7;font-size:14px;font-weight:inherit"><img title="Instagram" src="https://faxkalg.stripocdn.email/content/assets/img/social-icons/logo-black/instagram-logo-black.png" alt="Ig" width="32" height="32" style="display:block;font-size:12px;border:0;outline:none;text-decoration:none;margin:0"></a></td>
                         </tr>
                        </tbody>
                       </table></td>
                     </tr>
                     <tr>
                      <td style="padding:0;Margin:0">
                       <table cellpadding="0" cellspacing="0" width="100%" class="es-menu es-menu-lxp5jzg0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tbody>
                         <tr class="links">
                          <td align="center" valign="top" width="25.00%" id="esd-menu-id-1" class="es-m-p0t es-m-p0b es-adapt-td" style="padding:5px 0;Margin:0;border:0">
                           <div style="vertical-align:middle;display:block">
                            <a target="_blank" href="https://www.sagatur.com.br/atrativos" style="mso-line-height-rule:exactly;text-decoration:none;font-family:Poppins, sans-serif;font-weight:normal;display:block;color:#73E2A7;font-size:14px">Atrativos</a>
                           </div></td>
                          <td valign="top" width="25.00%" align="center" id="esd-menu-id-2" class="es-m-p0t es-m-p0b es-adapt-td" style="padding:5px 0;Margin:0;border:0;border-left:1px solid #999999">
                           <div style="vertical-align:middle;display:block">
                            <a href="https://www.sagatur.com.br/eventos" target="_blank" style="mso-line-height-rule:exactly;text-decoration:none;font-family:Poppins, sans-serif;font-weight:normal;display:block;color:#73E2A7;font-size:14px">Eventos</a>
                           </div></td>
                          <td width="25.00%" align="center" valign="top" id="esd-menu-id-3" class="es-m-p0t es-m-p0b es-adapt-td" style="padding:5px 0;Margin:0;border:0;border-left:1px solid #999999">
                           <div style="vertical-align:middle;display:block">
                            <a href="https://www.sagatur.com.br/quem-somos" target="_blank" style="mso-line-height-rule:exactly;text-decoration:none;font-family:Poppins, sans-serif;font-weight:normal;display:block;color:#73E2A7;font-size:14px">Sobre Nós</a>
                           </div></td>
                          <td valign="top" width="25.00%" align="center" id="esd-menu-id-4" class="es-m-p0t es-m-p0b es-adapt-td" style="padding:5px 0;Margin:0;border:0;border-left:1px solid #999999">
                           <div style="vertical-align:middle;display:block">
                            <a target="_blank" href="https://www.sagatur.com.br/contato" style="mso-line-height-rule:exactly;text-decoration:none;font-family:Poppins, sans-serif;font-weight:normal;display:block;color:#73E2A7;font-size:14px">Contato</a>
                           </div></td>
                         </tr>
                        </tbody>
                       </table></td>
                     </tr>
                    </tbody>
                   </table></td>
                 </tr>
                </tbody>
               </table></td>
             </tr>
            </tbody>
           </table></td>
         </tr>
        </tbody>
       </table></td>
     </tr>
    </tbody>
   </table>
  </div>
 </body>
</html>
    """
    return enviar_email(email_destino, "🌿 Bem-vindo a São Geraldo do Araguaia", html)