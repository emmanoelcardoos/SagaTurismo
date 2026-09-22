"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Newspaper, Plus, Loader2, Save, Image as ImageIcon,
  Sparkles, ArrowLeft, Tag, Calendar, User, Eye, EyeOff,
  Star, Code2, PenLine, FileText, CheckCircle2, AlertTriangle,
  Inbox, Filter, Search, X, Pencil, Trash2, Hash, Camera,
} from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import katex from "katex";
import "katex/dist/katex.min.css";

// Configuração do KaTeX para fórmulas matemáticas no editor
if (typeof window !== "undefined") {
  window.katex = katex;
}

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="p-4 flex items-center gap-2 text-xs text-slate-500">
      <Loader2 size={14} className="animate-spin" />
      A carregar editor de texto...
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

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── CORES (paleta Azure/Microsoft do portal) ───
const AZUL = "#0078D4";
const AZUL_ESCURO = "#005A9E";
const AZUL_CLARO = "#E5F1FB";
const AMBAR = "#DAA520";
const AMBAR_LIGHT = "#FBBF24";
const VERMELHO = "#D13438";
const VERDE = "#168821";
const VERDE_LIGHT = "#22C55E";

const inputCls =
  "w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-[#0078D4] focus:ring-4 focus:ring-[#0078D4]/10 transition-all placeholder:text-slate-400";
