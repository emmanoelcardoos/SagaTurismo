'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { IdCard, ArrowRight, Menu, X, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';



const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function HomePage() {
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

      {/* ── BACKGROUND MOBILE FIRST ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/IMG_1803.PNG"
          alt="São Geraldo do Araguaia"
          fill
          // No mobile focamos mais na lateral (70%), no desktop volta pro centro. Opacidade reduzida no mobile.
          className="object-cover object-[70%_center] md:object-center opacity-15 md:opacity-20"
          priority
        />
        {/* Máscara inteligente: Escura no topo no mobile para proteger o texto, mais leve no desktop */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#002f40] via-[#002f40]/90 to-[#002f40]/20 md:from-[#002f40]/30 md:via-[#002f40]/20 md:to-[#002f40]/30" />
      </div>

      {/* Halo amarelo — canto superior direito */}
      <div className="absolute top-0 right-0 z-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(249,196,0,0.15) 0%, transparent 65%)' }} />

      {/* Halo verde — canto inferior esquerdo */}
      <div className="absolute bottom-0 left-0 z-0 w-[250px] h-[250px] md:w-[460px] md:h-[360px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(0,150,64,0.15) 0%, transparent 65%)' }} />

      {/* ── HEADER ORIGINAL (COMPLETO E NAVEGÁVEL) ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'bg-[#002f40]/95 backdrop-blur-md shadow-sm border-b border-white/10' : 'bg-transparent'}`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-9 w-24 md:h-12 md:w-36 shrink-0">
              <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain brightness-0 invert" />
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Atracoes', 'Passeios', 'Biodiversidade', 'Gastronomia', 'Comunidades','Parceiros'].map(item => (
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

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[#002f40] border-b border-white/10 p-5 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            {['Hoteis', 'Pacotes', 'Atracoes', 'Passeios', 'Biodiversidade', 'Gastronomia', 'Comunidades', 'Parceiros'].map(item => (
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

      {/* ── CONTEÚDO PRINCIPAL (MOBILE FIRST) ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center mt-24 md:mt-20"> 
        <div className="w-full max-w-[1400px] mx-auto px-5 md:px-14 py-10 md:py-0">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">

            {/* Coluna esquerda — texto */}
            <div className="flex flex-col gap-6 md:gap-10">

              {/* Título */}
              <div className="flex flex-col gap-1">
                <h1 className={`${jakarta.className} font-black text-white leading-[1.05] md:leading-[0.97]`}
                  style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
                  O novo portal
                </h1>
                <h1 className={`${jakarta.className} font-black text-[#F9C400] leading-[1.05] md:leading-[0.97]`}
                  style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
                  de turismo
                </h1>
                <h1 className={`${jakarta.className} font-black text-white/30 leading-[1.05] md:leading-[0.97]`}
                  style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
                  está chegando.
                </h1>
              </div>

              {/* Descrição */}
              <p className={`${inter.className} text-white/60 md:text-white/50 text-base md:text-lg leading-relaxed max-w-md`}>
                Uma nova experiência digital para explorar São Geraldo do Araguaia. Enquanto isso, a nossa Carteira de Residente já está disponível.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 w-full max-w-md mt-2 md:mt-0">
                <Link
                  href="/cadastro"
                  className={`${jakarta.className} group w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#009640] hover:bg-[#007a33] active:scale-95 text-white px-7 py-4 rounded-xl md:rounded-full font-black text-xs uppercase tracking-widest transition-all duration-200 shadow-lg shadow-[#009640]/20`}
                >
                  <IdCard size={24} className="md:w-7 md:h-7" />
                  Emitir Carteira
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/parceiros"
                  className={`${jakarta.className} group w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white px-7 py-4 rounded-xl md:rounded-full font-black text-xs uppercase tracking-widest transition-all duration-200 border border-white/5`}
                >
                  <Building2 size={24} className="md:w-7 md:h-7" />
                  Seja um parceiro
                </Link>
              </div>

            </div>

            {/* Coluna direita — foto (Oculta em telas muito pequenas) */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative w-full max-w-[420px] aspect-[3/4] rounded-[2.5rem] overflow-hidden"
                style={{ boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7)' }}>
                <Image
                  src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/IMG_1803.PNG"
                  alt="São Geraldo do Araguaia"
                  fill
                  className="object-cover"
                  style={{ filter: 'brightness(0.72) saturate(0.85)' }}
                  priority
                />
                {/* Gradiente inferior suave */}
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,47,64,0.85) 0%, transparent 60%)' }} />

                {/* Legenda discreta dentro da foto */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className={`${jakarta.className} text-white/50 text-[9px] font-black uppercase tracking-[0.3em] mb-1`}>
                    Pará · Brasil
                  </p>
                  <p className={`${jakarta.className} text-white font-black text-xl leading-snug`}>
                    São Geraldo<br />do Araguaia
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-6 md:py-7 border-t border-white/5 mt-8 md:mt-0">
        <div className="w-full max-w-[1400px] mx-auto px-5 md:px-14 flex justify-center md:justify-start">
          <p className={`${jakarta.className} text-[9px] md:text-[10px] font-bold text-white/20 uppercase tracking-widest text-center md:text-left`}>
            © {new Date().getFullYear()} Prefeitura Municipal de São Geraldo do Araguaia — Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </main>
  );
}