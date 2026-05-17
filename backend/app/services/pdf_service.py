"""
SagaTurismo — Voucher de Hotel Premium
Design editorial de nível internacional (Booking/Airbnb tier)
"""

import os
import math
from io import BytesIO
from datetime import datetime, timedelta

import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

# ══════════════════════════════════════════════════════════════════════════════
#  PALETA OFICIAL SAGATURISMO  (não alterar)
# ══════════════════════════════════════════════════════════════════════════════
AZUL       = colors.HexColor("#00577C")   # primária
VERDE      = colors.HexColor("#009640")   # confirmação / sucesso
AMARELO    = colors.HexColor("#F9C400")   # destaque dourado
FUNDO      = colors.HexColor("#F8FAFC")   # slate-50
BORDA      = colors.HexColor("#E2E8F0")   # slate-200
TEXTO      = colors.HexColor("#0F172A")   # slate-900
MUTED      = colors.HexColor("#475569")   # slate-600
BRANCO     = colors.white

# Derivados premium (dentro da identidade)
AZUL_ESCURO   = colors.HexColor("#003F5C")   # header fundo
AZUL_MID      = colors.HexColor("#004F6E")
FUNDO_CARD    = colors.HexColor("#FFFFFF")
VERDE_LIGHT   = colors.HexColor("#ECFDF5")   # fundo badge confirmação
AMARELO_LIGHT = colors.HexColor("#FFFBEB")
SLATE_100     = colors.HexColor("#F1F5F9")


# ══════════════════════════════════════════════════════════════════════════════
#  HELPERS DE BAIXO NÍVEL
# ══════════════════════════════════════════════════════════════════════════════

def _hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))


def _gradient_rect(c, x, y, w, h, hex1, hex2, steps=40, vertical=True):
    r1, g1, b1 = _hex_to_rgb(hex1)
    r2, g2, b2 = _hex_to_rgb(hex2)
    for i in range(steps):
        t = i / steps
        r = r1 + (r2 - r1) * t
        g = g1 + (g2 - g1) * t
        b = b1 + (b2 - b1) * t
        c.setFillColorRGB(r, g, b)
        if vertical:
            slice_h = h / steps
            c.rect(x, y + i * slice_h, w, slice_h + 0.5, fill=1, stroke=0)
        else:
            slice_w = w / steps
            c.rect(x + i * slice_w, y, slice_w + 0.5, h, fill=1, stroke=0)


def _rounded_rect(c, x, y, w, h, r, fill_color=None, stroke_color=None, lw=0.5):
    """Rectângulo com cantos arredondados."""
    if fill_color:
        c.setFillColor(fill_color)
    if stroke_color:
        c.setStrokeColor(stroke_color)
        c.setLineWidth(lw)
    c.roundRect(x, y, w, h, r, fill=1 if fill_color else 0,
                stroke=1 if stroke_color else 0)


def _pill(c, x, y, w, h, fill_color, text, text_color=BRANCO, font="Helvetica-Bold", fsize=8):
    """Etiqueta tipo pill/badge."""
    _rounded_rect(c, x, y, w, h, h / 2, fill_color=fill_color)
    c.setFillColor(text_color)
    c.setFont(font, fsize)
    c.drawCentredString(x + w / 2, y + (h - fsize * 0.35 * mm) / 2 + 0.3 * mm, text)


def _line(c, x1, y1, x2, y2, color=BORDA, lw=0.5):
    c.setStrokeColor(color)
    c.setLineWidth(lw)
    c.line(x1, y1, x2, y2)


def _star(c, cx, cy, r=2.5 * mm, color=AMARELO):
    """Estrela de 5 pontas desenhada como path."""
    c.setFillColor(color)
    c.setStrokeColor(color)
    c.setLineWidth(0.3)
    pts = []
    for i in range(10):
        angle = math.pi / 2 + i * math.pi / 5
        radius = r if i % 2 == 0 else r * 0.42
        pts.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    p = c.beginPath()
    p.moveTo(*pts[0])
    for pt in pts[1:]:
        p.lineTo(*pt)
    p.close()
    c.drawPath(p, fill=1, stroke=0)


