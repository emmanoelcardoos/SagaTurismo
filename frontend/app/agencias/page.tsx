'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu, MapPin, Search, ShieldCheck, 
  X, ArrowRight, Building2, Briefcase, ChevronDown, AtSign
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM ──
type Agencia = {
  id: string;
  nome: string;
  descricao_curta?: string;
  capa_url?: string;
  logo_url?: string;
  cadastur?: string;
  endereco?: string;
  instagram?: string;
  ativo: boolean;
};

// ── SKELETON PARA CARREGAMENTO ──
function AgenciaCardSkeleton() {
  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 p-4 md:p-6 flex flex-col md:flex-row gap-8 md:gap-12 animate-pulse">
      <div className="w-full h-64 md:h-[300px] md:w-80 rounded-[2.5rem] bg-slate-200 shrink-0" />
      <div className="flex-1 py-4 pr-4 flex flex-col justify-center gap-4">
        <div className="h-8 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-20 bg-slate-200 rounded w-full" />
        <div className="flex gap-2">
          <div className="h-8 bg-slate-200 rounded w-20" />
          <div className="h-8 bg-slate-200 rounded w-20" />
        </div>
        <div className="h-12 bg-slate-200 rounded w-40" />
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──
function AgenciasPageContent() {
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchAgencias() {
      const { data } = await supabase.from('agencias').select('*').eq('ativo', true).order('nome');
      if (data) setAgencias(data as Agencia[]);
      setLoading(false);
    }
    fetchAgencias();
  }, []);

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

  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1533240332313-0cb49f47c0a8";

  // ── MENU AGRUPADO (PADRÃO VINCI) ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'Roteiros', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Passeios', 'Eventos', 'Comunidades', 'Aldeias'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col`}>
      
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

      {/* ── HERO EDITORIAL AGÊNCIAS (SOFT & CLEAN) ── */}
      <section className="relative pt-6 pb-12 md:pt-10 md:pb-16 px-6 bg-[#FDFCF7] overflow-hidden mt-[72px] md:mt-[80px]">
        {/* Background Graphics */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00577C]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#F9C400]/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center relative z-10">
          
          <div className="lg:col-span-5 flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] mb-6 tracking-tight`}>
              Agências<br />
              <span className="italic text-[#00577C]">Parceiras.</span>
            </h1>
            
            <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium text-justify md:text-left">
              Conheça os operadores turísticos oficiais de São Geraldo do Araguaia. Viagens desenhadas com segurança, conforto e profundo conhecimento local.
            </p>
          </div>

          <div className="lg:col-span-7 w-full mt-4 lg:mt-0">
             <div className="relative w-full h-[380px] sm:h-[450px] md:h-[520px] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-[4px] border-white z-10 group">
               <Image 
                 src="https://live.staticflickr.com/65535/54668340687_2c7f6b5c39_4k.jpg" 
                 alt="Agências Parceiras" 
                 fill 
                 className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]" 
                 priority 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
             </div>
          </div>

        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL (LISTA EM LARGURA TOTAL - SEM FILTROS) ── */}
      <section className="mx-auto max-w-[1400px] px-6 py-10 md:py-16 w-full flex-1">
        <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-6">
          <div>
            <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900`}>Agências Oficiais</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Conheça as empresas credenciadas da região</p>
          </div>
          {!loading && (
            <span className="text-xs font-black uppercase tracking-widest text-[#00577C] bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm">
              {agencias.length} Operadores
            </span>
          )}
        </div>

        <div className="w-full space-y-12">
          {loading ? (
             [...Array(3)].map((_, i) => <AgenciaCardSkeleton key={i} />)
          ) : agencias.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
               <Briefcase size={40} className="mx-auto text-slate-300 mb-4" />
               <p className="font-bold text-slate-500">Nenhuma agência cadastrada no momento.</p>
             </div>
          ) : (
             agencias.map((agencia, index) => {
                const imagemExibida = agencia.logo_url || agencia.capa_url || FALLBACK_IMAGE;

                return (
                  <article 
                    key={agencia.id} 
                    className="bg-white rounded-[3rem] border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-2xl transition-all duration-500 p-4 md:p-6 flex flex-col md:flex-row gap-8 md:gap-12 overflow-hidden group"
                  >
                     {/* Logo/Capa da Agência */}
                     <div className="relative w-full h-64 md:h-[300px] md:w-80 rounded-[2.5rem] overflow-hidden bg-slate-50 shrink-0 border border-slate-100 flex items-center justify-center p-6 cursor-pointer">
                        <Image 
                          src={imagemExibida} 
                          alt={agencia.nome} 
                          fill 
                          className={`transition-transform duration-[2000ms] group-hover:scale-105 ${agencia.logo_url ? 'object-contain p-6' : 'object-cover'}`} 
                        />
                        
                     </div>

                     {/* Informações da Agência */}
                     <div className="flex-1 py-4 pr-4 flex flex-col justify-center">
                        <h3 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight`}>
                          {agencia.nome}
                        </h3>
                        
                        {agencia.endereco && (
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-5">
                            <MapPin size={16}/> {agencia.endereco}
                          </div>
                        )}
                        
                        <p className="text-slate-500 font-medium text-base leading-relaxed line-clamp-3 mb-8">
                          {agencia.descricao_curta || 'Descubra os melhores roteiros e experiências com esta agência parceira oficial do município.'}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-8">
                           {agencia.cadastur && (
                             <span className="bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl text-[10px] font-bold text-slate-600 flex items-center gap-2">
                               Nº {agencia.cadastur}
                             </span>
                           )}
                           {agencia.instagram && (
                             <span className="bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl text-[10px] font-bold text-[#00577C] flex items-center gap-2">
                               <AtSign size={14} /> {agencia.instagram.replace('https://instagram.com/', '').replace('/', '')}
                             </span>
                           )}
                        </div>

                        <div className="mt-auto border-t border-slate-100 pt-6 flex justify-start">
                           <Link 
                             href={`/agencias/${agencia.id}`}
                             className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all bg-[#00577C] text-white hover:bg-[#004a6b] shadow-xl shadow-[#00577C]/20 hover:-translate-y-1"
                           >
                             Ver Pacotes <ArrowRight size={16}/>
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

export default function AgenciasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFCF7]" />}>
      <AgenciasPageContent />
    </Suspense>
  );
}