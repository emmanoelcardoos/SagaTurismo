"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import {
  X, Loader2, User, IdCard, Mail, Calendar, ShieldCheck,
  Clock, BadgeCheck, AlertTriangle, Circle, Send, Download,
  Printer, FileText, Users, CreditCard, History, CheckCircle2,
  AlertCircle, Lock, Save, ExternalLink, RefreshCw,
} from "lucide-react";
import { portalFetchBlob, portalFetchJson } from "@/lib/portalApi";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

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
  "w-full bg-white text-[13px] rounded-md px-3 py-2 transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:outline-none border disabled:opacity-50 disabled:cursor-not-allowed";

const STATUS_BADGE: Record<string, { label: string; cor: string; bg: string; border: string; Icon: any }> = {
  ativo: { label: "Ativo", cor: SUCCESS, bg: "#ECFDF5", border: "#D1FAE5", Icon: BadgeCheck },
  aguardando_pagamento: { label: "Aguardando pagamento", cor: WARNING, bg: "#FFFBEB", border: "#FEF3C7", Icon: Clock },
  expirado: { label: "Expirado", cor: DANGER, bg: "#FEF2F2", border: "#FEE2E2", Icon: AlertTriangle },
  inativo: { label: "Inativo", cor: MUTED, bg: LINE_2, border: LINE, Icon: Circle },
};

const ACAO_LABELS: Record<string, string> = {
  edicao_email: "E-mail alterado",
  reprocessamento_email: "Reprocessamento e reenvio",
  envio_automatico_webhook: "Envio automático (pagamento)",
  download_pdf: "Download local do PDF",
  impressao_presencial: "Impressão presencial",
  visualizacao_comprovante: "Comprovante visualizado",
  expiracao_automatica: "Desativação automática (1 ano)",
  email_vencimento: "Aviso de vencimento enviado",
};

function fmtData(val?: string | null) {
  if (!val) return "—";
  const str = String(val);
  if (str.includes("-")) {
    const [a, m, d] = str.split("T")[0].split("-");
    if (a && m && d) return `${d}/${m}/${a}`;
  }
  return str;
}

function fmtDataHora(iso?: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("pt-BR") +
      " " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return iso;
  }
}

