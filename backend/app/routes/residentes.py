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

@router.post("/residentes/adicionar-dependentes")
async def adicionar_dependentes(
    titular_id: str = Form(...),
    integrantes: str = Form(...), # JSON com [{nome, cpf, data_nascimento}]
    fotos: List[UploadFile] = File(...)
):
    try:
        membros = json.loads(integrantes)
        
        if len(membros) != len(fotos):
            return {"status": "erro", "mensagem": "O número de dados e de fotos não coincide."}

        # 1. Buscar dados essenciais do Titular e verificar hierarquia
        res_titular = supabase.table("rd_residentes").select("email, url_comprovante, status, titular_id").eq("id", titular_id).single().execute()
        
        if not res_titular.data:
            return {"status": "erro", "mensagem": "Utente não encontrado na base de dados."}
            
        # ◄── REGRA 1: Bloqueia se quem estiver a tentar adicionar for um dependente
        if res_titular.data.get("titular_id") is not None:
            return {"status": "erro", "mensagem": "Apenas o titular do cadastro pode adicionar novos dependentes."}
            
        if res_titular.data["status"] != "ativo":
            return {"status": "erro", "mensagem": "Apenas titulares com carteira ATIVA podem adicionar dependentes."}

        # ◄── REGRA 2: Limite máximo de 5 pessoas (Titular + 4 Dependentes)
        # Conta quantos membros já existem na família (o próprio titular + dependentes atuais)
        res_familia = supabase.table("rd_residentes").select("id").or_(f"id.eq.{titular_id},titular_id.eq.{titular_id}").execute()
        membros_atuais_qtd = len(res_familia.data)
        
        vagas_restantes = 5 - membros_atuais_qtd
        
        if len(membros) > vagas_restantes:
            if vagas_restantes <= 0:
                return {"status": "erro", "mensagem": "O seu grupo familiar já atingiu o limite máximo de 5 pessoas."}
            else:
                palavra = "dependente" if vagas_restantes == 1 else "dependentes"
                return {"status": "erro", "mensagem": f"O limite é de 5 pessoas por família. Só pode adicionar mais {vagas_restantes} {palavra}."}

        titular_dados = res_titular.data

        # 2. Verificação de Segurança de CPFs
        cpfs_submetidos = [m["cpf"] for m in membros]
        busca_cpfs = supabase.table("rd_residentes").select("cpf").in_("cpf", cpfs_submetidos).execute()
        
        if busca_cpfs.data and len(busca_cpfs.data) > 0:
            return {
                "status": "erro", 
                "mensagem": f"O dependente com o CPF {busca_cpfs.data[0]['cpf']} já está registado no sistema."
            }

        # 3. Validação de Formato de Imagem
        formatos_imagem = ["image/jpeg", "image/png", "image/jpg"]
        for foto in fotos:
            if foto.content_type not in formatos_imagem:
                return {"status": "erro", "mensagem": "As fotos devem ser obrigatoriamente imagens (JPG/PNG)."}

        # 4. Inserir Dependentes na Base de Dados
        data_expiracao_calculada = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")

        for index, membro in enumerate(membros):
            contents_foto = await fotos[index].read()
            ext_foto = fotos[index].filename.split('.')[-1]
            path_foto = f"fotos_perfil/foto_{membro['cpf']}_{uuid.uuid4().hex[:5]}.{ext_foto}"
            
            supabase.storage.from_("comprovantes").upload(path_foto, contents_foto)

            novo_dependente = {
                "nome_completo": membro["nome"],
                "cpf": membro["cpf"],
                "email": titular_dados["email"], 
                "data_nascimento": membro["data_nascimento"],
                "url_comprovante": titular_dados["url_comprovante"], 
                "foto_url": path_foto,
                "status": "aguardando_pagamento",
                "qrcode_token": str(uuid.uuid4()),
                "data_expiracao": data_expiracao_calculada,
                "titular_id": titular_id 
            }

            supabase.table("rd_residentes").insert(novo_dependente).execute()

        # 5. Retornar os dados para o Frontend prosseguir com o pagamento
        return {
            "status": "sucesso",
            "mensagem": "Dependentes validados! Redirecionando para o pagamento da emissão...",
            "token": titular_id, 
            "quantidade": len(membros)
        }

    except Exception as e:
        print(f"[ERRO ADD DEPENDENTES] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/residentes/consultar-limite/{cpf}")
