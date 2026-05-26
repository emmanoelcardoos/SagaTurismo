'use client';

import { useEffect, useState, useMemo, useRef, ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Menu, MapPin, ArrowRight, CalendarClock, Search, Star,
  CheckCircle2, ChevronRight, X, ShieldCheck, Filter, Compass, Bed, SlidersHorizontal
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGENS ──
type Pacote = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_principal: string;
  dias: number;
  noites: number;
  preco: number;
  categoria: string;
  ativo: boolean;
};

// ── UTILITÁRIOS ──
const parseValor = (valor: any): number => {
  if (!valor) return 0;
  if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;
  let str = String(valor).replace(/[^\d.,]/g, '');
  if (str.includes('.') && str.includes(',')) str = str.replace(/\./g, '').replace(',', '.');
  else if (str.includes(',')) str = str.replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740";

// ── COMPONENTE DE ANIMAÇÃO REVEAL ──
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

function Reveal({ children, className = "", anim = "up", delay = 0 }: { children: ReactNode; className?: string; anim?: "up" | "left" | "right" | "zoom" | "fade"; delay?: number }) {
  const { ref, isVisible } = useScrollAnimation();
  const hidden: Record<string, string> = {
    up: "opacity-0 translate-y-14",
    left: "opacity-0 translate-x-14",
    right: "opacity-0 -translate-x-14",
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

export default function PacotesPage() {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  // ── ESTADOS DE FILTRO ──
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);

  const categorias = ['Praia', 'Trilha', 'Serra', 'Cachoeira', 'Camping', 'Aventura'];

  useEffect(() => {
    async function fetchPacotes() {
      const { data, error } = await supabase
        .from('pacotes')
        .select('*')
        .eq('ativo', true)
        .order('preco', { ascending: true });

      if (error) console.error('Erro ao buscar pacotes:', error);
      if (data) setPacotes(data);
      setLoading(false);
    }
    fetchPacotes();
  }, []);

  // Carrossel automático
  useEffect(() => {
    if (pacotes.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % pacotes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [pacotes.length]);

  useEffect(() => {
    const handleScroll = () => {
      const cur = window.scrollY;
      setShowHeader(cur < 80 || cur < lastScrollY);
      setLastScrollY(cur);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleCategoria = (cat: string) => {
    setCategoriasSelecionadas(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const limparFiltros = () => {
    setTermoBusca('');
    setCategoriasSelecionadas([]);
    setIsMobileFiltersOpen(false);
  };

  const pacotesFiltrados = useMemo(() => {
    return pacotes.filter(p => {
      const matchesTermo = p.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
                           (p.descricao_curta && p.descricao_curta.toLowerCase().includes(termoBusca.toLowerCase()));
      const matchesCategoria = categoriasSelecionadas.length === 0 || (p.categoria && categoriasSelecionadas.includes(p.categoria));
      return matchesTermo && matchesCategoria;
    });
  }, [pacotes, termoBusca, categoriasSelecionadas]);

  const FiltrosConteudo = () => (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Categorias de Roteiro</p>
        <div className="space-y-4">
          {categorias.map(cat => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={categoriasSelecionadas.includes(cat)}
                onChange={() => toggleCategoria(cat)}
                className="w-5 h-5 rounded-md border-slate-300 text-[#00577C] focus:ring-[#00577C]" 
              />
              <span className="text-sm font-bold text-slate-600 group-hover:text-[#00577C] transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  // Imagem atual do carrossel
  const currentImage = pacotes.length > 0 && currentHeroSlide < pacotes.length
    ? pacotes[currentHeroSlide]?.imagem_principal
    : null;

  return (
    <main className={`${inter.className} min-h-screen flex flex-col bg-[#FDFCF7] text-slate-900`}>

      {/* HEADER */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
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
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Roteiros</Link>
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1">
        {/* HERO SECTION COM CARROSSEL */}
        <section className="relative h-[70vh] min-h-[500px] flex flex-col items-center justify-center overflow-hidden">
          {/* Imagem de fundo com carrossel */}
          {pacotes.length > 0 && pacotes.map((pacote, idx) => (
            <div
              key={pacote.id}
              className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
              style={{ opacity: idx === currentHeroSlide ? 1 : 0 }}
            >
              <Image
                src={pacote.imagem_principal || FALLBACK_IMAGE}
                alt={pacote.titulo}
                fill
                className="object-cover"
                priority={idx === 0}
              />
            </div>
          ))}
          
          {/* Gradiente sobreposto */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#002f40]/80 via-[#00577C]/50 to-[#001f2e]/90 z-0 pointer-events-none" />
          
          {/* Indicadores do carrossel (opcional) */}
          {pacotes.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
              {pacotes.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentHeroSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentHeroSlide ? 'w-8 bg-[#F9C400]' : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Ir para slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Conteúdo textual */}
          <div className="relative z-10 text-center px-5 max-w-5xl mx-auto">
            <Reveal anim="zoom">
              <h1 className={`${jakarta.className} text-4xl sm:text-6xl font-black text-white leading-tight mb-4`}>
                Experiência Completa. <br />
              </h1>
              <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
                Pacotes prontos com hospedagem, guia e passeios incluídos.
              </p>
            </Reveal>

            {/* Search Bar */}
            <Reveal anim="up" delay={100}>
              <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row p-1.5 max-w-4xl mx-auto">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-100">
                  <MapPin className="text-[#00577C] shrink-0" size={18} />
                  <div className="text-left">
                    <p className="text-[9px] font-black uppercase text-slate-400">Destino</p>
                    <p className="font-bold text-sm text-slate-800">São Geraldo do Araguaia - PA</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-3 px-4 py-3">
                  <Search className="text-[#00577C] shrink-0" size={18} />
                  <div className="flex-1 text-left">
                    <p className="text-[9px] font-black uppercase text-slate-400">O que procura?</p>
                    <input 
                      type="text" 
                      placeholder="Ex: Aventura, Natureza, Cultura..." 
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      className="w-full font-bold text-sm text-slate-800 outline-none placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <button className="bg-[#F9C400] hover:bg-[#e5b500] text-[#002f40] px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md">
                  Buscar
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* CONTEÚDO COM FILTROS E LISTAGEM */}
        <section className="mx-auto max-w-7xl px-5 md:px-6 py-12 relative z-20">
          <div className="flex lg:hidden items-center justify-between mb-6">
            <h2 className={`${jakarta.className} text-2xl font-black text-slate-800`}>Pacotes</h2>
            <button onClick={() => setIsMobileFiltersOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-bold text-[#00577C] shadow-sm">
              <SlidersHorizontal size={16} /> Filtros {categoriasSelecionadas.length > 0 && <span className="w-2 h-2 rounded-full bg-[#F9C400]" />}
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* SIDEBAR DESKTOP */}
            <aside className="hidden lg:block w-72 shrink-0 space-y-6 h-fit lg:self-start">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`${jakarta.className} text-lg font-black text-slate-900 flex items-center gap-2`}>
                    <Filter size={18} className="text-[#00577C]" /> Filtros
                  </h3>
                  {categoriasSelecionadas.length > 0 && (
                    <button onClick={limparFiltros} className="text-[9px] font-bold text-slate-400 hover:text-[#00577C] underline">Limpar</button>
                  )}
                </div>
                <FiltrosConteudo />
              </div>
              <div className="bg-[#e6f4ea] border border-[#009640]/20 rounded-2xl p-6 text-center shadow-sm">
                <ShieldCheck className="mx-auto mb-3 text-[#009640]" size={36} />
                <p className="text-sm font-black text-[#009640] mb-1">Turismo Seguro</p>
                <p className="text-xs text-green-800 font-medium leading-relaxed">Pacotes verificados pela Secretaria de Turismo de SGA.</p>
              </div>
            </aside>

            {/* LISTA DE PACOTES */}
            <div className="flex-1 w-full space-y-6 md:space-y-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <Loader2 className="animate-spin text-[#00577C] mb-4" size={40} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando pacotes...</p>
                </div>
              ) : pacotesFiltrados.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <Search size={40} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-base font-bold text-slate-500">Nenhum pacote encontrado.</p>
                  <button onClick={limparFiltros} className="mt-4 text-[#00577C] font-bold underline">Limpar Filtros</button>
                </div>
              ) : (
                pacotesFiltrados.map((pacote, idx) => (
                  <Reveal key={pacote.id} anim="up" delay={idx * 80}>
                    <article className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row overflow-hidden group">
                      <div className="relative w-full h-56 md:w-80 md:h-auto shrink-0 overflow-hidden bg-slate-100">
                        <Image 
                          src={pacote.imagem_principal || FALLBACK_IMAGE} 
                          alt={pacote.titulo} 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute top-4 left-4 bg-[#F9C400] text-[#00577C] px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">
                          {pacote.categoria || 'Pacote'}
                        </div>
                      </div>

                      <div className="p-6 md:p-8 flex flex-col flex-1">
                        
                        <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-[#00577C] leading-tight mb-2 hover:underline`}>
                          <Link href={`/pacotes/${pacote.id}`}>{pacote.titulo}</Link>
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-5 font-medium">
                          {pacote.descricao_curta}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-slate-500 mb-6">
                          <span className="flex items-center gap-1.5 text-[10px] font-bold bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            <CalendarClock size={14} className="text-[#00577C]" /> {pacote.dias} Dias
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] font-bold bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            <Bed size={14} className="text-[#00577C]" /> Hotel
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] font-bold bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            <Compass size={14} className="text-[#00577C]" /> Guia
                          </span>
                        </div>

                        <div className="mt-auto pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Estimativa por pessoa</p>
                            <p className={`${jakarta.className} text-3xl font-black text-[#009640] tabular-nums`}>
                              {formatarMoeda(parseValor(pacote.preco))}
                            </p>
                          </div>
                          <Link 
                            href={`/pacotes/${pacote.id}`} 
                            className="w-full sm:w-auto bg-[#00577C] hover:bg-[#004a6b] text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                          >
                            Ver Detalhes <ChevronRight size={16} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* FILTROS MOBILE */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-10 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <h3 className={`${jakarta.className} text-2xl font-black text-slate-900`}>Filtros</h3>
              <button onClick={() => setIsMobileFiltersOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <FiltrosConteudo />
            </div>
            <div className="pt-4 border-t border-slate-100 mt-6 flex gap-4">
              <button onClick={limparFiltros} className="flex-1 py-4 text-slate-500 font-bold text-sm underline">Limpar</button>
              <button onClick={() => setIsMobileFiltersOpen(false)} className="flex-[2] bg-[#00577C] text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg">
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white">
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
    </main>
  );
}

