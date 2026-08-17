'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, MapPin, Calendar as CalendarIcon, Clock,
  Bed, Compass, ShieldCheck, Camera, Info, X, Star,
  Menu, Users, MessageCircle, Map, Milestone, CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── IMAGENS DE FALLBACK ──
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740";
const LOGO_AGENCIA = "https://files.merlinapps.es/s3/images/shops/AgenciaAbreu-5fa943b93acf4.png";

// ── UTILITÁRIOS ──
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

const gerarLinkWhatsApp = (telefone: string | undefined, mensagem: string) => {
  if (!telefone) return '#';
  let numeroLimpo = telefone.replace(/\D/g, ''); 
  if (numeroLimpo.length < 10) return '#';
  if (!numeroLimpo.startsWith('55')) numeroLimpo = `55${numeroLimpo}`; 
  return `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
};

// ── TIPAGENS ──
type Hotel = {
  id: string; nome: string; tipo: string; imagem_url: string; descricao: string;
  galeria?: string[];
};

type Agencia = {
  id: string;
  nome_negocio: string;
  telefone: string;
};

type Pacote = {
  id: string; titulo: string; descricao_curta: string; roteiro_detalhado: string;
  imagens_galeria: string[]; imagem_principal: string; dias: number; noites: number;
  categoria: string;
  parceiro_id: string; 
  pacote_itens: { hoteis: Hotel | null }[];
};

// ── COMPONENTE DE CONTEÚDO ──
function PacoteDetalheContent() {
  const { id } = useParams();

  // Estados de Dados
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [loading, setLoading] = useState(true);
  const [hotelSelecionado, setHotelSelecionado] = useState<Hotel | null>(null);
  const [agencia, setAgencia] = useState<Agencia | null>(null); 

  // Galeria e UI
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('pacotes')
          .select(`*, pacote_itens ( hoteis (*) )`)
          .eq('id', id)
          .single();

        if (error || !data) return;

        const pct = data as Pacote;
        setPacote(pct);

        const itens = pct.pacote_itens || [];
        const hoteis = itens.map((i: any) => i?.hoteis).filter(Boolean) as Hotel[];

        if (hoteis.length > 0) setHotelSelecionado(hoteis[0]);

        if (pct.parceiro_id) {
          const { data: parceiroData } = await supabase
            .from('parceiros')
            .select('id, nome_negocio, telefone')
            .eq('id', pct.parceiro_id)
            .single();

          if (parceiroData) {
            setAgencia(parceiroData);
          }
        }

      } catch (err) {
        console.error("Falha ao carregar pacote:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  // ── GALERIA ──
  const galeriaCombinada = [
    ...(pacote?.imagem_principal ? [pacote.imagem_principal] : []),
    ...getArraySeguro(pacote?.imagens_galeria),
    ...getArraySeguro(hotelSelecionado?.galeria)
  ];

  const fecharGaleria = () => setFotoExpandidaIndex(null);

  // ── MENU AGRUPADO (PADRÃO VINCI) ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  if (!mounted || loading || !pacote) return (
    <div className={`${inter.className} min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]`}>
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs">A preparar o roteiro...</p>
    </div>
  );

  const imagensHotel = hotelSelecionado && getArraySeguro(hotelSelecionado.galeria).length > 0 
    ? getArraySeguro(hotelSelecionado.galeria) 
    : [hotelSelecionado?.imagem_url || FALLBACK_IMAGE];

  return (
    <div className={`${inter.className} min-h-screen flex flex-col bg-[#FDFCF7] text-slate-900`}>

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
            <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-3">
              <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md`}>
                Cartão Residente
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <div className="flex-1">
        {/* HERO IMAGEM */}
        <div className="w-full h-[40vh] md:h-[60vh] relative bg-[#002f40] overflow-hidden mt-[72px] md:mt-[80px]">
          <Link href="/agencias" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-bold text-slate-800 bg-white/90 backdrop-blur-sm hover:bg-white px-4 py-2 rounded-full shadow-lg transition-colors">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <Image
            src={pacote.imagem_principal || FALLBACK_IMAGE}
            alt={pacote.titulo}
            fill
            className="object-cover opacity-80"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002f40]/90 via-[#002f40]/40 to-transparent" />
        </div>

        {/* GRID PRINCIPAL */}
        <div className="mx-auto w-full max-w-7xl px-5 py-12 flex flex-col lg:flex-row items-start gap-12 relative z-10 -mt-20">
          
          {/* ◄── COLUNA ESQUERDA (CONTEÚDO) ──► */}
          <div className="flex-1 w-full min-w-0 flex flex-col gap-10">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {pacote.categoria || 'Aventura'}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                  <MapPin size={15} className="text-[#009640]" /> São Geraldo do Araguaia, PA
                </span>
              </div>

              <h1 className={`${jakarta.className} text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-8`}>
                {pacote.titulo}
              </h1>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 border-t border-b border-slate-100 py-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                    <CalendarIcon size={14} className="text-[#00577C]"/> Disponibilidade
                  </p>
                  <p className="font-bold text-slate-800 capitalize leading-tight">O Ano Todo</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                    <Clock size={14} className="text-[#00577C]"/> Duração
                  </p>
                  <p className="font-bold text-slate-800 leading-tight">{pacote.dias} dias / {pacote.noites} noites</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                    <Bed size={14} className="text-[#00577C]"/> Acomodação
                  </p>
                  <p className="font-bold text-slate-800 leading-tight">Hotel incluso</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                    <Compass size={14} className="text-[#00577C]"/> Guia
                  </p>
                  <p className="font-bold text-slate-800 leading-tight">Especializado</p>
                </div>
              </div>

              {/* SOBRE A EXPERIÊNCIA */}
              <div className="mb-12">
                <h3 className={`${jakarta.className} text-2xl font-black text-[#00577C] mb-4`}>Sobre a Experiência</h3>
                <p className="text-lg text-slate-500 italic font-medium border-l-4 border-[#F9C400] pl-5 mb-6">{pacote.descricao_curta}</p>
                <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                  {pacote.roteiro_detalhado}
                </div>
              </div>

              {/* SOBRE O ROTEIRO (TIMELINE FICTÍCIA) */}
              <div className="mb-8">
                <h3 className={`${jakarta.className} text-2xl font-black text-[#00577C] mb-6 flex items-center gap-2`}>
                  <Map size={24} className="text-[#F9C400]"/> O seu Roteiro Diário
                </h3>
                
                <div className="relative border-l-2 border-dashed border-[#F9C400] ml-3 mt-4 space-y-10 pb-4">
                  
                  <div className="relative pl-8">
                    <div className="absolute -left-[11px] top-1 w-5 h-5 bg-[#F9C400] rounded-full flex items-center justify-center border-4 border-white shadow-sm"></div>
                    <h4 className={`${jakarta.className} text-lg font-bold text-slate-900`}>Dia 1: Chegada e Imersão</h4>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">Recepção em São Geraldo do Araguaia, acomodação no hotel escolhido e noite livre para provar a gastronomia local às margens do majestoso Rio Araguaia.</p>
                  </div>

                  <div className="relative pl-8">
                    <div className="absolute -left-[11px] top-1 w-5 h-5 bg-[#F9C400] rounded-full flex items-center justify-center border-4 border-white shadow-sm"></div>
                    <h4 className={`${jakarta.className} text-lg font-bold text-slate-900`}>Dia 2: Expedição Serra das Andorinhas</h4>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">Dia completo de exploração no Parque Estadual da Serra das Andorinhas. Trilhas ecológicas, observação de pinturas rupestres e banhos refrescantes nas cachoeiras de águas cristalinas.</p>
                  </div>

                  <div className="relative pl-8">
                    <div className="absolute -left-[11px] top-1 w-5 h-5 bg-[#F9C400] rounded-full flex items-center justify-center border-4 border-white shadow-sm"></div>
                    <h4 className={`${jakarta.className} text-lg font-bold text-slate-900`}>Dia 3: Navegação e Despedida</h4>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">Passeio de barco pelas águas calmas do Rio Araguaia pela manhã. Almoço com pratos típicos (Tucunaré ou Filhote) e regresso seguro no final da tarde.</p>
                  </div>

                </div>
              </div>

            </div>

            {/* ACOMODAÇÃO INCLUSA */}
            <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Bed size={150}/></div>
              <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-6 flex items-center gap-3 relative z-10`}>
                <div className="w-10 h-10 bg-[#00577C] text-white rounded-xl flex items-center justify-center"><Bed size={20} /></div>
                Acomodação Inclusa
              </h3>

              {hotelSelecionado ? (
                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                  <div className="w-full md:w-1/2">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md">
                      <Image src={imagensHotel[0]} alt={hotelSelecionado.nome} fill className="object-cover hover:scale-105 transition-transform duration-700" />
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 flex flex-col justify-center">
                    <div className="flex items-center gap-1 text-[#F9C400] mb-2">
                       {Array.from({ length: 3 }).map((_, i) => <Star key={i} size={16} fill="currentColor"/>)}
                    </div>
                    <h4 className={`${jakarta.className} text-2xl font-bold text-[#00577C] mb-3`}>{hotelSelecionado.nome}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6">
                      {hotelSelecionado.descricao || 'Conforto e qualidade garantidos para o seu descanso após um dia de aventuras na nossa região.'}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 font-bold bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#009640]" /> Café da Manhã</span>
                      <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#009640]" /> Quarto Privativo</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic">As informações da acomodação serão fornecidas pela agência no momento do contacto.</p>
              )}
            </section>

          </div>

          {/* ◄── COLUNA DIREITA (BOTÃO WHATSAPP + AGÊNCIA) ──► */}
          <div className="w-full lg:w-[420px] shrink-0 lg:self-start">
            <div className="lg:sticky lg:top-32 space-y-6">
              
              {/* CARD DE CONTACTO WHATSAPP */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200">
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-2`}>
                   Pronto para a Aventura?
                </h3>
                <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
                  Entre em contacto direto com a agência organizadora para verificar a disponibilidade de datas, consultar valores exatos e personalizar o seu pacote.
                </p>

                <a 
                  href={gerarLinkWhatsApp(agencia?.telefone, `Olá! Vi o pacote "${pacote.titulo}" no Portal Oficial de Turismo de São Geraldo do Araguaia e gostaria de mais informações.`)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`${jakarta.className} w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2`}
                >
                  <MessageCircle size={24} /> Consultar Agência
                </a>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5"><ShieldCheck size={14} className="text-[#009640]" /> Turismo Transparente</p>
                  <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">O Portal Municipal atua como vitrine para fortalecer o turismo local. A negociação e o pagamento são feitos diretamente e de forma segura com o operador.</p>
                </div>
              </div>

              {/* CARD DA AGÊNCIA ORGANIZADORA */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 text-center relative overflow-hidden">
                <h3 className={`${jakarta.className} text-xl font-black text-slate-900 mb-6 flex items-center justify-center gap-2 relative z-10`}>
                   
                   Agência Responsável
                </h3>
                
                <div className="relative z-10 flex flex-col items-center">
                   <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-md border-4 border-slate-50 mb-5 bg-white flex items-center justify-center p-2">
                      <Image src={LOGO_AGENCIA} alt="Logo Agência" fill className="object-contain p-2" />
                   </div>
                   
                   <h4 className={`${jakarta.className} text-2xl font-black text-[#00577C]`}>
                      {agencia?.nome_negocio || 'Agência Oficial'}
                   </h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-5">Credenciada SGA</p>
                   
                   <p className="text-slate-500 text-sm leading-relaxed text-center">
                      Com vasta experiência no Sul do Pará, somos especialistas em criar roteiros imersivos que conectam os viajantes à natureza exuberante da Serra das Andorinhas e aos encantos do Rio Araguaia. A nossa missão é garantir a sua segurança e conforto.
                   </p>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* GALERIA FULL WIDTH */}
      {galeriaCombinada.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-5 pb-20 relative z-10">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-xl border border-slate-100">
            <h3 className={`${jakarta.className} text-3xl font-black text-[#00577C] mb-8 flex items-center gap-3`}>
               <Camera className="text-[#F9C400]" size={28}/>
               Galeria do Roteiro
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {galeriaCombinada.slice(0, 10).map((url, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-2xl overflow-hidden shadow-sm group bg-slate-200 cursor-pointer ${idx === 0 ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2 aspect-square' : 'aspect-square'}`}
                >
                  <Image src={url} alt={`Galeria ${idx + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de São Geraldo do Araguaia" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">© 2026 Secretaria Municipal de Turismo - SGA</p>
              <p className="text-[10px] font-bold text-slate-400/80">CNPJ: 10.249.241/0001-22</p>
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

export default function PacoteDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-[#00577C]" size={48} /></div>}>
      <PacoteDetalheContent />
    </Suspense>
  );
}