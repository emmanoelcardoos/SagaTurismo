'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, Menu, Anchor, Landmark, Compass, History, BookOpen, Camera
} from 'lucide-react';
import { Plus_Jakarta_Sans, Merriweather, Inter } from 'next/font/google';

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
                A história desta terra firme começa a ganhar contornos oficiais em meados do século XX. O nome da cidade é uma homenagem ao santo redentorista **São Geraldo de Majela**, refletindo a profunda fé que os pioneiros trouxeram consigo para as margens do rio.
              </p>
              <p>
                O povoado cresceu entre o Rio Araguaia e a majestosa Serra das Andorinhas, servindo como ponto de apoio para navegantes e exploradores que buscavam novas oportunidades no sudeste paraense.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <FotoAlbum src="https://images.unsplash.com/photo-1544943971-d861676462bb?q=80&w=800" caption="As águas que deram vida à vila" rotate="-2deg" className="mt-12" />
             <FotoAlbum src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800" caption="Registos da fé pioneira" rotate="3deg" />
          </div>
        </div>
      </section>

      {/* SECÇÃO 2: GUERRILHA DO ARAGUAIA (A MEMÓRIA VIVA) */}
      <section className="py-24 px-5 bg-slate-50 relative">
        <div className="mx-auto max-w-7xl">
           <div className="text-center mb-20 max-w-3xl mx-auto">
             <h2 className={`${merriweather.className} text-4xl font-black text-[#00577C] mb-6 italic`}>"Onde o Brasil Silenciou"</h2>
             <p className="text-lg text-slate-600">
               São Geraldo do Araguaia não é apenas beleza natural; é solo de resistência. Durante a década de 70, a região foi palco da **Guerrilha do Araguaia**, um dos capítulos mais marcantes e sensíveis da história brasileira.
             </p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8 mb-16">
              <FotoAlbum src="https://images.unsplash.com/photo-1621535492451-b844101e40c4?q=80&w=800" caption="A mata que guarda segredos" rotate="-1deg" />
              <div className="flex flex-col justify-center p-8 bg-[#00577C] rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                 <History className="mb-6 text-[#F9C400] w-12 h-12" />
                 <h3 className={`${jakarta.className} text-2xl font-black mb-4`}>Patrimônio Histórico</h3>
                 <p className="text-blue-100 leading-relaxed font-medium">
                   Hoje, a cidade trabalha para transformar essas memórias em educação e turismo histórico, honrando a vida dos que aqui passaram.
                 </p>
              </div>
              <FotoAlbum src="https://images.unsplash.com/photo-1596462502278-27bf8d53e16f?q=80&w=800" caption="O Araguaia testemunha de gerações" rotate="2deg" className="mt-8" />
           </div>
        </div>
      </section>

      {/* SECÇÃO 3: PATRIMÓNIO NATURAL E ARQUEOLOGIA */}
      <section className="py-24 px-5 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 order-2 lg:order-1 relative">
             <div className="absolute -z-10 top-0 left-0 w-full h-full border-4 border-dashed border-[#009640]/20 rounded-full scale-150 animate-[spin_20s_linear_infinite]" />
             <FotoAlbum src="https://images.pexels.com/photos/33153432/pexels-photo-33153432.jpeg" caption="Pinturas Rupestres: Nossa primeira escrita" rotate="-3deg" className="w-[80%] mx-auto" />
          </div>
          
          <div className="flex-1 space-y-8 order-1 lg:order-2">
            <div className="inline-block px-3 py-1 bg-[#009640]/10 text-[#009640] rounded-md text-xs font-black uppercase tracking-widest shadow-sm">
              Ancestralidade
            </div>
            <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900`}>
              Escrito nas Pedras da <span className="text-[#009640]">Serra</span>
            </h2>
            <div className="text-lg text-slate-600 leading-relaxed space-y-6 font-medium">
              <p>
                Milhares de anos antes dos primeiros navegantes, civilizações antigas já chamavam São Geraldo de casa. A **Serra das Andorinhas** abriga um tesouro arqueológico com centenas de gravuras e pinturas rupestres.
              </p>
              <p>
                Este património torna o município um museu a céu aberto, onde a natureza preserva a arte dos nossos antepassados sob o olhar atento das andorinhas que cruzam os céus todos os finais de tarde.
              </p>
            </div>
            <div className="pt-4 flex gap-8 border-t border-slate-100">
               <div><p className="text-3xl font-black text-[#00577C]">400+</p><p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Cavidades catalogadas</p></div>
               <div><p className="text-3xl font-black text-[#009640]">60k</p><p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Hectares de preservação</p></div>
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
            São Geraldo do Araguaia hoje é sinónimo de desenvolvimento sustentável. Uma cidade que se orgulha do seu passado, preserva a sua cultura araguaiense e abre os braços para o turismo que gera emprego e renda para o seu povo.
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