'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Menu, X, Lock, Mail, Building2,
  Users2, HeartHandshake, Sprout, ShieldCheck,
  ArrowRight, Loader2, Bed, Compass, ClipboardList, ArrowLeft, ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

// ◄── IMPORTAÇÃO DO SUPABASE ──►
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type TipoPortal = 'hotel' | 'guia' | 'pacote';

function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setTimeout(() => setIsVisible(true), delay);
        if (domRef.current) observer.unobserve(domRef.current);
      }
    }, { threshold: 0.15 });
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
    >
      {children}
    </div>
  );
}

export default function ParceirosPage() {
  // ── CONTROLE DO HEADER ──
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Define se o header deve ficar sólido (bg branco)
      setIsHeaderSolid(currentScrollY > 80);

      // Lógica de mostrar/esconder ao rolar
      if (currentScrollY < 80) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // ── MENU AGRUPADO (PADRÃO VINCI) ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hospedagens', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col overflow-x-hidden`}>

      {/* ── HEADER INTELIGENTE TRANSPARENTE ── */}
      <header
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${
          (isHeaderSolid || isHovered || isMobileMenuOpen) 
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' 
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
          <div className="flex-1">
            <Link href="/" className="inline-flex items-center gap-3 transition-all duration-300">
              <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image 
                  src="/logop.png" 
                  alt="SagaTurismo" 
                  fill 
                  className={`object-contain transition-all duration-300 ${
                    (!isHeaderSolid && !isHovered && !isMobileMenuOpen) 
                      ? 'brightness-0 invert' 
                      : ''
                  }`} 
                />
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center justify-center gap-12">
            {menuGroups.map((group) => (
              <div key={group.label} className="relative group py-2">
                <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                  (isHeaderSolid || isHovered || isMobileMenuOpen) 
                    ? 'text-slate-600 group-hover:text-[#00577C]' 
                    : 'text-white group-hover:text-[#F9C400] drop-shadow-md'
                }`}>
                  {group.label} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-2xl p-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50 flex flex-row items-center gap-1">
                  {group.links.map((link) => {
                    const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                    return (
                      <Link key={link} href={path} className={`${jakarta.className} block px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#00577C] hover:bg-slate-50 rounded-xl transition-all whitespace-nowrap`}>
                        {link}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="flex-1 flex justify-end items-center gap-4">
            <Link href="/cadastro"
              className={`hidden lg:inline-flex ${jakarta.className} px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm ${
                (isHeaderSolid || isHovered || isMobileMenuOpen) 
                  ? 'bg-[#F9C400] text-[#002f40]' 
                  : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'
              }`}>
              Residente
            </Link>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`rounded-xl p-2 lg:hidden transition-all duration-300 ${
                (isHeaderSolid || isHovered || isMobileMenuOpen) 
                  ? 'text-[#00577C] hover:bg-slate-100' 
                  : 'text-white hover:bg-white/20'
              }`}>
              {isMobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
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
                  {group.links.map((link) => {
                    const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                    return (
                      <Link key={link} href={path} onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} font-bold text-slate-700 text-sm bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 hover:text-[#00577C] hover:bg-slate-100 transition-colors`}>
                        {link}
                      </Link>
                    );
                  })}
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

      {/* ══════════════════════════════════════
          HERO EDITORIAL (COLORIDO - SEM ANIMAÇÃO)
      ══════════════════════════════════════ */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.pexels.com/photos/27038076/pexels-photo-27038076.jpeg?_gl=1*1c9okv6*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODcxNjc5NjYkbzEwNCRnMSR0MTc4NzE2ODgzNyRqMzckbDAkaDA." 
            alt="Parceiros do Turismo em São Geraldo do Araguaia" 
            fill 
            className="object-cover" // ← SEM animação, SEM escala
            priority 
          />
          {/* Gradiente MÍNIMO - apenas para legibilidade do texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            Parceiros
          </h1>
          <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
            O turismo feito pela nossa gente
          </p>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ── VALORES COMUNITÁRIOS (SOFT & CLEAN) ── */}
      <section className="py-20 md:py-32 px-6 bg-[#FDFCF7]">
        <div className="max-w-[1400px] mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16 md:mb-20">
              <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight`}>
                Porquê fazer parte do portal oficial?
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto">
            <ScrollReveal delay={0}>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#00577C]/5 text-[#00577C] flex items-center justify-center mb-6"><HeartHandshake size={28} /></div>
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 mb-4`}>Visibilidade</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">Pequena pousada, barqueiro ou agência — o seu trabalho é divulgado através dos canais oficiais do município para milhares de turistas.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#009640]/5 text-[#009640] flex items-center justify-center mb-6"><Sprout size={28} /></div>
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 mb-4`}>Custo Zero</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">O sistema municipal não cobra comissões. O valor do seu trabalho fica consigo, gerando renda e desenvolvimento local direto.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#F9C400]/10 text-[#d4a800] flex items-center justify-center mb-6"><ShieldCheck size={28} /></div>
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 mb-4`}>Credibilidade</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">Estar no portal oficial transmite segurança aos viajantes, garantindo que o seu negócio cumpre os padrões de hospitalidade.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── CADASTRO / GOOGLE FORMS (COMUNITÁRIO & MUNICIPAL) ── */}
      <section id="cadastro" className="py-20 md:py-32 px-6 bg-[#FDFCF7] border-t border-slate-200 relative overflow-hidden">
        {/* Elementos decorativos integrados no fundo da página */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00577C]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#009640]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            <ScrollReveal delay={100} className="text-center lg:text-left">
              <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6`}>
                Integre a rede municipal<br />
                <span className="italic text-[#009640]">de turismo.</span>
              </h2>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0 font-medium">
                O nosso portal é um espaço social, colaborativo e 100% gratuito. Qualquer prestador de serviços turísticos de São Geraldo do Araguaia pode participar. 
              </p>

              <div className="space-y-8 text-left max-w-lg mx-auto lg:mx-0">
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-white text-slate-600 flex items-center justify-center font-black text-lg shrink-0 border border-slate-200 shadow-sm">1</div>
                  <div>
                    <p className={`${jakarta.className} font-bold text-slate-900 text-lg mb-1`}>Registro Simples</p>
                    <p className="text-slate-500 text-base leading-relaxed">Preencha o formulário informando que tipo de serviço turístico você oferece.</p>
                  </div>
                </div>
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-white text-slate-600 flex items-center justify-center font-black text-lg shrink-0 border border-slate-200 shadow-sm">2</div>
                  <div>
                    <p className={`${jakarta.className} font-bold text-slate-900 text-lg mb-1`}>Verificação Municipal</p>
                    <p className="text-slate-500 text-base leading-relaxed">A nossa equipe verifica as informações para garantir a qualidade.</p>
                  </div>
                </div>
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-[#009640] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md">3</div>
                  <div>
                    <p className={`${jakarta.className} font-bold text-[#009640] text-lg mb-1`}>Integração na Rede</p>
                    <p className="text-slate-600 font-medium text-base leading-relaxed">O seu serviço é adicionado ao portal de forma justa, ajudando a promover o turismo do município.</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300} className="flex justify-center lg:justify-end mt-8 lg:mt-0">
              <div className="w-full lg:max-w-[480px] flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="w-24 h-24 bg-green-50/80 rounded-full flex items-center justify-center mb-8 border border-green-100 shadow-sm">
                  <Building2 size={40} className="text-[#009640]" />
                </div>
                
                <h3 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-4`}>Inscrição Gratuita</h3>
                <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed mb-10">
                  Clique no botão abaixo para abrir o formulário oficial, preencher os seus dados e juntar-se à comunidade de parceiros.
                </p>

                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLScUnwAEfwvfbjwf5w81F_3OynXVNDdCBx9QsDmxtunXftQchg/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-[#009640] hover:bg-[#007a33] text-white px-10 py-5 rounded-full font-black uppercase text-xs tracking-widest shadow-xl shadow-[#009640]/20 transition-all flex items-center justify-center gap-3 hover:-translate-y-1"
                >
                  Abrir Formulário <ExternalLink size={16} />
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
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

    </main>
  );
}