'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, ArrowLeft, ShieldCheck, MapPin, 
  Bed, Compass, Ticket, QrCode, CheckCircle2, 
  User, Mail, FileText, Smartphone, Copy, AlertCircle,
  CreditCard, Home, Clock, Lock, ShieldAlert, ChevronRight, Wallet, Check
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
const mascaraCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
const mascaraCartao = (v: string) => v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
const mascaraTelefone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})/, '$1-$2').slice(0, 15);
const mascaraCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);

function formatarData(dataStr: string | null) {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

// ─── COMPONENTES UI ───

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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0085FF] text-white text-sm font-black shadow-md">
        {step}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[#0085FF] bg-blue-50 p-2 rounded-xl hidden sm:block">{icon}</span>
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
          <p className="font-black text-base text-[#0085FF] flex items-center gap-2">
             <ShieldCheck size={18} className="text-[#009640]"/> Disponibilidade Garantida
          </p>
          <p className="text-xs md:text-sm font-bold text-slate-500 mt-1">Conclua o pagamento nos próximos minutos para garantir este pacote.</p>
        </div>
        <div className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 shadow-sm border border-blue-100 w-fit">
          <Clock size={18} className="text-[#0085FF] animate-pulse" />
          <span className="text-xl md:text-2xl font-black text-[#0085FF] tabular-nums">{String(min).padStart(2, "0")}:{String(seg).padStart(2, "0")}</span>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-200">
        <div className="h-full bg-[#0085FF] transition-all duration-1000 ease-linear" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

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

  // Estados de Dados
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [hotelSel, setHotelSel] = useState<Hotel | null>(null);
  const [guiaSel, setGuiaSel] = useState<Guia | null>(null);
  const [atracoes, setAtracoes] = useState<Atracao[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // API Railway Valores Dinâmicos
  const [valorHospedagemDin, setValorHospedagemDin] = useState<number>(0);
  const [numNoites, setNumNoites] = useState<number>(1);
  const [loadingPreco, setLoadingPreco] = useState<boolean>(false);
  const [pacoteDisponivel, setPacoteDisponivel] = useState<boolean>(true);

  // Estados do Formulário
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

  // ── INJEÇÃO SILENCIOSA DO PAGBANK SDK ──
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
      // Se não tem hotel no pacote, calcula apenas a diferença de noites matematicamente
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
          `https://sagaturismo-production.up.railway.app/api/v1/public/hoteis/${hotelId}/calcular-preco?tipo_quarto=${quartoTipo || 'standard'}&checkin=${checkinData}&checkout=${checkoutData}&quantidade=${quartosParam}`
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
  }, [hotelId, quartoTipo, checkinData, checkoutData, quartosParam]);

  // Totais do Carrinho
  const precoGuia = guiaSel ? parseValor(guiaSel.preco_diaria) * (numNoites + 1) : 0;
  const precoAtracoes = atracoes.reduce((acc, curr) => acc + parseValor(curr.preco_entrada), 0) * adultosParam;
  const totalPagamento = valorHospedagemDin + precoGuia + precoAtracoes;

  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');
    if (!pacoteDisponivel) { setErroApi('Pacote esgotado.'); return; }
    if (cpf.length < 14) { setErroApi('CPF inválido.'); return; }
    setIsSubmitting(true);

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

  if (loadingInitial) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-[#0085FF]" size={40} /></div>;

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-20`}>

      {/* HEADER */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5 text-left">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-28 md:h-12 md:w-36 lg:h-16 lg:w-56 shrink-0"><Image src="/logop.png" alt="SagaTurismo" fill priority className="object-contain object-left" /></div>
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

      {/* PROGRESS BAR ESTILO PREMIUM */}
      <div className="bg-white border-b border-slate-200 mt-[65px] md:mt-[80px]">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 md:py-5">
          <div className="flex items-center justify-center md:justify-start gap-2 md:gap-4 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
            <span className="hidden sm:inline-block">Pacote</span> <ChevronRight size={14} className="hidden sm:inline-block"/> 
            <span>Escolha</span> <ChevronRight size={14}/> 
            <span className="text-[#0085FF] bg-blue-50 px-3 py-1.5 rounded-full flex items-center gap-2"><Lock size={12}/> Pagamento</span> <ChevronRight size={14}/> 
            <span>Sucesso</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
        <BarraTempoReserva />

        <div className="grid gap-8 lg:grid-cols-[1fr_400px] items-start">
          
          {/* COLUNA ESQUERDA */}
          <div className="space-y-6 md:space-y-8">
            
            {/* CARD DO PACOTE (Topo da Esquerda) */}
            <SectionCard>
               <div className="flex flex-col md:flex-row h-full">
                  <div className="relative h-56 md:h-auto md:w-72 shrink-0 overflow-hidden bg-slate-100">
                    {pacote?.imagem_principal && <img src={pacote.imagem_principal} alt={pacote.titulo} className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-6 md:p-8 flex flex-col justify-center text-left">
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#009640] mb-3 md:mb-4 bg-green-50 border border-green-100 w-fit px-3 py-1.5 rounded-lg shadow-sm">
                        <ShieldCheck size={14}/> Pacote Oficial Autorizado
                     </div>
                     <h2 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 mb-3 leading-tight`}>{pacote?.titulo}</h2>
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
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nome Completo (Conforme Documento) *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input required value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white hover:border-slate-200 transition-all" placeholder="Nome do responsável pela reserva" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">CPF *</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input required value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} maxLength={14} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white hover:border-slate-200 transition-all" placeholder="000.000.000-00" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Telemóvel / WhatsApp *</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input required value={telefone} onChange={e => setTelefone(mascaraTelefone(e.target.value))} maxLength={15} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white hover:border-slate-200 transition-all" placeholder="(99) 99999-9999" />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">E-mail para Receber o Voucher *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white hover:border-slate-200 transition-all" placeholder="seu@email.com" />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* 2. ENDEREÇO (PAGBANK REQUISITO) */}
                <SectionCard className="p-6 md:p-10 text-left">
                  <SectionHeader step={2} title="Endereço de Faturação" icon={<Home size={20} />} />
                  <div className="grid gap-5 md:gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2 grid grid-cols-[1fr_100px] gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Morada *</label>
                        <input required value={rua} onChange={e => setRua(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white transition-all" placeholder="Rua / Avenida" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nº *</label>
                        <input required value={numero} onChange={e => setNumero(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#0085FF] focus:bg-white transition-all" placeholder="Nº" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Bairro *</label>
                      <input required value={bairro} onChange={e => setBairro(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white transition-all" placeholder="Bairro" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">CEP *</label>
                      <input required value={cep} onChange={e => setCep(mascaraCEP(e.target.value))} maxLength={9} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white transition-all" placeholder="00000-000" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Cidade *</label>
                      <input required value={cidade} onChange={e => setCidade(e.target.value)} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white transition-all" placeholder="Sua Cidade" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Estado (UF) *</label>
                      <input required value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} maxLength={2} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#0085FF] focus:bg-white transition-all" placeholder="EX: PA" />
                    </div>
                  </div>
                </SectionCard>

                {/* 3. PAGAMENTO */}
                <SectionCard className="p-6 md:p-10 text-left">
                  <SectionHeader step={3} title="Método de Pagamento" icon={<Wallet size={20} />} />
                  
                  {/* SELETORES DE PAGAMENTO */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button type="button" onClick={() => setMetodoPagamento('pix')} className={`flex flex-col items-center justify-center gap-3 p-5 md:p-6 rounded-2xl border-2 transition-all ${metodoPagamento === 'pix' ? 'border-[#009640] bg-[#009640]/5 text-[#009640] shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
                      <QrCode size={32} /> <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">PIX Rápido</span>
                    </button>
                    <button type="button" onClick={() => setMetodoPagamento('cartao')} className={`flex flex-col items-center justify-center gap-3 p-5 md:p-6 rounded-2xl border-2 transition-all ${metodoPagamento === 'cartao' ? 'border-[#0085FF] bg-blue-50/50 text-[#0085FF] shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
                      <CreditCard size={32} /> <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Cartão de Crédito</span>
                    </button>
                  </div>

                  {/* FORMULÁRIO DE CARTÃO REDESENHADO */}
                  {metodoPagamento === 'cartao' && (
                    <div className="space-y-5 bg-white border-2 border-[#0085FF]/10 p-6 md:p-8 rounded-[2rem] shadow-inner mb-8 animate-in slide-in-from-top-4 duration-300">
                      
                      {/* Nome no Cartão */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nome Impresso no Cartão *</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                          <input required value={nomeCartao} onChange={e => setNomeCartao(e.target.value.toUpperCase())} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white hover:border-slate-200 transition-all uppercase" placeholder="JOAO S SANTOS" />
                        </div>
                      </div>

                      {/* Número do Cartão */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Número do Cartão *</label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                          <input required value={numeroCartao} onChange={e => setNumeroCartao(mascaraCartao(e.target.value))} maxLength={19} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white hover:border-slate-200 transition-all tabular-nums tracking-widest" placeholder="0000 0000 0000 0000" />
                        </div>
                      </div>

                      {/* Validade e CVV */}
                      <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-3 md:gap-4">
                        <div>
                          <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Mês *</label>
                          <input required value={mesCartao} maxLength={2} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-2 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#0085FF] focus:bg-white transition-all tabular-nums" placeholder="MM" onChange={e => setMesCartao(e.target.value.replace(/\D/g,''))} />
                        </div>
                        <div>
                          <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Ano *</label>
                          <input required value={anoCartao} maxLength={4} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-2 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#0085FF] focus:bg-white transition-all tabular-nums" placeholder="AAAA" onChange={e => setAnoCartao(e.target.value.replace(/\D/g,''))} />
                        </div>
                        <div>
                          <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Cód. Segurança *</label>
                          <div className="relative">
                            <Lock className="absolute left-3 md:left-4 top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-y-1/2 text-slate-400" />
                            <input required type="password" value={cvvCartao} maxLength={4} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 pl-9 pr-2 md:pl-11 md:pr-4 py-4 text-sm font-bold text-slate-800 text-center outline-none focus:border-[#0085FF] focus:bg-white transition-all tabular-nums tracking-widest" placeholder="CVV" onChange={e => setCvvCartao(e.target.value.replace(/\D/g,''))} />
                          </div>
                        </div>
                      </div>

                      {/* Parcelas */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Opção de Parcelamento *</label>
                        <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0085FF] focus:bg-white transition-all cursor-pointer appearance-none">
                          {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}x de {formatarMoeda(totalPagamento/(i+1))} {!i && ' (À Vista)'}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* ERRO API */}
                  {erroApi && (
                    <div className="mb-8 p-5 bg-red-50 text-red-700 rounded-2xl font-bold text-sm flex items-center gap-3 border border-red-100 animate-in shake duration-500 shadow-sm">
                       <AlertCircle size={24} className="shrink-0"/> {erroApi}
                    </div>
                  )}
                  
                  {/* BOTÃO FINALIZAR */}
                  <button type="submit" disabled={isSubmitting || loadingPreco || !pacoteDisponivel} className="w-full py-6 md:py-7 rounded-[1.5rem] font-black text-lg md:text-xl text-white shadow-xl bg-slate-900 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed">
                    {isSubmitting ? <><Loader2 className="animate-spin" size={24}/> Processando Pagamento...</> : loadingPreco ? 'A Sincronizar Calendário...' : !pacoteDisponivel ? 'Esgotado' : <><Lock size={22}/> Confirmar Reserva Segura</>}
                  </button>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-4 opacity-50 grayscale">
                     <img src="/logop.png" className="h-6" alt="SGA" />
                     <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-800">PagBank</span>
                     <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                     <ShieldCheck size={18} className="text-slate-800" />
                  </div>
                </SectionCard>
              </form>
            ) : (
              /* TELA PIX AGUARDANDO */
              <SectionCard className="p-8 md:p-16 text-center border-green-100">
                 <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} className="text-[#009640]"/></div>
                 <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-4`}>Pedido Criado!</h2>
                 <p className="text-slate-500 mb-10 text-lg">Conclua o pagamento via PIX para emitir o seu voucher oficial da viagem imediatamente.</p>
                 
                 <div className="w-64 h-64 bg-slate-50 mx-auto rounded-[3rem] p-6 border-4 border-dashed border-slate-200 mb-8 flex items-center justify-center shadow-inner relative overflow-hidden">
                    <img src={qrCodeData.link} alt="QR Code" className="w-full h-full mix-blend-multiply relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#009640]/5 to-transparent animate-scan z-0" />
                 </div>
                 
                 <button onClick={() => {navigator.clipboard.writeText(qrCodeData.texto); alert('Código PIX Copiado para a área de transferência!')}} className="w-full py-5 rounded-2xl bg-[#009640] hover:bg-[#007a33] text-white font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all mb-8">
                    <Copy size={20}/> Copiar Código PIX
                 </button>
                 
                 <div className="bg-slate-50 rounded-2xl p-6 text-center">
                    <p className="text-xs text-slate-500 font-bold flex items-center justify-center gap-2 mb-2"><Loader2 className="animate-spin" size={16}/> Aguardando o banco confirmar o pagamento...</p>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Esta página será atualizada automaticamente</p>
                 </div>
              </SectionCard>
            )}
          </div>

          {/* ── COLUNA DIREITA: RESUMO PROFISSIONAL (ESTÁTICO) ── */}
          <aside className="w-full h-fit lg:self-start order-first lg:order-last relative">
            <SectionCard>
              <div className="h-2 w-full bg-gradient-to-r from-[#0085FF] via-[#F9C400] to-[#009640]" />
              <div className="p-6 md:p-8 border-b border-slate-100 text-left bg-slate-50">
                <p className="text-[10px] font-black uppercase text-[#0085FF] tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 size={14}/> Resumo da Reserva</p>
                <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 leading-tight`}>{pacote?.titulo}</h3>
              </div>

              <div className="p-6 md:p-8 space-y-6 text-left">
                 {/* Itens do Pacote */}
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
                         <Bed size={20} className="text-[#0085FF]"/>
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
                 
                 {/* Divisor Preço */}
                 <div className="pt-8 border-t-2 border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Total</p>
                       <div className="bg-green-50 px-3 py-1 rounded-full flex items-center gap-1.5 text-[#009640] text-[10px] font-black uppercase">
                          <Check size={12} strokeWidth={3}/> Sem Taxas Extras
                       </div>
                    </div>
                    <p className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#0085FF] tabular-nums leading-none`}>
                      {loadingPreco ? '...' : formatarMoeda(totalPagamento)}
                    </p>
                 </div>
              </div>

              <div className="p-6 md:p-8 bg-[#0085FF] text-white flex items-center gap-4">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]"><Loader2 className="animate-spin text-[#0085FF] w-12 h-12" /></div>}>
      <CheckoutPacoteContent />
    </Suspense>
  );
}