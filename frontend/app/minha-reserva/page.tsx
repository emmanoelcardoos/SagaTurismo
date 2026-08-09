'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, ShieldCheck, Ticket, AlertCircle, Loader2, 
  Calendar, MapPin, User, CheckCircle2, XCircle, 
  CreditCard, Download, MessageCircle, Info 
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function MinhaReservaPage() {
  const [codigo, setCodigo] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  const [reserva, setReserva] = useState<any>(null);
  const [cancelando, setCancelando] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const mascaraCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);

  const handleBuscarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const cpfLimpo = cpf.replace(/\D/g, ''); 

    if (!codigo || cpfLimpo.length !== 11) {
      setErro('Por favor, preencha o código da reserva e o CPF completo.');
      return;
    }

    setLoading(true);

    try {
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('codigo_pedido', codigo)
        .eq('cpf_cliente', cpfLimpo)
        .single();

      if (error || !pedido) {
        setErro('Reserva não encontrada. Verifique se o Código e o CPF estão corretos.');
        setLoading(false);
        return;
      }

      setReserva(pedido);
      
    } catch (err) {
      console.error(err);
      setErro('Erro de conexão com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarCancelamento = async () => {
    const confirmacao = window.confirm("Tem a certeza que deseja cancelar esta reserva? O reembolso será processado de acordo com a política apresentada.");
    if (!confirmacao) return;

    setCancelando(true);
    setTimeout(() => {
      alert("Aviso: A integração com o Asaas para estorno automático será configurada na próxima etapa!");
      setCancelando(false);
    }, 2000);
  };

  // FUNÇÃO: Abrir WhatsApp do Parceiro
  const handleContatoWhatsApp = () => {
    // NOTA: Num cenário real, o telefone_parceiro vem da query do Supabase. 
    // Para já usamos um placeholder dinâmico, mas a lógica da mensagem já está montada!
    const telefoneParceiro = "5594999999999"; 
    const mensagem = `Olá! O meu nome é ${reserva.nome_cliente}. Tenho uma reserva confirmada (${reserva.codigo_pedido}) para o serviço "${reserva.nome_item}" e gostaria de tirar uma dúvida.`;
    
    const url = `https://wa.me/${telefoneParceiro}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  // FUNÇÃO: Gerar e Baixar PDF (Simulação visual para agora)
  const handleBaixarVoucher = () => {
    setGerandoPdf(true);
    setTimeout(() => {
      alert("Para gerar o PDF real silenciosamente, instalaremos a biblioteca 'html2canvas' e 'jspdf' no próximo passo. O botão já está pronto!");
      setGerandoPdf(false);
    }, 1500);
  };

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  const formatarData = (data: string) => {
    if (!data) return 'N/A';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // CÁLCULOS FINANCEIROS DO REEMBOLSO (Assumindo taxa de 10% ou puxando da base)
  const valorTotal = reserva?.valor_total || 0;
  const taxaPlataforma = reserva?.taxa_prefeitura > 0 ? reserva.taxa_prefeitura : (valorTotal * 0.10);
  const valorReembolsavel = valorTotal - taxaPlataforma;

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 flex flex-col items-center py-12 px-4`}>
      
      {!reserva ? (
        <div className="w-full max-w-md bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden relative mt-10">
          <div className="absolute top-0 w-full h-2 bg-[#00577C]" />
          
          <div className="p-8 md:p-10 text-center flex flex-col items-center">
            <Link href="/">
              <Image src="/logop.png" alt="SagaTurismo" width={140} height={50} className="object-contain mb-6" />
            </Link>
            
            <div className="bg-[#00577C]/10 text-[#00577C] w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <Ticket size={32} />
            </div>
            
            <h1 className={`${jakarta.className} text-2xl font-black text-slate-800 mb-2`}>Aceder à Minha Reserva</h1>
            <p className="text-xs font-medium text-slate-500 mb-8 px-4">
              Consulte os detalhes, faça o download do voucher ou solicite o cancelamento da sua viagem.
            </p>

            <form onSubmit={handleBuscarReserva} className="w-full space-y-4 text-left">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">Código do Pedido</label>
                <input required type="text" value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} placeholder="Ex: SAGA-XYZ123" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider outline-none focus:border-[#00577C] focus:bg-white transition-all" />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">CPF do Titular</label>
                <input required type="text" value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} maxLength={14} placeholder="000.000.000-00" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-[#00577C] focus:bg-white transition-all" />
              </div>

              {erro && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
                  <AlertCircle size={16} /> {erro}
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-[#00577C] hover:bg-[#004466] disabled:bg-slate-300 text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 mt-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search size={18} /> Procurar Reserva</>}
              </button>
            </form>
          </div>
        </div>
      ) : (

      /* VOUCHER COM DETALHES FINANCEIROS E NOVOS BOTÕES */
        <div id="voucher-conteudo" className="w-full max-w-2xl bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 mt-4">
          
          {/* Header do Voucher */}
          <div className="bg-slate-900 text-white p-8 md:p-10 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-10">
               <Ticket size={160} />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                 <button onClick={() => setReserva(null)} className="text-slate-400 hover:text-white text-xs font-bold tracking-widest uppercase transition-colors">
                    ← Sair
                 </button>
                 <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   {reserva.status_pagamento === 'pago' ? <><CheckCircle2 size={14} className="text-green-400"/> Confirmada</> : <><XCircle size={14} className="text-red-400"/> Cancelada/Pendente</>}
                 </div>
              </div>
              <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-widest">Localizador Oficial</p>
              <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-white`}>{reserva.codigo_pedido}</h2>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-8 text-left">
             <div>
                <h3 className={`${jakarta.className} text-xl font-black text-slate-800`}>{reserva.nome_item}</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Serviço de {reserva.tipo_item}</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><User size={14} className="text-slate-400"/> Titular</p>
                   <p className="text-sm font-bold text-slate-700 capitalize">{reserva.nome_cliente}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Calendar size={14} className="text-slate-400"/> Início da Experiência</p>
                   <p className="text-sm font-bold text-slate-700">{formatarData(reserva.data_checkin)}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><MapPin size={14} className="text-slate-400"/> Destino</p>
                   <p className="text-sm font-bold text-slate-700">São Geraldo do Araguaia - PA</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><CreditCard size={14} className="text-slate-400"/> Valor Total Pago</p>
                   <p className={`${jakarta.className} text-lg font-black text-[#00577C]`}>{formatarMoeda(valorTotal)}</p>
                </div>
             </div>

             {/* NOVOS BOTÕES DE AÇÃO RÁPIDA */}
             <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button onClick={handleContatoWhatsApp} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-black text-xs uppercase tracking-widest py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                  <MessageCircle size={16} /> Falar com Fornecedor
                </button>
                <button onClick={handleBaixarVoucher} disabled={gerandoPdf} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {gerandoPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download size={16} /> Baixar PDF</>}
                </button>
             </div>

             {/* SECÇÃO DE CANCELAMENTO FINANCEIRO (COM DIVISÃO DE VALORES) */}
             <div className="border-t border-slate-200 pt-8 mt-8">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className={`${jakarta.className} text-base font-black text-slate-800`}>Condições de Cancelamento</h4>
                    <p className="text-sm font-medium text-slate-500 mt-1 mb-4 leading-relaxed">
                      O cancelamento desta reserva é irreversível. A taxa de serviço da plataforma não é reembolsável. O valor restante será devolvido automaticamente para a sua conta/cartão.
                    </p>
                    
                    {/* BREAKDOWN FINANCEIRO */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 mb-6">
                       <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                          <span>Valor Original da Reserva</span>
                          <span>{formatarMoeda(valorTotal)}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                          <span>Taxa da Plataforma (Retida)</span>
                          <span className="text-amber-600">-{formatarMoeda(taxaPlataforma)}</span>
                       </div>
                       <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor do Reembolso</span>
                          <span className={`${jakarta.className} text-lg font-black text-slate-800`}>{formatarMoeda(valorReembolsavel)}</span>
                       </div>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleSolicitarCancelamento} 
                  disabled={cancelando || reserva.status_pagamento !== 'pago'}
                  className="w-full bg-white hover:bg-red-50 text-red-600 border-2 border-red-100 hover:border-red-200 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {cancelando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle size={16} /> Confirmar Cancelamento ({formatarMoeda(valorReembolsavel)})</>}
                </button>
             </div>
          </div>
        </div>
      )}

    </main>
  );
}