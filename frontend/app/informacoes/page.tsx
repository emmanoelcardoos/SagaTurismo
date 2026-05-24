'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import {
  Menu, AlertTriangle, Compass, HeartPulse, Shield,
  Flame, Building2, Phone, MapPin, Clock, Info,
  ChevronRight, X, ArrowRight, Ambulance, TreePine,
  LifeBuoy, Stethoscope, Car, Wifi, DollarSign, Droplets, isMobileMenuOpen, setIsMobileMenuOpen
} from 'lucide-react';
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import infoAnimation from '../../public/info.json';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['700', '800'] });
const dmSans  = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600'] });

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Contato = {
  id: number;
  categoria: string;
  nome: string;
  descricao: string;
  endereco: string;
  telefones: string[];
  horario: string;
  emergencia?: boolean;
  whatsapp?: string;
};

// ─── DATA ────────────────────────────────────────────────────────────────────
const categorias = [
  { id: 'all',       label: 'Todos',       icon: Info,        cor: '#64748b', bg: '#f1f5f9' },
  { id: 'turismo',   label: 'Turismo',     icon: Compass,     cor: '#009640', bg: '#e6f7ee' },
  { id: 'saude',     label: 'Saúde',       icon: HeartPulse,  cor: '#dc2626', bg: '#fee2e2' },
  { id: 'seguranca', label: 'Segurança',   icon: Shield,      cor: '#1d4ed8', bg: '#dbeafe' },
  { id: 'bombeiros', label: 'Bombeiros',   icon: Flame,       cor: '#ea580c', bg: '#ffedd5' },
  { id: 'delegacia', label: 'Delegacia',   icon: Building2,   cor: '#7c3aed', bg: '#ede9fe' },
  { id: 'utilidades',label: 'Utilidades',  icon: LifeBuoy,    cor: '#00577C', bg: '#e0f2fe' },
];

const contatos: Contato[] = [
  // TURISMO
  {
    id: 1,
    categoria: 'turismo',
    nome: 'Posto de Informação Turística',
    descricao: 'Orientação sobre roteiros, eventos e hospedagens da cidade.',
    endereco: 'Praça da Matriz, s/n — Centro',
    telefones: ['(94) 98145-2067'],
    whatsapp: '5594981452067',
    horario: 'Seg – Sex: 08h às 17h',
  },
  {
    id: 2,
    categoria: 'turismo',
    nome: 'Secretaria Municipal de Turismo (SEMTUR)',
    descricao: 'Suporte oficial da Prefeitura para turistas e visitantes.',
    endereco: 'Av. Principal, 100 — Centro',
    telefones: ['(94) 98145-2067'],
    horario: 'Seg – Sex: 08h às 17h',
  },
  // SAUDE
  {
    id: 4,
    categoria: 'saude',
    nome: 'Hospital Municipal',
    descricao: 'Atendimento geral, internações e especialidades médicas.',
    endereco: 'Rua das Palmeiras, 200',
    telefones: ['(94) 3421-0001'],
    horario: '24 Horas',
  },
  {
    id: 5,
    categoria: 'saude',
    nome: 'SAMU — Resgate Médico',
    descricao: 'Serviço de Atendimento Móvel de Urgência.',
    endereco: 'Atendimento em toda a cidade',
    telefones: ['192'],
    horario: '24 Horas',
    emergencia: true,
  },
  // SEGURANÇA
  {
    id: 6,
    categoria: 'seguranca',
    nome: '23ª Companhia da Polícia Militar',
    descricao: 'Policiamento ostensivo e atendimento de ocorrências.',
    endereco: 'Av. Araguaia, 500',
    telefones: ['190'],
    horario: '24 Horas',
    emergencia: true,
  },
  // BOMBEIROS
  {
    id: 8,
    categoria: 'bombeiros',
    nome: 'Corpo de Bombeiros Militar',
    descricao: 'Combate a incêndios, resgates e atendimento de acidentes.',
    endereco: 'Rua dos Bombeiros, s/n',
    telefones: ['193'],
    horario: '24 Horas',
    emergencia: true,
  },
  // DELEGACIA
  {
    id: 9,
    categoria: 'delegacia',
    nome: 'Delegacia de Polícia Civil',
    descricao: 'Registro de boletins de ocorrência e investigações.',
    endereco: 'Rua da Delegacia, 300',
    telefones: ['(94) 3421-5050', '197'],
    horario: '24 Horas',
  },
  // UTILIDADES
  {
    id: 10,
    categoria: 'utilidades',
    nome: 'Defesa Civil Municipal',
    descricao: 'Emergências climáticas, inundações e riscos naturais.',
    endereco: 'Prefeitura Municipal, s/n',
    telefones: ['199', '(94) 3421-7777'],
    horario: '24 Horas',
    emergencia: true,
  },
  {
    id: 11,
    categoria: 'utilidades',
    nome: 'Procon Municipal',
    descricao: 'Defesa do consumidor e resolução de conflitos comerciais.',
    endereco: 'Rua do Comércio, 50',
    telefones: ['(94) 3421-3333'],
    horario: 'Seg – Sex: 08h às 14h',
  },
];

