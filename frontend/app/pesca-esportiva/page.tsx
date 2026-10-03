'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Fish, Waves, Target, Leaf, ArrowRight, Compass,
  Camera, X, ChevronLeft, ChevronRight, Sun, MapPin, Anchor
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── FOTOS DO TORPESAGA ──
const FOTOS_TORPESAGA = [
  'https://live.staticflickr.com/65535/55422310039_9391b93de9_k.jpg?s=eyJpIjo1NTQyMjMxMDAzOSwiZSI6MTc5MDk5NTU5NSwicyI6ImQ5ZWQ4OGMzYWVmZTg5MjBkZDU0NzliNzY1ZDVkZDI5YjBkYTUzOWEiLCJ2IjoxfQ',
  'https://live.staticflickr.com/65535/55422310229_750f92feb2_h.jpg?s=eyJpIjo1NTQyMjMxMDIyOSwiZSI6MTc5MDk5NTAwOSwicyI6IjA3YmNkNjg2MmUxMWEwMjU3MDI3ODA0MTUwNmUyMTUzOGZmZDQyZTkiLCJ2IjoxfQ',
  'https://live.staticflickr.com/65535/55422310044_4ba87fc7a5_h.jpg?s=eyJpIjo1NTQyMjMxMDA0NCwiZSI6MTc5MDk5NTA0MywicyI6Ijk4OGFlYTc2YWVhMTllNWJhYTQwODU1ODlkYjc3ZDJlYzg4ODllYzQiLCJ2IjoxfQ',
  'https://live.staticflickr.com/65535/55422528725_850c97a965_h.jpg?s=eyJpIjo1NTQyMjUyODcyNSwiZSI6MTc5MDk5NTA2NywicyI6ImFlODdjZDgzNzVkNzk5NTViZjk0NmI4N2FhODViYTFhZWQxNmIxZjQiLCJ2IjoxfQ',
  'https://live.staticflickr.com/65535/55422264103_66ef771765_h.jpg?s=eyJpIjo1NTQyMjI2NDEwMywiZSI6MTc5MDk5NTA5NywicyI6IjJlN2E1NTk3N2I3NjBmNWJmYzJmZWRiMzE1NzNhYjI2YzkxYWQ5NDIiLCJ2IjoxfQ',
  'https://live.staticflickr.com/65535/55421159982_798e07eeb0_h.jpg?s=eyJpIjo1NTQyMTE1OTk4MiwiZSI6MTc5MDk5NTEyNiwicyI6ImM1NDJmODdmNDY2OTNlZjdlMzY1MjE1OTQzOTIwMDk0YTI1YTI3MjUiLCJ2IjoxfQ',
  'https://live.staticflickr.com/65535/55422309654_8c0d0fd997_h.jpg?s=eyJpIjo1NTQyMjMwOTY1NCwiZSI6MTc5MDk5NTE1NCwicyI6IjY0MDhlMjMyNjI3YjEzYTQzNjUyZDM3OTBlYTE4ZTU1MDE1MGQ3ZjIiLCJ2IjoxfQ',
  'https://live.staticflickr.com/65535/55423159401_3ef4d343ae_h.jpg?s=eyJpIjo1NTQyMzE1OTQwMSwiZSI6MTc5MDk5NTIxOCwicyI6IjMxZmYyYzkyYjFhOWM5Yjc1NWU5MzBkYTk3ODU2MTgzY2UxYTQ5MzEiLCJ2IjoxfQ',
  'https://live.staticflickr.com/65535/55423294098_d023ae1e52_h.jpg?s=eyJpIjo1NTQyMzI5NDA5OCwiZSI6MTc5MDk5NTI1MiwicyI6IjY3YjI0YTUxMGI2YmQ3NzQwZDMyNjBmYjg3ZWNmZmJjOWQ0YzVjMGMiLCJ2IjoxfQ',


];

