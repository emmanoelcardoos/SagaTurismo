'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  ArrowRight, Loader2, Compass
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGEM ──
type Atracao = {
  id: string;
  nome: string;
  tipo?: string;
  descricao?: string;
  imagem_url: string;
  preco_entrada?: number;
  link_google_maps?: string;
  ativo?: boolean;
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
// CARD DE ATRAÇÃO (GRADE 3 COLUNAS)
// ══════════════════════════════════════
function AtracaoCard({ atracao, index }: { atracao: Atracao; index: number }) {
  return (
    <Reveal anim="up" delay={index * 50}>
      <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 h-full flex flex-col">
        {/* Imagem */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src={atracao.imagem_url || 'https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/atracoes/casapedra.png'}
            alt={atracao.nome}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* TAG DE CATEGORIA FLUTUANTE */}
          {atracao.tipo && (
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00577C]">
                {atracao.tipo}
              </span>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-5 md:p-6 flex flex-col flex-1">
          <h3 className={`${jakarta.className} text-lg md:text-xl font-black text-slate-900 leading-tight line-clamp-2 mb-4`}>
            {atracao.nome}
          </h3>
          
          <div className="mt-auto pt-2">
            <Link
              href={`/atrativos/${atracao.id}`}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00577C] hover:text-[#003d5a] transition-colors group/link"
            >
              Saiba mais
              <ArrowRight size={16} className="transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ══════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════
export default function AtracoesPage() {
  // ── DADOS ──
  const [atracoes, setAtracoes] = useState<Atracao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAtracoes() {
      const { data, error } = await supabase
        .from('atracoes')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true, nullsFirst: false });

      if (data) setAtracoes(data as Atracao[]);
      if (error) console.error('Erro ao buscar atrativos:', error);
      setLoading(false);
    }
    fetchAtracoes();
  }, []);

  return (
    <main className={`${inter.className} text-slate-900 overflow-x-hidden min-h-screen bg-[#FDFCF7]`}>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://res.cloudinary.com/uu8kd8vs/image/upload/f_auto,q_auto/heroatrativos"
            alt="Atrativos em São Geraldo do Araguaia"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            Atrativos
          </h1>
          <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
            Tesouros naturais e culturais de São Geraldo do Araguaia
          </p>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════
          LISTAGEM DE ATRAÇÕES EM GRADE 3 COLUNAS
      ══════════════════════════════════════ */}
      <section id="atrativos" className="pb-24 pt-16 md:pt-20 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          
          {/* Cabeçalho da seção */}
          <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-6">
            <div>
              <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900`}>Nossos Atrativos</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Explore as belezas naturais da região</p>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <Loader2 className="animate-spin w-12 h-12 mb-4 text-[#00577C]" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Preparando os nossos atrativos...
              </p>
            </div>
          )}

          {!loading && atracoes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <Compass size={64} className="text-slate-200 mb-6" />
              <h3 className={`${jakarta.className} text-3xl font-black mb-3 text-slate-800`}>
                Novos destinos a caminho
              </h3>
              <p className="text-sm font-medium text-slate-500 max-w-lg mx-auto">
                Estamos catalogando as melhores atrações naturais de São Geraldo do Araguaia. Volte em breve.
              </p>
            </div>
          )}

          {!loading && atracoes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
              {atracoes.map((atracao, index) => (
                <AtracaoCard key={atracao.id} atracao={atracao} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

    </main>
  );
}