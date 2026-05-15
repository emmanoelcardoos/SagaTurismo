'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, MapPin, Menu, ChevronRight, 
  Ticket, CalendarDays, Loader2, X
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

// Importa o cliente Supabase centralizado
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// Tipo do evento baseado na tabela da Supabase e no roteiro oficial
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ==========================================
  // FETCH REAL NA SUPABASE
  // ==========================================
  useEffect(() => {
    async function fetchEventoReal() {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', params.id)
          .single(); 

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
        <p className="font-bold uppercase tracking-widest text-xs md:text-sm">A carregar evento...</p>
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
            <div className="relative h-10 w-28 md:h-12 md:w-36 lg:h-16 lg:w-56 shrink-0">
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
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <a href="/#eventos" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Eventos</a>
            <a href="/hoteis" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Alojamentos</a>
            <a href="/pacotes" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Pacotes</a>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão Residente</Link>
          </nav>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-xl border border-slate-200 p-2 md:hidden bg-slate-50 text-[#00577C]"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="absolute top-[100%] left-0 w-full bg-white border-b border-slate-200 p-5 flex flex-col gap-4 shadow-xl md:hidden animate-in slide-in-from-top-4">
            <Link href="/roteiro" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Rota Turística</Link>
            <Link href="/#eventos" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Eventos</Link>
            <Link href="/hoteis" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Alojamentos</Link>
            <Link href="/pacotes" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Pacotes</Link>
            <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#F9C400] text-[#00577C] font-black px-4 py-3.5 rounded-xl text-center mt-2 uppercase tracking-widest text-sm shadow-md">Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      {/* MAGIA AQUI: flex-col para mobile, lg:flex-row para desktop */}
      <div className="mx-auto max-w-7xl px-5 pt-28 md:pt-32 pb-16 md:pb-24 flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
        
        {/* SIDEBAR DE INFORMAÇÕES TÉCNICAS */}
        {/* MAGIA AQUI: order-2 em mobile empurra para o fundo, mas lg:order-1 no desktop puxa para a esquerda! */}
        <aside className="w-full lg:w-[300px] shrink-0 space-y-8 md:space-y-12 order-2 lg:order-1">
          <div className="bg-[#00577C] text-white p-6 md:p-8 rounded-[2rem] shadow-xl">
             <h2 className={`${jakarta.className} text-xl md:text-2xl font-black mb-6 md:mb-8 uppercase tracking-tighter`}>Informações</h2>
             <nav className="space-y-4 md:space-y-5 flex flex-col font-medium text-sm">
               <Link href="#detalhes" className="hover:text-[#F9C400] transition-colors flex items-center justify-between group border-b border-white/10 pb-2">
                 Sobre o Evento <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
               </Link>
               <Link href="#local" className="hover:text-[#F9C400] transition-colors flex items-center justify-between group border-b border-white/10 pb-2">
                 Como Chegar <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
               </Link>
             </nav>
          </div>

          <div className="space-y-6 md:space-y-8 px-4 border-l-2 border-slate-100 text-left">
             <div>
               <p className={`${jakarta.className} text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1`}>Duração</p>
               <p className="text-base md:text-lg font-bold text-slate-800">{evento.duracao || 'Consulte a programação'}</p>
             </div>
             <div>
               <p className={`${jakarta.className} text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1`}>Preço</p>
               <p className="text-base md:text-lg font-bold text-slate-800">{evento.preco || 'Acesso Livre / Gratuito'}</p>
             </div>
             <div>
               <p className={`${jakarta.className} text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1`}>Horário</p>
               <p className="text-base md:text-lg font-bold text-slate-800">{evento.horario || 'Consulte o cronograma'}</p>
             </div>
          </div>
        </aside>

        {/* ÁREA DE CONTEÚDO DINÂMICO */}
        {/* MAGIA AQUI: order-1 em mobile puxa para o topo, lg:order-2 no desktop vai para a direita! */}
        <section className="flex-1 w-full space-y-8 md:space-y-12 order-1 lg:order-2">
          
          <Link href="/#eventos" className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#00577C] hover:text-[#F9C400] transition-colors mb-2 md:mb-4 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar à Agenda
          </Link>

          <div className="flex flex-col xl:flex-row gap-6 md:gap-10 items-start">
             {/* Imagem do Evento */}
             <div className="relative w-full xl:w-[65%] h-[250px] sm:h-[350px] lg:h-[450px] overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-slate-100 shadow-xl md:shadow-2xl shrink-0">
               {evento.imagem_url ? (
                 <Image src={evento.imagem_url} alt={evento.titulo} fill className="object-cover" priority />
               ) : (
                 <div className="flex items-center justify-center w-full h-full text-slate-300">
                   <CalendarDays size={48} className="md:w-16 md:h-16" />
                 </div>
               )}
             </div>

             {/* Painel de Data e Título */}
             <div className="w-full xl:w-[35%] flex flex-col items-start pt-2">
                <div className="flex gap-3 md:gap-4 items-start mb-4 md:mb-6">
                  <div className={`${jakarta.className} bg-[#00577C] text-white px-3 md:px-4 py-2 md:py-3 text-center rounded-xl md:rounded-2xl shadow-lg leading-none min-w-[60px] md:min-w-[70px]`}>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase mb-1">{diaSemana}</p>
                    <p className="text-base md:text-lg font-black uppercase tracking-widest">{mesExtenso}</p>
                  </div>
                  <p className={`${jakarta.className} text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none`}>
                    {diaMes}
                  </p>
                </div>
                
                <p className="text-xs md:text-sm font-bold text-slate-400 mb-4 md:mb-6">{dataObj.getDate()} de {mesExtenso} de {ano}</p>

                {evento.categoria && (
                  <div className="bg-[#F9C400] text-[#00577C] px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest shadow-sm mb-3 md:mb-4">
                    {evento.categoria}
                  </div>
                )}

                <h1 className={`${jakarta.className} text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] md:leading-[1] mb-4 md:mb-6 text-left`}>
                  {evento.titulo}
                </h1>

                <div className="mb-6 md:mb-8 text-left">
                  <p className={`${jakarta.className} text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1`}>Classificação</p>
                  <p className="text-xs md:text-sm font-bold text-slate-700">{evento.classificacao || 'Livre para todos os públicos'}</p>
                </div>

                {evento.link_bilheteira && (
                  <Link 
                    href={evento.link_bilheteira} 
                    target="_blank"
                    className={`${jakarta.className} w-full bg-[#00577C] text-white px-6 md:px-8 py-4 md:py-5 rounded-xl md:rounded-2xl text-center font-black text-xs md:text-sm uppercase tracking-widest transition-all hover:bg-slate-900 hover:scale-[1.02] shadow-xl flex items-center justify-center gap-3`}
                  >
                    <Ticket size={20} className="w-4 h-4 md:w-5 md:h-5" /> Participar / Bilhetes
                  </Link>
                )}
             </div>
          </div>

          {/* Sinopse / Detalhes */}
          <div id="detalhes" className="pt-10 md:pt-12 border-t border-slate-100 text-left">
            <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-[#00577C] mb-6 md:mb-8 uppercase tracking-tighter`}>Sobre o Evento</h3>
            <div className="text-base md:text-lg text-slate-600 font-medium leading-relaxed whitespace-pre-wrap max-w-4xl text-justify md:text-left">
              {evento.descricao || "Não existem detalhes adicionais disponíveis para este evento."}
            </div>
          </div>

          {/* Localização com Mapa do Google */}
          <div id="local" className="bg-slate-50 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row gap-6 md:gap-10 items-center">
             <div className="text-left md:text-left flex-1 w-full">
               <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-md text-[#009640] mb-5 md:mb-6">
                 <MapPin size={32} className="md:w-10 md:h-10" />
               </div>
               <p className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Localização e Realização</p>
               <p className={`${jakarta.className} text-2xl md:text-3xl font-bold text-[#00577C]`}>{evento.local || 'São Geraldo do Araguaia'}</p>
               <p className="text-xs md:text-sm text-slate-500 mt-2">SEMTUR • Secretaria Municipal de Turismo</p>
             </div>

             <div className="w-full md:w-[60%] h-[250px] md:h-[300px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-lg border border-slate-200 shrink-0">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent((evento.local || 'São Geraldo do Araguaia') + ', São Geraldo do Araguaia, Pará, Brasil')}&output=embed`}
                ></iframe>
             </div>
          </div>

        </section>
      </div>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="border-t border-slate-200 bg-white text-left">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:gap-8 px-5 py-8 md:py-12 md:flex-row md:items-center md:justify-between text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative h-12 w-32 md:h-14 md:w-40">
              <Image src="/logop.png" alt="Prefeitura" fill className="object-contain object-center md:object-left" />
            </div>
            <div className="md:border-l border-slate-200 md:pl-4">
              <p className={`${jakarta.className} text-xl md:text-2xl font-bold text-[#00577C]`}>SagaTurismo</p>
              <p className="text-xs md:text-sm text-slate-500 uppercase font-bold tracking-widest text-[9px] md:text-[10px]">Portal Oficial de Turismo</p>
            </div>
          </div>
          <p className="text-[10px] md:text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} · Prefeitura Municipal de São Geraldo do Araguaia · Pará
          </p>
        </div>
      </footer>
    </main>
  );
}