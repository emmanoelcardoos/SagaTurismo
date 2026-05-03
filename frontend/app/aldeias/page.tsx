'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Loader2, MapPin, ArrowRight, ChevronDown } from 'lucide-react';
import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '700', '900'], style: ['normal', 'italic'] });

type Aldeia = {
  id: string;
  nome: string;
  povo: string;
  imagem_capa: string;
  localizacao: string;
};

// Padrão geométrico indígena em SVG inline
function PatternBorder() {
  return (
    <svg viewBox="0 0 400 20" preserveAspectRatio="none" className="w-full h-5" aria-hidden>
      <pattern id="indigena" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
        <rect width="40" height="20" fill="#00577C" />
        <polygon points="0,0 10,10 0,20" fill="#F9C400" />
        <polygon points="10,0 20,10 10,20 0,10" fill="#009640" />
        <polygon points="20,0 30,10 20,20 10,10" fill="#F9C400" />
        <polygon points="30,0 40,10 30,20 20,10" fill="#009640" />
        <polygon points="40,0 40,20 30,10" fill="#F9C400" />
      </pattern>
      <rect width="400" height="20" fill="url(#indigena)" />
    </svg>
  );
}

function PatternBorderBottom() {
  return (
    <svg viewBox="0 0 400 20" preserveAspectRatio="none" className="w-full h-5" aria-hidden>
      <pattern id="indigena2" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
        <rect width="40" height="20" fill="transparent" />
        <polygon points="0,0 10,10 0,20" fill="#F9C400" opacity="0.6" />
        <polygon points="10,0 20,10 10,20 0,10" fill="#009640" opacity="0.6" />
        <polygon points="20,0 30,10 20,20 10,10" fill="#F9C400" opacity="0.6" />
        <polygon points="30,0 40,10 30,20 20,10" fill="#009640" opacity="0.6" />
        <polygon points="40,0 40,20 30,10" fill="#F9C400" opacity="0.6" />
      </pattern>
      <rect width="400" height="20" fill="url(#indigena2)" />
    </svg>
  );
}

