// app/sagaturismo-app/page.tsx

"use client";

import React, { useState, useEffect, useRef, ReactNode } from "react";
import Image from "next/image";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import {
  Map, Compass, Camera, Ticket,
  Bell, CalendarDays,
  ShieldCheck, Clock, Users, Sparkles,
  Images, WifiOff, Leaf,
} from "lucide-react";

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
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// ════════════════════════════════════════════
//  PALETA OFICIAL SAGATURISMO
// ════════════════════════════════════════════
const AZUL_SAGA = "#025580";
const AMARELO_SAGA = "#FDBF00";
const VERDE_SAGA = "#00953D";

// ════════════════════════════════════════════
//  SCROLL ANIMATION
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

type AnimKind = "up" | "left" | "right" | "zoom" | "fade" | "blur";

function Reveal({
  children,
  className = "",
  anim = "up",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  anim?: AnimKind;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();
  const hidden: Record<AnimKind, string> = {
    up: "opacity-0 translate-y-10",
    left: "opacity-0 translate-x-10",
    right: "opacity-0 -translate-x-10",
    zoom: "opacity-0 scale-95",
    fade: "opacity-0",
    blur: "opacity-0 blur-md",
  };
  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: "900ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={`transition-all will-change-transform ${
        isVisible
          ? "opacity-100 translate-y-0 translate-x-0 scale-100 blur-0"
          : hidden[anim]
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ════════════════════════════════════════════
//  DADOS — FUNCIONALIDADES DO APP
// ════════════════════════════════════════════
const funcionalidades = [
  {
    icon: Compass,
    title: "Descobrir atrativos",
    description:
      "Cachoeiras, trilhas, mirantes e pontos históricos — como a Casa de Pedra — com fotos e informações detalhadas.",
    cor: AZUL_SAGA,
  },
  {
    icon: Images,
    title: "Mural da comunidade",
    description:
      "Um feed de fotos da cidade partilhadas por moradores e visitantes. Publica as tuas e descobre o que outros andam a ver.",
    cor: VERDE_SAGA,
  },
  {
    icon: Ticket,
    title: "Carteira de Residente",
    description:
      "Emite a tua Carteira Digital e garante 50% de desconto na entrada da Cachoeira Três Quedas.",
    cor: AMARELO_SAGA,
  },
  {
    icon: CalendarDays,
    title: "Agenda de eventos",
    description:
      "Festivais, feiras, shows e celebrações culturais de São Geraldo, organizados por mês.",
    cor: AZUL_SAGA,
  },
  {
    icon: Map,
    title: "Roteiros e mapas",
    description:
      "Mapas interativos de atrativos, hospedagens e serviços, com rotas a pé e por estrada.",
    cor: VERDE_SAGA,
  },
  {
    icon: Leaf,
    title: "Natureza e biodiversidade",
    description:
      "Fauna e flora da Serra das Andorinhas — Martírios, com fichas ilustradas das espécies da região.",
    cor: AMARELO_SAGA,
  },
  {
    icon: WifiOff,
    title: "Funciona offline",
    description:
      "Descarrega guias, roteiros e mapas para consultar mesmo sem sinal nas cachoeiras ou na serra.",
    cor: AZUL_SAGA,
  },
  {
    icon: Bell,
    title: "Avisos oficiais",
    description:
      "Notificações sobre eventos, alertas e novidades enviadas diretamente pela Prefeitura.",
    cor: VERDE_SAGA,
  },
  {
    icon: Camera,
    title: "Guias digitais",
    description:
      "Materiais oficiais em PDF, sempre disponíveis — mesmo quando não há internet.",
    cor: AMARELO_SAGA,
  },
];

const diferenciais = [
  {
    icon: ShieldCheck,
    title: "Informação oficial",
    description:
      "Todo o conteúdo é curado pela Prefeitura de São Geraldo do Araguaia — sem intermediários, sem publicidade.",
    cor: AZUL_SAGA,
  },
  {
    icon: Clock,
    title: "Sempre atualizado",
    description:
      "Atrativos, eventos e serviços são atualizados constantemente para refletir a realidade do município.",
    cor: VERDE_SAGA,
  },
  {
    icon: Users,
    title: "Feito para todos",
    description:
      "Interface simples e acessível, pensada para moradores e visitantes de todas as idades.",
    cor: AMARELO_SAGA,
  },
  {
    icon: Sparkles,
    title: "Gratuito e sem anúncios",
    description:
      "Uma ferramenta pública, sem fins lucrativos, sem rastreamento e sem venda de dados.",
    cor: AZUL_SAGA,
  },
];

// ════════════════════════════════════════════
//  MOCKUPS
// ════════════════════════════════════════════
const iPhoneHome =
  "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/passeios/celular.jpeg";
const iPadExplore =
  "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/passeios/ipad.jpeg";
const AppStoreLogo =
  "https://mkzujlqnzmiaitggzytp.supabase.co/storage/v1/object/public/imagens%20do%20site/appstore.png";
const PlayStoreLogo =
  "https://mkzujlqnzmiaitggzytp.supabase.co/storage/v1/object/public/imagens%20do%20site/google-play.png";

function MockupStack() {
  return (
    <div className="flex justify-center items-center gap-4 sm:gap-6">
      <div className="relative w-[150px] sm:w-[180px] md:w-[220px] h-[290px] sm:h-[350px] md:h-[420px] bg-black rounded-[2.25rem] sm:rounded-[2.5rem] p-2.5 sm:p-3 shadow-2xl flex-shrink-0 ring-1 ring-white/10">
        <div className="relative w-full h-full rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden bg-slate-100">
          <Image
            src={iPhoneHome}
            alt="Tela inicial do app SagaTurismo"
            fill
            sizes="(max-width: 768px) 150px, (max-width: 1024px) 180px, 220px"
            className="object-cover"
            unoptimized
          />
        </div>
      </div>
      <div className="relative w-[240px] sm:w-[300px] md:w-[380px] h-[320px] sm:h-[400px] md:h-[480px] bg-black rounded-3xl p-2.5 sm:p-3 shadow-2xl flex-shrink-0 hidden md:block ring-1 ring-white/10">
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100">
          <Image
            src={iPadExplore}
            alt="Tela de exploração do app SagaTurismo no iPad"
            fill
            sizes="(max-width: 1024px) 300px, 380px"
            className="object-cover"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  PÁGINA
// ════════════════════════════════════════════
export default function SagaTurismoAppPage() {
  return (
    <main
      className={`${inter.className} flex flex-col w-full bg-white text-slate-900 min-h-screen pb-16 md:pb-24 overflow-x-hidden`}
    >
      {/* ══════════════════════════════════════
          ABERTURA
      ══════════════════════════════════════ */}
      <section className="w-full max-w-6xl mx-auto px-6 sm:px-8 pt-28 sm:pt-32 md:pt-36 pb-2">
        <Reveal anim="blur" delay={100}>
          <h1
            className={`${jakarta.className} font-black tracking-[-0.04em] leading-[0.95] text-[#025580] text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem]`}
          >
            SagaTurismo <span className="text-gradient-saga">App</span>
          </h1>
        </Reveal>

        <Reveal anim="up" delay={200}>
          <p className="mt-4 sm:mt-5 max-w-2xl text-slate-500 text-base sm:text-lg leading-relaxed font-medium">
            O guia digital de São Geraldo do Araguaia — atrativos, eventos, o
            Mural da Comunidade e a Carteira de Residente na palma da sua mão.
          </p>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════
          CONTEÚDO
      ══════════════════════════════════════ */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-12 sm:pt-16 md:pt-20 space-y-20 sm:space-y-24 md:space-y-28">

        {/* ─── BLOCO 1: SOBRE O APP ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Reveal anim="right" className="order-2 lg:order-1">
            <div>
              <h2
                className={`${jakarta.className} text-3xl sm:text-4xl md:text-5xl font-black text-[#025580] tracking-tight leading-[1.1] mb-6`}
              >
                Toda a cidade{" "}
                <span className="text-[#FDBF00]">no seu bolso</span>
              </h2>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium mb-4">
                O SagaTurismo App é a plataforma oficial de turismo de São Geraldo
                do Araguaia. Reúne atrativos, hospedagens, gastronomia, eventos,
                a Carteira Digital de Residente e o Mural da Comunidade num único
                lugar!
              </p>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium">
                Planeje a sua visita, descubra o que fazer, veja fotos partilhadas
                por quem cá vive e garanta descontos exclusivos para residentes.
                Simples, rápido e 100% digital.
              </p>
            </div>
          </Reveal>

          <Reveal anim="zoom" delay={120} className="order-1 lg:order-2">
            <MockupStack />
          </Reveal>
        </div>

        {/* ─── BLOCO 2: FUNCIONALIDADES ─── */}
        <div>
          <Reveal anim="up">
            <div className="mb-10 md:mb-14 max-w-3xl">
              <h2
                className={`${jakarta.className} text-3xl sm:text-4xl md:text-5xl font-black text-[#025580] tracking-tight mb-4 leading-[1.08]`}
              >
                O que você encontra{" "}
                <span className="text-[#FDBF00]">no app</span>
              </h2>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium">
                Tudo o que precisa para planejar a sua viagem ou viver a cidade
                como um local.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {funcionalidades.map((func, index) => {
              const Icon = func.icon;
              return (
                <Reveal key={func.title} anim="up" delay={index * 60}>
                  <div className="group bg-white p-6 md:p-7 rounded-3xl border border-slate-200 transition-all duration-500 hover:-translate-y-1.5 hover:border-[#025580]/30 hover:shadow-[0_20px_50px_-12px_rgba(2,85,128,0.18)] h-full">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110"
                      style={{ background: `${func.cor}15` }}
                    >
                      <Icon
                        size={24}
                        style={{ color: func.cor }}
                        strokeWidth={1.8}
                      />
                    </div>
                    <h4
                      className={`${jakarta.className} font-black text-[#025580] text-base md:text-lg mb-2 transition-colors group-hover:text-[#FDBF00]`}
                    >
                      {func.title}
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {func.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* ─── BLOCO 3: DIFERENCIAIS ─── */}
        <div>
          <Reveal anim="up">
            <div className="mb-10 md:mb-14 max-w-3xl">
              <h2
                className={`${jakarta.className} text-3xl sm:text-4xl md:text-5xl font-black text-[#025580] tracking-tight mb-4 leading-[1.08]`}
              >
                Por que usar o{" "}
                <span className="text-[#FDBF00]">SagaTurismo App?</span>
              </h2>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium">
                Uma ferramenta pública, pensada para valorizar o turismo local e
                facilitar a vida de quem visita São Geraldo do Araguaia.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {diferenciais.map((dif, index) => {
              const Icon = dif.icon;
              return (
                <Reveal key={dif.title} anim="up" delay={index * 60}>
                  <div className="group bg-white p-6 md:p-7 rounded-3xl border border-slate-200 transition-all duration-500 hover:-translate-y-1.5 hover:border-[#025580]/30 hover:shadow-[0_20px_50px_-12px_rgba(2,85,128,0.18)] text-center h-full">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform duration-500 group-hover:scale-110"
                      style={{ background: `${dif.cor}15` }}
                    >
                      <Icon
                        size={26}
                        style={{ color: dif.cor }}
                        strokeWidth={1.8}
                      />
                    </div>
                    <h4
                      className={`${jakarta.className} font-black text-[#025580] text-base md:text-lg mb-2 transition-colors group-hover:text-[#FDBF00]`}
                    >
                      {dif.title}
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {dif.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* ─── BLOCO 4: DOWNLOAD ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-10 md:pt-14 border-t border-slate-200">
          <Reveal anim="right" className="order-2 lg:order-1">
            <div>
              <h2
                className={`${jakarta.className} text-3xl sm:text-4xl md:text-5xl font-black text-[#025580] tracking-tight leading-[1.1] mb-6`}
              >
                Baixe o <span className="text-[#FDBF00]">aplicativo</span>
              </h2>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium mb-8">
                O SagaTurismo App está a chegar às principais lojas de aplicativos.
                Fique atento ao lançamento e prepare-se para explorar São Geraldo
                do Araguaia como nunca antes — gratuitamente, sem anúncios.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#"
                  className="group flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#025580] hover:shadow-md"
                >
                  <div className="w-10 h-10 relative flex-shrink-0">
                    <Image
                      src={AppStoreLogo}
                      alt="App Store"
                      width={40}
                      height={40}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                      Brevemente na
                    </p>
                    <p className="text-[#025580] font-black text-base transition-colors group-hover:text-[#FDBF00]">
                      App Store
                    </p>
                  </div>
                </a>

                <a
                  href="#"
                  className="group flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#025580] hover:shadow-md"
                >
                  <div className="w-10 h-10 relative flex-shrink-0">
                    <Image
                      src={PlayStoreLogo}
                      alt="Play Store"
                      width={40}
                      height={40}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                      Brevemente na
                    </p>
                    <p className="text-[#025580] font-black text-base transition-colors group-hover:text-[#FDBF00]">
                      Play Store
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal anim="left" delay={120} className="order-1 lg:order-2">
            <MockupStack />
          </Reveal>
        </div>

      </section>

      {/* Gradiente do título */}
      <style jsx global>{`
        .text-gradient-saga {
          background: linear-gradient(
            135deg,
            #025580 0%,
            #00953d 50%,
            #fdcf00 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </main>
  );
}