"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Bell, FileText, Loader2, Send, Upload, BookOpen,
  Smartphone, Hash, CheckCircle2, AlertTriangle, Info,
  Users, Zap, MessageSquare, FileDown,
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
  contador?: { atual: number; max: number };
  children: React.ReactNode;
}) {
  const acimaLimite = contador && contador.atual > contador.max * 0.9;
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
            {contador.atual}/{contador.max}
          </span>
        )}
      </div>
      {children}
      {hint && (
        <p className="text-[10.5px] mt-1.5 leading-relaxed" style={{ color: SUBTLE }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function FeedbackInline({ feedback }: { feedback: string }) {
  if (!feedback) return null;

  const isErro = feedback.toLowerCase().includes("erro");
  const isSucesso = feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("publicado");
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

export default function PortalAplicativo() {
  // Push
  const [tokens, setTokens] = useState<any[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [feedbackPush, setFeedbackPush] = useState("");
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");

  // PDF
  const [tituloPdf, setTituloPdf] = useState("");
  const [descricaoPdf, setDescricaoPdf] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedbackPdf, setFeedbackPdf] = useState("");

  useEffect(() => { fetchTokens(); }, []);

  async function fetchTokens() {
    setLoadingTokens(true);
    const { data } = await supabase
      .from("push_tokens")
      .select("*")
      .order("criado_em", { ascending: false });
    if (data) setTokens(data);
    setLoadingTokens(false);
  }

  async function handleDisparar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo || !mensagem) {
      setFeedbackPush("Erro: preencha o título e a mensagem da notificação.");
      return;
    }
    if (tokens.length === 0) {
      setFeedbackPush("Erro: nenhum telefone registrado na base de dados.");
      return;
    }
    if (!confirm(`Deseja disparar esta notificação para ${tokens.length} telefones?`)) return;

    setEnviando(true);
    setFeedbackPush("Comunicando com os servidores...");

    const mensagensPush = tokens.map((t) => ({
      to: t.token,
      sound: "default",
      title: titulo,
      body: mensagem,
      data: { portal: true },
    }));

    try {
      const response = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagens: mensagensPush }),
      });
      if (!response.ok) throw new Error("Falha na API");

      setFeedbackPush(`Sucesso! Enviado para ${tokens.length} dispositivos.`);
      setTitulo("");
      setMensagem("");
      setTimeout(() => setFeedbackPush(""), 4000);
    } catch (err) {
      console.error(err);
      setFeedbackPush("Erro ao enviar notificação.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleUploadPdf(e: React.FormEvent) {
    e.preventDefault();
    if (!tituloPdf || !arquivo) {
      setFeedbackPdf("Erro: título e arquivo PDF são obrigatórios.");
      return;
    }

    setUploading(true);
    setFeedbackPdf("Carregando arquivo...");

    try {
      const fileExt = arquivo.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `pdf/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("guias")
        .upload(filePath, arquivo);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("guias")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("guias_turisticos")
        .insert([{
          titulo: tituloPdf,
          descricao: descricaoPdf,
          arquivo_url: publicUrlData.publicUrl,
          categoria: "Guia Digital",
        }]);
      if (dbError) throw dbError;

      setFeedbackPdf("PDF publicado com sucesso.");
      setTituloPdf("");
      setDescricaoPdf("");
      setArquivo(null);
      setTimeout(() => setFeedbackPdf(""), 4000);
    } catch (err) {
      console.error(err);
      setFeedbackPdf("Erro ao enviar o PDF.");
    } finally {
      setUploading(false);
    }
  }

  const temDispositivos = tokens.length > 0;

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
                <Smartphone size={9} strokeWidth={3} />
                Aplicativo
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                Push · Guias PDF
              </span>
            </div>
            <h1
              className={`${jakarta.className} text-[26px] font-bold tracking-tight`}
              style={{ color: INK, letterSpacing: "-0.025em" }}
            >
              Aplicativo
            </h1>
            <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
              Envio de notificações push e publicação de guias digitais para o app.
            </p>
          </div>

          {/* Status de dispositivos */}
          <div
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border self-start sm:self-auto"
            style={{
              borderColor: LINE,
              background: SURFACE,
            }}
          >
            {loadingTokens ? (
              <>
                <Loader2 size={13} className="animate-spin" style={{ color: SUBTLE }} />
                <span className="text-[12px] font-medium" style={{ color: MUTED }}>
                  Verificando...
                </span>
              </>
            ) : (
              <>
                <div className="relative">
                  <Users size={13} style={{ color: temDispositivos ? INK : SUBTLE }} />
                  {temDispositivos && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full dot-pulse"
                      style={{ background: SUCCESS }}
                    />
                  )}
                </div>
                <span
                  className={`${jakarta.className} num text-[12px] font-bold`}
                  style={{ color: temDispositivos ? INK : SUBTLE }}
                >
                  {tokens.length} dispositivo{tokens.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* GRID 2 COLUNAS                                              */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ═══ PUSH ═══ */}
          <Panel noPad className="anim-fade-up">
            <PanelHeader
              title="Notificações push"
              subtitle="Alerta imediato no ecrã dos dispositivos"
              badge={
                temDispositivos ? (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
                    style={{ background: "#ECFDF5", color: SUCCESS, border: "1px solid #D1FAE5" }}
                  >
                    <Zap size={9} className="fill-current" />
                    Tempo real
                  </span>
                ) : null
              }
            />

            {/* Aviso sem dispositivos */}
            {!loadingTokens && !temDispositivos && (
              <div
                className="mx-5 mt-5 rounded-md p-3 flex items-start gap-2.5 border"
                style={{ background: "#FFFBEB", borderColor: "#FEF3C7" }}
              >
                <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: WARNING }} />
                <div className="flex-1">
                  <p className="text-[12px] font-semibold" style={{ color: INK }}>
                    Sem dispositivos registrados
                  </p>
                  <p className="text-[11.5px] mt-0.5 leading-relaxed" style={{ color: MUTED }}>
                    Nenhum usuário instalou o aplicativo ainda. Os alertas só podem ser enviados quando houver dispositivos.
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleDisparar} className="p-5 space-y-4">
              <FormField
                label="Título do alerta"
                icon={<MessageSquare size={10} />}
                required
                contador={{ atual: titulo.length, max: 50 }}
              >
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
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
                  placeholder="Ex: Novo artigo no blog!"
                  required
                  maxLength={50}
                  disabled={!temDispositivos}
                />
              </FormField>

              <FormField
                label="Mensagem"
                icon={<MessageSquare size={10} />}
                required
                contador={{ atual: mensagem.length, max: 150 }}
              >
                <textarea
                  rows={4}
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  className={`${inputCls} resize-y min-h-[100px]`}
                  style={{ borderColor: LINE }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = INK;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = LINE;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  placeholder="Ex: Descubra as novidades do portal SagaTurismo..."
                  required
                  maxLength={150}
                  disabled={!temDispositivos}
                />
              </FormField>

              {feedbackPush && <FeedbackInline feedback={feedbackPush} />}

              {/* Footer */}
              <div className="pt-4 border-t flex items-center justify-between gap-3" style={{ borderColor: LINE_2 }}>
                <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
                  {temDispositivos
                    ? `Alerta será enviado para ${tokens.length} dispositivo${tokens.length !== 1 ? "s" : ""}`
                    : "Aguardando dispositivos"}
                </p>
                <button
                  type="submit"
                  disabled={enviando || !temDispositivos}
                  className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  style={{ background: INK }}
                  onMouseEnter={(e) => !enviando && temDispositivos && (e.currentTarget.style.background = INK_2)}
                  onMouseLeave={(e) => !enviando && temDispositivos && (e.currentTarget.style.background = INK)}
                >
                  {enviando ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      Disparar alerta
                    </>
                  )}
                </button>
              </div>
            </form>
          </Panel>

          {/* ═══ PDF ═══ */}
          <Panel noPad className="anim-fade-up">
            <PanelHeader
              title="Guias em PDF"
              subtitle="Material digital disponível no app"
              badge={
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
                  style={{ background: LINE_2, color: MUTED, border: `1px solid ${LINE}` }}
                >
                  <FileDown size={9} />
                  PDF
                </span>
              }
            />

            <form onSubmit={handleUploadPdf} className="p-5 space-y-4">
              <FormField
                label="Título do material"
                icon={<BookOpen size={10} />}
                required
              >
                <input
                  value={tituloPdf}
                  onChange={(e) => setTituloPdf(e.target.value)}
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
                  placeholder="Ex: Guia Turístico Oficial"
                  required
                />
              </FormField>

              <FormField
                label="Descrição"
                icon={<FileText size={10} />}
                hint="Aparece sob o título no portal público."
              >
                <textarea
                  rows={3}
                  value={descricaoPdf}
                  onChange={(e) => setDescricaoPdf(e.target.value)}
                  className={`${inputCls} resize-y min-h-[90px]`}
                  style={{ borderColor: LINE }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = INK;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = LINE;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  placeholder="Ex: Mapa completo com trilhas e pontos de apoio..."
                />
              </FormField>

              <FormField label="Arquivo PDF" icon={<FileText size={10} />} required>
                <label
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md p-5 cursor-pointer text-[12px] font-semibold transition-colors"
                  style={{
                    background: arquivo ? "#ECFDF5" : BG,
                    borderColor: arquivo ? `${SUCCESS}50` : LINE,
                    color: arquivo ? SUCCESS : MUTED,
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                    required
                  />
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center"
                    style={{
                      background: arquivo ? SUCCESS : LINE_2,
                      color: arquivo ? "#FFF" : MUTED,
                    }}
                  >
                    {arquivo ? <CheckCircle2 size={15} /> : <Upload size={15} />}
                  </div>
                  <span className="truncate max-w-[240px] text-center">
                    {arquivo ? arquivo.name : "Clique para anexar o PDF"}
                  </span>
                  {arquivo && (
                    <span className="text-[10.5px] font-semibold num" style={{ color: SUBTLE }}>
                      {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </label>
              </FormField>

              {feedbackPdf && <FeedbackInline feedback={feedbackPdf} />}

              {/* Footer */}
              <div className="pt-4 border-t flex items-center justify-between gap-3" style={{ borderColor: LINE_2 }}>
                <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
                  Ficará disponível no portal e no app
                </p>
                <button
                  type="submit"
                  disabled={uploading}
                  className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  style={{ background: INK }}
                  onMouseEnter={(e) => !uploading && (e.currentTarget.style.background = INK_2)}
                  onMouseLeave={(e) => !uploading && (e.currentTarget.style.background = INK)}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <FileDown size={13} />
                      Publicar PDF
                    </>
                  )}
                </button>
              </div>
            </form>
          </Panel>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* NOTA INSTITUCIONAL                                          */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <Panel noPad className="anim-fade-up">
          <div className="p-4 flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
              style={{ background: LINE_2, color: INK }}
            >
              <Info size={14} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className={`${jakarta.className} text-[12.5px] font-bold mb-0.5`} style={{ color: INK }}>
                Sobre notificações push
              </p>
              <p className="text-[11.5px] leading-relaxed" style={{ color: MUTED }}>
                As notificações push são entregues imediatamente aos celulares que instalaram o aplicativo.
                Mantenha o título abaixo de 50 caracteres e a mensagem abaixo de 150 — textos maiores
                são cortados na tela bloqueada dos dispositivos.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}