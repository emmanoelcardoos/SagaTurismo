'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Loader2, LogOut, Wallet, ShoppingBag, Users2, 
  Calendar, Bed, Compass, ClipboardList, CheckCircle2, ShieldCheck
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
  tipo_item: 'hotel' | 'passeio' | 'pacote';
  data_checkin: string;
  data_checkout?: string;
  quantidade_quartos?: number;
  quantidade_pessoas?: number;
  valor_total: number;
  status: string;
};

export default function DashboardParceiroPage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);

  // ── 1. SEGURANÇA BÁSICA E VERIFICAÇÃO DE SESSÃO ──
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");

    if (!id) {
      // Sem sessão? Corre de volta para o login
      router.push('/parceiros');
    } else {
      setParceiroId(id);
      setNomeNegocio(nome || 'Painel do Parceiro');
    }
  }, [router]);

  // ── 2. CONSUMO DAS ROTAS DA RAILWAY COM VALIDAÇÃO RESILIENTE ──
  useEffect(() => {
    if (!parceiroId) return;

    async function carregarDadosDashboard() {
      try {
        // Chamada em paralelo para acelerar o carregamento
        const [resMetricas, resReservas] = await Promise.all([
          fetch(`https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/dashboard`),
          fetch(`https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/reservas`)
        ]);

        const dataMetricas = await resMetricas.json();
        const dataReservas = await resReservas.json();

        setMetricas(dataMetricas);

        // ── TRATAMENTO DO FORMATO DE DADOS DAS RESERVAS ──
        if (Array.isArray(dataReservas)) {
          // Cenário A: API retorna diretamente a lista pura []
          setReservas(dataReservas);
        } else if (dataReservas && typeof dataReservas === 'object' && Array.isArray(dataReservas.reservas)) {
          // Cenário B: API retorna envelopado em { reservas: [] }
          setReservas(dataReservas.reservas);
        } else if (dataReservas && typeof dataReservas === 'object' && Array.isArray(dataReservas.dados)) {
          // Cenário C: API retorna envelopado em { dados: [] }
          setReservas(dataReservas.dados);
        } else {
          // Cenário D: API retorna um erro ou formato inesperado (evita crash do ecrã)
          console.warn("Formato de reservas não reconhecido ou lista vazia:", dataReservas);
          setReservas([]);
        }

      } catch (error) {
        console.error("Erro ao carregar dados da API:", error);
        setReservas([]);
      } finaly {
        setLoading(false);
      }
    }

    carregarDadosDashboard();
  }, [parceiroId]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/parceiros');
  };

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '-';
    const parts = dataStr.split('-');
    if (parts.length !== 3) return dataStr;
    const [ano, mes, dia] = parts;
    return `${dia}/${mes}/${ano}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest">Sincronizando painel oficial...</p>
      </div>
    );
  }

  return (
    <div className={inter.className + " min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col text-left"}>
      
      {/* BARRA SUPERIOR DO PAINEL */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#00577C] text-white p-2 rounded-xl shadow-md">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className={jakarta.className + " font-black text-slate-900 text-base md:text-xl leading-none"}>{nomeNegocio}</h1>
            <p className="text-[10px] font-black uppercase text-[#009640] tracking-widest mt-1">Parceiro SEMTUR</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-black uppercase text-red-500 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-all"
        >
          <LogOut size={16} /> Sair
        </button>
      </nav>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-8 py-8 flex-1 space-y-8">
        
        {/* CARDS DE MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {/* Card 1: Faturamento */}
          <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-[#009640] flex items-center justify-center shrink-0"><Wallet size={24}/></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturamento Recebido</p>
              <p className={jakarta.className + " text-2xl md:text-3xl font-black text-slate-900 mt-1 tabular-nums"}>{formatarMoeda(metricas?.faturamento || 0)}</p>
            </div>
          </div>

          {/* Card 2: Total Vendas */}
          <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#00577C] flex items-center justify-center shrink-0"><ShoppingBag size={24}/></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Reservas</p>
              <p className={jakarta.className + " text-2xl md:text-3xl font-black text-slate-900 mt-1 tabular-nums"}>{(metricas?.total_vendas || 0).toString().padStart(2, '0')}</p>
            </div>
          </div>

          {/* Card 3: Clientes a chegar */}
          <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#d9a000] flex items-center justify-center shrink-0"><Users2 size={24}/></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-ins Esperados</p>
              <p className={jakarta.className + " text-2xl md:text-3xl font-black text-slate-900 mt-1 tabular-nums"}>{(metricas?.clientes_a_chegar || 0).toString().padStart(2, '0')}</p>
            </div>
          </div>
        </div>

        {/* LISTAGEM DE RESERVAS DINÂMICA */}
        <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50/50 border-b border-slate-200 flex items-center gap-3">
            <ClipboardList className="text-[#00577C]" size={20} />
            <h2 className={jakarta.className + " text-lg font-black text-slate-900"}>Agenda e Checklist de Clientes</h2>
          </div>

          {reservas.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-medium">
               Nenhuma reserva ou check-in registado para o seu estabelecimento até ao momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="py-4 px-6">Localizador</th>
                    <th className="py-4 px-6">Cliente</th>
                    <th className="py-4 px-6">Tipo</th>
                    
                    {/* COLUNAS CUSTOMIZADAS */}
                    <th className="py-4 px-6">Check-in / Data Passeio</th>
                    <th className="py-4 px-6">Check-out</th>
                    <th className="py-4 px-6">Acomodação / Acessos</th>
                    
                    <th className="py-4 px-6 text-right">Valor Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                  {reservas.map((reserva) => (
                    <tr key={reserva.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-[#00577C] tabular-nums uppercase">{reserva.codigo_pedido}</td>
                      <td className="py-4 px-6 text-slate-900 font-black">{reserva.nome_cliente}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                          reserva.tipo_item === 'hotel' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {reserva.tipo_item === 'hotel' ? <Bed size={12}/> : <Compass size={12}/>}
                          {reserva.tipo_item}
                        </span>
                      </td>

                      <td className="py-4 px-6 tabular-nums">{formatarData(reserva.data_checkin)}</td>
                      <td className="py-4 px-6 tabular-nums">
                        {reserva.tipo_item === 'hotel' ? formatarData(reserva.data_checkout || '') : <span className="text-slate-300 font-normal">—</span>}
                      </td>
                      <td className="py-4 px-6">
                        {reserva.tipo_item === 'hotel' ? (
                          <span className="text-xs">{reserva.quantidade_quartos} quarto(s)</span>
                        ) : (
                          <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full tabular-nums">
                            {reserva.quantidade_pessoas} pessoas (Embarque)
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right text-slate-900 font-black tabular-nums">{formatarMoeda(reserva.valor_total)}</td>
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