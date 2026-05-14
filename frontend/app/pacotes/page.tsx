'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  Loader2, Menu, MapPin, ArrowRight,
  Bed, Compass, Ticket, CalendarClock
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS DO SUPABASE ──
type Hotel = { id: string; nome: string; preco_medio: any; };
type Guia = { id: string; nome: string; preco_diaria: any; especialidade: string; };
type Atracao = { id: string; nome: string; preco_entrada: any; tipo: string; };

type PacoteItem = {
  id: string;
  hoteis: Hotel | null;
  guias: Guia | null;
  atracoes: Atracao | null;
};

type Pacote = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_principal: string;
  dias: number;
  noites: number;
  pacote_itens: PacoteItem[];
  valor_total?: number;
};

// ── FUNÇÕES DE SEGURANÇA ──
const parseValor = (valor: any): number => {
  if (valor === null || valor === undefined || valor === '') return 0;
  if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;
  if (typeof valor === 'string') {
    const formatado = parseFloat(valor.replace(',', '.'));
    return isNaN(formatado) ? 0 : formatado;
  }
  return 0;
};

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

export default function PacotesPage() {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    async function fetchPacotes() {
      const { data, error } = await supabase
        .from('pacotes')
        .select(`
          id, titulo, descricao_curta, imagem_principal, dias, noites,
          pacote_itens (
            id,
            hoteis ( id, nome, preco_medio ),
            guias ( id, nome, preco_diaria, especialidade ),
            atracoes ( id, nome, preco_entrada, tipo )
          )
        `)
        .eq('ativo', true);

      if (error) {
        console.error("Erro ao buscar pacotes:", error);
      } else if (data) {
        const pacotesProcessados = (data as any[]).map((pacote) => {
          let total = 0;
          pacote.pacote_itens.forEach((item: PacoteItem) => {
            if (item.hoteis) total += parseValor(item.hoteis.preco_medio);
            if (item.guias) total += parseValor(item.guias.preco_diaria);
            if (item.atracoes) total += parseValor(item.atracoes.preco_entrada);
          });
          return { ...pacote, valor_total: total };
        });
        setPacotes(pacotesProcessados);
      }
      setLoading(false);
    }
    fetchPacotes();
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
    <main className={`${inter.className} min-h-screen bg-[#F5F5F0] text-slate-900`}>

      {/* ════════════════════════════════════════════════════
          HEADER — unchanged from spec
      ════════════════════════════════════════════════════ */}
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
            <Link href="/aldeias" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              Aldeias
            </Link>
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

      {/* ════════════════════════════════════════════════════
          HERO — full-bleed, editorial, viewport height
          Approach: left-anchored giant headline over
          full-bleed photo, with floating glass stat chips
          and a strong diagonal stripe texture for depth.
      ════════════════════════════════════════════════════ */}
      <section className="relative flex items-end overflow-hidden"
        style={{ height: 'min(92vh, 860px)', minHeight: '560px' }}>

        {/* Background photo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740"
            alt="Araguaia"
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* Gradient layers */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#00577C] via-[#00577C]/50 to-transparent" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#003d59]/85 via-[#00577C]/30 to-transparent" />

        {/* Fine diagonal stripe texture */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
            backgroundSize: '10px 10px',
          }}
        />

        {/* Content */}
        <div className="relative z-20 w-full pb-14 md:pb-20 px-6 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-end justify-between gap-10">

            {/* Headline block */}
            <div className="max-w-2xl">
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-6">
                <span className="h-[2px] w-8 bg-[#F9C400]" />
                <span className="text-[#F9C400] text-[10px] font-black uppercase tracking-[0.4em]">
                  Turismo Oficial · São Geraldo do Araguaia — PA
                </span>
              </div>

              {/* Giant headline */}
              <h1
                className={`${jakarta.className} font-black text-white leading-[0.92] tracking-tight mb-7`}
                style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
              >
                Pacotes<br />
                <span className="text-[#F9C400]">Turísticos</span>
              </h1>

              <p className="text-white/75 font-medium leading-relaxed max-w-lg"
                style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)' }}>
                Experiências completas com guias locais, hospedagem e
                entradas — tudo em um pacote oficial certificado pela SEMTUR.
              </p>
            </div>

            {/* Stat chips — glass morphism */}
            <div className="flex flex-row md:flex-col gap-3 shrink-0">
              {[
                { value: '100%', label: 'Guias Certificados' },
                { value: 'SEMTUR', label: 'Órgão Oficial' },
                { value: '✓', label: 'Reserva Garantida' },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl px-5 py-4 text-center min-w-[128px]"
                >
                  <p className={`${jakarta.className} text-2xl font-black text-white`}>{chip.value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/55 mt-1">{chip.label}</p>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Bottom fade into page bg */}
        <div className="absolute bottom-0 inset-x-0 h-28 z-20 bg-gradient-to-t from-[#F5F5F0] to-transparent" />
      </section>

      {/* ════════════════════════════════════════════════════
          SECTION LABEL — count + heading
      ════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 pt-14 pb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200">
        <div>
          <p className="text-[10px] font-black text-[#00577C] uppercase tracking-[0.35em] mb-2">
            Pacotes Disponíveis
          </p>
          <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 leading-tight`}>
            Escolha a sua Experiência
          </h2>
        </div>
        {!loading && pacotes.length > 0 && (
          <p className="text-sm font-semibold text-slate-400 pb-1 shrink-0">
            {pacotes.length} pacote{pacotes.length !== 1 ? 's' : ''} encontrado{pacotes.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          PACKAGES GRID
          Layout: 3-col on xl, 2-col on md, 1-col mobile.

          Card anatomy:
          ┌──────────────────────┐
          │  16:9 IMAGE          │  ← full-width top image, consistent ratio
          │  [BADGE]   [NUM]     │
          ├──────────────────────┤
          │  ● São Geraldo…      │  ← location micro-label
          │  PACKAGE TITLE       │  ← bold, 2 lines max
          │  Short description   │  ← muted, 2-line clamp
          ├──────────────────────┤
          │  INCLUSIONS BOX      │  ← icon + name + price per row
          ├──────────────────────┤
          │  [PRICE]  [CTA BTN]  │  ← price block + tall arrow button
          └──────────────────────┘
      ════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 pt-10 pb-32">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-36 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-[#00577C] mb-4" />
            <p className="text-sm font-semibold text-slate-400">Carregando pacotes…</p>
          </div>
        ) : pacotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-36 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Ticket className="w-14 h-14 text-slate-200 mb-5" />
            <p className="text-xl font-bold text-slate-500 mb-2">Nenhum pacote disponível.</p>
            <p className="text-sm text-slate-400">Volte em breve para novidades.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7 xl:gap-8">
            {pacotes.map((pacote, index) => (
              <article
                key={pacote.id}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >

                {/* ─── IMAGE ZONE ─── */}
                <div className="relative w-full overflow-hidden bg-slate-100 shrink-0" style={{ aspectRatio: '16/9' }}>
                  {pacote.imagem_principal ? (
                    <Image
                      src={pacote.imagem_principal}
                      alt={pacote.titulo}
                      fill
                      className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin size={40} className="text-slate-300" />
                    </div>
                  )}

                  {/* Scrim for badge legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />

                  {/* Duration badge */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 bg-[#F9C400] text-[#00577C] text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full shadow-md">
                    <CalendarClock size={11} />
                    {pacote.dias} Dias / {pacote.noites} Noites
                  </div>

                  {/* Decorative index number */}
                  <div
                    aria-hidden
                    className={`${jakarta.className} absolute bottom-2 right-4 text-[4.5rem] font-black leading-none text-white/25 select-none pointer-events-none`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </div>

                {/* ─── BODY ZONE ─── */}
                <div className="flex flex-col flex-1 p-6">

                  {/* Location micro-label */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin size={11} className="text-[#00577C] shrink-0" />
                    <span className="text-[9px] font-black text-[#00577C] uppercase tracking-[0.28em]">
                      São Geraldo do Araguaia — PA
                    </span>
                  </div>

                  {/* Package title */}
                  <h2 className={`${jakarta.className} text-[1.2rem] font-bold text-slate-900 leading-snug mb-2`}>
                    {pacote.titulo}
                  </h2>

                  {/* Short description */}
                  <p className="text-[0.83rem] text-slate-500 leading-relaxed line-clamp-2 mb-5">
                    {pacote.descricao_curta}
                  </p>

                  {/* ─── INCLUSIONS ─── */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 mb-5 flex-1">
                    <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">
                      Incluso no pacote
                    </p>
                    <div className="divide-y divide-slate-100">
                      {pacote.pacote_itens.map((item) => (
                        <div key={item.id}>
                          {item.hoteis && (
                            <div className="flex items-center justify-between gap-3 py-2.5">
                              <span className="flex items-center gap-2.5 text-slate-700 text-[0.82rem] font-medium min-w-0">
                                <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-[#00577C]/10">
                                  <Bed size={11} className="text-[#00577C]" />
                                </span>
                                <span className="truncate">{item.hoteis.nome}</span>
                              </span>
                              <span className="text-[0.78rem] font-bold text-slate-800 shrink-0 tabular-nums">
                                {formatarMoeda(parseValor(item.hoteis.preco_medio))}
                              </span>
                            </div>
                          )}
                          {item.guias && (
                            <div className="flex items-center justify-between gap-3 py-2.5">
                              <span className="flex items-center gap-2.5 text-slate-700 text-[0.82rem] font-medium min-w-0">
                                <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-[#009640]/10">
                                  <Compass size={11} className="text-[#009640]" />
                                </span>
                                <span className="truncate">Guia: {item.guias.nome}</span>
                              </span>
                              <span className="text-[0.78rem] font-bold text-slate-800 shrink-0 tabular-nums">
                                {formatarMoeda(parseValor(item.guias.preco_diaria))}
                              </span>
                            </div>
                          )}
                          {item.atracoes && (
                            <div className="flex items-center justify-between gap-3 py-2.5">
                              <span className="flex items-center gap-2.5 text-slate-700 text-[0.82rem] font-medium min-w-0">
                                <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-[#F9C400]/15">
                                  <Ticket size={11} className="text-[#a37c00]" />
                                </span>
                                <span className="truncate">{item.atracoes.nome}</span>
                              </span>
                              <span className="text-[0.78rem] font-bold text-slate-800 shrink-0 tabular-nums">
                                {formatarMoeda(parseValor(item.atracoes.preco_entrada))}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ─── PRICE + CTA ─── */}
                  {/* Side-by-side: price pill left, tall CTA right */}
                  <div className="flex items-stretch gap-3 mt-auto">

                    {/* Price block */}
                    <div className="flex flex-col justify-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 flex-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Valor desde
                      </p>
                      <p className={`${jakarta.className} text-[1.55rem] font-black text-[#009640] leading-none tabular-nums`}>
                        {formatarMoeda(pacote.valor_total || 0)}
                      </p>
                    </div>

                    {/* CTA — stacked icon + label, taller */}
                    <Link
                      href={`/pacotes/${pacote.id}`}
                      className="flex flex-col items-center justify-center gap-1.5 bg-[#00577C] hover:bg-[#004a6b] active:bg-[#003d59] text-white rounded-2xl px-5 py-3.5 transition-colors shrink-0 shadow-md shadow-[#00577C]/15 group/cta"
                    >
                      <ArrowRight
                        size={20}
                        className="transition-transform duration-200 group-hover/cta:translate-x-0.5"
                      />
                      <span className="text-[9px] font-black uppercase tracking-wider whitespace-nowrap">
                        Ver Detalhes
                      </span>
                    </Link>

                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════
          FOOTER INSTITUCIONAL — unchanged from spec
      ════════════════════════════════════════════════════ */}
      <footer className="py-20 px-8 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <img src="/logop.png" alt="Prefeitura SGA" className="h-20 object-contain" />
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                São Geraldo do Araguaia <br /> "Cidade Amada, seguindo em frente"
              </p>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">
                Gestão Executiva
              </h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Prefeito: <br /><b>Jefferson Douglas de Jesus Oliveira</b></li>
                <li>Vice-Prefeito: <br /><b>Marcos Antônio Candido de Lucena</b></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">
                Turismo (SEMTUR)
              </h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Secretária: <br /><b>Micheli Stephany de Souza</b></li>
                <li>Contato: <b>(94) 98145-2067</b></li>
                <li>Email: <b>setursaga@gmail.com</b></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">
                Equipe Técnica
              </h5>
              <ul className="text-sm text-slate-500 space-y-2 font-medium">
                <li>• Adriana da Luz Lima</li>
                <li>• Carmelita Luz da Silva</li>
                <li>• Diego Silva Costa</li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-10 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
              © 2026 Secretaria Municipal de Turismo - São Geraldo do Araguaia (PA)
            </p>
          </div>
        </div>
      </footer>

    </main>
  );
}