"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Users, Loader2, Sparkles, User, IdCard, Mail, Search, X,
  Filter, Inbox, CheckCircle2, Clock, AlertTriangle, BadgeCheck,
  Circle, Target, Layers, Users2, ShieldCheck, FileText,
} from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── CORES (paleta Azure/Microsoft) ───
const AZUL = "#0078D4";
const AZUL_ESCURO = "#005A9E";
const AMBAR = "#DAA520";
const AMBAR_LIGHT = "#FBBF24";
const VERMELHO = "#D13438";
const VERDE = "#168821";
const VERDE_LIGHT = "#22C55E";
const ROXO = "#7C3AED";

const inputCls =
  "w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-[#0078D4] focus:ring-4 focus:ring-[#0078D4]/10 transition-all placeholder:text-slate-400";

// ─── ESTILO POR STATUS ───
const STATUS_INFO: Record<
  string,
  { cor: string; gradient: string; icone: any; label: string }
> = {
  ativo: {
    cor: AZUL,
    gradient: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
    icone: BadgeCheck,
    label: "Ativo",
  },
  aguardando_pagamento: {
    cor: AMBAR,
    gradient: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
    icone: Clock,
    label: "Aguardando pagamento",
  },
  inativo: {
    cor: "#64748B",
    gradient: `linear-gradient(135deg, #64748B, #94A3B8)`,
    icone: Circle,
    label: "Inativo",
  },
};

function getStatusInfo(status: string) {
  return STATUS_INFO[status] || STATUS_INFO.inativo;
}

// ═══════════════════════════════════════════════════════════════
// ESTILOS GLOBAIS
// ═══════════════════════════════════════════════════════════════

