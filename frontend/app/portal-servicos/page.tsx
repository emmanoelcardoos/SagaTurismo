"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Calendar as CalendarIcon, Clock, MapPin, Building2, Utensils,
  Briefcase, Loader2, Sparkles, ArrowRight, Inbox, TrendingUp,
  Target, Compass, Coffee, Users, Users2, Headset, MessageSquare,
  Mail, BadgeCheck, Activity, Layers, Eye, ChevronRight, Zap,
  AlertTriangle, CheckCircle2, Circle, BarChart3, PieChart,
  FileText, Notebook, PlusCircle, Star,
} from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── CORES (paleta Azure/Microsoft) ───
const AZUL = "#0078D4";
const AZUL_ESCURO = "#005A9E";
const AMBAR = "#DAA520";
const AMBAR_LIGHT = "#FBBF24";
const VERMELHO = "#D13438";
const VERDE = "#168821";
const VERDE_LIGHT = "#22C55E";
const ROXO = "#7C3AED";

// ═══════════════════════════════════════════════════════════════
// ESTILOS GLOBAIS
// ═══════════════════════════════════════════════════════════════

function GlobalStyles() {
  return (
    <style jsx global>{`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes pulseDot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.85); }
      }
      @keyframes growBar {
        from { transform: scaleY(0); }
        to { transform: scaleY(1); }
      }
      .anim-fade-up { animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .anim-fade { animation: fadeIn 0.25s ease both; }
      .pulse-dot { animation: pulseDot 1.8s ease-in-out infinite; }
      .grow-bar { animation: growBar 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; transform-origin: bottom; }
      .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
      .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
      .scrollbar-thin::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
      .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════════════════

function StatCard({
  titulo,
  valor,
  subtitulo,
  cor,
  gradient,
  icone,
  href,
  delay = 0,
}: {
  titulo: string;
  valor: number;
  subtitulo: string;
  cor: string;
  gradient: string;
  icone: React.ReactNode;
  href?: string;
  delay?: number;
}) {
  const content = (
    <>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: gradient }} />
      <div
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl"
        style={{ background: cor }}
      />
      <div className="relative flex items-center gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 transition-transform group-hover:scale-105"
          style={{ background: gradient }}
        >
          {icone}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-tight">
          {titulo}
        </span>
      </div>
      <p
        className={`${jakarta.className} relative text-3xl font-extrabold leading-none tracking-tight`}
        style={{ color: valor > 0 ? cor : "#94A3B8" }}
      >
        {valor}
      </p>
      <p className="relative text-[10px] text-slate-400 mt-2 font-medium">
        {subtitulo}
      </p>
      {href && (
        <div className="relative mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cor }}>
            Gerir
          </span>
          <ChevronRight
            size={13}
            className="group-hover:translate-x-0.5 transition-transform"
            style={{ color: cor }}
          />
        </div>
      )}
    </>
  );

  const Wrapper: any = href ? Link : "div";

  return (
    <Wrapper
      {...(href ? { href } : {})}
      style={{ animationDelay: `${delay}ms` }}
      className="relative bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group anim-fade-up block"
    >
      {content}
    </Wrapper>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA
// ═══════════════════════════════════════════════════════════════

export default function PortalDashboard() {
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState<any[]>([]);
  const [suportes, setSuportes] = useState<any[]>([]);
  const [residentesSemana, setResidentesSemana] = useState<any[]>([]);
  const [stats, setStats] = useState({
    atracoes: 0,
    hoteis: 0,
    restaurantes: 0,
    agencias: 0,
    comunidades: 0,
    eventos: 0,
    blog: 0,
    guias: 0,
    residentes: 0,
    residentesAtivos: 0,
    newsletter: 0,
  });
  const [suporteStats, setSuporteStats] = useState({
    total: 0,
    abertos: 0,
    andamento: 0,
    concluidos: 0,
  });

  const [agora, setAgora] = useState(new Date());

  useEffect(() => {
    carregarDashboard();

    // Atualiza a hora a cada 60s
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

    // Eventos próximos 7 dias
    const { data: eventosData } = await supabase
      .from("eventos")
      .select("titulo, data, local")
      .gte("data", hojeIso)
      .lte("data", daquiA7DiasIso)
      .order("data", { ascending: true });

    setEventos(eventosData || []);

    // Suportes em aberto
    const { data: suportesData } = await supabase
      .from("suporte")
      .select("id, protocolo, nome, assunto, status, criado_em")
      .neq("status", "Concluído")
      .order("criado_em", { ascending: false })
      .limit(5);

    setSuportes(suportesData || []);

    // Residentes da última semana (para o gráfico)
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hoje.getDate() - 6);
    const seteDiasIso = seteDiasAtras.toISOString();

    const { data: residentesData } = await supabase
      .from("rd_residentes")
      .select("id, status, criado_at")
      .gte("criado_at", seteDiasIso)
      .order("criado_at", { ascending: true });

    setResidentesSemana(residentesData || []);

    // ─── CONTAGENS ───
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
      supabase
        .from("rd_residentes")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo"),
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

    // ─── SUPORTE STATS ───
    const { data: suporteTotal } = await supabase
      .from("suporte")
      .select("status");
    const allSuporte = suporteTotal || [];

    setSuporteStats({
      total: allSuporte.length,
      abertos: allSuporte.filter((s) => s.status === "Aberto").length,
      andamento: allSuporte.filter((s) => s.status === "Em andamento").length,
      concluidos: allSuporte.filter((s) => s.status === "Concluído").length,
    });

    setLoading(false);
  }

  // ─── GRÁFICO: últimos 7 dias de residentes ───
  const graficoResidentes = useMemo(() => {
    const dias: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3);

      const total = residentesSemana.filter(
        (r) => r.criado_at?.split("T")[0] === iso
      ).length;
      const ativos = residentesSemana.filter(
        (r) => r.criado_at?.split("T")[0] === iso && r.status === "ativo"
      ).length;

      dias.push({ label, iso, total, ativos });
    }
    const max = Math.max(...dias.map((d) => d.total), 1);
    return { dias, max };
  }, [residentesSemana]);

  const dataFormatada = agora.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const horaFormatada = agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // ─── LOADING ───
  if (loading) {
    return (
      <>
        <GlobalStyles />
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
          >
            <Loader2 size={22} className="animate-spin" />
          </div>
          <p className="text-xs text-slate-400 font-medium">
            A carregar painel geral...
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-6`}>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* CABEÇALHO                                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 anim-fade-up">
          <div>
            <h1 className={`${jakarta.className} text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight`}>
              Visão geral
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
              <Compass size={14} style={{ color: AZUL }} />
              Estado consolidado do portal — conteúdo, agenda e atendimento.
            </p>
          </div>

          {/* Data/hora */}
          <div
            className="self-start sm:self-auto inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${AZUL}06, ${AZUL}02)`,
              borderColor: `${AZUL}20`,
            }}
          >
            <div className="relative">
              <Clock size={15} style={{ color: AZUL }} />
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full pulse-dot"
                style={{ background: VERDE_LIGHT }}
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                {horaFormatada}
              </span>
              <span className="text-[10px] text-slate-500 capitalize">
                {dataFormatada}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* KPIs PRINCIPAIS (Turismo & Trade)                          */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <StatCard
            titulo="Atrativos"
            valor={stats.atracoes}
            subtitulo="pontos turísticos"
            cor={AZUL}
            gradient={`linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`}
            icone={<MapPin size={15} />}
            href="/portal-servicos/atracoes"
            delay={0}
          />
          <StatCard
            titulo="Hotéis"
            valor={stats.hoteis}
            subtitulo="alojamentos registrados"
            cor={AMBAR}
            gradient={`linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`}
            icone={<Building2 size={15} />}
            href="/portal-servicos/hoteis"
            delay={60}
          />
          <StatCard
            titulo="Restaurantes"
            valor={stats.restaurantes}
            subtitulo="gastronomia local"
            cor={VERDE}
            gradient={`linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`}
            icone={<Utensils size={15} />}
            href="/portal-servicos/gastronomia"
            delay={120}
          />
          <StatCard
            titulo="Agências"
            valor={stats.agencias}
            subtitulo="operadores turísticos"
            cor={VERMELHO}
            gradient={`linear-gradient(135deg, ${VERMELHO}, #F87171)`}
            icone={<Briefcase size={15} />}
            href="/portal-servicos/agencias"
            delay={180}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* KPIs SECUNDÁRIOS (Conteúdo + Serviços)                     */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <StatCard
            titulo="Comunidades"
            valor={stats.comunidades}
            subtitulo="registros no portal"
            cor={ROXO}
            gradient={`linear-gradient(135deg, ${ROXO}, #A78BFA)`}
            icone={<Users size={15} />}
            href="/portal-servicos/comunidades"
            delay={0}
          />
          <StatCard
            titulo="Eventos"
            valor={stats.eventos}
            subtitulo="no calendário municipal"
            cor={AMBAR}
            gradient={`linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`}
            icone={<CalendarIcon size={15} />}
            href="/portal-servicos/eventos"
            delay={60}
          />
          <StatCard
            titulo="Blog / Notícias"
            valor={stats.blog}
            subtitulo="matérias publicadas"
            cor={AZUL}
            gradient={`linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`}
            icone={<FileText size={15} />}
            href="/portal-servicos/noticias"
            delay={120}
          />
          <StatCard
            titulo="Guias PDF"
            valor={stats.guias}
            subtitulo="materiais digitais"
            cor="#0284C7"
            gradient={`linear-gradient(135deg, #0284C7, #38BDF8)`}
            icone={<Notebook size={15} />}
            href="/portal-servicos/aplicativo"
            delay={180}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* KPIs DE SERVIÇOS CRÍTICOS (Residentes + Suporte + Newsletter) */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">

          {/* Residentes Ativos */}
          <Link
            href="/portal-servicos/residentes"
            className="relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 anim-fade-up group block"
          >
            <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})` }} />

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 transition-transform group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                  >
                    <BadgeCheck size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Residentes
                    </p>
                    <p className={`${jakarta.className} text-sm font-bold text-slate-800 mt-0.5`}>
                      Carteiras ativas
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
                />
              </div>

              <div className="flex items-baseline gap-2">
                <p
                  className={`${jakarta.className} text-4xl font-extrabold leading-none tracking-tight`}
                  style={{ color: AZUL }}
                >
                  {stats.residentesAtivos}
                </p>
                <span className="text-xs font-bold text-slate-400">
                  / {stats.residentes} total
                </span>
              </div>

              {/* Barra de progresso */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Taxa de ativação
                  </span>
                  <span className={`${jakarta.className} text-[11px] font-bold`} style={{ color: AZUL }}>
                    {stats.residentes > 0
                      ? Math.round((stats.residentesAtivos / stats.residentes) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${
                        stats.residentes > 0
                          ? (stats.residentesAtivos / stats.residentes) * 100
                          : 0
                      }%`,
                      background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Link>

          {/* Suporte em aberto */}
          <Link
            href="/portal-servicos/suporte"
            className="relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 anim-fade-up group block"
            style={{ animationDelay: "60ms" }}
          >
            <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${VERMELHO}, #F87171)` }} />

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 transition-transform group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${VERMELHO}, #F87171)` }}
                  >
                    <Headset size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Suporte
                    </p>
                    <p className={`${jakarta.className} text-sm font-bold text-slate-800 mt-0.5`}>
                      Chamados em aberto
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
                />
              </div>

              <div className="flex items-baseline gap-2">
                <p
                  className={`${jakarta.className} text-4xl font-extrabold leading-none tracking-tight`}
                  style={{
                    color:
                      suporteStats.abertos + suporteStats.andamento > 0
                        ? VERMELHO
                        : "#94A3B8",
                  }}
                >
                  {suporteStats.abertos + suporteStats.andamento}
                </p>
                <span className="text-xs font-bold text-slate-400">
                  / {suporteStats.total} total
                </span>
              </div>

              {/* Distribuição por status */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Circle size={8} style={{ color: VERMELHO }} className="fill-current" />
                    Abertos
                  </span>
                  <span className={`${jakarta.className} font-bold`} style={{ color: VERMELHO }}>
                    {suporteStats.abertos}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Circle size={8} style={{ color: AMBAR }} className="fill-current" />
                    Em andamento
                  </span>
                  <span className={`${jakarta.className} font-bold`} style={{ color: AMBAR }}>
                    {suporteStats.andamento}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Circle size={8} style={{ color: VERDE }} className="fill-current" />
                    Concluídos
                  </span>
                  <span className={`${jakarta.className} font-bold`} style={{ color: VERDE }}>
                    {suporteStats.concluidos}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Newsletter */}
          <Link
            href="/portal-servicos/newsletter"
            className="relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 anim-fade-up group block"
            style={{ animationDelay: "120ms" }}
          >
            <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AMBAR}, ${AMBAR_LIGHT})` }} />

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 transition-transform group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
                  >
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Newsletter
                    </p>
                    <p className={`${jakarta.className} text-sm font-bold text-slate-800 mt-0.5`}>
                      Inscritos na base
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
                />
              </div>

              <p
                className={`${jakarta.className} text-4xl font-extrabold leading-none tracking-tight`}
                style={{ color: stats.newsletter > 0 ? AMBAR : "#94A3B8" }}
              >
                {stats.newsletter}
              </p>

              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                emails capturados
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-1.5">
                  <Sparkles size={11} style={{ color: AMBAR }} className="mt-0.5 shrink-0" />
                  Prontos para receber campanhas por e-mail
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* GRELHA PRINCIPAL: Gráfico + Fila                            */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Gráfico: últimos 7 dias */
          }
          <div className="lg:col-span-2">
            <div
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm anim-fade-up"
              style={{ animationDelay: "180ms" }}
            >
              <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})` }} />

              {/* Header */}
              <div
                className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
                style={{ background: `linear-gradient(135deg, ${AZUL}06, ${AZUL}02)` }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                >
                  <BarChart3 size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`${jakarta.className} text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap`}>
                    Novos registros de residentes
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        background: `${AZUL}10`,
                        color: AZUL,
                        borderColor: `${AZUL}25`,
                      }}
                    >
                      Últimos 7 dias
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Total de novos cidadãos por dia · {residentesSemana.length} na semana
                  </p>
                </div>
              </div>

              {/* Gráfico */}
              <div className="p-5">
                {residentesSemana.length === 0 ? (
                  <div className="py-12 text-center">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm text-white"
                      style={{
                        background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                      }}
                    >
                      <TrendingUp size={24} />
                    </div>
                    <p className={`${jakarta.className} text-sm font-bold text-slate-700 mb-1`}>
                      Sem atividade esta semana
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Nenhum residente se registrou nos últimos 7 dias.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="h-56 flex items-end gap-2 sm:gap-3">
                      {graficoResidentes.dias.map((dia, idx) => {
                        const altura = (dia.total / graficoResidentes.max) * 100;
                        const alturaAtivos = (dia.ativos / graficoResidentes.max) * 100;
                        return (
                          <div
                            key={dia.iso}
                            className="flex-1 flex flex-col items-center gap-2 group"
                          >
                            {/* Barra */}
                            <div className="w-full relative flex flex-col justify-end h-40">
                              {dia.total > 0 ? (
                                <>
                                  {/* Barra total */}
                                  <div
                                    className="w-full rounded-t-lg relative grow-bar"
                                    style={{
                                      height: `${Math.max(altura, 8)}%`,
                                      background: `linear-gradient(180deg, ${AZUL}, ${AZUL_ESCURO})`,
                                      animationDelay: `${idx * 60}ms`,
                                      boxShadow: `0 2px 8px ${AZUL}30`,
                                    }}
                                  >
                                    <span
                                      className={`${jakarta.className} absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold`}
                                      style={{ color: AZUL }}
                                    >
                                      {dia.total}
                                    </span>
                                    {/* Barra ativos (overlay) */}
                                    {dia.ativos > 0 && (
                                      <div
                                        className="absolute bottom-0 left-0 right-0 rounded-t-lg grow-bar"
                                        style={{
                                          height: `${
                                            dia.total > 0
                                              ? (dia.ativos / dia.total) * 100
                                              : 0
                                          }%`,
                                          background: `linear-gradient(180deg, ${VERDE}, ${VERDE_LIGHT})`,
                                          animationDelay: `${idx * 60 + 100}ms`,
                                        }}
                                      />
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-1 rounded-t-lg bg-slate-100" />
                              )}
                            </div>

                            {/* Label */}
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              {dia.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Legenda */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-5 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{
                            background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                          }}
                        />
                        <span className="text-[11px] font-bold text-slate-600">
                          Total de novos registros
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{
                            background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`,
                          }}
                        />
                        <span className="text-[11px] font-bold text-slate-600">
                          Já ativados (pagos)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fila de Suporte em Aberto */}
          <div>
            <div
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm h-full anim-fade-up"
              style={{ animationDelay: "240ms" }}
            >
              <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${VERMELHO}, #F87171)` }} />

              {/* Header */}
              <div
                className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
                style={{ background: `linear-gradient(135deg, ${VERMELHO}06, ${VERMELHO}02)` }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ background: `linear-gradient(135deg, ${VERMELHO}, #F87171)` }}
                >
                  <Headset size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                    Suportes abertos
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Aguardando resposta
                  </p>
                </div>
                <Link
                  href="/portal-servicos/suporte"
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg transition-colors shrink-0"
                  style={{ color: VERMELHO, background: `${VERMELHO}10` }}
                >
                  Ver todos
                </Link>
              </div>

              {/* Lista */}
              {suportes.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm text-white"
                    style={{
                      background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`,
                    }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  <p className={`${jakarta.className} text-sm font-bold text-slate-700 mb-1`}>
                    Fila limpa
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Nenhum suporte em aberto neste momento.
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin">
                  {suportes.map((s, idx) => {
                    const isAberto = s.status === "Aberto";
                    const cor = isAberto ? VERMELHO : AMBAR;
                    return (
                      <Link
                        key={s.id}
                        href="/portal-servicos/suporte"
                        style={{ animationDelay: `${300 + idx * 40}ms` }}
                        className="block p-3 bg-slate-50/70 hover:bg-white border border-slate-200/60 hover:border-slate-300 rounded-xl transition-all hover:shadow-sm group anim-fade-up"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border"
                            style={{
                              background: `${cor}10`,
                              color: cor,
                              borderColor: `${cor}25`,
                            }}
                          >
                            <Circle size={7} className="fill-current" />
                            {s.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 truncate">
                            {s.protocolo}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate mb-1">
                          {s.assunto}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                          <Users size={9} />
                          {s.nome}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* PRÓXIMOS EVENTOS                                            */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div
          className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm max-w-3xl mx-auto anim-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AMBAR}, ${AMBAR_LIGHT})` }} />

          {/* Header */}
          <div
            className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
            style={{ background: `linear-gradient(135deg, ${AMBAR}06, ${AMBAR}02)` }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
            >
              <CalendarIcon size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`${jakarta.className} text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap`}>
                Eventos municipais
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    background: `${AMBAR}10`,
                    color: AMBAR,
                    borderColor: `${AMBAR}25`,
                  }}
                >
                  Próximos 7 dias
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Agenda cultural e institucional do município
              </p>
            </div>
          </div>

          {/* Lista */}
          {eventos.length === 0 ? (
            <div className="py-16 text-center anim-fade">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-white"
                style={{
                  background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                }}
              >
                <Inbox size={28} />
              </div>
              <h3 className={`${jakarta.className} text-lg font-bold text-slate-800 mb-1.5`}>
                Agenda livre
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Não há eventos programados para esta semana.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2.5">
              {eventos.map((ev, idx) => {
                const [, , dia] = ev.data.split("-");
                const nomeMes = new Date(ev.data)
                  .toLocaleString("pt-BR", { month: "short" })
                  .replace(".", "");

                return (
                  <div
                    key={idx}
                    style={{ animationDelay: `${360 + idx * 40}ms` }}
                    className="flex items-center gap-4 p-4 bg-slate-50/70 hover:bg-white border border-slate-200/60 hover:border-slate-300 rounded-xl transition-all hover:shadow-sm anim-fade-up group"
                  >
                    {/* Data destacada */}
                    <div
                      className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 text-white shadow-sm transition-transform group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                      }}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 leading-none mb-1">
                        {nomeMes}
                      </span>
                      <span
                        className={`${jakarta.className} text-xl font-extrabold leading-none`}
                      >
                        {dia}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {ev.titulo}
                      </p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1.5 truncate">
                        <MapPin size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">{ev.local}</span>
                      </p>
                    </div>

                    {/* Ícone indicativo */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-slate-400 group-hover:text-[#DAA520] group-hover:bg-[#DAA520]/08 transition-colors"
                    >
                      <ArrowRight size={15} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ATALHOS RÁPIDOS                                             */}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="anim-fade-up" style={{ animationDelay: "360ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${ROXO}, #A78BFA)` }}
            >
              <Zap size={13} />
            </div>
            <h2 className={`${jakarta.className} text-sm font-bold text-slate-800 uppercase tracking-widest`}>
              Atalhos rápidos
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                href: "/portal-servicos/noticias",
                label: "Nova matéria",
                descricao: "Publicar no blog",
                icone: FileText,
                gradient: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
              },
              {
                href: "/portal-servicos/eventos",
                label: "Novo evento",
                descricao: "Adicionar à agenda",
                icone: CalendarIcon,
                gradient: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
              },
              {
                href: "/portal-servicos/atracoes",
                label: "Novo atrativo",
                descricao: "Vitrine turística",
                icone: MapPin,
                gradient: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`,
              },
              {
                href: "/portal-servicos/emissao",
                label: "Emitir carteira",
                descricao: "Registro de residente",
                icone: BadgeCheck,
                gradient: `linear-gradient(135deg, ${VERMELHO}, #F87171)`,
              },
            ].map((atalho, idx) => {
              const Icone = atalho.icone;
              return (
                <Link
                  key={atalho.href}
                  href={atalho.href}
                  style={{ animationDelay: `${420 + idx * 40}ms` }}
                  className="relative bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group anim-fade-up block overflow-hidden"
                >
                  <div
                    className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-0 group-hover:opacity-15 transition-opacity duration-500 blur-2xl"
                    style={{ background: atalho.gradient }}
                  />
                  <div className="relative flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 transition-transform group-hover:scale-105"
                      style={{ background: atalho.gradient }}
                    >
                      <Icone size={16} />
                    </div>
                    <PlusCircle
                      size={14}
                      className="ml-auto text-slate-300 group-hover:text-slate-600 transition-colors shrink-0"
                    />
                  </div>
                  <p className={`${jakarta.className} relative text-xs font-bold text-slate-800`}>
                    {atalho.label}
                  </p>
                  <p className="relative text-[10px] text-slate-500 mt-0.5">
                    {atalho.descricao}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}