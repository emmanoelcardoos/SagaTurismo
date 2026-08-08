'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, CheckCircle2, Mail, FileText, Calendar, 
  MapPin, Bed, Compass, User, ShieldCheck, 
  ArrowRight, ArrowLeft, Info, Printer, Lock, Menu, Star, X, Clock
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

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
  const [asaasData, setAsaasData] = useState<any>(null);
  const [sugestoes, setSugestoes] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Função para consultar o Asaas a cada 5 segundos se o PIX estiver pendente
  useEffect(() => {
    let intervalo: NodeJS.Timeout;

    async function verificarStatusPagamento() {
      if (!pedidoId) {
        setErro('Protocolo não identificado na URL.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/asaas/check-payment?paymentId=${pedidoId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error('Não foi possível localizar este pagamento no sistema financeiro.');
        }

        setAsaasData(data);

        // Se for a primeira vez que carrega, puxamos as sugestões de cross-selling
        if (sugestoes.length === 0) {
          const descricao = data.description || '';
          let tipoInferred = 'pacote';
          if (descricao.includes('Hotel')) tipoInferred = 'hotel';
          if (descricao.includes('Passeio')) tipoInferred = 'passeio';

          const tabelaOposta = tipoInferred === 'hotel' ? 'passeios' : 'hoteis';
          const { data: sugData } = await supabase.from(tabelaOposta).select('*').limit(3); 
          if (sugData) setSugestoes(sugData);
        }

        setLoading(false);

        // Se estiver pendente, continua a verificar a cada 5 segundos (útil para PIX)
        if (data.status === 'PENDING') {
          intervalo = setTimeout(verificarStatusPagamento, 5000);
        }

      } catch (err: any) {
        setErro(err.message);
        setLoading(false);
      }
    }
    
    if (pedidoId) verificarStatusPagamento();

    return () => { if (intervalo) clearTimeout(intervalo); };
  }, [pedidoId]);

  if (!isMounted) return null;

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#009640] w-16 h-16 mb-4" />
      <p className={`${jakarta.className} text-xs font-black text-slate-400 uppercase tracking-widest`}>Sincronizando sistema financeiro...</p>
    </div>
  );

  if (erro && !asaasData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] px-6 text-center">
      <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl max-w-lg">
        <Info className="text-amber-500 w-16 h-16 mx-auto mb-6" />
        <h2 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-4`}>Pedido Pendente</h2>
        <p className="text-slate-500 mb-10 leading-relaxed font-medium">{erro}</p>
        <Link href="/" className="w-full bg-[#00577C] text-white px-10 py-4 rounded-2xl font-black block hover:bg-[#004a6b] transition-colors">Voltar ao Início</Link>
      </div>
    </div>
  );

  // Análise dos Dados do Asaas
  const statusAsaas = asaasData?.status; // PENDING, CONFIRMED, RECEIVED, OVERDUE, etc.
  const isConfirmado = statusAsaas === 'CONFIRMED' || statusAsaas === 'RECEIVED';
  const isPendente = statusAsaas === 'PENDING';
  
  const descricao = asaasData?.description || 'Reserva Oficial';
  const isHotel = descricao.includes('Hotel');
  const isPasseio = descricao.includes('Passeio');

  return (
    <main className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col overflow-x-hidden`}>
      
      {/* HEADER OFICIAL */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Roteiros','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
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
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Roteiros</Link>
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-5 py-12 mt-[70px] lg:mt-[100px] text-left">
        
        {/* MENSAGEM PRINCIPAL DINÂMICA (ASSAAS) */}
        <div className="text-center mb-10 md:mb-14 animate-in fade-in zoom-in-95 duration-700">
           {isConfirmado ? (
             <>
               <div className="w-16 h-16 md:w-20 md:h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner border-4 border-white">
                  <CheckCircle2 size={32} className="text-[#009640] md:w-10 md:h-10"/>
               </div>
               <h1 className={`${jakarta.className} text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-3 md:mb-4`}>
                 Pagamento Confirmado!
               </h1>
               <p className="text-sm md:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed px-2">
                 Tudo certo! A sua reserva para <span className="text-[#00577C] font-bold">{descricao}</span> foi liquidada com sucesso no sistema. O seu ID único de transação é <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{pedidoId}</span>.
               </p>
             </>
           ) : isPendente ? (
             <>
               <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner border-4 border-white">
                  <Clock size={32} className="text-amber-500 md:w-10 md:h-10 animate-pulse"/>
               </div>
               <h1 className={`${jakarta.className} text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-3 md:mb-4`}>
                 Aguardando PIX...
               </h1>
               <p className="text-sm md:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed px-2">
                 Recebemos o seu pedido <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{pedidoId}</span>. Estamos aguardando a confirmação do pagamento no banco. <strong>Esta página atualizará automaticamente assim que for pago.</strong>
               </p>
             </>
           ) : (
             <>
               <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner border-4 border-white">
                  <Info size={32} className="text-red-500 md:w-10 md:h-10"/>
               </div>
               <h1 className={`${jakarta.className} text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-3 md:mb-4`}>
                 Pagamento Expirado
               </h1>
               <p className="text-sm md:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed px-2">
                 O tempo limite para o pagamento deste pedido expirou ou foi cancelado. Por favor, volte e tente reservar novamente.
               </p>
             </>
           )}
        </div>

        {/* COMPROVATIVOS E VOUCHER */}
        {isConfirmado && (
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-10 md:mb-14">
             <div className="bg-white border border-slate-200 rounded-3xl md:rounded-[2rem] p-6 md:p-8 shadow-sm flex items-center md:flex-col md:items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#00577C] shrink-0"><Mail size={24}/></div>
                <div>
                   <h3 className={`${jakarta.className} text-base md:text-lg font-bold text-slate-900 mb-1`}>Confirmação no E-mail</h3>
                   <p className="text-xs md:text-sm text-slate-500 leading-relaxed truncate md:whitespace-normal">O recibo foi enviado pelo emissor.</p>
                </div>
             </div>
             <div className="bg-[#00577C] rounded-3xl md:rounded-[2rem] p-6 md:p-8 shadow-xl flex items-center md:flex-col md:items-start gap-4 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 pointer-events-none"><FileText size={80}/></div>
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md shrink-0"><FileText size={24}/></div>
                <div className="relative z-10">
                   <h3 className={`${jakarta.className} text-base md:text-lg font-bold mb-1`}>Voucher Digital</h3>
                   <p className="text-xs md:text-sm text-white/80 leading-relaxed">Guarde o número do seu pedido para o check-in.</p>
                </div>
             </div>
          </div>
        )}

        {/* CARTÃO DA RESERVA */}
        <div className="w-full bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative animate-in slide-in-from-bottom-10 duration-1000 mb-12">
           <div className={`absolute top-0 left-0 w-full h-2 ${isConfirmado ? 'bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]' : 'bg-amber-400'}`} />
           
           <div className="p-6 md:p-12">
              <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center mb-8 md:mb-10 border-b border-slate-100 pb-8 md:pb-10">
                 
                 <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg mb-3 text-[#00577C] font-black uppercase text-[9px] md:text-[10px] tracking-widest">
                       {isHotel ? <Bed size={14}/> : <Compass size={14}/>} {isHotel ? 'Alojamento Oficial' : isPasseio ? 'Expedição / Passeio' : 'Pacote Turístico'}
                    </div>
                    <h2 className={`${jakarta.className} text-2xl md:text-4xl font-black text-slate-900 leading-tight mb-2`}>{descricao}</h2>
                    <p className="text-slate-500 font-bold text-xs md:text-sm flex items-center justify-center md:justify-start gap-1.5"><MapPin size={14} className="text-[#009640]"/> São Geraldo do Araguaia - PA</p>
                 </div>
              </div>

              <div className="grid md:grid-cols-[1.2fr_1fr] gap-8 md:gap-12 items-center">
                 <div className="space-y-6 md:space-y-8">
                    <div className="text-left bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                       <div className="flex items-center gap-3 text-slate-600 font-bold">
                          <User size={18} className="text-slate-300 shrink-0"/>
                          <div className="flex flex-col overflow-hidden">
                             <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-0.5">ID da Transação Asaas</span>
                             <span className="text-slate-800 text-sm md:text-base uppercase truncate">{pedidoId}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Resumo de Pagamento Elegante */}
                 <div className={`border-2 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 space-y-4 md:space-y-6 relative overflow-hidden text-left ${isConfirmado ? 'bg-white border-slate-100' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex justify-between items-center text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">
                       <span>Valor</span>
                       <span className={`${isConfirmado ? 'bg-green-100 text-[#009640]' : 'bg-amber-200 text-amber-800'} px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] flex items-center gap-1.5 shrink-0`}>
                          {isConfirmado ? <><ShieldCheck size={12}/> Confirmado</> : <><Clock size={12}/> Pendente</>}
                       </span>
                    </div>
                    <p className={`${jakarta.className} text-4xl md:text-5xl font-black ${isConfirmado ? 'text-slate-900' : 'text-amber-700'}`}>{formatarMoeda(asaasData?.value)}</p>
                    
                    <div className="pt-4 md:pt-6 border-t border-slate-100/50 flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <Lock size={12} className="md:w-3.5 md:h-3.5 text-slate-300"/> Transação Segura via Banco Central
                    </div>
                 </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 md:gap-6 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-100">
                 <Link href="/" className="text-slate-500 hover:text-[#00577C] font-bold text-xs md:text-sm flex items-center gap-2 transition-colors">
                    <ArrowLeft size={16}/> Voltar ao Início
                 </Link>
                 {isConfirmado && (
                   <button onClick={() => window.print()} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-6 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-95 shadow-sm cursor-pointer">
                      <Printer size={16} className="md:w-[18px] md:h-[18px]"/> Imprimir Recibo
                   </button>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* ── SECÇÃO CROSS-SELLING ── */}
      {sugestoes.length > 0 && isConfirmado && (
        <section className="w-full bg-white py-16 md:py-24 px-5 border-t border-slate-200">
          <div className="max-w-7xl mx-auto text-left">
            <div className="mb-10 md:mb-12 text-center md:text-left flex flex-col items-center md:items-start">
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-[#00577C] px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm">
                 <Star size={12} className="fill-[#00577C]" /> Recomendação Especial para Si
              </span>
              
              <h2 className={`${jakarta.className} text-2xl md:text-4xl font-black text-slate-900 mt-4 md:mt-5 leading-tight max-w-3xl`}>
                Veja também estas opções incríveis!
              </h2>
              
              <p className="text-slate-500 font-medium mt-3 max-w-2xl text-sm md:text-base leading-relaxed">
                {isHotel
                  ? 'Como já garantiu o seu alojamento, veja as experiências turísticas e passeios mais procurados para aproveitar ao máximo a nossa cidade.'
                  : 'Veja as opções de hotéis e locais de estadia mais bem avaliados para completar a sua viagem com todo o conforto e segurança.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {sugestoes.map((item) => {
                const isSugestaoHotel = item.quarto_standard_preco !== undefined; 
                const img = isSugestaoHotel ? item.imagem_url : item.imagem_principal;
                const titulo = isSugestaoHotel ? item.nome : item.titulo;
                const preco = isSugestaoHotel ? item.quarto_standard_preco : (item.valor_total || item.preco);
                const linkDestino = isSugestaoHotel ? `/hoteis/${item.id}` : `/passeios/${item.id}`;

                return (
                  <Link href={linkDestino} key={item.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block flex flex-col h-full">
                    <div className="relative h-48 md:h-52 w-full overflow-hidden shrink-0 bg-slate-100">
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
                         <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#00577C] group-hover:bg-[#00577C] group-hover:text-white transition-all shadow-sm">
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