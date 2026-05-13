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
  ChevronLeft, ChevronRight as ChevronRightIcon, ZoomIn, ShieldAlert, Landmark, TreePine, Anchor
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── UTILITÁRIOS E SEGURANÇA MATEMÁTICA ──
const parseValor = (valor: any): number => {
  if (valor === null || valor === undefined || valor === '') return 0;
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  return isNaN(num) ? 0 : num;
};

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

// ── TIPAGENS RÍGIDAS ──
type Hotel = {
  id: string; nome: string; tipo: string; imagem_url: string; descricao: string;
  quarto_standard_nome: string; quarto_standard_preco: any; quarto_standard_comodidades: string[];
  quarto_luxo_nome: string; quarto_luxo_preco: any; quarto_luxo_comodidades: string[];
  galeria: string[] | string;
};
type Guia = { id: string; nome: string; preco_diaria: any; especialidade: string; imagem_url: string; descricao: string; };
type Atracao = { id: string; nome: string; preco_entrada: any; tipo: string; descricao: string; };
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

function PacoteDetalheContent() {
  const { id } = useParams();
  const router = useRouter();

  // Estados de Dados
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [disponibilidadeDb, setDisponibilidadeDb] = useState<Record<string, Disponibilidade>>({});

  // Estados de Seleção
  const [hoteisDisponiveis, setHoteisDisponiveis] = useState<Hotel[]>([]);
  const [guiasDisponiveis, setGuiasDisponiveis] = useState<Guia[]>([]);
  const [atracoesInclusas, setAtracoesInclusas] = useState<Atracao[]>([]);
  
  const [hotelSelecionado, setHotelSelecionado] = useState<Hotel | null>(null);
  const [tipoQuarto, setTipoQuarto] = useState<'standard' | 'luxo'>('standard');
  const [guiaSelecionado, setGuiaSelecionado] = useState<Guia | null>(null);

  // Estados do Calendário Airbnb Style
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [mesAtualCalendario, setMesAtualCalendario] = useState<Date>(new Date());
  
  // Estados de UI
  const [abaGaleria, setAbaGaleria] = useState<'destino' | 'hotel'>('destino');
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // 1. CARREGAMENTO INICIAL DO PACOTE
  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('pacotes').select(`*, pacote_itens ( hoteis (*), guias (*), atracoes (*) )`).eq('id', id).single();
        if (error) throw new Error("Erro ao carregar o pacote.");
        
        const pct = data as Pacote;
        setPacote(pct);
        
        const hoteis = pct.pacote_itens.map(i => i.hoteis).filter(Boolean) as Hotel[];
        const guias = pct.pacote_itens.map(i => i.guias).filter(Boolean) as Guia[];
        setAtracoesInclusas(pct.pacote_itens.map(i => i.atracoes).filter(Boolean) as Atracao[]);
        setHoteisDisponiveis(hoteis);
        setGuiasDisponiveis(guias);

        if (hoteis.length > 0) setHotelSelecionado(hoteis[0]);
        if (guias.length > 0) setGuiaSelecionado(guias[0]);
        
      } catch (err: any) {
        console.error(err);
        setErro("Pacote não encontrado.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  // 2. ATUALIZAÇÃO DA DISPONIBILIDADE DO HOTEL SELECIONADO
  useEffect(() => {
    async function fetchDisp() {
      if (!hotelSelecionado) return;
      const { data } = await supabase.from('hotel_disponibilidade').select('*').eq('hotel_id', hotelSelecionado.id);
      const dispMap: Record<string, Disponibilidade> = {};
      if (data) data.forEach((d: any) => { dispMap[d.data] = d; });
      setDisponibilidadeDb(dispMap);
      
      // Limpa datas se mudar de hotel
      setCheckin(null);
      setCheckout(null);
    }
    fetchDisp();
  }, [hotelSelecionado]);

  // 3. EFEITO DE SCROLL HEADER
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

  // ── LÓGICA DO CALENDÁRIO ──
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

  const formatarDataIso = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

  const getPrecoDiariaHotel = (dataStr: string) => {
    const disp = disponibilidadeDb[dataStr];
    if (disp) return tipoQuarto === 'luxo' ? parseValor(disp.quarto_luxo_preco) : parseValor(disp.quarto_standard_preco);
    return hotelSelecionado ? (tipoQuarto === 'luxo' ? parseValor(hotelSelecionado.quarto_luxo_preco) : parseValor(hotelSelecionado.quarto_standard_preco)) : 0;
  };

  const isDisponivel = (dataStr: string) => {
    const disp = disponibilidadeDb[dataStr];
    if (disp) return tipoQuarto === 'luxo' ? disp.quarto_luxo_disponivel : disp.quarto_standard_disponivel;
    return true; // Se não tem regra na base, assume disponível
  };

  // ── MATEMÁTICA DA RESERVA ──
  let totalHospedagem = 0;
  let totalNoites = 0;
  
  if (checkin && checkout) {
    let diaAtual = new Date(checkin);
    while (diaAtual < checkout) {
      totalHospedagem += getPrecoDiariaHotel(formatarDataIso(diaAtual));
      totalNoites++;
      diaAtual.setDate(diaAtual.getDate() + 1);
    }
  } else {
    // Valor de visualização base (1 noite)
    totalHospedagem = hotelSelecionado ? (tipoQuarto === 'luxo' ? parseValor(hotelSelecionado.quarto_luxo_preco) : parseValor(hotelSelecionado.quarto_standard_preco)) : 0;
  }

  const diariaGuia = guiaSelecionado ? parseValor(guiaSelecionado.preco_diaria) : 0;
  const totalGuias = totalNoites > 0 ? diariaGuia * totalNoites : diariaGuia;
  const totalAtracoes = atracoesInclusas.reduce((acc, curr) => acc + parseValor(curr.preco_entrada), 0);
  
  const valorTotalFinal = totalHospedagem + totalGuias + totalAtracoes;

  const handleProsseguir = () => {
    if (!checkin || !checkout) {
      alert("Por favor, selecione as datas de Check-in e Check-out no calendário antes de prosseguir.");
      return;
    }
    const checkinIso = formatarDataIso(checkin);
    const checkoutIso = formatarDataIso(checkout);
    router.push(`/checkout?pacote=${pacote?.id}&hotel=${hotelSelecionado?.id}&quarto=${tipoQuarto}&guia=${guiaSelecionado?.id}&checkin=${checkinIso}&checkout=${checkoutIso}`);
  };

  // ── GALERIAS ──
  const getGaleriaHotel = (hotel: Hotel | null) => {
    if (!hotel || !hotel.galeria) return [];
    if (Array.isArray(hotel.galeria)) return hotel.galeria;
    try { return JSON.parse(hotel.galeria); } catch { return []; }
  };

  const fecharGaleria = () => setFotoExpandidaIndex(null);
  const proximaFoto = (e: React.MouseEvent, max: number) => {
    e.stopPropagation();
    setFotoExpandidaIndex((prev) => (prev !== null ? (prev + 1) % max : 0));
  };
  const fotoAnterior = (e: React.MouseEvent, max: number) => {
    e.stopPropagation();
    setFotoExpandidaIndex((prev) => (prev !== null ? (prev - 1 + max) % max : 0));
  };

  // ── RENDERIZAÇÃO ──
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-[#00577C] w-16 h-16 mb-6" />
      <p className={`${jakarta.className} font-bold text-slate-400 uppercase tracking-[0.3em] text-xs`}>
        Conectando ao Portal de Turismo Oficial...
      </p>
    </div>
  );

  if (erro || !pacote) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] text-center px-6">
      <h1 className="text-4xl font-black text-slate-900 mb-4">Pacote Não Encontrado</h1>
      <Link href="/pacotes" className="mt-8 bg-[#00577C] text-white px-8 py-4 rounded-full font-bold">Voltar aos Pacotes</Link>
    </div>
  );

  const imagensRoteiro = [pacote.imagem_principal, ...(pacote.imagens_galeria || [])];
  
  const anoCorrente = mesAtualCalendario.getFullYear();
  const mesCorrente = mesAtualCalendario.getMonth();
  const diasMes = diasDoMes(anoCorrente, mesCorrente);
  const primeiroDia = primeiroDiaDoMes(anoCorrente, mesCorrente);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Selecionar galeria ativa no modal dependendo da aba
  const galeriaAtivaParaModal = abaGaleria === 'destino' ? imagensRoteiro : getGaleriaHotel(hotelSelecionado);

  return (
    <main className={`${inter.className} bg-[#F8F9FA] min-h-screen`}>
      
      {/* ── NAVEGAÇÃO INSTITUCIONAL ── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-4">
            <div className="relative h-16 w-56"><Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" /></div>
            <div className="hidden border-l border-slate-200 pl-6 lg:block">
              <p className={`${jakarta.className} text-2xl font-black text-[#00577C]`}>SagaTurismo</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">São Geraldo do Araguaia</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 md:flex font-bold text-sm text-slate-600">
            <Link href="/pacotes" className="text-[#00577C]">Pacotes</Link>
            <Link href="/roteiro" className="hover:text-[#00577C]">A Cidade</Link>
            <Link href="/cadastro" className="bg-[#F9C400] text-[#00577C] px-6 py-3 rounded-full shadow-lg hover:bg-[#ffd633] transition-all">Cartão Residente</Link>
          </nav>
        </div>
      </header>

      {/* ── CINEMATIC HERO ── */}
      <section className="relative w-full overflow-hidden" style={{ height: '88vh', minHeight: '700px' }}>
        <div className="absolute inset-0 z-0">
          <Image src={pacote.imagem_principal} alt={pacote.titulo} fill priority className="object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#001E2B] via-black/20 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-24 px-6 lg:px-20">
          <div className="mx-auto max-w-7xl">
             <button onClick={() => router.back()} className="inline-flex items-center gap-3 text-white/70 hover:text-white font-bold mb-10 group transition-all">
                <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors"><ArrowLeft size={18} /></div>
                Voltar ao Catálogo Oficial
             </button>
             <div className="flex items-center gap-3 mb-8">
                <span className="bg-[#F9C400] text-[#00577C] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 rounded-lg shadow-2xl">Expedição Oficial</span>
                <div className="h-px w-12 bg-white/30"></div>
                <span className="text-white/60 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-[#F9C400]"/> Pará, Brasil</span>
             </div>
             <h1 className={`${jakarta.className} font-black text-white leading-none tracking-tight text-6xl md:text-8xl lg:text-9xl`}>
               {pacote.titulo}
             </h1>
          </div>
        </div>
      </section>

      {/* ── OVERLAPPING INFO BAR ── */}
      <div className="relative z-30 mx-auto max-w-7xl px-6 lg:px-20 -mt-16">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-wrap divide-y sm:divide-y-0 sm:divide-x divide-slate-100 overflow-hidden">
          <div className="flex items-center gap-5 px-10 py-8 flex-1 min-w-[250px]">
            <div className="w-14 h-14 rounded-2xl bg-[#F9C400]/10 flex items-center justify-center text-[#b38d00] shadow-sm"><CalendarIcon size={28}/></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo de Expedição</p><p className="text-xl font-bold text-slate-800">{pacote.dias} Dias / {pacote.noites} Noites</p></div>
          </div>
          <div className="flex items-center gap-5 px-10 py-8 flex-1 min-w-[250px]">
            <div className="w-14 h-14 rounded-2xl bg-[#009640]/10 flex items-center justify-center text-[#009640] shadow-sm"><Clock size={28}/></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saídas</p><p className="text-xl font-bold text-slate-800">{pacote.horarios_info || 'A definir'}</p></div>
          </div>
          <div className="flex items-center gap-5 px-10 py-8 flex-1 min-w-[280px] bg-[#009640]/5 border-l-4 border-l-[#009640]">
            <div className="w-14 h-14 rounded-2xl bg-[#009640]/20 flex items-center justify-center text-[#009640] shadow-md"><Wallet size={28}/></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A Partir De</p><p className={`${jakarta.className} text-3xl font-black text-[#009640]`}>{formatarMoeda(valorTotalFinal)}</p></div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-20 mt-24 pb-48">
        <div className="grid lg:grid-cols-[1fr_450px] gap-20 items-start">

          {/* ─── LADO ESQUERDO: CONTEÚDO E ESCOLHAS ─── */}
          <div className="space-y-24">

            {/* ROTEIRO DETALHADO */}
            <section className="bg-white rounded-[3.5rem] p-12 md:p-16 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none rotate-12"><Map size={200}/></div>
              <h2 className={`${jakarta.className} text-4xl font-black text-slate-900 mb-12 flex items-center gap-4`}>
                <div className="w-1.5 h-10 bg-[#00577C] rounded-full"></div> Plano de Viagem
              </h2>
              <p className="text-2xl text-slate-500 leading-relaxed mb-12 border-l-8 border-[#F9C400] pl-10 italic font-medium">
                {pacote.descricao_curta}
              </p>
              <div className="whitespace-pre-line text-slate-700 text-xl leading-loose font-medium opacity-90">
                {pacote.roteiro_detalhado}
              </div>
            </section>

            {/* ESCOLHA 1: HOTEL (CARDS GIGANTES) */}
            <section>
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-[#00577C] rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200"><Bed size={32}/></div>
                <div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Passo 01</p>
                   <h2 className={`${jakarta.className} text-4xl font-black text-slate-900`}>Seleção de Hospedagem</h2>
                </div>
              </div>

              <div className="space-y-12">
                {hoteisDisponiveis.map((hotel) => {
                  const selected = hotelSelecionado?.id === hotel.id;
                  return (
                    <div key={hotel.id} className={`p-12 rounded-[3.5rem] bg-white border-2 transition-all duration-700 ${selected ? 'border-[#00577C] ring-[16px] ring-blue-50 shadow-2xl scale-[1.02]' : 'border-slate-100 hover:border-slate-300 opacity-90'}`}>
                      
                      <button className="w-full flex items-center justify-between mb-12 pb-10 border-b-2 border-slate-50 text-left" onClick={() => setHotelSelecionado(hotel)}>
                        <div className="flex items-center gap-10">
                          <div className="relative w-48 h-48 rounded-[2.5rem] overflow-hidden border-8 border-[#F8F9FA] shadow-2xl">
                             <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover" />
                          </div>
                          <div>
                            <h4 className="text-4xl font-black text-slate-800 mb-4">{hotel.nome}</h4>
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#009640] bg-green-50 px-4 py-2 rounded-xl border border-green-100">{hotel.tipo}</span>
                              <div className="flex text-[#F9C400] gap-1">
                                {Array.from({ length: 4 }).map((_, i) => <Star key={i} size={18} fill="currentColor"/>)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all ${selected ? 'border-[#00577C] bg-[#00577C] text-white shadow-xl' : 'border-slate-200 text-transparent'}`}><CheckCircle2 size={32} /></div>
                      </button>

                      {/* TIPOS DE QUARTO */}
                      {selected && (
                        <div className="grid md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-top-6 duration-700">
                          
                          {/* Standard */}
                          <div onClick={() => setTipoQuarto('standard')} className={`group relative p-10 rounded-[2.5rem] cursor-pointer border-4 transition-all flex flex-col justify-between ${tipoQuarto === 'standard' ? 'border-[#F9C400] bg-yellow-50/50 shadow-inner' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                            <div className="flex justify-between items-center mb-8">
                               <p className="font-black text-slate-800 text-2xl">{hotel.quarto_standard_nome || "Standard"}</p>
                               <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${tipoQuarto === 'standard' ? 'bg-[#F9C400] border-[#F9C400] text-[#00577C]' : 'border-slate-300 text-transparent'}`}><CheckCircle2 size={16} /></div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-10">
                               {hotel.quarto_standard_comodidades?.map((c, i) => (
                                 <span key={i} className="text-[10px] font-black bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500 uppercase">{c}</span>
                               ))}
                            </div>
                            <div className="flex items-end justify-between">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base / Diária</span>
                               <p className="font-black text-[#009640] text-4xl">{formatarMoeda(parseValor(hotel.quarto_standard_preco))}</p>
                            </div>
                          </div>

                          {/* Luxo */}
                          <div onClick={() => setTipoQuarto('luxo')} className={`group relative p-10 rounded-[2.5rem] cursor-pointer border-4 transition-all flex flex-col justify-between ${tipoQuarto === 'luxo' ? 'border-[#00577C] bg-blue-50/50 shadow-inner' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                            <div className="absolute -top-5 right-10 bg-[#00577C] text-white text-[11px] font-black px-6 py-2 rounded-full shadow-2xl flex items-center gap-2">
                               <Award size={14}/> RECOMENDADO
                            </div>
                            <div className="flex justify-between items-center mb-8">
                               <p className="font-black text-slate-800 text-2xl">{hotel.quarto_luxo_nome || "Luxo"}</p>
                               <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${tipoQuarto === 'luxo' ? 'bg-[#00577C] border-[#00577C] text-white' : 'border-slate-300 text-transparent'}`}><CheckCircle2 size={16} /></div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-10">
                               {hotel.quarto_luxo_comodidades?.map((c, i) => (
                                 <span key={i} className="text-[10px] font-black bg-[#00577C] text-white px-3 py-1.5 rounded-lg uppercase shadow-sm">{c}</span>
                               ))}
                            </div>
                            <div className="flex items-end justify-between">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base / Diária</span>
                               <p className="font-black text-[#009640] text-4xl">{formatarMoeda(parseValor(hotel.quarto_luxo_preco))}</p>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ESCOLHA 2: GUIA (CARDS GIGANTES) */}
            <section>
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-[#009640] rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-green-100"><UserCheck size={32}/></div>
                <div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Passo 02</p>
                   <h2 className={`${jakarta.className} text-4xl font-black text-slate-900`}>Apoio Técnico e Guia</h2>
                </div>
              </div>
              
              <div className="grid gap-10">
                {guiasDisponiveis.map((guia) => {
                  const selected = guiaSelecionado?.id === guia.id;
                  return (
                    <label key={guia.id} className={`cursor-pointer p-12 bg-white rounded-[3.5rem] border-2 flex items-center justify-between transition-all duration-500 ${selected ? 'border-[#009640] ring-[16px] ring-green-50 shadow-2xl' : 'border-slate-100 hover:border-slate-300 opacity-90'}`}>
                      <div className="flex items-center gap-12">
                        <div className="relative w-40 h-40 rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white bg-slate-100">
                           <Image src={guia.imagem_url || '/placeholder.png'} alt={guia.nome} fill className="object-cover" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-4xl font-black text-slate-800 mb-3">{guia.nome}</h4>
                          <div className="flex items-center gap-4 text-slate-500 font-bold text-xl">
                             <div className="w-4 h-4 rounded-full bg-[#009640] shadow-sm"></div> 
                             {guia.especialidade}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right hidden sm:block">
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Serviço Diário</p>
                          <p className="text-4xl font-black text-slate-900">{formatarMoeda(parseValor(guia.preco_diaria))}</p>
                        </div>
                        <input type="radio" name="guia" className="w-10 h-10 accent-[#009640]" checked={selected} onChange={() => setGuiaSelecionado(guia)} />
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

          </div>

          {/* ── LADO DIREITO: ASIDE DE RESERVA COM CALENDÁRIO ── */}
          <aside className="lg:sticky lg:top-36 self-start">
            <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden p-12 relative">
               <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
               
               <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-10 border-b-2 border-slate-50 pb-8`}>
                 Fechamento da Viagem
               </h3>

               {/* CALENDÁRIO MODERNO EMBUTIDO */}
               <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 mb-12 shadow-inner">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#00577C] mb-6">Datas da Viagem</p>
                  
                  <div className="flex items-center justify-between mb-6 px-2">
                     <button onClick={() => setMesAtualCalendario(new Date(mesAtualCalendario.getFullYear(), mesAtualCalendario.getMonth() - 1))} className="p-3 hover:bg-slate-200 rounded-full transition-colors"><ChevronLeft size={24}/></button>
                     <p className="font-black text-lg text-slate-800 capitalize">
                       {mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                     </p>
                     <button onClick={() => setMesAtualCalendario(new Date(mesAtualCalendario.getFullYear(), mesAtualCalendario.getMonth() + 1))} className="p-3 hover:bg-slate-200 rounded-full transition-colors"><ChevronRightIcon size={24}/></button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-4">
                     {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, i) => (
                       <span key={i} className="text-xs font-black text-slate-400">{dia}</span>
                     ))}
                  </div>

                  <div className="grid grid-cols-7 gap-y-2 gap-x-0">
                     {Array.from({ length: primeiroDiaDoMes(mesAtualCalendario.getFullYear(), mesAtualCalendario.getMonth()) }).map((_, i) => <div key={`empty-${i}`} />)}
                     
                     {Array.from({ length: diasDoMes(mesAtualCalendario.getFullYear(), mesAtualCalendario.getMonth()) }).map((_, i) => {
                        const dia = i + 1;
                        const dataAtual = new Date(mesAtualCalendario.getFullYear(), mesAtualCalendario.getMonth(), dia);
                        const dataStr = formatarDataIso(dataAtual);
                        
                        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
                        const isPassado = dataAtual < hoje;
                        const disponivel = !isPassado && isDisponivel(dataStr);
                        const isCheckin = checkin && dataAtual.getTime() === checkin.getTime();
                        const isCheckout = checkout && dataAtual.getTime() === checkout.getTime();
                        const isInBetween = checkin && checkout && dataAtual > checkin && dataAtual < checkout;
                        const isHovered = hoverDate && checkin && !checkout && dataAtual > checkin && dataAtual <= hoverDate;

                        let bgClass = "bg-transparent hover:bg-slate-200 text-slate-800";
                        if (isPassado || !disponivel) bgClass = "bg-transparent text-slate-300 cursor-not-allowed line-through";
                        else if (isCheckin || isCheckout) bgClass = "bg-[#00577C] text-white shadow-xl rounded-xl scale-110 z-10";
                        else if (isInBetween || isHovered) bgClass = "bg-[#00577C]/15 text-[#00577C] rounded-none";

                        return (
                          <button 
                            key={dia} 
                            disabled={isPassado || !disponivel}
                            onClick={() => handleDateClick(dataAtual)}
                            onMouseEnter={() => disponivel && setHoverDate(dataAtual)}
                            onMouseLeave={() => setHoverDate(null)}
                            className={`w-full aspect-square flex flex-col items-center justify-center transition-all ${bgClass}`}
                          >
                            <span className={`text-base ${isCheckin || isCheckout ? 'font-black' : 'font-bold'}`}>{dia}</span>
                            {disponivel && !isCheckin && !isCheckout && !isInBetween && (
                              <span className="text-[8px] font-black text-slate-400 -mt-1 tabular-nums">
                                R${Math.round(getPrecoDiariaHotel(dataStr))}
                              </span>
                            )}
                          </button>
                        );
                     })}
                  </div>
               </div>

               {/* RESUMO DE VALORES */}
               <div className="space-y-8 mb-12">
                  <div className="flex justify-between items-center">
                     <div className="flex gap-4 text-slate-500">
                        <Bed className="text-[#00577C]" size={24}/>
                        <div>
                          <p className="font-bold text-slate-800 text-lg">Hotel ({totalNoites} nts)</p>
                          <p className="text-xs font-bold uppercase tracking-widest mt-1">{tipoQuarto}</p>
                        </div>
                     </div>
                     <span className="font-black text-slate-900 text-2xl">{formatarMoeda(totalHospedagem)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                     <div className="flex gap-4 text-slate-500">
                        <Compass className="text-[#009640]" size={24}/>
                        <div>
                          <p className="font-bold text-slate-800 text-lg">Guia Local</p>
                          <p className="text-xs font-bold uppercase tracking-widest mt-1">Apoio Técnico</p>
                        </div>
                     </div>
                     <span className="font-black text-slate-900 text-2xl">{formatarMoeda(totalGuias)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                     <div className="flex gap-4 text-slate-500">
                        <Ticket className="text-[#F9C400]" size={24}/>
                        <div>
                          <p className="font-bold text-slate-800 text-lg">Atrações & Taxas</p>
                          <p className="text-xs font-bold uppercase tracking-widest mt-1">{atracoesInclusas.length} itens oficiais</p>
                        </div>
                     </div>
                     <span className="font-black text-slate-900 text-2xl">{formatarMoeda(totalAtracoes)}</span>
                  </div>
               </div>

               <div className="bg-[#009640]/5 p-10 rounded-[3rem] border-2 border-[#009640]/10 mb-12 text-center">
                  <span className="text-[12px] font-black text-[#009640] uppercase tracking-[0.4em] mb-4 block">Investimento Total</span>
                  <span className={`${jakarta.className} text-7xl font-black text-[#009640] tabular-nums`}>
                    {formatarMoeda(valorTotalFinal)}
                  </span>
               </div>

               <button 
                  onClick={handleProsseguir}
                  className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-8 rounded-[2rem] font-black text-2xl shadow-2xl hover:-translate-y-2 active:scale-95 transition-all flex items-center justify-center gap-5 group"
               >
                 Avançar para Checkout <ChevronRightIcon size={32} className="group-hover:translate-x-2 transition-transform" />
               </button>

               <div className="mt-10 grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-[1.5rem] flex items-center gap-4 border border-slate-100">
                     <ShieldCheck size={24} className="text-[#00577C]"/>
                     <span className="text-[11px] font-black text-slate-400 uppercase leading-none tracking-widest">Reserva<br/>Segura</span>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-[1.5rem] flex items-center gap-4 border border-slate-100">
                     <CalendarIcon size={24} className="text-[#009640]"/>
                     <span className="text-[11px] font-black text-slate-400 uppercase leading-none tracking-widest">Datas<br/>Dinâmicas</span>
                  </div>
               </div>
            </div>
          </aside>

        </div>

        {/* ─── SEÇÃO DE GALERIAS TOTAIS (RODAPÉ) ─── */}
        <div className="mt-48 space-y-48">
          
          {/* GALERIA DA EXPEDIÇÃO */}
          <section>
            <div className="flex items-center justify-between mb-16 border-l-[12px] border-[#00577C] pl-10">
              <div>
                 <p className="text-[#00577C] font-black uppercase tracking-[0.5em] text-sm mb-2">Visão Geral</p>
                 <h2 className={`${jakarta.className} text-6xl font-black text-slate-900`}>A Trilha e Destino</h2>
              </div>
              <Camera size={80} className="text-slate-100 hidden md:block" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {imagensRoteiro.map((url, index) => (
                <div key={index} onClick={() => { setAbaGaleria('destino'); setFotoExpandidaIndex(index); }} className="relative aspect-square rounded-[3.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-3 group bg-slate-200 cursor-pointer">
                   <Image src={url} alt={`Expedição ${index}`} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                   <div className="absolute inset-0 bg-[#00577C]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="text-white" size={48}/>
                   </div>
                </div>
              ))}
            </div>
          </section>

          {/* GALERIA DO HOTEL SELECIONADO */}
          <section>
            <div className="flex items-center justify-between mb-16 border-l-[12px] border-[#009640] pl-10">
              <div>
                 <p className="text-[#009640] font-black uppercase tracking-[0.5em] text-sm mb-2">Hospedagem Confirmada</p>
                 <h2 className={`${jakarta.className} text-6xl font-black text-slate-900`}>Conheça: {hotelSelecionado?.nome}</h2>
              </div>
              <Bed size={80} className="text-slate-100 hidden md:block" />
            </div>
            
            {getGaleriaHotel(hotelSelecionado).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                {getGaleriaHotel(hotelSelecionado).map((url: string, index: number) => (
                  <div key={index} onClick={() => { setAbaGaleria('hotel'); setFotoExpandidaIndex(index); }} className="relative aspect-[4/3] rounded-[3.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-3 group bg-slate-200 cursor-pointer">
                    <Image src={url} alt={`Acomodação ${index}`} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-[#009640]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="text-white" size={48}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-40 rounded-[4rem] border-4 border-dashed border-slate-100 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200 shadow-inner"><ImageIcon size={48}/></div>
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xl">Aguardando Fotos Oficiais do Hotel</p>
              </div>
            )}
          </section>

        </div>
      </div>

      {/* ── LIGHTBOX PARA GALERIA ── */}
      {fotoExpandidaIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-300" onClick={fecharGaleria}>
          <button onClick={fecharGaleria} className="absolute top-10 right-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"><X size={32} /></button>
          
          <button 
            onClick={(e) => fotoAnterior(e, galeriaAtivaParaModal.length)} 
            className="absolute left-10 top-1/2 -translate-y-1/2 p-6 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
          >
            <ChevronLeft size={48} />
          </button>
          
          <div className="relative w-full max-w-[80vw] aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10">
            <Image src={galeriaAtivaParaModal[fotoExpandidaIndex]} alt="Foto Expandida" fill className="object-contain" />
          </div>
          
          <button 
            onClick={(e) => proximaFoto(e, galeriaAtivaParaModal.length)} 
            className="absolute right-10 top-1/2 -translate-y-1/2 p-6 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
          >
            <ChevronRightIcon size={48} />
          </button>
          
          <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
            <p className="text-white font-black tracking-[0.4em] text-lg bg-black/60 inline-block px-8 py-4 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
              {fotoExpandidaIndex + 1} DE {galeriaAtivaParaModal.length}
            </p>
          </div>
        </div>
      )}

      {/* ── FOOTER INSTITUCIONAL (MAX-DETAIL) ── */}
      <footer className="mt-48 py-32 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
           <img src="/logop.png" alt="Prefeitura Oficial" className="h-24 object-contain mx-auto mb-12 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700" />
           <p className={`${jakarta.className} text-base text-slate-400 font-black uppercase tracking-[0.6em] leading-loose`}>
             Secretaria Municipal de Turismo <br/>
             São Geraldo do Araguaia — Pará <br/>
             <span className="text-[#F9C400]">Desenvolvimento e Transparência — 2026</span>
           </p>
           <div className="mt-16 flex justify-center gap-10 opacity-30">
              <Landmark size={32}/>
              <TreePine size={32}/>
              <Anchor size={32}/>
           </div>
        </div>
      </footer>

    </main>
  );
}

export default function PacoteDetalheWrapper() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#00577C] w-16 h-16"/></div>}><PacoteDetalheContent /></Suspense>;
}