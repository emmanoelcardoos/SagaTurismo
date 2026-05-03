'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Users, Loader2, Menu, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Plus_Jakarta_Sans, Inter, Merriweather } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], style: ['italic', 'normal'] });

type Aldeia = {
  id: string;
  nome: string;
  povo: string;
  localizacao: string;
  populacao: string;
  historia: string;
  imagem_capa: string;
  galeria: string[];
};

export default function AldeiaDetalhePage({ params }: { params: { id: string } }) {
  const [aldeia, setAldeia] = useState<Aldeia | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchAldeia() {
      const { data, error } = await supabase.from('aldeias').select('*').eq('id', params.id).single();
      if (error) setErro("Aldeia não encontrada.");
      else setAldeia(data);
      setLoading(false);
    }
    if (params.id) fetchAldeia();
  }, [params.id]);

  const fecharGaleria = () => setFotoExpandidaIndex(null);
  const proximaFoto = (e: React.MouseEvent) => { e.stopPropagation(); if (aldeia?.galeria) setFotoExpandidaIndex((prev) => (prev! + 1) % aldeia.galeria.length); };
  const fotoAnterior = (e: React.MouseEvent) => { e.stopPropagation(); if (aldeia?.galeria) setFotoExpandidaIndex((prev) => (prev! - 1 + aldeia.galeria.length) % aldeia.galeria.length); };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#00577C]" /></div>;
  if (erro || !aldeia) return <div className="min-h-screen flex items-center justify-center"><h2>{erro}</h2></div>;

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col`}>
      
      {/* HEADER INSTITUCIONAL */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-4">
            <div className="relative h-16 w-44 sm:w-56">
              <img src="/logop.png" alt="Prefeitura de São Geraldo do Araguaia" className="object-contain object-left h-full w-full" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 sm:block">
              <p className={`${playfair.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo de São Geraldo do Araguaia</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Roteiro</a>
            <a href="#hospedagem" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Onde Ficar</a>
            <a href="#gastronomia" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Onde Comer</a>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão do Residente</Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION DA ALDEIA */}
      <div className="w-full h-[50vh] md:h-[70vh] relative mt-[70px]">
        <Image src={aldeia.imagem_capa} alt={aldeia.nome} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 px-5">
          <div className="mx-auto max-w-5xl">
            <span className="bg-[#009640] text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md">
              Povo {aldeia.povo}
            </span>
            <h1 className={`${jakarta.className} mt-4 text-5xl md:text-7xl font-black text-white tracking-tight`}>
              {aldeia.nome}
            </h1>
          </div>
        </div>
      </div>

      {/* CONTEÚDO E HISTÓRIA */}
      <div className="mx-auto max-w-5xl px-5 py-16">
        
        {/* INFO BOX */}
        <div className="flex flex-col md:flex-row gap-8 bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 mb-16 -mt-24 relative z-10">
          <div className="flex-1 flex items-center gap-4">
            <div className="bg-[#F9C400]/10 p-4 rounded-2xl text-[#F9C400]"><Users size={28} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">População</p>
              <p className="text-xl font-black text-[#00577C]">{aldeia.populacao || 'Não especificada'}</p>
            </div>
          </div>
          <div className="w-px bg-slate-100 hidden md:block"></div>
          <div className="flex-1 flex items-center gap-4">
            <div className="bg-[#009640]/10 p-4 rounded-2xl text-[#009640]"><MapPin size={28} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Localização</p>
              <p className="text-lg font-bold text-slate-800">{aldeia.localizacao}</p>
            </div>
          </div>
        </div>

        {/* TEXTO DA HISTÓRIA */}
        <article className={`${merriweather.className} prose prose-lg md:prose-xl max-w-none text-slate-700 leading-relaxed`}>
          <p className="whitespace-pre-wrap">{aldeia.historia}</p>
        </article>

      </div>

      {/* GALERIA HORIZONTAL */}
      {aldeia.galeria && aldeia.galeria.length > 0 && (
        <div className="bg-white border-t border-slate-200 py-16 px-5 mt-auto">
          <div className="mx-auto max-w-7xl">
            <h3 className={`${jakarta.className} text-3xl font-black text-[#00577C] mb-8`}>Registros da Aldeia</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {aldeia.galeria.map((foto, idx) => (
                <div key={idx} onClick={() => setFotoExpandidaIndex(idx)} className="relative h-72 rounded-3xl overflow-hidden shadow-lg group bg-slate-200 cursor-pointer">
                  <Image src={foto} alt={`${aldeia.nome} foto ${idx + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-[#00577C]/0 group-hover:bg-[#00577C]/40 transition-colors duration-300 flex items-center justify-center">
                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-12 h-12 scale-50 group-hover:scale-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX */}
      {fotoExpandidaIndex !== null && aldeia?.galeria && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-5 animate-in fade-in duration-200" onClick={fecharGaleria}>
          <button onClick={fecharGaleria} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"><X size={24} /></button>
          <button onClick={fotoAnterior} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"><ChevronLeft size={32} /></button>
          <div className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl">
            <Image src={aldeia.galeria[fotoExpandidaIndex]} alt="Foto" fill className="object-contain" />
          </div>
          <button onClick={proximaFoto} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"><ChevronRight size={32} /></button>
        </div>
      )}
    </div>
  );
}