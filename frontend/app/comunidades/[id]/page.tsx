'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import {
  Menu, X, ArrowLeft, ArrowRight,
  BookOpen, Users, Camera, Bed, Utensils, Compass, Loader2,
  ShieldCheck
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// ── FONTES ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPOS ──
type CardDestaque = {
  titulo: string;
  imagem_url: string;
  link: string;
};

type Comunidade = {
  id: string;
  titulo: string;
  descricao_curta: string;
  historia_texto?: string;
  cultura_texto?: string;
  imagem_url: string;
  galeria?: string[];
  atracoes_destaque?: CardDestaque[];
  hospedagens_destaque?: CardDestaque[];
  gastronomia_destaque?: CardDestaque[];
};

// ── MOTOR DE ANIMAÇÕES ──
function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);
  return { ref, isVisible };
}

function Reveal({ children, className = '', animation = 'fade-up', delay = 0 }: {
  children: ReactNode; className?: string; animation?: 'fade-up' | 'fade-left' | 'fade-right'; delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();
  const hiddenMap = {
    'fade-up': 'opacity-0 translate-y-14',
    'fade-left': 'opacity-0 translate-x-14',
    'fade-right': 'opacity-0 -translate-x-14',
  };
  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? 'opacity-100 translate-y-0 translate-x-0' : hiddenMap[animation]} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── COMPONENTE CARD DE DESTAQUE ──
function DestaqueCard({ item, icone, cor }: { item: CardDestaque; icone: ReactNode; cor: string }) {
  return (
    <div className="group relative w-full h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden shadow-lg border border-slate-100">
      <Image src={item.imagem_url} alt={item.titulo} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80" />
      
      <div className="absolute bottom-6 left-6 right-6 flex flex-col items-start gap-4">
        <h4 className={`${jakarta.className} text-xl md:text-2xl font-black text-white leading-tight`}>{item.titulo}</h4>
        <Link href={item.link} className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">
          <span style={{ color: cor }}>{icone}</span> Ver Detalhes <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default function ComunidadeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [comunidade, setComunidade] = useState<Comunidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    async function fetchComunidade() {
      const { data } = await supabase.from('comunidades').select('*').eq('id', id).single();
      if (data) setComunidade(data);
      setLoading(false);
    }
    if (id) fetchComunidade();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      setShowHeader(y < 80 || y < lastScrollY);
      setLastScrollY(y);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (loading) return <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center"><Loader2 className="animate-spin text-[#00577C] w-12 h-12" /></div>;
  if (!comunidade) return <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center text-slate-500 font-bold">Comunidade não encontrada.</div>;

  return (
    <main className={`${inter.className} bg-[#FDFCF7] text-slate-900 overflow-x-hidden min-h-screen`}>
      
      {/* ── HEADER ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                {/* Removido o filtro invertido para manter as cores originais da logo */}
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Rotas','Passeios', 'Aldeias','Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
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

      {/* ── HERO BANNER CINEMATOGRÁFICO ── */}
      <section className="relative h-[85vh] w-full flex items-end pb-24 px-6 md:px-12 overflow-hidden bg-[#001f2e]">
        <Image src={comunidade.imagem_url} alt={comunidade.titulo} fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001f2e] via-[#001f2e]/40 to-transparent" />
        
        <div className="relative z-10 max-w-[1400px] w-full mx-auto">
          <Reveal animation="fade-up">
            <h1 className={`${jakarta.className} text-[clamp(3.5rem,8vw,7rem)] font-black text-white leading-[0.9] mb-6 drop-shadow-xl`}>
              {comunidade.titulo}
            </h1>
            <p className="text-white/70 text-lg md:text-xl font-medium max-w-2xl leading-relaxed mb-8">
              {comunidade.descricao_curta}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── A HISTÓRIA ── */}
      <section className="py-24 md:py-32 bg-[#FDFCF7]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <Reveal animation="fade-right" className="lg:col-span-5 sticky top-32">
              <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-6`}>
                Raízes que<br /><span className="text-[#00577C]">resistem ao tempo.</span>
              </h2>
              <div className="flex items-center gap-4 text-slate-400">
                <Users size={24} className="text-[#F9C400]" />
                <p className="text-sm font-bold uppercase tracking-widest">Herança Viva</p>
              </div>
            </Reveal>
            
            <Reveal animation="fade-left" delay={150} className="lg:col-span-7">
              <div className="prose prose-lg prose-slate text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                {comunidade.historia_texto || "A história desta comunidade está a ser documentada pela nossa equipa de património cultural."}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CULTURA & EDUCAÇÃO ── */}
      <section className="py-24 md:py-32 bg-[#002f40] text-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <Reveal animation="fade-up" className="text-center max-w-3xl mx-auto mb-16">
            <BookOpen size={40} className="mx-auto text-[#009640] mb-6" />
            <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black mb-6`}>Cultura & Saberes</h2>
            <p className="text-white/60 text-lg leading-relaxed">
              {comunidade.cultura_texto || "Conhecimentos passados de geração em geração, que formam a identidade única desta comunidade."}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── O QUE VIVER AQUI (CARDS REAIS VINDOS DA SUPABASE) ── */}
      {(comunidade.atracoes_destaque?.length || comunidade.hospedagens_destaque?.length || comunidade.gastronomia_destaque?.length) ? (
        <section className="py-24 md:py-32 bg-white border-t border-slate-100">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <Reveal animation="fade-up" className="mb-16 text-center md:text-left">
              <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900`}>Viver a <span className="text-[#F9C400]">Comunidade</span></h2>
              <p className="text-slate-500 mt-4 font-medium">Recomendações diretas de quem conhece a região melhor do que ninguém.</p>
            </Reveal>

            <div className="space-y-20">
              
              {/* Atrações */}
              {comunidade.atracoes_destaque && comunidade.atracoes_destaque.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                    <Compass className="text-[#009640]" size={24} />
                    <h3 className={`${jakarta.className} text-2xl font-black text-slate-800`}>O que fazer e visitar</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {comunidade.atracoes_destaque.map((item, i) => (
                      <Reveal key={i} delay={i * 100}><DestaqueCard item={item} icone={<Compass size={14}/>} cor="#009640" /></Reveal>
                    ))}
                  </div>
                </div>
              )}

              {/* Gastronomia */}
              {comunidade.gastronomia_destaque && comunidade.gastronomia_destaque.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                    <Utensils className="text-[#d9a000]" size={24} />
                    <h3 className={`${jakarta.className} text-2xl font-black text-slate-800`}>Onde comer</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {comunidade.gastronomia_destaque.map((item, i) => (
                      <Reveal key={i} delay={i * 100}><DestaqueCard item={item} icone={<Utensils size={14}/>} cor="#F9C400" /></Reveal>
                    ))}
                  </div>
                </div>
              )}

              {/* Hospedagem */}
              {comunidade.hospedagens_destaque && comunidade.hospedagens_destaque.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                    <Bed className="text-[#00577C]" size={24} />
                    <h3 className={`${jakarta.className} text-2xl font-black text-slate-800`}>Onde ficar</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {comunidade.hospedagens_destaque.map((item, i) => (
                      <Reveal key={i} delay={i * 100}><DestaqueCard item={item} icone={<Bed size={14}/>} cor="#00577C" /></Reveal>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>
      ) : null}

      {/* ── GALERIA DE FOTOS ── */}
      {comunidade.galeria && comunidade.galeria.length > 0 && (
        <section className="py-24 bg-[#FDFCF7] border-t border-slate-100 overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-12">
            <Reveal animation="fade-right">
              <h2 className={`${jakarta.className} text-4xl font-black text-slate-900 flex items-center gap-3`}>
                <Camera className="text-[#F9C400]" size={32} /> Retratos do dia a dia
              </h2>
            </Reveal>
          </div>
          <div className="flex gap-4 px-6 md:px-12 overflow-x-auto snap-x snap-mandatory pb-8 hide-scrollbar">
            {comunidade.galeria.map((url, i) => (
              <Reveal key={i} animation="fade-left" delay={i * 100} className="shrink-0 snap-center">
                <div className="relative w-[300px] h-[400px] md:w-[450px] md:h-[550px] rounded-[2.5rem] overflow-hidden shadow-lg">
                  <Image src={url} alt={`Galeria ${i}`} fill className="object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      {/* FOOTER */}
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