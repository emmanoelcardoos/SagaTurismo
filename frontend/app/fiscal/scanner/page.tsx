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
              
              // 1. Aponta para a tua API no Railway (ajusta se tiveres a variável de ambiente diferente)
              const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sagaturismo-production.up.railway.app';
              
              // 2. Chave do Fiscal (Para funcionar no cliente Next.js, tem de ter o prefixo NEXT_PUBLIC_ no .env)
              const FISCAL_KEY = process.env.NEXT_PUBLIC_FISCAL_SECRET_KEY || 'SaoGeraldo2026_Secret_Key';
              
              // 3. Faz o pedido à rota /fiscal/validar/{token} enviando o cabeçalho exigido
              const res = await fetch(`${API_URL}/api/v1/fiscal/validar/${encodeURIComponent(token)}`, {
                headers: {
                  'x-fiscal-key': FISCAL_KEY 
                }
              });
              
              if (!res.ok) {
                 // Se o backend devolver 403, avisa o frontend
                 setDadosResidente({ sucesso: false, mensagem: "Acesso Negado: App do Fiscal não autenticada." });
                 return;
              }
              
              const data = await res.json();
              setDadosResidente(data);
              
            } catch (error) {
              setDadosResidente({ sucesso: false, mensagem: "Erro de comunicação com o servidor central." });
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
    if (!dadosResidente?.sucesso) return { color: 'border-red-600', bg: 'bg-red-600', text: 'text-red-700', icon: <XCircle className="w-10 h-10 text-white" />, label: 'ACESSO NEGADO' };
    
    if (dadosResidente.status === 'expirado') {
      return { color: 'border-amber-500', bg: 'bg-amber-500', text: 'text-amber-700', icon: <AlertTriangle className="w-10 h-10 text-white" />, label: 'EXPIRADO' };
    }
    
    if (dadosResidente.status === 'ativo') {
      // Utilizando o verde institucional para acesso liberado
      return { color: 'border-[#4F772D]', bg: 'bg-[#4F772D]', text: 'text-[#4F772D]', icon: <CheckCircle2 className="w-10 h-10 text-white" />, label: 'ACESSO LIBERADO' };
    }

    return { color: 'border-red-600', bg: 'bg-red-600', text: 'text-red-700', icon: <XCircle className="w-10 h-10 text-white" />, label: 'BLOQUEADO' };
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-6 px-4 bg-gradient-to-br from-[#051c22] to-[#0A3D4A] relative overflow-hidden text-white selection:bg-[#4F772D]/30">
      
      {/* Efeitos de luz no fundo escuro (consistente com o login) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#4F772D] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#D4C345] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Cabeçalho Institucional */}
        <div className="flex flex-col items-center justify-center gap-3 text-center mb-2">
          <img 
            src="https://sagatur.com.br/logop.png" 
            alt="Logo SagaTurismo" 
            className="h-12 w-auto object-contain drop-shadow-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              document.getElementById('fallback-icon-scan')?.classList.remove('hidden');
            }}
          />
          <div id="fallback-icon-scan" className="hidden w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4C345] mb-1">
              <ShieldAlert className="w-4 h-4" />
              Terminal de Fiscalização
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Leitor de Residentes</h1>
          </div>
        </div>

        {/* ERRO DE PERMISSÃO DA CÂMARA */}
        {permissaoErro && !scanResult && (
          <div className="bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-[2rem] p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <Camera className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-200 font-medium text-sm">{permissaoErro}</p>
            <button 
              onClick={resetScanner}
              className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-red-600 transition-all active:scale-95"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* TELA DA CÂMARA */}
        {!scanResult && !permissaoErro && (
          <div className="bg-white rounded-[2rem] overflow-hidden border border-white/20 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div id="reader" className="w-full bg-slate-900 rounded-3xl overflow-hidden [&_video]:w-full [&_video]:object-cover aspect-square"></div>
            
            <div className="p-4 pt-5 text-center text-sm font-bold text-[#0A3D4A] flex items-center justify-center gap-2">
              <ScanLine className="w-5 h-5 text-[#4F772D]" /> Posicione o QR Code no centro
            </div>
          </div>
        )}

        {/* ESTADO DE CARREGAMENTO */}
        {loading && (
          <div className="bg-white/5 backdrop-blur-lg rounded-[2rem] p-12 text-center border border-white/10 shadow-2xl">
            <RefreshCcw className="w-10 h-10 mx-auto mb-5 text-[#D4C345] animate-spin" />
            <p className="font-bold uppercase tracking-widest text-white/70 text-xs">Acessando banco de dados...</p>
          </div>
        )}

        {/* CARTÃO DE RESULTADO */}
        {dadosResidente && !loading && (() => {
          const theme = getTheme();
          
          return (
            <div className={`rounded-[2rem] border-2 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white ${theme.color} relative`}>
              
              <div className={`px-6 py-5 flex items-center justify-between gap-4 ${theme.bg}`}>
                <div>
                  <p className="text-xl font-black tracking-tight leading-none text-white">
                    {theme.label}
                  </p>
                  <p className="text-white/90 text-[10px] font-bold uppercase mt-1.5 tracking-widest">
                    {dadosResidente.mensagem || 'Validação concluída com sucesso'}
                  </p>
                </div>
                <div className="flex-shrink-0 drop-shadow-md">
                  {theme.icon}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {dadosResidente.sucesso && (
                  <div className="flex flex-col items-center mt-2">
                    <div className={`w-32 h-40 bg-slate-100 rounded-2xl overflow-hidden border-4 shadow-lg relative ${theme.color}`}>
                      {dadosResidente.foto_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={dadosResidente.foto_url} alt="Foto do Residente" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      <div className={`absolute bottom-2 right-2 text-white p-1.5 rounded-full shadow-md ${theme.bg}`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-widest">Conferir Identidade Visual</p>
                  </div>
                )}

                {dadosResidente.nome && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Titular do Documento</p>
                      <p className="font-black text-slate-800 text-xl leading-tight uppercase">{dadosResidente.nome}</p>
                    </div>

                    <div className="flex gap-3 justify-center">
                      {dadosResidente.data_expiracao && (
                        <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 text-center flex-1">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Validade</p>
                          <p className={`font-black text-sm mt-0.5 ${dadosResidente.status === 'expirado' ? 'text-amber-600' : 'text-slate-700'}`}>
                            {dadosResidente.data_expiracao}
                          </p>
                        </div>
                      )}
                      {dadosResidente.status && (
                        <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 text-center flex-1">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Status</p>
                          <p className={`font-black text-sm uppercase mt-0.5 ${theme.text}`}>
                            {dadosResidente.status}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button 
                  onClick={resetScanner}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#0A3D4A] text-white py-4 font-bold uppercase tracking-widest text-xs shadow-lg shadow-[#0A3D4A]/30 hover:bg-[#072a33] transition-all active:scale-95"
                >
                  <ScanLine className="w-4 h-4" />
                  Novo Escaneamento
                </button>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}