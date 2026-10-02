'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── MOTOR DE ANIMAÇÕES ──
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

function Reveal({ children, className = "", anim = "up", delay = 0 }: { children: ReactNode; className?: string; anim?: "up" | "left" | "right" | "zoom" | "fade"; delay?: number; }) {
  const { ref, isVisible } = useScrollAnimation();
  const hidden: Record<string, string> = {
    up: "opacity-0 translate-y-16",
    left: "opacity-0 translate-x-16",
    right: "opacity-0 -translate-x-16",
    zoom: "opacity-0 scale-90",
    fade: "opacity-0",
  };
  return (
    <div ref={ref}
      className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0 scale-100" : hidden[anim]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── PÁGINA SEMTUR ──
export default function SemturPage() {
  return (
    <main className={`${inter.className} min-h-screen flex flex-col bg-[#FDFCF7] text-slate-900`}>

      {/* ── HERO EDITORIAL ── */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/herosections/heroquemsomos.jpg"
            alt="Secretaria Municipal de Turismo - São Geraldo do Araguaia"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[7rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            SEMTUR
          </h1>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ── CORPO DA PÁGINA ── */}
      <section className="py-20 md:py-32 px-6 bg-[#FDFCF7]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
          
          {/* FOTO DA SECRETÁRIA */}
          <div className="md:col-span-5 flex justify-center md:justify-end relative">
            <Reveal anim="zoom">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[340px] md:h-[340px] bg-slate-200/50 rounded-full z-0 -ml-4 mt-4" />
              
              <div className="relative w-[260px] h-[260px] md:w-[320px] md:h-[320px] rounded-full overflow-hidden z-10 shadow-sm border-[6px] border-[#FDFCF7]">
                <Image 
                  src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/herosections/SEMTUR.jpeg"
                  alt="Micheli Vanderlan - Secretária de Turismo"
                  fill
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>

          {/* TEXTO E INFORMAÇÕES */}
          <div className="md:col-span-7 space-y-8 pt-4">
            <Reveal anim="up">
              <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900`}>
                Micheli Vanderlan
              </h2>

              <p className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-[#00577C] mt-2`}>
                Secretária Municipal de Turismo
              </p>

              <div className="pt-8 text-slate-700 font-medium space-y-1 border-t border-slate-200 mt-8">
                <p>Av. Antônio Pedrosa</p>
                <p>Vila Administrativa, Alto BEC - São Geraldo do Araguaia-PA</p>
                <p className="font-bold text-slate-900 mt-3 mb-1">
                  Tel. (94) 98420-5736
                </p>
                <p>
                  <a href="mailto:turismo@saogeraldodoaraguaia.pa.gov.br" className="text-[#00577C] hover:underline">
                    turismo@saogeraldodoaraguaia.pa.gov.br
                  </a>
                </p>
              </div>
            </Reveal>
          </div>

        </div>
      </section>

    </main>
  );
}