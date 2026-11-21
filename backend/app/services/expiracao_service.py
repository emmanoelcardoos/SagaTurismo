import os
from datetime import datetime, date, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from supabase import create_client, Client
from dotenv import load_dotenv

from app.services.auditoria_service import apenas_digitos, registrar_auditoria
from app.services.email_service import enviar_aviso_vencimento_carteira

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

FUSO_BRASILIA = timezone(timedelta(hours=-3))


def _hoje_local() -> date:
    return datetime.now(FUSO_BRASILIA).date()


def _parse_date(valor: Any) -> Optional[date]:
    if not valor:
        return None
    if isinstance(valor, date) and not isinstance(valor, datetime):
        return valor
    if isinstance(valor, datetime):
        return valor.date()
    texto = str(valor).strip()
    if not texto:
        return None
    try:
        if "T" in texto:
            return datetime.fromisoformat(texto.replace("Z", "+00:00")).date()
        if "-" in texto and len(texto) >= 10:
            return date.fromisoformat(texto[:10])
        if "/" in texto and len(texto) >= 10:
            partes = texto[:10].split("/")
            if len(partes) == 3:
                return date(int(partes[2]), int(partes[1]), int(partes[0]))
    except Exception:
        return None
    return None


def _formatar_data_br(data_obj: date) -> str:
    return data_obj.strftime("%d/%m/%Y")


