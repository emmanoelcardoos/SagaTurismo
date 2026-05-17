'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, MapPin, ShieldCheck, QrCode, CheckCircle2, 
  User, Mail, Copy, AlertCircle, CreditCard, Lock, 
  ShieldAlert, Home, Clock, Check, ChevronRight, Wallet,
  Smartphone, IdCard, Users
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

declare global {
  interface Window {
    PagSeguro?: any;
  }
}

const formatarMoeda = (valor: number) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const mascaraCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
const mascaraCartao = (v: string) => v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
const mascaraTelefone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})/, '$1-$2').slice(0, 15);
const mascaraCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[2rem] border-2 border-slate-100 bg-white shadow-sm overflow-hidden ${className}`}>{children}</div>;
}

function SectionHeader({ step, title, icon }: { step: number; title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#00577C] text-white text-sm font-black shadow-md">
        {step}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[#00577C] bg-blue-50 p-2 rounded-xl hidden sm:block">{icon}</span>
        <h2 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 tracking-tight`}>{title}</h2>
      </div>
    </div>
  );
}

// ── CRONÓMETRO PIX ──
const PIX_DURATION_SECONDS = 15 * 60; 
function CronometroPix({ onExpirado }: { onExpirado: () => void }) {
  const [segundosRestantes, setSegundosRestantes] = useState(PIX_DURATION_SECONDS);
  
  useEffect(() => {
    const id = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) { clearInterval(id); onExpirado(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onExpirado]);

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const percent = (segundosRestantes / PIX_DURATION_SECONDS) * 100;

  return (
    <div className="rounded-3xl border-2 p-6 transition-all bg-slate-50 border-slate-200 text-left mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-[#009640] animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Aguardando Pagamento</p>
        </div>
        <div className="text-3xl font-black tabular-nums text-slate-800">
          {String(minutos).padStart(2, "0")}:{String(segundos).padStart(2, "0")}
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-[#009640] transition-all duration-1000" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function CheckoutCarteiraContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [dadosCidadão, setDadosCidadão] = useState<any>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Estados Financeiros
  const PRECO_UNITARIO = 20;
  const [quantidade, setQuantidade] = useState(1);
  const valorTotalReserva = quantidade * PRECO_UNITARIO;

  // Estados Form
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cep, setCep] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  
  // Pagamento
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');
  const [nomeCartao, setNomeCartao] = useState('');
  const [numeroCartao, setNumeroCartao] = useState('');
  const [mesCartao, setMesCartao] = useState('');
  const [anoCartao, setAnoCartao] = useState('');
  const [cvvCartao, setCvvCartao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroApi, setErroApi] = useState('');
  const [qrCodeData, setQrCodeData] = useState<{ link: string; texto: string; id_pedido: string } | null>(null);
  const [pixExpirado, setPixExpirado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // ── INJEÇÃO DO PAGBANK SDK ──
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.PagSeguro) {
      const script = document.createElement('script');
      script.src = "https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const cur = window.scrollY;
      setShowHeader(cur < 80 || cur < lastScrollY);
      setLastScrollY(cur);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // ── VALIDAÇÃO DO TOKEN E DADOS ──
  useEffect(() => {
    if (!token) { router.push('/cadastro'); return; }
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/validar?token=${token}`);
        const data = await res.json();
        
        // Se já estiver pago, vai logo para a carteira digital
        if (data.status === 'ativa' || data.status === 'pago') {
          router.push(`/carteira/${token}`);
          return;
        }

        // Se respondeu algo, paramos o loading
        if (data) {
          setDadosCidadão(data);
          // Preenche os dados automaticamente se vierem da API
          if (data.nome && !nome) setNome(data.nome);
          if (data.email && !email) setEmail(data.email);
          // Atualiza a quantidade se a API trouxer o total de dependentes + titular
          if (data.quantidade_pessoas) setQuantidade(data.quantidade_pessoas);
          else if (data.quantidade) setQuantidade(data.quantidade);

          setLoadingInitial(false);
        }
      } catch (err) { 
        console.error(err); 
        setLoadingInitial(false); // Para não ficar em loop infinito em caso de erro
      }
    };

    checkStatus();
    // Continua a verificar se o PIX foi pago noutra aba
    const interval = setInterval(checkStatus, 8000); 
    return () => clearInterval(interval);
  }, [token, router]);

  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');
    if (cpf.length < 14) { setErroApi('CPF inválido.'); return; }
    if (telefone.length < 14) { setErroApi('WhatsApp inválido.'); return; }
    setIsSubmitting(true);

    const payload: any = {
      tipo_item: "carteira", 
      token_id: token,
      quantidade: quantidade,
      nome_cliente: nome, 
      cpf_cliente: cpf.replace(/\D/g, ''), 
      email_cliente: email,
      telefone_cliente: telefone.replace(/\D/g, ''), 
      valor_total: valorTotalReserva,
      endereco_faturacao: {
        street: rua, number: numero, locality: bairro, city: cidade, 
        region_code: estado.replace(/\s/g, ''), country: "BRA", postal_code: cep.replace(/\D/g, '')
      }
    };

    try {
      if (metodoPagamento === 'cartao') {
        if (!window.PagSeguro || typeof window.PagSeguro.encryptCard !== 'function') {
          throw new Error('O sistema de segurança do cartão ainda está a carregar. Aguarde 2 segundos e tente de novo.');
        }
        
        const key = process.env.NEXT_PUBLIC_PAGBANK_PUBLIC_KEY;
        if (!key) throw new Error('Chave pública do PagBank não configurada.');

        const cardData = window.PagSeguro.encryptCard({
          publicKey: key,
          holder: nomeCartao,
          number: numeroCartao.replace(/\D/g, ''),
          expMonth: mesCartao,
          expYear: anoCartao,
          securityCode: cvvCartao
        });

        if (cardData.hasErrors) throw new Error('Dados do cartão recusados pelo gateway de segurança do PagBank.');

        payload.metodo_pagamento = 'cartao';
        payload.encrypted_card = cardData.encryptedCard;
        payload.parcelas = 1; // Carteira não tem parcelamento
      } else {
        payload.metodo_pagamento = 'pix';
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sagaturismo-production.up.railway.app';
      const res = await fetch(`${apiUrl}/api/v1/pagamentos/processar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.sucesso) {
        if (metodoPagamento === 'pix') {
          setQrCodeData({ 
            link: data.pix_qrcode_img || data.qr_code_link, 
            texto: data.pix_copia_cola || data.qr_code_text, 
            id_pedido: data.codigo_pedido 
          });
        } else {
          // Se foi cartão, o pagamento cai na hora, vai para a carteira gerada
          router.push(`/carteira/${token}`);
        }
      } else {
        setErroApi(data.detail || data.mensagem || 'Ocorreu um erro no processamento financeiro.');
      }
    } catch (err: any) { 
      setErroApi(err.message || 'Erro inesperado na comunicação com o banco.'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (loadingInitial) return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preparando Checkout Seguro...</p>
    </div>
  );

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-20`}>
      {/* HEADER TIPO PREFEITURA */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5 text-left">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-28 md:h-12 md:w-36 lg:h-16 lg:w-56 shrink-0"><img src="/logop.png" alt="SagaTurismo" className="h-full w-full object-contain object-left" /></div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Cartão Residente</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[#009640]" size={20}/>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 hidden sm:inline-block">Transação Criptografada</span>
          </div>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="bg-white border-b border-slate-200 mt-[65px] md:mt-[80px]">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 md:py-5">
          <div className="flex items-center justify-center md:justify-start gap-2 md:gap-4 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
            <span className="hidden sm:inline-block">Aprovação IA</span> <ChevronRight size={14} className="hidden sm:inline-block"/> 
            <span className="text-[#00577C] bg-blue-50 px-3 py-1.5 rounded-full flex items-center gap-2"><Lock size={12}/> Taxa de Emissão</span> <ChevronRight size={14}/> 
            <span>Carteira Ativa</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px] items-start">
          
          <div className="space-y-6 md:space-y-8">
            {!qrCodeData ? (
              <form onSubmit={handlePagamento} className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* 1. IDENTIFICAÇÃO BÁSICA */}
                <SectionCard className="p-6 md:p-10 text-left border-t-4 border-t-[#00577C]">
                  <SectionHeader step={1} title="Confirmação de Identidade" icon={<User size={20} />} />
                  <div className="grid gap-5 md:gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2 bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#00577C] shadow-sm"><IdCard size={24}/></div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Titular da Solicitação</p>
                         <p className="text-sm font-bold text-slate-800">{nome || 'Nome em preenchimento...'}</p>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nome Completo *</label>
                      <input required value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white" placeholder="Nome completo do titular" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">CPF *</label>
                      <input required value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} maxLength={14} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white" placeholder="000.000.000-00" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">WhatsApp *</label>
                      <input required value={telefone} onChange={e => setTelefone(mascaraTelefone(e.target.value))} maxLength={15} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white" placeholder="(99) 99999-9999" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">E-mail para receção dos cartões *</label>
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white" placeholder="seu@email.com" />
                    </div>
                  </div>
                </SectionCard>

                {/* 2. ENDEREÇO */}
                <SectionCard className="p-6 md:p-10 text-left">
                  <SectionHeader step={2} title="Endereço de Faturação" icon={<Home size={20} />} />
                  <div className="grid gap-5 md:gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2 grid grid-cols-[1fr_100px] gap-4">
                      <input required value={rua} onChange={e => setRua(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C]" placeholder="Rua / Avenida" />
                      <input required value={numero} onChange={e => setNumero(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#00577C]" placeholder="Nº" />
                    </div>
                    <input required value={bairro} onChange={e => setBairro(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C]" placeholder="Bairro" />
                    <input required value={cep} onChange={e => setCep(mascaraCEP(e.target.value))} maxLength={9} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C]" placeholder="CEP (00000-000)" />
                    <input required value={cidade} onChange={e => setCidade(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C]" placeholder="Cidade" />
                    <input required value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} maxLength={2} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#00577C]" placeholder="UF (Ex: PA)" />
                  </div>
                </SectionCard>

                {/* 3. PAGAMENTO */}
                <SectionCard className="p-6 md:p-10 text-left">
                  <SectionHeader step={3} title="Método de Pagamento" icon={<Wallet size={20} />} />
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button type="button" onClick={() => setMetodoPagamento('pix')} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${metodoPagamento === 'pix' ? 'border-[#009640] bg-[#009640]/5 text-[#009640]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                      <QrCode size={32} /> <span className="text-xs font-black uppercase">PIX Rápido</span>
                    </button>
                    <button type="button" onClick={() => setMetodoPagamento('cartao')} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${metodoPagamento === 'cartao' ? 'border-[#00577C] bg-[#00577C]/5 text-[#00577C]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                      <CreditCard size={32} /> <span className="text-xs font-black uppercase">Cartão Crédito</span>
                    </button>
                  </div>

                  {metodoPagamento === 'cartao' && (
                    <div className="space-y-5 bg-white border-2 border-[#00577C]/10 p-6 rounded-[2rem] shadow-inner mb-8">
                      <input required value={nomeCartao} onChange={e => setNomeCartao(e.target.value.toUpperCase())} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 uppercase" placeholder="NOME IMPRESSO NO CARTÃO" />
                      <input required value={numeroCartao} onChange={e => setNumeroCartao(mascaraCartao(e.target.value))} maxLength={19} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 tracking-widest" placeholder="0000 0000 0000 0000" />
                      <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-3">
                        <input required value={mesCartao} maxLength={2} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-4 text-sm font-bold text-center" placeholder="Mês (MM)" onChange={e => setMesCartao(e.target.value.replace(/\D/g,''))} />
                        <input required value={anoCartao} maxLength={4} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-4 text-sm font-bold text-center" placeholder="Ano (AAAA)" onChange={e => setAnoCartao(e.target.value.replace(/\D/g,''))} />
                        <input required type="password" value={cvvCartao} maxLength={4} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-4 text-sm font-bold text-center tracking-widest" placeholder="CVV" onChange={e => setCvvCartao(e.target.value.replace(/\D/g,''))} />
                      </div>
                    </div>
                  )}

                  {erroApi && <div className="mb-8 p-5 bg-red-50 text-red-700 rounded-2xl font-bold text-sm flex items-center gap-3 border border-red-100"><AlertCircle size={24}/> {erroApi}</div>}
                  
                  <button type="submit" disabled={isSubmitting} className={`w-full py-6 rounded-[1.5rem] font-black text-xl text-white shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${metodoPagamento === 'pix' ? 'bg-[#009640] hover:bg-green-700' : 'bg-[#00577C] hover:bg-blue-900'}`}>
                    {isSubmitting ? <><Loader2 className="animate-spin" size={24}/> Autorizando...</> : metodoPagamento === 'pix' ? <><QrCode size={22}/> Gerar Código PIX</> : <><Lock size={22}/> Pagar com Cartão</>}
                  </button>
                </SectionCard>
              </form>
            ) : (
              <SectionCard className="p-8 md:p-16 text-center border-green-100 animate-in zoom-in-95 duration-500">
                 <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} className="text-[#009640]"/></div>
                 <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-4`}>Fatura Gerada!</h2>
                 <p className="text-slate-500 mb-8 text-lg max-w-md mx-auto">Efetue o pagamento no seu banco. A sua carteira será ativada instantaneamente após a confirmação.</p>
                 
                 {!pixExpirado && <CronometroPix onExpirado={() => setPixExpirado(true)} />}

                 <div className="w-64 h-64 bg-slate-50 mx-auto rounded-[3rem] p-6 border-4 border-dashed border-slate-200 mb-8 flex items-center justify-center shadow-inner relative">
                    <img src={qrCodeData.link} alt="QR Code" className="w-full h-full mix-blend-multiply relative z-10" />
                 </div>
                 
                 <div className="w-full max-w-md mx-auto">
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 text-left">Código PIX Copia e Cola</label>
                    <input type="text" readOnly value={qrCodeData.texto} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-xs font-mono font-bold text-slate-500 outline-none truncate mb-4" />
                    
                    <button onClick={() => {navigator.clipboard.writeText(qrCodeData.texto); setCopiado(true); setTimeout(()=>setCopiado(false),2000)}} className={`w-full py-5 rounded-2xl text-white font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-colors ${copiado ? 'bg-[#00577C]' : 'bg-[#009640] hover:bg-green-700'}`}>
                        {copiado ? <Check size={20}/> : <Copy size={20}/>} {copiado ? 'Copiado para a área de transferência!' : 'Copiar Código PIX'}
                    </button>
                 </div>
              </SectionCard>
            )}
          </div>

          {/* ── COLUNA DIREITA: RESUMO DA COMPRA ── */}
          <aside className="w-full h-fit lg:sticky lg:top-32 order-first lg:order-last relative space-y-6">
            <SectionCard>
              <div className="h-2 w-full bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
              <div className="p-6 md:p-8 border-b border-slate-100 text-left bg-slate-50">
                <p className="text-[10px] font-black uppercase text-[#00577C] tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 size={14}/> Resumo da Emissão</p>
                <h3 className={`${jakarta.className} text-xl font-black text-slate-800 leading-tight`}>Cartão de Residente Integrado</h3>
              </div>

              <div className="p-6 md:p-8 space-y-6 text-left">
                 
                 <div className="space-y-4 pb-6 border-b border-slate-100">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><User size={12}/> Titular da Conta</p>
                       <p className="font-bold text-slate-800 text-sm">{nome || dadosCidadão?.nome || 'Pendente...'}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Mail size={12}/> Envio dos Vouchers</p>
                       <p className="font-bold text-slate-800 text-sm">{email || 'Pendente...'}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Smartphone size={12}/> WhatsApp de Contato</p>
                       <p className="font-bold text-slate-800 text-sm">{telefone || 'Pendente...'}</p>
                    </div>
                 </div>

                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500 flex items-center gap-2"><Users size={16}/> Comitiva Aprovada</span>
                    <span className="font-black text-slate-800">{quantidade} {quantidade === 1 ? 'Pessoa' : 'Pessoas'}</span>
                 </div>
                 
                 <div className="pt-4 border-t border-dashed border-slate-200 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                       <span>Taxa Unitária de Emissão</span>
                       <span className="font-bold">{formatarMoeda(PRECO_UNITARIO)}</span>
                    </div>
                 </div>

                 <div className="pt-8 border-t-2 border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Total a Pagar</p>
                       <div className="bg-[#F9C400]/20 px-3 py-1 rounded-full flex items-center gap-1.5 text-amber-700 text-[10px] font-black uppercase">Tarifa Única</div>
                    </div>
                    <p className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#00577C] tabular-nums leading-none`}>
                      {formatarMoeda(valorTotalReserva)}
                    </p>
                 </div>
              </div>

              <div className="p-6 md:p-8 bg-slate-900 text-white flex items-center gap-4">
                 <ShieldAlert size={28} className="text-[#009640] shrink-0" />
                 <p className="text-[10px] md:text-xs font-medium text-slate-300 uppercase tracking-wider text-left">O valor total é destinado exclusivamente aos cofres da Prefeitura Municipal.</p>
              </div>
            </SectionCard>
            
            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center opacity-60">
               <ShieldCheck size={14}/> PagSeguro Internet S.A.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutCarteiraPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]"><Loader2 className="animate-spin text-[#00577C] w-12 h-12" /></div>}>
      <CheckoutCarteiraContent />
    </Suspense>
  );
}