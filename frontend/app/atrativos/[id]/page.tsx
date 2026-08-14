'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, MapPin, Compass, Camera, Shield, ChevronDown, Menu, X, Loader2,
  Map, Bed, Image as ImageIcon, ShieldCheck, Ticket, AlertCircle, Mountain, Waves, Map as MapIcon, ArrowRight
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
  instagram?: string;
  link_google_maps?: string;
  link_hospedagem?: string;
  galeria?: any;
};

type PontoInteresse = {
  id: string;
  titulo: string;
  tipo: string;
  imagem_url: string;
  atracao_destino_id?: string;
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

// ── ÍCONE PERSONALIZADO DO INSTAGRAM (SVG inline) ──
const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

// ── ÍCONE PERSONALIZADO DO WHATSAPP (SVG inline) ──
const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/>
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>
  </svg>
);

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

export default function AtracaoDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [atracao, setAtracao] = useState<Atracao | null>(null);
  const [pontos, setPontos] = useState<PontoInteresse[]>([]); 
  const [loading, setLoading] = useState(true);
  const [notFound404, setNotFound404] = useState(false);
  
  const [scrollY, setScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ── NOVO MENU AGRUPADO ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'Roteiros', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Passeios', 'Eventos', 'Comunidades', 'Aldeias'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      const { data: atracaoData, error: atracaoError } = await supabase
        .from('atracoes').select('*').eq('id', id).single();
      
      if (atracaoError || !atracaoData) { 
        setNotFound404(true); 
        setLoading(false); 
        return; 
      }
      
      setAtracao(atracaoData as Atracao);

      const { data: pontosData } = await supabase
        .from('atracao_pontos').select('*').eq('atracao_id', id);
        
      if (pontosData) setPontos(pontosData as PontoInteresse[]);

      setLoading(false);
    }
    fetchData();
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

  // Função para formatar o link do Instagram
  const formatInstagramUrl = (instagram: string) => {
    let username = instagram.trim();
    if (username.startsWith('@')) {
      username = username.substring(1);
    }
    if (username.startsWith('http://') || username.startsWith('https://')) {
      return username;
    }
    return `https://instagram.com/${username}`;
  };

  if (loading) return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center gap-4`}>
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12" />
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Preparando destino...</p>
    </div>
  );

  if (notFound404 || !atracao) return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center text-center px-6 gap-6`}>
      <AlertCircle size={64} className="text-slate-300 mb-2" />
      <h1 className={`${jakarta.className} text-4xl font-black text-slate-800`}>Atrativo não encontrado</h1>
      <p className="text-slate-500 max-w-md">Não conseguimos localizar este ponto turístico. Ele pode estar indisponível ou o link está incorreto.</p>
      <Link href="/atrativos" className="inline-flex items-center gap-2 bg-[#00577C] text-white px-7 py-3.5 rounded-full font-black text-xs uppercase tracking-widest mt-4 shadow-md hover:bg-[#004a6b] transition-colors">
        <ArrowLeft size={14} /> Voltar para Atrativos
      </Link>
    </div>
  );

  const fotosGaleria = parseGaleria(atracao.galeria);

  return (
    <main className={`${inter.className} text-slate-900 overflow-x-hidden bg-[#FDFCF7] flex flex-col min-h-screen`}>

      {/* ── NOVO HEADER EDITORIAL (CENTRALIZADO) ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${scrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
          
          <div className="flex-1">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center justify-center gap-12">
            {menuGroups.map((group) => (
              <div key={group.label} className="relative group py-2">
                <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-[#00577C] transition-colors`}>
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
            <Link href="/cadastro" className={`hidden lg:inline-flex ${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
              Residente
            </Link>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
          <Link href="/atrativos" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
            <ArrowLeft size={14} /> Voltar para Atrativos
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CONTEÚDO PRINCIPAL (GRID 12 COLUNAS)
      ══════════════════════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full relative z-20 -mt-20 md:-mt-24 mb-16">
        
        {/* COLUNA ESQUERDA (TÍTULO E DESCRIÇÃO) */}
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

            <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1]`}>
              {atracao.nome}
            </h1>

            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-base md:text-lg whitespace-pre-wrap mt-4">
              {atracao.descricao || 'Detalhes e informações sobre esta atração em breve.'}
            </div>
          </div>
        </Reveal>

        {/* COLUNA DIREITA (SIDEBAR) */}
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
                    <WhatsAppIcon size={16} /> Contato via WhatsApp
                  </a>
                )}

                {atracao.instagram && (
                  <a href={formatInstagramUrl(atracao.instagram)} target="_blank" rel="noopener noreferrer"
                     className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 transition-all hover:-translate-y-0.5">
                    <InstagramIcon size={16} /> Instagram
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

      {/* ══════════════════════════════════════
          SEÇÃO DE LARGURA TOTAL: O QUE ENCONTRAR (DIRECIONA PARA A ATRAÇÃO REAL)
      ══════════════════════════════════════ */}
      {pontos.length > 0 && (
        <section className="max-w-[1400px] mx-auto w-full px-6 mb-16">
          <Reveal anim="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-slate-200 pb-6">
              <div>
                <h3 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-2 flex items-center gap-3`}>
                  <MapIcon size={32} className="text-[#009640]" /> O que você encontra aqui
                </h3>
                <p className="text-slate-500 text-sm md:text-base">Este destino abriga múltiplos pontos de interesse para você explorar.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pontos.map((ponto) => {
                const linkDestino = ponto.atracao_destino_id ? `/atrativos/${ponto.atracao_destino_id}` : `/atrativos/${ponto.id}`;

                return (
                  <Link href={linkDestino} key={ponto.id} className="relative h-[380px] rounded-[2.5rem] overflow-hidden group shadow-md border border-slate-100 block">
                    <Image 
                      src={ponto.imagem_url || atracao.imagem_url} 
                      alt={ponto.titulo} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/30 to-transparent" />
                    
                    <div className="absolute top-6 left-6 z-10">
                       <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-sm">
                          {ponto.tipo}
                       </span>
                    </div>

                    <div className="absolute bottom-8 left-8 right-8 z-10 flex flex-col gap-3">
                      <h4 className={`${jakarta.className} text-white text-2xl md:text-3xl font-black leading-tight drop-shadow-md`}>
                        {ponto.titulo}
                      </h4>
                      <div className="w-12 h-1 bg-[#F9C400] rounded-full transform origin-left group-hover:scale-x-[2.5] transition-transform duration-500"></div>
                      
                      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F9C400] mt-1 group-hover:translate-x-2 transition-transform duration-300">
                        Conhecer atrativo <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
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
              <ImageIcon size={32} className="text-[#F9C400]" /> Galeria de Fotos
            </h3>
            
            <div className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-6 hide-scrollbar">
              {fotosGaleria.map((imgUrl, i) => (
                <div key={i} className="relative shrink-0 snap-center rounded-[2.5rem] overflow-hidden w-[280px] h-[350px] md:w-[400px] md:h-[500px] lg:w-[450px] lg:h-[550px] group shadow-sm bg-slate-100">
                  <Image src={imgUrl} alt={`Galeria ${atracao.nome} ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
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