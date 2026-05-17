'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, CheckCircle2, Save, Compass, 
  ChevronLeft, ChevronRight, DollarSign, Users, 
  MapPin, Trash2, Upload, Images, MailWarning, Calendar as CalendarIcon, Plus, Target
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
  const [categoriasDb, setCategoriasDb] = useState<string[]>(['Trilha', 'Praia', 'Camping', 'Cachoeira']); // Fallback inicial
  const [descricaoCurta, setDescricaoCurta] = useState('');
  const [descricaoCompleta, setDescricaoCompleta] = useState('');
  const [horarioSaida, setHorarioSaida] = useState('');
  const [pontoEncontro, setPontoEncontro] = useState('');
  const [coordenadas, setCoordenadas] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [vagasTotais, setVagasTotais] = useState('15');
  
  // Calendário Híbrido
  const [dataPasseio, setDataPasseio] = useState<Date | null>(null);

  // Estados de Arquivos
  const [arquivoCapa, setArquivoCapa] = useState<File | null>(null);
  const [arquivosGaleria, setArquivosGaleria] = useState<File[]>([]);

  // Estados de Busca de Endereço (OpenStreetMap)
  const [sugestoesEndereco, setSugestoesEndereco] = useState<EnderecoBusca[]>([]);
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);

  // Lista de Passeios Existentes
  const [passeiosExistentes, setPasseiosExistentes] = useState<PasseioCadastrado[]>([]);

  // 1. VALIDAÇÃO DE SESSÃO
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");
    const tipo = localStorage.getItem("tipo_parceiro");

    if (!id || tipo !== 'guia') {
      router.push('/parceiros');
    } else {
      setParceiroId(id);
      setNomeNegocio(nome || 'Guia de Turismo');
      setLoadingSessao(false);
    }
  }, [router]);

  // 2. CARREGAR DADOS INICIAIS (PASSEIOS E CATEGORIAS DINÂMICAS)
  useEffect(() => {
    if (!parceiroId) return;

    async function carregarDadosIniciais() {
      const { data, error } = await supabase
        .from('passeios')
        .select('id, titulo, data_passeio, valor_total, vagas_totais, vagas_disponiveis, categoria')
        .order('data_passeio', { ascending: true });

      if (!error && data) {
        // Filtrar passeios específicos deste guia para a lista
        const meusPasseios = data.filter(p => p.guia_id === parceiroId);
        setPasseiosExistentes(meusPasseios as any);

        // Extrair categorias únicas de TODOS os passeios da base de dados
        const catsUnicas = Array.from(new Set(data.map(p => p.categoria).filter(Boolean)));
        if (catsUnicas.length > 0) {
          setCategoriasDb(catsUnicas as string[]);
          setCategoria(catsUnicas[0] as string);
        }
      }
    }
    carregarDadosIniciais();
  }, [parceiroId, isSubmitting]);

  // ── BUSCA INTELIGENTE DE ENDEREÇO (Nominatim) ──
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (pontoEncontro.length > 3 && !coordenadas) {
        setBuscandoEndereco(true);
        try {
          // Restringe a busca a São Geraldo do Araguaia / Pará para maior precisão
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pontoEncontro + ', São Geraldo do Araguaia, Pará')}&limit=4`);
          const data = await res.json();
          setSugestoesEndereco(data);
        } catch (error) {
          console.error("Erro ao buscar endereço", error);
        } finally {
          setBuscandoEndereco(false);
        }
      } else {
        setSugestoesEndereco([]);
      }
    }, 800); // Aguarda 800ms após o guia parar de digitar

    return () => clearTimeout(delayDebounceFn);
  }, [pontoEncontro, coordenadas]);

  const selecionarEndereco = (end: EnderecoBusca) => {
    // Extrai a parte mais relevante do nome de exibição
    const nomeCurto = end.display_name.split(',').slice(0, 2).join(', ');
    setPontoEncontro(nomeCurto);
    setCoordenadas(`${end.lat}, ${end.lon}`); // Preenche coordenadas automaticamente!
    setSugestoesEndereco([]);
  };

  // ── UTILS DE CALENDÁRIO ──
  const formatarDataIso = (data: Date | null) => {
    if (!data) return '';
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  };
  
  const handleDataNativaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      setDataPasseio(null);
      return;
    }
    // Ao usar input type="date", criamos o objeto Data com timezone corrigido para não errar o dia
    const [ano, mes, dia] = e.target.value.split('-');
    setDataPasseio(new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia)));
  };

  const limparNomeArquivo = (nomeOriginal: string) => {
    return nomeOriginal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9.]/g, '_').replace(/_{2,}/g, '_');         
  };

  const handleGaleriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const arquivosSelecionados = Array.from(e.target.files);
      if (arquivosSelecionados.length > 6) {
        alert("Atenção: Escolha no máximo 6 fotos bonitas para a galeria!");
        setArquivosGaleria(arquivosSelecionados.slice(0, 6));
      } else {
        setArquivosGaleria(arquivosSelecionados);
      }
    }
  };

  // 3. ENGENHARIA DE SUBMISSÃO
  const handleCriarPasseio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parceiroId) return;

    if (!dataPasseio) {
      setStatusMensagem({ tipo: 'erro', texto: 'Por favor, diga-nos a data da expedição.' });
      return;
    }

    if (!arquivoCapa) {
      setStatusMensagem({ tipo: 'erro', texto: 'Uma foto de capa bonita ajuda a vender! Por favor, anexe uma.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMensagem(null);

    const vTotal = parseFloat(valorTotal.replace(',', '.'));
    const taxaPref = vTotal * 0.10;

    try {
      const nomeCapaLimpo = limparNomeArquivo(arquivoCapa.name);
      const pathCapa = `capas/${parceiroId}_${Date.now()}_${nomeCapaLimpo}`;
      
      const { error: errCapa } = await supabase.storage.from('imagens-passeios').upload(pathCapa, arquivoCapa);
      if (errCapa) throw new Error(`Falha no upload da foto de capa: ${errCapa.message}`);
      
      const { data: urlCapaPublica } = supabase.storage.from('imagens-passeios').getPublicUrl(pathCapa);

      const urlsGaleria: string[] = [];
      for (const file of arquivosGaleria) {
        const nomeFotoLimpo = limparNomeArquivo(file.name);
        const pathFoto = `galeria/${parceiroId}_${Date.now()}_${nomeFotoLimpo}`;
        const { error: errFoto } = await supabase.storage.from('imagens-passeios').upload(pathFoto, file);
        if (!errFoto) {
          const { data: urlFotoPublica } = supabase.storage.from('imagens-passeios').getPublicUrl(pathFoto);
          urlsGaleria.push(urlFotoPublica.publicUrl);
        }
      }

      const { error: errInsert } = await supabase
        .from('passeios')
        .insert([{
          titulo,
          descricao_curta: descricaoCurta,
          descricao_completa: descricaoCompleta || null,
          imagem_principal: urlCapaPublica.publicUrl,
          imagens_galeria: urlsGaleria,
          data_passeio: formatarDataIso(dataPasseio),
          horario_saida: horarioSaida || null,
          ponto_encontro: pontoEncontro || null,
          coordenadas_google_maps: coordenadas || null,
          nome_guia: nomeNegocio,
          guia_id: parceiroId,
          valor_total: vTotal,
          taxa_prefeitura: taxaPref,
          vagas_totais: parseInt(vagasTotais),
          vagas_disponiveis: parseInt(vagasTotais),
          categoria,
          ativo: false, 
          destaque: false 
        }]);

      if (errInsert) throw errInsert;

      try {
        await fetch(`https://sagaturismo-production.up.railway.app/api/v1/notificacoes/novo-passeio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guia_nome: nomeNegocio, passeio_titulo: titulo, data_evento: formatarDataIso(dataPasseio) })
        });
      } catch (errEmail) {}

      setStatusMensagem({ tipo: 'sucesso', texto: 'Aventura enviada! A prefeitura vai rever as fotos e aprovar em breve.' });
      
      setTitulo(''); setDescricaoCurta(''); setDescricaoCompleta('');
      setHorarioSaida(''); setPontoEncontro(''); setCoordenadas(''); setValorTotal('');
      setDataPasseio(null); setArquivoCapa(null); setArquivosGaleria([]);

    } catch (err: any) {
      setStatusMensagem({ tipo: 'erro', texto: err.message || 'Erro interno de processamento.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletarPasseio = async (idPasseio: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta expedição?")) return;
    try {
      const { error } = await supabase.from('passeios').delete().eq('id', idPasseio);
      if (error) throw error;
      setStatusMensagem({ tipo: 'sucesso', texto: 'Passeio cancelado com sucesso.' });
      setPasseiosExistentes(prev => prev.filter(p => p.id !== idPasseio));
    } catch (err) {
      setStatusMensagem({ tipo: 'erro', texto: 'Não é possível cancelar passeios que já tenham turistas agendados.' });
    }
  };

  const anoCorrente = mesAtual.getFullYear();
  const mesCorrente = mesAtual.getMonth();
  const diasMes = new Date(anoCorrente, mesCorrente + 1, 0).getDate();
  const primeiroDia = new Date(anoCorrente, mesCorrente, 1).getDay();
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

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
        
        {/* ── COLUNA ESQUERDA: FORMULÁRIO DE CRIAÇÃO ── */}
        <div className="w-full lg:flex-1 space-y-6">
          
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#009640] flex items-center justify-center text-white shadow-md shrink-0"><Plus size={24} /></div>
            <div>
               <h2 className={`${jakarta.className} text-2xl font-black text-slate-900 leading-none`}>Nova Expedição</h2>
               <p className="text-sm font-medium text-slate-500 mt-1">Crie um roteiro incrível e atraia turistas.</p>
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
                
                {/* O Que Vamos Fazer? */}
                <div className="space-y-4">
                   <h3 className={`${jakarta.className} text-lg font-black text-[#009640] flex items-center gap-2 border-b border-slate-100 pb-2`}><Compass size={18}/> A Aventura</h3>
                   
                   <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">Qual o nome da aventura?</label>
                      <input required type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm sm:text-base font-medium outline-none focus:border-[#009640] focus:ring-4 ring-green-500/10 transition-all" placeholder="Ex: Trilha da Serra Mágica" />
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     
                     {/* CALENDÁRIO HÍBRIDO */}
                     <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">Quando vai ser?</label>
                        
                        {/* 1. VISÃO MOBILE: Input Nativo Seguro */}
                        <div className="block md:hidden relative">
                           <input required type="date" value={formatarDataIso(dataPasseio)} onChange={handleDataNativaChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium outline-none focus:border-[#009640] text-slate-700" />
                        </div>

                        {/* 2. VISÃO DESKTOP: Painel Visual Bonito */}
                        <div className="hidden md:block relative group">
                           <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><CalendarIcon size={18}/></div>
                           <input readOnly value={dataPasseio ? dataPasseio.toLocaleDateString('pt-BR') : ''} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-medium outline-none cursor-pointer text-slate-700 hover:bg-slate-100 transition-all" placeholder="Selecione no calendário abaixo" />
                        </div>
                     </div>

                     <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">Que tipo é?</label>
                        <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium outline-none focus:border-[#009640] cursor-pointer text-slate-700 capitalize">
                           {categoriasDb.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                           {/* Permite que ele crie algo novo caso precise */}
                           <option value="Outros">Outro...</option>
                        </select>
                     </div>
                   </div>

                   {/* Renderização do Calendário Customizado (Apenas Desktop) */}
                   <div className="hidden md:block bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner mt-2">
                      <div className="flex items-center justify-between mb-3">
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
                            const selecionado = dataPasseio && dDia.getTime() === dataPasseio.getTime();
                            return (
                              <button type="button" key={i} disabled={passes} onClick={() => setDataPasseio(dDia)} className={`w-full aspect-square flex items-center justify-center text-xs font-bold rounded-lg transition-all ${passes ? 'text-slate-300 pointer-events-none' : selecionado ? 'bg-[#009640] text-white shadow-sm scale-105' : 'text-slate-800 hover:bg-slate-200'}`}>
                                 {i + 1}
                              </button>
                            );
                         })}
                      </div>
                   </div>

                   <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">Como você descreveria em 1 frase?</label>
                      <input required type="text" value={descricaoCurta} onChange={e => setDescricaoCurta(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium outline-none focus:border-[#009640]" placeholder="Uma caminhada perfeita para a família ver o pôr do sol..." />
                   </div>
                </div>

                {/* Logística com Autocompletar */}
                <div className="space-y-4">
                   <h3 className={`${jakarta.className} text-lg font-black text-[#009640] flex items-center gap-2 border-b border-slate-100 pb-2`}><MapPin size={18}/> Logística</h3>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">A que horas saímos?</label>
                        <input type="time" required value={horarioSaida} onChange={e => setHorarioSaida(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium outline-none focus:border-[#009640] text-slate-700" />
                     </div>
                     <div className="relative">
                        <label className="text-xs font-bold text-slate-700 block mb-2">Onde a gente se encontra?</label>
                        <div className="relative">
                          <input type="text" required value={pontoEncontro} onChange={e => { setPontoEncontro(e.target.value); setCoordenadas(''); }} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-medium outline-none focus:border-[#009640]" placeholder="Escreva para buscar..." />
                          {buscandoEndereco && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
                        </div>
                        
                        {/* Menu Suspenso de Sugestões */}
                        {sugestoesEndereco.length > 0 && (
                          <div className="absolute z-20 top-[105%] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                            {sugestoesEndereco.map((end, idx) => (
                              <button key={idx} type="button" onClick={() => selecionarEndereco(end)} className="w-full text-left px-4 py-3 text-xs font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-start gap-2">
                                <Target size={14} className="text-[#009640] shrink-0 mt-0.5" />
                                <span>{end.display_name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                     </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">Quantas pessoas podem ir?</label>
                        <div className="relative">
                           <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                           <input type="number" required value={vagasTotais} onChange={e => setVagasTotais(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-[#009640]" />
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">Preço (R$ por pessoa)</label>
                        <div className="relative">
                           <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#009640]" size={18}/>
                           <input type="text" required placeholder="0,00" value={valorTotal} onChange={e => setValorTotal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-black text-slate-900 outline-none focus:border-[#009640] focus:ring-4 ring-green-500/10" />
                        </div>
                     </div>
                   </div>
                </div>

                {/* Imagens */}
                <div className="space-y-4">
                   <h3 className={`${jakarta.className} text-lg font-black text-[#009640] flex items-center gap-2 border-b border-slate-100 pb-2`}><Images size={18}/> Fotos Lindas</h3>
                   
                   <label className="w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:bg-green-50 hover:border-green-300 transition-colors">
                      <Upload size={24} className="text-[#009640]"/>
                      <span className="text-sm font-bold text-slate-700 text-center">{arquivoCapa ? arquivoCapa.name : 'Toque para escolher a Foto Principal'}</span>
                      <span className="text-[10px] text-slate-400">Esta é a foto que os turistas vão ver primeiro.</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setArquivoCapa(e.target.files[0])} />
                   </label>

                   <label className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0"><Images size={18} className="text-slate-500"/></div>
                        <div>
                           <p className="text-sm font-bold text-slate-700">Adicionar mais fotos (até 6)</p>
                           <p className="text-[10px] text-slate-400">Mostre os detalhes e as paisagens da rota.</p>
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-xs font-black text-white bg-slate-800 px-3 py-1.5 rounded-full shrink-0">{arquivosGaleria.length} Selecionadas</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleGaleriaChange} />
                   </label>
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 border border-amber-100">
                   <MailWarning size={20} className="text-amber-500 shrink-0" />
                   <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                     Assim que clicares em enviar, a prefeitura vai ver a tua proposta. Se estiver tudo certinho, o teu passeio vai para o ar para o mundo todo ver!
                   </p>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-[#009640] hover:bg-[#007a33] text-white py-4 md:py-5 rounded-2xl font-black text-sm shadow-xl shadow-green-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
                   {isSubmitting ? <><Loader2 className="animate-spin" size={20}/> Guardando a Aventura...</> : <><Save size={20}/> Enviar para o Portal SagaTurismo</>}
                </button>
             </form>
          </div>
        </div>

        {/* ── COLUNA DIREITA: A AGENDA "SOCIAL" ── */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
           
           <h3 className={`${jakarta.className} text-xl font-black text-slate-900 pl-2`}>A Minha Agenda</h3>
           
           {/* MINI-CALENDÁRIO INTELIGENTE */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                 <button onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente - 1))} className="p-1.5 text-slate-400 hover:text-slate-800"><ChevronLeft size={18}/></button>
                 <p className="font-black text-slate-800 capitalize text-sm">{mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                 <button onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente + 1))} className="p-1.5 text-slate-400 hover:text-slate-800"><ChevronRight size={18}/></button>
              </div>
              
              <div className="grid grid-cols-7 gap-y-2 text-center">
                 {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                   <span key={i} className="text-[10px] font-black text-slate-300">{d}</span>
                 ))}
                 
                 {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                 
                 {Array.from({ length: diasMes }).map((_, i) => {
                    const dDia = new Date(anoCorrente, mesCorrente, i + 1);
                    const dataIsoStr = formatarDataIso(dDia);
                    const temPasseio = passeiosExistentes.some(p => p.data_passeio === dataIsoStr);
                    const isHoje = formatarDataIso(hoje) === dataIsoStr;

                    return (
                      <div key={i} className="relative aspect-square flex items-center justify-center">
                         <span className={`text-xs z-10 w-7 h-7 flex items-center justify-center rounded-full ${isHoje ? 'bg-slate-900 text-white font-black' : temPasseio ? 'font-black text-slate-900' : 'text-slate-500 font-medium'}`}>
                           {i + 1}
                         </span>
                         {temPasseio && !isHoje && <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-[#009640]"></span>}
                      </div>
                    );
                 })}
              </div>
           </div>

           {/* LISTA DE ATIVIDADES / PASSEIOS */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                 <p className="font-black text-slate-800 text-sm">Próximas Saídas</p>
              </div>
              <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
                 {passeiosExistentes.length === 0 ? (
                    <p className="p-4 text-center text-xs font-medium text-slate-400">Sem atividades marcadas.</p>
                 ) : (
                    passeiosExistentes.map((p) => (
                       <div key={p.id} className="group p-3 rounded-2xl hover:bg-slate-50 transition-colors flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                             <div>
                               <p className="text-xs font-black text-slate-900 line-clamp-1">{p.titulo}</p>
                               <p className="text-[10px] font-bold text-[#009640] mt-0.5">{p.data_passeio.split('-').reverse().join('/')}</p>
                             </div>
                             <button onClick={() => handleDeletarPasseio(p.id)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                          </div>
                          <div className="flex gap-2">
                             <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[9px] font-bold tracking-widest">{p.vagas_disponiveis} vagas</span>
                             <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase">R$ {p.valor_total}</span>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}