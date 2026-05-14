'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, MapPin, Calendar as CalendarIcon, Clock,
  CheckCircle2, Bed, Compass, Ticket, ShieldCheck,
  ChevronRight, Camera, Info, QrCode, Wallet, X, Star,
  Award, ImageIcon, Smartphone, Map, UserCheck,
  ChevronLeft, ChevronRight as ChevronRightIcon, ZoomIn,
  Landmark, Check
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

// ── BLINDAGEM DE ARRAYS ──
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
  quarto_standard_nome: string; quarto_standard_preco: any; quarto_standard_comodidades: string[];
  quarto_luxo_nome: string; quarto_luxo_preco: any; quarto_luxo_comodidades: string[];
  galeria: string[] | string;
};
type Guia = { id: string; nome: string; preco_diaria: any; especialidade: string; imagem_url: string; descricao: string; };
type Atracao = { id: string; nome: string; preco_entrada: any; tipo: string; };
type Pacote = {
  id: string; titulo: string; descricao_curta: string; roteiro_detalhado: string;
  imagens_galeria: string[]; imagem_principal: string; dias: number; noites: number;
  horarios_info: string;
  pacote_itens: { hoteis: Hotel | null; guias: Guia | null; atracoes: Atracao | null; }[];
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

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col`}>

      {/* ── HEADER ── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56">
              <Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/pacotes" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Pacotes</Link>
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão Residente</Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="w-full h-[40vh] md:h-[60vh] relative bg-slate-200 mt-[70px] md:mt-[90px]">
        <Link href="/pacotes" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 px-4 py-2 rounded-full shadow-lg transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <Image src={pacote.imagem_principal || FALLBACK_IMAGE} alt={pacote.titulo || 'Pacote'} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* ── GRID PRINCIPAL ── */}
      <div className="mx-auto w-full max-w-7xl px-5 py-12 flex flex-col lg:flex-row items-start gap-12 relative z-10 -mt-20">

        {/* ── COLUNA ESQUERDA ── */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-10">

          {/* Info Principal */}
          <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                Expedição Oficial
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                <MapPin size={15} className="text-[#009640]" /> São Geraldo do Araguaia, Pará
              </span>
            </div>

            <h1 className={`${jakarta.className} text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4 text-left`}>
              {pacote.titulo}
            </h1>

            <div className="flex items-center gap-6 text-sm font-semibold text-slate-500 mb-10 border-b border-slate-100 pb-8">
              <span className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-[#00577C]" /> {pacote.dias} dias
              </span>
            </div>

            <div className="mb-12 text-left">
              <h3 className={`${jakarta.className} text-2xl font-black text-[#00577C] mb-6`}>Sobre o Roteiro</h3>
              <p className="text-lg text-slate-500 italic font-medium border-l-4 border-[#F9C400] pl-5 mb-8">{pacote.descricao_curta}</p>
              <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">{pacote.roteiro_detalhado}</div>
            </div>
          </section>

          {/* ── ACOMODAÇÃO (DESIGN HOTEL RESTAURADO) ── */}
          <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 text-left">
            <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-10 flex items-center gap-4`}>
              <div className="w-12 h-12 bg-[#00577C] text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Bed size={24} />
              </div>
              1. Escolha a Acomodação
            </h3>

            <div className="flex flex-col gap-8">
              {hoteisDisponiveis.map((hotel: any) => {
                const isHotelSelected = hotelSelecionado?.id === hotel.id;
                return (
                  <div key={hotel.id} className="space-y-6">
                    {/* Botão de Seleção do Hotel */}
                    <button 
                      onClick={() => setHotelSelecionado(hotel)}
                      className={`w-full flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all ${isHotelSelected ? 'border-[#00577C] bg-blue-50/10 shadow-lg' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                      <div className="flex items-center gap-5 text-left">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden border shrink-0">
                          <Image src={hotel.imagem_url || FALLBACK_IMAGE} alt="Hotel" fill className="object-cover" />
                        </div>
                        <div>
                          <h4 className={`${jakarta.className} text-xl font-black text-slate-800`}>{hotel.nome}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="bg-[#F9C400] text-[#00577C] px-2 py-0.5 rounded text-[9px] font-black uppercase">{hotel.tipo}</span>
                            <div className="flex text-[#F9C400] gap-0.5">{[...Array(4)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}</div>
                          </div>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isHotelSelected ? 'border-[#00577C] bg-[#00577C]' : 'border-slate-300'}`}>
                        {isHotelSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                      </div>
                    </button>

                    {/* Comparativo de Quartos (Estilo Premium do Hotel) */}
                    {isHotelSelected && (
                      <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        
                        {/* Opção Standard */}
                        <div 
                          onClick={() => setTipoQuarto('standard')}
                          className={`relative cursor-pointer flex flex-col p-8 rounded-[2rem] border-2 transition-all h-full ${tipoQuarto === 'standard' ? 'border-[#00577C] bg-white shadow-xl ring-4 ring-blue-50/50' : 'border-slate-100 bg-slate-50/50 opacity-80'}`}
                        >
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Opção Económica</p>
                                <h5 className={`${jakarta.className} text-2xl font-black text-slate-900`}>{hotel.quarto_standard_nome}</h5>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${tipoQuarto === 'standard' ? 'border-[#00577C] bg-[#00577C]' : 'border-slate-300'}`}>
                                {tipoQuarto === 'standard' && <Check size={14} className="text-white" strokeWidth={4} />}
                              </div>
                           </div>

                           <ul className="space-y-3 mb-10 flex-1">
                              {getArraySeguro(hotel.quarto_standard_comodidades).map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                   <CheckCircle2 size={18} className="text-[#009640] shrink-0" /> {item}
                                </li>
                              ))}
                           </ul>

                           <div className="pt-6 border-t border-slate-100">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço do Quarto</p>
                             <p className={`${jakarta.className} text-3xl font-black text-[#009640]`}>{formatarMoeda(parseValor(hotel.quarto_standard_preco))}</p>
                           </div>
                        </div>

                        {/* Opção Luxo */}
                        <div 
                          onClick={() => setTipoQuarto('luxo')}
                          className={`relative cursor-pointer flex flex-col p-8 rounded-[2rem] border-2 transition-all h-full ${tipoQuarto === 'luxo' ? 'border-[#F9C400] bg-white shadow-xl ring-4 ring-yellow-50/50' : 'border-slate-100 bg-slate-50/50 opacity-80'}`}
                        >
                           <div className="absolute -top-3.5 right-8 bg-[#00577C] text-white text-[9px] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                              <Award size={14} /> RECOMENDADO
                           </div>

                           <div className="flex justify-between items-start mb-6">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-1">Experiência Premium</p>
                                <h5 className={`${jakarta.className} text-2xl font-black text-slate-900`}>{hotel.quarto_luxo_nome}</h5>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${tipoQuarto === 'luxo' ? 'border-[#F9C400] bg-[#F9C400]' : 'border-slate-300'}`}>
                                {tipoQuarto === 'luxo' && <Check size={14} className="text-white" strokeWidth={4} />}
                              </div>
                           </div>

                           <ul className="space-y-3 mb-10 flex-1">
                              {getArraySeguro(hotel.quarto_luxo_comodidades).map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-slate-700 font-black text-sm">
                                   <Star size={18} className="text-[#F9C400] fill-[#F9C400] shrink-0" /> {item}
                                </li>
                              ))}
                           </ul>

                           <div className="pt-6 border-t border-slate-100">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço do Quarto</p>
                             <p className={`${jakarta.className} text-3xl font-black text-[#009640]`}>{formatarMoeda(parseValor(hotel.quarto_luxo_preco))}</p>
                           </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── GUIA OFICIAL ── */}
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
                    className={`flex items-center justify-between p-6 bg-white rounded-[2rem] border-2 transition-all cursor-pointer ${selected ? 'border-[#009640] shadow-lg' : 'border-slate-100 bg-white hover:border-slate-200'}`}
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
                      <input
                        type="radio"
                        checked={selected}
                        onChange={() => setGuiaSelecionado(guia)}
                        className="w-5 h-5 accent-[#009640]"
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

        </div>

        {/* ── COLUNA DIREITA — MOTOR DE RESERVAS ── */}
        <div className="w-full lg:w-[420px] shrink-0 lg:self-start text-left">
          <aside className="lg:sticky lg:top-32 space-y-6">

            <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">

              <div className="border-b border-slate-100 pb-6 mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-1">Valor Estimado</p>
                <div className="flex items-end gap-2">
                  <p className={`${jakarta.className} text-4xl font-black text-[#009640]`}>{formatarMoeda(valorTotalFinal)}</p>
                  <p className="text-sm font-bold text-slate-400 mb-1.5">total</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C]">1. Acomodação</p>
                {hoteisDisponiveis.map((hotel: any) => (
                  <label
                    key={hotel.id}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${hotelSelecionado?.id === hotel.id ? 'border-[#00577C] bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <input
                      type="radio"
                      name="hotel-aside"
                      className="w-5 h-5 accent-[#00577C]"
                      checked={hotelSelecionado?.id === hotel.id}
                      onChange={() => setHotelSelecionado(hotel)}
                    />
                    <p className="font-bold text-sm text-slate-800">{hotel.nome}</p>
                  </label>
                ))}
              </div>

              <div className="space-y-3 mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C]">2. Tipo de Quarto</p>
                <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${tipoQuarto === 'standard' ? 'border-[#00577C] bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <input type="radio" name="quarto-aside" className="w-5 h-5 accent-[#00577C]" checked={tipoQuarto === 'standard'} onChange={() => { setTipoQuarto('standard'); setCheckin(null); setCheckout(null); }} />
                  <p className="font-bold text-sm text-slate-800">{hotelSelecionado?.quarto_standard_nome || 'Standard'}</p>
                </label>
                <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${tipoQuarto === 'luxo' ? 'border-[#F9C400] bg-yellow-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <input type="radio" name="quarto-aside" className="w-5 h-5 accent-[#F9C400]" checked={tipoQuarto === 'luxo'} onChange={() => { setTipoQuarto('luxo'); setCheckin(null); setCheckout(null); }} />
                  <p className="font-bold text-sm text-slate-800">{hotelSelecionado?.quarto_luxo_nome || 'Suíte Luxo'}</p>
                </label>
              </div>

              <div className="mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-4">3. Selecione as Datas</p>
                <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-5 shadow-inner">

                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente - 1))} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                      <ChevronLeft size={20} />
                    </button>
                    <p className="font-bold text-slate-800 capitalize text-sm">
                      {mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                    <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente + 1))} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                      <span key={i} className="text-[10px] font-black text-slate-400">{d}</span>
                    ))}
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
                      if (isPassado || !disponivel) {
                        bgClass = "bg-transparent text-slate-300 cursor-not-allowed line-through";
                      } else if (isCheckin || isCheckout) {
                        bgClass = "bg-[#00577C] text-white shadow-md rounded-lg scale-105 z-10";
                      } else if (isInBetween || isHovered) {
                        bgClass = "bg-[#00577C]/10 text-[#00577C] rounded-none";
                      }

                      return (
                        <button
                          key={dia}
                          disabled={isPassado || !disponivel}
                          onClick={() => handleDateClick(dataAtual)}
                          onMouseEnter={() => disponivel && setHoverDate(dataAtual)}
                          onMouseLeave={() => setHoverDate(null)}
                          className={`w-full aspect-square flex flex-col items-center justify-center transition-all ${bgClass}`}
                        >
                          <span className={`text-sm ${isCheckin || isCheckout ? 'font-black' : 'font-semibold'}`}>{dia}</span>
                          {disponivel && !isCheckin && !isCheckout && !isInBetween && (
                            <span className="text-[7px] font-black text-slate-400 -mt-1 tabular-nums">R${Math.round(getPrecoDiariaHotel(dataStr))}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 text-sm font-semibold">
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

              {checkin && checkout && (
                <div className="flex flex-col gap-2 bg-[#009640]/10 p-6 rounded-2xl mb-6 border border-[#009640]/20 animate-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-black text-[#009640] uppercase block mb-1 text-left">Total Estimado</span>
                      <span className="text-xs font-bold text-slate-600">{totalNoites} {totalNoites === 1 ? 'noite' : 'noites'}</span>
                    </div>
                    <span className={`${jakarta.className} text-3xl font-black text-[#009640]`}>{formatarMoeda(valorTotalFinal)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleReserva}
                className={`${jakarta.className} flex items-center justify-center gap-3 w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-5 rounded-2xl font-black text-lg transition-transform hover:-translate-y-1 shadow-xl`}
              >
                Prosseguir para Checkout <ChevronRightIcon size={20} />
              </button>

              <p className="mt-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <ShieldCheck size={13} className="text-[#00577C]" /> Plataforma Segura SGA
              </p>
            </div>

          </aside>
        </div>
      </div>

      {/* ── GALERIA ── */}
      {galeriaCombinada.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-5 pb-20 relative z-10 text-left">
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