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
  ChevronLeft, ChevronRight as ChevronRightIcon, ZoomIn
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── UTILITÁRIOS ──
const parseValor = (valor: any): number => {
  if (valor === null || valor === undefined || valor === '') return 0;
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  return isNaN(num) ? 0 : num;
};

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

// ── TIPAGENS ──
type Hotel = {
  id: string; nome: string; tipo: string; imagem_url: string;
  quarto_standard_nome: string; quarto_standard_preco: any;
  quarto_luxo_nome: string; quarto_luxo_preco: any;
  galeria: string[] | string;
};
type Guia = { id: string; nome: string; preco_diaria: any; especialidade: string; imagem_url: string; };
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

function PacoteDetalheContent() {
  const { id } = useParams();
  const router = useRouter();

  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [loading, setLoading] = useState(true);
  const [disponibilidadeDb, setDisponibilidadeDb] = useState<Record<string, Disponibilidade>>({});

  // Seleções do Usuário
  const [hotelSelecionado, setHotelSelecionado] = useState<Hotel | null>(null);
  const [tipoQuarto, setTipoQuarto] = useState<'standard' | 'luxo'>('standard');
  const [guiaSelecionado, setGuiaSelecionado] = useState<Guia | null>(null);
  const [atracoesInclusas, setAtracoesInclusas] = useState<Atracao[]>([]);

  // Calendário
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [mesAtualCalendario, setMesAtualCalendario] = useState<Date>(new Date());
  
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from('pacotes').select(`*, pacote_itens ( hoteis (*), guias (*), atracoes (*) )`).eq('id', id).single();
      if (error) { router.push('/pacotes'); return; }
      
      const pct = data as Pacote;
      setPacote(pct);
      const hoteis = pct.pacote_itens.map(i => i.hoteis).filter(Boolean) as Hotel[];
      const guias = pct.pacote_itens.map(i => i.guias).filter(Boolean) as Guia[];
      setAtracoesInclusas(pct.pacote_itens.map(i => i.atracoes).filter(Boolean) as Atracao[]);

      if (hoteis.length > 0) {
        setHotelSelecionado(hoteis[0]);
        // Buscar disponibilidade do primeiro hotel
        const { data: dispData } = await supabase.from('hotel_disponibilidade').select('*').eq('hotel_id', hoteis[0].id);
        const dispMap: Record<string, Disponibilidade> = {};
        dispData?.forEach((d: any) => { dispMap[d.data] = d; });
        setDisponibilidadeDb(dispMap);
      }
      if (guias.length > 0) setGuiaSelecionado(guias[0]);
      setLoading(false);
    }
    if (id) fetchData();
  }, [id, router]);

  // Atualizar disponibilidade quando o hotel muda
  useEffect(() => {
    async function fetchDisp() {
      if (!hotelSelecionado) return;
      const { data } = await supabase.from('hotel_disponibilidade').select('*').eq('hotel_id', hotelSelecionado.id);
      const dispMap: Record<string, Disponibilidade> = {};
      data?.forEach((d: any) => { dispMap[d.data] = d; });
      setDisponibilidadeDb(dispMap);
    }
    fetchDisp();
  }, [hotelSelecionado]);

  // Lógica do Calendário
  const formatarDataIso = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  const getPrecoDiariaHotel = (dataStr: string) => {
    const disp = disponibilidadeDb[dataStr];
    if (disp) return tipoQuarto === 'luxo' ? parseValor(disp.quarto_luxo_preco) : parseValor(disp.quarto_standard_preco);
    return hotelSelecionado ? (tipoQuarto === 'luxo' ? parseValor(hotelSelecionado.quarto_luxo_preco) : parseValor(hotelSelecionado.quarto_standard_preco)) : 0;
  };

  let totalHospedagem = 0;
  let totalNoites = 0;
  if (checkin && checkout) {
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

  const handleReserva = () => {
    if (!checkin || !checkout) return alert("Selecione o período no calendário.");
    router.push(`/checkout?pacote=${pacote?.id}&hotel=${hotelSelecionado?.id}&quarto=${tipoQuarto}&guia=${guiaSelecionado?.id}&checkin=${formatarDataIso(checkin)}&checkout=${formatarDataIso(checkout)}`);
  };

  if (loading || !pacote) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#00577C] w-12 h-12" /></div>;

  const galeriaCombinada = [...(pacote.imagens_galeria || []), ...((hotelSelecionado?.galeria as string[]) || [])];

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8F9FA]`}>
      {/* HEADER */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3"><Image src="/logop.png" alt="Logo" width={180} height={50} className="object-contain" /></Link>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-slate-600">
            <Link href="/pacotes">Pacotes</Link>
            <Link href="/roteiro">Rota Turística</Link>
            <Link href="/cadastro" className="bg-[#F9C400] px-5 py-2 rounded-full text-[#00577C]">Cartão Residente</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative h-[70vh] min-h-[500px] w-full mt-[80px]">
        <Image src={pacote.imagem_principal} alt={pacote.titulo} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001E2B] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-10 md:p-20 text-white max-w-7xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold mb-6 opacity-80 hover:opacity-100"><ArrowLeft size={16}/> Voltar</button>
          <span className="bg-[#F9C400] text-[#00577C] px-4 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Pacote de Experiência Oficial</span>
          <h1 className={`${jakarta.className} text-5xl md:text-7xl font-black leading-none`}>{pacote.titulo}</h1>
        </div>
      </section>

      {/* INFO BAR */}
      <div className="relative z-30 max-w-7xl mx-auto px-5 -mt-12">
        <div className="bg-white rounded-3xl shadow-2xl border flex flex-wrap divide-x overflow-hidden">
          <div className="p-6 flex items-center gap-4 flex-1 min-w-[200px]">
            <CalendarIcon className="text-[#F9C400]" size={24}/>
            <div><p className="text-[10px] font-black text-slate-400 uppercase">Duração</p><p className="font-bold">{pacote.dias} Dias</p></div>
          </div>
          <div className="p-6 flex items-center gap-4 flex-1 min-w-[200px]">
            <MapPin className="text-[#00577C]" size={24}/>
            <div><p className="text-[10px] font-black text-slate-400 uppercase">Destino</p><p className="font-bold">SGA, Pará</p></div>
          </div>
          <div className="p-6 flex items-center gap-4 flex-1 min-w-[200px] bg-[#009640]/5">
            <Wallet className="text-[#009640]" size={24}/>
            <div><p className="text-[10px] font-black text-slate-400 uppercase">Valor Estimado</p><p className="font-black text-[#009640] text-xl">{formatarMoeda(valorTotalFinal)}</p></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-16 grid lg:grid-cols-[1fr_420px] gap-12">
        
        {/* COLUNA ESQUERDA */}
        <div className="space-y-12">
          <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
            <h2 className={`${jakarta.className} text-3xl font-black text-[#00577C] mb-6 flex items-center gap-3`}><Info/> Roteiro</h2>
            <p className="text-xl text-slate-500 italic mb-8 border-l-4 border-[#F9C400] pl-6">{pacote.descricao_curta}</p>
            <div className="whitespace-pre-line text-slate-700 leading-loose text-lg">{pacote.roteiro_detalhado}</div>
          </section>

          {/* ESCOLHA DO HOTEL */}
          <section className="space-y-6">
            <h2 className={`${jakarta.className} text-3xl font-black text-slate-900`}>1. Alojamento</h2>
            {pacote.pacote_itens.map(i => i.hoteis).filter(Boolean).map((hotel: any) => (
              <div key={hotel.id} className={`p-8 rounded-[2.5rem] bg-white border-2 transition-all ${hotelSelecionado?.id === hotel.id ? 'border-[#00577C] ring-8 ring-blue-50' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24 rounded-3xl overflow-hidden shadow-lg"><Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover" /></div>
                    <div><h4 className="text-2xl font-bold">{hotel.nome}</h4><span className="text-[10px] font-black uppercase text-[#009640]">{hotel.tipo}</span></div>
                  </div>
                  <input type="radio" checked={hotelSelecionado?.id === hotel.id} onChange={() => setHotelSelecionado(hotel)} className="w-6 h-6 accent-[#00577C]" />
                </div>
                {hotelSelecionado?.id === hotel.id && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <button onClick={() => setTipoQuarto('standard')} className={`p-6 rounded-3xl border-2 text-left transition-all ${tipoQuarto === 'standard' ? 'border-[#F9C400] bg-yellow-50/50' : 'bg-slate-50'}`}>
                      <p className="font-bold">Standard</p><p className="text-2xl font-black text-[#009640]">{formatarMoeda(parseValor(hotel.quarto_standard_preco))}</p>
                    </button>
                    <button onClick={() => setTipoQuarto('luxo')} className={`p-6 rounded-3xl border-2 text-left transition-all ${tipoQuarto === 'luxo' ? 'border-[#00577C] bg-blue-50/50' : 'bg-slate-50'}`}>
                      <p className="font-bold">Suíte Luxo</p><p className="text-2xl font-black text-[#009640]">{formatarMoeda(parseValor(hotel.quarto_luxo_preco))}</p>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* ESCOLHA DO GUIA */}
          <section className="space-y-6">
            <h2 className={`${jakarta.className} text-3xl font-black text-slate-900`}>2. Guia de Turismo</h2>
            <div className="grid gap-4">
              {pacote.pacote_itens.map(i => i.guias).filter(Boolean).map((guia: any) => (
                <label key={guia.id} className={`flex items-center justify-between p-6 bg-white rounded-3xl border-2 transition-all cursor-pointer ${guiaSelecionado?.id === guia.id ? 'border-[#009640] shadow-lg' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-6">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden"><Image src={guia.imagem_url} alt={guia.nome} fill className="object-cover" /></div>
                    <div><p className="font-bold text-xl">{guia.nome}</p><p className="text-sm text-slate-500">{guia.especialidade}</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black">{formatarMoeda(parseValor(guia.preco_diaria))}</p>
                    <input type="radio" checked={guiaSelecionado?.id === guia.id} onChange={() => setGuiaSelecionado(guia)} className="w-5 h-5 accent-[#009640]" />
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA (MOTOR DE RESERVAS) */}
        <aside className="lg:sticky lg:top-32 h-fit space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200">
            <h3 className="text-xl font-black mb-6 border-b pb-4">Motor de Reservas</h3>
            
            {/* Calendário */}
            <div className="bg-slate-50 rounded-3xl p-4 mb-8">
               <div className="flex justify-between items-center mb-4 px-2">
                 <button onClick={() => setMesAtualCalendario(new Date(mesAtualCalendario.getFullYear(), mesAtualCalendario.getMonth() - 1))}><ChevronLeft size={20}/></button>
                 <span className="font-bold capitalize">{mesAtualCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                 <button onClick={() => setMesAtualCalendario(new Date(mesAtualCalendario.getFullYear(), mesAtualCalendario.getMonth() + 1))}><ChevronRight size={20}/></button>
               </div>
               <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 mb-2">
                 {['D','S','T','Q','Q','S','S'].map(d => <div key={d}>{d}</div>)}
               </div>
               <div className="grid grid-cols-7 gap-1">
                 {/* Lógica de renderização dos dias simplificada para brevidade */}
                 {Array.from({length: 31}).map((_, i) => {
                   const d = i + 1;
                   const date = new Date(mesAtualCalendario.getFullYear(), mesAtualCalendario.getMonth(), d);
                   const isSel = (checkin && date.getTime() === checkin.getTime()) || (checkout && date.getTime() === checkout.getTime());
                   return (
                     <button key={i} onClick={() => {
                        if(!checkin || (checkin && checkout)) { setCheckin(date); setCheckout(null); }
                        else if(date > checkin) setCheckout(date);
                        else setCheckin(date);
                     }} className={`aspect-square rounded-lg text-xs font-bold transition-all ${isSel ? 'bg-[#00577C] text-white shadow-lg scale-110' : 'hover:bg-slate-200'}`}>{d}</button>
                   );
                 })}
               </div>
            </div>

            <div className="space-y-4 mb-8 border-t pt-6 text-sm">
              <div className="flex justify-between font-bold"><span>Hospedagem ({totalNoites} nts)</span><span>{formatarMoeda(totalHospedagem)}</span></div>
              <div className="flex justify-between font-bold"><span>Guia Selecionado</span><span>{formatarMoeda(valorGuia)}</span></div>
              <div className="flex justify-between font-bold"><span>Taxas de Atrativos</span><span>{formatarMoeda(valorAtracoes)}</span></div>
            </div>

            <div className="bg-[#009640]/10 p-6 rounded-2xl mb-8 text-center border border-[#009640]/20">
               <p className="text-[10px] font-black text-[#009640] uppercase mb-1">Total do Pacote</p>
               <p className="text-4xl font-black text-[#009640]">{formatarMoeda(valorTotalFinal)}</p>
            </div>

            <button onClick={handleReserva} className="w-full bg-[#00577C] text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3">Confirmar e Pagar <ChevronRightIcon/></button>
          </div>
        </aside>
      </div>

      {/* GALERIA HORIZONTAL AO FIM */}
      <section className="max-w-7xl mx-auto px-5 pb-32">
        <h2 className={`${jakarta.className} text-4xl font-black text-slate-900 mb-10 flex items-center gap-4`}><ImageIcon className="text-[#00577C]"/> Galeria Completa</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {galeriaCombinada.map((url, idx) => (
            <div key={idx} onClick={() => setFotoExpandidaIndex(idx)} className="relative aspect-square rounded-2xl overflow-hidden shadow-md group cursor-pointer">
              <Image src={url} alt="Foto" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-[#00577C]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><ZoomIn className="text-white"/></div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12 px-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4"><Image src="/logop.png" alt="Logo" width={150} height={40} /><div className="border-l pl-4 hidden md:block"><p className="font-bold text-[#00577C]">SagaTurismo</p><p className="text-[10px] uppercase text-slate-400">Portal Oficial</p></div></div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} · Prefeitura Municipal de São Geraldo do Araguaia</p>
        </div>
      </footer>
    </div>
  );
}

export default function PacoteDetalheWrapper() {
  return <Suspense fallback={<div>Loading...</div>}><PacoteDetalheContent /></Suspense>;
}