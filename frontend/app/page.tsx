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
  Image as ImageIcon,
  Compass,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Globe,
  Clock,
  Users,
  TrendingUp,
  Award,
  Leaf
} from 'lucide-react';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
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
    <section className="py-24 md:py-32 px-5 bg-[#F7F4EF] relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#C9A84C]/8 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <span className={`${dmSans.className} text-xs font-600 uppercase tracking-[0.25em] text-[#C9A84C]`}>
                Imperdível
              </span>
            </div>
            <h2 className={`${playfair.className} text-4xl md:text-6xl font-800 text-[#1A2B3C] leading-tight`}>
              Destaques <em className="italic text-[#C9A84C]">Verão 2026</em>
            </h2>
            <p className={`${dmSans.className} mt-4 text-[#4A5568] text-lg leading-relaxed`}>
              Os eventos mais aguardados da temporada nas praias do Araguaia.
            </p>
          </div>
          <Link href="/#eventos" className={`${dmSans.className} inline-flex items-center gap-2 text-sm font-600 text-[#1A2B3C] border-b border-[#1A2B3C]/30 pb-0.5 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all group`}>
            Ver agenda completa
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-[#C9A84C]"><Loader2 className="animate-spin w-8 h-8" /></div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {destaques.map((evento, index) => (
              <Link key={evento.id} href={`/eventos/${evento.id}`}
                className={`group block relative rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-[#1A2B3C] ${index === 0 ? 'md:col-span-1 h-[480px]' : 'h-[380px]'}`}
              >
                {evento.imagem_url ? (
                  <Image src={evento.imagem_url} alt={evento.titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-75 group-hover:opacity-90" />
                ) : (
                  <div className="w-full h-full bg-[#1A2B3C] flex items-center justify-center">
                    <CalendarDays className="text-white/20 w-20 h-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-[#0D1B2A]/30 to-transparent" />
                <div className="absolute top-6 left-6">
                  <span className={`${dmSans.className} bg-[#C9A84C] text-[#1A2B3C] px-3 py-1 rounded-full text-[10px] font-700 uppercase tracking-widest`}>
                    {evento.categoria || 'Evento'}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <p className={`${dmSans.className} text-[#C9A84C] text-xs font-600 uppercase tracking-widest mb-2 flex items-center gap-2`}>
                    <CalendarDays size={12} /> {formatarData(evento.data)}
                  </p>
                  <h3 className={`${playfair.className} text-2xl font-700 text-white leading-snug line-clamp-2`}>
                    {evento.titulo}
                  </h3>
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
    <section className="py-24 md:py-32 bg-[#1A2B3C] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-5 mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className={`${dmSans.className} text-xs font-600 uppercase tracking-[0.25em] text-[#C9A84C]`}>Memórias</span>
          </div>
          <h2 className={`${playfair.className} text-4xl md:text-6xl font-800 text-white leading-tight`}>
            Galeria <em className="italic text-[#C9A84C]">Verão 2025</em>
          </h2>
        </div>
        <Link href="/galeria" className={`${dmSans.className} inline-flex items-center gap-2 text-sm font-600 text-white/60 hover:text-[#C9A84C] border-b border-white/20 hover:border-[#C9A84C] pb-0.5 transition-all group`}>
          Ver galeria completa <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-[#C9A84C]"><Loader2 className="animate-spin w-8 h-8" /></div>
      ) : (
        <div className="px-5 w-full overflow-hidden">
          <div className="flex md:grid md:grid-cols-5 gap-3 overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 hide-scrollbar">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative shrink-0 w-[240px] md:w-full h-[340px] md:h-[380px] rounded-xl overflow-hidden group snap-center cursor-pointer bg-[#0D1B2A]">
                <Image
                  src={foto.imagem_url}
                  alt={foto.titulo || 'Foto da Galeria'}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                <div className="absolute bottom-5 left-5 right-5 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p className={`${dmSans.className} text-white font-500 text-sm line-clamp-2`}>{foto.titulo}</p>
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
// COMPONENTE: AGENDA CULTURAL
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

  return (
    <section id="eventos" className="py-24 md:py-32 px-5 bg-white relative overflow-hidden">
      <div className="absolute -top-px left-0 right-0 h-px bg-[#E8E2D9]" />

      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className={`${dmSans.className} text-xs font-600 uppercase tracking-[0.25em] text-[#C9A84C]`}>Agenda da Cidade Amada</span>
          </div>
          <h2 className={`${playfair.className} text-4xl md:text-6xl font-800 text-[#1A2B3C] leading-tight`}>
            Calendário <em className="italic">Cultural</em>
          </h2>
          <p className={`${dmSans.className} mt-4 text-[#4A5568] text-lg leading-relaxed max-w-2xl`}>
            Acompanhe as festividades, eventos esportivos e passeios ecológicos de São Geraldo do Araguaia.
          </p>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-10 items-start">
          {/* Calendar */}
          <div className="bg-[#F7F4EF] rounded-2xl p-7 border border-[#E8E2D9]">
            <div className="flex items-center justify-between mb-8">
              <button onClick={prevMonth} className="w-9 h-9 rounded-full bg-white border border-[#E8E2D9] flex items-center justify-center text-[#1A2B3C] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors shadow-sm">
                <ChevronLeft size={16} />
              </button>
              <h3 className={`${playfair.className} text-lg font-700 text-[#1A2B3C]`}>
                {monthNames[currentDate.getMonth()]} <span className="text-[#C9A84C]">{currentDate.getFullYear()}</span>
              </h3>
              <button onClick={nextMonth} className="w-9 h-9 rounded-full bg-white border border-[#E8E2D9] flex items-center justify-center text-[#1A2B3C] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors shadow-sm">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-3 text-center">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, i) => (
                <span key={i} className={`${dmSans.className} text-[10px] font-700 text-[#8B9AA8] uppercase`}>{dia}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="p-2" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateCell = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const hasEvent = eventos.some(ev => new Date(ev.data + 'T00:00:00').toDateString() === dateCell.toDateString());
                const isSelected = selectedDate?.toDateString() === dateCell.toDateString();
                return (
                  <button key={day} onClick={() => setSelectedDate(isSelected ? null : dateCell)}
                    className={`relative w-9 h-9 mx-auto rounded-full flex items-center justify-center text-sm font-500 transition-all ${dmSans.className}
                      ${isSelected ? 'bg-[#1A2B3C] text-white shadow-md' : 'hover:bg-white text-[#1A2B3C]'}
                      ${hasEvent && !isSelected ? 'ring-2 ring-[#C9A84C]/60 bg-[#C9A84C]/10 text-[#1A2B3C] font-700' : ''}
                    `}
                  >
                    {day}
                    {hasEvent && !isSelected && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C9A84C]" />}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-6 pt-5 border-t border-[#E8E2D9] text-center">
                <button onClick={() => setSelectedDate(null)} className={`${dmSans.className} text-xs font-600 text-[#8B9AA8] hover:text-[#1A2B3C] transition-colors`}>
                  Mostrar todos do mês
                </button>
              </div>
            )}
          </div>

          {/* Events list */}
          <div className="space-y-4">
            {filteredEventos.length === 0 ? (
              <div className="bg-[#F7F4EF] rounded-2xl p-16 text-center border border-[#E8E2D9] flex flex-col items-center min-h-[300px] justify-center">
                <CalendarDays className="w-12 h-12 text-[#C9A84C]/40 mb-5" />
                <h4 className={`${playfair.className} text-2xl font-700 text-[#1A2B3C]`}>Nenhum evento agendado</h4>
                <p className={`${dmSans.className} text-[#8B9AA8] mt-2`}>Não há eventos marcados para o período selecionado.</p>
              </div>
            ) : (
              filteredEventos.map((evento) => {
                const evDate = new Date(evento.data + 'T00:00:00');
                const dia = String(evDate.getDate()).padStart(2, '0');
                const mes = monthNames[evDate.getMonth()].slice(0, 3).toUpperCase();
                return (
                  <div key={evento.id} className="group bg-white rounded-2xl border border-[#E8E2D9] hover:border-[#C9A84C]/40 hover:shadow-xl transition-all duration-300 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="shrink-0 w-20 h-20 rounded-xl bg-[#F7F4EF] border border-[#E8E2D9] flex flex-col items-center justify-center">
                      <span className={`${playfair.className} text-3xl font-800 text-[#1A2B3C] leading-none`}>{dia}</span>
                      <span className={`${dmSans.className} text-[9px] font-700 uppercase tracking-widest text-[#C9A84C] mt-1`}>{mes}</span>
                    </div>

                    {evento.imagem_url && (
                      <div className="hidden sm:block w-28 h-20 shrink-0 rounded-xl overflow-hidden relative">
                        <Image src={evento.imagem_url} alt={evento.titulo} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}

                    <div className="flex-1">
                      <span className={`${dmSans.className} inline-block px-3 py-1 bg-[#C9A84C]/10 text-[#C9A84C] rounded-full text-[10px] font-700 uppercase tracking-widest mb-2`}>
                        {evento.categoria || 'Evento'}
                      </span>
                      <h4 className={`${playfair.className} text-xl font-700 text-[#1A2B3C] line-clamp-1`}>{evento.titulo}</h4>
                      <div className={`${dmSans.className} flex items-center gap-2 mt-1.5 text-xs text-[#8B9AA8] font-500`}>
                        <MapPin size={12} className="text-[#C9A84C] shrink-0" />
                        <span className="line-clamp-1">{evento.local}</span>
                      </div>
                    </div>

                    <div className="shrink-0 mt-2 sm:mt-0 w-full sm:w-auto">
                      <Link href={`/eventos/${evento.id}`}
                        className={`${dmSans.className} flex items-center justify-center gap-2 w-full bg-[#1A2B3C] hover:bg-[#C9A84C] text-white hover:text-[#1A2B3C] px-6 py-3 rounded-xl font-600 text-sm transition-colors`}
                      >
                        <Ticket size={15} /> Detalhes
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
// COMPONENTE: HOTÉIS
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
    <section id="hoteis" className="py-24 md:py-32 bg-[#F7F4EF] relative">
      <div className="absolute -top-px left-0 right-0 h-px bg-[#E8E2D9]" />
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <span className={`${dmSans.className} text-xs font-600 uppercase tracking-[0.25em] text-[#C9A84C]`}>Onde ficar</span>
            </div>
            <h2 className={`${playfair.className} text-4xl md:text-6xl font-800 text-[#1A2B3C] leading-tight`}>
              Hotéis &amp; <em className="italic">Hospedagens</em>
            </h2>
          </div>
          <Link href="/hoteis" className={`${dmSans.className} inline-flex items-center gap-2 text-sm font-600 text-[#1A2B3C] border-b border-[#1A2B3C]/30 pb-0.5 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all group`}>
            Ver todas as hospedagens <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-[#C9A84C]"><Loader2 className="animate-spin w-8 h-8" /></div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {hoteis.map((hotel) => (
              <article key={hotel.id} className="group overflow-hidden rounded-2xl bg-white border border-[#E8E2D9] hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col">
                <div className="relative h-52 w-full bg-[#E8E2D9] overflow-hidden">
                  {hotel.imagem_url ? (
                    <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><Hotel className="h-12 w-12 text-[#8B9AA8]" /></div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full flex gap-0.5">
                    {Array.from({ length: hotel.estrelas }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-[#C9A84C] text-[#C9A84C]" />
                    ))}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <span className={`${dmSans.className} text-[10px] font-700 uppercase tracking-widest text-[#8B9AA8] mb-3`}>{hotel.tipo}</span>
                  <h3 className={`${playfair.className} text-2xl font-700 text-[#1A2B3C] mb-3`}>{hotel.nome}</h3>
                  <p className={`${dmSans.className} text-sm text-[#4A5568] leading-relaxed flex-1 line-clamp-3`}>{hotel.descricao}</p>
                  <div className="mt-6 pt-5 border-t border-[#E8E2D9]">
                    <Link href={`/hoteis/${hotel.id}`} className={`${dmSans.className} inline-flex items-center gap-2 text-sm font-600 text-[#C9A84C] hover:gap-3 transition-all`}>
                      Ver detalhes <ArrowRight size={14} />
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
// SECCAO PACOTES
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
    <section id="pacotes" className="py-24 md:py-32 bg-white relative">
      <div className="absolute -top-px left-0 right-0 h-px bg-[#E8E2D9]" />
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <span className={`${dmSans.className} text-xs font-600 uppercase tracking-[0.25em] text-[#C9A84C]`}>Experiência Completa</span>
            </div>
            <h2 className={`${playfair.className} text-4xl md:text-6xl font-800 text-[#1A2B3C] leading-tight`}>
              Pacotes <em className="italic text-[#C9A84C]">Turísticos</em>
            </h2>
            <p className={`${dmSans.className} mt-4 text-[#4A5568] text-lg`}>Roteiros planejados para você aproveitar o melhor do Araguaia.</p>
          </div>
          <Link href="/pacotes" className={`${dmSans.className} inline-flex items-center gap-2 text-sm font-600 text-[#1A2B3C] border-b border-[#1A2B3C]/30 pb-0.5 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all group`}>
            Ver todos os pacotes <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-[#C9A84C]"><Loader2 className="animate-spin w-8 h-8" /></div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {pacotes.map((pacote) => (
              <article key={pacote.id} className="group overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col">
                <div className="relative h-52 w-full overflow-hidden bg-[#E8E2D9]">
                  <Image
                    src={pacote.imagem_principal || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'}
                    alt={pacote.titulo} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-[#C9A84C] text-[#1A2B3C] px-3 py-1 rounded-full text-[10px] font-700 uppercase tracking-widest">
                    Destaque
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className={`${dmSans.className} flex items-center gap-2 mb-3`}>
                    <CheckCircle2 size={13} className="text-[#C9A84C]" />
                    <span className="text-[10px] font-700 uppercase text-[#8B9AA8] tracking-widest">Reserva Imediata</span>
                  </div>
                  <h3 className={`${playfair.className} text-2xl font-700 text-[#1A2B3C] mb-3 line-clamp-1`}>{pacote.titulo}</h3>
                  <p className={`${dmSans.className} text-sm text-[#4A5568] leading-relaxed flex-1 line-clamp-3 mb-6`}>
                    {pacote.descricao_curta || 'Conheça os encantos naturais e culturais deste roteiro exclusivo em São Geraldo do Araguaia.'}
                  </p>
                  <div className="mt-auto pt-5 border-t border-[#E8E2D9] flex items-center justify-between">
                    <div>
                      <p className={`${dmSans.className} text-[9px] font-700 text-[#8B9AA8] uppercase tracking-widest mb-0.5`}>A partir de</p>
                      <p className={`${playfair.className} text-2xl font-800 text-[#1A2B3C]`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(pacote.preco || 150))}
                      </p>
                    </div>
                    <Link href={`/pacotes/${pacote.id}`}
                      className="w-10 h-10 rounded-xl bg-[#1A2B3C] hover:bg-[#C9A84C] text-white flex items-center justify-center transition-colors group-hover:translate-x-0.5 transition-transform"
                    >
                      <ArrowRight size={16} />
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
// SECCAO PASSEIOS
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
    const [, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}`;
  };

  return (
    <section id="passeios" className="py-24 md:py-32 bg-[#F7F4EF] relative">
      <div className="absolute -top-px left-0 right-0 h-px bg-[#E8E2D9]" />
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <span className={`${dmSans.className} text-xs font-600 uppercase tracking-[0.25em] text-[#C9A84C]`}>Bate e Volta</span>
            </div>
            <h2 className={`${playfair.className} text-4xl md:text-6xl font-800 text-[#1A2B3C] leading-tight`}>
              Passeios de <em className="italic">Fim de Semana</em>
            </h2>
            <p className={`${dmSans.className} mt-4 text-[#4A5568] text-lg max-w-xl`}>Trilhas, banhos e cultura com guias locais credenciados.</p>
          </div>
          <Link href="/passeios" className={`${dmSans.className} inline-flex items-center gap-2 text-sm font-600 text-[#1A2B3C] border-b border-[#1A2B3C]/30 pb-0.5 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all group`}>
            Ver agenda completa <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-[#C9A84C]"><Loader2 className="animate-spin w-8 h-8" /></div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {passeios.map((passeio) => (
              <article key={passeio.id} className="group overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col">
                <div className="relative h-52 w-full overflow-hidden bg-[#E8E2D9]">
                  <Image
                    src={passeio.imagem_principal || 'https://images.unsplash.com/photo-1551632811-561732d1e306'}
                    alt={passeio.titulo} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-700 uppercase text-[#1A2B3C] shadow-sm flex items-center gap-1.5">
                    <CalendarDays size={11} className="text-[#C9A84C]" />
                    <span className={dmSans.className}>{formatarDataSimples(passeio.data_passeio)}</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className={`${dmSans.className} flex items-center gap-2 mb-3`}>
                    <Compass size={13} className="text-[#C9A84C]" />
                    <span className="text-[10px] font-700 uppercase text-[#8B9AA8] tracking-widest">Guia: {passeio.nome_guia || 'Local'}</span>
                  </div>
                  <h3 className={`${playfair.className} text-2xl font-700 text-[#1A2B3C] mb-3 line-clamp-1`}>{passeio.titulo}</h3>
                  <p className={`${dmSans.className} text-sm text-[#4A5568] leading-relaxed flex-1 line-clamp-3 mb-6`}>{passeio.descricao_curta}</p>
                  <div className="mt-auto pt-5 border-t border-[#E8E2D9] flex items-center justify-between">
                    <div>
                      <p className={`${dmSans.className} text-[9px] font-700 text-[#8B9AA8] uppercase tracking-widest mb-0.5`}>Valor por pessoa</p>
                      <p className={`${playfair.className} text-2xl font-800 text-[#1A2B3C]`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(passeio.valor_total || 0))}
                      </p>
                    </div>
                    <Link href={`/passeios/${passeio.id}`}
                      className="w-10 h-10 rounded-xl bg-[#1A2B3C] hover:bg-[#C9A84C] text-white flex items-center justify-center transition-colors"
                    >
                      <ArrowRight size={16} />
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
// COMPONENTE PRINCIPAL
// ==========================================
export default function HomePage() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (y < 80) setShowHeader(true);
      else if (y > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(y);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <main className={`${dmSans.className} bg-white text-[#1A2B3C]`}>

      {/* ===== HEADER ===== */}
      <header className={`fixed left-0 top-0 z-50 w-full transition-all duration-400 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${scrolled ? 'bg-white/97 backdrop-blur-xl border-b border-[#E8E2D9] shadow-sm' : 'bg-transparent'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-4">
            <div className="relative h-11 w-32 md:h-13 md:w-44">
              <Image src="/logop.png" alt="Prefeitura de São Geraldo do Araguaia" fill priority className="object-contain object-left" />
            </div>
            <div className={`hidden border-l border-[#E8E2D9] pl-4 lg:block ${scrolled ? '' : 'border-white/20'}`}>
              <p className={`${playfair.className} text-xl font-700 leading-none ${scrolled ? 'text-[#1A2B3C]' : 'text-white'}`}>SagaTurismo</p>
              <p className={`${dmSans.className} mt-0.5 text-[10px] font-600 uppercase tracking-[0.2em] ${scrolled ? 'text-[#8B9AA8]' : 'text-white/60'}`}>Secretaria de Turismo</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {[
              { href: '/hoteis', label: 'Hotéis' },
              { href: '/pacotes', label: 'Pacotes' },
              { href: '/passeios', label: 'Passeios' },
              { href: '/aldeias', label: 'Aldeias' },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className={`text-sm font-500 transition-colors ${scrolled ? 'text-[#4A5568] hover:text-[#1A2B3C]' : 'text-white/80 hover:text-white'}`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/parceiros" className="rounded-full border border-[#C9A84C] text-[#C9A84C] px-5 py-2.5 text-sm font-600 hover:bg-[#C9A84C] hover:text-[#1A2B3C] transition-all">
              Anuncie aqui
            </Link>
            <Link href="/cadastro" className="rounded-full bg-[#C9A84C] text-[#1A2B3C] px-5 py-2.5 text-sm font-700 hover:bg-[#B8963E] transition-all shadow-sm">
              Cartão Residente
            </Link>
          </nav>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`rounded-xl border p-2.5 md:hidden transition-colors ${scrolled ? 'border-[#E8E2D9] text-[#1A2B3C] bg-white' : 'border-white/20 text-white bg-white/10'}`}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-[#E8E2D9] p-6 flex flex-col gap-4 shadow-2xl md:hidden">
            {[
              { href: '/roteiro', label: 'Rota Turística' },
              { href: '/pacotes', label: 'Pacotes' },
              { href: '/passeios', label: 'Passeios' },
              { href: '/aldeias', label: 'Aldeias' },
              { href: '/hoteis', label: 'Hospedagem' },
            ].map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                className={`${playfair.className} text-xl font-700 text-[#1A2B3C] border-b border-[#E8E2D9] pb-3`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#C9A84C] text-[#1A2B3C] font-700 px-5 py-4 rounded-xl text-center mt-2 text-sm">
              Cartão Residente
            </Link>
            <Link href="/parceiros" onClick={() => setIsMobileMenuOpen(false)} className="border border-[#1A2B3C] text-[#1A2B3C] font-600 px-5 py-4 rounded-xl text-center text-sm">
              Torne-se um parceiro
            </Link>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-end pb-20 md:pb-28 overflow-hidden bg-[#0D1B2A]">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1442850473887-0fb77cd0b337?q=80&w=1740&auto=format&fit=crop"
            alt="São Geraldo do Araguaia" fill priority
            className="object-cover opacity-50"
          />
          {/* Layered gradients for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B2A]/90 via-[#0D1B2A]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-transparent to-[#0D1B2A]/20" />
        </div>

        {/* Decorative gold line */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-[#C9A84C]/60 to-transparent z-10" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8 w-full">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <span className={`${dmSans.className} text-xs font-600 uppercase tracking-[0.3em] text-[#C9A84C]`}>
                Portal Oficial de Turismo · SEMTUR
              </span>
            </div>
            <h1 className={`${playfair.className} text-5xl sm:text-6xl md:text-8xl font-900 text-white leading-[1.05] mb-6`}>
              Descubra a<br />
              <em className="italic text-[#C9A84C]">alma do</em><br />
              Araguaia.
            </h1>
            <p className={`${dmSans.className} text-lg md:text-xl text-white/70 font-400 max-w-xl mb-10 leading-relaxed`}>
              Rios, serras, trilhas e paisagens inesquecíveis. Viva experiências únicas com a segurança da Prefeitura Municipal.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link href="/roteiro"
                className={`${dmSans.className} inline-flex items-center gap-3 bg-[#C9A84C] hover:bg-[#B8963E] text-[#1A2B3C] px-8 py-4 rounded-xl font-700 text-sm uppercase tracking-widest transition-all hover:-translate-y-0.5 shadow-xl`}
              >
                Explorar Roteiros <ArrowRight size={16} />
              </Link>
              <Link href="/cadastro"
                className={`${dmSans.className} inline-flex items-center gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-600 text-sm uppercase tracking-widest transition-all hover:-translate-y-0.5`}
              >
                Cartão Residente
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 md:mt-20 grid grid-cols-3 gap-4 md:gap-0 md:flex md:items-center md:gap-12 border-t border-white/10 pt-8">
            {[
              { label: 'Anos de turismo', value: '15+' },
              { label: 'Visitantes por ano', value: '50k+' },
              { label: 'Passeios credenciados', value: '30+' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className={`${playfair.className} text-3xl md:text-4xl font-800 text-[#C9A84C]`}>{stat.value}</p>
                <p className={`${dmSans.className} text-xs text-white/50 font-400 mt-1`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ROTA TURÍSTICA ===== */}
      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-2 md:items-center">
          {/* Image with floating badge */}
          <div className="relative">
            <div className="relative min-h-[400px] md:min-h-[520px] overflow-hidden rounded-2xl shadow-2xl">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.pexels.com/photos/31780330/pexels-photo-31780330.jpeg?_gl=1*139yaog*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc1NjYxODMkbzI4JGcxJHQxNzc3NTY3MjY2JGoyMCRsMCRoMA..')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A]/50 via-transparent to-transparent" />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -right-6 bg-[#C9A84C] rounded-2xl p-6 shadow-2xl max-w-[180px]">
              <Award className="w-6 h-6 text-[#1A2B3C] mb-2" />
              <p className={`${playfair.className} text-lg font-800 text-[#1A2B3C] leading-tight`}>Destino Certificado</p>
              <p className={`${dmSans.className} text-xs text-[#1A2B3C]/70 mt-1`}>Ecoturismo responsável</p>
            </div>
          </div>

          <div className="pl-0 md:pl-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <span className={`${dmSans.className} text-xs font-600 uppercase tracking-[0.25em] text-[#C9A84C]`}>Conheça nossa rota</span>
            </div>
            <h2 className={`${playfair.className} text-4xl md:text-5xl font-800 text-[#1A2B3C] leading-tight`}>
              Um roteiro para descobrir o melhor da cidade.
            </h2>
            <p className={`${dmSans.className} mt-6 text-[#4A5568] text-lg leading-relaxed`}>
              Reunimos paisagens naturais, cultura local, pontos de visitação e experiências para quem deseja conhecer São Geraldo do Araguaia com mais direção e propósito.
            </p>

            {/* Feature list */}
            <div className="mt-8 space-y-3">
              {['Roteiros com guias locais credenciados', 'Pontos de parada mapeados e sinalizados', 'Experiências para toda a família'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#C9A84C]/15 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={12} className="text-[#C9A84C]" />
                  </div>
                  <span className={`${dmSans.className} text-sm text-[#4A5568]`}>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/roteiro"
                className={`${dmSans.className} inline-flex items-center justify-center gap-3 rounded-xl bg-[#1A2B3C] hover:bg-[#243B52] px-8 py-4 font-700 text-white text-sm transition-all hover:-translate-y-0.5 shadow-lg`}
              >
                Explorar rota turística <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#eventos"
                className={`${dmSans.className} inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8E2D9] px-8 py-4 font-600 text-[#1A2B3C] text-sm transition hover:border-[#C9A84C] hover:text-[#C9A84C]`}
              >
                Ver Agenda Cultural
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DYNAMIC SECTIONS ===== */}
      <AgendaCultural />
      <DestaquesVerao />
      <GaleriaVerao />
      <SeccaoHoteis />
      <SeccaoPacotes />
      <SeccaoPasseios />

      {/* ===== ALDEIAS INDÍGENAS ===== */}
      <section className="bg-white py-24 md:py-32 relative">
        <div className="absolute -top-px left-0 right-0 h-px bg-[#E8E2D9]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-2 md:items-center">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <span className={`${dmSans.className} text-xs font-600 uppercase tracking-[0.25em] text-[#C9A84C]`}>Patrimônio Vivo</span>
            </div>
            <h2 className={`${playfair.className} text-4xl md:text-5xl font-800 text-[#1A2B3C] leading-tight`}>
              Povos Originários e a nossa verdadeira raiz.
            </h2>
            <p className={`${dmSans.className} mt-6 text-[#4A5568] text-lg leading-relaxed`}>
              O município de São Geraldo do Araguaia orgulha-se de ser o lar de diversas comunidades indígenas. Guardiões da floresta, dos rios e de saberes milenares, estes povos mantêm viva uma rica herança cultural de rituais, artesanato e conexão profunda com a natureza amazónica.
            </p>
            <Link href="/aldeias"
              className={`${dmSans.className} mt-8 inline-flex items-center gap-3 rounded-xl bg-[#1A2B3C] hover:bg-[#243B52] px-8 py-4 font-700 text-white text-sm transition-all hover:-translate-y-0.5 shadow-lg`}
            >
              Conhecer as Aldeias <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative min-h-[400px] overflow-hidden rounded-2xl shadow-2xl group">
            <Image src="https://images.pexels.com/photos/12434691/pexels-photo-12434691.jpeg" alt="Aldeias Indígenas" fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A]/70 via-transparent to-transparent" />
            <div className="absolute bottom-7 left-7 right-7">
              <div className="flex items-center gap-2 mb-2">
                <Leaf size={14} className="text-[#C9A84C]" />
                <span className={`${dmSans.className} text-xs font-600 uppercase tracking-widest text-[#C9A84C]`}>Ecoturismo Sustentável</span>
              </div>
              <p className={`${playfair.className} text-white text-2xl font-700`}>Cultura, respeito e ancestralidade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HISTÓRIA ===== */}
      <section id="historia" className="bg-[#F7F4EF] py-24 md:py-32 relative">
        <div className="absolute -top-px left-0 right-0 h-px bg-[#E8E2D9]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-2 md:items-center">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <span className={`${dmSans.className} text-xs font-600 uppercase tracking-[0.25em] text-[#C9A84C]`}>História da cidade</span>
            </div>
            <h2 className={`${playfair.className} text-4xl md:text-5xl font-800 text-[#1A2B3C] leading-tight`}>
              Uma cidade moldada pelo rio, pela serra e pelo seu povo.
            </h2>
            <p className={`${dmSans.className} mt-6 text-[#4A5568] text-lg leading-relaxed`}>
              São Geraldo do Araguaia é uma cidade marcada pela relação com o Rio Araguaia, pela força da natureza e pela identidade de seu povo. Entre paisagens naturais, tradições locais e histórias de desenvolvimento, o município se tornou uma porta de entrada para experiências ligadas ao ecoturismo, à cultura regional e à vida às margens do Araguaia.
            </p>
            <Link href="/historia"
              className={`${dmSans.className} mt-8 inline-flex items-center gap-3 rounded-xl bg-[#C9A84C] hover:bg-[#B8963E] text-[#1A2B3C] px-8 py-4 font-700 text-sm transition-all hover:-translate-y-0.5 shadow-md`}
            >
              História Completa <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl bg-[#1A2B3C] p-10 md:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#C9A84C]/10 blur-2xl" />
            <Landmark className="mb-8 h-10 w-10 text-[#C9A84C]" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-px bg-[#C9A84C]" />
              <span className={`${dmSans.className} text-xs font-600 uppercase tracking-[0.25em] text-[#C9A84C]`}>Patrimônio local</span>
            </div>
            <h3 className={`${playfair.className} text-3xl md:text-4xl font-800 text-white leading-tight`}>
              Turismo que valoriza a identidade araguaiense.
            </h3>
            <p className={`${dmSans.className} mt-5 text-white/60 text-base leading-relaxed`}>
              Mais do que visitar lugares, o turismo local também fortalece memórias, histórias, economia e orgulho de pertencimento.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CARTÃO RESIDENTE ===== */}
      <section className="bg-[#1A2B3C] py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#C9A84C]/5 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-px bg-[#C9A84C]" />
                <span className={`${dmSans.className} text-xs font-600 uppercase tracking-[0.25em] text-[#C9A84C]`}>Exclusivo para residentes</span>
              </div>
              <h2 className={`${playfair.className} text-4xl md:text-6xl font-800 text-white leading-tight`}>
                Mora aqui?<br />
                <em className="italic text-[#C9A84C]">O parque também é seu.</em>
              </h2>
              <p className={`${dmSans.className} mt-6 max-w-xl text-lg text-white/60 leading-relaxed`}>
                Residentes podem solicitar o cartão digital e garantir 50% de desconto na entrada do parque, de forma simples, rápida e segura.
              </p>
              <Link href="/cadastro"
                className={`${dmSans.className} mt-8 inline-flex items-center gap-3 rounded-xl bg-[#C9A84C] hover:bg-[#B8963E] text-[#1A2B3C] px-8 py-4 font-700 text-sm transition-all hover:-translate-y-0.5 shadow-xl`}
              >
                Solicitar meu cartão <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-10">
              <ShieldCheck className="mb-6 h-10 w-10 text-[#C9A84C]" />
              <p className={`${playfair.className} text-6xl md:text-7xl font-900 text-white`}>50%</p>
              <p className={`${playfair.className} mt-2 text-xl font-600 text-white`}>de desconto para residentes</p>
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className={`${dmSans.className} text-sm text-white/40 leading-relaxed`}>
                  Benefício digital vinculado ao cadastro do morador. Válido para entrada no Parque da Serra das Andorinhas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#0D1B2A] text-white">
        {/* Top bar */}
        <div className="border-b border-white/5">
          <div className="mx-auto max-w-7xl px-5 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#C9A84C]" />
              <span className={`${dmSans.className} text-xs text-white/40 font-500`}>Portal Oficial — Secretaria Municipal de Turismo de São Geraldo do Araguaia</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="tel:+5594981452067" className="flex items-center gap-2 text-white/40 hover:text-[#C9A84C] transition-colors">
                <Phone size={13} />
                <span className={`${dmSans.className} text-xs`}>(94) 98145-2067</span>
              </a>
              <a href="mailto:setursaga@gmail.com" className="flex items-center gap-2 text-white/40 hover:text-[#C9A84C] transition-colors">
                <Mail size={13} />
                <span className={`${dmSans.className} text-xs`}>setursaga@gmail.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Main footer */}
        <div className="mx-auto max-w-7xl px-5 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <img src="/logop.png" alt="Prefeitura SGA" className="h-14 object-contain opacity-80" />
            <p className={`${playfair.className} text-lg font-600 text-white/80 italic leading-snug`}>
              "Cidade Amada,<br />seguindo em frente"
            </p>
            <p className={`${dmSans.className} text-xs text-white/30 leading-relaxed`}>São Geraldo do Araguaia · Pará · Brasil</p>
          </div>

          <div className="space-y-5">
            <h5 className={`${dmSans.className} text-[10px] font-700 uppercase tracking-[0.25em] text-[#C9A84C]`}>Gestão Executiva</h5>
            <ul className={`${dmSans.className} text-sm text-white/40 space-y-3`}>
              <li>Prefeito<br /><span className="text-white/70 font-600">Jefferson Douglas de Jesus Oliveira</span></li>
              <li>Vice-Prefeito<br /><span className="text-white/70 font-600">Marcos Antônio Candido de Lucena</span></li>
            </ul>
          </div>

          <div className="space-y-5">
            <h5 className={`${dmSans.className} text-[10px] font-700 uppercase tracking-[0.25em] text-[#C9A84C]`}>Turismo (SEMTUR)</h5>
            <ul className={`${dmSans.className} text-sm text-white/40 space-y-3`}>
              <li>Secretária<br /><span className="text-white/70 font-600">Micheli Stephany de Souza</span></li>
              <li>Contato<br /><span className="text-white/70 font-600">(94) 98145-2067</span></li>
              <li>E-mail<br /><span className="text-white/70 font-600">setursaga@gmail.com</span></li>
            </ul>
          </div>

          <div className="space-y-5">
            <h5 className={`${dmSans.className} text-[10px] font-700 uppercase tracking-[0.25em] text-[#C9A84C]`}>Equipe Técnica</h5>
            <ul className={`${dmSans.className} text-sm text-white/50 space-y-2`}>
              <li>Adriana da Luz Lima</li>
              <li>Carmelita Luz da Silva</li>
              <li>Diego Silva Costa</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5">
          <div className="mx-auto max-w-7xl px-5 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className={`${dmSans.className} text-[10px] text-white/20 uppercase tracking-[0.3em]`}>
              © 2026 Secretaria Municipal de Turismo · São Geraldo do Araguaia (PA)
            </p>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-[#C9A84C]" />
              <div className="w-1 h-1 rounded-full bg-[#C9A84C]/40" />
              <div className="w-1 h-1 rounded-full bg-[#C9A84C]/20" />
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}