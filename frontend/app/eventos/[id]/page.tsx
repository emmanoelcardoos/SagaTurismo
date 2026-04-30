'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, MapPin, Menu, ChevronRight, 
  Ticket, CalendarDays, Loader2
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

// Importa o cliente Supabase centralizado
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800',],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// Tipo do evento baseado na tabela da Supabase e no roteiro oficial [cite: 8, 72]
type Evento = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  imagem_url: string;
  categoria: string;
  horario?: string;
  duracao?: string;
  preco?: string;
  classificacao?: string;
  link_bilheteira?: string;
};

export default function EventoDetalhePage({ params }: { params: { id: string } }) {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ==========================================
  // FETCH REAL NA SUPABASE (VERSÃO ROBUSTA)
  // ==========================================
  useEffect(() => {
    async function fetchEventoReal() {
      try {
        // Usa o cliente Supabase diretamente, sem necessidade de fetch nativo
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', params.id)
          .single(); // Esperamos apenas um resultado

        if (error) {
          throw new Error("Erro ao buscar o evento na base de dados.");
        }

        if (data) {
          setEvento(data);
        } else {
          setErro("Evento não encontrado.");
        }
      } catch (err: any) {
        setErro(err.message || "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchEventoReal();
    }
  }, [params.id]);

  // Lógica de visibilidade do Header
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
        <p className="font-bold uppercase tracking-widest">A carregar evento...</p>
      </div>
    );
  }

  if (erro || !evento) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-6 text-center">
        <h1 className="text-3xl font-black mb-4">Informação não disponível</h1>
        <p className="text-slate-500 mb-8 max-w-md">{erro || "Não foi possível carregar os detalhes do evento solicitado."}</p>
        <Link href="/" className="bg-[#00577C] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm shadow-lg">
          Voltar à Homepage
        </Link>
      </div>
    );
  }

  // Formatação de Datas
  const dataObj = new Date(evento.data);
  const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  
  const diaSemana = diasSemana[dataObj.getDay()];
  const diaMes = String(dataObj.getDate()).padStart(2, '0');
  const mesExtenso = meses[dataObj.getMonth()];
  const ano = dataObj.getFullYear();

  return (
    <main className={`${inter.className} min-h-screen bg-white text-slate-900`}>
      
      {/* HEADER INSTITUCIONAL */}
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
            <a href="#hoteis" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              Hotéis
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
              Cartão do Residente
            </Link>
          </nav>

          <button className="rounded-xl border border-slate-200 p-2 md:hidden">
            <Menu className="h-5 w-5 text-[#00577C]" />
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL (LAYOUT INSPIRADO NO TMC) */}
      <div className="mx-auto max-w-7xl px-5 pt-32 pb-24 flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
        
        {/* SIDEBAR DE INFORMAÇÕES TÉCNICAS [cite: 72] */}
        <aside className="w-full lg:w-[300px] shrink-0 space-y-12">
          <div className="bg-[#00577C] text-white p-8 rounded-[2rem] shadow-xl">
             <h2 className={`${jakarta.className} text-2xl font-black mb-8 uppercase tracking-tighter`}>Informações</h2>
             <nav className="space-y-5 flex flex-col font-medium text-sm">
               <Link href="#detalhes" className="hover:text-[#F9C400] transition-colors flex items-center justify-between group border-b border-white/10 pb-2">
                 Sobre o Evento <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
               </Link>
               <Link href="#local" className="hover:text-[#F9C400] transition-colors flex items-center justify-between group border-b border-white/10 pb-2">
                 Como Chegar <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
               </Link>
             </nav>
          </div>

          <div className="space-y-8 px-4 border-l-2 border-slate-100">
             <div>
               <p className={`${jakarta.className} text-xs font-black text-slate-400 uppercase tracking-widest mb-1`}>Duração</p>
               <p className="text-lg font-bold text-slate-800">{evento.duracao || 'Consulte a programação'}</p>
             </div>
             <div>
               <p className={`${jakarta.className} text-xs font-black text-slate-400 uppercase tracking-widest mb-1`}>Preço</p>
               <p className="text-lg font-bold text-slate-800">{evento.preco || 'Acesso Livre / Gratuito'}</p>
             </div>
             <div>
               <p className={`${jakarta.className} text-xs font-black text-slate-400 uppercase tracking-widest mb-1`}>Horário</p>
               <p className="text-lg font-bold text-slate-800">{evento.horario || 'Consulte o cronograma'}</p>
             </div>
          </div>
        </aside>

        {/* ÁREA DE CONTEÚDO DINÂMICO */}
        <section className="flex-1 w-full space-y-12">
          
          <Link href="/#eventos" className="inline-flex items-center gap-2 text-sm font-bold text-[#00577C] hover:text-[#F9C400] transition-colors mb-4 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar à Agenda Cultural
          </Link>

          <div className="flex flex-col xl:flex-row gap-10 items-start">
             {/* Imagem do Evento */}
             <div className="relative w-full xl:w-[65%] h-[450px] overflow-hidden rounded-[2.5rem] bg-slate-100 shadow-2xl">
               {evento.imagem_url ? (
                 <Image src={evento.imagem_url} alt={evento.titulo} fill className="object-cover" priority />
               ) : (
                 <div className="flex items-center justify-center w-full h-full text-slate-300">
                   <CalendarDays size={64} />
                 </div>
               )}
             </div>

             {/* Painel de Data e Título */}
             <div className="w-full xl:w-[35%] flex flex-col items-start pt-2">
                <div className="flex gap-4 items-start mb-6">
                  <div className={`${jakarta.className} bg-[#00577C] text-white px-4 py-3 text-center rounded-2xl shadow-lg leading-none min-w-[70px]`}>
                    <p className="text-[10px] font-bold uppercase mb-1">{diaSemana}</p>
                    <p className="text-lg font-black uppercase tracking-widest">{mesExtenso}</p>
                  </div>
                  <p className={`${jakarta.className} text-7xl font-black text-slate-900 tracking-tighter leading-none`}>
                    {diaMes}
                  </p>
                </div>
                
                <p className="text-sm font-bold text-slate-400 mb-6">{dataObj.getDate()} de {mesExtenso} de {ano}</p>

                {evento.categoria && (
                  <div className="bg-[#F9C400] text-[#00577C] px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm mb-4">
                    {evento.categoria}
                  </div>
                )}

                <h1 className={`${jakarta.className} text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1] mb-6`}>
                  {evento.titulo}
                </h1>

                <div className="mb-8">
                  <p className={`${jakarta.className} text-xs font-black text-slate-400 uppercase tracking-widest mb-1`}>Classificação</p>
                  <p className="text-sm font-bold text-slate-700">{evento.classificacao || 'Livre para todos os públicos'}</p>
                </div>

                {evento.link_bilheteira && (
                  <Link 
                    href={evento.link_bilheteira} 
                    target="_blank"
                    className={`${jakarta.className} w-full bg-[#00577C] text-white px-8 py-5 rounded-2xl text-center font-black text-sm uppercase tracking-widest transition-all hover:bg-slate-900 hover:scale-[1.02] shadow-xl flex items-center justify-center gap-3`}
                  >
                    <Ticket size={20} /> Participar / Bilhetes
                  </Link>
                )}
             </div>
          </div>

          {/* Sinopse / Detalhes [cite: 8] */}
          <div id="detalhes" className="pt-12 border-t border-slate-100">
            <h3 className={`${jakarta.className} text-3xl font-black text-[#00577C] mb-8 uppercase tracking-tighter`}>Sobre o Evento</h3>
            <div className="text-lg text-slate-600 font-medium leading-relaxed whitespace-pre-wrap max-w-4xl">
              {evento.descricao || "Não existem detalhes adicionais disponíveis para este evento."}
            </div>
          </div>

          {/* Localização [cite: 13, 72] */}
          <div id="local" className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center gap-8">
             <div className="w-20 h-20 shrink-0 bg-white rounded-3xl flex items-center justify-center shadow-md text-[#009640]">
               <MapPin size={40} />
             </div>
             <div className="text-center md:text-left">
               <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Localização e Realização</p>
               <p className={`${jakarta.className} text-2xl font-bold text-[#00577C]`}>{evento.local || 'São Geraldo do Araguaia'}</p>
               <p className="text-sm text-slate-500 mt-1">SEMTUR • Secretaria Municipal de Turismo [cite: 71, 72]</p>
             </div>
          </div>

        </section>
      </div>

      {/* FOOTER INSTITUCIONAL [cite: 68] */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative h-14 w-40">
              <Image src="/logop.png" alt="Prefeitura" fill className="object-contain object-left" />
            </div>
            <div className="border-l border-slate-200 pl-4 hidden md:block">
              <p className={`${jakarta.className} text-2xl font-bold text-[#00577C]`}>SagaTurismo</p>
              <p className="text-sm text-slate-500 uppercase font-bold tracking-widest text-[10px]">Portal Oficial de Turismo [cite: 71]</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} · Prefeitura Municipal de São Geraldo do Araguaia · Pará [cite: 68]
          </p>
        </div>
      </footer>
    </main>
  );
}