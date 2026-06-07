'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Menu, X, Lock, Mail, Building2,
  Map as MapIcon, UserCheck, TrendingUp, ShieldCheck, Globe,
  ArrowRight, Loader2, CheckCircle2, Bed, Compass, ClipboardList, ArrowLeft
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type TipoPortal = 'hotel' | 'guia' | 'pacote';

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
  const router = useRouter();

  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [portalSelecionado, setPortalSelecionado] = useState<TipoPortal | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [erroLogin, setErroLogin] = useState('');

  const [formNome, setFormNome] = useState('');
  const [formEmpresa, setFormEmpresa] = useState('');
  const [formTipo, setFormTipo] = useState('hotel');
  const [formTelefone, setFormTelefone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSucesso, setFormSucesso] = useState(false);
  const [erroForm, setErroForm] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const cur = window.scrollY;
      setShowHeader(cur < 80 || cur < lastScrollY);
      setLastScrollY(cur);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErroLogin('');
    try {
      const response = await fetch("https://sagaturismo-production.up.railway.app/api/v1/parceiros/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, senha: loginSenha })
      });
      const data = await response.json();
      if (response.ok && data.sucesso) {
        localStorage.setItem("parceiro_id", data.parceiro_id);
        localStorage.setItem("nome_negocio", data.nome_negocio);
        const tipoFinal = data.tipo_parceiro || portalSelecionado;
        localStorage.setItem("tipo_parceiro", tipoFinal);
        if (tipoFinal === 'hotel') router.push("/parceiros/dashboard-hotel");
        else if (tipoFinal === 'guia') router.push("/parceiros/dashboard-guia");
        else if (tipoFinal === 'pacote' || tipoFinal === 'agencia') router.push("/parceiros/dashboard-agencia");
        else router.push("/parceiros/dashboard-hotel");
      } else {
        setErroLogin(data.detail || data.mensagem || "Credenciais inválidas. Tente novamente.");
      }
    } catch (error) {
      setErroLogin("Falha na conexão com o servidor.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleInteresse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErroForm('');
    try {
      const response = await fetch("https://sagaturismo-production.up.railway.app/api/v1/parceiros/interesse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: formNome, empresa: formEmpresa, tipo: formTipo, telefone: formTelefone })
      });
      const data = await response.json();
      if (response.ok && data.sucesso) {
        setFormSucesso(true);
        setFormNome('');
        setFormEmpresa('');
        setFormTelefone('');
      } else {
        setErroForm(data.detail || data.mensagem || "Não foi possível processar o seu pedido. Tente mais tarde.");
      }
    } catch (error) {
      setErroForm("Falha ao conectar com o servidor da prefeitura.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 flex flex-col overflow-x-hidden`}>

      {/* ── HEADER ORIGINAL ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
              <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {['Hoteis', 'Pacotes', 'Rotas', 'Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`} className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
                {item}
              </Link>
            ))}
            <Link href="/portal-servicos" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
              Portal Serviços
            </Link>
          </nav>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas Turísticas</Link>
            <Link href="/eventos" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Agenda Cultural</Link>
            <Link href="/pacotes" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Pacotes</Link>
            <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas</Link>
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* ── HERO REDESENHADO ── */}
      <section className="relative w-full min-h-[100vh] lg:min-h-[85vh] bg-[#002f40] pt-[80px] md:pt-[100px] pb-12 md:pb-20 flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/IMG_1804.PNG" alt="Turismo" fill className="object-cover mix-blend-overlay" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002f40] via-[#002f40]/9 to-transparent" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-5 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">

            {/* TEXTO HERO */}
            <ScrollReveal delay={100} className="text-left mt-6 lg:mt-0">

              <h1 className={`${jakarta.className} text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6 drop-shadow-lg`}>
                O turismo de São Geraldo<br />é de <span className="text-[#F9C400]">todos nós.</span>
              </h1>

              <p className="text-white/75 font-medium text-base md:text-lg leading-relaxed max-w-xl mb-8">
                Um portal público, transparente e sem taxas para conectar os nossos parceiros locais — pousadeiros, guias e agências — diretamente aos viajantes que chegam ao nosso município.
              </p>
            </ScrollReveal>

            {/* LOBBY DE ACESSO */}
            <ScrollReveal delay={300} className="w-full max-w-md mx-auto lg:ml-auto">
              <div className="relative w-full h-[460px]">

                {/* CARTÕES DE SELEÇÃO */}
                <div className={`absolute inset-0 w-full transition-all duration-500 ease-in-out ${portalSelecionado ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
                  <div className="bg-white rounded-[2rem] shadow-2xl p-7 flex flex-col gap-4">
                    <div>
                      <h3 className={`${jakarta.className} text-slate-900 text-xl font-black mb-1`}>Selecione o seu Portal</h3>
                      <p className="text-xs text-slate-400 font-medium">Escolha o tipo de parceiro para aceder</p>
                    </div>

                    <button onClick={() => setPortalSelecionado('hotel')} className="w-full bg-slate-50 rounded-2xl p-4 flex items-center gap-4 hover:ring-4 ring-[#00577C]/20 hover:bg-blue-50 transition-all group text-left border-2 border-transparent hover:border-[#00577C]/30">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl text-[#00577C] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><Bed size={24} /></div>
                      <div className="flex-1">
                        <h4 className={`${jakarta.className} text-base font-bold text-slate-900`}>Aceder Portal Hotéis</h4>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Quartos &amp; Hóspedes</p>
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-[#00577C] transition-colors" />
                    </button>

                    <button onClick={() => setPortalSelecionado('guia')} className="w-full bg-slate-50 rounded-2xl p-4 flex items-center gap-4 hover:ring-4 ring-[#1a6b2f]/20 hover:bg-green-50 transition-all group text-left border-2 border-transparent hover:border-[#1a6b2f]/30">
                      <div className="w-12 h-12 bg-green-50 rounded-xl text-[#1a6b2f] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><Compass size={24} /></div>
                      <div className="flex-1">
                        <h4 className={`${jakarta.className} text-base font-bold text-slate-900`}>Aceder Portal Guias</h4>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Passeios &amp; Turistas</p>
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-[#1a6b2f] transition-colors" />
                    </button>

                    <button onClick={() => setPortalSelecionado('pacote')} className="w-full bg-slate-50 rounded-2xl p-4 flex items-center gap-4 hover:ring-4 ring-amber-500/20 hover:bg-yellow-50 transition-all group text-left border-2 border-transparent hover:border-amber-400/30">
                      <div className="w-12 h-12 bg-yellow-50 rounded-xl text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><ClipboardList size={24} /></div>
                      <div className="flex-1">
                        <h4 className={`${jakarta.className} text-base font-bold text-slate-900`}>Aceder Portal Agências</h4>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Gestão de Pacotes</p>
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-amber-600 transition-colors" />
                    </button>

                    <div className="flex items-center gap-2 my-1">
                      <div className="flex-1 h-px bg-slate-100" />
                      <span className="text-[11px] text-slate-400">Ainda não tem acesso?</span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    <a href="#cadastro" className={`${jakarta.className} block w-full py-3 text-center bg-[#1a6b2f] hover:bg-[#0f4f20] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors`}>
                      Solicitar credenciamento gratuito
                    </a>
                  </div>
                </div>

                {/* FORMULÁRIO DE LOGIN */}
                <div className={`absolute inset-0 w-full transition-all duration-500 ease-in-out ${!portalSelecionado ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
                  <div className="bg-white rounded-[2rem] shadow-2xl p-8 border border-slate-100 h-full flex flex-col relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-2 ${portalSelecionado === 'hotel' ? 'bg-[#00577C]' : portalSelecionado === 'guia' ? 'bg-[#1a6b2f]' : 'bg-[#F9C400]'}`} />

                    <button type="button" onClick={() => { setPortalSelecionado(null); setErroLogin(''); }} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors mb-4 border border-slate-200 shadow-sm">
                      <ArrowLeft size={16} />
                    </button>

                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        {portalSelecionado === 'hotel' && <Bed className="text-[#00577C]" size={24} />}
                        {portalSelecionado === 'guia' && <Compass className="text-[#1a6b2f]" size={24} />}
                        {portalSelecionado === 'pacote' && <ClipboardList className="text-amber-700" size={24} />}
                        <h2 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900`}>
                          {portalSelecionado === 'hotel' && 'Portal Hoteleiro'}
                          {portalSelecionado === 'guia' && 'Portal do Guia'}
                          {portalSelecionado === 'pacote' && 'Portal de Agências'}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Insira as credenciais para aceder ao sistema.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4 flex-1 flex flex-col">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">E-mail de Registro</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input type="text" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required
                            className={`w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition-all ${portalSelecionado === 'hotel' ? 'focus:border-[#00577C]' : portalSelecionado === 'guia' ? 'focus:border-[#1a6b2f]' : 'focus:border-amber-500'}`}
                            placeholder="seu@email.com" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Palavra-passe</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input type="password" value={loginSenha} onChange={e => setLoginSenha(e.target.value)} required
                            className={`w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition-all ${portalSelecionado === 'hotel' ? 'focus:border-[#00577C]' : portalSelecionado === 'guia' ? 'focus:border-[#1a6b2f]' : 'focus:border-amber-500'}`}
                            placeholder="••••••••" />
                        </div>
                      </div>

                      {erroLogin && <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-center">{erroLogin}</p>}

                      <div className="mt-auto">
                        <button type="submit" disabled={isLoggingIn}
                          className={`w-full text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${portalSelecionado === 'hotel' ? 'bg-[#00577C] hover:bg-[#004a6b]' : portalSelecionado === 'guia' ? 'bg-[#1a6b2f] hover:bg-[#0f4f20]' : 'bg-amber-600 hover:bg-amber-700'}`}>
                          {isLoggingIn ? <><Loader2 className="animate-spin" size={18} /> Validando...</> : <span>Entrar na Área Privada</span>}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>


      {/* ── PORQUÊ SER PARCEIRO ── */}
      <section className="py-16 md:py-28 px-5 bg-white text-center overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-10 md:mb-16`}>Porquê juntar-se ao portal oficial?</h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 md:gap-10">
            <ScrollReveal delay={0}>
              <div className="bg-slate-50 rounded-[2rem] p-8 md:p-10 border border-slate-100 text-left hover:-translate-y-2 transition-transform duration-300 h-full">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#00577C] flex items-center justify-center mb-6"><Globe size={28} /></div>
                <h3 className={`${jakarta.className} text-xl font-bold text-slate-800 mb-4`}>Visibilidade para todos</h3>
                <p className="text-slate-600 font-medium leading-relaxed text-sm">Pequena pousada ou grande hotel — todos têm o mesmo espaço. O seu negócio é exibido nos canais oficiais da Prefeitura, sem favoritismos.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="bg-slate-50 rounded-[2rem] p-8 md:p-10 border border-slate-100 text-left hover:-translate-y-2 transition-transform duration-300 h-full">
                <div className="w-14 h-14 rounded-2xl bg-green-100 text-[#1a6b2f] flex items-center justify-center mb-6"><TrendingUp size={28} /></div>
                <h3 className={`${jakarta.className} text-xl font-bold text-slate-800 mb-4`}>Mais lucro, sem taxas</h3>
                <p className="text-slate-600 font-medium leading-relaxed text-sm"> O sistema oficial visa promover a economia local de forma justa. O seu dinheiro fica aqui.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="bg-slate-50 rounded-[2rem] p-8 md:p-10 border border-slate-100 text-left hover:-translate-y-2 transition-transform duration-300 h-full">
                <div className="w-14 h-14 rounded-2xl bg-yellow-100 text-[#d4a800] flex items-center justify-center mb-6"><ShieldCheck size={28} /></div>
                <h3 className={`${jakarta.className} text-xl font-bold text-slate-800 mb-4`}>Gestão simplificada</h3>
                <p className="text-slate-600 font-medium leading-relaxed text-sm">Um painel moderno para gerir reservas, pagamentos e fechar o seu calendário — com suporte da equipe da Secretaria de Turismo.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── FORMULÁRIO DE INTERESSE ── */}
      <section id="cadastro" className="py-16 md:py-28 px-5 bg-[#F5F7FA]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 md:gap-16 items-start">

          <ScrollReveal delay={100} className="flex-1 text-left">
            <p className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.25em] text-[#1a6b2f] mb-3`}>Credenciamento público</p>
            <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-5`}>
              Dê o próximo passo.<br />
              <span className="italic text-[#1a6b2f]">É gratuito e é seu direito.</span>
            </h2>
            <p className="text-slate-500 text-base leading-relaxed mb-8">
              Preencha o formulário com os dados da sua empresa ou serviço. A nossa equipa da Secretaria de Turismo entrará em contacto para validar o seu credenciamento e criar o seu acesso. Sem burocracia, sem custo nenhum.
            </p>

            <div className="space-y-0 divide-y divide-dashed divide-slate-200">
              {[
                { num: '1', title: 'Envie os dados do seu negócio', desc: 'Nome, tipo de serviço e contato para a equipe chegar até você.' },
                { num: '2', title: 'A equipe entra em contato', desc: 'Verificamos que o seu negócio está em situação regular no município e se possui autorização junto ao Ministério do Turismo.' },
                { num: '3', title: 'Recebe o acesso e começa a usar', desc: 'Login, painel e visibilidade imediata para os viajantes. Sem custo.' },
              ].map(step => (
                <div key={step.num} className="flex gap-4 py-5 items-start">
                  <div className="w-9 h-9 rounded-full bg-[#F9C400] text-[#002f40] flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">{step.num}</div>
                  <div>
                    <p className={`${jakarta.className} font-bold text-slate-800 text-sm mb-1`}>{step.title}</p>
                    <p className="text-slate-500 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300} className="w-full lg:w-[460px] bg-white rounded-[2rem] p-7 md:p-10 shadow-lg border border-slate-100 text-left">
            {formSucesso ? (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} className="text-[#1a6b2f]" /></div>
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-3`}>Pedido Enviado!</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">Agradecemos o seu interesse. A nossa equipa técnica irá analisar os seus dados e entrará em contacto brevemente.</p>
                <button onClick={() => setFormSucesso(false)} className="mt-8 text-sm font-bold text-[#1a6b2f] underline">Enviar outro pedido</button>
              </div>
            ) : (
              <form onSubmit={handleInteresse} className="space-y-4 md:space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-[50%_0] bg-[#1a6b2f] rotate-[-45deg] inline-block" />
                  <span className={`${jakarta.className} text-[11px] font-black uppercase tracking-widest text-[#1a6b2f]`}>Pedido de Credenciamento</span>
                </div>
                <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-4 border-b border-slate-100 pb-5`}>Quero participar do portal</h3>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <label className={`border-2 rounded-xl p-3 text-center cursor-pointer transition-all ${formTipo === 'hotel' ? 'border-[#1a6b2f] bg-green-50 text-[#1a6b2f]' : 'border-slate-100 text-slate-400'}`}>
                    <input type="radio" className="hidden" checked={formTipo === 'hotel'} onChange={() => setFormTipo('hotel')} />
                    <Building2 size={20} className="mx-auto mb-1" />
                    <span className="text-[10px] font-black uppercase">Alojamento</span>
                  </label>
                  <label className={`border-2 rounded-xl p-3 text-center cursor-pointer transition-all ${formTipo === 'guia' ? 'border-[#1a6b2f] bg-green-50 text-[#1a6b2f]' : 'border-slate-100 text-slate-400'}`}>
                    <input type="radio" className="hidden" checked={formTipo === 'guia'} onChange={() => setFormTipo('guia')} />
                    <UserCheck size={20} className="mx-auto mb-1" />
                    <span className="text-[10px] font-black uppercase">Guia ou Agente de viagem</span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">O seu Nome</label>
                  <input type="text" required value={formNome} onChange={e => setFormNome(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 px-4 text-sm font-bold outline-none focus:border-[#1a6b2f] transition-colors" placeholder="Nome completo" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Nome do Negócio</label>
                  <input type="text" required value={formEmpresa} onChange={e => setFormEmpresa(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 px-4 text-sm font-bold outline-none focus:border-[#1a6b2f] transition-colors" placeholder="Ex: Pousada da Serra" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">WhatsApp para contato</label>
                  <input type="tel" required value={formTelefone} onChange={e => setFormTelefone(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 px-4 text-sm font-bold outline-none focus:border-[#1a6b2f] transition-colors" placeholder="(94) 90000-0000" />
                </div>

                {erroForm && <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-center">{erroForm}</p>}

                <button type="submit" disabled={isSubmitting} className={`${jakarta.className} w-full bg-[#1a6b2f] hover:bg-[#0f4f20] text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-2`}>
                  {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Enviando...</> : <><ArrowRight size={16} /> Enviar Pedido</>}
                </button>
                <p className="text-[10px] text-center text-slate-400 font-bold mt-3">Os seus dados estão protegidos. Não enviamos spam.</p>
              </form>
            )}
          </ScrollReveal>

        </div>
      </section>

      {/* ── FOOTER ORIGINAL ── */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de São Geraldo do Araguaia" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                © 2026 Secretaria Municipal de Turismo - SGA | Todos os direitos reservados
              </p>
              <p className="text-[10px] font-bold text-slate-400/80">CNPJ: 10.249.241/0001-22</p>
            </div>
          </div>

          <div className="flex gap-10">
            <div className="text-left border-l-2 border-slate-100 pl-9">
              <p className="text-[10px] font-black text-[#00577C] uppercase mb-1">Contato Oficial</p>
              <p className="text-xs font-bold text-slate-500 tracking-tight">setursaga@gmail.com</p>
            </div>
            <ShieldCheck size={40} className="text-[#1a6b2f] opacity-30" />
          </div>
        </div>
      </footer>

    </main>
  );
}