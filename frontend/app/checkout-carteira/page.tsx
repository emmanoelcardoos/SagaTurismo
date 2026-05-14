"use client"

import Link from "next/link"
import Image from "next/image"
import { Suspense, useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus_Jakarta_Sans, Inter } from "next/font/google"
import { ShieldCheck, MapPin, Users, Loader2, ArrowLeft, CheckCircle2, IdCard, AlertCircle } from "lucide-react"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

// ─── ÍCONES ───────────────────────────────────────────────────────────────────

const IconSpinner = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)
const IconClock = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconCopy = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

// ─── CRONÓMETRO PIX ──────────────────────────────────────────────────────────

const PIX_DURATION_SECONDS = 15 * 60 // 15 minutos

function CronometroPix({ onExpirado }: { onExpirado: () => void }) {
  const inicioRef = useRef<number>(Date.now())
  const jaDisparou = useRef(false)

  const [segundosRestantes, setSegundosRestantes] = useState<number>(PIX_DURATION_SECONDS)
  const onExpiradoRef = useRef(onExpirado)
  
  useEffect(() => { onExpiradoRef.current = onExpirado })

  useEffect(() => {
    const id = setInterval(() => {
      const decorrido = Math.floor((Date.now() - inicioRef.current) / 1000)
      const restante = Math.max(0, PIX_DURATION_SECONDS - decorrido)
      setSegundosRestantes(restante)

      if (restante === 0 && !jaDisparou.current) {
        jaDisparou.current = true
        clearInterval(id)
        onExpiradoRef.current()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const minutos = Math.floor(segundosRestantes / 60)
  const segundos = segundosRestantes % 60
  const percentual = (segundosRestantes / PIX_DURATION_SECONDS) * 100

  const isUrgente = segundosRestantes <= 120
  const isCritico = segundosRestantes <= 60

  const barraColor = isCritico ? "bg-red-500" : isUrgente ? "bg-[#F9C400]" : "bg-[#009640]"
  const textoColor = isCritico ? "text-red-600" : isUrgente ? "text-amber-600" : "text-slate-700"
  const bgColor = isCritico ? "bg-red-50 border-red-200" : isUrgente ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"

  return (
    <div className={`rounded-3xl border-2 p-6 transition-all duration-500 ${bgColor}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={isCritico ? "text-red-500" : isUrgente ? "text-amber-500" : "text-slate-500"}><IconClock /></span>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Tempo para pagar</p>
        </div>
        <div className={`text-3xl font-black tabular-nums ${textoColor} ${isCritico ? "animate-pulse" : ""}`}>
          {String(minutos).padStart(2, "0")}:{String(segundos).padStart(2, "0")}
        </div>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden mb-3">
        <div className={`h-full rounded-full transition-all duration-1000 ${barraColor}`} style={{ width: `${percentual}%` }} />
      </div>
      <p className={`text-xs font-bold leading-relaxed ${isCritico ? "text-red-600" : "text-slate-500"}`}>
        {isCritico ? "⚠️ O código está prestes a expirar. Pague agora!" : "Pague dentro do prazo para concluir a emissão da carteira oficial."}
      </p>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

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
  
  // Estados do PIX gerado
  const [qrCodeData, setQrCodeData] = useState<{ link: string; texto: string; id_pedido: string } | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [pixExpirado, setPixExpirado] = useState(false)

  // Header Scroll
  const [showHeader, setShowHeader] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const PRECO_UNITARIO = 10
  const valorTotal = quantidade * PRECO_UNITARIO

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY
      setShowHeader(current < 80 || current < lastScrollY)
      setLastScrollY(current)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // 1. Validar Token e Carregar Dados Aprovados
  useEffect(() => {
    if (!token) { router.push('/cadastro'); return; }
    
    fetch(`/api/validar?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (!data.sucesso || (data.status !== 'aprovada' && data.status !== 'aguardando_pagamento' && data.status !== 'pendente')) {
           router.push(`/carteira/${token}`);
        } else {
           setDadosCidadão(data);
           setLoadingInitial(false);
        }
      })
      .catch(() => router.push('/cadastro'));
  }, [token, router]);

  // 2. Gerar PIX
  const handleGerarPix = async () => {
    setIsSubmitting(true);
    setErroApi("");

    try {
      const payload = {
        tipo_item: "carteira",
        token_id: token,
        quantidade: quantidade,
        nome_cliente: dadosCidadão.nome,
        cpf_cliente: dadosCidadão.cpf_mascarado, // O backend deve resolver a máscara
        data_nascimento: dadosCidadão.data_nascimento,
        foto_url: dadosCidadão.foto_url,
        valor_total: valorTotal,
        metodo_pagamento: "pix"
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
          id_pedido: data.pedido_id || "SGA-" + Math.floor(Math.random() * 1000000)
        });
      } else {
        setErroApi("Erro ao gerar pagamento. Tente novamente.");
      }
    } catch (err) {
      setErroApi("Falha de comunicação com a operadora PagBank.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copiarPix = () => {
    if (qrCodeData?.texto) {
      navigator.clipboard.writeText(qrCodeData.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  if (loadingInitial) return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#00577C] w-16 h-16 mb-4" />
      <p className={`${jakarta.className} text-xs font-bold text-slate-400 uppercase tracking-widest`}>A sincronizar dados aprovados...</p>
    </div>
  );

  return (
    <main className={`${inter.className} min-h-screen bg-[#F8F9FA] text-slate-900 pb-32`}>
      
      {/* ── HEADER GOVERNAMENTAL ── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56"><Image src="/logop.png" alt="Prefeitura" fill priority className="object-contain object-left" /></div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo</p>
            </div>
          </Link>
          {qrCodeData && (
            <div className="hidden md:flex items-center gap-3 text-xs font-semibold text-slate-500 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
              <span className="uppercase tracking-widest text-[9px] font-black">Protocolo</span>
              <span className="font-black text-[#00577C] font-mono tracking-wider">{qrCodeData.id_pedido}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── PROGRESS BAR ── */}
      <div className="bg-white border-b border-slate-200 mt-[70px] md:mt-[90px]">
        <div className="mx-auto max-w-7xl px-6 py-4 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest">
            <span className="text-slate-300">Solicitação</span> <span className="text-slate-200">›</span>
            <span className="text-slate-300">Análise IA</span> <span className="text-slate-200">›</span>
            <span className={qrCodeData ? "text-[#009640]" : "text-[#00577C]"}>Pagamento</span> <span className="text-slate-200">›</span>
            <span className="text-slate-300">Emissão Digital</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-start">
          
          {/* ── COLUNA ESQUERDA ── */}
          <div className="space-y-8">
            
            {/* ESTADO 1: ANTES DE GERAR O PIX */}
            {!qrCodeData ? (
               <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="h-2 w-full bg-[#00577C]" />
                  <div className="p-10 md:p-12">
                     <div className="flex items-center gap-5 mb-8">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#00577C] shadow-sm"><IdCard size={32}/></div>
                        <div>
                           <h1 className={`${jakarta.className} text-3xl font-black text-slate-900`}>Emissão de Carteira</h1>
                           <p className="text-sm font-bold text-slate-500 mt-1">Sua documentação foi validada e aprovada.</p>
                        </div>
                     </div>

                     {/* Info Aprovada */}
                     <div className="bg-slate-50 rounded-3xl p-6 mb-10 border border-slate-100 flex items-center gap-6">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md shrink-0">
                           <Image src={dadosCidadão?.foto_url || '/placeholder.png'} alt="Titular" fill className="object-cover" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Titular Aprovado</p>
                           <p className="text-xl font-bold text-slate-800">{dadosCidadão?.nome}</p>
                           <p className="text-xs font-bold text-slate-500 font-mono mt-1">CPF: {dadosCidadão?.cpf_mascarado}</p>
                        </div>
                     </div>

                     {/* Seleção de Quantidade */}
                     <div className="mb-10">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Users size={16}/> Incluir Dependentes?</p>
                        <div className="flex items-center justify-between bg-white border-2 border-slate-100 rounded-3xl p-4 shadow-sm hover:border-[#00577C] transition-colors">
                           <p className="text-sm font-bold text-slate-600 pl-4">Número de Cartões a Emitir</p>
                           <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-1.5">
                              <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white text-[#00577C] font-black text-2xl shadow-sm transition-all">-</button>
                              <span className="font-black text-2xl w-8 text-center text-[#00577C]">{quantidade}</span>
                              <button onClick={() => setQuantidade(quantidade + 1)} className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white text-[#00577C] font-black text-2xl shadow-sm transition-all">+</button>
                           </div>
                        </div>
                     </div>

                     {erroApi && <div className="mb-8 p-5 bg-red-50 text-red-600 rounded-2xl font-bold flex gap-3 text-sm"><AlertCircle size={20}/> {erroApi}</div>}

                     <button 
                        onClick={handleGerarPix} disabled={isSubmitting}
                        className="w-full bg-[#009640] hover:bg-green-700 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-4 active:scale-95"
                     >
                        {isSubmitting ? <><Loader2 className="animate-spin" size={28}/> A gerar transação segura...</> : <><QrCode size={24}/> Gerar Pagamento PIX</>}
                     </button>
                  </div>
               </div>
            ) : (
               /* ESTADO 2: PIX GERADO (O Template Solicitado) */
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  
                  {/* CARD STATUS */}
                  <div className="rounded-[2.5rem] bg-white border border-slate-200 shadow-xl overflow-hidden">
                    <div className="h-2 w-full bg-[#F9C400]" />
                    <div className="p-8 md:p-10">
                      <div className="flex items-start gap-6">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-yellow-50 shadow-inner">
                           <Loader2 className="w-8 h-8 text-[#F9C400] animate-spin" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-200 bg-yellow-50 text-amber-700 text-[10px] font-black uppercase tracking-widest mb-3">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> Aguardando Pagamento
                          </span>
                          <h1 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-3`}>
                            {pixExpirado ? "Código PIX Expirado" : "Finalize a Emissão"}
                          </h1>
                          <p className="text-sm font-bold text-slate-500 leading-relaxed">
                            {pixExpirado ? "O tempo limite esgotou. Terá de gerar um novo código de pagamento." : "O seu cartão está pré-aprovado! Efetue o pagamento via PIX para concluir a emissão digital imediata."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BLOCO PIX QR CODE */}
                  <div className="rounded-[2.5rem] bg-white border border-slate-200 shadow-xl overflow-hidden">
                    <div className="h-2 w-full bg-[#009640]" />
                    <div className="p-8 md:p-10 space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#009640] shadow-sm"><QrCode size={24}/></div>
                        <div>
                          <p className={`${jakarta.className} font-black text-slate-900 text-lg`}>Pagamento Instantâneo</p>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Escaneie ou copie o código</p>
                        </div>
                      </div>

                      {!pixExpirado && <CronometroPix onExpirado={() => setPixExpirado(true)} />}

                      {!pixExpirado && (
                        <div className="flex flex-col md:flex-row items-center gap-8">
                          {/* QR CODE IMAGE */}
                          <div className="shrink-0 rounded-[2rem] border-4 border-dashed border-slate-200 bg-slate-50 p-6 shadow-inner relative group">
                            <img src={qrCodeData.link} alt="QR Code PIX" className="w-48 h-48 object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                          </div>

                          {/* COPIA E COLA */}
                          <div className="flex-1 w-full space-y-5">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Código PIX Copia e Cola</label>
                              <input type="text" readOnly value={qrCodeData.texto} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-xs font-mono font-bold text-slate-600 outline-none truncate" />
                            </div>

                            <button onClick={copiarPix} className={`w-full flex items-center justify-center gap-3 rounded-2xl py-5 text-sm font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${copiado ? "bg-[#009640] text-white shadow-green-200" : "bg-[#00577C] hover:bg-[#004a6b] text-white shadow-blue-200"}`}>
                              {copiado ? <><CheckCircle2 size={20} /> Copiado com Sucesso!</> : <><Copy size={20} /> Copiar Código PIX</>}
                            </button>

                            <div className="flex items-start gap-3 rounded-2xl bg-blue-50 border border-blue-100 p-4">
                              <ShieldCheck className="text-[#00577C] shrink-0" size={20} />
                              <p className="text-[10px] font-bold text-[#00577C] leading-relaxed uppercase">
                                Após o pagamento, o seu Cartão de Residente será ativado automaticamente. <strong>Não feche esta página.</strong>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {pixExpirado && (
                         <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest">
                            Gerar Novo PIX
                         </button>
                      )}
                    </div>
                  </div>

                </div>
            )}
          </div>

          {/* ── COLUNA DIREITA: RESUMO STICKY ── */}
          <aside className="lg:sticky lg:top-28 space-y-6">
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00577C] via-[#F9C400] to-[#009640]" />
              
              <div className="p-10 border-b-2 border-slate-50">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4">Resumo da Solicitação</p>
                <div className="flex gap-5 items-center">
                  <div className="w-16 h-16 bg-[#F9C400]/20 rounded-2xl flex items-center justify-center shrink-0 border border-[#F9C400]/30 shadow-inner">
                     <IdCard className="text-[#00577C]" size={32}/>
                  </div>
                  <div>
                     <h3 className={`${jakarta.className} text-xl font-black text-slate-900 leading-tight mb-1`}>Cartão Residente Oficial</h3>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Taxa Única de Emissão</p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-6">
                <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                   <span className="flex items-center gap-3"><Users size={18} className="text-[#00577C]"/> Cartões a Emitir</span>
                   <span className="text-xl font-black text-slate-900">{quantidade}x</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-600 pb-6 border-b-2 border-slate-50">
                   <span className="flex items-center gap-3"><CreditCard size={18} className="text-[#009640]"/> Taxa Unitária</span>
                   <span className="text-xl font-black text-slate-900">{formatarMoeda(PRECO_UNITARIO)}</span>
                </div>
              </div>

              <div className="p-10 bg-slate-900 text-white text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full bg-[#009640] opacity-20 pointer-events-none"></div>
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60 mb-3">Total a Pagar</p>
                 <p className={`${jakarta.className} text-6xl font-black tabular-nums`}>{formatarMoeda(valorTotal)}</p>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-green-100 bg-green-50 p-6 flex items-start gap-4">
               <ShieldCheck className="text-[#009640] shrink-0" size={24}/>
               <div>
                  <p className="text-xs font-black text-[#009640] uppercase tracking-widest mb-1">Processo Seguro</p>
                  <p className="text-[10px] font-bold text-green-700 leading-relaxed">Emissão imediata após a confirmação do banco. Pagamento processado pela infraestrutura oficial do PagBank.</p>
               </div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  )
}

export default function CheckoutCarteiraPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="animate-spin text-[#00577C] w-16 h-16 mb-6" />
        <p className={`${jakarta.className} font-bold text-slate-400 uppercase tracking-[0.4em] text-xs`}>
          A preparar emissão digital...
        </p>
      </div>
    }>
      <CheckoutCarteiraContent />
    </Suspense>
  )
}