"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Building2, Plus, Loader2, Save, Image as ImageIcon, Phone,
  MapPin, ArrowLeft, FileText, Camera, Layers,
  Eye, EyeOff, Pencil, Inbox, Search, X, Tag, Star,
  CheckCircle2, AlertTriangle, AtSign, Images, ExternalLink, Trash2
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

function Estrelas({ valor, size = 11 }: { valor: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < valor ? "fill-current" : ""}
          style={{ color: i < valor ? WARNING : LINE }}
        />
      ))}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

export default function PortalHoteis() {
  const [hoteis, setHoteis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const formVazio = {
    nome: "",
    tipo: "Hotel",
    descricao: "",
    estrelas: 3,
    whatsapp: "",
    endereco: "",
    instagram: "",
    ativo: true,
  };
  const [form, setForm] = useState(formVazio);
  const [editando, setEditando] = useState<any | null>(null);

  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);

  useEffect(() => { fetchHoteis(); }, []);

  async function fetchHoteis() {
    setLoading(true);
    const { data } = await supabase.from("hoteis").select("*").order("nome");
    setHoteis(data || []);
    setLoading(false);
  }

  function abrirNovo() {
    setEditando(null);
    setForm(formVazio);
    setImagemFile(null);
    setGaleriaFiles([]);
    setFeedback("");
    setShowForm(true);
  }

  function abrirEditar(hotel: any) {
    setEditando(hotel);
    setForm({
      nome: hotel.nome,
      tipo: hotel.tipo,
      descricao: hotel.descricao || "",
      estrelas: hotel.estrelas || 3,
      whatsapp: hotel.whatsapp || "",
      endereco: hotel.endereco || "",
      instagram: hotel.instagram || "",
      ativo: hotel.ativo ?? true,
    });
    setImagemFile(null);
    setGaleriaFiles([]);
    setFeedback("");
    setShowForm(true);
  }

  async function uploadImagem(file: File, pasta: string): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `${pasta}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from("hoteis").upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from("hoteis").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSalvar() {
    if (!form.nome) { setFeedback("Nome é obrigatório."); return; }
    setSaving(true);
    setFeedback("A guardar...");

    try {
      let imagem_url = editando?.imagem_url || null;
      if (imagemFile) imagem_url = await uploadImagem(imagemFile, "capas");

      let galeriaFinal = editando?.galeria || [];
      if (galeriaFiles.length > 0) {
        const novasUrls = [];
        for (const file of galeriaFiles) {
          const url = await uploadImagem(file, "galeria");
          if (url) novasUrls.push(url);
        }
        galeriaFinal = [...galeriaFinal, ...novasUrls];
      }

      const payloadHotel = {
        nome: form.nome,
        tipo: form.tipo,
        descricao: form.descricao,
        estrelas: form.estrelas,
        whatsapp: form.whatsapp,
        endereco: form.endereco,
        instagram: form.instagram,
        ativo: form.ativo,
        imagem_url,
        galeria: galeriaFinal.length > 0 ? galeriaFinal : null,
      };

      let erroBd;
      if (editando) {
        const { error } = await supabase.from("hoteis").update(payloadHotel).eq("id", editando.id);
        erroBd = error;
      } else {
        const { error } = await supabase.from("hoteis").insert([payloadHotel]);
        erroBd = error;
      }
      if (erroBd) throw new Error(erroBd.message);

      setFeedback(editando ? "Alojamento atualizado." : "Alojamento publicado.");
      setTimeout(() => {
        setShowForm(false);
        setFeedback("");
        fetchHoteis();
      }, 1500);
    } catch (err: any) {
      setFeedback(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover permanentemente este alojamento?")) return;
    await supabase.from("hoteis").delete().eq("id", id);
    fetchHoteis();
  }

  async function toggleAtivo(id: string, estadoAtual: boolean) {
    await supabase.from("hoteis").update({ ativo: !estadoAtual }).eq("id", id);
    fetchHoteis();
  }

  // ─── FILTROS ───
  const tiposUnicos = Array.from(new Set(hoteis.map((h) => h.tipo).filter(Boolean)));
  const hoteisFiltrados = hoteis.filter((h) => {
    const termo = busca.toLowerCase();
    const passaBusca = !busca ||
      h.nome?.toLowerCase().includes(termo) ||
      h.tipo?.toLowerCase().includes(termo) ||
      h.endereco?.toLowerCase().includes(termo);
    const passaTipo = !filtroTipo || h.tipo === filtroTipo;
    return passaBusca && passaTipo;
  });

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
                  <Building2 size={9} strokeWidth={3} />
                  {editando ? "Editar" : "Novo"}
                </span>
                <span className="text-[11px]" style={{ color: MUTED }}>
                  {editando ? editando.tipo : "Rascunho"}
                </span>
              </div>
              <h1
                className={`${jakarta.className} text-[22px] font-bold tracking-tight truncate`}
                style={{ color: INK, letterSpacing: "-0.02em" }}
              >
                {editando ? editando.nome : "Novo alojamento"}
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
                onClick={handleSalvar}
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

            {/* Coluna principal */}
            <div className="lg:col-span-8 space-y-4">

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Identificação" subtitle="Nome, tipo e categoria" />
                <div className="p-5 space-y-4">
                  <FormField label="Nome do estabelecimento" icon={<Building2 size={10} />} required>
                    <input
                      type="text"
                      value={form.nome}
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
                      placeholder="Ex: Hotel Paraíso"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Tipo" icon={<Tag size={10} />}>
                      <select
                        value={form.tipo}
                        onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                        className={inputCls}
                        style={{ borderColor: LINE }}
                      >
                        <option>Hotel</option>
                        <option>Pousada</option>
                        <option>Pensão</option>
                        <option>Resort</option>
                      </select>
                    </FormField>

                    {form.tipo === "Hotel" && (
                      <FormField label="Estrelas" icon={<Star size={10} />}>
                        <select
                          value={form.estrelas}
                          onChange={(e) => setForm({ ...form, estrelas: parseInt(e.target.value) })}
                          className={inputCls}
                          style={{ borderColor: LINE }}
                        >
                          <option value="1">1 estrela</option>
                          <option value="2">2 estrelas</option>
                          <option value="3">3 estrelas</option>
                          <option value="4">4 estrelas</option>
                          <option value="5">5 estrelas</option>
                        </select>
                      </FormField>
                    )}
                  </div>

                  <FormField label="Descrição" icon={<FileText size={10} />}>
                    <textarea
                      rows={5}
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      className={`${inputCls} resize-y min-h-[130px]`}
                      style={{ borderColor: LINE }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = INK;
                        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(10,14,20,0.06)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = LINE;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="Serviços, comodidades, diferencias..."
                    />
                  </FormField>
                </div>
              </Panel>

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Contacto" subtitle="WhatsApp, Instagram e endereço" />
                <div className="p-5 grid grid-cols-2 gap-4">
                  <FormField label="WhatsApp" icon={<Phone size={10} />}>
                    <input
                      type="text"
                      value={form.whatsapp}
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

                  <FormField label="Instagram" icon={<AtSign size={10} />}>
                    <input
                      type="text"
                      value={form.instagram}
                      onChange={(e) => setForm({ ...form, instagram: e.target.value })}
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
                      placeholder="hotelparaiso"
                    />
                  </FormField>

                  <FormField label="Endereço" icon={<MapPin size={10} />} className="col-span-2">
                    <input
                      type="text"
                      value={form.endereco}
                      onChange={(e) => setForm({ ...form, endereco: e.target.value })}
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
                      placeholder="Rua, número, bairro..."
                    />
                  </FormField>
                </div>
              </Panel>
            </div>

            {/* Lateral */}
            <div className="lg:col-span-4 space-y-4">

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Publicação" subtitle="Visibilidade no portal" />
                <div className="p-5">
                  <FormField
                    label="Estado"
                    icon={<Eye size={10} />}
                    hint="Oculto não aparece no portal público."
                  >
                    <select
                      value={String(form.ativo)}
                      onChange={(e) => setForm({ ...form, ativo: e.target.value === "true" })}
                      className={inputCls}
                      style={{ borderColor: LINE }}
                    >
                      <option value="true">Público (Ativo)</option>
                      <option value="false">Oculto</option>
                    </select>
                  </FormField>
                </div>
              </Panel>

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Fotografia principal" subtitle="Imagem de capa" />
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
                        : editando?.imagem_url
                        ? "Substituir imagem"
                        : "Anexar imagem"}
                    </span>
                  </label>

                  {editando?.imagem_url && !imagemFile && (
                    <div className="mt-3 rounded-md overflow-hidden border" style={{ borderColor: LINE }}>
                      <img src={editando.imagem_url} alt="Capa" className="w-full h-32 object-cover" />
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
                      {editando.galeria.slice(0, 6).map((url: string, i: number) => (
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
                      : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("publicado") || feedback.toLowerCase().includes("atualizado")
                      ? "#ECFDF5"
                      : "#EFF6FF",
                    borderColor: feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro")
                      ? "#FEE2E2"
                      : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("publicado") || feedback.toLowerCase().includes("atualizado")
                      ? "#D1FAE5"
                      : "#DBEAFE",
                    color: feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro")
                      ? DANGER
                      : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("publicado") || feedback.toLowerCase().includes("atualizado")
                      ? SUCCESS
                      : ACCENT,
                  }}
                >
                  {feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro") ? (
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  ) : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("publicado") || feedback.toLowerCase().includes("atualizado") ? (
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
                <Building2 size={9} strokeWidth={3} />
                Alojamento
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {hoteis.length} registo{hoteis.length !== 1 ? "s" : ""} · {hoteis.filter((h) => h.ativo).length} público{hoteis.filter((h) => h.ativo).length !== 1 ? "s" : ""}
              </span>
            </div>
            <h1
              className={`${jakarta.className} text-[26px] font-bold tracking-tight`}
              style={{ color: INK, letterSpacing: "-0.025em" }}
            >
              Hotéis & Pousadas
            </h1>
            <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
              Alojamentos turísticos do município.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/hoteis"
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
              onClick={abrirNovo}
              className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 text-white transition-colors"
              style={{ background: INK }}
              onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
            >
              <Plus size={14} strokeWidth={3} />
              Novo alojamento
            </button>
          </div>
        </div>

        {/* Filtros */}
        {hoteis.length > 0 && (
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
                  placeholder="Buscar por nome, tipo ou endereço..."
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
                <Layers
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
                  {hoteisFiltrados.length} de {hoteis.length}
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
        ) : hoteisFiltrados.length === 0 ? (
          <Panel noPad className="anim-fade">
            <div className="py-16 text-center">
              <div
                className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                style={{ background: LINE_2, color: MUTED }}
              >
                {busca || filtroTipo ? <Search size={20} strokeWidth={2} /> : <Inbox size={20} strokeWidth={2} />}
              </div>
              <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                {busca || filtroTipo ? "Nenhum resultado" : "Nenhum alojamento ainda"}
              </p>
              <p className="text-[11.5px] mt-1 max-w-md mx-auto" style={{ color: MUTED }}>
                {busca || filtroTipo
                  ? "Ajusta a pesquisa ou filtro para encontrá-los."
                  : "Cria o primeiro alojamento para aparecer no portal."}
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
                    onClick={abrirNovo}
                    className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white transition-colors"
                    style={{ background: INK }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                  >
                    <Plus size={14} strokeWidth={3} /> Novo alojamento
                  </button>
                )}
              </div>
            </div>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hoteisFiltrados.map((hotel, idx) => (
              <article
                key={hotel.id}
                style={{
                  borderColor: LINE,
                  animationDelay: `${idx * 25}ms`,
                }}
                className={`bg-white border rounded-lg overflow-hidden hover:border-slate-300 transition-colors anim-fade-up group ${!hotel.ativo ? "opacity-70" : ""}`}
              >
                {/* Imagem */}
                <div className="relative h-44 overflow-hidden" style={{ background: LINE_2 }}>
                  {hotel.imagem_url ? (
                    <img
                      src={hotel.imagem_url}
                      alt={hotel.nome}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ color: SUBTLE }}
                    >
                      <Building2 size={32} strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Overlay badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {hotel.ativo ? (
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
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hotel.galeria && hotel.galeria.length > 0 && (
                        <div
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold num"
                          style={{
                            background: "rgba(10,14,20,0.75)",
                            color: "#FFF",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          <Images size={9} />
                          {hotel.galeria.length}
                        </div>
                      )}
                      {hotel.tipo && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            background: "rgba(10,14,20,0.75)",
                            color: "#FFF",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          <Tag size={8} />
                          {hotel.tipo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Corpo */}
                <div className="p-4">
                  <h3
                    className={`${jakarta.className} text-[14px] font-bold leading-snug line-clamp-2 mb-1`}
                    style={{ color: INK }}
                  >
                    {hotel.nome}
                  </h3>

                  {hotel.estrelas > 0 && hotel.tipo === "Hotel" && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Estrelas valor={hotel.estrelas} size={11} />
                      <span className="text-[10.5px] num font-medium" style={{ color: MUTED }}>
                        {hotel.estrelas} estrela{hotel.estrelas !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}

                  {hotel.endereco && (
                    <p
                      className="text-[11.5px] line-clamp-2 leading-relaxed mb-3 flex items-start gap-1.5"
                      style={{ color: MUTED }}
                    >
                      <MapPin size={11} className="shrink-0 mt-0.5" style={{ color: SUBTLE }} />
                      <span className="line-clamp-2">{hotel.endereco}</span>
                    </p>
                  )}

                  {/* Ações */}
                  <div
                    className="flex items-center justify-between pt-3 border-t"
                    style={{ borderColor: LINE_2 }}
                  >
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => toggleAtivo(hotel.id, hotel.ativo)}
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
                        title={hotel.ativo ? "Ocultar" : "Publicar"}
                      >
                        {hotel.ativo ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button
                        onClick={() => abrirEditar(hotel)}
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
                        onClick={() => handleDelete(hotel.id)}
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

                    {hotel.whatsapp && (
                      <a
                        href={`https://wa.me/258${hotel.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold inline-flex items-center gap-1 transition-opacity hover:opacity-70"
                        style={{ color: MUTED }}
                      >
                        <Phone size={11} />
                        Contato
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