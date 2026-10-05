"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Calendar as CalendarIcon, AlertCircle, CheckCircle2, FileSpreadsheet,
  Plus, Loader2, Save, Image as ImageIcon, MapPin, Sparkles,
  Upload, ArrowLeft, Tag, Clock, Hash, Star, Pencil, Trash2,
  Inbox, Search, X, FileText, RefreshCw, Camera, Wallet,
  ExternalLink, MoreHorizontal, Filter, Copy, Eye, Ticket,
  Users, QrCode, ScanLine
} from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";

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

function gerarSlug(texto: string) {
  return texto
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface Evento {
  id: string;
  slug: string;
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
  requer_inscricao?: boolean;
  vagas_totais?: number;
  vagas_vendidas?: number;
  preco_numerico?: number;
}

interface Inscricao {
  id: string;
  evento_id: string;
  nome_participante: string;
  cpf: string;
  email: string;
  telefone: string;
  quantidade?: number;
  status: string;
  qrcode_token: string;
  criado_em: string;
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

function Panel({ children, className = "", noPad = false }: { children: React.ReactNode; className?: string; noPad?: boolean; }) {
  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`} style={{ borderColor: LINE }}>
      {noPad ? children : <div className="p-5">{children}</div>}
    </div>
  );
}

function PanelHeader({ title, subtitle, action, badge }: { title: string; subtitle?: string; action?: React.ReactNode; badge?: React.ReactNode; }) {
  return (
    <div className="px-5 py-3.5 flex items-center justify-between gap-3 border-b" style={{ borderColor: LINE, background: BG }}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>{title}</h3>
          {badge}
        </div>
        {subtitle && <p className="text-[11.5px] mt-0.5" style={{ color: MUTED }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function FormField({ label, icon, required, hint, children, className = "" }: { label: string; icon?: React.ReactNode; required?: boolean; hint?: string; children: React.ReactNode; className?: string; }) {
  return (
    <div className={className}>
      <label className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: MUTED }}>
        {icon} {label} {required && <span style={{ color: DANGER }}>*</span>}
      </label>
      {children}
      {hint && <p className="text-[10.5px] mt-1.5 leading-relaxed" style={{ color: SUBTLE }}>{hint}</p>}
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
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide" style={{ background: map.bg, color: map.c, border: `1px solid ${map.b}` }}>
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

export default function PortalEventos() {
  const [fase, setFase] = useState<"inicio" | "preview" | "salvando" | "sucesso" | "manual" | "inscritos">("inicio");
  const [eventosList, setEventosList] = useState<Evento[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroCat, setFiltroCat] = useState<string>("");

  const [eventosPreview, setEventosPreview] = useState<any[]>([]);
  const [imagensMap, setImagensMap] = useState<{ [key: number]: File }>({});
  const [feedback, setFeedback] = useState("");

  const [editando, setEditando] = useState<Evento | null>(null);
  const [formManual, setFormManual] = useState<any>({ destaque: false, categoria: "Cultura", requer_inscricao: false, vagas_totais: 0, preco_numerico: 0 });
  const [imagemManual, setImagemManual] = useState<File | null>(null);
  const [savingManual, setSavingManual] = useState(false);

  // 🔴 ESTADOS DOS INSCRITOS / SCANNER
  const [eventoAtual, setEventoAtual] = useState<Evento | null>(null);
  const [inscritosList, setInscritosList] = useState<Inscricao[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => { fetchEventos(); }, []);

  async function fetchEventos() {
    setLoadingList(true);
    const hoje = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("eventos").select("*").gte("data", hoje).order("data", { ascending: true });
    setEventosList(data || []);
    setLoadingList(false);
  }

  // ─── GESTÃO DE EVENTOS ───
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
      const linhas = text.split("\n").filter((linha) => linha.trim() !== "");
      if (linhas.length < 2) { alert("Ficheiro vazio ou sem cabeçalhos."); return; }
      const cabecalhos = linhas[0].toLowerCase().split(",").map((c) => c.trim());
      const eventosLidos = [];
      for (let i = 1; i < linhas.length; i++) {
        const valores = linhas[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const evento: any = {};
        cabecalhos.forEach((cabecalho, index) => {
          let valor = valores[index] ? valores[index].trim() : "";
          if (valor.startsWith('"') && valor.endsWith('"')) valor = valor.substring(1, valor.length - 1);
          evento[cabecalho] = valor;
        });
        if (evento.titulo) eventosLidos.push({ ...evento, destaque: false, data: evento.data || null });
      }
      setEventosPreview(eventosLidos);
      setFase("preview");
    };
    reader.readAsText(file);
  };

  const handleImagemChange = (index: number, file: File) => setImagensMap((prev) => ({ ...prev, [index]: file }));

  const handleSalvarTudo = async () => {
    setFase("salvando"); setFeedback("A iniciar sincronização...");
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
          const { error: uploadErr } = await supabase.storage.from("eventos").upload(nomeFicheiro, imagemFile);
          if (!uploadErr) {
            const { data: pubUrl } = supabase.storage.from("eventos").getPublicUrl(nomeFicheiro);
            imagem_url = pubUrl.publicUrl;
          }
        }
        const slug = gerarSlug(evento.titulo);
        const { error: dbError } = await supabase.from("eventos").insert([{
          titulo: evento.titulo, slug, subtitulo: evento.subtitulo || null, descricao: evento.descricao || null,
          data: evento.data || null, horario: evento.horario || null, local: evento.local || null,
          categoria: evento.categoria || "Cultura", preco: evento.preco || null, imagem_url: imagem_url || null,
          destaque: false, requer_inscricao: false
        }]);
        if (!dbError) sucessos++;
      } catch (err) { console.error(`Falha: ${evento.titulo}`, err); }
    }
    setFeedback(`${sucessos} de ${eventosPreview.length} eventos guardados com sucesso.`);
    setFase("sucesso");
  };

  const abrirFormManual = () => {
    setEditando(null); setFormManual({ destaque: false, categoria: "Cultura", requer_inscricao: false, vagas_totais: 0, preco_numerico: 0 });
    setImagemManual(null); setFeedback(""); setFase("manual");
  };

  const abrirFormEditar = (ev: Evento) => {
    setEditando(ev);
    setFormManual({
      titulo: ev.titulo || "", subtitulo: ev.subtitulo || "", descricao: ev.descricao || "", data: ev.data || "",
      horario: ev.horario || "", duracao: ev.duracao || "", local: ev.local || "", categoria: ev.categoria || "Cultura",
      preco: ev.preco || "", classificacao: ev.classificacao || "", link_bilheteira: ev.link_bilheteira || "",
      destaque: ev.destaque || false, imagem_url: ev.imagem_url || "", requer_inscricao: ev.requer_inscricao || false,
      vagas_totais: ev.vagas_totais || 0, preco_numerico: ev.preco_numerico || 0,
    });
    setImagemManual(null); setFeedback(""); setFase("manual");
  };

  const handleSalvarManual = async () => {
    if (!formManual.titulo || !formManual.data || !formManual.local) { alert("Título, Data e Local são obrigatórios."); return; }
    setSavingManual(true); setFeedback("A guardar evento...");
    try {
      let imagem_url = formManual.imagem_url;
      if (imagemManual) {
        const ext = imagemManual.name.split(".").pop();
        const nomeFicheiro = `evento_manual_${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("eventos").upload(nomeFicheiro, imagemManual);
        if (!uploadErr) {
          const { data: pubUrl } = supabase.storage.from("eventos").getPublicUrl(nomeFicheiro);
          imagem_url = pubUrl.publicUrl;
        } else throw new Error("Erro ao fazer upload do cartaz.");
      }
      const slug = gerarSlug(formManual.titulo);
      const payload = {
        titulo: formManual.titulo, slug, subtitulo: formManual.subtitulo || null, descricao: formManual.descricao || null,
        data: formManual.data, horario: formManual.horario || null, duracao: formManual.duracao || null, local: formManual.local,
        categoria: formManual.categoria, preco: formManual.preco || null, classificacao: formManual.classificacao || null,
        link_bilheteira: formManual.link_bilheteira || null, imagem_url: imagem_url || null,
        destaque: String(formManual.destaque) === "true", requer_inscricao: String(formManual.requer_inscricao) === "true",
        vagas_totais: parseInt(formManual.vagas_totais) || 0, preco_numerico: parseFloat(formManual.preco_numerico) || 0,
      };
      const { error: erroBd } = editando ? await supabase.from("eventos").update(payload).eq("id", editando.id) : await supabase.from("eventos").insert([payload]);
      if (erroBd) throw new Error(erroBd.message);
      setFeedback(editando ? "Evento atualizado." : "Evento publicado.");
      setFase("sucesso");
    } catch (err: any) { setFeedback(`Erro: ${err.message}`); } finally { setSavingManual(false); }
  };

  const resetar = () => {
    setFase("inicio"); setEventosPreview([]); setImagensMap({}); setFeedback(""); setEditando(null); setEventoAtual(null);
    fetchEventos();
  };

  // ─── 🔴 GESTÃO DE INSCRITOS & QR CODE ───
  const abrirInscritos = async (ev: Evento) => {
    setEventoAtual(ev);
    setFase("inscritos");
    await fetchInscritos(ev.id);
  };

  const fetchInscritos = async (eventoId: string) => {
    const { data, error } = await supabase
      .from("inscricoes_eventos")
      .select("*")
      .eq("evento_id", eventoId)
      .order("criado_em", { ascending: false });
      
    if (error) {
      alert("Erro ao buscar lista: " + error.message);
    }
    setInscritosList(data || []);
  };

  const handleScan = async (text: string) => {
    if (!text || !eventoAtual) return;
    
    // ◄── Limpa espaços invisíveis que a câmara possa ter captado
    const tokenLido = text.trim(); 
    
    const { data, error } = await supabase
      .from("inscricoes_eventos")
      .select("*")
      .eq("qrcode_token", tokenLido)
      .eq("evento_id", eventoAtual.id)
      .single();
    
    if (error || !data) {
      setScanResult({ type: "error", msg: `QR Code inválido: ${tokenLido.substring(0, 8)}... não encontrado.` });
      return;
    }
    
    if (data.status === "checkin_realizado") {
      setScanResult({ type: "warning", msg: `Atenção: O bilhete de ${data.nome_participante} já foi validado!` });
      return;
    }

    if (data.status !== "confirmado") {
      setScanResult({ type: "error", msg: `Acesso Negado: Pagamento de ${data.nome_participante} está pendente.` });
      return;
    }

    const { error: updateErr } = await supabase.from("inscricoes_eventos").update({ status: "checkin_realizado" }).eq("id", data.id);
    
    if (!updateErr) {
      setScanResult({ type: "success", msg: `✅ Check-in realizado! Liberada a entrada para ${data.nome_participante} (${data.quantidade || 1} pessoas).` });
      fetchInscritos(eventoAtual.id);
    } else {
      setScanResult({ type: "error", msg: "Erro ao comunicar com o servidor. Tente novamente." });
    }
  };

  // ─── FILTROS GERAIS ───
  const categoriasUnicas = Array.from(new Set(eventosList.map((e) => e.categoria).filter(Boolean)));
  const eventosFiltrados = eventosList.filter((ev) => {
    const termo = busca.toLowerCase();
    const passaBusca = !busca || ev.titulo?.toLowerCase().includes(termo) || ev.local?.toLowerCase().includes(termo) || ev.categoria?.toLowerCase().includes(termo);
    const passaCat = !filtroCat || ev.categoria === filtroCat;
    return passaBusca && passaCat;
  });

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-4 relative`}>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* HEADER                                                      */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 anim-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded" style={{ background: INK, color: "#FFF" }}>
                <CalendarIcon size={9} strokeWidth={3} /> Agenda
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {fase === "inscritos" ? "Controlo de Entrada" : `${eventosList.length} evento${eventosList.length !== 1 ? "s" : ""} futuros`}
              </span>
            </div>
            <h1 className={`${jakarta.className} text-[26px] font-bold tracking-tight`} style={{ color: INK, letterSpacing: "-0.025em" }}>
              {fase === "inscritos" ? "Lista de Participantes" : "Eventos"}
            </h1>
            <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
              {fase === "inscritos" ? `Valide ingressos na portaria do evento: ${eventoAtual?.titulo}` : "Gestão do calendário municipal — importação em lote ou cadastro individual."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {fase === "inicio" ? (
              <>
                <label className="h-9 px-3 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 border cursor-pointer transition-colors" style={{ borderColor: LINE, color: INK_2, background: SURFACE }} onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)} onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  <Upload size={13} /> <span className="hidden sm:inline">Importar CSV</span>
                </label>
                <button onClick={abrirFormManual} className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 text-white transition-colors" style={{ background: INK }} onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)} onMouseLeave={(e) => (e.currentTarget.style.background = INK)}>
                  <Plus size={14} strokeWidth={3} /> Novo evento
                </button>
              </>
            ) : (
              <button onClick={resetar} className="h-9 px-3 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 border transition-colors" style={{ borderColor: LINE, color: INK_2, background: SURFACE }} onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)} onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}>
                <ArrowLeft size={13} /> Voltar
              </button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FASE: INÍCIO                                                */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {fase === "inicio" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 anim-fade-up">
              <Panel className="anim-fade-up" noPad>
                <div className="px-4 py-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Total futuros</p>
                  <p className={`${jakarta.className} num text-[22px] font-bold mt-1.5 leading-none`} style={{ color: INK, letterSpacing: "-0.02em" }}>{eventosList.length}</p>
                </div>
              </Panel>
              <Panel className="anim-fade-up" noPad>
                <div className="px-4 py-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Em destaque</p>
                  <p className={`${jakarta.className} num text-[22px] font-bold mt-1.5 leading-none`} style={{ color: INK, letterSpacing: "-0.02em" }}>{eventosList.filter((e) => e.destaque).length}</p>
                </div>
              </Panel>
              <Panel className="anim-fade-up" noPad>
                <div className="px-4 py-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Categorias</p>
                  <p className={`${jakarta.className} num text-[22px] font-bold mt-1.5 leading-none`} style={{ color: INK, letterSpacing: "-0.02em" }}>{categoriasUnicas.length}</p>
                </div>
              </Panel>
              <Panel className="anim-fade-up" noPad>
                <div className="px-4 py-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Este mês</p>
                  <p className={`${jakarta.className} num text-[22px] font-bold mt-1.5 leading-none`} style={{ color: INK, letterSpacing: "-0.02em" }}>
                    {eventosList.filter((e) => { const hoje = new Date(); const [y, m] = e.data.split("-"); return parseInt(y) === hoje.getFullYear() && parseInt(m) === hoje.getMonth() + 1; }).length}
                  </p>
                </div>
              </Panel>
            </div>

            <Panel noPad className="anim-fade-up">
              <PanelHeader
                title="Calendário de eventos" subtitle="Ordenados pela data mais próxima"
                badge={<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded num" style={{ background: LINE_2, color: MUTED }}>{eventosFiltrados.length}</span>}
                action={
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)} className="h-8 pl-2.5 pr-7 rounded-md text-[12px] font-medium border appearance-none cursor-pointer transition-colors" style={{ borderColor: LINE, color: INK_2, background: SURFACE }}>
                        <option value="">Todas</option>
                        {categoriasUnicas.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <Filter size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: SUBTLE }} />
                    </div>
                    {eventosList.length > 0 && (
                      <div className="relative w-full sm:w-56">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: SUBTLE }} />
                        <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full h-8 pl-7 pr-7 rounded-md text-[12px] border transition-[border-color,box-shadow]" style={{ borderColor: LINE, color: INK, background: SURFACE }} onFocus={(e) => { e.currentTarget.style.borderColor = INK; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`; }} onBlur={(e) => { e.currentTarget.style.borderColor = LINE; e.currentTarget.style.boxShadow = "none"; }} />
                        {busca && (
                          <button onClick={() => setBusca("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center transition-colors" style={{ color: SUBTLE }} onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
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
                  {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 skeleton" />)}
                </div>
              ) : eventosFiltrados.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center" style={{ background: LINE_2, color: MUTED }}>
                    {busca || filtroCat ? <Search size={20} strokeWidth={2} /> : <Inbox size={20} strokeWidth={2} />}
                  </div>
                  <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>{busca || filtroCat ? "Nenhum resultado" : "Nenhum evento futuro"}</p>
                  <p className="text-[11.5px] mt-1 max-w-md mx-auto" style={{ color: MUTED }}>{busca || filtroCat ? "Ajusta os filtros para encontrar eventos." : "Importa um CSV ou cria um evento manualmente."}</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: LINE_2 }}>
                  {eventosFiltrados.map((ev, idx) => {
                    const { dia, mes } = fmtDataCurta(ev.data);
                    return (
                      <div key={ev.id} style={{ animationDelay: `${idx * 15}ms` }} className="relative grid grid-cols-[auto_auto_1fr_auto] items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAFB] transition-colors group anim-fade-up">
                        {ev.destaque && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 rounded-r" style={{ background: WARNING }} />}
                        
                        <div className="w-11 h-11 rounded-md flex flex-col items-center justify-center shrink-0" style={{ background: ev.destaque ? WARNING : INK, color: "#FFF" }}>
                          <span className="text-[9px] font-bold tracking-wider leading-none mb-0.5 opacity-80">{mes}</span>
                          <span className={`${jakarta.className} num text-[15px] font-bold leading-none`}>{dia}</span>
                        </div>

                        <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 border hidden sm:block" style={{ borderColor: LINE, background: LINE_2 }}>
                          {ev.imagem_url ? <img src={ev.imagem_url} alt={ev.titulo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ color: SUBTLE }}><CalendarIcon size={16} strokeWidth={1.5} /></div>}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {ev.destaque && <StatusPill tone="warning"><Star size={8} className="fill-current" /> Destaque</StatusPill>}
                            {ev.requer_inscricao && <StatusPill tone="info"><Ticket size={8} className="fill-current" /> Bilheteira Ativa</StatusPill>}
                            {ev.categoria && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide" style={{ background: LINE_2, color: MUTED, border: `1px solid ${LINE}` }}><Tag size={8} />{ev.categoria}</span>}
                          </div>
                          <p className={`${jakarta.className} text-[13.5px] font-bold leading-snug truncate`} style={{ color: INK }}>{ev.titulo}</p>
                          <div className="flex items-center gap-3 text-[10.5px] flex-wrap mt-1.5 num" style={{ color: SUBTLE }}>
                            <span className="flex items-center gap-1 truncate max-w-[240px]"><MapPin size={10} />{ev.local}</span>
                            {ev.preco && !ev.requer_inscricao && <span className="flex items-center gap-1"><Wallet size={10} />{ev.preco}</span>}
                            {ev.requer_inscricao && <span className="flex items-center gap-1 font-semibold text-emerald-600"><Users size={10} /> Vagas: {ev.vagas_vendidas}/{ev.vagas_totais}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          
                          {/* 🔴 NOVO BOTÃO PARA ABRIR LISTA DE INSCRITOS */}
                          {ev.requer_inscricao && (
                            <button onClick={() => abrirInscritos(ev)} className="w-8 h-8 rounded-md flex items-center justify-center transition-colors" style={{ color: ACCENT }} onMouseEnter={(e) => { e.currentTarget.style.background = "#DBEAFE"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }} title="Ver Inscritos e Validar Bilhetes">
                              <QrCode size={14} />
                            </button>
                          )}

                          <button onClick={() => abrirFormEditar(ev)} className="w-8 h-8 rounded-md flex items-center justify-center transition-colors" style={{ color: SUBTLE }} onMouseEnter={(e) => { e.currentTarget.style.background = LINE_2; e.currentTarget.style.color = INK; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = SUBTLE; }} title="Editar">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDeleteEvento(ev.id)} className="w-8 h-8 rounded-md flex items-center justify-center transition-colors" style={{ color: SUBTLE }} onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = DANGER; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = SUBTLE; }} title="Remover">
                            <Trash2 size={13} />
                          </button>
                          <a href={`/eventos/${ev.slug}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-md flex items-center justify-center transition-colors" style={{ color: SUBTLE }} onMouseEnter={(e) => { e.currentTarget.style.background = LINE_2; e.currentTarget.style.color = INK; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = SUBTLE; }} title="Ver no site público">
                            <ExternalLink size={13} />
                          </a>
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
        {/* 🔴 NOVA FASE: LISTA DE INSCRITOS E LEITOR QR CODE             */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {fase === "inscritos" && eventoAtual && (
          <div className="space-y-4 anim-fade-up">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Panel className="anim-fade-up" noPad>
                <div className="px-5 py-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Ingressos Vendidos</p>
                  <p className={`${jakarta.className} num text-[26px] font-bold mt-1.5 leading-none`} style={{ color: INK }}>{eventoAtual.vagas_vendidas} <span className="text-sm font-medium text-slate-400">/ {eventoAtual.vagas_totais}</span></p>
                </div>
              </Panel>
              <Panel className="anim-fade-up" noPad>
                <div className="px-5 py-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Check-ins Realizados</p>
                  <p className={`${jakarta.className} num text-[26px] font-bold mt-1.5 leading-none text-emerald-600`}>
                    {inscritosList.filter(i => i.status === 'checkin_realizado').length}
                  </p>
                </div>
              </Panel>
              <button onClick={() => { setShowScanner(true); setScanResult(null); }} className="anim-fade-up bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-5 py-4 flex flex-col justify-center transition-colors border border-transparent">
                <div className="flex items-center gap-2 mb-1.5">
                  <ScanLine size={16} />
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-300">Portaria</p>
                </div>
                <p className={`${jakarta.className} text-[18px] font-bold leading-none`}>Ler QR Code</p>
              </button>
            </div>

            <Panel noPad>
              <PanelHeader title="Lista Oficial de Participantes" subtitle={`Inscritos em ${eventoAtual.titulo}`} badge={<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded num" style={{ background: LINE_2, color: MUTED }}>{inscritosList.length}</span>} />
              <div className="divide-y" style={{ borderColor: LINE_2 }}>
                {inscritosList.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-500">Nenhum participante registrado até ao momento.</div>
                ) : (
                  inscritosList.map((insc, idx) => (
                    <div key={insc.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className="min-w-0">
                        <p className={`${jakarta.className} text-[13.5px] font-bold text-slate-900 truncate`}>{insc.nome_participante}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{insc.email} • {insc.telefone}</p>
                      </div>
                      <div className="text-center px-4 hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Qtd</p>
                        <p className="text-sm font-bold text-slate-700">{insc.quantidade || 1}</p>
                      </div>
                      <div className="flex items-center justify-end w-32">
                        {insc.status === "confirmado" && <StatusPill tone="success">Confirmado</StatusPill>}
                        {insc.status === "checkin_realizado" && <StatusPill tone="info">Entrou</StatusPill>}
                        {insc.status === "aguardando_pagamento" && <StatusPill tone="warning">Pendente</StatusPill>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
            
            {/* Modal de Scanner */}
            {showScanner && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl anim-fade-up">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className={`${jakarta.className} font-bold text-slate-800`}>Aproximar Bilhete</h3>
                    <button onClick={() => { setShowScanner(false); setScanResult(null); }} className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg"><X size={16} /></button>
                  </div>
                  
                  <div className="bg-black aspect-square relative flex items-center justify-center">
                    <Scanner 
                      onScan={(result) => {
                        if (result && result.length > 0) {
                          handleScan(result[0].rawValue);
                        }
                      }}
                      components={{ audio: false, finder: true }}
                    />
                  </div>
                  
                  <div className="p-5 bg-slate-50 min-h-[100px] flex items-center justify-center">
                    {scanResult ? (
                      <div className={`p-3.5 rounded-xl text-sm font-semibold flex items-start gap-2.5 w-full border ${scanResult.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : scanResult.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {scanResult.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                        <p className="leading-snug">{scanResult.msg}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 font-medium text-center">Aponte a câmara para o QR Code do telemóvel do cidadão.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* AS FASES RESTANTES (Manual, Preview, etc) MANTÊM-SE INTACTAS */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {fase === "manual" && (
          <div className="space-y-4 anim-fade-up">
            <div className="flex items-center gap-3">
              <button onClick={resetar} className="w-9 h-9 rounded-md flex items-center justify-center transition-colors shrink-0 border" style={{ borderColor: LINE, color: MUTED, background: SURFACE }} onMouseEnter={(e) => { e.currentTarget.style.background = LINE_2; e.currentTarget.style.color = INK; }} onMouseLeave={(e) => { e.currentTarget.style.background = SURFACE; e.currentTarget.style.color = MUTED; }} aria-label="Voltar">
                <ArrowLeft size={16} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded" style={{ background: INK, color: "#FFF" }}>
                    <CalendarIcon size={9} strokeWidth={3} /> {editando ? "Editar" : "Novo"}
                  </span>
                  <span className="text-[11px]" style={{ color: MUTED }}>{editando ? `Criado em ${fmtData(editando.data)}` : "Rascunho"}</span>
                </div>
                <h2 className={`${jakarta.className} text-[20px] font-bold tracking-tight truncate`} style={{ color: INK, letterSpacing: "-0.02em" }}>
                  {editando ? editando.titulo : "Novo evento"}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8 space-y-4">
                <Panel noPad>
                  <PanelHeader title="Informações" subtitle="Título, subtítulo e descrição" />
                  <div className="p-5 space-y-4">
                    <FormField label="Título" icon={<FileText size={10} />} required>
                      <input value={formManual.titulo || ""} onChange={(e) => setFormManual({ ...formManual, titulo: e.target.value })} className={inputCls} style={{ borderColor: LINE }} placeholder="Ex: Festival de Verão" />
                    </FormField>
                    <FormField label="Subtítulo" icon={<Hash size={10} />}>
                      <input value={formManual.subtitulo || ""} onChange={(e) => setFormManual({ ...formManual, subtitulo: e.target.value })} className={inputCls} style={{ borderColor: LINE }} placeholder="Frase de chamariz..." />
                    </FormField>
                    <FormField label="Descrição" icon={<FileText size={10} />}>
                      <textarea value={formManual.descricao || ""} onChange={(e) => setFormManual({ ...formManual, descricao: e.target.value })} rows={5} className={`${inputCls} resize-y min-h-[110px]`} style={{ borderColor: LINE }} placeholder="Descrição detalhada do evento..." />
                    </FormField>
                  </div>
                </Panel>

                <Panel noPad>
                  <PanelHeader title="Logística" subtitle="Local, data e hora" />
                  <div className="p-5 grid grid-cols-2 gap-4">
                    <FormField label="Data" icon={<CalendarIcon size={10} />} required>
                      <input type="date" value={formManual.data || ""} onChange={(e) => setFormManual({ ...formManual, data: e.target.value })} className={inputCls} style={{ borderColor: LINE }} />
                    </FormField>
                    <FormField label="Hora de início" icon={<Clock size={10} />}>
                      <input type="time" value={formManual.horario || ""} onChange={(e) => setFormManual({ ...formManual, horario: e.target.value })} className={inputCls} style={{ borderColor: LINE }} />
                    </FormField>
                    <FormField label="Duração" icon={<Clock size={10} />}>
                      <input value={formManual.duracao || ""} onChange={(e) => setFormManual({ ...formManual, duracao: e.target.value })} className={inputCls} style={{ borderColor: LINE }} placeholder="Ex: 3 dias" />
                    </FormField>
                    <FormField label="Classificação" icon={<Tag size={10} />}>
                      <input value={formManual.classificacao || ""} onChange={(e) => setFormManual({ ...formManual, classificacao: e.target.value })} className={inputCls} style={{ borderColor: LINE }} placeholder="Ex: Livre, +18" />
                    </FormField>
                    <FormField label="Local" icon={<MapPin size={10} />} required className="col-span-2">
                      <input value={formManual.local || ""} onChange={(e) => setFormManual({ ...formManual, local: e.target.value })} className={inputCls} style={{ borderColor: LINE }} placeholder="Ex: Praça Central, Teatro Municipal..." />
                    </FormField>
                  </div>
                </Panel>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <Panel noPad>
                  <PanelHeader title="Bilheteira Digital" subtitle="Venda de ingressos via PIX" />
                  <div className="p-5 space-y-4">
                    <FormField label="Exige Inscrição / Pagamento?" icon={<Ticket size={10} />}>
                      <select value={String(formManual.requer_inscricao)} onChange={(e) => setFormManual({ ...formManual, requer_inscricao: e.target.value === "true" })} className={inputCls} style={{ borderColor: LINE }}>
                        <option value="false">Não (Aberto ao Público)</option>
                        <option value="true">Sim (Vender Bilhetes no Site)</option>
                      </select>
                    </FormField>
                    {String(formManual.requer_inscricao) === "true" && (
                      <div className="grid grid-cols-2 gap-3 anim-fade-up">
                        <FormField label="Total Vagas" icon={<Hash size={10} />}>
                          <input type="number" min="1" value={formManual.vagas_totais || 0} onChange={(e) => setFormManual({ ...formManual, vagas_totais: e.target.value })} className={inputCls} style={{ borderColor: LINE }} />
                        </FormField>
                        <FormField label="Preço (R$)" icon={<Wallet size={10} />}>
                          <input type="number" step="0.01" min="0" value={formManual.preco_numerico || 0} onChange={(e) => setFormManual({ ...formManual, preco_numerico: e.target.value })} className={inputCls} style={{ borderColor: LINE }} />
                        </FormField>
                      </div>
                    )}
                    {!formManual.requer_inscricao && (
                      <FormField label="Link Externo (Opcional)" icon={<ExternalLink size={10} />} hint="Usar apenas se a venda for num site terceiro (Sympla, etc).">
                        <input value={formManual.link_bilheiteira || formManual.link_bilheteira || ""} onChange={(e) => setFormManual({ ...formManual, link_bilheteira: e.target.value })} className={inputCls} style={{ borderColor: LINE }} placeholder="https://..." />
                      </FormField>
                    )}
                  </div>
                </Panel>

                <Panel noPad>
                  <PanelHeader title="Publicação" subtitle="Categoria e visibilidade" />
                  <div className="p-5 space-y-4">
                    <FormField label="Categoria" icon={<Tag size={10} />}>
                      <input value={formManual.categoria || ""} onChange={(e) => setFormManual({ ...formManual, categoria: e.target.value })} className={inputCls} style={{ borderColor: LINE }} placeholder="Ex: Cultura, Música..." />
                    </FormField>
                    {!formManual.requer_inscricao && (
                      <FormField label="Etiqueta de Preço" icon={<Wallet size={10} />} hint="Texto livre para eventos sem bilheteira digital.">
                        <input value={formManual.preco || ""} onChange={(e) => setFormManual({ ...formManual, preco: e.target.value })} className={inputCls} style={{ borderColor: LINE }} placeholder="Ex: Grátis, Colaborativo" />
                      </FormField>
                    )}
                    <FormField label="Destaque" icon={<Star size={10} />}>
                      <select value={String(formManual.destaque)} onChange={(e) => setFormManual({ ...formManual, destaque: e.target.value })} className={inputCls} style={{ borderColor: LINE }}>
                        <option value="false">Normal</option>
                        <option value="true">Banner principal</option>
                      </select>
                    </FormField>
                  </div>
                </Panel>

                <Panel noPad>
                  <PanelHeader title="Cartaz" subtitle="Imagem oficial" />
                  <div className="p-5">
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md p-5 cursor-pointer text-[12px] font-semibold transition-colors" style={{ background: imagemManual ? "#ECFDF5" : BG, borderColor: imagemManual ? `${SUCCESS}50` : LINE, color: imagemManual ? SUCCESS : MUTED }}>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setImagemManual(e.target.files?.[0] || null)} />
                      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: imagemManual ? SUCCESS : LINE_2, color: imagemManual ? "#FFF" : MUTED }}>
                        {imagemManual ? <CheckCircle2 size={14} /> : <Camera size={14} />}
                      </div>
                      <span className="truncate max-w-[200px] text-center">
                        {imagemManual ? imagemManual.name : formManual.imagem_url ? "Substituir cartaz" : "Anexar cartaz"}
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
                  <div className="rounded-lg border p-3.5 flex items-start gap-3 anim-fade-up" style={{ background: feedback.toLowerCase().includes("erro") || feedback.toLowerCase().includes("obrigat") ? "#FEF2F2" : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("publicado") || feedback.toLowerCase().includes("atualizado") ? "#ECFDF5" : "#EFF6FF", borderColor: feedback.toLowerCase().includes("erro") || feedback.toLowerCase().includes("obrigat") ? "#FEE2E2" : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("publicado") || feedback.toLowerCase().includes("atualizado") ? "#D1FAE5" : "#DBEAFE", color: feedback.toLowerCase().includes("erro") || feedback.toLowerCase().includes("obrigat") ? DANGER : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("publicado") || feedback.toLowerCase().includes("atualizado") ? SUCCESS : ACCENT }}>
                    {feedback.toLowerCase().includes("erro") || feedback.toLowerCase().includes("obrigat") ? <AlertCircle size={14} className="shrink-0 mt-0.5" /> : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("publicado") || feedback.toLowerCase().includes("atualizado") ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <Loader2 size={14} className="shrink-0 mt-0.5 animate-spin" />}
                    <p className="text-[12.5px] font-medium">{feedback}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={resetar} className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold border transition-colors" style={{ borderColor: LINE, color: INK_2, background: SURFACE }} onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)} onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}>Cancelar</button>
              <button onClick={handleSalvarManual} disabled={savingManual} className="h-9 px-4 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors disabled:opacity-50" style={{ background: INK }} onMouseEnter={(e) => !savingManual && (e.currentTarget.style.background = INK_2)} onMouseLeave={(e) => !savingManual && (e.currentTarget.style.background = INK)}>
                {savingManual ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} {savingManual ? "A guardar..." : editando ? "Guardar" : "Publicar evento"}
              </button>
            </div>
          </div>
        )}

        {fase === "preview" && (
          <div className="space-y-4 anim-fade-up">
            <Panel noPad>
              <PanelHeader title="Pré-visualização" subtitle="Confirma os dados antes de sincronizar" badge={<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded num" style={{ background: LINE_2, color: MUTED }}>{eventosPreview.length}</span>} />
              <div className="divide-y scroll-thin max-h-[600px] overflow-y-auto" style={{ borderColor: LINE_2 }}>
                {eventosPreview.map((ev, idx) => {
                  const { dia, mes } = fmtDataCurta(ev.data);
                  return (
                    <div key={idx} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3.5 anim-fade-up">
                      <div className="w-11 h-11 rounded-md flex flex-col items-center justify-center shrink-0" style={{ background: INK, color: "#FFF" }}>
                        <span className="text-[9px] font-bold tracking-wider leading-none mb-0.5 opacity-80">{mes || "—"}</span>
                        <span className={`${jakarta.className} num text-[15px] font-bold leading-none`}>{dia || idx + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className={`${jakarta.className} text-[13.5px] font-bold leading-snug truncate`} style={{ color: INK }}>{ev.titulo}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3.5 flex items-center justify-end border-t" style={{ borderColor: LINE, background: BG }}>
                <button onClick={handleSalvarTudo} className="h-9 px-4 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors" style={{ background: INK }}>
                  <Save size={13} /> Guardar {eventosPreview.length} evento{eventosPreview.length !== 1 ? "s" : ""}
                </button>
              </div>
            </Panel>
          </div>
        )}

        {(fase === "salvando" || fase === "sucesso") && (
          <Panel noPad className="anim-fade-up max-w-2xl mx-auto">
            <div className="py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ background: fase === "salvando" ? INK : SUCCESS, color: "#FFF" }}>
                {fase === "salvando" ? <Loader2 size={22} className="animate-spin" /> : <CheckCircle2 size={22} />}
              </div>
              <h3 className={`${jakarta.className} text-[18px] font-bold tracking-tight mb-1.5`} style={{ color: INK, letterSpacing: "-0.02em" }}>
                {fase === "salvando" ? "A sincronizar..." : "Tudo guardado"}
              </h3>
              <p className="text-[12.5px] mb-6 max-w-md mx-auto leading-relaxed" style={{ color: MUTED }}>{feedback}</p>
              {fase === "sucesso" && (
                <button onClick={resetar} className="h-9 px-4 rounded-md text-[12.5px] font-semibold inline-flex items-center gap-2 text-white transition-colors" style={{ background: INK }}>
                  <RefreshCw size={13} /> Voltar à lista
                </button>
              )}
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}