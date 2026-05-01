import os
import json
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

def validar_endereco_com_ia(imagem_bytes: bytes, nome_esperado: str, mime_type: str = "image/jpeg") -> dict:
    """
    Versão Corrigida: Usa o modelo estável 002 e limpeza de JSON robusta.
    """
    try:
        # Inicializa o cliente para Google AI Studio
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        prompt = (
            f"Aja como um validador de documentos oficial da Prefeitura de São Geraldo do Araguaia. "
            f"Analise este comprovante (luz, água, gás ou telefone). "
            f"1. O endereço está localizado em 'São Geraldo do Araguaia' (PA)? "
            f"2. O nome no documento corresponde a '{nome_esperado}'? "
            "Considere nomes abreviados como válidos. Foco: confirmar se mora na cidade. "
            "Responda APENAS em formato JSON puro: "
            '{"valido": true/false, "motivo": "justificativa curta"}'
        )

        # Usando o modelo gemini-1.5-flash-002 para evitar erro 404 de rota
        response = client.models.generate_content(
            model="gemini-3-flash",
            contents=[
                types.Part.from_bytes(data=imagem_bytes, mime_type=mime_type),
                prompt
            ]
        )

        # Limpeza de JSON robusta usando Expressão Regular
        conteudo = response.text
        # Procura por algo que pareça um JSON { ... } dentro da resposta
        match = re.search(r'\{.*\}', conteudo, re.DOTALL)
        
        if match:
            texto_json = match.group(0)
            return json.loads(texto_json)
        else:
            raise ValueError("IA não devolveu um JSON válido")

    except Exception as e:
        print(f"[IA-LOG] Erro detalhado: {e}")
        # Se for erro de cota (429), avisamos o log
        if "429" in str(e):
            return {"valido": False, "motivo": "Sistema de IA sobrecarregado. Tente novamente em 1 minuto."}
        
        return {
            "valido": False, 
            "motivo": "Falha técnica na validação. Por favor, tente novamente ou use outro documento."
        }