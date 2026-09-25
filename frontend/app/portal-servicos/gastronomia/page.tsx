"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Utensils, Plus, Loader2, Save, Image as ImageIcon, Phone,
  MapPin, Upload, Trash2, ArrowLeft, FileText,
  Camera, Layers, Eye, EyeOff, Pencil, Inbox, Search, X,
  Tag, CheckCircle2, AlertTriangle, ChefHat, ExternalLink,
  Images, Filter, MoreHorizontal,
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

// ═══════════════════════════════════════════════════════════════
// PÁGINA
// ═══════════════════════════════════════════════════════════════

export default function PortalGastronomia() {
  const [restaurantes, setRestaurantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [busca, setBusca] = useState("");

  const formVazio = {
    titulo: "",
    descricao_curta: "",
    whatsapp: "",
    link_google_maps: "",
    ativo: true,
  };
  const [form, setForm] = useState(formVazio);
  const [editando, setEditando] = useState<any | null>(null);

  const [imagemUrlFile, setImagemUrlFile] = useState<File | null>(null);
  const [imagemCapaFile, setImagemCapaFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([
    { titulo: "", file: null, imagem_url: "" },
  ]);

  useEffect(() => {
    fetchRestaurantes();
  }, []);

  async function fetchRestaurantes() {
    setLoading(true);
    const { data } = await supabase
      .from("gastronomia")
      .select("*")
      .order("ordem", { ascending: true });
    setRestaurantes(data || []);
    setLoading(false);
  }

  function abrirNovo() {
    setEditando(null);
    setForm(formVazio);
    setImagemUrlFile(null);
    setImagemCapaFile(null);
    setGaleriaFiles([]);
    setEspecialidades([{ titulo: "", file: null, imagem_url: "" }]);
    setFeedback("");
    setShowForm(true);
  }

  function abrirEditar(rest: any) {
    setEditando(rest);
    setForm({
      titulo: rest.titulo,
      descricao_curta: rest.descricao_curta || "",
      whatsapp: rest.whatsapp || "",
      link_google_maps: rest.link_google_maps || "",
      ativo: rest.ativo ?? true,
    });
    setImagemUrlFile(null);
    setImagemCapaFile(null);
    setGaleriaFiles([]);
    setFeedback("");

    let espParsed: any[] = [];
    if (typeof rest.especialidades === "string") {
      try { espParsed = JSON.parse(rest.especialidades); } catch (e) {}
    } else if (Array.isArray(rest.especialidades)) {
      espParsed = rest.especialidades;
    }

    setEspecialidades(
      espParsed.length > 0
        ? espParsed.map((e: any) => ({ ...e, file: null }))
        : [{ titulo: "", file: null, imagem_url: "" }]
    );
    setShowForm(true);
  }

  const addEsp = () =>
    setEspecialidades([
      ...especialidades,
      { titulo: "", file: null, imagem_url: "" },
    ]);

  const removeEsp = (index: number) =>
    setEspecialidades(especialidades.filter((_, i) => i !== index));

  const handleEspChange = (index: number, field: string, value: any) => {
    const novos = [...especialidades];
    novos[index] = { ...novos[index], [field]: value };
    setEspecialidades(novos);
  };

  async function uploadImagem(file: File, pasta: string): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `${pasta}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from("gastronomia").upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from("gastronomia").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSalvar() {
    if (!form.titulo) {
      setFeedback("Nome do estabelecimento é obrigatório.");
      return;
    }
    setSaving(true);
    setFeedback("Enviando imagens...");

    try {
      let imagem_url = editando?.imagem_url || null;
      if (imagemUrlFile) imagem_url = await uploadImagem(imagemUrlFile, "vitrine");

      let imagem_capa = editando?.imagem_capa || null;
      if (imagemCapaFile) imagem_capa = await uploadImagem(imagemCapaFile, "capas");

      let galeriaFinal = editando?.galeria || [];
      if (galeriaFiles.length > 0) {
        const novasUrls = [];
        for (const file of galeriaFiles) {
          const url = await uploadImagem(file, "galeria");
          if (url) novasUrls.push(url);
        }
        galeriaFinal = [...galeriaFinal, ...novasUrls];
      }

      const espLimpos = [];
      for (const esp of especialidades) {
        if (!esp.titulo.trim()) continue;
        let espUrl = esp.imagem_url;
        if (esp.file) {
          const uploadedUrl = await uploadImagem(esp.file, "especialidades");
          if (uploadedUrl) espUrl = uploadedUrl;
        }
        espLimpos.push({ titulo: esp.titulo, imagem_url: espUrl });
      }

      setFeedback("Salvando restaurante...");

      const payload = {
        ...form,
        imagem_url,
        imagem_capa,
        galeria: galeriaFinal.length > 0 ? galeriaFinal : null,
        especialidades: espLimpos.length > 0 ? espLimpos : null,
      };

      let erroBd;
      if (editando) {
        const { error } = await supabase.from("gastronomia").update(payload).eq("id", editando.id);
        erroBd = error;
      } else {
        const { error } = await supabase.from("gastronomia").insert([{ ...payload, ordem: restaurantes.length + 1 }]);
        erroBd = error;
      }
      if (erroBd) throw new Error(erroBd.message);

      setFeedback("Salvo com sucesso.");
      setTimeout(() => {
        setShowForm(false);
        setFeedback("");
        fetchRestaurantes();
      }, 1500);
    } catch (err: any) {
      setFeedback(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover da vitrine permanentemente?")) return;
    await supabase.from("gastronomia").delete().eq("id", id);
    fetchRestaurantes();
  }

  const restaurantesFiltrados = restaurantes.filter((r) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      r.titulo?.toLowerCase().includes(termo) ||
      r.descricao_curta?.toLowerCase().includes(termo)
    );
  });

  const especialidadesValidas = especialidades.filter((e) => e.titulo.trim());

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
                  <Utensils size={9} strokeWidth={3} />
                  {editando ? "Editar" : "Novo"}
                </span>
                <span className="text-[11px]" style={{ color: MUTED }}>
                  {editando ? `Ordem ${editando.ordem || 0}` : "Rascunho"}
                </span>
              </div>
              <h1
                className={`${jakarta.className} text-[22px] font-bold tracking-tight truncate`}
                style={{ color: INK, letterSpacing: "-0.02em" }}
              >
                {editando ? editando.titulo : "Novo restaurante"}
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
                {saving ? "Salvando..." : editando ? "Salvar" : "Publicar"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Coluna principal */}
            <div className="lg:col-span-8 space-y-4">

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Identificação" subtitle="Nome e descrição" />
                <div className="p-5 space-y-4">
                  <FormField label="Nome do estabelecimento" icon={<Utensils size={10} />} required>
                    <input
                      type="text"
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
                      placeholder="Ex: Restaurante Sabor da Serra"
                    />
                  </FormField>

                  <FormField label="Descrição curta" icon={<FileText size={10} />}>
                    <textarea
                      rows={3}
                      value={form.descricao_curta}
                      onChange={(e) => setForm({ ...form, descricao_curta: e.target.value })}
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
                      placeholder="Resumo do restaurante, tipo de cozinha, ambiente..."
                    />
                  </FormField>
                </div>
              </Panel>

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Contato e localização" subtitle="WhatsApp e link do mapa" />
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

                  <FormField label="Link Google Maps" icon={<MapPin size={10} />}>
                    <input
                      type="text"
                      value={form.link_google_maps}
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

              {/* Especialidades */}
              <Panel noPad className="anim-fade-up">
                <PanelHeader
                  title="Especialidades"
                  subtitle="Pratos e destaques do cardápio"
                  badge={
                    especialidadesValidas.length > 0 ? (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded num"
                        style={{ background: LINE_2, color: MUTED }}
                      >
                        {especialidadesValidas.length}
                      </span>
                    ) : null
                  }
                  action={
                    <button
                      onClick={addEsp}
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

                {especialidades.length === 0 ||
                (especialidades.length === 1 && !especialidades[0].titulo.trim()) ? (
                  <div className="py-12 px-6 text-center">
                    <div
                      className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                      style={{ background: LINE_2, color: MUTED }}
                    >
                      <ChefHat size={20} strokeWidth={2} />
                    </div>
                    <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                      Sem especialidades ainda
                    </p>
                    <p className="text-[11.5px] mt-1 max-w-md mx-auto" style={{ color: MUTED }}>
                      Adiciona os pratos ou destaques que aparecem na página interna do restaurante.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: LINE_2 }}>
                    {especialidades.map((item, index) => (
                      <div key={index} className="p-4 anim-fade-up" style={{ animationDelay: `${index * 20}ms` }}>
                        {/* Header do item */}
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
                              Especialidade {index + 1}
                            </span>
                          </div>
                          <button
                            onClick={() => removeEsp(index)}
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
                            title="Remover especialidade"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Grid de campos */}
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                          <FormField
                            label="Nome do prato"
                            icon={<Tag size={10} />}
                            className="md:col-span-4"
                          >
                            <input
                              type="text"
                              value={item.titulo}
                              onChange={(e) => handleEspChange(index, "titulo", e.target.value)}
                              placeholder="Ex: Carnes nobres, Frutos do mar..."
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

                          <FormField
                            label="Foto"
                            icon={<Camera size={10} />}
                            className="md:col-span-2"
                          >
                            <label
                              className="flex items-center justify-center gap-1.5 border-2 border-dashed rounded-md h-[42px] cursor-pointer text-[11.5px] font-semibold transition-colors w-full"
                              style={{
                                background: item.file || item.imagem_url ? "#ECFDF5" : SURFACE,
                                borderColor: item.file || item.imagem_url ? "#D1FAE5" : LINE,
                                color: item.file || item.imagem_url ? SUCCESS : MUTED,
                              }}
                              title={item.file?.name || item.imagem_url || "Anexar foto"}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleEspChange(index, "file", e.target.files?.[0] || null)
                                }
                              />
                              {item.file || item.imagem_url ? (
                                <>
                                  <CheckCircle2 size={13} />
                                  <span className="hidden sm:inline">Anexada</span>
                                </>
                              ) : (
                                <>
                                  <Upload size={13} />
                                  <span className="hidden sm:inline">Anexar</span>
                                </>
                              )}
                            </label>
                          </FormField>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                <PanelHeader title="Foto da vitrine" subtitle="Card principal" />
                <div className="p-5">
                  <label
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md p-5 cursor-pointer text-[12px] font-semibold transition-colors"
                    style={{
                      background: imagemUrlFile ? "#ECFDF5" : BG,
                      borderColor: imagemUrlFile ? `${SUCCESS}50` : LINE,
                      color: imagemUrlFile ? SUCCESS : MUTED,
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setImagemUrlFile(e.target.files?.[0] || null)}
                    />
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{
                        background: imagemUrlFile ? SUCCESS : LINE_2,
                        color: imagemUrlFile ? "#FFF" : MUTED,
                      }}
                    >
                      {imagemUrlFile ? <CheckCircle2 size={14} /> : <Camera size={14} />}
                    </div>
                    <span className="truncate max-w-[200px] text-center">
                      {imagemUrlFile
                        ? imagemUrlFile.name
                        : editando?.imagem_url
                        ? "Substituir imagem"
                        : "Anexar imagem"}
                    </span>
                  </label>

                  {editando?.imagem_url && !imagemUrlFile && (
                    <div className="mt-3 rounded-md overflow-hidden border" style={{ borderColor: LINE }}>
                      <img src={editando.imagem_url} alt="Vitrine" className="w-full h-32 object-cover" />
                    </div>
                  )}
                </div>
              </Panel>

              <Panel noPad className="anim-fade-up">
                <PanelHeader title="Foto de capa" subtitle="Página interna" />
                <div className="p-5">
                  <label
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md p-5 cursor-pointer text-[12px] font-semibold transition-colors"
                    style={{
                      background: imagemCapaFile ? "#ECFDF5" : BG,
                      borderColor: imagemCapaFile ? `${SUCCESS}50` : LINE,
                      color: imagemCapaFile ? SUCCESS : MUTED,
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setImagemCapaFile(e.target.files?.[0] || null)}
                    />
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{
                        background: imagemCapaFile ? SUCCESS : LINE_2,
                        color: imagemCapaFile ? "#FFF" : MUTED,
                      }}
                    >
                      {imagemCapaFile ? <CheckCircle2 size={14} /> : <Camera size={14} />}
                    </div>
                    <span className="truncate max-w-[200px] text-center">
                      {imagemCapaFile
                        ? imagemCapaFile.name
                        : editando?.imagem_capa
                        ? "Substituir capa"
                        : "Anexar capa"}
                    </span>
                  </label>

                  {editando?.imagem_capa && !imagemCapaFile && (
                    <div className="mt-3 rounded-md overflow-hidden border" style={{ borderColor: LINE }}>
                      <img src={editando.imagem_capa} alt="Capa" className="w-full h-32 object-cover" />
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
                        ? `${galeriaFiles.length} fotos novas`
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
                      : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("salvo")
                      ? "#ECFDF5"
                      : "#EFF6FF",
                    borderColor: feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro")
                      ? "#FEE2E2"
                      : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("salvo")
                      ? "#D1FAE5"
                      : "#DBEAFE",
                    color: feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro")
                      ? DANGER
                      : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("salvo")
                      ? SUCCESS
                      : ACCENT,
                  }}
                >
                  {feedback.toLowerCase().includes("obrigat") || feedback.toLowerCase().includes("erro") ? (
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  ) : feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("salvo") ? (
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
                <Utensils size={9} strokeWidth={3} />
                Gastronomia
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {restaurantes.length} registro{restaurantes.length !== 1 ? "s" : ""} · {restaurantes.filter((r) => r.ativo).length} público{restaurantes.filter((r) => r.ativo).length !== 1 ? "s" : ""}
              </span>
            </div>
            <h1
              className={`${jakarta.className} text-[26px] font-bold tracking-tight`}
              style={{ color: INK, letterSpacing: "-0.025em" }}
            >
              Gastronomia
            </h1>
            <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
              Restaurantes, bares e estabelecimentos gastronômicos do município.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/gastronomia"
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
              Novo restaurante
            </button>
          </div>
        </div>

        {/* Busca */}
        {restaurantes.length > 0 && (
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
                  placeholder="Buscar por nome ou descrição..."
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
                  {restaurantesFiltrados.length} de {restaurantes.length}
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
        ) : restaurantesFiltrados.length === 0 ? (
          <Panel noPad className="anim-fade">
            <div className="py-16 text-center">
              <div
                className="w-11 h-11 rounded-lg mx-auto mb-3 flex items-center justify-center"
                style={{ background: LINE_2, color: MUTED }}
              >
                {busca ? <Search size={20} strokeWidth={2} /> : <Inbox size={20} strokeWidth={2} />}
              </div>
              <p className={`${jakarta.className} text-[13px] font-bold`} style={{ color: INK }}>
                {busca ? "Nenhum resultado" : "Nenhum restaurante ainda"}
              </p>
              <p className="text-[11.5px] mt-1 max-w-md mx-auto" style={{ color: MUTED }}>
                {busca
                  ? "Ajusta a pesquisa para encontrar estabelecimentos."
                  : "Cria o primeiro restaurante para aparecer no portal."}
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
                    Limpar busca
                  </button>
                ) : (
                  <button
                    onClick={abrirNovo}
                    className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white transition-colors"
                    style={{ background: INK }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = INK_2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                  >
                    <Plus size={14} strokeWidth={3} /> Novo restaurante
                  </button>
                )}
              </div>
            </div>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurantesFiltrados.map((rest, idx) => {
              const temEspecialidades =
                rest.especialidades &&
                Array.isArray(rest.especialidades) &&
                rest.especialidades.length > 0;

              return (
                <article
                  key={rest.id}
                  style={{
                    borderColor: LINE,
                    animationDelay: `${idx * 25}ms`,
                  }}
                  className={`bg-white border rounded-lg overflow-hidden hover:border-slate-300 transition-colors anim-fade-up group ${!rest.ativo ? "opacity-70" : ""}`}
                >
                  {/* Imagem */}
                  <div className="relative h-44 overflow-hidden" style={{ background: LINE_2 }}>
                    {rest.imagem_url ? (
                      <img
                        src={rest.imagem_url}
                        alt={rest.titulo}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ color: SUBTLE }}
                      >
                        <Utensils size={32} strokeWidth={1.5} />
                      </div>
                    )}

                    {/* Overlay badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {rest.ativo ? (
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
                        {rest.galeria && rest.galeria.length > 0 && (
                          <div
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold num"
                            style={{
                              background: "rgba(10,14,20,0.75)",
                              color: "#FFF",
                              backdropFilter: "blur(4px)",
                            }}
                          >
                            <Images size={9} />
                            {rest.galeria.length}
                          </div>
                        )}
                        {temEspecialidades && (
                          <div
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold num"
                            style={{
                              background: "rgba(10,14,20,0.75)",
                              color: "#FFF",
                              backdropFilter: "blur(4px)",
                            }}
                          >
                            <ChefHat size={9} />
                            {rest.especialidades.length}
                          </div>
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
                      {rest.titulo}
                    </h3>

                    {rest.descricao_curta && (
                      <p
                        className="text-[11.5px] line-clamp-2 leading-relaxed mb-3"
                        style={{ color: MUTED }}
                      >
                        {rest.descricao_curta}
                      </p>
                    )}

                    {/* Ações */}
                    <div
                      className="flex items-center justify-between pt-3 border-t"
                      style={{ borderColor: LINE_2 }}
                    >
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => abrirEditar(rest)}
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
                          onClick={() => handleDelete(rest.id)}
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

                      {rest.whatsapp && (
                        <a
                          href={`https://wa.me/258${rest.whatsapp.replace(/\D/g, "")}`}
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
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}