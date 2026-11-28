"""
Verificação server-side de pagamentos Pix (Banco do Brasil) e utilitários de segurança.

Nunca confiar apenas no corpo do webhook: qualquer pessoa pode fazer POST em
/api/v1/webhooks/bb com um txid. Antes de ativar carteiras/ingressos, o backend
consulta a API Pix do BB (escopo pix.read, o mesmo já solicitado na criação da
cobrança) e confere txid + valor.

Modo de operação (variável PAGAMENTOS_MODO_VERIFICACAO):
  - "observe" (padrão): verifica e REGISTA em log o resultado, mas continua a
    processar como antes (compatibilidade com produção enquanto se valida).
  - "enforce": só ativa/emite quando o pagamento é confirmado pelo banco.
"""

import base64
import os
import re
import secrets
import string
import tempfile
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional

import httpx

BB_CLIENT_ID = os.environ.get("BB_CLIENT_ID")
BB_CLIENT_SECRET = os.environ.get("BB_CLIENT_SECRET")
BB_DEV_APP_KEY = os.environ.get("BB_DEVELOPER_APPLICATION_KEY", os.environ.get("BB_DEV_APP_KEY"))
BB_ENV = os.environ.get("BB_ENV", "sandbox")

# Mesmo endpoint OAuth usado na criação da cobrança (pagamentos.py) para garantir
# que o token obtido é válido para o mesmo ambiente que gerou o txid.
BB_OAUTH_URL_COBRANCA = "https://oauth.bb.com.br/oauth/token"
BB_API_URL = "https://api-pix.bb.com.br/pix/v2" if BB_ENV == "producao" else "https://api.hm.bb.com.br/pix/v2"

TXID_RE = re.compile(r"^[A-Za-z0-9]{26,35}$")
E2E_RE = re.compile(r"^[A-Za-z0-9]{32}$")
_TXID_ALFABETO = string.ascii_letters + string.digits


def modo_verificacao() -> str:
    modo = os.environ.get("PAGAMENTOS_MODO_VERIFICACAO", "observe").strip().lower()
    return modo if modo in ("observe", "enforce") else "observe"


def modo_enforce() -> bool:
    return modo_verificacao() == "enforce"


def gerar_txid(tamanho: int = 30) -> str:
    """TXID imprevisível (CSPRNG). random.choices não é adequado para identificadores de pagamento."""
    return "".join(secrets.choice(_TXID_ALFABETO) for _ in range(tamanho))


