'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, ArrowRight, ArrowLeft, Loader2, Compass,
  TreePine, Waves, Mountain, ChevronDown, MapPin, Clock, Users
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type RotaTuristica = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_url: string;
  ordem: number;
};

// ── SISTEMA DE TEMAS ──
const themes = [
  {
    cor: '#00577C',
    corAccent: '#F9C400',
    bgDark: '#001f2e',
    label: 'Rota das Águas',
    icon: <Waves size={16} />,
    detalhes: { duracao: '4–6 horas', dificuldade: 'Moderada', grupo: 'Sem limite de pessoas' },
  },
  {
    cor: '#009640',
    corAccent: '#F9C400',
    bgDark: '#051a09',
    label: 'Rota da Mata',
    icon: <TreePine size={16} />,
    detalhes: { duracao: '6–8 horas', dificuldade: 'Difícil', grupo: 'Sem limite de pessoas' },
  },
  {
    cor: '#8b5e0a',
    corAccent: '#F9C400',
    bgDark: '#1a0e02',
    label: 'Rota da Serra',
    icon: <Mountain size={16} />,
    detalhes: { duracao: '3–5 horas', dificuldade: 'Fácil', grupo: 'Sem limite de pessoas' },
  },
];

const getTheme = (ordem: number) => themes[(ordem - 1) % themes.length];

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
// CARD DE ROTA
// ══════════════════════════════════════
function RotaCard({ rota, index }: { rota: RotaTuristica; index: number }) {
  const theme = getTheme(rota.ordem);
  const isPar = index % 2 === 0;
  const num = String(rota.ordem).padStart(2, '0');

  return (
    <article className="relative group">
      {index > 0 && (
        <div className="h-px w-full mb-0"
          style={{ background: `linear-gradient(to right, transparent, ${theme.cor}25, transparent)` }} />
      )}

      <div className={`relative flex flex-col ${isPar ? 'lg:flex-row' : 'lg:flex-row-reverse'} min-h-[85vh] overflow-hidden`}
        style={{ backgroundColor: theme.bgDark }}>

        {/* ── METADE IMAGEM (ERRO CORRIGIDO AQUI) ── */}
        <div className="relative w-full lg:w-[55%] h-[50vh] lg:h-auto overflow-hidden">
          <Image
            src={rota.imagem_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'}
            alt={rota.titulo}
            fill
            className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
          />

          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: isPar
                ? `linear-gradient(to right, transparent 50%, ${theme.bgDark} 100%)`
                : `linear-gradient(to left, transparent 50%, ${theme.bgDark} 100%)`,
            }} />
          <div className="absolute inset-0 pointer-events-none lg:hidden"
            style={{ background: `linear-gradient(to top, ${theme.bgDark} 0%, transparent 60%)` }} />

          <div className="absolute top-6 left-6 z-10 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{ backgroundColor: theme.corAccent }}>
            <span className={`${jakarta.className} text-xl font-black`} style={{ color: theme.bgDark }}>
              {num}
            </span>
          </div>

          <div className="absolute top-6 right-6 z-10 flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest"
            style={{
              backgroundColor: theme.cor + '20',
              borderColor: theme.cor + '50',
              color: theme.corAccent,
            }}>
            {theme.icon}
            {theme.label}
          </div>
        </div>

        {/* ── METADE TEXTO ── */}
        <div className={`relative z-10 w-full lg:w-[45%] flex flex-col justify-center
          px-8 py-16 lg:py-24
          ${isPar ? 'lg:pl-16 xl:pl-20 lg:pr-16' : 'lg:pr-16 xl:pr-20 lg:pl-16'}`}>

          <div className={`${jakarta.className} absolute top-1/2 -translate-y-1/2
            ${isPar ? '-right-4 lg:-right-6' : '-left-4 lg:-left-6'}
            text-[180px] md:text-[220px] font-black leading-none select-none pointer-events-none`}
            style={{ color: theme.cor, opacity: 0.08 }}
            aria-hidden="true">
            {num}
          </div>

          <Reveal anim={isPar ? 'left' : 'right'} delay={100}>
            <div className="flex items-center gap-4 mb-7">
              <span className="w-8 h-[2px] rounded-full" style={{ backgroundColor: theme.cor }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: theme.cor }}>
                Roteiro {num}
              </span>
            </div>

            <h2 className={`${jakarta.className} text-5xl md:text-6xl xl:text-7xl font-black text-white leading-[0.88] mb-6`}>
              {rota.titulo}
            </h2>

            <p className="text-white/50 text-base md:text-lg leading-relaxed mb-10 max-w-md font-medium">
              {rota.descricao_curta}
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { icon: <Clock size={12} />, valor: theme.detalhes.duracao },
                { icon: <MapPin size={12} />, valor: theme.detalhes.dificuldade },
                { icon: <Users size={12} />, valor: theme.detalhes.grupo },
              ].map((m, i) => (
                <span key={i}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border"
                  style={{
                    borderColor: theme.cor + '40',
                    backgroundColor: theme.cor + '12',
                    color: 'rgba(255,255,255,0.6)',
                  }}>
                  <span style={{ color: theme.corAccent }}>{m.icon}</span>
                  {m.valor}
                </span>
              ))}
            </div>

            <Link
              href={`/rotas/${rota.id}`}
              className="group/btn inline-flex items-center gap-3 self-start px-8 py-4 rounded-full
                font-black text-[10px] uppercase tracking-widest shadow-xl
                hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
              style={{ backgroundColor: theme.cor, color: theme.corAccent }}>
              Explorar esta rota
              <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </Reveal>
        </div>
      </div>
    </article>
  );
}

