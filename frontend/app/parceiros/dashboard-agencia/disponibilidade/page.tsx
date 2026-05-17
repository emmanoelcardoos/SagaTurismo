'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, Home, LogOut, Bed, Compass, Save, Sparkles, 
  AlertCircle, CheckCircle2, Type, FileText, DollarSign, 
  Upload, ChevronLeft, ChevronRight, Check, ShieldCheck, Tag,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type Hotel = {
  id: string;
  nome: string;
  tipo: string;
  imagem_url?: string;
  quarto_standard_preco?: number;
};

type Guia = {
  id: string;
  nome: string;
  especialidade?: string;
  imagem_url?: string;
  preco_diaria: number;
};

export default function CriarPacotePage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  
  // Estados de Carregamento e Feedback
  const [verificandoInventario, setVerificandoInventario] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  // Inventário Filtrado e Categorias Dinâmicas
  const [hoteisDisponiveis, setHoteisDisponiveis] = useState<Hotel[]>([]);
  const [guiasDisponiveis, setGuiasDisponiveis] = useState<Guia[]>([]);
  const [categoriasDb, setCategoriasDb] = useState<string[]>([]);

  // Estados de Calendário de Intervalo (PC Exclusivo Bonito)
  const [mesAtual, setMesAtual] = useState<Date>(new Date());
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);

  // Seleções Finais
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [selectedGuiaId, setSelectedGuiaId] = useState<string | null>(null);
  const [hotelSelecionado, setHotelSelecionado] = useState<Hotel | null>(null);
  const [guiaSelecionado, setGuiaSelecionado] = useState<Guia | null>(null);

  // Arquivo de Capa
  const [arquivoCapa, setArquivoCapa] = useState<File | null>(null);

  // Campos do Formulário
  const [formData, setFormData] = useState({
    titulo: '',
    descricao_curta: '',
    roteiro_detalhado: '',
    categoria: '',
    horarios_info: '',
    precoCustomizado: '',
    ativo: true
  });

  // Cálculo Automático de Dias e Noites baseado no Intervalo do Calendário
  const noitesCalculadas = dataInicio && dataFim 
    ? Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)) 
    : 0;
  const diasCalculados = noitesCalculadas > 0 ? noitesCalculadas + 1 : 0;

  // 1. VALIDAÇÃO DE ACESSO E CATEGORIAS REAIS DO SUPABASE
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const tipo = localStorage.getItem("tipo_parceiro"); 
    if (!id || (tipo !== 'agencia' && tipo !== 'semtur' && tipo !== 'pacote')) {
      router.push('/parceiros');
      return;
    }
    setParceiroId(id);

    async function puxarCategoriasReais() {
      const { data } = await supabase.from('pacotes').select('categoria');
      if (data) {
        const catsUnicas = Array.from(new Set(data.map(p => p.categoria).filter(Boolean))) as string[];
        setCategoriasDb(catsUnicas.length > 0 ? catsUnicas : ['Aventura', 'Trilha', 'Praia', 'Cachoeira']);
        setFormData(prev => ({ ...prev, categoria: catsUnicas[0] || 'Aventura' }));
      }
    }
    puxarCategoriasReais();
  }, [router]);

  // 2. MOTOR DE VERIFICAÇÃO OPERACIONAL BASEADO NO INTERVALO DE DIAS
  useEffect(() => {
    if (!dataInicio || !dataFim) {
      setHoteisDisponiveis([]);
      setGuiasDisponiveis([]);
      setSelectedHotelId(null);
      setSelectedGuiaId(null);
      setHotelSelecionado(null);
      setGuiaSelecionado(null);
      return;
    }

    async function filtrarInventarioPorIntervalo() {
      setVerificandoInventario(true);
      setErro(null);

      const dInicioStr = formatarDataIso(dataInicio);
      const dFimStr = formatarDataIso(dataFim);

      try {
        // [A] Filtra hotéis que possuem bloqueios ou estão indisponíveis no intervalo escolhido
        const { data: bloqueios } = await supabase
          .from('disponibilidade_hoteis')
          .select('hotel_id, disponivel')
          .lte('data_inicio', dFimStr)
          .gte('data_fim', dInicioStr);

        const hoteisIndisponiveisIds = (bloqueios || [])
          .filter(b => b.disponivel === false)
          .map(b => b.hotel_id);

        const { data: todosHoteis } = await supabase
          .from('hoteis')
          .select('id, nome, tipo, imagem_url, quarto_standard_preco');

        if (todosHoteis) {
          const validados = todosHoteis.filter(h => !hoteisIndisponiveisIds.includes(h.id));
          setHoteisDisponiveis(validados as Hotel[]);
        }

        // [B] Filtra guias que já possuem saídas agendadas cruzando o período
        const { data: conflitosGuias } = await supabase
          .from('passeios')
          .select('guia_id')
          .lte('data_passeio', dFimStr)
          .gte('data_passeio', dInicioStr);

        const guiasOcupadosIds = (conflitosGuias || []).map(c => c.guia_id).filter(Boolean);

        const { data: todosGuias } = await supabase
          .from('guia_id' === 'id' ? 'guias' : 'guias') // Sanidade de string estrita
          .select('id, nome, especialidade, imagem_url, preco_diaria');

        if (todosGuias) {
          const livres = todosGuias.filter(g => !guiasOcupadosIds.includes(g.id));
          setGuiasDisponiveis(livres as Guia[]);
        }

      } catch (err) {
        console.error(err);
        setErro("Erro de inventário na consolidação de datas.");
      } finally {
        setVerificandoInventario(false);
      }
    }

    filtrarInventarioPorIntervalo();
  }, [dataInicio, dataFim]);

  // Update de objetos selecionados para a fatura final
  useEffect(() => {
    setHotelSelecionado(hoteisDisponiveis.find(h => h.id === selectedHotelId) || null);
  }, [selectedHotelId, hoteisDisponiveis]);

  useEffect(() => {
    setGuiaSelecionado(guiasDisponiveis.find(g => g.id === selectedGuiaId) || null);
  }, [selectedGuiaId, guiasDisponiveis]);

  const precoSugerido = (hotelSelecionado?.quarto_standard_preco || 0) * noitesCalculadas + 
                        (guiaSelecionado?.preco_diaria || 0) * diasCalculados;

  const formatarDataIso = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  const limparNomeArquivo = (nomeOriginal: string) => nomeOriginal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9.]/g, '_').replace(/_{2,}/g, '_');         

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/parceiros');
  };

  const handleLancarCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotelId || !selectedGuiaId || !dataInicio || !dataFim) {
      setErro("Complete todas as fases operacionais e de inventário primeiro.");
      return;
    }
    if (!arquivoCapa) {
      setErro("A foto de capa é obrigatória.");
      return;
    }

    setEnviando(true);
    setErro(null);

    const precoFinal = parseFloat(formData.precoCustomizado.replace(',', '.')) || precoSugerido;

    try {
      const nomeLimpo = limparNomeArquivo(arquivoCapa.name);
      const pathCapa = `pacotes/${parceiroId}_${Date.now()}_${nomeLimpo}`;
      
      const { error: errUpload } = await supabase.storage.from('imagens-passeios').upload(pathCapa, arquivoCapa);
      if (errUpload) throw new Error("Falha no upload do arquivo.");

      const { data: urlPublica } = supabase.storage.from('imagens-passeios').getPublicUrl(pathCapa);

      const { data: novoPacote, error: errPacote } = await supabase
        .from('pacotes')
        .insert([{
          titulo: formData.titulo,
          descricao_curta: formData.descricao_curta,
          roteiro_detalhado: formData.roteiro_detalhado,
          imagem_principal: urlPublica.publicUrl,
          dias: diasCalculados,
          noites: noitesCalculadas,
          preco: precoFinal,
          categoria: formData.categoria,
          horarios_info: formData.horarios_info || null,
          ativo: formData.ativo
        }])
        .select().single();

      if (errPacote || !novoPacote) throw errPacote;

      const { error: errItens } = await supabase
        .from('pacote_itens')
        .insert([{ pacote_id: novoPacote.id, hotel_id: selectedHotelId, guia_id: selectedGuiaId }]);

      if (errItens) throw errItens;

      setSucesso(true);
      setTimeout(() => router.push('/parceiros/dashboard-agencia'), 2000);

    } catch (err: any) {
      console.error(err);
      setErro(err.message || "Falha na transação.");
    } finally {
      setEnviando(false);
    }
  };

  const anoCorrente = mesAtual.getFullYear();
  const mesCorrente = mesAtual.getMonth();
  const diasMes = new Date(anoCorrente, mesCorrente + 1, 0).getDate();
  const primeiroDia = new Date(anoCorrente, mesCorrente, 1).getDay();
  const hoje = new Date(); hoje.setHours(0,0,0,0);

  const IMG_FALLBACK = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1721";

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8FAFC] text-slate-900 pb-20`}>
      
      {/* HEADER PROFISSIONAL EXECUTIVO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <Link href="/" className="relative h-10 w-28 md:w-36 shrink-0 transition-transform active:scale-95">
            <Image src="/logop.png" alt="SagaTurismo" fill priority className="object-contain object-left" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-full shadow-sm">
              <Home size={14} /> <span>Homepage</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-black px-4 py-2.5 rounded-full shadow-sm transition-colors">
              <LogOut size={14} /> <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 mt-10 space-y-8">
        
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <AlertCircle size={18} className="shrink-0 text-red-500" />
            <p className="text-xs font-bold">{erro}</p>
          </div>
        )}

        {sucesso && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <CheckCircle2 size={18} className="shrink-0 text-green-600" />
            <p className="text-xs font-bold">Pacote consolidado com sucesso!</p>
          </div>
        )}

        <form onSubmit={handleLancarCombo} className="space-y-8">
          
          {/* FASE 1: CRONOGRAMA E MARKETING */}
          <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-[#0085FF] text-white p-2 rounded-xl"><Type size={18} /></div>
              <h2 className={`${jakarta.className} text-base font-black text-slate-800`}>Fase 1: Logística e Período do Roteiro</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Título do Pacote</label>
                <input required type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} placeholder="Ex: Expedição Araguaia Selvagem" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Categoria Oficial</label>
                <select name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none bg-slate-50/50 cursor-pointer text-slate-700 capitalize">
                  {categoriasDb.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><CalendarIcon size={14}/> Definir Intervalo de Dias do Combo (Apenas no PC)</label>
                 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner">
                    <div className="flex items-center justify-between mb-4">
                       <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente - 1))} className="p-1 hover:bg-slate-200 rounded-full"><ChevronLeft size={16}/></button>
                       <p className="font-bold text-slate-800 capitalize text-xs">{mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                       <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente + 1))} className="p-1 hover:bg-slate-200 rounded-full"><ChevronRight size={16}/></button>
                    </div>
                    <div className="grid grid-cols-7 gap-y-1 text-center">
                       {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <span key={d} className="text-[9px] font-black text-slate-400 uppercase">{d}</span>)}
                       {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                       {Array.from({ length: diasMes }).map((_, i) => {
                          const dDia = new Date(anoCorrente, mesCorrente, i + 1);
                          const passes = dDia < hoje;
                          const isI = dataInicio && dDia.getTime() === dataInicio.getTime();
                          const isF = dataFim && dDia.getTime() === dataFim.getTime();
                          const isM = dataInicio && dataFim && dDia > dataInicio && dDia < dataFim;
                          return (
                            <button type="button" key={i} disabled={passes} onClick={() => handleDateClick(dDia)} className={`w-full aspect-square flex items-center justify-center text-xs font-bold rounded-lg transition-all ${passes ? 'text-slate-300 pointer-events-none' : isI || isF ? 'bg-[#0085FF] text-white shadow-sm scale-105' : isM ? 'bg-blue-50 text-[#0085FF]' : 'text-slate-800 hover:bg-slate-200'}`}>
                               {i + 1}
                            </button>
                          );
                       })}
                    </div>
                 </div>
                 {dataInicio && (
                    <div className="bg-blue-50/60 border border-blue-100 text-[#0085FF] px-4 py-2 rounded-xl text-xs font-bold w-fit mt-2">
                       Período: {dataInicio.toLocaleDateString('pt-BR')} {dataFim ? `até ${dataFim.toLocaleDateString('pt-BR')} (${diasCalculados} Dias / ${noitesCalculadas} Noites)` : '(Escolha o dia de término)'}
                    </div>
                 )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><MapPin size={12}/> Detalhes de Embarque</label>
                <input type="text" name="horarios_info" value={formData.horarios_info} onChange={handleInputChange} placeholder="Ex: Saídas às 08:00h da Orla Principal" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Foto de Capa do Combo (Upload Direto)</label>
                <label className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl py-3.5 px-4 text-xs font-bold text-slate-500 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                   <Upload size={16} className="text-[#0085FF]"/>
                   <span className="truncate">{arquivoCapa ? arquivoCapa.name : 'Carregar imagem do computador'}</span>
                   <input required type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setArquivoCapa(e.target.files[0])} />
                </label>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider"><FileText size={12}/> Resumo para Vitrine</label>
                <textarea required rows={2} name="descricao_curta" value={formData.descricao_curta} onChange={handleInputChange} placeholder="Breve resumo comercial..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50 resize-none" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider"><FileText size={12}/> Roteiro Completo</label>
                <textarea required rows={4} name="roteiro_detalhado" value={formData.roteiro_detalhado} onChange={handleInputChange} placeholder="Descrição detalhada do roteiro..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50 resize-y" />
              </div>
            </div>
          </section>

          {/* FASE 2: REDE HOTELEIRA FILTRADA */}
          <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-5 text-left relative">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-amber-500 text-white p-2 rounded-xl"><Bed size={18} /></div>
              <h2 className={`${jakarta.className} text-base font-black text-slate-800`}>Fase 2: Alojamento Disponível no Período</h2>
            </div>

            {verificandoInventario && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 py-6 justify-center bg-slate-50 rounded-2xl"><Loader2 className="animate-spin text-amber-500" size={16}/> Mapeando quartos livres...</div>
            )}

            {!dataInicio || !dataFim ? (
              <div className="text-center py-8 text-xs font-bold text-slate-400 bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl">Aguardando definição do intervalo no calendário acima.</div>
            ) : null}

            {dataInicio && dataFim && !verificandoInventario && hoteisDisponiveis.length === 0 && (
              <div className="p-4 bg-red-50 text-red-800 rounded-xl text-xs font-bold border border-red-100">Nenhum hotel parceiro possui quartos livres nestas datas.</div>
            )}

            {dataInicio && dataFim && !verificandoInventario && hoteisDisponiveis.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-1">
                 {hoteisDisponiveis.map(hotel => {
                   const isSel = selectedHotelId === hotel.id;
                   return (
                     <div key={hotel.id} onClick={() => setSelectedHotelId(hotel.id)} className={`cursor-pointer border-2 rounded-2xl p-3 flex gap-3 items-center transition-all bg-white relative ${isSel ? 'border-[#0085FF] bg-blue-50/20' : 'border-slate-100 hover:border-slate-300'}`}>
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          <Image src={hotel.imagem_url || IMG_FALLBACK} alt={hotel.nome} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                           <h4 className="font-black text-xs text-slate-900 truncate">{hotel.nome}</h4>
                           <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{hotel.tipo}</p>
                           <p className="text-[10px] font-black text-amber-600 mt-1">Diária: R$ {hotel.quarto_standard_preco || '0'}</p>
                        </div>
                        {isSel && <div className="absolute top-2 right-2 w-4 h-4 bg-[#0085FF] text-white rounded-full flex items-center justify-center"><Check size={10}/></div>}
                     </div>
                   );
                 })}
              </div>
            )}
          </section>

          {/* FASE 3: CONDUTORES DE TURISMO LIVRES */}
          <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-5 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-[#009640] text-white p-2 rounded-xl"><Compass size={18} /></div>
              <h2 className={`${jakarta.className} text-base font-black text-slate-800`}>Fase 3: Condutores de Turismo Livres no Período</h2>
            </div>

            {verificandoInventario && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 py-6 justify-center bg-slate-50 rounded-2xl"><Loader2 className="animate-spin text-green-600" size={16}/> Inspecionando agendas...</div>
            )}

            {!dataInicio || !dataFim ? (
              <div className="text-center py-8 text-xs font-bold text-slate-400 bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl">Aguardando definição do intervalo no calendário acima.</div>
            ) : null}

            {dataInicio && dataFim && !verificandoInventario && guiasDisponiveis.length === 0 && (
              <div className="p-4 bg-red-50 text-red-800 rounded-xl text-xs font-bold border border-red-100">Todos os guias possuem expedições marcadas para este período.</div>
            )}

            {dataInicio && dataFim && !verificandoInventario && guiasDisponiveis.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-1">
                 {guiasDisponiveis.map(guia => {
                   const isSel = selectedGuiaId === guia.id;
                   return (
                     <div key={guia.id} onClick={() => setSelectedGuiaId(guia.id)} className={`cursor-pointer border-2 rounded-2xl p-3 flex gap-3 items-center transition-all bg-white relative ${isSel ? 'border-[#009640] bg-green-50/10' : 'border-slate-100 hover:border-slate-300'}`}>
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          <Image src={guia.imagem_url || IMG_FALLBACK} alt={guia.nome} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                           <h4 className="font-black text-xs text-slate-900 truncate">{guia.nome}</h4>
                           <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{guia.especialidade || 'Geral'}</p>
                           <p className="text-[10px] font-black text-green-700 mt-1">Diária: R$ {guia.preco_diaria}</p>
                        </div>
                        {isSel && <div className="absolute top-2 right-2 w-4 h-4 bg-[#009640] text-white rounded-full flex items-center justify-center"><Check size={10}/></div>}
                     </div>
                   );
                 })}
              </div>
            )}
          </section>

          {/* FASE 4: PRECIFICAÇÃO E LANÇAMENTO FINAL */}
          <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-5 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-[#0085FF] text-white p-2 rounded-xl"><Sparkles size={18} /></div>
              <h2 className={`${jakarta.className} text-base font-black text-slate-800`}>Fase 4: Consolidação Orçamental do Combo</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
               <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Balanço do Custo Base</span>
                  <div className="text-xs font-bold text-slate-600 space-y-1">
                     <p>Alojamento: {hotelSelecionado ? `${hotelSelecionado.nome} (R$ ${hotelSelecionado.quarto_standard_preco} × ${noitesCalculadas} Noites)` : 'Nenhum hotel selecionado'}</p>
                     <p>Logística: {guiaSelecionado ? `${guiaSelecionado.nome} (R$ ${guiaSelecionado.preco_diaria} × ${diasCalculados} Dias)` : 'Nenhum guia selecionado'}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                     <p className="text-xs font-black text-slate-500">Custo Combinado Sugerido: <span className="text-slate-900 text-sm">R$ {precoSugerido.toFixed(2)}</span></p>
                  </div>
               </div>

               <div className="space-y-1.5 justify-center flex flex-col">
                  <label className="text-xs font-black text-[#0085FF] uppercase tracking-wider flex items-center gap-1"><Tag size={12}/> Definir Preço Final de Venda (R$)</label>
                  <div className="relative">
                     <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                     <input type="text" name="precoCustomizado" value={formData.precoCustomizado} onChange={handleInputChange} placeholder={precoSugerido > 0 ? precoSugerido.toFixed(2) : "0,00"} className="w-full border-2 border-slate-200 rounded-xl py-3 pl-9 pr-4 text-base font-black text-slate-900 outline-none focus:border-[#0085FF] bg-white shadow-sm" />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400">Deixa vazio para assumir automaticamente o preço sugerido do cálculo base.</p>
               </div>
            </div>
          </section>

          {/* SUBMISSÃO */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 gap-4 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#0085FF]" /> Validação Comercial Homologada</p>
             <button 
               type="submit" 
               disabled={enviando || !selectedHotelId || !selectedGuiaId || !dataInicio || !dataFim}
               className="w-full sm:w-auto bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all active:scale-95 cursor-pointer"
            >
              {enviando ? <><Loader2 className="w-4 h-4 animate-spin"/> Registando e Publicando...</> : <><Save size={14}/> Lançar e Sincronizar Pacote</>}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}