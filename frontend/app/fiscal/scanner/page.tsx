'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ShieldAlert, CheckCircle2, AlertTriangle, XCircle, User, ShieldCheck, ScanLine, RefreshCcw } from 'lucide-react';

interface ValidarResponse {
  sucesso: boolean;
  nome?: string;
  status?: string; // 'ativo', 'expirado', 'suspenso', etc.
  foto_url?: string;
  data_expiracao?: string; // Data formatada
  mensagem?: string;
}

export default function ScannerFiscal() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dadosResidente, setDadosResidente] = useState<ValidarResponse | null>(null);

  useEffect(() => {
    // Só inicia a câmara se não estiver a mostrar um resultado
    if (scanResult) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    async function onScanSuccess(decodedText: string) {
      // Evita ler o mesmo código 2 vezes seguidas acidentalmente
      if (loading) return;
      
      setScanResult(decodedText);
      scanner.clear(); // Desliga a câmara momentaneamente
      setLoading(true);
      
      try {
        const token = decodedText.split('/').pop() || decodedText;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        
        // Chama a sua API
        const res = await fetch(`${baseUrl}/api/validar?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        setDadosResidente(data);
      } catch (error) {
        setDadosResidente({ sucesso: false, mensagem: "Erro de conexão com o servidor." });
      } finally {
        setLoading(false);
      }
    }

    scanner.render(onScanSuccess, () => {});

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scanResult, loading]);

  const resetScanner = () => {
    setScanResult(null);
    setDadosResidente(null);
  };

  // Função para definir o tema (Cores e Ícones) com base no status
  const getTheme = () => {
    if (!dadosResidente?.sucesso) return { color: 'border-red-500', bg: 'bg-red-500', text: 'text-red-700', icon: <XCircle className="w-12 h-12 text-white" />, label: 'ACESSO NEGADO' };
    
    if (dadosResidente.status === 'expirado') {
      return { color: 'border-amber-400', bg: 'bg-amber-400', text: 'text-amber-800', icon: <AlertTriangle className="w-12 h-12 text-white" />, label: 'DOCUMENTO EXPIRADO' };
    }
    
    if (dadosResidente.status === 'ativo') {
      return { color: 'border-[#009640]', bg: 'bg-[#009640]', text: 'text-[#009640]', icon: <CheckCircle2 className="w-12 h-12 text-white" />, label: 'ACESSO LIBERADO' };
    }

    return { color: 'border-red-500', bg: 'bg-red-500', text: 'text-red-700', icon: <XCircle className="w-12 h-12 text-white" />, label: 'BLOQUEADO' };
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 bg-stone-900 text-white selection:bg-[#00577C]">
      
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-stone-400">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Terminal do Fiscal
          </div>
          <h1 className="text-2xl font-black">Scanner de Residentes</h1>
        </div>

        {/* TELA DA CÂMARA (Só aparece se não houver resultado) */}
        {!scanResult && (
          <div className="bg-white rounded-[2rem] overflow-hidden border-4 border-stone-800 p-2 shadow-2xl">
            <div id="reader" className="w-full text-stone-900 [&_video]:rounded-2xl [&_video]:object-cover"></div>
            <div className="p-4 text-center text-sm font-bold text-stone-500 flex items-center justify-center gap-2">
              <ScanLine className="w-5 h-5" /> Aponte para o QR Code da Carteira
            </div>
          </div>
        )}

        {/* ESTADO DE CARREGAMENTO */}
        {loading && (
          <div className="bg-stone-800 rounded-[2rem] p-12 text-center animate-pulse border-4 border-stone-700">
            <RefreshCcw className="w-12 h-12 mx-auto mb-4 text-stone-400 animate-spin" />
            <p className="font-bold uppercase tracking-widest text-stone-400">Verificando banco de dados...</p>
          </div>
        )}

        {/* CARTÃO DE RESULTADO */}
        {dadosResidente && !loading && (() => {
          const theme = getTheme();
          
          return (
            <div className={`rounded-[2.5rem] border-4 overflow-hidden shadow-2xl transition-all bg-white ${theme.color}`}>
              
              {/* Header de Status */}
              <div className={`px-8 py-6 flex items-center gap-5 ${theme.bg}`}>
                {theme.icon}
                <div>
                  <p className="text-2xl font-black tracking-tight leading-none text-white">
                    {theme.label}
                  </p>
                  <p className="text-white/90 text-xs font-bold uppercase mt-1 tracking-wider">
                    {dadosResidente.mensagem || 'Validação concluída'}
                  </p>
                </div>
              </div>

              {/* Corpo do Cartão */}
              <div className="p-8 space-y-6">
                {/* Foto Gigante para combate à fraude */}
                {dadosResidente.sucesso && (
                  <div className="flex flex-col items-center">
                    <div className={`w-48 h-60 bg-stone-100 rounded-[2rem] overflow-hidden border-4 shadow-lg relative ${theme.color}`}>
                      {dadosResidente.foto_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={dadosResidente.foto_url} alt="Foto do Residente" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-20 h-20 text-stone-300" />
                        </div>
                      )}
                      <div className={`absolute bottom-3 right-3 text-white p-2 rounded-full shadow-md ${theme.bg}`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-[11px] font-black text-stone-400 mt-4 uppercase tracking-[0.2em]">Conferir Rosto do Portador</p>
                  </div>
                )}

                {/* Dados Pessoais */}
                {dadosResidente.nome && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider mb-1">Titular do Benefício</p>
                      <p className="font-black text-stone-800 text-2xl leading-tight uppercase">{dadosResidente.nome}</p>
                    </div>

                    <div className="flex gap-4 justify-center">
                      {dadosResidente.data_expiracao && (
                        <div className="bg-stone-50 rounded-2xl px-5 py-3 border border-stone-100 text-center flex-1">
                          <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">Validade</p>
                          <p className={`font-bold text-sm ${dadosResidente.status === 'expirado' ? 'text-amber-600' : 'text-stone-700'}`}>
                            {dadosResidente.data_expiracao}
                          </p>
                        </div>
                      )}
                      {dadosResidente.status && (
                        <div className="bg-stone-50 rounded-2xl px-5 py-3 border border-stone-100 text-center flex-1">
                          <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">Status</p>
                          <p className={`font-bold text-sm uppercase ${theme.text}`}>
                            {dadosResidente.status}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botão para Ler Próximo */}
                <button 
                  onClick={resetScanner}
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-full bg-stone-900 text-white py-5 font-black uppercase tracking-widest text-sm shadow-xl hover:bg-stone-800 transition active:scale-95"
                >
                  <ScanLine className="w-5 h-5" />
                  Escanear Próximo
                </button>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}