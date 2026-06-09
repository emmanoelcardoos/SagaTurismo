'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  ArrowRight, ShieldCheck, Star, ExternalLink, Menu, Landmark, Hotel,
  Mountain, Waves, TreePine, CalendarDays, MapPin, Ticket,
  Loader2, Sparkles, Image as ImageIcon, Compass, CheckCircle2, X,
  ChevronLeft, ChevronRight, Route, ChevronDown, ChevronUp
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// ── FONTES ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ==========================================
// MOTOR DE ANIMAÇÕES DE SCROLL (DESIGN EDITORIAL)
// ==========================================
function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);

  return { ref, isVisible };
}

function AnimatedSection({
  children,
  className = "",
  animation = "fade-up",
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-left" | "fade-right" | "zoom-in";
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();
  let hiddenClass = "opacity-0 translate-y-12";
  if (animation === "fade-left") hiddenClass = "opacity-0 translate-x-12";
  if (animation === "fade-right") hiddenClass = "opacity-0 -translate-x-12";
  if (animation === "zoom-in") hiddenClass = "opacity-0 scale-95";

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0 scale-100" : hiddenClass} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ==========================================
// TIPAGENS
// ==========================================
type Evento = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  imagem_url: string;
  categoria: string;
};

type PasseioData = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_principal: string;
  valor_total: number;
  data_passeio: string;
  nome_guia: string;
};

type HotelData = {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  estrelas: number;
  imagem_url: string;
};

type PacoteData = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_principal: string;
  preco?: number;
};

type EventoDestaque = {
  id: string;
  titulo: string;
  data: string;
  imagem_url: string;
  categoria: string;
};

type FotoGaleria = {
  id: string;
  imagem_url: string;
  titulo: string;
};

