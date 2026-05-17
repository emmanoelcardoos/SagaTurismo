'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, Bed, Compass, 
  Save, Sparkles, AlertCircle, CheckCircle2, Type, FileText, DollarSign, Clock, Image as ImageIcon
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
  preco_medio?: string;
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
  const [loadingDados, setLoadingDados] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  // Bancos de dados locais para seleção
  const [hoteis, setHoteis] = useState<Hotel[]>([]);
  const [guias, setGuias] = useState<Guia[]>([]);

  // Estado dos Itens Selecionados Visivelmente
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [selectedGuiaId, setSelectedGuiaId] = useState<string | null>(null);

  // Estado dos Campos do Formuário (Colunas exatas da tabela 'pacotes')
  const [formData, setFormData] = useState({
    titulo: '',
    descricao_curta: '',
    roteiro_detalhado: '',
    imagem_principal: '',
    dias: 1,
    noites: 0,
    preco: 0,
    categoria: 'Aventura',
    horarios_info: '',
    ativo: true
  });

  // 1. CARREGAR HOTÉIS E GUIAS DISPONÍVEIS
  useEffect(() => {
    async function obterDadosRelacionais() {
      try {
        const [resHoteis, resGuias] = await Promise.all([
          supabase.from('hoteis').select('id, nome, tipo, imagem_url, preco_medio'),
          supabase.from('guias').select('id, nome, especialidade, imagem_url, preco_diaria')
        ]);

        if (resHoteis.data) setHoteis(resHoteis.data as Hotel[]);
        if (resGuias.data) setGuias(resGuias.data as Guia[]);
      } catch (err) {
        console.error("Erro ao carregar componentes do pacote:", err);
        setErro("Não foi possível carregar os hotéis ou guias para seleção.");
      } finally {
        setLoadingDados(false);
      }
    }

    obterDadosRelacionais();
  }, []);

  // 2. SUBMISSÃO DO PACOTE + ITENS DO PACOTE (TRANSAÇÃO LOGICAL)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotelId) {
      setErro("Por favor, selecione um Hotel oficial para o pacote.");
      return;
    }
    if (!selectedGuiaId) {
      setErro("Por favor, selecione um Guia credenciado para o pacote.");
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      // Passo A: Inserir na tabela 'pacotes'
      const { data: novoPacote, error: errPacote } = await supabase
        .from('pacotes')
        .insert([{
          titulo: formData.titulo,
          descricao_curta: formData.descricao_curta,
          roteiro_detalhado: formData.roteiro_detalhado,
          imagem_principal: formData.imagem_principal || null,
          dias: Number(formData.dias),
          noites: Number(formData.noites),
          preco: Number(formData.preco),
          categoria: formData.categoria,
          horarios_info: formData.horarios_info || null,
          ativo: formData.ativo
        }])
        .select()
        .single();

      if (errPacote || !novoPacote) throw errPacote;

      // Passo B: Vincular na tabela 'pacote_itens' usando o id gerado
      const { error: errItens } = await supabase
        .from('pacote_itens')
        .insert([{
          pacote_id: novoPacote.id,
          hotel_id: selectedHotelId,
          guia_id: selectedGuiaId
        }]);

      if (errItens) throw errItens;

      setSucesso(true);
      setTimeout(() => {
        router.push('/parceiros/dashboard-agencia');
      }, 2000);

    } catch (err: any) {
      console.error("Erro na criação total do pacote:", err);
      setErro(err.message || "Erro interno ao salvar pacote. Verifique as restrições da tabela.");
    } finally {
      setEnviando(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const IMG_FALLBACK = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1721";

  if (loadingDados) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-[#0085FF]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest text-slate-500">Montando Construtor de Roteiros...</p>
      </div>
    );
  }

  return (
    <div className={`${inter.className} min-h-screen bg-[#F1F5F9] text-slate-900 pb-16`}>
      
      {/* HEADER SUPERIOR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4 shadow-sm">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/parceiros/dashboard-agencia" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={16} /> Voltar ao Painel
          </Link>
          <div className="text-right">
            <h1 className={`${jakarta.className} font-black text-slate-900 text-lg`}>Nova Experiência</h1>
            <p className="text-[10px] font-black uppercase text-[#0085FF] tracking-wider">Módulo de Engenharia de Combos</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 mt-8 space-y-8">
        
        {/* NOTIFICAÇÕES */}
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-sm animate-shake">
            <AlertCircle size={20} className="shrink-0 text-red-500" />
            <p className="text-sm font-semibold">{erro}</p>
          </div>
        )}

        {sucesso && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-sm">
            <CheckCircle2 size={20} className="shrink-0 text-green-500" />
            <p className="text-sm font-bold">Pacote Distribuído e Publicado com sucesso! Redirecionando...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SEÇÃO 1: SELECIONADOR DE HOTEL OFICIAL */}
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-amber-500 text-white p-2.5 rounded-xl shadow-md"><Bed size={20} /></div>
              <div>
                <h2 className={`${jakarta.className} text-lg font-black text-slate-800`}>1. Selecione o Hotel Oficial</h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">Este estabelecimento fornecerá a hospedagem base inclusa no combo.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
              {hoteis.map(hotel => {
                const isSelected = selectedHotelId === hotel.id;
                return (
                  <div 
                    key={hotel.id}
                    onClick={() => setSelectedHotelId(hotel.id)}
                    className={`cursor-pointer border-2 rounded-2xl overflow-hidden bg-white shadow-sm transition-all flex flex-col justify-between ${
                      isSelected ? 'border-[#0085FF] ring-4 ring-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="relative h-32 w-full bg-slate-100">
                      <Image src={hotel.imagem_url || IMG_FALLBACK} alt={hotel.nome} fill className="object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#0085FF]/10 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-[#0085FF] text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-md">Selecionado</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 text-left flex-1 flex flex-col justify-between bg-slate-50/50">
                      <div>
                        <h3 className="font-black text-sm text-slate-900 line-clamp-1">{hotel.nome}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{hotel.tipo}</p>
                      </div>
                      <p className="text-xs font-black text-amber-600 mt-3">{hotel.preco_medio || 'Sob Consulta'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SEÇÃO 2: SELECIONADOR DE GUIA LOCAL */}
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-[#009640] text-white p-2.5 rounded-xl shadow-md"><Compass size={20} /></div>
              <div>
                <h2 className={`${jakarta.className} text-lg font-black text-slate-800`}>2. Selecione o Guia Condutor</h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">O especialista local encarregado de guiar as expedições terrestres ou fluviais.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
              {guias.map(guia => {
                const isGuiaSelected = selectedGuiaId === guia.id;
                return (
                  <div 
                    key={guia.id}
                    onClick={() => setSelectedGuiaId(guia.id)}
                    className={`cursor-pointer border-2 rounded-2xl overflow-hidden bg-white shadow-sm transition-all flex flex-col justify-between ${
                      isGuiaSelected ? 'border-[#009640] ring-4 ring-green-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="relative h-32 w-full bg-slate-100">
                      <Image src={guia.imagem_url || IMG_FALLBACK} alt={guia.nome} fill className="object-cover" />
                      {isGuiaSelected && (
                        <div className="absolute inset-0 bg-[#009640]/10 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-[#009640] text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-md">Condutor Escolhido</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 text-left flex-1 flex flex-col justify-between bg-slate-50/50">
                      <div>
                        <h3 className="font-black text-sm text-slate-900 line-clamp-1">{guia.nome}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{guia.especialidade || 'Geral'}</p>
                      </div>
                      <p className="text-xs font-black text-[#009640] mt-3">Diária: R$ {guia.preco_diaria}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SEÇÃO 3: FORMULÁRIO DE METADADOS DO PACOTE */}
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-[#0085FF] text-white p-2.5 rounded-xl shadow-md"><Sparkles size={20} /></div>
              <div>
                <h2 className={`${jakarta.className} text-lg font-black text-slate-800`}>3. Detalhes Fiscais e Logísticos</h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">Preencha os dados finais que serão expostos diretamente aos turistas.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* TITULO */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Type size={14}/> Título do Pacote</label>
                <input required type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} placeholder="Ex: Combo Floresta Amazónica e Charme de Hotel" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0085FF] bg-slate-50" />
              </div>

              {/* CATEGORIA */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">Categoria</label>
                <select name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0085FF] bg-slate-50">
                  <option value="Aventura">Aventura</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Gastronómico">Gastronómico</option>
                  <option value="Luxo">Estadia de Luxo</option>
                  <option value="Ecológico">Ecológico / Sustentável</option>
                </select>
              </div>

              {/* URL IMAGEM PRINCIPAL */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><ImageIcon size={14}/> URL da Imagem Principal</label>
                  <input type="url" name="imagem_principal" value={formData.imagem_principal} onChange={handleInputChange} placeholder="https://images.unsplash.com/..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0085FF] bg-slate-50" />
                </div>
                
                {/* PREÇO UNITÁRIO */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={14}/> Preço Total Combo (R$)</label>
                  <input required type="number" min="0" step="0.01" name="preco" value={formData.preco} onChange={handleInputChange} placeholder="1450.00" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-[#0085FF] focus:outline-none focus:border-[#0085FF] bg-slate-50" />
                </div>
              </div>

              {/* DIAS E NOITES */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Clock size={14}/> Quantidade Dias</label>
                  <input required type="number" min="1" name="dias" value={formData.dias} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0085FF] bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Clock size={14}/> Quantidade Noites</label>
                  <input required type="number" min="0" name="noites" value={formData.noites} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0085FF] bg-slate-50" />
                </div>
              </div>

              {/* INFORMAÇÕES DE HORÁRIOS */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">Horários / Ponto de Embarque</label>
                <input type="text" name="horarios_info" value={formData.horarios_info} onChange={handleInputChange} placeholder="Ex: Saídas diárias do Porto Hidroviário às 08:00h" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0085FF] bg-slate-50" />
              </div>

              {/* DESCRICAO CURTA */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><FileText size={14}/> Descrição de Vitrine (Curta)</label>
                <textarea required rows={2} name="descricao_curta" value={formData.descricao_curta} onChange={handleInputChange} placeholder="Resumo em 2 linhas que aparece no card de vendas do cliente..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0085FF] bg-slate-50 resize-none" />
              </div>

              {/* ROTEIRO DETALHADO */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><FileText size={14}/> Roteiro Detalhado Passo a Passo</label>
                <textarea required rows={5} name="roteiro_detalhado" value={formData.roteiro_detalhado} onChange={handleInputChange} placeholder="Dia 1: Chegada e check-in no hotel... Dia 2: Travessia com o guia..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0085FF] bg-slate-50 resize-y" />
              </div>

            </div>
          </section>

          {/* BOTÃO DE SUBMISSÃO */}
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={enviando}
              className="bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer"
            >
              {enviando ? (
                <> <Loader2 className="w-4 h-4 animate-spin"/> Implantando Combo... </>
              ) : (
                <> <Save size={14}/> Consolidar e Lançar Pacote </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}