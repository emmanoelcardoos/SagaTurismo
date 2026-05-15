'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Menu, MapPin, ArrowRight,
  Search, Calendar as CalendarIcon, Star, 
  CheckCircle2, ChevronRight, ShieldCheck, 
  Filter, Bed, Users, Coffee, Wifi, Car,
  ChevronLeft, X
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGENS ──
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

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542314831-c53cd6b7608b?q=80&w=1740";

// Garantir extração de array mesmo que venha como string do banco
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

export default function HoteisPage() {
  const [hoteis, setHoteis] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // ── ESTADOS DA BARRA DE PESQUISA ──
  const [adultos, setAdultos] = useState(2);
  const [criancas, setCriancas] = useState(0);
  const [quartos, setQuartos] = useState(1);
  const [showHospedesPopup, setShowHospedesPopup] = useState(false);

  // Calendário Customizado
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [mesAtualCalendario, setMesAtualCalendario] = useState(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // ── ESTADOS DOS FILTROS LATERALES ──
  const [estrelasSelecionadas, setEstrelasSelecionadas] = useState<number[]>([]);
  const [comodidadesSelecionadas, setComodidadesSelecionadas] = useState<string[]>([]);

  // Referência para detetar cliques fora da barra de pesquisa
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchHoteis() {
      const { data } = await supabase.from('hoteis').select('*').order('nome');
      if (data) setHoteis(data);
      setLoading(false);
    }
    fetchHoteis();
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

  // Efeito para detetar cliques fora dos pop-ups
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowCalendarPopup(false);
        setShowHospedesPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ── LÓGICA DO CALENDÁRIO ──
  const diasDoMes = (ano: number, mes: number) => new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaDoMes = (ano: number, mes: number) => new Date(ano, mes, 1).getDay();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const handleDateClick = (data: Date) => {
    if (!checkin || (checkin && checkout)) {
      setCheckin(data);
      setCheckout(null);
    } else if (data > checkin) {
      setCheckout(data);
      setTimeout(() => setShowCalendarPopup(false), 300);
    } else {
      setCheckin(data);
    }
  };

  const formatarDataInput = (data: Date | null) => {
    if (!data) return '';
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  // ── FUNÇÕES DE FILTRAGEM ──
  const toggleEstrela = (star: number) => {
    setEstrelasSelecionadas(prev => prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]);
  };

  const toggleComodidade = (item: string) => {
    setComodidadesSelecionadas(prev => prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]);
  };

  const hoteisFiltrados = useMemo(() => {
    return hoteis.filter(hotel => {
      if (estrelasSelecionadas.length > 0 && !estrelasSelecionadas.includes(hotel.estrelas)) return false;
      
      if (comodidadesSelecionadas.length > 0) {
        const comodidadesHotel = getArraySeguro(hotel.comodidades);
        const temTodas = comodidadesSelecionadas.every(c => comodidadesHotel.includes(c));
        if (!temTodas) return false;
      }
      return true;
    });
  }, [hoteis, estrelasSelecionadas, comodidadesSelecionadas]);

  // ── MATEMÁTICA DA PESQUISA ──
  const noites = (checkin && checkout && checkout > checkin) 
    ? Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 3600 * 24)) 
    : 1;
  const totalQuartos = quartos || 1;

  // ── RENDERIZAÇÃO DA GRELHA DO MÊS ──
  const renderMonth = () => {
    const ano = mesAtualCalendario.getFullYear();
    const mes = mesAtualCalendario.getMonth();
    const totalDias = diasDoMes(ano, mes);
    const primeiroDia = primeiroDiaDoMes(ano, mes);

    return (
      <div 
        className="absolute top-[calc(100%+12px)] left-0 w-80 bg-white rounded-3xl border border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-5 z-[100] animate-in fade-in slide-in-from-top-2 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setMesAtualCalendario(new Date(ano, mes - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-[#00577C] transition-colors"><ChevronLeft size={18}/></button>
          <p className={`${jakarta.className} font-black text-slate-800 capitalize`}>{mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
          <button onClick={() => setMesAtualCalendario(new Date(ano, mes + 1))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-[#00577C] transition-colors"><ChevronRight size={18}/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-3">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="text-[10px] font-black text-slate-400">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: totalDias }).map((_, i) => {
            const dataAtual = new Date(ano, mes, i + 1);
            const isPassado = dataAtual < hoje;
            const isCheckin = checkin && dataAtual.getTime() === checkin.getTime();
            const isCheckout = checkout && dataAtual.getTime() === checkout.getTime();
            const isInBetween = checkin && checkout && dataAtual > checkin && dataAtual < checkout;
            const isHovered = hoverDate && checkin && !checkout && dataAtual > checkin && dataAtual <= hoverDate;

            let bgClass = "hover:bg-slate-100 text-slate-800 font-semibold";
            if (isPassado) bgClass = "text-slate-300 cursor-not-allowed";
            else if (isCheckin || isCheckout) bgClass = "bg-[#00577C] text-white shadow-md rounded-xl font-black scale-105 z-10";
            else if (isInBetween || isHovered) bgClass = "bg-[#00577C]/10 text-[#00577C] rounded-none";

            return (
              <button
                key={i}
                disabled={isPassado}
                onClick={() => handleDateClick(dataAtual)}
                onMouseEnter={() => !isPassado && setHoverDate(dataAtual)}
                onMouseLeave={() => setHoverDate(null)}
                className={`w-full aspect-square flex items-center justify-center text-sm transition-all ${bgClass}`}
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
            <Link href="/pacotes" className="text-sm text-slate-600 hover:text-[#00577C]">Pacotes</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm text-[#00577C] shadow-lg hover:bg-[#ffd633] transition-all">Cartão Residente</Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION SÓBRIA & OFICIAL */}
      <section className="relative pt-[140px] pb-16 bg-[#00577C] z-30">
        <div className="relative z-10 mx-auto max-w-7xl px-6 text-left">
          <h1 className={`${jakarta.className} text-4xl md:text-5xl font-black text-white leading-tight mb-8`}>
            Alojamento Oficial. <span className="text-[#F9C400]">Reserva Segura.</span>
          </h1>

          {/* BARRA DE PESQUISA ESTILO BOOKING */}
          <div ref={searchBarRef} className="bg-[#F9C400] p-1.5 md:p-2 rounded-[2rem] shadow-xl max-w-5xl flex flex-col md:flex-row gap-1.5 md:gap-2 relative z-50">
            
            {/* 1. Destino Fixo */}
            <div className="bg-white flex-1 rounded-[1.5rem] px-5 py-3 flex items-center gap-3">
               <MapPin className="text-[#00577C] shrink-0" size={24} />
               <div className="text-left overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">Destino</p>
                  <p className="font-bold text-slate-800 text-sm truncate">São Geraldo do Araguaia - PA</p>
               </div>
            </div>

            {/* 2. Calendário Customizado */}
            <div 
              className="bg-white flex-1 rounded-[1.5rem] px-5 py-3 flex items-center gap-3 relative cursor-pointer select-none hover:bg-slate-50 transition-colors" 
              onClick={() => {setShowCalendarPopup(!showCalendarPopup); setShowHospedesPopup(false);}}
            >
               <CalendarIcon className="text-[#00577C] shrink-0" size={24} />
               <div className="text-left flex-1 overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">Check-in — Check-out</p>
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {checkin ? formatarDataInput(checkin) : 'Selecionar datas'} {checkout ? ` - ${formatarDataInput(checkout)}` : ''}
                  </p>
               </div>
               {showCalendarPopup && renderMonth()}
            </div>

            {/* 3. Hóspedes e Quartos */}
            <div 
              className="bg-white flex-1 rounded-[1.5rem] px-5 py-3 flex items-center gap-3 relative cursor-pointer select-none hover:bg-slate-50 transition-colors" 
              onClick={() => {setShowHospedesPopup(!showHospedesPopup); setShowCalendarPopup(false);}}
            >
               <Users className="text-[#00577C] shrink-0" size={24} />
               <div className="text-left flex-1 overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">Hóspedes e Quartos</p>
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {adultos} Adultos · {criancas} Crianças · {quartos} Quarto
                  </p>
               </div>

               {/* Pop-up Hóspedes */}
               {showHospedesPopup && (
                 <div 
                   className="absolute top-[calc(100%+12px)] left-0 md:left-auto md:right-0 w-[calc(100vw-3rem)] md:w-80 bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200 p-6 z-[100] text-slate-800 animate-in fade-in slide-in-from-top-2 cursor-default" 
                   onClick={e => e.stopPropagation()}
                 >
                    {/* Adultos */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div><p className="font-bold text-sm">Adultos</p></div>
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                         <button onClick={() => setAdultos(Math.max(1, adultos - 1))} className="w-9 h-9 flex justify-center items-center rounded-lg hover:bg-white text-[#00577C] font-black text-lg transition-all">-</button>
                         <span className="font-black text-sm w-4 text-center text-[#00577C]">{adultos}</span>
                         <button onClick={() => setAdultos(adultos + 1)} className="w-9 h-9 flex justify-center items-center rounded-lg hover:bg-white text-[#00577C] font-black text-lg transition-all">+</button>
                      </div>
                    </div>
                    {/* Crianças */}
                    <div className="flex items-center justify-between py-4 border-b border-slate-100">
                      <div className="text-left"><p className="font-bold text-sm leading-tight">Crianças</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Até 12 anos</p></div>
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                         <button onClick={() => setCriancas(Math.max(0, criancas - 1))} className="w-9 h-9 flex justify-center items-center rounded-lg hover:bg-white text-[#00577C] font-black text-lg transition-all">-</button>
                         <span className="font-black text-sm w-4 text-center text-[#00577C]">{criancas}</span>
                         <button onClick={() => setCriancas(criancas + 1)} className="w-9 h-9 flex justify-center items-center rounded-lg hover:bg-white text-[#00577C] font-black text-lg transition-all">+</button>
                      </div>
                    </div>
                    {/* Quartos */}
                    <div className="flex items-center justify-between pt-4">
                      <div><p className="font-bold text-sm">Quartos</p></div>
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                         <button onClick={() => setQuartos(Math.max(1, quartos - 1))} className="w-9 h-9 flex justify-center items-center rounded-lg hover:bg-white text-[#00577C] font-black text-lg transition-all">-</button>
                         <span className="font-black text-sm w-4 text-center text-[#00577C]">{quartos}</span>
                         <button onClick={() => setQuartos(quartos + 1)} className="w-9 h-9 flex justify-center items-center rounded-lg hover:bg-white text-[#00577C] font-black text-lg transition-all">+</button>
                      </div>
                    </div>
                 </div>
               )}
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
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Categoria</p>
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map(star => (
                    <label key={star} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={estrelasSelecionadas.includes(star)}
                        onChange={() => toggleEstrela(star)}
                        className="w-5 h-5 rounded-md border-slate-300 text-[#00577C] focus:ring-[#00577C]" 
                      />
                      <div className="flex items-center gap-1 text-[#F9C400] group-hover:opacity-80 transition-opacity">
                        {Array.from({ length: star }).map((_, i) => <Star key={i} size={14} fill="currentColor"/>)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Comodidades</p>
                <div className="space-y-4">
                  {['Piscina', 'Wi-Fi Grátis', 'Estacionamento', 'Café-da-Manhã'].map(item => (
                    <label key={item} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={comodidadesSelecionadas.includes(item)}
                        onChange={() => toggleComodidade(item)}
                        className="w-5 h-5 rounded-md border-slate-300 text-[#00577C] focus:ring-[#00577C]" 
                      />
                      <span className="text-sm font-bold text-slate-600 group-hover:text-[#00577C] transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* LISTA DE HOTÉIS HORIZONTAL */}
          <div className="flex-1 w-full space-y-8">
            <div className="flex items-center justify-between mb-2">
               <h2 className={`${jakarta.className} text-3xl font-black text-slate-800`}>Alojamentos Disponíveis</h2>
               {!loading && <p className="text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-200">{hoteisFiltrados.length} opções</p>}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-200 shadow-sm">
                <Loader2 className="animate-spin text-[#00577C] mb-4" size={48}/>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscando alojamentos...</p>
              </div>
            ) : hoteisFiltrados.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <Search size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-bold text-slate-500">Nenhum alojamento atende aos filtros selecionados.</p>
              </div>
            ) : (
              hoteisFiltrados.map((hotel) => {
                const precoDiaria = parseValor(hotel.quarto_standard_preco || hotel.preco_medio);
                const precoTotal = precoDiaria * noites * totalQuartos;

                return (
                  <article key={hotel.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row overflow-hidden group">
                    
                    {/* IMAGEM (Lado Esquerdo) */}
                    <div className="relative w-full md:w-80 h-64 md:h-auto shrink-0 overflow-hidden bg-slate-100">
                      <Image src={hotel.imagem_url || FALLBACK_IMAGE} alt={hotel.nome} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-5 left-5 bg-[#F9C400] text-[#00577C] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                        {hotel.tipo}
                      </div>
                    </div>

                    {/* CONTEÚDO (Lado Direito) */}
                    <div className="p-8 flex flex-col flex-1 text-left">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-1 text-[#F9C400] mb-3">
                            {Array.from({ length: hotel.estrelas || 3 }).map((_, i) => <Star key={i} size={14} fill="currentColor"/>)}
                          </div>
                          <h3 className={`${jakarta.className} text-3xl font-black text-[#00577C] leading-tight hover:underline cursor-pointer`}>
                            <Link href={`/hoteis/${hotel.id}`}>{hotel.nome}</Link>
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-5">
                        <MapPin size={16} className="text-[#009640]"/> São Geraldo do Araguaia
                      </div>
                      
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-6 font-medium pr-4">
                        {hotel.descricao}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-slate-500 mb-8">
                         {getArraySeguro(hotel.comodidades).slice(0, 3).map((comodidade, i) => (
                           <span key={i} className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                             <CheckCircle2 size={14} className="text-[#00577C]"/> {comodidade}
                           </span>
                         ))}
                      </div>

                      {/* PREÇO E BOTÃO DA MATEMÁTICA */}
                      <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div>
                           <p className="text-xs font-bold text-slate-500 mb-1">
                             {noites} {noites === 1 ? 'noite' : 'noites'}, {adultos} {adultos === 1 ? 'adulto' : 'adultos'}
                           </p>
                           <p className="text-xs font-bold text-slate-400">
                             Total estimado: <span className="font-black text-slate-700">{formatarMoeda(precoTotal)}</span>
                           </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Diária a partir de</p>
                           <p className={`${jakarta.className} text-4xl font-black text-[#00577C] tabular-nums mb-4 leading-none`}>
                             {formatarMoeda(precoDiaria)}
                           </p>
                           <Link href={`/hoteis/${hotel.id}?checkin=${checkin ? checkin.toISOString() : ''}&checkout=${checkout ? checkout.toISOString() : ''}&adultos=${adultos}&quartos=${quartos}`} className="bg-[#00577C] text-white px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-[#004a6b] transition-all shadow-xl hover:shadow-[#00577C]/20 flex items-center gap-3 hover:translate-x-1">
                             Ver Disponibilidade <ChevronRight size={20}/>
                           </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
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