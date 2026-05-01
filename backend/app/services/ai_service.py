import os
import json
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

def validar_endereco_com_ia(imagem_bytes: bytes, nome_esperado: str, mime_type: str = "image/jpeg") -> dict:
    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        # PROMPT OTIMIZADO PARA SÃO GERALDO DO ARAGUAIA
        prompt = (
            f"Aja como um Auditor Fiscal da Prefeitura de São Geraldo do Araguaia - PA. "
            f"O seu objetivo é validar se o solicitante '{nome_esperado}' realmente reside na cidade. "
            "INSTRUÇÕES DE ANÁLISE:\n"
            "1. LOCALIDADE: Procure explicitamente por 'São Geraldo do Araguaia' e o estado 'Pará' ou 'PA'. "
            "Se o comprovante for de outra cidade (ex: Piçarra, Marabá, Xinguara), rejeite imediatamente.\n"
            "2. TITULARIDADE: Verifique se o nome no documento é exatamente igual a '{nome_esperado}'. "
            "Considere variações irrelevantes (abreviações ou falta de sobrenome do meio).\n"
            "3. RECENTE: Verifique se o vencimento ou emissão é dos últimos 90 dias.\n"
            "4. TIPO DE DOCUMENTO: Deve ser uma conta de consumo (Luz/Equatorial, Água/Cosanpa, Internet, IPTU ou Telefone).\n"
            "\nCLASSIFICAÇÃO:\n"
            "- Se Localidade OK e Nome OK: 'aprovado_titular'\n"
            "- Se Localidade OK mas Nome Diferente: 'revisao_dependente' (pode ser um filho/cônjuge)\n"
            "- Se Localidade Errada: 'rejeitado_fora_da_cidade'\n"
            "- Se Documento ilegível: 'ilegivel'\n"
            "\nResponda APENAS em JSON:\n"
            '{"valido": true/false, "status_sugerido": "status", "motivo": "explicação curta", "confianca": 0-100}'
        )

        # Usamos o 2.0-flash pois é o que a sua chave reconhece no servidor
        response = client.models.generate_content(
            model="gemini-2.0-flash", 
            contents=[
                types.Part.from_bytes(data=imagem_bytes, mime_type=mime_type),
                prompt
            ]
        )

        # Extração segura do JSON
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError("IA não gerou JSON")

    except Exception as e:
        print(f"[IA-LOG] Erro: {e}")
        if "429" in str(e):
            return {"valido": False, "motivo": "Cota da IA excedida. Tente em 1 minuto."}
        return {"valido": False, "motivo": "Erro técnico na leitura."}