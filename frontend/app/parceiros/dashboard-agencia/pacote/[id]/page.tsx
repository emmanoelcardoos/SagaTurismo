'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, Search, MessageCircle, Calendar, 
  Users, DollarSign, CreditCard, TrendingUp, LogOut, Home, ClipboardList
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type PacoteMetadata = {
  id: string;
  titulo: string;
  categoria: string;
  preco: number;
  dias: number;
  noites: number;
};

type CompradorItem = {
  codigo_pedido: string;
  nome_cliente: string;
  telefone_cliente: string;
  valor_total: number;
  metodo_pagamento: string;
  quantidade_pessoas: number;
  quantidade: number;
  data_checkin: string;
  status_pagamento: string;
};

export default function RelatorioPacotePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [pacote, setPacote] = useState<PacoteMetadata | null>(null);
  const [compradores, setCompradores] = useState<CompradorItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. VALIDAÇÃO DE SESSÃO DA AGÊNCIA
  useEffect(() => {
    const parceiroId = localStorage.getItem("parceiro_id");
    const tipo = localStorage.getItem("tipo_parceiro"); 
    if (!parceiroId || (tipo !== 'agencia' && tipo !== 'semtur' && tipo !== 'pacote')) {
      router.push('/parceiros');
    }
  }, [router]);

  // 2. CARREGAMENTO DOS DADOS COM BASE NO ESQUEMA REAL
  useEffect(() => {
    if (!id) return;

    async function obterManifesto() {
      try {
        // [A] Puxa metadados do pacote específico
        const { data: dadosPacote } = await supabase
          .from('pacotes')
          .select('id, titulo, categoria, preco, dias, noites')
          .eq('id', id)
          .single();

        if (dadosPacote) {
          setPacote(dadosPacote as PacoteMetadata);
        }

        // [B] Busca todos os pedidos associados a este pacote de modo estrito
        const { data: dadosPedidos, error: errPedidos } = await supabase
          .from('pedidos')
          .select('codigo_pedido, nome_cliente, telefone_cliente, valor_total, metodo_pagamento, quantidade_pessoas, quantidade, data_checkin, status_pagamento')
          .eq('item_id', id)
          .eq('tipo_item', 'pacote');

        if (!errPedidos && dadosPedidos) {
          // Filtra no frontend apenas os que estão confirmados/pagos de forma higienizada
          const pagos = dadosPedidos.filter(p => p.status_pagamento?.toLowerCase().trim() === 'pago');
          setCompradores(pagos as CompradorItem[]);
        }

      } catch (error) {
        console.error("Falha ao gerar manifesto:", error);
      } finally {
        setLoading(false);
      }
    }

    obterManifesto();
  }, [id]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/parceiros');
  };

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  
  const formatarData = (dataStr: string) => {
    if (!dataStr) return '-';
    const parts = dataStr.split('-');
    if (parts.length !== 3) return dataStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const gerarLinkWhatsApp = (telefone?: string) => {
    if (!telefone) return '#';
    let numeros = telefone.replace(/\D/g, ''); 
    if (numeros.length < 10) return '#';
    if (!numeros.startsWith('55')) numeros = `55${numeros}`; 
    return `https://wa.me/${numeros}`;
  };

  // Filtro de pesquisa dinâmica por nome de turista ou localizador de pedido
  const compradoresFiltrados = compradores.filter(c => {
    const termo = searchTerm.toLowerCase();
    return c.nome_cliente?.toLowerCase().includes(termo) || c.codigo_pedido?.toLowerCase().includes(termo);
  });

  // Métricas do Pacote Específico
  const totalFaturadoPacote = compradores.reduce((acc, c) => acc + (Number(c.valor_total) || 0), 0);
  const totalPassageirosPacote = compradores.reduce((acc, c) => acc + (Number(c.quantidade_pessoas || c.quantidade) || 1), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-[#0085FF]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest text-slate-500">Compilando Manifesto de Passageiros...</p>
      </div>
    );
  }

  return (
    <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col`}>
      
      {/* HEADER EXECUTIVO CORPORATIVO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <Link href="/" className="relative h-10 w-28 md:w-36 shrink-0 transition-transform active:scale-95">
            <Image src="/logop.png" alt="SagaTurismo" fill priority className="object-contain object-left" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/parceiros/dashboard-agencia" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-full shadow-sm">
              <ArrowLeft size={14} /> <span>Painel Agência</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-black px-4 py-2.5 rounded-full shadow-sm transition-colors">
              <LogOut size={14} /> <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-10 py-8 flex-1 space-y-8">
        
        {/* TÍTULO E DETALHES DO PACOTE ATIVO */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
           <div>
              <div className="flex items-center gap-2 mb-2">
                 <span className="bg-blue-50 text-[#0085FF] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-blue-100">
                    {pacote?.categoria || 'Combo Oficial'}
                 </span>
                 <span className="text-xs text-slate-400 font-bold">
                    {pacote?.dias} dias / {pacote?.noites} noites
                 </span>
              </div>
              <h2 className={`${jakarta.className} text-2xl font-black text-slate-900 tracking-tight`}>
                 {pacote?.titulo || 'Manifesto de Embarque'}
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                 Listagem nominal de todos os passageiros integrados com compras validadas.
              </p>
           </div>
           
           <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Base do Lote</p>
              <p className={`${jakarta.className} text-xl font-black text-[#0085FF] mt-0.5`}>{formatarMoeda(pacote?.preco || 0)}</p>
           </div>
        </div>

        {/* METRICAS DO CONJUNTO DE VENDAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex items-center justify-between group">
             <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faturamento Direto do Combo</p>
                <p className={`${jakarta.className} text-3xl font-black text-[#0085FF]`}>{formatarMoeda(totalFaturadoPacote)}</p>
             </div>
             <div className="w-12 h-12 bg-blue-50 text-[#0085FF] rounded-2xl flex items-center justify-center shadow-inner shrink-0"><TrendingUp size={20}/></div>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex items-center justify-between group">
             <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Turistas Embarcados no Lote</p>
                <p className={`${jakarta.className} text-3xl font-black text-slate-800`}>{totalPassageirosPacote.toString().padStart(2, '0')}</p>
             </div>
             <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center shadow-inner shrink-0"><Users size={20}/></div>
          </div>
        </div>

        {/* MANIFESTO / GRID COM LISTA DE HOSPEDES */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          
          {/* BARRA DE PESQUISA INTERATIVA */}
          <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-5 bg-slate-50/50">
             <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                   <ClipboardList className="text-[#0085FF]" size={20} />
                </div>
                <div>
                   <h3 className={`${jakarta.className} text-lg font-black text-slate-900`}>Lista de Passageiros & Voucher</h3>
                   <p className="text-xs font-bold text-slate-400 mt-0.5">Auditoria nominal para conferência física antes das saídas.</p>
                </div>
             </div>
             
             <div className="relative w-full sm:w-80 shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Procurar hóspede ou localizador..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#0085FF] shadow-sm" 
                />
             </div>
          </div>

          {/* TABELA DE PASSAGEIROS */}
          {compradoresFiltrados.length === 0 ? (
            <div className="py-20 px-5 text-center flex flex-col items-center justify-center bg-white">
               <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Users size={24} className="text-slate-300" />
               </div>
               <p className={`${jakarta.className} text-lg font-bold text-slate-700 mb-1`}>Nenhum passageiro localizado</p>
               <p className="text-xs text-slate-400 max-w-sm">Certifique-se de que existem reservas com estado de pagamento 'pago' vinculadas a este combo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="py-5 px-6">Localizador</th>
                    <th className="py-5 px-6">Nome do Hóspede Principal</th>
                    <th className="py-5 px-6 text-center">Data Agendada</th>
                    <th className="py-5 px-6 text-center">Tamanho do Grupo</th>
                    <th className="py-5 px-6 text-center">Método</th>
                    <th className="py-5 px-6 text-right">Total Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-white">
                  {compradoresFiltrados.map((comp) => {
                     const linkZap = gerarLinkWhatsApp(comp.telefone_cliente);
                     const totalGrupo = comp.quantidade_pessoas || comp.quantidade || 1;
                     
                     return (
                       <tr key={comp.codigo_pedido} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-5 px-6 font-mono text-xs text-slate-400 uppercase tracking-wider">
                             {comp.codigo_pedido}
                          </td>
                          
                          {/* DADOS DO CLIENTE COM SUPORTE WHATSAPP INTERIOR */}
                          <td className="py-5 px-6">
                             <p className="text-slate-900 font-black text-sm">{comp.nome_cliente}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] text-slate-400 font-medium">{comp.telefone_cliente || 'Sem telefone'}</p>
                                {linkZap !== '#' && (
                                   <a 
                                     href={linkZap} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="bg-[#25D366] text-white p-1 rounded-md hover:bg-[#1ebd53] transition-all shadow-sm flex items-center gap-1 px-2 text-[9px] font-black uppercase"
                                   >
                                      <MessageCircle size={10} /> Chamar no Zap
                                   </a>
                                )}
                             </div>
                          </td>

                          {/* DIA DO AGENDAMENTO CHECK-IN */}
                          <td className="py-5 px-6 text-center text-xs">
                             <div className="flex items-center justify-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-lg w-fit mx-auto text-slate-600">
                                <Calendar size={13} className="text-slate-400" />
                                <span>{formatarData(comp.data_checkin)}</span>
                             </div>
                          </td>

                          {/* QUANTIDADE DE PESSOAS NA COMITIVA */}
                          <td className="py-5 px-6 text-center">
                             <span className="bg-blue-50/50 text-[#0085FF] border border-blue-100 px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1">
                                <Users size={13} />
                                <span>{totalGrupo} {totalGrupo === 1 ? 'Pessoa' : 'Pessoas'}</span>
                             </span>
                          </td>

                          {/* MÉTODO DE PAGAMENTO (PIX / CARTÃO) */}
                          <td className="py-5 px-6 text-center">
                             <div className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1 uppercase">
                                <CreditCard size={13} className="text-slate-300" />
                                <span>{comp.metodo_pagamento || 'PIX'}</span>
                             </div>
                          </td>

                          {/* VALOR BRUTO ARRECADADO */}
                          <td className="py-5 px-6 text-right">
                             <span className={`${jakarta.className} text-sm font-black text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 inline-block tabular-nums`}>
                                {formatarMoeda(comp.valor_total)}
                             </span>
                          </td>
                       </tr>
                     );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}