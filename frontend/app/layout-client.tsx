// app/layout-client.tsx
"use client";

import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const AZUL_SAGA = "#00577C";
const AMARELO_SAGA = "#F9C400";

const NAV_GROUPS = [
  {
    title: "Descobrir",
    links: [
      { label: "Atrativos", href: "/atrativos" },
      { label: "Biodiversidade", href: "/biodiversidade" },
      { label: "História", href: "/historia" },
      { label: "Comunidades", href: "/comunidades" },
    ],
  },
  {
    title: "Viver",
    links: [
      { label: "Roteiros", href: "/roteiros" },
      { label: "Pesca Esportiva", href: "/pesca-esportiva" },
      { label: "Eventos", href: "/eventos" },
      { label: "Gastronomia", href: "/gastronomia" },
    ],
  },
  {
    title: "Planejar",
    links: [
      { label: "Hospedagens", href: "/hospedagens" },
      { label: "Agências", href: "/agencias" },
      { label: "CAT", href: "/cat" },
      { label: "Informações", href: "/informacoes" },
      { label: "App SagaTurismo", href: "/app-turismo" },
    ],
  },
  {
    title: "Institucional",
    links: [
      { label: "SEMTUR", href: "/semtur" },
      { label: "COMTUR", href: "/comtur" },
      { label: "Parceiros", href: "/parceiros" },
    ],
  },
];

const ROTAS_SEM_HERO = [
  "/blog",
  "/eventos",
  "/privacidade",
  "/termos",
  "/app-turismo",
];

const ROTAS_SEM_HEADER = ["/portal-servicos", "/not-found.tsx"];

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [isScrolled, setIsScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null);

  const isHome = pathname === "/";

  const isRotaSemHero = ROTAS_SEM_HERO.some(
    (rota) => pathname === rota || pathname?.startsWith(rota + "/")
  );

  const isRotaSemHeader = ROTAS_SEM_HEADER.some(
    (rota) => pathname === rota || pathname?.startsWith(rota + "/")
  );

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);

      if (currentScrollY < 50) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setDropdownAberto(null);
  }, [pathname]);

  const isHeaderSolid =
    isScrolled || isHovered || isMobileMenuOpen || isRotaSemHero;

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* ═══ HEADER GLOBAL ═══ */}
      {!isRotaSemHeader && (
        <header
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            showHeader ? "translate-y-0" : "-translate-y-full"
          } ${
            isHeaderSolid
              ? "bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_4px_24px_-8px_rgba(0,87,124,0.12)]"
              : "bg-transparent border-b border-transparent"
          }`}
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              <div className="w-32 md:w-48 flex-shrink-0">
                <Link
                  href="/"
                  onClick={handleLogoClick}
                  className="relative block h-10 md:h-12 w-full transition-transform hover:scale-[1.02]"
                >
                  <Image
                    src="/logop.png"
                    alt="SagaTurismo — São Geraldo do Araguaia"
                    fill
                    priority
                    className={`object-contain object-left transition-all duration-300 ${
                      !isHeaderSolid ? "brightness-0 invert" : ""
                    }`}
                  />
                </Link>
              </div>

              <nav className="hidden lg:flex flex-1 justify-center items-center gap-2 xl:gap-3">
                {NAV_GROUPS.map((group) => {
                  const isDropdownOpen = dropdownAberto === group.title;
                  return (
                    <div
                      key={group.title}
                      className="relative"
                      onMouseLeave={() => setDropdownAberto(null)}
                    >
                      <button
                        onMouseEnter={() => setDropdownAberto(group.title)}
                        onClick={() =>
                          setDropdownAberto(isDropdownOpen ? null : group.title)
                        }
                        className={`${jakarta.className} group relative flex items-center gap-1.5 text-[0.7rem] xl:text-xs font-black uppercase tracking-widest transition-colors px-3.5 py-2.5 rounded-xl ${
                          isDropdownOpen
                            ? "text-[#00577C] bg-[#00577C]/5"
                            : isHeaderSolid
                            ? "text-slate-700 hover:text-[#00577C] hover:bg-[#00577C]/5"
                            : "text-white hover:text-[#F9C400] drop-shadow-md"
                        }`}
                      >
                        {group.title}
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-300 ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                          strokeWidth={2.5}
                        />
                      </button>

                      <div
                        className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-300 z-50 ${
                          isDropdownOpen
                            ? "opacity-100 visible translate-y-0"
                            : "opacity-0 invisible translate-y-2 pointer-events-none"
                        }`}
                      >
                        <div className="relative bg-white border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,87,124,0.18)] rounded-2xl p-2 w-max overflow-hidden">
                          <div
                            className="absolute top-0 left-0 right-0 h-0.5"
                            style={{ background: AMARELO_SAGA }}
                          />
                          <div className="pt-1 flex flex-row items-center gap-1">
                            {group.links.map((link) => (
                              <Link
                                key={link.label}
                                href={link.href}
                                onClick={() => setDropdownAberto(null)}
                                className={`${jakarta.className} block px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#00577C] hover:bg-slate-50 rounded-xl transition-all whitespace-nowrap`}
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </nav>

              <div className="w-32 md:w-48 flex justify-end items-center gap-2 flex-shrink-0">
                <Link
                  href="/cadastro"
                  className={`hidden lg:inline-flex ${jakarta.className} px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                    isHeaderSolid
                      ? "bg-[#F9C400] text-[#002f40] hover:scale-105"
                      : "bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30"
                  }`}
                >
                  Residente
                </Link>

                <button
                  className={`lg:hidden p-2.5 rounded-xl transition-all duration-300 ${
                    isMobileMenuOpen
                      ? "bg-[#00577C] text-white"
                      : isHeaderSolid
                      ? "text-[#00577C] hover:bg-[#00577C]/10"
                      : "text-white hover:bg-white/20"
                  }`}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                >
                  {isMobileMenuOpen ? (
                    <X size={22} strokeWidth={2.4} />
                  ) : (
                    <Menu size={22} strokeWidth={2.4} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-slate-100 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="px-5 py-6 flex flex-col gap-6">
                {NAV_GROUPS.map((group) => (
                  <div key={group.title} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-0.5 rounded-full bg-[#F9C400]" />
                      <span
                        className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.22em] text-[#00577C]`}
                      >
                        {group.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {group.links.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`${jakarta.className} font-bold text-slate-700 text-sm bg-slate-50 border border-slate-100 hover:border-[#00577C] hover:text-[#00577C] hover:bg-[#00577C]/5 transition-all px-4 py-2 rounded-lg`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                <Link
                  href="/cadastro"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md`}
                >
                  Cartão Residente
                </Link>
              </div>
            </div>
          )}
        </header>
      )}

      <div className="flex-1">{children}</div>

      {!isHome && !isRotaSemHeader && (
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
                  © 2026 Prefeitura Municipal de São Geraldo do Araguaia - PA
                </p>
                <p className="text-[10px] font-bold text-slate-400/80">
                  CNPJ: 10.249.241/0001-22
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}