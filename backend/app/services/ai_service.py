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
            texto_contexto = f"Sua tarefa é auditar documentos para a emissão da Carteira Digital do cidadão: '{nomes_formatados}'."
            texto_titularidade = f"O nome no documento apresentado DEVE ser '{nomes_formatados}' (ou comprovar vínculo legal)."
        else:
            texto_contexto = f"Sua tarefa é auditar documentos para um grupo familiar de {quantidade} pessoas: [{nomes_formatados}]."
            texto_titularidade = "O nome no documento DEVE corresponder a PELO MENOS UM dos nomes da lista familiar."

        # MUDANÇA 3: Injetamos o texto dinâmico no prompt com o NOVO DECRETO
        prompt = (
            f"Você é o Auditor Chefe da Prefeitura de São Geraldo do Araguaia - PA.\n"
            f"{texto_contexto}\n\n"

            "## REGRAS DE ISENÇÃO E MEIA-ENTRADA (DECRETO MUNICIPAL)\n"
            "O cidadão tem direito à Carteira/Desconto se o documento provar UMA das seguintes condições:\n"
            "1. IDADE 0 a 12 anos: Valide qualquer documento de identidade que comprove a idade (Morando em qualquer lugar).\n"
            "2. IDADE 60+ anos: Valide qualquer documento de identidade que comprove a idade (Morando em qualquer lugar).\n"
            "3. RESIDENTES (13 a 59 anos): Exige Comprovante de Residência contendo o nome 'São Geraldo do Araguaia' (ou 'Covilhã' para fins de teste).\n"
            "4. PROFESSORES: Valide contracheque ou contrato de trabalho (Morando em qualquer lugar).\n"
            "5. MILITARES: Valide carteira de identificação militar (Morando em qualquer lugar).\n"
            "6. PCD: Valide laudo médico (Morando em qualquer lugar).\n"
            "7. DEPENDENTES ATÉ 18 ANOS: Podem usar o comprovante de residência dos pais/titular.\n"
            "8. OUTROS DEPENDENTES: Devem apresentar documento de curadoria.\n\n"

            "## DIRETRIZES DE ANÁLISE\n"
            f"{texto_titularidade}\n"
            "Analise a imagem enviada. Identifique o tipo de documento (RG, Conta de Luz, Laudo, Contracheque). Aplique a regra do decreto correspondente.\n\n"

            "## FORMATO DE RESPOSTA (APENAS JSON STRICTO)\n"
            "{\n"
            "  \"valido\": true | false,\n"
            "  \"status\": \"aprovado_residencia\" | \"aprovado_idade\" | \"aprovado_professor\" | \"aprovado_militar\" | \"aprovado_pcd\" | \"rejeitado\",\n"
            "  \"dados_extraidos\": {\n"
            "    \"nome_no_documento\": \"string\",\n"
            "    \"tipo_documento\": \"string\",\n"
            "    \"localidade_ou_condicao_identificada\": \"string\"\n"
            "  },\n"
            "  \"checklist_auditoria\": {\n"
            "    \"documento_legivel\": true | false,\n"
            "    \"nome_confere\": true | false,\n"
            "    \"enquadra_no_decreto\": true | false\n"
            "  },\n"
            "  \"motivo\": \"Explique em uma frase curta qual regra do decreto foi aplicada ou o motivo da recusa.\"\n"
            "}\n"
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