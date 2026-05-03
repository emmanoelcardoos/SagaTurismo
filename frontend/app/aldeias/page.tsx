'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Loader2, Menu, MapPin, ArrowRight } from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type Aldeia = {
  id: string;
  nome: string;
  povo: string;
  imagem_capa: string;
  localizacao: string;
};

export default function AldeiasPage() {
  const [aldeias, setAldeias] = useState<Aldeia[]>([]);
  const [loading, setLoading] = useState(true);

  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    async function fetchAldeias() {
      const { data } = await supabase.from('aldeias').select('id, nome, povo, imagem_capa, localizacao').order('nome');
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
    <main className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 pb-24`}>
      {/* HEADER INSTITUCIONAL */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-4">
            <div className="relative h-16 w-44 sm:w-56">
              <img src="/logop.png" alt="Prefeitura de São Geraldo do Araguaia" className="object-contain object-left h-full w-full" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 sm:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
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

      {/* HERO SECTION COM IMAGEM DE FUNDO */}
      <section className="relative pt-40 pb-24 px-5 text-center text-white overflow-hidden">
        
        {/* AQUI ENTRA A IMAGEM DE FUNDO */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.pexels.com/photos/12434691/pexels-photo-12434691.jpeg?_gl=1*1o9nxbn*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc4NDMxOTMkbzM0JGcxJHQxNzc3ODQ0NTY5JGoyNyRsMCRoMA.." 
            alt="Aldeias Indígenas" 
            fill 
            className="object-cover" 
            priority
          />
        </div>

        {/* OVERLAY ESCURO PARA O TEXTO SE LER BEM */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#00577C]/90 to-slate-900/80" />

        {/* BRILHO VERDE SUBTIL NO CANTO */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#009640]/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <h1 className={`${jakarta.className} text-5xl md:text-7xl font-black tracking-tight mb-6`}>Povos Originários</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto font-medium">
            Conheça as aldeias indígenas de São Geraldo do Araguaia, guardiões da floresta e da nossa verdadeira raiz ancestral.
          </p>
        </div>
      </section>

      {/* LISTA DE ALDEIAS */}
      <div className="mx-auto max-w-7xl px-5 -mt-10 relative z-20">
        {loading ? (
          <div className="flex justify-center py-20 bg-white rounded-3xl shadow-xl"><Loader2 className="w-10 h-10 animate-spin text-[#00577C]" /></div>
        ) : aldeias.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-xl">Nenhuma aldeia cadastrada.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aldeias.map(aldeia => (
              <div key={aldeia.id} className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-slate-100 group transition-transform hover:-translate-y-2">
                <div className="relative h-64 w-full">
                  <Image src={aldeia.imagem_capa} alt={aldeia.nome} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-md">
                    Povo {aldeia.povo}
                  </div>
                </div>
                <div className="p-8">
                  <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-4`}>{aldeia.nome}</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-8">
                    <MapPin size={16} className="text-[#009640]" /> {aldeia.localizacao}
                  </div>
                  <Link href={`/aldeias/${aldeia.id}`} className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-[#00577C] text-[#00577C] hover:text-white px-6 py-4 rounded-xl font-bold transition-colors">
                    Conhecer História <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}