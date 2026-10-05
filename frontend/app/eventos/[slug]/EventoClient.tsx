// @ts-nocheck
// app/eventos/[slug]/EventoClient.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, ReactNode } from "react";
import {
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Ticket,
  Clock,
  X,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Info,
  Tag,
} from "lucide-react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";

// ════════════════════════════════════════════
//  FONTES
// ════════════════════════════════════════════
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// ════════════════════════════════════════════
//  PALETA PETRÓLEO
// ════════════════════════════════════════════
const PETROLEO = "#00577C";
const PETROLEO_DARK = "#00425E";
const PETROLEO_LIGHT = "#0A7BA8";

// ════════════════════════════════════════════
//  TIPOS
// ════════════════════════════════════════════
export type Evento = {
  id: string;
  slug: string;
  titulo: string;
  subtitulo?: string;
  descricao: string;
  data: string;
  local: string;
  imagem_url: string;
  categoria: string;
  horario?: string;
  duracao?: string;
  preco?: string;
  classificacao?: string;
  link_bilheteira?: string;
  requer_inscricao?: boolean;
  vagas_totais?: number;
  vagas_vendidas?: number;
  preco_numerico?: number;
};

export type EventoNav = {
  id: string;
  slug: string;
  titulo: string;
};

// ════════════════════════════════════════════
//  MOTOR DE SCROLL ANIMATION
// ════════════════════════════════════════════
function useScrollAnimation(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [threshold]);
  return { ref, isVisible };
}

