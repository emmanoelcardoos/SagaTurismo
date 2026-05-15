'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Menu, X, Lock, Mail, ChevronRight, Building2, 
  Map as MapIcon, UserCheck, TrendingUp, ShieldCheck, Globe, 
  Phone, ArrowRight, Loader2, CheckCircle2 
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── COMPONENTE MÁGICO DE ANIMAÇÃO ──
function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setTimeout(() => setIsVisible(true), delay);
        if (domRef.current) observer.unobserve(domRef.current);
      }
    }, { threshold: 0.15 });

    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
    >
      {children}
    </div>
  );
}

export default function ParceirosPage() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estados do Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Estados do Formulário de Interesse
  const [formNome, setFormNome] = useState('');
  const [formEmpresa, setFormEmpresa] = useState('');
  const [formTipo, setFormTipo] = useState('hotel');
  const [formTelefone, setFormTelefone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSucesso, setFormSucesso] = useState(false);

  // Lógica de Scroll do Header
  useEffect(() => {
    const handleScroll = () => {
      const cur = window.scrollY;
      setShowHeader(cur < 80 || cur < lastScrollY);
      setLastScrollY(cur);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
    }, 1500);
  };

  const handleInteresse = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFormSucesso(true);
    }, 1500);
  };

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 flex flex-col overflow-x-hidden`}>
      
      {/* ── HEADER ── */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-16 md:w-56 shrink-0"><Image src="/logop.png" alt="SGA" fill priority className="object-contain object-left" /></div>
             <div className="hidden border-l border-slate-200 pl-4 md:block text-left">
               <p className={`${jakarta.className} text-xl font-bold text-[#00577C] leading-none`}>SagaTurismo</p>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Portal do Parceiro</p>
             </div>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl border border-slate-200 p-2 lg:hidden text-[#00577C] bg-slate-50">
              {isMobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
          </div>
          <nav className="hidden lg:flex items-center gap-7 font-bold text-sm">
            <Link href="/" className="text-slate-600 hover:text-[#00577C]">Voltar ao Portal</Link>
            <a href="#cadastro" className="bg-[#F9C400] text-[#00577C] px-6 py-3 rounded-full hover:bg-[#ffd633] transition-all shadow-md">Seja um Parceiro</a>
          </nav>
        </div>
        {isMobileMenuOpen && (
          <div className="absolute top-[100%] left-0 w-full bg-white border-b border-slate-200 p-5 flex flex-col gap-4 shadow-xl lg:hidden text-left animate-in slide-in-from-top-4">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Voltar ao Portal</Link>
            <a href="#cadastro" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#F9C400] text-[#00577C] font-black px-4 py-3.5 rounded-xl text-center shadow-md">Seja um Parceiro</a>
          </div>
        )}
      </header>

      {/* ── HERO & LOGIN SECTION ── */}
      <section className="relative w-full min-h-[100vh] lg:min-h-[85vh] bg-[#002f40] pt-[100px] md:pt-[120px] pb-12 md:pb-20 flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
           <Image src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000" alt="Turismo" fill className="object-cover opacity-30 mix-blend-overlay" priority />
           <div className="absolute inset-0 bg-gradient-to-r from-[#002f40] via-[#002f40]/90 to-transparent" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-5 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* TEXTO HERO (Esquerda) com Reveal */}
            <ScrollReveal delay={100} className="text-left order-2 lg:order-1 mt-10 lg:mt-0">
               <div className="inline-flex items-center gap-2 bg-[#F9C400] text-[#00577C] px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest shadow-md mb-6">
                 <ShieldCheck size={16} /> Sistema Oficial
               </div>
               <h1 className={`${jakarta.className} text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6 drop-shadow-lg`}>
                 Conecte o seu negócio ao <span className="text-[#F9C400]">mundo.</span>
               </h1>
               <p className="text-white/80 font-medium text-base md:text-lg leading-relaxed max-w-xl mb-8">
                 O portal SagaTurismo é a montra oficial de São Geraldo do Araguaia. Aumente as suas reservas, gira a sua disponibilidade em tempo real e faça parte do desenvolvimento da nossa região.
               </p>
               <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-white/90">
                  <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-[#009640]"/> Zero comissões abusivas</span>
                  <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-[#009640]"/> Suporte direto</span>
               </div>
            </ScrollReveal>

            {/* CARD DE LOGIN (Direita) com Reveal ligeiramente atrasado */}
            <ScrollReveal delay={300} className="order-1 lg:order-2 w-full max-w-md mx-auto lg:ml-auto">
               <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-slate-100 relative overflow-hidden text-left">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#00577C] to-[#F9C400]" />
                  
                  <div className="mb-8">
                     <h2 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900`}>Aceder à Conta</h2>
                     <p className="text-sm text-slate-500 font-medium mt-2">Área exclusiva para parceiros credenciados.</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">E-mail ou NIF/CPF</label>
                        <div className="relative">
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                           <input type="text" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-all" placeholder="seu@email.com" />
                        </div>
                     </div>
                     <div>
                        <div className="flex items-center justify-between mb-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Palavra-passe</label>
                           <a href="#" className="text-[10px] font-bold text-[#00577C] hover:underline">Esqueceu?</a>
                        </div>
                        <div className="relative">
                           <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                           <input type="password" value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white transition-all" placeholder="••••••••" />
                        </div>
                     </div>
                     
                     <button type="submit" disabled={isLoggingIn} className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-4 rounded-2xl font-black uppercase text-xs md:text-sm tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
                        {isLoggingIn ? (
                           <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18}/> Autenticando...</span>
                        ) : (
                           <span>Entrar no Dashboard</span>
                        )}
                     </button>
                  </form>
               </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* ── PORQUE SER PARCEIRO (BENEFÍCIOS) ── */}
      <section className="py-20 md:py-32 px-5 bg-white text-center overflow-hidden">
         <div className="max-w-7xl mx-auto">
            <ScrollReveal>
               <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[#009640] mb-3">Vantagens Exclusivas</p>
               <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-16`}>Porquê juntar-se ao portal oficial?</h2>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
               <ScrollReveal delay={0}>
                 <div className="bg-slate-50 rounded-[2rem] p-8 md:p-10 border border-slate-100 text-left hover:-translate-y-2 transition-transform duration-300 h-full">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#00577C] flex items-center justify-center mb-6 shadow-sm"><Globe size={28}/></div>
                    <h3 className={`${jakarta.className} text-xl font-bold text-slate-800 mb-4`}>Visibilidade Global</h3>
                    <p className="text-slate-600 font-medium leading-relaxed text-sm">O seu negócio é exibido diretamente a turistas que procuram São Geraldo do Araguaia através dos canais oficiais da Prefeitura.</p>
                 </div>
               </ScrollReveal>

               <ScrollReveal delay={200}>
                 <div className="bg-slate-50 rounded-[2rem] p-8 md:p-10 border border-slate-100 text-left hover:-translate-y-2 transition-transform duration-300 h-full">
                    <div className="w-14 h-14 rounded-2xl bg-green-100 text-[#009640] flex items-center justify-center mb-6 shadow-sm"><TrendingUp size={28}/></div>
                    <h3 className={`${jakarta.className} text-xl font-bold text-slate-800 mb-4`}>Mais Lucro, Sem Taxas</h3>
                    <p className="text-slate-600 font-medium leading-relaxed text-sm">Esqueça as comissões de 20% das OTAs tradicionais. O sistema oficial visa promover a economia local de forma justa e transparente.</p>
                 </div>
               </ScrollReveal>

               <ScrollReveal delay={400}>
                 <div className="bg-slate-50 rounded-[2rem] p-8 md:p-10 border border-slate-100 text-left hover:-translate-y-2 transition-transform duration-300 h-full">
                    <div className="w-14 h-14 rounded-2xl bg-yellow-100 text-[#d9a000] flex items-center justify-center mb-6 shadow-sm"><ShieldCheck size={28}/></div>
                    <h3 className={`${jakarta.className} text-xl font-bold text-slate-800 mb-4`}>Gestão Simplificada</h3>
                    <p className="text-slate-600 font-medium leading-relaxed text-sm">Receba um painel de controlo moderno para gerir reservas, pagamentos e fechar o seu calendário com um clique.</p>
                 </div>
               </ScrollReveal>
            </div>
         </div>
      </section>

      {/* ── FORMULÁRIO DE INTERESSE (CADASTRO) ── */}
      <section id="cadastro" className="py-20 md:py-32 px-5 bg-slate-900 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at top right, #F9C400 0%, transparent 40%)' }}></div>
         
         <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-center relative z-10">
            
            <ScrollReveal delay={100} className="flex-1 text-left">
               <h2 className={`${jakarta.className} text-3xl md:text-5xl font-black text-white leading-tight mb-6`}>Dê o próximo passo. <br className="hidden md:block"/><span className="text-[#F9C400]">Seja um Parceiro.</span></h2>
               <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-8">Preencha o formulário com os dados da sua empresa ou serviço. A nossa equipa da Secretaria de Turismo entrará em contacto para validar o seu credenciamento e criar o seu acesso.</p>
               
               <div className="space-y-6">
                  <div className="flex items-center gap-4 text-white">
                     <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><Building2 size={24} className="text-[#F9C400]"/></div>
                     <div><p className="font-bold">Alojamentos</p><p className="text-xs text-slate-400">Hotéis, Pousadas e Hostels</p></div>
                  </div>
                  <div className="flex items-center gap-4 text-white">
                     <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><UserCheck size={24} className="text-[#F9C400]"/></div>
                     <div><p className="font-bold">Guias Turísticos</p><p className="text-xs text-slate-400">Profissionais credenciados</p></div>
                  </div>
                  <div className="flex items-center gap-4 text-white">
                     <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><MapIcon size={24} className="text-[#F9C400]"/></div>
                     <div><p className="font-bold">Atrações & Passeios</p><p className="text-xs text-slate-400">Parques, Barcos, Experiências</p></div>
                  </div>
               </div>
            </ScrollReveal>

            {/* AQUI ESTAVA O ERRO DA TAG DE FECHO - AGORA CORRIGIDO */}
            <ScrollReveal delay={300} className="w-full lg:w-[480px] bg-white rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-left">
               {formSucesso ? (
                  <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                     <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} className="text-[#009640]"/></div>
                     <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-3`}>Pedido Enviado!</h3>
                     <p className="text-slate-500 text-sm font-medium leading-relaxed">Agradecemos o seu interesse. A nossa equipa técnica irá analisar os seus dados e entrará em contacto brevemente.</p>
                     <button onClick={() => setFormSucesso(false)} className="mt-8 text-sm font-bold text-[#00577C] underline">Enviar outro pedido</button>
                  </div>
               ) : (
                  <form onSubmit={handleInteresse} className="space-y-5">
                     <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-6`}>Pedido de Registo</h3>
                     
                     <div className="grid grid-cols-2 gap-3 mb-6">
                        <label className={`border-2 rounded-xl p-3 text-center cursor-pointer transition-all ${formTipo === 'hotel' ? 'border-[#00577C] bg-blue-50 text-[#00577C]' : 'border-slate-100 text-slate-500'}`}>
                           <input type="radio" className="hidden" checked={formTipo==='hotel'} onChange={() => setFormTipo('hotel')}/>
                           <Building2 size={20} className="mx-auto mb-1"/><span className="text-[10px] font-black uppercase">Alojamento</span>
                        </label>
                        <label className={`border-2 rounded-xl p-3 text-center cursor-pointer transition-all ${formTipo === 'guia' ? 'border-[#00577C] bg-blue-50 text-[#00577C]' : 'border-slate-100 text-slate-500'}`}>
                           <input type="radio" className="hidden" checked={formTipo==='guia'} onChange={() => setFormTipo('guia')}/>
                           <UserCheck size={20} className="mx-auto mb-1"/><span className="text-[10px] font-black uppercase">Guia Oficial</span>
                        </label>
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">O seu Nome</label>
                        <input type="text" required value={formNome} onChange={(e) => setFormNome(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 px-4 text-sm font-bold outline-none focus:border-[#00577C]" placeholder="Nome completo" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Nome do Negócio</label>
                        <input type="text" required value={formEmpresa} onChange={(e) => setFormEmpresa(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 px-4 text-sm font-bold outline-none focus:border-[#00577C]" placeholder="Ex: Pousada da Serra" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">WhatsApp de Contacto</label>
                        <input type="tel" required value={formTelefone} onChange={(e) => setFormTelefone(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 px-4 text-sm font-bold outline-none focus:border-[#00577C]" placeholder="(94) 90000-0000" />
                     </div>

                     <button type="submit" disabled={isSubmitting} className="w-full bg-[#009640] hover:bg-[#007a33] text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
                        {isSubmitting ? (
                           <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Enviando...</span>
                        ) : (
                           <span className="flex items-center gap-2"><ArrowRight size={16}/> Enviar Pedido</span>
                        )}
                     </button>
                     <p className="text-[10px] text-center text-slate-400 font-bold mt-4">Os seus dados estão protegidos. Não enviamos spam.</p>
                  </form>
               )}
            </ScrollReveal>

         </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-5 border-t border-slate-200 bg-white text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative h-10 w-28 md:h-12 md:w-36"><Image src="/logop.png" alt="SGA" fill className="object-contain object-left md:object-center" /></div>
            <div className="hidden border-l border-slate-200 pl-4 md:block">
              <p className={`${jakarta.className} text-xl font-bold text-[#00577C]`}>SagaTurismo</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Portal do Parceiro</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">© 2026 Secretaria Municipal de Turismo</p>
        </div>
      </footer>
    </main>
  );
}