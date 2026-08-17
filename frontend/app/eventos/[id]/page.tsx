'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, ReactNode } from 'react';
import { 
  Menu, Loader2, X, ChevronDown, CalendarDays, ArrowLeft, ArrowRight
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// ── FONTES PADRÃO DO SITE ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM ──
type Evento = {
  id: string;
  titulo: string;
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
};

type EventoNav = {
  id: string;
  titulo: string;
};

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

function Reveal({ children, className = '', anim = 'up', delay = 0 }: {
  children: ReactNode; className?: string;
  anim?: 'up' | 'left' | 'right' | 'zoom' | 'fade'; delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();
  const hidden: Record<string, string> = {
    up: 'opacity-0 translate-y-14',
    left: 'opacity-0 translate-x-14',
    right: 'opacity-0 -translate-x-14',
    zoom: 'opacity-0 scale-90',
    fade: 'opacity-0',
  };
  return (
    <div ref={ref}
      className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : hidden[anim]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function EventoDetalhePage({ params }: { params: { id: string } }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [evento, setEvento] = useState<Evento | null>(null);
  const [eventoAnterior, setEventoAnterior] = useState<EventoNav | null>(null);
  const [eventoProximo, setEventoProximo] = useState<EventoNav | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ── CONTROLE DO HEADER ──
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // FETCH REAL NA SUPABASE
  useEffect(() => {
    async function fetchEventoReal() {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', params.id)
          .single(); 

        if (error) throw new Error("Erro ao buscar o evento na base de dados.");
        
        if (data) {
          setEvento(data);
          
          // Buscar todos os eventos ordenados por data para descobrir o Anterior e o Próximo
          const { data: allEvents } = await supabase
            .from('eventos')
            .select('id, titulo')
            .order('data', { ascending: true });
            
          if (allEvents) {
            const currentIndex = allEvents.findIndex(e => e.id === params.id);
            if (currentIndex > 0) {
              setEventoAnterior(allEvents[currentIndex - 1]);
            }
            if (currentIndex !== -1 && currentIndex < allEvents.length - 1) {
              setEventoProximo(allEvents[currentIndex + 1]);
            }
          }
        } else {
          setErro("Evento não encontrado.");
        }
      } catch (err: any) {
        setErro(err.message || "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) fetchEventoReal();
  }, [params.id]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsHeaderSolid(currentScrollY > 80);

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF7] text-[#00577C]">
        <Loader2 className="w-16 h-16 animate-spin mb-6" />
        <p className={`${jakarta.className} font-black uppercase tracking-widest text-sm`}>Carregando evento...</p>
      </div>
    );
  }

  if (erro || !evento) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF7] text-slate-900 px-6 text-center">
        <CalendarDays className="w-20 h-20 text-slate-300 mb-6" />
        <h1 className={`${jakarta.className} text-5xl font-black mb-4 text-[#00577C]`}>Evento Indisponível</h1>
        <p className="text-slate-500 mb-10 max-w-md text-lg">{erro || "Não foi possível carregar os detalhes do evento solicitado."}</p>
        <Link href="/eventos" className="bg-[#F9C400] text-[#00577C] px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 transition-transform">
          Voltar à Agenda
        </Link>
      </div>
    );
  }

  // Formatação de Datas
  const dataObj = new Date(evento.data + 'T00:00:00'); 
  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const diaSemana = diasSemana[dataObj.getDay()];
  const diaMes = String(dataObj.getDate()).padStart(2, '0');
  const mesExtenso = meses[dataObj.getMonth()];
  const ano = dataObj.getFullYear();

  // ── MENU GROUPS ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 overflow-x-hidden flex flex-col`}>
      
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
                  {group.label} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
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
          HERO — PADRÃO COM TÍTULO BRANCO
      ══════════════════════════════════════ */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={evento.imagem_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'}
            alt={evento.titulo}
            fill
            className="object-cover" // ← REMOVIDO: scale-105 e animate-[pulse]
            priority
          />
          {/* Gradiente apenas na parte inferior para legibilidade do texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[6rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            {evento.titulo}
          </h1>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CONTEÚDO PRINCIPAL (INFORMAÇÕES DISCRETAS)
      ══════════════════════════════════════ */}
      <section className="max-w-[900px] mx-auto px-6 py-12 md:py-16 w-full relative z-20 flex-1">
        
        <Reveal anim="up">
          <Link href="/eventos" className="text-[#00577C] hover:text-[#003d57] transition-colors mb-10 inline-block font-medium text-sm md:text-base underline underline-offset-4 decoration-slate-200 hover:decoration-[#00577C]">
            &larr; Voltar para a agenda de eventos
          </Link>

          <div className="text-slate-700 leading-relaxed text-base md:text-lg whitespace-pre-wrap mb-12">
            {evento.descricao || "Este evento não possui descrição detalhada no momento. Para mais informações, contate a organização local."}
          </div>

          <div className="flex flex-col gap-4 text-sm md:text-base text-slate-800">
            <p><strong>Data:</strong> {diaMes} de {mesExtenso} de {ano} ({diaSemana})</p>
            
            {(evento.horario || evento.duracao) && (
              <p>
                <strong>Horário:</strong> {evento.horario || 'N/D'} 
                {evento.duracao && <span className="text-slate-500 font-normal"> (Duração: {evento.duracao})</span>}
              </p>
            )}
            
            <p>
              <strong>Entrada:</strong> {evento.preco && evento.preco.toLowerCase() !== 'gratuito' ? evento.preco : 'Gratuito'} 
              {evento.classificacao && <span className="text-slate-500 font-normal"> • {evento.classificacao}</span>}
            </p>

            <p>
              <strong>Local:</strong> {evento.local || 'São Geraldo do Araguaia'} -{' '}
              <a 
                href={`https://maps.google.com/maps?q=${encodeURIComponent((evento.local || '') + ' São Geraldo do Araguaia, Pará')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#00577C] font-semibold hover:underline decoration-slate-300 underline-offset-4"
              >
                Ver no mapa
              </a>
            </p>

            {evento.link_bilheteira && (
              <p className="mt-4">
                <strong>Bilheteira:</strong>{' '}
                <a 
                  href={evento.link_bilheteira} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#00577C] font-semibold hover:underline decoration-slate-300 underline-offset-4"
                >
                  Adquirir bilhete online
                </a>
              </p>
            )}
          </div>
        </Reveal>

        {/* ── NAVEGAÇÃO DE EVENTOS (ANTERIOR / PRÓXIMO) ── */}
        <div className="w-full pt-16 md:pt-24 mt-16 md:mt-24 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-10">
            
            {eventoAnterior ? (
              <Link href={`/eventos/${eventoAnterior.id}`} className="group flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left mr-auto w-full sm:w-auto">
                <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#00577C] group-hover:text-white group-hover:border-[#00577C] transition-all shrink-0">
                  <ArrowLeft size={20} />
                </div>
                <div>
                  <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1`}>Evento Anterior</p>
                  <p className={`${jakarta.className} text-base md:text-lg font-bold text-slate-800 group-hover:text-[#00577C] transition-colors line-clamp-2 leading-tight`}>
                    {eventoAnterior.titulo}
                  </p>
                </div>
              </Link>
            ) : <div className="hidden sm:block flex-1" />}

            {eventoProximo ? (
              <Link href={`/eventos/${eventoProximo.id}`} className="group flex flex-col sm:flex-row-reverse items-center sm:items-start gap-4 text-center sm:text-right ml-auto w-full sm:w-auto">
                <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#00577C] group-hover:text-white group-hover:border-[#00577C] transition-all shrink-0">
                  <ArrowRight size={20} />
                </div>
                <div>
                  <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1`}>Próximo Evento</p>
                  <p className={`${jakarta.className} text-base md:text-lg font-bold text-slate-800 group-hover:text-[#00577C] transition-colors line-clamp-2 leading-tight`}>
                    {eventoProximo.titulo}
                  </p>
                </div>
              </Link>
            ) : <div className="hidden sm:block flex-1" />}
            
          </div>
        </div>

      </section>

      {/* ── FOOTER INSTITUCIONAL INTEGRADO ── */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-[#FDFCF7] text-left mt-auto z-20 relative">
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