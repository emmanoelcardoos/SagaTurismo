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

LOGO_URL = "https://sagatur.com.br/logop.png"
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
    # ◄── A CORREÇÃO FOI FEITA NESTA LINHA:
    c.drawString(x, y, label) 
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


# ─── 1. GERAÇÃO DA CARTEIRA DIGITAL DE RESIDENTE (DESIGN MINIMALISTA) ───────

def _primeiro_ultimo_nome(nome_completo: str) -> str:
    """Reduz um nome completo para 'Primeiro Último' evitando texto espremido/cortado."""
    nome = _safe(nome_completo, "Residente").strip()
    partes = [p for p in nome.split() if p]
    if len(partes) <= 1:
        return nome.upper() if nome else "RESIDENTE"
    return f"{partes[0]} {partes[-1]}".upper()

def _foto_arredondada(c, x, y, w, h, foto_url, radius=5 * mm):
    """Desenha a foto do residente com cantos suavemente arredondados e moldura sutil."""
    c.saveState()
    caminho = c.beginPath()
    caminho.roundRect(x, y, w, h, radius)
    c.clipPath(caminho, stroke=0, fill=0)

    desenhada = False
    try:
        if foto_url:
            resposta = requests.get(foto_url, timeout=10)
            if resposta.status_code == 200:
                img_data = BytesIO(resposta.content)
                c.drawImage(ImageReader(img_data), x, y, width=w, height=h,
                            preserveAspectRatio=True, anchor='c', mask='auto')
                desenhada = True
    except Exception:
        desenhada = False

    if not desenhada:
        c.setFillColor(COR_FUNDO_BOX)
        c.rect(x, y, w, h, fill=1, stroke=0)
        c.setFillColor(COR_TEXTO_SUAVE)
        c.setFont("Helvetica-Oblique", 7)
        c.drawCentredString(x + w / 2, y + h / 2, "Foto indisponível")
    c.restoreState()

    # Moldura sutil por cima da foto (uma única linha fina)
    c.setStrokeColor(COR_LINHA)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, radius, fill=0, stroke=1)

def _tag_desconto(c, x_right, y_top, texto="50% DE DESCONTO"):
    """Badge/tag minimalista de desconto, no lugar do antigo selo circular pesado."""
    c.setFont("Helvetica-Bold", 6.5)
    largura_texto = c.stringWidth(texto, "Helvetica-Bold", 6.5)
    pad_x = 2.6 * mm
    tag_w = largura_texto / mm * mm + pad_x * 2
    tag_h = 5.6 * mm
    x = x_right - tag_w
    y = y_top - tag_h

    c.setFillColor(COR_DESTAQUE)
    c.roundRect(x, y, tag_w, tag_h, tag_h / 2, fill=1, stroke=0)
    # pequeno ponto decorativo
    c.setFillColor(COR_PRIMARIA)
    c.circle(x + pad_x * 0.55, y + tag_h / 2, 0.7 * mm, fill=1, stroke=0)
    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(x + pad_x * 0.55 + 1.6 * mm, y + tag_h / 2 - 1.1 * mm, texto)
    return x, y  # canto inferior esquerdo da tag, útil para posicionar outros elementos

def _chip_status(c, x, y, texto="ATIVO", cor=None):
    """Pequeno chip de status (ex.: ATIVO), moderno e discreto."""
    cor = cor or COR_SECUNDARIA
    c.setFont("Helvetica-Bold", 5.5)
    largura_texto = c.stringWidth(texto, "Helvetica-Bold", 5.5)
    pad_x = 2 * mm
    chip_h = 4 * mm
    chip_w = largura_texto + pad_x * 2 + 3 * mm
    c.setFillColor(colors.HexColor("#ffffff"))
    c.setStrokeColor(cor)
    c.setLineWidth(0.7)
    c.roundRect(x, y, chip_w, chip_h, chip_h / 2, fill=1, stroke=1)
    c.setFillColor(cor)
    c.circle(x + pad_x, y + chip_h / 2, 0.9 * mm, fill=1, stroke=0)
    c.setFillColor(COR_TEXTO_ESCURO)
    c.setFont("Helvetica-Bold", 5.5)
    c.drawString(x + pad_x + 2.4 * mm, y + chip_h / 2 - 0.9 * mm, texto)
    return chip_w


