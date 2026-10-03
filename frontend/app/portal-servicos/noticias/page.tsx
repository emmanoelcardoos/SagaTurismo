"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Newspaper, Plus, Loader2, Save, Image as ImageIcon,
  ArrowLeft, Tag, Calendar, User, Eye, EyeOff,
  Star, Code2, PenLine, FileText, CheckCircle2, AlertTriangle,
  Inbox, Search, X, Pencil, Trash2, Clock, ExternalLink,
  Bold, Italic, Underline, List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3,
  Undo, Redo, Link as LinkIcon, Minus,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageResize from "tiptap-extension-resize-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import UnderlineExt from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── PALETA ENTERPRISE ───
const INK = "#002f40";
const INK_2 = "#00577C";
const MUTED = "#6B7280";
const SUBTLE = "#9CA3AF";
const LINE = "#E5E7EB";
const LINE_2 = "#F3F4F6";
const BG = "#FDFCF7";
const SURFACE = "#FFFFFF";
const ACCENT = "#F9C400";
const SUCCESS = "#009640";
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
  legenda_imagem_capa?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// ESTILOS GLOBAIS (Tiptap + ProseMirror)
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

      /* ═══ Tiptap / ProseMirror 编辑器样式 ═══ */
      .tiptap-editor {
        min-height: 420px;
        padding: 20px 24px;
        font-family: 'Inter', sans-serif;
        font-size: 15px;
        line-height: 1.75;
        color: #1E293B;
        outline: none;
      }
      .tiptap-editor > * + * {
        margin-top: 0.75em;
      }
      .tiptap-editor p {
        margin: 0;
      }
      .tiptap-editor h1 {
        font-size: 1.75em;
        font-weight: 700;
        color: ${INK};
        margin-top: 1.2em;
        margin-bottom: 0.4em;
        line-height: 1.3;
      }
      .tiptap-editor h2 {
        font-size: 1.4em;
        font-weight: 700;
        color: ${INK};
        margin-top: 1.1em;
        margin-bottom: 0.35em;
        line-height: 1.3;
      }
      .tiptap-editor h3 {
        font-size: 1.15em;
        font-weight: 600;
        color: ${INK};
        margin-top: 1em;
        margin-bottom: 0.3em;
        line-height: 1.35;
      }
      .tiptap-editor ul, .tiptap-editor ol {
        padding-left: 1.6em;
        margin: 0.5em 0;
      }
      .tiptap-editor li {
        margin: 0.15em 0;
      }
      .tiptap-editor li > p {
        margin: 0;
      }
      .tiptap-editor blockquote {
        border-left: 4px solid ${INK_2};
        padding-left: 1em;
        margin: 0.75em 0;
        background: #F8FAFB;
        color: #334155;
        font-style: italic;
      }
      .tiptap-editor a {
        color: ${INK_2};
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer;
      }
      .tiptap-editor a:hover {
        color: ${INK};
      }
      .tiptap-editor code {
        background: #F1F5F9;
        padding: 0.15em 0.4em;
        border-radius: 4px;
        font-size: 0.9em;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      .tiptap-editor pre {
        background: #0F172A;
        color: #E2E8F0;
        padding: 1em;
        border-radius: 8px;
        overflow-x: auto;
        margin: 0.75em 0;
      }
      .tiptap-editor pre code {
        background: transparent;
        padding: 0;
        color: inherit;
      }
      .tiptap-editor hr {
        border: none;
        border-top: 2px solid ${LINE};
        margin: 1.5em 0;
      }
      .tiptap-editor img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 0.5em 0;
        display: block;
      }
      .tiptap-editor img.ProseMirror-selectednode {
        outline: 3px solid ${INK_2};
        outline-offset: 2px;
        border-radius: 8px;
      }
      .tiptap-editor p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        color: #94A3B8;
        pointer-events: none;
        height: 0;
        font-style: normal;
      }

      /* Toolbar */
      .tiptap-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 2px;
        padding: 8px 10px;
        border-bottom: 1px solid ${LINE};
        background: ${LINE_2};
      }
      .tiptap-toolbar button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: ${MUTED};
        cursor: pointer;
        transition: background 0.12s, color 0.12s;
      }
      .tiptap-toolbar button:hover {
        background: ${SURFACE};
        color: ${INK_2};
      }
      .tiptap-toolbar button.is-active {
        background: ${INK_2};
        color: #FFF;
      }
      .tiptap-toolbar button:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      .tiptap-toolbar .separator {
        width: 1px;
        height: 22px;
        background: ${LINE};
        margin: 0 4px;
      }
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════════
// ÁTOMOS (mantidos do original)
// ═══════════════════════════════════════════════════════════════

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
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`} style={{ borderColor: LINE }}>
      {noPad ? children : <div className="p-5">{children}</div>}
    </div>
  );
}

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

function StatusPill({
  tone,
  children,
}: {
  tone: "success" | "danger" | "warning" | "neutral" | "accent";
  children: React.ReactNode;
}) {
  const map = {
    success: { c: SUCCESS, bg: "#ECFDF5", b: "#D1FAE5" },
    danger: { c: DANGER, bg: "#FEF2F2", b: "#FEE2E2" },
    warning: { c: WARNING, bg: "#FFFBEB", b: "#FEF3C7" },
    neutral: { c: MUTED, bg: LINE_2, b: LINE },
    accent: { c: INK_2, bg: "#F0F7FA", b: "#D6E9F0" },
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
// TOOLBAR DO TIPTAP
// ═══════════════════════════════════════════════════════════════

function TiptapToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const Btn = ({
    onClick,
    isActive,
    disabled,
    title,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={isActive ? "is-active" : ""}
    >
      {children}
    </button>
  );

  return (
    <div className="tiptap-toolbar">
      <Btn
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Negrito (Ctrl+B)"
      >
        <Bold size={15} strokeWidth={2.5} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Itálico (Ctrl+I)"
      >
        <Italic size={15} strokeWidth={2.5} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Sublinhado (Ctrl+U)"
      >
        <Underline size={15} strokeWidth={2.5} />
      </Btn>

      <div className="separator" />

      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="Título 1"
      >
        <Heading1 size={15} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Título 2"
      >
        <Heading2 size={15} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="Título 3"
      >
        <Heading3 size={15} />
      </Btn>

      <div className="separator" />

      <Btn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Lista com marcadores"
      >
        <List size={15} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Lista numerada"
      >
        <ListOrdered size={15} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Citação"
      >
        <Quote size={15} />
      </Btn>

      <div className="separator" />

      <Btn
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        title="Alinhar à esquerda"
      >
        <AlignLeft size={15} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        title="Centrar"
      >
        <AlignCenter size={15} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        title="Alinhar à direita"
      >
        <AlignRight size={15} />
      </Btn>

      <div className="separator" />

      <Btn
        onClick={() => {
          const url = window.prompt("URL do link:");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        isActive={editor.isActive("link")}
        title="Inserir link"
      >
        <LinkIcon size={15} />
      </Btn>

      <Btn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Linha horizontal"
      >
        <Minus size={15} />
      </Btn>

      <div className="separator" />

      <Btn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Desfazer (Ctrl+Z)"
      >
        <Undo size={15} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Refazer (Ctrl+Y)"
      >
        <Redo size={15} />
      </Btn>
    </div>
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
  const [feedbackTipo, setFeedbackTipo] = useState<"erro" | "sucesso" | "info">("info");

  // ─── TIPTAP EDITOR ───
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      UnderlineExt,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "tiptap-link" },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      ImageResize.configure({
        inline: false,
        minWidth: 100,
        maxWidth: 900,
      }),
      Placeholder.configure({
        placeholder: "Escreve a notícia, adiciona fotos ou formata o texto...",
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor scroll-thin",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setForm((prev: any) => ({ ...prev, conteudo: html }));
    },
  });

  // Sincroniza conteúdo quando abrir form de edição
  useEffect(() => {
    if (editor && showForm && form.conteudo) {
      const current = editor.getHTML();
      if (current !== form.conteudo) {
        editor.commands.setContent(form.conteudo || "");
      }
    }
  }, [editor, showForm]);

  useEffect(() => {
    fetchPosts();
  }, []);

  function setMsg(tipo: "erro" | "sucesso" | "info", msg: string) {
    setFeedbackTipo(tipo);
    setFeedback(msg);
  }

  function traduzErro(err: any): string {
    const raw = String(err?.message || err?.error_description || err || "");
    if (raw.includes("row-level security") || raw.includes("violates row-level"))
      return "Bloqueado pelo RLS. Confirma que estás autenticado (login) e que as políticas permitem esta operação.";
    if (raw.includes("permission denied"))
      return "Sem permissão para esta operação (GRANT em falta).";
    if (raw.includes("JWT") || raw.includes("token"))
      return "Sessão inválida ou expirada. Faz login novamente.";
    if (raw.includes("does not exist") || raw.includes("column"))
      return `Coluna inexistente na tabela: ${raw}`;
    if (raw.includes("duplicate key"))
      return "Valor duplicado (slug já existe).";
    return raw || "Erro desconhecido.";
  }

  async function ensureAuth(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("[blog] Sem sessão ativa — RLS vai tratar como anon.");
        return false;
      }
      return true;
    } catch (e) {
      console.error("[blog] Erro ao verificar sessão:", e);
      return false;
    }
  }

  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog")
      .select("*")
      .order("data_publicacao", { ascending: false });

    if (error) {
      console.error("[blog] fetchPosts erro:", error);
      setMsg("erro", `Erro ao carregar artigos: ${traduzErro(error)}`);
      setPosts([]);
    } else {
      setPosts(data || []);
      setFeedback("");
    }
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null);
    setForm(formVazio);
    setImagemFile(null);
    setShowForm(true);
    setFeedback("");
    setTimeout(() => {
      editor?.commands.setContent("");
    }, 50);
  }

  function abrirFormEditar(post: BlogPost) {
    setEditando(post);
    setForm({
      titulo: post.titulo ?? "",
      resumo: post.resumo ?? "",
      conteudo: post.conteudo ?? "",
      legenda_imagem_capa: post.legenda_imagem_capa ?? "",
      data_publicacao: post.data_publicacao ?? new Date().toISOString().split("T")[0],
      autor: post.autor ?? "Redação",
      categoria: post.categoria ?? "Turismo",
      ativo: post.ativo ?? true,
      destaque: post.destaque ?? false,
    });
    setImagemFile(null);
    setShowForm(true);
    setFeedback("");
    setTimeout(() => {
      editor?.commands.setContent(post.conteudo || "");
    }, 50);
  }

  async function toggleAtivo(id: string, estadoAtual: boolean) {
    const authed = await ensureAuth();
    if (!authed) {
      setMsg("erro", "Precisas estar autenticado para alterar a visibilidade.");
      return;
    }

    const { error } = await supabase
      .from("blog")
      .update({ ativo: !estadoAtual })
      .eq("id", id);

    if (error) {
      console.error("[blog] toggleAtivo erro:", error);
      setMsg("erro", traduzErro(error));
      return;
    }
    setMsg("sucesso", estadoAtual ? "Artigo ocultado." : "Artigo publicado.");
    fetchPosts();
    setTimeout(() => setFeedback(""), 2000);
  }

  async function handleSave() {
    const conteudo = editor?.getHTML() || form.conteudo;

    if (!form.titulo || !conteudo || conteudo === "<p></p>") {
      setMsg("erro", "Título e conteúdo são obrigatórios.");
      return;
    }

    const authed = await ensureAuth();
    if (!authed) {
      setMsg(
        "erro",
        "Sem sessão ativa. Faz login para poder criar/editar (RLS bloqueia anon)."
      );
      return;
    }

    setSaving(true);
    setMsg("info", "A guardar artigo...");

    let imagem_url = editando?.imagem_url || null;

    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const path = `blog/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("galeria")
        .upload(path, imagemFile, { upsert: true });

      if (upErr) {
        console.error("[blog] upload erro:", upErr);
        setMsg("erro", `Erro no upload da imagem: ${traduzErro(upErr)}`);
        setSaving(false);
        return;
      }

      const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
      imagem_url = pub.publicUrl;
    }

    const payload: any = {
      titulo: form.titulo,
      resumo: form.resumo,
      conteudo,
      data_publicacao: form.data_publicacao,
      autor: form.autor,
      categoria: form.categoria,
      ativo: form.ativo,
      destaque: form.destaque,
      imagem_url,
      legenda_imagem_capa: form.legenda_imagem_capa || null,
    };

    if (editando) {
      const { error } = await supabase
        .from("blog")
        .update(payload)
        .eq("id", editando.id);

      if (error) {
        console.error("[blog] update erro:", error);
        setMsg("erro", `Erro ao atualizar: ${traduzErro(error)}`);
        setSaving(false);
        return;
      }

      setMsg("sucesso", "Artigo atualizado com sucesso!");
    } else {
      const { error } = await supabase.from("blog").insert(payload);

      if (error) {
        console.error("[blog] insert erro:", error);
        setMsg("erro", `Erro ao publicar: ${traduzErro(error)}`);
        setSaving(false);
        return;
      }

      setMsg("sucesso", "Novo artigo publicado!");
    }

    setTimeout(() => {
      setShowForm(false);
      setSaving(false);
      fetchPosts();
      setFeedback("");
    }, 1200);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja apagar este artigo permanentemente?")) return;

    const authed = await ensureAuth();
    if (!authed) {
      setMsg("erro", "Precisas estar autenticado para apagar artigos.");
      return;
    }

    const { error } = await supabase.from("blog").delete().eq("id", id);

    if (error) {
      console.error("[blog] delete erro:", error);
      setMsg("erro", traduzErro(error));
      return;
    }

    setMsg("sucesso", "Artigo apagado.");
    fetchPosts();
    setTimeout(() => setFeedback(""), 2000);
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
                  {editando
                    ? `Última alteração em ${tempoRelativo(editando.data_publicacao)}`
                    : "Rascunho"}
                </span>
              </div>
              <h1
                className={`${jakarta.className} text-[22px] font-bold tracking-tight truncate`}
                style={{ color: INK, letterSpacing: "-0.02em" }}
              >
                {editando ? editando.titulo : "Novo artigo"}
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
                style={{ background: INK_2 }}
                onMouseEnter={(e) => !saving && (e.currentTarget.style.background = INK)}
                onMouseLeave={(e) => !saving && (e.currentTarget.style.background = INK_2)}
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
                <PanelHeader title="Conteúdo" subtitle="Título, resumo e corpo editorial" />
                <div className="p-5 space-y-4">
                  <FormField label="Título" icon={<FileText size={10} />} required>
                    <input
                      value={form.titulo}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                      className={inputCls}
                      style={{ borderColor: LINE }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = INK_2;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,87,124,0.08)`;
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
                        e.currentTarget.style.borderColor = INK_2;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,87,124,0.08)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = LINE;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="Uma breve frase sobre o artigo"
                    />
                  </FormField>

                  {/* Editor Tiptap */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                        style={{ color: MUTED }}
                      >
                        <FileText size={10} /> Corpo do artigo{" "}
                        <span style={{ color: DANGER }}>*</span>
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
                            color: modoEditor === "visual" ? INK_2 : MUTED,
                            boxShadow:
                              modoEditor === "visual"
                                ? "0 1px 2px rgba(0,47,64,0.06)"
                                : "none",
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
                            color: modoEditor === "codigo" ? INK_2 : MUTED,
                            boxShadow:
                              modoEditor === "codigo"
                                ? "0 1px 2px rgba(0,47,64,0.06)"
                                : "none",
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
                        <>
                          <TiptapToolbar editor={editor} />
                          <EditorContent editor={editor} />
                        </>
                      ) : (
                        <textarea
                          value={editor?.getHTML() || form.conteudo || ""}
                          onChange={(e) => {
                            setForm({ ...form, conteudo: e.target.value });
                          }}
                          className="w-full h-[450px] p-4 text-[12.5px] focus:outline-none scroll-thin font-mono"
                          style={{ background: INK, color: "#E2E8F0", border: "none" }}
                          placeholder="<p>Insere aqui o HTML ou marcações LaTeX...</p>"
                        />
                      )}
                    </div>

                    {modoEditor === "codigo" && (
                      <p className="text-[10.5px] mt-1.5" style={{ color: SUBTLE }}>
                        Modo HTML: o conteúdo editado aqui não é refletido no editor visual. Volta ao modo Visual para continuar a editar normalmente.
                      </p>
                    )}
                  </div>
                </div>
              </Panel>
            </div>

            {/* Coluna lateral */}
            <div className="lg:col-span-4 space-y-4">

              {/* Publicação */}
              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Publicação" subtitle="Autoria e visibilidade" />
                <div className="p-5 space-y-4">
                  <FormField label="Autor" icon={<User size={10} />}>
                    <input
                      value={form.autor || ""}
                      onChange={(e) => setForm({ ...form, autor: e.target.value })}
                      className={inputCls}
                      style={{ borderColor: LINE }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = INK_2;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,87,124,0.08)`;
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
                        e.currentTarget.style.borderColor = INK_2;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,87,124,0.08)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = LINE;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="Ex: Turismo"
                    />
                  </FormField>

                  <FormField
                    label="Data de publicação"
                    icon={<Calendar size={10} />}
                    required
                  >
                    <input
                      type="date"
                      value={form.data_publicacao}
                      onChange={(e) => setForm({ ...form, data_publicacao: e.target.value })}
                      className={inputCls}
                      style={{ borderColor: LINE }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = INK_2;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,87,124,0.08)`;
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
                        onChange={(e) =>
                          setForm({ ...form, ativo: e.target.value === "true" })
                        }
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
                        onChange={(e) =>
                          setForm({ ...form, destaque: e.target.value === "true" })
                        }
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

              {/* Imagem de capa */}
              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Imagem de capa" subtitle="Visual principal" />
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

                  <FormField label="Legenda / créditos" icon={<FileText size={10} />}>
                    <input
                      value={form.legenda_imagem_capa || ""}
                      onChange={(e) =>
                        setForm({ ...form, legenda_imagem_capa: e.target.value })
                      }
                      className={inputCls}
                      style={{ borderColor: LINE }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = INK_2;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,87,124,0.08)`;
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
                    background:
                      feedbackTipo === "erro"
                        ? "#FEF2F2"
                        : feedbackTipo === "sucesso"
                        ? "#ECFDF5"
                        : "#F0F7FA",
                    borderColor:
                      feedbackTipo === "erro"
                        ? "#FEE2E2"
                        : feedbackTipo === "sucesso"
                        ? "#D1FAE5"
                        : "#D6E9F0",
                    color:
                      feedbackTipo === "erro"
                        ? DANGER
                        : feedbackTipo === "sucesso"
                        ? SUCCESS
                        : INK_2,
                  }}
                >
                  {feedbackTipo === "erro" ? (
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  ) : feedbackTipo === "sucesso" ? (
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
                <Newspaper size={9} strokeWidth={3} />
                Conteúdo
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {posts.length} artigo{posts.length !== 1 ? "s" : ""} ·{" "}
                {posts.filter((p) => p.ativo).length} público
                {posts.filter((p) => p.ativo).length !== 1 ? "s" : ""}
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
              style={{ background: INK_2 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = INK)}
              onMouseLeave={(e) => (e.currentTarget.style.background = INK_2)}
            >
              <Plus size={14} strokeWidth={3} />
              Novo artigo
            </button>
          </div>
        </div>

        {/* Feedback global */}
        {feedback && !showForm && (
          <div
            className="rounded-lg border p-3.5 flex items-start gap-3 anim-fade-up"
            style={{
              background:
                feedbackTipo === "erro"
                  ? "#FEF2F2"
                  : feedbackTipo === "sucesso"
                  ? "#ECFDF5"
                  : "#F0F7FA",
              borderColor:
                feedbackTipo === "erro"
                  ? "#FEE2E2"
                  : feedbackTipo === "sucesso"
                  ? "#D1FAE5"
                  : "#D6E9F0",
              color:
                feedbackTipo === "erro"
                  ? DANGER
                  : feedbackTipo === "sucesso"
                  ? SUCCESS
                  : INK_2,
            }}
          >
            {feedbackTipo === "erro" ? (
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            ) : feedbackTipo === "sucesso" ? (
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
            ) : (
              <Loader2 size={14} className="shrink-0 mt-0.5 animate-spin" />
            )}
            <p className="text-[12.5px] font-medium flex-1">{feedback}</p>
            <button
              onClick={() => setFeedback("")}
              className="shrink-0 w-6 h-6 rounded flex items-center justify-center"
              style={{ color: "inherit" }}
            >
              <X size={12} />
            </button>
          </div>
        )}

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
                    e.currentTarget.style.borderColor = INK_2;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,87,124,0.08)`;
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
                {busca ? (
                  <Search size={20} strokeWidth={2} />
                ) : (
                  <Inbox size={20} strokeWidth={2} />
                )}
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
                    style={{ background: INK_2 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = INK)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = INK_2)}
                  >
                    Limpar pesquisa
                  </button>
                ) : (
                  <button
                    onClick={abrirFormNovo}
                    className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white transition-colors"
                    style={{ background: INK_2 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = INK)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = INK_2)}
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
                <div className="flex items-stretch">
                  <div
                    className="w-1 shrink-0"
                    style={{ background: post.destaque ? ACCENT : "transparent" }}
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
                            style={{
                              background: LINE_2,
                              color: MUTED,
                              border: `1px solid ${LINE}`,
                            }}
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
                          e.currentTarget.style.color = INK_2;
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
                          e.currentTarget.style.color = INK_2;
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