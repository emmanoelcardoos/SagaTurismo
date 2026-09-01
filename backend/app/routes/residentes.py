import os
import uuid
import json
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv
from pydantic import BaseModel
from datetime import datetime, timedelta

# Importação dos serviços customizados
from app.services.ai_service import validar_endereco_com_ia

# ◄── REMOVIDAS as importações de PDF e E-mail daqui. O Webhook é que vai assumir esse trabalho!

load_dotenv()

router = APIRouter()

# Configuração do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.post("/residentes/cadastrar")
async def cadastrar_residente(
    integrantes: str = Form(...), # Recebe o JSON com os dados (Nome, CPF, DataNasc, Email)
    arquivo: UploadFile = File(...), # Comprovante (1 apenas)
    fotos: List[UploadFile] = File(...) # Lista de fotos (1 para cada pessoa)
):
    try:
        # 1. Converter a string JSON do frontend para uma lista de dicionários Python
        membros = json.loads(integrantes)
        
        # Validação de segurança
        if len(membros) != len(fotos):
            return {"status": "erro", "mensagem": "O número de dados e de fotos não coincide."}

        # 1.5 VERIFICAÇÃO PREVENTIVA DE TODOS OS CPFs
        # Extrair todos os CPFs submetidos no formulário (Titular + Dependentes)
        cpfs_submetidos = [m["cpf"] for m in membros]
        
        # Consultar o Supabase à procura de QUALQUER um destes CPFs
        busca_cpfs = supabase.table("rd_residentes").select("id, cpf, status").in_("cpf", cpfs_submetidos).execute()
        
        if busca_cpfs.data and len(busca_cpfs.data) > 0:
            for residente_existente in busca_cpfs.data:
                
                # Se alguém no grupo já tem a carteira ativa, bloqueamos logo com mensagem clara
                if residente_existente["status"] == "ativo":
                    return {
                        "status": "erro", 
                        "mensagem": f"O CPF {residente_existente['cpf']} já possui uma carteira ativa. Para gerar uma nova via, solicite no menu principal."
                    }
                    
                # Se alguém (ou o titular) estiver na fila de pagamento (Abandono de Carrinho)
                if residente_existente["status"] == "aguardando_pagamento":
                    # Atenção: Se o titular foi quem abandonou, usamos o ID dele para o PIX
                    if residente_existente["cpf"] == membros[0]["cpf"]:
                        return {
                            "status": "sucesso", 
                            "mensagem": "Documentação já validada anteriormente! A redirecionar para o pagamento...", 
                            "valido_ia": True,
                            "token": str(residente_existente["id"]),
                            "titular_id": residente_existente["id"], 
                            "quantidade": len(membros)
                        }
                    else:
                        # Se foi um dependente a abandonar, pedimos ao cidadão para rever
                        return {
                            "status": "erro", 
                            "mensagem": f"O CPF do dependente {residente_existente['cpf']} tem um pagamento pendente. Por favor, conclua o pagamento antigo ou contate o suporte."
                        }
            
        # ◄── NOVA VALIDAÇÃO DE SEGURANÇA NO BACKEND (BLOQUEIA HACKERS E ERROS)
        formatos_imagem = ["image/jpeg", "image/png", "image/jpg"]
        for foto in fotos:
            if foto.content_type not in formatos_imagem:
                return {"status": "erro", "mensagem": "As selfies devem ser obrigatoriamente imagens (JPG/PNG)."}
                
        formatos_comprovante = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
        if arquivo.content_type not in formatos_comprovante:
            return {"status": "erro", "mensagem": "O documento comprobatório deve ser um PDF ou Imagem."}
        
        # Extrair a lista de nomes para mandar para a IA
        lista_nomes = [m["nome"] for m in membros]
        email_titular = membros[0]["email"]

        # 2. Leitura e Upload do Comprovante (Único para todos)
        contents_comprovante = await arquivo.read()
        ext_comp = arquivo.filename.split('.')[-1]
        path_comp = f"comprovantes/comp_{membros[0]['cpf']}_{uuid.uuid4().hex[:5]}.{ext_comp}"
        supabase.storage.from_("comprovantes").upload(path_comp, contents_comprovante)
        
        # ANTES: url_comprovante = supabase.storage.from_("comprovantes").get_public_url(path_comp)
        # AGORA: Guarda apenas o caminho interno estruturado
        url_comprovante = path_comp

        # 3. Validação Real com Gemini (Enviando a família toda E O FORMATO CORRETO)
        # ◄── AGORA ENVIAMOS O mime_type PARA A IA SABER SE É PDF OU FOTO
        analise_ia = validar_endereco_com_ia(
            imagem_bytes=contents_comprovante, 
            lista_nomes=lista_nomes,
            mime_type=arquivo.content_type
        )
        
        if not analise_ia.get('valido'):
            return {
                "status": "erro",
                "mensagem": analise_ia.get('motivo', "Documento não aprovado pela IA."),
                "valido_ia": False
            }

        # 4. Processar e Salvar cada pessoa no Supabase
        titular_id = None
        data_expiracao_calculada = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")

        for index, membro in enumerate(membros):
            # Ler e fazer Upload da foto desta pessoa específica
            contents_foto = await fotos[index].read()
            ext_foto = fotos[index].filename.split('.')[-1]
            path_foto = f"fotos_perfil/foto_{membro['cpf']}_{uuid.uuid4().hex[:5]}.{ext_foto}"
            supabase.storage.from_("comprovantes").upload(path_foto, contents_foto)
            
            # ANTES: url_foto = supabase.storage.from_("comprovantes").get_public_url(path_foto)
            # AGORA: Guarda apenas o caminho interno
            url_foto = path_foto

            qrcode_token = str(uuid.uuid4())

            # Montar os dados para o Supabase
            novo_residente = {
                "nome_completo": membro["nome"],
                "cpf": membro["cpf"],
                "email": membro.get("email", email_titular), # Se dependente não tiver email, usa o do titular
                "data_nascimento": membro["data_nascimento"],
                "url_comprovante": url_comprovante,
                "foto_url": url_foto,
                "status": "aguardando_pagamento", # ◄── SEGURANÇA: Alterado de 'ativo' para aguardar o Webhook
                "qrcode_token": qrcode_token,
                "data_expiracao": data_expiracao_calculada
            }

            # Se não for o titular (index > 0), adicionamos a ligação à coluna titular_id
            if index > 0 and titular_id is not None:
                novo_residente["titular_id"] = titular_id

            # Salvar no Banco
            resposta_bd = supabase.table("rd_residentes").insert(novo_residente).execute()
            
            # Se for o titular (index 0), guardamos o ID dele gerado pelo banco
            if index == 0:
                titular_id = resposta_bd.data[0]['id']

        # ◄── AS ETAPAS 5 (Gerar PDF) e 6 (Enviar E-mail) FORAM APAGADAS DAQUI

        # ◄── RETORNO ATUALIZADO COM O TOKEN REQUISITADO PELO FRONTEND
        return {
            "status": "sucesso", 
            "mensagem": "Cadastro validado pela IA! Redirecionando para o pagamento da emissão...", 
            "valido_ia": True,
            "token": str(titular_id), # ◄── Mapeado explicitamente para o redirecionamento do Next.js
            "titular_id": titular_id, 
            "quantidade": len(membros)
        }

    except Exception as e:
        print(f"[ERRO CRÍTICO] {e}")
        raise HTTPException(status_code=500, detail=str(e))

