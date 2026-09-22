"use client";

import React, { useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle, Loader2, CheckCircle2, Upload, Sparkles, Search,
  User, CreditCard, Mail, Calendar, ImageIcon, Camera, Copy,
  X, QrCode, Wallet, Zap, Target, Filter, Inbox, ShieldAlert,
  BadgeCheck, Clock, ArrowRight, Info, FileText, Hash, RefreshCw,
  IdCard, Gift, Users, ChevronRight, Circle,
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
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.97); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes pulseDot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.85); }
      }
      .anim-fade-up { animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .anim-fade { animation: fadeIn 0.25s ease both; }
      .anim-scale { animation: scaleIn 0.2s ease both; }
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

  const isErro = feedback.toLowerCase().includes("erro") || feedback.includes("❌");
  const isSucesso = feedback.toLowerCase().includes("sucesso") || feedback.includes("✅");
  const cor = isErro ? VERMELHO : isSucesso ? VERDE : AZUL;
  const gradient = isErro
    ? `linear-gradient(135deg, ${VERMELHO}, #F87171)`
    : isSucesso
    ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
    : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`;
  const Icone = isErro ? AlertCircle : isSucesso ? CheckCircle2 : Loader2;

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
        `https://sagaturismo-production.up.railway.app/api/v1/residentes/buscar?q=${encodeURIComponent(
          busca
        )}`
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
    if (!confirm(`Confirmar emissão de 2ª via para ${residente.nome_completo}?`))
      return;

    setLoadingAcao(true);
    setFeedbackAcao("A processar a 2ª Via...");
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
        setFeedbackAcao(
          "Pagamento em Dinheiro confirmado! A 2ª Via foi enviada por e-mail."
        );
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
          msg: "PIX de R$ 5,00 gerado! O e-mail com a carteira será enviado automaticamente pelo banco após o pagamento.",
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
    if (!confirm(`Forçar criação de cidadão e gerar nova carteira para ${form.nome}?`))
      return;

    setSavingManual(true);
    setFeedbackAcao("A enviar fotografia para a galeria...");
    setPixGerado(null);

    try {
      const ext = foto.name.split(".").pop();
      const path = `residentes/carteira_manual_${form.cpf.replace(
        /\D/g,
        ""
      )}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("galeria")
        .upload(path, foto, { upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const { data: pubUrl } = supabase.storage.from("galeria").getPublicUrl(path);
      const fotoUrlCompleta = pubUrl.publicUrl;

      setFeedbackAcao("A registrar cidadão no sistema...");

      const statusFinal =
        metodoNovaEmissao === "dinheiro" ? "ativo" : "aguardando_pagamento";

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

      if (!respResidente.ok)
        throw new Error("Erro ao registrar cidadão no servidor.");
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
        setFeedbackAcao(
          "Cidadão criado e carteira enviada (Pagamento em Dinheiro)."
        );
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
          msg: "PIX de R$ 20,00 gerado! A carteira será enviada automaticamente após o pagamento.",
        });
        setFeedbackAcao("");
      }

      setForm({ nome: "", cpf: "", email: "", data_nascimento: "" });
      setFoto(null);
    } catch (err: any) {
      console.error(err);
      setFeedbackAcao(`Erro Manual: ${err.message}`);
    } finally {
      setSavingManual(false);
    }
  }

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-8 anim-fade-up`}>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* CABEÇALHO                                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div>
          <div className="flex items-center gap-2 mb-1.5">
          </div>
          <h1 className={`${jakarta.className} text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight`}>
            Central de gestão & emissão
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
            <Sparkles size={14} style={{ color: VERMELHO }} />
            Pesquisa residentes para 2ª Via (R$ 5) ou emite novas carteiras do zero (R$ 20).
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* CARD DE PIX GERADO                                          */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {pixGerado && (
          <div
            className="relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm max-w-2xl mx-auto anim-scale"
          >
            <div
              className="h-1"
              style={{ background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})` }}
            />

            <div
              className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${AZUL}08, ${AZUL}02)` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
              >
                <QrCode size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                  Cobrança PIX gerada
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Banco do Brasil · Pagamento instantâneo
                </p>
              </div>
              <button
                onClick={() => setPixGerado(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                title="Fechar"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center">
              <p className="text-xs text-slate-600 text-center font-medium max-w-md mb-5 leading-relaxed">
                {pixGerado.msg}
              </p>

              <img
                src={pixGerado.qr}
                alt="QR Code PIX"
                className="w-52 h-52 rounded-2xl border-4 border-white shadow-md mb-5"
              />

              <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                <input
                  type="text"
                  value={pixGerado.copiaCola}
                  readOnly
                  className="flex-1 text-xs text-slate-500 bg-transparent outline-none truncate font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pixGerado.copiaCola);
                    alert("Código Copiado!");
                  }}
                  className={`${jakarta.className} text-white px-3.5 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md shrink-0`}
                  style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                >
                  <Copy size={11} /> Copiar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BLOCO 1: BUSCA E 2ª VIA                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}

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
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
            >
              <Search size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                Localizar cidadão
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pesquisa por nome ou CPF para emissão de 2ª via (R$ 5,00)
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(mascaraCPF(e.target.value))}
                  placeholder="Digite o Nome ou CPF (000.000.000-00)..."
                  className={`${inputCls} pl-10`}
                />
              </div>
              <button
                type="submit"
                disabled={loadingBusca}
                className={`${jakarta.className} text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0 shrink-0`}
                style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
              >
                {loadingBusca ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    A procurar...
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    Procurar
                  </>
                )}
              </button>
            </form>

            {feedbackAcao && !savingManual && <FeedbackInline feedback={feedbackAcao} />}

            {/* Resultados */}
            {resultados.length > 0 && (
              <div className="space-y-3 pt-2">
                {resultados.map((res, idx) => {
                  const isAtivo = res.status === "ativo";
                  const corStatus = isAtivo ? AZUL : AMBAR;
                  const IconeStatus = isAtivo ? BadgeCheck : Clock;
                  const expandido = reemissaoId === res.id;

                  return (
                    <article
                      key={res.id}
                      style={{ animationDelay: `${idx * 30}ms` }}
                      className="bg-slate-50/70 border border-slate-200/80 rounded-2xl overflow-hidden transition-all hover:bg-white hover:border-slate-300 anim-fade-up"
                    >
                      <div className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                            {res.foto_url && res.foto_url.includes("http") ? (
                              <img
                                src={res.foto_url}
                                alt="Foto"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User size={22} className="text-slate-400" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border"
                              style={{
                                background: `${corStatus}10`,
                                color: corStatus,
                                borderColor: `${corStatus}25`,
                              }}
                            >
                              <IconeStatus size={10} />
                              {res.status}
                            </span>
                          </div>
                          <h4
                            className={`${jakarta.className} text-base font-bold text-slate-900 truncate mb-1`}
                          >
                            {res.nome_completo}
                          </h4>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1 font-mono">
                              <IdCard size={10} /> {res.cpf}
                            </span>
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <Mail size={10} /> {res.email}
                            </span>
                          </div>
                        </div>

                        {/* Botão */}
                        <button
                          onClick={() => {
                            setReemissaoId(expandido ? null : res.id);
                            setNovoEmail(res.email);
                          }}
                          className={`${jakarta.className} text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm hover:shadow-md shrink-0 w-full sm:w-auto justify-center`}
                          style={{
                            background: expandido
                              ? "#64748B"
                              : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                          }}
                        >
                          {expandido ? (
                            <>
                              <X size={12} /> Cancelar
                            </>
                          ) : (
                            <>
                              <RefreshCw size={12} /> 2ª via
                            </>
                          )}
                        </button>
                      </div>

                      {/* Painel expansível de reemissão */}
                      {expandido && (
                        <div className="border-t border-slate-200 bg-white p-4 anim-fade-up">
                          <div className="flex items-center gap-2 mb-4">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                              style={{
                                background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                              }}
                            >
                              <Gift size={12} />
                            </div>
                            <p className={`${jakarta.className} text-xs font-bold text-slate-700 uppercase tracking-widest`}>
                              Configurações da 2ª via
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <FormField
                              label="E-mail de destino"
                              icon={<Mail size={10} />}
                              className="md:col-span-1"
                            >
                              <input
                                type="email"
                                value={novoEmail}
                                onChange={(e) => setNovoEmail(e.target.value)}
                                className={inputCls}
                                placeholder="email@exemplo.com"
                              />
                            </FormField>

                            <FormField
                              label="Recebimento da taxa"
                              icon={<Wallet size={10} />}
                              className="md:col-span-1"
                            >
                              <select
                                value={metodoReemissao}
                                onChange={(e) => setMetodoReemissao(e.target.value)}
                                className={inputCls}
                              >
                                <option value="dinheiro">
                                  Dinheiro · envia e-mail imediato
                                </option>
                                <option value="pix">
                                  PIX · gera QR Code (R$ 5)
                                </option>
                              </select>
                            </FormField>

                            <button
                              onClick={() => handleConfirmarReemissao(res)}
                              disabled={loadingAcao}
                              className={`${jakarta.className} text-white px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0 shrink-0`}
                              style={{
                                background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`,
                              }}
                            >
                              {loadingAcao ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" />
                                  A processar...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={12} />
                                  Confirmar e enviar
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* DIVISOR "OU"                                                */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span
            className={`${jakarta.className} text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 py-1 rounded-full bg-slate-100 border border-slate-200`}
          >
            ou
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BLOCO 2: EMISSÃO MANUAL                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm max-w-4xl mx-auto">
          <div
            className="h-0.5"
            style={{ background: `linear-gradient(90deg, ${VERMELHO}, #F87171)` }}
          />

          <div
            className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
            style={{ background: `linear-gradient(135deg, ${VERMELHO}06, ${VERMELHO}02)` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ background: `linear-gradient(135deg, ${VERMELHO}, #F87171)` }}
            >
              <Zap size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                Emissão de nova carteira
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Apenas para cidadãos sem registro ou acesso tecnológico
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
              <ShieldAlert size={10} className="inline mr-1" />
              R$ 20,00
            </span>
          </div>

          {/* Aviso crítico */}
          <div
            className="mx-5 mt-5 rounded-xl p-4 flex items-start gap-3 border"
            style={{
              background: `linear-gradient(135deg, ${AMBAR}08, ${AMBAR}02)`,
              borderColor: `${AMBAR}25`,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
            >
              <Info size={14} />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-xs font-bold text-slate-800">
                Operação sensível
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Esta ação <strong>cria um novo cidadão</strong> na base de dados e
                gera uma carteira oficial. Confirma sempre os documentos físicos
                antes de prosseguir.
              </p>
            </div>
          </div>

          <form onSubmit={handleEmitirManual} className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Nome completo"
                icon={<User size={11} />}
                required
              >
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className={inputCls}
                  placeholder="Nome civil do cidadão"
                  required
                />
              </FormField>

              <FormField label="CPF" icon={<IdCard size={11} />} required>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) =>
                    setForm({ ...form, cpf: mascaraCPF(e.target.value) })
                  }
                  className={`${inputCls} font-mono`}
                  placeholder="000.000.000-00"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="E-mail (para onde vai o PDF)"
                icon={<Mail size={11} />}
                required
              >
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                  placeholder="cidadão@email.com"
                  required
                />
              </FormField>

              <FormField
                label="Data de nascimento"
                icon={<Calendar size={11} />}
                required
              >
                <input
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) =>
                    setForm({ ...form, data_nascimento: e.target.value })
                  }
                  className={inputCls}
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Foto do cidadão (3x4)"
                icon={<Camera size={11} />}
                required
              >
                <label
                  className="flex items-center justify-center gap-2.5 border-2 border-dashed rounded-xl p-4 cursor-pointer text-xs font-bold transition-all group"
                  style={{
                    background: foto
                      ? `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)`
                      : "#F8FAFC",
                    borderColor: foto ? `${VERDE}50` : "#CBD5E1",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFoto(e.target.files?.[0] || null)}
                    required
                  />
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                    style={{
                      background: foto
                        ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
                        : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                    }}
                  >
                    {foto ? <CheckCircle2 size={16} /> : <Upload size={16} />}
                  </div>
                  <span
                    className="truncate max-w-[200px]"
                    style={{ color: foto ? VERDE : AZUL }}
                  >
                    {foto ? "Foto carregada" : "Anexar fotografia"}
                  </span>
                </label>
              </FormField>

              <FormField
                label="Recebimento da taxa (R$ 20,00)"
                icon={<Wallet size={11} />}
              >
                <select
                  value={metodoNovaEmissao}
                  onChange={(e) => setMetodoNovaEmissao(e.target.value)}
                  className={inputCls}
                >
                  <option value="dinheiro">
                    Dinheiro · emissão imediata
                  </option>
                  <option value="pix">
                    PIX · gera QR Code
                  </option>
                </select>
              </FormField>
            </div>

            {feedbackAcao && savingManual && (
              <FeedbackInline feedback={feedbackAcao} />
            )}

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldAlert size={12} style={{ color: AMBAR }} />
                Confirma que os documentos foram verificados?
              </div>

              <button
                type="submit"
                disabled={savingManual || loadingAcao}
                className={`${jakarta.className} text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0 shrink-0`}
                style={{
                  background: `linear-gradient(135deg, ${VERMELHO}, #F87171)`,
                }}
              >
                {savingManual ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    A processar...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    {metodoNovaEmissao === "dinheiro"
                      ? "Registrar e emitir"
                      : "Registrar e gerar PIX"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}