// ─── SCROLL REVEAL ────────────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ─── CARD COMPONENT ───────────────────────────────────────────────────────────
function ContatoCard({ contato, delay }: { contato: Contato; delay: number }) {
  const cat = categorias.find(c => c.id === contato.categoria)!;
  const Icon = cat.icon;

  return (
    <div
      data-reveal
      className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col overflow-hidden"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Top accent bar */}
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(90deg, ${cat.cor}, ${cat.cor}88)` }}
      />

      <div className="p-6 md:p-7 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: cat.bg, color: cat.cor }}
          >
            <Icon size={20} />
          </div>

          <div className="flex items-center gap-2">
            {contato.emergencia && (
              <span className={`${dmSans.className} inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest`}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> 24h
              </span>
            )}
            <span
              className={`${dmSans.className} px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-widest`}
              style={{ background: cat.bg, color: cat.cor }}
            >
              {cat.label}
            </span>
          </div>
        </div>

        {/* Name + description */}
        <h3 className={`${jakarta.className} text-base font-bold text-slate-900 mb-1.5 leading-snug`}>{contato.nome}</h3>
        <p className={`${dmSans.className} text-sm text-slate-500 font-light leading-relaxed mb-5 flex-1`}>{contato.descricao}</p>

        {/* Details */}
        <div className={`${dmSans.className} space-y-2 text-sm text-slate-500 mb-5`}>
          <div className="flex items-start gap-2.5">
            <MapPin size={14} className="mt-0.5 shrink-0 text-[#009640]" />
            <span className="font-light">{contato.endereco}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock size={14} className="shrink-0 text-[#00577C]" />
            <span className="font-medium">{contato.horario}</span>
          </div>
        </div>

        {/* Phone buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
          {contato.telefones.map(tel => (
            <a
              key={tel}
              href={`tel:${tel.replace(/\D/g,'')}`}
              className={`${dmSans.className} inline-flex items-center gap-2 bg-[#00577C] hover:bg-[#004766] text-white px-4 py-2.5 rounded-full text-xs font-semibold transition-colors`}
            >
              <Phone size={12} /> {tel}
            </a>
          ))}
          {contato.whatsapp && (
            <a
              href={`https://wa.me/${contato.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${dmSans.className} inline-flex items-center gap-2 bg-[#009640] hover:bg-[#007a34] text-white px-4 py-2.5 rounded-full text-xs font-semibold transition-colors`}
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function InformacoesPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showHeader, setShowHeader]     = useState(true);
  const [scrolled, setScrolled]         = useState(false);
  const [lastY, setLastY]               = useState(0);
  const [menuOpen, setMenuOpen]         = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useReveal();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 50);
      if (y < 80) setShowHeader(true);
      else if (y > lastY) setShowHeader(false);
      else setShowHeader(true);
      setLastY(y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastY]);

  const filtered = activeFilter === 'all' ? contatos : contatos.filter(c => c.categoria === activeFilter);

  // Quick emergency numbers for hero
  const emergency = [
    { label: 'Polícia', num: '190', color: '#1d4ed8' },
    { label: 'SAMU',    num: '192', color: '#dc2626' },
    { label: 'Bombeiros', num: '193', color: '#ea580c' },
    { label: 'Defesa Civil', num: '199', color: '#00577C' },
  ];

  return (
    <>
      <style>{`
        [data-reveal]{opacity:0;transform:translateY(28px);transition:opacity .6s ease,transform .6s ease}
        [data-reveal].revealed{opacity:1!important;transform:none!important}
        .hide-scrollbar{scrollbar-width:none}
        .hide-scrollbar::-webkit-scrollbar{display:none}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .ticker-inner{display:flex;width:max-content;animation:ticker 18s linear infinite}
        .ticker-inner:hover{animation-play-state:paused}
      `}</style>

      <main className={`${dmSans.className} bg-slate-50 min-h-screen`}>

        {/* ── EMERGENCY TICKER ── */}
        <div className="bg-[#dc2626] text-white overflow-hidden py-2.5">
          <div className="ticker-inner">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-10 px-10">
                {emergency.map(e => (
                  <span key={e.label} className={`${dmSans.className} flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap`}>
                    <AlertTriangle size={12} />
                    {e.label}: <strong className="text-[#F9C400]">{e.num}</strong>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── HEADER ── */}
        <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
              <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Roteiros', 'Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro"
              className={`${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
              Cartão Residente
            </Link>
          </nav>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            {['Hoteis', 'Pacotes', 'Roteiros', 'Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro"
              className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>
              Cartão Residente
            </Link>
          </div>
        )}
      </header>

        {/* ── HERO ── */}
        <section className="relative pt-36 md:pt-44 pb-20 md:pb-28 bg-[#00577C] overflow-hidden">
          {/* Background geometry */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#ffff]/20 blur-[120px] -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#F9C400]/15 blur-[100px] translate-y-1/3 -translate-x-1/4" />
            {/* Subtle dot grid */}
            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="white"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)"/>
            </svg>
          </div>

          {/* Tricolor bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#009640] via-[#F9C400] to-[#00577C]" />

          <div className="relative z-10 max-w-7xl mx-auto px-5">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: headline */}
              <div>
                <p className={`${dmSans.className} mb-3 text-xs font-semibold uppercase tracking-[.25em] text-[#F9C400]`}>
                  Olá, Turista!
                </p>
                <h1 className={`${jakarta.className} text-4xl sm:text-5xl md:text-6xl text-white leading-tight mb-5`}>
                  Como podemos<br /><span className="text-[#F9C400]">ajudar?</span>
                </h1>
                <p className={`${dmSans.className} text-white/70 font-light text-base md:text-lg leading-relaxed max-w-lg`}>
                  Aqui pode encontrar todos os contatos essenciais para a tua estadia em São Geraldo do Araguaia — desde informações turísticas até emergências.
                </p>
              </div>

              {/* Right: Lottie animation — plays once on load, then stops */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-[420px]">
                  <Lottie
                    lottieRef={lottieRef}
                    animationData={infoAnimation}
                    loop={false}
                    autoplay={true}
                    onComplete={() => {
                      // stay on the last frame — do nothing
                    }}
                    style={{ width: '100%', height: 'auto' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FILTER BAR (sticky) ── */}
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {categorias.map(cat => {
                const Icon = cat.icon;
                const active = activeFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFilter(cat.id)}
                    className={`${dmSans.className} shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200
                      ${active
                        ? 'bg-[#00577C] text-white shadow-md shadow-[#00577C]/20'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                  >
                    <Icon size={13} /> {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── CONTACT GRID ── */}
        <section className="py-14 md:py-20 px-4">
          <div className="max-w-7xl mx-auto">

            {/* Section label */}
            <div data-reveal className="flex items-end justify-between mb-10 flex-wrap gap-4">
              <div>
                <p className={`${dmSans.className} text-xs font-semibold uppercase tracking-[.22em] text-[#009640] mb-1`}>
                  {filtered.length} contato{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                </p>
                <h2 className={`${jakarta.className} text-3xl md:text-4xl text-slate-900`}>
                  {activeFilter === 'all' ? 'Todos os Serviços' : categorias.find(c=>c.id===activeFilter)?.label}
                </h2>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {filtered.map((c, i) => (
                <ContatoCard key={c.id} contato={c} delay={i * 60} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-24">
                <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className={`${jakarta.className} text-slate-400 text-lg font-bold`}>Nenhum contato nesta categoria</p>
              </div>
            )}
          </div>
        </section>

        {/* ── TIPS STRIP ── */}
        <section className="py-14 md:py-20 bg-[#009640]/5 border-t border-[#009640]/10 px-4">
          <div className="max-w-7xl mx-auto">
            <div data-reveal className="mb-10 text-center">
              <p className={`${dmSans.className} text-xs font-semibold uppercase tracking-[.22em] text-[#009640] mb-2`}>Dicas para Turistas</p>
              <h2 className={`${jakarta.className} text-3xl md:text-4xl text-[#00577C]`}>Antes de explorar, saiba disso</h2>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { icon: Droplets,   title: 'Hidratação',   tip: 'O calor amazônico é intenso. Carregue sempre água e evite longos períodos ao sol entre 11h e 15h.' },
                { icon: Wifi,       title: 'Conectividade', tip: 'O sinal de internet pode ser fraco em áreas rurais e trilhas. Baixe mapas offline antes de sair.' },
                { icon: DollarSign, title: 'Dinheiro',      tip: 'Leve dinheiro em espécie. Caixas eletrônicos são escassos fora do centro da cidade.' },
                { icon: TreePine,   title: 'Meio Ambiente', tip: 'Não deixe lixo nas trilhas ou praias. Respeite a fauna e flora locais e os territórios indígenas.' },
              ].map((tip, i) => (
                <div key={i} data-reveal
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                  style={{ transitionDelay: `${i * 70}ms` }}>
                  <div className="w-10 h-10 rounded-xl bg-[#00577C]/10 flex items-center justify-center mb-4">
                    <tip.icon size={18} className="text-[#00577C]" />
                  </div>
                  <h4 className={`${jakarta.className} text-sm font-bold text-slate-900 mb-2`}>{tip.title}</h4>
                  <p className={`${dmSans.className} text-slate-500 text-sm font-light leading-relaxed`}>{tip.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BOTTOM ── */}
        <section className="py-14 md:py-20 bg-[#F9C400] px-4 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 10% 50%, #00577C 0%, transparent 50%), radial-gradient(circle at 90% 50%, #009640 0%, transparent 50%)' }} />
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <h2 className={`${jakarta.className} text-3xl md:text-5xl text-[#00577C] mb-4`}>
              Planeja a sua visita conosco.
            </h2>
            <p className={`${dmSans.className} text-[#00577C]/70 font-light text-base md:text-lg mb-8 max-w-lg mx-auto`}>
              Descubra roteiros, eventos e experiências únicas em São Geraldo do Araguaia.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/roteiro" className={`${dmSans.className} inline-flex items-center gap-2 bg-[#00577C] text-white px-8 py-4 rounded-full font-semibold text-sm uppercase tracking-widest shadow-lg hover:-translate-y-1 transition-transform`}>
                Explorar Roteiros <ArrowRight size={16} />
              </Link>
              <Link href="/pacotes" className={`${dmSans.className} inline-flex items-center gap-2 bg-[#00577C] text-white px-8 py-4 rounded-full font-semibold text-sm uppercase tracking-widest shadow-lg hover:-translate-y-1 transition-transform`}>
                Explorar Pacotes <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="py-10 px-4 bg-white border-t border-slate-100 text-center">
          <div className="relative h-12 w-36 mx-auto mb-3">
            <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
          </div>
          <p className={`${dmSans.className} text-[10px] font-semibold text-slate-300 uppercase tracking-[.3em]`}>
            © 2026 Secretaria Municipal de Turismo — São Geraldo do Araguaia (PA)
          </p>
        </footer>

      </main>
    </>
  );
}