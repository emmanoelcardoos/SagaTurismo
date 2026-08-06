'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  ShieldAlert, CheckCircle2, AlertTriangle, XCircle, User, 
  ShieldCheck, ScanLine, RefreshCcw, Camera, Calendar, FileText 
} from 'lucide-react';

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

  // Nova configuração de temas inspirada na página de validação
  const getTheme = () => {
    if (!dadosResidente?.sucesso) return { border: 'border-red-500', bg: 'bg-red-500', title: 'ACESSO NEGADO', subtitle: 'Documento Inválido / Pendente', icon: <XCircle className="w-12 h-12 flex-shrink-0" />, alertBg: 'bg-red-50', alertText: 'text-red-800' };
    
    if (dadosResidente.status === 'expirado') {
      return { border: 'border-amber-500', bg: 'bg-amber-500', title: 'DOC. EXPIRADO', subtitle: 'Validade Ultrapassada', icon: <AlertTriangle className="w-12 h-12 flex-shrink-0" />, alertBg: 'bg-amber-50', alertText: 'text-amber-800' };
    }
    
    if (dadosResidente.status === 'ativo') {
      return { border: 'border-[#009640]', bg: 'bg-[#009640]', title: 'PODE ENTRAR', subtitle: 'Residente Confirmado', icon: <CheckCircle2 className="w-12 h-12 flex-shrink-0" />, alertBg: 'bg-green-50', alertText: 'text-green-800' };
    }

    return { border: 'border-red-500', bg: 'bg-red-500', title: 'BLOQUEADO', subtitle: 'Status Desconhecido', icon: <XCircle className="w-12 h-12 flex-shrink-0" />, alertBg: 'bg-red-50', alertText: 'text-red-800' };
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-6 px-4 bg-gradient-to-br from-[#051c22] to-[#0A3D4A] relative overflow-hidden text-white selection:bg-[#4F772D]/30">
      
      {/* Efeitos de luz no fundo escuro */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#4F772D] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#D4C345] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Cabeçalho Institucional (Visível apenas quando a câmera está ativa para não poluir o resultado) */}
        {(!scanResult && !loading) && (
          <div className="flex flex-col items-center justify-center gap-3 text-center mb-2 animate-in fade-in zoom-in duration-500">
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
        )}

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

        {/* TELA DA CÂMARA - Quadrado Perfeito */}
        {!scanResult && !permissaoErro && (
          <div className="bg-white rounded-[2.5rem] overflow-hidden border border-white/20 p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden">
              <div 
                id="reader" 
                className="absolute inset-0 w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
              ></div>
            </div>
            
            <div className="p-3 pt-4 text-center text-sm font-bold text-[#0A3D4A] flex items-center justify-center gap-2">
              <ScanLine className="w-5 h-5 text-[#4F772D]" /> Centralize o QR Code na tela
            </div>
          </div>
        )}

        {/* ESTADO DE CARREGAMENTO */}
        {loading && (
          <div className="bg-white/5 backdrop-blur-lg rounded-[2rem] p-12 text-center border border-white/10 shadow-2xl mt-10">
            <RefreshCcw className="w-10 h-10 mx-auto mb-5 text-[#D4C345] animate-spin" />
            <p className="font-bold uppercase tracking-widest text-white/70 text-xs">Acessando banco de dados...</p>
          </div>
        )}

        {/* NOVO CARTÃO DE RESULTADO (IDÊNTICO À PÁGINA VALIDAR) */}
        {dadosResidente && !loading && (() => {
          const theme = getTheme();
          
          return (
            <div className="animate-in slide-in-from-bottom-10 fade-in duration-500">
              <div className={`rounded-[2.5rem] border-4 shadow-2xl overflow-hidden bg-white ${theme.border}`}>
                
                {/* Cabeçalho do Cartão */}
                <div className={`px-8 py-6 flex items-center gap-5 text-white ${theme.bg}`}>
                  {theme.icon}
                  <div>
                    <p className="text-2xl font-black tracking-tight leading-none">
                      {theme.title}
                    </p>
                    <p className="text-white/90 text-xs font-bold uppercase mt-1 tracking-wider">
                      {theme.subtitle}
                    </p>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  
                  {/* Foto do Residente */}
                  {dadosResidente.sucesso && (
                    <div className="flex flex-col items-center">
                      <div className="w-40 h-52 bg-stone-100 rounded-3xl overflow-hidden border-4 border-stone-100 shadow-lg relative">
                        {dadosResidente.foto_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img 
                            src={dadosResidente.foto_url} 
                            alt="Foto de Identidade" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-16 h-16 text-stone-300" />
                          </div>
                        )}
                        <div className={`absolute bottom-2 right-2 text-white p-1.5 rounded-full shadow-md ${theme.bg}`}>
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-stone-400 mt-3 uppercase tracking-widest text-center">
                        Conferir Rosto com Documento Oficial
                      </p>
                    </div>
                  )}

                  {/* Informações do Residente no Estilo Linhas */}
                  {dadosResidente.nome && (
                    <div className="space-y-3">
                      
                      {/* Nome */}
                      <div className="flex items-center gap-4 bg-stone-50 rounded-2xl px-5 py-4 border border-stone-100">
                        <User className="w-5 h-5 text-stone-400 flex-shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">Titular do Benefício</p>
                          <p className="font-black text-[#00577C] text-lg leading-tight uppercase truncate">{dadosResidente.nome}</p>
                        </div>
                      </div>

                      {/* Validade */}
                      {dadosResidente.data_expiracao && (
                        <div className="flex items-center gap-4 bg-stone-50 rounded-2xl px-5 py-4 border border-stone-100">
                          <Calendar className="w-5 h-5 text-stone-400 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">Validade do Cartão</p>
                            <p className={`font-bold text-sm uppercase ${dadosResidente.status === 'expirado' ? 'text-amber-600' : 'text-stone-700'}`}>
                              {dadosResidente.data_expiracao}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Status */}
                      {dadosResidente.status && (
                        <div className="flex items-center gap-4 bg-stone-50 rounded-2xl px-5 py-4 border border-stone-100">
                          <FileText className="w-5 h-5 text-stone-400 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">Situação Atual</p>
                            <p className="font-bold text-stone-700 uppercase">{dadosResidente.status}</p>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Alertas / Mensagens */}
                  {dadosResidente.mensagem && (
                    <div className={`flex items-start gap-3 rounded-2xl px-5 py-4 ${theme.alertBg} ${theme.alertText}`}>
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium leading-relaxed">{dadosResidente.mensagem}</p>
                    </div>
                  )}

                  {/* Botão de Novo Escaneamento */}
                  <div className="pt-2">
                    <button 
                      onClick={resetScanner}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0A3D4A] text-white py-4 font-bold uppercase tracking-widest text-xs shadow-lg shadow-[#0A3D4A]/30 hover:bg-[#072a33] transition-all active:scale-95"
                    >
                      <ScanLine className="w-4 h-4" />
                      Novo Escaneamento
                    </button>
                  </div>

                </div>
              </div>
              
              {/* Instrução ao fiscal abaixo do cartão */}
              <p className="text-center text-[10px] text-stone-400 font-medium px-8 mt-4 leading-relaxed">
                <strong>Atenção Fiscal:</strong> Em caso de divergência na foto ou suspeita de fraude, solicite o documento de identidade original.
              </p>
            </div>
          );
        })()}

      </div>
    </div>
  );
}