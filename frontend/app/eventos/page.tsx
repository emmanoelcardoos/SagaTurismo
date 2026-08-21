'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, MapPin, ArrowRight, Loader2, CalendarDays, Clock, Sparkles, ChevronRight, ChevronLeft,
  ShieldCheck
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

type Evento = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  descricao: string | null;
  data: string;
  horario: string | null;
  local: string | null;
  imagem_url: string | null;
  categoria: string | null;
  destaque: boolean;
};

// ── MOTOR DE ANIMAÇÕES ──
function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number; }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`} 
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const NOME_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// ── PALETA SOFT & CLEAN ──
const CORES_MESES = [
  "bg-white",
  "bg-[#FDFCF7]",
  "bg-slate-50",
];

export default function EventosPage() {
  // ── CONTROLE DO HEADER ──
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // ── DADOS ──
  const [eventosPorMes, setEventosPorMes] = useState<Record<number, Evento[]>>({});
  const [loading, setLoading] = useState(true);

  const hoje = new Date();
  const dataHojeISO = hoje.toISOString().split('T')[0];
  const mesAtualIndex = hoje.getMonth();

  useEffect(() => {
    async function fetchEventos() {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .gte('data', dataHojeISO)
        .order('data', { ascending: true });

      if (data) {
        const agrupados = data.reduce((acc: Record<number, Evento[]>, evento: Evento) => {
          const mesIndex = parseInt(evento.data.split('-')[1], 10) - 1;
          if (!acc[mesIndex]) acc[mesIndex] = [];
          acc[mesIndex].push(evento);
          return acc;
        }, {});
        setEventosPorMes(agrupados);
      }
      setLoading(false);
    }
    fetchEventos();
  }, [dataHojeISO]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Define se o header deve ficar sólido (bg branco)
      setIsHeaderSolid(currentScrollY > 80);

      // Lógica de mostrar/esconder ao rolar
      if (currentScrollY < 80) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // ── MENU AGRUPADO ──
  const menuGroups = [
  { 
    label: 'Descobrir', 
    links: ['Atrativos', 'História', 'Biodiversidade', 'Comunidades', 'Galeria', 'Eventos'] 
  },
  { 
    label: 'Planejar', 
    links: ['Hospedagens', 'Gastronomia', 'Agências', 'Informações', 'CAT'] 
  },
  { 
    label: 'Institucional', 
    links: ['SEMTUR', 'COMTUR', 'Parceiros'] 
  },
];

  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 overflow-x-hidden flex flex-col`}>
      <div className="flex-1">

        {/* ── HEADER INTELIGENTE TRANSPARENTE ── */}
        <header
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${
            (isHeaderSolid || isHovered || isMobileMenuOpen) 
              ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' 
              : 'bg-transparent border-b border-transparent'
          }`}
        >
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
            <div className="flex-1">
              <Link href="/" className="inline-flex items-center gap-3 transition-all duration-300">
                <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                  <Image 
                    src="/logop.png" 
                    alt="SagaTurismo" 
                    fill 
                    className={`object-contain transition-all duration-300 ${
                      (!isHeaderSolid && !isHovered && !isMobileMenuOpen) 
                        ? 'brightness-0 invert' 
                        : ''
                    }`} 
                  />
                </div>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center justify-center gap-12">
              {menuGroups.map((group) => (
                <div key={group.label} className="relative group py-2">
                  <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                    (isHeaderSolid || isHovered || isMobileMenuOpen) 
                      ? 'text-slate-600 group-hover:text-[#00577C]' 
                      : 'text-white group-hover:text-[#F9C400] drop-shadow-md'
                  }`}>
                    {group.label} <ChevronRight size={14} className="group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-2xl p-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50 flex flex-row items-center gap-1">
                    {group.links.map((link) => {
                      const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                      return (
                        <Link key={link} href={path} className={`${jakarta.className} block px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#00577C] hover:bg-slate-50 rounded-xl transition-all whitespace-nowrap`}>
                          {link}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="flex-1 flex justify-end items-center gap-4">
              <Link href="/cadastro"
                className={`hidden lg:inline-flex ${jakarta.className} px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm ${
                  (isHeaderSolid || isHovered || isMobileMenuOpen) 
                    ? 'bg-[#F9C400] text-[#002f40]' 
                    : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'
                }`}>
                Residente
              </Link>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`rounded-xl p-2 lg:hidden transition-all duration-300 ${
                  (isHeaderSolid || isHovered || isMobileMenuOpen) 
                    ? 'text-[#00577C] hover:bg-slate-100' 
                    : 'text-white hover:bg-white/20'
                }`}>
                {isMobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
              </button>
            </div>
          </div>

          {/* Menu Mobile */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-6 shadow-2xl lg:hidden z-50 max-h-[85vh] overflow-y-auto">
              {menuGroups.map((group) => (
                <div key={group.label} className="flex flex-col gap-3">
                  <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.2em] text-[#00577C] border-b border-slate-100 pb-2`}>{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.links.map((link) => {
                      const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                      return (
                        <Link key={link} href={path} onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} font-bold text-slate-700 text-sm bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 hover:text-[#00577C] hover:bg-slate-100 transition-colors`}>
                          {link}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-3">
                <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md`}>
                  Cartão Residente
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* ══════════════════════════════════════
            HERO EDITORIAL (COLORIDO - SEM ANIMAÇÃO)
        ══════════════════════════════════════ */}
        <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image 
              src="https://images.pexels.com/photos/37834641/pexels-photo-37834641.jpeg?_gl=1*1effz5v*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODcxNjc5NjYkbzEwNCRnMSR0MTc4NzE3MDEzOSRqMzkkbDAkaDA." 
              alt="Agenda Cultural de São Geraldo do Araguaia" 
              fill 
              className="object-cover" // ← SEM animação, SEM escala
              priority 
            />
            {/* Gradiente MÍNIMO - apenas para legibilidade do texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
            <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
              Eventos
            </h1>
            <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
              Celebrações, festivais, palestras e congressos
            </p>
          </div>

          {/* ── ONDA DE TRANSIÇÃO ── */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
            <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
            </svg>
          </div>
        </section>

        {/* ── SECCÕES POR MÊS (COM CARDS ESCUROS E SEM DESCRIÇÃO) ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-[#00577C] w-16 h-16 mb-4" />
            <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Sincronizando Agenda...</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {NOME_MESES.map((nomeMes, index) => {
              if (index < mesAtualIndex) return null;

              const eventosDesteMes = eventosPorMes[index] || [];
              const corFundo = CORES_MESES[index % CORES_MESES.length];

              return (
                <section key={index} className={`py-24 ${corFundo} relative overflow-hidden border-t border-slate-100`}>
                  <div className="max-w-[1400px] mx-auto px-6 mb-12">
                    <Reveal>
                      <div className="flex items-center gap-6">
                        <h2 className={`${jakarta.className} text-6xl md:text-8xl font-black text-slate-900 tracking-tighter`}>
                          {nomeMes}
                        </h2>
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-[#00577C] font-black text-2xl md:text-4xl">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </Reveal>
                  </div>

                  {/* SCROLL HORIZONTAL DOS CARDS */}
                  <div className="relative w-full overflow-x-auto hide-scrollbar pb-10">
                    <div className="flex gap-6 px-6 md:px-24">
                      {eventosDesteMes.length === 0 ? (
                        <div className="min-w-[300px] py-10 opacity-90 italic text-slate-500 flex items-center gap-4">
                          <CalendarDays /> Próximos eventos a serem anunciados...
                        </div>
                      ) : (
                        eventosDesteMes.map((evento, i) => (
                          <div key={evento.id} className="min-w-[300px] md:min-h-[450px] md:min-w-[450px]">
                            <Reveal delay={i * 100}>
                              {/* CARD ESCURO COM IMAGEM EM DESTAQUE (SEM DESCRIÇÃO) */}
                              <div className="group relative h-[450px] rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl border border-white/10 flex flex-col">
                                
                                {/* Imagem (sem escurecimento excessivo) */}
                                <div className="relative h-2/3 w-full overflow-hidden bg-slate-800">
                                  {evento.imagem_url ? (
                                    <Image 
                                      src={evento.imagem_url} 
                                      alt={evento.titulo} 
                                      fill 
                                      className="object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80" 
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#00577C]/60 to-[#009640]/60" />
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                                  
                                  {/* Data em destaque */}
                                  <div className="absolute top-6 left-6 bg-[#F9C400] text-[#002f40] px-4 py-2 rounded-2xl shadow-xl z-10">
                                    <p className="text-2xl font-black leading-none">{evento.data.split('-')[2]}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest">{nomeMes.slice(0, 3)}</p>
                                  </div>
                                </div>

                                {/* Conteúdo (apenas título e local) */}
                                <div className="flex-1 p-6 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-[#009640] bg-green-500/10 px-3 py-1 rounded-full">
                                        {evento.categoria || 'Evento'}
                                      </span>
                                      {evento.horario && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-white/40">
                                          <Clock size={12} /> {evento.horario}
                                        </span>
                                      )}
                                    </div>
                                    <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-white mb-1 line-clamp-2 leading-tight`}>
                                      {evento.titulo}
                                    </h3>
                                  </div>

                                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-2 text-white/40">
                                      <MapPin size={14} className="text-[#F9C400]" />
                                      <span className="text-[10px] font-bold uppercase tracking-widest">{evento.local || 'SGA'}</span>
                                    </div>
                                    <Link 
                                      href={`/eventos/${evento.id}`}
                                      className="bg-white/10 hover:bg-[#F9C400] text-white hover:text-[#002f40] p-3 rounded-full transition-all group-hover:translate-x-1"
                                    >
                                      <ArrowRight size={20} />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </Reveal>
                          </div>
                        ))
                      )}
                      <div className="min-w-[100px] h-1" />
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER INSTITUCIONAL INTEGRADO ── */}
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