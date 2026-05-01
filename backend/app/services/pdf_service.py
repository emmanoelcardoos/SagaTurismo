import os
import requests
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import qrcode
from datetime import datetime, timedelta

# ─── NOVA PALETA – CORES OFICIAIS SAGA TURISMO ──────────────────────────────
COR_AZUL        = colors.HexColor("#00577C")   # Azul Petróleo (Primária)
COR_VERDE       = colors.HexColor("#009640")   # Verde (Secundária)
COR_AMARELO     = colors.HexColor("#F9C400")   # Amarelo/Dourado (Destaque)
COR_FUNDO       = colors.HexColor("#F8FAFC")   # Fundo moderno claro (Slate 50)
COR_CINZA_BORDA = colors.HexColor("#E2E8F0")   # Separadores suaves (Slate 200)
COR_TEXTO_ESCURO= colors.HexColor("#0F172A")   # Texto principal escuro (Slate 900)
COR_TEXTO_LABEL = colors.HexColor("#64748B")   # Texto de títulos secundários (Slate 500)
COR_BRANCO      = colors.white

def _hex_to_rgb(hex_str):
    h = hex_str.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def _gradiente_header(c, largura, altura):
    passos = 30
    h_header = 24 * mm
    y_inicio = altura - h_header
    # Gradiente suave de um azul mais escuro para o Azul Petróleo oficial
    r1, g1, b1 = _hex_to_rgb("#004766")
    r2, g2, b2 = _hex_to_rgb("#00577C")
    faixa_h = h_header / passos
    for i in range(passos):
        t = i / passos
        r = r1 * (1 - t) + r2 * t
        g = g1 * (1 - t) + g2 * t
        b = b1 * (1 - t) + b2 * t
        c.setFillColorRGB(r / 255, g / 255, b / 255)
        c.rect(0, y_inicio + i * faixa_h, largura, faixa_h + 0.5, fill=1, stroke=0)

def _linha_cor(c, x1, y1, x2, y2, espessura=0.6, cor=COR_AMARELO):
    c.setStrokeColor(cor)
    c.setLineWidth(espessura)
    c.line(x1, y1, x2, y2)

def _badge_desconto(c, x, y, raio=8 * mm):
    # Sombra
    c.setFillColor(colors.HexColor("#00000015"))
    c.circle(x + 0.8 * mm, y - 0.8 * mm, raio, fill=1, stroke=0)
    
    # Fundo Amarelo com Borda Azul
    c.setFillColor(COR_AMARELO)
    c.setStrokeColor(COR_AZUL)
    c.setLineWidth(1.5)
    c.circle(x, y, raio, fill=1, stroke=1)
    
    # Texto
    c.setFillColor(COR_AZUL)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(x, y + 0.5 * mm, "50%")
    c.setFont("Helvetica-Bold", 4.5)
    c.drawCentredString(x, y - 3.5 * mm, "DESCONTO")

def _textura_fundo(c, largura, altura):
    c.saveState()
    c.setStrokeColor(COR_AZUL)
    c.setLineWidth(0.3)
    c.setStrokeAlpha(0.04) # Muito subtil
    step = 4 * mm
    for i in range(-int(altura / step), int(largura / step) + int(altura / step)):
        x0 = i * step
        c.line(x0, 0, x0 + altura, altura)
    c.restoreState()

def _moldura_foto(c, x, y, w, h, radius=4 * mm):
    # Sombra elegante
    c.setFillColor(colors.HexColor("#00000010"))
    c.roundRect(x + 1.2 * mm, y - 1.2 * mm, w, h, radius, fill=1, stroke=0)
    
    # Borda Azul da Prefeitura
    c.setStrokeColor(COR_AZUL)
    c.setLineWidth(1.5)
    c.setFillColor(COR_BRANCO)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)

def _label_valor(c, x, y, label, valor, tam_label=6, tam_valor=10):
    c.setFillColor(COR_TEXTO_LABEL)
    c.setFont("Helvetica-Bold", tam_label)
    c.drawString(x, y, label)
    
    c.setFillColor(COR_TEXTO_ESCURO)
    c.setFont("Helvetica-Bold", tam_valor)
    c.drawString(x, y - (tam_valor * 0.45 * mm) - 1.5 * mm, valor)

