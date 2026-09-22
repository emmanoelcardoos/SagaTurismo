"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Bell, Loader2, Sparkles, Mail, Send, Users, CheckCircle2,
  AlertTriangle, Info, FileText, Hash, Eye, Inbox, Search,
  X, Filter, Calendar, Code2, Wand2, Target, Zap, AtSign,
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

function FormField({
  label,
  icon,
  required,
  hint,
  contador,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  hint?: string;
  contador?: { atual: number; max?: number };
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={labelCls} style={{ marginBottom: 0 }}>
          {icon}
          {label}
          {required && <span style={{ color: VERMELHO }}>*</span>}
        </label>
        {contador && (
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-md transition-colors"
            style={{
              background:
                contador.max && contador.atual > contador.max * 0.9
                  ? `${AMBAR}15`
                  : "#F1F5F9",
              color:
                contador.max && contador.atual > contador.max * 0.9
                  ? AMBAR
                  : "#64748B",
            }}
          >
            {contador.atual}
            {contador.max ? `/${contador.max}` : ""}
          </span>
        )}
      </div>
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

function FeedbackInline({ feedback }: { feedback: string }) {
  if (!feedback) return null;

  const isErro = feedback.toLowerCase().includes("erro");
  const isSucesso = feedback.toLowerCase().includes("sucesso");
  const cor = isErro ? VERMELHO : isSucesso ? VERDE : AZUL;
  const gradient = isErro
    ? `linear-gradient(135deg, ${VERMELHO}, #F87171)`
    : isSucesso
    ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
    : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`;
  const Icone = isErro ? AlertTriangle : isSucesso ? CheckCircle2 : Loader2;

  return (
    <div
      className="rounded-xl p-3 flex items-center gap-2.5 border anim-fade"
      style={{ background: `${cor}06`, borderColor: `${cor}25` }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm"
        style={{ background: gradient }}
      >
        <Icone size={13} className={!isErro && !isSucesso ? "animate-spin" : ""} />
      </div>
      <p className="text-xs font-bold text-slate-700 flex-1 min-w-0 break-words">
        {feedback}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function PortalNewsletter() {
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [busca, setBusca] = useState("");

  const [assunto, setAssunto] = useState("");
  const [textoHtml, setTextoHtml] = useState("");

  useEffect(() => {
    fetchInscritos();
  }, []);

  async function fetchInscritos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("newsletter_inscritos")
      .select("*")
      .order("criado_em", { ascending: false });
    if (data) setInscritos(data);
    setLoading(false);
  }

  async function handleDisparar(e: React.FormEvent) {
    e.preventDefault();
    if (!assunto || !textoHtml) {
      setFeedback("Erro: preenche o assunto e cola o código HTML da newsletter.");
      return;
    }

    if (inscritos.length === 0) {
      setFeedback("Erro: não existem e-mails registados na base de dados para envio.");
      return;
    }

    if (
      !confirm(
        `Tem a certeza que deseja disparar esta newsletter para ${inscritos.length} inscritos?`
      )
    ) {
      return;
    }

    setEnviando(true);
    setFeedback("A preparar disparos em lote...");

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
        setFeedback(
          `Sucesso! Newsletter disparada para ${inscritos.length} destinatários.`
        );
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

  // ─── FILTRO DOS INSCRITOS ───
  const inscritosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return inscritos;
    return inscritos.filter((i) =>
      (i.email || "").toLowerCase().includes(termo)
    );
  }, [inscritos, busca]);

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-6 anim-fade-up`}>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* CABEÇALHO                                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`${jakarta.className} text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight`}>
              Campanhas de newsletter
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
              <Sparkles size={14} style={{ color: AMBAR }} />
              Disparo em lote de e-mails para a base de inscritos.
            </p>
          </div>

          {/* Badge de inscritos */}
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
                ? "A carregar..."
                : `${inscritos.length} inscrito${inscritos.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* GRELHA: Editor + Base de Leads                              */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ═══ BLOCO 1: EDITOR (2/3) ═══ */}
          <div className="lg:col-span-2">
            <div
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm anim-fade-up"
              style={{ animationDelay: "60ms" }}
            >
              <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AMBAR}, ${AMBAR_LIGHT})` }} />

              {/* Header */}
              <div
                className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
                style={{ background: `linear-gradient(135deg, ${AMBAR}06, ${AMBAR}02)` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
                >
                  <Send size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                    Disparo de e-mail
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Código HTML livre · envio em lote
                  </p>
                </div>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap"
                  style={{
                    background: `${AMBAR}10`,
                    color: AMBAR,
                    borderColor: `${AMBAR}25`,
                  }}
                >
                  <Code2 size={10} className="inline mr-1" />
                  HTML
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleDisparar} className="p-5 space-y-4">
                <FormField
                  label="Assunto do e-mail"
                  icon={<Type size={11} />}
                  required
                  contador={{ atual: assunto.length, max: 120 }}
                >
                  <input
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    className={inputCls}
                    placeholder="Ex: Descobre as novas cachoeiras 🌿"
                    required
                    maxLength={120}
                  />
                </FormField>

                <FormField
                  label="Código HTML completo"
                  icon={<Code2 size={11} />}
                  required
                  hint="Cola o código gerado no teu editor externo (Mailchimp, Figma, HTML puro, etc.)."
                  contador={{ atual: textoHtml.length }}
                >
                  <textarea
                    rows={16}
                    value={textoHtml}
                    onChange={(e) => setTextoHtml(e.target.value)}
                    className={`${inputCls} font-mono text-[11px] leading-relaxed resize-y min-h-[340px] bg-slate-900 text-blue-100 placeholder:text-slate-500`}
                    placeholder="<!DOCTYPE html><html>..."
                    required
                  />
                </FormField>

                {feedback && <FeedbackInline feedback={feedback} />}

                {/* Footer */}
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={enviando || inscritos.length === 0}
                    className={`${jakarta.className} w-full text-white px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0`}
                    style={{
                      background:
                        inscritos.length === 0
                          ? "#94A3B8"
                          : `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                    }}
                  >
                    {enviando ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        A disparar para {inscritos.length} inscritos...
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        Disparar para {inscritos.length} inscrito
                        {inscritos.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ═══ BLOCO 2: BASE DE LEADS (1/3) ═══ */}
          <div className="lg:col-span-1">
            <div
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm anim-fade-up lg:sticky lg:top-6"
              style={{ animationDelay: "120ms" }}
            >
              <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})` }} />

              {/* Header */}
              <div
                className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
                style={{ background: `linear-gradient(135deg, ${AZUL}06, ${AZUL}02)` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                >
                  <Users size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`${jakarta.className} text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap`}>
                    Base de leads
                    {inscritos.length > 0 && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                        style={{
                          background: `${AZUL}10`,
                          color: AZUL,
                          borderColor: `${AZUL}25`,
                        }}
                      >
                        {inscritos.length}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    E-mails capturados
                  </p>
                </div>
              </div>

              {/* Busca */}
              {inscritos.length > 0 && (
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Buscar e-mail..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/10 transition-all placeholder:text-slate-400"
                    />
                    {busca && (
                      <button
                        onClick={() => setBusca("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Lista */}
              <div className="max-h-[520px] overflow-y-auto scrollbar-thin">
                {loading ? (
                  <div className="py-12 flex flex-col items-center gap-3 anim-fade">
                    <Loader2
                      className="animate-spin"
                      size={22}
                      style={{ color: AZUL }}
                    />
                    <p className="text-xs text-slate-400 font-medium">
                      A carregar inscritos...
                    </p>
                  </div>
                ) : inscritos.length === 0 ? (
                  <div className="py-12 px-6 text-center flex flex-col items-center gap-3 anim-fade">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                      }}
                    >
                      <Inbox size={24} />
                    </div>
                    <div>
                      <p className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                        Sem inscritos
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-[240px]">
                        Nenhum e-mail inscrito na newsletter até ao momento.
                      </p>
                    </div>
                  </div>
                ) : inscritosFiltrados.length === 0 ? (
                  <div className="py-12 px-6 text-center flex flex-col items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                      }}
                    >
                      <Search size={24} />
                    </div>
                    <div>
                      <p className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                        Nenhum resultado
                      </p>
                      <button
                        onClick={() => setBusca("")}
                        className="text-[11px] font-bold hover:underline mt-2"
                        style={{ color: AZUL }}
                      >
                        Limpar pesquisa
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {inscritosFiltrados.map((item, idx) => {
                      const iniciais = (item.email || "?")
                        .split("@")[0]
                        .split(/[._-]/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase();

                      return (
                        <div
                          key={item.id || idx}
                          style={{ animationDelay: `${idx * 20}ms` }}
                          className="p-3 bg-slate-50/70 hover:bg-white border border-slate-200/60 hover:border-slate-300 rounded-xl transition-all hover:shadow-sm flex items-center gap-3 anim-fade-up group"
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold text-white shadow-sm"
                            style={{
                              background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                            }}
                          >
                            {iniciais}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {item.email}
                            </p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar size={9} />
                              {tempoRelativo(item.criado_em)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer com contador */}
              {inscritos.length > 0 && busca && (
                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/70">
                  <p className="text-[10px] text-slate-500 font-medium text-center">
                    A mostrar{" "}
                    <strong className="text-slate-700">{inscritosFiltrados.length}</strong>{" "}
                    de <strong className="text-slate-700">{inscritos.length}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
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