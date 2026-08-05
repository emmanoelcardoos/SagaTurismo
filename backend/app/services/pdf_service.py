import os
import requests
from io import BytesIO, StringIO
from datetime import datetime, timedelta
import qrcode
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.graphics import renderPDF
from svglib.svglib import svg2rlg
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── CONFIGURAÇÕES VISUAIS INSTITUCIONAIS ────────────────────────────────────
COR_PRIMARIA = colors.HexColor("#0A3D4A")       # Azul Escuro do Cabeçalho e Rodapé Esquerdo
COR_SECUNDARIA = colors.HexColor("#4F772D")     # Verde do Rodapé Direito
COR_DESTAQUE = colors.HexColor("#D4C345")       # Linha Dourada
COR_FUNDO_CARD = colors.HexColor("#F3F2E9")     # Fundo Bege Limpo
COR_TEXTO_ESCURO = colors.HexColor("#1A1A1A")   # Preto principal
COR_TEXTO_SUAVE = colors.HexColor("#374151")    # Cinza escuro para labels
COR_BRANCO = colors.white

LOGO_URL = "https://sagatur.com.br/logop.png"

# ─── FUNÇÕES AUXILIARES GERAIS E DESIGN ─────────────────────────────────────
def _safe(value, fallback: str = "—") -> str:
    if value is None: return fallback
    value = str(value).strip()
    return value if value and value != "None" else fallback

def _primeiro_ultimo_nome(nome_completo: str) -> str:
    nome = _safe(nome_completo, "Residente").strip()
    partes = [p for p in nome.split() if p]
    if len(partes) <= 1:
        return nome.title() if nome else "Residente"
    return f"{partes[0].title()} {partes[-1].title()}"

def _obter_logo_institucional():
    """Baixa a logo oficial para a memória"""
    try:
        response = requests.get(LOGO_URL, timeout=5)
        if response.status_code == 200:
            return ImageReader(BytesIO(response.content))
    except Exception:
        pass
    return None

def gerar_qr_code_em_memoria(conteudo: str) -> BytesIO:
    qr = qrcode.QRCode(box_size=10, border=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(conteudo)
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="black", back_color="white")
    qr_io = BytesIO()
    img_qr.save(qr_io, format='PNG')
    qr_io.seek(0)
    return qr_io

def _foto_circular(c, x, y, diametro, foto_url):
    raio = diametro / 2
    centro_x = x + raio
    centro_y = y + raio

    # Borda Grossa da Foto
    c.setStrokeColor(COR_PRIMARIA)
    c.setLineWidth(3.5)
    c.circle(centro_x, centro_y, raio, fill=0, stroke=1)

    desenhada = False
    try:
        if foto_url:
            # ◄── INÍCIO DA MÁGICA DA SEGURANÇA ──►
            # Se for um caminho interno (não começa por http), geramos a URL temporária
            if not foto_url.startswith("http"):
                # Pede ao cofre uma chave válida por 60 segundos
                resposta_supabase = supabase.storage.from_("comprovantes").create_signed_url(foto_url, 60)
                
                # A biblioteca do Supabase Python devolve um dicionário com a chave "signedURL"
                if isinstance(resposta_supabase, dict) and "signedURL" in resposta_supabase:
                    foto_url = resposta_supabase["signedURL"]
                elif isinstance(resposta_supabase, str):
                    foto_url = resposta_supabase
            # ◄── FIM DA MÁGICA ──►

            resposta = requests.get(foto_url, timeout=10)
            if resposta.status_code == 200:
                img_data = BytesIO(resposta.content)
                c.saveState()
                p = c.beginPath()
                p.circle(centro_x, centro_y, raio - 1.8) # Máscara interna
                c.clipPath(p, stroke=0)
                c.drawImage(ImageReader(img_data), x, y, width=diametro, height=diametro, mask='auto', preserveAspectRatio=True)
                c.restoreState()
                desenhada = True
    except Exception as e:
        print(f"Erro ao desenhar foto circular: {e}")
        pass

    if not desenhada:
        c.setFillColor(colors.HexColor("#cccccc"))
        c.circle(centro_x, centro_y, raio - 1.8, fill=1, stroke=0)

