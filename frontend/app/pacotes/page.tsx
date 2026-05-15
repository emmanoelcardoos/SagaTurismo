'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Menu, MapPin, ArrowRight,
  Bed, Compass, Ticket, CalendarClock,
  Search, Calendar, Star, CheckCircle2,
  ChevronRight, Sparkles, X, ShieldCheck // ADICIONADO AQUI
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
  pacote_itens: PacoteItem[];
  valor_total?: number;
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
  const [termoBusca, setTermoBusca] = useState('');

  useEffect(() => {
    async function fetchPacotes() {
      const { data, error } = await supabase
        .from('pacotes')
        .select(`
          id, titulo, descricao_curta, imagem_principal, dias, noites,
          pacote_itens (
            id,
            hoteis ( id, nome, preco_medio ),
            guias ( id, nome, preco_diaria, especialidade ),
            atracoes ( id, nome, preco_entrada, tipo )
          )
        `)
        .eq('ativo', true);

      if (data) {
        const pacotesProcessados = (data as any[]).map((pacote) => {
          let total = 0;
          pacote.pacote_itens.forEach((item: PacoteItem) => {
            if (item.hoteis) total += parseValor(item.hoteis.preco_medio);
            if (item.guias) total += parseValor(item.guias.preco_diaria);
            if (item.atracoes) total += parseValor(item.atracoes.preco_entrada);
          });
          return { ...pacote, valor_total: total };
        });
        setPacotes(pacotesProcessados);
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

  // Lógica de Filtro
  const pacotesFiltrados = useMemo(() => {
    return pacotes.filter(p => 
      p.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
      p.descricao_curta.toLowerCase().includes(termoBusca.toLowerCase())
    );
  }, [pacotes, termoBusca]);

  return (
    <main className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 pb-20`}>

      {/* HEADER */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56"><Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" /></div>
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

      {/* HERO SECTION */}
      <section className="relative pt-[120px] pb-32 overflow-hidden bg-[#00577C]">
        <div className="absolute inset-0 z-0 text-left">
          <Image src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740" alt="Background" fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#00577C]/50 via-transparent to-[#F8F9FA]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 text-left">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-6">
              <Sparkles size={12}/> Expedições Oficiais 2026
            </div>
            <h1 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-none mb-6`}>
              Pacotes <span className="text-[#F9C400]">Turísticos</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 font-medium leading-relaxed mb-12">
              Planeie a sua próxima aventura com roteiros certificados, guias credenciados e a segurança do portal oficial de turismo de São Geraldo do Araguaia.
            </p>
          </div>

          {/* CAIXA DE BUSCA */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-4 md:p-6 border border-slate-100 flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="w-full md:flex-1 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                   type="text" 
                   placeholder="Qual experiência procura?" 
                   value={termoBusca}
                   onChange={(e) => setTermoBusca(e.target.value)}
                   className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold outline-none focus:border-[#00577C] transition-all"
                />
             </div>
             
             <div className="w-full md:w-auto relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00577C]" size={20} />
                <input 
                   type="date" 
                   value={dataBusca}
                   onChange={(e) => setDataBusca(e.target.value)}
                   className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-700 outline-none focus:border-[#00577C] transition-all"
                />
                {dataBusca && (
                  <button onClick={() => setDataBusca('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X size={16}/></button>
                )}
             </div>

             <button className="w-full md:w-auto bg-[#00577C] text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#004a6b] transition-all flex items-center justify-center gap-3">
                Pesquisar <ArrowRight size={18}/>
             </button>
          </div>
        </div>
      </section>

      {/* GRID DE PACOTES */}
      <section className="mx-auto max-w-7xl px-6 -mt-10 relative z-20">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-[#00577C] mb-4" size={40}/><p className="font-bold text-slate-400 uppercase text-xs tracking-widest">Sincronizando experiências...</p></div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {pacotesFiltrados.map((pacote) => (
              <article key={pacote.id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2 flex flex-col h-full text-left">
                
                <div className="relative h-64 overflow-hidden shrink-0">
                  <Image src={pacote.imagem_principal || FALLBACK_IMAGE} alt={pacote.titulo} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-5 left-5 bg-white/95 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase text-[#00577C] shadow-md">
                    <CalendarClock size={14}/> {pacote.dias} Dias / {pacote.noites} Noites
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-[#009640] mb-4">
                     <CheckCircle2 size={16}/>
                     <span className="text-[10px] font-black uppercase tracking-widest">Certificado SagaTurismo</span>
                  </div>
                  
                  <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-3 leading-tight`}>{pacote.titulo}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-8">{pacote.descricao_curta}</p>

                  <div className="bg-slate-50 rounded-2xl p-5 mb-8 space-y-3 border border-slate-100">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Este roteiro inclui:</p>
                    {pacote.pacote_itens.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-700">
                        {item.hoteis && <><Bed size={14} className="text-[#00577C]"/> <span>Hospedagem</span></>}
                        {item.guias && <><Compass size={14} className="text-[#009640]"/> <span>Guia Credenciado</span></>}
                        {item.atracoes && <><Ticket size={14} className="text-[#F9C400]"/> <span>Entradas e Taxas</span></>}
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-left">
                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">A partir de</p>
                       <p className={`${jakarta.className} text-3xl font-black text-[#00577C] tabular-nums`}>{formatarMoeda(pacote.valor_total || 0)}</p>
                    </div>
                    <Link href={`/pacotes/${pacote.id}`} className="bg-slate-900 hover:bg-black text-white p-4 rounded-2xl transition-all shadow-lg hover:shadow-slate-300">
                       <ArrowRight size={20}/>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white mt-20 text-left">
        <div className="max-w-7xl mx-auto text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20 text-left">
            <div className="space-y-8">
               <img src="/logop.png" alt="Prefeitura" className="h-20 object-contain" />
               <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">São Geraldo do Araguaia <br/> "Cidade Amada, seguindo em frente"</p>
            </div>
            <div className="space-y-4"><h5 className="font-black text-slate-900 text-xs uppercase tracking-widest">Turismo (SEMTUR)</h5><p className="text-sm text-slate-500 font-medium">Email: <b>setursaga@gmail.com</b></p></div>
            <div className="space-y-4"><h5 className="font-black text-slate-900 text-xs uppercase tracking-widest">Gestão</h5><p className="text-sm text-slate-500 font-medium">Gestão 2025-2028</p></div>
            <div className="space-y-4 text-center md:text-right">
               <ShieldCheck className="inline-block text-[#009640] mb-2" size={32}/>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Site Oficial de Turismo</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}