"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { jakarta, inter } from "@/lib/fonts";
import {
  Users, Search, X, Inbox, Clock, BadgeCheck, Circle,
  ChevronRight, AlertTriangle, RefreshCw, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { portalFetchJson } from "@/lib/portalApi";
import ResidenteDetalheDrawer from "@/components/portal/ResidenteDetalheDrawer";

// ─── PALETA ENTERPRISE ───
const INK = "#0A0E14";
const INK_2 = "#1F2937";
const MUTED = "#6B7280";
const SUBTLE = "#9CA3AF";
const LINE = "#E5E7EB";
const LINE_2 = "#F3F4F6";
const BG = "#FBFBFC";
const SURFACE = "#FFFFFF";
const SUCCESS = "#059669";
const WARNING = "#D97706";
const DANGER = "#DC2626";

const inputCls =
  "w-full bg-white text-[13.5px] rounded-md px-3 py-2.5 transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:outline-none border disabled:opacity-50 disabled:cursor-not-allowed";

// ─── ESTILO POR STATUS ───
const STATUS_MAP: Record<
  string,
  { cor: string; bg: string; border: string; icone: any; label: string }
> = {
  ativo: {
    cor: SUCCESS,
    bg: "#ECFDF5",
    border: "#D1FAE5",
    icone: BadgeCheck,
    label: "Ativo",
  },
  aguardando_pagamento: {
    cor: WARNING,
    bg: "#FFFBEB",
    border: "#FEF3C7",
    icone: Clock,
    label: "Aguardando pagamento",
  },
  expirado: {
    cor: DANGER,
    bg: "#FEF2F2",
    border: "#FEE2E2",
    icone: AlertTriangle,
    label: "Expirado",
  },
  inativo: {
    cor: MUTED,
    bg: LINE_2,
    border: LINE,
    icone: Circle,
    label: "Inativo",
  },
};

function getStatusInfo(status: string) {
  return STATUS_MAP[status] || STATUS_MAP.inativo;
}

function iniciaisDeNome(nome: string) {
  return (nome || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";
}

// ═══════════════════════════════════════════════════════════════
// ESTILOS GLOBAIS
// ═══════════════════════════════════════════════════════════════

function GlobalStyles() {
  return (
    <style jsx global>{`
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .anim-fade-up { animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .anim-fade { animation: fadeIn 0.2s ease both; }
      .num { font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
      .skeleton {
        background: linear-gradient(90deg, ${LINE_2} 0%, ${LINE} 50%, ${LINE_2} 100%);
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
      }
      .scroll-thin::-webkit-scrollbar { width: 6px; height: 6px; }
      .scroll-thin::-webkit-scrollbar-track { background: transparent; }
      .scroll-thin::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
      .scroll-thin::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════════
// ÁTOMOS
// ═══════════════════════════════════════════════════════════════

function Panel({ children, className = "", noPad = false }: {
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}) {
  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`} style={{ borderColor: LINE }}>
      {noPad ? children : <div className="p-5">{children}</div>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const info = getStatusInfo(status);
  const Icone = info.icone;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
      style={{
        background: info.bg,
        color: info.cor,
        border: `1px solid ${info.border}`,
      }}
    >
      <Icone size={9} />
      {info.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA
// ═══════════════════════════════════════════════════════════════

export default function PortalResidentes() {
  const [residentes, setResidentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarga, setErroCarga] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"Todos" | "ativo" | "aguardando_pagamento" | "expirado">("Todos");
  const [residenteSelecionadoId, setResidenteSelecionadoId] = useState<string | null>(null);
  const [verificandoExpiracoes, setVerificandoExpiracoes] = useState(false);
  const [msgRotina, setMsgRotina] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);

  const fetchResidentes = useCallback(async () => {
    setLoading(true);
    setErroCarga("");
    try {
      const resp = await portalFetchJson("/api/v1/admin/residentes?limit=2000");
      setResidentes(resp.dados || []);
    } catch (error: any) {
      console.error("Erro ao carregar residentes:", error);
      setErroCarga(error.message || "Falha ao carregar a lista de residentes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResidentes(); }, [fetchResidentes]);

  async function handleVerificarExpiracoes() {
    if (!confirm("Executar agora a verificação de carteiras com mais de 365 dias (desativar vencidas e avisar titulares por e-mail)?")) {
      return;
    }
    setVerificandoExpiracoes(true);
    setMsgRotina(null);
    try {
      const resp = await portalFetchJson("/api/v1/admin/residentes/verificar-expiracoes", {
        method: "POST",
      });
      setMsgRotina({
        tipo: "success",
        texto: `Verificação concluída: ${resp.carteiras_desativadas || 0} carteira(s) desativada(s) e ${resp.familias_notificadas || 0} e-mail(s) de aviso enviado(s).`,
      });
      await fetchResidentes();
    } catch (err: any) {
      setMsgRotina({ tipo: "error", texto: err.message || "Erro ao executar verificação de vencimentos." });
    } finally {
      setVerificandoExpiracoes(false);
    }
  }

  const contadores = useMemo(() => ({
    total: residentes.length,
    ativos: residentes.filter((r) => r.status === "ativo").length,
    aguardando: residentes.filter((r) => r.status === "aguardando_pagamento").length,
    expirados: residentes.filter((r) => r.status === "expirado").length,
  }), [residentes]);

  const residentesFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    const termoDigitos = termo.replace(/\D/g, "");
    return residentes.filter((r) => {
      const passaStatus = filtroStatus === "Todos" || r.status === filtroStatus;
      const cpfDigitos = String(r.cpf || "").replace(/\D/g, "");
      const passaBusca =
        !termo ||
        r.nome_completo?.toLowerCase().includes(termo) ||
        r.cpf?.toLowerCase().includes(termo) ||
        (termoDigitos.length >= 3 && cpfDigitos.includes(termoDigitos)) ||
        r.email?.toLowerCase().includes(termo);
      return passaStatus && passaBusca;
    });
  }, [residentes, busca, filtroStatus]);

  const temFiltro = busca || filtroStatus !== "Todos";

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-4`}>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* HEADER                                                      */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 anim-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                style={{ background: INK, color: "#FFF" }}
              >
                <Users size={9} strokeWidth={3} />
                Base de dados
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {residentes.length} residente{residentes.length !== 1 ? "s" : ""} · {contadores.ativos} ativos
              </span>
            </div>
            <h1
              className={`${jakarta.className} text-[26px] font-bold tracking-tight`}
              style={{ color: INK, letterSpacing: "-0.025em" }}
            >
              Residentes
            </h1>
            <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
              Clique em qualquer residente para ver detalhes da carteira, editar e-mail, reprocessar, baixar ou imprimir.
            </p>
          </div>

          {/* Ações do header */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={handleVerificarExpiracoes}
              disabled={verificandoExpiracoes}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-[12px] font-semibold transition-colors disabled:opacity-50"
              style={{ borderColor: LINE, background: SURFACE, color: INK_2 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}
              title="Rotina automática a cada 24h — clique para rodar manualmente agora"
            >
              {verificandoExpiracoes ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
              Verificar vencimentos
            </button>

            <button
              onClick={fetchResidentes}
              disabled={loading}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-[12px] font-semibold transition-colors disabled:opacity-50"
              style={{ borderColor: LINE, background: SURFACE, color: INK }}
              onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>
        </div>

        {erroCarga && (
          <div
            className="rounded-md p-3.5 border flex items-start gap-2.5 text-[12.5px]"
            style={{ background: "#FEF2F2", borderColor: "#FEE2E2", color: DANGER }}
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <p className="font-medium">{erroCarga}</p>
          </div>
        )}

        {msgRotina && (
          <div
            className="rounded-md p-3.5 border flex items-start gap-2.5 text-[12.5px]"
            style={
              msgRotina.tipo === "success"
                ? { background: "#ECFDF5", borderColor: "#D1FAE5", color: SUCCESS }
                : { background: "#FEF2F2", borderColor: "#FEE2E2", color: DANGER }
            }
          >
            {msgRotina.tipo === "success" ? (
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
            )}
            <p className="font-medium">{msgRotina.texto}</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* KPIs — strip horizontal                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {residentes.length > 0 && (
          <Panel noPad className="anim-fade-up">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0" style={{ borderColor: LINE }}>
              {[
                { label: "Total", valor: contadores.total, unit: "registrados" },
                { label: "Ativos", valor: contadores.ativos, unit: "carteiras válidas" },
                { label: "Aguardando", valor: contadores.aguardando, unit: "pendentes de pagamento" },
                { label: "Expirados", valor: contadores.expirados, unit: "acima de 1 ano" },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="px-4 py-3.5 hover:bg-[#FAFAFB] transition-colors"
                  style={{ borderColor: LINE }}
                >
                  <p
                    className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: MUTED }}
                  >
                    {kpi.label}
                  </p>
                  <p
                    className={`${jakarta.className} num text-[26px] font-bold leading-none mt-2`}
                    style={{ color: INK, letterSpacing: "-0.025em" }}
                  >
                    {kpi.valor}
                  </p>
                  <p className="text-[10.5px] mt-1.5" style={{ color: SUBTLE }}>
                    {kpi.unit}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FILTROS                                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {residentes.length > 0 && (
          <Panel noPad className="anim-fade-up">
            <div className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: SUBTLE }}
                />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou e-mail..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className={`${inputCls} pl-9 pr-9`}
                  style={{ borderColor: LINE }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = INK;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = LINE;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                {busca && (
                  <button
                    onClick={() => setBusca("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center transition-colors"
                    style={{ color: SUBTLE }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    aria-label="Limpar busca"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as any)}
                className="h-10 px-3 rounded-md text-[12.5px] font-medium border transition-colors cursor-pointer w-full sm:w-auto"
                style={{ borderColor: LINE, color: INK, background: SURFACE }}
              >
                <option value="Todos">Todos os status</option>
                <option value="ativo">Ativos</option>
                <option value="aguardando_pagamento">Aguardando pagamento</option>
                <option value="expirado">Expirados</option>
              </select>

              {temFiltro && (
                <button
                  onClick={() => {
                    setBusca("");
                    setFiltroStatus("Todos");
                  }}
                  className="h-10 px-3 rounded-md text-[12px] font-semibold border transition-colors whitespace-nowrap"
                  style={{ borderColor: LINE, color: INK_2, background: SURFACE }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}
                >
                  Limpar
                </button>
              )}
            </div>

            {temFiltro && (
              <div
                className="px-4 py-2 border-t text-center"
                style={{ borderColor: LINE, background: BG }}
              >
                <p className="text-[11px] num" style={{ color: MUTED }}>
                  <strong style={{ color: INK }}>{residentesFiltrados.length}</strong> de{" "}
                  <strong style={{ color: INK }}>{residentes.length}</strong> residentes
                </p>
              </div>
            )}
          </Panel>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TABELA                                                      */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {loading ? (
          <Panel noPad>
            <div className="divide-y" style={{ borderColor: LINE_2 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-16 skeleton" />
              ))}
            </div>
          </Panel>
        ) : residentesFiltrados.length === 0 ? (
          <Panel noPad className="anim-fade">
            <div className="py-16 text-center">
              <div
                className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                style={{ background: LINE_2, color: MUTED }}
              >
                {temFiltro ? <Search size={20} strokeWidth={2} /> : <Inbox size={20} strokeWidth={2} />}
              </div>
              <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                {temFiltro ? "Nenhum resultado" : "Nenhum residente registrado"}
              </p>
              <p className="text-[11.5px] mt-1 max-w-md mx-auto" style={{ color: MUTED }}>
                {temFiltro
                  ? "Ajuste os filtros ou a busca para encontrar residentes."
                  : "Os cidadãos registrados aparecerão aqui."}
              </p>
              {temFiltro && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setBusca("");
                      setFiltroStatus("Todos");
                    }}
                    className="h-9 px-3 rounded-md text-[12.5px] font-semibold text-white transition-colors"
                    style={{ background: INK }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          </Panel>
        ) : (
          <Panel noPad className="anim-fade-up">
            {/* Header da tabela */}
            <div
              className="hidden md:grid grid-cols-[40px_2fr_1fr_1.4fr_1fr_20px] items-center gap-4 px-5 py-2.5 border-b"
              style={{ borderColor: LINE, background: BG }}
            >
              <span />
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: MUTED }}
              >
                Nome
              </span>
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: MUTED }}
              >
                CPF
              </span>
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: MUTED }}
              >
                E-mail
              </span>
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: MUTED }}
              >
                Status
              </span>
              <span />
            </div>

            {/* Linhas */}
            <div className="divide-y" style={{ borderColor: LINE_2 }}>
              {residentesFiltrados.map((res, idx) => (
                <button
                  type="button"
                  key={res.id}
                  onClick={() => setResidenteSelecionadoId(res.id)}
                  style={{ animationDelay: `${Math.min(idx, 20) * 15}ms` }}
                  className="w-full text-left grid grid-cols-[40px_1fr_auto] md:grid-cols-[40px_2fr_1fr_1.4fr_1fr_20px] items-center gap-4 px-5 py-3 hover:bg-[#FAFAFB] transition-colors anim-fade-up group cursor-pointer"
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
                    style={{ background: INK }}
                  >
                    {iniciaisDeNome(res.nome_completo)}
                  </div>

                  {/* Nome */}
                  <div className="min-w-0">
                    <p
                      className={`${jakarta.className} text-[13.5px] font-bold leading-snug truncate`}
                      style={{ color: INK }}
                    >
                      {res.nome_completo}
                    </p>
                    <p
                      className="md:hidden text-[11px] truncate mt-0.5 num"
                      style={{ color: MUTED }}
                    >
                      {res.cpf} · {res.email}
                    </p>
                  </div>

                  {/* CPF */}
                  <p
                    className="hidden md:block text-[12.5px] font-medium num truncate"
                    style={{ color: INK_2 }}
                  >
                    {res.cpf}
                  </p>

                  {/* Email */}
                  <p
                    className="hidden md:block text-[12.5px] font-medium truncate"
                    style={{ color: MUTED }}
                  >
                    {res.email}
                  </p>

                  {/* Status */}
                  <div className="hidden md:block">
                    <StatusPill status={res.status} />
                  </div>

                  {/* Status mobile */}
                  <div className="md:hidden">
                    <StatusPill status={res.status} />
                  </div>

                  {/* Seta */}
                  <ChevronRight
                    size={14}
                    className="hidden md:block shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                    style={{ color: SUBTLE }}
                  />
                </button>
              ))}
            </div>
          </Panel>
        )}
      </div>

      <ResidenteDetalheDrawer
        residenteId={residenteSelecionadoId}
        onClose={() => setResidenteSelecionadoId(null)}
        onSelectResidente={(id) => setResidenteSelecionadoId(id)}
        onUpdated={fetchResidentes}
      />
    </>
  );
}