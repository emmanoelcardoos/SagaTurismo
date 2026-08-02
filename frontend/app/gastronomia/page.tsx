'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { ArrowLeft, Menu, X, Utensils, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function GastronomiaPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <main className={`${inter.className} min-h-screen flex flex-col bg-[#002f40] relative overflow-hidden`}>

      {/* Foto de fundo com overlay (Substituiu o vídeo) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.pexels.com/photos/3727208/pexels-photo-3727208.jpeg?_gl=1*16u1eqf*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODU3MDEwMTUkbzcxJGcxJHQxNzg1NzAxMjU5JGo0OCRsMCRoMA.."
          alt="Gastronomia de São Geraldo do Araguaia"
          fill
          className="object-cover opacity-55"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#002f40]/50 via-[#002f40]/40 to-[#002f40]/20" />
      </div>

      {/* Halo amarelo — canto superior direito */}
      <div className="absolute top-0 right-0 z-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(249,196,0,0.12) 0%, transparent 65%)' }} />

      {/* Halo verde — canto inferior esquerdo */}
      <div className="absolute bottom-0 left-0 z-0 w-[460px] h-[360px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(0,150,64,0.12) 0%, transparent 65%)' }} />

      {/* ── HEADER ORIGINAL (COMPLETO E NAVEGÁVEL) ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'bg-[#002f40]/95 backdrop-blur-md shadow-sm border-b border-white/10' : 'bg-transparent'}`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
              <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain brightness-0 invert" />
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Atracoes', 'Passeios', 'Biodiversidade', 'Gastronomia', 'Comunidades',  'Parceiros'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors`}
              >
                {item}
              </Link>
            ))}
            <Link href="/cadastro"
              className={`${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
              Residente
            </Link>
          </nav>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-xl p-2 lg:hidden bg-white/10 text-white hover:bg-white/20 transition-colors">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[#002f40] border-b border-white/10 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            {['Hoteis', 'Pacotes', 'Atracoes', 'Passeios', 'Biodiversidade', 'Parceiros'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${jakarta.className} font-black text-white/60 hover:text-white text-lg border-b border-white/10 pb-2 transition-colors`}>
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

      {/* ── CONTEÚDO PRINCIPAL (LAYOUT TEASER) ── */}
      <div className="relative z-10 flex-1 flex items-center mt-12 md:mt-16">
        <div className="w-full max-w-[1400px] mx-auto px-8 md:px-14 py-16 md:py-0">
          <div className="grid md:grid-cols-2 gap-14 md:gap-20 items-center">

            {/* Coluna esquerda — texto */}
            <div className="flex flex-col gap-10">

              {/* Título */}
              <div className="flex flex-col gap-1">
                <h1 className={`${jakarta.className} font-black text-white leading-[0.97]`}
                  style={{ fontSize: 'clamp(42px, 5.5vw, 72px)' }}>
                  O sabor da
                </h1>
                <h1 className={`${jakarta.className} font-black text-[#F9C400] leading-[0.97]`}
                  style={{ fontSize: 'clamp(42px, 5.5vw, 72px)' }}>
                  nossa terra
                </h1>
                <h1 className={`${jakarta.className} font-black text-white/30 leading-[0.97]`}
                  style={{ fontSize: 'clamp(42px, 5.5vw, 72px)' }}>
                  em breve.
                </h1>
              </div>

              {/* Descrição - Português do Brasil */}
              <p className={`${inter.className} text-white/50 text-base md:text-lg leading-relaxed max-w-md`}>
                Prepare-se para descobrir nossos temperos autênticos, os melhores restaurantes da região e receitas tradicionais passadas de geração em geração.
              </p>

              {/* CTA */}
              <Link
                href="/"
                className={`${jakarta.className} group inline-flex items-center gap-3 self-start bg-white/10 hover:bg-white/20 active:scale-95 text-white px-9 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-200 border border-white/5`}
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Voltar ao Início
              </Link>
            </div>

            {/* Coluna direita — foto estática de apoio */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative w-full max-w-[420px] aspect-[3/4] rounded-[2.5rem] overflow-hidden"
                style={{ boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7)' }}>
                <Image
                  src="https://images.pexels.com/photos/19781594/pexels-photo-19781594.jpeg?_gl=1*1i526k7*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODU3MDEwMTUkbzcxJGcxJHQxNzg1NzAxMTAxJGo1OSRsMCRoMA.."
                  alt="Gastronomia Local"
                  fill
                  className="object-cover"
                  style={{ filter: 'brightness(0.72) saturate(0.85)' }}
                  priority
                />
                {/* Gradiente inferior suave */}
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,47,64,0.85) 0%, transparent 50%)' }} />

                {/* Legenda discreta dentro da foto */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Utensils size={14} className="text-[#F9C400]" />
                    <p className={`${jakarta.className} text-white/40 text-[9px] font-black uppercase tracking-[0.3em]`}>
                      Cultura & Sabor
                    </p>
                  </div>
                  <p className={`${jakarta.className} text-white font-black text-xl leading-snug`}>
                    Guia de <br /> Restaurantes
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-7">
        <div className="w-full max-w-[1400px] mx-auto px-8 md:px-14 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className={`${jakarta.className} text-[10px] font-bold text-white/20 uppercase tracking-widest`}>
            © {new Date().getFullYear()} Prefeitura Municipal de São Geraldo do Araguaia — Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </main>
  );
}