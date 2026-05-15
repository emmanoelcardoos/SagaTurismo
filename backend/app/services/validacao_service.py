from fastapi import APIRouter, HTTPException
import os
from supabase import create_client, Client
from datetime import datetime, timezone

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.get("/api/v1/validar/carteira/{token}")
async def verificar_residente_por_token(token: str):
    """
    Endpoint consumido pela Web App do Fiscal.
    Lê o token do QR Code e devolve se a carteira está apta para o desconto.
    """
    try:
        # ATUALIZADO: Tabela 'cidadaos' e coluna 'token' (conforme o teu webhook)
        response = supabase.table("cidadaos").select("*").eq("token", token).execute()
        
        if not response.data:
            return {"sucesso": False, "mensagem": "Cartão Inválido ou não encontrado na base de dados."}
        
        residente = response.data[0]
        nome = residente.get("nome_completo", "Cidadão")
        
        # 1. Verificar a validade (se a data de expiração existir)
        if residente.get("data_expiracao"):
            agora = datetime.now(timezone.utc)
            data_exp = datetime.fromisoformat(residente["data_expiracao"].replace('Z', '+00:00'))
            
            if agora > data_exp:
                return {
                    "sucesso": False,
                    "nome": nome,
                    "status": "expirado",
                    "mensagem": "ACESSO NEGADO: Cartão expirado. É necessário renovar o cadastro."
                }
        
        # 2. Lógica de negócio: Status 'aprovado' e pagamento 'pago'
        # Atualizado para os status reais que estamos a inserir via PagBank
        if residente.get("status") == "aprovado" and residente.get("pagamento_status") == "pago":
            return {
                "sucesso": True,
                "nome": nome,
                "cpf": residente.get("cpf"),
                "foto_url": residente.get("foto_url"), # Útil para o fiscal comparar a cara da pessoa
                "status": "ativo",
                "mensagem": "ACESSO LIBERADO: 50% de Desconto Confirmado."
            }
        else:
            return {
                "sucesso": False,
                "nome": nome,
                "status": residente.get("status"),
                "mensagem": "ACESSO NEGADO: O pagamento não consta como concluído ou a carteira foi suspensa."
            }

    except Exception as e:
        print(f"[ERRO VALIDAÇÃO] {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao validar o documento.")