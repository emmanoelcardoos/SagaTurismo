'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, ArrowLeft, MapPin, Calendar, Clock, 
  CheckCircle2, Bed, Compass, Ticket, ShieldCheck, 
  ChevronRight, Camera, Info, QrCode, Wallet, X, Star,
  Award, Wifi, Wind, Tv, Waves, ImageIcon, Smartphone,
  Map, UserCheck, ShieldAlert
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS COMPLETAS E RÍGIDAS ──
type Hotel = { 
  id: string; 
  nome: string; 
  tipo: string; 
  imagem_url: string; 
  descricao: string;
  quarto_standard_nome: string; 
  quarto_standard_preco: any; 
  quarto_standard_comodidades: string[];
  quarto_luxo_nome: string; 
  quarto_luxo_preco: any; 
  quarto_luxo_comodidades: string[];
  galeria: string[] | string;
};

type Guia = { 
  id: string; 
  nome: string; 
  preco_diaria: any; 
  especialidade: string; 
  imagem_url: string; 
  descricao: string; 
};

type Atracao = { 
  id: string; 
  nome: string; 
  preco_entrada: any; 
  tipo: string; 
  imagem_url: string; 
  descricao: string; 
};

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
  pacote_itens: { hoteis: Hotel | null; guias: Guia | null; atracoes: Atracao | null; }[];
};

// ── SEGURANÇA E MATEMÁTICA FINANCEIRA ──
const parseValor = (valor: any): number => {
  if (valor === null || valor === undefined || valor === '') return 0;
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  return isNaN(num) ? 0 : num;
};

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

