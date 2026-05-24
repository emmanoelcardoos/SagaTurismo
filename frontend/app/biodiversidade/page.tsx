'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, ReactNode } from 'react';
import {
  ArrowRight, ArrowLeft, Leaf, Mountain, Waves, TreePine, Bird, Bug,
  Droplets, Wind, Sun, Star, MapPin, ChevronDown, ChevronRight,
  Eye, Menu, X, Fish, Feather, Flower2, Globe, Layers,
  Shield, Users, Camera, Compass, ShieldCheck
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter, Playfair_Display } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '700', '900'], style: ['normal', 'italic'] });

// ==========================================
// MOTOR DE ANIMAÇÕES DE SCROLL
// ==========================================
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

// ==========================================
// DADOS — FAUNA
// ==========================================
const fauna = [
  { nome: "Arara-canindé", cientifico: "Ara ararauna", habitat: "Floresta Amazônica", imagem: "https://images.pexels.com/photos/36052063/pexels-photo-36052063.jpeg?_gl=1*tsn53b*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk1NDAyNDckbzUzJGcxJHQxNzc5NTQwNTgyJGozNSRsMCRoMA..", cor: "#1a6b3c", tag: "Ave", ameaca: "Vulnerável" },
  { nome: "Onça-pintada", cientifico: "Panthera onca", habitat: "Cerrado / Amazônia", imagem: "https://images.pexels.com/photos/11630694/pexels-photo-11630694.jpeg?_gl=1*56kp8k*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk1NDAyNDckbzUzJGcxJHQxNzc5NTQwNjYzJGo0MyRsMCRoMA..", cor: "#8b5e0a", tag: "Mamífero", ameaca: "Vulnerável" },
  { nome: "Lobo-guará", cientifico: "Chrysocyon brachyurus", habitat: "Cerrado", imagem: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=600&q=80", cor: "#c2440c", tag: "Mamífero", ameaca: "Quase ameaçado" },
  { nome: "Tucano-toco", cientifico: "Ramphastos toco", habitat: "Floresta / Cerrado", imagem: "https://images.pexels.com/photos/35098811/pexels-photo-35098811.jpeg?_gl=1*vp3cdd*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk1NDAyNDckbzUzJGcxJHQxNzc5NTQwNDk1JGoxMiRsMCRoMA..", cor: "#00577C", tag: "Ave", ameaca: "Pouco preocupante" },
  { nome: "Capivara", cientifico: "Hydrochoerus hydrochaeris", habitat: "Margens do Araguaia", imagem: "https://images.pexels.com/photos/28977022/pexels-photo-28977022.jpeg?_gl=1*q6uyb1*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk1NDAyNDckbzUzJGcxJHQxNzc5NTQwMzA3JGo2MCRsMCRoMA..", cor: "#5a4a2e", tag: "Mamífero", ameaca: "Pouco preocupante" },
  { nome: "Boto-cor-de-rosa", cientifico: "Inia geoffrensis", habitat: "Rio Araguaia", imagem: "https://images.pexels.com/photos/8867193/pexels-photo-8867193.jpeg?_gl=1*16lgvur*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk1NDAyNDckbzUzJGcxJHQxNzc5NTQwNDA0JGozOCRsMCRoMA..", cor: "#c2567a", tag: "Mamífero aquático", ameaca: "Em perigo" },
  { nome: "Tamanduá-bandeira", cientifico: "Myrmecophaga tridactyla", habitat: "Cerrado", imagem: "https://images.pexels.com/photos/27044123/pexels-photo-27044123.jpeg?_gl=1*ga07ce*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk1NDAyNDckbzUzJGcxJHQxNzc5NTQwMzYyJGo1JGwwJGgw", cor: "#6b4c2a", tag: "Mamífero", ameaca: "Vulnerável" },
];

// ==========================================
// DADOS — FLORA
// ==========================================
const flora = [
  { nome: "Ipê-amarelo", cientifico: "Handroanthus albus", habitat: "Cerrado", imagem: "https://images.pexels.com/photos/13596969/pexels-photo-13596969.jpeg?_gl=1*ccckmr*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk2NTY5NTgkbzYzJGcxJHQxNzc5NjU3MDEwJGo4JGwwJGgw", descricao: "Árvore símbolo do Brasil, exuberante floração amarela no cerrado.", cor: "#c2930a" },
  { nome: "Castanheira", cientifico: "Bertholletia excelsa", habitat: "Floresta Amazônica", imagem: "https://images.pexels.com/photos/12941185/pexels-photo-12941185.jpeg?_gl=1*1od68zg*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk2NTY5NTgkbzYzJGcxJHQxNzc5NjU4MjA4JGozNiRsMCRoMA..", descricao: "Gigante da Amazônia, pode viver mais de 1000 anos.", cor: "#1a5e2a" },
  { nome: "Buritizeiro", cientifico: "Mauritia flexuosa", habitat: "Veredas / Cerrado", imagem: "https://images.pexels.com/photos/2563244/pexels-photo-2563244.jpeg?_gl=1*18vbbro*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk2NTY5NTgkbzYzJGcxJHQxNzc5NjU3OTQ3JGoyMiRsMCRoMA..", descricao: "Palmeira das veredas, fundamental para a fauna local.", cor: "#3a7d18" },
  { nome: "Andiroba", cientifico: "Carapa guianensis", habitat: "Floresta Amazônica", imagem: "https://images.pexels.com/photos/20992632/pexels-photo-20992632.jpeg?_gl=1*m5be40*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk2NTY5NTgkbzYzJGcxJHQxNzc5NjU4MjY3JGozOCRsMCRoMA..", descricao: "Árvore medicinal de alto valor, protegida na Serra das Andorinhas.", cor: "#2d5c1a" },
  { nome: "Pequizeiro", cientifico: "Caryocar brasiliense", habitat: "Cerrado", imagem: "https://images.pexels.com/photos/2170351/pexels-photo-2170351.jpeg?_gl=1*1m2qajr*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk2NTY5NTgkbzYzJGcxJHQxNzc5NjU4MzY2JGozNCRsMCRoMA..", descricao: "Fruto ícone do cerrado, alimento e símbolo cultural regional.", cor: "#8b6914" },
  { nome: "Sumaúma", cientifico: "Ceiba pentandra", habitat: "Floresta Amazônica", imagem: "https://images.pexels.com/photos/4773620/pexels-photo-4773620.jpeg?_gl=1*do5myu*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk2NTY5NTgkbzYzJGcxJHQxNzc5NjU4NDI0JGozNiRsMCRoMA..", descricao: "A 'Rainha da Floresta', pode ultrapassar 50 metros de altura.", cor: "#1a4a2a" },
];

// ==========================================
// DADOS — 11 CACHOEIRAS
// ==========================================
const cachoeiras = [
  { nome: "Cachoeira Três Quedas", altura: "42m", dificuldade: "Fácil", descricao: "A mais emblemática do parque, conhecida pelas três quedas de água.", destaque: true },
  { nome: "Cachoeira Quarta Queda", altura: "28m", dificuldade: "Fácil", descricao: "Queda delicada em fio cristalino, envolta em samambaias e bromélias.", destaque: true },
  { nome: "Poço Esmeralda", altura: "15m", dificuldade: "Fácil", descricao: "Localizada acima das Cachoeiras Três Quedas, a Cachoeira Quarta Queda é um convite para trilha e aventura.", destaque: true },
  { nome: "Cachoeira Rapunzel", altura: "20m", dificuldade: "Difícil", descricao: "Cai sobre uma gruta de calcário, criando um ambiente místico único.", destaque: true},
  { nome: "Cachoeira da Pacència", altura: "35m", dificuldade: "Moderada", descricao: "Vista panorâmica para o Rio Araguaia ao fundo do horizonte.", destaque: true },
  { nome: "Cachoeira Urubu -Rei", altura: "18m", dificuldade: "Moderada", descricao: "Frequentada por gavião-real em seu habitat natural de nidificação.", destaque: true },
  { nome: "Casacata do Urubu - Rei", altura: "12m", dificuldade: "Difícil", descricao: "Acessível apenas por trilha densa, recompensa com solidão total.", destaque: true },
  { nome: "Cachoeira Antônio Crente", altura: "8m", dificuldade: "Fácil", descricao: "Piscina natural turquesa, ideal para banho em família.", destaque: true },
  { nome: "Cachoeira Viagem Grande", altura: "55m", dificuldade: "Difícil", descricao: "A mais alta do parque, vista só de longe devido ao isolamento.", destaque: true },
  { nome: "Cachoeira Riacho Fundo", altura: "10m", dificuldade: "Fácil", descricao: "Nasce entre afloramentos de quartzo com água de pureza excepcional.", destaque: true },
  { nome: "Cachoeira Spanner", altura: "22m", dificuldade: "Moderada", descricao: "Encravada em densa mata de galeria, abrigo de orquídeas e bromélias.", destaque: true },
];

const dificuldadeCor: Record<string, string> = {
  "Fácil": "#009640",
  "Moderada": "#c2930a",
  "Difícil": "#c2440c",
};

// ==========================================
// COMPONENTE: HERO CINEMATOGRÁFICO
// ==========================================
function HeroBiodiversidade() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <section className="relative h-screen flex flex-col items-start justify-end pb-24 px-6 md:px-12 overflow-hidden bg-[#021a0d]">
      {/* Parallax image */}
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
        <Image
          src="https://images.pexels.com/photos/18064280/pexels-photo-18064280.jpeg?_gl=1*1at0h8g*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk1MDQ0MjUkbzUyJGcxJHQxNzc5NTA0ODIxJGo1OSRsMCRoMA.."
          alt="Serra das Andorinhas - Floresta"
          fill className="object-cover opacity-90" priority
        />
      </div>

      {/* Gradientes */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#021a0d] via-[#021a0d]/30 to-transparent z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#021a0d]/60 to-transparent z-0" />

      {/* Linha decorativa lateral */}
      <div className="absolute left-6 md:left-12 top-1/3 bottom-1/4 w-[1px] bg-gradient-to-b from-transparent via-[#F9C400]/50 to-transparent z-10" />

      {/* Conteúdo */}
      <div className="relative z-10 max-w-[1400px] w-full mx-auto">
        <div className="flex flex-col items-start">
          <p className="text-[#F9C400] font-black uppercase tracking-[0.35em] text-[9px] md:text-[10px] mb-5 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-[#F9C400]" />
            Parque Estadual Serra das Andorinhas/Martírios
          </p>

          <h1 className={`${jakarta.className} text-[clamp(3.5rem,8vw,9rem)] font-black text-white leading-[0.88] mb-6`}>
            Bio<br />
            <span className="text-[#009640] italic">diversidade</span>
          </h1>

          <p className="text-white/60 text-base md:text-xl max-w-lg mb-10 font-medium leading-relaxed">
            Onde a Amazônia encontra o Cerrado.
          </p>

          <div className="flex flex-wrap gap-4">
            <a href="#parque" className="inline-flex items-center gap-3 bg-[#009640] text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#007a33] transition-colors">
              Explorar o Parque <ArrowRight size={14} />
            </a>
            <a href="#fauna" className="inline-flex items-center gap-3 border border-white/20 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors">
              Ver Fauna & Flora
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 right-8 md:right-12 z-10 flex flex-col items-center gap-2">
        <p className="text-white/30 font-black text-[8px] uppercase tracking-widest [writing-mode:vertical-lr]">Scroll</p>
        <ChevronDown size={16} className="text-white/30 animate-bounce" />
      </div>

      {/* Stats flutuantes */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:flex gap-8">
        {[
          { n: "11", label: "Cachoeiras" },
          { n: "2", label: "Biomas" },
          { n: "+300", label: "Espécies" },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <p className={`${jakarta.className} text-3xl font-black text-[#F9C400]`}>{stat.n}</p>
            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ==========================================
// SECÇÃO: PARQUE ESTADUAL + INTRO
// ==========================================
function SecParque() {
  return (
    <section id="parque" className="py-24 bg-[#021a0d] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">

        <Reveal anim="up" className="mb-20">
          <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-end">
            <div className="flex-1">
              <p className="text-[#009640] font-black text-[9px] uppercase tracking-[0.3em] mb-4">Unidade de Conservação — PA</p>
              <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-[0.9]`}>
                Serra das<br /><span className="text-[#F9C400] italic">Andorinhas</span>
              </h2>
            </div>
            <div className="flex-1 max-w-md">
              <p className="text-white/50 text-lg leading-relaxed">
                Criado em 1995, o Parque Estadual Serra das Andorinhas protege uma das últimas faixas intactas da transição entre a Floresta Amazônica e o Cerrado no estado do Pará — um mosaico de ecossistemas de valor científico inestimável.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Bento grid — parque */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

          {/* Card grande — serras */}
          <Reveal anim="right" className="md:col-span-7">
            <div className="group relative h-[460px] rounded-[2rem] overflow-hidden bg-[#051a09]">
              <Image src="https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&q=80" alt="Floresta da Serra" fill className="object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#021a0d]/90 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <Mountain size={24} className="text-[#F9C400] mb-3" />
                <h3 className={`${jakarta.className} text-3xl font-black mb-2`}>1.100m de altitude</h3>
                <p className="text-white/60 text-sm">Ponto mais alto do parque, com vista para o Rio Araguaia e a planície amazônica.</p>
              </div>
            </div>
          </Reveal>

          {/* Coluna de mini cards */}
          <div className="md:col-span-5 flex flex-col gap-5">
            <Reveal anim="left" delay={100}>
              <div className="group relative h-[220px] rounded-[2rem] overflow-hidden bg-[#00577C]">
                <Image src="https://images.pexels.com/photos/31780330/pexels-photo-31780330.jpeg?w=800" alt="Rio Araguaia" fill className="object-cover opacity-50 group-hover:opacity-70 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#00577C]/90 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <Waves size={20} className="text-[#F9C400] mb-2" />
                  <h3 className={`${jakarta.className} text-xl font-black`}>Rio Araguaia</h3>
                  <p className="text-white/50 text-xs mt-1">Fronteira natural do parque a Oeste</p>
                </div>
              </div>
            </Reveal>

            <Reveal anim="left" delay={200}>
              <div className="group relative h-[220px] rounded-[2rem] overflow-hidden bg-[#1a4a2a]">
                <Image src="https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800&q=80" alt="Floresta densa" fill className="object-cover opacity-50 group-hover:opacity-70 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a4a2a]/90 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <Leaf size={20} className="text-[#F9C400] mb-2" />
                  <h3 className={`${jakarta.className} text-xl font-black`}>+12.000 animais protegidos</h3>
                  <p className="text-white/50 text-xs mt-1">Área total da unidade de conservação</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// SECÇÃO: DOIS BIOMAS — DIVISÓRIA VISUAL
// ==========================================
function SecBiomas() {
  return (
    <section className="relative overflow-hidden">
      {/* Linha divisória entre biomas */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[70vh]">

        {/* Amazônia */}
        <div className="relative group overflow-hidden bg-[#021a0d] flex items-end p-10 md:p-16 min-h-[50vh] md:min-h-0">
          <Image src="https://images.unsplash.com/photo-1536147116438-62679a5e01f2?w=900&q=80" alt="Floresta Amazônica" fill className="object-cover opacity-40 group-hover:scale-105 group-hover:opacity-55 transition-all duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#021a0d]/95 via-[#021a0d]/30 to-transparent" />
          <Reveal anim="right" className="relative z-10">
            <h3 className={`${jakarta.className} text-5xl md:text-6xl font-black text-white leading-[0.9] mb-4`}>
              Floresta<br /><span className="text-[#009640] italic">Amazônica</span>
            </h3>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Cobertura densa de dossel fechado, alta pluviosidade, solos ricos em matéria orgânica. Lar da onça-pintada, boto-cor-de-rosa e castanheiras centenárias.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Dossel fechado", "Alta humidade", "Fauna diversa", "Rios de água preta"].map(t => (
                <span key={t} className="bg-[#009640]/20 text-[#009640] border border-[#009640]/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{t}</span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Cerrado */}
        <div className="relative group overflow-hidden bg-[#1a0e02] flex items-end p-10 md:p-16 min-h-[50vh] md:min-h-0">
          <Image src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&q=80" alt="Cerrado" fill className="object-cover opacity-40 group-hover:scale-105 group-hover:opacity-55 transition-all duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0e02]/95 via-[#1a0e02]/30 to-transparent" />
          <Reveal anim="left" delay={150} className="relative z-10">
            <h3 className={`${jakarta.className} text-5xl md:text-6xl font-black text-white leading-[0.9] mb-4`}>
              Cerrado<br /><span className="text-[#F9C400] italic">Brasileiro</span>
            </h3>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Savana tropical com árvores retorcidas de casca espessa, adaptadas ao fogo. Lar do lobo-guará, tamanduá-bandeira e do famoso pequizeiro.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Savana tropical", "Árvores retorcidas", "Solo ácido", "Estação seca"].map(t => (
                <span key={t} className="bg-[#F9C400]/20 text-[#F9C400] border border-[#F9C400]/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{t}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Linha de transição central */}
      <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-white/20 to-transparent z-20 pointer-events-none" />
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2">
        <p className="text-white font-black text-[8px] uppercase tracking-widest">Zona de Transição</p>
      </div>
    </section>
  );
}

// ==========================================
// SECÇÃO: 11 CACHOEIRAS
// ==========================================
function SecCachoeiras() {
  const [ativa, setAtiva] = useState<number | null>(null);
  const destaques = cachoeiras.filter(c => c.destaque);
  const resto = cachoeiras.filter(c => !c.destaque);

  return (
    <section id="cachoeiras" className="py-24 bg-[#00577C] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">

        <Reveal anim="up" className="mb-16">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div>
              <p className="text-[#F9C400] font-black text-[9px] uppercase tracking-[0.35em] mb-4 flex items-center gap-3">
                <span className="w-6 h-[1px] bg-[#F9C400]" /> Parque Estadual
              </p>
              <h2 className={`${jakarta.className} text-5xl md:text-8xl font-black text-white leading-[0.88]`}>
                11<br /><span className="italic text-[#F9C400]">Cachoeiras</span>
              </h2>
            </div>
            <p className="text-white/40 max-w-xs text-sm leading-relaxed">
              Cada cachoeira é um mundo à parte — formações rochosas únicas, piscinas naturais e trilhas de dificuldades variadas para todos os perfis de visitantes.
            </p>
          </div>
        </Reveal>

        {/* 3 destaques — grandes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {destaques.map((c, i) => (
            <Reveal key={c.nome} anim="up" delay={i * 120}>
              <div className="group relative h-[380px] rounded-[2rem] overflow-hidden bg-[#003d5c] cursor-pointer"
                onClick={() => setAtiva(ativa === i ? null : i)}>
                <Image src={`https://images.unsplash.com/photo-${['1500534314209-a25ddb2bd429', '1443890923422-7819ed4101b0', '1506905925346-21bda4d32df4'][i]}?w=800&q=80`}
                  alt={c.nome} fill className="object-cover opacity-60 group-hover:scale-108 group-hover:opacity-80 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#003d5c]/95 via-[#003d5c]/20 to-transparent" />
                <div className="absolute top-5 right-5">
                  <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border"
                    style={{ color: dificuldadeCor[c.dificuldade], borderColor: dificuldadeCor[c.dificuldade] + '60', backgroundColor: dificuldadeCor[c.dificuldade] + '20' }}>
                    {c.dificuldade}
                  </span>
                </div>
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets size={14} className="text-[#F9C400]" />
                    <span className="text-[#F9C400] font-black text-xs">{c.altura}</span>
                  </div>
                  <h3 className={`${jakarta.className} text-2xl font-black mb-2`}>{c.nome}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{c.descricao}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Grid das restantes 8 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {resto.map((c, i) => (
            <Reveal key={c.nome} anim="up" delay={i * 60}>
              <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6 hover:bg-white/10 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <Droplets size={18} className="text-[#F9C400]" />
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
                    style={{ color: dificuldadeCor[c.dificuldade], backgroundColor: dificuldadeCor[c.dificuldade] + '20' }}>
                    {c.dificuldade}
                  </span>
                </div>
                <p className="text-[#F9C400] font-black text-xl mb-1">{c.altura}</p>
                <h4 className={`${jakarta.className} text-base font-black text-white mb-2 group-hover:text-[#F9C400] transition-colors`}>{c.nome}</h4>
                <p className="text-white/40 text-xs leading-relaxed">{c.descricao}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// SECÇÃO: FAUNA
// ==========================================
function SecFauna() {
  return (
    <section id="fauna" className="py-24 bg-[#0c1a08] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">

        <Reveal anim="up" className="mb-16">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div>
              <p className="text-[#009640] font-black text-[9px] uppercase tracking-[0.35em] mb-4 flex items-center gap-3">
                <span className="w-6 h-[1px] bg-[#009640]" /> Fauna Local
              </p>
              <h2 className={`${jakarta.className} text-5xl md:text-8xl font-black text-white leading-[0.88]`}>
                Animais<br /><span className="italic text-[#009640]">da Serra</span>
              </h2>
            </div>
            <p className="text-white/30 max-w-xs text-sm leading-relaxed">
              Mais de 300 espécies catalogadas entre mamíferos, aves, répteis e peixes. Muitas delas endémicas ou ameaçadas de extinção.
            </p>
          </div>
        </Reveal>

        {/* Grid fauna — bento assimétrico */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

          {/* Card grande */}
          {fauna[0] && (
            <Reveal anim="right" className="md:col-span-5 md:row-span-2">
              <div className="group relative h-[500px] md:h-[600px] rounded-[2rem] overflow-hidden" style={{ backgroundColor: fauna[0].cor }}>
                <Image src={fauna[0].imagem} alt={fauna[0].nome} fill className="object-cover opacity-70 group-hover:scale-105 group-hover:opacity-85 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute top-5 left-5">
                  <span className="bg-white/10 backdrop-blur text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/20">{fauna[0].tag}</span>
                </div>
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <p className="text-white/50 italic text-xs mb-1">{fauna[0].cientifico}</p>
                  <h3 className={`${jakarta.className} text-3xl font-black mb-1`}>{fauna[0].nome}</h3>
                  <p className="text-white/50 text-xs">{fauna[0].habitat}</p>
                  <span className="inline-block mt-3 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                    {fauna[0].ameaca}
                  </span>
                </div>
              </div>
            </Reveal>
          )}

          {/* Cards médios — 2 na mesma linha */}
          {fauna.slice(1, 3).map((animal, i) => (
            <Reveal key={animal.nome} anim="left" delay={i * 100} className="md:col-span-7">
              <div className="group relative h-[290px] rounded-[2rem] overflow-hidden" style={{ backgroundColor: animal.cor }}>
                <Image src={animal.imagem} alt={animal.nome} fill className="object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-5 left-5">
                  <span className="bg-white/10 backdrop-blur text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/20">{animal.tag}</span>
                </div>
                <div className="absolute bottom-6 left-8 text-white">
                  <p className="text-white/40 italic text-xs mb-1">{animal.cientifico}</p>
                  <h3 className={`${jakarta.className} text-2xl font-black mb-1`}>{animal.nome}</h3>
                  <p className="text-white/40 text-xs">{animal.habitat}</p>
                </div>
              </div>
            </Reveal>
          ))}

          {/* Linha inferior — 4 cards pequenos */}
          {fauna.slice(3).map((animal, i) => (
            <Reveal key={animal.nome} anim="up" delay={i * 80} className="md:col-span-3">
              <div className="group relative h-[240px] rounded-[2rem] overflow-hidden" style={{ backgroundColor: animal.cor }}>
                <Image src={animal.imagem} alt={animal.nome} fill className="object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <p className="text-white/40 italic text-[9px] mb-0.5">{animal.cientifico}</p>
                  <h3 className={`${jakarta.className} text-base font-black`}>{animal.nome}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[7px] font-black uppercase tracking-widest text-white/30">{animal.tag}</span>
                    <span className="text-[7px] font-black uppercase text-yellow-400/70">{animal.ameaca}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// SECÇÃO: FLORA
// ==========================================
function SecFlora() {
  return (
    <section id="flora" className="py-24 bg-[#FDFCF7] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">

        <Reveal anim="up" className="mb-16">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div>
              <p className="text-[#009640] font-black text-[9px] uppercase tracking-[0.35em] mb-4 flex items-center gap-3">
                <span className="w-6 h-[1px] bg-[#009640]" /> Vegetação & Flora
              </p>
              <h2 className={`${jakarta.className} text-5xl md:text-8xl font-black text-slate-900 leading-[0.88]`}>
                Árvores<br /><span className="italic text-[#009640]">Guardiãs</span>
              </h2>
            </div>
            <p className="text-slate-400 max-w-xs text-sm leading-relaxed">
              Espécies endémicas dos dois biomas convivem neste corredor ecológico, algumas com mais de mil anos de existência.
            </p>
          </div>
        </Reveal>

        {/* Grid flora — padrão editorial */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {flora.map((planta, i) => (
            <Reveal key={planta.nome} anim="up" delay={i * 100}>
              <div className="group relative h-[360px] rounded-[2rem] overflow-hidden bg-slate-100">
                <Image src={planta.imagem} alt={planta.nome} fill className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-95 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* Bioma badge */}
                <div className="absolute top-5 left-5">
                  <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border"
                    style={{
                      color: planta.habitat.includes('Amazônica') ? '#009640' : '#c2930a',
                      borderColor: planta.habitat.includes('Amazônica') ? '#00964060' : '#c2930a60',
                      backgroundColor: planta.habitat.includes('Amazônica') ? '#00964020' : '#c2930a20'
                    }}>
                    {planta.habitat}
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-white/40 italic text-xs mb-1">{planta.cientifico}</p>
                  <h3 className={`${jakarta.className} text-2xl font-black mb-2`}>{planta.nome}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{planta.descricao}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}


// ==========================================
// SECÇÃO: EDUCAÇÃO AMBIENTAL & COMUNIDADES
// ==========================================
function SecEducacaoComunidades() {
  const pilares = [
    { icon: <Shield size={20} />, titulo: "Conservação Ativa", desc: "Programas de monitoramento de fauna com participação das comunidades tradicionais." },
    { icon: <Users size={20} />, titulo: "Comunidades Tradicionais", desc: "Quilombolas e ribeirinhos são guardiões do conhecimento ancestral sobre a floresta." },
    { icon: <Leaf size={20} />, titulo: "Educação Ambiental", desc: "Visitas pedagógicas para escolas locais e programas de voluntariado ecológico." },
    { icon: <Camera size={20} />, titulo: "Pesquisa Científica", desc: "Parceria com universidades para catalogação de espécies e estudos de ecossistema." },
    { icon: <Globe size={20} />, titulo: "Turismo Responsável", desc: "Limitação de visitantes por trilha para garantir mínimo impacto ambiental." },
    { icon: <Layers size={20} />, titulo: "Corredores Ecológicos", desc: "Integração com outras unidades de conservação do sul do Pará." },
  ];

  return (
    <section className="py-24 bg-[#FDFCF7] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">

          {/* Texto editorial */}
          <div>
            <Reveal anim="right">
              <p className="text-[#009640] font-black text-[9px] uppercase tracking-[0.35em] mb-4 flex items-center gap-3">
                <span className="w-6 h-[1px] bg-[#009640]" /> Impacto social
              </p>
              <h2 className={`${jakarta.className} text-5xl md:text-6xl font-black text-slate-900 leading-[0.88] mb-8`}>
                Educação<br />Ambiental &<br /><span className="italic text-[#009640]">Comunidades</span>
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-6">
                A Serra das Andorinhas é também um laboratório social. As comunidades quilombolas e ribeirinhas que habitam o entorno do parque detêm um saber ecológico milenar que a ciência começa agora a reconhecer.
              </p>
              <p className="text-slate-400 text-base leading-relaxed mb-10">
                Programas de educação ambiental levam crianças das escolas municipais ao contato direto com a natureza, formando a próxima geração de guardiões do bioma.
              </p>
              <Link href="/rotas" className="inline-flex items-center gap-3 bg-[#009640] text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#007a33] transition-colors">
                Conhecer os programas <ArrowRight size={14} />
              </Link>
            </Reveal>
          </div>

          {/* Grid de pilares */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pilares.map((p, i) => (
              <Reveal key={p.titulo} anim="left" delay={i * 80}>
                <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 hover:shadow-lg transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-[#009640]/10 flex items-center justify-center text-[#009640] mb-4 group-hover:bg-[#009640] group-hover:text-white transition-colors">
                    {p.icon}
                  </div>
                  <h4 className={`${jakarta.className} text-base font-black text-slate-900 mb-2`}>{p.titulo}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// SECÇÃO: NATUREZA INTOCADA — EDITORIAL FULL WIDTH
// ==========================================
function SecNaturezaIntocada() {
  return (
    <section className="relative h-[60vh] md:h-[80vh] overflow-hidden flex items-center justify-center">
      <Image src="https://images.unsplash.com/photo-1767917920876-2523edc0d20b?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Cuidar para viver" fill className="object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#021a0d]/60 via-transparent to-[#021a0d]/80" />
      <div className="relative z-10 text-center px-6">
        <Reveal anim="zoom">
          <p className="text-white/40 font-black text-[9px] uppercase tracking-[0.4em] mb-6">Cuidar para viver</p>
          <h2 className={`${playfair.className} text-5xl md:text-6xl font-black text-white leading-tight italic mb-6`}>
            "No começo pensei que estivesse lutando para salvar seringueiras, depois pensei que estava lutando para salvar a Floresta Amazônica.<br />Agora, percebo que estou lutando pela humanidade."
          </h2>
          <p className="text-white/40 text-sm font-black uppercase tracking-widest">Chico Mendes</p>
        </Reveal>
      </div>
    </section>
  );
}

// ==========================================
// CTA FINAL
// ==========================================
function SecCTA() {
  return (
    <section className="py-24 bg-[#021a0d] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

          <Reveal anim="right" className="md:col-span-7">
            <div className="bg-[#009640] rounded-[2rem] p-10 md:p-14 flex flex-col justify-between h-full min-h-[320px]">
              <div>
                <p className="text-white/60 font-black text-[9px] uppercase tracking-[0.3em] mb-4">Visitar o parque</p>
                <h3 className={`${jakarta.className} text-4xl md:text-5xl font-black text-white leading-[0.9] mb-6`}>
                  Planeja a tua<br /><span className="italic">visita ao Parque Estadual Serra dos Martirios</span>
                </h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-md">
                  O parque recebe visitas com guia credenciado. Grupos escolares têm entrada gratuita mediante agendamento com a SEMTUR.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link href="/pacotes" className="inline-flex items-center gap-3 bg-white text-[#009640] px-7 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#F9C400] transition-colors">
                  Ver passeios disponíveis <ArrowRight size={14} />
                </Link>
                <Link href="/cadastro" className="inline-flex items-center gap-3 border border-white/30 text-white px-7 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors">
                  Cartão Residente
                </Link>
              </div>
            </div>
          </Reveal>

          <div className="md:col-span-5 flex flex-col gap-5">
            <Reveal anim="left" delay={100}>
              <div className="bg-[#F9C400] rounded-[2rem] p-8">
                <Leaf size={24} className="text-[#00577C] mb-4" />
                <p className={`${jakarta.className} text-4xl font-black text-[#002f40]`}>+300</p>
                <p className="text-[#002f40]/60 font-black text-xs uppercase tracking-widest mt-1">Espécies catalogadas</p>
              </div>
            </Reveal>
            <Reveal anim="left" delay={200}>
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                <Droplets size={24} className="text-[#F9C400] mb-4" />
                <p className={`${jakarta.className} text-4xl font-black text-white`}>11</p>
                <p className="text-white/40 font-black text-xs uppercase tracking-widest mt-1">Cachoeiras no parque</p>
                <p className="text-white/20 text-xs mt-2">Das mais acessíveis às mais remotas da serra</p>
              </div>
            </Reveal>
            <Reveal anim="left" delay={300}>
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                <Mountain size={24} className="text-[#F9C400] mb-4" />
                <p className={`${jakarta.className} text-4xl font-black text-white`}>12.000ha</p>
                <p className="text-white/40 font-black text-xs uppercase tracking-widest mt-1">Área total protegida</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function BiodiversidadePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 50);
      if (y < 80) setShowHeader(true);
      else if (y > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(y);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <main className={`${inter.className} min-h-screen flex flex-col bg-[#021a0d] text-white overflow-x-hidden`}>
      {/* Conteúdo principal (tudo excepto o footer) */}
      <div className="flex-1">
        {/* HEADER */}
        <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-3">
               <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                  <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
               </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {['Hoteis', 'Pacotes', 'Roteiros','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
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

          {/* Menu Mobile */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
              <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas Turísticas</Link>
              <Link href="/eventos" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Agenda Cultural</Link>
              <Link href="/pacotes" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Pacotes</Link>
              <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Roteiros</Link>
              <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
              <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
              <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
              <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
            </div>
          )}
        </header>

        {/* CONTEÚDO DAS SECÇÕES */}
        <HeroBiodiversidade />
        <SecParque />
        <SecBiomas />
        <SecCachoeiras />
        <SecFauna />
        <SecFlora />
        <SecEducacaoComunidades />
        <SecNaturezaIntocada />
        <SecCTA />
      </div>

      {/* FOOTER */}
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
    </main>
  );
}