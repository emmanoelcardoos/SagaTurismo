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
  { nome: "Arara-canindé", cientifico: "Ara ararauna", habitat: "Floresta Amazônica", imagem: "https://images.pexels.com/photos/36052063/pexels-photo-36052063.jpeg?_gl=1*tsn53b*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk1NDAyNDckbzUzJGcxJHQxNzc5NTQwNTgyJGozNSRsMCRoMA..", cor: "#1a6b3c", tag: "Ave", ameaca: "Pouco Preocupante" },
  { nome: "Onça-pintada", cientifico: "Panthera onca", habitat: "Cerrado / Amazônia", imagem: "https://images.pexels.com/photos/11630694/pexels-photo-11630694.jpeg?_gl=1*56kp8k*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk1NDAyNDckbzUzJGcxJHQxNzc5NTQwNjYzJGo0MyRsMCRoMA..", cor: "#8b5e0a", tag: "Mamífero", ameaca: "Vulnerável" },
  { nome: "Lobo-guará", cientifico: "Chrysocyon brachyurus", habitat: "Cerrado", imagem: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=600&q=80", cor: "#c2440c", tag: "Mamífero", ameaca: "Quase ameaçado" },
  { nome: "Tucano-toco", cientifico: "Ramphastos toco", habitat: "Floresta / Cerrado", imagem: "https://images.pexels.com/photos/35098811/pexels-photo-35098811.jpeg?_gl=1*vp3cdd*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk1NDAyNDckbzUzJGcxJHQxNzc5NTQwNDk1JGozMiRsMCRoMA..", cor: "#00577C", tag: "Ave", ameaca: "Pouco preocupante" },
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
  { nome: "Buritizeiro", cientifico: "Mauritia flexuosa", habitat: "Veredas / Cerrado", imagem: "https://images.pexels.com/photos/2563244/pexels-photo-2563244.jpeg?_gl=1*18vbbro*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk2NTY5NTgkbzYzJGcxJHQxNzc5NjU3OTQ3JGozMiRsMCRoMA..", descricao: "Palmeira das veredas, fundamental para a fauna local.", cor: "#3a7d18" },
  { nome: "Andiroba", cientifico: "Carapa guianensis", habitat: "Floresta Amazônica", imagem: "https://images.pexels.com/photos/20992632/pexels-photo-20992632.jpeg?_gl=1*m5be40*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk2NTY5NTgkbzYzJGcxJHQxNzc5NjU4MjY3JGozOCRsMCRoMA..", descricao: "Árvore medicinal de alto valor, protegida na Serra das Andorinhas.", cor: "#2d5c1a" },
  { nome: "Pequizeiro", cientifico: "Caryocar brasiliense", habitat: "Cerrado", imagem: "https://images.pexels.com/photos/2170351/pexels-photo-2170351.jpeg?_gl=1*1m2qajr*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk2NTY5NTgkbzYzJGcxJHQxNzc5NjU4MzY2JGozNCRsMCRoMA..", descricao: "Fruto ícone do cerrado, alimento e símbolo cultural regional.", cor: "#8b6914" },
  { nome: "Sumaúma", cientifico: "Ceiba pentandra", habitat: "Floresta Amazônica", imagem: "https://images.pexels.com/photos/4773620/pexels-photo-4773620.jpeg?_gl=1*do5myu*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk2NTY5NTgkbzYzJGcxJHQxNzc5NjU4NDI0JGozNiRsMCRoMA..", descricao: "A 'Rainha da Floresta', pode ultrapassar 50 metros de altura.", cor: "#1a4a2a" },
];