def gerar_pdf_carteira(residente_data, token):
    os.makedirs("tmp_pdfs", exist_ok=True)
    caminho_pdf = os.path.abspath(f"tmp_pdfs/carteira_{token}.pdf")

    # Dimensões da carteirinha
    largura, altura = 135 * mm, 85 * mm
    c = canvas.Canvas(caminho_pdf, pagesize=(largura, altura))

    # ── 1. FUNDO GERAL ──────────────────────────────────────────────────────────
    c.setFillColor(COR_FUNDO)
    c.rect(0, 0, largura, altura, fill=1, stroke=0)
    _textura_fundo(c, largura, altura)

    # Detalhe lateral elegante
    c.setFillColor(COR_VERDE)
    c.rect(0, 0, 3 * mm, altura, fill=1, stroke=0)
    c.setFillColor(COR_AMARELO)
    c.rect(3 * mm, 0, 1.5 * mm, altura, fill=1, stroke=0)

    # ── 2. HEADER ───────────────────────────────────────────────────────────────
    _gradiente_header(c, largura, altura)
    _linha_cor(c, 0, altura - 24 * mm, largura, altura - 24 * mm, espessura=1.5, cor=COR_AMARELO)

    # Logo
    path_logo = os.path.join(os.getcwd(), "frontend", "public", "logop.png")
    if os.path.exists(path_logo):
        c.drawImage(path_logo,
                    9 * mm, altura - 20 * mm,
                    width=14 * mm, height=14 * mm,
                    mask='auto', preserveAspectRatio=True)
    else:
        # Fallback caso não encontre o logo
        c.setFillColor(COR_BRANCO)
        c.circle(16 * mm, altura - 13 * mm, 7 * mm, fill=1, stroke=0)
        c.setFillColor(COR_AZUL)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(16 * mm, altura - 14.5 * mm, "SGA")

    # Títulos no Header
    c.setFillColor(COR_AMARELO)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(28 * mm, altura - 13 * mm, "SagaTurismo")

    c.setFillColor(COR_BRANCO)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(28 * mm, altura - 18.5 * mm, "CARTEIRA DE RESIDENTE  ·  SÃO GERALDO DO ARAGUAIA")

    # ID do Token (canto superior direito)
    c.setFillColor(colors.HexColor("#ffffff60"))
    c.setFont("Helvetica-Bold", 7)
    c.drawRightString(largura - 6 * mm, altura - 15 * mm, f"ID: {token[:8].upper()}")

    # ── 3. FOTO E BADGE ─────────────────────────────────────────────────────────
    foto_x, foto_y = 10 * mm, 18 * mm
    foto_w, foto_h = 36 * mm, 45 * mm

    _moldura_foto(c, foto_x, foto_y, foto_w, foto_h)

    # Buscar e inserir Foto
    try:
        url_foto = residente_data.get('foto_url')
        response = requests.get(url_foto, timeout=10)
        img_data = BytesIO(response.content)
        c.drawImage(ImageReader(img_data),
                    foto_x + 1 * mm, foto_y + 1 * mm,
                    width=foto_w - 2 * mm, height=foto_h - 2 * mm,
                    preserveAspectRatio=True, mask='auto')
    except Exception:
        c.setFillColor(COR_CINZA_BORDA)
        c.roundRect(foto_x + 1 * mm, foto_y + 1 * mm,
                    foto_w - 2 * mm, foto_h - 2 * mm, 3 * mm, fill=1, stroke=0)
        c.setFillColor(COR_TEXTO_LABEL)
        c.setFont("Helvetica-Oblique", 7)
        c.drawCentredString(foto_x + foto_w / 2, foto_y + foto_h / 2, "Foto indisponível")

    # Placa "RESIDENTE" abaixo da foto
    c.setFillColor(COR_AZUL)
    c.roundRect(foto_x, foto_y - 7.5 * mm, foto_w, 6 * mm, 1.5 * mm, fill=1, stroke=0)
    c.setFillColor(COR_AMARELO)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(foto_x + foto_w / 2, foto_y - 5.5 * mm, "RESIDENTE OFICIAL")

    # ── 4. DADOS DO CIDADÃO ─────────────────────────────────────────────────────
    x_col = 54 * mm
    col_w  = largura - x_col - 36 * mm

    # Linha vertical separadora macia
    _linha_cor(c, x_col - 4 * mm, 12 * mm, x_col - 4 * mm, altura - 28 * mm, espessura=0.8, cor=COR_CINZA_BORDA)

    nome = residente_data.get('nome', '').upper()
    c.setFillColor(COR_TEXTO_LABEL)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(x_col, 56 * mm, "NOME DO TITULAR")
    
    # Nome em Destaque
    c.setFillColor(COR_AZUL)
    c.setFont("Helvetica-Bold", 12)
    while c.stringWidth(nome, "Helvetica-Bold", 12) > col_w and len(nome) > 4:
        nome = nome[:-1]
    c.drawString(x_col, 51.5 * mm, nome)

    # Dados adicionais
    _label_valor(c, x_col, 42 * mm, "CPF", residente_data.get('cpf', '000.000.000-00'))
    _label_valor(c, x_col, 32 * mm, "DATA DE NASCIMENTO", residente_data.get('data_nascimento', '--/--/----'))

    # Área de Validade
    c.setStrokeColor(COR_CINZA_BORDA)
    c.setLineWidth(0.5)
    c.line(x_col, 25 * mm, x_col + col_w, 25 * mm)

    validade = (datetime.now() + timedelta(days=365)).strftime("%d/%m/%Y")
    c.setFillColor(COR_TEXTO_LABEL)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(x_col, 23 * mm, "VÁLIDO ATÉ")
    
    c.setFillColor(COR_VERDE)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(x_col, 16.5 * mm, validade)

    # Selo de 50% de Desconto
    _badge_desconto(c, largura - 14 * mm, 50 * mm, raio=9 * mm)

    # ── 5. QR CODE ──────────────────────────────────────────────────────────────
    qr = qrcode.QRCode(box_size=10, border=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(f"https://sagat-sga.vercel.app/fiscal/validar/{token}")
    qr.make(fit=True)
    
    # QR Code no Azul da Prefeitura
    img_qr = qr.make_image(fill_color="#00577C", back_color="white")
    qr_io = BytesIO()
    img_qr.save(qr_io, format='PNG')
    qr_io.seek(0)

    qr_size = 25 * mm
    qr_x    = largura - qr_size - 6 * mm
    qr_y    = 11 * mm

    # Moldura do QR Code
    c.setFillColor(COR_BRANCO)
    c.setStrokeColor(COR_CINZA_BORDA)
    c.setLineWidth(1)
    c.roundRect(qr_x - 1.5 * mm, qr_y - 1.5 * mm, qr_size + 3 * mm, qr_size + 3 * mm, 2 * mm, fill=1, stroke=1)
    c.drawImage(ImageReader(qr_io), qr_x, qr_y, width=qr_size, height=qr_size)

    c.setFillColor(COR_VERDE)
    c.setFont("Helvetica-Bold", 5.5)
    c.drawCentredString(qr_x + qr_size / 2, qr_y - 4 * mm, "VALIDAR ACESSO")

    # ── 6. RODAPÉ ───────────────────────────────────────────────────────────────
    _linha_cor(c, 0, 7.5 * mm, largura, 7.5 * mm, espessura=1, cor=COR_VERDE)
    c.setFillColor(COR_VERDE)
    c.rect(0, 0, largura, 7 * mm, fill=1, stroke=0)

    c.setFillColor(COR_AMARELO)
    c.setFont("Helvetica-Bold", 5.5)
    c.drawCentredString(largura / 2, 2.5 * mm, "DOCUMENTO OFICIAL DA SECRETARIA MUNICIPAL DE TURISMO")

    c.save()
    return caminho_pdf