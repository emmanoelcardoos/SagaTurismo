'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, MapPin, Calendar, Clock, 
  CheckCircle2, Bed, Compass, Ticket, ShieldCheck, 
  ChevronRight, Camera, Info, QrCode, Wallet, X
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS ──
type Hotel = { id: string; nome: string; preco_medio: any; tipo: string; imagem_url: string; descricao: string; };
type Guia = { id: string; nome: string; preco_diaria: any; especialidade: string; imagem_url: string; descricao: string; };
type Atracao = { id: string; nome: string; preco_entrada: any; tipo: string; imagem_url: string; descricao: string; };

type Pacote = {
  id: string;
  titulo: string;
  descricao_curta: string;
  roteiro_detalhado: string;
  imagens_galeria: string[];
  imagem_principal: string;
  dias: number;
  noites: number;
  horarios_info: string;
  pacote_itens: {
    hoteis: Hotel | null;
    guias: Guia | null;
    atracoes: Atracao | null;
  }[];
};

// ── FUNÇÕES DE SEGURANÇA E FORMATAÇÃO ──
const parseValor = (valor: any): number => {
  if (valor === null || valor === undefined || valor === '') return 0;
  if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;
  if (typeof valor === 'string') {
    const formatado = parseFloat(valor.replace(',', '.'));
    return isNaN(formatado) ? 0 : formatado;
  }
  return 0;
};

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

