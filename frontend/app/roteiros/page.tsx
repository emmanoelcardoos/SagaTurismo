'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { ArrowRight, Loader2, Compass, Clock, MapPin, Signal } from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM ──
type Roteiro = {
  id: string;
  titulo: string;
  slug?: string;
  descricao_curta: string;
  imagem_url: string;
  categoria?: string;
  tempo_estimado?: string;
  dificuldade?: string;
  tipo_percurso?: string;
  necessidade_guia?: boolean;
  tipo_guia?: string;
};

// ── MOTOR DE ANIMAÇÕES ──
function useScrollAnimation(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );
    observer.observe(element);
    return () => observer.disconnect();
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
  let hiddenClass = '';
  switch (animation) {
    case 'fade-up': hiddenClass = 'opacity-0 translate-y-16'; break;
    case 'fade-left': hiddenClass = 'opacity-0 translate-x-16'; break;
    case 'fade-right': hiddenClass = 'opacity-0 -translate-x-16'; break;
    case 'zoom-in': hiddenClass = 'opacity-0 scale-95'; break;
  }
  return (
    <div
      ref={ref}
      className={`transition-all duration-[1000ms] ease-out will-change-transform ${
        isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : hiddenClass
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function RoteirosPage() {
  const [rotas, setRotas] = useState<Roteiro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRotas() {
      const { data, error } = await supabase
        .from('roteiros_turisticos')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true, nullsFirst: false });

      if (data) setRotas(data as Roteiro[]);
      if (error) console.error('Erro ao buscar roteiros:', error);
      setLoading(false);
    }
    fetchRotas();
  }, []);

  const genericImage = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09';

  return (
    <main className={`${inter.className} bg-[#FDFCF7] text-slate-900 overflow-x-hidden min-h-screen flex flex-col`}>

      {/* ══════════════════════════════════════
          HERO EDITORIAL
      ══════════════════════════════════════ */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.pexels.com/photos/27627209/pexels-photo-27627209.jpeg?_gl=1*14pgmxz*_gcl_au*NDU0NDkxNDc2LjE3ODczNjc3NjI.*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3OTA5ODk4MTIkbzE2MiRnMSR0MTc5MDk4OTk0MiRqNTkkbDAkaDA."
            alt="Roteiros Turísticos de São Geraldo do Araguaia"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            Roteiros
          </h1>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════
          LISTAGEM DE ROTEIROS (INTEGRADOS)
      ══════════════════════════════════════ */}
      <section className="py-24 md:py-32 relative z-20 w-full max-w-[1400px] mx-auto px-6 bg-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              A preparar os roteiros...
            </p>
          </div>
        ) : rotas.length === 0 ? (
          <div className="text-center py-20">
            <Compass className="mx-auto w-16 h-16 text-slate-300 mb-4" />
            <h3 className={`${jakarta.className} text-2xl font-bold text-slate-500`}>
              Ainda estamos trabalhando na criação dos roteiros turísticos. 
            </h3>
          </div>
        ) : (
          <div className="space-y-32 md:space-y-48">
            {rotas.map((rota, index) => {
              const isPar = index % 2 === 0;

              return (
                <AnimatedSection animation="fade-up" className="relative group" key={rota.id}>
                  <div className={`flex flex-col ${isPar ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center`}>

                    {/* BLOCO DA IMAGEM */}
                    <div className="relative w-full h-[400px] lg:h-[550px] lg:w-1/2 rounded-[2rem] overflow-hidden bg-slate-100 shrink-0 shadow-2xl shadow-slate-300/40">
                      <Image
                        src={rota.imagem_url || genericImage}
                        alt={rota.titulo}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-60 transition-opacity duration-700" />

                      {/* Etiqueta de categoria */}
                      {rota.categoria && (
                        <div className="absolute top-6 left-6 z-10 bg-[#F9C400] text-[#002f40] px-4 py-2 rounded-xl shadow-md">
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {rota.categoria}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* BLOCO DE TEXTO */}
                    <div className="flex-1 flex flex-col justify-center">
                      <h2 className={`${jakarta.className} text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-8`}>
                        {rota.titulo}
                      </h2>

                      <p className="text-slate-600 text-lg md:text-xl leading-relaxed mb-10 font-medium max-w-2xl">
                        {rota.descricao_curta}
                      </p>

                      {/* Tags inline (tempo, dificuldade, tipo) */}
                      <div className="flex flex-wrap gap-3 mb-10">
                        {[
                          { icon: <Clock size={16} />, valor: rota.tempo_estimado },
                          { icon: <Signal size={16} />, valor: rota.dificuldade },
                          { icon: <MapPin size={16} />, valor: rota.tipo_percurso },
                        ]
                          .filter((m) => m.valor)
                          .map((m, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-white border border-slate-200 text-slate-600"
                            >
                              <span className="text-[#00577C]">{m.icon}</span>
                              {m.valor}
                            </span>
                          ))}
                      </div>

                      {/* CTA */}
                      <div className="pt-2">
                        <Link
                          href={`/roteiros/${rota.id}`}
                          className="group/btn inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest bg-transparent border-2 border-[#00577C] text-[#00577C] hover:bg-[#00577C] hover:text-white transition-all duration-300"
                        >
                          Explorar este roteiro
                          <ArrowRight className="group-hover/btn:translate-x-1 transition-transform" size={16} />
                        </Link>
                      </div>
                    </div>

                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        )}
      </section>

    </main>
  );
}