'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, ReactNode } from 'react';
import {
  Compass, Home, Mountain, Fish, Hotel, Utensils,
  ArrowRight, Waves
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── MOTOR DE ANIMAÇÕES ──
function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);

  return { ref, isVisible };
}

function AnimatedSection({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-left' | 'fade-right' | 'zoom-in';
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();
  let hiddenClass = 'opacity-0 translate-y-12';
  if (animation === 'fade-left') hiddenClass = 'opacity-0 translate-x-12';
  if (animation === 'fade-right') hiddenClass = 'opacity-0 -translate-x-12';
  if (animation === 'zoom-in') hiddenClass = 'opacity-0 scale-95';

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out will-change-transform ${
        isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : hiddenClass
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── SUGESTÕES DE DESTINOS ──
const SUGESTOES = [
  { label: 'Atrativos', href: '/atrativos', icon: <Mountain size={22} />, cor: '#00577C' },
  { label: 'Roteiros', href: '/roteiros', icon: <Compass size={22} />, cor: '#d4a800' },
  { label: 'Comunidades', href: '/comunidades', icon: <Waves size={22} />, cor: '#009640' },
  { label: 'Hospedagem', href: '/hoteis', icon: <Hotel size={22} />, cor: '#00577C' },
  { label: 'Gastronomia', href: '/gastronomia', icon: <Utensils size={22} />, cor: '#d4a800' },
  { label: 'Pesca Esportiva', href: '/pesca-esportiva', icon: <Fish size={22} />, cor: '#009640' },
];

export default function NotFound() {
  return (
    <main className={`${inter.className} bg-[#FDFCF7] text-slate-900 min-h-screen flex flex-col`}>

      {/* ══════════════════════════════════════
          BLOCO PRINCIPAL 404
          (pt-32 para o header fixo ter espaço)
      ══════════════════════════════════════ */}
      <section className="relative flex items-center justify-center px-4 sm:px-6 pt-32 sm:pt-40 md:pt-48 pb-16 sm:pb-24 overflow-hidden">
        {/* Blobs decorativos suaves */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00577C]/5 rounded-full blur-3xl -translate-y-1/4 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#009640]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">

          <AnimatedSection animation="zoom-in">
            <h1
              className={`${jakarta.className} text-[7rem] sm:text-[11rem] md:text-[14rem] font-black text-[#00577C] leading-none tracking-tighter select-none`}
              style={{
                textShadow: '0 12px 40px rgba(0,87,124,0.12)',
                letterSpacing: '-0.06em',
              }}
            >
              404
            </h1>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={150}>
            <h2 className={`${jakarta.className} text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6`}>
              Este caminho
              <br />
              <span className="italic text-[#009640]">não existe.</span>
            </h2>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
              A página que procuras pode ter sido movida, removida ou nunca existiu. 
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00577C] text-white px-7 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-md hover:bg-[#004a6b] hover:-translate-y-0.5 transition-all"
              >
                <Home size={16} />
                Voltar ao Início
              </Link>

              <Link
                href="/atrativos"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent border-2 border-[#00577C] text-[#00577C] px-7 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#00577C] hover:text-white transition-all"
              >
                Explorar Atrativos
                <ArrowRight size={16} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

    </main>
  );
}