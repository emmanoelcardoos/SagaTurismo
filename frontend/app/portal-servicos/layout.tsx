"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon, Bell, Activity, MapPin, Building2, Briefcase,
  Compass, Newspaper, Smartphone, FileText, Users, Headset,
  Utensils, AlertCircle, Loader2, LogOut, Menu, X, Home, ChevronRight,
  ChevronLeft, Search, Settings, Command, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import Link from "next/link";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── PALETA ENTERPRISE ───
const INK = "#0A0E14";
const INK_2 = "#1F2937";
const MUTED = "#6B7280";
const SUBTLE = "#9CA3AF";
const LINE = "#E5E7EB";
const LINE_2 = "#F3F4F6";
const BG = "#FBFBFC";
const SURFACE = "#FFFFFF";
const ACCENT = "#2563EB";
const SUCCESS = "#059669";
const DANGER = "#DC2626";

const inputCls =
  "w-full bg-white text-[13.5px] rounded-md px-3 py-2.5 transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:outline-none border";

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════

function LoginScreen({
  email, setEmail, senha, setSenha, erroLogin, setErroLogin,
  loadingLogin, handleLogin,
}: any) {
  return (
    <div
      className={`${inter.className} min-h-screen flex items-center justify-center p-4`}
      style={{ background: BG }}
    >
      <div className="w-full max-w-[360px]">
        <div className="mb-8">
          <div className="relative w-28 h-12 mb-6">
            <Image src="/logop.png" alt="Logo" fill className="object-contain object-left" priority />
          </div>
          <h1
            className={`${jakarta.className} text-[22px] font-bold tracking-tight`}
            style={{ color: INK, letterSpacing: "-0.02em" }}
          >
            Aceder ao painel
          </h1>
          <p className="text-[13px] mt-1" style={{ color: MUTED }}>
            Credenciais de operador autorizado
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5"
              style={{ color: MUTED }}
            >
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErroLogin(""); }}
              className={inputCls}
              style={{ borderColor: LINE }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = INK;
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = LINE;
                e.currentTarget.style.boxShadow = "none";
              }}
              placeholder="admin@sagaturismo.com.br"
              required
              autoFocus
            />
          </div>

          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5"
              style={{ color: MUTED }}
            >
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => { setSenha(e.target.value); setErroLogin(""); }}
              className={inputCls}
              style={{ borderColor: LINE }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = INK;
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = LINE;
                e.currentTarget.style.boxShadow = "none";
              }}
              placeholder="••••••••"
              required
            />
          </div>

          {erroLogin && (
            <div
              className="rounded-md px-3 py-2.5 text-[12.5px] flex items-start gap-2"
              style={{ background: "#FEF2F2", border: "1px solid #FEE2E2", color: DANGER }}
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{erroLogin}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loadingLogin}
            className="w-full text-white font-semibold text-[13px] rounded-md py-2.5 flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-60 mt-4"
            style={{ background: INK }}
            onMouseEnter={(e) => !loadingLogin && (e.currentTarget.style.background = INK_2)}
            onMouseLeave={(e) => !loadingLogin && (e.currentTarget.style.background = INK)}
          >
            {loadingLogin ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                A validar...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <div
          className="mt-8 pt-5 border-t text-[11px] text-center"
          style={{ borderColor: LINE, color: SUBTLE }}
        >
          Acesso restrito · Portal SagaTurismo
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MENU
// ═══════════════════════════════════════════════════════════════

const MENU_GRUPOS = [
  {
    label: "Geral",
    items: [
      { href: "/portal-servicos", label: "Painel", icon: Home },
      { href: "/portal-servicos/noticias", label: "Notícias", icon: Newspaper },
      { href: "/portal-servicos/eventos", label: "Eventos", icon: CalendarIcon },
    ],
  },
  {
    label: "Inventário",
    items: [
      { href: "/portal-servicos/atracoes", label: "Atrativos", icon: MapPin },
      { href: "/portal-servicos/comunidades", label: "Comunidades", icon: Compass },
      { href: "/portal-servicos/hoteis", label: "Hotéis", icon: Building2 },
      { href: "/portal-servicos/gastronomia", label: "Gastronomia", icon: Utensils },
      { href: "/portal-servicos/agencias", label: "Agências", icon: Briefcase },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { href: "/portal-servicos/aplicativo", label: "Aplicativo", icon: Smartphone },
      { href: "/portal-servicos/newsletter", label: "Newsletter", icon: Bell },
      { href: "/portal-servicos/reunioes", label: "COMTUR", icon: FileText },
    ],
  },
];

const MENU_ADMIN = {
  label: "Administração",
  items: [
    { href: "/portal-servicos/emissao", label: "Emissão", icon: AlertCircle },
    { href: "/portal-servicos/suporte", label: "Suporte", icon: Headset },
    { href: "/portal-servicos/residentes", label: "Residentes", icon: Users },
  ],
};

// ═══════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [emailLogado, setEmailLogado] = useState("");
  const [loadingSessao, setLoadingSessao] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sidebar: collapsed = preferência fixada | hovered = temporário
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erroLogin, setErroLogin] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    verificarSessao();
    const saved = localStorage.getItem("sidebar:collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  // Persistir preferência fixada
  useEffect(() => {
    localStorage.setItem("sidebar:collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = () => setUserMenuOpen(false);
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [userMenuOpen]);

  // Cleanup do timeout
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, []);

  // ─── Handlers do hover ───
  const handleSidebarEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHovered(true);
  };

  const handleSidebarLeave = () => {
    // pequeno atraso para evitar flicker ao mover entre elementos internos
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setHovered(false);
    }, 180);
  };

  async function verificarSessao() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setRole("geral");
      setEmailLogado(session.user.email || "");
    }
    setLoadingSessao(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErroLogin("");
    setLoadingLogin(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw new Error("Credenciais inválidas. Verifique o e-mail e a senha.");
      setRole("geral");
      setEmailLogado(email);
      router.push("/portal-servicos");
    } catch (error: any) {
      setErroLogin(error.message);
    } finally {
      setLoadingLogin(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setEmailLogado("");
    router.push("/portal-servicos");
  };

  if (loadingSessao) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <Loader2 className="animate-spin" size={20} style={{ color: SUBTLE }} />
      </div>
    );
  }

  if (!role) {
    return (
      <LoginScreen
        email={email} setEmail={setEmail}
        senha={senha} setSenha={setSenha}
        erroLogin={erroLogin} setErroLogin={setErroLogin}
        loadingLogin={loadingLogin} handleLogin={handleLogin}
      />
    );
  }

  const isSuperAdmin =
    emailLogado === "emmanoel.cardoso09@gmail.com" ||
    emailLogado === "planejamentosaga@gmail.com";

  const grupos = isSuperAdmin ? [...MENU_GRUPOS, MENU_ADMIN] : MENU_GRUPOS;

  // Estado visual derivado:
  // - Se preferência = fixado expandido  → mostra expandido
  // - Se preferência = fixado colapsado  → colapsa, mas expande em hover
  const isExpanded = !collapsed || hovered;
  const sidebarWidth = isExpanded ? 244 : 68;

  const isActiveItem = (href: string) => {
    if (href === "/portal-servicos") return pathname === "/portal-servicos";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const userName = emailLogado.split("@")[0];

  return (
    <div className={inter.className} style={{ background: BG, color: INK }}>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .anim-fade { animation: fadeIn 150ms ease; }
        .anim-slide-up { animation: slideUp 150ms cubic-bezier(0.16, 1, 0.3, 1); }
        .scroll-thin::-webkit-scrollbar { width: 4px; }
        .scroll-thin::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 2px; }
        .scroll-thin::-webkit-scrollbar-track { background: transparent; }
        .sidebar-fade-in { animation: fadeIn 120ms ease; }
      `}</style>

      <div className="min-h-screen flex">

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SIDEBAR DESKTOP — auto-expand em hover                      */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <aside
          onMouseEnter={handleSidebarEnter}
          onMouseLeave={handleSidebarLeave}
          className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen"
          style={{
            width: sidebarWidth,
            background: SURFACE,
            borderRight: `1px solid ${LINE}`,
            // Transição suave, mas sem afetar o conteúdo do lado
            transition: "width 180ms cubic-bezier(0.32, 0.72, 0, 1)",
            // Elevação visual quando está a expandir em hover a partir de collapsed
            boxShadow: collapsed && hovered ? "4px 0 24px rgba(15,23,42,0.06)" : "none",
            zIndex: collapsed && hovered ? 20 : 1,
            willChange: "width",
          }}
        >
          {/* Logo + Collapse Toggle */}
          <div
            className="h-14 shrink-0 flex items-center border-b px-3 overflow-hidden"
            style={{ borderColor: LINE }}
          >
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-10 h-10 rounded-md flex items-center justify-center transition-colors shrink-0"
              style={{ color: MUTED }}
              onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              aria-label={collapsed ? "Fixar sidebar expandido" : "Fixar sidebar colapsado"}
              title={collapsed ? "Fixar expandido" : "Fixar colapsado"}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={15} />}
            </button>

            {/* Logo — só visível quando expandido */}
            <div
              className="relative ml-1 shrink-0 transition-opacity duration-150"
              style={{
                width: 96,
                height: 28,
                opacity: isExpanded ? 1 : 0,
                pointerEvents: isExpanded ? "auto" : "none",
              }}
            >
              <Image src="/logop.png" alt="Logo" fill className="object-contain object-left" priority />
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto scroll-thin overflow-x-hidden px-2 py-2">
            {grupos.map((grupo) => (
              <div key={grupo.label} className="mb-4">
                {/* Label do grupo — esconde em collapsed */}
                <div
                  className="overflow-hidden transition-all duration-150"
                  style={{
                    height: isExpanded ? "auto" : 0,
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div
                    className="px-2.5 py-1.5 text-[10px] font-bold uppercase whitespace-nowrap"
                    style={{ color: SUBTLE, letterSpacing: "0.09em" }}
                  >
                    {grupo.label}
                  </div>
                </div>

                {/* Divisor em collapsed */}
                {!isExpanded && (
                  <div className="h-px my-2 mx-2" style={{ background: LINE }} />
                )}

                <div className="space-y-0.5">
                  {grupo.items.map((item) => {
                    const Icone = item.icon;
                    const active = isActiveItem(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={!isExpanded ? item.label : undefined}
                        className="relative flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors"
                        style={{
                          color: active ? INK : MUTED,
                          background: active ? LINE_2 : "transparent",
                          justifyContent: !isExpanded ? "center" : "flex-start",
                          fontWeight: active ? 600 : 500,
                        }}
                        onMouseEnter={(e) => {
                          if (!active) e.currentTarget.style.background = LINE_2;
                          e.currentTarget.style.color = INK;
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = MUTED;
                          }
                        }}
                      >
                        {active && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r"
                            style={{ background: INK }}
                          />
                        )}
                        <Icone
                          size={15}
                          strokeWidth={active ? 2.5 : 2}
                          className="shrink-0"
                        />
                        <span
                          className="truncate flex-1 transition-opacity duration-150 whitespace-nowrap"
                          style={{
                            opacity: isExpanded ? 1 : 0,
                            width: isExpanded ? "auto" : 0,
                          }}
                        >
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer — user */}
          <div
            className="shrink-0 border-t relative overflow-hidden"
            style={{ borderColor: LINE }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen(!userMenuOpen);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-3 transition-colors"
              style={{ justifyContent: !isExpanded ? "center" : "flex-start" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div className="relative shrink-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
                  style={{ background: INK }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2"
                  style={{ background: SUCCESS, borderColor: SURFACE }}
                />
              </div>

              {/* Bloco de info do user — esconde quando collapsed */}
              <div
                className="min-w-0 flex-1 text-left overflow-hidden transition-opacity duration-150"
                style={{
                  opacity: isExpanded ? 1 : 0,
                  width: isExpanded ? "auto" : 0,
                }}
              >
                <p className="text-[12.5px] font-semibold truncate" style={{ color: INK }}>
                  {userName}
                </p>
                <p className="text-[10.5px] truncate" style={{ color: SUBTLE }}>
                  {emailLogado}
                </p>
              </div>

              <ChevronRight
                size={13}
                className="shrink-0 transition-transform"
                style={{
                  color: SUBTLE,
                  opacity: isExpanded ? 1 : 0,
                  transform: userMenuOpen ? "rotate(90deg)" : "none",
                }}
              />
            </button>

            {userMenuOpen && isExpanded && (
              <div
                className="absolute bottom-full left-3 right-3 mb-2 rounded-md overflow-hidden anim-slide-up sidebar-fade-in"
                style={{
                  background: SURFACE,
                  border: `1px solid ${LINE}`,
                  boxShadow: "0 4px 16px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12.5px] font-medium transition-colors"
                  style={{ color: DANGER }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  Terminar sessão
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* DRAWER MOBILE                                               */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {mobileMenuOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 z-40 anim-fade"
              style={{ background: "rgba(10,14,20,0.4)", backdropFilter: "blur(2px)" }}
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            <aside
              className="lg:hidden fixed top-0 bottom-0 left-0 z-50 w-[280px] max-w-[85vw] bg-white flex flex-col"
              style={{
                animation: "slideInLeft 220ms cubic-bezier(0.32, 0.72, 0, 1)",
                boxShadow: "0 0 40px rgba(10,14,20,0.15)",
              }}
            >
              <div
                className="h-14 shrink-0 flex items-center justify-between px-4 border-b"
                style={{ borderColor: LINE }}
              >
                <div className="relative w-24 h-7 shrink-0">
                  <Image src="/logop.png" alt="Logo" fill className="object-contain object-left" priority />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                  style={{ color: MUTED }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  aria-label="Fechar menu"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="shrink-0 px-4 py-3.5 border-b" style={{ borderColor: LINE }}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
                      style={{ background: INK }}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                      style={{ background: SUCCESS, borderColor: SURFACE }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold truncate" style={{ color: INK }}>
                      {userName}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: SUBTLE }}>
                      {emailLogado}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto scroll-thin px-2 py-3">
                {grupos.map((grupo) => (
                  <div key={grupo.label} className="mb-4">
                    <div
                      className="px-2.5 py-1.5 text-[10px] font-bold uppercase"
                      style={{ color: SUBTLE, letterSpacing: "0.09em" }}
                    >
                      {grupo.label}
                    </div>
                    <div className="space-y-0.5">
                      {grupo.items.map((item) => {
                        const Icone = item.icon;
                        const active = isActiveItem(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex items-center gap-2.5 px-2.5 py-2.5 rounded-md text-[13px] transition-colors"
                            style={{
                              color: active ? INK : MUTED,
                              background: active ? LINE_2 : "transparent",
                              fontWeight: active ? 600 : 500,
                            }}
                          >
                            {active && (
                              <span
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r"
                                style={{ background: INK }}
                              />
                            )}
                            <Icone size={16} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
                            <span className="truncate flex-1">{item.label}</span>
                            {active && (
                              <ChevronRight size={13} style={{ color: SUBTLE }} />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="shrink-0 p-3 border-t" style={{ borderColor: LINE }}>
                <button
                  onClick={handleLogout}
                  className="w-full text-[13px] font-medium px-3 py-2.5 rounded-md flex items-center gap-2.5 transition-colors"
                  style={{ color: MUTED }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#FEF2F2";
                    e.currentTarget.style.color = DANGER;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = MUTED;
                  }}
                >
                  <LogOut size={15} />
                  Terminar sessão
                </button>
              </div>
            </aside>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* CONTEÚDO                                                    */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="flex-1 min-w-0 flex flex-col">

          <header
            className="sticky top-0 z-30 shrink-0 border-b"
            style={{
              background: "rgba(251,251,252,0.85)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderColor: LINE,
            }}
          >
            <div className="h-14 px-4 sm:px-6 flex items-center gap-3">

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden w-9 h-9 -ml-2 rounded-md flex items-center justify-center transition-colors shrink-0"
                style={{ color: INK_2 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                aria-label="Abrir menu"
              >
                <Menu size={18} />
              </button>

              <nav className="flex items-center gap-1.5 text-[12.5px] min-w-0">
                <Link
                  href="/portal-servicos"
                  className="font-medium transition-colors hover:opacity-70 shrink-0"
                  style={{ color: MUTED }}
                >
                  Portal
                </Link>
                {pathname !== "/portal-servicos" && (
                  <>
                    <ChevronRight size={12} style={{ color: SUBTLE }} className="shrink-0" />
                    <span
                      className="font-semibold truncate capitalize"
                      style={{ color: INK }}
                    >
                      {pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ")}
                    </span>
                  </>
                )}
              </nav>

              <div className="flex-1" />

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex h-8 px-2.5 rounded-md items-center gap-1.5 text-[12px] font-medium transition-colors"
                  style={{ color: MUTED }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = LINE_2;
                    e.currentTarget.style.color = INK;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = MUTED;
                  }}
                >
                  Ver site
                  <ChevronRight size={11} className="rotate-[-90deg]" />
                </a>

                <div
                  className="hidden lg:block w-px h-5 mx-1"
                  style={{ background: LINE }}
                />

                <div className="lg:hidden relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserMenuOpen(!userMenuOpen);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                    style={{ background: INK }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-[220px] rounded-md overflow-hidden anim-slide-up z-50"
                      style={{
                        background: SURFACE,
                        border: `1px solid ${LINE}`,
                        boxShadow: "0 4px 16px rgba(15,23,42,0.08)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-2.5 border-b" style={{ borderColor: LINE }}>
                        <p className="text-[12.5px] font-semibold truncate" style={{ color: INK }}>
                          {userName}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: SUBTLE }}>
                          {emailLogado}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12.5px] font-medium transition-colors"
                        style={{ color: DANGER }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <LogOut size={14} />
                        Terminar sessão
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1280px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}