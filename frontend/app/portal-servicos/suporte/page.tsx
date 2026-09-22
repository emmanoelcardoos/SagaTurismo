"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Headset, Loader2, MessageSquare, FileText, Save, UploadCloud,
  Sparkles, ArrowLeft, User, Mail, Phone, IdCard, Calendar,
  ExternalLink, Inbox, Search, X, Filter, Clock, CheckCircle2,
  AlertTriangle, Info, Hash, Send, Paperclip, CheckCircle,
  Circle, Target, Layers, Headphones, MessageCircle,
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
const labelCls =
  "flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2";

function fmtDatetime(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("pt-BR") +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

// ─── ESTILO POR STATUS ───
const STATUS_INFO: Record<
  string,
  { cor: string; gradient: string; icone: any; label: string; emoji: string }
> = {
  Aberto: {
    cor: VERMELHO,
    gradient: `linear-gradient(135deg, ${VERMELHO}, #F87171)`,
    icone: Circle,
    label: "Aberto",
    emoji: "🔴",
  },
  "Em andamento": {
    cor: AMBAR,
    gradient: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
    icone: Clock,
    label: "Em andamento",
    emoji: "🟡",
  },
  Concluído: {
    cor: VERDE,
    gradient: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`,
    icone: CheckCircle2,
    label: "Concluído",
    emoji: "🟢",
  },
};

function getStatusInfo(status: string) {
  return STATUS_INFO[status] || STATUS_INFO.Aberto;
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

function FeedbackInline({ feedback }: { feedback: string }) {
  if (!feedback) return null;

  const isErro = feedback.toLowerCase().includes("erro") || feedback.includes("❌");
  const isSucesso = feedback.toLowerCase().includes("sucesso") || feedback.includes("✅");
  const cor = isErro ? VERMELHO : isSucesso ? VERDE : AZUL;
  const gradient = isErro
    ? `linear-gradient(135deg, ${VERMELHO}, #F87171)`
    : isSucesso
    ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
    : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`;
  const Icone = isErro ? AlertTriangle : isSucesso ? CheckCircle2 : Loader2;

  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-3 border-2 shadow-sm anim-fade-up"
      style={{ background: `${cor}08`, borderColor: `${cor}30` }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white"
        style={{ background: gradient }}
      >
        <Icone size={15} className={!isErro && !isSucesso ? "animate-spin" : ""} />
      </div>
      <div className="flex-1 pt-0.5 min-w-0">
        <p className="text-xs font-bold text-slate-800">
          {isErro ? "Erro" : isSucesso ? "Sucesso" : "A processar"}
        </p>
        <p className="text-xs text-slate-600 mt-0.5 break-words leading-relaxed">
          {feedback}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function PortalSuporte() {
  const [chamados, setChamados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "Todos" | "Aberto" | "Em andamento" | "Concluído"
  >("Todos");

  const [chamadoAberto, setChamadoAberto] = useState<any | null>(null);
  const [resposta, setResposta] = useState("");
  const [arquivoAdmin, setArquivoAdmin] = useState<File | null>(null);
  const [statusAtual, setStatusAtual] = useState("");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchChamados();
  }, []);

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
          const { data: pubUrl } = supabase.storage
            .from("galeria")
            .getPublicUrl(path);
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

      setFeedback("Resposta enviada e status atualizado!");
      setTimeout(() => {
        setChamadoAberto(null);
        fetchChamados();
      }, 2000);
    } catch (err: any) {
      setFeedback(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  // ─── CONTADORES ───
  const contadores = useMemo(() => {
    return {
      total: chamados.length,
      abertos: chamados.filter((c) => c.status === "Aberto").length,
      andamento: chamados.filter((c) => c.status === "Em andamento").length,
      concluidos: chamados.filter((c) => c.status === "Concluído").length,
    };
  }, [chamados]);

  // ─── FILTRO ───
  const chamadosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return chamados.filter((c) => {
      const passaStatus =
        filtroStatus === "Todos" || c.status === filtroStatus;
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
  // VISTA: DETALHE DO CHAMADO
  // ═══════════════════════════════════════════════════════════════

  if (chamadoAberto) {
    const statusInfo = getStatusInfo(chamadoAberto.status);

    return (
      <>
        <GlobalStyles />
        <div className={`${inter.className} space-y-5 pb-6 anim-fade-up`}>

          {/* Cabeçalho */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setChamadoAberto(null)}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm shrink-0 flex items-center justify-center group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className={`${jakarta.className} text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-mono`}
                >
                  {chamadoAberto.protocolo}
                </h1>
                <StatusBadge status={chamadoAberto.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar size={11} /> Enviado em {fmtDatetime(chamadoAberto.criado_em)}
              </p>
            </div>
          </div>

          {/* Grid: Cidadão + Mensagem */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card do Cidadão */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
              <div
                className="h-0.5"
                style={{ background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})` }}
              />
              <div
                className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
                style={{ background: `linear-gradient(135deg, ${AZUL}06, ${AZUL}02)` }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                >
                  <User size={15} />
                </div>
                <div className="min-w-0">
                  <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                    Dados do cidadão
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Informações do requerente
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
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
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {chamadoAberto.nome || "—"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Requerente</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${AZUL}10`, color: AZUL }}
                    >
                      <IdCard size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        CPF
                      </p>
                      <p className="text-xs font-semibold text-slate-800 font-mono mt-0.5 truncate">
                        {chamadoAberto.cpf || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${AZUL}10`, color: AZUL }}
                    >
                      <Phone size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        WhatsApp
                      </p>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                        {chamadoAberto.whatsapp || "Não fornecido"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 sm:col-span-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${AZUL}10`, color: AZUL }}
                    >
                      <Mail size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        E-mail
                      </p>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                        {chamadoAberto.email || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card da Mensagem */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
              <div
                className="h-0.5"
                style={{ background: `linear-gradient(90deg, ${ROXO}, #A78BFA)` }}
              />
              <div
                className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
                style={{ background: `linear-gradient(135deg, ${ROXO}06, ${ROXO}02)` }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ background: `linear-gradient(135deg, ${ROXO}, #A78BFA)` }}
                >
                  <FileText size={15} />
                </div>
                <div className="min-w-0">
                  <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                    Mensagem original
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Assunto: {chamadoAberto.assunto}
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div
                  className="rounded-xl p-4 border whitespace-pre-wrap text-sm text-slate-700 leading-relaxed max-h-56 overflow-y-auto scrollbar-thin"
                  style={{
                    background: `linear-gradient(135deg, ${ROXO}05, ${ROXO}01)`,
                    borderColor: `${ROXO}20`,
                  }}
                >
                  {chamadoAberto.mensagem}
                </div>

                {chamadoAberto.arquivo_url && (
                  <a
                    href={chamadoAberto.arquivo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
                    style={{ background: `${AZUL}10`, color: AZUL }}
                  >
                    <Paperclip size={13} /> Ver anexo do cidadão
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Painel de resposta */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div
              className="h-0.5"
              style={{ background: `linear-gradient(90deg, ${VERDE}, ${VERDE_LIGHT})` }}
            />
            <div
              className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)` }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                style={{ background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})` }}
              >
                <Send size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                  Responder e atualizar
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  A resposta será enviada por e-mail ao cidadão
                </p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={labelCls}>
                    <MessageCircle size={11} /> Escrever resposta
                  </label>
                  <textarea
                    rows={5}
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    className={`${inputCls} resize-y min-h-[130px]`}
                    placeholder="Escreva a resposta ao cidadão..."
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>
                      <Target size={11} /> Mudar status
                    </label>
                    <select
                      value={statusAtual}
                      onChange={(e) => setStatusAtual(e.target.value)}
                      className={inputCls}
                    >
                      <option value="Aberto">🔴 Aberto</option>
                      <option value="Em andamento">🟡 Em andamento</option>
                      <option value="Concluído">🟢 Concluído</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>
                      <Paperclip size={11} /> Enviar PDF/anexo
                    </label>
                    <label
                      className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl px-3 py-2.5 cursor-pointer text-[11px] font-bold transition-all group"
                      style={{
                        background: arquivoAdmin
                          ? `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)`
                          : "#F8FAFC",
                        borderColor: arquivoAdmin ? `${VERDE}50` : "#CBD5E1",
                        color: arquivoAdmin ? VERDE : AZUL,
                      }}
                    >
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          setArquivoAdmin(e.target.files?.[0] || null)
                        }
                      />
                      {arquivoAdmin ? (
                        <>
                          <CheckCircle size={13} /> Anexo pronto
                        </>
                      ) : (
                        <>
                          <UploadCloud size={13} /> Anexar arquivo
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {feedback && <FeedbackInline feedback={feedback} />}

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Info size={12} style={{ color: AZUL }} />
                  O cidadão receberá a resposta no e-mail cadastrado.
                </div>

                <button
                  onClick={handleResponder}
                  disabled={saving}
                  className={`${jakarta.className} text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0 shrink-0`}
                  style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Salvar e enviar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Última resposta do admin */}
          {chamadoAberto.resposta_admin && (
            <div
              className="rounded-2xl border-2 p-5 anim-fade-up"
              style={{
                background: `linear-gradient(135deg, ${AZUL}06, ${AZUL}02)`,
                borderColor: `${AZUL}25`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                >
                  <CheckCircle2 size={12} />
                </div>
                <p className={`${jakarta.className} text-xs font-bold text-slate-700 uppercase tracking-widest`}>
                  Última resposta do admin
                </p>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {chamadoAberto.resposta_admin}
              </p>
            </div>
          )}
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
            <div className="flex items-center gap-2 mb-1.5">
            </div>
            <h1 className={`${jakarta.className} text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight`}>
              Central de suporte
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
              <Sparkles size={14} style={{ color: VERMELHO }} />
              Gerencie as queixas e dúvidas dos cidadãos.
            </p>
          </div>

          {/* Badge de total */}
          <div
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border shadow-sm"
            style={{
              background: loading
                ? "white"
                : `linear-gradient(135deg, ${AZUL}08, ${AZUL}02)`,
              borderColor: loading ? "#E2E8F0" : `${AZUL}30`,
            }}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" style={{ color: AZUL }} />
            ) : (
              <div className="relative">
                <Headphones size={14} style={{ color: AZUL }} />
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full pulse-dot"
                  style={{ background: VERDE_LIGHT }}
                />
              </div>
            )}
            <span
              className={`${jakarta.className} text-xs font-bold`}
              style={{ color: loading ? "#64748B" : AZUL }}
            >
              {loading
                ? "Carregando..."
                : `${chamados.length} chamado${chamados.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {/* KPIs */}
        {chamados.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 anim-fade-up" style={{ animationDelay: "60ms" }}>
            {/* Total */}
            <div className="relative bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${ROXO}, #A78BFA)` }} />
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ background: `linear-gradient(135deg, ${ROXO}, #A78BFA)` }}
                >
                  <Layers size={14} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-tight">
                  Total
                </span>
              </div>
              <p className={`${jakarta.className} text-3xl font-extrabold leading-none tracking-tight`} style={{ color: ROXO }}>
                {contadores.total}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                chamados recebidos
              </p>
            </div>

            {/* Abertos */}
            <div className="relative bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${VERMELHO}, #F87171)` }} />
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ background: `linear-gradient(135deg, ${VERMELHO}, #F87171)` }}
                >
                  <Circle size={14} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-tight">
                  Abertos
                </span>
              </div>
              <p className={`${jakarta.className} text-3xl font-extrabold leading-none tracking-tight`} style={{ color: contadores.abertos > 0 ? VERMELHO : "#94A3B8" }}>
                {contadores.abertos}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                aguardando resposta
              </p>
            </div>

            {/* Em andamento */}
            <div className="relative bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${AMBAR}, ${AMBAR_LIGHT})` }} />
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
                >
                  <Clock size={14} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-tight">
                  Em andamento
                </span>
              </div>
              <p className={`${jakarta.className} text-3xl font-extrabold leading-none tracking-tight`} style={{ color: contadores.andamento > 0 ? AMBAR : "#94A3B8" }}>
                {contadores.andamento}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                em atendimento
              </p>
            </div>

            {/* Concluídos */}
            <div className="relative bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${VERDE}, ${VERDE_LIGHT})` }} />
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})` }}
                >
                  <CheckCircle2 size={14} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-tight">
                  Concluídos
                </span>
              </div>
              <p className={`${jakarta.className} text-3xl font-extrabold leading-none tracking-tight`} style={{ color: contadores.concluidos > 0 ? VERDE : "#94A3B8" }}>
                {contadores.concluidos}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                resolvidos
              </p>
            </div>
          </div>
        )}

        {/* Busca + Filtro */}
        {chamados.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm anim-fade-up" style={{ animationDelay: "120ms" }}>
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
                    {chamadosFiltrados.length}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-slate-800 font-bold">
                    {chamados.length}
                  </strong>{" "}
                  chamado(s)
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:bg-white focus:border-[#0078D4] focus:ring-4 focus:ring-[#0078D4]/10 transition-all cursor-pointer"
                >
                  <option value="Todos">Todos os status</option>
                  <option value="Aberto">🔴 Abertos</option>
                  <option value="Em andamento">🟡 Em andamento</option>
                  <option value="Concluído">🟢 Concluídos</option>
                </select>

                <div className="relative flex-1 sm:w-72">
                  <Search
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Buscar protocolo, nome ou assunto..."
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
              Carregando chamados...
            </p>
          </div>
        ) : chamadosFiltrados.length === 0 ? (
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
              {temFiltro ? "Nenhum resultado" : "Nenhum chamado recebido"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-5">
              {temFiltro
                ? "Ajuste os filtros ou a busca para encontrar chamados."
                : "Os chamados dos cidadãos aparecerão aqui."}
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
          <div className="space-y-3">
            {chamadosFiltrados.map((c, idx) => {
              const statusInfo = getStatusInfo(c.status);
              const iniciais = (c.nome || "?")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((n: string) => n[0])
                .join("")
                .toUpperCase();

              return (
                <article
                  key={c.id}
                  onClick={() => abrirChamado(c)}
                  style={{ animationDelay: `${180 + idx * 25}ms` }}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 anim-fade-up cursor-pointer group"
                >
                  <div className="h-0.5" style={{ background: statusInfo.gradient }} />

                  <div className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-105"
                      style={{ background: statusInfo.gradient }}
                    >
                      {iniciais}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {c.protocolo}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>

                      <h3 className={`${jakarta.className} text-sm font-bold text-slate-900 truncate mb-1`}>
                        {c.assunto}
                      </h3>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <User size={10} className="text-slate-400" />
                          {c.nome}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <IdCard size={10} className="text-slate-400" />
                          {c.cpf}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={10} className="text-slate-400" />
                          {fmtDatetime(c.criado_em)}
                        </span>
                      </div>
                    </div>

                    {/* Ícone de acesso */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:translate-x-0.5"
                      style={{
                        background: `${statusInfo.cor}10`,
                        color: statusInfo.cor,
                      }}
                    >
                      <MessageSquare size={15} />
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