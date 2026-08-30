from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

# Importar as funções de e-mail que adicionou no email_service.py
from app.services.email_service import enviar_confirmacao_suporte, enviar_resposta_suporte

router = APIRouter()

class SchemaNovoSuporte(BaseModel):
    email: str
    nome: str
    protocolo: str

class SchemaRespostaSuporte(BaseModel):
    email: str
    nome: str
    protocolo: str
    resposta: str
    link_anexo: Optional[str] = None

@router.post("/suporte/novo")
async def novo_suporte(payload: SchemaNovoSuporte):
    """Envia confirmação automática quando o cidadão preenche o formulário"""
    sucesso = enviar_confirmacao_suporte(payload.email, payload.nome, payload.protocolo)
    if sucesso: 
        return {"sucesso": True}
    raise HTTPException(status_code=500, detail="Erro no envio do e-mail de confirmação.")

@router.post("/suporte/responder")
async def responder_suporte(payload: SchemaRespostaSuporte):
    """Admin responde através do portal e este endpoint dispara o e-mail final para o cidadão"""
    sucesso = enviar_resposta_suporte(
        payload.email, 
        payload.nome, 
        payload.protocolo, 
        payload.resposta, 
        payload.link_anexo
    )
    if sucesso: 
        return {"sucesso": True}
    raise HTTPException(status_code=500, detail="Erro no envio da resposta por e-mail.")