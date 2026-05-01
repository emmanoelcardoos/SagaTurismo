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
            f"Você é o Auditor Chefe da Prefeitura de São Geraldo do Araguaia - PA.\n"
            f"Sua tarefa é validar comprovantes de residência para o cidadão: '{nome_esperado}'.\n\n"

            "## REGRAS DE VALIDAÇÃO (Tolerância Zero)\n\n"

            "### REGRA 1 — MUNICÍPIO (Crítico)\n"
            "O documento DEVE provar vínculo com São Geraldo do Araguaia - PA.\n"
            "Busque pelo nome da cidade ou pelo CEP oficial: 68570-000.\n"
            "Rejeite se a cidade for outra. Se não estiver legível, reprove.\n\n"

            "### REGRA 2 — TIPO DE DOCUMENTO\n"
            "✅ ACEITOS:\n"
            "- Contas de Consumo: Energia (Equatorial), Água (Cosanpa, Saneatins, Odebrecht,...), IPTU, Internet fixa.\n"
            "- Vínculo de Ensino: Declaração de matrícula em escola/faculdade do município.\n"
            "- Vínculo de Trabalho: Contracheque ou contrato de trabalho com empresa do município.\n"
            "- Vínculo de Saúde: Declaração/Cartão de posto de saúde (UBS) ou SUS do município.\n\n"
            "🚫 REJEITADOS SUMARIAMENTE:\n"
            "- Boletos genéricos (cartão de crédito, compras online, faculdades EAD de fora).\n"
            "- Contratos de aluguel informais (sem firma reconhecida).\n"
            "- Declarações escritas à mão ou documentos sem logotipo da instituição.\n"
            "- Documentos de identidade (RG, CPF, CNH) usados como comprovante de endereço.\n\n"

            "### REGRA 3 — TITULARIDADE E PARENTESCO\n"
            f"O nome no documento deve ser '{nome_esperado}'.\n"
            "EXCEÇÃO (Parentesco): Se o documento for uma conta de consumo válida e estiver em outro nome, mas houver forte correspondência de SOBRENOMES, considere a titularidade como válida (aprovado_parentesco).\n"
            "Se não for o titular e os sobrenomes forem totalmente diferentes, reprove.\n\n"

            "### REGRA 4 — DATA E LEGIBILIDADE\n"
            "O documento deve ter no máximo 90 dias (ou pertencer ao ano letivo atual para ensino).\n"
            "Documentos borrados, cortados ou sem data visível devem ser reprovados.\n\n"

            "## FORMATO DE RESPOSTA (APENAS JSON)\n"
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