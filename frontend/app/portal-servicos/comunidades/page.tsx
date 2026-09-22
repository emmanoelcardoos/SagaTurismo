"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  Compass, Plus, Loader2, Save, Image as ImageIcon, Trash2,
  Upload, Sparkles, ArrowLeft, FileText, MapPin, Camera,
  Layers, Eye, EyeOff, Pencil, Inbox, Search, X, Filter,
  Hash, Tag, CheckCircle2, AlertTriangle, ExternalLink, Link as LinkIcon,
  Phone, Wallet, Target, Globe,
} from "lucide-react";

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

export default function PortalComunidades() {
  const [comunidades, setComunidades] = useState<any[]>([]);
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

  useEffect(() => {
    fetchComunidades();
  }, []);

  async function fetchComunidades() {
    setLoading(true);
    const { data } = await supabase
      .from("comunidades")
      .select("*")
      .order("ordem", { ascending: true, nullsFirst: false });
    setComunidades(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null);
    setForm({
      titulo: "",
      descricao_curta: "",
      historia_texto: "",
      cultura_texto: "",
      ordem: 0,
      ativo: true,
    });
    setImagemFile(null);
    setGaleriaFiles([]);
    setPontos([]);
    setFeedback("");
    setShowForm(true);
  }

  async function abrirFormEditar(c: any) {
    setEditando(c);
    setForm({ ...c });
    setImagemFile(null);
    setGaleriaFiles([]);
    setFeedback("");

    const { data: ptData } = await supabase
      .from("comunidade_pontos")
      .select("*")
      .eq("comunidade_id", c.id)
      .order("titulo");
    setPontos(ptData || []);
    setShowForm(true);
  }

  const addPonto = () =>
    setPontos([
      ...pontos,
      {
        id: null,
        titulo: "",
        tipo: "atração",
        link_destino: "",
        whatsapp: "",
        imagem_url: "",
        file: null,
      },
    ]);

  const removePonto = (index: number) => {
    const novos = [...pontos];
    if (novos[index].id) {
      novos[index]._deleted = true;
    } else {
      novos.splice(index, 1);
    }
    setPontos(novos);
  };

  const handlePontoChange = (index: number, field: string, value: any) => {
    const novos = [...pontos];
    novos[index] = { ...novos[index], [field]: value };
    setPontos(novos);
  };

  async function handleSave() {
    if (!form.titulo) {
      setFeedback("Título obrigatório.");
      return;
    }
    setSaving(true);
    setFeedback("A processar...");

    let imagem_url = form.imagem_url;

    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const path = `galeria/${Date.now()}.${ext}`;
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
        const path = `galeria/com_gal_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.${ext}`;
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
      descricao_curta: form.descricao_curta,
      historia_texto: form.historia_texto,
      cultura_texto: form.cultura_texto,
      ordem: form.ordem,
      ativo: form.ativo,
      imagem_url,
      galeria: galeriaFinal.length > 0 ? galeriaFinal : null,
    };

    let comunidadeId = editando?.id;

    if (editando) {
      await supabase.from("comunidades").update(payload).eq("id", comunidadeId);
    } else {
      const { data, error } = await supabase
        .from("comunidades")
        .insert(payload)
        .select()
        .single();
      if (!error && data) comunidadeId = data.id;
    }

    if (comunidadeId) {
      for (const pt of pontos) {
        if (pt._deleted) {
          await supabase.from("comunidade_pontos").delete().eq("id", pt.id);
          continue;
        }
        if (!pt.titulo) continue;

        let ptImgUrl = pt.imagem_url;
        if (pt.file) {
          const ext = pt.file.name.split(".").pop();
          const path = `galeria/pt_${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}.${ext}`;
          const { error } = await supabase.storage.from("galeria").upload(path, pt.file);
          if (!error) {
            const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
            ptImgUrl = pub.publicUrl;
          }
        }

        const ptPayload = {
          comunidade_id: comunidadeId,
          titulo: pt.titulo,
          tipo: pt.tipo,
          link_destino: pt.link_destino,
          whatsapp: pt.whatsapp,
          imagem_url: ptImgUrl,
        };

        if (pt.id) await supabase.from("comunidade_pontos").update(ptPayload).eq("id", pt.id);
        else await supabase.from("comunidade_pontos").insert(ptPayload);
      }
    }

    setFeedback("Comunidade salva com sucesso!");
    setTimeout(() => {
      setShowForm(false);
      setSaving(false);
      fetchComunidades();
      setFeedback("");
    }, 2000);
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Remover esta comunidade? Todos os pontos associados também serão apagados."
      )
    )
      return;
    await supabase.from("comunidade_pontos").delete().eq("comunidade_id", id);
    await supabase.from("comunidades").delete().eq("id", id);
    fetchComunidades();
  }

  // ─── FILTRO ───
  const comunidadesFiltradas = comunidades.filter((c) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      c.titulo?.toLowerCase().includes(termo) ||
      c.descricao_curta?.toLowerCase().includes(termo)
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
              <h1
                className={`${jakarta.className} text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate`}
              >
                {editando ? editando.titulo : "Construtor de comunidade"}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Preenche a identificação, mídia oficial e pontos turísticos associados.
              </p>
            </div>
          </div>

          {/* Bloco 1: Identificação + Mídia */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})` }} />

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              {/* Coluna 1: Identificação */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                  >
                    <FileText size={12} />
                  </div>
                  <h4 className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                    Identificação
                  </h4>
                </div>

                <FormField label="Nome da comunidade" icon={<Tag size={11} />} required>
                  <input
                    value={form.titulo || ""}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    className={inputCls}
                    placeholder="Ex: Santa Cruz"
                  />
                </FormField>

                <FormField
                  label="Descrição curta (resumo)"
                  icon={<FileText size={11} />}
                  hint="Aparece nos cartões do portal público."
                >
                  <textarea
                    value={form.descricao_curta || ""}
                    onChange={(e) =>
                      setForm({ ...form, descricao_curta: e.target.value })
                    }
                    rows={3}
                    className={`${inputCls} resize-y min-h-[80px]`}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Ordem de exibição" icon={<Layers size={11} />}>
                    <input
                      type="number"
                      value={form.ordem || ""}
                      onChange={(e) =>
                        setForm({ ...form, ordem: parseInt(e.target.value) })
                      }
                      className={inputCls}
                      placeholder="1, 2, 3..."
                    />
                  </FormField>
                  <FormField label="Status" icon={<Eye size={11} />}>
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
                </div>

                <FormField label="História da comunidade" icon={<FileText size={11} />}>
                  <textarea
                    value={form.historia_texto || ""}
                    onChange={(e) =>
                      setForm({ ...form, historia_texto: e.target.value })
                    }
                    rows={5}
                    className={`${inputCls} resize-y min-h-[130px]`}
                  />
                </FormField>

                <FormField label="Cultura / curiosidades" icon={<Sparkles size={11} />}>
                  <textarea
                    value={form.cultura_texto || ""}
                    onChange={(e) =>
                      setForm({ ...form, cultura_texto: e.target.value })
                    }
                    rows={3}
                    className={`${inputCls} resize-y min-h-[80px]`}
                  />
                </FormField>
              </div>

              {/* Coluna 2: Mídia */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})` }}
                  >
                    <Camera size={12} />
                  </div>
                  <h4 className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                    Mídia oficial
                  </h4>
                </div>

                <FormField label="Fotografia de capa" icon={<ImageIcon size={11} />}>
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
                      onChange={(e) => setImagemFile(e.target.files?.[0] || null)}
                    />
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                      style={{
                        background: imagemFile
                          ? `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})`
                          : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                      }}
                    >
                      {imagemFile ? <CheckCircle2 size={16} /> : <Camera size={16} />}
                    </div>
                    <span
                      className="truncate max-w-[200px] text-center"
                      style={{ color: imagemFile ? VERDE : AZUL }}
                    >
                      {imagemFile
                        ? imagemFile.name
                        : form.imagem_url
                        ? "Trocar capa atual"
                        : "Anexar capa principal"}
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
                  label="Adicionar imagens à galeria"
                  icon={<Layers size={11} />}
                  hint="As imagens da galeria aparecem em carrossel no portal."
                >
                  <label
                    className="flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-xl p-5 cursor-pointer text-xs font-bold transition-all group"
                    style={{
                      background:
                        galeriaFiles.length > 0
                          ? `linear-gradient(135deg, ${VERDE}06, ${VERDE}02)`
                          : "#F8FAFC",
                      borderColor: galeriaFiles.length > 0 ? `${VERDE}50` : "#CBD5E1",
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
                        ? `${galeriaFiles.length} ficheiros novos`
                        : "Selecionar múltiplas fotos"}
                    </span>
                  </label>
                </FormField>
              </div>
            </div>
          </div>

          {/* Bloco 2: Pontos da comunidade */}
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
                <MapPin size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`${jakarta.className} text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap`}>
                  Pontos da comunidade
                  {pontos.filter((p) => !p._deleted).length > 0 && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        background: `${AMBAR}10`,
                        color: AMBAR,
                        borderColor: `${AMBAR}25`,
                      }}
                    >
                      {pontos.filter((p) => !p._deleted).length}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Atrações, pousadas, gastronomia, artesanato e outros locais
                </p>
              </div>
              <button
                onClick={addPonto}
                className={`${jakarta.className} text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 shrink-0`}
                style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
              >
                <Plus size={13} /> Adicionar ponto
              </button>
            </div>

            <div className="p-5">
              {pontos.filter((p) => !p._deleted).length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
                  >
                    <Inbox size={24} />
                  </div>
                  <div>
                    <p className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                      Sem pontos ainda
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-[280px] mx-auto">
                      Adiciona atrações, pousadas, restaurantes ou outros pontos
                      relevantes desta comunidade.
                    </p>
                  </div>
                  <button
                    onClick={addPonto}
                    className={`${jakarta.className} text-[11px] font-bold px-4 py-2 rounded-xl text-white shadow-sm hover:shadow-md transition-all`}
                    style={{ background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})` }}
                  >
                    <Plus size={12} className="inline mr-1" /> Adicionar primeiro ponto
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pontos
                    .filter((p) => !p._deleted)
                    .map((item, index) => (
                      <div
                        key={index}
                        style={{ animationDelay: `${index * 30}ms` }}
                        className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 hover:bg-white hover:border-slate-300 transition-all anim-fade-up"
                      >
                        {/* Header do ponto */}
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
                              Ponto {index + 1}
                            </span>
                          </div>
                          <button
                            onClick={() => removePonto(index)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#D13438] hover:bg-red-50 transition-colors shrink-0"
                            title="Remover ponto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Grid de campos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          <FormField label="Nome do ponto" icon={<Tag size={10} />}>
                            <input
                              type="text"
                              value={item.titulo}
                              onChange={(e) =>
                                handlePontoChange(index, "titulo", e.target.value)
                              }
                              placeholder="Ex: Praia do Rio"
                              className={inputCls}
                            />
                          </FormField>

                          <FormField label="Tipo" icon={<Target size={10} />}>
                            <select
                              value={item.tipo}
                              onChange={(e) =>
                                handlePontoChange(index, "tipo", e.target.value)
                              }
                              className={inputCls}
                            >
                              <option value="atração">Atração</option>
                              <option value="hospedagem">Hospedagem</option>
                              <option value="gastronomia">Gastronomia</option>
                              <option value="artesanato">Artesanato</option>
                            </select>
                          </FormField>

                          <FormField label="WhatsApp" icon={<Phone size={10} />}>
                            <input
                              type="text"
                              value={item.whatsapp || ""}
                              onChange={(e) =>
                                handlePontoChange(index, "whatsapp", e.target.value)
                              }
                              placeholder="94 90000-0000"
                              className={inputCls}
                            />
                          </FormField>

                          <FormField
                            label="Link / URL"
                            icon={<LinkIcon size={10} />}
                            className="md:col-span-2"
                          >
                            <input
                              type="text"
                              value={item.link_destino || ""}
                              onChange={(e) =>
                                handlePontoChange(index, "link_destino", e.target.value)
                              }
                              placeholder="https://..."
                              className={inputCls}
                            />
                          </FormField>

                          <FormField label="Imagem do ponto" icon={<Camera size={10} />}>
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
                                  handlePontoChange(
                                    index,
                                    "file",
                                    e.target.files?.[0] || null
                                  )
                                }
                              />
                              {item.file ? (
                                <>
                                  <CheckCircle2 size={13} /> Pronto
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
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            {feedback && (
              <p
                className="text-xs font-bold flex items-center gap-2"
                style={{
                  color: feedback.toLowerCase().includes("obrigat")
                    ? VERMELHO
                    : feedback.toLowerCase().includes("sucesso")
                    ? VERDE
                    : AZUL,
                }}
              >
                {feedback.toLowerCase().includes("obrigat") ? (
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
              onClick={handleSave}
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
                : "Criar comunidade"}
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
              Gestão de comunidades
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
              <Sparkles size={14} style={{ color: AMBAR }} />
              {comunidades.length} comunidade{comunidades.length !== 1 ? "s" : ""} no
              portal
            </p>
          </div>

          <button
            onClick={abrirFormNovo}
            className={`${jakarta.className} self-start sm:self-auto text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5`}
            style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
          >
            <Plus size={14} /> Nova comunidade
          </button>
        </div>

        {/* Busca */}
        {comunidades.length > 0 && (
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
                    {comunidadesFiltradas.length}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-slate-800 font-bold">
                    {comunidades.length}
                  </strong>{" "}
                  comunidade(s)
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
            <p className="text-xs text-slate-400 font-medium">A carregar comunidades...</p>
          </div>
        ) : comunidadesFiltradas.length === 0 ? (
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
              {busca ? "Nenhum resultado" : "Nenhuma comunidade cadastrada"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-5">
              {busca
                ? "Ajusta a pesquisa para encontrares comunidades."
                : "Cria a primeira comunidade para aparecer no portal."}
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
                <Plus size={14} /> Nova comunidade
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comunidadesFiltradas.map((c, idx) => (
              <article
                key={c.id}
                style={{ animationDelay: `${120 + idx * 30}ms` }}
                className="relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 anim-fade-up group"
              >
                <div
                  className="h-0.5"
                  style={{
                    background: c.ativo
                      ? `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})`
                      : `linear-gradient(90deg, #64748B, #94A3B8)`,
                  }}
                />

                {/* Thumbnail */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {c.imagem_url ? (
                    <img
                      src={c.imagem_url}
                      alt={c.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white"
                      style={{
                        background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                      }}
                    >
                      <Compass size={36} className="opacity-40" />
                    </div>
                  )}
                </div>

                {/* Corpo */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <StatusBadge ativo={c.ativo} />
                    {c.galeria && c.galeria.length > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                        style={{ background: "#F1F5F9", color: "#475569" }}
                      >
                        <Layers size={9} /> {c.galeria.length}
                      </span>
                    )}
                  </div>

                  <h3
                    className={`${jakarta.className} text-base font-bold text-slate-900 line-clamp-2 leading-snug mb-2`}
                  >
                    {c.titulo}
                  </h3>

                  {c.descricao_curta && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {c.descricao_curta}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirFormEditar(c)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#0078D4] hover:bg-[#0078D4]/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#D13438] hover:bg-red-50 transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Editar completo
                    </span>
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