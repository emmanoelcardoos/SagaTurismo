'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Menu, X, ShieldCheck, Heart, Users, Globe, Award,
  Clock, MapPin, Leaf, ChevronRight, ArrowRight, CheckCircle2
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── MOTOR DE ANIMAÇÕES ──
function useScrollAnimation(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);
  return { ref, isVisible };
}

function Reveal({ children, className = "", anim = "up", delay = 0 }: { children: ReactNode; className?: string; anim?: "up" | "left" | "right" | "zoom" | "fade"; delay?: number; }) {
  const { ref, isVisible } = useScrollAnimation();
  const hidden: Record<string, string> = {
    up: "opacity-0 translate-y-16",
    left: "opacity-0 translate-x-16",
    right: "opacity-0 -translate-x-16",
    zoom: "opacity-0 scale-90",
    fade: "opacity-0",
  };
  return (
    <div ref={ref}
      className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0 scale-100" : hidden[anim]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── COMPONENTES HEADER E FOOTER (IGUAIS ÀS OUTRAS PÁGINAS) ──
function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
            <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {['Hoteis', 'Pacotes', 'Roteiros', 'Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
            <Link key={item} href={`/${item.toLowerCase()}`} className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
              {item}
            </Link>
          ))}
          <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
            Cartão Residente
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
          <Link href="/roteiros" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Roteiros</Link>
          <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
          <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
          <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
          <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
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
            <p className="text-[10px] font-bold text-slate-400/80">
              CNPJ: 10.249.241/0001-22
            </p>
          </div>
        </div>

        <div className="flex gap-10">
          <div className="text-left border-l-2 border-slate-100 pl-9">
            <p className="text-[10px] font-black text-[#00577C] uppercase mb-1">Contato Oficial</p>
            <p className="text-xs font-bold text-slate-500 tracking-tight">setursaga@gmail.com</p>
          </div>
          <ShieldCheck size={40} className="text-[#009640] opacity-30" />
        </div>
      </div>
    </footer>
  );
}