def gerar_pdf_carteira(residente_data: dict, token: str) -> str:
    """
    Gera a Carteira Digital de Residente em um design minimalista e moderno:
    fundo limpo, tipografia com hierarquia clara, foto com cantos suaves,
    QR code bem posicionado e uma tag de desconto discreta.
    """
    os.makedirs("tmp_pdfs", exist_ok=True)
    nome_pessoa_limpo = _safe(residente_data.get('nome'), 'Residente').replace(' ', '_')
    caminho_pdf = os.path.abspath(f"tmp_pdfs/Carteira_{nome_pessoa_limpo}_{token[:4]}.pdf")

    largura, altura = 135 * mm, 85 * mm
    c = canvas.Canvas(caminho_pdf, pagesize=(largura, altura))

    # ── Fundo limpo (branco) ────────────────────────────────────────────
    c.setFillColor(COR_BRANCO)
    c.rect(0, 0, largura, altura, fill=1, stroke=0)

    # ── Header sólido, sem gradiente/textura ────────────────────────────
    h_header = 19 * mm
    c.setFillColor(COR_PRIMARIA)
    c.rect(0, altura - h_header, largura, h_header, fill=1, stroke=0)
    # fio de destaque discreto na base do header
    c.setFillColor(COR_DESTAQUE)
    c.rect(0, altura - h_header, largura, 0.9 * mm, fill=1, stroke=0)

    logo_src = _obter_logo_institucional()
    logo_h = 10 * mm
    logo_y = altura - (h_header / 2) - (logo_h / 2)
    if logo_src:
        img_logo = logo_src if isinstance(logo_src, str) else ImageReader(logo_src)
        c.drawImage(img_logo, 8 * mm, logo_y, width=logo_h, height=logo_h,
                    mask='auto', preserveAspectRatio=True)
        texto_x = 8 * mm + logo_h + 3 * mm
    else:
        c.setFillColor(COR_BRANCO)
        c.circle(8 * mm + 5 * mm, altura - h_header / 2, 5 * mm, fill=1, stroke=0)
        c.setFillColor(COR_PRIMARIA)
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(8 * mm + 5 * mm, altura - h_header / 2 - 1.2 * mm, "SGA")
        texto_x = 8 * mm + 10 * mm + 3 * mm

    c.setFillColor(COR_BRANCO)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(texto_x, altura - h_header / 2 + 1.3 * mm, "SagaTurismo")
    c.setFillColor(COR_DESTAQUE)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(texto_x, altura - h_header / 2 - 4.3 * mm, "CARTEIRA DE RESIDENTE")

    c.setFillColor(colors.HexColor("#ffffffaa"))
    c.setFont("Helvetica", 5.5)
    c.drawRightString(largura - 8 * mm, altura - h_header / 2 - 4.3 * mm,
                       "SÃO GERALDO DO ARAGUAIA · PA")
    c.setFillColor(COR_BRANCO)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawRightString(largura - 8 * mm, altura - h_header / 2 + 1.3 * mm,
                       f"Nº {token[:8].upper()}")

    # ── Tag de desconto minimalista (substitui o selo circular antigo) ──
    _tag_desconto(c, largura - 8 * mm, altura - h_header - 4 * mm)

    # ── Foto do residente (cantos suavemente arredondados) ──────────────
    foto_x, foto_y = 8 * mm, 10 * mm
    foto_w, foto_h = 32 * mm, 44 * mm
    _foto_arredondada(c, foto_x, foto_y, foto_w, foto_h, residente_data.get('foto_url'))

    # ── Coluna de dados ───────────────────────────────────────────────
    x_col = foto_x + foto_w + 8 * mm
    col_w = largura - x_col - 32 * mm  # reserva espaço para o QR code à direita

    y_topo_dados = altura - h_header - 8 * mm

    # Nome — maior destaque tipográfico (apenas primeiro e último nome)
    nome_reduzido = _primeiro_ultimo_nome(residente_data.get('nome'))
    c.setFillColor(COR_TEXTO_SUAVE)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(x_col, y_topo_dados, "NOME DO TITULAR")

    tam_fonte_nome = 15
    while c.stringWidth(nome_reduzido, "Helvetica-Bold", tam_fonte_nome) > col_w and tam_fonte_nome > 9:
        tam_fonte_nome -= 0.5
    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", tam_fonte_nome)
    c.drawString(x_col, y_topo_dados - 6.5 * mm, nome_reduzido)

    # Linha fina de separação
    c.setStrokeColor(COR_LINHA)
    c.setLineWidth(0.6)
    c.line(x_col, y_topo_dados - 10 * mm, x_col + col_w, y_topo_dados - 10 * mm)

    # CPF e Data de Nascimento lado a lado
    y_linha2 = y_topo_dados - 18 * mm
    meia_col = col_w / 2
    _label_valor(c, x_col, y_linha2, "CPF", _safe(residente_data.get('cpf')),
                 tam_label=6, tam_valor=9.5)
    _label_valor(c, x_col + meia_col, y_linha2, "DATA DE NASCIMENTO",
                 _safe(residente_data.get('data_nascimento')), tam_label=6, tam_valor=9.5)

    # Validade + chip de status
    y_linha3 = y_linha2 - 12 * mm
    validade = (datetime.now() + timedelta(days=365)).strftime("%d/%m/%Y")
    c.setFillColor(COR_TEXTO_SUAVE)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(x_col, y_linha3, "VÁLIDO ATÉ")
    c.setFillColor(COR_SECUNDARIA)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x_col, y_linha3 - 5.5 * mm, validade)

    _chip_status(c, x_col + c.stringWidth(validade, "Helvetica-Bold", 12) + 6 * mm,
                 y_linha3 - 6.3 * mm, "ATIVO")

    # ── QR Code (canto inferior direito, legível e bem alinhado) ────────
    qr_size = 25 * mm
    qr_x = largura - qr_size - 8 * mm
    qr_y = 10 * mm
    qr_io = gerar_qr_code_em_memoria(f"https://sagatur.com.br/fiscal/validar/{token}")

    c.setFillColor(COR_BRANCO)
    c.setStrokeColor(COR_LINHA)
    c.setLineWidth(0.8)
    c.roundRect(qr_x - 1.5 * mm, qr_y - 1.5 * mm, qr_size + 3 * mm, qr_size + 3 * mm,
                2 * mm, fill=1, stroke=1)
    c.drawImage(ImageReader(qr_io), qr_x, qr_y, width=qr_size, height=qr_size)

    c.setFillColor(COR_TEXTO_SUAVE)
    c.setFont("Helvetica-Bold", 5)
    c.drawCentredString(qr_x + qr_size / 2, qr_y + qr_size + 2.6 * mm, "VALIDAR AUTENTICIDADE")

    # ── Rodapé discreto ──────────────────────────────────────────────────
    c.setStrokeColor(COR_SECUNDARIA)
    c.setLineWidth(1)
    c.line(8 * mm, 6.5 * mm, largura - 8 * mm, 6.5 * mm)
    c.setFillColor(COR_TEXTO_SUAVE)
    c.setFont("Helvetica", 5.5)
    c.drawString(8 * mm, 3.2 * mm, "Secretaria Municipal de Turismo · São Geraldo do Araguaia - PA")
    c.setFont("Helvetica-Bold", 5.5)
    c.drawRightString(largura - 8 * mm, 3.2 * mm, "DOCUMENTO OFICIAL")

    c.save()
    return caminho_pdf

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