'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, MapPin, Star, CheckCircle2, Info, 
  Loader2, Menu, X, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, Bed, ChevronRight as ChevronRightIcon,
  Users, Award, Phone, Mail, Globe,
  Wind, Wifi, Bath, CreditCard, Coffee, Edit3, Compass
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
    checkin_checkout?: string; criancas?: string; camas_extras?: string; cafe_manha?: string; idade_minima?: string;
  };
  contatos?: {
    telefone?: string; email?: string; website?: string;
  };
  avaliacoes_info?: {
    nota?: number; texto?: string; total?: number; limpeza?: number; comodidades?: number; localizacao?: number; atendimento?: number;
  };
};

export default function HotelDetalhePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ── ESTADOS DO MOTOR DE RESERVAS ──
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [mesAtualCalendario, setMesAtualCalendario] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  // Valores Finais Dinâmicos
  const [totalStandard, setTotalStandard] = useState(0);
  const [totalLuxo, setTotalLuxo] = useState(0);
  const [totalNoites, setTotalNoites] = useState(1);
  const [standardDisponivel, setStandardDisponivel] = useState(true);
  const [luxoDisponivel, setLuxoDisponivel] = useState(true);
  const [calculandoPreco, setCalculandoPreco] = useState(false);

  // Estados de Lotação
  const [adultos, setAdultos] = useState(2);
  const [criancas, setCriancas] = useState(0);
  const [quartos, setQuartos] = useState(1);

  // Carrosseis dos Quartos
  const [imgIdxStandard, setImgIdxStandard] = useState(0);
  const [imgIdxLuxo, setImgIdxLuxo] = useState(0);

  useEffect(() => {
    setMesAtualCalendario(new Date());
    setMounted(true);
  }, []);

  // Carregamento Inicial do Hotel
  useEffect(() => {
    async function fetchHotel() {
      try {
        const { data: hotelData, error: hotelError } = await supabase.from('hoteis').select('*').eq('id', params.id).single();
        if (hotelError) throw new Error("Erro ao buscar a hospedagem.");
        
        if (hotelData) {
          setHotel(hotelData);
          setTotalStandard(parseValor(hotelData.quarto_standard_preco) * quartos);
          setTotalLuxo(parseValor(hotelData.quarto_luxo_preco) * quartos);
        } else {
          setErro("Hospedagem não encontrada.");
        }
      } catch (err: any) {
        setErro(err.message || "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchHotel();
  }, [params.id, quartos]);

  // ── REATIVIDADE: ATUALIZAÇÃO PREÇOS DIÁRIOS VIA API RAILWAY ──
  useEffect(() => {
    if (!hotel) return;

    if (!checkin || !checkout) {
      setTotalStandard(parseValor(hotel.quarto_standard_preco) * quartos);
      setTotalLuxo(parseValor(hotel.quarto_luxo_preco) * quartos);
      setTotalNoites(1);
      setStandardDisponivel(true);
      setLuxoDisponivel(true);
      return;
    }

    async function atualizarPrecosDinamicos() {
      setCalculandoPreco(true);
      const checkinStr = formatarDataIso(checkin!);
      const checkoutStr = formatarDataIso(checkout!);

      try {
        const [resStd, resLux] = await Promise.all([
          fetch(`https://sagaturismo-production.up.railway.app/api/v1/public/hoteis/${params.id}/calcular-preco?tipo_quarto=standard&checkin=${checkinStr}&checkout=${checkoutStr}&quantidade=${quartos}`),
          fetch(`https://sagaturismo-production.up.railway.app/api/v1/public/hoteis/${params.id}/calcular-preco?tipo_quarto=luxo&checkin=${checkinStr}&checkout=${checkoutStr}&quantidade=${quartos}`)
        ]);

        const dataStd = await resStd.json();
        const dataLux = await resLux.json();

        if (dataStd.sucesso) {
          setTotalStandard(dataStd.valor_total);
          setStandardDisponivel(dataStd.disponivel);
          setTotalNoites(dataStd.noites);
        } else {
          setStandardDisponivel(false);
        }

        if (dataLux.sucesso) {
          setTotalLuxo(dataLux.valor_total);
          setLuxoDisponivel(dataLux.disponivel);
        } else {
          setLuxoDisponivel(false);
        }

      } catch (err) {
        console.error("Erro ao sincronizar valores dinâmicos do calendário:", err);
      } finally {
        setCalculandoPreco(false);
      }
    }

    atualizarPrecosDinamicos();
  }, [checkin, checkout, quartos, hotel, params.id]);

  // Efeito de Scroll Header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 80) setShowHeader(true);
      else if (currentScrollY > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Lógica do Calendário
  const diasDoMes = (ano: number, mes: number) => new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaDoMes = (ano: number, mes: number) => new Date(ano, mes, 1).getDay();

  const handleDateClick = (data: Date) => {
    if (!checkin || (checkin && checkout)) {
      setCheckin(data);
      setCheckout(null);
    } else if (data > checkin) {
      setCheckout(data);
    } else {
      setCheckin(data);
    }
  };

  const formatarDataIso = (data: Date) => {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  };

  const handleReserva = (tipo: 'standard' | 'luxo') => {
    if (!checkin || !checkout) {
      alert("Por favor, selecione as datas de Check-in e Check-out no calendário na lateral antes de reservar.");
      document.getElementById('motor-reservas')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    if (tipo === 'standard' && !standardDisponivel) {
      alert("Pedimos desculpa, mas o Quarto Standard está esgotado para o período selecionado.");
      return;
    }
    if (tipo === 'luxo' && !luxoDisponivel) {
      alert("Pedimos desculpa, mas a Suíte Luxo está esgotada para o período selecionado.");
      return;
    }

    router.push(`/checkout-hotel?hotel=${hotel?.id}&quarto=${tipo}&checkin=${formatarDataIso(checkin)}&checkout=${formatarDataIso(checkout)}&adultos=${adultos}&criancas=${criancas}&quartos=${quartos}`);
  };

  if (!mounted || loading || !mesAtualCalendario) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]">
      <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs">Carregando detalhes da hospedagem...</p>
    </div>
  );

  if (erro || !hotel) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-6 text-center">
      <h1 className="text-2xl md:text-3xl font-black mb-4">Alojamento Não Encontrado</h1>
      <p className="text-slate-500 mb-8 max-w-md text-sm md:text-base">{erro}</p>
      <Link href="/hoteis" className="bg-[#00577C] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs md:text-sm shadow-lg">Voltar aos Hotéis</Link>
    </div>
  );

  const anoCorrente = mesAtualCalendario.getFullYear();
  const mesCorrente = mesAtualCalendario.getMonth();
  const diasMes = diasDoMes(anoCorrente, mesCorrente);
  const primeiroDia = primeiroDiaDoMes(anoCorrente, mesCorrente);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const imagensStandard = getArraySeguro(hotel.quarto_standard_imagens).length > 0 
    ? getArraySeguro(hotel.quarto_standard_imagens) 
    : [hotel.imagem_url, "https://images.unsplash.com/photo-1618773928121-c32242fa11f5?q=80&w=1740"];
  
  const imagensLuxo = getArraySeguro(hotel.quarto_luxo_imagens).length > 0 
    ? getArraySeguro(hotel.quarto_luxo_imagens) 
    : ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1740", hotel.imagem_url];

  return (
    <div className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 flex flex-col`}>
      
      {/* ── HEADER ── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-10 w-28 md:h-16 md:w-56 shrink-0"><Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" /></div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block text-left">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            <Link href="/hoteis" className="text-[#00577C]">Alojamentos</Link>
            <Link href="/roteiro" className="text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão Residente</Link>
          </nav>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl border border-slate-200 p-2 lg:hidden bg-slate-50 text-[#00577C]">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {isMobileMenuOpen && (
          <div className="absolute top-[100%] left-0 w-full bg-white border-b border-slate-200 p-5 flex flex-col gap-4 shadow-xl lg:hidden text-left animate-in slide-in-from-top-4">
            <Link href="/roteiro" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Rota Turística</Link>
            <Link href="/hoteis" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Alojamentos</Link>
            <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#F9C400] text-[#00577C] font-black px-4 py-3.5 rounded-xl text-center mt-2 uppercase tracking-widest text-sm shadow-md">Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <div className="w-full h-[40vh] md:h-[50vh] relative bg-[#002f40] mt-[60px] md:mt-[90px]">
        <Link href="/hoteis" className="absolute top-4 md:top-6 left-4 md:left-6 z-20 flex items-center gap-2 text-xs md:text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-lg transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover opacity-70" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-6 md:bottom-10 left-5 md:left-16 z-20 text-left pr-5">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
             <span className="bg-[#F9C400] text-[#00577C] px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-md">{hotel.tipo}</span>
             <div className="flex gap-0.5 md:gap-1">
                {Array.from({ length: hotel.estrelas }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 md:h-4 md:w-4 fill-[#F9C400] text-[#F9C400]" />)}
             </div>
          </div>
          <h1 className={`${jakarta.className} text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg`}>{hotel.nome}</h1>
          <p className="text-white/80 font-medium flex items-center gap-2 mt-2 md:mt-3 text-xs md:text-sm">
             <MapPin size={16} className="text-[#009640] w-4 h-4"/> {hotel.endereco || 'São Geraldo do Araguaia, Pará'}
          </p>
        </div>
      </div>

      {/* ── BARRA DE SELEÇÃO RÁPIDA MOBILE ── */}
      <div className="sticky top-[60px] md:top-[88px] z-40 bg-white border-b border-slate-200 shadow-sm lg:hidden">
         <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-3 shrink-0">
               <div className="bg-blue-50 p-2 rounded-lg text-[#00577C]"><CalendarIcon size={16}/></div>
               <div className="text-left leading-none">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Estadia</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {checkin ? checkin.toLocaleDateString('pt-BR', {day:'2-digit', month:'short'}) : 'Datas'} — {checkout ? checkout.toLocaleDateString('pt-BR', {day:'2-digit', month:'short'}) : 'Datas'}
                  </p>
               </div>
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex items-center gap-3 shrink-0">
               <div className="bg-green-50 p-2 rounded-lg text-[#009640]"><Users size={16}/></div>
               <div className="text-left leading-none">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Hóspedes</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">{adultos} Ad. · {quartos} Qts.</p>
               </div>
            </div>
            <button onClick={() => document.getElementById('motor-reservas')?.scrollIntoView({ behavior: 'smooth' })} className="ml-auto bg-slate-50 p-2.5 rounded-full border border-slate-200 text-[#00577C] shadow-sm"><Edit3 size={16}/></button>
         </div>
      </div>

      {/* Container Geral das Colunas */}
      <div className="mx-auto w-full max-w-7xl px-4 md:px-5 py-8 md:py-12 flex flex-col lg:flex-row items-start gap-8 relative z-10">
        
        {/* COLUNA ESQUERDA (CONTEÚDO) */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-6 md:gap-8">
          
          {/* 1. SELEÇÃO DE QUARTOS */}
          <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden text-left">
             <div className="bg-slate-50 p-5 md:p-6 border-b border-slate-200">
               <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900`}>Acomodações Disponíveis</h3>
               <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Valores finais atualizados em tempo real de acordo com as tarifas do hoteleiro.</p>
             </div>
             
             <div className="p-4 md:p-6 flex flex-col gap-6 md:gap-8">
                
                {/* CARD: QUARTO STANDARD */}
                <div className="border border-slate-200 rounded-2xl md:rounded-[1.5rem] overflow-hidden bg-white shadow-sm flex flex-col">
                   <h4 className={`${jakarta.className} font-bold text-base md:text-lg p-4 md:p-5 bg-slate-50 border-b border-slate-200 text-[#00577C]`}>
                     {hotel.quarto_standard_nome || 'Quarto Standard'}
                   </h4>
                   <div className="flex flex-col xl:flex-row">
                      <div className="w-full xl:w-2/5 p-4 md:p-5 border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col">
                         <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 md:mb-4 group">
                            <Image src={imagensStandard[imgIdxStandard]} alt="Quarto" fill className="object-cover" />
                            <button onClick={() => setImgIdxStandard((prev) => (prev - 1 + imagensStandard.length) % imagensStandard.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center"><ChevronLeft size={16}/></button>
                            <button onClick={() => setImgIdxStandard((prev) => (prev + 1) % imagensStandard.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center"><ChevronRightIcon size={16}/></button>
                         </div>
                         <div className="grid grid-cols-2 gap-2 md:gap-3 text-[10px] md:text-xs text-slate-600 font-medium mt-auto">
                            <span className="flex items-center gap-1.5"><Wind size={12}/> Ar-condicionado</span>
                            <span className="flex items-center gap-1.5"><Wifi size={12}/> Wi-Fi Grátis</span>
                            <span className="flex items-center gap-1.5"><Bath size={12}/> Banheiro Priv.</span>
                         </div>
                      </div>
                      
                      <div className="w-full xl:w-3/5 flex flex-col sm:flex-row">
                         <div className="flex-1 p-4 md:p-5 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col justify-center">
                            <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Resumo da Reserva</p>
                            <ul className="space-y-2 md:space-y-3">
                               <li className="flex items-start gap-2 text-xs md:text-sm text-[#009640] font-bold"><CheckCircle2 size={16} /> Cancelamento grátis até 24h</li>
                               <li className="flex items-start gap-2 text-xs md:text-sm text-[#00577C] font-bold"><CreditCard size={16} /> Confirmação imediata</li>
                            </ul>
                         </div>
                         <div className="w-full sm:w-48 p-5 flex flex-col items-center sm:items-end justify-center bg-slate-50/50">
                            <div className="flex items-center gap-1 text-slate-400 mb-2">{[...Array(2)].map((_,i) => <Users key={i} size={14}/>)}</div>
                            <p className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 leading-none mb-1`}>
                              {calculandoPreco ? '...' : formatarMoeda(totalStandard)}
                            </p>
                            <p className="text-[9px] md:text-[10px] text-slate-500 font-bold mb-4">{totalNoites} noite(s) · {quartos} quarto(s)</p>
                            <button 
                              disabled={!standardDisponivel || calculandoPreco}
                              onClick={() => handleReserva('standard')} 
                              className={`w-full py-3.5 md:py-3 rounded-xl font-black uppercase text-[10px] md:text-xs tracking-widest transition-all shadow-md active:scale-95 ${
                                !standardDisponivel ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none active:scale-100' : 'bg-[#00577C] hover:bg-[#004a6b] text-white'
                              }`}
                            >
                               {calculandoPreco ? 'Calculando...' : !standardDisponivel ? 'Esgotado' : 'Reservar'}
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                {/* CARD: QUARTO LUXO */}
                <div className="border-2 border-[#00577C]/20 rounded-2xl md:rounded-[1.5rem] overflow-hidden bg-white shadow-sm flex flex-col relative">
                   <div className="absolute top-0 right-0 bg-[#00577C] text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-bl-xl z-10 flex items-center gap-1.5"><Award size={12}/> Mais Escolhido</div>
                   <h4 className={`${jakarta.className} font-bold text-base md:text-lg p-4 md:p-5 bg-blue-50/30 border-b border-slate-100 text-[#00577C]`}>
                     {hotel.quarto_luxo_nome || 'Suíte Luxo Premium'}
                   </h4>
                   <div className="flex flex-col xl:flex-row">
                      <div className="w-full xl:w-2/5 p-4 md:p-5 border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col">
                         <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 md:mb-4 group">
                            <Image src={imagensLuxo[imgIdxLuxo]} alt="Quarto Luxo" fill className="object-cover" />
                            <button onClick={() => setImgIdxLuxo((prev) => (prev - 1 + imagensLuxo.length) % imagensLuxo.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center"><ChevronLeft size={16}/></button>
                            <button onClick={() => setImgIdxLuxo((prev) => (prev + 1) % imagensLuxo.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center"><ChevronRightIcon size={16}/></button>
                         </div>
                         <div className="grid grid-cols-2 gap-2 md:gap-3 text-[10px] md:text-xs text-slate-600 font-medium mt-auto">
                            <span className="flex items-center gap-1.5"><Wind size={12}/> Ar-condicionado</span>
                            <span className="flex items-center gap-1.5"><Wifi size={12}/> Wi-Fi Premium</span>
                            <span className="flex items-center gap-1.5"><Bath size={12}/> Banheira/Spa</span>
                         </div>
                      </div>
                      
                      <div className="w-full xl:w-3/5 flex flex-col sm:flex-row">
                         <div className="flex-1 p-4 md:p-5 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col justify-center">
                            <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Resumo da Reserva</p>
                            <ul className="space-y-2 md:space-y-3">
                               <li className="flex items-start gap-2 text-xs md:text-sm text-[#009640] font-bold"><CheckCircle2 size={16} /> Cancelamento grátis até 24h</li>
                               <li className="flex items-start gap-2 text-xs md:text-sm text-[#00577C] font-bold"><Coffee size={16} /> Café da manhã incluso</li>
                            </ul>
                         </div>
                         <div className="w-full sm:w-48 p-5 flex flex-col items-center sm:items-end justify-center bg-slate-50/50">
                            <div className="flex items-center gap-1 text-slate-400 mb-2">{[...Array(3)].map((_,i) => <Users key={i} size={14}/>)}</div>
                            <p className={`${jakarta.className} text-2xl md:text-3xl font-black text-[#00577C] leading-none mb-1`}>
                              {calculandoPreco ? '...' : formatarMoeda(totalLuxo)}
                            </p>
                            <p className="text-[9px] md:text-[10px] text-slate-500 font-bold mb-4">{totalNoites} noite(s) · {quartos} quarto(s)</p>
                            <button 
                              disabled={!luxoDisponivel || calculandoPreco}
                              onClick={() => handleReserva('luxo')} 
                              className={`w-full py-3.5 md:py-3 rounded-xl font-black uppercase text-[10px] md:text-xs tracking-widest transition-all shadow-md active:scale-95 ${
                                !luxoDisponivel ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none active:scale-100' : 'bg-[#F9C400] hover:bg-[#e5b500] text-[#00577C]'
                              }`}
                            >
                               {calculandoPreco ? 'Calculando...' : !luxoDisponivel ? 'Esgotado' : 'Reservar'}
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

             </div>
          </section>

          {/* 2. CARD DE AVALIAÇÕES */}
          <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm p-5 md:p-10 text-left">
             <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-6`}>Avaliações dos hóspedes</h3>
             <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-1/3">
                   <div className="flex items-center gap-4 mb-5">
                      <div className="bg-[#00577C] text-white text-2xl md:text-3xl font-black rounded-xl w-14 h-12 flex items-center justify-center shadow-lg">
                         {hotel.avaliacoes_info?.nota || 8.8}
                      </div>
                      <div>
                         <p className={`${jakarta.className} text-base font-black text-[#00577C] leading-none`}>{hotel.avaliacoes_info?.texto || 'Muito bom'}</p>
                         <p className="text-[10px] md:text-xs text-slate-500 font-bold mt-1">{hotel.avaliacoes_info?.total || 73} avaliações verificadas</p>
                      </div>
                   </div>
                   <div className="space-y-3">
                      {[
                        { label: 'Limpeza', score: hotel.avaliacoes_info?.limpeza || 9.0 },
                        { label: 'Comodidades', score: hotel.avaliacoes_info?.comodidades || 8.2 },
                        { label: 'Localização', score: hotel.avaliacoes_info?.localizacao || 9.6 }
                      ].map(item => (
                         <div key={item.label}>
                            <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1"><span>{item.label}</span><span>{item.score.toFixed(1)}</span></div>
                            <div className="w-full bg-slate-200 rounded-full h-1"><div className="bg-[#00577C] h-1 rounded-full" style={{ width: `${(item.score / 10) * 100}%` }}></div></div>
                         </div>
                      ))}
                   </div>
                </div>
                <div className="w-full lg:w-2/3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6">
                   <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed italic">"O hotel superou as expectativas. Qualquer alteração de preço ou agendamento feita pelo hoteleiro reflete na hora no checkout. Limpeza impecável."</p>
                   <p className="text-[10px] text-slate-400 font-bold mt-2">— Maria Silva, Maio 2026</p>
                </div>
             </div>
          </section>

          {/* 3. POLÍTICAS DA PROPRIEDADE */}
          <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm p-5 md:p-10 text-left">
             <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-6`}>Políticas da Propriedade</h3>
             <div className="grid md:grid-cols-[1fr_2fr] gap-x-8 gap-y-5 text-xs md:text-sm">
                <div className="font-black text-slate-800">Horários de estadia</div>
                <div className="text-slate-600 font-medium">Check-in: A partir das 14:00 | Check-out: Até às 12:00</div>
                <div className="col-span-1 md:col-span-2 h-px bg-slate-100"></div>
                <div className="font-black text-slate-800">Crianças e Camas</div>
                <div className="text-slate-600 font-medium">{hotel.politicas?.criancas || 'Crianças de qualquer idade são bem-vindas. Tarifação padrão automatizada.'}</div>
             </div>
          </section>

          {/* 4. INFORMAÇÕES DE CONTACTO */}
          <section className="bg-[#002f40] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden text-left">
             <h3 className={`${jakarta.className} text-xl md:text-2xl font-black mb-2`}>Informações de Contacto</h3>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 rounded-xl p-4 border border-white/10"><Phone className="text-[#F9C400] mb-2" size={18} /><p className="text-[10px] text-white/50">WhatsApp</p><p className="font-bold text-xs md:text-sm truncate">{hotel.contatos?.telefone || '+55 (94) 90000-0000'}</p></div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/10"><Mail className="text-[#F9C400] mb-2" size={18} /><p className="text-[10px] text-white/50">E-mail</p><p className="font-bold text-xs md:text-sm truncate">{hotel.contatos?.email || 'contato@hotel.com.br'}</p></div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/10"><Globe className="text-[#F9C400] mb-2" size={18} /><p className="text-[10px] text-white/50">Website</p><p className="font-bold text-xs md:text-sm truncate">{hotel.contatos?.website || 'www.saga.com.br'}</p></div>
             </div>
          </section>

        </div>

        {/* ── COLUNA DIREITA: CALENDÁRIO COM CLASSES NATIVAS ── */}
        {/* Removeu-se o lg:sticky e lg:top-28. Adicionou-se o h-fit para alinhar perfeitamente */}
        <div id="motor-reservas" className="w-full lg:w-[380px] shrink-0 h-fit lg:self-start relative z-30">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-200 text-left">
             <h3 className={`${jakarta.className} text-lg md:text-xl font-black text-slate-900 mb-5 flex items-center gap-2`}>
                <CalendarIcon className="text-[#00577C]" size={20}/> Escolher Período
             </h3>

             <div className="space-y-4 mb-6">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner">
                     <div className="flex items-center justify-between mb-3">
                        <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente - 1))} className="p-1 hover:bg-slate-200 rounded-full"><ChevronLeft size={16}/></button>
                        <p className="font-bold text-slate-800 capitalize text-xs md:text-sm">{mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                        <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente + 1))} className="p-1 hover:bg-slate-200 rounded-full"><ChevronRight size={16}/></button>
                     </div>
                     <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="text-[8px] md:text-[9px] font-black text-slate-400">{d}</span>)}
                     </div>
                     <div className="grid grid-cols-7 gap-y-0.5">
                        {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: diasMes }).map((_, i) => {
                           const dataAtual = new Date(anoCorrente, mesCorrente, i + 1);
                           const isPassado = dataAtual < hoje;
                           const isCheckin = checkin && dataAtual.getTime() === checkin.getTime();
                           const isCheckout = checkout && dataAtual.getTime() === checkout.getTime();
                           const isInBetween = checkin && checkout && dataAtual > checkin && dataAtual < checkout;
                           
                           let bgClass = "bg-transparent hover:bg-slate-200 text-slate-800";
                           if (isPassado) bgClass = "text-slate-300 cursor-not-allowed pointer-events-none";
                           else if (isCheckin || isCheckout) bgClass = "bg-[#00577C] text-white shadow-md rounded-md font-black scale-110 z-10";
                           else if (isInBetween) bgClass = "bg-[#00577C]/10 text-[#00577C] rounded-none";

                           return (
                             <button 
                               key={i} disabled={isPassado} onClick={() => handleDateClick(dataAtual)}
                               className={`w-full aspect-square flex items-center justify-center text-[10px] md:text-xs transition-all ${bgClass}`}
                             >
                               {i + 1}
                             </button>
                           );
                        })}
                     </div>
                  </div>
             </div>

             {/* Hóspedes */}
             <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#00577C]">Adultos</span>
                   <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                      <button type="button" onClick={() => setAdultos(Math.max(1, adultos - 1))} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">-</button>
                      <span className="font-bold text-xs w-4 text-center">{adultos}</span>
                      <button type="button" onClick={() => setAdultos(adultos + 1)} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">+</button>
                   </div>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#00577C]">Quartos</span>
                   <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                      <button type="button" onClick={() => setQuartos(Math.max(1, quartos - 1))} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">-</button>
                      <span className="font-bold text-xs w-4 text-center">{quartos}</span>
                      <button type="button" onClick={() => setQuartos(quartos + 1)} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">+</button>
                   </div>
                </div>
             </div>
             
             {!checkin || !checkout ? (
               <div className="mt-5 p-4 bg-blue-50 text-[#00577C] rounded-2xl flex items-start gap-3 border border-blue-100">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <p className="text-[10px] md:text-xs font-bold leading-relaxed">Selecione o check-in e check-out para calcular as tarifas do calendário.</p>
               </div>
             ) : (
               <div className="mt-5 p-4 bg-green-50 text-[#009640] rounded-2xl flex items-start gap-3 border border-green-100">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] md:text-xs font-bold leading-tight">Datas Consultadas!</p>
                    <p className="text-[9px] md:text-[10px] font-medium opacity-80 mt-1">Preços calculados com base em {totalNoites} noit(s) na API da Railway.</p>
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white mt-auto text-left">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative h-10 w-28 md:h-14 md:w-40 shrink-0"><Image src="/logop.png" alt="Prefeitura" fill className="object-contain" /></div>
            <div className="hidden border-l border-slate-200 pl-4 md:block">
              <p className={`${jakarta.className} text-xl font-bold text-[#00577C]`}>SagaTurismo</p>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest text-[9px]">Portal Oficial de Turismo</p>
            </div>
          </div>
          <p className="text-[9px] md:text-[10px] text-slate-400 font-medium uppercase tracking-widest text-center">© 2026 · Prefeitura Municipal de São Geraldo do Araguaia</p>
        </div>
      </footer>
    </div>
  );
}