"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Loader2, Send, Users, CheckCircle2, AlertTriangle, Info,
  FileText, Inbox, Search, X, Calendar, Code2, Type,
  AtSign, Mail, ExternalLink,
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
    return fmtData(iso);
  } catch {
    return "—";
  }
}

function iniciaisDeEmail(email: string) {
  const base = (email || "?").split("@")[0];
  const partes = base.split(/[._-]/).filter(Boolean).slice(0, 2);
  return partes.map((p) => p[0]).join("").toUpperCase() || "?";
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
      .anim-fade-up { animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .anim-fade { animation: fadeIn 0.2s ease both; }
      .num { font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
      .dot-pulse { animation: pulseDot 2s ease-in-out infinite; }
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

function FormField({
  label, icon, required, hint, contador, children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  hint?: string;
  contador?: { atual: number; max?: number };
  children: React.ReactNode;
}) {
  const acimaLimite = contador?.max && contador.atual > contador.max * 0.9;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label
          className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: MUTED }}
        >
          {icon}
          {label}
          {required && <span style={{ color: DANGER }}>*</span>}
        </label>
        {contador && (
          <span
            className="text-[10.5px] font-semibold num px-1.5 py-0.5 rounded transition-colors"
            style={{
              background: acimaLimite ? "#FFFBEB" : LINE_2,
              color: acimaLimite ? WARNING : SUBTLE,
            }}
          >
            {contador.atual}
            {contador.max ? `/${contador.max}` : ""}
          </span>
        )}
      </div>
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

function FeedbackInline({ feedback }: { feedback: string }) {
  if (!feedback) return null;

  const isErro = feedback.toLowerCase().includes("erro");
  const isSucesso = feedback.toLowerCase().includes("sucesso");
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
      className="rounded-md p-3 flex items-start gap-2.5 border anim-fade"
      style={{ background: map.bg, borderColor: map.b, color: map.c }}
    >
      <Icone size={14} className={`shrink-0 mt-0.5 ${isSpinner ? "animate-spin" : ""}`} />
      <p className="text-[12px] font-medium break-words">{feedback}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA
// ═══════════════════════════════════════════════════════════════

export default function PortalNewsletter() {
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [busca, setBusca] = useState("");

  const [assunto, setAssunto] = useState("");
  const [textoHtml, setTextoHtml] = useState("");

  useEffect(() => { fetchInscritos(); }, []);

  async function fetchInscritos() {
    setLoading(true);
    const { data } = await supabase
      .from("newsletter_inscritos")
      .select("*")
      .order("criado_em", { ascending: false });
    if (data) setInscritos(data);
    setLoading(false);
  }

  async function handleDisparar(e: React.FormEvent) {
    e.preventDefault();
    if (!assunto || !textoHtml) {
      setFeedback("Erro: preencha o assunto e cole o código HTML da newsletter.");
      return;
    }
    if (inscritos.length === 0) {
      setFeedback("Erro: não existem e-mails registrados na base de dados para envio.");
      return;
    }
    if (!confirm(`Tem certeza que deseja disparar esta newsletter para ${inscritos.length} inscritos?`)) {
      return;
    }

    setEnviando(true);
    setFeedback("Preparando disparos em lote...");

    const listaEmails = inscritos.map((i) => i.email);

    try {
      const response = await fetch(
        "https://sagaturismo-production.up.railway.app/api/v1/newsletter/disparar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emails: listaEmails,
            assunto,
            texto_html: textoHtml,
          }),
        }
      );

      if (response.ok) {
        setFeedback(`Sucesso! Newsletter disparada para ${inscritos.length} destinatários.`);
        setAssunto("");
        setTextoHtml("");
        setTimeout(() => setFeedback(""), 5000);
      } else {
        setFeedback("Erro ao disparar e-mails pelo servidor.");
      }
    } catch (err) {
      setFeedback("Erro de conexão com o servidor de disparo.");
    } finally {
      setEnviando(false);
    }
  }

  const inscritosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return inscritos;
    return inscritos.filter((i) => (i.email || "").toLowerCase().includes(termo));
  }, [inscritos, busca]);

  const temInscritos = inscritos.length > 0;

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
                <Mail size={9} strokeWidth={3} />
                Comunicação
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                Campanhas de e-mail
              </span>
            </div>
            <h1
              className={`${jakarta.className} text-[26px] font-bold tracking-tight`}
              style={{ color: INK, letterSpacing: "-0.025em" }}
            >
              Newsletter
            </h1>
            <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
              Disparo em lote de e-mails para a base de inscritos.
            </p>
          </div>

          {/* Status da base */}
          <div
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border self-start sm:self-auto"
            style={{ borderColor: LINE, background: SURFACE }}
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" style={{ color: SUBTLE }} />
                <span className="text-[12px] font-medium" style={{ color: MUTED }}>
                  Verificando...
                </span>
              </>
            ) : (
              <>
                <div className="relative">
                  <Users size={13} style={{ color: temInscritos ? INK : SUBTLE }} />
                  {temInscritos && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full dot-pulse"
                      style={{ background: SUCCESS }}
                    />
                  )}
                </div>
                <span
                  className={`${jakarta.className} num text-[12px] font-bold`}
                  style={{ color: temInscritos ? INK : SUBTLE }}
                >
                  {inscritos.length} inscrito{inscritos.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* GRID 2 COLUNAS: Editor (8) + Leads (4)                      */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* ═══ EDITOR ═══ */}
          <div className="lg:col-span-8">
            <Panel noPad className="anim-fade-up">
              <PanelHeader
                title="Compor campanha"
                subtitle="Assunto + código HTML do e-mail"
                badge={
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
                    style={{ background: LINE_2, color: MUTED, border: `1px solid ${LINE}` }}
                  >
                    <Code2 size={9} />
                    HTML
                  </span>
                }
              />

              <form onSubmit={handleDisparar} className="p-5 space-y-4">
                <FormField
                  label="Assunto do e-mail"
                  icon={<Type size={10} />}
                  required
                  contador={{ atual: assunto.length, max: 120 }}
                >
                  <input
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
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
                    placeholder="Ex: Descubra as novas cachoeiras 🌿"
                    required
                    maxLength={120}
                  />
                </FormField>

                <FormField
                  label="Código HTML completo"
                  icon={<Code2 size={10} />}
                  required
                  hint="Cole o código gerado no editor externo (Mailchimp, Figma, HTML puro, etc.)."
                  contador={{ atual: textoHtml.length }}
                >
                  <textarea
                    rows={16}
                    value={textoHtml}
                    onChange={(e) => setTextoHtml(e.target.value)}
                    className={`${inputCls} font-mono !text-[11.5px] !leading-relaxed resize-y min-h-[340px]`}
                    style={{
                      background: INK,
                      color: "#E2E8F0",
                      borderColor: INK,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.12)`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    placeholder="<!DOCTYPE html>..."
                    required
                  />
                </FormField>

                {feedback && <FeedbackInline feedback={feedback} />}

                {/* Footer */}
                <div className="pt-4 border-t flex items-center justify-between gap-3" style={{ borderColor: LINE_2 }}>
                  <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
                    {temInscritos
                      ? `Destinatários: ${inscritos.length}`
                      : "Aguardando inscritos na base"}
                  </p>
                  <button
                    type="submit"
                    disabled={enviando || !temInscritos}
                    className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    style={{ background: INK }}
                    onMouseEnter={(e) => !enviando && temInscritos && (e.currentTarget.style.background = INK_2)}
                    onMouseLeave={(e) => !enviando && temInscritos && (e.currentTarget.style.background = INK)}
                  >
                    {enviando ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Disparando...
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        Disparar newsletter
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Panel>
          </div>

          {/* ═══ LEADS ═══ */}
          <div className="lg:col-span-4">
            <Panel noPad className="anim-fade-up lg:sticky lg:top-4">
              <PanelHeader
                title="Base de leads"
                subtitle="E-mails capturados no portal"
                badge={
                  temInscritos ? (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded num"
                      style={{ background: LINE_2, color: MUTED }}
                    >
                      {inscritos.length}
                    </span>
                  ) : null
                }
              />

              {/* Busca */}
              {temInscritos && (
                <div className="px-4 py-3 border-b" style={{ borderColor: LINE }}>
                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: SUBTLE }}
                    />
                    <input
                      type="text"
                      placeholder="Buscar e-mail..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="w-full h-9 pl-9 pr-9 rounded-md text-[12.5px] border transition-[border-color,box-shadow]"
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center transition-colors"
                        style={{ color: SUBTLE }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        aria-label="Limpar busca"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Lista */}
              <div className="max-h-[560px] overflow-y-auto scroll-thin">
                {loading ? (
                  <div className="divide-y" style={{ borderColor: LINE_2 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-14 skeleton" />
                    ))}
                  </div>
                ) : inscritos.length === 0 ? (
                  <div className="py-14 px-6 text-center">
                    <div
                      className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                      style={{ background: LINE_2, color: MUTED }}
                    >
                      <Inbox size={20} strokeWidth={2} />
                    </div>
                    <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                      Sem inscritos
                    </p>
                    <p className="text-[11.5px] mt-1 leading-relaxed max-w-[220px] mx-auto" style={{ color: MUTED }}>
                      Nenhum e-mail inscrito na newsletter até o momento.
                    </p>
                  </div>
                ) : inscritosFiltrados.length === 0 ? (
                  <div className="py-14 px-6 text-center">
                    <div
                      className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                      style={{ background: LINE_2, color: MUTED }}
                    >
                      <Search size={20} strokeWidth={2} />
                    </div>
                    <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                      Nenhum resultado
                    </p>
                    <button
                      onClick={() => setBusca("")}
                      className="text-[11.5px] font-semibold mt-2 transition-opacity hover:opacity-70"
                      style={{ color: INK }}
                    >
                      Limpar busca
                    </button>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: LINE_2 }}>
                    {inscritosFiltrados.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{ animationDelay: `${idx * 15}ms` }}
                        className="px-4 py-3 flex items-center gap-3 hover:bg-[#FAFAFB] transition-colors anim-fade-up"
                      >
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-[10.5px] font-bold text-white"
                          style={{ background: INK }}
                        >
                          {iniciaisDeEmail(item.email)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] font-semibold truncate" style={{ color: INK }}>
                            {item.email}
                          </p>
                          <p
                            className="text-[10.5px] flex items-center gap-1 mt-0.5 num"
                            style={{ color: SUBTLE }}
                          >
                            <Calendar size={9} />
                            {tempoRelativo(item.criado_em)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer com contador de filtro */}
              {temInscritos && busca && (
                <div
                  className="px-4 py-2.5 border-t text-center"
                  style={{ borderColor: LINE, background: BG }}
                >
                  <p className="text-[10.5px] font-medium num" style={{ color: MUTED }}>
                    <strong style={{ color: INK }}>{inscritosFiltrados.length}</strong> de{" "}
                    <strong style={{ color: INK }}>{inscritos.length}</strong>
                  </p>
                </div>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}