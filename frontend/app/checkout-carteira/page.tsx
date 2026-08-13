'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, ShieldCheck, CheckCircle2, User, Mail, Copy, 
  Lock, Check, ChevronRight, Users, Menu, X
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const formatarMoeda = (valor: number) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const mascaraCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);
const mascaraTelefone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[2rem] border-2 border-slate-100 bg-white shadow-sm overflow-hidden ${className}`}>{children}</div>;
}

function SectionHeader({ step, title, icon }: { step: number; title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#00577C] text-white text-sm font-black shadow-md">
        {step}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[#00577C] bg-blue-50 p-2 rounded-xl hidden sm:block">{icon}</span>
        <h2 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 tracking-tight`}>{title}</h2>
      </div>
    </div>
  );
}

// ── CRONÓMETRO PIX ──
const PIX_DURATION_SECONDS = 10 * 60; // 10 minutos
function CronometroPix({ onExpirado }: { onExpirado: () => void }) {
  const [segundosRestantes, setSegundosRestantes] = useState(PIX_DURATION_SECONDS);
  
  useEffect(() => {
    const id = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) { clearInterval(id); onExpirado(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onExpirado]);

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const percent = (segundosRestantes / PIX_DURATION_SECONDS) * 100;

  return (
    <div className="rounded-3xl border-2 p-6 transition-all bg-slate-50 border-slate-200 text-left mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-[#009640] animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Aguardando Pagamento</p>
        </div>
        <div className="text-3xl font-black tabular-nums text-slate-800">
          {String(minutos).padStart(2, "0")}:{String(segundos).padStart(2, "0")}
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-[#009640] transition-all duration-1000" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function CheckoutCarteiraContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [dadosCidadão, setDadosCidadão] = useState<any>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estados Financeiros
  const PRECO_UNITARIO = 20.00; // Valor da taxa ajustado para 20,00
  const [quantidade, setQuantidade] = useState(1);
  const valorTotalReserva = quantidade * PRECO_UNITARIO;
  
  // Dados de Contacto/Faturação
  const [cpfFaturamento, setCpfFaturamento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeTitular, setNomeTitular] = useState('');
  const [emailTitular, setEmailTitular] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroApi, setErroApi] = useState('');
  const [qrCodeData, setQrCodeData] = useState<{ link: string; texto: string; id_pedido: string } | null>(null);
  const [pixExpirado, setPixExpirado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const cur = window.scrollY;
      setShowHeader(cur < 80 || cur < lastScrollY);
      setLastScrollY(cur);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // ── VALIDAÇÃO DO TOKEN & POLLING ──
  useEffect(() => {
    if (!token) { router.push('/cadastro'); return; }
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/validar?token=${token}`);
        const data = await res.json();
        
        const qtdUrl = searchParams.get('quantidade') || searchParams.get('qtd');
        const qtdMemoria = typeof window !== 'undefined' ? localStorage.getItem('saga_residente_quantidade') : null;

        // Se o servidor confirmar que já foi pago, redireciona na hora!
        if (data.status === 'ativa' || data.status === 'pago') {
          router.push(`/carteira/${token}`);
          return;
        }

        if (data && loadingInitial) {
          const nomeMemoria = typeof window !== 'undefined' ? localStorage.getItem('saga_residente_nome') : null;
          const emailMemoria = typeof window !== 'undefined' ? localStorage.getItem('saga_residente_email') : null;

          const dadosCompletos = {
            ...data,
            nome: data.nome || data.nome_cliente || nomeMemoria || 'Residente',
            email: data.email || data.email_cliente || emailMemoria || ''
          };

          setDadosCidadão(dadosCompletos);
          
          if (dadosCompletos.quantidade_pessoas) setQuantidade(Number(dadosCompletos.quantidade_pessoas));
          else if (dadosCompletos.quantidade) setQuantidade(Number(dadosCompletos.quantidade));
          else if (qtdUrl) setQuantidade(Number(qtdUrl));
          else if (qtdMemoria) setQuantidade(Number(qtdMemoria));
          
          if (dadosCompletos.cpf) setCpfFaturamento(dadosCompletos.cpf);
          setNomeTitular(dadosCompletos.nome);
          setEmailTitular(dadosCompletos.email);

          setLoadingInitial(false);
        }
      } catch (err) { 
        console.error("Falha ao puxar dados do titular", err);
        if (loadingInitial) {
            const qtdMemoria = typeof window !== 'undefined' ? localStorage.getItem('saga_residente_quantidade') : null;
            if (qtdMemoria) setQuantidade(Number(qtdMemoria));
            setLoadingInitial(false); 
        }
      }
    };

    // Executa a primeira vez
    checkStatus();
    
    // Continua a verificar de 8 em 8 segundos, independentemente de já ter gerado o QR Code ou não
    const interval = setInterval(checkStatus, 8000); 
    
    return () => clearInterval(interval);
  }, [token, router, searchParams, loadingInitial]);

  // ── INTEGRAÇÃO COM BANCO DO BRASIL ──
  const handlePagamentoPix = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi('');
    setIsSubmitting(true);

    const nomeMemoria = typeof window !== 'undefined' ? localStorage.getItem('saga_residente_nome') : null;
    const emailMemoria = typeof window !== 'undefined' ? localStorage.getItem('saga_residente_email') : null;

    const payload = {
      nome_cliente: nomeTitular || dadosCidadão?.nome || nomeMemoria || 'Titular Residente',
      cpf_cliente: cpfFaturamento.replace(/\D/g, '') || dadosCidadão?.cpf?.replace(/\D/g, '') || '00000000000',
      email_cliente: emailTitular || dadosCidadão?.email || emailMemoria || 'contato@sagaturismo.com.br',
      telefone_cliente: telefone.replace(/\D/g, '') || '11999999999',
      token_id: token,
      quantidade: quantidade
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sagaturismo-production.up.railway.app';
      
      const res = await fetch(`${apiUrl}/api/v1/pagamentos/carteira-bb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.sucesso) {
        setQrCodeData({ 
          link: data.pix_qrcode_img, 
          texto: data.pix_copia_cola, 
          id_pedido: data.codigo_pedido 
        });
      } else {
        setErroApi(data.detail || data.erro || 'Falha na comunicação com o Banco do Brasil.');
      }
    } catch (err: any) {
      setErroApi(err.message || 'Erro inesperado. Verifique a sua conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInitial) return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">A carregar a sua autorização...</p>
    </div>
  );

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 pb-20`}>
      
      {/* HEADER TIPO PREFEITURA */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 md:py-5">
          <div className="flex items-center justify-center md:justify-start gap-2 md:gap-4 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
            <span className="hidden sm:inline-block">Análise</span> <ChevronRight size={14} className="hidden sm:inline-block"/> 
            <span className="text-[#00577C] bg-blue-50 px-3 py-1.5 rounded-full flex items-center gap-2"><Lock size={12}/> Pagamento Oficial</span> <ChevronRight size={14}/> 
            <span>Carteira Ativa</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
        {/* AQUI ESTÁ A CORREÇÃO DA GRID - Removido o items-start para as colunas esticarem */}
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          
          <div className="space-y-6 md:space-y-8">
            {!qrCodeData ? (
              /* ── FORMULÁRIO PIX (BANCO DO BRASIL) ── */
              <form onSubmit={handlePagamentoPix} className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SectionCard className="p-6 md:p-10 text-left border-t-4 border-t-[#00577C]">
                  <SectionHeader step={1} title="Confirmação de Dados" icon={<ShieldCheck size={20} />} />
                  
                  {erroApi && (
                    <div className="mb-8 bg-red-50 text-red-700 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-start gap-3">
                      <Lock className="w-5 h-5 shrink-0" />
                      <p>{erroApi}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <input 
                         required 
                         value={cpfFaturamento || dadosCidadão?.cpf || ''} 
                         onChange={e => setCpfFaturamento(mascaraCPF(e.target.value))} 
                         maxLength={14} 
                         className="w-full rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] transition-colors" 
                         placeholder="CPF do Titular *" 
                       />
                       <input 
                         required 
                         value={telefone} 
                         onChange={e => setTelefone(mascaraTelefone(e.target.value))} 
                         maxLength={15} 
                         className="w-full rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] transition-colors" 
                         placeholder="WhatsApp com DDD *" 
                       />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full mt-10 py-5 rounded-[1.5rem] font-black text-lg text-white bg-[#00577C] hover:bg-[#004a6b] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="animate-spin" size={24}/> Conectando ao Banco...</>
                    ) : (
                      "Avançar ao Pagamento"
                    )}
                  </button>
                </SectionCard>
              </form>
            ) : (
              /* ── ECRÃ DE SUCESSO E QR CODE ── */
              <SectionCard className="p-8 md:p-16 text-center border-[#00577C] animate-in zoom-in-95 duration-500">
                 <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} className="text-[#00577C]"/></div>
                 <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-4`}>Fatura Gerada!</h2>
                 <p className="text-slate-500 mb-8 text-lg max-w-md mx-auto">Leia o QR Code na aplicação do seu banco. A sua carteira será ativada automaticamente e enviada para o seu e-mail assim que o pagamento for confirmado.</p>
                 
                 {!pixExpirado ? <CronometroPix onExpirado={() => setPixExpirado(true)} /> : (
                   <div className="bg-red-50 text-red-600 font-bold p-4 rounded-xl mb-6">Este código PIX expirou. Por favor, atualize a página.</div>
                 )}

                 <div className="w-64 h-64 bg-slate-50 mx-auto rounded-[3rem] p-6 border-4 border-dashed border-slate-200 mb-8 flex items-center justify-center shadow-inner relative">
                    <img src={qrCodeData.link} alt="QR Code PIX Banco do Brasil" className="w-full h-full mix-blend-multiply relative z-10" />
                 </div>
                 
                 <div className="w-full max-w-md mx-auto">
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 text-left">Código PIX Copia e Cola</label>
                    <input type="text" readOnly value={qrCodeData.texto} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-xs font-mono font-bold text-slate-500 outline-none truncate mb-4" />
                    
                    <button onClick={() => {navigator.clipboard.writeText(qrCodeData.texto); setCopiado(true); setTimeout(()=>setCopiado(false),2000)}} className={`w-full py-5 rounded-2xl text-white font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-colors ${copiado ? 'bg-[#009640]' : 'bg-[#00577C] hover:bg-[#004a6b]'}`}>
                        {copiado ? <Check size={20}/> : <Copy size={20}/>} {copiado ? 'Copiado!' : 'Copiar Código PIX'}
                    </button>
                 </div>
              </SectionCard>
            )}
          </div>

          {/* ── COLUNA DIREITA: RESUMO DA COMPRA COM SIDECAR FIXO (STICKY) ── */}
          <aside className="w-full relative order-first lg:order-last">
            {/* AQUI ESTÁ A CORREÇÃO DO STICKY - Esta div interna fica colada ao topo quando se faz scroll */}
            <div className="lg:sticky lg:top-32 space-y-6">
              <SectionCard>
                <div className="h-2 w-full bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
                <div className="p-6 md:p-8 border-b border-slate-100 text-left bg-slate-50">
                  <p className="text-[10px] font-black uppercase text-[#00577C] tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 size={14}/> Resumo da Emissão</p>
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-800 leading-tight`}>Cartão de Residente</h3>
                </div>

                <div className="p-6 md:p-8 space-y-6 text-left">
                   <div className="space-y-4 pb-6 border-b border-slate-100">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><User size={12}/> Titular da Conta Aprovado</p>
                          <p className="font-bold text-slate-800 text-sm">{dadosCidadão?.nome || 'Indisponível no momento'}</p>
                      </div>
                      {dadosCidadão?.email && (
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Mail size={12}/> Envio dos Vouchers</p>
                           <p className="font-bold text-slate-800 text-sm">{dadosCidadão.email}</p>
                        </div>
                      )}
                   </div>

                   <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-500 flex items-center gap-2"><Users size={16}/> Grupo Familiar Aprovado</span>
                      <span className="font-black text-slate-800">{quantidade} {quantidade === 1 ? 'Pessoa' : 'Pessoas'}</span>
                   </div>
                   
                   <div className="pt-4 border-t border-dashed border-slate-200 space-y-2 text-sm">
                      <div className="flex justify-between text-slate-600">
                         <span>Taxa Unitária de Emissão</span>
                         <span className="font-bold">{formatarMoeda(PRECO_UNITARIO)}</span>
                      </div>
                   </div>

                   <div className="pt-8 border-t-2 border-slate-100 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                         <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Valor Total</p>
                         <div className="bg-[#00577C]/10 px-3 py-1 rounded-full flex items-center gap-1.5 text-[#00577C] text-[10px] font-black uppercase">Tarifa Única</div>
                      </div>
                      <p className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#00577C] tabular-nums leading-none`}>
                        {formatarMoeda(valorTotalReserva)}
                      </p>
                   </div>
                </div>
              </SectionCard>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutCarteiraPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]"><Loader2 className="animate-spin text-[#00577C] w-12 h-12" /></div>}>
      <CheckoutCarteiraContent />
    </Suspense>
  );
}