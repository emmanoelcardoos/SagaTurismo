'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, LogOut, Wallet, ShoppingBag, Users2, 
  Bed, Compass, ClipboardList, ShieldCheck, 
  ArrowUpRight, Calendar, Search, Map, 
  CheckSquare, Square, Building, Landmark, UserCircle, Plus
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS ──
type Metricas = { faturamento: number; total_vendas: number; clientes_a_chegar: number; };

type Reserva = {
  id: string;
  codigo_pedido: string;
  nome_cliente: string;
  telefone_cliente?: string;
  tipo_item: string;
  nome_item?: string; 
  data_checkin: string;
  data_checkout?: string;
  // ATENÇÃO: Se estes 2 campos vierem vazios da API, o frontend mostrará N/A.
  quantidade_quartos?: number;
  quantidade_pessoas?: number;
  valor_total: number;
  valor_liquido: number;
  status: string;
  checkin_realizado_em?: string | null;
  checkout_realizado_em?: string | null;
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

  // 1. SEGURANÇA E LEITURA EXATA DO PERFIL
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

        let listaReservas: Reserva[] = [];
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

  // 3. AUDITORIA DE CHECK-IN/OUT (Corrigido para usar o codigo_pedido)
  const handleToggleCheckStatus = async (codigoUnico: string, tipo: 'checkin' | 'checkout') => {
    const agoraIso = new Date().toISOString();
    
    // Atualização otimista usando o codigo_pedido como âncora absoluta
    setReservas(prev => prev.map(r => {
      if (r.codigo_pedido === codigoUnico) {
        const campo = tipo === 'checkin' ? 'checkin_realizado_em' : 'checkout_realizado_em';
        return { ...r, [campo]: r[campo] ? null : agoraIso };
      }
      return r;
    }));

    try {
      // Como não temos o ID interno certo, a API tem de procurar pelo codigo_pedido
      await fetch(`https://sagaturismo-production.up.railway.app/api/v1/pedidos/${codigoUnico}/status`, {
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
      r.nome_item?.toLowerCase().includes(termo)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest">A carregar ambiente isolado...</p>
      </div>
    );
  }

  // ============================================================================
  // RENDERIZAÇÃO 1: PAINEL EXCLUSIVO PARA HOTÉIS
  // ============================================================================
  if (tipoParceiro === 'hotel') {
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
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Repasse Líquido</p>
              <p className={`${jakarta.className} text-4xl font-black text-[#009640]`}>{formatarMoeda(metricas?.faturamento || 0)}</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quartos Reservados</p>
              <p className={`${jakarta.className} text-4xl font-black text-[#00577C]`}>{metricas?.total_vendas || 0}</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Check-ins Pendentes</p>
              <p className={`${jakarta.className} text-4xl font-black text-[#d9a000]`}>{metricas?.clientes_a_chegar || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div><h2 className={`${jakarta.className} text-xl font-black text-slate-900`}>Recepção & Check-in</h2></div>
               <div className="relative w-80"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Procurar hóspede..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none" /></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="py-5 px-6">Localizador</th>
                    <th className="py-5 px-6">Hóspede Principal</th>
                    <th className="py-5 px-6">Ocupação (Atenção Dados API)</th>
                    <th className="py-5 px-6">Estadia</th>
                    <th className="py-5 px-6 text-center">Recepção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                  {filteredReservas.map((r) => (
                    <tr key={r.id || r.codigo_pedido} className="hover:bg-slate-50">
                      <td className="py-4 px-6 font-mono text-xs text-[#00577C]">{r.codigo_pedido}</td>
                      <td className="py-4 px-6"><p className="text-slate-900">{r.nome_cliente}</p></td>
                      <td className="py-4 px-6">
                         {/* Se a API mandar null, mostramos o erro visualmente em vez de fingir que é 1 */}
                         <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 w-fit border border-slate-200">
                           <UserCircle size={16}/> 
                           {r.quantidade_pessoas ?? <span className="text-red-500">Erro DB</span>} Pax · {r.quantidade_quartos ?? <span className="text-red-500">Erro DB</span>} Quarto(s)
                         </span>
                      </td>
                      <td className="py-4 px-6 text-xs">
                         <div className="flex flex-col gap-1">
                           <span className="text-[#009640]">In: {formatarData(r.data_checkin)}</span>
                           <span className="text-slate-500">Out: {formatarData(r.data_checkout || '')}</span>
                         </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleToggleCheckStatus(r.codigo_pedido, 'checkin')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${r.checkin_realizado_em ? 'bg-green-100 text-green-800' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                             {r.checkin_realizado_em ? <CheckSquare size={16}/> : <Square size={16}/>} Check-In
                          </button>
                          <button onClick={() => handleToggleCheckStatus(r.codigo_pedido, 'checkout')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${r.checkout_realizado_em ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                             {r.checkout_realizado_em ? <CheckSquare size={16}/> : <Square size={16}/>} Check-Out
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDERIZAÇÃO 2: PAINEL EXCLUSIVO PARA GUIAS
  // ============================================================================
  if (tipoParceiro === 'guia') {
    return (
      <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col`}>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="hidden sm:block relative h-10 w-32 border-r border-slate-200 pr-6"><Image src="/logop.png" alt="SGA" fill priority className="object-contain object-left" /></Link>
              <div className="flex items-center gap-3">
                <div className="bg-[#009640] text-white p-2.5 rounded-xl shadow-lg"><Compass size={20} /></div>
                <div>
                  <h1 className={`${jakarta.className} font-black text-slate-900 text-lg md:text-xl`}>{nomeNegocio}</h1>
                  <p className="text-[10px] font-black uppercase text-[#009640] tracking-[0.2em]">Painel do Guia</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/parceiros/dashboard/disponibilidade" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-[#009640] hover:bg-[#007a33] px-5 py-2.5 rounded-full shadow-md"><Plus size={14} /> Novo Passeio</Link>
              <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-black px-5 py-2.5 rounded-full shadow-md"><LogOut size={14} /> Sair</button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 md:px-10 py-8 flex-1 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Meus Ganhos Líquidos</p>
              <p className={`${jakarta.className} text-4xl font-black text-[#009640]`}>{formatarMoeda(metricas?.faturamento || 0)}</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Passeios Vendidos</p>
              <p className={`${jakarta.className} text-4xl font-black text-[#009640]`}>{metricas?.total_vendas || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div><h2 className={`${jakarta.className} text-xl font-black text-slate-900`}>Lista de Turistas</h2></div>
               <div className="relative w-80"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Procurar turista ou passeio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none" /></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="py-5 px-6">Serviço/Passeio Vendido</th>
                    <th className="py-5 px-6">Data da Aventura</th>
                    <th className="py-5 px-6">Nome do Turista</th>
                    <th className="py-5 px-6 text-center">Nº Pessoas</th>
                    <th className="py-5 px-6 text-right">Repasse Guia (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                  {filteredReservas.map((r) => (
                    <tr key={r.id || r.codigo_pedido} className="hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <p className="text-[#009640] font-black text-sm">{r.nome_item || 'Passeio Avulso'}</p>
                        <p className="text-[10px] font-mono text-slate-400">Ref: {r.codigo_pedido}</p>
                      </td>
                      <td className="py-4 px-6 text-[#009640] font-black">{formatarData(r.data_checkin)}</td>
                      <td className="py-4 px-6">{r.nome_cliente}</td>
                      <td className="py-4 px-6 text-center">
                         <span className="bg-green-50 text-green-800 border border-green-200 px-3 py-1.5 rounded-lg">
                           {r.quantidade_pessoas ?? <span className="text-red-500">?</span>} Turistas
                         </span>
                      </td>
                      <td className="py-4 px-6 text-right text-lg text-slate-900">{formatarMoeda(r.valor_liquido)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDERIZAÇÃO 3: PAINEL EXCLUSIVO PARA AGÊNCIAS / PACOTES
  // ============================================================================
  return (
    <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col`}>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="hidden sm:block relative h-10 w-32 border-r border-slate-200 pr-6"><Image src="/logop.png" alt="SGA" fill priority className="object-contain object-left" /></Link>
            <div className="flex items-center gap-3">
              <div className="bg-[#00577C] text-white p-2.5 rounded-xl shadow-lg"><Map size={20} /></div>
              <div>
                <h1 className={`${jakarta.className} font-black text-slate-900 text-lg md:text-xl`}>{nomeNegocio}</h1>
                <p className="text-[10px] font-black uppercase text-[#00577C] tracking-[0.2em]">Agência Turística</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/parceiros/dashboard/disponibilidade" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-[#00577C] hover:bg-[#004a6b] px-5 py-2.5 rounded-full shadow-md"><Compass size={14} /> Montar Pacote</Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-black px-5 py-2.5 rounded-full shadow-md"><LogOut size={14} /> Sair</button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-10 py-8 flex-1 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lucro Limpo da Agência</p>
            <p className={`${jakarta.className} text-4xl font-black text-[#00577C]`}>{formatarMoeda(metricas?.faturamento || 0)}</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pacotes Fechados</p>
            <p className={`${jakarta.className} text-4xl font-black text-[#00577C]`}>{metricas?.total_vendas || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <div><h2 className={`${jakarta.className} text-xl font-black text-slate-900`}>Controle Financeiro de Pacotes</h2></div>
             <div className="relative w-80"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Procurar pacote ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none" /></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="py-5 px-6">Pacote Vendido</th>
                  <th className="py-5 px-6">Cliente (Comprador)</th>
                  <th className="py-5 px-6">Distribuição Operacional (Split)</th>
                  <th className="py-5 px-6 text-right">Teu Lucro Limpo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {filteredReservas.map((r) => (
                  <tr key={r.id || r.codigo_pedido} className="hover:bg-slate-50">
                    <td className="py-4 px-6">
                      <p className="text-[#00577C] font-black text-sm">{r.nome_item || 'Pacote Standard'}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">{r.codigo_pedido}</p>
                    </td>
                    <td className="py-4 px-6"><p className="text-slate-900">{r.nome_cliente}</p></td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 text-[10px] uppercase font-black tracking-widest w-48">
                         <span className="flex justify-between bg-blue-50 text-[#00577C] px-2 py-1 rounded">Hotel: <span>{formatarMoeda(r.repasse_hotel || 0)}</span></span>
                         <span className="flex justify-between bg-green-50 text-[#009640] px-2 py-1 rounded">Guia: <span>{formatarMoeda(r.repasse_guia || 0)}</span></span>
                         <span className="flex justify-between bg-amber-50 text-amber-700 px-2 py-1 rounded">Pref: <span>{formatarMoeda(r.taxa_prefeitura || 0)}</span></span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`${jakarta.className} text-lg text-[#00577C] bg-blue-50 px-3 py-1.5 rounded-lg`}>{formatarMoeda(r.valor_liquido)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}