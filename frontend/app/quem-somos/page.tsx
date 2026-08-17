'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, ShieldCheck, HeartHandshake, Users, Globe, Target,
  MapPin, Leaf, ChevronRight, ArrowRight, CheckCircle2, ChevronDown, TreePine, Navigation
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── MOTOR DE ANIMAÇÕES ──
function useScrollAnimation(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);
  return { ref, isVisible };
}

function Reveal({ children, className = "", anim = "up", delay = 0 }: { children: ReactNode; className?: string; anim?: "up" | "left" | "right" | "zoom" | "fade"; delay?: number; }) {
  const { ref, isVisible } = useScrollAnimation();
  const hidden: Record<string, string> = {
    up: "opacity-0 translate-y-16",
    left: "opacity-0 translate-x-16",
    right: "opacity-0 -translate-x-16",
    zoom: "opacity-0 scale-90",
    fade: "opacity-0",
  };
  return (
    <div ref={ref}
      className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0 scale-100" : hidden[anim]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── HEADER INTELIGENTE TRANSPARENTE ──
function Header() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isHeaderSolid = isScrolled || isHovered || isMobileMenuOpen;

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 50);
      if (y < 80) setShowHeader(true);
      else if (y > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(y);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  return (
    <header
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isHeaderSolid ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent border-b border-transparent'}`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
        <div className="flex-1">
          <Link href="/" className="inline-flex items-center gap-3 transition-all duration-300">
            <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
              <Image src="/logop.png" alt="SagaTurismo" fill className={`object-contain transition-all duration-300 ${!isHeaderSolid ? 'brightness-0 invert' : ''}`} />
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center justify-center gap-12">
          {menuGroups.map((group) => (
            <div key={group.label} className="relative group py-2">
              <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] transition-colors ${isHeaderSolid ? 'text-slate-600 group-hover:text-[#00577C]' : 'text-white group-hover:text-[#F9C400] drop-shadow-md'}`}>
                {group.label} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-2xl p-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50 flex flex-row items-center gap-1">
                {group.links.map((link) => (
                  <Link key={link} href={`/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} className={`${jakarta.className} block px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#00577C] hover:bg-slate-50 rounded-xl transition-all whitespace-nowrap`}>
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex-1 flex justify-end items-center gap-4">
          <Link href="/cadastro"
            className={`hidden lg:inline-flex ${jakarta.className} px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm ${isHeaderSolid ? 'bg-[#F9C400] text-[#002f40]' : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'}`}>
            Residente
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`rounded-xl p-2 lg:hidden transition-all duration-300 ${isHeaderSolid ? 'text-[#00577C] hover:bg-slate-100' : 'text-white hover:bg-white/20'}`}>
            {isMobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-6 shadow-2xl lg:hidden z-50 max-h-[85vh] overflow-y-auto">
          {menuGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-3">
              <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.2em] text-[#00577C] border-b border-slate-100 pb-2`}>{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.links.map((link) => (
                  <Link key={link} href={`/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} font-bold text-slate-700 text-sm bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 hover:text-[#00577C] hover:bg-slate-100 transition-colors`}>
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

// ── PÁGINA PRINCIPAL ──
export default function QuemSomosPage() {

  const pilares = [
    { icon: <Target className="w-8 h-8" />, titulo: "Missão", desc: "Fomentar o turismo ecológico e sustentável em São Geraldo do Araguaia, garantindo que a riqueza natural do nosso município gera desenvolvimento econômico para a população local, preservando o meio ambiente para as futuras gerações." },
    { icon: <Globe className="w-8 h-8" />, titulo: "Visão", desc: "Tornar São Geraldo do Araguaia um destino de ecoturismo de excelência no estado do Pará e no Brasil, reconhecido pela qualidade dos serviços prestados, organização e profundo respeito pela biodiversidade amazônica." },
    { icon: <HeartHandshake className="w-8 h-8" />, titulo: "Valores", desc: "Transparência administrativa, valorização da cultura ribeirinha, sustentabilidade ambiental, fomento do empreendedorismo local e inclusão de todas as comunidades no processo turístico." }
  ];

  return (
    <main className={`${inter.className} min-h-screen flex flex-col bg-[#FDFCF7] text-slate-900`}>
      <Header />

      {/* ── HERO EDITORIAL (PADRÃO BRANCO - SEM ESBRANQUIÇAMENTO) ── */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.pexels.com/photos/4763942/pexels-photo-4763942.jpeg?_gl=1*1auq9hd*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODY5MDg2ODMkbzk3JGcxJHQxNzg2OTE1MTk0JGoxMSRsMCRoMA.."
            alt="Turismo em São Geraldo do Araguaia"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[7rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            Quem Somos
          </h1>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ── INTRODUÇÃO INSTITUCIONAL ── */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-[1000px] mx-auto text-center">
          <Reveal anim="up">
            <h2 className={`${jakarta.className} text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight`}>
              Um portal dedicado à <span className="italic text-[#009640]">natureza e ao desenvolvimento.</span>
            </h2>
            <div className="text-slate-600 text-base md:text-lg font-medium leading-relaxed space-y-4">
              <p>
                O Portal <strong>SagaTurismo</strong> é uma iniciativa oficial da <strong>Prefeitura Municipal de São Geraldo do Araguaia</strong>, desenvolvido em uma ação conjunta entre a <strong>Secretaria Municipal de Turismo (SEMTUR)</strong> e a <strong>Secretaria Municipal de Meio Ambiente (SEMMA)</strong>.
              </p>
              <p>
                Criamos este espaço para conectar diretamente os viajantes aos tesouros do nosso município: o imponente Parque Estadual da Serra das Andorinhas, as águas revitalizantes do rio Araguaia e, acima de tudo, as pessoas que fazem desta região um lugar tão acolhedor.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PILARES (MISSÃO, VISÃO, VALORES) ── */}
      <section className="py-20 md:py-28 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-[1400px] mx-auto">
          <Reveal anim="up" className="text-center mb-16 md:mb-20">
            <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#00577C] tracking-tight`}>
              Os Nossos Pilares
            </h2>
          </Reveal>

          <div className="grid lg:grid-cols-3 gap-8 md:gap-10">
            {pilares.map((pilar, idx) => (
              <Reveal key={idx} anim="up" delay={idx * 150}>
                <div className="bg-white rounded-[2.5rem] p-10 md:p-12 text-center border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 h-full flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 border
                    ${idx === 0 ? 'bg-[#00577C]/5 text-[#00577C] border-[#00577C]/10' : 
                      idx === 1 ? 'bg-[#009640]/5 text-[#009640] border-[#009640]/10' : 
                      'bg-[#F9C400]/10 text-[#d4a800] border-[#F9C400]/20'}`}
                  >
                    {pilar.icon}
                  </div>
                  <h3 className={`${jakarta.className} text-3xl font-black mb-6 text-slate-800`}>{pilar.titulo}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    {pilar.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── O TRABALHO EM CONJUNTO SEMTUR & SEMMA ── */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
            <Reveal anim="right">
              <div className="relative aspect-square md:aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-white">
                <Image
                  src="https://images.pexels.com/photos/28381631/pexels-photo-28381631.jpeg?_gl=1*jsshcc*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODY5MDg2ODMkbzk3JGcxJHQxNzg2OTE1MDk4JGo5JGwwJGgw"
                  alt="Preservação Ambiental em São Geraldo do Araguaia"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                

              </div>
            </Reveal>
            
            <Reveal anim="left">
              <h2 className={`${jakarta.className} text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight`}>
                Trabalho em Conjunto: <br/><span className="text-[#00577C]">Turismo & Meio Ambiente</span>
              </h2>
              
              <div className="space-y-6 text-slate-600 font-medium leading-relaxed text-lg">
                <p>
                  Acreditamos que não há turismo de qualidade sem um profundo respeito pelo meio ambiente. É por isso que a estruturação deste portal e das rotas turísticas do nosso município resulta de um esforço integrado entre a <strong>SEMTUR</strong> (Turismo) e a <strong>SEMMA</strong> (Meio Ambiente).
                </p>
                <p>
                  O nosso objetivo é claro: atrair investimentos, gerar empregos e apresentar as nossas belezas naturais ao mundo, ao mesmo tempo que implementamos políticas rigorosas de preservação, fiscalização e educação ambiental nas comunidades ribeirinhas e indígenas.
                </p>
                <p>
                  A plataforma servirá também para que a prefeitura possa monitorar fluxos turísticos e garantir que a capacidade de carga das cachoeiras e trilhas do Parque é sempre respeitada.
                </p>
              </div>
            
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER INSTITUCIONAL ── */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-[#FDFCF7] text-left mt-auto">
              <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex flex-col items-center md:items-start gap-4">
                  <div className="flex items-center gap-6">
                    <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
                    <div className="w-px h-12 bg-slate-200 hidden md:block" />
                    <Image src="/prefeitura.png" alt="Prefeitura de SGA" width={140} height={50} className="object-contain" />
                  </div>
                  <div className="text-left space-y-1 text-center md:text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      © 2026 Prefeitura Munícipal de São Geraldo do Araguaia - PA
                    </p>
                    <p className="text-[10px] font-bold text-slate-400/80">
                      CNPJ: 10.249.241/0001-22
                    </p>
                  </div>
                </div>
              </div>
            </footer>
    </main>
  );
}