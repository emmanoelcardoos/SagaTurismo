'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, MapPin, Star, CheckCircle2, Info, 
  Loader2, Menu, X, ChevronLeft, ChevronRight, ZoomIn, 
  Calendar, Bed, ChevronRight as ChevronRightIcon
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

type Hotel = {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  estrelas: number;
  imagem_url: string;
  endereco?: string;
  preco_medio?: string;
  quarto_standard_nome?: string;
  quarto_standard_preco?: any;
  quarto_luxo_nome?: string;
  quarto_luxo_preco?: any;
  comodidades?: string[];
  galeria?: string[];
};

export default function HotelDetalhePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ── ESTADOS DO MOTOR DE RESERVAS ──
  const [checkin, setCheckin] = useState<string>('');
  const [checkout, setCheckout] = useState<string>('');
  const [tipoQuarto, setTipoQuarto] = useState<'standard' | 'luxo'>('standard');
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchHotel() {
      try {
        const { data, error } = await supabase.from('hoteis').select('*').eq('id', params.id).single();
        if (error) throw new Error("Erro ao buscar a hospedagem.");
        if (data) setHotel(data);
        else setErro("Hospedagem não encontrada.");
      } catch (err: any) {
        setErro(err.message || "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchHotel();
  }, [params.id]);

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

  // ── FUNÇÕES DO CALENDÁRIO E CÁLCULO DE NOITES ──
  const calcularNoites = (inDate: string, outDate: string) => {
    if (!inDate || !outDate) return 0;
    const start = new Date(inDate);
    const end = new Date(outDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const noites = calcularNoites(checkin, checkout);
  const precoDiaria = hotel ? (tipoQuarto === 'luxo' ? parseValor(hotel.quarto_luxo_preco) : parseValor(hotel.quarto_standard_preco)) : 0;
  const valorTotalReserva = noites > 0 ? noites * precoDiaria : precoDiaria;

  const handleReserva = () => {
    if (!checkin || !checkout) {
      alert("Por favor, selecione as datas de Check-in e Check-out para prosseguir.");
      return;
    }
    // Redireciona para o checkout com os parâmetros
    router.push(`/checkout?tipo=hotel&hotel=${hotel?.id}&quarto=${tipoQuarto}&checkin=${checkin}&checkout=${checkout}`);
  };

  // ── FUNÇÕES DA GALERIA ──
  const fecharGaleria = () => setFotoExpandidaIndex(null);
  const proximaFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hotel?.galeria) setFotoExpandidaIndex((prev) => (prev! + 1) % hotel.galeria!.length);
  };
  const fotoAnterior = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hotel?.galeria) setFotoExpandidaIndex((prev) => (prev! - 1 + hotel.galeria!.length) % hotel.galeria!.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold uppercase tracking-widest">A carregar detalhes...</p>
      </div>
    );
  }

  if (erro || !hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-6 text-center">
        <h1 className="text-3xl font-black mb-4">Informação não disponível</h1>
        <p className="text-slate-500 mb-8 max-w-md">{erro || "Não foi possível carregar os detalhes."}</p>
        <Link href="/#hoteis" className="bg-[#00577C] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm shadow-lg">Voltar aos Hotéis</Link>
      </div>
    );
  }

  const mapSearchQuery = encodeURIComponent(`${hotel.nome} ${hotel.endereco || 'São Geraldo do Araguaia, Pará'}`);
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${mapSearchQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col`}>
      
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

      {/* HERO SECTION */}
      <div className="w-full h-[40vh] md:h-[60vh] relative bg-slate-200 mt-[70px] md:mt-[90px]">
        <Link href="/#hoteis" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 px-4 py-2 rounded-full shadow-lg transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 py-12 flex flex-col lg:flex-row items-start gap-12 relative z-10 -mt-20">
        
        {/* COLUNA ESQUERDA: INFORMAÇÕES */}
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
                  {hotel.comodidades.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-slate-700 font-medium bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                      <CheckCircle2 size={20} className="text-[#009640] shrink-0" /> {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* COLUNA DIREITA: MOTOR DE RESERVAS */}
        <div className="w-full lg:w-[420px] shrink-0 lg:self-start">
          <aside className="lg:sticky lg:top-32 space-y-6">
            
            {/* WIDGET DE RESERVA */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 pb-6 mb-6">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-1">A partir de</p>
                 <div className="flex items-end gap-2">
                   <p className={`${jakarta.className} text-4xl font-black text-slate-900`}>{formatarMoeda(parseValor(hotel.quarto_standard_preco || hotel.preco_medio))}</p>
                   <p className="text-sm font-bold text-slate-400 mb-1.5">/ noite</p>
                 </div>
              </div>

              {/* Datas de Check-in e Check-out */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 relative group focus-within:ring-2 focus-within:ring-[#00577C]">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Check-in</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[#00577C]" />
                    <input 
                      type="date" min={hoje} value={checkin} onChange={(e) => setCheckin(e.target.value)}
                      className="bg-transparent outline-none text-sm font-bold text-slate-800 w-full cursor-pointer" 
                    />
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 relative group focus-within:ring-2 focus-within:ring-[#00577C]">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Check-out</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[#00577C]" />
                    <input 
                      type="date" min={checkin || hoje} value={checkout} onChange={(e) => setCheckout(e.target.value)}
                      className="bg-transparent outline-none text-sm font-bold text-slate-800 w-full cursor-pointer" 
                    />
                  </div>
                </div>
              </div>

              {/* Seleção de Quarto */}
              <div className="space-y-3 mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C]">Escolha sua Acomodação</p>
                
                {/* Standard */}
                <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${tipoQuarto === 'standard' ? 'border-[#00577C] bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="quarto" className="w-5 h-5 accent-[#00577C]" checked={tipoQuarto === 'standard'} onChange={() => setTipoQuarto('standard')} />
                    <div>
                      <p className="font-bold text-sm text-slate-800">{hotel.quarto_standard_nome || 'Quarto Standard'}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Básico e confortável</p>
                    </div>
                  </div>
                  <p className="font-black text-slate-900">{formatarMoeda(parseValor(hotel.quarto_standard_preco))}</p>
                </label>

                {/* Luxo */}
                <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${tipoQuarto === 'luxo' ? 'border-[#F9C400] bg-yellow-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="quarto" className="w-5 h-5 accent-[#F9C400]" checked={tipoQuarto === 'luxo'} onChange={() => setTipoQuarto('luxo')} />
                    <div>
                      <p className="font-bold text-sm text-slate-800">{hotel.quarto_luxo_nome || 'Suíte Luxo'}</p>
                      <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1"><Star size={10} className="fill-[#F9C400] text-[#F9C400]"/> Recomendado</p>
                    </div>
                  </div>
                  <p className="font-black text-slate-900">{formatarMoeda(parseValor(hotel.quarto_luxo_preco))}</p>
                </label>
              </div>

              {/* Total e Botão */}
              {noites > 0 && (
                 <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl mb-6">
                    <span className="text-xs font-bold text-slate-500 uppercase">Total ({noites} {noites === 1 ? 'noite' : 'noites'})</span>
                    <span className="text-xl font-black text-[#009640]">{formatarMoeda(valorTotalReserva)}</span>
                 </div>
              )}

              <button 
                onClick={handleReserva}
                className={`${jakarta.className} flex items-center justify-center gap-3 w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-5 rounded-2xl font-black text-lg transition-transform hover:-translate-y-1 shadow-xl`}
              >
                Reservar Agora <ChevronRightIcon size={20} />
              </button>
              <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">Reserva Oficial SGA</p>
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

      {/* GALERIA */}
      {hotel.galeria && hotel.galeria.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-5 pb-20 relative z-10">
          <section className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-100">
            <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-10`}>Fotos do Local</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {hotel.galeria.map((foto, idx) => (
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

      {/* LIGHTBOX GALERIA */}
      {fotoExpandidaIndex !== null && hotel?.galeria && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-5 animate-in fade-in" onClick={fecharGaleria}>
          <button onClick={fecharGaleria} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full z-[110]"><X size={24} /></button>
          <button onClick={fotoAnterior} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full z-[110]"><ChevronLeft size={32} /></button>
          <div className="relative w-full max-w-6xl aspect-video rounded-xl overflow-hidden shadow-2xl">
            <Image src={hotel.galeria[fotoExpandidaIndex]} alt="Foto" fill className="object-contain" />
          </div>
          <button onClick={proximaFoto} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full z-[110]"><ChevronRight size={32} /></button>
          <p className="absolute bottom-10 text-white font-bold tracking-widest text-sm bg-black/60 px-5 py-2 rounded-full">{fotoExpandidaIndex + 1} de {hotel.galeria.length}</p>
        </div>
      )}
    </div>
  );
}