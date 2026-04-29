import os
import json
from google import genai  # <--- A NOVA FORMA DE IMPORTAR
from dotenv import load_dotenv

load_dotenv()

def validar_endereco_com_ia(imagem_bytes: bytes, nome_esperado: str, mime_type: str = "image/jpeg") -> dict:
    """
    Versão FINAL: Usa o SDK 2.0 (google-genai) para validar cidade e nome.
    """
    try:
        # Inicializa o cliente com a nova biblioteca
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        prompt = (
            f"Analise este comprovante de residência. "
            f"1. O endereço pertence à cidade de 'São Geraldo do Araguaia' (PA)? "
            f"2. O nome no documento é correspondente a '{nome_esperado}'? "
            "Ignore pequenas variações. Responda APENAS em JSON: "
            '{"valido": true/false, "motivo": "justificativa curta"}'
        )

        # Chamada usando a nova sintaxe do SDK 2.0
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                {"mime_type": mime_type, "data": imagem_bytes},
                prompt
            ]
        )

        # Limpeza do JSON para evitar erros de leitura
        texto_limpo = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(texto_limpo)

    except Exception as e:
        print(f"[IA-LOG] Erro: {e}")
        return {
            "valido": False, 
            "motivo": "Falha na comunicação com a IA de validação."
        }