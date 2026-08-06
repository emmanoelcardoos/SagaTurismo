'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Mail, Lock, Loader2, CheckCircle2, Building2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function AtivarContaPage() {
  const router = useRouter();
  
  // Controle de Etapas (1: Verificar E-mail | 2: Criar Senha)
  const [step, setStep] = useState(1);
  
  // Dados
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [parceiro, setParceiro] = useState<any>(null);
  
  // Status da UI
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  // ◄── PASSO 1: VERIFICAR SE O E-MAIL ESTÁ PRÉ-CADASTRADO ──►
  const handleVerificarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const { data, error } = await supabase
        .from('parceiros')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        setErro("E-mail não encontrado. Por favor, solicite o pré-cadastro à Prefeitura.");
        setLoading(false);
        return;
      }

      if (data.status === 'ativo') {
        setErro("Esta conta já está ativa! Pode fazer o login diretamente no portal.");
        setLoading(false);
        return;
      }

      // Se encontrou e está pendente, guarda os dados e avança para a senha!
      setParceiro(data);
      setStep(2);
    } catch (err) {
      setErro("Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ◄── PASSO 2: CRIAR A SENHA OFICIAL E ATIVAR A CONTA ──►
  const handleAtivarConta = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      // 1. Cria o utilizador no cofre de segurança (Auth) do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: senha,
      });

      if (authError) {
        setErro("Erro ao criar senha: " + authError.message);
        setLoading(false);
        return;
      }

      // 2. Atualiza o status na tabela parceiros de "pendente" para "ativo"
      const { error: updateError } = await supabase
        .from('parceiros')
        .update({ status: 'ativo' })
        .eq('email', email);

      if (updateError) {
        setErro("A senha foi criada, mas houve um erro ao ativar o perfil. Contacte o suporte.");
        setLoading(false);
        return;
      }

      // 3. Sucesso total!
      setSucesso(true);
      setTimeout(() => router.push('/parceiros'), 3000);
      
    } catch (err) {
      setErro("Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ◄── TELA DE SUCESSO ──►
  if (sucesso) {
    return (
      <div className={`${inter.className} min-h-screen bg-slate-50 flex items-center justify-center p-5 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none opacity-40" style={{ background: 'radial-gradient(ellipse at top right, rgba(0,150,64,0.15) 0%, transparent 70%)' }} />
        <div className="bg-white p-10 rounded-[2rem] shadow-xl text-center max-w-md w-full border border-slate-100 relative z-10">
          <CheckCircle2 size={60} className="text-[#009640] mx-auto mb-5" />
          <h2 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-2`}>Conta Ativada!</h2>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">Bem-vindo(a), {parceiro?.nome_negocio}! Redirecionando para o portal...</p>
        </div>
      </div>
    );
  }

  // ◄── TELA DE FORMULÁRIO (ETAPAS 1 E 2) ──►
  return (
    <div className={`${inter.className} min-h-screen bg-slate-50 flex items-center justify-center p-5 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none opacity-40" style={{ background: 'radial-gradient(ellipse at top right, rgba(249,196,0,0.15) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none opacity-40" style={{ background: 'radial-gradient(ellipse at bottom left, rgba(0,150,64,0.15) 0%, transparent 70%)' }} />

      <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-2xl shadow-slate-200/50 max-w-md w-full border border-slate-100 relative z-10">
        
        <div className="flex justify-center mb-8">
          <Image src="/logop.png" alt="SagaTurismo" width={120} height={40} className="h-10 w-auto object-contain" />
        </div>

        <div className="mb-8 text-center">
          <h2 className={`${jakarta.className} text-2xl font-black text-[#002f40] mb-2`}>Ativar Conta</h2>
          {step === 1 ? (
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Insira o e-mail que foi pré-cadastrado pela prefeitura para ativar a sua conta.</p>
          ) : (
            <div className="bg-[#009640]/10 border border-[#009640]/20 rounded-xl p-3 inline-flex items-center gap-2">
              <Building2 size={16} className="text-[#009640]" />
              <span className="text-sm font-bold text-[#009640]">{parceiro?.nome_negocio}</span>
            </div>
          )}
        </div>

        <form onSubmit={step === 1 ? handleVerificarEmail : handleAtivarConta} className="space-y-5">
          
          {/* CAMPO DE E-MAIL (Sempre visível, mas bloqueado no passo 2) */}
          <div>
            <label className={`${jakarta.className} text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5`}>E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                required 
                disabled={step === 2}
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-[#009640] focus:bg-white focus:ring-4 focus:ring-[#009640]/10 placeholder:text-slate-400 disabled:opacity-60"
                placeholder="seu@email.com.br"
              />
            </div>
          </div>

          {/* CAMPO DE SENHA (Só aparece no Passo 2) */}
          {step === 2 && (
            <div>
              <label className={`${jakarta.className} text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5`}>Criar Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required 
                  autoFocus
                  value={senha} 
                  onChange={e => setSenha(e.target.value)} 
                  minLength={6} 
                  className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-[#009640] focus:bg-white focus:ring-4 focus:ring-[#009640]/10 placeholder:text-slate-400"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>
          )}

          {erro && (
            <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center border border-red-100">
              {erro}
            </p>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className={`${jakarta.className} w-full bg-[#009640] hover:bg-[#007a33] active:scale-[0.98] text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest mt-2 transition-all flex justify-center items-center gap-2 shadow-lg shadow-[#009640]/20 disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : step === 1 ? (
              <>Continuar <ArrowRight size={16} /></>
            ) : (
              'Ativar Minha Conta'
            )}
          </button>
          
          {step === 2 && (
            <button 
              type="button" 
              onClick={() => { setStep(1); setSenha(''); setErro(''); }}
              className="w-full text-xs font-bold text-slate-500 hover:text-slate-800 transition text-center"
            >
              Voltar e usar outro e-mail
            </button>
          )}
        </form>
      </div>
    </div>
  );
}