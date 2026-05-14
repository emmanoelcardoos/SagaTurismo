'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { 
  Loader2, ArrowLeft, ShieldCheck, MapPin, 
  Bed, Compass, Ticket, QrCode, Wallet, CheckCircle2, 
  User, Mail, FileText, Smartphone, Copy, AlertCircle,
  CreditCard, ChevronRight, X, ShieldAlert, Lock,
  Award, Camera, ImageIcon, Landmark, TreePine, Anchor
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS DO SDK E ESTRUTURA DE DADOS ──
declare global {
  interface Window {
    PagSeguro?: {
      encryptCard: (params: any) => { encryptedCard?: string; hasErrors?: boolean; errors?: any[] };
    };
  }
}

type Hotel = { 
  id: string; 
  nome: string; 
  tipo: string;
  imagem_url: string;
  quarto_standard_nome: string; 
  quarto_standard_preco: any; 
  quarto_standard_comodidades: any;
  quarto_luxo_nome: string; 
  quarto_luxo_preco: any; 
  quarto_luxo_comodidades: any;
  galeria: any;
};

type Guia = { 
  id: string; 
  nome: string; 
  preco_diaria: any; 
  especialidade: string;
  imagem_url: string;
};

type Atracao = { 
  id: string; 
  nome: string; 
  preco_entrada: any; 
};

type Pacote = { 
  id: string; 
  titulo: string; 
  imagem_principal: string;
  descricao_curta: string;
  roteiro_detalhado: string;
  dias: number;
  noites: number;
  pacote_itens: { hoteis: Hotel | null; guias: Guia | null; atracoes: Atracao | null; }[]; 
};

// ── UTILITÁRIOS DE SEGURANÇA E PARSERS (FIM DOS CRASHES) ──
const parseValor = (valor: any): number => {
  if (!valor) return 0;
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  return isNaN(num) ? 0 : num;
};

const formatarMoeda = (valor: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const mascaraCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
};

const mascaraCartao = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
};

// FUNÇÃO CRÍTICA: Impede o "Client-side Exception" ao lidar com arrays corrompidos do banco
const parseArray = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Se for formato Postgres {item1, item2}
      if (data.startsWith('{') && data.endsWith('}')) {
        return data.slice(1, -1).split(',').map(s => s.trim().replace(/^"/, '').replace(/"$/, ''));
      }
    }
  }
  return [];
};

