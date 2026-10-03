'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

// ── FONTES ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPOS ──
export type Comunidade = {
  id: string;
  slug: string; // 🔴 Adicionado o slug
  titulo: string;
  descricao_curta: string;
  historia_texto?: string;
  cultura_texto?: string;
  imagem_url: string;
  galeria?: any;
};

export type PontoComunidade = {
  id: string;
  titulo: string;
  tipo: string; 
  imagem_url: string;
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
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);
  return { ref, isVisible };
}

function Reveal({ children, className = '', anim = 'up', delay = 0 }: {
  children: ReactNode; className?: string; anim?: 'up' | 'left' | 'right' | 'zoom' | 'fade'; delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();
  const hiddenMap: Record<string, string> = {
    'up': 'opacity-0 translate-y-14',
    'left': 'opacity-0 translate-x-14',
    'right': 'opacity-0 -translate-x-14',
    'zoom': 'opacity-0 scale-90',
    'fade': 'opacity-0',
  };
  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : hiddenMap[anim]} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// 🔴 AGORA O COMPONENTE RECEBE AS PROPS DIRETAMENTE! 
export default function ComunidadeClient({
  comunidade,
  pontos,
}: {
  comunidade: Comunidade;
  pontos: PontoComunidade[];
}) {
  
  const fotosGaleria = parseGaleria(comunidade.galeria).filter(Boolean);

  return (
    <main className={`${inter.className} bg-[#FDFCF7] text-slate-900 overflow-x-hidden min-h-screen flex flex-col`}>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={comunidade.imagem_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'}
            alt={`Capa de ${comunidade.titulo}`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[7rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            {comunidade.titulo}
          </h1>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CONTEÚDO PRINCIPAL
      ══════════════════════════════════════ */}
      <section className="max-w-[900px] mx-auto px-6 py-12 md:py-16 w-full relative z-20">
        <Reveal anim="up">
          <Link href="/comunidades" className="text-[#00577C] hover:text-[#003d57] transition-colors mb-10 inline-block font-medium text-sm md:text-base underline underline-offset-4 decoration-slate-200 hover:decoration-[#00577C]">
            &larr; Voltar para comunidades
          </Link>

          <div className="text-slate-700 leading-relaxed text-base md:text-lg whitespace-pre-wrap mb-12">
            {comunidade.historia_texto || comunidade.descricao_curta || 'Detalhes sobre a história e cultura desta comunidade em breve.'}
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════
          O QUE VOCÊ ENCONTRA AQUI
      ══════════════════════════════════════ */}
      {pontos.length > 0 && (
        <section className="max-w-[1400px] mx-auto w-full px-6 mb-24">
          <Reveal anim="up">
            <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 mb-8 border-b border-slate-200 pb-4`}>
              O que você encontra aqui
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pontos.map((ponto, i) => (
                <Reveal key={ponto.id} delay={i * 100}>
                  <div className="relative h-[300px] md:h-[380px] rounded-[2.5rem] overflow-hidden group shadow-md border border-slate-100 block bg-slate-100">
                    <Image 
                      src={ponto.imagem_url || comunidade.imagem_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'} 
                      alt={ponto.titulo} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

                    <div className="absolute bottom-8 left-8 right-8 z-10">
                      <h4 className={`${jakarta.className} text-white text-2xl md:text-3xl font-black leading-tight drop-shadow-md`}>
                        {ponto.titulo}
                      </h4>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ══════════════════════════════════════
          GALERIA
      ══════════════════════════════════════ */}
      {fotosGaleria.length > 0 && (
        <section className="max-w-[1400px] mx-auto w-full px-6 mb-24">
          <Reveal anim="up">
            <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 mb-8 border-b border-slate-200 pb-4`}>
              Galeria
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {fotosGaleria.map((imgUrl, i) => (
                <div key={i} className="relative rounded-[2rem] overflow-hidden aspect-[4/3] group shadow-sm bg-slate-100 border border-slate-100">
                  <Image src={imgUrl} alt={`Galeria da Comunidade ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

    </main>
  );
}