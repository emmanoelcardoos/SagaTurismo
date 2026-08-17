'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu, MapPin, ShieldCheck, X, ArrowLeft,
  Mail, Compass, AlertCircle, Loader2, Briefcase,
  ChevronDown, Image as ImageIcon, Footprints, Waves, Mountain, Leaf
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';


const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM ──
type Especialidade = {
  nome: string;
  desc: string;
  imagem_url: string;
};

type Agencia = {
  id: string;
  nome: string;
  descricao_curta?: string;
  sobre?: string;
  capa_url?: string;
  logo_url?: string;
  cadastur?: string;
  endereco?: string;
  instagram?: string;
  email?: string;
  whatsapp?: string;
  galeria?: string[];
  especialidades?: any; // Nova coluna dinâmica
  ativo: boolean;
};

// ── UTILITÁRIOS DE PARSE ──
const parseGaleria = (galeriaRaw: any): string[] => {
  if (!galeriaRaw) return [];
  if (Array.isArray(galeriaRaw)) return galeriaRaw;
  if (typeof galeriaRaw === 'string') {
    try { return JSON.parse(galeriaRaw); } catch (e) { return []; }
  }
  return [];
};

const parseEspecialidades = (raw: any): Especialidade[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch (e) { return []; }
  }
  return [];
};



// ── ÍCONE PERSONALIZADO DO INSTAGRAM (SVG inline) ──
const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

// ── ÍCONE PERSONALIZADO DO WHATSAPP (SVG inline) ──
const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/>
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>
  </svg>
);

