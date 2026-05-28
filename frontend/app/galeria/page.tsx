'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { Loader2, X, Maximize2, Camera, ChevronLeft, ChevronRight, MapPin, ArrowRight, Menu, ShieldCheck } from 'lucide-react';
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

// ── HERO CARROSSEL (CLEAN, SEM EMBAÇAMENTO) ──
function HeroCarrossel({ fotos }: { fotos: Foto[] }) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const heroFotos = fotos.slice(0, 6); // Usa as primeiras 6 fotos

  const goTo = (idx: number) => {
    if (transitioning || idx === current) return;
    setTransitioning(true);
    setCurrent(idx);
    setTimeout(() => setTransitioning(false), 900);
  };

  const next = () => goTo((current + 1) % heroFotos.length);
  const prev = () => goTo((current - 1 + heroFotos.length) % heroFotos.length);

  useEffect(() => {
    const t = setInterval(next, 8000);
    return () => clearInterval(t);
  }, [current, heroFotos.length]);

  if (heroFotos.length === 0) return null;

  return (
    <section className="relative w-full h-[60vh] md:h-[75vh] min-h-[500px] overflow-hidden bg-slate-100">
      {heroFotos.map((foto, idx) => (
        <div
          key={foto.id}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: idx === current ? 1 : 0, zIndex: idx === current ? 2 : 1 }}
        >
          {/* Imagem nítida, sem overlay escuro pesado em cima */}
          <Image src={foto.imagem_url} alt={foto.titulo} fill className="object-cover" priority={idx === 0} />
          
          {/* Gradiente sútil APENAS na parte de baixo para garantir a leitura do texto */}
          <div className="absolute inset-x-0 bottom-0 h-[100%] bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
      ))}

      <div className="absolute inset-0 z-20 flex flex-col justify-end pb-12 px-6 max-w-[1400px] mx-auto">
        <AnimatedSection animation="fade-right">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-1 w-10 bg-[#F9C400] rounded-full" />
            <span className={`${jakarta.className} text-[#F9C400] text-xs font-black uppercase tracking-[0.2em]`}>
              {heroFotos[current]?.categoria || 'São Geraldo do Araguaia'}
            </span>
          </div>

          <h1 className={`${jakarta.className} text-5xl md:text-7xl lg:text-[80px] font-black text-white leading-tight md:leading-[0.9] mb-6 drop-shadow-lg max-w-4xl`}>
            {heroFotos[current]?.titulo || 'Nossas Memórias'}
          </h1>

          <div className="flex items-center justify-between mt-8 border-t border-white/20 pt-8">
            <div className="flex gap-2">
              {heroFotos.map((_, i) => (
                <button key={i} onClick={() => goTo(i)}
                  className={`transition-all duration-300 rounded-full ${i === current ? 'w-10 h-2 bg-[#F9C400]' : 'w-2 h-2 bg-white/40 hover:bg-white/80'}`} 
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={prev} className="w-12 h-12 rounded-full border border-white/40 hover:bg-white/10 text-white flex items-center justify-center backdrop-blur-sm transition-all">
                <ChevronLeft size={24} />
              </button>
              <button onClick={next} className="w-12 h-12 rounded-full bg-[#00577C] hover:bg-[#004a6b] text-white flex items-center justify-center transition-all shadow-lg">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
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
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center" onClick={onClose}>
      {/* Botão de Fechar */}
      <button onClick={onClose} className="absolute top-6 right-6 z-20 p-3 bg-white/10 hover:bg-[#F9C400] hover:text-[#002f40] text-white rounded-full transition-colors">
        <X size={24} />
      </button>

      {/* Navegação */}
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

      {/* Imagem em Destaque */}
      <div className="relative w-full max-w-[80vw] h-[70vh] md:h-[80vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <Image src={current.imagem_url} alt={current.titulo} fill className="object-contain" />
      </div>

      {/* Informações da Imagem */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
        <p className={`${jakarta.className} text-2xl md:text-3xl font-black text-white mb-2`}>{current.titulo}</p>
        <div className="flex items-center gap-3 text-[#F9C400] text-[10px] md:text-xs font-bold uppercase tracking-widest">
          <span className="w-1 h-1 rounded-full bg-[#F9C400]" />
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Agrupar fotos e categorias
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

  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900`}>

      {/* ── HEADER ORIGINAL FORNECIDO ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                {/* Removido o filtro invertido para manter as cores originais da logo */}
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Roteiros','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`} className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
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
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas Turísticas</Link>
            <Link href="/eventos" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Agenda Cultural</Link>
            <Link href="/pacotes" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Pacotes</Link>
            <Link href="/roteiro" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Roteiros</Link>
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* ── HERO (SEM EMBAÇAMENTO) ── */}
      {!loading && fotos.length > 0 && <HeroCarrossel fotos={fotos} />}
      
      {loading && (
        <div className="w-full flex items-center justify-center h-[60vh] bg-slate-50">
          <Loader2 className="w-12 h-12 animate-spin text-[#00577C]" />
        </div>
      )}

      {/* ── ESTATÍSTICAS ── */}
      {!loading && fotos.length > 0 && (
        <section className="bg-white border-b border-slate-100 py-10 px-6">
          <div className="max-w-[1400px] mx-auto flex flex-wrap justify-start gap-12 md:gap-24">
            {[
              { valor: fotos.length, label: 'Registros Fotográficos' },
              { valor: categorias.length, label: 'Categorias Culturais' },
              { valor: [...new Set(fotos.map(f => f.ano))].length, label: 'Anos Documentados' },
            ].map(({ valor, label }) => (
              <div key={label}>
                <p className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#00577C] leading-none`}>
                  {String(valor).padStart(2, '0')}
                </p>
                <p className={`${jakarta.className} text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2`}>{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── GALERIA IMERSIVA (BENTO / MASONRY STYLE) ── */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        
        {/* Filtros em formato de "Pílula" (Pills) Minimalistas */}
        {!loading && categorias.length > 1 && (
          <AnimatedSection animation="fade-up" className="flex flex-wrap gap-3 mb-16">
            <button
              onClick={() => setCategoriaAtiva(null)}
              className={`${jakarta.className} px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                !categoriaAtiva
                  ? 'bg-[#00577C] text-white shadow-md'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-[#00577C] hover:text-[#00577C]'
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
                    ? 'bg-[#009640] text-white shadow-md'
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
            <p className={`${jakarta.className} text-2xl font-bold`}>Galeria Vazia</p>
          </div>
        ) : (
          <div className="space-y-32">
            {Object.entries(fotosFiltradas).map(([categoria, fotosDaCategoria]) => (
              <div key={categoria}>
                
                {/* Título da Categoria */}
                <AnimatedSection animation="fade-right" className="mb-10 flex items-center gap-6">
                  <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900`}>{categoria}</h2>
                  <div className="h-px flex-1 bg-slate-200" />
                </AnimatedSection>

                {/* Grelha Dinâmica (Sem bordas brancas, puro foco na imagem) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fotosDaCategoria.map((foto, index) => {
                    // Magia do Bento Grid: Algumas fotos ocupam 2 colunas e 2 linhas para dar dinamismo
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
                          className={`group relative w-full overflow-hidden rounded-[2rem] bg-slate-100 cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 ${isLarge ? 'aspect-[4/3] md:aspect-auto md:h-full min-h-[400px]' : 'aspect-[4/5] min-h-[300px]'}`}
                        >
                          <Image
                            src={foto.imagem_url}
                            alt={foto.titulo || categoria}
                            fill
                            className="object-cover transition-transform duration-1000 group-hover:scale-110"
                          />
                          
                          {/* Overlay de Interação (Surge no Hover) */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#002f40]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100">
                            <div className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white">
                              <Maximize2 size={24} />
                            </div>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                            <p className={`${jakarta.className} text-white font-black text-2xl mb-1`}>{foto.titulo}</p>
                            <p className="text-[#F9C400] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                              <MapPin size={12}/> {foto.ano}
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

      {/* ── FOOTER PREMIUM ── */}
      {/* FOOTER INSTITUCIONAL */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left">
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