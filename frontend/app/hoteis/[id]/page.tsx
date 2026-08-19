'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  ArrowLeft, MapPin, Star, CheckCircle2, 
  Loader2, Menu, X, Bed, Users, Phone, Mail, Globe,
  MessageCircle, Image as ImageIcon, ShieldCheck, ChevronDown
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';



const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── ÍCONE PERSONALIZADO DO INSTAGRAM (SVG inline) ──
const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

// ── UTILITÁRIOS ──
const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

// ── TIPOS ──
type QuartoFisico = {
  id: string;
  nome_quarto: string;
  preco_quarto: number;
  descricao: string;
  capacidade: number;
  imagem_url: string;
};

type Hotel = {
  id: string; 
  nome: string; 
  tipo: string; 
  descricao: string; 
  estrelas: number; 
  imagem_url: string;
  endereco?: string; 
  whatsapp?: string;
  instagram?: string;
  comodidades?: string[]; 
  galeria?: string[];
  contatos?: {
    telefone?: string; email?: string; website?: string;
  };
};

// ── FUNÇÃO PARA GERAR LINK DO WHATSAPP ──
const gerarLinkWhatsApp = (telefone: string | undefined, mensagem: string) => {
  if (!telefone) return '#';
  let numeroLimpo = telefone.replace(/\D/g, ''); 
  if (numeroLimpo.length < 10) return '#';
  if (!numeroLimpo.startsWith('55')) numeroLimpo = `55${numeroLimpo}`; 
  
  return `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
};

// ── FUNÇÃO PARA FORMATAR INSTAGRAM ──
const formatarInstagram = (instagram: string | undefined) => {
  if (!instagram) return '#';
  let username = instagram.trim();
  if (username.startsWith('@')) {
    username = username.substring(1);
  }
  if (username.startsWith('http://') || username.startsWith('https://')) {
    return username;
  }
  return `https://instagram.com/${username}`;
};

