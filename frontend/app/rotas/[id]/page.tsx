'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { useParams, notFound } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, MapPin, Leaf, TreePine, Compass,
  Mountain, Waves, Sun, Wind, Camera, Users, Shield, Clock,
  ChevronDown, Menu, X, Loader2
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPOS (com as novas colunas) ──
type Rota = {
  id: string;
  titulo: string;
  descricao_curta: string;
  descricao_longa: string | null;
  imagem_url: string;
  ordem: number;
  ativo: boolean;
  criado_em: string;
  // Novas colunas
  duracao: string | null;
  dificuldade: string | null;
  grupo: string | null;
  guia: string | null;
  galeria: string[] | null;
  como_chegar: string | null;
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

// ── CORES BASEADAS NA ORDEM (mantido o sistema visual) ──
function getThemeByOrdem(ordem: number) {
  const themes = [
    { cor: '#00577C', corAccent: '#F9C400', bgDark: '#001f2e' },
    { cor: '#009640', corAccent: '#F9C400', bgDark: '#051a09' },
    { cor: '#8b5e0a', corAccent: '#F9C400', bgDark: '#1a0e02' },
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
  const [rotaAnterior, setRotaAnterior] = useState<Rota | null>(null);
  const [rotaProxima, setRotaProxima] = useState<Rota | null>(null);
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

      // Buscar anterior e próxima
      const [{ data: ant }, { data: prox }] = await Promise.all([
        supabase.from('rotas').select('id, titulo, imagem_url').eq('ativo', true).lt('ordem', data.ordem).order('ordem', { ascending: false }).limit(1).single(),
        supabase.from('rotas').select('id, titulo, imagem_url').eq('ativo', true).gt('ordem', data.ordem).order('ordem', { ascending: true }).limit(1).single(),
      ]);
      if (ant) setRotaAnterior(ant as Rota);
      if (prox) setRotaProxima(prox as Rota);
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

  // ── ESTADOS DE CARREGAMENTO / ERRO ──
  if (loading) return (
    <div className={`${inter.className} min-h-screen bg-[#021a0d] flex flex-col items-center justify-center gap-4`}>
      <Loader2 className="animate-spin text-[#009640] w-12 h-12" />
      <p className="text-white/30 font-black text-[10px] uppercase tracking-widest">Carregando rota...</p>
    </div>
  );

  if (notFound404 || !rota) return (
    <div className={`${inter.className} min-h-screen bg-[#021a0d] flex flex-col items-center justify-center gap-6 px-6`}>
      <Compass className="text-white/10 w-20 h-20" />
      <h1 className={`${jakarta.className} text-4xl font-black text-white text-center`}>Rota não encontrada</h1>
      <Link href="/rotas" className="inline-flex items-center gap-2 bg-[#F9C400] text-[#002f40] px-7 py-3.5 rounded-full font-black text-xs uppercase tracking-widest">
        <ArrowLeft size={14} /> Ver todas as rotas
      </Link>
    </div>
  );

  const theme = getThemeByOrdem(rota.ordem);
  const numOrdem = String(rota.ordem).padStart(2, '0');
  const descricaoLonga = rota.descricao_longa?.trim() || null;

  // Dados dinâmicos (com fallbacks)
  const duracao = rota.duracao || 'Não informada';
  const dificuldade = rota.dificuldade || 'Não informada';
  const grupo = rota.grupo || 'Sem limite';
  const guia = rota.guia || 'Recomendado';
  const galeria = rota.galeria && Array.isArray(rota.galeria) && rota.galeria.length > 0
    ? rota.galeria
    : [rota.imagem_url]; // fallback para a imagem principal
  const comoChegar = rota.como_chegar?.trim() || null;

  return (
    <main className={`${inter.className} bg-[${theme.bgDark}] text-white overflow-x-hidden`}
      style={{ backgroundColor: theme.bgDark }}>

      {/* ── HEADER PADRÃO DO SITE ── */}
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
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Roteiros</Link>
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
      <section className="relative h-screen flex flex-col items-start justify-end pb-20 md:pb-28 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 z-0 scale-110"
          style={{ transform: `translateY(${scrollY * 0.3}px) scale(1.1)` }}>
          <Image src={rota.imagem_url} alt={rota.titulo} fill className="object-cover" priority />
        </div>

        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${theme.bgDark} 0%, ${theme.bgDark}cc 25%, ${theme.bgDark}44 55%, transparent 80%)` }} />
        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: `linear-gradient(to right, ${theme.bgDark}99 0%, transparent 60%)` }} />

        <div className="absolute left-6 md:left-12 top-1/4 bottom-1/4 w-[1px] pointer-events-none z-10 hidden md:block"
          style={{ background: `linear-gradient(to bottom, transparent, ${theme.corAccent}50, transparent)` }} />

        <div className={`${jakarta.className} absolute right-8 md:right-12 top-1/2 -translate-y-1/2 text-[200px] md:text-[280px] font-black leading-none select-none pointer-events-none z-0`}
          style={{ color: theme.cor, opacity: 0.12 }} aria-hidden="true">
          {numOrdem}
        </div>

        <div className="relative z-10 max-w-[1400px] w-full mx-auto">
          <p className="font-black uppercase tracking-[0.35em] text-[9px] md:text-[10px] mb-5 flex items-center gap-3"
            style={{ color: theme.corAccent }}>
            <span className="w-8 h-[1px]" style={{ backgroundColor: theme.corAccent }} />
            Rota {numOrdem} · São Geraldo do Araguaia
          </p>

          <h1 className={`${jakarta.className} text-[clamp(3rem,9vw,7.5rem)] font-black text-white leading-[0.88] mb-6 max-w-3xl`}>
            {rota.titulo}
          </h1>

          <p className="text-white/55 text-base md:text-xl max-w-lg leading-relaxed mb-10">
            {rota.descricao_curta}
          </p>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold"
              style={{ borderColor: theme.cor + '50', backgroundColor: theme.cor + '15', color: 'rgba(255,255,255,0.7)' }}>
              <span style={{ color: theme.corAccent }}><Clock size={16} /></span>
              <span className="text-white/40 text-[9px] uppercase tracking-widest">Duração:</span>
              <span>{duracao}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold"
              style={{ borderColor: theme.cor + '50', backgroundColor: theme.cor + '15', color: 'rgba(255,255,255,0.7)' }}>
              <span style={{ color: theme.corAccent }}><Mountain size={16} /></span>
              <span className="text-white/40 text-[9px] uppercase tracking-widest">Dificuldade:</span>
              <span>{dificuldade}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <ChevronDown size={18} className="animate-bounce" style={{ color: theme.corAccent + '60' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════
          FAIXA DE DETALHES — 4 MÉTRICAS (DINÂMICAS)
      ══════════════════════════════════════ */}
      <section style={{ backgroundColor: theme.cor }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4">
            <div className="py-8 md:py-10 px-6 md:px-8 flex flex-col gap-2 border-r border-white/10">
              <div className="flex items-center gap-2" style={{ color: theme.corAccent }}>
                <Clock size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Duração</span>
              </div>
              <p className={`${jakarta.className} text-2xl md:text-3xl font-black text-white`}>{duracao}</p>
            </div>
            <div className="py-8 md:py-10 px-6 md:px-8 flex flex-col gap-2 border-r border-white/10">
              <div className="flex items-center gap-2" style={{ color: theme.corAccent }}>
                <Mountain size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Dificuldade</span>
              </div>
              <p className={`${jakarta.className} text-2xl md:text-3xl font-black text-white`}>{dificuldade}</p>
            </div>
            <div className="py-8 md:py-10 px-6 md:px-8 flex flex-col gap-2 border-r border-white/10">
              <div className="flex items-center gap-2" style={{ color: theme.corAccent }}>
                <Users size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Grupo</span>
              </div>
              <p className={`${jakarta.className} text-2xl md:text-3xl font-black text-white`}>{grupo}</p>
            </div>
            <div className="py-8 md:py-10 px-6 md:px-8 flex flex-col gap-2">
              <div className="flex items-center gap-2" style={{ color: theme.corAccent }}>
                <Shield size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Guia</span>
              </div>
              <p className={`${jakarta.className} text-2xl md:text-3xl font-black text-white`}>{guia}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          DESCRIÇÃO EDITORIAL (descricao_longa)
      ══════════════════════════════════════ */}
      <section className="py-24 md:py-36" style={{ backgroundColor: theme.bgDark }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20 items-start">

            <Reveal anim="right" className="md:col-span-4">
              <div className="sticky top-32">
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-8 h-[2px] rounded-full" style={{ backgroundColor: theme.cor }} />
                  <span className="font-black text-[9px] uppercase tracking-[0.3em]" style={{ color: theme.cor }}>
                    Sobre a rota
                  </span>
                </div>
                <p className={`${jakarta.className} text-[120px] md:text-[160px] font-black leading-none select-none`}
                  style={{ color: theme.cor, opacity: 0.15 }} aria-hidden="true">
                  {numOrdem}
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  {['Galeria', 'Como chegar', 'Reservar'].map((s, i) => (
                    <a key={s} href={`#${s.toLowerCase().replace(' ', '-')}`}
                      className="flex items-center gap-3 text-sm font-bold text-white/30 hover:text-white transition-colors group">
                      <span className="w-5 h-[1px] group-hover:w-8 transition-all" style={{ backgroundColor: theme.corAccent }} />
                      {s}
                    </a>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal anim="left" delay={150} className="md:col-span-8">
              <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black text-white leading-[0.9] mb-10`}>
                Uma jornada<br /><span className="italic" style={{ color: theme.cor }}>que transforma</span>
              </h2>

              <div className="space-y-6 text-white/55 text-lg leading-relaxed">
                {descricaoLonga ? (
                  descricaoLonga.split('\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))
                ) : (
                  <div className="italic text-white/30 border-l-2 pl-6" style={{ borderColor: theme.corAccent }}>
                    Esta rota ainda está a ser estudada pela nossa equipa de guias e conservacionistas. Em breve, mais detalhes serão disponibilizados. Agradecemos a compreensão.
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          GALERIA (array de imagens da Supabase)
      ══════════════════════════════════════ */}
      <section id="galeria" className="py-24 overflow-hidden" style={{ backgroundColor: theme.cor + '15', borderTop: `1px solid ${theme.cor}20` }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-12">
          <Reveal anim="up">
            <p className="font-black text-[9px] uppercase tracking-[0.35em] mb-4 flex items-center gap-3"
              style={{ color: theme.cor }}>
              <span className="w-6 h-[1px]" style={{ backgroundColor: theme.cor }} />
              Imagens da rota
            </p>
            <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-[0.88]`}>
              Galeria<br /><span className="italic" style={{ color: theme.corAccent }}>Visual</span>
            </h2>
          </Reveal>
        </div>

        <div className="flex gap-4 px-6 md:px-12 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
          {galeria.map((src, i) => (
            <Reveal key={i} anim="zoom" delay={i * 80} className="shrink-0 snap-center">
              <div className="group relative rounded-[2rem] overflow-hidden cursor-pointer"
                style={{ width: 'clamp(260px, 35vw, 480px)', height: 'clamp(320px, 45vw, 560px)' }}>
                <Image src={src} alt={`Galeria ${i + 1}`} fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(to top, ${theme.cor}cc, transparent)` }} />
                <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <span className="font-black text-[9px] uppercase tracking-widest text-white/70">
                    {String(i + 1).padStart(2, '0')} / {String(galeria.length).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          COMO CHEGAR + RESERVAR
      ══════════════════════════════════════ */}
      <section id="como-chegar" className="py-24" style={{ backgroundColor: theme.bgDark }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <Reveal anim="right">
              <div className="rounded-[2rem] border p-10 md:p-12 h-full"
                style={{ borderColor: theme.cor + '30', backgroundColor: theme.cor + '08' }}>
                <MapPin size={24} className="mb-6" style={{ color: theme.corAccent }} />
                <h3 className={`${jakarta.className} text-3xl font-black text-white mb-6`}>Como chegar</h3>
                <div className="space-y-5 text-white/50 text-sm leading-relaxed">
                  {comoChegar ? (
                    <div className="whitespace-pre-line">{comoChegar}</div>
                  ) : (
                    <p className="italic text-white/30">Instruções de acesso ainda não definidas para esta rota. Consulte a SEMTUR para mais informações.</p>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t" style={{ borderColor: theme.cor + '25' }}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: theme.cor }}>Contato SEMTUR</p>
                  <p className="text-white/60 text-sm font-bold">(94) 98145-2067 · setursaga@gmail.com</p>
                </div>
              </div>
            </Reveal>

            <Reveal anim="left" delay={150}>
              <div className="rounded-[2rem] p-10 md:p-12 h-full flex flex-col justify-between min-h-[360px]"
                style={{ backgroundColor: theme.cor }}>
                <div>
                  <Shield size={24} className="mb-6" style={{ color: theme.corAccent }} />
                  <h3 className={`${jakarta.className} text-3xl font-black text-white mb-4`} id="reservar">
                    Reserva segura<br />e garantida
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    Todas as reservas são confirmadas diretamente com a SEMTUR. Grupos escolares têm entrada gratuita com agendamento prévio.
                  </p>
                  <ul className="space-y-2 text-white/70 text-sm">
                    {['Guia local credenciado incluído', 'Equipamentos de segurança fornecidos', 'Seguro ambiental activo', 'Cancelamento gratuito até 48h antes'].map(item => (
                      <li key={item} className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.corAccent }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-3 mt-8">
                  <Link href="/passeios"
                    className="flex items-center justify-center gap-3 py-4 rounded-full font-black text-[10px] uppercase tracking-widest transition-colors"
                    style={{ backgroundColor: theme.corAccent, color: theme.bgDark }}>
                    Ver passeios disponíveis <ArrowRight size={14} />
                  </Link>
                  <a href="tel:+5594981452067"
                    className="flex items-center justify-center gap-3 py-4 rounded-full font-black text-[10px] uppercase tracking-widest border transition-colors border-white/20 text-white hover:bg-white/10">
                    Ligar para a SEMTUR
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          NAVEGAÇÃO ENTRE ROTAS
      ══════════════════════════════════════ */}
      {(rotaAnterior || rotaProxima) && (
        <section className="border-t py-16 md:py-20" style={{ backgroundColor: theme.bgDark, borderColor: theme.cor + '20' }}>
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <Reveal anim="fade">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-center mb-10" style={{ color: theme.cor }}>
                Outras rotas para explorar
              </p>
            </Reveal>
            <div className={`grid gap-5 ${rotaAnterior && rotaProxima ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'}`}>

              {rotaAnterior && (
                <Reveal anim="right">
                  <Link href={`/rotas/${rotaAnterior.id}`}
                    className="group relative h-[200px] rounded-[2rem] overflow-hidden flex items-end p-7 block"
                    style={{ backgroundColor: theme.cor }}>
                    <Image src={rotaAnterior.imagem_url} alt={rotaAnterior.titulo} fill
                      className="object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${theme.bgDark}dd, transparent)` }} />
                    <div className="relative z-10 text-white">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2 mb-1">
                        <ArrowLeft size={10} /> Rota anterior
                      </p>
                      <p className={`${jakarta.className} text-xl font-black`}>{rotaAnterior.titulo}</p>
                    </div>
                  </Link>
                </Reveal>
              )}

              {rotaProxima && (
                <Reveal anim="left" delay={rotaAnterior ? 120 : 0}>
                  <Link href={`/rotas/${rotaProxima.id}`}
                    className="group relative h-[200px] rounded-[2rem] overflow-hidden flex items-end p-7 block"
                    style={{ backgroundColor: theme.cor }}>
                    <Image src={rotaProxima.imagem_url} alt={rotaProxima.titulo} fill
                      className="object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${theme.bgDark}dd, transparent)` }} />
                    <div className="relative z-10 text-white text-right ml-auto">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30 flex items-center justify-end gap-2 mb-1">
                        Próxima rota <ArrowRight size={10} />
                      </p>
                      <p className={`${jakarta.className} text-xl font-black`}>{rotaProxima.titulo}</p>
                    </div>
                  </Link>
                </Reveal>
              )}
            </div>

            <Reveal anim="up" delay={200} className="mt-8 text-center">
              <Link href="/rotas"
                className="inline-flex items-center gap-3 border font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-full transition-colors"
                style={{ borderColor: theme.cor + '40', color: 'rgba(255,255,255,0.4)' }}
                onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'white'; }}
                onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)'; }}>
                Ver todas as rotas <ArrowRight size={13} />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── FOOTER MINIMAL ── */}
      <footer className="py-10 px-6 md:px-12 border-t" style={{ backgroundColor: theme.bgDark, borderColor: theme.cor + '15' }}>
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative h-9 w-28">
            <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain brightness-[100] invert opacity-30" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-center" style={{ color: 'rgba(255,255,255,0.15)' }}>
            © 2026 Secretaria Municipal de Turismo — São Geraldo do Araguaia (PA)
          </p>
          <Link href="/rotas"
            className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
            style={{ color: 'rgba(255,255,255,0.2)' }}
            onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)'; }}
            onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.2)'; }}>
            <ArrowLeft size={10} /> Todas as rotas
          </Link>
        </div>
      </footer>
    </main>
  );
}