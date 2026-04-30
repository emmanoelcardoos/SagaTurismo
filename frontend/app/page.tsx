'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Star,
  ExternalLink,
  Menu,
  Landmark,
  Hotel,
  Mountain,
  Waves,
  TreePine,
  Route,
  CalendarDays,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Loader2,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

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

type HotelData = {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  estrelas: number;
  imagem_url: string;
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
// DADOS ESTÁTICOS
// ==========================================
const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1442850473887-0fb77cd0b337?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0',
    title: 'Descubra a beleza natural do Araguaia.',
    subtitle: 'Rios, serras, trilhas e paisagens inesquecíveis no coração do sul do Pará.',
  },
  {
    image: 'https://images.pexels.com/photos/33153432/pexels-photo-33153432.jpeg',
    title: 'Viva experiências únicas em São Geraldo.',
    subtitle: 'Uma cidade acolhedora, cheia de natureza, cultura e histórias para conhecer.',
  },
  {
    image: 'https://images.pexels.com/photos/16832175/pexels-photo-16832175.jpeg',
    title: 'A natureza também é patrimônio do povo.',
    subtitle: 'Residentes têm acesso facilitado ao parque com o Cartão Digital SagaTurismo.',
  },
];

const atracoes = [
  {
    title: 'Serra das Andorinhas',
    desc: 'Um dos maiores símbolos naturais da região, com paisagens marcantes, trilhas, mirantes e o espetáculo das andorinhas ao entardecer.',
    icon: Mountain,
  },
  {
    title: 'Rio Araguaia',
    desc: 'Cenário perfeito para lazer, pesca, banho, passeios e contemplação da natureza às margens de um dos rios mais conhecidos do Brasil.',
    icon: Waves,
  },
  {
    title: 'Trilhas e Ecoturismo',
    desc: 'Experiências em meio à vegetação, formações rochosas, fauna local e paisagens que revelam a força natural do sul do Pará.',
    icon: TreePine,
  },
];

