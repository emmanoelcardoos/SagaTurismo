'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // <-- adicionado
import { 
  Loader2, MapPin, ShieldCheck, Bed, QrCode, CheckCircle2, 
  Users, Calendar, Clock, Copy, AlertCircle, 
  CreditCard, Lock, ShieldAlert, Home, Check, ChevronRight,
  Wallet, ChevronLeft, UserPlus, Menu, X, CalendarDays
} from 'lucide-react'; // <-- removidos isMobileMenuOpen e setIsMobileMenuOpen
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

declare global {
  interface Window {
    PagSeguro?: any;
  }
}

type Hotel = { 
  id: string; nome: string; imagem_url: string;
};

type QuartoFisico = {
  id: string; nome_quarto: string; preco_quarto: number; imagem_url: string;
};

type Acompanhante = {
  nome: string; cpf: string; data_nascimento: string;
};

const parseValor = (valor: any): number => {
  if (!valor) return 0;
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  return isNaN(num) ? 0 : num;
};
const formatarMoeda = (valor: number) => {
  return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
const mascaraCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
const mascaraCartao = (v: string) => v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
const mascaraTelefone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})/, '$1-$2').slice(0, 15);
const mascaraCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
const mascaraData = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 10);

const formatarDataExibicao = (dataStr: string) => {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
};