def _buscar_todos_registros(tabela: str, select_cols: str, filtros_eq: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Pagina automaticamente para evitar o limite padrão de 1000 linhas do PostgREST."""
    todos: List[Dict[str, Any]] = []
    page_size = 1000
    offset = 0

    while True:
        query = supabase.table(tabela).select(select_cols)
        if filtros_eq:
            for col, val in filtros_eq.items():
                query = query.eq(col, val)
        resp = query.range(offset, offset + page_size - 1).execute()
        lote = resp.data or []
        todos.extend(lote)
        if len(lote) < page_size:
            break
        offset += page_size

    return todos


def _indexar_pedidos_pagos(pedidos_pagos: List[Dict[str, Any]]) -> Tuple[Dict[str, date], Dict[str, date]]:
    """
    Cria índices da data mais recente de pedido pago de carteira por item_id e por CPF (só dígitos).
    Usado como fallback quando algum registro antigo em rd_residentes não possuir data_expiracao.
    """
    por_item: Dict[str, date] = {}
    por_cpf: Dict[str, date] = {}

    for p in pedidos_pagos:
        data_pedido = (
            _parse_date(p.get("criado_em"))
            or _parse_date(p.get("criado_at"))
            or _parse_date(p.get("data_criacao"))
            or _parse_date(p.get("created_at"))
        )
        if not data_pedido:
            continue

        item_id = str(p.get("item_id") or "").strip()
        if item_id:
            anterior = por_item.get(item_id)
            if not anterior or data_pedido > anterior:
                por_item[item_id] = data_pedido

        cpf_dig = apenas_digitos(p.get("cpf_cliente"))
        if cpf_dig:
            anterior_cpf = por_cpf.get(cpf_dig)
            if not anterior_cpf or data_pedido > anterior_cpf:
                por_cpf[cpf_dig] = data_pedido

    return por_item, por_cpf


def _calcular_data_expiracao_efetiva(
    residente: Dict[str, Any],
    pedidos_por_item: Dict[str, date],
    pedidos_por_cpf: Dict[str, date],
) -> Optional[date]:
    """
    Determina a data de expiração (validade de 365 dias):
    1. Usa rd_residentes.data_expiracao quando preenchida;
    2. Fallback: data do pedido pago de carteira + 365 dias (por id/titular_id/cpf);
    3. Fallback final: rd_residentes.criado_at + 365 dias.
    """
    exp_db = _parse_date(residente.get("data_expiracao"))
    if exp_db:
        return exp_db

    res_id = str(residente.get("id") or "")
    titular_id = str(residente.get("titular_id") or "")
    cpf_dig = apenas_digitos(residente.get("cpf"))

    data_base = (
        pedidos_por_item.get(res_id)
        or (pedidos_por_item.get(titular_id) if titular_id else None)
        or (pedidos_por_cpf.get(cpf_dig) if cpf_dig else None)
        or _parse_date(residente.get("criado_at"))
    )

    if data_base:
        return data_base + timedelta(days=365)

    return None


def executar_rotina_expiracao_carteiras(
    dry_run: bool = False,
    operador_email: str = "sistema:rotina_24h",
) -> Dict[str, Any]:
    """
    Rotina periódica (24h):
    1. Consulta rd_residentes (ativos e expirados ainda não notificados) + pedidos pagos de carteira.
    2. Verifica validade de 365 dias (data_expiracao / data de criação).
    3. Desativa (status = 'expirado') apenas carteiras ATIVAS vencidas (NUNCA mexe em aguardando_pagamento).
    4. Agrupa por titular/família e envia UM e-mail de aviso ao titular informando o vencimento
       da carteira dele e dos dependentes vencidos, garantindo idempotência via
       vencimento_notificado_para_data (apenas 1 vez por ciclo de vencimento).
    """
    hoje = _hoje_local()
    agora_iso = datetime.now(timezone.utc).isoformat()

    ativos = _buscar_todos_registros("rd_residentes", "*", {"status": "ativo"})
    expirados_existentes = _buscar_todos_registros("rd_residentes", "*", {"status": "expirado"})
    pedidos_pagos = _buscar_todos_registros(
        "pedidos",
        "*",
        {"tipo_item": "carteira", "status_pagamento": "pago"},
    )
    pedidos_por_item, pedidos_por_cpf = _indexar_pedidos_pagos(pedidos_pagos)

    desativados: List[Dict[str, Any]] = []
    pendentes_notificacao: List[Tuple[Dict[str, Any], date]] = []

    # 1) Identificar e desativar carteiras ATIVAS que completaram 365 dias
    for res in ativos:
        # Defesa extra explícita: jamais tocar em aguardando_pagamento
        if res.get("status") != "ativo":
            continue

        data_exp = _calcular_data_expiracao_efetiva(res, pedidos_por_item, pedidos_por_cpf)
        if not data_exp:
            continue

        if data_exp <= hoje:
            desativados.append(res)
            if not dry_run:
                update_fields: Dict[str, Any] = {"status": "expirado"}
                if not res.get("data_expiracao"):
                    update_fields["data_expiracao"] = data_exp.isoformat()
                supabase.table("rd_residentes").update(update_fields).eq("id", res["id"]).eq("status", "ativo").execute()
                registrar_auditoria(
                    residente_id=res["id"],
                    acao="expiracao_automatica",
                    operador_email=operador_email,
                    sucesso=True,
                    metadata={"data_expiracao": data_exp.isoformat(), "hoje": hoje.isoformat()},
                )

            notificado_para = _parse_date(res.get("vencimento_notificado_para_data"))
            if notificado_para != data_exp:
                pendentes_notificacao.append((res, data_exp))

    # 2) Retentativa segura para registros já marcados como 'expirado' cujo aviso falhou anteriormente
    for res in expirados_existentes:
        if res.get("status") != "expirado":
            continue
        data_exp = _calcular_data_expiracao_efetiva(res, pedidos_por_item, pedidos_por_cpf)
        if not data_exp or data_exp > hoje:
            continue
        notificado_para = _parse_date(res.get("vencimento_notificado_para_data"))
        if notificado_para != data_exp:
            pendentes_notificacao.append((res, data_exp))

    # 3) Agrupar notificações por família (chave = titular_id ou próprio id)
    grupos: Dict[str, Dict[str, Any]] = {}
    ids_titulares_buscar = set()

    for res, data_exp in pendentes_notificacao:
        chave_familia = str(res.get("titular_id") or res["id"])
        if chave_familia not in grupos:
            grupos[chave_familia] = {
                "titular_vencido": None,
                "dependentes_vencidos": [],
                "todos_membros": [],
                "data_expiracao_ref": data_exp,
            }
        grupo = grupos[chave_familia]
        grupo["todos_membros"].append((res, data_exp))
        if data_exp > grupo["data_expiracao_ref"]:
            grupo["data_expiracao_ref"] = data_exp

        if res.get("titular_id"):
            grupo["dependentes_vencidos"].append(res)
            ids_titulares_buscar.add(str(res["titular_id"]))
        else:
            grupo["titular_vencido"] = res

    # Carregar dados dos titulares quando somente dependentes venceram neste ciclo
    titulares_por_id: Dict[str, Dict[str, Any]] = {}
    if ids_titulares_buscar:
        ids_lista = list(ids_titulares_buscar)
        for i in range(0, len(ids_lista), 100):
            fatia = ids_lista[i : i + 100]
            resp_tit = supabase.table("rd_residentes").select("*").in_("id", fatia).execute()
            for t in (resp_tit.data or []):
                titulares_por_id[str(t["id"])] = t

    emails_enviados = 0
    emails_falhos = 0
    grupos_ignorados = 0

    for chave_familia, grupo in grupos.items():
        titular = grupo["titular_vencido"] or titulares_por_id.get(chave_familia)

        # Se o titular estiver em aguardando_pagamento, NUNCA disparar e-mail
        if titular and titular.get("status") == "aguardando_pagamento":
            grupos_ignorados += 1
            continue

        email_destino = (titular.get("email") if titular else None) or (
            grupo["todos_membros"][0][0].get("email") if grupo["todos_membros"] else None
        )
        nome_titular = (titular.get("nome_completo") if titular else None) or (
            grupo["todos_membros"][0][0].get("nome_completo") if grupo["todos_membros"] else "Residente"
        )

        if not email_destino or "@" not in str(email_destino):
            grupos_ignorados += 1
            continue

        nomes_dependentes = [
            str(d.get("nome_completo")).strip()
            for d in grupo["dependentes_vencidos"]
            if d.get("nome_completo")
        ]
        titular_tambem_venceu = grupo["titular_vencido"] is not None
        data_br = _formatar_data_br(grupo["data_expiracao_ref"])

        if dry_run:
            emails_enviados += 1
            continue

        res_email = enviar_aviso_vencimento_carteira(
            email_destino=str(email_destino).strip(),
            nome_titular=str(nome_titular).strip(),
            data_vencimento_br=data_br,
            nomes_dependentes=nomes_dependentes,
            titular_venceu=titular_tambem_venceu,
        )

        if res_email.get("ok"):
            emails_enviados += 1
            for membro, m_data_exp in grupo["todos_membros"]:
                supabase.table("rd_residentes").update(
                    {
                        "vencimento_notificado_em": agora_iso,
                        "vencimento_notificado_para_data": m_data_exp.isoformat(),
                    }
                ).eq("id", membro["id"]).execute()

                registrar_auditoria(
                    residente_id=membro["id"],
                    acao="email_vencimento",
                    operador_email=operador_email,
                    email_novo=str(email_destino).strip(),
                    sucesso=True,
                    resend_message_id=res_email.get("resend_id"),
                    metadata={
                        "data_expiracao": m_data_exp.isoformat(),
                        "dependentes_notificados": nomes_dependentes,
                        "titular_venceu": titular_tambem_venceu,
                    },
                )
        else:
            emails_falhos += 1
            for membro, m_data_exp in grupo["todos_membros"]:
                registrar_auditoria(
                    residente_id=membro["id"],
                    acao="email_vencimento",
                    operador_email=operador_email,
                    email_novo=str(email_destino).strip(),
                    sucesso=False,
                    erro_detalhe=res_email.get("erro"),
                    metadata={"data_expiracao": m_data_exp.isoformat()},
                )

    resumo = {
        "sucesso": True,
        "dry_run": dry_run,
        "data_referencia": hoje.isoformat(),
        "ativos_analisados": len(ativos),
        "carteiras_desativadas": len(desativados),
        "familias_notificadas": emails_enviados,
        "falhas_envio_email": emails_falhos,
        "grupos_ignorados": grupos_ignorados,
    }
    print(f"[ROTINA EXPIRAÇÃO 24H] {resumo}")
    return resumo