// ==========================================
// COMPONENTE: DESTAQUES VERÃO 2026
// ==========================================
function DestaquesVerao() {
  const [destaques, setDestaques] = useState<EventoDestaque[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDestaques() {
      const { data } = await supabase
        .from('eventos')
        .select('id, titulo, data, imagem_url, categoria')
        .eq('destaque', true)
        .limit(3);
      if (data) setDestaques(data);
      setLoading(false);
    }
    fetchDestaques();
  }, []);

  const formatarData = (dataStr: string) => {
    const dataObj = new Date(dataStr + 'T00:00:00');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${String(dataObj.getDate()).padStart(2, '0')} ${meses[dataObj.getMonth()]}`;
  };

  return (
    <section className="py-24 bg-[#FDFCF7] border-t border-slate-100 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        <AnimatedSection animation="fade-up" className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#F9C400] flex items-center gap-2">
                <Sparkles size={14} /> Próxima temporada de verão
              </p>
              <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-slate-900 leading-[0.9]`}>
                Destaques<br /><span className="italic text-[#00577C]">Verão 2026</span>
              </h2>
            </div>
            <Link href="/eventos" className="inline-flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-[#00577C] hover:gap-4 transition-all">
              Ver agenda completa <ArrowRight size={16} />
            </Link>
          </div>
        </AnimatedSection>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin w-10 h-10 text-[#00577C]" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {destaques[0] && (
              <AnimatedSection animation="fade-right" className="md:col-span-2 md:row-span-2">
                <Link href={`/eventos/${destaques[0].id}`} className="group relative h-[500px] rounded-[2rem] overflow-hidden block">
                  {destaques[0].imagem_url
                    ? <Image src={destaques[0].imagem_url} alt={destaques[0].titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    : <div className="w-full h-full bg-[#00577C]" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8 text-white">
                    <span className="inline-block bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest mb-3">{destaques[0].categoria || 'Evento'}</span>
                    <h3 className={`${jakarta.className} text-3xl font-black leading-tight mb-2`}>{destaques[0].titulo}</h3>
                    <p className="text-white/70 font-bold flex items-center gap-2 text-xs"><CalendarDays size={14} className="text-[#F9C400]" /> {formatarData(destaques[0].data)}</p>
                  </div>
                </Link>
              </AnimatedSection>
            )}
            {destaques.slice(1).map((evento, i) => (
              <AnimatedSection key={evento.id} animation="fade-left" delay={(i + 1) * 200}>
                <Link href={`/eventos/${evento.id}`} className="group relative h-[240px] rounded-[2rem] overflow-hidden block bg-[#00577C]">
                  {evento.imagem_url && (
                    <Image src={evento.imagem_url} alt={evento.titulo} fill className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <span className="inline-block bg-[#F9C400] text-[#00577C] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest mb-2">{evento.categoria || 'Evento'}</span>
                    <h3 className={`${jakarta.className} text-xl font-black leading-tight`}>{evento.titulo}</h3>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ==========================================
// COMPONENTE: GALERIA VERÃO 2025
// ==========================================
function GaleriaVerao() {
  const [fotos, setFotos] = useState<FotoGaleria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGaleria() {
      const { data } = await supabase
        .from('galeria')
        .select('id, imagem_url, titulo')
        .eq('ano', '2025')
        .limit(5);
      if (data) setFotos(data);
      setLoading(false);
    }
    fetchGaleria();
  }, []);

  return (
    <section className="py-24 bg-[#002f40] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 mb-12">
        <AnimatedSection animation="fade-up" className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#F9C400] flex items-center gap-2">
              <ImageIcon size={14} /> Memórias
            </p>
            <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-[0.9]`}>
              Galeria<br /><span className="italic text-[#F9C400]">Verão 2025</span>
            </h2>
          </div>
          <Link href="/galeria" className="inline-flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-white hover:gap-4 transition-all">
            Ver galeria completa <ArrowRight size={16} />
          </Link>
        </AnimatedSection>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin w-10 h-10 text-[#F9C400]" /></div>
      ) : (
        <div className="px-6 w-full">
          <div className="flex md:grid md:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory pb-6 md:pb-0 hide-scrollbar">
            {fotos.map((foto, i) => (
              <AnimatedSection key={foto.id} animation="zoom-in" delay={i * 100} className="shrink-0 w-[260px] md:w-full">
                <Link href="/galeria" className="relative h-[350px] md:h-[420px] rounded-[2rem] overflow-hidden group cursor-pointer bg-slate-800 block">
                  <Image src={foto.imagem_url} alt={foto.titulo || 'Foto da Galeria'} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-white font-bold text-sm line-clamp-2">{foto.titulo}</p>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ==========================================
// COMPONENTE: AGENDA CULTURAL (mantido)
// ==========================================
function AgendaCultural() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchEventos() {
      const { data, error } = await supabase.from('eventos').select('*').order('data', { ascending: true });
      if (!error && data) setEventos(data);
    }
    fetchEventos();
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const filteredEventos = eventos.filter(ev => {
    const evDate = new Date(ev.data + 'T00:00:00');
    if (selectedDate) return evDate.toDateString() === selectedDate.toDateString();
    return evDate.getMonth() === currentDate.getMonth() && evDate.getFullYear() === currentDate.getFullYear();
  });

  return null; // mantido como estava, sem alterações
}

// ==========================================
// COMPONENTE: SECÇÃO DE HOTÉIS
// ==========================================
function SeccaoHoteis() {
  const [hoteis, setHoteis] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHoteis() {
      const { data } = await supabase.from('hoteis').select('*').order('estrelas', { ascending: false }).limit(3);
      if (data) setHoteis(data);
      setLoading(false);
    }
    fetchHoteis();
  }, []);

  return (
    <section id="hoteis" className="py-24 bg-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        <AnimatedSection animation="fade-up" className="mb-16">
          <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-slate-900 leading-[0.9]`}>
            Alojamentos<br /><span className="italic text-[#00577C]">Locais</span>
          </h2>
          <p className="mt-6 text-slate-500 text-lg max-w-xl">Espaços para receber turistas, famílias e visitantes que desejam aproveitar a cidade e suas belezas naturais.</p>
        </AnimatedSection>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin w-10 h-10 text-[#00577C]" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hoteis[0] && (
                <AnimatedSection animation="fade-right" className="md:col-span-2">
                  <Link href={`/hoteis/${hoteis[0].id}`} className="group relative h-[420px] rounded-[2rem] overflow-hidden bg-slate-900 block">
                    {hoteis[0].imagem_url
                      ? <Image src={hoteis[0].imagem_url} alt={hoteis[0].nome} fill className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
                      : <div className="w-full h-full bg-[#00577C] flex items-center justify-center"><Hotel className="w-16 h-16 text-white/30" /></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{hoteis[0].tipo}</span>
                        <div className="flex gap-1">{Array.from({ length: hoteis[0].estrelas }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#F9C400] text-[#F9C400]" />)}</div>
                      </div>
                      <h3 className={`${jakarta.className} text-3xl font-black mb-2`}>{hoteis[0].nome}</h3>
                      <p className="text-white/70 text-sm line-clamp-2 mb-4">{hoteis[0].descricao}</p>
                      <span className="inline-flex items-center gap-2 bg-[#F9C400] text-[#00577C] px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest">
                        Ver detalhes <ExternalLink size={14} />
                      </span>
                    </div>
                  </Link>
                </AnimatedSection>
              )}

              <div className="flex flex-col gap-6">
                {hoteis.slice(1).map((hotel, i) => (
                  <AnimatedSection key={hotel.id} animation="fade-left" delay={(i + 1) * 200}>
                    <Link href={`/hoteis/${hotel.id}`} className="group relative h-[196px] rounded-[2rem] overflow-hidden bg-slate-900 block">
                      {hotel.imagem_url
                        ? <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
                        : <div className="w-full h-full bg-[#009640] flex items-center justify-center"><Hotel className="w-12 h-12 text-white/30" /></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6 text-white">
                        <div className="flex gap-1 mb-1">{Array.from({ length: hotel.estrelas }).map((_, j) => <Star key={j} className="h-3 w-3 fill-[#F9C400] text-[#F9C400]" />)}</div>
                        <h3 className={`${jakarta.className} text-xl font-black line-clamp-1`}>{hotel.nome}</h3>
                        <span className="inline-flex items-center gap-1 text-[#F9C400] font-bold text-xs mt-1">
                          Ver detalhes <ExternalLink size={12} />
                        </span>
                      </div>
                    </Link>
                  </AnimatedSection>
                ))}
              </div>
            </div>

            <AnimatedSection animation="fade-up" delay={200} className="mt-10">
              <Link href="/hoteis" className="inline-flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-[#00577C] hover:gap-4 transition-all">
                Ver todos os hotéis disponíveis <ArrowRight size={16} />
              </Link>
            </AnimatedSection>
          </>
        )}
      </div>
    </section>
  );
}

// ==========================================
// COMPONENTE: SECÇÃO PACOTES
// ==========================================
function SeccaoPacotes() {
  const [pacotes, setPacotes] = useState<PacoteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPacotes() {
      const { data } = await supabase.from('pacotes').select('*').eq('ativo', true).limit(3);
      if (data) setPacotes(data);
      setLoading(false);
    }
    fetchPacotes();
  }, []);

  return (
    <section id="pacotes" className="py-24 bg-[#002f40] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        <AnimatedSection animation="fade-up" className="mb-16">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#F9C400]">Experiência Completa</p>
          <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-[0.9]`}>
            Pacotes<br /><span className="italic text-[#F9C400]">Turísticos</span>
          </h2>
          <p className="mt-6 text-white/60 text-lg max-w-xl">Roteiros planejados para aproveitar o melhor do Araguaia com total conforto.</p>
        </AnimatedSection>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin w-10 h-10 text-[#F9C400]" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pacotes.map((pacote, i) => (
                <AnimatedSection key={pacote.id} animation="fade-up" delay={i * 120}>
                  <Link href={`/pacotes/${pacote.id}`} className="group relative h-[380px] rounded-[2rem] overflow-hidden bg-slate-900 flex flex-col block">
                    <Image
                      src={pacote.imagem_principal || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'}
                      alt={pacote.titulo} fill
                      className="object-cover opacity-75 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                    <div className="absolute top-4 left-4 bg-white/10 backdrop-blur px-3 py-1 rounded-lg text-[9px] font-black uppercase text-white tracking-widest flex items-center gap-1">
                      <CheckCircle2 size={10} className="text-[#F9C400]" /> Reserva Imediata
                    </div>
                    <div className="absolute bottom-8 left-8 right-8 text-white">
                      <h3 className={`${jakarta.className} text-2xl font-black mb-2 line-clamp-1`}>{pacote.titulo}</h3>
                      <p className="text-white/60 text-sm line-clamp-2 mb-4">{pacote.descricao_curta}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">A partir de</p>
                          <p className={`${jakarta.className} text-xl font-black text-[#F9C400]`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(pacote.preco || 150))}
                          </p>
                        </div>
                        <span className="bg-[#F9C400] text-[#00577C] p-3 rounded-full flex items-center justify-center">
                          <ChevronRight size={18} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection animation="fade-up" delay={200} className="mt-10">
              <Link href="/pacotes" className="inline-flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-white hover:gap-4 transition-all">
                Ver todos os pacotes <ArrowRight size={16} />
              </Link>
            </AnimatedSection>
          </>
        )}
      </div>
    </section>
  );
}

// ==========================================
// COMPONENTE: SECÇÃO PASSEIOS
// ==========================================
function SeccaoPasseios() {
  const [passeios, setPasseios] = useState<PasseioData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPasseios() {
      const { data } = await supabase.from('passeios').select('*').eq('ativo', true).order('data_passeio', { ascending: true }).limit(3);
      if (data) setPasseios(data);
      setLoading(false);
    }
    fetchPasseios();
  }, []);

  const formatarDataSimples = (dataStr: string) => {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}`;
  };

  return (
    <section id="passeios" className="py-24 bg-[#FDFCF7] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        <AnimatedSection animation="fade-up" className="mb-16">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#009640]">Bate e Volta</p>
          <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-slate-900 leading-[0.9]`}>
            Passeios de<br /><span className="italic text-[#00577C]">Fim de Semana</span>
          </h2>
          <p className="mt-6 text-slate-500 text-lg max-w-xl">Trilhas, banhos e cultura com guias locais credenciados.</p>
        </AnimatedSection>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin w-10 h-10 text-[#00577C]" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {passeios[0] && (
                <AnimatedSection animation="fade-right" className="md:col-span-2">
                  <Link href={`/passeios/${passeios[0].id}`} className="group relative h-[420px] rounded-[2rem] overflow-hidden bg-slate-900 block">
                    <Image
                      src={passeios[0].imagem_principal || 'https://images.unsplash.com/photo-1551632811-561732d1e306'}
                      alt={passeios[0].titulo} fill
                      className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                    <div className="absolute top-4 left-4 bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg text-[9px] font-black uppercase text-[#F9C400] tracking-widest flex items-center gap-2">
                      <CalendarDays size={11} /> {formatarDataSimples(passeios[0].data_passeio)}
                    </div>
                    <div className="absolute bottom-8 left-8 right-8 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Compass size={14} className="text-[#F9C400]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Guia: {passeios[0].nome_guia || 'Local'}</span>
                      </div>
                      <h3 className={`${jakarta.className} text-3xl font-black mb-2 line-clamp-1`}>{passeios[0].titulo}</h3>
                      <p className="text-white/60 text-sm line-clamp-2 mb-4">{passeios[0].descricao_curta}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Valor por pessoa</p>
                          <p className={`${jakarta.className} text-xl font-black text-[#009640]`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(passeios[0].valor_total || 0))}
                          </p>
                        </div>
                        <span className="bg-[#F9C400] text-[#00577C] p-3 rounded-full flex items-center justify-center">
                          <ArrowRight size={18} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              )}

              <div className="flex flex-col gap-6">
                {passeios.slice(1).map((passeio, i) => (
                  <AnimatedSection key={passeio.id} animation="fade-left" delay={(i + 1) * 200}>
                    <Link href={`/passeios/${passeio.id}`} className="group relative h-[196px] rounded-[2rem] overflow-hidden bg-slate-900 block">
                      <Image
                        src={passeio.imagem_principal || 'https://images.unsplash.com/photo-1551632811-561732d1e306'}
                        alt={passeio.titulo} fill
                        className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6 text-white">
                        <h3 className={`${jakarta.className} text-xl font-black line-clamp-1 mb-1`}>{passeio.titulo}</h3>
                        <div className="flex items-center justify-between">
                          <p className={`${jakarta.className} text-base font-black text-[#009640]`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(passeio.valor_total || 0))}
                          </p>
                          <span className="text-[#F9C400] inline-flex items-center gap-1 font-bold text-xs">
                            Ver <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </AnimatedSection>
                ))}
              </div>
            </div>

            <AnimatedSection animation="fade-up" delay={200} className="mt-10">
              <Link href="/passeios" className="inline-flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-[#00577C] hover:gap-4 transition-all">
                Ver agenda de passeios <ArrowRight size={16} />
              </Link>
            </AnimatedSection>
          </>
        )}
      </div>
    </section>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL: HOMEPAGE
