'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { 
  Loader2, ArrowLeft, ShieldCheck, MapPin, 
  Bed, QrCode, CheckCircle2, User, Mail, FileText, 
  Smartphone, Copy, AlertCircle, CreditCard, 
  Calendar, Home, Clock, Lock, ShieldAlert, Menu, Info,
  ChevronRight, Wallet, Check
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS ──
declare global {
  interface Window {
    PagSeguro?: {
      encryptCard: (params: any) => { encryptedCard?: string; hasErrors?: boolean; errors?: any[] };
    };
  }
}

type Hotel = { 
  id: string; nome: string; imagem_url: string;
  quarto_standard_nome: string; quarto_standard_preco: any; 
  quarto_luxo_nome: string; quarto_luxo_preco: any; 
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
  return Math.ceil(diff / (1000 * 3600 * 24)) || 1;
};

// ─── COMPONENTES UI ESTILO NOVO ───

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

function SectionHeader({ step, title, icon }: { step: number; title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#00577C] text-white text-xs font-black">
        {step}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[#00577C]">{icon}</span>
        <h2 className={`${jakarta.className} text-lg font-black text-slate-900 tracking-tight`}>{title}</h2>
      </div>
    </div>
  )
}

function BarraTempoReserva() {
  const [segundos, setSegundos] = useState(900); // 15 min
  useEffect(() => {
    const id = setInterval(() => setSegundos(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  const percent = (segundos / 900) * 100;

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/50 shadow-sm">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-black text-sm text-[#00577C]">Disponibilidade garantida por {min} minutos</p>
          <p className="text-xs font-medium text-slate-500 mt-1">Conclua o pagamento para garantir o seu quarto no hotel.</p>
        </div>
        <div className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm border border-blue-100">
          <Clock size={16} className="text-[#00577C]" />
          <span className="text-xl font-black text-[#00577C] tabular-nums">{String(min).padStart(2, "0")}:{String(seg).padStart(2, "0")}</span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-slate-200">
        <div className="h-full bg-[#00577C] transition-all duration-1000 ease-linear" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function CheckoutHotelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parâmetros e Estados
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
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');
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

  useEffect(() => {
    async function carregarHotel() {
      if (!hotelId) return;
      const { data, error } = await supabase.from('hoteis').select('*').eq('id', hotelId).single();
      if (!error && data) setHotel(data as Hotel);
      setLoadingInitial(false);
    }
    carregarHotel();
  }, [hotelId]);

  const numNoites = calcularNoites(checkinData, checkoutData);
  const precoDiaria = hotel ? (quartoTipo === 'luxo' ? parseValor(hotel.quarto_luxo_preco) : parseValor(hotel.quarto_standard_preco)) : 0;
  const valorTotalReserva = precoDiaria * numNoites * quartosParam;

  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');
    if (cpf.length < 14) { setErroApi('CPF inválido.'); return; }
    setIsSubmitting(true);

    const payload: any = {
      tipo_item: "hotel", hotel_id: hotelId, tipo_quarto: quartoTipo, 
      data_checkin: checkinData, data_checkout: checkoutData,
      adultos: adultosParam, quartos: quartosParam,
      nome_cliente: nome, cpf_cliente: cpf.replace(/\D/g, ''), email_cliente: email,
      telefone_cliente: telefone.replace(/\D/g, ''), valor_total: valorTotalReserva,
      endereco_faturacao: `${rua}, ${numero}, ${bairro}, ${cidade}-${estado}, ${cep}`
    };

    try {
      if (metodoPagamento === 'cartao') {
        if (!window.PagSeguro) throw new Error('PagSeguro não carregado.');
        const result = window.PagSeguro.encryptCard({
          publicKey: process.env.NEXT_PUBLIC_PAGBANK_PUBLIC_KEY,
          holder: nomeCartao, number: numeroCartao.replace(/\D/g,''),
          expMonth: mesCartao, expYear: anoCartao, securityCode: cvvCartao
        });
        if (result.hasErrors) throw new Error('Dados do cartão inválidos.');
        payload.metodo_pagamento = 'cartao';
        payload.encrypted_card = result.encryptedCard;
        payload.parcelas = parcelas;
      } else {
        payload.metodo_pagamento = 'pix';
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/pagamentos/processar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.sucesso) {
        if (metodoPagamento === 'pix') {
          setQrCodeData({ link: data.qr_code_link, texto: data.qr_code_text, id_pedido: data.codigo_pedido });
        } else {
          router.push(`/sucesso?pedido=${data.codigo_pedido}`);
        }
      } else {
        setErroApi(data.mensagem || 'Ocorreu um erro no processamento.');
      }
    } catch (err: any) { setErroApi(err.message); } finally { setIsSubmitting(false); }
  };

  if (loadingInitial) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-[#00577C]" size={40} /></div>;

  return (
    <main className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 pb-20`}>
      <Script src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js" strategy="afterInteractive" />

      {/* HEADER */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5 text-left">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56"><Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" /></div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          <Link href="/cadastro" className="hidden sm:block rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão Residente</Link>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="bg-white border-b border-slate-100 mt-[80px] sm:mt-[90px]">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-slate-400">
            <span>Hotel</span> <ChevronRight size={12}/> <span>Escolha</span> <ChevronRight size={12}/> <span className="text-[#00577C]">Pagamento Seguro</span> <ChevronRight size={12}/> <span>Sucesso</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
        <BarraTempoReserva />

        <div className="grid gap-8 lg:grid-cols-[1fr_400px] items-start">
          
          {/* COLUNA ESQUERDA */}
          <div className="space-y-6">
            
            {/* CARD DO HOTEL (No topo da esquerda como pedido) */}
            <SectionCard>
               <div className="flex flex-col md:flex-row">
                  <div className="relative h-48 md:h-auto md:w-64 shrink-0 overflow-hidden">
                    <img src={hotel?.imagem_url} alt={hotel?.nome} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-6 flex flex-col justify-center text-left">
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#009640] mb-2 bg-green-50 w-fit px-2 py-1 rounded">
                        <ShieldCheck size={12}/> Alojamento Oficial SGA
                     </div>
                     <h2 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-2`}>{hotel?.nome}</h2>
                     <p className="text-slate-500 flex items-center gap-2 text-sm font-bold"><MapPin size={16} className="text-red-400"/> São Geraldo do Araguaia - PA</p>
                  </div>
               </div>
            </SectionCard>

            {!qrCodeData ? (
              <form onSubmit={handlePagamento} className="space-y-6">
                
                {/* 1. DADOS DO HÓSPEDE */}
                <SectionCard className="p-8 text-left">
                  <SectionHeader step={1} title="Hóspede Principal" icon={<User size={18} />} />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nome Completo</label>
                      <input required value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-all" placeholder="Como no documento" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">CPF</label>
                      <input required value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} maxLength={14} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-[#00577C] focus:bg-white transition-all" placeholder="000.000.000-00" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">WhatsApp</label>
                      <input required value={telefone} onChange={e => setTelefone(mascaraTelefone(e.target.value))} maxLength={15} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-[#00577C] focus:bg-white transition-all" placeholder="(99) 99999-9999" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-mail para o Voucher</label>
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-[#00577C] focus:bg-white transition-all" placeholder="exemplo@email.com" />
                    </div>
                  </div>
                </SectionCard>

                {/* 2. ENDEREÇO */}
                <SectionCard className="p-8 text-left">
                  <SectionHeader step={2} title="Endereço de Registo" icon={<Home size={18} />} />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2 grid grid-cols-[1fr_100px] gap-4">
                      <input required value={rua} onChange={e => setRua(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold" placeholder="Rua / Avenida" />
                      <input required value={numero} onChange={e => setNumero(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-center" placeholder="Nº" />
                    </div>
                    <input required value={bairro} onChange={e => setBairro(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold" placeholder="Bairro" />
                    <input required value={cep} onChange={e => setCep(mascaraCEP(e.target.value))} maxLength={9} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold" placeholder="CEP" />
                    <input required value={cidade} onChange={e => setCidade(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold" placeholder="Cidade" />
                    <input required value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} maxLength={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-center" placeholder="UF" />
                  </div>
                </SectionCard>

                {/* 3. FORMA DE PAGAMENTO */}
                <SectionCard className="p-8 text-left">
                  <SectionHeader step={3} title="Método de Pagamento" icon={<Wallet size={18} />} />
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button type="button" onClick={() => setMetodoPagamento('pix')} className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${metodoPagamento === 'pix' ? 'border-[#009640] bg-green-50 text-[#009640]' : 'border-slate-100 text-slate-400'}`}>
                      <QrCode size={32} /> <span className="text-xs font-black uppercase">PIX Oficial</span>
                    </button>
                    <button type="button" onClick={() => setMetodoPagamento('cartao')} className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${metodoPagamento === 'cartao' ? 'border-[#00577C] bg-blue-50 text-[#00577C]' : 'border-slate-100 text-slate-400'}`}>
                      <CreditCard size={32} /> <span className="text-xs font-black uppercase">Cartão de Crédito</span>
                    </button>
                  </div>

                  {metodoPagamento === 'cartao' && (
                    <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6">
                      <input required value={nomeCartao} onChange={e => setNomeCartao(e.target.value.toUpperCase())} className="w-full p-4 rounded-xl font-bold border border-slate-200" placeholder="NOME NO CARTÃO" />
                      <input required value={numeroCartao} onChange={e => setNumeroCartao(mascaraCartao(e.target.value))} maxLength={19} className="w-full p-4 rounded-xl font-bold border border-slate-200" placeholder="0000 0000 0000 0000" />
                      <div className="grid grid-cols-3 gap-3">
                        <input required value={mesCartao} maxLength={2} className="p-4 rounded-xl border border-slate-200 text-center font-bold" placeholder="Mês" onChange={e => setMesCartao(e.target.value.replace(/\D/g,''))} />
                        <input required value={anoCartao} maxLength={4} className="p-4 rounded-xl border border-slate-200 text-center font-bold" placeholder="Ano" onChange={e => setAnoCartao(e.target.value.replace(/\D/g,''))} />
                        <input required type="password" value={cvvCartao} maxLength={4} className="p-4 rounded-xl border border-slate-200 text-center font-bold" placeholder="CVV" onChange={e => setCvvCartao(e.target.value.replace(/\D/g,''))} />
                      </div>
                      <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} className="w-full p-4 rounded-xl border border-slate-200 font-bold">
                        {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}x de {formatarMoeda(valorTotalReserva/(i+1))}</option>)}
                      </select>
                    </div>
                  )}

                  {erroApi && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm flex gap-2"><AlertCircle size={18}/> {erroApi}</div>}
                  
                  <button type="submit" disabled={isSubmitting} className="w-full py-5 rounded-2xl font-black text-xl text-white shadow-xl bg-slate-900 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                    {isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <><Lock size={20}/> Finalizar Reserva</>}
                  </button>
                </SectionCard>
              </form>
            ) : (
              /* TELA PIX AGUARDANDO */
              <SectionCard className="p-12 text-center">
                 <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} className="text-[#009640]"/></div>
                 <h2 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-4`}>Aguardando Pagamento</h2>
                 <p className="text-slate-500 mb-10">Escaneie o código PIX abaixo para confirmar sua reserva.</p>
                 <div className="w-64 h-64 bg-slate-50 mx-auto rounded-3xl p-6 border-4 border-dashed border-slate-200 mb-8"><img src={qrCodeData.link} alt="QR" className="w-full h-full mix-blend-multiply" /></div>
                 <button onClick={() => {navigator.clipboard.writeText(qrCodeData.texto); alert('Código copiado!')}} className="w-full py-4 rounded-xl bg-[#009640] text-white font-black flex items-center justify-center gap-2"><Copy size={18}/> Copiar Código PIX</button>
              </SectionCard>
            )}
          </div>

          {/* COLUNA DIREITA: RESUMO PROFISSIONAL */}
          <aside className="lg:sticky lg:top-28">
            <SectionCard>
              <div className="h-1.5 w-full bg-gradient-to-r from-[#00577C] to-[#009640]" />
              <div className="p-6 border-b border-slate-50 text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Resumo da Reserva</p>
                <h3 className={`${jakarta.className} text-lg font-black text-slate-800`}>{quartoTipo === 'luxo' ? hotel?.quarto_luxo_nome : hotel?.quarto_standard_nome}</h3>
              </div>

              <div className="p-6 space-y-4 text-left">
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Estadia</span>
                    <span className="font-black text-slate-800">{numNoites} Noite{numNoites > 1 ? 's' : ''}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Quartos</span>
                    <span className="font-black text-slate-800">{quartosParam} Unidade{quartosParam > 1 ? 's' : ''}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Hóspedes</span>
                    <span className="font-black text-slate-800">{adultosParam} Adulto{adultosParam > 1 ? 's' : ''}</span>
                 </div>
                 
                 <div className="pt-4 border-t border-dashed border-slate-200 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                       <span>Preço por noite</span>
                       <span className="font-bold">{formatarMoeda(precoDiaria)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                       <span>Taxas governamentais</span>
                       <span className="font-bold">R$ 0,00</span>
                    </div>
                 </div>

                 <div className="pt-6 border-t-2 border-slate-100 flex items-center justify-between">
                    <div className="text-left">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Total a Pagar</p>
                       <p className={`${jakarta.className} text-3xl font-black text-[#00577C] tabular-nums`}>{formatarMoeda(valorTotalReserva)}</p>
                    </div>
                    <div className="bg-green-50 px-3 py-1 rounded-full flex items-center gap-1.5 text-[#009640] text-[10px] font-black uppercase">
                       <Check size={12} strokeWidth={3}/> Sem Juros
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-slate-50 flex items-center gap-3">
                 <ShieldAlert size={20} className="text-[#009640] shrink-0" />
                 <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed text-left">Reserva processada pelo sistema integrado de turismo de São Geraldo do Araguaia.</p>
              </div>
            </SectionCard>

            <div className="mt-6 flex flex-col items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <div className="flex items-center gap-2"><Lock size={14}/> Transação SSL 256-bit segura</div>
               <div className="flex items-center gap-4">
                  <img src="/logop.png" alt="SGA" className="h-6 opacity-30" />
                  <span className="text-slate-200">|</span>
                  <span className="opacity-30">PagBank</span>
               </div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}

export default function CheckoutHotelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#00577C] w-16 h-16" /></div>}>
      <CheckoutHotelContent />
    </Suspense>
  );
}