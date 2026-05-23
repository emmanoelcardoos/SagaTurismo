'use client';

import { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2, Menu, MapPin, Search, Calendar as CalendarIcon, Star, 
  CheckCircle2, ChevronRight, ShieldCheck, Filter, Users, X, 
  AlertTriangle, ChevronLeft, ArrowRight
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM ──
type TipoQuarto = {
  id: string;
  nome_quarto: string;
  preco_quarto: number;
  imagem_url: string;
  capacidade: number;
};

type Hotel = {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  estrelas: number;
  imagem_url: string;
  preco_medio: any;
  quarto_standard_preco: any;
  comodidades?: string[];
  tipos_quarto?: TipoQuarto[];
};

// ── UTILS ──
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
        <div className="mt-auto pt-6 flex justify-between items-end">
          <div className="space-y-2"><div className="h-4 bg-slate-200 rounded w-24" /><div className="h-6 bg-slate-200 rounded w-32" /></div>
          <div className="h-12 bg-slate-200 rounded-full w-40" />
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──
function HoteisPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hoteis, setHoteis] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // PESQUISA E DATAS
  const [adultos, setAdultos] = useState(2);
  const [quartos, setQuartos] = useState(1);
  const [showPopup, setShowPopup] = useState<'calendar' | 'hospedes' | null>(null);
  const [isSearching, setIsSearching] = useState(false); 

  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const [precosDinamicos, setPrecosDinamicos] = useState<Record<string, { valor_total: number; noites: number; disponivel: boolean; motivo?: string }>>({});
  const [carregandoPrecos, setCarregandoPrecos] = useState(false);

  const [estrelasSelecionadas, setEstrelasSelecionadas] = useState<number[]>([]);
  const [comodidadesSelecionadas, setComodidadesSelecionadas] = useState<string[]>([]);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Hero Carousel State
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  useEffect(() => {
    async function fetchHoteis() {
      const { data } = await supabase.from('hoteis').select('*, tipos_quarto(id, nome_quarto, preco_quarto, imagem_url, capacidade)').order('nome');
      if (data) setHoteis(data as Hotel[]);
      setLoading(false);
    }
    fetchHoteis();
  }, []);

  // Rotação do Carrossel (apenas se houver mais que 1 hotel)
  useEffect(() => {
    if (hoteis.length <= 1) return;
    const timer = setInterval(() => setCurrentHeroSlide((prev) => (prev + 1) % hoteis.length), 6000);
    return () => clearInterval(timer);
  }, [hoteis.length]);

  useEffect(() => {
    const ci = searchParams.get('checkin');
    const co = searchParams.get('checkout');
    const ad = searchParams.get('adultos');
    const qu = searchParams.get('quartos');

    if (ci && ci !== 'null') {
      const dIn = new Date(ci + 'T00:00:00');
      setCheckin(dIn);
      setMesAtual(dIn);
    }
    if (co && co !== 'null') setCheckout(new Date(co + 'T00:00:00'));
    if (ad) setAdultos(Number(ad));
    if (qu) setQuartos(Number(qu));
  }, [searchParams]);

  useEffect(() => {
    if (hoteis.length === 0) return;
    const ci = searchParams.get('checkin');
    const co = searchParams.get('checkout');
    const ad = searchParams.get('adultos') || '2';
    const qu = searchParams.get('quartos') || '1';

    if (!ci || !co) {
      setPrecosDinamicos({});
      return;
    }

    async function carregarPrecos() {
      setCarregandoPrecos(true);
      const novosPrecos: Record<string, any> = {};
      try {
        const capacidadeNecessaria = Math.ceil(Number(ad) / Number(qu));
        await Promise.all(
          hoteis.map(async (hotel) => {
            const quartosValidos = hotel.tipos_quarto?.filter(q => q.capacidade >= capacidadeNecessaria) || [];
            if (quartosValidos.length === 0) {
              novosPrecos[hotel.id] = { disponivel: false, motivo: 'capacidade' };
              return;
            }
            const quartoPartida = quartosValidos.reduce((p, c) => c.preco_quarto < p.preco_quarto ? c : p);
            
            // Simulação da chamada de API para não quebrar
            try {
               const res = await fetch(`https://sagaturismo-production.up.railway.app/api/v1/public/hoteis/${hotel.id}/calcular-preco?tipo_quarto=${encodeURIComponent(quartoPartida.nome_quarto)}&checkin=${ci}&checkout=${co}&quantidade=${qu}&adultos=${ad}&t=${Date.now()}`);
               const data = await res.json();
               if (data.sucesso) novosPrecos[hotel.id] = { valor_total: data.valor_total, noites: data.noites, disponivel: data.disponivel };
            } catch {
               // Em caso de erro de API, calcula localmente
               const dIn = new Date(ci); const dOut = new Date(co);
               const nts = Math.ceil((dOut.getTime() - dIn.getTime()) / (1000 * 3600 * 24));
               novosPrecos[hotel.id] = { valor_total: quartoPartida.preco_quarto * nts * Number(qu), noites: nts, disponivel: true };
            }
          })
        );
      } finally {
        setPrecosDinamicos(novosPrecos);
        setCarregandoPrecos(false);
      }
    }
    carregarPrecos();
  }, [hoteis, searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      const cur = window.scrollY;
      setShowHeader(cur < 80 || cur < lastScrollY);
      setLastScrollY(cur);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) setShowPopup(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatarDataIso = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  const FALLBACK_IMAGE = "/logop.png";
  
  const handleBuscar = () => {
    setIsSearching(true);
    const ciStr = checkin ? formatarDataIso(checkin) : '';
    const coStr = checkout ? formatarDataIso(checkout) : '';
    router.push(`/hoteis?checkin=${ciStr}&checkout=${coStr}&adultos=${adultos}&quartos=${quartos}`);
    setShowPopup(null);
    setTimeout(() => setIsSearching(false), 800);
  };

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

  const isSearchLoading = isSearching || carregandoPrecos;

  // Lógica do Calendário Visual
  const renderCalendario = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const hoje = new Date(); hoje.setHours(0,0,0,0);

    return (
      <div className="absolute top-[120%] left-0 md:left-1/2 md:-translate-x-1/2 w-[340px] bg-white rounded-[2rem] border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] p-6 z-[100] animate-in fade-in slide-in-from-top-4 cursor-default" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setMesAtual(new Date(ano, mes - 1))} disabled={mesAtual <= hoje} className="p-2 hover:bg-slate-100 rounded-full disabled:opacity-30 disabled:hover:bg-transparent"><ChevronLeft size={20}/></button>
          <span className={`${jakarta.className} font-black text-slate-800 capitalize`}>{mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setMesAtual(new Date(ano, mes + 1))} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={20}/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-4">
          {['D','S','T','Q','Q','S','S'].map((d,i) => <span key={i} className="text-[10px] font-black text-slate-400">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-y-2">
          {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: totalDias }).map((_, i) => {
            const dt = new Date(ano, mes, i + 1);
            const isPassado = dt < hoje;
            const isCi = checkin?.getTime() === dt.getTime();
            const isCo = checkout?.getTime() === dt.getTime();
            const isInBetween = checkin && checkout && dt > checkin && dt < checkout;
            const isHover = hoverDate && checkin && !checkout && dt > checkin && dt <= hoverDate;

            let classe = "hover:bg-slate-100 text-slate-700 font-bold";
            if (isPassado) classe = "text-slate-300 opacity-50 cursor-not-allowed hover:bg-transparent";
            else if (isCi || isCo) classe = "bg-[#00577C] text-white font-black shadow-lg rounded-full";
            else if (isInBetween || isHover) classe = "bg-[#00577C]/10 text-[#00577C] rounded-none";

            return (
              <button key={i} disabled={isPassado}
                onClick={() => {
                  if (!checkin || (checkin && checkout)) { setCheckin(dt); setCheckout(null); }
                  else if (dt > checkin) { setCheckout(dt); setTimeout(() => setShowPopup(null), 300); }
                  else setCheckin(dt);
                }}
                onMouseEnter={() => !isPassado && setHoverDate(dt)} onMouseLeave={() => setHoverDate(null)}
                className={`w-10 h-10 mx-auto flex items-center justify-center text-sm transition-all ${classe} ${(isCi && checkout) ? 'rounded-l-full rounded-r-none' : ''} ${(isCo && checkin) ? 'rounded-r-full rounded-l-none' : ''}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 pb-32`}>
      
      {/* ── HEADER ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                {/* Removido o filtro invertido para manter as cores originais da logo */}
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

      {/* ── HERO SECTION (CARROSSEL DINÂMICO E SEARCH PILL) ── */}
      <section className="relative h-[65vh] min-h-[500px] w-full flex flex-col justify-end pb-12 px-6">
        <div className="absolute inset-0 bg-[#002f40]">
          {hoteis.length > 0 && hoteis.map((h, i) => (
             <Image key={h.id} src={h.imagem_url || FALLBACK_IMAGE} alt="Fundo" fill className={`object-cover transition-opacity duration-1000 ease-in-out ${i === currentHeroSlide ? 'opacity-50' : 'opacity-0'}`} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#002f40] via-[#002f40]/40 to-transparent" />
        </div>
        
        <div className="relative z-10 w-full max-w-[1400px] mx-auto text-center md:text-left flex flex-col items-center md:items-start">
           <h1 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-[1.1] md:leading-[0.9] tracking-tight mb-8`}>
             <span className="text-[#F9C400]">Alojamentos locais</span>
           </h1>

           {/* SEARCH PILL FLUTUANTE */}
           <div ref={searchBarRef} className="relative w-full max-w-4xl bg-white p-2 rounded-full shadow-2xl flex flex-col md:flex-row items-center gap-2">
              
              <div className="flex-1 w-full flex items-center px-6 py-4 border-b md:border-b-0 md:border-r border-slate-100 gap-3">
                 <MapPin className="text-[#00577C]" size={20} />
                 <div className="text-left"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Destino</p><p className="font-bold text-sm text-slate-800">São Geraldo do Araguaia</p></div>
              </div>

              <div onClick={() => {setShowPopup(showPopup === 'calendar' ? null : 'calendar')}} className="flex-1 w-full flex items-center px-6 py-4 md:border-r border-slate-100 gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
                 <CalendarIcon className="text-[#00577C]" size={20} />
                 <div className="text-left"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Datas da Estadia</p><p className="font-bold text-sm text-slate-800">{checkin ? checkin.toLocaleDateString('pt-BR',{day:'2-digit', month:'short'}) : 'Check-in'} — {checkout ? checkout.toLocaleDateString('pt-BR',{day:'2-digit', month:'short'}) : 'Check-out'}</p></div>
                 {showPopup === 'calendar' && renderCalendario()}
              </div>

              <div onClick={() => {setShowPopup(showPopup === 'hospedes' ? null : 'hospedes')}} className="flex-1 w-full flex items-center px-6 py-4 gap-3 cursor-pointer hover:bg-slate-50 transition-colors rounded-r-full">
                 <Users className="text-[#00577C]" size={20} />
                 <div className="text-left"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Viajantes</p><p className="font-bold text-sm text-slate-800">{adultos} Adultos · {quartos} Quarto</p></div>
                 
                 {showPopup === 'hospedes' && (
                    <div className="absolute top-[120%] right-0 md:right-32 w-72 bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-50 text-slate-800" onClick={e=>e.stopPropagation()}>
                       <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                          <span className="font-bold text-sm">Adultos</span>
                          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1"><button onClick={()=>setAdultos(Math.max(1, adultos-1))} className="w-8 h-8 rounded text-[#00577C] font-black">-</button><span className="font-black text-sm w-4 text-center">{adultos}</span><button onClick={()=>setAdultos(adultos+1)} className="w-8 h-8 rounded text-[#00577C] font-black">+</button></div>
                       </div>
                       <div className="flex items-center justify-between pt-4">
                          <span className="font-bold text-sm">Quartos</span>
                          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1"><button onClick={()=>setQuartos(Math.max(1, quartos-1))} className="w-8 h-8 rounded text-[#00577C] font-black">-</button><span className="font-black text-sm w-4 text-center">{quartos}</span><button onClick={()=>setQuartos(quartos+1)} className="w-8 h-8 rounded text-[#00577C] font-black">+</button></div>
                       </div>
                    </div>
                 )}
              </div>

              <button onClick={handleBuscar} disabled={isSearchLoading} className="w-full md:w-auto h-[60px] md:h-auto bg-[#F9C400] hover:bg-[#e5b500] text-[#00577C] px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                 {isSearchLoading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={16} /> Pesquisar</>}
              </button>
           </div>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL (LISTA + FILTROS) ── */}
      <section className="mx-auto max-w-[1400px] px-6 pt-16">
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

          {/* LISTA DE HOTÉIS COM EFEITO CASCATA */}
          <div className="flex-1 w-full space-y-8">
            <h2 className={`${jakarta.className} text-3xl font-black text-slate-800 mb-6`}>{hoteisFiltrados.length} Alojamentos Encontrados</h2>

            {loading || isSearchLoading ? (
               [...Array(3)].map((_, i) => <HotelCardSkeleton key={i} />)
            ) : hoteisFiltrados.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200"><Search size={40} className="mx-auto text-slate-300 mb-4" /><p className="font-bold text-slate-500">Sem resultados para estes filtros.</p></div>
            ) : (
               hoteisFiltrados.map((hotel, index) => {
                  const cap = Math.ceil(adultos / quartos);
                  const qts = hotel.tipos_quarto?.filter(q => q.capacidade >= cap) || [];
                  const sVagas = qts.length === 0;
                  const qP = !sVagas ? qts.reduce((p,c) => c.preco_quarto < p.preco_quarto ? c : p) : null;
                  const pB = qP ? qP.preco_quarto : parseValor(hotel.quarto_standard_preco || hotel.preco_medio);
                  
                  const dDin = precosDinamicos[hotel.id];
                  const pTotal = dDin ? dDin.valor_total : pB * (checkin&&checkout?Math.ceil((checkout.getTime()-checkin.getTime())/86400000):1) * quartos;
                  const indisp = sVagas || (dDin && !dDin.disponivel);

                  return (
                    <article key={hotel.id} className={`animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all p-4 flex flex-col md:flex-row gap-6 md:gap-10 overflow-hidden ${indisp ? 'opacity-60 grayscale-[50%]' : ''}`} style={{ animationDelay: `${index * 150}ms` }}>
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

                          <div className="mt-auto border-t border-slate-100 pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                             <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Valor para {checkin&&checkout?Math.ceil((checkout.getTime()-checkin.getTime())/86400000):1} noite(s)</p>
                               <p className={`${jakarta.className} text-3xl font-black text-[#00577C]`}>{indisp ? '—' : formatarMoeda(pTotal)}</p>
                             </div>
                             <Link href={`/hoteis/${hotel.id}`} className={`w-full sm:w-auto px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${indisp ? 'bg-slate-200 text-slate-400 pointer-events-none' : 'bg-[#00577C] text-white hover:bg-[#004a6b] shadow-lg hover:shadow-xl hover:-translate-y-1'}`}>
                               {indisp ? 'Indisponível' : 'Ver Quartos'} <ArrowRight size={16}/>
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
      <footer className="py-12 md:py-20 px-5 md:px-8 border-t border-slate-200 bg-white mt-12 md:mt-20 text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
             <Image src="/logop.png" alt="SGA" width={140} height={50} className="object-contain" />
             <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] text-center md:text-left">© 2026 Secretaria Municipal de Turismo - SGA</p>
          </div>
          <div className="flex items-center gap-6 md:gap-10">
             <div className="text-left md:border-l-2 border-slate-100 md:pl-6">
                <p className="text-[9px] md:text-[10px] font-black text-[#00577C] uppercase mb-1">Contato Oficial</p>
                <p className="text-xs font-bold text-slate-500 tracking-tight">setursaga@gmail.com</p>
             </div>
             <ShieldCheck size={36} className="text-[#009640] opacity-30 md:w-10 md:h-10"/>
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