'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Menu, MapPin, ArrowRight,
  CalendarClock, Search, Calendar, Star, 
  CheckCircle2, ChevronRight, Sparkles, X, 
  ShieldCheck, Filter, Compass, CalendarDays
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGENS ──
type Passeio = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_principal: string;
  data_passeio: string;
  valor_total: any;
  nome_guia: string;
  categoria?: string;
};

// ── UTILITÁRIOS ──
const parseValor = (valor: any): number => {
  if (!valor) return 0;
  if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;
  let str = String(valor).replace(/[^\d.,]/g, '');
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const formatarDataLocal = (dataStr: string) => {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1740";

export default function PasseiosPage() {
  const [passeios, setPasseios] = useState<Passeio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Estados de Filtro
  const [categoriaSel, setCategoriaSel] = useState('Todos');
  const [termoBusca, setTermoBusca] = useState('');

  const categorias = ['Todos', 'Trilha', 'Balneário', 'Cachoeira', 'Ecoturismo', 'Histórico'];

  useEffect(() => {
    async function fetchPasseios() {
      const { data, error } = await supabase
        .from('passeios')
        .select('*')
        .eq('ativo', true)
        .order('data_passeio', { ascending: true });

      if (data) setPasseios(data);
      setLoading(false);
    }
    fetchPasseios();
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

  const passeiosFiltrados = useMemo(() => {
    return passeios.filter(p => {
      const matchesTermo = p.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
                           (p.descricao_curta && p.descricao_curta.toLowerCase().includes(termoBusca.toLowerCase()));
      const matchesCategoria = categoriaSel === 'Todos' || p.categoria === categoriaSel;
      return matchesTermo && matchesCategoria;
    });
  }, [passeios, termoBusca, categoriaSel]);

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
            <Link href="/pacotes" className="text-sm text-slate-600 hover:text-[#00577C]">Pacotes</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm text-[#00577C] shadow-lg hover:bg-[#ffd633] transition-all">Cartão Residente</Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-[140px] pb-24 overflow-hidden bg-[#00577C]">
        <div className="absolute inset-0 z-0 text-left">
          <Image src="https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1740" alt="Background" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#00577C]/80 via-transparent to-[#F8F9FA]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 text-left">
          <h1 className={`${jakarta.className} text-4xl md:text-7xl font-black text-white leading-none mb-4`}>
            Passeios e <span className="text-[#F9C400]">Aventuras</span>
          </h1>
          <p className="text-lg text-white/70 font-medium max-w-xl mb-12">
            Experiências de um dia (Bate e Volta) na Serra das Andorinhas, praias e trilhas locais.
          </p>

          <div className="bg-white/10 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white/20 shadow-2xl max-w-5xl">
            <div className="bg-white rounded-[2.2rem] p-3 flex flex-col lg:flex-row items-center gap-2">
              
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

              <div className="w-full flex-1 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Procurar passeio..." 
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl border-none font-bold text-slate-800 outline-none"
                />
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
            {passeiosFiltrados.map((passeio) => (
              <Link key={passeio.id} href={`/passeios/${passeio.id}`} className="group">
                <article className="h-full bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col relative">
                  
                  <div className="relative h-60 overflow-hidden shrink-0">
                    <Image src={passeio.imagem_principal || FALLBACK_IMAGE} alt={passeio.titulo} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase text-[#009640] shadow-sm">
                      <CalendarDays size={14}/> {formatarDataLocal(passeio.data_passeio)}
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-1 text-left">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#00577C] bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                        <Compass size={12}/> Guia: {passeio.nome_guia || 'Local'}
                      </span>
                      <div className="flex items-center gap-1 text-[#F9C400]">
                         <Star size={14} fill="currentColor"/> <span className="text-xs font-black text-slate-400">5.0</span>
                      </div>
                    </div>
                    
                    <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-3 leading-tight group-hover:text-[#00577C] transition-colors`}>
                      {passeio.titulo}
                    </h3>
                    
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-8 font-medium">
                      {passeio.descricao_curta}
                    </p>

                    <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-left">
                         <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Preço Individual</p>
                         <p className={`${jakarta.className} text-2xl font-black text-[#009640] tabular-nums`}>
                           {formatarMoeda(parseValor(passeio.valor_total))}
                         </p>
                      </div>
                      <div className="w-12 h-12 bg-slate-50 text-[#009640] rounded-2xl flex items-center justify-center group-hover:bg-[#009640] group-hover:text-white transition-colors">
                         <ChevronRight size={24}/>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {!loading && passeiosFiltrados.length === 0 && (
          <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
             <Search className="mx-auto mb-4 text-slate-300" size={50}/>
             <h3 className={`${jakarta.className} text-2xl font-black text-slate-800`}>Nada encontrado</h3>
             <p className="text-slate-500 font-medium">Não existem passeios com estes critérios no momento.</p>
             <button onClick={() => {setTermoBusca(''); setCategoriaSel('Todos');}} className="mt-6 text-[#00577C] font-black text-sm uppercase tracking-widest border-b-2 border-[#00577C]">Limpar Filtros</button>
          </div>
        )}
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