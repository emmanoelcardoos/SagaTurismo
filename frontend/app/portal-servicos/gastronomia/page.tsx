"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Utensils, Plus, Loader2, Save, Image as ImageIcon, Phone,
  MapPin, Upload, Trash2, Sparkles, ArrowLeft, FileText,
  Camera, Layers, Eye, EyeOff, Pencil, Inbox, Search, X,
  Filter, Tag, CheckCircle2, AlertTriangle, ChefHat, Star,
  Hash, ExternalLink, ListChecks,
} from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── CORES (paleta Azure/Microsoft do portal) ───
const AZUL = "#0078D4";
const AZUL_ESCURO = "#005A9E";
const AMBAR = "#DAA520";
const AMBAR_LIGHT = "#FBBF24";
const VERMELHO = "#D13438";
const VERDE = "#168821";
const VERDE_LIGHT = "#22C55E";
const ROXO = "#7C3AED";

const inputCls =
  "w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-[#0078D4] focus:ring-4 focus:ring-[#0078D4]/10 transition-all placeholder:text-slate-400";
const labelCls =
  "flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2";

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

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
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

    let espParsed = [];
    if (typeof rest.especialidades === "string") {
      try {
        espParsed = JSON.parse(rest.especialidades);
      } catch (e) {}
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
    const path = `${pasta}/${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}.${ext}`;
    const { error } = await supabase.storage.from("gastronomia").upload(path, file);
    if (error) return null;
    const { data } = await supabase.storage
      .from("gastronomia")
      .getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSalvar() {
    if (!form.titulo) {
      setFeedback("Nome é obrigatório!");
      return;
    }
    setSaving(true);
    setFeedback("A enviar imagens...");

    try {
      let imagem_url = editando?.imagem_url || null;
      if (imagemUrlFile) imagem_url = await uploadImagem(imagemUrlFile, "vitrine");

      let imagem_capa = editando?.imagem_capa || null;
      if (imagemCapaFile)
        imagem_capa = await uploadImagem(imagemCapaFile, "capas");

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

      setFeedback("A guardar restaurante...");

      const payload = {
        ...form,
        imagem_url,
        imagem_capa,
        galeria: galeriaFinal.length > 0 ? galeriaFinal : null,
        especialidades: espLimpos.length > 0 ? espLimpos : null,
      };

      let erroBd;

      if (editando) {
        const { error } = await supabase
          .from("gastronomia")
          .update(payload)
          .eq("id", editando.id);
        erroBd = error;
      } else {
        const { error } = await supabase
          .from("gastronomia")
          .insert([{ ...payload, ordem: restaurantes.length + 1 }]);
        erroBd = error;
      }

      if (erroBd) throw new Error(erroBd.message);

      setFeedback("Salvo com sucesso!");
      setTimeout(() => {
        setShowForm(false);
        setFeedback("");
        fetchRestaurantes();
      }, 2000);
    } catch (err: any) {
      setFeedback(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover da vitrine?")) return;
    await supabase.from("gastronomia").delete().eq("id", id);
    fetchRestaurantes();
  }

  // ─── FILTRO ───
  const restaurantesFiltrados = restaurantes.filter((r) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      r.titulo?.toLowerCase().includes(termo) ||
      r.descricao_curta?.toLowerCase().includes(termo)
    );
  });

  // ═══════════════════════════════════════════════════════════════
  // VISTA: FORMULÁRIO
  // ═══════════════════════════════════════════════════════════════

  if (showForm) {
    return (
      <>
        <GlobalStyles />
        <div className={`${inter.className} space-y-5 pb-6 anim-fade-up`}>

          {/* Cabeçalho */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm shrink-0 flex items-center justify-center group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
              </div>
              <h1
                className={`${jakarta.className} text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate`}
              >
                {editando ? editando.titulo : "Construtor de restaurante"}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Preenche os dados, adiciona fotografias e destaca especialidades.
              </p>
            </div>
          </div>

          {/* Bloco 1: Informações + Fotografias */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})` }} />

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              {/* Coluna 1: Informações Básicas */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                  >
                    <FileText size={12} />
                  </div>
                  <h4 className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                    Informações básicas
                  </h4>
                </div>

                <FormField
                  label="Nome do estabelecimento"
                  icon={<Utensils size={11} />}
                  required
                >
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    className={inputCls}
                    placeholder="Ex: Restaurante Sabor da Serra"
                  />
                </FormField>

                <FormField label="Descrição curta" icon={<FileText size={11} />}>
                  <textarea
                    rows={3}
                    value={form.descricao_curta}
                    onChange={(e) =>
                      setForm({ ...form, descricao_curta: e.target.value })
                    }
                    className={`${inputCls} resize-y min-h-[80px]`}
                    placeholder="Resumo do restaurante..."
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="WhatsApp" icon={<Phone size={11} />}>
                    <div className="relative">
                      <Phone
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={form.whatsapp}
                        onChange={(e) =>
                          setForm({ ...form, whatsapp: e.target.value })
                        }
                        className={`${inputCls} pl-10`}
                        placeholder="94 90000-0000"
                      />
                    </div>
                  </FormField>
                  <FormField label="Link Google Maps" icon={<MapPin size={11} />}>
                    <div className="relative">
                      <MapPin
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={form.link_google_maps}
                        onChange={(e) =>
                          setForm({ ...form, link_google_maps: e.target.value })
                        }
                        className={`${inputCls} pl-10`}
                        placeholder="https://maps..."
                      />
                    </div>
                  </FormField>
                </div>

                <FormField
                  label="Visibilidade"
                  icon={<Eye size={11} />}
                  hint="Se oculto, não aparece no portal público."
                >
                  <select
                    value={String(form.ativo)}
                    onChange={(e) =>
                      setForm({ ...form, ativo: e.target.value === "true" })
                    }
                    className={inputCls}
                  >
                    <option value="true">Público (Ativo)</option>
                    <option value="false">Oculto</option>
                  </select>
                </FormField>
              </div>

              {/* Coluna 2: Fotografias */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})` }}
                  >
                    <Camera size={12} />
                  </div>
                  <h4 className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                    Fotografias
                  </h4>
                </div>

                <FormField
                  label="Foto da vitrine (card principal)"
                  icon={<ImageIcon size={11} />}
                >
                  <label
                    className="flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-xl p-5 cursor-pointer text-xs font-bold transition-all group"
                    style={{
                      background: imagemUrlFile
                        ? `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)`
                        : "#F8FAFC",
                      borderColor: imagemUrlFile ? `${VERDE}50` : "#CBD5E1",
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setImagemUrlFile(e.target.files?.[0] || null)
                      }
                    />
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                      style={{
                        background: imagemUrlFile
                          ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
                          : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                      }}
                    >
                      {imagemUrlFile ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Camera size={16} />
                      )}
                    </div>
                    <span
                      className="truncate max-w-[200px] text-center"
                      style={{ color: imagemUrlFile ? VERDE : AZUL }}
                    >
                      {imagemUrlFile
                        ? imagemUrlFile.name
                        : editando?.imagem_url
                        ? "Substituir imagem"
                        : "Anexar imagem da vitrine"}
                    </span>
                  </label>
                </FormField>

                <FormField
                  label="Foto de capa (página interna)"
                  icon={<ImageIcon size={11} />}
                >
                  <label
                    className="flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-xl p-5 cursor-pointer text-xs font-bold transition-all group"
                    style={{
                      background: imagemCapaFile
                        ? `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)`
                        : "#F8FAFC",
                      borderColor: imagemCapaFile ? `${VERDE}50` : "#CBD5E1",
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setImagemCapaFile(e.target.files?.[0] || null)
                      }
                    />
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                      style={{
                        background: imagemCapaFile
                          ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
                          : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                      }}
                    >
                      {imagemCapaFile ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Camera size={16} />
                      )}
                    </div>
                    <span
                      className="truncate max-w-[200px] text-center"
                      style={{ color: imagemCapaFile ? VERDE : AZUL }}
                    >
                      {imagemCapaFile
                        ? imagemCapaFile.name
                        : editando?.imagem_capa
                        ? "Substituir capa"
                        : "Anexar capa interna"}
                    </span>
                  </label>
                </FormField>

                <FormField
                  label="Galeria de fotos"
                  icon={<Layers size={11} />}
                  hint="Aparecem em carrossel na página interna."
                >
                  <label
                    className="flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-xl p-5 cursor-pointer text-xs font-bold transition-all group"
                    style={{
                      background:
                        galeriaFiles.length > 0
                          ? `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)`
                          : "#F8FAFC",
                      borderColor:
                        galeriaFiles.length > 0 ? `${VERDE}50` : "#CBD5E1",
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files)
                          setGaleriaFiles(Array.from(e.target.files));
                      }}
                    />
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                      style={{
                        background:
                          galeriaFiles.length > 0
                            ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
                            : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                      }}
                    >
                      {galeriaFiles.length > 0 ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Layers size={16} />
                      )}
                    </div>
                    <span
                      className="truncate max-w-[200px] text-center"
                      style={{
                        color: galeriaFiles.length > 0 ? VERDE : AZUL,
                      }}
                    >
                      {galeriaFiles.length > 0
                        ? `${galeriaFiles.length} fotos novas`
                        : "Adicionar fotos à galeria"}
                    </span>
                  </label>
                </FormField>
              </div>
            </div>
          </div>

          {/* Bloco 2: Especialidades */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AMBAR}, ${AMBAR_LIGHT})` }} />

            <div
              className="px-5 py-4 border-b border-slate-100 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${AMBAR}04, ${AMBAR}01)` }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
              >
                <ChefHat size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`${jakarta.className} text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap`}>
                  Especialidades / destaques do cardápio
                  {especialidades.filter((e) => e.titulo.trim()).length > 0 && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        background: `${AMBAR}10`,
                        color: AMBAR,
                        borderColor: `${AMBAR}25`,
                      }}
                    >
                      {especialidades.filter((e) => e.titulo.trim()).length}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pratos ou destaques que aparecem na página interna
                </p>
              </div>
              <button
                onClick={addEsp}
                className={`${jakarta.className} text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 shrink-0`}
                style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
              >
                <Plus size={13} /> Adicionar
              </button>
            </div>

            <div className="p-5">
              {especialidades.filter((e) => e.titulo.trim()).length === 0 &&
              especialidades.length <= 1 &&
              !especialidades[0]?.titulo ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                    }}
                  >
                    <ChefHat size={24} />
                  </div>
                  <div>
                    <p className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                      Sem especialidades ainda
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-[300px] mx-auto">
                      Adiciona os pratos ou destaques do restaurante para
                      aparecerem no portal.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {especialidades.map((item, index) => (
                  <div
                    key={index}
                    style={{ animationDelay: `${index * 30}ms` }}
                    className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 hover:bg-white hover:border-slate-300 transition-all anim-fade-up"
                  >
                    {/* Header do item */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                          }}
                        >
                          {index + 1}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate">
                          Especialidade {index + 1}
                        </span>
                      </div>
                      <button
                        onClick={() => removeEsp(index)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#D13438] hover:bg-red-50 transition-colors shrink-0"
                        title="Remover especialidade"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Campos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        label="Nome da especialidade"
                        icon={<Tag size={10} />}
                      >
                        <input
                          type="text"
                          value={item.titulo}
                          onChange={(e) =>
                            handleEspChange(index, "titulo", e.target.value)
                          }
                          placeholder="Ex: Carnes nobres"
                          className={inputCls}
                        />
                      </FormField>

                      <FormField
                        label="Fotografia (opcional)"
                        icon={<Camera size={10} />}
                      >
                        <label
                          className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl px-3 py-2.5 cursor-pointer text-[11px] font-bold transition-all w-full"
                          style={{
                            background:
                              item.file || item.imagem_url
                                ? `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)`
                                : "white",
                            borderColor:
                              item.file || item.imagem_url
                                ? `${VERDE}40`
                                : "#CBD5E1",
                            color:
                              item.file || item.imagem_url ? VERDE : AZUL,
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleEspChange(
                                index,
                                "file",
                                e.target.files?.[0] || null
                              )
                            }
                          />
                          {item.file ? (
                            <>
                              <CheckCircle2 size={13} /> Foto pronta
                            </>
                          ) : item.imagem_url ? (
                            <>
                              <CheckCircle2 size={13} /> Tem foto
                            </>
                          ) : (
                            <>
                              <Upload size={13} /> Anexar foto
                            </>
                          )}
                        </label>
                      </FormField>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {feedback && (
              <p
                className="text-xs font-bold flex items-center gap-2"
                style={{
                  color: feedback.toLowerCase().includes("obrigat") ||
                    feedback.toLowerCase().includes("erro")
                    ? VERMELHO
                    : feedback.toLowerCase().includes("sucesso")
                    ? VERDE
                    : AZUL,
                }}
              >
                {feedback.toLowerCase().includes("obrigat") ||
                feedback.toLowerCase().includes("erro") ? (
                  <AlertTriangle size={13} />
                ) : feedback.toLowerCase().includes("sucesso") ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <Loader2 size={13} className="animate-spin" />
                )}
                {feedback}
              </p>
            )}

            <button
              onClick={handleSalvar}
              disabled={saving}
              className={`${jakarta.className} sm:ml-auto text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0 shrink-0`}
              style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {saving
                ? "A guardar..."
                : editando
                ? "Guardar alterações"
                : "Publicar restaurante"}
            </button>
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
      <div className={`${inter.className} space-y-6`}>

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 anim-fade-up">
          <div>
            <h1 className={`${jakarta.className} text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight`}>
              Vitrine gastronómica
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
              <Sparkles size={14} style={{ color: AMBAR }} />
              {restaurantes.length} estabelecimento
              {restaurantes.length !== 1 ? "s" : ""} no portal
            </p>
          </div>

          <button
            onClick={abrirNovo}
            className={`${jakarta.className} self-start sm:self-auto text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5`}
            style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
          >
            <Plus size={14} /> Novo restaurante
          </button>
        </div>

        {/* Busca */}
        {restaurantes.length > 0 && (
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
                  <strong className="text-slate-800 font-bold">
                    {restaurantesFiltrados.length}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-slate-800 font-bold">
                    {restaurantes.length}
                  </strong>{" "}
                  estabelecimento(s)
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Buscar nome ou descrição..."
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
            <p className="text-xs text-slate-400 font-medium">
              A carregar restaurantes...
            </p>
          </div>
        ) : restaurantesFiltrados.length === 0 ? (
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
              {busca ? "Nenhum resultado" : "Nenhum restaurante cadastrado"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-5">
              {busca
                ? "Ajusta a pesquisa para encontrares estabelecimentos."
                : "Cria o primeiro restaurante para aparecer na vitrine do portal."}
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
                onClick={abrirNovo}
                className={`${jakarta.className} text-white px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5`}
                style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
              >
                <Plus size={14} /> Novo restaurante
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurantesFiltrados.map((rest, idx) => (
              <article
                key={rest.id}
                style={{ animationDelay: `${120 + idx * 30}ms` }}
                className={`relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 anim-fade-up group ${
                  !rest.ativo ? "opacity-70" : ""
                }`}
              >
                {/* Barra gradiente */}
                <div
                  className="h-0.5"
                  style={{
                    background: rest.ativo
                      ? `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})`
                      : `linear-gradient(90deg, #64748B, #94A3B8)`,
                  }}
                />

                {/* Thumbnail */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {rest.imagem_url ? (
                    <img
                      src={rest.imagem_url}
                      alt={rest.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white"
                      style={{
                        background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                      }}
                    >
                      <Utensils size={36} className="opacity-40" />
                    </div>
                  )}

                  {/* Badge de especialidades (top-right) */}
                  {rest.especialidades &&
                    Array.isArray(rest.especialidades) &&
                    rest.especialidades.length > 0 && (
                      <div className="absolute top-4 right-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm"
                          style={{
                            background: "rgba(255,255,255,0.92)",
                            color: AMBAR,
                            borderColor: `${AMBAR}25`,
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          <ChefHat size={10} /> {rest.especialidades.length}
                        </span>
                      </div>
                    )}
                </div>

                {/* Corpo */}
                <div className="p-4">
                  <h3
                    className={`${jakarta.className} text-base font-bold text-slate-900 line-clamp-2 leading-snug mb-2`}
                  >
                    {rest.titulo}
                  </h3>

                  {rest.descricao_curta && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {rest.descricao_curta}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <StatusBadge ativo={rest.ativo} />
                    {rest.galeria && rest.galeria.length > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                        style={{ background: "#F1F5F9", color: "#475569" }}
                      >
                        <Layers size={9} /> {rest.galeria.length}
                      </span>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirEditar(rest)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#0078D4] hover:bg-[#0078D4]/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(rest.id)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#D13438] hover:bg-red-50 transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {rest.whatsapp && (
                      <a
                        href={`https://wa.me/55${rest.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold flex items-center gap-1 transition-colors"
                        style={{ color: VERDE }}
                      >
                        <Phone size={11} /> Contactar
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