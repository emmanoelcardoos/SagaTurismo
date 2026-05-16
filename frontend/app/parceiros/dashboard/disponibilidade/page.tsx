'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, Calendar as CalendarIcon, 
  CheckCircle2, AlertTriangle, Save, ToggleLeft, 
  ToggleRight, Info, Bed, Compass, ChevronLeft, ChevronRight
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
  const [tipoQuarto, setTipoQuarto] = useState('standard'); 
  const [novoPreco, setNovoPreco] = useState('');
  const [estaDisponivel, setEstaDisponivel] = useState(true);
  
  // Estados do Calendário Customizado Moderno
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);
  const [mesAtual, setMesAtual] = useState<Date>(new Date());
  
  // Estados de feedback da API
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMensagem, setStatusMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);

  // ── 1. PROTEÇÃO DE ROTA CONFIDENCIAL ──
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");

    if (!id) {
      router.push('/parceiros');
    } else {
      setParceiroId(id);
      setNomeNegocio(nome || 'Estabelecimento Parceiro');
      setLoadingSessao(false);
    }
  }, [router]);

  // ── LÓGICA DO MOTOR DO CALENDÁRIO CUSTOMIZADO ──
  const formatarDataIso = (data: Date) => {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  };

  const diasDoMes = (ano: number, mes: number) => new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaDoMes = (ano: number, mes: number) => new Date(ano, mes, 1).getDay();

  const handleDateClick = (data: Date) => {
    if (!dataInicio || (dataInicio && dataFim)) {
      setDataInicio(data);
      setDataFim(null);
    } else if (data > dataInicio) {
      setDataFim(data);
    } else {
      setDataInicio(data);
      setDataFim(null);
    }
  };

  // ── 2. SUBMISSÃO DOS VALORES QUE SE COMUNICAM COM O SUPABASE VIA RAILWAY ──
  const handleSalvarCalendario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parceiroId) return;

    if (!dataInicio || !dataFim) {
      setStatusMensagem({
        tipo: 'erro',
        texto: 'Por favor, selecione o período inicial e final diretamente no calendário.'
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMensagem(null);

    try {
      const response = await fetch(`https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/disponibilidade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_quarto: tipoQuarto,
          data_inicio: formatarDataIso(dataInicio),
          data_fim: formatarDataIso(dataFim),
          preco: parseFloat(novoPreco.replace(',', '.')),
          disponivel: estaDisponivel
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMensagem({
          tipo: 'sucesso',
          texto: 'Excelente! Os novos valores foram processados pela API da Railway e salvos com sucesso na base de dados do Supabase.'
        });
        setNovoPreco('');
        setDataInicio(null);
        setDataFim(null);
      } else {
        setStatusMensagem({
          tipo: 'erro',
          texto: data.detail || 'Falha ao sincronizar dados. Verifique os campos.'
        });
      }
    } catch (error) {
      console.error("Erro na API:", error);
      setStatusMensagem({
        tipo: 'erro',
        texto: 'Erro de comunicação. Não foi possível repassar os dados para o servidor da Railway.'
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

  const anoCorrente = mesAtual.getFullYear();
  const mesCorrente = mesAtual.getMonth();
  const diasMes = diasDoMes(anoCorrente, mesCorrente);
  const primeiroDia = primeiroDiaDoMes(anoCorrente, mesCorrente);
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  return (
    <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col text-left overflow-x-hidden`}>
      
      {/* ── HEADER PREMIUM REESTRUTURADO ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
          <Link href="/" className="relative h-10 w-28 md:w-36 shrink-0 transition-transform active:scale-95" title="Ir para a página inicial">
            <Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" />
          </Link>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Link 
              href="/parceiros/dashboard" 
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00577C] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-full shadow-sm transition-all active:scale-95"
            >
              <ArrowLeft size={14} /> <span>Voltar ao Painel</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── CONTEÚDO PRINCIPAL (MOBILE FIRST) ── */}
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-12 flex-1">
        
        <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          
          <div className="p-5 md:p-8 border-b border-slate-100 bg-slate-50/50">
             <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#00577C] shrink-0 shadow-sm">
                  <CalendarIcon size={24} />
                </div>
                <div>
                   <h2 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900`}>Ajuste de Tarifas & Calendário</h2>
                   <p className="text-xs font-bold text-slate-400 mt-1 leading-relaxed">
                     Atualize os preços e a disponibilidade das suas acomodações. Qualquer alteração aqui reflete instantaneamente no banco de dados do Supabase.
                   </p>
                </div>
             </div>
          </div>

          <div className="p-5 md:p-8">
             
             {statusMensagem && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
                  statusMensagem.tipo === 'sucesso' 
                    ? 'bg-green-50 border-green-100 text-green-800' 
                    : 'bg-red-50 border-red-100 text-red-800'
                }`}>
                   {statusMensagem.tipo === 'sucesso' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
                   <p className="text-xs md:text-sm font-bold leading-relaxed">{statusMensagem.texto}</p>
                </div>
             )}

             <form onSubmit={handleSalvarCalendario} className="space-y-6">
                
                {/* 1. Seleção de Tipo de Quarto */}
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2.5">Acomodação a atualizar</label>
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
                         <span>Standard</span>
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

                {/* 2. NOVO CALENDÁRIO CUSTOMIZADO E MODERNO */}
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Selecione o Intervalo de Datas no Calendário</label>
                   <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-6 shadow-inner">
                      
                      <div className="flex items-center justify-between mb-4">
                         <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente - 1))} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-600"><ChevronLeft size={18}/></button>
                         <p className="font-bold text-slate-800 capitalize text-xs md:text-sm">{mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                         <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente + 1))} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-600"><ChevronRight size={18}/></button>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                         {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="text-[9px] md:text-[10px] font-black text-slate-400">{d}</span>)}
                      </div>
                      
                      <div className="grid grid-cols-7 gap-y-1">
                         {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                         {Array.from({ length: diasMes }).map((_, i) => {
                            const dataDia = new Date(anoCorrente, mesCorrente, i + 1);
                            const isPassado = dataDia < hoje;
                            const isInicio = dataInicio && dataDia.getTime() === dataInicio.getTime();
                            const isFim = dataFim && dataDia.getTime() === dataFim.getTime();
                            const isNoMeio = dataInicio && dataFim && dataDia > dataInicio && dataDia < dataFim;
                            
                            let classeBotao = "bg-transparent text-slate-800 hover:bg-slate-200 rounded-lg";
                            if (isPassado) classeBotao = "text-slate-300 cursor-not-allowed pointer-events-none";
                            else if (isInicio || isFim) classeBotao = "bg-[#00577C] text-white font-black rounded-lg scale-105 shadow-md";
                            else if (isNoMeio) classeBotao = "bg-[#00577C]/10 text-[#00577C] rounded-none";

                            return (
                              <button 
                                type="button" key={i} disabled={isPassado} onClick={() => handleDateClick(dataDia)}
                                className={`w-full aspect-square flex items-center justify-center text-xs font-bold transition-all ${classeBotao}`}
                              >
                                {i + 1}
                              </button>
                            );
                         })}
                      </div>
                   </div>
                   
                   {/* Resumo visual do intervalo escolhido */}
                   <div className="flex justify-between items-center mt-3 bg-blue-50/50 border border-blue-100/50 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600">
                      <span>Período Selecionado:</span>
                      <span className="text-[#00577C]">
                        {dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '...'} até {dataFim ? dataFim.toLocaleDateString('pt-BR') : '...'}
                      </span>
                   </div>
                </div>

                {/* 3. Valor em R$ */}
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Preço da Diária para este Período (R$)</label>
                   <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</div>
                      <input 
                        type="text" required placeholder="0,00" value={novoPreco}
                        onChange={(e) => setNovoPreco(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm font-black text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-all shadow-inner"
                      />
                   </div>
                </div>

                {/* 4. Bloqueio de Disponibilidade */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                   <div className="text-left pr-4">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Status das Vendas</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">Se desativar, o quarto ficará marcado como esgotado nessas datas.</p>
                   </div>
                   <button
                     type="button" onClick={() => setEstaDisponivel(!estaDisponivel)}
                     className={`p-1 rounded-full transition-colors shrink-0 ${estaDisponivel ? 'text-[#009640]' : 'text-slate-300'}`}
                   >
                      {estaDisponivel ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                   </button>
                </div>

                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl flex items-start gap-3 border border-amber-100 text-left">
                   <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
                   <p className="text-[10px] md:text-xs font-bold leading-relaxed">
                     Nota: De acordo com as diretrizes da SEMTUR, alterações estruturais de fotos ou descrições textuais das acomodações devem ser solicitadas diretamente à Secretaria de Turismo para validação e auditoria.
                   </p>
                </div>

                {/* Botão Salvar */}
                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-4 rounded-xl font-black uppercase text-xs md:text-sm tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                >
                   {isSubmitting ? (
                      <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18}/> Sincronizando com Supabase...</span>
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