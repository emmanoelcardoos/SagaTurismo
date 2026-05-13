'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Loader2, ArrowLeft, MapPin, Calendar, Clock, 
  CheckCircle2, Bed, Compass, Ticket, ShieldCheck, 
  ChevronRight, Camera, Info, QrCode, Wallet, X, Star,
  Smartphone, Award, ImageIcon
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS ──
type Hotel = { 
  id: string; nome: string; tipo: string; imagem_url: string; descricao: string;
  quarto_standard_nome: string; quarto_standard_preco: any;
  quarto_luxo_nome: string; quarto_luxo_preco: any;
  galeria: string[] | string; // Suporta array real ou string do DB
};
type Guia = { id: string; nome: string; preco_diaria: any; especialidade: string; imagem_url: string; descricao: string; };
type Atracao = { id: string; nome: string; preco_entrada: any; tipo: string; imagem_url: string; descricao: string; };

type Pacote = {
  id: string; titulo: string; descricao_curta: string; roteiro_detalhado: string;
  imagens_galeria: string[]; imagem_principal: string; dias: number; noites: number;
  horarios_info: string;
  pacote_itens: { hoteis: Hotel | null; guias: Guia | null; atracoes: Atracao | null; }[];
};

// ── SEGURANÇA CONTRA NaN ──
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
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados de Seleção
  const [hoteisDisponiveis, setHoteisDisponiveis] = useState<Hotel[]>([]);
  const [guiasDisponiveis, setGuiasDisponiveis] = useState<Guia[]>([]);
  const [atracoesInclusas, setAtracoesInclusas] = useState<Atracao[]>([]);

  const [hotelSelecionado, setHotelSelecionado] = useState<Hotel | null>(null);
  const [tipoQuarto, setTipoQuarto] = useState<'standard' | 'luxo'>('standard');
  const [guiaSelecionado, setGuiaSelecionado] = useState<Guia | null>(null);

  // Interface
  const [abaGaleria, setAbaGaleria] = useState<'destino' | 'hotel'>('roteiro');
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoPix, setProcessandoPix] = useState(false);
  const [pixGerado, setPixGerado] = useState(false);

  useEffect(() => {
    async function fetchPacote() {
      const { data, error } = await supabase
        .from('pacotes')
        .select(`*, pacote_itens ( hoteis (*), guias (*), atracoes (*) )`)
        .eq('id', id).single();

      if (error) { router.push('/pacotes'); return; }

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
    if (id) fetchPacote();
  }, [id, router]);

  // Cálculos Dinâmicos
  const precoQuarto = hotelSelecionado 
    ? (tipoQuarto === 'standard' ? parseValor(hotelSelecionado.quarto_standard_preco) : parseValor(hotelSelecionado.quarto_luxo_preco))
    : 0;
  
  const valorAtracoes = atracoesInclusas.reduce((acc, curr) => acc + parseValor(curr.preco_entrada), 0);
  const valorGuia = guiaSelecionado ? parseValor(guiaSelecionado.preco_diaria) : 0;
  const valorTotal = valorAtracoes + valorGuia + precoQuarto;

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
      <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Carregando Informações Oficiais...</p>
    </div>
  );

  if (!pacote) return null;

  const imagensRoteiro = [pacote.imagem_principal, ...(pacote.imagens_galeria || [])];

  // Helper para tratar a galeria do hotel (pode vir como string JSON do Supabase)
  const getGaleriaHotel = (hotel: Hotel | null) => {
    if (!hotel || !hotel.galeria) return [];
    if (Array.isArray(hotel.galeria)) return hotel.galeria;
    try { return JSON.parse(hotel.galeria); } catch (e) { return []; }
  };

  return (
    <main className={`${inter.className} bg-[#F8FAFC] min-h-screen pb-32`}>
      
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-[#00577C] font-bold transition-all group">
            <div className="p-2 rounded-full group-hover:bg-slate-100 transition-colors"><ArrowLeft size={20} /></div>
            Voltar aos Pacotes
          </button>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-[#009640] font-bold text-xs uppercase bg-green-50 px-4 py-2 rounded-full border border-green-100">
              <ShieldCheck size={16}/> Pagamento 100% Seguro PagBank
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 mt-10">
        
        {/* CABEÇALHO */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 text-[#00577C]">
             <div className="h-6 w-1 bg-[#F9C400] rounded-full"></div>
             <span className="text-xs font-black uppercase tracking-[0.3em]">Experiência Oficial de Turismo</span>
          </div>
          <h1 className={`${jakarta.className} text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-6`}>
            {pacote.titulo}
          </h1>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm font-bold text-slate-700">
              <Calendar className="text-[#F9C400]" size={18} /> {pacote.dias} Dias e {pacote.noites} Noites
            </div>
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm font-bold text-slate-700">
              <Clock className="text-[#009640]" size={18} /> {pacote.horarios_info || "A combinar"}
            </div>
          </div>
        </div>

        {/* GALERIA SUPERIOR (BENTO BOX) */}
        <section className="mb-16">
          <div className="flex gap-3 mb-6">
            <button onClick={() => setAbaGaleria('roteiro')} className={`px-8 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${abaGaleria === 'roteiro' ? 'bg-[#00577C] text-white shadow-xl scale-105' : 'bg-white text-slate-500 border hover:bg-slate-50'}`}>
              <Camera size={18}/> O Destino
            </button>
            <button onClick={() => setAbaGaleria('hotel')} className={`px-8 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${abaGaleria === 'hotel' ? 'bg-[#00577C] text-white shadow-xl scale-105' : 'bg-white text-slate-500 border hover:bg-slate-50'}`}>
              <Bed size={18}/> Acomodações
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[600px] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-white">
             {abaGaleria === 'roteiro' ? (
               <>
                 <div className="relative md:col-span-2 md:row-span-2 overflow-hidden group">
                   <Image src={imagensRoteiro[0]} alt="Principal" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                 </div>
                 {imagensRoteiro.slice(1, 5).map((img, i) => (
                   <div key={i} className="relative hidden md:block overflow-hidden group">
                     <Image src={img} alt={`Foto ${i}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                   </div>
                 ))}
               </>
             ) : (
               <div className="md:col-span-4 md:row-span-2 relative group overflow-hidden">
                 <Image src={hotelSelecionado?.imagem_url || pacote.imagem_principal} alt="Hotel" fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                 <div className="absolute bottom-12 left-12 text-white">
                    <p className="text-[#F9C400] font-black uppercase tracking-widest text-xs mb-2">Hospedagem Confirmada</p>
                    <h2 className="text-4xl font-bold">{hotelSelecionado?.nome}</h2>
                 </div>
               </div>
             )}
          </div>
        </section>

        {/* CORPO PRINCIPAL */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-16">
          <div className="space-y-16">
            
            {/* ROTEIRO */}
            <section className="bg-white p-10 md:p-14 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <h2 className={`${jakarta.className} text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3`}>Roteiro da Experiência</h2>
              <div className="prose prose-slate max-w-none">
                 <p className="text-xl text-slate-600 leading-relaxed mb-10 border-l-4 border-[#F9C400] pl-6 italic">{pacote.descricao_curta}</p>
                 <div className="whitespace-pre-line text-slate-700 text-lg leading-loose space-y-4">{pacote.roteiro_detalhado}</div>
              </div>
            </section>

            {/* SELEÇÃO HOTEL */}
            <section>
              <h2 className={`${jakarta.className} text-3xl font-bold text-slate-900 mb-8 flex items-center gap-4`}>
                <div className="w-12 h-12 bg-[#00577C] rounded-2xl flex items-center justify-center text-white shadow-lg"><Bed size={24}/></div>
                1. Escolha sua Hospedagem
              </h2>
              <div className="space-y-6">
                {hoteisDisponiveis.map(hotel => (
                  <div key={hotel.id} className={`p-8 rounded-[2.5rem] bg-white border-2 transition-all ${hotelSelecionado?.id === hotel.id ? 'border-[#00577C] ring-8 ring-blue-50' : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden border shadow-sm">
                           <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-slate-800">{hotel.nome}</h4>
                          <span className="text-xs font-black uppercase text-[#009640] bg-green-50 px-3 py-1 rounded-md">{hotel.tipo}</span>
                        </div>
                      </div>
                      <button onClick={() => {setHotelSelecionado(hotel); setTipoQuarto('standard');}} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${hotelSelecionado?.id === hotel.id ? 'border-[#00577C] bg-[#00577C]' : 'border-slate-200'}`}>
                        {hotelSelecionado?.id === hotel.id && <CheckCircle2 size={16} className="text-white"/>}
                      </button>
                    </div>

                    {hotelSelecionado?.id === hotel.id && (
                      <div className="grid md:grid-cols-2 gap-4 mt-6">
                        <div onClick={() => setTipoQuarto('standard')} className={`p-6 rounded-3xl cursor-pointer border-2 transition-all ${tipoQuarto === 'standard' ? 'border-[#F9C400] bg-yellow-50/50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}>
                          <p className="font-bold text-slate-800 mb-2">{hotel.quarto_standard_nome}</p>
                          <p className="font-black text-[#009640] text-xl">{formatarMoeda(parseValor(hotel.quarto_standard_preco))}</p>
                        </div>
                        <div onClick={() => setTipoQuarto('luxo')} className={`p-6 rounded-3xl cursor-pointer border-2 transition-all ${tipoQuarto === 'luxo' ? 'border-[#F9C400] bg-yellow-50/50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}>
                          <p className="font-bold text-slate-800 mb-2">{hotel.quarto_luxo_nome} <Star size={14} className="inline text-[#F9C400] fill-[#F9C400]"/></p>
                          <p className="font-black text-[#009640] text-xl">{formatarMoeda(parseValor(hotel.quarto_luxo_preco))}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* SELEÇÃO GUIA */}
            <section>
              <h2 className={`${jakarta.className} text-3xl font-bold text-slate-900 mb-8 flex items-center gap-4`}>
                <div className="w-12 h-12 bg-[#009640] rounded-2xl flex items-center justify-center text-white shadow-lg"><Compass size={24}/></div>
                2. Guia de Turismo Credenciado
              </h2>
              <div className="grid gap-4">
                 {guiasDisponiveis.map(guia => (
                   <label key={guia.id} className={`cursor-pointer p-6 bg-white rounded-[2rem] border-2 flex items-center justify-between transition-all ${guiaSelecionado?.id === guia.id ? 'border-[#009640] shadow-md ring-8 ring-green-50' : 'border-slate-100 hover:border-slate-300'}`}>
                      <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                           <Image src={guia.imagem_url || '/placeholder.png'} alt={guia.nome} fill className="object-cover" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-800">{guia.nome}</h4>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-bold text-slate-400 mb-1 uppercase">Diária</p>
                         <p className="text-xl font-black text-slate-900">{formatarMoeda(parseValor(guia.preco_diaria))}</p>
                         <input type="radio" name="guia" className="hidden" checked={guiaSelecionado?.id === guia.id} onChange={() => setGuiaSelecionado(guia)} />
                      </div>
                   </label>
                 ))}
              </div>
            </section>
          </div>

          {/* ASIDE CHECKOUT */}
          <aside className="relative">
            <div className="sticky top-28 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]"></div>
               <h3 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-8 pb-4 border-b`}>Detalhes da Reserva</h3>
               <div className="space-y-6 mb-12 text-sm">
                  <div className="flex justify-between font-bold text-slate-800"><span>Hospedagem</span><span>{formatarMoeda(precoQuarto)}</span></div>
                  <div className="flex justify-between font-bold text-slate-800"><span>Guia Local</span><span>{formatarMoeda(valorGuia)}</span></div>
                  <div className="flex justify-between font-bold text-slate-800 pt-6 border-t"><span>Taxas inclusas</span><span>{formatarMoeda(valorAtracoes)}</span></div>
               </div>
               <div className="bg-slate-50 p-8 rounded-[2rem] border mb-10 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Investimento Total</span>
                  <span className={`${jakarta.className} text-5xl font-black text-[#009640]`}>{formatarMoeda(valorTotal)}</span>
               </div>
               <button onClick={() => setModalAberto(true)} className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-6 rounded-3xl font-black text-lg shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group">
                 Confirmar Reserva <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </aside>
        </div>

        {/* ── SEÇÃO DE GALERIAS COMPLETAS ── */}
        <div className="mt-32 space-y-32">
          
          {/* GALERIA DO ROTEIRO */}
          <section>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#00577C] shadow-md border border-slate-100">
                <ImageIcon size={28}/>
              </div>
              <div>
                <h2 className={`${jakarta.className} text-4xl font-black text-slate-900`}>Galeria da Expedição</h2>
                <p className="text-slate-500 font-medium">Explore as paisagens e atividades inclusas neste roteiro.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {imagensRoteiro.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
                   <Image src={url} alt={`Roteiro ${index}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </section>

          {/* GALERIA DO HOTEL SELECIONADO */}
          <section>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#009640] shadow-md border border-slate-100">
                <Bed size={28}/>
              </div>
              <div>
                <h2 className={`${jakarta.className} text-4xl font-black text-slate-900`}>Conheça o {hotelSelecionado?.nome}</h2>
                <p className="text-slate-500 font-medium">Fotos oficiais das acomodações e áreas de lazer desta hospedagem.</p>
              </div>
            </div>
            
            {getGaleriaHotel(hotelSelecionado).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {getGaleriaHotel(hotelSelecionado).map((url: string, index: number) => (
                  <div key={index} className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
                    <Image src={url} alt={`Hotel ${index}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                <Camera size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">Galeria de fotos em processamento para este hotel.</p>
              </div>
            )}
          </section>

        </div>
      </div>

      {/* MODAL CHECKOUT */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="bg-[#00577C] p-10 text-white relative">
               <button onClick={() => setModalAberto(false)} className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition"><X/></button>
               <h3 className={`${jakarta.className} text-3xl font-bold`}>Pagamento de Reserva</h3>
            </div>
            <div className="p-12 text-center">
               {!pixGerado ? (
                 <>
                   <div className="bg-slate-50 p-6 rounded-3xl border mb-10">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Valor total</span>
                      <span className={`${jakarta.className} text-4xl font-black text-slate-900`}>{formatarMoeda(valorTotal)}</span>
                   </div>
                   <button onClick={() => { setProcessandoPix(true); setTimeout(() => { setProcessandoPix(false); setPixGerado(true); }, 2500); }} className="w-full bg-[#009640] hover:bg-[#007a33] text-white py-6 rounded-3xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4">
                     {processandoPix ? <Loader2 className="animate-spin" size={28}/> : <><QrCode size={28}/> Gerar QR Code PIX</>}
                   </button>
                 </>
               ) : (
                 <div className="animate-in zoom-in-95 duration-500">
                    <CheckCircle2 size={56} className="text-[#009640] mx-auto mb-8"/>
                    <h4 className="text-2xl font-bold mb-10">Escaneie o QR Code para confirmar sua vaga</h4>
                    <div className="w-64 h-64 bg-slate-50 mx-auto rounded-[2.5rem] flex items-center justify-center mb-10 border-4 border-dashed">
                       <QrCode size={140} className="text-slate-300"/>
                    </div>
                    <button className="bg-slate-900 text-white w-full py-5 rounded-3xl font-bold">Copiar Chave Pix</button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}