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

  const menuItens = ['Hoteis', 'Agencias', 'Rotas', 'Passeios', 'Atracoes', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'];
  const genericImage = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09';

  return (
    <main className={`${inter.className} bg-[#FDFCF7] text-slate-900 overflow-x-hidden min-h-screen flex flex-col`}>
      
      {/* ── HEADER ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {menuItens.map(item => (
              <Link key={item} href={`/${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
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
            {menuItens.map(item => (
              <Link key={item} href={`/${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2 transition-colors`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>
              Cartão Residente
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO SECTION CLEAN ── */}
      <section className="relative min-h-[55vh] flex items-center justify-center pt-28 pb-16 overflow-hidden bg-[#002f40] mt-[72px] md:mt-[80px]">
        {/* Background Suave com Imagem Transparente */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/remanso1.png"
            alt="Comunidades"
            fill
            className="object-cover opacity-100 mix-blend-overlay"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-slate-900/40 z-0" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <AnimatedSection animation="zoom-in">
            <h1 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6 drop-shadow-xl`}>
              Nossas <span className="italic text-[#F9C400]">Comunidades</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 font-medium leading-relaxed drop-shadow-md max-w-2xl mx-auto">
              Gente que mantém viva a história, a cultura e a alma do território. Entre, escute e sinta-se em casa.
            </p>
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
                    <div className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all p-4 md:p-6 flex flex-col ${isPar ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 overflow-hidden group`}>
                      
                      {/* BLOCO DA IMAGEM */}
                      <div className="relative w-full h-[350px] lg:h-[450px] lg:w-1/2 rounded-3xl overflow-hidden bg-slate-100 shrink-0">
                        <Image
                          src={comunidade.imagem_url || genericImage}
                          alt={comunidade.titulo}
                          fill
                          className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-700" />
                      
                      </div>

                      {/* BLOCO DE TEXTO */}
                      <div className="flex-1 py-4 lg:py-12 px-2 lg:px-6 flex flex-col justify-center">
                        <h2 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6`}>
                          {comunidade.titulo}
                        </h2>

                        <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-8 font-medium">
                          {comunidade.descricao_curta}
                        </p>

                        <div className="mt-auto pt-8 border-t border-slate-100 flex">
                          <Link
                            href={`/comunidades/${comunidade.id}`}
                            className="group/btn inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-lg bg-[#00577C] text-white hover:bg-[#004a6b] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
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