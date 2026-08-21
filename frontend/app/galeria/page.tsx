'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { Loader2, X, Maximize2, Camera, ChevronLeft, ChevronRight, MapPin, Menu, ShieldCheck, ChevronDown, UserCircle } from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// ── FONTES PADRÃO ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGEM ──
type Foto = {
  id: string;
  titulo: string;
  imagem_url: string;
  ano: string;
  categoria: string;
};

// ── MOTOR DE ANIMAÇÕES DE SCROLL ──
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

function AnimatedSection({ children, className = "", animation = "fade-up", delay = 0 }: { children: ReactNode; className?: string; animation?: "fade-up" | "fade-left" | "fade-right" | "zoom-in"; delay?: number; }) {
  const { ref, isVisible } = useScrollAnimation();
  let hiddenClass = "opacity-0 translate-y-12";
  if (animation === "fade-left") hiddenClass = "opacity-0 translate-x-12";
  if (animation === "fade-right") hiddenClass = "opacity-0 -translate-x-12";
  if (animation === "zoom-in") hiddenClass = "opacity-0 scale-95";
  
  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0 scale-100" : hiddenClass} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── LIGHTBOX (VISUALIZAÇÃO EM TELA CHEIA) ──
function Lightbox({ lista, indexInicial, onClose }: { lista: Foto[]; indexInicial: number; onClose: () => void; }) {
  const [idx, setIdx] = useState(indexInicial);
  const current = lista[idx];

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i - 1 + lista.length) % lista.length); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i + 1) % lista.length); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + lista.length) % lista.length);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % lista.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lista.length, onClose]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 z-20 p-3 bg-white/10 hover:bg-[#F9C400] hover:text-[#002f40] text-white rounded-full transition-colors">
        <X size={24} />
      </button>

      {lista.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-20 p-4 bg-white/5 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md">
            <ChevronLeft size={32} />
          </button>
          <button onClick={next} className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 z-20 p-4 bg-white/5 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md">
            <ChevronRight size={32} />
          </button>
        </>
      )}

      <div className="relative w-full max-w-[85vw] h-[75vh] md:h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <Image src={current.imagem_url} alt={current.titulo} fill className="object-contain" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
        <p className={`${jakarta.className} text-3xl md:text-4xl font-black text-white mb-2 tracking-tight`}>{current.titulo}</p>
        <div className="flex items-center gap-3 text-[#F9C400] text-[10px] md:text-xs font-bold uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F9C400]" />
          <span>{current.ano}</span>
        </div>
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL DE GALERIA ──
export default function GaleriaPage() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ lista: Foto[]; idx: number } | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  
  // ── CONTROLE DO HEADER ──
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    async function fetchFotos() {
      try {
        const { data, error } = await supabase
          .from('galeria')
          .select('*')
          .order('ano', { ascending: false });
        if (error) throw new Error('Erro ao buscar a galeria.');
        if (data) setFotos(data);
      } catch (err: any) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFotos();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsHeaderSolid(currentScrollY > 80);

      if (currentScrollY < 80) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const fotosAgrupadas = fotos.reduce((acc, foto) => {
    const cat = foto.categoria || 'Outros Registos';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(foto);
    return acc;
  }, {} as Record<string, Foto[]>);

  const categorias = Object.keys(fotosAgrupadas);
  const fotosFiltradas = categoriaAtiva
    ? { [categoriaAtiva]: fotosAgrupadas[categoriaAtiva] }
    : fotosAgrupadas;

  // ── MENU DO HEADER ──
  const menuGroups = [
  { 
    label: 'Descobrir', 
    links: ['Atrativos', 'História', 'Biodiversidade', 'Comunidades', 'Galeria', 'Eventos'] 
  },
  { 
    label: 'Planejar', 
    links: ['Hospedagens', 'Gastronomia', 'Agências', 'Informações', 'CAT'] 
  },
  { 
    label: 'Institucional', 
    links: ['SEMTUR', 'COMTUR', 'Parceiros'] 
  },
];

  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 overflow-x-hidden`}>

      {/* ── HEADER INTELIGENTE TRANSPARENTE ── */}
      <header
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${
          (isHeaderSolid || isHovered || isMobileMenuOpen) 
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' 
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
          <div className="flex-1">
            <Link href="/" className="inline-flex items-center gap-3 transition-all duration-300">
              <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image 
                  src="/logop.png" 
                  alt="SagaTurismo" 
                  fill 
                  className={`object-contain transition-all duration-300 ${
                    (!isHeaderSolid && !isHovered && !isMobileMenuOpen) 
                      ? 'brightness-0 invert' 
                      : ''
                  }`} 
                />
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center justify-center gap-12">
            {menuGroups.map((group) => (
              <div key={group.label} className="relative group py-2">
                <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                  (isHeaderSolid || isHovered || isMobileMenuOpen) 
                    ? 'text-slate-600 group-hover:text-[#00577C]' 
                    : 'text-white group-hover:text-[#F9C400] drop-shadow-md'
                }`}>
                  {group.label} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-2xl p-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50 flex flex-row items-center gap-1">
                  {group.links.map((link) => {
                    const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                    return (
                      <Link key={link} href={path} className={`${jakarta.className} block px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#00577C] hover:bg-slate-50 rounded-xl transition-all whitespace-nowrap`}>
                        {link}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="flex-1 flex justify-end items-center gap-4">
            <Link href="/cadastro"
              className={`hidden lg:inline-flex ${jakarta.className} px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm ${
                (isHeaderSolid || isHovered || isMobileMenuOpen) 
                  ? 'bg-[#F9C400] text-[#002f40]' 
                  : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'
              }`}>
              Residente
            </Link>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`rounded-xl p-2 lg:hidden transition-all duration-300 ${
                (isHeaderSolid || isHovered || isMobileMenuOpen) 
                  ? 'text-[#00577C] hover:bg-slate-100' 
                  : 'text-white hover:bg-white/20'
              }`}>
              {isMobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-6 shadow-2xl lg:hidden z-50 max-h-[85vh] overflow-y-auto">
            {menuGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-3">
                <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.2em] text-[#00577C] border-b border-slate-100 pb-2`}>{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.links.map((link) => {
                    const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                    return (
                      <Link key={link} href={path} onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} font-bold text-slate-700 text-sm bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 hover:text-[#00577C] hover:bg-slate-100 transition-colors`}>
                        {link}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-3">
              <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md`}>
                Cartão Residente
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── LOADER DE TELA CHEIA ── */}
      {loading && (
        <div className="w-full flex flex-col items-center justify-center h-screen bg-[#FDFCF7]">
          <Loader2 className="w-12 h-12 animate-spin text-[#00577C] mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Processando Fotografias...</p>
        </div>
      )}

      {/* ── HERO EDITORIAL (IMAGEM ÚNICA E TEXTO GIGANTE) ── */}
      {!loading && (
        <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/herosections/herogaleria.jpg"
              alt="Galeria de São Geraldo do Araguaia"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
            <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
              Galeria
            </h1>
            <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
              Memórias e paisagens de São Geraldo do Araguaia
            </p>
          </div>

          {/* ── ONDA DE TRANSIÇÃO ── */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
            <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
            </svg>
          </div>
        </section>
      )}

      {/* ── GALERIA IMERSIVA (BENTO / MASONRY STYLE) ── */}
      <section className="max-w-[1400px] mx-auto px-6 py-10 md:py-16">
        
        {/* Filtros em formato de "Pílula" (Soft) */}
        {!loading && categorias.length > 1 && (
          <AnimatedSection animation="fade-up" className="flex flex-wrap items-center justify-center gap-3 mb-20">
            <button
              onClick={() => setCategoriaAtiva(null)}
              className={`${jakarta.className} px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                !categoriaAtiva
                  ? 'bg-[#002f40] text-white shadow-lg'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-[#002f40] hover:text-[#002f40]'
              }`}
            >
              Ver Tudo
            </button>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat === categoriaAtiva ? null : cat)}
                className={`${jakarta.className} px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  categoriaAtiva === cat
                    ? 'bg-[#009640] text-white shadow-lg'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-[#009640] hover:text-[#009640]'
                }`}
              >
                {cat} <span className="opacity-60">({fotosAgrupadas[cat].length})</span>
              </button>
            ))}
          </AnimatedSection>
        )}

        {/* Álbuns Dinâmicos */}
        {erro ? (
          <div className="text-center py-32 text-slate-500 font-bold">{erro}</div>
        ) : fotos.length === 0 && !loading ? (
          <div className="text-center py-32 text-slate-400">
            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className={`${jakarta.className} text-2xl font-black`}>Nenhuma foto encontrada.</p>
          </div>
        ) : (
          <div className="space-y-32">
            {Object.entries(fotosFiltradas).map(([categoria, fotosDaCategoria]) => (
              <div key={categoria}>
                
                {/* Título da Categoria com Estilo Editorial */}
                <AnimatedSection animation="fade-right" className="mb-12 flex items-center gap-6">
                  <h2 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight`}>{categoria}</h2>
                  <div className="h-px flex-1 bg-slate-200" />
                </AnimatedSection>

                {/* Grelha Dinâmica Premium */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {fotosDaCategoria.map((foto, index) => {
                    const isLarge = index % 5 === 0 && fotosDaCategoria.length > 2;

                    return (
                      <AnimatedSection 
                        key={foto.id} 
                        animation="fade-up" 
                        delay={(index % 6) * 100} 
                        className={isLarge ? "md:col-span-2 md:row-span-2" : ""}
                      >
                        <div
                          onClick={() => setLightbox({ lista: fotosDaCategoria, idx: index })}
                          className={`group relative w-full overflow-hidden rounded-[2.5rem] bg-slate-100 cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 ${isLarge ? 'aspect-[4/3] md:aspect-auto md:h-full min-h-[400px]' : 'aspect-[4/5] min-h-[300px]'}`}
                        >
                          <Image
                            src={foto.imagem_url}
                            alt={foto.titulo || categoria}
                            fill
                            className="object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                          />
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-[#002f40]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100">
                            <div className="bg-white/20 backdrop-blur-md p-5 rounded-full text-white border border-white/30">
                              <Maximize2 size={28} />
                            </div>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                            <p className={`${jakarta.className} text-white font-black text-2xl md:text-3xl mb-2 leading-tight drop-shadow-md`}>{foto.titulo}</p>
                            <p className="text-[#F9C400] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 drop-shadow-sm">
                              <MapPin size={14}/> {foto.ano}
                            </p>
                          </div>
                        </div>
                      </AnimatedSection>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-[#FDFCF7] text-left mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de SGA" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1 text-center md:text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                © 2026 Prefeitura Munícipal de São Geraldo do Araguaia - PA
              </p>
              <p className="text-[10px] font-bold text-slate-400/80">
                CNPJ: 10.249.241/0001-22
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* ── RENDERIZAÇÃO DO LIGHTBOX ── */}
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