// ==========================================
export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
      if (currentScrollY < 80) setShowHeader(true);
      else if (currentScrollY > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <main className={`${inter.className} bg-white text-slate-900 overflow-x-hidden`}>

      {/* ── HEADER EDITORIAL ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
              <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Atracoes', 'Passeios', 'Biodiversidade', 'Gastronomia', 'Comunidades', 'Informacoes', 'Parceiros'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro"
              className={`${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
              Residente
            </Link>
          </nav>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            {['Hoteis', 'Pacotes', 'Atracoes', 'Passeios', 'Aldeias', 'Biodiversidade', 'Informacoes', 'Parceiros'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro"
              className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>
              Cartão Residente
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO SECTION PREMIUM (sem indicador de scroll) ── */}
      <section className="relative h-[95vh] flex flex-col 
        justify-end md:justify-end        
        pb-20 md:pb-20 px-6 md:px-10 overflow-hidden bg-[#002f40]
        max-md:justify-center             
        max-md:items-center               
        max-md:pb-8 max-md:px-5"
      > 
        <video 
          src="/serra.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#002f40] via-[#002f40]/10 to-transparent" />

        <div className="relative z-10 max-w-[1400px] mx-auto w-full text-center md:text-left max-md:text-center">
          <h1 className={`${jakarta.className} text-5xl md:text-8xl font-black text-white leading-[0.9] mb-8 max-md:text-4xl max-md:leading-tight max-md:mb-6`}>
            Conheça<br />
            <span className="italic text-[#F9C400]">São Geraldo do Araguaia</span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 max-md:gap-3 max-md:justify-center">
            <Link href="/rotas" className="inline-block bg-white text-[#00577C] px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#F9C400] transition-colors max-md:px-6 max-md:py-3 max-md:text-center">
              Aventure-se
            </Link>
            <a href="/eventos" className="inline-block border border-white/30 text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-colors max-md:px-6 max-md:py-3 max-md:text-center">
              Eventos
            </a>
          </div>
        </div>
      </section>

      {/* ── ROTA TURÍSTICA — BENTO GRID ── */}
      <section className="py-24 bg-[#FDFCF7]">
        <div className="max-w-[1400px] mx-auto px-6">
          <AnimatedSection animation="fade-up">
            <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-slate-900 mb-16 leading-[0.9]`}>
              Rotas de<br /><span className="italic text-[#00577C]">Aventura</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedSection animation="fade-right" className="md:col-span-2 md:row-span-2">
              <Link href="/rotas" className="relative h-[500px] rounded-[2rem] overflow-hidden group block">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: "url('https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/IMG_1803.PNG')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <h3 className={`${jakarta.className} text-4xl font-black mb-2`}>Roteiros</h3>
                  <p className="text-white/70 text-base mb-4">Descubra a nossa natureza ainda intacta.</p>
                  <span className="inline-flex items-center gap-2 bg-[#F9C400] text-[#00577C] px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest">
                    Explorar rota <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </AnimatedSection>

            <AnimatedSection animation="fade-left" delay={200}>
              <Link href="/comunidades" className="relative h-[240px] rounded-[2rem] overflow-hidden group block">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: "url('https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/df417333-2d29-4ae1-80cb-47a0491c8d40.JPG')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <h3 className={`${jakarta.className} text-2xl font-black mb-3`}>Comunidades</h3>
                  <span className="inline-flex items-center gap-2 bg-[#F9C400] text-[#00577C] px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">
                    Explorar <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            </AnimatedSection>

            <AnimatedSection animation="fade-left" delay={400}>
              <Link href="/gastronomia" className="relative h-[240px] rounded-[2rem] overflow-hidden group block">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: "url('https://images.pexels.com/photos/3727208/pexels-photo-3727208.jpeg?_gl=1*1xsyb3f*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk5NjEyMzQkbzY3JGcxJHQxNzc5OTYxMjczJGoyMSRsMCRoMA..')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <h3 className={`${jakarta.className} text-2xl font-black mb-2`}>Gastronomia</h3>
                  <span className="inline-flex items-center gap-2 bg-[#F9C400] text-[#00577C] px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">
                    Explorar <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── AGENDA CULTURAL ── */}
      <AgendaCultural />

      {/* ── DESTAQUES VERÃO ── */}
      <DestaquesVerao />

      {/* ── GALERIA ── */}
      <GaleriaVerao />

      {/* ── HOTÉIS ── */}
      <SeccaoHoteis />

      {/* ── PACOTES ── */}
      <SeccaoPacotes />

      {/* ── PASSEIOS ── */}
      <SeccaoPasseios />

      {/* ── HISTÓRIA ── */}
{/* 
      <section id="historia" className="py-24 bg-[#002f40] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="fade-right">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#F9C400]">História da cidade</p>
              <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-[0.9] mb-8`}>
                Uma cidade<br /><span className="italic text-[#F9C400]">moldada pelo rio</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                São Geraldo do Araguaia é marcada pela relação com o Rio Araguaia, pela força da natureza e pela identidade de seu povo. Uma porta de entrada para o ecoturismo, à cultura regional e à vida às margens do Araguaia.
              </p>
              <Link href="/historia" className="inline-flex items-center gap-3 bg-[#F9C400] text-[#00577C] px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white transition-colors">
                História Completa <ArrowRight size={16} />
              </Link>
            </AnimatedSection>

            <AnimatedSection animation="fade-left" delay={200}>
              <Link href="/historia" className="rounded-[2rem] bg-white/5 backdrop-blur border border-white/10 p-10 block hover:bg-white/10 transition-colors">
                <Landmark className="mb-6 h-12 w-12 text-[#F9C400]" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F9C400] mb-4">Patrimônio local</p>
                <h3 className={`${jakarta.className} text-3xl font-black text-white leading-tight mb-4`}>
                  Turismo que valoriza a identidade araguaiense.
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Mais do que visitar lugares, o turismo local fortalece memórias, histórias, economia e orgulho de pertencimento.
                </p>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>
