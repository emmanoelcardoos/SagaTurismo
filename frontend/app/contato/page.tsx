'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, MapPin, Mail, Phone, ShieldAlert,
  ChevronDown, ArrowRight, Clock, HeartHandshake, Leaf,
  Loader2, Info, Compass, HeartPulse, Shield,
  Flame, Building2, LifeBuoy, Droplets,
  Wifi, DollarSign, TreePine
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ─── TIPAGEM ───
type Contato = {
  id: number;
  categoria: string;
  nome: string;
  descricao: string;
  endereco: string;
  telefones: string[];
  horario: string;
  emergencia?: boolean;
  whatsapp?: string;
};

// ─── ANIMAÇÕES ───
function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);
  return { ref, isVisible };
}

function AnimatedSection({ children, className = "", animation = "fade-up", delay = 0 }: { children: ReactNode; className?: string; animation?: "fade-up" | "fade-left" | "fade-right"; delay?: number; }) {
  const { ref, isVisible } = useScrollAnimation();
  let hiddenClass = "opacity-0 translate-y-12";
  if (animation === "fade-left") hiddenClass = "opacity-0 translate-x-12";
  if (animation === "fade-right") hiddenClass = "opacity-0 -translate-x-12";

  return (
    <div ref={ref} className={`transition-all duration-700 ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0" : hiddenClass} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ─── CONFIGURAÇÃO DE CATEGORIAS VISUAIS ───
const categorias = [
  { id: 'all', label: 'Todos', icon: Info, bgClass: 'bg-slate-100', textClass: 'text-slate-600' },
  { id: 'turismo', label: 'Turismo', icon: Compass, bgClass: 'bg-green-50', textClass: 'text-[#009640]' },
  { id: 'saude', label: 'Saúde', icon: HeartPulse, bgClass: 'bg-red-50', textClass: 'text-red-600' },
  { id: 'seguranca', label: 'Segurança', icon: Shield, bgClass: 'bg-blue-50', textClass: 'text-blue-600' },
  { id: 'bombeiros', label: 'Bombeiros', icon: Flame, bgClass: 'bg-orange-50', textClass: 'text-orange-600' },
  { id: 'delegacia', label: 'Delegacia', icon: Building2, bgClass: 'bg-purple-50', textClass: 'text-purple-600' },
  { id: 'utilidades', label: 'Utilidades', icon: LifeBuoy, bgClass: 'bg-sky-50', textClass: 'text-[#00577C]' },
];

const parseTelefones = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch (e) { return [raw]; }
  }
  return [];
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function ContatoPage() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // ── CONTROLE DO HEADER ──
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const HERO_IMAGE = "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/herosections/herocontatos.jpg";

  useEffect(() => {
    async function fetchInformacoes() {
      const { data } = await supabase.from('informacoes').select('*').order('ordem', { ascending: true });
      if (data) {
        const formatados = data.map(item => ({
          ...item,
          telefones: parseTelefones(item.telefones)
        }));
        setContatos(formatados);
      }
      setLoading(false);
    }
    fetchInformacoes();
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
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  const filtered = activeFilter === 'all' ? contatos : contatos.filter(c => c.categoria === activeFilter);

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
            alt="Contato São Geraldo do Araguaia" 
            fill 
            className="object-cover" // ← REMOVIDO: scale-105 e animate-[pulse]
            priority 
          />
          {/* Gradiente apenas na parte inferior para legibilidade do texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            Contatos
          </h1>
          <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
            Encontre todos os contatos essenciais para a sua estadia em São Geraldo do Araguaia
          </p>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ── BARRA DE FILTROS ── */}
      <div className="relative bg-[#FDFCF7] pt-12 pb-4">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar justify-start md:justify-center" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>
            {categorias.map(cat => {
              const Icon = cat.icon;
              const active = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300
                    ${active ? 'bg-[#00577C] text-white shadow-lg shadow-[#00577C]/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:shadow-sm'}`}
                >
                  <Icon size={14} /> {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── GRELHA DE CONTACTOS ── */}
      <section className="py-16 md:py-20 px-6 flex-1 bg-[#FDFCF7]">
        <div className="max-w-[1400px] mx-auto">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Carregando contatos...</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((contato, i) => {
                  const cat = categorias.find(c => c.id === contato.categoria) || categorias[0];
                  const Icon = cat.icon;
                  return (
                    <AnimatedSection key={contato.id} animation="fade-up" delay={i * 100}>
                      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full group">
                        <div className="flex items-start justify-between mb-8">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${cat.bgClass} ${cat.textClass}`}>
                             <Icon size={24} />
                           </div>
                           {contato.emergencia && (
                             <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                               <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> 24h
                             </span>
                           )}
                        </div>
                        
                        <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-3 leading-tight group-hover:text-[#00577C] transition-colors`}>{contato.nome}</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 flex-1">{contato.descricao}</p>
                        
                        <div className="space-y-4 text-sm text-slate-600 font-medium mb-8">
                          {contato.endereco && (
                            <div className="flex items-start gap-3">
                              <MapPin size={18} className="mt-0.5 shrink-0 text-[#009640]" />
                              <span>{contato.endereco}</span>
                            </div>
                          )}
                          {contato.horario && (
                            <div className="flex items-center gap-3">
                              <Clock size={18} className="shrink-0 text-[#00577C]" />
                              <span>{contato.horario}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 mt-auto pt-6 border-t border-slate-100">
                          {contato.telefones?.map(tel => (
                            <a key={tel} href={`tel:${tel.replace(/\D/g,'')}`} className="inline-flex items-center gap-2 bg-[#00577C] hover:bg-[#004a6b] text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-md">
                              <Phone size={14} /> {tel}
                            </a>
                          ))}
                          {contato.whatsapp && (
                            <a href={`https://wa.me/${contato.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#009640] hover:bg-[#007a33] text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-md">
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </AnimatedSection>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                  <Info className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className={`${jakarta.className} text-slate-400 text-xl font-black`}>Nenhum contato cadastrado nesta categoria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── DICAS AO TURISTA ── */}
      <section className="py-20 md:py-28 bg-white border-t border-slate-100 px-6">
        <div className="max-w-[1400px] mx-auto">
          <AnimatedSection animation="fade-up" className="mb-16 text-center">
            <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.3em] text-[#009640] mb-4`}>Dicas Práticas</p>
            <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 tracking-tight`}>Antes de explorar, <span className="italic text-[#009640]">saiba disso.</span></h2>
          </AnimatedSection>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Droplets, title: 'Hidratação', tip: 'O calor amazónico é intenso. Carregue sempre água e evite longos períodos ao sol entre as 11h e as 15h.', color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: Wifi, title: 'Conectividade', tip: 'O sinal de internet pode ser fraco em áreas rurais e trilhas. Baixe os seus mapas offline antes de sair.', color: 'text-sky-500', bg: 'bg-sky-50' },
              { icon: DollarSign, title: 'Dinheiro', tip: 'Leve sempre dinheiro em espécie. Os caixas eletrónicos e máquinas de cartão são escassos fora do centro.', color: 'text-[#009640]', bg: 'bg-green-50' },
              { icon: TreePine, title: 'Meio Ambiente', tip: 'Não deixe lixo nas trilhas ou praias. Respeite a fauna, a flora locais e os territórios protegidos.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map((tip, i) => (
              <AnimatedSection key={i} animation="fade-up" delay={i * 100}>
                <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
                  <div className={`w-14 h-14 rounded-2xl ${tip.bg} flex items-center justify-center mb-6`}>
                    <tip.icon size={24} className={tip.color} />
                  </div>
                  <h4 className={`${jakarta.className} text-xl font-black text-slate-900 mb-3`}>{tip.title}</h4>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{tip.tip}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOCALIZAÇÃO / GOOGLE MAPS (BORDA ARREDONDADA) ── */}
      <section className="w-full py-16 md:py-20 bg-[#FDFCF7]">
        <div className="max-w-[1400px] mx-auto px-6">
          <AnimatedSection animation="fade-up" className="text-center mb-8">
            <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900`}>
              Prefeitura Municipal
            </h3>
            <p className="text-slate-600 mt-2 font-medium max-w-xl mx-auto">
              R. Antônio Nonato Pedrosa, 324 - Vila Administrativa, São Geraldo do Araguaia - PA, 68570-000
            </p>
          </AnimatedSection>

          <AnimatedSection animation="zoom-in" className="w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-[4px] border-white">
            <div className="relative w-full h-[50vh] min-h-[400px] bg-slate-200">
              <iframe 
                src="https://maps.google.com/maps?q=R.+Ant%C3%B4nio+Nonato+Pedrosa,+324+-+Vila+Administrativa,+S%C3%A3o+Geraldo+do+Araguaia+-+PA,+68570-000&t=k&z=17&ie=UTF8&iwloc=&output=embed" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full object-cover filter contrast-125 saturate-110"
              ></iframe>
            </div>
          </AnimatedSection>
        </div>
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