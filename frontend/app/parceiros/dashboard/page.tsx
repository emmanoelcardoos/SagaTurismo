'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, LogOut, Wallet, ShoppingBag, Users2, 
  Bed, Compass, ClipboardList, ShieldCheck, 
  ArrowUpRight, Home, Calendar, Search, Map, 
  CheckSquare, Square, Building, Landmark, UserCircle
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS EMPRESARIAIS AVANÇADAS ──
type Metricas = {
  faturamento: number;
  total_vendas: number;
  clientes_a_chegar: number;
};

type Reserva = {
  id: string;
  codigo_pedido: string;
  nome_cliente: string;
  telefone_cliente?: string;
  tipo_item: 'hotel' | 'passeio' | 'pacote';
  nome_item?: string; // Nome do pacote ou do passeio vendido
  data_checkin: string; // Para guias, isto representa a data do passeio
  data_checkout?: string;
  quantidade_quartos?: number;
  quantidade_pessoas?: number;
  valor_total: number;
  valor_liquido: number;
  status: string;
  
  // Controle de Auditoria (Exclusivo Hotéis)
  checkin_realizado_em?: string | null;
  checkout_realizado_em?: string | null;

  // Split Financeiro (Exclusivo Pacotes/Agências)
  repasse_hotel?: number;
  repasse_guia?: number;
  taxa_prefeitura?: number;
};

