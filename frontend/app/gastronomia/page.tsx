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
      
      {/* ── HEADER EDITORIAL CENTRALIZADO ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${lastScrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}>
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
                  {group.label}
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
            {['Conhecer', 'Viver', 'Planejar'].map((label) => (
              <div key={label} className="flex flex-col gap-3">
                <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.2em] text-[#00577C] border-b border-slate-100 pb-2`}>{label}</p>
                <div className="flex flex-wrap gap-2">
                  {label === 'Planejar' && ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'].map((link) => (
                    <Link key={link} href={`/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} font-bold text-slate-700 text-sm bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 hover:text-[#00577C] hover:bg-slate-100 transition-colors`}>
                      {link}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-4 mt-2">
              <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} w-full bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md block`}>
                Cartão Residente
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO EDITORIAL GASTRONOMIA (SOFT & CLEAN - SEM VÍDEO) ── */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 px-6 bg-[#FDFCF7] overflow-hidden mt-[40px] md:mt-[60px]">
        {/* Background Graphics */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F9C400]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00577C]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center relative z-10">
          
          <AnimatedSection animation="fade-right" className="lg:col-span-5 flex flex-col items-center text-center lg:items-start lg:text-left">
            

            <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6`}>
              Cultura &<br />
              <span className="italic text-[#F9C400]">Gastronomia.</span>
            </h1>

            <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium mb-10 text-justify md:text-left">
              Descubra os nossos temperos, a frescura dos pescados do Araguaia e as receitas de família que passam de geração em geração, servidas com autêntica hospitalidade ribeirinha.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-left" className="lg:col-span-7 w-full mt-4 lg:mt-0">
             <div className="relative w-full h-[400px] md:h-[500px] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-[4px] border-white z-10 group">
               <Image 
                 src="https://images.pexels.com/photos/3727208/pexels-photo-3727208.jpeg?_gl=1*heouuk*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODY2Nzg3MTQkbzgzJGcxJHQxNzg2Njc4NzY2JGo4JGwwJGgw" 
                 alt="Gastronomia Local" 
                 fill 
                 className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]" 
                 priority 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent" />
             </div>
          </AnimatedSection>

        </div>
      </section>

      {/* ── LISTAGEM DOS PRATOS (ZIGZAG LAYOUT) ── */}
      <section className="py-20 md:py-32 bg-[#FDFCF7] relative">
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
                          <Flame size={14}/> Restaurante Local
                        </div>
                      </div>
                    </AnimatedSection>

                    {/* BLOCO DO TEXTO */}
                    <AnimatedSection animation={isPar ? "fade-left" : "fade-right"} className="w-full lg:w-1/2 text-left">
                      
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
                            Conhecer o restaurante
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
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