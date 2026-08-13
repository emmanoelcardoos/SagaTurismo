'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import {
  Menu, X, ArrowLeft, ArrowRight,
  BookOpen, Shield, Compass, Loader2,
  ShieldCheck, AlertCircle, Camera
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
  link_destino?: string;
  whatsapp?: string | null;
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollY, setScrollY] = useState(0);

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

  const menuItens = ['Hoteis', 'Agencias', 'Rotas', 'Passeios', 'Atracoes', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'];

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
        <ArrowLeft size={14} /> Voltar para Comunidades
      </Link>
    </div>
  );

  const fotosGaleria = parseGaleria(comunidade.galeria).filter(Boolean);

  return (
    <main className={`${inter.className} bg-[#FDFCF7] text-slate-900 overflow-x-hidden min-h-screen flex flex-col`}>
      
      {/* ── HEADER ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${scrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {menuItens.map(item => (
              <Link key={item} href={`/${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
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
            {menuItens.map(item => (
              <Link key={item} href={`/${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2 transition-colors`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>
              Cartão Residente
            </Link>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════
          HERO — IMERSIVO
      ══════════════════════════════════════ */}
      <section className="relative h-[60vh] md:h-[70vh] min-h-[450px] w-full bg-[#002f40] mt-[72px] md:mt-[80px]">
        <Image
          src={comunidade.imagem_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'}
          alt={`Capa de ${comunidade.titulo}`}
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent" />
        
        {/* Botão Voltar */}
        <div className="absolute top-6 left-6 md:left-12 z-20">
          <Link href="/comunidades" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
            <ArrowLeft size={14} /> Voltar
          </Link>
        </div>

        <div className="absolute bottom-16 md:bottom-20 left-6 md:left-12 right-6 max-w-[1400px] mx-auto z-10 w-full">
          <Reveal anim="up">
            <h1 className={`${jakarta.className} text-[clamp(3rem,7vw,6.5rem)] font-black text-white leading-[1.05] drop-shadow-2xl max-w-full`}>
              {comunidade.titulo}
            </h1>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CONTEÚDO PRINCIPAL (HISTÓRIA E CULTURA)
      ══════════════════════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-6 w-full relative z-20 -mt-8 md:-mt-12 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
          
          {/* Coluna 1: História */}
          {comunidade.historia_texto && (
            <Reveal anim="up" delay={100} className="h-full">
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-slate-100 h-full flex flex-col hover:shadow-2xl transition-shadow">
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 mb-6 flex items-center gap-3`}>
                  <Shield size={24} className="text-[#00577C]" /> Nossa História
                </h3>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap flex-1">
                  {comunidade.historia_texto}
                </div>
              </div>
            </Reveal>
          )}

          {/* Coluna 2: Cultura */}
          {comunidade.cultura_texto && (
            <Reveal anim="up" delay={200} className="h-full">
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-slate-100 h-full flex flex-col hover:shadow-2xl transition-shadow">
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 mb-6 flex items-center gap-3`}>
                  <BookOpen size={24} className="text-[#F9C400]" /> Cultura & Saberes
                </h3>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap flex-1">
                  {comunidade.cultura_texto}
                </div>
              </div>
            </Reveal>
          )}

        </div>
      </section>

      {/* ══════════════════════════════════════
          VIVER A COMUNIDADE (LISTAGEM UNIFICADA)
      ══════════════════════════════════════ */}
      {pontos.length > 0 && (
        <section className="max-w-[1400px] mx-auto w-full px-6 mb-24 mt-8">
          <Reveal anim="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-slate-200 pb-6">
              <div>
                <h3 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-2 flex items-center gap-3`}>
                  <Compass size={32} className="text-[#009640]" /> O que viver aqui
                </h3>
                <p className="text-slate-500 text-sm md:text-base">Explore as belezas, atividades e serviços locais.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pontos.map((ponto, i) => {
                // 1. LÓGICA INTELIGENTE DE LINKS (Agora com WhatsApp Dinâmico)
                
                // Se tiver WhatsApp no ponto, limpa os caracteres não numéricos. Se não tiver, usa o da SEMTUR.
                const numeroWhatsApp = ponto.whatsapp 
                  ? ponto.whatsapp.replace(/\D/g, '') 
                  : "5594981452067";

                const mensagem = encodeURIComponent(`Olá! Gostaria de mais informações sobre ${ponto.titulo} na comunidade ${comunidade.titulo}.`);
                const fallbackWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagem}`;
                
                // Se não tiver link de página/mapa, usa o WhatsApp gerado acima
                const destino = ponto.link_destino || fallbackWhatsApp;
                
                // Se o link for externo (começar com http), abre em nova aba
                const isExternal = destino.startsWith('http');
                
                // Texto automático do botão baseado no tipo de link
                let btnText = "Ver detalhes";
                if (!ponto.link_destino) btnText = "Falar no WhatsApp";
                else if (destino.includes('maps') || destino.includes('google')) btnText = "Ver no mapa";
                else if (destino.includes('wa.me')) btnText = "Falar no WhatsApp";

                return (
                  <Reveal key={ponto.id} delay={i * 100}>
                    <Link 
                      href={destino} 
                      target={isExternal ? "_blank" : "_self"}
                      rel={isExternal ? "noopener noreferrer" : ""}
                      className="relative h-[380px] rounded-[2.5rem] overflow-hidden group shadow-md border border-slate-100 block"
                    >
                      <Image 
                        src={ponto.imagem_url || comunidade.imagem_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'} 
                        alt={ponto.titulo} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/30 to-transparent" />
                      
                      <div className="absolute bottom-8 left-8 right-8 z-10 flex flex-col gap-3">
                        <h4 className={`${jakarta.className} text-white text-2xl md:text-3xl font-black leading-tight drop-shadow-md`}>{ponto.titulo}</h4>
                        <div className="w-12 h-1 bg-[#F9C400] rounded-full transform origin-left group-hover:scale-x-[2.5] transition-transform duration-500"></div>
                        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F9C400] mt-1 group-hover:translate-x-2 transition-transform duration-300">
                          {btnText} <ArrowRight size={14} />
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </Reveal>
        </section>
      )}

      {/* ══════════════════════════════════════
          SEÇÃO DE LARGURA TOTAL: GALERIA
      ══════════════════════════════════════ */}
      {fotosGaleria.length > 0 && (
        <section className="max-w-[1400px] mx-auto w-full px-6 mb-24">
          <Reveal anim="up">
            <h3 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-8 flex items-center gap-3 border-b border-slate-200 pb-6`}>
              <Camera size={32} className="text-[#009640]" /> Retratos da Comunidade
            </h3>
            
            <div className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-6 hide-scrollbar">
              {fotosGaleria.map((imgUrl, i) => (
                <div key={i} className="relative shrink-0 snap-center rounded-[2.5rem] overflow-hidden w-[280px] h-[350px] md:w-[400px] md:h-[500px] lg:w-[450px] lg:h-[550px] group shadow-sm bg-slate-100">
                  <Image src={imgUrl} alt={`Galeria da Comunidade ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left mt-auto">
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