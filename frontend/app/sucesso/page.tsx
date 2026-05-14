'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, CheckCircle2, Mail, FileText, Calendar, 
  MapPin, Bed, Compass, User, Clock, ShieldCheck, 
  ArrowRight, Download, Info
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const formatarData = (dataStr: string) => {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('T')[0].split('-');
  return `${dia}/${mes}/${ano}`;
};

// ── TIPAGEM ESPERADA DA BASE DE DADOS ──
type Pedido = {
  id: string;
  tipo_item: 'hotel' | 'pacote';
  nome_cliente: string;
  email_cliente: string;
  data_checkin?: string;
  data_checkout?: string;
  valor_total: number;
  status_pagamento: string;
  // Relações com outras tabelas (Ajuste conforme o nome real das suas tabelas)
  hoteis?: { nome: string; imagem_url: string };
  pacotes?: { titulo: string; imagem_principal: string };
};

function SucessoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pedidoId = searchParams.get('pedido'); // Ex: /sucesso?pedido=12345

  const [isMounted, setIsMounted] = useState(false);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    async function fetchPedido() {
      // Se não vier o ID na URL, tentamos buscar o último pedido gerado na sessão
      // ou redirecionamos. Para testes, pode forçar um ID aqui.
      if (!pedidoId) {
        setErro('Número de pedido não encontrado na hiperligação.');
        setLoading(false);
        return;
      }

      try {
        // NOTA: Altere 'pedidos' para o nome exato da sua tabela (ex: 'reservas', 'pagamentos')
        const { data, error } = await supabase
          .from('pedidos') 
          .select(`
            *,
            hoteis (nome, imagem_url),
            pacotes (titulo, imagem_principal)
          `)
          .eq('id', pedidoId)
          .single();

        if (error || !data) throw new Error('Reserva não localizada em nosso sistema.');
        
        setPedido(data as Pedido);
      } catch (err: any) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPedido();
  }, [pedidoId]);

  if (!isMounted) return null;

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#009640] w-16 h-16 mb-4" />
      <p className={`${jakarta.className} text-xs font-bold text-slate-400 uppercase tracking-widest`}>Validando Emissão do Voucher...</p>
    </div>
  );

  if (erro && !pedido) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] px-6 text-center">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl max-w-lg">
        <Info className="w-16 h-16 text-slate-300 mx-auto mb-6" />
        <h2 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-4`}>Pedido Não Encontrado</h2>
        <p className="text-slate-500 mb-8">{erro}</p>
        <Link href="/" className="bg-[#00577C] text-white px-8 py-4 rounded-full font-bold transition-all hover:bg-[#004a6b]">Voltar ao Início</Link>
      </div>
    </div>
  );

  const isHotel = pedido?.tipo_item === 'hotel';
  const isPacote = pedido?.tipo_item === 'pacote';
  
  // Nomes e imagens caem graciosamente se a relação Supabase falhar
  const tituloReserva = isHotel ? pedido?.hoteis?.nome : pedido?.pacotes?.titulo;
  const imagemReserva = isHotel ? pedido?.hoteis?.imagem_url : pedido?.pacotes?.imagem_principal;

  return (
    <main className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col`}>
      
      {/* ── HEADER SIMPLIFICADO DE SUCESSO ── */}
      <header className="w-full border-b border-slate-200 bg-white p-4 sm:p-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logop.png" alt="Prefeitura" width={140} height={40} className="object-contain" />
            <div className="hidden border-l border-slate-200 pl-4 sm:block">
              <p className={`${jakarta.className} text-xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <ShieldCheck size={16} className="text-[#009640]"/> Transação Segura
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 lg:py-20 flex flex-col items-center">
        
        {/* ── 1. MENSAGEM PRINCIPAL DE SUCESSO ── */}
        <div className="text-center mb-12 animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-white">
              <CheckCircle2 size={56} className="text-[#009640]"/>
           </div>
           <h1 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4`}>
             Pagamento Aprovado!
           </h1>
           <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
             A sua reserva em São Geraldo do Araguaia está confirmada. Prepare as malas para uma experiência inesquecível!
           </p>
        </div>

        {/* ── 2. CARD DE INFORMAÇÃO SOBRE O VOUCHER / EMAILS ── */}
        <div className="w-full bg-blue-50/50 border border-blue-100 rounded-[2.5rem] p-8 mb-12 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
           <h3 className={`${jakarta.className} text-xl font-black text-[#00577C] mb-6 flex items-center gap-3`}>
              <Mail size={24}/> Próximos Passos
           </h3>
           <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#00577C] shrink-0 shadow-sm"><CheckCircle2 size={20}/></div>
                 <div>
                    <p className="font-bold text-slate-800 text-sm">Recibo de Pagamento</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Você receberá dentro de instantes um e-mail do PagBank com o comprovante fiscal da transação.</p>
                 </div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#00577C] shrink-0 shadow-sm"><FileText size={20}/></div>
                 <div>
                    <p className="font-bold text-slate-800 text-sm">Voucher Oficial Anexado</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Um segundo e-mail da Secretaria de Turismo chegará com o <b>PDF do seu Voucher</b> contendo todos os detalhes e regras.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* ── 3. RESUMO UNIVERSAL DA RESERVA ── */}
        <div className="w-full bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
           
           <div className="p-8 md:p-12">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2">
                 <MapPin size={14} className="text-[#00577C]"/> Resumo da sua Aventura
              </p>
              
              <div className="flex flex-col md:flex-row gap-8 mb-10 border-b border-slate-100 pb-10">
                 {/* Imagem Dinâmica */}
                 <div className="relative w-full md:w-48 h-32 rounded-2xl overflow-hidden shadow-md shrink-0 bg-slate-100">
                    <Image src={imagemReserva || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1740'} alt="Local" fill className="object-cover" />
                 </div>
                 
                 <div className="flex-1">
                    <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg mb-3">
                       {isHotel ? <Bed size={14} className="text-[#00577C]"/> : <Compass size={14} className="text-[#F9C400]"/>}
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{isHotel ? 'Hospedagem' : 'Pacote Turístico'}</span>
                    </div>
                    <h2 className={`${jakarta.className} text-3xl font-black text-slate-900 leading-tight mb-2`}>{tituloReserva || 'Reserva Oficial'}</h2>
                    
                    <div className="flex items-center gap-2 mt-4 text-sm font-bold text-slate-600 bg-slate-50 w-fit px-4 py-2 rounded-xl">
                       <User size={16} className="text-[#009640]"/> Hóspede: <span className="text-slate-900">{pedido?.nome_cliente}</span>
                    </div>
                 </div>
              </div>

              {/* DADOS ESPECÍFICOS DE HOTEL */}
              {isHotel && pedido?.data_checkin && pedido?.data_checkout && (
                <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2"><Calendar size={14}/> Check-in</p>
                     <p className="font-black text-slate-800 text-lg md:text-xl">{formatarData(pedido.data_checkin)}</p>
                     <p className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-1"><Clock size={12}/> A partir das 14:00</p>
                   </div>
                   <div className="border-l-2 border-slate-200 pl-6">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2"><Calendar size={14}/> Check-out</p>
                     <p className="font-black text-slate-800 text-lg md:text-xl">{formatarData(pedido.data_checkout)}</p>
                     <p className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-1"><Clock size={12}/> Até às 12:00</p>
                   </div>
                </div>
              )}

              {/* DADOS ESPECÍFICOS DE PACOTE (Opcional, se o pacote tiver datas salvas no pedido) */}
              {isPacote && pedido?.data_checkin && (
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8 flex items-center gap-4">
                   <Calendar className="text-[#00577C]" size={24}/>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Início do Roteiro</p>
                      <p className="font-black text-slate-800 text-xl mt-1">{formatarData(pedido.data_checkin)}</p>
                   </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Código de Confirmação</p>
                    <p className="font-mono text-lg font-black text-[#00577C]">{pedido?.id.split('-')[0].toUpperCase()}</p>
                 </div>
                 <Link href="/" className="bg-[#00577C] hover:bg-[#004a6b] text-white px-6 py-4 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2">
                    Voltar ao Portal <ArrowRight size={16}/>
                 </Link>
              </div>

           </div>
        </div>

      </div>

      <footer className="mt-auto py-10 text-center border-t border-slate-200 bg-white">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            © {new Date().getFullYear()} · Prefeitura Municipal de São Geraldo do Araguaia
         </p>
      </footer>
    </main>
  );
}

export default function SucessoReservaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="animate-spin text-[#009640] w-16 h-16 mb-4" />
      </div>
    }>
      <SucessoContent />
    </Suspense>
  );
}