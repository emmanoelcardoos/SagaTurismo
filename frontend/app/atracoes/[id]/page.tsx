'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, MapPin, Compass, Mountain,
  Camera, Shield, Clock, ChevronDown, Menu, X, Loader2,
  Phone, Map, Bed, Image as ImageIcon, ShieldCheck, Ticket, AlertCircle
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
  tipo: string;
  descricao: string;
  imagem_url: string;
  preco_entrada?: string | number;
  whatsapp?: string;
  link_google_maps?: string;
  link_hospedagem?: string;
  galeria?: any; // Pode vir como string JSON ou array
};

// ── UTILS ──
const parseGaleria = (galeriaRaw: any): string[] => {
  if (!galeriaRaw) return [];
  if (Array.isArray(galeriaRaw)) return galeriaRaw;
  if (typeof galeriaRaw === 'string') {
    try {
      return JSON.parse(galeriaRaw);
    } catch (e) {
      return [];
    }
  }
  return [];
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
      if (!id) return;
      const { data, error } = await supabase
        .from('atracoes').select('*').eq('id', id).single();
      
      if (error || !data) { setNotFound404(true); setLoading(false); return; }
      setAtracao(data as Atracao);
      setLoading(false);
    }
    fetchAtracao();
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

  const menuItens = ['Hoteis', 'Agencias', 'Rotas', 'Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'];

  // ── ESTADOS DE LOADING E 404 (SOFT) ──
  if (loading) return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center gap-4`}>
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12" />
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Preparando destino...</p>
    </div>
  );

  if (notFound404 || !atracao) return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center text-center px-6 gap-6`}>
      <AlertCircle size={64} className="text-slate-300 mb-2" />
      <h1 className={`${jakarta.className} text-4xl font-black text-slate-800`}>Atração não encontrada</h1>
      <p className="text-slate-500 max-w-md">Não conseguimos localizar este ponto turístico. Ele pode estar indisponível ou o link está incorreto.</p>
      <Link href="/atracoes" className="inline-flex items-center gap-2 bg-[#00577C] text-white px-7 py-3.5 rounded-full font-black text-xs uppercase tracking-widest mt-4 shadow-md hover:bg-[#004a6b] transition-colors">
        <ArrowLeft size={14} /> Voltar para Atrações
      </Link>
    </div>
  );

  const fotosGaleria = parseGaleria(atracao.galeria);

  return (
    <main className={`${inter.className} text-slate-900 overflow-x-hidden bg-[#FDFCF7] flex flex-col min-h-screen`}>

      {/* ── HEADER PADRÃO ── */}
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
          HERO — CAPA DA ATRAÇÃO
      ══════════════════════════════════════ */}
      <section className="relative h-[40vh] md:h-[50vh] min-h-[300px] w-full bg-[#002f40] mt-[72px] md:mt-[80px]">
        <Image
          src={atracao.imagem_url}
          alt={`Capa de ${atracao.nome}`}
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
        
        <div className="absolute top-6 left-6 md:left-12 z-10">
          <Link href="/atracoes" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
            <ArrowLeft size={14} /> Voltar para Atrações
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CONTEÚDO PRINCIPAL (SOBRE E AÇÕES)
      ══════════════════════════════════════ */}
      <section className="flex-1 max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full relative z-20 -mt-20 md:-mt-24 mb-24">
        
        {/* COLUNA ESQUERDA (TÍTULO, DESCRIÇÃO E GALERIA) */}
        <Reveal anim="up" className="lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-6">
            
            {/* Tags Superiores */}
            <div className="flex flex-wrap items-center gap-2">
              {atracao.tipo && (
                <span className="bg-[#00577C]/10 text-[#00577C] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-[#00577C]/10">
                  <Camera size={14} /> {atracao.tipo}
                </span>
              )}
            </div>

            {/* Título Principal */}
            <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1]`}>
              {atracao.nome}
            </h1>

            {/* Descrição Detalhada */}
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-base md:text-lg whitespace-pre-wrap mt-4">
              {atracao.descricao || 'Detalhes e informações sobre esta atração em breve.'}
            </div>

            {/* Galeria Embutida */}
            {fotosGaleria.length > 0 && (
              <div className="mt-10 pt-10 border-t border-slate-100">
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-6 flex items-center gap-3`}>
                  <ImageIcon size={24} className="text-[#F9C400]" /> Galeria de Fotos
                </h3>
                
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
                  {fotosGaleria.map((imgUrl, i) => (
                    <div key={i} className="relative shrink-0 snap-center rounded-[2rem] overflow-hidden w-[280px] h-[350px] md:w-[350px] md:h-[450px] group border border-slate-100 shadow-sm bg-slate-50">
                      <Image 
                        src={imgUrl} 
                        alt={`Galeria ${atracao.nome} ${i + 1}`} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Reveal>

        {/* COLUNA DIREITA (SIDEBAR DE AÇÕES E INFORMAÇÕES) */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
          <Reveal anim="left" delay={150}>
            <div className="bg-white rounded-[2rem] p-8 shadow-md border border-slate-100 flex flex-col gap-6">
              
              <h3 className={`${jakarta.className} text-xl font-black text-slate-900 border-b border-slate-100 pb-4`}>
                Informações Úteis
              </h3>

              {/* Preço de Entrada */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-[#009640]">
                  <Ticket size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Entrada</p>
                  <p className={`${jakarta.className} text-xl font-black text-slate-800`}>
                    {atracao.preco_entrada && Number(atracao.preco_entrada) > 0 
                      ? `R$ ${Number(atracao.preco_entrada).toFixed(2)}` 
                      : 'Gratuito'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-xs font-medium text-slate-500 leading-relaxed border border-slate-100">
                <p className="flex items-start gap-2">
                  <Shield size={16} className="text-[#00577C] shrink-0 mt-0.5" />
                  Certifique-se de estar acompanhado por um guia credenciado caso a atração exija trilhas complexas.
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                {atracao.link_google_maps && (
                  <a href={atracao.link_google_maps} target="_blank" rel="noopener noreferrer"
                     className="w-full flex items-center justify-center gap-2 bg-[#00577C] text-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#004a6b] transition-all hover:-translate-y-0.5">
                    <Map size={16} /> Ver Rota no Mapa
                  </a>
                )}

                {atracao.whatsapp && (
                  <a href={`https://wa.me/55${atracao.whatsapp.replace(/\D/g, '')}?text=Olá! Encontrei a atração ${atracao.nome} no portal SagaTurismo e gostaria de mais informações.`} target="_blank" rel="noopener noreferrer"
                     className="w-full flex items-center justify-center gap-2 bg-[#009640] text-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#007a33] transition-all hover:-translate-y-0.5">
                    <Phone size={16} /> Contato via WhatsApp
                  </a>
                )}

                {atracao.link_hospedagem && (
                  <Link href={atracao.link_hospedagem}
                     className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                    <Bed size={16} className="text-slate-500" /> Onde Ficar (Hospedagem)
                  </Link>
                )}
              </div>
            </div>
          </Reveal>
        </aside>

      </section>

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