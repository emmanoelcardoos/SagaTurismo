'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { 
  Loader2, ArrowLeft, ShieldCheck, MapPin, 
  Bed, Compass, Ticket, QrCode, Wallet, CheckCircle2, 
  User, Mail, FileText, Smartphone, Copy, AlertCircle,
  CreditCard, ChevronRight, X, ShieldAlert
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS DO SDK E SUPABASE ──
declare global {
  interface Window {
    PagSeguro?: {
      encryptCard: (params: any) => { encryptedCard?: string; hasErrors?: boolean; errors?: any[] };
    };
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

const mascaraCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const mascaraCartao = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parâmetros da URL
  const pacoteId = searchParams.get('pacote');
  const hotelId = searchParams.get('hotel');
  const quartoTipo = searchParams.get('quarto') as 'standard' | 'luxo' | null;
  const guiaId = searchParams.get('guia');

  // Estados de Dados
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [hotelSel, setHotelSel] = useState<Hotel | null>(null);
  const [guiaSel, setGuiaSel] = useState<Guia | null>(null);
  const [atracoes, setAtracoes] = useState<Atracao[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Estados do Formulário: Passo 1
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  
  // Estados do Formulário: Passo 2 (Pagamento)
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');
  const [nomeCartao, setNomeCartao] = useState('');
  const [numeroCartao, setNumeroCartao] = useState('');
  const [mesCartao, setMesCartao] = useState('');
  const [anoCartao, setAnoCartao] = useState('');
  const [cvvCartao, setCvvCartao] = useState('');
  const [parcelas, setParcelas] = useState(1);
  
  // Estados de Submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroApi, setErroApi] = useState('');
  const [qrCodeData, setQrCodeData] = useState<{ link: string; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  // 1. CARREGAMENTO DOS DADOS DO RESUMO
  useEffect(() => {
    async function carregarResumo() {
      if (!pacoteId) {
        router.push('/pacotes');
        return;
      }

      const { data, error } = await supabase
        .from('pacotes')
        .select(`id, titulo, imagem_principal, pacote_itens ( hoteis (*), guias (*), atracoes (*) )`)
        .eq('id', pacoteId)
        .single();

      if (error || !data) {
        router.push('/pacotes');
        return;
      }

      const pct = data as Pacote;
      setPacote(pct);

      if (hotelId) {
        const h = pct.pacote_itens.map(i => i.hoteis).find(h => h?.id === hotelId);
        if (h) setHotelSel(h);
      }
      if (guiaId) {
        const g = pct.pacote_itens.map(i => i.guias).find(g => g?.id === guiaId);
        if (g) setGuiaSel(g);
      }
      
      const atts = pct.pacote_itens.map(i => i.atracoes).filter(Boolean) as Atracao[];
      setAtracoes(atts);
      
      setLoadingInitial(false);
    }
    carregarResumo();
  }, [pacoteId, hotelId, guiaId, router]);

  // 2. MATEMÁTICA
  const precoHotel = hotelSel ? (quartoTipo === 'luxo' ? parseValor(hotelSel.quarto_luxo_preco) : parseValor(hotelSel.quarto_standard_preco)) : 0;
  const precoGuia = guiaSel ? parseValor(guiaSel.preco_diaria) : 0;
  const precoAtracoes = atracoes.reduce((acc, curr) => acc + parseValor(curr.preco_entrada), 0);
  const totalPagamento = precoHotel + precoGuia + precoAtracoes;

  // 3. SUBMISSÃO PARA A API
  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');

    if (cpf.length < 14) {
      setErroApi('Por favor, introduza um CPF válido.');
      return;
    }

    setIsSubmitting(true);

    let payload: any = {
      pacote_id: pacoteId,
      hotel_id: hotelId || null,
      tipo_quarto: quartoTipo || null,
      guia_id: guiaId || null,
      nome_cliente: nome,
      cpf_cliente: cpf.replace(/\D/g, ''),
      email_cliente: email
    };

    try {
      if (metodoPagamento === 'cartao') {
        if (!window.PagSeguro) {
          setErroApi('Erro ao carregar módulo de segurança PagBank.');
          setIsSubmitting(false);
          return;
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
          setErroApi('Dados do cartão inválidos. Verifique os campos.');
          setIsSubmitting(false);
          return;
        }

        payload = {
          ...payload,
          metodo_pagamento: 'cartao',
          encrypted_card: result.encryptedCard,
          parcelas: Number(parcelas)
        };
      } else {
        payload = { ...payload, metodo_pagamento: 'pix' };
      }

      const response = await fetch('/api/v1/pagamentos/processar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.sucesso) {
        if (metodoPagamento === 'pix') {
          setQrCodeData({ link: data.qr_code_link, texto: data.qr_code_text });
        } else {
          router.push('/sucesso');
        }
      } else {
        setErroApi('Transação recusada ou erro no processamento.');
      }
    } catch (err) {
      console.error(err);
      setErroApi('Falha na comunicação com o banco.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInitial) return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preparando Checkout Seguro...</p>
    </div>
  );

  return (
    <>
      <Script src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js" strategy="afterInteractive" />
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* HEADER CHECKOUT */}
        <div className="flex items-center justify-between mb-12 border-b border-slate-200 pb-6">
          <Link href={`/pacotes/${pacoteId}`} className="flex items-center gap-2 text-slate-500 hover:text-[#00577C] font-bold transition-colors">
            <ArrowLeft size={20} /> Voltar e alterar reserva
          </Link>
          <div className="flex items-center gap-3 text-[#009640]">
             <ShieldCheck size={24} />
             <span className={`${jakarta.className} text-xl font-black tracking-tight`}>Checkout Oficial</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-16 items-start">
          <div>
            {!qrCodeData ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className={`${jakarta.className} text-4xl font-black text-slate-900 mb-4`}>Finalize sua Reserva</h1>
                <p className="text-slate-500 mb-10 text-lg">Insira seus dados para emissão do voucher oficial.</p>

                <form onSubmit={handlePagamento} className="space-y-12">
                  <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                      <span className="bg-[#00577C] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span> Dados do Titular
                    </h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                        <input required type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:border-[#00577C] outline-none transition-all" />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">E-mail</label>
                          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:border-[#00577C] outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">CPF</label>
                          <input required type="text" value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} maxLength={14} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:border-[#00577C] outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                      <span className="bg-[#009640] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span> Forma de Pagamento
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-10">
                      <button type="button" onClick={() => setMetodoPagamento('pix')} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 ${metodoPagamento === 'pix' ? 'border-[#009640] bg-green-50/50' : 'border-slate-100 bg-white'}`}>
                        <QrCode size={32} className={metodoPagamento === 'pix' ? 'text-[#009640]' : 'text-slate-400'} />
                        <span className="font-bold">PIX</span>
                      </button>
                      <button type="button" onClick={() => setMetodoPagamento('cartao')} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 ${metodoPagamento === 'cartao' ? 'border-[#00577C] bg-blue-50/50' : 'border-slate-100 bg-white'}`}>
                        <CreditCard size={32} className={metodoPagamento === 'cartao' ? 'text-[#00577C]' : 'text-slate-400'} />
                        <span className="font-bold">Cartão de Crédito</span>
                      </button>
                    </div>

                    {metodoPagamento === 'cartao' && (
                      <div className="space-y-6 bg-slate-50 p-8 rounded-3xl border mb-10">
                        <div><label className="block text-sm font-bold text-slate-700 mb-2">Nome no Cartão</label><input required type="text" value={nomeCartao} onChange={e => setNomeCartao(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 uppercase" /></div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-2">Número do Cartão</label><input required type="text" value={numeroCartao} onChange={e => setNumeroCartao(mascaraCartao(e.target.value))} maxLength={19} className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3" /></div>
                        <div className="grid grid-cols-3 gap-4">
                          <div><label className="block text-sm font-bold mb-2">Mês</label><input required value={mesCartao} onChange={e => setMesCartao(e.target.value)} className="w-full border rounded-xl px-2 py-3 text-center" /></div>
                          <div><label className="block text-sm font-bold mb-2">Ano</label><input required value={anoCartao} onChange={e => setAnoCartao(e.target.value)} className="w-full border rounded-xl px-2 py-3 text-center" /></div>
                          <div><label className="block text-sm font-bold mb-2">CVV</label><input required value={cvvCartao} onChange={e => setCvvCartao(e.target.value)} className="w-full border rounded-xl px-2 py-3 text-center" /></div>
                        </div>
                        <div><label className="block text-sm font-bold mb-2">Parcelas</label><select className="w-full border rounded-xl px-5 py-3" value={parcelas} onChange={e => setParcelas(Number(e.target.value))}>{[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}x de {formatarMoeda(totalPagamento/(i+1))}</option>)}</select></div>
                      </div>
                    )}

                    {erroApi && <div className="mb-8 p-5 bg-red-50 text-red-600 rounded-2xl font-bold flex gap-3"><AlertCircle/> {erroApi}</div>}
                    <button type="submit" disabled={isSubmitting} className={`w-full py-6 rounded-3xl font-black text-2xl shadow-xl transition-all ${metodoPagamento === 'pix' ? 'bg-[#009640]' : 'bg-[#00577C]'} text-white`}>
                      {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : metodoPagamento === 'pix' ? 'Gerar PIX Oficial' : `Pagar ${formatarMoeda(totalPagamento)}`}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border text-center animate-in zoom-in-95">
                 <CheckCircle2 size={56} className="text-[#009640] mx-auto mb-8"/>
                 <h2 className="text-4xl font-black mb-4">Reserva Solicitada!</h2>
                 <p className="mb-10 text-lg">Pague <b>{formatarMoeda(totalPagamento)}</b> via PIX.</p>
                 <div className="w-80 h-80 bg-slate-50 mx-auto rounded-[3rem] p-8 mb-10 border-4 border-dashed relative">
                    <img src={qrCodeData.link} alt="QR Code" className="w-full h-full mix-blend-multiply" />
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl border flex items-center justify-between gap-4 text-left">
                    <p className="text-sm font-medium truncate flex-1">{qrCodeData.texto}</p>
                    <button onClick={() => { navigator.clipboard.writeText(qrCodeData.texto); setCopiado(true); setTimeout(() => setCopiado(false), 3000); }} className="p-4 bg-slate-200 rounded-2xl font-bold">{copiado ? 'Copiado' : 'Copiar'}</button>
                 </div>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-12">
            <div className="bg-white rounded-[3rem] border shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
              <div className="p-10 border-b border-slate-50"><p className="text-[10px] font-black uppercase tracking-widest mb-3">Resumo da Reserva</p><h3 className="text-3xl font-bold">{pacote?.titulo}</h3></div>
              <div className="p-10 space-y-8">
                {hotelSel && <div className="flex justify-between"><div><p className="font-bold text-slate-800">{hotelSel.nome}</p><p className="text-xs">{quartoTipo}</p></div><span className="font-black">{formatarMoeda(precoHotel)}</span></div>}
                {guiaSel && <div className="flex justify-between"><div><p className="font-bold text-slate-800">Guia Oficial</p><p className="text-xs">{guiaSel.nome}</p></div><span className="font-black">{formatarMoeda(precoGuia)}</span></div>}
                {atracoes.length > 0 && <div className="flex justify-between border-t pt-8"><div><p className="font-bold text-slate-800">Taxas e Ingressos</p><p className="text-xs">{atracoes.length} itens</p></div><span className="font-black">{formatarMoeda(precoAtracoes)}</span></div>}
              </div>
              <div className="p-10 bg-[#009640]/5 border-t text-center"><p className="text-xs font-black uppercase mb-2">Total</p><p className="text-6xl font-black text-[#009640]">{formatarMoeda(totalPagamento)}</p></div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <main className={`${inter.className} bg-[#F8F9FA] min-h-screen`}>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#00577C] w-12 h-12" /></div>}>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}