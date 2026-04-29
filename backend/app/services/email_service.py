import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

GMAIL_USER = "emmanoel.cardoso09@gmail.com"
GMAIL_PASS = "vudm kmvd seaq ptkg"

LOGO_URL = "https://sagaturismo.vercel.app/logop.png"  # troca pelo teu domínio real


def enviar_carteira_por_email(destinatario, nome, caminho_pdf):
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"SagaTurismo | Prefeitura de São Geraldo do Araguaia <{GMAIL_USER}>"
        msg["To"] = destinatario
        msg["Subject"] = "Sua Carteira Digital de Residente está pronta"

        primeiro_nome = nome.split()[0] if nome else "Residente"

        texto = f"""
Olá {primeiro_nome},

Sua solicitação foi aprovada e sua Carteira Digital de Residente está pronta.

O PDF oficial está em anexo neste e-mail.

Prefeitura Municipal de São Geraldo do Araguaia
SagaTurismo
"""

        html = f"""
        <!DOCTYPE html>
        <html lang="pt-BR">
        <body style="margin:0; padding:0; background:#f3f6f8; font-family:Arial, Helvetica, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px; background:#f3f6f8;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff; border-radius:24px; overflow:hidden; border:1px solid #e2e8f0;">
                            
                            <tr>
                                <td style="padding:28px 32px; background:#ffffff; border-bottom:1px solid #e2e8f0;">
                                    <img src="logop.png" alt="Prefeitura de São Geraldo do Araguaia" style="display:block; height:72px; max-width:260px; width:auto;" />
                                </td>
                            </tr>

                            <tr>
                                <td style="background:linear-gradient(135deg,#00577C 0%,#007FA3 55%,#009640 100%); padding:42px 32px; text-align:center;">
                                    <div style="display:inline-block; background:#F9C400; color:#00577C; font-size:13px; font-weight:800; padding:8px 14px; border-radius:999px; margin-bottom:18px;">
                                        Solicitação aprovada
                                    </div>

                                    <h1 style="margin:0; color:#ffffff; font-size:30px; line-height:1.2; font-weight:800;">
                                        Sua Carteira Digital de Residente está pronta
                                    </h1>

                                    <p style="margin:16px auto 0; max-width:480px; color:rgba(255,255,255,0.85); font-size:15px; line-height:1.6;">
                                        O seu cadastro foi validado oficialmente pelo SagaTurismo.
                                    </p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:36px 32px;">
                                    <h2 style="margin:0 0 12px; color:#00577C; font-size:24px; font-weight:800;">
                                        Olá, {primeiro_nome}!
                                    </h2>

                                    <p style="margin:0 0 18px; color:#475569; font-size:15px; line-height:1.7;">
                                        A sua residência foi validada e a sua <strong>Carteira Digital de Residente</strong> foi emitida.
                                        O documento oficial está anexado a este e-mail em PDF.
                                    </p>

                                    <div style="margin:26px 0; background:#f8fafc; border:1px solid #e2e8f0; border-radius:18px; padding:24px;">
                                        <div style="font-size:13px; font-weight:800; color:#009640; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:8px;">
                                            Benefício confirmado
                                        </div>

                                        <div style="font-size:42px; font-weight:900; color:#00577C; line-height:1;">
                                            50%
                                        </div>

                                        <div style="font-size:15px; font-weight:700; color:#334155; margin-top:6px;">
                                            de desconto na entrada do parque
                                        </div>

                                        <p style="margin:12px 0 0; color:#64748b; font-size:13px; line-height:1.6;">
                                            Apresente sua carteira digital quando solicitado para validação do benefício.
                                        </p>
                                    </div>

                                    <div style="background:#fff8d7; border:1px solid #F9C400; border-radius:16px; padding:16px;">
                                        <p style="margin:0; color:#6b5300; font-size:13px; line-height:1.6;">
                                            <strong>Aviso:</strong> este documento é pessoal e intransferível. O uso indevido poderá resultar no cancelamento do benefício.
                                        </p>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style="background:#f8fafc; padding:28px 32px; border-top:1px solid #e2e8f0; text-align:center;">
                                    <p style="margin:0; color:#64748b; font-size:13px; line-height:1.6;">
                                        SagaTurismo · Plataforma oficial de turismo<br />
                                        Prefeitura Municipal de São Geraldo do Araguaia · Pará
                                    </p>

                                    <p style="margin:14px 0 0; color:#94a3b8; font-size:11px;">
                                        Este é um e-mail automático. Não responda esta mensagem.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        msg.attach(MIMEText(texto, "plain"))
        msg.attach(MIMEText(html, "html"))

        if os.path.exists(caminho_pdf):
            with open(caminho_pdf, "rb") as f:
                payload = MIMEBase("application", "octet-stream")
                payload.set_payload(f.read())
                encoders.encode_base64(payload)
                payload.add_header(
                    "Content-Disposition",
                    "attachment",
                    filename="Carteira_Digital_Residente_SGA.pdf",
                )
                msg.attach(payload)

            if not GMAIL_PASS:
                raise RuntimeError("GMAIL_PASS não configurada.")

            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(GMAIL_USER, GMAIL_PASS)
                server.sendmail(GMAIL_USER, destinatario, msg.as_string())

            os.remove(caminho_pdf)
            print(f"Sucesso ao enviar para {destinatario}")
            return True

        print("PDF não encontrado.")
        return False

    except Exception as e:
        print(f"Erro no Email: {e}")
        return False