export default function DetalhePacotePage() {
  const { id } = useParams();
  const router = useRouter();
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados de Seleção do Usuário
  const [hoteisDisponiveis, setHoteisDisponiveis] = useState<Hotel[]>([]);
  const [guiasDisponiveis, setGuiasDisponiveis] = useState<Guia[]>([]);
  const [atracoesInclusas, setAtracoesInclusas] = useState<Atracao[]>([]);

  const [hotelSelecionado, setHotelSelecionado] = useState<Hotel | null>(null);
  const [guiaSelecionado, setGuiaSelecionado] = useState<Guia | null>(null);

  // Controle da Galeria de Imagens
  const [abaGaleria, setAbaGaleria] = useState<'roteiro' | 'hotel'>('roteiro');

  // Estados do Modal de Checkout
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoPix, setProcessandoPix] = useState(false);
  const [pixGerado, setPixGerado] = useState(false);

  useEffect(() => {
    async function fetchPacoteCompleto() {
      const { data, error } = await supabase
        .from('pacotes')
        .select(`
          *,
          pacote_itens (
            hoteis (*),
            guias (*),
            atracoes (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error("Erro ao carregar pacote:", error);
        router.push('/pacotes');
        return;
      }

      const pct = data as Pacote;
      setPacote(pct);

      const hoteis = pct.pacote_itens.map(i => i.hoteis).filter(Boolean) as Hotel[];
      const guias = pct.pacote_itens.map(i => i.guias).filter(Boolean) as Guia[];
      const atracoes = pct.pacote_itens.map(i => i.atracoes).filter(Boolean) as Atracao[];

      setHoteisDisponiveis(hoteis);
      setGuiasDisponiveis(guias);
      setAtracoesInclusas(atracoes);

      if (hoteis.length > 0) setHotelSelecionado(hoteis[0]);
      if (guias.length > 0) setGuiaSelecionado(guias[0]);

      setLoading(false);
    }
    if (id) fetchPacoteCompleto();
  }, [id, router]);

  // Cálculo Dinâmico do Total 100% Protegido contra NaN
  const valorAtracoes = atracoesInclusas.reduce((acc, curr) => acc + parseValor(curr.preco_entrada), 0);
  const valorHotel = hotelSelecionado ? parseValor(hotelSelecionado.preco_medio) : 0;
  const valorGuia = guiaSelecionado ? parseValor(guiaSelecionado.preco_diaria) : 0;
  const valorTotal = valorAtracoes + valorHotel + valorGuia;

  // Funções do Checkout
  const abrirCheckout = () => setModalAberto(true);
  const fecharCheckout = () => {
    setModalAberto(false);
    setProcessandoPix(false);
    setPixGerado(false);
  };

  const simularPagamentoPix = () => {
    setProcessandoPix(true);
    setTimeout(() => {
      setProcessandoPix(false);
      setPixGerado(true);
    }, 2500);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Conectando ao sistema...</p>
    </div>
  );

  if (!pacote) return null;

  const imagensRoteiro = [pacote.imagem_principal, ...(pacote.imagens_galeria || [])].slice(0, 5);

  return (
    <main className={`${inter.className} bg-slate-50 min-h-screen pb-32`}>
      
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 h-20 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-[#00577C] font-semibold transition-colors">
            <ArrowLeft size={20} /> Voltar aos Pacotes
          </button>
          <div className="hidden sm:flex items-center gap-3 text-sm font-bold text-slate-400">
            <ShieldCheck size={18} className="text-[#009640]" /> Reserva Oficial Garantida
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 mt-8">
        
        {/* CABEÇALHO */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#00577C] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-100">
            <MapPin size={12} /> Destino Oficial: São Geraldo do Araguaia
          </div>
          <h1 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4`}>
            {pacote.titulo}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
            <span className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <Calendar size={16} className="text-[#F9C400]" /> {pacote.dias} dias e {pacote.noites} noites
            </span>
            <span className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <Clock size={16} className="text-[#009640]" /> {pacote.horarios_info || "Horários Flexíveis"}
            </span>
          </div>
        </div>

        {/* GALERIA DE IMAGENS PROFISSIONAL (COM ABAS INTERATIVAS) */}
        <section className="mb-12">
          {/* Controles das Abas */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <button 
              onClick={() => setAbaGaleria('roteiro')}
              className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${abaGaleria === 'roteiro' ? 'bg-[#00577C] text-white shadow-md ring-2 ring-offset-2 ring-[#00577C]' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              <Camera size={16} /> Destino e Trilhas
            </button>
            <button 
              onClick={() => setAbaGaleria('hotel')}
              className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${abaGaleria === 'hotel' ? 'bg-[#00577C] text-white shadow-md ring-2 ring-offset-2 ring-[#00577C]' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              <Bed size={16} /> Ver Hospedagem Selecionada
            </button>
          </div>

          {/* Área das Fotos */}
          <div className="w-full h-[500px] rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-white">
            {abaGaleria === 'roteiro' ? (
              /* Bento Box do Roteiro */
              imagensRoteiro.length === 1 ? (
                <div className="relative w-full h-full">
                  <Image src={imagensRoteiro[0]} alt="Imagem do Roteiro" fill className="object-cover" priority />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-full p-2">
                  <div className="relative md:col-span-2 md:row-span-2 h-full w-full rounded-2xl overflow-hidden">
                    <Image src={imagensRoteiro[0]} alt="Principal" fill className="object-cover hover:scale-105 transition-transform duration-700" priority />
                  </div>
                  {imagensRoteiro.slice(1, 5).map((img, i) => (
                    <div key={i} className="relative h-full w-full hidden md:block rounded-2xl overflow-hidden">
                      <Image src={img} alt={`Galeria ${i}`} fill className="object-cover hover:scale-105 transition-transform duration-700" />
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Foto Interativa do Hotel Escolhido */
              <div className="relative w-full h-full bg-slate-100 flex flex-col items-center justify-center">
                {hotelSelecionado?.imagem_url ? (
                  <>
                    <Image src={hotelSelecionado.imagem_url} alt={hotelSelecionado.nome} fill className="object-cover animate-in fade-in duration-500" priority />
                    <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur px-6 py-4 rounded-2xl shadow-xl border border-white/20">
                      <p className={`${jakarta.className} text-xl font-bold text-[#00577C]`}>{hotelSelecionado.nome}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{hotelSelecionado.tipo}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-sm font-bold text-[#009640]">Incluso no resumo</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <Bed size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Selecione uma hospedagem abaixo para ver as fotos</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ESTRUTURA PRINCIPAL */}
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12">
          
          <div className="space-y-12">
            {/* DESCRIÇÃO E ROTEIRO */}
            <section className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3`}>
                <Info className="text-[#00577C]" /> Visão Geral do Roteiro
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                {pacote.descricao_curta}
              </p>
              
              <div className="relative border-l-2 border-slate-100 pl-6 pb-2 space-y-8">
                <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-line">
                  {pacote.roteiro_detalhado || "Consulte a prefeitura para o roteiro detalhado diário deste pacote."}
                </div>
              </div>
            </section>

            {/* SELEÇÃO 1: HOTÉIS */}
            <section>
              <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3`}>
                <Bed className="text-[#00577C]" /> 1. Escolha sua Hospedagem
              </h2>
              {hoteisDisponiveis.length === 0 ? (
                <p className="text-slate-500 italic bg-white p-6 rounded-2xl border border-slate-200">Não há hotéis associados a este pacote.</p>
              ) : (
                <div className="grid gap-4">
                  {hoteisDisponiveis.map((hotel) => (
                    <label 
                      key={hotel.id} 
                      className={`cursor-pointer flex flex-col md:flex-row gap-6 bg-white border-2 p-4 rounded-3xl transition-all ${
                        hotelSelecionado?.id === hotel.id ? 'border-[#00577C] shadow-md ring-4 ring-blue-50' : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="relative w-full md:w-40 h-32 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                        {hotel.imagem_url && <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover" />}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{hotel.tipo}</span>
                            <h4 className="text-xl font-bold text-slate-800 mt-1">{hotel.nome}</h4>
                          </div>
                          <input 
                            type="radio" 
                            name="hotel" 
                            className="w-5 h-5 text-[#00577C] mt-2" 
                            checked={hotelSelecionado?.id === hotel.id}
                            onChange={() => setHotelSelecionado(hotel)}
                          />
                        </div>
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">{hotel.descricao}</p>
                        <p className="text-[#009640] font-bold mt-3">+ {formatarMoeda(parseValor(hotel.preco_medio))} / pacote</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </section>

            {/* SELEÇÃO 2: GUIAS */}
            <section>
              <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3`}>
                <Compass className="text-[#009640]" /> 2. Escolha seu Guia Oficial
              </h2>
              {guiasDisponiveis.length === 0 ? (
                <p className="text-slate-500 italic bg-white p-6 rounded-2xl border border-slate-200">Não há guias obrigatórios associados a este pacote.</p>
              ) : (
                <div className="grid gap-4">
                  {guiasDisponiveis.map((guia) => (
                    <label 
                      key={guia.id} 
                      className={`cursor-pointer flex flex-col md:flex-row gap-6 bg-white border-2 p-4 rounded-3xl transition-all ${
                        guiaSelecionado?.id === guia.id ? 'border-[#009640] shadow-md ring-4 ring-green-50' : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="relative w-full md:w-32 h-32 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                        {guia.imagem_url && <Image src={guia.imagem_url} alt={guia.nome} fill className="object-cover" />}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guia Local - {guia.especialidade}</span>
                            <h4 className="text-xl font-bold text-slate-800 mt-1">{guia.nome}</h4>
                          </div>
                          <input 
                            type="radio" 
                            name="guia" 
                            className="w-5 h-5 text-[#009640] mt-2" 
                            checked={guiaSelecionado?.id === guia.id}
                            onChange={() => setGuiaSelecionado(guia)}
                          />
                        </div>
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">{guia.descricao}</p>
                        <p className="text-[#009640] font-bold mt-3">+ {formatarMoeda(parseValor(guia.preco_diaria))} / diária</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </section>

            {/* ITENS FIXOS: ATRAÇÕES */}
            {atracoesInclusas.length > 0 && (
              <section className="bg-slate-100/50 p-8 rounded-3xl border border-slate-200">
                <h2 className={`${jakarta.className} text-xl font-bold text-slate-900 mb-4 flex items-center gap-3`}>
                  <Ticket className="text-[#F9C400]" /> Atrações Inclusas no Roteiro
                </h2>
                <div className="space-y-4">
                  {atracoesInclusas.map(atracao => (
                    <div key={atracao.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800">{atracao.nome}</p>
                        <p className="text-xs text-slate-500 uppercase">{atracao.tipo}</p>
                      </div>
                      <p className="font-bold text-slate-600">{formatarMoeda(parseValor(atracao.preco_entrada))}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* ASIDE: RESUMO DE PREÇOS E CHECKOUT */}
          <aside>
            <div className="sticky top-28 bg-white rounded-[2rem] border-2 border-slate-200 p-8 shadow-2xl">
              <h3 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4`}>
                Resumo da Compra
              </h3>
              
              <div className="space-y-4 mb-8">
                {hotelSelecionado ? (
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-bold text-slate-700">Hospedagem</p>
                      <p className="text-slate-500 text-xs">{hotelSelecionado.nome}</p>
                    </div>
                    <span className="font-semibold">{formatarMoeda(valorHotel)}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Nenhuma hospedagem selecionada</p>
                )}

                {guiaSelecionado ? (
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-bold text-slate-700">Guia Local</p>
                      <p className="text-slate-500 text-xs">{guiaSelecionado.nome}</p>
                    </div>
                    <span className="font-semibold">{formatarMoeda(valorGuia)}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Nenhum guia selecionado</p>
                )}

                {atracoesInclusas.length > 0 && (
                  <div className="flex justify-between items-start text-sm pt-4 border-t border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700">Taxas e Atrações</p>
                      <p className="text-slate-500 text-xs">{atracoesInclusas.length} item(s) incluso(s)</p>
                    </div>
                    <span className="font-semibold">{formatarMoeda(valorAtracoes)}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500 font-bold uppercase text-xs">Total do Pacote</span>
                </div>
                <div className="text-right">
                  <span className={`${jakarta.className} text-4xl font-black text-[#009640]`}>
                    {formatarMoeda(valorTotal)}
                  </span>
                </div>
              </div>

              <button 
                onClick={abrirCheckout}
                disabled={valorTotal === 0}
                className="w-full bg-[#00577C] hover:bg-[#004a6b] disabled:bg-slate-300 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
              >
                Garantir Reserva Agora <ChevronRight size={20} />
              </button>
              
              <div className="flex items-center justify-center gap-2 text-center text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-widest">
                <Wallet size={14} className="text-[#009640]" /> Integração Oficial PagBank
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* ── MODAL DE CHECKOUT PIX ── */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            
            <div className="bg-[#00577C] p-6 text-white flex justify-between items-start">
              <div>
                <p className="text-[#F9C400] text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Checkout Governamental Seguro</p>
                <h3 className={`${jakarta.className} text-2xl font-bold leading-tight`}>Finalizar Reserva</h3>
              </div>
              <button onClick={fecharCheckout} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"><X size={20} /></button>
            </div>

            <div className="p-8">
              {!pixGerado ? (
                <>
                  <p className="text-slate-600 mb-6 text-center text-sm">
                    Você está prestes a reservar o pacote <b>{pacote.titulo}</b>. O pagamento será processado via PIX e o valor será dividido automaticamente entre a prefeitura e os prestadores de serviço escolhidos.
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-center">
                    <span className="text-slate-500 font-medium block mb-2">Valor Total a Pagar</span>
                    <span className={`${jakarta.className} font-black text-[#009640] text-4xl block`}>
                      {formatarMoeda(valorTotal)}
                    </span>
                  </div>

                  <button 
                    onClick={simularPagamentoPix}
                    disabled={processandoPix}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                      processandoPix ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-[#009640] hover:bg-[#007a33] text-white shadow-xl hover:-translate-y-1'
                    }`}
                  >
                    {processandoPix ? (
                      <><Loader2 className="animate-spin" size={24} /> Conectando ao PagBank...</>
                    ) : (
                      <><QrCode size={24} /> Pagar via PIX Agora</>
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-[#009640]" />
                  </div>
                  <h3 className={`${jakarta.className} text-2xl font-bold text-slate-800 mb-2`}>Reserva Solicitada!</h3>
                  <p className="text-slate-500 mb-8 text-sm">
                    Para garantir sua vaga, escaneie o código abaixo com o aplicativo do seu banco ou copie a chave Pix.
                  </p>
                  
                  <div className="w-48 h-48 bg-slate-100 border-2 border-dashed border-slate-300 mx-auto rounded-xl flex items-center justify-center mb-6">
                    <QrCode size={60} className="text-slate-300" />
                  </div>

                  <button className="bg-slate-100 hover:bg-slate-200 text-slate-800 w-full py-3 rounded-xl font-bold transition-colors shadow-sm">
                    Copiar Código PIX (Copia e Cola)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}