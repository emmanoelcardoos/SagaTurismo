import os
import uuid
import json
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv

# Importação dos serviços customizados (com o 's' adicionado no email)
from app.services.ai_service import validar_endereco_com_ia
from app.services.pdf_service import gerar_pdf_carteira
from app.services.email_service import enviar_carteiras_por_email

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
        
        # Extrair a lista de nomes para mandar para a IA
        lista_nomes = [m["nome"] for m in membros]
        nome_titular = membros[0]["nome"]
        email_titular = membros[0]["email"]

        # 2. Leitura e Upload do Comprovante (Único para todos)
        contents_comprovante = await arquivo.read()
        ext_comp = arquivo.filename.split('.')[-1]
        path_comp = f"comprovantes/comp_{membros[0]['cpf']}_{uuid.uuid4().hex[:5]}.{ext_comp}"
        supabase.storage.from_("comprovantes").upload(path_comp, contents_comprovante)
        url_comprovante = supabase.storage.from_("comprovantes").get_public_url(path_comp)

        # 3. Validação Real com Gemini (Enviando a família toda)
        analise_ia = validar_endereco_com_ia(contents_comprovante, lista_nomes)
        
        if not analise_ia.get('valido'):
            return {
                "status": "erro",
                "mensagem": analise_ia.get('motivo', "Documento não aprovado pela IA."),
                "valido_ia": False
            }

        # 4. Processar e Salvar cada pessoa no Supabase
        titular_id = None
        caminhos_pdfs = []

        for index, membro in enumerate(membros):
            # Ler e fazer Upload da foto desta pessoa específica
            contents_foto = await fotos[index].read()
            ext_foto = fotos[index].filename.split('.')[-1]
            path_foto = f"fotos_perfil/foto_{membro['cpf']}_{uuid.uuid4().hex[:5]}.{ext_foto}"
            supabase.storage.from_("comprovantes").upload(path_foto, contents_foto)
            url_foto = supabase.storage.from_("comprovantes").get_public_url(path_foto)

            qrcode_token = str(uuid.uuid4())

            # Montar os dados para o Supabase
            novo_residente = {
                "nome_completo": membro["nome"],
                "cpf": membro["cpf"],
                "email": membro.get("email", email_titular), # Se dependente não tiver email, usa o do titular
                "data_nascimento": membro["data_nascimento"],
                "url_comprovante": url_comprovante,
                "foto_url": url_foto,
                "status": "ativo",
                "qrcode_token": qrcode_token
            }

            # Se não for o titular (index > 0), adicionamos a ligação à coluna titular_id
            if index > 0 and titular_id is not None:
                novo_residente["titular_id"] = titular_id

            # Salvar no Banco
            resposta_bd = supabase.table("rd_residentes").insert(novo_residente).execute()
            
            # Se for o titular (index 0), guardamos o ID dele gerado pelo banco
            if index == 0:
                titular_id = resposta_bd.data[0]['id']

            # 5. Gerar PDF individual
            try:
                dados_pdf = {
                    "nome": membro["nome"],
                    "cpf": membro["cpf"],
                    "data_nascimento": membro["data_nascimento"],
                    "foto_url": url_foto
                }
                caminho_pdf = gerar_pdf_carteira(dados_pdf, qrcode_token)
                caminhos_pdfs.append(caminho_pdf)
            except Exception as e_pdf:
                print(f"[AVISO] Erro ao gerar PDF para {membro['nome']}: {e_pdf}")

        # 6. Enviar UM único email para o titular com TODOS os PDFs anexados
        try:
            enviar_carteiras_por_email(email_titular, nome_titular, lista_nomes, caminhos_pdfs)
        except Exception as e_email:
            print(f"[AVISO] Erro ao enviar e-mail: {e_email}")

        return {
            "status": "sucesso", 
            "mensagem": f"Cadastro validado! {len(membros)} carteira(s) gerada(s) e enviada(s) para o e-mail.", 
            "valido_ia": True
        }

    except Exception as e:
        print(f"[ERRO CRÍTICO] {e}")
        raise HTTPException(status_code=500, detail=str(e))