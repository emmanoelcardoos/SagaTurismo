from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
import os
from supabase import create_client, Client

# Importação dos e-mails transacionais do service
from app.services.email_service import notificar_admin_novo_passeio, notificar_guia_passeio_aprovado

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class SchemaNotificacaoPasseio(BaseModel):
    guia_name: str
    titulo: str
    preco: float
    descricao: str
    data_evento: str

# 1. ROTA DE NOTIFICAÇÃO INICIAL (CHAMADA PELO FRONTEND)
@router.post("/api/v1/notificacoes/novo-passeio")
async def receber_notificacao_novo_passeio(payload: SchemaNotificacaoPasseio):
    dados_passeio = {
        "titulo": payload.titulo,
        "preco": payload.preco,
        "descricao": payload.descricao
    }
    
    sucesso = notificar_admin_novo_passeio(payload.guia_name, dados_passeio)
    if sucesso:
        return {"sucesso": True, "mensagem": "E-mail de auditoria enviado para o Emmanoel."}
    raise HTTPException(status_code=500, detail="Falha ao disparar o e-mail de notificação administrativa.")

# 2. WEBHOOK DO SUPABASE (DISPARADO AUTOMATICAMENTE QUANDO ATIVAS O PASSEIO)
@router.post("/api/v1/webhooks/passeio-aprovado")
async def webhook_supabase_passeio_aprovado(request: Request):
    try:
        payload = await request.json()
        new_record = payload.get("record", {})
        old_record = payload.get("old_record", {})

        # ◄── REGRA DE NEGÓCIO: Se a coluna 'ativo' mudou de False para True
        if new_record.get("ativo") is True and old_record.get("ativo") is False:
            guia_id = new_record.get("guia_id")
            nome_passeio = new_record.get("titulo", "Novo Roteiro")
            passeio_id = new_record.get("id")

            # Buscar o e-mail real do Guia na tabela de parceiros
            res_guia = supabase.table("parceiros").select("email, nome_negocio").eq("id", guia_id).single().execute()
            
            if res_guia.data:
                email_guia = res_guia.data.get("email")
                nome_guia = res_guia.data.get("nome_negocio", "Guia Credenciado")
                
                # Link dinâmico oficial para partilha nas redes sociais
                link_vendas = f"https://sagaturismo.com.br/passeios/{passeio_id}"

                # Envia o e-mail oficial com o link de partilha
                notificar_guia_passeio_aprovado(email_guia, nome_guia, nome_passeio, link_vendas)
                print(f"[WEBHOOK APROVAÇÃO] Sucesso: Guia {nome_guia} notificado sobre a ativação.")
                
        return {"status": "ok"}
    except Exception as e:
        print(f"[WEBHOOK APROVAÇÃO ERRO] Falha: {e}")
        return {"status": "handled_with_error"}