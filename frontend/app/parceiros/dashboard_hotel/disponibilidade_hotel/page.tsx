'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, Calendar as CalendarIcon, 
  CheckCircle2, AlertTriangle, Save, ToggleLeft, 
  ToggleRight, Info, Bed, Compass, ChevronLeft, ChevronRight,
  MapPin, Users2, Ticket, Plus, Award
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase'; // ◄── Injetado para buscar listas dinâmicas

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type HotelOpcao = { id: string; nome: string; };
type GuiaOpcao = { id: string; nome: string; especialidade: string; };

export default function DisponibilidadePage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string>('');
  const [tipoParceiro, setTipoParceiro] = useState<string>('hotel'); // 'hotel' | 'guia' | 'pacote'
  const [loadingSessao, setLoadingSessao] = useState(true);

  // ── ESTADOS COMUNS DE FEEDBACK ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMensagem, setStatusMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);
  const [mesAtual, setMesAtual] = useState<Date>(new Date());

  // ── ESTADOS EXCLUSIVOS: PERFIL HOTEL ──
  const [tipoQuarto, setTipoQuarto] = useState('standard'); 
  const [novoPreco, setNovoPreco] = useState('');
  const [estaDisponivel, setEstaDisponivel] = useState(true);
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);

  // ── ESTADOS EXCLUSIVOS: PERFIL GUIA (PASSEIOS) ──
  const [tituloPasseio, setTituloPasseio] = useState('');
  const [rotaPasseio, setRotaPasseio] = useState('');
  const [pontoEncontro, setPontoEncontro] = useState('');
  const [valorPasseio, setValorPasseio] = useState('');
  const [vagasPasseio, setVagasPasseio] = useState('15');
  const [dataPasseio, setDataPasseio] = useState<Date | null>(null);

  // ── ESTADOS EXCLUSIVOS: PERFIL AGÊNCIA (PACÓTES) ──
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

  // ── 1. GESTÃO DE SESSÃO E PERFIS ──
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

  // ── 2. CARREGAR DEPENDÊNCIAS DO SUPABASE PARA MONTAR PACOTES ──
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
        console.error("Erro ao alimentar selects do montador de pacotes:", err);
      }
    }
    carregarDadosDeSuporte();
  }, [tipoParceiro]);

  // ── UTILS DE CALENDÁRIO ──
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

  // ── 3. SUBMISSÃO UNIFICADA CONSOANTE O PERFIL LOGADO ──
  const handleSalvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parceiroId) return;

    setIsSubmitting(true);
    setStatusMensagem(null);

    let endpoint = '';
    let bodyPayload = {};

    // Validações e montagem de payload específicas por perfil
    if (tipoParceiro === 'hotel') {
      if (!dataInicio || !dataFim) {
        setStatusMensagem({ tipo: 'erro', texto: 'Selecione o intervalo de check-in e check-out no calendário.' });
        setIsSubmitting(false);
        return;
      }
      endpoint = `https://sagaturismo-production.up.railway.app/api/v1/parceiros/${parceiroId}/disponibilidade`;
      bodyPayload = {
        tipo_quarto: tipoQuarto,
        data_inicio: formatarDataIso(dataInicio),
        data_fim: formatarDataIso(dataFim),
        preco: parseFloat(novoPreco.replace(',', '.')),
        disponivel: estaDisponivel
      };
    } else if (tipoParceiro === 'guia') {
      if (!dataPasseio) {
        setStatusMensagem({ tipo: 'erro', texto: 'Escolha a data do passeio no calendário.' });
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
        setStatusMensagem({ tipo: 'erro', texto: 'Selecione a data inicial e final de validade do pacote.' });
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

      const data = await response.json();

      if (response.ok) {
        setStatusMensagem({
          tipo: 'sucesso',
          texto: `Excelente! Alterações gravadas com sucesso no ecossistema oficial.`
        });
        // Limpezas de forms
        setNovoPreco(''); setTituloPasseio(''); setRotaPasseio(''); setValorPasseio(''); setTituloPacote(''); setValorPacote('');
        setDataInicio(null); setDataFim(null); setDataPasseio(null); setDataInicioPacote(null); setDataFimPacote(null);
      } else {
        setStatusMensagem({ tipo: 'erro', texto: data.detail || 'Falha ao sincronizar dados.' });
      }
    } catch (error) {
      setStatusMensagem({ tipo: 'erro', texto: 'Erro de ligação com o servidor da Railway.' });
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

  return (
    <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col text-left overflow-x-hidden`}>
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
          <Link href="/" className="relative h-10 w-28 md:w-36 shrink-0 transition-transform active:scale-95">
            <Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" />
          </Link>
          <Link href="/parceiros/dashboard" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00577C] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-full shadow-sm">
            <ArrowLeft size={14} /> <span>Voltar ao Painel</span>
          </Link>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-12 flex-1">
        <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          
          {/* HEADER SELETIVO DO COMPONENTE */}
          <div className="p-5 md:p-8 border-b border-slate-100 bg-slate-50/50">
             <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#00577C] shrink-0 shadow-sm">
                  {tipoParceiro === 'hotel' ? <Bed size={24}/> : tipoParceiro === 'guia' ? <Compass size={24}/> : <CalendarIcon size={24}/>}
                </div>
                <div>
                   <h2 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900`}>
                     {tipoParceiro === 'hotel' && 'Gestão de Inventário & Quartos'}
                     {tipoParceiro === 'guia' && 'Criação e Gestão de Passeios'}
                     {tipoParceiro === 'pacote' && 'Montador de Combos & Pacotes'}
                   </h2>
                   <p className="text-xs font-bold text-slate-400 mt-1 leading-relaxed">
                     {tipoParceiro === 'hotel' && 'Ajuste preços, diárias e bloqueie quartos em massa direto no Supabase.'}
                     {tipoParceiro === 'guia' && 'Lance novos roteiros turísticos ecológicos e defina o número limite de vagas.'}
                     {tipoParceiro === 'pacote' && 'Combine hotéis e guias locais para comercializar pacotes unificados de turismo.'}
                   </p>
                </div>
             </div>
          </div>

          <div className="p-5 md:p-8">
             {statusMensagem && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${statusMensagem.tipo === 'sucesso' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                   <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                   <p className="text-xs md:text-sm font-bold leading-relaxed">{statusMensagem.texto}</p>
                </div>
             )}

             <form onSubmit={handleSalvarDados} className="space-y-6">
                
                {/* ── VISÃO 1: FORMULÁRIO EXCLUSIVO DE HOTÉIS ── */}
                {tipoParceiro === 'hotel' && (
                  <>
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2.5">Acomodação a atualizar</label>
                       <div className="grid grid-cols-2 gap-3">
                          {['standard', 'luxo'].map(t => (
                            <button key={t} type="button" onClick={() => setTipoQuarto(t)} className={`p-4 rounded-xl border-2 font-bold text-xs uppercase flex flex-col items-center justify-center gap-2 transition-all ${tipoQuarto === t ? 'border-[#00577C] bg-blue-50/50 text-[#00577C]' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                               {t === 'standard' ? <Bed size={20} /> : <Award size={20} />}
                               <span>{t}</span>
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* CALENDÁRIO HOTEL */}
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Período de Bloqueio/Preço</label>
                       <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-6 shadow-inner">
                          <div className="flex items-center justify-between mb-4">
                             <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente - 1))} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-600"><ChevronLeft size={18}/></button>
                             <p className="font-bold text-slate-800 capitalize text-xs md:text-sm">{mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                             <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente + 1))} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-600"><ChevronRight size={18}/></button>
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-center mb-2">
                             {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="text-[9px] md:text-[10px] font-black text-slate-400">{d}</span>)}
                          </div>
                          <div className="grid grid-cols-7 gap-y-1">
                             {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                             {Array.from({ length: diasMes }).map((_, i) => {
                                const dDia = new Date(anoCorrente, mesCorrente, i + 1);
                                const passes = dDia < hoje;
                                const isI = dataInicio && dDia.getTime() === dataInicio.getTime();
                                const isF = dataFim && dDia.getTime() === dataFim.getTime();
                                const isM = dataInicio && dataFim && dDia > dataInicio && dDia < dataFim;
                                return (
                                  <button type="button" key={i} disabled={passes} onClick={() => handleDateClickCommon(dDia, dataInicio, dataFim, setDataInicio, setDataFim)} className={`w-full aspect-square flex items-center justify-center text-xs font-bold transition-all ${passes ? 'text-slate-300 pointer-events-none' : isI || isF ? 'bg-[#00577C] text-white rounded-lg' : isM ? 'bg-[#00577C]/10 text-[#00577C]' : 'text-slate-800 hover:bg-slate-200'}`}>
                                     {i + 1}
                                  </button>
                                );
                             })}
                          </div>
                       </div>
                       <div className="mt-3 bg-blue-50/50 border border-blue-100 px-4 py-2.5 rounded-xl text-xs font-bold text-[#00577C]">
                          Intervalo: {dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '...'} até {dataFim ? dataFim.toLocaleDateString('pt-BR') : '...'}
                       </div>
                    </div>

                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Valor da Diária para este intervalo</label>
                       <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">R$</div>
                          <input type="text" required placeholder="0,00" value={novoPreco} onChange={e => setNovoPreco(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm font-black text-slate-800 outline-none focus:border-[#00577C] focus:bg-white" />
                       </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                       <div className="text-left"><p className="text-xs font-black text-slate-800 uppercase">Quartos Livres para Venda</p></div>
                       <button type="button" onClick={() => setEstaDisponivel(!estaDisponivel)} className={`transition-colors ${estaDisponivel ? 'text-[#009640]' : 'text-slate-300'}`}>
                          {estaDisponivel ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                       </button>
                    </div>
                  </>
                )}

                {/* ── VISÃO 2: FORMULÁRIO EXCLUSIVO DE GUIAS ── */}
                {tipoParceiro === 'guia' && (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2">
                       <div className="sm:col-span-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Título do Passeio / Experiência</label>
                          <input required value={tituloPasseio} onChange={e => setTituloPasseio(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 focus:border-[#009640]" placeholder="Ex: Trilhas das Três Cachoeiras" />
                       </div>
                       <div className="sm:col-span-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Rota / Trajeto Detalhado</label>
                          <input required value={rotaPasseio} onChange={e => setRotaPasseio(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 focus:border-[#009640]" placeholder="Locais por onde os turistas passarão" />
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Ponto de Encontro</label>
                          <input required value={pontoEncontro} onChange={e => setPontoEncontro(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 focus:border-[#009640]" placeholder="Ex: Praça Central da Cidade" />
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Vagas do Grupo</label>
                          <input type="number" required value={vagasPasseio} onChange={e => setVagasPasseio(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 focus:border-[#009640]" />
                       </div>
                    </div>

                    {/* CALENDÁRIO GUIA (DATA ÚNICA) */}
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Data do Evento / Saída</label>
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
                                  <button type="button" key={i} disabled={passes} onClick={() => setDataPasseio(dDia)} className={`w-full aspect-square flex items-center justify-center text-xs font-bold rounded-lg ${passes ? 'text-slate-300' : isS ? 'bg-[#009640] text-white' : 'text-slate-800 hover:bg-slate-200'}`}>
                                     {i + 1}
                                  </button>
                                );
                             })}
                          </div>
                       </div>
                    </div>

                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Valor por Turista (R$)</label>
                       <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</div>
                          <input type="text" required placeholder="0,00" value={valorPasseio} onChange={e => setValorPasseio(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm font-black text-slate-800 focus:border-[#009640]" />
                       </div>
                    </div>
                  </>
                )}

                {/* ── VISÃO 3: FORMULÁRIO EXCLUSIVO DE AGÊNCIAS (MONTAR PACOTE AUTOMÁTICO) ── */}
                {tipoParceiro === 'pacote' && (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2">
                       <div className="sm:col-span-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Título Comercial do Pacote</label>
                          <input required value={tituloPacote} onChange={e => setTituloPacote(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 focus:border-[#00577C]" placeholder="Ex: Combo Fim de Semana no Araguaia" />
                       </div>
                       <div className="sm:col-span-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Breve Descrição</label>
                          <textarea required value={descricaoPacote} onChange={e => setDescricaoPacote(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 h-24 focus:border-[#00577C]" placeholder="Resumo dos benefícios inclusos..." />
                       </div>
                       
                       {/* SELECT DE HOTÉIS DISPONÍVEIS VINDO DO BANCO */}
                       <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">1. Escolha o Hotel Integrado</label>
                          <select value={hotelSelecionadoId} onChange={e => setHotelSelecionadoId(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 cursor-pointer">
                             <option value="">Nenhum hotel vinculado</option>
                             {hoteisDb.map(h => <option key={h.id} value={h.id}>{h.nome}</option>)}
                          </select>
                       </div>

                       {/* SELECT DE QUARTO DO PACOTE */}
                       <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Tipo de Quarto Oferecido</label>
                          <select value={tipoQuartoPacote} onChange={e => setTipoQuartoPacote(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 cursor-pointer">
                             <option value="standard">Standard Simples</option>
                             <option value="luxo">Suíte Luxo / Premium</option>
                          </select>
                       </div>

                       {/* SELECT DE GUIAS DISPONÍVEIS VINDO DO BANCO */}
                       <div className="sm:col-span-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">2. Vincular Guia de Turismo Parceiro</label>
                          <select value={guiaSelecionadoId} onChange={e => setGuiaSelecionadoId(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-800 cursor-pointer">
                             <option value="">Sem guia incluso no roteiro</option>
                             {guiasDb.map(g => <option key={g.id} value={g.id}>{g.nome} ({g.especialidade})</option>)}
                          </select>
                       </div>
                    </div>

                    {/* CALENDÁRIO INTERVALO PACOTE */}
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Período de Validade do Roteiro Completo</label>
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
                                  <button type="button" key={i} disabled={passes} onClick={() => handleDateClickCommon(dDia, dataInicioPacote, dataFimPacote, setDataInicioPacote, setDataFimPacote)} className={`w-full aspect-square flex items-center justify-center text-xs font-bold transition-all ${passes ? 'text-slate-300' : isI || isF ? 'bg-[#00577C] text-white rounded-lg' : isM ? 'bg-[#00577C]/10 text-[#00577C]' : 'text-slate-800 hover:bg-slate-200'}`}>
                                     {i + 1}
                                  </button>
                                );
                             })}
                          </div>
                       </div>
                    </div>

                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Valor Total do Combo Fechado (R$)</label>
                       <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</div>
                          <input type="text" required placeholder="0,00" value={valorPacote} onChange={e => setValorPacote(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm font-black text-slate-800 focus:border-[#00577C]" />
                       </div>
                    </div>
                  </>
                )}

                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl flex items-start gap-3 border border-amber-100 text-left">
                   <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
                   <p className="text-[10px] md:text-xs font-bold leading-relaxed">
                     Nota: De acordo com as diretrizes da SEMTUR, alterações estruturais de fotos ou descrições textuais das acomodações devem ser solicitadas diretamente à Secretaria de Turismo para validação e auditoria.
                   </p>
                </div>

                {/* BOTÃO SALVAR ADAPTÁVEL */}
                <button type="submit" disabled={isSubmitting} className={`w-full text-white py-4 rounded-xl font-black uppercase text-xs md:text-sm tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 ${tipoParceiro === 'hotel' ? 'bg-[#00577C] hover:bg-[#004a6b]' : tipoParceiro === 'guia' ? 'bg-[#009640] hover:bg-[#007a33]' : 'bg-slate-900 hover:bg-black'}`}>
                   {isSubmitting ? (
                      <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18}/> Processando no Supabase...</span>
                   ) : (
                      <span className="flex items-center gap-2"><Save size={16}/> Lançar e Sincronizar Serviço</span>
                   )}
                </button>

             </form>
          </div>

        </div>
      </div>
    </div>
  );
}