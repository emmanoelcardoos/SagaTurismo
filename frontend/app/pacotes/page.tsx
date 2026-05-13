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
// Garante que o valor é sempre um número válido, mesmo se vier null ou string com vírgula do banco
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
        // Cálculo 100% seguro do valor total usando o parseValor
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
    <main className={`${inter.className} min-h-screen bg-[#FAFAF7] text-slate-900 pb-32`}>

      {/* ── HEADER ── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56">
              <Image src="/logop.png" alt="Prefeitura de São Geraldo do Araguaia" fill priority className="object-contain object-left" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo de São Geraldo do Araguaia</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/aldeias" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Aldeias</Link>
            <Link href="/pacotes" className="text-sm font-bold text-[#00577C]">Pacotes & Vendas</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão Residente</Link>
          </nav>
          <button className="rounded-xl border border-slate-200 p-2 md:hidden"><Menu className="h-5 w-5 text-[#00577C]" /></button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-48 pb-24 px-5 bg-[#00577C] text-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <Image src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740" alt="Fundo Pacotes" fill className="object-cover" />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#00577C] via-[#00577C]/90 to-[#FAFAF7]" />
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-8 bg-[#F9C400]" />
            <span className="text-[#F9C400] text-xs font-bold uppercase tracking-[0.3em]">Turismo Oficial</span>
            <span className="h-px w-8 bg-[#F9C400]" />
          </div>
          <h1 className={`${jakarta.className} text-5xl md:text-7xl font-black tracking-tight mb-6`}>
            Pacotes <span className="text-[#F9C400]">Turísticos</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto font-medium">
            Explore São Geraldo do Araguaia sem complicações. Compre pacotes oficiais integrados com guias locais, hotéis e entradas de parques.
          </p>
        </div>
      </section>

      {/* ── GRID ── */}
      <section className="mx-auto max-w-7xl px-5 -mt-10 relative z-20">
        {loading ? (
          <div className="flex justify-center py-20 bg-white rounded-3xl shadow-xl border border-slate-100">
            <Loader2 className="w-10 h-10 animate-spin text-[#00577C]" />
          </div>
        ) : pacotes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-xl border border-slate-100">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-slate-500">Nenhum pacote disponível no momento.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-10">
            {pacotes.map((pacote) => (
              <div key={pacote.id} className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-slate-100 flex flex-col md:flex-row group transition-transform hover:-translate-y-1">
                
                <div className="relative h-64 md:h-auto md:w-2/5 flex-shrink-0 bg-slate-200">
                  {pacote.imagem_principal ? (
                    <Image src={pacote.imagem_principal} alt={pacote.titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400"><MapPin size={40} /></div>
                  )}
                  <div className="absolute top-4 left-4 bg-[#F9C400] text-[#00577C] px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 shadow-lg">
                    <CalendarClock size={14} /> {pacote.dias} Dias / {pacote.noites} Noites
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <h2 className={`${jakarta.className} text-2xl font-bold text-[#00577C] mb-2 leading-tight`}>{pacote.titulo}</h2>
                  <p className="text-sm text-slate-500 mb-6 line-clamp-2">{pacote.descricao_curta}</p>

                  <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">O que está incluso neste pacote:</p>
                    
                    {pacote.pacote_itens.map((item) => (
                      <div key={item.id}>
                        {item.hoteis && (
                          <div className="flex justify-between items-center text-sm mb-2">
                            <span className="flex items-center gap-2 text-slate-700 font-medium"><Bed size={16} className="text-[#00577C]" /> {item.hoteis.nome}</span>
                            <span className="font-bold text-slate-900">{formatarMoeda(parseValor(item.hoteis.preco_medio))}</span>
                          </div>
                        )}
                        {item.guias && (
                          <div className="flex justify-between items-center text-sm mb-2">
                            <span className="flex items-center gap-2 text-slate-700 font-medium"><Compass size={16} className="text-[#009640]" /> Guia: {item.guias.nome}</span>
                            <span className="font-bold text-slate-900">{formatarMoeda(parseValor(item.guias.preco_diaria))}</span>
                          </div>
                        )}
                        {item.atracoes && (
                          <div className="flex justify-between items-center text-sm mb-2">
                            <span className="flex items-center gap-2 text-slate-700 font-medium"><Ticket size={16} className="text-[#F9C400]" /> {item.atracoes.nome}</span>
                            <span className="font-bold text-slate-900">{formatarMoeda(parseValor(item.atracoes.preco_entrada))}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Total</p>
                      <p className={`${jakarta.className} text-3xl font-black text-[#009640]`}>{formatarMoeda(pacote.valor_total || 0)}</p>
                    </div>
                    <Link 
                      href={`/pacotes/${pacote.id}`}
                      className="bg-[#00577C] hover:bg-[#004a6b] text-white px-6 py-3 rounded-full font-bold text-sm transition-colors flex items-center gap-2 shadow-md"
                    >
                      Ver Detalhes <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-20 px-8 border-t border-slate-100 bg-white mt-20">
        <div className="max-w-7xl mx-auto text-center">
           <img src="/logop.png" alt="Prefeitura SGA" className="h-16 object-contain mx-auto mb-6" />
           <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
             São Geraldo do Araguaia <br/> "Cidade Amada, seguindo em frente"
           </p>
        </div>
      </footer>
    </main>
  );
}