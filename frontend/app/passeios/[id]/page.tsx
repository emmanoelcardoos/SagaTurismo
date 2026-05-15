'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, MapPin, Calendar as CalendarIcon, Clock,
  CheckCircle2, Compass, ShieldCheck, ChevronRight, X, Star,
  ImageIcon, Map, UserCheck, ChevronLeft, ChevronRight as ChevronRightIcon, ZoomIn, Users
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── IMAGEM DE SEGURANÇA ──
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1740";

// ── UTILITÁRIOS ──
const parseValor = (valor: any): number => {
  if (valor === null || valor === undefined || valor === '') return 0;
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  return isNaN(num) ? 0 : num;
};

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const formatarDataLonga = (dataStr: string) => {
  if (!dataStr) return '';
  const data = new Date(dataStr + 'T00:00:00');
  return data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

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

// ── TIPAGEM DO PASSEIO ──
type Passeio = {
  id: string;
  titulo: string;
  descricao_curta: string;
  descricao_completa: string;
  imagem_principal: string;
  imagens_galeria: string[] | string;
  data_passeio: string;
  horario_saida: string;
  ponto_encontro: string;
  coordenadas_google_maps: string;
  nome_guia: string;
  valor_total: any;
  vagas_disponiveis: number;
  categoria: string;
};

export default function PasseioDetalhePage() {
  const { id } = useParams();
  const router = useRouter();

  // Estados de Dados
  const [passeio, setPasseio] = useState<Passeio | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados da UI
  const [pessoas, setPessoas] = useState(1);
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  // Carregar Dados
  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('passeios')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          router.push('/passeios');
          return;
        }
        setPasseio(data as Passeio);
      } catch (err) {
        console.error("Falha ao carregar passeio:", err);
        router.push('/passeios');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id, router]);

  // Galeria e Matemática
  const galeriaCombinada = passeio ? [
    ...(passeio.imagem_principal ? [passeio.imagem_principal] : []),
    ...getArraySeguro(passeio.imagens_galeria)
  ] : [];

  const fecharGaleria = () => setFotoExpandidaIndex(null);
  const proximaFoto = (e: React.MouseEvent) => { e.stopPropagation(); setFotoExpandidaIndex((prev) => (prev! + 1) % galeriaCombinada.length); };
  const fotoAnterior = (e: React.MouseEvent) => { e.stopPropagation(); setFotoExpandidaIndex((prev) => (prev! - 1 + galeriaCombinada.length) % galeriaCombinada.length); };

  const valorUnitario = passeio ? parseValor(passeio.valor_total) : 0;
  const valorTotalFinal = valorUnitario * pessoas;

  const handleReserva = () => {
    if (pessoas > (passeio?.vagas_disponiveis || 20)) {
      alert("A quantidade selecionada excede as vagas disponíveis.");
      return;
    }
    router.push(`/checkout-passeio?id=${passeio?.id}&pessoas=${pessoas}`);
  };

  if (!mounted || loading || !passeio) return (
    <div className={`${inter.className} min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]`}>
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-xs">Preparando expedição...</p>
    </div>
  );

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col`}>

      {/* ── HEADER ── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56">
              <Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/passeios" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Passeios</Link>
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão Residente</Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="w-full h-[40vh] md:h-[60vh] relative bg-[#002f40] mt-[70px] md:mt-[90px]">
        <Link href="/passeios" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 px-4 py-2 rounded-full shadow-lg transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <Image src={passeio.imagem_principal || FALLBACK_IMAGE} alt={passeio.titulo} fill className="object-cover opacity-80" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* ── GRID PRINCIPAL ── */}
      <div className="mx-auto w-full max-w-7xl px-5 py-12 flex flex-col lg:flex-row items-start gap-12 relative z-10 -mt-20">

        {/* ── COLUNA ESQUERDA ── */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-10">

          {/* Info Principal */}
          <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                {passeio.categoria || 'Aventura'}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                <MapPin size={15} className="text-[#009640]" /> São Geraldo do Araguaia, PA
              </span>
            </div>

            <h1 className={`${jakarta.className} text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-8 text-left`}>
              {passeio.titulo}
            </h1>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 border-t border-b border-slate-100 py-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5"><CalendarIcon size={14} className="text-[#00577C]"/> Data</p>
                <p className="font-bold text-slate-800 capitalize leading-tight">{formatarDataLonga(passeio.data_passeio)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5"><Clock size={14} className="text-[#00577C]"/> Horário</p>
                <p className="font-bold text-slate-800 leading-tight">{passeio.horario_saida || 'A definir'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5"><MapPin size={14} className="text-[#00577C]"/> Ponto de Encontro</p>
                <p className="font-bold text-slate-800 leading-tight">{passeio.ponto_encontro || 'Consultar o guia'}</p>
              </div>
            </div>

            <div className="mb-12 text-left">
              <h3 className={`${jakarta.className} text-2xl font-black text-[#00577C] mb-6`}>Sobre a Experiência</h3>
              <p className="text-lg text-slate-500 italic font-medium border-l-4 border-[#009640] pl-5 mb-8">{passeio.descricao_curta}</p>
              <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                {passeio.descricao_completa || "Junte-se a nós numa aventura inesquecível pelas belezas naturais e culturais da nossa região. Garantimos segurança, acompanhamento e momentos que ficarão na memória."}
              </div>
            </div>
          </section>

          {/* ── GUIA OFICIAL ── */}
          <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 text-left">
            <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-8 flex items-center gap-4`}>
              <div className="w-12 h-12 bg-[#009640] text-white rounded-2xl flex items-center justify-center shadow-lg">
                <UserCheck size={24} />
              </div>
              Guia Responsável
            </h3>

            <div className="flex items-center gap-5 text-left p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-slate-100 shrink-0 bg-white flex items-center justify-center">
                 <Compass size={32} className="text-[#009640]"/>
              </div>
              <div>
                 <p className={`${jakarta.className} font-black text-lg text-slate-800 mb-1`}>{passeio.nome_guia || 'Guia Credenciado Local'}</p>
                 <p className="text-xs font-bold text-slate-500 flex items-center gap-2 text-left">
                    <span className="w-2 h-2 rounded-full bg-[#009640]" />Especialista da Região
                 </p>
              </div>
            </div>
          </section>

          {/* ── GALERIA ── */}
          {galeriaCombinada.length > 0 && (
            <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 text-left mb-20">
              <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-8`}>Galeria de Imagens</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {galeriaCombinada.map((url, idx) => (
                  <div key={idx} onClick={() => setFotoExpandidaIndex(idx)} className="relative aspect-square rounded-2xl overflow-hidden shadow-md group bg-slate-200 cursor-pointer">
                    <Image src={url} alt={`Foto Galeria ${idx + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-[#00577C]/0 group-hover:bg-[#00577C]/40 transition-colors duration-300 flex items-center justify-center">
                      <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-10 h-10 scale-50 group-hover:scale-100" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* ── COLUNA DIREITA — MOTOR DE RESERVAS ── */}
        <div className="w-full lg:w-[420px] shrink-0 lg:self-start text-left">
          <aside className="lg:sticky lg:top-32 space-y-6">

            <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">

              <div className="border-b border-slate-100 pb-6 mb-6 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#009640] mb-1">Por Pessoa</p>
                  <p className={`${jakarta.className} text-4xl font-black text-slate-900`}>{formatarMoeda(valorUnitario)}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-1">Vagas</p>
                   <p className="text-sm font-bold text-slate-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{passeio.vagas_disponiveis || 20} Restantes</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C]">1. Quantidade de Pessoas</p>
                <div className="flex items-center justify-between bg-slate-50 border-2 border-slate-100 hover:border-slate-200 transition-colors rounded-[1.5rem] p-4">
                   <div className="flex items-center gap-3">
                      <Users size={20} className="text-[#00577C]"/>
                      <span className="font-bold text-sm text-slate-800">Participantes</span>
                   </div>
                   <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                      <button onClick={() => setPessoas(Math.max(1, pessoas - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-[#00577C] font-black text-xl transition-all">-</button>
                      <span className="font-black text-xl w-6 text-center text-[#00577C]">{pessoas}</span>
                      <button onClick={() => setPessoas(Math.min(passeio.vagas_disponiveis || 20, pessoas + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-[#00577C] font-black text-xl transition-all">+</button>
                   </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 bg-[#009640]/10 p-6 rounded-2xl mb-6 border border-[#009640]/20 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black text-[#009640] uppercase block mb-1 text-left">Total Estimado</span>
                    <span className="text-xs font-bold text-slate-600">{pessoas} {pessoas === 1 ? 'pessoa' : 'pessoas'}</span>
                  </div>
                  <span className={`${jakarta.className} text-3xl font-black text-[#009640]`}>{formatarMoeda(valorTotalFinal)}</span>
                </div>
              </div>

              <button
                onClick={handleReserva}
                className={`${jakarta.className} flex items-center justify-center gap-3 w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-5 rounded-2xl font-black text-lg transition-transform hover:-translate-y-1 shadow-xl`}
              >
                Reservar Passeio <ChevronRightIcon size={20} />
              </button>

              <p className="mt-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <ShieldCheck size={13} className="text-[#00577C]" /> Reserva Oficial SagaTurismo
              </p>
            </div>

            {/* MAPA */}
            {passeio.coordenadas_google_maps && (
              <div className="bg-white p-5 rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden text-center">
                <div className="flex justify-between items-center mb-4 px-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] flex items-center gap-2">
                    <MapPin size={14} className="text-[#009640]" /> Ponto de Encontro
                  </p>
                  <Map className="text-slate-300" size={18}/>
                </div>
                
                <div className="w-full h-[200px] rounded-3xl overflow-hidden bg-slate-100 relative pointer-events-none sm:pointer-events-auto border border-slate-100">
                  {passeio.coordenadas_google_maps.startsWith('<iframe') ? (
                    <div dangerouslySetInnerHTML={{ __html: passeio.coordenadas_google_maps.replace('width="600"', 'width="100%"').replace('height="450"', 'height="100%"') }} className="w-full h-full" />
                  ) : (
                    <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={passeio.coordenadas_google_maps} />
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      {fotoExpandidaIndex !== null && galeriaCombinada.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-5 animate-in fade-in duration-200"
          onClick={fecharGaleria}
        >
          <button onClick={fecharGaleria} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
            <X size={24} />
          </button>
          <button onClick={fotoAnterior} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
            <ChevronLeft size={32} />
          </button>
          <div
            className="relative w-full max-w-6xl aspect-video rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image src={galeriaCombinada[fotoExpandidaIndex]} alt={`Visualização ${fotoExpandidaIndex + 1}`} fill className="object-contain" />
          </div>
          <button onClick={proximaFoto} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
            <ChevronRight size={32} />
          </button>
          <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
            <p className="text-white font-bold tracking-widest text-sm bg-black/60 inline-block px-5 py-2 rounded-full backdrop-blur-sm">
              {fotoExpandidaIndex + 1} de {galeriaCombinada.length}
            </p>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white mt-auto text-left">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative h-14 w-40">
              <Image src="/logop.png" alt="Prefeitura" fill className="object-contain object-left" />
            </div>
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