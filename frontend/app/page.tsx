'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Star,
  ExternalLink,
  Menu,
  Landmark,
  Hotel,
  Mountain,
  Waves,
  TreePine,
  Route,
  CalendarDays,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Ticket,
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { createClient } from '@supabase/supabase-js';

// Inicializa a ligação ao teu Supabase usando as variáveis de ambiente que já tens
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

// --- TIPOS ---
type Evento = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  imagem_url: string;
  categoria: string;
};

// --- DADOS ESTÁTICOS ---
const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1442850473887-0fb77cd0b337?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0',
    title: 'Descubra a beleza natural do Araguaia.',
    subtitle: 'Rios, serras, trilhas e paisagens inesquecíveis no coração do sul do Pará.',
  },
  {
    image: 'https://images.pexels.com/photos/33153432/pexels-photo-33153432.jpeg',
    title: 'Viva experiências únicas em São Geraldo.',
    subtitle: 'Uma cidade acolhedora, cheia de natureza, cultura e histórias para conhecer.',
  },
  {
    image: 'https://images.pexels.com/photos/16832175/pexels-photo-16832175.jpeg',
    title: 'A natureza também é patrimônio do povo.',
    subtitle: 'Residentes têm acesso facilitado ao parque com o Cartão Digital SagaTurismo.',
  },
];

const atracoes = [
  {
    title: 'Serra das Andorinhas',
    desc: 'Um dos maiores símbolos naturais da região, com paisagens marcantes, trilhas, mirantes e o espetáculo das andorinhas ao entardecer.',
    icon: Mountain,
  },
  {
    title: 'Rio Araguaia',
    desc: 'Cenário perfeito para lazer, pesca, banho, passeios e contemplação da natureza às margens de um dos rios mais conhecidos do Brasil.',
    icon: Waves,
  },
  {
    title: 'Trilhas e Ecoturismo',
    desc: 'Experiências em meio à vegetação, formações rochosas, fauna local e paisagens que revelam a força natural do sul do Pará.',
    icon: TreePine,
  },
];

const hoteis = [
  {
    nome: 'Hotel Rio Araguaia',
    tipo: 'Hotel',
    desc: 'Hospedagem confortável para visitantes que desejam explorar a cidade e o Rio Araguaia.',
    estrelas: 4,
    link: '#',
  },
  {
    nome: 'Pousada Serra Verde',
    tipo: 'Pousada',
    desc: 'Ambiente acolhedor, ideal para quem busca tranquilidade e contato com a natureza.',
    estrelas: 4,
    link: '#',
  },
  {
    nome: 'Hotel Central',
    tipo: 'Hotel urbano',
    desc: 'Opção prática no centro da cidade, próxima ao comércio e aos serviços locais.',
    estrelas: 3,
    link: '#',
  },
];

// Dados Mockados de Eventos (Enquanto a sua tabela do Supabase não envia os reais)
const mockEventos: Evento[] = [
  {
    id: '1',
    titulo: 'Festival de Veraneio da Ilha de Campo',
    descricao: 'O maior festival de verão do Araguaia com shows, desporto e culinária.',
    data: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(),
    local: 'Praia da Ilha de Campo',
    imagem_url: 'https://images.unsplash.com/photo-1544943971-d861676462bb?q=80&w=1887',
    categoria: 'Festividades'
  },
  {
    id: '2',
    titulo: 'Feira de Artesanato em Barro',
    descricao: 'Exposição e venda de artesanato local replicando as escrituras rupestres.',
    data: new Date(new Date().getFullYear(), new Date().getMonth(), 22).toISOString(),
    local: 'Praça da Matriz',
    imagem_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1887',
    categoria: 'Cultura'
  },
  {
    id: '3',
    titulo: 'Trilha Guiada: Roteiro Quelônios',
    descricao: 'Expedição ecológica pela Serra das Andorinhas e Caverna do Morcego.',
    data: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString(),
    local: 'Serra das Andorinhas',
    imagem_url: 'https://images.unsplash.com/photo-1621535492451-b844101e40c4?q=80&w=1887',
    categoria: 'Natureza'
  }
];

