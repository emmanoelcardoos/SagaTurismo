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

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740";

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
  quarto_standard_nome?: string; quarto_standard_preco: any;
  quarto_luxo_nome?: string; quarto_luxo_preco: any;
  quarto_standard_imagens?: string[]; quarto_luxo_imagens?: string[];
  galeria: string[] | string;
};
type Guia = { id: string; nome: string; preco_diaria: any; especialidade: string; imagem_url: string; };
type Atracao = { id: string; nome: string; preco_entrada: any; tipo: string; };
type Pacote = {
  id: string; titulo: string; descricao_curta: string; roteiro_detalhado: string;
  imagens_galeria: string[]; imagem_principal: string; dias: number; noites: number;
  pacote_itens: { hoteis: Hotel | null; guias: Guia | null; atracoes: Atracao | null; }[];
};
type Disponibilidade = {
  data: string; quarto_standard_preco: any; quarto_standard_disponivel: boolean;
  quarto_luxo_preco: any; quarto_luxo_disponivel: boolean;
};

function PacoteDetalheContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [mesAtualCalendario, setMesAtualCalendario] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await supabase.from('pacotes').select(`*, pacote_itens ( hoteis (*), guias (*), atracoes (*) )`).eq('id', id).single();
        if (!data) return router.push('/pacotes');
        
        const pct = data as Pacote;
        setPacote(pct);
        const itens = pct.pacote_itens || [];
        setHoteisDisponiveis(itens.map((i: any) => i?.hoteis).filter(Boolean));
        setGuiasDisponiveis(itens.map((i: any) => i?.guias).filter(Boolean));
        setAtracoesInclusas(itens.map((i: any) => i?.atracoes).filter(Boolean));
        
        if (itens.map((i: any) => i?.hoteis).filter(Boolean).length > 0) setHotelSelecionado(itens.map((i: any) => i?.hoteis).filter(Boolean)[0]);
        if (itens.map((i: any) => i?.guias).filter(Boolean).length > 0) setGuiaSelecionado(itens.map((i: any) => i?.guias).filter(Boolean)[0]);
      } finally { setLoading(false); }
    }
    fetchData();
  }, [id, router]);

  useEffect(() => {
    const handleScroll = () => {
      const cur = window.scrollY;
      setShowHeader(cur < 80 || cur < lastScrollY);
      setLastScrollY(cur);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleDateClick = (data: Date) => {
    if (!checkin || (checkin && checkout)) { setCheckin(data); setCheckout(null); } 
    else if (data > checkin) setCheckout(data);
    else setCheckin(data);
  };

  const noitesReserva = (checkin && checkout) ? Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 3600 * 24)) : 1;
  const precoHospedagem = hotelSelecionado ? parseValor(tipoQuarto === 'luxo' ? hotelSelecionado.quarto_luxo_preco : hotelSelecionado.quarto_standard_preco) * noitesReserva : 0;
  const precoGuia = guiaSelecionado ? parseValor(guiaSelecionado.preco_diaria) * (noitesReserva + 1) : 0;
  const precoAtracoes = atracoesInclusas.reduce((acc, curr) => acc + parseValor(curr.preco_entrada), 0);
  const valorTotalFinal = precoHospedagem + precoGuia + precoAtracoes;

  const handleReserva = () => {
    if (!checkin || !checkout) return document.getElementById('motor-reservas')?.scrollIntoView({ behavior: 'smooth' });
    router.push(`/checkout?pacote=${pacote?.id}&hotel=${hotelSelecionado?.id}&quarto=${tipoQuarto}&guia=${guiaSelecionado?.id}&checkin=${checkin.toISOString().split('T')[0]}&checkout=${checkout.toISOString().split('T')[0]}`);
  };

  const galeriaCombinada = [...(pacote?.imagem_principal ? [pacote.imagem_principal] : []), ...getArraySeguro(pacote?.imagens_galeria)];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#00577C]" size={40} /></div>;
  if (!pacote) return null;

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-24 md:pb-0`}>
      
      {/* HEADER */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/"><Image src="/logop.png" alt="SGA" width={140} height={40} className="object-contain" /></Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-[#00577C]"><Menu size={24}/></button>
          <nav className="hidden lg:flex items-center gap-6 font-bold text-sm">
            <Link href="/pacotes" className="text-slate-600">Pacotes</Link>
            <Link href="/cadastro" className="bg-[#F9C400] text-[#00577C] px-5 py-2 rounded-full">Cartão Residente</Link>
          </nav>
        </div>
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b p-5 flex flex-col gap-4 shadow-xl lg:hidden animate-in slide-in-from-top-4">
            <Link href="/pacotes" className="font-bold">Todos os Pacotes</Link>
            <Link href="/cadastro" className="bg-[#F9C400] text-[#00577C] font-black p-3 rounded-xl text-center">Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <div className="relative w-full h-[40vh] md:h-[50vh] bg-slate-900 mt-[65px] md:mt-[80px]">
        <Image src={pacote.imagem_principal || FALLBACK_IMAGE} alt="Hero" fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F5F7FA] via-transparent to-transparent" />
        <div className="absolute bottom-10 left-5 md:left-16 text-left">
           <Link href="/pacotes" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-white/70 mb-3"><ArrowLeft size={14}/> Voltar</Link>
           <h1 className={`${jakarta.className} text-3xl md:text-6xl font-black text-white leading-tight drop-shadow-lg`}>{pacote.titulo}</h1>
           <p className="text-white/80 font-bold flex items-center gap-2 mt-2 text-xs md:text-sm"><MapPin size={16} className="text-[#F9C400]"/> São Geraldo do Araguaia, Pará</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-5 py-8 md:py-12 flex flex-col lg:flex-row items-start gap-8 relative z-10 -mt-10">
        
        {/* COLUNA ESQUERDA */}
        <div className="flex-1 w-full space-y-8">
          
          {/* ROTEIRO */}
          <section className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border border-slate-100 text-left">
             <div className="flex items-center gap-3 text-xs font-bold text-[#00577C] mb-6 bg-blue-50 w-fit px-4 py-2 rounded-full">
                <Clock size={16}/> {pacote.dias} Dias / {pacote.noites} Noites
             </div>
             <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 mb-6`}>Detalhes da Expedição</h3>
             <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm md:text-base">{pacote.roteiro_detalhado}</p>
          </section>

          {/* ACOMODAÇÃO */}
          <section className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border border-slate-100 text-left">
             <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-8 flex items-center gap-3`}><Bed size={24} className="text-[#00577C]"/> 1. Escolha a Hospedagem</h3>
             <div className="space-y-6">
                {hoteisDisponiveis.map(h => (
                   <div key={h.id} className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${hotelSelecionado?.id === h.id ? 'border-[#00577C] bg-blue-50/30' : 'border-slate-100'}`} onClick={() => setHotelSelecionado(h)}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-bold text-slate-800">{h.nome}</p>
                        {hotelSelecionado?.id === h.id && <CheckCircle2 size={20} className="text-[#00577C]"/>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => setTipoQuarto('standard')} className={`p-3 rounded-xl border text-xs font-black uppercase ${tipoQuarto === 'standard' ? 'bg-[#00577C] text-white' : 'bg-white'}`}>Standard</button>
                         <button onClick={() => setTipoQuarto('luxo')} className={`p-3 rounded-xl border text-xs font-black uppercase ${tipoQuarto === 'luxo' ? 'bg-[#F9C400] text-[#00577C]' : 'bg-white'}`}>Luxo</button>
                      </div>
                   </div>
                ))}
             </div>
          </section>

          {/* GUIA */}
          <section className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border border-slate-100 text-left">
             <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-8 flex items-center gap-3`}><UserCheck size={24} className="text-[#009640]"/> 2. Guia de Turismo</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {guiasDisponiveis.map(g => (
                   <div key={g.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${guiaSelecionado?.id === g.id ? 'border-[#009640] bg-green-50' : 'border-slate-100'}`} onClick={() => setGuiaSelecionado(g)}>
                      <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0"><Image src={g.imagem_url || FALLBACK_IMAGE} alt="Guia" fill className="object-cover"/></div>
                      <div className="text-left"><p className="font-bold text-sm text-slate-800">{g.nome}</p><p className="text-[10px] uppercase font-black text-[#009640]">{g.especialidade}</p></div>
                   </div>
                ))}
             </div>
          </section>
        </div>

        {/* COLUNA DIREITA: MOTOR DE RESERVAS */}
        <div id="motor-reservas" className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-32 h-fit lg:self-start z-30">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 text-left">
             <div className="text-center mb-6 border-b pb-6">
                <p className="text-[10px] font-black uppercase text-slate-400">Investimento Total</p>
                <p className={`${jakarta.className} text-4xl font-black text-[#009640]`}>{formatarMoeda(valorTotalFinal)}</p>
             </div>

             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                   <button onClick={() => setMesAtualCalendario(new Date(mesAtualCalendario.getFullYear(), mesAtualCalendario.getMonth()-1))} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><ChevronLeft size={18}/></button>
                   <p className="font-bold text-slate-800 capitalize text-sm">{mesAtualCalendario.toLocaleString('pt-BR', {month:'long', year:'numeric'})}</p>
                   <button onClick={() => setMesAtualCalendario(new Date(mesAtualCalendario.getFullYear(), mesAtualCalendario.getMonth()+1))} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><ChevronRight size={18}/></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-1">{['D','S','T','Q','Q','S','S'].map(d => <span key={d} className="text-[9px] font-black text-slate-400">{d}</span>)}</div>
                <div className="grid grid-cols-7 gap-y-0.5">
                   {Array.from({length: primeiroDia}).map((_,i) => <div key={i} />)}
                   {Array.from({length: totalDiasMes}).map((_,i) => {
                      const d = new Date(mesAtualCalendario.getFullYear(), mesAtualCalendario.getMonth(), i+1);
                      const isP = d < hoje;
                      const isCi = checkin && d.toDateString() === checkin.toDateString();
                      const isCo = checkout && d.toDateString() === checkout.toDateString();
                      const isB = checkin && checkout && d > checkin && d < checkout;
                      let bg = "bg-transparent hover:bg-slate-200 text-slate-800";
                      if (isP) bg = "text-slate-300 cursor-not-allowed";
                      else if (isCi || isCo) bg = "bg-[#00577C] text-white rounded-lg font-black scale-110 z-10 shadow-md";
                      else if (isB) bg = "bg-[#00577C]/10 text-[#00577C] rounded-none";
                      return <button key={i} disabled={isP} onClick={() => handleDateClick(d)} className={`w-full aspect-square flex items-center justify-center text-[10px] md:text-xs font-bold transition-all ${bg}`}>{i+1}</button>;
                   })}
                </div>
             </div>

             <div className="space-y-3 mb-8 text-xs font-bold text-slate-500">
                <div className="flex justify-between"><span>Hospedagem ({noitesReserva} nts)</span><span className="text-slate-800">{formatarMoeda(precoHospedagem)}</span></div>
                <div className="flex justify-between"><span>Serviço de Guia</span><span className="text-slate-800">{formatarMoeda(precoGuia)}</span></div>
                <div className="flex justify-between"><span>Atrações Inclusas</span><span className="text-slate-800">{formatarMoeda(precoAtracoes)}</span></div>
             </div>

             <button onClick={handleReserva} className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
                Reservar Agora <ChevronRight size={18}/>
             </button>
          </div>
        </div>
      </div>

      {/* BARRA DE AÇÃO MOBILE (STICKY BOTTOM) */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 p-4 lg:hidden shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
         <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div className="text-left">
               <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Total do Pacote</p>
               <p className={`${jakarta.className} text-2xl font-black text-[#009640] tabular-nums`}>{formatarMoeda(valorTotalFinal)}</p>
            </div>
            <button onClick={handleReserva} className="bg-[#00577C] text-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2">
               Reservar <ArrowRight size={16}/>
            </button>
         </div>
      </div>

      {/* FOOTER */}
      <footer className="py-12 md:py-20 px-5 border-t bg-white text-left mt-10">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
            <Image src="/logop.png" alt="SGA" width={140} height={50} className="object-contain opacity-40 grayscale" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed md:text-right">© 2026 Secretaria Municipal de Turismo - SGA <br/> Portal Oficial de Turismo e Reservas</p>
         </div>
      </footer>
    </main>
  );
}

export default function PacoteDetalhePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#00577C]" size={48} /></div>}>
      <PacoteDetalheContent />
    </Suspense>
  );
}