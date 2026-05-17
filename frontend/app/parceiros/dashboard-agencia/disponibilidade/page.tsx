'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, Bed, Compass, Save, Sparkles, 
  AlertCircle, CheckCircle2, Type, FileText, DollarSign, 
  Clock, Upload, Calendar as CalendarIcon, MapPin, Check, ShieldCheck
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

  // Inventário Filtrado Dinamicamente
  const [hoteisDisponiveis, setHoteisDisponiveis] = useState<Hotel[]>([]);
  const [guiasDisponiveis, setGuiasDisponiveis] = useState<Guia[]>([]);

  // Seleções Finais
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [selectedGuiaId, setSelectedGuiaId] = useState<string | null>(null);

  // Arquivo de Upload da Capa
  const [arquivoCapa, setArquivoCapa] = useState<File | null>(null);

  // Dados do Formulário (Campos oficiais do Schema da Base de Dados)
  const [dataPretendida, setDataPretendida] = useState('');
  const [formData, setFormData] = useState({
    titulo: '',
    descricao_curta: '',
    roteiro_detalhado: '',
    dias: 1,
    noites: 0,
    preco: '',
    categoria: 'Aventura',
    horarios_info: '',
    ativo: true
  });

  // 1. VALIDAÇÃO DE ACESSO DA AGÊNCIA
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const tipo = localStorage.getItem("tipo_parceiro"); 
    if (!id || (tipo !== 'agencia' && tipo !== 'semtur' && tipo !== 'pacote')) {
      router.push('/parceiros');
    } else {
      setParceiroId(id);
    }
  }, [router]);

  // 2. MOTOR DE VERIFICAÇÃO DE DISPONIBILIDADE REAL (Seta os parceiros dinamicamente)
  useEffect(() => {
    if (!dataPretendida) {
      setHoteisDisponiveis([]);
      setGuiasDisponiveis([]);
      setSelectedHotelId(null);
      setSelectedGuiaId(null);
      return;
    }

    async function verificarParceirosDisponiveis() {
      setVerificandoInventario(true);
      setErro(null);
      try {
        // [A] Cruza as datas com a tabela de inventário de bloqueio dos hotéis
        const { data: tarifasAtivas, error: errTarifas } = await supabase
          .from('disponibilidade_hoteis')
          .select('hotel_id, disponivel')
          .lte('data_inicio', dataPretendida)
          .gte('data_fim', dataPretendida);

        if (errTarifas) throw errTarifas;

        // Filtra os IDs dos hotéis que explicitamente têm quartos livres/vendas abertas neste dia
        const hoteisComVagasIds = Array.from(
          new Set(
            (tarifasAtivas || [])
              .filter(t => t.disponivel !== false)
              .map(t => t.hotel_id)
          )
        );

        // [B] Carrega do banco apenas os hotéis validados
        const { data: listaHoteis } = await supabase
          .from('hoteis')
          .select('id, nome, tipo, imagem_url, quarto_standard_preco');

        if (listaHoteis) {
          const filtrados = listaHoteis.filter(h => hoteisComVagasIds.includes(h.id));
          setHoteisDisponiveis(filtrados as Hotel[]);
        }

        // [C] Carrega os guias que não possuem saídas conflitantes marcadas para o mesmo dia
        const { data: passeiosNoDia } = await supabase
          .from('passeios')
          .select('guia_id')
          .eq('data_passeio', dataPretendida);

        const guiasOcupadosIds = (passeiosNoDia || []).map(p => p.guia_id).filter(Boolean);

        const { data: listaGuias } = await supabase
          .from('guias')
          .select('id, nome, especialidade, imagem_url, preco_diaria');

        if (listaGuias) {
          const guiasLivres = listaGuias.filter(g => !guiasOcupadosIds.includes(g.id));
          setGuiasDisponiveis(guiasLivres as Guia[]);
        }

      } catch (err) {
        console.error("Erro na checagem de inventário:", err);
        setErro("Falha catastrófica ao inspecionar o inventário dos parceiros municipais.");
      } finally {
        setVerificandoInventario(false);
      }
    }

    verificarParceirosDisponiveis();
  }, [dataPretendida]);

  const limparNomeArquivo = (nomeOriginal: string) => {
    return nomeOriginal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9.]/g, '_').replace(/_{2,}/g, '_');         
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. SUBMISSÃO DO PACOTE
  const handleCriarPacoteCompleto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotelId || !selectedGuiaId) {
      setErro("A validação de inventário falhou. Escolha um hotel e um guia com vagas disponíveis.");
      return;
    }
    if (!arquivoCapa) {
      setErro("Insira uma foto de capa oficial para a homologação do pacote.");
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      // Passo A: Upload automático da Imagem da Capa para o bucket imagens-passeios
      const nomeLimpo = limparNomeArquivo(arquivoCapa.name);
      const pathCapa = `pacotes/${parceiroId}_${Date.now()}_${nomeLimpo}`;
      
      const { error: errUpload } = await supabase.storage
        .from('imagens-passeios')
        .upload(pathCapa, arquivoCapa);

      if (errUpload) throw new Error("Erro crítico ao subir imagem para o Storage.");

      const { data: urlPublica } = supabase.storage
        .from('imagens-passeios')
        .getPublicUrl(pathCapa);

      // Passo B: Inserir dados na tabela 'pacotes'
      const { data: novoPacote, error: errPacote } = await supabase
        .from('pacotes')
        .insert([{
          titulo: formData.titulo,
          descricao_curta: formData.descricao_curta,
          roteiro_detalhado: formData.roteiro_detalhado,
          imagem_principal: urlPublica.publicUrl,
          dias: window.parseInt(formData.dias.toString()),
          noites: window.parseInt(formData.noites.toString()),
          preco: window.parseFloat(formData.preco.replace(',', '.')),
          categoria: formData.categoria,
          horarios_info: formData.horarios_info || null,
          ativo: formData.ativo
        }])
        .select()
        .single();

      if (errPacote || !novoPacote) throw errPacote;

      // Passo C: Inserir relacionamento na tabela pivot 'pacote_itens'
      const { error: errItens } = await supabase
        .from('pacote_itens')
        .insert([{
          pacote_id: novoPacote.id,
          hotel_id: selectedHotelId,
          guia_id: selectedGuiaId
        }]);

      if (errItens) throw errItens;

      setSucesso(true);
      setTimeout(() => router.push('/parceiros/dashboard-agencia'), 2000);

    } catch (err: any) {
      console.error(err);
      setErro(err.message || "Falha operacional ao registrar pacote relacional.");
    } finally {
      setEnviando(false);
    }
  };

  const IMG_FALLBACK = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1721";

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8FAFC] text-slate-900 pb-20`}>
      
      {/* ── HEADER CORPORATIVO EXECUTIVE ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-8 py-3.5 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/parceiros/dashboard-agencia" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800">
              <ArrowLeft size={20} />
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <p className="text-[10px] font-black uppercase text-[#0085FF] tracking-widest leading-none">Módulo Administrativo</p>
              <h1 className={`${jakarta.className} font-black text-slate-900 text-lg md:text-xl mt-0.5`}>Central de Engenharia de Combos</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
              <span className="w-1.5 h-1.5 bg-[#0085FF] rounded-full animate-pulse" /> SEMTUR Conectado
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 mt-8 space-y-8">
        
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <AlertCircle size={18} className="shrink-0 text-red-500" />
            <p className="text-xs font-bold">{erro}</p>
          </div>
        )}

        {sucesso && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <CheckCircle2 size={18} className="shrink-0 text-green-600" />
            <p className="text-xs font-bold">Pacote estruturado e inserido com sucesso!</p>
          </div>
        )}

        <form onSubmit={handleCriarPacoteCompleto} className="space-y-8">
          
          {/* FASE 1: LOGÍSTICA E AGENDA ESTRUTURAL */}
          <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-[#0085FF] text-white p-2 rounded-xl"><Type size={18} /></div>
              <h2 className={`${jakarta.className} text-base font-black text-slate-800`}>Fase 1: Logística e Cronograma do Roteiro</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Título do Pacote Comercial</label>
                <input required type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} placeholder="Ex: Rota Amazônica: Sol e Charme" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Selecione a Data da Viagem (Gatilho de Inventário)</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required type="date" value={dataPretendida} onChange={e => setDataPretendida(e.target.value)} className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] bg-slate-100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Clock size={12}/> Dias</label>
                  <input required type="number" min="1" name="dias" value={formData.dias} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Clock size={12}/> Noites</label>
                  <input required type="number" min="0" name="noites" value={formData.noites} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider"><DollarSign size={12}/> Preço Final (R$)</label>
                  <input required type="text" name="preco" value={formData.preco} onChange={handleInputChange} placeholder="0,00" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-[#0085FF] outline-none focus:border-[#0085FF] bg-slate-50/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Categoria</label>
                  <select name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none bg-slate-50/50 cursor-pointer text-slate-700">
                    <option value="Aventura">Aventura</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Gastronómico">Gastronómico</option>
                    <option value="Luxo">Estadia Premium</option>
                    <option value="Ecológico">Ecológico / Ecoturismo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Horários / Ponto de Embarque</label>
                <input type="text" name="horarios_info" value={formData.horarios_info} onChange={handleInputChange} placeholder="Ex: Saídas às 08:00h do Porto Hidroviário Municipal" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Foto de Capa do Combo (Upload Direto Storage)</label>
                <label className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl py-3.5 px-4 text-xs font-bold text-slate-500 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                   <Upload size={16} className="text-[#0085FF]"/>
                   <span className="truncate">{arquivoCapa ? arquivoCapa.name : 'Selecionar imagem de alta resolução'}</span>
                   <input required type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setArquivoCapa(e.target.files[0])} />
                </label>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider"><FileText size={12}/> Resumo para Vitrine (Descrição Curta)</label>
                <textarea required rows={2} name="descricao_curta" value={formData.descricao_curta} onChange={handleInputChange} placeholder="Frase resumida para listagem do card do cliente..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50 resize-none" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider"><FileText size={12}/> Roteiro Cronológico Detalhado</label>
                <textarea required rows={4} name="roteiro_detalhado" value={formData.roteiro_detalhado} onChange={handleInputChange} placeholder="Dia 1: Recepção... Dia 2: Saída com condutor florestal..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#0085FF] bg-slate-50/50 resize-y" />
              </div>
            </div>
          </section>

          {/* FASE 2: REDE HOTELEIRA FILTRADA POR DISPONIBILIDADE */}
          <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-5 text-left relative">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-amber-500 text-white p-2 rounded-xl"><Bed size={18} /></div>
              <h2 className={`${jakarta.className} text-base font-black text-slate-800`}>Fase 2: Alojamento Disponível no Período</h2>
            </div>

            {verificandoInventario && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 py-6 justify-center bg-slate-50 rounded-2xl"><Loader2 className="animate-spin text-amber-500" size={16}/> Escaneando quartos vagos na base...</div>
            )}

            {!dataPretendida && !verificandoInventario && (
              <div className="text-center py-8 text-xs font-bold text-slate-400 bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl">Aguardando definição da data na Fase 1 para liberar hotéis com vagas.</div>
            )}

            {dataPretendida && !verificandoInventario && hoteisDisponiveis.length === 0 && (
              <div className="p-4 bg-red-50 text-red-800 rounded-xl text-xs font-bold border border-red-100">Alerta Comercial: Nenhum hotel parceiro possui vagas abertas/lançadas no sistema de disponibilidade para o dia {dataPretendida.split('-').reverse().join('/')}.</div>
            )}

            {dataPretendida && !verificandoInventario && hoteisDisponiveis.length > 0 && (
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
                           <p className="text-[10px] font-black text-amber-600 mt-1">Base: R$ {hotel.quarto_standard_preco || '0'}</p>
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
              <h2 className={`${jakarta.className} text-base font-black text-slate-800`}>Fase 3: Condutores de Turismo Livres na Data</h2>
            </div>

            {verificandoInventario && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 py-6 justify-center bg-slate-50 rounded-2xl"><Loader2 className="animate-spin text-green-600" size={16}/> Verificando escalas e saídas dos guias...</div>
            )}

            {!dataPretendida && !verificandoInventario && (
              <div className="text-center py-8 text-xs font-bold text-slate-400 bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl">Aguardando definição da data na Fase 1 para liberar guias sem conflito de escala.</div>
            )}

            {dataPretendida && !verificandoInventario && guiasDisponiveis.length === 0 && (
              <div className="p-4 bg-red-50 text-red-800 rounded-xl text-xs font-bold border border-red-100">Todos os guias homologados possuem expedições marcadas ou estão indisponíveis para este dia.</div>
            )}

            {dataPretendida && !verificandoInventario && guiasDisponiveis.length > 0 && (
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
                           <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{guia.especialidade || 'Ecoturismo'}</p>
                           <p className="text-[10px] font-black text-green-700 mt-1">Diária: R$ {guia.preco_diaria}</p>
                        </div>
                        {isSel && <div className="absolute top-2 right-2 w-4 h-4 bg-[#009640] text-white rounded-full flex items-center justify-center"><Check size={10}/></div>}
                     </div>
                   );
                 })}
              </div>
            )}
          </section>

          {/* FINALIZAÇÃO */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 gap-4 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#0085FF]" /> Homologação Estrutural Integrada</p>
             <button 
               type="submit" 
               disabled={enviando || !selectedHotelId || !selectedGuiaId}
               className="w-full sm:w-auto bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all active:scale-95 cursor-pointer"
            >
              {enviando ? <><Loader2 className="w-4 h-4 animate-spin"/> Computando Estrutura...</> : <><Save size={14}/> Consolidar e Lançar Pacote</>}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}