function Reveal({
  children,
  className = "",
  anim = "up",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  anim?: "up" | "left" | "right" | "zoom" | "fade";
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();
  const hidden: Record<string, string> = {
    up: "opacity-0 translate-y-14",
    left: "opacity-0 translate-x-14",
    right: "opacity-0 -translate-x-14",
    zoom: "opacity-0 scale-90",
    fade: "opacity-0",
  };
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out will-change-transform ${
        isVisible
          ? "opacity-100 translate-y-0 translate-x-0 scale-100"
          : hidden[anim]
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ════════════════════════════════════════════
//  PÁGINA
// ════════════════════════════════════════════
export default function EventoClient({
  evento,
  eventoAnterior,
  eventoProximo,
}: {
  evento: Evento;
  eventoAnterior: EventoNav | null;
  eventoProximo: EventoNav | null;
}) {
  // ── Formatação de Data ──
  const dataObj = new Date(evento.data + "T00:00:00");
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const dataFormatada = `${String(dataObj.getDate()).padStart(
    2,
    "0"
  )} de ${meses[dataObj.getMonth()]} de ${dataObj.getFullYear()}`;

  // ── Estados do Checkout ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [pixData, setPixData] = useState<{
    pix_qrcode_img: string;
    pix_copia_cola: string;
    codigo_pedido: string;
  } | null>(null);
  const [copiado, setCopiado] = useState(false);

  // ── Estado do pagamento ──
  const [statusPagamento, setStatusPagamento] = useState<"pendente" | "pago">(
    "pendente"
  );

  const [formData, setFormData] = useState({
    nome_cliente: "",
    cpf_cliente: "",
    email_cliente: "",
    telefone_cliente: "",
    quantidade: 1,
  });

  const vagasDisponiveis =
    (evento.vagas_totais || 0) - (evento.vagas_vendidas || 0);
  const esgotado = evento.vagas_totais && vagasDisponiveis <= 0;

  // ══════════════════════════════════════════
  //  MÁSCARA DE CPF
  // ══════════════════════════════════════════
  const aplicarMascaraCPF = (valor: string): string => {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);
    if (numeros.length <= 3) return numeros;
    if (numeros.length <= 6)
      return numeros.replace(/^(\d{3})(\d{0,3})$/, "$1.$2");
    if (numeros.length <= 9)
      return numeros.replace(/^(\d{3})(\d{3})(\d{0,3})$/, "$1.$2.$3");
    return numeros.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{1,2})$/,
      "$1.$2.$3-$4"
    );
  };

  // ══════════════════════════════════════════
  //  SUBMISSÃO DO FORMULÁRIO
  // ══════════════════════════════════════════
  const handleInscricao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_URL}/api/v1/pagamentos/evento-bb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, evento_id: evento.id }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.detail || "Erro ao processar inscrição.");

      setPixData(data);
      setStatusPagamento("pendente");
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copiarPix = () => {
    if (pixData?.pix_copia_cola) {
      navigator.clipboard.writeText(pixData.pix_copia_cola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  // ══════════════════════════════════════════
  //  POLLING DO STATUS DO PAGAMENTO
  // ══════════════════════════════════════════
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (pixData?.codigo_pedido && statusPagamento === "pendente") {
      intervalId = setInterval(async () => {
        try {
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
          const res = await fetch(
            `${API_URL}/api/v1/pagamentos/status/${pixData.codigo_pedido}`
          );
          const data = await res.json();

          if (data.success && data.status === "CONFIRMED") {
            setStatusPagamento("pago");
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Erro na verificação silenciosa:", error);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pixData, statusPagamento]);

  // ══════════════════════════════════════════
  //  FECHAR MODAL
  // ══════════════════════════════════════════
  const fecharModal = () => {
    const eraPago = statusPagamento === "pago";
    setIsModalOpen(false);
    setTimeout(() => {
      setPixData(null);
      setStatusPagamento("pendente");
      if (eraPago) window.location.reload();
    }, 300);
  };

  // ── Estilos reutilizáveis ──
  const inputClass =
    "w-full bg-white border border-slate-200 focus:border-[#00577C] focus:ring-2 focus:ring-[#00577C]/15 rounded-xl px-4 py-3 outline-none transition-all text-slate-800 text-base placeholder:text-slate-400";
  const labelClass =
    "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block";

  return (
    <main
      className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 overflow-x-hidden flex flex-col`}
    >
      {/* ══════════════════════════════════════
          HERO — TÍTULO + CARTAZ + INFORMAÇÕES
      ══════════════════════════════════════ */}
      <section className="relative w-full pt-24 sm:pt-28 md:pt-32 pb-8 md:pb-12">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8">
          {/* Categoria + Título */}
          <div className="text-center mb-10 md:mb-14">
            <h1
              className={`${jakarta.className} text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight max-w-4xl mx-auto`}
            >
              {evento.titulo}
            </h1>
          </div>

          {/* Grid: Cartaz + Informações */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Cartaz (esquerda) */}
            {evento.imagem_url && (
              <Reveal anim="right" className="lg:col-span-7">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-xl border border-slate-200">
                  <Image
                    src={evento.imagem_url}
                    alt={evento.titulo}
                    fill
                    priority
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                </div>
              </Reveal>
            )}

            {/* Informações (direita) */}
            <Reveal anim="left" delay={100} className="lg:col-span-5">
              <div className="space-y-5">
                {/* Card de informações */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm">
                  <h2
                    className={`${jakarta.className} text-lg md:text-xl font-black text-slate-900 tracking-tight mb-5 leading-tight`}
                  >
                    Informações do evento
                  </h2>

                  <div className="space-y-4">
                    {[
                      {
                        icon: CalendarDays,
                        label: "Data",
                        value: dataFormatada,
                      },
                      {
                        icon: Clock,
                        label: "Horário",
                        value: evento.horario || "A definir",
                      },
                      {
                        icon: MapPin,
                        label: "Local",
                        value: evento.local || "A definir",
                      },
                      {
                        icon: Ticket,
                        label: "Preço",
                        value: evento.preco
                          ? evento.preco
                          : evento.preco_numerico
                          ? `R$ ${evento.preco_numerico
                              .toFixed(2)
                              .replace(".", ",")}`
                          : "Gratuito",
                      },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="flex items-start gap-3.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${PETROLEO}10` }}
                          >
                            <Icon
                              size={18}
                              style={{ color: PETROLEO }}
                              strokeWidth={1.9}
                            />
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">
                              {item.label}
                            </p>
                            <p className="text-sm font-bold text-slate-800 leading-snug break-words">
                              {item.value}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {(evento.duracao || evento.classificacao) && (
                    <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100">
                      {evento.duracao && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold text-slate-600">
                          <Clock size={11} strokeWidth={2.4} />
                          {evento.duracao}
                        </span>
                      )}
                      {evento.classificacao && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold text-slate-600">
                          <Info size={11} strokeWidth={2.4} />
                          {evento.classificacao}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA de inscrição */}
                {evento.requer_inscricao && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${PETROLEO}10` }}
                      >
                        <Ticket
                          size={18}
                          style={{ color: PETROLEO }}
                          strokeWidth={1.9}
                        />
                      </div>
                      <h3
                        className={`${jakarta.className} text-base md:text-lg font-black text-slate-900 leading-tight`}
                      >
                        {esgotado ? "Evento esgotado" : "Garantir bilhete"}
                      </h3>
                    </div>

                    <p className="text-slate-600 text-sm font-medium leading-relaxed mb-5">
                      {evento.preco_numerico && evento.preco_numerico > 0
                        ? `Valor: R$ ${evento.preco_numerico
                            .toFixed(2)
                            .replace(".", ",")}`
                        : "Evento gratuito"}
                      {evento.vagas_totais && (
                        <>
                          {" "}
                          •{" "}
                          <strong className="text-slate-800">
                            {vagasDisponiveis} vaga
                            {vagasDisponiveis !== 1 ? "s" : ""} restante
                            {vagasDisponiveis !== 1 ? "s" : ""}
                          </strong>
                        </>
                      )}
                    </p>

                    <button
                      onClick={() => setIsModalOpen(true)}
                      disabled={esgotado}
                      className={`${jakarta.className} w-full px-6 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md ${
                        esgotado
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "text-white hover:shadow-lg active:scale-[0.98]"
                      }`}
                      style={!esgotado ? { background: PETROLEO } : undefined}
                    >
                      {esgotado ? (
                        "Esgotado"
                      ) : (
                        <>
                          Inscrever-se agora
                          <ArrowRight size={16} strokeWidth={2.4} />
                        </>
                      )}
                    </button>

                    {evento.link_bilheteira && (
                      <a
                        href={evento.link_bilheteira}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all"
                      >
                        <Ticket size={14} strokeWidth={2.4} />
                        Bilheteira externa
                        <ArrowRight size={14} strokeWidth={2.4} />
                      </a>
                    )}
                  </div>
                )}

                {evento.link_bilheteira && !evento.requer_inscricao && (
                  <a
                    href={evento.link_bilheteira}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${jakarta.className} w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-sm text-white transition-all shadow-md hover:shadow-lg active:scale-[0.98]`}
                    style={{ background: PETROLEO }}
                  >
                    <Ticket size={16} strokeWidth={2.4} />
                    Comprar bilhete
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </a>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          DESCRIÇÃO
      ══════════════════════════════════════ */}
      {evento.descricao && (
        <section className="w-full max-w-[900px] mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16 text-center">
          <Reveal anim="up">
            <h2
              className={`${jakarta.className} text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-5 leading-[1.15]`}
            >
              Sobre o evento
            </h2>
            <div className="text-slate-600 text-base md:text-lg leading-relaxed whitespace-pre-wrap font-medium max-w-3xl mx-auto">
              {evento.descricao}
            </div>
          </Reveal>
        </section>
      )}

      {/* ══════════════════════════════════════
          NAVEGAÇÃO ENTRE EVENTOS
      ══════════════════════════════════════ */}
      {(eventoAnterior || eventoProximo) && (
        <section className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 md:px-8 pb-16 md:pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {eventoAnterior && (
              <Link
                href={`/eventos/${eventoAnterior.slug}`}
                className="group flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-lg"
                style={{ borderColor: "rgba(0,87,124,0.15)" }}
              >
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:-translate-x-1"
                  style={{ background: `${PETROLEO}10` }}
                >
                  <ArrowLeft
                    size={16}
                    style={{ color: PETROLEO }}
                    strokeWidth={2.4}
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">
                    Evento anterior
                  </p>
                  <p className="text-sm font-bold text-slate-800 leading-snug truncate group-hover:text-[#00577C] transition-colors">
                    {eventoAnterior.titulo}
                  </p>
                </div>
              </Link>
            )}

            {eventoProximo && (
              <Link
                href={`/eventos/${eventoProximo.slug}`}
                className="group flex items-center justify-end gap-4 p-5 bg-white border border-slate-200 rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-lg text-right"
                style={{ borderColor: "rgba(0,87,124,0.15)" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">
                    Próximo evento
                  </p>
                  <p className="text-sm font-bold text-slate-800 leading-snug truncate group-hover:text-[#00577C] transition-colors">
                    {eventoProximo.titulo}
                  </p>
                </div>
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:translate-x-1"
                  style={{ background: `${PETROLEO}10` }}
                >
                  <ArrowRight
                    size={16}
                    style={{ color: PETROLEO }}
                    strokeWidth={2.4}
                  />
                </span>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          MODAL DE PAGAMENTO
      ══════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <button
              onClick={fecharModal}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors z-10"
              aria-label="Fechar"
            >
              <X size={18} strokeWidth={2.4} />
            </button>

            <div className="p-6 md:p-8">
              {/* ═══ PAGO — TELA DE SUCESSO ═══ */}
              {statusPagamento === "pago" ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5">
                    <CheckCircle2 size={40} strokeWidth={2.4} />
                  </div>

                  <h3
                    className={`${jakarta.className} text-2xl font-black text-slate-900 mb-2`}
                  >
                    Inscrição confirmada!
                  </h3>

                  <p className="text-slate-600 mb-6 font-medium">
                    A sua presença no evento{" "}
                    <strong className="text-slate-800">{evento.titulo}</strong>{" "}
                    foi garantida com sucesso.
                  </p>

                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 text-left mb-6 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-slate-500 font-semibold">
                        Participante
                      </span>
                      <span className="font-bold text-slate-800">
                        {formData.nome_cliente}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-slate-500 font-semibold">
                        Nº de ingressos
                      </span>
                      <span className="font-bold text-slate-800">
                        {formData.quantidade} ingresso(s)
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-500 font-semibold">
                        Valor total
                      </span>
                      <span className="font-bold text-emerald-600 text-base">
                        R${" "}
                        {(
                          (evento.preco_numerico || 0) * formData.quantidade
                        )
                          .toFixed(2)
                          .replace(".", ",")}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[#00577C]/10 border border-[#00577C]/20 px-5 py-4 rounded-xl text-center mb-6">
                    <p className="text-[13px] font-semibold text-[#00577C] mb-1">
                      O seu ingresso (QR Code) foi enviado para:
                    </p>
                    <p className="text-slate-900 font-bold text-sm break-all">
                      {formData.email_cliente}
                    </p>
                    <p className="text-slate-500 mt-2 text-xs font-medium">
                      Apresente-o na entrada do evento.
                    </p>
                  </div>

                  <button
                    onClick={fecharModal}
                    className={`${jakarta.className} w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors text-sm`}
                  >
                    Voltar para o evento
                  </button>
                </div>
              ) : (
                /* ═══ AINDA NÃO PAGO — FORM OU QR CODE ═══ */
                <>
                  <h2
                    className={`${jakarta.className} text-2xl font-black text-slate-900 mb-2 text-center tracking-tight`}
                  >
                    {pixData ? "Pagamento da inscrição" : "Seus dados"}
                  </h2>
                  <p className="text-center text-sm text-slate-500 font-medium mb-7">
                    {pixData
                      ? "Finalize o pagamento com PIX"
                      : "Preencha os campos para gerar o PIX"}
                  </p>

                  {erro && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-100">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold">{erro}</p>
                    </div>
                  )}

                  {!pixData ? (
                    <form onSubmit={handleInscricao} className="space-y-4">
                      {/* Nome */}
                      <div>
                        <label className={labelClass}>Nome completo *</label>
                        <input
                          required
                          type="text"
                          className={inputClass}
                          placeholder="Nome completo"
                          value={formData.nome_cliente}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nome_cliente: e.target.value,
                            })
                          }
                        />
                      </div>

                      {/* CPF com máscara */}
                      <div>
                        <label className={labelClass}>CPF *</label>
                        <input
                          required
                          type="text"
                          inputMode="numeric"
                          placeholder="000.000.000-00"
                          maxLength={14}
                          className={inputClass}
                          value={formData.cpf_cliente}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cpf_cliente: aplicarMascaraCPF(e.target.value),
                            })
                          }
                        />
                      </div>

                      {/* E-mail */}
                      <div>
                        <label className={labelClass}>E-mail *</label>
                        <input
                          required
                          type="email"
                          inputMode="email"
                          placeholder="exemplo@email.com"
                          className={inputClass}
                          value={formData.email_cliente}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email_cliente: e.target.value,
                            })
                          }
                        />
                        <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                          O bilhete será enviado para este e-mail
                        </p>
                      </div>

                      {/* Telefone + Quantidade */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Telefone *</label>
                          <input
                            required
                            type="tel"
                            inputMode="tel"
                            placeholder="(94) 90000-0000"
                            className={inputClass}
                            value={formData.telefone_cliente}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                telefone_cliente: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Quantidade *</label>
                          <input
                            required
                            type="number"
                            min="1"
                            max={vagasDisponiveis || 10}
                            className={inputClass}
                            value={formData.quantidade}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                quantidade: parseInt(e.target.value) || 1,
                              })
                            }
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className={`${jakarta.className} w-full mt-6 py-4 rounded-xl font-bold text-sm text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]`}
                        style={{ background: PETROLEO }}
                      >
                        {loading ? "A processar..." : "Gerar PIX"}
                      </button>
                    </form>
                  ) : (
                    /* ─── QR Code PIX ─── */
                    <div className="flex flex-col items-center text-center">
                      <div className="relative w-56 h-56 bg-slate-50 border border-slate-200 rounded-2xl mb-6 p-3">
                        <Image
                          src={pixData.pix_qrcode_img}
                          alt="QR Code PIX"
                          fill
                          className="object-contain rounded-xl"
                        />
                      </div>

                      <p className="text-slate-600 mb-6 text-sm font-medium leading-relaxed max-w-md">
                        Abra a app do seu banco e escolha{" "}
                        <strong className="text-slate-800">
                          PIX pelo QR Code
                        </strong>{" "}
                        ou copie o código abaixo. Esta janela atualizará
                        sozinha após a confirmação.
                      </p>

                      <button
                        onClick={copiarPix}
                        className={`${jakarta.className} w-full py-4 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2.5 shadow-md active:scale-[0.98] ${
                          copiado
                            ? "bg-emerald-600 text-white"
                            : "text-white hover:shadow-lg"
                        }`}
                        style={!copiado ? { background: PETROLEO } : undefined}
                      >
                        {copiado ? (
                          <>
                            <CheckCircle2 size={16} strokeWidth={2.4} />
                            Código copiado!
                          </>
                        ) : (
                          <>
                            <QrCode size={16} strokeWidth={2.4} />
                            Copiar código PIX
                          </>
                        )}
                      </button>

                      {/* Indicador "aguardando pagamento" */}
                      <div className="mt-6 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <div className="flex gap-1">
                          <span
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{
                              background: PETROLEO,
                              animationDelay: "0s",
                            }}
                          />
                          <span
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{
                              background: PETROLEO,
                              animationDelay: "0.2s",
                            }}
                          />
                          <span
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{
                              background: PETROLEO,
                              animationDelay: "0.4s",
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold">
                          Aguardando pagamento...
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}