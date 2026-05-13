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
  CreditCard
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS DO SDK E SUPABASE ──
declare global {
  interface Window {
    PagSeguro?: {
      encryptCard: (params: any) => { encryptedCard?: string; hasErrors?: boolean; errors?: any[] };
    };
  }
}

type Hotel = { id: string; nome: string; quarto_standard_nome: string; quarto_standard_preco: any; quarto_luxo_nome: string; quarto_luxo_preco: any; };
type Guia = { id: string; nome: string; preco_diaria: any; };
type Atracao = { id: string; nome: string; preco_entrada: any; };
type Pacote = { id: string; titulo: string; imagem_principal: string; pacote_itens: { hoteis: Hotel | null; guias: Guia | null; atracoes: Atracao | null; }[]; };

// ── UTILITÁRIOS ──
const parseValor = (valor: any): number => {
  if (!valor) return 0;
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  return isNaN(num) ? 0 : num;
};

const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

const mascaraCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const mascaraCartao = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parâmetros da URL
  const pacoteId = searchParams.get('pacote');
  const hotelId = searchParams.get('hotel');
  const quartoTipo = searchParams.get('quarto') as 'standard' | 'luxo' | null;
  const guiaId = searchParams.get('guia');

  // Estados de Dados
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [hotelSel, setHotelSel] = useState<Hotel | null>(null);
  const [guiaSel, setGuiaSel] = useState<Guia | null>(null);
  const [atracoes, setAtracoes] = useState<Atracao[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Estados do Formulário: Passo 1
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  
  // Estados do Formulário: Passo 2 (Pagamento)
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');
  const [nomeCartao, setNomeCartao] = useState('');
  const [numeroCartao, setNumeroCartao] = useState('');
  const [mesCartao, setMesCartao] = useState('');
  const [anoCartao, setAnoCartao] = useState('');
  const [cvvCartao, setCvvCartao] = useState('');
  const [parcelas, setParcelas] = useState(1);
  
  // Estados de Submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroApi, setErroApi] = useState('');
  const [qrCodeData, setQrCodeData] = useState<{ link: string; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  // 1. CARREGAMENTO DOS DADOS DO RESUMO
  useEffect(() => {
    async function carregarResumo() {
      if (!pacoteId) {
        router.push('/pacotes');
        return;
      }

      const { data, error } = await supabase
        .from('pacotes')
        .select(`id, titulo, imagem_principal, pacote_itens ( hoteis (*), guias (*), atracoes (*) )`)
        .eq('id', pacoteId)
        .single();

      if (error || !data) {
        router.push('/pacotes');
        return;
      }

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
      
      setLoadingInitial(false);
    }
    carregarResumo();
  }, [pacoteId, hotelId, guiaId, router]);

  // 2. MATEMÁTICA
  const precoHotel = hotelSel ? (quartoTipo === 'luxo' ? parseValor(hotelSel.quarto_luxo_preco) : parseValor(hotelSel.quarto_standard_preco)) : 0;
  const precoGuia = guiaSel ? parseValor(guiaSel.preco_diaria) : 0;
  const precoAtracoes = atracoes.reduce((acc, curr) => acc + parseValor(curr.preco_entrada), 0);
  const totalPagamento = precoHotel + precoGuia + precoAtracoes;

  // 3. SUBMISSÃO PARA A API
  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');

    if (cpf.length < 14) {
      setErroApi('Por favor, introduza um CPF válido.');
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
      email_cliente: email
    };

    try {
      // 3.1 PROCESSAMENTO CARTÃO DE CRÉDITO COM SDK PAGBANK
      if (metodoPagamento === 'cartao') {
        if (!window.PagSeguro) {
          setErroApi('O sistema de pagamento seguro ainda está sendo carregado. Tente novamente em segundos.');
          setIsSubmitting(false);
          return;
        }

        const cardData = {
          publicKey: process.env.NEXT_PUBLIC_PAGBANK_PUBLIC_KEY || '',
          holder: nomeCartao,
          number: numeroCartao.replace(/\D/g, ''),
          expMonth: mesCartao,
          expYear: anoCartao,
          securityCode: cvvCartao
        };

        const result = window.PagSeguro.encryptCard(cardData);

        if (result.hasErrors) {
          setErroApi('Os dados do cartão são inválidos. Verifique o número, validade e CVV.');
          setIsSubmitting(false);
          return;
        }

        payload = {
          ...payload,
          metodo_pagamento: 'cartao',
          encrypted_card: result.encryptedCard,
          parcelas: Number(parcelas)
        };
      } 
      // 3.2 PROCESSAMENTO PIX
      else {
        payload = {
          ...payload,
          metodo_pagamento: 'pix'
        };
      }

      // ENVIO PARA O BACKEND
      const response = await fetch('/api/v1/pagamentos/processar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.sucesso) {
        if (metodoPagamento === 'pix') {
          setQrCodeData({
            link: data.qr_code_link,
            texto: data.qr_code_text
          });
        } else {
          router.push('/sucesso');
        }
      } else {
        setErroApi('A transação foi recusada pela operadora ou ocorreu uma falha no sistema.');
      }
    } catch (err) {
      console.error(err);
      setErroApi('Erro de comunicação com os servidores do PagBank.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copiarCodigo = () => {
    if (qrCodeData) {
      navigator.clipboard.writeText(qrCodeData.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  if (loadingInitial) return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preparando Checkout Seguro...</p>
    </div>
  );

  return (
    <>
      {/* Script Oficial PagSeguro */}
      <Script src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js" strategy="afterInteractive" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* HEADER CHECKOUT */}
        <div className="flex items-center justify-between mb-12 border-b border-slate-200 pb-6">
          <Link href={`/pacotes/${pacoteId}`} className="flex items-center gap-2 text-slate-500 hover:text-[#00577C] font-bold transition-colors">
            <ArrowLeft size={20} /> Voltar e alterar reserva
          </Link>
          <div className="flex items-center gap-3 text-[#009640]">
             <ShieldCheck size={24} />
             <span className={`${jakarta.className} text-xl font-black tracking-tight`}>Checkout Oficial</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-16 items-start">
          
          {/* COLUNA ESQUERDA: FORMULÁRIO OU SUCESSO */}
          <div>
            {!qrCodeData ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className={`${jakarta.className} text-4xl font-black text-slate-900 mb-4`}>Finalize sua Reserva</h1>
                <p className="text-slate-500 mb-10 text-lg">Insira seus dados reais para a emissão do voucher de turismo oficial e seguro.</p>

                <form onSubmit={handlePagamento} className="space-y-12">
                  
                  {/* Passo 1: Dados do Titular */}
                  <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                      <span className="bg-[#00577C] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span> 
                      Dados do Titular
                    </h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><User size={16} className="text-slate-400"/> Nome Completo</label>
                        <input required type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none transition-all font-medium text-slate-900" placeholder="Ex: João da Silva" />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Mail size={16} className="text-slate-400"/> E-mail</label>
                          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none transition-all font-medium text-slate-900" placeholder="seu@email.com" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><FileText size={16} className="text-slate-400"/> CPF</label>
                          <input required type="text" value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} maxLength={14} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none transition-all font-medium text-slate-900" placeholder="000.000.000-00" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passo 2: Método de Pagamento */}
                  <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                      <span className="bg-[#009640] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span> 
                      Forma de Pagamento
                    </h2>

                    {/* Seletores de Método */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                      <button 
                        type="button" 
                        onClick={() => setMetodoPagamento('pix')} 
                        className={`p-6 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-3 transition-all ${metodoPagamento === 'pix' ? 'border-[#009640] bg-green-50/50 shadow-inner' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                      >
                        <QrCode size={32} className={metodoPagamento === 'pix' ? 'text-[#009640]' : 'text-slate-400'} />
                        <span className={`font-bold ${metodoPagamento === 'pix' ? 'text-[#009640]' : 'text-slate-500'}`}>PIX Instantâneo</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setMetodoPagamento('cartao')} 
                        className={`p-6 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-3 transition-all ${metodoPagamento === 'cartao' ? 'border-[#00577C] bg-blue-50/50 shadow-inner' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                      >
                        <CreditCard size={32} className={metodoPagamento === 'cartao' ? 'text-[#00577C]' : 'text-slate-400'} />
                        <span className={`font-bold ${metodoPagamento === 'cartao' ? 'text-[#00577C]' : 'text-slate-500'}`}>Cartão de Crédito</span>
                      </button>
                    </div>

                    {/* Formulário Cartão de Crédito */}
                    {metodoPagamento === 'cartao' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-4 mb-10 bg-slate-50 p-8 rounded-3xl border border-slate-100">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Nome Impresso no Cartão</label>
                          <input required type="text" value={nomeCartao} onChange={e => setNomeCartao(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none uppercase font-medium text-slate-900" placeholder="JOAO M SILVA" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Número do Cartão</label>
                          <div className="relative">
                            <input required type="text" value={numeroCartao} onChange={e => setNumeroCartao(mascaraCartao(e.target.value))} maxLength={19} className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-medium text-slate-900 tracking-wider" placeholder="0000 0000 0000 0000" />
                            <CreditCard size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Mês (MM)</label>
                            <input required type="text" value={mesCartao} onChange={e => setMesCartao(e.target.value.replace(/\D/g, ''))} maxLength={2} className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-medium text-slate-900 text-center" placeholder="12" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ano (AAAA)</label>
                            <input required type="text" value={anoCartao} onChange={e => setAnoCartao(e.target.value.replace(/\D/g, ''))} maxLength={4} className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-medium text-slate-900 text-center" placeholder="2028" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">CVV</label>
                            <input required type="password" value={cvvCartao} onChange={e => setCvvCartao(e.target.value.replace(/\D/g, ''))} maxLength={4} className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-medium text-slate-900 text-center" placeholder="123" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Parcelamento</label>
                          <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-medium text-slate-900 cursor-pointer">
                            {[...Array(12)].map((_, i) => {
                               const numParcelas = i + 1;
                               const valorParcela = totalPagamento / numParcelas;
                               return (
                                 <option key={numParcelas} value={numParcelas}>
                                   {numParcelas}x de {formatarMoeda(valorParcela)} {numParcelas === 1 ? '(Sem Juros)' : ''}
                                 </option>
                               );
                            })}
                          </select>
                        </div>
                      </div>
                    )}

                    {erroApi && (
                      <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
                        <AlertCircle size={24}/> {erroApi}
                      </div>
                    )}

                    <button 
                      type="submit" disabled={isSubmitting}
                      className={`w-full py-6 rounded-3xl font-black text-2xl shadow-xl transition-all flex items-center justify-center gap-4 active:scale-[0.98] ${
                        metodoPagamento === 'pix' 
                          ? 'bg-[#009640] hover:bg-[#007a33] text-white shadow-green-200' 
                          : 'bg-[#00577C] hover:bg-[#004a6b] text-white shadow-blue-200'
                      }`}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="animate-spin" size={28}/> Processando Pagamento Seguramente...</>
                      ) : (
                        metodoPagamento === 'pix' ? 'Gerar PIX Oficial' : `Pagar ${formatarMoeda(totalPagamento)}`
                      )}
                    </button>
                    <p className="mt-6 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                       <ShieldCheck size={14} className="text-[#009640]"/> Integração Criptografada PagBank
                    </p>
                  </div>

                </form>
              </div>
            ) : (
              /* TELA DE SUCESSO PIX (AGUARDANDO PAGAMENTO) */
              <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-700">
                 <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border-4 border-white">
                    <CheckCircle2 size={56} className="text-[#009640]"/>
                 </div>
                 <h2 className={`${jakarta.className} text-4xl font-black text-slate-900 mb-4`}>Reserva Solicitada!</h2>
                 <p className="text-slate-500 text-lg mb-10 px-8">Escaneie o código abaixo no aplicativo do seu banco para concluir o pagamento de <b>{formatarMoeda(totalPagamento)}</b>.</p>
                 
                 <div className="w-80 h-80 bg-slate-50 mx-auto rounded-[3rem] p-8 mb-10 border-4 border-dashed border-slate-200 relative group">
                    <img src={qrCodeData.link} alt="QR Code PIX" className="w-full h-full object-contain mix-blend-multiply" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm rounded-[2.5rem]">
                       <Smartphone className="text-[#009640] animate-bounce mb-3" size={56}/>
                       <span className="text-sm font-black text-[#009640] uppercase tracking-widest">Pague via App</span>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex items-center justify-between gap-4 mb-6 text-left">
                   <div className="min-w-0 flex-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pix Copia e Cola</p>
                     <p className="text-sm font-medium text-slate-800 truncate">{qrCodeData.texto}</p>
                   </div>
                   <button 
                     onClick={copiarCodigo} 
                     className={`p-4 rounded-2xl flex items-center gap-2 font-bold text-sm transition-all shrink-0 ${copiado ? 'bg-[#009640] text-white' : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700'}`}
                   >
                     {copiado ? <><CheckCircle2 size={18}/> Copiado</> : <><Copy size={18}/> Copiar Chave</>}
                   </button>
                 </div>
                 <p className="text-xs text-slate-400 font-bold flex items-center justify-center gap-2 mt-8"><Loader2 className="animate-spin" size={14}/> O sistema aguarda confirmação automática do banco...</p>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: RESUMO DA RESERVA FIXO */}
          <aside className="lg:sticky lg:top-12">
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
              
              {/* Header do Resumo */}
              <div className="p-10 border-b border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resumo Oficial da Reserva</p>
                <h3 className={`${jakarta.className} text-3xl font-bold text-slate-900 leading-tight`}>{pacote?.titulo}</h3>
              </div>

              {/* Detalhes */}
              <div className="p-10 space-y-8">
                {hotelSel && (
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                         <Bed className="text-[#00577C]" size={20}/>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-base">{hotelSel.nome}</p>
                        <p className="text-sm font-medium text-slate-500">{quartoTipo === 'luxo' ? hotelSel.quarto_luxo_nome : hotelSel.quarto_standard_nome}</p>
                      </div>
                    </div>
                    <span className="font-black text-slate-800 text-lg">{formatarMoeda(precoHotel)}</span>
                  </div>
                )}

                {guiaSel && (
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                         <Compass className="text-[#009640]" size={20}/>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-base">Guia Credenciado</p>
                        <p className="text-sm font-medium text-slate-500">{guiaSel.nome}</p>
                      </div>
                    </div>
                    <span className="font-black text-slate-800 text-lg">{formatarMoeda(precoGuia)}</span>
                  </div>
                )}

                {atracoes.length > 0 && (
                  <div className="flex justify-between items-start gap-4 pt-8 border-t border-slate-50">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0">
                         <Ticket className="text-[#F9C400]" size={20}/>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-base">Taxas e Ingressos</p>
                        <p className="text-sm font-medium text-slate-500">{atracoes.length} itens confirmados</p>
                      </div>
                    </div>
                    <span className="font-black text-slate-800 text-lg">{formatarMoeda(precoAtracoes)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="p-10 bg-[#009640]/5 border-t border-[#009640]/10 text-center">
                 <p className="text-xs font-black text-[#009640] uppercase tracking-widest mb-2">Total a Pagar</p>
                 <p className={`${jakarta.className} text-6xl font-black text-[#009640] tabular-nums`}>{formatarMoeda(totalPagamento)}</p>
              </div>
            </div>

            <div className="mt-8 text-center text-[10px] font-bold text-slate-400 flex flex-col items-center justify-center gap-2 uppercase tracking-widest">
               <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#00577C]"/> Proteção Contra Fraudes (PCI DSS)</div>
               <p className="opacity-70 mt-2">Os dados do seu cartão são encriptados localmente e não são armazenados na nossa plataforma.</p>
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}

// O Suspense é obrigatório no Next.js 13+ quando usamos useSearchParams()
export default function CheckoutPage() {
  return (
    <main className={`${inter.className} bg-[#F8F9FA] min-h-screen`}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-[#00577C] w-12 h-12" />
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}