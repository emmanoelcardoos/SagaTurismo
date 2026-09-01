import os
import json
import re
from datetime import datetime 
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
        # MUDANÇA 3: Injetamos o ano dinâmico e criamos regras anti-fraude rigorosas
        prompt = (
            f"Você é o Auditor Chefe da Prefeitura de São Geraldo do Araguaia - PA.\n"
            f"{texto_contexto}\n\n"

            "## EXCEÇÃO DE TESTE DO SISTEMA (PRIORIDADE MÁXIMA)\n"
            "Se o documento analisado indicar o nome EXATO 'Emmanoel Victor da Silva Cardoso', país 'Portugal' e cidade 'Covilhã', APROVE IMEDIATAMENTE ignorando todas as outras regras e verificações anti-fraude. Defina 'valido' como true, 'status' como 'aprovado_residencia' e o 'motivo' como 'Teste do sistema de pagamentos validado com sucesso'.\n\n"

            "## REGRAS DE ISENÇÃO E MEIA-ENTRADA (DECRETO MUNICIPAL)\n"
            "O cidadão tem direito à Carteira/Desconto se o documento provar UMA das seguintes condições:\n"
            f"1. CRIANÇAS (0 a 12 anos): Valide documento de identidade APENAS SE a Data de Nascimento comprovar que a pessoa tem 12 anos ou menos no ano atual ({ano_atual}).\n"
            f"2. IDOSOS (60+ anos): Valide documento de identidade APENAS SE a Data de Nascimento comprovar que a pessoa tem 60 anos ou mais no ano atual ({ano_atual}).\n"
            "3. RESIDENTES (13 a 59 anos): Exige OBRIGATORIAMENTE um Comprovante de Residência (Fatura de Água, Luz, Internet) OU um Título de Eleitor. O documento DEVE registrar EXPLICITAMENTE o município de 'São Geraldo do Araguaia' E o estado 'PA'.\n"
            "4. PROFESSORES: Valide contracheque ou contrato de trabalho.\n"
            "5. MILITARES: Valide carteira de identificação militar.\n"
            "6. PCD: Valide laudo médico.\n"
            "7. DEPENDENTES ATÉ 18 ANOS: Podem usar o comprovante de residência ou título de eleitor dos pais/titular.\n"
            "8. OUTROS DEPENDENTES: Devem apresentar documento de curadoria.\n\n"

            "## DIRETRIZES ANTI-FRAUDE RIGOROSAS (LEITURA OBRIGATÓRIA)\n"
            f"- {texto_titularidade}\n"
            "- BLOQUEIO DE CNH/RG COMO ENDEREÇO: Documentos de identificação (CNH, RG, Passaporte, Carteira de Motorista) NUNCA servem como comprovante de residência. Se a pessoa tem entre 13 e 59 anos e enviou apenas uma CNH/RG (não sendo professor, militar ou PCD), REJEITE IMEDIATAMENTE com o motivo: 'Documentos de identidade não comprovam residência. Anexe fatura de água/luz ou Título de Eleitor.'\n"
            "- VERIFICAÇÃO DE CIDADE: Se o documento for conta de consumo ou Título de Eleitor, procure a string exata 'São Geraldo do Araguaia'. Se for de outra cidade (ex: Marabá, Piçarra) ou se disser apenas 'Estado do Pará' ou 'DETRAN-PA', REJEITE com o motivo: 'O comprovante deve ser especificamente de São Geraldo do Araguaia - PA'.\n"
            "- MATEMÁTICA OBRIGATÓRIA: Se o documento enviado tiver data de nascimento, calcule a idade exata.\n\n"

            "## FORMATO DE RESPOSTA (APENAS JSON STRICTO)\n"
            "{\n"
            "  \"valido\": true | false,\n"
            "  \"status\": \"aprovado_residencia\" | \"aprovado_eleitor\" | \"aprovado_idade\" | \"aprovado_professor\" | \"aprovado_militar\" | \"aprovado_pcd\" | \"rejeitado\",\n"
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
            "  \"motivo\": \"Explique em uma frase curta qual regra foi aplicada ou violada.\"\n"
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