// ── PÁGINA PRINCIPAL ──
export default function QuemSomosPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const valores = [
    { icon: <Heart className="w-6 h-6" />, titulo: "Hospitalidade", desc: "Acolher visitantes como membros da nossa comunidade." },
    { icon: <Leaf className="w-6 h-6" />, titulo: "Sustentabilidade", desc: "Promover o turismo responsável e a preservação ambiental." },
    { icon: <Users className="w-6 h-6" />, titulo: "Valorização Local", desc: "Fortalecer a economia e a cultura dos moradores." },
    { icon: <Globe className="w-6 h-6" />, titulo: "Inclusão", desc: "Turismo acessível para todos, sem barreiras." }
  ];

  const numeros = [
    { numero: "+50", label: "Parceiros Locais" },
    { numero: "+30k", label: "Visitantes/Ano" },
    { numero: "12", label: "Comunidades Atendidas" },
    { numero: "100%", label: "Destinos Verificados" }
  ];

  return (
    <main className={`${inter.className} min-h-screen flex flex-col bg-white text-slate-900`}>
      <Header />

      <div className="flex-1">
        {/* ── HERO ── */}
        <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.pexels.com/photos/12345678/pexels-photo-12345678.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt="Turismo em São Geraldo do Araguaia"
              fill
              className="object-cover brightness-50"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#002f40] via-[#002f40]/60 to-transparent" />
          </div>

          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            <Reveal anim="zoom">
              <span className="inline-block text-[#F9C400] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-4">Bem-vindo à SagaTurismo</span>
              <h1 className={`${jakarta.className} text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight`}>
                Quem <span className="text-[#F9C400]">Somos</span>
              </h1>
              <p className="text-white/80 text-base md:text-xl max-w-2xl mx-auto mt-6 font-medium">
                Uma plataforma que conecta viajantes à alma do Araguaia – com respeito, autenticidade e propósito.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── NOSSA HISTÓRIA ── */}
        <section className="py-20 md:py-28 px-6 bg-white">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <Reveal anim="right">
              <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.pexels.com/photos/17206400/pexels-photo-17206400.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="História"
                  fill
                  className="object-cover"
                />
              </div>
            </Reveal>
            <div>
              <Reveal anim="left">
                <span className="text-[#009640] text-[10px] font-black uppercase tracking-[0.3em]">Nossa História</span>
                <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#00577C] mt-3 mb-6`}>
                  O coração do turismo local
                </h2>
                <p className="text-slate-600 leading-relaxed text-justify mb-4">
                  A SagaTurismo nasceu do desejo genuíno de mostrar ao mundo as riquezas de São Geraldo do Araguaia – suas águas cristalinas, florestas intocadas, aldeias indígenas e o calor humano do povo paraense.
                </p>
                <p className="text-slate-600 leading-relaxed text-justify">
                  Somos um braço da Secretaria Municipal de Turismo e trabalhamos lado a lado com guias locais, comunidades ribeirinhas e empreendedores para oferecer experiências transformadoras e sustentáveis.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── MISSÃO, VISÃO, VALORES ── */}
        <section className="py-20 md:py-28 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <Reveal anim="up" className="text-center mb-16">
              <span className="text-[#009640] text-[10px] font-black uppercase tracking-[0.3em]">Propósito</span>
              <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#00577C] mt-3`}>
                Missão, Visão & Valores
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-8">
              <Reveal anim="up" delay={0}>
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm hover:shadow-xl transition-all h-full">
                  <div className="w-16 h-16 bg-[#00577C]/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-[#00577C]">
                    <Compass size={32} />
                  </div>
                  <h3 className={`${jakarta.className} text-2xl font-black mb-3`}>Missão</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Promover o turismo sustentável, valorizando a cultura local e gerando benefícios económicos e sociais para a região do Araguaia.
                  </p>
                </div>
              </Reveal>

              <Reveal anim="up" delay={100}>
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm hover:shadow-xl transition-all h-full">
                  <div className="w-16 h-16 bg-[#F9C400]/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-[#F9C400]">
                    <Eye size={32} />
                  </div>
                  <h3 className={`${jakarta.className} text-2xl font-black mb-3`}>Visão</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Ser referência nacional em turismo de base comunitária e ecoturismo, reconhecida pela integridade e inovação.
                  </p>
                </div>
              </Reveal>

              <Reveal anim="up" delay={200}>
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all h-full">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-[#009640]">
                    <Heart size={32} />
                  </div>
                  <h3 className={`${jakarta.className} text-2xl font-black mb-3`}>Valores</h3>
                  <ul className="text-slate-500 text-sm text-left space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#009640]" /> Respeito à natureza</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#009640]" /> Transparência</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#009640]" /> Inclusão social</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#009640]" /> Excelência no serviço</li>
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── NÚMEROS QUE NOS DEFINEM ── */}
        <section className="py-20 md:py-28 px-6 bg-[#00577C] text-white">
          <div className="max-w-7xl mx-auto">
            <Reveal anim="up" className="text-center mb-12">
              <span className="text-[#F9C400] text-[10px] font-black uppercase tracking-[0.3em]">Impacto Real</span>
              <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-white mt-3`}>
                Números que contam a nossa história
              </h2>
            </Reveal>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {numeros.map((item, idx) => (
                <Reveal key={item.label} anim="zoom" delay={idx * 80}>
                  <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
                    <p className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#F9C400]`}>{item.numero}</p>
                    <p className="text-white/80 text-xs font-black uppercase tracking-widest mt-2">{item.label}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── EQUIPA / RESPONSABILIDADE ── */}
        <section className="py-20 md:py-28 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <Reveal anim="up" className="text-center mb-12">
              <span className="text-[#009640] text-[10px] font-black uppercase tracking-[0.3em]">Equipa</span>
              <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-[#00577C] mt-3`}>
                Profissionais comprometidos
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto mt-4">
                Por detrás de cada roteiro, há uma equipa apaixonada pelo Araguaia e pelo turismo sustentável.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { nome: "Ana Paula Silva", cargo: "Coordenadora de Turismo", img: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400" },
                { nome: "Carlos Mendes", cargo: "Especialista em Ecoturismo", img: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400" },
                { nome: "Mariana Costa", cargo: "Gestora de Comunidades", img: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400" }
              ].map((pessoa, idx) => (
                <Reveal key={pessoa.nome} anim="up" delay={idx * 100}>
                  <div className="group bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300">
                    <div className="relative h-64 w-full overflow-hidden">
                      <Image src={pessoa.img} alt={pessoa.nome} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-6 text-center">
                      <h3 className={`${jakarta.className} text-xl font-black text-slate-800`}>{pessoa.nome}</h3>
                      <p className="text-[#00577C] font-bold text-xs uppercase tracking-wider mt-1">{pessoa.cargo}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="py-20 md:py-28 px-6 bg-gradient-to-r from-[#002f40] to-[#00577C]">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal anim="zoom">
              <h2 className={`${jakarta.className} text-3xl md:text-5xl font-black text-white leading-tight`}>
                Venha conhecer o Araguaia <br />conosco!
              </h2>
              <p className="text-white/70 text-lg mt-4 mb-8">
                Estamos prontos para transformar a sua viagem numa experiência inesquecível.
              </p>
              <Link href="/pacotes" className="inline-flex items-center gap-3 bg-[#F9C400] text-[#002f40] px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                Explorar pacotes <ArrowRight size={18} />
              </Link>
            </Reveal>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}

// Ícones auxiliares (porque alguns não foram importados)
function Compass(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/><circle cx="12" cy="12" r="10"/></svg>; }
function Eye(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }