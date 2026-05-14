'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { 
  Loader2, ArrowLeft, ShieldCheck, MapPin, 
  QrCode, CheckCircle2, User, Mail, FileText, 
  Smartphone, Copy, AlertCircle, CreditCard, 
  Calendar, ShieldAlert, Lock, UploadCloud, 
  Camera, Users, IdCard, Check
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS DO SDK PAGBANK ──
declare global {
  interface Window {
    PagSeguro?: {
      encryptCard: (params: any) => { encryptedCard?: string; hasErrors?: boolean; errors?: any[] };
    };
  }
}

// ── UTILITÁRIOS DE FORMATAÇÃO E MÁSCARAS ──
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

const mascaraData = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 10);
};

function CheckoutCarteiraContent() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Estados de Scroll (Header)
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // ── ESTADOS DO FORMULÁRIO ──
  // Bloco 1: Identificação
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [quantidadePessoas, setQuantidadePessoas] = useState(1);
  
  // Bloco 2: Foto do Titular
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState('');

  // Bloco 3: Pagamento
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');
  const [nomeCartao, setNomeCartao] = useState('');
  const [numeroCartao, setNumeroCartao] = useState('');
  const [mesCartao, setMesCartao] = useState('');
  const [anoCartao, setAnoCartao] = useState('');
  const [cvvCartao, setCvvCartao] = useState('');
  const [parcelas, setParcelas] = useState(1);
  
  // Estados de Submissão e Retorno
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroApi, setErroApi] = useState('');
  const [qrCodeData, setQrCodeData] = useState<{ link: string; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const PRECO_POR_PESSOA = 10;
  const valorTotal = quantidadePessoas * PRECO_POR_PESSOA;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 80) setShowHeader(true);
      else if (currentScrollY > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // ── UPLOAD DE FOTO PARA O SUPABASE STORAGE ──
  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Gerar preview local imediato
    const objectUrl = URL.createObjectURL(file);
    setFotoPreview(objectUrl);
    setIsUploadingFoto(true);
    setErroFoto('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `foto_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `carteiras/${fileName}`;

      // Upload para o bucket 'documentos'
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);

      setFotoUrl(publicUrlData.publicUrl);
    } catch (err: any) {
      console.error("Erro no upload da foto:", err);
      setErroFoto('Falha ao enviar a fotografia. Certifique-se que tem menos de 5MB e tente novamente.');
      setFotoPreview(null);
    } finally {
      setIsUploadingFoto(false);
    }
  };

  // ── SUBMISSÃO PARA A API ──
  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');

    if (cpf.length < 14) {
      setErroApi('O CPF introduzido não é válido. Verifique os dados.');
      return;
    }

    if (dataNascimento.length < 10) {
      setErroApi('A Data de Nascimento está incompleta.');
      return;
    }

    if (!fotoUrl) {
      setErroApi('Por favor, anexe uma fotografia do rosto para a emissão do cartão.');
      return;
    }

    setIsSubmitting(true);

    // Formatar data de DD/MM/YYYY para YYYY-MM-DD
    const [dia, mes, ano] = dataNascimento.split('/');
    const dataNascimentoISO = `${ano}-${mes}-${dia}`;

    let payload: any = {
      tipo_item: "carteira",
      quantidade: quantidadePessoas,
      nome_cliente: nome,
      cpf_cliente: cpf.replace(/\D/g, ''),
      email_cliente: email,
      telefone_cliente: telefone,
      data_nascimento: dataNascimentoISO,
      foto_url: fotoUrl,
      valor_total: valorTotal
    };

    try {
      // PROCESSAMENTO CARTÃO DE CRÉDITO COM SDK PAGBANK
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
      // PROCESSAMENTO PIX
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
          router.push('/sucesso-carteira'); // Rota opcional específica
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

  if (!isMounted) return null;

  return (
    <>
      <Script src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js" strategy="afterInteractive" />

      {/* ── HEADER GOVERNAMENTAL ── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56"><Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" /></div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/#eventos" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Eventos</Link>
            <Link href="/hoteis" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Alojamentos</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 mt-[80px]">
        
        {/* HEADER DE CHECKOUT INTERNO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-16 border-b-2 border-slate-100 pb-8 gap-6">
          <Link href={`/cadastro`} className="flex items-center gap-2 text-slate-500 hover:text-[#00577C] font-bold transition-colors w-fit">
            <ArrowLeft size={20} /> <span className="underline-offset-4 hover:underline">Voltar aos Benefícios</span>
          </Link>
          <div className="flex items-center gap-4 bg-[#F9C400]/10 px-6 py-3 rounded-full border border-[#F9C400]/20 shadow-sm">
             <ShieldCheck className="text-[#00577C]" size={24} />
             <span className={`${jakarta.className} text-xl font-black tracking-tight text-[#00577C]`}>Emissão Oficial</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-16 items-start">
          
          {/* ── COLUNA ESQUERDA: FORMULÁRIO COMPLETO ── */}
          <div className="space-y-12">
            {!qrCodeData ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 mb-6`}>Solicitar Carteira</h1>
                <p className="text-slate-500 mb-12 text-xl font-medium">Preencha os dados do titular e envie uma fotografia de rosto para o documento oficial de residente.</p>

                <form onSubmit={handlePagamento} className="space-y-12">
                  
                  {/* BLOCO 1: IDENTIFICAÇÃO E LOTAÇÃO */}
                  <div className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><IdCard size={120}/></div>
                    <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-10 flex items-center gap-4`}>
                      <span className="bg-[#00577C] text-white w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-md">1</span> 
                      Identificação do Titular
                    </h2>
                    
                    <div className="space-y-8">
                      {/* Seletor de Quantidade de Cartões */}
                      <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div>
                            <p className="font-black text-slate-800 flex items-center gap-2"><Users size={20} className="text-[#00577C]"/> Número de Pessoas</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">Inclua dependentes se necessário (Taxa por pessoa).</p>
                         </div>
                         <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
                            <button type="button" onClick={() => setQuantidadePessoas(Math.max(1, quantidadePessoas - 1))} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-[#00577C] font-black text-xl transition-colors">-</button>
                            <span className="font-black text-xl w-6 text-center text-[#00577C]">{quantidadePessoas}</span>
                            <button type="button" onClick={() => setQuantidadePessoas(quantidadePessoas + 1)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-[#00577C] font-black text-xl transition-colors">+</button>
                         </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Nome Completo</label>
                        <div className="relative">
                           <input required type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800 text-lg" placeholder="Como consta no documento" />
                           <User className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">CPF</label>
                          <div className="relative">
                             <input required type="text" value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} maxLength={14} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800 text-lg" placeholder="000.000.000-00" />
                             <FileText className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Data de Nascimento</label>
                          <div className="relative">
                             <input required type="text" value={dataNascimento} onChange={e => setDataNascimento(mascaraData(e.target.value))} maxLength={10} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800 text-lg" placeholder="DD/MM/AAAA" />
                             <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                          </div>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">WhatsApp</label>
                          <div className="relative">
                             <input required type="text" value={telefone} onChange={e => setTelefone(mascaraTelefone(e.target.value))} maxLength={15} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800 text-lg" placeholder="(99) 99999-9999" />
                             <Smartphone className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">E-mail</label>
                          <div className="relative">
                             <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] focus:bg-white outline-none transition-all font-bold text-slate-800 text-lg" placeholder="seu@email.com" />
                             <Mail className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BLOCO 2: FOTOGRAFIA DO TITULAR */}
                  <div className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Camera size={120}/></div>
                    <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-8 flex items-center gap-4`}>
                      <span className="bg-[#F9C400] text-[#00577C] w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-md font-black">2</span> 
                      Fotografia para o Documento
                    </h2>
                    <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed max-w-xl">
                      A sua foto será impressa na Carteira de Residente. Escolha uma imagem nítida, com o rosto bem visível, num ambiente iluminado e fundo neutro.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-8">
                       {/* Preview Area */}
                       <div className="w-40 h-40 bg-slate-50 border-4 border-slate-100 border-dashed rounded-full overflow-hidden flex items-center justify-center relative shrink-0">
                          {isUploadingFoto ? (
                            <Loader2 className="animate-spin text-[#00577C]" size={32}/>
                          ) : fotoPreview ? (
                            <Image src={fotoPreview} alt="Preview da Foto" fill className="object-cover" />
                          ) : (
                            <User className="text-slate-300" size={64}/>
                          )}
                          
                          {fotoUrl && (
                             <div className="absolute bottom-2 right-2 w-8 h-8 bg-[#009640] rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg">
                                <Check size={16}/>
                             </div>
                          )}
                       </div>

                       {/* Upload Input */}
                       <div className="flex-1 w-full">
                          <label className="cursor-pointer bg-white border-2 border-slate-200 hover:border-[#00577C] hover:bg-blue-50 transition-all rounded-3xl p-6 flex flex-col items-center justify-center gap-3 w-full border-dashed group">
                             <UploadCloud size={32} className="text-slate-400 group-hover:text-[#00577C] transition-colors"/>
                             <div className="text-center">
                                <p className="font-bold text-slate-700 text-sm group-hover:text-[#00577C] transition-colors">Clique para enviar a fotografia</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">PNG ou JPG (Máx 5MB)</p>
                             </div>
                             <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFotoChange} className="hidden" />
                          </label>
                          {erroFoto && <p className="text-red-500 text-xs font-bold mt-3 flex items-center gap-1"><AlertCircle size={14}/> {erroFoto}</p>}
                       </div>
                    </div>
                  </div>

                  {/* BLOCO 3: PAGAMENTO */}
                  <div className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                    <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-10 flex items-center gap-4`}>
                      <span className="bg-[#009640] text-white w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-md">3</span> 
                      Pagamento da Taxa
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
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Validade (MM/AAAA)</label>
                            <div className="flex items-center gap-2">
                               <input required type="text" value={mesCartao} onChange={e => setMesCartao(e.target.value.replace(/\D/g, ''))} maxLength={2} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-bold text-slate-800 text-center" placeholder="12" />
                               <span className="text-slate-300 font-bold text-xl">/</span>
                               <input required type="text" value={anoCartao} onChange={e => setAnoCartao(e.target.value.replace(/\D/g, ''))} maxLength={4} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-bold text-slate-800 text-center" placeholder="2028" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">CVV</label>
                            <input required type="password" value={cvvCartao} onChange={e => setCvvCartao(e.target.value.replace(/\D/g, ''))} maxLength={4} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none font-bold text-slate-800 text-center" placeholder="***" />
                          </div>
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
                      type="submit" disabled={isSubmitting || isUploadingFoto}
                      className={`w-full py-8 rounded-[2rem] font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-6 active:scale-[0.98] ${
                        metodoPagamento === 'pix' ? 'bg-[#009640] hover:bg-[#007a33] text-white shadow-green-200' : 'bg-[#00577C] hover:bg-[#004a6b] text-white shadow-blue-200'
                      } ${isUploadingFoto ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="animate-spin" size={32} /> A emitir carteira...</>
                      ) : (
                        metodoPagamento === 'pix' ? 'Pagar com PIX Oficial' : `Pagar ${formatarMoeda(valorTotal)} no Cartão`
                      )}
                    </button>
                    
                    <p className="mt-8 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                       <ShieldCheck size={16} className="text-[#009640]" /> Pagamento Processado via PagBank S.A.
                    </p>
                  </div>

                </form>
              </div>
            ) : (
              /* TELA DE SUCESSO PIX */
              <div className="bg-white p-16 rounded-[4rem] shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-700 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-3 bg-[#009640]"></div>
                 <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner border-4 border-white">
                    <CheckCircle2 size={64} className="text-[#009640]"/>
                 </div>
                 <h2 className={`${jakarta.className} text-4xl font-black text-slate-900 mb-4`}>Falta Apenas um Passo!</h2>
                 <p className="text-slate-500 text-xl mb-12 px-8 leading-relaxed">Escaneie o código abaixo no aplicativo do seu banco para garantir o seu Cartão de Residente no valor de <b>{formatarMoeda(valorTotal)}</b>.</p>
                 
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
                 <p className="text-xs text-slate-400 font-bold flex items-center justify-center gap-3 mt-10"><Loader2 className="animate-spin" size={16}/> Aguardando confirmação do PagBank...</p>
              </div>
            )}
          </div>

          {/* ── COLUNA DIREITA: RESUMO DA EMISSÃO FIXO ── */}
          <aside className="lg:sticky lg:top-32">
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
              
              <div className="p-10 border-b-2 border-slate-50">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Resumo do Pedido</p>
                <div className="flex gap-5 items-center">
                  <div className="w-16 h-16 bg-[#F9C400]/20 rounded-2xl flex items-center justify-center shrink-0 border border-[#F9C400]/30 shadow-inner">
                     <IdCard className="text-[#00577C]" size={32}/>
                  </div>
                  <div>
                     <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 leading-tight mb-1`}>Cartão Residente Oficial</h3>
                     <p className="text-xs font-bold text-slate-500">Taxa Única de Emissão</p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-8">
                
                <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                   <span className="flex items-center gap-3"><Users size={18} className="text-[#00577C]"/> Cartões Solicitados</span>
                   <span className="text-xl font-black text-slate-900">{quantidadePessoas}x</span>
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-slate-600 pb-8 border-b-2 border-slate-50">
                   <span className="flex items-center gap-3"><CreditCard size={18} className="text-[#009640]"/> Taxa por Documento</span>
                   <span className="text-xl font-black text-slate-900">{formatarMoeda(PRECO_POR_PESSOA)}</span>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C]">Benefícios Inclusos:</p>
                  <ul className="space-y-3">
                     <li className="flex items-center gap-3 text-sm font-bold text-slate-600"><CheckCircle2 size={18} className="text-[#009640]"/> Acesso Gratuito aos Parques</li>
                     <li className="flex items-center gap-3 text-sm font-bold text-slate-600"><CheckCircle2 size={18} className="text-[#009640]"/> Descontos na Rede Hoteleira</li>
                     <li className="flex items-center gap-3 text-sm font-bold text-slate-600"><CheckCircle2 size={18} className="text-[#009640]"/> Prioridade em Eventos Locais</li>
                  </ul>
                </div>
              </div>

              <div className="p-12 bg-slate-900 text-white text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full bg-[#F9C400] opacity-10 pointer-events-none"></div>
                 <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/50 mb-4">Total a Pagar</p>
                 <p className={`${jakarta.className} text-6xl font-black tabular-nums`}>{formatarMoeda(valorTotal)}</p>
              </div>
            </div>

            {/* Selos de Confiança */}
            <div className="mt-10 grid grid-cols-2 gap-4">
               <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-3 shadow-sm">
                  <Lock className="text-[#00577C]" size={20}/>
                  <span className="text-[9px] font-black text-slate-400 uppercase leading-tight tracking-widest">Validação<br/>LGPD Segura</span>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-3 shadow-sm">
                  <ShieldAlert className="text-[#009640]" size={20}/>
                  <span className="text-[9px] font-black text-slate-400 uppercase leading-tight tracking-widest">Documento<br/>Digital Oficial</span>
               </div>
            </div>
          </aside>

        </div>
      </div>
      
      {/* ── FOOTER INSTITUCIONAL ── */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <Image src="/logop.png" alt="Prefeitura SGA" width={160} height={50} className="object-contain opacity-60" />
            <div className="border-l-2 border-slate-100 pl-6 hidden md:block">
              <p className={`${jakarta.className} text-xl font-bold text-[#00577C]`}>SagaTurismo</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.3em]">Secretaria de Turismo</p>
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-right">
             © {new Date().getFullYear()} · Município de São Geraldo do Araguaia
          </p>
        </div>
      </footer>
    </>
  );
}

export default function CheckoutCarteiraPage() {
  return (
    <main className={`${inter.className} bg-[#F8F9FA] min-h-screen`}>
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
          <Loader2 className="animate-spin text-[#00577C] w-16 h-16 mb-6" />
          <p className={`${jakarta.className} font-bold text-slate-400 uppercase tracking-[0.4em] text-xs`}>
            Preparando Ambiente de Emissão...
          </p>
        </div>
      }>
        <CheckoutCarteiraContent />
      </Suspense>
    </main>
  );
}