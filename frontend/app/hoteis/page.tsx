'use client';

import { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2, Menu, MapPin, ArrowRight,
  Search, Calendar as CalendarIcon, Star,
  CheckCircle2, ChevronRight, ShieldCheck,
  Filter, Bed, Users, Coffee, Wifi, Car,
  ChevronLeft, X, SlidersHorizontal, AlertTriangle, Layers,
  Building2, Waves, ParkingSquare, Sparkles
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

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

const FALLBACK_IMAGE = "/logop.png";

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

const comodidadeIcone: Record<string, React.ReactNode> = {
  'Piscina': <Waves size={13} />,
  'Wi-Fi Grátis': <Wifi size={13} />,
  'Estacionamento': <ParkingSquare size={13} />,
  'Café-da-Manhã': <Coffee size={13} />,
};

function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 flex flex-col md:flex-row overflow-hidden animate-pulse shadow-sm">
      <div className="w-full h-52 md:h-auto md:w-64 lg:w-72 bg-slate-100 shrink-0" />
      <div className="p-6 flex flex-col flex-1 gap-3">
        <div className="h-3 bg-slate-100 rounded w-20" />
        <div className="h-7 bg-slate-100 rounded w-2/3" />
        <div className="h-3 bg-slate-100 rounded w-32" />
        <div className="h-3 bg-slate-100 rounded w-full mt-2" />
        <div className="h-3 bg-slate-100 rounded w-4/5" />
        <div className="flex gap-2 mt-3">
          {[1,2,3].map(i => <div key={i} className="h-7 bg-slate-50 rounded-full w-24" />)}
        </div>
        <div className="mt-auto pt-5 border-t border-slate-50 flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded w-28" />
            <div className="h-3 bg-slate-100 rounded w-36" />
          </div>
          <div className="h-11 bg-slate-100 rounded-xl w-40" />
        </div>
      </div>
    </div>
  );
}

function HoteisPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hoteis, setHoteis] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [adultos, setAdultos] = useState(2);
  const [criancas, setCriancas] = useState(0);
  const [quartos, setQuartos] = useState(1);
  const [showHospedesPopup, setShowHospedesPopup] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [mesAtualCalendario, setMesAtualCalendario] = useState(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const [precosDinamicos, setPrecosDinamicos] = useState<Record<string, { valor_total: number; noites: number; disponivel: boolean; motivo?: string }>>({});
  const [carregandoPrecos, setCarregandoPrecos] = useState(false);

  const [estrelasSelecionadas, setEstrelasSelecionadas] = useState<number[]>([]);
  const [comodidadesSelecionadas, setComodidadesSelecionadas] = useState<string[]>([]);

  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchHoteis() {
      const { data, error } = await supabase
        .from('hoteis')
        .select('*, tipos_quarto(id, nome_quarto, preco_quarto, imagem_url, capacidade)')
        .order('nome');
      if (data) setHoteis(data as Hotel[]);
      setLoading(false);
    }
    fetchHoteis();
  }, []);

  useEffect(() => {
    const ci = searchParams.get('checkin');
    const co = searchParams.get('checkout');
    const ad = searchParams.get('adultos');
    const cr = searchParams.get('criancas');
    const qu = searchParams.get('quartos');

    if (ci && ci !== 'null') {
      const dIn = new Date(ci + 'T00:00:00');
      setCheckin(dIn);
      setMesAtualCalendario(dIn);
    }
    if (co && co !== 'null') setCheckout(new Date(co + 'T00:00:00'));
    if (ad) setAdultos(Number(ad));
    if (cr) setCriancas(Number(cr));
    if (qu) setQuartos(Number(qu));
  }, [searchParams]);

  useEffect(() => {
    if (hoteis.length === 0) return;
    const ci = searchParams.get('checkin');
    const co = searchParams.get('checkout');
    const ad = searchParams.get('adultos') || '2';
    const qu = searchParams.get('quartos') || '1';
    if (!ci || !co) { setPrecosDinamicos({}); return; }

    async function carregarPrecosReaisLote() {
      setCarregandoPrecos(true);
      const novosPrecos: Record<string, any> = {};
      try {
        const capacidadeNecessariaPorQuarto = Math.ceil(Number(ad) / Number(qu));
        await Promise.all(hoteis.map(async (hotel) => {
          try {
            const quartosValidos = hotel.tipos_quarto && hotel.tipos_quarto.length > 0
              ? hotel.tipos_quarto.filter(q => q.capacidade >= capacidadeNecessariaPorQuarto)
              : [];
            if (quartosValidos.length === 0) {
              novosPrecos[hotel.id] = { valor_total: 0, noites: 0, disponivel: false, motivo: 'capacidade' };
              return;
            }
            const quartoMaisBaratoValido = quartosValidos.reduce((prev, curr) => curr.preco_quarto < prev.preco_quarto ? curr : prev);
            const res = await fetch(`https://sagaturismo-production.up.railway.app/api/v1/public/hoteis/${hotel.id}/calcular-preco?tipo_quarto=${encodeURIComponent(quartoMaisBaratoValido.nome_quarto)}&checkin=${ci}&checkout=${co}&quantidade=${qu}&adultos=${ad}&t=${Date.now()}`);
            const data = await res.json();
            if (data.sucesso) novosPrecos[hotel.id] = { valor_total: data.valor_total, noites: data.noites, disponivel: data.disponivel };
          } catch (err) { console.error(err); }
        }));
      } catch (e) { console.error(e); } finally {
        setPrecosDinamicos(novosPrecos);
        setCarregandoPrecos(false);
      }
    }
    carregarPrecosReaisLote();
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
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowCalendarPopup(false);
        setShowHospedesPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const diasDoMes = (ano: number, mes: number) => new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaDoMes = (ano: number, mes: number) => new Date(ano, mes, 1).getDay();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const formatarDataIso = (data: Date) =>
    `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

  const handleBuscar = () => {
    setIsSearching(true);
    const checkinStr = checkin ? formatarDataIso(checkin) : '';
    const checkoutStr = checkout ? formatarDataIso(checkout) : '';
    router.push(`/hoteis?checkin=${checkinStr}&checkout=${checkoutStr}&adultos=${adultos}&criancas=${criancas}&quartos=${quartos}`);
    setShowCalendarPopup(false);
    setShowHospedesPopup(false);
    setTimeout(() => setIsSearching(false), 800);
  };

  const handleDateClick = (data: Date) => {
    if (!checkin || (checkin && checkout)) { setCheckin(data); setCheckout(null); }
    else if (data > checkin) { setCheckout(data); setTimeout(() => setShowCalendarPopup(false), 300); }
    else { setCheckin(data); }
  };

  const formatarDataInput = (data: Date | null) => {
    if (!data) return '';
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const toggleEstrela = (star: number) =>
    setEstrelasSelecionadas(prev => prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]);

  const toggleComodidade = (item: string) =>
    setComodidadesSelecionadas(prev => prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]);

  const limparFiltros = () => {
    setEstrelasSelecionadas([]);
    setComodidadesSelecionadas([]);
    setIsMobileFiltersOpen(false);
  };

  const hoteisFiltrados = useMemo(() => {
    return hoteis.filter(hotel => {
      if (estrelasSelecionadas.length > 0 && !estrelasSelecionadas.includes(hotel.estrelas)) return false;
      if (comodidadesSelecionadas.length > 0) {
        const comodidadesHotel = getArraySeguro(hotel.comodidades);
        if (!comodidadesSelecionadas.every(c => comodidadesHotel.includes(c))) return false;
      }
      return true;
    });
  }, [hoteis, estrelasSelecionadas, comodidadesSelecionadas]);

  const noites = (checkin && checkout && checkout > checkin)
    ? Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 3600 * 24)) : 1;
  const totalQuartos = quartos || 1;
  const isSearchLoading = isSearching || carregandoPrecos;

  const renderMonth = () => {
    const ano = mesAtualCalendario.getFullYear();
    const mes = mesAtualCalendario.getMonth();
    const totalDias = diasDoMes(ano, mes);
    const primeiroDia = primeiroDiaDoMes(ano, mes);
    const isMesAtualOuPassado = ano < hoje.getFullYear() || (ano === hoje.getFullYear() && mes <= hoje.getMonth());

    return (
      <div
        className="absolute top-[calc(100%+10px)] left-0 md:left-1/2 md:-translate-x-1/2 w-[calc(100vw-2rem)] md:w-76 bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 z-[100] animate-in fade-in slide-in-from-top-1 cursor-default"
        style={{ boxShadow: '0 20px 60px -10px rgba(0,87,124,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            disabled={isMesAtualOuPassado}
            onClick={(e) => { e.stopPropagation(); setMesAtualCalendario(new Date(ano, mes - 1)); }}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isMesAtualOuPassado ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-[#00577C]/8 text-[#00577C]'}`}
          >
            <ChevronLeft size={16} />
          </button>
          <p className={`${jakarta.className} font-bold text-slate-800 capitalize text-sm`}>
            {mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); setMesAtualCalendario(new Date(ano, mes + 1)); }}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#00577C]/8 rounded-lg text-[#00577C] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
            <span key={i} className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pb-1">{d.slice(0,1)}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: totalDias }).map((_, i) => {
            const dataAtual = new Date(ano, mes, i + 1);
            const isPassado = dataAtual < hoje;
            const isCheckin = checkin && dataAtual.getTime() === checkin.getTime();
            const isCheckout = checkout && dataAtual.getTime() === checkout.getTime();
            const isInBetween = checkin && checkout && dataAtual > checkin && dataAtual < checkout;
            const isHovered = hoverDate && checkin && !checkout && dataAtual > checkin && dataAtual <= hoverDate;

            let classes = "w-full aspect-square flex items-center justify-center text-xs transition-all rounded-lg";
            if (isPassado) classes += " text-slate-300 cursor-not-allowed";
            else if (isCheckin || isCheckout) classes += " bg-[#00577C] text-white font-bold";
            else if (isInBetween || isHovered) classes += " bg-[#00577C]/10 text-[#00577C] rounded-none font-semibold";
            else classes += " hover:bg-slate-100 text-slate-700 font-medium cursor-pointer";

            return (
              <button key={i} disabled={isPassado}
                onClick={(e) => { e.stopPropagation(); handleDateClick(dataAtual); }}
                onMouseEnter={() => !isPassado && setHoverDate(dataAtual)}
                onMouseLeave={() => setHoverDate(null)}
                className={classes}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFiltros = () => (
    <div className="flex flex-col gap-0">
      <div className="mb-7">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-4 flex items-center gap-2">
          <Star size={11} className="text-[#F9C400]" /> Categoria
        </p>
        <div className="space-y-2.5">
          {[5, 4, 3, 2, 1].map(star => (
            <label key={star} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  estrelasSelecionadas.includes(star)
                    ? 'bg-[#00577C] border-[#00577C]'
                    : 'border-slate-300 group-hover:border-[#00577C]'
                }`}
                onClick={() => toggleEstrela(star)}
              >
                {estrelasSelecionadas.includes(star) && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: star }).map((_, i) => (
                  <Star key={i} size={12} fill="#F9C400" className="text-[#F9C400]" />
                ))}
              </div>
              <span className="text-xs text-slate-500 group-hover:text-slate-800 transition-colors">{star} estrela{star > 1 ? 's' : ''}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-4 flex items-center gap-2">
          <Sparkles size={11} className="text-[#009640]" /> Comodidades
        </p>
        <div className="space-y-2.5">
          {['Piscina', 'Wi-Fi Grátis', 'Estacionamento', 'Café-da-Manhã'].map(item => (
            <label key={item} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  comodidadesSelecionadas.includes(item)
                    ? 'bg-[#009640] border-[#009640]'
                    : 'border-slate-300 group-hover:border-[#009640]'
                }`}
                onClick={() => toggleComodidade(item)}
              >
                {comodidadesSelecionadas.includes(item) && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const checkinIsoStr = checkin ? formatarDataIso(checkin) : '';
  const checkoutIsoStr = checkout ? formatarDataIso(checkout) : '';
  const filtrosAtivos = estrelasSelecionadas.length + comodidadesSelecionadas.length;

  return (
    <div className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-32 w-full`}>

      {/* HEADER — mantido como original */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-28 md:h-12 md:w-36 lg:h-16 lg:w-56 shrink-0">
              <Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block text-left">
              <p className={`${jakarta.className} text-2xl font-bold text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex text-left font-bold">
            <Link href="/roteiro" className="text-sm text-slate-600 hover:text-[#00577C] transition-colors">Rota Turística</Link>
            <Link href="/pacotes" className="text-sm text-slate-600 hover:text-[#00577C] transition-colors">Pacotes</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg hover:bg-[#ffd633] transition-all">Cartão Residente</Link>
          </nav>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl border border-slate-200 p-2 md:hidden bg-slate-50 text-[#00577C]">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-[73px] md:pt-[85px] overflow-hidden">
        <div className="relative bg-[#00577C] overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px'}} />
          <div className="absolute top-0 right-0 w-[600px] h-[500px] rounded-full opacity-[0.06]" style={{background: 'radial-gradient(circle, #F9C400 0%, transparent 70%)'}} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.06]" style={{background: 'radial-gradient(circle, #009640 0%, transparent 70%)'}} />

          <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-6 pt-10 md:pt-14 pb-20 md:pb-28">
            {/* Breadcrumb badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <MapPin size={12} className="text-[#F9C400]" />
              <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">São Geraldo do Araguaia — Pará</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-12">
              <div>
                <h1 className={`${jakarta.className} text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.05] tracking-tight`}>
                  Onde você<br />
                  <span className="text-[#F9C400]">vai ficar?</span>
                </h1>
                <p className="text-white/60 text-sm md:text-base mt-3 font-medium max-w-sm">
                  Alojamentos oficiais com reserva segura e verificada pela Secretaria de Turismo.
                </p>
              </div>
              {/* Stats strip */}
              <div className="flex items-center gap-6 md:gap-8">
                {[
                  { n: hoteis.length || '—', label: 'Alojamentos' },
                  { n: '100%', label: 'Verificados' },
                  { n: '24h', label: 'Suporte' },
                ].map(({ n, label }) => (
                  <div key={label} className="text-center">
                    <p className={`${jakarta.className} text-2xl md:text-3xl font-black text-white leading-none`}>{n}</p>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* BARRA DE PESQUISA */}
            <div
              ref={searchBarRef}
              className="bg-white rounded-2xl shadow-2xl overflow-visible relative"
              style={{ boxShadow: '0 24px 80px -12px rgba(0,0,0,0.35)' }}
            >
              <div className="flex flex-col md:flex-row items-stretch">
                {/* Destino */}
                <div className="flex items-center gap-3 px-5 py-4 md:py-0 md:flex-1 border-b md:border-b-0 md:border-r border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-[#00577C]/8 flex items-center justify-center shrink-0">
                    <MapPin size={17} className="text-[#00577C]" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Destino</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">São Geraldo do Araguaia</p>
                  </div>
                </div>

                {/* Datas */}
                <div
                  className="flex items-center gap-3 px-5 py-4 md:py-0 md:flex-1 border-b md:border-b-0 md:border-r border-slate-100 cursor-pointer hover:bg-slate-50/80 transition-colors relative"
                  onClick={() => { setShowCalendarPopup(!showCalendarPopup); setShowHospedesPopup(false); }}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#00577C]/8 flex items-center justify-center shrink-0">
                    <CalendarIcon size={17} className="text-[#00577C]" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Check-in — Check-out</p>
                    <p className={`font-bold text-sm mt-0.5 ${checkin ? 'text-slate-800' : 'text-slate-400'}`}>
                      {checkin ? `${formatarDataInput(checkin)}${checkout ? ` → ${formatarDataInput(checkout)}` : ''}` : 'Selecione as datas'}
                    </p>
                  </div>
                  {showCalendarPopup && renderMonth()}
                </div>

                {/* Hóspedes */}
                <div
                  className="flex items-center gap-3 px-5 py-4 md:py-0 md:flex-1 border-b md:border-b-0 md:border-r border-slate-100 cursor-pointer hover:bg-slate-50/80 transition-colors relative"
                  onClick={() => { setShowHospedesPopup(!showHospedesPopup); setShowCalendarPopup(false); }}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#00577C]/8 flex items-center justify-center shrink-0">
                    <Users size={17} className="text-[#00577C]" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Hóspedes · Quartos</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5 truncate">{adultos} Adultos · {criancas} Criança{criancas !== 1 ? 's' : ''} · {quartos} Quarto{quartos !== 1 ? 's' : ''}</p>
                  </div>
                  {showHospedesPopup && (
                    <div
                      className="absolute top-[calc(100%+10px)] right-0 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 z-[100] cursor-default animate-in fade-in slide-in-from-top-1"
                      style={{ boxShadow: '0 20px 60px -10px rgba(0,87,124,0.18)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      {[
                        { label: 'Adultos', sub: 'Maiores de 18 anos', val: adultos, set: setAdultos, min: 1 },
                        { label: 'Crianças', sub: 'Até 17 anos', val: criancas, set: setCriancas, min: 0 },
                        { label: 'Quartos', sub: null, val: quartos, set: setQuartos, min: 1 },
                      ].map(({ label, sub, val, set, min }, idx, arr) => (
                        <div key={label} className={`flex items-center justify-between py-4 ${idx < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                          <div>
                            <p className="font-bold text-sm text-slate-800">{label}</p>
                            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => set((v: number) => Math.max(min, v - 1))}
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-[#00577C] font-black hover:bg-[#00577C] hover:text-white hover:border-[#00577C] transition-all text-base leading-none"
                            >−</button>
                            <span className="font-black text-sm text-slate-800 w-5 text-center">{val}</span>
                            <button
                              onClick={() => set((v: number) => v + 1)}
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-[#00577C] font-black hover:bg-[#00577C] hover:text-white hover:border-[#00577C] transition-all text-base leading-none"
                            >+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botão */}
                <div className="p-3 md:p-2 flex shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBuscar(); }}
                    disabled={isSearchLoading}
                    className="w-full md:w-auto bg-[#00577C] hover:bg-[#004a6b] text-white px-8 py-3.5 md:py-0 rounded-xl md:rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 active:scale-[0.98] min-h-[50px]"
                  >
                    {isSearchLoading ? (
                      <><Loader2 size={16} className="animate-spin" /> Buscando</>
                    ) : (
                      <><Search size={16} /> Pesquisar</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative bottom wave */}
        <div className="h-8 md:h-12 bg-[#00577C] relative">
          <svg viewBox="0 0 1440 48" className="absolute bottom-0 left-0 w-full" preserveAspectRatio="none" fill="#F8FAFC">
            <path d="M0,48 L0,20 C360,48 720,0 1080,28 C1260,40 1380,32 1440,28 L1440,48 Z"/>
          </svg>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pt-6 md:pt-10 relative">

        {/* Mobile: título + filtros */}
        <div className="flex lg:hidden items-center justify-between mb-5">
          <div>
            <h2 className={`${jakarta.className} text-xl font-black text-slate-800`}>Alojamentos</h2>
            {!loading && <p className="text-xs text-slate-400 font-medium mt-0.5">{hoteisFiltrados.length} opção{hoteisFiltrados.length !== 1 ? 'ões' : ''}</p>}
          </div>
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:border-[#00577C] hover:text-[#00577C] transition-all"
          >
            <SlidersHorizontal size={15} />
            Filtros
            {filtrosAtivos > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#00577C] text-white text-[10px] font-black flex items-center justify-center">{filtrosAtivos}</span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* SIDEBAR FILTROS DESKTOP */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-28">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`${jakarta.className} text-base font-black text-slate-900 flex items-center gap-2`}>
                  <div className="w-7 h-7 rounded-lg bg-[#00577C]/8 flex items-center justify-center">
                    <SlidersHorizontal size={14} className="text-[#00577C]" />
                  </div>
                  Filtros
                </h3>
                {filtrosAtivos > 0 && (
                  <button onClick={limparFiltros} className="text-[10px] font-bold text-[#00577C] hover:text-[#004a6b] border border-[#00577C]/20 px-2.5 py-1 rounded-lg hover:bg-[#00577C]/5 transition-all">
                    Limpar ({filtrosAtivos})
                  </button>
                )}
              </div>
              {renderFiltros()}
            </div>

            {/* Selo institucional */}
            <div className="mt-4 bg-gradient-to-br from-[#009640]/8 to-[#009640]/4 rounded-2xl border border-[#009640]/15 p-5 text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#009640]/15 flex items-center justify-center">
                  <ShieldCheck size={18} className="text-[#009640]" />
                </div>
                <p className={`${jakarta.className} text-sm font-black text-[#009640]`}>Reserva Oficial</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Todos os alojamentos são verificados e credenciados pela Secretaria Municipal de Turismo de São Geraldo.
              </p>
            </div>
          </aside>

          {/* LISTA */}
          <div className="flex-1 w-full min-w-0">
            {/* Desktop header da lista */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h2 className={`${jakarta.className} text-2xl font-black text-slate-800`}>Alojamentos Disponíveis</h2>
                {!loading && (
                  <p className="text-sm text-slate-400 font-medium mt-1">
                    {filtrosAtivos > 0 ? `${hoteisFiltrados.length} de ${hoteis.length} alojamentos` : `${hoteis.length} alojamentos encontrados`}
                  </p>
                )}
              </div>
            </div>

            {loading || isSearchLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <HotelCardSkeleton key={i} />)}
              </div>
            ) : hoteisFiltrados.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-slate-400" />
                </div>
                <p className="text-base font-bold text-slate-600 mb-1">Nenhum alojamento encontrado</p>
                <p className="text-sm text-slate-400 font-medium">Tente ajustar os filtros de pesquisa.</p>
                {filtrosAtivos > 0 && (
                  <button onClick={limparFiltros} className="mt-4 text-sm font-bold text-[#00577C] underline">
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                {hoteisFiltrados.map((hotel) => {
                  const capExigida = Math.ceil(adultos / totalQuartos);
                  const quartosValidosParaGrupo = hotel.tipos_quarto && hotel.tipos_quarto.length > 0
                    ? hotel.tipos_quarto.filter(q => q.capacidade >= capExigida) : [];
                  const semVagasParaGrupo = quartosValidosParaGrupo.length === 0;
                  const quartoPartida = !semVagasParaGrupo
                    ? quartosValidosParaGrupo.reduce((prev, curr) => curr.preco_quarto < prev.preco_quarto ? curr : prev)
                    : null;
                  const precoBase = quartoPartida ? quartoPartida.preco_quarto : parseValor(hotel.quarto_standard_preco || hotel.preco_medio);
                  const imagemAExibir = hotel.imagem_url || quartoPartida?.imagem_url || FALLBACK_IMAGE;
                  const dadosDinamicos = precosDinamicos[hotel.id];
                  const esgotadoPelaApi = dadosDinamicos && !dadosDinamicos.disponivel;
                  const eInvalidoOuEsgotado = semVagasParaGrupo || esgotadoPelaApi || (dadosDinamicos?.motivo === 'capacidade');
                  const precoTotal = dadosDinamicos ? dadosDinamicos.valor_total : precoBase * noites * totalQuartos;
                  const precoDiariaExibida = dadosDinamicos ? (dadosDinamicos.valor_total / (dadosDinamicos.noites * totalQuartos)) : precoBase;
                  const noitesExibidas = dadosDinamicos ? dadosDinamicos.noites : noites;
                  const comodidadesHotel = getArraySeguro(hotel.comodidades);
                  const hotelLink = `/hoteis/${hotel.id}?checkin=${checkinIsoStr}&checkout=${checkoutIsoStr}&adultos=${adultos}&criancas=${criancas}&quartos=${quartos}`;

                  return (
                    <article
                      key={hotel.id}
                      className={`bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-200 flex flex-col md:flex-row overflow-hidden group text-left ${eInvalidoOuEsgotado ? 'opacity-60' : ''}`}
                    >
                      {/* Imagem */}
                      <div className="relative w-full h-52 md:h-auto md:w-56 lg:w-64 shrink-0 overflow-hidden bg-slate-100">
                        <Image
                          src={imagemAExibir}
                          alt={hotel.nome}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        {/* Tipo badge */}
                        <div className="absolute top-3 left-3">
                          <span className="bg-[#F9C400] text-[#00577C] px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                            {hotel.tipo}
                          </span>
                        </div>
                        {/* Verificado badge */}
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-white/90 backdrop-blur-sm text-[#009640] px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 shadow-sm">
                            <ShieldCheck size={10} /> Verificado
                          </span>
                        </div>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex flex-col flex-1 p-5 md:p-6 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="flex-1 min-w-0">
                            {/* Estrelas */}
                            <div className="flex items-center gap-0.5 mb-2">
                              {Array.from({ length: hotel.estrelas || 3 }).map((_, i) => (
                                <Star key={i} size={11} fill="#F9C400" className="text-[#F9C400]" />
                              ))}
                            </div>
                            {/* Nome */}
                            <Link href={hotelLink}>
                              <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 leading-tight hover:text-[#00577C] transition-colors truncate`}>
                                {hotel.nome}
                              </h3>
                            </Link>
                            {/* Localização */}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <MapPin size={12} className="text-[#009640] shrink-0" />
                              <span className="text-xs font-semibold text-slate-500">São Geraldo do Araguaia, PA</span>
                            </div>
                          </div>
                        </div>

                        {/* Descrição */}
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mt-3 font-medium">
                          {hotel.descricao}
                        </p>

                        {/* Comodidades */}
                        {comodidadesHotel.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 mt-4">
                            {comodidadesHotel.slice(0, 4).map((c, i) => (
                              <span key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                                <span className="text-[#00577C]">{comodidadeIcone[c] || <CheckCircle2 size={10} />}</span>
                                {c}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer do card */}
                        <div className="mt-auto pt-4 border-t border-slate-50 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-5">
                          <div>
                            {eInvalidoOuEsgotado ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">
                                <AlertTriangle size={12} /> Indisponível para este grupo
                              </span>
                            ) : (
                              <>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                                  {noitesExibidas} noite{noitesExibidas !== 1 ? 's' : ''} · {adultos} adulto{adultos !== 1 ? 's' : ''}
                                </p>
                                <p className="text-xs font-medium text-slate-500">
                                  Total estimado: <span className="font-black text-slate-700">{formatarMoeda(precoTotal)}</span>
                                </p>
                              </>
                            )}
                          </div>

                          <div className="flex items-end gap-4 shrink-0">
                            {!eInvalidoOuEsgotado && (
                              <div className="text-right">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">a partir de</p>
                                <p className={`${jakarta.className} text-3xl font-black text-[#00577C] leading-none mt-0.5`}>
                                  {formatarMoeda(precoDiariaExibida)}
                                </p>
                                <p className="text-[9px] text-slate-400 font-medium mt-0.5">/noite por quarto</p>
                              </div>
                            )}
                            <Link
                              href={hotelLink}
                              onClick={(e) => eInvalidoOuEsgotado && e.preventDefault()}
                              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shrink-0 ${
                                eInvalidoOuEsgotado
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-[#00577C] hover:bg-[#004a6b] text-white shadow-md shadow-[#00577C]/20 hover:shadow-lg hover:shadow-[#00577C]/25 active:scale-[0.98]'
                              }`}
                            >
                              {eInvalidoOuEsgotado ? 'Indisponível' : 'Ver hotel'}
                              {!eInvalidoOuEsgotado && <ChevronRight size={14} />}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FILTROS MOBILE */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-10 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className={`${jakarta.className} text-xl font-black text-slate-900 flex items-center gap-2`}>
                <SlidersHorizontal size={20} className="text-[#00577C]" /> Filtros
              </h3>
              <button onClick={() => setIsMobileFiltersOpen(false)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {renderFiltros()}
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all"
              >
                Aplicar Filtros · {hoteisFiltrados.length} resultado{hoteisFiltrados.length !== 1 ? 's' : ''}
              </button>
              {filtrosAtivos > 0 && (
                <button onClick={limparFiltros} className="w-full py-3 text-slate-400 font-bold text-sm">
                  Limpar todos os filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-16 md:mt-24 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-3">
              <Image src="/logop.png" alt="SGA" width={130} height={45} className="object-contain" />
              <p className={`${jakarta.className} text-lg font-bold text-[#00577C]`}>SagaTurismo</p>
              <p className="text-xs text-slate-400 font-medium">© 2026 Secretaria Municipal de Turismo</p>
            </div>
            <div className="flex items-center gap-4 md:gap-8">
              <div className="text-left border-l-2 border-[#009640]/20 pl-4">
                <p className="text-[9px] font-black text-[#009640] uppercase tracking-wider mb-1">Contato Oficial</p>
                <p className="text-sm font-bold text-slate-600">setursaga@gmail.com</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#009640]/8 flex items-center justify-center">
                <ShieldCheck size={22} className="text-[#009640]" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HoteisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold uppercase tracking-widest text-xs text-slate-400">Preparando listagem oficial de alojamentos...</p>
      </div>
    }>
      <HoteisPageContent />
    </Suspense>
  );
}