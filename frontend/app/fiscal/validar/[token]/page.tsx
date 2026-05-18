import { CheckCircle2, XCircle, ShieldAlert, User, FileText, AlertTriangle, ShieldCheck, CreditCard, Calendar } from 'lucide-react';

interface ValidarResponse {
  sucesso: boolean;
  nome?: string;
  status?: string;
  cpf?: string;             
  data_nascimento?: string; 
  foto_url?: string;        
  mensagem?: string;
}

async function validate(token: string): Promise<ValidarResponse> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sagaturismo-production.up.railway.app';
  
  const FISCAL_KEY = process.env.FISCAL_SECRET_KEY || 'SaoGeraldo2026_Secret_Key';

  try {
    // ◄── ROTA 100% ALINHADA COM O BACKEND: /fiscal/validar/
    const res = await fetch(`${API_URL}/api/v1/fiscal/validar/${encodeURIComponent(token)}`, {
      cache: 'no-store', 
      headers: {
        'x-fiscal-key': FISCAL_KEY 
      }
    });
    
    if (!res.ok) {
        return { sucesso: false, mensagem: "Acesso Negado: Dispositivo não autorizado." };
    }
    
    return res.json();
  } catch (error) {
    return { sucesso: false, mensagem: "Erro de comunicação com o servidor central." };
  }
}

export default async function FiscalPage({ params }: { params: { token: string } }) {
  const data = await validate(params.token);
  
  const isAtivo = data.status === 'ativo';
  const ok = data.sucesso === true && isAtivo;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-stone-100">
      <div className="w-full max-w-md space-y-4">
        
        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          Sistema de Verificação Fiscal
        </div>

        <div className={`rounded-[2.5rem] border-4 shadow-2xl overflow-hidden transition-all ${
          ok ? 'border-[#009640] bg-white' : 'border-red-500 bg-white'
        }`}>
          
          <div className={`px-8 py-6 flex items-center gap-5 ${
            ok ? 'bg-[#009640] text-white' : 'bg-red-500 text-white'
          }`}>
            {ok
              ? <CheckCircle2 className="w-12 h-12 flex-shrink-0" />
              : <XCircle className="w-12 h-12 flex-shrink-0" />
            }
            <div>
              <p className="text-2xl font-black tracking-tight leading-none">
                {ok ? 'PODE ENTRAR' : 'ACESSO NEGADO'}
              </p>
              <p className="text-white/90 text-xs font-bold uppercase mt-1 tracking-wider">
                {ok ? 'Residente Confirmado' : 'Documento Inválido / Pendente'}
              </p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            
            {data.sucesso && (
              <div className="flex flex-col items-center">
                <div className="w-40 h-52 bg-stone-100 rounded-3xl overflow-hidden border-4 border-stone-100 shadow-lg relative">
                  {data.foto_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={data.foto_url} 
                      alt="Foto de Identidade" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-stone-300" />
                    </div>
                  )}
                  <div className={`absolute bottom-2 right-2 text-white p-1.5 rounded-full shadow-md ${ok ? 'bg-[#009640]' : 'bg-stone-400'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] font-black text-stone-400 mt-3 uppercase tracking-widest text-center">
                  Conferir Rosto com Documento Oficial
                </p>
              </div>
            )}

            <div className="space-y-3">
                {data.nome && (
                <div className="flex items-center gap-4 bg-stone-50 rounded-2xl px-5 py-4 border border-stone-100">
                    <User className="w-5 h-5 text-stone-400 flex-shrink-0" />
                    <div className="overflow-hidden">
                        <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">Titular do Benefício</p>
                        <p className="font-black text-[#00577C] text-lg leading-tight uppercase truncate">{data.nome}</p>
                    </div>
                </div>
                )}

                {data.cpf && (
                <div className="flex items-center gap-4 bg-stone-50 rounded-2xl px-5 py-4 border border-stone-100">
                    <CreditCard className="w-5 h-5 text-stone-400 flex-shrink-0" />
                    <div>
                        <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">CPF Registado</p>
                        <p className="font-bold text-stone-700 uppercase">{data.cpf}</p>
                    </div>
                </div>
                )}
            </div>

            {data.mensagem && (
              <div className={`flex items-start gap-3 rounded-2xl px-5 py-4 ${
                ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-relaxed">{data.mensagem}</p>
              </div>
            )}

            <div className="pt-4 border-t border-stone-100">
                <p className="text-center text-[9px] text-stone-300 font-mono break-all uppercase">
                Verificação ID: {params.token.slice(0, 18)}...
                </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-stone-400 font-medium px-8 leading-relaxed">
          <strong>Atenção Fiscal:</strong> Em caso de divergência na foto ou suspeita de fraude, solicite o documento de identidade original para confirmação e retenha a entrada.
        </p>
      </div>
    </div>
  );
}