'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Menu, MapPin, Search, Star, 
  CheckCircle2, ShieldCheck, X, ArrowRight, ChevronDown
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM ──
type Hotel = {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  estrelas: number;
  imagem_url: string;
  comodidades?: string[];
};

// ── UTILS ──
const getArraySeguro = (item: any): string[] => {
  if (!item) return [];
  if (Array.isArray(item)) return item;
  if (typeof item === 'string') {
    try {
      const parsed = JSON.parse(item);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      if (item.startsWith('{') && item.endsWith('}')) {
        return item.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^"/, '').replace(/"$/, ''));
      }
    }
  }
  return [];
};

function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-4 flex flex-col md:flex-row overflow-hidden animate-pulse shadow-sm">
      <div className="w-full h-64 md:h-[350px] md:w-96 bg-slate-100 rounded-3xl shrink-0" />
      <div className="p-6 md:p-8 flex flex-col flex-1 gap-4">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-8 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-full mt-4" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="mt-auto pt-6 flex justify-end">
          <div className="h-12 bg-slate-200 rounded-full w-40" />
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──
function HoteisPageContent() {
  const [hoteis, setHoteis] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  useEffect(() => {
    async function fetchHoteis() {
      const { data } = await supabase.from('hoteis').select('*').order('nome');
      if (data) setHoteis(data as Hotel[]);
      setLoading(false);
    }
    fetchHoteis();
  }, []);

  // Rotação do Carrossel
  useEffect(() => {
    if (hoteis.length <= 1) return;
    const timer = setInterval(() => setCurrentHeroSlide((prev) => (prev + 1) % hoteis.length), 5000);
    return () => clearInterval(timer);
  }, [hoteis.length]);

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

  // ── MENU AGRUPADO ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'Rotas', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Passeios', 'Eventos', 'Comunidades', 'Aldeias'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1800";

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 overflow-x-hidden flex flex-col`}>
      
      {/* ── HEADER EDITORIAL CENTRALIZADO ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}>
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

      {/* ── HERO EDITORIAL COM CARROSSEL ── */}
      <section className="relative pt-6 pb-12 md:pt-10 md:pb-16 px-6 bg-[#FDFCF7] overflow-hidden mt-[72px] md:mt-[80px] min-h-[500px]">
        {/* Background com Carrossel */}
        <div className="absolute inset-0 z-0">
          {!loading && hoteis.length > 0 ? (
            hoteis.map((hotel, index) => (
              <Image
                key={hotel.id}
                src={hotel.imagem_url || FALLBACK_IMAGE}
                alt="Fundo Hotel"
                fill
                className={`object-cover transition-opacity duration-1000 ease-in-out ${
                  index === currentHeroSlide ? 'opacity-30' : 'opacity-0'
                }`}
              />
            ))
          ) : (
            <div className="w-full h-full bg-slate-200 animate-pulse" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
        </div>

        {/* Conteúdo do Hero */}
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center relative z-10">
          
          <div className="lg:col-span-5 flex flex-col items-center text-center lg:items-start lg:text-left">
            
            <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] mb-6 tracking-tight`}>
              Alojamentos<br />
              <span className="italic text-[#00577C]">Locais.</span>
            </h1>
            
            <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium text-justify md:text-left">
              Conheça as melhores opções de pousadas e hotéis em São Geraldo do Araguaia. Entre em contato direto com os proprietários e garanta um descanso perfeito.
            </p>
          </div>

          <div className="lg:col-span-7 w-full mt-4 lg:mt-0">
             <div className="relative w-full h-[380px] sm:h-[450px] md:h-[520px] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-[4px] border-white z-10 group bg-slate-100">
               {!loading && hoteis.length > 0 ? (
                 <Image 
                   src={hoteis[currentHeroSlide]?.imagem_url || FALLBACK_IMAGE} 
                   alt="Alojamentos Locais" 
                   fill 
                   className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]" 
                   priority 
                 />
               ) : (
                 <div className="w-full h-full bg-slate-100 animate-pulse" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
             </div>
          </div>

        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL (LISTA EM LARGURA TOTAL - SEM FILTROS) ── */}
      <section className="mx-auto max-w-[1400px] px-6 py-10 md:py-16 w-full">
        <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-6">
          <div>
            <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900`}>Alojamentos Disponíveis</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Conheça as melhores pousadas e hotéis da região</p>
          </div>
          {!loading && (
            <span className="text-xs font-black uppercase tracking-widest text-[#00577C] bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm">
              {hoteis.length} Opções
            </span>
          )}
        </div>

        <div className="w-full space-y-12">
          {loading ? (
             [...Array(3)].map((_, i) => <HotelCardSkeleton key={i} />)
          ) : hoteis.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
               <Search size={48} className="mx-auto text-slate-300 mb-4" />
               <p className="font-bold text-slate-500">Nenhum alojamento cadastrado no momento.</p>
             </div>
          ) : (
             hoteis.map((hotel, index) => {
                // Obtém comodidades apenas se existirem
                const comodidades = getArraySeguro(hotel.comodidades);
                return (
                  <article 
                    key={hotel.id} 
                    className="bg-white rounded-[3rem] border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-2xl transition-all duration-500 p-4 md:p-6 flex flex-col md:flex-row gap-8 md:gap-12 overflow-hidden group"
                  >
                     {/* Imagem do Hotel */}
                     <div className="relative w-full h-64 md:h-[350px] md:w-96 rounded-[2.5rem] overflow-hidden bg-slate-100 shrink-0 group cursor-pointer">
                        <Image 
                          src={hotel.imagem_url || FALLBACK_IMAGE} 
                          alt={hotel.nome} 
                          fill 
                          className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]" 
                        />
                        <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase text-[#00577C] tracking-[0.2em] shadow-sm">
                          {hotel.tipo}
                        </div>
                     </div>

                     {/* Informações do Hotel */}
                     <div className="flex-1 py-4 pr-4 flex flex-col justify-center">
                        <div className="flex items-center gap-1 text-[#F9C400] mb-3">
                          {Array.from({ length: hotel.estrelas }).map((_, i) => (
                            <Star key={i} size={16} fill="currentColor"/>
                          ))}
                        </div>
                        
                        <h3 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight`}>
                          {hotel.nome}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-xs font-bold text-[#009640] mb-5">
                          <MapPin size={16}/> São Geraldo do Araguaia
                        </div>
                        
                        <p className="text-slate-500 font-medium text-base leading-relaxed line-clamp-3 mb-8">
                          {hotel.descricao}
                        </p>
                        
                        {/* Exibe comodidades apenas se houver */}
                        {comodidades.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-8">
                             {comodidades.slice(0, 4).map((c, i) => (
                               <span key={i} className="bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl text-[10px] font-bold text-slate-600 flex items-center gap-2">
                                 <CheckCircle2 size={14} className="text-[#00577C]"/> {c}
                               </span>
                             ))}
                          </div>
                        )}

                        <div className="mt-auto border-t border-slate-100 pt-6 flex justify-start">
                           <Link 
                             href={`/hoteis/${hotel.id}`}
                             className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all bg-[#00577C] text-white hover:bg-[#004a6b] shadow-xl shadow-[#00577C]/20 hover:-translate-y-1"
                           >
                             Conhecer Hotel <ArrowRight size={16}/>
                           </Link>
                        </div>
                     </div>
                  </article>
                );
             })
          )}
        </div>
      </section>

      {/* ── FOOTER INSTITUCIONAL INTEGRADO ── */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-[#FDFCF7] text-left mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de São Geraldo do Araguaia" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1 text-center md:text-left">
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
    </div>
  );
}

export default function HoteisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFCF7]" />}>
      <HoteisPageContent />
    </Suspense>
  );
}