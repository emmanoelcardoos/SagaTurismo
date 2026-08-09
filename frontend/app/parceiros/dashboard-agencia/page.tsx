'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, LogOut, Map, 
  TrendingUp, Users, Plus, Bed, Compass, 
  Calendar, ArrowRight, Wallet, CheckCircle2 
} from 'lucide-react';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type Pacote = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_principal?: string;
  dias: number;
  noites: number;
  preco: number;
  ativo?: boolean;
};

type MetricasAgencia = {
  total_vendido: number;
  total_pedidos: number;
};

export default function DashboardAgenciaPage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<MetricasAgencia>({ total_vendido: 0, total_pedidos: 0 });
  const [pacotes, setPacotes] = useState<Pacote[]>([]);

  // ── ESTADOS DA CHAVE PIX ──
  const [chavePix, setChavePix] = useState('');
  const [salvandoPix, setSalvandoPix] = useState(false);
  const [mensagemPix, setMensagemPix] = useState('');

  // 1. VALIDAÇÃO DE SESSÃO DA AGÊNCIA
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");
    const tipo = localStorage.getItem("tipo_parceiro"); 

    if (!id || (tipo !== 'agencia' && tipo !== 'semtur' && tipo !== 'pacote')) {
      router.push('/parceiros');
    } else {
      setParceiroId(id);
      setNomeNegocio(nome || 'Central de Agenciamento');
    }
  }, [router]);

  // 2. CARREGAR PACOTES E CALCULAR MÉTRICAS REAIS
  useEffect(() => {
    if (!parceiroId) return;

    async function carregarDashboard() {
      try {
        // A) Buscar APENAS os pacotes que pertencem a esta agência
        const { data: dadosPacotes, error: errPacotes } = await supabase
          .from('pacotes')
          .select('id, titulo, descricao_curta, imagem_principal, dias, noites, preco, ativo')
          .eq('parceiro_id', parceiroId);

        let pacotesDaAgenciaIds: string[] = [];

        if (!errPacotes && dadosPacotes) {
          setPacotes(dadosPacotes as Pacote[]);
          pacotesDaAgenciaIds = dadosPacotes.map(p => p.id); 
        }

        // B) Buscar o histórico de vendas mapeando também o item_id
        const { data: dadosPedidos, error: errPedidos } = await supabase
          .from('pedidos')
          .select('valor_total, repasse_hotel, repasse_guia, tipo_item, status_pagamento, item_id');

        if (!errPedidos && dadosPedidos) {
          const totais = dadosPedidos
            .filter(pedido => 
               pedido.tipo_item?.toLowerCase().trim() === 'pacote' && 
               pedido.status_pagamento?.toLowerCase().trim() === 'pago' &&
               pacotesDaAgenciaIds.includes(pedido.item_id)
            )
            .reduce((acc, pedido) => ({
              total_vendido: acc.total_vendido + (Number(pedido.valor_total) || 0),
              total_pedidos: acc.total_pedidos + 1,
            }), { total_vendido: 0, total_pedidos: 0 });

          setMetricas(totais);
        }

        // C) Buscar a Chave PIX atual do parceiro
        const { data: parceiroData } = await supabase
          .from('parceiros')
          .select('chave_pix')
          .eq('id', parceiroId)
          .single();
          
        if (parceiroData?.chave_pix) {
          setChavePix(parceiroData.chave_pix);
        }

      } catch (error) {
        console.error("Erro ao mapear tabelas do Schema:", error);
      } finally {
        setLoading(false);
      }
    }
    
    carregarDashboard();
  }, [parceiroId]);

  const handleSalvarPix = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoPix(true);
    setMensagemPix('');
    try {
      const { error } = await supabase
        .from('parceiros')
        .update({ chave_pix: chavePix })
        .eq('id', parceiroId);
      if (error) throw error;
      setMensagemPix('Chave PIX atualizada! O saque automático está ativado.');
    } catch (err) {
      setMensagemPix('Erro ao guardar a chave PIX. Tente novamente.');
    } finally {
      setSalvandoPix(false);
      setTimeout(() => setMensagemPix(''), 4000);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/parceiros');
  };

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest text-slate-500">Sincronizando Livros Fiscais...</p>
      </div>
    );
  }

  const IMG_FALLBACK = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1721";

  return (
    <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col`}>
      
      {/* HEADER DA AGÊNCIA */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="hidden sm:block relative h-10 w-32 border-r border-slate-200 pr-6">
              <Image src="/logop.png" alt="SGA" fill priority className="object-contain object-left" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-[#0085FF] text-white p-2.5 rounded-xl shadow-lg">
                <Map size={20} />
              </div>
              <div>
                <h1 className={`${jakarta.className} font-black text-slate-900 text-lg md:text-xl leading-none`}>{nomeNegocio}</h1>
                <p className="text-[10px] font-black uppercase text-[#0085FF] tracking-[0.2em] mt-0.5">Gestor de Combos Turísticos</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/parceiros/dashboard-agencia/disponibilidade" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-[#0085FF] hover:bg-[#0074e0] px-5 py-2.5 rounded-full shadow-md transition-all active:scale-95">
              <Plus size={14} /> <span className="hidden sm:inline">Criar Pacote</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center justify-center w-10 h-10 md:w-auto md:px-5 md:py-2.5 rounded-full text-slate-500 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm transition-all">
              <LogOut size={16} className="md:mr-2" /> <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-10 py-8 flex-1 space-y-10">
        
        {/* ── CONFIGURAÇÕES FINANCEIRAS (CHAVE PIX) ── */}
        <section className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col lg:flex-row items-center gap-8">
           <div className="flex-1 text-left">
             <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#009640]/10 text-[#009640] p-2.5 rounded-xl shadow-sm"><Wallet size={20}/></div>
                <h2 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-800`}>Recebimento Automático</h2>
             </div>
             <p className="text-sm font-medium text-slate-500 max-w-md mt-2">
               Defina a sua Chave PIX para receber automaticamente o repasse das suas vendas. O saldo será transferido da sua Wallet no Asaas diretamente para a sua conta bancária sem taxas ocultas.
             </p>
           </div>
           
           <div className="flex-1 w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-left">
             <form onSubmit={handleSalvarPix} className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sua Chave PIX (Telefone, CPF/CNPJ, E-mail ou Aleatória)</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input required type="text" value={chavePix} onChange={(e) => setChavePix(e.target.value)} placeholder="Insira a sua Chave PIX..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#009640] transition-colors shadow-sm" />
                  <button type="submit" disabled={salvandoPix} className="bg-[#009640] hover:bg-green-700 disabled:opacity-50 disabled:active:scale-100 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl shadow-md transition-all shrink-0 active:scale-95">
                    {salvandoPix ? 'A Guardar...' : 'Salvar Chave'}
                  </button>
                </div>
                {mensagemPix && (
                  <p className={`text-xs font-bold mt-1 ${mensagemPix.includes('Erro') ? 'text-red-500' : 'text-[#009640]'} flex items-center gap-1.5 animate-in fade-in`}>
                    <CheckCircle2 size={14}/> {mensagemPix}
                  </p>
                )}
             </form>
           </div>
        </section>

        {/* BALANÇO FINANCEIRO DE VENDAS */}
        <section>
          <div className="flex items-center justify-between mb-5">
             <h2 className={`${jakarta.className} text-xl font-black text-slate-800`}>Balanço de Vendas</h2>
             <span className="bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Sincronizado</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* TOTAL VENDIDO */}
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-md flex flex-col justify-between group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 tracking-widest mb-3 flex items-center gap-2 uppercase">
                    <TrendingUp size={14} className="text-[#0085FF]"/> Total Faturado
                  </p>
                  <p className={`${jakarta.className} text-4xl font-black text-slate-900`}>{formatarMoeda(metricas.total_vendido)}</p>
               </div>
               <div className="mt-6 border-t border-slate-100 pt-4 relative z-10">
                 <p className="text-xs font-bold text-slate-500">Volume Bruto captado pela agência.</p>
               </div>
            </div>

            {/* QUANTIDADE DE PACOTES VENDIDOS */}
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-md flex flex-col justify-between group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#009640]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 tracking-widest mb-3 flex items-center gap-2 uppercase">
                    <Users size={14} className="text-[#009640]"/> Pacotes Vendidos
                  </p>
                  <p className={`${jakarta.className} text-4xl font-black text-[#009640]`}>{metricas.total_pedidos}</p>
               </div>
               <div className="mt-6 border-t border-slate-100 pt-4 relative z-10 flex items-center justify-between">
                 <p className="text-xs font-bold text-slate-500">Reservas confirmadas e pagas.</p>
                 <span className="text-[10px] font-black bg-green-50 text-green-700 px-2 py-1 rounded">SUCESSO</span>
               </div>
            </div>

          </div>
        </section>
        

        {/* LISTAGEM DE PACOTES ATIVOS */}
        <section>
           <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-4">
             <div>
                <h2 className={`${jakarta.className} text-xl font-black text-slate-800`}>Nossos Pacotes Turísticos</h2>
                <p className="text-xs font-bold text-slate-500 mt-1">Gira os roteiros ativos e aceda às listas de embarque dos passageiros.</p>
             </div>
           </div>

           {pacotes.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-[2rem] p-12 text-center flex flex-col items-center shadow-sm">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Map size={32} className="text-slate-300" />
                 </div>
                 <h3 className={`${jakarta.className} text-xl font-black text-slate-800 mb-2`}>Nenhum pacote visível</h3>
                 <p className="text-slate-500 font-medium text-sm max-w-md mb-6">Comece a rentabilizar o turismo da cidade unindo os nossos parceiros num pacote espetacular.</p>
                 <Link href="/parceiros/dashboard-agencia/disponibilidade" className="bg-[#0085FF] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#0074e0] transition-colors shadow-lg">
                    Criar o Primeiro Pacote
                 </Link>
              </div>
           ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {pacotes.map(pacote => (
                    <div key={pacote.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                       <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                          <Image src={pacote.imagem_principal || IMG_FALLBACK} alt={pacote.titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur text-[#0085FF] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                             {pacote.ativo !== false ? 'Em Vendas' : 'Inativo'}
                          </div>
                       </div>
                       
                       <div className="p-6 flex-1 flex flex-col">
                          <h3 className={`${jakarta.className} text-lg font-black text-slate-900 leading-tight mb-2 line-clamp-2 text-left`}>
                             {pacote.titulo}
                          </h3>
                          
                          <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 w-fit">
                             <Calendar size={14} className="text-[#0085FF]"/>
                             <span className="text-xs font-bold text-slate-700 uppercase">
                                {pacote.dias} dias / {pacote.noites} noites
                             </span>
                          </div>

                          <p className="text-xs font-medium text-slate-400 text-left line-clamp-2 mb-5">
                             {pacote.descricao_curta || 'Sem descrição cadastrada.'}
                          </p>

                          <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between mb-5">
                             <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Unitário</p>
                                <p className={`${jakarta.className} text-2xl font-black text-[#0085FF]`}>{formatarMoeda(pacote.preco)}</p>
                             </div>
                             <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center"><Users size={12} className="text-blue-600"/></div>
                                <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center"><Users size={12} className="text-amber-600"/></div>
                                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-500">+</div>
                             </div>
                          </div>

                          <Link 
                            href={`/parceiros/dashboard-agencia/pacote/${pacote.id}`}
                            className="w-full bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                          >
                             Ver Relatório de Vendas <ArrowRight size={14} />
                          </Link>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </section>

      </div>
    </div>
  );
}