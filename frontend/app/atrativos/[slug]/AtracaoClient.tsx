// app/atrativos/[id]/AtracaoClient.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export type Atracao = {
  id: string;
  slug: string;
  nome: string;
  tipo: string;
  descricao: string;
  imagem_url: string;
  preco_entrada?: string | number;
  whatsapp?: string;
  instagram?: string;
  link_google_maps?: string;
  link_hospedagem?: string;
  galeria?: any;
};

export type PontoInteresse = {
  id: string;
  titulo: string;
  tipo: string;
  imagem_url: string;
  atracao_destino_id?: string;
};

const parseGaleria = (galeriaRaw: any): string[] => {
  if (!galeriaRaw) return [];
  if (Array.isArray(galeriaRaw)) return galeriaRaw;
  if (typeof galeriaRaw === 'string') {
    try { return JSON.parse(galeriaRaw); } catch (e) { return []; }
  }
  return [];
};

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
      className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : hidden[anim]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Lightbox({
  fotos, index, onClose, onPrev, onNext,
}: {
  fotos: string[]; index: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
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
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Visualização da imagem"
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 md:top-8 md:right-8 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
        aria-label="Fechar"
      >
        <X size={22} />
      </button>

      <div className="absolute top-5 left-5 md:top-8 md:left-8 z-10 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20">
        <span className="text-white text-xs font-bold tracking-widest">
          {index + 1} / {fotos.length}
        </span>
      </div>

      <div
        className="relative w-full h-full max-w-[90vw] max-h-[85vh] mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={fotos[index]}
          alt={`Imagem ${index + 1}`}
          fill
          sizes="90vw"
          className="object-contain"
          priority
        />
      </div>

      {fotos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
            aria-label="Imagem anterior"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
            aria-label="Próxima imagem"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}
    </div>
  );
}

