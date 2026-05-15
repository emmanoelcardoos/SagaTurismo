'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, MapPin, Calendar as CalendarIcon, Star,
  CheckCircle2, ChevronRight, ShieldCheck,
  Filter, Users, Coffee, Wifi, Car,
  ChevronLeft, X, Heart, TrendingUp, Award, Search
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

// ── SKELETON CARD ──
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row animate-pulse">
      <div className="w-full md:w-72 h-56 md:h-auto bg-slate-200 shrink-0" />
      <div className="p-7 flex-1 space-y-4">
        <div className="h-3 w-16 bg-slate-200 rounded-full" />
        <div className="h-6 w-2/3 bg-slate-200 rounded-lg" />
        <div className="h-3 w-1/3 bg-slate-100 rounded-full" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-100 rounded-full" />
          <div className="h-3 w-5/6 bg-slate-100 rounded-full" />
        </div>
        <div className="flex gap-2 pt-1">
          {[1, 2, 3].map(i => <div key={i} className="h-7 w-20 bg-slate-100 rounded-lg" />)}
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
          <div className="h-3 w-28 bg-slate-100 rounded-full" />
          <div className="h-10 w-40 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function HoteisPage() {
  const [hoteis, setHoteis] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [savedHotels, setSavedHotels] = useState<Set<string>>(new Set());

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

  const toggleSaved = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSavedHotels(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── RENDERIZAÇÃO DO CALENDÁRIO ──
  const renderMonth = () => {
    const ano = mesAtualCalendario.getFullYear();
    const mes = mesAtualCalendario.getMonth();
    const totalDias = diasDoMes(ano, mes);
    const primeiroDia = primeiroDiaDoMes(ano, mes);

    return (
      <div
        className="absolute top-[calc(100%+8px)] left-0 w-76 bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 z-[100] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setMesAtualCalendario(new Date(ano, mes - 1))}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-[#00577C] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <p className={`${jakarta.className} font-black text-slate-800 capitalize text-sm`}>
            {mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
          <button
            onClick={() => setMesAtualCalendario(new Date(ano, mes + 1))}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-[#00577C] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-[10px] font-black text-slate-400 py-1">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: totalDias }).map((_, i) => {
            const dataAtual = new Date(ano, mes, i + 1);
            const isPassado = dataAtual < hoje;
            const isCheckin = checkin && dataAtual.getTime() === checkin.getTime();
            const isCheckout = checkout && dataAtual.getTime() === checkout.getTime();
            const isInBetween = checkin && checkout && dataAtual > checkin && dataAtual < checkout;
            const isHovered = hoverDate && checkin && !checkout && dataAtual > checkin && dataAtual <= hoverDate;

            let cls = "hover:bg-slate-100 text-slate-700 font-semibold rounded-lg";
            if (isPassado) cls = "text-slate-300 cursor-not-allowed";
            else if (isCheckin || isCheckout) cls = "bg-[#00577C] text-white font-black rounded-lg";
            else if (isInBetween || isHovered) cls = "bg-[#00577C]/10 text-[#00577C]";

            return (
              <button
                key={i}
                disabled={isPassado}
                onClick={() => handleDateClick(dataAtual)}
                onMouseEnter={() => !isPassado && setHoverDate(dataAtual)}
                onMouseLeave={() => setHoverDate(null)}
                className={`w-full aspect-square flex items-center justify-center text-xs transition-all ${cls}`}
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

      {/* HEADER — unchanged */}
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
      <section className="relative pt-[88px] bg-[#002f40] z-30 pb-28">
        {/* Background image + gradient */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <Image
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1740"
            alt="Background"
            fill
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#001e2b] via-[#002f40]/70 to-[#F5F7FA]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center pt-12">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
            <Award size={13} className="text-[#F9C400]" />
            <span className="text-white/70 text-[11px] font-bold uppercase tracking-widest">Destino Oficial Certificado</span>
          </div>

          <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-[3.5rem] font-black text-white leading-[1.08] mb-4`}>
            Encontre a estadia{' '}
            <span className="text-[#F9C400]">perfeita em SGA.</span>
          </h1>
          <p className="text-[15px] text-white/55 font-medium max-w-md mx-auto mb-10">
            Hotéis, pousadas e resorts certificados em São Geraldo do Araguaia.
          </p>

          {/* ── SEARCH BAR ── */}
          <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.22)] max-w-5xl mx-auto relative z-50">
            <div className="flex flex-col md:flex-row">

              {/* Destino */}
              <div className="flex-1 flex items-center gap-3 px-6 py-5 border-b md:border-b-0 md:border-r border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-[#00577C]/8 flex items-center justify-center shrink-0">
                  <MapPin size={17} className="text-[#00577C]" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Destino</p>
                  <p className="font-bold text-slate-800 text-sm truncate">São Geraldo do Araguaia, PA</p>
                </div>
              </div>

              {/* Calendário */}
              <div
                className="flex-1 flex items-center gap-3 px-6 py-5 border-b md:border-b-0 md:border-r border-slate-100 relative cursor-pointer select-none hover:bg-slate-50/70 transition-colors"
                onClick={() => { setShowCalendarPopup(!showCalendarPopup); setShowHospedesPopup(false); }}
              >
                <div className="w-9 h-9 rounded-xl bg-[#00577C]/8 flex items-center justify-center shrink-0">
                  <CalendarIcon size={17} className="text-[#00577C]" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Check-in — Check-out</p>
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {checkin ? formatarDataInput(checkin) : 'Selecionar datas'}
                    {checkout ? ` → ${formatarDataInput(checkout)}` : ''}
                  </p>
                </div>
                {showCalendarPopup && renderMonth()}
              </div>

              {/* Hóspedes */}
              <div
                className="flex-1 flex items-center gap-3 px-6 py-5 relative cursor-pointer select-none hover:bg-slate-50/70 transition-colors"
                onClick={() => { setShowHospedesPopup(!showHospedesPopup); setShowCalendarPopup(false); }}
              >
                <div className="w-9 h-9 rounded-xl bg-[#00577C]/8 flex items-center justify-center shrink-0">
                  <Users size={17} className="text-[#00577C]" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Hóspedes</p>
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {adultos} adultos · {criancas} crianças · {quartos} quarto
                  </p>
                </div>

                {showHospedesPopup && (
                  <div
                    className="absolute top-[calc(100%+8px)] right-0 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-[100] cursor-default"
                    onClick={e => e.stopPropagation()}
                  >
                    {[
                      { label: 'Adultos', sub: null, val: adultos, set: setAdultos, min: 1 },
                      { label: 'Crianças', sub: 'Até 12 anos', val: criancas, set: setCriancas, min: 0 },
                      { label: 'Quartos', sub: null, val: quartos, set: setQuartos, min: 1 },
                    ].map(({ label, sub, val, set, min }, idx, arr) => (
                      <div key={label} className={`flex items-center justify-between py-4 ${idx < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{label}</p>
                          {sub && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{sub}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => set(Math.max(min, val - 1))}
                            disabled={val <= min}
                            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-[#00577C] font-black hover:border-[#00577C] hover:bg-[#00577C]/5 transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                          >−</button>
                          <span className="font-black text-sm w-4 text-center text-slate-900">{val}</span>
                          <button
                            onClick={() => set(val + 1)}
                            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-[#00577C] font-black hover:border-[#00577C] hover:bg-[#00577C]/5 transition-all text-sm"
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Buscar CTA */}
              <div className="p-2 flex items-center">
                <button className="w-full md:w-auto bg-[#00577C] text-white px-8 py-[14px] rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#004a6b] active:scale-[0.97] transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-sm">
                  <Search size={15} />
                  Buscar
                </button>
              </div>
            </div>
          </div>

          {/* Trust stats */}
          <div className="flex items-center justify-center gap-10 mt-8">
            {[
              { n: '40+', label: 'Alojamentos' },
              { n: '9.4', label: 'Avaliação média' },
              { n: '100%', label: 'Verificados' },
            ].map(({ n, label }) => (
              <div key={label} className="text-center">
                <p className={`${jakarta.className} text-xl font-black text-[#F9C400]`}>{n}</p>
                <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 relative z-20">
        <div className="flex flex-col lg:flex-row gap-7 items-start">

          {/* ── SIDEBAR ── */}
          <aside className="w-full lg:w-60 xl:w-64 shrink-0 space-y-4 lg:sticky lg:top-24">
            {/* Filter card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className={`${jakarta.className} text-sm font-black text-slate-900 flex items-center gap-2`}>
                  <Filter size={14} className="text-[#00577C]" /> Filtrar
                </h3>
                <button className="text-[10px] font-black text-[#00577C] hover:underline uppercase tracking-wide">Limpar</button>
              </div>
              <div className="p-5 space-y-5">
                {/* Stars */}
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Categoria</p>
                  <div className="space-y-2.5">
                    {[5, 4, 3].map(star => (
                      <label key={star} className="flex items-center gap-2.5 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#00577C] focus:ring-[#00577C] focus:ring-offset-0" />
                        <div className="flex items-center gap-0.5 text-[#F9C400]">
                          {Array.from({ length: star }).map((_, i) => <Star key={i} size={11} fill="currentColor" />)}
                        </div>
                        <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">{star} estrelas</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Comodidades</p>
                  <div className="space-y-2.5">
                    {['Piscina', 'Wi-Fi Grátis', 'Estacionamento', 'Café-da-Manhã'].map(item => (
                      <label key={item} className="flex items-center gap-2.5 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#00577C] focus:ring-[#00577C] focus:ring-offset-0" />
                        <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Trust badge */}
            <div className="bg-gradient-to-br from-[#009640]/6 to-[#00577C]/6 border border-[#009640]/12 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#009640]/10 flex items-center justify-center">
                  <ShieldCheck size={16} className="text-[#009640]" />
                </div>
                <p className="text-sm font-black text-[#009640]">Reserva Garantida</p>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Ao reservar pelo portal SagaTurismo, você conta com suporte local oficial da Prefeitura.
              </p>
            </div>
          </aside>

          {/* ── HOTEL LIST ── */}
          <div className="flex-1 w-full min-w-0">
            {/* List header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className={`${jakarta.className} text-2xl font-black text-slate-900`}>
                  {loading ? 'Buscando...' : `${hoteis.length} alojamentos`}
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">São Geraldo do Araguaia, Pará</p>
              </div>
              {!loading && (
                <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-sm">
                  <TrendingUp size={13} className="text-[#00577C]" />
                  Recomendados
                </div>
              )}
            </div>

            {/* Cards */}
            <div className="space-y-4">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                hoteis.map((hotel) => (
                  <article
                    key={hotel.id}
                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col md:flex-row overflow-hidden"
                  >
                    {/* IMAGE */}
                    <div className="relative w-full md:w-64 xl:w-72 h-52 md:h-auto shrink-0 overflow-hidden bg-slate-100">
                      <Image
                        src={hotel.imagem_url || FALLBACK_IMAGE}
                        alt={hotel.nome}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        sizes="(max-width: 768px) 100vw, 288px"
                      />
                      {/* Subtle bottom gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

                      {/* Type badge */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-[#F9C400] text-[#002f40] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                          {hotel.tipo}
                        </span>
                      </div>

                      {/* Wishlist button */}
                      <button
                        onClick={(e) => toggleSaved(hotel.id, e)}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all hover:scale-105 active:scale-95"
                        aria-label="Salvar"
                      >
                        <Heart
                          size={14}
                          className={savedHotels.has(hotel.id) ? 'text-red-500 fill-red-500' : 'text-slate-400'}
                        />
                      </button>
                    </div>

                    {/* CONTENT */}
                    <div className="flex flex-col flex-1 min-w-0 p-6">

                      {/* Name + Score */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          {/* Stars */}
                          <div className="flex items-center gap-0.5 mb-1.5">
                            {Array.from({ length: hotel.estrelas || 3 }).map((_, i) => (
                              <Star key={i} size={11} fill="#F9C400" className="text-[#F9C400]" />
                            ))}
                          </div>
                          <h3 className={`${jakarta.className} text-lg font-black text-slate-900 leading-snug group-hover:text-[#00577C] transition-colors`}>
                            <Link href={`/hoteis/${hotel.id}`}>{hotel.nome}</Link>
                          </h3>
                        </div>

                        {/* Score */}
                        <div className="shrink-0 text-right">
                          <span className="text-[10px] font-bold text-slate-400 block mb-1">Avaliação</span>
                          <div className="bg-[#00577C] text-white w-11 h-9 rounded-xl flex items-center justify-center">
                            <span className="text-sm font-black">9.2</span>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-3">
                        <MapPin size={11} className="text-[#009640] shrink-0" />
                        São Geraldo do Araguaia, PA
                        <button className="text-[#00577C] hover:underline ml-1">· Ver no mapa</button>
                      </div>

                      {/* Description */}
                      <p className="text-slate-500 text-[13px] leading-relaxed line-clamp-2 mb-4">
                        {hotel.descricao}
                      </p>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-2 mb-5">
                        {[
                          { icon: <Wifi size={11} />, label: 'Wi-Fi' },
                          { icon: <Coffee size={11} />, label: 'Café-da-manhã' },
                          { icon: <Car size={11} />, label: 'Estacionamento' },
                        ].map(({ icon, label }) => (
                          <span key={label} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg">
                            <span className="text-[#00577C]">{icon}</span>
                            {label}
                          </span>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#009640] bg-green-50 border border-green-100 px-2.5 py-1 rounded-md mb-1.5">
                            <CheckCircle2 size={10} />
                            Cancelamento gratuito
                          </span>
                          <p className="text-[11px] text-slate-400 font-medium">
                            1 diária · {adultos} adulto{adultos > 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">A partir de</p>
                            <p className={`${jakarta.className} text-3xl font-black text-[#009640] tabular-nums leading-none`}>
                              {formatarMoeda(parseValor(hotel.quarto_standard_preco || hotel.preco_medio))}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">/ noite</p>
                          </div>

                          <Link
                            href={`/hoteis/${hotel.id}`}
                            className="bg-[#00577C] text-white px-5 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#004a6b] active:scale-[0.97] transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
                          >
                            Ver disponibilidade
                            <ChevronRight size={15} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-14 px-6 border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-3">
            <Image src="/logop.png" alt="SGA" width={140} height={44} className="object-contain" />
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">
              © 2026 Secretaria Municipal de Turismo — SGA
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-left border-l-2 border-slate-100 pl-6">
              <p className="text-[10px] font-black text-[#00577C] uppercase tracking-wider mb-1">Contato Oficial</p>
              <p className="text-xs font-semibold text-slate-500">setursaga@gmail.com</p>
            </div>
            <ShieldCheck size={30} className="text-[#009640] opacity-20" />
          </div>
        </div>
      </footer>
    </main>
  );
}