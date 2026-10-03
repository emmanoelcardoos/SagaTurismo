'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import {
  Loader2, AlertCircle, X, ChevronLeft, ChevronRight, MapPin,
  Camera, Clock, Mountain, Users, ShieldCheck, Compass,
  Route, CalendarDays, Ticket, Info, Footprints, ArrowLeft, ArrowRight,
  Image as ImageIcon, Map as MapIcon, Briefcase
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// ── FONTES ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPOS ──
type Roteiro = {
  id: string;
  titulo: string;
  slug?: string;
  descricao_curta: string;
  descricao_completa?: string;
  imagem_url: string;
  galeria?: any;

  necessidade_guia?: boolean;
  tipo_guia?: string;
  tempo_estimado?: string;
  distancia_km?: number;
  dificuldade?: string;
  tipo_percurso?: string;
  melhor_epoca?: string;
  faixa_etaria?: string;
  tamanho_grupo_max?: number;
  acessibilidade?: string;

  categoria?: string;
  tags?: any;

  link_google_maps?: string;
  whatsapp_guia?: string;
  link_agencia?: string;
  preco_estimado?: number;

  ordem?: number;
};

type PontoRoteiro = {
  id: string;
  titulo: string;
  descricao?: string;
  tipo?: string;
  imagem_url?: string;
  ordem?: number;
  duracao_minutos?: number;
  link_google_maps?: string;
};

type Agencia = {
  id: string;
  nome: string;
  descricao_curta?: string;
  capa_url?: string;
  logo_url?: string;
  cadastur?: string;
  endereco?: string;
  instagram?: string;
  whatsapp?: string;
  telefone?: string;
};

// ── UTILS ──
const parseGaleria = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
};

