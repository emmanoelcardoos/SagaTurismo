'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Menu, MapPin, ArrowRight,
  CalendarClock, Search, Calendar, Star, 
  CheckCircle2, ChevronRight, Sparkles, X, 
  ShieldCheck, Filter, Compass, Ticket, Sun
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGENS ──
type Hotel = { id: string; nome: string; preco_medio: any; };
type Guia = { id: string; nome: string; preco_diaria: any; especialidade: string; };
type Atracao = { id: string; nome: string; preco_entrada: any; tipo: string; };

type PacoteItem = {
  id: string;
  hoteis: Hotel | null;
  guias: Guia | null;
  atracoes: Atracao | null;
};

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

  // Função para alternar as categorias na barra lateral
  const toggleCategoria = (cat: string) => {
    setCategoriasSelecionadas(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const pacotesFiltrados = useMemo(() => {
    return pacotes.filter(p => {
      const matchesTermo = p.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
                           (p.descricao_curta && p.descricao_curta.toLowerCase().includes(termoBusca.toLowerCase()));
      const matchesCategoria = categoriasSelecionadas.length === 0 || (p.categoria && categoriasSelecionadas.includes(p.categoria));
      return matchesTermo && matchesCategoria;
    });
  }, [pacotes, termoBusca, categoriasSelecionadas]);

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-20`}>

      {/* HEADER */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-12 w-36 sm:h-16 sm:w-56"><Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" /></div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block text-left">
              <p className={`${jakarta.className} text-2xl font-bold text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex text-left font-bold">
            <Link href="/roteiro" className="text-sm text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/hoteis" className="text-sm text-slate-600 hover:text-[#00577C]">Alojamentos</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm text-[#00577C] shadow-lg hover:bg-[#ffd633] transition-all">Cartão Residente</Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION SÓBRIA & OFICIAL */}
      <section className="relative pt-[140px] pb-16 bg-[#00577C] z-30">
        <div className="relative z-10 mx-auto max-w-7xl px-6 text-left">
          <h1 className={`${jakarta.className} text-4xl md:text-5xl font-black text-white leading-tight mb-8`}>
            Experiência Completa. <span className="text-[#F9C400]">Roteiros Oficiais.</span>
          </h1>

          {/* BARRA DE PESQUISA ESTILO BOOKING */}
          <div className="bg-[#F9C400] p-1.5 md:p-2 rounded-[2rem] shadow-xl max-w-5xl flex flex-col md:flex-row gap-1.5 md:gap-2 relative z-50">
            
            {/* 1. Destino Fixo */}
            <div className="bg-white flex-1 rounded-[1.5rem] px-5 py-3 flex items-center gap-3">
               <MapPin className="text-[#00577C] shrink-0" size={24} />
               <div className="text-left overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">Destino</p>
                  <p className="font-bold text-slate-800 text-sm truncate">São Geraldo do Araguaia - PA</p>
               </div>
            </div>

            {/* 2. Busca por Texto */}
            <div className="bg-white flex-[2] rounded-[1.5rem] px-5 py-3 flex items-center gap-3 relative">
               <Search className="text-[#00577C] shrink-0" size={24} />
               <div className="text-left flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">O que procura?</p>
                  <input 
                    type="text" 
                    placeholder="Ex: Trilha, Praia, Fim de semana..." 
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="w-full border-none font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300 p-0"
                  />
               </div>
            </div>

            <button className="bg-slate-900 text-white px-10 py-4 md:py-0 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-md shrink-0">
              Buscar
            </button>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL: FILTROS + LISTA HORIZONTAL */}
      <section className="mx-auto max-w-7xl px-6 pt-12 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* BARRA LATERAL DE FILTROS */}
          <aside className="w-full lg:w-72 shrink-0 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <h3 className={`${jakarta.className} text-xl font-black text-slate-900 mb-8 flex items-center gap-3`}>
                <Filter size={20} className="text-[#00577C]"/> Filtros
              </h3>
              
              <div className="mb-8">
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

            {/* Banner de Segurança */}
            <div className="bg-[#e6f4ea] border border-[#009640]/20 rounded-[2.5rem] p-8 text-center shadow-sm">
               <ShieldCheck className="mx-auto mb-4 text-[#009640]" size={40} />
               <p className="text-base font-black text-[#009640] mb-2">Turismo Seguro</p>
               <p className="text-xs text-green-800 font-medium leading-relaxed">Todos os pacotes incluem guias credenciados e hospedagem oficial.</p>
            </div>
          </aside>

          {/* LISTA DE PACOTES HORIZONTAL */}
          <div className="flex-1 w-full space-y-8">
            <div className="flex items-center justify-between mb-2">
               <h2 className={`${jakarta.className} text-3xl font-black text-slate-800`}>Roteiros Disponíveis</h2>
               {!loading && <p className="text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-200">{pacotesFiltrados.length} pacotes</p>}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-200 shadow-sm">
                <Loader2 className="animate-spin text-[#00577C] mb-4" size={48}/>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscando pacotes...</p>
              </div>
            ) : pacotesFiltrados.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <Search size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-bold text-slate-500">Nenhum pacote atende aos filtros selecionados.</p>
                <button onClick={() => {setTermoBusca(''); setCategoriasSelecionadas([]);}} className="mt-4 text-[#00577C] font-bold underline">Limpar Filtros</button>
              </div>
            ) : (
              pacotesFiltrados.map((pacote) => (
                <article key={pacote.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row overflow-hidden group">
                  
                  {/* IMAGEM (Lado Esquerdo) */}
                  <div className="relative w-full md:w-80 h-64 md:h-auto shrink-0 overflow-hidden bg-slate-100">
                    <Image src={pacote.imagem_principal || FALLBACK_IMAGE} alt={pacote.titulo} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute top-5 left-5 bg-[#F9C400] text-[#00577C] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                      {pacote.categoria || 'Aventura'}
                    </div>
                  </div>

                  {/* CONTEÚDO (Lado Direito) */}
                  <div className="p-8 flex flex-col flex-1 text-left">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className={`${jakarta.className} text-3xl font-black text-[#00577C] leading-tight hover:underline cursor-pointer mb-2`}>
                          <Link href={`/pacotes/${pacote.id}`}>{pacote.titulo}</Link>
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-[#009640] mb-5 bg-green-50 px-3 py-1.5 rounded-lg self-start">
                      <CheckCircle2 size={14} /> Pacote Verificado
                    </div>
                    
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-6 font-medium pr-4">
                      {pacote.descricao_curta}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-slate-500 mb-8">
                       <span className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                         <CalendarClock size={14} className="text-[#00577C]"/> {pacote.dias} Dias / {pacote.noites} Noites
                       </span>
                       <span className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                         <Bed size={14} className="text-[#00577C]"/> Hotel Incluído
                       </span>
                       <span className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                         <Compass size={14} className="text-[#00577C]"/> Guia Oficial
                       </span>
                    </div>

                    {/* PREÇO E BOTÃO DA MATEMÁTICA */}
                    <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-1">O que esperar</p>
                         <p className="text-xs font-bold text-slate-500">
                           Hospedagem, atividades e <br/> acompanhamento especializado.
                         </p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Estimativa por pessoa</p>
                         <p className={`${jakarta.className} text-4xl font-black text-[#009640] tabular-nums mb-4 leading-none`}>
                           {formatarMoeda(pacote.valor_total || 0)}
                         </p>
                         <Link href={`/pacotes/${pacote.id}`} className="bg-[#00577C] text-white px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-[#004a6b] transition-all shadow-xl hover:shadow-[#00577C]/20 flex items-center gap-3 hover:translate-x-1">
                           Ver Roteiro <ChevronRight size={20}/>
                         </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white mt-20 text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
             <Image src="/logop.png" alt="SGA" width={160} height={50} className="object-contain" />
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Secretaria Municipal de Turismo - SGA</p>
          </div>
          <div className="flex gap-10">
             <div className="text-left border-l-2 border-slate-100 pl-6">
                <p className="text-[10px] font-black text-[#00577C] uppercase mb-1">Contato Oficial</p>
                <p className="text-xs font-bold text-slate-500 tracking-tight">setursaga@gmail.com</p>
             </div>
             <ShieldCheck size={40} className="text-[#009640] opacity-30"/>
          </div>
        </div>
      </footer>
    </main>
  );
}