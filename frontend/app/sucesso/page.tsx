'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, CheckCircle2, Mail, FileText, Calendar, 
  MapPin, Bed, Compass, User, ShieldCheck, 
  ArrowRight, ArrowLeft, Info, Printer, Lock, Menu, Star
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── UTILITÁRIOS BLINDADOS ──
const formatarMoeda = (valor: any) => {
  if (!valor) return 'Sob consulta';
  const strVal = typeof valor === 'string' ? valor.replace(',', '.') : valor;
  const num = Number(strVal);
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
  const [sugestoes, setSugestoes] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowHeader(currentScrollY < 80 || currentScrollY < lastScrollY);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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

        const tabela = pData.tipo_item === 'hotel' ? 'hoteis' : 'pacotes';
        if (pData.item_id) {
          const { data: iData } = await supabase.from(tabela).select('*').eq('id', pData.item_id).maybeSingle();
          if (iData) setDetalhesItem(iData);
        }

        // 3. MAGIA DO CROSS-SELLING: Busca sugestões
        const tabelaOposta = pData.tipo_item === 'hotel' ? 'pacotes' : 'hoteis';
        const { data: sugData } = await supabase
          .from(tabelaOposta)
          .select('*')
          .limit(3); 
          
        if (sugData) setSugestoes(sugData);

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
      <p className={`${jakarta.className} text-xs font-black text-slate-400 uppercase tracking-widest`}>Sincronizando dados oficiais...</p>
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
    <main className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col overflow-x-hidden`}>
      
      {/* HEADER OFICIAL */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-10 w-28 shrink-0 sm:h-16 sm:w-56">
              <Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão Residente</Link>
          </nav>
          <button className="rounded-xl border border-slate-200 p-2 md:hidden"><Menu className="h-5 w-5 text-[#00577C]" /></button>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-5 py-12 mt-[70px] lg:mt-[100px] text-left">
        
        {/* MENSAGEM PRINCIPAL */}
        <div className="text-center mb-10 md:mb-14 animate-in fade-in zoom-in-95 duration-700">
           <div className="w-16 h-16 md:w-20 md:h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner border-4 border-white">
              <CheckCircle2 size={32} className="text-[#009640] md:w-10 md:h-10"/>
           </div>
           <h1 className={`${jakarta.className} text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-3 md:mb-4`}>
             Pedido Confirmado
           </h1>
           <p className="text-sm md:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed px-2">
             Olá <span className="text-[#00577C] font-bold">{nomeExibicao}</span>, o seu pagamento foi confirmado! O seu número de pedido é <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{pedido?.codigo_pedido || '---'}</span>.<br/>
             A sua reserva no <span className="text-[#00577C] font-bold">{tituloReserva || 'serviço'}</span> foi efetuada com sucesso.
           </p>
        </div>

        {/* COMPROVATIVOS E VOUCHER */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-10 md:mb-14">
           <div className="bg-white border border-slate-200 rounded-3xl md:rounded-[2rem] p-6 md:p-8 shadow-sm flex items-center md:flex-col md:items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#00577C] shrink-0"><Mail size={24}/></div>
              <div>
                 <h3 className={`${jakarta.className} text-base md:text-lg font-bold text-slate-900 mb-1`}>Confirmação no E-mail</h3>
                 <p className="text-xs md:text-sm text-slate-500 leading-relaxed truncate md:whitespace-normal">Enviado para: <span className="font-bold text-slate-700">{pedido?.email_cliente}</span></p>
              </div>
           </div>
           <div className="bg-[#00577C] rounded-3xl md:rounded-[2rem] p-6 md:p-8 shadow-xl flex items-center md:flex-col md:items-start gap-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 pointer-events-none"><FileText size={80}/></div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md shrink-0"><FileText size={24}/></div>
              <div className="relative z-10">
                 <h3 className={`${jakarta.className} text-base md:text-lg font-bold mb-1`}>Voucher Digital</h3>
                 <p className="text-xs md:text-sm text-white/80 leading-relaxed">O seu voucher em PDF será enviado em instantes.</p>
              </div>
           </div>
        </div>

        {/* CARTÃO DA RESERVA */}
        <div className="w-full bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative animate-in slide-in-from-bottom-10 duration-1000 mb-12">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
           
           <div className="p-6 md:p-12">
              <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center mb-8 md:mb-10 border-b border-slate-100 pb-8 md:pb-10">
                 <div className="relative w-full md:w-56 h-40 md:h-40 rounded-2xl md:rounded-3xl overflow-hidden shadow-md shrink-0 bg-slate-100 border-2 border-white">
                    <img src={imagemReserva || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740'} alt="Local" className="w-full h-full object-cover" />
                 </div>
                 
                 <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg mb-3 text-[#00577C] font-black uppercase text-[9px] md:text-[10px] tracking-widest">
                       {isHotel ? <Bed size={14}/> : <Compass size={14}/>} {isHotel ? 'Alojamento Oficial' : 'Pacote Turístico'}
                    </div>
                    <h2 className={`${jakarta.className} text-2xl md:text-4xl font-black text-slate-900 leading-tight mb-2`}>{tituloReserva || 'Reserva Oficial'}</h2>
                    <p className="text-slate-500 font-bold text-xs md:text-sm flex items-center justify-center md:justify-start gap-1.5"><MapPin size={14} className="text-[#009640]"/> São Geraldo do Araguaia - PA</p>
                 </div>
              </div>

              <div className="grid md:grid-cols-[1.2fr_1fr] gap-8 md:gap-12 items-center">
                 <div className="space-y-6 md:space-y-8">
                    {isHotel && (
                       <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-100">
                          <div>
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5"><Calendar size={14}/> Check-in</p>
                            <p className="font-black text-slate-800 text-base md:text-lg">{formatarData(pedido?.data_checkin)}</p>
                          </div>
                          <div className="border-l border-slate-200 pl-4">
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5"><Calendar size={14}/> Check-out</p>
                            <p className="font-black text-slate-800 text-base md:text-lg">{formatarData(pedido?.data_checkout)}</p>
                          </div>
                       </div>
                    )}
                    
                    {!isHotel && (
                       <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-100 flex items-center gap-4 text-left">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-[#F9C400] shadow-sm shrink-0"><Calendar size={20} className="md:w-6 md:h-6"/></div>
                          <div>
                             <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Data Agendada</p>
                             <p className="font-black text-slate-800 text-lg md:text-xl">{formatarData(pedido?.data_checkin)}</p>
                          </div>
                       </div>
                    )}

                    <div className="text-left bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                       <div className="flex items-center gap-3 text-slate-600 font-bold">
                          <User size={18} className="text-slate-300 shrink-0"/>
                          <div className="flex flex-col overflow-hidden">
                             <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Hóspede / Viajante Principal</span>
                             <span className="text-slate-800 text-sm md:text-base uppercase truncate">{pedido?.nome_cliente || '---'}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Resumo de Pagamento Elegante */}
                 <div className="bg-white border-2 border-slate-100 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 space-y-4 md:space-y-6 relative overflow-hidden">
                    <div className="flex justify-between items-center text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">
                       <span>Total Pago</span>
                       <span className="bg-green-100 text-[#009640] px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] flex items-center gap-1.5 shrink-0">
                          <ShieldCheck size={12}/> Confirmado
                       </span>
                    </div>
                    <p className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900`}>{formatarMoeda(pedido?.valor_total)}</p>
                    
                    <div className="pt-4 md:pt-6 border-t border-slate-100 flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <Lock size={12} className="md:w-3.5 md:h-3.5 text-slate-300"/> Transação Segura
                    </div>
                 </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 md:gap-6 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-100">
                 <Link href="/" className="text-slate-500 hover:text-[#00577C] font-bold text-xs md:text-sm flex items-center gap-2 transition-colors">
                    <ArrowLeft size={16}/> Voltar ao Início
                 </Link>
                 <button onClick={() => window.print()} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-6 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-95 shadow-sm">
                    <Printer size={16} className="md:w-[18px] md:h-[18px]"/> Imprimir Recibo
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* ── SECÇÃO CROSS-SELLING (COERENTE E AMIGÁVEL) ── */}
      {sugestoes.length > 0 && (
        <section className="w-full bg-white py-16 md:py-24 px-5 border-t border-slate-200">
          <div className="max-w-7xl mx-auto text-left">
            <div className="mb-10 md:mb-12 text-center md:text-left flex flex-col items-center md:items-start">
              <span className="inline-flex items-center gap-1.5 bg-[#00577C]/10 text-[#00577C] px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm">
                 <Star size={12} className="fill-[#00577C]" /> Recomendação Especial para Si
              </span>
              
              <h2 className={`${jakarta.className} text-2xl md:text-4xl font-black text-slate-900 mt-4 md:mt-5 leading-tight max-w-3xl`}>
                <span className="text-[#00577C]">{nomeExibicao}</span>, {isHotel 
                  ? 'leve a sua estadia para o próximo nível!' 
                  : 'garanta o descanso perfeito após a aventura!'}
              </h2>
              
              <p className="text-slate-500 font-medium mt-3 max-w-2xl text-sm md:text-base leading-relaxed">
                {isHotel
                  ? 'Como já garantiu o seu alojamento, veja as experiências turísticas e passeios mais procurados para aproveitar ao máximo a nossa cidade.'
                  : 'Veja as opções de hotéis e pousadas mais bem avaliadas para completar a sua viagem com todo o conforto e segurança.'}
              </p>
            </div>

            {/* Grelha Mobile First (1 coluna no mobile, 2 no tablet, 3 no desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {sugestoes.map((item) => {
                const isSugestaoHotel = !isHotel; 
                const img = isSugestaoHotel ? item.imagem_url : item.imagem_principal;
                const titulo = isSugestaoHotel ? item.nome : item.titulo;
                const preco = isSugestaoHotel ? item.quarto_standard_preco : item.preco;
                const linkDestino = isSugestaoHotel ? `/hoteis/${item.id}` : `/passeios/${item.id}`;

                return (
                  <Link href={linkDestino} key={item.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block flex flex-col h-full">
                    <div className="relative h-48 md:h-52 w-full overflow-hidden shrink-0">
                      <img src={img || 'https://images.unsplash.com/photo-1542314831-c53cd6b7608b?q=80&w=1740'} alt={titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-900 px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-black flex items-center gap-1.5 shadow-sm">
                         {isSugestaoHotel ? <><Bed size={12} className="text-[#00577C]"/> Alojamento</> : <><Compass size={12} className="text-[#009640]"/> Experiência</>}
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className={`${jakarta.className} text-base md:text-lg font-bold text-slate-900 mb-2 line-clamp-2`}>{titulo}</h3>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-4">
                        <MapPin size={14} className="text-[#009640] shrink-0"/> São Geraldo do Araguaia
                      </p>
                      
                      <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-100">
                         <div>
                           <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-wider">A partir de</p>
                           <p className="text-[#00577C] font-black text-lg md:text-xl">{formatarMoeda(preco)}</p>
                         </div>
                         <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-50 flex items-center justify-center text-[#00577C] border border-slate-100 group-hover:bg-[#00577C] group-hover:text-white transition-all shadow-sm">
                           <ArrowRight size={18} className="md:w-5 md:h-5"/>
                         </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            <div className="mt-10 md:mt-14 text-center">
               <Link href={isHotel ? '/passeios' : '/hoteis'} className="inline-flex items-center justify-center gap-2 bg-slate-50 text-[#00577C] font-black uppercase tracking-widest text-[10px] md:text-xs px-6 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm active:scale-95">
                 Ver {isHotel ? 'todas as experiências' : 'todos os alojamentos'} <ArrowRight size={16}/>
               </Link>
            </div>
          </div>
        </section>
      )}

      <footer className="mt-auto py-8 md:py-12 text-center border-t border-slate-200 bg-[#F8F9FA]">
         <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.5em] px-4 leading-relaxed">
            © {new Date().getFullYear()} · Secretaria de Turismo de São Geraldo do Araguaia
         </p>
      </footer>
    </main>
  );
}

export default function SucessoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="animate-spin text-[#009640] w-12 h-12" /></div>}>
      <SucessoContent />
    </Suspense>
  );
}