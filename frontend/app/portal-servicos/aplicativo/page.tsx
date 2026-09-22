"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Bell, FileText, Loader2, Sparkles, Send, Upload, BookOpen,
  Smartphone, Hash, Type, FileDown, CheckCircle2, AlertTriangle,
  Info, Users, Zap, Target, MessageSquare, Inbox, Star,
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
  contador?: { atual: number; max: number };
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
                contador.atual > contador.max * 0.9 ? `${AMBAR}15` : "#F1F5F9",
              color:
                contador.atual > contador.max * 0.9 ? AMBAR : "#64748B",
            }}
          >
            {contador.atual}/{contador.max}
          </span>
        )}
      </div>
      {children}
      {hint && (
        <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

function FeedbackInline({
  feedback,
}: {
  feedback: string;
}) {
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

export default function PortalAplicativo() {
  // ─── Estado Notificações Push ───
  const [tokens, setTokens] = useState<any[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [feedbackPush, setFeedbackPush] = useState("");
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");

  // ─── Estado Upload PDF ───
  const [tituloPdf, setTituloPdf] = useState("");
  const [descricaoPdf, setDescricaoPdf] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedbackPdf, setFeedbackPdf] = useState("");

  useEffect(() => {
    fetchTokens();
  }, []);

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
      setFeedbackPush("Erro: preenche o título e a mensagem da notificação.");
      return;
    }
    if (tokens.length === 0) {
      setFeedbackPush("Erro: nenhum telefone registrado na base de dados.");
      return;
    }
    if (!confirm(`Deseja disparar esta notificação para ${tokens.length} telefones?`)) return;

    setEnviando(true);
    setFeedbackPush("A comunicar com os servidores...");

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
      setFeedbackPdf("Erro: título e ficheiro PDF são obrigatórios!");
      return;
    }

    setUploading(true);
    setFeedbackPdf("A carregar ficheiro...");

    try {
      const fileExt = arquivo.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
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
        .insert([
          {
            titulo: tituloPdf,
            descricao: descricaoPdf,
            arquivo_url: publicUrlData.publicUrl,
            categoria: "Guia Digital",
          },
        ]);

      if (dbError) throw dbError;

      setFeedbackPdf("PDF publicado com sucesso!");
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
              Gestão do aplicativo
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
              <Sparkles size={14} style={{ color: AMBAR }} />
              Envia alertas em tempo real e disponibiliza guias digitais aos utilizadores.
            </p>
          </div>

          {/* Badge de dispositivos */}
          <div
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border shadow-sm"
            style={{
              background: loadingTokens
                ? "white"
                : `linear-gradient(135deg, ${VERDE}08, ${VERDE}02)`,
              borderColor: loadingTokens ? "#E2E8F0" : `${VERDE}30`,
            }}
          >
            {loadingTokens ? (
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
              style={{ color: loadingTokens ? "#64748B" : VERDE }}
            >
              {loadingTokens ? "A carregar..." : `${tokens.length} dispositivo${tokens.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 2 CARDS LADO A LADO                                        */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ═══ BLOCO 1: NOTIFICAÇÕES PUSH ═══ */}
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
                <Bell size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                  Notificações push
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Alerta imediato no ecrã dos utilizadores
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
                <Zap size={10} className="inline mr-1" />
                Tempo real
              </span>
            </div>

            {/* Aviso se não há dispositivos */}
            {!loadingTokens && tokens.length === 0 && (
              <div
                className="mx-5 mt-5 rounded-xl p-3.5 flex items-start gap-3 border"
                style={{
                  background: `linear-gradient(135deg, ${AMBAR}08, ${AMBAR}02)`,
                  borderColor: `${AMBAR}25`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
                >
                  <AlertTriangle size={14} />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-xs font-bold text-slate-800">
                    Sem dispositivos registrados
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Nenhum utilizador instalou o aplicativo ainda. Os alertas só
                    podem ser enviados quando houver dispositivos.
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleDisparar} className="p-5 space-y-4">
              <FormField
                label="Título do alerta"
                icon={<Type size={11} />}
                required
                contador={{ atual: titulo.length, max: 50 }}
              >
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className={inputCls}
                  placeholder="Ex: Novo artigo no blog!"
                  required
                  maxLength={50}
                  disabled={tokens.length === 0}
                />
              </FormField>

              <FormField
                label="Mensagem"
                icon={<MessageSquare size={11} />}
                required
                contador={{ atual: mensagem.length, max: 150 }}
              >
                <textarea
                  rows={4}
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  className={`${inputCls} resize-y min-h-[100px]`}
                  placeholder="Ex: Descobre as novidades do portal SagaTurismo..."
                  required
                  maxLength={150}
                  disabled={tokens.length === 0}
                />
              </FormField>

              {feedbackPush && <FeedbackInline feedback={feedbackPush} />}

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={enviando || tokens.length === 0}
                  className={`${jakarta.className} w-full text-white px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0`}
                  style={{
                    background:
                      tokens.length === 0
                        ? "#94A3B8"
                        : `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                  }}
                >
                  {enviando ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      A enviar para {tokens.length} dispositivos...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Disparar alerta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ═══ BLOCO 2: GUIAS PDF ═══ */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm anim-fade-up"
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
                <BookOpen size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                  Guias e panfletos
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Material digital em PDF para os turistas
                </p>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap"
                style={{
                  background: `${AZUL}10`,
                  color: AZUL,
                  borderColor: `${AZUL}25`,
                }}
              >
                <FileDown size={10} className="inline mr-1" />
                PDF
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadPdf} className="p-5 space-y-4">
              <FormField
                label="Título do material"
                icon={<Type size={11} />}
                required
              >
                <input
                  value={tituloPdf}
                  onChange={(e) => setTituloPdf(e.target.value)}
                  className={inputCls}
                  placeholder="Ex: Guia Turístico Oficial"
                  required
                />
              </FormField>

              <FormField
                label="Breve descrição"
                icon={<FileText size={11} />}
                hint="Aparece sob o título no portal público."
              >
                <textarea
                  rows={3}
                  value={descricaoPdf}
                  onChange={(e) => setDescricaoPdf(e.target.value)}
                  className={`${inputCls} resize-y min-h-[90px]`}
                  placeholder="Ex: Mapa completo com trilhas e pontos de apoio..."
                />
              </FormField>

              <FormField label="Ficheiro PDF" icon={<FileText size={11} />} required>
                <label
                  className="flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-xl p-5 cursor-pointer text-xs font-bold transition-all group"
                  style={{
                    background: arquivo
                      ? `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)`
                      : "#F8FAFC",
                    borderColor: arquivo ? `${VERDE}50` : "#CBD5E1",
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
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                    style={{
                      background: arquivo
                        ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
                        : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                    }}
                  >
                    {arquivo ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Upload size={20} />
                    )}
                  </div>
                  <span
                    className="truncate max-w-[240px] text-center"
                    style={{ color: arquivo ? VERDE : AZUL }}
                  >
                    {arquivo ? arquivo.name : "Clique para anexar o PDF"}
                  </span>
                  {arquivo && (
                    <span className="text-[10px] font-mono text-slate-500">
                      {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </label>
              </FormField>

              {feedbackPdf && <FeedbackInline feedback={feedbackPdf} />}

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={uploading}
                  className={`${jakarta.className} w-full text-white px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0`}
                  style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      A publicar PDF...
                    </>
                  ) : (
                    <>
                      <FileDown size={15} />
                      Publicar PDF
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* DICA INSTITUCIONAL                                          */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div
          className="rounded-2xl border p-4 flex items-start gap-3.5 anim-fade-up"
          style={{
            animationDelay: "180ms",
            background: `linear-gradient(135deg, ${AZUL}04, ${AZUL}01)`,
            borderColor: `${AZUL}20`,
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
          >
            <Info size={16} />
          </div>
          <div className="min-w-0 pt-1">
            <p className={`${jakarta.className} text-xs font-bold text-slate-800 mb-0.5`}>
              Sobre o envio de notificações
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              As notificações push são entregues imediatamente aos celulares que
              instalaram o aplicativo. Mantém o título abaixo de 50 caracteres e a
              mensagem abaixo de 150 — os textos maiores são cortados no ecrã
              bloqueado dos dispositivos.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}