'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, MapPin, ArrowRight, Loader2, Utensils, Fish, Flame,
  ShieldCheck
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// ── FONTES PADRÃO DO SITE ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM DA TABELA 'gastronomia' ──
type PratoTipico = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_url: string;
};

// ── MOTOR DE ANIMAÇÕES DE SCROLL ──
function useScrollAnimation(threshold = 0.15) {
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
  let hiddenClass = "";
  switch (animation) {
    case "fade-up": hiddenClass = "opacity-0 translate-y-16"; break;
    case "fade-left": hiddenClass = "opacity-0 translate-x-16"; break;
    case "fade-right": hiddenClass = "opacity-0 -translate-x-16"; break;
    case "zoom-in": hiddenClass = "opacity-0 scale-95"; break;
  }
  return (
    <div ref={ref} className={`transition-all duration-[1000ms] ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0 scale-100" : hiddenClass} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function GastronomiaPage() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pratos, setPratos] = useState<PratoTipico[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar dados da gastronomia ao Supabase
  useEffect(() => {
    async function fetchGastronomia() {
      const { data, error } = await supabase
        .from('gastronomia')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (data) setPratos(data);
      if (error) console.error("Erro ao buscar gastronomia:", error);
      setLoading(false);
    }
    fetchGastronomia();
  }, []);

  // Lógica de esconder/mostrar Header no scroll
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
    <main className={`${inter.className} bg-white text-slate-900 overflow-x-hidden min-h-screen`}>
      
      {/* ── HEADER PADRÃO ── */}
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
            {['Hoteis', 'Pacotes', 'Rotas','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
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

      {/* ── HERO SECTION GASTRONOMIA ── */}
      <section className="relative min-h-[80vh] flex items-center justify-center pt-28 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-[#002f40]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <video 
            src="/gastronomia.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80" 
            />
           <div className="absolute inset-0 bg-[#002f40]/10" />
        </div>

        <div className="relative z-10 text-center px-5 max-w-4xl pt-10">
          <AnimatedSection animation="zoom-in">
            <h1 className={`${jakarta.className} text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tight leading-tight mb-6 drop-shadow-xl`}>
              Cultura & <span className="text-[#F9C400]">Gastronomia</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/80 font-medium leading-relaxed drop-shadow-md max-w-2xl mx-auto">
              Descubra os nossos temperos, a frescura dos nossos pescados e as receitas que passam de geração em geração.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── LISTAGEM DOS PRATOS (ZIGZAG LAYOUT) ── */}
      <section className="py-24 md:py-32 bg-white relative">
        <div className="mx-auto max-w-7xl px-5 relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Preparando a mesa...</p>
            </div>
          ) : pratos.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[2rem]">
              <Utensils className="mx-auto w-16 h-16 text-slate-300 mb-4" />
              <h3 className={`${jakarta.className} text-2xl font-bold text-slate-500`}>Nenhuma experiência gastronómica cadastrada.</h3>
            </div>
          ) : (
            <div className="space-y-24 md:space-y-36">
              {pratos.map((prato, index) => {
                const isPar = index % 2 === 0;

                return (
                  <div key={prato.id} className={`flex flex-col gap-10 lg:gap-16 items-center ${isPar ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                    
                    {/* BLOCO DA IMAGEM */}
                    <AnimatedSection animation={isPar ? "fade-right" : "fade-left"} className="w-full lg:w-1/2">
                      <div className="relative aspect-[4/3] md:aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 group">
                        <Image 
                          src={prato.imagem_url} 
                          alt={prato.titulo} 
                          fill 
                          className="object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />
                        
                        <div className="absolute bottom-6 left-6 bg-[#F9C400] px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00577C] shadow-md">
                          <Flame size={14}/> Sabor Local
                        </div>
                      </div>
                    </AnimatedSection>

                    {/* BLOCO DO TEXTO */}
                    <AnimatedSection animation={isPar ? "fade-left" : "fade-right"} className="w-full lg:w-1/2 text-left">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-8 h-1 rounded-full bg-[#009640]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#009640]">Cozinha local {String(index + 1).padStart(2, '0')}</span>
                      </div>
                      
                      <h2 className={`${jakarta.className} text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6`}>
                        {prato.titulo}
                      </h2>
                      
                      <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-8 font-medium">
                        {prato.descricao_curta}
                      </p>
                      
                      <div className="flex items-center gap-4">
                        <Link 
                          href={`/gastronomia/${prato.id}`} 
                          className="inline-flex items-center gap-3 bg-[#00577C] text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#004a6b] hover:shadow-xl hover:-translate-y-1 transition-all group"
                        >
                            Ver Detalhes do restaurante
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                      {/* Micro Detalhes Decorativos */}
                      <div className="grid grid-cols-2 gap-4 mt-10 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#00577C] shrink-0">
                            <Fish size={20} />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Origem</p>
                            <p className="text-sm font-black text-slate-700 leading-none mt-0.5">Ribeirinha</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-yellow-50 border border-yellow-100 flex items-center justify-center text-[#d9a000] shrink-0">
                            <MapPin size={20} />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mapa</p>
                            <p className="text-sm font-black text-slate-700 leading-none mt-0.5">Restaurantes</p>
                          </div>
                        </div>
                      </div>

                    </AnimatedSection>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de São Geraldo do Araguaia" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1">
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