# ─── GERAÇÃO DA CARTEIRA DIGITAL DE RESIDENTE ───────────────────────────────
def gerar_pdf_carteira(residente_data: dict, token: str) -> str:
    os.makedirs("tmp_pdfs", exist_ok=True)
    nome_pessoa_limpo = _safe(residente_data.get('nome'), 'Residente').replace(' ', '_')
    caminho_pdf = os.path.abspath(f"tmp_pdfs/Carteira_{nome_pessoa_limpo}_{token[:4]}.pdf")

    # Proporção padrão do Cartão
    largura, altura = 135 * mm, 83 * mm
    c = canvas.Canvas(caminho_pdf, pagesize=(largura, altura))

    # 1. Fundo Bege do Cartão
    c.setFillColor(COR_FUNDO_CARD)
    c.rect(0, 0, largura, altura, fill=1, stroke=0)

    # ─── 1.5 MARCA D'ÁGUA VETORIAL (SVG) ────────────────────────────────────
    svg_watermark = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 105 573 188">
      <!-- SagaTurismo - Marca d'agua: Onca-pintada -->
      <g fill="#E5E3D2" opacity="0.15">
        <rect x="40" y="245" width="140" height="38" rx="19"/>
        <ellipse cx="300" cy="195" rx="190" ry="78"/>
        <ellipse cx="455" cy="215" rx="55" ry="60"/>
        <circle cx="115" cy="205" r="62"/>
        <ellipse cx="95" cy="245" rx="40" ry="28"/>
        <path d="M75,165 L60,120 L105,155 Z"/>
        <path d="M140,160 L165,115 L165,165 Z"/>
        <ellipse cx="170" cy="255" rx="40" ry="22"/>
        <path d="M500,230 C540,235 560,210 555,180 C575,175 585,150 565,135" fill="none" stroke="#E5E3D2" stroke-width="16" stroke-linecap="round"/>
      </g>
    </svg>"""
    
    try:
        # Lê o SVG da string e converte num objeto que o ReportLab entende
        drawing = svg2rlg(StringIO(svg_watermark))
        
        # Ajusta a escala para encaixar bem no meio do cartão (área clara)
        scale_factor = 0.14
        drawing.scale(scale_factor, scale_factor)
        drawing.width *= scale_factor
        drawing.height *= scale_factor
        
        # Desenha a marca d'água no centro (atrás dos dados do residente)
        renderPDF.draw(drawing, c, 35 * mm, 15 * mm)
    except Exception as e:
        print(f"Erro ao desenhar marca d'água: {e}")
        pass
    # ────────────────────────────────────────────────────────────────────────

    # 2. Header
    h_header = 16 * mm
    c.setFillColor(COR_PRIMARIA)
    c.rect(0, altura - h_header, largura, h_header, fill=1, stroke=0)

    # Logo Institucional Grande no Header
    logo_src = _obter_logo_institucional()
    logo_h = 15 * mm
    logo_x = 6 * mm
    logo_y = altura - (h_header / 2) - (logo_h / 2)

    if logo_src:
        c.drawImage(logo_src, logo_x, logo_y, width=logo_h, height=logo_h, mask='auto', preserveAspectRatio=True)
        texto_x = logo_x + logo_h + 4 * mm
    else:
        texto_x = 8 * mm

    # Título do Header
    c.setFillColor(COR_BRANCO)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(texto_x, altura - (h_header / 2) - 1.5 * mm, "Cartão Digital do Residente")

    # 3. Linha Divisória Dourada
    h_divider = 2 * mm
    c.setFillColor(COR_DESTAQUE)
    c.rect(0, altura - h_header - h_divider, largura, h_divider, fill=1, stroke=0)

    # 4. Corpo Principal (Área Útil)
    h_footer = 9 * mm
    y_corpo_bottom = h_footer
    area_h = altura - h_header - h_divider - h_footer

    # Coluna Esquerda: Foto Circular
    foto_diam = 34 * mm
    foto_x = 8 * mm
    foto_y = y_corpo_bottom + (area_h - foto_diam) / 2
    _foto_circular(c, foto_x, foto_y, foto_diam, residente_data.get('foto_url'))

    # Coluna Central: Dados do Residente
    x_dados = foto_x + foto_diam + 8 * mm
    y_texto = foto_y + foto_diam - 4 * mm

    # Nome Label
    c.setFillColor(COR_TEXTO_SUAVE)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x_dados, y_texto, "Nome:")

    # Nome Principal
    nome_reduzido = _primeiro_ultimo_nome(residente_data.get('nome'))
    c.setFillColor(COR_TEXTO_ESCURO)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(x_dados, y_texto - 5.5 * mm, nome_reduzido)

    # CPF
    c.setFillColor(COR_TEXTO_SUAVE)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x_dados, y_texto - 13 * mm, "CPF:")
    c.setFillColor(COR_TEXTO_ESCURO)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x_dados + 9 * mm, y_texto - 13 * mm, _safe(residente_data.get('cpf'), "—"))

    # Validade
    validade = (datetime.now() + timedelta(days=365)).strftime("%d/%m/%Y")
    c.setFillColor(COR_TEXTO_SUAVE)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x_dados, y_texto - 20 * mm, "Validade:")
    c.setFillColor(COR_TEXTO_ESCURO)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x_dados + 15 * mm, y_texto - 20 * mm, validade)

    # Coluna Direita: QR Code Isolado
    qr_size = 24 * mm
    qr_x = largura - qr_size - 7 * mm
    qr_y = y_corpo_bottom + (area_h - qr_size) / 2

    c.setFillColor(COR_BRANCO)
    c.setStrokeColor(colors.HexColor("#E5E7EB"))
    c.setLineWidth(0.8)
    c.roundRect(qr_x - 1.5 * mm, qr_y - 1.5 * mm, qr_size + 3 * mm, qr_size + 3 * mm, 1.5 * mm, fill=1, stroke=1)

    qr_io = gerar_qr_code_em_memoria(f"https://sagatur.com.br/fiscal/validar/{token}")
    c.drawImage(ImageReader(qr_io), qr_x, qr_y, width=qr_size, height=qr_size)

    # 5. Rodapé Institucional
    c.setFillColor(COR_PRIMARIA)
    c.rect(0, 0, largura * 0.2, h_footer, fill=1, stroke=0)

    c.setFillColor(COR_SECUNDARIA)
    c.rect(largura * 0.2, 0, largura * 0.8, h_footer, fill=1, stroke=0)

    # Texto Oficial da Secretaria no Footer
    c.setFillColor(COR_BRANCO)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(largura * 0.2 + 4 * mm, h_footer / 2 - 2 * mm, "Secretaria Municipal de Turismo de São Geraldo do Araguaia - PA")

    c.save()
    return caminho_pdf


# ─── 2. GERAÇÃO DO VOUCHER DE HOSPEDAGEM (HOTÉIS / PASSEIOS) ───────────────

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

def gerar_pdf_voucher(pedido_db: dict, dados_extra: dict = None) -> str:
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

    def garantir_espaco(espaco):
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

    # --- INFORMAÇÕES NOMINAIS DOS INTEGRANTES DA COMITIVA ---
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

    # --- RESUMO FINANCEIRO ---
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
    # PÁGINA 2: CLÁUSULAS REGULAMENTARES
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