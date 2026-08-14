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
              href={`/roteiros/${rota.id}`}
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
    { label: 'Viver', links: ['Passeios', 'Eventos', 'Comunidades', 'Aldeias'] },
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
      {/* ══════════════════════════════════════
          HERO SOFT & CLEAN INSTITUCIONAL (IGUAL AOS ATRATIVOS)
      ══════════════════════════════════════ */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-32 px-6 bg-[#FDFCF7] overflow-hidden mt-[72px] md:mt-[80px]">
        {/* Background Graphics Suaves */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#009640]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#00577C]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center relative z-10">
          
          <Reveal anim="left" className="lg:col-span-5 flex flex-col items-center text-center lg:items-start lg:text-left">
            

            <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6`}>
              Roteiros<br />
              <span className="italic text-[#009640]">Turísticos.</span>
            </h1>

            <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium mb-10 text-justify md:text-left">
              Descubra trilhas, caminhos e percursos pensados para revelar o melhor da nossa região. Prepare-se para uma aventura inesquecível pelo coração da natureza.
            </p>
          </Reveal>

          <Reveal anim="right" className="lg:col-span-7 w-full mt-4 lg:mt-0">
             <div className="relative w-full h-[400px] md:h-[500px] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-[4px] border-white z-10">
               <Image 
                 src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/IMG_1803.PNG" 
                 alt="Roteiros Turísticos" 
                 fill 
                 className="object-cover hover:scale-105 transition-transform duration-[2000ms]" 
                 priority 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent" />
             </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FAIXA UNIFICADA (PESAM E APA - FLUTUANTE)
      ══════════════════════════════════════ */}
      <section className="relative z-20 w-full px-6 -mt-10 mb-24 max-w-[1400px] mx-auto">
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