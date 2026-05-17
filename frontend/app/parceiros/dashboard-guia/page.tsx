'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, LogOut, Wallet, Compass, 
  ClipboardList, ShieldCheck, ArrowUpRight, 
  Search, Users2, Plus, Calendar, MessageCircle
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type Metricas = { faturamento: number; total_vendas: number; clientes_a_chegar: number; };

type ReservaGuia = {
  id: string;
  codigo_pedido: string;
  nome_cliente: string;
  telefone_cliente?: string;
  tipo_item: string;
  nome_item?: string; 
  data_checkin: string; 
  quantidade?: number; 
  quantidade_pessoas?: number; 
  valor_total: number;
  valor_liquido: number;
  repasse_guia?: number; 
  status: string;
};

export default function DashboardGuiaPage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [reservas, setReservas] = useState<ReservaGuia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");
    const tipo = localStorage.getItem("tipo_parceiro"); 

    if (!id || tipo !== 'guia') {
      router.push('/parceiros');
    } else {
      setParceiroId(id);
      setNomeNegocio(nome || 'Painel do Guia');
    }
  }, [router]);

  useEffect(() => {
    if (!parceiroId) return;

    async function carregarDadosGuia() {
      try {
        const [resMetricas, resReservas] = await Promise.all([
          fetch(`https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/dashboard`),
          fetch(`https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/reservas`)
        ]);

        const dataMetricas = await resMetricas.json();
        const dataReservas = await resReservas.json();

        let listaReservas: ReservaGuia[] = [];
        if (Array.isArray(dataReservas)) listaReservas = dataReservas;
        else if (dataReservas?.reservas) listaReservas = dataReservas.reservas;
        else if (dataReservas?.dados) listaReservas = dataReservas.dados;

        setReservas(listaReservas);

        // CÁLCULO ESTRITO: Apenas lê a coluna oficial 'repasse_guia' da API
        const faturamentoGuiaCalculado = listaReservas.reduce((acc, r) => {
           const valorASomar = Number(r.repasse_guia) || 0;
           return acc + valorASomar;
        }, 0);

        setMetricas({
          faturamento: dataMetricas?.metricas?.faturamento_total ?? faturamentoGuiaCalculado,
          total_vendas: dataMetricas?.metricas?.total_vendas ?? listaReservas.length,
          clientes_a_chegar: dataMetricas?.metricas?.clientes_a_chegar ?? listaReservas.length, 
        });

      } catch (error) {
        console.error("Erro API Guia:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarDadosGuia();
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
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const gerarLinkWhatsApp = (telefone?: string) => {
    if (!telefone) return '#';
    let numeros = telefone.replace(/\D/g, ''); 
    if (numeros.length < 10) return '#';
    if (!numeros.startsWith('55')) numeros = `55${numeros}`; 
    return `https://wa.me/${numeros}`;
  };

  const filteredReservas = reservas.filter((r) => {
    const termo = searchTerm.toLowerCase();
    return (
      r.nome_cliente?.toLowerCase().includes(termo) ||
      r.codigo_pedido?.toLowerCase().includes(termo) ||
      r.nome_item?.toLowerCase().includes(termo)
    );
  });

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
                <p className="text-[10px] font-black uppercase text-[#009640] tracking-[0.2em]">Condutor de Turismo Oficial</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/parceiros/dashboard-guia/disponibilidade" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-[#009640] hover:bg-[#007a33] px-5 py-2.5 rounded-full shadow-md"><Plus size={14} /> <span className="hidden sm:inline">Criar Novo Passeio</span></Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-black px-5 py-2.5 rounded-full shadow-md"><LogOut size={14} /> Sair</button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-10 py-8 flex-1 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-between group">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Teu Repasse Acumulado</p>
                <p className={`${jakarta.className} text-4xl font-black text-[#009640]`}>{formatarMoeda(metricas?.faturamento || 0)}</p>
             </div>
             <p className="text-[10px] font-bold text-slate-400 mt-6 flex items-center gap-1"><ArrowUpRight size={12} className="text-[#009640]"/> Subtraído as taxas municipais</p>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-between group">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Passeios Vendidos</p>
                <p className={`${jakarta.className} text-4xl font-black text-slate-800`}>{(metricas?.total_vendas || 0).toString().padStart(2, '0')}</p>
             </div>
             <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2"><span>Status Cadastral</span><span className="text-[#009640]">Regularizado</span></div>
               <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-[#009640] h-1.5 rounded-full w-[100%]"></div></div>
             </div>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-between group">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Turistas Confirmados</p>
                <p className={`${jakarta.className} text-4xl font-black text-slate-900`}>{(metricas?.clientes_a_chegar || 0).toString().padStart(2, '0')}</p>
             </div>
             <div className="mt-6">
               <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2"><span>Agenda Ativa</span><span className="text-slate-900">100%</span></div>
               <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-[#009640] h-2 rounded-full w-full"></div></div>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-5 bg-slate-50/50">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0"><ClipboardList className="text-[#009640]" size={20} /></div>
                <div>
                   <h2 className={`${jakarta.className} text-xl font-black text-slate-900`}>Manifesto de Passageiros & Grupos</h2>
                   <p className="text-xs font-bold text-slate-400 mt-1">Lista unificada de clientes com repasses e contacto direto.</p>
                </div>
             </div>
             <div className="relative w-full sm:w-80 shrink-0"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Procurar turista..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#009640] shadow-sm" /></div>
          </div>
          
          {filteredReservas.length === 0 ? (
            <div className="py-24 px-5 text-center flex flex-col items-center justify-center bg-white">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Compass size={28} className="text-slate-300" /></div>
               <p className={`${jakarta.className} text-xl font-bold text-slate-800 mb-2`}>Nenhum passeio agendado</p>
               <p className="text-sm text-slate-500 max-w-md">Os passeios e pacotes promocionais ativos aparecerão listados aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="py-5 px-6">ID Localizador</th>
                    <th className="py-5 px-6">Nome do Serviço (Passeio / Pacote)</th>
                    <th className="py-5 px-6">Turista & Contacto</th>
                    <th className="py-5 px-6 text-center">Dia do Passeio</th>
                    <th className="py-5 px-6 text-center">Tamanho do Grupo</th>
                    <th className="py-5 px-6 text-right">Teu Repasse Limpo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-white">
                  {filteredReservas.map((r) => {
                    const totalComitiva = r.quantidade_pessoas || r.quantidade || 0;
                    const esPacote = r.tipo_item?.toLowerCase().trim() === 'pacote';
                    const linkZap = gerarLinkWhatsApp(r.telefone_cliente);
                    
                    // CÁLCULO ESTRITO: Apenas a coluna oficial do guia
                    const valorReceber = Number(r.repasse_guia) || 0;

                    return (
                      <tr key={r.codigo_pedido} className="hover:bg-slate-50 transition-colors">
                        <td className="py-5 px-6 font-mono text-xs text-slate-500 uppercase">{r.codigo_pedido}</td>
                        <td className="py-5 px-6">
                           <div className="flex items-center gap-2">
                             <div className={`p-1.5 rounded-lg text-xs font-black uppercase border ${esPacote ? 'bg-purple-50 border-purple-100 text-purple-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                               {esPacote ? 'Pacote' : 'Avulso'}
                             </div>
                             <p className="text-slate-900 font-black text-sm">
                               {r.nome_item || (esPacote ? 'Roteiro Promocional Integrado' : 'Experiência Guiada')}
                             </p>
                           </div>
                        </td>
                        
                        <td className="py-5 px-6">
                          <p className="text-slate-900 font-black">{r.nome_cliente}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                             <p className="text-[10px] text-slate-400 font-medium">{r.telefone_cliente || 'Sem contato'}</p>
                             {linkZap !== '#' && (
                               <a href={linkZap} target="_blank" rel="noopener noreferrer" 
                                  className="bg-[#25D366] text-white p-1 rounded-md hover:bg-[#20bd5a] transition-all shadow-sm flex items-center gap-1 px-1.5 text-[9px] font-black uppercase tracking-wider" 
                                  title="Chamar no WhatsApp">
                                 <MessageCircle size={10} /> Chamar
                               </a>
                             )}
                          </div>
                        </td>

                        <td className="py-5 px-6 text-center text-[#009640] font-black text-xs">
                           <div className="flex items-center justify-center gap-1.5 bg-green-50/50 border border-green-100 px-2.5 py-1.5 rounded-lg w-fit mx-auto">
                             <Calendar size={14} className="text-[#009640]"/>
                             <span>{formatarData(r.data_checkin)}</span>
                           </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                           <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5">
                             <Users2 size={14} className="text-slate-400" />
                             {totalComitiva === 0 ? <span className="text-red-500">?</span> : <span>{totalComitiva} Pessoas</span>}
                           </span>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <span className={`${jakarta.className} text-sm font-black text-[#009640] bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm inline-block tabular-nums`}>
                            {formatarMoeda(valorReceber)}
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