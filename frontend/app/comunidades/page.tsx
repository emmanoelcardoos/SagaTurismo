'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, ArrowRight, Loader2, Compass,
  ChevronDown, Users, ShieldCheck
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGEM ──
type Comunidade = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_url: string;
  ordem?: number;
};

// ── TEMAS (cores suaves para fundo dos cards) ──
const themes = [
  { cor: '#8b5e0a', corAccent: '#F9C400', bgLight: '#FDFBF7' },
  { cor: '#00577C', corAccent: '#F9C400', bgLight: '#F5F9FC' },
  { cor: '#009640', corAccent: '#F9C400', bgLight: '#F4F9F5' },
];

const getTheme = (index: number) => themes[index % themes.length];

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
// CARD FULLSCREEN – IMAGEM NÍTIDA
// ══════════════════════════════════════
function ComunidadeCard({ comunidade, index }: { comunidade: Comunidade; index: number }) {
  const theme = getTheme(index);
  const isPar = index % 2 === 0;

  return (
    <article className="relative w-full min-h-screen flex flex-col lg:flex-row"
      style={{ backgroundColor: theme.bgLight }}>
      {/* ── METADE IMAGEM (sem gradientes) ── */}
      <div className={`relative w-full h-[50vh] lg:h-screen lg:w-1/2 overflow-hidden`}>
        <Image
          src={comunidade.imagem_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'}
          alt={comunidade.titulo}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={index === 0}
        />
      </div>

      {/* ── METADE TEXTO ── */}
      <div className={`relative w-full lg:w-1/2 flex flex-col justify-center px-8 py-16 lg:px-20 lg:py-24 ${!isPar ? 'lg:order-first' : ''}`}>
        {/* Número decorativo discreto */}
        <div className={`${jakarta.className} absolute top-8 right-8 lg:top-12 lg:right-12 text-[120px] md:text-[160px] font-black leading-none select-none pointer-events-none`}
          style={{ color: theme.cor, opacity: 0.05 }}
          aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </div>

        <Reveal anim={isPar ? 'left' : 'right'} delay={200}>
          <div className="flex items-center gap-3 mb-8 text-sm font-bold uppercase tracking-[0.25em]"
            style={{ color: theme.cor }}>
            <Users size={22} strokeWidth={2.5} />
            <span>Comunidade {String(index + 1).padStart(2, '0')}</span>
          </div>

          <h2 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-slate-800 leading-[0.95] mb-8`}>
            {comunidade.titulo}
          </h2>

          <blockquote className="border-l-[4px] pl-7 mb-10 max-w-xl"
            style={{ borderColor: theme.corAccent }}>
            <p className="text-slate-500 text-lg md:text-xl leading-relaxed font-medium italic">
              “{comunidade.descricao_curta}”
            </p>
          </blockquote>

          <Link
            href={`/comunidades/${comunidade.id}`}
            className="group/btn inline-flex items-center gap-3 self-start px-8 py-4 rounded-full
              font-black text-xs uppercase tracking-widest shadow-lg
              hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            style={{ backgroundColor: theme.cor, color: '#fff' }}>
            <span>Conhecer a comunidade</span>
            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </Reveal>
      </div>
    </article>
  );
}

// ══════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════
export default function ComunidadesPage() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.log("Autoplay bloqueado pelo navegador, poster em uso.", err));
    }
  }, []);

  useEffect(() => {
    async function fetchComunidades() {
      const { data, error } = await supabase
        .from('comunidades')
        .select('*')
        .order('ordem', { ascending: true });
      if (data) setComunidades(data);
      if (error) console.error('Erro ao buscar comunidades:', error);
      setLoading(false);
    }
    fetchComunidades();
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
    <main className={`${inter.className} text-slate-800 overflow-x-hidden bg-[#FDFBF7]`}>
      {/* ── HEADER FLUTUANTE ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
              <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Rotas','Passeios', 'Aldeias','Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
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
      <section className="relative h-[88vh] flex flex-col items-start justify-end pb-20 md:pb-28 overflow-hidden bg-[#002f40]">
        <div className="absolute inset-0 z-0 scale-110"
          style={{ transform: `translateY(${scrollY * 0.25}px) scale(1.1)` }}>
          <video
            ref={videoRef}
            src="/comunidades.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/logop.png"
            className="absolute inset-0 w-full h-full object-cover opacity-100"
          />
        </div>

        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #001f2e 0%, #001f2ecc 25%, #001f2e55 55%, transparent 85%)' }} />
        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #001f2eaa 0%, transparent 65%)' }} />

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6">
          <Reveal anim="up">
            <h1 className={`${jakarta.className} text-[clamp(3rem,11vw,9rem)] font-black text-white leading-[0.88] mb-9`}>
              Nossas<br />
              <span className="italic" style={{ color: '#F9C400' }}>Comunidades</span>
            </h1>
          </Reveal>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <ChevronDown size={18} className="animate-bounce" style={{ color: 'rgba(249,196,0,0.4)' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════
          LISTAGEM FULLSCREEN
      ══════════════════════════════════════ */}
      <section id="comunidades" className="relative">
        {loading && (
          <div className="flex flex-col items-center justify-center py-40 bg-[#FDFBF7]">
            <Loader2 className="animate-spin w-12 h-12 mb-4 text-[#F9C400]" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              Viajando até as comunidades...
            </p>
          </div>
        )}

        {!loading && comunidades.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 px-6 text-center bg-[#FDFBF7]">
            <Compass size={64} className="text-slate-200 mb-6" />
            <h3 className={`${jakarta.className} text-3xl font-black text-slate-300 mb-3`}>
              Nenhuma comunidade cadastrada
            </h3>
          </div>
        )}

        {!loading && comunidades.length > 0 && (
          <div>
            {comunidades.map((comunidade, index) => (
              <ComunidadeCard key={comunidade.id} comunidade={comunidade} index={index} />
            ))}
          </div>
        )}
      </section>

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