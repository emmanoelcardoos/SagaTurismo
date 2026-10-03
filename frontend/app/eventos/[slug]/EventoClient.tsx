'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, ReactNode } from 'react';
import { CalendarDays, ArrowLeft, ArrowRight, MapPin, Ticket, Clock } from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export type Evento = {
  id: string;
  slug: string; // 🔴 Adicionado o slug na tipagem
  titulo: string;
  subtitulo?: string;
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

export type EventoNav = {
  id: string;
  slug: string; // 🔴 Adicionado o slug na navegação (Anterior/Próximo)
  titulo: string;
};

function useScrollAnimation(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);
  return { ref, isVisible };
}

function Reveal({ children, className = '', anim = 'up', delay = 0 }: {
  children: ReactNode; className?: string;
  anim?: 'up' | 'left' | 'right' | 'zoom' | 'fade'; delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();
  const hidden: Record<string, string> = {
    up: 'opacity-0 translate-y-14',
    left: 'opacity-0 translate-x-14',
    right: 'opacity-0 -translate-x-14',
    zoom: 'opacity-0 scale-90',
    fade: 'opacity-0',
  };
  return (
    <div ref={ref}
      className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : hidden[anim]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function EventoClient({
  evento,
  eventoAnterior,
  eventoProximo,
}: {
  evento: Evento;
  eventoAnterior: EventoNav | null;
  eventoProximo: EventoNav | null;
}) {
  // ── Formatação de Datas ──
  const dataObj = new Date(evento.data + 'T00:00:00');
  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const diaSemana = diasSemana[dataObj.getDay()];
  const diaMes = String(dataObj.getDate()).padStart(2, '0');
  const mesExtenso = meses[dataObj.getMonth()];
  const ano = dataObj.getFullYear();

  const dataFormatada = `${diaMes} de ${mesExtenso} de ${ano}`;

  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 overflow-x-hidden flex flex-col`}>

      {/* ══════════════════════════════════════
          TÍTULO DO EVENTO (TOPO)
      ══════════════════════════════════════ */}
      <section className="w-full bg-[#FDFCF7] pt-28 md:pt-36 pb-10 md:pb-14">
        <div className="max-w-[900px] mx-auto px-6 text-center">

          <h1 className={`${jakarta.className} text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight`}>
            {evento.titulo}
          </h1>

          {evento.subtitulo && (
            <p className="text-slate-500 text-lg md:text-xl font-medium mt-4 max-w-2xl mx-auto">
              {evento.subtitulo}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-6 text-slate-500">
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-[#00577C]" />
              <span className="text-xs md:text-sm font-bold uppercase tracking-wider">
                {dataFormatada}
              </span>
            </div>
            {evento.local && (
              <>
                <span className="text-slate-300 hidden sm:block">•</span>
                <span className="text-xs md:text-sm font-medium">{evento.local}</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CARTAZ EM FORMATO QUADRADO
      ══════════════════════════════════════ */}
      {evento.imagem_url && (
        <section className="w-full bg-[#FDFCF7] pb-12 md:pb-16">
          <div className="max-w-[600px] mx-auto px-6">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-xl border border-slate-200">
              <Image
                src={evento.imagem_url}
                alt={`Cartaz oficial — ${evento.titulo}${evento.local ? ` em ${evento.local}` : ''}, São Geraldo do Araguaia`}
                fill
                priority
                sizes="(max-width: 640px) 100vw, 600px"
                className="object-contain"
              />
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          CONTEÚDO PRINCIPAL
      ══════════════════════════════════════ */}
      <section className="max-w-[900px] mx-auto px-6 pb-8 md:pb-12 w-full relative z-20 flex-1">

        <Reveal anim="up">
          <Link
            href="/eventos"
            className="text-[#00577C] hover:text-[#003d57] transition-colors mb-10 inline-block font-medium text-sm md:text-base underline underline-offset-4 decoration-slate-200 hover:decoration-[#00577C]"
          >
            &larr; Voltar para a agenda de eventos
          </Link>

          {/* Descrição */}
          {evento.descricao && (
            <div className="text-slate-700 leading-relaxed text-base md:text-lg whitespace-pre-wrap mb-12">
              {evento.descricao}
            </div>
          )}

          {/* Informações */}
          <div className="flex flex-col gap-4 text-sm md:text-base text-slate-800">
            <p>
              <strong>Data:</strong> {dataFormatada} ({diaSemana})
            </p>

            {(evento.horario || evento.duracao) && (
              <p className="flex items-center gap-2 flex-wrap">
                <Clock size={16} className="text-[#00577C] inline" />
                <strong>Horário:</strong> {evento.horario || 'N/D'}
                {evento.duracao && <span className="text-slate-500 font-normal"> (Duração: {evento.duracao})</span>}
              </p>
            )}

            <p className="flex items-center gap-2 flex-wrap">
              <Ticket size={16} className="text-[#00577C] inline" />
              <strong>Entrada:</strong> {evento.preco && evento.preco.toLowerCase() !== 'gratuito' ? evento.preco : 'Gratuito'}
              {evento.classificacao && <span className="text-slate-500 font-normal"> • {evento.classificacao}</span>}
            </p>

            <p className="flex items-center gap-2 flex-wrap">
              <MapPin size={16} className="text-[#00577C] inline" />
              <strong>Local:</strong> {evento.local || 'São Geraldo do Araguaia'} -{' '}
              <a
                href={`https://maps.google.com/maps?q=${encodeURIComponent((evento.local || '') + ' São Geraldo do Araguaia, Pará')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00577C] font-semibold hover:underline decoration-slate-300 underline-offset-4"
              >
                Ver no mapa
              </a>
            </p>

            {evento.link_bilheteira && (
              <p className="mt-4">
                <strong>Bilheteira:</strong>{' '}
                <a
                  href={evento.link_bilheteira}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00577C] font-semibold hover:underline decoration-slate-300 underline-offset-4"
                >
                  Adquirir bilhete online
                </a>
              </p>
            )}
          </div>
        </Reveal>

        {/* ── NAVEGAÇÃO DE EVENTOS ── */}
        <div className="w-full pt-16 md:pt-24 mt-16 md:mt-24 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-10">

            {eventoAnterior ? (
              <Link href={`/eventos/${eventoAnterior.slug}`} className="group flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left mr-auto w-full sm:w-auto">
                <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#00577C] group-hover:text-white group-hover:border-[#00577C] transition-all shrink-0">
                  <ArrowLeft size={20} />
                </div>
                <div>
                  <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1`}>
                    Evento Anterior
                  </p>
                  <p className={`${jakarta.className} text-base md:text-lg font-bold text-slate-800 group-hover:text-[#00577C] transition-colors line-clamp-2 leading-tight`}>
                    {eventoAnterior.titulo}
                  </p>
                </div>
              </Link>
            ) : <div className="hidden sm:block flex-1" />}

            {eventoProximo ? (
              <Link href={`/eventos/${eventoProximo.slug}`} className="group flex flex-col sm:flex-row-reverse items-center sm:items-start gap-4 text-center sm:text-right ml-auto w-full sm:w-auto">
                <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#00577C] group-hover:text-white group-hover:border-[#00577C] transition-all shrink-0">
                  <ArrowRight size={20} />
                </div>
                <div>
                  <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1`}>
                    Próximo Evento
                  </p>
                  <p className={`${jakarta.className} text-base md:text-lg font-bold text-slate-800 group-hover:text-[#00577C] transition-colors line-clamp-2 leading-tight`}>
                    {eventoProximo.titulo}
                  </p>
                </div>
              </Link>
            ) : <div className="hidden sm:block flex-1" />}

          </div>
        </div>

      </section>
    </main>
  );
}