'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle2, Lock } from 'lucide-react';

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function ConvitePage() {
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  // Verifica se o utilizador chegou aqui com um token válido de convite
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setErro("Link inválido ou expirado. Peça um novo convite ao administrador.");
      }
    });
  }, []);

  async function handleSalvarSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    // Atualiza a senha do utilizador que clicou no link
    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setErro("Erro ao definir a senha: " + error.message);
      setLoading(false);
    } else {
      setSucesso(true);
      setLoading(false);
      // Redireciona para o portal após 3 segundos
      setTimeout(() => {
        window.location.href = "/portal-servicos"; // Ajuste para a rota do seu portal
      }, 3000);
    }
  }

  const inputCls = "w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#00577C] focus:ring-2 focus:ring-[#00577C]/20 transition placeholder:text-slate-400";

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="relative w-32 h-16 mb-4">
            <Image src="/logop.png" alt="Logo" fill className="object-contain" priority />
          </div>
          <h1 className={`${jakarta.className} text-2xl font-black text-[#00577C] text-center`}>
            Bem-vindo à Equipe!
          </h1>
          <p className="text-sm text-slate-500 mt-2 text-center">
            Defina a sua senha de acesso ao painel administrativo.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8">
          {sucesso ? (
            <div className="text-center py-6 animate-in fade-in zoom-in">
              <CheckCircle2 size={64} className="mx-auto text-[#009640] mb-4" />
              <h2 className={`${jakarta.className} text-xl font-bold text-slate-800 mb-2`}>
                Senha definida!
              </h2>
              <p className="text-sm text-slate-500">
                A redirecionar para o portal...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSalvarSenha} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="password" 
                    value={senha} 
                    onChange={(e) => setSenha(e.target.value)} 
                    className={`${inputCls} pl-10`} 
                    placeholder="••••••••" 
                    required 
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="password" 
                    value={confirmarSenha} 
                    onChange={(e) => setConfirmarSenha(e.target.value)} 
                    className={`${inputCls} pl-10`} 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                {erro && <p className="text-red-500 text-xs mt-3 font-bold">{erro}</p>}
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white font-black rounded-xl py-4 text-sm transition shadow-md uppercase tracking-widest mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                Salvar e Entrar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}