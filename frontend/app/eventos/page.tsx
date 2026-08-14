'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, MapPin, ArrowRight, Loader2, CalendarDays, Clock, Sparkles, ChevronRight, ChevronLeft,
  ShieldCheck
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
// ── MOTOR DE ANIMAÇÕES (CORRIGIDO PELO VINCI) ──
function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number; }) {
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
    <div 
      ref={ref} 
      // Repare que adicionámos o ${className} aqui no final da string de classes!
      className={`transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`} 
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const NOME_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// ── PALETA SOFT & CLEAN ──
const CORES_MESES = [
  "bg-white",
  "bg-[#FDFCF7]",
  "bg-slate-50",
];

export default function EventosPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [eventosPorMes, setEventosPorMes] = useState<Record<number, Evento[]>>({});
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const hoje = new Date();
  const dataHojeISO = hoje.toISOString().split('T')[0];
  const mesAtualIndex = hoje.getMonth();

  useEffect(() => {
    async function fetchEventos() {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .gte('data', dataHojeISO)
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
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 overflow-x-hidden flex flex-col`}>
      <div className="flex-1">

        {/* ── HEADER EDITORIAL (CENTRALIZADO & DROPDOWN) ── */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}>
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
            <div className="flex-1">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                  <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
                </div>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center justify-center gap-12">
              {[
                { label: 'Conhecer', links: ['Atrativos', 'Rotas', 'História', 'Biodiversidade', 'Galeria'] },
                { label: 'Viver', links: ['Passeios', 'Eventos', 'Comunidades', 'Aldeias'] },
                { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
              ].map((group) => (
                <div key={group.label} className="relative group py-2">
                  <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-[#00577C] transition-colors`}>
                    {group.label} <ChevronRight size={14} className="group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-2xl p-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50 flex flex-row items-center gap-1">
                    {group.links.map((link) => (
                      <Link key={link} href={`/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} className={`${jakarta.className} block px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#00577C] hover:bg-slate-50 rounded-xl transition-all whitespace-nowrap`}>
                        {link}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="flex-1 flex justify-end items-center gap-4">
              <Link href="/cadastro" className={`hidden lg:inline-flex ${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
                Residente
              </Link>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Menu Mobile */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-6 shadow-2xl lg:hidden z-50 max-h-[85vh] overflow-y-auto">
              {[
                { label: 'Conhecer', links: ['Atrativos', 'Rotas', 'História', 'Biodiversidade', 'Galeria'] },
                { label: 'Viver', links: ['Passeios', 'Eventos', 'Comunidades', 'Aldeias'] },
                { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
              ].map((group) => (
                <div key={group.label} className="flex flex-col gap-3">
                  <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.2em] text-[#00577C] border-b border-slate-100 pb-2`}>{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.links.map((link) => (
                      <Link key={link} href={`/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} font-bold text-slate-700 text-sm bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 hover:text-[#00577C] hover:bg-slate-100 transition-colors`}>
                        {link}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-3">
                <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md`}>
                  Cartão Residente
                </Link>
              </div>
            </div>
          )}
        </header>

                {/* ── HERO SOFT & CLEAN (AGENDA CULTURAL) ── */}
        <section className="relative pt-6 pb-12 md:pt-10 md:pb-16 px-6 bg-[#FDFCF7] overflow-hidden mt-[72px] md:mt-[80px]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#009640]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#00577C]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center relative z-10">
            <Reveal className="lg:col-span-5 flex flex-col items-center text-center lg:items-start lg:text-left">
              
              <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6`}>
                Agenda<br />
                <span className="italic text-[#00577C]">Cultural.</span>
              </h1>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium mb-6 text-justify md:text-left">
                Acompanhe as celebrações, festivais fluviais e eventos locais que movimentam São Geraldo do Araguaia ao longo do ano.
              </p>
            </Reveal>

            <Reveal className="lg:col-span-7 w-full mt-2 lg:mt-0">
              <div className="relative w-full aspect-[16/9] md:aspect-[16/10] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-[4px] border-white z-10 group bg-slate-100">
                <Image 
                  src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/maiara.png" 
                  alt="Agenda Cultural" 
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-[2000ms]" 
                  priority 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── SECCÕES POR MÊS (COM CORES SOFT & CLEAN) ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-[#00577C] w-16 h-16 mb-4" />
            <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Sincronizando Agenda...</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {NOME_MESES.map((nomeMes, index) => {
              if (index < mesAtualIndex) return null;

              const eventosDesteMes = eventosPorMes[index] || [];
              const corFundo = CORES_MESES[index % CORES_MESES.length];

              return (
                <section key={index} className={`py-24 ${corFundo} relative overflow-hidden border-t border-slate-100`}>
                  <div className="max-w-[1400px] mx-auto px-6 mb-12">
                    <Reveal>
                      <div className="flex items-center gap-6">
                        <h2 className={`${jakarta.className} text-6xl md:text-8xl font-black text-slate-900 tracking-tighter`}>
                          {nomeMes}
                        </h2>
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-[#00577C] font-black text-2xl md:text-4xl">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </Reveal>
                  </div>

                  {/* SCROLL HORIZONTAL DOS CARDS */}
                  <div className="relative w-full overflow-x-auto hide-scrollbar pb-10">
                    <div className="flex gap-6 px-6 md:px-24">
                      {eventosDesteMes.length === 0 ? (
                        <div className="min-w-[300px] py-10 opacity-40 italic text-slate-500 flex items-center gap-4">
                          <CalendarDays /> Próximos eventos a serem anunciados...
                        </div>
                      ) : (
                        eventosDesteMes.map((evento, i) => (
                          <div key={evento.id} className="min-w-[300px] md:min-h-[450px] md:min-w-[450px]">
                            <Reveal delay={i * 100}>
                              <div className="group relative h-[450px] rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl border border-white/10 flex flex-col">
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
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                                  
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
                      <div className="min-w-[100px] h-1" />
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER INSTITUCIONAL INTEGRADO ── */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-[#FDFCF7] text-left mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de São Geraldo do Araguaia" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1 text-center md:text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                © 2026 Secretaria Municipal de Turismo - SGA | Todos os direitos reservados
              </p>
              <p className="text-[10px] font-bold text-slate-400/80">
                CNPJ: 10.249.241/0001-22
              </p>
            </div>
          </div>
          <div className="flex gap-10">
            <div className="text-left border-l-2 border-slate-100 pl-9">
              <p className="text-[10px] font-black text-[#00577C] uppercase mb-1">Contato Oficial</p>
              <p className="text-xs font-bold text-slate-500 tracking-tight">setursaga@gmail.com</p>
            </div>
            <ShieldCheck size={40} className="text-[#009640] opacity-30" />
          </div>
        </div>
      </footer>
    </main>
  );
}