import os
import json
from google import genai
from google.genai import types  # Importação necessária para o formato de imagem
from dotenv import load_dotenv

load_dotenv()

def validar_endereco_com_ia(imagem_bytes: bytes, nome_esperado: str, mime_type: str = "image/jpeg") -> dict:
    """
    Valida se o documento (luz, água, gás) comprova residência em São Geraldo do Araguaia
    e se pertence ao usuário.
    """
    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        # Prompt focado na prova de residência
        prompt = (
            f"Aja como um validador de documentos oficial. Analise este comprovante (luz, água, gás ou telefone). "
            f"1. O documento prova que o endereço fica na cidade de 'São Geraldo do Araguaia' no Pará? "
            f"2. O nome presente no documento é '{nome_esperado}'? "
            "Ignore se o nome estiver abreviado. O objetivo principal é confirmar a residência na cidade. "
            "Responda APENAS em JSON: "
            '{"valido": true/false, "motivo": "Explique brevemente o porquê"}'
        )

        # CORREÇÃO DA SINTAXE: Usando types.Part.from_bytes para resolver o erro do log
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Part.from_bytes(data=imagem_bytes, mime_type=mime_type),
                prompt
            ]
        )

        # Limpeza e conversão do JSON
        texto_limpo = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(texto_limpo)

    except Exception as e:
        # Log detalhado no terminal da Railway para debug
        print(f"[IA-LOG] Erro detalhado: {e}")
        return {
            "valido": False, 
            "motivo": "Falha técnica ao analisar o documento."
        }