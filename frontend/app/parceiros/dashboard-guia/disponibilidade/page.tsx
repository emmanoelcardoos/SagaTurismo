'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, Calendar as CalendarIcon, 
  CheckCircle2, AlertTriangle, Save, Info, Compass, 
  ChevronLeft, ChevronRight, Plus, DollarSign, Users, 
  MapPin, Trash2, Upload, Images, MailWarning
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
  const [categoria, setCategoria] = useState('Trilha');
  const [descricaoCurta, setDescricaoCurta] = useState('');
  const [descricaoCompleta, setDescricaoCompleta] = useState('');
  const [horarioSaida, setHorarioSaida] = useState('');
  const [pontoEncontro, setPontoEncontro] = useState('');
  const [coordenadas, setCoordenadas] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [vagasTotais, setVagasTotais] = useState('20');
  const [dataPasseio, setDataPasseio] = useState<Date | null>(null);

  // ── ESTADOS EXCLUSIVOS DE ARQUIVOS (AUTOMATIZAÇÃO SUPABASE) ──
  const [arquivoCapa, setArquivoCapa] = useState<File | null>(null);
  const [arquivosGaleria, setArquivosGaleria] = useState<File[]>([]);

  // ── LISTA DE PASSEIOS JÁ CRIADOS PELO GUIA ──
  const [passeiosExistentes, setPasseiosExistentes] = useState<PasseioCadastrado[]>([]);

  // 1. VALIDAÇÃO DE SESSÃO ISOLADA
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

  // 2. CARREGAR HISTÓRICO DE PASSEIOS DO GUIA
  useEffect(() => {
    if (!parceiroId) return;

    async function carregarPasseios() {
      const { data, error } = await supabase
        .from('passeios')
        .select('id, titulo, data_passeio, valor_total, vagas_totais, vagas_disponiveis, categoria')
        .eq('guia_id', parceiroId)
        .order('data_passeio', { ascending: true });

      if (!error && data) setPasseiosExistentes(data);
    }
    carregarPasseios();
  }, [parceiroId, isSubmitting]);

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

  // Lógica para capturar múltiplos arquivos da galeria (Max 6)
  const handleGaleriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const arquivosSelecionados = Array.from(e.target.files);
      if (arquivosSelecionados.length > 6) {
        alert("Atenção: O sistema municipal permite no máximo 6 fotos para a galeria do roteiro.");
        setArquivosGaleria(arquivosSelecionados.slice(0, 6));
      } else {
        setArquivosGaleria(arquivosSelecionados);
      }
    }
  };

  // 3. ENGENHARIA DE SUBMISSÃO COM UPLOAD AUTOMÁTICO E ALERTA RESEND
  const handleCriarPasseio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parceiroId) return;

    if (!dataPasseio) {
      setStatusMensagem({ tipo: 'erro', texto: 'Por favor, selecione a data do passeio no calendário.' });
      return;
    }

    if (!arquivoCapa) {
      setStatusMensagem({ tipo: 'erro', texto: 'Por favor, anexe uma imagem de capa oficial para homologação.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMensagem(null);

    const vTotal = parseFloat(valorTotal.replace(',', '.'));
    const taxaPref = vTotal * 0.10;

    try {
      // [A] MOTOR DE UPLOAD AUTOMÁTICO - FOTO DE CAPA
      const pathCapa = `capas/${parceiroId}_${Date.now()}_${arquivoCapa.name}`;
      const { error: errCapa } = await supabase.storage
        .from('imagens-passeios')
        .upload(pathCapa, arquivoCapa);
      
      if (errCapa) throw new Error("Falha no upload da foto de capa.");
      
      const { data: urlCapaPublica } = supabase.storage
        .from('imagens-passeios')
        .getPublicUrl(pathCapa);

      // [B] MOTOR DE UPLOAD AUTOMÁTICO - GALERIA DE FOTOS (ATÉ 6)
      const urlsGaleria: string[] = [];
      for (const file of arquivosGaleria) {
        const pathFoto = `galeria/${parceiroId}_${Date.now()}_${file.name}`;
        const { error: errFoto } = await supabase.storage.from('imagens-passeios').upload(pathFoto, file);
        if (!errFoto) {
          const { data: urlFotoPublica } = supabase.storage.from('imagens-passeios').getPublicUrl(pathFoto);
          urlsGaleria.push(urlFotoPublica.publicUrl);
        }
      }

      // [C] INSERÇÃO RESTRITA NA BASE DE DADOS (Entra desativado para auditoria)
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
          ativo: false, // ◄── FORÇADO FALSE: Entra em análise
          destaque: false // ◄── FORÇADO FALSE: Sem privilégios automáticos
        }]);

      if (errInsert) throw errInsert;

      // [D] DISPARO DO ALERTA DE E-MAIL (RESEND VIA BACKEND/RAILWAY)
      try {
        await fetch(`https://sagaturismo-production.up.railway.app/api/v1/notificacoes/novo-passeio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guia_nome: nomeNegocio,
            passeio_titulo: titulo,
            data_evento: formatarDataIso(dataPasseio)
          })
        });
      } catch (errEmail) {
        console.error("Falha silenciosa ao emitir e-mail de alerta do Resend.", errEmail);
      }

      setStatusMensagem({ 
        tipo: 'sucesso', 
        texto: 'Solicitação enviada! O roteiro e as imagens foram processados pela Supabase. Aguarde a homologação da prefeitura para ativação.' 
      });
      
      // Limpeza de formulário
      setTitulo(''); setDescricaoCurta(''); setDescricaoCompleta('');
      setHorarioSaida(''); setPontoEncontro(''); setCoordenadas(''); setValorTotal('');
      setDataPasseio(null); setArquivoCapa(null); setArquivosGaleria([]);

    } catch (err: any) {
      console.error(err);
      setStatusMensagem({ tipo: 'erro', texto: err.message || 'Erro de comunicação interna.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletarPasseio = async (idPasseio: string) => {
    if (!confirm("Tem certeza que deseja remover este roteiro da vitrine?")) return;
    try {
      const { error } = await supabase.from('passeios').delete().eq('id', idPasseio);
      if (error) throw error;
      setStatusMensagem({ tipo: 'sucesso', texto: 'Roteiro removido com sucesso.' });
      setPasseiosExistentes(prev => prev.filter(p => p.id !== idPasseio));
    } catch (err) {
      setStatusMensagem({ tipo: 'erro', texto: 'Incapaz de deletar roteiros que possuem histórico operacional ativo.' });
    }
  };

  const anoCorrente = mesAtual.getFullYear();
  const mesCorrente = mesAtual.getMonth();
  const diasMes = diasDoMes(anoCorrente, mesCorrente);
  const primeiroDia = primeiroDiaDoMes(anoCorrente, mesCorrente);
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  return (
    <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col`}>
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
          <Link href="/" className="relative h-10 w-28 md:w-36 shrink-0"><Image src="/logop.png" alt="SGA" fill priority className="object-contain object-left" /></Link>
          <Link href="/parceiros/dashboard-guia" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#009640] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-full shadow-sm">
            <ArrowLeft size={14} /> <span>Voltar ao Painel</span>
          </Link>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-12 flex-1 space-y-8">
        <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          
          <div className="p-5 md:p-8 border-b border-slate-100 bg-slate-50/50">
             <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-[#009640] shrink-0 shadow-sm">
                  <Compass size={24} />
                </div>
                <div>
                   <h2 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900`}>Solicitar Homologação de Rota</h2>
                   <p className="text-xs font-bold text-slate-400 mt-1">Envie os dados e as imagens originais para validação e abertura de vendas da SEMTUR.</p>
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

             <form onSubmit={handleCriarPasseio} className="space-y-6">
                
                {/* 1. INFORMAÇÕES BÁSICAS */}
                <div className="grid gap-4 sm:grid-cols-2">
                   <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Título do Passeio</label>
                      <input required type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-[#009640]" placeholder="Ex: Expedição Noturna Casa de Pedra" />
                   </div>
                   
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Categoria</label>
                      <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none cursor-pointer">
                         <option value="Trilha">Trilha / Caminhada</option>
                         <option value="Praia">Praia / Balneário</option>
                         <option value="Camping">Camping / Acampamento</option>
                         <option value="Cachoeira">Cachoeira / Ecoturismo</option>
                      </select>
                   </div>

                   {/* NOVO: UPLOAD NATIVO - AUTOMATIZAÇÃO DE IMAGEM DE CAPA */}
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Foto de Capa do Evento</label>
                      <label className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-500 flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                         <Upload size={16} className="text-[#009640]"/>
                         <span className="truncate">{arquivoCapa ? arquivoCapa.name : 'Anexar Imagem Principal'}</span>
                         <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setArquivoCapa(e.target.files[0])} />
                      </label>
                   </div>

                   {/* NOVO: UPLOAD NATIVO - AUTOMATIZAÇÃO DA GALERIA MÚLTIPLA (MAX 6) */}
                   <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Fotos Adicionais da Galeria (Máximo 6 Imagens)</label>
                      <label className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 text-xs font-bold text-slate-500 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                         <Images size={24} className="text-slate-400"/>
                         <span>{arquivosGaleria.length > 0 ? `${arquivosGaleria.length} imagem(ns) selecionada(s)` : 'Clique aqui para carregar a galeria de fotos'}</span>
                         <input type="file" accept="image/*" multiple className="hidden" onChange={handleGaleriaChange} />
                      </label>
                   </div>

                   <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Resumo Comercial (Descrição Curta)</label>
                      <input required type="text" value={descricaoCurta} onChange={e => setDescricaoCurta(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-semibold outline-none focus:border-[#009640]" placeholder="Uma frase chamativa para o card de listagem..." />
                   </div>
                   <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Itinerário Completo & Recomendações (Descrição Detalhada)</label>
                      <textarea required value={descricaoCompleta} onChange={e => setDescricaoCompleta(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-medium outline-none h-24 focus:border-[#009640]" placeholder="Descreva os pontos de paragem, regras de segurança, o que levar e detalhes operacionais..." />
                   </div>
                </div>

                {/* 2. CALENDÁRIO COM DIAS DA SEMANA COMPLETOS */}
                <div className="border-t border-slate-100 pt-6">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Escolha o Dia do Evento no Calendário</label>
                   <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-6 shadow-inner">
                      <div className="flex items-center justify-between mb-4">
                         <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente - 1))} className="p-1.5 hover:bg-slate-200 rounded-full"><ChevronLeft size={18}/></button>
                         <p className="font-bold text-slate-800 capitalize text-sm">{mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                         <button type="button" onClick={() => setMesAtual(new Date(anoCorrente, mesCorrente + 1))} className="p-1.5 hover:bg-slate-200 rounded-full"><ChevronRight size={18}/></button>
                      </div>
                      
                      {/* ── ATUALIZAÇÃO CORRIGIDA: Cabeçalho com dias da semana legíveis ── */}
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                         {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
                           <span key={i} className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{d}</span>
                         ))}
                      </div>

                      <div className="grid grid-cols-7 gap-y-1 text-center">
                         {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
                         {Array.from({ length: diasMes }).map((_, i) => {
                            const dDia = new Date(anoCorrente, mesCorrente, i + 1);
                            const passes = dDia < hoje;
                            const selecionado = dataPasseio && dDia.getTime() === dataPasseio.getTime();
                            return (
                              <button type="button" key={i} disabled={passes} onClick={() => handleDateClickCommon(dDia, dataPasseio, null, setDataPasseio, () => {})} className={`w-full aspect-square flex items-center justify-center text-xs font-bold rounded-lg transition-all ${passes ? 'text-slate-300 pointer-events-none' : selecionado ? 'bg-[#009640] text-white shadow-md scale-105' : 'text-slate-800 hover:bg-slate-200'}`}>
                                 {i + 1}
                              </button>
                            );
                         })}
                      </div>
                   </div>
                   <div className="mt-3 bg-green-50 text-[#009640] px-4 py-2.5 rounded-xl text-xs font-bold w-fit">
                      Data Agendada: {dataPasseio ? dataPasseio.toLocaleDateString('pt-BR') : 'Nenhuma selecionada'}
                   </div>
                </div>

                {/* 3. LOGÍSTICA DE EMBARQUE */}
                <div className="grid gap-4 sm:grid-cols-3 border-t border-slate-100 pt-6">
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Horário de Saída</label>
                      <input type="time" value={horarioSaida} onChange={e => setHorarioSaida(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-[#009640]" />
                   </div>
                   <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Ponto de Encontro Físico</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input type="text" value={pontoEncontro} onChange={e => setPontoEncontro(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold outline-none focus:border-[#009640]" placeholder="Ex: Barraca Central, Praia do Pium" />
                      </div>
                   </div>
                   <div className="sm:col-span-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Coordenadas do Google Maps (Opcional)</label>
                      <input type="text" value={coordenadas} onChange={e => setCoordenadas(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-[#009640]" placeholder="Ex: -6.40129, -48.51092" />
                   </div>
                </div>

                {/* 4. PREÇOS, VAGAS & IMPACTO FINANCEIRO */}
                <div className="grid gap-4 sm:grid-cols-3 border-t border-slate-100 pt-6">
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Vagas do Grupo</label>
                      <input type="number" required value={vagasTotais} onChange={e => setVagasTotais(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-[#009640]" />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Preço por Pessoa (R$)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-800" size={16}/>
                        <input type="text" required placeholder="0,00" value={valorTotal} onChange={e => setValorTotal(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm font-black text-slate-800 outline-none focus:border-[#009640]" />
                      </div>
                   </div>
                   <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left flex flex-col justify-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Taxa SEMTUR (10% Retido)</span>
                      <span className="text-sm font-mono font-black text-red-600 mt-1">
                        R$ {valorTotal ? (parseFloat(valorTotal.replace(',', '.')) * 0.10).toFixed(2) : '0,00'}
                      </span>
                   </div>
                </div>

                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl flex items-start gap-3 border border-amber-100 text-left">
                   <MailWarning size={18} className="shrink-0 mt-0.5 text-amber-600" />
                   <p className="text-[11px] font-bold leading-relaxed">
                     Nota de Moderação: O roteiro será guardado na base de dados com o estado inativo por omissão. Um e-mail de alerta do Resend será enviado automaticamente para a Secretaria de Turismo proceder à auditoria das imagens e ativação comercial da rota.
                   </p>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-[#009640] hover:bg-[#007a33] text-white py-4 rounded-xl font-black uppercase text-xs md:text-sm tracking-widest shadow-xl flex items-center justify-center gap-2">
                   {isSubmitting ? <><Loader2 className="animate-spin" size={18}/> Submetendo e efetuando Upload...</> : <><Save size={16}/> Submeter Solicitação Comercial</>}
                </button>
             </form>
          </div>
        </div>

        {/* GERENCIADOR DE EXPEDIÇÕES ATIVAS */}
        <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-xl p-5 md:p-8 text-left">
           <h3 className={`${jakarta.className} text-lg font-black text-slate-900 mb-2`}>Minhas Expedições Cadastradas</h3>
           <p className="text-xs font-bold text-slate-400 mb-4">Histórico de roteiros submetidos.</p>
           
           {passeiosExistentes.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 bg-slate-50 p-4 rounded-xl text-center">Nenhum passeio cadastrado na sua conta por enquanto.</p>
           ) : (
              <div className="space-y-3">
                 {passeiosExistentes.map((p) => (
                    <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 transition-all hover:bg-slate-100/50">
                       <div>
                          <h4 className="font-black text-slate-900 text-sm">{p.titulo}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium mt-1">
                             <span className="text-[#009640] font-bold">Dia: {p.data_passeio.split('-').reverse().join('/')}</span>
                             <span>Preço: R$ {Number(p.valor_total).toFixed(2)}</span>
                             <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600 uppercase">{p.categoria}</span>
                          </div>
                       </div>
                       <button type="button" onClick={() => handleDeletarPasseio(p.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-xl shadow-sm transition-colors shrink-0">
                          <Trash2 size={16} />
                       </button>
                    </div>
                 ))}
              </div>
           )}
        </div>

      </div>
    </div>
  );
}