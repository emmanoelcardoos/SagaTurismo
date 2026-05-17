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

# ─── CONFIGURAÇÕES VISUAIS INSTITUCIONAIS MUNICIPAIS ────────────────────────
COR_PRIMARIA = colors.HexColor("#00577C")       # Azul Petróleo Oficial
COR_SECUNDARIA = colors.HexColor("#009640")     # Verde Oficial
COR_DESTAQUE = colors.HexColor("#F9C400")       # Amarelo Prefeitura
COR_TEXTO_ESCURO = colors.HexColor("#0f172a")   # Slate 900
COR_TEXTO_MEDIO = colors.HexColor("#334155")    # Slate 700
COR_TEXTO_SUAVE = colors.HexColor("#64748b")    # Slate 500
COR_LINHA = colors.HexColor("#e2e8f0")          # Slate 200
COR_FUNDO_BOX = colors.HexColor("#f8fafc")      # Slate 50
COR_FUNDO_DESTAQUE = colors.HexColor("#f0fdf4") # Green 50

LOGO_URL = "https://saga-turismo.vercel.app/logop.png"
MARGIN_X = 20 * mm

# Aliases de retrocompatibilidade para a Carteira de Residente
COR_AZUL = COR_PRIMARIA
COR_VERDE = COR_SECUNDARIA
COR_AMARELO = COR_DESTAQUE
COR_FUNDO = COR_FUNDO_BOX
COR_CINZA_BORDA = COR_LINHA
COR_TEXTO_LABEL = COR_TEXTO_SUAVE
COR_BRANCO = colors.white


# ─── FUNÇÕES AUXILIARES GERAIS E DESIGN ─────────────────────────────────────

def _safe(value, fallback: str = "—") -> str:
    if value is None: return fallback
    value = str(value).strip()
    return value if value and value != "None" else fallback

def _formatar_data_br(data_str: str | None) -> str:
    if not data_str or "confirmar" in str(data_str).lower(): return "—"
    try:
        clean_date = str(data_str).split("T")[0]
        dt = datetime.strptime(clean_date, "%Y-%m-%d")
        return dt.strftime("%d/%m/%Y")
    except Exception:
        return _safe(data_str)

def formatar_moeda(valor):
    try:
        return f"R$ {float(valor):.2f}".replace('.', ',')
    except:
        return "R$ 0,00"

def _obter_logo_institucional():
    """Baixa a logo oficial da prefeitura para a memória"""
    try:
        response = requests.get(LOGO_URL, timeout=4)
        if response.status_code == 200:
            return ImageReader(BytesIO(response.content))
    except Exception:
        pass
    possiveis_caminhos = [
        os.path.join(os.getcwd(), "frontend", "public", "logop.png"),
        os.path.join(os.getcwd(), "public", "logop.png"),
        os.path.join(os.getcwd(), "app", "public", "logop.png")
    ]
    for p in possiveis_caminhos:
        if os.path.exists(p):
            return p
    return None

def gerar_qr_code_em_memoria(conteudo: str) -> BytesIO:
    qr = qrcode.QRCode(box_size=10, border=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(conteudo)
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="#00577C", back_color="white")
    qr_io = BytesIO()
    img_qr.save(qr_io, format='PNG')
    qr_io.seek(0)
    return qr_io

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
    c.drawString(x, y)
    c.setFillColor(COR_TEXTO_ESCURO)
    c.setFont("Helvetica-Bold", tam_valor)
    c.drawString(x, y - (tam_valor * 0.45 * mm) - 1.5 * mm, str(valor))

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

def _desenhar_header_voucher(c: canvas.Canvas, largura: float, altura: float, pedido: str):
    c.setFillColor(colors.white)
    c.rect(0, altura - 35 * mm, largura, 35 * mm, fill=1, stroke=0)
    c.setFillColor(COR_PRIMARIA)
    c.rect(0, altura - 2 * mm, largura, 2 * mm, fill=1, stroke=0)
    c.setFillColor(COR_DESTAQUE)
    c.rect(0, altura - 3 * mm, largura, 1 * mm, fill=1, stroke=0)

    logo_img = _obter_logo_institucional()
    if logo_img:
        c.drawImage(logo_img, MARGIN_X, altura - 26 * mm, width=45 * mm, height=18 * mm, mask='auto', preserveAspectRatio=True)
    else:
        c.setFillColor(COR_PRIMARIA)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(MARGIN_X, altura - 20 * mm, "SagaTurismo")

    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(largura - MARGIN_X, altura - 16 * mm, "CONFIRMAÇÃO DE HOSPEDAGEM / VOUCHER")
    c.setFillColor(COR_TEXTO_SUAVE)
    c.setFont("Helvetica", 9)
    c.drawRightString(largura - MARGIN_X, altura - 22 * mm, f"LOCALIZADOR: {pedido}")

