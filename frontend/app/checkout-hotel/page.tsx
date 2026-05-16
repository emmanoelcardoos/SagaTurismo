'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { 
  Loader2, MapPin, ShieldCheck, Bed, QrCode, CheckCircle2, 
  User, Mail, FileText, Copy, AlertCircle, 
  CreditCard, Lock, ShieldAlert, Home, Clock, Info, Check, ChevronRight,
  Wallet
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS ──
declare global {
  interface Window {
    PagSeguro?: any;
  }
}

type Hotel = { 
  id: string; nome: string; imagem_url: string;
  quarto_standard_nome: string; quarto_standard_preco: any; 
  quarto_luxo_nome: string; quarto_luxo_preco: any; 
};

// ── UTILITÁRIOS DE MÁSCARA ──
const parseValor = (valor: any): number => {
  if (!valor) return 0;
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  return isNaN(num) ? 0 : num;
};
const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
const mascaraCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
const mascaraCartao = (v: string) => v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
const mascaraTelefone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})/, '$1-$2').slice(0, 15);
const mascaraCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);

const formatarData = (dataStr: string) => {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
};

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[2rem] border-2 border-slate-100 bg-white shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
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

function BarraTempoReserva() {
  const [segundos, setSegundos] = useState(900);
  useEffect(() => {
    const id = setInterval(() => setSegundos(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  const percent = (segundos / 900) * 100;

  return (
    <div className="mb-8 overflow-hidden rounded-[2rem] border-2 border-blue-50 bg-blue-50/50 shadow-sm">
      <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <p className="font-black text-base text-[#00577C] flex items-center gap-2">
             <ShieldCheck size={18} className="text-[#009640]"/> Disponibilidade Garantida
          </p>
          <p className="text-xs md:text-sm font-bold text-slate-500 mt-1">Conclua o pagamento nos próximos minutos para garantir o seu quarto.</p>
        </div>
        <div className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 shadow-sm border border-blue-100 w-fit">
          <Clock size={18} className="text-[#00577C] animate-pulse" />
          <span className="text-xl md:text-2xl font-black text-[#00577C] tabular-nums">{String(min).padStart(2, "0")}:{String(seg).padStart(2, "0")}</span>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-200">
        <div className="h-full bg-[#00577C] transition-all duration-1000 ease-linear" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function CheckoutHotelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const hotelId = searchParams.get('hotel');
  const quartoTipo = searchParams.get('quarto') as 'standard' | 'luxo' | null;
  const checkinData = searchParams.get('checkin');
  const checkoutData = searchParams.get('checkout');
  const adultosParam = Number(searchParams.get('adultos')) || 2;
  const quartosParam = Number(searchParams.get('quartos')) || 1;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Estados Reativos do Motor de Preços
  const [valorTotalReserva, setValorTotalReserva] = useState<number>(0);
  const [numNoites, setNumNoites] = useState<number>(1);
  const [loadingPreco, setLoadingPreco] = useState<boolean>(false);
  const [acomodacaoDisponivel, setAcomodacaoDisponivel] = useState<boolean>(true);

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
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('cartao');
  const [nomeCartao, setNomeCartao] = useState('');
  const [numeroCartao, setNumeroCartao] = useState('');
  const [mesCartao, setMesCartao] = useState('');
  const [anoCartao, setAnoCartao] = useState('');
  const [cvvCartao, setCvvCartao] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroApi, setErroApi] = useState('');
  const [qrCodeData, setQrCodeData] = useState<{ link: string; texto: string; id_pedido: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const cur = window.scrollY;
      setShowHeader(cur < 80 || cur < lastScrollY);
      setLastScrollY(cur);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Carregamento de dados básicos do hotel
  useEffect(() => {
    async function carregarHotel() {
      if (!hotelId) return;
      const { data, error } = await supabase.from('hoteis').select('*').eq('id', hotelId).single();
      if (!error && data) setHotel(data as Hotel);
      setLoadingInitial(false);
    }
    carregarHotel();
  }, [hotelId]);

  // Consultar preços na API Railway
  useEffect(() => {
    if (!hotelId || !checkinData || !checkoutData || !quartoTipo) return;

    async function obterPrecoOficialAPI() {
      setLoadingPreco(true);
      try {
        const response = await fetch(
          `https://sagaturismo-production.up.railway.app/api/v1/public/hoteis/${hotelId}/calcular-preco?tipo_quarto=${quartoTipo}&checkin=${checkinData}&checkout=${checkoutData}&quantidade=${quartosParam}`
        );
        const data = await response.json();
        
        if (data.sucesso) {
          setValorTotalReserva(data.valor_total);
          setNumNoites(data.noites);
          setAcomodacaoDisponivel(data.disponivel);
          if (!data.disponivel) {
            setErroApi("Atenção: A acomodação escolhida esgotou nas datas selecionadas.");
          }
        } else {
          setErroApi(data.detail || "Erro ao calcular preço dinâmico.");
        }
      } catch (err) {
        console.error("Erro rede ao consultar API pública de preços:", err);
      } finally {
        setLoadingPreco(false);
      }
    }

    obterPrecoOficialAPI();
  }, [hotelId, quartoTipo, checkinData, checkoutData, quartosParam]);

  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');
    if (!acomodacaoDisponivel) { setErroApi('Impossível prosseguir. Quarto esgotado.'); return; }
    if (cpf.length < 14) { setErroApi('CPF inválido.'); return; }
    setIsSubmitting(true);

    const payload: any = {
      tipo_item: "hotel", 
      hotel_id: hotelId, 
      tipo_quarto: quartoTipo, 
      data_checkin: checkinData, 
      data_checkout: checkoutData,
      adultos: adultosParam, 
      quantidade: quartosParam,
      nome_cliente: nome, 
      cpf_cliente: cpf.replace(/\D/g, ''), 
      email_cliente: email,
      telefone_cliente: telefone.replace(/\D/g, ''), 
      endereco_faturacao: {
        street: rua,
        number: numero,
        locality: bairro,
        city: cidade, 
        region_code: estado.replace(/\s/g, ''),
        country: "BRA",
        postal_code: cep.replace(/\D/g, '')
      }
    };

    try {
      if (metodoPagamento === 'cartao') {
        if (!window.PagSeguro) throw new Error('Checkout SDK do PagBank não foi inicializado.');
        
        let result: any = null;
        const key = process.env.NEXT_PUBLIC_PAGBANK_PUBLIC_KEY;
        const cardData = {
          holder: nomeCartao, 
          number: numeroCartao.replace(/\D/g,''),
          expMonth: mesCartao, 
          expYear: anoCartao, 
          securityCode: cvvCartao
        };

        // ── TENTATIVA 1: MÉTODO ESTÁTICO DIRETO (Padrão oficial em navegadores modernos) ──
        try {
          if (typeof window.PagSeguro.encryptCard === 'function') {
            result = window.PagSeguro.encryptCard({
              publicKey: key,
              ...cardData
            });
          }
        } catch (err1) {
          console.warn("Tentativa 1 (Estático) ignorada:", err1);
        }

        // ── TENTATIVA 2: CLASSE COM OPERADOR 'NEW' (Caso o ecossistema trate como classe) ──
        if (!result || result.hasErrors) {
          try {
            const pagseguroInstance = new window.PagSeguro({ publicKey: key });
            result = pagseguroInstance.encryptCard(cardData);
          } catch (err2) {
            console.warn("Tentativa 2 (Instância Class) ignorada:", err2);
          }
        }

        // ── TENTATIVA 3: FUNÇÃO DE FÁBRICA SEM 'NEW' (Formatos de compatibilidade legados) ──
        if (!result || result.hasErrors) {
          try {
            const pagseguroInstance = window.PagSeguro({ publicKey: key });
            result = pagseguroInstance.encryptCard(cardData);
          } catch (err3) {
            console.warn("Tentativa 3 (Fábrica) ignorada:", err3);
          }
        }

        // Se todas as abordagens falharem ou o PagBank retornar erro interno de dados
        if (!result || result.hasErrors) {
          throw new Error('Falha na validação do cartão de crédito. Verifique os números digitados.');
        }

        payload.metodo_pagamento = 'cartao';
        payload.encrypted_card = result.encryptedCard;
        payload.parcelas = parcelas;
      } else {
        payload.metodo_pagamento = 'pix';
      }

      const res = await fetch(`https://sagaturismo-production.up.railway.app/api/v1/pagamentos/processar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.sucesso) {
        if (metodoPagamento === 'pix') {
          setQrCodeData({ 
            link: data.pix_qrcode_img, 
            texto: data.pix_copia_cola, 
            id_pedido: data.codigo_pedido 
          });
        } else {
          router.push(`/sucesso?pedido=${data.codigo_pedido}`);
        }
      } else {
        setErroApi(data.detail || data.mensagem || 'Ocorreu um erro no processamento financeiro.');
      }
    } catch (err: any) { setErroApi(err.message); } finally { setIsSubmitting(false); }
  };

  if (loadingInitial) return <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center"><Loader2 className="animate-spin text-[#00577C] w-12 h-12" /></div>;

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-20`}>
      <Script src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js" strategy="afterInteractive" />

      {/* HEADER */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5 text-left">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-28 md:h-12 md:w-36 lg:h-16 lg:w-56 shrink-0"><Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" /></div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[#009640]" size={20}/>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 hidden sm:inline-block">Checkout Oficial</span>
          </div>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="bg-white border-b border-slate-200 mt-[65px] md:mt-[80px]">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 md:py-5">
          <div className="flex items-center justify-center md:justify-start gap-2 md:gap-4 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
            <span className="hidden sm:inline-block">Alojamento</span> <ChevronRight size={14} className="hidden sm:inline-block"/> 
            <span>Escolha</span> <ChevronRight size={14}/> 
            <span className="text-[#00577C] bg-blue-50 px-3 py-1.5 rounded-full flex items-center gap-2"><Lock size={12}/> Pagamento</span> <ChevronRight size={14}/> 
            <span>Sucesso</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
        <BarraTempoReserva />

        <div className="grid gap-8 lg:grid-cols-[1fr_400px] items-start">
          
          {/* COLUNA ESQUERDA */}
          <div className="space-y-6 md:space-y-8">
            <SectionCard>
               <div className="flex flex-col md:flex-row h-full">
                  <div className="relative h-56 md:h-auto md:w-72 shrink-0 overflow-hidden bg-slate-100">
                    <img src={hotel?.imagem_url} alt={hotel?.nome} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-6 md:p-8 flex flex-col justify-center text-left">
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#009640] mb-3 md:mb-4 bg-green-50 border border-green-100 w-fit px-3 py-1.5 rounded-lg shadow-sm">
                        <ShieldCheck size={14}/> Alojamento Oficial Autorizado
                     </div>
                     <h2 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 mb-3 leading-tight`}>{hotel?.nome}</h2>
                     <p className="text-slate-500 flex items-center gap-2 text-sm font-bold bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                       <MapPin size={16} className="text-[#009640]"/> São Geraldo do Araguaia - PA
                     </p>
                  </div>
               </div>
            </SectionCard>

            {!qrCodeData ? (
              <form onSubmit={handlePagamento} className="space-y-6 md:space-y-8">
                {/* 1. DADOS DO HÓSPEDE */}
                <SectionCard className="p-6 md:p-10 text-left">
                  <SectionHeader step={1} title="Hóspede Principal" icon={<User size={20} />} />
                  <div className="grid gap-5 md:gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nome Completo *</label>
                      <input required value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white" placeholder="Nome completo do hóspede" />
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
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">E-mail *</label>
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
                    <input required value={cep} onChange={e => setCep(mascaraCEP(e.target.value))} maxLength={9} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C]" placeholder="00000-000" />
                    <input required value={cidade} onChange={e => setCidade(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C]" placeholder="Cidade" />
                    <input required value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} maxLength={2} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#00577C]" placeholder="PA" />
                  </div>
                </SectionCard>

                {/* 3. PAGAMENTO */}
                <SectionCard className="p-6 md:p-10 text-left">
                  <SectionHeader step={3} title="Método de Pagamento" icon={<Wallet size={20} />} />
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button type="button" onClick={() => setMetodoPagamento('pix')} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${metodoPagamento === 'pix' ? 'border-[#009640] bg-[#009640]/5 text-[#009640]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                      <QrCode size={32} /> <span className="text-xs font-black uppercase">PIX Rápido</span>
                    </button>
                    <button type="button" onClick={() => setMetodoPagamento('cartao')} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${metodoPagamento === 'cartao' ? 'border-[#00577C] bg-blue-50/50 text-[#00577C]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
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
                      <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold cursor-pointer">
                        {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}x de {formatarMoeda(valorTotalReserva/(i+1))} {!i && ' (À Vista)'}</option>)}
                      </select>
                    </div>
                  )}

                  {erroApi && <div className="mb-8 p-5 bg-red-50 text-red-700 rounded-2xl font-bold text-sm flex items-center gap-3 border border-red-100"><AlertCircle size={24}/> {erroApi}</div>}
                  
                  <button type="submit" disabled={isSubmitting || loadingPreco || !acomodacaoDisponivel} className="w-full py-6 rounded-[1.5rem] font-black text-xl text-white shadow-xl bg-slate-900 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? <><Loader2 className="animate-spin" size={24}/> Processando...</> : loadingPreco ? 'Calculando Valor...' : !acomodacaoDisponivel ? 'Esgotado' : <><Lock size={22}/> Confirmar Reserva Segura</>}
                  </button>
                </SectionCard>
              </form>
            ) : (
              /* TELA PIX AGUARDANDO */
              <SectionCard className="p-8 md:p-16 text-center border-green-100">
                 <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} className="text-[#009640]"/></div>
                 <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-4`}>Pedido Criado!</h2>
                 <p className="text-slate-500 mb-10 text-lg">Conclua o pagamento via PIX para garantir sua reserva no hotel imediatamente.</p>
                 <div className="w-64 h-64 bg-slate-50 mx-auto rounded-[3rem] p-6 border-4 border-dashed border-slate-200 mb-8 flex items-center justify-center shadow-inner relative">
                    <img src={qrCodeData.link} alt="QR Code" className="w-full h-full mix-blend-multiply relative z-10" />
                 </div>
                 <button onClick={() => {navigator.clipboard.writeText(qrCodeData.texto); alert('Código PIX Copiado!')}} className="w-full py-5 rounded-2xl bg-[#009640] hover:bg-[#007a33] text-white font-black text-lg flex items-center justify-center gap-3 shadow-xl mb-8">
                    <Copy size={20}/> Copiar Código PIX
                 </button>
                 <div className="bg-slate-50 rounded-2xl p-6 text-center">
                    <p className="text-xs text-slate-500 font-bold flex items-center justify-center gap-2 mb-2"><Loader2 className="animate-spin" size={16}/> Aguardando aprovação bancária...</p>
                 </div>
              </SectionCard>
            )}
          </div>

          {/* ── COLUNA DIREITA: RESUMO PROFISSIONAL (ESTÁTICO) ── */}
          <aside className="w-full h-fit lg:self-start order-first lg:order-last relative">
            <SectionCard>
              <div className="h-2 w-full bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
              <div className="p-6 md:p-8 border-b border-slate-100 text-left bg-slate-50">
                <p className="text-[10px] font-black uppercase text-[#00577C] tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 size={14}/> Resumo da Acomodação</p>
                <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-800 leading-tight`}>{hotel?.nome}</h3>
              </div>

              <div className="p-6 md:p-8 space-y-6 text-left">
                 <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><Bed size={20} className="text-[#00577C]"/></div>
                    <div className="flex-1 pt-1">
                       <p className="text-sm font-black text-slate-800 leading-none mb-1.5">{quartoTipo === 'luxo' ? hotel?.quarto_luxo_nome : hotel?.quarto_standard_nome}</p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                         {checkinData ? formatarData(checkinData) : ''} a {checkoutData ? formatarData(checkoutData) : ''}
                       </p>
                    </div>
                 </div>
                 
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Estadia</span>
                    <span className="font-black text-slate-800">{loadingPreco ? '...' : `${numNoites} Noite(s)`}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Quartos</span>
                    <span className="font-black text-slate-800">{quartosParam} Unidade(s)</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Hóspedes</span>
                    <span className="font-black text-slate-800">{adultosParam} Adulto(s)</span>
                 </div>
                 
                 <div className="pt-4 border-t border-dashed border-slate-200 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                       <span>Média por Noite</span>
                       <span className="font-bold">{loadingPreco ? '...' : formatarMoeda(valorTotalReserva / numNoites / quartosParam)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                       <span>Taxas governamentais</span>
                       <span className="font-bold text-[#009640]">Isento</span>
                    </div>
                 </div>

                 <div className="pt-8 border-t-2 border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Total a Pagar</p>
                       <div className="bg-green-50 px-3 py-1 rounded-full flex items-center gap-1.5 text-[#009640] text-[10px] font-black uppercase"><Check size={12} strokeWidth={3}/> Sincronizado</div>
                    </div>
                    <p className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#00577C] tabular-nums leading-none`}>
                      {loadingPreco ? 'Calculando...' : formatarMoeda(valorTotalReserva)}
                    </p>
                 </div>
              </div>

              <div className="p-6 md:p-8 bg-[#00577C] text-white flex items-center gap-4">
                 <ShieldAlert size={28} className="text-[#F9C400] shrink-0" />
                 <p className="text-[10px] md:text-xs font-bold text-blue-100 uppercase tracking-wider text-left">Reserva oficial processada pelo sistema integrado da Secretaria de Turismo de São Geraldo do Araguaia.</p>
              </div>
            </SectionCard>
          </aside>

        </div>
      </div>
    </main>
  );
}

export default function CheckoutHotelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]"><Loader2 className="animate-spin text-[#00577C] w-12 h-12" /></div>}>
      <CheckoutHotelContent />
    </Suspense>
  );
}