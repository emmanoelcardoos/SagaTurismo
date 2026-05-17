import os
import re
import json
import requests
from io import BytesIO
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

# --- CONFIGURAÇÕES VISUAIS INSTITUCIONAIS MUNICIPAIS ---
COR_PRIMARIA = colors.HexColor("#00577C")       # Azul Petróleo Oficial (Prefeitura)
COR_SECUNDARIA = colors.HexColor("#009640")     # Verde Oficial (Confirmações)
COR_DESTAQUE = colors.HexColor("#F9C400")       # Amarelo Prefeitura (Realces)
COR_TEXTO_ESCURO = colors.HexColor("#0f172a")   # Slate 900 (Texto principal)
COR_TEXTO_MEDIO = colors.HexColor("#334155")    # Slate 700 (Labels e sub-detalhes)
COR_TEXTO_SUAVE = colors.HexColor("#64748b")    # Slate 500 (Legendas de rodapé)
COR_LINHA = colors.HexColor("#e2e8f0")          # Slate 200 (Divisórias leves)
COR_FUNDO_BOX = colors.HexColor("#f8fafc")      # Slate 50 (Fundo dos cards)
COR_FUNDO_DESTAQUE = colors.HexColor("#f0fdf4") # Green 50 (Fundo da caixa de confirmação)

LOGO_URL = "https://saga-turismo.vercel.app/logop.png"
MARGIN_X = 20 * mm

def _safe(value, fallback: str = "—") -> str:
    if value is None: return fallback
    value = str(value).strip()
    return value if value and value != "None" else fallback

def _formatar_data_br(data_str: str | None) -> str:
    if not data_str or "confirmar" in str(data_str).lower(): return "—"
    try:
        # Formata datas vindas do PostgreSQL (YYYY-MM-DD) para formato legível de turismo
        clean_date = str(data_str).split("T")[0]
        dt = datetime.strptime(clean_date, "%Y-%m-%d")
        return dt.strftime("%d/%m/%Y")
    except Exception:
        return _safe(data_str)

def _obter_logo_institucional():
    """Baixa a logo do site oficial em produção para injetar na memória do canvas do Railway"""
    try:
        response = requests.get(LOGO_URL, timeout=4)
        if response.status_code == 200:
            return ImageReader(BytesIO(response.content))
    except Exception as e:
        print(f"[AVISO] Falha ao obter logo oficial via rede: {e}")
    return None

def _desenhar_header(c: canvas.Canvas, largura: float, altura: float, pedido: str):
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
    c.drawRightString(largura - MARGIN_X, altura - 22 * mm, f"LOCALIZADOR DA RESERVA: {pedido}")

def _desenhar_footer(c: canvas.Canvas, largura: float, pagina: int):
    c.setStrokeColor(COR_LINHA)
    c.setLineWidth(1)
    c.line(MARGIN_X, 15 * mm, largura - MARGIN_X, 15 * mm)
    c.setFillColor(COR_TEXTO_SUAVE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN_X, 10 * mm, "SECRETARIA MUNICIPAL DE TURISMO")
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN_X + 58 * mm, 10 * mm, "São Geraldo do Araguaia - Estado do Pará")
    c.drawRightString(largura - MARGIN_X, 10 * mm, f"Página {pagina} de 2")

