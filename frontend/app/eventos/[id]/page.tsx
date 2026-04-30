'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, MapPin, Menu, ChevronRight, 
  Ticket, CalendarDays, Loader2
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// TIPO EXATO DA SUA TABELA
type Evento = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  imagem_url: string;
  categoria: string;
  // Campos extra que pode ter adicionado para o layout
  horario?: string;
  duracao?: string;
  preco?: string;
  classificacao?: string;
  link_bilheteira?: string;
};

export default function EventoDetalhePage({ params }: { params: { id: string } }) {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Estados Reais do Banco de Dados
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ==========================================
  // FETCH REAL NA SUPABASE
  // ==========================================
  useEffect(() => {
    async function fetchEventoReal() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Variáveis de ambiente do Supabase não encontradas.");
        }

        const res = await fetch(`${supabaseUrl}/rest/v1/eventos?id=eq.${params.id}&select=*`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) throw new Error("Erro ao buscar o evento na base de dados.");

        const data = await res.json();
        
        if (data && data.length > 0) {
          setEvento(data[0]);
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

  // ==========================================
  // LÓGICA DO HEADER FORNECIDO
  // ==========================================
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


  // ==========================================
  // ESTADOS DE CARREGAMENTO E ERRO
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold">A carregar evento...</p>
      </div>
    );
  }

  if (erro || !evento) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900">
        <h1 className="text-3xl font-black mb-4">Ups! Algo correu mal.</h1>
        <p className="text-slate-500 mb-8">{erro}</p>
        <Link href="/" className="bg-[#00577C] text-white px-6 py-3 rounded-full font-bold">Voltar à Página Inicial</Link>
      </div>
    );
  }

  // ==========================================
  // FORMATAÇÃO DE DATA DO EVENTO REAL
  // ==========================================
  const dataObj = new Date(evento.data);
  const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  
  const diaSemana = diasSemana[dataObj.getDay()];
  const diaMes = String(dataObj.getDate()).padStart(2, '0');
  const mesExtenso = meses[dataObj.getMonth()];
  const ano = dataObj.getFullYear();

  return (
    <main className={`${inter.className} min-h-screen bg-white text-slate-900`}>
      
      {/* HEADER FORNECIDO PELO USUÁRIO */}
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

      {/* CONTEÚDO DA PÁGINA DO EVENTO */}
      <div className="mx-auto max-w-7xl px-5 pt-32 pb-24 flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
        
        {/* ============================================================== */}
        {/* COLUNA ESQUERDA (SIDEBAR DE INFORMAÇÕES) */}
        {/* ============================================================== */}
        <aside className="w-full lg:w-[280px] shrink-0 space-y-12">
          
          {/* Navegação Interna */}
          <div className="bg-[#00577C] text-white p-8 rounded-[2rem] shadow-xl">
             <h2 className={`${jakarta.className} text-2xl font-black mb-8`}>Informações</h2>
             <nav className="space-y-5 flex flex-col font-medium text-sm">
               <Link href="#detalhes" className="hover:text-[#F9C400] transition-colors flex items-center justify-between group">
                 Sobre o Evento <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
               </Link>
               <Link href="#local" className="hover:text-[#F9C400] transition-colors flex items-center justify-between group">
                 Como Chegar <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
               </Link>
             </nav>
          </div>

          {/* Dados Técnicos Reais */}
          <div className="space-y-6 px-4">
             <div>
               <p className={`${jakarta.className} text-xl font-black text-slate-900`}>Duração</p>
               <p className="text-slate-600 font-medium">{evento.duracao || 'Consulte a programação'}</p>
             </div>
             
             <div>
               <p className={`${jakarta.className} text-xl font-black text-slate-900`}>Preço</p>
               <p className="text-slate-600 font-medium">{evento.preco || 'Acesso Livre / Gratuito'}</p>
             </div>

             <div>
               <p className={`${jakarta.className} text-xl font-black text-slate-900`}>Horário</p>
               <p className="text-slate-600 font-medium">{evento.horario || 'Consulte o cronograma oficial'}</p>
             </div>
          </div>
        </aside>

        {/* ============================================================== */}
        {/* COLUNA DIREITA (CONTEÚDO PRINCIPAL DO EVENTO) */}
        {/* ============================================================== */}
        <section className="flex-1 w-full space-y-12">
          
          {/* Botão de Voltar */}
          <Link href="/#eventos" className="inline-flex items-center gap-2 text-sm font-bold text-[#00577C] hover:text-[#F9C400] transition-colors mb-2">
            <ArrowLeft size={16} /> Voltar à Agenda
          </Link>

          {/* Bloco Superior: Imagem + Detalhes */}
          <div className="flex flex-col xl:flex-row gap-8 items-start">
             
             {/* Imagem Real do Evento */}
             <div className="relative w-full xl:w-[60%] h-[400px] overflow-hidden rounded-[2rem] bg-slate-100 shadow-xl">
               {evento.imagem_url ? (
                 <Image 
                   src={evento.imagem_url} 
                   alt={evento.titulo} 
                   fill 
                   className="object-cover"
                   priority
                 />
               ) : (
                 <div className="flex items-center justify-center w-full h-full text-slate-400">
                   <CalendarDays size={48} />
                 </div>
               )}
             </div>

             {/* Informação Principal */}
             <div className="w-full xl:w-[40%] flex flex-col items-start pt-2">
                
                {/* Data Formatada */}
                <div className="flex gap-3 items-start">
                  <div className={`${jakarta.className} bg-[#00577C] text-white px-3 py-2 text-center rounded-xl shadow-md leading-none`}>
                    <p className="text-xs font-bold uppercase">{diaSemana}</p>
                    <p className="text-base font-black uppercase tracking-widest">{mesExtenso}</p>
                  </div>
                  <p className={`${jakarta.className} text-6xl font-black text-slate-900 tracking-tighter leading-none`}>
                    {diaMes}
                  </p>
                </div>
                
                <p className="mt-3 text-sm font-bold text-slate-500">
                  {dataObj.getDate()} de {mesExtenso} de {ano}
                </p>

                {/* Categoria */}
                {evento.categoria && (
                  <div className="mt-4 bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest shadow-sm">
                    {evento.categoria}
                  </div>
                )}

                {/* Título Real */}
                <h1 className={`${jakarta.className} mt-3 text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]`}>
                  {evento.titulo}
                </h1>

                {/* Classificação */}
                <div className="mt-6">
                  <p className={`${jakarta.className} font-black text-slate-900`}>Classificação Indicativa</p>
                  <p className="text-sm text-slate-600">{evento.classificacao || 'Livre para todos os públicos'}</p>
                </div>

                {/* Botão de Ação / Bilheteira */}
                {evento.link_bilheteira && (
                  <Link 
                    href={evento.link_bilheteira} 
                    target="_blank"
                    className={`${jakarta.className} mt-8 block w-full md:w-auto bg-[#00577C] text-white px-8 py-4 rounded-full text-center font-black text-sm uppercase tracking-widest transition-all hover:bg-[#F9C400] hover:text-[#00577C] shadow-lg flex items-center justify-center gap-2`}
                  >
                    <Ticket size={18} /> Participar / Comprar
                  </Link>
                )}
             </div>
          </div>

          {/* Descrição Real (Sinopse) */}
          <div id="detalhes" className="pt-8 border-t border-slate-200">
            <h1 className={`${jakarta.className} text-3xl font-black text-[#00577C] mb-6`}>Detalhes do Evento</h1>
            <div className="text-lg text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
              {evento.descricao || 'Descrição não disponibilizada para este evento.'}
            </div>
          </div>

          {/* Localização Real */}
          <div id="local" className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex items-center gap-6">
             <div className="w-16 h-16 shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm text-[#009640]">
               <MapPin size={32} />
             </div>
             <div>
               <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Localização</p>
               <p className={`${jakarta.className} text-2xl font-bold text-slate-900`}>{evento.local || 'São Geraldo do Araguaia'}</p>
             </div>
          </div>

        </section>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-40">
              <Image
                src="/logop.png"
                alt="Prefeitura de São Geraldo do Araguaia"
                fill
                className="object-contain object-left"
              />
            </div>

            <div className="border-l border-slate-200 pl-4">
              <p className={`${jakarta.className} text-2xl font-bold text-[#00577C]`}>
                SagaTurismo
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Plataforma oficial de turismo
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} · Prefeitura Municipal de São Geraldo do Araguaia · Pará
          </p>
        </div>
      </footer>
    </main>
  );
}