// ══════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════
export default function RotasPage() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [rotas, setRotas] = useState<RotaTuristica[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    async function fetchRotas() {
      const { data, error } = await supabase
        .from('rotas').select('*').eq('ativo', true).order('ordem', { ascending: true });
      if (data) setRotas(data);
      if (error) console.error('Erro ao buscar rotas:', error);
      setLoading(false);
    }
    fetchRotas();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setIsScrolled(y > 50);
      if (y < 80) setShowHeader(true);
      else if (y > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(y);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <main className={`${inter.className} text-white overflow-x-hidden min-h-screen`}
      style={{ backgroundColor: '#001f2e' }}>

      {/* ── HEADER FLUTUANTE ── */}
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
          HERO CINEMATOGRÁFICO
      ══════════════════════════════════════ */}
      <section className="relative h-screen flex flex-col items-start justify-end
        pb-20 md:pb-28 px-6 md:px-12 overflow-hidden"
        style={{ backgroundColor: '#002f40' }}>

        <div className="absolute inset-0 z-0 scale-110"
          style={{ transform: `translateY(${scrollY * 0.25}px) scale(1.1)` }}>
          <video
            src="/videorota.mp4"
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
        </div>

        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #001f2e 0%, #001f2ecc 30%, #001f2e55 60%, transparent 85%)' }} />
        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #001f2eaa 0%, transparent 65%)' }} />

        <div className="absolute left-6 md:left-12 top-[20%] bottom-[20%] w-px pointer-events-none z-10 hidden md:block"
          style={{ background: 'linear-gradient(to bottom, transparent, #F9C40045, transparent)' }} />

        <div className="relative z-10 max-w-[1400px] w-full mx-auto">
          <Reveal anim="up">

            <h1 className={`${jakarta.className} text-[clamp(4rem,11vw,9rem)] font-black text-white leading-[0.88] mb-6`}>
              Rotas<br />
              <span className="italic" style={{ color: '#F9C400' }}>Turísticas</span>
            </h1>

            <p className="text-white/50 text-base md:text-xl max-w-lg leading-relaxed mb-10">
              Percursos oficiais desenhados para que descubras a essência do Araguaia — rios, serras e florestas — ao teu próprio ritmo e com toda a segurança.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
            </div>
          </Reveal>
        </div>


        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <ChevronDown size={18} className="animate-bounce" style={{ color: 'rgba(249,196,0,0.35)' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════
          FAIXA TRICOLOR — 3 BIOMAS
      ══════════════════════════════════════ */}
      <div className="grid grid-cols-3">
        {[
          { cor: '#00577C', icon: <Waves size={18} />, label: 'Águas' },
          { cor: '#009640', icon: <TreePine size={18} />, label: 'Florestas' },
          { cor: '#8b5e0a', icon: <Mountain size={18} />, label: 'Serra' },
        ].map((item, i) => (
          <Reveal key={item.label} anim="up" delay={i * 60}>
            <div className="flex flex-col items-center justify-center gap-2 py-7 md:py-9"
              style={{ backgroundColor: item.cor }}>
              <div className="text-white opacity-70">{item.icon}</div>
              <p className={`${jakarta.className} text-[9px] md:text-[11px] font-black uppercase tracking-[0.25em] text-white opacity-60`}>
                {item.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* ══════════════════════════════════════
          INTRO EDITORIAL
      ══════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-6 md:px-12" style={{ backgroundColor: '#001f2e' }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-end">
            <Reveal anim="right" className="md:col-span-6">
              <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-[0.88]`}>
                Descubra e encante-se com a nossa terra.<br />
                
              </h2>
            </Reveal>
            <Reveal anim="left" delay={150} className="md:col-span-6">
              <p className="text-white/40 text-base md:text-lg leading-relaxed">
                Cada rota foi construída com base no conhecimento de guias nativos que conhecem cada pedra, cada som e cada história guardada por este território. Percursos que equilibram aventura, segurança e respeito pelo ecossistema.
              </p>
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-6">
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className={`${jakarta.className} text-3xl font-black`} style={{ color: '#F9C400' }}>3</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mt-0.5">Biomas distintos</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className={`${jakarta.className} text-3xl font-black`} style={{ color: '#009640' }}>100%</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mt-0.5">Com guias credenciados</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          LISTAGEM DE ROTAS
      ══════════════════════════════════════ */}
      <section id="rotas">
        {loading && (
          <div className="flex flex-col items-center justify-center py-40" style={{ backgroundColor: '#001f2e' }}>
            <Loader2 className="animate-spin w-12 h-12 mb-4" style={{ color: '#009640' }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Carregando roteiros...
            </p>
          </div>
        )}

        {!loading && rotas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 px-6 text-center"
            style={{ backgroundColor: '#001f2e' }}>
            <Compass size={64} style={{ color: 'rgba(255,255,255,0.05)' }} className="mb-6" />
            <h3 className={`${jakarta.className} text-3xl font-black mb-3`} style={{ color: 'rgba(255,255,255,0.2)' }}>
              Nenhuma rota cadastrada
            </h3>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.15)' }}>
              Volte em breve para novidades.
            </p>
          </div>
        )}

        {!loading && rotas.length > 0 && (
          <div>
            {rotas.map((rota, index) => (
              <RotaCard key={rota.id} rota={rota} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════ */}
      {!loading && rotas.length > 0 && (
        <section className="py-24 px-6 md:px-12" style={{ backgroundColor: '#001f2e' }}>
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Reveal anim="up" className="md:col-span-2">
                <div className="rounded-[2rem] p-10 md:p-14 h-full flex flex-col justify-between min-h-[300px]"
                  style={{ backgroundColor: '#00577C' }}>
                  <div>
                    <p className="font-black text-[9px] uppercase tracking-[0.3em] mb-3"
                      style={{ color: 'rgba(249,196,0,0.6)' }}>
                      Continuar a explorar
                    </p>
                    <h3 className={`${jakarta.className} text-4xl md:text-5xl font-black text-white leading-[0.9] mb-4`}>
                      Preferes um pacote<br />
                      <span className="italic" style={{ color: '#F9C400' }}>já organizado?</span>
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed max-w-md">
                      Roteiros com hospedagem, alimentação e guia incluídos. Só precisas de aparecer e viver.
                    </p>
                  </div>
                  <Link href="/pacotes"
                    className="mt-8 inline-flex items-center gap-3 self-start px-7 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-colors hover:-translate-y-0.5"
                    style={{ backgroundColor: '#F9C400', color: '#001f2e' }}>
                    Ver pacotes disponíveis <ArrowRight size={14} />
                  </Link>
                </div>
              </Reveal>

              <Reveal anim="up" delay={120}>
                <div className="rounded-[2rem] p-10 h-full flex flex-col justify-between min-h-[300px]"
                  style={{ backgroundColor: '#F9C400' }}>
                  <div>
                    <p className="font-black text-[9px] uppercase tracking-[0.3em] mb-3"
                      style={{ color: 'rgba(0,31,46,0.4)' }}>
                      Residente de SGA?
                    </p>
                    <h3 className={`${jakarta.className} text-3xl font-black leading-[0.9] mb-3`}
                      style={{ color: '#001f2e' }}>
                      Cartão<br />
                      <span className="italic">Residente</span>
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(0,31,46,0.5)' }}>
                      50% de desconto na entrada do parque para moradores. Registo simples e gratuito.
                    </p>
                  </div>
                  <Link href="/cadastro"
                    className="mt-6 inline-flex items-center gap-3 self-start px-7 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: '#001f2e', color: '#F9C400' }}>
                    Solicitar cartão <ArrowRight size={14} />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER MINIMAL DARK ── */}
      <footer className="py-10 px-6 md:px-12 border-t"
        style={{ backgroundColor: '#000f18', borderColor: 'rgba(0,87,124,0.15)' }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-14 mb-14">

            <div className="space-y-5">
              <div className="relative h-10 w-32">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain brightness-[100] invert opacity-25" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.15)' }}>
                São Geraldo do Araguaia<br />"Cidade Amada, seguindo em frente"
              </p>
            </div>

            <div className="space-y-4">
              <h5 className="font-black text-[9px] uppercase tracking-widest pb-3 border-b"
                style={{ color: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.06)' }}>
                Gestão Executiva
              </h5>
              <ul className="text-xs space-y-2 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
                <li>Prefeito:<br /><b className="text-white/40">Jefferson Douglas de Jesus Oliveira</b></li>
                <li>Vice-Prefeito:<br /><b className="text-white/40">Marcos Antônio Candido de Lucena</b></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h5 className="font-black text-[9px] uppercase tracking-widest pb-3 border-b"
                style={{ color: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.06)' }}>
                Turismo (SEMTUR)
              </h5>
              <ul className="text-xs space-y-2 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
                <li>Secretária:<br /><b className="text-white/40">Micheli Stephany de Souza</b></li>
                <li>Contato: <b className="text-white/40">(94) 98145-2067</b></li>
                <li>Email: <b className="text-white/40">setursaga@gmail.com</b></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h5 className="font-black text-[9px] uppercase tracking-widest pb-3 border-b"
                style={{ color: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.06)' }}>
                Equipe Técnica
              </h5>
              <ul className="text-xs space-y-2 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
                <li>• Adriana da Luz Lima</li>
                <li>• Carmelita Luz da Silva</li>
                <li>• Diego Silva Costa</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t text-center"
            style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] font-black uppercase tracking-[0.4em]"
              style={{ color: 'rgba(255,255,255,0.1)' }}>
              © 2026 Secretaria Municipal de Turismo — São Geraldo do Araguaia (PA)
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}