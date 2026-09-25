"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Loader2, MessageSquare, FileText, Save, UploadCloud,
  ArrowLeft, User, Mail, Phone, IdCard, Calendar,
  ExternalLink, Inbox, Search, X, Clock, CheckCircle2,
  AlertTriangle, Info, Send, Paperclip, CheckCircle,
  Circle, Target, Headset, ArrowRight,
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

function fmtDatetime(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("pt-BR") +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

function tempoRelativo(iso: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const agora = new Date();
    const diffMs = agora.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `há ${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `há ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "ontem";
    if (diffD < 7) return `há ${diffD}d`;
    return fmtDatetime(iso);
  } catch {
    return "—";
  }
}

// ─── ESTILO POR STATUS ───
const STATUS_MAP: Record<
  string,
  { cor: string; bg: string; border: string; icone: any; label: string }
> = {
  Aberto: {
    cor: DANGER,
    bg: "#FEF2F2",
    border: "#FEE2E2",
    icone: Circle,
    label: "Aberto",
  },
  "Em andamento": {
    cor: WARNING,
    bg: "#FFFBEB",
    border: "#FEF3C7",
    icone: Clock,
    label: "Em andamento",
  },
  Concluído: {
    cor: SUCCESS,
    bg: "#ECFDF5",
    border: "#D1FAE5",
    icone: CheckCircle2,
    label: "Concluído",
  },
};

