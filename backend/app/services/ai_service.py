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
            f"You are the Chief Auditor of the City Hall of São Geraldo do Araguaia - PA.\n"
            f"{texto_contexto}\n\n"

            "## VALIDATION RULES (Zero Tolerance)\n\n"

            "### RULE 1 — MUNICIPALITY (Critical)\n"
            "The document MUST prove a connection with São Geraldo do Araguaia - PA.\n"
            "Look for the city name or the official ZIP code: 68570-000.\n"
            "Reject if the city is different. If it is not legible, reject it.\n\n"

            "### RULE 2 — DOCUMENT TYPE\n"
            "✅ ACCEPTED:\n"
            "- Utility Bills: Electricity (Equatorial), Water (Cosanpa, Saneatins, Odebrecht, ...), Property Tax (IPTU), Fixed Internet.\n"
            "- Educational Link: Enrollment declaration from a school/college in the municipality.\n"
            "- Employment Link: Payslip or employment contract with a company in the municipality.\n"
            "- Healthcare Link: Declaration/Health Center Card (UBS) or SUS card from the municipality.\n\n"

            "🚫 SUMMARILY REJECTED:\n"
            "- Generic payment slips (credit card bills, online purchases, remote-learning colleges from other cities).\n"
            "- Informal rental agreements (without notarization).\n"
            "- Handwritten declarations or documents without the institution's logo.\n"
            "- Identity documents (ID, CPF, Driver’s License) used as proof of address.\n\n"

            "### RULE 3 — OWNERSHIP AND FAMILY RELATIONSHIP\n"
            f"{texto_titularidade}\n"
            "EXCEPTION (Family Relationship): If the document is a valid utility bill and is under another person's name, but there is a strong SURNAME match with someone on the list, consider the ownership valid (approved_family_relationship).\n"
            "If it is not under the applicant's name and the surnames are completely different from everyone on the list, reject it.\n\n"

            "### RULE 4 — DATE AND LEGIBILITY\n"
            "The document must be issued within the last 90 days (or belong to the current academic year for educational documents).\n"
            "Blurred, cropped, or undated documents must be rejected.\n\n"

            "## RESPONSE FORMAT (JSON ONLY)\n"
            "{\n"
            "  \"valid\": true | false,\n"
            "  \"status\": \"approved_directly\" | \"approved_family_relationship\" | \"approved_education\" | \"approved_employment\" | \"approved_healthcare\" | \"rejected\",\n"
            "  \"extracted_data\": {\n"
            "    \"name_on_document\": \"string\",\n"
            "    \"full_address\": \"string\",\n"
            "    \"issue_date\": \"string\",\n"
            "    \"identified_type\": \"string\"\n"
            "  },\n"
            "  \"audit_checklist\": {\n"
            "    \"correct_city\": true | false,\n"
            "    \"accepted_type\": true | false,\n"
            "    \"name_or_family_relationship_matches\": true | false,\n"
            "    \"recent_date\": true | false\n"
            "  },\n"
            "  \"reason\": \"Direct explanation of the verdict.\"\n"
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