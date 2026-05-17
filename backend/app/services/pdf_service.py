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

# ─── PALETA DE CORES OFICIAIS SAGA TURISMO (OTA PREMIUM STYLE) ──────────────
COR_AZUL_PREFEITURA  = colors.HexColor("#00577C")   # Azul Oficial (Primária)
COR_VERDE_SUCESSO    = colors.HexColor("#009640")   # Verde Confirmação
COR_AMARELO_DESTAQUE = colors.HexColor("#F9C400")   # Amarelo/Dourado (Detalhes)
COR_FUNDO_MODERNO    = colors.HexColor("#F8FAFC")   # Fundo de Cards (Slate 50)
COR_LINHA_DIVISORIA  = colors.HexColor("#E2E8F0")   # Separadores elegantes (Slate 200)
COR_TEXTO_PRINCIPAL  = colors.HexColor("#0F172A")   # Slate 900 (Leitura Nobre)
COR_TEXTO_MUTED      = colors.HexColor("#475569")   # Slate 600 (Labels e Detalhes)
COR_BRANCO           = colors.white

# Aliases de retrocompatibilidade para a Carteira de Residente
COR_AZUL         = COR_AZUL_PREFEITURA
COR_VERDE        = COR_VERDE_SUCESSO
COR_AMARELO      = COR_AMARELO_DESTAQUE
COR_FUNDO        = COR_FUNDO_MODERNO
COR_CINZA_BORDA  = COR_LINHA_DIVISORIA
COR_TEXTO_ESCURO = COR_TEXTO_PRINCIPAL
COR_TEXTO_LABEL  = COR_TEXTO_MUTED

# ─── FUNÇÕES AUXILIARES GERAIS E CARTEIRA ───────────────────────────────────

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

# ─── FUNÇÕES AUXILIARES VOUCHER PREMIUM ─────────────────────────────────────

def formatar_moeda(valor):
    try:
        return f"R$ {float(valor):.2f}".replace('.', ',')
    except:
        return "R$ 0,00"

def _desenhar_cabecalho_premium(c, largura, altura, tipo_item, codigo_pedido):
    """Desenha um banner superior moderno e limpo digno de uma grande OTA"""
    c.setFillColor(COR_AZUL_PREFEITURA)
    c.rect(0, altura - 32 * mm, largura, 32 * mm, fill=1, stroke=0)
    
    c.setFillColor(COR_AMARELO_DESTAQUE)
    c.rect(0, altura - 33 * mm, largura, 1 * mm, fill=1, stroke=0)
    
    path_logo = os.path.join(os.getcwd(), "frontend", "public", "logop.png")
    if os.path.exists(path_logo):
        c.drawImage(path_logo, 20 * mm, altura - 24 * mm, width=40 * mm, height=16 * mm, mask='auto', preserveAspectRatio=True)
    else:
        c.setFillColor(COR_BRANCO)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(20 * mm, altura - 22 * mm, "SagaTurismo")
        
    c.setFillColor(COR_BRANCO)
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(largura - 20 * mm, altura - 14 * mm, f"CONFIRMAÇÃO DE RESERVA")
    
    c.setFillColor(COR_AMARELO_DESTAQUE)
    c.setFont("Helvetica-Bold", 13)
    c.drawRightString(largura - 20 * mm, altura - 22 * mm, f"CÓDIGO: {codigo_pedido.upper()}")
    
    c.setFillColor(COR_BRANCO)
    c.setFont("Helvetica", 8)
    c.drawRightString(largura - 20 * mm, altura - 27 * mm, "Secretaria Municipal de Turismo  ·  São Geraldo do Araguaia - PA")

def _desenhar_card_detalhes(c, x, y, w, h, titulo, dados, cor_accent=COR_AZUL_PREFEITURA):
    """Desenha blocos de informação estruturados com design clean"""
    c.setFillColor(COR_FUNDO_MODERNO)
    c.setStrokeColor(COR_LINHA_DIVISORIA)
    c.setLineWidth(0.8)
    c.roundRect(x, y - h, w, h, 6 * mm, fill=1, stroke=1)
    
    c.setFillColor(cor_accent)
    c.roundRect(x, y - h, 3 * mm, h, 2 * mm, fill=1, stroke=0)
    c.rect(x + 1.5 * mm, y - h, 1.5 * mm, h, fill=1, stroke=0) 
    
    c.setFillColor(COR_AZUL_PREFEITURA)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x + 6 * mm, y - 6 * mm, titulo.upper())
    
    c.setStrokeColor(COR_LINHA_DIVISORIA)
    c.setLineWidth(0.5)
    c.line(x + 6 * mm, y - 9 * mm, x + w - 6 * mm, y - 9 * mm)
    
    current_y = y - 15 * mm
    for chave, valor in dados:
        c.setFillColor(COR_TEXTO_MUTED)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x + 6 * mm, current_y, f"{chave}:")
        
        c.setFillColor(COR_TEXTO_PRINCIPAL)
        c.setFont("Helvetica", 9)
        c.drawString(x + 40 * mm, current_y, str(valor or "—"))
        current_y -= 5.5 * mm

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

