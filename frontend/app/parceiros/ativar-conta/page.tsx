'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Mail, Lock, Building2, MapPin, Loader2, CheckCircle2, Utensils } from 'lucide-react';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function AtivarContaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome_negocio: '',
    tipo_parceiro: 'hotel',
    telefone: '',
    email: '',
    senha: ''
  });
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const response = await fetch("https://sagaturismo-production.up.railway.app/api/v1/parceiros/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (response.ok && data.sucesso) {
        setSucesso(true);
        // Redireciona para o login após 3 segundos
        setTimeout(() => router.push('/parceiros'), 3000);
      } else {
        setErro(data.mensagem || "Erro ao criar conta.");
      }
    } catch (error) {
      setErro("Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className={`${inter.className} min-h-screen bg-slate-50 flex items-center justify-center p-5 relative overflow-hidden`}>
        {/* Background Halos */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none opacity-40" style={{ background: 'radial-gradient(ellipse at top right, rgba(0,150,64,0.15) 0%, transparent 70%)' }} />
        
        <div className="bg-white p-10 rounded-[2rem] shadow-xl text-center max-w-md w-full border border-slate-100 relative z-10">
          <CheckCircle2 size={60} className="text-[#009640] mx-auto mb-5" />
          <h2 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-2`}>Conta Criada!</h2>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">O seu cadastro foi realizado com sucesso. Redirecionando para o portal em instantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${inter.className} min-h-screen bg-slate-50 flex items-center justify-center p-5 relative overflow-hidden`}>
      {/* Background Halos */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none opacity-40" style={{ background: 'radial-gradient(ellipse at top right, rgba(249,196,0,0.15) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none opacity-40" style={{ background: 'radial-gradient(ellipse at bottom left, rgba(0,150,64,0.15) 0%, transparent 70%)' }} />

      <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-2xl shadow-slate-200/50 max-w-md w-full border border-slate-100 relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/logop.png" alt="SagaTurismo" width={120} height={40} className="h-10 w-auto object-contain" />
        </div>

        <div className="mb-8 text-center">
          <h2 className={`${jakarta.className} text-2xl font-black text-[#002f40] mb-2`}>Portal do Parceiro</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">Crie sua conta para divulgar o seu negócio no portal oficial de turismo de São Geraldo do Araguaia.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome do Negócio */}
          <div>
            <label className={`${jakarta.className} text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5`}>Nome do Negócio / Guia</label>
            <input 
              type="text" 
              required 
              value={formData.nome_negocio} 
              onChange={e => setFormData({...formData, nome_negocio: e.target.value})} 
              className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-[#009640] focus:bg-white focus:ring-4 focus:ring-[#009640]/10 placeholder:text-slate-400"
              placeholder="Ex: Pousada Araguaia" 
            />
          </div>

          {/* Tipo de Parceiro */}
          <div>
             <label className={`${jakarta.className} text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5`}>Categoria</label>
            <div className="grid grid-cols-3 gap-2">
              <label className={`border-2 rounded-xl p-2.5 text-center cursor-pointer transition-all flex flex-col items-center gap-1 ${formData.tipo_parceiro === 'hotel' ? 'border-[#009640] bg-[#009640]/5 text-[#009640]' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                <input type="radio" className="hidden" checked={formData.tipo_parceiro === 'hotel'} onChange={() => setFormData({...formData, tipo_parceiro: 'hotel'})} />
                <Building2 size={16} />
                <span className={`${jakarta.className} text-[9px] font-bold uppercase tracking-wide`}>Hospedagem</span>
              </label>

              <label className={`border-2 rounded-xl p-2.5 text-center cursor-pointer transition-all flex flex-col items-center gap-1 ${formData.tipo_parceiro === 'guia' ? 'border-[#009640] bg-[#009640]/5 text-[#009640]' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                <input type="radio" className="hidden" checked={formData.tipo_parceiro === 'guia'} onChange={() => setFormData({...formData, tipo_parceiro: 'guia'})} />
                <MapPin size={16} />
                <span className={`${jakarta.className} text-[9px] font-bold uppercase tracking-wide`}>Guia/Agência</span>
              </label>

              <label className={`border-2 rounded-xl p-2.5 text-center cursor-pointer transition-all flex flex-col items-center gap-1 ${formData.tipo_parceiro === 'restaurante' ? 'border-[#009640] bg-[#009640]/5 text-[#009640]' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                <input type="radio" className="hidden" checked={formData.tipo_parceiro === 'restaurante'} onChange={() => setFormData({...formData, tipo_parceiro: 'restaurante'})} />
                <Utensils size={16} />
                <span className={`${jakarta.className} text-[9px] font-bold uppercase tracking-wide`}>Gastronomia (em breve)</span>
              </label>
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label className={`${jakarta.className} text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5`}>E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                required 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-[#009640] focus:bg-white focus:ring-4 focus:ring-[#009640]/10 placeholder:text-slate-400"
                placeholder="seu@email.com.br"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className={`${jakarta.className} text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5`}>Criar Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                required 
                value={formData.senha} 
                onChange={e => setFormData({...formData, senha: e.target.value})} 
                minLength={6} 
                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-[#009640] focus:bg-white focus:ring-4 focus:ring-[#009640]/10 placeholder:text-slate-400"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center border border-red-100">
              {erro}
            </p>
          )}

          {/* Botão de Submit */}
          <button 
            type="submit" 
            disabled={loading} 
            className={`${jakarta.className} w-full bg-[#009640] hover:bg-[#007a33] active:scale-[0.98] text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest mt-2 transition-all shadow-lg shadow-[#009640]/20 disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Ativar Minha Conta'}
          </button>
        </form>
      </div>
    </div>
  );
}