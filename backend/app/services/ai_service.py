import os
import json
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

def validar_endereco_com_ia(imagem_bytes: bytes, nome_esperado: str, mime_type: str = "image/jpeg") -> dict:
    try:
        # 1. Instanciamos o cliente SEM forçar a v1 (deixa o SDK decidir o caminho correto)
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        # 2. TRUQUE DE DEBUG: Vamos forçar a IA a imprimir no Log da Railway o que ela aceita
        print("--- DESCOBRINDO MODELOS PERMITIDOS ---", flush=True)
        try:
            permitidos = [m.name for m in client.models.list()]
            print(f"Modelos liberados para a sua chave: {permitidos}", flush=True)
        except Exception as e_list:
            print(f"Não foi possível listar modelos: {e_list}", flush=True)

        # 3. Usamos o sufixo "-latest" (O curinga da Google que nunca dá 404)
        MODELO = "gemini-2.5-flash"

        prompt = (
            f"VOCÊ É UM AUDITOR DA PREFEITURA DE SÃO GERALDO DO ARAGUAIA - PA.\n"
            f"Analise o documento para o requerente: '{nome_esperado}'.\n\n"
            "### REGRAS RÍGIDAS:\n"
            "1. LOCALIDADE: Deve ser São Geraldo do Araguaia - PA. Verifique CEP e Cidade.\n"
            "2. TITULARIDADE: Nome deve ser '{nome_esperado}' ou parente direto.\n"
            "3. DATA: Deve ser recente (máximo 90 dias).\n"
            "4. TIPO: Conta de luz, água, IPTU ou internet.\n\n"
            "Responda apenas em JSON:\n"
            "{\n"
            "  \"valido\": true/false,\n"
            "  \"dados_extraidos\": {\"nome\": \"string\", \"endereco\": \"string\", \"data\": \"string\"},\n"
            "  \"motivo\": \"justificativa detalhada\"\n"
            "}"
        )

        response = client.models.generate_content(
            model=MODELO,
            contents=[
                types.Part.from_bytes(data=imagem_bytes, mime_type=mime_type),
                prompt
            ]
        )

        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError("JSON não encontrado na resposta.")

    except Exception as e:
        print(f"[IA-LOG] Erro: {e}")
        return {"valido": False, "motivo": f"Erro técnico: {str(e)[:50]}"}