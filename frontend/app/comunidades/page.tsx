'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { Menu, X, ArrowRight, Loader2, Users, ShieldCheck, MapPin } from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// ── FONTES PADRÃO ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM ──
type Comunidade = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_url: string;
  ordem?: number;
};

// ── MOTOR DE ANIMAÇÕES ──
function useScrollAnimation(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

function AnimatedSection({
  children,
  className = "",
  animation = "fade-up",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-left" | "fade-right" | "zoom-in";
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();
  let hiddenClass = "";
  switch (animation) {
    case "fade-up": hiddenClass = "opacity-0 translate-y-16"; break;
    case "fade-left": hiddenClass = "opacity-0 translate-x-16"; break;
    case "fade-right": hiddenClass = "opacity-0 -translate-x-16"; break;
    case "zoom-in": hiddenClass = "opacity-0 scale-95"; break;
  }
  return (
    <div
      ref={ref}
      className={`transition-all duration-[1000ms] ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0 scale-100" : hiddenClass} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function ComunidadesPage() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // Buscar comunidades
  useEffect(() => {
    async function fetchComunidades() {
      const { data, error } = await supabase
        .from('comunidades')
        .select('*')
        .order('ordem', { ascending: true });

      if (data) setComunidades(data);
      if (error) console.error("Erro ao buscar comunidades:", error);
      setLoading(false);
    }
    fetchComunidades();
  }, []);

  // Header dinâmico
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

  // ── MENU AGRUPADO (PADRÃO VINCI) ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'Rotas', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Passeios', 'Eventos', 'Comunidades', 'Aldeias'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  const genericImage = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09';

  return (
    <main className={`${inter.className} bg-[#FDFCF7] text-slate-900 overflow-x-hidden min-h-screen flex flex-col`}>
      
      {/* ── HEADER EDITORIAL CENTRALIZADO ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
          <div className="flex-1">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center justify-center gap-12">
            {menuGroups.map((group) => (
              <div key={group.label} className="relative group py-2">
                <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-[#00577C] transition-colors`}>
                  {group.label} <ArrowRight size={12} className="group-hover:rotate-90 transition-transform duration-300 opacity-0" />
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
            {menuGroups.map((group) => (
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

      {/* ── HERO EDITORIAL COMUNIDADES (IMAGEM EXPANDIDA) ── */}
      {/* ── HERO EDITORIAL COMUNIDADES (AJUSTADO & PROPORCIONAL) ── */}
      <section className="relative pt-6 pb-12 md:pt-10 md:pb-16 px-6 bg-[#FDFCF7] overflow-hidden mt-[72px] md:mt-[80px]">
        {/* Background Graphics Suaves */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F9C400]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#00577C]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center relative z-10">
          
          <AnimatedSection animation="fade-right" className="lg:col-span-4 flex flex-col items-center text-center lg:items-start lg:text-left">
            
            <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] mb-6 tracking-tight`}>
              As Nossas<br />
              <span className="italic text-[#00577C]">Comunidades.</span>
            </h1>
            
            <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium text-justify md:text-left">
              Gente que mantém viva a história, a cultura e a alma do território. Descubra vilas pacatas, saberes tradicionais e a verdadeira acolhida ribeirinha.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-left" className="lg:col-span-8 w-full mt-4 lg:mt-0">
             <div className="relative w-full h-[380px] sm:h-[450px] md:h-[520px] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-[4px] border-white z-10 group">
               <Image 
                 src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/remanso1.png" 
                 alt="Cultura e Povo de São Geraldo" 
                 fill 
                 className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]" 
                 priority 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
             </div>
          </AnimatedSection>

        </div>
      </section>

      {/* ── LISTAGEM COMUNIDADES LADO-A-LADO ── */}
      <section className="py-24 md:py-32 relative z-20 max-w-[1400px] mx-auto px-6 w-full -mt-10 bg-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
            <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Viajando até as comunidades...
            </p>
          </div>
        ) : comunidades.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
            <Users className="mx-auto w-16 h-16 text-slate-300 mb-4" />
            <h3 className={`${jakarta.className} text-2xl font-bold text-slate-500`}>
              Nenhuma comunidade cadastrada.
            </h3>
          </div>
        ) : (
          <div className="space-y-16 md:space-y-24">
            {comunidades.map((comunidade, index) => {
              const isPar = index % 2 === 0;

              return (
                <div key={comunidade.id} className="relative">
                  <AnimatedSection animation="fade-up">
                    <div className={`bg-white rounded-[3rem] border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-2xl transition-all duration-500 p-4 md:p-6 flex flex-col ${isPar ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 overflow-hidden group`}>
                      
                      {/* BLOCO DA IMAGEM */}
                      <div className="relative w-full h-[350px] lg:h-[450px] lg:w-1/2 rounded-[2.5rem] overflow-hidden bg-slate-100 shrink-0">
                        <Image
                          src={comunidade.imagem_url || genericImage}
                          alt={comunidade.titulo}
                          fill
                          className="object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-700" />
                        
                        <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm text-[#00577C]">
                          <MapPin size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Comunidade Local</span>
                        </div>
                      </div>

                      {/* BLOCO DE TEXTO */}
                      <div className="flex-1 py-4 lg:py-12 px-4 lg:px-8 flex flex-col justify-center">
                        <h2 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6`}>
                          {comunidade.titulo}
                        </h2>

                        <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-8 font-medium">
                          {comunidade.descricao_curta}
                        </p>

                        <div className="mt-auto pt-8 border-t border-slate-100 flex">
                          <Link
                            href={`/comunidades/${comunidade.id}`}
                            className="group/btn inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-[#00577C]/20 bg-[#00577C] text-white hover:bg-[#004a6b] transition-all duration-300 hover:-translate-y-1"
                          >
                            Conhecer a comunidade
                            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>

                    </div>
                  </AnimatedSection>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left mt-auto">
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