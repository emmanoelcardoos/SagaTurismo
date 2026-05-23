'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, MapPin, ArrowRight, Loader2, Compass, TreePine, Leaf
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// ── FONTES PADRÃO DO SITE ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM DA TABELA 'rotas' ──
type RotaTuristica = {
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

export default function ComunidadesPage() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [comunidades, setComunidades] = useState<RotaTuristica[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar comunidades ao Supabase
  useEffect(() => {
    async function fetchComunidades() {
      const { data, error } = await supabase
        .from('comunidades')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (data) setComunidades(data);
      if (error) console.error("Erro ao buscar comunidades:", error);
      setLoading(false);
    }
    fetchComunidades();
  }, []);

  // Lógica de esconder/mostrar Header no scroll (Padrão do site)
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
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                {/* Removido o filtro invertido para manter as cores originais da logo */}
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Roteiros','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia'].map(item => (
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

      {/* ── HERO SECTION SEM EFEITO EMBAÇADO ── */}
      <section className="relative min-h-[80vh] flex items-center justify-center pt-28 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-[#002f40]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <video 
            src="/comunidades.mp4" 
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
            <h1 className={`${jakarta.className} text-4xl sm:text-5xl md:text-9xl font-black text-white tracking-tight leading-tight mb-6 drop-shadow-xl`}>
              Nossas <span className="text-[#F9C400]">Comunidades</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/80 font-medium leading-relaxed drop-shadow-md max-w-2xl mx-auto">
             Conheça comunidades tradicioanais. Viva suas culturas, histórias e tradicões
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── LISTAGEM DAS ROTAS (ZIGZAG LAYOUT) ── */}
      <section className="py-24 md:py-32 bg-white relative">
        <div className="mx-auto max-w-7xl px-5 relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Carregando comunidades...</p>
            </div>
          ) : comunidades.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[2rem]">
              <Compass className="mx-auto w-16 h-16 text-slate-300 mb-4" />
              <h3 className={`${jakarta.className} text-2xl font-bold text-slate-500`}>Pedimos desculpas</h3>
              <p className="text-slate-500">Não há comunidades cadastradas no momento.</p>
            </div>
          ) : (
            <div className="space-y-24 md:space-y-36">
              {comunidades.map((comunidade, index) => {
                const isPar = index % 2 === 0;

                return (
                  <div key={comunidade.id} className={`flex flex-col gap-10 lg:gap-16 items-center ${isPar ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                    
                    {/* BLOCO DA IMAGEM */}
                    <AnimatedSection animation={isPar ? "fade-right" : "fade-left"} className="w-full lg:w-1/2">
                      <div className="relative aspect-[4/3] md:aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 group">
                        <Image 
                          src={comunidade.imagem_url} 
                          alt={comunidade.titulo} 
                          fill 
                          className="object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />
                        
                      </div>
                    </AnimatedSection>

                    {/* BLOCO DO TEXTO */}
                    <AnimatedSection animation={isPar ? "fade-left" : "fade-right"} className="w-full lg:w-1/2 text-left">
                      
                      <h2 className={`${jakarta.className} text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6`}>
                        {comunidade.titulo}
                      </h2>
                      
                      <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-8 font-medium">
                        {comunidade.descricao_curta}
                      </p>
                      
                      <div className="flex items-center gap-4">
                        <Link 
                          href={`/comunidades/${comunidade.id}`} 
                          className="inline-flex items-center gap-3 bg-[#00577C] text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#004a6b] hover:shadow-xl hover:-translate-y-1 transition-all group"
                        >
                          Conhecer a comunidade
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                      {/* Micro Detalhes Decorativos */}
                      <div className="grid grid-cols-2 gap-4 mt-10 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-[#009640] shrink-0">
                            <TreePine size={20} />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Comunidade</p>
                            <p className="text-sm font-black text-slate-700 leading-none mt-0.5">Preservada</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#00577C] shrink-0">
                            <MapPin size={20} />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mapa</p>
                            <p className="text-sm font-black text-slate-700 leading-none mt-0.5">Interativo</p>
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
      <footer className="py-12 md:py-20 px-5 md:px-8 border-t border-slate-100 bg-white text-left">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-16 mb-12 md:mb-20 text-left">
            <div className="space-y-6 md:space-y-8 text-left">
               <img src="/logop.png" alt="Prefeitura SGA" className="h-16 md:h-20 object-contain" />
               <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">São Geraldo do Araguaia <br/> "Cidade Amada, seguindo em frente"</p>
            </div>
            
            <div className="space-y-4 md:space-y-6 text-left">
              <h5 className="font-black text-slate-900 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-100 pb-3 md:pb-4">Gestão Executiva</h5>
              <ul className="text-xs md:text-sm text-slate-500 space-y-2 md:space-y-3 font-medium">
                <li>Prefeito: <br/><b>Jefferson Douglas de Jesus Oliveira</b></li>
                <li>Vice-Prefeito: <br/><b>Marcos Antônio Candido de Lucena</b></li>
              </ul>
            </div>

            <div className="space-y-4 md:space-y-6 text-left">
              <h5 className="font-black text-slate-900 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-100 pb-3 md:pb-4">Turismo (SEMTUR)</h5>
              <ul className="text-xs md:text-sm text-slate-500 space-y-2 md:space-y-3 font-medium">
                <li>Secretária: <br/><b>Micheli Stephany de Souza</b></li>
                <li>Contato: <b>(94) 98145-2067</b></li>
                <li>Email: <b>setursaga@gmail.com</b></li>
              </ul>
            </div>

            <div className="space-y-4 md:space-y-6 text-left">
              <h5 className="font-black text-slate-900 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-100 pb-3 md:pb-4">Equipe Técnica</h5>
              <ul className="text-xs md:text-sm text-slate-500 space-y-2 font-medium">
                <li>• Adriana da Luz Lima</li>
                <li>• Carmelita Luz da Silva</li>
                <li>• Diego Silva Costa</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center pt-8 md:pt-10 border-t border-slate-50">
            <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] leading-relaxed">© 2026 Secretaria Municipal de Turismo - São Geraldo do Araguaia (PA)</p>
          </div>
        </div>
      </footer>
    </main>
  );
}