def _desenhar_footer_voucher(c: canvas.Canvas, largura: float, pagina: int):
    c.setStrokeColor(COR_LINHA)
    c.setLineWidth(1)
    c.line(MARGIN_X, 15 * mm, largura - MARGIN_X, 15 * mm)
    c.setFillColor(COR_TEXTO_SUAVE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN_X, 10 * mm, "SECRETARIA MUNICIPAL DE TURISMO")
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN_X + 58 * mm, 10 * mm, "São Geraldo do Araguaia - Estado do Pará")
    c.drawRightString(largura - MARGIN_X, 10 * mm, f"Página {pagina} de 2")


# ─── 1. GERAÇÃO DA CARTEIRA DIGITAL DE RESIDENTE ────────────────────────────

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

    logo_src = _obter_logo_institucional()
    if logo_src:
        if isinstance(logo_src, BytesIO):
            c.drawImage(ImageReader(logo_src), 9 * mm, altura - 20 * mm, width=14 * mm, height=14 * mm, mask='auto', preserveAspectRatio=True)
        else:
            c.drawImage(logo_src, 9 * mm, altura - 20 * mm, width=14 * mm, height=14 * mm, mask='auto', preserveAspectRatio=True)
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

    qr_io = gerar_qr_code_em_memoria(f"https://saga-turismo.vercel.app/fiscal/validar/{token}")
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

# ─── 2. GERAÇÃO DO VOUCHER DE HOSPEDAGEM (HOTÉIS / PASSEIOS) ───────────────