function getStatusInfo(status: string) {
  return STATUS_MAP[status] || STATUS_MAP.Aberto;
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
      @keyframes pulseDot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.85); }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .anim-fade-up { animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .anim-fade { animation: fadeIn 0.2s ease both; }
      .num { font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
      .dot-pulse { animation: pulseDot 2s ease-in-out infinite; }
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

function FeedbackInline({ feedback }: { feedback: string }) {
  if (!feedback) return null;

  const isErro = feedback.toLowerCase().includes("erro");
  const isSucesso =
    feedback.toLowerCase().includes("sucesso") ||
    feedback.toLowerCase().includes("enviada") ||
    feedback.toLowerCase().includes("atualizado");
  const tone = isErro ? "error" : isSucesso ? "success" : "info";

  const map = {
    error: { c: DANGER, bg: "#FEF2F2", b: "#FEE2E2", Icon: AlertTriangle },
    success: { c: SUCCESS, bg: "#ECFDF5", b: "#D1FAE5", Icon: CheckCircle2 },
    info: { c: ACCENT, bg: "#EFF6FF", b: "#DBEAFE", Icon: Loader2 },
  }[tone];

  const Icone = map.Icon;
  const isSpinner = tone === "info";

  return (
    <div
      className="rounded-md p-3.5 flex items-start gap-2.5 border anim-fade"
      style={{ background: map.bg, borderColor: map.b, color: map.c }}
    >
      <Icone size={14} className={`shrink-0 mt-0.5 ${isSpinner ? "animate-spin" : ""}`} />
      <p className="text-[12.5px] font-medium break-words">{feedback}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA
// ═══════════════════════════════════════════════════════════════

export default function PortalSuporte() {
  const [chamados, setChamados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"Todos" | "Aberto" | "Em andamento" | "Concluído">("Todos");

  const [chamadoAberto, setChamadoAberto] = useState<any | null>(null);
  const [resposta, setResposta] = useState("");
  const [arquivoAdmin, setArquivoAdmin] = useState<File | null>(null);
  const [statusAtual, setStatusAtual] = useState("");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => { fetchChamados(); }, []);

  async function fetchChamados() {
    setLoading(true);
    const { data } = await supabase
      .from("suporte")
      .select("*")
      .order("criado_em", { ascending: false });
    setChamados(data || []);
    setLoading(false);
  }

  function abrirChamado(c: any) {
    setChamadoAberto(c);
    setStatusAtual(c.status);
    setResposta("");
    setArquivoAdmin(null);
    setFeedback("");
  }

  async function handleResponder() {
    if (!resposta && statusAtual === chamadoAberto.status) {
      setFeedback("Escreva uma resposta ou mude o status para salvar.");
      return;
    }

    setSaving(true);
    setFeedback("Enviando resposta...");

    try {
      let linkAnexoAdmin = null;

      if (arquivoAdmin) {
        const ext = arquivoAdmin.name.split(".").pop();
        const path = `respostas_suporte/${chamadoAberto.protocolo}_${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from("galeria")
          .upload(path, arquivoAdmin);
        if (!error) {
          const { data: pubUrl } = supabase.storage.from("galeria").getPublicUrl(path);
          linkAnexoAdmin = pubUrl.publicUrl;
        }
      }

      const { error: dbError } = await supabase
        .from("suporte")
        .update({
          status: statusAtual,
          resposta_admin: resposta || chamadoAberto.resposta_admin,
        })
        .eq("id", chamadoAberto.id);

      if (dbError) throw dbError;

      if (resposta) {
        const resp = await fetch(
          "https://sagaturismo-production.up.railway.app/api/v1/suporte/responder",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: chamadoAberto.email,
              nome: chamadoAberto.nome,
              protocolo: chamadoAberto.protocolo,
              resposta: resposta,
              link_anexo: linkAnexoAdmin,
            }),
          }
        );
        if (!resp.ok) throw new Error("Falha ao disparar o e-mail.");
      }

      setFeedback("Resposta enviada e status atualizado.");
      setTimeout(() => {
        setChamadoAberto(null);
        fetchChamados();
      }, 1500);
    } catch (err: any) {
      setFeedback(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  const contadores = useMemo(() => ({
    total: chamados.length,
    abertos: chamados.filter((c) => c.status === "Aberto").length,
    andamento: chamados.filter((c) => c.status === "Em andamento").length,
    concluidos: chamados.filter((c) => c.status === "Concluído").length,
  }), [chamados]);

  const chamadosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return chamados.filter((c) => {
      const passaStatus = filtroStatus === "Todos" || c.status === filtroStatus;
      const passaBusca =
        !termo ||
        c.protocolo?.toLowerCase().includes(termo) ||
        c.nome?.toLowerCase().includes(termo) ||
        c.assunto?.toLowerCase().includes(termo);
      return passaStatus && passaBusca;
    });
  }, [chamados, busca, filtroStatus]);

  const temFiltro = busca || filtroStatus !== "Todos";

  // ═══════════════════════════════════════════════════════════════
  // VISTA: DETALHE
  // ═══════════════════════════════════════════════════════════════

  if (chamadoAberto) {
    return (
      <>
        <GlobalStyles />
        <div className={`${inter.className} space-y-4`}>

          {/* Header */}
          <div className="flex items-center gap-3 anim-fade-up">
            <button
              onClick={() => setChamadoAberto(null)}
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
                  <Headset size={9} strokeWidth={3} />
                  Ticket
                </span>
                <StatusPill status={chamadoAberto.status} />
              </div>
              <h1
                className={`${jakarta.className} text-[22px] font-bold tracking-tight truncate font-mono`}
                style={{ color: INK, letterSpacing: "-0.02em" }}
              >
                {chamadoAberto.protocolo}
              </h1>
              <p className="text-[11.5px] mt-0.5 flex items-center gap-1.5 num" style={{ color: MUTED }}>
                <Calendar size={10} />
                Enviado em {fmtDatetime(chamadoAberto.criado_em)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Coluna principal — mensagem + resposta */}
            <div className="lg:col-span-8 space-y-4">

              {/* Mensagem original */}
              <Panel noPad className="anim-fade-up">
                <PanelHeader
                  title="Mensagem original"
                  subtitle={`Assunto: ${chamadoAberto.assunto}`}
                />
                <div className="p-5 space-y-4">
                  <div
                    className="rounded-md p-4 text-[13px] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto scroll-thin"
                    style={{ background: BG, border: `1px solid ${LINE}`, color: INK_2 }}
                  >
                    {chamadoAberto.mensagem}
                  </div>

                  {chamadoAberto.arquivo_url && (
                    <a
                      href={chamadoAberto.arquivo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-[12.5px] font-semibold h-9 px-3 rounded-md border transition-colors"
                      style={{ background: SURFACE, borderColor: LINE, color: INK }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}
                    >
                      <Paperclip size={13} />
                      Ver anexo do cidadão
                      <ExternalLink size={11} style={{ color: SUBTLE }} />
                    </a>
                  )}
                </div>
              </Panel>

              {/* Resposta admin anterior */}
              {chamadoAberto.resposta_admin && (
                <Panel noPad className="anim-fade-up">
                  <PanelHeader
                    title="Última resposta do admin"
                    subtitle="Registrada no histórico do chamado"
                  />
                  <div className="p-5">
                    <div
                      className="rounded-md p-4 text-[13px] leading-relaxed whitespace-pre-wrap"
                      style={{ background: "#EFF6FF", border: "1px solid #DBEAFE", color: INK_2 }}
                    >
                      {chamadoAberto.resposta_admin}
                    </div>
                  </div>
                </Panel>
              )}

              {/* Painel de resposta */}
              <Panel noPad className="anim-fade-up">
                <PanelHeader
                  title="Responder ao cidadão"
                  subtitle="A resposta será enviada por e-mail"
                  badge={
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
                      style={{ background: LINE_2, color: MUTED, border: `1px solid ${LINE}` }}
                    >
                      <Send size={9} />
                      E-mail
                    </span>
                  }
                />
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label
                        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1.5"
                        style={{ color: MUTED }}
                      >
                        <MessageSquare size={10} />
                        Resposta
                      </label>
                      <textarea
                        rows={6}
                        value={resposta}
                        onChange={(e) => setResposta(e.target.value)}
                        className={`${inputCls} resize-y min-h-[140px]`}
                        style={{ borderColor: LINE }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = INK;
                          e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = LINE;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        placeholder="Escreva a resposta ao cidadão..."
                      />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label
                          className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1.5"
                          style={{ color: MUTED }}
                        >
                          <Target size={10} />
                          Status
                        </label>
                        <select
                          value={statusAtual}
                          onChange={(e) => setStatusAtual(e.target.value)}
                          className={inputCls}
                          style={{ borderColor: LINE }}
                        >
                          <option value="Aberto">Aberto</option>
                          <option value="Em andamento">Em andamento</option>
                          <option value="Concluído">Concluído</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1.5"
                          style={{ color: MUTED }}
                        >
                          <Paperclip size={10} />
                          Anexo
                        </label>
                        <label
                          className="flex items-center justify-center gap-1.5 border-2 border-dashed rounded-md h-[42px] px-3 cursor-pointer text-[11.5px] font-semibold transition-colors"
                          style={{
                            background: arquivoAdmin ? "#ECFDF5" : SURFACE,
                            borderColor: arquivoAdmin ? "#D1FAE5" : LINE,
                            color: arquivoAdmin ? SUCCESS : MUTED,
                          }}
                        >
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => setArquivoAdmin(e.target.files?.[0] || null)}
                          />
                          {arquivoAdmin ? (
                            <>
                              <CheckCircle size={13} />
                              Pronto
                            </>
                          ) : (
                            <>
                              <UploadCloud size={13} />
                              Anexar
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  {feedback && <FeedbackInline feedback={feedback} />}

                  <div
                    className="pt-4 border-t flex items-center justify-between gap-3 flex-wrap"
                    style={{ borderColor: LINE }}
                  >
                    <p className="text-[11.5px] flex items-center gap-1.5" style={{ color: MUTED }}>
                      <Info size={12} />
                      O cidadão receberá a resposta no e-mail cadastrado.
                    </p>
                    <button
                      onClick={handleResponder}
                      disabled={saving}
                      className="h-10 px-4 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors disabled:opacity-50 shrink-0"
                      style={{ background: INK }}
                      onMouseEnter={(e) => !saving && (e.currentTarget.style.background = INK_2)}
                      onMouseLeave={(e) => !saving && (e.currentTarget.style.background = INK)}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Save size={13} />
                          Salvar e enviar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Lateral — cidadão */}
            <div className="lg:col-span-4 space-y-4">
              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Cidadão" subtitle="Dados do requerente" />

                <div className="p-5 space-y-4">
                  {/* Avatar + nome */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-md flex items-center justify-center shrink-0 text-[12px] font-bold text-white"
                      style={{ background: INK }}
                    >
                      {chamadoAberto.nome
                        ?.split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold truncate" style={{ color: INK }}>
                        {chamadoAberto.nome || "—"}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: SUBTLE }}>
                        Requerente
                      </p>
                    </div>
                  </div>

                  {/* Info detalhada */}
                  <div className="pt-4 border-t space-y-3" style={{ borderColor: LINE_2 }}>
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
                        CPF
                      </p>
                      <p className="text-[12.5px] font-semibold num mt-0.5 font-mono" style={{ color: INK }}>
                        {chamadoAberto.cpf || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
                        E-mail
                      </p>
                      <p className="text-[12.5px] font-semibold mt-0.5 truncate" style={{ color: INK }}>
                        {chamadoAberto.email || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
                        WhatsApp
                      </p>
                      <p className="text-[12.5px] font-semibold num mt-0.5" style={{ color: INK }}>
                        {chamadoAberto.whatsapp || "Não fornecido"}
                      </p>
                    </div>
                  </div>
                </div>
              </Panel>
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
                <Headset size={9} strokeWidth={3} />
                Atendimento
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {chamados.length} chamado{chamados.length !== 1 ? "s" : ""}
              </span>
            </div>
            <h1
              className={`${jakarta.className} text-[26px] font-bold tracking-tight`}
              style={{ color: INK, letterSpacing: "-0.025em" }}
            >
              Suporte ao cidadão
            </h1>
            <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
              Gerencie queixas e dúvidas recebidas pelo portal.
            </p>
          </div>

          {/* Status da fila */}
          <div
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border self-start sm:self-auto"
            style={{ borderColor: LINE, background: SURFACE }}
          >
            {contadores.abertos > 0 ? (
              <>
                <div className="relative">
                  <Circle size={12} className="fill-current" style={{ color: DANGER }} />
                  <span
                    className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full dot-pulse"
                    style={{ background: DANGER }}
                  />
                </div>
                <span
                  className={`${jakarta.className} num text-[12px] font-bold`}
                  style={{ color: INK }}
                >
                  {contadores.abertos} aberto{contadores.abertos !== 1 ? "s" : ""}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 size={12} style={{ color: SUCCESS }} />
                <span className={`${jakarta.className} text-[12px] font-bold`} style={{ color: INK }}>
                  Fila limpa
                </span>
              </>
            )}
          </div>
        </div>

        {/* KPIs — strip horizontal */}
        {chamados.length > 0 && (
          <Panel noPad className="anim-fade-up">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x" style={{ borderColor: LINE }}>
              {[
                { label: "Total", valor: contadores.total, unit: "chamados", accent: false },
                { label: "Abertos", valor: contadores.abertos, unit: "aguardando", accent: contadores.abertos > 0 },
                { label: "Em andamento", valor: contadores.andamento, unit: "em curso", accent: false },
                { label: "Concluídos", valor: contadores.concluidos, unit: "resolvidos", accent: false },
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
        {chamados.length > 0 && (
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
                  placeholder="Buscar por protocolo, nome ou assunto..."
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
                <option value="Aberto">Abertos</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Concluído">Concluídos</option>
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
                  <strong style={{ color: INK }}>{chamadosFiltrados.length}</strong> de{" "}
                  <strong style={{ color: INK }}>{chamados.length}</strong> chamados
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
        ) : chamadosFiltrados.length === 0 ? (
          <Panel noPad className="anim-fade">
            <div className="py-16 text-center">
              <div
                className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                style={{ background: LINE_2, color: MUTED }}
              >
                {temFiltro ? <Search size={20} strokeWidth={2} /> : <Inbox size={20} strokeWidth={2} />}
              </div>
              <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                {temFiltro ? "Nenhum resultado" : "Nenhum chamado recebido"}
              </p>
              <p className="text-[11.5px] mt-1 max-w-md mx-auto" style={{ color: MUTED }}>
                {temFiltro
                  ? "Ajuste os filtros ou a busca para encontrar chamados."
                  : "Os chamados dos cidadãos aparecerão aqui."}
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
            <div className="divide-y" style={{ borderColor: LINE_2 }}>
              {chamadosFiltrados.map((c, idx) => {
                const info = getStatusInfo(c.status);
                const iniciais = (c.nome || "?")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <button
                    key={c.id}
                    onClick={() => abrirChamado(c)}
                    style={{ animationDelay: `${idx * 15}ms` }}
                    className="relative w-full text-left grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAFB] transition-colors anim-fade-up group"
                  >
                    {/* Faixa lateral de status */}
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-10 rounded-r"
                      style={{ background: info.cor }}
                    />

                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 text-[12px] font-bold text-white"
                      style={{ background: INK }}
                    >
                      {iniciais}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[11px] font-mono font-bold num" style={{ color: INK }}>
                          {c.protocolo}
                        </span>
                        <StatusPill status={c.status} />
                      </div>

                      <p
                        className={`${jakarta.className} text-[13.5px] font-bold leading-snug truncate`}
                        style={{ color: INK }}
                      >
                        {c.assunto}
                      </p>

                      <div
                        className="flex items-center gap-3 text-[11px] mt-0.5 num flex-wrap"
                        style={{ color: SUBTLE }}
                      >
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          {c.nome}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {tempoRelativo(c.criado_em)}
                        </span>
                      </div>
                    </div>

                    {/* Seta */}
                    <ArrowRight
                      size={15}
                      className="shrink-0 transition-all group-hover:translate-x-0.5"
                      style={{ color: SUBTLE }}
                    />
                  </button>
                );
              })}
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}