export default function DashboardParceiroPage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string>('');
  const [tipoParceiro, setTipoParceiro] = useState<'hotel' | 'guia' | 'pacote'>('hotel');
  
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // ── 1. SEGURANÇA E LEITURA DE PERFIL ──
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");
    const tipo = localStorage.getItem("tipo_parceiro") as 'hotel' | 'guia' | 'pacote';

    if (!id) {
      router.push('/parceiros');
    } else {
      setParceiroId(id);
      setNomeNegocio(nome || 'Painel do Parceiro');
      setTipoParceiro(tipo || 'hotel');
    }
  }, [router]);

  // ── 2. CONSUMO DA API ──
  useEffect(() => {
    if (!parceiroId) return;

    async function carregarDadosDashboard() {
      try {
        const [resMetricas, resReservas] = await Promise.all([
          fetch(`https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/dashboard`),
          fetch(`https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/reservas`)
        ]);

        const dataMetricas = await resMetricas.json();
        const dataReservas = await resReservas.json();

        let listaReservas: Reserva[] = [];
        if (Array.isArray(dataReservas)) listaReservas = dataReservas;
        else if (dataReservas?.reservas) listaReservas = dataReservas.reservas;
        else if (dataReservas?.dados) listaReservas = dataReservas.dados;

        setReservas(listaReservas);

        const faturamentoLiquidoCalculado = listaReservas.reduce((acc, r) => acc + (Number(r.valor_liquido) || 0), 0);
        const totalVendasCalculadas = listaReservas.length;
        
        setMetricas({
          faturamento: dataMetricas?.metricas?.faturamento_total ?? faturamentoLiquidoCalculado,
          total_vendas: dataMetricas?.metricas?.total_vendas ?? totalVendasCalculadas,
          clientes_a_chegar: dataMetricas?.metricas?.clientes_a_chegar ?? totalVendasCalculadas, 
        });

      } catch (error) {
        console.error("Erro API:", error);
        setReservas([]);
      } finally {
        setLoading(false);
      }
    }
    carregarDadosDashboard();
  }, [parceiroId]);

  // ── 3. OPERAÇÕES DE AUDITORIA DE FRONTEND (HOTÉIS: CHECK-IN / CHECK-OUT) ──
  const handleToggleCheckStatus = async (reservaId: string, tipo: 'checkin' | 'checkout') => {
    const agoraIso = new Date().toISOString();
    
    // Atualização otimista na interface
    setReservas(prev => prev.map(r => {
      if (r.id === reservaId) {
        const campo = tipo === 'checkin' ? 'checkin_realizado_em' : 'checkout_realizado_em';
        const novoValor = r[campo] ? null : agoraIso;
        return { ...r, [campo]: novoValor };
      }
      return r;
    }));

    // Disparo silencioso para a Supabase
    try {
      await fetch(`https://sagaturismo-production.up.railway.app/api/v1/pedidos/${reservaId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: tipo, timestamp: agoraIso })
      });
    } catch (err) {
      console.error(`Falha ao sincronizar ${tipo} na base de dados.`, err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/parceiros');
  };

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  const formatarData = (dataStr: string) => {
    if (!dataStr) return '-';
    const parts = dataStr.split('-');
    if (parts.length !== 3) return dataStr;
    const [ano, mes, dia] = parts;
    return `${dia}/${mes}/${ano}`;
  };

  const filteredReservas = reservas.filter((r) => {
    const termo = searchTerm.toLowerCase();
    return (
      r.nome_cliente?.toLowerCase().includes(termo) ||
      r.codigo_pedido?.toLowerCase().includes(termo) ||
      r.nome_item?.toLowerCase().includes(termo)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest">A carregar o seu ambiente de trabalho...</p>
      </div>
    );
  }

  const percentagemChegadas = Math.min((metricas?.clientes_a_chegar || 0) * 10, 100); 
  const barrasFaturamento = [40, 60, 45, 80, 50, 90, 75]; 

  return (
    <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col text-left overflow-x-hidden`}>
      
      {/* ── HEADER EXECUTIVO ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="hidden sm:block relative h-10 w-32 border-r border-slate-200 pr-6">
              <Image src="/logop.png" alt="SGA" fill priority className="object-contain object-left" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-[#00577C] to-[#003d57] text-white p-2 md:p-2.5 rounded-xl shadow-lg">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h1 className={`${jakarta.className} font-black text-slate-900 text-base md:text-xl leading-none tracking-tight truncate max-w-[150px] sm:max-w-[200px]`}>{nomeNegocio}</h1>
                <p className="text-[9px] md:text-[10px] font-black uppercase text-[#009640] tracking-[0.2em] mt-1">
                  Portal {tipoParceiro === 'hotel' ? 'Hoteleiro' : tipoParceiro === 'guia' ? 'de Guias' : 'de Agências'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Link href="/parceiros/dashboard/disponibilidade" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00577C] bg-[#F9C400] hover:bg-[#ffd633] px-3 md:px-5 py-2.5 rounded-full transition-all shadow-md active:scale-95">
              <Calendar size={14} /> <span className="hidden sm:inline">Gerir Serviços</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-black px-3 md:px-5 py-2.5 rounded-full transition-all shadow-md active:scale-95">
              <LogOut size={14} /> <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-10 py-8 md:py-12 flex-1 space-y-6 md:space-y-8">
        
        {/* ── CARDS DE MÉTRICAS (Dinâmicos por Perfil) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 p-5 md:p-8 shadow-sm flex flex-col justify-between group hover:border-[#00577C]/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2">Receita Operacional</p>
                <p className={`${jakarta.className} text-3xl md:text-4xl font-black text-[#009640] tabular-nums leading-none`}>{formatarMoeda(metricas?.faturamento || 0)}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-green-50 text-[#009640] flex items-center justify-center shrink-0"><Wallet size={20} className="md:w-6 md:h-6"/></div>
            </div>
            <div className="flex items-end gap-1.5 h-10 md:h-12 mt-auto opacity-70 group-hover:opacity-100 transition-opacity">
               {barrasFaturamento.map((h, i) => (<div key={i} className={`w-full rounded-t-sm ${i === barrasFaturamento.length - 1 ? 'bg-[#009640]' : 'bg-slate-100'}`} style={{ height: `${h}%` }}></div>))}
            </div>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-3 flex items-center gap-1"><ArrowUpRight size={12} className="text-[#009640]"/> Livre de Taxas Governamentais</p>
          </div>

          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 p-5 md:p-8 shadow-sm flex flex-col justify-between group hover:border-[#00577C]/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2">
                  {tipoParceiro === 'hotel' ? 'Reservas Efetivadas' : tipoParceiro === 'guia' ? 'Passeios Vendidos' : 'Pacotes Vendidos'}
                </p>
                <p className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#00577C] tabular-nums leading-none`}>{(metricas?.total_vendas || 0).toString().padStart(2, '0')}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-50 text-[#00577C] flex items-center justify-center shrink-0"><ShoppingBag size={20} className="md:w-6 md:h-6"/></div>
            </div>
            <div className="mt-auto bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100">
               <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-slate-500 mb-2"><span>Performance</span><span className="text-[#00577C]">Alta</span></div>
               <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-[#00577C] h-1.5 rounded-full w-[85%]"></div></div>
            </div>
          </div>

          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 p-5 md:p-8 shadow-sm flex flex-col justify-between group hover:border-[#F9C400]/50 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2">
                  {tipoParceiro === 'hotel' ? 'Check-ins Previstos' : 'Turistas a Chegar'}
                </p>
                <p className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 tabular-nums leading-none`}>{(metricas?.clientes_a_chegar || 0).toString().padStart(2, '0')}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-50 text-[#d9a000] flex items-center justify-center shrink-0"><Users2 size={20} className="md:w-6 md:h-6"/></div>
            </div>
            <div className="mt-auto">
               <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-slate-500 mb-2"><span>Capacidade do Período</span><span className="text-[#d9a000]">{percentagemChegadas}%</span></div>
               <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-[#F9C400] h-2 rounded-full transition-all" style={{ width: `${percentagemChegadas}%` }}></div></div>
            </div>
          </div>
        </div>

        {/* ── CENTRAL DE OPERAÇÕES ── */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          
          {/* HEADER DA TABELA */}
          <div className="p-5 md:p-8 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-slate-50/50">
            <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border ${tipoParceiro === 'hotel' ? 'bg-blue-50 border-blue-100 text-[#00577C]' : tipoParceiro === 'guia' ? 'bg-green-50 border-green-100 text-[#009640]' : 'bg-purple-50 border-purple-100 text-purple-700'}`}>
                 {tipoParceiro === 'hotel' ? <Bed size={24} /> : tipoParceiro === 'guia' ? <Compass size={24} /> : <Map size={24} />}
               </div>
               <div>
                 <h2 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900`}>
                   {tipoParceiro === 'hotel' ? 'Auditoria de Hóspedes' : tipoParceiro === 'guia' ? 'Lista de Passageiros' : 'Gestão de Vendas (Pacotes)'}
                 </h2>
                 <p className="text-xs font-bold text-slate-400 mt-1">
                   {tipoParceiro === 'hotel' ? 'Faça o check-in/out dos hóspedes diretamente aqui.' : 'Acompanhe os turistas que compraram os seus roteiros.'}
                 </p>
               </div>
            </div>

            {reservas.length > 0 && (
              <div className="relative w-full xl:w-80 shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" placeholder="Turista, Localizador ou Serviço..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#00577C] focus:ring-1 focus:ring-[#00577C] shadow-sm"
                />
              </div>
            )}
          </div>

          {reservas.length === 0 || filteredReservas.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center bg-white">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><ClipboardList size={28} className="text-slate-300" /></div>
               <p className={`${jakarta.className} text-lg font-bold text-slate-800 mb-2`}>Nenhum registo de venda encontrado</p>
               <p className="text-sm text-slate-500 max-w-md">As compras finalizadas pelos turistas aparecerão aqui para a sua gestão.</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              
              {/* ── TABELA 1: EXCLUSIVA PARA HOTÉIS ── */}
              {tipoParceiro === 'hotel' && (
                <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="py-5 px-6">ID Localizador</th>
                      <th className="py-5 px-6">Hóspede Principal</th>
                      <th className="py-5 px-6">Acomodação Ocupada</th>
                      <th className="py-5 px-6">Período Reservado</th>
                      <th className="py-5 px-6 text-center">Auditoria Diária</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-white">
                    {filteredReservas.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-5 px-6 font-mono text-xs text-[#00577C] uppercase">{r.codigo_pedido}</td>
                        <td className="py-5 px-6">
                          <p className="text-slate-900 font-black">{r.nome_cliente}</p>
                          <p className="text-[10px] text-slate-400">{r.telefone_cliente || 'S/ Contato'}</p>
                        </td>
                        <td className="py-5 px-6">
                           <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 w-fit border border-slate-200 shadow-sm">
                             <UserCircle size={16} className="text-[#00577C]"/> {r.quantidade_pessoas ?? 0} Hóspede(s) · {r.quantidade_quartos ?? 0} Quarto(s)
                           </span>
                        </td>
                        <td className="py-5 px-6">
                           <div className="flex flex-col gap-1.5 text-xs">
                             <span className="text-[#009640] flex items-center gap-1.5"><ArrowUpRight size={14}/> In: {formatarData(r.data_checkin)}</span>
                             <span className="text-slate-500 flex items-center gap-1.5"><LogOut size={14}/> Out: {formatarData(r.data_checkout || '')}</span>
                           </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => handleToggleCheckStatus(r.id, 'checkin')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${r.checkin_realizado_em ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                               {r.checkin_realizado_em ? <CheckSquare size={16}/> : <Square size={16}/>} Check-In
                            </button>
                            <button onClick={() => handleToggleCheckStatus(r.id, 'checkout')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${r.checkout_realizado_em ? 'bg-slate-800 text-white border border-slate-900' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                               {r.checkout_realizado_em ? <CheckSquare size={16}/> : <Square size={16}/>} Check-Out
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ── TABELA 2: EXCLUSIVA PARA GUIAS DE TURISMO ── */}
              {tipoParceiro === 'guia' && (
                <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="py-5 px-6">Nome do Serviço (Passeio/Pacote)</th>
                      <th className="py-5 px-6">Turista Pagante</th>
                      <th className="py-5 px-6 text-center">Data Agendada</th>
                      <th className="py-5 px-6 text-center">Comitiva</th>
                      <th className="py-5 px-6 text-right">Teu Repasse (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-white">
                    {filteredReservas.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-5 px-6">
                           <div className="flex flex-col gap-1 text-left">
                             <p className="text-[#009640] font-black text-sm flex items-center gap-2">
                               {r.tipo_item === 'pacote' ? <Map size={16}/> : <Compass size={16}/>}
                               {r.nome_item || (r.tipo_item === 'pacote' ? 'Roteiro Pacote Fechado' : 'Passeio Individual')}
                             </p>
                             <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Loc: {r.codigo_pedido}</p>
                           </div>
                        </td>
                        <td className="py-5 px-6">
                          <p className="text-slate-900 font-black">{r.nome_cliente}</p>
                          <p className="text-[10px] text-slate-400">{r.telefone_cliente || 'S/ Contato'}</p>
                        </td>
                        <td className="py-5 px-6 text-center">
                           <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-black">
                             {formatarData(r.data_checkin)}
                           </span>
                        </td>
                        <td className="py-5 px-6 text-center">
                           <span className="text-[#d9a000] bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5 shadow-sm">
                             <Users2 size={16}/> {r.quantidade_pessoas ?? 0} Pessoas
                           </span>
                        </td>
                        <td className="py-5 px-6 text-right">
                           <p className={`${jakarta.className} text-xl text-slate-900`}>{formatarMoeda(r.valor_liquido)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ── TABELA 3: EXCLUSIVA PARA AGÊNCIAS (PACOTES) ── */}
              {tipoParceiro === 'pacote' && (
                <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="py-5 px-6">Pacote Turístico Vendido</th>
                      <th className="py-5 px-6">Hóspede Principal</th>
                      <th className="py-5 px-6 text-center">Validade do Roteiro</th>
                      <th className="py-5 px-6">Repasses & Custos Base</th>
                      <th className="py-5 px-6 text-right">Lucro Limpo da Agência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-white">
                    {filteredReservas.map((r) => {
                      // Fallback de exibição financeira na falta de dados do backend
                      const repHotel = r.repasse_hotel || (r.valor_total * 0.4);
                      const repGuia = r.repasse_guia || (r.valor_total * 0.15);
                      const repPref = r.taxa_prefeitura || (r.valor_total * 0.05);

                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-5 px-6">
                            <p className="text-[#00577C] font-black text-sm">{r.nome_item || 'Combo Promocional'}</p>
                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">Ref: {r.codigo_pedido}</p>
                          </td>
                          <td className="py-5 px-6">
                            <p className="text-slate-900 font-black">{r.nome_cliente}</p>
                            <p className="text-[10px] text-slate-400">{r.telefone_cliente || 'S/ Contato'}</p>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <div className="flex items-center justify-center gap-2 text-xs font-black bg-slate-100 px-3 py-1.5 rounded-lg w-fit mx-auto border border-slate-200">
                              <span>{formatarData(r.data_checkin)}</span>
                              <span className="text-slate-400 text-[10px]">a</span>
                              <span>{formatarData(r.data_checkout || r.data_checkin)}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex flex-col gap-1.5 text-[9px] uppercase tracking-widest font-black">
                               <span className="flex justify-between items-center bg-blue-50/50 px-2.5 py-1.5 rounded-md border border-blue-100 text-[#00577C] w-48 shadow-sm">
                                 <Building size={12}/> Hotel: <span className="tabular-nums">{formatarMoeda(repHotel)}</span>
                               </span>
                               <span className="flex justify-between items-center bg-green-50/50 px-2.5 py-1.5 rounded-md border border-green-100 text-[#009640] w-48 shadow-sm">
                                 <Compass size={12}/> Guia: <span className="tabular-nums">{formatarMoeda(repGuia)}</span>
                               </span>
                               <span className="flex justify-between items-center bg-amber-50/50 px-2.5 py-1.5 rounded-md border border-amber-100 text-amber-700 w-48 shadow-sm">
                                 <Landmark size={12}/> T. Mun.: <span className="tabular-nums">{formatarMoeda(repPref)}</span>
                               </span>
                            </div>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <span className={`${jakarta.className} text-xl text-[#009640] bg-green-50 px-4 py-2 rounded-xl border-2 border-green-200 shadow-sm`}>
                              {formatarMoeda(r.valor_liquido)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}