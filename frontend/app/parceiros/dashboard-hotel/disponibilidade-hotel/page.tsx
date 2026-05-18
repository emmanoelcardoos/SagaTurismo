'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, Calendar as CalendarIcon, 
  CheckCircle2, AlertTriangle, Save, ToggleLeft, 
  ToggleRight, Info, Bed, Compass, ChevronLeft, ChevronRight,
  Plus, Award, Percent, Trash2, Layers, Users, UploadCloud
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type HotelOpcao = { id: string; nome: string; };
type GuiaOpcao = { id: string; nome: string; specialty: string; };
type TarifaCalendario = { id: string; data_inicio: string; data_fim: string; preco: number; tipo_quarto: string; quarto_tipo_id?: string; };

type QuartoFisico = {
  id: string;
  nome_quarto: string;
  preco_quarto: number;
  descricao?: string;
  capacidade: number;
  quantidade_total_quartos: number;
  imagem_url?: string;
};

export default function DisponibilidadePage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string>('');
  const [tipoParceiro, setTipoParceiro] = useState<string>('hotel');
  const [loadingSessao, setLoadingSessao] = useState(true);

  // ── ABA HOTEL ──
  const [abaAtiva, setAbaAtiva] = useState<'quartos' | 'calendario'>('quartos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMensagem, setStatusMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);
  const [mesAtual, setMesAtual] = useState<Date>(new Date());
  const [refreshCounter, setRefreshCounter] = useState(0);

  // ── INVENTÁRIO (tipos_quarto) ──
  const [quartosDb, setQuartosDb] = useState<QuartoFisico[]>([]);
  const [selectedQuartoId, setSelectedQuartoId] = useState<string>('');
  
  const [formNomeQuarto, setFormNomeQuarto] = useState('');
  const [formPrecoBase, setFormPrecoBase] = useState('');
  const [formQuantidade, setFormQuantidade] = useState('5');
  const [formCapacidade, setFormCapacidade] = useState('2');
  const [formDescricao, setFormDescricao] = useState('');
  const [fileImagem, setFileImagem] = useState<File | null>(null); // ◄── UPLOAD DE ARQUIVO

  // ── CALENDÁRIO (disponibilidade_hoteis) ──
  const [novoPreco, setNovoPreco] = useState('');
  const [estaDisponivel, setEstaDisponivel] = useState(true);
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);
  const [porcentagemAcompanhante, setPorcentagemAcompanhante] = useState(''); 
  const [tarifasCarregadas, setTarifasCarregadas] = useState<TarifaCalendario[]>([]); 

  // ── GUIA / PACOTE (MANTIDOS 100% INTACTOS) ──
  const [tituloPasseio, setTituloPasseio] = useState('');
  const [rotaPasseio, setRotaPasseio] = useState('');
  const [pontoEncontro, setPontoEncontro] = useState('');
  const [valorPasseio, setValorPasseio] = useState('');
  const [vagasPasseio, setVagasPasseio] = useState('15');
  const [dataPasseio, setDataPasseio] = useState<Date | null>(null);

  const [hoteisDb, setHoteisDb] = useState<HotelOpcao[]>([]);
  const [guiasDb, setGuiasDb] = useState<GuiaOpcao[]>([]);
  const [tituloPacote, setTituloPacote] = useState('');
  const [descricaoPacote, setDescricaoPacote] = useState('');
  const [hotelSelecionadoId, setHotelSelecionadoId] = useState('');
  const [guiaSelecionadoId, setGuiaSelecionadoId] = useState('');
  const [tipoQuartoPacote, setTipoQuartoPacote] = useState('standard');
  const [valorPacote, setValorPacote] = useState('');
  const [dataInicioPacote, setDataInicioPacote] = useState<Date | null>(null);
  const [dataFimPacote, setDataFimPacote] = useState<Date | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");
    const tipo = localStorage.getItem("tipo_parceiro");

    if (!id) {
      router.push('/parceiros');
    } else {
      setParceiroId(id);
      setNomeNegocio(nome || 'Estabelecimento Parceiro');
      setTipoParceiro(tipo || 'hotel');
      setLoadingSessao(false);
    }
  }, [router]);

  useEffect(() => {
    if (!parceiroId || tipoParceiro !== 'hotel') return;

    async function carregarDadosHotel() {
      try {
        const { data: hotelData } = await supabase
          .from('hoteis')
          .select('porcentagem_acompanhante')
          .eq('id', parceiroId)
          .single();
        
        if (hotelData?.porcentagem_acompanhante) {
          setPorcentagemAcompanhante(hotelData.porcentagem_acompanhante.toString());
        }

        const { data: listagemQuartos } = await supabase
          .from('tipos_quarto')
          .select('*')
          .eq('hotel_id', parceiroId)
          .order('nome_quarto');

        if (listagemQuartos) {
          setQuartosDb(listagemQuartos);
          if (listagemQuartos.length > 0 && !selectedQuartoId) {
            setSelectedQuartoId(listagemQuartos[0].id);
          }
        }

        const { data: dadosTarifas } = await supabase
          .from('disponibilidade_hoteis')
          .select('id, data_inicio, data_fim, preco, tipo_quarto, quarto_tipo_id')
          .eq('hotel_id', parceiroId);

        if (dadosTarifas) setTarifasCarregadas(dadosTarifas);
      } catch (err) {
        console.error("Erro ao mapear a extranet:", err);
      }
    }
    carregarDadosHotel();
  }, [parceiroId, tipoParceiro, refreshCounter, selectedQuartoId]);

  useEffect(() => {
    if (tipoParceiro !== 'pacote') return;
    async function carregarDadosDeSuporte() {
      try {
        const [resHoteis, resGuias] = await Promise.all([
          supabase.from('hoteis').select('id, nome'),
          supabase.from('guias').select('id, nome, specialty')
        ]);
        if (resHoteis.data) setHoteisDb(resHoteis.data);
        if (resGuias.data) setGuiasDb(resGuias.data.map(g => ({ id: g.id, nome: g.nome, specialty: g.specialty || 'Geral' })));
      } catch (err) {
        console.error(err);
      }
    }
    carregarDadosDeSuporte();
  }, [tipoParceiro]);

  const formatarDataIso = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  const diasDoMes = (ano: number, mes: number) => new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaDoMes = (ano: number, mes: number) => new Date(ano, mes, 1).getDay();

  const handleDateClickCommon = (data: Date, inicio: Date | null, fim: Date | null, setIn: Function, setFi: Function) => {
    if (!inicio || (inicio && fim)) {
      setIn(data);
      setFi(null);
    } else if (data > inicio) {
      setFi(data);
    } else {
      setIn(data);
      setFi(null);
    }
  };

  // ── UPLOAD DE ARQUIVO + CRIAÇÃO DO QUARTO ──
  const handleCriarQuartoFisico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parceiroId) return;

    if (!fileImagem) {
      setStatusMensagem({ tipo: 'erro', texto: 'A foto do quarto é obrigatória.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMensagem(null);

    try {
      // 1. Upload da Imagem para o Supabase Storage (Bucket: galeria)
      const fileExt = fileImagem.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `quartos/${parceiroId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('galeria')
        .upload(filePath, fileImagem);

      if (uploadError) throw new Error("Erro no upload da imagem. Verifique se o bucket 'galeria' permite uploads públicos.");

      const { data: publicUrlData } = supabase.storage
        .from('galeria')
        .getPublicUrl(filePath);

      // 2. Criar Registo na Base de Dados
      const slugGerado = formNomeQuarto.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      
      const { data, error } = await supabase
        .from('tipos_quarto')
        .insert({
          hotel_id: parceiroId,
          nome_quarto: formNomeQuarto,
          preco_quarto: parseFloat(formPrecoBase.replace(',', '.')),
          quantidade_total_quartos: parseInt(formQuantidade),
          capacidade: parseInt(formCapacidade),
          descricao: formDescricao,
          imagem_url: publicUrlData.publicUrl,
          slug: slugGerado
        })
        .select();

      if (error) throw error;

      setStatusMensagem({ tipo: 'sucesso', texto: `Acomodação "${formNomeQuarto}" e foto registadas com sucesso!` });
      setFormNomeQuarto(''); setFormPrecoBase(''); setFormDescricao(''); setFileImagem(null);
      if (data && data[0]) setSelectedQuartoId(data[0].id);
      setRefreshCounter(prev => prev + 1);
    } catch (err: any) {
      setStatusMensagem({ tipo: 'erro', texto: err.message || 'Erro ao guardar quarto físico.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletarQuartoFisico = async (idQuarto: string) => {
    if (!confirm("Tem a certeza? Todas as diárias associadas serão apagadas.")) return;
    try {
      const { error } = await supabase.from('tipos_quarto').delete().eq('id', idQuarto);
      if (error) throw error;
      setStatusMensagem({ tipo: 'sucesso', texto: 'Acomodação removida com sucesso.' });
      setRefreshCounter(prev => prev + 1);
      if (selectedQuartoId === idQuarto) setSelectedQuartoId('');
    } catch (err) {
      setStatusMensagem({ tipo: 'erro', texto: 'Falha ao remover acomodação.' });
    }
  };

  const handleExcluirTarifa = async (idTarifa: string) => {
    if (!confirm("Deseja reverter este período para o valor base?")) return;
    try {
      const { error } = await supabase.from('disponibilidade_hoteis').delete().eq('id', idTarifa);
      if (error) throw error;
      setStatusMensagem({ tipo: 'sucesso', texto: 'Exceção tarifária removida.' });
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      setStatusMensagem({ tipo: 'erro', texto: 'Erro ao remover exceção.' });
    }
  };

  // ── SUBMISSÃO API ──
  const handleSalvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parceiroId) return;

    setIsSubmitting(true);
    setStatusMensagem(null);

    let endpoint = '';
    let bodyPayload = {};

    if (tipoParceiro === 'hotel') {
      if (!dataInicio || !dataFim) {
        setStatusMensagem({ tipo: 'erro', texto: 'Selecione o intervalo de diárias no calendário.' });
        setIsSubmitting(false);
        return;
      }

      try {
        await supabase
          .from('hoteis')
          .update({ porcentagem_acompanhante: parseFloat(porcentagemAcompanhante.replace(',', '.')) || 0 })
          .eq('id', parceiroId);
      } catch (err) {
        console.error(err);
      }

      const quartoAtual = quartosDb.find(q => q.id === selectedQuartoId);

      endpoint = `https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/disponibilidade`;
      bodyPayload = {
        quarto_tipo_id: selectedQuartoId,
        tipo_quarto: quartoAtual ? quartoAtual.nome_quarto : 'Quarto Customizado',
        data_inicio: formatarDataIso(dataInicio),
        data_fim: formatarDataIso(dataFim),
        preco: parseFloat(novoPreco.replace(',', '.')),
        disponivel: estaDisponivel 
      };
    } else if (tipoParceiro === 'guia') {
      if (!dataPasseio) {
        setStatusMensagem({ tipo: 'erro', texto: 'Escolha a data do passeio.' });
        setIsSubmitting(false);
        return;
      }
      endpoint = `https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/passeios`;
      bodyPayload = {
        titulo: tituloPasseio,
        rota: rotaPasseio,
        ponto_encontro: pontoEncontro,
        vagas: parseInt(vagasPasseio),
        data_passeio: formatarDataIso(dataPasseio),
        preco: parseFloat(valorPasseio.replace(',', '.'))
      };
    } else if (tipoParceiro === 'pacote') {
      if (!dataInicioPacote || !dataFimPacote) {
        setStatusMensagem({ tipo: 'erro', texto: 'Selecione o período de validade do combo.' });
        setIsSubmitting(false);
        return;
      }
      endpoint = `https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/pacotes`;
      bodyPayload = {
        titulo: tituloPacote,
        descricao: descricaoPacote,
        hotel_id: hotelSelecionadoId || null,
        tipo_quarto: tipoQuartoPacote,
        guia_id: guiaSelecionadoId || null,
        data_inicio: formatarDataIso(dataInicioPacote),
        data_fim: formatarDataIso(dataFimPacote),
        preco: parseFloat(valorPacote.replace(',', '.'))
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (response.ok) {
        setStatusMensagem({ tipo: 'sucesso', texto: `Ação registada com sucesso!` });
        setNovoPreco(''); setDataInicio(null); setDataFim(null);
        setTituloPasseio(''); setRotaPasseio(''); setValorPasseio(''); setTituloPacote(''); setValorPacote('');
        setRefreshCounter(prev => prev + 1); // Força recarregamento imediato dos dados reais
      } else {
        const resData = await response.json();
        setStatusMensagem({ tipo: 'erro', texto: resData.detail || 'Falha ao salvar dados.' });
      }
    } catch (error) {
      setStatusMensagem({ tipo: 'erro', texto: 'Erro de ligação com o servidor central.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const anoCorrente = mesAtual.getFullYear();
  const mesCorrente = mesAtual.getMonth();
  const diasMes = diasDoMes(anoCorrente, mesCorrente);
  const primeiroDia = primeiroDiaDoMes(anoCorrente, mesCorrente);
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  // ── REATIVIDADE RESTAURADA (PREVISÃO IMEDIATA) ──
  const obterPrecoDoDia = (dataDia: Date) => {
    const dataStr = formatarDataIso(dataDia);
    
    // EFEITO IMEDIATO: Exibe o valor que está a ser digitado no input em tempo real nos dias selecionados
    if (dataInicio && dataFim && dataDia >= dataInicio && dataDia <= dataFim && novoPreco) {
      return parseFloat(novoPreco.replace(',', '.')) || null;
    }
    if (dataInicio && !dataFim && dataDia.getTime() === dataInicio.getTime() && novoPreco) {
      return parseFloat(novoPreco.replace(',', '.')) || null;
    }

    // Procura no histórico salvo do Supabase
    const quartoAtual = quartosDb.find(q => q.id === selectedQuartoId);
    const excecaoSazonal = [...tarifasCarregadas].reverse().find(t => {
      return dataStr >= t.data_inicio && dataStr <= t.data_fim && 
        (t.quarto_tipo_id === selectedQuartoId || t.tipo_quarto === quartoAtual?.nome_quarto);
    });

    if (excecaoSazonal) return excecaoSazonal.preco;
    return quartoAtual ? quartoAtual.preco_quarto : null;
  };

  const quartoAtivo = quartosDb.find(q => q.id === selectedQuartoId);
  const tarifasDoQuartoAtual = tarifasCarregadas.filter(t => 
    t.quarto_tipo_id === selectedQuartoId || t.tipo_quarto === quartoAtivo?.nome_quarto
  );

  return (
    <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col text-left overflow-x-hidden`}>
      
      {/* HEADER: AZUL PETRÓLEO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
          <Link href="/" className="relative h-10 w-28 md:w-36 shrink-0 transition-transform active:scale-95">
            <Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" />
          </Link>
          <Link href="/parceiros/dashboard-hotel" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00577C] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-full shadow-sm">
            <ArrowLeft size={14} /> <span>Voltar ao Painel</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-12 flex-1">
        <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          
          <div className="p-5 md:p-8 border-b border-slate-100 bg-slate-50/50">
             <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#00577C] shrink-0 shadow-sm">
                  {tipoParceiro === 'hotel' ? <Bed size={24}/> : tipoParceiro === 'guia' ? <Compass size={24}/> : <CalendarIcon size={24}/>}
                </div>
                <div>
                   <h2 className={`${jakarta.className} text-xl md:text-2xl font-black text-[#00577C]`}>
                     {tipoParceiro === 'hotel' && 'Gestão de Inventário & Quartos'}
                     {tipoParceiro === 'guia' && 'Criação e Gestão de Passeios'}
                     {tipoParceiro === 'pacote' && 'Montador de Combos & Pacotes'}
                   </h2>
                   <p className="text-xs font-bold text-slate-400 mt-1 leading-relaxed">
                     {tipoParceiro === 'hotel' && 'Gerencie estoques e diárias com reflexo imediato no portal SagaTurismo.'}
                     {tipoParceiro === 'guia' && 'Lance novos roteiros turísticos ecológicos e defina o número limite de vagas.'}
                     {tipoParceiro === 'pacote' && 'Combine hotéis e guias locais para comercializar pacotes unificados de turismo.'}
                   </p>
                </div>
             </div>

             {tipoParceiro === 'hotel' && (
               <div className="flex gap-2 mt-6 bg-slate-100 p-1 rounded-xl max-w-sm border border-slate-200">
                 <button 
                   onClick={() => setAbaAtiva('quartos')}
                   className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${abaAtiva === 'quartos' ? 'bg-white text-[#0085FF] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                 >
                   <Layers size={14} /> Meus Quartos
                 </button>
                 <button 
                   onClick={() => setAbaAtiva('calendario')}
                   className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${abaAtiva === 'calendario' ? 'bg-white text-[#0085FF] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                 >
                   <CalendarIcon size={14} /> Calendário Tarifário
                 </button>
               </div>
             )}
          </div>

          <div className="p-5 md:p-8">
             {statusMensagem && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${statusMensagem.tipo === 'sucesso' ? 'bg-green-50 border-green-200 text-[#009640]' : 'bg-red-50 border-red-100 text-red-800'}`}>
                   <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                   <p className="text-xs md:text-sm font-bold leading-relaxed">{statusMensagem.texto}</p>
                </div>
             )}

             {/* ================= ABA 1: MEUS QUARTOS (INVENTÁRIO) ================= */}
             {tipoParceiro === 'hotel' && abaAtiva === 'quartos' && (
               <div className="space-y-8">
                 <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-[#00577C] block mb-3">Categorias Cadastradas</label>
                   {quartosDb.length === 0 ? (
                     <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-medium text-slate-400">
                        Nenhuma acomodação configurada nesta propriedade.
                     </div>
                   ) : (
                     <div className="grid gap-4 sm:grid-cols-2">
                       {quartosDb.map(q => (
                         <div key={q.id} className="border-2 border-slate-100 bg-slate-50/40 rounded-2xl p-4 flex flex-col justify-between hover:border-[#0085FF]/50 transition-all">
                           <div>
                             {q.imagem_url && (
                               <div className="relative w-full h-32 mb-3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                 <img src={q.imagem_url} alt={q.nome_quarto} className="w-full h-full object-cover" />
                               </div>
                             )}
                             <div className="flex justify-between items-start gap-2 mb-1">
                               <h4 className="font-black text-[#00577C] text-sm truncate uppercase">{q.nome_quarto}</h4>
                               <button type="button" onClick={() => handleDeletarQuartoFisico(q.id)} className="text-slate-400 hover:text-red-500 p-1.5 bg-white rounded-lg border border-slate-200 transition-colors">
                                 <Trash2 size={13} />
                               </button>
                             </div>
                             {q.descricao && <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">{q.descricao}</p>}
                           </div>
                           
                           <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-600">
                             <span className="bg-[#0085FF]/10 text-[#0085FF] px-2 py-0.5 rounded text-[9px] font-black uppercase">Vagas: {q.quantidade_total_quartos}</span>
                             <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[9px] font-black">Cap: {q.capacidade}</span>
                             <span className="ml-auto font-black text-[#009640] text-xs">R$ {q.preco_quarto}</span>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>

                 <form onSubmit={handleCriarQuartoFisico} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                   <div className="flex items-center gap-2 text-[#00577C] font-black text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-2">
                     <Plus size={16} className="text-[#0085FF]"/> Adicionar Categoria
                   </div>
                   
                   <div className="grid gap-4 sm:grid-cols-2">
                     <div className="sm:col-span-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Nome do Quarto</label>
                       <input required type="text" value={formNomeQuarto} onChange={e => setFormNomeQuarto(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0085FF]" placeholder="Ex: Suíte Presidencial" />
                     </div>
                     
                     <div className="sm:col-span-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Foto Principal do Quarto (Obrigatória)</label>
                       <div className="relative flex items-center w-full bg-white border border-slate-200 rounded-xl p-2 focus-within:border-[#0085FF] transition-all">
                         <div className="bg-slate-100 p-2 rounded-lg text-slate-500 mr-3"><UploadCloud size={16}/></div>
                         <input required type="file" accept="image/*" onChange={e => setFileImagem(e.target.files ? e.target.files[0] : null)} className="w-full text-xs font-bold text-slate-800 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[#0085FF]/10 file:text-[#0085FF] hover:file:bg-[#0085FF]/20 cursor-pointer" />
                       </div>
                     </div>

                     <div>
                       <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Preço Base (R$)</label>
                       <input required type="text" value={formPrecoBase} onChange={e => setFormPrecoBase(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-black text-slate-800 outline-none focus:border-[#0085FF]" placeholder="0,00" />
                     </div>
                     <div>
                       <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Total de Quartos Disponíveis</label>
                       <input required type="number" min="1" value={formQuantidade} onChange={e => setFormQuantidade(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0085FF]" />
                     </div>
                     <div className="sm:col-span-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Capacidade de Ocupantes</label>
                       <input required type="number" min="1" value={formCapacidade} onChange={e => setFormCapacidade(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0085FF]" />
                     </div>
                     <div className="sm:col-span-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Descritivo Comercial</label>
                       <input type="text" value={formDescricao} onChange={e => setFormDescricao(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0085FF]" placeholder="Ar condicionado, cama box king, frigobar..." />
                     </div>
                   </div>

                   <button type="submit" disabled={isSubmitting} className="w-full bg-[#0085FF] hover:bg-blue-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md">
                     {isSubmitting ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Guardar Acomodação
                   </button>
                 </form>
               </div>
             )}

             {/* ================= ABA 2 E OUTROS PERFIS ================= */}
             {(tipoParceiro !== 'hotel' || abaAtiva === 'calendario') && (
               <form onSubmit={handleSalvarDados} className="space-y-6">
                  
                  {tipoParceiro === 'hotel' && (
                    <>
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-5 shadow-sm">
                         <label className="text-[10px] font-black uppercase tracking-widest text-[#00577C] block mb-2">Taxa de Hóspede Acompanhante (% por Quarto)</label>
                         <p className="text-[11px] text-slate-400 font-medium mb-3">Defina a porcentagem extra cobrada por cada pessoa adicional instalada no mesmo quarto.</p>
                         <div className="relative max-w-[200px]">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm"><Percent size={16}/></div>
                            <input type="text" placeholder="0" value={porcentagemAcompanhante} onChange={e => setPorcentagemAcompanhante(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-black text-slate-800 outline-none focus:border-[#0085FF]" />
                         </div>
                      </div>

                      <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-[#00577C] block mb-2.5">Acomodação a atualizar</label>
                         {quartosDb.length === 0 ? (
                           <p className="text-xs font-bold text-red-500 bg-red-50 p-4 rounded-xl">Necessita registar quartos na aba "Meus Quartos" primeiro.</p>
                         ) : (
                           <div className="grid grid-cols-2 gap-3">
                              {quartosDb.map(q => (
                                <button key={q.id} type="button" onClick={() => setSelectedQuartoId(q.id)} className={`p-4 rounded-xl border-2 font-bold text-xs uppercase flex flex-col items-center justify-center gap-2 transition-all ${selectedQuartoId === q.id ? 'border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                                   <Bed size={20} />
                                   <span className="truncate w-full text-center">{q.nome_quarto}</span>
                                </button>
                              ))}
                           </div>
                         )}
                      </div>

                      {selectedQuartoId && (
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-[#00577C] block mb-2">Selecione o Período Tarifário no Calendário</label>
                           <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-6 shadow-inner">
                              <div className="flex items-center justify-between mb-4">
                                 <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente - 1))} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-600"><ChevronLeft size={18}/></button>
                                 <p className="font-bold text-slate-800 capitalize text-xs md:text-sm">{mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                                 <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente + 1))} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-600"><ChevronRight size={18}/></button>
                              </div>
                              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                 {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="text-[9px] md:text-[10px] font-black text-slate-400">{d}</span>)}
                              </div>
                              <div className="grid grid-cols-7 gap-y-2">
                                 {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                                 {Array.from({ length: diasMes }).map((_, i) => {
                                    const dDia = new Date(anoCorrente, mesCorrente, i + 1);
                                    const passes = dDia < hoje;
                                    const isI = dataInicio && dDia.getTime() === dataInicio.getTime();
                                    const isF = dataFim && dDia.getTime() === dataFim.getTime();
                                    const isM = dataInicio && dataFim && dDia > dataInicio && dDia < dataFim;
                                    
                                    const precoExistente = obterPrecoDoDia(dDia);
                                    // Cores dinâmicas: Amarelo F9C400 para o intervalo que está sendo editado, Verde 009640 para base/histórico
                                    const isEditando = isI || isF || isM;

                                    return (
                                      <button type="button" key={i} disabled={passes} onClick={() => handleDateClickCommon(dDia, dataInicio, dataFim, setDataInicio, setDataFim)} className={`w-full aspect-square flex flex-col items-center justify-center text-xs font-bold transition-all relative py-1 rounded-lg ${passes ? 'text-slate-300 pointer-events-none' : isI || isF ? 'bg-[#0085FF] text-white shadow-md' : isM ? 'bg-[#0085FF]/10 text-[#0085FF] rounded-none' : 'text-slate-800 hover:bg-slate-200'}`}>
                                         <span>{i + 1}</span>
                                         {!passes && precoExistente && (
                                           <span className={`text-[8px] font-black block mt-0.5 tracking-tighter ${isI || isF ? 'text-[#F9C400]' : (isM && novoPreco) ? 'text-[#F9C400]' : 'text-[#009640]'}`}>
                                             R${Math.round(precoExistente)}
                                           </span>
                                         )}
                                      </button>
                                    );
                                 })}
                              </div>
                           </div>
                           <div className="mt-3 bg-[#0085FF]/10 border border-[#0085FF]/20 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0085FF]">
                              Intervalo: {dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '...'} até {dataFim ? dataFim.toLocaleDateString('pt-BR') : '...'}
                           </div>
                        </div>
                      )}

                      <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-[#00577C] block mb-2">Valor da Diária para este intervalo</label>
                         <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">R$</div>
                            <input type="text" required placeholder="0,00" value={novoPreco} onChange={e => setNovoPreco(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm font-black text-slate-800 outline-none focus:border-[#0085FF]" />
                         </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                         <div className="text-left"><p className="text-xs font-black text-[#00577C] uppercase">Quartos Livres para Venda</p></div>
                         <button type="button" onClick={() => setEstaDisponivel(!estaDisponivel)} className={`transition-colors ${estaDisponivel ? 'text-[#009640]' : 'text-slate-300'}`}>
                            {estaDisponivel ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                         </button>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                         <label className="text-[10px] font-black uppercase tracking-widest text-red-500 block mb-3">Limpar / Deletar Tarifas Customizadas</label>
                         {tarifasDoQuartoAtual.length === 0 ? (
                            <p className="text-xs font-medium text-slate-400 bg-slate-50 p-4 rounded-xl text-center">Nenhum período customizado cadastrado.</p>
                         ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                               {tarifasDoQuartoAtual.map((t) => (
                                  <div key={t.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs font-bold transition-all hover:bg-slate-100/70">
                                     <div className="text-slate-600">
                                        <span className="text-[#00577C] capitalize font-black">{t.tipo_quarto}</span>: {t.data_inicio.split('-').reverse().join('/')} até {t.data_fim.split('-').reverse().join('/')}
                                        <span className="block text-[#009640] text-[11px] mt-0.5">Preço: R$ {Number(t.preco).toFixed(2)}</span>
                                     </div>
                                     <button type="button" onClick={() => handleExcluirTarifa(t.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-xl shadow-sm transition-colors">
                                        <Trash2 size={15} />
                                     </button>
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>
                    </>
                  )}

                  {/* ── GUIA / PACOTE (MANTIDOS INTACTOS CONFORME TEU ORIGINAL) ── */}
                  {tipoParceiro === 'guia' && (
                    <>
                      <div className="grid gap-5 sm:grid-cols-2">
                         <div className="sm:col-span-2">
                            <label className="text-[10px] font-black uppercase text-[#00577C] block mb-2">Título do Passeio / Experiência</label>
                            <input required value={tituloPasseio} onChange={e => setTituloPasseio(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 focus:border-[#0085FF]" />
                         </div>
                         <div className="sm:col-span-2">
                            <label className="text-[10px] font-black uppercase text-[#00577C] block mb-2">Rota / Trajeto Detalhado</label>
                            <input required value={rotaPasseio} onChange={e => setRotaPasseio(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 focus:border-[#0085FF]" />
                         </div>
                         <div>
                            <label className="text-[10px] font-black uppercase text-[#00577C] block mb-2">Ponto de Encontro</label>
                            <input required value={pontoEncontro} onChange={e => setPontoEncontro(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 focus:border-[#0085FF]" />
                         </div>
                         <div>
                            <label className="text-[10px] font-black uppercase text-[#00577C] block mb-2">Vagas do Grupo</label>
                            <input type="number" required value={vagasPasseio} onChange={e => setVagasPasseio(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 focus:border-[#0085FF]" />
                         </div>
                      </div>

                      <div>
                         <label className="text-[10px] font-black uppercase text-[#00577C] block mb-2">Data do Evento / Saída</label>
                         <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner">
                            <div className="flex items-center justify-between mb-4">
                               <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente - 1))} className="p-1.5 hover:bg-slate-200 rounded-full"><ChevronLeft size={18}/></button>
                               <p className="font-bold text-slate-800 capitalize text-xs">{mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                               <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente + 1))} className="p-1.5 hover:bg-slate-200 rounded-full"><ChevronRight size={18}/></button>
                            </div>
                            <div className="grid grid-cols-7 gap-y-1 text-center">
                               {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                               {Array.from({ length: diasMes }).map((_, i) => {
                                  const dDia = new Date(anoCorrente, mesCorrente, i + 1);
                                  const passes = dDia < hoje;
                                  const isS = dataPasseio && dDia.getTime() === dataPasseio.getTime();
                                  return (
                                    <button type="button" key={i} disabled={passes} onClick={() => setDataPasseio(dDia)} className={`w-full aspect-square flex items-center justify-center text-xs font-bold rounded-lg ${passes ? 'text-slate-300' : isS ? 'bg-[#0085FF] text-white' : 'text-slate-800 hover:bg-slate-200'}`}>
                                       {i + 1}
                                    </button>
                                  );
                               })}
                            </div>
                         </div>
                      </div>

                      <div>
                         <label className="text-[10px] font-black uppercase text-[#00577C] block mb-2">Valor por Turista (R$)</label>
                         <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</div>
                            <input type="text" required value={valorPasseio} onChange={e => setValorPasseio(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm font-black text-slate-800 focus:border-[#0085FF]" />
                         </div>
                      </div>
                    </>
                  )}

                  {tipoParceiro === 'pacote' && (
                    <>
                      <div className="grid gap-5 sm:grid-cols-2">
                         <div className="sm:col-span-2">
                            <label className="text-[10px] font-black uppercase text-[#00577C] block mb-2">Título Comercial do Pacote</label>
                            <input required value={tituloPacote} onChange={e => setTituloPacote(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 focus:border-[#0085FF]" />
                         </div>
                         <div className="sm:col-span-2">
                            <label className="text-[10px] font-black uppercase text-[#00577C] block mb-2">Breve Descrição</label>
                            <textarea required value={descricaoPacote} onChange={e => setDescricaoPacote(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 h-24 focus:border-[#0085FF]" />
                         </div>
                         
                         <div>
                            <label className="text-[10px] font-black uppercase text-[#00577C] block mb-2">1. Escolha o Hotel Integrado</label>
                            <select value={hotelSelecionadoId} onChange={e => setHotelSelecionadoId(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 cursor-pointer">
                               <option value="">Nenhum hotel vinculado</option>
                               {hoteisDb.map(h => <option key={h.id} value={h.id}>{h.nome}</option>)}
                            </select>
                         </div>

                         <div>
                            <label className="text-[10px] font-black uppercase text-[#00577C] block mb-2">Tipo de Quarto Oferecido</label>
                            <select value={tipoQuartoPacote} onChange={e => setTipoQuartoPacote(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 cursor-pointer">
                               <option value="standard">Standard Simples</option>
                               <option value="plus">Suíte Plus / Premium</option>
                            </select>
                         </div>

                         <div className="sm:col-span-2">
                            <label className="text-[10px] font-black uppercase text-[#00577C] block mb-2">2. Vincular Guia de Turismo Parceiro</label>
                            <select value={guiaSelecionadoId} onChange={e => setGuiaSelecionadoId(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 cursor-pointer">
                               <option value="">Sem guia incluso no roteiro</option>
                               {guiasDb.map(g => <option key={g.id} value={g.id}>{g.nome} ({g.specialty})</option>)}
                            </select>
                         </div>
                      </div>

                      <div>
                         <label className="text-[10px] font-black uppercase text-[#00577C] block mb-2">Período de Validade do Roteiro Completo</label>
                         <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner">
                            <div className="flex items-center justify-between mb-4">
                               <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente - 1))} className="p-1.5 hover:bg-slate-200 rounded-full"><ChevronLeft size={18}/></button>
                               <p className="font-bold text-slate-800 capitalize text-xs">{mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                               <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente + 1))} className="p-1.5 hover:bg-slate-200 rounded-full"><ChevronRight size={18}/></button>
                            </div>
                            <div className="grid grid-cols-7 gap-y-1 text-center">
                               {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                               {Array.from({ length: diasMes }).map((_, i) => {
                                  const dDia = new Date(anoCorrente, mesCorrente, i + 1);
                                  const passes = dDia < hoje;
                                  const isI = dataInicioPacote && dDia.getTime() === dataInicioPacote.getTime();
                                  const isF = dataFimPacote && dDia.getTime() === dataFimPacote.getTime();
                                  const isM = dataInicioPacote && dataFimPacote && dDia > dataInicioPacote && dDia < dataFimPacote;
                                  return (
                                    <button type="button" key={i} disabled={passes} onClick={() => handleDateClickCommon(dDia, dataInicioPacote, dataFimPacote, setDataInicioPacote, setDataFimPacote)} className={`w-full aspect-square flex items-center justify-center text-xs font-bold transition-all ${passes ? 'text-slate-300' : isI || isF ? 'bg-[#0085FF] text-white rounded-lg' : isM ? 'bg-[#0085FF]/10 text-[#0085FF]' : 'text-slate-800 hover:bg-slate-200'}`}>
                                       {i + 1}
                                    </button>
                                  );
                               })}
                            </div>
                         </div>
                      </div>

                      <div>
                         <label className="text-[10px] font-black uppercase text-[#00577C] block mb-2">Valor Total do Combo Fechado (R$)</label>
                         <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</div>
                            <input type="text" required value={valorPacote} onChange={e => setValorPacote(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm font-black text-slate-800 focus:border-[#0085FF]" />
                         </div>
                      </div>
                    </>
                  )}

                  <div className="p-4 bg-[#F9C400]/10 text-amber-800 rounded-xl flex items-start gap-3 border border-[#F9C400]/30 text-left">
                     <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
                     <p className="text-[10px] md:text-xs font-bold leading-relaxed">
                       Nota: De acordo com as diretrizes da SEMTUR, alterações estruturais de fotos ou descrições textuais das acomodações devem ser executadas com responsabilidade jurídica.
                     </p>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full bg-[#0085FF] text-white py-4 rounded-xl font-black uppercase text-xs md:text-sm tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 hover:bg-blue-600">
                     {isSubmitting ? (
                        <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18}/> Processando no Supabase...</span>
                     ) : (
                        <span className="flex items-center gap-2"><Save size={16}/> Lançar e Sincronizar Serviço</span>
                     )}
                  </button>

               </form>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}