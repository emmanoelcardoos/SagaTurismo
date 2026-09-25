"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Calendar as CalendarIcon, Clock, MapPin, Building2, Utensils,
  Briefcase, Loader2, Sparkles, ArrowRight, Inbox, TrendingUp,
  Compass, Users, Headset, Mail, BadgeCheck, Activity,
  FileText, Notebook, Plus, RefreshCw, ArrowUpRight, ArrowDownRight,
  Circle, ChevronRight, Zap, Layers, Filter, CheckCircle2
} from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── PALETA ENTERPRISE (sóbria, funcional) ───
const INK = "#0A0E14";           // preto dominante
const INK_2 = "#1F2937";         // cinza escuro
const MUTED = "#6B7280";         // cinza médio
const SUBTLE = "#9CA3AF";        // cinza claro
const LINE = "#E5E7EB";          // borda neutra
const LINE_2 = "#F3F4F6";        // borda suave
const BG = "#FBFBFC";            // fundo quase branco
const SURFACE = "#FFFFFF";
const BRAND = "#0F172A";         // azul-preto (marca)
const ACCENT = "#2563EB";        // azul sinal
const SUCCESS = "#059669";
const WARNING = "#D97706";
const DANGER = "#DC2626";

// ═══════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════

function GlobalStyles() {
  return (
    <style jsx global>{`
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }
      @keyframes barGrow {
        from { transform: scaleY(0); }
        to { transform: scaleY(1); }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .fade-up { animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .dot-pulse { animation: pulse 2s ease-in-out infinite; }
      .bar-grow { animation: barGrow 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; transform-origin: bottom; }
      .skeleton {
        background: linear-gradient(90deg, ${LINE_2} 0%, ${LINE} 50%, ${LINE_2} 100%);
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
      }
      .num { font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
      .scroll-thin::-webkit-scrollbar { width: 6px; height: 6px; }
      .scroll-thin::-webkit-scrollbar-track { background: transparent; }
      .scroll-thin::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
      .scroll-thin::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════════
// ÁTOMOS DE DESIGN
// ═══════════════════════════════════════════════════════════════

/**
 * Painel — container base com borda rígida 1px.
 * Substitui os antigos "cards" com sombra e radius.
 */
function Panel({
  children,
  className = "",
  noPad = false,
}: {
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-lg overflow-hidden ${className}`}
      style={{ borderColor: LINE }}
    >
      {noPad ? children : <div className="p-5">{children}</div>}
    </div>
  );
}

/**
 * PanelHeader — cabeçalho de um painel. Linha divisória, título à esquerda, ação à direita.
 */