def _wrap_text(c, text, font, size, max_width):
    """Quebra texto em linhas."""
    c.setFont(font, size)
    words = str(text).split()
    lines, line = [], ""
    for w in words:
        test = (line + " " + w).strip()
        if c.stringWidth(test, font, size) <= max_width:
            line = test
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def _truncate(c, text, font, size, max_w):
    text = str(text)
    c.setFont(font, size)
    if c.stringWidth(text, font, size) <= max_w:
        return text
    while text and c.stringWidth(text + "…", font, size) > max_w:
        text = text[:-1]
    return text + "…"


def formatar_moeda(valor):
    try:
        return f"R$ {float(valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except:
        return "R$ 0,00"


def gerar_qr(conteudo: str) -> BytesIO:
    qr = qrcode.QRCode(box_size=10, border=1,
                       error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(conteudo)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#00577C", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


# ══════════════════════════════════════════════════════════════════════════════
#  COMPONENTES DE LAYOUT
# ══════════════════════════════════════════════════════════════════════════════

def _draw_header(c, W, H, codigo_pedido: str):
    """
    Cabeçalho de padrão premium: gradiente azul profundo, logo à esquerda,
    código do pedido à direita, faixa dourada no topo.
    """
    h_header = 38 * mm

    # Faixa decorativa dourada no topo absoluto
    c.setFillColor(AMARELO)
    c.rect(0, H - 2 * mm, W, 2 * mm, fill=1, stroke=0)

    # Gradiente de fundo do cabeçalho
    _gradient_rect(c, 0, H - h_header, W, h_header - 2 * mm,
                   "#003F5C", "#00577C", steps=50, vertical=False)

    # Padrão geométrico sutil (linhas diagonais transparentes)
    c.saveState()
    c.setStrokeColor(BRANCO)
    c.setLineWidth(0.4)
    c.setStrokeAlpha(0.05)
    step = 8 * mm
    for i in range(-int(h_header / step), int(W / step) + int(h_header / step)):
        x0 = i * step
        c.line(x0, H - h_header, x0 + h_header, H)
    c.restoreState()

    # Logo (tenta carregar; fallback tipográfico elegante)
    logo_path = None
    for p in [
        os.path.join(os.getcwd(), "frontend", "public", "logop.png"),
        os.path.join(os.getcwd(), "public", "logop.png"),
        os.path.join(os.getcwd(), "app", "public", "logop.png"),
        "/home/claude/logop.png",
    ]:
        if os.path.exists(p):
            logo_path = p
            break

    logo_x, logo_y = 14 * mm, H - h_header + 7 * mm
    logo_h = 18 * mm

    if logo_path:
        c.drawImage(logo_path, logo_x, logo_y,
                    height=logo_h, width=48 * mm,
                    preserveAspectRatio=True, mask="auto")
    else:
        # Fallback: marca tipográfica
        c.setFillColor(AMARELO)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(logo_x, logo_y + 8 * mm, "Saga")
        c.setFillColor(BRANCO)
        c.drawString(logo_x + 40 * mm, logo_y + 8 * mm, "Turismo")
        c.setFillColor(BRANCO)
        c.setFont("Helvetica", 7)
        c.drawString(logo_x, logo_y + 3 * mm, "SECRETARIA MUNICIPAL DE TURISMO")

    # Divisor vertical sutil
    c.setStrokeColor(BRANCO)
    c.setLineWidth(0.3)
    c.setStrokeAlpha(0.2)
    c.line(W / 2 + 10 * mm, H - h_header + 6 * mm, W / 2 + 10 * mm, H - 5 * mm)
    c.setStrokeAlpha(1)

    # Bloco direito — informações do voucher
    rx = W - 14 * mm  # right-align anchor

    c.setFillColor(BRANCO)
    c.setFont("Helvetica", 7.5)
    c.drawRightString(rx, H - 8 * mm, "VOUCHER DE RESERVA OFICIAL")

    # Código em destaque dourado
    c.setFillColor(AMARELO)
    c.setFont("Helvetica-Bold", 15)
    c.drawRightString(rx, H - 18 * mm, codigo_pedido.upper())

    c.setFillColor(BRANCO)
    c.setFont("Helvetica", 6.5)
    c.drawRightString(rx, H - 24 * mm, "São Geraldo do Araguaia · Pará · Brasil")

    # Data de emissão
    hoje = datetime.now().strftime("%d/%m/%Y às %H:%M")
    c.setFillColor(colors.HexColor("#FFFFFF80"))
    c.setFont("Helvetica", 6)
    c.drawRightString(rx, H - 29 * mm, f"Emitido em {hoje}")


def _draw_status_banner(c, W, y, status_pagamento: str):
    """Faixa de confirmação de pagamento."""
    is_pago = "pag" in str(status_pagamento).lower() or "confirm" in str(status_pagamento).lower()
    bg = VERDE_LIGHT
    text_color = VERDE
    icon = "✓"
    msg = f"  {icon}  RESERVA CONFIRMADA — PAGAMENTO APROVADO"

    if not is_pago:
        bg = AMARELO_LIGHT
        text_color = colors.HexColor("#B45309")
        icon = "⏳"
        msg = f"  {icon}  RESERVA PENDENTE — AGUARDANDO CONFIRMAÇÃO DE PAGAMENTO"

    c.setFillColor(bg)
    c.rect(0, y, W, 8.5 * mm, fill=1, stroke=0)

    c.setStrokeColor(text_color)
    c.setLineWidth(0)
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(W / 2, y + 3 * mm, msg)

    return y + 8.5 * mm  # retorna borda superior da faixa


def _draw_section_title(c, x, y, titulo: str, W_util: float):
    """Título de secção com decoração."""
    c.setFillColor(AZUL)
    c.rect(x, y + 1 * mm, 3 * mm, 5 * mm, fill=1, stroke=0)

    c.setFillColor(TEXTO)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(x + 6 * mm, y + 2.5 * mm, titulo.upper())

    c.setStrokeColor(BORDA)
    c.setLineWidth(0.5)
    label_w = c.stringWidth(titulo.upper(), "Helvetica-Bold", 9.5) + 12 * mm
    c.line(x + label_w, y + 4.5 * mm, x + W_util, y + 4.5 * mm)


def _draw_card(c, x, y, w, h, accent_color=None, shadow=True):
    """Card branco com sombra suave e borda fina."""
    if shadow:
        c.setFillColor(colors.HexColor("#00000010"))
        c.roundRect(x + 1 * mm, y - 1 * mm, w, h, 4 * mm, fill=1, stroke=0)

    c.setFillColor(FUNDO_CARD)
    c.setStrokeColor(BORDA)
    c.setLineWidth(0.7)
    c.roundRect(x, y, w, h, 4 * mm, fill=1, stroke=1)

    if accent_color:
        c.setFillColor(accent_color)
        c.roundRect(x, y, 3 * mm, h, 2 * mm, fill=1, stroke=0)
        c.rect(x + 1.5 * mm, y, 1.5 * mm, h, fill=1, stroke=0)


def _draw_kv_row(c, x, y, label: str, value: str, max_val_w: float,
                 label_font="Helvetica-Bold", label_size=7.5,
                 val_font="Helvetica", val_size=9):
    """Par label / valor numa linha."""
    c.setFillColor(MUTED)
    c.setFont(label_font, label_size)
    c.drawString(x, y, label)

    c.setFillColor(TEXTO)
    c.setFont(val_font, val_size)
    val_str = _truncate(c, str(value or "—"), val_font, val_size, max_val_w)
    return val_str


def _draw_two_col_card(c, x, y, w, h, accent_color, rows_left, rows_right):
    """
    Card de duas colunas com linhas label/valor.
    rows_left / rows_right: lista de (label, valor)
    """
    _draw_card(c, x, y, w, h, accent_color=accent_color)
    pad = 8 * mm
    col_w = (w - 2 * pad - 6 * mm) / 2  # espaço por coluna
    row_h = 10.5 * mm

    def _column(items, cx, cy_start):
        cy = cy_start
        for label, val in items:
            c.setFillColor(MUTED)
            c.setFont("Helvetica-Bold", 7)
            c.drawString(cx, cy, label.upper())
            c.setFillColor(TEXTO)
            c.setFont("Helvetica-Bold", 9)
            val_str = _truncate(c, str(val or "—"), "Helvetica-Bold", 9, col_w - 2 * mm)
            c.drawString(cx, cy - 4.5 * mm, val_str)
            cy -= row_h

    cy_start = y + h - 7 * mm
    _column(rows_left, x + pad, cy_start)

    # Divisor vertical
    mid_x = x + w / 2
    c.setStrokeColor(BORDA)
    c.setLineWidth(0.5)
    c.line(mid_x, y + 4 * mm, mid_x, y + h - 4 * mm)

    _column(rows_right, mid_x + 6 * mm, cy_start)


# ══════════════════════════════════════════════════════════════════════════════
#  FUNÇÃO PRINCIPAL
# ══════════════════════════════════════════════════════════════════════════════

def gerar_pdf_voucher_premium(pedido_db: dict, dados_extra: dict = None) -> str:
    """
    Gera voucher de hotel de padrão internacional.
    pedido_db  → tabela `pedidos`
    dados_extra → tabela `hoteis`
    """
    os.makedirs("tmp_pdfs", exist_ok=True)
    dados_extra = dados_extra or {}

    codigo = pedido_db.get("codigo_pedido", "SAGA-000").upper()
    caminho = os.path.abspath(f"tmp_pdfs/Voucher_Hotel_{codigo}.pdf")

    W, H = A4                           # 210 × 297 mm
    MX = 16 * mm                        # margem lateral
    WU = W - 2 * MX                     # largura útil

    c = canvas.Canvas(caminho, pagesize=A4)
    c.setTitle(f"Voucher SagaTurismo — {codigo}")
    c.setAuthor("SagaTurismo — Secretaria Municipal de Turismo")

    # ── FUNDO ────────────────────────────────────────────────────────────────
    c.setFillColor(FUNDO)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ── CABEÇALHO ────────────────────────────────────────────────────────────
    _draw_header(c, W, H, codigo)

    # ── FAIXA DE STATUS ──────────────────────────────────────────────────────
    STATUS_Y = H - 38 * mm
    _draw_status_banner(c, W, STATUS_Y, pedido_db.get("status_pagamento", ""))

    # Cursor (y decrescente — começa logo após a faixa de status)
    y = STATUS_Y - 8 * mm

    # ══════════════════════════════════════════════════════════════════════════
    #  SECÇÃO 1 — HOTEL
    # ══════════════════════════════════════════════════════════════════════════
    _draw_section_title(c, MX, y, "Estabelecimento", WU)
    y -= 8 * mm

    hotel_nome   = str(dados_extra.get("nome", "Hotel Parceiro SagaTurismo"))
    hotel_end    = str(dados_extra.get("endereco") or "Endereço não informado")
    estrelas     = int(dados_extra.get("estrelas") or 0)
    descricao    = str(dados_extra.get("descricao") or "")

    politicas_json = dados_extra.get("politicas", {}) or {}
    if isinstance(politicas_json, str):
        import json
        try:
            politicas_json = json.loads(politicas_json)
        except:
            politicas_json = {}

    contatos_json = dados_extra.get("contatos", {}) or {}
    hotel_wpp  = str(dados_extra.get("whatsapp") or contatos_json.get("telefone") or "—")
    hotel_mail = str(contatos_json.get("email") or "—")

    checkin_hora  = str(politicas_json.get("horario_checkin", "14:00"))
    checkout_hora = str(politicas_json.get("horario_checkout", "12:00"))

    # Card do hotel
    card_h = 28 * mm + (8 * mm if descricao else 0)
    _draw_card(c, MX, y - card_h, WU, card_h, accent_color=AZUL)

    # Nome + estrelas
    cx = MX + 8 * mm
    cy = y - 7 * mm
    c.setFillColor(TEXTO)
    c.setFont("Helvetica-Bold", 13)
    nome_disp = _truncate(c, hotel_nome.upper(), "Helvetica-Bold", 13, WU - 50 * mm)
    c.drawString(cx, cy, nome_disp)

    # Estrelas
    sx = MX + 8 * mm + c.stringWidth(nome_disp, "Helvetica-Bold", 13) + 4 * mm
    for i in range(min(estrelas, 5)):
        _star(c, sx + i * 5 * mm, cy + 1.5 * mm, r=2.2 * mm)

    # Endereço
    cy -= 6 * mm
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    end_disp = _truncate(c, hotel_end, "Helvetica", 8.5, WU - 20 * mm)
    c.drawString(cx, cy, f"📍  {end_disp}")

    # Linha divisória
    cy -= 4 * mm
    _line(c, cx, cy, MX + WU - 6 * mm, cy, BORDA)
    cy -= 5 * mm

    # Linha de contactos
    col2 = MX + WU / 2 + 4 * mm
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(cx, cy, "TELEFONE / WHATSAPP")
    c.drawString(col2, cy, "E-MAIL")
    cy -= 4.5 * mm
    c.setFillColor(TEXTO)
    c.setFont("Helvetica", 8.5)
    c.drawString(cx, cy, _truncate(c, hotel_wpp, "Helvetica", 8.5, WU / 2 - 12 * mm))
    c.drawString(col2, cy, _truncate(c, hotel_mail, "Helvetica", 8.5, WU / 2 - 12 * mm))

    # Descrição opcional
    if descricao:
        cy -= 5 * mm
        _line(c, cx, cy, MX + WU - 6 * mm, cy, BORDA)
        cy -= 5 * mm
        c.setFillColor(MUTED)
        c.setFont("Helvetica-Oblique", 7.5)
        desc_lines = _wrap_text(c, descricao, "Helvetica-Oblique", 7.5, WU - 20 * mm)
        for dl in desc_lines[:2]:
            c.drawString(cx, cy, dl)
            cy -= 4 * mm

    y -= card_h + 6 * mm

    # ══════════════════════════════════════════════════════════════════════════
    #  SECÇÃO 2 — DETALHES DA RESERVA (duas colunas)
    # ══════════════════════════════════════════════════════════════════════════
    _draw_section_title(c, MX, y, "Detalhes da Reserva", WU)
    y -= 8 * mm

    tipo_q      = str(pedido_db.get("tipo_quarto", "standard")).lower()
    nome_quarto = str(dados_extra.get(f"quarto_{tipo_q}_nome") or f"Quarto {tipo_q.capitalize()}")
    qtd_quartos = str(pedido_db.get("quantidade_quartos") or pedido_db.get("quantidade") or 1)
    qtd_pessoas = str(pedido_db.get("quantidade_pessoas") or 1)
    metodo_pag  = str(pedido_db.get("metodo_pagamento") or "—").capitalize()
    status_pag  = str(pedido_db.get("status_pagamento") or "—").capitalize()

    rows_left = [
        ("Check-in",  f"{pedido_db.get('data_checkin', '—')}  ·  a partir das {checkin_hora}"),
        ("Check-out", f"{pedido_db.get('data_checkout', '—')}  ·  até às {checkout_hora}"),
        ("Tipo de Quarto", nome_quarto.upper()),
    ]
    rows_right = [
        ("Quartos Reservados", f"{qtd_quartos} unidade(s)"),
        ("Total de Hóspedes",  f"{qtd_pessoas} pessoa(s)"),
        ("Método de Pagamento", metodo_pag),
    ]

    card_res_h = 38 * mm
    _draw_two_col_card(c, MX, y - card_res_h, WU, card_res_h,
                       accent_color=AMARELO,
                       rows_left=rows_left, rows_right=rows_right)
    y -= card_res_h + 6 * mm

    # ══════════════════════════════════════════════════════════════════════════
    #  SECÇÃO 3 — CLIENTE
    # ══════════════════════════════════════════════════════════════════════════
    _draw_section_title(c, MX, y, "Dados do Hóspede Principal", WU)
    y -= 8 * mm

    nome_cli  = str(pedido_db.get("nome_cliente") or "Não informado").upper()
    cpf_cli   = str(pedido_db.get("cpf_cliente") or "—")
    email_cli = str(pedido_db.get("email_cliente") or "—")
    tel_cli   = str(pedido_db.get("telefone_cliente") or "—")

    # Card com 4 campos em duas colunas
    rows_cli_l = [
        ("Nome Completo", nome_cli),
        ("E-mail",        email_cli),
    ]
    rows_cli_r = [
        ("CPF",      cpf_cli),
        ("Telefone", tel_cli),
    ]
    card_cli_h = 28 * mm
    _draw_two_col_card(c, MX, y - card_cli_h, WU, card_cli_h,
                       accent_color=VERDE,
                       rows_left=rows_cli_l, rows_right=rows_cli_r)
    y -= card_cli_h + 6 * mm

    # ══════════════════════════════════════════════════════════════════════════
    #  SECÇÃO 4 — COMODIDADES DO QUARTO
    # ══════════════════════════════════════════════════════════════════════════
    comodidades_quarto = dados_extra.get(f"quarto_{tipo_q}_comodidades") or \
                         dados_extra.get("comodidades") or []
    if isinstance(comodidades_quarto, str):
        import json
        try:
            comodidades_quarto = json.loads(comodidades_quarto)
        except:
            comodidades_quarto = [comodidades_quarto]

    if comodidades_quarto:
        _draw_section_title(c, MX, y, f"Comodidades — {nome_quarto}", WU)
        y -= 8 * mm

        items = [str(i) for i in comodidades_quarto[:12]]
        cols = 3
        col_w_item = WU / cols
        rows = math.ceil(len(items) / cols)
        card_com_h = max(14 * mm, rows * 6 * mm + 8 * mm)

        _draw_card(c, MX, y - card_com_h, WU, card_com_h, accent_color=AZUL, shadow=True)

        for idx, item in enumerate(items):
            col_idx = idx % cols
            row_idx = idx // cols
            ix = MX + 8 * mm + col_idx * col_w_item
            iy = y - 7 * mm - row_idx * 6 * mm
            c.setFillColor(AZUL)
            c.circle(ix + 1.5 * mm, iy + 1.5 * mm, 1.2 * mm, fill=1, stroke=0)
            c.setFillColor(TEXTO)
            c.setFont("Helvetica", 8)
            c.drawString(ix + 4.5 * mm, iy, _truncate(c, item, "Helvetica", 8, col_w_item - 8 * mm))

        y -= card_com_h + 6 * mm

    # ══════════════════════════════════════════════════════════════════════════
    #  SECÇÃO 5 — POLÍTICAS
    # ══════════════════════════════════════════════════════════════════════════
    politicas_list = []
    if isinstance(politicas_json, dict):
        for k, v in politicas_json.items():
            if "horario" not in k.lower():
                politicas_list.append(f"{str(k).replace('_', ' ').capitalize()}: {v}")
    elif isinstance(politicas_json, list):
        politicas_list = [str(p) for p in politicas_json]

    if not politicas_list:
        politicas_list = [
            "Cancelamento sujeito às políticas do estabelecimento — consulte antes do check-in.",
            "Documento original com foto obrigatório na chegada.",
            "Consumo de frigobar, room service e serviços extras não incluídos no valor pago.",
            "Animais de estimação: verificar disponibilidade com o hotel.",
        ]

    _draw_section_title(c, MX, y, "Informações Importantes & Políticas", WU)
    y -= 8 * mm

    card_pol_h = max(20 * mm, min(len(politicas_list), 5) * 6 * mm + 8 * mm)
    _draw_card(c, MX, y - card_pol_h, WU, card_pol_h, shadow=True)

    py = y - 7 * mm
    for pol in politicas_list[:5]:
        lines = _wrap_text(c, pol, "Helvetica", 8, WU - 18 * mm)
        for li, ln in enumerate(lines[:2]):
            if li == 0:
                c.setFillColor(AMARELO)
                c.rect(MX + 5 * mm, py - 0.5 * mm, 2.5 * mm, 2.5 * mm, fill=1, stroke=0)
                c.setFillColor(MUTED)
                c.setFont("Helvetica", 8)
                c.drawString(MX + 9.5 * mm, py, ln)
            else:
                c.setFillColor(MUTED)
                c.setFont("Helvetica", 8)
                c.drawString(MX + 9.5 * mm, py, ln)
            py -= 4.5 * mm
        py -= 1 * mm

    y -= card_pol_h + 6 * mm

    # ══════════════════════════════════════════════════════════════════════════
    #  SECÇÃO 6 — RESUMO FINANCEIRO + QR CODE
    # ══════════════════════════════════════════════════════════════════════════
    # Espaço restante (mínimo 48mm para este bloco)
    espaco = y - 20 * mm
    if espaco < 48 * mm:
        c.showPage()
        # fundo nova página
        c.setFillColor(FUNDO)
        c.rect(0, 0, W, H, fill=1, stroke=0)
        y = H - 14 * mm

    _draw_section_title(c, MX, y, "Resumo Financeiro", WU)
    y -= 8 * mm

    card_fin_h = 36 * mm
    _draw_card(c, MX, y - card_fin_h, WU, card_fin_h, accent_color=VERDE, shadow=True)

    # Valor total — grande e nobre
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(MX + 8 * mm, y - 8 * mm, "VALOR TOTAL PAGO")

    c.setFillColor(AZUL_ESCURO)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(MX + 8 * mm, y - 18 * mm, formatar_moeda(pedido_db.get("valor_total", 0.0)))

    # Badge "isento taxas"
    _pill(c, MX + 8 * mm, y - 28 * mm, 72 * mm, 7 * mm,
          VERDE_LIGHT, "✓  Isento de taxas municipais de turismo",
          text_color=VERDE, fsize=7)

    # QR Code à direita
    qr_size = 24 * mm
    qr_x = MX + WU - qr_size - 2 * mm
    qr_y = y - card_fin_h + 4 * mm
    qr_buf = gerar_qr(f"https://sagat-sga.vercel.app/fiscal/validar/{pedido_db.get('codigo_pedido', '')}")

    # Fundo branco com borda para o QR
    _rounded_rect(c, qr_x - 2 * mm, qr_y - 2 * mm,
                  qr_size + 4 * mm, qr_size + 4 * mm,
                  2 * mm, fill_color=BRANCO, stroke_color=BORDA, lw=0.7)
    c.drawImage(ImageReader(qr_buf), qr_x, qr_y,
                width=qr_size, height=qr_size, mask="auto")

    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(qr_x + qr_size / 2, qr_y - 5 * mm, "VALIDAR RESERVA")

    y -= card_fin_h + 4 * mm

    # ══════════════════════════════════════════════════════════════════════════
    #  RODAPÉ
    # ══════════════════════════════════════════════════════════════════════════
    FOOTER_H = 18 * mm
    # Gradiente de rodapé
    _gradient_rect(c, 0, 0, W, FOOTER_H, "#003F5C", "#00577C",
                   steps=30, vertical=False)

    # Faixa dourada
    c.setFillColor(AMARELO)
    c.rect(0, FOOTER_H, W, 1 * mm, fill=1, stroke=0)

    # Colunas do rodapé
    c.setFillColor(BRANCO)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MX, FOOTER_H - 6 * mm, "SAGATURISMO")
    c.setFont("Helvetica", 7)
    c.drawString(MX, FOOTER_H - 11 * mm, "Secretaria Municipal de Turismo")
    c.drawString(MX, FOOTER_H - 15 * mm, "São Geraldo do Araguaia · Pará · Brasil")

    c.setFont("Helvetica", 7)
    c.drawCentredString(W / 2, FOOTER_H - 8 * mm, "Este voucher é o comprovante oficial da sua reserva.")
    c.drawCentredString(W / 2, FOOTER_H - 13 * mm, "Apresente-o no check-in (impresso ou digital).")

    c.setFont("Helvetica", 6.5)
    c.drawRightString(W - MX, FOOTER_H - 8 * mm, f"Código: {codigo}")
    c.drawRightString(W - MX, FOOTER_H - 13 * mm, "sagat-sga.vercel.app")

    c.save()
    return caminho


