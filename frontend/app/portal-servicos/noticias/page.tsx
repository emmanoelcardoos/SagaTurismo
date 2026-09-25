"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Newspaper, Plus, Loader2, Save, Image as ImageIcon,
  Sparkles, ArrowLeft, Tag, Calendar, User, Eye, EyeOff,
  Star, Code2, PenLine, FileText, CheckCircle2, AlertTriangle,
  Inbox, Filter, Search, X, Pencil, Trash2, Hash, Camera,
  MoreHorizontal, ExternalLink, Clock,
} from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import katex from "katex";
import "katex/dist/katex.min.css";

if (typeof window !== "undefined") {
  window.katex = katex;
}

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="p-4 flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
      <Loader2 size={14} className="animate-spin" />
      A carregar editor...
    </div>
  ),
});

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ script: "sub" }, { script: "super" }],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }, { align: [] }],
    ["link", "image", "video", "formula"],
    ["clean"],
  ],
};

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

function fmtData(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function tempoRelativo(iso: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const agora = new Date();
    const diffMs = agora.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `há ${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `há ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "ontem";
    if (diffD < 7) return `há ${diffD}d`;
    return fmtData(iso);
  } catch {
    return "—";
  }
}

interface BlogPost {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  imagem_url: string | null;
  data_publicacao: string;
  ativo: boolean;
  autor: string | null;
  categoria: string | null;
  destaque: boolean;
  legenda_imagem_capa?: string;
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
      .anim-fade-up { animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .anim-fade { animation: fadeIn 0.2s ease both; }
      .num { font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
      .scroll-thin::-webkit-scrollbar { width: 6px; height: 6px; }
      .scroll-thin::-webkit-scrollbar-track { background: transparent; }
      .scroll-thin::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
      .scroll-thin::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }

      /* Editor Quill — minimalista, mesma paleta do sistema */
      .ql-toolbar.ql-snow {
        border: none !important;
        border-bottom: 1px solid ${LINE} !important;
        background: ${LINE_2};
        padding: 8px !important;
      }
      .ql-container.ql-snow {
        border: none !important;
        font-family: 'Inter', sans-serif !important;
        font-size: 14px;
      }
      .ql-editor {
        min-height: 380px;
        padding: 16px !important;
        line-height: 1.7 !important;
        color: #1E293B;
      }
      .ql-editor.ql-blank::before {
        color: #94A3B8 !important;
        font-style: normal !important;
        left: 16px !important;
      }
      .ql-snow .ql-stroke { stroke: #6B7280 !important; }
      .ql-snow .ql-fill { fill: #6B7280 !important; }
      .ql-snow .ql-picker { color: #6B7280 !important; }
      .ql-snow .ql-picker-options {
        border-color: ${LINE} !important;
        border-radius: 6px !important;
        box-shadow: 0 4px 16px rgba(15,23,42,0.08) !important;
      }
      .ql-snow.ql-toolbar button:hover .ql-stroke,
      .ql-snow.ql-toolbar button.ql-active .ql-stroke {
        stroke: ${INK} !important;
      }
      .ql-snow.ql-toolbar button:hover .ql-fill,
      .ql-snow.ql-toolbar button.ql-active .ql-fill {
        fill: ${INK} !important;
      }
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

function PanelHeader({
  title, subtitle, action, badge,
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

function FormField({
  label, icon, required, hint, children, className = "",
}: {
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

function StatusPill({ tone, children }: { tone: "success" | "danger" | "warning" | "neutral"; children: React.ReactNode }) {
  const map = {
    success: { c: SUCCESS, bg: "#ECFDF5", b: "#D1FAE5" },
    danger: { c: DANGER, bg: "#FEF2F2", b: "#FEE2E2" },
    warning: { c: WARNING, bg: "#FFFBEB", b: "#FEF3C7" },
    neutral: { c: MUTED, bg: LINE_2, b: LINE },
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

export default function PortalBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<BlogPost | null>(null);
  const [modoEditor, setModoEditor] = useState<"visual" | "codigo">("visual");
  const [busca, setBusca] = useState("");

  const formVazio = {
    titulo: "",
    resumo: "",
    conteudo: "",
    legenda_imagem_capa: "",
    data_publicacao: new Date().toISOString().split("T")[0],
    autor: "Redação",
    categoria: "Turismo",
    ativo: true,
    destaque: false,
  };
  const [form, setForm] = useState<any>(formVazio);

  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data } = await supabase
      .from("blog")
      .select("*")
      .order("data_publicacao", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null);
    setForm(formVazio);
    setImagemFile(null);
    setShowForm(true);
    setFeedback("");
  }

  function abrirFormEditar(post: BlogPost) {
    setEditando(post);
    setForm({ ...post });
    setImagemFile(null);
    setShowForm(true);
    setFeedback("");
  }

  async function toggleAtivo(id: string, estadoAtual: boolean) {
    await supabase.from("blog").update({ ativo: !estadoAtual }).eq("id", id);
    fetchPosts();
  }

  async function handleSave() {
    if (!form.titulo || !form.conteudo) {
      setFeedback("Título e conteúdo são obrigatórios.");
      return;
    }
    setSaving(true);
    setFeedback("A guardar artigo...");

    let imagem_url = editando?.imagem_url || null;

    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const path = `blog/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("galeria")
        .upload(path, imagemFile, { upsert: true });
      if (!error) {
        const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
        imagem_url = pub.publicUrl;
      }
    }

    const payload = { ...form, imagem_url };

    if (editando) await supabase.from("blog").update(payload).eq("id", editando.id);
    else await supabase.from("blog").insert(payload);

    setFeedback(editando ? "Artigo atualizado com sucesso!" : "Novo artigo publicado!");
    setTimeout(() => {
      setShowForm(false);
      setSaving(false);
      fetchPosts();
      setFeedback("");
    }, 1500);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja apagar este artigo permanentemente?")) return;
    await supabase.from("blog").delete().eq("id", id);
    fetchPosts();
  }

  const filtrados = posts.filter((p) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      p.titulo?.toLowerCase().includes(termo) ||
      p.resumo?.toLowerCase().includes(termo) ||
      p.categoria?.toLowerCase().includes(termo)
    );
  });

  // ═══════════════════════════════════════════════════════════════
  // FORMULÁRIO (modo edição)
  // ═══════════════════════════════════════════════════════════════

  if (showForm) {
    return (
      <>
        <GlobalStyles />
        <div className={`${inter.className} space-y-4`}>

          {/* Header do form */}
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
                  <PenLine size={9} strokeWidth={3} />
                  {editando ? "Editar" : "Novo"}
                </span>
                <span className="text-[11px]" style={{ color: MUTED }}>
                  {editando ? `Última alteração em ${tempoRelativo(editando.data_publicacao)}` : "Rascunho"}
                </span>
              </div>
              <h1
                className={`${jakarta.className} text-[22px] font-bold tracking-tight truncate`}
                style={{ color: INK, letterSpacing: "-0.02em" }}
              >
                {editando ? editando.titulo : "Novo artigo"}
              </h1>
            </div>

            {/* Ações no topo */}
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

              {/* Conteúdo */}
              <Panel noPad className="anim-fade-up">
                <PanelHeader
                  title="Conteúdo"
                  subtitle="Título, resumo e corpo editorial"
                />
                <div className="p-5 space-y-4">
                  <FormField
                    label="Título"
                    icon={<FileText size={10} />}
                    required
                  >
                    <input
                      value={form.titulo}
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
                      placeholder="Ex: Novo roteiro turístico descoberto..."
                    />
                  </FormField>

                  <FormField
                    label="Resumo"
                    icon={<FileText size={10} />}
                    hint="Aparece nos cartões e listagens do portal público."
                  >
                    <textarea
                      value={form.resumo || ""}
                      onChange={(e) => setForm({ ...form, resumo: e.target.value })}
                      rows={2}
                      className={`${inputCls} resize-none`}
                      style={{ borderColor: LINE }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = INK;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = LINE;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="Uma breve frase sobre o artigo"
                    />
                  </FormField>

                  {/* Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                        style={{ color: MUTED }}
                      >
                        <FileText size={10} /> Corpo do artigo <span style={{ color: DANGER }}>*</span>
                      </label>

                      <div
                        className="flex items-center gap-0.5 p-0.5 rounded-md"
                        style={{ background: LINE_2 }}
                      >
                        <button
                          type="button"
                          onClick={() => setModoEditor("visual")}
                          className="text-[10.5px] font-semibold uppercase tracking-wide px-2 py-1 rounded transition-colors flex items-center gap-1"
                          style={{
                            background: modoEditor === "visual" ? SURFACE : "transparent",
                            color: modoEditor === "visual" ? INK : MUTED,
                            boxShadow: modoEditor === "visual" ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
                          }}
                        >
                          <Eye size={10} strokeWidth={2.5} />
                          Visual
                        </button>
                        <button
                          type="button"
                          onClick={() => setModoEditor("codigo")}
                          className="text-[10.5px] font-semibold uppercase tracking-wide px-2 py-1 rounded transition-colors flex items-center gap-1"
                          style={{
                            background: modoEditor === "codigo" ? SURFACE : "transparent",
                            color: modoEditor === "codigo" ? INK : MUTED,
                            boxShadow: modoEditor === "codigo" ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
                          }}
                        >
                          <Code2 size={10} strokeWidth={2.5} />
                          HTML
                        </button>
                      </div>
                    </div>

                    <div
                      className="border rounded-md overflow-hidden bg-white"
                      style={{ borderColor: LINE }}
                    >
                      {modoEditor === "visual" ? (
                        <ReactQuill
                          theme="snow"
                          value={form.conteudo || ""}
                          onChange={(content) => setForm({ ...form, conteudo: content })}
                          modules={quillModules}
                          placeholder="Escreve a notícia, adiciona fotos ou fórmulas (botão fx)..."
                        />
                      ) : (
                        <textarea
                          value={form.conteudo || ""}
                          onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                          className="w-full h-[450px] p-4 text-[12.5px] focus:outline-none scroll-thin font-mono"
                          style={{ background: INK, color: "#E2E8F0", border: "none" }}
                          placeholder="<p>Insere aqui o HTML ou marcações LaTeX...</p>"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Coluna lateral */}
            <div className="lg:col-span-4 space-y-4">

              {/* Publicação */}
              <Panel noPad className="anim-fade-up" >
                <PanelHeader
                  title="Publicação"
                  subtitle="Autoria e visibilidade"
                />
                <div className="p-5 space-y-4">
                  <FormField label="Autor" icon={<User size={10} />}>
                    <input
                      value={form.autor || ""}
                      onChange={(e) => setForm({ ...form, autor: e.target.value })}
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
                      placeholder="Ex: Redação"
                    />
                  </FormField>

                  <FormField label="Categoria" icon={<Tag size={10} />}>
                    <input
                      value={form.categoria || ""}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
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
                      placeholder="Ex: Turismo"
                    />
                  </FormField>

                  <FormField label="Data de publicação" icon={<Calendar size={10} />} required>
                    <input
                      type="date"
                      value={form.data_publicacao}
                      onChange={(e) => setForm({ ...form, data_publicacao: e.target.value })}
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

                  <div className="grid grid-cols-2 gap-3">
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

                    <FormField label="Destaque" icon={<Star size={10} />}>
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
                </div>
              </Panel>

              {/* Imagem */}
              <Panel noPad className="anim-fade-up">
                <PanelHeader
                  title="Imagem de capa"
                  subtitle="Visual principal"
                />
                <div className="p-5 space-y-4">
                  <FormField label="Ficheiro" icon={<ImageIcon size={10} />}>
                    <label
                      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md p-5 cursor-pointer text-[12px] font-semibold transition-colors group"
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
                        {imagemFile ? <CheckCircle2 size={14} /> : <ImageIcon size={14} />}
                      </div>
                      <span className="truncate max-w-[180px] text-center">
                        {imagemFile
                          ? imagemFile.name
                          : form.imagem_url
                          ? "Trocar imagem"
                          : "Anexar imagem"}
                      </span>
                    </label>

                    {form.imagem_url && !imagemFile && (
                      <div
                        className="mt-3 rounded-md overflow-hidden border"
                        style={{ borderColor: LINE }}
                      >
                        <img
                          src={form.imagem_url}
                          alt="Capa"
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    )}
                  </FormField>

                  <FormField
                    label="Legenda / créditos"
                    icon={<FileText size={10} />}
                  >
                    <input
                      value={form.legenda_imagem_capa || ""}
                      onChange={(e) => setForm({ ...form, legenda_imagem_capa: e.target.value })}
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
                      placeholder="Ex: Foto por João Silva"
                    />
                  </FormField>
                </div>
              </Panel>

              {/* Feedback */}
              {feedback && (
                <div
                  className="rounded-lg border p-3.5 flex items-start gap-3 anim-fade-up"
                  style={{
                    background: feedback.toLowerCase().includes("obrigat")
                      ? "#FEF2F2"
                      : "#ECFDF5",
                    borderColor: feedback.toLowerCase().includes("obrigat") ? "#FEE2E2" : "#D1FAE5",
                    color: feedback.toLowerCase().includes("obrigat") ? DANGER : SUCCESS,
                  }}
                >
                  {feedback.toLowerCase().includes("obrigat") ? (
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
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
                <Newspaper size={9} strokeWidth={3} />
                Conteúdo
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {posts.length} artigo{posts.length !== 1 ? "s" : ""} · {posts.filter((p) => p.ativo).length} público{posts.filter((p) => p.ativo).length !== 1 ? "s" : ""}
              </span>
            </div>
            <h1
              className={`${jakarta.className} text-[26px] font-bold tracking-tight`}
              style={{ color: INK, letterSpacing: "-0.025em" }}
            >
              Blog
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/blog"
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
              Novo artigo
            </button>
          </div>
        </div>

        {/* Busca */}
        {posts.length > 0 && (
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
                  placeholder="Buscar por título, resumo ou categoria..."
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
                    aria-label="Limpar busca"
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
                  {filtrados.length} de {posts.length}
                </span>
              )}
            </div>
          </Panel>
        )}

        {/* Lista */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-lg"
                style={{
                  background: `linear-gradient(90deg, ${LINE_2} 0%, ${LINE} 50%, ${LINE_2} 100%)`,
                  backgroundSize: "200% 100%",
                  animation: "fadeIn 0.3s ease",
                }}
              />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <Panel noPad className="anim-fade">
            <div className="py-16 text-center">
              <div
                className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                style={{ background: LINE_2, color: MUTED }}
              >
                {busca ? <Search size={20} strokeWidth={2} /> : <Inbox size={20} strokeWidth={2} />}
              </div>
              <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                {busca ? "Nenhum resultado" : "Nenhum artigo ainda"}
              </p>
              <p className="text-[11.5px] mt-1 max-w-md mx-auto" style={{ color: MUTED }}>
                {busca
                  ? "Ajusta a pesquisa para encontrar artigos."
                  : "Cria o primeiro artigo para aparecer no blog do portal."}
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
                    <Plus size={14} strokeWidth={3} /> Novo artigo
                  </button>
                )}
              </div>
            </div>
          </Panel>
        ) : (
          <div className="space-y-2">
            {filtrados.map((post, idx) => (
              <article
                key={post.id}
                style={{ animationDelay: `${idx * 20}ms` }}
                className="bg-white border rounded-lg overflow-hidden hover:border-slate-300 transition-colors anim-fade-up group"
              >
                {/* Faixa lateral esquerda conforme estado */}
                <div className="flex items-stretch">
                  {/* Indicador de destaque */}
                  <div
                    className="w-1 shrink-0"
                    style={{
                      background: post.destaque ? WARNING : "transparent",
                    }}
                  />

                  <div className="flex-1 p-3.5 flex flex-col sm:flex-row gap-4 min-w-0">
                    {/* Thumb */}
                    <div
                      className="w-full sm:w-36 h-32 sm:h-20 rounded-md overflow-hidden shrink-0 border"
                      style={{ borderColor: LINE, background: LINE_2 }}
                    >
                      {post.imagem_url ? (
                        <img
                          src={post.imagem_url}
                          alt={post.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ color: SUBTLE }}
                        >
                          <Newspaper size={20} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <StatusPill tone={post.ativo ? "success" : "neutral"}>
                          {post.ativo ? <Eye size={8} /> : <EyeOff size={8} />}
                          {post.ativo ? "Público" : "Oculto"}
                        </StatusPill>
                        {post.destaque && (
                          <StatusPill tone="warning">
                            <Star size={8} className="fill-current" />
                            Destaque
                          </StatusPill>
                        )}
                        {post.categoria && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                            style={{ background: LINE_2, color: MUTED, border: `1px solid ${LINE}` }}
                          >
                            <Tag size={8} />
                            {post.categoria}
                          </span>
                        )}
                      </div>

                      <h3
                        className={`${jakarta.className} text-[13.5px] font-bold leading-snug line-clamp-2 mb-1`}
                        style={{ color: INK }}
                      >
                        {post.titulo}
                      </h3>

                      {post.resumo && (
                        <p
                          className="text-[11.5px] line-clamp-2 leading-relaxed mb-2"
                          style={{ color: MUTED }}
                        >
                          {post.resumo}
                        </p>
                      )}

                      <div
                        className="flex items-center gap-3 text-[10.5px] flex-wrap mt-auto num"
                        style={{ color: SUBTLE }}
                      >
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          {post.autor || "Redação"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {fmtData(post.data_publicacao)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {tempoRelativo(post.data_publicacao)}
                        </span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex sm:flex-col gap-1 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => toggleAtivo(post.id, post.ativo)}
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
                        title={post.ativo ? "Ocultar" : "Publicar"}
                      >
                        {post.ativo ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => abrirFormEditar(post)}
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
                        onClick={() => handleDelete(post.id)}
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
                        title="Apagar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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