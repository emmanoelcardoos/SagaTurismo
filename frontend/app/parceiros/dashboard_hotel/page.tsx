'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, LogOut, Wallet, ShoppingBag, Users2, 
  Bed, ClipboardList, ShieldCheck, 
  ArrowUpRight, Calendar, Search, 
  CheckSquare, Square, UserCircle
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS EXCLUSIVAS DE HOTEL ──
type Metricas = { faturamento: number; total_vendas: number; clientes_a_chegar: number; };

type ReservaHotel = {
  id: string;
  codigo_pedido: string;
  nome_cliente: string;
  telefone_cliente?: string;
  tipo_item: string;
  data_checkin: string;
  data_checkout?: string;
  // A API deve enviar estes dados, caso contrário ficarão vazios (undefined)
  quantidade_quartos?: number;
  quantidade_pessoas?: number;
  valor_total: number;
  valor_liquido: number;
  status: string;
  // Auditoria
  checkin_realizado_em?: string | null;
  checkout_realizado_em?: string | null;
};

export default function DashboardHotelPage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [reservas, setReservas] = useState<ReservaHotel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. SEGURANÇA E LEITURA (Garante que é um Hotel)
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");
    const tipo = localStorage.getItem("tipo_parceiro"); 

    if (!id || tipo !== 'hotel') {
      router.push('/parceiros');
    } else {
      setParceiroId(id);
      setNomeNegocio(nome || 'Painel do Hoteleiro');
    }
  }, [router]);

  // 2. CONSUMO DA API
  useEffect(() => {
    if (!parceiroId) return;

    async function carregarDados() {
      try {
        const [resMetricas, resReservas] = await Promise.all([
          fetch(`https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/dashboard`),
          fetch(`https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/reservas`)
        ]);

        const dataMetricas = await resMetricas.json();
        const dataReservas = await resReservas.json();

        let listaReservas: ReservaHotel[] = [];
        if (Array.isArray(dataReservas)) listaReservas = dataReservas;
        else if (dataReservas?.reservas) listaReservas = dataReservas.reservas;
        else if (dataReservas?.dados) listaReservas = dataReservas.dados;

        setReservas(listaReservas);

        setMetricas({
          faturamento: dataMetricas?.metricas?.faturamento_total ?? listaReservas.reduce((acc, r) => acc + (Number(r.valor_liquido) || 0), 0),
          total_vendas: dataMetricas?.metricas?.total_vendas ?? listaReservas.length,
          clientes_a_chegar: dataMetricas?.metricas?.clientes_a_chegar ?? listaReservas.length, 
        });

      } catch (error) {
        console.error("Erro API:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [parceiroId]);

  // 3. LÓGICA DE CHECK-IN / CHECK-OUT (CORRIGIDA: Baseada no codigo_pedido)
  const handleToggleCheckStatus = async (codigoPedido: string, tipo: 'checkin' | 'checkout') => {
    const agoraIso = new Date().toISOString();
    
    setReservas(prev => prev.map(r => {
      // ◄── AQUI ESTÁ A CORREÇÃO CRÍTICA: Só afeta a reserva que tem o código exato
      if (r.codigo_pedido === codigoPedido) {
        const campo = tipo === 'checkin' ? 'checkin_realizado_em' : 'checkout_realizado_em';
        return { ...r, [campo]: r[campo] ? null : agoraIso };
      }
      return r;
    }));

    try {
      await fetch(`https://sagaturismo-production.up.railway.app/api/v1/pedidos/${codigoPedido}/status`, {
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
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const filteredReservas = reservas.filter((r) => {
    const termo = searchTerm.toLowerCase();
    return (
      r.nome_cliente?.toLowerCase().includes(termo) ||
      r.codigo_pedido?.toLowerCase().includes(termo) ||
      r.telefone_cliente?.toLowerCase().includes(termo)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest">A carregar ambiente isolado do Hotel...</p>
      </div>
    );
  }

  const percentagemChegadas = Math.min((metricas?.clientes_a_chegar || 0) * 10, 100); 

  return (
    <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col`}>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="hidden sm:block relative h-10 w-32 border-r border-slate-200 pr-6"><Image src="/logop.png" alt="SGA" fill priority className="object-contain object-left" /></Link>
            <div className="flex items-center gap-3">
              <div className="bg-[#00577C] text-white p-2.5 rounded-xl shadow-lg"><Bed size={20} /></div>
              <div>
                <h1 className={`${jakarta.className} font-black text-slate-900 text-lg md:text-xl`}>{nomeNegocio}</h1>
                <p className="text-[10px] font-black uppercase text-[#00577C] tracking-[0.2em]">Painel Hoteleiro</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/parceiros/dashboard/disponibilidade" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00577C] bg-[#F9C400] hover:bg-[#ffd633] px-5 py-2.5 rounded-full shadow-md"><Calendar size={14} /> <span className="hidden sm:inline">Gerir Quartos</span></Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-black px-5 py-2.5 rounded-full shadow-md"><LogOut size={14} /> Sair</button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-10 py-8 flex-1 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-between group">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Repasse Líquido</p>
                <p className={`${jakarta.className} text-4xl font-black text-[#009640]`}>{formatarMoeda(metricas?.faturamento || 0)}</p>
             </div>
             <p className="text-[10px] font-bold text-slate-400 mt-6 flex items-center gap-1"><ArrowUpRight size={12} className="text-[#009640]"/> Já livre das taxas</p>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-between group">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quartos Reservados</p>
                <p className={`${jakarta.className} text-4xl font-black text-[#00577C]`}>{(metricas?.total_vendas || 0).toString().padStart(2, '0')}</p>
             </div>
             <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2"><span>Performance</span><span className="text-[#00577C]">Alta</span></div>
               <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-[#00577C] h-1.5 rounded-full w-[85%]"></div></div>
             </div>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-between group">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Check-ins Pendentes</p>
                <p className={`${jakarta.className} text-4xl font-black text-[#d9a000]`}>{(metricas?.clientes_a_chegar || 0).toString().padStart(2, '0')}</p>
             </div>
             <div className="mt-6">
               <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2"><span>Capacidade Ocupada</span><span className="text-[#d9a000]">{percentagemChegadas}%</span></div>
               <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-[#F9C400] h-2 rounded-full transition-all" style={{ width: `${percentagemChegadas}%` }}></div></div>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-5 bg-slate-50/50">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0"><ClipboardList className="text-[#00577C]" size={20} /></div>
                <div>
                   <h2 className={`${jakarta.className} text-xl font-black text-slate-900`}>Recepção & Check-in</h2>
                   <p className="text-xs font-bold text-slate-400 mt-1">Lista de hóspedes e gestão de entradas.</p>
                </div>
             </div>
             <div className="relative w-full sm:w-80 shrink-0"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Procurar hóspede..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#00577C] shadow-sm" /></div>
          </div>
          
          {filteredReservas.length === 0 ? (
            <div className="py-24 px-5 text-center flex flex-col items-center justify-center bg-white">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><ClipboardList size={28} className="text-slate-300" /></div>
               <p className={`${jakarta.className} text-xl font-bold text-slate-800 mb-2`}>O seu painel hoteleiro está pronto</p>
               <p className="text-sm text-slate-500 max-w-md">As reservas efetuadas pelos turistas aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="py-5 px-6">ID Localizador</th>
                    <th className="py-5 px-6">Hóspede Principal</th>
                    <th className="py-5 px-6">Ocupação Declarada</th>
                    <th className="py-5 px-6">Estadia (Datas)</th>
                    <th className="py-5 px-6 text-center">Auditoria Diária (Recepção)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-white">
                  {filteredReservas.map((r) => (
                    <tr key={r.codigo_pedido} className="hover:bg-slate-50 transition-colors">
                      <td className="py-5 px-6 font-mono text-xs text-[#00577C] uppercase">{r.codigo_pedido}</td>
                      <td className="py-5 px-6">
                        <p className="text-slate-900 font-black">{r.nome_cliente}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{r.telefone_cliente || 'Sem contato'}</p>
                      </td>
                      <td className="py-5 px-6">
                         <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 w-fit border border-slate-200">
                           <UserCircle size={16} className="text-[#00577C]" /> 
                           {/* AQUI NÃO FAZEMOS FALLBACK PARA "1". Se não vier da API, o dono do hotel sabe que a base de dados falhou */}
                           {r.quantidade_pessoas ?? <span className="text-red-500">?</span>} Pax · {r.quantidade_quartos ?? <span className="text-red-500">?</span>} Quarto(s)
                         </span>
                      </td>
                      <td className="py-5 px-6 text-xs">
                         <div className="flex flex-col gap-1.5">
                           <span className="text-[#009640] flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#009640]"/> In: {formatarData(r.data_checkin)}</span>
                           <span className="text-slate-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"/> Out: {formatarData(r.data_checkout || '')}</span>
                         </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => handleToggleCheckStatus(r.codigo_pedido, 'checkin')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${r.checkin_realizado_em ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                             {r.checkin_realizado_em ? <CheckSquare size={16}/> : <Square size={16}/>} Check-In
                          </button>
                          <button onClick={() => handleToggleCheckStatus(r.codigo_pedido, 'checkout')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${r.checkout_realizado_em ? 'bg-slate-800 text-white border border-slate-900' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                             {r.checkout_realizado_em ? <CheckSquare size={16}/> : <Square size={16}/>} Check-Out
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}