// ══════════════════════════════════════
// IMAGENS DO TUCUNARÉ
// ══════════════════════════════════════
// Cola aqui os URLs das imagens do tucunaré quando estiverem prontas.
// Deixa o array vazio enquanto não tiveres imagens.
const FOTOS_TUCUNARE: string[] = [
  'https://live.staticflickr.com/65535/54669514660_5a81e3149e_h.jpg?s=eyJpIjo1NDY2OTUxNDY2MCwiZSI6MTc5MDk5NTk3OSwicyI6ImQ4NDY2ZDFlMzM2MmNkMjY4NjA1MDZmYjRhZTJlMzU5NTlkMTI3ZTgiLCJ2IjoxfQ',
  'https://live.staticflickr.com/65535/54669187286_b8b4a26874_h.jpg?s=eyJpIjo1NDY2OTE4NzI4NiwiZSI6MTc5MDk5NTk1MywicyI6ImEwNTcwODcxODJiYmMzN2VlM2NjMzhkMDVjMzY2ZTQ2ZDRlYWFiNjIiLCJ2IjoxfQ',
  'https://live.staticflickr.com/65535/54669513425_9c1c0a1e54_h.jpg?s=eyJpIjo1NDY2OTUxMzQyNSwiZSI6MTc5MDk5NjAxNCwicyI6ImFmMTg0ZDAxNDU2OGE2YTY1ZjVjOWZjY2ZkNjQ2MGRhODg4ZWI2NTAiLCJ2IjoxfQ',
];

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