function GlobalStyles() {
  return (
    <style jsx global>{`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes pulseDot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.85); }
      }
      .anim-fade-up { animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .anim-fade { animation: fadeIn 0.25s ease both; }
      .pulse-dot { animation: pulseDot 1.8s ease-in-out infinite; }
      .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
      .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
      .scrollbar-thin::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
      .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: string }) {
  const info = getStatusInfo(status);
  const Icone = info.icone;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border"
      style={{
        background: `${info.cor}10`,
        color: info.cor,
        borderColor: `${info.cor}25`,
      }}
    >
      <Icone size={10} />
      {info.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function PortalResidentes() {
  const [residentes, setResidentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "Todos" | "ativo" | "aguardando_pagamento"
  >("Todos");

  useEffect(() => {
    fetchResidentes();
  }, []);

  async function fetchResidentes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("rd_residentes")
      .select("id, nome_completo, cpf, email, status")
      .order("criado_at", { ascending: false });

    if (!error && data) {
      setResidentes(data);
    } else if (error) {
      console.error("Erro ao carregar residentes:", error.message);
    }
    setLoading(false);
  }

  // ─── CONTADORES ───
  const contadores = useMemo(() => {
    return {
      total: residentes.length,
      ativos: residentes.filter((r) => r.status === "ativo").length,
      aguardando: residentes.filter((r) => r.status === "aguardando_pagamento")
        .length,
    };
  }, [residentes]);

  // ─── FILTRO ───
  const residentesFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return residentes.filter((r) => {
      const passaStatus =
        filtroStatus === "Todos" || r.status === filtroStatus;
      const passaBusca =
        !termo ||
        r.nome_completo?.toLowerCase().includes(termo) ||
        r.cpf?.toLowerCase().includes(termo) ||
        r.email?.toLowerCase().includes(termo);
      return passaStatus && passaBusca;
    });
  }, [residentes, busca, filtroStatus]);

  const temFiltro = busca || filtroStatus !== "Todos";

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-6`}>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* CABEÇALHO                                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 anim-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
            </div>
            <h1 className={`${jakarta.className} text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight`}>
              Base de residentes
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
              <Sparkles size={14} style={{ color: VERMELHO }} />
              Listagem completa dos cidadãos registrados na base de dados.
            </p>
          </div>

          {/* Badge de total */}
          <div
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border shadow-sm"
            style={{
              background: loading
                ? "white"
                : `linear-gradient(135deg, ${VERDE}08, ${VERDE}02)`,
              borderColor: loading ? "#E2E8F0" : `${VERDE}30`,
            }}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" style={{ color: AZUL }} />
            ) : (
              <div className="relative">
                <Users size={14} style={{ color: VERDE }} />
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full pulse-dot"
                  style={{ background: VERDE_LIGHT }}
                />
              </div>
            )}
            <span
              className={`${jakarta.className} text-xs font-bold`}
              style={{ color: loading ? "#64748B" : VERDE }}
            >
              {loading
                ? "Carregando..."
                : `${residentes.length} residente${residentes.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* KPIs                                                        */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {residentes.length > 0 && (
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 anim-fade-up"
            style={{ animationDelay: "60ms" }}
          >
            {/* Total */}
            <div className="relative bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{
                  background: `linear-gradient(90deg, ${ROXO}, #A78BFA)`,
                }}
              />
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${ROXO}, #A78BFA)`,
                  }}
                >
                  <Layers size={14} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-tight">
                  Total
                </span>
              </div>
              <p
                className={`${jakarta.className} text-3xl font-extrabold leading-none tracking-tight`}
                style={{ color: ROXO }}
              >
                {contadores.total}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                residentes registrados
              </p>
            </div>

            {/* Ativos */}
            <div className="relative bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{
                  background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})`,
                }}
              />
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                  }}
                >
                  <BadgeCheck size={14} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-tight">
                  Ativos
                </span>
              </div>
              <p
                className={`${jakarta.className} text-3xl font-extrabold leading-none tracking-tight`}
                style={{ color: contadores.ativos > 0 ? AZUL : "#94A3B8" }}
              >
                {contadores.ativos}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                carteiras emitidas
              </p>
            </div>

            {/* Aguardando */}
            <div className="relative bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{
                  background: `linear-gradient(90deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                }}
              />
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                  }}
                >
                  <Clock size={14} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-tight">
                  Aguardando
                </span>
              </div>
              <p
                className={`${jakarta.className} text-3xl font-extrabold leading-none tracking-tight`}
                style={{
                  color: contadores.aguardando > 0 ? AMBAR : "#94A3B8",
                }}
              >
                {contadores.aguardando}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                pendentes de pagamento
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BUSCA + FILTRO                                              */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {residentes.length > 0 && (
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm anim-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${AZUL}10`, color: AZUL }}
                >
                  <Filter size={14} />
                </div>
                <p className="text-xs text-slate-500">
                  Mostrando{" "}
                  <strong className="text-slate-800 font-bold">
                    {residentesFiltrados.length}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-slate-800 font-bold">
                    {residentes.length}
                  </strong>{" "}
                  residente(s)
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:bg-white focus:border-[#0078D4] focus:ring-4 focus:ring-[#0078D4]/10 transition-all cursor-pointer"
                >
                  <option value="Todos">Todos os status</option>
                  <option value="ativo">Ativos</option>
                  <option value="aguardando_pagamento">Aguardando pagamento</option>
                </select>

                <div className="relative flex-1 sm:w-80">
                  <Search
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Buscar nome, CPF ou e-mail..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className={`${inputCls} pl-10 pr-9 text-xs py-2.5`}
                  />
                  {busca && (
                    <button
                      onClick={() => setBusca("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {temFiltro && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => {
                    setBusca("");
                    setFiltroStatus("Todos");
                  }}
                  className="text-[11px] font-bold hover:underline transition-colors flex items-center gap-1"
                  style={{ color: AZUL }}
                >
                  <X size={11} /> Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* LISTA                                                       */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {loading ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl py-24 flex flex-col items-center gap-3 anim-fade">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
            >
              <Loader2 size={22} className="animate-spin" />
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Carregando residentes...
            </p>
          </div>
        ) : residentesFiltrados.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl py-20 text-center shadow-sm anim-fade">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-white"
              style={{
                background: temFiltro
                  ? `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`
                  : `linear-gradient(135deg, ${VERMELHO}, #F87171)`,
              }}
            >
              {temFiltro ? <Search size={28} /> : <Inbox size={28} />}
            </div>
            <h3 className={`${jakarta.className} text-lg font-bold text-slate-800 mb-1.5`}>
              {temFiltro ? "Nenhum resultado" : "Nenhum residente registrado"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-5">
              {temFiltro
                ? "Ajuste os filtros ou a busca para encontrar residentes."
                : "Os cidadãos registrados aparecerão aqui."}
            </p>
            {temFiltro && (
              <button
                onClick={() => {
                  setBusca("");
                  setFiltroStatus("Todos");
                }}
                className={`${jakarta.className} text-[11px] font-bold px-4 py-2 rounded-xl text-white shadow-sm hover:shadow-md transition-all`}
                style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {residentesFiltrados.map((res, idx) => {
              const statusInfo = getStatusInfo(res.status);
              const iniciais = (res.nome_completo || "?")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((n: string) => n[0])
                .join("")
                .toUpperCase();

              return (
                <article
                  key={res.id}
                  style={{ animationDelay: `${180 + idx * 25}ms` }}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 anim-fade-up group"
                >
                  <div
                    className="h-0.5"
                    style={{ background: statusInfo.gradient }}
                  />

                  <div className="p-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-105"
                      style={{ background: statusInfo.gradient }}
                    >
                      {iniciais}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <StatusBadge status={res.status} />
                      </div>

                      <h3
                        className={`${jakarta.className} text-sm font-bold text-slate-900 truncate mb-1.5`}
                      >
                        {res.nome_completo}
                      </h3>

                      <div className="space-y-1">
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                          <IdCard size={10} className="text-slate-400 shrink-0" />
                          <span className="font-mono">{res.cpf}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                          <Mail size={10} className="text-slate-400 shrink-0" />
                          {res.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}