'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, BookOpen, Camera, Loader2, Compass, Landmark, History, Fish, TreePine, Mountain, Waves, Leaf, ChevronDown, X, ShieldCheck, Users, MapPin, CalendarDays, ArrowRight, Quote
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type FotoHistoria = {
  id: string;
  imagem_url: string;
  legenda: string;
  seccao: string;
};

function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);
  return { ref, isVisible };
}

function AnimatedSection({ 
  children, 
  className = "", 
  animation = "fade-up", 
  delay = 0 
}: { 
  children: ReactNode; 
  className?: string; 
  animation?: "fade-up" | "fade-left" | "fade-right" | "zoom-in";
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();
  let hiddenClass = "";
  switch (animation) {
    case "fade-up": hiddenClass = "opacity-0 translate-y-12"; break;
    case "fade-left": hiddenClass = "opacity-0 translate-x-12"; break;
    case "fade-right": hiddenClass = "opacity-0 -translate-x-12"; break;
    case "zoom-in": hiddenClass = "opacity-0 scale-90"; break;
  }
  return (
    <div 
      ref={ref} 
      className={`transition-all duration-700 ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0 scale-100" : hiddenClass} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function HistoriaPage() {
  // ── CONTROLE DO HEADER ──
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // ── DADOS ──
  const [fotos, setFotos] = useState<FotoHistoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Duas imagens adicionais da guerrilha (fora da tabela historia_fotos)
  const IMG_EXERCITO = "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/exercito.jpg";
  const IMG_CORPO = "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/Corpo%20de%20J.C.%20Haas%20e%20de%20outro.png";

  useEffect(() => {
    async function fetchFotos() {
      const { data } = await supabase.from('historia_fotos').select('*');
      if (data) setFotos(data);
      setLoading(false);
    }
    fetchFotos();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Header fica sólido (branco) APENAS quando rolar além de 80px
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

  const fotosOrigens = fotos.filter(f => f.seccao === 'origens');
  const fotosGuerrilha = fotos.filter(f => f.seccao === 'guerrilha');
  const fotosArqueologia = fotos.filter(f => f.seccao === 'arqueologia');

  const imagemPrincipalOrigem = fotosOrigens.length > 0 ? fotosOrigens[0] : null;
  const imagemPrincipalArqueologia = fotosArqueologia.length > 0 ? fotosArqueologia[0] : null;

  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-800 overflow-x-hidden flex flex-col`}>

      {/* ── HEADER INTELIGENTE TRANSPARENTE ── */}
      <header
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${
          // HEADER TRANSPARENTE POR PADRÃO, FICA BRANCO QUANDO:
          // 1. isHeaderSolid (scroll > 80px) OU
          // 2. isHovered (mouse em cima) OU
          // 3. isMobileMenuOpen (menu aberto)
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
                    // Logo fica branca (invert) quando o header é transparente
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
                  // Texto branco quando transparente, escuro quando sólido
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
          HERO EDITORIAL (PRETO E BRANCO COM GRADIENTE MÍNIMO)
      ══════════════════════════════════════ */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/herosections/herohistoria.jpg"
            alt="História de São Geraldo do Araguaia"
            fill
            priority
          />
          {/* Gradiente MÍNIMO - apenas para legibilidade do texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            História
          </h1>
          <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
            A trajetória de luta, fé e superação de São Geraldo do Araguaia
          </p>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ========== ORIGENS E FUNDAÇÃO (IMAGEM AMPLIADA) ========== */}
      <section id="origens" className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="fade-right">
              <div className="space-y-6">
                
                <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-800 leading-tight`}>
                  O Berço de 
                  <span className="text-[#00577C]"> São Geraldo</span>
                </h2>
                <div className="space-y-4 text-slate-600 leading-relaxed text-justify">
                  <p>
                    A história de São Geraldo do Araguaia começa no final da década de <strong className="text-[#00577C]">1940</strong>, com o garimpo manual de cristal de rocha no "Garimpo do Chiqueirão", localizado na margem direita do rio Araguaia (hoje município de Xambioá/TO). Quando a jazida se esgotou, os garimpeiros, ao invés de retornarem às suas terras natais, viram na região uma oportunidade. Dedicaram-se então à coleta de <strong className="text-[#009640]">castanha-do-pará</strong> e ao plantio de culturas de subsistência, principalmente arroz.
                  </p>
                  <p>
                    Em <strong className="text-[#00577C]">1953</strong>, o comerciante <strong className="text-[#009640]">João Rego Maranhão</strong> construiu um barracão próximo à foz do rio Xambioá, na margem esquerda do Araguaia, para comprar castanha e produtos dos pequenos agricultores que desciam os afluentes. Ao redor do barracão, muitas famílias foram construindo suas casas, formando o primeiro vilarejo.
                  </p>
                  <p>
                    Dona Leocádia, esposa de João Rego, não conseguia engravidar. Fez uma promessa: se tivesse um filho, daria a ele o nome de <strong className="text-[#00577C]">Geraldo</strong>, em honra a São Geraldo Magela (santo italiano). Ela teve o filho e cumpriu a promessa. Quando a criança morreu precocemente, a comunidade ergueu uma capela dedicada ao santo e ao menino falecido. Assim nasceu o nome: <strong className="text-[#00577C]">São Geraldo do Araguaia</strong>.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-left">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#00577C]" size={32} /></div>
              ) : imagemPrincipalOrigem ? (
                <div className="relative w-full h-[450px] md:h-[750px] rounded-2xl overflow-hidden shadow-2xl group">
                  <Image 
                    src={imagemPrincipalOrigem.imagem_url} 
                    alt={imagemPrincipalOrigem.legenda} 
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-white text-sm md:text-lg font-medium">{imagemPrincipalOrigem.legenda}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 w-full h-[450px] md:h-[750px] rounded-2xl flex items-center justify-center">
                  <Camera className="text-slate-300" size={48} />
                </div>
              )}
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ========== GUERRILHA DO ARAGUAIA (ESTILO GALERIA DE MUSEU) ========== */}
      <section className="py-20 md:py-32 px-6 bg-[#FDFCF7] border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection animation="fade-up" className="text-center mb-16 max-w-3xl mx-auto">
            
            <h2 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight`}>
              "Onde o Brasil
              <span className="italic text-[#00577C]"> Silenciou"</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed">
              Entre <strong className="text-slate-800">1972 e 1975</strong>, a região de São Geraldo do Araguaia foi palco da Guerrilha do Araguaia – o maior movimento de resistência armada contra a ditadura militar brasileira.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start mb-16">
            <AnimatedSection animation="fade-right">
              <div className="space-y-5 text-slate-600 font-medium leading-relaxed text-justify">
                <p>
                  A guerrilha foi organizada pelo <strong className="text-slate-800">Partido Comunista do Brasil (PCdoB)</strong>. Os seus membros instalados clandestinamente na mata prestavam assistência médica e alfabetização aos camponeses, buscando recrutar apoiadores.
                </p>
                <p>
                  Quando o governo militar descobriu a base, desencadeou a maior operação de contrainsurgência do país desde a Segunda Guerra Mundial: cerca de <strong className="text-slate-800">3.200 militares</strong> e <strong className="text-slate-800">12 aviões</strong> foram mobilizados. A repressão foi brutal. Dezenas de guerrilheiros foram mortos ou desapareceram. A população ribeirinha sofreu com buscas e destruição das suas propriedades.
                </p>
                <p>
                  Com o fim da guerrilha, o governo rebatizou a <strong className="text-slate-800">Serra dos Martírios</strong> como <strong className="text-slate-800">Serra das Andorinhas</strong>, numa tentativa de apagar o episódio. Mas a verdade histórica, hoje, é resgatada pela própria comunidade, que não esquece.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-left" className="space-y-8">
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative">
                <Quote className="absolute -top-4 -left-4 w-12 h-12 text-[#F9C400]/40" />
                <p className="text-base md:text-lg italic text-slate-700 mb-4 font-medium relative z-10 leading-relaxed">
                  “Os moradores do local, que nem sabiam o que era regime militar, perseguição política, democracia ou comunismo, sofreram todos os tipos de perdas que estão intrínsecos numa guerra.”
                </p>
                <p className="text-right text-[#00577C] text-xs font-black uppercase tracking-widest">— Prof. Juvenal</p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl border-[4px] border-white group bg-slate-100">
                  <Image 
                    src={IMG_EXERCITO} 
                    alt="Comboio do exército na Serra" 
                    fill
                    className="object-cover grayscale group-hover:scale-105 transition-transform duration-[2000ms]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-white text-xs font-bold leading-tight">Operação militar na Serra (acervo histórico)</p>
                  </div>
                </div>
                
                <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl border-[4px] border-white group bg-slate-100">
                  <Image 
                    src={IMG_CORPO} 
                    alt="Corpo de J.C. Haas" 
                    fill
                    className="object-cover grayscale group-hover:scale-105 transition-transform duration-[2000ms]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-white text-xs font-bold leading-tight">Registro de um dos combatentes na selva</p>
                  </div>
                </div>
              </div> 
            </AnimatedSection>
          </div>

          <AnimatedSection animation="zoom-in">
            <div className="bg-[#002f40] rounded-[2rem] p-8 md:p-10 border border-[#00577C] text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#F9C400]/10 rounded-full blur-3xl pointer-events-none" />
              <p className="text-white/80 text-base md:text-lg leading-relaxed font-medium relative z-10">
                A guerrilha durou aproximadamente três anos. Estima-se que mais de 70 pessoas tenham desaparecido ou sido mortas. A região só começou a se reerguer após a criação do GETAT e a abertura de estradas, trazendo um novo capítulo de desenvolvimento para o Araguaia.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== EMANCIPAÇÃO E ARQUEOLOGIA (IMAGEM AMPLIADA) ========== */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection animation="fade-up" className="text-center mb-12">
            
            <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-800`}>
              Liberdade e
              <span className="text-[#009640]"> Ancestralidade</span>
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <AnimatedSection animation="zoom-in" className="order-2 md:order-1">
              {loading || !imagemPrincipalArqueologia ? (
                <div className="bg-slate-100 w-full h-[450px] md:h-[750px] rounded-xl flex items-center justify-center"><Camera className="text-slate-300" size={48} /></div>
              ) : (
                <div className="relative w-full h-[450px] md:h-[750px] rounded-2xl overflow-hidden shadow-2xl group">
                  <Image 
                    src={imagemPrincipalArqueologia.imagem_url} 
                    alt={imagemPrincipalArqueologia.legenda} 
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-white text-sm md:text-lg font-medium">{imagemPrincipalArqueologia.legenda}</p>
                  </div>
                </div>
              )}
            </AnimatedSection>

            <AnimatedSection animation="fade-left" className="space-y-6 order-1 md:order-2">
              <p className="text-slate-600 leading-relaxed text-justify">
                Após a guerrilha, a vila precisava de autonomia. Durante anos, São Geraldo foi um distrito subordinado a Conceição do Araguaia e, depois, a Xinguara. A população organizada, através de associações e abaixo‑assinados, lutou pela emancipação.
              </p>
              <p className="text-slate-600 leading-relaxed text-justify">
                No início da década de <strong>1980</strong>, uma grande enchente submergiu a área baixa onde estava o povoado. O então prefeito de Conceição do Araguaia, Giovanni Queiroz, adquiriu terras na parte alta e as loteou entre os moradores, formando a nova vila que viria a ser a sede do município.
              </p>
              <p className="text-slate-600 leading-relaxed text-justify">
                Finalmente, em <strong className="text-[#00577C]">10 de maio de 1988</strong>, o governador Hélio da Mota Gueiros sancionou a <strong>Lei nº 5.441</strong>, criando o município de São Geraldo do Araguaia, desmembrado de Xinguara. A instalação oficial ocorreu em <strong>1º de janeiro de 1989</strong>, com a posse do primeiro prefeito, Raimundo Silveira Lima.
              </p>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 bg-[#00577C]/10 rounded-xl">
                  <p className={`${jakarta.className} text-2xl font-black text-[#00577C]`}>1988</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Emancipação</p>
                </div>
                <div className="text-center p-3 bg-[#009640]/10 rounded-xl">
                  <p className={`${jakarta.className} text-2xl font-black text-[#009640]`}>400+</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Cavernas</p>
                </div>
                <div className="text-center p-3 bg-amber-100 rounded-xl">
                  <p className={`${jakarta.className} text-2xl font-black text-amber-700`}>2001</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Parque Estadual</p>
                </div>
              </div>
            </AnimatedSection>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Fish,
                title: 'Pesca Esportiva',
                text: 'O Rio Araguaia é um dos maiores paraísos da pesca esportiva do Brasil. Tucunaré, piranha, matrinxã e pirarucu habitam as suas águas cristalinas.',
                color: 'bg-[#00577C]'
              },
              {
                icon: Mountain,
                title: 'Grutas e Cachoeiras',
                text: 'A Serra das Andorinhas (antiga Serra dos Martírios) esconde cachoeiras, grutas calcárias e pinturas rupestres milenares, sendo um dos sítios arqueológicos mais importantes do país.',
                color: 'bg-[#009640]'
              },
              {
                icon: Leaf,
                title: 'Agropecuária & Povo',
                text: 'A pecuária é a vocação econômica. Os moradores abandonaram os castanhais e se concentraram em vilas como Novo Paraíso, Fortaleza, Dois Irmãos, Vila Nova, Santa Cruz e Sucupira.',
                color: 'bg-amber-700'
              }
            ].map((card, idx) => (
              <AnimatedSection key={card.title} animation="fade-up" delay={idx * 150}>
                <div className={`${card.color} rounded-2xl p-6 text-white hover:shadow-xl transition-all hover:-translate-y-1 h-full`}>
                  <card.icon className="mb-4" size={28} />
                  <h3 className={`${jakarta.className} text-xl font-black mb-2`}>{card.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{card.text}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== DADOS GERAIS E CURIOSIDADES ========== */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection animation="fade-up" className="text-center mb-10">
            <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-800`}>Dados do Município</h2>
            <div className="w-20 h-1 bg-[#F9C400] mx-auto mt-2 rounded-full" />
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <MapPin className="mx-auto mb-3 text-[#00577C]" size={32} />
              <h3 className={`${jakarta.className} text-xl font-black`}>Localização</h3>
              <p className="text-slate-500 text-sm mt-2">Microrregião de Redenção, Sudeste do Pará.<br />Coordenadas: 06º 23' 18" S, 49º 32' 54" O</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <Users className="mx-auto mb-3 text-[#009640]" size={32} />
              <h3 className={`${jakarta.className} text-xl font-black`}>Área e População</h3>
              <p className="text-slate-500 text-sm mt-2">Área: 3.269,54 km²<br />Densidade: 8,4 hab/km²</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <CalendarDays className="mx-auto mb-3 text-amber-600" size={32} />
              <h3 className={`${jakarta.className} text-xl font-black`}>Aniversário</h3>
              <p className="text-slate-500 text-sm mt-2">10 de maio – Emancipação política (1988)<br />Instalação do município: 1º de janeiro de 1989</p>
            </div>
          </div>
        </div>
      </section>

      

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