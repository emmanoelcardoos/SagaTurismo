'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { 
  Loader2, Menu, MapPin, ArrowRight, CheckCircle2, 
  Bed, Compass, Ticket, QrCode, X, CalendarClock, Wallet 
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// FONTES PADRÃO DO SITE
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS DO SUPABASE ──
type Hotel = { id: string; nome: string; preco_medio: number; };
type Guia = { id: string; nome: string; preco_diaria: number; especialidade: string; };
type Atracao = { id: string; nome: string; preco_entrada: number; tipo: string; };

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
  valor_total?: number; // Calculado no frontend
};

// FORMATADOR DE MOEDA (BRL)
const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

export default function PacotesPage() {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Estados do Checkout
  const [pacoteSelecionado, setPacoteSelecionado] = useState<Pacote | null>(null);
  const [processandoPix, setProcessandoPix] = useState(false);
  const [pixGerado, setPixGerado] = useState(false);

  useEffect(() => {
    async function fetchPacotes() {
      // Faz o Join inteligente do Supabase puxando o pacote e TUDO o que está ligado a ele
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
        // Calcular o valor total de cada pacote somando os itens
        const pacotesProcessados = (data as any[]).map((pacote) => {
          let total = 0;
          pacote.pacote_itens.forEach((item: PacoteItem) => {
            if (item.hoteis) total += Number(item.hoteis.preco_medio);
            if (item.guias) total += Number(item.guias.preco_diaria);
            if (item.atracoes) total += Number(item.atracoes.preco_entrada);
          });
          return { ...pacote, valor_total: total };
        });
        setPacotes(pacotesProcessados);
      }
      setLoading(false);
    }
    fetchPacotes();
  }, []);

  // Efeito do Scroll para o Header
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

  // Função Simulação de Checkout
  const simularPagamentoPix = () => {
    setProcessandoPix(true);
    // Simula a ida ao Backend (Python/FastAPI) e a geração do QR Code no PagBank
    setTimeout(() => {
      setProcessandoPix(false);
      setPixGerado(true);
    }, 2500);
  };

  const fecharModal = () => {
    setPacoteSelecionado(null);
    setProcessandoPix(false);
    setPixGerado(false);
  };

  return (
    <main className={`${inter.className} min-h-screen bg-[#FAFAF7] text-slate-900 pb-32`}>

      {/* ── HEADER PADRÃO ── */}
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

      {/* ── HERO SECTION ── */}
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

      {/* ── LISTAGEM DE PACOTES (GRID) ── */}
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
                
                {/* Imagem do Pacote */}
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

                {/* Corpo do Pacote */}
                <div className="p-8 flex flex-col flex-1">
                  <h2 className={`${jakarta.className} text-2xl font-bold text-[#00577C] mb-2 leading-tight`}>{pacote.titulo}</h2>
                  <p className="text-sm text-slate-500 mb-6 line-clamp-2">{pacote.descricao_curta}</p>

                  {/* Detalhamento dos Itens (Transparência de Preços) */}
                  <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">O que está incluso neste pacote:</p>
                    
                    {pacote.pacote_itens.map((item) => (
                      <div key={item.id}>
                        {item.hoteis && (
                          <div className="flex justify-between items-center text-sm mb-2">
                            <span className="flex items-center gap-2 text-slate-700 font-medium"><Bed size={16} className="text-[#00577C]" /> {item.hoteis.nome}</span>
                            <span className="font-bold text-slate-900">{formatarMoeda(item.hoteis.preco_medio)}</span>
                          </div>
                        )}
                        {item.guias && (
                          <div className="flex justify-between items-center text-sm mb-2">
                            <span className="flex items-center gap-2 text-slate-700 font-medium"><Compass size={16} className="text-[#009640]" /> Guia: {item.guias.nome}</span>
                            <span className="font-bold text-slate-900">{formatarMoeda(item.guias.preco_diaria)}</span>
                          </div>
                        )}
                        {item.atracoes && (
                          <div className="flex justify-between items-center text-sm mb-2">
                            <span className="flex items-center gap-2 text-slate-700 font-medium"><Ticket size={16} className="text-[#F9C400]" /> {item.atracoes.nome}</span>
                            <span className="font-bold text-slate-900">{formatarMoeda(item.atracoes.preco_entrada)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Rodapé do Card: Preço Total e Botão */}
                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Total</p>
                      <p className={`${jakarta.className} text-3xl font-black text-[#009640]`}>{formatarMoeda(pacote.valor_total || 0)}</p>
                    </div>
                    <button 
                      onClick={() => setPacoteSelecionado(pacote)}
                      className="bg-[#00577C] hover:bg-[#004a6b] text-white px-6 py-3 rounded-full font-bold text-sm transition-colors flex items-center gap-2 shadow-md"
                    >
                      Comprar <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── MODAL DE CHECKOUT PIX ── */}
      {pacoteSelecionado && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            
            {/* Header Modal */}
            <div className="bg-[#00577C] p-6 text-white flex justify-between items-start">
              <div>
                <p className="text-[#F9C400] text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Checkout Oficial SGA</p>
                <h3 className={`${jakarta.className} text-2xl font-bold leading-tight`}>{pacoteSelecionado.titulo}</h3>
              </div>
              <button onClick={fecharModal} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"><X size={20} /></button>
            </div>

            <div className="p-8">
              {!pixGerado ? (
                <>
                  <p className="text-slate-600 mb-6 text-center text-sm">
                    Confirme os detalhes da sua compra. O valor será dividido automaticamente entre os prestadores de serviço locais.
                  </p>

                  {/* Resumo Final */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
                      <span className="text-slate-500 font-medium">Data da Viagem</span>
                      <span className="font-bold text-[#00577C]">A agendar</span>
                    </div>
                    <div className="flex justify-between items-center text-xl">
                      <span className={`${jakarta.className} font-bold text-slate-800`}>Total a Pagar</span>
                      <span className={`${jakarta.className} font-black text-[#009640] text-2xl`}>
                        {formatarMoeda(pacoteSelecionado.valor_total || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Botão Pagar PIX */}
                  <button 
                    onClick={simularPagamentoPix}
                    disabled={processandoPix}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                      processandoPix ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-[#009640] hover:bg-[#007a33] text-white shadow-xl hover:-translate-y-1'
                    }`}
                  >
                    {processandoPix ? (
                      <><Loader2 className="animate-spin" size={24} /> Gerando PIX PagBank...</>
                    ) : (
                      <><QrCode size={24} /> Pagar via PIX Agora</>
                    )}
                  </button>
                  <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-slate-400 font-bold uppercase">
                    <Wallet size={12} /> Pagamento 100% Seguro via PagBank
                  </div>
                </>
              ) : (
                /* Sucesso / QR Code Gerado (Simulação) */
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-[#009640]" />
                  </div>
                  <h3 className={`${jakarta.className} text-2xl font-bold text-slate-800 mb-2`}>PIX Gerado com Sucesso!</h3>
                  <p className="text-slate-500 mb-8">
                    Abra o app do seu banco e escaneie o código abaixo ou copie a chave Pix Copia e Cola.
                  </p>
                  
                  {/* Fake QR Code Area */}
                  <div className="w-48 h-48 bg-slate-100 border-2 border-dashed border-slate-300 mx-auto rounded-xl flex items-center justify-center mb-6">
                    <QrCode size={60} className="text-slate-300" />
                  </div>

                  <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-full py-3 rounded-xl font-bold transition-colors">
                    Copiar Código PIX
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER PADRÃO ── */}
      <footer className="py-20 px-8 border-t border-slate-100 bg-white mt-20">
        <div className="max-w-7xl mx-auto text-center">
           <img src="/logop.png" alt="Prefeitura SGA" className="h-16 object-contain mx-auto mb-6" />
           <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
             São Geraldo do Araguaia <br/> Cidade Amada, seguindo em frente
           </p>
        </div>
      </footer>
    </main>
  );
}