// ── COMPONENTE PRINCIPAL ──
function AgenciaIdPageContent() {
  const params = useParams();
  const id = params.id as string;

  const [agencia, setAgencia] = useState<Agencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ── MENU AGRUPADO ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  // ── ESPECIALIDADES FIXAS (Visual) ──
  

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      const { data: agenciaData } = await supabase
        .from('agencias')
        .select('*')
        .eq('id', id)
        .single();

      if (agenciaData) {
        setAgencia(agenciaData as Agencia);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

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

  const FALLBACK_CAPA = "https://images.unsplash.com/photo-1533240332313-0cb49f47c0a8";

  const formatInstagramUrl = (instagram: string) => {
    if (!instagram) return '#';
    let username = instagram.trim();
    if (username.startsWith('@')) username = username.substring(1);
    if (username.startsWith('http://') || username.startsWith('https://')) return username;
    return `https://instagram.com/${username}`;
  };

  const galeriaImagens = agencia ? parseGaleria(agencia.galeria) : [];

  const especialidadesList = agencia ? parseEspecialidades(agencia.especialidades) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#00577C]" size={48} />
        <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">A carregar agência...</p>
      </div>
    );
  }

  if (!agencia) {
    return (
      <div className="min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center text-center px-6">
        <AlertCircle size={64} className="text-slate-300 mb-6" />
        <h1 className={`${jakarta.className} text-3xl font-black text-slate-800 mb-4`}>Agência não encontrada</h1>
        <p className="text-slate-500 mb-8 max-w-md">Não conseguimos localizar esta agência. Ela pode ter sido removida ou o link está incorreto.</p>
        <Link href="/agencias" className="bg-[#00577C] text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#004a6b] transition-colors flex items-center gap-2">
          <ArrowLeft size={16} /> Voltar para Agências
        </Link>
      </div>
    );
  }

  const mapQuery = encodeURIComponent(`${agencia.endereco || agencia.nome}, São Geraldo do Araguaia, Pará, Brasil`);
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col`}>
      
      {/* ── HEADER ── */}
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

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-6 shadow-2xl lg:hidden z-50 max-h-[85vh] overflow-y-auto">
            <Link href="/agencias" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>← Voltar às Agências</Link>
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
          </div>
        )}
      </header>

      {/* ── HERO DA AGÊNCIA ── */}
      <section className="relative w-full bg-white border-b border-slate-100 mt-[72px] md:mt-[80px]">
        <div className="relative h-[25vh] md:h-[35vh] min-h-[200px] w-full bg-[#002f40]">
          <Image src={agencia.capa_url || FALLBACK_CAPA} alt={`Capa da ${agencia.nome}`} fill className="object-cover opacity-80" />
          <div className="absolute top-6 left-6 md:left-12 z-10">
            <Link href="/agencias" className="inline-flex items-center gap-2 bg-white/40 hover:bg-white/60 backdrop-blur-md px-4 py-2 rounded-full text-slate-900 text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
              <ArrowLeft size={14} /> Voltar
            </Link>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 pb-10">
            <div className="-mt-16 md:-mt-24 relative z-10 w-32 h-32 md:w-48 md:h-48 rounded-full border-[6px] border-white bg-white overflow-hidden shadow-md shrink-0 flex items-center justify-center">
              {agencia.logo_url ? (
                <Image src={agencia.logo_url} alt={`Logo ${agencia.nome}`} fill className="object-cover object-center" />
              ) : (
                <Briefcase size={48} className="text-slate-300" />
              )}
            </div>
            <div className="pt-2 md:pt-6 flex-1 text-center md:text-left">
              <h1 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 leading-tight`}>{agencia.nome}</h1>
              <p className="text-slate-500 font-medium mt-2 max-w-2xl text-sm md:text-base">
                {agencia.descricao_curta || 'Especialistas em criar experiências inesquecíveis em São Geraldo do Araguaia.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL + SIDEBAR ── */}
      <section className="flex-1 max-w-[1400px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start w-full">
        
        {/* COLUNA ESQUERDA */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Especialidades (Cards Horizontais com Imagens) */}
          {/* ── ESPECIALIDADES DA AGÊNCIA (CARROSSEL HORIZONTAL PREMIUM) ── */}
          {especialidadesList.length > 0 && (
            <div className="w-full flex flex-col items-center lg:items-start mb-8">
              <h2 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 w-full justify-center lg:justify-start`}>
                <Compass size={28} className="text-[#F9C400]" /> Nossas Especialidades
              </h2>
              
              {/* Container de Scroll Horizontal (Slider) */}
              <div className="flex gap-6 overflow-x-auto pb-8 pt-2 w-full snap-x snap-mandatory hide-scrollbar">
                {especialidadesList.map((esp, idx) => (
                  <div key={idx} className="shrink-0 snap-center w-[260px] md:w-[300px] group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl border-[4px] border-white bg-slate-100 cursor-default transition-all duration-500">
                    
                    <Image 
                      src={esp.imagem_url || FALLBACK_CAPA} 
                      alt={esp.nome} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]" 
                    />
                    
                    {/* Gradiente elegante para leitura impecável */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/10 to-transparent opacity-70 group-hover:opacity-95 transition-opacity duration-500" />
                    
                    {/* Conteúdo animado que surge ao passar o rato */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md mb-2 leading-tight`}>
                        {esp.nome}
                      </h3>
                      
                      {esp.desc && (
                        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out">
                          <p className="text-white/80 text-sm font-medium overflow-hidden line-clamp-3">
                            {esp.desc}
                          </p>
                        </div>
                      )}
                      
                      {/* Traço de Elegância Animado */}
                      <div className="w-8 h-1 bg-[#F9C400] mt-4 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sobre a Agência */}
          {agencia.sobre && (
            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100">
              <h2 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-6 flex items-center gap-3`}>
                <Briefcase size={24} className="text-[#00577C]" /> Sobre a Agência
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                {agencia.sobre}
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA (Sidebar) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 lg:sticky lg:top-28">
            <h3 className={`${jakarta.className} text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4`}>
              Informações de Contato
            </h3>

            <div className="space-y-5 mb-8">
              {agencia.endereco && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-[#00577C]"><MapPin size={18} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Endereço</p>
                    <p className="text-sm font-medium text-slate-700 leading-tight">{agencia.endereco}</p>
                  </div>
                </div>
              )}

              {agencia.email && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-[#00577C]"><Mail size={18} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">E-mail</p>
                    <a href={`mailto:${agencia.email}`} className="text-sm font-medium text-slate-700 hover:text-[#00577C] break-all">{agencia.email}</a>
                  </div>
                </div>
              )}

              {agencia.cadastur && (
                <div className="flex gap-4 items-start bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 shadow-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Número Cadastur</p>
                    <p className="text-base font-black text-amber-900">{agencia.cadastur}</p>
                  </div>
                </div>
              )}
            </div>

            {agencia.whatsapp ? (
              <a href={`https://wa.me/55${agencia.whatsapp.replace(/\D/g, '')}?text=Olá! Encontrei a ${agencia.nome} no portal SagaTurismo e gostaria de mais informações.`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#009640] hover:bg-[#007a33] text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-1 mb-4">
                <WhatsAppIcon size={18} /> Falar no WhatsApp
              </a>
            ) : (
              <button disabled className="w-full bg-slate-100 text-slate-400 py-4 rounded-xl font-black text-sm uppercase tracking-widest cursor-not-allowed mb-4">
                WhatsApp Indisponível
              </button>
            )}

            {agencia.instagram && (
              <a href={formatInstagramUrl(agencia.instagram)} target="_blank" rel="noopener noreferrer" className="w-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-1">
                <InstagramIcon size={18} /> Seguir no Instagram
              </a>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Localização no Mapa</p>
               <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
                 <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0} src={mapsEmbedUrl} title={`Mapa da agência ${agencia.nome}`} className="absolute inset-0" />
               </div>
            </div>
          </div>
        </aside>
      </section>

      {/* ── GALERIA ── */}
      {galeriaImagens.length > 0 && (
        <section className="max-w-[1400px] mx-auto w-full px-6 mb-16">
          <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-slate-100">
            <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-[#00577C] mb-6 flex items-center gap-3`}>
              <ImageIcon size={28} className="text-[#F9C400]" /> Galeria de Imagens
            </h3>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
              {galeriaImagens.map((imgUrl, i) => (
                <div key={i} className="relative shrink-0 snap-center rounded-2xl overflow-hidden w-[280px] h-[350px] md:w-[400px] md:h-[500px] lg:w-[450px] lg:h-[550px] group shadow-sm bg-slate-100">
                  <Image src={imgUrl} alt={`Galeria ${i+1} da agência ${agencia.nome}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
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
              <p className="text-[10px] font-bold text-slate-400/80">CNPJ: 10.249.241/0001-22</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AgenciaIdPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFCF7]" />}>
      <AgenciaIdPageContent />
    </Suspense>
  );
}