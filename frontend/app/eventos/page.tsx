'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, MapPin, ArrowRight, Loader2, CalendarDays, Clock, Sparkles, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

type Evento = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  descricao: string | null;
  data: string;
  horario: string | null;
  local: string | null;
  imagem_url: string | null;
  categoria: string | null;
  destaque: boolean;
};

// ── MOTOR DE ANIMAÇÕES ──
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number; }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const NOME_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const CORES_MESES = [
  "bg-[#002f40]", // Azul Petróleo Profundo
  "bg-[#00577C]", // Azul Petróleo Oficial
  "bg-[#009640]", // Verde Araguaia
];

export default function EventosPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [eventosPorMes, setEventosPorMes] = useState<Record<number, Evento[]>>({});
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // ✅ CORREÇÃO AQUI

  const hoje = new Date();
  const dataHojeISO = hoje.toISOString().split('T')[0];
  const mesAtualIndex = hoje.getMonth();

  useEffect(() => {
    async function fetchEventos() {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .gte('data', dataHojeISO) // FILTRO: Apenas de hoje para o futuro
        .order('data', { ascending: true });

      if (data) {
        const agrupados = data.reduce((acc: Record<number, Evento[]>, evento: Evento) => {
          const mesIndex = parseInt(evento.data.split('-')[1], 10) - 1;
          if (!acc[mesIndex]) acc[mesIndex] = [];
          acc[mesIndex].push(evento);
          return acc;
        }, {});
        setEventosPorMes(agrupados);
      }
      setLoading(false);
    }
    fetchEventos();
  }, [dataHojeISO]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className={`${inter.className} min-h-screen bg-[#002f40]`}>
      
      {/* ── HEADER ORIGINAL ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                {/* Removido o filtro invertido para manter as cores originais da logo */}
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Rotas','Passeios', 'Aldeias','Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`} className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
              Cartão Residente
            </Link>
          </nav>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas Turísticas</Link>
            <Link href="/eventos" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Agenda Cultural</Link>
            <Link href="/pacotes" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Pacotes</Link>
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Roteiros</Link>
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* ── HERO SECTION (CLEAN) ── */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <video 
          src="/serra.mp4" 
          autoPlay loop muted playsInline 
          className="absolute inset-0 w-full h-full object-cover brightness-[0.4]" 
        />
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <Reveal>
            <h1 className={`${jakarta.className} text-6xl md:text-9xl font-black text-white leading-[0.85] tracking-tighter mb-8`}>
              calendário<br /><span className="text-[#F9C400]">DE EVENTOS</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 font-medium max-w-2xl mx-auto">
              Dos festivais de verão às tradições ribeirinhas. Descubra o que está a acontecer em São Geraldo do Araguaia.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── SECCÕES POR MÊS (COLORIDAS & HORIZONTAIS) ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="animate-spin text-[#F9C400] w-16 h-16 mb-4" />
          <p className="text-white font-black text-xs uppercase tracking-widest">Sincronizando Agenda...</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {NOME_MESES.map((nomeMes, index) => {
            // Regra 1: Não mostrar meses passados
            if (index < mesAtualIndex) return null;

            const eventosDesteMes = eventosPorMes[index] || [];
            const corFundo = CORES_MESES[index % CORES_MESES.length];

            return (
              <section key={index} className={`py-24 ${corFundo} relative overflow-hidden border-t border-white/5`}>
                <div className="max-w-[1400px] mx-auto px-6 mb-12">
                  <Reveal>
                    <div className="flex items-center gap-6">
                      <h2 className={`${jakarta.className} text-6xl md:text-8xl font-black text-white/95 tracking-tighter`}>
                        {nomeMes}
                      </h2>
                      <div className="h-px flex-1 bg-white/20" />
                      <span className="text-[#F9C400] font-black text-2xl md:text-4xl">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                  </Reveal>
                </div>

                {/* SCROLL HORIZONTAL DOS CARDS */}
                <div className="relative w-full overflow-x-auto hide-scrollbar pb-10">
                  <div className="flex gap-6 px-6 md:px-24">
                    {eventosDesteMes.length === 0 ? (
                      <div className="min-w-[300px] py-10 opacity-30 italic text-white flex items-center gap-4">
                        <CalendarDays /> Próximos eventos a serem anunciados...
                      </div>
                    ) : (
                      eventosDesteMes.map((evento, i) => (
                        <div key={evento.id} className="min-w-[300px] md:min-h-[450px] md:min-w-[450px]">
                          <Reveal delay={i * 100}>
                            <div className="group relative h-[450px] rounded-[2.5rem] overflow-hidden bg-[#001f3f] shadow-2xl border border-white/10 flex flex-col">
                              {/* Imagem */}
                              <div className="relative h-1/2 w-full overflow-hidden">
                                {evento.imagem_url ? (
                                  <Image 
                                    src={evento.imagem_url} 
                                    alt={evento.titulo} 
                                    fill 
                                    className="object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80" 
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#00577C]" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#001f3f] to-transparent" />
                                
                                {/* Data em destaque */}
                                <div className="absolute top-6 left-6 bg-[#F9C400] text-[#002f40] px-4 py-2 rounded-2xl shadow-xl">
                                  <p className="text-2xl font-black leading-none">{evento.data.split('-')[2]}</p>
                                  <p className="text-[9px] font-bold uppercase tracking-widest">{nomeMes.slice(0, 3)}</p>
                                </div>
                              </div>

                              {/* Conteúdo */}
                              <div className="flex-1 p-8 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-3 mb-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#009640] bg-green-500/10 px-3 py-1 rounded-full">
                                      {evento.categoria || 'Evento'}
                                    </span>
                                    {evento.horario && (
                                      <span className="flex items-center gap-1 text-[10px] font-bold text-white/40">
                                        <Clock size={12} /> {evento.horario}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-white mb-3 line-clamp-2 leading-tight`}>
                                    {evento.titulo}
                                  </h3>
                                  <p className="text-white/50 text-sm line-clamp-2 font-medium">
                                    {evento.descricao}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                                  <div className="flex items-center gap-2 text-white/40">
                                    <MapPin size={14} className="text-[#F9C400]" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{evento.local || 'SGA'}</span>
                                  </div>
                                  <Link 
                                    href={`/eventos/${evento.id}`}
                                    className="bg-white/10 hover:bg-[#F9C400] text-white hover:text-[#002f40] p-3 rounded-full transition-all group-hover:translate-x-1"
                                  >
                                    <ArrowRight size={20} />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </Reveal>
                        </div>
                      ))
                    )}
                    {/* Espaçador final do scroll */}
                    <div className="min-w-[100px] h-1" />
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ── FOOTER PREMIUM ── */}
      <footer className="py-20 px-6 bg-[#001f3f] border-t border-white/5">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Image src="/logop.png" alt="Prefeitura SGA" width={160} height={60} className="brightness-0 invert opacity-60" />
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Cidade Amada · Pará · Brasil</p>
          </div>
          <div className="flex gap-4">
             <Link href="/rotas" className="bg-white/5 text-white/60 px-6 py-3 rounded-full text-[10px] font-bold uppercase hover:bg-white/10 transition-all tracking-widest">Rotas</Link>
             <Link href="/cadastro" className="bg-white/5 text-white/60 px-6 py-3 rounded-full text-[10px] font-bold uppercase hover:bg-white/10 transition-all tracking-widest">Cartão Digital</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}