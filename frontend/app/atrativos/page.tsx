'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, ArrowRight, Loader2, Compass,
  ChevronDown, MapPin, Camera, Ticket, ShieldCheck,
  Mountain, Leaf, Waves, UserCircle, Sparkles
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGEM ──
type Atracao = {
  id: string;
  nome: string;
  tipo?: string;
  descricao?: string;
  imagem_url: string;
  preco_entrada?: number;
  link_google_maps?: string;
  ativo?: boolean;
};

// ── MOTOR DE SCROLL ──
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
      className={`transition-all duration-1000 ease-out will-change-transform
        ${isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : hidden[anim]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════
// CARD DE ATRAÇÃO (GRADE 3 COLUNAS)
// ══════════════════════════════════════
function AtracaoCard({ atracao, index }: { atracao: Atracao; index: number }) {
  return (
    <Reveal anim="up" delay={index * 50}>
      <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 h-full flex flex-col">
        {/* Imagem */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src={atracao.imagem_url || 'https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/atracoes/casapedra.png'}
            alt={atracao.nome}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
        </div>

        {/* Conteúdo */}
        <div className="p-5 md:p-6 flex flex-col flex-1">
          <h3 className={`${jakarta.className} text-lg md:text-xl font-black text-slate-900 leading-tight line-clamp-2 mb-4`}>
            {atracao.nome}
          </h3>
          
          <div className="mt-auto pt-2">
            <Link
              href={`/atrativos/${atracao.id}`}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00577C] hover:text-[#003d5a] transition-colors group/link"
            >
              Saiba mais
              <ArrowRight size={16} className="transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ══════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════
export default function AtracoesPage() {
  // ── CONTROLE DO HEADER ──
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // ── DADOS ──
  const [atracoes, setAtracoes] = useState<Atracao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAtracoes() {
      const { data, error } = await supabase
        .from('atracoes')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true, nullsFirst: false });

      if (data) setAtracoes(data as Atracao[]);
      if (error) console.error('Erro ao buscar atrativos:', error);
      setLoading(false);
    }
    fetchAtracoes();
  }, []);

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

  // ── MENU DO HEADER ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hospedagens', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  return (
    <main className={`${inter.className} text-slate-900 overflow-x-hidden min-h-screen bg-[#FDFCF7]`}>

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
          HERO EDITORIAL (COLORIDO - SEM ANIMAÇÃO E SEM ESBRANQUIÇAMENTO)
      ══════════════════════════════════════ */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/herosections/heroatrativos.jpg"
            alt="Atrativos em São Geraldo do Araguaia"
            fill
            className="object-cover"
            priority
          />
          {/* Gradiente apenas na parte inferior para legibilidade do texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            Atrativos
          </h1>
          <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
            Tesouros naturais e culturais de São Geraldo do Araguaia
          </p>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════
          LISTAGEM DE ATRAÇÕES EM GRADE 3 COLUNAS
      ══════════════════════════════════════ */}
      <section id="atrativos" className="pb-24 pt-16 md:pt-20 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          
          {/* Cabeçalho da seção */}
          <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-6">
            <div>
              <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900`}>Nossos Atrativos</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Explore as belezas naturais da região</p>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <Loader2 className="animate-spin w-12 h-12 mb-4 text-[#00577C]" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Preparando os nossos atrativos...
              </p>
            </div>
          )}

          {!loading && atracoes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <Compass size={64} className="text-slate-200 mb-6" />
              <h3 className={`${jakarta.className} text-3xl font-black mb-3 text-slate-800`}>
                Novos destinos a caminho
              </h3>
              <p className="text-sm font-medium text-slate-500 max-w-lg mx-auto">
                Estamos catalogando as melhores atrações naturais de São Geraldo do Araguaia. Volte em breve.
              </p>
            </div>
          )}

          {!loading && atracoes.length > 0 && (
            <>
              {/* GRADE 3 COLUNAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
                {atracoes.map((atracao, index) => (
                  <AtracaoCard key={atracao.id} atracao={atracao} index={index} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
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