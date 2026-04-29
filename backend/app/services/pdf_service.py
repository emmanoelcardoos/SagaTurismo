import os
import requests
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import qrcode
from datetime import datetime, timedelta

# ─── PALETA PREMIUM – ESTILO PARQUES NACIONAIS MUNDIAIS ───────────────────────
COR_FLORESTA    = colors.HexColor("#0d3b2e")   # Verde escuro profundo
COR_FOLHA       = colors.HexColor("#5a9e47")   # Verde vivo (destaque)
COR_OURO        = colors.HexColor("#c8a951")   # Dourado para detalhes premium
COR_CREME       = colors.HexColor("#f5f0e8")   # Fundo creme natural
COR_CINZA_CLARO = colors.HexColor("#e8e0d0")   # Separadores suaves
COR_TEXTO       = colors.HexColor("#1a1a1a")   # Texto principal
COR_LABEL       = colors.HexColor("#4a7c59")   # Labels secundários
COR_HEADER_FX   = colors.HexColor("#0a2e22")   # Header ainda mais escuro
COR_DESCONTO    = colors.HexColor("#c0392b")   # Vermelho para badge 50%


def _hex_to_rgb(hex_str):
    h = hex_str.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def _gradiente_header(c, largura, altura):
    passos = 30
    h_header = 24 * mm
    y_inicio = altura - h_header
    r1, g1, b1 = _hex_to_rgb("#0a2e22")
    r2, g2, b2 = _hex_to_rgb("#0d3b2e")
    faixa_h = h_header / passos
    for i in range(passos):
        t = i / passos
        r = r1 * (1 - t) + r2 * t
        g = g1 * (1 - t) + g2 * t
        b = b1 * (1 - t) + b2 * t
        c.setFillColorRGB(r / 255, g / 255, b / 255)
        c.rect(0, y_inicio + i * faixa_h, largura, faixa_h + 0.5, fill=1, stroke=0)


def _linha_ouro(c, x1, y1, x2, y2, espessura=0.6):
    """CORREÇÃO: Agora aceita y1 e y2 para permitir linhas verticais e horizontais."""
    c.setStrokeColor(COR_OURO)
    c.setLineWidth(espessura)
    c.line(x1, y1, x2, y2)


