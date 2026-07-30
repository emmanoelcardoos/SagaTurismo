'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // <-- ADICIONADO
import { 
  Loader2, MapPin, ShieldCheck, QrCode, CheckCircle2, 
  User, Mail, Copy, AlertCircle, CreditCard, Lock, 
  ShieldAlert, Home, Clock, Check, ChevronRight, Wallet, 
  Smartphone, IdCard, Users, Menu, X, CalendarDays, Calendar
} from 'lucide-react'; // Removidos isMobileMenuOpen, setIsMobileMenuOpen
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
const mascaraCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);
const mascaraTelefone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
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

  // ── Estado local para menu mobile (CORRIGIDO) ──
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estados Financeiros
  const PRECO_UNITARIO = 20;
  const [quantidade, setQuantidade] = useState(1);
  const valorTotalReserva = quantidade * PRECO_UNITARIO;
  
  // Pagamento - Cartão
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');
  const [nomeCartao, setNomeCartao] = useState('');
  const [numeroCartao, setNumeroCartao] = useState('');
  const [mesCartao, setMesCartao] = useState('');
  const [anoCartao, setAnoCartao] = useState('');
  const [cvvCartao, setCvvCartao] = useState('');
  
  // Dados Obrigatórios para Faturação e Antifraude
  const [cpfFaturamento, setCpfFaturamento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeTitular, setNomeTitular] = useState('');
  const [emailTitular, setEmailTitular] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numeroEndereco, setNumeroEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('São Geraldo do Araguaia');
  const [estado, setEstado] = useState('PA');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroApi, setErroApi] = useState('');
  const [qrCodeData, setQrCodeData] = useState<{ link: string; texto: string; id_pedido: string } | null>(null);
  const [pixExpirado, setPixExpirado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // ── O TEU INTERRUPTOR DE NEGÓCIO ──
  // Muda para 'false' quando a prefeitura mandar começar a cobrar!
  const isCarteiraGratuitaTemporariamente = true;

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

  // ── VALIDAÇÃO DO TOKEN ──
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
          if (data.quantidade_pessoas) setQuantidade(data.quantidade_pessoas);
          else if (data.quantidade) setQuantidade(data.quantidade);
          
          // Pré-preenche os dados se já vierem do cidadão
          if (data.cpf) setCpfFaturamento(data.cpf);
          if (data.nome) setNomeTitular(data.nome);
          if (data.email) setEmailTitular(data.email);
          

          setLoadingInitial(false);
        }
      } catch (err) { 
        console.error("Falha ao puxar dados do titular", err); 
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
      nome_cliente: dadosCidadão?.nome || nomeCartao || 'Titular', 
      cpf_cliente: cpfFaturamento.replace(/\D/g, '') || dadosCidadão?.cpf?.replace(/\D/g, '') || '00000000000', 
      email_cliente: dadosCidadão?.email || 'contato@sagaturismo.com.br',
      telefone_cliente: telefone.replace(/\D/g, '') || '11999999999',
      valor_total: valorTotalReserva,
      endereco_faturacao: {
        street: rua || 'Rua Principal',
        number: numeroEndereco || 'S/N',
        locality: bairro || 'Centro',
        city: cidade || 'São Geraldo do Araguaia',
        region_code: estado || 'PA',
        postal_code: cep.replace(/\D/g, '') || '68590000',
        country: 'BRA'
      }
    };

    try {
      if (metodoPagamento === 'cartao') {
        if (!window.PagSeguro || typeof window.PagSeguro.encryptCard !== 'function') {
          throw new Error('Sistema de segurança a carregar. Tente novamente em segundos.');
        }
        
        const key = process.env.NEXT_PUBLIC_PAGBANK_PUBLIC_KEY;
        if (!key) throw new Error('Chave de encriptação financeira em falta.');

        const cardData = window.PagSeguro.encryptCard({
          publicKey: key,
          holder: nomeCartao,
          number: numeroCartao.replace(/\D/g, ''),
          expMonth: mesCartao,
          expYear: anoCartao,
          securityCode: cvvCartao
        });

        if (cardData.hasErrors) throw new Error('O banco emissor ou a gateway rejeitou os dados do cartão.');

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
          router.push('/sucesso-carteira?pedido=' + data.codigo_pedido)
        }
      } else {
        setErroApi(data.detail || data.mensagem || 'Falha na comunicação com o banco.');
      }
    } catch (err: any) { 
      setErroApi(err.message || 'Erro inesperado.'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleEmissaoGratuita = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');
    setIsSubmitting(true);

    const payload = {
      nome_cliente: nomeTitular || dadosCidadão?.nome || 'Titular',
      cpf_cliente: cpfFaturamento.replace(/\D/g, '') || dadosCidadão?.cpf?.replace(/\D/g, '') || '00000000000',
      email_cliente: emailTitular || dadosCidadão?.email || 'contato@sagaturismo.com.br',
      telefone_cliente: telefone.replace(/\D/g, '') || '11999999999',
      token_id: token
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sagaturismo-production.up.railway.app';
      const res = await fetch(`${apiUrl}/api/v1/pagamentos/carteira-gratuita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.sucesso) {
        // Redireciona para o sucesso como se tivesse pago!
        router.push('/sucesso-carteira?pedido=' + data.codigo_pedido);
      } else {
        setErroApi(data.detail || 'Falha na emissão gratuita.');
      }
    } catch (err: any) {
      setErroApi(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInitial) return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">A carregar a sua autorização...</p>
    </div>
  );

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-20`}>
      
      {/* HEADER TIPO PREFEITURA */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {[].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`} className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
              Cartão Residente
            </Link>
          </nav>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {false && isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas Turísticas</Link>
            <Link href="/eventos" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Agenda Cultural</Link>
            <Link href="/pacotes" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Pacotes</Link>
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas</Link>
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
        </header>


      {/* PROGRESS BAR */}
      <div className="bg-white border-b border-slate-200 mt-[0px] md:mt-[0px]">
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
              isCarteiraGratuitaTemporariamente ? (
                /* ── FORMULÁRIO GRATUITO ── */
                <form onSubmit={handleEmissaoGratuita} className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SectionCard className="p-6 md:p-10 text-left border-t-4 border-t-[#009640]">
                    <SectionHeader step={1} title="Isenção de Taxa" icon={<ShieldCheck size={20} />} />
                    
                    <div className="bg-green-50 text-green-800 p-6 rounded-2xl mb-8 border border-green-100">
                        <p className="font-bold text-lg mb-2">Boas notícias!</p>
                        <p className="text-sm">Neste momento, a taxa de emissão está a ser <strong>100% subsidiada pela Prefeitura Municipal</strong>. A emissão é gratuita e não é necessário cartão de crédito ou PIX.</p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Lock size={14}/> Dados Validados Pela Auditoria
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 flex justify-between items-center cursor-not-allowed">
                            <span className="truncate">{nomeTitular || 'A carregar...'}</span>
                            <Lock size={14} className="text-slate-300 shrink-0 ml-2" />
                         </div>
                         <div className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 flex justify-between items-center cursor-not-allowed">
                            <span className="truncate">{emailTitular || 'A carregar...'}</span>
                            <Lock size={14} className="text-slate-300 shrink-0 ml-2" />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 flex justify-between items-center cursor-not-allowed">
                            <span>{cpfFaturamento ? mascaraCPF(cpfFaturamento) : 'A carregar...'}</span>
                            <Lock size={14} className="text-slate-300 shrink-0 ml-2" />
                         </div>
                         
                         {/* O ÚNICO CAMPO QUE ELE PRECISA DE PREENCHER AGORA */}
                         <input 
                           required 
                           value={telefone} 
                           onChange={e => setTelefone(mascaraTelefone(e.target.value))} 
                           maxLength={15} 
                           className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] transition-colors" 
                           placeholder="Seu Telefone (WhatsApp) *" 
                         />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        * O nome e o CPF estão bloqueados pois estão vinculados ao documento aprovado pela prefeitura.
                      </p>
                    </div>

                    {erroApi && <div className="mt-8 mb-4 p-5 bg-red-50 text-red-700 rounded-2xl font-bold text-sm flex items-center gap-3 border border-red-100"><AlertCircle size={24}/> {erroApi}</div>}

                    <button type="submit" disabled={isSubmitting} className="w-full mt-8 py-6 rounded-[1.5rem] font-black text-xl text-white bg-[#009640] hover:bg-green-700 shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50">
                        {isSubmitting ? <><Loader2 className="animate-spin" size={24}/> Processando...</> : <><IdCard size={22}/> Prosseguir com a Emissão</>}
                    </button>
                  </SectionCard>
                </form>
              ) : (
                /* ── O TEU FORMULÁRIO ORIGINAL DE PAGAMENTO FICA AQUI INTACTO ── */
                <form onSubmit={handlePagamento} className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* ... (Cola aqui todo o SectionCard do teu formulário original de Pagamento) ... */}
                </form>
              )
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

          {/* ── COLUNA DIREITA: RESUMO DA COMPRA COM STICKY ACTIVO ── */}
          <aside className="w-full h-fit lg:sticky lg:top-32 order-first lg:order-last relative space-y-6">
            <SectionCard>
              <div className="h-2 w-full bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
              <div className="p-6 md:p-8 border-b border-slate-100 text-left bg-slate-50">
                <p className="text-[10px] font-black uppercase text-[#00577C] tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 size={14}/> Resumo da Emissão</p>
                <h3 className={`${jakarta.className} text-xl font-black text-slate-800 leading-tight`}>Cartão de Residente</h3>
              </div>

              <div className="p-6 md:p-8 space-y-6 text-left">
                 
                 <div className="space-y-4 pb-6 border-b border-slate-100">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><User size={12}/> Titular da Conta Aprovado</p>
                        <p className="font-bold text-slate-800 text-sm">{dadosCidadão?.nome || 'Indisponível no momento'}</p>
                    </div>
                    {dadosCidadão?.email && (
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Mail size={12}/> Envio dos Vouchers</p>
                         <p className="font-bold text-slate-800 text-sm">{dadosCidadão.email}</p>
                      </div>
                    )}
                 </div>

                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500 flex items-center gap-2"><Users size={16}/> Grupo Familiar Aprovado</span>
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
                      {isCarteiraGratuitaTemporariamente ? formatarMoeda(0) : formatarMoeda(valorTotalReserva)}
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