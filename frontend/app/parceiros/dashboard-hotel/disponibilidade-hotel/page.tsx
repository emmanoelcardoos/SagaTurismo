'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, Calendar as CalendarIcon, 
  CheckCircle2, AlertTriangle, Save, ToggleLeft, 
  ToggleRight, Info, Bed, ChevronLeft, ChevronRight,
  Plus, Trash2, Layers, DollarSign, Users, Eye
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGENS ESTRUTURAIS ──
type QuartoCategoria = {
  id: string;
  nome: string;
  preco_base: number;
  estoque_total: number;
  capacidade: number;
  descricao: string;
  imagem_url: string;
};

type RestricaoDisponibilidade = {
  id: string;
  data_inicio: string;
  data_fim: string;
  preco: number;
  disponivel: boolean;
  tipo_quarto_id: string;
};

export default function ExtranetDisponibilidadePage() {
  const router = useRouter();
  
  // Estados de Controlo da Sessão
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [nomeHotel, setNomeHotel] = useState<string>('');
  const [loadingSessao, setLoadingSessao] = useState(true);
  
  // Controlo de Abas (Tabs) de Alta Performance
  const [abaAtiva, setAbaAtiva] = useState<'quartos' | 'calendario'>('quartos');

  // Estados Comuns do Ecossistema
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);
  const [mesNavegacao, setMesNavegacao] = useState<Date>(new Date());

  // ── INVENTÁRIO (ABA 1) ESTADOS ──
  const [quartos, setQuartos] = useState<QuartoCategoria[]>([]);
  const [mostrarFormQuarto, setMostrarFormQuarto] = useState(false);
  const [fNome, setFNome] = useState('');
  const [fPrecoBase, setFPrecoBase] = useState('');
  const [fEstoque, setFEstoque] = useState('');
  const [fCapacidade, setFCapacidade] = useState('');
  const [fDescricao, setFDescricao] = useState('');
  const [fImagem, setFImagem] = useState<File | null>(null);

  // ── TARIFÁRIO (ABA 2) ESTADOS ──
  const [quartoSelecionadoId, setQuartoSelecionadoId] = useState<string>('');
  const [historicoDisponibilidade, setHistoricoDisponibilidade] = useState<RestricaoDisponibilidade[]>([]);
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);
  const [precoCustomizado, setPrecoCustomizado] = useState('');
  const [vendaAtiva, setVendaAtiva] = useState(true);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // 1. CARREGAMENTO INICIAL E PROTEÇÃO DE SESSÃO
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");
    if (!id) {
      router.push('/parceiros');
    } else {
      setHotelId(id);
      setNomeHotel(nome || 'Alojamento Autorizado');
      setLoadingSessao(false);
    }
  }, [router]);

  // 2. FETCH DINÂMICO DOS QUARTOS (ABA 1) E HISTÓRICO (ABA 2)
  useEffect(() => {
    if (!hotelId) return;

    async function carregarDadosExtranet() {
      // Carrega Categoria dos Quartos
      const { data: qData } = await supabase
        .from('tipos_quarto')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('nome');
      if (qData) {
        setQuartos(qData as QuartoCategoria[]);
        if (qData.length > 0 && !quartoSelecionadoId) {
          setQuartoSelecionadoId(qData[0].id);
        }
      }

      // Carrega Calendário de Restrições Tarifárias
      const { data: dData } = await supabase
        .from('disponibilidade_hoteis')
        .select('*')
        .eq('hotel_id', hotelId);
      if (dData) setHistoricoDisponibilidade(dData as RestricaoDisponibilidade[]);
    }

    carregarDadosExtranet();
  }, [hotelId, isSubmitting, quartoSelecionadoId]);

  // UTILS MATEMÁTICOS DE CALENDÁRIO
  const formatarDataIso = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  const obterDiasDoMes = (ano: number, mes: number) => new Date(ano, mes + 1, 0).getDate();
  const obterPrimeiroDiaDoMes = (ano: number, mes: number) => new Date(ano, mes, 1).getDay();
  
  const anoCorrente = mesNavegacao.getFullYear();
  const mesCorrente = mesNavegacao.getMonth();
  const totalDiasMes = obterDiasDoMes(anoCorrente, mesCorrente);
  const primeiroDiaSemana = obterPrimeiroDiaDoMes(anoCorrente, mesCorrente);
  
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  // ── LÓGICA DE CLIQUE EM INTERVALO DE DATAS (DATE RANGE) ──
  const handleCliqueData = (dataAlvo: Date) => {
    if (!dataInicio || (dataInicio && dataFim)) {
      setDataInicio(dataAlvo);
      setDataFim(null);
    } else if (dataAlvo > dataInicio) {
      setDataFim(dataAlvo);
    } else {
      setDataInicio(dataAlvo);
      setDataFim(null);
    }
  };

  // ── ABA 1: OPERAÇÃO DE ARMAZENAMENTO E CRIAÇÃO FÍSICA DO INVENTÁRIO ──
  const handleCriarQuarto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !fImagem) return;

    setIsSubmitting(true);
    setStatusFeedback(null);

    try {
      // Executa Upload Binário para o Bucket 'galeria' do Supabase Storage
      const extensaoFicheiro = fImagem.name.split('.').pop();
      const nomeFicheiroUnico = `${hotelId}_${Date.now()}.${extensaoFicheiro}`;
      
      const { error: uploadError } = await supabase.storage
        .from('galeria')
        .upload(nomeFicheiroUnico, fImagem);

      if (uploadError) throw uploadError;

      // Recupera URL Pública Gerada de Forma Blindada
      const { data: urlData } = supabase.storage
        .from('galeria')
        .getPublicUrl(nomeFicheiroUnico);

      const publicImageUrl = urlData.publicUrl;

      // Grava Registo Final na Base de Dados tipos_quarto
      const { error: dbError } = await supabase
        .from('tipos_quarto')
        .insert([{
          hotel_id: hotelId,
          nome: fNome,
          preco_base: parseFloat(fPrecoBase.replace(',', '.')),
          estoque_total: parseInt(fEstoque),
          capacidade: parseInt(fCapacidade),
          descricao: fDescricao,
          imagem_url: publicImageUrl
        }]);

      if (dbError) throw dbError;

      setStatusFeedback({ tipo: 'sucesso', texto: 'Categoria de acomodação física integrada ao inventário com sucesso!' });
      setMostrarFormQuarto(false);
      setFNome(''); setFPrecoBase(''); setFEstoque(''); setFCapacidade(''); setFDescricao(''); setFImagem(null);
    } catch (err: any) {
      setStatusFeedback({ tipo: 'erro', texto: err.message || 'Falha ao processar upload e gravação.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletarQuarto = async (idQuarto: string) => {
    if (!confirm("Aviso Crítico: Deletar esta categoria irá remover permanentemente o quarto do inventário físico e pode cancelar pesquisas pendentes. Continuar?")) return;
    setIsSubmitting(true);
    try {
      await supabase.from('tipos_quarto').delete().eq('id', idQuarto);
      setStatusFeedback({ tipo: 'sucesso', texto: 'Acomodação removida permanentemente do inventário.' });
    } catch (err) {
      setStatusFeedback({ tipo: 'erro', texto: 'Erro de integridade ao tentar apagar quarto.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── ABA 2: PROCESSAMENTO DAS EXCEÇÕES TARIFÁRIOS (ANTIOVERBOOKING) ──
  const handleSalvarCalendario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !quartoSelecionadoId || !dataInicio || !dataFim) {
      setStatusFeedback({ tipo: 'erro', texto: 'Preencha o intervalo completo de datas no mapa e defina os parâmetros.' });
      return;
    }

    setIsSubmitting(true);
    setStatusFeedback(null);

    // Payload estruturado enviado diretamente para a API de faturamento dinâmico na Railway
    const payload = {
      tipo_quarto_id: quartoSelecionadoId,
      data_inicio: formatarDataIso(dataInicio),
      data_fim: formatarDataIso(dataFim),
      preco: precoCustomizado ? parseFloat(precoCustomizado.replace(',', '.')) : null,
      disponivel: vendaAtiva
    };

    try {
      const response = await fetch(`https://sagaturismo-production.up.railway.app/api/v1/parceiros/${hotelId}/disponibilidade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setStatusFeedback({ tipo: 'sucesso', texto: 'Sincronização global concluída! Os preços e bloqueios estão ativos nas buscas públicas.' });
        setDataInicio(null); setDataFim(null); setPrecoCustomizado('');
      } else {
        const errData = await response.json();
        throw new Error(errData.detail || 'Erro na comunicação assíncrona.');
      }
    } catch (err: any) {
      setStatusFeedback({ tipo: 'erro', texto: err.message || 'Falha de comunicação com a API Railway.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mapeia e Varre o Histórico de preços já gravados na tabela do banco
  const obterEstadoDoDia = (dataVerificacao: Date) => {
    const dataStr = formatarDataIso(dataVerificacao);
    return [...historicoDisponibilidade].reverse().find(h => 
      dataStr >= h.data_inicio && dataStr <= h.data_fim && h.tipo_quarto_id === quartoSelecionadoId
    );
  };

  if (loadingSessao) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#0085FF] w-12 h-12 mb-4" />
      <p className={`${jakarta.className} text-xs font-bold text-slate-400 uppercase tracking-widest`}>Abrindo Canal Extranet...</p>
    </div>
  );

  return (
    <div className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 flex flex-col`}>
      
      {/* HEADER EXECUTIVO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-28 md:w-36"><img src="/logop.png" alt="SagaTurismo" className="object-contain object-left h-full w-full" /></div>
            <div className="hidden border-l border-slate-200 pl-4 md:block">
              <span className="text-xs font-black text-[#00577C] uppercase tracking-wider block">Painel de Controlo do Hoteleiro</span>
              <span className="text-[11px] font-bold text-slate-400 block mt-0.5">{nomeHotel}</span>
            </div>
          </div>
          <Link href="/parceiros/dashboard" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00577C] bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2.5 rounded-full transition-all">
            <ArrowLeft size={14} /> <span>Voltar ao Hub</span>
          </Link>
        </div>
      </header>

      {/* PAINEL CENTRAL CONTROLLER */}
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-12 flex-1 flex flex-col gap-6 md:gap-8">
        
        {/* NAVEGAÇÃO DE ABAS REATIVAS (OTA STYLE) */}
        <div className="flex border-b border-slate-200 bg-white p-2 rounded-2xl border shadow-sm gap-2">
          <button 
            onClick={() => { setAbaAtiva('quartos'); setStatusFeedback(null); }}
            className={`flex-1 py-3.5 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${abaAtiva === 'quartos' ? 'bg-[#0085FF] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Bed size={18}/> Meus Quartos (Inventário)
          </button>
          <button 
            onClick={() => { setAbaAtiva('calendario'); setStatusFeedback(null); }}
            className={`flex-1 py-3.5 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${abaAtiva === 'calendario' ? 'bg-[#0085FF] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <CalendarIcon size={18}/> Calendário Tarifário (Preços e Vendas)
          </button>
        </div>

        {/* FEEDBACK POPUP GLOBAL */}
        {statusFeedback && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-300 ${statusFeedback.tipo === 'sucesso' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
             <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-current" />
             <p className="text-xs md:text-sm font-bold leading-relaxed">{statusFeedback.texto}</p>
          </div>
        )}

        {/* ─── CONTINGÊNCIA DA ABA 1: MEUS QUARTOS ─── */}
        {abaAtiva === 'quartos' && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              
              {/* LISTAGEM DOS CARDS INTEGRADOS */}
              {quartos.map((q) => (
                <article key={q.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                  <div className="relative h-44 w-full bg-slate-100">
                    <img src={q.imagem_url || FALLBACK_IMAGE} alt={q.nome} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => handleDeletarQuarto(q.id)}
                      type="button" 
                      className="absolute top-3 right-3 bg-white hover:bg-red-50 border border-slate-200 p-2.5 rounded-xl text-slate-400 hover:text-red-600 transition-colors shadow-sm"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                  <div className="p-5 flex flex-col flex-1 text-left">
                    <h4 className={`${jakarta.className} text-lg font-black text-slate-900 leading-tight mb-2`}>{q.nome}</h4>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 flex-1 mb-4">{q.descricao || 'Sem descrição cadastrada.'}</p>
                    
                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-[11px] font-bold text-slate-600">
                      <div className="flex items-center gap-1.5"><Layers size={14} className="text-slate-400"/> Stock: {q.estoque_total} Qts</div>
                      <div className="flex items-center gap-1.5"><Users size={14} className="text-slate-400"/> Cap: {q.capacidade} Ad</div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Preço Base</span>
                      <span className="text-lg font-black text-[#009640]">{formatarMoeda(q.preco_base)}</span>
                    </div>
                  </div>
                </article>
              ))}

              {/* BOTÃO TRACEJADO ADICIONAR NOVA CATEGORIA */}
              <button 
                onClick={() => setMostrarFormQuarto(!mostrarFormQuarto)}
                className="h-full min-h-[300px] border-4 border-dashed border-slate-200 hover:border-[#0085FF] bg-white rounded-3xl flex flex-col items-center justify-center p-6 text-slate-400 hover:text-[#0085FF] transition-all group"
              >
                <div className="bg-slate-50 group-hover:bg-blue-50 border border-slate-200 group-hover:border-blue-200 p-4 rounded-2xl mb-3 transition-colors shadow-sm"><Plus size={28}/></div>
                <span className={`${jakarta.className} text-sm font-black uppercase tracking-wider`}>Adicionar Nova Categoria</span>
              </button>
            </div>

            {/* FORMULÁRIO DE EMISSÃO FÍSICA DE QUARTO */}
            {mostrarFormQuarto && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 md:p-8 text-left max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
                <h3 className={`${jakarta.className} text-lg font-black text-slate-900 mb-6 border-b border-slate-100 pb-3 flex items-center gap-2`}><Plus size={20} className="text-[#0085FF]"/> Nova Categoria Física</h3>
                <form onSubmit={handleCriarQuarto} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Nome do Quarto / Tipo de Acomodação *</label>
                    <input type="text" required value={fNome} onChange={e => setFNome(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF]" placeholder="Ex: Quarto Casal Standard Vista Rio" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Preço Padrão Diária (R$) *</label>
                      <input type="text" required value={fPrecoBase} onChange={e => setFPrecoBase(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF]" placeholder="450,00" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Estoque Real / Quantidade *</label>
                      <input type="number" required value={fEstoque} onChange={e => setFEstoque(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF]" placeholder="5" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Capacidade Máxima (Pessoas) *</label>
                      <input type="number" required value={fCapacidade} onChange={e => setFCapacidade(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF]" placeholder="2" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Descrição da Acomodação *</label>
                    <textarea required value={fDescricao} onChange={e => setFDescricao(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 text-sm font-bold text-slate-800 h-20 outline-none focus:border-[#0085FF]" placeholder="Destaque as características principais..." />
                  </div>
                  {/* EXIGÊNCIA MÁXIMA: INPUT FILE REAL SEM TEXT-FIELD DE LINKS */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Fotografia de Capa do Quarto *</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 text-center relative hover:bg-slate-100/50 transition-colors">
                      <input 
                        type="file" 
                        required 
                        accept="image/*" 
                        onChange={e => { if(e.target.files) setFImagem(e.target.files[0]); }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                      />
                      <span className="text-xs font-bold text-slate-500 block truncate">
                        {fImagem ? `✓ Ficheiro selecionado: ${fImagem.name}` : 'Clique para fazer o upload da imagem (*.png, *.jpg)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setMostrarFormQuarto(false)} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="bg-[#0085FF] hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2">
                      {isSubmitting ? <><Loader2 size={14} className="animate-spin"/> Gravando...</> : 'Criar Categoria'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ─── CONTINGÊNCIA DA ABA 2: CALENDÁRIO TARIFÁRIO ─── */}
        {abaAtiva === 'calendario' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid lg:grid-cols-[1fr_340px] text-left">
            
            {/* LADO ESQUERDO: INTERFACE DO CALENDÁRIO REATIVO */}
            <div className="p-5 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col gap-6">
              
              {/* SELEÇÃO DINÂMICA: SEM BOTÕES HARDCODED */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2.5">Selecione o Quarto para Flutuação de Tarifas</label>
                {quartos.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-100">Crie pelo menos um quarto na Aba 1 antes de precificar o calendário.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {quartos.map(q => (
                      <button 
                        key={q.id} 
                        type="button" 
                        onClick={() => { setQuartoSelecionadoId(q.id); setDataInicio(null); setDataFim(null); }}
                        className={`px-4 py-2.5 rounded-xl border-2 font-black text-xs uppercase tracking-wider transition-all shadow-sm ${quartoSelecionadoId === q.id ? 'border-[#0085FF] bg-blue-50/70 text-[#0085FF]' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                      >
                        {q.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* CALENDÁRIO INTERATIVO */}
              {quartoSelecionadoId && (
                <div>
                  <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner">
                    <button type="button" onClick={() => setMesNavegacao(new Date(anoCorrente, mesCorrente - 1))} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-600"><ChevronLeft size={18}/></button>
                    <p className={`${jakarta.className} font-black text-slate-800 capitalize text-sm`}>{mesNavegacao.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                    <button type="button" onClick={() => setMesNavegacao(new Date(anoCorrente, mesCorrente + 1))} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-600"><ChevronRight size={18}/></button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((d, i) => <span key={i} className="text-[9px] font-black text-slate-400 tracking-wider py-1">{d}</span>)}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: primeiroDiaSemana }).map((_, i) => <div key={`empty-${i}`} className="aspect-square bg-slate-50/40 rounded-xl" />)}
                    {Array.from({ length: totalDiasMes }).map((_, i) => {
                      const dataDia = new Date(anoCorrente, mesCorrente, i + 1);
                      const isPast = dataDia < hoje;
                      const isIni = dataInicio && dataDia.getTime() === dataInicio.getTime();
                      const isFi = dataFim && dataDia.getTime() === dataFim.getTime();
                      const isBetween = dataInicio && dataFim && dataDia > dataInicio && dataDia < dataFim;
                      const isVolatileHover = hoverDate && dataInicio && !dataFim && dataDia > dataInicio && dataDia <= hoverDate;

                      const registroSalvo = obterEstadoDoDia(dataDia);
                      const quartoEspecifico = quartos.find(q => q.id === quartoSelecionadoId);
                      
                      // ── INTERPOLAÇÃO INSTANTÂNEA EM TEMPO REAL (MÁXIMA EXIGÊNCIA) ──
                      const precoExibido = (isIni || isFi || isBetween) && precoCustomizado
                        ? parseFloat(precoCustomizado.replace(',', '.')) || quartoEspecifico?.preco_base || 0
                        : registroSalvo ? registroSalvo.preco : quartoEspecifico?.preco_base || 0;

                      const isBloqueadoVenda = (isIni || isFi || isBetween)
                        ? !vendaAtiva
                        : registroSalvo ? !registroSalvo.disponivel : false;

                      // Configuração Cromática da Célula
                      let cellStyle = "bg-white text-slate-800 border-slate-100 hover:border-slate-300";
                      if (isPast) cellStyle = "text-slate-200 bg-slate-50/50 cursor-not-allowed pointer-events-none border-transparent";
                      else if (isIni || isFi) cellStyle = "bg-[#0085FF] text-white shadow-md rounded-xl font-black scale-105 z-10 border-transparent";
                      else if (isBetween || isVolatileHover) cellStyle = "bg-blue-50/50 border-[#0085FF]/30 text-[#0085FF]";

                      return (
                        <button
                          type="button"
                          key={i}
                          disabled={isPast}
                          onClick={() => handleCliqueData(dataDia)}
                          onMouseEnter={() => !isPast && setHoverDate(dataDia)}
                          onMouseLeave={() => setHoverDate(null)}
                          className={`w-full aspect-square border rounded-xl flex flex-col items-center justify-between p-1.5 text-xs font-bold transition-all relative ${cellStyle}`}
                        >
                          <span className={isIni || isFi ? 'text-white' : 'text-slate-400 text-[11px]'}>{i + 1}</span>
                          
                          {!isPast && (
                            <div className="w-full text-center">
                              {isBloqueadoVenda ? (
                                <span className="text-[8px] font-black text-red-500 block uppercase tracking-tighter leading-none mb-1">X BLOQ</span>
                              ) : (
                                <span className={`text-[9px] font-black block leading-none truncate ${
                                  isIni || isFi ? 'text-white' : (isIni || isFi || isBetween) && precoCustomizado ? 'text-[#F9C400] font-black' : 'text-[#009640]'
                                }`}>
                                  R${Math.round(precoExibido)}
                                </span>
                              )}
                              
                              {/* Indicador Volátil Amarelo de Edição Ativa */}
                              {(isIni || isFi || isBetween) && precoCustomizado && (
                                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F9C400] animate-pulse" title="Em edição temporária" />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* LADO DIREITO: FORMULÁRIO DE TRANSMISSÃO DAS DIÁRIAS */}
            <form onSubmit={handleSalvarCalendario} className="p-6 bg-slate-50/50 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100">
              <div className="space-y-6">
                <h4 className={`${jakarta.className} text-sm font-black uppercase text-[#00577C] tracking-wider flex items-center gap-1.5`}><DollarSign size={16}/> Ajustar Período</h4>
                
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-600 space-y-1">
                  <p>Início: <span className="text-slate-900 font-black">{dataInicio ? dataInicio.toLocaleDateString('pt-BR') : 'Selecione no mapa'}</span></p>
                  <p>Término: <span className="text-slate-900 font-black">{dataFim ? dataFim.toLocaleDateString('pt-BR') : 'Selecione no mapa'}</span></p>
                </div>

                {/* INPUT DO PREÇO CUSTOMIZADO VOLÁTIL */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Preço Customizado (R$)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">R$</div>
                    <input 
                      type="text" 
                      value={precoCustomizado}
                      onChange={e => setPrecoCustomizado(e.target.value)}
                      disabled={!dataInicio}
                      placeholder="0,00" 
                      className="w-full bg-white border-2 border-slate-200 disabled:bg-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-black text-slate-800 outline-none focus:border-[#0085FF] transition-colors" 
                    />
                  </div>
                </div>

                {/* SWITCH SWITCH ANTIOVERBOOKING */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                   <div className="text-left">
                     <p className="text-xs font-black text-slate-800 uppercase">Status de Vendas</p>
                     <p className="text-[10px] text-slate-400 font-medium">Bloqueia reservas instantaneamente nas datas caso desativado.</p>
                   </div>
                   <button 
                     type="button" 
                     disabled={!dataInicio}
                     onClick={() => setVendaAtiva(!vendaAtiva)} 
                     className={`transition-colors ${vendaAtiva ? 'text-[#009640]' : 'text-slate-300'} disabled:opacity-50`}
                   >
                      {vendaAtiva ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                   </button>
                </div>
              </div>

              {/* DISPARO E HOMOLOGAÇÃO DAS EXCEÇÕES */}
              <div className="pt-6 mt-6 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !dataInicio || !dataFim} 
                  className="w-full bg-[#009640] hover:bg-green-700 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-md transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Atualizando...</> : <><Save size={14}/> Sincronizar Calendário</>}
                </button>
              </div>
            </form>

          </div>
        )}

        {/* NOTA OPERACIONAL COMPLIANCE */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-left">
          <Info size={16} className="text-[#00577C] shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold text-[#00577C] leading-relaxed">
            Nota de Auditoria Comercial: Toda alteração efetuada nesta Extranet limpa o cache dinâmico de faturamento das rotas públicas <code className="bg-white/70 px-1 py-0.5 rounded">/hoteis</code> e <code className="bg-white/70 px-1 py-0.5 rounded">/hoteis/[id]</code> instantaneamente. Certifique-se de que os bloqueios antioverbooking refletem a ocupação do balcão físico.
          </p>
        </div>

      </div>

      {/* FOOTER CORPORATIVO */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto text-left px-4 md:px-10">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <p className="uppercase tracking-widest text-[10px]">SagaTurismo Central Channel Manager © 2026</p>
          <p>Prefeitura Municipal de São Geraldo do Araguaia - Estado do Pará</p>
        </div>
      </footer>

    </div>
  );
}