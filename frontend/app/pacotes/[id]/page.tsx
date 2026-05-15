'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, MapPin, Calendar as CalendarIcon, Clock,
  CheckCircle2, Bed, Compass, Ticket, ShieldCheck,
  ChevronRight, Camera, Info, QrCode, Wallet, X, Star,
  Award, Image as ImageIcon, Smartphone, Map, UserCheck,
  ChevronLeft, ChevronRight as ChevronRightIcon, ZoomIn,
  Landmark, Check, Users, Baby, DoorOpen, Phone, Mail, Globe,
  Wind, Wifi, Bath, Maximize, Zap, CreditCard, Coffee
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

export default function PacoteDetalhePage() {
  const { id } = useParams();
  const router = useRouter();

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

  // Galeria e UI
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
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

  // 2. Carregar Pacote
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
    if (id) fetchData();
  }, [id, router]);

  // 3. Carregar Disponibilidade
  useEffect(() => {
    async function fetchDisp() {
      if (!hotelSelecionado) return;
      const { data } = await supabase.from('hotel_disponibilidade').select('*').eq('hotel_id', hotelSelecionado.id);
      const dispMap: Record<string, Disponibilidade> = {};
      data?.forEach((d: any) => { dispMap[d.data] = d; });
      setDisponibilidadeDb(dispMap);
      setCheckin(null);
      setCheckout(null);
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
  } else {
    totalNoites = 1;
    totalHospedagem = getPrecoDiariaHotel(formatarDataIso(new Date()));
  }

  const valorGuia = guiaSelecionado ? parseValor(guiaSelecionado.preco_diaria) : 0;
  const valorAtracoes = atracoesInclusas.reduce((acc, curr) => acc + parseValor(curr.preco_entrada), 0);
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
    if (!checkin || !checkout) return alert("Por favor, selecione Check-in e Check-out no calendário antes de prosseguir.");
    router.push(`/checkout?pacote=${pacote?.id}&hotel=${hotelSelecionado?.id}&quarto=${tipoQuarto}&guia=${guiaSelecionado?.id}&checkin=${formatarDataIso(checkin)}&checkout=${formatarDataIso(checkout)}`);
  };

  if (!mounted || loading || !pacote || !mesAtualCalendario) return (
    <div className={`${inter.className} min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]`}>
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-xs">A preparar portal de reservas...</p>
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
    <div className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 flex flex-col`}>

      {/* ── HEADER ── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56">
              <Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block text-left">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex font-bold">
            <Link href="/pacotes" className="text-sm text-slate-600 hover:text-[#00577C]">Pacotes</Link>
            <Link href="/roteiro" className="text-sm text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão Residente</Link>
          </nav>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <div className="w-full h-[40vh] md:h-[50vh] relative bg-[#002f40] mt-[70px] md:mt-[90px]">
        <Link href="/pacotes" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 px-4 py-2 rounded-full shadow-lg transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <Image src={pacote.imagem_principal || FALLBACK_IMAGE} alt={pacote.titulo || 'Pacote'} fill className="object-cover opacity-70" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        <div className="absolute bottom-10 left-6 md:left-16 z-20 text-left">
          <div className="flex items-center gap-2 mb-3">
             <span className="bg-[#F9C400] text-[#00577C] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">
               Expedição Oficial
             </span>
          </div>
          <h1 className={`${jakarta.className} text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg`}>{pacote.titulo}</h1>
          <p className="text-white/80 font-medium flex items-center gap-2 mt-3 text-sm">
             <MapPin size={16} className="text-[#009640]"/> São Geraldo do Araguaia, Pará
          </p>
        </div>
      </div>

      {/* ── GRID PRINCIPAL ── */}
      <div className="mx-auto w-full max-w-7xl px-5 py-12 flex flex-col lg:flex-row items-start gap-8 relative z-10 -mt-16">

        {/* ── COLUNA ESQUERDA ── */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-8">

          {/* Info Principal */}
          <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 text-left">
            <div className="flex items-center gap-6 text-sm font-semibold text-slate-500 mb-8 border-b border-slate-100 pb-8">
              <span className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-[#00577C]" /> Duração: {pacote.dias} dias / {pacote.noites} noites
              </span>
            </div>

            <div className="mb-6 text-left">
              <h3 className={`${jakarta.className} text-2xl font-black text-[#00577C] mb-6`}>Sobre o Roteiro</h3>
              <p className="text-lg text-slate-500 italic font-medium border-l-4 border-[#F9C400] pl-5 mb-8">{pacote.descricao_curta}</p>
              <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">{pacote.roteiro_detalhado}</div>
            </div>
          </section>

          {/* ── 1. ACOMODAÇÃO E QUARTOS (DESIGN OTA) ── */}
          <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 text-left overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Bed size={150}/></div>
            <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-10 flex items-center gap-4 relative z-10`}>
              <div className="w-12 h-12 bg-[#00577C] text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Bed size={24} />
              </div>
              1. Acomodação Inclusa
            </h3>

            <div className="flex flex-col gap-8 relative z-10">
              {/* Seletor de Hotéis (se houver mais de um) */}
              {hoteisDisponiveis.length > 1 && (
                <div className="space-y-4 mb-4 border-b border-slate-100 pb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecione o hotel desejado:</p>
                  <div className="flex flex-wrap gap-3">
                    {hoteisDisponiveis.map((hotel: any) => (
                      <button 
                        key={hotel.id} onClick={() => setHotelSelecionado(hotel)}
                        className={`px-5 py-3 rounded-xl border-2 font-bold text-sm transition-colors ${hotelSelecionado?.id === hotel.id ? 'border-[#00577C] bg-blue-50/50 text-[#00577C]' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                      >
                        {hotel.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cards de Quartos (OTA) */}
              {hotelSelecionado && (
                <div className="flex flex-col gap-8">
                  <h4 className={`${jakarta.className} text-xl font-bold text-slate-800`}>Acomodações no {hotelSelecionado.nome}</h4>
                  
                  {/* Quarto Standard */}
                  <div className={`border-2 rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all cursor-pointer ${tipoQuarto === 'standard' ? 'border-[#00577C] ring-4 ring-blue-50/50' : 'border-slate-200 hover:border-[#00577C]/30 bg-slate-50/50'}`} onClick={() => setTipoQuarto('standard')}>
                     <div className="flex justify-between items-center p-5 bg-white border-b border-slate-100">
                        <h4 className={`${jakarta.className} font-bold text-lg text-[#00577C]`}>{hotelSelecionado.quarto_standard_nome || 'Quarto Standard'}</h4>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${tipoQuarto === 'standard' ? 'border-[#00577C] bg-[#00577C]' : 'border-slate-300'}`}>
                           {tipoQuarto === 'standard' && <Check size={14} className="text-white" strokeWidth={4} />}
                        </div>
                     </div>
                     <div className="flex flex-col xl:flex-row bg-white">
                        <div className="w-full xl:w-2/5 p-5 border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col">
                           <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 group">
                              <Image src={imagensStandard[imgIdxStandard]} alt="Standard" fill className="object-cover" />
                              <button onClick={(e) => { e.stopPropagation(); setImgIdxStandard((prev) => (prev - 1 + imagensStandard.length) % imagensStandard.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={16}/></button>
                              <button onClick={(e) => { e.stopPropagation(); setImgIdxStandard((prev) => (prev + 1) % imagensStandard.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRightIcon size={16}/></button>
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><ImageIcon size={10}/> {imagensStandard.length}</div>
                           </div>
                           <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 font-medium mt-auto">
                              <span className="flex items-center gap-1.5"><Wind size={14}/> Ar-condicionado</span>
                              <span className="flex items-center gap-1.5"><Wifi size={14}/> Wi-Fi Grátis</span>
                              <span className="flex items-center gap-1.5"><Bath size={14}/> Banheiro Priv.</span>
                              <span className="flex items-center gap-1.5"><Maximize size={14}/> 20 m²</span>
                           </div>
                        </div>
                        <div className="w-full xl:w-3/5 p-5 flex flex-col justify-center bg-slate-50/30">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Resumo da Inclusão</p>
                           <ul className="space-y-3 mb-6">
                              <li className="flex items-start gap-2 text-sm text-[#009640] font-bold"><CheckCircle2 size={16} className="shrink-0 mt-0.5" /> Cancelamento grátis até 24h antes</li>
                              <li className="flex items-start gap-2 text-sm text-[#00577C] font-bold"><Zap size={16} className="shrink-0 mt-0.5" /> Confirmação Imediata</li>
                           </ul>
                           <div className="mt-auto">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço Base (Noite)</p>
                             <p className={`${jakarta.className} text-2xl font-black text-slate-900 leading-none`}>{formatarMoeda(parseValor(hotelSelecionado.quarto_standard_preco))}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Quarto Luxo */}
                  <div className={`border-2 rounded-2xl overflow-hidden shadow-sm flex flex-col relative transition-all cursor-pointer ${tipoQuarto === 'luxo' ? 'border-[#F9C400] ring-4 ring-yellow-50/50' : 'border-slate-200 hover:border-[#F9C400]/50 bg-slate-50/50'}`} onClick={() => setTipoQuarto('luxo')}>
                     <div className="absolute top-0 right-0 bg-[#00577C] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-sm z-10 flex items-center gap-1.5">
                        <Award size={14}/> Experiência Premium
                     </div>
                     <div className="flex justify-between items-center p-5 bg-white border-b border-slate-100">
                        <h4 className={`${jakarta.className} font-bold text-lg text-[#00577C]`}>{hotelSelecionado.quarto_luxo_nome || 'Suíte Luxo'}</h4>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${tipoQuarto === 'luxo' ? 'border-[#F9C400] bg-[#F9C400]' : 'border-slate-300'}`}>
                           {tipoQuarto === 'luxo' && <Check size={14} className="text-white" strokeWidth={4} />}
                        </div>
                     </div>
                     <div className="flex flex-col xl:flex-row bg-white">
                        <div className="w-full xl:w-2/5 p-5 border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col">
                           <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 group">
                              <Image src={imagensLuxo[imgIdxLuxo]} alt="Luxo" fill className="object-cover" />
                              <button onClick={(e) => { e.stopPropagation(); setImgIdxLuxo((prev) => (prev - 1 + imagensLuxo.length) % imagensLuxo.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={16}/></button>
                              <button onClick={(e) => { e.stopPropagation(); setImgIdxLuxo((prev) => (prev + 1) % imagensLuxo.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRightIcon size={16}/></button>
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><ImageIcon size={10}/> {imagensLuxo.length}</div>
                           </div>
                           <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 font-medium mt-auto">
                              <span className="flex items-center gap-1.5"><Wind size={14}/> Ar-condicionado</span>
                              <span className="flex items-center gap-1.5"><Wifi size={14}/> Wi-Fi Grátis</span>
                              <span className="flex items-center gap-1.5"><Bath size={14}/> Banheira/Spa</span>
                              <span className="flex items-center gap-1.5"><Maximize size={14}/> 35 m²</span>
                           </div>
                        </div>
                        <div className="w-full xl:w-3/5 p-5 flex flex-col justify-center bg-blue-50/10">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Resumo da Inclusão</p>
                           <ul className="space-y-3 mb-6">
                              <li className="flex items-start gap-2 text-sm text-[#009640] font-bold"><CheckCircle2 size={16} className="shrink-0 mt-0.5" /> Cancelamento grátis até 24h antes</li>
                              <li className="flex items-start gap-2 text-sm text-[#00577C] font-bold"><Coffee size={16} className="shrink-0 mt-0.5" /> Pequeno-almoço Premium Incluído</li>
                           </ul>
                           <div className="mt-auto">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço Base (Noite)</p>
                             <p className={`${jakarta.className} text-2xl font-black text-[#00577C] leading-none`}>{formatarMoeda(parseValor(hotelSelecionado.quarto_luxo_preco))}</p>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── 2. GUIA OFICIAL ── */}
          <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 text-left">
            <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-10 flex items-center gap-4`}>
              <div className="w-12 h-12 bg-[#009640] text-white rounded-2xl flex items-center justify-center shadow-lg">
                <UserCheck size={24} />
              </div>
              2. Guia Oficial Credenciado
            </h3>

            <div className="flex flex-col gap-4">
              {guiasDisponiveis.map((guia: any) => {
                const selected = guiaSelecionado?.id === guia.id;
                return (
                  <label
                    key={guia.id}
                    className={`flex items-center justify-between p-6 bg-white rounded-[2rem] border-2 transition-all cursor-pointer ${selected ? 'border-[#009640] shadow-lg ring-4 ring-green-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="flex items-center gap-5 text-left">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-slate-100 shrink-0">
                        <Image src={guia.imagem_url || FALLBACK_IMAGE} alt={guia.nome} fill className="object-cover" />
                      </div>
                      <div>
                        <p className={`${jakarta.className} font-black text-lg text-slate-800 mb-1`}>{guia.nome}</p>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-2 text-left">
                          <span className="w-2 h-2 rounded-full bg-[#009640]" />{guia.especialidade}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Diária</p>
                        <p className={`${jakarta.className} text-xl font-black text-slate-900`}>{formatarMoeda(parseValor(guia.preco_diaria))}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected ? 'border-[#009640] bg-[#009640]' : 'border-slate-300'}`}>
                         {selected && <Check size={14} className="text-white" strokeWidth={4} />}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* ── 3. AVALIAÇÕES (MOCK/FUTURO DB) ── */}
          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 md:p-12 text-left">
             <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-8`}>Avaliações dos hóspedes</h3>
             <div className="flex flex-col lg:flex-row gap-10">
                <div className="w-full lg:w-1/3">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="bg-[#00577C] text-white text-3xl font-black rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm w-16 h-14 flex items-center justify-center shadow-lg">
                         {pacote.avaliacoes_info?.nota || 9.5}
                      </div>
                      <div>
                         <p className={`${jakarta.className} text-lg font-black text-[#00577C] leading-tight`}>{pacote.avaliacoes_info?.texto || 'Excecional'}</p>
                         <p className="text-xs text-slate-500 font-bold">{pacote.avaliacoes_info?.total || 42} avaliações verificadas</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      {[
                        { label: 'Roteiro', score: 9.8 },
                        { label: 'Guias', score: 9.9 },
                        { label: 'Acomodação', score: 9.2 },
                        { label: 'Custo-benefício', score: 9.0 }
                      ].map(item => (
                         <div key={item.label}>
                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                               <span>{item.label}</span><span className="text-[#00577C]">{item.score.toFixed(1)}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                               <div className="bg-[#00577C] h-1.5 rounded-full" style={{ width: `${(item.score / 10) * 100}%` }}></div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
                <div className="w-full lg:w-2/3">
                   <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-6">
                         <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#00577C] font-black text-xs">J</div>
                            <div>
                               <p className="text-sm font-bold text-slate-800 leading-none">João Pedro</p>
                               <p className="text-[10px] text-slate-400 mt-1">Viajou em Junho 2026</p>
                            </div>
                         </div>
                         <p className="text-sm text-slate-600 font-medium leading-relaxed">"Pacote incrivelmente bem organizado. O guia conhecia todos os segredos da Serra das Andorinhas. O hotel selecionado era super confortável."</p>
                      </div>
                      <div>
                         <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-[#d9a000] font-black text-xs">A</div>
                            <div>
                               <p className="text-sm font-bold text-slate-800 leading-none">Ana Costa</p>
                               <p className="text-[10px] text-slate-400 mt-1">Viajou em Maio 2026</p>
                            </div>
                         </div>
                         <p className="text-sm text-slate-600 font-medium leading-relaxed">"Valeu cada cêntimo. Tudo incluído, desde a entrada no parque até ao hotel. A paisagem do Rio Araguaia é algo que todos deveriam ver uma vez na vida."</p>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* 4. POLÍTICAS DO PACOTE */}
          <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 md:p-10 text-left">
             <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-8`}>Políticas do Pacote Oficial</h3>
             <div className="grid md:grid-cols-[1fr_2fr] gap-x-8 gap-y-6 text-sm">
                <div className="font-black text-slate-800">Cancelamento</div>
                <div className="text-slate-600 font-medium">Reembolso integral se cancelado até 48 horas antes da data de check-in programada.</div>
                <div className="col-span-1 md:col-span-2 h-px bg-slate-100 my-2"></div>
                <div className="font-black text-slate-800">Inclusões</div>
                <div className="text-slate-600 font-medium">O pacote inclui os custos do guia diário, do quarto de hotel selecionado e as entradas nos parques mencionados no roteiro. Alimentação extra não incluída.</div>
                <div className="col-span-1 md:col-span-2 h-px bg-slate-100 my-2"></div>
                <div className="font-black text-slate-800">Clima e Segurança</div>
                <div className="text-slate-600 font-medium">O roteiro pode sofrer alterações de ordem sem aviso prévio caso as condições climáticas não garantam a segurança do grupo.</div>
             </div>
          </section>

          {/* 5. CONTACTOS DA SEMTUR */}
          <section className="bg-[#002f40] rounded-[2rem] border border-[#00577C] shadow-xl p-8 md:p-10 text-white relative overflow-hidden text-left mb-10">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Globe size={150}/></div>
             <h3 className={`${jakarta.className} text-2xl font-black mb-2 relative z-10`}>Apoio ao Turista</h3>
             <p className="text-white/70 text-sm font-medium mb-8 relative z-10">Dúvidas sobre o roteiro? Fale com a Secretaria de Turismo.</p>
             <div className="grid sm:grid-cols-3 gap-6 relative z-10">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
                   <Phone className="text-[#F9C400] mb-3" size={24}/>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Telefone / WhatsApp</p>
                   <p className="font-bold">+55 (94) 98145-2067</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
                   <Mail className="text-[#F9C400] mb-3" size={24}/>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">E-mail</p>
                   <p className="font-bold break-all">setursaga@gmail.com</p>
                </div>
             </div>
          </section>
        </div>

        {/* ── COLUNA DIREITA — MOTOR DE RESERVAS (STICKY) ── */}
        <div className="w-full lg:w-[420px] shrink-0 lg:self-start text-left relative z-40">
          <aside className="lg:sticky lg:top-32 space-y-6">

            <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">

              <div className="border-b border-slate-100 pb-6 mb-6 text-center bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-1">Valor Total Estimado</p>
                <div className="flex items-end justify-center gap-2">
                  <p className={`${jakarta.className} text-4xl font-black text-[#009640]`}>{formatarMoeda(valorTotalFinal)}</p>
                </div>
              </div>

              {/* CALENDÁRIO INLINE NO MOTOR DE RESERVAS */}
              <div className="mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-4">Selecione as Datas</p>
                <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-5 shadow-inner">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente - 1))} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                    <p className="font-bold text-slate-800 capitalize text-sm">{mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                    <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente + 1))} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ChevronRight size={20} /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="text-[10px] font-black text-slate-400">{d}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-y-1 gap-x-0">
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
                      else if (isCheckin || isCheckout) bgClass = "bg-[#00577C] text-white shadow-md rounded-lg scale-105 z-10";
                      else if (isInBetween || isHovered) bgClass = "bg-[#00577C]/10 text-[#00577C] rounded-none";

                      return (
                        <button
                          key={dia} disabled={isPassado || !disponivel} onClick={() => handleDateClick(dataAtual)}
                          onMouseEnter={() => disponivel && setHoverDate(dataAtual)} onMouseLeave={() => setHoverDate(null)}
                          className={`w-full aspect-square flex flex-col items-center justify-center transition-all ${bgClass}`}
                        >
                          <span className={`text-sm ${isCheckin || isCheckout ? 'font-black' : 'font-semibold'}`}>{dia}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RESUMO DOS VALORES */}
              <div className="space-y-3 mb-8 text-sm font-semibold border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-2"><Bed size={14} className="text-[#00577C]" /> Hospedagem ({totalNoites} nts)</span>
                  <span className="text-slate-800">{formatarMoeda(totalHospedagem)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-2"><Compass size={14} className="text-[#009640]" /> Guia de Turismo</span>
                  <span className="text-slate-800">{formatarMoeda(valorGuia)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-2"><Ticket size={14} className="text-[#F9C400]" /> Entradas e Taxas</span>
                  <span className="text-slate-800">{formatarMoeda(valorAtracoes)}</span>
                </div>
              </div>

              <button
                onClick={handleReserva}
                className={`${jakarta.className} flex items-center justify-center gap-3 w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-5 rounded-2xl font-black text-lg transition-transform hover:-translate-y-1 shadow-xl`}
              >
                Prosseguir para Checkout <ChevronRightIcon size={20} />
              </button>

              <p className="mt-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <ShieldCheck size={13} className="text-[#00577C]" /> Plataforma Oficial SagaTurismo
              </p>
            </div>

          </aside>
        </div>
      </div>

      {/* ── GALERIA ── */}
      {galeriaCombinada.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-5 pb-20 relative z-10 text-left -mt-6">
          <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
            <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-8`}>Galeria de Imagens</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {galeriaCombinada.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setFotoExpandidaIndex(idx)}
                  className="relative aspect-square rounded-2xl overflow-hidden shadow-md group bg-slate-200 cursor-pointer"
                >
                  <Image src={url} alt={`Foto Galeria ${idx + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-[#00577C]/0 group-hover:bg-[#00577C]/40 transition-colors duration-300 flex items-center justify-center">
                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-10 h-10 scale-50 group-hover:scale-100" />
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
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-5 animate-in fade-in duration-200"
          onClick={fecharGaleria}
        >
          <button onClick={fecharGaleria} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
            <X size={24} />
          </button>
          <button onClick={fotoAnterior} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
            <ChevronLeft size={32} />
          </button>
          <div
            className="relative w-full max-w-6xl aspect-video rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image src={galeriaCombinada[fotoExpandidaIndex]} alt={`Visualização ${fotoExpandidaIndex + 1}`} fill className="object-contain" />
          </div>
          <button onClick={proximaFoto} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
            <ChevronRight size={32} />
          </button>
          <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
            <p className="text-white font-bold tracking-widest text-sm bg-black/60 inline-block px-5 py-2 rounded-full backdrop-blur-sm">
              {fotoExpandidaIndex + 1} de {galeriaCombinada.length}
            </p>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white mt-auto text-left">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative h-14 w-40">
              <Image src="/logop.png" alt="Prefeitura" fill className="object-contain object-left" />
            </div>
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