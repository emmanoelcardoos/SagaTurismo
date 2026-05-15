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

// ── TIPAGENS E UTILITÁRIOS ──
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

// ── TIPAGEM EXPANDIDA (Com os novos campos do Supabase) ──
type Hotel = {
  id: string; nome: string; tipo: string; descricao: string; estrelas: number; imagem_url: string;
  endereco?: string; preco_medio?: string;
  quarto_standard_nome?: string; quarto_standard_preco?: any;
  quarto_luxo_nome?: string; quarto_luxo_preco?: any;
  comodidades?: string[]; galeria?: string[];
  quarto_standard_comodidades?: any;
  quarto_luxo_comodidades?: any;
  // Novos campos a adicionar no Supabase no futuro:
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

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542314831-c53cd6b7608b?q=80&w=1740";

export default function HotelDetalhePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [disponibilidadeDb, setDisponibilidadeDb] = useState<Record<string, Disponibilidade>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ── ESTADOS DO MOTOR DE RESERVAS (CALENDÁRIO E LOTAÇÃO) ──
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [mesAtualCalendario, setMesAtualCalendario] = useState<Date | null>(null);
  
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

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

  // Carregamento de Dados
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: hotelData, error: hotelError } = await supabase.from('hoteis').select('*').eq('id', params.id).single();
        if (hotelError) throw new Error("Erro ao buscar a hospedagem.");
        
        const { data: dispData } = await supabase.from('hotel_disponibilidade').select('*').eq('hotel_id', params.id);
        
        const dispMap: Record<string, Disponibilidade> = {};
        if (dispData) {
          dispData.forEach((d: any) => { dispMap[d.data] = d; });
        }

        if (hotelData) {
          setHotel(hotelData);
          setDisponibilidadeDb(dispMap);
        } else {
          setErro("Hospedagem não encontrada.");
        }
      } catch (err: any) {
        setErro(err.message || "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchData();
  }, [params.id]);

  // Efeito de Scroll
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

  // ── LÓGICA DO CALENDÁRIO CUSTOMIZADO ──
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

  const getPrecoDiaria = (dataStr: string, tipo: 'standard' | 'luxo') => {
    const disp = disponibilidadeDb[dataStr];
    if (disp) {
      return tipo === 'luxo' ? parseValor(disp.quarto_luxo_preco) : parseValor(disp.quarto_standard_preco);
    }
    return hotel ? (tipo === 'luxo' ? parseValor(hotel.quarto_luxo_preco) : parseValor(hotel.quarto_standard_preco)) : 0;
  };

  const isDisponivel = (dataStr: string, tipo: 'standard' | 'luxo') => {
    const disp = disponibilidadeDb[dataStr];
    if (disp) {
      return tipo === 'luxo' ? disp.quarto_luxo_disponivel : disp.quarto_standard_disponivel;
    }
    return true; 
  };

  const formatarDataIso = (data: Date) => {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  };

  // Cálculo de Preço Total por tipo de Quarto
  let totalStandard = 0;
  let totalLuxo = 0;
  let totalNoites = 0;
  
  if (checkin && checkout) {
    let diaAtual = new Date(checkin);
    while (diaAtual < checkout) {
      const dataStr = formatarDataIso(diaAtual);
      totalStandard += getPrecoDiaria(dataStr, 'standard') * quartos;
      totalLuxo += getPrecoDiaria(dataStr, 'luxo') * quartos;
      totalNoites++;
      diaAtual.setDate(diaAtual.getDate() + 1);
    }
  } else {
    // Preço base de 1 noite se não escolheu data
    totalNoites = 1;
    totalStandard = (hotel ? parseValor(hotel.quarto_standard_preco) : 0) * quartos;
    totalLuxo = (hotel ? parseValor(hotel.quarto_luxo_preco) : 0) * quartos;
  }

  const handleReserva = (tipo: 'standard' | 'luxo') => {
    if (!checkin || !checkout) {
      alert("Por favor, selecione as datas de Check-in e Check-out no calendário na lateral antes de reservar.");
      // Scroll to calendar
      window.scrollTo({ top: 400, behavior: 'smooth' });
      return;
    }
    router.push(`/checkout-hotel?hotel=${hotel?.id}&quarto=${tipo}&checkin=${formatarDataIso(checkin)}&checkout=${formatarDataIso(checkout)}&adultos=${adultos}&criancas=${criancas}&quartos=${quartos}`);
  };

  // Galeria Principal
  const fecharGaleria = () => setFotoExpandidaIndex(null);
  const proximaFoto = (e: React.MouseEvent) => { e.stopPropagation(); if (hotel?.galeria) setFotoExpandidaIndex((prev) => (prev! + 1) % hotel.galeria!.length); };
  const fotoAnterior = (e: React.MouseEvent) => { e.stopPropagation(); if (hotel?.galeria) setFotoExpandidaIndex((prev) => (prev! - 1 + hotel.galeria!.length) % hotel.galeria!.length); };

  if (!mounted || loading || !mesAtualCalendario) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-xs">Carregando detalhes da hospedagem...</p>
    </div>
  );

  if (erro || !hotel) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-6 text-center">
      <h1 className="text-3xl font-black mb-4">Alojamento Não Encontrado</h1>
      <p className="text-slate-500 mb-8 max-w-md">{erro}</p>
      <Link href="/hoteis" className="bg-[#00577C] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm shadow-lg">Voltar aos Hotéis</Link>
    </div>
  );

  const anoCorrente = mesAtualCalendario.getFullYear();
  const mesCorrente = mesAtualCalendario.getMonth();
  const diasMes = diasDoMes(anoCorrente, mesCorrente);
  const primeiroDia = primeiroDiaDoMes(anoCorrente, mesCorrente);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // ── MOCKS PARA FOTOS DE QUARTOS (Caso o DB não tenha) ──
  const imagensStandard = getArraySeguro(hotel.quarto_standard_imagens).length > 0 
    ? getArraySeguro(hotel.quarto_standard_imagens) 
    : [hotel.imagem_url, "https://images.unsplash.com/photo-1618773928121-c32242fa11f5?q=80&w=1740", "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?q=80&w=1674"];
  
  const imagensLuxo = getArraySeguro(hotel.quarto_luxo_imagens).length > 0 
    ? getArraySeguro(hotel.quarto_luxo_imagens) 
    : ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1740", "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1740", hotel.imagem_url];

  return (
    <div className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 flex flex-col`}>
      
      {/* ── HEADER ── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56"><Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" /></div>
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
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <div className="w-full h-[40vh] md:h-[50vh] relative bg-[#002f40] mt-[70px] md:mt-[90px]">
        <Link href="/hoteis" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 px-4 py-2 rounded-full shadow-lg transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover opacity-70" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        <div className="absolute bottom-10 left-6 md:left-16 z-20">
          <div className="flex items-center gap-2 mb-3">
             <span className="bg-[#F9C400] text-[#00577C] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">
               {hotel.tipo}
             </span>
             <div className="flex gap-1">
                {Array.from({ length: hotel.estrelas }).map((_, i) => <Star key={i} className="h-4 w-4 fill-[#F9C400] text-[#F9C400]" />)}
             </div>
          </div>
          <h1 className={`${jakarta.className} text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg`}>{hotel.nome}</h1>
          <p className="text-white/80 font-medium flex items-center gap-2 mt-3 text-sm">
             <MapPin size={16} className="text-[#009640]"/> {hotel.endereco || 'São Geraldo do Araguaia, Pará'}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 py-12 flex flex-col lg:flex-row items-start gap-8 relative z-10">
        
        {/* ── COLUNA ESQUERDA: CONTEÚDO PRINCIPAL ── */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-8">
          
          {/* 1. SELEÇÃO DE QUARTOS (ESTILO OTA) */}
          <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
             <div className="bg-slate-50 p-6 border-b border-slate-200">
               <h3 className={`${jakarta.className} text-2xl font-black text-slate-900`}>Acomodações Disponíveis</h3>
               <p className="text-sm text-slate-500 font-medium mt-1">Selecione o seu quarto para verificar os detalhes da reserva.</p>
             </div>
             
             <div className="p-6 flex flex-col gap-8">
                
                {/* ── CARD: QUARTO STANDARD ── */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col hover:border-[#00577C]/30 transition-colors">
                   <h4 className={`${jakarta.className} font-bold text-lg p-5 bg-slate-50 border-b border-slate-200 text-[#00577C]`}>
                     {hotel.quarto_standard_nome || 'Quarto Standard'}
                   </h4>
                   <div className="flex flex-col xl:flex-row">
                      {/* Lado Esquerdo: Imagem e Specs */}
                      <div className="w-full xl:w-2/5 p-5 border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col">
                         <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 group">
                            <Image src={imagensStandard[imgIdxStandard]} alt="Quarto" fill className="object-cover" />
                            <button onClick={(e) => { e.stopPropagation(); setImgIdxStandard((prev) => (prev - 1 + imagensStandard.length) % imagensStandard.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); setImgIdxStandard((prev) => (prev + 1) % imagensStandard.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRightIcon size={16}/></button>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><ImageIcon size={10}/> {imagensStandard.length}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 font-medium mt-auto">
                            <span className="flex items-center gap-1.5"><Wind size={14}/> Ar-condicionado</span>
                            <span className="flex items-center gap-1.5"><Wifi size={14}/> Wi-Fi Grátis</span>
                            <span className="flex items-center gap-1.5"><Bath size={14}/> Banheiro Priv.</span>
                         </div>
                      </div>
                      
                      {/* Lado Direito: Resumo e Preço */}
                      <div className="w-full xl:w-3/5 flex flex-col sm:flex-row">
                         <div className="flex-1 p-5 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col justify-center">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Resumo da Reserva</p>
                            <ul className="space-y-3">
                               <li className="flex items-start gap-2 text-sm text-[#009640] font-bold">
                                 <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> Cancelamento grátis até 24h antes
                               </li>
                               <li className="flex items-start gap-2 text-sm text-[#00577C] font-bold">
                                 <Zap size={16} className="shrink-0 mt-0.5" /> Confirmação Imediata
                               </li>
                               <li className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                                 <CreditCard size={16} className="shrink-0 mt-0.5" /> Pagamento flexível disponível
                               </li>
                            </ul>
                         </div>
                         <div className="w-full sm:w-48 p-5 flex flex-col items-end justify-center bg-slate-50/50">
                            <div className="flex items-center gap-1 text-slate-400 mb-2" title="Hóspedes recomendados">
                               {[...Array(2)].map((_,i) => <Users key={i} size={14}/>)}
                            </div>
                            <p className={`${jakarta.className} text-2xl font-black text-slate-900 leading-none mb-1`}>{formatarMoeda(totalStandard)}</p>
                            <p className="text-[10px] text-slate-500 font-bold mb-5">{totalNoites} noite(s) · {quartos} quarto(s)</p>
                            <button onClick={() => handleReserva('standard')} className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-colors shadow-md">
                               Reservar
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                {/* ── CARD: QUARTO LUXO ── */}
                <div className="border-2 border-[#00577C]/20 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col relative">
                   <div className="absolute top-0 right-0 bg-[#00577C] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-sm z-10 flex items-center gap-1.5">
                      <Award size={14}/> Mais Escolhido
                   </div>
                   <h4 className={`${jakarta.className} font-bold text-lg p-5 bg-blue-50/30 border-b border-slate-100 text-[#00577C]`}>
                     {hotel.quarto_luxo_nome || 'Suíte Luxo Premium'}
                   </h4>
                   <div className="flex flex-col xl:flex-row">
                      <div className="w-full xl:w-2/5 p-5 border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col">
                         <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 group">
                            <Image src={imagensLuxo[imgIdxLuxo]} alt="Quarto Luxo" fill className="object-cover" />
                            <button onClick={(e) => { e.stopPropagation(); setImgIdxLuxo((prev) => (prev - 1 + imagensLuxo.length) % imagensLuxo.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); setImgIdxLuxo((prev) => (prev + 1) % imagensLuxo.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRightIcon size={16}/></button>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><ImageIcon size={10}/> {imagensLuxo.length}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 font-medium mt-auto">
                            <span className="flex items-center gap-1.5"><Wind size={14}/> Ar-condicionado</span>
                            <span className="flex items-center gap-1.5"><Wifi size={14}/> Wi-Fi Grátis</span>
                            <span className="flex items-center gap-1.5"><Bath size={14}/> Banheira/Spa</span>
                         </div>
                      </div>
                      
                      <div className="w-full xl:w-3/5 flex flex-col sm:flex-row">
                         <div className="flex-1 p-5 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col justify-center">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Resumo da Reserva</p>
                            <ul className="space-y-3">
                               <li className="flex items-start gap-2 text-sm text-[#009640] font-bold">
                                 <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> Cancelamento grátis até 24h antes
                               </li>
                               <li className="flex items-start gap-2 text-sm text-[#00577C] font-bold">
                                 <Coffee size={16} className="shrink-0 mt-0.5" /> Café da manhã incluso
                               </li>
                               <li className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                                 <CreditCard size={16} className="shrink-0 mt-0.5" /> Pagamento flexível disponível
                               </li>
                            </ul>
                         </div>
                         <div className="w-full sm:w-48 p-5 flex flex-col items-end justify-center bg-slate-50/50">
                            <div className="flex items-center gap-1 text-slate-400 mb-2" title="Hóspedes recomendados">
                               {[...Array(3)].map((_,i) => <Users key={i} size={14}/>)}
                            </div>
                            <p className={`${jakarta.className} text-2xl font-black text-[#00577C] leading-none mb-1`}>{formatarMoeda(totalLuxo)}</p>
                            <p className="text-[10px] text-slate-500 font-bold mb-5">{totalNoites} noite(s) · {quartos} quarto(s)</p>
                            <button onClick={() => handleReserva('luxo')} className="w-full bg-[#F9C400] hover:bg-[#e5b500] text-[#00577C] py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-colors shadow-md">
                               Reservar
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

             </div>
          </section>

          {/* 2. CARD DE AVALIAÇÕES (Estilo Trip.com) */}
          <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 md:p-10">
             <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-8`}>Avaliações dos hóspedes</h3>
             
             <div className="flex flex-col lg:flex-row gap-10">
                {/* Notas Esquerda */}
                <div className="w-full lg:w-1/3">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="bg-[#00577C] text-white text-3xl font-black rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm w-16 h-14 flex items-center justify-center shadow-lg">
                         {hotel.avaliacoes_info?.nota || 8.8}
                      </div>
                      <div>
                         <p className={`${jakarta.className} text-lg font-black text-[#00577C] leading-tight`}>{hotel.avaliacoes_info?.texto || 'Muito bom'}</p>
                         <p className="text-xs text-slate-500 font-bold">{hotel.avaliacoes_info?.total || 73} avaliações verificadas</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      {[
                        { label: 'Limpeza', score: hotel.avaliacoes_info?.limpeza || 9.0 },
                        { label: 'Comodidades', score: hotel.avaliacoes_info?.comodidades || 8.2 },
                        { label: 'Localização', score: hotel.avaliacoes_info?.localizacao || 9.6 },
                        { label: 'Atendimento', score: hotel.avaliacoes_info?.atendimento || 8.5 }
                      ].map(item => (
                         <div key={item.label}>
                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                               <span>{item.label}</span>
                               <span className="text-[#00577C]">{item.score.toFixed(1)}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                               <div className="bg-[#00577C] h-1.5 rounded-full" style={{ width: `${(item.score / 10) * 100}%` }}></div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Comentários Direita */}
                <div className="w-full lg:w-2/3">
                   <div className="flex flex-wrap gap-2 mb-6">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-200">Todas as avaliações</span>
                      <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-200">Estadia excelente!</span>
                      <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-200">Localização ótima</span>
                   </div>

                   <div className="space-y-6">
                      {/* Review Mock 1 */}
                      <div className="border-b border-slate-100 pb-6">
                         <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#00577C] font-black text-xs">M</div>
                            <div>
                               <p className="text-sm font-bold text-slate-800 leading-none">Maria Silva</p>
                               <p className="text-[10px] text-slate-400 mt-1">Hospedou-se em Maio 2026</p>
                            </div>
                         </div>
                         <p className="text-sm text-slate-600 font-medium leading-relaxed">"O hotel superou as expetativas. Quartos muito limpos, vista maravilhosa para a natureza e os funcionários foram extremamente prestáveis durante todo o fim de semana."</p>
                      </div>
                      {/* Review Mock 2 */}
                      <div>
                         <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-[#d9a000] font-black text-xs">C</div>
                            <div>
                               <p className="text-sm font-bold text-slate-800 leading-none">Carlos F.</p>
                               <p className="text-[10px] text-slate-400 mt-1">Hospedou-se em Abril 2026</p>
                            </div>
                         </div>
                         <p className="text-sm text-slate-600 font-medium leading-relaxed">"Excelente relação qualidade-preço. O pequeno-almoço tinha muitas opções locais. Apenas a internet oscilou um pouco à noite, mas no geral foi fantástico."</p>
                      </div>
                   </div>
                   
                   <button className="mt-6 text-[#00577C] font-black text-sm hover:underline">Mostrar todas as avaliações</button>
                </div>
             </div>
          </section>

          {/* 3. POLÍTICAS DA PROPRIEDADE */}
          <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 md:p-10">
             <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-8`}>Políticas da Propriedade</h3>
             <div className="grid md:grid-cols-[1fr_2fr] gap-x-8 gap-y-6 text-sm">
                
                <div className="font-black text-slate-800">Horários de check-in e check-out</div>
                <div className="text-slate-600 font-medium space-y-2">
                   <p><strong className="text-slate-800">Check-in:</strong> {hotel.politicas?.checkin_checkout || 'A partir das 14:00'}</p>
                   <p><strong className="text-slate-800">Check-out:</strong> {hotel.politicas?.checkin_checkout || 'Até às 12:00'}</p>
                   <p className="text-xs text-slate-500 mt-2">Os horários podem variar conforme a ocupação. Contacte a propriedade para mais flexibilidade.</p>
                </div>

                <div className="col-span-1 md:col-span-2 h-px bg-slate-100 my-2"></div>

                <div className="font-black text-slate-800">Políticas para crianças</div>
                <div className="text-slate-600 font-medium">
                   {hotel.politicas?.criancas || 'Crianças de qualquer idade são bem-vindas. Crianças com 12 anos ou mais são consideradas adultos na cobrança.'}
                </div>

                <div className="col-span-1 md:col-span-2 h-px bg-slate-100 my-2"></div>

                <div className="font-black text-slate-800">Berços e camas extras</div>
                <div className="text-slate-600 font-medium">
                   {hotel.politicas?.camas_extras || 'Berços sujeitos a disponibilidade e sem custo adicional. Camas extras podem ter custo.'}
                </div>

                <div className="col-span-1 md:col-span-2 h-px bg-slate-100 my-2"></div>

                <div className="font-black text-slate-800">Café da manhã</div>
                <div className="text-slate-600 font-medium">
                   {hotel.politicas?.cafe_manha || 'Servido diariamente das 07:00 às 09:30 no restaurante principal.'}
                </div>

                <div className="col-span-1 md:col-span-2 h-px bg-slate-100 my-2"></div>

                <div className="font-black text-slate-800">Requisitos de idade</div>
                <div className="text-slate-600 font-medium">
                   {hotel.politicas?.idade_minima || 'O hóspede principal que fará o check-in deve ter pelo menos 18 anos.'}
                </div>
             </div>
          </section>

          {/* 4. INFORMAÇÕES DE CONTACTO */}
          <section className="bg-[#002f40] rounded-[2rem] border border-[#00577C] shadow-xl p-8 md:p-10 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Globe size={150}/></div>
             <h3 className={`${jakarta.className} text-2xl font-black mb-2 relative z-10`}>Informações de Contacto</h3>
             <p className="text-white/70 text-sm font-medium mb-8 relative z-10">Precisa de esclarecer alguma dúvida diretamente com a propriedade? Use os contactos oficiais abaixo.</p>
             
             <div className="grid sm:grid-cols-3 gap-6 relative z-10">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
                   <Phone className="text-[#F9C400] mb-3" size={24}/>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Telefone / WhatsApp</p>
                   <p className="font-bold">{hotel.contatos?.telefone || '+55 (94) 90000-0000'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
                   <Mail className="text-[#F9C400] mb-3" size={24}/>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">E-mail</p>
                   <p className="font-bold break-all">{hotel.contatos?.email || 'contato@hotel.com.br'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
                   <Globe className="text-[#F9C400] mb-3" size={24}/>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Website</p>
                   <p className="font-bold break-all">{hotel.contatos?.website || 'www.hotel-saga.com'}</p>
                </div>
             </div>
          </section>

        </div>

        {/* ── COLUNA DIREITA: CALENDÁRIO / PESQUISA STICKY ── */}
        <div className="w-full lg:w-[380px] shrink-0 lg:self-start relative z-40">
          <aside className="lg:sticky lg:top-32 space-y-6">
            
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-200">
               <h3 className={`${jakarta.className} text-xl font-black text-slate-900 mb-6 flex items-center gap-3`}>
                  <CalendarIcon className="text-[#00577C]" size={20}/> Buscar Disponibilidade
               </h3>

               {/* Datas */}
               <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#00577C] block mb-2">Check-in — Check-out</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner">
                       {/* Renderização do Calendário igual à página de busca */}
                       <div className="flex items-center justify-between mb-4">
                          <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente - 1))} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><ChevronLeft size={18}/></button>
                          <p className="font-bold text-slate-800 capitalize text-sm">{mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                          <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente + 1))} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><ChevronRight size={18}/></button>
                       </div>
                       <div className="grid grid-cols-7 gap-1 text-center mb-1">
                          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="text-[9px] font-black text-slate-400">{d}</span>)}
                       </div>
                       <div className="grid grid-cols-7 gap-y-0.5">
                          {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                          {Array.from({ length: diasMes }).map((_, i) => {
                             const dataAtual = new Date(anoCorrente, mesCorrente, i + 1);
                             const dataStr = formatarDataIso(dataAtual);
                             const isPassado = dataAtual < hoje;
                             const isCheckin = checkin && dataAtual.getTime() === checkin.getTime();
                             const isCheckout = checkout && dataAtual.getTime() === checkout.getTime();
                             const isInBetween = checkin && checkout && dataAtual > checkin && dataAtual < checkout;
                             
                             let bgClass = "bg-transparent hover:bg-slate-200 text-slate-800";
                             if (isPassado) bgClass = "text-slate-300 cursor-not-allowed";
                             else if (isCheckin || isCheckout) bgClass = "bg-[#00577C] text-white shadow-md rounded-md font-black scale-110 z-10";
                             else if (isInBetween) bgClass = "bg-[#00577C]/10 text-[#00577C] rounded-none";

                             return (
                               <button 
                                 key={i} disabled={isPassado} onClick={() => handleDateClick(dataAtual)}
                                 className={`w-full aspect-square flex items-center justify-center text-xs transition-all ${bgClass}`}
                               >
                                 {i + 1}
                               </button>
                             );
                          })}
                       </div>
                    </div>
                  </div>
               </div>

               {/* Hóspedes (Simplificado para o lado) */}
               <div className="space-y-4 mb-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#00577C]">Adultos</span>
                     <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <button onClick={() => setAdultos(Math.max(1, adultos - 1))} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">-</button>
                        <span className="font-bold text-sm w-4 text-center">{adultos}</span>
                        <button onClick={() => setAdultos(adultos + 1)} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">+</button>
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#00577C]">Crianças <span className="text-[8px] text-slate-400 block -mt-1">(Até 12 anos)</span></span>
                     <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <button onClick={() => setCriancas(Math.max(0, criancas - 1))} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">-</button>
                        <span className="font-bold text-sm w-4 text-center">{criancas}</span>
                        <button onClick={() => setCriancas(criancas + 1)} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">+</button>
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#00577C]">Quartos</span>
                     <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <button onClick={() => setQuartos(Math.max(1, quartos - 1))} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">-</button>
                        <span className="font-bold text-sm w-4 text-center">{quartos}</span>
                        <button onClick={() => setQuartos(quartos + 1)} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">+</button>
                     </div>
                  </div>
               </div>

               <div className="bg-[#009640]/10 border border-[#009640]/20 rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-[#009640]">Os preços nos quartos ao lado serão atualizados automaticamente para as datas selecionadas.</p>
               </div>
            </div>

          </aside>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative h-14 w-40"><Image src="/logop.png" alt="Prefeitura" fill className="object-contain object-left" /></div>
            <div className="border-l border-slate-200 pl-4 hidden md:block">
              <p className={`${jakarta.className} text-xl font-bold text-[#00577C]`}>SagaTurismo</p>
              <p className="text-sm text-slate-500 uppercase font-bold tracking-widest text-[10px]">Portal Oficial de Turismo</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium">© {new Date().getFullYear()} · Prefeitura Municipal de São Geraldo do Araguaia</p>
        </div>
      </footer>
    </div>
  );
}