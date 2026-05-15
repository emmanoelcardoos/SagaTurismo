import os
import requests
from io import BytesIO
from datetime import datetime, timedelta
import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

# ─── NOVA PALETA – CORES OFICIAIS SAGA TURISMO ──────────────────────────────
COR_AZUL        = colors.HexColor("#00577C")   # Azul Petróleo (Primária)
COR_VERDE       = colors.HexColor("#009640")   # Verde (Secundária)
COR_AMARELO     = colors.HexColor("#F9C400")   # Amarelo/Dourado (Destaque)
COR_FUNDO       = colors.HexColor("#F8FAFC")   # Fundo moderno claro (Slate 50)
COR_CINZA_BORDA = colors.HexColor("#E2E8F0")   # Separadores suaves (Slate 200)
COR_TEXTO_ESCURO= colors.HexColor("#0F172A")   # Texto principal escuro (Slate 900)
COR_TEXTO_LABEL = colors.HexColor("#64748B")   # Texto de títulos secundários (Slate 500)
COR_BRANCO      = colors.white

# ─── FUNÇÕES AUXILIARES DE DESIGN E UTILIDADES ──────────────────────────────

def _hex_to_rgb(hex_str):
    h = hex_str.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def _gradiente_header(c, largura, altura):
    passos = 30
    h_header = 24 * mm
    y_inicio = altura - h_header
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
    c.setFillColor(colors.HexColor("#00000015"))
    c.circle(x + 0.8 * mm, y - 0.8 * mm, raio, fill=1, stroke=0)
    c.setFillColor(COR_AMARELO)
    c.setStrokeColor(COR_AZUL)
    c.setLineWidth(1.5)
    c.circle(x, y, raio, fill=1, stroke=1)
    c.setFillColor(COR_AZUL)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(x, y + 0.5 * mm, "50%")
    c.setFont("Helvetica-Bold", 4.5)
    c.drawCentredString(x, y - 3.5 * mm, "DESCONTO")

def _textura_fundo(c, largura, altura):
    c.saveState()
    c.setStrokeColor(COR_AZUL)
    c.setLineWidth(0.3)
    c.setStrokeAlpha(0.04)
    step = 4 * mm
    for i in range(-int(altura / step), int(largura / step) + int(altura / step)):
        x0 = i * step
        c.line(x0, 0, x0 + altura, altura)
    c.restoreState()

def _moldura_foto(c, x, y, w, h, radius=4 * mm):
    c.setFillColor(colors.HexColor("#00000010"))
    c.roundRect(x + 1.2 * mm, y - 1.2 * mm, w, h, radius, fill=1, stroke=0)
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
    c.drawString(x, y - (tam_valor * 0.45 * mm) - 1.5 * mm, str(valor))

def gerar_qr_code_em_memoria(conteudo: str) -> BytesIO:
    """Gera um QR Code em memória e devolve o buffer para o ReportLab"""
    qr = qrcode.QRCode(box_size=10, border=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(conteudo)
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="#00577C", back_color="white")
    qr_io = BytesIO()
    img_qr.save(qr_io, format='PNG')
    qr_io.seek(0)
    return qr_io

# ─── GERAÇÃO DA CARTEIRA DIGITAL DE RESIDENTE ───────────────────────────────

