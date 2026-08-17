'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  ArrowRight, ShieldCheck, Star, ExternalLink, Menu, Landmark, Hotel,
  Mountain, Waves, TreePine, CalendarDays, MapPin, Ticket,
  Loader2, Sparkles, Image as ImageIcon, Compass, CheckCircle2, X,
  ChevronLeft, ChevronRight, Route, ChevronDown, ChevronUp, UserCircle, Link2, Share2, Phone, Mail, Clock
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import MinhaReservaModal from '@/components/MinhaReservaModal';

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
// COMPONENTE: ÚLTIMOS ARTIGOS DO BLOG
// ==========================================
function UltimosArtigosBlog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2069";

  useEffect(() => {
    async function fetchPosts() {
      const { data } = await supabase
        .from('blog')
        .select('id, titulo, imagem_url, data_publicacao')
        .eq('ativo', true)
        .order('data_publicacao', { ascending: false })
        .limit(3);
      if (data) setPosts(data);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '';
    const date = new Date(dataStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <section className="py-24 bg-white overflow-hidden border-t border-slate-100">
      <div className="max-w-[1400px] mx-auto px-6">
        
        <AnimatedSection animation="fade-up" className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-slate-900 leading-[0.9]`}>
                Blog & <span className="italic text-[#F9C400]">Notícias</span>
              </h2>
            </div>
            <Link href="/blog" className="inline-flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-[#00577C] hover:gap-4 transition-all">
              Ler todos os artigos <ArrowRight size={16} />
            </Link>
          </div>
        </AnimatedSection>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin w-10 h-10 text-[#00577C]" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center text-slate-500 font-medium">Nenhum artigo publicado recentemente.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
            {posts.map((post, i) => (
              <AnimatedSection key={post.id} animation="fade-up" delay={i * 150}>
                <Link href={`/blog/${post.id}`} className="group flex flex-col gap-5 block h-full">
                  
                  {/* Imagem do Post */}
                  <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 shadow-sm">
                    <Image 
                      src={post.imagem_url || FALLBACK_IMAGE} 
                      alt={post.titulo} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-out" 
                    />
                  </div>
                  
                  {/* Textos Editoriais */}
                  <div className="flex flex-col items-start text-left gap-3 px-2">
                    {post.data_publicacao && (
                      <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                        {formatarData(post.data_publicacao)}
                      </span>
                    )}
                    <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 leading-[1.2] group-hover:text-[#00577C] transition-colors line-clamp-3`}>
                      {post.titulo}
                    </h3>
                    <span className="text-[#00577C] text-[13px] mt-1 font-bold tracking-wide underline underline-offset-4 decoration-slate-200 group-hover:decoration-[#00577C] transition-colors">
                      Leia mais
                    </span>
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
              <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-slate-900 leading-[0.9]`}>
                Agenda de <span className="italic text-[#00577C]"> Eventos</span>
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
// COMPONENTE: GALERIA VERÃO 2026
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
            <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-[0.9]`}>
              Galeria <span className="italic text-[#F9C400]">Verão 2025</span>
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
// COMPONENTE: AGENDA CULTURAL 
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

  return null; 
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
    <section id="hoteis" className="py-24 bg-transparent overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        <AnimatedSection animation="fade-up" className="mb-16">
          <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-slate-900 leading-[0.9]`}>
            Alojamentos <span className="italic text-[#00577C]">Locais</span>
          </h2>
          
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
          <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-slate-900 leading-[0.9]`}>
            Passeios <span className="italic text-[#00577C]">Rápidos</span>
          </h2>
        </AnimatedSection>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin w-10 h-10 text-[#00577C]" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* PASSEIO DESTAQUE (CARD GRANDE) */}
              {passeios[0] && (
                <AnimatedSection animation="fade-right" className="md:col-span-2">
                  <Link href={`/passeios/${passeios[0].id}`} className="group relative h-[420px] rounded-[2rem] overflow-hidden bg-slate-900 block">
                    <Image
                      src={passeios[0].imagem_principal || 'https://images.unsplash.com/photo-1551632811-561732d1e306'}
                      alt={passeios[0].titulo} fill
                      className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                    
                    <div className="absolute top-4 left-4 bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg text-[9px] font-black uppercase text-[#F9C400] tracking-widest flex items-center gap-2 border border-white/10">
                      <CalendarDays size={11} /> {formatarDataSimples(passeios[0].data_passeio)}
                    </div>
                    
                    <div className="absolute bottom-8 left-8 right-8 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Compass size={14} className="text-[#F9C400]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/70">Guia: {passeios[0].nome_guia || 'Local'}</span>
                      </div>
                      <h3 className={`${jakarta.className} text-3xl font-black mb-2 line-clamp-1`}>{passeios[0].titulo}</h3>
                      <p className="text-white/70 text-sm line-clamp-2 mb-5">{passeios[0].descricao_curta}</p>
                      
                      {/* ── NOVO BOTÃO COM TEXTO ── */}
                      <div className="flex items-center">
                        <span className="inline-flex items-center gap-2 bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-md transition-transform group-hover:scale-105">
                          Saber mais <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              )}

              {/* PASSEIOS SECUNDÁRIOS (CARDS MENORES) */}
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
                        <h3 className={`${jakarta.className} text-xl font-black line-clamp-1 mb-2`}>{passeio.titulo}</h3>
                        <div className="flex items-center justify-between mt-1">
                          
                          <span className="inline-flex items-center gap-1.5 bg-[#F9C400] text-[#002f40] px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest transition-transform group-hover:scale-105">
                            Ver passeio<ArrowRight size={12} />
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
                Ver todos os passeios disponiveis <ArrowRight size={16} />
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

  const [isHovered, setIsHovered] = useState(false);
  const isHeaderSolid = isScrolled || isHovered || isMobileMenuOpen;
  
  // ◄── ESTADO DO MODAL DE RESERVAS ──►
  const [isReservaModalOpen, setIsReservaModalOpen] = useState(false);

  // ── REF PARA O VÍDEO ──
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── EFECTO PARA TORNAR O VÍDEO MAIS LENTO ──
  useEffect(() => {
    if (videoRef.current) {
      // Reduz a velocidade para 0.25x (2s → 8s)
      videoRef.current.playbackRate = 0.25;
    }
  }, []);

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

  // ── MENU AGRUPADO (COM PARCEIROS NO PLANEJAR) ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  return (
    <main className={`${inter.className} bg-[#FDFCF7] text-slate-900 overflow-x-hidden`}>

      {/* ── HEADER EDITORIAL (CENTRALIZADO & DROPDOWN HORIZONTAL) ── */}
      {/* ── HEADER EDITORIAL (TRANSPARENTE NO TOPO, BRANCO NO SCROLL) ── */}
      {/* ── HEADER EDITORIAL (TRANSPARENTE TOTAL NO TOPO, BRANCO NO HOVER/SCROLL) ── */}
      <header
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isHeaderSolid ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent border-b border-transparent'}`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
          
          {/* LADO ESQUERDO: Logo Totalmente Transparente */}
          <div className="flex-1">
            <Link href="/" className="inline-flex items-center gap-3 transition-all duration-300">
              <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
              </div>
            </Link>
          </div>

          {/* CENTRO: Navegação Desktop */}
          <nav className="hidden lg:flex items-center justify-center gap-12">
            {menuGroups.map((group) => (
              <div key={group.label} className="relative group py-2">
                <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] transition-colors ${isHeaderSolid ? 'text-slate-600 group-hover:text-[#00577C]' : 'text-white group-hover:text-[#F9C400] drop-shadow-md'}`}>
                  {group.label} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-2xl p-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50 flex flex-row items-center gap-1">
                  {group.links.map((link) => {
                    const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                    return (
                      <Link
                        key={link}
                        href={path}
                        className={`${jakarta.className} block px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#00577C] hover:bg-slate-50 rounded-xl transition-all whitespace-nowrap`}
                      >
                        {link}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* LADO DIREITO: Botões */}
          <div className="flex-1 flex justify-end items-center gap-4">
            <Link href="/cadastro"
              className={`hidden lg:inline-flex ${jakarta.className} px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm ${isHeaderSolid ? 'bg-[#F9C400] text-[#002f40]' : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'}`}>
              Residente
            </Link>
            
            {/* Botão Mobile Totalmente Transparente */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`rounded-xl p-2 lg:hidden transition-all duration-300 ${isHeaderSolid ? 'text-[#00577C] hover:bg-slate-100' : 'text-white hover:bg-white/20'}`}>
              {isMobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile (Grelha Organizada) */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-6 shadow-2xl lg:hidden z-50 max-h-[85vh] overflow-y-auto">
            
            {menuGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-3">
                <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.2em] text-[#00577C] border-b border-slate-100 pb-2`}>
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.links.map((link) => {
                    const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                    return (
                      <Link key={link} href={path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`${jakarta.className} font-bold text-slate-700 text-sm bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 hover:text-[#00577C] hover:bg-slate-100 transition-colors`}>
                        {link}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-3">
              <Link href="/cadastro"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md`}>
                Cartão Residente
              </Link>
            </div>
            
          </div>
        )}
      </header>

      {/* ── VISÃO GERAL DA CIDADE (HERO MODERNO & CLEAN) ── */}
      <section className="relative h-[100dvh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
  
        {/* Imagem de Fundo a cobrir 100% do ecrã */}
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}   // ← REF ADICIONADA
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="object-cover w-full h-full scale-105"
            src="/video_cortado.mp4"
          />
          {/* Overlay escuro para garantir que o texto branco tem contraste */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-slate-900/60" />
        </div>

        {/* Conteúdo Centralizado */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-4xl mx-auto">
          
          <AnimatedSection animation="fade-up" className="flex flex-col items-center w-full">
            
            {/* O TRUQUE TIPOGRÁFICO PARA NOMES LONGOS */}
            <div className="flex flex-col items-center leading-none mb-6 w-full">
              <h1 className={`${jakarta.className} flex flex-col items-center w-full`}>
                <span className="text-4xl md:text-6xl lg:text-7xl text-white font-black tracking-tight drop-shadow-lg">
                  SÃO GERALDO DO 
                </span>
                
                {/* O TEXTO GIGANTE E VAZADO */}
                <span 
                  className="text-[4rem] sm:text-[6rem] md:text-[8rem] lg:text-[11rem] font-black uppercase tracking-tighter mt-2 md:mt-4 lg:mt-4 w-full"
                  style={{
                    WebkitTextStroke: '2px rgba(255, 255, 255, 0.95)',
                    color: 'transparent',
                  }}
                >
                  Araguaia
                </span>
              </h1>
            </div>

          </AnimatedSection>

        </div>

        {/* ── ONDA DE TRANSIÇÃO (WAVE SHAPE DIVIDER) ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg 
            className="relative block w-full h-[40px] md:h-[50px]" 
            data-name="Layer 1" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" 
              fill="#FDFCF7"
            ></path>
          </svg>
        </div>
      </section>

      {/* ── ROTA TURÍSTICA — BENTO GRID REFINADO (DESIGNER EDITION) ── */}
<section className="py-20 md:py-24 bg-[#FDFCF7]">
  <div className="max-w-[1200px] mx-auto px-6">
    
    <AnimatedSection animation="fade-up" className="text-center mb-12 md:mb-16">
      <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight`}>
        Descubra São Geraldo do Araguaia
      </h2>
      <p className="text-slate-500 font-medium text-sm md:text-base">
        Atrativos, hospedagens, gastronomia, agências e muito mais.
      </p>
    </AnimatedSection>

    {/* Grelha mais contida, com gaps mais elegantes */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5">
      
      {/* 1. Atrativos (Linha de topo) */}
      <AnimatedSection animation="fade-up" delay={0} className="md:col-span-1 lg:col-span-3">
        <Link href="/biodiversidade" className="relative h-[260px] md:h-[280px] rounded-[2rem] overflow-hidden group block shadow-md hover:shadow-xl transition-all duration-500 border border-slate-100/10">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] group-hover:scale-105" style={{ backgroundImage: "url('https://images.pexels.com/photos/18064280/pexels-photo-18064280.jpeg?_gl=1*1at0h8g*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk1MDQ0MjUkbzUyJGcxJHQxNzc5NTA0ODIxJGo1OSRsMCRoMA..')" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col items-start">
            <h3 className={`${jakarta.className} text-2xl md:text-3xl font-bold drop-shadow-sm`}>Parque Serra das Andorinhas</h3>
          </div>
        </Link>
      </AnimatedSection>

      {/* 2. Hospedagens (Linha de topo) */}
      <AnimatedSection animation="fade-up" delay={100} className="md:col-span-1 lg:col-span-3">
        <Link href="/atrativos" className="relative h-[260px] md:h-[280px] rounded-[2rem] overflow-hidden group block shadow-md hover:shadow-xl transition-all duration-500 border border-slate-100/10">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] group-hover:scale-105" style={{ backgroundImage: "url('https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/atracoes/casapedra.png')" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col items-start">
            <h3 className={`${jakarta.className} text-2xl md:text-3xl font-bold drop-shadow-sm`}>Atrativos</h3>
          </div>
        </Link>
      </AnimatedSection>

      {/* 3. Gastronomia (Linha de baixo) */}
      <AnimatedSection animation="fade-up" delay={200} className="md:col-span-1 lg:col-span-2">
        <Link href="/gastronomia" className="relative h-[240px] md:h-[260px] rounded-[2rem] overflow-hidden group block shadow-md hover:shadow-xl transition-all duration-500 border border-slate-100/10">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] group-hover:scale-105" style={{ backgroundImage: "url('https://images.pexels.com/photos/4791748/pexels-photo-4791748.jpeg?_gl=1*17bsc2t*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODY4NDQzNTkkbzkyJGcxJHQxNzg2ODQ5MTUzJGo1OSRsMCRoMA..')" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col items-start">
            <h3 className={`${jakarta.className} text-xl md:text-2xl font-bold drop-shadow-sm`}>Gastronomia</h3>
          </div>
        </Link>
      </AnimatedSection>

      {/* 4. Agências (Linha de baixo) */}
      <AnimatedSection animation="fade-up" delay={300} className="md:col-span-1 lg:col-span-2">
        <Link href="/agencias" className="relative h-[240px] md:h-[260px] rounded-[2rem] overflow-hidden group block shadow-md hover:shadow-xl transition-all duration-500 border border-slate-100/10">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] group-hover:scale-105" style={{ backgroundImage: "url('https://images.pexels.com/photos/8828425/pexels-photo-8828425.jpeg?_gl=1*uh3hye*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODY4MzgyNjgkbzkwJGcxJHQxNzg2ODM4MzAzJGoyNSRsMCRoMA..')" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col items-start">
            <h3 className={`${jakarta.className} text-xl md:text-2xl font-bold drop-shadow-sm`}>Agências</h3>
          </div>
        </Link>
      </AnimatedSection>

      {/* 5. Comunidades (Linha de baixo) */}
      <AnimatedSection animation="fade-up" delay={400} className="md:col-span-2 lg:col-span-2">
        <Link href="/hoteis" className="relative h-[240px] md:h-[260px] rounded-[2rem] overflow-hidden group block shadow-md hover:shadow-xl transition-all duration-500 border border-slate-100/10">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] group-hover:scale-105" style={{ backgroundImage: "url('https://images.pexels.com/photos/14883357/pexels-photo-14883357.jpeg?_gl=1*19tl3ec*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODY4NDQzNTkkbzkyJGcxJHQxNzg2ODUxNDUwJGo0MCRsMCRoMA..')" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col items-start">
            <h3 className={`${jakarta.className} text-xl md:text-2xl font-bold drop-shadow-sm`}>Hospedagens</h3>
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

      {/* ── ÚLTIMAS DO BLOG ── */}
      <UltimosArtigosBlog />
    
      

      {/* ── HISTÓRIA (INTEGRADA & FULL WIDTH) ── */}
      <section id="historia" className="py-24 bg-white overflow-hidden border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            <AnimatedSection animation="fade-right">
              
              
              <h2 className={`${jakarta.className} text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[0.9] tracking-tight mb-8`}>
                Uma cidade<br />
                <span className="italic text-[#00577C]">moldada pelo rio.</span>
              </h2>
              
              <p className="text-slate-500 text-lg leading-relaxed mb-8 font-medium">
                São Geraldo do Araguaia é marcada pela relação com as águas, pela força da natureza e pela identidade do seu povo. Uma porta de entrada para o ecoturismo, para a cultura regional e para a autêntica vida ribeirinha.
              </p>
              
              <Link href="/historia" className="inline-flex items-center gap-3 bg-[#00577C] text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#004a6b] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                História Completa <ArrowRight size={16} />
              </Link>
            </AnimatedSection>

            <AnimatedSection animation="fade-left" delay={200} className="relative h-[400px] md:h-[500px] w-full rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-[4px] border-slate-50">
               <Image
                 src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/remanso1.png"
                 alt="História de São Geraldo"
                 fill
                 className="object-cover hover:scale-105 transition-transform duration-[2000ms]"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
               
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── CARTÃO RESIDENTE (INTEGRADO & FULL WIDTH) ── */}
      <section className="py-24 bg-[#FDFCF7] overflow-hidden border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-16 items-center">
            
            <AnimatedSection animation="fade-right">
              
              
              <h2 className={`${jakarta.className} text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[0.9] tracking-tight mb-8`}>
                É residente em São Geraldo?<br />
                <span className="italic text-[#00577C]">Há desconto para ti!</span>
              </h2>
              
              <p className="text-slate-500 text-lg leading-relaxed mb-8 font-medium max-w-xl">
                Os residentes podem solicitar o cartão digital e garantir 50% de desconto na entrada da Cachoeira Três Quedas. Um processo simples, rápido e 100% seguro.
              </p>
              
              <Link href="/cadastro" className="inline-flex items-center gap-3 bg-[#F9C400] text-[#002f40] px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#e5b500] hover:scale-105 transition-all">
                Solicitar meu cartão <ArrowRight size={16} />
              </Link>
            </AnimatedSection>

            <AnimatedSection animation="zoom-in" delay={200} className="relative flex justify-center lg:justify-end">
              {/* Brilho Suave Fundo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#F9C400]/15 rounded-full blur-3xl pointer-events-none" />
              
              {/* Cartão de Desconto (Bilhete Premium) */}
              <div className="relative bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 transform md:rotate-2 hover:rotate-0 transition-transform duration-500 w-full max-w-[400px]">
                
                <div className="flex items-start justify-between mb-8">
                  <div className="bg-[#00577C]/5 p-3 rounded-2xl">
                    <Ticket className="h-10 w-10 text-[#00577C]" />
                  </div>
                  <span className="bg-slate-50 text-slate-400 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">
                    Passe Digital
                  </span>
                </div>
                
                <p className={`${jakarta.className} text-6xl md:text-7xl font-black text-slate-900 mb-1 tracking-tighter`}>
                  50%
                </p>
                
                <p className="text-xl md:text-2xl font-bold text-slate-700 mb-6">
                  de desconto na entrada da Cachoeira Três Quedas
                </p>
                
                <div className="border-t border-slate-100 pt-5">
                  <p className="text-slate-400 text-xs leading-relaxed font-medium">
                    Válido exclusivamente para residentes do município de São Geraldo do Araguaia.
                  </p>
                </div>
              </div>
            </AnimatedSection>

          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 bg-[#FDFCF7] py-16 px-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Primeira linha: logos */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-200">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de SGA" width={140} height={50} className="object-contain" />
            </div>
          </div>

          {/* Segunda linha: colunas de links */}
          <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-10 pt-10">
            {/* Coluna 1: Contato */}
            <div>
              <p className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-[#00577C] mb-4`}>Contato</p>
              <div className="space-y-2.5 text-sm text-slate-600">
                <p className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-[#00577C] mt-0.5 shrink-0" />
                  R. Antônio Nonato Pedrosa, 324 - Vila Administrativa, São Geraldo do Araguaia - PA, 68570-000
                </p>
                <p className="flex items-center gap-2.5">
                  <Phone size={16} className="text-[#00577C] shrink-0" />
                  (94) 98420-5736
                </p>
                <p className="flex items-center gap-2.5">
                  <Mail size={16} className="text-[#00577C] shrink-0" />
                  contato@saogeraldodoaraguaia.pa.gov.br
                </p>
                <p className="flex items-center gap-2.5">
                  <Clock size={16} className="text-[#00577C] shrink-0" />
                  Seg-Sex das 8h às 17h
                </p>
              </div>
            </div>

            {/* Coluna 2: Descubra */}
            <div>
              <p className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-[#00577C] mb-4`}>Descubra</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/atrativos" className="text-slate-600 hover:text-[#00577C] transition-colors">Atrativos</Link></li>
                <li><Link href="/hoteis" className="text-slate-600 hover:text-[#00577C] transition-colors">Hospedagens</Link></li>
                <li><Link href="/gastronomia" className="text-slate-600 hover:text-[#00577C] transition-colors">Gastronomia</Link></li>
                <li><Link href="/comunidades" className="text-slate-600 hover:text-[#00577C] transition-colors">Comunidades</Link></li>
                <li><Link href="/historia" className="text-slate-600 hover:text-[#00577C] transition-colors">História</Link></li>
              </ul>
            </div>

            {/* Coluna 3: Planeje sua viagem */}
            <div>
              <p className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-[#00577C] mb-4`}>Planeje sua viagem</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/informacoes" className="text-slate-600 hover:text-[#00577C] transition-colors">Como Chegar</Link></li>
                <li><Link href="/eventos" className="text-slate-600 hover:text-[#00577C] transition-colors">Agenda de Eventos</Link></li>
                <li><Link href="/blog" className="text-slate-600 hover:text-[#00577C] transition-colors">Blog</Link></li>
                <li><Link href="/contato" className="text-slate-600 hover:text-[#00577C] transition-colors">Contatos Úteis</Link></li>
              </ul>
            </div>

            {/* Coluna 4: Institucional */}
            <div>
              <p className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-[#00577C] mb-4`}>Institucional</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/quem-somos" className="text-slate-600 hover:text-[#00577C] transition-colors">Quem Somos</Link></li>
                <li><Link href="/parceiros" className="text-slate-600 hover:text-[#00577C] transition-colors">Parceiros</Link></li>
                <li><Link href="/termos" className="text-slate-600 hover:text-[#00577C] transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="text-slate-600 hover:text-[#00577C] transition-colors">Política de Privacidade</Link></li>
                <li><Link href="https://saogeraldodoaraguaia.pa.gov.br" className="text-slate-600 hover:text-[#00577C] transition-colors">O Governo</Link></li>
              </ul>
            </div>
          </div>

          {/* Rodapé inferior com copyright */}
          <div className="border-t border-slate-200 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-slate-400 font-medium text-center md:text-left">
              © 2026 Prefeitura Municipal de São Geraldo do Araguaia. Todos os direitos reservados. · CNPJ: 10.249.241/0001-22
            </p>
            <Image src="/prefeitura.png" alt="Prefeitura de São Geraldo do Araguaia" width={100} height={30} className="object-contain opacity-70" />
          </div>
        </div>
      </footer>

      {/* ◄── MODAL INVISÍVEL ──► */}
      <MinhaReservaModal 
        isOpen={isReservaModalOpen} 
        onClose={() => setIsReservaModalOpen(false)} 
      />

    </main>
  );
}