'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bird, MapPin, ShieldCheck, User, Calendar, CreditCard, Printer, Loader2, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';

interface CarteiraData {
  sucesso: boolean;
  nome?: string;
  cpf_mascarado?: string;
  data_nascimento?: string;
  foto_url?: string;
  status?: string;
  mensagem?: string;
}

export default function CarteiraDigitalPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<CarteiraData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/validar?token=${params.token}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-forest mx-auto" />
        <p className="text-sm font-medium text-stone-500">A carregar sua Carteira Digital...</p>
      </div>
    </div>
  );

  if (!data || !data.sucesso) return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center bg-stone-100">
      <div className="bg-red-50 text-red-600 p-8 rounded-[2rem] border border-red-100 max-w-sm shadow-xl animate-fade-up">
        <ShieldCheck className="w-16 h-16 text-red-300 mx-auto mb-6" />
        <h2 className="text-xl font-black mb-2">Documento Inválido</h2>
        <p className="text-sm opacity-80 mb-6">{data?.mensagem || "Não encontramos uma carteira ativa para este link."}</p>
        
        {/* LIGAÇÃO ATUALIZADA PARA O CHECKOUT */}
        <Link href="/checkout-carteira" className="inline-block bg-red-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors">
          Finalizar Solicitação
        </Link>
      </div>
    </div>
  );

  const expira = "29/04/2027";

  return (
    <div className="min-h-screen bg-stone-200 flex flex-col items-center justify-center p-4 md:p-8">
      {/* --- CARTEIRA HORIZONTAL PREMIUM --- */}
      <div id="carteira-digital" className="w-full max-w-[750px] aspect-[1.6/1] bg-white rounded-[2rem] shadow-2xl overflow-hidden relative border border-stone-300 flex flex-col animate-fade-up no-print">
        
        <div className="bg-forest p-5 px-10 flex justify-between items-center z-20 shadow-md">
          <div className="flex items-center gap-4">
             <div className="bg-white p-2 rounded-xl shadow-sm">
                <Bird className="w-6 h-6 text-forest" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-leaf leading-none uppercase tracking-widest">Prefeitura Municipal de</p>
                <h2 className="text-lg font-black text-white leading-tight">SÃO GERALDO DO ARAGUAIA</h2>
             </div>
          </div>
          <div className="text-right border-l border-white/20 pl-6">
             <p className="text-[11px] font-black text-leaf uppercase">Cartão do Residente</p>
             <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">SagaTurismo Oficial</p>
          </div>
        </div>

        <div className="flex-1 flex relative">
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none p-10 grid grid-cols-3 gap-10 rotate-[-15deg] scale-110">
              {Array.from({length: 12}).map((_, i) => (
                  <p key={i} className="text-sm font-black text-forest uppercase tracking-widest whitespace-nowrap">SERRA DAS ANDORINHAS</p>
              ))}
          </div>

          <div className="w-[38%] flex flex-col items-center justify-center p-8 z-10 bg-stone-50/40 border-r border-stone-100">
             <div className="w-full aspect-[3/4] bg-white rounded-2xl shadow-xl overflow-hidden border-[6px] border-white relative ring-1 ring-stone-200">
                {data.foto_url ? (
                  <img src={data.foto_url} alt="Foto do Titular" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-100">
                    <User className="w-20 h-20 text-stone-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-leaf text-white p-1 rounded-full shadow-lg">
                   <ShieldCheck className="w-4 h-4" />
                </div>
             </div>
             <p className="mt-4 text-[10px] font-black text-forest bg-leaf/20 px-4 py-1 rounded-full tracking-widest uppercase">
                Residente Ativo
             </p>
          </div>

          <div className="flex-1 p-10 flex flex-col justify-between z-10 relative">
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Nome do Titular</label>
                  <p className="text-2xl font-black text-forest leading-tight uppercase tracking-tight break-words">{data.nome}</p>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Nascimento</label>
                    <div className="flex items-center gap-2 mt-1">
                       <Calendar className="w-4 h-4 text-stone-400" />
                       <p className="text-sm font-bold text-stone-700">{data.data_nascimento || "--/--/----"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Validade</label>
                    <p className="text-sm font-bold text-red-600 mt-1">{expira}</p>
                  </div>
               </div>

               <div className="bg-green-50 rounded-xl p-3 border border-green-100 flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-leaf" />
                  <p className="text-[11px] font-black text-forest uppercase">Benefício: 50% de Desconto no Parque</p>
               </div>
            </div>

            <div className="flex items-end justify-between mt-6 pt-4 border-t border-stone-100">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-stone-500 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-leaf" /> São Geraldo do Araguaia - PA
                  </div>
                  <p className="text-[8px] font-mono text-stone-300">TOKEN: {params.token.slice(0, 18)}...</p>
               </div>

               <div className="bg-white p-2.5 rounded-2xl shadow-lg border border-stone-100 hover:scale-105 transition-transform cursor-pointer relative group">
                  <QRCode 
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/fiscal/validar/${params.token}`} 
                    size={85} 
                    level="H"
                  />
                  <div className="absolute inset-0 bg-forest/90 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <QrCode className="w-8 h-8 text-leaf" />
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-stone-50 border-t border-stone-200 px-10 py-3 flex justify-between items-center z-10">
           <p className="text-[9px] font-bold text-stone-400 tracking-[0.3em] uppercase">Documento Digital Inviolável</p>
           <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-forest opacity-20"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-leaf opacity-40"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-forest"></div>
           </div>
        </div>
      </div>

      <div className="mt-10 flex gap-4 no-print animate-fade-up delay-300">
         <button 
           onClick={() => window.print()}
           className="flex items-center gap-2.5 bg-forest text-white px-8 py-4 rounded-2xl font-bold hover:bg-forest-mid shadow-xl transition-all active:scale-95"
         >
            <Printer className="w-5 h-5" />
            Imprimir ou Salvar PDF
         </button>
         <Link href="/" className="px-8 py-4 rounded-2xl font-bold text-stone-500 hover:bg-stone-300/20 transition-all flex items-center gap-2">
            Voltar ao Início
         </Link>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          #carteira-digital { 
            box-shadow: none !important; 
            border: 1px solid #eee !important;
            margin: 20px auto !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}