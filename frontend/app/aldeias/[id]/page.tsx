'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  ArrowLeft, MapPin, Users, Loader2,
  X, ChevronLeft, ChevronRight, ZoomIn,
  Menu,
} from 'lucide-react';
import { Plus_Jakarta_Sans, Playfair_Display, Lora } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '700', '900'], style: ['normal', 'italic'] });
const lora = Lora({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'] });

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

// Ornamento SVG estilo grafismo indígena
function GrafismoHorizontal({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 24" className={`w-full h-6 ${className}`} aria-hidden preserveAspectRatio="none">
      <pattern id="graf" x="0" y="0" width="40" height="24" patternUnits="userSpaceOnUse">
        <rect width="40" height="24" fill="transparent" />
        <polygon points="0,0 10,12 0,24" fill="#F9C400" opacity="0.8" />
        <polygon points="10,0 20,12 10,24 0,12" fill="#009640" opacity="0.8" />
        <polygon points="20,0 30,12 20,24 10,12" fill="#F9C400" opacity="0.8" />
        <polygon points="30,0 40,12 30,24 20,12" fill="#009640" opacity="0.8" />
        <polygon points="40,0 40,24 30,12" fill="#F9C400" opacity="0.8" />
      </pattern>
      <rect width="600" height="24" fill="url(#graf)" />
    </svg>
  );
}

// Ornamento lateral decorativo
function OrnamentoCirculo() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" aria-hidden>
      <circle cx="60" cy="60" r="55" stroke="#F9C400" strokeWidth="1.5" strokeDasharray="6 4" />
      <circle cx="60" cy="60" r="40" stroke="#009640" strokeWidth="1" strokeDasharray="4 6" />
      <circle cx="60" cy="60" r="24" stroke="#F9C400" strokeWidth="2" />
      <circle cx="60" cy="60" r="6" fill="#F9C400" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 60 + 26 * Math.cos(rad);
        const y1 = 60 + 26 * Math.sin(rad);
        const x2 = 60 + 38 * Math.cos(rad);
        const y2 = 60 + 38 * Math.sin(rad);
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F9C400" strokeWidth="1.5" />;
      })}
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x = 60 + 54 * Math.cos(rad);
        const y = 60 + 54 * Math.sin(rad);
        return <circle key={angle} cx={x} cy={y} r="3" fill="#009640" />;
      })}
    </svg>
  );
}

