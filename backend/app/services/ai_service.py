import os
import json
import re
from datetime import datetime # <-- ADICIONADO PARA MATEMÁTICA PRECISA DA IA
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# MUDANÇA 1: Agora recebemos "lista_nomes: list" em vez de uma string única
def validar_endereco_com_ia(imagem_bytes: bytes, lista_nomes: list, mime_type: str = "image/jpeg") -> dict:
    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        MODELO = "gemini-2.5-flash"
        
        # Pega o ano exato atual do servidor para enviar à IA
        ano_atual = datetime.now().year

        # MUDANÇA 2: O Python descobre se é apenas 1 pessoa ou uma família
        nomes_formatados = ", ".join(lista_nomes)
        quantidade = len(lista_nomes)
        
        if quantidade == 1:
            texto_contexto = f"Sua tarefa é auditar documentos para a emissão da Carteira Digital do cidadão: '{nomes_formatados}'."
            texto_titularidade = f"O nome no documento apresentado DEVE ser '{nomes_formatados}' (ou comprovar vínculo legal)."
        else:
            texto_contexto = f"Sua tarefa é auditar documentos para um grupo familiar de {quantidade} pessoas: [{nomes_formatados}]."
            texto_titularidade = "O nome no documento DEVE corresponder a PELO MENOS UM dos nomes da lista familiar."

        # MUDANÇA 3: Injetamos o ano dinâmico e criamos regras anti-fraude rigorosas
        prompt = (
            f"Você é o Auditor Chefe da Prefeitura de São Geraldo do Araguaia - PA.\n"
            f"{texto_contexto}\n\n"

            "## REGRAS DE ISENÇÃO E MEIA-ENTRADA (DECRETO MUNICIPAL)\n"
            "O cidadão tem direito à Carteira/Desconto se o documento provar UMA das seguintes condições:\n"
            f"1. CRIANÇAS (0 a 12 anos): Valide documento de identidade APENAS SE a Data de Nascimento comprovar que a pessoa tem 12 anos ou menos no ano atual ({ano_atual}).\n"
            f"2. IDOSOS (60+ anos): Valide documento de identidade APENAS SE a Data de Nascimento comprovar que a pessoa tem 60 anos ou mais no ano atual ({ano_atual}).\n"
            "3. RESIDENTES (13 a 59 anos): Exige OBRIGATORIAMENTE um Comprovante de Residência contendo o município 'São Geraldo do Araguaia' (ou 'Covilhã' para fins de teste). RG ou CNH sozinhos NÃO SÃO ACEITOS para esta faixa etária.\n"
            "4. PROFESSORES: Valide contracheque ou contrato de trabalho.\n"
            "5. MILITARES: Valide carteira de identificação militar.\n"
            "6. PCD: Valide laudo médico.\n"
            "7. DEPENDENTES ATÉ 18 ANOS: Podem usar o comprovante de residência dos pais/titular.\n"
            "8. OUTROS DEPENDENTES: Devem apresentar documento de curadoria.\n\n"

            "## DIRETRIZES ANTI-FRAUDE RIGOROSAS\n"
            f"- {texto_titularidade}\n"
            "- MATEMÁTICA OBRIGATÓRIA: Se o documento enviado for um RG, CNH, Passaporte ou Certidão, você DEVE extrair a Data de Nascimento e calcular a idade exata.\n"
            "- FRAUDE DETECTADA: Se a idade calculada for entre 13 e 59 anos, e a pessoa não for PCD, Militar ou Professor, REJEITE IMEDIATAMENTE a solicitação informando que é necessário enviar um Comprovante de Residência válido.\n\n"

            "## FORMATO DE RESPOSTA (APENAS JSON STRICTO)\n"
            "{\n"
            "  \"valido\": true | false,\n"
            "  \"status\": \"aprovado_residencia\" | \"aprovado_idade\" | \"aprovado_professor\" | \"aprovado_militar\" | \"aprovado_pcd\" | \"rejeitado\",\n"
            "  \"dados_extraidos\": {\n"
            "    \"nome_no_documento\": \"string\",\n"
            "    \"tipo_documento\": \"string\",\n"
            "    \"data_nascimento\": \"string ou null\",\n"
            "    \"idade_calculada\": \"numero inteiro ou null\",\n"
            "    \"localidade_ou_condicao\": \"string\"\n"
            "  },\n"
            "  \"checklist_auditoria\": {\n"
            "    \"documento_legivel\": true | false,\n"
            "    \"nome_confere\": true | false,\n"
            "    \"idade_compativel_isencao\": true | false | null,\n"
            "    \"enquadra_no_decreto\": true | false\n"
            "  },\n"
            "  \"motivo\": \"Explique em uma frase curta qual regra do decreto foi aplicada. Se for rejeitado por idade incorreta, cite a idade calculada e a falta de comprovante de morada.\"\n"
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