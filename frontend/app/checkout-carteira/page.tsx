'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, ShieldCheck, QrCode, CheckCircle2, 
  User, Mail, Copy, AlertCircle, CreditCard, Lock, 
  ShieldAlert, Clock, Check, ChevronRight, Wallet,
  Smartphone, IdCard, Users, Calendar
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
const mascaraCartao = (v: string) => v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[2rem] border-2 border-slate-100 bg-white shadow-sm overflow-hidden ${className}`}>{children}</div>;
}

function SectionHeader({ step, title, icon }: { step: number; title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#00577C] text-white text-sm font-black shadow-md">
        {step}
      </div>
      <div className="flex items-center gap-2 text-left">
        <span className="text-[#00577C] bg-blue-50 p-2 rounded-xl hidden sm:block">{icon}</span>
        <h2 className={`${jakarta.className} text-xl font-black text-slate-900 tracking-tight`}>{title}</h2>
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

function CheckoutCarteiraContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [dadosCidadão, setDadosCidadão] = useState<any>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Estados Financeiros Fixos
  const PRECO_UNITARIO = 20;
  const [quantidade, setQuantidade] = useState(1);
  const valorTotalReserva = quantidade * PRECO_UNITARIO;
  
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

  // Injeção SDK PagBank
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

  // VALIDAÇÃO E CONSUMO DIRETO DOS DADOS DA IA
  useEffect(() => {
    if (!token) { router.push('/cadastro'); return; }
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/validar?token=${token}`);
        const data = await res.json();
        
        if (data.status === 'ativa' || data.status === 'pago') {
          router.push(`/carteira/${token}`);
          return;
        }

        if (data) {
          setDadosCidadão(data);
          const totalPessoas = data.quantidade_pessoas || data.quantidade || (data.dependentes?.length ? data.dependentes.length + 1 : 1);
          setQuantidade(totalPessoas);
          setLoadingInitial(false);
        }
      } catch (err) { 
        console.error("Erro na leitura das credenciais da IA:", err); 
        setLoadingInitial(false); 
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 8000); 
    return () => clearInterval(interval);
  }, [token, router]);

  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');
    setIsSubmitting(true);

    const payload: any = {
      tipo_item: "carteira", 
      token_id: token,
      quantidade: quantidade,
      nome_cliente: dadosCidadão?.nome || 'Residente Oficial', 
      cpf_cliente: dadosCidadão?.cpf_mascarado?.replace(/\D/g, '') || '', 
      email_cliente: dadosCidadão?.email || 'contato@sagaturismo.com.br',
      valor_total: valorTotalReserva
    };

    try {
      if (metodoPagamento === 'cartao') {
        if (!window.PagSeguro || typeof window.PagSeguro.encryptCard !== 'function') {
          throw new Error('Criptografia PagBank em carregamento. Tente em 3 segundos.');
        }
        
        const key = process.env.NEXT_PUBLIC_PAGBANK_PUBLIC_KEY;
        if (!key) throw new Error('Chave criptográfica municipal indisponível.');

        const cardData = window.PagSeguro.encryptCard({
          publicKey: key,
          holder: nomeCartao,
          number: numeroCartao.replace(/\D/g, ''),
          expMonth: mesCartao,
          expYear: anoCartao,
          securityCode: cvvCartao
        });

        if (cardData.hasErrors) throw new Error('Cartão recusado pelos critérios de risco do PagBank.');

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
          router.push(`/carteira/${token}`);
        }
      } else {
        setErroApi(data.detail || data.mensagem || 'Falha no processamento financeiro.');
      }
    } catch (err: any) { 
      setErroApi(err.message || 'Erro de conexão bancária.'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (loadingInitial) return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando Manifesto Homologado...</p>
    </div>
  );

  return (
    <div className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-20`}>
      
      {/* HEADER PREFEITURA */}
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
            <span>Aprovação IA</span> <ChevronRight size={14}/> 
            <span className="text-[#00577C] bg-blue-50 px-3 py-1.5 rounded-full flex items-center gap-2"><Lock size={12}/> Taxa de Emissão</span> <ChevronRight size={14}/> 
            <span>Carteira Ativa</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] items-start">
          
          {/* COLUNA ESQUERDA: RESUMO COMPLETO NOMINAL (ZERO IMPUTS) */}
          <div className="space-y-6 md:space-y-8 order-last lg:order-first">
            
            <SectionCard className="p-6 md:p-8 text-left border-l-4 border-l-[#00577C]">
               <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                  <IdCard className="text-[#00577C]" size={22}/>
                  <h2 className={`${jakarta.className} text-xl font-black text-slate-900`}>Manifesto de Residente Homologado</h2>
               </div>

               {/* CARD DO TITULAR */}
               <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-3.5 pb-3 border-b border-slate-200/60">
                     {dadosCidadão?.foto_url && (
                       <img src={dadosCidadão.foto_url} alt="Selfie" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
                     )}
                     <div>
                        <span className="bg-blue-100 text-[#00577C] text-[9px] font-black uppercase px-2 py-0.5 rounded">Titular da Conta</span>
                        <h3 className="text-base font-black text-slate-900 mt-0.5 leading-tight">{dadosCidadão?.nome}</h3>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><User size={12}/> CPF Oficial</p>
                        <p className="text-slate-800 text-sm font-semibold">{dadosCidadão?.cpf_mascarado || '---.---.---(--)'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar size={12}/> Data de Nascimento</p>
                        <p className="text-slate-800 text-sm font-semibold">{dadosCidadão?.data_nascimento || '--/--/----'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><Mail size={12}/> E-mail do Voucher</p>
                        <p className="text-slate-800 text-sm font-semibold truncate">{dadosCidadão?.email || 'Nenhum e-mail mapeado'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><Smartphone size={12}/> WhatsApp Vincunlado</p>
                        <p className="text-slate-800 text-sm font-semibold">{dadosCidadão?.telefone_cliente || dadosCidadão?.telefone || '(99) 99999-9999'}</p>
                     </div>
                  </div>
               </div>

               {/* SE EXISTIREM DEPENDENTES, MOSTRA-OS AQUI DE FORMA AUTOMÁTICA */}
               {dadosCidadão?.dependentes && dadosCidadão.dependentes.length > 0 && (
                  <div className="mt-6 space-y-3">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Users size={12}/> Dependentes Vinculados de Forma Direta</p>
                     {dadosCidadão.dependentes.map((dep: any, i: number) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">{i+1}</div>
                           <div className="text-left">
                              <p className="text-xs font-black text-slate-900 leading-none">{dep.nome}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">CPF: {dep.cpf || 'Mascarado'}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </SectionCard>

         </div>

         {/* COLUNA DIREITA: APENAS O PAGAMENTO (TOTALMENTE FIXA / SEM SCROLL CONFLITANTE) */}
         <aside className="w-full h-auto order-first lg:order-last space-y-6 relative">
            
            {!qrCodeData ? (
              <form onSubmit={handlePagamento}>
                <SectionCard className="p-6 md:p-8 text-left bg-white">
                  <SectionHeader step={2} title="Liquidação de Emissão" icon={<Wallet size={20} />} />
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button type="button" onClick={() => setMetodoPagamento('pix')} className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border-2 transition-all ${metodoPagamento === 'pix' ? 'border-[#009640] bg-[#009640]/5 text-[#009640]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                      <QrCode size={26} /> <span className="text-[10px] font-black uppercase">PIX</span>
                    </button>
                    <button type="button" onClick={() => setMetodoPagamento('cartao')} className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border-2 transition-all ${metodoPagamento === 'cartao' ? 'border-[#00577C] bg-[#00577C]/5 text-[#00577C]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                      <CreditCard size={26} /> <span className="text-[10px] font-black uppercase">Cartão</span>
                    </button>
                  </div>

                  {metodoPagamento === 'cartao' && (
                    <div className="space-y-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-inner mb-6 animate-in fade-in duration-300">
                      <input required value={nomeCartao} onChange={e => setNomeCartao(e.target.value.toUpperCase())} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-800 uppercase" placeholder="NOME IMPRESSO NO CARTÃO" />
                      <input required value={numeroCartao} onChange={e => setNumeroCartao(mascaraCartao(e.target.value))} maxLength={19} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-800 tracking-widest" placeholder="0000 0000 0000 0000" />
                      <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-2">
                        <input required value={mesCartao} maxLength={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-center" placeholder="MM" onChange={e => setMesCartao(e.target.value.replace(/\D/g,''))} />
                        <input required value={anoCartao} maxLength={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-center" placeholder="AAAA" onChange={e => setAnoCartao(e.target.value.replace(/\D/g,''))} />
                        <input required type="password" value={cvvCartao} maxLength={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-center tracking-widest" placeholder="CVV" onChange={e => setCvvCartao(e.target.value.replace(/\D/g,''))} />
                      </div>
                    </div>
                  )}

                  {/* MINI CONTROLO DE QUANTIDADE (SE ELE QUISER ADICIONAR MAIS EMISSÕES À ULTIMA HORA) */}
                  <div className="mb-6 bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-500">Unidades de Emissão</span>
                     <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-1">
                        <button type="button" onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-50 text-[#00577C] font-black">-</button>
                        <span className="font-black text-sm text-[#00577C] w-4 text-center">{quantidade}</span>
                        <button type="button" onClick={() => setQuantidade(quantidade + 1)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-50 text-[#00577C] font-black">+</button>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-dashed border-slate-100 flex items-center justify-between mb-6">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Valor Total Faturado</p>
                        <p className={`${jakarta.className} text-3xl font-black text-[#00577C] mt-0.5`}>{formatarMoeda(valorTotalReserva)}</p>
                     </div>
                     <span className="text-[9px] font-black bg-green-50 text-[#009640] border border-green-100 px-2 py-1 rounded uppercase">Prefeitura</span>
                  </div>

                  {erroApi && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl font-bold text-xs border border-red-100">{erroApi}</div>}
                  
                  <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${metodoPagamento === 'pix' ? 'bg-[#009640] hover:bg-green-700' : 'bg-[#00577C] hover:bg-blue-900'}`}>
                    {isSubmitting ? <><Loader2 className="animate-spin" size={16}/> Processando...</> : metodoPagamento === 'pix' ? <><QrCode size={16}/> Emitir PIX Governador</> : <><Lock size={16}/> Autenticar Fatura</>}
                  </button>
                </SectionCard>
              </form>
            ) : (
              <SectionCard className="p-6 text-center border-green-100 animate-in zoom-in-95 duration-500 bg-white">
                 <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} className="text-[#009640]"/></div>
                 <h2 className={`${jakarta.className} text-xl font-black text-slate-900 mb-2`}>Fatura Criada!</h2>
                 <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">Efetue o PIX. O cartão residente saltará para ativo no e-mail após a validação.</p>
                 
                 {!pixExpirado && <CronometroPix onExpirado={() => setPixExpirado(true)} />}

                 <div className="w-48 h-48 bg-slate-50 mx-auto rounded-3xl p-4 border-2 border-dashed border-slate-200 mb-6 flex items-center justify-center shadow-inner relative">
                    <img src={qrCodeData.link} alt="QR Code" className="w-full h-full mix-blend-multiply relative z-10" />
                 </div>
                 
                 <div className="w-full text-left space-y-3">
                    <input type="text" readOnly value={qrCodeData.texto} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[10px] font-mono font-bold text-slate-400 outline-none truncate" />
                    <button onClick={() => {navigator.clipboard.writeText(qrCodeData.texto); setCopiado(true); setTimeout(()=>setCopiado(false),2000)}} className={`w-full py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm transition-colors ${copiado ? 'bg-[#00577C]' : 'bg-[#009640] hover:bg-green-700'}`}>
                        {copiado ? <Check size={14}/> : <Copy size={14}/>} {copiado ? 'Copiado!' : 'Copiar Código'}
                    </button>
                 </div>
              </SectionCard>
            )}

            <div className="bg-slate-900 text-white p-5 rounded-[2rem] text-left border-2 border-slate-800 shadow-md">
               <div className="flex gap-3 items-center">
                  <ShieldAlert size={22} className="text-[#F9C400] shrink-0" />
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Arrecadação Municipal Direta</p>
               </div>
               <p className="text-[11px] font-medium text-slate-400 mt-2 leading-relaxed">Taxa de emissão auditada em tempo real pela Secretaria de Finanças. Isento de taxas de intermediação privada.</p>
            </div>

         </aside>

        </div>
      </div>
    </div>
  );
}

export default function CheckoutCarteiraPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]"><Loader2 className="animate-spin text-[#00577C] w-12 h-12" /></div>}>
      <CheckoutCarteiraContent />
    </Suspense>
  );
}