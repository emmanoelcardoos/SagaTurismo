# backend/app/routes/fiscal.py (ou onde estiver a rota de validação)
from fastapi import APIRouter, Header, HTTPException
from app.services.validacao_service import supabase # Assumindo que o cliente supabase está aqui

router = APIRouter()

@router.get("/validar/{token}")
async def validar_token_fiscal(token: str, x_fiscal_key: str = Header(None)):
    # 1. Verificação de Segurança da Chave do Fiscal
    SECRET_KEY = "SaoGeraldo2026_Secret_Key" # Deve estar no .env em produção
    if x_fiscal_key != SECRET_KEY:
        raise HTTPException(status_code=403, detail=f"Acesso negado. Chave fiscal inválida. Recebida: {x_fiscal_key}")

    try:
        # 2. Busca os dados COMPLETOS no Supabase
        # Certifica-te que selecionas todos os campos necessários:
        resposta = supabase.table("rd_residentes")\
            .select("nome_completo, status, data_nascimento, foto_url, cpf")\
            .eq("qrcode_token", token)\
            .execute()

        if not resposta.data or len(resposta.data) == 0:
             return {"sucesso": False, "mensagem": "Cartão não encontrado ou inválido."}

        residente = resposta.data[0]

        # 3. Formatação da Data (Opcional, para garantir formato BR)
        data_br = residente.get("data_nascimento")
        if data_br:
            # Converte YYYY-MM-DD para DD/MM/YYYY
            partes = data_br.split('-')
            if len(partes) == 3:
                data_br = f"{partes[2]}/{partes[1]}/{partes[0]}"

        # 4. Retorna os dados para o Frontend desenhar a carteira
        return {
            "sucesso": True,
            "status": residente["status"],
            "nome": residente["nome_completo"],
            "cpf_mascarado": f"***.{residente['cpf'][4:7]}.***-**", # Mascara simples
            "data_nascimento": data_br,
            "foto_url": residente["foto_url"], # URL pública da foto
            "mensagem": "Residente verificado com sucesso."
        }

    except Exception as e:
        print(f"Erro na validação fiscal: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno ao validar token.")