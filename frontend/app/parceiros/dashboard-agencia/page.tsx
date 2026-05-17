'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, LogOut, Map, 
  TrendingUp, Users, Plus, Bed, Compass, 
  Calendar, ArrowRight
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type Pacote = {
  id: string;
  titulo: string;
  descricao: string;
  imagem_principal?: string;
  data_inicio: string;
  data_fim: string;
  preco: number;
  ativo?: boolean;
};

type MetricasAgencia = {
  total_vendido: number;
  repasse_hoteis: number;
  repasse_guias: number;
};

export default function DashboardAgenciaPage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<MetricasAgencia>({ total_vendido: 0, repasse_hoteis: 0, repasse_guias: 0 });
  const [pacotes, setPacotes] = useState<Pacote[]>([]);

  // 1. VALIDAÇÃO DE SESSÃO DA AGÊNCIA / SEMTUR
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

  // 2. CARREGAR PACOTES E CALCULAR MÉTRICAS (VERSÃO BLINDADA)
  useEffect(() => {
    if (!parceiroId) return;

    async function carregarDashboard() {
      try {
        // A) Buscar TODOS os pacotes (sem ordenar para evitar erros caso a coluna created_at não exista)
        const { data: dadosPacotes, error: errPacotes } = await supabase
          .from('pacotes')
          .select('*');

        if (errPacotes) {
          console.error("Aviso Supabase (Pacotes):", errPacotes);
        } else if (dadosPacotes) {
          setPacotes(dadosPacotes as Pacote[]);
        }

        // B) Buscar o histórico de vendas de forma crua, sem filtros estritos de base de dados
        const { data: dadosPedidos, error: errPedidos } = await supabase
          .from('pedidos')
          .select('valor_total, repasse_hotel, repasse_guia, tipo_item, status');

        if (errPedidos) {
          console.error("Aviso Supabase (Pedidos):", errPedidos);
        } else if (dadosPedidos) {
          
          // O Filtro Mágico: O JavaScript lida com maiúsculas, minúsculas e espaços invisíveis
          const totais = dadosPedidos
            .filter(pedido => 
               pedido.tipo_item?.toLowerCase().trim() === 'pacote' && 
               pedido.status?.toLowerCase().trim() === 'pago'
            )
            .reduce((acc, pedido) => ({
              total_vendido: acc.total_vendido + (Number(pedido.valor_total) || 0),
              repasse_hoteis: acc.repasse_hoteis + (Number(pedido.repasse_hotel) || 0),
              repasse_guias: acc.repasse_guias + (Number(pedido.repasse_guia) || 0),
            }), { total_vendido: 0, repasse_hoteis: 0, repasse_guias: 0 });

          setMetricas(totais);
        }

      } catch (error) {
        console.error("Erro interno no processamento do dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    
    carregarDashboard();
  }, [parceiroId]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/parceiros');
  };

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  
  const formatarDataLocal = (dataStr: string) => {
    if (!dataStr) return '-';
    const data = new Date(dataStr + 'T12:00:00');
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest text-slate-500">A Carregar Tesouraria...</p>
      </div>
    );
  }

  const IMG_FALLBACK = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1721";

  return (
    <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col`}>
      
      {/* ── HEADER DA AGÊNCIA ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="hidden sm:block relative h-10 w-32 border-r border-slate-200 pr-6">
              <Image src="/logop.png" alt="SGA" fill priority className="object-contain object-left" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-[#00577C] text-white p-2.5 rounded-xl shadow-lg">
                <Map size={20} />
              </div>
              <div>
                <h1 className={`${jakarta.className} font-black text-slate-900 text-lg md:text-xl leading-none`}>{nomeNegocio}</h1>
                <p className="text-[10px] font-black uppercase text-[#00577C] tracking-[0.2em] mt-0.5">Gestor de Combos Turísticos</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/parceiros/dashboard-agencia/disponibilidade" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-[#00577C] hover:bg-[#004a6b] px-5 py-2.5 rounded-full shadow-md transition-all active:scale-95">
              <Plus size={14} /> <span className="hidden sm:inline">Criar Pacote</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center justify-center w-10 h-10 md:w-auto md:px-5 md:py-2.5 rounded-full text-slate-500 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm transition-all">
              <LogOut size={16} className="md:mr-2" /> <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-10 py-8 flex-1 space-y-10">
        
        {/* ── PAINEL FINANCEIRO DE DISTRIBUIÇÃO (SPLIT) ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
             <h2 className={`${jakarta.className} text-xl font-black text-slate-800`}>Balanço de Distribuição</h2>
             <span className="bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Tempo Real</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-md flex flex-col justify-between group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#00577C]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#00577C]"/> Total Faturado
                  </p>
                  <p className={`${jakarta.className} text-4xl font-black text-slate-900`}>{formatarMoeda(metricas.total_vendido)}</p>
               </div>
               <div className="mt-6 border-t border-slate-100 pt-4 relative z-10">
                 <p className="text-xs font-bold text-slate-500">Volume Bruto captado pela Agência.</p>
               </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-md flex flex-col justify-between group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Bed size={14} className="text-amber-500"/> Repassado a Hotéis
                  </p>
                  <p className={`${jakarta.className} text-4xl font-black text-amber-500`}>{formatarMoeda(metricas.repasse_hoteis)}</p>
               </div>
               <div className="mt-6 border-t border-slate-100 pt-4 relative z-10 flex items-center justify-between">
                 <p className="text-xs font-bold text-slate-500">Custos de alojamento pagos.</p>
                 <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded">HOSPEDAGEM</span>
               </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-md flex flex-col justify-between group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#009640]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Compass size={14} className="text-[#009640]"/> Repassado a Guias
                  </p>
                  <p className={`${jakarta.className} text-4xl font-black text-[#009640]`}>{formatarMoeda(metricas.repasse_guias)}</p>
               </div>
               <div className="mt-6 border-t border-slate-100 pt-4 relative z-10 flex items-center justify-between">
                 <p className="text-xs font-bold text-slate-500">Custos de expedições pagos.</p>
                 <span className="text-[10px] font-black bg-green-50 text-green-700 px-2 py-1 rounded">SERVIÇO LOGÍSTICO</span>
               </div>
            </div>

          </div>
        </section>

        {/* ── LISTAGEM DE PACOTES ATIVOS (VITRINE) ── */}
        <section>
           <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-4">
             <div>
                <h2 className={`${jakarta.className} text-xl font-black text-slate-800`}>Nossos Pacotes Turísticos</h2>
                <p className="text-xs font-bold text-slate-500 mt-1">Gira os roteiros ativos e aceda às listas de embarque dos passageiros.</p>
             </div>
           </div>

           {pacotes.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center flex flex-col items-center">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Map size={32} className="text-slate-300" />
                 </div>
                 <h3 className={`${jakarta.className} text-xl font-black text-slate-800 mb-2`}>Nenhum pacote visível</h3>
                 <p className="text-slate-500 font-medium text-sm max-w-md mb-6">Comece a rentabilizar o turismo da cidade unindo os nossos parceiros num pacote espetacular.</p>
                 <Link href="/parceiros/dashboard-agencia/disponibilidade" className="bg-[#00577C] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#004a6b] transition-colors shadow-lg">
                    Criar o Primeiro Pacote
                 </Link>
              </div>
           ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {pacotes.map(pacote => (
                    <div key={pacote.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                       <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                          <Image src={pacote.imagem_principal || IMG_FALLBACK} alt={pacote.titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          {/* Verifica de forma segura se a coluna 'ativo' existe ou não */}
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur text-[#00577C] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                             {pacote.ativo !== false ? 'Em Vendas' : 'Em Análise'}
                          </div>
                       </div>
                       
                       <div className="p-6 flex-1 flex flex-col">
                          <h3 className={`${jakarta.className} text-lg font-black text-slate-900 leading-tight mb-2 line-clamp-2`}>
                             {pacote.titulo}
                          </h3>
                          
                          <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 w-fit">
                             <Calendar size={14} className="text-[#00577C]"/>
                             <span className="text-xs font-bold text-slate-700 uppercase">
                                {formatarDataLocal(pacote.data_inicio)} <span className="text-slate-300 mx-1">até</span> {formatarDataLocal(pacote.data_fim)}
                             </span>
                          </div>

                          <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between mb-5">
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Unitário</p>
                                <p className={`${jakarta.className} text-2xl font-black text-[#00577C]`}>{formatarMoeda(pacote.preco)}</p>
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