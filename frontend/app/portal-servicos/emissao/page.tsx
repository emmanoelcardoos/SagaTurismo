"use client";

import React, { useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle, Loader2, CheckCircle2, Upload, Search,
  User, Mail, Calendar, Camera, Copy, X, QrCode, Wallet,
  Info, RefreshCw, IdCard, Users, ShieldAlert,
  BadgeCheck, Clock, Zap, Check, FileText,
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
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1); }
      }
      .anim-fade-up { animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .anim-fade { animation: fadeIn 0.2s ease both; }
      .anim-scale { animation: scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
      .num { font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
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
  const isSucesso = feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("confirmado") || feedback.toLowerCase().includes("enviad");
  const tone = isErro ? "error" : isSucesso ? "success" : "info";

  const map = {
    error: { c: DANGER, bg: "#FEF2F2", b: "#FEE2E2", Icon: AlertCircle },
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
      <p className="text-[12.5px] font-medium break-words">{textoLimpo(feedback)}</p>
    </div>
  );
}

// Remove emojis residuais de mensagens legadas
function textoLimpo(s: string) {
  return s.replace(/[✅❌⚠️🔒📧💳🎉✨]/g, "").trim();
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA
// ═══════════════════════════════════════════════════════════════

export default function PortalEmissao() {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [loadingBusca, setLoadingBusca] = useState(false);

  const [reemissaoId, setReemissaoId] = useState<string | null>(null);
  const [novoEmail, setNovoEmail] = useState("");
  const [metodoReemissao, setMetodoReemissao] = useState("dinheiro");

  const [loadingAcao, setLoadingAcao] = useState(false);
  const [feedbackAcao, setFeedbackAcao] = useState("");
  const [pixGerado, setPixGerado] = useState<{
    qr: string;
    copiaCola: string;
    msg: string;
  } | null>(null);

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    email: "",
    data_nascimento: "",
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [metodoNovaEmissao, setMetodoNovaEmissao] = useState("dinheiro");
  const [savingManual, setSavingManual] = useState(false);

  const mascaraCPF = (valor: string) => {
    return valor
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!busca.trim()) return;

    setLoadingBusca(true);
    setPixGerado(null);
    setFeedbackAcao("");
    setReemissaoId(null);

    try {
      const resp = await fetch(
        `https://sagaturismo-production.up.railway.app/api/v1/residentes/buscar?q=${encodeURIComponent(busca)}`
      );
      if (!resp.ok) throw new Error("Falha na comunicação com o servidor.");

      const json = await resp.json();
      setResultados(json.dados || []);

      if (!json.dados || json.dados.length === 0) {
        setFeedbackAcao("Nenhum cidadão encontrado com esse Nome ou CPF.");
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackAcao(`Erro na busca: ${err.message}`);
    } finally {
      setLoadingBusca(false);
    }
  }

  async function handleConfirmarReemissao(residente: any) {
    if (!novoEmail) {
      alert("Insira o novo e-mail para envio.");
      return;
    }
    if (!confirm(`Confirmar emissão de 2ª via para ${residente.nome_completo}?`)) return;

    setLoadingAcao(true);
    setFeedbackAcao("Processando a 2ª via...");
    setPixGerado(null);

    try {
      const { error } = await supabase
        .from("rd_residentes")
        .update({ email: novoEmail })
        .eq("id", residente.id);
      if (error) throw error;

      const reqBody = {
        nome_cliente: residente.nome_completo,
        cpf_cliente: residente.cpf,
        email_cliente: novoEmail,
        telefone_cliente: residente.telefone || "00000000000",
        foto_url: residente.foto_url,
        data_nascimento: residente.data_nascimento,
        token_id: residente.id,
        quantidade: 1,
        is_reemissao: true,
      };

      if (metodoReemissao === "dinheiro") {
        const resp = await fetch(
          "https://sagaturismo-production.up.railway.app/api/v1/pagamentos/carteira-gratuita",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody),
          }
        );
        if (!resp.ok) throw new Error("Erro ao disparar o e-mail.");
        setFeedbackAcao("Pagamento em dinheiro confirmado. A 2ª via foi enviada por e-mail.");
      } else {
        const resp = await fetch(
          "https://sagaturismo-production.up.railway.app/api/v1/pagamentos/carteira-bb",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody),
          }
        );
        const data = await resp.json();
        if (!resp.ok || !data.sucesso) throw new Error("Falha ao gerar PIX.");
        setPixGerado({
          qr: data.pix_qrcode_img,
          copiaCola: data.pix_copia_cola,
          msg: "PIX de R$ 5,00 gerado. O e-mail com a carteira será enviado automaticamente após o pagamento.",
        });
        setFeedbackAcao("");
      }
      setReemissaoId(null);
    } catch (err: any) {
      setFeedbackAcao(`Erro: ${err.message}`);
    } finally {
      setLoadingAcao(false);
    }
  }

  async function handleEmitirManual(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.cpf || !form.email || !form.data_nascimento || !foto) {
      alert("Preencha todos os campos e anexe a fotografia.");
      return;
    }
    if (!confirm(`Confirmar emissão de nova carteira para ${form.nome}?`)) return;

    setSavingManual(true);
    setFeedbackAcao("Enviando fotografia...");
    setPixGerado(null);

    try {
      const ext = foto.name.split(".").pop();
      const path = `residentes/carteira_manual_${form.cpf.replace(/\D/g, "")}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("galeria")
        .upload(path, foto, { upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const { data: pubUrl } = supabase.storage.from("galeria").getPublicUrl(path);
      const fotoUrlCompleta = pubUrl.publicUrl;

      setFeedbackAcao("Registrando cidadão...");

      const statusFinal = metodoNovaEmissao === "dinheiro" ? "ativo" : "aguardando_pagamento";

      const respResidente = await fetch(
        "https://sagaturismo-production.up.railway.app/api/v1/residentes/emissao-manual",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: form.nome,
            cpf: form.cpf,
            email: form.email,
            data_nascimento: form.data_nascimento,
            foto_url: fotoUrlCompleta,
            status: statusFinal,
          }),
        }
      );

      if (!respResidente.ok) throw new Error("Erro ao registrar cidadão no servidor.");
      const dadosResidente = await respResidente.json();
      const residenteId = dadosResidente.residente_id;

      const reqBody = {
        nome_cliente: form.nome,
        cpf_cliente: form.cpf,
        email_cliente: form.email,
        telefone_cliente: "00000000000",
        foto_url: fotoUrlCompleta,
        data_nascimento: form.data_nascimento,
        token_id: residenteId,
        quantidade: 1,
        is_reemissao: false,
      };

      if (metodoNovaEmissao === "dinheiro") {
        const respCarteira = await fetch(
          "https://sagaturismo-production.up.railway.app/api/v1/pagamentos/carteira-gratuita",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody),
          }
        );
        if (!respCarteira.ok) throw new Error("Erro no envio do e-mail.");
        setFeedbackAcao("Cidadão registrado. Carteira enviada por e-mail.");
      } else {
        const respCarteira = await fetch(
          "https://sagaturismo-production.up.railway.app/api/v1/pagamentos/carteira-bb",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody),
          }
        );
        const data = await respCarteira.json();
        if (!respCarteira.ok) throw new Error("Falha ao gerar PIX.");
        setPixGerado({
          qr: data.pix_qrcode_img,
          copiaCola: data.pix_copia_cola,
          msg: "PIX de R$ 20,00 gerado. A carteira será enviada automaticamente após o pagamento.",
        });
        setFeedbackAcao("");
      }

      setForm({ nome: "", cpf: "", email: "", data_nascimento: "" });
      setFoto(null);
    } catch (err: any) {
      console.error(err);
      setFeedbackAcao(`Erro: ${err.message}`);
    } finally {
      setSavingManual(false);
    }
  }

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-4`}>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* HEADER                                                      */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="anim-fade-up">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
              style={{ background: INK, color: "#FFF" }}
            >
              <IdCard size={9} strokeWidth={3} />
              Carteira
            </span>
            <span className="text-[11px]" style={{ color: MUTED }}>
              2ª via · R$ 5,00 · Nova · R$ 20,00
            </span>
          </div>
          <h1
            className={`${jakarta.className} text-[26px] font-bold tracking-tight`}
            style={{ color: INK, letterSpacing: "-0.025em" }}
          >
            Emissão de carteiras
          </h1>
          <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
            Pesquise residentes para 2ª via ou emita novas carteiras manualmente.
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* PIX MODAL                                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {pixGerado && (
          <Panel noPad className="anim-scale max-w-2xl mx-auto">
            <PanelHeader
              title="Cobrança PIX gerada"
              subtitle="Banco do Brasil · Pagamento instantâneo"
              action={
                <button
                  onClick={() => setPixGerado(null)}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                  style={{ color: SUBTLE }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  aria-label="Fechar"
                >
                  <X size={15} />
                </button>
              }
            />

            <div className="p-6 flex flex-col items-center">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                style={{ background: LINE_2, color: INK }}
              >
                <QrCode size={20} strokeWidth={2} />
              </div>

              <p className="text-[12.5px] leading-relaxed max-w-md text-center mb-6" style={{ color: MUTED }}>
                {pixGerado.msg}
              </p>

              <div
                className="p-3 rounded-md border mb-5"
                style={{ borderColor: LINE, background: SURFACE }}
              >
                <img
                  src={pixGerado.qr}
                  alt="QR Code PIX"
                  className="w-52 h-52 block"
                />
              </div>

              <div className="w-full max-w-md">
                <label
                  className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1.5"
                  style={{ color: MUTED }}
                >
                  <FileText size={10} />
                  Código copia e cola
                </label>
                <div
                  className="rounded-md border flex items-stretch overflow-hidden"
                  style={{ borderColor: LINE, background: SURFACE }}
                >
                  <input
                    type="text"
                    value={pixGerado.copiaCola}
                    readOnly
                    className="flex-1 text-[11.5px] px-3 py-2.5 bg-transparent outline-none truncate font-mono"
                    style={{ color: MUTED }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixGerado.copiaCola);
                      alert("Código copiado!");
                    }}
                    className="px-3.5 text-white text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                    style={{ background: INK }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                  >
                    <Copy size={11} />
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BLOCO 1 · BUSCA + 2ª VIA                                    */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <Panel noPad className="anim-fade-up">
          <PanelHeader
            title="Localizar cidadão"
            subtitle="Pesquisa por nome ou CPF · 2ª via R$ 5,00"
            badge={
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
                style={{ background: LINE_2, color: MUTED, border: `1px solid ${LINE}` }}
              >
                <Search size={9} className="inline mr-1" />
                Busca
              </span>
            }
          />

          <div className="p-5 space-y-4">
            <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: SUBTLE }}
                />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(mascaraCPF(e.target.value))}
                  placeholder="Nome ou CPF (000.000.000-00)..."
                  className={`${inputCls} pl-9`}
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
              </div>
              <button
                type="submit"
                disabled={loadingBusca}
                className="h-10 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors disabled:opacity-50 shrink-0"
                style={{ background: INK }}
                onMouseEnter={(e) => !loadingBusca && (e.currentTarget.style.background = INK_2)}
                onMouseLeave={(e) => !loadingBusca && (e.currentTarget.style.background = INK)}
              >
                {loadingBusca ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search size={13} />
                    Buscar
                  </>
                )}
              </button>
            </form>

            {feedbackAcao && !savingManual && <FeedbackInline feedback={feedbackAcao} />}

            {/* Resultados */}
            {resultados.length > 0 && (
              <div className="space-y-2 pt-2">
                {resultados.map((res, idx) => {
                  const isAtivo = res.status === "ativo";
                  const tone = isAtivo ? "success" : "warning";
                  const expandido = reemissaoId === res.id;

                  return (
                    <article
                      key={res.id}
                      style={{
                        animationDelay: `${idx * 20}ms`,
                        borderColor: LINE,
                      }}
                      className="bg-white border rounded-lg overflow-hidden anim-fade-up hover:border-slate-300 transition-colors"
                    >
                      <div className="p-3.5 flex items-center gap-3">
                        {/* Avatar */}
                        <div
                          className="w-11 h-11 rounded-md overflow-hidden shrink-0 border"
                          style={{ borderColor: LINE, background: LINE_2 }}
                        >
                          {res.foto_url && res.foto_url.includes("http") ? (
                            <img
                              src={res.foto_url}
                              alt="Foto"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ color: SUBTLE }}>
                              <User size={18} strokeWidth={1.5} />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {isAtivo ? (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                                style={{ background: "#ECFDF5", color: SUCCESS, border: "1px solid #D1FAE5" }}
                              >
                                <BadgeCheck size={9} />
                                Ativo
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                                style={{ background: "#FFFBEB", color: WARNING, border: "1px solid #FEF3C7" }}
                              >
                                <Clock size={9} />
                                {res.status}
                              </span>
                            )}
                          </div>
                          <h4
                            className={`${jakarta.className} text-[13.5px] font-bold truncate`}
                            style={{ color: INK }}
                          >
                            {res.nome_completo}
                          </h4>
                          <div
                            className="flex items-center gap-3 text-[11px] flex-wrap mt-0.5 num"
                            style={{ color: SUBTLE }}
                          >
                            <span className="flex items-center gap-1 font-mono">
                              <IdCard size={10} /> {res.cpf}
                            </span>
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <Mail size={10} /> {res.email}
                            </span>
                          </div>
                        </div>

                        {/* Botão 2ª via */}
                        <button
                          onClick={() => {
                            setReemissaoId(expandido ? null : res.id);
                            setNovoEmail(res.email);
                          }}
                          className="h-8 px-2.5 rounded-md text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                          style={{
                            background: expandido ? LINE_2 : INK,
                            color: expandido ? INK : "#FFF",
                          }}
                          onMouseEnter={(e) => {
                            if (!expandido) e.currentTarget.style.background = INK_2;
                          }}
                          onMouseLeave={(e) => {
                            if (!expandido) e.currentTarget.style.background = INK;
                          }}
                        >
                          {expandido ? (
                            <>
                              <X size={12} />
                              Cancelar
                            </>
                          ) : (
                            <>
                              <RefreshCw size={12} />
                              2ª via
                            </>
                          )}
                        </button>
                      </div>

                      {/* Painel expansível */}
                      {expandido && (
                        <div
                          className="border-t p-4 anim-fade-up"
                          style={{ borderColor: LINE, background: BG }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center"
                              style={{ background: INK, color: "#FFF" }}
                            >
                              <RefreshCw size={11} strokeWidth={2.5} />
                            </div>
                            <p
                              className={`${jakarta.className} text-[11px] font-bold uppercase tracking-[0.08em]`}
                              style={{ color: MUTED }}
                            >
                              Configurações da 2ª via · R$ 5,00
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <FormField
                              label="E-mail de destino"
                              icon={<Mail size={10} />}
                              className="md:col-span-5"
                            >
                              <input
                                type="email"
                                value={novoEmail}
                                onChange={(e) => setNovoEmail(e.target.value)}
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
                                placeholder="email@exemplo.com"
                              />
                            </FormField>

                            <FormField
                              label="Método"
                              icon={<Wallet size={10} />}
                              className="md:col-span-4"
                            >
                              <select
                                value={metodoReemissao}
                                onChange={(e) => setMetodoReemissao(e.target.value)}
                                className={inputCls}
                                style={{ borderColor: LINE }}
                              >
                                <option value="dinheiro">Dinheiro · envio imediato</option>
                                <option value="pix">PIX · gerar QR Code</option>
                              </select>
                            </FormField>

                            <div className="md:col-span-3">
                              <button
                                onClick={() => handleConfirmarReemissao(res)}
                                disabled={loadingAcao}
                                className="w-full h-10 px-3 rounded-md text-[12.5px] font-semibold flex items-center justify-center gap-1.5 text-white transition-colors disabled:opacity-50"
                                style={{ background: INK }}
                                onMouseEnter={(e) => !loadingAcao && (e.currentTarget.style.background = INK_2)}
                                onMouseLeave={(e) => !loadingAcao && (e.currentTarget.style.background = INK)}
                              >
                                {loadingAcao ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin" />
                                    Processando
                                  </>
                                ) : (
                                  <>
                                    <Check size={12} />
                                    Confirmar
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </Panel>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* DIVISOR                                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="flex items-center gap-3 anim-fade-up">
          <div className="flex-1 h-px" style={{ background: LINE }} />
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-md"
            style={{ color: MUTED, background: LINE_2, border: `1px solid ${LINE}` }}
          >
            ou
          </span>
          <div className="flex-1 h-px" style={{ background: LINE }} />
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BLOCO 2 · EMISSÃO MANUAL                                    */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <Panel noPad className="anim-fade-up max-w-4xl mx-auto">
          <PanelHeader
            title="Emissão manual de nova carteira"
            subtitle="Apenas para cidadãos sem acesso tecnológico"
            badge={
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
                style={{ background: "#FFFBEB", color: WARNING, border: "1px solid #FEF3C7" }}
              >
                <ShieldAlert size={9} />
                R$ 20,00
              </span>
            }
          />

          {/* Aviso crítico */}
          <div
            className="mx-5 mt-5 rounded-md p-3.5 flex items-start gap-3 border"
            style={{ background: "#FFFBEB", borderColor: "#FEF3C7" }}
          >
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
              style={{ background: WARNING, color: "#FFF" }}
            >
              <Info size={14} />
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-semibold" style={{ color: INK }}>
                Operação sensível
              </p>
              <p className="text-[11.5px] mt-0.5 leading-relaxed" style={{ color: MUTED }}>
                Esta ação <strong>cria um novo cidadão</strong> na base de dados e gera uma carteira oficial.
                Confirme sempre os documentos físicos antes de prosseguir.
              </p>
            </div>
          </div>

          <form onSubmit={handleEmitirManual} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nome completo" icon={<User size={10} />} required>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
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
                  placeholder="Nome civil do cidadão"
                  required
                />
              </FormField>

              <FormField label="CPF" icon={<IdCard size={10} />} required>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: mascaraCPF(e.target.value) })}
                  className={`${inputCls} font-mono num`}
                  style={{ borderColor: LINE }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = INK;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = LINE;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  placeholder="000.000.000-00"
                  required
                />
              </FormField>

              <FormField label="E-mail" icon={<Mail size={10} />} required hint="Para onde o PDF será enviado.">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  placeholder="cidadao@email.com"
                  required
                />
              </FormField>

              <FormField label="Data de nascimento" icon={<Calendar size={10} />} required>
                <input
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
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
                  required
                />
              </FormField>

              <FormField label="Foto 3x4" icon={<Camera size={10} />} required>
                <label
                  className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md h-[42px] px-3 cursor-pointer text-[12px] font-semibold transition-colors"
                  style={{
                    background: foto ? "#ECFDF5" : SURFACE,
                    borderColor: foto ? "#D1FAE5" : LINE,
                    color: foto ? SUCCESS : MUTED,
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFoto(e.target.files?.[0] || null)}
                    required
                  />
                  {foto ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span className="truncate max-w-[200px]">{foto.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={13} />
                      Anexar fotografia
                    </>
                  )}
                </label>
              </FormField>

              <FormField label="Método de recebimento" icon={<Wallet size={10} />}>
                <select
                  value={metodoNovaEmissao}
                  onChange={(e) => setMetodoNovaEmissao(e.target.value)}
                  className={inputCls}
                  style={{ borderColor: LINE }}
                >
                  <option value="dinheiro">Dinheiro · emissão imediata</option>
                  <option value="pix">PIX · gerar QR Code</option>
                </select>
              </FormField>
            </div>

            {feedbackAcao && savingManual && <FeedbackInline feedback={feedbackAcao} />}

            <div
              className="pt-4 border-t flex items-center justify-between gap-3 flex-wrap"
              style={{ borderColor: LINE }}
            >
              <p className="text-[11.5px] flex items-center gap-1.5" style={{ color: MUTED }}>
                <ShieldAlert size={12} style={{ color: WARNING }} />
                Confirma que os documentos foram verificados?
              </p>

              <button
                type="submit"
                disabled={savingManual || loadingAcao}
                className="h-10 px-4 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors disabled:opacity-50 shrink-0"
                style={{ background: INK }}
                onMouseEnter={(e) => !savingManual && !loadingAcao && (e.currentTarget.style.background = INK_2)}
                onMouseLeave={(e) => !savingManual && !loadingAcao && (e.currentTarget.style.background = INK)}
              >
                {savingManual ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} />
                    {metodoNovaEmissao === "dinheiro" ? "Registrar e emitir" : "Registrar e gerar PIX"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  );
}