const labelCls =
  "flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2";

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
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .anim-fade-up { animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .anim-fade { animation: fadeIn 0.25s ease both; }
      .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
      .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
      .scrollbar-thin::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
      .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

      /* Editor Quill ajustes */
      .ql-toolbar.ql-snow {
        border: none !important;
        border-bottom: 1px solid #E2E8F0 !important;
        background: #F8FAFC;
        border-radius: 12px 12px 0 0;
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
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════════════════

function FormField({
  label,
  icon,
  required,
  hint,
  children,
  className = "",
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
      <label className={labelCls}>
        {icon}
        {label}
        {required && <span style={{ color: VERMELHO }}>*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

function StatusBadge({ ativo }: { ativo: boolean }) {
  const cor = ativo ? AZUL : "#64748B";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border"
      style={{ background: `${cor}10`, color: cor, borderColor: `${cor}25` }}
    >
      {ativo ? <Eye size={10} /> : <EyeOff size={10} />}
      {ativo ? "Público" : "Oculto"}
    </span>
  );
}

function CategoriaBadge({ categoria }: { categoria: string }) {
  const cores: Record<string, string> = {
    Turismo: AZUL,
    Eventos: AMBAR,
    Cultura: "#7C3AED",
    Natureza: VERDE,
    Notícias: VERMELHO,
  };
  const cor = cores[categoria] || AZUL;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border"
      style={{ background: `${cor}10`, color: cor, borderColor: `${cor}25` }}
    >
      <Tag size={10} />
      {categoria}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
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
    }, 2000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja apagar este artigo permanentemente?")) return;
    await supabase.from("blog").delete().eq("id", id);
    fetchPosts();
  }

  // ─── FILTRO ───
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
  // VISTA: FORMULÁRIO
  // ═══════════════════════════════════════════════════════════════

  if (showForm) {
    return (
      <>
        <GlobalStyles />
        <div className={`${inter.className} space-y-5 pb-6`}>

          {/* Cabeçalho */}
          <div className="flex items-center gap-3 anim-fade-up">
            <button
              onClick={() => setShowForm(false)}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm shrink-0 flex items-center justify-center group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                >
                  <PenLine size={12} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {editando ? "Editar artigo" : "Novo artigo"}
                </span>
              </div>
              <h1 className={`${jakarta.className} text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate`}>
                {editando ? editando.titulo : "Escrever novo artigo"}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Preenche os dados, escreve o conteúdo e publica no portal.
              </p>
            </div>
          </div>

          {/* Formulário principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Coluna 1: Editor principal */}
            <div className="lg:col-span-2 space-y-4">
              <div
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm anim-fade-up"
                style={{ animationDelay: "60ms" }}
              >
                <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})` }} />
                <div
                  className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
                  style={{ background: `linear-gradient(135deg, ${AZUL}04, ${AZUL}01)` }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                  >
                    <Newspaper size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                      Conteúdo do artigo
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Título, resumo e corpo editorial
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <FormField
                    label="Título da notícia / artigo"
                    icon={<FileText size={11} />}
                    required
                  >
                    <input
                      value={form.titulo}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                      className={inputCls}
                      placeholder="Ex: Novo roteiro turístico descoberto..."
                    />
                  </FormField>

                  <FormField
                    label="Resumo breve"
                    icon={<FileText size={11} />}
                    hint="Aparece nos cartões e listagens do portal público."
                  >
                    <textarea
                      value={form.resumo || ""}
                      onChange={(e) => setForm({ ...form, resumo: e.target.value })}
                      rows={2}
                      className={`${inputCls} resize-none`}
                      placeholder="Uma breve frase sobre o artigo"
                    />
                  </FormField>

                  {/* Toggle editor */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className={labelCls} style={{ marginBottom: 0 }}>
                        <FileText size={11} /> Conteúdo completo{" "}
                        <span style={{ color: VERMELHO }}>*</span>
                      </label>

                      <div className="bg-slate-100 rounded-xl p-1 flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setModoEditor("visual")}
                          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                            modoEditor === "visual"
                              ? "bg-white text-[#0078D4] shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <Eye size={11} />
                          Visual
                        </button>
                        <button
                          type="button"
                          onClick={() => setModoEditor("codigo")}
                          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                            modoEditor === "codigo"
                              ? "bg-white text-[#0078D4] shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <Code2 size={11} />
                          HTML + LaTeX
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
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
                          onChange={(e) =>
                            setForm({ ...form, conteudo: e.target.value })
                          }
                          className="w-full h-[450px] p-4 bg-slate-900 text-blue-100 font-mono text-xs focus:outline-none scrollbar-thin"
                          placeholder="<p>Insere aqui o HTML ou marcações LaTeX...</p>"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna 2: Detalhes laterais */}
            <div className="space-y-4">

              {/* Detalhes e publicação */}
              <div
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm anim-fade-up"
                style={{ animationDelay: "120ms" }}
              >
                <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AMBAR}, ${AMBAR_LIGHT})` }} />
                <div
                  className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
                  style={{ background: `linear-gradient(135deg, ${AMBAR}06, ${AMBAR}02)` }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
                  >
                    <Sparkles size={15} />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                      Detalhes & publicação
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Autoria, categoria e visibilidade
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <FormField label="Autor" icon={<User size={11} />}>
                    <input
                      value={form.autor || ""}
                      onChange={(e) => setForm({ ...form, autor: e.target.value })}
                      className={inputCls}
                      placeholder="Ex: Redação, Nome..."
                    />
                  </FormField>

                  <FormField label="Categoria" icon={<Tag size={11} />}>
                    <input
                      value={form.categoria || ""}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      className={inputCls}
                      placeholder="Ex: Turismo, Eventos..."
                    />
                  </FormField>

                  <FormField
                    label="Data de publicação"
                    icon={<Calendar size={11} />}
                    required
                  >
                    <input
                      type="date"
                      value={form.data_publicacao}
                      onChange={(e) =>
                        setForm({ ...form, data_publicacao: e.target.value })
                      }
                      className={inputCls}
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Visibilidade" icon={<Eye size={11} />}>
                      <select
                        value={String(form.ativo)}
                        onChange={(e) =>
                          setForm({ ...form, ativo: e.target.value === "true" })
                        }
                        className={inputCls}
                      >
                        <option value="true">Público</option>
                        <option value="false">Oculto</option>
                      </select>
                    </FormField>
                    <FormField label="Destaque" icon={<Star size={11} />}>
                      <select
                        value={String(form.destaque)}
                        onChange={(e) =>
                          setForm({ ...form, destaque: e.target.value === "true" })
                        }
                        className={inputCls}
                      >
                        <option value="false">Não</option>
                        <option value="true">Sim</option>
                      </select>
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Imagem de capa */}
              <div
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm anim-fade-up"
                style={{ animationDelay: "180ms" }}
              >
                <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${VERDE}, ${VERDE_LIGHT})` }} />
                <div
                  className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
                  style={{ background: `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)` }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})` }}
                  >
                    <Camera size={15} />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`${jakarta.className} text-sm font-bold text-slate-800`}>
                      Imagem de capa
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Visual principal do artigo
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <FormField label="Ficheiro de imagem" icon={<ImageIcon size={11} />}>
                    <label
                      className="flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-xl p-5 cursor-pointer text-xs font-bold transition-all group"
                      style={{
                        background: imagemFile
                          ? `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)`
                          : "#F8FAFC",
                        borderColor: imagemFile ? `${VERDE}50` : "#CBD5E1",
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setImagemFile(e.target.files?.[0] || null)
                        }
                      />
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                        style={{
                          background: imagemFile
                            ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
                            : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                        }}
                      >
                        {imagemFile ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <ImageIcon size={16} />
                        )}
                      </div>
                      <span
                        className="truncate max-w-[180px] text-center"
                        style={{ color: imagemFile ? VERDE : AZUL }}
                      >
                        {imagemFile
                          ? imagemFile.name
                          : form.imagem_url
                          ? "Trocar imagem atual"
                          : "Anexar imagem"}
                      </span>
                    </label>

                    {form.imagem_url && !imagemFile && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <img
                          src={form.imagem_url}
                          alt="Capa atual"
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    )}
                  </FormField>

                  <FormField
                    label="Legenda / créditos"
                    icon={<FileText size={11} />}
                    hint="Aparece sob a imagem no portal público."
                  >
                    <input
                      value={form.legenda_imagem_capa || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          legenda_imagem_capa: e.target.value,
                        })
                      }
                      className={inputCls}
                      placeholder="Ex: Foto por João Silva"
                    />
                  </FormField>
                </div>
              </div>

              {/* Feedback */}
              {feedback && (
                <div
                  className="rounded-2xl p-4 flex items-start gap-3 border-2 shadow-sm anim-fade-up"
                  style={{
                    background: feedback.toLowerCase().includes("erro")
                      ? `linear-gradient(135deg, ${VERMELHO}08, ${VERMELHO}02)`
                      : `linear-gradient(135deg, ${AZUL}08, ${AZUL}02)`,
                    borderColor: feedback.toLowerCase().includes("erro")
                      ? `${VERMELHO}30`
                      : `${AZUL}30`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm"
                    style={{
                      background: feedback.toLowerCase().includes("erro")
                        ? `linear-gradient(135deg, ${VERMELHO}, #F87171)`
                        : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                    }}
                  >
                    {feedback.toLowerCase().includes("erro") ? (
                      <AlertTriangle size={15} />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-700 pt-2">
                    {feedback}
                  </p>
                </div>
              )}

              {/* Botão guardar */}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`${jakarta.className} w-full text-white font-bold text-xs uppercase tracking-widest rounded-xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0`}
                style={{
                  background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                }}
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                {saving
                  ? "A guardar..."
                  : editando
                  ? "Atualizar artigo"
                  : "Publicar artigo"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VISTA: LISTA
  // ═══════════════════════════════════════════════════════════════

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-5`}>

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 anim-fade-up">
          <div>
            <h1 className={`${jakarta.className} text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight`}>
              Gestão do blog
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
              <Sparkles size={14} style={{ color: AMBAR }} />
              {posts.length} artigo{posts.length !== 1 ? "s" : ""} no blog do portal
            </p>
          </div>

          <button
            onClick={abrirFormNovo}
            className={`${jakarta.className} self-start sm:self-auto text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5`}
            style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
          >
            <Plus size={14} /> Novo artigo
          </button>
        </div>

        {/* Busca */}
        {posts.length > 0 && (
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm anim-fade-up"
            style={{ animationDelay: "60ms" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${AZUL}10`, color: AZUL }}
                >
                  <Filter size={14} />
                </div>
                <p className="text-xs text-slate-500">
                  A mostrar{" "}
                  <strong className="text-slate-800 font-bold">{filtrados.length}</strong> de{" "}
                  <strong className="text-slate-800 font-bold">{posts.length}</strong> artigo(s)
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Buscar por título, resumo ou categoria..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className={`${inputCls} pl-10 pr-9`}
                />
                {busca && (
                  <button
                    onClick={() => setBusca("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl py-24 flex flex-col items-center gap-3 anim-fade">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
            >
              <Loader2 size={22} className="animate-spin" />
            </div>
            <p className="text-xs text-slate-400 font-medium">A carregar artigos...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl py-20 text-center shadow-sm anim-fade">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-white"
              style={{
                background: busca
                  ? `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`
                  : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
              }}
            >
              {busca ? <Search size={28} /> : <Inbox size={28} />}
            </div>
            <h3 className={`${jakarta.className} text-lg font-bold text-slate-800 mb-1.5`}>
              {busca ? "Nenhum resultado" : "Nenhum artigo publicado"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-5">
              {busca
                ? "Ajusta a pesquisa para encontrares artigos."
                : "Cria o primeiro artigo para aparecer no blog do portal."}
            </p>
            {busca ? (
              <button
                onClick={() => setBusca("")}
                className={`${jakarta.className} text-[11px] font-bold px-4 py-2 rounded-xl text-white shadow-sm hover:shadow-md transition-all`}
                style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
              >
                Limpar pesquisa
              </button>
            ) : (
              <button
                onClick={abrirFormNovo}
                className={`${jakarta.className} text-white px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5`}
                style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
              >
                <Plus size={14} /> Novo artigo
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map((post, idx) => (
              <article
                key={post.id}
                style={{ animationDelay: `${120 + idx * 30}ms` }}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 anim-fade-up"
              >
                <div
                  className="h-0.5"
                  style={{
                    background: post.destaque
                      ? `linear-gradient(90deg, ${AMBAR}, ${AMBAR_LIGHT})`
                      : `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})`,
                  }}
                />
                <div className="p-4 flex flex-col sm:flex-row gap-4">
                  {/* Thumb */}
                  <div className="w-full sm:w-40 h-32 sm:h-24 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-200/60 bg-slate-100">
                    {post.imagem_url ? (
                      <img
                        src={post.imagem_url}
                        alt={post.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white"
                        style={{
                          background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                        }}
                      >
                        <Newspaper size={24} className="opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {post.destaque && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border"
                          style={{
                            background: `${AMBAR}10`,
                            color: AMBAR,
                            borderColor: `${AMBAR}25`,
                          }}
                        >
                          <Star size={9} className="fill-current" /> Destaque
                        </span>
                      )}
                      {post.categoria && <CategoriaBadge categoria={post.categoria} />}
                      <StatusBadge ativo={post.ativo} />
                    </div>

                    <h3 className={`${jakarta.className} text-sm font-bold text-slate-900 line-clamp-2 mb-1.5 leading-snug`}>
                      {post.titulo}
                    </h3>

                    {post.resumo && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
                        {post.resumo}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap mt-auto">
                      <span className="flex items-center gap-1">
                        <User size={10} /> {post.autor || "Redação"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {fmtData(post.data_publicacao)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash size={10} /> {tempoRelativo(post.data_publicacao)}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex sm:flex-col gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => toggleAtivo(post.id, post.ativo)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#0078D4] hover:bg-[#0078D4]/10 transition-colors"
                      title={post.ativo ? "Ocultar" : "Publicar"}
                    >
                      {post.ativo ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      onClick={() => abrirFormEditar(post)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#0078D4] hover:bg-[#0078D4]/10 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#D13438] hover:bg-red-50 transition-colors"
                      title="Apagar"
                    >
                      <Trash2 size={14} />
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