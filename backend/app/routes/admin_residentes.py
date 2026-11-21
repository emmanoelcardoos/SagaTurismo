import os
import re
import uuid
from datetime import datetime, date, timedelta, timezone
from typing import Any, Dict, List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

from app.deps.auth import OperadorAutenticado, require_cron_or_portal_admin, require_portal_admin
from app.services.auditoria_service import (
    apenas_digitos,
    formatar_cpf,
    gerar_url_assinada_storage,
    registrar_auditoria,
)
from app.services.email_service import enviar_carteira_por_email_detalhado
from app.services.expiracao_service import executar_rotina_expiracao_carteiras
from app.services.pdf_service import gerar_pdf_carteira_bytes, nome_arquivo_carteira

load_dotenv()

router = APIRouter(prefix="/api/v1/admin/residentes", tags=["Administração de Residentes"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
FUSO_BRASILIA = timezone(timedelta(hours=-3))


class AtualizarEmailPayload(BaseModel):
    email: str
    motivo: Optional[str] = None


class ReprocessarCarteiraPayload(BaseModel):
    email: Optional[str] = None
    motivo: Optional[str] = None


def _validar_email(email_raw: str) -> str:
    email_limpo = str(email_raw or "").strip().lower()
    if not email_limpo or not EMAIL_REGEX.match(email_limpo):
        raise HTTPException(status_code=400, detail="Informe um endereço de e-mail válido.")
    return email_limpo


def _esta_expirada(data_expiracao: Optional[str]) -> bool:
    if not data_expiracao:
        return False
    try:
        hoje = datetime.now(FUSO_BRASILIA).date()
        data_str = str(data_expiracao).split("T")[0]
        exp = date.fromisoformat(data_str)
        return exp <= hoje
    except Exception:
        return False


def _sincronizar_email_pedidos_pendentes(residente: Dict[str, Any], novo_email: str) -> int:
    """
    Atualiza apenas pedidos de carteira que ainda estejam 'aguardando' pagamento
    para que o webhook do Banco do Brasil utilize o e-mail corrigido quando o Pix cair.
    NUNCA altera status_pagamento nem cria cobrança no BB.
    """
    atualizados = 0
    titular_id = residente.get("titular_id") or residente["id"]
    cpf_formatado = formatar_cpf(residente.get("cpf"))
    cpf_digitos = apenas_digitos(residente.get("cpf"))

    try:
        ids_para_atualizar = set()

        resp_item = (
            supabase.table("pedidos")
            .select("id")
            .eq("tipo_item", "carteira")
            .eq("status_pagamento", "aguardando")
            .eq("item_id", titular_id)
            .execute()
        )
        for row in (resp_item.data or []):
            ids_para_atualizar.add(row["id"])

        if cpf_digitos:
            resp_cpf = (
                supabase.table("pedidos")
                .select("id")
                .eq("tipo_item", "carteira")
                .eq("status_pagamento", "aguardando")
                .in_("cpf_cliente", [cpf_digitos, cpf_formatado])
                .execute()
            )
            for row in (resp_cpf.data or []):
                ids_para_atualizar.add(row["id"])

        for pedido_id in ids_para_atualizar:
            supabase.table("pedidos").update({"email_cliente": novo_email}).eq("id", pedido_id).eq(
                "status_pagamento", "aguardando"
            ).execute()
            atualizados += 1
    except Exception as e:
        print(f"[SYNC EMAIL PEDIDOS PENDENTES] Aviso: {e}")

    return atualizados


def _buscar_pagamentos_relacionados(residente: Dict[str, Any], titular: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Consulta somente leitura dos pedidos de carteira vinculados ao residente/titular."""
    pedidos_mapa: Dict[str, Dict[str, Any]] = {}
    ids_busca = [str(residente["id"])]
    if residente.get("titular_id"):
        ids_busca.append(str(residente["titular_id"]))

    cpfs_busca = set()
    for pessoa in [residente, titular]:
        if not pessoa:
            continue
        c_fmt = formatar_cpf(pessoa.get("cpf"))
        c_dig = apenas_digitos(pessoa.get("cpf"))
        if c_fmt:
            cpfs_busca.add(c_fmt)
        if c_dig:
            cpfs_busca.add(c_dig)

    try:
        resp_item = (
            supabase.table("pedidos")
            .select("*")
            .eq("tipo_item", "carteira")
            .in_("item_id", list(set(ids_busca)))
            .execute()
        )
        for p in (resp_item.data or []):
            pedidos_mapa[str(p["id"])] = p
    except Exception as e:
        print(f"[ADMIN DETALHES] Erro buscando pedidos por item_id: {e}")

    if cpfs_busca:
        try:
            resp_cpf = (
                supabase.table("pedidos")
                .select("*")
                .eq("tipo_item", "carteira")
                .in_("cpf_cliente", list(cpfs_busca))
                .execute()
            )
            for p in (resp_cpf.data or []):
                pedidos_mapa[str(p["id"])] = p
        except Exception as e:
            print(f"[ADMIN DETALHES] Erro buscando pedidos por CPF: {e}")

    lista = []
    for p in pedidos_mapa.values():
        criado = p.get("created_at") or p.get("criado_em") or p.get("criado_at")
        lista.append(
            {
                "id": p.get("id"),
                "codigo_pedido": p.get("codigo_pedido"),
                "status_pagamento": p.get("status_pagamento"),
                "metodo_pagamento": p.get("metodo_pagamento"),
                "valor_total": p.get("valor_total"),
                "quantidade": p.get("quantidade"),
                "nome_item": p.get("nome_item"),
                "email_cliente": p.get("email_cliente"),
                "telefone_cliente": p.get("telefone_cliente"),
                "criado_em": criado,
            }
        )

    lista.sort(key=lambda x: str(x.get("criado_em") or ""), reverse=True)
    return lista


@router.get("")
async def listar_residentes_admin(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(500, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    operador: OperadorAutenticado = Depends(require_portal_admin),
):
    """
    Listagem autenticada de residentes para a página de serviço.
    Não expõe qrcode_token nem caminhos internos de comprovantes.
    """
    try:
        cols = "id, nome_completo, cpf, email, status, data_nascimento, data_expiracao, titular_id, criado_at"
        query = supabase.table("rd_residentes").select(cols).order("criado_at", desc=True)

        if status and status.lower() != "todos":
            query = query.eq("status", status)

        if q and q.strip():
            termo = q.strip()
            digitos = apenas_digitos(termo)
            filtros = [f"nome_completo.ilike.%{termo}%", f"email.ilike.%{termo}%", f"cpf.ilike.%{termo}%"]
            if len(digitos) == 11:
                filtros.append(f"cpf.ilike.%{formatar_cpf(digitos)}%")
            query = query.or_(",".join(filtros))

        resp = query.range(offset, offset + limit - 1).execute()
        dados = resp.data or []

        # Contadores globais rápidos (respeitando a base real)
        resp_all_status = supabase.table("rd_residentes").select("status").execute()
        todos_status = resp_all_status.data or []
        contadores = {
            "total": len(todos_status),
            "ativos": sum(1 for r in todos_status if r.get("status") == "ativo"),
            "aguardando": sum(1 for r in todos_status if r.get("status") == "aguardando_pagamento"),
            "expirados": sum(1 for r in todos_status if r.get("status") == "expirado"),
            "inativos": sum(
                1
                for r in todos_status
                if r.get("status") not in ("ativo", "aguardando_pagamento", "expirado")
            ),
        }

        return {
            "sucesso": True,
            "dados": dados,
            "contadores": contadores,
            "operador": operador.email,
        }
    except Exception as e:
        print(f"[ADMIN LISTAR RESIDENTES] Erro: {e}")
        raise HTTPException(status_code=500, detail="Erro ao carregar a base de residentes.")


@router.get("/{residente_id}")
async def obter_detalhes_residente(
    residente_id: str,
    operador: OperadorAutenticado = Depends(require_portal_admin),
):
    """
    Visão expandida e segura de um residente:
    - Dados cadastrais e status da carteira;
    - Foto com URL assinada (TTL 5 min);
    - Vínculo familiar (titular/dependentes);
    - Histórico financeiro somente leitura (pedidos Pix BB / manual);
    - Histórico de auditoria (edições de e-mail, reprocessamentos, falhas Resend, downloads/impressões).
    """
    try:
        resp = supabase.table("rd_residentes").select("*").eq("id", residente_id).maybe_single().execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Residente não encontrado.")

        residente = resp.data
        status_atual = residente.get("status") or "inativo"
        token_bruto = str(residente.get("qrcode_token") or "")
        qrcode_resumo = f"...{token_bruto[-8:]}" if len(token_bruto) >= 8 else (token_bruto or "—")

        url_comp = str(residente.get("url_comprovante") or "").strip()
        possui_comprovante = bool(url_comp and url_comp != "isento_admin")
        foto_assinada = gerar_url_assinada_storage(residente.get("foto_url"), expira_em=300)

        # Grupo familiar
        titular_resumo = None
        dependentes_lista: List[Dict[str, Any]] = []
        titular_obj = None

        if residente.get("titular_id"):
            resp_tit = (
                supabase.table("rd_residentes")
                .select("id, nome_completo, cpf, email, status, data_expiracao")
                .eq("id", residente["titular_id"])
                .maybe_single()
                .execute()
            )
            if resp_tit.data:
                titular_obj = resp_tit.data
                titular_resumo = resp_tit.data
        else:
            resp_deps = (
                supabase.table("rd_residentes")
                .select("id, nome_completo, cpf, email, status, data_expiracao")
                .eq("titular_id", residente["id"])
                .order("criado_at", desc=False)
                .execute()
            )
            dependentes_lista = resp_deps.data or []

        # Pedidos financeiros (somente leitura)
        pagamentos = _buscar_pagamentos_relacionados(residente, titular_obj)

        # Auditoria recente
        auditoria: List[Dict[str, Any]] = []
        try:
            resp_aud = (
                supabase.table("rd_carteira_auditoria")
                .select("*")
                .eq("residente_id", residente["id"])
                .order("criado_em", desc=True)
                .limit(30)
                .execute()
            )
            auditoria = resp_aud.data or []
        except Exception as e_aud:
            print(f"[ADMIN DETALHES] Erro ao carregar auditoria: {e_aud}")

        expirada = _esta_expirada(residente.get("data_expiracao"))
        permite_emissao = status_atual == "ativo"

        return {
            "sucesso": True,
            "residente": {
                "id": residente.get("id"),
                "nome_completo": residente.get("nome_completo"),
                "cpf": residente.get("cpf"),
                "email": residente.get("email"),
                "data_nascimento": residente.get("data_nascimento"),
                "status": status_atual,
                "data_expiracao": residente.get("data_expiracao"),
                "esta_expirada": expirada,
                "criado_at": residente.get("criado_at"),
                "titular_id": residente.get("titular_id"),
                "origem_cadastro": "Emissão manual (isento comprovante)" if url_comp == "isento_admin" else "Cadastro online (comprovante)",
                "possui_comprovante": possui_comprovante,
                "foto_assinada_url": foto_assinada,
                "qrcode_resumo": qrcode_resumo,
                "vencimento_notificado_em": residente.get("vencimento_notificado_em"),
                "vencimento_notificado_para_data": residente.get("vencimento_notificado_para_data"),
                "permite_reprocessar_e_baixar": permite_emissao,
            },
            "familia": {
                "tipo_vinculo": "dependente" if residente.get("titular_id") else "titular",
                "titular": titular_resumo,
                "dependentes": dependentes_lista,
            },
            "pagamentos": pagamentos,
            "auditoria": auditoria,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN DETALHES] Erro: {e}")
        raise HTTPException(status_code=500, detail="Erro ao carregar detalhes do residente.")


@router.get("/{residente_id}/comprovante-url")
async def obter_url_comprovante(
    residente_id: str,
    operador: OperadorAutenticado = Depends(require_portal_admin),
):
    """Gera URL assinada temporária (120s) sob demanda para o comprovante de residência e audita o acesso."""
    resp = supabase.table("rd_residentes").select("id, url_comprovante").eq("id", residente_id).maybe_single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Residente não encontrado.")

    caminho = str(resp.data.get("url_comprovante") or "").strip()
    if not caminho or caminho == "isento_admin":
        raise HTTPException(status_code=404, detail="Este cadastro não possui comprovante anexado.")

    url_assinada = gerar_url_assinada_storage(caminho, expira_em=120)
    if not url_assinada:
        raise HTTPException(status_code=502, detail="Não foi possível gerar o link temporário do comprovante.")

    registrar_auditoria(
        residente_id=residente_id,
        acao="visualizacao_comprovante",
        operador_user_id=operador.user_id,
        operador_email=operador.email,
        sucesso=True,
    )

    return {"sucesso": True, "url": url_assinada, "expira_em_segundos": 120}


@router.patch("/{residente_id}/email")
async def atualizar_email_residente(
    residente_id: str,
    payload: AtualizarEmailPayload,
    operador: OperadorAutenticado = Depends(require_portal_admin),
):
    """
    Atualiza e salva o e-mail do residente (permitido em qualquer status, inclusive aguardando_pagamento).
    Sincroniza pedidos de carteira ainda em 'aguardando' sem tocar no Banco do Brasil nem disparar e-mail.
    """
    novo_email = _validar_email(payload.email)
    motivo = (payload.motivo or "").strip()[:300] or None

    resp = supabase.table("rd_residentes").select("*").eq("id", residente_id).maybe_single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Residente não encontrado.")

    residente = resp.data
    email_anterior = str(residente.get("email") or "").strip().lower()

    if email_anterior == novo_email:
        return {
            "sucesso": True,
            "alterado": False,
            "email_anterior": email_anterior,
            "email_novo": novo_email,
            "pedidos_pendentes_sincronizados": 0,
            "mensagem": "O e-mail informado já é o e-mail atual deste cadastro.",
        }

    supabase.table("rd_residentes").update({"email": novo_email}).eq("id", residente_id).execute()

    pedidos_sincronizados = _sincronizar_email_pedidos_pendentes(residente, novo_email)

    registrar_auditoria(
        residente_id=residente_id,
        acao="edicao_email",
        operador_user_id=operador.user_id,
        operador_email=operador.email,
        email_anterior=email_anterior,
        email_novo=novo_email,
        motivo=motivo,
        sucesso=True,
        metadata={
            "status_residente": residente.get("status"),
            "pedidos_pendentes_sincronizados": pedidos_sincronizados,
        },
    )

    return {
        "sucesso": True,
        "alterado": True,
        "email_anterior": email_anterior,
        "email_novo": novo_email,
        "pedidos_pendentes_sincronizados": pedidos_sincronizados,
        "mensagem": "E-mail atualizado com sucesso.",
    }


@router.post("/{residente_id}/reprocessar-carteira")
async def reprocessar_carteira_residente(
    residente_id: str,
    payload: ReprocessarCarteiraPayload,
    operador: OperadorAutenticado = Depends(require_portal_admin),
):
    """
    Reprocessa (gera PDF em memória + reenvia via Resend) a carteira individual de um residente ATIVO,
    com opção de editar/salvar o novo e-mail antes do disparo.

    GARANTIAS:
    - NUNCA dispara cobrança/Pix no Banco do Brasil;
    - NUNCA cria ou altera status de pagamento na tabela pedidos;
    - BLOQUEIA qualquer envio quando status == 'aguardando_pagamento' (ou != 'ativo').
    """
    resp = supabase.table("rd_residentes").select("*").eq("id", residente_id).maybe_single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Residente não encontrado.")

    residente = resp.data
    status_atual = residente.get("status")

    if status_atual == "aguardando_pagamento":
        raise HTTPException(
            status_code=409,
            detail="Bloqueado: este residente está aguardando pagamento. Não é permitido emitir ou enviar a carteira antes da confirmação financeira.",
        )

    if status_atual != "ativo":
        raise HTTPException(
            status_code=409,
            detail=f"Bloqueado: apenas carteiras com status ATIVO podem ser reprocessadas (status atual: {status_atual}).",
        )

    # Cooldown de 20 segundos contra clique duplo / envio duplicado acidental
    try:
        resp_ultimo = (
            supabase.table("rd_carteira_auditoria")
            .select("criado_em")
            .eq("residente_id", residente_id)
            .eq("acao", "reprocessamento_email")
            .eq("sucesso", True)
            .order("criado_em", desc=True)
            .limit(1)
            .execute()
        )
        if resp_ultimo.data:
            ultimo_dt = datetime.fromisoformat(str(resp_ultimo.data[0]["criado_em"]).replace("Z", "+00:00"))
            diff_seg = (datetime.now(timezone.utc) - ultimo_dt).total_seconds()
            if diff_seg < 20:
                raise HTTPException(
                    status_code=429,
                    detail="Um reprocessamento acabou de ser enviado para este residente. Aguarde alguns segundos antes de tentar novamente.",
                )
    except HTTPException:
        raise
    except Exception as e_cd:
        print(f"[COOLDOWN AVISO] {e_cd}")

    email_anterior = str(residente.get("email") or "").strip().lower()
    email_destino = email_anterior
    email_atualizado = False
    motivo = (payload.motivo or "").strip()[:300] or None

    if payload.email is not None and str(payload.email).strip():
        novo_email = _validar_email(payload.email)
        if novo_email != email_anterior:
            supabase.table("rd_residentes").update({"email": novo_email}).eq("id", residente_id).execute()
            email_destino = novo_email
            email_atualizado = True
            registrar_auditoria(
                residente_id=residente_id,
                acao="edicao_email",
                operador_user_id=operador.user_id,
                operador_email=operador.email,
                email_anterior=email_anterior,
                email_novo=novo_email,
                motivo=motivo or "Edição durante reprocessamento da carteira",
                sucesso=True,
            )

    if not email_destino or not EMAIL_REGEX.match(email_destino):
        raise HTTPException(status_code=400, detail="O residente não possui um e-mail válido cadastrado. Informe um e-mail antes de reenviar.")

    # Garante qrcode_token preenchido sem alterar status nem validade
    token_qr = residente.get("qrcode_token")
    if not token_qr:
        token_qr = str(uuid.uuid4())
        supabase.table("rd_residentes").update({"qrcode_token": token_qr}).eq("id", residente_id).execute()

    nome_membro = residente.get("nome_completo") or "Residente Oficial"
    dados_pdf = {
        "nome": nome_membro,
        "cpf": residente.get("cpf"),
        "data_nascimento": residente.get("data_nascimento") or "--/--/----",
        "foto_url": residente.get("foto_url"),
        "data_expiracao": residente.get("data_expiracao"),
    }

    try:
        pdf_bytes = gerar_pdf_carteira_bytes(dados_pdf, token_qr)
        filename = nome_arquivo_carteira(nome_membro, token_qr)
    except Exception as e_pdf:
        registrar_auditoria(
            residente_id=residente_id,
            acao="reprocessamento_email",
            operador_user_id=operador.user_id,
            operador_email=operador.email,
            email_anterior=email_anterior if email_atualizado else None,
            email_novo=email_destino,
            motivo=motivo,
            sucesso=False,
            erro_detalhe=f"Erro ao gerar PDF: {e_pdf}",
        )
        raise HTTPException(status_code=500, detail=f"Falha ao gerar o PDF da carteira: {e_pdf}")

    res_email = enviar_carteira_por_email_detalhado(
        email_destino=email_destino,
        nome_titular=nome_membro,
        anexos_memoria=[{"filename": filename, "content_bytes": pdf_bytes}],
    )

    registrar_auditoria(
        residente_id=residente_id,
        acao="reprocessamento_email",
        operador_user_id=operador.user_id,
        operador_email=operador.email,
        email_anterior=email_anterior if email_atualizado else None,
        email_novo=email_destino,
        motivo=motivo,
        sucesso=bool(res_email.get("ok")),
        resend_message_id=res_email.get("resend_id"),
        erro_detalhe=res_email.get("erro"),
        metadata={"email_atualizado": email_atualizado, "filename": filename},
    )

    if not res_email.get("ok"):
        prefixo = "O novo e-mail foi salvo, mas " if email_atualizado else ""
        raise HTTPException(
            status_code=502,
            detail=f"{prefixo}o envio pelo Resend falhou: {res_email.get('erro')}",
        )

    return {
        "sucesso": True,
        "email_atualizado": email_atualizado,
        "email_destino": email_destino,
        "resend_id": res_email.get("resend_id"),
        "mensagem": f"Carteira reprocessada e enviada com sucesso para {email_destino}.",
    }


@router.get("/{residente_id}/carteira-pdf")
async def baixar_ou_imprimir_carteira_pdf(
    residente_id: str,
    modo: Literal["download", "inline"] = Query("download"),
    operador: OperadorAutenticado = Depends(require_portal_admin),
):
    """
    Gera o PDF oficial da carteira no mesmo formato digital (135mm x 83mm) em memória
    para download local ou impressão presencial imediata.
    Bloqueado se o residente estiver em aguardando_pagamento (ou != ativo).
    """
    resp = supabase.table("rd_residentes").select("*").eq("id", residente_id).maybe_single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Residente não encontrado.")

    residente = resp.data
    status_atual = residente.get("status")

    if status_atual == "aguardando_pagamento":
        raise HTTPException(
            status_code=409,
            detail="Bloqueado: não é permitido baixar ou imprimir a carteira enquanto o pagamento estiver pendente.",
        )

    if status_atual != "ativo":
        raise HTTPException(
            status_code=409,
            detail=f"Bloqueado: apenas carteiras com status ATIVO podem ser baixadas ou impressas (status atual: {status_atual}).",
        )

    token_qr = residente.get("qrcode_token")
    if not token_qr:
        token_qr = str(uuid.uuid4())
        supabase.table("rd_residentes").update({"qrcode_token": token_qr}).eq("id", residente_id).execute()

    nome_membro = residente.get("nome_completo") or "Residente Oficial"
    dados_pdf = {
        "nome": nome_membro,
        "cpf": residente.get("cpf"),
        "data_nascimento": residente.get("data_nascimento") or "--/--/----",
        "foto_url": residente.get("foto_url"),
        "data_expiracao": residente.get("data_expiracao"),
    }

    try:
        pdf_bytes = gerar_pdf_carteira_bytes(dados_pdf, token_qr)
        filename = nome_arquivo_carteira(nome_membro, token_qr)
    except Exception as e_pdf:
        raise HTTPException(status_code=500, detail=f"Falha ao gerar PDF da carteira: {e_pdf}")

    acao_auditoria = "download_pdf" if modo == "download" else "impressao_presencial"
    registrar_auditoria(
        residente_id=residente_id,
        acao=acao_auditoria,
        operador_user_id=operador.user_id,
        operador_email=operador.email,
        sucesso=True,
        metadata={"modo": modo, "filename": filename},
    )

    disposition = "attachment" if modo == "download" else "inline"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'{disposition}; filename="{filename}"',
            "Cache-Control": "no-store, private",
        },
    )


@router.post("/verificar-expiracoes")
async def disparar_verificacao_expiracoes(
    dry_run: bool = Query(False),
    operador: OperadorAutenticado = Depends(require_cron_or_portal_admin),
):
    """
    Executa a rotina de verificação de validade (365 dias), desativação para 'expirado'
    e envio idempotente de aviso por e-mail ao titular (com lista de dependentes quando houver).
    Pode ser chamada manualmente pelo painel ou via Cron externo (header x-cron-secret).
    """
    try:
        return executar_rotina_expiracao_carteiras(
            dry_run=dry_run,
            operador_email=operador.email,
        )
    except Exception as e:
        print(f"[VERIFICAR EXPIRAÇÕES ERRO] {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao executar rotina de expiração: {e}")
