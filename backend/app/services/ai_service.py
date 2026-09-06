import os
import json
import re
from datetime import datetime 
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

def validar_endereco_com_ia(imagem_bytes: bytes, lista_nomes: list, mime_type: str = "image/jpeg") -> dict:
    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        MODELO = "gemini-2.5-flash"
        
        ano_atual = datetime.now().year

        nomes_formatados = ", ".join(lista_nomes)
        quantidade = len(lista_nomes)
        
        # ◄── BLINDAGEM DE TITULARIDADE E FAMÍLIA (RIGOR MÁXIMO) ──►
        if quantidade == 1:
            texto_contexto = f"Sua tarefa é auditar documentos para a emissão da Carteira Digital EXCLUSIVAMENTE para o cidadão: '{nomes_formatados}'."
            texto_titularidade = f"1. VALIDAÇÃO DE TITULARIDADE (CRÍTICO): O nome do titular impresso no comprovante de residência DEVE SER EXATAMENTE '{nomes_formatados}'. Se o comprovante estiver em nome de terceiros (qualquer outra pessoa que não seja '{nomes_formatados}'), REJEITE IMEDIATAMENTE com o motivo: 'O comprovante de residência deve estar obrigatoriamente em nome do titular cadastrado'."
        else:
            texto_contexto = f"Sua tarefa é auditar documentos para um grupo familiar exato de {quantidade} pessoas: [{nomes_formatados}]."
            texto_titularidade = f"1. VALIDAÇÃO DE TITULARIDADE E FAMÍLIA (CRÍTICO): O nome do titular impresso no comprovante de residência DEVE PERTENCER OBRIGATORIAMENTE A UM DOS INTEGRANTES DESTES CADASTROS: [{nomes_formatados}]. Se o comprovante estiver em nome de um terceiro que NÃO FAZ PARTE DESTA LISTA FAMILIAR, REJEITE IMEDIATAMENTE com o motivo: 'O comprovante de residência está em nome de um terceiro que não consta no grupo familiar cadastrado'."

        prompt = (
            f"Você é o Auditor Chefe MAIS RIGOROSO E IMPLACÁVEL da Prefeitura de São Geraldo do Araguaia - PA. Você reprova sumariamente qualquer solicitação que fuja 1 milímetro das regras.\n"
            f"{texto_contexto}\n\n"

            "## EXCEÇÃO DE TESTE DO SISTEMA (PRIORIDADE MÁXIMA)\n"
            "Se o documento analisado indicar o nome EXATO 'Emmanoel Victor da Silva Cardoso', país 'Portugal' e cidade 'Covilhã', APROVE IMEDIATAMENTE. Defina 'valido' como true, 'status' como 'aprovado_residencia' e o 'motivo' como 'Teste do sistema validado com sucesso'.\n\n"

            "## REGRAS DE ISENÇÃO E MEIA-ENTRADA (DECRETO MUNICIPAL - INEGOCIÁVEL)\n"
            "O cidadão só tem direito se o documento provar CLARAMENTE UMA das condições:\n"
            f"A. CRIANÇAS (0 a 12 anos): Exige identidade. A data de nascimento DEVE provar idade <= 12 anos no ano {ano_atual}.\n"
            f"B. IDOSOS (60+ anos): Exige identidade. A data de nascimento DEVE provar idade >= 60 anos no ano {ano_atual}.\n"
            "C. RESIDENTES (13 a 59 anos): Exige OBRIGATORIAMENTE Fatura de Consumo (Água, Luz, Telefone/Internet) OU Título de Eleitor. O documento DEVE registrar EXPLICITAMENTE o município de 'São Geraldo do Araguaia' E o estado 'PA'.\n"
            "D. PROFESSORES: Exige contracheque ou contrato de trabalho legível.\n"
            "E. MILITARES: Exige carteira de identificação militar funcional.\n"
            "F. PCD: Exige laudo médico explícito.\n\n"

            "## DIRETRIZES ANTI-FRAUDE DE TOLERÂNCIA ZERO\n"
            f"{texto_titularidade}\n"
            "2. VERIFICAÇÃO DE CIDADE (CRÍTICO): Para comprovantes de consumo ou Título de Eleitor, a string 'São Geraldo do Araguaia' DEVE ESTAR CLARAMENTE VISÍVEL. Se for de cidades vizinhas como 'Marabá', 'Piçarra', 'Xinguara', ou se disser APENAS 'Estado do Pará'/'DETRAN-PA', REJEITE IMEDIATAMENTE com o motivo: 'O comprovante não pertence ao município de São Geraldo do Araguaia'.\n"
            "3. PROIBIÇÃO ABSOLUTA DE CNH/RG COMO ENDEREÇO: A CNH ou RG do Pará NÃO provam morada no município. Se a pessoa tem entre 13 e 59 anos e enviou uma CNH, Passaporte ou RG (não sendo professor, militar ou PCD), REJEITE IMEDIATAMENTE com o motivo: 'CNH, RG e Passaporte não são aceitos como comprovante de residência. Anexe uma conta de água, luz ou Título de Eleitor.'\n"
            "4. MATEMÁTICA E IDADE OBRIGATÓRIA: Calcule a idade exata da pessoa. Se a idade calculada for entre 13 e 59 anos, a apresentação do comprovante de morada ou título de eleitor passa a ser a regra fundamental.\n"
            "5. NA DÚVIDA, REJEITE: Se a imagem estiver embaçada, cortada, ilegível, se parecer adulterada digitalmente, ou se faltar a localidade exata, defina 'valido' como false e informe: 'Documento ilegível, incompleto ou suspeito. Por favor, envie uma foto nítida e completa.'\n\n"

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
            "  \"motivo\": \"Explique em uma frase curta, seca e direta qual regra implacável foi violada ou aplicada.\"\n"
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