def _badge_desconto(c, x, y, raio=7 * mm):
    c.setFillColor(colors.HexColor("#00000022"))
    c.circle(x + 0.5 * mm, y - 0.5 * mm, raio, fill=1, stroke=0)
    c.setFillColor(COR_DESCONTO)
    c.setStrokeColor(COR_OURO)
    c.setLineWidth(1)
    c.circle(x, y, raio, fill=1, stroke=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(x, y + 1.5 * mm, "50%")
    c.setFont("Helvetica-Bold", 5.5)
    c.drawCentredString(x, y - 2.5 * mm, "DESCONTO")


def _textura_diagonal(c, largura, altura):
    c.saveState()
    c.setStrokeColor(COR_FOLHA)
    c.setLineWidth(0.15)
    c.setStrokeAlpha(0.07)
    step = 5 * mm
    for i in range(-int(altura / step), int(largura / step) + int(altura / step)):
        x0 = i * step
        c.line(x0, 0, x0 + altura, altura)
    c.restoreState()


def _moldura_foto(c, x, y, w, h, radius=3 * mm):
    c.setFillColor(colors.HexColor("#00000018"))
    c.roundRect(x + 0.8 * mm, y - 0.8 * mm, w, h, radius, fill=1, stroke=0)
    c.setStrokeColor(COR_OURO)
    c.setLineWidth(1.2)
    c.setFillColor(COR_CINZA_CLARO)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def _label_valor(c, x, y, label, valor, cor_label=None, cor_valor=None,
                  tam_label=6, tam_valor=10):
    cor_label = cor_label or COR_LABEL
    cor_valor = cor_valor or COR_TEXTO
    c.setFillColor(cor_label)
    c.setFont("Helvetica-Bold", tam_label)
    c.drawString(x, y, label)
    c.setFillColor(cor_valor)
    c.setFont("Helvetica-Bold", tam_valor)
    c.drawString(x, y - (tam_valor * 0.45 * mm) - 1.5 * mm, valor)


def gerar_pdf_carteira(residente_data, token):
    os.makedirs("tmp_pdfs", exist_ok=True)
    caminho_pdf = os.path.abspath(f"tmp_pdfs/carteira_{token}.pdf")

    largura, altura = 135 * mm, 85 * mm
    c = canvas.Canvas(caminho_pdf, pagesize=(largura, altura))

    # ── 1. FUNDO ────────────────────────────────────────────────────────────────
    c.setFillColor(COR_CREME)
    c.rect(0, 0, largura, altura, fill=1, stroke=0)
    _textura_diagonal(c, largura, altura)

    c.setFillColor(COR_FLORESTA)
    c.rect(0, 0, 3.5 * mm, altura - 24 * mm, fill=1, stroke=0)
    c.setFillColor(COR_OURO)
    c.rect(0, altura - 24 * mm - 3 * mm, 3.5 * mm, 3 * mm, fill=1, stroke=0)

    # ── 2. HEADER ───────────────────────────────────────────────────────────────
    _gradiente_header(c, largura, altura)

    # CORREÇÃO: Passando y1 e y2 iguais para linha horizontal
    _linha_ouro(c, 0, altura - 24 * mm, largura, altura - 24 * mm, espessura=1.4)

    path_logo = os.path.join(os.getcwd(), "frontend", "public", "logop.png")
    if os.path.exists(path_logo):
        c.drawImage(path_logo,
                    8 * mm, altura - 21 * mm,
                    width=15 * mm, height=15 * mm,
                    mask='auto', preserveAspectRatio=True)
    else:
        c.setFillColor(COR_OURO)
        c.circle(15.5 * mm, altura - 13 * mm, 8 * mm, fill=1, stroke=0)
        c.setFillColor(COR_FLORESTA)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(15.5 * mm, altura - 15.5 * mm, "SGA")

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(27 * mm, altura - 12 * mm, "SagaTurismo")

    c.setFillColor(COR_OURO)
    c.setFont("Helvetica-Oblique", 7)
    c.drawString(27 * mm, altura - 17.5 * mm, "CARTEIRA DO RESIDENTE  ·  PARQUE AMBIENTAL")

    c.setFillColor(colors.HexColor("#ffffff55"))
    c.setFont("Helvetica", 6)
    c.drawRightString(largura - 5 * mm, altura - 20 * mm, f"#{token[:8].upper()}")

    # ── 3. FOTO ─────────────────────────────────────────────────────────────────
    foto_x, foto_y = 7 * mm, 17 * mm
    foto_w, foto_h = 38 * mm, 48 * mm

    _moldura_foto(c, foto_x, foto_y, foto_w, foto_h)

    try:
        url_foto = residente_data.get('foto_url')
        response = requests.get(url_foto, timeout=10)
        img_data = BytesIO(response.content)
        c.drawImage(ImageReader(img_data),
                    foto_x + 1 * mm, foto_y + 1 * mm,
                    width=foto_w - 2 * mm, height=foto_h - 2 * mm,
                    preserveAspectRatio=True, mask='auto')
    except Exception:
        c.setFillColor(COR_CINZA_CLARO)
        c.roundRect(foto_x + 1 * mm, foto_y + 1 * mm,
                    foto_w - 2 * mm, foto_h - 2 * mm, 2 * mm, fill=1, stroke=0)
        c.setFillColor(COR_LABEL)
        c.setFont("Helvetica-Oblique", 7)
        c.drawCentredString(foto_x + foto_w / 2, foto_y + foto_h / 2, "Foto indisponível")

    c.setFillColor(COR_FLORESTA)
    c.roundRect(foto_x, foto_y - 8 * mm, foto_w, 6.5 * mm, 1.5 * mm, fill=1, stroke=0)
    c.setFillColor(COR_OURO)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(foto_x + foto_w / 2, foto_y - 5.2 * mm, "✦  RESIDENTE  ✦")

    # ── 4. DADOS (COLUNA DIREITA) ────────────────────────────────────────────────
    x_col = 51 * mm
    col_w  = largura - x_col - 34 * mm

    # CORREÇÃO: Linha vertical (x1=x2)
    _linha_ouro(c, x_col - 3 * mm, 10 * mm, x_col - 3 * mm, altura - 26 * mm, espessura=0.8)

    nome = residente_data.get('nome', '').upper()
    c.setFillColor(COR_LABEL)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(x_col, 62 * mm, "NOME DO TITULAR")
    
    # CORREÇÃO: Linha horizontal sob o nome (y1=y2)
    _linha_ouro(c, x_col, 61.2 * mm, x_col + col_w, 61.2 * mm, espessura=0.4)
    
    c.setFillColor(COR_FLORESTA)
    c.setFont("Helvetica-Bold", 11)
    while c.stringWidth(nome, "Helvetica-Bold", 11) > col_w and len(nome) > 4:
        nome = nome[:-1]
    c.drawString(x_col, 56.5 * mm, nome)

    _label_valor(c, x_col, 50 * mm,
                 "CPF", residente_data.get('cpf', '000.000.000-00'),
                 tam_label=6, tam_valor=10)

    _label_valor(c, x_col, 42 * mm,
                 "DATA DE NASCIMENTO", residente_data.get('data_nascimento', '--/--/----'),
                 tam_label=6, tam_valor=10)

    c.setStrokeColor(COR_CINZA_CLARO)
    c.setLineWidth(0.4)
    c.line(x_col, 35.5 * mm, x_col + col_w, 35.5 * mm)

    validade = (datetime.now() + timedelta(days=365)).strftime("%d/%m/%Y")
    c.setFillColor(COR_LABEL)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(x_col, 34 * mm, "VÁLIDO ATÉ")
    c.setFillColor(COR_DESCONTO)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(x_col, 27.5 * mm, validade)

    _badge_desconto(c, largura - 12 * mm, 58 * mm, raio=8 * mm)

    # ── 5. QR CODE ──────────────────────────────────────────────────────────────
    qr = qrcode.QRCode(box_size=10, border=1,
                       error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(f"https://sagat-sga.vercel.app/fiscal/validar/{token}")
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="#0d3b2e", back_color="white")

    qr_io = BytesIO()
    img_qr.save(qr_io, format='PNG')
    qr_io.seek(0)

    qr_size = 24 * mm
    qr_x    = largura - qr_size - 5 * mm
    qr_y    = 10 * mm

    c.setFillColor(colors.white)
    c.setStrokeColor(COR_OURO)
    c.setLineWidth(0.8)
    c.roundRect(qr_x - 1 * mm, qr_y - 1 * mm,
                qr_size + 2 * mm, qr_size + 2 * mm,
                1.5 * mm, fill=1, stroke=1)
    c.drawImage(ImageReader(qr_io), qr_x, qr_y,
                width=qr_size, height=qr_size)

    c.setFillColor(COR_LABEL)
    c.setFont("Helvetica-Bold", 5)
    c.drawCentredString(qr_x + qr_size / 2, qr_y - 3.5 * mm, "ACESSO AO PARQUE")

    # ── 6. RODAPÉ ───────────────────────────────────────────────────────────────
    c.setFillColor(COR_FLORESTA)
    c.rect(0, 0, largura, 9 * mm, fill=1, stroke=0)
    
    # CORREÇÃO: Linha horizontal no rodapé (y1=y2)
    _linha_ouro(c, 0, 9 * mm, largura, 9 * mm, espessura=1)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(largura / 2, 3.5 * mm,
                        "Desenvolvido pela Secretaria Municipal de Turismo de São Geraldo do Araguaia")

    c.save()
    return caminho_pdf