async def consultar_limite_familia(cpf: str):
    try:
        cpf_numeros = ''.join(filter(str.isdigit, cpf))
        if len(cpf_numeros) == 11:
            cpf_formatado = f"{cpf_numeros[:3]}.{cpf_numeros[3:6]}.{cpf_numeros[6:9]}-{cpf_numeros[9:]}"
        else:
            cpf_formatado = cpf

        res_titular = supabase.table("rd_residentes").select("id, nome_completo, status, titular_id").eq("cpf", cpf_formatado).execute()
        
        if not res_titular.data or len(res_titular.data) == 0:
            return {"status": "erro", "mensagem": "Nenhum registo encontrado com este CPF."}
            
        titular_dados = res_titular.data[0] 
        
        if titular_dados.get("titular_id") is not None:
            return {"status": "erro", "mensagem": "Este CPF pertence a um dependente. Apenas o titular pode adicionar familiares."}
            
        if titular_dados["status"] != "ativo":
            return {"status": "erro", "mensagem": "A sua carteira precisa estar ATIVA para poder adicionar dependentes."}
            
        # ◄── CORREÇÃO 1: Conta APENAS os membros ATIVOS da família para calcular vagas
        res_familia = supabase.table("rd_residentes").select("id").or_(f"id.eq.{titular_dados['id']},titular_id.eq.{titular_dados['id']}").eq("status", "ativo").execute()
        membros_atuais = len(res_familia.data)
        
        vagas = 5 - membros_atuais
        
        return {
            "status": "sucesso",
            "nome_titular": titular_dados["nome_completo"],
            "vagas_restantes": vagas if vagas > 0 else 0,
            "titular_id": titular_dados["id"]
        }
    except Exception as e:
        print(f"[ERRO CONSULTA LIMITE] {e}")
        return {"status": "erro", "mensagem": "Erro interno ao consultar o servidor."}


@router.post("/residentes/adicionar-dependente")
async def processar_dependentes_extras(
    cpf_titular: str = Form(...),
    integrantes: str = Form(...), 
    fotos: List[UploadFile] = File(...)
):
    try:
        membros = json.loads(integrantes)
        
        if len(membros) != len(fotos):
            return {"status": "erro", "mensagem": "O número de dados e de fotos não coincide."}

        res_titular = supabase.table("rd_residentes").select("id, email, url_comprovante").eq("cpf", cpf_titular).execute()
        if not res_titular.data or len(res_titular.data) == 0:
            return {"status": "erro", "mensagem": "Titular não encontrado na base de dados."}
            
        titular_dados = res_titular.data[0]
        titular_id = titular_dados["id"]
        email_titular = titular_dados["email"]
        comprovante_titular = titular_dados["url_comprovante"]

        # ◄── CORREÇÃO 2: Busca CPFs para ver se fazemos INSERT (novo) ou UPDATE (reaproveitar)
        cpfs_submetidos = [m["cpf"] for m in membros]
        busca_cpfs = supabase.table("rd_residentes").select("id, cpf, status").in_("cpf", cpfs_submetidos).execute()
        
        mapa_existentes = {r["cpf"]: r for r in busca_cpfs.data} if busca_cpfs.data else {}

        formatos_imagem = ["image/jpeg", "image/png", "image/jpg"]
        for foto in fotos:
            if foto.content_type not in formatos_imagem:
                return {"status": "erro", "mensagem": "As fotos devem ser obrigatoriamente imagens (JPG/PNG)."}

        data_expiracao_calculada = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")

        for index, membro in enumerate(membros):
            contents_foto = await fotos[index].read()
            ext_foto = fotos[index].filename.split('.')[-1]
            path_foto = f"fotos_perfil/foto_{membro['cpf']}_{uuid.uuid4().hex[:5]}.{ext_foto}"
            supabase.storage.from_("comprovantes").upload(path_foto, contents_foto)

            membro_existente = mapa_existentes.get(membro["cpf"])
            
            if membro_existente:
                if membro_existente["status"] == "ativo":
                    return {"status": "erro", "mensagem": f"O dependente {membro['nome']} já possui uma carteira ATIVA."}
                else:
                    # ◄── UPDATE: Se já existir mas estiver pendente, apenas atualiza a linha!
                    supabase.table("rd_residentes").update({
                        "nome_completo": membro["nome"],
                        "data_nascimento": membro["data_nascimento"],
                        "foto_url": path_foto,
                        "titular_id": titular_id,
                        "status": "aguardando_pagamento",
                        "data_expiracao": data_expiracao_calculada
                    }).eq("id", membro_existente["id"]).execute()
            else:
                # ◄── INSERT: Só cria linha nova se o CPF for inédito
                novo_dependente = {
                    "nome_completo": membro["nome"],
                    "cpf": membro["cpf"],
                    "email": email_titular, 
                    "data_nascimento": membro["data_nascimento"],
                    "url_comprovante": comprovante_titular, 
                    "foto_url": path_foto,
                    "status": "aguardando_pagamento",
                    "qrcode_token": str(uuid.uuid4()),
                    "data_expiracao": data_expiracao_calculada,
                    "titular_id": titular_id 
                }
                supabase.table("rd_residentes").insert(novo_dependente).execute()

        return {
            "status": "sucesso",
            "mensagem": "Familiares processados com sucesso!",
            "titular_id": titular_id 
        }

    except Exception as e:
        print(f"[ERRO ADD DEPENDENTES EXTRA] {e}")
        raise HTTPException(status_code=500, detail=str(e))