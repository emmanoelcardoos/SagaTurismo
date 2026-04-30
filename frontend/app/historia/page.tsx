'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, Menu, Anchor, Landmark, Compass, History, BookOpen, Camera, Loader2
} from 'lucide-react';
import { Plus_Jakarta_Sans, Merriweather, Inter } from 'next/font/google';

import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['italic', 'normal'],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// Tipagem da Supabase
type FotoHistoria = {
  id: string;
  imagem_url: string;
  legenda: string;
  seccao: string;
};

// Componente para as fotos do "Álbum"
function FotoAlbum({ src, caption, rotate = "0deg", className = "" }: { src: string, caption: string, rotate?: string, className?: string }) {
  return (
    <div className={`relative p-3 bg-white shadow-xl border border-slate-100 transition-transform hover:scale-105 hover:z-20 ${className}`} style={{ transform: `rotate(${rotate})` }}>
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <Image src={src} alt={caption} fill className="object-cover" />
      </div>
      <p className={`${merriweather.className} text-xs md:text-sm text-slate-500 mt-3 italic text-center`}>{caption}</p>
      {/* Detalhe de "fita-cola" transparente nas pontas para parecer álbum real */}
      <div className="absolute -top-2 -left-2 w-10 h-10 bg-[#F9C400]/20 backdrop-blur-sm -rotate-45" />
    </div>
  );
}

