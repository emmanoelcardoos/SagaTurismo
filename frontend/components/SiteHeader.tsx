'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });

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

export default function SiteHeader() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsHeaderSolid(currentScrollY > 80);
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

  const headerSolid = isHeaderSolid || isHovered || isMobileMenuOpen;

  return (
    <header
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${
        headerSolid 
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
                className={`object-contain transition-all duration-300 ${!headerSolid ? 'brightness-0 invert' : ''}`} 
              />
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center justify-center gap-12">
          {menuGroups.map((group) => (
            <div key={group.label} className="relative group py-2">
              <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                headerSolid 
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
              headerSolid 
                ? 'bg-[#F9C400] text-[#002f40]' 
                : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'
            }`}>
            Residente
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`rounded-xl p-2 lg:hidden transition-all duration-300 ${
              headerSolid 
                ? 'text-[#00577C] hover:bg-slate-100' 
                : 'text-white hover:bg-white/20'
            }`}>
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
          <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-3">
            <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md`}>
              Cartão Residente
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}