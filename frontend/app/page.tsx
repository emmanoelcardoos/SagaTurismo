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
} from 'lucide-react';
// Substituída a Playfair_Display pela Plus_Jakarta_Sans para um visual mais moderno e "padrão"
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const heroSlides = [
  {
    image:
      'https://images.unsplash.com/photo-1442850473887-0fb77cd0b337?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0',
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
                  "url('https://lh3.googleusercontent.com/gps-cs-s/APNQkAHC5RvbgJUYYDnSXx34uKMNh82_RVa__SLy_u7kbc7SKZMyn6vbW8xzCHUz6B1B43RIDFn6w9jcKOU6wmXIaGAcNArcvpTtm3aNUURycOomwkwmvEHGHb0N7Uo1GpbWyzgafsByrgpO4gmX=s1360-w1360-h1020')",
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
                href="#hoteis"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-8 py-4 font-bold text-[#00577C] transition hover:border-[#00577C] hover:bg-white"
              >
                Ver hospedagens
              </a>
            </div>
          </div>
        </div>
      </section>

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