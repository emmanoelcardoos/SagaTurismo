"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Users, Plus, Loader2, Save, ArrowLeft, FileText,
  Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle,
  XCircle, Hash, Pencil, Trash2, Inbox, Search, X,
  Target, Eye, Info,
} from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── PALETA ENTERPRISE ───
const INK = "#0A0E14";
const INK_2 = "#1F2937";
const MUTED = "#6B7280";
const SUBTLE = "#9CA3AF";
const LINE = "#E5E7EB";
const LINE_2 = "#F3F4F6";
const BG = "#FBFBFC";
const SURFACE = "#FFFFFF";
const ACCENT = "#2563EB";
const SUCCESS = "#059669";
const WARNING = "#D97706";
const DANGER = "#DC2626";

const inputCls =
  "w-full bg-white text-[13.5px] rounded-md px-3 py-2.5 transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:outline-none border disabled:opacity-50 disabled:cursor-not-allowed";

function fmtData(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function fmtDataCurta(iso: string) {
  if (!iso) return { dia: "--", mes: "---", ano: "----" };
  const [y, m, d] = iso.split("-");
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return { dia: d, mes: meses[parseInt(m) - 1] || "---", ano: y };
}

// ─── ESTILO POR STATUS ───
const STATUS_MAP: Record<
  string,
  { cor: string; bg: string; border: string; icone: any; label: string }
> = {
  Realizada: {
    cor: SUCCESS,
    bg: "#ECFDF5",
    border: "#D1FAE5",
    icone: CheckCircle2,
    label: "Realizada",
  },
  Agendada: {
    cor: WARNING,
    bg: "#FFFBEB",
    border: "#FEF3C7",
    icone: Clock,
    label: "Agendada",
  },
  Cancelada: {
    cor: DANGER,
    bg: "#FEF2F2",
    border: "#FEE2E2",
    icone: XCircle,
    label: "Cancelada",
  },
};

function getStatusInfo(status: string) {
  return STATUS_MAP[status] || STATUS_MAP.Agendada;
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

function PanelHeader({ title, subtitle, action, badge }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="px-5 py-3.5 flex items-center justify-between gap-3 border-b"
      style={{ borderColor: LINE, background: BG }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
            {title}
          </h3>
          {badge}
        </div>
        {subtitle && (
          <p className="text-[11.5px] mt-0.5" style={{ color: MUTED }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function FormField({ label, icon, required, hint, children, className = "" }: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1.5"
        style={{ color: MUTED }}
      >
        {icon}
        {label}
        {required && <span style={{ color: DANGER }}>*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[10.5px] mt-1.5 leading-relaxed flex items-start gap-1.5" style={{ color: SUBTLE }}>
          <Info size={11} className="mt-0.5 shrink-0" />
          {hint}
        </p>
      )}
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

export default function PortalReunioesComtur() {
  const [reunioes, setReunioes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"Todos" | "Agendada" | "Realizada" | "Cancelada">("Todos");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => { fetchReunioes(); }, []);

  async function fetchReunioes() {
    setLoading(true);
    const { data } = await supabase
      .from("reunioes_comtur")
      .select("*")
      .order("criado_em", { ascending: false });
    setReunioes(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null);
    setForm({ mes_ano: "", ordem_reuniao: "", data_reuniao: "", status: "Agendada" });
    setFeedback("");
    setShowForm(true);
  }

  function abrirFormEditar(r: any) {
    setEditando(r);
    setForm({ ...r });
    setFeedback("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.mes_ano || !form.ordem_reuniao) {
      setFeedback("Mês/Ano e Ordem são obrigatórios.");
      return;
    }
    setSaving(true);

    try {
      if (editando) {
        await supabase.from("reunioes_comtur").update(form).eq("id", editando.id);
      } else {
        await supabase.from("reunioes_comtur").insert(form);
      }

      setFeedback("Reunião salva com sucesso.");
      setTimeout(() => {
        setShowForm(false);
        setSaving(false);
        fetchReunioes();
        setFeedback("");
      }, 1500);
    } catch (err: any) {
      setFeedback(`Erro ao salvar: ${err.message}`);
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este registro da Reunião?")) return;
    await supabase.from("reunioes_comtur").delete().eq("id", id);
    fetchReunioes();
  }

  // ─── CONTADORES ───
  const contadores = useMemo(() => ({
    total: reunioes.length,
    agendadas: reunioes.filter((r) => r.status === "Agendada").length,
    realizadas: reunioes.filter((r) => r.status === "Realizada").length,
    canceladas: reunioes.filter((r) => r.status === "Cancelada").length,
  }), [reunioes]);

  // ─── FILTRO ───
  const reunioesFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return reunioes.filter((r) => {
      const passaStatus = filtroStatus === "Todos" || r.status === filtroStatus;
      const passaBusca =
        !termo ||
        r.mes_ano?.toLowerCase().includes(termo) ||
        r.ordem_reuniao?.toLowerCase().includes(termo);
      return passaStatus && passaBusca;
    });
  }, [reunioes, busca, filtroStatus]);

  const temFiltro = busca || filtroStatus !== "Todos";

  // ═══════════════════════════════════════════════════════════════
  // FORMULÁRIO
  // ═══════════════════════════════════════════════════════════════

  if (showForm) {
    return (
      <>
        <GlobalStyles />
        <div className={`${inter.className} space-y-4 max-w-4xl mx-auto`}>

          {/* Header */}
          <div className="flex items-center gap-3 anim-fade-up">
            <button
              onClick={() => setShowForm(false)}
              className="w-9 h-9 rounded-md flex items-center justify-center transition-colors shrink-0 border"
              style={{ borderColor: LINE, color: MUTED, background: SURFACE }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = LINE_2;
                e.currentTarget.style.color = INK;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = SURFACE;
                e.currentTarget.style.color = MUTED;
              }}
              aria-label="Voltar"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                  style={{ background: INK, color: "#FFF" }}
                >
                  <Users size={9} strokeWidth={3} />
                  COMTUR
                </span>
                <span className="text-[11px]" style={{ color: MUTED }}>
                  {editando ? "Editar registro" : "Nova reunião"}
                </span>
              </div>
              <h1
                className={`${jakarta.className} text-[22px] font-bold tracking-tight truncate`}
                style={{ color: INK, letterSpacing: "-0.02em" }}
              >
                {editando ? editando.ordem_reuniao : "Registrar reunião"}
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowForm(false)}
                className="hidden sm:inline-flex h-9 px-3 rounded-md text-[12.5px] font-semibold items-center border transition-colors"
                style={{ borderColor: LINE, color: INK_2, background: SURFACE }}
                onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors disabled:opacity-50"
                style={{ background: INK }}
                onMouseEnter={(e) => !saving && (e.currentTarget.style.background = INK_2)}
                onMouseLeave={(e) => !saving && (e.currentTarget.style.background = INK)}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? "Salvando..." : editando ? "Salvar" : "Registrar"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Coluna principal */}
            <div className="lg:col-span-8 space-y-4">
              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Referência" subtitle="Mês, ano e ordem da reunião" />
                <div className="p-5 space-y-4">
                  <FormField label="Mês / ano de referência" icon={<CalendarIcon size={10} />} required>
                    <input
                      value={form.mes_ano || ""}
                      onChange={(e) => setForm({ ...form, mes_ano: e.target.value })}
                      className={inputCls}
                      style={{ borderColor: LINE }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = INK;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = LINE;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="Ex: Janeiro 2026"
                    />
                  </FormField>

                  <FormField
                    label="Ordem da reunião"
                    icon={<Hash size={10} />}
                    required
                    hint="Identifica a numeração oficial da reunião."
                  >
                    <input
                      value={form.ordem_reuniao || ""}
                      onChange={(e) => setForm({ ...form, ordem_reuniao: e.target.value })}
                      className={inputCls}
                      style={{ borderColor: LINE }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = INK;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = LINE;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="Ex: 1ª Reunião Ordinária"
                    />
                  </FormField>
                </div>
              </Panel>

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Agendamento" subtitle="Data e estado atual" />
                <div className="p-5 grid grid-cols-2 gap-4">
                  <FormField label="Data da reunião" icon={<CalendarIcon size={10} />}>
                    <input
                      type="date"
                      value={form.data_reuniao || ""}
                      onChange={(e) => setForm({ ...form, data_reuniao: e.target.value })}
                      className={inputCls}
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
                  </FormField>

                  <FormField label="Status atual" icon={<Target size={10} />}>
                    <select
                      value={form.status || "Agendada"}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className={inputCls}
                      style={{ borderColor: LINE }}
                    >
                      <option value="Agendada">Agendada</option>
                      <option value="Realizada">Realizada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </FormField>
                </div>
              </Panel>
            </div>

            {/* Lateral */}
            <div className="lg:col-span-4 space-y-4">
              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Pré-visualização" subtitle="Como aparece na lista" />

                {/* Preview real do cartão */}
                <div className="p-5">
                  <div
                    className="rounded-lg overflow-hidden border"
                    style={{ borderColor: LINE, background: BG }}
                  >
                    {/* Faixa de estado */}
                    <div
                      className="h-1"
                      style={{
                        background: getStatusInfo(form.status || "Agendada").cor,
                      }}
                    />

                    <div className="p-4 flex items-start gap-3">
                      {/* Bloco de data */}
                      {(() => {
                        const { dia, mes, ano } = fmtDataCurta(form.data_reuniao);
                        return (
                          <div
                            className="w-12 h-12 rounded-md flex flex-col items-center justify-center shrink-0 text-white"
                            style={{ background: INK }}
                          >
                            <span className="text-[8.5px] font-bold tracking-wider leading-none mb-0.5 opacity-80">
                              {mes.toUpperCase()}
                            </span>
                            <span className={`${jakarta.className} num text-[15px] font-bold leading-none`}>
                              {dia}
                            </span>
                            <span className="text-[8.5px] font-semibold leading-none mt-0.5 opacity-70 num">
                              {ano}
                            </span>
                          </div>
                        );
                      })()}

                      <div className="min-w-0 flex-1">
                        <StatusPill status={form.status || "Agendada"} />
                        <p
                          className={`${jakarta.className} text-[13px] font-bold leading-snug line-clamp-2 mt-1.5 mb-0.5`}
                          style={{ color: INK }}
                        >
                          {form.mes_ano || "Mês de referência"}
                        </p>
                        <p className="text-[11px] truncate num" style={{ color: MUTED }}>
                          {form.ordem_reuniao || "Ordem não definida"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10.5px] mt-3 leading-relaxed" style={{ color: SUBTLE }}>
                    Este é o aspeto do registro na lista pública.
                  </p>
                </div>
              </Panel>

              {feedback && (
                <div
                  className="rounded-lg border p-3.5 flex items-start gap-3 anim-fade-up"
                  style={{
                    background: feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro")
                      ? "#FEF2F2"
                      : feedback.toLowerCase().includes("sucesso")
                      ? "#ECFDF5"
                      : "#EFF6FF",
                    borderColor: feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro")
                      ? "#FEE2E2"
                      : feedback.toLowerCase().includes("sucesso")
                      ? "#D1FAE5"
                      : "#DBEAFE",
                    color: feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro")
                      ? DANGER
                      : feedback.toLowerCase().includes("sucesso")
                      ? SUCCESS
                      : ACCENT,
                  }}
                >
                  {feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro") ? (
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  ) : feedback.toLowerCase().includes("sucesso") ? (
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 size={14} className="shrink-0 mt-0.5 animate-spin" />
                  )}
                  <p className="text-[12.5px] font-medium">{feedback}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // LISTA
  // ═══════════════════════════════════════════════════════════════

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-4`}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 anim-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                style={{ background: INK, color: "#FFF" }}
              >
                <Users size={9} strokeWidth={3} />
                COMTUR
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {reunioes.length} reunião{reunioes.length !== 1 ? "ões" : ""}
              </span>
            </div>
            <h1
              className={`${jakarta.className} text-[26px] font-bold tracking-tight`}
              style={{ color: INK, letterSpacing: "-0.025em" }}
            >
              Reuniões COMTUR
            </h1>
            <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
              Registro público das reuniões do Conselho Municipal de Turismo.
            </p>
          </div>

          <button
            onClick={abrirFormNovo}
            className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 text-white transition-colors self-start sm:self-auto shrink-0"
            style={{ background: INK }}
            onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
            onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
          >
            <Plus size={14} strokeWidth={3} />
            Registrar reunião
          </button>
        </div>

        {/* KPIs — strip horizontal compacta */}
        {reunioes.length > 0 && (
          <Panel noPad className="anim-fade-up">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x" style={{ borderColor: LINE }}>
              {[
                { label: "Total", valor: contadores.total, unit: "registros", href: undefined },
                { label: "Agendadas", valor: contadores.agendadas, unit: "por realizar", href: undefined },
                { label: "Realizadas", valor: contadores.realizadas, unit: "concluídas", href: undefined },
                { label: "Canceladas", valor: contadores.canceladas, unit: "sem efeito", href: undefined },
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

        {/* Filtros */}
        {reunioes.length > 0 && (
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
                  placeholder="Buscar por mês ou ordem..."
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
                <option value="Todos">Todos os estados</option>
                <option value="Agendada">Agendadas</option>
                <option value="Realizada">Realizadas</option>
                <option value="Cancelada">Canceladas</option>
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
                  <strong style={{ color: INK }}>{reunioesFiltradas.length}</strong> de{" "}
                  <strong style={{ color: INK }}>{reunioes.length}</strong> reuniões
                </p>
              </div>
            )}
          </Panel>
        )}

        {/* Lista */}
        {loading ? (
          <Panel noPad>
            <div className="divide-y" style={{ borderColor: LINE_2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 skeleton" />
              ))}
            </div>
          </Panel>
        ) : reunioesFiltradas.length === 0 ? (
          <Panel noPad className="anim-fade">
            <div className="py-16 text-center">
              <div
                className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                style={{ background: LINE_2, color: MUTED }}
              >
                {temFiltro ? <Search size={20} strokeWidth={2} /> : <Inbox size={20} strokeWidth={2} />}
              </div>
              <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                {temFiltro ? "Nenhum resultado" : "Sem reuniões registradas"}
              </p>
              <p className="text-[11.5px] mt-1 max-w-md mx-auto" style={{ color: MUTED }}>
                {temFiltro
                  ? "Ajuste os filtros ou a busca para encontrar reuniões."
                  : "Registre a primeira reunião do COMTUR para aparecer no portal."}
              </p>
              <div className="mt-4">
                {temFiltro ? (
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
                ) : (
                  <button
                    onClick={abrirFormNovo}
                    className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white transition-colors"
                    style={{ background: INK }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                  >
                    <Plus size={14} strokeWidth={3} /> Registrar reunião
                  </button>
                )}
              </div>
            </div>
          </Panel>
        ) : (
          <Panel noPad className="anim-fade-up">
            <div className="divide-y" style={{ borderColor: LINE_2 }}>
              {reunioesFiltradas.map((r, idx) => {
                const info = getStatusInfo(r.status);
                const { dia, mes, ano } = fmtDataCurta(r.data_reuniao);

                return (
                  <div
                    key={r.id}
                    style={{ animationDelay: `${idx * 15}ms` }}
                    className="relative grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAFB] transition-colors anim-fade-up group"
                  >
                    {/* Faixa lateral de estado (indicador) */}
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-10 rounded-r"
                      style={{ background: info.cor }}
                    />

                    {/* Bloco de data */}
                    <div
                      className="w-12 h-12 rounded-md flex flex-col items-center justify-center shrink-0"
                      style={{ background: INK, color: "#FFF" }}
                    >
                      <span className="text-[8.5px] font-bold tracking-wider leading-none mb-0.5 opacity-80">
                        {mes.toUpperCase()}
                      </span>
                      <span className={`${jakarta.className} num text-[15px] font-bold leading-none`}>
                        {dia}
                      </span>
                      <span className="text-[8.5px] font-semibold leading-none mt-0.5 opacity-70 num">
                        {ano}
                      </span>
                    </div>

                    {/* Conteúdo */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <StatusPill status={r.status} />
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide num"
                          style={{ background: LINE_2, color: MUTED, border: `1px solid ${LINE}` }}
                        >
                          <Hash size={9} />
                          {r.ordem_reuniao}
                        </span>
                      </div>

                      <p
                        className={`${jakarta.className} text-[13.5px] font-bold leading-snug truncate`}
                        style={{ color: INK }}
                      >
                        {r.mes_ano}
                      </p>

                      <p
                        className="text-[11px] num flex items-center gap-1.5 mt-0.5"
                        style={{ color: SUBTLE }}
                      >
                        <CalendarIcon size={10} />
                        {fmtData(r.data_reuniao)}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => abrirFormEditar(r)}
                        className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                        style={{ color: SUBTLE }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = LINE_2;
                          e.currentTarget.style.color = INK;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = SUBTLE;
                        }}
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                        style={{ color: SUBTLE }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#FEF2F2";
                          e.currentTarget.style.color = DANGER;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = SUBTLE;
                        }}
                        title="Apagar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}