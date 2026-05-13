'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, ArrowLeft, ShieldCheck, MapPin, 
  Bed, Compass, Ticket, QrCode, Wallet, CheckCircle2, 
  User, Mail, FileText, Smartphone, Copy, AlertCircle
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS ──
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

  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  
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

      // Filtrar as escolhas baseadas na URL
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

  // 3. SUBMISSÃO PARA A API (GERAR PIX)
  const handleGerarPix = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');

    if (cpf.length < 14) {
      setErroApi('Por favor, introduza um CPF válido.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      pacote_id: pacoteId,
      hotel_id: hotelId || null,
      tipo_quarto: quartoTipo || null,
      guia_id: guiaId || null,
      nome_cliente: nome,
      cpf_cliente: cpf.replace(/\D/g, ''), // Envia só os números para o backend
      email_cliente: email
    };

    try {
      const response = await fetch('/api/v1/pagamentos/gerar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.sucesso) {
        setQrCodeData({
          link: data.qr_code_link,
          texto: data.qr_code_text
        });
      } else {
        setErroApi('Falha ao gerar o PIX. Tente novamente mais tarde.');
      }
    } catch (err) {
      console.error(err);
      setErroApi('Erro de ligação ao servidor PagBank.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copiarCodigo = () => {
    if (qrCodeData) {
      navigator.clipboard.writeText(qrCodeData.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  if (loadingInitial) return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preparando Checkout Seguro...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      
      {/* HEADER CHECKOUT */}
      <div className="flex items-center justify-between mb-12 border-b border-slate-200 pb-6">
        <Link href={`/pacotes/${pacoteId}`} className="flex items-center gap-2 text-slate-500 hover:text-[#00577C] font-bold transition-colors">
          <ArrowLeft size={20} /> Voltar
        </Link>
        <div className="flex items-center gap-3 text-[#009640]">
           <ShieldCheck size={24} />
           <span className={`${jakarta.className} text-xl font-black tracking-tight`}>Checkout Oficial</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-16 items-start">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO OU SUCESSO */}
        <div>
          {!qrCodeData ? (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <h1 className={`${jakarta.className} text-4xl font-black text-slate-900 mb-4`}>Finalize sua Reserva</h1>
              <p className="text-slate-500 mb-10 text-lg">Preencha os dados do titular para emissão do voucher e seguro viagem.</p>

              <form onSubmit={handleGerarPix} className="space-y-12">
                
                {/* Passo 1: Dados */}
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                  <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <span className="bg-[#00577C] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span> 
                    Dados do Titular
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><User size={16} className="text-slate-400"/> Nome Completo</label>
                      <input required type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none transition-all font-medium text-slate-900" placeholder="Ex: João da Silva" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Mail size={16} className="text-slate-400"/> E-mail</label>
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none transition-all font-medium text-slate-900" placeholder="seu@email.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><FileText size={16} className="text-slate-400"/> CPF</label>
                        <input required type="text" value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} maxLength={14} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-50 focus:border-[#00577C] outline-none transition-all font-medium text-slate-900" placeholder="000.000.000-00" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 2: Pagamento */}
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                  <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <span className="bg-[#009640] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span> 
                    Pagamento Oficial
                  </h2>
                  <div className="bg-[#009640]/5 border-2 border-[#009640]/20 rounded-[2rem] p-8 flex items-center gap-6 mb-8">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md shrink-0">
                      <QrCode className="text-[#009640]" size={32}/>
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-[#009640] mb-1">PIX PagBank</h4>
                      <p className="text-sm text-slate-600 font-medium">Aprovação imediata. O valor será roteado automaticamente para os prestadores oficiais.</p>
                    </div>
                  </div>

                  {erroApi && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
                      <AlertCircle size={20}/> {erroApi}
                    </div>
                  )}

                  <button 
                    type="submit" disabled={isSubmitting}
                    className="w-full bg-[#009640] hover:bg-[#007a33] text-white py-6 rounded-3xl font-black text-2xl shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-4 active:scale-[0.98]"
                  >
                    {isSubmitting ? <><Loader2 className="animate-spin" size={28}/> Conectando ao Banco...</> : 'Gerar PIX Oficial'}
                  </button>
                </div>

              </form>
            </div>
          ) : (
            /* TELA DE SUCESSO (AGUARDANDO PAGAMENTO) */
            <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-700">
               <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border-4 border-white">
                  <CheckCircle2 size={56} className="text-[#009640]"/>
               </div>
               <h2 className={`${jakarta.className} text-4xl font-black text-slate-900 mb-4`}>Reserva Solicitada!</h2>
               <p className="text-slate-500 text-lg mb-10 px-8">Escaneie o código abaixo no aplicativo do seu banco para concluir o pagamento de <b>{formatarMoeda(totalPagamento)}</b>.</p>
               
               <div className="w-72 h-72 bg-slate-50 mx-auto rounded-[3rem] p-6 mb-10 border-4 border-dashed border-slate-200 relative group">
                  <img src={qrCodeData.link} alt="QR Code PIX" className="w-full h-full object-contain mix-blend-multiply" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm rounded-[2.5rem]">
                     <Smartphone className="text-[#009640] animate-bounce mb-2" size={48}/>
                     <span className="text-xs font-black text-[#009640] uppercase tracking-widest">Pague via App</span>
                  </div>
               </div>

               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex items-center justify-between gap-4 mb-6 text-left">
                 <div className="min-w-0 flex-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pix Copia e Cola</p>
                   <p className="text-sm font-medium text-slate-800 truncate">{qrCodeData.texto}</p>
                 </div>
                 <button 
                   onClick={copiarCodigo} 
                   className={`p-4 rounded-2xl flex items-center gap-2 font-bold text-sm transition-all shrink-0 ${copiado ? 'bg-[#009640] text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                 >
                   {copiado ? <><CheckCircle2 size={18}/> Copiado</> : <><Copy size={18}/> Copiar</>}
                 </button>
               </div>
               <p className="text-xs text-slate-400 font-bold flex items-center justify-center gap-2 mt-8"><Loader2 className="animate-spin" size={14}/> Aguardando confirmação do banco...</p>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: RESUMO DA RESERVA FIXO */}
        <aside className="lg:sticky lg:top-28">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
            
            {/* Header do Resumo */}
            <div className="p-8 border-b border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumo da Reserva</p>
              <h3 className={`${jakarta.className} text-2xl font-bold text-slate-900 leading-tight`}>{pacote?.titulo}</h3>
            </div>

            {/* Detalhes */}
            <div className="p-8 space-y-6">
              {hotelSel && (
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3">
                    <Bed className="text-[#00577C] shrink-0 mt-0.5" size={18}/>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{hotelSel.nome}</p>
                      <p className="text-xs text-slate-500">{quartoTipo === 'luxo' ? hotelSel.quarto_luxo_nome : hotelSel.quarto_standard_nome}</p>
                    </div>
                  </div>
                  <span className="font-black text-slate-700">{formatarMoeda(precoHotel)}</span>
                </div>
              )}

              {guiaSel && (
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3">
                    <Compass className="text-[#009640] shrink-0 mt-0.5" size={18}/>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Guia Local</p>
                      <p className="text-xs text-slate-500">{guiaSel.nome}</p>
                    </div>
                  </div>
                  <span className="font-black text-slate-700">{formatarMoeda(precoGuia)}</span>
                </div>
              )}

              {atracoes.length > 0 && (
                <div className="flex justify-between items-start gap-4 pt-6 border-t border-slate-50">
                  <div className="flex items-start gap-3">
                    <Ticket className="text-[#F9C400] shrink-0 mt-0.5" size={18}/>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Taxas Oficiais</p>
                      <p className="text-xs text-slate-500">{atracoes.length} ingressos/taxas</p>
                    </div>
                  </div>
                  <span className="font-black text-slate-700">{formatarMoeda(precoAtracoes)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="p-8 bg-slate-50">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total a Pagar</span>
               </div>
               <p className={`${jakarta.className} text-5xl font-black text-[#009640]`}>{formatarMoeda(totalPagamento)}</p>
            </div>
          </div>

          <div className="mt-6 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2 uppercase tracking-widest">
             <ShieldCheck size={16} className="text-[#009640]"/> Ambiente 100% Seguro
          </div>
        </aside>

      </div>
    </div>
  );
}

// O Suspense é obrigatório no Next.js 13+ quando usamos useSearchParams()
export default function CheckoutPage() {
  return (
    <main className={`${inter.className} bg-[#F8F9FA] min-h-screen`}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-[#00577C] w-12 h-12" />
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}