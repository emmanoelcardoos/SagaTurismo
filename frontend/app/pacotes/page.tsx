'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Menu, MapPin, ArrowRight,
  CalendarClock, Search, Star, 
  CheckCircle2, ChevronRight, X, 
  ShieldCheck, Filter, Compass, Bed, SlidersHorizontal
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
  valor_total?: number;
  categoria: string;
  pacote_itens: any[];
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

export default function PacotesPage() {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // ── ESTADOS DE FILTRO ──
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);

  const categorias = ['Praia', 'Trilha', 'Serra', 'Cachoeira', 'Camping', 'Aventura'];

  useEffect(() => {
    async function fetchPacotes() {
      const { data } = await supabase
        .from('pacotes')
        .select(`
          *,
          pacote_itens (
            hoteis ( preco_medio, quarto_standard_preco ),
            guias ( preco_diaria ),
            atracoes ( preco_entrada )
          )
        `)
        .eq('ativo', true);

      if (data) {
        const processados = data.map((p: any) => {
          let total = 0;
          p.pacote_itens?.forEach((item: any) => {
            if (item.hoteis) total += parseValor(item.hoteis.quarto_standard_preco || item.hoteis.preco_medio);
            if (item.guias) total += parseValor(item.guias.preco_diaria);
            if (item.atracoes) total += parseValor(item.atracoes.preco_entrada);
          });
          return { ...p, valor_total: total };
        });
        setPacotes(processados);
      }
      setLoading(false);
    }
    fetchPacotes();
  }, []);

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

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-20 md:pb-32 text-left`}>

      {/* HEADER */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative h-10 w-28 md:h-12 md:w-36 lg:h-16 lg:w-56 shrink-0"><Image src="/logop.png" alt="SagaTurismo" fill priority className="object-contain object-left" /></div>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 font-bold text-sm">
            <Link href="/roteiro" className="text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/hoteis" className="text-slate-600 hover:text-[#00577C]">Alojamentos</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-2.5 text-[#00577C] shadow-lg hover:bg-[#ffd633]">Cartão Residente</Link>
          </nav>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-[#00577C]">
            {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-5 flex flex-col gap-4 shadow-xl lg:hidden animate-in slide-in-from-top-4">
            <Link href="/roteiro" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700">Rota Turística</Link>
            <Link href="/hoteis" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700">Alojamentos</Link>
            <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#F9C400] text-[#00577C] font-black px-4 py-3 rounded-xl text-center">Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-[120px] md:pt-[140px] pb-12 md:pb-16 bg-[#00577C] z-30">
        <div className="mx-auto max-w-7xl px-5 md:px-6">
          <h1 className={`${jakarta.className} text-3xl sm:text-5xl font-black text-white leading-tight mb-8`}>
            Experiência Completa. <span className="text-[#F9C400] block md:inline">Roteiros Oficiais.</span>
          </h1>

          <div className="bg-[#F9C400] p-1.5 md:p-2 rounded-[2rem] shadow-xl max-w-5xl flex flex-col md:flex-row gap-1.5 md:gap-2">
            <div className="bg-white flex-1 rounded-[1.5rem] px-5 py-3 flex items-center gap-3">
               <MapPin className="text-[#00577C] shrink-0" size={20} />
               <div className="text-left"><p className="text-[9px] font-black uppercase text-slate-400">Destino</p><p className="font-bold text-slate-800 text-xs">São Geraldo do Araguaia - PA</p></div>
            </div>
            <div className="bg-white flex-[2] rounded-[1.5rem] px-5 py-3 flex items-center gap-3">
               <Search className="text-[#00577C] shrink-0" size={20} />
               <input 
                 type="text" 
                 placeholder="O que procura?" 
                 value={termoBusca}
                 onChange={(e) => setTermoBusca(e.target.value)}
                 className="w-full border-none font-bold text-slate-800 text-xs outline-none placeholder:text-slate-300"
               />
            </div>
            <button className="bg-slate-900 text-white px-8 py-3.5 md:py-0 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Buscar</button>
          </div>
        </div>
      </section>

      {/* CONTEÚDO */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pt-8 md:pt-12 relative z-20">
        <div className="flex lg:hidden items-center justify-between mb-6 text-left">
           <h2 className={`${jakarta.className} text-2xl font-black text-slate-800`}>Pacotes</h2>
           <button onClick={() => setIsMobileFiltersOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-bold text-[#00577C] shadow-sm">
             <SlidersHorizontal size={16} /> Filtros {categoriasSelecionadas.length > 0 && <span className="w-2 h-2 rounded-full bg-[#F9C400]"></span>}
           </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* SIDEBAR DESKTOP - AGORA COM h-fit e self-start para não "fugir" */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-6 lg:sticky lg:top-32 h-fit lg:self-start">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className={`${jakarta.className} text-xl font-black text-slate-900 flex items-center gap-3`}><Filter size={20} className="text-[#00577C]"/> Filtros</h3>
                {categoriasSelecionadas.length > 0 && (
                  <button onClick={limparFiltros} className="text-[10px] font-bold text-slate-400 hover:text-[#00577C] underline">Limpar</button>
                )}
              </div>
              <FiltrosConteudo />
            </div>
            <div className="bg-[#e6f4ea] border border-[#009640]/20 rounded-[2.5rem] p-8 text-center shadow-sm">
               <ShieldCheck className="mx-auto mb-4 text-[#009640]" size={40} />
               <p className="text-base font-black text-[#009640] mb-2">Turismo Seguro</p>
               <p className="text-xs text-green-800 font-medium leading-relaxed text-center">Pacotes verificados pela Secretaria de Turismo de SGA.</p>
            </div>
          </aside>

          {/* LISTA DE PACOTES */}
          <div className="flex-1 w-full space-y-6 md:space-y-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
                <Loader2 className="animate-spin text-[#00577C] mb-4" size={40}/>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando pacotes...</p>
              </div>
            ) : pacotesFiltrados.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                <Search size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-base font-bold text-slate-500">Nenhum pacote encontrado.</p>
                <button onClick={limparFiltros} className="mt-4 text-[#00577C] font-bold underline">Limpar Filtros</button>
              </div>
            ) : (
              pacotesFiltrados.map((pacote) => (
                <article key={pacote.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row overflow-hidden group">
                  <div className="relative w-full h-56 md:w-80 md:h-auto shrink-0 overflow-hidden bg-slate-100">
                    <Image src={pacote.imagem_principal || FALLBACK_IMAGE} alt={pacote.titulo} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute top-4 left-4 bg-[#F9C400] text-[#00577C] px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">{pacote.categoria}</div>
                  </div>

                  <div className="p-6 md:p-8 flex flex-col flex-1 text-left">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#009640] mb-4 bg-green-50 px-3 py-1 rounded-lg w-fit"><CheckCircle2 size={14} /> Pacote Verificado</div>
                    <h3 className={`${jakarta.className} text-xl md:text-3xl font-black text-[#00577C] leading-tight mb-2 md:mb-4 hover:underline cursor-pointer`}><Link href={`/pacotes/${pacote.id}`}>{pacote.titulo}</Link></h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-6 font-medium">{pacote.descricao_curta}</p>

                    <div className="flex flex-wrap items-center gap-3 text-slate-500 mb-6 md:mb-8">
                       <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><CalendarClock size={14} className="text-[#00577C]"/> {pacote.dias} Dias</span>
                       <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Bed size={14} className="text-[#00577C]"/> Hotel</span>
                       <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Compass size={14} className="text-[#00577C]"/> Guia</span>
                    </div>

                    <div className="mt-auto pt-5 md:pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                      <div className="text-left"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Estimativa por pessoa</p><p className={`${jakarta.className} text-3xl font-black text-[#009640] tabular-nums`}>{formatarMoeda(pacote.valor_total || 0)}</p></div>
                      <Link href={`/pacotes/${pacote.id}`} className="w-full sm:w-auto bg-[#00577C] text-white px-8 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-widest hover:bg-[#004a6b] shadow-lg flex items-center justify-center gap-3">Ver Detalhes <ChevronRight size={18}/></Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {/* GAVETA DE FILTROS MOBILE */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileFiltersOpen(false)} />
           <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-6 pb-10 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full text-left">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                 <h3 className={`${jakarta.className} text-2xl font-black text-slate-900`}>Filtros</h3>
                 <button onClick={() => setIsMobileFiltersOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><X size={20} /></button>
              </div>
              <div className="overflow-y-auto flex-1"><FiltrosConteudo /></div>
              <div className="pt-4 border-t border-slate-100 mt-6 flex gap-4">
                 <button onClick={limparFiltros} className="flex-1 py-4 text-slate-500 font-bold text-sm underline">Limpar</button>
                 <button onClick={() => setIsMobileFiltersOpen(false)} className="flex-[2] bg-[#00577C] text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg">Aplicar</button>
              </div>
           </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-12 md:py-20 px-5 md:px-8 border-t border-slate-200 bg-white mt-12 md:mt-20 text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
             <Image src="/logop.png" alt="SGA" width={140} height={50} className="object-contain" />
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] text-center md:text-left">© 2026 Secretaria Municipal de Turismo - SGA</p>
          </div>
          <div className="flex items-center gap-6">
             <div className="text-left md:border-l-2 border-slate-100 md:pl-6"><p className="text-[9px] font-black text-[#00577C] uppercase mb-1">Contato</p><p className="text-xs font-bold text-slate-500">setursaga@gmail.com</p></div>
             <ShieldCheck size={36} className="text-[#009640] opacity-30 md:w-10 md:h-10"/>
          </div>
        </div>
      </footer>
    </main>
  );
}