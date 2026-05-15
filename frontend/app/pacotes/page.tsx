'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Menu, MapPin, ArrowRight,
  CalendarClock, Search, Calendar, Star, 
  CheckCircle2, ChevronRight, Sparkles, X, 
  ShieldCheck, Filter, Bed, Compass, Ticket
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
  if (valor === null || valor === undefined || valor === '') return 0;
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
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

  // Estados de Filtro
  const [dataBusca, setDataBusca] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('Todos');
  const [termoBusca, setTermoBusca] = useState('');

  const categorias = ['Todos', 'Praia', 'Trilha', 'Serra', 'Cachoeira', 'Camping'];

  useEffect(() => {
    async function fetchPacotes() {
      // RESTAURADO: Busca com joins para calcular o preço corretamente
      const { data, error } = await supabase
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

  const pacotesFiltrados = useMemo(() => {
    return pacotes.filter(p => {
      const matchesTermo = p.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
                           p.descricao_curta?.toLowerCase().includes(termoBusca.toLowerCase());
      const matchesCategoria = categoriaSel === 'Todos' || p.categoria === categoriaSel;
      return matchesTermo && matchesCategoria;
    });
  }, [pacotes, termoBusca, categoriaSel]);

  return (
    <main className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 pb-20`}>

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
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm text-[#00577C] shadow-lg hover:bg-[#ffd633] transition-all">Cartão Residente</Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-[140px] pb-24 overflow-hidden bg-[#00577C]">
        <div className="absolute inset-0 z-0">
          <Image src="https://images.unsplash.com/photo-1506744038136-46273834b3fb" alt="Background" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#00577C]/80 via-transparent to-[#F8F9FA]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 text-left">
          <h1 className={`${jakarta.className} text-4xl md:text-7xl font-black text-white leading-none mb-4`}>
            Escolha seu <span className="text-[#F9C400]">Roteiro</span>
          </h1>
          <p className="text-lg text-white/70 font-medium max-w-xl mb-12">
            Explore São Geraldo do Araguaia com pacotes planejados para sua melhor experiência.
          </p>

          {/* CAIXA DE BUSCA MODERNA COM CALENDÁRIO ESTILIZADO */}
          <div className="bg-white/10 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white/20 shadow-2xl max-w-5xl">
            <div className="bg-white rounded-[2.2rem] p-3 flex flex-col lg:flex-row items-center gap-2">
              
              {/* Filtro Categorias */}
              <div className="w-full lg:w-60 relative">
                <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00577C]" size={18} />
                <select 
                  value={categoriaSel}
                  onChange={(e) => setCategoriaSel(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 appearance-none outline-none focus:ring-4 focus:ring-[#00577C]/5 transition-all cursor-pointer"
                >
                  {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="hidden lg:block w-px h-8 bg-slate-200 mx-1" />

              {/* Busca Texto */}
              <div className="w-full flex-1 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Procurar pacote..." 
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl border-none font-bold text-slate-800 outline-none"
                />
              </div>

              <div className="hidden lg:block w-px h-8 bg-slate-200 mx-1" />

              {/* Calendário Customizado */}
              <div className="w-full lg:w-64 relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00577C] pointer-events-none z-10">
                   <Calendar size={18} />
                </div>
                <input 
                  type="date" 
                  value={dataBusca}
                  onChange={(e) => setDataBusca(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 outline-none cursor-pointer relative z-0
                  [text-transform:uppercase] [font-size:12px] [letter-spacing:1px]
                  [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                {!dataBusca && <span className="absolute left-14 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">QUANDO QUER IR?</span>}
              </div>

              <button className="w-full lg:w-auto bg-[#00577C] text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#004a6b] transition-all flex items-center justify-center gap-2">
                BUSCAR
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* GRID DE CARDS CLICÁVEIS */}
      <section className="mx-auto max-w-7xl px-6 -mt-8 relative z-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24"><Loader2 className="animate-spin text-[#00577C]" size={48}/></div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {pacotesFiltrados.map((pacote) => (
              <Link key={pacote.id} href={`/pacotes/${pacote.id}`} className="group">
                <article className="h-full bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col relative">
                  
                  {/* Imagem com proporção fixa */}
                  <div className="relative h-60 overflow-hidden shrink-0">
                    <Image src={pacote.imagem_principal || FALLBACK_IMAGE} alt={pacote.titulo} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase text-[#00577C] shadow-sm">
                      <CalendarClock size={12}/> {pacote.dias} Dias
                    </div>
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="p-8 flex flex-col flex-1 text-left">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#009640] bg-green-50 px-2 py-1 rounded">
                        {pacote.categoria || 'Aventura'}
                      </span>
                      <div className="flex items-center gap-1 text-[#F9C400]">
                         <Star size={14} fill="currentColor"/> <span className="text-xs font-black text-slate-400">5.0</span>
                      </div>
                    </div>
                    
                    <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-3 leading-tight group-hover:text-[#00577C] transition-colors`}>
                      {pacote.titulo}
                    </h3>
                    
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-8 font-medium">
                      {pacote.descricao_curta}
                    </p>

                    {/* Rodapé do Card */}
                    <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-left">
                         <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Investimento</p>
                         <p className={`${jakarta.className} text-2xl font-black text-[#00577C] tabular-nums`}>
                           {formatarMoeda(pacote.valor_total || 0)}
                         </p>
                      </div>
                      <div className="w-12 h-12 bg-slate-50 text-[#00577C] rounded-2xl flex items-center justify-center group-hover:bg-[#F9C400] transition-colors">
                         <ChevronRight size={24}/>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {!loading && pacotesFiltrados.length === 0 && (
          <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
             <Search className="mx-auto mb-4 text-slate-300" size={50}/>
             <h3 className={`${jakarta.className} text-2xl font-black text-slate-800`}>Nada encontrado</h3>
             <p className="text-slate-500 font-medium">Não existem pacotes com estes critérios para a data selecionada.</p>
             <button onClick={() => {setTermoBusca(''); setCategoriaSel('Todos'); setDataBusca('');}} className="mt-6 text-[#00577C] font-black text-sm uppercase tracking-widest border-b-2 border-[#00577C]">Limpar Filtros</button>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white mt-20 text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
             <Image src="/logop.png" alt="SGA" width={160} height={50} className="object-contain" />
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">© 2026 Secretaria Municipal de Turismo - SGA</p>
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