'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Loader2, X, ZoomIn, Camera, ChevronLeft, ChevronRight, MapPin, ArrowRight } from 'lucide-react';
import { Plus_Jakarta_Sans, Playfair_Display, Lora } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '700', '900'], style: ['normal', 'italic'] });
const lora = Lora({ subsets: ['latin'], weight: ['400', '500'] });

type Foto = {
  id: string;
  titulo: string;
  imagem_url: string;
  ano: string;
  categoria: string;
};

// ── HERO CARROSSEL ──
function HeroCarrossel({ fotos }: { fotos: Foto[] }) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const heroFotos = fotos.slice(0, 6);

  const goTo = (idx: number) => {
    if (transitioning || idx === current) return;
    setTransitioning(true);
    setCurrent(idx);
    setTimeout(() => setTransitioning(false), 900);
  };

  const next = () => goTo((current + 1) % heroFotos.length);
  const prev = () => goTo((current - 1 + heroFotos.length) % heroFotos.length);

  useEffect(() => {
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [current, heroFotos.length]);

  if (heroFotos.length === 0) return null;

  return (
    <section className="relative w-full h-screen min-h-[600px] max-h-[900px] overflow-hidden bg-slate-900">
      {heroFotos.map((foto, idx) => (
        <div
          key={foto.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: idx === current ? 1 : 0, zIndex: idx === current ? 2 : 1 }}
        >
          <Image src={foto.imagem_url} alt={foto.titulo} fill className="object-cover object-center" priority={idx === 0} />
        </div>
      ))}

      <div className="absolute inset-0 z-10 bg-gradient-to-b from-slate-900/55 via-slate-900/20 to-slate-900/90" />

      <div className="absolute inset-0 z-20 flex flex-col justify-end pb-20 px-6 md:px-16 max-w-7xl mx-auto left-0 right-0">
        <div className="flex items-center gap-3 mb-5">
          <span className="h-px w-10 bg-[#F9C400]" />
          <span className="text-[#F9C400] text-xs font-bold uppercase tracking-[0.3em]">
            {heroFotos[current]?.categoria || 'São Geraldo do Araguaia'}
          </span>
        </div>

        <h1 className={`${playfair.className} text-5xl md:text-7xl font-black text-white leading-none mb-4`}>
          Nossas <em className="text-[#F9C400] not-italic">Memórias</em>
        </h1>
        <p className={`${lora.className} text-white/80 text-lg max-w-xl leading-relaxed mb-8`}>
          Descubra as paisagens, a cultura e a alma de São Geraldo do Araguaia — e planeie a sua visita.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <a href="#galeria"
            className="flex items-center gap-2 bg-[#F9C400] text-[#00577C] font-bold text-sm px-6 py-3.5 rounded-full hover:bg-[#ffd633] transition-colors shadow">
            <Camera size={16} /> Ver toda a galeria
          </a>
          <Link href="/roteiro"
            className="flex items-center gap-2 text-white font-semibold text-sm px-6 py-3.5 rounded-full border border-white/30 hover:border-white/70 transition-colors">
            Planear visita <ArrowRight size={16} />
          </Link>
        </div>

        <div className="flex items-center gap-3 mt-10">
          {heroFotos.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${i === current ? 'w-8 h-2 bg-[#F9C400]' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}`} />
          ))}
          <div className="ml-auto flex gap-2">
            <button onClick={prev} className="w-10 h-10 rounded-full border border-white/30 hover:border-white text-white flex items-center justify-center transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} className="w-10 h-10 rounded-full bg-[#00577C] hover:bg-[#004a6b] text-white flex items-center justify-center transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CARD DE FOTO ──
function FotoCard({ foto, onOpen, tall = false }: { foto: Foto; onOpen: () => void; tall?: boolean }) {
  return (
    <div
      onClick={onOpen}
      className={`relative overflow-hidden rounded-2xl bg-slate-200 cursor-pointer group ${tall ? 'h-full min-h-[240px]' : 'h-full'}`}
    >
      <Image
        src={foto.imagem_url}
        alt={foto.titulo || foto.categoria}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors duration-300 flex items-center justify-center">
        <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 w-10 h-10" />
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
      >
        <p className="text-white font-bold text-sm line-clamp-1">{foto.titulo}</p>
        <p className="text-[#F9C400] text-xs font-bold uppercase tracking-widest mt-1">{foto.ano}</p>
      </div>
    </div>
  );
}

// ── ÁLBUM POR CATEGORIA ──
function AlbumCategoria({ categoria, fotos, onOpen }: {
  categoria: string;
  fotos: Foto[];
  onOpen: (lista: Foto[], idx: number) => void;
}) {
  const [primeira, ...resto] = fotos;

  return (
    <div className="mb-24">
      <div className="flex items-center gap-5 mb-8">
        <div className="w-1 h-10 rounded-full bg-[#00577C]" />
        <div>
          <p className="text-[#009640] text-[10px] font-bold uppercase tracking-[0.3em] mb-0.5">Álbum</p>
          <h2 className={`${playfair.className} text-3xl md:text-4xl font-black text-[#00577C]`}>{categoria}</h2>
        </div>
        <div className="flex-1 h-px bg-slate-200 hidden md:block" />
        <span className="hidden md:block text-slate-100 text-5xl font-black select-none">
          {String(fotos.length).padStart(2, '0')}
        </span>
      </div>

      {fotos.length === 1 ? (
        <div className="h-80">
          <FotoCard foto={fotos[0]} onOpen={() => onOpen(fotos, 0)} tall />
        </div>
      ) : fotos.length === 2 ? (
        <div className="grid grid-cols-2 gap-4 h-72">
          {fotos.map((f, i) => <FotoCard key={f.id} foto={f} onOpen={() => onOpen(fotos, i)} />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[240px]">
          <div className="row-span-2 col-span-1">
            <FotoCard foto={primeira} onOpen={() => onOpen(fotos, 0)} tall />
          </div>
          {resto.map((f, i) => (
            <FotoCard key={f.id} foto={f} onOpen={() => onOpen(fotos, i + 1)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── LIGHTBOX ──
function Lightbox({ lista, indexInicial, onClose }: {
  lista: Foto[];
  indexInicial: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(indexInicial);
  const current = lista[idx];

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i - 1 + lista.length) % lista.length); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i + 1) % lista.length); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + lista.length) % lista.length);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % lista.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lista.length]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/97 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-5 right-5 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
        <X size={20} />
      </button>
      {lista.length > 1 && (
        <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
          <ChevronLeft size={26} />
        </button>
      )}
      <div className="relative w-full max-w-5xl mx-6 aspect-video rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <Image src={current.imagem_url} alt={current.titulo} fill className="object-contain" />
      </div>
      {lista.length > 1 && (
        <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
          <ChevronRight size={26} />
        </button>
      )}
      <div className="absolute bottom-8 left-0 right-0 text-center px-5">
        <p className={`${playfair.className} text-xl font-bold text-white`}>{current.titulo}</p>
        <p className="text-[#F9C400] text-xs font-bold uppercase tracking-widest mt-1">
          {current.categoria} · {current.ano}
        </p>
        {lista.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {lista.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                className={`transition-all duration-300 rounded-full ${i === idx ? 'w-6 h-2 bg-[#F9C400]' : 'w-2 h-2 bg-white/30'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ──
export default function GaleriaPage() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ lista: Foto[]; idx: number } | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFotos() {
      try {
        const { data, error } = await supabase
          .from('galeria')
          .select('*')
          .order('ano', { ascending: false });
        if (error) throw new Error('Erro ao buscar a galeria.');
        if (data) setFotos(data);
      } catch (err: any) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
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

  const fotosAgrupadas = fotos.reduce((acc, foto) => {
    const cat = foto.categoria || 'Outros Registos';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(foto);
    return acc;
  }, {} as Record<string, Foto[]>);

  const categorias = Object.keys(fotosAgrupadas);
  const fotosFiltradas = categoriaAtiva
    ? { [categoriaAtiva]: fotosAgrupadas[categoriaAtiva] }
    : fotosAgrupadas;

  return (
    <main className={`${jakarta.className} min-h-screen bg-[#FAFAF7] text-slate-900`}>

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
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C] transition-colors">Rota Turística</Link>
            <Link href="/aldeias" className="text-sm font-semibold text-slate-600 hover:text-[#00577C] transition-colors">Aldeias</Link>
            <a href="https://saogeraldodoaraguaia.pa.gov.br" target="_blank" rel="noopener noreferrer"
              className="text-sm font-semibold text-slate-600 hover:text-[#00577C] transition-colors">Governo</a>
            <Link href="/cadastro"
              className="rounded-full bg-[#00577C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#004a6b] transition-colors">
              Cartão Residente
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="mt-[70px]">
        {!loading && fotos.length > 0 && <HeroCarrossel fotos={fotos} />}
        {loading && (
          <div className="w-full bg-slate-900 flex items-center justify-center" style={{ height: 'calc(100vh - 70px)' }}>
            <Loader2 className="w-10 h-10 animate-spin text-white/20" />
          </div>
        )}
      </div>

      {/* ── BARRA DE ESTATÍSTICAS ── */}
      {!loading && fotos.length > 0 && (
        <section className="bg-[#00577C] text-white py-6 px-5">
          <div className="mx-auto max-w-7xl flex flex-wrap justify-center md:justify-start gap-10 md:gap-20">
            {[
              { valor: fotos.length, label: 'Fotografias' },
              { valor: categorias.length, label: 'Álbuns' },
              { valor: [...new Set(fotos.map(f => f.ano))].length, label: 'Anos registados' },
            ].map(({ valor, label }) => (
              <div key={label} className="text-center md:text-left">
                <p className={`${playfair.className} text-4xl font-black text-[#F9C400]`}>
                  {String(valor).padStart(2, '0')}
                </p>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── GALERIA ── */}
      <section id="galeria" className="mx-auto max-w-7xl px-5 py-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#00577C]">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest opacity-40">A carregar…</p>
          </div>
        ) : erro ? (
          <div className="text-center py-32">
            <p className="text-xl font-bold text-slate-300 mb-2">Algo correu mal.</p>
            <p className="text-slate-400 text-sm">{erro}</p>
          </div>
        ) : fotos.length === 0 ? (
          <div className="text-center py-32">
            <Camera className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-xl font-bold text-slate-300">Galeria vazia</p>
          </div>
        ) : (
          <>
            {/* Filtros por categoria */}
            {categorias.length > 1 && (
              <div className="flex flex-wrap gap-3 mb-16">
                <button
                  onClick={() => setCategoriaAtiva(null)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${!categoriaAtiva
                    ? 'bg-[#00577C] text-white shadow'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-[#00577C] hover:text-[#00577C]'}`}
                >
                  Todos
                </button>
                {categorias.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaAtiva(cat === categoriaAtiva ? null : cat)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${categoriaAtiva === cat
                      ? 'bg-[#009640] text-white shadow'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-[#009640] hover:text-[#009640]'}`}
                  >
                    {cat}
                    <span className="ml-2 text-xs opacity-50">({fotosAgrupadas[cat].length})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Álbuns */}
            {Object.entries(fotosFiltradas).map(([categoria, fotosDaCategoria]) => (
              <AlbumCategoria
                key={categoria}
                categoria={categoria}
                fotos={fotosDaCategoria}
                onOpen={(lista, idx) => setLightbox({ lista, idx })}
              />
            ))}
          </>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#00577C] text-white py-20 px-6">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <p className="text-[#F9C400] text-xs font-bold uppercase tracking-[0.3em] mb-3">Venha você também</p>
            <h2 className={`${playfair.className} text-4xl md:text-5xl font-black leading-tight mb-5`}>
              As fotos não fazem<br />
              <em className="text-[#F9C400] not-italic">jus à realidade.</em>
            </h2>
            <p className={`${lora.className} text-white/75 text-base leading-relaxed max-w-md`}>
              São Geraldo do Araguaia tem rios cristalinos, culturas vivas, gastronomia autêntica e um povo acolhedor. Planeie já a sua visita.
            </p>
          </div>
          <div className="flex flex-col gap-4 flex-shrink-0 w-full md:w-auto">
            <Link href="/roteiro"
              className="flex items-center justify-center gap-2 bg-[#F9C400] text-[#00577C] font-bold px-8 py-4 rounded-full hover:bg-[#ffd633] transition-colors shadow text-sm">
              Ver roteiro turístico <ArrowRight size={16} />
            </Link>
            <Link href="/cadastro"
              className="flex items-center justify-center gap-2 border-2 border-white/25 text-white font-bold px-8 py-4 rounded-full hover:border-white/60 transition-colors text-sm">
              Cartão do Residente
            </Link>
            <div className="flex items-center gap-2 text-white/40 text-xs font-medium justify-center">
              <MapPin size={12} className="text-[#4ade80]" />
              São Geraldo do Araguaia, Pará, Brasil
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-white py-16 px-6">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-5">
            <img src="/logop.png" alt="Prefeitura SGA" className="h-16 object-contain brightness-0 invert opacity-70" />
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest leading-relaxed">
              São Geraldo do Araguaia<br />"Cidade Amada, seguindo em frente"
            </p>
          </div>
          <div className="space-y-4">
            <h5 className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10 pb-3">Gestão Executiva</h5>
            <ul className="text-sm text-white/40 space-y-3 leading-relaxed">
              <li>Prefeito:<br /><span className="text-white/70 font-semibold">Jefferson Douglas de Jesus Oliveira</span></li>
              <li>Vice-Prefeito:<br /><span className="text-white/70 font-semibold">Marcos Antônio Candido de Lucena</span></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10 pb-3">Turismo (SEMTUR)</h5>
            <ul className="text-sm text-white/40 space-y-2 leading-relaxed">
              <li>Secretária:<br /><span className="text-white/70 font-semibold">Micheli Stephany de Souza</span></li>
              <li>Tel: <span className="text-[#F9C400] font-semibold">(94) 98145-2067</span></li>
              <li>Email: <span className="text-white/60">setursaga@gmail.com</span></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10 pb-3">Equipe Técnica</h5>
            <ul className="text-sm text-white/40 space-y-2">
              <li>Adriana da Luz Lima</li>
              <li>Carmelita Luz da Silva</li>
              <li>Diego Silva Costa</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.4em]">
            © 2026 Secretaria Municipal de Turismo · São Geraldo do Araguaia (PA)
          </p>
        </div>
      </footer>

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <Lightbox
          lista={lightbox.lista}
          indexInicial={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}
    </main>
  );
}