def gerar_pdf_carteira(residente_data: dict, token: str) -> str:
    os.makedirs("tmp_pdfs", exist_ok=True)
    nome_pessoa_limpo = residente_data.get('nome', 'Residente').replace(' ', '_')
    caminho_pdf = os.path.abspath(f"tmp_pdfs/Carteira_{nome_pessoa_limpo}_{token[:4]}.pdf")

    largura, altura = 135 * mm, 85 * mm
    c = canvas.Canvas(caminho_pdf, pagesize=(largura, altura))

    c.setFillColor(COR_FUNDO)
    c.rect(0, 0, largura, altura, fill=1, stroke=0)
    _textura_fundo(c, largura, altura)

    c.setFillColor(COR_VERDE)
    c.rect(0, 0, 3 * mm, altura, fill=1, stroke=0)
    c.setFillColor(COR_AMARELO)
    c.rect(3 * mm, 0, 1.5 * mm, altura, fill=1, stroke=0)

    _gradiente_header(c, largura, altura)
    _linha_cor(c, 0, altura - 24 * mm, largura, altura - 24 * mm, espessura=1.5, cor=COR_AMARELO)

    path_logo = os.path.join(os.getcwd(), "frontend", "public", "logop.png")
    if os.path.exists(path_logo):
        c.drawImage(path_logo, 9 * mm, altura - 20 * mm, width=14 * mm, height=14 * mm, mask='auto', preserveAspectRatio=True)
    else:
        c.setFillColor(COR_BRANCO)
        c.circle(16 * mm, altura - 13 * mm, 7 * mm, fill=1, stroke=0)
        c.setFillColor(COR_AZUL)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(16 * mm, altura - 14.5 * mm, "SGA")

    c.setFillColor(COR_AMARELO)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(28 * mm, altura - 13 * mm, "SagaTurismo")

    c.setFillColor(COR_BRANCO)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(28 * mm, altura - 18.5 * mm, "CARTEIRA DE RESIDENTE  ·  SÃO GERALDO DO ARAGUAIA")

    c.setFillColor(colors.HexColor("#ffffff60"))
    c.setFont("Helvetica-Bold", 7)
    c.drawRightString(largura - 6 * mm, altura - 15 * mm, f"ID: {token[:8].upper()}")

    foto_x, foto_y = 10 * mm, 18 * mm
    foto_w, foto_h = 36 * mm, 45 * mm
    _moldura_foto(c, foto_x, foto_y, foto_w, foto_h)

    try:
        url_foto = residente_data.get('foto_url')
        if url_foto:
            response = requests.get(url_foto, timeout=10)
            img_data = BytesIO(response.content)
            c.drawImage(ImageReader(img_data), foto_x + 1 * mm, foto_y + 1 * mm, width=foto_w - 2 * mm, height=foto_h - 2 * mm, preserveAspectRatio=True, mask='auto')
    except Exception:
        c.setFillColor(COR_CINZA_BORDA)
        c.roundRect(foto_x + 1 * mm, foto_y + 1 * mm, foto_w - 2 * mm, foto_h - 2 * mm, 3 * mm, fill=1, stroke=0)
        c.setFillColor(COR_TEXTO_LABEL)
        c.setFont("Helvetica-Oblique", 7)
        c.drawCentredString(foto_x + foto_w / 2, foto_y + foto_h / 2, "Foto indisponível")

    c.setFillColor(COR_AZUL)
    c.roundRect(foto_x, foto_y - 7.5 * mm, foto_w, 6 * mm, 1.5 * mm, fill=1, stroke=0)
    c.setFillColor(COR_AMARELO)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(foto_x + foto_w / 2, foto_y - 5.5 * mm, "RESIDENTE OFICIAL")

    x_col = 54 * mm
    col_w  = largura - x_col - 36 * mm
    _linha_cor(c, x_col - 4 * mm, 12 * mm, x_col - 4 * mm, altura - 28 * mm, espessura=0.8, cor=COR_CINZA_BORDA)

    nome = residente_data.get('nome', '').upper()
    c.setFillColor(COR_TEXTO_LABEL)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(x_col, 56 * mm, "NOME DO TITULAR")
    
    c.setFillColor(COR_AZUL)
    c.setFont("Helvetica-Bold", 12)
    while c.stringWidth(nome, "Helvetica-Bold", 12) > col_w and len(nome) > 4:
        nome = nome[:-1]
    c.drawString(x_col, 51.5 * mm, nome)

    _label_valor(c, x_col, 42 * mm, "CPF", residente_data.get('cpf', '000.000.000-00'))
    _label_valor(c, x_col, 32 * mm, "DATA DE NASCIMENTO", residente_data.get('data_nascimento', '--/--/----'))

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

    _badge_desconto(c, largura - 14 * mm, 50 * mm, raio=9 * mm)

    # Geração Dinâmica do QR Code para Validação
    qr_io = gerar_qr_code_em_memoria(f"https://sagat-sga.vercel.app/fiscal/validar/{token}")
    qr_size = 25 * mm
    qr_x    = largura - qr_size - 6 * mm
    qr_y    = 11 * mm

    c.setFillColor(COR_BRANCO)
    c.setStrokeColor(COR_CINZA_BORDA)
    c.setLineWidth(1)
    c.roundRect(qr_x - 1.5 * mm, qr_y - 1.5 * mm, qr_size + 3 * mm, qr_size + 3 * mm, 2 * mm, fill=1, stroke=1)
    c.drawImage(ImageReader(qr_io), qr_x, qr_y, width=qr_size, height=qr_size)

    c.setFillColor(COR_VERDE)
    c.setFont("Helvetica-Bold", 5.5)
    c.drawCentredString(qr_x + qr_size / 2, qr_y - 4 * mm, "VALIDAR ACESSO")

    _linha_cor(c, 0, 7.5 * mm, largura, 7.5 * mm, espessura=1, cor=COR_VERDE)
    c.setFillColor(COR_VERDE)
    c.rect(0, 0, largura, 7 * mm, fill=1, stroke=0)

    c.setFillColor(COR_AMARELO)
    c.setFont("Helvetica-Bold", 5.5)
    c.drawCentredString(largura / 2, 2.5 * mm, "DOCUMENTO OFICIAL DA SECRETARIA MUNICIPAL DE TURISMO")

    c.save()
    return caminho_pdf

