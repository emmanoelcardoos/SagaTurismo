'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Menu, MapPin, ArrowRight,
  CalendarClock, Search, Calendar, Star, 
  CheckCircle2, ChevronRight, Sparkles, X, 
  ShieldCheck, Filter, Mountain, Waves, 
  TreePine, Tent, Palmtree
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
  categoria: string; // Praia, Trilha, Serra, etc.
};

// ── UTILITÁRIOS ──
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
      const { data } = await supabase
        .from('pacotes')
        .select('*') // Buscando todos os campos simplificados
        .eq('ativo', true);

      if (data) setPacotes(data);
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

  // Lógica de Filtro Combinada
  const pacotesFiltrados = useMemo(() => {
    return pacotes.filter(p => {
      const matchesTermo = p.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
                           p.descricao_curta.toLowerCase().includes(termoBusca.toLowerCase());
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
          <nav className="hidden items-center gap-7 md:flex text-left">
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg">Cartão Residente</Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION REDUZIDO */}
      <section className="relative pt-[140px] pb-24 overflow-hidden bg-[#00577C]">
        <div className="absolute inset-0 z-0">
          <Image src="https://images.unsplash.com/photo-1501785888041-af3ef285b470" alt="Background" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#00577C]/80 via-transparent to-[#F8F9FA]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 text-left">
          <h1 className={`${jakarta.className} text-4xl md:text-6xl font-black text-white leading-none mb-4`}>
            Explore o <span className="text-[#F9C400]">Inexplorado</span>
          </h1>
          <p className="text-lg text-white/70 font-medium max-w-xl mb-10">
            Selecione o estilo da sua próxima jornada em São Geraldo do Araguaia.
          </p>

          {/* CAIXA DE BUSCA MODERNA */}
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-[2.5rem] border border-white/20 shadow-2xl max-w-5xl">
            <div className="bg-white rounded-[2.2rem] p-3 flex flex-col lg:flex-row items-center gap-2">
              
              {/* Categoria */}
              <div className="w-full lg:w-64 relative group">
                <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00577C]" size={18} />
                <select 
                  value={categoriaSel}
                  onChange={(e) => setCategoriaSel(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-[#00577C]/10 transition-all cursor-pointer"
                >
                  {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="hidden lg:block w-px h-8 bg-slate-200 mx-2" />

              {/* Busca Texto */}
              <div className="w-full flex-1 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Ex: Trilha das Andorinhas..." 
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl border-none font-bold text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="hidden lg:block w-px h-8 bg-slate-200 mx-2" />

              {/* Calendário Moderno */}
              <div className="w-full lg:w-56 relative group">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00577C]" size={18} />
                <input 
                  type="date" 
                  value={dataBusca}
                  onChange={(e) => setDataBusca(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 outline-none cursor-pointer"
                />
              </div>

              <button className="w-full lg:w-auto bg-[#00577C] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#004a6b] transition-all flex items-center justify-center gap-2">
                Buscar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* GRID DE PACOTES - CARDS COMPACTOS E CLICÁVEIS */}
      <section className="mx-auto max-w-7xl px-6 -mt-8 relative z-20">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-[#00577C]" size={40}/></div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pacotesFiltrados.map((pacote) => (
              <Link key={pacote.id} href={`/pacotes/${pacote.id}`}>
                <article className="group bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full cursor-pointer relative">
                  
                  {/* IMAGEM */}
                  <div className="relative h-56 overflow-hidden shrink-0">
                    <Image src={pacote.imagem_principal || FALLBACK_IMAGE} alt={pacote.titulo} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase text-[#00577C] shadow-sm">
                      <CalendarClock size={12}/> {pacote.dias} Dias
                    </div>
                  </div>

                  {/* CONTEÚDO REDUZIDO */}
                  <div className="p-6 flex flex-col flex-1 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#009640] bg-green-50 px-2 py-1 rounded-md">
                        {pacote.categoria || 'Aventura'}
                      </span>
                      <div className="flex items-center gap-1 text-[#F9C400]">
                        <Star size={12} fill="currentColor"/> <span className="text-[10px] font-black text-slate-400">4.9</span>
                      </div>
                    </div>
                    
                    <h3 className={`${jakarta.className} text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-[#00577C] transition-colors`}>
                      {pacote.titulo}
                    </h3>
                    
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 mb-6 font-medium">
                      {pacote.descricao_curta}
                    </p>

                    {/* RODAPÉ DO CARD */}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                         <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Preço Individual</p>
                         <p className={`${jakarta.className} text-xl font-black text-[#00577C]`}>{formatarMoeda(pacote.valor_total || 0)}</p>
                      </div>
                      <div className="bg-slate-50 text-[#00577C] p-2.5 rounded-xl group-hover:bg-[#F9C400] transition-colors">
                         <ArrowRight size={18}/>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {!loading && pacotesFiltrados.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
             <Search className="mx-auto mb-4 text-slate-300" size={48}/>
             <h3 className="text-xl font-bold text-slate-800">Sem resultados para esta busca</h3>
             <button onClick={() => {setTermoBusca(''); setCategoriaSel('Todos');}} className="mt-4 text-[#00577C] font-black text-sm uppercase tracking-widest underline">Limpar Filtros</button>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white mt-20 text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
             <Image src="/logop.png" alt="Prefeitura" width={160} height={50} className="object-contain" />
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Secretaria Municipal de Turismo - SGA</p>
          </div>
          <div className="flex gap-8">
             <ShieldCheck size={40} className="text-[#009640] opacity-50"/>
             <div className="text-left">
                <p className="text-[10px] font-black text-[#00577C] uppercase">Ambiente Seguro</p>
                <p className="text-[9px] font-bold text-slate-400 max-w-[150px]">Certificado de segurança governamental ativo.</p>
             </div>
          </div>
        </div>
      </footer>
    </main>
  );
}