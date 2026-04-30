'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, MapPin, Star, MessageCircle, 
  CheckCircle2, Info, Loader2, Menu 
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// Tipagem baseada na tabela
type Hotel = {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  estrelas: number;
  imagem_url: string;
  whatsapp: string;
  endereco?: string;
  preco_medio?: string;
  comodidades?: string[];
  galeria?: string[];
};

export default function HotelDetalhePage({ params }: { params: { id: string } }) {
  // LÓGICA DO HEADER (Corrige o erro do showHeader)
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // FETCH DO HOTEL NO SUPABASE
  useEffect(() => {
    async function fetchHotel() {
      try {
        const { data, error } = await supabase
          .from('hoteis')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw new Error("Erro ao buscar a hospedagem na base de dados.");
        if (data) setHotel(data);
        else setErro("Hospedagem não encontrada.");
      } catch (err: any) {
        setErro(err.message || "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) fetchHotel();
  }, [params.id]);

  // CONTROLO DO SCROLL PARA O HEADER
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold uppercase tracking-widest">A carregar detalhes...</p>
      </div>
    );
  }

  if (erro || !hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-6 text-center">
        <h1 className="text-3xl font-black mb-4">Informação não disponível</h1>
        <p className="text-slate-500 mb-8 max-w-md">{erro || "Não foi possível carregar os detalhes do hotel."}</p>
        <Link href="/#hoteis" className="bg-[#00577C] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm shadow-lg">
          Voltar aos Hotéis
        </Link>
      </div>
    );
  }

  // Formatar número do WhatsApp (remover tudo o que não for número)
  const numeroLimpo = hotel.whatsapp ? hotel.whatsapp.replace(/\D/g, '') : '';
  const mensagemWhatsApp = `Olá! Vi o ${hotel.nome} no portal SagaTurismo e gostaria de saber mais informações sobre reservas.`;
  const linkWhatsApp = `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagemWhatsApp)}`;

  return (
    <main className={`${inter.className} min-h-screen bg-white text-slate-900 pb-24`}>
      
      {/* HEADER EXATO QUE VOCÊ PEDIU */}
      <header
        className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56">
              <Image
                src="/logop.png"
                alt="Prefeitura de São Geraldo do Araguaia"
                fill
                priority
                className="object-contain object-left"
              />
            </div>

            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>
                SagaTurismo
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Secretaria de Turismo de São Geraldo do Araguaia
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              Rota Turística
            </Link>

            <a href="#eventos" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              Eventos
            </a>

            <a href="#historia" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              História
            </a>

            <a
              href="https://saogeraldodoaraguaia.pa.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-slate-600 hover:text-[#00577C]"
            >
              Governo
            </a>

            <Link
              href="/cadastro"
              className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]"
            >
              Cartão Residente
            </Link>
          </nav>

          <button className="rounded-xl border border-slate-200 p-2 md:hidden">
            <Menu className="h-5 w-5 text-[#00577C]" />
          </button>
        </div>
      </header>

      {/* HERO IMAGE HORIZONTAL COM MARGEM PARA O HEADER */}
      <div className="w-full h-[40vh] md:h-[60vh] relative bg-slate-100 mt-[70px] md:mt-[90px]">
        <Link href="/#hoteis" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-bold text-white bg-black/40 hover:bg-black/60 px-4 py-2 rounded-full backdrop-blur-md transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>
        {hotel.imagem_url ? (
          <Image 
            src={hotel.imagem_url} 
            alt={hotel.nome} 
            fill 
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-slate-400">
            <span className="font-bold">Imagem não disponível</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="mx-auto max-w-7xl px-5 -mt-16 relative z-10 grid lg:grid-cols-[1fr_380px] gap-12 items-start">
        
        {/* COLUNA ESQUERDA: INFORMAÇÕES */}
        <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100">
          
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest shadow-sm">
              {hotel.tipo}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: hotel.estrelas }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-[#F9C400] text-[#F9C400]" />
              ))}
            </div>
          </div>

          <h1 className={`${jakarta.className} text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4`}>
            {hotel.nome}
          </h1>

          <div className="flex items-center gap-2 text-slate-500 font-medium mb-10">
            <MapPin size={18} className="text-[#009640]" />
            <span>{hotel.endereco || 'São Geraldo do Araguaia, Pará'}</span>
          </div>

          {/* Sobre o Hotel */}
          <div className="mb-12">
            <h3 className={`${jakarta.className} text-2xl font-black text-[#00577C] mb-6`}>Sobre a Hospedagem</h3>
            <div className="text-lg text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
              {hotel.descricao}
            </div>
          </div>

          {/* Comodidades */}
          {hotel.comodidades && hotel.comodidades.length > 0 && (
            <div className="mb-12">
              <h3 className={`${jakarta.className} text-2xl font-black text-[#00577C] mb-6`}>Comodidades Principais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hotel.comodidades.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 size={20} className="text-[#009640]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>

        {/* COLUNA DIREITA: CAIXA DE RESERVAS (STICKY) */}
        <aside className="lg:sticky lg:top-32 space-y-6">
          <div className="bg-[#00577C] text-white p-8 rounded-[2.5rem] shadow-2xl">
            <p className="text-xs font-black uppercase tracking-widest text-[#F9C400] mb-2">Tarifa Média</p>
            <p className={`${jakarta.className} text-3xl font-black mb-8`}>
              {hotel.preco_medio || 'Sob Consulta'}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-blue-100 font-medium">
                <Info size={18} className="text-[#F9C400] shrink-0" />
                Os valores podem sofrer alterações conforme a temporada.
              </div>
            </div>

            {numeroLimpo ? (
              <a 
                href={linkWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className={`${jakarta.className} flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1EBE57] text-white py-5 rounded-2xl font-black text-lg transition-colors shadow-lg`}
              >
                <MessageCircle size={24} />
                Reservar no WhatsApp
              </a>
            ) : (
              <button disabled className={`${jakarta.className} flex items-center justify-center gap-3 w-full bg-slate-600 text-slate-400 py-5 rounded-2xl font-black text-lg cursor-not-allowed`}>
                Contacto Indisponível
              </button>
            )}

            <p className="text-center text-xs font-medium text-blue-200 mt-4 opacity-70">
              Reserva direta com o estabelecimento. O SagaTurismo não cobra taxas.
            </p>
          </div>
        </aside>
      </div>

      {/* SECÇÃO DA GALERIA DE FOTOS */}
      {hotel.galeria && hotel.galeria.length > 0 && (
        <div className="mx-auto max-w-7xl px-5 mt-16 pt-16 border-t border-slate-200">
           <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-8`}>Galeria de Fotos</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {hotel.galeria.map((foto, idx) => (
                <div key={idx} className="relative h-64 rounded-3xl overflow-hidden shadow-md group bg-slate-100">
                  <Image 
                    src={foto} 
                    alt={`Galeria ${hotel.nome} ${idx + 1}`} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                </div>
              ))}
           </div>
        </div>
      )}

      {/* FOOTER INSTITUCIONAL */}
      <footer className="border-t border-slate-200 bg-white mt-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative h-14 w-40">
              <Image src="/logop.png" alt="Prefeitura" fill className="object-contain object-left" />
            </div>
            <div className="border-l border-slate-200 pl-4 hidden md:block">
              <p className={`${jakarta.className} text-2xl font-bold text-[#00577C]`}>SagaTurismo</p>
              <p className="text-sm text-slate-500 uppercase font-bold tracking-widest text-[10px]">Portal Oficial de Turismo</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} · Prefeitura Municipal de São Geraldo do Araguaia · Pará
          </p>
        </div>
      </footer>
    </main>
  );
}