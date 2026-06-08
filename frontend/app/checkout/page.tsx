'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, ArrowLeft, ShieldCheck, MapPin, 
  Bed, Compass, Ticket, QrCode, CheckCircle2, 
  User, Mail, FileText, Smartphone, Copy, AlertCircle,
  CreditCard, Home, Clock, Lock, ShieldAlert, ChevronRight, Wallet, Check, CalendarDays, Users, Calendar, Menu, X
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

type Hotel = { id: string; nome: string; quarto_standard_nome: string; quarto_standard_preco: any; quarto_luxo_nome: string; quarto_luxo_preco: any; };
type Guia = { id: string; nome: string; preco_diaria: any; };
type Atracao = { id: string; nome: string; preco_entrada: any; };
type Pacote = { id: string; titulo: string; imagem_principal: string; pacote_itens: { hoteis: Hotel | null; guias: Guia | null; atracoes: Atracao | null; }[]; };

type Acompanhante = {
  nome: string;
  cpf: string;
  data_nascimento: string;
};

// ── UTILITÁRIOS ──
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
const mascaraData = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 10);

function formatarData(dataStr: string | null) {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

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
  )
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
  )
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
          <p className="text-xs md:text-sm font-bold text-slate-500 mt-1">Conclua o pagamento nos próximos minutos para garantir este pacote.</p>
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

// ── NOVAS TIPAGENS PARA O WIZARD ──
type Step = 1 | 2 | 3 | 4;

function CheckoutPacoteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parâmetros da URL
  const pacoteId = searchParams.get('pacote');
  const hotelId = searchParams.get('hotel');
  const quartoTipo = searchParams.get('quarto') as 'standard' | 'luxo' | null;
  const guiaId = searchParams.get('guia');
  const checkinData = searchParams.get('checkin');
  const checkoutData = searchParams.get('checkout');
  const adultosParam = Number(searchParams.get('adultos')) || 2;
  const quartosParam = Number(searchParams.get('quartos')) || 1;
  const precoParam = Number(searchParams.get('preco')) || 0;

  // Estados de Dados
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [hotelSel, setHotelSel] = useState<Hotel | null>(null);
  const [guiaSel, setGuiaSel] = useState<Guia | null>(null);
  const [atracoes, setAtracoes] = useState<Atracao[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // API Railway Valores Dinâmicos
  const [valorHospedagemDin, setValorHospedagemDin] = useState<number>(0);
  const [numNoites, setNumNoites] = useState<number>(1);
  const [loadingPreco, setLoadingPreco] = useState<boolean>(false);
  const [pacoteDisponivel, setPacoteDisponivel] = useState<boolean>(true);

  // Estados do Formulário - Titular
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
  
  // Estado Dinâmico Acompanhantes
  const [hospedesExtras, setHospedesExtras] = useState<Acompanhante[]>([]);

  useEffect(() => {
    const numAcompanhantes = Math.max(0, adultosParam - 1);
    setHospedesExtras(prev => {
      const copy = [...prev];
      if (copy.length === numAcompanhantes) return prev;
      if (copy.length > numAcompanhantes) return copy.slice(0, numAcompanhantes);
      while (copy.length < numAcompanhantes) {
        copy.push({ nome: '', cpf: '', data_nascimento: '' });
      }
      return copy;
    });
  }, [adultosParam]);

  const handleAcompanhanteChange = (index: number, campo: keyof Acompanhante, valor: string) => {
    setHospedesExtras(prev => {
      const novos = [...prev];
      novos[index] = { ...novos[index], [campo]: valor };
      return novos;
    });
  };

  // Estados de Gateway
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

  // ── WIZARD PASSOS ──
  const [passoAtual, setPassoAtual] = useState<Step>(1);
  // Determina os índices dinâmicos dos passos
  const passoFaturacao = 2 + hospedesExtras.length;
  const passoPagamento = 3 + hospedesExtras.length;
  const totalPassos = passoPagamento;

  // ── INJEÇÃO DO SDK PAGSEGURO ──
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

  // Carrega Estrutura Básica do Pacote
  useEffect(() => {
    async function carregarResumo() {
      if (!pacoteId) { router.push('/#pacotes'); return; }
      const { data, error } = await supabase.from('pacotes').select(`id, titulo, imagem_principal, pacote_itens ( hoteis (*), guias (*), atracoes (*) )`).eq('id', pacoteId).single();
      if (error || !data) { router.push('/#pacotes'); return; }
      const pct = data as Pacote;
      setPacote(pct);
      if (hotelId) setHotelSel(pct.pacote_itens.map(i => i.hoteis).find(h => h?.id === hotelId) || null);
      if (guiaId) setGuiaSel(pct.pacote_itens.map(i => i.guias).find(g => g?.id === guiaId) || null);
      setAtracoes(pct.pacote_itens.map(i => i.atracoes).filter(Boolean) as Atracao[]);
      setLoadingInitial(false);
    }
    carregarResumo();
  }, [pacoteId, hotelId, guiaId, router]);

  // Consulta API da Railway para o Preço Dinâmico do Hotel
  useEffect(() => {
    if (!checkinData || !checkoutData) return;

    if (!hotelId) {
      const ci = new Date(checkinData);
      const co = new Date(checkoutData);
      const diff = Math.ceil((co.getTime() - ci.getTime()) / (1000 * 3600 * 24));
      setNumNoites(diff > 0 ? diff : 1);
      return;
    }

    async function obterPrecoDin() {
      setLoadingPreco(true);
      try {
        const response = await fetch(
          `https://sagaturismo-production.up.railway.app/api/v1/public/hoteis/${hotelId}/calcular-preco?tipo_quarto=${quartoTipo || 'standard'}&checkin=${checkinData}&checkout=${checkoutData}&quantidade=${quartosParam}&adultos=${adultosParam}`
        );
        const data = await response.json();
        
        if (data.sucesso) {
          setValorHospedagemDin(data.valor_total);
          setNumNoites(data.noites);
          setPacoteDisponivel(data.disponivel);
          if (!data.disponivel) setErroApi("O hotel esgotou as vagas nestas datas. Regresse e escolha outro período.");
        } else {
          setErroApi(data.detail || "Erro de sincronização com o calendário.");
        }
      } catch (err) {
        console.error("Erro API Railway:", err);
      } finally {
        setLoadingPreco(false);
      }
    }

    obterPrecoDin();
  }, [hotelId, quartoTipo, checkinData, checkoutData, quartosParam, adultosParam]);

  // Totais do Carrinho
  const totalPagamento = precoParam;

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

    setPassoAtual(prev => (prev + 1) as Step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVoltarPasso = () => {
    setErroApi('');
    setPassoAtual(prev => (Math.max(1, prev - 1) as Step));
  };

  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');
    if (!pacoteDisponivel) { setErroApi('Pacote esgotado.'); return; }
    if (cpf.length < 14) { setErroApi('CPF inválido.'); return; }

    for (let i = 0; i < hospedesExtras.length; i++) {
      if (hospedesExtras[i].data_nascimento.length < 10) {
        setErroApi(`Por favor, preencha a data de nascimento completa do Acompanhante #${i + 1}.`);
        return;
      }
    }

    setIsSubmitting(true);

    const acompanhantesFormatados = hospedesExtras.map(h => ({
      nome: h.nome,
      cpf: h.cpf.replace(/\D/g, ''),
      data_nascimento: formatarParaBackend(h.data_nascimento)
    }));

    const payload: any = {
      tipo_item: "pacote",
      pacote_id: pacoteId,
      hotel_id: hotelId || null,
      tipo_quarto: quartoTipo || "standard",
      guia_id: guiaId || null,
      data_checkin: checkinData,
      data_checkout: checkoutData,
      quantidade: quartosParam,
      adultos: adultosParam,
      nome_cliente: nome,
      cpf_cliente: cpf.replace(/\D/g, ''),
      email_cliente: email,
      telefone_cliente: telefone.replace(/\D/g, ''),
      hospedes_extras: acompanhantesFormatados,
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
        if (!window.PagSeguro || typeof window.PagSeguro.encryptCard !== 'function') {
          throw new Error('Sistema de criptografia não carregado. Tente novamente em 2 segundos.');
        }
        
        const key = process.env.NEXT_PUBLIC_PAGBANK_PUBLIC_KEY;
        if (!key) throw new Error('Chave pública não localizada.');

        const result = window.PagSeguro.encryptCard({
          publicKey: key,
          holder: nomeCartao, 
          number: numeroCartao.replace(/\D/g,''),
          expMonth: mesCartao, 
          expYear: anoCartao, 
          securityCode: cvvCartao
        });
        
        if (result.hasErrors) throw new Error('Dados do cartão rejeitados pelo sistema antifraude.');
        
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
          setQrCodeData({ link: data.pix_qrcode_img, texto: data.pix_copia_cola, id_pedido: data.codigo_pedido });
        } else {
          router.push(`/sucesso?pedido=${data.codigo_pedido}`);
        }
      } else {
        setErroApi(data.detail || data.mensagem || 'Rejeitado pela operadora.');
      }
    } catch (err: any) { setErroApi(err.message); } finally { setIsSubmitting(false); }
  };

  if (loadingInitial) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-[#00577C]" size={40} /></div>;

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-20`}>

      {/* ── HEADER ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Rotas','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
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
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas</Link>
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* ── BREADCRUMB DINÂMICO (SLIDER INDICADOR) ── */}
      <div className="bg-white border-b border-slate-200">
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
          
          {/* ── COLUNA ESQUERDA: WIZARD (SLIDER) ── */}
          <div className="w-full min-w-0">
            <div className="overflow-hidden w-full relative">
              <div className="flex transition-transform duration-500 ease-in-out items-start" style={{ transform: `translateX(-${(passoAtual - 1) * 100}%)` }}>
                
                {/* PASSO 1: IDENTIFICAÇÃO (TITULAR) */}
                <div className={`w-full shrink-0 px-[2px] transition-all duration-500 ${passoAtual === 1 ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden pointer-events-none'}`}>
                  <SectionCard className="p-6 md:p-10 text-left h-full">
                    <SectionHeader step={1} title="Dados do Titular" icon={<Users size={20} />} />
                    <div className="space-y-4">
                      <p className="text-xs font-black text-[#00577C] uppercase tracking-wider mb-2">Hóspede Principal</p>
                      <div className="grid gap-5 md:gap-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nome Completo *</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input required value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="Nome completo do titular" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">CPF *</label>
                          <div className="relative">
                            <FileText className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input required value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} maxLength={14} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="000.000.000-00" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">WhatsApp *</label>
                          <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input required value={telefone} onChange={e => setTelefone(mascaraTelefone(e.target.value))} maxLength={15} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="(99) 99999-9999" />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">E-mail *</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="seu@email.com" />
                          </div>
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
                        <SectionHeader step={passoDoAcompanhante} title={`Acompanhante #${i + 1}`} icon={<Users size={20} />} />
                        <div className="space-y-4">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Obrigatório para homologação nominal da estadia junto aos parceiros hoteleiros.</p>
                          <div className="grid gap-5 md:gap-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nome Completo *</label>
                              <input required value={h.nome} onChange={e => handleAcompanhanteChange(i, 'nome', e.target.value.toUpperCase())} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="Nome completo do acompanhante" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">CPF *</label>
                              <input required value={h.cpf} onChange={e => handleAcompanhanteChange(i, 'cpf', mascaraCPF(e.target.value))} maxLength={14} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="000.000.000-00" />
                            </div>
                            <div className="relative">
                              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Data Nasc. *</label>
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
                    <SectionHeader step={passoFaturacao} title="Endereço de Faturação" icon={<Home size={20} />} />
                    <div className="grid gap-5 md:gap-6 sm:grid-cols-2">
                      <div className="sm:col-span-2 grid grid-cols-[1fr_100px] gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Rua / Avenida *</label>
                          <input required value={rua} onChange={e => setRua(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Número *</label>
                          <input required value={numero} onChange={e => setNumero(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#00577C] focus:bg-white transition-colors" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Bairro *</label>
                        <input required value={bairro} onChange={e => setBairro(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">CEP *</label>
                        <input required value={cep} onChange={e => setCep(mascaraCEP(e.target.value))} maxLength={9} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Cidade *</label>
                        <input required value={cidade} onChange={e => setCidade(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Estado (UF) *</label>
                        <input required value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} maxLength={2} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#00577C] focus:bg-white transition-colors" />
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* PASSO: PAGAMENTO */}
                <div className={`w-full shrink-0 px-[2px] transition-all duration-500 ${passoAtual === passoPagamento ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden pointer-events-none'}`}>
                  <SectionCard className="p-6 md:p-10 text-left h-full">
                    <SectionHeader step={passoPagamento} title="Método de Pagamento" icon={<Wallet size={20} />} />
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <button type="button" onClick={() => setMetodoPagamento('pix')} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${metodoPagamento === 'pix' ? 'border-[#009640] bg-green-50 text-[#009640]' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
                        <QrCode size={32} /> <span className="text-[10px] font-black uppercase tracking-widest">PIX Rápido</span>
                      </button>
                      <button type="button" onClick={() => setMetodoPagamento('cartao')} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${metodoPagamento === 'cartao' ? 'border-[#00577C] bg-[#00577C]/5 text-[#00577C]' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
                        <CreditCard size={32} /> <span className="text-[10px] font-black uppercase tracking-widest">Cartão Crédito</span>
                      </button>
                    </div>

                    {metodoPagamento === 'cartao' && (
                      <div className="space-y-5 bg-white border-2 border-[#00577C]/10 p-6 md:p-8 rounded-[2rem] shadow-inner mb-8">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nome Impresso no Cartão *</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input required value={nomeCartao} onChange={e => setNomeCartao(e.target.value.toUpperCase())} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors uppercase" placeholder="NOME COMO NO CARTÃO" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Número do Cartão *</label>
                          <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input required value={numeroCartao} onChange={e => setNumeroCartao(mascaraCartao(e.target.value))} maxLength={19} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors tabular-nums tracking-widest" placeholder="0000 0000 0000 0000" />
                          </div>
                        </div>
                        <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-3">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Mês *</label>
                            <input required value={mesCartao} maxLength={2} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-2 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="MM" onChange={e => setMesCartao(e.target.value.replace(/\D/g,''))} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Ano *</label>
                            <input required value={anoCartao} maxLength={4} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-2 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="AAAA" onChange={e => setAnoCartao(e.target.value.replace(/\D/g,''))} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">CVV *</label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                              <input required type="password" value={cvvCartao} maxLength={4} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 pl-11 pr-4 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#00577C] focus:bg-white transition-colors" placeholder="CVV" onChange={e => setCvvCartao(e.target.value.replace(/\D/g,''))} />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Opção de Parcelamento *</label>
                          <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-colors cursor-pointer">
                            {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}x de {formatarMoeda(totalPagamento/(i+1))} {!i && ' (À Vista)'}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {erroApi && (
                      <div className="mb-8 p-5 bg-red-50 text-red-700 rounded-2xl font-bold text-sm flex items-center gap-3 border border-red-100 animate-in shake">
                         <AlertCircle size={24} className="shrink-0"/> {erroApi}
                      </div>
                    )}
                    
                    <button type="submit" disabled={isSubmitting || loadingPreco || !pacoteDisponivel} className="w-full py-6 rounded-[1.5rem] font-black text-xl text-white shadow-xl bg-[#00577C] hover:bg-[#004a6b] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed">
                      {isSubmitting ? <><Loader2 className="animate-spin" size={24}/> Processando...</> : loadingPreco ? 'A Sincronizar Calendário...' : !pacoteDisponivel ? 'Esgotado' : <><Lock size={22}/> Confirmar Reserva Segura</>}
                    </button>
                  </SectionCard>
                </div>

              </div>
            </div>

            {/* Botões de navegação (fora do slider, abaixo) */}
            <div className="mt-6 space-y-4 w-full">
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
                  // Botão de pagamento já está dentro do passo de pagamento – este bloco será usado apenas se o passo atual não for o pagamento? Não, o botão de submit está dentro do passo de pagamento. Mas para manter o fluxo, deixamos aqui apenas um placeholder.
                  // Na verdade, no passo de pagamento já existe o botão de submit. O botão "Avançar" não aparece quando passoAtual === passoPagamento porque o passo de pagamento já tem o botão. Este trecho só é usado quando passoAtual < passoPagamento.
                  <></>
                )}
              </div>
            </div>

          </div>

          {/* ── COLUNA DIREITA: RESUMO (INALTERADA) ── */}
          <aside className="w-full h-fit lg:self-start order-first lg:order-last relative space-y-6">
            <SectionCard>
              <div className="h-2 w-full bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
              <div className="p-6 md:p-8 border-b border-slate-100 text-left bg-slate-50">
                <p className="text-[10px] font-black uppercase text-[#00577C] tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 size={14}/> Resumo da Reserva</p>
                <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 leading-tight`}>{pacote?.titulo}</h3>
              </div>

              <div className="p-6 md:p-8 space-y-6 text-left">
                 {checkinData && checkoutData && (
                    <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                         <CalendarDays size={20} className="text-slate-500"/>
                       </div>
                       <div className="flex-1 pt-1">
                          <p className="text-sm font-black text-slate-800 leading-none mb-1.5">{formatarData(checkinData)} a {formatarData(checkoutData)}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{numNoites} Noite(s)</p>
                       </div>
                    </div>
                 )}
                 {hotelSel && (
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                         <Bed size={20} className="text-[#00577C]"/>
                       </div>
                       <div className="flex-1 pt-1">
                          <p className="text-sm font-black text-slate-800 leading-none mb-1.5">{hotelSel.nome}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{quartoTipo === 'luxo' ? hotelSel.quarto_luxo_nome : hotelSel.quarto_standard_nome}</p>
                       </div>
                    </div>
                 )}
                 {guiaSel && (
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                         <Compass size={20} className="text-[#009640]"/>
                       </div>
                       <div className="flex-1 pt-1.5">
                          <p className="text-sm font-black text-slate-800 leading-none">Guia Oficial: {guiaSel.nome}</p>
                       </div>
                    </div>
                 )}
                 {atracoes.length > 0 && (
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0">
                         <Ticket size={20} className="text-[#d9a000]"/>
                       </div>
                       <div className="flex-1 pt-1.5">
                          <p className="text-sm font-black text-slate-800 line-clamp-1">{atracoes.length} Atrações Inclusas</p>
                       </div>
                    </div>
                 )}
                 
                 <div className="pt-4 border-t border-dashed border-slate-200 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                       <span>Taxas Municipais</span>
                       <span className="font-bold text-[#009640]">Isento</span>
                    </div>
                 </div>

                 <div className="pt-8 border-t-2 border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Total do Pacote</p>
                       <div className="bg-green-50 px-3 py-1 rounded-full flex items-center gap-1.5 text-[#009640] text-[10px] font-black uppercase">
                          <Check size={12} strokeWidth={3}/> Sincronizado
                       </div>
                    </div>
                    <p className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#00577C] tabular-nums leading-none`}>
                      {loadingPreco ? '...' : formatarMoeda(totalPagamento)}
                    </p>
                 </div>
              </div>

              <div className="p-6 md:p-8 bg-[#00577C] text-white flex items-center gap-4">
                 <ShieldAlert size={28} className="text-[#F9C400] shrink-0" />
                 <p className="text-[10px] md:text-xs font-bold text-blue-100 uppercase tracking-wider leading-relaxed text-left">Este é um roteiro oficial gerido e garantido pela Secretaria de Turismo de São Geraldo do Araguaia.</p>
              </div>
            </SectionCard>
          </aside>

        </div>
      </div>
    </main>
  );
}

export default function CheckoutPacotePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]"><Loader2 className="animate-spin text-[#00577C] w-12 h-12" /></div>}>
      <CheckoutPacoteContent />
    </Suspense>
  );
}