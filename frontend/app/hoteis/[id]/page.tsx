'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  ArrowLeft, MapPin, Star, CheckCircle2, Info, 
  Loader2, Menu, X, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, Bed, ChevronRight as ChevronRightIcon,
  Users, Award, Phone, Mail, Globe,
  Wind, Wifi, Bath, CreditCard, Coffee, Edit3, Layers,
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── UTILITÁRIOS ──
const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

type Hotel = {
  id: string; nome: string; tipo: string; descricao: string; estrelas: number; imagem_url: string;
  endereco?: string; preco_medio?: string;
  comodidades?: string[]; galeria?: string[];
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

type QuartoFisico = {
  id: string;
  nome_quarto: string;
  preco_quarto: number;
  descricao: string;
  capacidade: number;
  quantidade_total_quartos: number;
  imagem_url: string;
};

// Estrutura para gerir o estado dinâmico dos preços da API
type PrecoDinamico = {
  valor_total: number;
  disponivel: boolean;
  noites: number;
};

function HotelDetalheContent() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();

  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ── DADOS DO BANCO ──
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [quartosDb, setQuartosDb] = useState<QuartoFisico[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // ── ESTADOS DE PESQUISA ──
  const [checkin, setCheckin] = useState<Date | null>(() => {
    const ci = searchParams.get('checkin');
    return ci && ci !== 'null' && ci !== '' ? new Date(ci + 'T00:00:00') : null;
  });

  const [checkout, setCheckout] = useState<Date | null>(() => {
    const co = searchParams.get('checkout');
    return co && co !== 'null' && co !== '' ? new Date(co + 'T00:00:00') : null;
  });

  const [mesAtualCalendario, setMesAtualCalendario] = useState<Date>(() => {
    const ci = searchParams.get('checkin');
    return ci && ci !== 'null' && ci !== '' ? new Date(ci + 'T00:00:00') : new Date();
  });

  const [adultos, setAdultos] = useState(() => Number(searchParams.get('adultos')) || 2);
  const [criancas, setCriancas] = useState(() => Number(searchParams.get('criancas')) || 0);
  const [qtdQuartosSelecionados, setQtdQuartosSelecionados] = useState(() => Number(searchParams.get('quartos')) || 1);

  // ── ESTADO DINÂMICO DE PREÇOS (Calculados pela API) ──
  const [precosDinâmicos, setPrecosDinâmicos] = useState<Record<string, PrecoDinamico>>({});
  const [calculandoPreco, setCalculandoPreco] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. CARREGAMENTO INICIAL: HOTEL E QUARTOS FÍSICOS
  useEffect(() => {
    async function fetchHotelEQuartos() {
      try {
        const { data: hotelData, error: hotelError } = await supabase.from('hoteis').select('*').eq('id', id).single();
        if (hotelError) throw new Error("Erro ao buscar a hospedagem.");
        
        const { data: quartosData, error: quartosError } = await supabase.from('tipos_quarto').select('*').eq('hotel_id', id).order('preco_quarto', { ascending: true });
        if (quartosError) throw new Error("Erro ao mapear o inventário de quartos.");

        if (hotelData) {
          setHotel(hotelData);
          setQuartosDb(quartosData || []);
        } else {
          setErro("Hospedagem não encontrada.");
        }
      } catch (err: any) {
        setErro(err.message || "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchHotelEQuartos();
  }, [id]);

  // 2. REATIVIDADE: ATUALIZAÇÃO PREÇOS DIÁRIOS VIA API RAILWAY EM LOTE
  useEffect(() => {
    if (!hotel || quartosDb.length === 0) return;

    if (!checkin || !checkout) {
      const precosBase: Record<string, PrecoDinamico> = {};
      quartosDb.forEach(q => {
        precosBase[q.id] = { valor_total: q.preco_quarto * qtdQuartosSelecionados, disponivel: true, noites: 1 };
      });
      setPrecosDinâmicos(precosBase);
      return;
    }

    async function atualizarPrecosDinamicos() {
      setCalculandoPreco(true);
      const checkinStr = formatarDataIso(checkin!);
      const checkoutStr = formatarDataIso(checkout!);

      try {
        const promessas = quartosDb.map(quarto => 
          fetch(`https://sagaturismo-production.up.railway.app/api/v1/public/hoteis/${id}/calcular-preco?tipo_quarto=${encodeURIComponent(quarto.nome_quarto)}&checkin=${checkinStr}&checkout=${checkoutStr}&quantidade=${qtdQuartosSelecionados}&adultos=${adultos}`)
            .then(res => res.json())
            .then(data => ({ id: quarto.id, data }))
        );

        const resultados = await Promise.all(promessas);
        
        const novosPrecos: Record<string, PrecoDinamico> = {};
        resultados.forEach(res => {
          if (res.data.sucesso) {
            novosPrecos[res.id] = {
              valor_total: res.data.valor_total,
              disponivel: res.data.disponivel,
              noites: res.data.noites
            };
          } else {
            novosPrecos[res.id] = { valor_total: 0, disponivel: false, noites: 0 };
          }
        });

        setPrecosDinâmicos(novosPrecos);
      } catch (err) {
        console.error("Erro ao sincronizar valores dinâmicos do calendário:", err);
      } finally {
        setCalculandoPreco(false);
      }
    }

    atualizarPrecosDinamicos();
  }, [checkin, checkout, qtdQuartosSelecionados, adultos, hotel, quartosDb, id]);

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

  const handleReserva = (quarto: QuartoFisico) => {
    if (!checkin || !checkout) {
      alert("Por favor, selecione as datas de Check-in e Check-out no calendário na lateral antes de reservar.");
      document.getElementById('motor-reservas')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    const infoPreco = precosDinâmicos[quarto.id];
    if (!infoPreco || !infoPreco.disponivel) {
      alert("Pedimos desculpa, mas esta categoria de quarto está esgotada ou indisponível para o período selecionado.");
      return;
    }

    router.push(`/checkout-hotel?hotel=${hotel?.id}&quarto=${encodeURIComponent(quarto.nome_quarto)}&checkin=${formatarDataIso(checkin)}&checkout=${formatarDataIso(checkout)}&adultos=${adultos}&criancas=${criancas}&quartos=${qtdQuartosSelecionados}`);
  };

  if (!mounted || loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]">
      <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin mb-4 text-[#00577C]" />
      <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs">Carregando inventário da hospedagem...</p>
    </div>
  );

  if (erro || !hotel) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-6 text-center">
      <h1 className="text-2xl md:text-3xl font-black mb-4 text-[#00577C]">Alojamento Não Encontrado</h1>
      <p className="text-slate-500 mb-8 max-w-md text-sm md:text-base">{erro}</p>
      <Link href="/hoteis" className="bg-[#00577C] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg">Voltar aos Hotéis</Link>
    </div>
  );

  const anoCorrente = mesAtualCalendario.getFullYear();
  const mesCorrente = mesAtualCalendario.getMonth();
  const diasMes = diasDoMes(anoCorrente, mesCorrente);
  const primeiroDia = primeiroDiaDoMes(anoCorrente, mesCorrente);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // ◄── LÓGICA DE FILTRAGEM POR CAPACIDADE ──►
  const capacidadeNecessariaPorQuarto = Math.ceil(adultos / qtdQuartosSelecionados);
  const quartosFiltrados = quartosDb.filter(quarto => quarto.capacidade >= capacidadeNecessariaPorQuarto);

  return (
    <div className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 flex flex-col`}>
      
      {/* ── HEADER ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                {/* Removido o filtro invertido para manter as cores originais da logo */}
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Roteiros','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
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

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas Turísticas</Link>
            <Link href="/eventos" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Agenda Cultural</Link>
            <Link href="/pacotes" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Pacotes</Link>
            <Link href="/roteiro" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Roteiros</Link>
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <div className="w-full h-[60vh] md:h-[60vh] relative bg-[#002f40] mt-[0px] md:mt-[0px]">
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
               <div className="bg-[#00577C]/10 p-2 rounded-lg text-[#00577C]"><CalendarIcon size={16}/></div>
               <div className="text-left leading-none">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Estadia</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {checkin ? checkin.toLocaleDateString('pt-BR', {day:'2-digit', month:'short'}) : 'Datas'} — {checkout ? checkout.toLocaleDateString('pt-BR', {day:'2-digit', month:'short'}) : 'Datas'}
                  </p>
               </div>
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex items-center gap-3 shrink-0">
               <div className="bg-[#00577C]/10 p-2 rounded-lg text-[#00577C]"><Users size={16}/></div>
               <div className="text-left leading-none">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Hóspedes</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">{adultos} Ad. · {qtdQuartosSelecionados} Qts.</p>
               </div>
            </div>
            <button onClick={() => document.getElementById('motor-reservas')?.scrollIntoView({ behavior: 'smooth' })} className="ml-auto bg-slate-50 p-2.5 rounded-full border border-slate-200 text-[#00577C] shadow-sm"><Edit3 size={16}/></button>
         </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-5 py-8 md:py-12 flex flex-col lg:flex-row items-start gap-8 relative z-10">
        
        {/* COLUNA ESQUERDA */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-6 md:gap-8">
          
          <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden text-left">
             <div className="bg-slate-50 p-5 md:p-6 border-b border-slate-200">
               <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-[#00577C]`}>Acomodações Disponíveis</h3>
               <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Inventário atualizado em tempo real de acordo com as tarifas do hoteleiro.</p>
             </div>
             
             <div className="p-4 md:p-6 flex flex-col gap-6 md:gap-8">
                
                {/* ◄── FILTRAGEM INTELIGENTE DOS QUARTOS AQUI ──► */}
                {quartosDb.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-bold text-sm">Este hotel ainda não disponibilizou o seu inventário de quartos.</p>
                  </div>
                ) : quartosFiltrados.length === 0 ? (
                  <div className="text-center p-8 bg-[#F9C400]/10 rounded-2xl border border-dashed border-[#F9C400]/40">
                    <AlertCircle className="mx-auto text-[#F9C400] mb-3" size={32} />
                    <p className="text-[#00577C] font-black text-sm">Não há acomodações com capacidade para {capacidadeNecessariaPorQuarto} pessoa(s) por quarto.</p>
                    <p className="text-slate-500 font-medium text-xs mt-2">Por favor, aumente o número de quartos na lateral para dividir os seus hóspedes.</p>
                  </div>
                ) : (
                  quartosFiltrados.map((quarto) => {
                    const infoPreco = precosDinâmicos[quarto.id] || { valor_total: quarto.preco_quarto * qtdQuartosSelecionados, disponivel: true, noites: 1 };
                    const esgotado = !infoPreco.disponivel;

                    return (
                      <div key={quarto.id} className={`border border-slate-200 rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-sm flex flex-col transition-opacity ${esgotado ? 'opacity-80 bg-slate-50 grayscale-[20%]' : 'bg-white'}`}>
                         
                         <div className="flex justify-between items-center p-4 md:p-5 bg-slate-50 border-b border-slate-200">
                           <h4 className={`${jakarta.className} font-black text-base md:text-lg text-[#00577C] uppercase`}>{quarto.nome_quarto}</h4>
                           {!esgotado && <span className="bg-[#009640]/10 text-[#009640] px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1"><CheckCircle2 size={12}/> Disponível</span>}
                           {esgotado && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1">Esgotado nas datas</span>}
                         </div>
                         
                         <div className="flex flex-col xl:flex-row">
                            
                            <div className="w-full xl:w-2/5 p-4 md:p-5 border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col">
                               <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 md:mb-4 bg-slate-200">
                                  <Image src={quarto.imagem_url || hotel.imagem_url} alt={quarto.nome_quarto} fill className="object-cover" />
                               </div>
                               <p className="text-xs text-slate-500 mb-3 line-clamp-2">{quarto.descricao || 'Quarto confortável e preparado para a sua estadia.'}</p>
                               <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs text-[#00577C] font-bold mt-auto">
                                  <span className="flex items-center gap-1.5"><Layers size={12}/> Quartos disponiveis: {quarto.quantidade_total_quartos}</span>
                                  <span className="flex items-center gap-1.5"><Users size={12}/> Capacidade do quarto: {quarto.capacidade} pessoa(s)</span>
                               </div>
                            </div>
                            
                            <div className="w-full xl:w-3/5 flex flex-col sm:flex-row">
                               <div className="flex-1 p-4 md:p-5 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col justify-center">
                                  <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Resumo</p>
                                  <ul className="space-y-2 md:space-y-3">
                                     <li className="flex items-start gap-2 text-xs md:text-sm text-[#009640] font-bold"><CheckCircle2 size={16} /> Cancelamento flexível</li>
                                     <li className="flex items-start gap-2 text-xs md:text-sm text-[#00577C] font-bold"><CreditCard size={16} /> Reserva segura</li>
                                  </ul>
                               </div>
                               <div className="w-full sm:w-48 p-5 flex flex-col items-center sm:items-end justify-center bg-slate-50/50">
                                  <p className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 leading-none mb-1`}>
                                    {calculandoPreco ? '...' : formatarMoeda(infoPreco.valor_total)}
                                  </p>
                                  <p className="text-[9px] md:text-[10px] text-slate-500 font-bold mb-4">{infoPreco.noites} noite(s) · {qtdQuartosSelecionados} quarto(s)</p>
                                  <button 
                                    disabled={esgotado || calculandoPreco}
                                    onClick={() => handleReserva(quarto)} 
                                    className={`w-full py-3.5 md:py-3 rounded-xl font-black uppercase text-[10px] md:text-xs tracking-widest transition-all shadow-md active:scale-95 ${
                                      esgotado ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none active:scale-100' : 'bg-[#00577C] hover:bg-[#004466] text-white'
                                    }`}
                                  >
                                     {calculandoPreco ? 'Calculando...' : esgotado ? 'Esgotado' : 'Reservar'}
                                  </button>
                               </div>
                            </div>
                         </div>
                      </div>
                    )
                  })
                )}
             </div>
          </section>

          {/* AVALIAÇÕES E CONTATOS (INALTERADOS) */}
          <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm p-5 md:p-10 text-left">
             <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-[#00577C] mb-6`}>Avaliações dos hóspedes</h3>
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
                            <div className="w-full bg-slate-200 rounded-full h-1"><div className="bg-[#F9C400] h-1 rounded-full" style={{ width: `${(item.score / 10) * 100}%` }}></div></div>
                         </div>
                      ))}
                   </div>
                </div>
                <div className="w-full lg:w-2/3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6">
                   <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed italic">"O hotel superou as expectativas. As fotos correspondem perfeitamente à realidade e a gestão de reservas é impecável."</p>
                   <p className="text-[10px] text-slate-400 font-bold mt-2">— Cliente Verificado, SagaTurismo</p>
                </div>
             </div>
          </section>

          <section className="bg-[#002f40] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden text-left">
             <h3 className={`${jakarta.className} text-xl md:text-2xl font-black mb-2`}>Informações de Contacto</h3>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 rounded-xl p-4 border border-white/10"><Phone className="text-[#F9C400] mb-2" size={18} /><p className="text-[10px] text-white/50 uppercase tracking-widest">WhatsApp</p><p className="font-bold text-xs md:text-sm truncate mt-1">{hotel.contatos?.telefone || '+55 (94) 90000-0000'}</p></div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/10"><Mail className="text-[#F9C400] mb-2" size={18} /><p className="text-[10px] text-white/50 uppercase tracking-widest">E-mail</p><p className="font-bold text-xs md:text-sm truncate mt-1">{hotel.contatos?.email || 'contato@hotel.com.br'}</p></div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/10"><Globe className="text-[#F9C400] mb-2" size={18} /><p className="text-[10px] text-white/50 uppercase tracking-widest">Website</p><p className="font-bold text-xs md:text-sm truncate mt-1">{hotel.contatos?.website || 'www.saga.com.br'}</p></div>
             </div>
          </section>

        </div>

        {/* ── COLUNA DIREITA: CALENDÁRIO ── */}
        <div id="motor-reservas" className="w-full lg:w-[380px] shrink-0 h-fit lg:self-start relative z-30">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-200 text-left">
             <h3 className={`${jakarta.className} text-lg md:text-xl font-black text-[#00577C] mb-5 flex items-center gap-2`}>
                <CalendarIcon className="text-[#00577C]" size={20}/> Escolher Período
             </h3>

             <div className="space-y-4 mb-6">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner">
                     <div className="flex items-center justify-between mb-3">
                        <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente - 1))} className="p-1 hover:bg-slate-200 rounded-full text-[#00577C]"><ChevronLeft size={16}/></button>
                        <p className={`${jakarta.className} font-black text-[#00577C] capitalize text-xs md:text-sm`}>{mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                        <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente + 1))} className="p-1 hover:bg-slate-200 rounded-full text-[#00577C]"><ChevronRight size={16}/></button>
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

             <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Adultos</span>
                   <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                      <button type="button" onClick={() => setAdultos(Math.max(1, adultos - 1))} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black hover:bg-slate-200 rounded">-</button>
                      <span className="font-bold text-xs w-4 text-center text-slate-800">{adultos}</span>
                      <button type="button" onClick={() => setAdultos(adultos + 1)} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black hover:bg-slate-200 rounded">+</button>
                   </div>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Quartos</span>
                   <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                      <button type="button" onClick={() => setQtdQuartosSelecionados(Math.max(1, qtdQuartosSelecionados - 1))} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black hover:bg-slate-200 rounded">-</button>
                      <span className="font-bold text-xs w-4 text-center text-slate-800">{qtdQuartosSelecionados}</span>
                      <button type="button" onClick={() => setQtdQuartosSelecionados(qtdQuartosSelecionados + 1)} className="w-6 h-6 flex justify-center items-center text-[#00577C] font-black hover:bg-slate-200 rounded">+</button>
                   </div>
                </div>
             </div>
             
          </div>
        </div>
      </div>

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

export default function HotelDetalhePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#00577C]" />
        <p className="font-bold uppercase tracking-widest text-xs">A Sincronizar motor de reservas...</p>
      </div>
    }>
      <HotelDetalheContent />
    </Suspense>
  );
}