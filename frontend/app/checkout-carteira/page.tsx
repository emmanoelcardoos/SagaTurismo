"use client"

import Link from "next/link"
import Image from "next/image"
import { Suspense, useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus_Jakarta_Sans, Inter } from "next/font/google"
import { ShieldCheck, MapPin, Users, Loader2, ArrowLeft, CheckCircle2, IdCard, AlertCircle, Copy, QrCode, CreditCard, Home, Smartphone } from "lucide-react"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

// ─── CRONÓMETRO PIX ───
const PIX_DURATION_SECONDS = 15 * 60 

function CronometroPix({ onExpirado }: { onExpirado: () => void }) {
  const [segundosRestantes, setSegundosRestantes] = useState<number>(PIX_DURATION_SECONDS)
  
  useEffect(() => {
    const id = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) { clearInterval(id); onExpirado(); return 0; }
        return prev - 1;
      });
    }, 1000)
    return () => clearInterval(id)
  }, [onExpirado])

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const percent = (segundosRestantes / PIX_DURATION_SECONDS) * 100;

  return (
    <div className={`rounded-3xl border-2 p-6 transition-all bg-slate-50 border-slate-200 text-left`}>
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
  )
}

function CheckoutCarteiraContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [loadingInitial, setLoadingInitial] = useState(true)
  const [dadosCidadão, setDadosCidadão] = useState<any>(null)
  
  // Estados do Pedido
  const [quantidade, setQuantidade] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [erroApi, setErroApi] = useState("")
  
  // Estados de Endereço e Contato (Necessários para o PagBank)
  const [telefone, setTelefone] = useState('')
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cep, setCep] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  // Estados do PIX gerado
  const [qrCodeData, setQrCodeData] = useState<{ link: string; texto: string; id_pedido: string } | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [pixExpirado, setPixExpirado] = useState(false)
  const [showHeader, setShowHeader] = useState(true)

  const PRECO_UNITARIO = 20 
  const valorTotal = quantidade * PRECO_UNITARIO

  // Mascaras Simples
  const mascaraCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
  const mascaraTelefone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})/, '$1-$2').slice(0, 15);
  const mascaraCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);

  useEffect(() => {
    if (!token) { router.push('/cadastro'); return; }
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/validar?token=${token}`);
        const data = await res.json();
        
        if (data.status === 'ativa') {
          router.push(`/carteira/${token}`);
          return;
        }

        if (loadingInitial && data.sucesso) {
          setDadosCidadão(data);
          setLoadingInitial(false);
        }
      } catch (err) { console.error(err); }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 8000); 
    return () => clearInterval(interval);
  }, [token, router, loadingInitial]);

  const handleGerarPix = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErroApi("");

    try {
      const payload: any = {
        tipo_item: "carteira",
        token_id: token,
        quantidade: quantidade,
        nome_cliente: dadosCidadão.nome,
        cpf_cliente: dadosCidadão.cpf_mascarado.replace(/\D/g, ''), 
        email_cliente: dadosCidadão.email || "contato@sagaturismo.com.br",
        telefone_cliente: telefone.replace(/\D/g, ''), 
        valor_total: valorTotal,
        metodo_pagamento: "pix",
        // ENDEREÇO ESTRUTURADO PARA O PAGBANK
        endereco_faturacao: {
          street: rua,
          number: numero,
          locality: bairro,
          city: cidade,
          region_code: estado.replace(/\s/g, '').toUpperCase(), 
          country: "BRA",
          postal_code: cep.replace(/\D/g, '')
        }
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/pagamentos/processar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.sucesso) {
        setQrCodeData({
          link: data.qr_code_link,
          texto: data.qr_code_text,
          id_pedido: data.codigo_pedido
        });
      } else {
        setErroApi(data.mensagem || "Erro ao gerar pagamento.");
      }
    } catch (err) {
      setErroApi("Falha de comunicação com o servidor PagBank.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInitial) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center">
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12 mb-4" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preparando Checkout Seguro...</p>
    </div>
  );

  return (
    <main className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 pb-32`}>
      
      <header className="fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-32 md:h-12 md:w-48"><Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" /></div>
          </Link>
          {qrCodeData && (
            <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100 flex items-center gap-2">
              <span className="text-[10px] font-black text-[#00577C] uppercase">Protocolo:</span>
              <span className="text-xs font-bold text-[#00577C]">{qrCodeData.id_pedido}</span>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-start">
          
          <div className="space-y-8">
            {!qrCodeData ? (
               <form onSubmit={handleGerarPix} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* 1. IDENTIFICAÇÃO */}
                  <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden p-10 md:p-12 text-left">
                     <div className="flex items-center gap-5 mb-8 text-left">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#00577C] shadow-sm"><IdCard size={28}/></div>
                        <div>
                           <h1 className={`${jakarta.className} text-3xl font-black text-slate-900`}>Emissão de Carteira</h1>
                           <p className="text-sm font-bold text-slate-500">Seus dados foram aprovados. Complete os dados de faturamento.</p>
                        </div>
                     </div>

                     <div className="grid sm:grid-cols-2 gap-6 mb-10">
                        <div className="sm:col-span-2 bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                           <img src={dadosCidadão?.foto_url} alt="Titular" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                           <div>
                              <p className="text-[10px] font-black uppercase text-slate-400">Titular</p>
                              <p className="font-bold text-slate-800">{dadosCidadão?.nome}</p>
                           </div>
                        </div>
                        <div className="sm:col-span-2">
                           <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">WhatsApp de Contato</label>
                           <input required value={telefone} onChange={e => setTelefone(mascaraTelefone(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold" placeholder="(99) 99999-9999" />
                        </div>
                     </div>

                     {/* 2. ENDEREÇO (PAGBANK) */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2 text-[#00577C]">
                           <Home size={18}/> <span className="text-xs font-black uppercase tracking-widest">Endereço de Faturamento</span>
                        </div>
                        <div className="grid sm:grid-cols-[1fr_100px] gap-4">
                           <input required value={rua} onChange={e => setRua(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold" placeholder="Rua / Avenida" />
                           <input required value={numero} onChange={e => setNumero(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-center" placeholder="Nº" />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                           <input required value={bairro} onChange={e => setBairro(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold" placeholder="Bairro" />
                           <input required value={cep} onChange={e => setCep(mascaraCEP(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold" placeholder="CEP" />
                        </div>
                        <div className="grid sm:grid-cols-[1fr_100px] gap-4">
                           <input required value={cidade} onChange={e => setCidade(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold" placeholder="Cidade" />
                           <input required value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-center uppercase" placeholder="UF" />
                        </div>
                     </div>

                     {/* 3. QUANTIDADE */}
                     <div className="mt-10 mb-10">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-4 ml-1">Quantidade de Emissões</p>
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4">
                           <p className="text-sm font-bold text-slate-600">Número de Carteiras</p>
                           <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-1.5">
                              <button type="button" onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-50 text-[#00577C] font-black text-xl">-</button>
                              <span className="font-black text-xl w-6 text-center text-[#00577C]">{quantidade}</span>
                              <button type="button" onClick={() => setQuantidade(quantidade + 1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-50 text-[#00577C] font-black text-xl">+</button>
                           </div>
                        </div>
                     </div>

                     {erroApi && <div className="mb-8 p-5 bg-red-50 text-red-600 rounded-2xl font-bold text-sm border border-red-100">{erroApi}</div>}

                     <button type="submit" disabled={isSubmitting} className="w-full bg-[#009640] hover:bg-green-700 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl transition-all flex items-center justify-center gap-4">
                        {isSubmitting ? <><Loader2 className="animate-spin" size={28}/> Processando...</> : <><QrCode size={24}/> Gerar Código PIX</>}
                     </button>
                  </div>
               </form>
            ) : (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="rounded-[2.5rem] bg-white border border-slate-200 shadow-xl overflow-hidden p-8 md:p-12 text-left">
                    <div className="flex items-center gap-4 mb-10 text-left">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#009640] shadow-sm"><QrCode size={24}/></div>
                      <h2 className={`${jakarta.className} font-black text-2xl text-slate-900`}>Pague via PIX</h2>
                    </div>

                    {!pixExpirado && <CronometroPix onExpirado={() => setPixExpirado(true)} />}

                    {!pixExpirado && (
                      <div className="flex flex-col md:flex-row items-center gap-10 mt-10">
                        <div className="shrink-0 rounded-[2.5rem] border-4 border-dashed border-slate-200 bg-slate-50 p-6 shadow-inner">
                          <img src={qrCodeData.link} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
                        </div>
                        <div className="flex-1 w-full space-y-6 text-left">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Código PIX Copia e Cola</label>
                            <input type="text" readOnly value={qrCodeData.texto} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-xs font-mono font-bold text-slate-500 outline-none truncate" />
                          </div>
                          <button onClick={() => { navigator.clipboard.writeText(qrCodeData.texto); setCopiado(true); setTimeout(()=>setCopiado(false), 2000); }} className={`w-full flex items-center justify-center gap-3 rounded-2xl py-5 text-sm font-black uppercase transition-all shadow-lg ${copiado ? "bg-[#009640] text-white" : "bg-[#00577C] text-white"}`}>
                            {copiado ? "Copiado!" : "Copiar Código"}
                          </button>
                          <p className="text-[10px] font-bold text-blue-600 bg-blue-50 p-4 rounded-xl leading-relaxed uppercase">O Cartão será ativado automaticamente após o pagamento. Não feche esta janela.</p>
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-32 space-y-6 text-left">
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
              <div className="p-10 border-b border-slate-50">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-4">Resumo do Pedido</p>
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#00577C] shadow-inner"><IdCard size={24}/></div>
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-900`}>Cartão Residente</h3>
                </div>
              </div>
              <div className="p-10 space-y-4">
                <div className="flex justify-between font-bold text-sm text-slate-500"><span>Unidades</span><span className="text-slate-900">{quantidade}x</span></div>
                <div className="flex justify-between font-bold text-sm text-slate-500"><span>Valor Unitário</span><span className="text-slate-900">{formatarMoeda(PRECO_UNITARIO)}</span></div>
                <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                   <span className="text-xs font-black uppercase text-[#00577C]">Total a Pagar</span>
                   <span className={`${jakarta.className} text-4xl font-black text-[#009640]`}>{formatarMoeda(valorTotal)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
               <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-[#00577C]"/> Transação Governamental Segura</div>
               <p className="opacity-50">PagSeguro Internet S.A.</p>
            </div>
          </aside>

        </div>
      </div>
    </main>
  )
}

export default function CheckoutCarteiraPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#00577C] w-12 h-12" /></div>}>
      <CheckoutCarteiraContent />
    </Suspense>
  )
}