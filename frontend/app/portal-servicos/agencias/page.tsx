"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Briefcase, Plus, Loader2, Save, Phone, Upload, Trash2,
  Sparkles, ArrowLeft, FileText, Camera, Layers, Eye, EyeOff,
  Pencil, Inbox, Search, X, Filter, Tag, CheckCircle2,
  AlertTriangle, Hash, AtSign, MapPin, ShieldCheck, Target,
  Award, Star, ExternalLink, MessageCircle, ListChecks,
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

export default function PortalAgencias() {
  const [agencias, setAgencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [busca, setBusca] = useState("");

  const formVazio = {
    nome: "",
    descricao_curta: "",
    sobre: "",
    cadastur: "",
    endereco: "",
    instagram: "",
    whatsapp: "",
    ativo: true,
  };
  const [form, setForm] = useState(formVazio);
  const [editando, setEditando] = useState<any | null>(null);

  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);

  const [especialidades, setEspecialidades] = useState<any[]>([
    { nome: "", file: null, imagem_url: "" },
  ]);

  useEffect(() => {
    fetchAgencias();
  }, []);

  async function fetchAgencias() {
    setLoading(true);
    const { data } = await supabase.from("agencias").select("*").order("nome");
    setAgencias(data || []);
    setLoading(false);
  }

  async function toggleAtivo(id: string, estadoAtual: boolean) {
    await supabase.from("agencias").update({ ativo: !estadoAtual }).eq("id", id);
    fetchAgencias();
  }

  function abrirNovo() {
    setEditando(null);
    setForm(formVazio);
    setCapaFile(null);
    setLogoFile(null);
    setGaleriaFiles([]);
    setEspecialidades([{ nome: "", file: null, imagem_url: "" }]);
    setFeedback("");
    setShowForm(true);
  }

  function abrirEditar(ag: any) {
    setEditando(ag);
    setForm({
      nome: ag.nome,
      descricao_curta: ag.descricao_curta || "",
      sobre: ag.sobre || "",
      cadastur: ag.cadastur || "",
      endereco: ag.endereco || "",
      instagram: ag.instagram || "",
      whatsapp: ag.whatsapp || "",
      ativo: ag.ativo ?? true,
    });
    setCapaFile(null);
    setLogoFile(null);
    setGaleriaFiles([]);
    setFeedback("");

    let espParsed = [];
    if (typeof ag.especialidades === "string") {
      try {
        espParsed = JSON.parse(ag.especialidades);
      } catch (e) {}
    } else if (Array.isArray(ag.especialidades)) {
      espParsed = ag.especialidades;
    }

    setEspecialidades(
      espParsed.length > 0
        ? espParsed.map((e: any) => ({ ...e, file: null }))
        : [{ nome: "", file: null, imagem_url: "" }]
    );
    setShowForm(true);
  }

  const addEsp = () =>
    setEspecialidades([
      ...especialidades,
      { nome: "", file: null, imagem_url: "" },
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
    const { error } = await supabase.storage.from("agencias").upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from("agencias").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSalvar() {
    if (!form.nome) {
      setFeedback("Nome da agência é obrigatório.");
      return;
    }
    setSaving(true);
    setFeedback("A processar ficheiros...");

    try {
      let capa_url = editando?.capa_url || null;
      if (capaFile) capa_url = await uploadImagem(capaFile, "capas");

      let logo_url = editando?.logo_url || null;
      if (logoFile) logo_url = await uploadImagem(logoFile, "logos");

      let galeriaFinal = editando?.galeria || [];
      if (galeriaFiles.length > 0) {
        const novasUrls = [];
        for (const file of galeriaFiles) {
          const url = await uploadImagem(file, "fotos");
          if (url) novasUrls.push(url);
        }
        galeriaFinal = [...galeriaFinal, ...novasUrls];
      }

      const espLimpos = [];
      for (const esp of especialidades) {
        if (!esp.nome.trim()) continue;
        let espUrl = esp.imagem_url;
        if (esp.file) {
          const uploadedUrl = await uploadImagem(esp.file, "especialidades");
          if (uploadedUrl) espUrl = uploadedUrl;
        }
        espLimpos.push({ nome: esp.nome, imagem_url: espUrl });
      }

      setFeedback("A guardar perfil...");
      const payload = {
        ...form,
        capa_url,
        logo_url,
        galeria: galeriaFinal.length > 0 ? galeriaFinal : null,
        especialidades: espLimpos.length > 0 ? espLimpos : null,
      };

      if (editando) await supabase.from("agencias").update(payload).eq("id", editando.id);
      else await supabase.from("agencias").insert([payload]);

      setFeedback("Agência salva com sucesso!");
      setTimeout(() => {
        setShowForm(false);
        setFeedback("");
        fetchAgencias();
      }, 2000);
    } catch (err: any) {
      setFeedback("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta agência permanentemente?")) return;
    await supabase.from("agencias").delete().eq("id", id);
    fetchAgencias();
  }

  // ─── FILTRO ───
  const agenciasFiltradas = agencias.filter((a) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      a.nome?.toLowerCase().includes(termo) ||
      a.cadastur?.toLowerCase().includes(termo) ||
      a.descricao_curta?.toLowerCase().includes(termo) ||
      a.endereco?.toLowerCase().includes(termo)
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
                {editando ? editando.nome : "Registro de agência"}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Preenche a identificação, contactos e especialidades da agência.
              </p>
            </div>
          </div>

          {/* Bloco 1: Informações + Contactos */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})` }} />

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              {/* Coluna 1: Informações da Empresa */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                  >
                    <FileText size={12} />
                  </div>
                  <h4 className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                    Informações da empresa
                  </h4>
                </div>

                <FormField label="Nome da agência" icon={<Briefcase size={11} />} required>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className={inputCls}
                    placeholder="Ex: SagaTur Turismo"
                  />
                </FormField>

                <FormField
                  label="Cadastur (registro)"
                  icon={<Award size={11} />}
                  hint="Registro oficial do Ministério do Turismo."
                >
                  <input
                    type="text"
                    value={form.cadastur}
                    onChange={(e) => setForm({ ...form, cadastur: e.target.value })}
                    className={inputCls}
                    placeholder="XX.XXXXXX.XX-X"
                  />
                </FormField>

                <FormField
                  label="Resumo (aparece no cartão)"
                  icon={<FileText size={11} />}
                >
                  <textarea
                    rows={2}
                    value={form.descricao_curta}
                    onChange={(e) =>
                      setForm({ ...form, descricao_curta: e.target.value })
                    }
                    className={`${inputCls} resize-y min-h-[70px]`}
                    placeholder="Uma frase sobre a agência..."
                  />
                </FormField>

                <FormField
                  label="História / sobre a agência"
                  icon={<FileText size={11} />}
                >
                  <textarea
                    rows={5}
                    value={form.sobre}
                    onChange={(e) => setForm({ ...form, sobre: e.target.value })}
                    className={`${inputCls} resize-y min-h-[130px]`}
                    placeholder="Descreve a agência, a sua história e serviços..."
                  />
                </FormField>
              </div>

              {/* Coluna 2: Contactos & Identidade Visual */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})` }}
                  >
                    <Phone size={12} />
                  </div>
                  <h4 className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                    Contactos e identidade visual
                  </h4>
                </div>

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
                  <FormField label="Instagram" icon={<AtSign size={11} />}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        @
                      </span>
                      <input
                        type="text"
                        value={form.instagram}
                        onChange={(e) =>
                          setForm({ ...form, instagram: e.target.value })
                        }
                        className={`${inputCls} pl-9`}
                        placeholder="sagatur"
                      />
                    </div>
                  </FormField>
                </div>

                <FormField label="Endereço físico" icon={<MapPin size={11} />}>
                  <div className="relative">
                    <MapPin
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={form.endereco}
                      onChange={(e) =>
                        setForm({ ...form, endereco: e.target.value })
                      }
                      className={`${inputCls} pl-10`}
                      placeholder="Rua, número, bairro..."
                    />
                  </div>
                </FormField>

                <FormField
                  label="Visibilidade"
                  icon={<Eye size={11} />}
                  hint="Se oculto, não aparece no diretório público."
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

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Logotipo" icon={<ImageIcon size={11} />}>
                    <label
                      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer text-[11px] font-bold transition-all group"
                      style={{
                        background: logoFile
                          ? `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)`
                          : "#F8FAFC",
                        borderColor: logoFile ? `${VERDE}50` : "#CBD5E1",
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      />
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                        style={{
                          background: logoFile
                            ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
                            : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                        }}
                      >
                        {logoFile ? <CheckCircle2 size={14} /> : <Camera size={14} />}
                      </div>
                      <span
                        className="truncate max-w-full text-center"
                        style={{ color: logoFile ? VERDE : AZUL }}
                      >
                        {logoFile
                          ? "Pronto ✓"
                          : editando?.logo_url
                          ? "Substituir"
                          : "Anexar logo"}
                      </span>
                    </label>
                  </FormField>

                  <FormField label="Capa do perfil" icon={<ImageIcon size={11} />}>
                    <label
                      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer text-[11px] font-bold transition-all group"
                      style={{
                        background: capaFile
                          ? `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)`
                          : "#F8FAFC",
                        borderColor: capaFile ? `${VERDE}50` : "#CBD5E1",
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setCapaFile(e.target.files?.[0] || null)}
                      />
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                        style={{
                          background: capaFile
                            ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
                            : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                        }}
                      >
                        {capaFile ? <CheckCircle2 size={14} /> : <Camera size={14} />}
                      </div>
                      <span
                        className="truncate max-w-full text-center"
                        style={{ color: capaFile ? VERDE : AZUL }}
                      >
                        {capaFile
                          ? "Pronto ✓"
                          : editando?.capa_url
                          ? "Substituir"
                          : "Anexar capa"}
                      </span>
                    </label>
                  </FormField>
                </div>

                <FormField
                  label="Galeria de fotos"
                  icon={<Layers size={11} />}
                  hint="Aparecem em carrossel na página interna."
                >
                  <label
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer text-[11px] font-bold transition-all group"
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
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                      style={{
                        background:
                          galeriaFiles.length > 0
                            ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
                            : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                      }}
                    >
                      {galeriaFiles.length > 0 ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Layers size={14} />
                      )}
                    </div>
                    <span
                      className="truncate max-w-full text-center"
                      style={{ color: galeriaFiles.length > 0 ? VERDE : AZUL }}
                    >
                      {galeriaFiles.length > 0
                        ? `${galeriaFiles.length} imagens novas`
                        : "Selecionar fotos"}
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
                <Target size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`${jakarta.className} text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap`}>
                  Especialidades da agência
                  {especialidades.filter((e) => e.nome.trim()).length > 0 && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        background: `${AMBAR}10`,
                        color: AMBAR,
                        borderColor: `${AMBAR}25`,
                      }}
                    >
                      {especialidades.filter((e) => e.nome.trim()).length}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pacotes, serviços ou nichos em que a agência é especialista
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
              {especialidades.filter((e) => e.nome.trim()).length === 0 &&
              especialidades.length <= 1 &&
              !especialidades[0]?.nome ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                    }}
                  >
                    <Target size={24} />
                  </div>
                  <div>
                    <p className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                      Sem especialidades ainda
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-[300px] mx-auto">
                      Adiciona pacotes ou nichos em que a agência é especialista.
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Nome" icon={<Tag size={10} />}>
                        <input
                          type="text"
                          value={item.nome}
                          onChange={(e) =>
                            handleEspChange(index, "nome", e.target.value)
                          }
                          placeholder="Ex: Trilhas, Pacotes amazónicos..."
                          className={inputCls}
                        />
                      </FormField>

                      <FormField label="Fotografia (opcional)" icon={<Camera size={10} />}>
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
                  color:
                    feedback.toLowerCase().includes("obrigat") ||
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
                : "Registrar agência"}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VISTA: LISTA (DIRETÓRIO)
  // ═══════════════════════════════════════════════════════════════

  return (
    <>
      <GlobalStyles />
      <div className={`${inter.className} space-y-6`}>

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 anim-fade-up">
          <div>
            <h1 className={`${jakarta.className} text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight`}>
              Diretório de agências
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
              <Sparkles size={14} style={{ color: AMBAR }} />
              {agencias.length} agência{agencias.length !== 1 ? "s" : ""} registrada
              {agencias.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            onClick={abrirNovo}
            className={`${jakarta.className} self-start sm:self-auto text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5`}
            style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
          >
            <Plus size={14} /> Nova agência
          </button>
        </div>

        {/* Busca */}
        {agencias.length > 0 && (
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
                    {agenciasFiltradas.length}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-slate-800 font-bold">{agencias.length}</strong>{" "}
                  agência(s)
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Buscar nome, Cadastur ou endereço..."
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
            <p className="text-xs text-slate-400 font-medium">A carregar agências...</p>
          </div>
        ) : agenciasFiltradas.length === 0 ? (
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
              {busca ? "Nenhum resultado" : "Nenhuma agência registrada"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-5">
              {busca
                ? "Ajusta a pesquisa para encontrares agências."
                : "Registra a primeira agência para aparecer no diretório do portal."}
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
                <Plus size={14} /> Nova agência
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {agenciasFiltradas.map((ag, idx) => (
              <article
                key={ag.id}
                style={{ animationDelay: `${120 + idx * 30}ms` }}
                className={`relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 anim-fade-up group flex flex-col ${
                  !ag.ativo ? "opacity-70" : ""
                }`}
              >
                {/* Barra gradiente */}
                <div
                  className="h-0.5"
                  style={{
                    background: ag.ativo
                      ? `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})`
                      : `linear-gradient(90deg, #64748B, #94A3B8)`,
                  }}
                />

                <div className="p-5 flex flex-col flex-1 items-center text-center">
                  {/* Avatar circular (logo) */}
                  <div className="relative mb-3">
                    <div
                      className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                      style={{
                        background: ag.logo_url
                          ? "#F1F5F9"
                          : `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                      }}
                    >
                      {ag.logo_url ? (
                        <img
                          src={ag.logo_url}
                          alt={ag.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Briefcase size={32} className="text-white opacity-60" />
                      )}
                    </div>

                    {/* Badge Cadastur */}
                    {ag.cadastur && (
                      <div
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border whitespace-nowrap shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`,
                          color: "white",
                          borderColor: "white",
                        }}
                      >
                        <Award size={9} /> Cadastur
                      </div>
                    )}
                  </div>

                  {/* Nome */}
                  <h3
                    className={`${jakarta.className} text-sm font-bold text-slate-900 line-clamp-2 leading-snug mt-2 mb-1`}
                  >
                    {ag.nome}
                  </h3>

                  {/* Cadastur ou "Turismo Legal" */}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    {ag.cadastur || "Turismo Legal"}
                  </p>

                  {/* Descrição */}
                  {ag.descricao_curta && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3 min-h-[32px]">
                      {ag.descricao_curta}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center mb-3">
                    <StatusBadge ativo={ag.ativo} />
                    {ag.especialidades &&
                      Array.isArray(ag.especialidades) &&
                      ag.especialidades.length > 0 && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border"
                          style={{
                            background: `${AMBAR}10`,
                            color: AMBAR,
                            borderColor: `${AMBAR}25`,
                          }}
                        >
                          <Target size={9} /> {ag.especialidades.length}
                        </span>
                      )}
                  </div>

                  {/* CTA WhatsApp */}
                  {ag.whatsapp && (
                    <a
                      href={`https://wa.me/55${ag.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${jakarta.className} w-full inline-flex items-center justify-center gap-1.5 text-white px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow-md mb-3`}
                      style={{
                        background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`,
                      }}
                    >
                      <MessageCircle size={12} /> Contactar
                    </a>
                  )}

                  {/* Ações */}
                  <div className="mt-auto w-full pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleAtivo(ag.id, ag.ativo)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0078D4] hover:bg-[#0078D4]/10 transition-colors"
                        title={ag.ativo ? "Ocultar" : "Publicar"}
                      >
                        {ag.ativo ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => abrirEditar(ag)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0078D4] hover:bg-[#0078D4]/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(ag.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#D13438] hover:bg-red-50 transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {ag.instagram && (
                      <span
                        className="text-[10px] font-bold flex items-center gap-1 truncate max-w-[100px]"
                        style={{ color: AZUL }}
                        title={`@${ag.instagram}`}
                      >
                        <AtSign size={10} /> {ag.instagram}
                      </span>
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

// ─── Ícone "ImageIcon" (evita import extra) ───
function ImageIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}