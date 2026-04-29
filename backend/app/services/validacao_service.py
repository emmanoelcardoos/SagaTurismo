import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime, timezone # <-- Adicionadas as bibliotecas de data

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def verificar_residente_por_token(token: str):
    """
    Busca o residente no banco pelo token do QR Code e verifica se ele está 'pago' ou 'ativo'
    e se o benefício ainda está dentro do prazo de validade.
    """
    try:
        # Busca o residente que tenha o token correspondente
        response = supabase.table("rd_residentes").select("*").eq("qrcode_token", token).execute()
        
        if not response.data:
            return {"sucesso": False, "mensagem": "Cartão Inválido ou não encontrado."}
        
        residente = response.data[0]
        
        # 1. Verificar a validade (se a data de expiração já foi definida)
        if residente.get("data_expiracao"):
            agora = datetime.now(timezone.utc)
            # Converte a string de data do Supabase para um objeto datetime em Python
            data_exp = datetime.fromisoformat(residente["data_expiracao"].replace('Z', '+00:00'))
            
            if agora > data_exp:
                return {
                    "sucesso": False,
                    "nome": residente["nome_completo"],
                    "status": "expirado",
                    "mensagem": "ACESSO NEGADO: Cartão expirado. É necessário renovar o cadastro no site."
                }
        
        # 2. Lógica de negócio: apenas status 'pago' ou 'ativo' dão direito ao desconto
        status_permitidos = ["pago", "ativo"]
        
        if residente["status"] in status_permitidos:
            return {
                "sucesso": True,
                "nome": residente["nome_completo"],
                "status": residente["status"],
                "mensagem": "ACESSO LIBERADO: 50% de Desconto Confirmado."
            }
        else:
            return {
                "sucesso": False,
                "nome": residente["nome_completo"],
                "status": residente["status"],
                "mensagem": f"ACESSO NEGADO: O status atual é {residente['status']}."
            }

    except Exception as e:
        return {"sucesso": False, "mensagem": f"Erro na validação: {str(e)}"}