// ── CONTEÚDO PRINCIPAL DO CHECKOUT ──
function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Proteção contra Hydration Mismatch (Erro da Vercel)
  const [isMounted, setIsMounted] = useState(false);

  // Captura de Parâmetros
  const pacoteId = searchParams.get('pacote');
  const hotelId = searchParams.get('hotel');
  const quartoTipo = searchParams.get('quarto') as 'standard' | 'luxo' | null;
  const guiaId = searchParams.get('guia');

  // Estados de Dados da Reserva
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [hotelSel, setHotelSel] = useState<Hotel | null>(null);
  const [guiaSel, setGuiaSel] = useState<Guia | null>(null);
  const [atracoes, setAtracoes] = useState<Atracao[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Estados do Formulário: Dados do Titular
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  
  // Estados do Formulário: Cartão de Crédito
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');
  const [nomeCartao, setNomeCartao] = useState('');
  const [numeroCartao, setNumeroCartao] = useState('');
  const [mesCartao, setMesCartao] = useState('');
  const [anoCartao, setAnoCartao] = useState('');
  const [cvvCartao, setCvvCartao] = useState('');
  const [parcelas, setParcelas] = useState(1);
  
  // Estados de Processamento
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroApi, setErroApi] = useState('');
  const [qrCodeData, setQrCodeData] = useState<{ link: string; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function carregarResumo() {
      if (!pacoteId) {
        router.push('/pacotes');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('pacotes')
          .select(`id, titulo, imagem_principal, descricao_curta, roteiro_detalhado, dias, noites, pacote_itens ( hoteis (*), guias (*), atracoes (*) )`)
          .eq('id', pacoteId)
          .single();

        if (error || !data) throw new Error("Pacote não encontrado");

        const pct = data as Pacote;
        setPacote(pct);

        if (hotelId) {
          const h = pct.pacote_itens.map(i => i.hoteis).find(h => h?.id === hotelId);
          if (h) setHotelSel(h);
        }
        if (guiaId) {
          const g = pct.pacote_itens.map(i => i.guias).find(g => g?.id === guiaId);
          if (g) setGuiaSel(g);
        }
        
        const atts = pct.pacote_itens.map(i => i.atracoes).filter(Boolean) as Atracao[];
        setAtracoes(atts);
        
      } catch (err) {
        console.error("Erro no carregamento:", err);
        router.push('/pacotes');
      } finally {
        setLoadingInitial(false);
      }
    }
    carregarResumo();
  }, [pacoteId, hotelId, guiaId, router]);

  // 2. LÓGICA DE PREÇOS
  const precoHotel = hotelSel ? (quartoTipo === 'luxo' ? parseValor(hotelSel.quarto_luxo_preco) : parseValor(hotelSel.quarto_standard_preco)) : 0;
  const precoGuia = guiaSel ? parseValor(guiaSel.preco_diaria) : 0;
  const precoAtracoes = atracoes.reduce((acc, curr) => acc + parseValor(curr.preco_entrada), 0);
  const totalPagamento = precoHotel + precoGuia + precoAtracoes;

  // 3. SUBMISSÃO DE PAGAMENTO (PIX OU CARTÃO)
  const handleFinalizarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');

    if (cpf.length < 14) {
      setErroApi('O CPF introduzido é inválido.');
      return;
    }

    setIsSubmitting(true);

    let payload: any = {
      pacote_id: pacoteId,
      hotel_id: hotelId || null,
      tipo_quarto: quartoTipo || null,
      guia_id: guiaId || null,
      nome_cliente: nome,
      cpf_cliente: cpf.replace(/\D/g, ''),
      email_cliente: email,
      metodo_pagamento: metodoPagamento
    };

    try {
      if (metodoPagamento === 'cartao') {
        if (!window.PagSeguro) {
          throw new Error("Módulo de segurança do PagBank não carregado. Verifique sua conexão e tente novamente.");
        }

        const cardResult = window.PagSeguro.encryptCard({
          publicKey: process.env.NEXT_PUBLIC_PAGBANK_PUBLIC_KEY || '',
          holder: nomeCartao,
          number: numeroCartao.replace(/\D/g, ''),
          expMonth: mesCartao,
          expYear: anoCartao,
          securityCode: cvvCartao
        });

        if (cardResult.hasErrors) {
          throw new Error("Dados do cartão inválidos. Verifique o número e o código CVV.");
        }

        payload.encrypted_card = cardResult.encryptedCard;
        payload.parcelas = parcelas;
      }

      const response = await fetch('/api/v1/pagamentos/processar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.sucesso) {
        if (metodoPagamento === 'pix') {
          setQrCodeData({ link: result.qr_code_link, texto: result.qr_code_text });
        } else {
          router.push('/sucesso');
        }
      } else {
        setErroApi(result.mensagem || 'A transação foi recusada pelo banco emissor.');
      }
    } catch (err: any) {
      console.error(err);
      setErroApi(err.message || 'Erro de comunicação com o sistema bancário PagBank.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copiarChavePix = () => {
    if (qrCodeData) {
      navigator.clipboard.writeText(qrCodeData.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  // Se o client ainda não montou, não renderiza nada para evitar Crash de Hidratação
  if (!isMounted) return null;

  if (loadingInitial) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#00577C] w-16 h-16 mb-6" />
      <p className={`${jakarta.className} font-bold text-slate-400 uppercase tracking-[0.4em] text-xs`}>
        Criptografando Ambiente de Pagamento...
      </p>
    </div>
  );

  return (
    <>
      <Script src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js" strategy="afterInteractive" />

      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        
        {/* HEADER INSTITUCIONAL DO CHECKOUT */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-6 border-b-2 border-slate-100 pb-10">
          <div>
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-[#00577C] font-bold mb-4 transition-colors">
              <ArrowLeft size={18} /> Voltar e revisar pacote
            </button>
            <h1 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900`}>Finalizar Reserva</h1>
          </div>
          <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-[1.5rem] shadow-sm border border-slate-200">
             <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-[#009640]"><ShieldCheck size={28} /></div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ambiente Governamental</p>
                <p className="text-sm font-bold text-slate-700">Conexão SSL Segura</p>
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_450px] gap-20 items-start">
          
          {/* ── COLUNA ESQUERDA: FLUXO DE PAGAMENTO ── */}
          <div className="space-y-16">
            
            {!qrCodeData ? (
              <form onSubmit={handleFinalizarCompra} className="space-y-16">
                
                {/* PASSO 1: DADOS PESSOAIS */}
                <section className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><User size={120}/></div>
                   <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-10 flex items-center gap-4`}>
                      <span className="w-10 h-10 bg-[#00577C] text-white rounded-2xl flex items-center justify-center text-sm shadow-lg">1</span>
                      Dados do Titular da Reserva
                   </h2>
                   
                   <div className="space-y-8">
                      <div className="group">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 transition-colors group-focus-within:text-[#00577C]">Nome Completo (Identidade)</label>
                        <div className="relative">
                          <input required type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 focus:bg-white focus:border-[#00577C] outline-none transition-all font-bold text-slate-800 text-lg" placeholder="Como consta no documento oficial" />
                          <User className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">E-mail para Voucher</label>
                          <div className="relative">
                             <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 focus:bg-white focus:border-[#00577C] outline-none transition-all font-bold text-slate-800 text-lg" placeholder="exemplo@email.com" />
                             <Mail className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">CPF (Obrigatório para Seguro)</label>
                          <div className="relative">
                            <input required type="text" value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 focus:bg-white focus:border-[#00577C] outline-none transition-all font-bold text-slate-800 text-lg" placeholder="000.000.000-00" />
                            <FileText className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                          </div>
                        </div>
                      </div>
                   </div>
                </section>

                {/* PASSO 2: ESCOLHA DE MÉTODO E PAGAMENTO */}
                <section className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                   <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-10 flex items-center gap-4`}>
                      <span className="w-10 h-10 bg-[#009640] text-white rounded-2xl flex items-center justify-center text-sm shadow-lg">2</span>
                      Forma de Pagamento Oficial
                   </h2>

                   {/* Seletores de Método de Pagamento */}
                   <div className="grid grid-cols-2 gap-6 mb-12">
                      <button 
                        type="button" 
                        onClick={() => setMetodoPagamento('pix')}
                        className={`p-8 rounded-[2.5rem] border-4 flex flex-col items-center gap-4 transition-all duration-500 ${metodoPagamento === 'pix' ? 'border-[#009640] bg-green-50/50 shadow-inner' : 'border-slate-50 bg-slate-50 opacity-60 hover:opacity-100'}`}
                      >
                         <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-md ${metodoPagamento === 'pix' ? 'bg-[#009640] text-white' : 'bg-white text-slate-400'}`}><QrCode size={32}/></div>
                         <span className={`font-black uppercase tracking-widest text-xs ${metodoPagamento === 'pix' ? 'text-[#009640]' : 'text-slate-400'}`}>PIX Instantâneo</span>
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setMetodoPagamento('cartao')}
                        className={`p-8 rounded-[2.5rem] border-4 flex flex-col items-center gap-4 transition-all duration-500 ${metodoPagamento === 'cartao' ? 'border-[#00577C] bg-blue-50/50 shadow-inner' : 'border-slate-50 bg-slate-50 opacity-60 hover:opacity-100'}`}
                      >
                         <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-md ${metodoPagamento === 'cartao' ? 'bg-[#00577C] text-white' : 'bg-white text-slate-400'}`}><CreditCard size={32}/></div>
                         <span className={`font-black uppercase tracking-widest text-xs ${metodoPagamento === 'cartao' ? 'text-[#00577C]' : 'text-slate-400'}`}>Cartão de Crédito</span>
                      </button>
                   </div>

                   {/* Formulário Extendido de Cartão */}
                   {metodoPagamento === 'cartao' && (
                     <div className="space-y-8 bg-slate-50 p-10 rounded-[2.5rem] border-2 border-slate-100 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3 mb-4 text-slate-400">
                           <Lock size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">Dados Criptografados de ponta a ponta</span>
                        </div>
                        
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Nome Impresso no Cartão</label>
                           <input required type="text" value={nomeCartao} onChange={e => setNomeCartao(e.target.value.toUpperCase())} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-[#00577C] font-bold text-slate-800" placeholder="EX: JOÃO M SILVA" />
                        </div>

                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Número do Cartão</label>
                           <div className="relative">
                              <input required type="text" value={numeroCartao} onChange={e => setNumeroCartao(mascaraCartao(e.target.value))} maxLength={19} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-[#00577C] font-bold text-slate-800 tracking-[0.2em]" placeholder="0000 0000 0000 0000" />
                              <CreditCard className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
                           </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 text-center">Mês (MM)</label>
                              <input required type="text" value={mesCartao} onChange={e => setMesCartao(e.target.value.replace(/\D/g, ''))} maxLength={2} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 outline-none focus:border-[#00577C] font-bold text-slate-800 text-center" placeholder="12" />
                           </div>
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 text-center">Ano (AAAA)</label>
                              <input required type="text" value={anoCartao} onChange={e => setAnoCartao(e.target.value.replace(/\D/g, ''))} maxLength={4} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 outline-none focus:border-[#00577C] font-bold text-slate-800 text-center" placeholder="2028" />
                           </div>
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 text-center">CVV</label>
                              <input required type="password" value={cvvCartao} onChange={e => setCvvCartao(e.target.value.replace(/\D/g, ''))} maxLength={4} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 outline-none focus:border-[#00577C] font-bold text-slate-800 text-center" placeholder="***" />
                           </div>
                        </div>

                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Opções de Parcelamento</label>
                           <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-5 outline-none focus:border-[#00577C] font-bold text-slate-800 cursor-pointer appearance-none">
                              {[...Array(12)].map((_, i) => {
                                const n = i + 1;
                                return <option key={n} value={n}>{n}x de {formatarMoeda(totalPagamento/n)} {n === 1 ? '(À vista)' : ''}</option>
                              })}
                           </select>
                        </div>
                     </div>
                   )}

                   {/* Resumo de Erros Visuais */}
                   {erroApi && (
                     <div className="mb-10 p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] text-red-600 flex items-start gap-4">
                        <AlertCircle className="shrink-0 mt-1" size={24}/>
                        <div>
                           <p className="font-black uppercase text-xs tracking-widest mb-1">Aviso de Processamento</p>
                           <p className="font-medium text-sm">{erroApi}</p>
                        </div>
                     </div>
                   )}

                   {/* BOTÃO DE CHECKOUT GIGANTE */}
                   <button 
                     type="submit" disabled={isSubmitting}
                     className={`w-full py-8 rounded-[2rem] font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-6 active:scale-[0.98] ${
                        metodoPagamento === 'pix' ? 'bg-[#009640] hover:bg-[#007a33] text-white shadow-green-200' : 'bg-[#00577C] hover:bg-[#004a6b] text-white shadow-blue-200'
                     }`}
                   >
                     {isSubmitting ? (
                        <><Loader2 className="animate-spin" size={32}/> Sincronizando com a Operadora...</>
                     ) : (
                        metodoPagamento === 'pix' ? <><QrCode size={28}/> Gerar PIX Agora</> : <><Smartphone size={28}/> Confirmar Pagamento no Cartão</>
                     )}
                   </button>
                   
                   <p className="mt-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                      <ShieldCheck size={16} className="text-[#009640]"/> Checkout Blindado via PagBank S.A.
                   </p>
                </section>

              </form>
            ) : (
              /* ── TELA DE SUCESSO DO PIX ── */
              <div className="bg-white p-16 rounded-[4rem] shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-700 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-3 bg-[#009640]"></div>
                 <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner border-4 border-white">
                    <CheckCircle2 size={64} className="text-[#009640]"/>
                 </div>
                 <h2 className={`${jakarta.className} text-4xl font-black text-slate-900 mb-4`}>Vaga Pré-Reservada!</h2>
                 <p className="text-slate-500 text-xl mb-12 px-12 leading-relaxed">Conclua o pagamento de <b>{formatarMoeda(totalPagamento)}</b> para receber o voucher oficial da prefeitura no seu e-mail.</p>
                 
                 <div className="w-80 h-80 bg-slate-50 mx-auto rounded-[3.5rem] p-10 mb-12 border-4 border-dashed border-slate-200 relative group shadow-inner">
                    <img src={qrCodeData.link} alt="QR Code Oficial" className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm rounded-[3.5rem]">
                       <Smartphone className="text-[#009640] animate-pulse mb-3" size={60}/>
                       <p className="text-xs font-black text-[#009640] uppercase tracking-[0.3em]">Escaneie para Pagar</p>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 flex items-center justify-between gap-6 mb-8 text-left group">
                   <div className="min-w-0 flex-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Código PIX Copia e Cola</p>
                     <p className="text-sm font-bold text-slate-800 truncate tracking-tight">{qrCodeData.texto}</p>
                   </div>
                   <button 
                     onClick={copiarChavePix} 
                     className={`p-5 rounded-2xl flex items-center gap-3 font-black text-sm transition-all shrink-0 shadow-lg ${copiado ? 'bg-[#009640] text-white' : 'bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                   >
                     {copiado ? <><CheckCircle2 size={20}/> Sucesso</> : <><Copy size={20}/> Copiar</>}
                   </button>
                 </div>
                 
                 <div className="flex items-center justify-center gap-4 py-8 border-t border-slate-50 mt-10">
                    <Loader2 className="animate-spin text-slate-300" size={20}/>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Sincronizando status com o Banco Central...</p>
                 </div>
              </div>
            )}
          </div>

          {/* ── COLUNA DIREITA: RESUMO DA RESERVA FIXO ── */}
          <aside className="lg:sticky lg:top-12">
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
              
              <div className="p-12 border-b-2 border-slate-50">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Investimento</p>
                <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 leading-tight`}>{pacote?.titulo || 'Aguardando pacote...'}</h3>
              </div>

              <div className="p-12 space-y-10">
                {hotelSel && (
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#00577C] shrink-0 shadow-sm"><Bed size={24}/></div>
                      <div>
                        <p className="font-black text-slate-800 text-lg leading-none mb-2">{hotelSel.nome}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                          {quartoTipo === 'luxo' ? hotelSel.quarto_luxo_nome : hotelSel.quarto_standard_nome}
                        </p>
                        {/* Renderização 100% Segura usando a nossa função parseArray */}
                        <div className="flex flex-wrap gap-1 mt-2">
                           {parseArray(quartoTipo === 'luxo' ? hotelSel.quarto_luxo_comodidades : hotelSel.quarto_standard_comodidades).slice(0,2).map((com, i) => (
                             <span key={i} className="text-[8px] font-bold text-slate-400 border border-slate-200 px-1 rounded">{com}</span>
                           ))}
                        </div>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-lg">{formatarMoeda(precoHotel)}</span>
                  </div>
                )}

                {guiaSel && (
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-[#009640] shrink-0 shadow-sm"><Compass size={24}/></div>
                      <div>
                        <p className="font-black text-slate-800 text-lg leading-none mb-2">Guia Profissional</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{guiaSel.nome}</p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-lg">{formatarMoeda(precoGuia)}</span>
                  </div>
                )}

                {atracoes.length > 0 && (
                  <div className="flex justify-between items-start pt-10 border-t-2 border-slate-50">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-[#F9C400] shrink-0 shadow-sm"><Ticket size={24}/></div>
                      <div>
                        <p className="font-black text-slate-800 text-lg leading-none mb-2">Taxas e Ingressos</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{atracoes.length} itens inclusos</p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-lg">{formatarMoeda(precoAtracoes)}</span>
                  </div>
                )}
              </div>

              <div className="p-12 bg-slate-900 text-white text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full bg-[#009640] opacity-10 pointer-events-none"></div>
                 <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/50 mb-4">Total à Pagar</p>
                 <p className={`${jakarta.className} text-6xl font-black tabular-nums`}>{formatarMoeda(totalPagamento)}</p>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4">
               <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-3 shadow-sm">
                  <Lock className="text-[#00577C]" size={20}/>
                  <span className="text-[9px] font-black text-slate-400 uppercase leading-tight tracking-widest">Encriptação<br/>Bancária 256-bit</span>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-3 shadow-sm">
                  <ShieldAlert className="text-[#009640]" size={20}/>
                  <span className="text-[9px] font-black text-slate-400 uppercase leading-tight tracking-widest">Seguro Viagem<br/>Incluído na Taxa</span>
               </div>
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}

// ── PROTEÇÃO SSR / BOUNDARY DE SUSPENSE ──
export default function CheckoutPage() {
  return (
    <main className={`${inter.className} bg-[#F8F9FA] min-h-screen`}>
      {/* O Script do PagBank deve ficar aqui, fora das lógicas de loading e Suspense */}
      <Script 
        src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js" 
        strategy="afterInteractive" 
      />
      
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
          <Loader2 className="animate-spin text-[#00577C] w-16 h-16 mb-6" />
          <p className={`${jakarta.className} font-bold text-slate-400 uppercase tracking-[0.4em] text-xs`}>
            Carregando Servidor Seguro...
          </p>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}