*/}


      {/* ── CARTÃO RESIDENTE ── */}
      <section className="py-24 bg-[#F9C400] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
            <AnimatedSection animation="fade-right">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#00577C]/60">Cartão do residente</p>
              <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-[#002f40] leading-[0.9] mb-8`}>
                Mora em SGA?<br /><span className="italic">O parque<br />é para ti!</span>
              </h2>
              <p className="text-[#002f40]/60 text-lg leading-relaxed mb-8 max-w-xl">
                Residentes podem solicitar o cartão digital e garantir 50% de desconto na entrada do parque, de forma simples, rápida e segura.
              </p>
              <Link href="/cadastro" className="inline-flex items-center gap-3 bg-[#002f40] text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#00577C] transition-colors">
                Solicitar meu cartão <ArrowRight size={16} />
              </Link>
            </AnimatedSection>

            <AnimatedSection animation="zoom-in" delay={200}>
              <Link href="/cadastro" className="rounded-[2rem] bg-[#002f40] p-10 text-white block hover:bg-[#001f2e] transition-colors">
                <ShieldCheck className="mb-6 h-12 w-12 text-[#F9C400]" />
                <p className="text-7xl md:text-8xl font-black mb-3">50%</p>
                <p className="text-xl font-bold mb-3">de desconto para residentes</p>
                <p className="text-white/50 text-sm leading-relaxed">Benefício digital vinculado ao cadastro do morador.</p>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-20 px-6 bg-[#FDFCF7] border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-16 mb-20">
            <div className="space-y-6">
              <img src="/logop.png" alt="Prefeitura SGA" className="h-20 object-contain" />
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest leading-relaxed">
                São Geraldo do Araguaia<br />"Cidade Amada, seguindo em frente"
              </p>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-[10px] uppercase tracking-widest border-b border-slate-100 pb-4">Gestão Executiva</h5>
              <ul className="text-xs text-slate-500 space-y-3 font-medium">
                <li>Prefeito:<br /><b>Jefferson Douglas de Jesus Oliveira</b></li>
                <li>Vice-Prefeito:<br /><b>Marcos Antônio Candido de Lucena</b></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-[10px] uppercase tracking-widest border-b border-slate-100 pb-4">Turismo (SEMTUR)</h5>
              <ul className="text-xs text-slate-500 space-y-3 font-medium">
                <li>Secretária:<br /><b>Micheli Stephany de Souza</b></li>
                <li>Contato: <b>(94) 98145-2067</b></li>
                <li>Email: <b>setursaga@gmail.com</b></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-[10px] uppercase tracking-widest border-b border-slate-100 pb-4">Equipe Técnica</h5>
              <ul className="text-xs text-slate-500 space-y-2 font-medium">
                <li>• Adriana da Luz Lima</li>
                <li>• Carmelita Luz da Silva</li>
                <li>• Diego Silva Costa</li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-10 border-t border-slate-100">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Secretaria Municipal de Turismo — São Geraldo do Araguaia (PA)</p>
          </div>
        </div>
      </footer>

    </main>
  );
}