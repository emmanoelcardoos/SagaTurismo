import os
import json
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

def validar_endereco_com_ia(imagem_bytes: bytes, nome_esperado: str, mime_type: str = "image/jpeg") -> dict:
    try:
        # 1. Instanciamos o cliente sem forçar a v1 para evitar o 404
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        # 2. Usamos o 2.0-flash (único que não deu 404 nos seus logs)
        MODELO = "gemini-1.5-flash"

        prompt = (
            f"VOCÊ É UM AUDITOR FISCAL RIGOROSO DA PREFEITURA DE SÃO GERALDO DO ARAGUAIA - PA.\n"
            f"Sua missão é validar com TOLERÂNCIA ZERO se o munícipe '{nome_esperado}' reside na cidade para fins de concessão de benefício.\n\n"
            
            "### PROTOCOLO DE ANÁLISE OBRIGATÓRIO:\n"
            "1. LOCALIDADE: O endereço DEVE estar em São Geraldo do Araguaia, Pará. Verifique o CEP (faixa 68585-000), nome da cidade e sigla do estado.\n"
            "2. TITULARIDADE: O nome no documento deve ser idêntico ou uma abreviação clara de '{nome_esperado}'.\n"
            "3. CPF: Se houver um CPF visível no documento, extraia-o para cruzamento de dados.\n"
            "4. ATUALIDADE: A data de emissão ou vencimento deve ser dos últimos 90 dias (considere que estamos em Maio de 2026).\n"
            "5. TIPO: Aceite apenas contas de consumo fixas (Energia/Equatorial, Água/Cosanpa, IPTU, Internet Residencial ou Telefone Fixo).\n\n"
            
            "### CRITÉRIOS DE REJEIÇÃO IMEDIATA:\n"
            "- Documentos de outras cidades (ex: Marabá, Piçarra, Xinguara).\n"
            "- Documentos com mais de 3 meses de atraso.\n"
            "- Print de tela de celular (deve ser o PDF original ou foto do documento físico).\n"
            "- Nomes que não possuam parentesco óbvio (se o nome for diferente, sugira 'revisao_dependente').\n\n"
            
            "### FORMATO DE SAÍDA (ESTRITAMENTE JSON):\n"
            "{\n"
            "  \"valido\": true/false,\n"
            "  \"status_sugerido\": \"aprovado_titular\" | \"revisao_dependente\" | \"rejeitado_localidade\" | \"rejeitado_titularidade\" | \"rejeitado_antigo\" | \"ilegivel\",\n"
            "  \"dados_extraidos\": {\n"
            "    \"nome_no_doc\": \"string\",\n"
            "    \"cpf_no_doc\": \"string ou null\",\n"
            "    \"logradouro\": \"rua/avenida e número\",\n"
            "    \"bairro\": \"string\",\n"
            "    \"data_referencia\": \"DD/MM/AAAA\"\n"
            "  },\n"
            "  \"motivo\": \"Explicação técnica e detalhada da decisão\",\n"
            "  \"confianca_ia\": 0-100\n"
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
        raise ValueError("JSON não encontrado")

    except Exception as e:
        print(f"[IA-LOG] Erro: {e}")
        # Mensagem amigável para o usuário, mas detalhada no seu log
        if "429" in str(e):
            return {"valido": False, "motivo": "ERRO DE QUOTA: Ative o faturamento no Google AI Studio (Pay-as-you-go)."}
        return {"valido": False, "motivo": f"Erro técnico: {str(e)[:50]}"}