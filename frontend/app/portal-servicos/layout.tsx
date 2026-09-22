"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon, Bell, Activity, MapPin, Building2, Briefcase,
  Compass, Newspaper, Smartphone, FileText, Users, Headset,
  Utensils, AlertCircle, Lock, Mail, Loader2, ArrowRight, LogOut,
  Sparkles, Menu, X, Home, ChevronRight,
} from "lucide-react";
import Link from "next/link";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── Cores sólidas (sem gradientes no layout) ───
const AZUL = "#0078D4";
const AZUL_HOVER = "#0066B8";
const CINZA_FUNDO = "#FAFBFC";
const CINZA_BORDA = "#EAECEF";
const TEXTO = "#1A1A1A";
const TEXTO_MUTED = "#6B7280";
const VERDE = "#16A34A";
const VERMELHO = "#DC2626";

const inputCls =
  "w-full bg-white border border-[#E1E4E8] text-slate-900 text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15 transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400";

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════

function LoginScreen({
  email,
  setEmail,
  senha,
  setSenha,
  erroLogin,
  setErroLogin,
  loadingLogin,
  handleLogin,
}: any) {
  return (
    <div
      className={`${inter.className} min-h-screen flex items-center justify-center p-4`}
      style={{ background: CINZA_FUNDO }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <div className="relative w-32 h-16 mb-5">
            <Image src="/logop.png" alt="Logo" fill className="object-contain" priority />
          </div>
          <h1 className={`${jakarta.className} text-2xl font-bold text-slate-900 tracking-tight`}>
            CMS Institucional
          </h1>
          <p className="text-sm text-slate-500 mt-1">Portal SagaTurismo</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErroLogin("");
              }}
              className={inputCls}
              placeholder="admin@sagaturismo.com.br"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                setErroLogin("");
              }}
              className={inputCls}
              placeholder="••••••••"
              required
            />
          </div>

          {erroLogin && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {erroLogin}
            </div>
          )}

          <button
            type="submit"
            disabled={loadingLogin}
            className="w-full text-white font-medium text-sm rounded-lg py-3 flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-60 mt-2"
            style={{ background: loadingLogin ? "#5BA3E0" : AZUL }}
            onMouseEnter={(e) => !loadingLogin && (e.currentTarget.style.background = AZUL_HOVER)}
            onMouseLeave={(e) => !loadingLogin && (e.currentTarget.style.background = AZUL)}
          >
            {loadingLogin ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-8">
          Acesso restrito a operadores autorizados
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MENU
// ═══════════════════════════════════════════════════════════════

const MENU = [
  { href: "/portal-servicos", label: "Painel", icon: Home },
  { href: "/portal-servicos/noticias", label: "Notícias", icon: Newspaper },
  { href: "/portal-servicos/eventos", label: "Eventos", icon: CalendarIcon },
  { href: "/portal-servicos/atracoes", label: "Atrativos", icon: MapPin },
  { href: "/portal-servicos/comunidades", label: "Comunidades", icon: Compass },
  { href: "/portal-servicos/hoteis", label: "Hotéis", icon: Building2 },
  { href: "/portal-servicos/gastronomia", label: "Gastronomia", icon: Utensils },
  { href: "/portal-servicos/agencias", label: "Agências", icon: Briefcase },
  { href: "/portal-servicos/aplicativo", label: "Aplicativo", icon: Smartphone },
  { href: "/portal-servicos/newsletter", label: "Newsletter", icon: Bell },
  { href: "/portal-servicos/reunioes", label: "COMTUR", icon: FileText },
];

const MENU_ADMIN = [
  { href: "/portal-servicos/emissao", label: "Emissão", icon: AlertCircle },
  { href: "/portal-servicos/suporte", label: "Suporte", icon: Headset },
  { href: "/portal-servicos/residentes", label: "Residentes", icon: Users },
];

// ═══════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [emailLogado, setEmailLogado] = useState("");
  const [loadingSessao, setLoadingSessao] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erroLogin, setErroLogin] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    verificarSessao();
  }, []);

  // Fecha mobile ao mudar de rota
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Bloqueia scroll só quando mobile menu aberto
  useEffect(() => {
    if (!mobileMenuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  async function verificarSessao() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: CINZA_FUNDO }}
      >
        <Loader2 className="animate-spin text-slate-300" size={24} />
      </div>
    );
  }

  if (!role) {
    return (
      <LoginScreen
        email={email}
        setEmail={setEmail}
        senha={senha}
        setSenha={setSenha}
        erroLogin={erroLogin}
        setErroLogin={setErroLogin}
        loadingLogin={loadingLogin}
        handleLogin={handleLogin}
      />
    );
  }

  const isSuperAdmin =
    emailLogado === "emmanoel.cardoso09@gmail.com" ||
    emailLogado === "planejamentosaga@gmail.com";

  const menuCompleto = isSuperAdmin ? [...MENU, ...MENU_ADMIN] : MENU;

  return (
    <div className={inter.className} style={{ background: CINZA_FUNDO, color: TEXTO }}>
      <div className="min-h-screen flex flex-col">

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* HEADER — super limpo, sem blur, sem sombras                */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <header
          className="sticky top-0 z-30 bg-white"
          style={{ borderBottom: `1px solid ${CINZA_BORDA}` }}
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

            {/* Logo */}
            <Link href="/portal-servicos" className="relative w-24 h-7 shrink-0 hover:opacity-70 transition-opacity duration-150">
              <Image src="/logop.png" alt="Logo" fill className="object-contain object-left" priority />
            </Link>

            {/* Separador */}
            <div className="hidden lg:block w-px h-5 bg-slate-200" />

            {/* Menu horizontal desktop */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">
              {menuCompleto.map((item) => {
                const Icone = item.icon;
                const isActive =
                  item.href === "/portal-servicos"
                    ? pathname === "/portal-servicos"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-2 px-3 py-2 text-[13px] font-medium rounded-md whitespace-nowrap transition-colors duration-150 ${
                      isActive
                        ? "text-slate-900"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                    style={{
                      background: isActive ? "#F2F4F7" : "transparent",
                    }}
                  >
                    <Icone size={14} className="shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Hamburger mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-9 h-9 rounded-md flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors duration-150 shrink-0"
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>

            {/* Espaçador mobile */}
            <div className="flex-1 lg:hidden" />

            {/* Ações à direita */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Avatar compacto */}
              <div className="hidden md:flex items-center gap-2 pl-3 pr-1 mr-1 border-l border-slate-200">
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                    style={{ background: AZUL }}
                  >
                    {emailLogado.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{ background: VERDE }}
                  />
                </div>
                <span className="text-[12px] font-medium text-slate-700 truncate max-w-[120px]">
                  {emailLogado.split("@")[0]}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-150"
                title="Terminar sessão"
                aria-label="Terminar sessão"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* DRAWER MOBILE — minimalista                                 */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {mobileMenuOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 z-40 bg-black/30"
              style={{ animation: "fadeIn 150ms ease-out" }}
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            <aside
              className="lg:hidden fixed top-0 bottom-0 left-0 z-50 w-[280px] max-w-[85vw] bg-white flex flex-col"
              style={{
                animation: "slideIn 200ms cubic-bezier(0.32, 0.72, 0, 1)",
                boxShadow: "0 0 40px rgba(0,0,0,0.08)",
              }}
            >
              {/* Header */}
              <div
                className="shrink-0 px-4 h-14 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${CINZA_BORDA}` }}
              >
                <div className="relative w-24 h-7 shrink-0">
                  <Image src="/logop.png" alt="Logo" fill className="object-contain object-left" priority />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors duration-150"
                  aria-label="Fechar menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* User */}
              <div className="shrink-0 px-4 py-3 border-b" style={{ borderColor: CINZA_BORDA }}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      style={{ background: AZUL }}
                    >
                      {emailLogado.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ background: VERDE }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {emailLogado.split("@")[0]}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {emailLogado}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <nav className="flex-1 overflow-y-auto py-2">
                {menuCompleto.map((item) => {
                  const Icone = item.icon;
                  const isActive =
                    item.href === "/portal-servicos"
                      ? pathname === "/portal-servicos"
                      : pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 mx-2 px-3 py-2.5 text-sm rounded-md transition-colors duration-150 ${
                        isActive
                          ? "text-slate-900 font-semibold"
                          : "text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50"
                      }`}
                      style={{
                        background: isActive ? "#F2F4F7" : "transparent",
                      }}
                    >
                      <Icone size={16} className="shrink-0" />
                      <span className="truncate flex-1">{item.label}</span>
                      {isActive && (
                        <ChevronRight size={14} className="shrink-0 text-slate-400" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="shrink-0 p-3" style={{ borderTop: `1px solid ${CINZA_BORDA}` }}>
                <button
                  onClick={handleLogout}
                  className="w-full text-sm font-medium text-slate-600 hover:text-red-600 px-3 py-2.5 rounded-md flex items-center gap-2.5 transition-colors duration-150 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Terminar sessão
                </button>
              </div>
            </aside>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* MAIN                                                        */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>

      {/* Keyframes mínimos */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}