# ─── GERAÇÃO DO VOUCHER DE TURISMO (HOTEIS, PASSEIOS, PACOTES) ─────────────

def gerar_pdf_voucher(pedido_db: dict, dados_extra: dict = None) -> str:
    """Gera um PDF A4 para vouchers de serviços turísticos"""
    os.makedirs("tmp_pdfs", exist_ok=True)
    codigo_pedido = pedido_db.get("codigo_pedido", "SAGA-000")
    tipo_item = pedido_db.get("tipo_item", "servico")
    caminho_pdf = os.path.abspath(f"tmp_pdfs/Voucher_{codigo_pedido}.pdf")
    
    largura, altura = A4
    c = canvas.Canvas(caminho_pdf, pagesize=A4)
    MARGIN_X = 20 * mm
    
    # Fundo e Header
    c.setFillColor(COR_BRANCO)
    c.rect(0, 0, largura, altura, fill=1, stroke=0)
    
    c.setFillColor(COR_AZUL)
    c.rect(0, altura - 3 * mm, largura, 3 * mm, fill=1, stroke=0)
    
    c.setFillColor(COR_AZUL)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(MARGIN_X, altura - 15 * mm, "SagaTurismo")
    
    c.setFillColor(COR_TEXTO_LABEL)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN_X, altura - 20 * mm, "SECRETARIA MUNICIPAL DE TURISMO")
    
    c.setFillColor(COR_TEXTO_ESCURO)
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(largura - MARGIN_X, altura - 15 * mm, f"VOUCHER DE {tipo_item.upper()}")
    c.setFillColor(COR_TEXTO_LABEL)
    c.setFont("Helvetica", 9)
    c.drawRightString(largura - MARGIN_X, altura - 20 * mm, f"REF: {codigo_pedido}")
    
    c.setStrokeColor(COR_CINZA_BORDA)
    c.line(MARGIN_X, altura - 25 * mm, largura - MARGIN_X, altura - 25 * mm)
    
    y = altura - 35 * mm
    
    # Status
    c.setFillColor(COR_VERDE)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MARGIN_X, y, "✓ DOCUMENTO EMITIDO E PAGO")
    y -= 12 * mm

    # Helper para desenhar as caixas de dados no Voucher
    def _desenhar_bloco_voucher(x, y_pos, titulo, linhas_dados):
        altura_box = (len(linhas_dados) * 6 * mm) + 12 * mm
        c.setFillColor(COR_FUNDO)
        c.setStrokeColor(COR_CINZA_BORDA)
        c.roundRect(x, y_pos - altura_box, largura - 2 * MARGIN_X, altura_box, 3 * mm, fill=1, stroke=1)
        
        c.setFillColor(COR_AZUL)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x + 4 * mm, y_pos - 6 * mm, titulo.upper())
        
        c.setFillColor(COR_TEXTO_LABEL)
        c.setFont("Helvetica", 10)
        current_y = y_pos - 13 * mm
        for label, valor in linhas_dados:
            c.setFont("Helvetica-Bold", 9)
            c.drawString(x + 4 * mm, current_y, f"{label}:")
            c.setFont("Helvetica", 9)
            c.drawString(x + 35 * mm, current_y, str(valor or "—"))
            current_y -= 6 * mm
        return y_pos - altura_box - 8 * mm

    # Dados do Titular
    dados_titular = [
        ("Nome do Cliente", pedido_db.get("nome_cliente")),
        ("CPF", pedido_db.get("cpf_cliente")),
        ("E-mail", pedido_db.get("email_cliente")),
        ("Valor Pago", f"R$ {pedido_db.get('valor_total', 0.0):.2f}")
    ]
    y = _desenhar_bloco_voucher(MARGIN_X, y, "Dados do Viajante", dados_titular)

    # Dados Específicos do Serviço
    if tipo_item == "hotel":
        dados_servico = [
            ("Hotel", dados_extra.get("nome_hotel", "Confirmado no Sistema") if dados_extra else "Confirmado no Sistema"),
            ("Check-in", pedido_db.get("data_checkin")),
            ("Check-out", pedido_db.get("data_checkout")),
            ("Quantidade", f"{pedido_db.get('quantidade', 1)} Quarto(s)")
        ]
    elif tipo_item == "pacote":
        dados_servico = [
            ("Pacote", dados_extra.get("titulo_pacote", "Pacote Turístico") if dados_extra else "Pacote Turístico"),
            ("Data Início", pedido_db.get("data_checkin")),
            ("Quantidade", f"{pedido_db.get('quantidade', 1)} Pessoa(s)")
        ]
    else:
        dados_servico = [("Detalhes", "Consulte o itinerário na sua conta.")]

    y = _desenhar_bloco_voucher(MARGIN_X, y, "Detalhes do Serviço", dados_servico)

    # QR Code do Voucher
    qr_io = gerar_qr_code_em_memoria(codigo_pedido)
    tamanho_qr = 35 * mm
    c.setStrokeColor(COR_CINZA_BORDA)
    c.roundRect(MARGIN_X, y - tamanho_qr, tamanho_qr, tamanho_qr, 2 * mm, fill=0, stroke=1)
    c.drawImage(ImageReader(qr_io), MARGIN_X, y - tamanho_qr, width=tamanho_qr, height=tamanho_qr)
    
    c.setFillColor(COR_TEXTO_ESCURO)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN_X + tamanho_qr + 6 * mm, y - 10 * mm, "Apresente este voucher no momento do serviço.")
    c.setFillColor(COR_TEXTO_LABEL)
    c.setFont("Helvetica", 9)
    c.drawString(MARGIN_X + tamanho_qr + 6 * mm, y - 15 * mm, "Escaneie o QR Code para validação rápida pela equipa.")

    # Rodapé
    c.setStrokeColor(COR_CINZA_BORDA)
    c.line(MARGIN_X, 15 * mm, largura - MARGIN_X, 15 * mm)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN_X, 10 * mm, "SÃO GERALDO DO ARAGUAIA - PA")
    c.setFont("Helvetica", 8)
    c.drawRightString(largura - MARGIN_X, 10 * mm, "Documento Oficial Autenticado")

    c.save()
    return caminho_pdf