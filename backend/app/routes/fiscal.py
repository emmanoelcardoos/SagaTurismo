from fastapi import APIRouter, Header, HTTPException
# Assumindo que o cliente supabase está importado corretamente no teu projeto
from app.services.validacao_service import supabase 

router = APIRouter()

# ◄── A ÚNICA DIFERENÇA ESTÁ AQUI NA ROTA: Adicionei "/fiscal"
@router.get("/fiscal/validar/{token}")
async def validar_token_fiscal(token: str, x_fiscal_key: str = Header(None)):
    # 1. Verificação de Segurança da Chave do Fiscal
    SECRET_KEY = "SaoGeraldo2026_Secret_Key" # Deve estar no .env em produção
    if x_fiscal_key != SECRET_KEY:
        raise HTTPException(status_code=403, detail=f"Acesso negado. App do Fiscal não autenticada.")

    # ◄── BLINDAGEM DO TOKEN: Remove espaços ou lixo que o scanner do telemóvel possa injetar
    token_clean = str(token).strip().replace("'", "").replace('"', '').replace('\n', '')
    
    if not token_clean:
        return {"sucesso": False, "mensagem": "Token inválido ou ilegível."}

    try:
        # 2. Busca na base de dados (Pesquisa Dupla para não falhar)
        resposta = supabase.table("rd_residentes").select("*").eq("id", token_clean).execute()
        
        if not resposta.data:
            resposta = supabase.table("rd_residentes").select("*").eq("qrcode_token", token_clean).execute()

        if not resposta.data:
             return {"sucesso": False, "status": "reprovada", "mensagem": "ALERTA: Documento Falso ou Inexistente."}

        residente = resposta.data[0]

        # 3. Formatação da Data para formato PT/BR (DD/MM/YYYY)
        data_br = residente.get("data_nascimento")
        if data_br and "-" in data_br:
            partes = data_br.split('T')[0].split('-')
            if len(partes) == 3:
                data_br = f"{partes[2]}/{partes[1]}/{partes[0]}"

        # 4. Retorna os dados completos APENAS para o Fiscal
        return {
            "sucesso": True,
            "status": residente.get("status"), # Ex: 'ativo' ou 'aguardando_pagamento'
            "nome": residente.get("nome_completo"),
            "cpf": residente.get("cpf"), # ◄── CPF Completo para o Fiscal conferir a identidade!
            "data_nascimento": data_br,
            "foto_url": residente.get("foto_url"), # ◄── A FOTO para o Match Visual Antifraude
            "mensagem": "Residente verificado com sucesso."
        }

    except Exception as e:
        print(f"Erro na validação fiscal: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar a leitura.")