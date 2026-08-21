"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { ChevronDown, Menu, X, MapPin, Phone, Mail, Clock, Info } from 'lucide-react';

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ── MENU AGRUPADO ──
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

export default function CatPage() {
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Efeito de Scroll para o Header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const isHeaderSolid = isScrolled || isHovered || isMobileMenuOpen;
  
  // URL de imagem de exemplo para o CAT (pode trocar depois por uma foto real do balcão/prédio)
  const HERO_IMAGE = "https://images.pexels.com/photos/5597768/pexels-photo-5597768.jpeg?_gl=1*3q3hcf*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODczMjQ2MTUkbzEwNiRnMSR0MTc4NzMyNjg0NiRqNTkkbDAkaDA.";

  return (
    <main className={`${inter.className} bg-[#FDFCF7] min-h-screen text-slate-900 overflow-x-hidden`}>
      
      {/* ── HEADER EDITORIAL (Apenas a primeira logo) ── */}
      <header
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isHeaderSolid ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent border-b border-transparent'}`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center px-6 py-4 relative">
          
          <div className="flex flex-1 items-center gap-4 z-20">
            <Link href="/" className="inline-flex items-center transition-all duration-300">
              <div className="relative h-10 w-28 md:h-12 md:w-32 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain object-left" />
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex flex-none items-center justify-center gap-6 xl:gap-8 z-10">
            {menuGroups.map((group) => (
              <div key={group.label} className="relative group py-2">
                <button className={`${jakarta.className} flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${isHeaderSolid ? 'text-slate-600 group-hover:text-[#00577C]' : 'text-white group-hover:text-[#F9C400] drop-shadow-md'}`}>
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
            <Link href="/eventos" className={`${jakarta.className} flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] transition-colors py-2 ${isHeaderSolid ? 'text-slate-600 hover:text-[#00577C]' : 'text-white hover:text-[#F9C400] drop-shadow-md'}`}>
              Eventos
            </Link>
          </nav>

          <div className="flex flex-1 justify-end items-center gap-4 z-20">
            <Link href="/cadastro" className={`hidden lg:inline-flex ${jakarta.className} px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm ${isHeaderSolid ? 'bg-[#F9C400] text-[#002f40]' : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'}`}>
              Residente
            </Link>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`rounded-xl p-2 lg:hidden transition-all duration-300 ${isHeaderSolid ? 'text-[#00577C] hover:bg-slate-100' : 'text-white hover:bg-white/20'}`}>
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
            <div className="flex flex-col gap-3">
              <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.2em] text-[#00577C] border-b border-slate-100 pb-2`}>Agenda</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/eventos" onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} font-bold text-slate-700 text-sm bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 hover:text-[#00577C] hover:bg-slate-100 transition-colors`}>
                  Todos os Eventos
                </Link>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-3">
              <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md`}>
                Cartão Residente
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION PADRÃO ── */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src={HERO_IMAGE} 
            alt="CAT São Geraldo do Araguaia" 
            fill 
            className="object-cover" 
            priority 
          />
          {/* Gradiente apenas na parte inferior para legibilidade do texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            CAT
          </h1>
          <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
            Centro de Atendimento ao Turista
          </p>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <section className="max-w-[800px] mx-auto px-6 py-16 md:py-24">
        
        {/* Título e Introdução */}
        <div className="mb-12">
          <h2 className={`${jakarta.className} text-3xl font-black text-slate-800 mb-6 flex items-center gap-3`}>
            <Info className="text-[#F9C400]" size={32} />
            Bem-vindo ao CAT
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed text-justify">
            Localizado em um ponto estratégico da cidade, o Centro de Atendimento ao Turista (CAT) oferece todas as informações necessárias sobre hospedagens, roteiros, atrativos e serviços turísticos em São Geraldo do Araguaia. A nossa equipe está pronta para garantir que a sua experiência na nossa região seja inesquecível.
          </p>
        </div>

        {/* Cartão de Contactos */}
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-slate-100">
          <div className="space-y-8">
            
            {/* Endereço */}
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-2xl shrink-0">
                <MapPin className="text-[#00577C]" size={24} />
              </div>
              <div>
                <h3 className={`${jakarta.className} font-black text-lg text-slate-800`}>Localização</h3>
                <p className="text-slate-600 mt-2">Rua: </p>
                <p className="text-slate-600">Bairro: </p>
                <p className="text-slate-600">Referência: </p>
              </div>
            </div>

            {/* Horário */}
            <div className="flex items-start gap-4">
              <div className="bg-amber-50 p-3 rounded-2xl shrink-0">
                <Clock className="text-[#F9C400]" size={24} />
              </div>
              <div>
                <h3 className={`${jakarta.className} font-black text-lg text-slate-800`}>Horário de Atendimento</h3>
                <p className="text-slate-600 mt-2"></p>
              </div>
            </div>

            {/* Telefones */}
            <div className="flex items-start gap-4">
              <div className="bg-green-50 p-3 rounded-2xl shrink-0">
                <Phone className="text-emerald-600" size={24} />
              </div>
              <div>
                <h3 className={`${jakarta.className} font-black text-lg text-slate-800`}>Telefones</h3>
                <p className="text-slate-600 mt-2"></p>
                <p className="text-slate-600"></p>
              </div>
            </div>

            {/* E-mails */}
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-2xl shrink-0">
                <Mail className="text-[#00577C]" size={24} />
              </div>
              <div>
                <h3 className={`${jakarta.className} font-black text-lg text-slate-800`}>E-mails</h3>
                <p className="text-[#00577C] hover:underline cursor-pointer mt-2"></p>
                <p className="text-[#00577C] hover:underline cursor-pointer"></p>
              </div>
            </div>

          </div>
        </div>

      </section>
    </main>
  );
}