export default function AldeiaDetalhePage({ params }: { params: { id: string } }) {
  const [aldeia, setAldeia] = useState<Aldeia | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    async function fetchAldeia() {
      const { data, error } = await supabase
        .from('aldeias')
        .select('*')
        .eq('id', params.id)
        .single();
      if (error) setErro('Aldeia não encontrada.');
      else setAldeia(data);
      setLoading(false);
    }
    if (params.id) fetchAldeia();
  }, [params.id]);

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

  const fecharGaleria = () => setFotoExpandidaIndex(null);
  const proximaFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (aldeia?.galeria) setFotoExpandidaIndex(prev => (prev! + 1) % aldeia.galeria.length);
  };
  const fotoAnterior = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (aldeia?.galeria) setFotoExpandidaIndex(prev => (prev! - 1 + aldeia.galeria.length) % aldeia.galeria.length);
  };

  if (loading) return (
    <div className={`${jakarta.className} min-h-screen flex items-center justify-center bg-[#FAFAF7]`}>
      <div className="flex flex-col items-center gap-4 text-[#00577C]">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-sm font-semibold tracking-widest uppercase opacity-60">Carregando aldeia…</span>
      </div>
    </div>
  );

  if (erro || !aldeia) return (
    <div className={`${jakarta.className} min-h-screen flex flex-col items-center justify-center bg-[#FAFAF7] gap-4`}>
      <p className="text-2xl font-bold text-slate-400">{erro ?? 'Aldeia não encontrada'}</p>
      <Link href="/aldeias" className="text-[#00577C] font-bold underline underline-offset-4">← Voltar às aldeias</Link>
    </div>
  );

  // Paragraphs do texto de história
  const paragrafos = aldeia.historia?.split(/\n\n+/) ?? [];

  return (
    <div className={`${jakarta.className} min-h-screen bg-[#FAFAF7] text-slate-900`}>

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

      {/* ── HERO ── */}
      <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden mt-[70px]">
        <Image
          src={aldeia.imagem_capa}
          alt={aldeia.nome}
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradiente dramático */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#001020]/95 via-[#001020]/30 to-transparent" />

        {/* Grafismo decorativo sobre a imagem */}
        <div className="absolute bottom-28 left-0 right-0 opacity-40">
          <GrafismoHorizontal />
        </div>

        {/* Conteúdo do hero */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-20">
          <div className="mx-auto max-w-5xl">
            <span className="inline-block bg-[#009640] text-white px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-[0.25em] mb-5 shadow">
              Povo {aldeia.povo}
            </span>
            <h1 className={`${playfair.className} text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none`}>
              {aldeia.nome}
            </h1>
          </div>
        </div>
      </div>

      {/* ── INFO BAR FLUTUANTE ── */}
      <div className="bg-[#00577C] text-white">
        <div className="mx-auto max-w-5xl px-5 py-0">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/20 -mt-1">

            {/* Povo */}
            <div className="flex items-center gap-4 py-6 md:pr-10">
              <div className="w-12 h-12 rounded-full bg-[#F9C400]/15 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#F9C400]" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">Etnia</p>
                <p className="text-white font-bold text-lg">{aldeia.povo}</p>
              </div>
            </div>

            {/* Populacao */}
            <div className="flex items-center gap-4 py-6 md:px-10">
              <div className="w-12 h-12 rounded-full bg-[#F9C400]/15 flex items-center justify-center flex-shrink-0">
                <Users size={22} className="text-[#F9C400]" />
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">População</p>
                <p className="text-white font-bold text-lg">{aldeia.populacao || 'Não informada'}</p>
              </div>
            </div>

            {/* Localização */}
            <div className="flex items-center gap-4 py-6 md:pl-10">
              <div className="w-12 h-12 rounded-full bg-[#009640]/30 flex items-center justify-center flex-shrink-0">
                <MapPin size={22} className="text-[#4ade80]" />
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">Localização</p>
                <p className="text-white font-bold text-base">{aldeia.localizacao}</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Faixa decorativa */}
      <GrafismoHorizontal />

      {/* ── HISTÓRIA ── */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <div className="grid lg:grid-cols-[1fr_220px] gap-16 items-start">

          {/* Texto */}
          <div>
            {/* Cabeçalho da seção */}
            <div className="flex items-center gap-4 mb-10">
              <div className="h-12 w-1.5 bg-gradient-to-b from-[#F9C400] to-[#009640] rounded-full" />
              <div>
                <p className="text-[#009640] text-[10px] font-black uppercase tracking-[0.3em] mb-1">Memória e Identidade</p>
                <h2 className={`${playfair.className} text-3xl font-black text-[#00577C]`}>
                  A História da Aldeia
                </h2>
              </div>
            </div>

            {/* Parágrafos */}
            <article className={`${lora.className} space-y-6 text-slate-700 text-[17px] leading-[1.9]`}>
              {paragrafos.length > 0 ? (
                paragrafos.map((par, i) => (
                  <p key={i} className={i === 0 ? 'text-[19px] font-medium text-slate-800' : ''}>
                    {i === 0 && (
                      <span className={`${playfair.className} float-left text-6xl font-black text-[#00577C] mr-3 mt-1 leading-none`}>
                        {par[0]}
                      </span>
                    )}
                    {i === 0 ? par.slice(1) : par}
                  </p>
                ))
              ) : (
                <p className="text-slate-400 italic">Nenhuma história cadastrada ainda.</p>
              )}
            </article>
          </div>

          {/* Ornamento lateral */}
          <div className="hidden lg:block sticky top-32">
            <div className="w-full aspect-square opacity-60">
              <OrnamentoCirculo />
            </div>
            <div className="mt-8 bg-[#00577C]/5 border border-[#00577C]/10 rounded-2xl p-6">
              <p className="text-[#00577C] text-xs font-black uppercase tracking-[0.2em] mb-3">Visitar</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Para agendar uma visita a esta aldeia, entre em contato com a Secretaria de Turismo de São Geraldo do Araguaia.
              </p>
              <a href="tel:+5594XXXXXXXX"
                className="mt-4 block text-center bg-[#F9C400] text-[#00577C] font-black text-sm py-3 px-4 rounded-xl hover:bg-[#ffd633] transition-colors">
                Entrar em Contato
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── GALERIA ── */}
      {aldeia.galeria && aldeia.galeria.length > 0 && (
        <section className="border-t border-slate-200 bg-[#00577C] py-20 px-5">
          <div className="mx-auto max-w-7xl">

            {/* Cabeçalho */}
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[#F9C400] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Fotografia</p>
                <h3 className={`${playfair.className} text-4xl font-black text-white`}>
                  Registros da Aldeia
                </h3>
              </div>
              <span className="hidden md:block text-white/10 text-7xl font-black select-none">
                {String(aldeia.galeria.length).padStart(2, '0')}
              </span>
            </div>

            <GrafismoHorizontal className="mb-10 opacity-40" />

            {/* Grid de fotos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {aldeia.galeria.map((foto, idx) => (
                <button
                  key={idx}
                  onClick={() => setFotoExpandidaIndex(idx)}
                  className={`relative rounded-xl overflow-hidden group bg-slate-800 cursor-pointer
                    ${idx === 0 ? 'col-span-2 row-span-2 h-80 md:h-auto' : 'h-44'}
                  `}
                >
                  <Image
                    src={foto}
                    alt={`${aldeia.nome} foto ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-[#00577C]/0 group-hover:bg-[#00577C]/50 transition-colors duration-300 flex items-center justify-center">
                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-8 h-8" />
                  </div>
                  {/* Índice */}
                  <span className="absolute top-2 right-2 text-white/40 text-xs font-bold select-none">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER DA PÁGINA ── */}
      <div className="bg-[#001f2e] py-8 px-5 text-center">
        <Link href="/aldeias"
          className="inline-flex items-center gap-3 text-white/60 hover:text-[#F9C400] transition-colors font-semibold text-sm">
          <ArrowLeft size={16} />
          Ver todas as aldeias
        </Link>
      </div>

      {/* ── LIGHTBOX ── */}
      {fotoExpandidaIndex !== null && aldeia?.galeria && (
        <div
          className="fixed inset-0 z-[200] bg-black/97 backdrop-blur-md flex items-center justify-center p-4"
          onClick={fecharGaleria}
        >
          {/* Fechar */}
          <button
            onClick={fecharGaleria}
            className="absolute top-5 right-5 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
          >
            <X size={22} />
          </button>

          {/* Anterior */}
          <button
            onClick={fotoAnterior}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
          >
            <ChevronLeft size={28} />
          </button>

          {/* Imagem */}
          <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={aldeia.galeria[fotoExpandidaIndex]}
              alt="Foto ampliada"
              fill
              className="object-contain"
            />
          </div>

          {/* Próxima */}
          <button
            onClick={proximaFoto}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
          >
            <ChevronRight size={28} />
          </button>

          {/* Contador */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {aldeia.galeria.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setFotoExpandidaIndex(i); }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === fotoExpandidaIndex ? 'bg-[#F9C400] w-6' : 'bg-white/30'}`}
              />
            ))}
          </div>

          {/* FOOTER INSTITUCIONAL COMPLETO */}
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

      
        </div>
      )}

    </div>
  );
}