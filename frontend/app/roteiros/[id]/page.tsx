'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, MapPin, Compass, Mountain, Camera, Users, Shield, Clock,
  ChevronDown, Menu, X, Loader2, ShieldCheck, AlertCircle, Info, Image as ImageIcon,
  Map as MapIcon
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// ── FONTES ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPOS ──
type Rota = {
  id: string;
  titulo: string;
  descricao_curta: string;
  descricao_longa: string | null;
  imagem_url: string;
  ordem: number;
  ativo: boolean;
  criado_em: string;
  duracao: string | null;
  dificuldade: string | null;
  grupo: string | null;
  guia: string | null;
  galeria: any;
  como_chegar: string | null;
  link_google_maps?: string | null;
  jornada_passos?: { titulo: string; descricao: string }[] | null;
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

// ── SISTEMA DE CORES BASEADO NA ORDEM ──
function getThemeByOrdem(ordem: number) {
  const themes = [
    { cor: '#00577C', bgLight: 'bg-[#00577C]/10', textLight: 'text-[#00577C]', borderLight: 'border-[#00577C]/10', corAccent: '#F9C400' },
    { cor: '#009640', bgLight: 'bg-[#009640]/10', textLight: 'text-[#009640]', borderLight: 'border-[#009640]/10', corAccent: '#F9C400' },
    { cor: '#8b5e0a', bgLight: 'bg-[#8b5e0a]/10', textLight: 'text-[#8b5e0a]', borderLight: 'border-[#8b5e0a]/10', corAccent: '#F9C400' },
  ];
  return themes[(ordem - 1) % themes.length] || themes[0];
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================
export default function RotaDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [rota, setRota] = useState<Rota | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound404, setNotFound404] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchRota() {
      const { data, error } = await supabase
        .from('rotas')
        .select('*')
        .eq('id', id)
        .eq('ativo', true)
        .single();
        
      if (error || !data) { setNotFound404(true); setLoading(false); return; }
      setRota(data);
      setLoading(false);
    }
    if (id) fetchRota();
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

  // ── NOVO MENU AGRUPADO (header padrão) ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'Roteiros', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Passeios', 'Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  // ── ESTADOS DE LOADING E ERRO ──
  if (loading) return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center gap-4`}>
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12" />
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Preparando Rota...</p>
    </div>
  );

  if (notFound404 || !rota) return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center text-center px-6 gap-6`}>
      <AlertCircle size={64} className="text-slate-300 mb-2" />
      <h1 className={`${jakarta.className} text-4xl font-black text-slate-800`}>Rota não encontrada</h1>
      <p className="text-slate-500 max-w-md">Não conseguimos localizar esta rota. O link pode estar incorreto ou a rota desativada.</p>
      <Link href="/roteiros" className="inline-flex items-center gap-2 bg-[#00577C] text-white px-7 py-3.5 rounded-full font-black text-xs uppercase tracking-widest mt-4 shadow-md hover:bg-[#004a6b] transition-colors">
        <ArrowLeft size={14} /> Voltar para Roteiros
      </Link>
    </div>
  );

  const theme = getThemeByOrdem(rota.ordem);
  const numOrdem = String(rota.ordem).padStart(2, '0');
  
  const duracao = rota.duracao || 'Não informada';
  const dificuldade = rota.dificuldade || 'Não informada';
  const grupo = rota.grupo || 'Sem limite';
  const guia = rota.guia || 'Recomendado';
  const comoChegar = rota.como_chegar?.trim() || null;
  const descricaoLonga = rota.descricao_longa?.trim() || null;
  const genericImage = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09';
  
  let galeriaImagens = parseGaleria(rota.galeria).filter(Boolean);
  if (galeriaImagens.length === 0 && rota.imagem_url) {
    galeriaImagens = [rota.imagem_url];
  }

  return (
    <main className={`${inter.className} text-slate-900 overflow-x-hidden min-h-screen bg-[#FDFCF7] flex flex-col`}>

      {/* ── HEADER PADRÃO COM DROPDOWN ── */}
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
          HERO — IMERSIVO & CLEAN
      ══════════════════════════════════════ */}
      <section className="relative h-[65vh] md:h-[75vh] min-h-[450px] w-full bg-[#002f40] mt-[72px] md:mt-[80px]">
        <Image
          src={rota.imagem_url || genericImage}
          alt={`Capa da ${rota.titulo}`}
          fill
          className="object-cover opacity-85"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
        
        {/* Botão Voltar - agora para /roteiros */}
        <div className="absolute top-6 left-6 md:left-12 z-20">
          <Link href="/roteiros" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
            <ArrowLeft size={14} /> Voltar para Roteiros
          </Link>
        </div>

        {/* Título Centralizado sobre a Imagem */}
        <div className="absolute inset-0 flex flex-col justify-end pb-24 md:pb-32 px-6 md:px-12 z-10 max-w-[1400px] mx-auto w-full">
          <Reveal anim="up">
            <div className="flex items-center gap-3 mb-4">
              
            </div>
            <h1 className={`${jakarta.className} text-[clamp(3.5rem,7vw,6.5rem)] font-black text-white leading-[1.05] drop-shadow-2xl mb-4 max-w-full`}>
              {rota.titulo}
            </h1>
            
          </Reveal>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <ChevronDown size={24} className="animate-bounce text-white/50" />
        </div>
      </section>

      {/* ══════════════════════════════════════
          CARDS FLUTUANTES (MÉTRICAS DA ROTA)
      ══════════════════════════════════════ */}
      {/* ══════════════════════════════════════
          FAIXA UNIFICADA DE MÉTRICAS (FULL WIDTH)
      ══════════════════════════════════════ */}
      <section className="relative z-20 w-full border-y border-slate-200/50 mb-16"
               style={{ background: 'linear-gradient(to right, #EAF1F4 0%, #EBF5ED 50%, #FFFBEA 100%)' }}>
        <div className="max-w-[1400px] mx-auto px-6">
          <Reveal anim="up">
            <div className="py-10 md:py-12 grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6 lg:gap-0 lg:divide-x divide-slate-300/60">
              
              {[
                { label: 'Duração', icon: <Clock size={22} className="text-[#00577C]" />, valor: duracao },
                { label: 'Dificuldade', icon: <Mountain size={22} className="text-[#009640]" />, valor: dificuldade },
                { label: 'Grupo', icon: <Users size={22} className="text-[#F9C400]" />, valor: grupo },
                { label: 'Guia Local', icon: <Shield size={22} className="text-[#002f40]" />, valor: guia },
              ].map((item, i) => (
                <div key={item.label} className={`flex flex-col gap-2 ${i !== 0 ? 'lg:pl-10' : ''} ${i !== 3 ? 'lg:pr-10' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {item.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                  </div>
                  <p className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-800 leading-tight`}>
                    {item.valor}
                  </p>
                </div>
              ))}
              
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CONTEÚDO PRINCIPAL (DESCRIÇÃO LADO A LADO COM RESERVA E MAPA)
      ══════════════════════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-6 w-full mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
          
          {/* Coluna Esquerda: Texto Descritivo e A Sua Jornada */}
          <Reveal anim="up" className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 flex flex-col gap-8 h-full">
              
              {/* Título e Texto Principal */}
              <div>
                <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 leading-tight flex items-center gap-3 mb-8`}>
                  <Compass size={28} className={theme.textLight} /> Sobre a Rota
                </h2>

                <div className="prose prose-slate max-w-none text-slate-600 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                  {descricaoLonga ? (
                    descricaoLonga.split('\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))
                  ) : (
                    <div className={`italic text-slate-400 border-l-4 pl-6 py-2`} style={{ borderColor: theme.cor }}>
                      Esta rota ainda está a ser estudada pela nossa equipa de guias e conservacionistas. Em breve, mais detalhes serão disponibilizados.
                    </div>
                  )}
                </div>
              </div>

              {/* ── LINHA DO TEMPO: A SUA JORNADA (DINÂMICA) ── */}
              {rota.jornada_passos && rota.jornada_passos.length > 0 && (
                <div className="mt-8 pt-10 border-t border-slate-100">
                  <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 mb-8 flex items-center gap-3`}>
                    <MapPin size={24} className={theme.textLight} /> A sua Jornada
                  </h3>

                  <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
                    {rota.jornada_passos.map((passo, index) => (
                      <div key={index} className="relative group">
                        {/* Bolinha do percurso */}
                        <div 
                          className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125" 
                          style={{ backgroundColor: index === 0 || index === rota.jornada_passos!.length - 1 ? theme.corAccent : theme.cor }}
                        />
                        <p className={`${jakarta.className} font-black text-slate-800 mb-2`}>
                          {passo.titulo}
                        </p>
                        <p className="text-slate-500 font-medium leading-relaxed max-w-lg">
                          {passo.descricao}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </Reveal>

          {/* Coluna Direita: Sidebar (Reserva + Como Chegar + Google Maps) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            
            {/* Box 1: Reserva & Segurança */}
            <Reveal anim="left" delay={150}>
              <div className="rounded-[2.5rem] p-8 md:p-10 shadow-lg border flex flex-col gap-6"
                style={{ backgroundColor: theme.cor, borderColor: theme.cor }}>
                <div className="text-white flex items-center gap-3 mb-2">
                  <ShieldCheck size={28} style={{ color: theme.corAccent }} />
                  <h3 className={`${jakarta.className} text-2xl font-black`}>Aventura Segura</h3>
                </div>
                
                <p className="text-white/80 text-sm leading-relaxed font-medium">
                  Recomendamos que todo o percurso seja feito com o acompanhamento de Agências parceiras e Guias credenciados locais.
                </p>

                <ul className="space-y-3 text-sm text-white/90 font-medium my-2">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: theme.corAccent }} />
                    Garantia de segurança no percurso
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: theme.corAccent }} />
                    Conhecimento profundo da fauna e flora
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: theme.corAccent }} />
                    Apoio à economia da comunidade local
                  </li>
                </ul>

                <Link href="/agencias"
                  className="mt-2 w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:-translate-y-0.5 transition-all"
                  style={{ backgroundColor: theme.corAccent, color: '#002f40' }}>
                  Ver Agências Parceiras <ArrowRight size={16} />
                </Link>
              </div>
            </Reveal>

            {/* Box 2: Como Chegar & Mapa */}
            <Reveal anim="left" delay={250}>
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 flex flex-col gap-5">
                <div className={`flex items-center gap-3 mb-2 ${theme.textLight}`}>
                  <MapPin size={24} />
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-800`}>Como Chegar</h3>
                </div>
                
                

                {/* ── BOTÃO VISUAL DO GOOGLE MAPS ── */}
                {rota.link_google_maps && (
                  <a href={rota.link_google_maps} target="_blank" rel="noopener noreferrer" 
                     className="relative block w-full h-32 rounded-2xl overflow-hidden group border border-slate-200 mt-2 shadow-sm">
                    <Image src="https://images.unsplash.com/photo-1524661135-423995f22d0b" alt="Mapa" fill className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-white text-slate-800 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 group-hover:-translate-y-1 transition-transform">
                        <MapIcon size={14} className={theme.textLight} /> Ponto de Partida
                      </span>
                    </div>
                  </a>
                )}

                <div className="pt-6 border-t border-slate-100 mt-2">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-slate-400">Informações SEMTUR</p>
                  <p className="text-slate-600 text-sm font-bold">(94) 98145-2067</p>
                </div>
              </div>
            </Reveal>

          </aside>

        </div>
      </section>

      {/* ══════════════════════════════════════
          GALERIA HORIZONTAL (Se houver fotos)
      ══════════════════════════════════════ */}
      {galeriaImagens.length > 0 && (
        <section className="max-w-[1400px] mx-auto w-full px-6 mb-24">
          <Reveal anim="up">
            <h3 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-8 flex items-center gap-3 border-b border-slate-200 pb-6`}>
              <ImageIcon size={32} className={theme.textLight} /> Galeria de Imagens
            </h3>
            
            <div className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-6 hide-scrollbar">
              {galeriaImagens.map((imgUrl, i) => (
                <div key={i} className="relative shrink-0 snap-center rounded-[2.5rem] overflow-hidden w-[280px] h-[350px] md:w-[400px] md:h-[500px] lg:w-[450px] lg:h-[550px] group shadow-sm bg-slate-100">
                  <Image src={imgUrl || genericImage} alt={`Foto ${i + 1} da Rota ${rota.titulo}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
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
                      © 2026 Secretaria Municipal de Turismo - SGA
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