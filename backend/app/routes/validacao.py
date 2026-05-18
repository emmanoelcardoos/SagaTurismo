from fastapi import APIRouter, HTTPException, Query
import os
from supabase import create_client, Client

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def executar_validacao(token: str):
    if not token:
        return {"sucesso": False, "mensagem": "Token não fornecido."}
        
    # 1. Busca o residente pela tabela CORRETA
    res = supabase.table("rd_residentes").select("*").eq("id", token).execute()
    
    # Fallback: Se não encontrar pelo ID, tenta pelo token do QRCode
    if not res.data:
        res = supabase.table("rd_residentes").select("*").eq("qrcode_token", token).execute()
        
    if not res.data:
        return {"sucesso": False, "status": "reprovada", "mensagem": "Cartão Inválido ou não encontrado na base de dados."}
    
    residente = res.data[0]
    status_db = residente.get("status", "").lower()
    
    # 2. Formatar o CPF para segurança no frontend (cpf_mascarado)
    cpf_raw = residente.get("cpf", "")
    cpf_mascarado = cpf_raw
    if len(cpf_raw) >= 11:
        cpf_mascarado = f"***.{cpf_raw[3:6]}.{cpf_raw[6:9]}-**"
        
    # 3. Contar total de pessoas (Titular + Dependentes) para o checkout cobrar o valor certo
    qtd_pessoas = 1
    res_dependentes = supabase.table("rd_residentes").select("id").eq("titular_id", residente["id"]).execute()
    if res_dependentes.data:
        qtd_pessoas += len(res_dependentes.data)

    # 4. Retornar a estrutura EXATA que o frontend espera
    return {
        "sucesso": True,
        "status": status_db, 
        "nome": residente.get("nome_completo", "Cidadão"),
        "cpf_mascarado": cpf_mascarado,
        "cpf": residente.get("cpf"),
        "email": residente.get("email"),
        "data_nascimento": residente.get("data_nascimento"),
        "foto_url": residente.get("foto_url"),
        "quantidade": qtd_pessoas,
        "mensagem": "Leitura efetuada com sucesso"
    }

# ── ROTA 1: Para quando o Frontend usa /validar?token=XYZ ──
@router.get("/validar")
async def validar_carteira_query(token: str = Query(None)):
    try:
        return executar_validacao(token)
    except Exception as e:
        print(f"[ERRO VALIDAÇÃO QUERY] {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao validar o documento.")

# ── ROTA 2: Para quando o Fiscal usa /validar/{token} ──
@router.get("/validar/{token}")
async def validar_carteira_path(token: str):
    try:
        return executar_validacao(token)
    except Exception as e:
        print(f"[ERRO VALIDAÇÃO PATH] {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao validar o documento.")