'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, ArrowLeft, ArrowRight, MapPin, Phone, MessageCircle,
  ChefHat, Leaf, Star, Clock, Users, Camera, Utensils, Heart,
  ExternalLink, Loader2, ChevronLeft, ChevronRight, Quote,
  ShieldCheck
} from 'lucide-react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

// ── FONTS ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });

// ── TYPES ──
type MenuItem = { prato: string; preco: string; desc: string };

type Restaurante = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_url: string;
  sobre_nos_texto: string | null;
  foto_equipe_url: string | null;
  galeria: string[] | null;
  cardapio: MenuItem[] | null;
  whatsapp: string | null;
  link_google_maps: string | null;
};

// ── SCROLL ANIMATION HOOK ──
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
  children: ReactNode; className?: string;
  animation?: 'fade-up' | 'fade-left' | 'fade-right' | 'zoom-in' | 'fade-down';
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();
  const hiddenMap = {
    'fade-up': 'opacity-0 translate-y-14',
    'fade-down': 'opacity-0 -translate-y-8',
    'fade-left': 'opacity-0 translate-x-14',
    'fade-right': 'opacity-0 -translate-x-14',
    'zoom-in': 'opacity-0 scale-95',
  };
  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-out will-change-transform ${isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : hiddenMap[animation]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── WHATSAPP FLOAT BUTTON ──
function WhatsAppFloat({ phone }: { phone: string }) {
  const number = phone.replace(/\D/g, '');
  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-[#25D366] text-white px-5 py-3.5 rounded-full shadow-2xl hover:scale-105 hover:shadow-[0_8px_40px_rgba(37,211,102,0.45)] transition-all group"
    >
      <MessageCircle className="w-5 h-5" />
      <span className={`${jakarta.className} text-[11px] font-black uppercase tracking-widest`}>
        Fazer reserva
      </span>
    </a>
  );
}

// ── GALLERY LIGHTBOX ──
function Gallery({ images }: { images: string[] }) {
  const [active, setActive] = useState<number | null>(null);
  const prev = () => setActive(i => (i !== null ? (i - 1 + images.length) % images.length : 0));
  const next = () => setActive(i => (i !== null ? (i + 1) % images.length : 0));
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setActive(null);
    };
    if (active !== null) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active]);
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((url, i) => (
          <Reveal key={i} delay={i * 80} animation="zoom-in">
            <div
              onClick={() => setActive(i)}
              className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-shadow"
            >
              <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-all duration-300 flex items-center justify-center">
                <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7" />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      {active !== null && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center" onClick={() => setActive(null)}>
          <div className="relative w-full max-w-4xl px-4" onClick={e => e.stopPropagation()}>
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
              <Image src={images[active]} alt="Galeria" fill className="object-contain" />
            </div>
            <button onClick={prev} className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 backdrop-blur-sm text-white p-3 rounded-full transition-all">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={next} className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 backdrop-blur-sm text-white p-3 rounded-full transition-all">
              <ChevronRight className="w-6 h-6" />
            </button>
            <button onClick={() => setActive(null)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/25 backdrop-blur-sm text-white p-2 rounded-full transition-all">
              <X className="w-5 h-5" />
            </button>
            <p className="text-center text-white/50 mt-4 text-sm font-medium">{active + 1} / {images.length}</p>
          </div>
        </div>
      )}
    </>
  );
}

