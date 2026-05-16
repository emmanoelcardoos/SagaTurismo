'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
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
  Users,
  Award,
  TrendingUp,
  Heart,
  Search,
  Clock,
  Phone,
  Mail,
  Instagram,
  Facebook,
  ChevronDown,
  Play,
  Globe,
  Zap,
  Camera,
  Fish,
  Leaf,
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
// TRUST STATS BAR
// ==========================================
function TrustBar() {
  const stats = [
    { icon: Users, value: '12.000+', label: 'Visitantes por Ano' },
    { icon: Award, value: '4.9★', label: 'Avaliação Média' },
    { icon: ShieldCheck, value: '100%', label: 'Oficial & Seguro' },
    { icon: Heart, value: '95%', label: 'Voltariam Novamente' },
  ];
  return (
    <div className="bg-[#00577C] py-4 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/20">
        {stats.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 ${i > 0 ? 'md:pl-8' : ''} py-2 md:py-0`}>
            <s.icon size={20} className="text-[#F9C400] shrink-0" />
            <div>
              <p className={`${jakarta.className} text-white font-black text-base leading-none`}>{s.value}</p>
              <p className="text-white/60 text-[11px] font-medium mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// SKELETON LOADER
// ==========================================
function SkeletonCard() {
  return (
    <div className="rounded-[2rem] overflow-hidden border border-slate-100 bg-white shadow-sm animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="p-6 space-y-3">
        <div className="h-3 bg-slate-200 rounded w-1/3" />
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
      </div>
    </div>
  );
}

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
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${String(dataObj.getDate()).padStart(2,'0')} ${meses[dataObj.getMonth()]}`;
  };

  return (
    <section className="py-20 md:py-28 px-5 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#F9C400]/6 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#F9C400]/15 text-[#00577C] px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={13} /> Imperdível esta temporada
            </div>
            <h2 className={`${jakarta.className} text-4xl sm:text-5xl md:text-6xl font-black text-[#00577C] tracking-tight leading-[1.05]`}>
              Destaques<br />Verão 2026
            </h2>
            <p className="mt-4 text-slate-500 text-lg max-w-lg">Os eventos mais aguardados da temporada nas praias do Araguaia.</p>
          </div>
          <Link href="/#eventos" className="group inline-flex items-center gap-2 font-bold text-[#00577C] bg-slate-50 hover:bg-[#00577C] hover:text-white px-6 py-3 rounded-full transition-all text-sm border border-slate-200">
            Ver agenda completa <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {destaques.map((evento, idx) => (
              <Link key={evento.id} href={`/eventos/${evento.id}`}
                className={`group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-slate-900 ${idx === 0 ? 'md:row-span-2 min-h-[560px]' : 'min-h-[260px]'}`}>
                {evento.imagem_url ? (
                  <Image src={evento.imagem_url} alt={evento.titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-75 group-hover:opacity-90" />
                ) : (
                  <div className="w-full h-full bg-[#00577C] flex items-center justify-center"><CalendarDays className="text-white/30 w-20 h-20" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    {evento.categoria || 'Evento'}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-white leading-tight mb-2 line-clamp-2`}>{evento.titulo}</h3>
                  <p className="text-white/70 font-semibold flex items-center gap-2 text-sm">
                    <CalendarDays size={14} className="text-[#F9C400]" /> {formatarData(evento.data)}
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
// COMPONENTE: TESTIMONIALS
// ==========================================
function Testimonials() {
  const items = [
    { name: 'Ana Ribeiro', city: 'Belém, PA', stars: 5, text: 'Uma experiência incrível! A Serra das Andorinhas ao entardecer é algo que não se esquece. A organização foi perfeita e o guia foi excelente.' },
    { name: 'Carlos Mendes', city: 'Goiânia, GO', stars: 5, text: 'Fizemos um pacote completo com hotel e passeios. Tudo funcionou como prometido. A plataforma é super fácil de usar e o atendimento é humano.' },
    { name: 'Mariana Costa', city: 'São Paulo, SP', stars: 5, text: 'Lugar lindo demais! O Rio Araguaia é de outro mundo. Voltarei com certeza. Recomendo o cartão do residente para quem mora aqui.' },
  ];
  return (
    <section className="py-20 md:py-28 bg-[#00577C] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
      </div>
      <div className="mx-auto max-w-7xl px-5 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
            <Star size={13} className="fill-[#F9C400] text-[#F9C400]" /> Avaliações reais de visitantes
          </div>
          <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-white`}>O que os visitantes dizem</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((t, i) => (
            <div key={i} className="bg-white/10 backdrop-blur border border-white/15 rounded-3xl p-7 hover:bg-white/15 transition-all">
              <div className="flex gap-1 mb-4">
                {[...Array(t.stars)].map((_, j) => <Star key={j} size={14} className="fill-[#F9C400] text-[#F9C400]" />)}
              </div>
              <p className="text-white/85 text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F9C400] flex items-center justify-center text-[#00577C] font-black text-sm">{t.name[0]}</div>
                <div>
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-white/50 text-xs">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
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
      const { data } = await supabase.from('galeria').select('id, imagem_url, titulo').eq('ano', '2025').limit(5);
      if (data) setFotos(data);
      setLoading(false);
    }
    fetchGaleria();
  }, []);

  return (
    <section className="py-20 md:py-28 bg-slate-950 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 mb-10 md:mb-14 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
            <Camera size={13} /> Memórias
          </div>
          <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black text-white tracking-tight leading-tight`}>
            Galeria<br /><span className="text-[#F9C400]">Verão 2025</span>
          </h2>
        </div>
        <Link href="/galeria" className="group inline-flex items-center gap-2 font-bold text-white/80 hover:text-white border border-white/20 hover:border-white/50 px-6 py-3 rounded-full transition-all text-sm">
          Ver galeria completa <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="px-5 flex gap-4 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => <div key={i} className="shrink-0 w-[260px] h-[350px] rounded-3xl bg-white/10 animate-pulse" />)}
        </div>
      ) : (
        <div className="px-5 w-full overflow-hidden">
          <div className="flex md:grid md:grid-cols-5 gap-3 overflow-x-auto snap-x snap-mandatory pb-6 md:pb-0">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative shrink-0 w-[260px] md:w-full h-[380px] md:h-[420px] rounded-2xl overflow-hidden group snap-center cursor-pointer">
                <Image src={foto.imagem_url} alt={foto.titulo || 'Foto'} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-5 left-5 right-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-white font-bold text-sm line-clamp-2">{foto.titulo}</p>
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
  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const filteredEventos = eventos.filter(ev => {
    const evDate = new Date(ev.data + 'T00:00:00');
    if (selectedDate) return evDate.toDateString() === selectedDate.toDateString();
    return evDate.getMonth() === currentDate.getMonth() && evDate.getFullYear() === currentDate.getFullYear();
  });

  return (
    <section id="eventos" className="py-20 md:py-28 px-5 bg-slate-50 relative overflow-hidden border-y border-slate-200">
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="mb-12 md:mb-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#009640]/10 text-[#009640] px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
            <CalendarDays size={13} /> Agenda da Cidade Amada
          </div>
          <h2 className={`${jakarta.className} text-4xl sm:text-5xl md:text-6xl font-black text-[#00577C] tracking-tight leading-tight`}>
            Calendário Cultural
          </h2>
          <p className="mt-4 max-w-2xl text-slate-500 text-lg">
            Festividades, eventos esportivos e passeios ecológicos de São Geraldo do Araguaia.
          </p>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-8 md:gap-10 items-start">
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200 sticky top-24">
            <div className="flex items-center justify-between mb-8">
              <button onClick={prevMonth} className="w-9 h-9 bg-slate-50 rounded-xl hover:bg-slate-100 text-[#00577C] transition flex items-center justify-center border border-slate-200">
                <ChevronLeft size={18}/>
              </button>
              <h3 className={`${jakarta.className} text-lg font-bold text-slate-800`}>
                {monthNames[currentDate.getMonth()]} <span className="text-[#F9C400]">{currentDate.getFullYear()}</span>
              </h3>
              <button onClick={nextMonth} className="w-9 h-9 bg-slate-50 rounded-xl hover:bg-slate-100 text-[#00577C] transition flex items-center justify-center border border-slate-200">
                <ChevronRight size={18}/>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-3 text-center">
              {['D','S','T','Q','Q','S','S'].map((dia, i) => (
                <span key={i} className="text-[10px] font-black text-slate-400 py-1">{dia}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="p-2" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateOfThisCell = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const hasEvent = eventos.some(ev => new Date(ev.data + 'T00:00:00').toDateString() === dateOfThisCell.toDateString());
                const isSelected = selectedDate?.toDateString() === dateOfThisCell.toDateString();
                return (
                  <button key={day} onClick={() => setSelectedDate(isSelected ? null : dateOfThisCell)}
                    className={`relative w-9 h-9 mx-auto rounded-xl flex items-center justify-center text-xs font-bold transition-all
                      ${isSelected ? 'bg-[#00577C] text-white shadow-md' : 'hover:bg-slate-100 text-slate-700'}
                      ${hasEvent && !isSelected ? 'ring-2 ring-[#F9C400] bg-[#FFF8DC] text-[#00577C]' : ''}`}>
                    {day}
                    {hasEvent && !isSelected && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#F9C400]" />}
                  </button>
                );
              })}
            </div>
            {selectedDate && (
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <button onClick={() => setSelectedDate(null)} className="text-xs font-bold text-slate-400 hover:text-[#00577C] transition flex items-center gap-1 mx-auto">
                  <X size={12} /> Mostrar todos do mês
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {filteredEventos.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 flex flex-col items-center justify-center min-h-[300px]">
                <CalendarDays className="w-12 h-12 text-slate-200 mb-4" />
                <h4 className={`${jakarta.className} text-xl font-bold text-slate-400`}>Nenhum evento agendado</h4>
                <p className="text-slate-400 mt-2 text-sm">Não há eventos para o período selecionado.</p>
              </div>
            ) : (
              filteredEventos.map((evento) => {
                const evDate = new Date(evento.data + 'T00:00:00');
                const dia = String(evDate.getDate()).padStart(2, '0');
                const mes = monthNames[evDate.getMonth()].slice(0, 3);
                return (
                  <div key={evento.id} className="group bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-[#00577C]/30 transition-all">
                    <div className="shrink-0 w-20 h-20 rounded-2xl bg-[#00577C]/5 flex flex-col items-center justify-center text-[#00577C] border border-[#00577C]/10">
                      <span className="text-2xl font-black leading-none">{dia}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5">{mes}</span>
                    </div>
                    {evento.imagem_url && (
                      <div className="hidden sm:block w-28 h-20 shrink-0 rounded-xl overflow-hidden relative">
                        <Image src={evento.imagem_url} alt={evento.titulo} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <span className="inline-block px-3 py-1 bg-[#F9C400]/20 text-[#00577C] rounded-md text-[9px] font-black uppercase tracking-wider mb-2">
                        {evento.categoria || 'Evento'}
                      </span>
                      <h4 className={`${jakarta.className} text-lg font-bold text-slate-900 line-clamp-1`}>{evento.titulo}</h4>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                        <MapPin size={12} className="text-[#009640] shrink-0" />
                        <span className="line-clamp-1">{evento.local}</span>
                      </div>
                    </div>
                    <div className="shrink-0 w-full sm:w-auto">
                      <Link href={`/eventos/${evento.id}`} className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-[#00577C] text-[#00577C] hover:text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all border border-slate-200 hover:border-[#00577C]">
                        <Ticket size={14} /> Detalhes
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
      const { data } = await supabase.from('hoteis').select('*').order('estrelas', { ascending: false }).limit(3);
      if (data) setHoteis(data);
      setLoading(false);
    }
    fetchHoteis();
  }, []);

  return (
    <section id="hoteis" className="bg-white py-20 md:py-28 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#009640]/10 text-[#009640] px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
              <Hotel size={13} /> Onde ficar
            </div>
            <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black text-slate-950 tracking-tight leading-tight`}>
              Hospedagens<br />selecionadas
            </h2>
          </div>
          <Link href="/hoteis" className="group inline-flex items-center gap-2 font-bold text-[#00577C] border border-slate-200 hover:border-[#00577C] hover:bg-[#00577C] hover:text-white px-6 py-3 rounded-full transition-all text-sm">
            Ver todos <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {hoteis.map((hotel) => (
              <article key={hotel.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col">
                <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
                  {hotel.imagem_url ? (
                    <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Hotel className="h-12 w-12 text-slate-300" /></div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-600 shadow-sm">
                    {hotel.tipo}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: hotel.estrelas }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-[#F9C400] text-[#F9C400]" />
                    ))}
                    <span className="text-xs text-slate-400 ml-1 font-medium">({hotel.estrelas}.0)</span>
                  </div>
                  <h3 className={`${jakarta.className} text-xl font-bold text-slate-950 mb-2 line-clamp-1`}>{hotel.nome}</h3>
                  <p className="text-slate-500 flex-1 line-clamp-3 text-sm leading-relaxed">{hotel.descricao}</p>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <Link href={`/hoteis/${hotel.id}`} className="inline-flex items-center gap-2 font-bold text-sm text-[#00577C] hover:text-[#004766] transition-colors">
                      Ver detalhes <ArrowRight className="h-4 w-4" />
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
    <section id="pacotes" className="bg-slate-50 py-20 md:py-28 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#00577C]/10 text-[#00577C] px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
              <Route size={13} /> Experiência Completa
            </div>
            <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black text-slate-950 tracking-tight leading-tight`}>
              Pacotes<br />Turísticos
            </h2>
          </div>
          <Link href="/pacotes" className="group inline-flex items-center gap-2 font-bold text-[#00577C] border border-slate-200 hover:border-[#00577C] hover:bg-[#00577C] hover:text-white px-6 py-3 rounded-full transition-all text-sm">
            Ver todos <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {pacotes.map((pacote) => (
              <article key={pacote.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col h-full">
                <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
                  <Image src={pacote.imagem_principal || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'} alt={pacote.titulo} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                  <div className="absolute top-4 left-4 bg-[#F9C400] text-[#00577C] px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm">Destaque</div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={13} className="text-[#009640]"/>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Reserva Imediata</span>
                  </div>
                  <h3 className={`${jakarta.className} text-xl font-bold text-slate-950 mb-2 line-clamp-1`}>{pacote.titulo}</h3>
                  <p className="text-slate-500 flex-1 line-clamp-3 text-sm leading-relaxed">
                    {pacote.descricao_curta || 'Conheça os encantos naturais e culturais deste roteiro exclusivo em São Geraldo do Araguaia.'}
                  </p>
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">A partir de</p>
                      <p className={`${jakarta.className} text-xl font-black text-[#00577C]`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(pacote.preco || 150))}
                      </p>
                    </div>
                    <Link href={`/pacotes/${pacote.id}`} className="bg-[#00577C] hover:bg-[#004766] text-white p-3 rounded-xl transition-all">
                      <ArrowRight size={18} />
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
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}`;
  };

  return (
    <section id="passeios" className="bg-white py-20 md:py-28 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#009640]/10 text-[#009640] px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
              <Compass size={13} /> Bate e Volta
            </div>
            <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black text-slate-950 tracking-tight leading-tight`}>
              Passeios de<br />Fim de Semana
            </h2>
          </div>
          <Link href="/passeios" className="group inline-flex items-center gap-2 font-bold text-[#00577C] border border-slate-200 hover:border-[#00577C] hover:bg-[#00577C] hover:text-white px-6 py-3 rounded-full transition-all text-sm">
            Ver agenda <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {passeios.map((passeio) => (
              <article key={passeio.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col h-full">
                <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
                  <Image src={passeio.imagem_principal || 'https://images.unsplash.com/photo-1551632811-561732d1e306'} alt={passeio.titulo} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg text-[9px] font-black text-[#009640] shadow-sm flex items-center gap-1.5">
                    <CalendarDays size={11} /> {formatarDataSimples(passeio.data_passeio)}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Compass size={13} className="text-[#00577C]"/>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Guia: {passeio.nome_guia || 'Local'}</span>
                  </div>
                  <h3 className={`${jakarta.className} text-xl font-bold text-slate-950 mb-2 line-clamp-1`}>{passeio.titulo}</h3>
                  <p className="text-slate-500 flex-1 line-clamp-3 text-sm leading-relaxed">{passeio.descricao_curta}</p>
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Valor por pessoa</p>
                      <p className={`${jakarta.className} text-xl font-black text-[#009640]`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(passeio.valor_total || 0))}
                      </p>
                    </div>
                    <Link href={`/passeios/${passeio.id}`} className="bg-[#009640] hover:bg-[#007a34] text-white p-3 rounded-xl transition-all">
                      <ArrowRight size={18} />
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
// WHY US SECTION
// ==========================================
function WhyUs() {
  const benefits = [
    { icon: ShieldCheck, title: 'Portal Oficial', desc: 'Único canal autorizado pela Prefeitura Municipal. Informações verificadas e atualizadas.' },
    { icon: Award, title: 'Guias Credenciados', desc: 'Todos os passeios são operados por guias locais certificados pela SEMTUR.' },
    { icon: Zap, title: 'Reserva Imediata', desc: 'Confirmação instantânea para hotéis, passeios e pacotes. Sem filas ou espera.' },
    { icon: Heart, title: 'Suporte Local', desc: 'Equipe presencial em São Geraldo do Araguaia. Fale com quem conhece a região.' },
  ];
  return (
    <section className="py-20 md:py-28 bg-slate-50 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-[#00577C]/10 text-[#00577C] px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
            <Sparkles size={13} /> Por que escolher o SagaTurismo
          </div>
          <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-950`}>A plataforma mais confiável<br />do Araguaia</h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {benefits.map((b, i) => (
            <div key={i} className="bg-white rounded-3xl p-7 border border-slate-200 hover:border-[#00577C]/30 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#00577C]/10 flex items-center justify-center mb-5 group-hover:bg-[#00577C] transition-colors">
                <b.icon size={22} className="text-[#00577C] group-hover:text-white transition-colors" />
              </div>
              <h4 className={`${jakarta.className} text-lg font-bold text-slate-900 mb-2`}>{b.title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL: HOMEPAGE
// ==========================================
export default function HomePage() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
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
      <header className={`fixed left-0 top-0 z-50 w-full transition-all duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${scrolled ? 'bg-white/98 backdrop-blur-xl border-b border-slate-200 shadow-sm' : 'bg-transparent'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="relative h-10 w-28 sm:h-12 sm:w-36 md:h-14 md:w-48 shrink-0">
              <Image src="/logop.png" alt="Prefeitura de São Geraldo do Araguaia" fill priority className="object-contain object-left" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-xl font-bold leading-none ${scrolled ? 'text-[#00577C]' : 'text-white'}`}>SagaTurismo</p>
              <p className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${scrolled ? 'text-slate-400' : 'text-white/60'}`}>Secretaria de Turismo</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {[['Hotéis', '/hoteis'], ['Pacotes', '/pacotes'], ['Passeios', '/passeios'], ['Aldeias', '/aldeias']].map(([label, href]) => (
              <Link key={href} href={href} className={`text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-[#00577C]' : 'text-white/80 hover:text-white'}`}>{label}</Link>
            ))}
            <Link href="/parceiros" className="rounded-full border border-[#F9C400] bg-[#F9C400]/10 hover:bg-[#F9C400] text-[#F9C400] hover:text-[#00577C] px-5 py-2.5 text-sm font-bold transition-all">
              Seja Parceiro
            </Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] hover:bg-[#e5b500] px-5 py-2.5 text-sm font-bold text-[#00577C] shadow-md transition-all">
              Cartão Residente
            </Link>
          </nav>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`rounded-xl border p-2 md:hidden transition-colors ${scrolled ? 'border-slate-200 bg-slate-50 text-[#00577C]' : 'border-white/20 bg-white/10 text-white'}`}>
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-[100%] left-0 w-full bg-white border-b border-slate-200 p-5 flex flex-col gap-3 shadow-xl md:hidden">
            {[['Rota Turística','/roteiro'],['Pacotes','/pacotes'],['Passeios','/passeios'],['Aldeias','/aldeias'],['Hospedagem','/hoteis']].map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg py-1">{label}</Link>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#F9C400] text-[#00577C] font-black px-4 py-3.5 rounded-xl text-center uppercase tracking-widest text-sm shadow-md">Cartão Residente</Link>
              <Link href="/parceiros" onClick={() => setIsMobileMenuOpen(false)} className="border border-[#F9C400] text-[#00577C] font-black px-4 py-3.5 rounded-xl text-center uppercase tracking-widest text-sm">Torne-se um parceiro</Link>
            </div>
          </div>
        )}
      </header>

      {/* ============================== */}
      {/* HERO SECTION — PREMIUM REDESIGN */}
      {/* ============================== */}
      <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#001e2b]">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image src="https://images.unsplash.com/photo-1442850473887-0fb77cd0b337?q=80&w=1740&auto=format&fit=crop" alt="São Geraldo do Araguaia" fill priority className="object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#001e2b]/90 via-[#001e2b]/60 to-[#00577C]/40" />
          {/* Decorative blobs */}
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#F9C400]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-[#009640]/10 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* Trust bar at top */}
        <div className="relative z-10 pt-24 md:pt-28">
          <TrustBar />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="mx-auto max-w-7xl px-5 md:px-8 w-full py-16 md:py-20">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#F9C400]/20 border border-[#F9C400]/30 text-[#F9C400] px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-6 backdrop-blur">
                  <ShieldCheck size={13}/> Portal Oficial de Turismo · Pará
                </div>
                <h1 className={`${jakarta.className} text-5xl sm:text-6xl md:text-7xl font-black text-white leading-[1.02] mb-6`}>
                  O Araguaia<br />te espera.
                  <span className="block text-[#F9C400] mt-1">Venha viver.</span>
                </h1>
                <p className="text-white/70 text-lg md:text-xl max-w-lg leading-relaxed mb-8">
                  Serras, rios, trilhas e cultura viva. O melhor de São Geraldo do Araguaia num único portal oficial e seguro.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/roteiro" className="inline-flex items-center gap-3 bg-[#F9C400] hover:bg-[#e5b500] text-[#00577C] px-7 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                    Explorar Roteiros <ArrowRight size={17} />
                  </Link>
                  <Link href="/#eventos" className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-7 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all backdrop-blur hover:-translate-y-0.5">
                    Ver Agenda
                  </Link>
                </div>
              </div>

              {/* Quick access cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Mountain, title: 'Serra das Andorinhas', desc: 'Trilhas e mirantes', href: '/roteiro', color: '#009640' },
                  { icon: Waves, title: 'Rio Araguaia', desc: 'Praias e banhos', href: '/roteiro', color: '#00577C' },
                  { icon: Hotel, title: 'Hospedagem', desc: '3 hotéis disponíveis', href: '/hoteis', color: '#F9C400' },
                  { icon: CalendarDays, title: 'Eventos', desc: 'Agenda cultural', href: '/#eventos', color: '#009640' },
                ].map((card, i) => (
                  <Link key={i} href={card.href}
                    className="group bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 hover:border-white/30 rounded-2xl p-5 transition-all hover:-translate-y-1">
                    <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ backgroundColor: `${card.color}25`, border: `1px solid ${card.color}40` }}>
                      <card.icon size={20} style={{ color: card.color === '#F9C400' ? '#F9C400' : card.color }} />
                    </div>
                    <p className="text-white font-bold text-sm leading-tight">{card.title}</p>
                    <p className="text-white/50 text-xs mt-0.5">{card.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Search bar */}
            <div className="mt-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center shadow-2xl max-w-3xl">
              <div className="flex items-center gap-3 flex-1 bg-white/10 rounded-xl px-4 py-3 border border-white/15">
                <MapPin size={16} className="text-[#F9C400] shrink-0" />
                <input type="text" placeholder="O que deseja explorar?" className="bg-transparent text-white placeholder-white/40 text-sm font-medium outline-none w-full" />
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 border border-white/15 sm:w-40">
                <CalendarDays size={16} className="text-[#F9C400] shrink-0" />
                <input type="text" placeholder="Quando?" className="bg-transparent text-white placeholder-white/40 text-sm font-medium outline-none w-full" />
              </div>
              <button className="bg-[#F9C400] hover:bg-[#e5b500] text-[#00577C] px-7 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg">
                <Search size={16} /> Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8">
          <a href="#rota" className="flex flex-col items-center gap-2 text-white/30 hover:text-white/60 transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-widest">Descubra mais</span>
            <ChevronDown size={18} className="animate-bounce" />
          </a>
        </div>
      </section>

      {/* ROTA TURÍSTICA */}
      <section id="rota" className="bg-white py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 md:gap-16 px-5 md:grid-cols-2 md:items-center">
          <div className="relative min-h-[320px] md:min-h-[480px] overflow-hidden rounded-3xl shadow-xl group">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{backgroundImage: "url('https://images.pexels.com/photos/31780330/pexels-photo-31780330.jpeg?_gl=1*139yaog*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc1NjYxODMkbzI4JGcxJHQxNzc3NTY3MjY2JGoyMCRsMCRoMA..')"}} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#00577C]/80 via-[#00577C]/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="inline-flex items-center gap-2 bg-[#F9C400] text-[#00577C] px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider mb-3">
                <Route size={12} /> Rota Turística Oficial
              </div>
              <p className="text-white font-black text-2xl">São Geraldo do Araguaia</p>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 bg-[#009640]/10 text-[#009640] px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
              <Globe size={13} /> Conheça a rota oficial
            </div>
            <h2 className={`${jakarta.className} text-4xl sm:text-5xl md:text-6xl font-black text-slate-950 leading-tight`}>
              Um roteiro para descobrir o melhor da cidade.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-500">
              Reunimos paisagens naturais, cultura local, pontos de visitação e experiências para quem deseja conhecer São Geraldo do Araguaia com mais direção e propósito.
            </p>

            {/* Feature list */}
            <div className="mt-7 space-y-3">
              {['Serra das Andorinhas e trilhas', 'Praias do Rio Araguaia', 'Aldeias indígenas e cultura local', 'Gastronomia regional'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#009640]/15 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={13} className="text-[#009640]" />
                  </div>
                  <span className="text-slate-600 font-medium text-sm">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/roteiro" className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#F9C400] px-8 py-4 font-black text-[#00577C] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#e5b500] text-sm uppercase tracking-wider">
                Explorar rota turística <ArrowRight size={17} />
              </Link>
              <a href="#eventos" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 hover:border-slate-300 px-8 py-4 font-bold text-[#00577C] transition-all hover:bg-slate-50 text-sm">
                Ver Agenda Cultural
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <WhyUs />

      {/* AGENDA CULTURAL */}
      <AgendaCultural />

      {/* DESTAQUES VERÃO */}
      <DestaquesVerao />

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* GALERIA */}
      <GaleriaVerao />

      {/* HOTÉIS */}
      <SeccaoHoteis />

      {/* PACOTES */}
      <SeccaoPacotes />

      {/* PASSEIOS */}
      <SeccaoPasseios />

      {/* ALDEIAS INDÍGENAS */}
      <section className="bg-white py-20 md:py-28 border-t border-slate-100">
        <div className="mx-auto grid max-w-7xl gap-10 md:gap-16 px-5 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#009640]/10 text-[#009640] px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
              <Leaf size={13} /> Patrimônio Vivo
            </div>
            <h2 className={`${jakarta.className} text-4xl sm:text-5xl md:text-6xl font-black text-[#00577C] tracking-tight leading-tight`}>
              Povos Originários e a nossa verdadeira raiz.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-500">
              O município orgulha-se de ser o lar de diversas comunidades indígenas. Guardiões da floresta, dos rios e de saberes milenares, estes povos mantêm viva uma rica herança cultural de rituais, artesanato e conexão profunda com a natureza amazónica.
            </p>
            <Link href="/aldeias" className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-[#F9C400] px-8 py-4 font-black text-[#00577C] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#e5b500] text-sm uppercase tracking-wider">
              Conhecer as Aldeias <ArrowRight size={17} />
            </Link>
          </div>

          <div className="relative min-h-[300px] md:min-h-[440px] overflow-hidden rounded-3xl shadow-xl group">
            <Image src="https://images.pexels.com/photos/12434691/pexels-photo-12434691.jpeg" alt="Aldeias Indígenas" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
            <div className="absolute bottom-7 left-7 right-7">
              <p className="text-white font-black text-xl drop-shadow-md">Cultura, respeito e ancestralidade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section id="historia" className="bg-slate-50 py-20 md:py-28 border-t border-slate-200">
        <div className="mx-auto grid max-w-7xl gap-10 md:gap-16 px-5 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#009640]/10 text-[#009640] px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
              <Landmark size={13} /> História da cidade
            </div>
            <h2 className={`${jakarta.className} text-4xl sm:text-5xl md:text-6xl font-black text-slate-950 leading-tight`}>
              Uma cidade moldada pelo rio, pela serra e pelo seu povo.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-500">
              São Geraldo do Araguaia é marcada pela relação com o Rio Araguaia, pela força da natureza e pela identidade de seu povo. Entre paisagens naturais, tradições e histórias de desenvolvimento, o município se tornou porta de entrada para o ecoturismo, cultura regional e a vida às margens do Araguaia.
            </p>
            <Link href="/historia" className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-[#F9C400] px-8 py-4 font-black text-[#00577C] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#e5b500] text-sm uppercase tracking-wider">
              História Completa <ArrowRight size={17} />
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-8 md:p-10 shadow-sm border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-[#00577C]/10 flex items-center justify-center mb-7">
              <Landmark className="h-6 w-6 text-[#00577C]" />
            </div>
            <div className="inline-flex items-center gap-2 bg-[#009640]/10 text-[#009640] px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              Patrimônio local
            </div>
            <h3 className={`${jakarta.className} text-2xl md:text-3xl font-bold text-[#00577C] leading-tight`}>
              Turismo que valoriza a identidade araguaiense.
            </h3>
            <p className="mt-4 text-slate-500 leading-relaxed">
              Mais do que visitar lugares, o turismo local fortalece memórias, histórias, economia e orgulho de pertencimento.
            </p>
            <div className="mt-7 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <p className={`${jakarta.className} text-3xl font-black text-[#00577C]`}>1963</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Ano de fundação</p>
              </div>
              <div>
                <p className={`${jakarta.className} text-3xl font-black text-[#00577C]`}>28k+</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Habitantes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CARTÃO RESIDENTE — CTA */}
      <section className="bg-[#00577C] py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F9C400]/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="mx-auto max-w-7xl px-5 relative z-10">
          <div className="grid gap-10 md:gap-16 md:grid-cols-[1.4fr_0.6fr] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#F9C400]/20 border border-[#F9C400]/30 text-[#F9C400] px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-6">
                <ShieldCheck size={13}/> Cartão do residente
              </div>
              <h2 className={`${jakarta.className} text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight`}>
                Mora em São Geraldo? O parque também é para ti!
              </h2>
              <p className="mt-5 max-w-2xl text-lg text-white/70 leading-relaxed">
                Residentes podem solicitar o cartão digital e garantir 50% de desconto na entrada do parque — de forma simples, rápida e segura.
              </p>
              <Link href="/cadastro" className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-[#F9C400] hover:bg-[#e5b500] px-8 py-4 font-black text-[#00577C] transition-all hover:-translate-y-0.5 shadow-xl text-sm uppercase tracking-wider">
                Solicitar meu cartão <ArrowRight size={17} />
              </Link>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur text-center">
              <ShieldCheck className="mb-4 h-12 w-12 text-[#F9C400] mx-auto" />
              <p className={`${jakarta.className} text-7xl font-black text-white`}>50%</p>
              <p className="mt-2 text-xl font-bold text-white">de desconto</p>
              <p className="mt-1 text-sm text-white/50">para residentes</p>
              <div className="mt-6 pt-5 border-t border-white/15 text-left space-y-2">
                {['Digital e gratuito', 'Validade anual', 'Para toda a família'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/70 text-sm">
                    <CheckCircle2 size={13} className="text-[#F9C400] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white py-16 md:py-20 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-16 mb-12 md:mb-16">
            <div className="space-y-5 md:col-span-1">
              <img src="/logop.png" alt="Prefeitura SGA" className="h-12 object-contain brightness-0 invert opacity-70" />
              <p className="text-xs text-slate-500 font-medium leading-relaxed">São Geraldo do Araguaia<br /><span className="italic">"Cidade Amada, seguindo em frente"</span></p>
              <div className="flex gap-3 pt-1">
                <a href="#" className="w-9 h-9 bg-white/10 hover:bg-[#F9C400] hover:text-[#00577C] rounded-lg flex items-center justify-center transition-all text-white/60"><Instagram size={15} /></a>
                <a href="#" className="w-9 h-9 bg-white/10 hover:bg-[#F9C400] hover:text-[#00577C] rounded-lg flex items-center justify-center transition-all text-white/60"><Facebook size={15} /></a>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-black text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-3">Gestão Executiva</h5>
              <ul className="text-xs text-slate-400 space-y-3 font-medium">
                <li>Prefeito:<br /><b className="text-slate-300">Jefferson Douglas de Jesus Oliveira</b></li>
                <li>Vice-Prefeito:<br /><b className="text-slate-300">Marcos Antônio Candido de Lucena</b></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h5 className="font-black text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-3">Turismo (SEMTUR)</h5>
              <ul className="text-xs text-slate-400 space-y-3 font-medium">
                <li>Secretária:<br /><b className="text-slate-300">Micheli Stephany de Souza</b></li>
                <li className="flex items-center gap-2"><Phone size={12} className="text-[#F9C400]" /> <b className="text-slate-300">(94) 98145-2067</b></li>
                <li className="flex items-center gap-2"><Mail size={12} className="text-[#F9C400]" /> <b className="text-slate-300">setursaga@gmail.com</b></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h5 className="font-black text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-3">Equipe Técnica</h5>
              <ul className="text-xs text-slate-400 space-y-2 font-medium">
                <li className="text-slate-400">• Adriana da Luz Lima</li>
                <li className="text-slate-400">• Carmelita Luz da Silva</li>
                <li className="text-slate-400">• Diego Silva Costa</li>
              </ul>
              <div className="pt-2">
                <Link href="/parceiros" className="inline-flex items-center gap-2 text-[#F9C400] hover:text-[#e5b500] text-xs font-bold transition-colors">
                  Seja um Parceiro <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">© 2026 Secretaria Municipal de Turismo · São Geraldo do Araguaia (PA)</p>
            <div className="flex gap-5">
              {[['Privacidade', '#'], ['Termos', '#'], ['Acessibilidade', '#']].map(([label, href]) => (
                <a key={label} href={href} className="text-[10px] text-slate-600 hover:text-slate-400 font-medium uppercase tracking-widest transition-colors">{label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}