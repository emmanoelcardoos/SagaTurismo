'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ShieldAlert, CheckCircle2, AlertTriangle, XCircle, User, ShieldCheck, ScanLine, RefreshCcw, Camera } from 'lucide-react';

interface ValidarResponse {
  sucesso: boolean;
  nome?: string;
  status?: string; 
  foto_url?: string;
  data_expiracao?: string; 
  mensagem?: string;
}

export default function ScannerFiscal() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dadosResidente, setDadosResidente] = useState<ValidarResponse | null>(null);
  const [permissaoErro, setPermissaoErro] = useState<string | null>(null);
  
  // Usamos uma ref para guardar a instância do leitor e poder pará-lo adequadamente
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Se já leu um código ou está a carregar, não tenta ligar a câmara novamente
    if (scanResult || loading) return;

    const iniciarCamera = async () => {
      try {
        // Inicializa a versão "Core" do leitor
        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" }, // Força a câmara traseira (do ambiente)
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0 // Ajuda no enquadramento mobile
          },
          async (decodedText) => {
            // SUCESSO NA LEITURA
            if (html5QrCodeRef.current?.isScanning) {
              await html5QrCodeRef.current.stop(); // Para a câmara imediatamente
              html5QrCodeRef.current.clear();
            }
            
            setScanResult(decodedText);
            setLoading(true);
            
            try {
              const token = decodedText.split('/').pop() || decodedText;
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
              
              const res = await fetch(`${baseUrl}/api/validar?token=${encodeURIComponent(token)}`);
              const data = await res.json();
              setDadosResidente(data);
            } catch (error) {
              setDadosResidente({ sucesso: false, mensagem: "Erro de conexão com o servidor." });
            } finally {
              setLoading(false);
            }
          },
          (errorMessage) => {
            // Ignora os erros normais de "QR Code não encontrado neste frame"
          }
        );
        setPermissaoErro(null);
      } catch (err) {
        console.error("Erro ao iniciar câmara:", err);
        setPermissaoErro("Por favor, permita o acesso à câmara nas configurações do seu navegador para ler os QR Codes.");
      }
    };

    iniciarCamera();

    // Limpeza quando o componente desmonta ou quando o scanResult muda
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current?.clear();
        }).catch(console.error);
      }
    };
  }, [scanResult, loading]);

  const resetScanner = () => {
    setScanResult(null);
    setDadosResidente(null);
    setPermissaoErro(null);
  };

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

        {/* ERRO DE PERMISSÃO DA CÂMARA */}
        {permissaoErro && !scanResult && (
          <div className="bg-red-500/10 border-2 border-red-500 rounded-3xl p-6 text-center space-y-4">
            <Camera className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-red-400 font-bold">{permissaoErro}</p>
            <button 
              onClick={resetScanner}
              className="bg-red-500 text-white px-6 py-2 rounded-full font-bold uppercase text-sm"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* TELA DA CÂMARA */}
        {!scanResult && !permissaoErro && (
          <div className="bg-white rounded-[2rem] overflow-hidden border-4 border-stone-800 p-2 shadow-2xl">
            {/* O leitor vai ser injetado nesta div limpa */}
            <div id="reader" className="w-full bg-stone-900 rounded-2xl overflow-hidden [&_video]:w-full [&_video]:object-cover"></div>
            
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

              <div className="p-8 space-y-6">
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