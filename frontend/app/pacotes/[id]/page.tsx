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
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
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
  let arr: string[] = [];
  if (!item) return [];
  if (Array.isArray(item)) {
    arr = item;
  } else if (typeof item === 'string') {
    try { 
      const parsed = JSON.parse(item); 
      if (Array.isArray(parsed)) arr = parsed;
    } catch (e) { 
      if (item.startsWith('{') && item.endsWith('}')) {
        arr = item.slice(1, -1).split(',').map(s => s.trim().replace(/^"/, '').replace(/"$/, ''));
      }
    }
  }
  return arr.filter(url => typeof url === 'string' && url.length > 5);
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

  // 🔴 AQUI ESTAVA O ERRO! As variáveis estavam em falta.
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
  const [mesAtualCalendario, setMesAtualCalendario] = useState<Date>(new Date());
  
  // Galeria e UI
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
        
        // 🔴 E FALTAVA PREENCHÊ-LAS AQUI!
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

  // ── LÓGICA DA GALERIA ──
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

  if (!mounted || loading || !pacote) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <div className="text-center">
        <Loader2 className="animate-spin text-[#00577C] w-14 h-14 mx-auto mb-4" />
        <p className="font-bold uppercase tracking-widest text-[#00577C] text-xs">A Preparar Portal de Reservas...</p>
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
    <div className={`${inter.className} min-h-screen bg-[#F8F9FA]`}>
      
      {/* ── HEADER ── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-4">
            <div className="relative h-12 w-40"><Image src="/logop.png" alt="Logo" fill className="object-contain object-left" /></div>
            <div className="border-l pl-4 hidden md:block">
               <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Secretaria de Turismo</p>
            </div>
          </Link>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-slate-600">
            <Link href="/pacotes" className="hover:text-[#00577C] transition-colors">Pacotes</Link>
            <Link href="/roteiro" className="hover:text-[#00577C] transition-colors">Rota Turística</Link>
            <Link href="/cadastro" className="bg-[#F9C400] hover:bg-[#e5b500] transition-colors px-6 py-2.5 rounded-full text-[#00577C] shadow-md">Cartão Residente</Link>
          </nav>
        </div>
      </header>

      {/* ── HERO IMPONENTE ── */}
      <section className="relative h-[75vh] min-h-[600px] w-full mt-[70px]">
        <Image src={pacote.imagem_principal || FALLBACK_IMAGE} alt={pacote.titulo || 'Pacote'} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001E2B] via-[#001E2B]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 text-white max-w-7xl mx-auto z-20">
          <button onClick={() => router.back()} className="flex items-center gap-3 text-sm font-bold mb-8 opacity-80 hover:opacity-100 transition-opacity bg-white/10 px-5 py-2 rounded-full backdrop-blur-sm">
            <ArrowLeft size={16}/> Voltar ao Catálogo
          </button>
          <div className="flex items-center gap-4 mb-6">
             <span className="bg-[#F9C400] text-[#00577C] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Expedição Oficial</span>
             <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-80"><MapPin size={14} className="text-[#F9C400]"/> São Geraldo do Araguaia</span>
          </div>
          <h1 className={`${jakarta.className} text-5xl md:text-8xl font-black leading-[1.1] tracking-tight`}>{pacote.titulo}</h1>
        </div>
      </section>

      {/* ── INFO BAR ── */}
      <div className="relative z-30 max-w-7xl mx-auto px-6 -mt-16">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-wrap divide-y md:divide-y-0 md:divide-x overflow-hidden">
          <div className="p-8 flex items-center gap-5 flex-1 min-w-[250px]">
            <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-[#b38d00]"><CalendarIcon size={24}/></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duração</p><p className="text-xl font-bold text-slate-800">{pacote.dias} Dias</p></div>
          </div>
          <div className="p-8 flex items-center gap-5 flex-1 min-w-[250px]">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#00577C]"><MapPin size={24}/></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destino</p><p className="text-xl font-bold text-slate-800">SGA, Pará</p></div>
          </div>
          <div className="p-8 flex items-center gap-5 flex-1 min-w-[250px] bg-[#009640]/5">
            <div className="w-14 h-14 bg-[#009640]/10 rounded-2xl flex items-center justify-center text-[#009640]"><Wallet size={24}/></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Estimado</p><p className={`${jakarta.className} font-black text-[#009640] text-3xl`}>{formatarMoeda(valorTotalFinal)}</p></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-[1fr_450px] gap-16 items-start">
        
        {/* ── COLUNA ESQUERDA (CONTEÚDO) ── */}
        <div className="space-y-16">
          
          <section className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none rotate-12"><Landmark size={150}/></div>
            <h2 className={`${jakarta.className} text-4xl font-black text-[#00577C] mb-8 flex items-center gap-4`}>
              <Info size={32}/> Sobre o Roteiro
            </h2>
            <p className="text-2xl text-slate-500 italic mb-10 border-l-8 border-[#F9C400] pl-6 font-medium">{pacote.descricao_curta}</p>
            <div className="whitespace-pre-line text-slate-700 leading-relaxed text-lg">{pacote.roteiro_detalhado}</div>
          </section>

          {/* ESCOLHA DO HOTEL E QUARTO */}
          <section className="space-y-8">
            <h2 className={`${jakarta.className} text-4xl font-black text-slate-900 flex items-center gap-4 mb-10`}>
              <div className="w-14 h-14 bg-[#00577C] text-white rounded-2xl flex items-center justify-center shadow-lg"><Bed size={28}/></div>
              1. Acomodação
            </h2>
            
            {hoteisDisponiveis.map((hotel: any) => {
              const selected = hotelSelecionado?.id === hotel.id;
              return (
                <div key={hotel.id} className={`p-10 rounded-[3rem] bg-white border-2 transition-all duration-500 ${selected ? 'border-[#00577C] ring-[12px] ring-blue-50 shadow-xl scale-[1.02]' : 'border-slate-100 opacity-90 hover:opacity-100'}`}>
                  
                  <button className="w-full flex items-center justify-between mb-8 pb-8 border-b-2 border-slate-50 text-left" onClick={() => setHotelSelecionado(hotel)}>
                    <div className="flex items-center gap-8">
                      <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden shadow-md border-4 border-white"><Image src={hotel.imagem_url || FALLBACK_IMAGE} alt={hotel.nome} fill className="object-cover" /></div>
                      <div>
                        <h4 className="text-3xl font-bold text-slate-800 mb-3">{hotel.nome}</h4>
                        <div className="flex items-center gap-4">
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#009640] bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">{hotel.tipo}</span>
                           <div className="flex text-[#F9C400] gap-1"><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/></div>
                        </div>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all ${selected ? 'border-[#00577C] bg-[#00577C] text-white' : 'border-slate-200 text-transparent'}`}><CheckCircle2 size={24} /></div>
                  </button>

                  {selected && (
                    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                      
                      <div onClick={() => setTipoQuarto('standard')} className={`group cursor-pointer p-8 rounded-[2rem] border-4 transition-all flex flex-col justify-between ${tipoQuarto === 'standard' ? 'border-[#F9C400] bg-yellow-50/40 shadow-inner' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="mb-6">
                           <div className="flex justify-between items-center mb-4">
                             <p className="font-bold text-xl text-slate-800">{hotel.quarto_standard_nome || 'Standard'}</p>
                             {tipoQuarto === 'standard' && <CheckCircle2 className="text-[#F9C400]" size={20}/>}
                           </div>
                           <div className="flex flex-wrap gap-2">
                             {getArraySeguro(hotel.quarto_standard_comodidades).map((c: string, i: number) => <span key={i} className="text-[9px] font-black bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500 uppercase">{c}</span>)}
                           </div>
                        </div>
                        <p className="text-3xl font-black text-[#009640]">{formatarMoeda(parseValor(hotel.quarto_standard_preco))}</p>
                      </div>

                      <div onClick={() => setTipoQuarto('luxo')} className={`group cursor-pointer p-8 rounded-[2rem] border-4 transition-all flex flex-col justify-between relative ${tipoQuarto === 'luxo' ? 'border-[#00577C] bg-blue-50/40 shadow-inner' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="absolute -top-4 right-6 bg-[#00577C] text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg flex items-center gap-1"><Award size={12}/> RECOMENDADO</div>
                        <div className="mb-6">
                           <div className="flex justify-between items-center mb-4">
                             <p className="font-bold text-xl text-slate-800">{hotel.quarto_luxo_nome || 'Suíte Luxo'}</p>
                             {tipoQuarto === 'luxo' && <CheckCircle2 className="text-[#00577C]" size={20}/>}
                           </div>
                           <div className="flex flex-wrap gap-2">
                             {getArraySeguro(hotel.quarto_luxo_comodidades).map((c: string, i: number) => <span key={i} className="text-[9px] font-black bg-[#00577C] text-white px-2 py-1 rounded-md uppercase shadow-sm">{c}</span>)}
                           </div>
                        </div>
                        <p className="text-3xl font-black text-[#009640]">{formatarMoeda(parseValor(hotel.quarto_luxo_preco))}</p>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* ESCOLHA DO GUIA */}
          <section className="space-y-8">
            <h2 className={`${jakarta.className} text-4xl font-black text-slate-900 flex items-center gap-4 mb-10`}>
              <div className="w-14 h-14 bg-[#009640] text-white rounded-2xl flex items-center justify-center shadow-lg"><UserCheck size={28}/></div>
              2. Guia Oficial
            </h2>
            <div className="grid gap-6">
              {guiasDisponiveis.map((guia: any) => {
                const selected = guiaSelecionado?.id === guia.id;
                return (
                  <label key={guia.id} className={`flex items-center justify-between p-8 bg-white rounded-[3rem] border-2 transition-all cursor-pointer ${selected ? 'border-[#009640] ring-8 ring-green-50 shadow-xl' : 'border-slate-100 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-8">
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-sm border border-slate-100"><Image src={guia.imagem_url || FALLBACK_IMAGE} alt={guia.nome} fill className="object-cover" /></div>
                      <div>
                         <p className="font-bold text-2xl text-slate-800 mb-2">{guia.nome}</p>
                         <div className="text-sm font-bold text-slate-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#009640]"></div>{guia.especialidade}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right hidden sm:block">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Diária</p>
                         <p className="text-2xl font-black text-slate-900">{formatarMoeda(parseValor(guia.preco_diaria))}</p>
                      </div>
                      <input type="radio" checked={selected} onChange={() => setGuiaSelecionado(guia)} className="w-8 h-8 accent-[#009640]" />
                    </div>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        {/* ── COLUNA DIREITA (MOTOR DE RESERVAS INTELIGENTE) ── */}
        <aside className="lg:sticky lg:top-36 h-fit space-y-6">
          <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
            
            <h3 className={`${jakarta.className} text-2xl font-black mb-8 border-b-2 border-slate-50 pb-6 text-slate-900`}>Detalhes da Reserva</h3>
            
            {/* Calendário Avançado */}
            <div className="bg-slate-50 rounded-[2.5rem] p-6 mb-10 border border-slate-100 shadow-inner">
               <div className="flex justify-between items-center mb-6 px-2">
                 <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente - 1))} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ChevronLeft size={24} className="text-slate-600"/></button>
                 <span className="font-black text-slate-800 text-lg capitalize">
                   {mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                 </span>
                 <button onClick={() => setMesAtualCalendario(new Date(anoCorrente, mesCorrente + 1))} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ChevronRight size={24} className="text-slate-600"/></button>
               </div>
               
               <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 mb-3">
                 {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => <div key={d}>{d}</div>)}
               </div>
               
               <div className="grid grid-cols-7 gap-y-2 gap-x-0">
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

                    let bgClass = "bg-white hover:bg-slate-200 border border-slate-200 text-slate-800";
                    
                    if (isPassado || !disponivel) {
                       bgClass = "bg-transparent text-slate-300 cursor-not-allowed line-through border-transparent";
                    } else if (isCheckin || isCheckout) {
                       bgClass = "bg-[#00577C] border-[#00577C] text-white shadow-xl scale-110 z-10 font-black rounded-xl";
                    } else if (isInBetween || isHovered) {
                       bgClass = "bg-[#00577C]/10 border-[#00577C]/10 text-[#00577C] rounded-none";
                    } else {
                       bgClass = "bg-white hover:border-[#00577C] border-slate-200 text-slate-800 rounded-xl shadow-sm";
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
                        <span className="text-sm">{dia}</span>
                        {disponivel && !isCheckin && !isCheckout && !isInBetween && (
                          <span className="text-[7px] font-black text-[#009640] -mt-0.5 tabular-nums">R${Math.round(getPrecoDiariaHotel(dataStr))}</span>
                        )}
                      </button>
                    );
                 })}
               </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="space-y-6 mb-10 border-t border-slate-100 pt-8">
              <div className="flex justify-between items-center text-slate-600 font-bold">
                 <span className="flex items-center gap-2"><Bed size={16} className="text-[#00577C]"/> Hospedagem ({totalNoites} nts)</span>
                 <span className="text-slate-900">{formatarMoeda(totalHospedagem)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-bold">
                 <span className="flex items-center gap-2"><Compass size={16} className="text-[#009640]"/> Guia de Turismo</span>
                 <span className="text-slate-900">{formatarMoeda(valorGuia)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-bold">
                 <span className="flex items-center gap-2"><Ticket size={16} className="text-[#F9C400]"/> Entradas e Taxas</span>
                 <span className="text-slate-900">{formatarMoeda(valorAtracoes)}</span>
              </div>
            </div>

            {/* Total Grand */}
            <div className="bg-[#009640]/5 p-8 rounded-[2rem] mb-10 border-2 border-[#009640]/10 text-center">
               <p className="text-[11px] font-black text-[#009640] uppercase tracking-[0.3em] mb-2">Investimento Total</p>
               <p className={`${jakarta.className} text-5xl font-black text-[#009640] tabular-nums`}>{formatarMoeda(valorTotalFinal)}</p>
            </div>

            <button 
              onClick={handleReserva} 
              className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:-translate-y-2 active:scale-95 transition-all flex items-center justify-center gap-4 group"
            >
              Prosseguir para Checkout <ChevronRightIcon size={24} className="group-hover:translate-x-2 transition-transform"/>
            </button>
            <p className="mt-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
               <ShieldCheck size={14} className="text-[#00577C]"/> Plataforma Segura SGA
            </p>
          </div>
        </aside>

      </div>

      {/* ── GALERIA HÍBRIDA (ROTEIRO + HOTEL) NO RODAPÉ ── */}
      <section className="max-w-7xl mx-auto px-6 pb-40">
        <div className="flex items-center justify-between mb-12 border-l-[12px] border-[#00577C] pl-8">
           <div>
              <p className="text-[#00577C] font-black uppercase tracking-[0.4em] text-xs mb-2">Visão Geral Completa</p>
              <h2 className={`${jakarta.className} text-5xl font-black text-slate-900`}>Galeria de Imagens</h2>
           </div>
           <ImageIcon size={60} className="text-slate-200 hidden md:block" />
        </div>
        
        {galeriaCombinada.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
             {galeriaCombinada.map((url, idx) => (
               <div key={idx} onClick={() => setFotoExpandidaIndex(idx)} className="relative aspect-square rounded-[2rem] overflow-hidden shadow-md hover:shadow-2xl transition-all hover:-translate-y-2 group cursor-pointer bg-slate-200">
                 <Image src={url} alt={`Foto Galeria ${idx + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                 <div className="absolute inset-0 bg-[#00577C]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                   <ZoomIn className="text-white w-12 h-12" />
                 </div>
               </div>
             ))}
           </div>
        ) : (
           <div className="bg-white p-24 rounded-[3rem] border-4 border-dashed border-slate-200 text-center flex flex-col items-center">
              <Camera size={48} className="text-slate-300 mb-6"/>
              <p className="font-black text-slate-400 uppercase tracking-[0.3em]">Sem imagens disponíveis no momento</p>
           </div>
        )}
      </section>

      {/* ── LIGHTBOX (ECRÃ INTEIRO PARA GALERIA) ── */}
      {fotoExpandidaIndex !== null && galeriaCombinada.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={fecharGaleria}>
          <button onClick={fecharGaleria} className="absolute top-10 right-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110] backdrop-blur-sm"><X size={28} /></button>
          
          <button onClick={fotoAnterior} className="absolute left-10 top-1/2 -translate-y-1/2 p-5 bg-white/10 hover:bg-white/30 text-white rounded-full transition-colors z-[110] backdrop-blur-sm hidden md:block"><ChevronLeft size={36} /></button>
          
          <div className="relative w-full max-w-6xl aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10" onClick={(e) => e.stopPropagation()}>
            <Image src={galeriaCombinada[fotoExpandidaIndex]} alt={`Visualização em detalhe ${fotoExpandidaIndex + 1}`} fill className="object-contain bg-black/40" />
          </div>
          
          <button onClick={proximaFoto} className="absolute right-10 top-1/2 -translate-y-1/2 p-5 bg-white/10 hover:bg-white/30 text-white rounded-full transition-colors z-[110] backdrop-blur-sm hidden md:block"><ChevronRightIcon size={36} /></button>
          
          <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
            <p className="text-white font-bold tracking-[0.3em] text-xs bg-black/50 inline-block px-6 py-3 rounded-full backdrop-blur-md border border-white/20">
               IMAGEM {fotoExpandidaIndex + 1} DE {galeriaCombinada.length}
            </p>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-5">
             <Image src="/logop.png" alt="Logo SGA" width={180} height={60} className="object-contain opacity-70 hover:opacity-100 transition-opacity" />
             <div className="border-l-2 border-slate-100 pl-5 hidden md:block">
               <p className={`${jakarta.className} text-xl font-black text-[#00577C]`}>SagaTurismo</p>
               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.3em]">Portal Oficial</p>
             </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center md:text-right">
             © {new Date().getFullYear()} · Prefeitura Municipal de <br/>São Geraldo do Araguaia
          </p>
        </div>
      </footer>
    </div>
  );
}