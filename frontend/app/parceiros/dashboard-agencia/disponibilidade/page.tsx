'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, Home, LogOut, Bed, Compass, Save, Sparkles, 
  AlertCircle, CheckCircle2, Type, FileText, DollarSign, 
  Upload, ChevronLeft, ChevronRight, Check, ShieldCheck, Tag,
  Calendar as CalendarIcon, MapPin
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

  // Datas para verificar disponibilidade de hoteis/guias
  const [dataInicioDisponibilidade, setDataInicioDisponibilidade] = useState<Date | null>(null);
  const [dataFimDisponibilidade, setDataFimDisponibilidade] = useState<Date | null>(null);

  // Período de vigência do pacote (datas em que pode ser iniciado)
  const [periodoInicio, setPeriodoInicio] = useState<string>('');
  const [periodoFim, setPeriodoFim] = useState<string>('');
  const [diasSemana, setDiasSemana] = useState<number[]>([]); // 0=domingo, 1=segunda, ..., 6=sábado

  // Duração fixa do pacote (dias)
  const [duracaoDias, setDuracaoDias] = useState<number>(1);

  const diasSemanaOpcoes = [
    { label: 'Dom', value: 0 },
    { label: 'Seg', value: 1 },
    { label: 'Ter', value: 2 },
    { label: 'Qua', value: 3 },
    { label: 'Qui', value: 4 },
    { label: 'Sex', value: 5 },
    { label: 'Sáb', value: 6 }
  ];

  const toggleDiaSemana = (dia: number) => {
    setDiasSemana(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    );
  };

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
    vagas_totais: '',
    ativo: true
  });

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

  // 2. MOTOR DE VERIFICAÇÃO DE DISPONIBILIDADE DE HOTÉIS E GUIAS
  useEffect(() => {
    if (!dataInicioDisponibilidade || !dataFimDisponibilidade) {
      setHoteisDisponiveis([]);
      setGuiasDisponiveis([]);
      setSelectedHotelId(null);
      setSelectedGuiaId(null);
      return;
    }

    async function filtrarInventarioPorIntervalo() {
      setVerificandoInventario(true);
      setErro(null);

      const dInicioStr = formatarDataIso(dataInicioDisponibilidade);
      const dFimStr = formatarDataIso(dataFimDisponibilidade);

      try {
        // [A] Hotéis disponíveis (considerando bloqueios)
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

        // [B] Guias disponíveis (sem conflito de data)
        const { data: conflitosGuias } = await supabase
          .from('passeios')
          .select('guia_id')
          .lte('data_passeio', dFimStr)
          .gte('data_passeio', dInicioStr);

        const guiasOcupadosIds = (conflitosGuias || []).map(c => c.guia_id).filter(Boolean);

        const { data: todosGuias } = await supabase
          .from('guias')
          .select('id, nome, especialidade, imagem_url, preco_diaria');

        if (todosGuias) {
          const livres = todosGuias.filter(g => !guiasOcupadosIds.includes(g.id));
          setGuiasDisponiveis(livres as Guia[]);
        }
      } catch (err) {
        console.error(err);
        setErro("Erro ao verificar disponibilidade de parceiros.");
      } finally {
        setVerificandoInventario(false);
      }
    }

    filtrarInventarioPorIntervalo();
  }, [dataInicioDisponibilidade, dataFimDisponibilidade]);

  // Atualizar objetos selecionados
  useEffect(() => {
    setHotelSelecionado(hoteisDisponiveis.find(h => h.id === selectedHotelId) || null);
  }, [selectedHotelId, hoteisDisponiveis]);

  useEffect(() => {
    setGuiaSelecionado(guiasDisponiveis.find(g => g.id === selectedGuiaId) || null);
  }, [selectedGuiaId, guiasDisponiveis]);

  // Cálculo do preço sugerido (por pessoa)
  const precoSugerido = (hotelSelecionado?.quarto_standard_preco || 0) * duracaoDias + 
                        (guiaSelecionado?.preco_diaria || 0) * duracaoDias;

  const formatarDataIso = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

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
    if (!selectedHotelId || !selectedGuiaId || !dataInicioDisponibilidade || !dataFimDisponibilidade) {
      setErro("Selecione o período para verificar disponibilidade e escolha um hotel e um guia.");
      return;
    }
    if (!arquivoCapa) {
      setErro("A foto de capa é obrigatória.");
      return;
    }

    setEnviando(true);
    setErro(null);

    const precoFinal = parseFloat(formData.precoCustomizado.replace(',', '.')) || precoSugerido;
    if (isNaN(precoFinal) || precoFinal <= 0) {
      setErro("Preço inválido. Defina um valor positivo.");
      setEnviando(false);
      return;
    }

    try {
      const nomeLimpo = limparNomeArquivo(arquivoCapa.name);
      const pathCapa = `pacotes/${parceiroId}_${Date.now()}_${nomeLimpo}`;
      
      const { error: errUpload } = await supabase.storage.from('imagens-passeios').upload(pathCapa, arquivoCapa);
      if (errUpload) throw new Error("Falha no upload da imagem.");

      const { data: urlPublica } = supabase.storage.from('imagens-passeios').getPublicUrl(pathCapa);

      const { data: novoPacote, error: errPacote } = await supabase
        .from('pacotes')
        .insert([{
          titulo: formData.titulo,
          descricao_curta: formData.descricao_curta,
          roteiro_detalhado: formData.roteiro_detalhado,
          imagem_principal: urlPublica.publicUrl,
          dias: duracaoDias,
          noites: duracaoDias - 1, // noites = dias - 1
          preco: precoFinal,
          categoria: formData.categoria,
          horarios_info: formData.horarios_info || null,
          vagas_totais: parseInt(formData.vagas_totais) || 0,
          agencia_id: parceiroId,
          ativo: formData.ativo,
          periodo_inicio: periodoInicio || null,
          periodo_fim: periodoFim || null,
          dias_inicio_semana: diasSemana.length ? diasSemana : null,
          duracao_fixa: true
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
      setErro(err.message || "Falha na criação do pacote.");
    } finally {
      setEnviando(false);
    }
  };

  const limparNomeArquivo = (nome: string) => 
    nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9.]/g, '_').replace(/_{2,}/g, '_');

  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const IMG_FALLBACK = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1721";

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8FAFC] text-slate-900 pb-20`}>
      
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
          
          {/* FASE 1: INFORMAÇÕES BÁSICAS E REGRAS */}
          <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-[#0085FF] text-white p-2 rounded-xl"><Type size={18} /></div>
              <h2 className={`${jakarta.className} text-base font-black text-slate-800`}>Fase 1: Dados do Pacote</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Título</label>
                <input required type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Categoria</label>
                <select name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none bg-slate-50/50 capitalize">
                  {categoriasDb.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Total de Vagas</label>
                <input required type="number" min="1" name="vagas_totais" value={formData.vagas_totais} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Duração fixa (dias)</label>
                <input type="number" min="1" value={duracaoDias} onChange={e => setDuracaoDias(parseInt(e.target.value) || 0)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Período de Vigência (Início)</label>
                <input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Período de Vigência (Fim)</label>
                <input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Dias da semana permitidos para início</label>
                <div className="flex flex-wrap gap-2">
                  {diasSemanaOpcoes.map(dia => (
                    <button type="button" key={dia.value} onClick={() => toggleDiaSemana(dia.value)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${diasSemana.includes(dia.value) ? 'bg-[#0085FF] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {dia.label}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-400">Deixe vazio para permitir qualquer dia.</p>
              </div>
            </div>
          </section>

          {/* FASE 2: VERIFICAÇÃO DE DISPONIBILIDADE (HOTEL/GUIA) */}
          <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-5 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-amber-500 text-white p-2 rounded-xl"><CalendarIcon size={18} /></div>
              <h2 className={`${jakarta.className} text-base font-black text-slate-800`}>Fase 2: Disponibilidade de Parceiros</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500">Data de início da estadia (para verificar disponibilidade)</label>
                <input type="date" onChange={e => e.target.value && setDataInicioDisponibilidade(new Date(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500">Data de fim da estadia</label>
                <input type="date" onChange={e => e.target.value && setDataFimDisponibilidade(new Date(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
              </div>
            </div>

            {verificandoInventario && <div className="flex items-center gap-2 text-xs font-bold text-slate-500 py-6 justify-center"><Loader2 className="animate-spin" size={16}/> Verificando disponibilidade...</div>}

            {!dataInicioDisponibilidade || !dataFimDisponibilidade ? (
              <div className="text-center py-6 text-xs font-bold text-slate-400 bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl">Defina o período acima para listar hotéis e guias disponíveis.</div>
            ) : (
              <>
                <div className="mt-4">
                  <h3 className="text-xs font-black text-slate-600 mb-2">Hotéis disponíveis</h3>
                  {hoteisDisponiveis.length === 0 ? <p className="text-xs text-red-500">Nenhum hotel disponível neste período.</p> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {hoteisDisponiveis.map(hotel => (
                        <div key={hotel.id} onClick={() => setSelectedHotelId(hotel.id)} className={`cursor-pointer border-2 rounded-xl p-3 flex gap-3 items-center ${selectedHotelId === hotel.id ? 'border-[#0085FF] bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}>
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            <Image src={hotel.imagem_url || IMG_FALLBACK} alt={hotel.nome} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-xs">{hotel.nome}</p>
                            <p className="text-[10px] text-amber-600">R$ {hotel.quarto_standard_preco}/noite</p>
                          </div>
                          {selectedHotelId === hotel.id && <Check size={14} className="ml-auto text-[#0085FF]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <h3 className="text-xs font-black text-slate-600 mb-2">Guias disponíveis</h3>
                  {guiasDisponiveis.length === 0 ? <p className="text-xs text-red-500">Nenhum guia disponível neste período.</p> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {guiasDisponiveis.map(guia => (
                        <div key={guia.id} onClick={() => setSelectedGuiaId(guia.id)} className={`cursor-pointer border-2 rounded-xl p-3 flex gap-3 items-center ${selectedGuiaId === guia.id ? 'border-[#009640] bg-green-50' : 'border-slate-100 hover:border-slate-300'}`}>
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            <Image src={guia.imagem_url || IMG_FALLBACK} alt={guia.nome} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-xs">{guia.nome}</p>
                            <p className="text-[10px] text-green-700">R$ {guia.preco_diaria}/dia</p>
                          </div>
                          {selectedGuiaId === guia.id && <Check size={14} className="ml-auto text-[#009640]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          {/* FASE 3: CONTEÚDO DO PACOTE */}
          <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-[#009640] text-white p-2 rounded-xl"><FileText size={18} /></div>
              <h2 className={`${jakarta.className} text-base font-black text-slate-800`}>Fase 3: Descrições</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Resumo para vitrine</label>
                <textarea required rows={2} name="descricao_curta" value={formData.descricao_curta} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Roteiro completo</label>
                <textarea required rows={4} name="roteiro_detalhado" value={formData.roteiro_detalhado} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Informações de horário / embarque</label>
                <input type="text" name="horarios_info" value={formData.horarios_info} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Imagem de capa</label>
                <label className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-500 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100">
                  <Upload size={16} className="text-[#0085FF]"/>
                  <span>{arquivoCapa ? arquivoCapa.name : 'Carregar imagem'}</span>
                  <input required type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setArquivoCapa(e.target.files[0])} />
                </label>
              </div>
            </div>
          </section>

          {/* FASE 4: PREÇO E FINALIZAÇÃO */}
          <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-[#0085FF] text-white p-2 rounded-xl"><DollarSign size={18} /></div>
              <h2 className={`${jakarta.className} text-base font-black text-slate-800`}>Fase 4: Precificação</h2>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-xs font-bold text-slate-600">Custo base (por pessoa): R$ {precoSugerido.toFixed(2)}</p>
              <div className="mt-3">
                <label className="text-xs font-black text-[#0085FF]">Defina o preço final de venda (por pessoa)</label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                  <input type="text" name="precoCustomizado" value={formData.precoCustomizado} onChange={handleInputChange} placeholder={precoSugerido.toFixed(2)} className="w-full border-2 border-slate-200 rounded-xl py-3 pl-9 pr-4 text-base font-black outline-none focus:border-[#0085FF]" />
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Deixe vazio para usar o valor sugerido.</p>
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 gap-4 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><ShieldCheck size={14} className="inline mr-1 text-[#0085FF]"/> Validação Comercial</p>
            <button type="submit" disabled={enviando || !selectedHotelId || !selectedGuiaId || !dataInicioDisponibilidade || !dataFimDisponibilidade} className="w-full sm:w-auto bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all">
              {enviando ? <><Loader2 className="w-4 h-4 animate-spin"/> Publicando...</> : <><Save size={14}/> Lançar Pacote</>}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}