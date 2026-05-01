import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv

# Importação dos serviços customizados
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
    nome: str = Form(...),
    cpf: str = Form(...),
    email: str = Form(...),
    data_nascimento: str = Form(...),
    arquivo: UploadFile = File(...), # Comprovativo
    foto: UploadFile = File(...)     # Foto de rosto
):
    try:
        # Leitura dos binários
        contents_comprovante = await arquivo.read()
        contents_foto = await foto.read()
        
        # 1. Upload Comprovativo
        ext_comp = arquivo.filename.split('.')[-1]
        path_comp = f"comprovantes/comp_{cpf}_{uuid.uuid4().hex[:5]}.{ext_comp}"
        supabase.storage.from_("comprovantes").upload(path_comp, contents_comprovante)
        url_comprovante = supabase.storage.from_("comprovantes").get_public_url(path_comp)

        # 2. Upload Foto de Perfil
        ext_foto = foto.filename.split('.')[-1]
        path_foto = f"fotos_perfil/foto_{cpf}_{uuid.uuid4().hex[:5]}.{ext_foto}"
        supabase.storage.from_("comprovantes").upload(path_foto, contents_foto)
        url_foto = supabase.storage.from_("comprovantes").get_public_url(path_foto)

        # 3. Validação Real com Gemini (Passando o nome para conferência)
        analise_ia = validar_endereco_com_ia(contents_comprovante, nome)
        
        if not analise_ia.get('valido'):
            return {
                "status": "erro",
                "mensagem": analise_ia.get('motivo', "Documento não aprovado pela IA."),
                "valido_ia": False
            }

        # 4. Sucesso na IA -> Gerar Identidade Digital
        qrcode_token = str(uuid.uuid4())

        # 5. Salvar no Banco
        novo_residente = {
            "nome_completo": nome,
            "cpf": cpf,
            "email": email,
            "data_nascimento": data_nascimento,
            "url_comprovante": url_comprovante,
            "foto_url": url_foto,
            "status": "ativo",
            "qrcode_token": qrcode_token
        }
        supabase.table("rd_residentes").insert(novo_residente).execute()

        # 6. Gerar PDF e Enviar Email
        try:
            dados_pdf = {
                "nome": nome,
                "cpf": cpf,
                "data_nascimento": data_nascimento,
                "foto_url": url_foto
            }

            # Gera o ficheiro físico e pega o caminho
            caminho_pdf = gerar_pdf_carteira(dados_pdf, qrcode_token)
            
            # Envia via Gmail
            enviar_carteira_por_email(email, nome, caminho_pdf)
            
        except Exception as e_servicos:
            print(f"[AVISO] Erro no fluxo de documentos: {e_servicos}")

        return {
            "status": "sucesso", 
            "mensagem": "Cadastro validado! Sua carteira digital foi enviada para o e-mail.", 
            "valido_ia": True,
            "token_carteira": qrcode_token 
        }

    except Exception as e:
        print(f"[ERRO CRÍTICO] {e}")
        raise HTTPException(status_code=500, detail=str(e))