'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, ReactNode } from 'react';
import {
  Menu, X, ArrowRight, Loader2, Compass,
  ChevronDown, MapPin, Camera, Ticket, ShieldCheck,
  Mountain, Waves, Clock, Users, Phone, Mail
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGEM ──
type RotaTuristica = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_url: string;
  unidade?: string; // 'PESAM' ou 'APA'
  duracao?: string;
  dificuldade?: string;
  grupo?: string;
};

// ── SISTEMA DE UNIDADES DE CONSERVAÇÃO ──
const unidadesConfig: Record<string, any> = {
  'PESAM': { 
    cor: '#009640', bgLight: 'bg-[#009640]/10', textLight: 'text-[#009640]', borderLight: 'border-[#009640]/20', 
    icon: <Mountain size={28} />, sigla: 'PESAM', nome: 'Parque Estadual Serra dos Martírios/Andorinhas' 
  },
  'APA': { 
    cor: '#00577C', bgLight: 'bg-[#00577C]/10', textLight: 'text-[#00577C]', borderLight: 'border-[#00577C]/20', 
    icon: <Waves size={28} />, sigla: 'APA', nome: 'Área de Proteção Ambiental Araguaia' 
  },
};

// ── MOTOR DE SCROLL ──
function useScrollAnimation(threshold = 0.08) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); }
    }, { threshold });
    observer.observe(ref);
    return () => { if (ref) observer.unobserve(ref); };
  }, [ref, threshold]);
  return { ref: setRef, isVisible };
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
// CARD DE ROTA (DESIGN SOFT & EDITORIAL)
// ══════════════════════════════════════
function RotaCard({ rota, index }: { rota: RotaTuristica; index: number }) {
  const isPar = index % 2 === 0;
  
  const siglaUnidade = rota.unidade?.toUpperCase().includes('APA') ? 'APA' : 'PESAM';
  const theme = unidadesConfig[siglaUnidade];

  const duracao = rota.duracao || 'Não informada';
  const dificuldade = rota.dificuldade || 'Não informada';
  const grupo = rota.grupo || 'Sem limite';

  return (
    <Reveal anim="up" delay={index * 50}>
      <article className={`bg-white rounded-[3rem] border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-2xl transition-all duration-500 p-4 lg:p-6 flex flex-col ${isPar ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 overflow-hidden group mb-12`}>

        {/* ── IMAGEM PREMIUM ── */}
        <div className="relative w-full h-[350px] lg:h-auto lg:min-h-[480px] lg:w-[50%] rounded-[2.5rem] overflow-hidden bg-slate-100 shrink-0">
          <Image
            src={rota.imagem_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'}
            alt={rota.titulo}
            fill
            className="object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-700" />

          {/* Etiqueta Temática */}
          <div className={`absolute top-6 left-6 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-sm border border-slate-100 ${theme.textLight}`}>
            {theme.icon}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{theme.sigla}</span>
          </div>
        </div>

        {/* ── TEXTO E INFORMAÇÕES ── */}
        <div className="flex-1 py-4 lg:py-12 px-4 lg:px-8 flex flex-col justify-center">
          <h2 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6`}>
            {rota.titulo}
          </h2>

          <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-10 font-medium">
            {rota.descricao_curta}
          </p>

          {/* Tags Refinadas */}
          <div className="flex flex-wrap gap-3 mb-12">
            {[
              { icon: <Clock size={16} />, valor: duracao },
              { icon: <MapPin size={16} />, valor: dificuldade },
              { icon: <Users size={16} />, valor: grupo },
            ].map((m, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
                <span className={theme.textLight}>{m.icon}</span>
                {m.valor}
              </span>
            ))}
          </div>

          <div className="mt-auto border-t border-slate-100 pt-8 flex">
            <Link
              href={`/rotas/${rota.id}`}
              className="group/btn inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-[#00577C]/20 bg-[#00577C] text-white hover:bg-[#004a6b] transition-all duration-300 hover:-translate-y-1"
            >
              Explorar esta rota
              <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </article>
    </Reveal>
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

  useEffect(() => {
    async function fetchRotas() {
      const { data, error } = await supabase
        .from('rotas')
        .select('*')
        .order('ordem', { ascending: true, nullsFirst: false });

      if (data) setRotas(data as RotaTuristica[]);
      if (error) console.error('Erro ao buscar rotas:', error);
      setLoading(false);
    }
    fetchRotas();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 50);
      if (y < 80) setShowHeader(true);
      else if (y > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(y);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // ── MENU DO HEADER (com "Roteiros" em vez de "Rotas") ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'Roteiros', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: [ 'Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  return (
    <main className={`${inter.className} text-slate-900 overflow-x-hidden min-h-screen bg-[#FDFCF7]`}>

      {/* ── HEADER EDITORIAL (CENTRALIZADO & DROPDOWN HORIZONTAL) ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}>
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
          HERO EDITORIAL SOFT (COM VÍDEO)
      ══════════════════════════════════════ */}
      <section className="relative pt-28 md:pt-36 px-4 sm:px-6 max-w-[1400px] mx-auto w-full">
        <Reveal anim="zoom">
          <div className="relative w-full h-[40vh] md:h-[60vh] min-h-[400px] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-[4px] border-white bg-slate-100 group">
            <video
              src="/videorota.mp4"
              autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3000ms] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F9C400] mb-4 drop-shadow-md">
                Explore a Natureza
              </p>
              <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight drop-shadow-lg`}>
                Jornadas <br />
                <span className="italic text-[#F9C400]">Memoráveis.</span>
              </h1>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════
          FAIXA UNIFICADA (PESAM E APA - FLUTUANTE)
      ══════════════════════════════════════ */}
      <section className="relative z-20 w-full px-6 -mt-16 md:-mt-24 mb-24 max-w-[1200px] mx-auto">
        <Reveal anim="up">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-xl border border-slate-100 p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-6 md:gap-0 md:divide-x divide-slate-200">
            {Object.values(unidadesConfig).map((item, i) => (
              <div key={item.sigla} className={`flex items-center justify-start md:justify-center gap-6 ${i === 1 ? 'md:pl-12 lg:pl-16' : 'md:pr-12 lg:pr-16'}`}>
                <div className={`w-16 h-16 shrink-0 rounded-[1.2rem] flex items-center justify-center border ${item.borderLight} ${item.bgLight} ${item.textLight}`}>
                  {item.icon}
                </div>
                <div className="text-left max-w-[250px]">
                  <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 leading-tight mb-1`}>
                    {item.sigla}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed">
                    {item.nome}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════
          LISTAGEM DE ROTAS
      ══════════════════════════════════════ */}
      <section id="rotas" className="pb-24 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <Loader2 className="animate-spin w-12 h-12 mb-4 text-[#00577C]" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                A preparar os roteiros...
              </p>
            </div>
          )}

          {!loading && rotas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <Compass size={64} className="text-slate-200 mb-6" />
              <h3 className={`${jakarta.className} text-3xl font-black mb-3 text-slate-800`}>
                Novos roteiros em breve
              </h3>
              <p className="text-sm font-medium text-slate-500">
                Estamos a desenvolver novas jornadas para si. Volte em breve.
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
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA FINAL (INTEGRADO & SOFISTICADO)
      ══════════════════════════════════════ */}
      {!loading && rotas.length > 0 && (
        <section className="py-24 px-6 md:px-12 border-t border-slate-200 bg-[#FDFCF7]">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              
              <Reveal anim="up" className="md:col-span-2">
                <div className="rounded-[3rem] p-10 md:p-14 lg:p-16 h-full flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-[#00577C] to-[#003d57]">
                  <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F9C400] mb-4">Experiências Guiadas</p>
                    <h3 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-6`}>
                      Procuras um roteiro <br />
                      <span className="italic text-[#F9C400]">já planeado?</span>
                    </h3>
                    <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-lg font-medium mb-10">
                      Roteiros com guias locais credenciados. Apenas precisas de aparecer, relaxar e conectar-te com a natureza.
                    </p>
                    <Link href="/agencias"
                      className="inline-flex items-center gap-3 px-8 py-4.5 rounded-full font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 shadow-xl bg-[#F9C400] text-[#002f40] hover:bg-[#e5b500]">
                      Consultar Agências <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </Reveal>

              <Reveal anim="up" delay={150}>
                <div className="rounded-[3rem] p-10 md:p-14 h-full flex flex-col justify-center bg-gradient-to-br from-[#F9C400] to-[#e5b500] shadow-lg">
                  <ShieldCheck size={40} className="text-[#002f40] mb-8" />
                  <h3 className={`${jakarta.className} text-4xl font-black text-[#002f40] leading-[1.05] tracking-tight mb-4`}>
                    Cartão<br />
                    <span className="italic">Residente</span>
                  </h3>
                  <p className="text-[#002f40]/80 text-base leading-relaxed font-medium mb-10">
                    50% de desconto na entrada de atrações parceiras para moradores do município.
                  </p>
                  <Link href="/cadastro"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-y-1 shadow-lg bg-[#002f40] text-[#F9C400] hover:bg-[#001f2e]">
                    Pedir Cartão <ArrowRight size={16} />
                  </Link>
                </div>
              </Reveal>

            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER (mesmo da página de atrativos) ── */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de São Geraldo do Araguaia" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1 text-center md:text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                © 2026 Prefeitura Munícipal de São Geraldo do Araguaia - PA| Todos os direitos reservados
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