# ══════════════════════════════════════════════════════════════════════════════
#  DEMO — dados simulados para visualização
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    pedido_demo = {
        "codigo_pedido":     "SAGA-2025-0842",
        "nome_cliente":      "Rafael Monteiro de Souza",
        "cpf_cliente":       "123.456.789-00",
        "email_cliente":     "rafael.souza@email.com.br",
        "telefone_cliente":  "+55 (94) 99812-3456",
        "valor_total":       890.00,
        "metodo_pagamento":  "Cartão de Crédito",
        "status_pagamento":  "Pago",
        "data_checkin":      "14/06/2025",
        "data_checkout":     "17/06/2025",
        "quantidade_pessoas": 2,
        "quantidade_quartos": 1,
        "tipo_quarto":       "luxo",
    }

    hotel_demo = {
        "nome":        "Pousada Araguaia Beira-Rio",
        "estrelas":    4,
        "descricao":   "Pousada boutique à beira do Rio Araguaia, com vista privilegiada, gastronomia regional e atendimento personalizado. Ideal para casais e famílias.",
        "endereco":    "Rua das Palmeiras, 340 — Centro, São Geraldo do Araguaia, PA",
        "whatsapp":    "+55 (94) 3372-1800",
        "contatos":    {"email": "reservas@pousadaaraguaia.com.br", "telefone": "+55 (94) 3372-1800"},
        "politicas":   {
            "horario_checkin":  "14:00",
            "horario_checkout": "12:00",
            "cancelamento":     "Gratuito até 48h antes do check-in; após, cobra-se 1 diária.",
            "pets":             "Não permitido.",
            "fumantes":         "Proibido fumar nas áreas internas.",
        },
        "quarto_luxo_nome":        "Suíte Araguaia Vista Rio",
        "quarto_standard_nome":    "Apartamento Standard",
        "quarto_luxo_comodidades": [
            "Vista para o Rio", "Ar-condicionado Split", "Cama King Size",
            "TV 50\" Smart", "Frigobar Premium", "Varanda privativa",
            "Café da manhã incluso", "Wi-Fi 200 Mbps", "Cofre digital",
            "Secador de cabelo", "Banheiro com banheira", "Roupões e chinelos",
        ],
    }

    caminho = gerar_pdf_voucher_premium(pedido_demo, hotel_demo)
    print(f"PDF gerado: {caminho}")