class EmissaoManualPayload(BaseModel):
    nome: str
    cpf: str
    email: str
    data_nascimento: str
    foto_url: str
    status: str = "ativo"  # ◄── 1. ADICIONADO AQUI PARA RECEBER O STATUS DO FRONTEND

@router.post("/residentes/emissao-manual")
async def emissao_manual_admin(payload: EmissaoManualPayload):
    try:
        qrcode_token = str(uuid.uuid4())

        data_expiracao_calculada = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")

        novo_residente = {
            "nome_completo": payload.nome,
            "cpf": payload.cpf,
            "email": payload.email,
            "data_nascimento": payload.data_nascimento,
            "foto_url": payload.foto_url,
            "status": payload.status, # ◄── 2. ALTERADO AQUI PARA USAR O PAYLOAD
            "qrcode_token": qrcode_token,
            "url_comprovante": "isento_admin",
            "data_expiracao": data_expiracao_calculada
        }
        
        # O backend usa a chave mestra, logo o RLS não bloqueia isto!
        resposta = supabase.table("rd_residentes").insert(novo_residente).execute()
        
        if not resposta.data:
            raise Exception("Falha ao inserir na base de dados.")
            
        return {"sucesso": True, "residente_id": resposta.data[0]["id"]}
        
    except Exception as e:
        print(f"[ERRO EMISSÃO MANUAL] {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ◄── 3. NOVA ROTA DE BUSCA ADICIONADA AQUI (ESSENCIAL PARA O CRM FUNCIONAR) ──►
@router.get("/residentes/buscar")
async def buscar_residentes(q: str):
    """Buscador Admin: Ignora RLS para encontrar cidadãos pelo Nome ou CPF"""
    try:
        # A chave mestra do Supabase faz bypass ao bloqueio de segurança RLS
        resposta = supabase.table("rd_residentes").select("*").or_(f"cpf.ilike.%{q}%,nome_completo.ilike.%{q}%").order("criado_at", desc=True).limit(10).execute()
        
        return {"sucesso": True, "dados": resposta.data}
    except Exception as e:
        print(f"[ERRO BUSCA] {e}")
        raise HTTPException(status_code=500, detail=str(e))