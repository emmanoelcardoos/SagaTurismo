'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  ArrowLeft, MapPin, Star, CheckCircle2, Info, 
  Loader2, Menu, X, ChevronLeft, ChevronRight, ZoomIn, 
  Calendar as CalendarIcon, Bed, ChevronRight as ChevronRightIcon,
  Users, Award, Phone, Mail, Globe,
  Wind, Wifi, Bath, Maximize, Zap, CreditCard, Image as ImageIcon, Coffee,
  Edit3, ShieldCheck, Clock
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── UTILITÁRIOS ──
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
  quarto_standard_imagens?: string[];
  quarto_luxo_imagens?: string[];
  politicas?: { checkin_checkout?: string; criancas?: string; cafe_manha?: string; camas_extras?: string; idade_minima?: string; };
  contatos?: { telefone?: string; email?: string; website?: string; };
  avaliacoes_info?: { nota?: number; texto?: string; total?: number; limpeza?: number; comodidades?: number; localizacao?: number; atendimento?: number; };
};

type Disponibilidade = {
  data: string;
  quarto_standard_preco: any;
  quarto_standard_disponivel: boolean;
  quarto_luxo_preco: any;
  quarto_luxo_disponivel: boolean;
};

// ── COMPONENTE INTERNO (Para usar searchParams) ──
function HotelDetalheContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [disponibilidadeDb, setDisponibilidadeDb] = useState<Record<string, Disponibilidade>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Estados do Motor
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [mesAtualCalendario, setMesAtualCalendario] = useState(new Date());
  const [adultos, setAdultos] = useState(2);
  const [quartos, setQuartos] = useState(1);
  const [criancas, setCriancas] = useState(0);

  const [imgIdxStandard, setImgIdxStandard] = useState(0);
  const [imgIdxLuxo, setImgIdxLuxo] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: hotelData, error: hotelError } = await supabase.from('hoteis').select('*').eq('id', params.id).single();
        if (hotelError) throw new Error("Erro ao buscar a hospedagem.");
        const { data: dispData } = await supabase.from('hotel_disponibilidade').select('*').eq('hotel_id', params.id);
        const dispMap: Record<string, Disponibilidade> = {};
        if (dispData) dispData.forEach((d: any) => { dispMap[d.data] = d; });
        
        setHotel(hotelData);
        setDisponibilidadeDb(dispMap);
      } catch (err: any) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    }

    // Sincronização automática com os dados da página anterior
    const ci = searchParams.get('checkin');
    const co = searchParams.get('checkout');
    const ad = searchParams.get('adultos');
    const qu = searchParams.get('quartos');

    if (ci && ci !== 'null') setCheckin(new Date(ci));
    if (co && co !== 'null') setCheckout(new Date(co));
    if (ad) setAdultos(Number(ad));
    if (qu) setQuartos(Number(qu));

    fetchData();
  }, [params.id, searchParams]);

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

  const getPrecoDiaria = (dataStr: string, tipo: 'standard' | 'luxo') => {
    const disp = disponibilidadeDb[dataStr];
    if (disp) return tipo === 'luxo' ? parseValor(disp.quarto_luxo_preco) : parseValor(disp.quarto_standard_preco);
    return hotel ? (tipo === 'luxo' ? parseValor(hotel.quarto_luxo_preco) : parseValor(hotel.quarto_standard_preco)) : 0;
  };

  const calcularEstadiaTotal = (tipo: 'standard' | 'luxo') => {
    if (!checkin || !checkout) return (hotel ? parseValor(tipo === 'luxo' ? hotel.quarto_luxo_preco : hotel.quarto_standard_preco) : 0) * quartos;
    let total = 0;
    let dia = new Date(checkin);
    while (dia < checkout) {
      const ds = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
      total += getPrecoDiaria(ds, tipo);
      dia.setDate(dia.getDate() + 1);
    }
    return total * quartos;
  };

  const noites = (checkin && checkout) ? Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 3600 * 24)) : 1;

  const handleReserva = (tipo: 'standard' | 'luxo') => {
    if (!checkin || !checkout) {
      document.getElementById('motor-reservas')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    router.push(`/checkout-hotel?hotel=${hotel?.id}&quarto=${tipo}&checkin=${checkin.toISOString().split('T')[0]}&checkout=${checkout.toISOString().split('T')[0]}&adultos=${adultos}&quartos=${quartos}&criancas=${criancas}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#00577C]" size={48} /></div>;
  if (!hotel) return null;

  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const anoC = mesAtualCalendario.getFullYear();
  const mesC = mesAtualCalendario.getMonth();
  const totalDiasMes = new Date(anoC, mesC + 1, 0).getDate();
  const primeiroDiaSemana = new Date(anoC, mesC, 1).getDay();

  const imagensStandard = getArraySeguro(hotel.quarto_standard_imagens).length > 0 ? getArraySeguro(hotel.quarto_standard_imagens) : [hotel.imagem_url];
  const imagensLuxo = getArraySeguro(hotel.quarto_luxo_imagens).length > 0 ? getArraySeguro(hotel.quarto_luxo_imagens) : [hotel.imagem_url];

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900`}>
      {/* HEADER */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-16 md:w-56 shrink-0"><Image src="/logop.png" alt="SGA" fill priority className="object-contain object-left" /></div>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl border border-slate-200 p-2 lg:hidden text-[#00577C]">
            {isMobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
          <nav className="hidden lg:flex items-center gap-7 font-bold text-sm">
            <Link href="/hoteis" className="text-slate-600 hover:text-[#00577C]">Alojamentos</Link>
            <Link href="/cadastro" className="bg-[#F9C400] text-[#00577C] px-5 py-2.5 rounded-full hover:bg-[#ffd633] transition-all">Cartão Residente</Link>
          </nav>
        </div>
        {isMobileMenuOpen && (
          <div className="absolute top-[100%] left-0 w-full bg-white border-b border-slate-200 p-5 flex flex-col gap-4 shadow-xl lg:hidden text-left animate-in slide-in-from-top-4">
            <Link href="/hoteis" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Hospedagem</Link>
            <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#F9C400] text-[#00577C] font-black px-4 py-3.5 rounded-xl text-center">Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <div className="relative w-full h-[40vh] md:h-[55vh] bg-slate-900 mt-[65px] md:mt-[80px]">
        <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F5F7FA] via-transparent to-transparent" />
        <div className="absolute bottom-10 left-5 md:left-16 right-5 text-left">
          <Link href="/hoteis" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-white/70 mb-4 hover:text-white transition-colors">
            <ArrowLeft size={14}/> Voltar para a listagem
          </Link>
          <h1 className={`${jakarta.className} text-3xl md:text-6xl font-black text-white leading-tight drop-shadow-xl`}>{hotel.nome}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex gap-0.5">{Array.from({ length: hotel.estrelas }).map((_, i) => <Star key={i} size={16} className="fill-[#F9C400] text-[#F9C400]" />)}</div>
            <p className="text-white font-bold flex items-center gap-1.5 text-xs md:text-sm"><MapPin size={16} className="text-[#F9C400]"/> {hotel.endereco}</p>
          </div>
        </div>
      </div>

      {/* BARRA DE SELEÇÃO RÁPIDA (UX MOBILE) */}
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

      <div className="mx-auto w-full max-w-7xl px-4 md:px-5 py-8 md:py-12 flex flex-col lg:flex-row items-start gap-8">
        
        {/* COLUNA ESQUERDA */}
        <div className="flex-1 w-full space-y-8">
          
          {/* QUARTOS */}
          <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden text-left">
             <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
               <div>
                  <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900`}>Acomodações Disponíveis</h3>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Valores para {noites} {noites === 1 ? 'noite' : 'noites'}</p>
               </div>
               <div className="hidden sm:flex items-center gap-2 bg-[#009640]/10 text-[#009640] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">
                  <CheckCircle2 size={14}/> Preço Final Garantido
               </div>
             </div>

             <div className="p-4 md:p-8 space-y-8">
                {/* STANDARD */}
                <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm flex flex-col">
                   <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                      <h4 className={`${jakarta.className} font-bold text-slate-800`}>{hotel.quarto_standard_nome || 'Quarto Standard'}</h4>
                      <div className="flex items-center gap-1 text-slate-400 font-bold text-xs"><Users size={14}/> x2 hóspedes</div>
                   </div>
                   <div className="flex flex-col xl:flex-row">
                      <div className="w-full xl:w-1/3 p-5">
                         <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
                            <Image src={imagensStandard[imgIdxStandard]} alt="Standard" fill className="object-cover" />
                            <button onClick={() => setImgIdxStandard(p => (p-1+imagensStandard.length)%imagensStandard.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-1 rounded-full text-white"><ChevronLeft size={16}/></button>
                            <button onClick={() => setImgIdxStandard(p => (p+1)%imagensStandard.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-1 rounded-full text-white"><ChevronRightIcon size={16}/></button>
                         </div>
                         <div className="grid grid-cols-2 gap-3 mt-4 text-[10px] md:text-xs text-slate-600 font-bold">
                            <span className="flex items-center gap-2"><Wind size={14} className="text-slate-400"/> Ar-condic.</span>
                            <span className="flex items-center gap-2"><Wifi size={14} className="text-slate-400"/> Wi-Fi Grátis</span>
                         </div>
                      </div>
                      <div className="flex-1 p-6 flex flex-col sm:flex-row gap-6">
                         <div className="flex-1 space-y-4">
                            <p className="text-[10px] font-black uppercase text-[#00577C] tracking-widest">Incluso nesta reserva</p>
                            <ul className="space-y-2">
                               <li className="flex items-center gap-2 text-xs font-bold text-[#009640]"><CheckCircle2 size={14}/> Cancelamento Gratuito (24h)</li>
                               <li className="flex items-center gap-2 text-xs font-bold text-slate-600"><Zap size={14} className="text-[#00577C]"/> Confirmação Imediata</li>
                            </ul>
                         </div>
                         <div className="sm:w-56 bg-slate-50 rounded-2xl p-5 flex flex-col items-center sm:items-end justify-center border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total da Estadia</p>
                            <p className={`${jakarta.className} text-3xl font-black text-slate-900 leading-none mb-1`}>{formatarMoeda(calcularEstadiaTotal('standard'))}</p>
                            <p className="text-[10px] font-bold text-slate-400 mb-4">Em {quartos} quarto(s)</p>
                            <button onClick={() => handleReserva('standard')} className="w-full bg-[#00577C] text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md active:scale-95 transition-all">Reservar Agora</button>
                         </div>
                      </div>
                   </div>
                </div>

                {/* LUXO */}
                <div className="border-2 border-[#F9C400]/30 rounded-3xl overflow-hidden bg-white shadow-md flex flex-col relative">
                   <div className="absolute top-0 right-0 bg-[#F9C400] text-[#00577C] text-[10px] font-black uppercase px-4 py-2 rounded-bl-2xl z-10 flex items-center gap-2 shadow-sm">
                      <Award size={14}/> Recomendado
                   </div>
                   <div className="bg-[#f9c400]/5 px-6 py-4 border-b border-[#f9c400]/20">
                      <h4 className={`${jakarta.className} font-bold text-[#00577C]`}>{hotel.quarto_luxo_nome || 'Suíte Master'}</h4>
                   </div>
                   <div className="flex flex-col xl:flex-row">
                      <div className="w-full xl:w-1/3 p-5">
                         <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
                            <Image src={imagensLuxo[imgIdxLuxo]} alt="Luxo" fill className="object-cover" />
                            <button onClick={() => setImgIdxLuxo(p => (p-1+imagensLuxo.length)%imagensLuxo.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-1 rounded-full text-white"><ChevronLeft size={16}/></button>
                            <button onClick={() => setImgIdxLuxo(p => (p+1)%imagensLuxo.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-1 rounded-full text-white"><ChevronRightIcon size={16}/></button>
                         </div>
                         <div className="grid grid-cols-2 gap-3 mt-4 text-[10px] md:text-xs text-slate-600 font-bold">
                            <span className="flex items-center gap-2"><Bath size={14} className="text-slate-400"/> Hidromassagem</span>
                            <span className="flex items-center gap-2"><Coffee size={14} className="text-slate-400"/> Café Manhã</span>
                         </div>
                      </div>
                      <div className="flex-1 p-6 flex flex-col sm:flex-row gap-6">
                         <div className="flex-1 space-y-4">
                            <p className="text-[10px] font-black uppercase text-[#00577C] tracking-widest">Upgrade de Conforto</p>
                            <ul className="space-y-2">
                               <li className="flex items-center gap-2 text-xs font-bold text-slate-600"><Coffee size={14} className="text-[#00577C]"/> Pequeno-almoço incluso</li>
                               <li className="flex items-center gap-2 text-xs font-bold text-[#009640]"><ShieldCheck size={14}/> Seguro Viagem Cortesia</li>
                            </ul>
                         </div>
                         <div className="sm:w-56 bg-blue-50/50 rounded-2xl p-5 flex flex-col items-center sm:items-end justify-center border border-blue-100">
                            <p className="text-[10px] font-black text-[#00577C] uppercase mb-1">Total da Estadia</p>
                            <p className={`${jakarta.className} text-3xl font-black text-[#00577C] leading-none mb-1`}>{formatarMoeda(calcularEstadiaTotal('luxo'))}</p>
                            <p className="text-[10px] font-bold text-[#00577C]/60 mb-4">Melhor preço online</p>
                            <button onClick={() => handleReserva('luxo')} className="w-full bg-[#F9C400] text-[#00577C] py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md active:scale-95 transition-all">Reservar Agora</button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* AVALIAÇÕES - PRESERVADO INTEGRALMENTE */}
          <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 md:p-10 text-left">
             <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-8`}>Avaliações dos hóspedes</h3>
             <div className="flex flex-col lg:flex-row gap-10">
                <div className="w-full lg:w-1/3">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="bg-[#00577C] text-white text-3xl font-black rounded-xl w-16 h-14 flex items-center justify-center shadow-lg">{hotel.avaliacoes_info?.nota || 8.8}</div>
                      <div>
                         <p className={`${jakarta.className} text-lg font-black text-[#00577C] leading-tight`}>{hotel.avaliacoes_info?.texto || 'Muito bom'}</p>
                         <p className="text-xs text-slate-500 font-bold">{hotel.avaliacoes_info?.total || 73} avaliações oficiais</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      {[{ l: 'Limpeza', s: hotel.avaliacoes_info?.limpeza || 9.0 }, { l: 'Comodidades', s: 8.2 }, { l: 'Localização', s: 9.6 }, { l: 'Atendimento', s: 8.5 }].map(item => (
                         <div key={item.l}>
                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1"><span>{item.l}</span><span className="text-[#00577C]">{item.s.toFixed(1)}</span></div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-[#00577C] h-1.5 rounded-full" style={{ width: `${(item.s / 10) * 100}%` }}></div></div>
                         </div>
                      ))}
                   </div>
                </div>
                <div className="w-full lg:w-2/3 space-y-6">
                   <div className="border-b border-slate-100 pb-6">
                      <div className="flex items-center gap-3 mb-3">
                         <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#00577C] font-black text-xs">M</div>
                         <div><p className="text-sm font-bold text-slate-800">Maria Silva</p><p className="text-[10px] text-slate-400 mt-0.5">Maio 2026</p></div>
                      </div>
                      <p className="text-sm text-slate-600 font-medium italic">"Experiência fantástica. O hotel é muito limpo e os funcionários são muito atenciosos."</p>
                   </div>
                </div>
             </div>
          </section>

          {/* POLÍTICAS - PRESERVADO INTEGRALMENTE */}
          <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 md:p-10 text-left">
             <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-8`}>Políticas da Propriedade</h3>
             <div className="grid md:grid-cols-[1fr_2fr] gap-x-8 gap-y-6 text-sm">
                <div className="font-black text-slate-800">Check-in / Check-out</div>
                <div className="text-slate-600 font-medium">{hotel.politicas?.checkin_checkout || 'Check-in: 14h | Check-out: 12h'}</div>
                <div className="md:col-span-2 h-px bg-slate-100"></div>
                <div className="font-black text-slate-800">Políticas para crianças</div>
                <div className="text-slate-600 font-medium">{hotel.politicas?.criancas || 'Crianças de todas as idades são bem-vindas.'}</div>
                <div className="md:col-span-2 h-px bg-slate-100"></div>
                <div className="font-black text-slate-800">Café da Manhã</div>
                <div className="text-slate-600 font-medium">{hotel.politicas?.cafe_manha || 'Servido diariamente das 07:00 às 10:00.'}</div>
             </div>
          </section>

          {/* CONTACTO - PRESERVADO INTEGRALMENTE */}
          <section className="bg-[#002f40] rounded-[2rem] border border-[#00577C] shadow-xl p-8 md:p-10 text-white relative overflow-hidden text-left">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Globe size={150}/></div>
             <h3 className={`${jakarta.className} text-2xl font-black mb-8 relative z-10`}>Informações de Contacto</h3>
             <div className="grid sm:grid-cols-2 gap-6 relative z-10">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 flex items-center gap-4">
                   <Phone className="text-[#F9C400]" size={24}/>
                   <div><p className="text-[10px] font-black uppercase text-white/50 mb-1">Telefone</p><p className="font-bold">{hotel.contatos?.telefone || '+55 (94) 90000-0000'}</p></div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 flex items-center gap-4">
                   <Mail className="text-[#F9C400]" size={24}/>
                   <div className="overflow-hidden"><p className="text-[10px] font-black uppercase text-white/50 mb-1">E-mail</p><p className="font-bold truncate">{hotel.contatos?.email || 'contato@hotel.com.br'}</p></div>
                </div>
             </div>
          </section>
        </div>

        {/* ── COLUNA DIREITA: MOTOR DE RESERVAS (STICKY) ── */}
        <div id="motor-reservas" className="w-full lg:w-[380px] shrink-0 lg:self-start lg:sticky lg:top-32 relative z-30">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-200 text-left">
             <h3 className={`${jakarta.className} text-lg md:text-xl font-black text-slate-900 mb-6 flex items-center gap-2`}><CalendarIcon className="text-[#00577C]" size={20}/> Sua Reserva</h3>
             
             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                   <button onClick={() => setMesAtualCalendario(new Date(anoC, mesC - 1))} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><ChevronLeft size={18}/></button>
                   <p className="font-bold text-slate-800 capitalize text-sm">{mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                   <button onClick={() => setMesAtualCalendario(new Date(anoC, mesC + 1))} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><ChevronRight size={18}/></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-1">{['D','S','T','Q','Q','S','S'].map((d, i) => <span key={i} className="text-[9px] font-black text-slate-400">{d}</span>)}</div>
                <div className="grid grid-cols-7 gap-y-0.5">
                   {Array.from({ length: primeiroDiaSemana }).map((_, i) => <div key={`e-${i}`} />)}
                   {Array.from({ length: totalDiasMes }).map((_, i) => {
                      const dt = new Date(anoC, mesC, i + 1);
                      const isPassado = dt < hoje;
                      const isCi = checkin && dt.toDateString() === checkin.toDateString();
                      const isCo = checkout && dt.toDateString() === checkout.toDateString();
                      const isBetween = checkin && checkout && dt > checkin && dt < checkout;
                      
                      let bg = "bg-transparent hover:bg-slate-200 text-slate-800";
                      if (isPassado) bg = "text-slate-300 cursor-not-allowed";
                      else if (isCi || isCo) bg = "bg-[#00577C] text-white rounded-lg font-black scale-110 z-10 shadow-md";
                      else if (isBetween) bg = "bg-[#00577C]/10 text-[#00577C] rounded-none";

                      return <button key={i} disabled={isPassado} onClick={() => handleDateClick(dt)} className={`w-full aspect-square flex items-center justify-center text-[10px] md:text-xs font-bold transition-all ${bg}`}>{i + 1}</button>;
                   })}
                </div>
             </div>

             <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase text-[#00577C]">Adultos</span>
                   <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                      <button onClick={() => setAdultos(Math.max(1, adultos - 1))} className="w-7 h-7 flex justify-center items-center text-[#00577C] font-black">-</button>
                      <span className="font-bold text-xs w-4 text-center">{adultos}</span>
                      <button onClick={() => setAdultos(adultos + 1)} className="w-7 h-7 flex justify-center items-center text-[#00577C] font-black">+</button>
                   </div>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase text-[#00577C]">Quartos</span>
                   <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                      <button onClick={() => setQuartos(Math.max(1, quartos - 1))} className="w-7 h-7 flex justify-center items-center text-[#00577C] font-black">-</button>
                      <span className="font-bold text-xs w-4 text-center">{quartos}</span>
                      <button onClick={() => setQuartos(quartos + 1)} className="w-7 h-7 flex justify-center items-center text-[#00577C] font-black">+</button>
                   </div>
                </div>
             </div>
             
             {!checkin || !checkout ? (
               <div className="mt-6 p-4 bg-blue-50 text-[#00577C] rounded-2xl flex items-start gap-3 border border-blue-100">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed">Selecione o check-in e check-out para calcular o valor final da estadia.</p>
               </div>
             ) : (
               <div className="mt-6 p-4 bg-green-50 text-[#009640] rounded-2xl flex items-start gap-3 border border-green-100">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold leading-tight">Datas selecionadas!</p>
                    <p className="text-[10px] font-medium opacity-80 mt-1">Os preços já foram atualizados ({noites} noites).</p>
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-12 md:py-20 px-5 md:px-8 border-t border-slate-200 bg-white mt-auto text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
             <Image src="/logop.png" alt="SGA" width={140} height={50} className="object-contain" />
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Secretaria Municipal de Turismo - SGA</p>
          </div>
          <div className="text-left md:border-l-2 border-slate-100 md:pl-6">
             <p className="text-[10px] font-black text-[#00577C] uppercase mb-1">Contato Oficial</p>
             <p className="text-xs font-bold text-slate-500 tracking-tight">setursaga@gmail.com</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ── EXPORT FINAL COM SUSPENSE ──
export default function HotelDetalhePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#00577C] w-12 h-12" /></div>}>
      <HotelDetalheContent params={params} />
    </Suspense>
  );
}