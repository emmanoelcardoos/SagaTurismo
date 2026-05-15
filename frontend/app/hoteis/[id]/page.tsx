'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, MapPin, Star, CheckCircle2, Info, 
  Loader2, Menu, X, ChevronLeft, ChevronRight, ZoomIn, 
  Calendar as CalendarIcon, Bed, ChevronRight as ChevronRightIcon,
  Users, Baby, DoorOpen, Award, Phone, Mail, Globe,
  Wind, Wifi, Bath, Maximize, Zap, CreditCard, Image as ImageIcon, Coffee
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── UTILITÁRIOS ──
const parseValor = (valor: any): number => {
  if (!valor) return 0;
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  return isNaN(num) ? 0 : num;
};

const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

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

type Hotel = {
  id: string; nome: string; tipo: string; descricao: string; estrelas: number; imagem_url: string;
  endereco?: string; preco_medio?: string;
  quarto_standard_nome?: string; quarto_standard_preco?: any;
  quarto_luxo_nome?: string; quarto_luxo_preco?: any;
  comodidades?: string[]; galeria?: string[];
  quarto_standard_comodidades?: any;
  quarto_luxo_comodidades?: any;
  quarto_standard_imagens?: string[];
  quarto_luxo_imagens?: string[];
  politicas?: {
    checkin_checkout?: string;
    criancas?: string;
    camas_extras?: string;
    cafe_manha?: string;
    idade_minima?: string;
  };
  contatos?: {
    telefone?: string;
    email?: string;
    website?: string;
  };
  avaliacoes_info?: {
    nota?: number;
    texto?: string;
    total?: number;
    limpeza?: number;
    comodidades?: number;
    localizacao?: number;
    atendimento?: number;
  };
};

type Disponibilidade = {
  data: string;
  quarto_standard_preco: any;
  quarto_standard_disponivel: boolean;
  quarto_luxo_preco: any;
  quarto_luxo_disponivel: boolean;
};