function PanelHeader({
  title,
  subtitle,
  action,
  badge,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="px-5 py-3.5 flex items-center justify-between gap-3 border-b"
      style={{ borderColor: LINE, background: BG }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
            {title}
          </h3>
          {badge}
        </div>
        {subtitle && (
          <p className="text-[11.5px] mt-0.5" style={{ color: MUTED }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * Metric — bloco de métrica. Sem ícone decorativo. Número enorme. Delta opcional.
 */
function Metric({
  label,
  value,
  unit,
  delta,
  deltaDir,
  href,
  delay = 0,
}: {
  label: string;
  value: number | string;
  unit?: string;
  delta?: string;
  deltaDir?: "up" | "down";
  href?: string;
  delay?: number;
}) {
  const inner = (
    <div
      className="relative px-4 py-3.5 hover:bg-[#FAFAFB] transition-colors group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: MUTED, letterSpacing: "0.08em" }}
        >
          {label}
        </span>
        {delta && (
          <span
            className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold num"
            style={{
              color: deltaDir === "up" ? SUCCESS : deltaDir === "down" ? DANGER : MUTED,
            }}
          >
            {deltaDir === "up" ? (
              <ArrowUpRight size={11} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={11} strokeWidth={2.5} />
            )}
            {delta}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <span
          className={`${jakarta.className} num text-[28px] font-bold leading-none`}
          style={{ color: INK }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[11px] font-medium" style={{ color: SUBTLE }}>
            {unit}
          </span>
        )}
      </div>

      {href && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: SUBTLE }}
        >
          <ChevronRight size={14} />
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block fade-up border-r last:border-r-0"
        style={{ borderColor: LINE }}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="fade-up border-r last:border-r-0" style={{ borderColor: LINE }}>
      {inner}
    </div>
  );
}

/**
 * StatusPill — estado em pílula discreta.
 */
function StatusPill({ children, tone }: { children: React.ReactNode; tone: "danger" | "warning" | "success" | "neutral" }) {
  const map = {
    danger: { c: DANGER, bg: "#FEF2F2", b: "#FEE2E2" },
    warning: { c: WARNING, bg: "#FFFBEB", b: "#FEF3C7" },
    success: { c: SUCCESS, bg: "#ECFDF5", b: "#D1FAE5" },
    neutral: { c: MUTED, bg: LINE_2, b: LINE },
  }[tone];

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: map.bg, color: map.c, border: `1px solid ${map.b}` }}
    >
      <Circle size={5} className="fill-current" />
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

export default function PortalDashboard() {
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState<any[]>([]);
  const [suportes, setSuportes] = useState<any[]>([]);
  const [residentesSemana, setResidentesSemana] = useState<any[]>([]);
  const [stats, setStats] = useState({
    atracoes: 0, hoteis: 0, restaurantes: 0, agencias: 0,
    comunidades: 0, eventos: 0, blog: 0, guias: 0,
    residentes: 0, residentesAtivos: 0, newsletter: 0,
  });
  const [suporteStats, setSuporteStats] = useState({
    total: 0, abertos: 0, andamento: 0, concluidos: 0,
  });
  const [agora, setAgora] = useState(new Date());

  useEffect(() => {
    carregarDashboard();
    const interval = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  async function carregarDashboard() {
    setLoading(true);
    const hoje = new Date();
    const daquiA7Dias = new Date();
    daquiA7Dias.setDate(hoje.getDate() + 7);
    const hojeIso = hoje.toISOString().split("T")[0];
    const daquiA7DiasIso = daquiA7Dias.toISOString().split("T")[0];

    const { data: eventosData } = await supabase
      .from("eventos")
      .select("titulo, data, local")
      .gte("data", hojeIso)
      .lte("data", daquiA7DiasIso)
      .order("data", { ascending: true });
    setEventos(eventosData || []);

    const { data: suportesData } = await supabase
      .from("suporte")
      .select("id, protocolo, nome, assunto, status, criado_em")
      .neq("status", "Concluído")
      .order("criado_em", { ascending: false })
      .limit(6);
    setSuportes(suportesData || []);

    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hoje.getDate() - 6);
    const { data: residentesData } = await supabase
      .from("rd_residentes")
      .select("id, status, criado_at")
      .gte("criado_at", seteDiasAtras.toISOString())
      .order("criado_at", { ascending: true });
    setResidentesSemana(residentesData || []);

    const counts = await Promise.all([
      supabase.from("atracoes").select("*", { count: "exact", head: true }),
      supabase.from("hoteis").select("*", { count: "exact", head: true }),
      supabase.from("gastronomia").select("*", { count: "exact", head: true }),
      supabase.from("agencias").select("*", { count: "exact", head: true }),
      supabase.from("comunidades").select("*", { count: "exact", head: true }),
      supabase.from("eventos").select("*", { count: "exact", head: true }),
      supabase.from("blog").select("*", { count: "exact", head: true }),
      supabase.from("guias_turisticos").select("*", { count: "exact", head: true }),
      supabase.from("rd_residentes").select("*", { count: "exact", head: true }),
      supabase.from("rd_residentes").select("*", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("newsletter_inscritos").select("*", { count: "exact", head: true }),
    ]);

    setStats({
      atracoes: counts[0].count || 0,
      hoteis: counts[1].count || 0,
      restaurantes: counts[2].count || 0,
      agencias: counts[3].count || 0,
      comunidades: counts[4].count || 0,
      eventos: counts[5].count || 0,
      blog: counts[6].count || 0,
      guias: counts[7].count || 0,
      residentes: counts[8].count || 0,
      residentesAtivos: counts[9].count || 0,
      newsletter: counts[10].count || 0,
    });

    const { data: suporteTotal } = await supabase.from("suporte").select("status");
    const all = suporteTotal || [];
    setSuporteStats({
      total: all.length,
      abertos: all.filter((s) => s.status === "Aberto").length,
      andamento: all.filter((s) => s.status === "Em andamento").length,
      concluidos: all.filter((s) => s.status === "Concluído").length,
    });

    setLoading(false);
  }

  const grafico = useMemo(() => {
    const dias: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3);
      const total = residentesSemana.filter((r) => r.criado_at?.split("T")[0] === iso).length;
      const ativos = residentesSemana.filter(
        (r) => r.criado_at?.split("T")[0] === iso && r.status === "ativo"
      ).length;
      dias.push({ label, iso, total, ativos });
    }
    const max = Math.max(...dias.map((d) => d.total), 1);
    const totalSemana = dias.reduce((a, d) => a + d.total, 0);
    const ativosSemana = dias.reduce((a, d) => a + d.ativos, 0);
    return { dias, max, totalSemana, ativosSemana };
  }, [residentesSemana]);

  const dataFormatada = agora.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });
  const horaFormatada = agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit",
  });

  const taxaAtivacao = stats.residentes > 0
    ? Math.round((stats.residentesAtivos / stats.residentes) * 100)
    : 0;
  const taxaSuporte = suporteStats.total > 0
    ? Math.round((suporteStats.concluidos / suporteStats.total) * 100)
    : 0;
  const suporteAberto = suporteStats.abertos + suporteStats.andamento;

  // ─── LOADING ───
  if (loading) {
    return (
      <>
        <GlobalStyles />
        <div className={`${inter.className} space-y-4`}>
          <div className="h-7 w-48 rounded skeleton" />
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: LINE }}>
            <div className="grid grid-cols-2 md:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 skeleton border-r" style={{ borderColor: LINE }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-72 rounded-lg skeleton" />
            <div className="h-72 rounded-lg skeleton" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-4`}>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* HEADER — linha única densa                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="flex items-end justify-between gap-4 fade-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                style={{ background: INK, color: "#FFF" }}
              >
                <Activity size={9} strokeWidth={3} />
                Painel
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {horaFormatada} · {dataFormatada}
              </span>
            </div>
            <h1
              className={`${jakarta.className} text-[26px] font-bold tracking-tight`}
              style={{ color: INK, letterSpacing: "-0.025em" }}
            >
              Visão geral
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={carregarDashboard}
              className="h-8 px-3 rounded-md text-[12px] font-semibold flex items-center gap-1.5 transition-colors border"
              style={{ borderColor: LINE, color: INK_2, background: "#FFF" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = BG)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFF")}
            >
              <RefreshCw size={12} strokeWidth={2.5} />
              Atualizar
            </button>
            <Link
              href="/portal-servicos/noticias"
              className="h-8 px-3 rounded-md text-[12px] font-semibold flex items-center gap-1.5 text-white transition-colors"
              style={{ background: INK }}
              onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
            >
              <Plus size={13} strokeWidth={3} />
              Nova matéria
            </Link>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BENTO PRINCIPAL — KPIs agrupados em painéis compactos       */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 fade-up" style={{ animationDelay: "40ms" }}>

          {/* Turismo & Trade — 5 métricas em linha */}
          <div className="lg:col-span-8">
            <Panel noPad>
              <PanelHeader
                title="Inventário turístico"
                subtitle="Recursos ativos no portal"
                badge={
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded num"
                    style={{ background: LINE_2, color: MUTED }}
                  >
                    {stats.atracoes + stats.hoteis + stats.restaurantes + stats.agencias + stats.comunidades}
                  </span>
                }
              />
              <div className="grid grid-cols-2 md:grid-cols-5">
                <Metric label="Atrativos" value={stats.atracoes} href="/portal-servicos/atracoes" />
                <Metric label="Hotéis" value={stats.hoteis} href="/portal-servicos/hoteis" />
                <Metric label="Restaurantes" value={stats.restaurantes} href="/portal-servicos/gastronomia" />
                <Metric label="Agências" value={stats.agencias} href="/portal-servicos/agencias" />
                <Metric label="Comunidades" value={stats.comunidades} href="/portal-servicos/comunidades" />
              </div>
            </Panel>
          </div>

          {/* Conteúdo — 3 métricas */}
          <div className="lg:col-span-4">
            <Panel noPad>
              <PanelHeader
                title="Conteúdo publicado"
                subtitle="Publicações digitais"
              />
              <div className="grid grid-cols-3">
                <Metric label="Blog" value={stats.blog} href="/portal-servicos/noticias" />
                <Metric label="Eventos" value={stats.eventos} href="/portal-servicos/eventos" />
                <Metric label="Guias" value={stats.guias} href="/portal-servicos/aplicativo" />
              </div>
            </Panel>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SERVIÇOS CRÍTICOS — 3 painéis com progresso                 */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-up" style={{ animationDelay: "80ms" }}>

          {/* Residentes */}
          <Panel noPad>
            <PanelHeader
              title="Residentes"
              subtitle="Carteiras emitidas"
              action={
                <Link
                  href="/portal-servicos/residentes"
                  className="text-[11px] font-semibold flex items-center gap-0.5 transition-opacity hover:opacity-70"
                  style={{ color: INK }}
                >
                  Gerir
                  <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
              }
            />
            <div className="p-5">
              <div className="flex items-baseline gap-2">
                <span
                  className={`${jakarta.className} num text-[40px] font-bold leading-none`}
                  style={{ color: INK, letterSpacing: "-0.03em" }}
                >
                  {stats.residentesAtivos}
                </span>
                <span className="text-[13px] font-medium num" style={{ color: SUBTLE }}>
                  / {stats.residentes}
                </span>
              </div>
              <p className="text-[11.5px] mt-1" style={{ color: MUTED }}>
                carteiras ativas de {stats.residentes} emitidas
              </p>

              <div className="mt-4 pt-4 border-t" style={{ borderColor: LINE_2 }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
                    Taxa de ativação
                  </span>
                  <span className={`${jakarta.className} num text-[12px] font-bold`} style={{ color: INK }}>
                    {taxaAtivacao}%
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: LINE_2 }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${taxaAtivacao}%`, background: INK }}
                  />
                </div>
              </div>
            </div>
          </Panel>

          {/* Suporte */}
          <Panel noPad>
            <PanelHeader
              title="Suporte"
              subtitle="Fila de atendimento"
              action={
                <Link
                  href="/portal-servicos/suporte"
                  className="text-[11px] font-semibold flex items-center gap-0.5 transition-opacity hover:opacity-70"
                  style={{ color: INK }}
                >
                  Gerir
                  <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
              }
            />
            <div className="p-5">
              <div className="flex items-baseline gap-2">
                <span
                  className={`${jakarta.className} num text-[40px] font-bold leading-none`}
                  style={{ color: suporteAberto > 0 ? INK : SUBTLE, letterSpacing: "-0.03em" }}
                >
                  {suporteAberto}
                </span>
                <span className="text-[13px] font-medium num" style={{ color: SUBTLE }}>
                  / {suporteStats.total}
                </span>
              </div>
              <p className="text-[11.5px] mt-1" style={{ color: MUTED }}>
                chamados ativos de {suporteStats.total} totais
              </p>

              <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: LINE_2 }}>
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="flex items-center gap-1.5 font-medium" style={{ color: MUTED }}>
                    <Circle size={6} className="fill-current" style={{ color: DANGER }} />
                    Abertos
                  </span>
                  <span className={`${jakarta.className} num font-bold`} style={{ color: INK }}>
                    {suporteStats.abertos}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="flex items-center gap-1.5 font-medium" style={{ color: MUTED }}>
                    <Circle size={6} className="fill-current" style={{ color: WARNING }} />
                    Em curso
                  </span>
                  <span className={`${jakarta.className} num font-bold`} style={{ color: INK }}>
                    {suporteStats.andamento}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="flex items-center gap-1.5 font-medium" style={{ color: MUTED }}>
                    <Circle size={6} className="fill-current" style={{ color: SUCCESS }} />
                    Concluídos
                  </span>
                  <span className={`${jakarta.className} num font-bold`} style={{ color: INK }}>
                    {suporteStats.concluidos}
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Newsletter */}
          <Panel noPad>
            <PanelHeader
              title="Newsletter"
              subtitle="Base de subscritores"
              action={
                <Link
                  href="/portal-servicos/newsletter"
                  className="text-[11px] font-semibold flex items-center gap-0.5 transition-opacity hover:opacity-70"
                  style={{ color: INK }}
                >
                  Gerir
                  <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
              }
            />
            <div className="p-5">
              <div className="flex items-baseline gap-2">
                <span
                  className={`${jakarta.className} num text-[40px] font-bold leading-none`}
                  style={{ color: INK, letterSpacing: "-0.03em" }}
                >
                  {stats.newsletter}
                </span>
              </div>
              <p className="text-[11.5px] mt-1" style={{ color: MUTED }}>
                emails capturados
              </p>

              <div className="mt-4 pt-4 border-t" style={{ borderColor: LINE_2 }}>
                <div className="flex items-start gap-2 text-[11.5px] leading-relaxed" style={{ color: MUTED }}>
                  <Sparkles size={12} className="mt-0.5 shrink-0" style={{ color: SUBTLE }} />
                  <span>Prontos para receber campanhas segmentadas</span>
                </div>
                <Link
                  href="/portal-servicos/newsletter"
                  className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold transition-opacity hover:opacity-70"
                  style={{ color: INK }}
                >
                  Compor campanha
                  <ArrowRight size={12} strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          </Panel>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* GRÁFICO + FILA DE SUPORTE                                    */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 fade-up" style={{ animationDelay: "120ms" }}>

          {/* Gráfico */}
          <div className="lg:col-span-8">
            <Panel noPad>
              <PanelHeader
                title="Novos registos de residentes"
                subtitle="Atividade diária nos últimos 7 dias"
                badge={
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded num"
                    style={{ background: LINE_2, color: MUTED }}
                  >
                    7d
                  </span>
                }
                action={
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`${jakarta.className} num text-[14px] font-bold leading-none`} style={{ color: INK }}>
                        {grafico.totalSemana}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: SUBTLE }}>
                        registos
                      </div>
                    </div>
                    <div className="w-px h-7" style={{ background: LINE }} />
                    <div className="text-right">
                      <div className={`${jakarta.className} num text-[14px] font-bold leading-none`} style={{ color: SUCCESS }}>
                        {grafico.ativosSemana}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: SUBTLE }}>
                        ativos
                      </div>
                    </div>
                  </div>
                }
              />

              <div className="p-5">
                {residentesSemana.length === 0 ? (
                  <div className="py-14 text-center">
                    <div
                      className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                      style={{ background: LINE_2, color: MUTED }}
                    >
                      <TrendingUp size={20} strokeWidth={2} />
                    </div>
                    <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                      Sem atividade esta semana
                    </p>
                    <p className="text-[11.5px] mt-1" style={{ color: MUTED }}>
                      Nenhum residente se registou nos últimos 7 dias.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="h-44 flex items-end gap-1.5">
                      {grafico.dias.map((dia, idx) => {
                        const h = (dia.total / grafico.max) * 100;
                        const hA = dia.total > 0 ? (dia.ativos / dia.total) * 100 : 0;
                        return (
                          <div key={dia.iso} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="w-full relative flex flex-col justify-end h-36">
                              {dia.total > 0 ? (
                                <div
                                  className="w-full rounded-sm relative bar-grow"
                                  style={{
                                    height: `${Math.max(h, 6)}%`,
                                    background: INK,
                                    animationDelay: `${idx * 50}ms`,
                                  }}
                                >
                                  <span
                                    className={`${jakarta.className} num absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold`}
                                    style={{ color: INK }}
                                  >
                                    {dia.total}
                                  </span>
                                  {dia.ativos > 0 && (
                                    <div
                                      className="absolute bottom-0 left-0 right-0 rounded-sm bar-grow"
                                      style={{
                                        height: `${hA}%`,
                                        background: SUCCESS,
                                        animationDelay: `${idx * 50 + 80}ms`,
                                      }}
                                    />
                                  )}
                                </div>
                              ) : (
                                <div className="w-full h-[2px] rounded-sm" style={{ background: LINE }} />
                              )}
                            </div>
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wider"
                              style={{ color: MUTED }}
                            >
                              {dia.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div
                      className="mt-5 pt-4 border-t flex items-center gap-5 flex-wrap"
                      style={{ borderColor: LINE_2 }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: INK }} />
                        <span className="text-[11px] font-medium" style={{ color: MUTED }}>
                          Total de registos
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: SUCCESS }} />
                        <span className="text-[11px] font-medium" style={{ color: MUTED }}>
                          Ativados
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Panel>
          </div>

          {/* Fila de suporte */}
          <div className="lg:col-span-4">
            <Panel noPad className="h-full flex flex-col">
              <PanelHeader
                title="Fila de suporte"
                subtitle={`${suportes.length} pendentes`}
                action={
                  <Link
                    href="/portal-servicos/suporte"
                    className="text-[11px] font-semibold flex items-center gap-0.5 transition-opacity hover:opacity-70"
                    style={{ color: INK }}
                  >
                    Ver todos
                    <ChevronRight size={12} strokeWidth={2.5} />
                  </Link>
                }
              />

              {suportes.length === 0 ? (
                <div className="py-14 px-6 text-center flex-1 flex flex-col items-center justify-center">
                  <div
                    className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                    style={{ background: "#ECFDF5", color: SUCCESS }}
                  >
                    <CheckCircle2 size={20} strokeWidth={2} />
                  </div>
                  <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                    Fila limpa
                  </p>
                  <p className="text-[11.5px] mt-1" style={{ color: MUTED }}>
                    Nenhum chamado pendente.
                  </p>
                </div>
              ) : (
                <div className="divide-y flex-1 overflow-y-auto scroll-thin" style={{ borderColor: LINE_2 }}>
                  {suportes.map((s, idx) => {
                    const tone = s.status === "Aberto" ? "danger" : "warning";
                    return (
                      <Link
                        key={s.id}
                        href="/portal-servicos/suporte"
                        className="block px-4 py-3 hover:bg-[#FAFAFB] transition-colors group"
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <StatusPill tone={tone as any}>{s.status}</StatusPill>
                          <span className="text-[10px] font-mono num truncate" style={{ color: SUBTLE }}>
                            {s.protocolo}
                          </span>
                        </div>
                        <p className="text-[12.5px] font-semibold truncate" style={{ color: INK }}>
                          {s.assunto}
                        </p>
                        <p className="text-[11px] truncate flex items-center gap-1 mt-0.5" style={{ color: MUTED }}>
                          <Users size={10} />
                          {s.nome}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* AGENDA                                                       */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="fade-up" style={{ animationDelay: "160ms" }}>
          <Panel noPad>
            <PanelHeader
              title="Agenda municipal"
              subtitle={`${eventos.length} eventos nos próximos 7 dias`}
              action={
                <Link
                  href="/portal-servicos/eventos"
                  className="text-[11px] font-semibold flex items-center gap-0.5 transition-opacity hover:opacity-70"
                  style={{ color: INK }}
                >
                  Ver agenda
                  <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
              }
            />

            {eventos.length === 0 ? (
              <div className="py-14 text-center">
                <div
                  className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                  style={{ background: LINE_2, color: MUTED }}
                >
                  <Inbox size={20} strokeWidth={2} />
                </div>
                <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                  Agenda livre
                </p>
                <p className="text-[11.5px] mt-1" style={{ color: MUTED }}>
                  Nenhum evento programado para esta semana.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: LINE_2 }}>
                {eventos.map((ev, idx) => {
                  const [, , dia] = ev.data.split("-");
                  const mes = new Date(ev.data)
                    .toLocaleString("pt-BR", { month: "short" })
                    .replace(".", "")
                    .toUpperCase();
                  return (
                    <Link
                      key={idx}
                      href="/portal-servicos/eventos"
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAFB] transition-colors group"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* Data */}
                      <div
                        className="w-12 h-12 rounded-md flex flex-col items-center justify-center shrink-0"
                        style={{ background: INK, color: "#FFF" }}
                      >
                        <span className="text-[9px] font-bold tracking-wider leading-none mb-0.5 opacity-70">
                          {mes}
                        </span>
                        <span className={`${jakarta.className} num text-[15px] font-bold leading-none`}>
                          {dia}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: INK }}>
                          {ev.titulo}
                        </p>
                        <p className="text-[11.5px] flex items-center gap-1.5 mt-0.5 truncate" style={{ color: MUTED }}>
                          <MapPin size={11} className="shrink-0" />
                          <span className="truncate">{ev.local}</span>
                        </p>
                      </div>

                      <ArrowRight
                        size={15}
                        className="shrink-0 transition-all group-hover:translate-x-0.5"
                        style={{ color: SUBTLE }}
                      />
                    </Link>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* AÇÕES RÁPIDAS — barra horizontal compacta                    */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="fade-up" style={{ animationDelay: "200ms" }}>
          <Panel noPad>
            <PanelHeader title="Ações rápidas" subtitle="Fluxos mais frequentes" />
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0" style={{ borderColor: LINE_2 }}>
              {[
                { href: "/portal-servicos/noticias", label: "Nova matéria", hint: "Publicar no blog", icon: FileText },
                { href: "/portal-servicos/eventos", label: "Novo evento", hint: "Adicionar à agenda", icon: CalendarIcon },
                { href: "/portal-servicos/atracoes", label: "Novo atrativo", hint: "Vitrine turística", icon: MapPin },
                { href: "/portal-servicos/emissao", label: "Emitir carteira", hint: "Registo de residente", icon: BadgeCheck },
              ].map((a, i) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="group p-4 flex items-center gap-3 hover:bg-[#FAFAFB] transition-colors"
                    style={{ borderColor: LINE_2, animationDelay: `${i * 30}ms` }}
                  >
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors"
                      style={{ background: LINE_2, color: INK_2 }}
                    >
                      <Icon size={14} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold truncate" style={{ color: INK }}>
                        {a.label}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: MUTED }}>
                        {a.hint}
                      </p>
                    </div>
                    <Plus
                      size={13}
                      strokeWidth={2.5}
                      className="shrink-0 transition-colors"
                      style={{ color: SUBTLE }}
                    />
                  </Link>
                );
              })}
            </div>
          </Panel>
        </div>

      </div>
    </>
  );
}