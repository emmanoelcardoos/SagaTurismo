'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, Calendar, DollarSign, 
  CheckCircle2, AlertTriangle, ShieldCheck, 
  Save, ToggleLeft, ToggleRight, Info, Bed, Compass
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function DisponibilidadePage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string>('');
  const [loadingSessao, setLoadingSessao] = useState(true);

  // Estados do Formulário de Atualização
  const [tipoQuarto, setTipoQuarto] = useState('standard'); // 'standard' ou 'luxo' / 'geral'
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [novoPreco, setNovoPreco] = useState('');
  const [estaDisponivel, setEstaDisponivel] = useState(true);
  
  // Estados de feedback da API
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMensagem, setStatusMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);

  // ── 1. PROTEÇÃO DE ROTA CONFIDENCIAL ──
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");

    if (!id) {
      // Bloqueio imediato: sem sessão ativa, volta para o login
      router.push('/parceiros');
    } else {
      setParceiroId(id);
      setNomeNegocio(nome || 'Estabelecimento Parceiro');
      setLoadingSessao(false);
    }
  }, [router]);

  // ── 2. SUBMISSÃO DOS NOVOS PREÇOS PARA A API ──
  const handleSalvarCalendario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parceiroId) return;

    setIsSubmitting(true);
    setStatusMensagem(null);

    try {
      const response = await fetch(`https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/disponibilidade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_quarto: tipoQuarto,
          data_inicio: dataInicio,
          data_fim: dataFim,
          preco: parseFloat(novoPreco.replace(',', '.')),
          disponivel: estaDisponivel
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMensagem({
          tipo: 'sucesso',
          texto: 'Calendário de tarifas e disponibilidade atualizado com sucesso!'
        });
        // Limpar campos de valor e datas após sucesso
        setNovoPreco('');
        setDataInicio('');
        setDataFim('');
      } else {
        setStatusMensagem({
          tipo: 'erro',
          texto: data.detail || 'Falha ao atualizar dados. Verifique os campos.'
        });
      }
    } catch (error) {
      console.error("Erro na API:", error);
      setStatusMensagem({
        tipo: 'erro',
        texto: 'Não foi possível conectar ao servidor de dados.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingSessao) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest">Validando credenciais de segurança...</p>
      </div>
    );
  }

  return (
    <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col text-left overflow-x-hidden`}>
      
      {/* ── HEADER EXECUTIVO PROTEGIDO ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/parceiros/dashboard" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800">
              <ArrowLeft size={20} />
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <h1 className={`${jakarta.className} font-black text-slate-900 text-base md:text-lg leading-none tracking-tight truncate max-w-[180px] sm:max-w-none`}>
                {nomeNegocio}
              </h1>
              <p className="text-[9px] font-black uppercase text-[#00577C] tracking-widest mt-1">Configuração de Tarifas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-lock-status text-[10px] font-black uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full shadow-sm shrink-0">
             <ShieldCheck size={14} className="text-[#009640]" /> SSL Seguro
          </div>
        </div>
      </header>

      {/* ── CONTEÚDO PRINCIPAL (MOBILE FIRST) ── */}
      <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-12 flex-1">
        
        <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          
          {/* Topo Informativo */}
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
             <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#00577C] shrink-0 shadow-sm">
                  <Calendar size={24} />
                </div>
                <div>
                   <h2 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900`}>Controle de Tarifas por Período</h2>
                   <p className="text-xs font-bold text-slate-400 mt-1 leading-relaxed">
                     Defina preços específicos para feriados, fins de semana ou épocas festivas. Os valores digitados aqui atualizam instantaneamente o motor de reservas dos clientes.
                   </p>
                </div>
             </div>
          </div>

          {/* Área do Formulário */}
          <div className="p-6 md:p-8">
             
             {/* Feedbacks de Status */}
             {statusMensagem && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
                  statusMensagem.tipo === 'sucesso' 
                    ? 'bg-green-50 border-green-100 text-green-800' 
                    : 'bg-red-50 border-red-100 text-red-800'
                }`}>
                   {statusMensagem.tipo === 'sucesso' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
                   <p className="text-xs md:text-sm font-bold leading-relaxed">{statusMensagem.textio || statusMensagem.texto}</p>
                </div>
             )}

             <form onSubmit={handleSalvarCalendario} className="space-y-6">
                
                {/* 1. Seleção de Categoria / Tipo de Quarto */}
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2.5">Selecione o Tipo de Acomodação / Serviço</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setTipoQuarto('standard')}
                        className={`p-4 rounded-xl border-2 font-bold text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-2 transition-all ${
                          tipoQuarto === 'standard' 
                            ? 'border-[#00577C] bg-blue-50/50 text-[#00577C]' 
                            : 'border-slate-100 bg-slate-50 text-slate-500'
                        }`}
                      >
                         <Bed size={20} />
                         <span>Quarto Standard</span>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => setTipoQuarto('luxo')}
                        className={`p-4 rounded-xl border-2 font-bold text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-2 transition-all ${
                          tipoQuarto === 'luxo' 
                            ? 'border-[#00577C] bg-blue-50/50 text-[#00577C]' 
                            : 'border-slate-100 bg-slate-50 text-slate-500'
                        }`}
                      >
                         <Compass size={20} />
                         <span>Suíte Luxo</span>
                      </button>
                   </div>
                </div>

                {/* 2. Intervalo de Datas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Data Inicial do Período</label>
                      <input 
                        type="date" 
                        required
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-all shadow-inner"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Data Final do Período</label>
                      <input 
                        type="date" 
                        required
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-all shadow-inner"
                      />
                   </div>
                </div>

                {/* 3. Valor em R$ */}
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Preço da Diária para este Período (R$)</label>
                   <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</div>
                      <input 
                        type="text" 
                        required
                        placeholder="0,00"
                        value={novoPreco}
                        onChange={(e) => setNovoPreco(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm font-black text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-all shadow-inner"
                      />
                   </div>
                </div>

                {/* 4. Bloqueio de Disponibilidade */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                   <div className="text-left pr-4">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Status das Vendas para este Período</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">Se desativar, o quarto ficará marcado como esgotado nessas datas específicas.</p>
                   </div>
                   <button
                     type="button"
                     onClick={() => setEstaDisponivel(!estaDisponivel)}
                     className={`p-1 rounded-full transition-colors shrink-0 ${estaDisponivel ? 'text-[#009640]' : 'text-slate-300'}`}
                   >
                      {estaDisponivel ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                   </button>
                </div>

                {/* Info sobre Fotos */}
                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl flex items-start gap-3 border border-amber-100 text-left">
                   <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
                   <p className="text-[10px] md:text-xs font-bold leading-relaxed">
                     Nota: De acordo com as diretrizes da SEMTUR, alterações estruturais de fotos ou descrições textuais das acomodações devem ser solicitadas diretamente à Secretaria de Turismo para validação e auditoria.
                   </p>
                </div>

                {/* Botão Salvar */}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-4 rounded-xl font-black uppercase text-xs md:text-sm tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                >
                   {isSubmitting ? (
                      <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18}/> Processando Alteração...</span>
                   ) : (
                      <span className="flex items-center gap-2"><Save size={16}/> Aplicar Alterações no Tarifário</span>
                   )}
                </button>

             </form>

          </div>
        </div>

      </div>
    </div>
  );
}