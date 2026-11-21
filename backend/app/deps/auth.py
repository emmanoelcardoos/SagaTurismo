import os
from dataclasses import dataclass
from typing import Optional, Set
from fastapi import Header, HTTPException, status
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
_supabase_auth: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

DEFAULT_ADMIN_EMAILS = {
    "emmanoel.cardoso09@gmail.com",
    "planejamentosaga@gmail.com",
}


@dataclass
class OperadorAutenticado:
    user_id: Optional[str]
    email: str


def get_admin_emails() -> Set[str]:
    raw = os.getenv("PORTAL_ADMIN_EMAILS", "").strip()
    if not raw:
        return set(DEFAULT_ADMIN_EMAILS)
    emails = {item.strip().lower() for item in raw.split(",") if item.strip()}
    return emails or set(DEFAULT_ADMIN_EMAILS)


def _extrair_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação obrigatória. Faça login no portal.",
        )
    parts = authorization.strip().split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cabeçalho Authorization inválido.",
        )
    return parts[1].strip()


async def require_portal_admin(
    authorization: Optional[str] = Header(None),
) -> OperadorAutenticado:
    """
    Valida o JWT da sessão Supabase Auth do portal e garante que o e-mail
    autenticado pertence à lista de administradores configurada em PORTAL_ADMIN_EMAILS.
    """
    token = _extrair_bearer_token(authorization)

    try:
        user_resp = _supabase_auth.auth.get_user(token)
        user = getattr(user_resp, "user", None)
    except Exception as e:
        print(f"[AUTH PORTAL] Token inválido ou expirado: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão expirada ou inválida. Faça login novamente no portal.",
        )

    if not user or not getattr(user, "email", None):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário autenticado inválido.",
        )

    email_normalizado = str(user.email).strip().lower()
    if email_normalizado not in get_admin_emails():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: conta sem permissão administrativa para este recurso.",
        )

    return OperadorAutenticado(
        user_id=str(user.id) if getattr(user, "id", None) else None,
        email=email_normalizado,
    )


async def require_cron_or_portal_admin(
    authorization: Optional[str] = Header(None),
    x_cron_secret: Optional[str] = Header(None),
) -> OperadorAutenticado:
    """
    Permite execução por um administrador autenticado no portal OU via header
    x-cron-secret quando CRON_SECRET estiver configurado no ambiente.
    """
    cron_secret = os.getenv("CRON_SECRET", "").strip()
    if cron_secret and x_cron_secret and x_cron_secret.strip() == cron_secret:
        return OperadorAutenticado(user_id=None, email="sistema:cron")

    return await require_portal_admin(authorization=authorization)
