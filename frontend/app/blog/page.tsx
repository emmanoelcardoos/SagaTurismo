'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, ChevronDown, Loader2, Newspaper
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM ──
type BlogPost = {
  id: string;
  titulo: string;
  imagem_url: string;
  data_publicacao: string;
  ativo?: boolean;
};

// ── MOTOR DE ANIMAÇÕES ──
function useScrollAnimation(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); }
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
    case "fade-up": hiddenClass = "opacity-0 translate-y-12"; break;
    case "fade-left": hiddenClass = "opacity-0 translate-x-12"; break;
    case "fade-right": hiddenClass = "opacity-0 -translate-x-12"; break;
    case "zoom-in": hiddenClass = "opacity-0 scale-95"; break;
  }
  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0 scale-100" : hiddenClass} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── HEADER FIXO BRANCO (SEM TRANSPARÊNCIA) ──
function Header() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y < 80) setShowHeader(true);
      else if (y > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(y);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const menuGroups = [
  { 
    label: 'Descobrir', 
    links: ['Atrativos', 'História', 'Biodiversidade', 'Comunidades', 'Galeria', 'Eventos'] 
  },
  { 
    label: 'Planejar', 
    links: ['Hospedagens', 'Gastronomia', 'Agências', 'Informações', 'CAT'] 
  },
  { 
    label: 'Institucional', 
    links: ['SEMTUR', 'COMTUR', 'Parceiros'] 
  },
];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} bg-white border-b border-slate-200 shadow-sm`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
        <div className="flex-1">
          <Link href="/" className="inline-flex items-center gap-3 transition-all duration-300">
            <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
              <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center justify-center gap-12">
          {menuGroups.map((group) => (
            <div key={group.label} className="relative group py-2">
              <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] transition-colors text-slate-600 group-hover:text-[#00577C]`}>
                {group.label} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
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
          <Link href="/cadastro"
            className={`hidden lg:inline-flex ${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm`}>
            Residente
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
            {isMobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
          </button>
        </div>
      </div>

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
        </div>
      )}
    </header>
  );
}

// ── COMPONENTE PRINCIPAL ──
export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2069";

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('blog')
        .select('id, titulo, imagem_url, data_publicacao')
        .eq('ativo', true)
        .order('data_publicacao', { ascending: false });

      if (error) {
        console.error("Erro ao buscar blog:", error);
      } else if (data) {
        setPosts(data as BlogPost[]);
      }
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '';
    const date = new Date(dataStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col`}>
      <Header />

      {/* ── TÍTULO DA PÁGINA (CENTRALIZADO) ── */}
      <div className="pt-32 md:pt-36 pb-12 px-6 max-w-[1400px] mx-auto w-full text-center">
        <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight`}>
          Blog Andorinhas
        </h1>
        <p className="text-slate-500 text-base md:text-lg font-medium mt-3">
          Notícias, roteiros e novidades sobre turismo em São Geraldo do Araguaia
        </p>
      </div>

      {/* ── GRELHA DE NOTÍCIAS ── */}
      <section className="mx-auto max-w-[1400px] px-6 pb-16 md:pb-24 w-full flex-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-4">
                <div className="w-full aspect-[4/3] rounded-2xl bg-slate-200" />
                <div className="w-24 h-4 bg-slate-200 rounded" />
                <div className="w-full h-8 bg-slate-200 rounded" />
                <div className="w-3/4 h-8 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-2xl mx-auto">
            <Newspaper className="text-slate-300 w-16 h-16 mb-6" />
            <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-2`}>Nenhuma publicação encontrada</h3>
            <p className="text-slate-500">Em breve teremos novidades e roteiros publicados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {posts.map((post, index) => (
              <AnimatedSection key={post.id} animation="fade-up" delay={index * 50}>
                <Link href={`/blog/${post.id}`} className="group flex flex-col gap-5 block h-full">
                  
                  {/* Imagem */}
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                    <Image 
                      src={post.imagem_url || FALLBACK_IMAGE} 
                      alt={post.titulo} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-out" 
                    />
                  </div>

                  <div className="flex flex-col items-start text-left gap-3">
                    {/* Data discreta */}
                    {post.data_publicacao && (
                      <span className="text-[12px] font-bold text-slate-400/80 tracking-widest">
                        {formatarData(post.data_publicacao)}
                      </span>
                    )}

                    {/* Título principal a negrito */}
                    <h3 className={`${jakarta.className} text-2xl md:text-[26px] font-black text-slate-900 leading-[1.2] group-hover:text-[#00577C] transition-colors`}>
                      {post.titulo}
                    </h3>
                    
                    {/* Link "Leia mais" ao estilo clássico */}
                    <span className="text-[#00577C] text-[13px] mt-1 font-bold tracking-wide underline underline-offset-4 decoration-slate-200 group-hover:decoration-[#00577C] transition-colors">
                      Leia mais
                    </span>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        )}
      </section>

      {/* ── FOOTER INSTITUCIONAL ── */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-[#FDFCF7] text-left mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1 text-center md:text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">© 2026 Prefeitura Munícipal de São Geraldo do Araguaia - PA</p>
              <p className="text-[10px] font-bold text-slate-400/80">CNPJ: 10.249.241/0001-22</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}