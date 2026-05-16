"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google"
import {
  Compass, Waves, Tent, Camera, Utensils,
  Star, MapPin, Trees, Bird, History,
  CheckCircle2, ArrowRight, Info, ShieldCheck,
  Bed, Coffee, Map, Phone, Mail, ChevronDown,
  Leaf, Mountain, Fish, Clock, Users, Award
} from "lucide-react"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
})

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
      }}
    >
      {children}
    </div>
  )
}

export default function SaoGeraldoAraguaiaPage() {
  const [showHeader, setShowHeader] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [heroVisible, setHeroVisible] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setHeroVisible(true)
    const onScroll = () => {
      const y = window.scrollY
      setShowHeader(y < lastScrollY || y < 100)
      setLastScrollY(y)
      setScrolled(y > 60)
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [lastScrollY])

  return (
    <main className={`${jakarta.className} min-h-screen bg-white text-slate-900 overflow-x-hidden`}>

      {/* ─── HEADER ─── */}
      <header
        className={`fixed left-0 top-0 z-50 w-full transition-all duration-300 ${showHeader ? "translate-y-0" : "-translate-y-full"} ${scrolled ? "bg-white/97 backdrop-blur-md shadow-sm border-b border-slate-100" : "bg-transparent"}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-4">
            <div className="relative h-14 w-40 sm:w-52">
              <img src="/logop.png" alt="Prefeitura de São Geraldo do Araguaia" className="object-contain object-left h-full w-full" />
            </div>
            <div className={`hidden border-l pl-4 sm:block ${scrolled ? "border-slate-200" : "border-white/30"}`}>
              <p className={`${playfair.className} text-xl font-bold leading-none ${scrolled ? "text-[#00577C]" : "text-white"}`}>SagaTurismo</p>
              <p className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${scrolled ? "text-slate-400" : "text-white/70"}`}>Secretaria de Turismo · São Geraldo do Araguaia</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {["#roteiro", "#hospedagem", "#gastronomia"].map((href, i) => (
              <a key={i} href={href} className={`text-sm font-semibold transition ${scrolled ? "text-slate-600 hover:text-[#00577C]" : "text-white/90 hover:text-white"}`}>
                {["Roteiro", "Onde Ficar", "Onde Comer"][i]}
              </a>
            ))}
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-2.5 text-sm font-bold text-[#00577C] shadow transition hover:bg-[#ffd633]">
              Cartão do Residente
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative h-screen w-full flex flex-col items-center justify-end pb-24">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/7867865/pexels-photo-7867865.jpeg?_gl=1*9hmuia*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc4NDMxOTMkbzM0JGcxJHQxNzc3ODQzNDIyJGoxMiRsMCRoMA.."
            alt="Rio Araguaia"
            className="w-full h-full object-cover"
          />
          {/* Layered gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#001f2e]/90 via-[#003d5c]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#001f2e]/30 via-transparent to-transparent" />
        </div>

        {/* Institutional badge */}
        <div
          className="absolute top-28 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-5 py-2"
          style={{ transition: "opacity 1.2s", opacity: heroVisible ? 1 : 0 }}
        >
          <MapPin size={14} className="text-[#F9C400]" />
          <span className="text-white/90 text-xs font-bold uppercase tracking-widest">APA Araguaia · Pará · Brasil</span>
        </div>

        {/* Main title */}
        <div
          className="relative z-10 text-center px-6 max-w-5xl mx-auto"
          style={{
            transition: "opacity 1s ease 0.2s, transform 1s ease 0.2s",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <h1 className={`${playfair.className} text-6xl md:text-[7.5rem] font-bold text-white leading-[0.9] tracking-tight mb-6`}>
            Serra das<br />
            <span className="text-[#F9C400]">Andorinhas</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
            Onde a Amazônia encontra o Cerrado. Sítios arqueológicos milenares, cavernas, praias fluviais e a alma ribeirinha do Araguaia.
          </p>

          {/* Key stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
            {[
              { icon: Mountain, label: "APA Araguaia" },
              { icon: History, label: "Sítios Rupestres" },
              { icon: Leaf, label: "Amazônia & Cerrado" },
              { icon: Fish, label: "Pesca Esportiva" },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex items-center gap-2 text-white/80">
                <Icon size={15} className="text-[#F9C400]" />
                <span className="text-xs font-semibold uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">Explore</span>
          <ChevronDown size={18} className="animate-bounce" />
        </div>
      </section>

      {/* ─── INTRO / OVERVIEW ─── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <RevealSection>
              <span className="text-[#00577C] text-xs font-bold uppercase tracking-[0.25em] mb-4 block">Patrimônio Natural e Cultural</span>
              <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6`}>
                Um destino único no coração da Amazônia paraense
              </h2>
              <p className="text-slate-600 leading-relaxed text-base mb-6">
                A Serra das Andorinhas é uma das mais extraordinárias destinações ecoturísticas do Brasil. Protegida pela Área de Proteção Ambiental do Araguaia, abriga uma biodiversidade singular e registros históricos de ocupações humanas que remontam a milênios.
              </p>
              <p className="text-slate-500 leading-relaxed text-base">
                O território marca o encontro de dois dos maiores biomas brasileiros — a Floresta Amazônica e o Cerrado — criando uma paisagem de rara beleza e importância científica, cultural e turística.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <a href="#roteiro" className="inline-flex items-center gap-2 bg-[#00577C] text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-[#004a6a] transition">
                  Conhecer o Roteiro <ArrowRight size={15} />
                </a>
                <a href="#hospedagem" className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-6 py-3 rounded-full text-sm font-bold hover:border-[#00577C] hover:text-[#00577C] transition">
                  Onde Ficar
                </a>
              </div>
            </RevealSection>

            {/* Image mosaic */}
            <RevealSection delay={150} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 h-64 rounded-3xl overflow-hidden shadow-lg">
                <img src="https://images.pexels.com/photos/34752677/pexels-photo-34752677.jpeg?_gl=1*ot3u01*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDgzNjY3JGo1OCRsMCRoMA.." className="w-full h-full object-cover" alt="Serra das Andorinhas" />
              </div>
              <div className="h-48 rounded-3xl overflow-hidden shadow-lg">
                <img src="https://images.pexels.com/photos/33153425/pexels-photo-33153425.jpeg?_gl=1*skt2jp*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDgzNzAyJGoyMyRsMCRoMA.." className="w-full h-full object-cover" alt="Rio Araguaia" />
              </div>
              <div className="h-48 rounded-3xl overflow-hidden shadow-lg">
                <img src="https://images.pexels.com/photos/31795800/pexels-photo-31795800.jpeg?_gl=1*109rv15*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDgzNzUwJGo0MCRsMCRoMA.." className="w-full h-full object-cover" alt="Cachoeira" />
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ─── HIGHLIGHTS STRIP ─── */}
      <section className="bg-[#00577C] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { icon: Mountain, value: "APA Araguaia", label: "Área Protegida" },
              { icon: History, value: "Milênios", label: "Arte Rupestre" },
              { icon: Leaf, value: "2 Biomas", label: "Amazônia & Cerrado" },
              { icon: Waves, value: "Julho", label: "Temporada das Praias" },
            ].map(({ icon: Icon, value, label }, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Icon className="text-[#F9C400]" size={22} />
                </div>
                <p className="text-lg font-black">{value}</p>
                <p className="text-xs text-blue-200 font-semibold uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROTEIRO QUELÔNIOS ─── */}
      <section id="roteiro" className="py-28 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <RevealSection className="text-center mb-20">
            <span className="text-[#00577C] text-xs font-bold uppercase tracking-[0.25em] mb-4 block">Experiências</span>
            <h2 className={`${playfair.className} text-4xl md:text-6xl font-bold text-slate-900 mb-4`}>O Roteiro Quelônios</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base font-medium">
              Uma imersão completa na história, biodiversidade e cultura viva da região do Araguaia.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                icon: History,
                iconColor: "text-[#F9C400]",
                title: "História Ancestral",
                body: "Exploração de sítios arqueológicos, cavernas e grutas com figuras rupestres milenares. Testemunhas de civilizações passadas esculpidas nas fendas rochosas da Serra.",
                dark: false,
              },
              {
                num: "02",
                icon: Waves,
                iconColor: "text-[#F9C400]",
                title: "Veraneio de Julho",
                body: "Quando o Rio Araguaia baixa, surgem praias de areia branca ideais para banhos, acampamentos sob as estrelas e pesca esportiva sustentável.",
                dark: true,
              },
              {
                num: "03",
                icon: Trees,
                iconColor: "text-emerald-400",
                title: "Ecossistema da APA",
                body: "Jornada pelos biomas Amazônia e Cerrado. Viveiro de mudas nativas de Cacau, Açaí e Caju, e apiários de abelhas meliponas sem ferrão.",
                dark: false,
              },
            ].map(({ num, icon: Icon, iconColor, title, body, dark }, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className={`relative h-full p-10 rounded-3xl border transition-shadow hover:shadow-xl ${dark ? "bg-[#00577C] border-transparent text-white" : "bg-white border-slate-100 text-slate-900"}`}>
                  <span className={`absolute top-8 right-8 text-7xl font-black leading-none ${dark ? "text-white/5" : "text-slate-50"}`}>{num}</span>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 ${dark ? "bg-white/10" : "bg-slate-50"}`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  <h4 className={`text-xl font-black mb-4 uppercase tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>{title}</h4>
                  <p className={`text-sm leading-relaxed ${dark ? "text-blue-100" : "text-slate-500"}`}>{body}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VISUAL STORY: NATURE + ARCHAEOLOGY ─── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto space-y-28">

          {/* Waterfalls */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection className="order-2 lg:order-1">
              <span className="text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-4 block flex items-center gap-2">
                <Waves size={13} className="inline" /> Natureza
              </span>
              <h3 className={`${playfair.className} text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-6`}>
                Águas que<br />contam histórias
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                As cachoeiras e corredeiras da Serra das Andorinhas formam um sistema hídrico de beleza ímpar. As águas cristalinas esculpiram ao longo de milênios as rochas que hoje guardam os registros arqueológicos mais importantes da região.
              </p>
              <p className="text-slate-500 leading-relaxed text-sm">
                No período de julho, a vazão do Rio Araguaia transforma a paisagem, revelando extensas praias de areia branca que se tornam o coração da temporada turística da região.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold"><CheckCircle2 size={13}/> Banho permitido</span>
                <span className="flex items-center gap-2 bg-blue-50 text-[#00577C] px-4 py-2 rounded-full text-xs font-bold"><CheckCircle2 size={13}/> Pesca sustentável</span>
                <span className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-xs font-bold"><CheckCircle2 size={13}/> Camping na praia</span>
              </div>
            </RevealSection>

            <RevealSection delay={150} className="order-1 lg:order-2 relative">
              <div className="rounded-3xl overflow-hidden h-[480px] shadow-xl">
                <img src="https://images.pexels.com/photos/31795800/pexels-photo-31795800.jpeg?_gl=1*109rv15*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDgzNzUwJGo0MCRsMCRoMA.." className="w-full h-full object-cover" alt="Cachoeira Serra das Andorinhas" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white border border-slate-100 rounded-2xl shadow-lg p-5 max-w-xs">
                <p className="text-[#00577C] font-black text-sm">Temporada principal</p>
                <p className="text-slate-500 text-xs mt-1">Julho a Setembro · Praias do Araguaia</p>
              </div>
            </RevealSection>
          </div>

          {/* Rock art */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection className="relative">
              <div className="rounded-3xl overflow-hidden h-[480px] shadow-xl">
                <img src="https://images.pexels.com/photos/32729989/pexels-photo-32729989.jpeg?_gl=1*1uw2rth*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDgzNzgyJGo4JGwwJGgw" className="w-full h-full object-cover" alt="Arte rupestre" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-[#F9C400] rounded-2xl shadow-lg p-5 max-w-xs">
                <p className="text-[#00577C] font-black text-sm">Patrimônio Arqueológico</p>
                <p className="text-slate-700 text-xs mt-1">Sítios Rupestres · Registro Milenares</p>
              </div>
            </RevealSection>

            <RevealSection delay={150}>
              <span className="text-amber-600 text-xs font-bold uppercase tracking-[0.25em] mb-4 block flex items-center gap-2">
                <History size={13} className="inline" /> Arqueologia
              </span>
              <h3 className={`${playfair.className} text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-6`}>
                Arte gravada<br />no tempo
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                As paredes rochosas da Serra guardam registros arqueológicos de inestimável valor. Figuras rupestres milenares, esculpidas por civilizações que habitaram este território muito antes da colonização europeia, contam histórias de povos e cosmologias esquecidas.
              </p>
              <p className="text-slate-500 leading-relaxed text-sm">
                Cavernas e grutas acessíveis durante o roteiro guiado revelam a complexidade e sofisticação das culturas ancestrais que escolheram este lugar sagrado como seu lar.
              </p>
              <div className="mt-8 flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <Info size={18} className="text-amber-600 shrink-0" />
                <p className="text-amber-800 text-xs font-medium leading-relaxed">Visitas aos sítios arqueológicos são realizadas exclusivamente com guias credenciados pela Secretaria de Turismo.</p>
              </div>
            </RevealSection>
          </div>

          {/* Biodiversity */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection className="order-2 lg:order-1">
              <span className="text-[#00577C] text-xs font-bold uppercase tracking-[0.25em] mb-4 block flex items-center gap-2">
                <Leaf size={13} className="inline" /> Biodiversidade
              </span>
              <h3 className={`${playfair.className} text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-6`}>
                Dois biomas,<br />uma só paisagem
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                A Serra das Andorinhas ocupa uma zona de transição única entre a Floresta Amazônica e o Cerrado. Esta posição geográfica privilegiada resulta numa extraordinária riqueza de fauna e flora, com espécies características de ambos os biomas convivendo no mesmo território.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  { icon: Bird, label: "Birdwatching", desc: "Mais de 300 espécies registradas na APA" },
                  { icon: Trees, label: "Flora Nativa", desc: "Cacau, Açaí, Caju e espécies endêmicas" },
                  { icon: Leaf, label: "Meliponicultura", desc: "Apiários de abelhas sem ferrão" },
                  { icon: Fish, label: "Ictiofauna", desc: "Tucunaré, dourado, pirarucu e mais" },
                ].map(({ icon: Icon, label, desc }, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <Icon className="text-[#00577C] mb-3" size={18} />
                    <p className="text-slate-900 font-bold text-sm mb-1">{label}</p>
                    <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </RevealSection>

            <RevealSection delay={150} className="order-1 lg:order-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl overflow-hidden h-72 shadow-lg col-span-2">
                  <img src="https://images.pexels.com/photos/33153425/pexels-photo-33153425.jpeg?_gl=1*skt2jp*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDgzNzAyJGoyMyRsMCRoMA.." className="w-full h-full object-cover" alt="Ecossistema" />
                </div>
                <div className="rounded-2xl overflow-hidden h-40 shadow-lg">
                  <img src="https://images.pexels.com/photos/36645883/pexels-photo-36645883.jpeg?_gl=1*1iys60e*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0NDQ4JGo0NSRsMCRoMA.." className="w-full h-full object-cover" alt="Artesanato" />
                </div>
                <div className="rounded-2xl overflow-hidden h-40 shadow-lg">
                  <img src="https://images.pexels.com/photos/34752677/pexels-photo-34752677.jpeg?_gl=1*ot3u01*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDgzNjY3JGo1OCRsMCRoMA.." className="w-full h-full object-cover" alt="Formações rochosas" />
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ─── PATRIMÔNIO VIVO: DONA LEONILHA ─── */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <RevealSection className="text-center mb-16">
            <span className="text-[#00577C] text-xs font-bold uppercase tracking-[0.25em] mb-4 block">Cultura Viva</span>
            <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold text-slate-900`}>Memória e Tradição</h2>
          </RevealSection>
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            <RevealSection className="relative rounded-3xl overflow-hidden h-[420px] shadow-xl">
              <img src="https://images.pexels.com/photos/36645883/pexels-photo-36645883.jpeg?_gl=1*1iys60e*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0NDQ4JGo0NSRsMCRoMA.." className="w-full h-full object-cover" alt="Artesanato de Barro" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001f2e]/80 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <h4 className="font-black text-xl mb-1">Dona Leonilha</h4>
                <p className="text-sm text-white/70 font-medium">79 anos · Guardiã da arte rupestre em barro</p>
              </div>
            </RevealSection>

            <RevealSection delay={150} className="flex flex-col justify-between gap-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex-1">
                <h4 className="font-black text-slate-900 text-lg mb-3">Souvenirs que preservam a história</h4>
                <p className="text-slate-500 text-sm leading-relaxed">Aos 79 anos, Dona Leonilha mantém viva a arte de criar souvenirs de barro que reproduzem as escrituras rupestres da Serra. Cada peça é uma relíquia, carregando consigo séculos de história do povo que habitou estas terras.</p>
              </div>
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex-1">
                <h4 className="font-black text-slate-900 text-lg mb-3 flex items-center gap-2">
                  <Trees size={16} className="text-emerald-500" /> Viveiro do Futuro
                </h4>
                <p className="text-slate-500 text-sm leading-relaxed">No Sítio Bom Sossego, um viveiro de mudas nativas de Cacau, Açaí e Caju conecta geração e sustentabilidade, em parceria com IDEFLORBIO e CALMAP. Os visitantes podem participar do plantio.</p>
                <div className="flex gap-2 mt-4">
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">Cacau</span>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">Açaí</span>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">Caju</span>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ─── HOSPEDAGEM ─── */}
      <section id="hospedagem" className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <RevealSection className="flex items-center gap-6 mb-16">
            <div className="h-px bg-slate-100 flex-1" />
            <div className="text-center">
              <span className="text-[#00577C] text-xs font-bold uppercase tracking-[0.25em] mb-2 block">Acomodações</span>
              <h2 className={`${playfair.className} text-3xl md:text-4xl font-bold text-slate-900`}>Onde Ficar</h2>
            </div>
            <div className="h-px bg-slate-100 flex-1" />
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                img: "https://images.pexels.com/photos/12434692/pexels-photo-12434692.jpeg?_gl=1*cihqj3*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0MTgyJGozMyRsMCRoMA..",
                name: "Remanso dos Botos",
                desc: "Estrutura completa com quartos, área de camping e banheiros. Ideal para proximidade com a Praia do Remanso.",
                tag: "Quartos & Camping",
                icon: Bed,
              },
              {
                img: "https://images.pexels.com/photos/10601360/pexels-photo-10601360.jpeg?_gl=1*nnooiy*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0MjQ4JGoyOCRsMCRoMA..",
                name: "Camping da Sapucaia",
                desc: "Apenas 200m da Casa do Artesão. Localização privilegiada às margens do Araguaia para total contato com a natureza.",
                tag: "Camping · Beira-rio",
                icon: Tent,
              },
              {
                img: "https://images.pexels.com/photos/19076031/pexels-photo-19076031.jpeg?_gl=1*lucbiz*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0MzIyJGo0NiRsMCRoMA..",
                name: "Sítio Bela Vista",
                desc: "Propriedade da Sra. Vilma. Camping sustentável, trilhas de birdwatching e vivência nos apiários de abelhas locais.",
                tag: "Eco-Living",
                icon: Bird,
              },
            ].map(({ img, name, desc, tag, icon: Icon }, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="group rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300">
                  <div className="h-60 overflow-hidden">
                    <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={name} />
                  </div>
                  <div className="p-7">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-xl bg-[#00577C]/10 flex items-center justify-center">
                        <Icon className="text-[#00577C]" size={14} />
                      </div>
                      <span className="text-xs font-bold text-[#00577C] uppercase tracking-widest">{tag}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 mb-3">{name}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GASTRONOMIA ─── */}
      <section id="gastronomia" className="py-28 px-6 bg-[#00577C]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-16 items-center">

            {/* Left: image */}
            <RevealSection className="lg:col-span-2">
              <div className="relative rounded-3xl overflow-hidden h-[560px] shadow-2xl">
                <img src="https://images.pexels.com/photos/28992199/pexels-photo-28992199.jpeg?_gl=1*1y9cw8p*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0MzcyJGo1OSRsMCRoMA.." className="w-full h-full object-cover" alt="Culinária regional" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#00577C]/70 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
                  <p className="text-white font-bold text-sm">O destaque: Tucunaré na brasa com tempero regional, direto do Araguaia para a mesa.</p>
                </div>
              </div>
            </RevealSection>

            {/* Right: content */}
            <RevealSection delay={150} className="lg:col-span-3 space-y-10">
              <div>
                <span className="text-[#F9C400] text-xs font-bold uppercase tracking-[0.25em] mb-4 block">Sabores Ribeirinhos</span>
                <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold text-white leading-tight mb-4`}>
                  Gastronomia<br />da região
                </h2>
                <p className="text-blue-200 text-base leading-relaxed">
                  Da pesca artesanal direto para a brasa. Ingredientes frescos com a herança culinária das comunidades ribeirinhas do Araguaia.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    name: "Restaurante Deus é Fiel",
                    desc: "Na Vila Ilha de Campo. Café da manhã, almoço e jantar com pratos típicos: peixes do Araguaia e tempero caseiro.",
                    icon: Utensils,
                    detail: "Café · Almoço · Jantar",
                  },
                  {
                    name: "Restaurante Remanso",
                    desc: "Funciona aos finais de semana no Sítio Remanso dos Botos. Refeições com vista privilegiada da praia.",
                    icon: Coffee,
                    detail: "Fins de Semana",
                  },
                ].map(({ name, desc, icon: Icon, detail }, i) => (
                  <div key={i} className="bg-white/8 hover:bg-white/12 transition-colors border border-white/15 rounded-2xl p-7">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h4 className="text-[#F9C400] font-black text-lg">{name}</h4>
                      <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 shrink-0">
                        <Icon size={12} className="text-white/60" />
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{detail}</span>
                      </div>
                    </div>
                    <p className="text-blue-100 text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/8 border border-white/15 rounded-2xl p-6 flex items-start gap-4">
                <Info size={18} className="text-[#F9C400] shrink-0 mt-0.5" />
                <p className="text-blue-100 text-sm leading-relaxed">
                  Recomendamos confirmar horários de funcionamento diretamente com os estabelecimentos, especialmente fora da temporada de julho.
                </p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ─── INFORMAÇÕES PRÁTICAS ─── */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <RevealSection className="text-center mb-16">
            <span className="text-[#00577C] text-xs font-bold uppercase tracking-[0.25em] mb-4 block">Planeje sua Visita</span>
            <h2 className={`${playfair.className} text-3xl md:text-4xl font-bold text-slate-900`}>Informações Práticas</h2>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Melhor Época",
                items: ["Julho a Setembro: praias e pesca", "Ano todo: trilhas e arqueologia", "Evitar: cheias de março a maio"],
              },
              {
                icon: ShieldCheck,
                title: "Orientações",
                items: ["Visitas com guia credenciado", "Proibido remover artefatos", "Respeitar fauna e flora local"],
              },
              {
                icon: Users,
                title: "Contato SEMTUR",
                items: ["(94) 98145-2067", "setursaga@gmail.com", "Sec. Micheli Stephany de Souza"],
              },
            ].map(({ icon: Icon, title, items }, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm h-full">
                  <div className="w-10 h-10 rounded-2xl bg-[#00577C]/10 flex items-center justify-center mb-6">
                    <Icon className="text-[#00577C]" size={18} />
                  </div>
                  <h4 className="font-black text-slate-900 text-base mb-4">{title}</h4>
                  <ul className="space-y-3">
                    {items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F9C400] mt-2 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-20 px-8 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-14 mb-16">
            <div className="space-y-6">
              <img src="/logop.png" alt="Prefeitura SGA" className="h-16 object-contain" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                São Geraldo do Araguaia<br />"Cidade Amada, seguindo em frente"
              </p>
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[#00577C] hover:bg-[#00577C] hover:text-white transition cursor-pointer"><Phone size={14} /></div>
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[#00577C] hover:bg-[#00577C] hover:text-white transition cursor-pointer"><Mail size={14} /></div>
              </div>
            </div>

            <div className="space-y-5">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Gestão Executiva</h5>
              <ul className="text-sm text-slate-500 space-y-3">
                <li>Prefeito<br /><b className="text-slate-700">Jefferson Douglas de Jesus Oliveira</b></li>
                <li>Vice-Prefeito<br /><b className="text-slate-700">Marcos Antônio Candido de Lucena</b></li>
              </ul>
            </div>

            <div className="space-y-5">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Turismo (SEMTUR)</h5>
              <ul className="text-sm text-slate-500 space-y-3">
                <li>Secretária<br /><b className="text-slate-700">Micheli Stephany de Souza</b></li>
                <li><b className="text-slate-700">(94) 98145-2067</b></li>
                <li><b className="text-slate-700">setursaga@gmail.com</b></li>
              </ul>
            </div>

            <div className="space-y-5">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Equipe Técnica</h5>
              <ul className="text-sm text-slate-500 space-y-2">
                <li>• Adriana da Luz Lima</li>
                <li>• Carmelita Luz da Silva</li>
                <li>• Diego Silva Costa</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">© 2026 Secretaria Municipal de Turismo · São Geraldo do Araguaia (PA)</p>
            <div className="flex items-center gap-2">
              <ShieldCheck size={12} className="text-slate-300" />
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Portal Oficial do Município</p>
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}