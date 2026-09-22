"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Users, Plus, Loader2, Save, Sparkles, ArrowLeft, FileText,
  Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle,
  XCircle, Hash, Tag, Pencil, Trash2, Inbox, Search, X, Filter,
  Target, Eye, Layers, Info,
} from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── CORES (paleta Azure/Microsoft do portal) ───
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
const labelCls =
  "flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2";

function fmtData(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ─── ESTILO POR STATUS ───
const STATUS_INFO: Record<
  string,
  { cor: string; gradient: string; icone: any; label: string }
> = {
  Realizada: {
    cor: AZUL,
    gradient: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
    icone: CheckCircle2,
    label: "Realizada",
  },
  Agendada: {
    cor: AMBAR,
    gradient: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
    icone: Clock,
    label: "Agendada",
  },
  Cancelada: {
    cor: VERMELHO,
    gradient: `linear-gradient(135deg, ${VERMELHO}, #F87171)`,
    icone: XCircle,
    label: "Cancelada",
  },
};

function getStatusInfo(status: string) {
  return STATUS_INFO[status] || STATUS_INFO.Agendada;
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
      .anim-fade-up { animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .anim-fade { animation: fadeIn 0.25s ease both; }
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

function FormField({
  label,
  icon,
  required,
  hint,
  children,
  className = "",
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={labelCls}>
        {icon}
        {label}
        {required && <span style={{ color: VERMELHO }}>*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed flex items-start gap-1.5">
          <Info size={10} className="mt-0.5 shrink-0" />
          {hint}
        </p>
      )}
    </div>
  );
}

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

export default function PortalReunioesComtur() {
  const [reunioes, setReunioes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "Todos" | "Agendada" | "Realizada" | "Cancelada"
  >("Todos");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchReunioes();
  }, []);

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
    setForm({
      mes_ano: "",
      ordem_reuniao: "",
      data_reuniao: "",
      status: "Agendada",
    });
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

      setFeedback("Reunião salva com sucesso!");
      setTimeout(() => {
        setShowForm(false);
        setSaving(false);
        fetchReunioes();
        setFeedback("");
      }, 2000);
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
  const contadores = useMemo(() => {
    return {
      total: reunioes.length,
      agendadas: reunioes.filter((r) => r.status === "Agendada").length,
      realizadas: reunioes.filter((r) => r.status === "Realizada").length,
      canceladas: reunioes.filter((r) => r.status === "Cancelada").length,
    };
  }, [reunioes]);

  // ─── FILTRO ───
  const reunioesFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return reunioes.filter((r) => {
      const passaStatus =
        filtroStatus === "Todos" || r.status === filtroStatus;
      const passaBusca =
        !termo ||
        r.mes_ano?.toLowerCase().includes(termo) ||
        r.ordem_reuniao?.toLowerCase().includes(termo);
      return passaStatus && passaBusca;
    });
  }, [reunioes, busca, filtroStatus]);

  const temFiltro = busca || filtroStatus !== "Todos";

  // ═══════════════════════════════════════════════════════════════
  // VISTA: FORMULÁRIO
  // ═══════════════════════════════════════════════════════════════

  if (showForm) {
    return (
      <>
        <GlobalStyles />
        <div className={`${inter.className} space-y-5 pb-6 max-w-4xl mx-auto anim-fade-up`}>

          {/* Cabeçalho */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm shrink-0 flex items-center justify-center group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
                >
                  <Users size={12} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {editando ? "Editar reunião" : "Nova reunião"}
                </span>
              </div>
              <h1
                className={`${jakarta.className} text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate`}
              >
                {editando ? editando.ordem_reuniao : "Registrar reunião"}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Preenche a referência, o agendamento e o estado atual.
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})` }} />

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              {/* Coluna 1: Referência */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                  >
                    <FileText size={12} />
                  </div>
                  <h4 className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                    Referência
                  </h4>
                </div>

                <FormField
                  label="Mês / ano da referência"
                  icon={<CalendarIcon size={11} />}
                  required
                >
                  <input
                    value={form.mes_ano || ""}
                    onChange={(e) => setForm({ ...form, mes_ano: e.target.value })}
                    className={inputCls}
                    placeholder="Ex: Janeiro 2026"
                  />
                </FormField>

                <FormField
                  label="Ordem da reunião"
                  icon={<Hash size={11} />}
                  required
                  hint="Identifica a numeração oficial da reunião."
                >
                  <input
                    value={form.ordem_reuniao || ""}
                    onChange={(e) =>
                      setForm({ ...form, ordem_reuniao: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Ex: 1ª Reunião Ordinária"
                  />
                </FormField>
              </div>

              {/* Coluna 2: Agendamento */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
                  >
                    <Clock size={12} />
                  </div>
                  <h4 className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                    Agendamento
                  </h4>
                </div>

                <FormField label="Data da reunião" icon={<CalendarIcon size={11} />}>
                  <input
                    type="date"
                    value={form.data_reuniao || ""}
                    onChange={(e) =>
                      setForm({ ...form, data_reuniao: e.target.value })
                    }
                    className={inputCls}
                  />
                </FormField>

                <FormField label="Status atual" icon={<Target size={11} />}>
                  <select
                    value={form.status || "Agendada"}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={inputCls}
                  >
                    <option value="Agendada">Agendada</option>
                    <option value="Realizada">Realizada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </FormField>

                {/* Preview do status */}
                {form.status && (
                  <div
                    className="rounded-xl p-4 border-2 flex items-center gap-3 anim-fade"
                    style={{
                      background: `${getStatusInfo(form.status).cor}06`,
                      borderColor: `${getStatusInfo(form.status).cor}25`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{
                        background: getStatusInfo(form.status).gradient,
                      }}
                    >
                      {(() => {
                        const Icone = getStatusInfo(form.status).icone;
                        return <Icone size={16} />;
                      })()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Estado selecionado
                      </p>
                      <p
                        className={`${jakarta.className} text-sm font-bold mt-0.5`}
                        style={{ color: getStatusInfo(form.status).cor }}
                      >
                        {getStatusInfo(form.status).label}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {feedback && (
                <p
                  className="text-xs font-bold flex items-center gap-2"
                  style={{
                    color: feedback.toLowerCase().includes("obrigat") ||
                      feedback.toLowerCase().includes("erro")
                      ? VERMELHO
                      : feedback.toLowerCase().includes("sucesso")
                      ? VERDE
                      : AZUL,
                  }}
                >
                  {feedback.toLowerCase().includes("obrigat") ||
                  feedback.toLowerCase().includes("erro") ? (
                    <AlertTriangle size={13} />
                  ) : feedback.toLowerCase().includes("sucesso") ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <Loader2 size={13} className="animate-spin" />
                  )}
                  {feedback}
                </p>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className={`${jakarta.className} sm:ml-auto text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0 shrink-0`}
                style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {saving
                  ? "A guardar..."
                  : editando
                  ? "Guardar alterações"
                  : "Guardar registro"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VISTA: LISTA
  // ═══════════════════════════════════════════════════════════════

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-6`}>

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 anim-fade-up">
          <div>
            <h1 className={`${jakarta.className} text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight`}>
              Reuniões COMTUR
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
              <Sparkles size={14} style={{ color: AMBAR }} />
              Gestão de transparência e pautas do Conselho Municipal de Turismo.
            </p>
          </div>

          <button
            onClick={abrirFormNovo}
            className={`${jakarta.className} self-start sm:self-auto text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5`}
            style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
          >
            <Plus size={14} /> Registrar reunião
          </button>
        </div>

        {/* KPIs */}
        {reunioes.length > 0 && (
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 anim-fade-up"
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
                reuniões registradas
              </p>
            </div>

            {/* Agendadas */}
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
                  Agendadas
                </span>
              </div>
              <p
                className={`${jakarta.className} text-3xl font-extrabold leading-none tracking-tight`}
                style={{ color: AMBAR }}
              >
                {contadores.agendadas}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                por realizar
              </p>
            </div>

            {/* Realizadas */}
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
                  <CheckCircle2 size={14} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-tight">
                  Realizadas
                </span>
              </div>
              <p
                className={`${jakarta.className} text-3xl font-extrabold leading-none tracking-tight`}
                style={{ color: AZUL }}
              >
                {contadores.realizadas}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                concluídas
              </p>
            </div>

            {/* Canceladas */}
            <div className="relative bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{
                  background: `linear-gradient(90deg, ${VERMELHO}, #F87171)`,
                }}
              />
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${VERMELHO}, #F87171)`,
                  }}
                >
                  <XCircle size={14} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-tight">
                  Canceladas
                </span>
              </div>
              <p
                className={`${jakarta.className} text-3xl font-extrabold leading-none tracking-tight`}
                style={{ color: contadores.canceladas > 0 ? VERMELHO : "#94A3B8" }}
              >
                {contadores.canceladas}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                sem efeito
              </p>
            </div>
          </div>
        )}

        {/* Busca + Filtro */}
        {reunioes.length > 0 && (
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
                  A mostrar{" "}
                  <strong className="text-slate-800 font-bold">
                    {reunioesFiltradas.length}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-slate-800 font-bold">
                    {reunioes.length}
                  </strong>{" "}
                  reunião(ões)
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                {/* Filtro de status */}
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:bg-white focus:border-[#0078D4] focus:ring-4 focus:ring-[#0078D4]/10 transition-all cursor-pointer"
                >
                  <option value="Todos">Todos os estados</option>
                  <option value="Agendada">Agendadas</option>
                  <option value="Realizada">Realizadas</option>
                  <option value="Cancelada">Canceladas</option>
                </select>

                {/* Busca */}
                <div className="relative flex-1 sm:w-72">
                  <Search
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Buscar mês ou ordem..."
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

            {/* Botão limpar filtros */}
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

        {/* Lista */}
        {loading ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl py-24 flex flex-col items-center gap-3 anim-fade">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
            >
              <Loader2 size={22} className="animate-spin" />
            </div>
            <p className="text-xs text-slate-400 font-medium">
              A carregar reuniões...
            </p>
          </div>
        ) : reunioesFiltradas.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl py-20 text-center shadow-sm anim-fade">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-white"
              style={{
                background: temFiltro
                  ? `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`
                  : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
              }}
            >
              {temFiltro ? <Search size={28} /> : <Inbox size={28} />}
            </div>
            <h3 className={`${jakarta.className} text-lg font-bold text-slate-800 mb-1.5`}>
              {temFiltro ? "Nenhum resultado" : "Sem reuniões registradas"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-5">
              {temFiltro
                ? "Ajusta os filtros ou a pesquisa para encontrares reuniões."
                : "Registra a primeira reunião do COMTUR para aparecer no portal."}
            </p>
            {temFiltro ? (
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
            ) : (
              <button
                onClick={abrirFormNovo}
                className={`${jakarta.className} text-white px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5`}
                style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
              >
                <Plus size={14} /> Registrar reunião
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {reunioesFiltradas.map((r, idx) => {
              const statusInfo = getStatusInfo(r.status);
              const Icone = statusInfo.icone;
              const [ano, mes, dia] = (r.data_reuniao || "").split("-");

              return (
                <article
                  key={r.id}
                  style={{ animationDelay: `${180 + idx * 25}ms` }}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 anim-fade-up group"
                >
                  <div
                    className="h-0.5"
                    style={{ background: statusInfo.gradient }}
                  />

                  <div className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {/* Data destacada */}
                    <div
                      className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white shadow-sm transition-transform group-hover:scale-105"
                      style={{ background: statusInfo.gradient }}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 leading-none mb-1">
                        {ano || "—"}
                      </span>
                      <span
                        className={`${jakarta.className} text-2xl font-extrabold leading-none`}
                      >
                        {dia || "--"}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 leading-none mt-1">
                        {mes
                          ? new Date(r.data_reuniao).toLocaleString("pt-BR", {
                              month: "short",
                            }).replace(".", "")
                          : "---"}
                      </span>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <StatusBadge status={r.status} />
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border"
                          style={{
                            background: "#F8FAFC",
                            color: "#475569",
                            borderColor: "#E2E8F0",
                          }}
                        >
                          <Hash size={10} />
                          {r.ordem_reuniao}
                        </span>
                      </div>

                      <h3
                        className={`${jakarta.className} text-base font-bold text-slate-900 line-clamp-2 leading-snug mb-1.5`}
                      >
                        {r.mes_ano}
                      </h3>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon size={11} className="text-slate-400" />
                          {fmtData(r.data_reuniao)}
                        </span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex sm:flex-col gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => abrirFormEditar(r)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#0078D4] hover:bg-[#0078D4]/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#D13438] hover:bg-red-50 transition-colors"
                        title="Apagar"
                      >
                        <Trash2 size={14} />
                      </button>
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