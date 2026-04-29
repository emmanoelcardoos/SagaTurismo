import { CheckCircle2, XCircle, ShieldAlert, User, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ValidarResponse {
  sucesso: boolean;
  nome?: string;
  status?: string;
  foto_url?: string; // Campo essencial para combate à fraude
  mensagem?: string;
}

async function validate(token: string): Promise<ValidarResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  // O proxy garante que a secret key do fiscal não vaze
  const res = await fetch(`${baseUrl}/api/validar?token=${encodeURIComponent(token)}`, {
    cache: 'no-store',
  });
  return res.json();
}

export default async function FiscalPage({ params }: { params: { token: string } }) {
  const data = await validate(params.token);
  const ok = data.sucesso === true;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-stone-100">
      <div className="w-full max-w-md space-y-4">
        
        {/* Badge de Segurança */}
        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          Sistema de Verificação Fiscal
        </div>

        {/* Card Principal */}
        <div className={`rounded-[2.5rem] border-4 shadow-2xl overflow-hidden transition-all ${
          ok ? 'border-leaf bg-white' : 'border-red-500 bg-white'
        }`}>
          
          {/* Barra de Status Gigante (UX para o Fiscal) */}
          <div className={`px-8 py-6 flex items-center gap-5 ${
            ok ? 'bg-leaf text-white' : 'bg-red-500 text-white'
          }`}>
            {ok
              ? <CheckCircle2 className="w-12 h-12 flex-shrink-0" />
              : <XCircle className="w-12 h-12 flex-shrink-0" />
            }
            <div>
              <p className="text-2xl font-black tracking-tight leading-none">
                {ok ? 'PODE ENTRAR' : 'ACESSO NEGADO'}
              </p>
              <p className="text-white/80 text-xs font-bold uppercase mt-1 tracking-wider">
                {ok ? 'Residente Confirmado' : 'Cartão Inválido / Expirado'}
              </p>
            </div>
          </div>

          {/* Área de Dados e Foto */}
          <div className="p-8 space-y-6">
            
            {/* FOTO DO RESIDENTE (Destaque para combate à fraude) */}
            {ok && (
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
                  <div className="absolute bottom-2 right-2 bg-forest text-white p-1.5 rounded-full shadow-md">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] font-black text-stone-400 mt-3 uppercase tracking-widest">Conferir Rosto do Portador</p>
              </div>
            )}

            <div className="space-y-3">
                {ok && data.nome && (
                <div className="flex items-center gap-4 bg-stone-50 rounded-2xl px-5 py-4 border border-stone-100">
                    <User className="w-5 h-5 text-stone-400 flex-shrink-0" />
                    <div>
                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">Titular do Benefício</p>
                    <p className="font-black text-forest text-lg leading-tight uppercase">{data.nome}</p>
                    </div>
                </div>
                )}

                {ok && data.status && (
                <div className="flex items-center gap-4 bg-stone-50 rounded-2xl px-5 py-4 border border-stone-100">
                    <FileText className="w-5 h-5 text-stone-400 flex-shrink-0" />
                    <div>
                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">Status da Carteira</p>
                    <p className="font-bold text-stone-700 uppercase">{data.status}</p>
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

            {/* Auditoria do Token */}
            <div className="pt-4 border-t border-stone-100">
                <p className="text-center text-[9px] text-stone-300 font-mono break-all uppercase">
                Verificação ID: {params.token}
                </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-stone-400 font-medium px-8">
          Atenção Fiscal: Em caso de divergência na foto, solicite o documento de identidade físico para confirmação.
        </p>
      </div>
    </div>
  );
}