const parseTags = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
};

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
  lista,
  indexInicial,
  onClose,
}: {
  lista: string[];
  indexInicial: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(indexInicial);
  const current = lista[idx];

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i - 1 + lista.length) % lista.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i + 1) % lista.length);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + lista.length) % lista.length);
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % lista.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lista.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 p-3 bg-white/10 hover:bg-[#F9C400] hover:text-[#002f40] text-white rounded-full transition-colors"
      >
        <X size={22} />
      </button>

      {lista.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 md:left-10 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 bg-white/5 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 md:right-10 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 bg-white/5 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div
        className="relative w-full max-w-[95vw] sm:max-w-[90vw] h-[60vh] sm:h-[70vh] md:h-[80vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image src={current} alt={`Imagem ${idx + 1}`} fill sizes="90vw" className="object-contain" priority />
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// CARD DE AGÊNCIA (compacto)
// ══════════════════════════════════════
function AgenciaCard({ agencia, index }: { agencia: Agencia; index: number }) {
  const FALLBACK = 'https://live.staticflickr.com/65535/54594015350_8cd6612923_4k.jpg';
  const imagem = agencia.logo_url || agencia.capa_url || FALLBACK;

  return (
    <AnimatedSection animation="fade-up" delay={index * 80}>
      <article className="bg-white rounded-[1.75rem] sm:rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col overflow-hidden group h-full">
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100 shrink-0">
          <Image
            src={imagem}
            alt={agencia.nome}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-[2000ms] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent pointer-events-none" />
        </div>

        <div className="p-5 sm:p-6 md:p-7 flex-1 flex flex-col">
          <h3 className={`${jakarta.className} text-lg sm:text-xl md:text-2xl font-black text-slate-900 mb-2 leading-tight line-clamp-2`}>
            {agencia.nome}
          </h3>

          {agencia.cadastur && (
            <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider">
              Cadastur <span className="text-[#00577C] font-black">{agencia.cadastur}</span>
            </p>
          )}

          <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed line-clamp-2 mb-4">
            {agencia.descricao_curta || 'Operador turístico credenciado do município.'}
          </p>

          <div className="mt-auto flex flex-col gap-2 text-xs text-slate-600 font-medium border-t border-slate-100 pt-4">
            {agencia.endereco && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agencia.nome} ${agencia.endereco} São Geraldo do Araguaia PA`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 hover:text-[#00577C] transition-colors"
              >
                <MapPin size={14} className="text-[#00577C] shrink-0 mt-0.5" />
                <span className="line-clamp-1">{agencia.endereco}</span>
              </a>
            )}

            {agencia.whatsapp && (
              <a
                href={`https://wa.me/55${agencia.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#25D366] transition-colors"
              >
                <span className="w-3.5 h-3.5 flex items-center justify-center bg-[#25D366]/10 rounded-full shrink-0">
                  <svg className="w-2.5 h-2.5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.383 0 0 5.383 0 12.031c0 2.124.553 4.195 1.604 6.012L.15 24l6.103-1.601a11.964 11.964 0 005.778 1.488h.004c6.648 0 12.031-5.383 12.031-12.031S18.679 0 12.031 0zM12.035 21.84c-1.784 0-3.535-.481-5.07-1.388l-.363-.214-3.766.986.999-3.666-.235-.374a9.986 9.986 0 01-1.528-5.353c0-5.522 4.492-10.015 10.015-10.015 5.523 0 10.016 4.493 10.016 10.015 0 5.523-4.493 10.016-10.016 10.016z"/></svg>
                </span>
                <span>{agencia.whatsapp}</span>
              </a>
            )}

            {agencia.instagram && (
              <a
                href={`https://instagram.com/${agencia.instagram.replace('https://instagram.com/', '').replace('@', '').replace('/', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00577C] font-bold hover:text-[#F9C400] transition-colors underline underline-offset-4 decoration-slate-200"
              >
                Instagram
              </a>
            )}
          </div>
        </div>
      </article>
    </AnimatedSection>
  );
}

// ══════════════════════════════════════
// PÁGINA
// ══════════════════════════════════════
export default function RoteiroDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [rota, setRota] = useState<Roteiro | null>(null);
  const [pontos, setPontos] = useState<PontoRoteiro[]>([]);
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [lightbox, setLightbox] = useState<{ lista: string[]; idx: number } | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      // 1. Roteiro
      const { data: rotaData, error: rotaError } = await supabase
        .from('roteiros_turisticos')
        .select('*')
        .eq('id', id)
        .single();

      if (rotaError || !rotaData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setRota(rotaData as Roteiro);

      // 2. Pontos do roteiro
      const { data: pontosData } = await supabase
        .from('roteiros_turisticos_pontos')
        .select('*')
        .eq('roteiro_id', id)
        .order('ordem', { ascending: true });

      if (pontosData) setPontos(pontosData as PontoRoteiro[]);

      // 3. Agências parceiras
      const { data: agenciasData } = await supabase
        .from('agencias')
        .select('*')
        .eq('ativo', true)
        .order('nome')
        .limit(6);

      if (agenciasData) setAgencias(agenciasData as Agencia[]);

      setLoading(false);
    }
    fetchData();
  }, [id]);

  // ── LOADING ──
  if (loading)
    return (
      <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center`}>
        <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-[#00577C] mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Preparando roteiro...
        </p>
      </div>
    );

  // ── 404 ──
  if (notFound || !rota)
    return (
      <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center text-center px-6 gap-5`}>
        <AlertCircle size={56} className="text-slate-300 mb-2" />
        <h1 className={`${jakarta.className} text-2xl sm:text-3xl md:text-4xl font-black text-slate-800`}>
          Roteiro não encontrado
        </h1>
        <p className="text-slate-500 max-w-md text-sm sm:text-base">
          Este roteiro pode ter sido removido ou o link está incorreto.
        </p>
        <Link
          href="/roteiros"
          className="inline-flex items-center gap-2 bg-[#00577C] text-white px-6 py-3 rounded-full font-black text-[10px] sm:text-xs uppercase tracking-widest mt-2 shadow-md hover:bg-[#004a6b] transition-colors"
        >
          <ArrowLeft size={14} /> Voltar para Roteiros
        </Link>
      </div>
    );

  // ── DADOS DERIVADOS ──
  const genericImage = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09';
  let galeriaImagens = parseGaleria(rota.galeria).filter(Boolean);
  if (galeriaImagens.length === 0 && rota.imagem_url) {
    galeriaImagens = [rota.imagem_url];
  }

  const tags = parseTags(rota.tags);
  const descricaoLonga = rota.descricao_completa?.trim() || null;

  const tempo = rota.tempo_estimado || 'Não informado';
  const dificuldade = rota.dificuldade || 'Não informada';
  const grupo = rota.tamanho_grupo_max ? `${rota.tamanho_grupo_max} pessoas` : 'Sem limite';
  const guia = rota.tipo_guia || (rota.necessidade_guia ? 'Recomendado' : 'Não necessário');
  const tipoPercurso = rota.tipo_percurso || 'Não informado';
  const melhorEpoca = rota.melhor_epoca || 'Todo o ano';
  const distancia = rota.distancia_km ? `${rota.distancia_km} km` : null;

  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900`}>

      {/* ══════════════════════════════════════
          HERO EDITORIAL (MOBILE-FIRST)
      ══════════════════════════════════════ */}
      <section className="relative h-[75vh] sm:h-[80vh] md:h-[90vh] min-h-[450px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={rota.imagem_url || genericImage}
            alt={rota.titulo}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            {rota.titulo}
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
          MÉTRICAS (MOBILE-FIRST)
      ══════════════════════════════════════ */}
      <section className="py-10 sm:py-14 md:py-20 px-4 sm:px-6 bg-[#FDFCF7]">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[
              { label: 'Duração', icon: <Clock size={20} />, valor: tempo, cor: '#00577C' },
              { label: 'Dificuldade', icon: <Mountain size={20} />, valor: dificuldade, cor: '#009640' },
              { label: 'Grupo', icon: <Users size={20} />, valor: grupo, cor: '#d4a800' },
              { label: 'Guia', icon: <ShieldCheck size={20} />, valor: guia, cor: '#002f40' },
            ].map((item, i) => (
              <AnimatedSection key={item.label} animation="fade-up" delay={i * 100}>
                <div className="bg-white rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-4 sm:p-5 md:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col items-center text-center">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-3 md:mb-4"
                    style={{ background: `${item.cor}10`, color: item.cor }}
                  >
                    {item.icon}
                  </div>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 md:mb-2">
                    {item.label}
                  </p>
                  <p className={`${jakarta.className} text-sm sm:text-base md:text-xl font-black text-slate-800 leading-tight`}>
                    {item.valor}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SOBRE O ROTEIRO + SIDEBAR
      ══════════════════════════════════════ */}
      <section className="pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6 bg-[#FDFCF7]">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 md:gap-10">
          {/* Coluna Esquerda */}
          <AnimatedSection animation="fade-up" className="lg:col-span-8">
            <div className="bg-white rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-7 md:p-12 border border-slate-100 shadow-sm">

              <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#00577C]/5 text-[#00577C] flex items-center justify-center shrink-0">
                  <Compass size={22} />
                </div>
                <h2 className={`${jakarta.className} text-xl sm:text-2xl md:text-4xl font-black text-slate-900`}>
                  Sobre o Roteiro
                </h2>
              </div>

              <div className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                {descricaoLonga ? (
                  descricaoLonga.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-3 md:mb-4">{paragraph}</p>
                  ))
                ) : (
                  <div className="italic text-slate-400 border-l-4 border-[#00577C] pl-4 md:pl-6 py-2 text-sm">
                    Este roteiro ainda está a ser estudado pela nossa equipa. Em breve, mais detalhes serão disponibilizados.
                  </div>
                )}
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6 md:mt-10 pt-6 md:pt-10 border-t border-slate-100">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1.5 md:px-5 md:py-2.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-slate-50 border border-slate-200 text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── TIMELINE — A SUA JORNADA ── */}
            {pontos.length > 0 && (
              <div className="bg-white rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-7 md:p-12 border border-slate-100 shadow-sm mt-6 md:mt-10">
                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#009640]/5 text-[#009640] flex items-center justify-center shrink-0">
                    <Route size={22} />
                  </div>
                  <h2 className={`${jakarta.className} text-xl sm:text-2xl md:text-4xl font-black text-slate-900`}>
                    A sua Jornada
                  </h2>
                </div>

                <div className="relative pl-6 md:pl-8 border-l-2 border-slate-100 space-y-6 md:space-y-10">
                  {pontos.map((ponto, index) => (
                    <AnimatedSection key={ponto.id} animation="fade-up" delay={index * 100}>
                      <div className="relative group">
                        <div className="absolute -left-[31px] md:-left-[39px] top-1.5 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125 bg-[#F9C400]" />
                        <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2 flex-wrap">
                          <p className={`${jakarta.className} font-black text-slate-800 text-sm sm:text-base md:text-lg`}>
                            {ponto.titulo}
                          </p>
                          {ponto.tipo && (
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-[#00577C] bg-[#00577C]/10 px-2 py-0.5 md:px-2.5 md:py-1 rounded">
                              {ponto.tipo}
                            </span>
                          )}
                          {ponto.duracao_minutos && (
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-400">
                              ~{ponto.duracao_minutos} min
                            </span>
                          )}
                        </div>
                        {ponto.descricao && (
                          <p className="text-slate-500 font-medium leading-relaxed max-w-2xl text-xs sm:text-sm md:text-base">
                            {ponto.descricao}
                          </p>
                        )}
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            )}
          </AnimatedSection>

          {/* Coluna Direita (Sidebar) */}
          <aside className="lg:col-span-4 space-y-4 md:space-y-6">

            {/* Box: Informações */}
            <AnimatedSection animation="fade-left" delay={150}>
              <div className="bg-white rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-7 md:p-10 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#00577C]/5 text-[#00577C] flex items-center justify-center shrink-0">
                    <Info size={20} />
                  </div>
                  <h3 className={`${jakarta.className} text-lg sm:text-xl md:text-2xl font-black text-slate-900`}>
                    Informações
                  </h3>
                </div>

                <div className="space-y-4 md:space-y-5 text-sm">
                  {distancia && (
                    <div className="flex items-start gap-3">
                      <Footprints size={15} className="text-[#00577C] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Distância</p>
                        <p className="text-slate-700 font-bold text-xs sm:text-sm">{distancia}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Route size={15} className="text-[#00577C] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tipo de Percurso</p>
                      <p className="text-slate-700 font-bold text-xs sm:text-sm">{tipoPercurso}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays size={15} className="text-[#00577C] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Melhor Época</p>
                      <p className="text-slate-700 font-bold text-xs sm:text-sm">{melhorEpoca}</p>
                    </div>
                  </div>
                  {rota.faixa_etaria && (
                    <div className="flex items-start gap-3">
                      <Users size={15} className="text-[#00577C] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Faixa Etária</p>
                        <p className="text-slate-700 font-bold text-xs sm:text-sm">{rota.faixa_etaria}</p>
                      </div>
                    </div>
                  )}
                  {rota.acessibilidade && (
                    <div className="flex items-start gap-3">
                      <ShieldCheck size={15} className="text-[#00577C] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Acessibilidade</p>
                        <p className="text-slate-700 font-bold text-xs sm:text-sm">{rota.acessibilidade}</p>
                      </div>
                    </div>
                  )}
                  {rota.preco_estimado !== undefined && (
                    <div className="flex items-start gap-3">
                      <Ticket size={15} className="text-[#00577C] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Preço Estimado</p>
                        <p className="text-slate-700 font-bold text-xs sm:text-sm">
                          {Number(rota.preco_estimado) > 0
                            ? `R$ ${Number(rota.preco_estimado).toFixed(2)}`
                            : 'Gratuito'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </AnimatedSection>

            {/* Box: Como Chegar */}
            {(rota.link_google_maps || rota.whatsapp_guia) && (
              <AnimatedSection animation="fade-left" delay={250}>
                <div className="bg-white rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-7 md:p-10 border border-slate-100 shadow-sm flex flex-col gap-4 md:gap-5">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#009640]/5 text-[#009640] flex items-center justify-center shrink-0">
                      <MapPin size={20} />
                    </div>
                    <h3 className={`${jakarta.className} text-lg sm:text-xl md:text-2xl font-black text-slate-900`}>
                      Como Chegar
                    </h3>
                  </div>

                  {rota.link_google_maps && (
                    <a
                      href={rota.link_google_maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block w-full h-28 sm:h-32 md:h-36 rounded-xl md:rounded-2xl overflow-hidden group border border-slate-200 shadow-sm"
                    >
                      <Image
                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b"
                        alt="Mapa"
                        fill
                        sizes="400px"
                        className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white text-slate-800 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 group-hover:-translate-y-1 transition-transform">
                          <MapIcon size={13} className="text-[#00577C]" /> Ponto de Partida
                        </span>
                      </div>
                    </a>
                  )}

                  <div className="pt-4 md:pt-6 border-t border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-slate-400">
                      Informações SEMTUR
                    </p>
                    <p className="text-slate-600 text-xs sm:text-sm font-bold">
                      {rota.whatsapp_guia || '(94) 98145-2067'}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            )}

          </aside>
        </div>
      </section>

      {/* ══════════════════════════════════════
          GALERIA (BENTO / PREMIUM — MOBILE-FIRST)
      ══════════════════════════════════════ */}
      {galeriaImagens.length > 0 && (
        <section className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 pb-16 sm:pb-20 md:pb-24">
          <AnimatedSection animation="fade-right" className="mb-6 md:mb-12 flex items-center gap-3 md:gap-6">
            <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#00577C]/5 text-[#00577C] flex items-center justify-center shrink-0">
              <ImageIcon size={20} />
            </div>
            <h2 className={`${jakarta.className} text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 tracking-tight`}>
              Galeria
            </h2>
            <div className="h-px flex-1 bg-slate-200" />
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 lg:gap-8">
            {galeriaImagens.map((imgUrl, index) => {
              const isLarge = index % 5 === 0 && galeriaImagens.length > 2;

              return (
                <AnimatedSection
                  key={index}
                  animation="fade-up"
                  delay={(index % 6) * 100}
                  className={isLarge ? 'col-span-2 md:col-span-2 md:row-span-2' : ''}
                >
                  <div
                    onClick={() => setLightbox({ lista: galeriaImagens, idx: index })}
                    className={`group relative w-full overflow-hidden rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] bg-slate-100 cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 ${
                      isLarge
                        ? 'aspect-[16/10] md:aspect-auto md:h-full min-h-[200px] md:min-h-[400px]'
                        : 'aspect-square md:aspect-[4/5]'
                    }`}
                  >
                    <Image
                      src={imgUrl || genericImage}
                      alt={`Galeria ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#002f40]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100">
                      <div className="bg-white/20 backdrop-blur-md p-3 md:p-5 rounded-full text-white border border-white/30">
                        <Camera size={20} className="md:w-7 md:h-7" />
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          AGÊNCIAS PARCEIRAS (CARDS CENTRALIZADOS)
      ══════════════════════════════════════ */}
      {agencias.length > 0 && (
        <section className="px-4 sm:px-6 pb-20 sm:pb-24 md:pb-32">
          <div className="max-w-[1400px] mx-auto">

            {/* Cabeçalho: título + botão subtil "Conhecer mais" */}
            <AnimatedSection animation="fade-up">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-12 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#00577C]/5 text-[#00577C] flex items-center justify-center shrink-0">
                    <Briefcase size={22} />
                  </div>
                  <div>
                    <h2 className={`${jakarta.className} text-2xl sm:text-3xl md:text-4xl font-black text-slate-900`}>
                      Agências Parceiras
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                      Operadores credenciados que podem guiar este roteiro
                    </p>
                  </div>
                </div>

                <Link
                  href="/agencias"
                  className="group inline-flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#00577C] hover:text-[#003d57] transition-colors self-start sm:self-auto shrink-0"
                >
                  Conhecer mais agências
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </AnimatedSection>

            {/* Grid de cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
              {agencias.map((agencia, i) => (
                <AgenciaCard key={agencia.id} agencia={agencia} index={i} />
              ))}
            </div>

          </div>
        </section>
      )}

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <Lightbox
          lista={lightbox.lista}
          indexInicial={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}
    </main>
  );
}