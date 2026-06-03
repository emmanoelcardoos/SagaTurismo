'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function LoginPage() {
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Senha correta
    if (password === 'paocommanteiga') {
      document.cookie = "projeto_autorizado=true; path=/; max-age=3600; SameSite=Strict";
      window.location.href = '/';
    } else {
      setError(true);
    }
  };

  return (
    <div className={`${inter.className} relative min-h-screen flex items-center justify-center overflow-hidden`}>
      {/* Vídeo de fundo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/serra.mp4"
      />

      {/* Overlay escuro para dar contraste e destacar o card */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-0" />

      {/* Conteúdo central */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo (opcional, para dar contexto) */}
        <div className="flex justify-center mb-8">
          <div className="relative w-40 h-20">
            <Image
              src="/logop.png"
              alt="SagaTurismo"
              fill
              className="object-contain brightness-0 invert opacity-80"
              priority
            />
          </div>
        </div>

        {/* Card de login */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">
          <div className="text-center mb-8">
            <h2 className={`${jakarta.className} text-3xl font-black text-[#00577C]`}>Acesso Restrito</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Insira a senha para aceder ao portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Senha de acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="••••••••"
                className={`w-full bg-slate-50 border-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all focus:bg-white ${
                  error
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-slate-200 focus:border-[#F9C400] focus:ring-2 focus:ring-[#F9C400]/20'
                }`}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1">
                  ⚠ Senha incorreta. Tente novamente.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white font-black py-4 rounded-xl uppercase tracking-widest text-sm transition-all hover:-translate-y-0.5 shadow-lg"
            >
              Entrar no portal
            </button>
          </form>

          <p className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400 mt-8">
            Secretaria Municipal de Turismo – São Geraldo do Araguaia (PA)
          </p>
        </div>
      </div>
    </div>
  );
}