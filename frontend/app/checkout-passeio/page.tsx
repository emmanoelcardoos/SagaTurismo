'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, MapPin, ShieldCheck, QrCode, CheckCircle2, 
  User, Mail, Copy, AlertCircle, CreditCard, Lock, 
  ShieldAlert, Home, Clock, Check, ChevronRight, Wallet,
  Smartphone, Users, Calendar, Compass
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

declare global {
  interface Window {
    PagSeguro?: any;
  }
}

type Passeio = {
  id: string;
  titulo: string;
  imagem_principal: string;
  data_passeio: string;
  horario_saida?: string;
  ponto_encontro?: string;
  valor_total: number;
  taxa_prefeitura: number;
  categoria?: string;
};

const formatarMoeda = (valor: number) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const mascaraCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
const mascaraCartao = (v: string) => v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
const mascaraTelefone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})/, '$1-$2').slice(0, 15);

const formatarData = (dataStr: string) => {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
};

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[2rem] border-2 border-slate-100 bg-white shadow-sm overflow-hidden ${className}`}>{children}</div>;
}

function SectionHeader({ step, title, icon }: { step: number; title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-6 text-left">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0085FF] text-white text-sm font-black shadow-md">
        {step}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[#0085FF] bg-blue-50 p-2 rounded-xl hidden sm:block">{icon}</span>
        <h2 className={`${jakarta.className} text-xl font-black text-slate-900 tracking-tight`}>{title}</h2>
      </div>
    </div>
  );
}

// ── CRONÓMETRO PIX REGRESSIVO ──
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
    <div className="rounded-3xl border-2 p-6 transition-all bg-slate-50 border-slate-200 text-left mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-[#009640] animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Aguardando Pagamento</p>
        </div>
        <div className="text-2xl font-black tabular-nums text-slate-800">
          {String(minutos).padStart(2, "0")}:{String(segundos).padStart(2, "0")}
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-[#009640] transition-all duration-1000" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function CheckoutPasseioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const passeioId = searchParams.get('id');
  const pessoasParam = Number(searchParams.get('pessoas')) || 1;

  const [passeio, setPasseio] = useState<Passeio | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Form Fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  
  // Payment Metodos
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

  // Custo Direto da Supabase
  const custoBasePasseio = (passeio?.valor_total || 0) * pessoasParam;
  const custoTaxaPrefeitura = (passeio?.taxa_prefeitura || 0) * pessoasParam;
  const valorTotalFinal = custoBasePasseio + custoTaxaPrefeitura;

  // Injeção do SDK PagBank
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

  // Carregar dados estruturais do passeio
  useEffect(() => {
    if (!passeioId) { router.push('/roteiro'); return; }

    async function obterPasseioDB() {
      try {
        const { data, error } = await supabase
          .from('passeios')
          .select('id, titulo, imagem_principal, data_passeio, horario_saida, ponto_encontro, valor_total, taxa_prefeitura, categoria')
          .eq('id', passeioId)
          .single();

        if (!error && data) {
          setPasseio(data as Passeio);
        } else {
          setErroApi("Passeio ou expedição não localizado na base.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInitial(false);
      }
    }
    obterPasseioDB();
  }, [passeioId, router]);

  const handleProcessarTransacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');
    if (cpf.length < 14) { setErroApi('CPF inválido para emissão do voucher.'); return; }
    if (telefone.length < 14) { setErroApi('WhatsApp obrigatório para avisos de saída.'); return; }
    setIsSubmitting(true);

    const payload: any = {
      tipo_item: "passeio", 
      item_id: passeioId,
      quantidade_pessoas: pessoasParam,
      nome_cliente: nome, 
      cpf_cliente: cpf.replace(/\D/g, ''), 
      email_cliente: email,
      telefone_cliente: telefone.replace(/\D/g, ''), 
      valor_total: valorTotalFinal,
      // Passa a data do passeio como checkin para salvar de forma limpa na tabela pedidos
      data_checkin: passeio?.data_passeio
    };

    try {
      if (metodoPagamento === 'cartao') {
        if (!window.PagSeguro || typeof window.PagSeguro.encryptCard !== 'function') {
          throw new Error('Módulo de criptografia PagBank carregando. Tente novamente em 2 segundos.');
        }
        
        const key = process.env.NEXT_PUBLIC_PAGBANK_PUBLIC_KEY;
        if (!key) throw new Error('Credenciais criptográficas de faturamento ausentes.');

        const cardData = window.PagSeguro.encryptCard({
          publicKey: key,
          holder: nomeCartao,
          number: numeroCartao.replace(/\D/g, ''),
          expMonth: mesCartao,
          expYear: anoCartao,
          securityCode: cvvCartao
        });

        if (cardData.hasErrors) throw new Error('Cartão recusado pela operadora ou gateway.');

        payload.metodo_pagamento = 'cartao';
        payload.encrypted_card = cardData.encryptedCard;
        payload.parcelas = 1;
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
          router.push(`/sucesso?pedido=${data.codigo_pedido}`);
        }
      } else {
        setErroApi(data.detail || data.mensagem || 'Falha operacional no gateway PagBank.');
      }
    } catch (err: any) { 
      setErroApi(err.message || 'Erro de conexão.'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (loadingInitial) return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#0085FF] w-12 h-12 mb-4" />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando Bilhetagem de Saída...</p>
    </div>
  );

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-20`}>
      
      {/* HEADER EXECUTIVO */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5 text-left">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-28 md:h-12 md:w-36 lg:h-16 lg:w-56 shrink-0"><img src="/logop.png" alt="SagaTurismo" className="h-full w-full object-contain object-left" /></div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#0085FF]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Agência Oficial</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[#009640]" size={20}/>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 hidden sm:inline-block">Checkout Seguro</span>
          </div>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="bg-white border-b border-slate-200 mt-[65px] md:mt-[80px]">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 md:py-5">
          <div className="flex items-center justify-center md:justify-start gap-2 md:gap-4 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
            <span className="hidden sm:inline-block">Passeio</span> <ChevronRight size={14} className="hidden sm:inline-block"/> 
            <span>Reserva</span> <ChevronRight size={14}/> 
            <span className="text-[#0085FF] bg-blue-50 px-3 py-1.5 rounded-full flex items-center gap-2"><Lock size={12}/> Liquidação</span> <ChevronRight size={14}/> 
            <span>Voucher Emitido</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px] items-start">
          
          {/* COLUNA ESQUERDA: DADOS E MÉTODO DE PAGAMENTO (MOBILE FIRST) */}
          <div className="space-y-6 md:space-y-8">
            {!qrCodeData ? (
              <form onSubmit={handleProcessarTransacao} className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* ETAPA 1: DADOS COMPRADOR */}
                <SectionCard className="p-6 md:p-10 text-left border-t-4 border-t-[#0085FF]">
                  <SectionHeader step={1} title="Dados do Passageiro Principal" icon={<User size={20} />} />
                  <div className="grid gap-5 md:gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nome Completo *</label>
                      <input required value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white" placeholder="Nome completo para o manifesto de embarque" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">CPF *</label>
                      <input required value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} maxLength={14} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white" placeholder="000.000.000-00" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">WhatsApp de Contato *</label>
                      <input required value={telefone} onChange={e => setTelefone(mascaraTelefone(e.target.value))} maxLength={15} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white" placeholder="(99) 99999-9999" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">E-mail para Receção do Voucher *</label>
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white" placeholder="seu@email.com" />
                    </div>
                  </div>
                </SectionCard>

                {/* ETAPA 2: PAGAMENTO */}
                <SectionCard className="p-6 md:p-10 text-left">
                  <SectionHeader step={2} title="Escolha a Forma de Pagamento" icon={<Wallet size={20} />} />
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button type="button" onClick={() => setMetodoPagamento('pix')} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer ${metodoPagamento === 'pix' ? 'border-[#009640] bg-[#009640]/5 text-[#009640]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                      <QrCode size={32} /> <span className="text-xs font-black uppercase">PIX à Vista</span>
                    </button>
                    <button type="button" onClick={() => setMetodoPagamento('cartao')} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer ${metodoPagamento === 'cartao' ? 'border-[#0085FF] bg-blue-50/50 text-[#0085FF]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                      <CreditCard size={32} /> <span className="text-xs font-black uppercase">Cartão de Crédito</span>
                    </button>
                  </div>

                  {metodoPagamento === 'cartao' && (
                    <div className="space-y-5 bg-white border-2 border-[#0085FF]/10 p-6 rounded-[2rem] shadow-inner mb-8 animate-in fade-in duration-300">
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
                  
                  <button type="submit" disabled={isSubmitting} className={`w-full py-6 rounded-[1.5rem] font-black text-xl text-white shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${metodoPagamento === 'pix' ? 'bg-[#009640] hover:bg-green-700' : 'bg-slate-900 hover:bg-black'}`}>
                    {isSubmitting ? <><Loader2 className="animate-spin" size={24}/> Processando...</> : metodoPagamento === 'pix' ? <><QrCode size={22}/> Gerar QR Code PIX</> : <><Lock size={22}/> Confirmar Compra Segura</>}
                  </button>
                </SectionCard>
              </form>
            ) : (
              <SectionCard className="p-8 md:p-16 text-center border-green-100 animate-in zoom-in-95 duration-500 bg-white">
                 <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} className="text-[#009640]"/></div>
                 <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-4`}>Fatura Emitida!</h2>
                 <p className="text-slate-500 mb-8 text-lg max-w-md mx-auto">Escaneie o QR Code abaixo no aplicativo do seu banco. A sua vaga está reservada.</p>
                 
                 {!pixExpirado && <CronometroPix onExpirado={() => setPixExpirado(true)} />}

                 <div className="w-64 h-64 bg-slate-50 mx-auto rounded-[3rem] p-6 border-4 border-dashed border-slate-200 mb-8 flex items-center justify-center shadow-inner relative">
                    <img src={qrCodeData.link} alt="QR Code PIX" className="w-full h-full mix-blend-multiply relative z-10" />
                 </div>
                 
                 <div className="w-full max-w-md mx-auto text-left">
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Código PIX Copia e Cola</label>
                    <input type="text" readOnly value={qrCodeData.texto} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-xs font-mono font-bold text-slate-500 outline-none truncate mb-4" />
                    
                    <button onClick={() => {navigator.clipboard.writeText(qrCodeData.texto); setCopiado(true); setTimeout(()=>setCopiado(false),2000)}} className={`w-full py-5 rounded-2xl text-white font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-colors cursor-pointer ${copiado ? 'bg-[#00577C]' : 'bg-[#009640] hover:bg-green-700'}`}>
                        {copiado ? <Check size={20}/> : <Copy size={20}/>} {copiado ? 'Copiado com Sucesso!' : 'Copiar Chave PIX'}
                    </button>
                 </div>
              </SectionCard>
            )}
          </div>

          {/* ── COLUNA DIREITA: RESUMO TOTALMENTE FIXA E ESTÁTICA (REMOVIDO STICKY DO MOBILE) ── */}
          <aside className="w-full h-fit order-first lg:order-last relative space-y-6">
            <SectionCard>
              <div className="h-2 w-full bg-gradient-to-r from-[#0085FF] via-[#F9C400] to-[#009640]" />
              
              {/* Thumbnail da Atração */}
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                 <img src={passeio?.imagem_principal || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1721"} alt={passeio?.titulo} className="w-full h-full object-cover" />
                 <span className="absolute top-3 left-3 bg-white/95 backdrop-blur text-[#0085FF] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1">
                    <Compass size={12}/> {passeio?.categoria || 'Aventura'}
                 </span>
              </div>

              <div className="p-6 md:p-8 border-b border-slate-100 text-left bg-slate-50">
                <p className="text-[10px] font-black uppercase text-[#0085FF] tracking-widest mb-1">Roteiro Selecionado</p>
                <h3 className={`${jakarta.className} text-xl font-black text-slate-800 leading-tight`}>{passeio?.titulo || 'Carregando expedição...'}</h3>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mt-2">
                   <MapPin size={12} className="text-[#009640]" /> São Geraldo do Araguaia - PA
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-4 text-left font-bold text-sm text-slate-600">
                 
                 <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-slate-400 uppercase text-[10px] font-black">Data da Expedição</span>
                    <span className="text-slate-800 font-black text-xs bg-slate-100 px-3 py-1 rounded-lg">
                       {passeio?.data_passeio ? formatarData(passeio.data_passeio) : '--/--/----'}
                    </span>
                 </div>

                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500 flex items-center gap-1.5"><Users size={16}/> Passageiros</span>
                    <span className="font-black text-slate-800">{pessoasParam} {pessoasParam === 1 ? 'Vaga' : 'Vagas'}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Valor Unitário</span>
                    <span className="font-black text-slate-800">{formatarMoeda(passeio?.valor_total || 0)}</span>
                 </div>
                 
                 <div className="pt-4 border-t border-dashed border-slate-200 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-500 font-medium">
                       <span>Custo de Condução</span>
                       <span className="font-bold text-slate-800">{formatarMoeda(custoBasePasseio)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-medium">
                       <span>Taxa de Preservação (SEMTUR)</span>
                       <span className="font-bold text-[#009640]">{custoTaxaPrefeitura > 0 ? formatarMoeda(custoTaxaPrefeitura) : 'Isento'}</span>
                    </div>
                 </div>

                 <div className="pt-6 border-t-2 border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Total a Liquidar</p>
                       <div className="bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1 text-[#009640] text-[9px] font-black uppercase border border-green-100"><Check size={10} strokeWidth={4}/> Garantido</div>
                    </div>
                    <p className={`${jakarta.className} text-4xl font-black text-[#0085FF] tabular-nums leading-none`}>
                      {formatarMoeda(valorTotalFinal)}
                    </p>
                 </div>
              </div>

              <div className="p-5 md:p-6 bg-slate-900 text-white flex items-center gap-4">
                 <ShieldAlert size={26} className="text-[#F9C400] shrink-0" />
                 <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider text-left leading-relaxed">Voucher oficial homologado e monitorado pela central municipal de turismo.</p>
              </div>
            </SectionCard>
            
            <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center opacity-60">
               <ShieldCheck size={12}/> PagSeguro Internet S.A.
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

export default function CheckoutPasseioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]"><Loader2 className="animate-spin text-[#0085FF] w-12 h-12" /></div>}>
      <CheckoutPasseioContent />
    </Suspense>
  );
}