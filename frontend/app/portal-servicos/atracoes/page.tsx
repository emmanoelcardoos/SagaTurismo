"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  MapPin, Plus, Loader2, Save, Image as ImageIcon, Phone,
  ArrowLeft, Tag, Hash, Star, Pencil, Trash2,
  Inbox, FileText, Wallet, Camera, Layers, ExternalLink,
  Eye, EyeOff, CheckCircle2, AlertTriangle, X, Search, Filter,
  MoreHorizontal, Images,
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

interface Atracao {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  imagem_url: string;
  preco_entrada: number;
  asaas_wallet_id: string | null;
  whatsapp: string | null;
  link_google_maps: string | null;
  link_hospedagem: string | null;
  galeria: string[] | null;
  ordem: number | null;
  ativo: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ESTILOS GLOBAIS
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
// PAGE
// ═══════════════════════════════════════════════════════════════

export default function PortalAtracoes() {
  const [atracoes, setAtracoes] = useState<Atracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Atracao | null>(null);
  const [form, setForm] = useState<any>({});
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => { fetchAtracoes(); }, []);

  async function fetchAtracoes() {
    setLoading(true);
    const { data } = await supabase
      .from("atracoes")
      .select("*")
      .order("ordem", { ascending: true, nullsFirst: false });
    setAtracoes(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null);
    setForm({
      nome: "", tipo: "", descricao: "", imagem_url: "", preco_entrada: 0,
      whatsapp: "", link_google_maps: "", ordem: 0, ativo: true,
    });
    setImagemFile(null);
    setGaleriaFiles([]);
    setFeedback("");
    setShowForm(true);
  }

  function abrirFormEditar(a: Atracao) {
    setEditando(a);
    setForm({ ...a, ordem: a.ordem || 0 });
    setImagemFile(null);
    setGaleriaFiles([]);
    setFeedback("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.nome) { setFeedback("Nome obrigatório."); return; }
    setSaving(true);
    setFeedback("A guardar...");

    let imagem_url = form.imagem_url;
    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const path = `atracoes/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("galeria").upload(path, imagemFile, { upsert: true });
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
        const path = `atracoes/galeria_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { error } = await supabase.storage.from("galeria").upload(path, file);
        if (!error) {
          const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
          novasUrls.push(pub.publicUrl);
        }
      }
      galeriaFinal = [...galeriaFinal, ...novasUrls];
    }

    const payload = { ...form, imagem_url, galeria: galeriaFinal.length > 0 ? galeriaFinal : null };
    if (editando) await supabase.from("atracoes").update(payload).eq("id", editando.id);
    else await supabase.from("atracoes").insert(payload);

