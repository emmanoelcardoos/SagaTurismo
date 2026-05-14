'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, CheckCircle2, Mail, FileText, Calendar, 
  MapPin, Bed, Compass, User, Clock, ShieldCheck, 
  ArrowRight, Info, Printer, Lock, Check as CheckIcon
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── UTILITÁRIOS BLINDADOS ──
const formatarMoeda = (valor: any) => {
  const num = Number(valor);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(num) ? 0 : num);
};

const formatarData = (dataStr: any) => {
  if (!dataStr || typeof dataStr !== 'string') return '';
  try {
    const partes = dataStr.split('T')[0].split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;
  } catch { return ''; }
};

function SucessoContent() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('pedido'); 

  const [isMounted, setIsMounted] = useState(false);
  const [pedido, setPedido] = useState<any>(null);
  const [detalhesItem, setDetalhesItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    let tentativas = 0;
    const MAX_TENTATIVAS = 5; 

    async function fetchFluxo() {
      if (!pedidoId) {
        setErro('Protocolo não identificado na URL.');
        setLoading(false);
        return;
      }

      try {
        const { data: pData, error: pError } = await supabase
          .from('pedidos') 
          .select('*') 
          .ilike('codigo_pedido', pedidoId) 
          .maybeSingle();

        if (pError) throw pError;

        if (!pData && tentativas < MAX_TENTATIVAS) {
          tentativas++;
          setTimeout(fetchFluxo, 2000); 
          return;
        }

        if (!pData) throw new Error('Reserva não localizada.');
        
        setPedido(pData);

        // Busca os detalhes (Hotel/Pacote)
        const tabela = pData.tipo_item === 'hotel' ? 'hoteis' : 'pacotes';
        const { data: iData } = await supabase.from(tabela).select('*').eq('id', pData.item_id).maybeSingle();
        if (iData) setDetalhesItem(iData);

        setLoading(false);
      } catch (err: any) {
        setErro(err.message);
        setLoading(false);
      }
    }
    
    if (pedidoId) fetchFluxo();
  }, [pedidoId]);

  if (!isMounted) return null;

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#009640] w-16 h-16 mb-4" />
      <p className={`${jakarta.className} text-xs font-black text-slate-400 uppercase tracking-widest`}>Sincronizando com a Base de Dados...</p>
    </div>
  );

  if (erro && !pedido) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] px-6 text-center">
      <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl max-w-lg">
        <Info className="text-amber-500 w-16 h-16 mx-auto mb-6" />
        <h2 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-4`}>Pedido Pendente</h2>
        <p className="text-slate-500 mb-10 leading-relaxed font-medium">{erro}</p>
        <Link href="/" className="w-full bg-[#00577C] text-white px-10 py-4 rounded-2xl font-black block">Voltar ao Início</Link>
      </div>
    </div>
  );

  const isHotel = pedido?.tipo_item === 'hotel';
  const tituloReserva = isHotel ? detalhesItem?.nome : detalhesItem?.titulo;
  const imagemReserva = isHotel ? detalhesItem?.imagem_url : detalhesItem?.imagem_principal;
  // Fallback seguro para o nome
  const nomeExibicao = pedido?.nome_cliente ? String(pedido.nome_cliente).split(' ')[0] : 'Viajante';

  return (
    <main className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col`}>
      
      <header className="w-full border-b border-slate-200 bg-white p-5 sticky top-0 z-50 backdrop-blur-md bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-4">
            <Image src="/logop.png" alt="Prefeitura" width={150} height={45} className="object-contain" priority />
            <div className="hidden border-l border-slate-200 pl-5 sm:block text-left">
              <p className={`${jakarta.className} text-2xl font-black leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Recibo Oficial</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
            <ShieldCheck size={16} className="text-[#009640]"/>
            <span className="text-[10px] font-black text-[#009640] uppercase tracking-widest">Confirmada</span>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 lg:py-16 text-left">
        <div className="text-center mb-16 animate-in fade-in zoom-in-95 duration-700">
           <div className="w-28 h-28 bg-green-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border-4 border-white rotate-3">
              <CheckCircle2 size={64} className="text-[#009640]"/>
           </div>
           <h1 className={`${jakarta.className} text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6`}>Sucesso Total!</h1>
           <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
             Olá, <span className="text-[#00577C] font-bold">{nomeExibicao}</span>. O seu pedido foi registado com sucesso.
           </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16 animate-in slide-in-from-bottom-6">
           <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm flex flex-col gap-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#00577C] shadow-sm"><Mail size={28}/></div>
              <div>
                 <h3 className={`${jakarta.className} text-xl font-bold text-slate-900 mb-2`}>Comprovativos</h3>
                 <p className="text-sm text-slate-500 leading-relaxed">Enviamos os detalhes para: <br/><span className="font-bold text-slate-700">{pedido?.email_cliente}</span></p>
              </div>
           </div>
           <div className="bg-[#00577C] rounded-[3rem] p-8 shadow-xl flex flex-col gap-6 text-white relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><FileText size={120}/></div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md shadow-sm"><FileText size={28}/></div>
              <div>
                 <h3 className={`${jakarta.className} text-xl font-bold mb-2`}>Voucher Digital</h3>
                 <p className="text-sm text-white/80 leading-relaxed">O seu voucher PDF será enviado em instantes para o seu e-mail.</p>
              </div>
        </div>
        </div>

        <div className="w-full bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-10 duration-1000">
           <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
           
           <div className="p-10 md:p-14">
              <div className="flex flex-col md:flex-row gap-10 items-center mb-12 border-b pb-12">
                 <div className="relative w-full md:w-56 h-40 rounded-[2.5rem] overflow-hidden shadow-2xl shrink-0 bg-slate-100 border-4 border-white">
                    {/* Mantive Image pois o teu next.config.js está correto */}
                    <Image src={imagemReserva || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740'} alt="Local" fill className="object-cover" />
                 </div>
                 
                 <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl mb-4 text-[#00577C] font-black uppercase text-[11px] tracking-widest">
                       {isHotel ? <Bed size={16}/> : <Compass size={16}/>} {isHotel ? 'Hospedagem SGA' : 'Pacote Turístico'}
                    </div>
                    <h2 className={`${jakarta.className} text-4xl font-black text-slate-900 leading-tight mb-3`}>{tituloReserva || 'Reserva Oficial'}</h2>
                    <p className="text-slate-500 font-bold flex items-center justify-center md:justify-start gap-2"><MapPin size={18} className="text-[#009640]"/> São Geraldo do Araguaia - PA</p>
                 </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    {isHotel && (
                       <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Calendar size={14}/> Check-in</p>
                            <p className="font-black text-slate-800 text-xl">{formatarData(pedido?.data_checkin)}</p>
                          </div>
                          <div className="border-l-2 border-slate-200 pl-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Calendar size={14}/> Check-out</p>
                            <p className="font-black text-slate-800 text-xl">{formatarData(pedido?.data_checkout)}</p>
                          </div>
                       </div>
                    )}
                    <div className="space-y-4">
                       <div className="flex items-center gap-4 text-slate-600 font-bold">
                          <User size={20} className="text-slate-400"/>
                          <div className="flex flex-col text-left">
                             <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 leading-none mb-1">Responsável</span>
                             <span className="text-slate-800 uppercase">{pedido?.nome_cliente || '---'}</span>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center relative overflow-hidden shadow-2xl">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50 mb-4">Total Pago</p>
                    <p className={`${jakarta.className} text-5xl font-black text-white`}>{formatarMoeda(pedido?.valor_total)}</p>
                    <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                       <Lock size={12}/> Protocolo: {pedido?.codigo_pedido || '---'}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </main>
  );
}

export default function SucessoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#009640] w-16 h-16" /></div>}>
      <SucessoContent />
    </Suspense>
  );
}