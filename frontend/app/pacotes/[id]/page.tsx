'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, MapPin, Calendar, Clock,
  CheckCircle2, Bed, Compass, Ticket, ShieldCheck,
  ChevronRight, Camera, Info, QrCode, Wallet, X, Star,
  Award, Wifi, Wind, Tv, Waves, ImageIcon, Smartphone,
  Map, UserCheck, ShieldAlert, Menu
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS COMPLETAS E RÍGIDAS ──
type Hotel = {
  id: string;
  nome: string;
  tipo: string;
  imagem_url: string;
  descricao: string;
  quarto_standard_nome: string;
  quarto_standard_preco: any;
  quarto_standard_comodidades: string[];
  quarto_luxo_nome: string;
  quarto_luxo_preco: any;
  quarto_luxo_comodidades: string[];
  galeria: string[] | string;
};
type Guia = {
  id: string;
  nome: string;
  preco_diaria: any;
  especialidade: string;
  imagem_url: string;
  descricao: string;
};
type Atracao = {
  id: string;
  nome: string;
  preco_entrada: any;
  tipo: string;
  imagem_url: string;
  descricao: string;
};
type Pacote = {
  id: string;
  titulo: string;
  descricao_curta: string;
  roteiro_detalhado: string;
  imagens_galeria: string[];
  imagem_principal: string;
  dias: number;
  noites: number;
  horarios_info: string;
  pacote_itens: { hoteis: Hotel | null; guias: Guia | null; atracoes: Atracao | null; }[];
};

// ── SEGURANÇA E MATEMÁTICA FINANCEIRA ──
const parseValor = (valor: any): number => {
  if (valor === null || valor === undefined || valor === '') return 0;
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  return isNaN(num) ? 0 : num;
};
const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

