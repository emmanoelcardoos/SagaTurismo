'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, CheckCircle2, Mail, FileText, Calendar, 
  MapPin, Bed, Compass, User, ShieldCheck, 
  ArrowRight, ArrowLeft, Info, Printer, Lock, Check, Menu
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
  
  // Estados para o Header
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => { setIsMounted(true); }, []);

  // Lógica de Scroll do Header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowHeader(currentScrollY < 80 || currentScrollY < lastScrollY);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Lógica de Busca de Dados
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
        if (pData.item_id) {
          const { data: iData } = await supabase.from(tabela).select('*').eq('id', pData.item_id).maybeSingle();
          if (iData) setDetalhesItem(iData);
        }

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
        <Link href="/" className="w-full bg-[#00577C] text-white px-10 py-4 rounded-2xl font-black block hover:bg-[#004a6b] transition-colors">Voltar ao Início</Link>
      </div>
    </div>
  );

  const isHotel = pedido?.tipo_item === 'hotel';
  const tituloReserva = isHotel ? detalhesItem?.nome : detalhesItem?.titulo;
  const imagemReserva = isHotel ? detalhesItem?.imagem_url : detalhesItem?.imagem_principal;
  const nomeExibicao = pedido?.nome_cliente ? String(pedido.nome_cliente).split(' ')[0] : 'Viajante';

  return (
    <main className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col`}>
      
      {/* HEADER OFICIAL */}
      <header
        className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56">
              <Image
                src="/logop.png"
                alt="Prefeitura de São Geraldo do Araguaia"
                fill
                priority
                className="object-contain object-left"
              />
            </div>

            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>
                SagaTurismo
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Secretaria de Turismo de São Geraldo do Araguaia
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              Rota Turística
            </Link>

            <Link href="/aldeias" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              Aldeias
            </Link>

            <a href="#historia" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              História
            </a>

            <a
              href="https://saogeraldodoaraguaia.pa.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-slate-600 hover:text-[#00577C]"
            >
              Governo
            </a>

            <Link
              href="/cadastro"
              className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]"
            >
              Cartão Residente
            </Link>
          </nav>

          <button className="rounded-xl border border-slate-200 p-2 md:hidden">
            <Menu className="h-5 w-5 text-[#00577C]" />
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 mt-[80px] lg:mt-[100px] text-left">
        
        {/* MENSAGEM PRINCIPAL */}
        <div className="text-center mb-14 animate-in fade-in zoom-in-95 duration-700">
           <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-white">
              <CheckCircle2 size={40} className="text-[#009640]"/>
           </div>
           <h1 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4`}>
             Pedido Confirmado
           </h1>
           <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
             Pagamento confirmado, <span className="text-[#00577C] font-bold">{nomeExibicao}</span>. O seu número de pedido é <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{pedido?.codigo_pedido || '---'}</span>.<br/>A sua reserva em São Geraldo do Araguaia foi processada com sucesso.
           </p>
        </div>

        {/* COMPROVATIVOS E VOUCHER */}
        <div className="grid md:grid-cols-2 gap-6 mb-14 animate-in slide-in-from-bottom-6">
           <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#00577C] shadow-sm"><Mail size={24}/></div>
              <div>
                 <h3 className={`${jakarta.className} text-lg font-bold text-slate-900 mb-1`}>Confirmação no E-mail</h3>
                 <p className="text-sm text-slate-500 leading-relaxed">Enviamos os detalhes para: <br/><span className="font-bold text-slate-700">{pedido?.email_cliente}</span></p>
              </div>
           </div>
           <div className="bg-[#00577C] rounded-[2rem] p-8 shadow-xl flex flex-col gap-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12"><FileText size={80}/></div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md shadow-sm"><FileText size={24}/></div>
              <div>
                 <h3 className={`${jakarta.className} text-lg font-bold mb-1`}>Voucher Digital</h3>
                 <p className="text-sm text-white/80 leading-relaxed mb-4">O seu voucher PDF será enviado em instantes para o seu e-mail.</p>
                 <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#F9C400]">
                    <Check size={14}/> Anexado
                 </div>
              </div>
           </div>
        </div>

        {/* CARTÃO DA RESERVA */}
        <div className="w-full bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative animate-in slide-in-from-bottom-10 duration-1000">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
           
           <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row gap-8 items-center mb-10 border-b border-slate-100 pb-10">
                 <div className="relative w-full md:w-48 h-32 rounded-2xl overflow-hidden shadow-md shrink-0 bg-slate-100 border-2 border-white">
                    <img src={imagemReserva || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740'} alt="Local" className="w-full h-full object-cover" />
                 </div>
                 
                 <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg mb-3 text-[#00577C] font-black uppercase text-[10px] tracking-widest">
                       {isHotel ? <Bed size={14}/> : <Compass size={14}/>} {isHotel ? 'Alojamento Oficial' : 'Pacote Turístico'}
                    </div>
                    <h2 className={`${jakarta.className} text-3xl font-black text-slate-900 leading-tight mb-2`}>{tituloReserva || 'Reserva Oficial'}</h2>
                    <p className="text-slate-500 font-bold text-sm flex items-center justify-center md:justify-start gap-2"><MapPin size={16} className="text-[#009640]"/> São Geraldo do Araguaia - PA</p>
                 </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    {isHotel && (
                       <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><Calendar size={14}/> Check-in</p>
                            <p className="font-black text-slate-800 text-lg">{formatarData(pedido?.data_checkin)}</p>
                          </div>
                          <div className="border-l border-slate-200 pl-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><Calendar size={14}/> Check-out</p>
                            <p className="font-black text-slate-800 text-lg">{formatarData(pedido?.data_checkout)}</p>
                          </div>
                       </div>
                    )}
                    
                    {!isHotel && (
                       <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4 text-left">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#F9C400] shadow-sm"><Calendar size={24}/></div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Início</p>
                             <p className="font-black text-slate-800 text-xl mt-0.5">{formatarData(pedido?.data_checkin)}</p>
                          </div>
                       </div>
                    )}

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4 text-left">
                       <div className="flex items-center gap-3 text-slate-600 font-bold">
                          <User size={18} className="text-slate-400"/>
                          <div className="flex flex-col">
                             <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Hóspede Principal</span>
                             <span className="text-slate-800 text-sm uppercase">{pedido?.nome_cliente || '---'}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col">
                    <div className="bg-slate-900 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center relative overflow-hidden flex-1 shadow-xl">
                       <div className="absolute inset-0 bg-[#009640] opacity-10 pointer-events-none" />
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-3">Total Pago</p>
                       <p className={`${jakarta.className} text-4xl font-black text-white`}>{formatarMoeda(pedido?.valor_total)}</p>
                       <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-md">
                          <Lock size={12}/> Oficial e Seguro
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-10 pt-6 border-t border-slate-100">
                 <Link href="/" className="text-slate-500 hover:text-[#00577C] font-bold text-sm flex items-center gap-2 transition-colors">
                    <ArrowLeft size={16}/> Voltar ao Portal Principal
                 </Link>
                 <button onClick={() => window.print()} className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                    <Printer size={16}/> Imprimir Recibo
                 </button>
              </div>
           </div>
        </div>

      </div>

      <footer className="mt-auto py-10 text-center border-t border-slate-200 bg-white">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
            © {new Date().getFullYear()} · Secretaria de Turismo de São Geraldo do Araguaia
         </p>
      </footer>
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