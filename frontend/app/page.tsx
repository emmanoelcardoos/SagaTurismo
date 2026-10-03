'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  ArrowRight, Star, ExternalLink, Hotel,
  CalendarDays, MapPin, Ticket,
  Loader2, Compass, CheckCircle2, X,
  Phone, Mail, Clock
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import MinhaReservaModal from '@/components/MinhaReservaModal';


// ── FONTES ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ==========================================
// MOTOR DE ANIMAÇÕES DE SCROLL
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
                  
                  <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 shadow-sm">
                    <Image 
                      src={post.imagem_url || FALLBACK_IMAGE} 
                      alt={post.titulo} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-out" 
                    />
                  </div>
                  
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
// COMPONENTE: AGENDA CULTURAL (OCULTO)
// ==========================================
function AgendaCultural() {
  return null;
}

// ==========================================
// COMPONENTE: SECÇÃO DE SUPORTE (SEM IMAGEM)
// ==========================================
function SeccaoSuporte() {
  return (
    <div className="flex flex-col h-full">
      <h2 className={`${jakarta.className} text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-[0.95] tracking-tight mb-6`}>
        Precisa de<br />
        <span className="italic text-[#00577C]">alguma ajuda?</span>
      </h2>

      <p className="text-slate-500 text-base leading-relaxed mb-8 font-medium flex-1">
        Teve problemas com a emissão da sua Carteira Digital, dúvidas sobre
        passeios ou não encontrou o que procurava? A nossa equipe de suporte
        está pronta para resolver o seu caso rapidamente.
      </p>

      <Link
        href="/suporte"
        className="inline-flex items-center justify-center gap-3 bg-[#00577C] text-white px-7 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#004a6b] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 self-start"
      >
        Contatar Suporte <ArrowRight size={16} />
      </Link>
    </div>
  );
}

