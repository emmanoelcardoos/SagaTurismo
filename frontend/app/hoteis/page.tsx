'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Menu, MapPin, Search, Star, 
  CheckCircle2, ShieldCheck, X, ArrowRight, ChevronDown, Bed,
  Phone, Instagram
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
  ativo?: boolean;
  zona?: string;
  endereco?: string;  
  contato?: string; 
  instagram?: string;
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

// ── SKELETON ATUALIZADO PARA O NOVO FORMATO DE CARTÃO ──
function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 flex flex-col overflow-hidden animate-pulse shadow-sm">
      <div className="w-full h-64 bg-slate-100 shrink-0" />
      <div className="p-6 md:p-8 flex flex-col flex-1 gap-4">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-8 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-full mt-2" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="mt-auto pt-6">
          <div className="h-14 bg-slate-200 rounded-2xl w-full" />
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──
function HoteisPageContent() {
  const [hoteis, setHoteis] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  // ── CONTROLE DO HEADER ──
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const FALLBACK_IMAGE = "https://images.pexels.com/photos/10781952/pexels-photo-10781952.jpeg?_gl=1*1b95bnp*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODY4MjEyNjMkbzg4JGcxJHQxNzg2ODIxMjg1JGozOCRsMCRoMA..";
  const HERO_IMAGE = "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/herosections/herohoteis.jpg"

  useEffect(() => {
    async function fetchHoteis() {
      try {
        const { data, error } = await supabase
          .from('hoteis')
          .select('*')
          .eq('ativo', true)
          .order('nome');
          
        if (error) console.error("Erro na base de dados:", error);
        if (data) setHoteis(data as Hotel[]);
      } catch (err) {
        console.error("Erro inesperado:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHoteis();
  }, []);

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

  // ── MENU AGRUPADO ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hospedagens', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 overflow-x-hidden flex flex-col`}>
      
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

      {/* ── HERO EDITORIAL (CORRIGIDO - SEM ESBRANQUIÇAMENTO) ── */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src={HERO_IMAGE} 
            alt="Hospedagem em São Geraldo do Araguaia" 
            fill 
            className="object-cover" // ← REMOVIDO: scale-105 e animate-[pulse]
            priority 
          />
          {/* Gradiente apenas na parte inferior para legibilidade do texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            Hospedagem
          </h1>
          <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
            As melhores opções de pousadas e hotéis para o seu descanso
          </p>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL (GRELHA DE CARTÕES VERTICAIS) ── */}
      <section className="mx-auto max-w-[1400px] px-6 py-16 md:py-24 w-full">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-slate-200 pb-6 gap-4">
          <div>
            <h2 className={`${jakarta.className} text-3xl md:text-5xl font-black text-slate-900 tracking-tight`}>Alojamentos Locais</h2>
            <p className="text-slate-500 font-medium mt-2 text-base md:text-lg">As melhores opções de pousadas e hotéis para o seu descanso.</p>
          </div>
          {!loading && (
            <span className="text-xs font-black uppercase tracking-widest text-[#00577C] bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm shrink-0">
              {hoteis.length} {hoteis.length === 1 ? 'Opção' : 'Opções'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[...Array(6)].map((_, i) => <HotelCardSkeleton key={i} />)}
          </div>
        ) : hoteis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-2xl mx-auto bg-white rounded-[2rem] border border-slate-100 my-10">
            <div className="w-16 h-16 bg-[#F9C400]/20 rounded-full flex items-center justify-center mb-6">
              <Bed className="text-[#00577C] w-8 h-8" />
            </div>
            <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 mb-3`}>
              Rede de hospedagem em organização
            </h3>
            <p className="text-slate-500 text-base leading-relaxed mb-6 max-w-lg">
              A Prefeitura está cadastrando hotéis, pousadas e áreas de camping locais. Em breve você poderá conhecer todas as opções de estadia em São Geraldo do Araguaia.
            </p>
            <div className="w-16 h-px bg-slate-200 mb-6" />
            <p className="text-slate-700 font-semibold text-sm mb-4">
              Tem um serviço de hospedagem em São Geraldo do Araguaia?
            </p>
            <Link href="/parceiros" className="inline-flex items-center gap-2 bg-[#F9C400] text-[#002f40] px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-[#e5b500] hover:scale-105 transition-all">
              Fazer inscrição gratuita <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {hoteis.map((hotel) => {
                const comodidades = getArraySeguro(hotel.comodidades);
                return (
                  <article 
                    key={hotel.id} 
                    className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden group"
                  >
                     {/* Imagem do Cartão */}
                     <div className="relative w-full h-64 overflow-hidden bg-slate-100 shrink-0">
                        <Image 
                          src={hotel.imagem_url || FALLBACK_IMAGE} 
                          alt={hotel.nome} 
                          fill 
                          className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
                        
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-[#00577C] tracking-widest shadow-sm">
                          {hotel.tipo}
                        </div>
                     </div>

                     {/* Corpo do Cartão: Formato "Cartão de Visita" (Texto Simples) */}
                     <div className="p-6 md:p-8 flex-1 flex flex-col">
                        <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-6 leading-tight`}>
                          {hotel.nome}
                        </h3>
                        
                        {/* ── SEÇÃO DE CONTACTOS (ESTILO BONITO) ── */}
                        <div className="mt-auto flex flex-col gap-3 text-sm text-slate-600 font-medium">
                           
                           {/* Endereço clicável que abre direto no Google Maps */}
                           {(hotel.endereco || hotel.zona) && (
                             <p className="leading-relaxed">
                               <a 
                                 href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.nome} ${hotel.endereco || ''} ${hotel.zona || ''} São Geraldo do Araguaia PA`)}`}
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 title="Ver no Google Maps"
                                 className="hover:text-[#F9C400] transition-colors"
                               >
                                 {hotel.endereco && <>{hotel.endereco}<br /></>}
                                 {hotel.zona || 'São Geraldo do Araguaia - PA'}
                               </a>
                             </p>
                           )}

                           {/* Número de Telefone clicável (abre o discador do celular) */}
                           {hotel.contato && (
                             <p>
                               Tel: <a href={`tel:${hotel.contato.replace(/\D/g, '')}`} className="hover:text-[#F9C400] transition-colors">{hotel.contato}</a>
                             </p>
                           )}

                           {/* Links de Redes Sociais no final */}
                           {hotel.instagram && (
                             <p className="pt-2">
                               <a 
                                 href={`https://instagram.com/${hotel.instagram.replace('@', '')}`} 
                                 target="_blank" 
                                 rel="noopener noreferrer" 
                                 className="text-[#00577C] font-bold hover:text-[#F9C400] transition-colors underline underline-offset-4 decoration-slate-200 hover:decoration-[#F9C400]"
                               >
                                 Instagram
                               </a>
                             </p>
                           )}

                        </div>
                     </div>
                  </article>
                );
             })}
          </div>
        )}
      </section>

      {/* ── FOOTER INSTITUCIONAL INTEGRADO ── */}
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