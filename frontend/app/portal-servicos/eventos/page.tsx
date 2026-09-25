"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Calendar as CalendarIcon, AlertCircle, CheckCircle2, FileSpreadsheet,
  Plus, Loader2, Save, Image as ImageIcon, MapPin, Sparkles,
  Upload, ArrowLeft, Tag, Clock, Hash, Star, Pencil, Trash2,
  Inbox, Search, X, FileText, RefreshCw, Camera, Wallet,
  ExternalLink, MoreHorizontal, Filter, Copy, Eye,
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
  "w-full bg-white text-[13.5px] rounded-md px-3 py-2.5 transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:outline-none border";

function fmtData(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function fmtDataCurta(iso: string) {
  if (!iso) return { dia: "—", mes: "—" };
  const [, m, d] = iso.split("-");
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return { dia: d, mes: meses[parseInt(m) - 1] };
}

interface Evento {
  id: string;
  titulo: string;
  subtitulo: string | null;
  descricao: string | null;
  data: string;
  horario: string | null;
  duracao: string | null;
  local: string;
  imagem_url: string | null;
  categoria: string;
  preco: string | null;
  classificacao: string | null;
  link_bilheteira: string | null;
  destaque: boolean;
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
        <p className="text-[10.5px] mt-1.5 leading-relaxed" style={{ color: SUBTLE }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function StatusPill({ tone, children }: { tone: "success" | "danger" | "warning" | "neutral" | "info"; children: React.ReactNode }) {
  const map = {
    success: { c: SUCCESS, bg: "#ECFDF5", b: "#D1FAE5" },
    danger: { c: DANGER, bg: "#FEF2F2", b: "#FEE2E2" },
    warning: { c: WARNING, bg: "#FFFBEB", b: "#FEF3C7" },
    neutral: { c: MUTED, bg: LINE_2, b: LINE },
    info: { c: ACCENT, bg: "#EFF6FF", b: "#DBEAFE" },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: map.bg, color: map.c, border: `1px solid ${map.b}` }}
    >
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

export default function PortalEventos() {
  const [fase, setFase] = useState<"inicio" | "preview" | "salvando" | "sucesso" | "manual">("inicio");
  const [eventosList, setEventosList] = useState<Evento[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroCat, setFiltroCat] = useState<string>("");

  const [eventosPreview, setEventosPreview] = useState<any[]>([]);
  const [imagensMap, setImagensMap] = useState<{ [key: number]: File }>({});
  const [feedback, setFeedback] = useState("");

  const [editando, setEditando] = useState<Evento | null>(null);
  const [formManual, setFormManual] = useState<any>({ destaque: false, categoria: "Cultura" });
  const [imagemManual, setImagemManual] = useState<File | null>(null);
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => { fetchEventos(); }, []);

  async function fetchEventos() {
    setLoadingList(true);
    const hoje = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("eventos")
      .select("*")
      .gte("data", hoje)
      .order("data", { ascending: true });
    setEventosList(data || []);
    setLoadingList(false);
  }

  async function handleDeleteEvento(id: string) {
    if (!confirm("Remover este evento permanentemente?")) return;
    await supabase.from("eventos").delete().eq("id", id);
    fetchEventos();
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processarCSV(text);
    };
    reader.readAsText(file);
  };

  const processarCSV = (csvText: string) => {
    const linhas = csvText.split("\n").filter((linha) => linha.trim() !== "");
    if (linhas.length < 2) {
      alert("O ficheiro parece estar vazio ou sem os cabeçalhos.");
      return;
    }
    const cabecalhos = linhas[0].toLowerCase().split(",").map((c) => c.trim());
    const eventosLidos = [];
    for (let i = 1; i < linhas.length; i++) {
      const valores = linhas[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const evento: any = {};
      cabecalhos.forEach((cabecalho, index) => {
        let valor = valores[index] ? valores[index].trim() : "";
        if (valor.startsWith('"') && valor.endsWith('"')) {
          valor = valor.substring(1, valor.length - 1);
        }
        evento[cabecalho] = valor;
      });
      if (evento.titulo) {
        eventosLidos.push({ ...evento, destaque: false, data: evento.data || null });
      }
    }
    setEventosPreview(eventosLidos);
    setFase("preview");
  };

  const handleImagemChange = (index: number, file: File) => {
    setImagensMap((prev) => ({ ...prev, [index]: file }));
  };

  const handleSalvarTudo = async () => {
    setFase("salvando");
    setFeedback("A iniciar sincronização...");
    let sucessos = 0;

    for (let i = 0; i < eventosPreview.length; i++) {
      const evento = eventosPreview[i];
      const imagemFile = imagensMap[i];
      let imagem_url = "";
      try {
        setFeedback(`A processar ${i + 1} de ${eventosPreview.length}: ${evento.titulo}`);
        if (imagemFile) {
          const ext = imagemFile.name.split(".").pop();
          const nomeFicheiro = `evento_${Date.now()}_${i}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("eventos").upload(nomeFicheiro, imagemFile);
          if (!uploadErr) {
            const { data: pubUrl } = supabase.storage.from("eventos").getPublicUrl(nomeFicheiro);
            imagem_url = pubUrl.publicUrl;
          }
        }
        const { error: dbError } = await supabase.from("eventos").insert([{
          titulo: evento.titulo,
          subtitulo: evento.subtitulo || null,
          descricao: evento.descricao || null,
          data: evento.data || null,
          horario: evento.horario || null,
          local: evento.local || null,
          categoria: evento.categoria || "Cultura",
          preco: evento.preco || null,
          imagem_url: imagem_url || null,
          destaque: false,
        }]);
        if (!dbError) sucessos++;
      } catch (err) {
        console.error(`Falha: ${evento.titulo}`, err);
      }
    }
    setFeedback(`${sucessos} de ${eventosPreview.length} eventos guardados com sucesso.`);
    setFase("sucesso");
  };

  const abrirFormManual = () => {
    setEditando(null);
    setFormManual({ destaque: false, categoria: "Cultura" });
    setImagemManual(null);
    setFeedback("");
    setFase("manual");
  };

  const abrirFormEditar = (ev: Evento) => {
    setEditando(ev);
    setFormManual({
      titulo: ev.titulo || "",
      subtitulo: ev.subtitulo || "",
      descricao: ev.descricao || "",
      data: ev.data || "",
      horario: ev.horario || "",
      duracao: ev.duracao || "",
      local: ev.local || "",
      categoria: ev.categoria || "Cultura",
      preco: ev.preco || "",
      classificacao: ev.classificacao || "",
      link_bilheteira: ev.link_bilheteira || "",
      destaque: ev.destaque || false,
      imagem_url: ev.imagem_url || "",
    });
    setImagemManual(null);
    setFeedback("");
    setFase("manual");
  };

  const handleSalvarManual = async () => {
    if (!formManual.titulo || !formManual.data || !formManual.local) {
      alert("Título, Data e Local são obrigatórios.");
      return;
    }
    setSavingManual(true);
    setFeedback("A guardar evento...");
    try {
      let imagem_url = formManual.imagem_url;
      if (imagemManual) {
        const ext = imagemManual.name.split(".").pop();
        const nomeFicheiro = `evento_manual_${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("eventos").upload(nomeFicheiro, imagemManual);
        if (!uploadErr) {
          const { data: pubUrl } = supabase.storage.from("eventos").getPublicUrl(nomeFicheiro);
          imagem_url = pubUrl.publicUrl;
        } else {
          throw new Error("Erro ao fazer upload do cartaz.");
        }
      }
      const payload = {
        titulo: formManual.titulo,
        subtitulo: formManual.subtitulo || null,
        descricao: formManual.descricao || null,
        data: formManual.data,
        horario: formManual.horario || null,
        duracao: formManual.duracao || null,
        local: formManual.local,
        categoria: formManual.categoria,
        preco: formManual.preco || null,
        classificacao: formManual.classificacao || null,
        link_bilheteira: formManual.link_bilheteira || null,
        imagem_url: imagem_url || null,
        destaque: String(formManual.destaque) === "true",
      };
      let erroBd;
      if (editando) {
        const { error } = await supabase.from("eventos").update(payload).eq("id", editando.id);
        erroBd = error;
      } else {
        const { error } = await supabase.from("eventos").insert([payload]);
        erroBd = error;
      }
      if (erroBd) throw new Error(erroBd.message);
      setFeedback(editando ? "Evento atualizado." : "Evento publicado.");
      setFase("sucesso");
    } catch (err: any) {
      setFeedback(`Erro: ${err.message}`);
    } finally {
      setSavingManual(false);
    }
  };

  const resetar = () => {
    setFase("inicio");
    setEventosPreview([]);
    setImagensMap({});
    setFeedback("");
    setEditando(null);
    fetchEventos();
  };

  // ─── FILTROS ───
  const categoriasUnicas = Array.from(new Set(eventosList.map((e) => e.categoria).filter(Boolean)));
  const eventosFiltrados = eventosList.filter((ev) => {
    const termo = busca.toLowerCase();
    const passaBusca =
      !busca ||
      ev.titulo?.toLowerCase().includes(termo) ||
      ev.local?.toLowerCase().includes(termo) ||
      ev.categoria?.toLowerCase().includes(termo);
    const passaCat = !filtroCat || ev.categoria === filtroCat;
    return passaBusca && passaCat;
  });

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
                <CalendarIcon size={9} strokeWidth={3} />
                Agenda
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {eventosList.length} evento{eventosList.length !== 1 ? "s" : ""} futuros
              </span>
            </div>
            <h1
              className={`${jakarta.className} text-[26px] font-bold tracking-tight`}
              style={{ color: INK, letterSpacing: "-0.025em" }}
            >
              Eventos
            </h1>
            <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
              Gestão do calendário municipal — importação em lote ou cadastro individual.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {fase === "inicio" ? (
              <>
                <label
                  className="h-9 px-3 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 border cursor-pointer transition-colors"
                  style={{ borderColor: LINE, color: INK_2, background: SURFACE }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}
                >
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  <Upload size={13} />
                  <span className="hidden sm:inline">Importar CSV</span>
                </label>
                <button
                  onClick={abrirFormManual}
                  className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 text-white transition-colors"
                  style={{ background: INK }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                >
                  <Plus size={14} strokeWidth={3} />
                  Novo evento
                </button>
              </>
            ) : (
              <button
                onClick={resetar}
                className="h-9 px-3 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 border transition-colors"
                style={{ borderColor: LINE, color: INK_2, background: SURFACE }}
                onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}
              >
                <ArrowLeft size={13} />
                Voltar
              </button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FASE: INÍCIO                                                */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {fase === "inicio" && (
          <>
            {/* Linha de estatísticas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 anim-fade-up">
              <Panel className="anim-fade-up" noPad>
                <div className="px-4 py-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
                    Total futuros
                  </p>
                  <p className={`${jakarta.className} num text-[22px] font-bold mt-1.5 leading-none`} style={{ color: INK, letterSpacing: "-0.02em" }}>
                    {eventosList.length}
                  </p>
                </div>
              </Panel>
              <Panel className="anim-fade-up" noPad>
                <div className="px-4 py-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
                    Em destaque
                  </p>
                  <p className={`${jakarta.className} num text-[22px] font-bold mt-1.5 leading-none`} style={{ color: INK, letterSpacing: "-0.02em" }}>
                    {eventosList.filter((e) => e.destaque).length}
                  </p>
                </div>
              </Panel>
              <Panel className="anim-fade-up" noPad>
                <div className="px-4 py-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
                    Categorias
                  </p>
                  <p className={`${jakarta.className} num text-[22px] font-bold mt-1.5 leading-none`} style={{ color: INK, letterSpacing: "-0.02em" }}>
                    {categoriasUnicas.length}
                  </p>
                </div>
              </Panel>
              <Panel className="anim-fade-up" noPad>
                <div className="px-4 py-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
                    Este mês
                  </p>
                  <p className={`${jakarta.className} num text-[22px] font-bold mt-1.5 leading-none`} style={{ color: INK, letterSpacing: "-0.02em" }}>
                    {eventosList.filter((e) => {
                      const hoje = new Date();
                      const [y, m] = e.data.split("-");
                      return parseInt(y) === hoje.getFullYear() && parseInt(m) === hoje.getMonth() + 1;
                    }).length}
                  </p>
                </div>
              </Panel>
            </div>

            {/* Lista principal */}
            <Panel noPad className="anim-fade-up">
              <PanelHeader
                title="Calendário de eventos"
                subtitle="Ordenados pela data mais próxima"
                badge={
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded num"
                    style={{ background: LINE_2, color: MUTED }}
                  >
                    {eventosFiltrados.length}
                  </span>
                }
                action={
                  <div className="flex items-center gap-2">
                    {/* Filtro categoria */}
                    <div className="relative">
                      <select
                        value={filtroCat}
                        onChange={(e) => setFiltroCat(e.target.value)}
                        className="h-8 pl-2.5 pr-7 rounded-md text-[12px] font-medium border appearance-none cursor-pointer transition-colors"
                        style={{ borderColor: LINE, color: INK_2, background: SURFACE }}
                      >
                        <option value="">Todas</option>
                        {categoriasUnicas.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <Filter
                        size={11}
                        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: SUBTLE }}
                      />
                    </div>

                    {/* Busca */}
                    {eventosList.length > 0 && (
                      <div className="relative w-full sm:w-56">
                        <Search
                          size={13}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: SUBTLE }}
                        />
                        <input
                          type="text"
                          placeholder="Buscar..."
                          value={busca}
                          onChange={(e) => setBusca(e.target.value)}
                          className="w-full h-8 pl-7 pr-7 rounded-md text-[12px] border transition-[border-color,box-shadow]"
                          style={{ borderColor: LINE, color: INK, background: SURFACE }}
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
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center transition-colors"
                            style={{ color: SUBTLE }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            aria-label="Limpar"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                }
              />

              {loadingList ? (
                <div className="divide-y" style={{ borderColor: LINE_2 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 skeleton" />
                  ))}
                </div>
              ) : eventosFiltrados.length === 0 ? (
                <div className="py-16 text-center">
                  <div
                    className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                    style={{ background: LINE_2, color: MUTED }}
                  >
                    {busca || filtroCat ? <Search size={20} strokeWidth={2} /> : <Inbox size={20} strokeWidth={2} />}
                  </div>
                  <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                    {busca || filtroCat ? "Nenhum resultado" : "Nenhum evento futuro"}
                  </p>
                  <p className="text-[11.5px] mt-1 max-w-md mx-auto" style={{ color: MUTED }}>
                    {busca || filtroCat
                      ? "Ajusta os filtros para encontrar eventos."
                      : "Importa um CSV ou cria um evento manualmente."}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {(busca || filtroCat) ? (
                      <button
                        onClick={() => { setBusca(""); setFiltroCat(""); }}
                        className="h-9 px-3 rounded-md text-[12.5px] font-semibold text-white transition-colors"
                        style={{ background: INK }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                      >
                        Limpar filtros
                      </button>
                    ) : (
                      <>
                        <label
                          className="h-9 px-3 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 border cursor-pointer transition-colors"
                          style={{ borderColor: LINE, color: INK_2, background: SURFACE }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}
                        >
                          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                          <Upload size={13} />
                          Importar CSV
                        </label>
                        <button
                          onClick={abrirFormManual}
                          className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white transition-colors"
                          style={{ background: INK }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                        >
                          <Plus size={14} strokeWidth={3} />
                          Novo evento
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: LINE_2 }}>
                  {eventosFiltrados.map((ev, idx) => {
                    const { dia, mes } = fmtDataCurta(ev.data);
                    const isDestaque = ev.destaque;
                    return (
                      <div
                        key={ev.id}
                        style={{ animationDelay: `${idx * 15}ms` }}
                        className="relative grid grid-cols-[auto_auto_1fr_auto] items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAFB] transition-colors group anim-fade-up"
                      >
                        {/* Faixa de destaque */}
                        {isDestaque && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 rounded-r"
                            style={{ background: WARNING }}
                          />
                        )}

                        {/* Data */}
                        <div
                          className="w-11 h-11 rounded-md flex flex-col items-center justify-center shrink-0"
                          style={{
                            background: isDestaque ? WARNING : INK,
                            color: "#FFF",
                          }}
                        >
                          <span className="text-[9px] font-bold tracking-wider leading-none mb-0.5 opacity-80">
                            {mes}
                          </span>
                          <span className={`${jakarta.className} num text-[15px] font-bold leading-none`}>
                            {dia}
                          </span>
                        </div>

                        {/* Thumb */}
                        <div
                          className="w-12 h-12 rounded-md overflow-hidden shrink-0 border hidden sm:block"
                          style={{ borderColor: LINE, background: LINE_2 }}
                        >
                          {ev.imagem_url ? (
                            <img src={ev.imagem_url} alt={ev.titulo} className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ color: SUBTLE }}
                            >
                              <CalendarIcon size={16} strokeWidth={1.5} />
                            </div>
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {isDestaque && (
                              <StatusPill tone="warning">
                                <Star size={8} className="fill-current" />
                                Destaque
                              </StatusPill>
                            )}
                            {ev.categoria && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                                style={{ background: LINE_2, color: MUTED, border: `1px solid ${LINE}` }}
                              >
                                <Tag size={8} />
                                {ev.categoria}
                              </span>
                            )}
                            {ev.classificacao && (
                              <span
                                className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                                style={{ background: LINE_2, color: MUTED, border: `1px solid ${LINE}` }}
                              >
                                {ev.classificacao}
                              </span>
                            )}
                          </div>

                          <p
                            className={`${jakarta.className} text-[13.5px] font-bold leading-snug truncate`}
                            style={{ color: INK }}
                          >
                            {ev.titulo}
                          </p>

                          {ev.subtitulo && (
                            <p className="text-[11.5px] truncate mt-0.5" style={{ color: MUTED }}>
                              {ev.subtitulo}
                            </p>
                          )}

                          {/* Meta info em linha */}
                          <div
                            className="flex items-center gap-3 text-[10.5px] flex-wrap mt-1.5 num"
                            style={{ color: SUBTLE }}
                          >
                            {ev.horario && (
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {ev.horario}
                              </span>
                            )}
                            <span className="flex items-center gap-1 truncate max-w-[240px]">
                              <MapPin size={10} />
                              {ev.local}
                            </span>
                            {ev.preco && (
                              <span className="flex items-center gap-1">
                                <Wallet size={10} />
                                {ev.preco}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => abrirFormEditar(ev)}
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
                            onClick={() => handleDeleteEvento(ev.id)}
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
                            title="Remover"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FASE: MANUAL                                                */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {fase === "manual" && (
          <div className="space-y-4 anim-fade-up">
            <div className="flex items-center gap-3">
              <button
                onClick={resetar}
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
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                    style={{ background: INK, color: "#FFF" }}
                  >
                    <CalendarIcon size={9} strokeWidth={3} />
                    {editando ? "Editar" : "Novo"}
                  </span>
                  <span className="text-[11px]" style={{ color: MUTED }}>
                    {editando ? `Criado em ${fmtData(editando.data)}` : "Rascunho"}
                  </span>
                </div>
                <h2
                  className={`${jakarta.className} text-[20px] font-bold tracking-tight truncate`}
                  style={{ color: INK, letterSpacing: "-0.02em" }}
                >
                  {editando ? editando.titulo : "Novo evento"}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* Coluna principal */}
              <div className="lg:col-span-8 space-y-4">

                <Panel noPad>
                  <PanelHeader title="Informações" subtitle="Título, subtítulo e descrição" />
                  <div className="p-5 space-y-4">
                    <FormField label="Título" icon={<FileText size={10} />} required>
                      <input
                        value={formManual.titulo || ""}
                        onChange={(e) => setFormManual({ ...formManual, titulo: e.target.value })}
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
                        placeholder="Ex: Festival de Verão"
                      />
                    </FormField>

                    <FormField label="Subtítulo" icon={<Hash size={10} />}>
                      <input
                        value={formManual.subtitulo || ""}
                        onChange={(e) => setFormManual({ ...formManual, subtitulo: e.target.value })}
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
                        placeholder="Frase de chamariz..."
                      />
                    </FormField>

                    <FormField label="Descrição" icon={<FileText size={10} />}>
                      <textarea
                        value={formManual.descricao || ""}
                        onChange={(e) => setFormManual({ ...formManual, descricao: e.target.value })}
                        rows={5}
                        className={`${inputCls} resize-y min-h-[110px]`}
                        style={{ borderColor: LINE }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = INK;
                          e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = LINE;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        placeholder="Descrição detalhada do evento..."
                      />
                    </FormField>
                  </div>
                </Panel>

                <Panel noPad>
                  <PanelHeader title="Logística" subtitle="Local, data e hora" />
                  <div className="p-5 grid grid-cols-2 gap-4">
                    <FormField label="Data" icon={<CalendarIcon size={10} />} required>
                      <input
                        type="date"
                        value={formManual.data || ""}
                        onChange={(e) => setFormManual({ ...formManual, data: e.target.value })}
                        className={inputCls}
                        style={{ borderColor: LINE }}
                      />
                    </FormField>

                    <FormField label="Hora de início" icon={<Clock size={10} />}>
                      <input
                        type="time"
                        value={formManual.horario || ""}
                        onChange={(e) => setFormManual({ ...formManual, horario: e.target.value })}
                        className={inputCls}
                        style={{ borderColor: LINE }}
                      />
                    </FormField>

                    <FormField label="Duração" icon={<Clock size={10} />}>
                      <input
                        value={formManual.duracao || ""}
                        onChange={(e) => setFormManual({ ...formManual, duracao: e.target.value })}
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
                        placeholder="Ex: 3 dias"
                      />
                    </FormField>

                    <FormField label="Classificação" icon={<Tag size={10} />}>
                      <input
                        value={formManual.classificacao || ""}
                        onChange={(e) => setFormManual({ ...formManual, classificacao: e.target.value })}
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
                        placeholder="Ex: Livre, +18"
                      />
                    </FormField>

                    <FormField label="Local" icon={<MapPin size={10} />} required className="col-span-2">
                      <input
                        value={formManual.local || ""}
                        onChange={(e) => setFormManual({ ...formManual, local: e.target.value })}
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
                        placeholder="Ex: Praça Central, Teatro Municipal..."
                      />
                    </FormField>
                  </div>
                </Panel>
              </div>

              {/* Lateral */}
              <div className="lg:col-span-4 space-y-4">
                <Panel noPad>
                  <PanelHeader title="Publicação" subtitle="Categoria e visibilidade" />
                  <div className="p-5 space-y-4">
                    <FormField label="Categoria" icon={<Tag size={10} />}>
                      <input
                        value={formManual.categoria || ""}
                        onChange={(e) => setFormManual({ ...formManual, categoria: e.target.value })}
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
                        placeholder="Ex: Cultura, Música..."
                      />
                    </FormField>

                    <FormField label="Preço" icon={<Wallet size={10} />}>
                      <input
                        value={formManual.preco || ""}
                        onChange={(e) => setFormManual({ ...formManual, preco: e.target.value })}
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
                        placeholder="R$ 50 ou Grátis"
                      />
                    </FormField>

                    <FormField label="Link bilheteira" icon={<ExternalLink size={10} />}>
                      <input
                        value={formManual.link_bilheiteira || formManual.link_bilheteira || ""}
                        onChange={(e) => setFormManual({ ...formManual, link_bilheteira: e.target.value })}
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
                        placeholder="https://..."
                      />
                    </FormField>

                    <FormField label="Destaque" icon={<Star size={10} />}>
                      <select
                        value={String(formManual.destaque)}
                        onChange={(e) => setFormManual({ ...formManual, destaque: e.target.value })}
                        className={inputCls}
                        style={{ borderColor: LINE }}
                      >
                        <option value="false">Normal</option>
                        <option value="true">Banner principal</option>
                      </select>
                    </FormField>
                  </div>
                </Panel>

                <Panel noPad>
                  <PanelHeader title="Cartaz" subtitle="Imagem oficial" />
                  <div className="p-5">
                    <label
                      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md p-5 cursor-pointer text-[12px] font-semibold transition-colors"
                      style={{
                        background: imagemManual ? "#ECFDF5" : BG,
                        borderColor: imagemManual ? `${SUCCESS}50` : LINE,
                        color: imagemManual ? SUCCESS : MUTED,
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setImagemManual(e.target.files?.[0] || null)}
                      />
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center"
                        style={{
                          background: imagemManual ? SUCCESS : LINE_2,
                          color: imagemManual ? "#FFF" : MUTED,
                        }}
                      >
                        {imagemManual ? <CheckCircle2 size={14} /> : <Camera size={14} />}
                      </div>
                      <span className="truncate max-w-[200px] text-center">
                        {imagemManual
                          ? imagemManual.name
                          : formManual.imagem_url
                          ? "Substituir cartaz"
                          : "Anexar cartaz"}
                      </span>
                    </label>

                    {formManual.imagem_url && !imagemManual && (
                      <div className="mt-3 rounded-md overflow-hidden border" style={{ borderColor: LINE }}>
                        <img src={formManual.imagem_url} alt="Cartaz" className="w-full h-32 object-cover" />
                      </div>
                    )}
                  </div>
                </Panel>

                {feedback && (
                  <div
                    className="rounded-lg border p-3.5 flex items-start gap-3 anim-fade-up"
                    style={{
                      background: feedback.toLowerCase().includes("erro") || feedback.toLowerCase().includes("obrigat")
                        ? "#FEF2F2"
                        : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("publicado") || feedback.toLowerCase().includes("atualizado")
                        ? "#ECFDF5"
                        : "#EFF6FF",
                      borderColor: feedback.toLowerCase().includes("erro") || feedback.toLowerCase().includes("obrigat")
                        ? "#FEE2E2"
                        : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("publicado") || feedback.toLowerCase().includes("atualizado")
                        ? "#D1FAE5"
                        : "#DBEAFE",
                      color: feedback.toLowerCase().includes("erro") || feedback.toLowerCase().includes("obrigat")
                        ? DANGER
                        : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("publicado") || feedback.toLowerCase().includes("atualizado")
                        ? SUCCESS
                        : ACCENT,
                    }}
                  >
                    {feedback.toLowerCase().includes("erro") || feedback.toLowerCase().includes("obrigat") ? (
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    ) : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("publicado") || feedback.toLowerCase().includes("atualizado") ? (
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                    ) : (
                      <Loader2 size={14} className="shrink-0 mt-0.5 animate-spin" />
                    )}
                    <p className="text-[12.5px] font-medium">{feedback}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer sticky */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={resetar}
                className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold border transition-colors"
                style={{ borderColor: LINE, color: INK_2, background: SURFACE }}
                onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarManual}
                disabled={savingManual}
                className="h-9 px-4 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors disabled:opacity-50"
                style={{ background: INK }}
                onMouseEnter={(e) => !savingManual && (e.currentTarget.style.background = INK_2)}
                onMouseLeave={(e) => !savingManual && (e.currentTarget.style.background = INK)}
              >
                {savingManual ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {savingManual ? "A guardar..." : editando ? "Guardar" : "Publicar evento"}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FASE: PREVIEW CSV                                           */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {fase === "preview" && (
          <div className="space-y-4 anim-fade-up">

            {/* Banner aviso */}
            <div
              className="rounded-lg border p-3.5 flex items-start gap-3"
              style={{ background: "#FFFBEB", borderColor: "#FEF3C7" }}
            >
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                style={{ background: WARNING, color: "#FFF" }}
              >
                <AlertCircle size={14} />
              </div>
              <div className="text-[12.5px] pt-1">
                <p className="font-semibold" style={{ color: INK }}>
                  {eventosPreview.length} eventos identificados no CSV
                </p>
                <p className="mt-0.5" style={{ color: MUTED }}>
                  Anexa as fotos oficiais antes de guardar. Eventos sem imagem usam um placeholder.
                </p>
              </div>
            </div>

            {/* Lista preview */}
            <Panel noPad>
              <PanelHeader
                title="Pré-visualização"
                subtitle="Confirma os dados antes de sincronizar"
                badge={
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded num"
                    style={{ background: LINE_2, color: MUTED }}
                  >
                    {eventosPreview.length}
                  </span>
                }
              />

              <div className="divide-y scroll-thin max-h-[600px] overflow-y-auto" style={{ borderColor: LINE_2 }}>
                {eventosPreview.map((ev, idx) => {
                  const temImagem = !!imagensMap[idx];
                  const { dia, mes } = fmtDataCurta(ev.data);
                  return (
                    <div
                      key={idx}
                      style={{ animationDelay: `${idx * 15}ms` }}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3.5 anim-fade-up"
                    >
                      {/* Data */}
                      <div
                        className="w-11 h-11 rounded-md flex flex-col items-center justify-center shrink-0"
                        style={{ background: INK, color: "#FFF" }}
                      >
                        <span className="text-[9px] font-bold tracking-wider leading-none mb-0.5 opacity-80">
                          {mes || "—"}
                        </span>
                        <span className={`${jakarta.className} num text-[15px] font-bold leading-none`}>
                          {dia || idx + 1}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {ev.categoria && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                              style={{ background: LINE_2, color: MUTED, border: `1px solid ${LINE}` }}
                            >
                              <Tag size={8} />
                              {ev.categoria}
                            </span>
                          )}
                          {ev.data && (
                            <span className="text-[10.5px] num" style={{ color: SUBTLE }}>
                              {fmtData(ev.data)}
                            </span>
                          )}
                        </div>
                        <p
                          className={`${jakarta.className} text-[13.5px] font-bold leading-snug truncate`}
                          style={{ color: INK }}
                        >
                          {ev.titulo}
                        </p>
                        {ev.local && (
                          <p
                            className="text-[11.5px] truncate flex items-center gap-1 mt-0.5"
                            style={{ color: MUTED }}
                          >
                            <MapPin size={10} />
                            {ev.local}
                          </p>
                        )}
                      </div>

                      {/* Upload */}
                      <label
                        className="h-8 px-2.5 rounded-md cursor-pointer inline-flex items-center gap-1.5 text-[11.5px] font-semibold border transition-colors shrink-0 whitespace-nowrap"
                        style={{
                          background: temImagem ? "#ECFDF5" : SURFACE,
                          borderColor: temImagem ? "#D1FAE5" : LINE,
                          color: temImagem ? SUCCESS : INK_2,
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) handleImagemChange(idx, e.target.files[0]);
                          }}
                        />
                        {temImagem ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span className="hidden sm:inline">Imagem OK</span>
                          </>
                        ) : (
                          <>
                            <Camera size={12} />
                            <span className="hidden sm:inline">Anexar</span>
                          </>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div
                className="px-5 py-3.5 flex items-center justify-end border-t"
                style={{ borderColor: LINE, background: BG }}
              >
                <button
                  onClick={handleSalvarTudo}
                  className="h-9 px-4 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors"
                  style={{ background: INK }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                >
                  <Save size={13} />
                  Guardar {eventosPreview.length} evento{eventosPreview.length !== 1 ? "s" : ""}
                </button>
              </div>
            </Panel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FASE: SALVANDO / SUCESSO                                    */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {(fase === "salvando" || fase === "sucesso") && (
          <Panel noPad className="anim-fade-up max-w-2xl mx-auto">
            <div className="py-16 px-6 text-center">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
                style={{
                  background: fase === "salvando" ? INK : SUCCESS,
                  color: "#FFF",
                }}
              >
                {fase === "salvando" ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={22} />
                )}
              </div>

              <h3
                className={`${jakarta.className} text-[18px] font-bold tracking-tight mb-1.5`}
                style={{ color: INK, letterSpacing: "-0.02em" }}
              >
                {fase === "salvando" ? "A sincronizar..." : "Tudo guardado"}
              </h3>

              <p className="text-[12.5px] mb-6 max-w-md mx-auto leading-relaxed" style={{ color: MUTED }}>
                {feedback}
              </p>

              {fase === "sucesso" && (
                <button
                  onClick={resetar}
                  className="h-9 px-4 rounded-md text-[12.5px] font-semibold inline-flex items-center gap-2 text-white transition-colors"
                  style={{ background: INK }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                >
                  <RefreshCw size={13} />
                  Voltar à lista
                </button>
              )}
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}