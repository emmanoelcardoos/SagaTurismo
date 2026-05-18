'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, Calendar as CalendarIcon, 
  CheckCircle2, AlertTriangle, Save, ToggleLeft, 
  ToggleRight, Info, Bed, ChevronLeft, ChevronRight,
  Plus, Trash2, Upload, Users, DollarSign, Package
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS ──
type QuartoFisico = {
  id: string;
  nome: string;
  preco_padrao: number;
  estoque_total: number;
  capacidade: number;
  imagem_url: string;
  descricao: string;
};

type TarifaAtiva = {
  id: string;
  data_inicio: string;
  data_fim: string;
  preco: number;
  disponivel: boolean;
  tipo_quarto_id: string;
};

export default function DisponibilidadePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'inventario' | 'tarifario'>('inventario');
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);

  // ── ESTADOS ABA 1: MEUS QUARTOS ──
  const [quartos, setQuartos] = useState<QuartoFisico[]>([]);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [formDataRoom, setFormDataRoom] = useState({
    nome: '', preco_padrao: '', estoque_total: '', capacidade: '2', descricao: '', file: null as File | null
  });

  // ── ESTADOS ABA 2: CALENDÁRIO ──
  const [quartoSelecionado, setQuartoSelecionado] = useState<QuartoFisico | null>(null);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);
  const [precoCustom, setPrecoCustom] = useState('');
  const [vendaAtiva, setVendaAtiva] = useState(true);
  const [tarifasExistentes, setTarifasExistentes] = useState<TarifaAtiva[]>([]);

  // 1. CARREGAMENTO INICIAL
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    if (!id) { router.push('/parceiros'); return; }
    setParceiroId(id);
    fetchDadosIniciais(id);
  }, [router]);

  async function fetchDadosIniciais(hotelId: string) {
    setLoading(true);
    try {
      // Buscar Quartos Físicos
      const { data: qData } = await supabase.from('tipos_quarto').select('*').eq('hotel_id', hotelId);
      if (qData) setQuartos(qData);

      // Buscar Tarifas/Disponibilidade
      const { data: tData } = await supabase.from('disponibilidade_hoteis').select('*').eq('hotel_id', hotelId);
      if (tData) setTarifasExistentes(tData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ── LÓGICA ABA 1: CRIAR QUARTO COM UPLOAD ──
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDataRoom.file || !parceiroId) return;
    setIsSubmitting(true);

    try {
      // 1. Upload Imagem
      const fileExt = formDataRoom.file.name.split('.').pop();
      const fileName = `${parceiroId}_${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('galeria')
        .upload(fileName, formDataRoom.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('galeria').getPublicUrl(fileName);

      // 2. Gravar no Banco
      const { error: dbError } = await supabase.from('tipos_quarto').insert({
        hotel_id: parceiroId,
        nome: formDataRoom.nome,
        preco_padrao: parseFloat(formDataRoom.preco_padrao),
        estoque_total: parseInt(formDataRoom.estoque_total),
        capacidade: parseInt(formDataRoom.capacidade),
        descricao: formDataRoom.descricao,
        imagem_url: publicUrl
      });

      if (dbError) throw dbError;

      setStatusMsg({ tipo: 'sucesso', texto: 'Nova categoria de quarto criada com sucesso!' });
      setShowAddRoom(false);
      fetchDadosIniciais(parceiroId);
    } catch (err: any) {
      setStatusMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletarQuarto = async (id: string) => {
    if (!confirm("Ao apagar este quarto, todas as tarifas e reservas associadas podem ser afetadas. Confirmar?")) return;
    await supabase.from('tipos_quarto').delete().eq('id', id);
    fetchDadosIniciais(parceiroId!);
  };

  // ── LÓGICA ABA 2: CALENDÁRIO TARIFÁRIO ──
  const handleSaveTarifa = async () => {
    if (!dataInicio || !dataFim || !quartoSelecionado || !parceiroId) return;
    setIsSubmitting(true);

    const payload = {
      tipo_quarto_id: quartoSelecionado.id,
      data_inicio: dataInicio.toISOString().split('T')[0],
      data_fim: dataFim.toISOString().split('T')[0],
      preco: parseFloat(precoCustom) || quartoSelecionado.preco_padrao,
      disponivel: vendaAtiva
    };

    try {
      const res = await fetch(`https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/disponibilidade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatusMsg({ tipo: 'sucesso', texto: 'Calendário atualizado! O site público já reflete estas alterações.' });
        fetchDadosIniciais(parceiroId);
        setDataInicio(null); setDataFim(null); setPrecoCustom('');
      }
    } catch (err) {
      setStatusMsg({ tipo: 'erro', texto: 'Erro ao sincronizar com o motor de reservas.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Utils Calendário
  const formatIso = (d: Date) => d.toISOString().split('T')[0];
  const diasNoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
  const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).getDay();

  const getPrecoDia = (dia: Date) => {
    const iso = formatIso(dia);
    const custom = tarifasExistentes.find(t => iso >= t.data_inicio && iso <= t.data_fim && t.tipo_quarto_id === quartoSelecionado?.id);
    return custom ? custom.preco : quartoSelecionado?.preco_padrao;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-[#0085FF] w-12 h-12" /></div>;

  return (
    <div className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 flex flex-col overflow-x-hidden text-left`}>
      
      {/* HEADER INSTITUCIONAL */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-10 py-5 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Image src="/logop.png" alt="SagaTurismo" width={140} height={45} priority className="object-contain" />
            <div className="hidden md:block h-8 w-px bg-slate-200" />
            <h1 className={`${jakarta.className} hidden md:block text-xl font-black text-[#00577C]`}>Extranet do Hotel</h1>
          </div>
          <Link href="/parceiros/dashboard-hotel" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00577C] bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-full transition-all hover:bg-slate-100">
            <ArrowLeft size={14} /> Painel Geral
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
        
        {/* SISTEMA DE ABAS OTA */}
        <div className="flex gap-2 p-1.5 bg-slate-200/50 rounded-2xl w-fit mb-8 md:mb-12">
          <button 
            onClick={() => setActiveTab('inventario')}
            className={`px-6 py-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'inventario' ? 'bg-[#0085FF] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <Bed size={18} /> Meus Quartos
          </button>
          <button 
            onClick={() => setActiveTab('tarifario')}
            className={`px-6 py-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'tarifario' ? 'bg-[#0085FF] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <CalendarIcon size={18} /> Calendário Tarifário
          </button>
        </div>

        {statusMsg && (
          <div className={`p-5 rounded-2xl mb-8 flex items-center gap-4 border animate-in slide-in-from-top-4 ${statusMsg.tipo === 'sucesso' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
            <CheckCircle2 size={24} />
            <p className="font-bold text-sm">{statusMsg.texto}</p>
            <button onClick={() => setStatusMsg(null)} className="ml-auto text-xs uppercase font-black opacity-50">Fechar</button>
          </div>
        )}

        {/* ── CONTEÚDO ABA 1: INVENTÁRIO ── */}
        {activeTab === 'inventario' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-500">
            {quartos.map(q => (
              <div key={q.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group">
                <div className="relative h-48 w-full">
                  <img src={q.imagem_url} alt={q.nome} className="w-full h-full object-cover" />
                  <button onClick={() => handleDeletarQuarto(q.id)} className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur text-red-600 rounded-full shadow-lg hover:bg-red-600 hover:text-white transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-black text-lg text-slate-800 mb-2">{q.nome}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-blue-50 text-[#0085FF] text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1"><Users size={12}/> {q.capacity || q.capacidade} Pessoas</span>
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1"><Package size={12}/> {q.estoque_total} Unidades</span>
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Preço Base</p>
                      <p className="text-xl font-black text-[#009640]">{new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(q.preco_padrao)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* BOTÃO ADICIONAR */}
            <button 
              onClick={() => setShowAddRoom(true)}
              className="border-4 border-dashed border-slate-200 rounded-[2rem] h-[340px] flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-[#0085FF] hover:text-[#0085FF] hover:bg-blue-50/50 transition-all"
            >
              <div className="p-4 bg-slate-100 rounded-full group-hover:bg-[#0085FF]/10 transition-all">
                <Plus size={32} />
              </div>
              <span className="font-black uppercase tracking-widest text-xs">Nova Categoria</span>
            </button>
          </div>
        )}

        {/* ── CONTEÚDO ABA 2: CALENDÁRIO ── */}
        {activeTab === 'tarifario' && (
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 animate-in fade-in duration-500">
            
            {/* LADO ESQUERDO: CALENDÁRIO */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 md:p-10">
              
              {/* Seletor de Quarto Dinâmico */}
              <div className="mb-8">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">Escolha a Categoria para Precificar</label>
                <div className="flex flex-wrap gap-2">
                  {quartos.map(q => (
                    <button 
                      key={q.id} 
                      onClick={() => setQuartoSelecionado(q)}
                      className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${quartoSelecionado?.id === q.id ? 'border-[#0085FF] bg-blue-50 text-[#0085FF]' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                    >
                      {q.nome}
                    </button>
                  ))}
                </div>
              </div>

              {!quartoSelecionado ? (
                <div className="py-20 text-center flex flex-col items-center justify-center opacity-40 grayscale">
                  <Bed size={48} className="mb-4" />
                  <p className="font-bold">Selecione uma categoria acima para abrir o calendário.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1))} className="p-2 hover:bg-slate-100 rounded-full transition-all"><ChevronLeft/></button>
                    <h3 className="font-black text-xl text-slate-800 capitalize">{mesAtual.toLocaleString('pt-BR', {month: 'long', year: 'numeric'})}</h3>
                    <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1))} className="p-2 hover:bg-slate-100 rounded-full transition-all"><ChevronRight/></button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: diasNoMes }).map((_, i) => {
                      const data = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), i + 1);
                      const isPast = data < new Date(new Date().setHours(0,0,0,0));
                      const isStart = dataInicio && formatIso(data) === formatIso(dataInicio);
                      const isEnd = dataFim && formatIso(data) === formatIso(dataFim);
                      const inRange = dataInicio && dataFim && data >= dataInicio && data <= dataFim;
                      const preco = getPrecoDia(data);

                      return (
                        <button 
                          key={i}
                          disabled={isPast}
                          onClick={() => {
                            if (!dataInicio || (dataInicio && dataFim)) { setDataInicio(data); setDataFim(null); }
                            else if (data > dataInicio) { setDataFim(data); }
                            else { setDataInicio(data); setDataFim(null); }
                          }}
                          className={`relative h-24 md:h-28 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                            isPast ? 'bg-slate-50 border-transparent opacity-30 cursor-not-allowed' :
                            isStart || isEnd ? 'border-[#0085FF] bg-blue-50 shadow-inner scale-[0.98]' :
                            inRange ? 'border-[#F9C400] bg-amber-50/50' : 'bg-white border-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <span className={`text-xs font-black ${isStart || isEnd ? 'text-[#0085FF]' : 'text-slate-400'}`}>{i+1}</span>
                          <span className={`text-[10px] md:text-xs font-black ${inRange && precoCustom ? 'text-[#F9C400] scale-110' : 'text-[#009640]'}`}>
                            R$ {inRange && precoCustom ? precoCustom : Math.round(preco || 0)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* LADO DIREITO: EDITOR DE PREÇOS */}
            <aside className="space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-8 text-left">
                <h3 className={`${jakarta.className} text-xl font-black text-slate-900 mb-6 flex items-center gap-2`}>
                  <Save size={20} className="text-[#0085FF]"/> Salvar Alterações
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Preço Customizado (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="number" 
                        value={precoCustom}
                        onChange={e => setPrecoCustom(e.target.value)}
                        placeholder={quartoSelecionado ? String(quartoSelecionado.preco_padrao) : "0,00"} 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-black focus:border-[#F9C400] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-slate-800">Venda Disponível</p>
                      <p className="text-[10px] text-slate-400 font-bold">Bloqueia reservas no site</p>
                    </div>
                    <button onClick={() => setVendaAtiva(!vendaAtiva)} className={`transition-all ${vendaAtiva ? 'text-[#009640]' : 'text-slate-300'}`}>
                      {vendaAtiva ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
                    </button>
                  </div>

                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                    <div className="flex items-start gap-3 mb-4">
                      <Info size={18} className="text-[#0085FF] shrink-0" />
                      <p className="text-xs font-bold text-slate-600 leading-relaxed">
                        {dataInicio && dataFim 
                          ? `Aplicar R$ ${precoCustom || '—'} de ${dataInicio.toLocaleDateString()} até ${dataFim.toLocaleDateString()}.`
                          : 'Selecione um intervalo de datas no calendário ao lado para habilitar a gravação.'}
                      </p>
                    </div>
                    <button 
                      disabled={!dataInicio || !dataFim || isSubmitting}
                      onClick={handleSaveTarifa}
                      className="w-full bg-[#0085FF] hover:bg-[#0066cc] disabled:bg-slate-200 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Sincronizar Site Público'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Alerta de Inteligência */}
              <div className="bg-[#fff9e6] border border-[#F9C400]/30 rounded-[2rem] p-6 flex items-start gap-4">
                <AlertTriangle className="text-[#F9C400] shrink-0" size={24} />
                <p className="text-[11px] font-bold text-amber-900 leading-relaxed">
                  Atenção: Períodos marcados como indisponíveis ocultam automaticamente o seu hotel nas buscas públicas para evitar conflitos de overbooking.
                </p>
              </div>
            </aside>
          </div>
        )}

        {/* ── MODAL ADICIONAR QUARTO ── */}
        {showAddRoom && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddRoom(false)} />
            <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Nova Categoria de Quarto</h3>
                <button onClick={() => setShowAddRoom(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X size={20}/></button>
              </div>
              <form onSubmit={handleAddRoom} className="p-8 space-y-5 text-left">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Nome Comercial (ex: Suíte Master Rio)</label>
                    <input required value={formDataRoom.nome} onChange={e => setFormDataRoom({...formDataRoom, nome: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold focus:border-[#0085FF] outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Preço Padrão (R$)</label>
                    <input required type="number" value={formDataRoom.preco_padrao} onChange={e => setFormDataRoom({...formDataRoom, preco_padrao: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold focus:border-[#0085FF] outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Estoque Total</label>
                    <input required type="number" value={formDataRoom.estoque_total} onChange={e => setFormDataRoom({...formDataRoom, estoque_total: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold focus:border-[#0085FF] outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Capacidade (Pessoas)</label>
                    <select value={formDataRoom.capacidade} onChange={e => setFormDataRoom({...formDataRoom, capacidade: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold focus:border-[#0085FF] outline-none appearance-none">
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Pessoa' : 'Pessoas'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Foto Real do Quarto</label>
                    <div className="relative">
                      <input required type="file" accept="image/*" onChange={e => setFormDataRoom({...formDataRoom, file: e.target.files?.[0] || null})} className="hidden" id="file-upload" />
                      <label htmlFor="file-upload" className="w-full bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-200 transition-all">
                        <Upload size={16} className="text-slate-500" />
                        <span className="text-[10px] font-black uppercase text-slate-500">{formDataRoom.file ? 'Foto Selecionada' : 'Fazer Upload'}</span>
                      </label>
                    </div>
                  </div>
                </div>
                <button 
                  disabled={isSubmitting}
                  className="w-full bg-[#0085FF] text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Criar Categoria e Salvar Foto'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

function X({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>; }