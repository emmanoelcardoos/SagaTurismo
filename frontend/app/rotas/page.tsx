'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, ArrowRight, Loader2, Compass,
  Waves, Mountain, MapPin, Clock, Users,
  ShieldCheck, Leaf
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPO ROTA ──
type RotaTuristica = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_url: string;
  ordem: number | null;
  duracao: string | null;
  dificuldade: string | null;
  grupo: string | null;
  guia: string | null;
  unidade: string | null; // NOVA COLUNA: 'PESAM' ou 'APA'
};

// ── SISTEMA DE UNIDADES DE CONSERVAÇÃO (PESAM e APA) ──
const unidadesConfig: Record<string, any> = {
  'PESAM': { 
    cor: '#009640', bgLight: 'bg-[#009640]/10', textLight: 'text-[#009640]', borderLight: 'border-[#009640]/10', 
    icon: <Mountain size={18} />, sigla: 'PESAM', nome: 'Parque Estadual Serra dos Martírios/Andorinhas' 
  },
  'APA': { 
    cor: '#00577C', bgLight: 'bg-[#00577C]/10', textLight: 'text-[#00577C]', borderLight: 'border-[#00577C]/10', 
    icon: <Waves size={18} />, sigla: 'APA', nome: 'Área de Proteção Ambiental' 
  },
};

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
// CARD DE ROTA (DESIGN SOFT & CLEAN)
// ══════════════════════════════════════
function RotaCard({ rota, index }: { rota: RotaTuristica; index: number }) {
  const isPar = index % 2 === 0;
  
  // Identifica se é PESAM ou APA. Se não estiver preenchido, assume PESAM como padrão visual
  const siglaUnidade = rota.unidade?.toUpperCase().includes('APA') ? 'APA' : 'PESAM';
  const theme = unidadesConfig[siglaUnidade];

  // Valores reais vindo da base de dados
  const duracao = rota.duracao || 'Não informada';
  const dificuldade = rota.dificuldade || 'Não informada';
  const grupo = rota.grupo || 'Sem limite';

  return (
    <Reveal anim="up" delay={index * 100}>
      <article className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all p-4 flex flex-col ${isPar ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 overflow-hidden group mb-10`}>

        {/* ── IMAGEM ── */}
        <div className="relative w-full h-[350px] lg:h-auto lg:min-h-[450px] lg:w-[50%] rounded-3xl overflow-hidden bg-slate-100 shrink-0">
          <Image
            src={rota.imagem_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'}
            alt={rota.titulo}
            fill
            className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-700" />

          {/* Etiqueta Temática (PESAM ou APA) */}
          <div className={`absolute top-6 left-6 z-10 flex items-center gap-2 ${theme.bgLight} backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border ${theme.borderLight} ${theme.textLight}`}>
            {theme.icon}
            <span className="text-[10px] font-black uppercase tracking-widest">{theme.sigla}</span>
          </div>
        </div>

        {/* ── TEXTO E INFORMAÇÕES ── */}
        <div className="flex-1 py-4 lg:py-12 px-2 lg:px-6 flex flex-col justify-center">
          <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] mb-6`}>
            {rota.titulo}
          </h2>

          <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-8 font-medium">
            {rota.descricao_curta}
          </p>

          {/* Tags de Detalhes da Rota */}
          <div className="flex flex-wrap gap-3 mb-10">
            {[
              { icon: <Clock size={14} />, valor: duracao },
              { icon: <MapPin size={14} />, valor: dificuldade },
              { icon: <Users size={14} />, valor: grupo },
            ].map((m, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600">
                <span className={theme.textLight}>{m.icon}</span>
                {m.valor}
              </span>
            ))}
          </div>

          <div className="mt-auto border-t border-slate-100 pt-8 flex">
            <Link
              href={`/rotas/${rota.id}`}
              className="group/btn inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-lg bg-[#00577C] text-white hover:bg-[#004a6b] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
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
        // REPARE QUE AQUI AGORA PUXAMOS A COLUNA 'unidade'
        .select('id, titulo, descricao_curta, imagem_url, ordem, duracao, dificuldade, grupo, guia, unidade')
        .eq('ativo', true)
        .order('ordem', { ascending: true });
      if (data) setRotas(data);
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

  const menuItens = ['Hoteis', 'Agencias', 'Rotas', 'Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'];

  return (
    <main className={`${inter.className} text-slate-900 overflow-x-hidden min-h-screen bg-[#FDFCF7]`}>

      {/* ── HEADER ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}>
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
          HERO CLEAN
      ══════════════════════════════════════ */}
      <section className="relative h-[55vh] md:h-[65vh] flex flex-col justify-center items-center text-center px-6 overflow-hidden bg-[#002f40]">
        <div className="absolute inset-0 z-0">
          <video
            src="/videorota.mp4"
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-75"
          />
        </div>

        <div className="absolute inset-0 z-0 bg-slate-900/40" />

        <div className="relative z-10 max-w-3xl mx-auto pt-16">
          <Reveal anim="up">
            <h1 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-[1.1] drop-shadow-lg`}>
              Roteiros <span className="italic text-[#F9C400]">Turísticos</span>
            </h1>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FAIXA UNIFICADA (PESAM E APA - FULL WIDTH)
      ══════════════════════════════════════ */}
      <section className="relative z-20 w-full border-y border-slate-200/50 mb-16"
               style={{ background: 'linear-gradient(to right, #EAF1F4 0%, #EBF5ED 50%, #FFFBEA 100%)' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <Reveal anim="up">
            <div className="py-10 md:py-12 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6 md:gap-0 md:divide-x divide-slate-300/60">
              
              {Object.values(unidadesConfig).map((item, i) => (
                <div key={item.sigla} className={`flex items-center justify-center md:justify-start gap-5 ${i === 1 ? 'md:pl-12 lg:pl-16' : 'md:pr-12 lg:pr-16'}`}>
                  <div className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center shadow-sm border ${item.borderLight} ${item.bgLight} ${item.textLight}`}>
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 leading-tight mb-1`}>
                      {item.sigla}
                    </h3>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 leading-relaxed">
                      {item.nome}
                    </p>
                  </div>
                </div>
              ))}
              
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          INTRO EDITORIAL
      ══════════════════════════════════════ */}
      

      {/* ══════════════════════════════════════
          LISTAGEM DE ROTAS
      ══════════════════════════════════════ */}
      <section id="rotas" className="pb-24 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="animate-spin w-12 h-12 mb-4 text-[#00577C]" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Carregando rotas...
              </p>
            </div>
          )}

          {!loading && rotas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
              <Compass size={64} className="text-slate-200 mb-6" />
              <h3 className={`${jakarta.className} text-3xl font-black mb-3 text-slate-800`}>
                Nenhuma rota foi encontrada
              </h3>
              <p className="text-sm text-slate-500">
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
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════ */}
      {!loading && rotas.length > 0 && (
        <section className="py-24 px-6 md:px-12 bg-white border-t border-slate-100">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Reveal anim="up" className="md:col-span-2">
                <div className="rounded-[2.5rem] p-10 md:p-14 h-full flex flex-col justify-between min-h-[300px]"
                  style={{ backgroundColor: '#00577C' }}>
                  <div>
                    <p className="font-black text-[10px] uppercase tracking-[0.3em] mb-4 text-[#F9C400]">
                      Continuar a explorar
                    </p>
                    <h3 className={`${jakarta.className} text-4xl md:text-5xl font-black text-white leading-[1.1] mb-6`}>
                      Preferes um pacote <br />
                      <span className="italic text-[#F9C400]">já organizado?</span>
                    </h3>
                    <p className="text-white/80 text-base leading-relaxed max-w-md">
                      Roteiros com hospedagem e guia incluídos. Só precisas de aparecer e viver.
                    </p>
                  </div>
                  <Link href="/pacotes"
                    className="mt-8 inline-flex items-center gap-3 self-start px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-colors hover:-translate-y-1 shadow-xl bg-[#F9C400] text-[#001f2e]">
                    Ver pacotes disponíveis <ArrowRight size={16} />
                  </Link>
                </div>
              </Reveal>

              <Reveal anim="up" delay={120}>
                <div className="rounded-[2.5rem] p-10 h-full flex flex-col justify-between min-h-[300px] bg-[#F9C400]">
                  <div>
                    <p className="font-black text-[10px] uppercase tracking-[0.3em] mb-4 text-[#002f40]/50">
                      Residentes SGA
                    </p>
                    <h3 className={`${jakarta.className} text-4xl font-black text-[#002f40] leading-[1.1] mb-4`}>
                      Cartão<br />
                      <span className="italic">Residente</span>
                    </h3>
                    <p className="text-[#002f40]/70 text-sm leading-relaxed font-medium">
                      50% de desconto na entrada de atrações parceiras para moradores do município.
                    </p>
                  </div>
                  <Link href="/cadastro"
                    className="mt-8 inline-flex items-center gap-3 self-start px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 shadow-lg bg-[#001f2e] text-[#F9C400]">
                    Solicitar Cartão <ArrowRight size={16} />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
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