def gerar_pdf_voucher(pedido_db: dict, dados_extra: dict = None) -> str:
    """Gera o PDF com o nome e a estrutura esperados pelo webhook, usando dados do Supabase"""
    output_dir = "tmp_pdfs"
    os.makedirs(output_dir, exist_ok=True)
    
    if not dados_extra: dados_extra = {}
    
    codigo_pedido = _safe(pedido_db.get("codigo_pedido", "SAGA-0000")).upper()
    caminho_pdf = os.path.join(output_dir, f"Voucher_{codigo_pedido}.pdf")
    
    c = canvas.Canvas(caminho_pdf, pagesize=A4)
    largura, altura = A4

    def nova_pagina(num_pag):
        _desenhar_footer_voucher(c, largura, num_pag)
        c.showPage()
        c.setFillColor(colors.white)
        c.rect(0, 0, largura, altura, fill=1, stroke=0)
        _desenhar_header_voucher(c, largura, altura, codigo_pedido)
        return altura - 45 * mm

    c.setFillColor(colors.white)
    c.rect(0, 0, largura, altura, fill=1, stroke=0)
    _desenhar_header_voucher(c, largura, altura, codigo_pedido)
    y = altura - 40 * mm

    def garantizar_espaco(espaco):
        nonlocal y
        if y - espaco < 25 * mm: y = nova_pagina(1)

    def desenhar_linha_divisoria():
        nonlocal y
        y -= 4 * mm
        c.setStrokeColor(COR_LINHA)
        c.setLineWidth(0.8)
        c.line(MARGIN_X, y, largura - MARGIN_X, y)
        y -= 8 * mm

    # --- STATUS E IDENTIFICAÇÃO DO PARCEIRO ---
    hotel_nome = _safe(dados_extra.get("nome") or pedido_db.get("nome_item"), "Acomodação Parceira")
    hotel_endereco = _safe(dados_extra.get("endereco") or pedido_db.get("endereco_completo"), "São Geraldo do Araguaia - PA")

    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN_X, y, "STATUS DA OPERAÇÃO DE TURISMO")
    y -= 6 * mm
    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(MARGIN_X, y, hotel_nome[:45])
    c.setFillColor(COR_SECUNDARIA)
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(largura - MARGIN_X, y, "✓ RESERVA CONFIRMADA")
    
    y -= 5 * mm
    c.setFillColor(COR_TEXTO_MEDIO)
    c.setFont("Helvetica", 9)
    c.drawString(MARGIN_X, y, f"Localização: {hotel_endereco}")
    y -= 2 * mm
    desenhar_linha_divisoria()

    # --- CARD DE CONFIRMAÇÃO DO CONTROLO MUNICIPAL ---
    garantir_espaco(35)
    c.setFillColor(COR_FUNDO_DESTAQUE)
    c.setStrokeColor(COR_SECUNDARIA)
    c.setLineWidth(1)
    c.roundRect(MARGIN_X, y - 22 * mm, largura - 2 * MARGIN_X, 22 * mm, 4 * mm, fill=1, stroke=1)
    
    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN_X + 8 * mm, y - 8 * mm, "LOCALIZADOR INTEGRADO DO ESTABELECIMENTO (CHECK-IN):")
    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(MARGIN_X + 8 * mm, y - 17 * mm, codigo_pedido)
    
    c.setFillColor(COR_TEXTO_MEDIO)
    c.setFont("Helvetica", 9)
    c.drawString(largura - MARGIN_X - 8 * mm, y - 9 * mm, "Apresente este documento na recepção da propriedade.")
    c.drawString(largura - MARGIN_X - 8 * mm, y - 14 * mm, "O imposto de fomento ao turismo local já se encontra recolhido.")
    y -= 32 * mm

    # --- INFORMAÇÕES NOMINAIS DOS INTEGRANTES DA COMITIVA (ATUALIZADO DINÂMICO) ---
    garantir_espaco(30)
    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN_X, y, "Manifesto Nominal de Hóspedes Autorizados")
    y -= 6 * mm
    
    c.setFillColor(COR_TEXTO_MEDIO)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN_X, y, "NOME COMPLETO DO TURISTA")
    c.drawString(MARGIN_X + 95 * mm, y, "DOCUMENTO REGISTADO (CPF)")
    c.drawString(MARGIN_X + 150 * mm, y, "VÍNCULO")
    y -= 5 * mm
    
    # Titular da Transação
    c.setFillColor(COR_TEXTO_ESCURO)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN_X, y, _safe(pedido_db.get("nome_cliente")).upper())
    c.setFont("Helvetica", 10)
    c.drawString(MARGIN_X + 95 * mm, y, _safe(pedido_db.get("cpf_cliente")))
    c.drawString(MARGIN_X + 150 * mm, y, "TITULAR")
    y -= 6 * mm
    
    # ◄── FIX CORREÇÃO DE ESCOPO: total_pessoas declarada no início para evitar UnboundLocalError
    total_pessoas = pedido_db.get("quantidade_pessoas", 1) or 1
    lista_acompanhantes = pedido_db.get("hospedes_extras", [])
    if not isinstance(lista_acompanhantes, list): 
        lista_acompanhantes = []
        
    if lista_acompanhantes:
        for hospede in lista_acompanhantes:
            garantir_espaco(8)
            nome_extra = _safe(hospede.get("nome")).upper()
            cpf_extra = _safe(hospede.get("cpf"), "NÃO INFORMADO")
            data_nasc_extra = _formatar_data_br(hospede.get("data_nascimento"))
            
            doc_exibicao = f"{cpf_extra} ({data_nasc_extra})" if data_nasc_extra != "—" else cpf_extra
            
            c.setFillColor(COR_TEXTO_ESCURO)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(MARGIN_X, y, nome_extra)
            c.setFont("Helvetica", 10)
            c.drawString(MARGIN_X + 95 * mm, y, doc_exibicao)
            c.drawString(MARGIN_X + 150 * mm, y, "ACOMPANHANTE")
            y -= 6 * mm
    else:
        if total_pessoas > 1:
            for idx in range(1, total_pessoas):
                garantir_espaco(8)
                c.setFillColor(COR_TEXTO_ESCURO)
                c.setFont("Helvetica-Bold", 10)
                c.drawString(MARGIN_X, y, f"ACOMPANHANTE {idx} (REGISTADO NO SISTEMA)")
                c.setFont("Helvetica", 10)
                c.drawString(MARGIN_X + 95 * mm, y, "VINCULADO AO CPF TITULAR")
                c.drawString(MARGIN_X + 150 * mm, y, "ACOMPANHANTE")
                y -= 6 * mm
            
    desenhar_linha_divisoria()

    # --- DETALHES DE ALOCAÇÃO DO QUARTO E ESTADIA ---
    garantir_espaco(50)
    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN_X, y, "Especificações da Estadia Contratada")
    y -= 8 * mm

    tipo_quarto_bruto = str(pedido_db.get("tipo_quarto", "standard")).lower()
    nome_quarto_real = _safe(dados_extra.get(f"quarto_{tipo_quarto_bruto}_nome"), "Quarto Standard")
    
    politicas_json = dados_extra.get("politicas", {})
    if not isinstance(politicas_json, dict): politicas_json = {}
    checkin_hora = _safe(politicas_json.get("horario_checkin"), "14:00h")
    checkout_hora = _safe(politicas_json.get("horario_checkout"), "12:00h")

    c.setFillColor(COR_FUNDO_BOX)
    c.setStrokeColor(COR_LINHA)
    c.setLineWidth(1)
    altura_box = 28 * mm
    c.roundRect(MARGIN_X, y - altura_box + 4 * mm, largura - 2 * MARGIN_X, altura_box, 3 * mm, fill=1, stroke=1)

    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN_X + 6 * mm, y - 3 * mm, "BED")
    
    c.setFillColor(COR_TEXTO_ESCURO)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN_X + 16 * mm, y - 2 * mm, nome_quarto_real.upper())
    c.setFillColor(COR_TEXTO_MEDIO)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN_X + 16 * mm, y - 6 * mm, f"Regime de Acomodação: Tarifa Regulamentada pela Secretaria de Turismo")
    
    y -= 14 * mm
    
    # Coluna Entrada
    c.setFillColor(COR_PRIMARIA); c.setFont("Helvetica-Bold", 14); c.drawString(MARGIN_X + 16 * mm, y, checkin_hora)
    c.setFillColor(COR_TEXTO_ESCURO); c.setFont("Helvetica-Bold", 10); c.drawString(MARGIN_X + 32 * mm, y, "CHECK-IN")
    c.setFillColor(COR_TEXTO_MEDIO); c.setFont("Helvetica", 8); c.drawString(MARGIN_X + 16 * mm, y - 4 * mm, _formatar_data_br(pedido_db.get("data_checkin")))

    c.setFillColor(COR_TEXTO_SUAVE); c.setFont("Helvetica", 14); c.drawString(largura / 2 - 5 * mm, y, "➔")

    # Coluna Saída
    X_SAIDA = largura / 2 + 25 * mm
    c.setFillColor(COR_PRIMARIA); c.setFont("Helvetica-Bold", 14); c.drawString(X_SAIDA, y, checkout_hora)
    c.setFillColor(COR_TEXTO_ESCURO); c.setFont("Helvetica-Bold", 10); c.drawString(X_SAIDA + 18 * mm, y, "CHECK-OUT")
    c.setFillColor(COR_TEXTO_MEDIO); c.setFont("Helvetica", 8); c.drawString(X_SAIDA, y - 4 * mm, _formatar_data_br(pedido_db.get("data_checkout")))

    y -= 18 * mm
    desenhar_linha_divisoria()

    # --- RESUMO FINANCEIRO INTEGRADO DO PAGBANK ---
    garantir_espaco(30)
    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN_X, y, "Balanço Consolidado Financeiro")
    y -= 6 * mm

    num_quartos = pedido_db.get("quantidade_quartos", 1) or pedido_db.get("quantidade", 1) or 1
    c.setFillColor(COR_TEXTO_MEDIO)
    c.setFont("Helvetica", 10)
    c.drawString(MARGIN_X, y, f"Unidade(s) de Quarto Alocada(s): {num_quartos} quarto(s)")
    y -= 5 * mm
    c.drawString(MARGIN_X, y, f"Total de Hóspedes Cobertos nesta Tarifa: {total_pessoas} pessoa(s)")
    
    c.setFillColor(COR_TEXTO_ESCURO)
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(largura - MARGIN_X, y + 5 * mm, "Total Líquido Liquidado:")
    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(largura - MARGIN_X, y - 1 * mm, formatar_moeda(pedido_db.get("valor_total")))

    _desenhar_footer_voucher(c, largura, 1)

    # =========================================================================
    # PÁGINA 2: CLÁUSULAS REGULAMENTARES E POLÍTICAS REAIS DA HOSPEDAGEM
    # =========================================================================
    y = nova_pagina(2)

    def bloco_texto(titulo, paragrafos):
        nonlocal y
        garantir_espaco(len(paragrafos) * 5 * mm + 18 * mm)
        c.setFillColor(COR_FUNDO_BOX)
        c.rect(MARGIN_X, y - 2 * mm, largura - 2 * MARGIN_X, 6 * mm, fill=1, stroke=0)
        c.setFillColor(COR_PRIMARIA)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(MARGIN_X + 2 * mm, y, titulo.upper())
        y -= 6 * mm
        c.setFillColor(COR_TEXTO_MEDIO)
        c.setFont("Helvetica", 9)
        for p in paragrafos:
            c.drawString(MARGIN_X + 2 * mm, y, p)
            y -= 4.5 * mm
        y -= 6 * mm

    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(MARGIN_X, y, "Normativas Municipais e Políticas Internas")
    y -= 6 * mm
    c.setFillColor(COR_TEXTO_SUAVE)
    c.setFont("Helvetica", 9)
    c.drawString(MARGIN_X, y, "Este documento é regulamentado pela Secretaria de Turismo e possui fé pública para ingresso na propriedade.")
    y -= 8 * mm
    
    c.setStrokeColor(COR_PRIMARIA)
    c.setLineWidth(1)
    c.line(MARGIN_X, y + 4 * mm, largura - MARGIN_X, y + 4 * mm)
    y -= 4 * mm

    regras_propriedade = []
    if politicas_json:
        for chave, val in politicas_json.items():
            if "horario" not in str(chave).lower():
                label_chave = str(chave).replace("_", " ").capitalize()
                regras_propriedade.append(f"· {label_chave}: {str(val)[:110]}")
                
    if not regras_propriedade:
        regras_propriedade = [
            "· Apresentação obrigatória de documento de identificação com foto no balcão da recepção.",
            "· Despesas de consumo interno e frigobar não inclusas, com pagamento direto ao hotel.",
            "· Cancelamentos ou modificações devem ser submetidos diretamente no painel do parceiro."
        ]
        
    bloco_texto("1. Políticas Específicas do Estabelecimento", regras_propriedade[:5])

    bloco_texto("2. Regulação Governamental de Turismo Coletivo", [
        "O estabelecimento parceiro está devidamente cadastrado no Cadastur e homologado sob as diretrizes fiscais",
        "municipais de São Geraldo do Araguaia - PA. O valor repassado cobre estritamente os serviços de hotelaria,",
        "sendo vedada qualquer cobrança de taxas ocultas ao turista que já realizou a liquidação na plataforma oficial."
    ])

    bloco_texto("3. Regras de Conduta e Preservação Ambiental Local", [
        "Como visitante de São Geraldo do Araguaia, o turista compromete-se a respeitar as normativas de proteção",
        "da biosfera dos ecossistemas do Rio Araguaia e áreas de conservação biológica. O descarte inadequado de",
        "resíduos ou danos ao patrimônio natural circundante acarretará sanções administrativas municipais diretas."
    ])

    contatos_json = dados_extra.get("contatos", {}) if dados_extra else {}
    if not isinstance(contatos_json, dict): contatos_json = {}
    hotel_email_suporte = _safe(contatos_json.get("email"), "suporte@sagaturismo.com.br")

    garantir_espaco(35)
    y -= 2 * mm
    c.setFillColor(COR_FUNDO_DESTAQUE)
    c.setStrokeColor(COR_PRIMARIA)
    c.setLineWidth(1)
    c.roundRect(MARGIN_X, y - 20 * mm, largura - 2 * MARGIN_X, 20 * mm, 3 * mm, fill=1, stroke=1)
    
    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN_X + 5 * mm, y - 6 * mm, "Central de Atendimento ao Turista - Secretaria de Turismo")
    
    c.setFillColor(COR_TEXTO_MEDIO)
    c.setFont("Helvetica", 9)
    c.drawString(MARGIN_X + 5 * mm, y - 12 * mm, f"Suporte Operacional do Estabelecimento: {hotel_email_suporte} | Ouvidoria Pública")
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN_X + 5 * mm, y - 16 * mm, "Portal SagaTurismo Oficial  ·  Prefeitura Municipal de São Geraldo do Araguaia")

    _desenhar_footer_voucher(c, largura, 2)
    c.save()
    return caminho_pdf