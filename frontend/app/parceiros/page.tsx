'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { ArrowLeft, Menu, X, Building2, ClipboardList, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── ÍCONE DO WHATSAPP (SVG) ──
const WhatsAppIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export default function ParceirosPage() {
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

  // Contatos e Links
  const whatsappNumber = "55949844949474"; 
  const googleFormsLink = "https://docs.google.com/forms/d/e/1FAIpQLScUnwAEfwvfbjwf5w81F_3OynXVNDdCBx9QsDmxtunXftQchg/viewform?usp=publish-editor";

  return (
    <main className={`${inter.className} min-h-screen flex flex-col bg-[#002f40] relative overflow-hidden`}>

      {/* Foto de fundo com overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/IMG_1804.PNG"
          alt="Parceiros do Turismo em São Geraldo do Araguaia"
          fill
          className="object-cover opacity-25 md:opacity-35"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#002f40]/70 via-[#002f40]/60 to-[#002f40]/30 md:from-[#002f40]/50 md:via-[#002f40]/40 md:to-[#002f40]/20" />
      </div>

      {/* Halo amarelo — canto superior direito */}
      <div className="absolute top-0 right-0 z-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(249,196,0,0.15) 0%, transparent 65%)' }} />

      {/* Halo verde — canto inferior esquerdo */}
      <div className="absolute bottom-0 left-0 z-0 w-[250px] h-[250px] md:w-[460px] md:h-[360px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(0,150,64,0.15) 0%, transparent 65%)' }} />

      {/* ── HEADER (COMPLETO E NAVEGÁVEL) ── */}
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
            {['Hoteis', 'Pacotes', 'Atracoes', 'Passeios', 'Biodiversidade', 'Gastronomia', 'Comunidades', 'Parceiros'].map(item => (
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
      <div className="relative z-10 flex-1 flex flex-col justify-center mt-16 md:mt-20">
        <div className="w-full max-w-[1400px] mx-auto px-5 md:px-14 py-10 md:py-0">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">

            {/* Coluna esquerda — texto */}
            <div className="flex flex-col gap-8 md:gap-10">

              {/* Título */}
              <div className="flex flex-col gap-1">
                <h1 className={`${jakarta.className} font-black text-white leading-[0.97]`}
                  style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
                  A nossa
                </h1>
                <h1 className={`${jakarta.className} font-black text-[#F9C400] leading-[0.97]`}
                  style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
                  rede
                </h1>
                <h1 className={`${jakarta.className} font-black text-white/30 leading-[0.97]`}
                  style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
                  começa aqui.
                </h1>
              </div>

              {/* Descrições */}
              <div className="flex flex-col gap-5">
                <p className={`${inter.className} text-white/70 text-sm md:text-lg leading-relaxed max-w-md`}>
                  Hoteleiros, guias turísticos, restaurantes e agentes de viagens poderão anunciar os seus negócios <strong className="text-white">gratuitamente</strong> na página oficial de turismo de São Geraldo do Araguaia.
                </p>
                <p className={`${inter.className} text-[#F9C400] text-sm md:text-base font-medium leading-relaxed max-w-md`}>
                  Tem um negócio voltado para o turismo local e quer garantir o seu espaço? Preencha o cadastro abaixo.
                </p>
              </div>

              {/* CTAs de Contato (Botões empilhados no mobile) */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 w-full max-w-md">
                <a
                  href={googleFormsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${jakarta.className} w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#009640] hover:bg-[#007a33] text-white px-7 py-4 md:py-4 rounded-xl md:rounded-full font-black text-xs uppercase tracking-widest transition-all duration-200 shadow-lg`}
                >
                  <ClipboardList size={18} />
                  Fazer Cadastro
                </a>
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${jakarta.className} w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white px-7 py-4 md:py-4 rounded-xl md:rounded-full font-black text-xs uppercase tracking-widest transition-all duration-200 border border-white/5`}
                >
                  <WhatsAppIcon size={18} />
                  Dúvidas?
                </a>
              </div>
              
              <Link
                href="/"
                className={`${jakarta.className} group inline-flex items-center justify-center sm:justify-start gap-3 text-white/40 hover:text-white mt-2 font-black text-xs uppercase tracking-widest transition-all duration-200`}
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Voltar ao Início
              </Link>
            </div>

            {/* Coluna direita — foto estática de apoio (Oculta em telas muito pequenas, visível de tablet para cima) */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative w-full max-w-[420px] aspect-[3/4] rounded-[2.5rem] overflow-hidden"
                style={{ boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7)' }}>
                <Image
                  src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/IMG_1804.PNG"
                  alt="Rede de Parceiros"
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
                    <Building2 size={14} className="text-[#F9C400]" />
                    <p className={`${jakarta.className} text-white/40 text-[9px] font-black uppercase tracking-[0.3em]`}>
                      Portal de Serviços
                    </p>
                  </div>
                  <p className={`${jakarta.className} text-white font-black text-xl leading-snug`}>
                    Visibilidade para <br /> o seu Negócio
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-6 md:py-7 border-t border-white/5 mt-8 md:mt-0">
        <div className="w-full max-w-[1400px] mx-auto px-5 md:px-14 flex flex-col md:flex-row justify-center md:justify-between items-center gap-4 text-center md:text-left">
          <p className={`${jakarta.className} text-[9px] md:text-[10px] font-bold text-white/20 uppercase tracking-widest`}>
            © {new Date().getFullYear()} Prefeitura Municipal de São Geraldo do Araguaia — Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </main>
  );
}