// ── LIGHTBOX ──
function Lightbox({
  fotos, index, onClose, onPrev, onNext,
}: {
  fotos: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 md:top-8 md:right-8 z-20 p-3 bg-white/10 hover:bg-[#F9C400] hover:text-[#002f40] text-white rounded-full transition-colors"
        aria-label="Fechar"
      >
        <X size={22} />
      </button>

      <div className="absolute top-5 left-5 md:top-8 md:left-8 z-20 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20">
        <span className="text-white text-xs font-bold tracking-widest">
          {index + 1} / {fotos.length}
        </span>
      </div>

      {fotos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-2 sm:left-4 md:left-10 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 bg-white/5 hover:bg-white/20 text-white rounded-full backdrop-blur-md"
            aria-label="Anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-2 sm:right-4 md:right-10 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 bg-white/5 hover:bg-white/20 text-white rounded-full backdrop-blur-md"
            aria-label="Próxima"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div
        className="relative w-full max-w-[90vw] h-[70vh] sm:h-[80vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={fotos[index]}
          alt={`Foto ${index + 1}`}
          fill
          sizes="90vw"
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// PÁGINA
// ══════════════════════════════════════
export default function PescaEsportivaPage() {
  const [lightboxTucunare, setLightboxTucunare] = useState<number | null>(null);
  const [lightboxTorpesaga, setLightboxTorpesaga] = useState<number | null>(null);

  const nextImg = (
    lista: string[],
    idx: number,
    setter: (v: number) => void
  ) => {
    setter((idx + 1) % lista.length);
  };

  const prevImg = (
    lista: string[],
    idx: number,
    setter: (v: number) => void
  ) => {
    setter((idx - 1 + lista.length) % lista.length);
  };

  return (
    <>
      {/* LIGHTBOX TUCUNARÉ */}
      {lightboxTucunare !== null && FOTOS_TUCUNARE.length > 0 && (
        <Lightbox
          fotos={FOTOS_TUCUNARE}
          index={lightboxTucunare}
          onClose={() => setLightboxTucunare(null)}
          onPrev={() => prevImg(FOTOS_TUCUNARE, lightboxTucunare, setLightboxTucunare)}
          onNext={() => nextImg(FOTOS_TUCUNARE, lightboxTucunare, setLightboxTucunare)}
        />
      )}

      {/* LIGHTBOX TORPESAGA */}
      {lightboxTorpesaga !== null && (
        <Lightbox
          fotos={FOTOS_TORPESAGA}
          index={lightboxTorpesaga}
          onClose={() => setLightboxTorpesaga(null)}
          onPrev={() => prevImg(FOTOS_TORPESAGA, lightboxTorpesaga, setLightboxTorpesaga)}
          onNext={() => nextImg(FOTOS_TORPESAGA, lightboxTorpesaga, setLightboxTorpesaga)}
        />
      )}

      <main className={`${inter.className} bg-[#FDFCF7] text-slate-900 min-h-screen`}>

        {/* ══════════════════════════════════════
            HERO — LIMPO
        ══════════════════════════════════════ */}
        <section className="relative h-[80vh] sm:h-[85vh] md:h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src={FOTOS_TORPESAGA[0]}
              alt="Pesca esportiva no Rio Araguaia"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 mt-16 max-w-5xl mx-auto">
            <h1
              className={`${jakarta.className} text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-[0.95]`}
            >
              TOPERSAGA
            </h1>
          </div>

          {/* ONDA */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
            <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
            </svg>
          </div>
        </section>

        {/* ══════════════════════════════════════
            INTRODUÇÃO EMOCIONAL
        ══════════════════════════════════════ */}
        <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6">
          <div className="max-w-[900px] mx-auto text-center">
            <AnimatedSection animation="fade-up">
              <h2
                className={`${jakarta.className} text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-6`}
              >
                O rio que chama.
                <br />
                <span className="italic text-[#009640]">O peixe que responde.</span>
              </h2>

              <p className="text-slate-600 text-base sm:text-lg md:text-xl leading-relaxed">
                Às margens do Rio Araguaia, São Geraldo do Araguaia transformou a pesca esportiva numa experiência turística completa. Aqui, o tucunaré ataca a isca artificial, o sol nasce sobre as praias fluviais e cada arremesso é uma história.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* ══════════════════════════════════════
            O TUCUNARÉ — SECÇÃO RESERVADA PARA IMAGENS
        ══════════════════════════════════════ */}
        <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-white">
          <div className="max-w-[1400px] mx-auto">

            <AnimatedSection animation="fade-up" className="text-center mb-10 md:mb-14">
              <h2
                className={`${jakarta.className} text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-4`}
              >
                O Tucunaré
              </h2>
              <p className="text-slate-500 text-sm sm:text-base md:text-lg font-medium max-w-2xl mx-auto">
                Ágil, agressivo e imprevisível. O peixe dos grandes ataques visuais.
              </p>
            </AnimatedSection>

            {/* ──────────────────────────────────────
                GALERIA DE IMAGENS DO TUCUNARÉ
                → Adiciona os URLs no array FOTOS_TUCUNARE no topo do ficheiro
            ────────────────────────────────────── */}
            {FOTOS_TUCUNARE.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
                {FOTOS_TUCUNARE.map((url, i) => (
                  <AnimatedSection
                    key={i}
                    animation="fade-up"
                    delay={i * 60}
                    className={i === 0 ? 'col-span-2 md:col-span-2 row-span-2' : ''}
                  >
                    <button
                      onClick={() => setLightboxTucunare(i)}
                      className={`relative w-full overflow-hidden rounded-2xl sm:rounded-[1.5rem] bg-slate-100 group cursor-zoom-in shadow-sm hover:shadow-xl transition-all duration-500 ${
                        i === 0 ? 'aspect-square' : 'aspect-square'
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`Tucunaré ${i + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-[1500ms]"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
                    </button>
                  </AnimatedSection>
                ))}
              </div>
            ) : (
              /* Placeholder elegante enquanto não há imagens */
              <AnimatedSection animation="fade-up">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-[#FDFCF7] rounded-2xl sm:rounded-[2rem] p-8 sm:p-12 md:p-16 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#00577C]/5 text-[#00577C] flex items-center justify-center mb-5">
                      <Fish size={32} />
                    </div>
                    <h3 className={`${jakarta.className} text-lg sm:text-xl md:text-2xl font-black text-slate-700 mb-3`}>
                      Imagens em breve
                    </h3>
                    <p className="text-slate-400 text-sm md:text-base font-medium max-w-md leading-relaxed">
                      Estamos a preparar uma galeria de imagens do tucunaré do Rio Araguaia.
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            )}

            {/* Texto sobre o tucunaré */}
            <AnimatedSection animation="fade-up" delay={200}>
              <div className="max-w-3xl mx-auto mt-12 md:mt-16 text-center">
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                  Quando a isca toca a água, tudo pode acontecer. O tucunaré ataca com força, salta e luta — e cada segundo sobre o Rio Araguaia é pura adrenalina. No fim, o peixe volta vivo ao rio. <strong className="text-[#00577C]">O pesque-e-solte é a alma desta pesca.</strong>
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ══════════════════════════════════════
            A EXPERIÊNCIA EM 3 TEMPOS
        ══════════════════════════════════════ */}
        <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-[1400px] mx-auto">
            <AnimatedSection animation="fade-up" className="text-center mb-10 md:mb-14">
              <h2
                className={`${jakarta.className} text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-4`}
              >
                Uma experiência em <span className="italic text-[#009640]">três tempos</span>
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
              {[
                {
                  titulo: 'O Ataque',
                  texto: 'A isca corre na superfície. De repente, a água explode. O tucunaré atacou — e a adrenalina toma conta.',
                  icon: <Target size={24} />,
                  cor: '#00577C',
                },
                {
                  titulo: 'A Briga',
                  texto: 'A vara verga, a linha corre, o peixe luta. Cada segundo é pura emoção sobre o Rio Araguaia.',
                  icon: <Waves size={24} />,
                  cor: '#009640',
                },
                {
                  titulo: 'A Soltura',
                  texto: 'Medido, fotografado e devolvido à água com cuidado. O peixe vive. A memória fica. O rio agradece.',
                  icon: <Leaf size={24} />,
                  cor: '#d4a800',
                },
              ].map((item, i) => (
                <AnimatedSection key={item.titulo} animation="fade-up" delay={i * 120}>
                  <div className="bg-white rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 text-white"
                        style={{ background: item.cor }}
                      >
                        {item.icon}
                      </div>
                      <span
                        className={`${jakarta.className} text-3xl sm:text-4xl font-black num leading-none`}
                        style={{ color: item.cor }}
                      >
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className={`${jakarta.className} text-xl sm:text-2xl font-black text-slate-900 mb-2`}>
                      {item.titulo}
                    </h3>
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
                      {item.texto}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            O RIO
        ══════════════════════════════════════ */}
        <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-white">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <AnimatedSection animation="fade-right">
                <div className="relative w-full aspect-[4/5] rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-2xl">
                  <Image
                    src={FOTOS_TORPESAGA[4]}
                    alt="Rio Araguaia"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#002f40]/60 via-transparent to-transparent" />
                </div>
              </AnimatedSection>

              <AnimatedSection animation="fade-left">
                <h2
                  className={`${jakarta.className} text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-5`}
                >
                  Um rio vivo,
                  <br />
                  <span className="italic text-[#00577C]">sempre diferente.</span>
                </h2>

                <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed mb-6">
                  O Araguaia não é sempre o mesmo. Ao longo do ano, o nível da água sobe e desce, as praias mudam de forma, e os peixes procuram novos abrigos. É isso que torna cada pescaria única.
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    'Pontas de ilhas',
                    'Bocas de lagoas',
                    'Pedras e remansos',
                    'Galhadas',
                    'Barrancos',
                    'Vegetação marginal',
                  ].map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] sm:text-xs font-bold text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            GALERIA TORPESAGA
        ══════════════════════════════════════ */}
        <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-[1400px] mx-auto">
            <AnimatedSection animation="fade-up" className="mb-8 md:mb-12">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#00577C]/5 text-[#00577C] flex items-center justify-center shrink-0">
                  <Camera size={22} />
                </div>
                <div>
                  <h2 className={`${jakarta.className} text-2xl sm:text-3xl md:text-4xl font-black text-slate-900`}>
                    Torpesaga
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm font-black uppercase tracking-widest mt-0.5">
                    Momentos do torneio
                  </p>
                </div>
              </div>
              <div className="h-px bg-slate-200" />
            </AnimatedSection>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {FOTOS_TORPESAGA.map((url, i) => {
                let spanClass = '';
                if (i === 0) spanClass = 'col-span-2 md:col-span-2 row-span-2';
                else if (i === 3) spanClass = 'col-span-2 md:col-span-2';

                return (
                  <AnimatedSection
                    key={i}
                    animation="fade-up"
                    delay={i * 60}
                    className={spanClass}
                  >
                    <button
                      onClick={() => setLightboxTorpesaga(i)}
                      className="relative w-full overflow-hidden rounded-2xl sm:rounded-[1.5rem] bg-slate-100 group cursor-zoom-in shadow-sm hover:shadow-xl transition-all duration-500 aspect-square"
                    >
                      <Image
                        src={url}
                        alt={`Torpesaga ${i + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-[1500ms]"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
                    </button>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>

      </main>
    </>
  );
}