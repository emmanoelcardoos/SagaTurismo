'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, LogOut, Wallet, ShoppingBag, Users2, 
  Bed, Compass, ClipboardList, ShieldCheck, 
  ArrowUpRight, Home, Calendar, Search, Plus, Ticket,
  Map, CheckSquare, Square, Building, Landmark, UserCircle
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS DO DASHBOARD ──
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
  nome_item?: string; // Nome do pacote ou do passeio
  data_checkin: string;
  data_checkout?: string;
  quantidade_quartos?: number;
  quantidade_pessoas?: number;
  valor_total: number;
  valor_liquido: number;
  status: string;
  // Campos de Auditoria para Hotel
  checkin_realizado_em?: string | null;
  checkout_realizado_em?: string | null;
  // Campos de Repasse para Pacotes
  repasse_hotel?: number;
  repasse_guia?: number;
  taxa_prefeitura?: number;
};

export default function DashboardParceiroPage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string>('');
  const [tipoParceiro, setTipoParceiro] = useState<string>('hotel'); // 'hotel' | 'guia' | 'pacote'
  
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');

  // ── SEGURANÇA BÁSICA E LEITURA DO PERFIL ──
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");
    const tipo = localStorage.getItem("tipo_parceiro"); 

    if (!id) {
      router.push('/parceiros');
    } else {
      setParceiroId(id);
      setNomeNegocio(nome || 'Painel do Parceiro');
      setTipoParceiro(tipo || 'hotel');
    }
  }, [router]);

  // ── CONSUMO DA API ──
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
        if (Array.isArray(dataReservas)) {
          listaReservas = dataReservas;
        } else if (dataReservas && typeof dataReservas === 'object' && Array.isArray(dataReservas.reservas)) {
          listaReservas = dataReservas.reservas;
        } else if (dataReservas && typeof dataReservas === 'object' && Array.isArray(dataReservas.dados)) {
          listaReservas = dataReservas.dados;
        }

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

  // ── LÓGICA DE CHECK-IN / CHECK-OUT (HOTÉIS) ──
  const handleToggleCheckStatus = async (reservaId: string, tipo: 'checkin' | 'checkout') => {
    const agoraIso = new Date().toISOString();
    
    // Atualização otimista: apenas a reserva cujo ID bate com o clicado é atualizada
    setReservas(prev => prev.map(r => {
      if (r.id === reservaId) {
        const campo = tipo === 'checkin' ? 'checkin_realizado_em' : 'checkout_realizado_em';
        return { ...r, [campo]: r[campo] ? null : agoraIso };
      }
      return r; // As outras continuam intocadas
    }));

    // Disparo para o backend salvar a data na base de dados (Tabela Pedidos)
    try {
      await fetch(`https://sagaturismo-production.up.railway.app/api/v1/pedidos/${reservaId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: tipo, timestamp: agoraIso })
      });
    } catch (err) {
      console.error(`Falha ao sincronizar ${tipo}.`, err);
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

  const filteredReservas = reservas.filter((reserva) => {
    const termo = searchTerm.toLowerCase();
    return (
      reserva.nome_cliente?.toLowerCase().includes(termo) ||
      reserva.codigo_pedido?.toLowerCase().includes(termo) ||
      reserva.telefone_cliente?.toLowerCase().includes(termo) ||
      reserva.nome_item?.toLowerCase().includes(termo)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest">Sincronizando painel oficial...</p>
      </div>
    );
  }

  const percentagemChegadas = Math.min((metricas?.clientes_a_chegar || 0) * 10, 100); 
  const barrasFaturamento = [40, 60, 45, 80, 50, 90, 75]; 

  return (
    <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col text-left overflow-x-hidden`}>
      
      {/* ── HEADER EXECUTIVO ADAPTÁVEL ── */}
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
            {tipoParceiro === 'hotel' && (
              <Link href="/parceiros/dashboard/disponibilidade" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00577C] bg-[#F9C400] hover:bg-[#ffd633] px-3 md:px-5 py-2.5 rounded-full transition-all shadow-md active:scale-95">
                <Calendar size={14} /> <span>Calendário de Tarifas</span>
              </Link>
            )}
            {tipoParceiro === 'guia' && (
              <Link href="/parceiros/dashboard/disponibilidade" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-[#009640] hover:bg-[#007a33] px-3 md:px-5 py-2.5 rounded-full transition-all shadow-md active:scale-95">
                <Plus size={14} /> <span>Criar Novo Passeio</span>
              </Link>
            )}
            {tipoParceiro === 'pacote' && (
              <Link href="/parceiros/dashboard/disponibilidade" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-[#00577C] hover:bg-[#004a6b] px-3 md:px-5 py-2.5 rounded-full transition-all shadow-md active:scale-95">
                <Compass size={14} /> <span>Montar Roteiro</span>
              </Link>
            )}

            <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-black px-3 md:px-5 py-2.5 rounded-full transition-all shadow-md active:scale-95">
              <LogOut size={14} /> <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-10 py-8 md:py-12 flex-1 space-y-6 md:space-y-8">
        
        {/* ── CARDS DE MÉTRICAS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 p-5 md:p-8 shadow-sm flex flex-col justify-between group hover:border-[#00577C]/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2">Ganhos Líquidos</p>
                <p className={`${jakarta.className} text-3xl md:text-4xl font-black text-[#009640] tabular-nums leading-none`}>
                  {formatarMoeda(metricas?.faturamento || 0)}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-green-50 text-[#009640] flex items-center justify-center shrink-0">
                <Wallet size={20} className="md:w-6 md:h-6"/>
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-10 md:h-12 mt-auto opacity-70 group-hover:opacity-100 transition-opacity">
               {barrasFaturamento.map((h, i) => (
                 <div key={i} className={`w-full rounded-t-sm ${i === barrasFaturamento.length - 1 ? 'bg-[#009640]' : 'bg-slate-100'}`} style={{ height: `${h}%` }}></div>
               ))}
            </div>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-3 flex items-center gap-1"><ArrowUpRight size={12} className="text-[#009640]"/> Já livre das taxas</p>
          </div>

          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 p-5 md:p-8 shadow-sm flex flex-col justify-between group hover:border-[#00577C]/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2">Total de Vendas</p>
                <p className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#00577C] tabular-nums leading-none`}>
                  {(metricas?.total_vendas || 0).toString().padStart(2, '0')}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-50 text-[#00577C] flex items-center justify-center shrink-0">
                <ShoppingBag size={20} className="md:w-6 md:h-6"/>
              </div>
            </div>
            <div className="mt-auto bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100">
               <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-slate-500 mb-2">
                 <span>Performance</span>
                 <span className="text-[#00577C]">Alta</span>
               </div>
               <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-[#00577C] h-1.5 rounded-full w-[85%]"></div></div>
            </div>
          </div>

          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 p-5 md:p-8 shadow-sm flex flex-col justify-between group hover:border-[#F9C400]/50 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2">
                   {tipoParceiro === 'hotel' ? 'Check-ins Pendentes' : 'Turistas Pendentes'}
                </p>
                <p className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 tabular-nums leading-none`}>
                  {(metricas?.clientes_a_chegar || 0).toString().padStart(2, '0')}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-50 text-[#d9a000] flex items-center justify-center shrink-0">
                <Users2 size={20} className="md:w-6 md:h-6"/>
              </div>
            </div>
            <div className="mt-auto">
               <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-slate-500 mb-2">
                 <span>{tipoParceiro === 'hotel' ? 'Capacidade Ocupada' : 'Lotação Prenchida'}</span>
                 <span className="text-[#d9a000]">{percentagemChegadas}%</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-[#F9C400] h-2 rounded-full transition-all duration-1000" style={{ width: `${percentagemChegadas}%` }}></div>
               </div>
            </div>
          </div>
        </div>

        {/* ── LISTAGEM DE RESERVAS & PESQUISA ── */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          
          <div className="p-5 md:p-8 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-slate-50/50">
            <div className="flex items-center gap-3 md:gap-4">
               <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm shrink-0 border bg-white ${tipoParceiro === 'hotel' ? 'border-blue-100' : tipoParceiro === 'guia' ? 'border-green-100' : 'border-purple-100'}`}>
                 {tipoParceiro === 'hotel' ? <Bed className="text-[#00577C]" size={20}/> : tipoParceiro === 'guia' ? <Compass className="text-[#009640]" size={20}/> : <Map className="text-[#00577C]" size={20}/>}
               </div>
               <div>
                 <h2 className={`${jakarta.className} text-lg md:text-2xl font-black text-slate-900`}>
                    {tipoParceiro === 'hotel' ? 'Gestão de Hóspedes' : tipoParceiro === 'guia' ? 'Lista de Passageiros' : 'Gestão de Pacotes'}
                 </h2>
                 <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-0.5 md:mt-1">Registos oficiais e confirmados.</p>
               </div>
            </div>

            {reservas.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full xl:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-medium focus:outline-none focus:border-[#00577C] focus:ring-1 focus:ring-[#00577C] transition-all shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {reservas.length === 0 ? (
            <div className="py-24 md:py-32 px-5 text-center flex flex-col items-center justify-center bg-white">
               <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 md:mb-6">
                 <ClipboardList size={28} className="text-slate-300 md:w-8 md:h-8" />
               </div>
               <p className={`${jakarta.className} text-lg md:text-xl font-bold text-slate-800 mb-2`}>O seu painel está pronto</p>
               <p className="text-xs md:text-sm text-slate-500 max-w-md">Os dados aparecerão aqui automaticamente após novas vendas.</p>
            </div>
          ) : filteredReservas.length === 0 ? (
            <div className="py-20 md:py-24 px-5 text-center flex flex-col items-center justify-center bg-white">
               <p className={`${jakarta.className} text-base md:text-lg font-bold text-slate-800 mb-1`}>Nenhum resultado</p>
               <button onClick={() => setSearchTerm('')} className="mt-4 md:mt-6 text-xs md:text-sm font-bold text-[#00577C] hover:underline">Limpar pesquisa</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              
              {/* ── TABELA 1: EXCLUSIVA HOTÉIS ── */}
              {tipoParceiro === 'hotel' && (
                <table className="w-full text-xs md:text-sm text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="py-4 md:py-5 px-5 md:px-8">Localizador</th>
                      <th className="py-4 md:py-5 px-5 md:px-6">Hóspede Principal</th>
                      <th className="py-4 md:py-5 px-5 md:px-6">Acomodação</th>
                      <th className="py-4 md:py-5 px-5 md:px-6">Período</th>
                      <th className="py-4 md:py-5 px-5 md:px-6 text-center">Auditoria Diária</th>
                      <th className="py-4 md:py-5 px-5 md:px-8 text-right">Líquido a Receber</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-white">
                    {filteredReservas.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 md:py-5 px-5 md:px-8 font-mono text-[10px] md:text-xs text-[#00577C] uppercase">{r.codigo_pedido}</td>
                        <td className="py-4 md:py-5 px-5 md:px-6 text-slate-900 font-black">
                          {r.nome_cliente}
                          <span className="block text-[9px] md:text-[10px] text-slate-400 font-medium mt-0.5">{r.telefone_cliente || '-'}</span>
                        </td>
                        <td className="py-4 md:py-5 px-5 md:px-6">
                           <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] md:text-xs flex items-center gap-2 w-fit border border-slate-200">
                             <UserCircle size={14}/> {r.quantidade_pessoas || 1} Pessoas · {r.quantidade_quartos || 1} Quartos
                           </span>
                        </td>
                        <td className="py-4 md:py-5 px-5 md:px-6 tabular-nums text-[10px] md:text-xs">
                           <div className="flex flex-col gap-0.5">
                             <span className="text-slate-800 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#009640]"/> In: {formatarData(r.data_checkin)}</span>
                             <span className="text-slate-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"/> Out: {formatarData(r.data_checkout || '')}</span>
                           </div>
                        </td>
                        <td className="py-4 md:py-5 px-5 md:px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleToggleCheckStatus(r.id, 'checkin')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${r.checkin_realizado_em ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                               {r.checkin_realizado_em ? <CheckSquare size={14}/> : <Square size={14}/>} In
                            </button>
                            <button onClick={() => handleToggleCheckStatus(r.id, 'checkout')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${r.checkout_realizado_em ? 'bg-slate-800 text-white border border-slate-900' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                               {r.checkout_realizado_em ? <CheckSquare size={14}/> : <Square size={14}/>} Out
                            </button>
                          </div>
                        </td>
                        <td className="py-4 md:py-5 px-5 md:px-8 text-right">
                           <span className="text-[#009640] font-black tabular-nums bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg">
                             {formatarMoeda(r.valor_liquido)}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ── TABELA 2: EXCLUSIVA GUIAS ── */}
              {tipoParceiro === 'guia' && (
                <table className="w-full text-xs md:text-sm text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="py-4 md:py-5 px-5 md:px-8">Turista Principal</th>
                      <th className="py-4 md:py-5 px-5 md:px-6">Passeio / Pacote Onde Foste Alocado</th>
                      <th className="py-4 md:py-5 px-5 md:px-6 text-center">Data do Passeio</th>
                      <th className="py-4 md:py-5 px-5 md:px-6 text-center">Grupo a Acompanhar</th>
                      <th className="py-4 md:py-5 px-5 md:px-8 text-right">Seu Repasse Livre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-white">
                    {filteredReservas.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 md:py-5 px-5 md:px-8">
                          <p className="text-slate-900 font-black">{r.nome_cliente}</p>
                          <span className="block text-[9px] md:text-[10px] text-slate-400 font-medium mt-0.5">{r.telefone_cliente || 'S/ Contato'}</span>
                        </td>
                        <td className="py-4 md:py-5 px-5 md:px-6">
                           <div className="flex flex-col gap-0.5">
                             <span className="text-[#009640] font-black text-xs flex items-center gap-1.5"><Compass size={14}/> {r.nome_item || (r.tipo_item === 'pacote' ? 'Roteiro (Pacote)' : 'Passeio Avulso')}</span>
                             <span className="text-slate-400 text-[9px] uppercase tracking-widest font-mono">Ref: {r.codigo_pedido}</span>
                           </div>
                        </td>
                        <td className="py-4 md:py-5 px-5 md:px-6 text-center">
                           <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-black">
                             {formatarData(r.data_checkin)}
                           </span>
                        </td>
                        <td className="py-4 md:py-5 px-5 md:px-6 text-center">
                           <span className="text-[#d9a000] bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 w-fit mx-auto">
                             <Users2 size={14}/> {r.quantidade_pessoas || 1} Pessoas
                           </span>
                        </td>
                        <td className="py-4 md:py-5 px-5 md:px-8 text-right">
                           <span className="text-[#009640] font-black tabular-nums bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg">
                             {formatarMoeda(r.valor_liquido)}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ── TABELA 3: EXCLUSIVA AGÊNCIAS (CRIADORES DE PACOTES) ── */}
              {tipoParceiro === 'pacote' && (
                <table className="w-full text-xs md:text-sm text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="py-4 md:py-5 px-5 md:px-8">Pacote Vendido</th>
                      <th className="py-4 md:py-5 px-5 md:px-6">Cliente (Comprador)</th>
                      <th className="py-4 md:py-5 px-5 md:px-6 text-center">Validade do Roteiro</th>
                      <th className="py-4 md:py-5 px-5 md:px-6">Repasses a Pagar</th>
                      <th className="py-4 md:py-5 px-5 md:px-8 text-right">Teu Lucro (Agência)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-white">
                    {filteredReservas.map((r) => {
                      const repHotel = r.repasse_hotel || 0;
                      const repGuia = r.repasse_guia || 0;
                      const repPref = r.taxa_prefeitura || 0;

                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 md:py-5 px-5 md:px-8">
                            <p className="text-[#00577C] font-black text-xs md:text-sm">{r.nome_item || 'Combo Promocional'}</p>
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">Loc: {r.codigo_pedido}</p>
                          </td>
                          <td className="py-4 md:py-5 px-5 md:px-6">
                            <p className="text-slate-900">{r.nome_cliente}</p>
                            <span className="block text-[9px] md:text-[10px] text-slate-400 font-medium mt-0.5">{r.telefone_cliente || '-'}</span>
                          </td>
                          <td className="py-4 md:py-5 px-5 md:px-6 text-center">
                            <div className="flex flex-col text-[10px] md:text-xs text-slate-600 bg-slate-100 px-2 py-1.5 rounded-lg">
                              <span>In: {formatarData(r.data_checkin)}</span>
                              <span>Out: {formatarData(r.data_checkout || r.data_checkin)}</span>
                            </div>
                          </td>
                          <td className="py-4 md:py-5 px-5 md:px-6">
                            <div className="flex flex-col gap-1 text-[9px] md:text-[10px] uppercase tracking-widest font-black">
                               <span className="flex justify-between items-center text-blue-700">Hotel: <span className="tabular-nums">{formatarMoeda(repHotel)}</span></span>
                               <span className="flex justify-between items-center text-green-700">Guia: <span className="tabular-nums">{formatarMoeda(repGuia)}</span></span>
                               <span className="flex justify-between items-center text-amber-700">Taxa Mun.: <span className="tabular-nums">{formatarMoeda(repPref)}</span></span>
                            </div>
                          </td>
                          <td className="py-4 md:py-5 px-5 md:px-8 text-right">
                            <span className={`${jakarta.className} text-sm md:text-base text-[#009640] bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm`}>
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