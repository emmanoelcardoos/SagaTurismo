import sys
import os

caminho_backend = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.append(caminho_backend)

from app.services.pdf_service import gerar_pdf_carteira

print("A gerar PDF de teste...")

dados_teste = {
    "nome": "Emmanoel Cardoso",
    "cpf": "123.456.789-00",
    "foto_url": "/Users/emmanoelcardoso/Library/CloudStorage/OneDrive-UniversidadedaBeiraInterior/docs pessoais/eu.jpg" 
}

try:
    caminho = gerar_pdf_carteira(dados_teste, "TOKEN123")
    print(f"✅ SUCESSO! Abre o ficheiro: {caminho}")
except Exception as e:
    print(f"❌ ERRO: {e}")