export default function DetalhePacotePage() {
  const { id } = useParams();
  const router = useRouter();
  
  // Estados de Dados
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados de Seleção do Cidadão
  const [hoteisDisponiveis, setHoteisDisponiveis] = useState<Hotel[]>([]);
  const [guiasDisponiveis, setGuiasDisponiveis] = useState<Guia[]>([]);
  const [atracoesInclusas, setAtracoesInclusas] = useState<Atracao[]>([]);

  const [hotelSelecionado, setHotelSelecionado] = useState<Hotel | null>(null);
  const [tipoQuarto, setTipoQuarto] = useState<'standard' | 'luxo'>('standard');
  const [guiaSelecionado, setGuiaSelecionado] = useState<Guia | null>(null);

  // Estados de UI
  const [abaGaleria, setAbaGaleria] = useState<'destino' | 'hotel'>('destino');
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoPix, setProcessandoPix] = useState(false);
  const [pixGerado, setPixGerado] = useState(false);

  useEffect(() => {
    async function fetchPacoteCompleto() {
      const { data, error } = await supabase
        .from('pacotes')
        .select(`*, pacote_itens ( hoteis (*), guias (*), atracoes (*) )`)
        .eq('id', id)
        .single();

      if (error) {
        console.error("Erro ao carregar pacote oficial:", error);
        router.push('/pacotes');
        return;
      }

      const pct = data as Pacote;
      setPacote(pct);

      // Desestruturação segura das opções do pacote
      const hoteis = pct.pacote_itens.map(i => i.hoteis).filter(Boolean) as Hotel[];
      const guias = pct.pacote_itens.map(i => i.guias).filter(Boolean) as Guia[];
      const atracoes = pct.pacote_itens.map(i => i.atracoes).filter(Boolean) as Atracao[];

      setHoteisDisponiveis(hoteis);
      setGuiasDisponiveis(guias);
      setAtracoesInclusas(atracoes);

      // Pre-seleção inteligente
      if (hoteis.length > 0) setHotelSelecionado(hoteis[0]);
      if (guias.length > 0) setGuiaSelecionado(guias[0]);

      setLoading(false);
    }
    if (id) fetchPacoteCompleto();
  }, [id, router]);

  // Cálculos de Preço Protegidos contra Erros de Banco de Dados
  const precoHospedagem = hotelSelecionado 
    ? (tipoQuarto === 'standard' ? parseValor(hotelSelecionado.quarto_standard_preco) : parseValor(hotelSelecionado.quarto_luxo_preco))
    : 0;
  
  const totalGuias = guiaSelecionado ? parseValor(guiaSelecionado.preco_diaria) : 0;
  const totalAtracoes = atracoesInclusas.reduce((acc, curr) => acc + parseValor(curr.preco_entrada), 0);
  const valorTotalFinal = precoHospedagem + totalGuias + totalAtracoes;

  // Helper para tratar a Galeria (converte string JSON em Array se necessário)
  const getGaleriaHotel = (hotel: Hotel | null) => {
    if (!hotel || !hotel.galeria) return [];
    if (Array.isArray(hotel.galeria)) return hotel.galeria;
    try { return JSON.parse(hotel.galeria); } catch (e) { return []; }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-[#00577C] w-16 h-16 mb-6" />
      <p className={`${jakarta.className} font-bold text-slate-400 uppercase tracking-[0.3em] text-xs`}>
        Conectando ao Sistema de Turismo Oficial
      </p>
    </div>
  );

  if (!pacote) return null;

  const imagensRoteiro = [pacote.imagem_principal, ...(pacote.imagens_galeria || [])];

  return (
    <main className={`${inter.className} bg-[#F9FBFC] min-h-screen pb-32`}>
      
      {/* ── NAVEGAÇÃO INSTITUCIONAL ── */}
      <nav className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-3 text-slate-600 hover:text-[#00577C] font-bold group">
            <div className="p-2.5 rounded-full group-hover:bg-slate-100 transition-colors">
              <ArrowLeft size={20} />
            </div>
            Voltar ao Catálogo
          </button>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2 text-[#009640] font-black text-[10px] uppercase tracking-widest bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm">
              <ShieldCheck size={14} /> Pagamento Protegido via PagBank
            </div>
            <img src="/logop.png" alt="Prefeitura" className="h-10 object-contain hidden md:block opacity-80" />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        
        {/* ── CABEÇALHO DO PACOTE ── */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
             <span className="bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
               Pacote Oficial
             </span>
             <span className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
               <MapPin size={14} className="text-[#00577C]"/> São Geraldo do Araguaia, Pará
             </span>
          </div>
          <h1 className={`${jakarta.className} text-5xl md:text-7xl font-black text-slate-900 leading-none tracking-tight mb-8`}>
            {pacote.titulo}
          </h1>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <Calendar className="text-[#F9C400]" size={20} />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duração</p>
                <p className="text-sm font-bold text-slate-700">{pacote.dias} Dias / {pacote.noites} Noites</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <Clock className="text-[#009640]" size={20} />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saídas</p>
                <p className="text-sm font-bold text-slate-700">{pacote.horarios_info || "Consultar SEMTUR"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── GALERIA BENTO BOX INTERATIVA ── */}
        <section className="mb-20">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setAbaGaleria('destino')} 
              className={`px-10 py-4 rounded-[1.5rem] font-bold text-sm flex items-center gap-3 transition-all ${abaGaleria === 'destino' ? 'bg-[#00577C] text-white shadow-2xl scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
            >
              <Camera size={20}/> Explorar o Destino
            </button>
            <button 
              onClick={() => setAbaGaleria('hotel')} 
              className={`px-10 py-4 rounded-[1.5rem] font-bold text-sm flex items-center gap-3 transition-all ${abaGaleria === 'hotel' ? 'bg-[#00577C] text-white shadow-2xl scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
            >
              <Bed size={20}/> Ver Hospedagem
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[650px] rounded-[3.5rem] overflow-hidden shadow-2xl border-[12px] border-white bg-white">
             {abaGaleria === 'destino' ? (
               <>
                 <div className="relative md:col-span-2 md:row-span-2 overflow-hidden group">
                   <Image src={imagensRoteiro[0]} alt="Principal" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" priority />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                 </div>
                 {imagensRoteiro.slice(1, 5).map((img, i) => (
                   <div key={i} className="relative hidden md:block overflow-hidden group">
                     <Image src={img} alt={`Slide ${i}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                   </div>
                 ))}
               </>
             ) : (
               <div className="md:col-span-4 md:row-span-2 relative group overflow-hidden">
                 <Image src={hotelSelecionado?.imagem_url || pacote.imagem_principal} alt="Hotel Selecionado" fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-16">
                    <p className="text-[#F9C400] font-black uppercase tracking-[0.4em] text-xs mb-4">Alojamento Selecionado</p>
                    <h2 className="text-5xl font-bold text-white">{hotelSelecionado?.nome}</h2>
                 </div>
               </div>
             )}
          </div>
        </section>

        {/* ── CONTEÚDO E SISTEMA DE COMPRA ── */}
        <div className="grid lg:grid-cols-[1fr_450px] gap-20">
          
          <div className="space-y-20">
            
            {/* DESCRIÇÃO E ROTEIRO DETALHADO */}
            <section className="bg-white p-12 md:p-16 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12"><Map size={180}/></div>
              <h2 className={`${jakarta.className} text-4xl font-bold text-slate-900 mb-10 flex items-center gap-4`}>
                Sobre a Expedição
              </h2>
              <div className="prose prose-slate max-w-none">
                 <p className="text-2xl text-slate-500 leading-relaxed mb-12 border-l-8 border-[#F9C400] pl-8 italic font-medium">
                   {pacote.descricao_curta}
                 </p>
                 <div className="whitespace-pre-line text-slate-700 text-xl leading-loose font-medium opacity-90">
                   {pacote.roteiro_detalhado}
                 </div>
              </div>
            </section>

            {/* SELEÇÃO DE HOTEL E QUARTO (O CORAÇÃO DA PÁGINA) */}
            <section>
              <div className="flex items-center gap-5 mb-10">
                <div className="w-14 h-14 bg-[#00577C] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200"><Bed size={28}/></div>
                <h2 className={`${jakarta.className} text-4xl font-bold text-slate-900`}>1. Escolha seu Conforto</h2>
              </div>

              <div className="space-y-8">
                {hoteisDisponiveis.map(hotel => (
                  <div key={hotel.id} className={`p-10 rounded-[3rem] bg-white border-2 transition-all duration-500 ${hotelSelecionado?.id === hotel.id ? 'border-[#00577C] ring-[12px] ring-blue-50 shadow-xl' : 'border-slate-100 opacity-80 hover:opacity-100'}`}>
                    
                    {/* Topo do Hotel */}
                    <div className="flex items-center justify-between mb-10 pb-8 border-b border-slate-50">
                      <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                           <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover" />
                        </div>
                        <div>
                          <h4 className="text-3xl font-bold text-slate-800 mb-2">{hotel.nome}</h4>
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#009640] bg-green-50 px-3 py-1 rounded-lg border border-green-100">{hotel.tipo}</span>
                             <div className="flex text-[#F9C400] gap-0.5"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/></div>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setHotelSelecionado(hotel)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${hotelSelecionado?.id === hotel.id ? 'border-[#00577C] bg-[#00577C] text-white shadow-lg' : 'border-slate-200 text-transparent'}`}
                      >
                        <CheckCircle2 size={22} />
                      </button>
                    </div>

                    {/* Escolha do Quarto (Interativo) */}
                    {hotelSelecionado?.id === hotel.id && (
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* QUARTO STANDARD */}
                        <div 
                          onClick={() => setTipoQuarto('standard')}
                          className={`relative p-8 rounded-[2.5rem] cursor-pointer border-2 transition-all flex flex-col justify-between ${tipoQuarto === 'standard' ? 'border-[#F9C400] bg-yellow-50/40 shadow-inner' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-4">
                               <p className="font-bold text-slate-800 text-xl">{hotel.quarto_standard_nome}</p>
                               {tipoQuarto === 'standard' && <CheckCircle2 size={20} className="text-[#F9C400]"/>}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-8">
                               {hotel.quarto_standard_comodidades?.map((com, i) => (
                                 <span key={i} className="text-[9px] font-black bg-white/80 border px-2 py-1 rounded-md text-slate-500 uppercase tracking-tighter">{com}</span>
                               ))}
                            </div>
                          </div>
                          <p className="font-black text-[#009640] text-3xl">{formatarMoeda(parseValor(hotel.quarto_standard_preco))}</p>
                        </div>

                        {/* QUARTO LUXO */}
                        <div 
                          onClick={() => setTipoQuarto('luxo')}
                          className={`relative p-8 rounded-[2.5rem] cursor-pointer border-2 transition-all flex flex-col justify-between ${tipoQuarto === 'luxo' ? 'border-[#00577C] bg-blue-50/40 shadow-inner' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                        >
                          <div className="absolute -top-4 right-8 bg-[#00577C] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl flex items-center gap-2">
                             <Award size={12}/> RECOMENDADO
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-4">
                               <p className="font-bold text-slate-800 text-xl">{hotel.quarto_luxo_nome}</p>
                               {tipoQuarto === 'luxo' && <CheckCircle2 size={20} className="text-[#00577C]"/>}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-8">
                               {hotel.quarto_luxo_comodidades?.map((com, i) => (
                                 <span key={i} className="text-[9px] font-black bg-[#00577C] text-white px-2 py-1 rounded-md uppercase tracking-tighter">{com}</span>
                               ))}
                            </div>
                          </div>
                          <p className="font-black text-[#009640] text-3xl">{formatarMoeda(parseValor(hotel.quarto_luxo_preco))}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* SELEÇÃO DE GUIA CREDENCIADO */}
            <section>
              <div className="flex items-center gap-5 mb-10">
                <div className="w-14 h-14 bg-[#009640] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-green-100"><UserCheck size={28}/></div>
                <h2 className={`${jakarta.className} text-4xl font-bold text-slate-900`}>2. Guia Profissional</h2>
              </div>
              <div className="grid gap-6">
                 {guiasDisponiveis.map(guia => (
                   <label key={guia.id} className={`cursor-pointer p-8 bg-white rounded-[2.5rem] border-2 flex items-center justify-between transition-all duration-300 ${guiaSelecionado?.id === guia.id ? 'border-[#009640] ring-8 ring-green-50 shadow-lg' : 'border-slate-100 hover:border-slate-300'}`}>
                      <div className="flex items-center gap-8">
                        <div className="relative w-24 h-24 rounded-3xl overflow-hidden shadow-md border-4 border-white">
                           <Image src={guia.imagem_url || '/placeholder.png'} alt={guia.nome} fill className="object-cover" />
                        </div>
                        <div>
                           <h4 className="text-2xl font-bold text-slate-800 mb-2">{guia.nome}</h4>
                           <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                              <div className="w-2 h-2 rounded-full bg-[#009640]"></div> {guia.especialidade}
                           </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                         <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acompanhamento</p>
                            <p className="text-2xl font-black text-slate-900">{formatarMoeda(parseValor(guia.preco_diaria))}</p>
                         </div>
                         <input type="radio" name="guia" className="w-8 h-8 text-[#009640] accent-[#009640]" checked={guiaSelecionado?.id === guia.id} onChange={() => setGuiaSelecionado(guia)} />
                      </div>
                   </label>
                 ))}
              </div>
            </section>
          </div>

          {/* ── ASIDE: RESUMO DE INVESTIMENTO FIXO ── */}
          <aside className="relative">
            <div className="sticky top-32 bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]"></div>
               <h3 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-10 pb-6 border-b border-slate-50`}>Detalhes da Reserva</h3>
               
               <div className="space-y-8 mb-12">
                  <div className="flex justify-between items-start">
                     <div className="flex gap-4">
                        <div className="p-2 bg-blue-50 rounded-xl text-[#00577C]"><Bed size={20}/></div>
                        <div><p className="font-bold text-slate-800 text-sm">Acomodação</p><p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{hotelSelecionado?.nome}</p></div>
                     </div>
                     <span className="font-black text-slate-700 text-lg">{formatarMoeda(precoHospedagem)}</span>
                  </div>
                  <div className="flex justify-between items-start">
                     <div className="flex gap-4">
                        <div className="p-2 bg-green-50 rounded-xl text-[#009640]"><Compass size={20}/></div>
                        <div><p className="font-bold text-slate-800 text-sm">Apoio Local</p><p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{guiaSelecionado?.nome}</p></div>
                     </div>
                     <span className="font-black text-slate-700 text-lg">{formatarMoeda(totalGuias)}</span>
                  </div>
                  <div className="flex justify-between items-start pt-8 border-t border-slate-50">
                     <div className="flex gap-4">
                        <div className="p-2 bg-yellow-50 rounded-xl text-[#F9C400]"><Ticket size={20}/></div>
                        <div><p className="font-bold text-slate-800 text-sm">Logística e Taxas</p><p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{atracoesInclusas.length} itens inclusos</p></div>
                     </div>
                     <span className="font-black text-slate-700 text-lg">{formatarMoeda(totalAtracoes)}</span>
                  </div>
               </div>

               <div className="bg-[#009640]/5 p-8 rounded-[2.5rem] border border-[#009640]/10 mb-12 text-center">
                  <span className="text-[11px] font-black text-[#009640] uppercase tracking-[0.3em] mb-3 block">Total da Expedição</span>
                  <span className={`${jakarta.className} text-6xl font-black text-[#009640]`}>{formatarMoeda(valorTotalFinal)}</span>
               </div>

               <button 
                  onClick={() => setModalAberto(true)}
                  className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-7 rounded-[2rem] font-black text-xl shadow-2xl hover:-translate-y-2 transition-all flex items-center justify-center gap-4 group active:scale-95"
               >
                 Reservar Agora <ChevronRight size={26} className="group-hover:translate-x-2 transition-transform" />
               </button>
               
               <p className="mt-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                 <ShieldCheck size={16}/> Turismo Sustentável Garantido
               </p>
            </div>
          </aside>

        </div>

        {/* ── SEÇÕES DE GALERIAS COMPLETAS NO RODAPÉ ── */}
        <div className="mt-40 space-y-40">
          
          {/* GALERIA DA EXPEDIÇÃO (ROTEIRO) */}
          <section>
            <div className="flex items-center justify-between mb-12 border-l-8 border-[#00577C] pl-8">
              <div>
                <h2 className={`${jakarta.className} text-5xl font-black text-slate-900`}>Galeria da Expedição</h2>
                <p className="text-xl text-slate-500 font-medium mt-2">Vislumbre as paisagens que encontrará no percurso.</p>
              </div>
              <ImageIcon size={60} className="text-slate-100 hidden md:block" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {imagensRoteiro.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-[3rem] overflow-hidden shadow-md hover:shadow-2xl transition-all hover:-translate-y-2 group bg-slate-200">
                   <Image src={url} alt={`Expedição ${index}`} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="text-white" size={40}/>
                   </div>
                </div>
              ))}
            </div>
          </section>

          {/* GALERIA DINÂMICA DO HOTEL SELECIONADO */}
          <section>
            <div className="flex items-center justify-between mb-12 border-l-8 border-[#009640] pl-8">
              <div>
                <h2 className={`${jakarta.className} text-5xl font-black text-slate-900`}>O seu Hotel: {hotelSelecionado?.nome}</h2>
                <p className="text-xl text-slate-500 font-medium mt-2">Fotos oficiais das áreas comuns e suítes.</p>
              </div>
              <Bed size={60} className="text-slate-100 hidden md:block" />
            </div>
            
            {getGaleriaHotel(hotelSelecionado).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {getGaleriaHotel(hotelSelecionado).map((url: string, index: number) => (
                  <div key={index} className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-md hover:shadow-2xl transition-all hover:-translate-y-2 group bg-slate-200">
                    <Image src={url} alt={`Acomodação ${index}`} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-32 rounded-[4rem] border-4 border-dashed border-slate-100 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200"><ImageIcon size={40}/></div>
                <p className="text-slate-400 font-black uppercase tracking-[0.2em]">Galeria em Processamento Oficial</p>
              </div>
            )}
          </section>

        </div>
      </div>

      {/* ── MODAL DE CHECKOUT PIX INSTITUCIONAL ── */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] w-full max-w-xl overflow-hidden shadow-2xl relative border border-white/20">
            
            {/* Header Modal */}
            <div className="bg-[#00577C] p-12 text-white relative">
               <button onClick={() => setModalAberto(false)} className="absolute top-10 right-10 p-3 hover:bg-white/10 rounded-full transition"><X size={24}/></button>
               <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="text-[#F9C400]" size={20}/>
                  <p className="text-[#F9C400] text-[11px] font-black uppercase tracking-[0.4em]">Checkout Governamental Seguro</p>
               </div>
               <h3 className={`${jakarta.className} text-4xl font-bold leading-tight`}>Finalizar Reserva</h3>
            </div>

            <div className="p-16 text-center">
               {!pixGerado ? (
                 <>
                   <div className="space-y-6 mb-12">
                      <p className="text-slate-500 text-xl font-medium">Você selecionou o pacote <b>{pacote.titulo}</b> com hospedagem no <b>{hotelSelecionado?.nome}</b>.</p>
                      <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex flex-col items-center shadow-inner">
                         <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Valor Final Autorizado</span>
                         <span className={`${jakarta.className} text-6xl font-black text-slate-900`}>{formatarMoeda(valorTotalFinal)}</span>
                      </div>
                   </div>
                   <button 
                     onClick={() => { setProcessandoPix(true); setTimeout(() => { setProcessandoPix(false); setPixGerado(true); }, 2500); }}
                     className="w-full bg-[#009640] hover:bg-[#007a33] text-white py-8 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-green-200 transition-all flex items-center justify-center gap-6 active:scale-95"
                   >
                     {processandoPix ? <Loader2 className="animate-spin" size={32}/> : <><QrCode size={32}/> Gerar Chave PIX</>}
                   </button>
                   <p className="mt-8 text-[10px] text-slate-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2 italic">
                     <ShieldAlert size={14}/> Ao clicar, você concorda com os termos da SEMTUR.
                   </p>
                 </>
               ) : (
                 <div className="animate-in zoom-in-95 duration-700">
                    <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-10 border-4 border-white shadow-xl">
                       <CheckCircle2 size={64} className="text-[#009640]"/>
                    </div>
                    <h4 className="text-3xl font-black text-slate-900 mb-4">Chave PIX Emitida!</h4>
                    <p className="text-slate-500 mb-12 text-lg font-medium leading-relaxed px-10">O sistema PagBank identificou sua solicitação. Efetue a transferência para confirmar sua vaga imediata.</p>
                    
                    {/* Fake QR Code */}
                    <div className="w-72 h-72 bg-white mx-auto rounded-[3.5rem] flex items-center justify-center mb-12 border-4 border-dashed border-slate-200 relative group overflow-hidden">
                       <QrCode size={180} className="text-slate-300 group-hover:scale-110 transition-transform duration-500"/>
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                          <Smartphone className="text-[#00577C] animate-pulse mb-2" size={50}/>
                          <span className="text-[10px] font-black text-[#00577C] uppercase tracking-widest">Escaneie o Código</span>
                       </div>
                    </div>
                    
                    <button className="bg-slate-900 text-white w-full py-6 rounded-[2rem] font-black text-sm transition-all hover:bg-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-300 active:scale-95">
                      Copiar Código Copia e Cola
                    </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          FOOTER INSTITUCIONAL — unchanged from spec
      ════════════════════════════════════════════════════ */}
      <footer className="py-20 px-8 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <img src="/logop.png" alt="Prefeitura SGA" className="h-20 object-contain" />
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                São Geraldo do Araguaia <br /> "Cidade Amada, seguindo em frente"
              </p>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">
                Gestão Executiva
              </h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Prefeito: <br /><b>Jefferson Douglas de Jesus Oliveira</b></li>
                <li>Vice-Prefeito: <br /><b>Marcos Antônio Candido de Lucena</b></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">
                Turismo (SEMTUR)
              </h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Secretária: <br /><b>Micheli Stephany de Souza</b></li>
                <li>Contato: <b>(94) 98145-2067</b></li>
                <li>Email: <b>setursaga@gmail.com</b></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">
                Equipe Técnica
              </h5>
              <ul className="text-sm text-slate-500 space-y-2 font-medium">
                <li>• Adriana da Luz Lima</li>
                <li>• Carmelita Luz da Silva</li>
                <li>• Diego Silva Costa</li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-10 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
              © 2026 Secretaria Municipal de Turismo - São Geraldo do Araguaia (PA)
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}