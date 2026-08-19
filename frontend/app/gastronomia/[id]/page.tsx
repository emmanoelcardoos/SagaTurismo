'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, ArrowLeft, ArrowRight, MapPin, Phone, MessageCircle,
  ChefHat, Leaf, Star, Clock, Users, Camera, Utensils, Heart,
  ExternalLink, Loader2, ChevronLeft, ChevronRight, Quote,
  ShieldCheck, ChevronDown
} from 'lucide-react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';



// ── FONTS ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });

// ── TYPES ──
type MenuItem = { prato: string; preco: string; desc: string };

// ── TYPES ──
type Especialidade = { titulo: string; imagem_url: string };

type Restaurante = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_url: string;
  imagem_capa: string | null;
  sobre_nos_texto: string | null;
  foto_equipe_url: string | null;
  galeria: string[] | null;
  especialidades: Especialidade[] | null; // ◄── A NOSSA NOVA COLUNA
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

  // ── MENU AGRUPADO (PADRÃO VINCI) ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'Rotas', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hospedagens', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

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

  // Usa imagem_capa se existir, senão fallback para imagem_url
  const capaImagem = restaurante.imagem_capa || restaurante.imagem_url;

  return (
    <main className={`${jakarta.className} bg-[#faf8f4] text-slate-900 overflow-x-hidden min-h-screen`}>

      {/* ── HEADER EDITORIAL CENTRALIZADO ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}>
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

      {/* ── HERO REDUZIDO (COM IMAGEM CAPA HORIZONTAL) ── */}
            {/* ── HERO FULLSCREEN (COM IMAGEM_CAPA E BOTÃO VOLTAR) ── */}
      <section className="relative w-full h-[75vh] min-h-[600px]">
        <Image
          src={restaurante.imagem_capa || restaurante.imagem_url}
          alt={restaurante.titulo}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent" />

        {/* Botão Voltar */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
          <Link
            href="/gastronomia"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm border border-white/10"
          >
            <ArrowLeft size={14} /> Voltar
          </Link>
        </div>

        {/* Hero text — bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-14 pb-14 md:pb-20">
          <Reveal animation="fade-up" delay={100}>
            <h1 className={`${jakarta.className} text-5xl sm:text-6xl md:text-8xl font-black text-white leading-[1.0] drop-shadow-xl mb-6 max-w-4xl`}>
              {restaurante.titulo}
            </h1>
          </Reveal>
        </div>
      </section>

      {/* ── ESPECIALIDADES DA CASA (VISUAL & PREMIUM) ── */}
      {restaurante.especialidades && restaurante.especialidades.length > 0 && (
        <section className="py-20 md:py-32 bg-[#FDFCF7] relative overflow-hidden">
          <div className="mx-auto max-w-[1400px] px-6 md:px-12">
            
            <Reveal animation="fade-up">
              <div className="text-center mb-12 md:mb-20">
                
                <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black text-slate-900`}>
                  Especialidades da Casa
                </h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {restaurante.especialidades.map((item, i) => (
                <Reveal key={i} delay={i * 100} animation="fade-up">
                  <div className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-lg border-4 border-white cursor-pointer bg-slate-100">
                    <Image 
                      src={item.imagem_url} 
                      alt={item.titulo} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-[2000ms]" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-center translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md`}>
                        {item.titulo}
                      </h3>
                      <div className="w-8 h-1 bg-[#F9C400] mx-auto mt-4 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* ── GALERIA DE FOTOS (AMBIENTE E COMIDA) ── */}
      {galeria.length > 0 && (
        <section className="py-20 md:py-32 bg-white relative">
          <div className="mx-auto max-w-7xl px-5 md:px-10">
            <Reveal animation="fade-up">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12 md:mb-16">
                <div>
                  <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black text-slate-900`}>
                    Nossos Momentos & Pratos
                  </h2>
                </div>
              </div>
            </Reveal>
            <Gallery images={galeria} />
          </div>
        </section>
      )}

      
      

      {/* ── MAPA / LOCALIZAÇÃO (SOFT & CLEAN) ── */}
      <section className="py-20 md:py-32 bg-[#FDFCF7] border-t border-slate-100 relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <Reveal animation="fade-right">
              <div>
                
                <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-8`}>
                  Venha nos visitar
                </h2>
                <p className="text-slate-500 text-base leading-relaxed font-medium mb-10 max-w-sm">
                  Estamos localizados em São Geraldo do Araguaia. Venha desfrutar de uma experiência gastronómica num ambiente acolhedor e familiar.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  {restaurante.link_google_maps && (
                    <a
                      href={restaurante.link_google_maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${jakarta.className} inline-flex items-center justify-center gap-3 bg-[#00577C] text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#004a6b] transition-transform shadow-xl w-fit`}
                    >
                      <MapPin size={16} /> Google Maps
                    </a>
                  )}
                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${jakarta.className} inline-flex items-center justify-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl w-fit`}
                    >
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </Reveal>

            <Reveal animation="fade-left" delay={200}>
              <div className="relative">
                {restaurante.link_google_maps ? (
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100">
                    <iframe
                      src={`https://maps.google.com/maps?q=S%C3%A3o+Geraldo+do+Araguaia+Par%C3%A1+Brasil&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                      className="w-full h-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Localização do restaurante"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 flex flex-col items-center justify-center gap-4 border border-slate-200">
                    <MapPin className="w-16 h-16 text-slate-300" />
                    <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-slate-400`}>
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
      <footer className="py-20 px-8 border-t border-slate-200 bg-[#FDFCF7] text-left mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de SGA" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1 text-center md:text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                © 2026 Prefeitura Munícipal de São Geraldo do Araguaia - PA
              </p>
              <p className="text-[10px] font-bold text-slate-400/80">
                CNPJ: 10.249.241/0001-22
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* ── WHATSAPP FLOATING BUTTON ── */}
      {whatsappNumber && <WhatsAppFloat phone={whatsappNumber} />}

    </main>
  );
}