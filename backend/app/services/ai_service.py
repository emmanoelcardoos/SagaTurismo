import os
import json
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

def validar_endereco_com_ia(imagem_bytes: bytes, nome_esperado: str, mime_type: str = "image/jpeg") -> dict:
    """
    Validação de Tolerância Zero para São Geraldo do Araguaia.
    """
    try:
        # Usamos o cliente v1 estável
        client = genai.Client(
            api_key=os.getenv("GEMINI_API_KEY"),
            http_options={'api_version': 'v1'}
        )
        
        # Nome estável do modelo para evitar o erro 404
        MODEL_NAME = "gemini-3-flash"

        prompt = (
            f"VOCÊ É UM AUDITOR FISCAL DA PREFEITURA DE SÃO GERALDO DO ARAGUAIA - PA.\n"
            f"Analise o documento para o requerente: '{nome_esperado}'.\n\n"
            "### REGRAS DE OURO (TOLERÂNCIA ZERO):\n"
            "1. LOCALIDADE: O endereço deve ser em São Geraldo do Araguaia - PA. Verifique cidade, estado e CEP (68585-000).\n"
            "2. TITULARIDADE: Compare o nome no documento com '{nome_esperado}'. Aceite abreviações óbvias, mas rejeite nomes totalmente diferentes sem vínculo.\n"
            "3. CPF: Se houver CPF no documento, extraia-o.\n"
            "4. RECENTE: O documento deve ser de 2026 (máximo 90 dias de antiguidade).\n"
            "5. TIPO: Apenas faturas oficiais de Energia (Equatorial), Água (Cosanpa), IPTU ou Internet fixa.\n\n"
            "### ESTRUTURA DE RESPOSTA (APENAS JSON):\n"
            "{\n"
            "  \"valido\": true/false,\n"
            "  \"status\": \"aprovado_titular\" | \"revisao_parentesco\" | \"rejeitado\",\n"
            "  \"dados_extraidos\": {\n"
            "    \"nome_documento\": \"string\",\n"
            "    \"cpf_encontrado\": \"string ou null\",\n"
            "    \"endereco_completo\": \"string\",\n"
            "    \"cidade_estado\": \"string\",\n"
            "    \"data_emissao\": \"string\"\n"
            "  },\n"
            "  \"analise_tecnica\": {\n"
            "    \"cidade_confere\": true/false,\n"
            "    \"nome_confere\": true/false,\n"
            "    \"documento_recente\": true/false\n"
            "  },\n"
            "  \"motivo\": \"Explicação detalhada do veredito\"\n"
            "}"
        )

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[
                types.Part.from_bytes(data=imagem_bytes, mime_type=mime_type),
                prompt
            ]
        )

        # Captura apenas o JSON da resposta
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        
        raise ValueError("A IA não retornou um formato JSON válido.")

    except Exception as e:
        print(f"[GEMINI-LOG] Erro detalhado: {e}")
        # Tratamento de erros comuns para o seu Log da Railway
        if "404" in str(e):
            return {"valido": False, "motivo": "Erro 404: O modelo gemini-3-flash não foi encontrado no v1. Tente v1beta ou verifique o nome."}
        if "429" in str(e):
            return {"valido": False, "motivo": "Quota esgotada. Ative o faturamento (Pay-as-you-go) no AI Studio."}
        
        return {"valido": False, "motivo": "Falha técnica na análise do documento."}