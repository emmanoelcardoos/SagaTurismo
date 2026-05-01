import os
import json
import re
import base64
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

def validar_endereco_com_ia(imagem_bytes: bytes, nome_esperado: str, mime_type: str = "image/jpeg") -> dict:
    """
    Validação de endereço usando Anthropic Claude 3 Haiku.
    """
    try:
        # Inicializa o cliente Claude
        client = Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))
        
        # O Claude exige que a imagem seja enviada em base64
        image_base64 = base64.b64encode(imagem_bytes).decode("utf-8")

        prompt = (
            f"Aja como um Auditor Fiscal da Prefeitura de São Geraldo do Araguaia - PA. "
            f"O seu objetivo é validar se o solicitante '{nome_esperado}' realmente reside na cidade. "
            "INSTRUÇÕES DE ANÁLISE:\n"
            "1. LOCALIDADE: Procure por 'São Geraldo do Araguaia' e 'Pará' ou 'PA'. "
            "Se for outra cidade, rejeite.\n"
            "2. TITULARIDADE: Verifique se o nome é '{nome_esperado}'. "
            "3. RECENTE: Verifique se é dos últimos 90 dias.\n"
            "4. TIPO: Conta de consumo (Luz, Água, Internet, IPTU).\n"
            "\nResponda APENAS em JSON:\n"
            '{"valido": true/false, "status_sugerido": "status", "motivo": "explicação curta", "confianca": 0-100}'
        )

        # Chamada à API do Claude
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            temperature=0,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": mime_type,
                                "data": image_base64,
                            },
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ],
                }
            ],
        )

        # Extração do JSON na resposta do Claude
        conteudo_texto = response.content[0].text
        match = re.search(r'\{.*\}', conteudo_texto, re.DOTALL)
        
        if match:
            return json.loads(match.group(0))
        
        raise ValueError("Claude não devolveu um JSON válido")

    except Exception as e:
        print(f"[CLAUDE-LOG] Erro: {e}")
        return {
            "valido": False, 
            "motivo": "Falha na comunicação com o validador Claude."
        }