# ─── 2. GERAÇÃO DO VOUCHER DE HOTEL REMASTERIZADO ──────────────────────────

def gerar_pdf_voucher(pedido_db: dict, dados_extra: dict = None) -> str:
    """Gera um Voucher PDF de padrão internacional para reservas hoteleiras"""
    os.makedirs("tmp_pdfs", exist_ok=True)
    codigo_pedido = pedido_db.get("codigo_pedido", "SAGA-000")
    
    largura, altura = A4
    caminho_pdf = os.path.abspath(f"tmp_pdfs/Voucher_Hotel_{codigo_pedido}.pdf")
    c = canvas.Canvas(caminho_pdf, pagesize=A4)
    
    MARGIN_X = 20 * mm
    LARGURA_UTIL = largura - (2 * MARGIN_X)
    
    # 1. Desenhar o topo institucional e comercial
    _desenhar_cabecalho_premium(c, largura, altura, "hotel", codigo_pedido)
    
    # 2. Badge de Status de Liquidação (Verde Oficial)
    y_cursor = altura - 42 * mm
    c.setFillColor(COR_VERDE_SUCESSO)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN_X, y_cursor, "✓ RESERVA TOTALMENTE PAGA E CONFIRMADA VIA SAGATURISMO")
    
    # 3. Informações da Propriedade (Dados dinâmicos da Supabase via dados_extra)
    y_cursor -= 6 * mm
    hotel_nome = dados_extra.get("nome", "Hotel Parceiro Autorizado") if dados_extra else "Hotel Parceiro Autorizado"
    hotel_endereco = dados_extra.get("endereco", "São Geraldo do Araguaia - PA") if dados_extra else "São Geraldo do Araguaia - PA"
    hotel_telefone = dados_extra.get("telefone", "(94) 99999-9999") if dados_extra else "Não Informado"
    hotel_email = dados_extra.get("email", "contato@hotel.com.br") if dados_extra else "Não Informado"
    
    bloco_hotel = [
        ("Estabelecimento", hotel_nome),
        ("Localização", hotel_endereco),
        ("Contacto Telefónico", hotel_telefone),
        ("E-mail do Hotel", hotel_email)
    ]
    _desenhar_card_detalhes(c, MARGIN_X, y_cursor, LARGURA_UTIL, 36 * mm, "Acomodação & Vínculo Local", bloco_hotel)
    
    # 4. Detalhes Estritos da Estadia (Período, Noites e Quartos)
    y_cursor -= 42 * mm
    checkin_hora = dados_extra.get("horario_checkin", "14:00h") if dados_extra else "14:00h"
    checkout_hora = dados_extra.get("horario_checkout", "12:00h") if dados_extra else "12:00h"
    
    bloco_estadia = [
        ("Data de Check-in", f"{pedido_db.get('data_checkin')} (A partir das {checkin_hora})"),
        ("Data de Check-out", f"{pedido_db.get('data_checkout')} (Até às {checkout_hora})"),
        ("Tipo de Acomodação", pedido_db.get("quarto_tipo", "Quarto Standard").upper()),
        ("Quantidade Reservada", f"{pedido_db.get('quantidade', 1)} Unidade(s)")
    ]
    _desenhar_card_detalhes(c, MARGIN_X, y_cursor, LARGURA_UTIL, 36 * mm, "Especificações da Estadia", bloco_estadia, COR_AMARELO_DESTAQUE)
    
    # 5. Lista Nominal de Hóspedes (Titular + Dependentes integrados da Supabase)
    y_cursor -= 42 * mm
    c.setFillColor(COR_AZUL_PREFEITURA)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN_X, y_cursor, "HÓSPEDES VINCULADOS A ESTA EMISSÃO")
    
    # Tabela Nominal com Cabeçalho Elegante
    y_cursor -= 5 * mm
    c.setFillColor(COR_AZUL_PREFEITURA)
    c.rect(MARGIN_X, y_cursor - 6 * mm, LARGURA_UTIL, 6 * mm, fill=1, stroke=0)
    
    c.setFillColor(COR_BRANCO)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN_X + 4 * mm, y_cursor - 4.5 * mm, "NOME COMPLETO")
    c.drawString(MARGIN_X + 80 * mm, y_cursor - 4.5 * mm, "DOCUMENTO (CPF)")
    c.drawString(MARGIN_X + 120 * mm, y_cursor - 4.5 * mm, "TIPO")
    
    y_cursor -= 6 * mm
    
    # Extração de comitiva dinâmica vinda da transação da Supabase
    hospedes = []
    hospedes.append({
        "nome": pedido_db.get("nome_cliente", "Não Informado"),
        "cpf": pedido_db.get("cpf_cliente", "Não Informado"),
        "tipo": "Titular"
    })
    
    if dados_extra and dados_extra.get("dependentes"):
        for dep in dados_extra.get("dependentes"):
            hospedes.append({
                "nome": dep.get("nome", "Dependente"),
                "cpf": dep.get("cpf", "---"),
                "tipo": "Acompanhante"
            })
            
    # Renderização em Linhas (Zebra Striping suave para legibilidade)
    cont_linha = 0
    for h in hospedes:
        if cont_linha % 2 == 0:
            c.setFillColor(COR_FUNDO_MODERNO)
            c.rect(MARGIN_X, y_cursor - 6 * mm, LARGURA_UTIL, 6 * mm, fill=1, stroke=0)
            
        c.setFillColor(COR_TEXTO_PRINCIPAL)
        c.setFont("Helvetica", 8.5)
        c.drawString(MARGIN_X + 4 * mm, y_cursor - 4.2 * mm, str(h["nome"]).upper())
        c.drawString(MARGIN_X + 80 * mm, y_cursor - 4.2 * mm, str(h["cpf"]))
        
        c.setFillColor(COR_AZUL_PREFEITURA if h["tipo"] == "Titular" else COR_TEXTO_MUTED)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(MARGIN_X + 120 * mm, y_cursor - 4.2 * mm, str(h["tipo"]).upper())
        
        y_cursor -= 6 * mm
        cont_linha += 1

    # 6. Políticas da Propriedade & Termos Legais (Regras da Supabase)
    y_cursor -= 8 * mm
    c.setFillColor(COR_AZUL_PREFEITURA)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN_X, y_cursor, "POLÍTICAS DA PROPRIEDADE & REGRAS DE CANCELAMENTO")
    
    y_cursor -= 4 * mm
    politicas_texto = dados_extra.get("politicas", [
        "· Cancelamento gratuito disponível até 24h antes do check-in contratado.",
        "· Obrigatória a apresentação de documento de identificação original com foto de todos os integrantes no ato do check-in.",
        "· Animais de estimação: Consultar diretamente o estabelecimento sobre taxas e restrições adicionais.",
        "· Consumos extras no frigobar ou serviços extras do hotel não estão inclusos nesta tarifa governamental e devem ser liquidados no local."
    ]) if dados_extra else [
        "· Cancelamento gratuito disponível até 24h antes do check-in contratado.",
        "· Obrigatória a apresentação de documento de identificação original com foto de todos os integrantes no ato do check-in."
    ]
    
    c.setFillColor(COR_TEXTO_MUTED)
    c.setFont("Helvetica", 8.5)
    for linha in politicas_texto:
        c.drawString(MARGIN_X + 2 * mm, y_cursor, linha)
        y_cursor -= 4.5 * mm

    # 7. Resumo de Faturamento Integrado do PagBank
    y_cursor -= 4 * mm
    c.setStrokeColor(COR_LINHA_DIVISORIA)
    c.setLineWidth(0.8)
    c.line(MARGIN_X, y_cursor, largura - MARGIN_X, y_cursor)
    
    y_cursor -= 8 * mm
    c.setFillColor(COR_TEXTO_MUTED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN_X, y_cursor + 2 * mm, "TOTAL DA TRANSAÇÃO COMERCIAL")
    c.setFillColor(COR_TEXTO_PRINCIPAL)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(MARGIN_X, y_cursor - 3 * mm, formatar_moeda(pedido_db.get('valor_total', 0.0)))
    
    # Mensagem de Isenção Governamental Autenticada
    c.setFillColor(COR_FUNDO_MODERNO)
    c.setStrokeColor(COR_VERDE_SUCESSO)
    c.setLineWidth(0.5)
    c.roundRect(largura - MARGIN_X - 85 * mm, y_cursor - 4 * mm, 85 * mm, 8 * mm, 1.5 * mm, fill=1, stroke=1)
    
    c.setFillColor(COR_VERDE_SUCESSO)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(largura - MARGIN_X - 42.5 * mm, y_cursor - 1.5 * mm, "ISENTO DE TAXAS TURÍSTICAS MUNICIPAIS (LEI DE INCENTIVO)")

    # 8. Rodapé Fixo Homologado
    c.setStrokeColor(COR_LINHA_DIVISORIA)
    c.setLineWidth(0.6)
    c.line(MARGIN_X, 16 * mm, largura - MARGIN_X, 16 * mm)
    
    c.setFillColor(COR_TEXTO_MUTED)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(MARGIN_X, 11 * mm, "SÃO GERALDO DO ARAGUAIA - ESTADO DO PARÁ")
    
    c.setFont("Helvetica", 7.5)
    c.drawRightString(largura - MARGIN_X, 11 * mm, "Voucher Eletrónico Homologado por Processamento Assíncrono da Central de Turismo")

    c.save()
    return caminho_pdf