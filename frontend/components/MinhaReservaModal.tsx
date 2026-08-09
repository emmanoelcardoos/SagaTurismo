'use client';

import React, { useState } from 'react';
import { 
  Search, ShieldCheck, Ticket, AlertCircle, Loader2, 
  Calendar, MapPin, User, CheckCircle2, XCircle, 
  CreditCard, Download, MessageCircle, X 
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface MinhaReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MinhaReservaModal({ isOpen, onClose }: MinhaReservaModalProps) {
  const [codigo, setCodigo] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  const [reserva, setReserva] = useState<any>(null);
  const [telefoneFornecedor, setTelefoneFornecedor] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  if (!isOpen) return null;

  const mascaraCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);

  const fecharModal = () => {
    setReserva(null);
    setCodigo('');
    setCpf('');
    setErro('');
    onClose();
  };

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
        setErro('Reserva não encontrada. Verifique os dados.');
        setLoading(false);
        return;
      }

      let fone = '';
      let parceiroId = null;

      if (pedido.tipo_item === 'hotel') {
        const { data } = await supabase.from('hoteis').select('parceiro_id').eq('id', pedido.item_id).single();
        parceiroId = data?.parceiro_id;
      } else if (pedido.tipo_item === 'pacote') {
        const { data } = await supabase.from('pacotes').select('parceiro_id').eq('id', pedido.item_id).single();
        parceiroId = data?.parceiro_id;
      } else if (pedido.tipo_item === 'passeio') {
        const { data } = await supabase.from('passeios').select('parceiro_id').eq('id', pedido.item_id).single();
        parceiroId = data?.parceiro_id;
      }

      if (parceiroId) {
        const { data: parceiro } = await supabase.from('parceiros').select('telefone').eq('id', parceiroId).single();
        if (parceiro?.telefone) fone = parceiro.telefone;
      }

      setTelefoneFornecedor(fone);
      setReserva(pedido);
      
    } catch (err) {
      console.error(err);
      setErro('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleContatoWhatsApp = () => {
    const numero = telefoneFornecedor ? telefoneFornecedor.replace(/\D/g, '') : '';
    if (!numero) {
      alert("O fornecedor não disponibilizou um contacto direto.");
      return;
    }
    const mensagem = `Olá! O meu nome é ${reserva.nome_cliente}. Tenho uma reserva confirmada (${reserva.codigo_pedido}) para "${reserva.nome_item}" e gostaria de tirar uma dúvida.`;
    window.open(`https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const handleSolicitarCancelamento = async () => { 
    const confirmacao = window.confirm("Tem a certeza que deseja cancelar esta reserva? O reembolso será processado de acordo com a política apresentada.");
    if (!confirmacao) return;

    setCancelando(true);
    
    try {
      const res = await fetch('/api/v1/pedidos/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId: reserva.id,
          valorReembolso: valorReembolsavel,
          asaasPaymentId: reserva.codigo_pedido // No futuro, substitui isto pela coluna onde guardas o ID real da transação do Asaas (ex: reserva.asaas_payment_id)
        })
      });

      const data = await res.json();

      if (!data.sucesso) {
        throw new Error(data.error || "Erro ao processar o cancelamento.");
      }

      alert("Sucesso! A reserva foi cancelada e o reembolso foi solicitado ao Asaas.");
      
      // Atualiza o ecrã instantaneamente para mostrar "Cancelada"
      setReserva({ ...reserva, status_pagamento: 'cancelado' });

    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelando(false);
    }
  };
  
  const handleBaixarVoucher = () => { 
    setGerandoPdf(true);
    setTimeout(() => {
      alert("Para gerar o PDF real silenciosamente, instalaremos a biblioteca 'html2canvas' e 'jspdf' no próximo passo.");
      setGerandoPdf(false);
    }, 1500);
  };

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  const formatarData = (data: string) => {
    if (!data) return 'N/A';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const valorTotal = reserva?.valor_total || 0;
  const taxaPlataforma = reserva?.taxa_prefeitura > 0 ? reserva.taxa_prefeitura : (valorTotal * 0.10);
  const valorReembolsavel = valorTotal - taxaPlataforma;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      
      {!reserva ? (
        /* MODAL DE LOGIN */
        <div className="w-full max-w-md bg-white rounded-[2rem] border border-slate-200 shadow-2xl relative overflow-hidden">
          <button onClick={fecharModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors z-10">
             <X size={18} />
          </button>
          
          <div className="absolute top-0 w-full h-2 bg-[#00577C]" />
          <div className="p-8 text-center flex flex-col items-center">
            <div className="bg-[#00577C]/10 text-[#00577C] w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm mt-4">
              <Ticket size={32} />
            </div>
            
            <h2 className={`${jakarta.className} text-2xl font-black text-slate-800 mb-2`}>Minha Reserva</h2>
            <p className="text-xs font-medium text-slate-500 mb-8 px-2">
              Consulte os detalhes ou solicite o cancelamento.
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
        /* MODAL DO VOUCHER (AGORA COM TODOS OS DETALHES DE VOLTA!) */
        <div id="voucher-conteudo" className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
          <button onClick={fecharModal} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur p-2 rounded-full transition-colors z-20">
             <X size={18} />
          </button>

          {/* HEADER DO VOUCHER */}
          <div className="bg-slate-900 text-white p-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-10">
               <Ticket size={160} />
            </div>
            <div className="relative z-10 pt-4">
              <div className="flex justify-between items-start mb-6">
                 <button onClick={() => setReserva(null)} className="text-slate-400 hover:text-white text-xs font-bold tracking-widest uppercase transition-colors">
                    ← Voltar
                 </button>
                 <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   {reserva.status_pagamento === 'pago' ? <><CheckCircle2 size={14} className="text-green-400"/> Confirmada</> : <><XCircle size={14} className="text-red-400"/> Pendente</>}
                 </div>
              </div>
              <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-widest">Localizador Oficial</p>
              <h2 className={`${jakarta.className} text-3xl font-black text-white`}>{reserva.codigo_pedido}</h2>
            </div>
          </div>

          <div className="p-8 space-y-6 text-left">
             <div>
                <h3 className={`${jakarta.className} text-xl font-black text-slate-800`}>{reserva.nome_item}</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Serviço de {reserva.tipo_item}</p>
             </div>

             {/* INFO GRID DETALHADO */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><User size={14}/> Titular</p>
                   <p className="text-sm font-bold text-slate-700 capitalize">{reserva.nome_cliente}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Calendar size={14}/> Início da Experiência</p>
                   <p className="text-sm font-bold text-slate-700">{formatarData(reserva.data_checkin)}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><MapPin size={14}/> Destino</p>
                   <p className="text-sm font-bold text-slate-700">São Geraldo do Araguaia - PA</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><CreditCard size={14}/> Valor Total Pago</p>
                   <p className={`${jakarta.className} text-lg font-black text-[#00577C]`}>{formatarMoeda(valorTotal)}</p>
                </div>
             </div>

             {/* BOTÕES DE AÇÃO */}
             <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button onClick={handleContatoWhatsApp} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-black text-xs uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                  <MessageCircle size={16} /> Falar com Fornecedor
                </button>
                <button onClick={handleBaixarVoucher} disabled={gerandoPdf} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {gerandoPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download size={16} /> Baixar PDF</>}
                </button>
             </div>

             {/* SECÇÃO DE CANCELAMENTO FINANCEIRO (COM DIVISÃO DE VALORES) */}
             <div className="border-t border-slate-200 pt-6 mt-6">
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
    </div>
  );
}