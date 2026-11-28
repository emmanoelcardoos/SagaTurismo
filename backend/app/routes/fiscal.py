import os
import secrets
from fastapi import APIRouter, Header, HTTPException
# Assumindo que o cliente supabase está importado corretamente no teu projeto
from app.services.validacao_service import supabase

router = APIRouter()

# ◄── A ÚNICA DIFERENÇA ESTÁ AQUI NA ROTA: Adicionei "/fiscal"
@router.get("/fiscal/validar/{token}")
async def validar_token_fiscal(token: str, x_fiscal_key: str = Header(None)):
    # 1. Verificação de Segurança da Chave do Fiscal (definida APENAS no ambiente do servidor)
    secret_key = os.environ.get("FISCAL_SECRET_KEY", "").strip()
    if not secret_key:
        print("[FISCAL] FISCAL_SECRET_KEY não configurada no ambiente do backend.")
        raise HTTPException(status_code=503, detail="Validação fiscal indisponível: servidor não configurado.")
    if not x_fiscal_key or not secrets.compare_digest(x_fiscal_key.strip(), secret_key):
        raise HTTPException(status_code=403, detail="Acesso negado. App do Fiscal não autenticada.")

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

        # 3. Formatação das Datas para formato PT/BR (DD/MM/YYYY)
        def _fmt_br(raw_val):
            if raw_val and "-" in str(raw_val):
                partes = str(raw_val).split('T')[0].split('-')
                if len(partes) == 3:
                    return f"{partes[2]}/{partes[1]}/{partes[0]}"
            return raw_val

        data_br = _fmt_br(residente.get("data_nascimento"))
        validade_br = _fmt_br(residente.get("data_expiracao"))

        # ◄── NOVA LÓGICA: Geração de URL Assinada (Passe Livre Temporário) ──►
        foto_url = residente.get("foto_url")
        foto_assinada = None

        if foto_url:
            if foto_url.startswith("http"):
                foto_assinada = foto_url
            else:
                try:
                    # Gera um link temporário válido por 5 minutos (300 segundos) para o ecrã do Fiscal
                    resposta_supabase = supabase.storage.from_("comprovantes").create_signed_url(foto_url, 300)
                    
                    if isinstance(resposta_supabase, dict):
                        foto_assinada = resposta_supabase.get("signedURL") or resposta_supabase.get("signedUrl")
                    elif isinstance(resposta_supabase, str):
                        foto_assinada = resposta_supabase
                except Exception as e:
                    print(f"Erro ao assinar URL da foto: {e}")
                    foto_assinada = None

        print(f"[FISCALIZAÇÃO - PARQUE] Acesso lido pelo Fiscal para: {residente.get('nome_completo', 'Nome Desconhecido')} | Status atual: {str(residente.get('status')).upper()}")
        
        # 4. Retorna os dados completos APENAS para o Fiscal
        return {
            "sucesso": True,
            "status": residente.get("status"), # Ex: 'ativo', 'expirado' ou 'aguardando_pagamento'
            "nome": residente.get("nome_completo"),
            "cpf": residente.get("cpf"), # ◄── CPF Completo para o Fiscal conferir a identidade!
            "data_nascimento": data_br,
            "data_expiracao": validade_br,
            "foto_url": foto_assinada, # ◄── A FOTO agora usa o link temporário desbloqueado!
            "mensagem": "Carteira expirada — renovação necessária." if residente.get("status") == "expirado" else "Residente verificado com sucesso."
        }

    except Exception as e:
        print(f"Erro na validação fiscal: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar a leitura.")