'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Menu, X, Lock, Mail, Building2,
  Users2, HeartHandshake, Sprout, ShieldCheck,
  ArrowRight, Loader2, Bed, Compass, ClipboardList, ArrowLeft, ExternalLink
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

// ◄── IMPORTAÇÃO DO SUPABASE ──►
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    const handleScroll = () => {
      const cur = window.scrollY;
      setShowHeader(cur < 80 || cur < lastScrollY);
      setLastScrollY(cur);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // ◄── FUNÇÃO DE LOGIN ──►
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErroLogin('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginSenha,
      });

      if (authError) {
        setErroLogin("E-mail ou palavra-passe incorretos.");
        setIsLoggingIn(false);
        return;
      }

      const { data: parceiroData, error: parceiroError } = await supabase
        .from('parceiros')
        .select('*')
        .eq('email', loginEmail)
        .single();

      if (parceiroError || !parceiroData) {
        setErroLogin("Perfil de parceiro não encontrado no sistema.");
        await supabase.auth.signOut();
        setIsLoggingIn(false);
        return;
      }

      if (parceiroData.status !== 'ativo') {
        setErroLogin("A sua conta encontra-se pendente. Por favor, ative a conta ou contacte a prefeitura.");
        await supabase.auth.signOut();
        setIsLoggingIn(false);
        return;
      }

      localStorage.setItem("parceiro_id", parceiroData.id);
      localStorage.setItem("nome_negocio", parceiroData.nome_negocio);
      const tipoFinal = parceiroData.tipo_parceiro || portalSelecionado;
      localStorage.setItem("tipo_parceiro", tipoFinal);

      if (tipoFinal === 'hotel') router.push("/parceiros/dashboard-hotel");
      else if (tipoFinal === 'guia') router.push("/parceiros/dashboard-guia");
      else if (tipoFinal === 'pacote' || tipoFinal === 'agencia') router.push("/parceiros/dashboard-agencia");
      else router.push("/parceiros/dashboard-hotel");

    } catch (error) {
      setErroLogin("Falha na conexão com o servidor.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <main className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 flex flex-col overflow-x-hidden`}>

      {/* ── HEADER ── */}
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
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative w-full min-h-[100vh] lg:min-h-[85vh] bg-[#002f40] pt-[80px] md:pt-[100px] pb-12 md:pb-20 flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/IMG_1804.PNG" alt="Turismo" fill className="object-cover mix-blend-overlay" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002f40] via-[#002f40]/9 to-transparent" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-5 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">

            {/* TEXTO HERO COMUNITÁRIO */}
            <ScrollReveal delay={100} className="text-left mt-6 lg:mt-0">
              <h1 className={`${jakarta.className} text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6 drop-shadow-lg`}>
                O turismo da nossa terra,<br />feito pela <span className="text-[#F9C400]">nossa gente.</span>
              </h1>

              <p className="text-white/75 font-medium text-base md:text-lg leading-relaxed max-w-xl mb-8">
                Uma rede colaborativa, transparente e livre de taxas para conectar os nossos parceiros locais — pousadeiros, guias e iniciativas comunitárias — aos viajantes que querem viver a verdadeira essência do Araguaia.
              </p>
            </ScrollReveal>

            {/* LOBBY DE ACESSO */}
            <ScrollReveal delay={300} className="w-full max-w-md mx-auto lg:ml-auto">
              <div className="relative w-full h-[480px]">

                {/* CARTÕES DE SELEÇÃO */}
                <div className={`absolute inset-0 w-full transition-all duration-500 ease-in-out ${portalSelecionado ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
                  <div className="bg-white rounded-[2rem] shadow-2xl p-7 flex flex-col gap-4">
                    <div>
                      <h3 className={`${jakarta.className} text-slate-900 text-xl font-black mb-1`}>Área da Comunidade</h3>
                      <p className="text-xs text-slate-500 font-medium">Selecione o seu perfil para entrar</p>
                    </div>

                    <button onClick={() => setPortalSelecionado('hotel')} className="w-full bg-slate-50 rounded-2xl p-4 flex items-center gap-4 hover:ring-4 ring-[#00577C]/20 hover:bg-blue-50 transition-all group text-left border-2 border-transparent hover:border-[#00577C]/30">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl text-[#00577C] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><Bed size={24} /></div>
                      <div className="flex-1">
                        <h4 className={`${jakarta.className} text-base font-bold text-slate-900`}>Alojamentos Locais</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Gestão de Quartos</p>
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-[#00577C] transition-colors" />
                    </button>

                    <button onClick={() => setPortalSelecionado('guia')} className="w-full bg-slate-50 rounded-2xl p-4 flex items-center gap-4 hover:ring-4 ring-[#1a6b2f]/20 hover:bg-green-50 transition-all group text-left border-2 border-transparent hover:border-[#1a6b2f]/30">
                      <div className="w-12 h-12 bg-green-50 rounded-xl text-[#1a6b2f] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><Compass size={24} /></div>
                      <div className="flex-1">
                        <h4 className={`${jakarta.className} text-base font-bold text-slate-900`}>Guias & Condutores</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Experiências Guiadas</p>
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-[#1a6b2f] transition-colors" />
                    </button>

                    <button onClick={() => setPortalSelecionado('pacote')} className="w-full bg-slate-50 rounded-2xl p-4 flex items-center gap-4 hover:ring-4 ring-amber-500/20 hover:bg-yellow-50 transition-all group text-left border-2 border-transparent hover:border-amber-400/30">
                      <div className="w-12 h-12 bg-yellow-50 rounded-xl text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><ClipboardList size={24} /></div>
                      <div className="flex-1">
                        <h4 className={`${jakarta.className} text-base font-bold text-slate-900`}>Agências & Iniciativas</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Roteiros Integrados</p>
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-amber-600 transition-colors" />
                    </button>

                    <div className="flex items-center gap-2 my-1">
                      <div className="flex-1 h-px bg-slate-100" />
                      <span className="text-[11px] text-slate-400">Quer juntar-se à rede?</span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    <a href="#cadastro" className={`${jakarta.className} block w-full py-3 text-center bg-[#1a6b2f] hover:bg-[#0f4f20] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors`}>
                      Participar do portal municipal
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
                          {portalSelecionado === 'pacote' && 'Portal das Agências'}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Bem-vindo de volta à nossa rede. Insira os seus dados de acesso.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4 flex-1 flex flex-col">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">E-mail Registado</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required
                            className={`w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition-all ${portalSelecionado === 'hotel' ? 'focus:border-[#00577C]' : portalSelecionado === 'guia' ? 'focus:border-[#1a6b2f]' : 'focus:border-amber-500'}`}
                            placeholder="seu@email.com" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Palavra-passe</label>
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
                          {isLoggingIn ? <><Loader2 className="animate-spin" size={18} /> A aceder...</> : <span>Entrar na sua área</span>}
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

      {/* ── VALORES COMUNITÁRIOS ── */}
      <section className="py-16 md:py-28 px-5 bg-white text-center overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-10 md:mb-16`}>Porquê fazer parte da nossa rede comunitária?</h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 md:gap-10">
            <ScrollReveal delay={0}>
              <div className="bg-slate-50 rounded-[2rem] p-8 md:p-10 border border-slate-100 text-left hover:-translate-y-2 transition-transform duration-300 h-full">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#00577C] flex items-center justify-center mb-6"><HeartHandshake size={28} /></div>
                <h3 className={`${jakarta.className} text-xl font-bold text-slate-800 mb-4`}>Comunidade Fortalecida</h3>
                <p className="text-slate-600 font-medium leading-relaxed text-sm">Pequena pousada, barqueiro ou guia — todos têm o mesmo espaço. O seu trabalho é valorizado e divulgado através dos canais oficiais do município.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="bg-slate-50 rounded-[2rem] p-8 md:p-10 border border-slate-100 text-left hover:-translate-y-2 transition-transform duration-300 h-full">
                <div className="w-14 h-14 rounded-2xl bg-green-100 text-[#1a6b2f] flex items-center justify-center mb-6"><Sprout size={28} /></div>
                <h3 className={`${jakarta.className} text-xl font-bold text-slate-800 mb-4`}>Economia Circular</h3>
                <p className="text-slate-600 font-medium leading-relaxed text-sm">O sistema municipal não cobra comissões abusivas. O valor do seu trabalho fica na nossa cidade, gerando renda e desenvolvimento local.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="bg-slate-50 rounded-[2rem] p-8 md:p-10 border border-slate-100 text-left hover:-translate-y-2 transition-transform duration-300 h-full">
                <div className="w-14 h-14 rounded-2xl bg-yellow-100 text-[#d4a800] flex items-center justify-center mb-6"><ShieldCheck size={28} /></div>
                <h3 className={`${jakarta.className} text-xl font-bold text-slate-800 mb-4`}>Apoio e Estrutura</h3>
                <p className="text-slate-600 font-medium leading-relaxed text-sm">Oferecemos-lhe um portal moderno para gerir as suas reservas e calendário de forma simples, com o suporte direto da equipa da Secretaria de Turismo.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── INTEGRAÇÃO GOOGLE FORMS E ATIVAÇÃO ── */}
      <section id="cadastro" className="py-16 md:py-28 px-5 bg-[#F5F7FA]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 md:gap-16 items-center">

          <ScrollReveal delay={100} className="flex-1 text-left">
            <p className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.25em] text-[#1a6b2f] mb-3`}>Rede de Turismo</p>
            <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-5`}>
              Junte-se à nossa<br />
              <span className="italic text-[#1a6b2f]">rede de parceiros locais.</span>
            </h2>
            <p className="text-slate-500 text-base leading-relaxed mb-8">
              Ao inscrever a sua iniciativa no portal, passará a fazer parte do ecossistema oficial de turismo de São Geraldo do Araguaia. A nossa equipa irá avaliar a sua proposta e criar-lhe um ambiente digital pronto a receber visitantes.
            </p>

            <div className="space-y-0 divide-y divide-dashed divide-slate-200">
              {[
                { num: '1', title: 'Preencha o formulário', desc: 'Indique os dados da sua iniciativa e as experiências que deseja oferecer.' },
                { num: '2', title: 'Validação Comunitária', desc: 'A equipa da Secretaria de Turismo verifica o seu registo para garantir a segurança dos nossos visitantes.' },
                { num: '3', title: 'Ative a sua presença', desc: 'Recebe o acesso, ativa a conta e o seu trabalho ganha visibilidade imediata.' },
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

          <ScrollReveal delay={300} className="w-full lg:w-[460px] bg-white rounded-[2rem] p-8 md:p-10 shadow-lg border border-slate-100 text-center flex flex-col justify-center items-center">
             <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
               <Users2 size={32} className="text-[#1a6b2f]" />
             </div>
             
             <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-4`}>Faça parte da rede</h3>
             <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
               O cadastro é gratuito e destina-se a promover e organizar os serviços turísticos da nossa região.
             </p>

             <a
               href="https://docs.google.com/forms/d/e/1FAIpQLScUnwAEfwvfbjwf5w81F_3OynXVNDdCBx9QsDmxtunXftQchg/viewform"
               target="_blank"
               rel="noopener noreferrer"
               className={`${jakarta.className} w-full bg-[#1a6b2f] hover:bg-[#0f4f20] text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mb-4`}
             >
               Preencher Formulário <ExternalLink size={16} />
             </a>

             <div className="flex items-center gap-3 w-full my-4">
                <div className="h-px bg-slate-100 flex-1" />
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Já fez o pedido?</span>
                <div className="h-px bg-slate-100 flex-1" />
             </div>

             <Link
               href="/ativar-conta"
               className={`${jakarta.className} w-full bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-slate-700 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2`}
             >
               Ative a sua conta aqui
             </Link>
          </ScrollReveal>

        </div>
      </section>

      {/* ── FOOTER ── */}
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