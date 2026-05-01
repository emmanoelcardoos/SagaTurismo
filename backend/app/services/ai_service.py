import os
import json
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

def validar_endereco_com_ia(imagem_bytes: bytes, nome_esperado: str, mime_type: str = "image/jpeg") -> dict:
    try:
        # CONFIGURAÇÃO CRÍTICA: Forçamos o uso da API v1 estável
        client = genai.Client(
            api_key=os.getenv("GEMINI_API_KEY"),
            http_options={'api_version': 'v1'} 
        )
        
        prompt = (
            f"Analise este comprovante para a Prefeitura de São Geraldo do Araguaia. "
            f"O requerente é {nome_esperado}. "
            "Responda apenas JSON: {'valido': true/false, 'motivo': 'texto'}"
        )

        # Agora o Gemini 3 Flash será encontrado sem erro 404
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