const formatarParaBackend = (dataBr: string): string => {
  if (!dataBr || dataBr.length < 10) return '';
  const [dia, mes, ano] = dataBr.split('/');
  return `${ano}-${mes}-${dia}`;
};

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[2rem] border-2 border-slate-100 bg-white shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ step, title, icon }: { step: number | string; title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#00577C] text-white text-sm font-black shadow-md">
        {step}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[#00577C] bg-[#00577C]/5 p-2 rounded-xl hidden sm:block">{icon}</span>
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
    <div className="mb-8 overflow-hidden rounded-[2rem] border-2 border-[#00577C]/10 bg-[#00577C]/5 shadow-sm">
      <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <p className="font-black text-base text-[#00577C] flex items-center gap-2">
             <ShieldCheck size={18} className="text-[#009640]"/> Disponibilidade Garantida
          </p>
          <p className="text-xs md:text-sm font-bold text-slate-500 mt-1">Conclua o pagamento nos próximos minutos para garantir o seu quarto.</p>
        </div>
        <div className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 shadow-sm border border-[#00577C]/20 w-fit">
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
  const quartoNomeReal = searchParams.get('quarto');
  const checkinData = searchParams.get('checkin');
  const checkoutData = searchParams.get('checkout');
  const adultosParam = Number(searchParams.get('adultos')) || 2;
  const quartosParam = Number(searchParams.get('quartos')) || 1;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [quartoSelecionado, setQuartoSelecionado] = useState<QuartoFisico | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // ── ESTADO DO WIZARD (MULTI-STEP) ──
  const [passoAtual, setPassoAtual] = useState(1);

  // Estados Reativos do Motor de Preços
  const [valorTotalReserva, setValorTotalReserva] = useState<number>(0);
  const [numNoites, setNumNoites] = useState<number>(1);
  const [loadingPreco, setLoadingPreco] = useState<boolean>(false);
  const [acomodacaoDisponivel, setAcomodacaoDisponivel] = useState<boolean>(true);

  // Estados Form - Titular
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  
  // Estados Form - Endereço
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cep, setCep] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  
  // Estado Dinâmico Acompanhantes
  const [hospedesExtras, setHospedesExtras] = useState<Acompanhante[]>([]);

  // ── NOVO: Estado do menu mobile ──
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const numAcompanhantes = Math.max(0, adultosParam - quartosParam);
    setHospedesExtras(prev => {
      const copy = [...prev];
      if (copy.length === numAcompanhantes) return prev;
      if (copy.length > numAcompanhantes) return copy.slice(0, numAcompanhantes);
      while (copy.length < numAcompanhantes) {
        copy.push({ nome: '', cpf: '', data_nascimento: '' });
      }
      return copy;
    });
  }, [adultosParam, quartosParam]);

  const handleAcompanhanteChange = (index: number, campo: keyof Acompanhante, valor: string) => {
    setHospedesExtras(prev => {
      const novos = [...prev];
      novos[index] = { ...novos[index], [campo]: valor };
      return novos;
    });
  };

  // Estados de Faturamento & Gateway
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

  // ── MATEMÁTICA DOS PASSOS ──
  const passoFaturacao = 2 + hospedesExtras.length;
  const passoPagamento = 3 + hospedesExtras.length;

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

  // Carregamento de dados básicos
  useEffect(() => {
    async function carregarDadosEstruturais() {
      if (!hotelId) {
        setLoadingInitial(false); return;
      }
      
      const { data: hData } = await supabase.from('hoteis').select('*').eq('id', hotelId).single();
      if (hData) setHotel(hData as Hotel);

      if (quartoNomeReal) {
        const { data: qData } = await supabase.from('tipos_quarto').select('*').eq('hotel_id', hotelId).eq('nome_quarto', quartoNomeReal).single();
        if (qData) setQuartoSelecionado(qData as QuartoFisico);
      }
      setLoadingInitial(false);
    }
    carregarDadosEstruturais();
  }, [hotelId, quartoNomeReal]);

  // Consultar preços API
  useEffect(() => {
    if (!hotelId || !checkinData || !checkoutData || !quartoNomeReal) return;

    async function obterPrecoOficialAPI() {
      setLoadingPreco(true);
      try {
        const response = await fetch(
          `https://sagaturismo-production.up.railway.app/api/v1/public/hoteis/${hotelId}/calcular-preco?tipo_quarto=${encodeURIComponent(quartoNomeReal)}&checkin=${checkinData}&checkout=${checkoutData}&quantidade=${quartosParam}&adultos=${adultosParam}`
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
  }, [hotelId, quartoNomeReal, checkinData, checkoutData, quartosParam, adultosParam]);


  // ── LÓGICA DE VALIDAÇÃO E NAVEGAÇÃO HORIZONTAL ──
  const handleAvançarPasso = () => {
    setErroApi('');
    
    // Validações do Passo 1 (Titular)
    if (passoAtual === 1) {
      if (!nome || !cpf || !telefone || !email) {
        setErroApi('Por favor, preencha todos os campos do Titular.'); return;
      }
      if (cpf.length < 14) {
        setErroApi('CPF do titular incompleto/inválido.'); return;
      }
    }

    // Validações dos Passos Intermédios (Acompanhantes)
    if (passoAtual > 1 && passoAtual < passoFaturacao) {
      const indexAcompanhante = passoAtual - 2;
      const h = hospedesExtras[indexAcompanhante];
      if (!h.nome || h.cpf.length < 14 || h.data_nascimento.length < 10) {
        setErroApi(`Preencha todos os dados corretamente para o Acompanhante #${indexAcompanhante + 1}.`);
        return;
      }
    }

    // Validações do Passo Faturação
    if (passoAtual === passoFaturacao) {
      if (!rua || !numero || !bairro || !cep || !cidade || !estado) {
        setErroApi('Por favor, preencha todos os campos de endereço de faturação.'); return;
      }
      if (cep.length < 9) {
        setErroApi('CEP incompleto/inválido.'); return;
      }
    }

    setPassoAtual(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVoltarPasso = () => {
    setErroApi('');
    setPassoAtual(prev => Math.max(1, prev - 1));
  };


  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');
    if (!acomodacaoDisponivel) { setErroApi('Impossível prosseguir. Quarto esgotado.'); return; }
    if (cpf.length < 14) { setErroApi('CPF inválido.'); return; }

    setIsSubmitting(true);

    const acompanhantesFormatados = hospedesExtras.map(h => ({
      nome: h.nome,
      cpf: h.cpf.replace(/\D/g, ''),
      data_nascimento: formatarParaBackend(h.data_nascimento)
    }));

    const payload: any = {
      tipo_item: "hotel", 
      hotel_id: hotelId, 
      tipo_quarto: quartoNomeReal, 
      data_checkin: checkinData, 
      data_checkout: checkoutData,
      adultos: adultosParam, 
      quantidade: quartosParam,
      nome_cliente: nome, 
      cpf_cliente: cpf.replace(/\D/g, ''), 
      email_cliente: email,
      telefone_cliente: telefone.replace(/\D/g, ''), 
      hospedes_extras: acompanhantesFormatados,
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
        if (!key) throw new Error('Chave pública do PagBank não localizada.');

        const cardData = window.PagSeguro.encryptCard({
          publicKey: key,
          holder: nomeCartao,
          number: numeroCartao.replace(/\D/g, ''),
          expMonth: mesCartao,
          expYear: anoCartao,
          securityCode: cvvCartao
        });

        if (cardData.hasErrors) {
          throw new Error('Dados do cartão recusados pelo gateway de segurança do PagBank.');
        }

        payload.metodo_pagamento = 'cartao';
        payload.encrypted_card = cardData.encryptedCard;
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
    } catch (err: any) { 
      setErroApi(err.message || 'Erro inesperado na assinatura eletrónica.'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const precoBaseDiaria = quartoSelecionado ? Number(quartoSelecionado.preco_quarto) : 0;
  const valorBaseMatematico = precoBaseDiaria * numNoites * quartosParam;
  
  const taxaHospedeAdicional = (valorTotalReserva > valorBaseMatematico && hospedesExtras.length > 0) 
    ? valorTotalReserva - valorBaseMatematico 
    : 0;
  
  const exibirTaxaExtra = taxaHospedeAdicional > 0.05;

  if (loadingInitial) return <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center"><Loader2 className="animate-spin text-[#00577C] w-12 h-12" /></div>;

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-20 overflow-x-hidden`}>
      {/* HEADER */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Roteiros','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
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
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas Turísticas</Link>
            <Link href="/eventos" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Agenda Cultural</Link>
            <Link href="/pacotes" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Pacotes</Link>
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Roteiros</Link>
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* BREADCRUMB DINÂMICO (AGRUPADO PARA NÃO TRANSBORDAR) */}
      <div className="bg-white border-b border-slate-200 mt-[65px] md:mt-[0px]">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 md:py-5 flex items-center justify-center gap-2 md:gap-4 overflow-x-auto whitespace-nowrap">
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${passoAtual === 1 ? 'bg-[#00577C]/10 text-[#00577C]' : passoAtual > 1 ? 'text-[#009640]' : 'text-slate-400'}`}>
            {passoAtual > 1 ? <CheckCircle2 size={16}/> : <span className="font-black text-xs">1</span>}
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">Titular</span>
          </div>
          
          {hospedesExtras.length > 0 && (
            <>
              <div className={`h-px w-6 md:w-10 ${passoAtual > 1 ? 'bg-[#009640]' : 'bg-slate-200'}`} />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${passoAtual > 1 && passoAtual < passoFaturacao ? 'bg-[#00577C]/10 text-[#00577C]' : passoAtual >= passoFaturacao ? 'text-[#009640]' : 'text-slate-400'}`}>
                {passoAtual >= passoFaturacao ? <CheckCircle2 size={16}/> : <Users size={14}/>}
                <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">Hóspedes</span>
              </div>
            </>
          )}
          
          <div className={`h-px w-6 md:w-10 ${passoAtual >= passoFaturacao ? 'bg-[#009640]' : 'bg-slate-200'}`} />
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${passoAtual === passoFaturacao ? 'bg-[#00577C]/10 text-[#00577C]' : passoAtual > passoFaturacao ? 'text-[#009640]' : 'text-slate-400'}`}>
            {passoAtual > passoFaturacao ? <CheckCircle2 size={16}/> : <span className="font-black text-xs">{hospedesExtras.length > 0 ? '3' : '2'}</span>}
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">Faturação</span>
          </div>

          <div className={`h-px w-6 md:w-10 ${passoAtual === passoPagamento ? 'bg-[#009640]' : 'bg-slate-200'}`} />

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${passoAtual === passoPagamento ? 'bg-[#00577C]/10 text-[#00577C]' : 'text-slate-400'}`}>
            <span className="font-black text-xs">{hospedesExtras.length > 0 ? '4' : '3'}</span>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">Pagamento</span>
          </div>

        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
        <BarraTempoReserva />

        <div className="grid gap-8 lg:grid-cols-[1fr_400px] items-start">
          
          {/* LADO ESQUERDO: WIZARD DE CHECKOUT */}
          <div className="w-full min-w-0">
            
            <SectionCard className="mb-8">
               <div className="flex flex-col md:flex-row h-full">
                  <div className="relative h-40 md:h-auto md:w-64 shrink-0 overflow-hidden bg-slate-100">
                    <img src={hotel?.imagem_url} alt={hotel?.nome} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-6 flex flex-col justify-center text-left">
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#009640] mb-3 bg-green-50 border border-green-100 w-fit px-3 py-1.5 rounded-lg shadow-sm">
                        <ShieldCheck size={14}/> Obrigado por escolher um alojamento local!
                     </div>
                     <h2 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-2 leading-tight`}>{hotel?.nome}</h2>
                     <p className="text-slate-500 flex items-center gap-1.5 text-xs font-bold">
                       <MapPin size={14} className="text-[#009640]"/> São Geraldo do Araguaia - PA
                     </p>
                  </div>
               </div>
            </SectionCard>

            {!qrCodeData ? (
              <form onSubmit={handlePagamento} className="relative w-full">
                
                {/* ── CARROUSSEL DE CARDS (SLIDER HORIZONTAL DINÂMICO E SEGURO) ── */}
                <div className="overflow-hidden w-full relative">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out items-start" 
                    style={{ transform: `translateX(-${(passoAtual - 1) * 100}%)` }}
                  >
                    
                    {/* PASSO 1: IDENTIFICAÇÃO (TITULAR) */}
                    <div className={`w-full shrink-0 px-[2px] transition-all duration-500 ${passoAtual === 1 ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden pointer-events-none'}`}>
                      <SectionCard className="p-6 md:p-10 text-left h-full">
                        <SectionHeader step={1} title="Dados do Titular" icon={<Users size={20} />} />
                        <div className="space-y-4">
                          <p className="text-xs font-black text-[#00577C] uppercase tracking-wider mb-2">Hóspede Principal</p>
                          <div className="grid gap-5 md:gap-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nome Completo *</label>
                              <input required value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="Nome completo do titular" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">CPF *</label>
                              <input required value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} maxLength={14} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="000.000.000-00" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">WhatsApp *</label>
                              <input required value={telefone} onChange={e => setTelefone(mascaraTelefone(e.target.value))} maxLength={15} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="(99) 99999-9999" />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">E-mail *</label>
                              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="seu@email.com" />
                            </div>
                          </div>
                        </div>
                      </SectionCard>
                    </div>

                    {/* PASSOS DINÂMICOS: ACOMPANHANTES */}
                    {hospedesExtras.map((h, i) => {
                      const passoDoAcompanhante = 2 + i;
                      return (
                        <div key={i} className={`w-full shrink-0 px-[2px] transition-all duration-500 ${passoAtual === passoDoAcompanhante ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden pointer-events-none'}`}>
                          <SectionCard className="p-6 md:p-10 text-left h-full">
                            <SectionHeader step={<UserPlus size={18}/>} title={`Acompanhante #${i + 1}`} icon={<Users size={20} />} />
                            <div className="space-y-4">
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
                                Obrigatório para homologação nominal da estadia junto aos parceiros hoteleiros.
                              </p>
                              <div className="grid gap-5 md:gap-6 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1">Nome Completo *</label>
                                  <input required value={h.nome} onChange={e => handleAcompanhanteChange(i, 'nome', e.target.value.toUpperCase())} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="Nome do acompanhante" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1">CPF *</label>
                                  <input required value={h.cpf} onChange={e => handleAcompanhanteChange(i, 'cpf', mascaraCPF(e.target.value))} maxLength={14} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="000.000.000-00" />
                                </div>
                                <div className="relative">
                                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1">Data Nasc. *</label>
                                  <div className="relative flex items-center">
                                    <input 
                                      required 
                                      type="text"
                                      inputMode="numeric"
                                      value={h.data_nascimento} 
                                      onChange={e => handleAcompanhanteChange(i, 'data_nascimento', mascaraData(e.target.value))} 
                                      className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 pl-4 pr-10 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" 
                                      placeholder="DD/MM/AAAA" 
                                    />
                                    <Calendar size={18} className="absolute right-4 text-slate-400 pointer-events-none" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </SectionCard>
                        </div>
                      );
                    })}

                    {/* PASSO: FATURAÇÃO */}
                    <div className={`w-full shrink-0 px-[2px] transition-all duration-500 ${passoAtual === passoFaturacao ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden pointer-events-none'}`}>
                      <SectionCard className="p-6 md:p-10 text-left h-full">
                        <SectionHeader step={hospedesExtras.length > 0 ? 3 : 2} title="Endereço de Faturação" icon={<Home size={20} />} />
                        <div className="grid gap-5 md:gap-6 sm:grid-cols-2">
                          <div className="sm:col-span-2 grid grid-cols-[1fr_100px] gap-4">
                            <input required value={rua} onChange={e => setRua(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="Rua / Avenida" />
                            <input required value={numero} onChange={e => setNumero(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="Nº" />
                          </div>
                          <input required value={bairro} onChange={e => setBairro(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="Bairro" />
                          <input required value={cep} onChange={e => setCep(mascaraCEP(e.target.value))} maxLength={9} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="00000-000" />
                          <input required value={cidade} onChange={e => setCidade(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="Cidade" />
                          <input required value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} maxLength={2} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="PA" />
                        </div>
                      </SectionCard>
                    </div>

                    {/* PASSO: PAGAMENTO */}
                    <div className={`w-full shrink-0 px-[2px] transition-all duration-500 ${passoAtual === passoPagamento ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden pointer-events-none'}`}>
                      <SectionCard className="p-6 md:p-10 text-left h-full">
                        <SectionHeader step={hospedesExtras.length > 0 ? 4 : 3} title="Método de Pagamento" icon={<Wallet size={20} />} />
                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <button type="button" onClick={() => setMetodoPagamento('pix')} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${metodoPagamento === 'pix' ? 'border-[#009640] bg-green-50 text-[#009640]' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
                            <QrCode size={32} /> <span className="text-xs font-black uppercase">PIX Rápido</span>
                          </button>
                          <button type="button" onClick={() => setMetodoPagamento('cartao')} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${metodoPagamento === 'cartao' ? 'border-[#00577C] bg-[#00577C]/5 text-[#00577C]' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
                            <CreditCard size={32} /> <span className="text-xs font-black uppercase">Cartão Crédito</span>
                          </button>
                        </div>

                        {metodoPagamento === 'cartao' && (
                          <div className="space-y-5 bg-white border-2 border-[#00577C]/10 p-6 rounded-[2rem] shadow-inner mb-8">
                            <input required value={nomeCartao} onChange={e => setNomeCartao(e.target.value.toUpperCase())} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 uppercase outline-none focus:border-[#00577C] transition-colors" placeholder="NOME IMPRESSO NO CARTÃO" />
                            <input required value={numeroCartao} onChange={e => setNumeroCartao(mascaraCartao(e.target.value))} maxLength={19} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 tracking-widest outline-none focus:border-[#00577C] transition-colors" placeholder="0000 0000 0000 0000" />
                            <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-3">
                              <input required value={mesCartao} maxLength={2} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-4 text-sm font-bold text-center outline-none focus:border-[#00577C] transition-colors" placeholder="Mês (MM)" onChange={e => setMesCartao(e.target.value.replace(/\D/g,''))} />
                              <input required value={anoCartao} maxLength={4} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-4 text-sm font-bold text-center outline-none focus:border-[#00577C] transition-colors" placeholder="Ano (AAAA)" onChange={e => setAnoCartao(e.target.value.replace(/\D/g,''))} />
                              <input required type="password" value={cvvCartao} maxLength={4} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-4 text-sm font-bold text-center tracking-widest outline-none focus:border-[#00577C] transition-colors" placeholder="CVV" onChange={e => setCvvCartao(e.target.value.replace(/\D/g,''))} />
                            </div>
                            <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold cursor-pointer outline-none focus:border-[#00577C] transition-colors">
                              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}x de {formatarMoeda(valorTotalReserva/(i+1))} {!i && ' (À Vista)'}</option>)}
                            </select>
                          </div>
                        )}
                      </SectionCard>
                    </div>

                  </div>
                </div>

                {/* ── BOTÕES DE CONTROLE & ERRO (FIXOS AO FUNDO DO FORMULÁRIO) ── */}
                <div className="mt-6 space-y-4 w-full">
                  {erroApi && (
                    <div className="p-5 bg-red-50 text-red-700 rounded-2xl font-bold text-sm flex items-center gap-3 border border-red-100 animate-in slide-in-from-bottom-2">
                      <AlertCircle size={24} className="shrink-0"/> {erroApi}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                    {passoAtual > 1 && (
                      <button 
                        type="button" 
                        onClick={handleVoltarPasso} 
                        className="w-full sm:w-auto px-6 py-5 rounded-[1.5rem] font-black text-slate-500 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:text-slate-700 transition-all flex items-center justify-center gap-2"
                      >
                        <ChevronLeft size={20} /> Voltar
                      </button>
                    )}
                    
                    {passoAtual < passoPagamento ? (
                      <button 
                        type="button" 
                        onClick={handleAvançarPasso} 
                        className="w-full flex-1 py-5 rounded-[1.5rem] font-black text-xl text-white shadow-xl bg-[#00577C] hover:bg-[#004a6b] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                        Avançar <ChevronRight size={24} />
                      </button>
                    ) : (
                      <button 
                        type="submit" 
                        disabled={isSubmitting || loadingPreco || !acomodacaoDisponivel} 
                        className="w-full flex-1 py-5 rounded-[1.5rem] font-black text-xl text-white shadow-xl bg-[#00577C] hover:bg-[#004a6b] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? <><Loader2 className="animate-spin" size={24}/> Processando...</> : loadingPreco ? 'Calculando Valor...' : !acomodacaoDisponivel ? 'Esgotado' : <><Lock size={22}/> Confirmar Reserva</>}
                      </button>
                    )}
                  </div>
                </div>

              </form>
            ) : (
              <SectionCard className="p-8 md:p-16 text-center border-green-100 animate-in zoom-in-95 duration-500">
                 <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} className="text-[#009640]"/></div>
                 <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-4`}>Pedido Criado!</h2>
                 <p className="text-slate-500 mb-10 text-lg">Conclua o pagamento via PIX para garantir sua reserva imediatamente.</p>
                 <div className="w-64 h-64 bg-slate-50 mx-auto rounded-[3rem] p-6 border-4 border-dashed border-slate-200 mb-8 flex items-center justify-center shadow-inner relative">
                    <img src={qrCodeData.link} alt="QR Code" className="w-full h-full mix-blend-multiply relative z-10" />
                 </div>
                 <button onClick={() => {navigator.clipboard.writeText(qrCodeData.texto); alert('Código PIX Copiado!')}} className="w-full py-5 rounded-2xl bg-[#009640] hover:bg-[#007a33] text-white font-black text-lg flex items-center justify-center gap-3 shadow-xl mb-8 transition-colors active:scale-95">
                    <Copy size={20}/> Copiar Código PIX
                 </button>
              </SectionCard>
            )}
          </div>

          {/* ── COLUNA DIREITA (RESUMO DA RESERVA) ── */}
          <aside className="w-full h-fit lg:self-start order-first lg:order-last lg:sticky lg:top-[120px] transition-all">
            <SectionCard>
              <div className="h-2 w-full bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
              <div className="p-6 md:p-8 border-b border-slate-100 text-left bg-slate-50">
                <p className="text-[10px] font-black uppercase text-[#00577C] tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 size={14}/> Resumo da Acomodação</p>
                <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-800 leading-tight`}>{hotel?.nome}</h3>
              </div>

              <div className="p-6 md:p-8 space-y-6 text-left">
                 
                 <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                       <img src={quartoSelecionado?.imagem_url || hotel?.imagem_url} alt="Quarto" className="w-full h-full object-cover"/>
                    </div>
                    <div className="flex-1 pt-1">
                       <p className="text-sm font-black text-slate-800 leading-none mb-1.5 uppercase line-clamp-1">{quartoSelecionado?.nome_quarto || quartoNomeReal}</p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                         {checkinData ? formatarDataExibicao(checkinData) : ''} a {checkoutData ? formatarDataExibicao(checkoutData) : ''}
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
                    {exibirTaxaExtra ? (
                      <>
                        <div className="flex justify-between text-slate-600">
                           <span>Valor Base da Hospedagem</span>
                           <span className="font-bold">{loadingPreco ? '...' : formatarMoeda(valorBaseMatematico)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                           <span>Taxa de Hóspede Adicional</span>
                           <span className="font-bold text-amber-600">{loadingPreco ? '...' : formatarMoeda(taxaHospedeAdicional)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-slate-600">
                           <span>Total por Noite</span>
                           <span className="font-bold">{loadingPreco ? '...' : formatarMoeda(valorTotalReserva / Math.max(1, numNoites) / Math.max(1, quartosParam))}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                           <span>Taxas governamentais</span>
                           <span className="font-bold text-[#009640]">Isento</span>
                        </div>
                      </>
                    )}
                 </div>

                 <div className="pt-8 border-t-2 border-slate-100 flex flex-col gap-4">
                    <p className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#00577C] tabular-nums leading-none`}>
                      {loadingPreco ? 'Calculando...' : formatarMoeda(valorTotalReserva)}
                    </p>
                 </div>
              </div>

              <div className="p-6 md:p-8 bg-[#00577C] text-white flex items-center gap-4">
                 <ShieldAlert size={28} className="text-[#F9C400] shrink-0" />
                 <p className="text-[10px] md:text-xs font-bold text-blue-100 uppercase tracking-wider text-left">Reserva processada pelo sistema integrado da Secretaria de Turismo.</p>
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