// ==========================================
// COMPONENTE: NEWSLETTER HOME (SEM IMAGEM)
// ==========================================
function NewsletterHome() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);

  async function handleSubmeter(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMensagem({ texto: 'Por favor, insira um e-mail válido.', tipo: 'erro' });
      return;
    }

    setLoading(true);
    setMensagem(null);

    try {
      const { error } = await supabase
        .from('newsletter_inscritos')
        .insert([{ email }]);

      if (error) {
        if (error.code === '23505') {
          setMensagem({ texto: 'Este e-mail já se encontra cadastrado!', tipo: 'erro' });
        } else {
          throw error;
        }
      } else {
        await fetch('https://sagaturismo-production.up.railway.app/api/v1/newsletter/boas-vindas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email })
        });

        setMensagem({ texto: 'Inscrição realizada com sucesso! Verifique a sua caixa de entrada.', tipo: 'sucesso' });
        setEmail('');
      }
    } catch (err) {
      setMensagem({ texto: 'Erro ao processar inscrição. Tente novamente.', tipo: 'erro' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className={`${jakarta.className} text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-[0.95] tracking-tight mb-6`}>
        A sua próxima<br />
        <span className="italic text-[#00577C]">aventura começa aqui.</span>
      </h2>

      <p className="text-slate-500 text-base leading-relaxed mb-8 font-medium flex-1">
        Inscreva-se para receber roteiros exclusivos, avisos sobre novos eventos
        culturais e descontos especiais diretamente no seu e-mail.
      </p>

      <form onSubmit={handleSubmeter} className="flex flex-col gap-3 w-full">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="O seu melhor e-mail..."
          className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm rounded-2xl px-5 py-4 focus:outline-none focus:border-[#00577C] focus:ring-2 focus:ring-[#00577C]/20 transition-all shadow-sm"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#00577C] hover:bg-[#004a6b] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 hover:-translate-y-0.5"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Inscrever'}
        </button>
      </form>

      {mensagem && (
        <div className={`mt-5 inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold w-fit ${
          mensagem.tipo === 'sucesso'
            ? 'bg-green-50 text-[#009640] border border-green-100'
            : 'bg-red-50 text-red-500 border border-red-100'
        }`}>
          {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={18} /> : <X size={18} />}
          {mensagem.texto}
        </div>
      )}
    </div>
  );
}

// ==========================================
// SECÇÃO SUPORTE + NEWSLETTER LADO A LADO
// ==========================================
function SeccaoSuporteNewsletter() {
  return (
    <section className="py-24 bg-white overflow-hidden border-t border-slate-100">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
          
          <AnimatedSection animation="fade-right" className="h-full">
            <SeccaoSuporte />
          </AnimatedSection>

          <AnimatedSection animation="fade-left" delay={150} className="h-full">
            <NewsletterHome />
          </AnimatedSection>

        </div>
      </div>
    </section>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL: HOMEPAGE
// ==========================================
export default function HomePage() {
  // ◄── ESTADO DO MODAL DE RESERVAS ──►
  const [isReservaModalOpen, setIsReservaModalOpen] = useState(false);

  // ── REF PARA O VÍDEO ──
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── EFECTO PARA CONTROLAR A VELOCIDADE DO VÍDEO ──
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.00;
    }
  }, []);

  return (
    <main className={`${inter.className} bg-[#FDFCF7] text-slate-900 overflow-x-hidden`}>

      {/* ── VISÃO GERAL DA CIDADE (HERO MODERNO & CLEAN) ── */}
      <section className="relative h-[100dvh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
  
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="object-cover w-full h-full"
            src="/turismo1.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-slate-900/60" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-4xl mx-auto">
          
          <AnimatedSection animation="fade-up" className="flex flex-col items-center w-full">
            
            <div className="flex flex-col items-center leading-none mb-6 w-full">
              <h1 className={`${jakarta.className} flex flex-col items-center w-full`}>
                <span className="text-4xl md:text-6xl lg:text-7xl text-white font-black tracking-tight drop-shadow-lg">
                  SÃO GERALDO DO 
                </span>
                
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

        {/* ── ONDA DE TRANSIÇÃO ── */}
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

      {/* ── ROTA TURÍSTICA — BENTO GRID REFINADO ── */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5">
            
            {/* 1. Parque Serra das Andorinhas */}
            <AnimatedSection animation="fade-up" delay={0} className="md:col-span-1 lg:col-span-3">
              <Link href="/biodiversidade" className="relative h-[260px] md:h-[280px] rounded-[2rem] overflow-hidden group block shadow-md hover:shadow-xl transition-all duration-500 border border-slate-100/10">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] group-hover:scale-105" style={{ backgroundImage: "url('https://images.pexels.com/photos/18064280/pexels-photo-18064280.jpeg?_gl=1*1at0h8g*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk1MDQ0MjUkbzUyJGcxJHQxNzc5NTA0ODIxJGo1OSRsMCRoMA..')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col items-start">
                  <h3 className={`${jakarta.className} text-2xl md:text-3xl font-bold drop-shadow-sm`}>Parque Serra das Andorinhas</h3>
                </div>
              </Link>
            </AnimatedSection>

            {/* 2. Atrativos */}
            <AnimatedSection animation="fade-up" delay={100} className="md:col-span-1 lg:col-span-3">
              <Link href="/atrativos" className="relative h-[260px] md:h-[280px] rounded-[2rem] overflow-hidden group block shadow-md hover:shadow-xl transition-all duration-500 border border-slate-100/10">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] group-hover:scale-105" style={{ backgroundImage: "url('https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/atracoes/casapedra.png')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col items-start">
                  <h3 className={`${jakarta.className} text-2xl md:text-3xl font-bold drop-shadow-sm`}>Atrativos</h3>
                </div>
              </Link>
            </AnimatedSection>

            {/* 3. Gastronomia */}
            <AnimatedSection animation="fade-up" delay={200} className="md:col-span-1 lg:col-span-2">
              <Link href="/gastronomia" className="relative h-[240px] md:h-[260px] rounded-[2rem] overflow-hidden group block shadow-md hover:shadow-xl transition-all duration-500 border border-slate-100/10">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] group-hover:scale-105" style={{ backgroundImage: "url('https://images.pexels.com/photos/4791748/pexels-photo-4791748.jpeg?_gl=1*17bsc2t*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODY4NDQzNTkkbzkyJGcxJHQxNzg2ODQ5MTUzJGo1OSRsMCRoMA..')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col items-start">
                  <h3 className={`${jakarta.className} text-xl md:text-2xl font-bold drop-shadow-sm`}>Gastronomia</h3>
                </div>
              </Link>
            </AnimatedSection>

            {/* 4. Agências */}
            <AnimatedSection animation="fade-up" delay={300} className="md:col-span-1 lg:col-span-2">
              <Link href="/agencias" className="relative h-[240px] md:h-[260px] rounded-[2rem] overflow-hidden group block shadow-md hover:shadow-xl transition-all duration-500 border border-slate-100/10">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] group-hover:scale-105" style={{ backgroundImage: "url('https://images.pexels.com/photos/8828425/pexels-photo-8828425.jpeg?_gl=1*uh3hye*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODY4MzgyNjgkbzkwJGcxJHQxNzg2ODM4MzAzJGoyNSRsMCRoMA..')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col items-start">
                  <h3 className={`${jakarta.className} text-xl md:text-2xl font-bold drop-shadow-sm`}>Agências</h3>
                </div>
              </Link>
            </AnimatedSection>

            {/* 5. Hospedagens */}
            <AnimatedSection animation="fade-up" delay={400} className="md:col-span-2 lg:col-span-2">
              <Link href="/hospedagens" className="relative h-[240px] md:h-[260px] rounded-[2rem] overflow-hidden group block shadow-md hover:shadow-xl transition-all duration-500 border border-slate-100/10">
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

      {/* ── ÚLTIMAS DO BLOG ── */}
      <UltimosArtigosBlog />
      
      {/* ── HISTÓRIA ── */}
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

      {/* ── CARTÃO RESIDENTE ── */}
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
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#F9C400]/15 rounded-full blur-3xl pointer-events-none" />
              
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

      {/* ── SECÇÃO SUPORTE + NEWSLETTER (LADO A LADO, SEM IMAGENS) ── */}
      <SeccaoSuporteNewsletter />

      {/* ── FOOTER PRÓPRIO DA HOME (completo) ── */}
      <footer className="border-t border-slate-200 bg-[#FDFCF7] py-16 px-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Primeira linha: logos */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-200">
            <div className="flex items-center gap-6 flex-wrap justify-center">
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

            {/* Coluna 3: Contatos e Suporte */}
            <div>
              <p className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-[#00577C] mb-4`}>Contatos e Suporte</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/contato" className="text-slate-600 hover:text-[#00577C] transition-colors">Contatos Úteis</Link></li>
                <li><Link href="/suporte" className="text-slate-600 hover:text-[#00577C] transition-colors">Suporte</Link></li>
                <li><Link href="/privacidade" className="text-slate-600 hover:text-[#00577C] transition-colors">Política de Privacidade</Link></li>
                <li><Link href="/termos" className="text-slate-600 hover:text-[#00577C] transition-colors">Termos de Uso</Link></li>
              </ul>
            </div>

            {/* Coluna 4: Planeje sua viagem */}
            <div>
              <p className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-[#00577C] mb-4`}>Planeje sua viagem</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/informacoes" className="text-slate-600 hover:text-[#00577C] transition-colors">Como Chegar</Link></li>
                <li><Link href="/eventos" className="text-slate-600 hover:text-[#00577C] transition-colors">Agenda de Eventos</Link></li>
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

          {/* Assinatura do desenvolvedor */}
          <div className="mt-8 flex justify-center md:justify-end">
            <p className="text-[10px] text-slate-400 tracking-widest uppercase flex items-center gap-2">
              Desenvolvido por{" "}
              <a 
                href="https://www.linkedin.com/in/emmanoel-cardoso-432668358/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-600 hover:text-[#00577C] transition-colors normal-case"
                style={{ fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive', fontSize: '18px' }}
              >
                Emmanoel Cardoso
              </a>
            </p>
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