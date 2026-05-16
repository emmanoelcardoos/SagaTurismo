'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, LogOut, Wallet, ShoppingBag, Users2, 
  Bed, Compass, ClipboardList, ShieldCheck, 
  ArrowUpRight, Home, Calendar, Search
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
  data_checkin: string;
  data_checkout?: string;
  quantidade_quartos?: number;
  quantidade_pessoas?: number;
  valor_total: number;
  valor_liquido: number; // ◄── Injetado pelo backend dinamicamente
  status: string;
};

export default function DashboardParceiroPage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');

  // ── SEGURANÇA BÁSICA E SESSÃO ──
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");

    if (!id) {
      router.push('/parceiros');
    } else {
      setParceiroId(id);
      setNomeNegocio(nome || 'Painel do Parceiro');
    }
  }, [router]);

  // ── CONSUMO DA API E MAPEAMENTO SEGURO ──
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

        // 1. Extrair as reservas de forma segura
        let listaReservas: Reserva[] = [];
        if (Array.isArray(dataReservas)) {
          listaReservas = dataReservas;
        } else if (dataReservas && typeof dataReservas === 'object' && Array.isArray(dataReservas.reservas)) {
          listaReservas = dataReservas.reservas;
        } else if (dataReservas && typeof dataReservas === 'object' && Array.isArray(dataReservas.dados)) {
          listaReservas = dataReservas.dados;
        }

        setReservas(listaReservas);

        // 2. CÁLCULO DE BACKUP INTEGRAVEL (FALLBACK LÍQUIDO)
        const faturamentoLiquidoCalculado = listaReservas.reduce((acc, r) => acc + (Number(r.valor_liquido) || 0), 0);
        const totalVendasCalculadas = listaReservas.length;
        
        setMetricas({
          // Mapeia diretamente as propriedades calculadas na base de dados pelo backend
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

  // ── LÓGICA DE PESQUISA ──
  const filteredReservas = reservas.filter((reserva) => {
    const termo = searchTerm.toLowerCase();
    return (
      reserva.nome_cliente?.toLowerCase().includes(termo) ||
      reserva.codigo_pedido?.toLowerCase().includes(termo) ||
      reserva.telefone_cliente?.toLowerCase().includes(termo)
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
      
      {/* ── HEADER EXECUTIVO ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-5 md:px-10 py-4">
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
                <h1 className={`${jakarta.className} font-black text-slate-900 text-base md:text-xl leading-none tracking-tight truncate max-w-[150px] sm:max-w-[200px] md:max-w-none`}>{nomeNegocio}</h1>
                <p className="text-[9px] md:text-[10px] font-black uppercase text-[#009640] tracking-[0.2em] mt-1">Portal Oficial do Partner</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Link href="/" className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#00577C] transition-colors bg-slate-50 px-4 py-2.5 rounded-full border border-slate-200">
              <Home size={14} /> Ver Portal
            </Link>

            <Link 
              href="/parceiros/dashboard/disponibilidade"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00577C] bg-[#F9C400] hover:bg-[#ffd633] px-3 md:px-5 py-2.5 rounded-full transition-all shadow-md active:scale-95"
            >
              <Calendar size={14} /> <span className="hidden sm:inline">Editar Tarifas</span>
            </Link>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-black px-3 md:px-5 py-2.5 rounded-full transition-all shadow-md active:scale-95"
            >
              <LogOut size={14} /> <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-10 py-8 md:py-12 flex-1 space-y-6 md:space-y-8">
        
        {/* ── CARDS DE MÉTRICAS PREMIUM ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          
          {/* Faturamento */}
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
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-3 flex items-center gap-1"><ArrowUpRight size={12} className="text-[#009640]"/> Já livre das taxas governamentais</p>
          </div>

          {/* Total Vendas */}
          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 p-5 md:p-8 shadow-sm flex flex-col justify-between group hover:border-[#00577C]/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2">Total de Reservas</p>
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
                 <span>Taxa de Conversão da Página</span>
                 <span className="text-[#00577C]">Alta</span>
               </div>
               <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-[#00577C] h-1.5 rounded-full w-[85%]"></div></div>
            </div>
          </div>

          {/* Check-ins Pendentes */}
          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 p-5 md:p-8 shadow-sm flex flex-col justify-between group hover:border-[#F9C400]/50 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2">Check-ins Pendentes</p>
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
                 <span>Capacidade Ocupada Hoje</span>
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
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                 <ClipboardList className="text-[#00577C]" size={20} />
               </div>
               <div>
                 <h2 className={`${jakarta.className} text-lg md:text-2xl font-black text-slate-900`}>Gestão de Clientes</h2>
                 <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-0.5 md:mt-1">Lista oficial de check-ins e reservas pagas.</p>
               </div>
            </div>

            {reservas.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full xl:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Nome, Localizador ou WhatsApp..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-medium focus:outline-none focus:border-[#00577C] focus:ring-1 focus:ring-[#00577C] transition-all shadow-sm"
                  />
                </div>
                <div className="hidden sm:block bg-white px-4 py-2.5 md:px-5 md:py-3 rounded-xl border border-slate-200 text-[10px] md:text-xs font-black text-slate-500 shadow-sm shrink-0">
                  {filteredReservas.length} {filteredReservas.length === 1 ? 'registo' : 'registos'}
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
               <p className="text-xs md:text-sm text-slate-500 max-w-md">As reservas efetuadas pelos turistas aparecerão aqui automaticamente após a confirmação do pagamento.</p>
            </div>
          ) : filteredReservas.length === 0 ? (
            <div className="py-20 md:py-24 px-5 text-center flex flex-col items-center justify-center bg-white">
               <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                 <Search size={24} className="text-slate-300 md:w-7 md:h-7" />
               </div>
               <p className={`${jakarta.className} text-base md:text-lg font-bold text-slate-800 mb-1`}>Nenhum resultado encontrado</p>
               <p className="text-xs md:text-sm text-slate-500">Não encontrámos clientes para "{searchTerm}".</p>
               <button onClick={() => setSearchTerm('')} className="mt-4 md:mt-6 text-xs md:text-sm font-bold text-[#00577C] hover:underline">Limpar pesquisa</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="py-4 md:py-5 px-5 md:px-8">ID do Pedido</th>
                    <th className="py-4 md:py-5 px-5 md:px-6">Nome do Turista</th>
                    <th className="py-4 md:py-5 px-5 md:px-6">Serviço</th>
                    <th className="py-4 md:py-5 px-5 md:px-6">Datas / Agendamento</th>
                    <th className="py-4 md:py-5 px-5 md:px-6 text-center">Quantidade</th>
                    <th className="py-4 md:py-5 px-5 md:px-8 text-right">Líquido a Receber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-white">
                  {filteredReservas.map((reserva) => (
                    <tr key={reserva.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-4 md:py-5 px-5 md:px-8 font-mono text-[10px] md:text-xs text-[#00577C] tabular-nums uppercase">{reserva.codigo_pedido}</td>
                      <td className="py-4 md:py-5 px-5 md:px-6 text-slate-900 font-black">
                        {reserva.nome_cliente}
                        {reserva.telefone_cliente && <span className="block text-[9px] md:text-[10px] text-slate-400 font-medium mt-0.5">{reserva.telefone_cliente}</span>}
                      </td>
                      <td className="py-4 md:py-5 px-5 md:px-6">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg border ${
                          reserva.tipo_item === 'hotel' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-green-50 border-green-100 text-green-700'
                        }`}>
                          {reserva.tipo_item === 'hotel' ? <Bed size={12} /> : <Compass size={12} />}
                          {reserva.tipo_item}
                        </span>
                      </td>
                      <td className="py-4 md:py-5 px-5 md:px-6 tabular-nums">
                        {reserva.tipo_item === 'hotel' ? (
                           <div className="flex flex-col gap-0.5">
                             <span className="text-slate-800 text-[10px] md:text-xs flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#009640]"/> In: {formatarData(reserva.data_checkin)}</span>
                             <span className="text-slate-400 text-[9px] md:text-[10px] flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"/> Out: {formatarData(reserva.data_checkout || '')}</span>
                           </div>
                        ) : (
                           <span className="text-slate-800 text-[10px] md:text-xs flex items-center gap-1.5 md:gap-2 bg-slate-50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-md border border-slate-200 w-fit">
                             <Calendar size={12} className="text-slate-400"/> {formatarData(reserva.data_checkin)}
                           </span>
                        )}
                      </td>
                      <td className="py-4 md:py-5 px-5 md:px-6 text-center">
                        {reserva.tipo_item === 'hotel' ? (
                          <span className="text-[10px] md:text-xs text-slate-600 bg-slate-100 px-2.5 py-1 md:px-3 md:py-1.5 rounded-md">{reserva.quantidade_quartos} Quarto(s)</span>
                        ) : (
                          <span className="text-[10px] md:text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 md:px-3 md:py-1.5 rounded-md shadow-sm">
                            {reserva.quantidade_pessoas} Pessoa(s)
                          </span>
                        )}
                      </td>
                      <td className="py-4 md:py-5 px-5 md:px-8 text-right">
                         {/* LÊ DIRETAMENTE O VALOR JÁ CALCULADO PELO BACKEND */}
                         <span className="text-[#009640] font-black tabular-nums bg-green-50 border border-green-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl group-hover:bg-white transition-colors">
                           {formatarMoeda(reserva.valor_liquido)}
                         </span>
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