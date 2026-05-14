'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { 
  Loader2, ArrowLeft, ShieldCheck, MapPin, 
  Bed, QrCode, CheckCircle2, User, Mail, FileText, 
  Smartphone, Copy, AlertCircle, CreditCard, 
  Calendar, Map, Home, Users, Baby, DoorOpen, ShieldAlert, Lock
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

type Hotel = { 
  id: string; 
  nome: string; 
  imagem_url: string;
  quarto_standard_nome: string; 
  quarto_standard_preco: any; 
  quarto_luxo_nome: string; 
  quarto_luxo_preco: any; 
};

// ── UTILITÁRIOS E MATEMÁTICA ──
const parseValor = (valor: any): number => {
  if (!valor) return 0;
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  return isNaN(num) ? 0 : num;
};

const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

const mascaraCPF = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
};

const mascaraCartao = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
};

const mascaraTelefone = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})/, '$1-$2').slice(0, 15);
};

const formatarData = (dataStr: string) => {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
};

const calcularNoites = (checkin: string | null, checkout: string | null) => {
  if (!checkin || !checkout) return 0;
  const start = new Date(checkin);
  const end = new Date(checkout);
  const diff = end.getTime() - start.getTime();
  const noites = Math.ceil(diff / (1000 * 3600 * 24));
  return noites > 0 ? noites : 1;
};

function CheckoutHotelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Parâmetros da URL (Incluindo os novos parâmetros de lotação)
  const hotelId = searchParams.get('hotel');
  const quartoTipo = searchParams.get('quarto') as 'standard' | 'luxo' | null;
  const checkinData = searchParams.get('checkin');
  const checkoutData = searchParams.get('checkout');
  const adultosParam = Number(searchParams.get('adultos')) || 2;
  const criancasParam = Number(searchParams.get('criancas')) || 0;
  const quartosParam = Number(searchParams.get('quartos')) || 1;

  // Estados de Dados
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Estados do Formulário: Bloco 1 - Hóspede
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  
  // Estados do Formulário: Bloco 2 - Endereço
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cep, setCep] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  // Estados do Formulário: Bloco 3 - Pagamento
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

  // 2. CARREGAMENTO DOS DADOS DO HOTEL
  useEffect(() => {
    async function carregarHotel() {
      if (!hotelId || !checkinData || !checkoutData) {
        router.push('/#hoteis');
        return;
      }

      const { data, error } = await supabase
        .from('hoteis')
        .select('*')
        .eq('id', hotelId)
        .single();

      if (error || !data) {
        router.push('/#hoteis');
        return;
      }

      setHotel(data as Hotel);
      setLoadingInitial(false);
    }
    carregarHotel();
  }, [hotelId, checkinData, checkoutData, router]);

  // 3. MATEMÁTICA DA RESERVA (Diária x Noites x Quartos)
  const numNoites = calcularNoites(checkinData, checkoutData);
  const precoDiaria = hotel ? (quartoTipo === 'luxo' ? parseValor(hotel.quarto_luxo_preco) : parseValor(hotel.quarto_standard_preco)) : 0;
  const nomeQuarto = hotel ? (quartoTipo === 'luxo' ? hotel.quarto_luxo_nome : hotel.quarto_standard_nome) : '';
  const valorTotalReserva = precoDiaria * numNoites * quartosParam;

  // 4. SUBMISSÃO PARA A API
  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');

    if (cpf.length < 14) {
      setErroApi('O CPF introduzido não é válido. Verifique os dados.');
      return;
    }

    setIsSubmitting(true);

    const enderecoCompleto = `${rua}, ${numero} - ${bairro}, ${cidade}/${estado} - CEP: ${cep}`;

    let payload: any = {
      tipo_item: "hotel",
      hotel_id: hotelId,
      tipo_quarto: quartoTipo,
      data_checkin: checkinData,
      data_checkout: checkoutData,
      adultos: adultosParam,
      criancas: criancasParam,
      quartos: quartosParam,
      nome_cliente: nome,
      cpf_cliente: cpf.replace(/\D/g, ''),
      email_cliente: email,
      telefone_cliente: telefone,
      endereco_completo: enderecoCompleto,
      valor_total: valorTotalReserva
    };

    try {
      // 4.1 PROCESSAMENTO CARTÃO DE CRÉDITO COM SDK PAGBANK
      if (metodoPagamento === 'cartao') {
        if (!window.PagSeguro) {
          throw new Error('Módulo de pagamento seguro offline. Recarregue a página.');
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
          throw new Error('Dados do cartão de crédito inválidos.');
        }

        payload = {
          ...payload,
          metodo_pagamento: 'cartao',
          encrypted_card: result.encryptedCard,
          parcelas: Number(parcelas)
        };
      } 
      // 4.2 PROCESSAMENTO PIX
      else {
        payload = { ...payload, metodo_pagamento: 'pix' };
      }

      // ENVIO PARA O BACKEND
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/pagamentos/processar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.sucesso) {
        if (metodoPagamento === 'pix') {
          setQrCodeData({ link: data.qr_code_link, texto: data.qr_code_text });
        } else {
          router.push('/sucesso');
        }
      } else {
        setErroApi('Transação recusada pela operadora de pagamento.');
      }
    } catch (err: any) {
      console.error(err);
      setErroApi(err.message || 'Erro de comunicação com o sistema bancário.');
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
      <Loader2 className="animate-spin text-[#00577C] w-16 h-16 mb-4" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processando Motor de Reserva...</p>
    </div>
  );

  return (
    <>
      <Script src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js" strategy="afterInteractive" />

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        
        {/* HEADER DE CHECKOUT */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-16 border-b-2 border-slate-100 pb-8 gap-6">
          <Link href={`/hoteis/${hotelId}`} className="flex items-center gap-2 text-slate-500 hover:text-[#00577C] font-bold transition-colors w-fit">
            <ArrowLeft size={20} /> <span className="underline-offset-4 hover:underline">Alterar Reserva</span>
          </Link>
          <div className="flex items-center gap-4 bg-green-50 px-6 py-3 rounded-full border border-green-100 shadow-sm">
             <ShieldCheck className="text-[#009640]" size={24} />
             <span className={`${jakarta.className} text-xl font-black tracking-tight text-[#009640]`}>Checkout Oficial</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-16 items-start">
          
          {/* ── COLUNA ESQUERDA: FORMULÁRIO COMPLETO ── */}
          <div className="space-y-12">
            {!qrCodeData ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 mb-6`}>Finalize sua Hospedagem</h1>
                <p className="text-slate-500 mb-12 text-xl font-medium">Preencha os dados abaixo para emissão da Fatura Oficial e envio do voucher de confirmação.</p>

                <form onSubmit={handlePagamento} className="space-y-12">
                  
                  {/* BLOCO 1: DADOS DO HÓSPEDE */}
                  <div className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><User size={120}/></div>
                    <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-10 flex items-center gap-4`}>
                      <span className="bg-[#00577C] text-white w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-md">1</span> 
                      Dados do Hóspede Principal
                    </h2>
                    
                    <div className="space-y-8">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Nome Completo</label>
                        <div className="relative">
                           <input required type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800 text-lg" placeholder="Ex: João da Silva" />
                           <User className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">CPF (Para a Fatura)</label>
                          <div className="relative">
                             <input required type="text" value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} maxLength={14} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800 text-lg" placeholder="000.000.000-00" />
                             <FileText className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">WhatsApp</label>
                          <div className="relative">
                             <input required type="text" value={telefone} onChange={e => setTelefone(mascaraTelefone(e.target.value))} maxLength={15} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800 text-lg" placeholder="(99) 99999-9999" />
                             <Smartphone className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">E-mail de Confirmação</label>
                        <div className="relative">
                           <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800 text-lg" placeholder="seu.email@exemplo.com" />
                           <Mail className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BLOCO 2: ENDEREÇO DE FATURAMENTO */}
                  <div className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Home size={120}/></div>
                    <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-10 flex items-center gap-4`}>
                      <span className="bg-[#00577C] text-white w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-md">2</span> 
                      Endereço de Registo
                    </h2>
                    
                    <div className="space-y-8">
                      <div className="grid sm:grid-cols-[1fr_120px] gap-8">
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Rua / Avenida</label>
                          <input required type="text" value={rua} onChange={e => setRua(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800" placeholder="Ex: Rua das Palmeiras" />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Número</label>
                          <input required type="text" value={numero} onChange={e => setNumero(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800 text-center" placeholder="123" />
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Bairro</label>
                          <input required type="text" value={bairro} onChange={e => setBairro(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800" placeholder="Centro" />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">CEP</label>
                          <input required type="text" value={cep} onChange={e => setCep(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800" placeholder="00000-000" />
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-[1fr_120px] gap-8">
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Cidade</label>
                          <input required type="text" value={cidade} onChange={e => setCidade(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800" placeholder="Ex: Marabá" />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Estado</label>
                          <input required type="text" value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} maxLength={2} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800 text-center" placeholder="PA" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BLOCO 3: PAGAMENTO */}
                  <div className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                    <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-10 flex items-center gap-4`}>
                      <span className="bg-[#009640] text-white w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-md">3</span> 
                      Pagamento Oficial
                    </h2>

                    <div className="grid grid-cols-2 gap-6 mb-12">
                      <button type="button" onClick={() => setMetodoPagamento('pix')} className={`p-8 rounded-[2.5rem] border-4 flex flex-col items-center justify-center gap-4 transition-all duration-500 ${metodoPagamento === 'pix' ? 'border-[#009640] bg-green-50/50 shadow-inner' : 'border-slate-50 bg-slate-50 opacity-60 hover:opacity-100'}`}>
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-md ${metodoPagamento === 'pix' ? 'bg-[#009640] text-white' : 'bg-white text-slate-400'}`}><QrCode size={32} /></div>
                        <span className={`font-black uppercase tracking-widest text-xs ${metodoPagamento === 'pix' ? 'text-[#009640]' : 'text-slate-500'}`}>PIX Instantâneo</span>
                      </button>
                      <button type="button" onClick={() => setMetodoPagamento('cartao')} className={`p-8 rounded-[2.5rem] border-4 flex flex-col items-center justify-center gap-4 transition-all duration-500 ${metodoPagamento === 'cartao' ? 'border-[#00577C] bg-blue-50/50 shadow-inner' : 'border-slate-50 bg-slate-50 opacity-60 hover:opacity-100'}`}>
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-md ${metodoPagamento === 'cartao' ? 'bg-[#00577C] text-white' : 'bg-white text-slate-400'}`}><CreditCard size={32} /></div>
                        <span className={`font-black uppercase tracking-widest text-xs ${metodoPagamento === 'cartao' ? 'text-[#00577C]' : 'text-slate-500'}`}>Cartão de Crédito</span>
                      </button>
                    </div>

                    {metodoPagamento === 'cartao' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-top-4 mb-12 bg-slate-50 p-10 rounded-[2.5rem] border-2 border-slate-100">
                        <div className="flex items-center gap-3 mb-4 text-slate-400">
                           <Lock size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">Dados Criptografados - PCI DSS</span>
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nome Impresso no Cartão</label>
                          <input required type="text" value={nomeCartao} onChange={e => setNomeCartao(e.target.value.toUpperCase())} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-bold text-slate-800" placeholder="JOAO M SILVA" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Número do Cartão</label>
                          <div className="relative">
                            <input required type="text" value={numeroCartao} onChange={e => setNumeroCartao(mascaraCartao(e.target.value))} maxLength={19} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-bold text-slate-800 tracking-[0.2em]" placeholder="0000 0000 0000 0000" />
                            <CreditCard size={24} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Mês (MM)</label>
                            <input required type="text" value={mesCartao} onChange={e => setMesCartao(e.target.value.replace(/\D/g, ''))} maxLength={2} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-bold text-slate-800 text-center" placeholder="12" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Ano (AAAA)</label>
                            <input required type="text" value={anoCartao} onChange={e => setAnoCartao(e.target.value.replace(/\D/g, ''))} maxLength={4} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-bold text-slate-800 text-center" placeholder="2028" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">CVV</label>
                            <input required type="password" value={cvvCartao} onChange={e => setCvvCartao(e.target.value.replace(/\D/g, ''))} maxLength={4} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-bold text-slate-800 text-center" placeholder="***" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Opções de Parcelamento</label>
                          <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-5 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-bold text-slate-800 cursor-pointer appearance-none">
                            {[...Array(12)].map((_, i) => {
                               const numParcelas = i + 1;
                               const valorParcela = valorTotalReserva / numParcelas;
                               return (
                                 <option key={numParcelas} value={numParcelas}>
                                   {numParcelas}x de {formatarMoeda(valorParcela)} {numParcelas === 1 ? '(À vista)' : ''}
                                 </option>
                               );
                            })}
                          </select>
                        </div>
                      </div>
                    )}

                    {erroApi && (
                      <div className="mb-10 p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] text-red-600 flex items-start gap-4">
                        <AlertCircle className="shrink-0 mt-1" size={24}/>
                        <div>
                           <p className="font-black uppercase text-xs tracking-widest mb-1">Aviso de Processamento</p>
                           <p className="font-medium text-sm">{erroApi}</p>
                        </div>
                      </div>
                    )}

                    <button 
                      type="submit" disabled={isSubmitting}
                      className={`w-full py-8 rounded-[2rem] font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-6 active:scale-[0.98] ${
                        metodoPagamento === 'pix' ? 'bg-[#009640] hover:bg-[#007a33] text-white shadow-green-200' : 'bg-[#00577C] hover:bg-[#004a6b] text-white shadow-blue-200'
                      }`}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="animate-spin" size={32} /> Processando de forma segura...</>
                      ) : (
                        metodoPagamento === 'pix' ? 'Gerar PIX e Concluir' : `Pagar ${formatarMoeda(valorTotalReserva)}`
                      )}
                    </button>
                    
                    <p className="mt-8 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                       <ShieldCheck size={16} className="text-[#009640]" /> Pagamento Processado via PagBank S.A.
                    </p>
                  </div>

                </form>
              </div>
            ) : (
              /* ── TELA DE SUCESSO PIX ── */
              <div className="bg-white p-16 rounded-[4rem] shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-700 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-3 bg-[#009640]"></div>
                 <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner border-4 border-white">
                    <CheckCircle2 size={64} className="text-[#009640]"/>
                 </div>
                 <h2 className={`${jakarta.className} text-4xl font-black text-slate-900 mb-4`}>Falta Apenas um Passo!</h2>
                 <p className="text-slate-500 text-xl mb-12 px-8 leading-relaxed">Escaneie o código abaixo no aplicativo do seu banco para garantir sua estadia no valor de <b>{formatarMoeda(valorTotalReserva)}</b>.</p>
                 
                 <div className="w-80 h-80 bg-slate-50 mx-auto rounded-[3.5rem] p-10 mb-12 border-4 border-dashed border-slate-200 relative group shadow-inner">
                    <img src={qrCodeData.link} alt="QR Code PIX" className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm rounded-[3.5rem]">
                       <Smartphone className="text-[#009640] animate-pulse mb-3" size={60}/>
                       <span className="text-xs font-black text-[#009640] uppercase tracking-[0.3em]">Pague via App</span>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 flex items-center justify-between gap-6 mb-8 text-left">
                   <div className="min-w-0 flex-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Código PIX Copia e Cola</p>
                     <p className="text-sm font-bold text-slate-800 truncate tracking-tight">{qrCodeData.texto}</p>
                   </div>
                   <button onClick={copiarCodigo} className={`p-5 rounded-2xl flex items-center gap-3 font-black text-sm transition-all shrink-0 shadow-lg ${copiado ? 'bg-[#009640] text-white' : 'bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                     {copiado ? <><CheckCircle2 size={20}/> Sucesso</> : <><Copy size={20}/> Copiar</>}
                   </button>
                 </div>
                 
                 <div className="flex items-center justify-center gap-4 py-8 border-t border-slate-50 mt-10">
                    <Loader2 className="animate-spin text-slate-300" size={20}/>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Aguardando confirmação automática do banco...</p>
                 </div>
              </div>
            )}
          </div>

          {/* ── COLUNA DIREITA: RESUMO DA RESERVA FIXO ── */}
          <aside className="lg:sticky lg:top-12">
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
              
              <div className="p-12 border-b-2 border-slate-50">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">A sua Hospedagem</p>
                <div className="flex gap-5 items-center">
                  {hotel?.imagem_url && (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-4 border-white shadow-md">
                      <Image src={hotel.imagem_url} alt={hotel?.nome || 'Hotel'} fill className="object-cover" />
                    </div>
                  )}
                  <div>
                     <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 leading-tight mb-2`}>{hotel?.nome}</h3>
                     <p className="text-xs font-bold text-slate-500">{nomeQuarto}</p>
                  </div>
                </div>
              </div>

              <div className="p-12 space-y-10">
                
                {/* Check-in e Check-out */}
                <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                   <div>
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2"><Calendar size={14}/> Check-in</p>
                     <p className="font-black text-slate-800 text-lg">{formatarData(checkinData || '')}</p>
                     <p className="text-xs text-slate-500 font-medium mt-1">A partir das 14:00</p>
                   </div>
                   <div className="border-l-2 border-slate-200 pl-6">
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2"><Calendar size={14}/> Check-out</p>
                     <p className="font-black text-slate-800 text-lg">{formatarData(checkoutData || '')}</p>
                     <p className="text-xs text-slate-500 font-medium mt-1">Até às 12:00</p>
                   </div>
                </div>

                {/* Resumo de Lotação */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-slate-500 font-bold"><Users size={18} className="text-[#00577C]"/> Adultos</div>
                    <span className="font-black text-slate-800">{adultosParam}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-slate-500 font-bold"><Baby size={18} className="text-[#009640]"/> Crianças</div>
                    <span className="font-black text-slate-800">{criancasParam}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-4 border-t-2 border-slate-50">
                    <div className="flex items-center gap-3 text-slate-500 font-bold"><DoorOpen size={18} className="text-[#F9C400]"/> Quartos Solicitados</div>
                    <span className="font-black text-slate-800">{quartosParam}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-blue-50/50 p-6 rounded-[1.5rem] border border-blue-100">
                   <span className="text-xs font-black text-[#00577C] uppercase tracking-widest">Duração da Estadia</span>
                   <span className="font-black text-xl text-[#00577C]">{numNoites} {numNoites === 1 ? 'noite' : 'noites'}</span>
                </div>
              </div>

              {/* Rodapé com Valor Final */}
              <div className="p-12 bg-slate-900 text-white text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full bg-[#009640] opacity-10 pointer-events-none"></div>
                 <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/50 mb-4">Total a Pagar Hoje</p>
                 <p className={`${jakarta.className} text-6xl font-black tabular-nums`}>{formatarMoeda(valorTotalReserva)}</p>
              </div>
            </div>

            {/* Selos de Confiança */}
            <div className="mt-10 grid grid-cols-2 gap-4">
               <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-3 shadow-sm">
                  <Map className="text-[#00577C]" size={20}/>
                  <span className="text-[9px] font-black text-slate-400 uppercase leading-tight tracking-widest">Confirmação<br/>Imediata</span>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-3 shadow-sm">
                  <ShieldAlert className="text-[#009640]" size={20}/>
                  <span className="text-[9px] font-black text-slate-400 uppercase leading-tight tracking-widest">Sem Taxas<br/>Ocultas</span>
               </div>
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}

export default function CheckoutHotelPage() {
  return (
    <main className={`${inter.className} bg-[#F8F9FA] min-h-screen`}>
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
          <Loader2 className="animate-spin text-[#00577C] w-16 h-16 mb-6" />
          <p className={`${jakarta.className} font-bold text-slate-400 uppercase tracking-[0.4em] text-xs`}>
            Preparando Ambiente de Pagamento...
          </p>
        </div>
      }>
        <CheckoutHotelContent />
      </Suspense>
    </main>
  );
}