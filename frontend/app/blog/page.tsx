'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Loader2, Newspaper, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM ──
type BlogPost = {
  id: string;
  titulo: string;
  resumo?: string;
  imagem_url: string;
  categoria?: string;
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

// ── COMPONENTE PRINCIPAL ──
export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideAtual, setSlideAtual] = useState(0);

  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2069";

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('blog')
        .select('*')
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

  // Notícias em destaque para o carrossel (5 primeiras com imagem)
  const noticiasDestaque = posts.filter(p => p.imagem_url).slice(0, 5);

  // Autoplay do carrossel
  useEffect(() => {
    if (noticiasDestaque.length <= 1) return;
    const intervalo = setInterval(() => {
      setSlideAtual((prev) => (prev === noticiasDestaque.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(intervalo);
  }, [noticiasDestaque.length]);

  const proximoSlide = () => setSlideAtual((prev) => (prev === noticiasDestaque.length - 1 ? 0 : prev + 1));
  const slideAnterior = () => setSlideAtual((prev) => (prev === 0 ? noticiasDestaque.length - 1 : prev - 1));

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '';
    const date = new Date(dataStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Limpar HTML do resumo
  const obterResumo = (post: BlogPost) => {
    let texto = post.resumo || '';
    if (texto.includes("<")) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = texto;
      texto = tempDiv.textContent || tempDiv.innerText || texto;
    }
    texto = texto.replace(/&nbsp;/g, ' ');
    if (texto.length > 150) texto = texto.substring(0, 150) + '...';
    return texto;
  };

  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col`}>

      {/* ══════════════════════════════════════
          HERO CARROSSEL — SEMMAS STYLE
      ══════════════════════════════════════ */}
      <section className="relative w-full h-[85vh] min-h-[550px] overflow-hidden bg-[#002f40] flex items-center justify-center pt-16">
        {loading ? (
          <Loader2 className="animate-spin text-white/50" size={40} />
        ) : noticiasDestaque.length > 0 ? (
          <>
            {noticiasDestaque.map((post, idx) => (
              <div 
                key={post.id} 
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === slideAtual ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <Image 
                  src={post.imagem_url} 
                  alt={post.titulo} 
                  fill 
                  className={`object-cover transition-transform duration-[10000ms] ${idx === slideAtual ? 'scale-105' : 'scale-100'}`}
                  priority={idx === 0} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#002f40]/95 via-[#002f40]/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 w-full px-6 pb-20 md:pb-24 pt-32">
                  <div className="max-w-7xl mx-auto flex flex-col items-start">
                    <span className="bg-[#F9C400] text-[#002f40] text-[10px] sm:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 shadow-lg">
                      {post.categoria || "Notícias"}
                    </span>
                    <Link href={`/blog/${post.id}`} className="group max-w-4xl cursor-pointer">
                      <h2 className={`${jakarta.className} text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] drop-shadow-xl group-hover:text-[#F9C400] transition-colors line-clamp-3`}>
                        {post.titulo}
                      </h2>
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Setas */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 px-4 md:px-12 flex justify-between z-20 pointer-events-none">
              <button onClick={slideAnterior} className="pointer-events-auto w-12 h-12 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110">
                <ChevronLeft size={24} />
              </button>
              <button onClick={proximoSlide} className="pointer-events-auto w-12 h-12 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110">
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {noticiasDestaque.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSlideAtual(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${idx === slideAtual ? 'w-8 bg-[#F9C400]' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                  aria-label={`Ir para o slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 z-0">
            <Image 
              src={FALLBACK_IMAGE} 
              alt="Blog Andorinhas" 
              fill 
              className="object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-[#002f40]/60 mix-blend-multiply" />
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <h1 className={`${jakarta.className} text-[3rem] font-black text-white uppercase tracking-widest`}>
                BLOG ANDORINHAS
              </h1>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════
          TÍTULO DA PÁGINA
      ══════════════════════════════════════ */}
      <div className="pt-16 md:pt-20 pb-8 px-6 max-w-[1400px] mx-auto w-full text-center">
        <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight`}>
          Notícias & <span className="italic text-[#F9C400]">Roteiros</span>
        </h1>
        <p className="text-slate-500 text-base md:text-lg font-medium mt-3">
          Notícias, roteiros e novidades sobre turismo em São Geraldo do Araguaia
        </p>
      </div>

      {/* ══════════════════════════════════════
          GRELHA DE NOTÍCIAS
      ══════════════════════════════════════ */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {posts.map((post, index) => (
              <AnimatedSection key={post.id} animation="fade-up" delay={index * 50}>
                <Link href={`/blog/${post.id}`} className="group flex flex-col gap-4 block h-full">
                  
                  {/* Imagem */}
                  <div className="relative w-full aspect-[4/3] rounded-[1.25rem] overflow-hidden bg-slate-100 shadow-sm">
                    <Image 
                      src={post.imagem_url || FALLBACK_IMAGE} 
                      alt={post.titulo} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                    />
                  </div>

                  {/* Categoria + Data */}
                  <div className="flex items-center justify-between mt-2">
                    {post.categoria && (
                      <span className="text-[0.65rem] font-bold text-[#00577C] uppercase tracking-wider bg-[#00577C]/10 px-3 py-1 rounded-full">
                        {post.categoria}
                      </span>
                    )}
                    {post.data_publicacao && (
                      <span className="text-[0.75rem] font-bold text-slate-400 tracking-wider">
                        {formatarData(post.data_publicacao)}
                      </span>
                    )}
                  </div>

                  {/* Título */}
                  <h3 className={`${jakarta.className} text-xl md:text-[1.35rem] font-black text-[#002f40] leading-tight group-hover:text-[#00577C] transition-colors line-clamp-3`}>
                    {post.titulo}
                  </h3>

                  {/* Resumo (se existir) */}
                  {post.resumo && obterResumo(post) && (
                    <p className="text-sm text-slate-500 font-medium line-clamp-2">
                      {obterResumo(post)}
                    </p>
                  )}

                  {/* Leia mais */}
                  <span className="text-[0.85rem] font-bold text-[#00577C] mt-auto pt-2 group-hover:underline flex items-center gap-1">
                    Ler notícia completa <ChevronRight size={14} />
                  </span>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        )}
      </section>

      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}