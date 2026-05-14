'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { 
  Loader2, ArrowLeft, ShieldCheck, MapPin, 
  Bed, Compass, Ticket, QrCode, CheckCircle2, 
  User, Mail, FileText, Smartphone, Copy, AlertCircle,
  CreditCard, Home, Clock, Lock, ShieldAlert, Menu, Info,
  ChevronRight
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

// ─── COMPONENTE: CRONÓMETRO ───
function CronometroPix({ onExpirado }: { onExpirado: () => void }) {
  const [segundos, setSegundos] = useState(900);
  const jaDisparou = useRef(false);
  useEffect(() => {
    const id = setInterval(() => {
      setSegundos((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          if (!jaDisparou.current) { jaDisparou.current = true; onExpirado(); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onExpirado]);
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  const percent = (segundos / 900) * 100;
  return (
    <div className="rounded-3xl border-2 p-6 bg-slate-50 border-slate-200 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Clock className="text-[#00577C]" size={20} /><p className="text-xs font-black uppercase text-slate-500">Tempo de Reserva</p></div>
        <div className="text-3xl font-black text-slate-800">{String(min).padStart(2, "0")}:{String(seg).padStart(2, "0")}</div>
      </div>
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-[#00577C] transition-all" style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

function CheckoutPacoteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Parâmetros
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
  const [copiado, setCopiado] = useState(false);
  const [pixExpirado, setPixExpirado] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);
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

  const precoHotel = hotelSel ? (quartoTipo === 'luxo' ? parseValor(hotelSel.quarto_luxo_preco) : parseValor(hotelSel.quarto_standard_preco)) : 0;
  const precoGuia = guiaSel ? parseValor(guiaSel.preco_diaria) : 0;
  const precoAtracoes = atracoes.reduce((acc, curr) => acc + parseValor(curr.preco_entrada), 0);
  const totalPagamento = precoHotel + precoGuia + precoAtracoes;

  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');
    if (cpf.length < 14) { setErroApi('CPF inválido.'); return; }
    setIsSubmitting(true);

    const payload: any = {
      tipo_item: "pacote",
      item_id: pacoteId,
      hotel_id: hotelId || null,
      guia_id: guiaId || null,
      nome_cliente: nome,
      cpf_cliente: cpf.replace(/\D/g, ''),
      email_cliente: email,
      telefone_cliente: telefone.replace(/\D/g, ''),
      valor_total: totalPagamento,
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
        if (result.hasErrors) throw new Error('Cartão inválido.');
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
        setErroApi(data.mensagem || 'Rejeitado pela operadora.');
      }
    } catch (err: any) { setErroApi(err.message); } finally { setIsSubmitting(false); }
  };

  if (!isMounted) return null;
  if (loadingInitial) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
      <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Preparando Pacote Turístico...</p>
    </div>
  );

  return (
    <div className={`${inter.className} bg-[#F8F9FA] min-h-screen`}>
      <Script src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js" strategy="afterInteractive" />

      {/* HEADER OFICIAL */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-4">
            <div className="relative h-12 w-36 sm:h-16 sm:w-56"><Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" /></div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block text-left">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
             <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-6 py-3 text-sm font-bold text-[#00577C] shadow-lg hover:bg-[#ffd633] transition-all">Cartão Residente</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 mt-[80px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-16 border-b-2 border-slate-100 pb-8 gap-6 text-left">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-[#00577C] font-bold transition-all"><ArrowLeft size={20} /> Alterar Escolhas</button>
          <div className="flex items-center gap-4 bg-green-50 px-6 py-3 rounded-full border border-green-100"><ShieldCheck className="text-[#009640]" size={24} /><span className={`${jakarta.className} text-xl font-black text-[#009640]`}>Checkout Seguro SGA</span></div>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-16 items-start text-left">
          <div className="space-y-12">
            {!qrCodeData ? (
              <form onSubmit={handlePagamento} className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* 1. IDENTIFICAÇÃO */}
                <section className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><User size={120}/></div>
                  <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-10 flex items-center gap-4`}>
                    <span className="bg-[#00577C] text-white w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-md">1</span> 
                    Hóspede Principal
                  </h2>
                  <div className="space-y-8">
                    <input required value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-800 text-lg outline-none focus:border-[#00577C] transition-all" placeholder="Nome Completo" />
                    <div className="grid sm:grid-cols-2 gap-8">
                      <input required value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} maxLength={14} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-lg outline-none focus:border-[#00577C] transition-all" placeholder="CPF" />
                      <input required value={telefone} onChange={e => setTelefone(mascaraTelefone(e.target.value))} maxLength={15} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-lg outline-none focus:border-[#00577C] transition-all" placeholder="WhatsApp" />
                    </div>
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-lg outline-none focus:border-[#00577C] transition-all" placeholder="E-mail para o Voucher" />
                  </div>
                </section>

                {/* 2. ENDEREÇO (EXIGIDO PELO PAGBANK) */}
                <section className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Home size={120}/></div>
                  <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-10 flex items-center gap-4`}>
                    <span className="bg-[#00577C] text-white w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-md">2</span> 
                    Endereço de Registo
                  </h2>
                  <div className="space-y-8">
                    <div className="grid sm:grid-cols-[1fr_120px] gap-8">
                      <input required value={rua} onChange={e => setRua(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-[#00577C]" placeholder="Rua / Avenida" />
                      <input required value={numero} onChange={e => setNumero(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-center outline-none focus:border-[#00577C]" placeholder="Nº" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-8">
                      <input required value={bairro} onChange={e => setBairro(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-[#00577C]" placeholder="Bairro" />
                      <input required value={cep} onChange={e => setCep(mascaraCEP(e.target.value))} maxLength={9} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-[#00577C]" placeholder="CEP" />
                    </div>
                    <div className="grid sm:grid-cols-[1fr_100px] gap-8">
                      <input required value={cidade} onChange={e => setCidade(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-[#00577C]" placeholder="Cidade" />
                      <input required value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} maxLength={2} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-center outline-none focus:border-[#00577C]" placeholder="UF" />
                    </div>
                  </div>
                </section>

                {/* 3. PAGAMENTO */}
                <section className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                  <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-10 flex items-center gap-4`}>
                    <span className="bg-[#009640] text-white w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-md">3</span> 
                    Pagamento Oficial
                  </h2>
                  <div className="grid grid-cols-2 gap-6 mb-12">
                    <button type="button" onClick={() => setMetodoPagamento('pix')} className={`p-8 rounded-[2.5rem] border-4 flex flex-col items-center gap-4 transition-all ${metodoPagamento === 'pix' ? 'border-[#009640] bg-green-50/50' : 'border-slate-50 opacity-60'}`}><QrCode size={32} className={metodoPagamento === 'pix' ? 'text-[#009640]' : 'text-slate-400'} /><span className="font-black text-xs uppercase">PIX Instantâneo</span></button>
                    <button type="button" onClick={() => setMetodoPagamento('cartao')} className={`p-8 rounded-[2.5rem] border-4 flex flex-col items-center gap-4 transition-all ${metodoPagamento === 'cartao' ? 'border-[#00577C] bg-blue-50/50' : 'border-slate-50 opacity-60'}`}><CreditCard size={32} className={metodoPagamento === 'cartao' ? 'text-[#00577C]' : 'text-slate-400'} /><span className="font-black text-xs uppercase">Cartão de Crédito</span></button>
                  </div>

                  {metodoPagamento === 'cartao' && (
                    <div className="space-y-6 bg-slate-50 p-10 rounded-[2.5rem] border-2 border-slate-100 mb-10 animate-in slide-in-from-top-4">
                      <input required value={nomeCartao} onChange={e => setNomeCartao(e.target.value.toUpperCase())} className="w-full p-4 rounded-xl font-bold border-2 outline-none focus:border-[#00577C]" placeholder="NOME NO CARTÃO" />
                      <input required value={numeroCartao} onChange={e => setNumeroCartao(mascaraCartao(e.target.value))} maxLength={19} className="w-full p-4 rounded-xl font-bold border-2 outline-none focus:border-[#00577C]" placeholder="0000 0000 0000 0000" />
                      <div className="grid grid-cols-3 gap-4">
                        <input required value={mesCartao} maxLength={2} className="p-4 rounded-xl border-2 text-center font-bold" placeholder="MM" onChange={e => setMesCartao(e.target.value.replace(/\D/g,''))} />
                        <input required value={anoCartao} maxLength={4} className="p-4 rounded-xl border-2 text-center font-bold" placeholder="AAAA" onChange={e => setAnoCartao(e.target.value.replace(/\D/g,''))} />
                        <input required type="password" value={cvvCartao} maxLength={4} className="p-4 rounded-xl border-2 text-center font-bold" placeholder="CVV" onChange={e => setCvvCartao(e.target.value.replace(/\D/g,''))} />
                      </div>
                      <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} className="w-full p-5 rounded-xl border-2 font-bold bg-white">
                        {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}x de {formatarMoeda(totalPagamento/(i+1))}</option>)}
                      </select>
                    </div>
                  )}

                  {erroApi && <div className="p-6 bg-red-50 text-red-600 rounded-3xl mb-8 font-bold flex gap-3 border border-red-100 animate-pulse"><AlertCircle/> {erroApi}</div>}
                  <button type="submit" disabled={isSubmitting} className="w-full py-8 rounded-[2rem] font-black text-2xl text-white shadow-xl bg-slate-900 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-4">
                    {isSubmitting ? <Loader2 className="animate-spin" size={32}/> : `Pagar ${formatarMoeda(totalPagamento)}`}
                  </button>
                  <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center justify-center gap-3"><ShieldCheck size={16} className="text-[#009640]"/> Transação Governamental Segura</p>
                </section>
              </form>
            ) : (
              /* TELA PIX */
              <div className="space-y-6 animate-in zoom-in-95 duration-700">
                <div className="bg-white p-16 rounded-[4rem] shadow-2xl border text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-3 bg-[#009640]" />
                  <CheckCircle2 size={64} className="text-[#009640] mx-auto mb-10"/>
                  <h2 className={`${jakarta.className} text-4xl font-black mb-10 text-slate-900`}>Aguardando Pagamento</h2>
                  {!pixExpirado ? (
                    <>
                      <CronometroPix onExpirado={() => setPixExpirado(true)} />
                      <div className="w-72 h-72 bg-slate-50 mx-auto rounded-[3.5rem] p-8 my-10 border-4 border-dashed relative group">
                         <img src={qrCodeData.link} alt="QR" className="w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform" />
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(qrCodeData.texto); setCopiado(true); setTimeout(()=>setCopiado(false), 2000); }} className="p-6 rounded-2xl bg-[#009640] text-white font-black w-full uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95">
                        {copiado ? <><CheckCircle2/> Copiado!</> : <><Copy/> Copiar Código PIX</>}
                      </button>
                    </>
                  ) : (
                    <div className="p-10 bg-red-50 rounded-3xl border border-red-100 text-center">
                       <ShieldAlert className="text-red-500 mx-auto mb-4" size={48}/><p className="font-black text-red-700 text-xl mb-4">Código Expirado</p>
                       <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold uppercase">Gerar Novo Código</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: RESUMO */}
          <aside className="lg:sticky lg:top-32">
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
              <div className="p-10 border-b-2 border-slate-50">
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] mb-6">Seu Pacote Oficial</p>
                <div className="flex gap-5 items-center">
                  <div className="relative w-24 h-24 rounded-3xl overflow-hidden shrink-0 border-4 border-white shadow-xl bg-slate-100">
                    <img src={pacote?.imagem_principal} alt="Pacote" className="w-full h-full object-cover" />
                  </div>
                  <div><h3 className={`${jakarta.className} text-2xl font-black text-slate-900 leading-tight mb-2`}>{pacote?.titulo}</h3><span className="text-[10px] font-black uppercase px-3 py-1 bg-green-50 text-[#009640] rounded-lg border border-green-100">SagaTurismo Oficial</span></div>
                </div>
              </div>

              <div className="p-10 space-y-6 text-left font-bold text-slate-600 text-sm">
                {hotelSel && (
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3"><Bed size={18} className="text-[#00577C]"/> <span>Alojamento: {hotelSel.nome}</span></div>
                    <span className="text-slate-900">{formatarMoeda(precoHotel)}</span>
                  </div>
                )}
                {guiaSel && (
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3"><Compass size={18} className="text-[#009640]"/> <span>Guia: {guiaSel.nome}</span></div>
                    <span className="text-slate-900">{formatarMoeda(precoGuia)}</span>
                  </div>
                )}
                {atracoes.length > 0 && (
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3"><Ticket size={18} className="text-[#F9C400]"/> <span>Taxas & Ingressos ({atracoes.length})</span></div>
                    <span className="text-slate-900">{formatarMoeda(precoAtracoes)}</span>
                  </div>
                )}
              </div>

              <div className="p-12 bg-slate-900 text-white text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full bg-[#009640] opacity-20 pointer-events-none" />
                 <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/50 mb-4">Investimento Total</p>
                 <p className={`${jakarta.className} text-6xl font-black tabular-nums`}>{formatarMoeda(totalPagamento)}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="py-20 px-8 border-t border-slate-200 bg-white mt-20 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <Image src="/logop.png" alt="Prefeitura" width={160} height={50} className="opacity-60" />
          <p className={`${jakarta.className} text-[10px] font-black text-slate-400 uppercase tracking-widest`}>© {new Date().getFullYear()} · Município de São Geraldo do Araguaia</p>
        </div>
      </footer>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#00577C] w-16 h-16" /></div>}>
      <CheckoutPacoteContent />
    </Suspense>
  );
}