# =========================================================================
# GERADOR DE VOUCHER DE HOSPEDAGEM EM ESTABELECIMENTOS PARCEIROS
# =========================================================================
def gerar_pdf_voucher_hotel(pedido_db: dict, hotel_db: dict) -> str:
    """Gera um PDF A4 corporativo baseado nas tabelas pedidos e hoteis do Supabase"""
    output_dir = "tmp_pdfs"
    os.makedirs(output_dir, exist_ok=True)
    
    codigo_pedido = _safe(pedido_db.get("codigo_pedido", "SAGA-0000")).upper()
    caminho_pdf = os.path.join(output_dir, f"Voucher_{codigo_pedido}.pdf")
    
    c = canvas.Canvas(caminho_pdf, pagesize=A4)
    largura, altura = A4

    def nova_pagina(num_pag):
        _desenhar_footer(c, largura, num_pag)
        c.showPage()
        c.setFillColor(colors.white)
        c.rect(0, 0, largura, altura, fill=1, stroke=0)
        _desenhar_header(c, largura, altura, codigo_pedido)
        return altura - 45 * mm

    # Configuração Inicial da Página 1
    c.setFillColor(colors.white)
    c.rect(0, 0, largura, altura, fill=1, stroke=0)
    _desenhar_header(c, largura, altura, codigo_pedido)
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

    # --- BLOCO STATUS E IDENTIFICAÇÃO DO ESTABELECIMENTO ---
    hotel_nome = _safe(hotel_db.get("nome") or pedido_db.get("nome_item"), "Acomodação Parceira")
    hotel_endereco = _safe(hotel_db.get("endereco") or pedido_db.get("endereco_completo"), "São Geraldo do Araguaia - PA")

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

    # --- CARD DE CONFIRMAÇÃO DO CONTROLO MUNICIPAL (PNR STYLE) ---
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
    
    # Tratamento Dinâmico de Acompanhantes baseados nas vagas agregadas
    total_pessoas = pedido_db.get("quantidade_pessoas", 1) or 1
    if total_pessoas > 1:
        for idx in range(1, total_pessoas):
            garantir_espaco(8)
            c.setFillColor(COR_TEXTO_ESCURO)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(MARGIN_X, y, f"ACOMPANHANTE {idx} (REGISTADO NO SISTEMA)")
            c.setFont("Helvetica", 10)
            c.drawString(MARGIN_X + 95 * mm, y, "VINCULADO AO CPF TITULAR")
            c.drawString(MARGIN_X + 150 * mm, y, f"ACOMPANHANTE")
            y -= 6 * mm
            
    desenhar_linha_divisoria()

    # --- DETALHES DE ALOCAÇÃO DO QUARTO E ESTADIA ---
    garantir_espaco(50)
    c.setFillColor(COR_PRIMARIA)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN_X, y, "Especificações da Estadia Contratada")
    y -= 8 * mm

    tipo_quarto_bruto = str(pedido_db.get("tipo_quarto", "standard")).lower()
    nome_quarto_real = _safe(hotel_db.get(f"quarto_{tipo_quarto_bruto}_nome"), "Quarto Standard")
    
    # Leitura segura do JSONB de políticas da propriedade para check-in e check-out
    politicas_json = hotel_db.get("politicas", {})
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
    c.drawString(MARGIN_X + 6 * mm, y - 3 * mm, "🛌")
    
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
    c.setFillColor(COR_TEXTO_MEDIO); c.setFont("Helvetica", 8); c.drawString(X_CHEGA, y - 4 * mm, _formatar_data_br(pedido_db.get("data_checkout")))

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

    _desenhar_footer(c, largura, 1)

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

    # 1. Extração de Políticas Dinâmicas da tabela Hoteis
    regras_propriedade = []
    if politicas_json:
        for chave, val in politicas_json.items():
            if "horario" not in str(chave).lower():
                # Formata a chave para ficar elegante na leitura
                label_chave = str(chave).replace("_", " ").capitalize()
                regras_propriedade.append(f"· {label_chave}: {str(val)[:110]}")
                
    if not regras_propriedade:
        regras_propriedade = [
            "· Apresentação obrigatória de documento de identificação com foto no balcão da recepção.",
            "· Despesas de consumo interno e frigobar não inclusas, com pagamento direto ao hotel.",
            "· Cancelamentos ou modificações devem ser submetidos diretamente no painel do parceiro."
        ]
        
    bloco_texto("1. Políticas Específicas do Estabelecimento", regras_propriedade[:5])

    # 2. Cláusulas Fixo-Administrativas Municipais
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

    # 3. Informações de Apoio ao Cidadão da Prefeitura
    contatos_json = hotel_db.get("contatos", {})
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

    _desenhar_footer(c, largura, 2)
    c.save()
    return caminho_pdf