    setFeedback(editando ? "Atração atualizada." : "Atração publicada.");
    setTimeout(() => {
      setShowForm(false);
      setSaving(false);
      fetchAtracoes();
      setFeedback("");
    }, 1500);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta atração da vitrine?")) return;
    await supabase.from("atracoes").delete().eq("id", id);
    fetchAtracoes();
  }

  // ─── FILTROS ───
  const tiposUnicos = Array.from(new Set(atracoes.map((a) => a.tipo).filter(Boolean)));
  const atracoesFiltradas = atracoes.filter((a) => {
    const termo = busca.toLowerCase();
    const passaBusca = !busca ||
      a.nome?.toLowerCase().includes(termo) ||
      a.tipo?.toLowerCase().includes(termo) ||
      a.descricao?.toLowerCase().includes(termo);
    const passaTipo = !filtroTipo || a.tipo === filtroTipo;
    return passaBusca && passaTipo;
  });

  // ═══════════════════════════════════════════════════════════════
  // VISTA: FORMULÁRIO
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
                  <MapPin size={9} strokeWidth={3} />
                  {editando ? "Editar" : "Nova"}
                </span>
                <span className="text-[11px]" style={{ color: MUTED }}>
                  {editando ? `Ordem ${form.ordem || 0}` : "Rascunho"}
                </span>
              </div>
              <h1
                className={`${jakarta.className} text-[22px] font-bold tracking-tight truncate`}
                style={{ color: INK, letterSpacing: "-0.02em" }}
              >
                {editando ? editando.nome : "Nova atração"}
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

          {/* Grid principal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Coluna principal */}
            <div className="lg:col-span-8 space-y-4">

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Identificação" subtitle="Nome, tipo e descrição" />
                <div className="p-5 space-y-4">
                  <FormField label="Nome da atração" icon={<Tag size={10} />} required>
                    <input
                      value={form.nome || ""}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
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
                      placeholder="Ex: Mirante da Serra"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Tipo" icon={<Hash size={10} />}>
                      <input
                        value={form.tipo || ""}
                        onChange={(e) => setForm({ ...form, tipo: e.target.value })}
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
                        placeholder="Ex: Natureza"
                      />
                    </FormField>

                    <FormField label="Preço de entrada" icon={<Wallet size={10} />}>
                      <input
                        type="number"
                        step="0.01"
                        value={form.preco_entrada || ""}
                        onChange={(e) => setForm({ ...form, preco_entrada: parseFloat(e.target.value) })}
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
                        placeholder="0.00"
                      />
                    </FormField>
                  </div>

                  <FormField label="Descrição" icon={<FileText size={10} />}>
                    <textarea
                      value={form.descricao || ""}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      rows={5}
                      className={`${inputCls} resize-y min-h-[120px]`}
                      style={{ borderColor: LINE }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = INK;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = LINE;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="Descreve os encantos desta atração..."
                    />
                  </FormField>
                </div>
              </Panel>

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Contacto e localização" subtitle="WhatsApp e Google Maps" />
                <div className="p-5 grid grid-cols-2 gap-4">
                  <FormField label="WhatsApp" icon={<Phone size={10} />}>
                    <input
                      value={form.whatsapp || ""}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
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

                  <FormField label="Link Google Maps" icon={<MapPin size={10} />}>
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
                      placeholder="https://maps..."
                    />
                  </FormField>
                </div>
              </Panel>
            </div>

            {/* Lateral */}
            <div className="lg:col-span-4 space-y-4">

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Publicação" subtitle="Ordem e visibilidade" />
                <div className="p-5 space-y-4">
                  <FormField label="Ordem de exibição" icon={<Layers size={10} />}>
                    <input
                      type="number"
                      value={form.ordem || ""}
                      onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) })}
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
                      <option value="true">Ativo / Público</option>
                      <option value="false">Oculto</option>
                    </select>
                  </FormField>
                </div>
              </Panel>

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Fotografia de capa" subtitle="Imagem principal" />
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
                      {imagemFile
                        ? imagemFile.name
                        : form.imagem_url
                        ? "Trocar capa"
                        : "Anexar capa"}
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
                      ? `${editando.galeria.length} imagens existentes`
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
                      {editando.galeria.slice(0, 6).map((url, i) => (
                        <div
                          key={i}
                          className="aspect-square rounded overflow-hidden border"
                          style={{ borderColor: LINE }}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {editando.galeria.length > 6 && (
                        <div
                          className="aspect-square rounded flex items-center justify-center text-[11px] font-semibold"
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
                    background: feedback.toLowerCase().includes("obrigat")
                      ? "#FEF2F2"
                      : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("atualizada") || feedback.toLowerCase().includes("publicada")
                      ? "#ECFDF5"
                      : "#EFF6FF",
                    borderColor: feedback.toLowerCase().includes("obrigat")
                      ? "#FEE2E2"
                      : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("atualizada") || feedback.toLowerCase().includes("publicada")
                      ? "#D1FAE5"
                      : "#DBEAFE",
                    color: feedback.toLowerCase().includes("obrigat")
                      ? DANGER
                      : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("atualizada") || feedback.toLowerCase().includes("publicada")
                      ? SUCCESS
                      : ACCENT,
                  }}
                >
                  {feedback.toLowerCase().includes("obrigat") ? (
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  ) : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("atualizada") || feedback.toLowerCase().includes("publicada") ? (
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
  // VISTA: LISTA (VITRINE)
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
                <MapPin size={9} strokeWidth={3} />
                Inventário
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {atracoes.length} atração{atracoes.length !== 1 ? "ões" : ""} · {atracoes.filter((a) => a.ativo).length} ativa{atracoes.filter((a) => a.ativo).length !== 1 ? "s" : ""}
              </span>
            </div>
            <h1
              className={`${jakarta.className} text-[26px] font-bold tracking-tight`}
              style={{ color: INK, letterSpacing: "-0.025em" }}
            >
              Atrações turísticas
            </h1>
            <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
              Vitrine de pontos turísticos do município.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/atracoes"
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
              Nova atração
            </button>
          </div>
        </div>

        {/* Filtros */}
        {atracoes.length > 0 && (
          <Panel noPad className="anim-fade-up">
            <div className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: SUBTLE }}
                />
                <input
                  type="text"
                  placeholder="Buscar por nome, tipo ou descrição..."
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

              <div className="relative">
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="h-10 pl-2.5 pr-8 rounded-md text-[12.5px] font-medium border appearance-none cursor-pointer transition-colors w-full sm:w-auto"
                  style={{ borderColor: LINE, color: INK_2, background: SURFACE }}
                >
                  <option value="">Todos os tipos</option>
                  {tiposUnicos.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <Filter
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: SUBTLE }}
                />
              </div>

              {(busca || filtroTipo) && (
                <span
                  className="text-[11.5px] font-semibold num self-center whitespace-nowrap"
                  style={{ color: MUTED }}
                >
                  {atracoesFiltradas.length} de {atracoes.length}
                </span>
              )}
            </div>
          </Panel>
        )}

        {/* Grid de cartões */}
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
        ) : atracoesFiltradas.length === 0 ? (
          <Panel noPad className="anim-fade">
            <div className="py-16 text-center">
              <div
                className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                style={{ background: LINE_2, color: MUTED }}
              >
                {busca || filtroTipo ? <Search size={20} strokeWidth={2} /> : <Inbox size={20} strokeWidth={2} />}
              </div>
              <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                {busca || filtroTipo ? "Nenhum resultado" : "Nenhuma atração ainda"}
              </p>
              <p className="text-[11.5px] mt-1 max-w-md mx-auto" style={{ color: MUTED }}>
                {busca || filtroTipo
                  ? "Ajusta a pesquisa ou o filtro para encontrares atrações."
                  : "Cria a primeira atração para aparecer na vitrine pública."}
              </p>
              <div className="mt-4">
                {busca || filtroTipo ? (
                  <button
                    onClick={() => { setBusca(""); setFiltroTipo(""); }}
                    className="h-9 px-3 rounded-md text-[12.5px] font-semibold text-white transition-colors"
                    style={{ background: INK }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                  >
                    Limpar filtros
                  </button>
                ) : (
                  <button
                    onClick={abrirFormNovo}
                    className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white transition-colors"
                    style={{ background: INK }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                  >
                    <Plus size={14} strokeWidth={3} /> Nova atração
                  </button>
                )}
              </div>
            </div>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {atracoesFiltradas.map((a, idx) => (
              <article
                key={a.id}
                style={{ animationDelay: `${idx * 25}ms` }}
                className="bg-white border rounded-lg overflow-hidden hover:border-slate-300 transition-colors anim-fade-up group"
                style={{
                  borderColor: LINE,
                  animationDelay: `${idx * 25}ms`,
                }}
              >
                {/* Imagem */}
                <div className="relative h-44 overflow-hidden" style={{ background: LINE_2 }}>
                  {a.imagem_url ? (
                    <img
                      src={a.imagem_url}
                      alt={a.nome}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ color: SUBTLE }}
                    >
                      <MapPin size={32} strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Badges overlay */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {a.ativo ? (
                        <StatusPill tone="success">
                          <Eye size={8} />
                          Ativo
                        </StatusPill>
                      ) : (
                        <StatusPill tone="neutral">
                          <EyeOff size={8} />
                          Oculto
                        </StatusPill>
                      )}
                    </div>
                    {a.tipo && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                          background: "rgba(10,14,20,0.75)",
                          color: "#FFF",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        <Tag size={8} />
                        {a.tipo}
                      </span>
                    )}
                  </div>

                  {/* Ordem */}
                  {a.ordem !== null && a.ordem !== undefined && (
                    <div
                      className="absolute bottom-3 left-3 w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold num"
                      style={{
                        background: "rgba(10,14,20,0.75)",
                        color: "#FFF",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {a.ordem}
                    </div>
                  )}

                  {/* Galeria count */}
                  {a.galeria && a.galeria.length > 0 && (
                    <div
                      className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold num"
                      style={{
                        background: "rgba(10,14,20,0.75)",
                        color: "#FFF",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <Images size={10} />
                      {a.galeria.length}
                    </div>
                  )}
                </div>

                {/* Corpo */}
                <div className="p-4">
                  <h3
                    className={`${jakarta.className} text-[14px] font-bold leading-snug line-clamp-2 mb-1`}
                    style={{ color: INK }}
                  >
                    {a.nome}
                  </h3>

                  {a.descricao && (
                    <p
                      className="text-[11.5px] line-clamp-2 leading-relaxed mb-3"
                      style={{ color: MUTED }}
                    >
                      {a.descricao}
                    </p>
                  )}

                  {/* Preço + WhatsApp */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`${jakarta.className} num text-[14px] font-bold`}
                      style={{ color: a.preco_entrada > 0 ? INK : SUCCESS }}
                    >
                      {a.preco_entrada > 0 ? `${Number(a.preco_entrada).toFixed(2)} MZN` : "Grátis"}
                    </span>

                    {a.whatsapp && (
                      <span className="text-[10.5px] num truncate" style={{ color: SUBTLE }}>
                        {a.whatsapp}
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
                        onClick={() => abrirFormEditar(a)}
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
                        onClick={() => handleDelete(a.id)}
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

                    {a.link_google_maps && (
                      <a
                        href={a.link_google_maps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70"
                        style={{ color: MUTED }}
                      >
                        Mapa
                        <ExternalLink size={11} />
                      </a>
                    )}
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