export default function AldeiasPage() {
  const [aldeias, setAldeias] = useState<Aldeia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    async function fetchAldeias() {
      const { data } = await supabase
        .from('aldeias')
        .select('id, nome, povo, imagem_capa, localizacao')
        .order('nome');
      if (data) setAldeias(data);
      setLoading(false);
    }
    fetchAldeias();
  }, []);

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
    <main className={`${jakarta.className} min-h-screen bg-[#FAFAF7] text-slate-900 pb-32`}>

      {/* ── HEADER ── */}
      <header
        className={`fixed left-0 top-0 z-50 w-full bg-white/98 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}
        style={{ borderBottom: '3px solid #F9C400' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-4">
            <img src="/logop.png" alt="Prefeitura" className="h-14 w-auto object-contain" />
            <div className="hidden border-l-2 border-[#F9C400] pl-4 sm:block">
              <p className={`${playfair.className} text-xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Secretaria de Turismo · São Geraldo do Araguaia
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {['Roteiro', 'Onde Ficar', 'Onde Comer'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '')}`}
                className="text-sm font-semibold text-slate-600 hover:text-[#00577C] transition-colors">
                {item}
              </a>
            ))}
            <Link href="/cadastro"
              className="rounded-full bg-[#00577C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#004a6b] transition-colors shadow">
              Cartão do Residente
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Imagem de fundo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.pexels.com/photos/12434691/pexels-photo-12434691.jpeg"
            alt="Aldeias Indígenas do Araguaia"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Overlay gradiente forte */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#001f2e]/85 via-[#00577C]/70 to-[#001f2e]/95" />
        </div>

        {/* Padrão decorativo no topo */}
        <div className="absolute top-[72px] left-0 right-0 z-10 opacity-60">
          <PatternBorder />
        </div>

        {/* Conteúdo central */}
        <div className="relative z-10 mx-auto max-w-5xl px-5 text-center pt-32 pb-24">
          {/* Rótulo etno */}
          <div className="inline-flex items-center gap-3 mb-8">
            <span className="h-px w-12 bg-[#F9C400]" />
            <span className="text-[#F9C400] text-xs font-bold uppercase tracking-[0.3em]">
              Patrimônio Vivo do Araguaia
            </span>
            <span className="h-px w-12 bg-[#F9C400]" />
          </div>

          <h1 className={`${playfair.className} text-6xl md:text-8xl font-black text-white leading-none mb-6`}>
            Povos{' '}
            <em className="text-[#F9C400] not-italic">Originários</em>
          </h1>
          <p className="text-lg md:text-xl text-blue-100/90 max-w-2xl mx-auto font-medium leading-relaxed">
            Guardiões da floresta e da memória ancestral. Conheça as aldeias indígenas de São Geraldo do Araguaia
            — suas histórias, tradições e o pulso vivo da cultura nativa.
          </p>

          {/* Seta animada */}
          <div className="mt-16 flex justify-center animate-bounce text-[#F9C400]/70">
            <ChevronDown size={36} />
          </div>
        </div>

        {/* Padrão decorativo na base */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <PatternBorder />
        </div>
      </section>

      {/* ── INTRO ── */}
      <section className="bg-[#00577C] text-white py-16 px-5">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row gap-10 items-center">
          {/* Ornamento gráfico */}
          <div className="flex-shrink-0 w-32 h-32 rounded-full border-4 border-[#F9C400] flex items-center justify-center bg-[#004a6b]">
            <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
              <circle cx="40" cy="40" r="36" stroke="#F9C400" strokeWidth="2" />
              <path d="M40 10 L50 30 L40 25 L30 30 Z" fill="#F9C400" />
              <path d="M40 70 L50 50 L40 55 L30 50 Z" fill="#009640" />
              <path d="M10 40 L30 30 L25 40 L30 50 Z" fill="#009640" />
              <path d="M70 40 L50 30 L55 40 L50 50 Z" fill="#F9C400" />
              <circle cx="40" cy="40" r="8" fill="#F9C400" opacity="0.3" />
            </svg>
          </div>
          <div>
            <h2 className={`${playfair.className} text-3xl font-bold mb-4`}>
              A Terra que Pulsa com Memória
            </h2>
            <p className="text-blue-100 leading-relaxed text-base">
              O município de São Geraldo do Araguaia é lar de povos indígenas que mantêm viva uma das mais ricas
              heranças culturais do Brasil. Cada aldeia é um universo próprio de língua, ritual, arte e saber.
              Ao visitá-las — com respeito e escuta — o visitante se conecta com a verdadeira alma do território.
            </p>
          </div>
        </div>
      </section>

      {/* ── GRID DE ALDEIAS ── */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[#009640] text-xs font-bold uppercase tracking-[0.25em] mb-2">Comunidades cadastradas</p>
            <h2 className={`${playfair.className} text-4xl md:text-5xl font-black text-[#00577C]`}>
              Aldeias do Município
            </h2>
          </div>
          {!loading && aldeias.length > 0 && (
            <span className="hidden md:block text-5xl font-black text-slate-100 select-none">
              {String(aldeias.length).padStart(2, '0')}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-[#00577C]" />
          </div>
        ) : aldeias.length === 0 ? (
          <div className="text-center py-32 text-slate-400 text-lg">Nenhuma aldeia cadastrada ainda.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aldeias.map((aldeia, idx) => (
              <AldeiaCard key={aldeia.id} aldeia={aldeia} index={idx} />
            ))}
          </div>
        )}
      </section>

      {/* ── AVISO CULTURAL ── */}
      <section className="bg-[#009640] text-white py-10 px-5">
        <div className="mx-auto max-w-5xl flex items-center gap-6">
          <div className="text-4xl flex-shrink-0">🌿</div>
          <p className="text-sm font-medium leading-relaxed opacity-90">
            <strong>Visitação responsável:</strong> Toda visita a territórios indígenas deve ser previamente
            autorizada pelas lideranças da aldeia e/ou pela FUNAI. A Secretaria de Turismo de São Geraldo do
            Araguaia auxilia no contato e orientação. Respeite os costumes e a privacidade de cada comunidade.
          </p>
        </div>
      </section>

    </main>
  );
}

// ── CARD INDIVIDUAL ──
function AldeiaCard({ aldeia, index }: { aldeia: Aldeia; index: number }) {
  const { playfair } = useFonts();

  return (
    <Link
      href={`/aldeias/${aldeia.id}`}
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-100"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Imagem */}
      <div className="relative h-60 overflow-hidden flex-shrink-0">
        <Image
          src={aldeia.imagem_capa}
          alt={aldeia.nome}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        {/* Gradiente sobre a imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#001f2e]/80 via-transparent to-transparent" />

        {/* Badge do povo */}
        <div className="absolute top-4 left-4 bg-[#F9C400] text-[#00577C] px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest shadow">
          Povo {aldeia.povo}
        </div>

        {/* Número decorativo */}
        <div className="absolute top-4 right-4 text-white/20 text-5xl font-black leading-none select-none">
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Nome na imagem */}
        <div className="absolute bottom-4 left-5 right-5">
          <h2 className={`text-2xl font-black text-white leading-tight drop-shadow-lg`}>
            {aldeia.nome}
          </h2>
        </div>
      </div>

      {/* Corpo do card */}
      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-auto">
          <MapPin size={14} className="text-[#009640] flex-shrink-0" />
          <span>{aldeia.localizacao}</span>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-[#00577C] text-sm font-bold">Conhecer a aldeia</span>
          <div className="w-10 h-10 rounded-full bg-[#00577C]/8 group-hover:bg-[#00577C] flex items-center justify-center transition-colors duration-300">
            <ArrowRight size={16} className="text-[#00577C] group-hover:text-white transition-colors duration-300" />
          </div>
        </div>
      </div>

      {/* Barra decorativa no hover */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F9C400] via-[#009640] to-[#00577C] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </Link>
  );
}

// Hook auxiliar para reutilizar fontes dentro do mesmo arquivo
function useFonts() {
  return {
    playfair: Playfair_Display({ subsets: ['latin'], weight: ['700', '900'] }),
  };
}