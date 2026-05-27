'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, BookOpen, Camera, Loader2, Compass, Landmark, History, Fish, TreePine, Mountain, Waves, Leaf, ChevronDown, X, ShieldCheck, Users, MapPin, CalendarDays
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
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      const y = window.scrollY;
      if (y < 80) setShowHeader(true);
      else if (y > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(y);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const fotosOrigens = fotos.filter(f => f.seccao === 'origens');
  const fotosGuerrilha = fotos.filter(f => f.seccao === 'guerrilha');
  const fotosArqueologia = fotos.filter(f => f.seccao === 'arqueologia');

  // Se houver múltiplas imagens, escolhemos a primeira (mais representativa) para destacar
  const imagemPrincipalOrigem = fotosOrigens.length > 0 ? fotosOrigens[0] : null;
  const imagemPrincipalArqueologia = fotosArqueologia.length > 0 ? fotosArqueologia[0] : null;

  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-800 overflow-x-hidden`}>

      {/* HEADER (padrão do site) */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Rotas','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`} className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
              Cartão Residente
            </Link>
          </nav>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas Turísticas</Link>
            <Link href="/eventos" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Agenda Cultural</Link>
            <Link href="/pacotes" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Pacotes</Link>
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Roteiros</Link>
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#002f40] via-[#00577C] to-[#009640]">
        <div className="absolute inset-0 opacity-10 bg-[url('/grid.svg')] bg-repeat" />
        <div className="relative z-10 text-center px-5 max-w-4xl mx-auto">
          <AnimatedSection animation="fade-up" delay={200}>
            <h1 className={`${jakarta.className} text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight mb-6`}>
              Nossa<br />
              <span className="text-[#F9C400]">História</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={400}>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-12 bg-white/30" />
              <Waves className="text-white/50 w-5 h-5" />
              <div className="h-px w-12 bg-white/30" />
            </div>
            <p className="text-lg md:text-xl text-white/80 italic leading-relaxed max-w-2xl mx-auto">
              "Cidade hospitaleira. Altaneira, sempre estás. Livre, forte, independente. És orgulho do Pará"
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={600}>
            <a href="#origens" className="mt-10 inline-flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors group">
              <span className="text-[9px] font-black uppercase tracking-widest">Mergulhar na história</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </a>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== ORIGENS E FUNDAÇÃO (com foto grande) ========== */}
      <section id="origens" className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <AnimatedSection animation="fade-right">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#00577C]/10 px-4 py-2 rounded-full">
                  <Waves size={14} className="text-[#00577C]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00577C]">A Fundação e a Fé</span>
                </div>
                <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-800 leading-tight`}>
                  O Berço do<br />
                  <span className="text-[#00577C]">São Geraldo</span>
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
                <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                  <Image 
                    src={imagemPrincipalOrigem.imagem_url} 
                    alt={imagemPrincipalOrigem.legenda} 
                    width={800} 
                    height={600} 
                    className="object-cover w-full h-auto max-h-[550px] transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-white text-sm md:text-base font-medium">{imagemPrincipalOrigem.legenda}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 rounded-2xl h-96 flex items-center justify-center">
                  <Camera className="text-slate-300" size={48} />
                </div>
              )}
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ========== GUERRILHA DO ARAGUAIA (com duas imagens grandes lado a lado) ========== */}
      <section className="py-20 md:py-28 px-6 bg-[#002f40] text-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection animation="fade-up" className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-white mb-4`}>
              "Onde o Brasil<br />
              <span className="text-[#F9C400]">Silenciou"</span>
            </h2>
            <p className="text-white/70 leading-relaxed">
              Entre <strong>1972 e 1975</strong>, a região de São Geraldo do Araguaia foi palco da <strong className="text-white">Guerrilha do Araguaia</strong> – o maior movimento de resistência armada contra a ditadura militar brasileira. Durante décadas, esse episódio foi mantido sob censura, e a população local sofreu profundamente com a repressão.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-10 mb-12">
            <AnimatedSection animation="fade-right">
              <div className="space-y-4 text-white/70 leading-relaxed text-justify">
                <p>
                  A guerrilha foi organizada pelo <strong className="text-white">Partido Comunista do Brasil (PC do B)</strong>, uma dissidência armada do PCB. Seus membros – entre eles José Genoíno, Osvaldão, Maurício Grabois e João Amazonas – acreditavam ser possível implantar o comunismo no Brasil através de uma "guerra popular prolongada", à semelhança da China e Cuba.
                </p>
                <p>
                  Instalados clandestinamente na mata, os guerrilheiros prestavam assistência médica e alfabetização aos camponeses, mas também buscavam recrutar apoiadores. Quando o governo militar descobriu a base, desencadeou a maior operação de contrainsurgência do país desde a Segunda Guerra Mundial: cerca de <strong>3.200 militares</strong> e <strong>12 aviões</strong> (incluindo 4 caças T-6) foram mobilizados.
                </p>
                <p>
                  A repressão foi brutal. Dezenas de guerrilheiros foram mortos ou desapareceram. A população ribeirinha, que nada tinha a ver com o conflito, sofreu com buscas, interrogatórios, perda de entes queridos e destruição de suas propriedades. A memória desse período ainda está presente nos mais velhos, que muitas vezes se fecham no silêncio.
                </p>
                <p>
                  Com o fim da guerrilha, o governo rebatizou a <strong>Serra dos Martírios</strong> como <strong>Serra das Andorinhas</strong>, numa tentativa de apagar o triste episódio. Mas a verdade histórica, hoje, é resgatada por pesquisadores e pela própria comunidade, que não esquece.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-left" className="space-y-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-sm italic text-[#F9C400] mb-2">“Os moradores do local, que nem sabiam o que era regime militar, perseguição política, democracia ou comunismo, sofreram todos os tipos de perdas que estão intrínsecos numa guerra.”</p>
                <p className="text-right text-white/40 text-xs">— Prof. Juvenal</p>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="relative rounded-xl overflow-hidden shadow-2xl group">
                  <Image 
                    src={IMG_EXERCITO} 
                    alt="Comboio do exército na Serra" 
                    width={600} 
                    height={450} 
                    className="object-cover w-full h-72 md:h-80 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-white text-xs font-medium">Operação militar na Serra (acervo histórico)</p>
                  </div>
                </div>
                <div className="relative rounded-xl overflow-hidden shadow-2xl group">
                  <Image 
                    src={IMG_CORPO} 
                    alt="Corpo de J.C. Haas" 
                    width={600} 
                    height={450} 
                    className="object-cover w-full h-72 md:h-80 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-white text-xs font-medium">Registro de um dos combatentes (identidade não revelada)</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          <AnimatedSection animation="zoom-in" className="mt-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center max-w-3xl mx-auto">
              <CalendarDays className="mx-auto mb-3 text-[#F9C400]" size={24} />
              <p className="text-white/70 text-sm leading-relaxed">
                A guerrilha durou aproximadamente três anos. Estima-se que mais de 70 pessoas tenham desaparecido ou sido mortas. A região só começou a se reerguer após a criação do GETAT (Grupo Executivo de Terras do Araguaia-Tocantins) e a abertura de estradas pelo exército, que também trouxe o desenvolvimento da pecuária.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== EMANCIPAÇÃO E ARQUEOLOGIA (com foto grande) ========== */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection animation="fade-up" className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#009640]/10 px-4 py-2 rounded-full text-[#009640] text-[10px] font-black uppercase tracking-widest mb-4">
              <Mountain size={13} /> Serra das Andorinhas
            </div>
            <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-800`}>
              Liberdade &<br />
              <span className="text-[#009640]">Ancestralidade</span>
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <AnimatedSection animation="zoom-in" className="order-2 md:order-1">
              {loading || !imagemPrincipalArqueologia ? (
                <div className="bg-slate-100 rounded-xl h-96 flex items-center justify-center"><Camera className="text-slate-300" size={48} /></div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                  <Image 
                    src={imagemPrincipalArqueologia.imagem_url} 
                    alt={imagemPrincipalArqueologia.legenda} 
                    width={800} 
                    height={600} 
                    className="object-cover w-full h-auto max-h-[500px] transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-white text-sm md:text-base font-medium">{imagemPrincipalArqueologia.legenda}</p>
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
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Parque Est.</p>
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

      {/* CTA FINAL */}
      <section className="py-20 md:py-28 px-6 bg-gradient-to-br from-[#00577C] to-[#002f40] text-white text-center">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection animation="zoom-in">
            <Landmark className="mx-auto mb-6 text-[#F9C400]" size={48} />
            <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black mb-6`}>
              A Cidade Amada<br />
              <span className="text-[#F9C400]">segue em frente.</span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              São Geraldo do Araguaia transformou um passado de lutas numa história de superação. Uma cidade que se orgulha das raízes ribeirinhas, valoriza o seu património arqueológico inestimável e abre os braços para o ecoturismo — ao som eterno das águas do Araguaia.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/galeria" className="bg-[#F9C400] text-[#002f40] px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition flex items-center gap-2">
                <Camera size={16} /> Álbum de Fotos
              </Link>
              <Link href="/rotas" className="border-2 border-white/30 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/10 transition flex items-center gap-2">
                <Compass size={16} /> Explorar Rotas Turísticas
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FOOTER padrão */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de São Geraldo do Araguaia" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1">
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
    </main>
  );
}