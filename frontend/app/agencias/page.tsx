'use client'

import { useEffect, useState, useRef, ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Menu, MapPin, ShieldCheck, X, ArrowRight, Briefcase, ChevronDown
} from 'lucide-react'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import { supabase } from '@/lib/supabase'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

// ── TIPAGEM ──
type Agencia = {
  id: string
  nome: string
  descricao_curta?: string
  capa_url?: string
  logo_url?: string
  cadastur?: string
  endereco?: string
  instagram?: string
  whatsapp?: string
  telefone?: string
  ativo: boolean
}

// ── MOTOR DE ANIMAÇÕES ──
function useScrollAnimation(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target) }
    }, { threshold })
    if (ref.current) observer.observe(ref.current)
    return () => { if (ref.current) observer.unobserve(ref.current) }
  }, [threshold])
  return { ref, isVisible }
}

function AnimatedSection({ children, className = "", animation = "fade-up", delay = 0 }: { 
  children: ReactNode
  className?: string
  animation?: "fade-up" | "fade-left" | "fade-right" | "zoom-in"
  delay?: number
}) {
  const { ref, isVisible } = useScrollAnimation()
  let hiddenClass = ""
  switch (animation) {
    case "fade-up": hiddenClass = "opacity-0 translate-y-16"; break
    case "fade-left": hiddenClass = "opacity-0 translate-x-16"; break
    case "fade-right": hiddenClass = "opacity-0 -translate-x-16"; break
    case "zoom-in": hiddenClass = "opacity-0 scale-95"; break
  }
  return (
    <div 
      ref={ref} 
      className={`transition-all duration-[1000ms] ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0 scale-100" : hiddenClass} ${className}`} 
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ── SKELETON PARA CARREGAMENTO ──
function AgenciaCardSkeleton() {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 flex flex-col overflow-hidden animate-pulse shadow-sm h-[450px]">
      <div className="w-full h-64 bg-slate-100 shrink-0" />
      <div className="p-6 md:p-8 flex flex-col flex-1 gap-4">
        <div className="h-8 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-full mt-2" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
      </div>
    </div>
  )
}

export default function AgenciasPage() {
  const [agencias, setAgencias] = useState<Agencia[]>([])
  const [loading, setLoading] = useState(true)

  const [showHeader, setShowHeader] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isHeaderSolid, setIsHeaderSolid] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    async function fetchAgencias() {
      const { data } = await supabase.from('agencias').select('*').eq('ativo', true).order('nome')
      if (data) setAgencias(data as Agencia[])
      setLoading(false)
    }
    fetchAgencias()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsHeaderSolid(currentScrollY > 80)
      if (currentScrollY < 80) {
        setShowHeader(true)
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false)
      } else {
        setShowHeader(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const FALLBACK_IMAGE = "https://live.staticflickr.com/65535/54594015350_8cd6612923_4k.jpg"

  const menuGroups = [
  { label: 'Descobrir', links: ['Atrativos', 'História', 'Biodiversidade', 'Galeria'] },
  { label: 'Viver Cultural', links: ['Comunidades'] },
  { label: 'Planejar', links: ['Hospedagens', 'Gastronomia', 'Agências', 'Informações', 'CAT'] },
  { label: 'Institucional', links: ['SEMTUR', 'COMTUR', 'Parceiros'] },
];

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col`}>
      <header
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${
          (isHeaderSolid || isHovered || isMobileMenuOpen) 
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' 
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
          <div className="flex-1">
            <Link href="/" className="inline-flex items-center gap-3 transition-all duration-300">
              <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image 
                  src="/logop.png" 
                  alt="SagaTurismo" 
                  fill 
                  className={`object-contain transition-all duration-300 ${
                    (!isHeaderSolid && !isHovered && !isMobileMenuOpen) 
                      ? 'brightness-0 invert' 
                      : ''
                  }`} 
                />
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center justify-center gap-12">
            {menuGroups.map((group) => (
              <div key={group.label} className="relative group py-2">
                <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                  (isHeaderSolid || isHovered || isMobileMenuOpen) 
                    ? 'text-slate-600 group-hover:text-[#00577C]' 
                    : 'text-white group-hover:text-[#F9C400] drop-shadow-md'
                }`}>
                  {group.label} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-2xl p-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50 flex flex-row items-center gap-1">
                  {group.links.map((link) => {
                    const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`
                    return (
                      <Link key={link} href={path} className={`${jakarta.className} block px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#00577C] hover:bg-slate-50 rounded-xl transition-all whitespace-nowrap`}>
                        {link}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="flex-1 flex justify-end items-center gap-4">
            <Link href="/cadastro"
              className={`hidden lg:inline-flex ${jakarta.className} px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm ${
                (isHeaderSolid || isHovered || isMobileMenuOpen) 
                  ? 'bg-[#F9C400] text-[#002f40]' 
                  : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'
              }`}>
              Residente
            </Link>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`rounded-xl p-2 lg:hidden transition-all duration-300 ${
                (isHeaderSolid || isHovered || isMobileMenuOpen) 
                  ? 'text-[#00577C] hover:bg-slate-100' 
                  : 'text-white hover:bg-white/20'
              }`}>
              {isMobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-6 shadow-2xl lg:hidden z-50 max-h-[85vh] overflow-y-auto">
            {menuGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-3">
                <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.2em] text-[#00577C] border-b border-slate-100 pb-2`}>{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.links.map((link) => {
                    const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`
                    return (
                      <Link key={link} href={path} onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} font-bold text-slate-700 text-sm bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 hover:text-[#00577C] hover:bg-slate-100 transition-colors`}>
                        {link}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-3">
              <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md`}>
                Cartão Residente
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/herosections/heroagencias.jpg"
            alt="Agências em São Geraldo do Araguaia"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            Agências
          </h1>
          <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
            Operadores turísticos oficiais de São Geraldo do Araguaia
          </p>
        </div>

        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* CONTEÚDO */}
      <section className="mx-auto max-w-[1400px] px-6 py-16 md:py-24 w-full flex-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-slate-200 pb-6 gap-4">
          <div>
            <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900`}>Agências Oficiais</h2>
            <p className="text-slate-500 text-base md:text-lg font-medium mt-2">Conheça as empresas credenciadas para guiar o seu roteiro.</p>
          </div>
          {!loading && (
            <span className="text-xs font-black uppercase tracking-widest text-[#00577C] bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm shrink-0">
              {agencias.length} Operadores
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => <AgenciaCardSkeleton key={i} />)}
          </div>
        ) : agencias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-2xl mx-auto bg-white rounded-[2rem] border border-slate-100 my-10">
          <div className="w-16 h-16 bg-[#F9C400]/20 rounded-full flex items-center justify-center mb-6">
            <Briefcase className="text-[#00577C] w-8 h-8" />
          </div>
          <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900 mb-3`}>
            Guias e agências em cadastro
          </h3>
          <p className="text-slate-500 text-base leading-relaxed mb-6 max-w-lg">
            A Prefeitura está cadastrando os profissionais de turismo locais. Em breve você poderá encontrar todos os guias, barqueiros e operadores da região.
          </p>
          <div className="w-16 h-px bg-slate-200 mb-6" />
          <p className="text-slate-700 font-semibold text-sm mb-4">
            Trabalha com turismo em São Geraldo do Araguaia?
          </p>
          <Link href="/parceiros" className="inline-flex items-center gap-2 bg-[#F9C400] text-[#002f40] px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-[#e5b500] hover:scale-105 transition-all">
            Fazer inscrição gratuita <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agencias.map((agencia, index) => {
              // ── USA LOGO_URL COMO IMAGEM PRINCIPAL ──
              const imagemExibida = agencia.logo_url || agencia.capa_url || FALLBACK_IMAGE

              return (
                <AnimatedSection key={agencia.id} animation="fade-up" delay={index * 50}>
                  <article className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden group h-full">
                    <div className="relative w-full h-64 overflow-hidden bg-slate-100 shrink-0 border-b border-slate-100">
                      <Image
                        src={imagemExibida}
                        alt={agencia.nome}
                        fill
                        className="object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
                    </div>

                    <div className="p-6 md:p-8 flex-1 flex flex-col">
                      <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-3 leading-tight`}>
                        {agencia.nome}
                      </h3>

                      <p className="text-slate-500 font-medium text-sm leading-relaxed mb-4 line-clamp-3">
                        {agencia.descricao_curta || 'Descubra os melhores roteiros e experiências com esta agência parceira oficial do município.'}
                      </p>

                      {/* ── Nº CADASTUR ── */}
                      {agencia.cadastur && (
                        <div className="mb-4">
                          <p className="text-xs font-bold text-slate-600">
                            Nº Cadastur: <span className="text-[#00577C] font-black">{agencia.cadastur}</span>
                          </p>
                        </div>
                      )}

                      <div className="mt-auto flex flex-col gap-3 text-sm text-slate-600 font-medium border-t border-slate-100 pt-5">
                        {agencia.endereco && (
                          <p className="leading-relaxed">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agencia.nome} ${agencia.endereco} São Geraldo do Araguaia PA`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver no Google Maps"
                              className="flex items-start gap-2 hover:text-[#F9C400] transition-colors"
                            >
                              <MapPin size={16} className="text-[#00577C] shrink-0 mt-0.5" />
                              <span className="text-sm">{agencia.endereco}</span>
                            </a>
                          </p>
                        )}

                        {agencia.whatsapp && (
                          <p className="flex items-center gap-2">
                            <span className="w-4 h-4 flex items-center justify-center bg-[#25D366]/10 rounded-full shrink-0">
                              <svg className="w-3 h-3 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.383 0 0 5.383 0 12.031c0 2.124.553 4.195 1.604 6.012L.15 24l6.103-1.601a11.964 11.964 0 005.778 1.488h.004c6.648 0 12.031-5.383 12.031-12.031S18.679 0 12.031 0zM12.035 21.84c-1.784 0-3.535-.481-5.07-1.388l-.363-.214-3.766.986.999-3.666-.235-.374a9.986 9.986 0 01-1.528-5.353c0-5.522 4.492-10.015 10.015-10.015 5.523 0 10.016 4.493 10.016 10.015 0 5.523-4.493 10.016-10.016 10.016zm5.503-7.514c-.302-.151-1.785-.882-2.062-.983-.277-.101-.479-.151-.681.151-.201.302-.78 1.007-.957 1.209-.176.201-.353.226-.655.075-1.344-.672-2.52-1.464-3.486-3.155-.176-.302.176-.277.453-.83.101-.201.05-.377-.025-.528-.075-.151-.681-1.637-.932-2.241-.243-.585-.49-.504-.681-.513-.176-.008-.377-.008-.579-.008-.201 0-.528.075-.805.377-.277.302-1.056 1.032-1.056 2.516 0 1.484 1.082 2.918 1.233 3.119.151.201 2.138 3.273 5.183 4.582 1.344.579 2.113.629 2.918.528.882-.101 2.214-.906 2.516-1.785.302-.882.302-1.637.201-1.785-.101-.176-.377-.277-.679-.428z"/></svg>
                            </span>
                            <a href={`https://wa.me/55${agencia.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#F9C400] transition-colors">
                              {agencia.whatsapp}
                            </a>
                          </p>
                        )}
                        {agencia.telefone && !agencia.whatsapp && (
                          <p>
                            Tel: <a href={`tel:${agencia.telefone.replace(/\D/g, '')}`} className="hover:text-[#F9C400] transition-colors">{agencia.telefone}</a>
                          </p>
                        )}

                        {agencia.instagram && (
                          <p className="pt-1">
                            <a
                              href={`https://instagram.com/${agencia.instagram.replace('https://instagram.com/', '').replace('@', '').replace('/', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#00577C] font-bold hover:text-[#F9C400] transition-colors underline underline-offset-4 decoration-slate-200 hover:decoration-[#F9C400]"
                            >
                              Instagram
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                </AnimatedSection>
              )
            })}
          </div>
        )}
      </section>

      <footer className="py-20 px-8 border-t border-slate-200 bg-[#FDFCF7] text-left mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de SGA" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1 text-center md:text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                © 2026 Prefeitura Munícipal de São Geraldo do Araguaia - PA
              </p>
              <p className="text-[10px] font-bold text-slate-400/80">
                CNPJ: 10.249.241/0001-22
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}