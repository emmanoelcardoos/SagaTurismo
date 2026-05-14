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
  Landmark
} from 'lucide-react';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740";

// ── UTILITÁRIOS E MATEMÁTICA ── (sem alterações)
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

// ── TIPAGENS (sem alterações) ──
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

  // ── ESTADOS (sem alterações) ──
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [loading, setLoading] = useState(true);
  const [disponibilidadeDb, setDisponibilidadeDb] = useState<Record<string, Disponibilidade>>({});

  const [hoteisDisponiveis, setHoteisDisponiveis] = useState<Hotel[]>([]);
  const [guiasDisponiveis, setGuiasDisponiveis] = useState<Guia[]>([]);
  const [atracoesInclusas, setAtracoesInclusas] = useState<Atracao[]>([]);

  const [hotelSelecionado, setHotelSelecionado] = useState<Hotel | null>(null);
  const [tipoQuarto, setTipoQuarto] = useState<'standard' | 'luxo'>('standard');
  const [guiaSelecionado, setGuiaSelecionado] = useState<Guia | null>(null);

  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [mesAtualCalendario, setMesAtualCalendario] = useState<Date | null>(null);

  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMesAtualCalendario(new Date());
    setMounted(true);
  }, []);

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

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('pacotes')
          .select(`*, pacote_itens ( hoteis (*), guias (*), atracoes (*) )`)
          .eq('id', id)
          .single();
        if (error || !data) { router.push('/pacotes'); return; }
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

  // ── LÓGICA DO CALENDÁRIO (sem alterações) ──
  const diasDoMes = (ano: number, mes: number) => new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaDoMes = (ano: number, mes: number) => new Date(ano, mes, 1).getDay();
  const formatarDataIso = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

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
      setCheckin(data); setCheckout(null);
    } else if (data > checkin) {
      let diaAtual = new Date(checkin);
      let reservaValida = true;
      while (diaAtual < data) {
        if (!isDisponivel(formatarDataIso(diaAtual))) { reservaValida = false; break; }
        diaAtual.setDate(diaAtual.getDate() + 1);
      }
      if (reservaValida) setCheckout(data);
      else { alert("A sua seleção inclui dias esgotados. Selecione outro período."); setCheckin(data); setCheckout(null); }
    } else {
      setCheckin(data);
    }
  };

  // ── MATEMÁTICA DA RESERVA (sem alterações) ──
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

  // ── GALERIA (sem alterações) ──
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
    <div className={`${dmSans.className} min-h-screen flex items-center justify-center bg-[#F4F1EC]`}>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-2 border-[#00577C]/20 border-t-[#00577C] rounded-full animate-spin mx-auto" />
        <p className="text-[#00577C]/60 text-xs tracking-[0.3em] uppercase font-medium">A preparar experiência</p>
      </div>
    </div>
  );

  const anoCorrente = mesAtualCalendario.getFullYear();
  const mesCorrente = mesAtualCalendario.getMonth();
  const diasMes = diasDoMes(anoCorrente, mesCorrente);
  const primeiroDia = primeiroDiaDoMes(anoCorrente, mesCorrente);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return (
    <div className={`${dmSans.className} min-h-screen bg-[#F4F1EC]`}>

      {/* ── ESTILOS GLOBAIS ── */}
      <style jsx global>{`
        :root {
          --azul: #00577C;
          --verde: #2D7D46;
          --amarelo: #C9A84C;
          --fundo: #F4F1EC;
          --texto: #1A1F1C;
          --branco: #FDFCFA;
        }
        ::selection { background: var(--azul); color: white; }
        * { -webkit-font-smoothing: antialiased; }
        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 100px;
        }
      `}</style>

      {/* ── HEADER ── */}
      <header className={`fixed left-0 top-0 z-50 w-full transition-transform duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Fundo glassmorphism limitado ao conteúdo */}
          <div className="absolute inset-0 bg-[#F4F1EC]/90 backdrop-blur-2xl border-b border-[#1A1F1C]/8" style={{ zIndex: -1 }} />

          <Link href="/" className="flex items-center gap-4">
            <div className="relative h-10 w-36">
              <Image src="/logop.png" alt="Logo" fill className="object-contain object-left" />
            </div>
            <div className="hidden md:flex flex-col border-l border-[#1A1F1C]/15 pl-4">
              <span className={`${cormorant.className} text-xl font-semibold tracking-wide text-[#00577C] leading-none`}>SagaTurismo</span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#1A1F1C]/40 font-medium mt-0.5">Secretaria de Turismo</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/pacotes" className="text-sm font-medium text-[#1A1F1C]/70 hover:text-[#00577C] transition-colors tracking-wide">Pacotes</Link>
            <Link href="/roteiro" className="text-sm font-medium text-[#1A1F1C]/70 hover:text-[#00577C] transition-colors tracking-wide">Rota Turística</Link>
            <Link href="/cadastro" className="text-sm font-semibold bg-[#00577C] text-white px-6 py-2.5 rounded-full hover:bg-[#004568] transition-colors tracking-wide shadow-sm">
              Cartão Residente
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative h-screen min-h-[700px] w-full">
        <Image src={pacote.imagem_principal || FALLBACK_IMAGE} alt={pacote.titulo || 'Pacote'} fill className="object-cover" priority />

        {/* Gradientes sofisticados */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A10]/90 via-[#0A1A10]/30 to-[#0A1A10]/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1A10]/50 to-transparent" />

        {/* Linha decorativa lateral */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 hidden lg:flex">
          <div className="w-px h-24 bg-white/20" />
          <span className="text-white/40 text-[9px] tracking-[0.4em] uppercase font-medium -rotate-90 whitespace-nowrap">São Geraldo do Araguaia</span>
          <div className="w-px h-24 bg-white/20" />
        </div>

        <div className="absolute bottom-0 left-0 w-full px-8 md:px-16 pb-16 text-white max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-medium mb-10 text-white/60 hover:text-white transition-colors tracking-widest uppercase"
          >
            <ArrowLeft size={14} /> Voltar
          </button>

          <div className="flex items-center gap-3 mb-6">
            <span className="tag-pill bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 backdrop-blur-sm">
              Expedição Oficial
            </span>
            <span className="tag-pill bg-white/10 text-white/70 border border-white/20 backdrop-blur-sm">
              <MapPin size={10} /> Pará, Brasil
            </span>
          </div>

          <h1 className={`${cormorant.className} text-6xl md:text-8xl lg:text-9xl font-light leading-[0.95] tracking-tight text-white mb-6`}>
            {pacote.titulo}
          </h1>

          <p className="text-white/60 text-base max-w-xl font-light leading-relaxed mt-4">
            {pacote.descricao_curta}
          </p>
        </div>
      </section>

      {/* ── INFO BAR FLUTUANTE ── */}
      <div className="relative z-30 max-w-5xl mx-auto px-6 -mt-1">
        <div className="bg-[#FDFCFA] border border-[#1A1F1C]/8 rounded-2xl shadow-xl overflow-hidden grid grid-cols-3 divide-x divide-[#1A1F1C]/8">
          <div className="px-10 py-7 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
              <CalendarIcon size={18} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-[#1A1F1C]/40 uppercase tracking-[0.2em] mb-0.5">Duração</p>
              <p className="font-semibold text-[#1A1F1C] text-lg leading-none">{pacote.dias} Dias</p>
            </div>
          </div>
          <div className="px-10 py-7 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#00577C]/10 flex items-center justify-center">
              <MapPin size={18} className="text-[#00577C]" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-[#1A1F1C]/40 uppercase tracking-[0.2em] mb-0.5">Destino</p>
              <p className="font-semibold text-[#1A1F1C] text-lg leading-none">SGA, Pará</p>
            </div>
          </div>
          <div className="px-10 py-7 flex items-center gap-4 bg-[#2D7D46]/5">
            <div className="w-10 h-10 rounded-xl bg-[#2D7D46]/15 flex items-center justify-center">
              <Wallet size={18} className="text-[#2D7D46]" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-[#2D7D46]/60 uppercase tracking-[0.2em] mb-0.5">Valor Estimado</p>
              <p className={`${cormorant.className} font-semibold text-[#2D7D46] text-2xl leading-none`}>{formatarMoeda(valorTotalFinal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── GRID PRINCIPAL ── */}
      <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-[1fr_420px] gap-14 items-start">

        {/* ── COLUNA ESQUERDA ── */}
        <div className="space-y-12">

          {/* SOBRE O ROTEIRO */}
          <section className="bg-[#FDFCFA] rounded-2xl p-10 border border-[#1A1F1C]/8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-7 h-px bg-[#C9A84C]" />
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#C9A84C]">Roteiro</span>
            </div>
            <h2 className={`${cormorant.className} text-4xl font-medium text-[#1A1F1C] mb-6 leading-tight`}>Sobre a Experiência</h2>
            <p className="text-[#1A1F1C]/60 text-lg leading-relaxed mb-8 italic font-light border-l-2 border-[#C9A84C] pl-6">
              {pacote.descricao_curta}
            </p>
            <div className="text-[#1A1F1C]/70 leading-relaxed whitespace-pre-line text-base font-light">
              {pacote.roteiro_detalhado}
            </div>
          </section>

          {/* ── ACOMODAÇÃO ── */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#00577C] flex items-center justify-center shadow-sm">
                <Bed size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[9px] font-semibold tracking-[0.25em] uppercase text-[#1A1F1C]/40 mb-0.5">Passo 1</p>
                <h2 className={`${cormorant.className} text-2xl font-medium text-[#1A1F1C]`}>Escolha a Acomodação</h2>
              </div>
            </div>

            <div className="space-y-4">
              {hoteisDisponiveis.map((hotel: any) => {
                const selected = hotelSelecionado?.id === hotel.id;
                return (
                  <div
                    key={hotel.id}
                    className={`bg-[#FDFCFA] rounded-2xl border transition-all duration-300 overflow-hidden ${selected ? 'border-[#00577C]/40 shadow-lg ring-1 ring-[#00577C]/10' : 'border-[#1A1F1C]/8 hover:border-[#1A1F1C]/20'}`}
                  >
                    <button
                      className="w-full flex items-center justify-between p-8 text-left gap-6"
                      onClick={() => setHotelSelecionado(hotel)}
                    >
                      <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#1A1F1C]/8 flex-shrink-0">
                          <Image src={hotel.imagem_url || FALLBACK_IMAGE} alt={hotel.nome} fill className="object-cover" />
                        </div>
                        <div className="text-left">
                          <h4 className={`${cormorant.className} text-2xl font-medium text-[#1A1F1C] mb-2`}>{hotel.nome}</h4>
                          <div className="flex items-center gap-3">
                            <span className="tag-pill bg-[#2D7D46]/8 text-[#2D7D46] border border-[#2D7D46]/20">{hotel.tipo}</span>
                            <div className="flex text-[#C9A84C] gap-0.5">
                              {[...Array(4)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'border-[#00577C] bg-[#00577C]' : 'border-[#1A1F1C]/20'}`}>
                        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>

                    {selected && (
                      <div className="px-8 pb-8 border-t border-[#1A1F1C]/6 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[9px] font-semibold tracking-[0.25em] uppercase text-[#1A1F1C]/40 mb-4">Tipo de Quarto</p>
                        <div className="grid md:grid-cols-2 gap-4">

                          {/* Standard */}
                          <div
                            onClick={() => setTipoQuarto('standard')}
                            className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${tipoQuarto === 'standard' ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-[#1A1F1C]/8 hover:border-[#1A1F1C]/20'}`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <p className="font-semibold text-[#1A1F1C]">{hotel.quarto_standard_nome || 'Standard'}</p>
                              {tipoQuarto === 'standard' && (
                                <div className="w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {getArraySeguro(hotel.quarto_standard_comodidades).map((c: string, i: number) => (
                                <span key={i} className="text-[9px] font-medium bg-[#1A1F1C]/5 text-[#1A1F1C]/50 px-2 py-1 rounded-md uppercase tracking-wide">{c}</span>
                              ))}
                            </div>
                            <p className={`${cormorant.className} text-2xl font-semibold text-[#2D7D46]`}>{formatarMoeda(parseValor(hotel.quarto_standard_preco))}</p>
                          </div>

                          {/* Luxo */}
                          <div
                            onClick={() => setTipoQuarto('luxo')}
                            className={`cursor-pointer p-6 rounded-xl border-2 transition-all relative ${tipoQuarto === 'luxo' ? 'border-[#00577C] bg-[#00577C]/5' : 'border-[#1A1F1C]/8 hover:border-[#1A1F1C]/20'}`}
                          >
                            <div className="absolute -top-3 left-5">
                              <span className="tag-pill bg-[#00577C] text-white text-[8px]">
                                <Award size={8} /> Recomendado
                              </span>
                            </div>
                            <div className="flex justify-between items-start mb-4 mt-2">
                              <p className="font-semibold text-[#1A1F1C]">{hotel.quarto_luxo_nome || 'Suíte Luxo'}</p>
                              {tipoQuarto === 'luxo' && (
                                <div className="w-5 h-5 rounded-full bg-[#00577C] flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {getArraySeguro(hotel.quarto_luxo_comodidades).map((c: string, i: number) => (
                                <span key={i} className="text-[9px] font-medium bg-[#00577C]/10 text-[#00577C] px-2 py-1 rounded-md uppercase tracking-wide">{c}</span>
                              ))}
                            </div>
                            <p className={`${cormorant.className} text-2xl font-semibold text-[#2D7D46]`}>{formatarMoeda(parseValor(hotel.quarto_luxo_preco))}</p>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── GUIA ── */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#2D7D46] flex items-center justify-center shadow-sm">
                <UserCheck size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[9px] font-semibold tracking-[0.25em] uppercase text-[#1A1F1C]/40 mb-0.5">Passo 2</p>
                <h2 className={`${cormorant.className} text-2xl font-medium text-[#1A1F1C]`}>Guia Oficial Credenciado</h2>
              </div>
            </div>

            <div className="space-y-3">
              {guiasDisponiveis.map((guia: any) => {
                const selected = guiaSelecionado?.id === guia.id;
                return (
                  <label
                    key={guia.id}
                    className={`flex items-center justify-between p-6 bg-[#FDFCFA] rounded-2xl border-2 transition-all cursor-pointer ${selected ? 'border-[#2D7D46]/40 ring-1 ring-[#2D7D46]/10 shadow-md' : 'border-[#1A1F1C]/8 hover:border-[#1A1F1C]/20'}`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#1A1F1C]/8 flex-shrink-0">
                        <Image src={guia.imagem_url || FALLBACK_IMAGE} alt={guia.nome} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A1F1C] text-lg">{guia.nome}</p>
                        <p className="text-xs text-[#1A1F1C]/50 font-medium mt-0.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2D7D46]" />
                          {guia.especialidade}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] text-[#1A1F1C]/40 uppercase tracking-[0.2em] font-medium mb-0.5">Diária</p>
                        <p className={`${cormorant.className} text-xl font-semibold text-[#1A1F1C]`}>{formatarMoeda(parseValor(guia.preco_diaria))}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'border-[#2D7D46] bg-[#2D7D46]' : 'border-[#1A1F1C]/20'}`}>
                        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <input type="radio" checked={selected} onChange={() => setGuiaSelecionado(guia)} className="sr-only" />
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

        </div>

        {/* ── COLUNA DIREITA — MOTOR DE RESERVAS ── */}
        <aside className="lg:sticky lg:top-28 h-fit">
          <div className="bg-[#FDFCFA] rounded-2xl border border-[#1A1F1C]/8 shadow-xl overflow-hidden">

            {/* Topo colorido */}
            <div className="h-1 w-full bg-gradient-to-r from-[#00577C] via-[#2D7D46] to-[#C9A84C]" />

            <div className="p-8">
              <h3 className={`${cormorant.className} text-2xl font-medium text-[#1A1F1C] mb-6 pb-5 border-b border-[#1A1F1C]/6`}>
                Detalhes da Reserva
              </h3>

              {/* ── CALENDÁRIO ── */}
              <div className="bg-[#F4F1EC] rounded-xl p-5 mb-7 border border-[#1A1F1C]/6">
                {/* Navegação do mês */}
                <div className="flex justify-between items-center mb-5">
                  <button
                    onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente - 1))}
                    className="w-8 h-8 rounded-lg hover:bg-[#1A1F1C]/8 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft size={18} className="text-[#1A1F1C]/50" />
                  </button>
                  <span className="font-semibold text-[#1A1F1C] text-sm capitalize tracking-wide">
                    {mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente + 1))}
                    className="w-8 h-8 rounded-lg hover:bg-[#1A1F1C]/8 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight size={18} className="text-[#1A1F1C]/50" />
                  </button>
                </div>

                {/* Dias da semana */}
                <div className="grid grid-cols-7 gap-0.5 text-center mb-2">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                    <div key={i} className="text-[9px] font-semibold text-[#1A1F1C]/30 tracking-wider py-1">{d}</div>
                  ))}
                </div>

                {/* Dias */}
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e-${i}`} />)}

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

                    let cls = "";
                    if (isPassado || !disponivel) {
                      cls = "text-[#1A1F1C]/20 cursor-not-allowed line-through";
                    } else if (isCheckin || isCheckout) {
                      cls = "bg-[#00577C] text-white font-semibold rounded-lg shadow-md scale-105 z-10";
                    } else if (isInBetween || isHovered) {
                      cls = "bg-[#00577C]/12 text-[#00577C] rounded-sm";
                    } else {
                      cls = "hover:bg-[#1A1F1C]/6 text-[#1A1F1C] rounded-lg cursor-pointer";
                    }

                    return (
                      <button
                        key={dia}
                        disabled={isPassado || !disponivel}
                        onClick={() => handleDateClick(dataAtual)}
                        onMouseEnter={() => disponivel && setHoverDate(dataAtual)}
                        onMouseLeave={() => setHoverDate(null)}
                        className={`w-full aspect-square flex flex-col items-center justify-center text-xs transition-all ${cls}`}
                      >
                        <span className="leading-none">{dia}</span>
                        {disponivel && !isCheckin && !isCheckout && !isInBetween && (
                          <span className="text-[7px] text-[#2D7D46] font-medium leading-none mt-0.5 tabular-nums">
                            {Math.round(getPrecoDiariaHotel(dataStr))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Indicador de datas selecionadas */}
                {(checkin || checkout) && (
                  <div className="mt-4 pt-4 border-t border-[#1A1F1C]/8 flex items-center justify-between text-xs">
                    <div className="text-center">
                      <p className="text-[#1A1F1C]/40 uppercase tracking-wider text-[9px] mb-0.5 font-medium">Check-in</p>
                      <p className="font-semibold text-[#00577C]">{checkin ? checkin.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}</p>
                    </div>
                    <div className="flex-1 flex items-center gap-1 mx-3">
                      <div className="flex-1 h-px bg-[#1A1F1C]/12" />
                      <span className="text-[#1A1F1C]/30 text-[9px]">{totalNoites > 0 ? `${totalNoites}n` : ''}</span>
                      <div className="flex-1 h-px bg-[#1A1F1C]/12" />
                    </div>
                    <div className="text-center">
                      <p className="text-[#1A1F1C]/40 uppercase tracking-wider text-[9px] mb-0.5 font-medium">Check-out</p>
                      <p className="font-semibold text-[#00577C]">{checkout ? checkout.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── RESUMO FINANCEIRO ── */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-[#1A1F1C]/60 font-medium">
                    <Bed size={14} className="text-[#00577C]" /> Hospedagem {totalNoites > 0 && `(${totalNoites}n)`}
                  </span>
                  <span className="font-semibold text-[#1A1F1C]">{formatarMoeda(totalHospedagem)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-[#1A1F1C]/60 font-medium">
                    <Compass size={14} className="text-[#2D7D46]" /> Guia de Turismo
                  </span>
                  <span className="font-semibold text-[#1A1F1C]">{formatarMoeda(valorGuia)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-[#1A1F1C]/60 font-medium">
                    <Ticket size={14} className="text-[#C9A84C]" /> Entradas e Taxas
                  </span>
                  <span className="font-semibold text-[#1A1F1C]">{formatarMoeda(valorAtracoes)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="bg-[#F4F1EC] rounded-xl p-5 mb-6 border border-[#1A1F1C]/6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-[#2D7D46]/60 mb-1">Total da Experiência</p>
                    <p className={`${cormorant.className} text-4xl font-semibold text-[#2D7D46]`}>{formatarMoeda(valorTotalFinal)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#2D7D46]/10 flex items-center justify-center">
                    <Wallet size={20} className="text-[#2D7D46]" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleReserva}
                className="w-full bg-[#00577C] hover:bg-[#004568] text-white py-4 rounded-xl font-semibold text-base shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 tracking-wide"
              >
                Prosseguir para Checkout
                <ChevronRightIcon size={18} />
              </button>

              <p className="mt-4 text-center text-[9px] font-medium text-[#1A1F1C]/30 uppercase tracking-[0.25em] flex items-center justify-center gap-1.5">
                <ShieldCheck size={12} className="text-[#00577C]/40" /> Plataforma Segura · SGA
              </p>
            </div>
          </div>
        </aside>

      </div>

      {/* ── GALERIA ── */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-6 h-px bg-[#C9A84C]" />
              <span className="text-[9px] font-semibold tracking-[0.25em] uppercase text-[#C9A84C]">Visão Geral</span>
            </div>
            <h2 className={`${cormorant.className} text-4xl font-medium text-[#1A1F1C]`}>Galeria de Imagens</h2>
          </div>
          <p className="text-[#1A1F1C]/25 text-sm hidden md:block">{galeriaCombinada.length} fotografias</p>
        </div>

        {galeriaCombinada.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {galeriaCombinada.map((url, idx) => (
              <div
                key={idx}
                onClick={() => setFotoExpandidaIndex(idx)}
                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-[#1A1F1C]/5"
              >
                <Image src={url} alt={`Galeria ${idx + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-[#1A1F1C]/0 group-hover:bg-[#1A1F1C]/30 transition-colors duration-300 flex items-center justify-center">
                  <ZoomIn className="text-white w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#FDFCFA] p-20 rounded-2xl border border-dashed border-[#1A1F1C]/15 text-center">
            <Camera size={36} className="text-[#1A1F1C]/20 mb-4 mx-auto" />
            <p className="text-[#1A1F1C]/30 text-sm tracking-widest uppercase font-medium">Sem imagens disponíveis</p>
          </div>
        )}
      </section>

      {/* ── LIGHTBOX ── */}
      {fotoExpandidaIndex !== null && galeriaCombinada.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-[#0A1A10]/97 backdrop-blur-xl flex items-center justify-center p-8"
          onClick={fecharGaleria}
        >
          <button
            onClick={fecharGaleria}
            className="absolute top-8 right-8 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-[110]"
          >
            <X size={18} />
          </button>

          <button
            onClick={fotoAnterior}
            className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-[110] hidden md:flex"
          >
            <ChevronLeft size={22} />
          </button>

          <div
            className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={galeriaCombinada[fotoExpandidaIndex]}
              alt={`Detalhe ${fotoExpandidaIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          <button
            onClick={proximaFoto}
            className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-[110] hidden md:flex"
          >
            <ChevronRightIcon size={22} />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <span className="text-white/50 text-[10px] tracking-[0.3em] uppercase font-medium">
              {fotoExpandidaIndex + 1} / {galeriaCombinada.length}
            </span>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1A1F1C]/8 bg-[#FDFCFA] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-5">
            <Image src="/logop.png" alt="Logo SGA" width={140} height={50} className="object-contain opacity-50 hover:opacity-80 transition-opacity" />
            <div className="border-l border-[#1A1F1C]/10 pl-5 hidden md:block">
              <p className={`${cormorant.className} text-lg font-medium text-[#00577C]`}>SagaTurismo</p>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#1A1F1C]/30 font-medium">Portal Oficial</p>
            </div>
          </div>
          <p className="text-[10px] font-medium text-[#1A1F1C]/30 uppercase tracking-widest text-center">
            © {new Date().getFullYear()} · Prefeitura Municipal de São Geraldo do Araguaia
          </p>
        </div>
      </footer>

    </div>
  );
}