export default function HistoriaPage() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Estados para a Base de Dados
  const [fotos, setFotos] = useState<FotoHistoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch das Fotos na Supabase
  useEffect(() => {
    async function fetchFotos() {
      const { data, error } = await supabase
        .from('historia_fotos')
        .select('*');

      if (data) {
        setFotos(data);
      }
      setLoading(false);
    }
    fetchFotos();
  }, []);

  // Filtramos as fotos para cada secção
  const fotosOrigens = fotos.filter(f => f.seccao === 'origens');
  const fotosGuerrilha = fotos.filter(f => f.seccao === 'guerrilha');
  const fotosArqueologia = fotos.filter(f => f.seccao === 'arqueologia');

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 80) setShowHeader(true);
      else if (currentScrollY > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900`}>
      
      {/* HEADER PADRÃO */}
      <header
        className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56">
              <Image src="/logop.png" alt="Prefeitura SGA" fill priority className="object-contain object-left" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo de São Geraldo do Araguaia</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/#eventos" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Eventos</Link>
            <Link href="/galeria" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Galeria</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão Residente</Link>
          </nav>
          <button className="rounded-xl border border-slate-200 p-2 md:hidden"><Menu className="h-5 w-5 text-[#00577C]" /></button>
        </div>
      </header>

      {/* HERO SECTION - TÍTULO DO ÁLBUM */}
      <section className="relative pt-48 pb-24 px-5 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00577C]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F9C400]/10 text-[#00577C] rounded-full text-xs font-black uppercase tracking-widest mb-6">
            <BookOpen size={14} /> Memórias da Cidade Amada
          </div>
          <h1 className={`${merriweather.className} text-5xl md:text-8xl font-black text-[#00577C] tracking-tighter mb-8 leading-tight`}>
            Nossa História, <br/> <span className="text-[#009640]">Nosso Povo.</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto italic">
            "Um mergulho nas raízes de São Geraldo do Araguaia, das águas sagradas do rio às pedras ancestrais da serra."
          </p>
        </div>
      </section>

      {/* SECÇÃO 1: ORIGENS E FÉ */}
      <section className="py-20 px-5 bg-white">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="flex items-center gap-4 text-[#F9C400]">
              <div className="h-px w-12 bg-[#F9C400]"></div>
              <span className="font-black uppercase tracking-widest text-sm text-[#00577C]">A Fundação e a Fé</span>
            </div>
            <h2 className={`${jakarta.className} text-4xl font-black text-slate-900 leading-none`}>
              Sob a Benção de <br/>São Geraldo de Majela
            </h2>
            <div className="text-lg text-slate-600 leading-relaxed space-y-6">
              <p>
                A história de São Geraldo do Araguaia remonta a meados do século XX. O desbravamento da região começou timidamente por volta de 1950, quando garimpeiros e agricultores, oriundos principalmente de Minas Gerais, Goiás, Maranhão e da Bahia, chegaram às margens do Rio Araguaia. Eles vieram em busca de pedras preciosas, como cristal de rocha e diamantes, além de terras férteis para recomeçarem as suas vidas.
              </p>
              <p>
                Aos poucos, o pequeno acampamento ribeirinho começou a ganhar contornos de vila. A fé cristã sempre foi o grande alicerce destes pioneiros. Na época, a região recebia a visita esporádica de missões religiosas. Foi o missionário dominicano Frei Gil de Vila Nova quem, ao realizar as primeiras missas e batizados sob barracas de lona, sugeriu que a localidade fosse batizada em honra a **São Geraldo de Majela**, o santo redentorista conhecido por proteger as mães e os trabalhadores. Assim nascia oficialmente o nome da povoação, abençoada pelas águas do Araguaia.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#00577C]" /></div>
            ) : fotosOrigens.map((foto, index) => (
              <FotoAlbum 
                key={foto.id} 
                src={foto.imagem_url} 
                caption={foto.legenda} 
                // Estilos dinâmicos para a 1ª e 2ª foto para dar aquele aspeto de álbum
                rotate={index % 2 === 0 ? "-2deg" : "3deg"} 
                className={index % 2 === 0 ? "mt-12" : ""} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECÇÃO 2: GUERRILHA DO ARAGUAIA (A MEMÓRIA VIVA) */}
      <section className="py-24 px-5 bg-slate-50 relative">
        <div className="mx-auto max-w-7xl">
           <div className="text-center mb-20 max-w-3xl mx-auto">
             <h2 className={`${merriweather.className} text-4xl font-black text-[#00577C] mb-6 italic`}>"Onde o Brasil Silenciou"</h2>
             <p className="text-lg text-slate-600">
               São Geraldo do Araguaia não é apenas beleza natural; é solo de resistência. Durante a década de 1970, a pacata região foi palco de um dos episódios mais densos e silenciados da ditadura militar brasileira: a **Guerrilha do Araguaia**.
             </p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8 mb-16 items-center">
              {/* Mostra a 1ª foto da guerrilha (se houver) */}
              {fotosGuerrilha[0] && (
                <FotoAlbum src={fotosGuerrilha[0].imagem_url} caption={fotosGuerrilha[0].legenda} rotate="-1deg" />
              )}

              <div className="flex flex-col justify-center p-8 bg-[#00577C] rounded-[2rem] text-white shadow-2xl relative overflow-hidden group h-full">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                 <History className="mb-6 text-[#F9C400] w-12 h-12" />
                 <h3 className={`${jakarta.className} text-2xl font-black mb-4`}>A Luta na Floresta</h3>
                 <p className="text-blue-100 leading-relaxed font-medium text-sm">
                   No final dos anos 60, militantes do Partido Comunista do Brasil (PCdoB) instalaram-se clandestinamente nas matas locais, prestando apoio médico e alfabetização aos camponeses para preparar uma revolução. Ao descobrir a base em 1972, as Forças Armadas deflagraram a maior mobilização militar do país desde a Segunda Guerra Mundial. A repressão foi implacável, resultando no desaparecimento de dezenas de guerrilheiros e num trauma profundo para a população ribeirinha que ficou no fogo cruzado.
                 </p>
              </div>

              {/* Mostra a 2ª foto da guerrilha (se houver) */}
              {fotosGuerrilha[1] && (
                <FotoAlbum src={fotosGuerrilha[1].imagem_url} caption={fotosGuerrilha[1].legenda} rotate="2deg" className="md:mt-8" />
              )}
           </div>
        </div>
      </section>

      {/* SECÇÃO 3: PATRIMÓNIO NATURAL E ARQUEOLOGIA */}
      <section className="py-24 px-5 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 order-2 lg:order-1 relative">
             <div className="absolute -z-10 top-0 left-0 w-full h-full border-4 border-dashed border-[#009640]/20 rounded-full scale-150 animate-[spin_20s_linear_infinite]" />
             
             {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#00577C]" /></div>
             ) : fotosArqueologia[0] ? (
                <FotoAlbum src={fotosArqueologia[0].imagem_url} caption={fotosArqueologia[0].legenda} rotate="-3deg" className="w-[80%] mx-auto" />
             ) : null}
          </div>
          
          <div className="flex-1 space-y-8 order-1 lg:order-2">
            <div className="inline-block px-3 py-1 bg-[#009640]/10 text-[#009640] rounded-md text-xs font-black uppercase tracking-widest shadow-sm">
              Emancipação e Ancestralidade
            </div>
            <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900`}>
              Liberdade e <br/><span className="text-[#009640]">Identidade</span>
            </h2>
            <div className="text-lg text-slate-600 leading-relaxed space-y-6 font-medium">
              <p>
                Após os duros anos de conflito, a vila precisava ditar o seu próprio destino. O território pertencia ao gigantesco município de Conceição do Araguaia. Graças à força e organização da comunidade, realizou-se um plebiscito e, no dia **10 de maio de 1988**, a Lei Estadual nº 5.441 garantiu a tão sonhada emancipação política, tornando São Geraldo do Araguaia oficialmente um município independente.
              </p>
              <p>
                Com a independência, a cidade começou a olhar para a sua maior riqueza: a **Serra das Andorinhas**. Declarada Parque Estadual em 2001, a serra não é apenas um santuário de biodiversidade amazónica, mas um dos mais importantes sítios arqueológicos do país. Possui centenas de cavernas adornadas com gravuras e pinturas rupestres que datam de milhares de anos, comprovando que civilizações complexas já habitavam esta região amazónica muito antes da história registada em papel.
              </p>
            </div>
            <div className="pt-4 flex gap-8 border-t border-slate-100">
               <div><p className="text-3xl font-black text-[#00577C]">1988</p><p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Ano de Emancipação</p></div>
               <div><p className="text-3xl font-black text-[#009640]">400+</p><p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Cavernas Arqueológicas</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* SECÇÃO 4: O PRESENTE E O FUTURO */}
      <section className="py-24 px-5 bg-[#00577C] text-white">
        <div className="mx-auto max-w-5xl text-center">
          <Landmark className="mx-auto mb-10 text-[#F9C400] w-16 h-16" />
          <h2 className={`${jakarta.className} text-4xl md:text-6xl font-black mb-8`}>
            A Cidade Amada segue em frente.
          </h2>
          <p className="text-xl text-blue-100 mb-12 leading-relaxed font-medium">
            São Geraldo do Araguaia transformou um passado de lutas numa história de superação e preservação. Hoje, é sinónimo de desenvolvimento sustentável. Uma cidade que se orgulha das suas raízes, valoriza o seu património arqueológico inestimável e abre os braços para o ecoturismo, gerando emprego e renda para o seu povo ao som das águas do Araguaia.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
             <Link href="/galeria" className="bg-[#F9C400] text-[#00577C] px-8 py-4 rounded-full font-black uppercase text-sm shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
               <Camera size={18} /> Ver Álbum de Fotos
             </Link>
             <Link href="/roteiro" className="border border-white/30 text-white px-8 py-4 rounded-full font-black uppercase text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
               <Compass size={18} /> Explorar Roteiro Atual
             </Link>
          </div>
        </div>
      </section>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="py-20 px-8 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
               <img src="/logop.png" alt="Prefeitura SGA" className="h-20 object-contain" />
               <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">São Geraldo do Araguaia <br/> "Cidade Amada, seguindo em frente"</p>
            </div>
            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Gestão Executiva</h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Prefeito: <br/><b>Jefferson Douglas de Jesus Oliveira</b></li>
                <li>Vice-Prefeito: <br/><b>Marcos Antônio Candido de Lucena</b></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Turismo (SEMTUR)</h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Secretária: <br/><b>Micheli Stephany de Souza</b></li>
                <li>Contato: <b>(94) 98145-2067</b></li>
                <li>Email: <b>setursaga@gmail.com</b></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Equipe Técnica</h5>
              <ul className="text-sm text-slate-500 space-y-2 font-medium">
                <li>• Adriana da Luz Lima</li>
                <li>• Carmelita Luz da Silva</li>
                <li>• Diego Silva Costa</li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-10 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Secretaria Municipal de Turismo - São Geraldo do Araguaia (PA)</p>
          </div>
        </div>
      </footer>
    </main>
  );
}