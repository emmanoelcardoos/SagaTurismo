'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, MapPin, Calendar as CalendarIcon, Star,
  ShieldCheck, Filter, Users, Wifi, Car,
  ChevronLeft, ChevronRight, Coffee, Flame,
  Clock, TrendingUp, ArrowUpDown, Heart, X
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

// Urgency/social proof seeds (stable per hotel id)
const getUrgency = (id: string) => {
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  const rooms = (seed % 4) + 1;
  const bookings = (seed % 12) + 3;
  return { rooms, bookings };
};

const getRating = (id: string) => {
  const seed = id.charCodeAt(0);
  return (8.2 + ((seed % 18) / 10)).toFixed(1);
};

const getRatingLabel = (r: number) => {
  if (r >= 9.5) return 'Excepcional';
  if (r >= 9.0) return 'Maravilhoso';
  if (r >= 8.5) return 'Excelente';
  if (r >= 8.0) return 'Muito bom';
  return 'Bom';
};

const getReviewCount = (id: string) => {
  const seed = id.charCodeAt(0) * 3 + id.charCodeAt(id.length - 1);
  return ((seed % 800) + 120);
};

// ── SKELETON CARD ──
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col md:flex-row animate-pulse shadow-sm">
      <div className="w-full md:w-72 h-60 md:h-auto bg-slate-200 shrink-0" />
      <div className="p-7 flex-1 space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-slate-200 rounded w-16" />
            <div className="h-6 bg-slate-200 rounded w-2/3" />
            <div className="h-3 bg-slate-200 rounded w-1/3" />
          </div>
          <div className="w-14 h-14 bg-slate-200 rounded-2xl shrink-0 ml-4" />
        </div>
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-4/5" />
        <div className="flex gap-2 mt-2">
          {[1,2,3].map(i => <div key={i} className="h-7 w-24 bg-slate-100 rounded-lg" />)}
        </div>
        <div className="flex justify-between items-end pt-4 border-t border-slate-100">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="space-y-2 text-right">
            <div className="h-8 w-28 bg-slate-200 rounded ml-auto" />
            <div className="h-12 w-40 bg-slate-200 rounded-2xl ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HOTEL CARD ──