// ── MAIN PAGE ──
export default function RestaurantePage() {
  const params = useParams();
  const id = params?.id as string;
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState<number | null>(null);

  useEffect(() => {
    async function fetchRestaurante() {
      const { data, error } = await supabase
        .from('gastronomia')
        .select('*')
        .eq('id', id)
        .single();
      if (data) setRestaurante(data);
      if (error) console.error('Erro:', error);
      setLoading(false);
    }
    if (id) fetchRestaurante();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 60);
      if (currentScrollY < 80) setShowHeader(true);
      else if (currentScrollY > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#00577C] w-12 h-12" />
        <p className={`${jakarta.className} text-xs font-black uppercase tracking-widest text-slate-400`}>
          Preparando a mesa...
        </p>
      </div>
    );
  }

  if (!restaurante) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <Utensils className="w-16 h-16 text-slate-300" />
        <h2 className={`${jakarta.className} text-2xl font-black text-slate-500`}>Restaurante não encontrado.</h2>
        <Link href="/gastronomia" className="text-[#00577C] font-bold underline underline-offset-4">
          Voltar à lista
        </Link>
      </div>
    );
  }

  const galeria = restaurante.galeria ?? [];
  const cardapio = restaurante.cardapio ?? [];
  const whatsappNumber = restaurante.whatsapp?.replace(/\D/g, '');

  return (
    <main className={`${jakarta.className} bg-[#faf8f4] text-slate-900 overflow-x-hidden min-h-screen`}>

      {/* ── HEADER ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
              <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Roteiros', 'Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro"
              className={`${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
              Cartão Residente
            </Link>
          </nav>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            {['Hoteis', 'Pacotes', 'Roteiros', 'Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro"
              className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>
              Cartão Residente
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO FULLSCREEN ── */}
      <section className="relative w-full h-screen min-h-[640px]">
        <Image
          src={restaurante.imagem_url}
          alt={restaurante.titulo}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/25 to-slate-900/30" />

        {/* Hero text — bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-14 pb-14 md:pb-24">
          <Reveal animation="fade-up" delay={100}>
            <h1 className={`${jakarta.className} text-5xl sm:text-6xl md:text-8xl font-black text-white leading-[1.0] drop-shadow-xl mb-6 max-w-4xl`}>
              {restaurante.titulo}
            </h1>
            <p className="text-white/70 text-base md:text-xl font-medium max-w-2xl leading-relaxed">
              {restaurante.descricao_curta}
            </p>
          </Reveal>
        </div>

        {/* Action badges top-right */}
        <div className="absolute top-24 right-6 md:right-14 flex flex-col gap-3">
            {whatsappNumber && (
              <Reveal animation="fade-left" delay={300}>
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-[#25D366] text-white px-4 py-2.5 rounded-full shadow-lg hover:scale-105 transition-all"
                >
                  <MessageCircle size={16} />
                  <span className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest`}>WhatsApp</span>
                </a>
              </Reveal>
            )}
            {restaurante.link_google_maps && (
              <Reveal animation="fade-left" delay={400}>
                <a
                  href={restaurante.link_google_maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-white/90 backdrop-blur-sm text-slate-800 px-4 py-2.5 rounded-full shadow-lg hover:scale-105 transition-all"
                >
                  <MapPin size={16} className="text-red-500" />
                  <span className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest`}>Ver no mapa</span>
                </a>
              </Reveal>
            )}
        </div>
      </section>

      {/* ── SOBRE NÓS (FAMÍLIA) ── */}
      {(restaurante.sobre_nos_texto || restaurante.foto_equipe_url) && (
        <section className="py-20 md:py-32 bg-white relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 left-0 w-1/2 h-full bg-[#faf8f4] rounded-r-[5rem] pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-5 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

              {/* Photo side — LEFT */}
              {restaurante.foto_equipe_url && (
                <Reveal animation="fade-right">
                  <div className="relative">
                    <div className="relative aspect-[3/4] w-full rounded-[2.5rem] overflow-hidden shadow-2xl">
                      <Image
                        src={restaurante.foto_equipe_url}
                        alt="Equipa do restaurante"
                        fill
                        className="object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                    </div>
                    {/* Decorative tag */}
                    <div className={`${jakarta.className} absolute -bottom-5 -right-5 bg-[#F9C400] text-[#002f40] px-6 py-4 rounded-2xl shadow-xl font-black text-xs uppercase tracking-widest`}>
                      <p className="text-[10px] opacity-60">A equipe</p>
                      <p>Com amor & dedicação</p>
                    </div>
                    {/* Decorative circle */}
                    <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full border-4 border-[#009640]/30 pointer-events-none" />
                    <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-[#009640]/10 pointer-events-none" />
                  </div>
                </Reveal>
              )}

              {/* Text side — RIGHT */}
              <Reveal animation="fade-left" delay={200}>
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#F9C400]/20 flex items-center justify-center">
                      <Heart size={18} className="text-[#F9C400]" />
                    </div>
                    <span className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.3em] text-[#009640]`}>
                      Nossa história
                    </span>
                  </div>

                  <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-8`}>
                    Uma família,<br />
                    <span className="text-[#00577C]">uma mesa.</span>
                  </h2>

                  {restaurante.sobre_nos_texto && (
                    <div className="relative">
                      <Quote className="absolute -top-4 -left-4 w-10 h-10 text-[#F9C400]/30" />
                      <p className="text-slate-600 text-base md:text-lg leading-relaxed font-medium pl-4 border-l-4 border-[#F9C400]/40">
                        {restaurante.sobre_nos_texto}
                      </p>
                    </div>
                  )}

                  <div className="mt-10 grid grid-cols-3 gap-4">
                    {[
                      { icon: <Leaf size={20} className="text-[#009640]" />, label: 'Ingredientes Frescos', bg: 'bg-green-50 border-green-100' },
                      { icon: <ChefHat size={20} className="text-[#00577C]" />, label: 'Receita de Família', bg: 'bg-blue-50 border-blue-100' },
                      { icon: <Star size={20} className="text-[#d9a000]" />, label: 'Sabor Autêntico', bg: 'bg-yellow-50 border-yellow-100' },
                    ].map((item, i) => (
                      <Reveal key={i} delay={i * 100 + 200} animation="fade-up">
                        <div className={`${item.bg} border rounded-2xl p-4 text-center`}>
                          <div className="flex justify-center mb-2">{item.icon}</div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 leading-tight">{item.label}</p>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ── CARDÁPIO DIGITAL ── */}
      {cardapio.length > 0 && (
        <section className="py-20 md:py-32 bg-[#faf8f4] relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-5 md:px-10">
            <Reveal animation="fade-up">
              <div className="text-center mb-16 md:mb-20">
                <div className="flex items-center justify-center gap-3 mb-5">
                  <span className="w-8 h-0.5 rounded-full bg-[#009640]" />
                  <span className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.3em] text-[#009640]`}>
                    Cardápio digital
                  </span>
                  <span className="w-8 h-0.5 rounded-full bg-[#009640]" />
                </div>
                <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black text-slate-900`}>
                  O que temos para si
                </h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {cardapio.map((item, i) => (
                <Reveal key={i} delay={i * 120} animation="fade-up">
                  <div
                    onClick={() => setActiveMenuItem(activeMenuItem === i ? null : i)}
                    className={`relative bg-white rounded-[1.75rem] p-8 border cursor-pointer group transition-all duration-500 overflow-hidden ${activeMenuItem === i ? 'border-[#00577C] shadow-xl shadow-[#00577C]/10' : 'border-slate-100 hover:border-slate-200 hover:shadow-lg'}`}
                  >
                    {/* Number */}
                    <span className={`${jakarta.className} absolute top-6 right-8 text-7xl font-black text-slate-100 group-hover:text-slate-200 transition-colors leading-none pointer-events-none select-none`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 leading-tight`}>
                          {item.prato}
                        </h3>
                        <span className={`${jakarta.className} shrink-0 text-base md:text-lg font-black text-[#00577C] bg-blue-50 px-4 py-2 rounded-full`}>
                          {item.preco}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed font-medium">
                        {item.desc}
                      </p>

                      {/* Expandable details */}
                      <div className={`overflow-hidden transition-all duration-500 ${activeMenuItem === i ? 'max-h-40 mt-5' : 'max-h-0'}`}>
                        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#009640]" />
                          <p className="text-sm text-slate-500 font-medium">Disponível todos os dias • Servido no restaurante</p>
                        </div>
                        {whatsappNumber && (
                          <a
                            href={`https://wa.me/${whatsappNumber}?text=Olá! Gostaria de reservar uma mesa para experimentar: ${item.prato}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className={`${jakarta.className} mt-4 inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform`}
                          >
                            <MessageCircle size={13} />
                            Reservar este prato
                          </a>
                        )}
                      </div>

                      <div className={`mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeMenuItem === i ? 'text-[#00577C]' : 'text-slate-300 group-hover:text-slate-400'}`}>
                        <span>{activeMenuItem === i ? 'Fechar' : 'Ver mais'}</span>
                        <ArrowRight size={12} className={`transition-transform ${activeMenuItem === i ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GALERIA DE FOTOS ── */}
      {galeria.length > 0 && (
        <section className="py-20 md:py-32 bg-white relative">
          <div className="mx-auto max-w-7xl px-5 md:px-10">
            <Reveal animation="fade-up">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12 md:mb-16">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-0.5 rounded-full bg-[#F9C400]" />
                    <span className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.3em] text-[#F9C400]`}>
                      Galeria
                    </span>
                  </div>
                  <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black text-slate-900`}>
                    Momentos & Pratos
                  </h2>
                </div>
                <p className="text-slate-400 text-sm font-medium max-w-xs md:text-right">
                  Clique em qualquer foto para ampliar e navegar pela galeria.
                </p>
              </div>
            </Reveal>
            <Gallery images={galeria} />
          </div>
        </section>
      )}

      {/* ── MAPA / LOCALIZAÇÃO ── */}
      <section className="py-20 md:py-32 bg-[#002f40] relative overflow-hidden">
        {/* Decorative ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Info */}
            <Reveal animation="fade-right">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-0.5 rounded-full bg-[#F9C400]" />
                  <span className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.3em] text-[#F9C400]`}>
                    Onde encontrar
                  </span>
                </div>
                <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black text-white leading-[1.1] mb-8`}>
                  Venha nos visitar
                </h2>
                <p className="text-white/60 text-base leading-relaxed font-medium mb-10 max-w-sm">
                  Estamos localizados em São Geraldo do Araguaia, no coração da região ribeirinha. Fácil acesso e estacionamento disponível.
                </p>

                <div className="flex flex-col gap-4">
                  {restaurante.link_google_maps && (
                    <a
                      href={restaurante.link_google_maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${jakarta.className} inline-flex items-center gap-3 bg-[#F9C400] text-[#002f40] px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl w-fit`}
                    >
                      <MapPin size={16} />
                      Abrir no Google Maps
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${jakarta.className} inline-flex items-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl w-fit`}
                    >
                      <MessageCircle size={16} />
                      Falar no WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </Reveal>

            {/* Map embed or decorative placeholder */}
            <Reveal animation="fade-left" delay={200}>
              <div className="relative">
                {restaurante.link_google_maps ? (
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                    <iframe
                      src={`https://maps.google.com/maps?q=S%C3%A3o+Geraldo+do+Araguaia+Par%C3%A1+Brasil&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                      className="w-full h-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Localização do restaurante"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4">
                    <MapPin className="w-16 h-16 text-[#F9C400]/40" />
                    <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-white/30`}>
                      São Geraldo do Araguaia
                    </p>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-16 md:py-24 bg-white text-center px-5">
        <Reveal animation="zoom-in">
          <div className="max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#F9C400]/15 flex items-center justify-center mx-auto mb-6">
              <Utensils className="w-6 h-6 text-[#d9a000]" />
            </div>
            <h3 className={`${jakarta.className} text-3xl md:text-5xl font-black text-slate-900 mb-5`}>
              Explore mais sabores
            </h3>
            <p className="text-slate-500 font-medium mb-8 text-base leading-relaxed">
              Descubra outros restaurantes e experiências gastronómicas únicas de São Geraldo do Araguaia.
            </p>
            <Link
              href="/gastronomia"
              className={`${jakarta.className} inline-flex items-center gap-3 bg-[#00577C] text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#004a6b] hover:shadow-xl hover:-translate-y-1 transition-all shadow-lg`}
            >
              <ArrowLeft size={16} />
              Ver todos os restaurantes
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
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

      {/* ── WHATSAPP FLOATING BUTTON ── */}
      {whatsappNumber && <WhatsAppFloat phone={whatsappNumber} />}

    </main>
  );
}