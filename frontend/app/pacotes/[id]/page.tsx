'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, MapPin, Calendar as CalendarIcon, Clock,
  CheckCircle2, Bed, Compass, Ticket, ShieldCheck,
  ChevronRight, Camera, Info, QrCode, Wallet, X, Star,
  Award, Image as ImageIcon, Smartphone, Map, UserCheck,
  ChevronLeft, ChevronRight as ChevronRightIcon, ZoomIn,
  Landmark, Check, Users, Baby, DoorOpen, Phone, Mail, Globe,
  Wind, Wifi, Bath, Maximize, Zap, CreditCard, Coffee, Edit3
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── IMAGEM DE SEGURANÇA ──
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740";

// ── UTILITÁRIOS E MATEMÁTICA ──
const parseValor = (valor: any): number => {
  if (valor === null || valor === undefined || valor === '') return 0;
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
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

// ── TIPAGENS RÍGIDAS ──
type Hotel = {
  id: string; nome: string; tipo: string; imagem_url: string; descricao: string;
  quarto_standard_nome?: string; quarto_standard_preco: any; quarto_standard_comodidades?: string[];
  quarto_luxo_nome?: string; quarto_luxo_preco: any; quarto_luxo_comodidades?: string[];
  quarto_standard_imagens?: string[]; quarto_luxo_imagens?: string[];
  galeria: string[] | string;
};
type Guia = { id: string; nome: string; preco_diaria: any; especialidade: string; imagem_url: string; descricao: string; };
type Atracao = { id: string; nome: string; preco_entrada: any; tipo: string; };
type Pacote = {
  id: string; titulo: string; descricao_curta: string; roteiro_detalhado: string;
  imagens_galeria: string[]; imagem_principal: string; dias: number; noites: number;
  horarios_info: string;
  pacote_itens: { hoteis: Hotel | null; guias: Guia | null; atracoes: Atracao | null; }[];
  avaliacoes_info?: any; politicas?: any; contatos?: any;
};
type Disponibilidade = {
  data: string; quarto_standard_preco: any; quarto_standard_disponivel: boolean;
  quarto_luxo_preco: any; quarto_luxo_disponivel: boolean;
};

// ── COMPONENTE DE CONTEÚDO ENVOLTO NO SUSPENSE ──
function PacoteDetalheContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados de Dados
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [loading, setLoading] = useState(true);
  const [disponibilidadeDb, setDisponibilidadeDb] = useState<Record<string, Disponibilidade>>({});

  const [hoteisDisponiveis, setHoteisDisponiveis] = useState<Hotel[]>([]);
  const [guiasDisponiveis, setGuiasDisponiveis] = useState<Guia[]>([]);
  const [atracoesInclusas, setAtracoesInclusas] = useState<Atracao[]>([]);

  // Seleções do Usuário
  const [hotelSelecionado, setHotelSelecionado] = useState<Hotel | null>(null);
  const [tipoQuarto, setTipoQuarto] = useState<'standard' | 'luxo'>('standard');
  const [guiaSelecionado, setGuiaSelecionado] = useState<Guia | null>(null);

  // Calendário Inteligente
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [mesAtualCalendario, setMesAtualCalendario] = useState<Date | null>(null);
  
  // Lotação
  const [adultos, setAdultos] = useState(2);
  const [criancas, setCriancas] = useState(0);
  const [quartos, setQuartos] = useState(1);

  // Galeria e UI
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imgIdxStandard, setImgIdxStandard] = useState(0);
  const [imgIdxLuxo, setImgIdxLuxo] = useState(0);

  useEffect(() => {
    setMesAtualCalendario(new Date());
    setMounted(true);
  }, []);

  // 1. Efeito de Scroll
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

  // 2. Carregar Pacote e Sincronizar URL
  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('pacotes')
          .select(`*, pacote_itens ( hoteis (*), guias (*), atracoes (*) )`)
          .eq('id', id)
          .single();

        if (error || !data) {
          router.push('/pacotes');
          return;
        }

        const pct = data as Pacote;
        setPacote(pct);

        const itens = pct.pacote_itens || [];
        const hoteis = itens.map((i: any) => i?.hoteis).filter(Boolean) as Hotel[];
        const guias = itens.map((i: any) => i?.guias).filter(Boolean) as Guia[];
        const atracoes = itens.map((i: any) => i?.atracoes).filter(Boolean) as Atracao[];

        setHoteisDisponiveis(hoteis);
        setGuiasDisponiveis(guias);
        setAtracoesInclusas(atracoes);

        if (hoteis.length > 0) setHotelSelecionado(hoteis[0]);
        if (guias.length > 0) setGuiaSelecionado(guias[0]);
      } catch (err) {
        console.error("Falha ao carregar pacote:", err);
        router.push('/pacotes');
      } finally {
        setLoading(false);
      }
    }

    // Lê parâmetros da URL
    const ci = searchParams.get('checkin');
    const co = searchParams.get('checkout');
    const ad = searchParams.get('adultos');
    const qu = searchParams.get('quartos');

    if (ci && ci !== 'null') setCheckin(new Date(ci));
    if (co && co !== 'null') setCheckout(new Date(co));
    if (ad) setAdultos(Number(ad));
    if (qu) setQuartos(Number(qu));

    if (id) fetchData();
  }, [id, router, searchParams]);

  // 3. Carregar Disponibilidade
  useEffect(() => {
    async function fetchDisp() {
      if (!hotelSelecionado) return;
      const { data } = await supabase.from('hotel_disponibilidade').select('*').eq('hotel_id', hotelSelecionado.id);
      const dispMap: Record<string, Disponibilidade> = {};
      data?.forEach((d: any) => { dispMap[d.data] = d; });
      setDisponibilidadeDb(dispMap);
    }
    fetchDisp();
  }, [hotelSelecionado]);

  // ── LÓGICA DO CALENDÁRIO ──
  const diasDoMes = (ano: number, mes: number) => new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaDoMes = (ano: number, mes: number) => new Date(ano, mes, 1).getDay();
  const formatarDataIso = (data: Date) =>
    `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

  const getPrecoDiariaHotel = (dataStr: string) => {
    const disp = disponibilidadeDb[dataStr];
    if (disp) return tipoQuarto === 'luxo' ? parseValor(disp.quarto_luxo_preco) : parseValor(disp.quarto_standard_preco);
    return hotelSelecionado ? (tipoQuarto === 'luxo' ? parseValor(hotelSelecionado.quarto_luxo_preco) : parseValor(hotelSelecionado.quarto_standard_preco)) : 0;
  };

  const isDisponivel = (dataStr: string) => {
    const disp = disponibilidadeDb[dataStr];
    if (disp) return tipoQuarto === 'luxo' ? disp.quarto_luxo_disponivel : disp.quarto_standard_disponivel;
    return true;
  };

  const handleDateClick = (data: Date) => {
    if (!checkin || (checkin && checkout)) {
      setCheckin(data);
      setCheckout(null);
    } else if (data > checkin) {
      let diaAtual = new Date(checkin);
      let reservaValida = true;
      while (diaAtual < data) {
        if (!isDisponivel(formatarDataIso(diaAtual))) {
          reservaValida = false;
          break;
        }
        diaAtual.setDate(diaAtual.getDate() + 1);
      }
      if (reservaValida) setCheckout(data);
      else {
        alert("A sua seleção inclui dias esgotados. Selecione outro período.");
        setCheckin(data);
        setCheckout(null);
      }
    } else {
      setCheckin(data);
    }
  };

  // ── MATEMÁTICA DA RESERVA ──
  let totalHospedagem = 0;
  let totalNoites = 0;
  if (checkin && checkout && checkin < checkout) {
    let dia = new Date(checkin);
    while (dia < checkout) {
      totalHospedagem += getPrecoDiariaHotel(formatarDataIso(dia));
      totalNoites++;
      dia.setDate(dia.getDate() + 1);
    }
    totalHospedagem = totalHospedagem * quartos;
  } else {
    totalNoites = 1;
    totalHospedagem = getPrecoDiariaHotel(formatarDataIso(new Date())) * quartos;
  }

  const valorGuia = guiaSelecionado ? parseValor(guiaSelecionado.preco_diaria) * (totalNoites + 1) : 0;
  const valorAtracoes = atracoesInclusas.reduce((acc, curr) => acc + parseValor(curr.preco_entrada), 0) * adultos;
  const valorTotalFinal = totalHospedagem + valorGuia + valorAtracoes;

  // ── GALERIA ──
  const galeriaCombinada = [
    ...(pacote?.imagem_principal ? [pacote.imagem_principal] : []),
    ...getArraySeguro(pacote?.imagens_galeria),
    ...getArraySeguro(hotelSelecionado?.galeria)
  ];

  const fecharGaleria = () => setFotoExpandidaIndex(null);
  const proximaFoto = (e: React.MouseEvent) => { e.stopPropagation(); setFotoExpandidaIndex((prev) => (prev! + 1) % galeriaCombinada.length); };
  const fotoAnterior = (e: React.MouseEvent) => { e.stopPropagation(); setFotoExpandidaIndex((prev) => (prev! - 1 + galeriaCombinada.length) % galeriaCombinada.length); };

  const handleReserva = () => {
    if (!checkin || !checkout) {
      alert("Por favor, selecione as datas no calendário antes de prosseguir.");
      document.getElementById('motor-reservas')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    router.push(`/checkout-pacote?pacote=${pacote?.id}&hotel=${hotelSelecionado?.id}&quarto=${tipoQuarto}&guia=${guiaSelecionado?.id}&checkin=${formatarDataIso(checkin)}&checkout=${formatarDataIso(checkout)}&adultos=${adultos}&quartos=${quartos}`);
  };

  if (!mounted || loading || !pacote || !mesAtualCalendario) return (
    <div className={`${inter.className} min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]`}>
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs">A preparar portal de reservas...</p>
    </div>
  );

  const anoCorrente = mesAtualCalendario.getFullYear();
  const mesCorrente = mesAtualCalendario.getMonth();
  const diasMes = diasDoMes(anoCorrente, mesCorrente);
  const primeiroDia = primeiroDiaDoMes(anoCorrente, mesCorrente);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Mocks de Fallback
  const imagensStandard = hotelSelecionado && getArraySeguro(hotelSelecionado.quarto_standard_imagens).length > 0 
    ? getArraySeguro(hotelSelecionado.quarto_standard_imagens) 
    : ["https://images.unsplash.com/photo-1618773928121-c32242fa11f5?q=80&w=1740", "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?q=80&w=1674"];
  const imagensLuxo = hotelSelecionado && getArraySeguro(hotelSelecionado.quarto_luxo_imagens).length > 0 
    ? getArraySeguro(hotelSelecionado.quarto_luxo_imagens) 
    : ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1740", "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1740"];

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-24 lg:pb-0`}>

      {/* ── HEADER ── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-10 w-28 md:h-16 md:w-56 shrink-0">
              <Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block text-left">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl border border-slate-200 p-2 lg:hidden text-[#00577C]">
            {isMobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
          <nav className="hidden lg:flex items-center gap-7 font-bold text-sm">
            <Link href="/pacotes" className="text-slate-600 hover:text-[#00577C]">Pacotes</Link>
            <Link href="/roteiro" className="text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-2.5 text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão Residente</Link>
          </nav>
        </div>
        {isMobileMenuOpen && (
          <div className="absolute top-[100%] left-0 w-full bg-white border-b border-slate-200 p-5 flex flex-col gap-4 shadow-xl lg:hidden text-left animate-in slide-in-from-top-4">
            <Link href="/pacotes" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Pacotes</Link>
            <Link href="/roteiro" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Rota Turística</Link>
            <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#F9C400] text-[#00577C] font-black px-4 py-3.5 rounded-xl text-center shadow-md">Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <div className="relative w-full h-[40vh] md:h-[50vh] bg-slate-900 mt-[65px] md:mt-[80px]">
        <Image src={pacote.imagem_principal || FALLBACK_IMAGE} alt={pacote.titulo || 'Pacote'} fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F5F7FA] via-transparent to-transparent" />
        <div className="absolute bottom-6 md:bottom-10 left-5 md:left-16 right-5 text-left">
          <Link href="/pacotes" className="inline-flex items-center gap-2 text-[10px] md:text-xs font-black uppercase text-white/70 mb-3 hover:text-white transition-colors">
            <ArrowLeft size={14}/> Voltar aos Pacotes
          </Link>
          <div className="flex items-center gap-2 mb-2 md:mb-3">
             <span className="bg-[#F9C400] text-[#00577C] px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-md">
               Expedição Oficial
             </span>
          </div>
          <h1 className={`${jakarta.className} text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg line-clamp-2 md:line-clamp-none`}>{pacote.titulo}</h1>
          <p className="text-white/80 font-bold flex items-center gap-2 mt-2 md:mt-3 text-xs md:text-sm">
             <MapPin size={16} className="text-[#F9C400] shrink-0"/> São Geraldo do Araguaia, Pará
          </p>
        </div>
      </div>

      {/* BARRA DE SELEÇÃO RÁPIDA (MOBILE FOCUS) */}
      <div className="sticky top-[65px] md:top-[80px] z-40 bg-white border-b border-slate-200 shadow-sm">
         <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4 overflow-x-auto text-left">
            <div className="flex items-center gap-3 shrink-0">
               <div className="bg-blue-50 p-2 rounded-lg text-[#00577C]"><CalendarIcon size={18}/></div>
               <div className="text-left leading-none">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Sua Estadia</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {checkin ? checkin.toLocaleDateString('pt-BR', {day:'2-digit', month:'short'}) : 'Escolher'} — {checkout ? checkout.toLocaleDateString('pt-BR', {day:'2-digit', month:'short'}) : 'Datas'}
                  </p>
               </div>
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex items-center gap-3 shrink-0">
               <div className="bg-green-50 p-2 rounded-lg text-[#009640]"><Users size={18}/></div>
               <div className="text-left leading-none">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Hóspedes</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">{adultos} Adultos · {quartos} Quarto</p>
               </div>
            </div>
            <button 
               onClick={() => document.getElementById('motor-reservas')?.scrollIntoView({ behavior: 'smooth' })}
               className="ml-auto bg-slate-100 p-2.5 rounded-full text-[#00577C] hover:bg-[#00577C] hover:text-white transition-all shrink-0"
            >
               <Edit3 size={18}/>
            </button>
         </div>
      </div>

      {/* ── GRID PRINCIPAL ── */}
      <div className="mx-auto w-full max-w-7xl px-4 md:px-5 py-8 md:py-12 flex flex-col lg:flex-row items-start gap-8 relative z-10">

        {/* ── COLUNA ESQUERDA ── */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-6 md:gap-8">

          {/* ROTEIRO */}
          <section className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-200 text-left">
            <div className="flex items-center gap-4 text-xs md:text-sm font-semibold text-[#00577C] mb-6 border-b border-slate-100 pb-6">
              <span className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                <Clock size={16} /> Duração: {pacote.dias} dias / {pacote.noites} noites
              </span>
            </div>

            <div className="mb-4 text-left">
              <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-6`}>Detalhes da Expedição</h3>
              <p className="text-sm md:text-base text-slate-600 italic font-medium border-l-4 border-[#F9C400] pl-4 md:pl-5 mb-6 md:mb-8 bg-slate-50 py-3 pr-3 rounded-r-xl">{pacote.descricao_curta}</p>
              <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-line text-sm md:text-base">{pacote.roteiro_detalhado}</div>
            </div>
          </section>

          {/* ── 1. ACOMODAÇÃO E QUARTOS (DESIGN OTA) ── */}
          <section className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-200 text-left overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Bed size={150}/></div>
            <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 relative z-10`}>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#00577C] text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-md">
                <Bed size={20} className="md:w-6 md:h-6" />
              </div>
              1. Acomodação Inclusa
            </h3>

            <div className="flex flex-col gap-6 relative z-10">
              {/* Seletor de Hotéis */}
              {hoteisDisponiveis.length > 1 && (
                <div className="space-y-4 mb-2 border-b border-slate-100 pb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecione o hotel desejado:</p>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {hoteisDisponiveis.map((hotel: any) => (
                      <button 
                        key={hotel.id} onClick={() => setHotelSelecionado(hotel)}
                        className={`px-4 md:px-5 py-2.5 md:py-3 rounded-xl border-2 font-bold text-xs md:text-sm transition-colors ${hotelSelecionado?.id === hotel.id ? 'border-[#00577C] bg-blue-50/50 text-[#00577C]' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                      >
                        {hotel.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cards de Quartos (OTA) */}
              {hotelSelecionado && (
                <div className="flex flex-col gap-6 md:gap-8">
                  <h4 className={`${jakarta.className} text-lg md:text-xl font-bold text-slate-800`}>Acomodações no {hotelSelecionado.nome}</h4>
                  
                  {/* Quarto Standard */}
                  <div className={`border-2 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm flex flex-col transition-all cursor-pointer ${tipoQuarto === 'standard' ? 'border-[#00577C] ring-4 ring-blue-50/50' : 'border-slate-200 hover:border-[#00577C]/30 bg-slate-50/50'}`} onClick={() => setTipoQuarto('standard')}>
                     <div className="flex justify-between items-center p-4 md:p-5 bg-white border-b border-slate-100">
                        <h4 className={`${jakarta.className} font-bold text-base md:text-lg text-[#00577C]`}>{hotelSelecionado.quarto_standard_nome || 'Quarto Standard'}</h4>
                        <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center ${tipoQuarto === 'standard' ? 'border-[#00577C] bg-[#00577C]' : 'border-slate-300'}`}>
                           {tipoQuarto === 'standard' && <Check size={12} className="text-white md:w-3.5 md:h-3.5" strokeWidth={4} />}
                        </div>
                     </div>
                     <div className="flex flex-col xl:flex-row bg-white">
                        <div className="w-full xl:w-2/5 p-4 md:p-5 border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col">
                           <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 group">
                              <Image src={imagensStandard[imgIdxStandard]} alt="Standard" fill className="object-cover" />
                              <button onClick={(e) => { e.stopPropagation(); setImgIdxStandard((prev) => (prev - 1 + imagensStandard.length) % imagensStandard.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 md:w-8 md:h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-70 md:opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={16}/></button>
                              <button onClick={(e) => { e.stopPropagation(); setImgIdxStandard((prev) => (prev + 1) % imagensStandard.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 md:w-8 md:h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-70 md:opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRightIcon size={16}/></button>
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><ImageIcon size={10}/> {imagensStandard.length}</div>
                           </div>
                           <div className="grid grid-cols-2 gap-2 md:gap-3 text-[10px] md:text-xs text-slate-600 font-medium mt-auto">
                              <span className="flex items-center gap-1.5"><Wind size={12} className="md:w-3.5 md:h-3.5"/> Ar-condicionado</span>
                              <span className="flex items-center gap-1.5"><Wifi size={12} className="md:w-3.5 md:h-3.5"/> Wi-Fi Grátis</span>
                              <span className="flex items-center gap-1.5"><Bath size={12} className="md:w-3.5 md:h-3.5"/> Banheiro Priv.</span>
                           </div>
                        </div>
                        
                        <div className="w-full xl:w-3/5 flex flex-col sm:flex-row">
                           <div className="flex-1 p-4 md:p-5 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col justify-center">
                              <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Resumo da Inclusão</p>
                              <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                                 <li className="flex items-start gap-2 text-xs md:text-sm text-[#009640] font-bold"><CheckCircle2 size={16} className="shrink-0 mt-0.5 md:w-4 md:h-4" /> Cancelamento grátis (24h)</li>
                                 <li className="flex items-start gap-2 text-xs md:text-sm text-[#00577C] font-bold"><Zap size={16} className="shrink-0 mt-0.5 md:w-4 md:h-4" /> Confirmação Imediata</li>
                              </ul>
                           </div>
                           <div className="w-full sm:w-48 p-4 md:p-5 flex flex-col items-center sm:items-end justify-center bg-slate-50/50">
                              <div className="mt-auto text-center sm:text-right w-full">
                                <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Custo da Estadia</p>
                                <p className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 leading-none`}>{formatarMoeda(parseValor(hotelSelecionado.quarto_standard_preco) * noitesReserva * quartos)}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Quarto Luxo */}
                  <div className={`border-2 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm flex flex-col relative transition-all cursor-pointer ${tipoQuarto === 'luxo' ? 'border-[#F9C400] ring-4 ring-yellow-50/50' : 'border-slate-200 hover:border-[#F9C400]/50 bg-slate-50/50'}`} onClick={() => setTipoQuarto('luxo')}>
                     <div className="absolute top-0 right-0 bg-[#00577C] text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-1.5 rounded-bl-xl shadow-sm z-10 flex items-center gap-1.5">
                        <Award size={12} className="md:w-3.5 md:h-3.5"/> Premium
                     </div>
                     <div className="flex justify-between items-center p-4 md:p-5 bg-white border-b border-slate-100">
                        <h4 className={`${jakarta.className} font-bold text-base md:text-lg text-[#00577C]`}>{hotelSelecionado.quarto_luxo_nome || 'Suíte Luxo Premium'}</h4>
                        <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center ${tipoQuarto === 'luxo' ? 'border-[#F9C400] bg-[#F9C400]' : 'border-slate-300'}`}>
                           {tipoQuarto === 'luxo' && <Check size={12} className="text-white md:w-3.5 md:h-3.5" strokeWidth={4} />}
                        </div>
                     </div>
                     <div className="flex flex-col xl:flex-row bg-white">
                        <div className="w-full xl:w-2/5 p-4 md:p-5 border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col">
                           <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 group">
                              <Image src={imagensLuxo[imgIdxLuxo]} alt="Quarto Luxo" fill className="object-cover" />
                              <button onClick={(e) => { e.stopPropagation(); setImgIdxLuxo((prev) => (prev - 1 + imagensLuxo.length) % imagensLuxo.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 md:w-8 md:h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-70 md:opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={16}/></button>
                              <button onClick={(e) => { e.stopPropagation(); setImgIdxLuxo((prev) => (prev + 1) % imagensLuxo.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 md:w-8 md:h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-70 md:opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRightIcon size={16}/></button>
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><ImageIcon size={10}/> {imagensLuxo.length}</div>
                           </div>
                           <div className="grid grid-cols-2 gap-2 md:gap-3 text-[10px] md:text-xs text-slate-600 font-medium mt-auto">
                              <span className="flex items-center gap-1.5"><Wind size={12} className="md:w-3.5 md:h-3.5"/> Ar-condicionado</span>
                              <span className="flex items-center gap-1.5"><Wifi size={12} className="md:w-3.5 md:h-3.5"/> Wi-Fi Grátis</span>
                              <span className="flex items-center gap-1.5"><Bath size={12} className="md:w-3.5 md:h-3.5"/> Banheira/Spa</span>
                           </div>
                        </div>
                        
                        <div className="w-full xl:w-3/5 flex flex-col sm:flex-row">
                           <div className="flex-1 p-4 md:p-5 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col justify-center">
                              <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Resumo da Inclusão</p>
                              <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                                 <li className="flex items-start gap-2 text-xs md:text-sm text-[#009640] font-bold"><CheckCircle2 size={16} className="shrink-0 mt-0.5 md:w-4 md:h-4" /> Cancelamento grátis (24h)</li>
                                 <li className="flex items-start gap-2 text-xs md:text-sm text-[#00577C] font-bold"><Coffee size={16} className="shrink-0 mt-0.5 md:w-4 md:h-4" /> Pequeno-almoço incluso</li>
                              </ul>
                           </div>
                           <div className="w-full sm:w-48 p-4 md:p-5 flex flex-col items-center sm:items-end justify-center bg-blue-50/10">
                              <div className="mt-auto text-center sm:text-right w-full">
                                <p className="text-[9px] md:text-[10px] font-black uppercase text-[#00577C] tracking-widest mb-1">Custo da Estadia</p>
                                <p className={`${jakarta.className} text-2xl md:text-3xl font-black text-[#00577C] leading-none`}>{formatarMoeda(parseValor(hotelSelecionado.quarto_luxo_preco) * noitesReserva * quartos)}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── 2. GUIA OFICIAL ── */}
          <section className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-200 text-left">
            <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-8 flex items-center gap-3`}>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#009640] text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-md">
                <UserCheck size={20} className="md:w-6 md:h-6" />
              </div>
              2. Guia Oficial
            </h3>

            <div className="flex flex-col gap-4">
              {guiasDisponiveis.map((guia: any) => {
                const selected = guiaSelecionado?.id === guia.id;
                return (
                  <label
                    key={guia.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 bg-white rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all cursor-pointer gap-4 ${selected ? 'border-[#009640] shadow-md ring-4 ring-green-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="flex items-center gap-4 md:gap-5 text-left">
                      <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-slate-100 shrink-0">
                        <Image src={guia.imagem_url || FALLBACK_IMAGE} alt={guia.nome} fill className="object-cover" />
                      </div>
                      <div>
                        <p className={`${jakarta.className} font-bold text-base md:text-lg text-slate-800 leading-tight mb-1`}>{guia.nome}</p>
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 flex items-center gap-1.5 text-left uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#009640]" />{guia.especialidade}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-left sm:text-right">Custo Serviço</p>
                        <p className={`${jakarta.className} text-lg md:text-xl font-black text-slate-900`}>{formatarMoeda(parseValor(guia.preco_diaria) * (noitesReserva + 1))}</p>
                      </div>
                      <div className={`w-5 h-5 md:w-6 md:h-6 shrink-0 rounded-full border-2 flex items-center justify-center ${selected ? 'border-[#009640] bg-[#009640]' : 'border-slate-300'}`}>
                         {selected && <Check size={12} className="text-white md:w-3.5 md:h-3.5" strokeWidth={4} />}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* ── 3. AVALIAÇÕES E POLÍTICAS (Preservados do design anterior, adaptados mobile) ── */}
          <section className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm p-6 md:p-10 text-left">
             <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-6 md:mb-8`}>Políticas do Pacote Oficial</h3>
             <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-x-8 gap-y-5 text-sm">
                <div className="font-black text-slate-800">Cancelamento</div>
                <div className="text-slate-600 font-medium">Reembolso integral se cancelado até 48 horas antes da data de check-in programada.</div>
                <div className="md:col-span-2 h-px bg-slate-100 my-1 md:my-2"></div>
                <div className="font-black text-slate-800">Inclusões</div>
                <div className="text-slate-600 font-medium">O pacote inclui os custos do guia diário, do quarto de hotel selecionado e as entradas nos parques.</div>
                <div className="md:col-span-2 h-px bg-slate-100 my-1 md:my-2"></div>
                <div className="font-black text-slate-800">Clima e Segurança</div>
                <div className="text-slate-600 font-medium">O roteiro pode sofrer alterações de ordem sem aviso prévio caso as condições climáticas não garantam a segurança.</div>
             </div>
          </section>

        </div>

        {/* ── COLUNA DIREITA — MOTOR DE RESERVAS (ESTÁTICO) ── */}
        <div id="motor-reservas" className="w-full lg:w-[400px] shrink-0 lg:self-start text-left relative z-40">
          
          {/* NOTA: Mantém o "space-y-6", mas removemos o "hidden lg:block" para o calendário aparecer no Mobile! */}
          <aside className="w-full space-y-6 h-fit">

            <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">

              <div className="border-b border-slate-100 pb-5 mb-5 text-center bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-1">Valor Total Estimado</p>
                <div className="flex items-end justify-center gap-2">
                  <p className={`${jakarta.className} text-3xl md:text-4xl font-black text-[#009640]`}>{formatarMoeda(valorTotalFinal)}</p>
                </div>
              </div>

              {/* CALENDÁRIO INLINE */}
              <div className="mb-6 md:mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-3 md:mb-4">Selecione as Datas</p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl md:rounded-[2rem] p-4 md:p-5 shadow-inner">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente - 1))} className="p-1 md:p-2 hover:bg-slate-200 rounded-full transition-colors"><ChevronLeft size={18} className="md:w-5 md:h-5" /></button>
                    <p className="font-bold text-slate-800 capitalize text-xs md:text-sm">{mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                    <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente + 1))} className="p-1 md:p-2 hover:bg-slate-200 rounded-full transition-colors"><ChevronRight size={18} className="md:w-5 md:h-5" /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-1 md:mb-2">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="text-[9px] md:text-[10px] font-black text-slate-400">{d}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-y-0.5 md:gap-y-1 gap-x-0">
                    {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: diasMes }).map((_, i) => {
                      const dia = i + 1;
                      const dataAtual = new Date(anoCorrente, mesCorrente, dia);
                      const dataStr = formatarDataIso(dataAtual);
                      const isPassado = dataAtual < hoje;
                      const disponivel = !isPassado && isDisponivel(dataStr);
                      const isCheckin = checkin && dataAtual.getTime() === checkin.getTime();
                      const isCheckout = checkout && dataAtual.getTime() === checkout.getTime();
                      const isInBetween = checkin && checkout && dataAtual > checkin && dataAtual < checkout;
                      const isHovered = hoverDate && checkin && !checkout && dataAtual > checkin && dataAtual <= hoverDate;

                      let bgClass = "bg-transparent hover:bg-slate-200 text-slate-800";
                      if (isPassado || !disponivel) bgClass = "bg-transparent text-slate-300 cursor-not-allowed line-through";
                      else if (isCheckin || isCheckout) bgClass = "bg-[#00577C] text-white shadow-md rounded-md md:rounded-lg scale-105 z-10";
                      else if (isInBetween || isHovered) bgClass = "bg-[#00577C]/10 text-[#00577C] rounded-none";

                      return (
                        <button
                          key={dia} disabled={isPassado || !disponivel} onClick={() => handleDateClick(dataAtual)}
                          onMouseEnter={() => disponivel && setHoverDate(dataAtual)} onMouseLeave={() => setHoverDate(null)}
                          className={`w-full aspect-square flex flex-col items-center justify-center transition-all ${bgClass}`}
                        >
                          <span className={`text-[10px] md:text-sm ${isCheckin || isCheckout ? 'font-black' : 'font-semibold'}`}>{dia}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RESUMO DOS VALORES */}
              <div className="space-y-2.5 md:space-y-3 mb-6 md:mb-8 text-xs md:text-sm font-semibold border-t border-slate-100 pt-5 md:pt-6">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-2"><Bed size={14} className="text-[#00577C] shrink-0" /> Hospedagem ({noitesReserva} nts)</span>
                  <span className="text-slate-800 tabular-nums">{formatarMoeda(totalHospedagem)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-2"><Compass size={14} className="text-[#009640] shrink-0" /> Guia de Turismo</span>
                  <span className="text-slate-800 tabular-nums">{formatarMoeda(valorGuia)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-2"><Ticket size={14} className="text-[#F9C400] shrink-0" /> Entradas e Taxas</span>
                  <span className="text-slate-800 tabular-nums">{formatarMoeda(valorAtracoes)}</span>
                </div>
              </div>

              <button
                onClick={handleReserva}
                className={`${jakarta.className} hidden lg:flex items-center justify-center gap-3 w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg transition-transform hover:-translate-y-1 shadow-xl`}
              >
                Prosseguir para Checkout <ChevronRightIcon size={18} className="md:w-5 md:h-5" />
              </button>

              <p className="hidden lg:flex mt-4 text-center text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest items-center justify-center gap-1.5">
                <ShieldCheck size={12} className="text-[#00577C] md:w-3.5 md:h-3.5" /> Plataforma Oficial SagaTurismo
              </p>
            </div>

          </aside>
        </div>
      </div>

      {/* ── GALERIA ── */}
      {galeriaCombinada.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-4 md:px-5 pb-16 md:pb-20 relative z-10 text-left md:-mt-6">
          <section className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-sm md:shadow-xl border border-slate-100">
            <h3 className={`${jakarta.className} text-xl md:text-3xl font-black text-slate-900 mb-6 md:mb-8`}>Galeria de Imagens</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
              {galeriaCombinada.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setFotoExpandidaIndex(idx)}
                  className="relative aspect-square rounded-xl md:rounded-2xl overflow-hidden shadow-sm md:shadow-md group bg-slate-200 cursor-pointer"
                >
                  <Image src={url} alt={`Foto Galeria ${idx + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-[#00577C]/0 group-hover:bg-[#00577C]/40 transition-colors duration-300 flex items-center justify-center">
                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-8 h-8 md:w-10 md:h-10 scale-50 group-hover:scale-100" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── LIGHTBOX ── */}
      {fotoExpandidaIndex !== null && galeriaCombinada.length > 0 && (
        <div
          className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 md:p-5 animate-in fade-in duration-200"
          onClick={fecharGaleria}
        >
          <button onClick={fecharGaleria} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
            <X size={20} className="md:w-6 md:h-6" />
          </button>
          <button onClick={fotoAnterior} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-2 md:p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
            <ChevronLeft size={24} className="md:w-8 md:h-8" />
          </button>
          <div
            className="relative w-full max-w-6xl aspect-video rounded-lg md:rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image src={galeriaCombinada[fotoExpandidaIndex]} alt={`Visualização ${fotoExpandidaIndex + 1}`} fill className="object-contain" />
          </div>
          <button onClick={proximaFoto} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-2 md:p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
            <ChevronRight size={24} className="md:w-8 md:h-8" />
          </button>
          <div className="absolute bottom-6 md:bottom-10 left-0 right-0 text-center pointer-events-none">
            <p className="text-white font-bold tracking-widest text-xs md:text-sm bg-black/60 inline-block px-4 md:px-5 py-1.5 md:py-2 rounded-full backdrop-blur-sm">
              {fotoExpandidaIndex + 1} de {galeriaCombinada.length}
            </p>
          </div>
        </div>
      )}

      {/* ── BARRA DE AÇÃO MOBILE (STICKY BOTTOM) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 p-4 lg:hidden shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
         <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div className="text-left">
               <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Total do Pacote</p>
               <p className={`${jakarta.className} text-xl font-black text-[#009640] tabular-nums leading-none`}>{formatarMoeda(valorTotalFinal)}</p>
            </div>
            <button onClick={handleReserva} className="bg-[#00577C] text-white px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2">
               Reservar <ArrowRight size={14}/>
            </button>
         </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="py-10 md:py-20 px-5 border-t border-slate-200 bg-white text-left mt-6 md:mt-10 mb-16 lg:mb-0">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <Image src="/logop.png" alt="SGA" width={120} height={40} className="object-contain opacity-40 grayscale md:w-[140px] md:h-[50px]" />
            <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed text-center md:text-right">
              © 2026 Secretaria Municipal de Turismo - SGA <br/> Portal Oficial de Turismo e Reservas
            </p>
         </div>
      </footer>
    </main>
  );
}

// ── EXPORT COM SUSPENSE ──
export default function PacoteDetalhePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#00577C]" size={48} /></div>}>
      <PacoteDetalheContent />
    </Suspense>
  );
}