def para_decimal(valor: Any) -> Optional[Decimal]:
    if valor is None or valor == "":
        return None
    try:
        return Decimal(str(valor)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return None


def segredo_confere(recebido: Optional[str], esperado: Optional[str]) -> bool:
    if not recebido or not esperado:
        return False
    return secrets.compare_digest(str(recebido).strip(), str(esperado).strip())


@dataclass
class ResultadoVerificacao:
    # True = banco confirmou; False = banco negou/valor divergente; None = não foi possível verificar
    confirmado: Optional[bool]
    motivo: str
    valor_recebido: Optional[Decimal] = None
    end_to_end_id: Optional[str] = None


class VerificacaoIndisponivel(Exception):
    pass


@contextmanager
def _certificados_mtls():
    if BB_ENV != "producao":
        yield None
        return
    cert_pub = os.environ.get("BB_CERT_PUB")
    cert_priv = os.environ.get("BB_CERT_PRIV")
    if not cert_pub or not cert_priv:
        raise VerificacaoIndisponivel("Certificados mTLS (BB_CERT_PUB/BB_CERT_PRIV) não configurados.")
    pub_fd, pub_path = tempfile.mkstemp(suffix=".pem")
    priv_fd, priv_path = tempfile.mkstemp(suffix=".key")
    try:
        with os.fdopen(pub_fd, "w") as f:
            f.write(cert_pub)
        with os.fdopen(priv_fd, "w") as f:
            f.write(cert_priv)
        yield (pub_path, priv_path)
    finally:
        for p in (pub_path, priv_path):
            try:
                os.remove(p)
            except OSError:
                pass


async def _token_bb(client: httpx.AsyncClient) -> str:
    auth_b64 = base64.b64encode(f"{BB_CLIENT_ID}:{BB_CLIENT_SECRET}".encode()).decode("utf-8")
    resp = await client.post(
        BB_OAUTH_URL_COBRANCA,
        headers={"Authorization": f"Basic {auth_b64}", "Content-Type": "application/x-www-form-urlencoded"},
        data={"grant_type": "client_credentials", "scope": "cob.write pix.read"},
        params={"gw-dev-app-key": BB_DEV_APP_KEY},
    )
    if resp.status_code != 200:
        raise VerificacaoIndisponivel(f"OAuth BB falhou (HTTP {resp.status_code}).")
    token = resp.json().get("access_token")
    if not token:
        raise VerificacaoIndisponivel("OAuth BB não devolveu access_token.")
    return token


async def _get_bb(path: str, params: Optional[Dict[str, str]] = None) -> Optional[Dict[str, Any]]:
    """GET autenticado na API Pix do BB. Devolve None em 404; levanta VerificacaoIndisponivel em falhas."""
    try:
        with _certificados_mtls() as cert:
            kwargs: Dict[str, Any] = {"timeout": 20.0}
            if cert:
                kwargs["cert"] = cert
            async with httpx.AsyncClient(**kwargs) as client:
                token = await _token_bb(client)
                query = {"gw-dev-app-key": BB_DEV_APP_KEY}
                if params:
                    query.update(params)
                resp = await client.get(
                    f"{BB_API_URL}{path}",
                    headers={"Authorization": f"Bearer {token}"},
                    params=query,
                )
    except VerificacaoIndisponivel:
        raise
    except Exception as e:  # rede, timeout, TLS
        raise VerificacaoIndisponivel(f"Erro de comunicação com o BB: {e!r}")

    if resp.status_code == 404:
        return None
    if resp.status_code != 200:
        raise VerificacaoIndisponivel(f"API Pix BB devolveu HTTP {resp.status_code}: {resp.text[:300]}")
    return resp.json()


def _fmt_rfc3339(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse_data(valor: Any) -> Optional[datetime]:
    if not valor:
        return None
    try:
        dt = datetime.fromisoformat(str(valor).replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


async def listar_pix_por_txid(txid: str, criado_em: Any = None) -> List[Dict[str, Any]]:
    agora = datetime.now(timezone.utc)
    inicio = (_parse_data(criado_em) or agora - timedelta(days=4)) - timedelta(hours=1)
    # A API do BB limita o intervalo de consulta; 4 dias é seguro.
    fim = min(agora, inicio + timedelta(days=4))
    dados = await _get_bb("/pix", {"inicio": _fmt_rfc3339(inicio), "fim": _fmt_rfc3339(fim), "txid": txid})
    if not dados:
        return []
    return [p for p in (dados.get("pix") or []) if str(p.get("txid") or "") == txid]


async def verificar_pagamento_bb(
    txid: str,
    valor_esperado: Any,
    end_to_end_id: Optional[str] = None,
    criado_em: Any = None,
) -> ResultadoVerificacao:
    """Confirma no BB que existe Pix liquidado para o txid com valor >= valor esperado."""
    esperado = para_decimal(valor_esperado)
    if esperado is None:
        return ResultadoVerificacao(False, "Pedido sem valor_total válido.")

    try:
        pix_list: List[Dict[str, Any]] = []
        if end_to_end_id and E2E_RE.match(str(end_to_end_id)):
            pix = await _get_bb(f"/pix/{end_to_end_id}")
            if pix:
                pix_list = [pix]
        if not pix_list:
            pix_list = await listar_pix_por_txid(txid, criado_em)
    except VerificacaoIndisponivel as e:
        return ResultadoVerificacao(None, str(e))

    pix_do_txid = [p for p in pix_list if str(p.get("txid") or "") == txid]
    if not pix_do_txid:
        return ResultadoVerificacao(False, "Nenhum Pix encontrado no BB para este txid/endToEndId.")

    total = sum((para_decimal(p.get("valor")) or Decimal("0")) for p in pix_do_txid)
    e2e = pix_do_txid[0].get("endToEndId")
    if total < esperado:
        return ResultadoVerificacao(False, f"Valor recebido {total} menor que o esperado {esperado}.", total, e2e)
    return ResultadoVerificacao(True, "Pagamento confirmado pelo Banco do Brasil.", total, e2e)
