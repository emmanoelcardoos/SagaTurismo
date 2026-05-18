'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, Lock, ArrowRight, Loader2 } from 'lucide-react';

function LoginContent() {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Captura para onde o fiscal queria ir antes de ser barrado
  const returnUrl = searchParams.get('returnUrl') || '/';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ◄── SENHA DO FISCAL AQUI
    if (senha === 'sga2026') { 
      // Grava um cookie válido por 24 horas (86400 segundos) no telemóvel do fiscal
      document.cookie = "fiscal_auth=autenticado; path=/; max-age=86400";
      
      // Manda o fiscal de volta para a carteira que ele estava a tentar ler!
      router.push(returnUrl);
    } else {
      setErro('Senha incorreta. Acesso restrito a funcionários.');
    }
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
          <ShieldAlert size={32} />
        </div>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-stone-800 tracking-tight">Acesso Restrito</h1>
        <p className="text-sm text-stone-500 font-medium mt-2">
          Insira a credencial de fiscalização para aceder à base de dados de residentes.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input 
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Palavra-passe"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl py-4 pl-12 pr-4 font-medium text-stone-700 outline-none focus:border-[#0085FF] focus:ring-2 focus:ring-[#0085FF]/20 transition-all"
              required
            />
          </div>
        </div>

        {erro && (
          <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">
            {erro}
          </p>
        )}

        <button 
          type="submit"
          className="w-full bg-[#0085FF] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95"
        >
          Autenticar Dispositivo <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

export default function FiscalLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900 px-4">
      {/* O Suspense resolve o erro da Vercel! */}
      <Suspense fallback={<Loader2 className="w-12 h-12 text-[#0085FF] animate-spin" />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}