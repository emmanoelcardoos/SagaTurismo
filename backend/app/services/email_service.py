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
  <title>🌿 Bem-vindo a São Geraldo do Araguaia</title>
  <!--[if (mso 16)]>
    <style type="text/css">a { text-decoration: none; }</style>
  <![endif]-->
  <!--[if gte mso 9]>
    <style>sup { font-size: 100% !important; }</style>
  <![endif]-->
  <!--[if gte mso 9]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG></o:AllowPNG>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
  <![endif]-->
  <!--[if mso]>
    <xml>
      <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
        <w:DontUseAdvancedTypographyReadingMail/>
      </w:WordDocument>
    </xml>
  <![endif]-->
  <style type="text/css">
    #outlook a { padding: 0; }
    span.MsoHyperlink, span.MsoHyperlinkFollowed { color: inherit; mso-style-priority: 99; }
    a.es-button { mso-style-priority: 100 !important; text-decoration: none !important; }
    a[x-apple-data-detectors], #MessageViewBody a {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    .es-desk-hidden { display: none; float: left; overflow: hidden; width: 0; max-height: 0; line-height: 0; mso-hide: all; }
    @media only screen and (max-width:600px) {
      .es-m-p0t { padding-top: 0px !important }
      .es-m-p0b { padding-bottom: 0px !important }
      p, a { line-height: 150% !important }
      h1 { font-size: 26px !important; line-height: 120% !important; text-align: left; margin-bottom: 0 !important }
      h2 { font-size: 22px !important; line-height: 120% !important; text-align: left; margin-bottom: 0 !important }
      .es-content-body p, .es-content-body a { font-size: 14px !important }
      .es-footer-body p, .es-footer-body a { font-size: 12px !important }
      .es-m-txt-c { text-align: center !important }
      .adapt-img { width: 100% !important; height: auto !important }
      .es-adapt-td { display: block !important; width: 100% !important }
      .es-mobile-hidden, .es-hidden { display: none !important }
      table.es-table-not-adapt { width: auto !important }
      .es-menu td { width: auto !important; display: block !important; border-left: 0 !important; border-top: 1px solid rgba(255,255,255,0.15) !important; }
    }
  </style>
 </head>
 <body class="body" style="width:100%;height:100%;font-family:Poppins, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;background-color:#F3F7EC">
  <span style="display:none !important;font-size:0px;line-height:0;color:#ffffff;visibility:hidden;opacity:0;height:0;width:0;mso-hide:all">Descubra as paisagens, histórias e experiências que fazem do nosso destino um lugar único.</span>

  <div dir="ltr" class="es-wrapper-color" lang="pt" style="background-color:#F3F7EC">
   <!--[if gte mso 9]>
    <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
      <v:fill type="tile" color="#f3f7ec"></v:fill>
    </v:background>
   <![endif]-->

   <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top">
    <tbody>
     <tr>
      <td valign="top" style="padding:0;Margin:0">

       <!-- Espaço superior -->
       <table cellpadding="0" cellspacing="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody><tr><td style="padding:24px 0 0;Margin:0;font-size:1px;line-height:1px">&nbsp;</td></tr></tbody>
       </table>

       <!-- Card principal -->
       <table cellpadding="0" cellspacing="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr>
          <td align="center" bgcolor="transparent" style="padding:0 16px;Margin:0">
           <table cellpadding="0" cellspacing="0" bgcolor="#ffffff" align="center" class="es-content-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px;border-radius:18px;overflow:hidden;box-shadow:0 4px 18px rgba(27,81,45,0.08)">
            <tbody>

             <!-- Imagem de destaque (hero) -->
             <tr>
              <td align="left" style="Margin:0;padding:0">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                <tbody>
                 <tr>
                  <td align="left" style="padding:0;Margin:0">
                   <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                    <tbody>
                     <tr>
                      <td align="center" style="padding:0;Margin:0;font-size:0px">
                       <a target="_blank" href="https://www.sagatur.com.br" style="mso-line-height-rule:exactly;text-decoration:none;color:#B1CF5F;font-size:14px;font-weight:inherit">
                        <img src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/atracoes/casapedra.png" alt="São Geraldo do Araguaia" width="600" title="São Geraldo do Araguaia" class="adapt-img p_image" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0;width:100%;max-width:600px">
                       </a>
                      </td>
                     </tr>
                    </tbody>
                   </table>
                  </td>
                 </tr>
                </tbody>
               </table>
              </td>
             </tr>

             <!-- Título -->
             <tr>
              <td align="center" style="padding:26px 30px 4px;Margin:0">
               <h2 class="p_title" style="Margin:0;font-family:Poppins, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:26px;font-style:normal;font-weight:700;line-height:32px;color:#1B512D;text-align:center">Seja bem-vindo a São Geraldo do Araguaia</h2>
              </td>
             </tr>

             <!-- Texto -->
             <tr>
              <td align="left" class="p_description" style="padding:16px 30px 8px;Margin:0;text-align:justify">
               <p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:23px;letter-spacing:0;font-weight:normal;color:#33453A;font-size:15px;margin-bottom:14px">Há lugares que você visita. E há lugares que você vive.</p>
               <p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:23px;letter-spacing:0;font-weight:normal;color:#33453A;font-size:15px;margin-bottom:14px"><strong style="color:#1B512D;font-weight:700">São Geraldo do Araguaia é um desses lugares.</strong></p>
               <p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:23px;letter-spacing:0;font-weight:normal;color:#33453A;font-size:15px;margin-bottom:14px">Entre as águas do Rio Araguaia e as paisagens imponentes da Serra das Andorinhas, nosso município reúne natureza, história, cultura e experiências que revelam a verdadeira essência do sul do Pará.</p>
               <p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:23px;letter-spacing:0;font-weight:normal;color:#33453A;font-size:15px;margin-bottom:14px">Aqui, cada caminho pode levar a uma nova descoberta: uma praia de rio para contemplar o pôr do sol, uma trilha entre as montanhas, uma cachoeira escondida na serra, uma comunidade que preserva seus costumes ou uma história que atravessa gerações.</p>
               <p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:23px;letter-spacing:0;font-weight:normal;color:#33453A;font-size:15px;margin-bottom:14px">Criamos este portal para aproximar você de tudo isso — conheça nossos atrativos, descubra lugares para visitar, encontre experiências, conheça empreendedores locais e planeje sua próxima viagem por São Geraldo do Araguaia.</p>
               <p style="Margin:0;mso-line-height-rule:exactly;font-family:Poppins, sans-serif;line-height:23px;letter-spacing:0;font-weight:normal;color:#33453A;font-size:15px;margin-bottom:0"><strong style="color:#1B512D;font-weight:700">O Araguaia está esperando por você. Seja bem-vindo ao nosso destino.</strong></p>
              </td>
             </tr>

             <!-- Botão -->
             <tr>
              <td align="center" style="padding:26px 30px 34px;Margin:0">
               <!--[if mso]>
               <a href="https://www.sagatur.com.br" target="_blank" hidden>
                 <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="https://www.sagatur.com.br" style="height:46px; v-text-anchor:middle; width:200px" arcsize="50%" stroke="f" fillcolor="#1B512D">
                   <w:anchorlock></w:anchorlock>
                   <center style='color:#ffffff; font-family:Poppins, sans-serif; font-size:16px; font-weight:600; line-height:16px; mso-text-raise:1px'>Conhecer Agora →</center>
                 </v:roundrect>
               </a>
               <![endif]-->
               <!--[if !mso]><!-->
               <span class="es-button-border msohide" style="border-style:solid;border-color:#1B512D;background:#1B512D;border-width:0px;display:inline-block;border-radius:24px;width:auto;mso-hide:all">
                <a target="_blank" href="https://www.sagatur.com.br" class="es-button p_button" style="mso-style-priority:100 !important;text-decoration:none !important;mso-line-height-rule:exactly;color:#ffffff;font-size:16px;font-weight:600;padding:13px 30px;display:inline-block;background:#1B512D;border-radius:24px;font-family:Poppins, sans-serif;font-style:normal;line-height:16px;width:auto;text-align:center;letter-spacing:0.3px;mso-padding-alt:0;mso-border-alt:10px solid #1B512D;text-transform:none">Conhecer Agora →</a>
               </span>
               <!--<![endif]-->
              </td>
             </tr>

            </tbody>
           </table>
          </td>
         </tr>
        </tbody>
       </table>

       <!-- Espaço entre card e rodapé -->
       <table cellpadding="0" cellspacing="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody><tr><td style="padding:20px 0 0;Margin:0;font-size:1px;line-height:1px">&nbsp;</td></tr></tbody>
       </table>

       <!-- Rodapé -->
       <table cellpadding="0" cellspacing="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr>
          <td align="center" bgcolor="transparent" style="padding:0 16px;Margin:0">
           <table align="center" cellpadding="0" cellspacing="0" bgcolor="#1B512D" class="es-footer-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#1B512D;width:600px;border-radius:18px;overflow:hidden">
            <tbody>
             <tr>
              <td align="center" style="padding:32px 30px 24px;Margin:0">

               <!-- Nome / selo do destino -->
               <p style="Margin:0 0 6px;font-family:Poppins, sans-serif;font-size:16px;font-weight:700;color:#ffffff;letter-spacing:0.3px">São Geraldo do Araguaia</p>
               <p style="Margin:0 0 20px;font-family:Poppins, sans-serif;font-size:12px;font-weight:400;color:#9FCB8C">Sul do Pará · Brasil</p>

               <!-- Ícone social -->
               <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;Margin:0 auto 20px">
                <tbody>
                 <tr>
                  <td align="center" style="padding:0 6px;Margin:0">
                   <a target="_blank" href="https://www.instagram.com/semtursaga/" style="mso-line-height-rule:exactly;text-decoration:none">
                    <img title="Instagram" src="https://faxkalg.stripocdn.email/content/assets/img/social-icons/logo-white/instagram-logo-white.png" alt="Instagram" width="26" height="26" style="display:block;font-size:12px;border:0;outline:none;text-decoration:none;margin:0">
                   </a>
                  </td>
                 </tr>
                </tbody>
               </table>

               <!-- Divisor -->
               <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;Margin:0 0 18px">
                <tbody><tr><td style="border-top:1px solid rgba(255,255,255,0.15);font-size:1px;line-height:1px">&nbsp;</td></tr></tbody>
               </table>

               <!-- Menu de links -->
               <table cellpadding="0" cellspacing="0" width="100%" class="es-menu" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                <tbody>
                 <tr class="links">
                  <td align="center" valign="middle" width="25%" class="es-adapt-td" style="padding:6px 4px;Margin:0;border:0">
                   <a target="_blank" href="https://www.sagatur.com.br/atrativos" style="mso-line-height-rule:exactly;text-decoration:none;font-family:Poppins, sans-serif;font-weight:500;display:block;color:#DEF4C6;font-size:13px">Atrativos</a>
                  </td>
                  <td align="center" valign="middle" width="25%" class="es-adapt-td" style="padding:6px 4px;Margin:0;border:0;border-left:1px solid rgba(255,255,255,0.2)">
                   <a target="_blank" href="https://www.sagatur.com.br/eventos" style="mso-line-height-rule:exactly;text-decoration:none;font-family:Poppins, sans-serif;font-weight:500;display:block;color:#DEF4C6;font-size:13px">Eventos</a>
                  </td>
                  <td align="center" valign="middle" width="25%" class="es-adapt-td" style="padding:6px 4px;Margin:0;border:0;border-left:1px solid rgba(255,255,255,0.2)">
                   <a target="_blank" href="https://www.sagatur.com.br/quem-somos" style="mso-line-height-rule:exactly;text-decoration:none;font-family:Poppins, sans-serif;font-weight:500;display:block;color:#DEF4C6;font-size:13px">Sobre Nós</a>
                  </td>
                  <td align="center" valign="middle" width="25%" class="es-adapt-td" style="padding:6px 4px;Margin:0;border:0;border-left:1px solid rgba(255,255,255,0.2)">
                   <a target="_blank" href="https://www.sagatur.com.br/contato" style="mso-line-height-rule:exactly;text-decoration:none;font-family:Poppins, sans-serif;font-weight:500;display:block;color:#DEF4C6;font-size:13px">Contato</a>
                  </td>
                 </tr>
                </tbody>
               </table>

               <!-- Copyright -->
               <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;Margin:20px 0 0">
                <tbody><tr><td style="border-top:1px solid rgba(255,255,255,0.15);font-size:1px;line-height:1px;padding-top:16px">&nbsp;</td></tr></tbody>
               </table>
               <p style="Margin:14px 0 0;font-family:Poppins, sans-serif;font-size:11px;color:#9FCB8C">© 2026 Portal Oficial de Turismo de São Geraldo do Araguaia</p>

              </td>
             </tr>
            </tbody>
           </table>
          </td>
         </tr>
        </tbody>
       </table>

       <table cellpadding="0" cellspacing="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody><tr><td style="padding:0 0 24px;Margin:0;font-size:1px;line-height:1px">&nbsp;</td></tr></tbody>
       </table>

      </td>
     </tr>
    </tbody>
   </table>
  </div>
 </body>
</html>
 """
    return enviar_email(email_destino, "🌿 Bem-vindo a São Geraldo do Araguaia", html)