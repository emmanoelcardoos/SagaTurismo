'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Menu, MapPin, Search, Star, 
  CheckCircle2, ShieldCheck, Filter, X, 
  ArrowRight
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM ──
type Hotel = {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  estrelas: number;
  imagem_url: string;
  comodidades?: string[];
};

// ── UTILS ──
const getArraySeguro = (item: any): string[] => {
  if (!item) return [];
  if (Array.isArray(item)) return item;
  if (typeof item === 'string') {
    try {
      const parsed = JSON.parse(item);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      if (item.startsWith('{') && item.endsWith('}')) {
        return item.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^"/, '').replace(/"$/, ''));
      }
    }
  }
  return [];
};

function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-4 flex flex-col md:flex-row overflow-hidden animate-pulse shadow-sm">
      <div className="w-full h-64 md:w-72 bg-slate-100 rounded-3xl shrink-0" />
      <div className="p-6 md:p-8 flex flex-col flex-1 gap-4">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-8 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-full mt-4" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="mt-auto pt-6 flex justify-end">
          <div className="h-12 bg-slate-200 rounded-full w-40" />
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──
function HoteisPageContent() {
  const [hoteis, setHoteis] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filtros Visuais (Mantidos para a vitrine)
  const [estrelasSelecionadas, setEstrelasSelecionadas] = useState<number[]>([]);
  const [comodidadesSelecionadas, setComodidadesSelecionadas] = useState<string[]>([]);

  // Hero Carousel State
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  useEffect(() => {
    async function fetchHoteis() {
      const { data } = await supabase.from('hoteis').select('*').order('nome');
      if (data) setHoteis(data as Hotel[]);
      setLoading(false);
    }
    fetchHoteis();
  }, []);

  // Rotação do Carrossel
  useEffect(() => {
    if (hoteis.length <= 1) return;
    const timer = setInterval(() => setCurrentHeroSlide((prev) => (prev + 1) % hoteis.length), 6000);
    return () => clearInterval(timer);
  }, [hoteis.length]);

  const FALLBACK_IMAGE = "/logop.png";

  const toggleEstrela = (star: number) => setEstrelasSelecionadas(p => p.includes(star) ? p.filter(s => s !== star) : [...p, star]);
  const toggleComodidade = (item: string) => setComodidadesSelecionadas(p => p.includes(item) ? p.filter(c => c !== item) : [...p, item]);
  const limparFiltros = () => { setEstrelasSelecionadas([]); setComodidadesSelecionadas([]); setIsMobileFiltersOpen(false); };

  const hoteisFiltrados = useMemo(() => {
    return hoteis.filter(h => {
      if (estrelasSelecionadas.length > 0 && !estrelasSelecionadas.includes(h.estrelas)) return false;
      if (comodidadesSelecionadas.length > 0) {
        const coms = getArraySeguro(h.comodidades);
        if (!comodidadesSelecionadas.every(c => coms.includes(c))) return false;
      }
      return true;
    });
  }, [hoteis, estrelasSelecionadas, comodidadesSelecionadas]);

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 pb-32`}>
      
      {/* ── HEADER ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Rotas','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
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

      {/* ── HERO SECTION ── */}
      <section className="relative h-auto min-h-[400px] w-full flex flex-col justify-end pb-12 px-6">
        <div className="absolute inset-0 bg-[#002f40]">
          {hoteis.length > 0 && hoteis.map((h, i) => (
            <Image
              key={h.id}
              src={h.imagem_url || FALLBACK_IMAGE}
              alt="Fundo"
              fill
              className={`object-cover transition-opacity duration-1000 ease-in-out ${
                i === currentHeroSlide ? 'opacity-60' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#002f40] via-[#002f40]/50 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto text-center md:text-left flex flex-col items-center md:items-start pt-20">
          <h1 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-[1.1] md:leading-[0.9] tracking-tight mb-4`}>
            Alojamentos <span className="text-[#F9C400]">Locais</span>
          </h1>
          <p className="text-white/80 text-lg font-medium max-w-2xl text-center md:text-left">
            Conheça as melhores opções de hospedagem em São Geraldo do Araguaia. Entre em contacto direto com os proprietários e garanta a sua estadia.
          </p>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL (LISTA + FILTROS) ── */}
      <section className="mx-auto max-w-[1400px] px-6 pt-12">
        {/* Botão Filtros Mobile */}
        <div className="lg:hidden mb-6">
           <button onClick={() => setIsMobileFiltersOpen(true)} className="w-full bg-white border border-slate-200 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-slate-700 shadow-sm">
             <Filter size={18} /> Filtrar Alojamentos
           </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          {/* SIDEBAR FILTROS (Desktop) */}
          <aside className="hidden lg:block w-72 shrink-0 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm h-fit">
             <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                <h3 className={`${jakarta.className} font-black text-xl flex items-center gap-2`}><Filter size={18} className="text-[#00577C]"/> Filtros</h3>
                {(estrelasSelecionadas.length > 0 || comodidadesSelecionadas.length > 0) && <button onClick={limparFiltros} className="text-[10px] font-bold text-slate-400 underline">Limpar</button>}
             </div>
             
             <div className="mb-8">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Categoria</p>
               <div className="space-y-4">
                 {[5,4,3,2,1].map(s => (
                   <label key={s} className="flex items-center gap-3 cursor-pointer group">
                     <input type="checkbox" checked={estrelasSelecionadas.includes(s)} onChange={()=>toggleEstrela(s)} className="w-5 h-5 rounded-md border-slate-300 text-[#00577C] focus:ring-[#00577C]" />
                     <div className="flex items-center gap-1 text-[#F9C400] group-hover:opacity-80 transition-opacity">{Array.from({length:s}).map((_,i)=><Star key={i} size={14} fill="currentColor"/>)}</div>
                   </label>
                 ))}
               </div>
             </div>

             <div className="pt-8 border-t border-slate-100">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Comodidades</p>
               <div className="space-y-4">
                 {['Piscina', 'Wi-Fi Grátis', 'Estacionamento', 'Café-da-Manhã'].map(c => (
                   <label key={c} className="flex items-center gap-3 cursor-pointer group">
                     <input type="checkbox" checked={comodidadesSelecionadas.includes(c)} onChange={()=>toggleComodidade(c)} className="w-5 h-5 rounded-md border-slate-300 text-[#00577C] focus:ring-[#00577C]" />
                     <span className="text-sm font-bold text-slate-600 group-hover:text-[#00577C] transition-colors">{c}</span>
                   </label>
                 ))}
               </div>
             </div>
          </aside>

          {/* LISTA DE HOTÉIS */}
          <div className="flex-1 w-full space-y-8">
            <h2 className={`${jakarta.className} text-3xl font-black text-slate-800 mb-6`}>{hoteisFiltrados.length} Alojamentos Disponíveis</h2>

            {loading ? (
               [...Array(3)].map((_, i) => <HotelCardSkeleton key={i} />)
            ) : hoteisFiltrados.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200"><Search size={40} className="mx-auto text-slate-300 mb-4" /><p className="font-bold text-slate-500">Sem resultados para estes filtros.</p></div>
            ) : (
               hoteisFiltrados.map((hotel, index) => {
                  return (
                    <article key={hotel.id} className={`animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all p-4 flex flex-col md:flex-row gap-6 md:gap-10 overflow-hidden`} style={{ animationDelay: `${index * 150}ms` }}>
                       <div className="relative w-full h-64 md:h-auto md:w-80 rounded-3xl overflow-hidden bg-slate-100 shrink-0 group cursor-pointer">
                          <Image src={hotel.imagem_url || FALLBACK_IMAGE} alt={hotel.nome} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[9px] font-black uppercase text-[#00577C] tracking-widest shadow-md">{hotel.tipo}</div>
                       </div>

                       <div className="flex-1 py-4 pr-4 flex flex-col">
                          <div className="flex items-center gap-1 text-[#F9C400] mb-3">{Array.from({ length: hotel.estrelas }).map((_, i) => <Star key={i} size={14} fill="currentColor"/>)}</div>
                          <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-2`}>{hotel.nome}</h3>
                          <div className="flex items-center gap-2 text-xs font-bold text-[#009640] mb-4"><MapPin size={14}/> São Geraldo do Araguaia</div>
                          <p className="text-slate-500 font-medium text-sm leading-relaxed line-clamp-2 mb-6">{hotel.descricao}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-8">
                             {getArraySeguro(hotel.comodidades).slice(0, 3).map((c,i) => (
                               <span key={i} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#00577C]"/> {c}</span>
                             ))}
                          </div>

                          <div className="mt-auto border-t border-slate-100 pt-6 flex flex-col sm:flex-row sm:items-end justify-end gap-6">
                             <Link 
                               href={`/hoteis/${hotel.id}`}
                               className={`w-full sm:w-auto px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-[#00577C] text-white hover:bg-[#004a6b] shadow-lg hover:shadow-xl hover:-translate-y-1`}
                             >
                               Conhecer Hotel <ArrowRight size={16}/>
                             </Link>
                          </div>
                       </div>
                    </article>
                  );
               })
            )}
          </div>
        </div>
      </section>

      {/* FILTROS MOBILE */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileFiltersOpen(false)} />
           <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-6 pb-10 flex flex-col max-h-[85vh] text-left animate-in slide-in-from-bottom-full">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                 <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 flex items-center gap-2`}><Filter size={24} className="text-[#00577C]"/> Filtros</h3>
                 <button onClick={() => setIsMobileFiltersOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><X size={20} /></button>
              </div>
              <div className="overflow-y-auto flex-1 hide-scrollbar">
                 <div className="mb-8">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Categoria</p>
                   <div className="space-y-4">
                     {[5,4,3,2,1].map(s => (
                       <label key={s} className="flex items-center gap-3 cursor-pointer group">
                         <input type="checkbox" checked={estrelasSelecionadas.includes(s)} onChange={()=>toggleEstrela(s)} className="w-5 h-5 rounded-md border-slate-300 text-[#00577C] focus:ring-[#00577C]" />
                         <div className="flex items-center gap-1 text-[#F9C400]">{Array.from({length:s}).map((_,i)=><Star key={i} size={14} fill="currentColor"/>)}</div>
                       </label>
                     ))}
                   </div>
                 </div>
                 <div className="pt-8 border-t border-slate-100">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Comodidades</p>
                   <div className="space-y-4">
                     {['Piscina', 'Wi-Fi Grátis', 'Estacionamento', 'Café-da-Manhã'].map(c => (
                       <label key={c} className="flex items-center gap-3 cursor-pointer group">
                         <input type="checkbox" checked={comodidadesSelecionadas.includes(c)} onChange={()=>toggleComodidade(c)} className="w-5 h-5 rounded-md border-slate-300 text-[#00577C] focus:ring-[#00577C]" />
                         <span className="text-sm font-bold text-slate-600">{c}</span>
                       </label>
                     ))}
                   </div>
                 </div>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-auto">
                 <button onClick={() => setIsMobileFiltersOpen(false)} className="w-full bg-[#00577C] text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg">Aplicar Filtros ({hoteisFiltrados.length})</button>
              </div>
           </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left mt-20">
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
    </div>
  );
}

export default function HoteisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFCF7]" />}>
      <HoteisPageContent />
    </Suspense>
  );
}