// --- COMPONENTE DA AGENDA CULTURAL ---
function AgendaCultural() {
  // Começamos com um array vazio, os dados virão do Supabase!
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // NOVO: Busca os dados na tabela 'eventos' do Supabase quando a página carrega
  useEffect(() => {
    async function fetchEventos() {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('data', { ascending: true }); // Ordena do mais próximo ao mais distante

      if (error) {
        console.error('Erro ao buscar eventos no Supabase:', error);
      } else if (data) {
        setEventos(data);
      }
    }

    fetchEventos();
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const filteredEventos = eventos.filter(ev => {
    // É importante garantir que a data que vem do Supabase é lida corretamente
    const evDate = new Date(ev.data + 'T00:00:00'); // Força fuso horário neutro
    if (selectedDate) {
      return evDate.toDateString() === selectedDate.toDateString();
    }
    return evDate.getMonth() === currentDate.getMonth() && evDate.getFullYear() === currentDate.getFullYear();
  });

  return (
    <section id="eventos" className="py-24 px-5 bg-slate-50 relative overflow-hidden border-b border-slate-200">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00577C]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="mb-14 max-w-3xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#009640]">
            Agenda da Cidade Amada
          </p>
          <h2 className={`${jakarta.className} text-4xl font-bold text-[#00577C] md:text-6xl tracking-tight`}>
            Calendário Cultural
          </h2>
          <p className="mt-5 max-w-2xl text-slate-600 text-lg">
            Acompanhe as festividades, eventos esportivos e passeios ecológicos de São Geraldo do Araguaia.
          </p>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-10 items-start">
          {/* CALENDÁRIO */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <button onClick={prevMonth} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-[#00577C] transition">
                <ChevronLeft size={20}/>
              </button>
              <h3 className={`${jakarta.className} text-xl font-bold text-slate-800 uppercase`}>
                {monthNames[currentDate.getMonth()]} <span className="text-[#F9C400]">{currentDate.getFullYear()}</span>
              </h3>
              <button onClick={nextMonth} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-[#00577C] transition">
                <ChevronRight size={20}/>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4 text-center">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, i) => (
                <span key={i} className="text-xs font-black text-slate-400">{dia}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateOfThisCell = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const hasEvent = eventos.some(ev => new Date(ev.data + 'T00:00:00').toDateString() === dateOfThisCell.toDateString());
                const isSelected = selectedDate?.toDateString() === dateOfThisCell.toDateString();

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateOfThisCell)}
                    className={`
                      relative w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-bold transition-all
                      ${isSelected ? 'bg-[#00577C] text-white shadow-lg' : 'hover:bg-slate-100 text-slate-700'}
                      ${hasEvent && !isSelected ? 'ring-2 ring-[#F9C400] bg-[#F9C400]/10 text-[#00577C]' : ''}
                    `}
                  >
                    {day}
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#F9C400]"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <button onClick={() => setSelectedDate(null)} className="text-sm font-bold text-slate-400 hover:text-[#00577C] transition">
                  Mostrar todos do mês
                </button>
              </div>
            )}
          </div>

          {/* LISTA DE EVENTOS */}
          <div className="space-y-6">
            {filteredEventos.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 border-dashed flex flex-col items-center justify-center h-full min-h-[300px]">
                <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
                <h4 className={`${jakarta.className} text-xl font-bold text-slate-500`}>Nenhum evento agendado</h4>
                <p className="text-slate-400 mt-2">Não há eventos marcados para o período selecionado.</p>
              </div>
            ) : (
              filteredEventos.map((evento) => {
                const evDate = new Date(evento.data + 'T00:00:00');
                const dia = String(evDate.getDate()).padStart(2, '0');
                const mes = monthNames[evDate.getMonth()].slice(0, 3);

                return (
                  <div key={evento.id} className="group bg-white rounded-[2rem] p-4 pr-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all">
                    
                    <div className="shrink-0 w-24 h-24 rounded-3xl bg-[#F0F7FF] flex flex-col items-center justify-center text-[#00577C] border border-[#00577C]/10">
                      <span className="text-3xl font-black leading-none">{dia}</span>
                      <span className="text-xs font-bold uppercase tracking-widest mt-1">{mes}</span>
                    </div>

                    {evento.imagem_url && (
                       <div className="hidden md:block w-32 h-24 shrink-0 rounded-2xl overflow-hidden relative">
                         <Image src={evento.imagem_url} alt={evento.titulo} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                       </div>
                    )}

                    <div className="flex-1 text-center sm:text-left">
                      <span className="inline-block px-3 py-1 bg-[#F9C400]/20 text-[#00577C] rounded-md text-[10px] font-black uppercase tracking-widest mb-2">
                        {evento.categoria || 'Evento'}
                      </span>
                      <h4 className={`${jakarta.className} text-xl font-bold text-slate-900 line-clamp-1`}>{evento.titulo}</h4>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-sm text-slate-500 font-medium">
                        <MapPin size={14} className="text-[#009640]" />
                        <span className="line-clamp-1">{evento.local}</span>
                      </div>
                    </div>

                    <div className="shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
                      <Link href={`/eventos/${evento.id}`} className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-[#00577C] text-[#00577C] hover:text-white px-6 py-3 rounded-full font-bold text-sm transition-colors">
                        <Ticket size={16} /> Detalhes
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// COMPONENTE 2: HOMEPAGE PRINCIPAL
// ==========================================
export default function HomePage() {
  const [currentImage, setCurrentImage] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const currentSlide = heroSlides[currentImage];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroSlides.length);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 80) setShowHeader(true);
      else if (currentScrollY > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <main className={`${inter.className} bg-white text-slate-900`}>
      {/* HEADER */}
      <header
        className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56">
              <Image
                src="/logop.png"
                alt="Prefeitura de São Geraldo do Araguaia"
                fill
                priority
                className="object-contain object-left"
              />
            </div>

            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>
                SagaTurismo
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Secretaria de Turismo de São Geraldo do Araguaia
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              Rota Turística
            </Link>

            <a href="#eventos" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              Eventos
            </a>

            <a href="#hoteis" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              Hotéis
            </a>

            <a href="#historia" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">
              História
            </a>

            <a
              href="https://saogeraldodoaraguaia.pa.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-slate-600 hover:text-[#00577C]"
            >
              Governo
            </a>

            <Link
              href="/cadastro"
              className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]"
            >
              Cartão do Residente
            </Link>
          </nav>

          <button className="rounded-xl border border-slate-200 p-2 md:hidden">
            <Menu className="h-5 w-5 text-[#00577C]" />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen overflow-hidden pt-20">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.image}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-r from-[#00577C]/90 via-[#00577C]/62 to-[#00577C]/20" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-5 py-24">
          <div className="max-w-3xl text-white">

            <h1 className={`${jakarta.className} text-5xl font-extrabold leading-[0.95] md:text-7xl`}>
              {currentSlide.title}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">
              {currentSlide.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F9C400] px-7 py-4 font-bold text-[#00577C] shadow-xl transition hover:-translate-y-0.5 hover:bg-[#ffd633]"
              >
                Solicitar cartão com 50% de desconto
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/roteiro"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 px-7 py-4 font-bold text-white backdrop-blur transition hover:bg-white/15"
              >
                Explorar rota turística
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === currentImage ? 'w-8 bg-[#F9C400]' : 'w-2.5 bg-white/45'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ATRAÇÕES */}
      <section id="atracoes" className="mx-auto max-w-7xl px-5 py-24">
        <div className="mb-14 max-w-3xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#009640]">
            Atrações da cidade
          </p>
          <h2 className={`${jakarta.className} text-4xl font-bold text-slate-950 md:text-6xl`}>
            Natureza, aventura e paisagens que ficam na memória.
          </h2>
          <p className="mt-5 max-w-2xl text-slate-600">
            Conheça alguns dos principais pontos de interesse turístico de São Geraldo do Araguaia.
          </p>
        </div>

        <div className="grid gap-7 md:grid-cols-3">
          {atracoes.map(({ title, desc, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF8F0] text-[#009640]">
                <Icon className="h-8 w-8" />
              </div>

              <h3 className={`${jakarta.className} text-2xl font-bold text-slate-950`}>
                {title}
              </h3>

              <p className="mt-4 leading-relaxed text-slate-600">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ROTA TURÍSTICA */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2 md:items-center">
          <div className="relative min-h-[420px] overflow-hidden rounded-[2.5rem] shadow-xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#00577C]/75 via-[#00577C]/20 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/20 bg-white/15 p-5 text-white backdrop-blur-md">
              <Route className="mb-3 h-8 w-8 text-[#F9C400]" />
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">
                Roteiro oficial
              </p>
              <p className={`${jakarta.className} mt-1 text-3xl font-bold`}>
                São Geraldo em cada caminho.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#009640]">
              Conheça nossa rota turística
            </p>

            <h2 className={`${jakarta.className} text-4xl font-bold text-slate-950 md:text-6xl`}>
              Um roteiro para descobrir o melhor da cidade.
            </h2>

            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Reunimos paisagens naturais, cultura local, pontos de visitação e experiências
              para quem deseja conhecer São Geraldo do Araguaia com mais direção e propósito.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/roteiro"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#F9C400] px-8 py-4 font-bold text-[#00577C] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#ffd633]"
              >
                Explorar rota turística
                <ArrowRight className="h-5 w-5" />
              </Link>

              <a
                href="#eventos"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-8 py-4 font-bold text-[#00577C] transition hover:border-[#00577C] hover:bg-white"
              >
                Ver Agenda Cultural
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* AQUI ESTÁ A NOSSA NOVA SECÇÃO DE EVENTOS BEM INTEGRADA */}
      <AgendaCultural />

      {/* HOTÉIS */}
      <section id="hoteis" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#009640]">
              Onde ficar
            </p>

            <h2 className={`${jakarta.className} text-4xl font-bold text-slate-950 md:text-6xl`}>
              Hotéis e hospedagens
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-slate-600">
              Espaços para receber turistas, famílias, visitantes e moradores que desejam aproveitar melhor a cidade.
            </p>
          </div>

          <div className="grid gap-7 md:grid-cols-3">
            {hoteis.map(({ nome, tipo, desc, estrelas, link }) => (
              <article
                key={nome}
                className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-48 items-center justify-center bg-slate-50 text-slate-400">
                  <Hotel className="h-14 w-14" />
                </div>

                <div className="p-7">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {tipo}
                    </span>

                    <div className="flex gap-1">
                      {Array.from({ length: estrelas }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-[#F9C400] text-[#F9C400]" />
                      ))}
                    </div>
                  </div>

                  <h3 className={`${jakarta.className} text-2xl font-bold text-slate-950`}>
                    {nome}
                  </h3>

                  <p className="mt-3 leading-relaxed text-slate-600">{desc}</p>

                  <a
                    href={link}
                    className="mt-6 inline-flex items-center gap-2 font-bold text-[#00577C] hover:text-[#004766]"
                  >
                    Ver detalhes
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section id="historia" className="bg-slate-50 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#009640]">
              História da cidade
            </p>

            <h2 className={`${jakarta.className} text-4xl font-bold text-slate-950 md:text-6xl`}>
              Uma cidade moldada pelo rio, pela serra e pelo seu povo.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              São Geraldo do Araguaia é uma cidade marcada pela relação com o Rio Araguaia,
              pela força da natureza e pela identidade de seu povo. Entre paisagens naturais,
              tradições locais e histórias de desenvolvimento, o município se tornou uma porta
              de entrada para experiências ligadas ao ecoturismo, à cultura regional e à vida
              às margens do Araguaia.
            </p>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              O SagaTurismo nasce para valorizar esse patrimônio, aproximar visitantes das
              riquezas locais e garantir que os moradores também tenham acesso facilitado aos
              principais atrativos da cidade.
            </p>
          </div>

          <div className="rounded-[2.5rem] bg-white p-10 shadow-xl">
            <Landmark className="mb-8 h-12 w-12 text-[#00577C]" />

            <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-[#009640]">
              Patrimônio local
            </p>

            <h3 className={`${jakarta.className} mt-4 text-4xl font-bold text-[#00577C]`}>
              Turismo que valoriza a identidade araguaiense.
            </h3>

            <p className="mt-5 leading-relaxed text-slate-600">
              Mais do que visitar lugares, o turismo local também fortalece memórias,
              histórias, economia e orgulho de pertencimento.
            </p>
          </div>
        </div>
      </section>

      {/* BENEFÍCIO */}
      <section className="bg-[#00577C] py-24 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-[#F9C400]">
                Cartão do residente
              </p>

              <h2 className={`${jakarta.className} text-4xl font-bold md:text-6xl`}>
                Mora em São Geraldo do Araguaia? O parque também é para ti!
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
                Residentes podem solicitar o cartão digital e garantir 50% de desconto
                na entrada do parque, de forma simples, rápida e segura.
              </p>

              <Link
                href="/cadastro"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#F9C400] px-8 py-4 font-bold text-[#00577C] transition hover:-translate-y-0.5 hover:bg-[#ffd633]"
              >
                Solicitar meu cartão
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-8 backdrop-blur">
              <ShieldCheck className="mb-6 h-12 w-12 text-[#F9C400]" />
              <p className="text-6xl font-black">50%</p>
              <p className="mt-3 text-xl font-bold">de desconto para residentes</p>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                Benefício digital vinculado ao cadastro do morador.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-40">
              <Image
                src="/logop.png"
                alt="Prefeitura de São Geraldo do Araguaia"
                fill
                className="object-contain object-left"
              />
            </div>

            <div className="border-l border-slate-200 pl-4">
              <p className={`${jakarta.className} text-2xl font-bold text-[#00577C]`}>
                SagaTurismo
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Plataforma oficial de turismo
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} · Prefeitura Municipal de São Geraldo do Araguaia · Pará
          </p>
        </div>
      </footer>
    </main>
  );
}