function HotelDetalheContent() {
  const { id } = useParams();

  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ── DADOS DO BANCO ──
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [quartosDb, setQuartosDb] = useState<QuartoFisico[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // CARREGAMENTO INICIAL: HOTEL E QUARTOS
  useEffect(() => {
    async function fetchHotelEQuartos() {
      try {
        const { data: hotelData, error: hotelError } = await supabase.from('hoteis').select('*').eq('id', id).single();
        if (hotelError) throw new Error("Erro ao buscar a hospedagem.");
        
        const { data: quartosData, error: quartosError } = await supabase.from('tipos_quarto').select('*').eq('hotel_id', id).order('preco_quarto', { ascending: true });
        if (quartosError) throw new Error("Erro ao mapear o inventário de quartos.");

        if (hotelData) {
          setHotel(hotelData);
          setQuartosDb(quartosData || []);
        } else {
          setErro("Hospedagem não encontrada.");
        }
      } catch (err: any) {
        setErro(err.message || "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchHotelEQuartos();
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

  const imagensGaleria = hotel?.galeria?.length 
    ? hotel.galeria 
    : [hotel?.imagem_url, ...quartosDb.map(q => q.imagem_url)].filter(Boolean).slice(0, 8);

  // ── MENU GROUPS ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'Rotas', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hospedagens', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  if (!mounted || loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF7] text-[#00577C]">
      <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin mb-4 text-[#00577C]" />
      <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs text-slate-500">Buscando informações da hospedagem...</p>
    </div>
  );

  if (erro || !hotel) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF7] text-slate-900 px-6 text-center">
      <h1 className="text-2xl md:text-3xl font-black mb-4 text-[#00577C]">Alojamento Não Encontrado</h1>
      <p className="text-slate-500 mb-8 max-w-md text-sm md:text-base">{erro}</p>
      <Link href="/hoteis" className="bg-[#00577C] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-[#004a6b] transition-colors">Voltar aos Hotéis</Link>
    </div>
  );

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

            {/* ── HERO SECTION ORIGINAL (COM BOTÃO VOLTAR VISÍVEL) ── */}
            <div className="w-full h-[60vh] md:h-[70vh] relative bg-[#002f40]">
              <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover opacity-90" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Botão Voltar (corrigido com z-index elevado e fundo sólido) */}
              <div className="absolute top-4 md:top-6 left-4 md:left-6 z-30">
                <Link
                  href="/hoteis"
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all border border-slate-200/50 backdrop-blur-sm"
                >
                  <ArrowLeft size={16} /> Voltar
                </Link>
              </div>

              <div className="absolute bottom-6 md:bottom-10 left-5 md:left-16 z-20 text-left pr-5">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <span className="bg-[#F9C400] text-[#00577C] px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-md">{hotel.tipo}</span>
                  <div className="flex gap-0.5 md:gap-1">
                    {Array.from({ length: hotel.estrelas }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 md:h-4 md:w-4 fill-[#F9C400] text-[#F9C400]" />)}
                  </div>
                </div>
                <h1 className={`${jakarta.className} text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg`}>{hotel.nome}</h1>
              </div>
            </div>

      {/* ── ESTRUTURA PRINCIPAL ── */}
      <div className="mx-auto w-full max-w-7xl px-4 md:px-5 py-8 md:py-12 flex flex-col gap-10 md:gap-14 relative z-10">
        
        {/* LINHA 1: ACOMODAÇÕES (HORIZONTAL / CARROSSEL) + WHATSAPP/INSTAGRAM */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          
          <div className="flex-1 w-full min-w-0">
            {/* ── ACOMODAÇÕES EM CARROSSEL HORIZONTAL ── */}
            <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden text-left">
               <div className="bg-slate-50 p-5 md:p-6 border-b border-slate-200 flex items-center justify-between">
                 <div>
                   <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-[#00577C]`}>Acomodações Oferecidas</h3>
                   <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Deslize para conhecer as opções de quartos</p>
                 </div>
                 {quartosDb.length > 0 && (
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                     {quartosDb.length} tipos
                   </span>
                 )}
               </div>
               
               <div className="p-4 md:p-6">
                  {quartosDb.length === 0 ? (
                    <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-500 font-bold text-sm">A lista de quartos não está disponível no momento.</p>
                    </div>
                  ) : (
                    <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
                      {quartosDb.map((quarto) => (
                        <div key={quarto.id} className="min-w-[280px] md:min-w-[320px] lg:min-w-[360px] snap-start bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-shrink-0">
                          <div className="relative w-full aspect-[4/3] bg-slate-100">
                            <Image 
                              src={quarto.imagem_url || hotel.imagem_url} 
                              alt={quarto.nome_quarto} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                          <div className="p-4 md:p-5">
                            <h4 className={`${jakarta.className} font-black text-base md:text-lg text-[#00577C] mb-1 truncate`}>{quarto.nome_quarto}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{quarto.descricao || 'Acomodação confortável e bem equipada.'}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                                <span className="flex items-center gap-1"><Users size={14} className="text-[#00577C]"/> {quarto.capacidade}</span>
                                <span className="flex items-center gap-1"><Bed size={14} className="text-[#00577C]"/> Camas</span>
                              </div>
                              <p className={`${jakarta.className} text-lg md:text-xl font-black text-[#009640]`}>
                                {formatarMoeda(quarto.preco_quarto)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            </section>
          </div>

          {/* ◄── CARD WHATSAPP + INSTAGRAM (LATERAL DIREITA) ──► */}
          <div className="w-full lg:w-[380px] shrink-0 h-fit lg:self-start relative z-30">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-200 text-left lg:sticky lg:top-28">
               <h3 className={`${jakarta.className} text-xl font-black text-slate-900 mb-2`}>
                  Interessado no Alojamento?
               </h3>
               <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                 Entre em contato direto com o proprietário para verificar a disponibilidade de quartos, consultar valores e tirar dúvidas.
               </p>

               <div className="space-y-3">
                 <a 
                   href={gerarLinkWhatsApp(hotel.whatsapp || hotel.contatos?.telefone, `Olá! Vi o "${hotel.nome}" no Portal Oficial de Turismo de São Geraldo do Araguaia e gostaria de consultar a disponibilidade.`)} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className={`${jakarta.className} w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 md:py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2`}
                 >
                   <MessageCircle size={22} /> Falar no WhatsApp
                 </a>

                 {hotel.instagram && (
                   <a 
                     href={formatarInstagram(hotel.instagram)}
                     target="_blank"
                     rel="noopener noreferrer"
                     className={`${jakarta.className} w-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white py-4 md:py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2`}
                   >
                     <InstagramIcon size={22} /> Instagram
                   </a>
                 )}
               </div>

               <div className="mt-6 text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Turismo Transparente</p>
                 <p className="text-[11px] text-slate-500 mt-2">O Portal Municipal não cobra taxas. A negociação é feita diretamente consigo e o proprietário.</p>
               </div>
            </div>
          </div>
        </div>

        {/* LINHA 2: GALERIA DE IMAGENS (ESTILO COMUNIDADES - VERTICAL COM SCROLL HORIZONTAL) */}
        {imagensGaleria.length > 0 && (
          <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm p-5 md:p-10 text-left w-full overflow-hidden">
            <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-[#00577C] mb-6 flex items-center gap-2`}>
              <ImageIcon size={24} className="text-[#F9C400]" /> Galeria de Fotos
            </h3>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
              {imagensGaleria.map((img, i) => (
                <div key={i} className="relative shrink-0 snap-center rounded-2xl overflow-hidden w-[280px] h-[350px] md:w-[400px] md:h-[500px] lg:w-[450px] lg:h-[550px] group shadow-sm bg-slate-100">
                  <Image 
                    src={img as string} 
                    alt={`Galeria ${i+1}`} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LINHA 3: INFORMAÇÕES DE CONTATO (COR MAIS CLARA) */}
        <section className="bg-[#E8F0F5] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 text-slate-800 relative overflow-hidden text-left shadow-sm border border-slate-200">
          <div className="absolute -right-10 -top-10 opacity-10"><Globe size={200} className="text-[#00577C]"/></div>
          <h3 className={`${jakarta.className} text-xl md:text-2xl font-black mb-2 relative z-10 text-[#00577C]`}>Informações de Contato</h3>
          <p className="text-sm text-slate-600 mb-6 relative z-10">Fale diretamente com o estabelecimento oficial.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-white/50 hover:bg-white transition-colors shadow-sm">
              <Phone className="text-[#00577C] mb-3" size={24} />
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">WhatsApp / Telefone</p>
              <p className="font-bold text-sm truncate mt-1 text-slate-800">
                {hotel.whatsapp || hotel.contatos?.telefone || 'Não informado'}
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-white/50 hover:bg-white transition-colors shadow-sm">
              <Mail className="text-[#00577C] mb-3" size={24} />
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">E-mail Oficial</p>
              <p className="font-bold text-sm truncate mt-1 text-slate-800">
                {hotel.contatos?.email || 'Não informado'}
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-white/50 hover:bg-white transition-colors shadow-sm">
              <Globe className="text-[#00577C] mb-3" size={24} />
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Website</p>
              <p className="font-bold text-sm truncate mt-1 text-slate-800">
                {hotel.contatos?.website || 'Não informado'}
              </p>
            </div>
          </div>
        </section>

        {/* LINK PARA AVALIAÇÕES DO GOOGLE (substitui a seção de avaliações interna) */}
        <div className="flex justify-center pt-4">
          <a 
            href={`https://www.google.com/search?q=${encodeURIComponent(hotel.nome + ' São Geraldo do Araguaia avaliações')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-full text-sm font-bold text-[#00577C] hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Star size={18} className="fill-[#F9C400] text-[#F9C400]" /> Ver avaliações no Google Maps
          </a>
        </div>

      </div>

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

export default function HotelDetalhePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF7] text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#00577C]" />
        <p className="font-bold uppercase tracking-widest text-xs text-slate-500">A Sincronizar catálogo...</p>
      </div>
    }>
      <HotelDetalheContent />
    </Suspense>
  );
}