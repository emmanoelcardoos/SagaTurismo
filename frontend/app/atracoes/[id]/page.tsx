'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, MapPin, Compass, Mountain,
  Waves, Camera, Shield, Clock, ChevronDown, Menu, X, Loader2,
  Phone, Map, Bed, Image as ImageIcon, // <-- Ícones corrigidos aqui
  ShieldCheck
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// ── FONTES ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPOS ──
type Atracao = {
  id: string;
  nome: string;
  descricao: string;
  imagem_url: string;
  preco_entrada?: string | number;
  whatsapp?: string;
  link_google_maps?: string;
  link_hospedagem?: string;
  galeria?: string[];
};

// ── MOTOR DE ANIMAÇÕES DE SCROLL ──
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

// ── CONTEXTO VISUAL BASEADO NA CATEGORIA ──
function getRichContent(categoria: string) {
  const defaultTheme = {
    cor: '#00577C', corAccent: '#F9C400', bgDark: '#001f2e', icon: <Compass size={16} />
  };
  const temas: Record<string, typeof defaultTheme> = {
    'Cachoeira': { cor: '#00577C', corAccent: '#F9C400', bgDark: '#001f2e', icon: <Waves size={16} /> },
    'Mirante': { cor: '#8b5e0a', corAccent: '#F9C400', bgDark: '#1a0e02', icon: <Mountain size={16} /> },
    'Praia': { cor: '#F9C400', corAccent: '#00577C', bgDark: '#332700', icon: <Waves size={16} /> },
    'História': { cor: '#009640', corAccent: '#F9C400', bgDark: '#051a09', icon: <Shield size={16} /> },
  };
  return temas[categoria] || defaultTheme;
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================
export default function AtracaoDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [atracao, setAtracao] = useState<Atracao | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound404, setNotFound404] = useState(false);
  
  const [scrollY, setScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchAtracao() {
      const { data, error } = await supabase
        .from('atracoes').select('*').eq('id', id).single();
      
      if (error || !data) { setNotFound404(true); setLoading(false); return; }
      setAtracao(data as Atracao);
      setLoading(false);
    }
    if (id) fetchAtracao();
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

  if (loading) return (
    <div className={`${inter.className} min-h-screen bg-[#001f2e] flex flex-col items-center justify-center gap-4`}>
      <Loader2 className="animate-spin text-[#F9C400] w-12 h-12" />
      <p className="text-white/30 font-black text-[10px] uppercase tracking-widest">Preparando destino...</p>
    </div>
  );

  if (notFound404 || !atracao) return (
    <div className={`${inter.className} min-h-screen bg-[#001f2e] flex flex-col items-center justify-center gap-6 px-6`}>
      <MapPin className="text-white/10 w-20 h-20" />
      <h1 className={`${jakarta.className} text-4xl font-black text-white text-center`}>Atração não encontrada</h1>
      <Link href="/atracoes" className="inline-flex items-center gap-2 bg-[#F9C400] text-[#002f40] px-7 py-3.5 rounded-full font-black text-xs uppercase tracking-widest">
        <ArrowLeft size={14} /> Ver todas as atrações
      </Link>
    </div>
  );

  const theme = getRichContent('Padrão');

  return (
    <main className={`${inter.className} text-white overflow-x-hidden`} style={{ backgroundColor: theme.bgDark }}>

      {/* ── HEADER PADRÃO (Com hover branco) ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Rotas','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`} className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
              Cartão Residente
            </Link>
          </nav>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas Turísticas</Link>
            <Link href="/eventos" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Agenda Cultural</Link>
            <Link href="/pacotes" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Pacotes</Link>
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas</Link>
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════
          HERO — IMAGEM FULL SCREEN + PARALLAX
      ══════════════════════════════════════ */}
      <section className="relative h-[85vh] md:h-screen flex flex-col items-start justify-end pb-20 md:pb-28 px-6 md:px-12 overflow-hidden">
        
        <div className="absolute inset-0 z-0 scale-110" style={{ transform: `translateY(${scrollY * 0.3}px) scale(1.1)` }}>
          <Image src={atracao.imagem_url} alt={atracao.nome} fill className="object-cover" priority />
        </div>

        <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: `linear-gradient(to top, ${theme.bgDark} 0%, ${theme.bgDark}cc 25%, ${theme.bgDark}44 55%, transparent 80%)` }} />
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: `linear-gradient(to right, ${theme.bgDark}99 0%, transparent 60%)` }} />

        <div className="relative z-10 max-w-[1400px] w-full mx-auto">

          <h1 className={`${jakarta.className} text-[clamp(3rem,9vw,7.5rem)] font-black text-white leading-[0.88] mb-6 max-w-3xl`}>
            {atracao.nome}
          </h1>

          <div className="flex items-center gap-3 mb-10">
            <span className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold"
              style={{ borderColor: theme.cor + '50', backgroundColor: theme.cor + '15', color: theme.corAccent }}>
              {theme.icon} {atracao.preco_entrada ? `Preço: ${atracao.preco_entrada}` : 'Entrada Gratuita'}
            </span>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold"
              style={{ borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}>
              <Camera size={14} /> Local Fotogénico
            </span>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
             <Link href="/atracoes" className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest border transition-all hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
               <ArrowLeft size={12} /> Voltar
             </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <ChevronDown size={18} className="animate-bounce" style={{ color: theme.corAccent + '60' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════
          CONTEÚDO EDITORIAL
      ══════════════════════════════════════ */}
      <section className="py-24 md:py-32" style={{ backgroundColor: theme.bgDark }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20 items-start">
            
            {/* Sidebar Esquerda */}
            <Reveal anim="right" className="md:col-span-4">
              <div className="sticky top-32">
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-8 h-[2px] rounded-full" style={{ backgroundColor: theme.cor }} />
                  <span className="font-black text-[9px] uppercase tracking-[0.3em]" style={{ color: theme.cor }}>Detalhes do Local</span>
                </div>
                
                <div className="p-8 rounded-[2rem] border mt-8" style={{ borderColor: theme.cor + '30', backgroundColor: theme.cor + '08' }}>
                  <MapPin size={24} className="mb-4" style={{ color: theme.corAccent }} />
                  <h3 className={`${jakarta.className} text-2xl font-black text-white mb-4`}>Acesso</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">Esta atração faz parte dos roteiros oficiais. Certifique-se de estar acompanhado por um guia credenciado.</p>
                  <Link href="/rotas" className="inline-flex items-center gap-2 text-xs font-bold transition-colors" style={{ color: theme.corAccent }}>
                     Ver rotas compatíveis <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* Conteúdo Principal */}
            <Reveal anim="left" delay={150} className="md:col-span-8">
              <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-white leading-[1] mb-10`}>
                Descubra a magia<br /><span className="italic" style={{ color: theme.cor }}>deste lugar</span>
              </h2>
              
              <div className="text-white/60 text-lg leading-relaxed whitespace-pre-wrap font-medium mb-12">
                {atracao.descricao || 'Informação detalhada não disponível no momento. Visite o local para uma experiência inesquecível.'}
              </div>

              {/* ── BOTÕES DE AÇÃO RÁPIDA (Agora fora da grid de texto) ── */}
              <div className="flex flex-wrap gap-4 pt-8 border-t border-white/10">
                {atracao.whatsapp && (
                  <a href={`https://wa.me/55${atracao.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-lg">
                    <Phone size={16} /> Contactar Local
                  </a>
                )}
                {atracao.link_google_maps && (
                  <a href={atracao.link_google_maps} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#4285F4] text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-lg">
                    <Map size={16} /> Abrir no Mapa
                  </a>
                )}
                {atracao.link_hospedagem && (
                  <Link href={atracao.link_hospedagem}
                    className="flex items-center gap-2 bg-[#F9C400] text-[#002f40] px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-lg">
                    <Bed size={16} /> Onde Ficar
                  </Link>
                )}
              </div>
            </Reveal>

          </div>

          {/* ── GALERIA DE IMAGENS (Fora da grid para ocupar o espaço todo lindamente) ── */}
          {atracao.galeria && atracao.galeria.length > 0 && (
            <Reveal anim="up" className="mt-24 pt-16 border-t border-white/10">
              <h3 className={`${jakarta.className} text-3xl font-black text-white mb-8 flex items-center gap-3`}>
                <ImageIcon size={24} className="text-[#F9C400]" /> Galeria do Local
              </h3>
              
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
                {atracao.galeria.map((imgUrl, i) => (
                  <div key={i} className="relative shrink-0 snap-center rounded-[2.5rem] overflow-hidden w-[300px] h-[400px] md:w-[450px] md:h-[550px] group">
                    <Image 
                      src={imgUrl} 
                      alt={`Galeria ${atracao.nome} ${i + 1}`} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    {/* Gradiente sútil na base da foto */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                ))}
              </div>
            </Reveal>
          )}

        </div>
      </section>
      
      {/* ── FOOTER MINIMAL ── */}
      {/* FOOTER */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de São Geraldo do Araguaia" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                © 2026 Secretaria Municipal de Turismo - SGA | Todos os direitos reservados
              </p>
              <p className="text-[10px] font-bold text-slate-400/80">
                CNPJ: 10.249.241/0001-22
              </p>
            </div>
          </div>

          <div className="flex gap-10">
            <div className="text-left border-l-2 border-slate-100 pl-9">
              <p className="text-[10px] font-black text-[#00577C] uppercase mb-1">Contato Oficial</p>
              <p className="text-xs font-bold text-slate-500 tracking-tight">setursaga@gmail.com</p>
            </div>
            <ShieldCheck size={40} className="text-[#009640] opacity-30" />
          </div>
        </div>
      </footer>
    </main>
  );
}