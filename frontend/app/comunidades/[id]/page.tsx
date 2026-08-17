'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import {
  Menu, X, Loader2, ChevronDown, AlertCircle
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// ── FONTES ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPOS ──
type Comunidade = {
  id: string;
  titulo: string;
  descricao_curta: string;
  historia_texto?: string;
  cultura_texto?: string;
  imagem_url: string;
  galeria?: any;
};

type PontoComunidade = {
  id: string;
  titulo: string;
  tipo: string; 
  imagem_url: string;
};

// ── UTILS ──
const parseGaleria = (galeriaRaw: any): string[] => {
  if (!galeriaRaw) return [];
  if (Array.isArray(galeriaRaw)) return galeriaRaw;
  if (typeof galeriaRaw === 'string') {
    try { return JSON.parse(galeriaRaw); } catch (e) { return []; }
  }
  return [];
};

// ── MOTOR DE ANIMAÇÕES ──
function useScrollAnimation(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);
  return { ref, isVisible };
}

function Reveal({ children, className = '', anim = 'up', delay = 0 }: {
  children: ReactNode; className?: string; anim?: 'up' | 'left' | 'right' | 'zoom' | 'fade'; delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();
  const hiddenMap: Record<string, string> = {
    'up': 'opacity-0 translate-y-14',
    'left': 'opacity-0 translate-x-14',
    'right': 'opacity-0 -translate-x-14',
    'zoom': 'opacity-0 scale-90',
    'fade': 'opacity-0',
  };
  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : hiddenMap[anim]} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function ComunidadeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [comunidade, setComunidade] = useState<Comunidade | null>(null);
  const [pontos, setPontos] = useState<PontoComunidade[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [scrollY, setScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    async function fetchComunidadeData() {
      if (!id) return;
      
      const { data: comunidadeData, error: comError } = await supabase.from('comunidades').select('*').eq('id', id).single();
      if (comError || !comunidadeData) {
        setLoading(false);
        return;
      }
      setComunidade(comunidadeData as Comunidade);

      const { data: pontosData } = await supabase.from('comunidade_pontos').select('*').eq('comunidade_id', id);
      if (pontosData) setPontos(pontosData as PontoComunidade[]);

      setLoading(false);
    }
    fetchComunidadeData();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      if (y < 80) setShowHeader(true);
      else if (y > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(y);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isHeaderSolid = scrollY > 50 || isHovered || isMobileMenuOpen;

  // ── MENU AGRUPADO ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos',  'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  if (loading) return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center gap-4`}>
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12" />
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">A carregar comunidade...</p>
    </div>
  );

  if (!comunidade) return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center text-center px-6 gap-6`}>
      <AlertCircle size={64} className="text-slate-300 mb-2" />
      <h1 className={`${jakarta.className} text-4xl font-black text-slate-800`}>Comunidade não encontrada</h1>
      <p className="text-slate-500 max-w-md">Não conseguimos localizar esta comunidade. O link pode estar incorreto.</p>
      <Link href="/comunidades" className="inline-flex items-center gap-2 bg-[#00577C] text-white px-7 py-3.5 rounded-full font-black text-xs uppercase tracking-widest mt-4 shadow-md hover:bg-[#004a6b] transition-colors">
        &larr; Voltar para Comunidades
      </Link>
    </div>
  );

  const fotosGaleria = parseGaleria(comunidade.galeria).filter(Boolean);

  return (
    <main className={`${inter.className} bg-[#FDFCF7] text-slate-900 overflow-x-hidden min-h-screen flex flex-col`}>
      
      {/* ── HEADER INTELIGENTE TRANSPARENTE ── */}
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
            <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-3">
              <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md`}>
                Cartão Residente
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════
          HERO — PADRÃO OFICIAL
      ══════════════════════════════════════ */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={comunidade.imagem_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'}
            alt={`Capa de ${comunidade.titulo}`}
            fill
            className="object-cover scale-105 animate-[pulse_20s_ease-in-out_infinite]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/80" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[7rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            {comunidade.titulo}
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
          CONTEÚDO PRINCIPAL (DESCRIÇÃO LIMPA)
      ══════════════════════════════════════ */}
      <section className="max-w-[900px] mx-auto px-6 py-12 md:py-16 w-full relative z-20">
        <Reveal anim="up">
          <Link href="/comunidades" className="text-[#00577C] hover:text-[#003d57] transition-colors mb-10 inline-block font-medium text-sm md:text-base underline underline-offset-4 decoration-slate-200 hover:decoration-[#00577C]">
            &larr; Voltar para comunidades
          </Link>

          <div className="text-slate-700 leading-relaxed text-base md:text-lg whitespace-pre-wrap mb-12">
            {comunidade.historia_texto || comunidade.descricao_curta || 'Detalhes sobre a história e cultura desta comunidade em breve.'}
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════
          VIVER A COMUNIDADE (VITRINE)
      ══════════════════════════════════════ */}
      {pontos.length > 0 && (
        <section className="max-w-[1400px] mx-auto w-full px-6 mb-24">
          <Reveal anim="up">
            <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 mb-8 border-b border-slate-200 pb-4`}>
              O que você encontra aqui
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pontos.map((ponto, i) => (
                <Reveal key={ponto.id} delay={i * 100}>
                  {/* Bloco visual (Sem link para fora) */}
                  <div className="relative h-[300px] md:h-[380px] rounded-[2.5rem] overflow-hidden group shadow-md border border-slate-100 block bg-slate-100">
                    <Image 
                      src={ponto.imagem_url || comunidade.imagem_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'} 
                      alt={ponto.titulo} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

                    <div className="absolute bottom-8 left-8 right-8 z-10">
                      <h4 className={`${jakarta.className} text-white text-2xl md:text-3xl font-black leading-tight drop-shadow-md`}>
                        {ponto.titulo}
                      </h4>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ══════════════════════════════════════
          GALERIA
      ══════════════════════════════════════ */}
      {fotosGaleria.length > 0 && (
        <section className="max-w-[1400px] mx-auto w-full px-6 mb-24">
          <Reveal anim="up">
            <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 mb-8 border-b border-slate-200 pb-4`}>
              Galeria
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {fotosGaleria.map((imgUrl, i) => (
                <div key={i} className="relative rounded-[2rem] overflow-hidden aspect-[4/3] group shadow-sm bg-slate-100 border border-slate-100">
                  <Image src={imgUrl} alt={`Galeria da Comunidade ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

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