export default function DetalhePacotePage() {
  const { id } = useParams();
  const router = useRouter();

  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoteisDisponiveis, setHoteisDisponiveis] = useState<Hotel[]>([]);
  const [guiasDisponiveis, setGuiasDisponiveis] = useState<Guia[]>([]);
  const [atracoesInclusas, setAtracoesInclusas] = useState<Atracao[]>([]);
  const [hotelSelecionado, setHotelSelecionado] = useState<Hotel | null>(null);
  const [tipoQuarto, setTipoQuarto] = useState<'standard' | 'luxo'>('standard');
  const [guiaSelecionado, setGuiaSelecionado] = useState<Guia | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoPix, setProcessandoPix] = useState(false);
  const [pixGerado, setPixGerado] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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
    async function fetchPacoteCompleto() {
      const { data, error } = await supabase
        .from('pacotes')
        .select(`*, pacote_itens ( hoteis (*), guias (*), atracoes (*) )`)
        .eq('id', id)
        .single();
      if (error) {
        console.error('Erro ao carregar pacote oficial:', error);
        router.push('/pacotes');
        return;
      }
      const pct = data as Pacote;
      setPacote(pct);
      const hoteis = pct.pacote_itens.map((i) => i.hoteis).filter(Boolean) as Hotel[];
      const guias = pct.pacote_itens.map((i) => i.guias).filter(Boolean) as Guia[];
      const atracoes = pct.pacote_itens.map((i) => i.atracoes).filter(Boolean) as Atracao[];
      setHoteisDisponiveis(hoteis);
      setGuiasDisponiveis(guias);
      setAtracoesInclusas(atracoes);
      if (hoteis.length > 0) setHotelSelecionado(hoteis[0]);
      if (guias.length > 0) setGuiaSelecionado(guias[0]);
      setLoading(false);
    }
    if (id) fetchPacoteCompleto();
  }, [id, router]);

  const precoHospedagem = hotelSelecionado
    ? tipoQuarto === 'standard'
      ? parseValor(hotelSelecionado.quarto_standard_preco)
      : parseValor(hotelSelecionado.quarto_luxo_preco)
    : 0;
  const totalGuias = guiaSelecionado ? parseValor(guiaSelecionado.preco_diaria) : 0;
  const totalAtracoes = atracoesInclusas.reduce((acc, curr) => acc + parseValor(curr.preco_entrada), 0);
  const valorTotalFinal = precoHospedagem + totalGuias + totalAtracoes;

  const getGaleriaHotel = (hotel: Hotel | null) => {
    if (!hotel || !hotel.galeria) return [];
    if (Array.isArray(hotel.galeria)) return hotel.galeria;
    try { return JSON.parse(hotel.galeria); } catch { return []; }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F0]">
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-5" />
      <p className={`${jakarta.className} font-bold text-slate-400 uppercase tracking-[0.3em] text-sm`}>
        Carregando Pacote…
      </p>
    </div>
  );
  if (!pacote) return null;

  const imagensRoteiro = [pacote.imagem_principal, ...(pacote.imagens_galeria || [])];

  return (
    <main className={`${inter.className} bg-[#F5F5F0] min-h-screen`}>

      {/* ════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════ */}
      <header
        className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56">
              <Image
                src="/logop.png"
                alt="Prefeitura de São Geraldo do Araguaia"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>
                SagaTurismo
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Secretaria de Turismo de São Geraldo do Araguaia
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/aldeias" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Aldeias</Link>
            <a href="#historia" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">História</a>
            <a href="https://saogeraldodoaraguaia.pa.gov.br" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Governo</a>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão Residente</Link>
          </nav>
          <button className="rounded-xl border border-slate-200 p-2 md:hidden">
            <Menu className="h-5 w-5 text-[#00577C]" />
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden" style={{ height: 'min(88vh, 820px)', minHeight: '520px' }}>

        <div className="absolute inset-0 z-0">
          <Image
            src={pacote.imagem_principal}
            alt={pacote.titulo}
            fill
            priority
            className="object-cover"
          />
        </div>

        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#001e2b] via-[#00577C]/40 to-transparent" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#001e2b]/60 to-transparent" />

        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            opacity: 0.035,
            backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
            backgroundSize: '10px 10px',
          }}
        />

        <div className="absolute top-0 left-0 right-0 z-20 pt-28 px-6 lg:px-16">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-base font-bold transition-colors group"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white/15 group-hover:bg-white/25 transition-colors">
              <ArrowLeft size={17} />
            </span>
            Voltar ao Catálogo
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 pb-20 px-6 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="bg-[#F9C400] text-[#00577C] text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full shadow-md">
                Pacote Oficial
              </span>
              <span className="flex items-center gap-1.5 text-white/70 text-sm font-semibold">
                <MapPin size={14} className="text-[#F9C400]" />
                São Geraldo do Araguaia, Pará
              </span>
            </div>

            <h1
              className={`${jakarta.className} font-black text-white leading-[0.9] tracking-tight`}
              style={{ fontSize: 'clamp(2.6rem, 6vw, 5.5rem)' }}
            >
              {pacote.titulo}
            </h1>
          </div>
        </div>
      </section>

      {/* ── INFO BAR ── */}
      <div className="relative z-30 mx-auto max-w-7xl px-6 lg:px-16 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-wrap divide-y sm:divide-y-0 sm:divide-x divide-slate-100 overflow-hidden">
          {/* Duration */}
          <div className="flex items-center gap-4 px-7 py-5 flex-1 min-w-[180px]">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#F9C400]/15 shrink-0">
              <Calendar size={19} className="text-[#b38d00]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duração</p>
              <p className="text-base font-bold text-slate-800">{pacote.dias} Dias / {pacote.noites} Noites</p>
            </div>
          </div>

          {/* Saídas */}
          <div className="flex items-center gap-4 px-7 py-5 flex-1 min-w-[180px]">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#009640]/10 shrink-0">
              <Clock size={19} className="text-[#009640]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saídas</p>
              <p className="text-base font-bold text-slate-800">{pacote.horarios_info || 'Consultar SEMTUR'}</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-4 px-7 py-5 flex-1 min-w-[180px]">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#00577C]/10 shrink-0">
              <MapPin size={19} className="text-[#00577C]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destino</p>
              <p className="text-base font-bold text-slate-800">São Geraldo do Araguaia</p>
            </div>
          </div>

          {/* Price preview */}
          <div className="flex items-center gap-4 px-7 py-5 flex-1 min-w-[200px] bg-[#00577C]/[0.03]">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#009640]/10 shrink-0">
              <Wallet size={19} className="text-[#009640]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A partir de</p>
              <p className={`${jakarta.className} text-xl font-black text-[#009640] leading-none tabular-nums`}>
                {formatarMoeda(valorTotalFinal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          MAIN CONTENT — two-column layout
      ════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-7xl px-6 lg:px-16 mt-16 pb-40">
        <div className="grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-12 lg:gap-16 items-start">

          {/* ─── LEFT COLUMN ─── */}
          <div className="space-y-14">

            {/* ── DESCRIPTION BLOCK ── */}
            <section className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">

              <div className="flex items-center gap-4 px-8 py-6 border-b border-slate-100">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#00577C]/10">
                  <Map size={18} className="text-[#00577C]" />
                </div>
                <h2 className={`${jakarta.className} text-xl font-bold text-slate-900`}>Sobre a Expedição</h2>
              </div>

              <div className="p-8">
                <p className="text-xl text-slate-600 leading-relaxed italic border-l-4 border-[#F9C400] pl-5 mb-8 font-medium">
                  {pacote.descricao_curta}
                </p>

                <div className="whitespace-pre-line text-slate-700 text-base leading-loose">
                  {pacote.roteiro_detalhado}
                </div>
              </div>
            </section>

            {/* ── WHAT'S INCLUDED ── */}
            <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-8 py-6 border-b border-slate-100">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#009640]/10">
                  <CheckCircle2 size={18} className="text-[#009640]" />
                </div>
                <h2 className={`${jakarta.className} text-xl font-bold text-slate-900`}>O que está incluído</h2>
              </div>

              <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                {/* Hotel column */}
                <div className="p-7">
                  <div className="flex items-center gap-2 mb-5">
                    <Bed size={16} className="text-[#00577C]" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Hospedagem</p>
                  </div>
                  <div className="space-y-3">
                    {hoteisDisponiveis.map((h) => (
                      <p key={h.id} className="text-base font-semibold text-slate-700 flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00577C] mt-2 shrink-0" />
                        {h.nome}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Guide column */}
                <div className="p-7">
                  <div className="flex items-center gap-2 mb-5">
                    <UserCheck size={16} className="text-[#009640]" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Guias</p>
                  </div>
                  <div className="space-y-3">
                    {guiasDisponiveis.map((g) => (
                      <p key={g.id} className="text-base font-semibold text-slate-700 flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#009640] mt-2 shrink-0" />
                        {g.nome}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Attractions column */}
                <div className="p-7">
                  <div className="flex items-center gap-2 mb-5">
                    <Ticket size={16} className="text-[#b38d00]" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Atrações</p>
                  </div>
                  <div className="space-y-3">
                    {atracoesInclusas.map((a) => (
                      <p key={a.id} className="text-base font-semibold text-slate-700 flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#F9C400] mt-2 shrink-0" />
                        {a.nome}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── HOTEL SELECTION ── */}
            <section>
              <div className="flex items-center gap-4 mb-7">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#00577C] text-white shrink-0">
                  <Bed size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acomodação</p>
                  <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 leading-none`}>O Hotel</h2>
                </div>
              </div>

              <div className="space-y-5">
                {hoteisDisponiveis.map((hotel) => {
                  const selected = hotelSelecionado?.id === hotel.id;
                  return (
                    <div
                      key={hotel.id}
                      className={`bg-white rounded-3xl border-2 overflow-hidden transition-all duration-300 ${
                        selected
                          ? 'border-[#00577C] shadow-lg shadow-[#00577C]/10'
                          : 'border-slate-100 shadow-sm hover:border-slate-200'
                      }`}
                    >
                      {/* Hotel header row */}
                      <button
                        className="w-full flex items-center gap-6 p-7 text-left"
                        onClick={() => setHotelSelecionado(hotel)}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border-2 border-white shadow">
                          <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold text-slate-900 mb-2">{hotel.nome}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#009640] bg-green-50 border border-green-100 px-2.5 py-1 rounded-md">
                              {hotel.tipo}
                            </span>
                            <span className="flex text-[#F9C400] gap-px">
                              {[...Array(4)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                            </span>
                          </div>
                        </div>

                        {/* Radio indicator */}
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            selected ? 'border-[#00577C] bg-[#00577C]' : 'border-slate-300'
                          }`}
                        >
                          {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                        </div>
                      </button>

                      {/* Room picker — only when selected */}
                      {selected && (
                        <div className="px-7 pb-7 grid sm:grid-cols-2 gap-5 border-t border-slate-50 pt-6">
                          {/* Standard */}
                          <button
                            onClick={() => setTipoQuarto('standard')}
                            className={`relative text-left p-6 rounded-2xl border-2 transition-all ${
                              tipoQuarto === 'standard'
                                ? 'border-[#F9C400] bg-yellow-50/50'
                                : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <p className="font-bold text-slate-800 text-base">{hotel.quarto_standard_nome}</p>
                              {tipoQuarto === 'standard' && <CheckCircle2 size={18} className="text-[#F9C400] shrink-0" />}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-5">
                              {hotel.quarto_standard_comodidades?.map((c, i) => (
                                <span key={i} className="text-[9px] font-black bg-white border border-slate-100 px-2 py-1 rounded text-slate-500 uppercase tracking-tight">
                                  {c}
                                </span>
                              ))}
                            </div>
                            <p className={`${jakarta.className} text-2xl font-black text-[#009640]`}>
                              {formatarMoeda(parseValor(hotel.quarto_standard_preco))}
                            </p>
                          </button>

                          {/* Luxo */}
                          <button
                            onClick={() => setTipoQuarto('luxo')}
                            className={`relative text-left p-6 rounded-2xl border-2 transition-all ${
                              tipoQuarto === 'luxo'
                                ? 'border-[#00577C] bg-blue-50/40'
                                : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                            }`}
                          >
                            {/* Recommended badge */}
                            <div className="absolute -top-3 right-4 bg-[#00577C] text-white text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow">
                              <Award size={10} /> RECOMENDADO
                            </div>
                            <div className="flex items-start justify-between mb-4">
                              <p className="font-bold text-slate-800 text-base">{hotel.quarto_luxo_nome}</p>
                              {tipoQuarto === 'luxo' && <CheckCircle2 size={18} className="text-[#00577C] shrink-0" />}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-5">
                              {hotel.quarto_luxo_comodidades?.map((c, i) => (
                                <span key={i} className="text-[9px] font-black bg-[#00577C] text-white px-2 py-1 rounded uppercase tracking-tight">
                                  {c}
                                </span>
                              ))}
                            </div>
                            <p className={`${jakarta.className} text-2xl font-black text-[#009640]`}>
                              {formatarMoeda(parseValor(hotel.quarto_luxo_preco))}
                            </p>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── GUIDE SELECTION ── */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-[#009640] text-white shrink-0">
                  <UserCheck size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Guia Turistico</p>
                  <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 leading-none`}>O Guia</h2>
                </div>
              </div>

              <div className="space-y-4">
                {guiasDisponiveis.map((guia) => {
                  const selected = guiaSelecionado?.id === guia.id;
                  return (
                    <label
                      key={guia.id}
                      className={`flex items-center gap-5 bg-white p-5 rounded-3xl border-2 cursor-pointer transition-all ${
                        selected
                          ? 'border-[#009640] shadow-lg shadow-green-100'
                          : 'border-slate-100 shadow-sm hover:border-slate-200'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border-2 border-white shadow">
                        <Image src={guia.imagem_url || '/placeholder.png'} alt={guia.nome} fill className="object-cover" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 mb-0.5">{guia.nome}</h4>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#009640]" />
                          {guia.especialidade}
                        </div>
                      </div>

                      {/* Price + radio */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">p/ dia</p>
                          <p className={`${jakarta.className} text-base font-black text-slate-800 tabular-nums`}>
                            {formatarMoeda(parseValor(guia.preco_diaria))}
                          </p>
                        </div>
                        <input
                          type="radio"
                          name="guia"
                          className="w-5 h-5 accent-[#009640]"
                          checked={selected}
                          onChange={() => setGuiaSelecionado(guia)}
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* ── EXPEDITION GALLERY ── */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[9px] font-black text-[#00577C] uppercase tracking-[0.3em] mb-1">Galeria</p>
                  <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900`}>Fotos da Expedição</h2>
                </div>
                <ImageIcon size={32} className="text-slate-200" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {imagensRoteiro.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 group shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
                  >
                    <Image src={url} alt={`Expedição ${i + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={22} className="text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── HOTEL GALLERY ── */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[9px] font-black text-[#009640] uppercase tracking-[0.3em] mb-1">Hospedagem</p>
                  <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900`}>
                    {hotelSelecionado?.nome || 'Hotel'}
                  </h2>
                </div>
                <Bed size={32} className="text-slate-200" />
              </div>

              {getGaleriaHotel(hotelSelecionado).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {getGaleriaHotel(hotelSelecionado).map((url: string, i: number) => (
                    <div
                      key={i}
                      className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 group shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                      <Image src={url} alt={`Hotel ${i + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-16 text-center flex flex-col items-center">
                  <ImageIcon size={32} className="text-slate-200 mb-3" />
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Galeria em Processamento</p>
                </div>
              )}
            </section>

          </div>

          {/* ─── RIGHT COLUMN — STICKY BOOKING CARD ─── */}
          <aside className="lg:sticky lg:top-32 self-start">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">

              {/* Colored top bar */}
              <div className="h-1.5 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />

              <div className="p-7">

                {/* Price headline */}
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total da Expedição</p>
                  <p className={`${jakarta.className} text-4xl font-black text-[#009640] tabular-nums leading-none`}>
                    {formatarMoeda(valorTotalFinal)}
                  </p>
                </div>

                {/* Breakdown */}
                <div className="space-y-4 mb-6">

                  {/* Accommodation row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#00577C]/10 shrink-0">
                        <Bed size={13} className="text-[#00577C]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">Hospedagem</p>
                        <p className="text-[9px] font-bold text-slate-400 truncate">{hotelSelecionado?.nome}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-slate-800 shrink-0 tabular-nums">
                      {formatarMoeda(precoHospedagem)}
                    </span>
                  </div>

                  {/* Guide row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#009640]/10 shrink-0">
                        <Compass size={13} className="text-[#009640]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">Guia Local</p>
                        <p className="text-[9px] font-bold text-slate-400 truncate">{guiaSelecionado?.nome}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-slate-800 shrink-0 tabular-nums">
                      {formatarMoeda(totalGuias)}
                    </span>
                  </div>

                  {/* Attractions row */}
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#F9C400]/15 shrink-0">
                        <Ticket size={13} className="text-[#a37c00]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700">Atrações & Taxas</p>
                        <p className="text-[9px] font-bold text-slate-400">{atracoesInclusas.length} itens</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-slate-800 shrink-0 tabular-nums">
                      {formatarMoeda(totalAtracoes)}
                    </span>
                  </div>

                  {/* Total row */}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-900">Total</p>
                    <p className={`${jakarta.className} text-xl font-black text-[#009640] tabular-nums`}>
                      {formatarMoeda(valorTotalFinal)}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => {
                    const urlCheckout = `/checkout?pacote=${pacote.id}&hotel=${hotelSelecionado?.id || ''}&quarto=${tipoQuarto}&guia=${guiaSelecionado?.id || ''}`;
                    router.push(urlCheckout);
                  }}
                  className="w-full bg-[#00577C] hover:bg-[#004a6b] active:scale-[0.98] text-white py-5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#00577C]/20 group"
                >
                  Reservar Agora
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* Trust signal */}
                <p className="mt-4 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.25em] flex items-center justify-center gap-1.5">
                  <ShieldCheck size={12} />
                  Pagamento Seguro · SEMTUR Oficial
                </p>
              </div>
            </div>

            {/* Quick-trust chips below card */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { icon: <ShieldCheck size={13} />, text: 'Reserva Garantida' },
                { icon: <CheckCircle2 size={13} />, text: 'Guias Certificados' },
                { icon: <Award size={13} />, text: 'Turismo Sustentável' },
                { icon: <MapPin size={13} />, text: 'Destino Oficial' },
              ].map((c) => (
                <div
                  key={c.text}
                  className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-2 shadow-sm"
                >
                  <span className="text-[#00577C] shrink-0">{c.icon}</span>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wide leading-tight">{c.text}</p>
                </div>
              ))}
            </div>
          </aside>

        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          CHECKOUT MODAL — PIX payment
      ════════════════════════════════════════════════════ */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">

            {/* Modal header */}
            <div className="bg-[#00577C] p-8 text-white relative">
              <button
                onClick={() => setModalAberto(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={14} className="text-[#F9C400]" />
                <p className="text-[#F9C400] text-[9px] font-black uppercase tracking-[0.4em]">
                  Checkout Seguro · PagBank
                </p>
              </div>
              <h3 className={`${jakarta.className} text-3xl font-bold`}>Finalizar Reserva</h3>
            </div>

            <div className="p-8 text-center">
              {!pixGerado ? (
                <>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                    Você selecionou <b>{pacote.titulo}</b> com hospedagem em <b>{hotelSelecionado?.nome}</b>.
                  </p>

                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-6">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">
                      Valor Final Autorizado
                    </p>
                    <p className={`${jakarta.className} text-5xl font-black text-slate-900 tabular-nums`}>
                      {formatarMoeda(valorTotalFinal)}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setProcessandoPix(true);
                      setTimeout(() => { setProcessandoPix(false); setPixGerado(true); }, 2500);
                    }}
                    className="w-full bg-[#009640] hover:bg-[#007a33] text-white py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg shadow-green-200"
                  >
                    {processandoPix
                      ? <Loader2 className="animate-spin" size={24} />
                      : <><QrCode size={22} /> Gerar Chave PIX</>
                    }
                  </button>

                  <p className="mt-4 text-[9px] text-slate-300 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                    <ShieldAlert size={11} /> Ao clicar, você concorda com os termos da SEMTUR.
                  </p>
                </>
              ) : (
                <div>
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                    <CheckCircle2 size={44} className="text-[#009640]" />
                  </div>
                  <h4 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-2`}>Chave PIX Emitida!</h4>
                  <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                    Escaneie o QR code para confirmar sua vaga imediatamente via PagBank.
                  </p>

                  {/* QR code placeholder */}
                  <div className="w-56 h-56 bg-slate-50 mx-auto rounded-3xl flex items-center justify-center mb-6 border-2 border-dashed border-slate-200 relative group overflow-hidden">
                    <QrCode size={120} className="text-slate-300 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <Smartphone size={36} className="text-[#00577C] mb-1.5 animate-pulse" />
                      <span className="text-[9px] font-black text-[#00577C] uppercase tracking-widest">Escanear</span>
                    </div>
                  </div>

                  <button className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all active:scale-[0.98] shadow-lg">
                    Copiar Código Copia e Cola
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          FOOTER INSTITUCIONAL — exact spec
      ════════════════════════════════════════════════════ */}
      <footer className="py-20 px-8 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <img src="/logop.png" alt="Prefeitura SGA" className="h-20 object-contain" />
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                São Geraldo do Araguaia <br /> "Cidade Amada, seguindo em frente"
              </p>
            </div>
            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">
                Gestão Executiva
              </h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Prefeito: <br /><b>Jefferson Douglas de Jesus Oliveira</b></li>
                <li>Vice-Prefeito: <br /><b>Marcos Antônio Candido de Lucena</b></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">
                Turismo (SEMTUR)
              </h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Secretária: <br /><b>Micheli Stephany de Souza</b></li>
                <li>Contato: <b>(94) 98145-2067</b></li>
                <li>Email: <b>setursaga@gmail.com</b></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">
                Equipe Técnica
              </h5>
              <ul className="text-sm text-slate-500 space-y-2 font-medium">
                <li>• Adriana da Luz Lima</li>
                <li>• Carmelita Luz da Silva</li>
                <li>• Diego Silva Costa</li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-10 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
              © 2026 Secretaria Municipal de Turismo - São Geraldo do Araguaia (PA)
            </p>
          </div>
        </div>
      </footer>

    </main>
  );
}