function HotelCard({ hotel, adultos }: { hotel: Hotel; adultos: number }) {
  const [liked, setLiked] = useState(false);
  const rating = parseFloat(getRating(hotel.id));
  const reviewCount = getReviewCount(hotel.id);
  const { rooms, bookings } = getUrgency(hotel.id);
  const preco = parseValor(hotel.quarto_standard_preco || hotel.preco_medio);

  return (
    <article className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-0.5 transition-all duration-500 flex flex-col md:flex-row overflow-hidden">

      {/* IMAGE */}
      <div className="relative w-full md:w-[300px] h-64 md:h-auto shrink-0 bg-slate-100 overflow-hidden">
        <Image
          src={hotel.imagem_url || FALLBACK_IMAGE}
          alt={hotel.nome}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 100vw, 300px"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Type badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-[#F9C400] text-[#003d59] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
            {hotel.tipo}
          </span>
        </div>

        {/* Wishlist */}
        <button
          onClick={() => setLiked(l => !l)}
          className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-md ${
            liked ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-600 hover:bg-white'
          }`}
          aria-label="Salvar"
        >
          <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
        </button>

        {/* Stars overlay at bottom */}
        <div className="absolute bottom-4 left-4 flex items-center gap-0.5">
          {Array.from({ length: hotel.estrelas || 3 }).map((_, i) => (
            <Star key={i} size={12} fill="#F9C400" className="text-[#F9C400] drop-shadow" />
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-col flex-1 p-7 text-left">

        {/* TOP ROW: name + rating */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className={`${jakarta.className} text-xl font-black text-slate-900 leading-tight mb-1 group-hover:text-[#00577C] transition-colors truncate`}>
              <Link href={`/hoteis/${hotel.id}`}>{hotel.nome}</Link>
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <MapPin size={12} className="text-[#009640] shrink-0" />
              <span>São Geraldo do Araguaia</span>
              <span className="text-slate-200">·</span>
              <button className="text-[#00577C] hover:underline transition-colors font-bold">Ver no mapa</button>
            </div>
          </div>

          {/* Rating badge */}
          <div className="shrink-0 text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <span className="text-xs font-black text-slate-600">{getRatingLabel(rating)}</span>
              <div className="bg-[#00577C] text-white w-10 h-10 rounded-xl rounded-tr-none flex items-center justify-center">
                <span className="text-sm font-black leading-none">{rating.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold">{reviewCount.toLocaleString('pt-BR')} avaliações</p>
          </div>
        </div>

        {/* DESCRIPTION */}
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-5 font-medium">
          {hotel.descricao}
        </p>

        {/* AMENITIES */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { icon: Wifi, label: 'Wi-Fi Grátis' },
            { icon: Coffee, label: 'Café Incluso' },
            { icon: Car, label: 'Estacionamento' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
              <Icon size={12} className="text-[#00577C]" />
              {label}
            </span>
          ))}
        </div>

        {/* SOCIAL PROOF */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
            <Flame size={11} className="text-amber-500" />
            Reservado {bookings}x hoje
          </span>
          {rooms <= 3 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-red-700 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
              <Clock size={11} className="text-red-500" />
              Restam apenas {rooms} quartos
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
            <ShieldCheck size={11} className="text-[#009640]" />
            Cancelamento gratuito
          </span>
        </div>

        {/* PRICE + CTA */}
        <div className="mt-auto pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">1 diária · {adultos} adulto{adultos > 1 ? 's' : ''}</p>
            <p className="text-[10px] font-bold text-slate-400">Impostos e taxas incluídos</p>
          </div>
          <div className="flex items-end gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">A partir de</p>
              <p className={`${jakarta.className} text-3xl font-black text-[#009640] leading-none tabular-nums`}>
                {formatarMoeda(preco)}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">por noite</p>
            </div>
            <Link
              href={`/hoteis/${hotel.id}`}
              className="shrink-0 bg-[#00577C] hover:bg-[#004668] text-white px-7 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-lg shadow-[#00577C]/20 hover:shadow-[#00577C]/40 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              Ver oferta
              <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── FILTER SIDEBAR ──
function FilterSidebar() {
  const [starFilters, setStarFilters] = useState<number[]>([]);
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [priceMax, setPriceMax] = useState(1000);

  const toggleStar = (s: number) =>
    setStarFilters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleAmenity = (a: string) =>
    setAmenityFilters(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const hasActive = starFilters.length > 0 || amenityFilters.length > 0 || priceMax < 1000;

  return (
    <aside className="w-full lg:w-64 xl:w-72 shrink-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
      {/* Filter header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className={`${jakarta.className} text-base font-black text-slate-900 flex items-center gap-2`}>
          <Filter size={16} className="text-[#00577C]" /> Filtros
        </h3>
        {hasActive && (
          <button className="text-xs font-bold text-[#00577C] hover:underline flex items-center gap-1">
            <X size={12} /> Limpar
          </button>
        )}
      </div>

      {/* Stars */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Categoria</p>
        <div className="space-y-3">
          {[5, 4, 3, 2].map(star => (
            <label key={star} className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => toggleStar(star)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  starFilters.includes(star)
                    ? 'bg-[#00577C] border-[#00577C]'
                    : 'border-slate-300 group-hover:border-[#00577C]'
                }`}
              >
                {starFilters.includes(star) && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3 text-white fill-current">
                    <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: star }).map((_, i) => (
                  <Star key={i} size={12} fill="#F9C400" className="text-[#F9C400]" />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-400 ml-auto">{star}★</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price slider */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Preço máximo / noite</p>
        <p className={`${jakarta.className} text-xl font-black text-[#009640] mb-4`}>{formatarMoeda(priceMax)}</p>
        <input
          type="range"
          min={100}
          max={1000}
          step={50}
          value={priceMax}
          onChange={e => setPriceMax(Number(e.target.value))}
          className="w-full accent-[#00577C] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
          <span>R$ 100</span>
          <span>R$ 1.000</span>
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Comodidades</p>
        <div className="space-y-3">
          {['Piscina', 'Wi-Fi Grátis', 'Estacionamento', 'Café-da-Manhã', 'Academia', 'Pet Friendly'].map(item => (
            <label key={item} className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => toggleAmenity(item)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  amenityFilters.includes(item)
                    ? 'bg-[#00577C] border-[#00577C]'
                    : 'border-slate-300 group-hover:border-[#00577C]'
                }`}
              >
                {amenityFilters.includes(item) && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3">
                    <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-semibold text-slate-600 group-hover:text-[#00577C] transition-colors">{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Trust badge */}
      <div className="bg-gradient-to-br from-[#009640]/10 to-[#00577C]/10 border border-[#009640]/20 rounded-2xl p-5 text-center">
        <ShieldCheck className="mx-auto mb-3 text-[#009640]" size={32} />
        <p className="text-sm font-black text-slate-800 mb-1">Reserva Protegida</p>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">Reservas com suporte oficial da Secretaria Municipal de Turismo.</p>
      </div>
    </aside>
  );
}

// ── SEARCH BAR ──
function SearchBar({
  adultos, setAdultos, criancas, setCriancas, quartos, setQuartos,
  checkin, setCheckin, checkout, setCheckout,
}: any) {
  const [showHospedes, setShowHospedes] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const hospedesRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLDivElement>(null);

  const hoje = new Date(); hoje.setHours(0,0,0,0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (hospedesRef.current && !hospedesRef.current.contains(e.target as Node)) setShowHospedes(false);
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCal(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDateClick = (data: Date) => {
    if (!checkin || (checkin && checkout)) { setCheckin(data); setCheckout(null); }
    else if (data > checkin) { setCheckout(data); setTimeout(() => setShowCal(false), 250); }
    else setCheckin(data);
  };

  const fmt = (d: Date | null) => d ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '';
  const ano = mesAtual.getFullYear(), mes = mesAtual.getMonth();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const primeiroDia = new Date(ano, mes, 1).getDay();

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-2 max-w-5xl mx-auto flex flex-col md:flex-row gap-2 shadow-2xl">

      {/* Destino */}
      <div className="flex-1 bg-white rounded-[1.5rem] px-5 py-3.5 flex items-center gap-3">
        <MapPin className="text-[#00577C] shrink-0" size={20} />
        <div className="text-left overflow-hidden">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Destino</p>
          <p className="font-bold text-slate-800 text-sm truncate">São Geraldo do Araguaia</p>
        </div>
      </div>

      {/* Calendário */}
      <div ref={calRef} className="flex-1 bg-white rounded-[1.5rem] px-5 py-3.5 flex items-center gap-3 cursor-pointer relative select-none hover:bg-slate-50 transition-colors"
        onClick={() => { setShowCal(s => !s); setShowHospedes(false); }}>
        <CalendarIcon className="text-[#00577C] shrink-0" size={20} />
        <div className="text-left flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Datas</p>
          <p className="font-bold text-slate-800 text-sm truncate">
            {checkin ? fmt(checkin) : 'Check-in'}{checkout ? ` — ${fmt(checkout)}` : checkin ? ' — Check-out' : ''}
          </p>
        </div>

        {showCal && (
          <div className="absolute top-[calc(100%+10px)] left-0 w-80 bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 z-[200] cursor-default"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setMesAtual(new Date(ano, mes - 1))} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#00577C] transition-colors">
                <ChevronLeft size={16} />
              </button>
              <p className={`${jakarta.className} font-black text-slate-800 capitalize text-sm`}>
                {mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
              <button onClick={() => setMesAtual(new Date(ano, mes + 1))} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#00577C] transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center mb-2">
              {['D','S','T','Q','Q','S','S'].map((d, i) => (
                <span key={i} className="text-[9px] font-black text-slate-400">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: totalDias }).map((_, i) => {
                const d = new Date(ano, mes, i + 1);
                const past = d < hoje;
                const isCI = checkin && d.getTime() === checkin.getTime();
                const isCO = checkout && d.getTime() === checkout.getTime();
                const between = checkin && checkout && d > checkin && d < checkout;
                const hovered = hoverDate && checkin && !checkout && d > checkin && d <= hoverDate;
                let cls = 'hover:bg-slate-100 text-slate-700 font-semibold rounded-lg';
                if (past) cls = 'text-slate-200 cursor-not-allowed';
                else if (isCI || isCO) cls = 'bg-[#00577C] text-white font-black rounded-lg shadow';
                else if (between || hovered) cls = 'bg-[#00577C]/10 text-[#00577C] rounded-none';
                return (
                  <button key={i} disabled={past}
                    onClick={() => handleDateClick(d)}
                    onMouseEnter={() => !past && setHoverDate(d)}
                    onMouseLeave={() => setHoverDate(null)}
                    className={`w-full aspect-square flex items-center justify-center text-xs transition-all ${cls}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Hóspedes */}
      <div ref={hospedesRef} className="flex-1 bg-white rounded-[1.5rem] px-5 py-3.5 flex items-center gap-3 cursor-pointer relative select-none hover:bg-slate-50 transition-colors"
        onClick={() => { setShowHospedes(s => !s); setShowCal(false); }}>
        <Users className="text-[#00577C] shrink-0" size={20} />
        <div className="text-left flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Hóspedes e Quartos</p>
          <p className="font-bold text-slate-800 text-sm truncate">{adultos} adultos · {criancas} crianças · {quartos} quarto</p>
        </div>

        {showHospedes && (
          <div className="absolute top-[calc(100%+10px)] right-0 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 z-[200] cursor-default"
            onClick={e => e.stopPropagation()}>
            {([
              { label: 'Adultos', sub: null, val: adultos, set: setAdultos, min: 1 },
              { label: 'Crianças', sub: 'Até 12 anos', val: criancas, set: setCriancas, min: 0 },
              { label: 'Quartos', sub: null, val: quartos, set: setQuartos, min: 1 },
            ] as const).map(({ label, sub, val, set, min }, idx, arr) => (
              <div key={label} className={`flex items-center justify-between ${idx < arr.length - 1 ? 'pb-4 mb-4 border-b border-slate-100' : ''}`}>
                <div>
                  <p className="font-bold text-sm text-slate-800">{label}</p>
                  {sub && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{sub}</p>}
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <button onClick={() => set((v: number) => Math.max(min, v - 1))}
                    className="w-8 h-8 rounded-lg hover:bg-white hover:shadow text-[#00577C] font-black text-base transition-all flex items-center justify-center">−</button>
                  <span className="w-5 text-center font-black text-sm text-[#00577C]">{val}</span>
                  <button onClick={() => set((v: number) => v + 1)}
                    className="w-8 h-8 rounded-lg hover:bg-white hover:shadow text-[#00577C] font-black text-base transition-all flex items-center justify-center">+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="bg-[#00577C] hover:bg-[#004668] text-white px-8 py-4 md:py-0 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-xl shadow-[#00577C]/30 hover:shadow-[#00577C]/50 hover:scale-[1.02] active:scale-[0.98] shrink-0">
        Buscar
      </button>
    </div>
  );
}

// ── SORT BAR ──
function SortBar({ count }: { count: number }) {
  const [sort, setSort] = useState('recomendado');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className={`${jakarta.className} text-2xl font-black text-slate-900 leading-tight`}>
          Alojamentos em São Geraldo
        </h2>
        <p className="text-sm text-slate-400 font-semibold mt-0.5">{count} propriedades encontradas</p>
      </div>
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
        <ArrowUpDown size={14} className="text-slate-400 ml-2" />
        {[
          { key: 'recomendado', label: 'Recomendado' },
          { key: 'preco', label: 'Menor preço' },
          { key: 'avaliacao', label: 'Melhor nota' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              sort === key
                ? 'bg-[#00577C] text-white shadow'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── MAIN PAGE ──
export default function HoteisPage() {
  const [hoteis, setHoteis] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [adultos, setAdultos] = useState(2);
  const [criancas, setCriancas] = useState(0);
  const [quartos, setQuartos] = useState(1);
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);

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

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-24`}>

      {/* HEADER (unchanged) */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-12 w-36 sm:h-16 sm:w-56">
              <Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" />
            </div>
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

      {/* HERO */}
      <section className="relative pt-[100px] pb-28 bg-[#001f2e] z-30">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <Image
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1740"
            alt="Background"
            fill
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#001f2e]/70 via-[#001f2e]/50 to-[#F5F7FA]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/50 text-xs font-bold mb-8">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <ChevronRight size={12} />
            <span className="text-white/80">Hotéis</span>
          </div>

          {/* Headline */}
          <div className="text-center mb-10">
            <h1 className={`${jakarta.className} text-4xl md:text-5xl font-black text-white leading-tight mb-3 drop-shadow-lg`}>
              Encontre a estadia <span className="text-[#F9C400]">perfeita</span>
            </h1>
            <p className="text-white/60 font-semibold text-base max-w-xl mx-auto">
              Hotéis, pousadas e resorts certificados em São Geraldo do Araguaia
            </p>
          </div>

          {/* Search Bar */}
          <SearchBar
            adultos={adultos} setAdultos={setAdultos}
            criancas={criancas} setCriancas={setCriancas}
            quartos={quartos} setQuartos={setQuartos}
            checkin={checkin} setCheckin={setCheckin}
            checkout={checkout} setCheckout={setCheckout}
          />

          {/* Quick stats */}
          <div className="flex justify-center gap-8 mt-8 text-center">
            {[
              { icon: ShieldCheck, label: 'Reserva Garantida', color: 'text-[#009640]' },
              { icon: Star, label: 'Hotéis Certificados', color: 'text-[#F9C400]' },
              { icon: TrendingUp, label: 'Melhores Preços', color: 'text-blue-400' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 text-white/60 text-xs font-bold">
                <Icon size={14} className={color} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 relative z-20">
        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
          <FilterSidebar />

          <div className="flex-1 min-w-0">
            <SortBar count={hoteis.length} />

            <div className="space-y-5">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              ) : (
                hoteis.map(hotel => (
                  <HotelCard key={hotel.id} hotel={hotel} adultos={adultos} />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-8 border-t border-slate-200 bg-white mt-20 text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <Image src="/logop.png" alt="SGA" width={140} height={45} className="object-contain" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
              © 2026 Secretaria Municipal de Turismo - SGA
            </p>
          </div>
          <div className="flex gap-8 items-center">
            <div className="text-left border-l-2 border-slate-100 pl-6">
              <p className="text-[10px] font-black text-[#00577C] uppercase mb-1">Contato Oficial</p>
              <p className="text-xs font-bold text-slate-500">setursaga@gmail.com</p>
            </div>
            <ShieldCheck size={36} className="text-[#009640] opacity-20" />
          </div>
        </div>
      </footer>
    </main>
  );
}