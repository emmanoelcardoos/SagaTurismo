'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Mail, Lock, Loader2, CheckCircle2, Building2, ArrowRight, CreditCard, Calendar, Phone, MapPin, Map } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function AtivarContaPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [parceiro, setParceiro] = useState<any>(null);
  
  // Dados Formulário
  const [email, setEmail] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  
  // Endereço
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  
  // Senhas
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  // ◄── BUSCAR CEP AUTOMATICAMENTE ──►
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '');
    setCep(valor);

    if (valor.length === 8) {
      setBuscandoCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${valor}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setEndereco(data.logradouro);
          setBairro(data.bairro);
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  // ◄── PASSO 1: VERIFICAR E-MAIL ──►
  const handleVerificarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const { data, error } = await supabase.from('parceiros').select('*').eq('email', email).single();

      if (error || !data) throw new Error("E-mail não encontrado. Solicite o pré-cadastro à Prefeitura.");
      if (data.status === 'ativo') throw new Error("Esta conta já está ativa! Faça login no portal.");

      setParceiro(data);
      if (data.telefone) setTelefone(data.telefone); // Pré-preenche se existir
      setStep(2);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ◄── PASSO 2: CRIAR CONTA ASAAS E SUPABASE ──►
  const handleAtivarConta = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      if (senha !== confirmarSenha) throw new Error("As senhas não coincidem.");
      if (senha.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");
      
      const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
      const cleanCep = cep.replace(/\D/g, '');
      const cleanTelefone = telefone.replace(/\D/g, '');

      if (cleanCpfCnpj.length < 11) throw new Error("Insira um CPF ou CNPJ válido.");
      if (cleanCep.length !== 8) throw new Error("Insira um CEP válido.");
      if (!dataNascimento) throw new Error("Data de nascimento/fundação é obrigatória.");

      // 1. Cria a conta no Asaas via API Python
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sagaturismo-production.up.railway.app';
      const resAsaas = await fetch(`${apiUrl}/api/v1/parceiros/criar-carteira`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parceiro.nome_negocio,
          email: email,
          cpfCnpj: cleanCpfCnpj,
          phone: cleanTelefone,
          postalCode: cleanCep,
          address: endereco,
          addressNumber: numero,
          province: bairro
        })
      });

      const dataAsaas = await resAsaas.json();

      if (!dataAsaas.sucesso) {
        throw new Error(dataAsaas.erro || "Erro ao criar carteira financeira. Verifique os dados.");
      }

      const walletId = dataAsaas.asaas_wallet_id;

      // 2. Cria Login no Supabase
      const { error: authError } = await supabase.auth.signUp({ email, password: senha });
      if (authError) throw new Error("Erro ao criar credenciais: " + authError.message);

      // 3. Atualiza Parceiro no Supabase
      const { error: updateError } = await supabase.from('parceiros').update({ 
          status: 'ativo',
          asaas_wallet_id: walletId,
          telefone: telefone // Atualiza caso ele tenha alterado
      }).eq('email', email);

      if (updateError) throw new Error("Conta financeira criada, mas erro ao ativar perfil.");

      setSucesso(true);
      setTimeout(() => router.push('/parceiros'), 3000);
      
    } catch (err: any) {
      setErro(err.message || "Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ◄── TELA SUCESSO ──►
  if (sucesso) {
    return (
      <div className={`${inter.className} min-h-screen bg-slate-50 flex items-center justify-center p-5 relative overflow-hidden`}>
        <div className="bg-white p-10 rounded-[2rem] shadow-xl text-center max-w-md w-full border border-slate-100 relative z-10">
          <CheckCircle2 size={60} className="text-[#009640] mx-auto mb-5" />
          <h2 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-2`}>Conta Ativada!</h2>
          <p className="text-slate-500 font-medium text-sm">Bem-vindo(a)! A sua carteira digital foi criada com sucesso. A redirecionar...</p>
        </div>
      </div>
    );
  }

  // ◄── RENDERIZAÇÃO GERAL ──►
  const inputClass = "w-full bg-slate-50/50 border-2 border-slate-100 rounded-xl py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-[#009640] focus:bg-white focus:ring-4 focus:ring-[#009640]/10 placeholder:text-slate-400";
  const labelClass = `${jakarta.className} text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1`;

  return (
    <div className={`${inter.className} min-h-screen bg-slate-50 flex items-center justify-center p-5 py-10 relative overflow-hidden`}>
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl shadow-slate-200/50 max-w-lg w-full border border-slate-100 relative z-10 my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <div className="flex justify-center mb-6">
          <Image src="/logop.png" alt="SagaTurismo" width={100} height={35} className="h-8 w-auto object-contain" />
        </div>

        <div className="mb-6 text-center">
          <h2 className={`${jakarta.className} text-2xl font-black text-[#002f40] mb-2`}>Ativar Conta</h2>
          {step === 1 ? (
            <p className="text-xs text-slate-500 font-medium">Insira o e-mail pré-cadastrado para continuar.</p>
          ) : (
            <div className="bg-[#009640]/10 border border-[#009640]/20 rounded-xl p-3 inline-flex items-center gap-2">
              <Building2 size={16} className="text-[#009640]" />
              <span className="text-sm font-bold text-[#009640]">{parceiro?.nome_negocio}</span>
            </div>
          )}
        </div>

        <form onSubmit={step === 1 ? handleVerificarEmail : handleAtivarConta} className="space-y-4">
          
          <div>
            <label className={labelClass}>E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="email" required disabled={step === 2} value={email} onChange={e => setEmail(e.target.value)} className={`${inputClass} ${step === 2 ? 'opacity-60 bg-slate-100' : ''}`} placeholder="seu@email.com.br"/>
            </div>
          </div>

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>CPF ou CNPJ *</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" required value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} className={inputClass} placeholder="Apenas números" maxLength={14} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Nascimento/Fundação *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="date" required value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>

              <div>
                  <label className={labelClass}>Telemóvel / WhatsApp *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" required value={telefone} onChange={e => setTelefone(e.target.value)} className={inputClass} placeholder="(94) 99999-9999" />
                  </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className={labelClass}>CEP * {buscandoCep && <Loader2 size={10} className="inline animate-spin ml-1 text-[#009640]"/>}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" required value={cep} onChange={handleCepChange} maxLength={8} className={inputClass} placeholder="68581000" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Bairro *</label>
                  <div className="relative">
                    <Map className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" required value={bairro} onChange={e => setBairro(e.target.value)} className={inputClass} placeholder="Ex: Centro" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className={labelClass}>Rua / Endereço *</label>
                  <div className="relative">
                    <Map className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" required value={endereco} onChange={e => setEndereco(e.target.value)} className={inputClass} placeholder="Nome da rua" />
                  </div>
                </div>
                <div className="col-span-1">
                  <label className={labelClass}>Número *</label>
                  <input type="text" required value={numero} onChange={e => setNumero(e.target.value)} className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#009640]" placeholder="Nº" />
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Criar Senha *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="password" required minLength={6} value={senha} onChange={e => setSenha(e.target.value)} className={inputClass} placeholder="Min 6 carateres" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirmar Senha *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="password" required minLength={6} value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} className={inputClass} placeholder="Repetir senha" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {erro && <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center border border-red-100">{erro}</p>}

          <button type="submit" disabled={loading} className={`${jakarta.className} w-full bg-[#009640] hover:bg-[#007a33] text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-widest mt-2 transition-all flex justify-center items-center gap-2 shadow-lg disabled:opacity-70`}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : step === 1 ? <><ArrowRight size={16} /> Continuar</> : 'Concluir Ativação'}
          </button>
          
          {step === 2 && (
            <button type="button" onClick={() => { setStep(1); setSenha(''); setErro(''); }} className="w-full text-xs font-bold text-slate-500 hover:text-slate-800 mt-2 text-center">
              Voltar e usar outro e-mail
            </button>
          )}
        </form>
      </div>
    </div>
  );
}