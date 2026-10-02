'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2, HeartHandshake, Sprout, ShieldCheck, ExternalLink
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── MOTOR DE ANIMAÇÕES ──
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
  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col overflow-x-hidden`}>

      {/* ══════════════════════════════════════
          HERO EDITORIAL
      ══════════════════════════════════════ */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.pexels.com/photos/27038076/pexels-photo-27038076.jpeg?_gl=1*1c9okv6*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODcxNjc5NjYkbzEwNCRnMSR0MTc4NzE2ODgzNyRqMzckbDAkaDA." 
            alt="Parceiros do Turismo em São Geraldo do Araguaia" 
            fill 
            className="object-cover"
            priority 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            Parceiros
          </h1>
          <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
            O turismo feito pela nossa gente
          </p>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ── VALORES COMUNITÁRIOS ── */}
      <section className="py-20 md:py-32 px-6 bg-[#FDFCF7]">
        <div className="max-w-[1400px] mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16 md:mb-20">
              <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight`}>
                Porquê fazer parte do portal oficial?
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto">
            <ScrollReveal delay={0}>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#00577C]/5 text-[#00577C] flex items-center justify-center mb-6"><HeartHandshake size={28} /></div>
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 mb-4`}>Visibilidade</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">Pequena pousada, barqueiro ou agência — o seu trabalho é divulgado através dos canais oficiais do município para milhares de turistas.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#009640]/5 text-[#009640] flex items-center justify-center mb-6"><Sprout size={28} /></div>
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 mb-4`}>Custo Zero</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">O sistema municipal não cobra comissões. O valor do seu trabalho fica consigo, gerando renda e desenvolvimento local direto.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#F9C400]/10 text-[#d4a800] flex items-center justify-center mb-6"><ShieldCheck size={28} /></div>
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 mb-4`}>Credibilidade</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">Estar no portal oficial transmite segurança aos viajantes, garantindo que o seu negócio cumpre os padrões de hospitalidade.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── CADASTRO / GOOGLE FORMS ── */}
      <section id="cadastro" className="py-20 md:py-32 px-6 bg-[#FDFCF7] border-t border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00577C]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#009640]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            <ScrollReveal delay={100} className="text-center lg:text-left">
              <h2 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6`}>
                Integre a rede municipal<br />
                <span className="italic text-[#009640]">de turismo.</span>
              </h2>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0 font-medium">
                O nosso portal é um espaço social, colaborativo e 100% gratuito. Qualquer prestador de serviços turísticos de São Geraldo do Araguaia pode participar. 
              </p>

              <div className="space-y-8 text-left max-w-lg mx-auto lg:mx-0">
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-white text-slate-600 flex items-center justify-center font-black text-lg shrink-0 border border-slate-200 shadow-sm">1</div>
                  <div>
                    <p className={`${jakarta.className} font-bold text-slate-900 text-lg mb-1`}>Registro Simples</p>
                    <p className="text-slate-500 text-base leading-relaxed">Preencha o formulário informando que tipo de serviço turístico você oferece.</p>
                  </div>
                </div>
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-white text-slate-600 flex items-center justify-center font-black text-lg shrink-0 border border-slate-200 shadow-sm">2</div>
                  <div>
                    <p className={`${jakarta.className} font-bold text-slate-900 text-lg mb-1`}>Verificação Municipal</p>
                    <p className="text-slate-500 text-base leading-relaxed">A nossa equipe verifica as informações para garantir a qualidade.</p>
                  </div>
                </div>
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-[#009640] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md">3</div>
                  <div>
                    <p className={`${jakarta.className} font-bold text-[#009640] text-lg mb-1`}>Integração na Rede</p>
                    <p className="text-slate-600 font-medium text-base leading-relaxed">O seu serviço é adicionado ao portal de forma justa, ajudando a promover o turismo do município.</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300} className="flex justify-center lg:justify-end mt-8 lg:mt-0">
              <div className="w-full lg:max-w-[480px] flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="w-24 h-24 bg-green-50/80 rounded-full flex items-center justify-center mb-8 border border-green-100 shadow-sm">
                  <Building2 size={40} className="text-[#009640]" />
                </div>
                
                <h3 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-4`}>Inscrição Gratuita</h3>
                <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed mb-10">
                  Clique no botão abaixo para abrir o formulário oficial, preencher os seus dados e juntar-se à comunidade de parceiros.
                </p>

                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLScUnwAEfwvfbjwf5w81F_3OynXVNDdCBx9QsDmxtunXftQchg/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-[#009640] hover:bg-[#007a33] text-white px-10 py-5 rounded-full font-black uppercase text-xs tracking-widest shadow-xl shadow-[#009640]/20 transition-all flex items-center justify-center gap-3 hover:-translate-y-1"
                >
                  Abrir Formulário <ExternalLink size={16} />
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

    </main>
  );
}