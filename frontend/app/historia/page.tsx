'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import {
  Menu, BookOpen, Camera, Loader2, Compass, Landmark, History, Fish, TreePine, Mountain, Waves, Leaf, ChevronDown
} from 'lucide-react';
import { Plus_Jakarta_Sans, Merriweather, Playfair_Display } from 'next/font/google';
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

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['italic', 'normal'],
});

type FotoHistoria = {
  id: string;
  imagem_url: string;
  legenda: string;
  seccao: string;
};

function FotoAlbum({ src, caption, rotate = "0deg", className = "" }: {
  src: string; caption: string; rotate?: string; className?: string;
}) {
  return (
    <div
      className={`relative p-3 bg-white shadow-2xl border border-slate-100 transition-all duration-500 hover:scale-105 hover:z-20 hover:shadow-emerald-200/40 hover:rotate-0 ${className}`}
      style={{ transform: `rotate(${rotate})` }}
    >
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <Image src={src} alt={caption} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      <p className={`${merriweather.className} text-xs md:text-sm text-slate-500 mt-3 italic text-center`}>{caption}</p>
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-amber-300/30 backdrop-blur-sm -rotate-45" />
      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-300/20 backdrop-blur-sm rotate-12" />
    </div>
  );
}

/* ── SVG animado do rio ──────────────────────────────── */
function RiverDivider({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className={`relative overflow-hidden ${inverted ? 'rotate-180' : ''}`} style={{ height: 80 }}>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
        <path d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1440,20 1440,40 L1440,80 L0,80 Z" fill="currentColor" className="text-white" />
      </svg>
    </div>
  );
}

/* ── Ícone de peixe decorativo ──────────────────────── */
function FloatingFish({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <svg viewBox="0 0 80 40" className={`opacity-10 ${className}`} style={style} fill="currentColor">
      <path d="M60,20 C50,8 30,4 5,12 L15,20 L5,28 C30,36 50,32 60,20Z" />
      <path d="M62,20 L75,12 L72,20 L75,28 Z" />
      <circle cx="52" cy="17" r="2" fill="white" />
    </svg>
  );
}

/* ── Ondas animadas de fundo ────────────────────────── */
function AnimatedWaves({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-x-0 bottom-0 overflow-hidden pointer-events-none ${className}`}>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-28 opacity-20">
        <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" fill="#009640">
          <animate attributeName="d"
            values="
              M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z;
              M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,120 L0,120 Z;
              M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z
            "
            dur="8s" repeatCount="indefinite" />
        </path>
        <path d="M0,80 C360,40 720,100 1080,60 C1260,40 1380,80 1440,70 L1440,120 L0,120 Z" fill="#00577C" opacity="0.6">
          <animate attributeName="d"
            values="
              M0,80 C360,40 720,100 1080,60 C1260,40 1380,80 1440,70 L1440,120 L0,120 Z;
              M0,70 C360,100 720,50 1080,80 C1260,100 1380,60 1440,90 L1440,120 L0,120 Z;
              M0,80 C360,40 720,100 1080,60 C1260,40 1380,80 1440,70 L1440,120 L0,120 Z
            "
            dur="6s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
}

/* ── Card de estatística ──────────────────────────── */
function StatCard({ value, label, icon: Icon, color }: {
  value: string; label: string; icon: any; color: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-3 p-8 rounded-3xl bg-white/80 backdrop-blur shadow-xl border border-white/60 hover:scale-105 transition-transform duration-300`}>
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <p className={`${jakarta.className} text-4xl font-black text-slate-900`}>{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">{label}</p>
    </div>
  );
}

export default function HistoriaPage() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const [fotos, setFotos] = useState<FotoHistoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFotos() {
      const { data } = await supabase.from('historia_fotos').select('*');
      if (data) setFotos(data);
      setLoading(false);
    }
    fetchFotos();
  }, []);

  const fotosOrigens = fotos.filter(f => f.seccao === 'origens');
  const fotosGuerrilha = fotos.filter(f => f.seccao === 'guerrilha');
  const fotosArqueologia = fotos.filter(f => f.seccao === 'arqueologia');

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      if (y < 80) setShowHeader(true);
      else if (y > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(y);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <main className={`${jakarta.className} min-h-screen bg-[#FDFCF7] text-slate-900 overflow-x-hidden`}>

      {/* ───── HEADER (mantido exatamente como estava) ───── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
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

      {/* ───── HERO ─── IMERSIVO COM PARALAXE LEVE ───── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Fundo gradiente tipo pôr-do-sol no Araguaia */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#001f3f] via-[#00577C] to-[#009640]" />

        {/* Silhueta da mata em SVG */}
        <div className="absolute bottom-0 inset-x-0 pointer-events-none">
          <svg viewBox="0 0 1440 300" className="w-full" preserveAspectRatio="none">
            {/* camada de trás – mata escura */}
            <path d="M0,220 C60,180 100,200 140,190 C180,180 200,160 240,170 C280,180 300,155 340,165 C380,175 410,150 450,160 C490,170 510,145 560,155 C610,165 640,140 680,145 C720,150 760,130 800,135 C840,140 880,120 920,125 C960,130 1000,110 1040,115 C1080,120 1120,100 1160,108 C1200,116 1240,95 1280,100 C1320,105 1380,90 1440,95 L1440,300 L0,300 Z" fill="#003d1c" />
            {/* árvores/palmas decorativas */}
            <path d="M100,190 L108,260 M108,260 L104,250 M108,260 L112,250 M100,190 C90,175 85,165 95,160 C95,160 100,170 100,190 M100,190 C110,175 115,165 105,160 C105,160 100,170 100,190" stroke="#005c27" strokeWidth="3" fill="none" />
            <path d="M320,170 L330,260 M320,170 C308,150 300,138 312,132 M320,170 C332,150 340,138 328,132" stroke="#005c27" strokeWidth="3" fill="none" />
            <path d="M600,155 L610,260 M600,155 C588,133 579,120 592,114 M600,155 C612,133 621,120 608,114" stroke="#005c27" strokeWidth="3" fill="none" />
            <path d="M900,125 L910,260 M900,125 C888,103 879,90 892,84 M900,125 C912,103 921,90 908,84" stroke="#005c27" strokeWidth="3" fill="none" />
            <path d="M1200,100 L1210,260 M1200,100 C1188,78 1179,65 1192,59 M1200,100 C1212,78 1221,65 1208,59" stroke="#005c27" strokeWidth="3" fill="none" />

            {/* camada da frente – beira do rio + reflexo */}
            <path d="M0,260 C120,240 240,250 360,245 C480,240 600,255 720,248 C840,241 960,256 1080,250 C1200,244 1320,258 1440,252 L1440,300 L0,300 Z" fill="#00577C" opacity="0.7" />
            <path d="M0,275 C180,265 360,280 540,272 C720,264 900,278 1080,270 C1260,262 1380,275 1440,270 L1440,300 L0,300 Z" fill="#009640" opacity="0.4" />
          </svg>
        </div>

        {/* Peixes flutuando no fundo */}
        <FloatingFish className="absolute text-white w-32 top-1/3 left-16 animate-[float_8s_ease-in-out_infinite]" />
        <FloatingFish className="absolute text-amber-300 w-24 top-1/2 right-24 animate-[float_11s_ease-in-out_infinite_2s] -scale-x-100" />
        <FloatingFish className="absolute text-emerald-300 w-16 bottom-1/3 left-1/3 animate-[float_9s_ease-in-out_infinite_4s]" />

        {/* Estrelas/faíscas */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${5 + Math.random() * 40}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}

        {/* Conteúdo central */}
        <div className="relative z-10 text-center px-5 max-w-5xl mx-auto mt-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F9C400]/20 text-[#F9C400] rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-[#F9C400]/30 backdrop-blur">
            <BookOpen size={13} /> Memórias da Cidade Amada
          </div>

          <h1 className={`${playfair.className} text-6xl md:text-9xl font-black text-white tracking-tight leading-none mb-6`}
            style={{ textShadow: '0 4px 40px rgba(0,0,0,0.5)' }}>
            Nossa<br />
            <span className="italic text-[#F9C400]">História</span>
          </h1>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16 bg-white/30" />
            <Waves className="text-white/50 w-5 h-5" />
            <div className="h-px w-16 bg-white/30" />
          </div>

          <p className={`${merriweather.className} text-xl md:text-2xl text-white/80 italic leading-relaxed max-w-3xl mx-auto`}>
            "Das águas sagradas do Araguaia às grutas milenares da Serra das Andorinhas — um povo que nasceu forte."
          </p>

          <a href="#origens" className="mt-12 inline-flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors group">
            <span className="text-xs font-bold uppercase tracking-widest">Mergulhar na história</span>
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </a>
        </div>
      </section>

      {/* ───── TIMELINE HORIZONTAL DE MARCOS ───── */}
      <section className="py-20 px-5 bg-gradient-to-r from-[#00577C] to-[#003d5c] overflow-hidden relative">
        {/* Ondas decorativas */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <div key={i}
              className="absolute inset-0 border-t border-white"
              style={{ transform: `translateY(${20 + i * 16}px) scaleY(${0.3 + i * 0.1})`, borderRadius: '50%' }} />
          ))}
        </div>

        <div className="mx-auto max-w-7xl relative z-10">
          <p className="text-center text-[#F9C400] text-xs font-black uppercase tracking-widest mb-12">Linha do Tempo</p>
          <div className="flex items-start gap-0 overflow-x-auto pb-4 scrollbar-hide">
            {[
              { year: '1950', label: 'Primeiros desbravadores chegam ao Araguaia', icon: Compass },
              { year: '1960s', label: 'Vila cresce com garimpeiros e agricultores', icon: Landmark },
              { year: '1972', label: 'Guerrilha do Araguaia — conflito e resistência', icon: History },
              { year: '1988', label: 'Emancipação política — São Geraldo se torna município', icon: Leaf },
              { year: '2001', label: 'Serra das Andorinhas torna-se Parque Estadual', icon: TreePine },
              { year: 'Hoje', label: 'Ecoturismo, pesca e identidade ribeirinha', icon: Fish },
            ].map((item, i, arr) => (
              <div key={i} className="flex items-start min-w-[220px] md:min-w-0 md:flex-1">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#F9C400] flex items-center justify-center shadow-lg flex-shrink-0 z-10">
                    <item.icon className="w-5 h-5 text-[#00577C]" />
                  </div>
                  {i < arr.length - 1 && <div className="w-0.5 h-full bg-white/20 mt-2 hidden md:block" style={{ minHeight: 60 }} />}
                </div>
                <div className="ml-4 pb-8">
                  <p className={`${jakarta.className} text-2xl font-black text-[#F9C400]`}>{item.year}</p>
                  <p className="text-white/70 text-sm font-medium leading-snug mt-1 max-w-[160px]">{item.label}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden md:flex flex-1 items-center mt-6 mx-2">
                    <div className="flex-1 h-px bg-white/20 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── SECÇÃO 1: ORIGENS — RIO E FÉ ───── */}
      <section id="origens" className="relative py-28 px-5 bg-[#FDFCF7] overflow-hidden">

        {/* Detalhe decorativo — onda de fundo */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-[#009640]/5 blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#00577C]/5 blur-[100px] pointer-events-none" />

        {/* Padrão de ondas sutil */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, #00577C, #00577C 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, #00577C, #00577C 1px, transparent 1px, transparent 32px)' }} />

        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 text-[#00577C] bg-[#00577C]/8 px-4 py-2 rounded-full">
              <Waves size={16} />
              <span className="font-black uppercase tracking-widest text-xs">A Fundação e a Fé</span>
            </div>

            <h2 className={`${playfair.className} text-5xl md:text-6xl font-black text-slate-900 leading-none`}>
              Nascidos<br />
              <span className="italic text-[#00577C]">às margens</span><br />
              do Araguaia
            </h2>

            {/* Caixa de citação decorativa */}
            <div className="relative pl-8 border-l-4 border-[#F9C400]">
              <div className={`${merriweather.className} text-3xl text-[#F9C400] absolute -top-2 left-0 leading-none`}>"</div>
              <p className={`${merriweather.className} italic text-lg text-slate-600 leading-relaxed`}>
                Eles vieram com as mãos calejadas e a fé no coração — do Maranhão, de Minas, da Bahia — para fazer morada nas beiradas do grande rio.
              </p>
            </div>

            <div className="text-base text-slate-600 leading-relaxed space-y-5 font-medium">
              <p>
                A história de São Geraldo do Araguaia remonta a meados do século XX. O desbravamento da região começou timidamente por volta de <strong className="text-[#00577C]">1950</strong>, quando garimpeiros e agricultores chegaram às margens do Rio Araguaia em busca de pedras preciosas — cristal de rocha e diamantes — e de terras férteis para recomeçar a vida.
              </p>
              <p>
                Aos poucos, o pequeno acampamento ribeirinho foi ganhando contornos de vila. A fé cristã sempre foi o grande alicerce destes pioneiros. Foi o missionário dominicano <strong className="text-[#009640]">Frei Gil de Vila Nova</strong> quem, ao realizar as primeiras missas sob barracas de lona, sugeriu que a localidade fosse batizada em honra a São Geraldo de Majela, o santo redentorista protetor das mães e dos trabalhadores.
              </p>
            </div>

            {/* Ícones de identidade ribeirinha */}
            <div className="flex gap-4 pt-4">
              {[
                { icon: Fish, label: 'Pesca', color: 'bg-[#00577C]' },
                { icon: Waves, label: 'Rio Araguaia', color: 'bg-[#009640]' },
                { icon: TreePine, label: 'Mata', color: 'bg-emerald-700' },
                { icon: Mountain, label: 'Serra', color: 'bg-amber-600' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fotos da Supabase — secção origens */}
          <div className="grid grid-cols-2 gap-5 relative">
            <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#009640]/5 to-[#00577C]/5 rounded-[3rem] scale-110" />
            {loading ? (
              <div className="col-span-2 flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-[#00577C]" />
              </div>
            ) : fotosOrigens.length > 0 ? fotosOrigens.map((foto, index) => (
              <FotoAlbum
                key={foto.id}
                src={foto.imagem_url}
                caption={foto.legenda}
                rotate={index % 2 === 0 ? "-2.5deg" : "3deg"}
                className={index % 2 === 0 ? "mt-12" : ""}
              />
            )) : (
              /* placeholder se não tiver fotos */
              [1, 2].map(i => (
                <div key={i} className={`bg-gradient-to-br from-[#00577C]/10 to-[#009640]/10 rounded-xl h-72 flex items-center justify-center ${i % 2 === 0 ? 'mt-12' : ''}`}>
                  <Camera className="w-10 h-10 text-[#00577C]/30" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ───── DIVISOR — RIO ───── */}
      <div className="relative h-32 bg-gradient-to-b from-[#FDFCF7] to-[#001f3f]">
        <AnimatedWaves className="bottom-0" />
      </div>

      {/* ───── SECÇÃO 2: GUERRILHA DO ARAGUAIA ───── */}
      <section className="relative py-28 px-5 bg-[#001f3f] text-white overflow-hidden">

        {/* Textura de folhas / mata */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, #009640 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #00577C 0%, transparent 60%)' }} />

        {/* Linha horizontal decorativa — "silêncio" */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 pointer-events-none" />

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-amber-300 text-xs font-black uppercase tracking-widest mb-8 border border-white/10">
              <History size={13} /> Memória e Resistência
            </div>
            <h2 className={`${playfair.className} text-5xl md:text-7xl font-black italic text-white mb-6 leading-tight`}>
              "Onde o Brasil<br />
              <span className="text-[#F9C400]">Silenciou"</span>
            </h2>
            <p className="text-lg text-white/60 leading-relaxed font-medium">
              São Geraldo do Araguaia não é apenas beleza natural — é solo de resistência. Durante a década de 1970, a pacata região foi palco de um dos episódios mais densos e silenciados da ditadura militar brasileira: a <strong className="text-white">Guerrilha do Araguaia</strong>.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Foto 1 guerrilha */}
            <div>
              {loading ? <div className="h-72 bg-white/5 rounded-2xl animate-pulse" />
                : fotosGuerrilha[0]
                  ? <FotoAlbum src={fotosGuerrilha[0].imagem_url} caption={fotosGuerrilha[0].legenda} rotate="-1.5deg" />
                  : <div className="h-72 bg-white/5 rounded-2xl flex items-center justify-center"><Camera className="w-10 h-10 text-white/20" /></div>
              }
            </div>

            {/* Card central de texto */}
            <div className="relative p-8 rounded-[2rem] border border-[#F9C400]/20 bg-gradient-to-b from-[#F9C400]/10 to-transparent overflow-hidden group">
              <div className="absolute inset-0 bg-[#F9C400]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700 rounded-[2rem]" />
              <History className="mb-5 text-[#F9C400] w-10 h-10" />
              <h3 className={`${jakarta.className} text-2xl font-black mb-5 text-white`}>A Luta na Floresta</h3>
              <p className="text-white/60 leading-relaxed text-sm font-medium relative z-10">
                No final dos anos 60, militantes do Partido Comunista do Brasil instalaram-se clandestinamente nas matas locais, prestando apoio médico e alfabetização aos camponeses. Ao descobrir a base em <strong className="text-white">1972</strong>, as Forças Armadas deflagraram a maior mobilização militar do país desde a Segunda Guerra Mundial. A repressão foi implacável, resultando no desaparecimento de dezenas de guerrilheiros e num trauma profundo para a população ribeirinha que ficou no fogo cruzado.
              </p>
              <div className="mt-6 pt-6 border-t border-white/10 flex gap-6">
                <div><p className={`${jakarta.className} text-2xl font-black text-[#F9C400]`}>70+</p><p className="text-xs text-white/40 font-bold uppercase tracking-wide">Desaparecidos</p></div>
                <div><p className={`${jakarta.className} text-2xl font-black text-[#F9C400]`}>3 anos</p><p className="text-xs text-white/40 font-bold uppercase tracking-wide">De conflito</p></div>
              </div>
            </div>

            {/* Foto 2 guerrilha */}
            <div className="md:mt-10">
              {loading ? <div className="h-72 bg-white/5 rounded-2xl animate-pulse" />
                : fotosGuerrilha[1]
                  ? <FotoAlbum src={fotosGuerrilha[1].imagem_url} caption={fotosGuerrilha[1].legenda} rotate="2deg" />
                  : <div className="h-72 bg-white/5 rounded-2xl flex items-center justify-center"><Camera className="w-10 h-10 text-white/20" /></div>
              }
            </div>
          </div>
        </div>

        <AnimatedWaves className="bottom-0 opacity-30" />
      </section>

      {/* ───── DIVISOR ───── */}
      <div className="h-24 bg-gradient-to-b from-[#001f3f] to-[#FDFCF7]" />

      {/* ───── SECÇÃO 3: EMANCIPAÇÃO + ARQUEOLOGIA + NATUREZA ───── */}
      <section className="py-24 px-5 bg-[#FDFCF7] relative overflow-hidden">

        {/* círculo decorativo girando */}
        <div className="absolute right-0 top-0 w-[800px] h-[800px] border border-dashed border-[#009640]/10 rounded-full translate-x-1/2 -translate-y-1/4 pointer-events-none animate-[spin_40s_linear_infinite]" />

        <div className="mx-auto max-w-7xl">

          {/* Título da secção */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#009640]/10 text-[#009640] rounded-full text-xs font-black uppercase tracking-widest mb-6">
              <Mountain size={13} /> Serra das Andorinhas
            </div>
            <h2 className={`${playfair.className} text-5xl md:text-7xl font-black text-slate-900`}>
              Liberdade &<br />
              <span className="italic text-[#009640]">Ancestralidade</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-20 items-center mb-24">

            {/* Foto arqueologia da Supabase */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#009640]/10 to-[#00577C]/10 rounded-[3rem] scale-110 -z-10" />
              <div className="absolute -z-10 inset-0 border-4 border-dashed border-[#009640]/15 rounded-full scale-125 animate-[spin_25s_linear_infinite]" />
              {loading ? (
                <div className="h-80 bg-[#009640]/10 rounded-2xl animate-pulse flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#009640]" />
                </div>
              ) : fotosArqueologia[0] ? (
                <FotoAlbum src={fotosArqueologia[0].imagem_url} caption={fotosArqueologia[0].legenda} rotate="-3deg" className="w-[85%] mx-auto" />
              ) : (
                <div className="h-80 bg-[#009640]/10 rounded-2xl flex items-center justify-center">
                  <Camera className="w-10 h-10 text-[#009640]/30" />
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="text-base text-slate-600 leading-relaxed space-y-5 font-medium">
                <p>
                  Após os duros anos de conflito, a vila precisava ditar o seu próprio destino. O território pertencia ao gigantesco município de Conceição do Araguaia. Graças à força e organização da comunidade, realizou-se um plebiscito e, no dia <strong className="text-[#00577C]">10 de maio de 1988</strong>, a Lei Estadual nº 5.441 garantiu a tão sonhada emancipação política.
                </p>
                <p>
                  Com a independência, a cidade começou a olhar para a sua maior riqueza: a <strong className="text-[#009640]">Serra das Andorinhas</strong>. Declarada Parque Estadual em 2001, a serra é um santuário de biodiversidade amazónica e um dos mais importantes sítios arqueológicos do país. Centenas de cavernas adornadas com gravuras e pinturas rupestres datam de milhares de anos.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <StatCard value="1988" label="Emancipação" icon={Leaf} color="bg-[#00577C]" />
                <StatCard value="400+" label="Cavernas" icon={Mountain} color="bg-[#009640]" />
                <StatCard value="2001" label="Parque Est." icon={TreePine} color="bg-amber-600" />
              </div>
            </div>
          </div>

          {/* ── Bloco do ecoturismo / pesca / natureza ── */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Fish,
                title: 'Pesca Esportiva',
                text: 'O Rio Araguaia é um dos maiores paraísos da pesca esportiva do Brasil. Tucunaré, piranha, matrinxã e pirarucu habitam as suas águas cristalinas. Cada temporada de pesca é uma celebração da cultura ribeirinha que fundou a cidade.',
                color: 'from-[#00577C] to-[#003d5c]',
                accent: '#F9C400',
              },
              {
                icon: Mountain,
                title: 'Grutas e Cachoeiras',
                text: 'A Serra das Andorinhas esconde cachoeiras de tirar o fôlego, grutas de formações calcárias milenares e trilhas com vistas privilegiadas para a Amazónia. Um destino de ecoturismo que respeita e celebra cada pedra ancestral.',
                color: 'from-[#009640] to-[#005c27]',
                accent: '#F9C400',
              },
              {
                icon: Leaf,
                title: 'Agropecuária & Povo',
                text: 'A terra generosa do Sul do Pará sustenta famílias há gerações. A agropecuária é a espinha dorsal da economia local, praticada com respeito ao bioma e com o orgulho de quem faz do Araguaia a sua casa.',
                color: 'from-amber-700 to-amber-900',
                accent: '#F9C400',
              },
            ].map((card) => (
              <div key={card.title}
                className={`relative p-8 rounded-[2rem] bg-gradient-to-br ${card.color} text-white overflow-hidden group hover:scale-[1.02] transition-transform duration-300 shadow-2xl`}>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                <card.icon className="mb-5 w-10 h-10" style={{ color: card.accent }} />
                <h3 className={`${jakarta.className} text-xl font-black mb-3`}>{card.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed font-medium">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── SECÇÃO FINAL: O FUTURO ───── */}
      <section className="relative py-32 px-5 overflow-hidden">
        {/* Fundo inspirado no pôr do sol no rio */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00577C] via-[#003d5c] to-[#001f3f]" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(ellipse at 30% 70%, #F9C400 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, #009640 0%, transparent 50%)' }} />

        {/* Silhueta da mata na base */}
        <div className="absolute bottom-0 inset-x-0 pointer-events-none">
          <svg viewBox="0 0 1440 160" className="w-full" preserveAspectRatio="none">
            <path d="M0,120 C100,90 200,110 300,100 C400,90 500,70 600,80 C700,90 800,65 900,70 C1000,75 1100,55 1200,60 C1300,65 1380,50 1440,55 L1440,160 L0,160 Z" fill="#003d1c" opacity="0.5" />
            <path d="M0,140 C180,120 360,145 540,135 C720,125 900,145 1080,138 C1260,131 1380,145 1440,140 L1440,160 L0,160 Z" fill="#005c27" opacity="0.3" />
          </svg>
        </div>

        {/* Peixes decorativos */}
        <FloatingFish className="absolute text-[#F9C400] w-28 top-1/4 right-32 animate-[float_10s_ease-in-out_infinite_1s] -scale-x-100" />
        <FloatingFish className="absolute text-white w-20 bottom-1/3 left-24 animate-[float_7s_ease-in-out_infinite_3s]" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <Landmark className="mx-auto mb-8 text-[#F9C400] w-16 h-16" />
          <h2 className={`${playfair.className} text-5xl md:text-7xl font-black text-white mb-8 leading-tight`}>
            A Cidade Amada<br />
            <span className="italic text-[#F9C400]">segue em frente.</span>
          </h2>
          <p className="text-xl text-white/70 mb-14 leading-relaxed font-medium max-w-3xl mx-auto">
            São Geraldo do Araguaia transformou um passado de lutas numa história de superação. Uma cidade que se orgulha das raízes ribeirinhas, valoriza o seu património arqueológico inestimável e abre os braços para o ecoturismo — ao som eterno das águas do Araguaia.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/galeria"
              className="bg-[#F9C400] text-[#00577C] px-8 py-4 rounded-full font-black uppercase text-sm shadow-2xl hover:scale-105 transition-transform flex items-center gap-2">
              <Camera size={17} /> Álbum de Fotos
            </Link>
            <Link href="/roteiro"
              className="border-2 border-white/30 text-white px-8 py-4 rounded-full font-black uppercase text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
              <Compass size={17} /> Explorar Roteiro
            </Link>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="py-20 px-8 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <img src="/logop.png" alt="Prefeitura SGA" className="h-20 object-contain" />
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">São Geraldo do Araguaia<br />"Cidade Amada, seguindo em frente"</p>
            </div>
            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Gestão Executiva</h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Prefeito: <br /><b>Jefferson Douglas de Jesus Oliveira</b></li>
                <li>Vice-Prefeito: <br /><b>Marcos Antônio Candido de Lucena</b></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Turismo (SEMTUR)</h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Secretária: <br /><b>Micheli Stephany de Souza</b></li>
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
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Secretaria Municipal de Turismo – São Geraldo do Araguaia (PA)</p>
          </div>
        </div>
      </footer>

      {/* Keyframes globais — adicionar ao globals.css se necessário */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(3deg); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}