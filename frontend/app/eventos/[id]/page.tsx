'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { 
  ArrowLeft, MapPin, Menu, ChevronRight, 
  Ticket, CalendarDays, Loader2, X, Clock, Info, Navigation, ShieldCheck
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// ── FONTES PADRÃO DO SITE ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── MOTOR DE ANIMAÇÕES DE SCROLL ──
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

function AnimatedSection({ children, className = "", animation = "fade-up", delay = 0 }: { children: ReactNode; className?: string; animation?: "fade-up" | "fade-left" | "fade-right" | "zoom-in"; delay?: number; }) {
  const { ref, isVisible } = useScrollAnimation();
  let hiddenClass = "opacity-0 translate-y-12";
  if (animation === "fade-left") hiddenClass = "opacity-0 translate-x-12";
  if (animation === "fade-right") hiddenClass = "opacity-0 -translate-x-12";
  if (animation === "zoom-in") hiddenClass = "opacity-0 scale-95";
  
  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0 scale-100" : hiddenClass} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── TIPAGEM ──
type Evento = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  imagem_url: string;
  categoria: string;
  horario?: string;
  duracao?: string;
  preco?: string;
  classificacao?: string;
  link_bilheteira?: string;
};

export default function EventoDetalhePage({ params }: { params: { id: string } }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // FETCH REAL NA SUPABASE
  useEffect(() => {
    async function fetchEventoReal() {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', params.id)
          .single(); 

        if (error) throw new Error("Erro ao buscar o evento na base de dados.");
        if (data) setEvento(data);
        else setErro("Evento não encontrado.");
      } catch (err: any) {
        setErro(err.message || "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) fetchEventoReal();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#002f40] text-white">
        <Loader2 className="w-16 h-16 animate-spin mb-6 text-[#F9C400]" />
        <p className={`${jakarta.className} font-black uppercase tracking-widest text-sm`}>Carregando evento...</p>
      </div>
    );
  }

  if (erro || !evento) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF7] text-slate-900 px-6 text-center">
        <CalendarDays className="w-20 h-20 text-slate-300 mb-6" />
        <h1 className={`${jakarta.className} text-5xl font-black mb-4 text-[#00577C]`}>Evento Indisponível</h1>
        <p className="text-slate-500 mb-10 max-w-md text-lg">{erro || "Não foi possível carregar os detalhes do evento solicitado."}</p>
        <Link href="/eventos" className="bg-[#F9C400] text-[#00577C] px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 transition-transform">
          Voltar à Agenda
        </Link>
      </div>
    );
  }

  // Formatação de Datas
  const dataObj = new Date(evento.data + 'T00:00:00'); 
  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const diaSemana = diasSemana[dataObj.getDay()];
  const diaMes = String(dataObj.getDate()).padStart(2, '0');
  const mesExtenso = meses[dataObj.getMonth()];
  const ano = dataObj.getFullYear();

  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 overflow-x-hidden`}>
      
      {/* ── HEADER ESTÁTICO (Fica no topo, não acompanha o scroll) ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                {/* Removido o filtro invertido para manter as cores originais da logo */}
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Roteiros','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
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
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* ── HERO SECTION DO EVENTO ── */}
      <section className="relative h-[50vh] md:h-[70vh] flex items-end pb-14 overflow-hidden bg-[#002f40]">
        {evento.imagem_url ? (
          <Image 
            src={evento.imagem_url} 
            alt={evento.titulo} 
            fill 
            className="object-cover opacity-90 scale-100 animate-[spin_120s_linear_infinite]" 
            priority 
          />
        ) : (
          <div className="absolute inset-0 bg-[#00577C] opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#002f40] via-[#002f40]/40 to-transparent" />
        
        {/* pb-16 lg:pb-32 garante que o título não bate no cartão de informações */}
        <div className="relative z-10 max-w-[1400px] mx-auto w-full px-6 pb-16 lg:pb-24">
          <AnimatedSection animation="fade-right">
            <br />
            {evento.categoria && (
              <span className={`${jakarta.className} inline-block bg-[#F9C400] text-[#002f40] px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest mb-4 shadow-lg`}>
                {evento.categoria}
              </span>
            )}
            
            {/* Título reduzido para caber melhor na tela */}
            <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight max-w-4xl drop-shadow-2xl`}>
              {evento.titulo}
            </h1>
          </AnimatedSection>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL (CARD STACKING) ── */}
      <section className="relative z-20 bg-[#FDFCF7] -mt-16 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] py-20 px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Lado Esquerdo: Barra de Informações Flutuante */}
          <aside className="w-full lg:w-[350px] shrink-0">
            <AnimatedSection animation="fade-up" className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 lg:-mt-32 relative z-30">
              
              {/* Highlight de Data */}
              <div className="flex items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                 <div className="text-center">
                    <p className={`${jakarta.className} text-5xl md:text-6xl font-black text-[#009640] leading-none tracking-tighter`}>{diaMes}</p>
                    <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2`}>{mesExtenso}</p>
                 </div>
                 <div className="w-px h-16 bg-slate-100" />
                 <div>
                    <p className={`${jakarta.className} font-bold text-slate-900`}>{diaSemana}</p>
                    <p className="text-sm font-medium text-slate-500">{ano}</p>
                 </div>
              </div>

              {/* Informações Rápidas */}
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#00577C]/5 flex items-center justify-center text-[#00577C] shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-slate-400`}>Horário</p>
                    <p className={`${jakarta.className} font-bold text-slate-900 mt-1`}>{evento.horario || 'Consulte o programa'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F9C400]/10 flex items-center justify-center text-[#d9a000] shrink-0">
                    <Info size={18} />
                  </div>
                  <div>
                    <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-slate-400`}>Duração & Preço</p>
                    <p className={`${jakarta.className} font-bold text-slate-900 mt-1`}>{evento.duracao || 'N/D'} • {evento.preco || 'Gratuito'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#009640]/10 flex items-center justify-center text-[#009640] shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-slate-400`}>Classificação</p>
                    <p className={`${jakarta.className} font-bold text-slate-900 mt-1`}>{evento.classificacao || 'Livre / Todas as idades'}</p>
                  </div>
                </div>
              </div>

              {/* Botão de Bilheteira */}
              {evento.link_bilheteira && (
                <div className="mt-10 pt-10 border-t border-slate-100">
                  <Link 
                    href={evento.link_bilheteira} 
                    target="_blank"
                    className={`${jakarta.className} w-full flex items-center justify-center gap-3 bg-[#00577C] text-white px-8 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#004a6b] hover:shadow-lg transition-all`}
                  >
                    <Ticket size={18} /> Obter Bilhete
                  </Link>
                </div>
              )}
            </AnimatedSection>
          </aside>

          {/* Lado Direito: Descrição e Mapa */}
          <div className="flex-1 max-w-4xl space-y-20">
            
            <AnimatedSection animation="fade-left">
              <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-8 flex items-center gap-4`}>
                <span className="w-8 h-1 bg-[#F9C400] rounded-full" /> Sobre o Evento
              </h2>
              <div className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                {evento.descricao || "Este evento não possui descrição detalhada no momento. Para mais informações, contate a Secretaria Municipal de Turismo."}
              </div>
            </AnimatedSection>

            {/* Bento Grid para Localização */}
            <AnimatedSection animation="fade-up">
              <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-8 flex items-center gap-4`}>
                <span className="w-8 h-1 bg-[#009640] rounded-full" /> Onde Vai Acontecer
              </h2>
              
              <div className="bg-white p-4 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col md:flex-row gap-6">
                
                {/* Informação do Local */}
                <div className="w-full md:w-1/3 bg-[#002f40] rounded-[2rem] p-8 text-white flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#00577C] rounded-full blur-[40px] pointer-events-none" />
                  <MapPin className="w-12 h-12 text-[#F9C400] mb-6 relative z-10" />
                  <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 relative z-10`}>Localização</p>
                  <p className={`${jakarta.className} text-2xl md:text-3xl font-black mb-6 relative z-10`}>{evento.local || 'São Geraldo do Araguaia'}</p>
                  <Link href={`https://maps.google.com/maps?q=${encodeURIComponent((evento.local || '') + ' São Geraldo do Araguaia, Pará')}`} target="_blank" className={`${jakarta.className} inline-flex items-center gap-2 text-[#F9C400] font-bold text-xs uppercase tracking-widest relative z-10 hover:gap-4 transition-all`}>
                    Obter Direções <Navigation size={14} />
                  </Link>
                </div>

                {/* Google Maps iframe CORRIGIDO */}
                <div className="w-full md:w-2/3 h-[300px] md:h-auto rounded-[2rem] overflow-hidden bg-slate-100">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent((evento.local || 'São Geraldo do Araguaia') + ', Pará, Brasil')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  ></iframe>
                </div>
              </div>
            </AnimatedSection>
            
          </div>
        </div>
      </section>

      {/* ── FOOTER PREMIUM ── */}
      <footer className="py-20 px-6 bg-[#001f3f] relative z-30">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Image src="/logop.png" alt="Prefeitura SGA" width={160} height={60} className="brightness-0 invert opacity-60" />
            <p className={`${jakarta.className} text-[9px] font-black text-white/30 uppercase tracking-[0.4em]`}>Cidade Amada · Pará · Brasil</p>
          </div>
          <div className="flex flex-col items-center md:items-start gap-4">
            <Image src="/prefeitura.png" alt="Prefeitura SGA" width={160} height={60} className="brightness-0 invert opacity-90" />
            <p className={`${jakarta.className} text-[9px] font-black text-white/30 uppercase tracking-[0.4em]`}>Cidade Amada · Pará · Brasil</p>
          </div>
          <div className="flex gap-4">
             <Link href="/eventos" className={`${jakarta.className} bg-white/5 text-white/60 px-6 py-3 rounded-full text-[10px] font-bold uppercase hover:bg-[#F9C400] hover:text-[#002f40] transition-all tracking-widest`}>Ver Agenda</Link>
             <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-3 rounded-full text-[10px] font-bold uppercase hover:bg-white hover:text-[#002f40] transition-all tracking-widest shadow-xl`}>Cartão Digital</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}