export default function HotelDetalhePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [disponibilidadeDb, setDisponibilidadeDb] = useState<Record<string, Disponibilidade>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [mesAtualCalendario, setMesAtualCalendario] = useState<Date | null>(null);
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const [adultos, setAdultos] = useState(2);
  const [criancas, setCriancas] = useState(0);
  const [quartos, setQuartos] = useState(1);

  const [imgIdxStandard, setImgIdxStandard] = useState(0);
  const [imgIdxLuxo, setImgIdxLuxo] = useState(0);

  useEffect(() => {
    setMesAtualCalendario(new Date());
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: hotelData, error: hotelError } = await supabase.from('hoteis').select('*').eq('id', params.id).single();
        if (hotelError) throw new Error("Erro ao buscar a hospedagem.");
        const { data: dispData } = await supabase.from('hotel_disponibilidade').select('*').eq('hotel_id', params.id);
        const dispMap: Record<string, Disponibilidade> = {};
        if (dispData) dispData.forEach((d: any) => { dispMap[d.data] = d; });
        if (hotelData) { setHotel(hotelData); setDisponibilidadeDb(dispMap); } 
        else setErro("Hospedagem não encontrada.");
      } catch (err: any) { setErro(err.message || "Ocorreu um erro inesperado."); } 
      finally { setLoading(false); }
    }
    if (params.id) fetchData();
  }, [params.id]);

  useEffect(() => {
    const handleScroll = () => {
      const cur = window.scrollY;
      if (cur < 80) setShowHeader(true);
      else if (cur > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(cur);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const diasDoMes = (ano: number, mes: number) => new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaDoMes = (ano: number, mes: number) => new Date(ano, mes, 1).getDay();

  const handleDateClick = (data: Date) => {
    if (!checkin || (checkin && checkout)) { setCheckin(data); setCheckout(null); } 
    else if (data > checkin) setCheckout(data);
    else setCheckin(data);
  };

  const getPrecoDiaria = (dataStr: string, tipo: 'standard' | 'luxo') => {
    const disp = disponibilidadeDb[dataStr];
    if (disp) return tipo === 'luxo' ? parseValor(disp.quarto_luxo_preco) : parseValor(disp.quarto_standard_preco);
    return hotel ? (tipo === 'luxo' ? parseValor(hotel.quarto_luxo_preco) : parseValor(hotel.quarto_standard_preco)) : 0;
  };

  const isDisponivel = (dataStr: string, tipo: 'standard' | 'luxo') => {
    const disp = disponibilidadeDb[dataStr];
    if (disp) return tipo === 'luxo' ? disp.quarto_luxo_disponivel : disp.quarto_standard_disponivel;
    return true; 
  };

  const formatarDataIso = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

  let totalStandard = 0; let totalLuxo = 0; let totalNoites = 0;
  if (checkin && checkout) {
    let diaAtual = new Date(checkin);
    while (diaAtual < checkout) {
      const ds = formatarDataIso(diaAtual);
      totalStandard += getPrecoDiaria(ds, 'standard') * quartos;
      totalLuxo += getPrecoDiaria(ds, 'luxo') * quartos;
      totalNoites++;
      diaAtual.setDate(diaAtual.getDate() + 1);
    }
  } else {
    totalNoites = 1;
    totalStandard = (hotel ? parseValor(hotel.quarto_standard_preco) : 0) * quartos;
    totalLuxo = (hotel ? parseValor(hotel.quarto_luxo_preco) : 0) * quartos;
  }

  const handleReserva = (tipo: 'standard' | 'luxo') => {
    if (!checkin || !checkout) {
      alert("Por favor, selecione as datas de Check-in e Check-out no calendário.");
      window.scrollTo({ top: 400, behavior: 'smooth' });
      return;
    }
    router.push(`/checkout-hotel?hotel=${hotel?.id}&quarto=${tipo}&checkin=${formatarDataIso(checkin)}&checkout=${formatarDataIso(checkout)}&adultos=${adultos}&criancas=${criancas}&quartos=${quartos}`);
  };

  const fecharGaleria = () => setFotoExpandidaIndex(null);
  const proximaFoto = (e: React.MouseEvent) => { e.stopPropagation(); if (hotel?.galeria) setFotoExpandidaIndex((prev) => (prev! + 1) % hotel.galeria!.length); };
  const fotoAnterior = (e: React.MouseEvent) => { e.stopPropagation(); if (hotel?.galeria) setFotoExpandidaIndex((prev) => (prev! - 1 + hotel.galeria!.length) % hotel.galeria!.length); };

  if (!mounted || loading || !mesAtualCalendario) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-xs">Carregando detalhes...</p>
    </div>
  );

  if (erro || !hotel) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center text-slate-900">
      <h1 className="text-3xl font-black mb-4">Alojamento Não Encontrado</h1>
      <Link href="/hoteis" className="bg-[#00577C] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm shadow-lg">Voltar</Link>
    </div>
  );

  const anoCorrente = mesAtualCalendario.getFullYear();
  const mesCorrente = mesAtualCalendario.getMonth();
  const diasMes = diasDoMes(anoCorrente, mesCorrente);
  const primeiroDia = primeiroDiaDoMes(anoCorrente, mesCorrente);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

  const imagensStandard = getArraySeguro(hotel.quarto_standard_imagens).length > 0 ? getArraySeguro(hotel.quarto_standard_imagens) : [hotel.imagem_url, "https://images.unsplash.com/photo-1618773928121-c32242fa11f5?q=80&w=1740"];
  const imagensLuxo = getArraySeguro(hotel.quarto_luxo_imagens).length > 0 ? getArraySeguro(hotel.quarto_luxo_imagens) : ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1740", hotel.imagem_url];

  return (
    <div className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 flex flex-col`}>
      
      {/* ── HEADER ── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-10 w-28 md:h-12 md:w-36 lg:h-16 lg:w-56 shrink-0">
              <Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex font-bold">
            <Link href="/hoteis" className="text-sm text-slate-600 hover:text-[#00577C]">Alojamentos</Link>
            <Link href="/roteiro" className="text-sm text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão Residente</Link>
          </nav>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl border border-slate-200 p-2 md:hidden bg-slate-50 text-[#00577C]">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {isMobileMenuOpen && (
          <div className="absolute top-[100%] left-0 w-full bg-white border-b border-slate-200 p-5 flex flex-col gap-4 shadow-xl md:hidden animate-in slide-in-from-top-4 text-left">
            <Link href="/roteiro" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Rota Turística</Link>
            <Link href="/hoteis" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Alojamentos</Link>
            <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#F9C400] text-[#00577C] font-black px-4 py-3.5 rounded-xl text-center mt-2 uppercase tracking-widest text-sm shadow-md">Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <div className="w-full h-[40vh] md:h-[50vh] relative bg-[#002f40] mt-[65px] md:mt-[80px]">
        <Link href="/hoteis" className="absolute top-4 left-4 z-20 flex items-center gap-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 px-3 py-2 rounded-full shadow-lg transition-colors">
          <ArrowLeft size={14} /> Voltar
        </Link>
        <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover opacity-70" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-5 md:left-16 z-20 text-left">
          <div className="flex items-center gap-2 mb-2">
             <span className="bg-[#F9C400] text-[#00577C] px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">{hotel.tipo}</span>
             <div className="flex gap-0.5">{Array.from({ length: hotel.estrelas }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#F9C400] text-[#F9C400]" />)}</div>
          </div>
          <h1 className={`${jakarta.className} text-3xl md:text-6xl font-black text-white leading-tight drop-shadow-lg`}>{hotel.nome}</h1>
          <p className="text-white/80 font-medium flex items-center gap-2 mt-2 text-xs md:text-sm"><MapPin size={14} className="text-[#009640]"/> {hotel.endereco || 'São Geraldo do Araguaia, Pará'}</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-5 py-8 md:py-12 flex flex-col lg:flex-row items-start gap-8 relative z-10">
        
        {/* ── COLUNA ESQUERDA ── */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-8">
          
          <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden text-left">
             <div className="bg-slate-50 p-5 md:p-6 border-b border-slate-200">
               <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900`}>Acomodações Disponíveis</h3>
               <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Selecione o seu quarto abaixo.</p>
             </div>
             <div className="p-4 md:p-6 flex flex-col gap-6 md:gap-8">
                
                {/* ── CARD: STANDARD ── */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col hover:border-[#00577C]/30 transition-colors">
                   <h4 className={`${jakarta.className} font-bold text-base md:text-lg p-4 bg-slate-50 border-b border-slate-200 text-[#00577C]`}>{hotel.quarto_standard_nome || 'Quarto Standard'}</h4>
                   <div className="flex flex-col xl:flex-row">
                      <div className="w-full xl:w-2/5 p-4 border-b xl:border-b-0 xl:border-r border-slate-100">
                         <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 group">
                            <Image src={imagensStandard[imgIdxStandard]} alt="Standard" fill className="object-cover" />
                            <button onClick={(e) => { e.stopPropagation(); setImgIdxStandard(p => (p - 1 + imagensStandard.length) % imagensStandard.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-70 md:opacity-0 group-hover:opacity-100"><ChevronLeft size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); setImgIdxStandard(p => (p + 1) % imagensStandard.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-70 md:opacity-0 group-hover:opacity-100"><ChevronRightIcon size={16}/></button>
                         </div>
                         <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs text-slate-600 font-medium">
                            <span className="flex items-center gap-1.5"><Wind size={12}/> Ar-condic.</span>
                            <span className="flex items-center gap-1.5"><Wifi size={12}/> Wi-Fi Grátis</span>
                            <span className="flex items-center gap-1.5"><Bath size={12}/> Banheiro Priv.</span>
                         </div>
                      </div>
                      <div className="w-full xl:w-3/5 flex flex-col sm:flex-row">
                         <div className="flex-1 p-4 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col justify-center">
                            <ul className="space-y-2">
                               <li className="flex items-start gap-2 text-xs md:text-sm text-[#009640] font-bold"><CheckCircle2 size={14} className="shrink-0 mt-0.5" /> Cancelamento grátis</li>
                               <li className="flex items-start gap-2 text-xs md:text-sm text-[#00577C] font-bold"><Zap size={14} className="shrink-0 mt-0.5" /> Confirmação Imediata</li>
                            </ul>
                         </div>
                         <div className="w-full sm:w-44 p-4 flex flex-col items-end justify-center bg-slate-50/50">
                            <p className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 leading-none mb-1`}>{formatarMoeda(totalStandard)}</p>
                            <p className="text-[9px] md:text-[10px] text-slate-500 font-bold mb-4">{totalNoites} noite(s) · {quartos} quarto(s)</p>
                            <button onClick={() => handleReserva('standard')} className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md transition-all active:scale-95">Reservar</button>
                         </div>
                      </div>
                   </div>
                </div>

                {/* ── CARD: LUXO ── */}
                <div className="border-2 border-[#00577C]/20 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col relative">
                   <div className="absolute top-0 right-0 bg-[#00577C] text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1.5"><Award size={12}/> Premium</div>
                   <h4 className={`${jakarta.className} font-bold text-base md:text-lg p-4 bg-blue-50/30 border-b border-slate-100 text-[#00577C]`}>{hotel.quarto_luxo_nome || 'Suíte Luxo'}</h4>
                   <div className="flex flex-col xl:flex-row">
                      <div className="w-full xl:w-2/5 p-4 border-b xl:border-b-0 xl:border-r border-slate-100">
                         <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 group">
                            <Image src={imagensLuxo[imgIdxLuxo]} alt="Luxo" fill className="object-cover" />
                            <button onClick={(e) => { e.stopPropagation(); setImgIdxLuxo(p => (p - 1 + imagensLuxo.length) % imagensLuxo.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-70 md:opacity-0 group-hover:opacity-100"><ChevronLeft size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); setImgIdxLuxo(p => (p + 1) % imagensLuxo.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-70 md:opacity-0 group-hover:opacity-100"><ChevronRightIcon size={16}/></button>
                         </div>
                         <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs text-slate-600 font-medium">
                            <span className="flex items-center gap-1.5"><Wind size={12}/> Ar-condic.</span>
                            <span className="flex items-center gap-1.5"><Wifi size={12}/> Wi-Fi Grátis</span>
                            <span className="flex items-center gap-1.5"><Bath size={12}/> Banheira/Spa</span>
                         </div>
                      </div>
                      <div className="w-full xl:w-3/5 flex flex-col sm:flex-row">
                         <div className="flex-1 p-4 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col justify-center">
                            <ul className="space-y-2">
                               <li className="flex items-start gap-2 text-xs md:text-sm text-[#009640] font-bold"><CheckCircle2 size={14} className="shrink-0 mt-0.5" /> Cancelamento grátis</li>
                               <li className="flex items-start gap-2 text-xs md:text-sm text-[#00577C] font-bold"><Coffee size={14} className="shrink-0 mt-0.5" /> Pequeno-almoço premium</li>
                            </ul>
                         </div>
                         <div className="w-full sm:w-44 p-4 flex flex-col items-end justify-center bg-slate-50/50">
                            <p className={`${jakarta.className} text-xl md:text-2xl font-black text-[#00577C] leading-none mb-1`}>{formatarMoeda(totalLuxo)}</p>
                            <p className="text-[9px] md:text-[10px] text-slate-500 font-bold mb-4">{totalNoites} noite(s) · {quartos} quarto(s)</p>
                            <button onClick={() => handleReserva('luxo')} className="w-full bg-[#F9C400] hover:bg-[#e5b500] text-[#00577C] py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md transition-all active:scale-95">Reservar</button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* 2. AVALIAÇÕES */}
          <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm p-5 md:p-10 text-left">
             <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-6 md:mb-8`}>Avaliações dos hóspedes</h3>
             <div className="flex flex-col lg:flex-row gap-8 md:gap-10">
                <div className="w-full lg:w-1/3">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="bg-[#00577C] text-white text-2xl md:text-3xl font-black rounded-xl w-14 h-12 md:w-16 md:h-14 flex items-center justify-center shadow-lg">{hotel.avaliacoes_info?.nota || 8.8}</div>
                      <div>
                         <p className={`${jakarta.className} text-base md:text-lg font-black text-[#00577C] leading-tight`}>{hotel.avaliacoes_info?.texto || 'Muito bom'}</p>
                         <p className="text-[10px] md:text-xs text-slate-500 font-bold">{hotel.avaliacoes_info?.total || 73} avaliações oficiais</p>
                      </div>
                   </div>
                   <div className="space-y-3">
                      {[{ l: 'Limpeza', s: 9.0 }, { l: 'Serviço', s: 8.5 }, { l: 'Localização', s: 9.6 }].map(it => (
                         <div key={it.l}><div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1"><span>{it.l}</span><span className="text-[#00577C]">{it.s.toFixed(1)}</span></div><div className="w-full bg-slate-200 rounded-full h-1"><div className="bg-[#00577C] h-1 rounded-full" style={{ width: `${(it.s / 10) * 100}%` }}></div></div></div>
                      ))}
                   </div>
                </div>
                <div className="w-full lg:w-2/3 space-y-5">
                   <div className="border-b border-slate-100 pb-4">
                      <p className="text-xs font-bold text-slate-800 leading-none">Maria Silva</p>
                      <p className="text-[10px] text-slate-400 mt-1 mb-2">Hospedou-se em Maio 2026</p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"Quartos muito limpos e atendimento excepcional da recepção."</p>
                   </div>
                </div>
             </div>
          </section>

          {/* 3. POLÍTICAS */}
          <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm p-5 md:p-10 text-left">
             <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-6 md:mb-8`}>Políticas</h3>
             <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-x-8 gap-y-5 text-xs md:text-sm">
                <div className="font-black text-slate-800">Check-in / Check-out</div>
                <div className="text-slate-600 font-medium">{hotel.politicas?.checkin_checkout || 'Check-in: 14:00 | Check-out: 12:00'}</div>
                <div className="md:col-span-2 h-px bg-slate-100"></div>
                <div className="font-black text-slate-800">Pequeno-almoço</div>
                <div className="text-slate-600 font-medium">{hotel.politicas?.cafe_manha || 'Servido diariamente das 07:00 às 09:30.'}</div>
             </div>
          </section>

          {/* 4. CONTACTO */}
          <section className="bg-[#002f40] rounded-[1.5rem] md:rounded-[2rem] border border-[#00577C] shadow-xl p-6 md:p-10 text-white relative overflow-hidden text-left">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Globe size={100}/></div>
             <h3 className={`${jakarta.className} text-xl md:text-2xl font-black mb-6 relative z-10`}>Contacto Oficial</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center gap-3">
                   <Phone className="text-[#F9C400] shrink-0" size={20}/>
                   <div className="overflow-hidden"><p className="text-[9px] font-black uppercase text-white/50">Telefone</p><p className="font-bold text-xs md:text-sm truncate">{hotel.contatos?.telefone || '+55 (94) 90000-0000'}</p></div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center gap-3">
                   <Mail className="text-[#F9C400] shrink-0" size={20}/>
                   <div className="overflow-hidden"><p className="text-[9px] font-black uppercase text-white/50">E-mail</p><p className="font-bold text-xs md:text-sm truncate">{hotel.contatos?.email || 'contato@hotel.com.br'}</p></div>
                </div>
             </div>
          </section>
        </div>

        {/* ── COLUNA DIREITA (MOTOR) ── */}
        <div className="w-full lg:w-[360px] xl:w-[380px] shrink-0 lg:self-start relative z-40">
          <aside className="lg:sticky lg:top-28 space-y-6">
            <div className="bg-white p-5 md:p-8 rounded-[2rem] shadow-xl border border-slate-200 text-left">
               <h3 className={`${jakarta.className} text-lg md:text-xl font-black text-slate-900 mb-6 flex items-center gap-2`}><CalendarIcon className="text-[#00577C]" size={20}/> Disponibilidade</h3>
               <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 shadow-inner">
                  <div className="flex items-center justify-between mb-4">
                     <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente - 1))} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><ChevronLeft size={18}/></button>
                     <p className="font-bold text-slate-800 capitalize text-sm">{mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                     <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente + 1))} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><ChevronRight size={18}/></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-1">{['D','S','T','Q','Q','S','S'].map((d, i) => <span key={i} className="text-[9px] font-black text-slate-400">{d}</span>)}</div>
                  <div className="grid grid-cols-7 gap-y-0.5">
                     {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e-${i}`} />)}
                     {Array.from({ length: diasMes }).map((_, i) => {
                        const dataAtual = new Date(anoCorrente, mesCorrente, i + 1);
                        const isPassado = dataAtual < hoje;
                        const isCheckin = checkin && dataAtual.getTime() === checkin.getTime();
                        const isCheckout = checkout && dataAtual.getTime() === checkout.getTime();
                        const isInBetween = checkin && checkout && dataAtual > checkin && dataAtual < checkout;
                        let bgClass = "bg-transparent hover:bg-slate-200 text-slate-800";
                        if (isPassado) bgClass = "text-slate-300 cursor-not-allowed";
                        else if (isCheckin || isCheckout) bgClass = "bg-[#00577C] text-white shadow-md rounded-md font-black scale-110 z-10";
                        else if (isInBetween) bgClass = "bg-[#00577C]/10 text-[#00577C] rounded-none";
                        return <button key={i} disabled={isPassado} onClick={() => handleDateClick(dataAtual)} className={`w-full aspect-square flex items-center justify-center text-[10px] md:text-xs transition-all ${bgClass}`}>{i + 1}</button>;
                     })}
                  </div>
               </div>
               <div className="space-y-4 mb-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase text-[#00577C]">Adultos</span><div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1"><button onClick={() => setAdultos(Math.max(1, adultos - 1))} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">-</button><span className="font-bold text-xs w-4 text-center">{adultos}</span><button onClick={() => setAdultos(adultos + 1)} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">+</button></div></div>
                  <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase text-[#00577C]">Quartos</span><div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1"><button onClick={() => setQuartos(Math.max(1, quartos - 1))} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">-</button><span className="font-bold text-xs w-4 text-center">{quartos}</span><button onClick={() => setQuartos(quartos + 1)} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">+</button></div></div>
               </div>
               <div className="bg-[#009640]/10 border border-[#009640]/20 rounded-2xl p-4 text-center"><p className="text-[10px] md:text-xs font-bold text-[#009640]">Os preços serão aplicados conforme as datas selecionadas.</p></div>
            </div>
          </aside>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white mt-auto text-left">
        <div className="mx-auto max-w-7xl flex flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative h-10 w-32 shrink-0"><Image src="/logop.png" alt="SGA" fill className="object-contain object-left" /></div>
            <div className="hidden border-l border-slate-200 pl-4 md:block">
              <p className={`${jakarta.className} text-xl font-bold text-[#00577C]`}>SagaTurismo</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Portal Oficial de Turismo</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">© {new Date().getFullYear()} · São Geraldo do Araguaia (PA)</p>
        </div>
      </footer>
    </div>
  );
}