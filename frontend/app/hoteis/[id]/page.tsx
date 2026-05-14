'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, MapPin, Star, CheckCircle2, Info, 
  Loader2, Menu, X, ChevronLeft, ChevronRight, ZoomIn, 
  Calendar as CalendarIcon, Bed, ChevronRight as ChevronRightIcon
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

type Hotel = {
  id: string; nome: string; tipo: string; descricao: string; estrelas: number; imagem_url: string;
  endereco?: string; preco_medio?: string;
  quarto_standard_nome?: string; quarto_standard_preco?: any;
  quarto_luxo_nome?: string; quarto_luxo_preco?: any;
  comodidades?: string[]; galeria?: string[];
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

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [disponibilidadeDb, setDisponibilidadeDb] = useState<Record<string, Disponibilidade>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ── ESTADOS DO MOTOR DE RESERVAS (CALENDÁRIO) ──
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [mesAtualCalendario, setMesAtualCalendario] = useState<Date | null>(null);
  const [tipoQuarto, setTipoQuarto] = useState<'standard' | 'luxo'>('standard');
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMesAtualCalendario(new Date());
    setMounted(true);
  }, []);

  // Carregamento de Dados
  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Busca o Hotel
        const { data: hotelData, error: hotelError } = await supabase.from('hoteis').select('*').eq('id', params.id).single();
        if (hotelError) throw new Error("Erro ao buscar a hospedagem.");
        
        // 2. Busca a Tabela de Disponibilidade (Preços Dinâmicos)
        const { data: dispData } = await supabase.from('hotel_disponibilidade').select('*').eq('hotel_id', params.id);
        
        const dispMap: Record<string, Disponibilidade> = {};
        if (dispData) {
          dispData.forEach((d: any) => {
             dispMap[d.data] = d;
          });
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

  const getPrecoDiaria = (dataStr: string) => {
    const disp = disponibilidadeDb[dataStr];
    if (disp) {
      return tipoQuarto === 'luxo' ? parseValor(disp.quarto_luxo_preco) : parseValor(disp.quarto_standard_preco);
    }
    // Preço base (Fallback se o dono não cadastrou preço específico para o dia)
    return hotel ? (tipoQuarto === 'luxo' ? parseValor(hotel.quarto_luxo_preco) : parseValor(hotel.quarto_standard_preco)) : 0;
  };

  const isDisponivel = (dataStr: string) => {
    const disp = disponibilidadeDb[dataStr];
    if (disp) {
      return tipoQuarto === 'luxo' ? disp.quarto_luxo_disponivel : disp.quarto_standard_disponivel;
    }
    return true; // Se não tem regra, assume disponível
  };

  const formatarDataIso = (data: Date) => {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  };

  // Cálculo de Preço Total percorrendo os dias selecionados
  let valorTotalReserva = 0;
  let totalNoites = 0;
  
  if (checkin && checkout) {
    let diaAtual = new Date(checkin);
    while (diaAtual < checkout) {
      const dataStr = formatarDataIso(diaAtual);
      valorTotalReserva += getPrecoDiaria(dataStr);
      totalNoites++;
      diaAtual.setDate(diaAtual.getDate() + 1);
    }
  } else if (checkin) {
    valorTotalReserva = getPrecoDiaria(formatarDataIso(checkin));
  }

  const handleReserva = () => {
    if (!checkin || !checkout) {
      alert("Por favor, selecione as datas de Check-in e Check-out no calendário.");
      return;
    }
    // LIGAÇÃO ATUALIZADA PARA O NOVO CHECKOUT UNIFICADO
    router.push(`/checkout-hotel?hotel=${hotel?.id}&quarto=${tipoQuarto}&checkin=${formatarDataIso(checkin)}&checkout=${formatarDataIso(checkout)}`);
  };

  // ── FUNÇÕES DA GALERIA DE FOTOS ──
  const fecharGaleria = () => setFotoExpandidaIndex(null);
  const proximaFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hotel?.galeria) setFotoExpandidaIndex((prev) => (prev! + 1) % hotel.galeria!.length);
  };
  const fotoAnterior = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hotel?.galeria) setFotoExpandidaIndex((prev) => (prev! - 1 + hotel.galeria!.length) % hotel.galeria!.length);
  };

  if (!mounted || loading || !mesAtualCalendario) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-xs">Carregando detalhes do hotel...</p>
    </div>
  );

  if (erro || !hotel) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-6 text-center">
      <h1 className="text-3xl font-black mb-4">Alojamento Não Encontrado</h1>
      <p className="text-slate-500 mb-8 max-w-md">{erro}</p>
      <Link href="/#hoteis" className="bg-[#00577C] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm shadow-lg">Voltar aos Hotéis</Link>
    </div>
  );

  const anoCorrente = mesAtualCalendario.getFullYear();
  const mesCorrente = mesAtualCalendario.getMonth();
  const diasMes = diasDoMes(anoCorrente, mesCorrente);
  const primeiroDia = primeiroDiaDoMes(anoCorrente, mesCorrente);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=$${encodeURIComponent(`${hotel.nome} ${hotel.endereco || 'Pará'}`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col`}>
      
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
          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/#eventos" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Eventos</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão Residente</Link>
          </nav>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <div className="w-full h-[40vh] md:h-[60vh] relative bg-slate-200 mt-[70px] md:mt-[90px]">
        <Link href="/#hoteis" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 px-4 py-2 rounded-full shadow-lg transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 py-12 flex flex-col lg:flex-row items-start gap-12 relative z-10 -mt-20">
        
        {/* ── COLUNA ESQUERDA: INFORMAÇÕES DO HOTEL ── */}
        <div className="flex-1 w-full min-w-0">
          <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                {hotel.tipo}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: hotel.estrelas }).map((_, i) => <Star key={i} className="h-4 w-4 fill-[#F9C400] text-[#F9C400]" />)}
              </div>
            </div>

            <h1 className={`${jakarta.className} text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4`}>
              {hotel.nome}
            </h1>

            <div className="flex items-center gap-2 text-slate-500 font-medium mb-10 border-b border-slate-100 pb-8">
              <MapPin size={18} className="text-[#009640] shrink-0" />
              <span>{hotel.endereco || 'São Geraldo do Araguaia, Pará'}</span>
            </div>

            <div className="mb-12">
              <h3 className={`${jakarta.className} text-2xl font-black text-[#00577C] mb-6`}>Sobre a Hospedagem</h3>
              <div className="text-lg text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{hotel.descricao}</div>
            </div>

            {hotel.comodidades && hotel.comodidades.length > 0 && (
              <div>
                <h3 className={`${jakarta.className} text-2xl font-black text-[#00577C] mb-6`}>Comodidades</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getArraySeguro(hotel.comodidades).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-slate-700 font-medium bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                      <CheckCircle2 size={20} className="text-[#009640] shrink-0" /> {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── COLUNA DIREITA: MOTOR DE RESERVAS COM CALENDÁRIO ── */}
        <div className="w-full lg:w-[420px] shrink-0 lg:self-start">
          <aside className="lg:sticky lg:top-32 space-y-6">
            
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 pb-6 mb-6">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-1">A partir de</p>
                 <div className="flex items-end gap-2">
                   <p className={`${jakarta.className} text-4xl font-black text-slate-900`}>{formatarMoeda(parseValor(hotel.quarto_standard_preco || hotel.preco_medio))}</p>
                   <p className="text-sm font-bold text-slate-400 mb-1.5">/ noite</p>
                 </div>
              </div>

              {/* 1. SELEÇÃO DO TIPO DE QUARTO (Muda o preço do calendário) */}
              <div className="space-y-3 mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C]">1. Escolha sua Acomodação</p>
                <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${tipoQuarto === 'standard' ? 'border-[#00577C] bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="quarto" className="w-5 h-5 accent-[#00577C]" checked={tipoQuarto === 'standard'} onChange={() => { setTipoQuarto('standard'); setCheckin(null); setCheckout(null); }} />
                    <div><p className="font-bold text-sm text-slate-800">{hotel.quarto_standard_nome || 'Quarto Standard'}</p></div>
                  </div>
                </label>
                <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${tipoQuarto === 'luxo' ? 'border-[#F9C400] bg-yellow-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="quarto" className="w-5 h-5 accent-[#F9C400]" checked={tipoQuarto === 'luxo'} onChange={() => { setTipoQuarto('luxo'); setCheckin(null); setCheckout(null); }} />
                    <div><p className="font-bold text-sm text-slate-800">{hotel.quarto_luxo_nome || 'Suíte Luxo'}</p></div>
                  </div>
                </label>
              </div>

              {/* 2. CALENDÁRIO INTERATIVO (AIRBNB STYLE) */}
              <div className="mb-8">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-4">2. Selecione as Datas</p>
                 <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-5 shadow-inner">
                    
                    {/* Controles do Mês */}
                    <div className="flex items-center justify-between mb-4">
                       <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente - 1))} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ChevronLeft size={20}/></button>
                       <p className="font-bold text-slate-800 capitalize">
                         {mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                       </p>
                       <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente + 1))} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ChevronRight size={20}/></button>
                    </div>

                    {/* Dias da Semana */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                       {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, i) => (
                         <span key={i} className="text-[10px] font-black text-slate-400">{dia}</span>
                       ))}
                    </div>

                    {/* Grelha de Dias */}
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

                          // Lógica visual da célula
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
                                <span className="text-[7px] font-black text-slate-400 -mt-1 tabular-nums">R${Math.round(getPrecoDiaria(dataStr))}</span>
                              )}
                            </button>
                          );
                       })}
                    </div>
                 </div>
              </div>

              {/* Total e Botão */}
              {checkin && checkout && (
                 <div className="flex justify-between items-center bg-[#009640]/10 p-5 rounded-2xl mb-6 border border-[#009640]/20 animate-in zoom-in-95 duration-300">
                    <div>
                      <span className="text-[10px] font-black text-[#009640] uppercase block">Total Estimado</span>
                      <span className="text-xs font-bold text-slate-600">{totalNoites} {totalNoites === 1 ? 'noite' : 'noites'} selecionadas</span>
                    </div>
                    <span className={`${jakarta.className} text-3xl font-black text-[#009640]`}>{formatarMoeda(valorTotalReserva)}</span>
                 </div>
              )}

              <button 
                onClick={handleReserva}
                className={`${jakarta.className} flex items-center justify-center gap-3 w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-5 rounded-2xl font-black text-lg transition-transform hover:-translate-y-1 shadow-xl`}
              >
                Prosseguir para Reserva <ChevronRightIcon size={20} />
              </button>
            </div>

            {/* Mapa */}
            <div className="bg-white p-4 rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-3 px-2 flex items-center gap-2">
                <MapPin size={14} className="text-[#009640]" /> Como Chegar
              </p>
              <div className="w-full h-[200px] rounded-2xl overflow-hidden bg-slate-100">
                <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" src={googleMapsEmbedUrl}></iframe>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── GALERIA ── */}
      {hotel.galeria && hotel.galeria.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-5 pb-20 relative z-10 flex-1">
          <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
            <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-8`}>Galeria de Fotos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {getArraySeguro(hotel.galeria).map((foto, idx) => (
                  <div key={idx} onClick={() => setFotoExpandidaIndex(idx)} className="relative aspect-square rounded-2xl overflow-hidden shadow-md group bg-slate-200 cursor-pointer">
                    <Image src={foto} alt={`Foto ${idx + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-[#00577C]/0 group-hover:bg-[#00577C]/40 transition-colors duration-300 flex items-center justify-center">
                      <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-10 h-10 scale-50 group-hover:scale-100" />
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>
      )}

      {/* ── LIGHTBOX GALERIA ── */}
      {fotoExpandidaIndex !== null && hotel?.galeria && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-5 animate-in fade-in duration-200" onClick={fecharGaleria}>
          <button onClick={fecharGaleria} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"><X size={24} /></button>
          <button onClick={fotoAnterior} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"><ChevronLeft size={32} /></button>
          <div className="relative w-full max-w-6xl aspect-video rounded-xl overflow-hidden shadow-2xl">
            <Image src={getArraySeguro(hotel.galeria)[fotoExpandidaIndex]} alt={`Foto ${fotoExpandidaIndex + 1}`} fill className="object-contain" />
          </div>
          <button onClick={proximaFoto} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"><ChevronRight size={32} /></button>
          <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
            <p className="text-white font-bold tracking-widest text-sm bg-black/60 inline-block px-5 py-2 rounded-full backdrop-blur-sm">{fotoExpandidaIndex + 1} de {getArraySeguro(hotel.galeria).length}</p>
          </div>
        </div>
      )}

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