// ==========================================
// DADOS — 6 CACHOEIRAS
// ==========================================
const cachoeiras = [
  {
    nome: "Cachoeira Riacho Fundo",
    altura: "",
    dificuldade: "Não classificada",
    descricao: "Sem descrição",
    destaque: true,
    imagem: "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/c2085f3b-dde5-4a96-b346-329b30ec4054.JPG"
  },
  {
    nome: "Cachoeira Piscinão do Honorato",
    altura: "",
    dificuldade: "Não classificada",
    descricao: "Sem descrição",
    destaque: true,
    imagem: "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/55aa42b0-0de1-4bdb-be7d-e1e5f6fe88e3.JPG"
  },
  {
    nome: "Cachoeira do Poção",
    altura: "",
    dificuldade: "Não classificada",
    descricao: "Sem descrição",
    destaque: true,
    imagem: "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/24445621-1a43-4ca4-ad51-d2c29c4cc6c3.JPG"
  },
  {
    nome: "Cachoeira da Visagem",
    altura: "",
    dificuldade: "Não classificada",
    descricao: "Sem descrição",
    destaque: true,
    imagem: "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/217474f1-5f64-4320-a672-3449cb669dce.JPG"
  },
  {
    nome: "Cachoeira do Espelho",
    altura: "",
    dificuldade: "Não classificada",
    descricao: "Sem descrição",
    destaque: true,
    imagem: "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/3d237e50-5fe7-4306-80ed-22d76292bbba.JPG"
  },
  {
    nome: "Cachoeira da Vargem Grande",
    altura: "",
    dificuldade: "Não classificada",
    descricao: "Sem descrição",
    destaque: true,
    imagem: "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/PHOTO-2026-06-09-01-00-26.jpg"
  }
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
    <section className="relative h-[80vh] flex flex-col items-start justify-end pb-24 px-6 md:px-12 overflow-hidden bg-[#021a0d]">
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
        <Image
          src="https://images.pexels.com/photos/18064280/pexels-photo-18064280.jpeg?_gl=1*1at0h8g*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzk1MDQ0MjUkbzUyJGcxJHQxNzc5NTA0ODIxJGo1OSRsMCRoMA.."
          alt="Serra das Andorinhas - Floresta"
          fill className="object-cover opacity-90" priority
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#021a0d] via-[#021a0d]/30 to-transparent z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#021a0d]/60 to-transparent z-0" />

      <div className="relative z-10 max-w-[1400px] w-full mx-auto">
        <div className="flex flex-col items-start">
          <h1 className={`${jakarta.className} text-[clamp(3.5rem,8vw,9rem)] font-black text-white leading-[0.88] mb-6`}>
            Bio<br />
            <span className="text-[#009640] italic">diversidade</span>
          </h1>
         
        </div>
      </div>

      

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:flex gap-8">
        {[
          { n: "+50", label: "Cachoeiras" },
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
             
              <h2 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-[0.9]`}>
                Serra das<br /><span className="text-[#F9C400] italic">Andorinhas</span>
              </h2>
            </div>
            <div className="flex-1 max-w-md">
              <p className="text-white/50 text-lg leading-relaxed">
                Criado em 1995, o Parque Estadual Serra das Andorinhas/Martírios protege uma das últimas faixas intactas da transição entre a Floresta Amazônica e o Cerrado no estado do Pará — um mosaico de ecossistemas de valor científico inestimável.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <Reveal anim="right" className="md:col-span-7">
            <div className="group relative h-[460px] rounded-[2rem] overflow-hidden bg-[#051a09]">
              <Image src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/Serra_Das_Andorinhas_02.JPG" alt="Floresta da Serra" fill className="object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#021a0d]/90 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <Mountain size={24} className="text-[#F9C400] mb-3" />
                <h3 className={`${jakarta.className} text-3xl font-black mb-2`}>1.100m de altitude</h3>
                <p className="text-white/60 text-sm">Ponto mais alto do parque, com vista para o Rio Araguaia e a planície amazônica.</p>
              </div>
            </div>
          </Reveal>

          <div className="md:col-span-5 flex flex-col gap-5">
            <Reveal anim="left" delay={100}>
              <div className="group relative h-[220px] rounded-[2rem] overflow-hidden bg-[#00577C]">
                <Image src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/galeria/ponte-99.jfif.jpeg" alt="Rio Araguaia" fill className="object-cover opacity-50 group-hover:opacity-70 transition-all duration-700" />
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
                <Image src="https://images.pexels.com/photos/18064280/pexels-photo-18064280.jpeg?_gl=1*1642x6g*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODA3NTAwOTQkbzY5JGcxJHQxNzgwNzUwMzAxJGo5OSRsMCRoMA.." alt="Floresta densa" fill className="object-cover opacity-50 group-hover:opacity-70 transition-all duration-700" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[70vh]">
        <div className="relative group overflow-hidden bg-[#021a0d] flex items-end p-10 md:p-16 min-h-[50vh] md:min-h-0">
          <Image src="https://images.pexels.com/photos/4642462/pexels-photo-4642462.jpeg?_gl=1*170nnnw*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODA3NTAwOTQkbzY5JGcxJHQxNzgwNzUwNTU2JGozNyRsMCRoMA.." alt="Floresta Amazônica" fill className="object-cover opacity-40 group-hover:scale-105 group-hover:opacity-55 transition-all duration-1000" />
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

        <div className="relative group overflow-hidden bg-[#1a0e02] flex items-end p-10 md:p-16 min-h-[50vh] md:min-h-0">
          <Image src="https://images.pexels.com/photos/9101309/pexels-photo-9101309.jpeg?_gl=1*rgl0ww*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODA3NTAwOTQkbzY5JGcxJHQxNzgwNzUwNTk4JGo1OSRsMCRoMA.." alt="Cerrado" fill className="object-cover opacity-40 group-hover:scale-105 group-hover:opacity-55 transition-all duration-1000" />
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

      <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-white/20 to-transparent z-20 pointer-events-none" />
    </section>
  );
}

// ==========================================
// SECÇÃO: CACHOEIRAS
// ==========================================
function SecCachoeiras() {
  const destaques = cachoeiras.filter(c => c.destaque);
  const resto = cachoeiras.filter(c => !c.destaque);

  return (
    <section id="cachoeiras" className="py-24 bg-[#00577C] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <Reveal anim="up" className="mb-16">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div>
              <h2 className={`${jakarta.className} text-5xl md:text-8xl font-black text-white leading-[0.88]`}>
                Cachoeiras
              </h2>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {destaques.map((c, i) => (
            <Reveal key={c.nome} anim="up" delay={i * 120}>
              <div className="group relative h-[380px] rounded-[2rem] overflow-hidden bg-[#003d5c] cursor-pointer">
                <Image
                  src={c.imagem}
                  alt={c.nome}
                  fill
                  className="object-cover opacity-70 group-hover:scale-105 group-hover:opacity-90 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#003d5c]/95 via-[#003d5c]/20 to-transparent" />
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

        {resto.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
            {resto.map((c, i) => (
              <Reveal key={c.nome} anim="up" delay={i * 60}>
                <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6 hover:bg-white/10 transition-colors group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <Droplets size={18} className="text-[#F9C400]" />
                  </div>
                  <p className="text-[#F9C400] font-black text-xl mb-1">{c.altura}</p>
                  <h4 className={`${jakarta.className} text-base font-black text-white mb-2 group-hover:text-[#F9C400] transition-colors`}>{c.nome}</h4>
                  <p className="text-white/40 text-xs leading-relaxed">{c.descricao}</p>
                </div>
              </Reveal>
            ))}
          </div>
        )}
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
              
              <h2 className={`${jakarta.className} text-5xl md:text-8xl font-black text-white leading-[0.88]`}>
                Animais <span className="text-[#009640] italic">da Serra</span>
              </h2>
            </div>
            <p className="text-white/30 max-w-xs text-sm leading-relaxed">
              Mais de 300 espécies catalogadas entre mamíferos, aves, répteis e peixes. Muitas delas endémicas ou ameaçadas de extinção.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
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
             
              <h2 className={`${jakarta.className} text-5xl md:text-8xl font-black text-slate-900 leading-[0.88]`}>
                Árvores <span className="text-[#009640] italic">da Serra</span>
              </h2>
            </div>
            <p className="text-slate-400 max-w-xs text-sm leading-relaxed">
              Espécies endémicas dos dois biomas convivem neste corredor ecológico, algumas com mais de mil anos de existência.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {flora.map((planta, i) => (
            <Reveal key={planta.nome} anim="up" delay={i * 100}>
              <div className="group relative h-[360px] rounded-[2rem] overflow-hidden bg-slate-100">
                <Image src={planta.imagem} alt={planta.nome} fill className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-95 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

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
// SECÇÃO: NATUREZA INTOCADA
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

  // ── NOVO MENU AGRUPADO ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'Roteiros', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Passeios', 'Eventos', 'Comunidades', 'Aldeias'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  return (
    <main className={`${inter.className} min-h-screen flex flex-col bg-[#021a0d] text-white overflow-x-hidden`}>
      <div className="flex-1">
        
        {/* ── HEADER PADRÃO COM DROPDOWN ── */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'bg-[#021a0d]/95 backdrop-blur-md shadow-sm border-b border-white/10' : 'bg-transparent'}`}
        >
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
            <div className="flex-1">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                  <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain brightness-0 invert" />
                </div>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center justify-center gap-12">
              {menuGroups.map((group) => (
                <div key={group.label} className="relative group py-2">
                  <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors`}>
                    {group.label} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-[#021a0d]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] rounded-2xl p-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50 flex flex-row items-center gap-1">
                    {group.links.map((link) => {
                      const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                      return (
                        <Link key={link} href={path} className={`${jakarta.className} block px-5 py-3 text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all whitespace-nowrap`}>
                          {link}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="flex-1 flex justify-end items-center gap-4">
              <Link href="/cadastro" className={`hidden lg:inline-flex ${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
                Residente
              </Link>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-xl p-2 lg:hidden bg-white/10 text-white hover:bg-white/20 transition-colors">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Menu Mobile */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 w-full bg-[#021a0d] border-b border-white/10 p-6 flex flex-col gap-6 shadow-2xl lg:hidden z-50 max-h-[85vh] overflow-y-auto">
              {menuGroups.map((group) => (
                <div key={group.label} className="flex flex-col gap-3">
                  <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.2em] text-[#F9C400] border-b border-white/10 pb-2`}>{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.links.map((link) => {
                      const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                      return (
                        <Link key={link} href={path} onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} font-bold text-white/60 hover:text-white text-sm bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors`}>
                          {link}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="border-t border-white/10 pt-4 mt-2 flex flex-col gap-3">
                <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md`}>
                  Cartão Residente
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* CONTEÚDO DAS SECÇÕES INTOCADO */}
        <HeroBiodiversidade />
        <SecParque />
        <SecBiomas />
        <SecCachoeiras />
        <SecFauna />
        <SecFlora />
        <SecCTA />
      </div>

      {/* ── FOOTER PADRÃO ATUALIZADO ── */}
      <footer className="py-20 px-8 border-t border-white/10 bg-[#021a0d] text-left mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain brightness-0 invert" />
              <div className="w-px h-12 bg-white/10 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de São Geraldo do Araguaia" width={140} height={50} className="object-contain brightness-0 invert" />
            </div>
            <div className="text-left space-y-1">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                © 2026 Secretaria Municipal de Turismo - SGA | Todos os direitos reservados
              </p>
              <p className="text-[10px] font-bold text-white/20">
                CNPJ: 10.249.241/0001-22
              </p>
            </div>
          </div>
          <div className="flex gap-10">
            <div className="text-left border-l-2 border-white/10 pl-9">
              <p className="text-[10px] font-black text-[#F9C400] uppercase mb-1">Contato Oficial</p>
              <p className="text-xs font-bold text-white/40 tracking-tight">setursaga@gmail.com</p>
            </div>
            <ShieldCheck size={40} className="text-[#009640] opacity-30" />
          </div>
        </div>
      </footer>
    </main>
  );
}