// ==========================================
// COMPONENTE: DESTAQUES VERÃO 2026
// ==========================================
function DestaquesVerao() {
  const [destaques, setDestaques] = useState<EventoDestaque[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDestaques() {
      const { data, error } = await supabase
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
    <section className="py-24 px-5 bg-white border-t border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#F9C400]/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#F9C400] flex items-center gap-2">
              <Sparkles size={16} /> Imperdível
            </p>
            <h2 className={`${jakarta.className} text-4xl font-black text-[#00577C] md:text-6xl tracking-tight`}>
              Destaques Verão 2026
            </h2>
            <p className="mt-4 text-slate-600 text-lg">Os eventos mais aguardados da temporada nas praias do Araguaia.</p>
          </div>
          <Link href="/#eventos" className="inline-flex items-center gap-2 font-bold text-[#00577C] hover:text-[#004766] hover:gap-4 transition-all">
            Ver agenda completa <ArrowRight size={18} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-[#00577C]"><Loader2 className="animate-spin w-10 h-10" /></div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {destaques.map((evento) => (
              <Link key={evento.id} href={`/eventos/${evento.id}`} className="group block relative rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 bg-slate-900 h-[450px]">
                {evento.imagem_url ? (
                  <Image src={evento.imagem_url} alt={evento.titulo} fill className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                ) : (
                  <div className="w-full h-full bg-[#00577C] flex items-center justify-center"><CalendarDays className="text-white/50 w-16 h-16" /></div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-start">
                  <div className="bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-4">
                    {evento.categoria || 'Evento'}
                  </div>
                  <h3 className={`${jakarta.className} text-3xl font-black text-white leading-tight mb-2 line-clamp-2`}>
                    {evento.titulo}
                  </h3>
                  <p className="text-white/80 font-bold flex items-center gap-2 text-sm mt-2">
                    <CalendarDays size={16} className="text-[#F9C400]" /> {formatarData(evento.data)}
                  </p>
                </div>
              </Link>
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
      const { data, error } = await supabase
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
    <section className="py-24 bg-slate-50 border-t border-slate-200 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#009640] flex items-center gap-2 justify-center md:justify-start">
            <ImageIcon size={16} /> Memórias
          </p>
          <h2 className={`${jakarta.className} text-4xl font-black text-[#00577C] md:text-6xl tracking-tight`}>
            Galeria Verão 2025
          </h2>
        </div>
        <Link href="/galeria" className="inline-flex items-center justify-center gap-2 font-bold text-[#00577C] hover:text-[#004766] hover:gap-4 transition-all">
          Ver galeria completa <ArrowRight size={18} />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-[#00577C]"><Loader2 className="animate-spin w-10 h-10" /></div>
      ) : (
        <div className="px-5 w-full overflow-hidden">
          <div className="flex md:grid md:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory pb-8 md:pb-0 hide-scrollbar">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative shrink-0 w-[280px] md:w-full h-[400px] rounded-3xl overflow-hidden group snap-center cursor-pointer shadow-lg bg-slate-100">
                <Image 
                  src={foto.imagem_url} 
                  alt={foto.titulo || 'Foto da Galeria'} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-white font-bold text-sm">{foto.titulo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ==========================================
// COMPONENTE 1: AGENDA CULTURAL
// ==========================================
function AgendaCultural() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchEventos() {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('data', { ascending: true });

      if (error) {
        console.error('Erro ao buscar eventos no Supabase:', error);
      } else if (data) {
        setEventos(data);
      }
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
    if (selectedDate) {
      return evDate.toDateString() === selectedDate.toDateString();
    }
    return evDate.getMonth() === currentDate.getMonth() && evDate.getFullYear() === currentDate.getFullYear();
  });

  return (
    <section id="eventos" className="py-24 px-5 bg-slate-50 relative overflow-hidden border-b border-slate-200">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00577C]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="mb-14 max-w-3xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#009640]">
            Agenda da Cidade Amada
          </p>
          <h2 className={`${jakarta.className} text-4xl font-bold text-[#00577C] md:text-6xl tracking-tight`}>
            Calendário Cultural
          </h2>
          <p className="mt-5 max-w-2xl text-slate-600 text-lg">
            Acompanhe as festividades, eventos esportivos e passeios ecológicos de São Geraldo do Araguaia.
          </p>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-10 items-start">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <button onClick={prevMonth} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-[#00577C] transition">
                <ChevronLeft size={20}/>
              </button>
              <h3 className={`${jakarta.className} text-xl font-bold text-slate-800 uppercase`}>
                {monthNames[currentDate.getMonth()]} <span className="text-[#F9C400]">{currentDate.getFullYear()}</span>
              </h3>
              <button onClick={nextMonth} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-[#00577C] transition">
                <ChevronRight size={20}/>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4 text-center">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, i) => (
                <span key={i} className="text-xs font-black text-slate-400">{dia}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateOfThisCell = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const hasEvent = eventos.some(ev => new Date(ev.data + 'T00:00:00').toDateString() === dateOfThisCell.toDateString());
                const isSelected = selectedDate?.toDateString() === dateOfThisCell.toDateString();

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateOfThisCell)}
                    className={`
                      relative w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-bold transition-all
                      ${isSelected ? 'bg-[#00577C] text-white shadow-lg' : 'hover:bg-slate-100 text-slate-700'}
                      ${hasEvent && !isSelected ? 'ring-2 ring-[#F9C400] bg-[#F9C400]/10 text-[#00577C]' : ''}
                    `}
                  >
                    {day}
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#F9C400]"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <button onClick={() => setSelectedDate(null)} className="text-sm font-bold text-slate-400 hover:text-[#00577C] transition">
                  Mostrar todos do mês
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {filteredEventos.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 border-dashed flex flex-col items-center justify-center h-full min-h-[300px]">
                <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
                <h4 className={`${jakarta.className} text-xl font-bold text-slate-500`}>Nenhum evento agendado</h4>
                <p className="text-slate-400 mt-2">Não há eventos marcados para o período selecionado.</p>
              </div>
            ) : (
              filteredEventos.map((evento) => {
                const evDate = new Date(evento.data + 'T00:00:00');
                const dia = String(evDate.getDate()).padStart(2, '0');
                const mes = monthNames[evDate.getMonth()].slice(0, 3);

                return (
                  <div key={evento.id} className="group bg-white rounded-[2rem] p-4 pr-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all">
                    <div className="shrink-0 w-24 h-24 rounded-3xl bg-[#F0F7FF] flex flex-col items-center justify-center text-[#00577C] border border-[#00577C]/10">
                      <span className="text-3xl font-black leading-none">{dia}</span>
                      <span className="text-xs font-bold uppercase tracking-widest mt-1">{mes}</span>
                    </div>

                    {evento.imagem_url && (
                       <div className="hidden md:block w-32 h-24 shrink-0 rounded-2xl overflow-hidden relative">
                         <Image src={evento.imagem_url} alt={evento.titulo} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                       </div>
                    )}

                    <div className="flex-1 text-center sm:text-left">
                      <span className="inline-block px-3 py-1 bg-[#F9C400]/20 text-[#00577C] rounded-md text-[10px] font-black uppercase tracking-widest mb-2">
                        {evento.categoria || 'Evento'}
                      </span>
                      <h4 className={`${jakarta.className} text-xl font-bold text-slate-900 line-clamp-1`}>{evento.titulo}</h4>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-sm text-slate-500 font-medium">
                        <MapPin size={14} className="text-[#009640]" />
                        <span className="line-clamp-1">{evento.local}</span>
                      </div>
                    </div>

                    <div className="shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
                      <Link href={`/eventos/${evento.id}`} className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-[#00577C] text-[#00577C] hover:text-white px-6 py-3 rounded-full font-bold text-sm transition-colors">
                        <Ticket size={16} /> Detalhes
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// COMPONENTE 2: SECÇÃO DE HOTÉIS
// ==========================================
function SeccaoHoteis() {
  const [hoteis, setHoteis] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHoteis() {
      const { data, error } = await supabase
        .from('hoteis')
        .select('*')
        .order('nome');

      if (data) {
        setHoteis(data);
      }
      setLoading(false);
    }
    fetchHoteis();
  }, []);

  return (
    <section id="hoteis" className="bg-white py-24 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#009640]">
            Onde ficar
          </p>
          <h2 className={`${jakarta.className} text-4xl font-bold text-slate-950 md:text-6xl tracking-tight`}>
            Hotéis e hospedagens
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-slate-600 text-lg">
            Espaços para receber turistas, famílias, visitantes e moradores que desejam aproveitar melhor a cidade.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12 text-[#00577C]">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-7 md:grid-cols-3">
            {hoteis.map((hotel) => (
              <article
                key={hotel.id}
                className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col"
              >
                <div className="relative h-48 w-full bg-slate-50 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                  {hotel.imagem_url ? (
                    <Image
                      src={hotel.imagem_url}
                      alt={hotel.nome}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <Hotel className="h-14 w-14" />
                  )}
                </div>

                <div className="p-7 flex flex-col flex-1">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {hotel.tipo}
                    </span>

                    <div className="flex gap-1">
                      {Array.from({ length: hotel.estrelas }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-[#F9C400] text-[#F9C400]" />
                      ))}
                    </div>
                  </div>

                  <h3 className={`${jakarta.className} text-2xl font-bold text-slate-950 mb-3 line-clamp-1`}>
                    {hotel.nome}
                  </h3>

                  <p className="leading-relaxed text-slate-600 flex-1 line-clamp-3">
                    {hotel.descricao}
                  </p>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      href={`/hoteis/${hotel.id}`}
                      className="inline-flex items-center gap-2 font-bold text-[#00577C] hover:text-[#004766] transition-colors"
                    >
                      Ver detalhes
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL: HOMEPAGE
// ==========================================
export default function HomePage() {
  const [currentImage, setCurrentImage] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const currentSlide = heroSlides[currentImage];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroSlides.length);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <main className={`${inter.className} bg-white text-slate-900`}>
      {/* HEADER */}
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
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              Rota Turística
            </Link>


            <a href="#historia" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              História
            </a>

            <a
              href="https://saogeraldodoaraguaia.pa.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-slate-600 hover:text-[#00577C]"
            >
              Governo
            </a>

            <Link
              href="/cadastro"
              className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]"
            >
              Cartão Residente
            </Link>
          </nav>

          <button className="rounded-xl border border-slate-200 p-2 md:hidden">
            <Menu className="h-5 w-5 text-[#00577C]" />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen overflow-hidden pt-20">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.image}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-r from-[#00577C]/90 via-[#00577C]/62 to-[#00577C]/20" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-5 py-24">
          <div className="max-w-3xl text-white">

            <h1 className={`${jakarta.className} text-5xl font-extrabold leading-[0.95] md:text-7xl`}>
              {currentSlide.title}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">
              {currentSlide.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F9C400] px-7 py-4 font-bold text-[#00577C] shadow-xl transition hover:-translate-y-0.5 hover:bg-[#ffd633]"
              >
                Solicitar cartão com 50% de desconto
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/roteiro"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 px-7 py-4 font-bold text-white backdrop-blur transition hover:bg-white/15"
              >
                Explorar rota turística
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === currentImage ? 'w-8 bg-[#F9C400]' : 'w-2.5 bg-white/45'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ATRAÇÕES */}
      <section id="atracoes" className="mx-auto max-w-7xl px-5 py-24">
        <div className="mb-14 max-w-3xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#009640]">
            Atrações da cidade
          </p>
          <h2 className={`${jakarta.className} text-4xl font-bold text-slate-950 md:text-6xl`}>
            Natureza, aventura e paisagens que ficam na memória.
          </h2>
          <p className="mt-5 max-w-2xl text-slate-600">
            Conheça alguns dos principais pontos de interesse turístico de São Geraldo do Araguaia.
          </p>
        </div>

        <div className="grid gap-7 md:grid-cols-3">
          {atracoes.map(({ title, desc, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF8F0] text-[#009640]">
                <Icon className="h-8 w-8" />
              </div>

              <h3 className={`${jakarta.className} text-2xl font-bold text-slate-950`}>
                {title}
              </h3>

              <p className="mt-4 leading-relaxed text-slate-600">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ROTA TURÍSTICA */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2 md:items-center">
          <div className="relative min-h-[420px] overflow-hidden rounded-[2.5rem] shadow-xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.pexels.com/photos/31780330/pexels-photo-31780330.jpeg?_gl=1*139yaog*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc1NjYxODMkbzI4JGcxJHQxNzc3NTY3MjY2JGoyMCRsMCRoMA..')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#00577C]/75 via-[#00577C]/20 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/20 bg-white/15 p-5 text-white backdrop-blur-md">
              <Route className="mb-3 h-8 w-8 text-[#F9C400]" />
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">
                Roteiro oficial
              </p>
              <p className={`${jakarta.className} mt-1 text-3xl font-bold`}>
                São Geraldo em cada caminho.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#009640]">
              Conheça nossa rota turística
            </p>

            <h2 className={`${jakarta.className} text-4xl font-bold text-slate-950 md:text-6xl`}>
              Um roteiro para descobrir o melhor da cidade.
            </h2>

            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Reunimos paisagens naturais, cultura local, pontos de visitação e experiências
              para quem deseja conhecer São Geraldo do Araguaia com mais direção e propósito.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/roteiro"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#F9C400] px-8 py-4 font-bold text-[#00577C] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#ffd633]"
              >
                Explorar rota turística
                <ArrowRight className="h-5 w-5" />
              </Link>

              <a
                href="#eventos"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-8 py-4 font-bold text-[#00577C] transition hover:border-[#00577C] hover:bg-white"
              >
                Ver Agenda Cultural
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* AGENDA CULTURAL LIGADA À SUPABASE */}
      <AgendaCultural />
      {/* NOVAS SECÇÕES ADICIONADAS AQUI */}
      <DestaquesVerao />
      <GaleriaVerao />

      

      {/* HOTÉIS LIGADOS À SUPABASE */}
      <SeccaoHoteis />

      {/* HISTÓRIA */}
      <section id="historia" className="bg-slate-50 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#009640]">
              História da cidade
            </p>

            <h2 className={`${jakarta.className} text-4xl font-bold text-slate-950 md:text-6xl`}>
              Uma cidade moldada pelo rio, pela serra e pelo seu povo.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              São Geraldo do Araguaia é uma cidade marcada pela relação com o Rio Araguaia,
              pela força da natureza e pela identidade de seu povo. Entre paisagens naturais,
              tradições locais e histórias de desenvolvimento, o município se tornou uma porta
              de entrada para experiências ligadas ao ecoturismo, à cultura regional e à vida
              às margens do Araguaia.
            </p>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              O SagaTurismo nasce para valorizar esse patrimônio, aproximar visitantes das
              riquezas locais e garantir que os moradores também tenham acesso facilitado aos
              principais atrativos da cidade.
            </p>
          </div>

          <div className="rounded-[2.5rem] bg-white p-10 shadow-xl">
            <Landmark className="mb-8 h-12 w-12 text-[#00577C]" />

            <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-[#009640]">
              Patrimônio local
            </p>

            <h3 className={`${jakarta.className} mt-4 text-4xl font-bold text-[#00577C]`}>
              Turismo que valoriza a identidade araguaiense.
            </h3>

            <p className="mt-5 leading-relaxed text-slate-600">
              Mais do que visitar lugares, o turismo local também fortalece memórias,
              histórias, economia e orgulho de pertencimento.
            </p>
          </div>
        </div>
      </section>

      {/* BENEFÍCIO */}
      <section className="bg-[#00577C] py-24 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#F9C400]">
                Cartão do residente
              </p>

              <h2 className={`${jakarta.className} text-4xl font-bold md:text-6xl`}>
                Mora em São Geraldo do Araguaia? O parque também é para ti!
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
                Residentes podem solicitar o cartão digital e garantir 50% de desconto
                na entrada do parque, de forma simples, rápida e segura.
              </p>

              <Link
                href="/cadastro"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#F9C400] px-8 py-4 font-bold text-[#00577C] transition hover:-translate-y-0.5 hover:bg-[#ffd633]"
              >
                Solicitar meu cartão
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-8 backdrop-blur">
              <ShieldCheck className="mb-6 h-12 w-12 text-[#F9C400]" />
              <p className="text-6xl font-black">50%</p>
              <p className="mt-3 text-xl font-bold">de desconto para residentes</p>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                Benefício digital vinculado ao cadastro do morador.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER INSTITUCIONAL COMPLETO */}
      <footer className="py-20 px-8 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
               <img src="/logop.png" alt="Prefeitura SGA" className="h-20 object-contain" />
               <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">São Geraldo do Araguaia <br/> "Cidade Amada, seguindo em frente"</p>
            </div>
            
            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Gestão Executiva</h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Prefeito: <br/><b>Jefferson Douglas de Jesus Oliveira</b></li>
                <li>Vice-Prefeito: <br/><b>Marcos Antônio Candido de Lucena</b></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Turismo (SEMTUR)</h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Secretária: <br/><b>Micheli Stephany de Souza</b></li>
                <li>Contato: <b>(94) 98145-2067</b></li>
                <li>Email: <b>setursaga@gmail.com</b></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Equipe Técnica</h5>
              <ul className="text-sm text-slate-500 space-y-2 font-medium">
                <li>• Adriana da Luz Lima</li>
                <li>• Carmelita Luz da Silva</li>
                <li>• Diego Silva Costa</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center pt-10 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Secretaria Municipal de Turismo - São Geraldo do Araguaia (PA)</p>
          </div>
        </div>
      </footer>
    </main>
  );
}