'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function FiscalLogin() {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      // A senha é validada NO SERVIDOR (FISCAL_LOGIN_PASSWORD); o servidor devolve um
      // cookie httpOnly assinado válido por 24h. Nada sensível fica no bundle do navegador.
      const res = await fetch('/api/fiscal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.sucesso) {
        router.push('/fiscal/scanner');
        return;
      }
      setErro(data?.mensagem || 'Credencial inválida. Acesso restrito a fiscais.');
    } catch {
      setErro('Falha de comunicação. Verifique a sua ligação e tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#051c22] to-[#0A3D4A] px-4 relative overflow-hidden">
      
      {/* Efeitos de luz no fundo escuro para um ar moderno e oficial */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#4F772D] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#D4C345] rounded-full mix-blend-multiply filter blur-[128px] opacity-10"></div>

      <div className="w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 relative overflow-hidden z-10">
        
        {/* Barra superior com as cores institucionais */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0A3D4A] via-[#4F772D] to-[#D4C345]"></div>

        <div className="flex flex-col items-center mb-8 mt-2">
          {/* Logo Oficial com Fallback para Ícone caso a internet oscile */}
          <img 
            src="https://sagatur.com.br/logop.png" 
            alt="Logo SagaTurismo" 
            className="h-16 w-auto mb-6 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              document.getElementById('fallback-icon')?.classList.remove('hidden');
            }}
          />
          <div id="fallback-icon" className="hidden w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#0A3D4A] mb-6">
            <ShieldCheck size={32} />
          </div>
          
          <h1 className="text-2xl font-black text-slate-800 tracking-tight text-center leading-tight">
            Portal de <br />Fiscalização
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-3 text-center px-2">
            Insira sua credencial para validar os cartões de residentes.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#0A3D4A] transition-colors" />
              <input 
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Código de Acesso"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-700 outline-none focus:border-[#0A3D4A] focus:ring-4 focus:ring-[#0A3D4A]/10 transition-all placeholder:font-medium"
                required
              />
            </div>
          </div>

          {erro && (
            <div className="bg-red-50 text-red-600 text-sm font-bold text-center py-3 rounded-xl border border-red-100 animate-pulse">
              {erro}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#0A3D4A] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#072a33] transition-all active:scale-95 disabled:opacity-70 shadow-lg shadow-[#0A3D4A]/30"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>Autenticar Dispositivo <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
        
        {/* Rodapé Oficial */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            © 2026 Prefeitura Munícipal de São Geraldo do Araguaia - PA
          </p>
        </div>
      </div>
    </div>
  );
}