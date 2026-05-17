import os
import requests
from io import BytesIO
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

# ─── PALETA DE CORES OFICIAIS SAGA TURISMO (OTA PREMIUM STYLE) ──────────────
COR_AZUL_PREFEITURA = colors.HexColor("#00577C")   # Azul Oficial (Primária)
COR_VERDE_SUCESSO    = colors.HexColor("#009640")   # Verde Confirmação
COR_AMARELO_DESTAQUE = colors.HexColor("#F9C400")   # Amarelo/Dourado (Detalhes)
COR_FUNDO_MODERNO    = colors.HexColor("#F8FAFC")   # Fundo de Cards (Slate 50)
COR_LINHA_DIVISORIA  = colors.HexColor("#E2E8F0")   # Separadores elegantes (Slate 200)
COR_TEXTO_PRINCIPAL  = colors.HexColor("#0F172A")   # Slate 900 (Leitura Nobre)
COR_TEXTO_MUTED      = colors.HexColor("#475569")   # Slate 600 (Labels e Detalhes)
COR_BRANCO           = colors.white

def _desenhar_cabecalho_premium(c, largura, altura, tipo_item, codigo_pedido):
    """Desenha um banner superior moderno e limpo digno de uma grande OTA"""
    # Barra azul principal do topo
    c.setFillColor(COR_AZUL_PREFEITURA)
    c.rect(0, altura - 32 * mm, largura, 32 * mm, fill=1, stroke=0)
    
    # Detalhe em dourado inferior da barra
    c.setFillColor(COR_AMARELO_DESTAQUE)
    c.rect(0, altura - 33 * mm, largura, 1 * mm, fill=1, stroke=0)
    
    # Logo Oficial do Município
    path_logo = os.path.join(os.getcwd(), "frontend", "public", "logop.png")
    if os.path.exists(path_logo):
        c.drawImage(path_logo, 20 * mm, altura - 24 * mm, width=40 * mm, height=16 * mm, mask='auto', preserveAspectRatio=True)
    else:
        c.setFillColor(COR_BRANCO)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(20 * mm, altura - 22 * mm, "SagaTurismo")
        
    # Identificador de Confirmação do Lado Direito
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
    
    # Linha vertical indicadora de categoria (Estilo Dashboard Moderno)
    c.setFillColor(cor_accent)
    c.roundRect(x, y - h, 3 * mm, h, 2 * mm, fill=1, stroke=0)
    c.rect(x + 1.5 * mm, y - h, 1.5 * mm, h, fill=1, stroke=0) # Alinha cantos internos
    
    # Título do Card
    c.setFillColor(COR_AZUL_PREFEITURA)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x + 6 * mm, y - 6 * mm, titulo.upper())
    
    # Separador interno leve
    c.setStrokeColor(COR_LINHA_DIVISORIA)
    c.setLineWidth(0.5)
    c.line(x + 6 * mm, y - 9 * mm, x + w - 6 * mm, y - 9 * mm)
    
    # Renderização das linhas de texto (chave-valor)
    current_y = y - 15 * mm
    for chave, valor in dados:
        c.setFillColor(COR_TEXTO_MUTED)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x + 6 * mm, current_y, f"{chave}:")
        
        c.setFillColor(COR_TEXTO_PRINCIPAL)
        c.setFont("Helvetica", 9)
        c.drawString(x + 40 * mm, current_y, str(valor or "—"))
        current_y -= 5.5 * mm

# ─── GERAÇÃO DO VOUCHER DE HOTEL REMASTERIZADO ─────────────────────────────

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
    # Adiciona o hóspede principal
    hospedes.append({
        "nome": pedido_db.get("nome_cliente", "Não Informado"),
        "cpf": pedido_db.get("cpf_cliente", "Não Informado"),
        "tipo": "Titular"
    })
    
    # Adiciona dependentes se existirem mapeados em dados_extra
    if dados_extra and dados_extra.get("dependentes"):
        for dep in dados_extra.get("dependentes"):
            hospedes.append({
                "nome": dep.get("nome", "Dependente"),
                "cpf": dep.get("cpf", "---"),
                "tipo": "Acompanhante"
            })
            
    # Renderização em Linhas (Zebra Striping suave para legibilidade de Ota)
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
    c.drawString(MARGIN_X, y_cursor - 3 * mm, formatarMoeda(pedido_db.get('valor_total', 0.0)))
    
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

# Mantemos a função anterior de gerar_pdf_carteira intacta e protegida abaixo...