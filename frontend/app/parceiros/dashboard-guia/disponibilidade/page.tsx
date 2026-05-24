'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, CheckCircle2, Save, Compass, 
  ChevronLeft, ChevronRight, DollarSign, Users, 
  MapPin, Trash2, Upload, Images, MailWarning, Calendar as CalendarIcon, Plus, Target, Bed, ShoppingBag, X, handleGaleriaChange
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type PasseioCadastrado = {
  id: string;
  titulo: string;
  data_passeio: string;
  valor_total: number;
  vagas_totais: number;
  vagas_disponiveis: number;
  categoria: string;
};

type EnderecoBusca = {
  display_name: string;
  lat: string;
  lon: string;
};

type HotelDisponivel = {
  id: string;
  preco: number;
  hotel_id: string;
  tipo_quarto: string;
  hoteis: {
    id: string;
    nome: string;
    imagem_url: string;
  } | null;
};

type ServicoExtra = {
  id: string;
  nome: string;
  valorTotal: number;
  dividirPorPessoa: boolean;
};

export default function DisponibilidadeGuiaPage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string>('');
  const [loadingSessao, setLoadingSessao] = useState(true);

  // ── ESTADOS DE FEEDBACK ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMensagem, setStatusMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);
  const [mesAtual, setMesAtual] = useState<Date>(new Date());

  // ── ESTADOS DO FORMULÁRIO ──
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [categoriasDb, setCategoriasDb] = useState<string[]>(['Trilha', 'Praia', 'Camping', 'Cachoeira']);
  const [descricaoCurta, setDescricaoCurta] = useState('');
  const [horarioSaida, setHorarioSaida] = useState('');
  const [pontoEncontro, setPontoEncontro] = useState('');
  const [coordenadas, setCoordenadas] = useState('');
  const [vagasTotais, setVagasTotais] = useState('15');
  
  // Calendário (Intervalos)
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);

  // ── CONSTRUÇÃO DE PREÇO ──
  const [valorBaseGuia, setValorBaseGuia] = useState(''); 
  
  // Hotéis
  const [desejaHotel, setDesejaHotel] = useState(false);
  const [hoteisDisponiveis, setHoteisDisponiveis] = useState<HotelDisponivel[]>([]);
  const [buscandoHoteis, setBuscandoHoteis] = useState(false);
  const [hotelSelecionadoId, setHotelSelecionadoId] = useState<string>('');
  
  // Serviços Extra
  const [servicosExtras, setServicosExtras] = useState<ServicoExtra[]>([]);
  const [novoServicoNome, setNovoServicoNome] = useState('');
  const [novoServicoValor, setNovoServicoValor] = useState('');
  const [dividirServico, setDividirServico] = useState(false);

  // Arquivos
  const [arquivoCapa, setArquivoCapa] = useState<File | null>(null);
  const [arquivosGaleria, setArquivosGaleria] = useState<File[]>([]);

  // Busca Endereço
  const [sugestoesEndereco, setSugestoesEndereco] = useState<EnderecoBusca[]>([]);
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);
  const [passeiosExistentes, setPasseiosExistentes] = useState<PasseioCadastrado[]>([]);

  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");
    const tipo = localStorage.getItem("tipo_parceiro");
    if (!id || tipo !== 'guia') router.push('/parceiros');
    else { setParceiroId(id); setNomeNegocio(nome || 'Guia de Turismo'); setLoadingSessao(false); }
  }, [router]);

  useEffect(() => {
    if (!parceiroId) return;
    async function carregarPasseios() {
      const { data } = await supabase.from('passeios').select('id, titulo, data_passeio, valor_total, vagas_totais, vagas_disponiveis, categoria, guia_id').order('data_passeio', { ascending: true });
      if (data) {
        setPasseiosExistentes(data.filter(p => p.guia_id === parceiroId) as any);
        const catsUnicas = Array.from(new Set(data.map(p => p.categoria).filter(Boolean)));
        if (catsUnicas.length > 0) { setCategoriasDb(catsUnicas as string[]); setCategoria(catsUnicas[0] as string); }
      }
    }
    carregarPasseios();
  }, [parceiroId, isSubmitting]);

  // BUSCAR HOTÉIS DE ACORDO COM A DISPONIBILIDADE E RETORNAR METADADOS DA TABELA HOTEIS
  useEffect(() => {
    async function fetchHoteisDisponiveis() {
      if (!dataInicio || !dataFim || !desejaHotel) {
        setHoteisDisponiveis([]);
        setHotelSelecionadoId('');
        return;
      }
      setBuscandoHoteis(true);
      const isoInicio = formatarDataIso(dataInicio);
      const isoFim = formatarDataIso(dataFim);

      // Faz a pesquisa associando os dados estruturais da tabela 'hoteis'
      const { data, error } = await supabase
        .from('disponibilidade_hoteis')
        .select(`
          id, preco, hotel_id, tipo_quarto,
          hoteis ( id, nome, imagem_url )
        `)
        .eq('disponivel', true)
        .lte('data_inicio', isoInicio)
        .gte('data_fim', isoFim);

      if (data && !error) {
        // Filtra para garantir que apenas registros com hotéis válidos vinculados apareçam
        const mapeados = (data as any[]).map(d => ({
          id: d.id,
          preco: Number(d.preco),
          hotel_id: d.hotel_id,
          tipo_quarto: d.tipo_quarto,
          hoteis: d.hoteis
        })).filter(h => h.hoteis !== null);

        setHoteisDisponiveis(mapeados);
      } else {
        setHoteisDisponiveis([]);
      }
      setBuscandoHoteis(false);
    }
    fetchHoteisDisponiveis();
  }, [dataInicio, dataFim, desejaHotel]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (pontoEncontro.length > 3 && !coordenadas) {
        setBuscandoEndereco(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pontoEncontro + ', São Geraldo do Araguaia, Pará')}&limit=4`);
          setSugestoesEndereco(await res.json());
        } catch (error) {} finally { setBuscandoEndereco(false); }
      } else { setSugestoesEndereco([]); }
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [pontoEncontro, coordenadas]);

  const selecionarEndereco = (end: EnderecoBusca) => {
    setPontoEncontro(end.display_name.split(',').slice(0, 2).join(', '));
    setCoordenadas(`${end.lat}, ${end.lon}`);
    setSugestoesEndereco([]);
  };

  const formatarDataIso = (data: Date | null) => {
    if (!data) return '';
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  };

  const handleDateClick = (dDia: Date) => {
    if (!dataInicio || (dataInicio && dataFim)) {
      setDataInicio(dDia);
      setDataFim(null);
      setHotelSelecionadoId('');
    } else if (dDia < dataInicio) {
      setDataInicio(dDia);
      setHotelSelecionadoId('');
    } else {
      setDataFim(dDia);
    }
  };

  // ── LÓGICA DE CÁLCULO DE PREÇO ──
  const numeroVagas = parseInt(vagasTotais) || 1;
  const noites = dataInicio && dataFim 
    ? Math.max(1, Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))) 
    : 1;

  const valorBaseConvertido = parseFloat(valorBaseGuia.replace(',', '.')) || 0;
  
  const hotelSelecionado = hoteisDisponiveis.find(h => h.id === hotelSelecionadoId);
  const valorHotelCalculado = hotelSelecionado ? hotelSelecionado.preco * noites : 0;
  
  const valorTotalExtrasPorPessoa = servicosExtras.reduce((acc, curr) => {
    if (curr.dividirPorPessoa) return acc + (curr.valorTotal / numeroVagas);
    return acc + curr.valorTotal;
  }, 0);
  
  const valorTotalCalculado = valorBaseConvertido + valorHotelCalculado + valorTotalExtrasPorPessoa;

  const handleAddServicoExtra = () => {
    if (!novoServicoNome || !novoServicoValor) return;
    const vConvertido = parseFloat(novoServicoValor.replace(',', '.'));
    if (isNaN(vConvertido)) return;

    setServicosExtras([...servicosExtras, { id: Math.random().toString(), nome: novoServicoNome, valorTotal: vConvertido, dividirPorPessoa: dividirServico }]);
    setNovoServicoNome('');
    setNovoServicoValor('');
    setDividirServico(false);
  };

  const handleRemoverServicoExtra = (id: string) => {
    setServicosExtras(servicosExtras.filter(s => s.id !== id));
  };

  const handleCriarPasseio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parceiroId) return;
    if (!dataInicio) { setStatusMensagem({ tipo: 'erro', texto: 'Por favor, selecione as datas do passeio.' }); return; }
    if (!arquivoCapa) { setStatusMensagem({ tipo: 'erro', texto: 'Anexe uma foto de capa para o pacote.' }); return; }
    if (valorTotalCalculado <= 0) { setStatusMensagem({ tipo: 'erro', texto: 'O valor final do passeio tem de ser maior que zero.' }); return; }

    setIsSubmitting(true);
    setStatusMensagem(null);
    const taxaPref = valorTotalCalculado * 0.10;

    const detalhes_composicao_preco = {
       valor_guia_por_pessoa: valorBaseConvertido,
       hotel: hotelSelecionado ? { id: hotelSelecionado.hotel_id, nome: hotelSelecionado.hoteis?.nome, valor_total_hospedagem: valorHotelCalculado, noites_calculadas: noites } : null,
       extras: servicosExtras,
       data_inicio: formatarDataIso(dataInicio),
       data_fim: formatarDataIso(dataFim)
    };

    try {
      const pathCapa = `capas/${parceiroId}_${Date.now()}`;
      const { error: errCapa } = await supabase.storage.from('imagens-passeios').upload(pathCapa, arquivoCapa);
      if (errCapa) throw new Error('Falha no upload da foto de capa.');
      const { data: urlCapaPublica } = supabase.storage.from('imagens-passeios').getPublicUrl(pathCapa);

      const urlsGaleria: string[] = [];
      for (const file of arquivosGaleria) {
        const pathFoto = `galeria/${parceiroId}_${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
        const { error: errFoto } = await supabase.storage.from('imagens-passeios').upload(pathFoto, file);
        if (!errFoto) {
          const { data: urlFoto } = supabase.storage.from('imagens-passeios').getPublicUrl(pathFoto);
          urlsGaleria.push(urlFoto.publicUrl);
        }
      }

      const { error: errInsert } = await supabase.from('passeios').insert([{
          titulo, descricao_curta: descricaoCurta,
          descricao_completa: JSON.stringify(detalhes_composicao_preco),
          imagem_principal: urlCapaPublica.publicUrl, imagens_galeria: urlsGaleria,
          data_passeio: formatarDataIso(dataInicio), 
          horario_saida: horarioSaida || null, ponto_encontro: pontoEncontro || null,
          coordenadas_google_maps: coordenadas || null,
          nome_guia: nomeNegocio, guia_id: parceiroId,
          valor_total: valorTotalCalculado, taxa_prefeitura: taxaPref,
          vagas_totais: parseInt(vagasTotais), vagas_disponiveis: parseInt(vagasTotais),
          categoria, ativo: false, destaque: false 
      }]);

      if (errInsert) throw errInsert;

      setStatusMensagem({ tipo: 'sucesso', texto: 'Pacote enviado com sucesso! Aguarde a aprovação.' });
      setTitulo(''); setDescricaoCurta(''); setHorarioSaida(''); setPontoEncontro(''); setCoordenadas(''); 
      setDataInicio(null); setDataFim(null); setArquivoCapa(null); setArquivosGaleria([]);
      setValorBaseGuia(''); setHotelSelecionadoId(''); setServicosExtras([]); setDesejaHotel(false);

    } catch (err: any) {
      setStatusMensagem({ tipo: 'erro', texto: err.message || 'Erro interno.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletarPasseio = async (idPasseio: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta expedição?")) return;
    try {
      const { error } = await supabase.from('passeios').delete().eq('id', idPasseio);
      if (error) throw error;
      setPasseiosExistentes(prev => prev.filter(p => p.id !== idPasseio));
    } catch (err) {}
  };

  const anoCorrente = mesAtual.getFullYear();
  const mesCorrente = mesAtual.getMonth();
  const diasMes = new Date(anoCorrente, mesCorrente + 1, 0).getDate();
  const primeiroDia = new Date(anoCorrente, mesCorrente, 1).getDay();
  const hoje = new Date(); hoje.setHours(0,0,0,0);

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col`}>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <Link href="/" className="relative h-10 w-28 md:w-36 shrink-0"><Image src="/logop.png" alt="SGA" fill priority className="object-contain object-left" /></Link>
          <Link href="/parceiros/dashboard-guia" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#009640] bg-green-50 border border-green-100 px-4 py-2.5 rounded-full shadow-sm transition-all active:scale-95">
            <ArrowLeft size={14} /> <span className="hidden sm:inline">Painel</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:py-10 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* FORMULÁRIO DE CRIAÇÃO */}
        <div className="w-full lg:flex-1 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#009640] flex items-center justify-center text-white shadow-md shrink-0"><Plus size={24} /></div>
            <div>
               <h2 className={`${jakarta.className} text-2xl font-black text-slate-900 leading-none`}>Nova Expedição</h2>
               <p className="text-sm font-medium text-slate-500 mt-1">Construa o seu pacote turístico completo.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8">
             {statusMensagem && (
                <div className={`p-4 rounded-2xl mb-8 flex items-start gap-3 border ${statusMensagem.tipo === 'sucesso' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                   <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                   <p className="text-sm font-bold">{statusMensagem.texto}</p>
                </div>
             )}

             <form onSubmit={handleCriarPasseio} className="space-y-7">
                
                {/* BLOCO 1: A AVENTURA */}
                <div className="space-y-4">
                   <h3 className={`${jakarta.className} text-lg font-black text-[#009640] flex items-center gap-2 border-b border-slate-100 pb-2`}><Compass size={18}/> A Aventura</h3>
                   
                   <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">Qual o nome da aventura?</label>
                      <input required type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium outline-none focus:border-[#009640]" placeholder="Ex: Trilha da Serra Mágica" />
                   </div>
                   
                   <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">Selecione o período no calendário ao lado</label>
                      <div className="flex gap-4">
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-[#009640]">
                           Início: {dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '---'}
                        </div>
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-[#00577C]">
                           Fim: {dataFim ? dataFim.toLocaleDateString('pt-BR') : (dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '---')}
                        </div>
                      </div>
                      {dataInicio && dataFim && (
                         <span className="text-[11px] bg-slate-100 font-bold px-3 py-1 rounded-full text-slate-600 mt-2 inline-block">Duração total: {noites} {noites === 1 ? 'diária' : 'diárias'}</span>
                      )}
                   </div>

                   <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">Que tipo é?</label>
                      <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium outline-none focus:border-[#009640] cursor-pointer capitalize">
                         {categoriasDb.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                         <option value="Outros">Outro...</option>
                      </select>
                   </div>

                   <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">Descrição Curta</label>
                      <input required type="text" value={descricaoCurta} onChange={e => setDescricaoCurta(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium outline-none focus:border-[#009640]" placeholder="Uma caminhada perfeita..." />
                   </div>
                </div>

                {/* BLOCO 2: LOGÍSTICA */}
                <div className="space-y-4">
                   <h3 className={`${jakarta.className} text-lg font-black text-[#009640] flex items-center gap-2 border-b border-slate-100 pb-2`}><MapPin size={18}/> Logística</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">Horário de Saída</label>
                        <input type="time" required value={horarioSaida} onChange={e => setHorarioSaida(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium outline-none focus:border-[#009640]" />
                     </div>
                     <div className="relative">
                        <label className="text-xs font-bold text-slate-700 block mb-2">Ponto de Encontro</label>
                        <input type="text" required value={pontoEncontro} onChange={e => { setPontoEncontro(e.target.value); setCoordenadas(''); }} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium outline-none focus:border-[#009640]" placeholder="Escreva para buscar..." />
                        {sugestoesEndereco.length > 0 && (
                          <div className="absolute z-20 top-[105%] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                            {sugestoesEndereco.map((end, idx) => (
                              <button key={idx} type="button" onClick={() => selecionarEndereco(end)} className="w-full text-left px-4 py-3 text-xs font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100"><Target size={14} className="inline mr-2 text-[#009640]" />{end.display_name}</button>
                            ))}
                          </div>
                        )}
                     </div>
                   </div>

                   <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">Vagas Totais</label>
                      <div className="relative">
                         <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                         <input type="number" required value={vagasTotais} onChange={e => setVagasTotais(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-[#009640]" />
                      </div>
                   </div>
                </div>

                {/* BLOCO 3: CONSTRUÇÃO DE PREÇO */}
                <div className="space-y-4 pt-4">
                   <h3 className={`${jakarta.className} text-lg font-black text-[#00577C] flex items-center gap-2 border-b border-slate-100 pb-2`}><DollarSign size={18}/> Construção do Preço Final</h3>
                   
                   <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-5">
                      
                      {/* Valor Base */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">Valor Base do Guia (Por Pessoa)</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">R$</span>
                           <input type="text" required placeholder="0,00" value={valorBaseGuia} onChange={e => setValorBaseGuia(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-black text-slate-900 outline-none focus:border-[#00577C]" />
                        </div>
                      </div>

                      {/* Adicionar Hotel Disponível para os Dias Escolhidos */}
                      <div className="border-t border-blue-100/50 pt-4">
                         <label className="flex items-center gap-3 cursor-pointer group mb-4">
                           <input type="checkbox" checked={desejaHotel} onChange={(e) => {setDesejaHotel(e.target.checked); setHotelSelecionadoId('');}} className="w-5 h-5 text-[#00577C] rounded border-slate-300" />
                           <span className="font-bold text-slate-800 text-sm flex items-center gap-2"><Bed size={16} className="text-[#00577C]"/> Vincular Hotel disponível para este período?</span>
                         </label>

                         {desejaHotel && (!dataInicio || !dataFim ? (
                            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">Por favor, selecione o intervalo completo (Início e Fim) no calendário ao lado primeiro.</p>
                         ) : buscandoHoteis ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={16}/> Verificando disponibilidade no banco de dados...</div>
                         ) : hoteisDisponiveis.length === 0 ? (
                            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">Sem hotéis com vagas confirmadas ou ativos para este período exato.</p>
                         ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                               {hoteisDisponiveis.map(h => (
                                 <div key={h.id} onClick={() => setHotelSelecionadoId(h.id)} className={`cursor-pointer border-2 rounded-2xl p-3 flex gap-3 items-center transition-all ${hotelSelecionadoId === h.id ? 'border-[#00577C] bg-[#00577C]/5' : 'border-slate-200 bg-white hover:border-[#00577C]/50'}`}>
                                    {h.hoteis?.imagem_url && (
                                       <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative shadow-sm">
                                          <Image src={h.hoteis.imagem_url} alt="Hotel" fill className="object-cover" />
                                       </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                       <p className="text-xs font-black text-slate-800 truncate">{h.hoteis?.nome}</p>
                                       <p className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">Quarto: {h.tipo_quarto}</p>
                                       <p className="text-[10px] font-black text-[#009640] mt-1">R$ {h.preco.toFixed(2)} / diária</p>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         ))}
                      </div>

                      {/* Adicionar Extras */}
                      <div className="border-t border-blue-100/50 pt-4">
                         <label className="text-xs font-bold text-slate-700 block mb-3 flex items-center gap-2"><ShoppingBag size={14} className="text-[#00577C]"/> Outros Custos Adicionais (Transporte, Lancha, Logística...)</label>
                         
                         <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                            <div className="flex gap-2">
                               <input type="text" placeholder="Ex: Aluguel de Lancha" value={novoServicoNome} onChange={e => setNovoServicoNome(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm font-medium outline-none focus:border-[#00577C]" />
                               <div className="relative w-28 shrink-0">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">R$</span>
                                  <input type="text" placeholder="Total" value={novoServicoValor} onChange={e => setNovoServicoValor(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-7 pr-2 text-sm font-black text-slate-900 outline-none focus:border-[#00577C]" />
                               </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                               <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
                                 <input type="checkbox" checked={dividirServico} onChange={e => setDividirServico(e.target.checked)} className="rounded border-slate-300 text-[#00577C]" />
                                 Dividir este valor pelas {vagasTotais} vagas?
                               </label>
                               <button type="button" onClick={handleAddServicoExtra} className="bg-[#00577C] text-white px-4 py-2 text-xs font-bold rounded-lg hover:bg-[#004766] transition-colors">Adicionar Extra</button>
                            </div>
                         </div>

                         {/* Lista de Extras */}
                         {servicosExtras.length > 0 && (
                            <ul className="mt-3 space-y-2">
                               {servicosExtras.map(extra => (
                                  <li key={extra.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 text-sm shadow-sm">
                                     <div>
                                        <span className="text-slate-700 font-bold block">{extra.nome} <span className="text-slate-400 font-normal text-xs">(R$ {extra.valorTotal.toFixed(2)})</span></span>
                                        <span className="text-[10px] text-slate-500">{extra.dividirPorPessoa ? `Rateado: + R$ ${(extra.valorTotal / numeroVagas).toFixed(2)} por pessoa` : `Custo individual fixo`}</span>
                                     </div>
                                     <button type="button" onClick={() => handleRemoverServicoExtra(extra.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-md"><Trash2 size={14}/></button>
                                  </li>
                               ))}
                            </ul>
                         )}
                      </div>

                      {/* TOTAL CALCULADO */}
                      <div className="mt-6 bg-[#00577C] rounded-2xl p-5 text-white flex justify-between items-center shadow-lg">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Preço Final do Pacote (Por Pessoa)</p>
                            <p className="text-xs text-blue-100/80">Guia + Hospedagem ({noites} d) + Extras</p>
                         </div>
                         <p className={`${jakarta.className} text-3xl font-black text-[#F9C400]`}>R$ {valorTotalCalculado.toFixed(2)}</p>
                      </div>

                   </div>
                </div>

                {/* BLOCO 4: FOTOS */}
                <div className="space-y-4 pt-4">
                   <h3 className={`${jakarta.className} text-lg font-black text-[#009640] flex items-center gap-2 border-b border-slate-100 pb-2`}><Images size={18}/> Fotos Lindas</h3>
                   <label className="w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:bg-green-50 hover:border-green-300 transition-colors">
                      <Upload size={24} className="text-[#009640]"/>
                      <span className="text-sm font-bold text-slate-700 text-center">{arquivoCapa ? arquivoCapa.name : 'Toque para escolher a Foto Principal'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setArquivoCapa(e.target.files[0])} />
                   </label>
                   <label className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0"><Images size={18} className="text-slate-500"/></div>
                        <p className="text-sm font-bold text-slate-700">Adicionar mais fotos (até 6)</p>
                      </div>
                      <span className="text-[10px] sm:text-xs font-black text-white bg-slate-800 px-3 py-1.5 rounded-full shrink-0">{arquivosGaleria.length} Selecionadas</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleGaleriaChange} />
                   </label>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-[#009640] hover:bg-[#007a33] text-white py-4 md:py-5 rounded-2xl font-black text-sm shadow-xl shadow-green-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all mt-4">
                   {isSubmitting ? <><Loader2 className="animate-spin" size={20}/> Guardando Pacote...</> : <><Save size={20}/> Enviar para o Portal SagaTurismo</>}
                </button>
             </form>
          </div>
        </div>

        {/* COLUNA DIREITA: CALENDÁRIO INTERATIVO (INTERVALOS) */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
           <h3 className={`${jakarta.className} text-xl font-black text-slate-900 pl-2`}>Datas da Expedição</h3>
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                 <button onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente - 1))} className="p-1.5 text-slate-400 hover:text-slate-800"><ChevronLeft size={18}/></button>
                 <p className="font-black text-slate-800 capitalize text-sm">{mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                 <button onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente + 1))} className="p-1.5 text-slate-400 hover:text-slate-800"><ChevronRight size={18}/></button>
              </div>
              <div className="grid grid-cols-7 gap-y-2 text-center">
                 {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="text-[10px] font-black text-slate-300">{d}</span>)}
                 {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                 {Array.from({ length: diasMes }).map((_, i) => {
                    const dDia = new Date(anoCorrente, mesCorrente, i + 1);
                    const passes = dDia < hoje;
                    
                    const isInicio = dataInicio?.getTime() === dDia.getTime();
                    const isFim = dataFim?.getTime() === dDia.getTime();
                    const isEntre = dataInicio && dataFim && dDia > dataInicio && dDia < dataFim;
                    
                    return (
                      <div key={i} className="relative aspect-square flex items-center justify-center">
                         {(isEntre || (isInicio && dataFim) || (isFim && dataInicio)) && (
                           <div className={`absolute inset-y-1 bg-green-100 ${isInicio ? 'left-1/2 right-0' : isFim ? 'left-0 right-1/2' : 'left-0 right-0'}`} />
                         )}
                         <button 
                            type="button" 
                            disabled={passes} 
                            onClick={() => handleDateClick(dDia)} 
                            className={`z-10 w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full transition-all ${
                              passes ? 'text-slate-300 pointer-events-none' : 
                              (isInicio || isFim) ? 'bg-[#009640] text-white shadow-md scale-110' : 
                              'text-slate-800 hover:bg-slate-200'
                            }`}
                         >
                           {i + 1}
                         </button>
                      </div>
                    );
                 })}
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-4">Clique na data de início e depois na data de fim da expedição.</p>
           </div>
        </div>

      </div>
    </div>
  );
}