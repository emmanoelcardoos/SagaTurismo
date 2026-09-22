"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Calendar as CalendarIcon, AlertCircle, CheckCircle2, FileSpreadsheet,
  Plus, Loader2, Save, Image as ImageIcon, MapPin, Sparkles,
  Upload, ArrowLeft, Tag, Clock, Hash, Star, Pencil, Trash2,
  Inbox, Filter, Search, X, FileText, User, Target, Compass,
  RefreshCw, Layers, ChevronRight, Camera, Wallet,
} from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── CORES (paleta Azure/Microsoft do portal) ───
const AZUL = "#0078D4";
const AZUL_ESCURO = "#005A9E";
const AZUL_CLARO = "#E5F1FB";
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
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .anim-fade-up { animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .anim-fade { animation: fadeIn 0.25s ease both; }
      .pulse-dot { animation: pulseDot 1.8s ease-in-out infinite; }
      .skeleton-shimmer {
        background: linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
      }
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
        <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 skeleton-shimmer border-b border-slate-100 last:border-b-0"
        />
      ))}
    </div>
  );
}

function CategoriaBadge({ categoria }: { categoria: string }) {
  const cores: Record<string, string> = {
    Cultura: ROXO,
    Música: "#EC4899",
    Esporte: VERDE,
    Gastronomia: AMBAR,
    Turismo: AZUL,
    "Artes Visuais": "#0891B2",
  };
  const cor = cores[categoria] || AZUL;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border"
      style={{ background: `${cor}10`, color: cor, borderColor: `${cor}25` }}
    >
      <Tag size={10} />
      {categoria || "Geral"}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function PortalEventos() {
  const [fase, setFase] = useState<
    "inicio" | "preview" | "salvando" | "sucesso" | "manual"
  >("inicio");
  const [eventosList, setEventosList] = useState<Evento[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [busca, setBusca] = useState("");

  const [eventosPreview, setEventosPreview] = useState<any[]>([]);
  const [imagensMap, setImagensMap] = useState<{ [key: number]: File }>({});
  const [feedback, setFeedback] = useState("");

  const [editando, setEditando] = useState<Evento | null>(null);
  const [formManual, setFormManual] = useState<any>({
    destaque: false,
    categoria: "Cultura",
  });
  const [imagemManual, setImagemManual] = useState<File | null>(null);
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    fetchEventos();
  }, []);

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
    setFeedback("A iniciar a sincronização com a base de dados...");
    let sucessos = 0;

    for (let i = 0; i < eventosPreview.length; i++) {
      const evento = eventosPreview[i];
      const imagemFile = imagensMap[i];
      let imagem_url = "";

      try {
        setFeedback(
          `A processar o evento: ${evento.titulo} (${i + 1}/${eventosPreview.length})...`
        );
        if (imagemFile) {
          const ext = imagemFile.name.split(".").pop();
          const nomeFicheiro = `evento_${Date.now()}_${i}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("eventos")
            .upload(nomeFicheiro, imagemFile);
          if (!uploadErr) {
            const { data: pubUrl } = supabase.storage
              .from("eventos")
              .getPublicUrl(nomeFicheiro);
            imagem_url = pubUrl.publicUrl;
          }
        }
        const { error: dbError } = await supabase.from("eventos").insert([
          {
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
          },
        ]);
        if (dbError) console.error(`Erro ao salvar ${evento.titulo}:`, dbError);
        else sucessos++;
      } catch (err) {
        console.error(`Falha fatal no evento ${evento.titulo}:`, err);
      }
    }
    setFeedback(`${sucessos} de ${eventosPreview.length} eventos foram guardados com sucesso!`);
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
          .from("eventos")
          .upload(nomeFicheiro, imagemManual);
        if (!uploadErr) {
          const { data: pubUrl } = supabase.storage
            .from("eventos")
            .getPublicUrl(nomeFicheiro);
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
        const { error } = await supabase
          .from("eventos")
          .update(payload)
          .eq("id", editando.id);
        erroBd = error;
      } else {
        const { error } = await supabase.from("eventos").insert([payload]);
        erroBd = error;
      }

      if (erroBd) throw new Error(erroBd.message);

      setFeedback(editando ? "Evento atualizado com sucesso!" : "Evento publicado com sucesso!");
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

  // ─── FILTRO ───
  const eventosFiltrados = eventosList.filter((ev) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      ev.titulo?.toLowerCase().includes(termo) ||
      ev.local?.toLowerCase().includes(termo) ||
      ev.categoria?.toLowerCase().includes(termo)
    );
  });

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-6`}>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* CABEÇALHO                                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 anim-fade-up">
          <div>
            <h1 className={`${jakarta.className} text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight`}>
              Gestão de eventos
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
              <Sparkles size={14} style={{ color: AMBAR }} />
              Ferramenta exclusiva da Prefeitura para o calendário da cidade.
            </p>
          </div>

          {fase !== "inicio" && (
            <button
              onClick={resetar}
              className={`${jakarta.className} self-start sm:self-auto text-xs font-bold text-slate-600 hover:text-white flex items-center gap-2 bg-white hover:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-900 shadow-sm hover:shadow-md transition-all group`}
            >
              <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
              Cancelar e voltar
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FASE: INÍCIO                                                */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {fase === "inicio" && (
          <div className="space-y-6">
            {/* Cards de ação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Importação em Lote */}
              <div
                className="relative bg-white border-2 border-dashed rounded-2xl p-7 text-center overflow-hidden group anim-fade-up transition-all hover:border-solid"
                style={{
                  borderColor: `${AZUL}40`,
                  animationDelay: "60ms",
                }}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-0 group-hover:opacity-15 transition-opacity duration-500 blur-3xl pointer-events-none"
                  style={{ background: AZUL }}
                />
                <div className="relative flex flex-col items-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 group-hover:rotate-3 mb-4"
                    style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                  >
                    <FileSpreadsheet size={26} />
                  </div>
                  <h3 className={`${jakarta.className} text-base font-bold text-slate-900 mb-2`}>
                    Importação em lote
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs mb-5">
                    Arrasta o teu ficheiro CSV (Excel) para carregar dezenas de eventos de uma só vez.
                  </p>
                  <div
                    className={`${jakarta.className} text-white text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm pointer-events-none`}
                    style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                  >
                    <Upload size={13} />
                    Selecionar CSV
                  </div>
                </div>
              </div>

              {/* Cadastro Manual */}
              <div
                className="relative bg-white border-2 border-slate-200/80 rounded-2xl p-7 text-center overflow-hidden group anim-fade-up transition-all hover:shadow-md"
                style={{ animationDelay: "120ms" }}
              >
                <div
                  className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-0 group-hover:opacity-15 transition-opacity duration-500 blur-3xl pointer-events-none"
                  style={{ background: VERDE }}
                />
                <div className="relative flex flex-col items-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 group-hover:rotate-3 mb-4"
                    style={{ background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})` }}
                  >
                    <Plus size={26} />
                  </div>
                  <h3 className={`${jakarta.className} text-base font-bold text-slate-900 mb-2`}>
                    Cadastro manual
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs mb-5">
                    Cria um evento único preenchendo o formulário completo de publicação.
                  </p>
                  <button
                    onClick={abrirFormManual}
                    className={`${jakarta.className} text-white text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}
                    style={{ background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})` }}
                  >
                    <Plus size={13} />
                    Criar evento manual
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de eventos */}
            <div
              className="space-y-3 anim-fade-up"
              style={{ animationDelay: "180ms" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
                  >
                    <CalendarIcon size={15} />
                  </div>
                  <div>
                    <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                      Eventos cadastrados
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Próximos eventos a partir de hoje
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border ml-2"
                    style={{
                      background: `${AZUL}10`,
                      color: AZUL,
                      borderColor: `${AZUL}25`,
                    }}
                  >
                    {eventosList.length}
                  </span>
                </div>

                {eventosList.length > 0 && (
                  <div className="relative w-full sm:w-72">
                    <Search
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Buscar título, local ou categoria..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className={`${inputCls} pl-10 pr-9`}
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
                )}
              </div>

              {loadingList ? (
                <Skeleton rows={4} />
              ) : eventosFiltrados.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl py-20 text-center shadow-sm anim-fade">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-white"
                    style={{
                      background: busca
                        ? `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`
                        : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                    }}
                  >
                    {busca ? <Search size={28} /> : <Inbox size={28} />}
                  </div>
                  <h3 className={`${jakarta.className} text-lg font-bold text-slate-800 mb-1.5`}>
                    {busca ? "Nenhum resultado" : "Nenhum evento cadastrado"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-5">
                    {busca
                      ? "Ajusta a pesquisa para encontrares eventos."
                      : "Importa um CSV ou cria o primeiro evento manualmente."}
                  </p>
                  {busca && (
                    <button
                      onClick={() => setBusca("")}
                      className={`${jakarta.className} text-[11px] font-bold px-4 py-2 rounded-xl text-white shadow-sm hover:shadow-md transition-all`}
                      style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                    >
                      Limpar pesquisa
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {eventosFiltrados.map((ev, idx) => (
                    <article
                      key={ev.id}
                      style={{ animationDelay: `${240 + idx * 30}ms` }}
                      className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 anim-fade-up"
                    >
                      <div
                        className="h-0.5"
                        style={{
                          background: ev.destaque
                            ? `linear-gradient(90deg, ${AMBAR}, ${AMBAR_LIGHT})`
                            : `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})`,
                        }}
                      />
                      <div className="p-4 flex flex-col sm:flex-row gap-4">
                        {/* Thumb */}
                        <div className="w-full sm:w-40 h-32 sm:h-24 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-200/60 bg-slate-100">
                          {ev.imagem_url ? (
                            <img
                              src={ev.imagem_url}
                              alt={ev.titulo}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-white"
                              style={{
                                background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                              }}
                            >
                              <CalendarIcon size={24} className="opacity-50" />
                            </div>
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {ev.destaque && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border"
                                style={{
                                  background: `${AMBAR}10`,
                                  color: AMBAR,
                                  borderColor: `${AMBAR}25`,
                                }}
                              >
                                <Star size={9} className="fill-current" /> Destaque
                              </span>
                            )}
                            {ev.categoria && <CategoriaBadge categoria={ev.categoria} />}
                            {ev.classificacao && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                                style={{
                                  background: "#F1F5F9",
                                  color: "#475569",
                                }}
                              >
                                <Shield size={9} /> {ev.classificacao}
                              </span>
                            )}
                          </div>

                          <h3
                            className={`${jakarta.className} text-sm font-bold text-slate-900 line-clamp-2 mb-1.5 leading-snug`}
                          >
                            {ev.titulo}
                          </h3>

                          {ev.subtitulo && (
                            <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                              {ev.subtitulo}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap mt-auto">
                            <span className="flex items-center gap-1">
                              <CalendarIcon size={10} /> {fmtData(ev.data)}
                            </span>
                            {ev.horario && (
                              <span className="flex items-center gap-1">
                                <Clock size={10} /> {ev.horario}
                              </span>
                            )}
                            <span className="flex items-center gap-1 truncate">
                              <MapPin size={10} /> {ev.local}
                            </span>
                            {ev.preco && (
                              <span className="flex items-center gap-1">
                                <Wallet size={10} /> {ev.preco}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex sm:flex-col gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => abrirFormEditar(ev)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#0078D4] hover:bg-[#0078D4]/10 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteEvento(ev.id)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#D13438] hover:bg-red-50 transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FASE: MANUAL                                                */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {fase === "manual" && (
          <div className="space-y-4 anim-fade-up">
            <div
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AMBAR}, ${AMBAR_LIGHT})` }} />
              <div
                className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
                style={{ background: `linear-gradient(135deg, ${AMBAR}06, ${AMBAR}02)` }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
                >
                  <CalendarIcon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                    {editando ? "Editar evento" : "Construtor de evento"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Preenche os dados base, logística e mídia do evento.
                  </p>
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                {/* Coluna 1: Informações Base */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                    >
                      <FileText size={12} />
                    </div>
                    <h4 className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                      Informações base
                    </h4>
                  </div>

                  <FormField label="Título do evento" icon={<Type size={11} />} required>
                    <input
                      value={formManual.titulo || ""}
                      onChange={(e) =>
                        setFormManual({ ...formManual, titulo: e.target.value })
                      }
                      className={inputCls}
                      placeholder="Ex: Festival de Verão"
                    />
                  </FormField>

                  <FormField label="Subtítulo" icon={<Hash size={11} />}>
                    <input
                      value={formManual.subtitulo || ""}
                      onChange={(e) =>
                        setFormManual({ ...formManual, subtitulo: e.target.value })
                      }
                      className={inputCls}
                      placeholder="Frase de chamariz..."
                    />
                  </FormField>

                  <FormField label="Descrição" icon={<FileText size={11} />}>
                    <textarea
                      value={formManual.descricao || ""}
                      onChange={(e) =>
                        setFormManual({ ...formManual, descricao: e.target.value })
                      }
                      rows={4}
                      className={`${inputCls} resize-y min-h-[100px]`}
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Categoria" icon={<Tag size={11} />}>
                      <input
                        value={formManual.categoria || ""}
                        onChange={(e) =>
                          setFormManual({ ...formManual, categoria: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Ex: Música, Cultura..."
                      />
                    </FormField>
                    <FormField label="Destaque" icon={<Star size={11} />}>
                      <select
                        value={String(formManual.destaque)}
                        onChange={(e) =>
                          setFormManual({ ...formManual, destaque: e.target.value })
                        }
                        className={inputCls}
                      >
                        <option value="false">Não</option>
                        <option value="true">Sim (Banner principal)</option>
                      </select>
                    </FormField>
                  </div>
                </div>

                {/* Coluna 2: Logística e mídia */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})` }}
                    >
                      <MapPin size={12} />
                    </div>
                    <h4 className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                      Logística e mídia
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Data" icon={<CalendarIcon size={11} />} required>
                      <input
                        type="date"
                        value={formManual.data || ""}
                        onChange={(e) =>
                          setFormManual({ ...formManual, data: e.target.value })
                        }
                        className={inputCls}
                      />
                    </FormField>
                    <FormField label="Horário de início" icon={<Clock size={11} />}>
                      <input
                        type="time"
                        value={formManual.horario || ""}
                        onChange={(e) =>
                          setFormManual({ ...formManual, horario: e.target.value })
                        }
                        className={inputCls}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Duração estimada" icon={<Clock size={11} />}>
                      <input
                        value={formManual.duracao || ""}
                        onChange={(e) =>
                          setFormManual({ ...formManual, duracao: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Ex: 3 dias, 4 horas..."
                      />
                    </FormField>
                    <FormField label="Classificação etária" icon={<Shield size={11} />}>
                      <input
                        value={formManual.classificacao || ""}
                        onChange={(e) =>
                          setFormManual({ ...formManual, classificacao: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Ex: Livre, +18..."
                      />
                    </FormField>
                  </div>

                  <FormField label="Local do evento" icon={<MapPin size={11} />} required>
                    <div className="relative">
                      <MapPin
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={formManual.local || ""}
                        onChange={(e) =>
                          setFormManual({ ...formManual, local: e.target.value })
                        }
                        className={`${inputCls} pl-10`}
                        placeholder="Ex: Praça Central"
                      />
                    </div>
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Preço" icon={<Wallet size={11} />}>
                      <input
                        value={formManual.preco || ""}
                        onChange={(e) =>
                          setFormManual({ ...formManual, preco: e.target.value })
                        }
                        className={inputCls}
                        placeholder="R$ 50,00 (ou vazio)"
                      />
                    </FormField>
                    <FormField label="Link bilheteira" icon={<Target size={11} />}>
                      <input
                        value={formManual.link_bilheteira || ""}
                        onChange={(e) =>
                          setFormManual({
                            ...formManual,
                            link_bilheteira: e.target.value,
                          })
                        }
                        className={inputCls}
                        placeholder="https://..."
                      />
                    </FormField>
                  </div>

                  <FormField label="Cartaz oficial (imagem)" icon={<ImageIcon size={11} />}>
                    <label
                      className="flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-xl p-5 cursor-pointer text-xs font-bold transition-all group"
                      style={{
                        background: imagemManual
                          ? `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)`
                          : "#F8FAFC",
                        borderColor: imagemManual ? `${VERDE}50` : "#CBD5E1",
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setImagemManual(e.target.files?.[0] || null)
                        }
                      />
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                        style={{
                          background: imagemManual
                            ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
                            : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                        }}
                      >
                        {imagemManual ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <Camera size={16} />
                        )}
                      </div>
                      <span
                        className="truncate max-w-[200px] text-center"
                        style={{ color: imagemManual ? VERDE : AZUL }}
                      >
                        {imagemManual
                          ? imagemManual.name
                          : formManual.imagem_url
                          ? "Substituir cartaz atual"
                          : "Clique para anexar cartaz"}
                      </span>
                    </label>

                    {formManual.imagem_url && !imagemManual && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <img
                          src={formManual.imagem_url}
                          alt="Cartaz atual"
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    )}
                  </FormField>
                </div>
              </div>

              {/* Footer de ação */}
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {feedback && (
                  <p
                    className="text-xs font-bold flex items-center gap-2"
                    style={{
                      color: feedback.toLowerCase().includes("erro")
                        ? VERMELHO
                        : feedback.toLowerCase().includes("sucesso")
                        ? VERDE
                        : AZUL,
                    }}
                  >
                    {feedback.toLowerCase().includes("erro") ? (
                      <AlertCircle size={13} />
                    ) : feedback.toLowerCase().includes("sucesso") ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <Loader2 size={13} className="animate-spin" />
                    )}
                    {feedback}
                  </p>
                )}

                <button
                  onClick={handleSalvarManual}
                  disabled={savingManual}
                  className={`${jakarta.className} sm:ml-auto text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0 shrink-0`}
                  style={{
                    background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                  }}
                >
                  {savingManual ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {savingManual
                    ? "A guardar..."
                    : editando
                    ? "Guardar edição"
                    : "Publicar evento"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FASE: PREVIEW (CSV)                                         */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {fase === "preview" && (
          <div className="space-y-5 anim-fade-up">
            {/* Banner âmbar */}
            <div
              className="rounded-2xl border-2 p-4 flex items-start gap-3.5 shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${AMBAR}08, ${AMBAR}02)`,
                borderColor: `${AMBAR}30`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
              >
                <AlertCircle size={16} />
              </div>
              <div className="text-xs leading-relaxed pt-1.5">
                <p className="font-bold text-slate-800">
                  Foram identificados{" "}
                  <strong style={{ color: AMBAR }}>{eventosPreview.length}</strong> eventos no
                  ficheiro!
                </p>
                <p className="text-slate-600 mt-1">
                  Anexa as fotos oficiais de cada um abaixo e clica no botão para guardar tudo
                  no portal.
                </p>
              </div>
            </div>

            {/* Cards de eventos */}
            <div className="space-y-3">
              {eventosPreview.map((ev, idx) => {
                const temImagem = !!imagensMap[idx];
                return (
                  <div
                    key={idx}
                    style={{ animationDelay: `${idx * 30}ms` }}
                    className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow anim-fade-up"
                  >
                    <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})` }} />
                    <div className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      {/* Numeração */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                      >
                        {idx + 1}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {ev.categoria && <CategoriaBadge categoria={ev.categoria} />}
                          {ev.data && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <CalendarIcon size={10} /> {fmtData(ev.data)}
                            </span>
                          )}
                          {ev.local && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                              <MapPin size={10} /> {ev.local}
                            </span>
                          )}
                        </div>
                        <h4 className={`${jakarta.className} text-sm font-bold text-slate-900 line-clamp-2 mb-1`}>
                          {ev.titulo}
                        </h4>
                        {ev.descricao && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {ev.descricao}
                          </p>
                        )}
                      </div>

                      {/* Upload */}
                      <label
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all text-[11px] font-bold border-2 shrink-0 w-full sm:w-auto justify-center"
                        style={{
                          background: temImagem
                            ? `linear-gradient(135deg, ${VERDE}08, ${VERDE}02)`
                            : "white",
                          borderColor: temImagem ? `${VERDE}40` : "#E2E8F0",
                          color: temImagem ? VERDE : AZUL,
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleImagemChange(idx, e.target.files[0]);
                            }
                          }}
                        />
                        {temImagem ? (
                          <>
                            <CheckCircle2 size={13} /> Imagem selecionada
                          </>
                        ) : (
                          <>
                            <Camera size={13} /> Anexar foto
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botão salvar tudo */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSalvarTudo}
                className={`${jakarta.className} text-white px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}
                style={{ background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})` }}
              >
                <Save size={14} />
                Salvar {eventosPreview.length} evento(s) no portal
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FASE: SALVANDO / SUCESSO                                    */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {(fase === "salvando" || fase === "sucesso") && (
          <div className="bg-white border border-slate-200/80 rounded-2xl py-20 text-center shadow-sm anim-fade-up max-w-2xl mx-auto">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md"
              style={{
                background:
                  fase === "salvando"
                    ? `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`
                    : `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`,
              }}
            >
              {fase === "salvando" ? (
                <Loader2 size={32} className="animate-spin text-white" />
              ) : (
                <CheckCircle2 size={32} className="text-white" />
              )}
            </div>

            <h3 className={`${jakarta.className} text-2xl font-extrabold text-slate-900 mb-2`}>
              {fase === "salvando"
                ? "A sincronizar calendário..."
                : "Evento(s) guardado(s) com sucesso!"}
            </h3>

            <p className="text-sm text-slate-500 font-medium mb-8 max-w-md mx-auto leading-relaxed px-4">
              {feedback}
            </p>

            {fase === "sucesso" && (
              <button
                onClick={resetar}
                className={`${jakarta.className} text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest inline-flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}
                style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
              >
                <RefreshCw size={13} />
                Voltar ao início
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Ícone "Type" (fallback) ───
function Type({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

// ─── Ícone "Shield" (fallback) ───
function Shield({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}