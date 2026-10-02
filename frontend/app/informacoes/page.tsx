'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  Plane, Car, Bus, Map, Navigation, Compass
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ==========================================
// MOTOR DE ANIMAÇÕES DE SCROLL
// ==========================================
function useScrollAnimation(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target); 
      }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);

  return { ref, isVisible };
}

function AnimatedSection({ children, className = "", animation = "fade-up", delay = 0 }: { children: ReactNode; className?: string; animation?: "fade-up" | "fade-left" | "fade-right" | "zoom-in"; delay?: number; }) {
  const { ref, isVisible } = useScrollAnimation();
  let hiddenClass = "";
  switch (animation) {
    case "fade-up": hiddenClass = "opacity-0 translate-y-16"; break;
    case "fade-left": hiddenClass = "opacity-0 translate-x-16"; break;
    case "fade-right": hiddenClass = "opacity-0 -translate-x-16"; break;
    case "zoom-in": hiddenClass = "opacity-0 scale-95"; break;
  }
  return (
    <div ref={ref} className={`transition-all duration-[1000ms] ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0 scale-100" : hiddenClass} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function ComoChegarPage() {
  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 overflow-x-hidden`}>

      {/* ── HERO EDITORIAL ── */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/herosections/heroinformacoes.jpg" 
            alt="Como chegar em São Geraldo do Araguaia" 
            fill 
            className="object-cover" 
            priority 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            Como Chegar
          </h1>
          <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
            Rotas e transportes para São Geraldo do Araguaia
          </p>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <section className="py-20 md:py-28 bg-[#FDFCF7]">
        <div className="max-w-[1200px] mx-auto px-6">
          
          {/* Introdução */}
          <AnimatedSection animation="fade-up" className="max-w-3xl mx-auto text-center mb-20">
            <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-6`}>
              Rotas e Transportes
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed">
              Para você, turista que deseja conhecer as maravilhas da Serra das Andorinhas e as águas do Rio Araguaia, existem excelentes opções de transporte: avião conjugado com estrada, carro particular ou ônibus. Entenda qual a melhor rota de acordo com a sua origem.
            </p>
          </AnimatedSection>

          {/* ── OPÇÕES DE VOO ── */}
          <div className="mb-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-[#00577C]/10 rounded-2xl flex items-center justify-center shrink-0">
                <Plane className="text-[#00577C] w-7 h-7" />
              </div>
              <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900`}>Chegando de Avião</h3>
            </div>
            
            <p className="text-slate-600 mb-10 max-w-3xl leading-relaxed">
              São Geraldo do Araguaia não possui aeroporto comercial próprio, mas é estrategicamente servida por dois importantes aeroportos regionais que recebem voos diretos de grandes centros urbanos:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Aeroporto de Marabá */}
              <AnimatedSection animation="fade-right">
                <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-2 transition-transform duration-500 h-full">
                  <div className="bg-[#F9C400] text-[#002f40] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-6">
                    Acesso pelo Pará
                  </div>
                  <h4 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-3`}>Aeroporto de Marabá (MAB)</h4>
                  <p className="text-slate-500 text-sm font-medium mb-6">Distância: ~165 km de São Geraldo</p>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    O Aeroporto João Corrêa da Rocha, em Marabá (PA), recebe voos diretos com origem exclusiva de <strong>Belém</strong>, <strong>Brasília</strong> e <strong>Belo Horizonte</strong>.
                  </p>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-700 flex items-start gap-2">
                      <Car size={16} className="text-[#00577C] shrink-0" />
                      <span><strong>De Marabá até São Geraldo:</strong> A viagem de carro alugado, táxi ou ônibus dura em média <strong>2 horas</strong>, seguindo pelas rodovias BR-153 / BR-155 e PA-153. Estrada totalmente pavimentada.</span>
                    </p>
                  </div>
                </div>
              </AnimatedSection>

              {/* Aeroporto de Araguaína */}
              <AnimatedSection animation="fade-left">
                <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-2 transition-transform duration-500 h-full">
                  <div className="bg-[#009640]/10 text-[#009640] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-6">
                    Acesso pelo Tocantins
                  </div>
                  <h4 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-3`}>Aeroporto de Araguaína (AUX)</h4>
                  <p className="text-slate-500 text-sm font-medium mb-6">Distância: ~135 km de São Geraldo</p>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    O Aeroporto Regional de Araguaína, no estado vizinho do Tocantins, é outra excelente opção, recebendo voos diretos oriundos de <strong>Brasília</strong> e <strong>Palmas</strong>.
                  </p>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-700 flex items-start gap-2">
                      <Compass size={16} className="text-[#00577C] shrink-0" />
                      <span><strong>De Araguaína até São Geraldo:</strong> A viagem dura cerca de <strong>1h30</strong>. Segue-se até Xambioá-TO, onde se cruza a imponente ponte sobre o Rio Araguaia, chegando diretamente ao centro de São Geraldo.</span>
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-20" />

          {/* ── ÔNIBUS E CARRO ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start mb-24">
            
            <AnimatedSection animation="fade-right">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#009640]/10 rounded-xl flex items-center justify-center shrink-0">
                  <Car className="text-[#009640] w-6 h-6" />
                </div>
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-900`}>Viagem de Carro</h3>
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">
                Se você gosta de colocar o pé na estrada e viajar no seu próprio ritmo, chegar de carro permite explorar a região com total liberdade. As rodovias estaduais e federais garantem o acesso aos municípios vizinhos.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#00577C] text-xs shrink-0">1</span>
                  <span><strong>Vindo do Norte (Belém/Marabá):</strong> Acesso pelas rodovias BR-155 e BR-153. Rota totalmente pavimentada.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#00577C] text-xs shrink-0">2</span>
                  <span><strong>Vindo do Sul (Palmas/Goiânia):</strong> Acesso pela BR-153 (Belém-Brasília) até Araguaína, seguindo para Xambioá para cruzar a ponte sobre o Rio Araguaia e entrar no Pará.</span>
                </li>
              </ul>
            </AnimatedSection>

            <AnimatedSection animation="fade-left">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#F9C400]/20 rounded-xl flex items-center justify-center shrink-0">
                  <Bus className="text-[#002f40] w-6 h-6" />
                </div>
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-900`}>Ônibus Interestadual</h3>
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">
                O transporte rodoviário é a opção mais econômica e é muito utilizado na região. O Terminal Rodoviário de São Geraldo do Araguaia recebe linhas regulares das principais viações.
              </p>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-sm text-slate-600 mb-4">
                  Existem ônibus saindo diariamente dos terminais de Marabá e Araguaína, conectando facilmente os passageiros que chegam de voos comerciais. Viações operam na região oferecendo conforto (veículos com ar-condicionado) e passagens com preços muito acessíveis.
                </p>
                <div className="inline-flex items-center gap-2 text-[#00577C] font-bold text-xs">
                  <Map size={14} /> Recomendamos comprar as passagens com antecedência.
                </div>
              </div>
            </AnimatedSection>
            
          </div>

        </div>
      </section>

    </main>
  );
}