'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, CheckCircle2, Mail, FileText, Calendar, 
  MapPin, Bed, Compass, User, Clock, ShieldCheck, 
  ArrowRight, Download, Info, ChevronRight, Printer
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── UTILITÁRIOS ──
const formatarMoeda = (valor: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const formatarData = (dataStr: string) => {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('T')[0].split('-');
  return `${dia}/${mes}/${ano}`;
};

// ── TIPAGEM ──
type Pedido = {
  id: string;
  codigo_pedido: string;
  tipo_item: 'hotel' | 'pacote';
  nome_cliente: string;
  email_cliente: string;
  data_checkin?: string;
  data_checkout?: string;
  valor_total: number;
  status_pagamento: string;
  hoteis?: { nome: string; imagem_url: string };
  pacotes?: { titulo: string; imagem_principal: string };
};

function SucessoContent() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('pedido');

  const [isMounted, setIsMounted] = useState(false);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => { setIsMounted(true); }, []);

  // ── LÓGICA DE PERSISTÊNCIA COM TENTATIVAS ──
  useEffect(() => {
    let tentativas = 0;
    const MAX_TENTATIVAS = 5; // Tenta 5 vezes (total de 10 segundos)

    async function fetchPedido() {
      if (!pedidoId) {
        setErro('O número do protocolo não foi identificado na URL.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('pedidos') 
          .select(`
            *,
            hoteis (nome, imagem_url),
            pacotes (titulo, imagem_principal)
          `)
          .eq('codigo_pedido', pedidoId) 
          .single();

        // Se der erro ou não encontrar, e ainda tivermos tentativas, espera 2 segundos e tenta de novo
        if ((error || !data) && tentativas < MAX_TENTATIVAS) {
          tentativas++;
          setTimeout(fetchPedido, 2000); 
          return;
        }

        if (error || !data) throw new Error('A reserva ainda não foi processada ou o código é inválido.');
        
        setPedido(data as Pedido);
        setErro(''); // Limpa qualquer erro prévio se encontrar o pedido
        setLoading(false);
      } catch (err: any) {
        console.error("Erro Supabase:", err);
        setErro(err.message);
        setLoading(false);
      }
    }
    
    if (pedidoId) fetchPedido();
  }, [pedidoId]);

  if (!isMounted) return null;

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="relative flex flex-col items-center">
        <Loader2 className="animate-spin text-[#009640] w-16 h-16 mb-4" strokeWidth={1.5} />
        <p className={`${jakarta.className} text-xs font-black text-slate-400 uppercase tracking-[0.3em]`}>Confirmando com a Base de Dados...</p>
      </div>
    </div>
  );

  if (erro && !pedido) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] px-6 text-center">
      <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl max-w-lg text-left">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
           <Info className="text-amber-500" size={40} />
        </div>
        <h2 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-4 text-center`}>Pedido Pendente</h2>
        <p className="text-slate-500 mb-10 leading-relaxed font-medium text-center">{erro}</p>
        <Link href="/" className="w-full bg-[#00577C] text-white px-10 py-4 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/20 text-center block">
          Voltar ao Início
        </Link>
      </div>
    </div>
  );

  const isHotel = pedido?.tipo_item === 'hotel';
  const tituloReserva = isHotel ? pedido?.hoteis?.nome : pedido?.pacotes?.titulo;
  const imagemReserva = isHotel ? pedido?.hoteis?.imagem_url : pedido?.pacotes?.imagem_principal;

  return (
    <main className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col`}>
      
      <header className="w-full border-b border-slate-200 bg-white p-5 sticky top-0 z-50 backdrop-blur-md bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <Image src="/logop.png" alt="Prefeitura" width={150} height={45} className="object-contain" />
            <div className="hidden border-l border-slate-200 pl-5 sm:block text-left">
              <p className={`${jakarta.className} text-2xl font-black leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Confirmação de Reserva</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
            <ShieldCheck size={16} className="text-[#009640]"/>
            <span className="text-[10px] font-black text-[#009640] uppercase tracking-widest">Reserva Confirmada</span>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 lg:py-16">
        
        <div className="text-center mb-16 animate-in fade-in zoom-in-95 duration-700">
           <div className="w-28 h-28 bg-green-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border-4 border-white rotate-3">
              <CheckCircle2 size={64} className="text-[#009640]"/>
           </div>
           <h1 className={`${jakarta.className} text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6`}>
             Sucesso Total!
           </h1>
           <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
             Olá, <span className="text-[#00577C] font-bold">{pedido?.nome_cliente?.split(' ')[0]}</span>. Sua reserva em São Geraldo do Araguaia foi processada e está garantida.
           </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16 animate-in slide-in-from-bottom-6 duration-700 delay-200 text-left">
           <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm flex flex-col gap-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#00577C] shadow-sm"><Mail size={28}/></div>
              <div>
                 <h3 className={`${jakarta.className} text-xl font-bold text-slate-900 mb-2`}>Confirmação no E-mail</h3>
                 <p className="text-sm text-slate-500 leading-relaxed">
                   Enviamos os comprovantes de pagamento e a confirmação para: <br/>
                   <span className="font-bold text-slate-700">{pedido?.email_cliente}</span>
                 </p>
              </div>
           </div>
           <div className="bg-[#00577C] rounded-[3rem] p-8 shadow-xl flex flex-col gap-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><FileText size={120}/></div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md shadow-sm"><FileText size={28}/></div>
              <div>
                 <h3 className={`${jakarta.className} text-xl font-bold mb-2`}>Voucher Digital em PDF</h3>
                 <p className="text-sm text-white/80 leading-relaxed mb-4">
                   O seu voucher oficial foi gerado. Ele contém os dados de check-in e o roteiro completo.
                 </p>
                 <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#F9C400]">
                    <CheckIcon size={14}/> Anexado no seu e-mail
                 </div>
              </div>
           </div>
        </div>

        <div className="w-full bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-10 duration-1000 delay-300 text-left">
           <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
           
           <div className="p-10 md:p-14">
              <div className="flex flex-col md:flex-row gap-10 items-center mb-12 border-b border-slate-100 pb-12">
                 <div className="relative w-full md:w-56 h-40 rounded-[2.5rem] overflow-hidden shadow-2xl shrink-0 bg-slate-100 border-4 border-white">
                    <Image src={imagemReserva || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740'} alt="Local" fill className="object-cover" />
                 </div>
                 
                 <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl mb-4">
                       {isHotel ? <Bed size={16} className="text-[#00577C]"/> : <Compass size={16} className="text-[#F9C400]"/>}
                       <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{isHotel ? 'Hospedagem Confirmada' : 'Pacote de Viagem'}</span>
                    </div>
                    <h2 className={`${jakarta.className} text-4xl font-black text-slate-900 leading-tight mb-3`}>{tituloReserva || 'Reserva SGA'}</h2>
                    <p className="text-slate-500 font-bold flex items-center justify-center md:justify-start gap-2"><MapPin size={18} className="text-[#009640]"/> São Geraldo do Araguaia - PA</p>
                 </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-12 mb-12">
                 <div className="space-y-8">
                    {isHotel && (
                       <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-[2rem] p-8 border border-slate-100 shadow-inner">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Calendar size={14}/> Check-in</p>
                            <p className="font-black text-slate-800 text-xl">{formatarData(pedido?.data_checkin || '')}</p>
                            <p className="text-[10px] font-bold text-[#00577C] mt-2 text-left">14:00h</p>
                          </div>
                          <div className="border-l-2 border-slate-200 pl-6 text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Calendar size={14}/> Check-out</p>
                            <p className="font-black text-slate-800 text-xl">{formatarData(pedido?.data_checkout || '')}</p>
                            <p className="text-[10px] font-bold text-[#00577C] mt-2 text-left">12:00h</p>
                          </div>
                       </div>
                    )}
                    
                    {!isHotel && (
                       <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 flex items-center gap-6 shadow-inner text-left">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#F9C400] shadow-sm"><Calendar size={32}/></div>
                          <div className="text-left">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Início</p>
                             <p className="font-black text-slate-800 text-2xl mt-1">{formatarData(pedido?.data_checkin || '')}</p>
                          </div>
                       </div>
                    )}

                    <div className="space-y-4 text-left">
                       <div className="flex items-center gap-4 text-slate-600 font-bold">
                          <User size={20} className="text-slate-400"/>
                          <div className="flex flex-col text-left">
                             <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 leading-none mb-1">Titular</span>
                             <span className="text-slate-800">{pedido?.nome_cliente}</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 text-slate-600 font-bold">
                          <ShieldCheck size={20} className="text-slate-400"/>
                          <div className="flex flex-col text-left">
                             <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 leading-none mb-1">Status</span>
                             <span className="text-[#009640] uppercase text-xs">Voucher Emitido</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center relative overflow-hidden flex-1 shadow-2xl">
                       <div className="absolute inset-0 bg-[#009640] opacity-10 pointer-events-none" />
                       <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50 mb-4">Investimento Total</p>
                       <p className={`${jakarta.className} text-5xl font-black text-white`}>{formatarMoeda(pedido?.valor_total || 0)}</p>
                       <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                          <Lock size={12}/> Protocolo: {pedido?.codigo_pedido || '---'}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mt-4">
                 <Link href="/" className="w-full sm:w-auto flex items-center justify-center gap-3 text-slate-500 hover:text-[#00577C] font-bold transition-all group">
                    <ArrowRight className="rotate-180 group-hover:-translate-x-2 transition-transform" size={20}/> Voltar ao Portal
                 </Link>
                 <button onClick={() => window.print()} className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-md active:scale-95">
                    <Printer size={18}/> Imprimir Comprovante
                 </button>
              </div>
           </div>
        </div>

      </div>

      <footer className="mt-auto py-12 text-center border-t border-slate-200 bg-white">
         <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em]">
            © {new Date().getFullYear()} · Secretaria de Turismo de São Geraldo do Araguaia
         </p>
      </footer>

      <style jsx global>{`
        @media print {
          header, footer, .no-print, button { display: none !important; }
          main { background: white !important; padding: 0 !important; }
          .shadow-2xl { box-shadow: none !important; border: 1px solid #eee !important; }
          [class*="rounded-"] { border-radius: 0 !important; }
        }
      `}</style>
    </main>
  );
}

const CheckIcon = ({className}: {className?: string}) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

export default function SucessoReservaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#009640] w-16 h-16 mb-4" />
      </div>
    }>
      <SucessoContent />
    </Suspense>
  );
}