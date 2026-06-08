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
  Wind, Wifi, Bath, Maximize, Zap, CreditCard, Coffee, Edit3, Menu, ArrowRight, AlertCircle
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── IMAGEM DE SEGURANÇA ──
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740";
const FALLBACK_GUIA_IMAGE = "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1887";

// ── UTILITÁRIOS ──
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

// ── TIPAGENS ──
type Hotel = {
  id: string; nome: string; tipo: string; imagem_url: string; descricao: string;
  quarto_standard_nome?: string; quarto_standard_preco: any; quarto_standard_comodidades?: string[];
  quarto_luxo_nome?: string; quarto_luxo_preco: any; quarto_luxo_comodidades?: string[];
  quarto_standard_imagens?: string[]; quarto_luxo_imagens?: string[];
  galeria: string[] | string;
};
type Guia = {
  id: string;
  nome: string;
  preco_diaria: any;
  especialidade: string;
  imagem_url: string;
  descricao_guia: string;
};
type Atracao = { id: string; nome: string; preco_entrada: any; tipo: string; };
type Pacote = {
  id: string; titulo: string; descricao_curta: string; roteiro_detalhado: string;
  imagens_galeria: string[]; imagem_principal: string; dias: number; noites: number;
  horarios_info: string; preco: number;
  pacote_itens: { hoteis: Hotel | null; guias: Guia | null; atracoes: Atracao | null; }[];
  avaliacoes_info?: any; politicas?: any; contatos?: any;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  dias_inicio_semana: number[] | null;
  duracao_fixa: boolean;
};