export default function AtracaoClient({
  atracao,
  pontos,
}: {
  atracao: Atracao;
  pontos: PontoInteresse[];
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const formatInstagramUrl = (instagram: string) => {
    let username = instagram.trim();
    if (username.startsWith('@')) username = username.substring(1);
    if (username.startsWith('http://') || username.startsWith('https://')) return username;
    return `https://instagram.com/${username}`;
  };

  const fotosGaleria = parseGaleria(atracao.galeria);

  const abrirLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => setLightboxIndex((i) => (i + 1) % fotosGaleria.length);
  const prevImage = () => setLightboxIndex((i) => (i - 1 + fotosGaleria.length) % fotosGaleria.length);

  return (
    <>
      {lightboxOpen && fotosGaleria.length > 0 && (
        <Lightbox
          fotos={fotosGaleria}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}

      <main className={`${inter.className} relative text-slate-900 bg-[#FDFCF7] flex flex-col min-h-screen w-full`}>

        {/* HERO */}
        <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src={atracao.imagem_url}
              alt={`${atracao.nome} — ${atracao.tipo ?? 'São Geraldo do Araguaia'}`}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
            <h1 className={`${jakarta.className} text-[3.5rem] sm:text-[4.5rem] md:text-[5rem] lg:text-[6rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
              {atracao.nome}
            </h1>
            {atracao.tipo && (
              <p className="mt-6 text-white/80 font-bold text-xs md:text-sm uppercase tracking-[0.2em] drop-shadow-md">
                {atracao.tipo}
              </p>
            )}
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20">
            <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
            </svg>
          </div>
        </section>

        {/* CONTEÚDO */}
        <section className="max-w-[900px] mx-auto px-6 py-12 md:py-16 w-full relative z-20">
          <Reveal anim="up">
            <Link href="/atrativos" className="text-[#00577C] hover:text-[#003d57] transition-colors mb-10 inline-block font-medium text-sm md:text-base underline underline-offset-4 decoration-slate-200 hover:decoration-[#00577C]">
              &larr; Voltar para atrativos
            </Link>

            <div className="text-slate-700 leading-relaxed text-base md:text-lg whitespace-pre-wrap mb-12">
              {atracao.descricao || 'Detalhes e informações sobre esta atração em breve.'}
            </div>

            <div className="flex flex-col gap-4 text-sm md:text-base text-slate-800">
              {atracao.tipo && (
                <p><strong>Categoria:</strong> {atracao.tipo}</p>
              )}

              {atracao.preco_entrada !== undefined && (
                <p>
                  <strong>Entrada:</strong> {Number(atracao.preco_entrada) > 0 ? `R$ ${Number(atracao.preco_entrada).toFixed(2)}` : 'Gratuito'}
                </p>
              )}

              {atracao.whatsapp && (
                <p>
                  <strong>Telefone:</strong> <a href={`https://wa.me/55${atracao.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[#00577C] font-semibold hover:underline decoration-slate-300 underline-offset-4">{atracao.whatsapp}</a>
                </p>
              )}

              {atracao.link_google_maps && (
                <p>
                  <strong>Localização:</strong> <a href={atracao.link_google_maps} target="_blank" rel="noopener noreferrer" className="text-[#00577C] font-semibold hover:underline decoration-slate-300 underline-offset-4">Ver no mapa</a>
                </p>
              )}

              {atracao.instagram && (
                <p>
                  <strong>Site:</strong> <a href={formatInstagramUrl(atracao.instagram)} target="_blank" rel="noopener noreferrer" className="text-[#00577C] font-semibold hover:underline decoration-slate-300 underline-offset-4">Instagram</a>
                </p>
              )}

              {atracao.link_hospedagem && (
                <p className="mt-4">
                  Planeje seus passeios com as melhores <strong>agências de turismo</strong>, descubra a <strong>gastronomia</strong> local e encontre os <Link href={atracao.link_hospedagem} className="text-[#00577C] font-semibold hover:underline decoration-slate-300 underline-offset-4">hotéis e pousadas</Link> para sua hospedagem.
                </p>
              )}
            </div>
          </Reveal>
        </section>

        {/* PONTOS DE INTERESSE */}
        {pontos.length > 0 && (
          <section className="max-w-[1400px] mx-auto w-full px-6 mb-16">
            <Reveal anim="up">
              <h2 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 mb-8 border-b border-slate-200 pb-4`}>
                O que você encontra aqui
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pontos.map((ponto) => {
                  const linkDestino = ponto.atracao_destino_id ? `/atrativos/${ponto.atracao_destino_id}` : `/atrativos/${ponto.id}`;

                  return (
                    <Link href={linkDestino} key={ponto.id} className="relative h-[300px] md:h-[380px] rounded-[2.5rem] overflow-hidden group shadow-md border border-slate-100 block">
                      <Image
                        src={ponto.imagem_url || atracao.imagem_url}
                        alt={ponto.titulo}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/30 to-transparent" />

                      <div className="absolute top-6 left-6 z-10">
                        <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-sm">
                          {ponto.tipo}
                        </span>
                      </div>

                      <div className="absolute bottom-8 left-8 right-8 z-10 flex flex-col gap-3">
                        <h3 className={`${jakarta.className} text-white text-2xl md:text-3xl font-black leading-tight drop-shadow-md`}>
                          {ponto.titulo}
                        </h3>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Reveal>
          </section>
        )}

        {/* GALERIA */}
        {fotosGaleria.length > 0 && (
          <section className="max-w-[1400px] mx-auto w-full px-6 mb-24">
            <Reveal anim="up">
              <h2 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 mb-8 border-b border-slate-200 pb-4`}>
                Galeria
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {fotosGaleria.map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => abrirLightbox(i)}
                    className="relative rounded-[2rem] overflow-hidden aspect-[4/3] group shadow-sm bg-slate-100 border border-slate-100 cursor-zoom-in focus:outline-none focus:ring-4 focus:ring-[#00577C]/30 transition-shadow"
                    aria-label={`Abrir imagem ${i + 1} em ecrã completo`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Galeria ${atracao.nome} ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </button>
                ))}
              </div>
            </Reveal>
          </section>
        )}

      </main>
    </>
  );
}