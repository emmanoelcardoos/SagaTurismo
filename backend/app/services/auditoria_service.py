import os
import re
from typing import Any, Dict, Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def apenas_digitos(valor: Optional[str]) -> str:
    if not valor:
        return ""
    return re.sub(r"\D", "", str(valor))


def formatar_cpf(valor: Optional[str]) -> str:
    digitos = apenas_digitos(valor)
    if len(digitos) == 11:
        return f"{digitos[:3]}.{digitos[3:6]}.{digitos[6:9]}-{digitos[9:]}"
    return (valor or "").strip()


def gerar_url_assinada_storage(caminho: Optional[str], expira_em: int = 300) -> Optional[str]:
    """
    Retorna URL utilizável para mídia de residente:
    - Se já for URL HTTP(S) (ex.: emissão manual no bucket 'galeria'), retorna diretamente.
    - Se for caminho relativo no bucket privado 'comprovantes', gera URL assinada temporária.
    """
    if not caminho:
        return None

    caminho_str = str(caminho).strip()
    if not caminho_str or caminho_str == "isento_admin":
        return None

    if caminho_str.startswith("http://") or caminho_str.startswith("https://"):
        return caminho_str

    try:
        resp = supabase.storage.from_("comprovantes").create_signed_url(caminho_str, expira_em)
        if isinstance(resp, dict):
            return resp.get("signedURL") or resp.get("signedUrl")
        if isinstance(resp, str):
            return resp
    except Exception as e:
        print(f"[STORAGE SIGNED URL] Erro ao assinar '{caminho_str}': {e}")

    return None


def registrar_auditoria(
    residente_id: str,
    acao: str,
    operador_user_id: Optional[str] = None,
    operador_email: Optional[str] = None,
    email_anterior: Optional[str] = None,
    email_novo: Optional[str] = None,
    motivo: Optional[str] = None,
    sucesso: bool = True,
    resend_message_id: Optional[str] = None,
    erro_detalhe: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    """
    Grava um evento na tabela public.rd_carteira_auditoria.
    Falhas de log não derrubam o fluxo principal (ex.: webhook).
    """
    if not residente_id:
        return None

    payload = {
        "residente_id": str(residente_id),
        "acao": acao,
        "operador_user_id": operador_user_id,
        "operador_email": operador_email,
        "email_anterior": email_anterior,
        "email_novo": email_novo,
        "motivo": motivo,
        "sucesso": bool(sucesso),
        "resend_message_id": resend_message_id,
        "erro_detalhe": (str(erro_detalhe)[:1000] if erro_detalhe else None),
        "metadata": metadata or {},
    }

    try:
        resp = supabase.table("rd_carteira_auditoria").insert(payload).execute()
        if resp.data:
            return resp.data[0]
    except Exception as e:
        print(f"[AUDITORIA ERRO] Não foi possível gravar log ({acao}) para {residente_id}: {e}")

    return None
