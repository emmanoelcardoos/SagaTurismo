'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Loader2, Menu, MapPin, Users, ArrowRight } from 'lucide-react';
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

  useEffect(() => {
    async function fetchAldeias() {
      const { data } = await supabase.from('aldeias').select('id, nome, povo, imagem_capa, localizacao').order('nome');
      if (data) setAldeias(data);
      setLoading(false);
    }
    fetchAldeias();
  }, []);

  return (
    <main className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 pb-24`}>
      {/* HEADER SIMPLIFICADO AQUI */}
      <header className="fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56">
              <Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Início</Link>
            <Link href="/historia" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">História</Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-[#00577C] pt-40 pb-24 px-5 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#009640]/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
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