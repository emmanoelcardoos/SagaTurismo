import os
import json
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# MUDANÇA 1: Agora recebemos "lista_nomes: list" em vez de uma string única
def validar_endereco_com_ia(imagem_bytes: bytes, lista_nomes: list, mime_type: str = "image/jpeg") -> dict:
    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        MODELO = "gemini-2.5-flash"

        # MUDANÇA 2: O Python descobre se é apenas 1 pessoa ou uma família
        nomes_formatados = ", ".join(lista_nomes)
        quantidade = len(lista_nomes)
        
        if quantidade == 1:
            texto_contexto = f"Sua tarefa é validar comprovantes de residência para o cidadão: '{nomes_formatados}'."
            texto_titularidade = f"O nome no documento deve ser '{nomes_formatados}'."
        else:
            texto_contexto = f"Sua tarefa é validar um comprovante de residência para um grupo familiar de {quantidade} pessoas:\n[{nomes_formatados}]."
            texto_titularidade = "O nome no documento DEVE corresponder a PELO MENOS UM dos nomes da lista familiar acima."

        # MUDANÇA 3: Injetamos o texto dinâmico no prompt
        prompt = (
            f"Você é o Auditor Chefe da Prefeitura de São Geraldo do Araguaia - PA.\n"
            f"{texto_contexto}\n\n"

            "## REGRAS DE VALIDAÇÃO (Tolerância Zero)\n\n"

            "### REGRA 1 — MUNICÍPIO (Crítico)\n"
            "Veja se no documento apresentado há explicitamente o nome de São Geraldo do Araguaia, ou alguma referência clara ao município. Documentos de outros municípios são automaticamente inválidos.\n\n"
            "Deolva neste formato json:"## FORMATO DE RESPOSTA (APENAS JSON)\n"
            "{\n"
            "  \"valido\": true | false,\n"
            "  \"status\": \"aprovado_direto\" | \"aprovado_parentesco\" | \"aprovado_ensino\" | \"aprovado_trabalho\" | \"aprovado_saude\" | \"rejeitado\",\n"
            "  \"dados_extraidos\": {\n"
            "    \"nome_no_documento\": \"string\",\n"
            "    \"endereco_completo\": \"string\",\n"
            "    \"data_emissao\": \"string\",\n"
            "    \"tipo_identificado\": \"string\"\n"
            "  },\n"
            "  \"checklist_auditoria\": {\n"
            "    \"cidade_correta\": true | false,\n"
            "    \"tipo_aceito\": true | false,\n"
            "    \"nome_ou_parentesco_confere\": true | false,\n"
            "    \"data_recente\": true | false\n"
            "  },\n"
            "  \"motivo\": \"Explicação direta do veredito.\"\n"
        
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