function fmtMoeda(valor: any) {
  const num = Number(valor || 0);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface ResidenteDetalheDrawerProps {
  residenteId: string | null;
  onClose: () => void;
  onSelectResidente?: (id: string) => void;
  onUpdated?: () => void;
}

export default function ResidenteDetalheDrawer({
  residenteId,
  onClose,
  onSelectResidente,
  onUpdated,
}: ResidenteDetalheDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [erroCarga, setErroCarga] = useState("");
  const [detalhes, setDetalhes] = useState<any>(null);

  // Edição de e-mail / reprocessamento
  const [emailEditado, setEmailEditado] = useState("");
  const [motivo, setMotivo] = useState("");
  const [salvandoEmail, setSalvandoEmail] = useState(false);
  const [reprocessando, setReprocessando] = useState(false);

  // PDF / Impressão / Comprovante
  const [baixandoPdf, setBaixandoPdf] = useState(false);
  const [preparandoImpressao, setPreparandoImpressao] = useState(false);
  const [abrindoComprovante, setAbrindoComprovante] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFilename, setPdfPreviewFilename] = useState("Carteira_Residente.pdf");
  const iframePrintRef = useRef<HTMLIFrameElement | null>(null);

  // Feedback
  const [feedback, setFeedback] = useState<{ tipo: "success" | "error" | "info"; texto: string } | null>(null);

  const carregarDetalhes = useCallback(async (id: string) => {
    setLoading(true);
    setErroCarga("");
    try {
      const data = await portalFetchJson(`/api/v1/admin/residentes/${encodeURIComponent(id)}`);
      setDetalhes(data);
      setEmailEditado(data?.residente?.email || "");
    } catch (err: any) {
      setErroCarga(err.message || "Falha ao carregar detalhes do residente.");
      setDetalhes(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!residenteId) {
      setDetalhes(null);
      setFeedback(null);
      setMotivo("");
      return;
    }
    setFeedback(null);
    setMotivo("");
    carregarDetalhes(residenteId);
  }, [residenteId, carregarDetalhes]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  useEffect(() => {
    if (!residenteId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (pdfPreviewUrl) {
          fecharPreviewImpressao();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [residenteId, pdfPreviewUrl, onClose]);

  if (!residenteId) return null;

  const residente = detalhes?.residente;
  const familia = detalhes?.familia;
  const pagamentos = detalhes?.pagamentos || [];
  const auditoria = detalhes?.auditoria || [];

  const statusInfo = STATUS_BADGE[residente?.status] || STATUS_BADGE.inativo;
  const StatusIcon = statusInfo.Icon;
  const isAguardandoPagamento = residente?.status === "aguardando_pagamento";
  const podeEmitir = Boolean(residente?.permite_reprocessar_e_baixar);
  const emailAlterado =
    emailEditado.trim().toLowerCase() !== String(residente?.email || "").trim().toLowerCase();

  function fecharPreviewImpressao() {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
  }

  async function handleSalvarEmail() {
    if (!residente) return;
    const emailLimpo = emailEditado.trim().toLowerCase();
    if (!emailLimpo || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLimpo)) {
      setFeedback({ tipo: "error", texto: "Informe um endereço de e-mail válido." });
      return;
    }

    setSalvandoEmail(true);
    setFeedback(null);
    try {
      const resp = await portalFetchJson(
        `/api/v1/admin/residentes/${encodeURIComponent(residente.id)}/email`,
        {
          method: "PATCH",
          body: JSON.stringify({
            email: emailLimpo,
            motivo: motivo.trim() || undefined,
          }),
        }
      );
      const extraSync =
        resp.pedidos_pendentes_sincronizados > 0
          ? ` (${resp.pedidos_pendentes_sincronizados} pedido(s) pendente(s) sincronizado(s)).`
          : ".";
      setFeedback({
        tipo: "success",
        texto: `${resp.mensagem || "E-mail atualizado com sucesso"}${extraSync}`,
      });
      setMotivo("");
      await carregarDetalhes(residente.id);
      onUpdated?.();
    } catch (err: any) {
      setFeedback({ tipo: "error", texto: err.message || "Erro ao salvar e-mail." });
    } finally {
      setSalvandoEmail(false);
    }
  }

  async function handleReprocessarCarteira() {
    if (!residente || !podeEmitir) return;
    const emailDestino = emailEditado.trim().toLowerCase();
    if (!emailDestino || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailDestino)) {
      setFeedback({ tipo: "error", texto: "Informe um e-mail válido antes de reprocessar." });
      return;
    }

    const msgConfirm = emailAlterado
      ? `Confirmar alteração do e-mail para "${emailDestino}" e reenvio da carteira de ${residente.nome_completo}?\n\nNenhuma nova cobrança Pix será gerada no Banco do Brasil.`
      : `Confirmar reprocessamento e reenvio da carteira de ${residente.nome_completo} para "${emailDestino}"?\n\nNenhuma nova cobrança Pix será gerada no Banco do Brasil.`;

    if (!confirm(msgConfirm)) return;

    setReprocessando(true);
    setFeedback({ tipo: "info", texto: "Gerando PDF da carteira e enviando email..." });
    try {
      const resp = await portalFetchJson(
        `/api/v1/admin/residentes/${encodeURIComponent(residente.id)}/reprocessar-carteira`,
        {
          method: "POST",
          body: JSON.stringify({
            email: emailDestino,
            motivo: motivo.trim() || undefined,
          }),
        }
      );
      setFeedback({
        tipo: "success",
        texto: resp.mensagem || `Carteira reenviada com sucesso para ${emailDestino}.`,
      });
      setMotivo("");
      await carregarDetalhes(residente.id);
      onUpdated?.();
    } catch (err: any) {
      setFeedback({ tipo: "error", texto: err.message || "Falha ao reprocessar carteira." });
      await carregarDetalhes(residente.id);
      onUpdated?.();
    } finally {
      setReprocessando(false);
    }
  }

  async function handleBaixarPdf() {
    if (!residente || !podeEmitir) return;
    setBaixandoPdf(true);
    setFeedback(null);
    try {
      const { blob, filename } = await portalFetchBlob(
        `/api/v1/admin/residentes/${encodeURIComponent(residente.id)}/carteira-pdf?modo=download`
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFeedback({ tipo: "success", texto: `PDF "${filename}" baixado com sucesso.` });
      await carregarDetalhes(residente.id);
    } catch (err: any) {
      setFeedback({ tipo: "error", texto: err.message || "Falha ao baixar PDF da carteira." });
    } finally {
      setBaixandoPdf(false);
    }
  }

  async function handleImprimirPresencial() {
    if (!residente || !podeEmitir) return;
    setPreparandoImpressao(true);
    setFeedback(null);
    try {
      const { blob, filename } = await portalFetchBlob(
        `/api/v1/admin/residentes/${encodeURIComponent(residente.id)}/carteira-pdf?modo=inline`
      );
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      const url = URL.createObjectURL(blob);
      setPdfPreviewFilename(filename);
      setPdfPreviewUrl(url);
      await carregarDetalhes(residente.id);
    } catch (err: any) {
      setFeedback({ tipo: "error", texto: err.message || "Falha ao preparar impressão." });
    } finally {
      setPreparandoImpressao(false);
    }
  }

  function dispararImpressaoIframe() {
    try {
      const win = iframePrintRef.current?.contentWindow;
      if (win) {
        win.focus();
        win.print();
        return;
      }
    } catch (err) {
      console.error("Fallback impressão:", err);
    }
    if (pdfPreviewUrl) {
      window.open(pdfPreviewUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function handleAbrirComprovante() {
    if (!residente) return;
    setAbrindoComprovante(true);
    setFeedback(null);
    try {
      const resp = await portalFetchJson(
        `/api/v1/admin/residentes/${encodeURIComponent(residente.id)}/comprovante-url`
      );
      if (resp.url) {
        window.open(resp.url, "_blank", "noopener,noreferrer");
        await carregarDetalhes(residente.id);
      }
    } catch (err: any) {
      setFeedback({ tipo: "error", texto: err.message || "Não foi possível abrir o comprovante." });
    } finally {
      setAbrindoComprovante(false);
    }
  }

  return (
    <div className={inter.className}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 transition-opacity"
        style={{ background: "rgba(10, 14, 20, 0.45)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Drawer Lateral */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[640px] bg-white flex flex-col shadow-2xl"
        style={{ borderLeft: `1px solid ${LINE}` }}
      >
        {/* Top bar */}
        <div
          className="h-14 shrink-0 px-5 flex items-center justify-between border-b"
          style={{ borderColor: LINE, background: BG }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <IdCard size={15} style={{ color: INK }} />
            <h2 className={`${jakarta.className} text-[14px] font-bold truncate`} style={{ color: INK }}>
              Detalhes da carteira
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {residente && (
              <button
                onClick={() => carregarDetalhes(residente.id)}
                className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                style={{ color: MUTED }}
                title="Atualizar dados"
                onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
              style={{ color: MUTED }}
              aria-label="Fechar detalhes"
              onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && !detalhes ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: SUBTLE }} />
              <p className="text-[12.5px]" style={{ color: MUTED }}>
                Carregando ficha do residente...
              </p>
            </div>
          ) : erroCarga ? (
            <div
              className="rounded-lg p-4 border flex items-start gap-2.5"
              style={{ background: "#FEF2F2", borderColor: "#FEE2E2", color: DANGER }}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="text-[12.5px]">
                <p className="font-semibold">Não foi possível carregar os detalhes</p>
                <p className="mt-1 opacity-90">{erroCarga}</p>
              </div>
            </div>
          ) : residente ? (
            <>
              {/* Identificação principal */}
              <div
                className="rounded-lg border p-4 flex items-center gap-4"
                style={{ borderColor: LINE, background: SURFACE }}
              >
                <div
                  className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border flex items-center justify-center"
                  style={{ borderColor: LINE, background: LINE_2 }}
                >
                  {residente.foto_assinada_url ? (
                    <img
                      src={residente.foto_assinada_url}
                      alt={residente.nome_completo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} style={{ color: SUBTLE }} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                      style={{
                        background: statusInfo.bg,
                        color: statusInfo.cor,
                        border: `1px solid ${statusInfo.border}`,
                      }}
                    >
                      <StatusIcon size={10} />
                      {statusInfo.label}
                    </span>

                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                      style={{ background: LINE_2, color: INK_2, border: `1px solid ${LINE}` }}
                    >
                      {familia?.tipo_vinculo === "dependente" ? "Dependente" : "Titular"}
                    </span>
                  </div>

                  <h3 className={`${jakarta.className} text-[16px] font-bold truncate`} style={{ color: INK }}>
                    {residente.nome_completo}
                  </h3>
                  <p className="text-[12px] font-mono mt-0.5" style={{ color: MUTED }}>
                    CPF: {residente.cpf} · QR {residente.qrcode_resumo}
                  </p>
                </div>
              </div>

              {/* Feedback inline */}
              {feedback && (
                <div
                  className="rounded-md p-3 border flex items-start gap-2.5 text-[12.5px]"
                  style={
                    feedback.tipo === "error"
                      ? { background: "#FEF2F2", borderColor: "#FEE2E2", color: DANGER }
                      : feedback.tipo === "success"
                      ? { background: "#ECFDF5", borderColor: "#D1FAE5", color: SUCCESS }
                      : { background: "#EFF6FF", borderColor: "#DBEAFE", color: ACCENT }
                  }
                >
                  {feedback.tipo === "error" ? (
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  ) : feedback.tipo === "success" ? (
                    <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 size={15} className="shrink-0 mt-0.5 animate-spin" />
                  )}
                  <p className="font-medium break-words">{feedback.texto}</p>
                </div>
              )}

              {/* Alerta de bloqueio quando aguardando pagamento ou não ativo */}
              {!podeEmitir && (
                <div
                  className="rounded-lg p-3.5 border flex items-start gap-2.5"
                  style={{
                    background: isAguardandoPagamento ? "#FFFBEB" : "#FEF2F2",
                    borderColor: isAguardandoPagamento ? "#FEF3C7" : "#FEE2E2",
                    color: isAguardandoPagamento ? WARNING : DANGER,
                  }}
                >
                  <Lock size={15} className="shrink-0 mt-0.5" />
                  <div className="text-[12px] leading-relaxed">
                    <p className="font-semibold">
                      {isAguardandoPagamento
                        ? "Emissão, download e reenvio bloqueados (pagamento pendente)"
                        : `Carteira não está ativa (status: ${residente.status})`}
                    </p>
                    <p className="mt-0.5 opacity-90">
                      {isAguardandoPagamento
                        ? "Nenhum e-mail será disparado enquanto o Pix não for confirmado. Você pode corrigir e salvar o e-mail abaixo para que o envio automático futuro chegue no endereço correto."
                        : "Carteiras expiradas ou inativas não podem ser reprocessadas nem impressas até serem renovadas."}
                    </p>
                  </div>
                </div>
              )}

              {/* BLOCO: DOWNLOAD LOCAL & IMPRESSÃO PRESENCIAL */}
              <section className="rounded-lg border overflow-hidden" style={{ borderColor: LINE }}>
                <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: LINE, background: BG }}>
                  <span className={`${jakarta.className} text-[12px] font-bold flex items-center gap-1.5`} style={{ color: INK }}>
                    <Printer size={13} />
                    Atendimento presencial (Download e Impressão)
                  </span>
                  <span className="text-[10.5px]" style={{ color: SUBTLE }}>
                    Mesmo PDF oficial do digital
                  </span>
                </div>
                <div className="p-4 flex flex-wrap gap-2.5">
                  <button
                    onClick={handleBaixarPdf}
                    disabled={!podeEmitir || baixandoPdf}
                    className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                    style={{ background: INK }}
                  >
                    {baixandoPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    Baixar PDF local
                  </button>

                  <button
                    onClick={handleImprimirPresencial}
                    disabled={!podeEmitir || preparandoImpressao}
                    className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-2 border transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                    style={{ borderColor: LINE, color: INK, background: SURFACE }}
                  >
                    {preparandoImpressao ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
                    Visualizar e imprimir agora
                  </button>
                </div>
              </section>

              {/* BLOCO: EDIÇÃO DE E-MAIL E REPROCESSAMENTO */}
              <section className="rounded-lg border overflow-hidden" style={{ borderColor: LINE }}>
                <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: LINE, background: BG }}>
                  <span className={`${jakarta.className} text-[12px] font-bold flex items-center gap-1.5`} style={{ color: INK }}>
                    <Mail size={13} />
                    E-mail e Reprocessamento da Carteira
                  </span>
                  <span className="text-[10.5px] font-medium" style={{ color: SUCCESS }}>
                    Sem cobrança Pix BB
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: MUTED }}>
                      E-mail do residente
                    </label>
                    <input
                      type="email"
                      value={emailEditado}
                      onChange={(e) => setEmailEditado(e.target.value)}
                      placeholder="residente@email.com"
                      className={inputCls}
                      style={{ borderColor: LINE }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: MUTED }}>
                      Motivo / Observação (para auditoria · opcional)
                    </label>
                    <input
                      type="text"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Ex.: E-mail digitado errado no cadastro ou não chegou na caixa de entrada"
                      className={inputCls}
                      style={{ borderColor: LINE }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      onClick={handleSalvarEmail}
                      disabled={salvandoEmail || !emailAlterado}
                      className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-2 border transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                      style={{ borderColor: LINE, color: INK, background: SURFACE }}
                    >
                      {salvandoEmail ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      Salvar apenas o e-mail
                    </button>

                    <button
                      onClick={handleReprocessarCarteira}
                      disabled={!podeEmitir || reprocessando}
                      className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                      style={{ background: SUCCESS }}
                    >
                      {reprocessando ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      {emailAlterado ? "Salvar e-mail e reenviar carteira" : "Reprocessar e reenviar email"}
                    </button>
                  </div>

                  <p className="text-[11px] leading-relaxed" style={{ color: SUBTLE }}>
                    O reprocessamento gera novamente o PDF oficial individual com a validade real cadastrada e reenvia pelo Resend, sem gerar cobrança no Banco do Brasil nem alterar o status financeiro.
                  </p>
                </div>
              </section>

              {/* BLOCO: DADOS DO CADASTRO & FAMÍLIA */}
              <section className="rounded-lg border overflow-hidden" style={{ borderColor: LINE }}>
                <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: LINE, background: BG }}>
                  <span className={`${jakarta.className} text-[12px] font-bold flex items-center gap-1.5`} style={{ color: INK }}>
                    <FileText size={13} />
                    Dados do cadastro
                  </span>
                  {residente.possui_comprovante && (
                    <button
                      onClick={handleAbrirComprovante}
                      disabled={abrindoComprovante}
                      className="text-[11.5px] font-semibold inline-flex items-center gap-1 transition-opacity hover:opacity-75 disabled:opacity-50"
                      style={{ color: ACCENT }}
                    >
                      {abrindoComprovante ? <Loader2 size={11} className="animate-spin" /> : <ExternalLink size={11} />}
                      Ver comprovante (link 2 min)
                    </button>
                  )}
                </div>

                <div className="p-4 grid grid-cols-2 gap-3 text-[12.5px]">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: SUBTLE }}>
                      Data de nascimento
                    </p>
                    <p className="font-medium mt-0.5" style={{ color: INK }}>
                      {fmtData(residente.data_nascimento)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: SUBTLE }}>
                      Validade da carteira
                    </p>
                    <p
                      className="font-semibold mt-0.5"
                      style={{ color: residente.esta_expirada ? DANGER : INK }}
                    >
                      {fmtData(residente.data_expiracao)}
                      {residente.esta_expirada ? " (vencida)" : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: SUBTLE }}>
                      Cadastrado em
                    </p>
                    <p className="font-medium mt-0.5" style={{ color: INK }}>
                      {fmtDataHora(residente.criado_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: SUBTLE }}>
                      Origem
                    </p>
                    <p className="font-medium mt-0.5" style={{ color: INK }}>
                      {residente.origem_cadastro}
                    </p>
                  </div>
                </div>

                {/* Vínculo familiar */}
                {(familia?.titular || (familia?.dependentes && familia.dependentes.length > 0)) && (
                  <div className="px-4 pb-4 pt-2 border-t space-y-2" style={{ borderColor: LINE_2 }}>
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: MUTED }}>
                      <Users size={11} />
                      Grupo familiar
                    </p>

                    {familia?.titular && (
                      <button
                        onClick={() => onSelectResidente?.(familia.titular.id)}
                        className="w-full text-left px-3 py-2 rounded-md border flex items-center justify-between hover:bg-[#FAFAFB] transition-colors"
                        style={{ borderColor: LINE }}
                      >
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold truncate" style={{ color: INK }}>
                            Titular: {familia.titular.nome_completo}
                          </p>
                          <p className="text-[11px] font-mono" style={{ color: MUTED }}>
                            {familia.titular.cpf}
                          </p>
                        </div>
                        <span className="text-[10.5px] font-semibold" style={{ color: ACCENT }}>
                          Abrir
                        </span>
                      </button>
                    )}

                    {familia?.dependentes?.length > 0 && (
                      <div className="space-y-1.5">
                        {familia.dependentes.map((dep: any) => (
                          <button
                            key={dep.id}
                            onClick={() => onSelectResidente?.(dep.id)}
                            className="w-full text-left px-3 py-2 rounded-md border flex items-center justify-between hover:bg-[#FAFAFB] transition-colors"
                            style={{ borderColor: LINE }}
                          >
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold truncate" style={{ color: INK }}>
                                {dep.nome_completo}
                              </p>
                              <p className="text-[11px] font-mono" style={{ color: MUTED }}>
                                {dep.cpf} · {dep.status}
                              </p>
                            </div>
                            <span className="text-[10.5px] font-semibold" style={{ color: ACCENT }}>
                              Ver
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* BLOCO: SITUAÇÃO FINANCEIRA (SOMENTE LEITURA) */}
              <section className="rounded-lg border overflow-hidden" style={{ borderColor: LINE }}>
                <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: LINE, background: BG }}>
                  <span className={`${jakarta.className} text-[12px] font-bold flex items-center gap-1.5`} style={{ color: INK }}>
                    <CreditCard size={13} />
                    Histórico de pagamentos (somente leitura)
                  </span>
                  <span className="text-[10.5px]" style={{ color: SUBTLE }}>
                    {pagamentos.length} registro(s)
                  </span>
                </div>

                {pagamentos.length === 0 ? (
                  <p className="p-4 text-[12px]" style={{ color: MUTED }}>
                    Nenhum pedido financeiro vinculado encontrado na tabela de pedidos.
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: LINE_2 }}>
                    {pagamentos.map((p: any) => {
                      const pago = p.status_pagamento === "pago";
                      return (
                        <div key={p.id} className="p-3.5 flex items-start justify-between gap-3 text-[12px]">
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style={{ color: INK }}>
                              {p.nome_item || "Taxa de Carteira"}
                            </p>
                            <p className="text-[11px] font-mono mt-0.5 truncate" style={{ color: MUTED }}>
                              TXID/Cód: {p.codigo_pedido}
                            </p>
                            <p className="text-[11px] mt-0.5" style={{ color: SUBTLE }}>
                              Método: {p.metodo_pagamento || "—"} · E-mail pedido: {p.email_cliente || "—"}
                              {p.criado_em ? ` · ${fmtDataHora(p.criado_em)}` : ""}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
                              style={
                                pago
                                  ? { background: "#ECFDF5", color: SUCCESS, border: "1px solid #D1FAE5" }
                                  : { background: "#FFFBEB", color: WARNING, border: "1px solid #FEF3C7" }
                              }
                            >
                              {p.status_pagamento}
                            </span>
                            <p className="font-bold mt-1" style={{ color: INK }}>
                              {fmtMoeda(p.valor_total)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* BLOCO: AUDITORIA / LOGS */}
              <section className="rounded-lg border overflow-hidden" style={{ borderColor: LINE }}>
                <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: LINE, background: BG }}>
                  <span className={`${jakarta.className} text-[12px] font-bold flex items-center gap-1.5`} style={{ color: INK }}>
                    <History size={13} />
                    Auditoria e envios recentes
                  </span>
                  <span className="text-[10.5px]" style={{ color: SUBTLE }}>
                    {auditoria.length} evento(s)
                  </span>
                </div>

                {auditoria.length === 0 ? (
                  <p className="p-4 text-[12px]" style={{ color: MUTED }}>
                    Nenhum evento registrado ainda para este residente.
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: LINE_2 }}>
                    {auditoria.map((ev: any) => (
                      <div key={ev.id} className="p-3.5 text-[12px] space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold flex items-center gap-1.5" style={{ color: INK }}>
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ background: ev.sucesso ? SUCCESS : DANGER }}
                            />
                            {ACAO_LABELS[ev.acao] || ev.acao}
                          </span>
                          <span className="text-[10.5px] font-mono" style={{ color: SUBTLE }}>
                            {fmtDataHora(ev.criado_em)}
                          </span>
                        </div>

                        <p className="text-[11px]" style={{ color: MUTED }}>
                          Operador: <strong style={{ color: INK_2 }}>{ev.operador_email || "sistema"}</strong>
                          {ev.resend_message_id ? ` · Resend ID: ${ev.resend_message_id}` : ""}
                        </p>

                        {(ev.email_anterior || ev.email_novo) && (
                          <p className="text-[11px]" style={{ color: MUTED }}>
                            {ev.email_anterior ? `${ev.email_anterior} → ` : "Destino: "}
                            <strong style={{ color: INK_2 }}>{ev.email_novo || "—"}</strong>
                          </p>
                        )}

                        {ev.motivo && (
                          <p className="text-[11px] italic" style={{ color: MUTED }}>
                            Motivo: {ev.motivo}
                          </p>
                        )}

                        {!ev.sucesso && ev.erro_detalhe && (
                          <p className="text-[11px] font-medium break-words" style={{ color: DANGER }}>
                            Erro: {ev.erro_detalhe}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>
      </aside>

      {/* Modal de Pré-visualização e Impressão Presencial */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0"
            style={{ background: "rgba(10, 14, 20, 0.65)", backdropFilter: "blur(3px)" }}
            onClick={fecharPreviewImpressao}
          />
          <div
            className="relative z-10 w-full max-w-3xl h-[82vh] bg-white rounded-xl overflow-hidden flex flex-col shadow-2xl border"
            style={{ borderColor: LINE }}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between gap-3"
              style={{ borderColor: LINE, background: BG }}
            >
              <div className="min-w-0">
                <p className={`${jakarta.className} text-[13.5px] font-bold truncate`} style={{ color: INK }}>
                  Impressão presencial — {pdfPreviewFilename}
                </p>
                <p className="text-[11px]" style={{ color: MUTED }}>
                  Carteira oficial no mesmo formato digital
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={pdfPreviewUrl}
                  download={pdfPreviewFilename}
                  className="h-8 px-3 rounded-md text-[12px] font-semibold border flex items-center gap-1.5"
                  style={{ borderColor: LINE, color: INK, background: SURFACE }}
                >
                  <Download size={13} />
                  Baixar
                </a>
                <button
                  onClick={dispararImpressaoIframe}
                  className="h-8 px-3.5 rounded-md text-[12px] font-semibold text-white flex items-center gap-1.5"
                  style={{ background: INK }}
                >
                  <Printer size={13} />
                  Imprimir agora
                </button>
                <button
                  onClick={fecharPreviewImpressao}
                  className="w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ color: MUTED }}
                  aria-label="Fechar pré-visualização"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <iframe
              ref={iframePrintRef}
              src={pdfPreviewUrl}
              title="Pré-visualização da Carteira"
              className="flex-1 w-full bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
