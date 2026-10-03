"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Route, Plus, Loader2, Save, Camera, Trash2, ArrowLeft,
  FileText, MapPin, Layers, Eye, EyeOff, Pencil, Inbox, Search, X,
  Tag, CheckCircle2, AlertTriangle, ExternalLink, Phone, Images,
  Clock, Mountain, Users, ShieldCheck, CalendarDays, Ticket,
  Footprints, Compass, Link as LinkIcon, Target, Sparkles, Hash
} from "lucide-react";

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
const WARNING = "#D97706";
const DANGER = "#DC2626";

const inputCls =
  "w-full bg-white text-[13.5px] rounded-md px-3 py-2.5 transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:outline-none border";

const DIFICULDADES = ["Fácil", "Moderada", "Difícil", "Muito Difícil"];
const TIPOS_PERCURSO = ["Trilha", "Fluvial", "Rodoviário", "Misto", "Ciclismo"];
const CATEGORIAS = ["Ecoturismo", "Aventura", "Cultural", "Histórico", "Gastronômico", "Fotográfico"];
const TIPOS_GUIA = ["Obrigatório", "Recomendado", "Não necessário"];

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
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .anim-fade-up { animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .anim-fade { animation: fadeIn 0.2s ease both; }
      .num { font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
      .skeleton {
        background: linear-gradient(90deg, ${LINE_2} 0%, ${LINE} 50%, ${LINE_2} 100%);
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
      }
      .scroll-thin::-webkit-scrollbar { width: 6px; height: 6px; }
      .scroll-thin::-webkit-scrollbar-track { background: transparent; }
      .scroll-thin::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
      .scroll-thin::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════════
// ÁTOMOS
// ═══════════════════════════════════════════════════════════════

function Panel({ children, className = "", noPad = false }: {
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}) {
  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`} style={{ borderColor: LINE }}>
      {noPad ? children : <div className="p-5">{children}</div>}
    </div>
  );
}

function PanelHeader({ title, subtitle, action, badge }: {
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

function FormField({ label, icon, required, hint, children, className = "" }: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1.5"
        style={{ color: MUTED }}
      >
        {icon}
        {label}
        {required && <span style={{ color: DANGER }}>*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[10.5px] mt-1.5 leading-relaxed" style={{ color: SUBTLE }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function StatusPill({ tone, children }: { tone: "success" | "danger" | "warning" | "neutral" | "info"; children: React.ReactNode }) {
  const map = {
    success: { c: SUCCESS, bg: "#ECFDF5", b: "#D1FAE5" },
    danger: { c: DANGER, bg: "#FEF2F2", b: "#FEE2E2" },
    warning: { c: WARNING, bg: "#FFFBEB", b: "#FEF3C7" },
    neutral: { c: MUTED, bg: LINE_2, b: LINE },
    info: { c: ACCENT, bg: "#EFF6FF", b: "#DBEAFE" },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: map.bg, color: map.c, border: `1px solid ${map.b}` }}
    >
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA
// ═══════════════════════════════════════════════════════════════

export default function PortalRoteiros() {
  const [roteiros, setRoteiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [busca, setBusca] = useState("");

  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [pontos, setPontos] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => { fetchRoteiros(); }, []);

  async function fetchRoteiros() {
    setLoading(true);
    const { data } = await supabase
      .from("roteiros_turisticos")
      .select("*")
      .order("ordem", { ascending: true, nullsFirst: false });
    setRoteiros(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null);
    setForm({
      titulo: "",
      slug: "",
      descricao_curta: "",
      descricao_completa: "",
      necessidade_guia: false,
      tipo_guia: "Recomendado",
      tempo_estimado: "",
      distancia_km: "",
      dificuldade: "Moderada",
      tipo_percurso: "Trilha",
      melhor_epoca: "",
      faixa_etaria: "",
      tamanho_grupo_max: "",
      acessibilidade: "",
      categoria: "Ecoturismo",
      tags: [],
      link_google_maps: "",
      whatsapp_guia: "",
      link_agencia: "",
      preco_estimado: "",
      ordem: 0,
      ativo: true,
      destaque: false,
    });
    setImagemFile(null);
    setGaleriaFiles([]);
    setPontos([]);
    setFeedback("");
    setShowForm(true);
  }

  async function abrirFormEditar(r: any) {
    setEditando(r);
    setForm({
      ...r,
      tags: Array.isArray(r.tags) ? r.tags : (r.tags ? JSON.parse(r.tags) : []),
    });
    setImagemFile(null);
    setGaleriaFiles([]);
    setFeedback("");

    const { data: ptData } = await supabase
      .from("roteiros_turisticos_pontos")
      .select("*")
      .eq("roteiro_id", r.id)
      .order("ordem", { ascending: true });
    setPontos(ptData || []);
    setShowForm(true);
  }

  const addPonto = () =>
    setPontos([
      ...pontos,
      { id: null, titulo: "", descricao: "", tipo: "Paragem", duracao_minutos: "", imagem_url: "", link_google_maps: "", file: null, ordem: pontos.length },
    ]);

  const removePonto = (index: number) => {
    const novos = [...pontos];
    if (novos[index].id) novos[index]._deleted = true;
    else novos.splice(index, 1);
    setPontos(novos);
  };

  const handlePontoChange = (index: number, field: string, value: any) => {
    const novos = [...pontos];
    novos[index] = { ...novos[index], [field]: value };
    setPontos(novos);
  };

  const handleTagAdd = (tag: string) => {
    if (!tag.trim()) return;
    setForm({ ...form, tags: [...(form.tags || []), tag.trim()] });
  };

  const handleTagRemove = (index: number) => {
    setForm({ ...form, tags: form.tags.filter((_: any, i: number) => i !== index) });
  };

  async function handleSave() {
    if (!form.titulo) { setFeedback("Título obrigatório."); return; }
    setSaving(true);
    setFeedback("A processar...");

    try {
      let imagem_url = form.imagem_url;
      if (imagemFile) {
        const ext = imagemFile.name.split(".").pop();
        const path = `roteiros/${Date.now()}_capa.${ext}`;
        const { error } = await supabase.storage.from("galeria").upload(path, imagemFile);
        if (!error) {
          const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
          imagem_url = pub.publicUrl;
        }
      }

      let galeriaFinal = editando?.galeria || [];
      if (galeriaFiles.length > 0) {
        const novasUrls = [];
        for (const file of galeriaFiles) {
          const ext = file.name.split(".").pop();
          const path = `roteiros/gal_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
          const { error } = await supabase.storage.from("galeria").upload(path, file);
          if (!error) {
            const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
            novasUrls.push(pub.publicUrl);
          }
        }
        galeriaFinal = [...galeriaFinal, ...novasUrls];
      }

      const payload = {
        titulo: form.titulo,
        slug: form.slug || form.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        descricao_curta: form.descricao_curta,
        descricao_completa: form.descricao_completa,
        necessidade_guia: form.necessidade_guia,
        tipo_guia: form.tipo_guia,
        tempo_estimado: form.tempo_estimado,
        distancia_km: form.distancia_km ? parseFloat(form.distancia_km) : null,
        dificuldade: form.dificuldade,
        tipo_percurso: form.tipo_percurso,
        melhor_epoca: form.melhor_epoca,
        faixa_etaria: form.faixa_etaria,
        tamanho_grupo_max: form.tamanho_grupo_max ? parseInt(form.tamanho_grupo_max) : null,
        acessibilidade: form.acessibilidade,
        categoria: form.categoria,
        tags: form.tags || [],
        link_google_maps: form.link_google_maps,
        whatsapp_guia: form.whatsapp_guia,
        link_agencia: form.link_agencia,
        preco_estimado: form.preco_estimado ? parseFloat(form.preco_estimado) : null,
        ordem: form.ordem || 0,
        ativo: form.ativo,
        destaque: form.destaque,
        imagem_url,
        galeria: galeriaFinal.length > 0 ? galeriaFinal : null,
      };

      let roteiroId = editando?.id;

      if (editando) {
        await supabase.from("roteiros_turisticos").update(payload).eq("id", roteiroId);
      } else {
        const { data, error } = await supabase.from("roteiros_turisticos").insert(payload).select().single();
        if (!error && data) roteiroId = data.id;
      }

      if (roteiroId) {
        for (const pt of pontos) {
          if (pt._deleted) {
            await supabase.from("roteiros_turisticos_pontos").delete().eq("id", pt.id);
            continue;
          }
          if (!pt.titulo) continue;

          let ptImgUrl = pt.imagem_url;
          if (pt.file) {
            const ext = pt.file.name.split(".").pop();
            const path = `roteiros/pt_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            const { error } = await supabase.storage.from("galeria").upload(path, pt.file);
            if (!error) {
              const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
              ptImgUrl = pub.publicUrl;
            }
          }

          const ptPayload = {
            roteiro_id: roteiroId,
            titulo: pt.titulo,
            descricao: pt.descricao,
            tipo: pt.tipo,
            duracao_minutos: pt.duracao_minutos ? parseInt(pt.duracao_minutos) : null,
            imagem_url: ptImgUrl,
            link_google_maps: pt.link_google_maps,
            ordem: pt.ordem ?? 0,
          };

          if (pt.id) await supabase.from("roteiros_turisticos_pontos").update(ptPayload).eq("id", pt.id);
          else await supabase.from("roteiros_turisticos_pontos").insert(ptPayload);
        }
      }

      setFeedback(editando ? "Roteiro atualizado." : "Roteiro publicado.");
      setTimeout(() => {
        setShowForm(false);
        setSaving(false);
        fetchRoteiros();
        setFeedback("");
      }, 1500);
    } catch (err: any) {
      setFeedback(`Erro: ${err.message}`);
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover permanentemente este roteiro? Todos os pontos serão apagados.")) return;
    await supabase.from("roteiros_turisticos_pontos").delete().eq("roteiro_id", id);
    await supabase.from("roteiros_turisticos").delete().eq("id", id);
    fetchRoteiros();
  }

  const roteirosFiltrados = roteiros.filter((r) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      r.titulo?.toLowerCase().includes(termo) ||
      r.descricao_curta?.toLowerCase().includes(termo) ||
      r.categoria?.toLowerCase().includes(termo)
    );
  });

  const pontosVisiveis = pontos.filter((p) => !p._deleted);

  // ═══════════════════════════════════════════════════════════════
  // FORMULÁRIO
  // ═══════════════════════════════════════════════════════════════

  if (showForm) {
    return (
      <>
        <GlobalStyles />
        <div className={`${inter.className} space-y-4`}>

          {/* Header */}
          <div className="flex items-center gap-3 anim-fade-up">
            <button
              onClick={() => setShowForm(false)}
              className="w-9 h-9 rounded-md flex items-center justify-center transition-colors shrink-0 border"
              style={{ borderColor: LINE, color: MUTED, background: SURFACE }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = LINE_2;
                e.currentTarget.style.color = INK;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = SURFACE;
                e.currentTarget.style.color = MUTED;
              }}
              aria-label="Voltar"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                  style={{ background: INK, color: "#FFF" }}
                >
                  <Route size={9} strokeWidth={3} />
                  {editando ? "Editar" : "Novo"}
                </span>
                <span className="text-[11px]" style={{ color: MUTED }}>
                  {editando ? `Ordem ${form.ordem || 0}` : "Rascunho"}
                </span>
              </div>
              <h1
                className={`${jakarta.className} text-[22px] font-bold tracking-tight truncate`}
                style={{ color: INK, letterSpacing: "-0.02em" }}
              >
                {editando ? editando.titulo : "Novo roteiro turístico"}
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowForm(false)}
                className="hidden sm:inline-flex h-9 px-3 rounded-md text-[12.5px] font-semibold items-center border transition-colors"
                style={{ borderColor: LINE, color: INK_2, background: SURFACE }}
                onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-2 text-white transition-colors disabled:opacity-50"
                style={{ background: INK }}
                onMouseEnter={(e) => !saving && (e.currentTarget.style.background = INK_2)}
                onMouseLeave={(e) => !saving && (e.currentTarget.style.background = INK)}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? "A guardar..." : editando ? "Guardar" : "Publicar"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* ═══ COLUNA PRINCIPAL ═══ */}
            <div className="lg:col-span-8 space-y-4">

              {/* Identificação */}
              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Identificação" subtitle="Nome e descrições do roteiro" />
                <div className="p-5 space-y-4">
                  <FormField label="Título do roteiro" icon={<Tag size={10} />} required>
                    <input
                      value={form.titulo || ""}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
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
                      placeholder="Ex: Trilha da Pedra Escrita"
                    />
                  </FormField>

                  <FormField label="Slug (URL)" icon={<LinkIcon size={10} />} hint="Deixe vazio para gerar automaticamente a partir do título.">
                    <input
                      value={form.slug || ""}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
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
                      placeholder="trilha-pedra-escrita"
                    />
                  </FormField>

                  <FormField label="Descrição curta" icon={<FileText size={10} />} hint="Aparece nos cartões da listagem pública.">
                    <textarea
                      value={form.descricao_curta || ""}
                      onChange={(e) => setForm({ ...form, descricao_curta: e.target.value })}
                      rows={3}
                      className={`${inputCls} resize-y min-h-[80px]`}
                      style={{ borderColor: LINE }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = INK;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = LINE;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="Uma frase que resume a experiência"
                    />
                  </FormField>

                  <FormField label="Descrição completa" icon={<FileText size={10} />}>
                    <textarea
                      value={form.descricao_completa || ""}
                      onChange={(e) => setForm({ ...form, descricao_completa: e.target.value })}
                      rows={6}
                      className={`${inputCls} resize-y min-h-[140px]`}
                      style={{ borderColor: LINE }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = INK;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = LINE;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="Descrição detalhada do percurso, o que esperar, o que levar..."
                    />
                  </FormField>
                </div>
              </Panel>

              {/* Logística */}
              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Logística" subtitle="Tempo, distância, dificuldade e grupo" />
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Tempo estimado" icon={<Clock size={10} />}>
                    <input
                      value={form.tempo_estimado || ""}
                      onChange={(e) => setForm({ ...form, tempo_estimado: e.target.value })}
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
                      placeholder="Ex: 3h a 4h"
                    />
                  </FormField>

                  <FormField label="Distância (km)" icon={<Footprints size={10} />}>
                    <input
                      type="number"
                      step="0.1"
                      value={form.distancia_km || ""}
                      onChange={(e) => setForm({ ...form, distancia_km: e.target.value })}
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
                      placeholder="6.5"
                    />
                  </FormField>

                  <FormField label="Dificuldade" icon={<Mountain size={10} />}>
                    <select
                      value={form.dificuldade || ""}
                      onChange={(e) => setForm({ ...form, dificuldade: e.target.value })}
                      className={inputCls}
                      style={{ borderColor: LINE }}
                    >
                      {DIFICULDADES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Tipo de percurso" icon={<Route size={10} />}>
                    <select
                      value={form.tipo_percurso || ""}
                      onChange={(e) => setForm({ ...form, tipo_percurso: e.target.value })}
                      className={inputCls}
                      style={{ borderColor: LINE }}
                    >
                      {TIPOS_PERCURSO.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Melhor época" icon={<CalendarDays size={10} />}>
                    <input
                      value={form.melhor_epoca || ""}
                      onChange={(e) => setForm({ ...form, melhor_epoca: e.target.value })}
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
                      placeholder="Ex: Junho a Setembro"
                    />
                  </FormField>

                  <FormField label="Faixa etária" icon={<Users size={10} />}>
                    <input
                      value={form.faixa_etaria || ""}
                      onChange={(e) => setForm({ ...form, faixa_etaria: e.target.value })}
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
                      placeholder="Ex: 8+ anos"
                    />
                  </FormField>

                  <FormField label="Tamanho máximo do grupo" icon={<Users size={10} />}>
                    <input
                      type="number"
                      value={form.tamanho_grupo_max || ""}
                      onChange={(e) => setForm({ ...form, tamanho_grupo_max: e.target.value })}
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
                      placeholder="15"
                    />
                  </FormField>

                  <FormField label="Acessibilidade" icon={<ShieldCheck size={10} />}>
                    <input
                      value={form.acessibilidade || ""}
                      onChange={(e) => setForm({ ...form, acessibilidade: e.target.value })}
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
                      placeholder="Ex: Não acessível"
                    />
                  </FormField>

                  <FormField label="Guia" icon={<ShieldCheck size={10} />}>
                    <select
                      value={form.tipo_guia || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({ ...form, tipo_guia: val, necessidade_guia: val === "Obrigatório" || val === "Recomendado" });
                      }}
                      className={inputCls}
                      style={{ borderColor: LINE }}
                    >
                      {TIPOS_GUIA.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Preço estimado (R$)" icon={<Ticket size={10} />}>
                    <input
                      type="number"
                      step="0.01"
                      value={form.preco_estimado || ""}
                      onChange={(e) => setForm({ ...form, preco_estimado: e.target.value })}
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
                      placeholder="0.00 (vazio = gratuito)"
                    />
                  </FormField>
                </div>
              </Panel>

              {/* Classificação */}
              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Classificação" subtitle="Categoria e tags temáticas" />
                <div className="p-5 space-y-4">
                  <FormField label="Categoria" icon={<Compass size={10} />}>
                    <select
                      value={form.categoria || ""}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      className={inputCls}
                      style={{ borderColor: LINE }}
                    >
                      {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FormField>

                  <FormField
                    label="Tags"
                    icon={<Hash size={10} />}
                    hint="Prima Enter para adicionar. Ex: Trilha, Cachoeira, Arqueologia"
                  >
                    <input
                      type="text"
                      placeholder="Adicionar tag e premir Enter..."
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
                      onKeyDown={(e: any) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleTagAdd(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    />
                    {form.tags && form.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {form.tags.map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium"
                            style={{ background: LINE_2, color: INK, border: `1px solid ${LINE}` }}
                          >
                            <Hash size={9} style={{ color: SUBTLE }} />
                            {tag}
                            <button
                              onClick={() => handleTagRemove(i)}
                              className="ml-0.5 hover:opacity-70"
                              type="button"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </FormField>
                </div>
              </Panel>

              {/* Contactos */}
              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Contactos e links" subtitle="WhatsApp, mapa e agências" />
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="WhatsApp do guia" icon={<Phone size={10} />}>
                    <input
                      value={form.whatsapp_guia || ""}
                      onChange={(e) => setForm({ ...form, whatsapp_guia: e.target.value })}
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
                      placeholder="94 90000-0000"
                    />
                  </FormField>

                  <FormField label="Link da agência" icon={<LinkIcon size={10} />}>
                    <input
                      value={form.link_agencia || ""}
                      onChange={(e) => setForm({ ...form, link_agencia: e.target.value })}
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
                      placeholder="https://..."
                    />
                  </FormField>

                  <FormField label="Google Maps" icon={<MapPin size={10} />} className="md:col-span-2">
                    <input
                      value={form.link_google_maps || ""}
                      onChange={(e) => setForm({ ...form, link_google_maps: e.target.value })}
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
                      placeholder="https://maps.google.com/..."
                    />
                  </FormField>
                </div>
              </Panel>

              {/* Pontos do percurso */}
              <Panel noPad className="anim-fade-up">
                <PanelHeader
                  title="Pontos do percurso"
                  subtitle="Paragens ao longo do roteiro"
                  badge={
                    pontosVisiveis.length > 0 ? (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded num"
                        style={{ background: LINE_2, color: MUTED }}
                      >
                        {pontosVisiveis.length}
                      </span>
                    ) : null
                  }
                  action={
                    <button
                      onClick={addPonto}
                      className="h-8 px-2.5 rounded-md text-[12px] font-semibold flex items-center gap-1.5 text-white transition-colors"
                      style={{ background: INK }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                    >
                      <Plus size={12} strokeWidth={3} />
                      Adicionar
                    </button>
                  }
                />

                {pontosVisiveis.length === 0 ? (
                  <div className="py-12 px-6 text-center">
                    <div
                      className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                      style={{ background: LINE_2, color: MUTED }}
                    >
                      <MapPin size={20} strokeWidth={2} />
                    </div>
                    <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                      Sem pontos ainda
                    </p>
                    <p className="text-[11.5px] mt-1 max-w-md mx-auto" style={{ color: MUTED }}>
                      Adiciona paragens, mirantes, cachoeiras ou pontos de interesse que fazem parte deste roteiro.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: LINE_2 }}>
                    {pontosVisiveis.map((item, index) => (
                      <div key={index} className="p-4 anim-fade-up" style={{ animationDelay: `${index * 20}ms` }}>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold num shrink-0"
                              style={{ background: LINE_2, color: INK }}
                            >
                              {index + 1}
                            </div>
                            <span
                              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                              style={{ color: MUTED }}
                            >
                              Paragem {index + 1}
                            </span>
                          </div>
                          <button
                            onClick={() => removePonto(index)}
                            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors shrink-0"
                            style={{ color: SUBTLE }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#FEF2F2";
                              e.currentTarget.style.color = DANGER;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = SUBTLE;
                            }}
                            title="Remover"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                          <FormField label="Título" icon={<Tag size={10} />} className="md:col-span-3">
                            <input
                              type="text"
                              value={item.titulo}
                              onChange={(e) => handlePontoChange(index, "titulo", e.target.value)}
                              placeholder="Ex: Mirante do Rio"
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
                            />
                          </FormField>

                          <FormField label="Tipo" icon={<Target size={10} />} className="md:col-span-2">
                            <select
                              value={item.tipo}
                              onChange={(e) => handlePontoChange(index, "tipo", e.target.value)}
                              className={inputCls}
                              style={{ borderColor: LINE }}
                            >
                              <option value="Paragem">Paragem</option>
                              <option value="Mirante">Mirante</option>
                              <option value="Cachoeira">Cachoeira</option>
                              <option value="Restaurante">Restaurante</option>
                              <option value="Atração">Atração</option>
                              <option value="Pernoite">Pernoite</option>
                            </select>
                          </FormField>

                          <FormField label="Foto" icon={<Camera size={10} />} className="md:col-span-1">
                            <label
                              className="flex items-center justify-center gap-1.5 border-2 border-dashed rounded-md h-[42px] cursor-pointer text-[11px] font-semibold transition-colors w-full"
                              style={{
                                background: item.file || item.imagem_url ? "#ECFDF5" : SURFACE,
                                borderColor: item.file || item.imagem_url ? "#D1FAE5" : LINE,
                                color: item.file || item.imagem_url ? SUCCESS : MUTED,
                              }}
                              title={item.file?.name || "Anexar"}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePontoChange(index, "file", e.target.files?.[0] || null)}
                              />
                              {item.file || item.imagem_url ? <CheckCircle2 size={13} /> : <Camera size={13} />}
                            </label>
                          </FormField>

                          <FormField label="Duração (min)" icon={<Clock size={10} />} className="md:col-span-2">
                            <input
                              type="number"
                              value={item.duracao_minutos || ""}
                              onChange={(e) => handlePontoChange(index, "duracao_minutos", e.target.value)}
                              placeholder="30"
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
                            />
                          </FormField>

                          <FormField label="Descrição" icon={<FileText size={10} />} className="md:col-span-4">
                            <input
                              type="text"
                              value={item.descricao || ""}
                              onChange={(e) => handlePontoChange(index, "descricao", e.target.value)}
                              placeholder="Breve descrição do ponto"
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
                            />
                          </FormField>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            {/* ═══ COLUNA LATERAL ═══ */}
            <div className="lg:col-span-4 space-y-4">

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Publicação" subtitle="Ordem e visibilidade" />
                <div className="p-5 space-y-4">
                  <FormField label="Ordem" icon={<Layers size={10} />}>
                    <input
                      type="number"
                      value={form.ordem || ""}
                      onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })}
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
                      placeholder="1, 2, 3..."
                    />
                  </FormField>

                  <FormField label="Visibilidade" icon={<Eye size={10} />}>
                    <select
                      value={String(form.ativo)}
                      onChange={(e) => setForm({ ...form, ativo: e.target.value === "true" })}
                      className={inputCls}
                      style={{ borderColor: LINE }}
                    >
                      <option value="true">Público</option>
                      <option value="false">Oculto</option>
                    </select>
                  </FormField>

                  <FormField label="Destaque" icon={<Sparkles size={10} />} hint="Aparece em primeiro lugar no site.">
                    <select
                      value={String(form.destaque)}
                      onChange={(e) => setForm({ ...form, destaque: e.target.value === "true" })}
                      className={inputCls}
                      style={{ borderColor: LINE }}
                    >
                      <option value="false">Não</option>
                      <option value="true">Sim</option>
                    </select>
                  </FormField>
                </div>
              </Panel>

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Imagem de capa" subtitle="Foto principal do roteiro" />
                <div className="p-5">
                  <label
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md p-5 cursor-pointer text-[12px] font-semibold transition-colors"
                    style={{
                      background: imagemFile ? "#ECFDF5" : BG,
                      borderColor: imagemFile ? `${SUCCESS}50` : LINE,
                      color: imagemFile ? SUCCESS : MUTED,
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setImagemFile(e.target.files?.[0] || null)}
                    />
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{
                        background: imagemFile ? SUCCESS : LINE_2,
                        color: imagemFile ? "#FFF" : MUTED,
                      }}
                    >
                      {imagemFile ? <CheckCircle2 size={14} /> : <Camera size={14} />}
                    </div>
                    <span className="truncate max-w-[200px] text-center">
                      {imagemFile ? imagemFile.name : form.imagem_url ? "Trocar capa" : "Anexar capa"}
                    </span>
                  </label>

                  {form.imagem_url && !imagemFile && (
                    <div className="mt-3 rounded-md overflow-hidden border" style={{ borderColor: LINE }}>
                      <img src={form.imagem_url} alt="Capa" className="w-full h-32 object-cover" />
                    </div>
                  )}
                </div>
              </Panel>

              <Panel noPad className="anim-fade-up">
                <PanelHeader
                  title="Galeria"
                  subtitle={
                    editando?.galeria && editando.galeria.length > 0
                      ? `${editando.galeria.length} imagens`
                      : "Sem imagens ainda"
                  }
                />
                <div className="p-5">
                  <label
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md p-5 cursor-pointer text-[12px] font-semibold transition-colors"
                    style={{
                      background: galeriaFiles.length > 0 ? "#ECFDF5" : BG,
                      borderColor: galeriaFiles.length > 0 ? `${SUCCESS}50` : LINE,
                      color: galeriaFiles.length > 0 ? SUCCESS : MUTED,
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) setGaleriaFiles(Array.from(e.target.files));
                      }}
                    />
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{
                        background: galeriaFiles.length > 0 ? SUCCESS : LINE_2,
                        color: galeriaFiles.length > 0 ? "#FFF" : MUTED,
                      }}
                    >
                      {galeriaFiles.length > 0 ? <CheckCircle2 size={14} /> : <Images size={14} />}
                    </div>
                    <span className="truncate max-w-[200px] text-center">
                      {galeriaFiles.length > 0
                        ? `${galeriaFiles.length} ficheiros novos`
                        : "Adicionar fotos"}
                    </span>
                  </label>

                  {editando?.galeria && editando.galeria.length > 0 && galeriaFiles.length === 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {editando.galeria.slice(0, 6).map((url: string, i: number) => (
                        <div key={i} className="aspect-square rounded overflow-hidden border" style={{ borderColor: LINE }}>
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {editando.galeria.length > 6 && (
                        <div
                          className="aspect-square rounded flex items-center justify-center text-[11px] font-semibold num"
                          style={{ background: LINE_2, color: MUTED, border: `1px solid ${LINE}` }}
                        >
                          +{editando.galeria.length - 6}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Panel>

              {feedback && (
                <div
                  className="rounded-lg border p-3.5 flex items-start gap-3 anim-fade-up"
                  style={{
                    background: feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro")
                      ? "#FEF2F2"
                      : feedback.toLowerCase().includes("atualizado") || feedback.toLowerCase().includes("publicado")
                      ? "#ECFDF5"
                      : "#EFF6FF",
                    borderColor: feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro")
                      ? "#FEE2E2"
                      : feedback.toLowerCase().includes("atualizado") || feedback.toLowerCase().includes("publicado")
                      ? "#D1FAE5"
                      : "#DBEAFE",
                    color: feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro")
                      ? DANGER
                      : feedback.toLowerCase().includes("atualizado") || feedback.toLowerCase().includes("publicado")
                      ? SUCCESS
                      : ACCENT,
                  }}
                >
                  {feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro") ? (
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  ) : feedback.toLowerCase().includes("atualizado") || feedback.toLowerCase().includes("publicado") ? (
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 size={14} className="shrink-0 mt-0.5 animate-spin" />
                  )}
                  <p className="text-[12.5px] font-medium">{feedback}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // LISTA
  // ═══════════════════════════════════════════════════════════════

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-4`}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 anim-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                style={{ background: INK, color: "#FFF" }}
              >
                <Route size={9} strokeWidth={3} />
                Inventário
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {roteiros.length} roteiro{roteiros.length !== 1 ? "s" : ""} ·{" "}
                {roteiros.filter((r) => r.ativo).length} público{roteiros.filter((r) => r.ativo).length !== 1 ? "s" : ""}
              </span>
            </div>
            <h1
              className={`${jakarta.className} text-[26px] font-bold tracking-tight`}
              style={{ color: INK, letterSpacing: "-0.025em" }}
            >
              Roteiros Turísticos
            </h1>
            <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
              Trilhas, percursos e jornadas guiadas pelo município.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/roteiros"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex h-9 px-3 rounded-md text-[12.5px] font-semibold items-center gap-1.5 border transition-colors"
              style={{ borderColor: LINE, color: INK_2, background: SURFACE }}
              onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}
            >
              Ver público
              <ExternalLink size={12} />
            </a>
            <button
              onClick={abrirFormNovo}
              className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 text-white transition-colors"
              style={{ background: INK }}
              onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
            >
              <Plus size={14} strokeWidth={3} />
              Novo roteiro
            </button>
          </div>
        </div>

        {/* Busca */}
        {roteiros.length > 0 && (
          <Panel noPad className="anim-fade-up">
            <div className="p-3 flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: SUBTLE }}
                />
                <input
                  type="text"
                  placeholder="Buscar por título, descrição ou categoria..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className={`${inputCls} pl-9 pr-9`}
                  style={{ borderColor: LINE }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = INK;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = LINE;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                {busca && (
                  <button
                    onClick={() => setBusca("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center transition-colors"
                    style={{ color: SUBTLE }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = LINE_2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    aria-label="Limpar"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {busca && (
                <span
                  className="text-[11.5px] font-semibold num whitespace-nowrap"
                  style={{ color: MUTED }}
                >
                  {roteirosFiltrados.length} de {roteiros.length}
                </span>
              )}
            </div>
          </Panel>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-lg overflow-hidden border" style={{ borderColor: LINE }}>
                <div className="h-44 skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded skeleton" />
                  <div className="h-3 w-1/2 rounded skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : roteirosFiltrados.length === 0 ? (
          <Panel noPad className="anim-fade">
            <div className="py-16 text-center">
              <div
                className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                style={{ background: LINE_2, color: MUTED }}
              >
                {busca ? <Search size={20} strokeWidth={2} /> : <Inbox size={20} strokeWidth={2} />}
              </div>
              <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                {busca ? "Nenhum resultado" : "Nenhum roteiro ainda"}
              </p>
              <p className="text-[11.5px] mt-1 max-w-md mx-auto" style={{ color: MUTED }}>
                {busca
                  ? "Ajusta a pesquisa para encontrar roteiros."
                  : "Cria o primeiro roteiro turístico para aparecer no portal público."}
              </p>
              <div className="mt-4">
                {busca ? (
                  <button
                    onClick={() => setBusca("")}
                    className="h-9 px-3 rounded-md text-[12.5px] font-semibold text-white transition-colors"
                    style={{ background: INK }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                  >
                    Limpar pesquisa
                  </button>
                ) : (
                  <button
                    onClick={abrirFormNovo}
                    className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white transition-colors"
                    style={{ background: INK }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                  >
                    <Plus size={14} strokeWidth={3} /> Novo roteiro
                  </button>
                )}
              </div>
            </div>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roteirosFiltrados.map((r, idx) => (
              <article
                key={r.id}
                style={{
                  animationDelay: `${idx * 25}ms`,
                  borderColor: LINE,
                }}
                className="bg-white border rounded-lg overflow-hidden hover:border-slate-300 transition-colors anim-fade-up group"
              >
                {/* Imagem */}
                <div className="relative h-44 overflow-hidden" style={{ background: LINE_2 }}>
                  {r.imagem_url ? (
                    <img
                      src={r.imagem_url}
                      alt={r.titulo}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ color: SUBTLE }}
                    >
                      <Route size={32} strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Badges overlay */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {r.ativo ? (
                        <StatusPill tone="success">
                          <Eye size={8} />
                          Público
                        </StatusPill>
                      ) : (
                        <StatusPill tone="neutral">
                          <EyeOff size={8} />
                          Oculto
                        </StatusPill>
                      )}
                      {r.destaque && (
                        <StatusPill tone="warning">
                          <Sparkles size={8} />
                          Destaque
                        </StatusPill>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {r.galeria && r.galeria.length > 0 && (
                        <div
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold num"
                          style={{
                            background: "rgba(10,14,20,0.75)",
                            color: "#FFF",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          <Images size={9} />
                          {r.galeria.length}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Categoria */}
                  {r.categoria && (
                    <div
                      className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                      style={{
                        background: "rgba(10,14,20,0.75)",
                        color: "#FFF",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <Compass size={9} />
                      {r.categoria}
                    </div>
                  )}
                </div>

                {/* Corpo */}
                <div className="p-4">
                  <h3
                    className={`${jakarta.className} text-[14px] font-bold leading-snug line-clamp-2 mb-1`}
                    style={{ color: INK }}
                  >
                    {r.titulo}
                  </h3>

                  {r.descricao_curta && (
                    <p
                      className="text-[11.5px] line-clamp-2 leading-relaxed mb-3"
                      style={{ color: MUTED }}
                    >
                      {r.descricao_curta}
                    </p>
                  )}

                  {/* Metadados */}
                  <div
                    className="flex items-center gap-3 text-[10.5px] num mb-3"
                    style={{ color: MUTED }}
                  >
                    {r.tempo_estimado && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {r.tempo_estimado}
                      </span>
                    )}
                    {r.dificuldade && (
                      <span className="flex items-center gap-1">
                        <Mountain size={10} />
                        {r.dificuldade}
                      </span>
                    )}
                    {r.tipo_percurso && (
                      <span className="flex items-center gap-1">
                        <Route size={10} />
                        {r.tipo_percurso}
                      </span>
                    )}
                  </div>

                  {/* Ações */}
                  <div
                    className="flex items-center justify-between pt-3 border-t"
                    style={{ borderColor: LINE_2 }}
                  >
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={async () => {
                          await supabase.from("roteiros_turisticos").update({ ativo: !r.ativo }).eq("id", r.id);
                          fetchRoteiros();
                        }}
                        className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                        style={{ color: SUBTLE }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = LINE_2;
                          e.currentTarget.style.color = INK;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = SUBTLE;
                        }}
                        title={r.ativo ? "Ocultar" : "Publicar"}
                      >
                        {r.ativo ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button
                        onClick={() => abrirFormEditar(r)}
                        className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                        style={{ color: SUBTLE }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = LINE_2;
                          e.currentTarget.style.color = INK;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = SUBTLE;
                        }}
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                        style={{ color: SUBTLE }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#FEF2F2";
                          e.currentTarget.style.color = DANGER;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = SUBTLE;
                        }}
                        title="Remover"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => abrirFormEditar(r)}
                      className="text-[11px] font-semibold inline-flex items-center gap-1 transition-opacity hover:opacity-70"
                      style={{ color: MUTED }}
                    >
                      Pontos
                      <ExternalLink size={11} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}