// ── COMPONENTE DE CONTEÚDO ──
function PacoteDetalheContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados de Dados
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [loading, setLoading] = useState(true);

  const [hoteisDisponiveis, setHoteisDisponiveis] = useState<Hotel[]>([]);
  const [guiasDisponiveis, setGuiasDisponiveis] = useState<Guia[]>([]);
  const [atracoesInclusas, setAtracoesInclusas] = useState<Atracao[]>([]);

  // Seleções do Utilizador
  const [hotelSelecionado, setHotelSelecionado] = useState<Hotel | null>(null);
  const [tipoQuarto, setTipoQuarto] = useState<'standard' | 'luxo'>('standard');
  const [guiaSelecionado, setGuiaSelecionado] = useState<Guia | null>(null);

  // Calendário
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [mesAtualCalendario, setMesAtualCalendario] = useState<Date | null>(null);
  
  // Lotação
  const [adultos, setAdultos] = useState(2);
  const [criancas, setCriancas] = useState(0);
  const [quartos, setQuartos] = useState(1);

  const [totalHospedagem, setTotalHospedagem] = useState(0);
  const [totalNoites, setTotalNoites] = useState(1);
  const [hotelDisponivel, setHotelDisponivel] = useState(true);
  const [calculandoPreco, setCalculandoPreco] = useState(false);

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

        const ci = searchParams.get('checkin');
        const co = searchParams.get('checkout');
        if (ci && ci !== 'null') setCheckin(new Date(ci));
        if (co && co !== 'null') setCheckout(new Date(co));
        const ad = searchParams.get('adultos');
        if (ad) setAdultos(Number(ad));
        const qu = searchParams.get('quartos');
        if (qu) setQuartos(Number(qu));
      } catch (err) {
        console.error("Falha ao carregar pacote:", err);
        router.push('/pacotes');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id, router, searchParams]);

  useEffect(() => {
    if (!hotelSelecionado || !checkin || !checkout) {
      setHotelDisponivel(true);
      return;
    }

    async function verificarDisponibilidadeHotel() {
      setCalculandoPreco(true);
      const checkinStr = `${checkin!.getFullYear()}-${String(checkin!.getMonth() + 1).padStart(2, '0')}-${String(checkin!.getDate()).padStart(2, '0')}`;
      const checkoutStr = `${checkout!.getFullYear()}-${String(checkout!.getMonth() + 1).padStart(2, '0')}-${String(checkout!.getDate()).padStart(2, '0')}`;

      try {
        const response = await fetch(`https://sagaturismo-production.up.railway.app/api/v1/public/hoteis/${hotelSelecionado!.id}/calcular-preco?tipo_quarto=${tipoQuarto}&checkin=${checkinStr}&checkout=${checkoutStr}&quantidade=${quartos}&adultos=${adultos}`);
        const data = await response.json();

        if (data.sucesso) {
          setHotelDisponivel(data.disponivel);
          setTotalNoites(data.noites);
        } else {
          setHotelDisponivel(false);
        }
      } catch (err) {
        console.error("Erro ao verificar disponibilidade do hotel:", err);
        setHotelDisponivel(false);
      } finally {
        setCalculandoPreco(false);
      }
    }
    verificarDisponibilidadeHotel();
  }, [checkin, checkout, quartos, adultos, tipoQuarto, hotelSelecionado]);

  // ── LÓGICA DO CALENDÁRIO ──
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const isDataInicioValida = (data: Date): boolean => {
    if (!pacote) return false;
    if (data < hoje) return false;
    if (pacote.periodo_inicio) {
      const inicioPeriodo = new Date(pacote.periodo_inicio);
      inicioPeriodo.setHours(0,0,0,0);
      if (data < inicioPeriodo) return false;
    }
    if (pacote.periodo_fim) {
      const fimPeriodo = new Date(pacote.periodo_fim);
      fimPeriodo.setHours(0,0,0,0);
      if (data > fimPeriodo) return false;
    }
    if (pacote.dias_inicio_semana && pacote.dias_inicio_semana.length > 0) {
      const diaSemana = data.getDay();
      if (!pacote.dias_inicio_semana.includes(diaSemana)) return false;
    }
    if (pacote.duracao_fixa && pacote.periodo_fim && pacote.dias) {
      const checkoutCalc = new Date(data);
      checkoutCalc.setDate(data.getDate() + pacote.dias - 1);
      const fimPeriodo = new Date(pacote.periodo_fim);
      fimPeriodo.setHours(0,0,0,0);
      if (checkoutCalc > fimPeriodo) return false;
    }
    return true;
  };

  const handleDateClick = (data: Date) => {
    if (!isDataInicioValida(data)) return;
    setCheckin(data);
    if (pacote && pacote.dias) {
      const novoCheckout = new Date(data);
      novoCheckout.setDate(data.getDate() + pacote.dias);
      setCheckout(novoCheckout);
    } else {
      const novoCheckout = new Date(data);
      novoCheckout.setDate(data.getDate() + 1);
      setCheckout(novoCheckout);
    }
  };

  const anoCorrente = mesAtualCalendario?.getFullYear() || new Date().getFullYear();
  const mesCorrente = mesAtualCalendario?.getMonth() || new Date().getMonth();
  const diasDoMes = (ano: number, mes: number) => new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaDoMes = (ano: number, mes: number) => new Date(ano, mes, 1).getDay();
  const diasMes = diasDoMes(anoCorrente, mesCorrente);
  const primeiroDia = primeiroDiaDoMes(anoCorrente, mesCorrente);

  const algumaDataValidaNoMes = Array.from({ length: diasMes }).some((_, i) => {
    const data = new Date(anoCorrente, mesCorrente, i + 1);
    return isDataInicioValida(data);
  });

  // ── MATEMÁTICA DO PACOTE ──
  const valorPorPessoa = parseValor(pacote?.preco);
  const diferencaDiaria = hotelSelecionado 
    ? Math.max(0, parseValor(hotelSelecionado.quarto_luxo_preco) - parseValor(hotelSelecionado.quarto_standard_preco)) 
    : 0;
  const acrescimoUpgrade = tipoQuarto === 'luxo' ? (diferencaDiaria * pacote.noites * quartos) : 0;
  const valorTotalFinal = (valorPorPessoa * adultos) + acrescimoUpgrade;

  // ── GALERIA ──
  const galeriaCombinada = [
    ...(pacote?.imagem_principal ? [pacote.imagem_principal] : []),
    ...getArraySeguro(pacote?.imagens_galeria),
    ...getArraySeguro(hotelSelecionado?.galeria)
  ];

  const fecharGaleria = () => setFotoExpandidaIndex(null);
  const proximaFoto = (e: React.MouseEvent) => { e.stopPropagation(); setFotoExpandidaIndex((prev) => (prev! + 1) % galeriaCombinada.length); };
  const fotoAnterior = (e: React.MouseEvent) => { e.stopPropagation(); setFotoExpandidaIndex((prev) => (prev! - 1 + galeriaCombinada.length) % galeriaCombinada.length); };

  const formatarDataIso = (data: Date) =>
    `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

  const handleReserva = () => {
    if (!checkin || !checkout) {
      alert("Por favor, seleccione uma data de início válida no calendário.");
      document.getElementById('motor-reservas')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!hotelDisponivel) {
      alert("Pedimos desculpa, mas o quarto selecionado está esgotado para estas datas. Por favor, escolha outro período ou acomodação.");
      return;
    }
    router.push(`/checkout?pacote=${pacote?.id}&hotel=${hotelSelecionado?.id}&quarto=${tipoQuarto}&guia=${guiaSelecionado?.id}&checkin=${formatarDataIso(checkin)}&checkout=${formatarDataIso(checkout)}&adultos=${adultos}&quartos=${quartos}&preco=${valorTotalFinal}`);
  };

  if (!mounted || loading || !pacote || !mesAtualCalendario) return (
    <div className={`${inter.className} min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]`}>
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs">A preparar portal de reservas...</p>
    </div>
  );

  const imagensStandard = hotelSelecionado && getArraySeguro(hotelSelecionado.quarto_standard_imagens).length > 0 
    ? getArraySeguro(hotelSelecionado.quarto_standard_imagens) 
    : ["https://images.unsplash.com/photo-1618773928121-c32242fa11f5?q=80&w=1740", "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?q=80&w=1674"];
  const imagensLuxo = hotelSelecionado && getArraySeguro(hotelSelecionado.quarto_luxo_imagens).length > 0 
    ? getArraySeguro(hotelSelecionado.quarto_luxo_imagens) 
    : ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1740", "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1740"];

  const guiaExibicao = guiaSelecionado || (guiasDisponiveis.length > 0 ? guiasDisponiveis[0] : null);
  const guiaNome = guiaExibicao?.nome || 'Guia Credenciado';
  const guiaImagem = guiaExibicao?.imagem_url || FALLBACK_GUIA_IMAGE;
  const guiaEspecialidade = guiaExibicao?.especialidade || 'Especialista da Região';
  const guiaDescricao = guiaExibicao?.descricao_guia || 'Guia experiente, conhecedor profundo da região, apaixonado por partilhar histórias e garantir uma experiência única e segura.';

  return (
    <div className={`${inter.className} min-h-screen flex flex-col bg-[#FDFCF7] text-slate-900`}>

      {/* ── HEADER ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Rotas','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`} className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
              Cartão Residente
            </Link>
          </nav>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas Turísticas</Link>
            <Link href="/eventos" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Agenda Cultural</Link>
            <Link href="/pacotes" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Pacotes</Link>
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Roteiros</Link>
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <div className="flex-1">
        {/* HERO IMAGEM (estilo passeios) */}
        <div className="w-full h-[40vh] md:h-[60vh] relative bg-[#002f40] overflow-hidden">
          <Link href="/pacotes" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-bold text-slate-800 bg-white/90 backdrop-blur-sm hover:bg-white px-4 py-2 rounded-full shadow-lg transition-colors">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <Image
            src={pacote.imagem_principal || FALLBACK_IMAGE}
            alt={pacote.titulo}
            fill
            className="object-cover opacity-80"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002f40]/90 via-[#002f40]/40 to-transparent" />
        </div>

        {/* GRID PRINCIPAL COM SOBREPOSIÇÃO (igual aos passeios) */}
        <div className="mx-auto w-full max-w-7xl px-5 py-12 flex flex-col lg:flex-row items-start gap-12 relative z-10 -mt-20">
          {/* COLUNA ESQUERDA (CONTEÚDO) */}
          <div className="flex-1 w-full min-w-0 flex flex-col gap-10">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {pacote.categoria || 'Aventura'}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                  <MapPin size={15} className="text-[#009640]" /> São Geraldo do Araguaia, PA
                </span>
              </div>

              <h1 className={`${jakarta.className} text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-8`}>
                {pacote.titulo}
              </h1>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 border-t border-b border-slate-100 py-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                    <CalendarIcon size={14} className="text-[#00577C]"/> Data
                  </p>
                  <p className="font-bold text-slate-800 capitalize leading-tight">Período disponível</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                    <Clock size={14} className="text-[#00577C]"/> Duração
                  </p>
                  <p className="font-bold text-slate-800 leading-tight">{pacote.dias} dias / {pacote.noites} noites</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                    <Users size={14} className="text-[#00577C]"/> Acomodação
                  </p>
                  <p className="font-bold text-slate-800 leading-tight">Hotel incluso</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                    <Compass size={14} className="text-[#00577C]"/> Guia
                  </p>
                  <p className="font-bold text-slate-800 leading-tight">Especializado</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className={`${jakarta.className} text-2xl font-black text-[#00577C] mb-4`}>Sobre a Experiência</h3>
                <p className="text-lg text-slate-500 italic font-medium border-l-4 border-[#F9C400] pl-5 mb-6">{pacote.descricao_curta}</p>
                <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                  {pacote.roteiro_detalhado}
                </div>
              </div>
            </div>

            {/* ACOMODAÇÃO (mantido) */}
            <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Bed size={150}/></div>
              <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-6 flex items-center gap-3 relative z-10`}>
                <div className="w-10 h-10 bg-[#00577C] text-white rounded-xl flex items-center justify-center"><Bed size={20} /></div>
                Acomodação Inclusa
              </h3>

              {hoteisDisponiveis.length > 1 && (
                <div className="space-y-4 mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecione o hotel desejado:</p>
                  <div className="flex flex-wrap gap-2">
                    {hoteisDisponiveis.map((hotel) => (
                      <button
                        key={hotel.id}
                        onClick={() => setHotelSelecionado(hotel)}
                        className={`px-4 py-2 rounded-xl border-2 font-bold text-xs transition-colors ${hotelSelecionado?.id === hotel.id ? 'border-[#00577C] bg-blue-50/50 text-[#00577C]' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                      >
                        {hotel.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hotelSelecionado && (
                <div className="flex flex-col gap-6">
                  <h4 className={`${jakarta.className} text-lg font-bold text-slate-800`}>Acomodações no {hotelSelecionado.nome}</h4>
                  
                  {/* Quarto Standard */}
                  <div className={`border-2 rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all cursor-pointer ${tipoQuarto === 'standard' ? 'border-[#00577C] ring-4 ring-blue-50/50' : 'border-slate-200 bg-slate-50/50'}`} onClick={() => setTipoQuarto('standard')}>
                    <div className="flex justify-between items-center p-4 bg-white border-b">
                      <h5 className={`${jakarta.className} font-bold text-[#00577C]`}>{hotelSelecionado.quarto_standard_nome || 'Quarto Standard'}</h5>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tipoQuarto === 'standard' ? 'border-[#00577C] bg-[#00577C]' : 'border-slate-300'}`}>
                        {tipoQuarto === 'standard' && <Check size={12} className="text-white" strokeWidth={4} />}
                      </div>
                    </div>
                    <div className="flex flex-col xl:flex-row">
                      <div className="w-full xl:w-2/5 p-4 border-r">
                        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 group">
                          <Image src={imagensStandard[imgIdxStandard]} alt="Standard" fill className="object-cover" />
                          <button onClick={(e) => { e.stopPropagation(); setImgIdxStandard((prev) => (prev - 1 + imagensStandard.length) % imagensStandard.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 text-white rounded-full">‹</button>
                          <button onClick={(e) => { e.stopPropagation(); setImgIdxStandard((prev) => (prev + 1) % imagensStandard.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 text-white rounded-full">›</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <span className="flex items-center gap-1"><Wind size={12} /> Ar-condicionado</span>
                          <span className="flex items-center gap-1"><Wifi size={12} /> Wi-Fi Grátis</span>
                          <span className="flex items-center gap-1"><Bath size={12} /> Banheiro Priv.</span>
                        </div>
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <p className="text-[9px] font-black uppercase text-slate-400">Cancelamento grátis (24h)</p>
                        <div className="mt-auto text-right">
                          <p className="text-[9px] font-black uppercase text-slate-400">Taxa Base / Noite</p>
                          <p className={`${jakarta.className} text-2xl font-black text-slate-900`}>{formatarMoeda(parseValor(hotelSelecionado.quarto_standard_preco))}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quarto Luxo */}
                  <div className={`border-2 rounded-2xl overflow-hidden shadow-sm flex flex-col relative transition-all cursor-pointer ${tipoQuarto === 'luxo' ? 'border-[#F9C400] ring-4 ring-yellow-50/50' : 'border-slate-200 bg-slate-50/50'}`} onClick={() => setTipoQuarto('luxo')}>
                    <div className="absolute top-0 right-0 bg-[#00577C] text-white text-[9px] font-black px-3 py-1 rounded-bl-xl">Premium</div>
                    <div className="flex justify-between items-center p-4 bg-white border-b">
                      <h5 className={`${jakarta.className} font-bold text-[#00577C]`}>{hotelSelecionado.quarto_luxo_nome || 'Suíte Luxo'}</h5>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tipoQuarto === 'luxo' ? 'border-[#00577C] bg-[#00577C]' : 'border-slate-300'}`}>
                        {tipoQuarto === 'luxo' && <Check size={12} className="text-white" strokeWidth={4} />}
                      </div>
                    </div>
                    <div className="flex flex-col xl:flex-row">
                      <div className="w-full xl:w-2/5 p-4 border-r">
                        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 group">
                          <Image src={imagensLuxo[imgIdxLuxo]} alt="Luxo" fill className="object-cover" />
                          <button onClick={(e) => { e.stopPropagation(); setImgIdxLuxo((prev) => (prev - 1 + imagensLuxo.length) % imagensLuxo.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 text-white rounded-full">‹</button>
                          <button onClick={(e) => { e.stopPropagation(); setImgIdxLuxo((prev) => (prev + 1) % imagensLuxo.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 text-white rounded-full">›</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <span className="flex items-center gap-1"><Wind size={12} /> Ar-condicionado</span>
                          <span className="flex items-center gap-1"><Wifi size={12} /> Wi-Fi Premium</span>
                          <span className="flex items-center gap-1"><Bath size={12} /> Banheira/Spa</span>
                        </div>
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <p className="text-[9px] font-black uppercase text-slate-400">Pequeno-almoço incluso</p>
                        <div className="mt-auto text-right">
                          <p className="text-[9px] font-black uppercase text-slate-400">Taxa Base / Noite</p>
                          <p className={`${jakarta.className} text-2xl font-black text-[#00577C]`}>{formatarMoeda(parseValor(hotelSelecionado.quarto_luxo_preco))}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* POLÍTICAS (mantido) */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
              <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-6`}>Políticas do Pacote</h3>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-x-8 gap-y-5 text-sm">
                <div className="font-black text-slate-800">Cancelamento</div>
                <div className="text-slate-600 font-medium">Reembolso integral se cancelado até 48 horas antes da data de check-in programada.</div>
                <div className="md:col-span-2 h-px bg-slate-100 my-2"></div>
                <div className="font-black text-slate-800">Inclusões</div>
                <div className="text-slate-600 font-medium">O pacote inclui os custos do guia diário, do quarto de hotel selecionado e outros serviços já inclusos.</div>
                <div className="md:col-span-2 h-px bg-slate-100 my-2"></div>
                <div className="font-black text-slate-800">Clima e Segurança</div>
                <div className="text-slate-600 font-medium">O roteiro pode sofrer alterações de ordem sem aviso prévio caso as condições climáticas não garantam a segurança.</div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (RESERVA + GUIA) */}
          <div className="w-full lg:w-[420px] shrink-0 lg:self-start">
            <div className="lg:sticky lg:top-32 space-y-6">
              {/* CARD DE RESERVA (estilo passeios) */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200">
                <div className="border-b border-slate-100 pb-6 mb-6 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#009640] mb-1">Por Pessoa</p>
                    <p className={`${jakarta.className} text-4xl font-black text-slate-900`}>{formatarMoeda(valorPorPessoa)}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-1">Vagas</p>
                     <p className="text-sm font-bold text-slate-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">{pacote.vagas_totais || 20} Restantes</p>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C]">1. Quantidade de Pessoas</p>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors rounded-2xl p-4">
                     <div className="flex items-center gap-3">
                        <Users size={20} className="text-[#00577C]"/>
                        <span className="font-bold text-sm text-slate-800">Participantes</span>
                     </div>
                     <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        <button onClick={() => setAdultos(Math.max(1, adultos - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-[#00577C] font-black text-xl transition-all">-</button>
                        <span className="font-black text-xl w-6 text-center text-[#00577C]">{adultos}</span>
                        <button onClick={() => setAdultos(Math.min(pacote.vagas_totais || 20, adultos + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-[#00577C] font-black text-xl transition-all">+</button>
                     </div>
                  </div>
                </div>

                {/* CALENDÁRIO (compacto) */}
                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-3">Selecione a data de início</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner">
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente - 1))} className="p-1 hover:bg-slate-200 rounded-full"><ChevronLeft size={16} /></button>
                      <p className="font-bold text-slate-800 capitalize text-sm">{mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                      <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente + 1))} className="p-1 hover:bg-slate-200 rounded-full"><ChevronRight size={16} /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                      {['D','S','T','Q','Q','S','S'].map((d, i) => <span key={i} className="text-[9px] font-black text-slate-400">{d}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 mt-1">
                      {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                      {Array.from({ length: diasMes }).map((_, i) => {
                        const dia = i + 1;
                        const dataAtual = new Date(anoCorrente, mesCorrente, dia);
                        const isValida = isDataInicioValida(dataAtual);
                        const isCheckin = checkin && dataAtual.getTime() === checkin.getTime();
                        const isCheckout = checkout && dataAtual.getTime() === checkout.getTime();
                        const isInBetween = checkin && checkout && dataAtual > checkin && dataAtual < checkout;
                        const isHovered = hoverDate && checkin && !checkout && dataAtual > checkin && dataAtual <= hoverDate;

                        let bgClass = "bg-transparent hover:bg-slate-200 text-slate-800";
                        if (!isValida) bgClass = "bg-transparent text-slate-300 cursor-not-allowed line-through";
                        else if (isCheckin || isCheckout) bgClass = "bg-[#00577C] text-white shadow-md rounded-md scale-105 z-10";
                        else if (isInBetween || isHovered) bgClass = "bg-[#00577C]/10 text-[#00577C] rounded-none";

                        return (
                          <button
                            key={dia}
                            disabled={!isValida}
                            onClick={() => handleDateClick(dataAtual)}
                            onMouseEnter={() => setHoverDate(dataAtual)}
                            onMouseLeave={() => setHoverDate(null)}
                            className={`w-8 h-8 text-xs font-semibold transition-all ${bgClass}`}
                          >
                            {dia}
                          </button>
                        );
                      })}
                    </div>
                    {!algumaDataValidaNoMes && (
                      <p className="text-[10px] text-center text-amber-600 mt-3 p-2 bg-amber-50 rounded-xl">Nenhuma data disponível neste mês.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 py-4 border-t border-b border-slate-100 mb-6">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quartos Requeridos</span>
                     <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <button onClick={() => setQuartos(Math.max(1, quartos - 1))} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">-</button>
                        <span className="font-bold text-xs w-4 text-center">{quartos}</span>
                        <button onClick={() => setQuartos(quartos + 1)} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black">+</button>
                     </div>
                  </div>
                </div>

                {checkin && checkout && !hotelDisponivel && !calculandoPreco && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-start gap-3 border border-red-100">
                     <AlertCircle size={16} className="shrink-0 mt-0.5" />
                     <p className="text-[10px] md:text-xs font-bold leading-relaxed">Acomodação esgotada para as datas selecionadas.</p>
                  </div>
                )}

                <div className="flex flex-col gap-2 bg-[#009640]/10 p-6 rounded-2xl mb-6 border border-[#009640]/20">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-black text-[#009640] uppercase block mb-1">Total Estimado</span>
                      <span className="text-xs font-bold text-slate-600">{adultos} {adultos === 1 ? 'pessoa' : 'pessoas'}</span>
                    </div>
                    <span className={`${jakarta.className} text-3xl font-black text-[#009640]`}>{formatarMoeda(valorTotalFinal)}</span>
                  </div>
                </div>

                <button
                  disabled={!hotelDisponivel || calculandoPreco || !checkin}
                  onClick={handleReserva}
                  className={`${jakarta.className} flex items-center justify-center gap-3 w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-5 rounded-2xl font-black text-lg transition-transform hover:-translate-y-1 shadow-xl ${(!hotelDisponivel || !checkin) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : ''}`}
                >
                  {calculandoPreco ? 'A calcular...' : (!checkin ? 'Selecione uma data' : (!hotelDisponivel ? 'Esgotado' : 'Prosseguir para Checkout'))}
                  {checkin && hotelDisponivel && !calculandoPreco && <ChevronRightIcon size={20} />}
                </button>

                <p className="mt-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <ShieldCheck size={13} className="text-[#00577C]" /> Reserva Oficial SagaTurismo
                </p>
              </div>

              {/* BLOCO DO GUIA (igual ao passeio) */}
              {guiasDisponiveis.length > 0 && (
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-200">
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-900 mb-5 flex items-center gap-2`}>
                    <UserCheck size={22} className="text-[#009640]" />
                    Seu Guia
                  </h3>
                  
                  {guiasDisponiveis.length > 1 && (
                    <div className="mb-5 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escolha o guia:</p>
                      <div className="flex flex-col gap-2">
                        {guiasDisponiveis.map((guia) => (
                          <label
                            key={guia.id}
                            onClick={() => setGuiaSelecionado(guia)}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${guiaSelecionado?.id === guia.id ? 'border-[#009640] bg-green-50/20' : 'border-slate-100 hover:border-slate-200'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100">
                                <Image src={guia.imagem_url || FALLBACK_GUIA_IMAGE} alt={guia.nome} fill className="object-cover" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-slate-800">{guia.nome}</p>
                                <p className="text-[10px] text-slate-500">{guia.especialidade}</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${guiaSelecionado?.id === guia.id ? 'border-[#009640] bg-[#009640]' : 'border-slate-300'}`}>
                              {guiaSelecionado?.id === guia.id && <Check size={12} className="text-white" strokeWidth={4} />}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col items-center text-center">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-lg border-2 border-[#009640] mb-4">
                      <Image src={guiaImagem} alt={guiaNome} fill className="object-cover" />
                    </div>
                    <h4 className={`${jakarta.className} text-xl font-black text-slate-800`}>{guiaNome}</h4>
                    <p className="text-xs font-bold text-[#009640] uppercase tracking-wider mt-1">{guiaEspecialidade}</p>
                    <p className="text-slate-500 text-sm leading-relaxed mt-4 text-justify">
                      {guiaDescricao}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GALERIA (mantida) */}
      {galeriaCombinada.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-5 pb-20 relative z-10">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-xl border border-slate-100">
            <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-8`}>Galeria de Imagens</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {galeriaCombinada.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setFotoExpandidaIndex(idx)}
                  className="relative aspect-square rounded-2xl overflow-hidden shadow-md group bg-slate-200 cursor-pointer"
                >
                  <Image src={url} alt={`Galeria ${idx + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-[#00577C]/0 group-hover:bg-[#00577C]/40 transition-colors duration-300 flex items-center justify-center">
                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-10 h-10 scale-50 group-hover:scale-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {fotoExpandidaIndex !== null && galeriaCombinada.length > 0 && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-5 animate-in fade-in duration-200"
          onClick={fecharGaleria}
        >
          <button onClick={fecharGaleria} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full z-[110]"><X size={24} /></button>
          <button onClick={fotoAnterior} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full z-[110]"><ChevronLeft size={32} /></button>
          <div className="relative w-full max-w-6xl aspect-video rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <Image src={galeriaCombinada[fotoExpandidaIndex]} alt={`Visualização ${fotoExpandidaIndex + 1}`} fill className="object-contain" />
          </div>
          <button onClick={proximaFoto} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full z-[110]"><ChevronRight size={32} /></button>
          <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
            <p className="text-white font-bold tracking-widest text-sm bg-black/60 inline-block px-5 py-2 rounded-full backdrop-blur-sm">{fotoExpandidaIndex + 1} de {galeriaCombinada.length}</p>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de São Geraldo do Araguaia" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">© 2026 Secretaria Municipal de Turismo - SGA | Todos os direitos reservados</p>
              <p className="text-[10px] font-bold text-slate-400/80">CNPJ: 10.249.241/0001-22</p>
            </div>
          </div>
          <div className="flex gap-10">
            <div className="text-left border-l-2 border-slate-100 pl-9">
              <p className="text-[10px] font-black text-[#00577C] uppercase mb-1">Contato Oficial</p>
              <p className="text-xs font-bold text-slate-500 tracking-tight">setursaga@gmail.com</p>
            </div>
            <ShieldCheck size={40} className="text-[#009640] opacity-30" />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PacoteDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-[#00577C]" size={48} /></div>}>
      <PacoteDetalheContent />
    </Suspense>
  );
}