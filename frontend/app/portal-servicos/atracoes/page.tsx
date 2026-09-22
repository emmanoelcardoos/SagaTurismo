"use client";

import React, { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  MapPin, Plus, Loader2, Save, Image as ImageIcon, Phone,
  Sparkles, ArrowLeft, Tag, Hash, Star, Pencil, Trash2,
  Inbox, FileText, Target, Wallet, Camera, Layers, ExternalLink,
  Eye, EyeOff, CheckCircle2, AlertTriangle, X, Search, Filter,
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
      {ativo ? "Ativo" : "Oculto"}
    </span>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  const cores: Record<string, string> = {
    Natureza: VERDE,
    Museu: ROXO,
    Praia: AZUL,
    Histórico: AMBAR,
    Aventura: VERMELHO,
  };
  const cor = cores[tipo] || AZUL;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border"
      style={{ background: `${cor}10`, color: cor, borderColor: `${cor}25` }}
    >
      <Tag size={10} />
      {tipo || "Geral"}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function PortalAtracoes() {
  const [atracoes, setAtracoes] = useState<Atracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Atracao | null>(null);
  const [form, setForm] = useState<any>({});
  const [busca, setBusca] = useState("");

  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchAtracoes();
  }, []);

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
      nome: "",
      tipo: "",
      descricao: "",
      imagem_url: "",
      preco_entrada: 0,
      whatsapp: "",
      link_google_maps: "",
      ordem: 0,
      ativo: true,
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
    if (!form.nome) {
      setFeedback("Nome obrigatório.");
      return;
    }
    setSaving(true);
    setFeedback("A guardar atração...");

    let imagem_url = form.imagem_url;

    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const path = `atracoes/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("galeria")
        .upload(path, imagemFile, { upsert: true });
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
        const path = `atracoes/galeria_${Date.now()}_${Math.random()
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
      ...form,
      imagem_url,
      galeria: galeriaFinal.length > 0 ? galeriaFinal : null,
    };
    if (editando) await supabase.from("atracoes").update(payload).eq("id", editando.id);
    else await supabase.from("atracoes").insert(payload);

    setFeedback(editando ? "Atração atualizada!" : "Atração publicada com sucesso!");
    setTimeout(() => {
      setShowForm(false);
      setSaving(false);
      fetchAtracoes();
      setFeedback("");
    }, 2000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta atração da vitrine?")) return;
    await supabase.from("atracoes").delete().eq("id", id);
    fetchAtracoes();
  }

  // ─── FILTRO ───
  const atracoesFiltradas = atracoes.filter((a) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      a.nome?.toLowerCase().includes(termo) ||
      a.tipo?.toLowerCase().includes(termo) ||
      a.descricao?.toLowerCase().includes(termo)
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
              <h1 className={`${jakarta.className} text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate`}>
                {editando ? editando.nome : "Construtor de atração"}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Preenche os dados, define localização e adiciona fotos à galeria.
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})` }} />

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              {/* Coluna 1: Informações Principais */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
                  >
                    <FileText size={12} />
                  </div>
                  <h4 className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                    Informações principais
                  </h4>
                </div>

                <FormField label="Nome da atração" icon={<Tag size={11} />} required>
                  <input
                    value={form.nome || ""}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className={inputCls}
                    placeholder="Ex: Mirante da Serra"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Tipo" icon={<Hash size={11} />}>
                    <input
                      value={form.tipo || ""}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                      className={inputCls}
                      placeholder="Ex: Natureza, Museu..."
                    />
                  </FormField>
                  <FormField label="Preço de entrada" icon={<Wallet size={11} />}>
                    <input
                      type="number"
                      step="0.01"
                      value={form.preco_entrada || ""}
                      onChange={(e) =>
                        setForm({ ...form, preco_entrada: parseFloat(e.target.value) })
                      }
                      className={inputCls}
                      placeholder="0.00"
                    />
                  </FormField>
                </div>

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
                  <FormField label="Visibilidade" icon={<Eye size={11} />}>
                    <select
                      value={String(form.ativo)}
                      onChange={(e) =>
                        setForm({ ...form, ativo: e.target.value === "true" })
                      }
                      className={inputCls}
                    >
                      <option value="true">Ativo / Público</option>
                      <option value="false">Oculto</option>
                    </select>
                  </FormField>
                </div>

                <FormField label="Descrição detalhada" icon={<FileText size={11} />}>
                  <textarea
                    value={form.descricao || ""}
                    onChange={(e) =>
                      setForm({ ...form, descricao: e.target.value })
                    }
                    rows={5}
                    className={`${inputCls} resize-y min-h-[130px]`}
                    placeholder="Descreve os encantos desta atração..."
                  />
                </FormField>
              </div>

              {/* Coluna 2: Localização e Mídia */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${VERDE}, ${VERDE_LIGHT})` }}
                  >
                    <MapPin size={12} />
                  </div>
                  <h4 className={`${jakarta.className} text-sm font-bold text-slate-700`}>
                    Localização e mídia
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="WhatsApp de contacto" icon={<Phone size={11} />}>
                    <div className="relative">
                      <Phone
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={form.whatsapp || ""}
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
                        value={form.link_google_maps || ""}
                        onChange={(e) =>
                          setForm({ ...form, link_google_maps: e.target.value })
                        }
                        className={`${inputCls} pl-10`}
                        placeholder="https://maps..."
                      />
                    </div>
                  </FormField>
                </div>

                <FormField label="Fotografia de capa" icon={<ImageIcon size={11} />}>
                  <label
                    className="flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-xl p-5 cursor-pointer text-xs font-bold transition-all group"
                    style={{
                      background: imagemFile
                        ? `linear-gradient(135deg, ${AZUL}06, ${AZUL}02)`
                        : "#F8FAFC",
                      borderColor: imagemFile ? `${AZUL}50` : "#CBD5E1",
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
                          ? `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`
                          : `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})`,
                      }}
                    >
                      {imagemFile ? <CheckCircle2 size={16} /> : <Camera size={16} />}
                    </div>
                    <span
                      className="truncate max-w-[200px] text-center"
                      style={{ color: AZUL }}
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
                  icon={<ImageIcon size={11} />}
                  hint="As imagens da galeria aparecem em carrossel no portal público."
                >
                  <label
                    className="flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-xl p-5 cursor-pointer text-xs font-bold transition-all group"
                    style={{
                      background: galeriaFiles.length > 0
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

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {feedback && (
                <p
                  className="text-xs font-bold flex items-center gap-2"
                  style={{
                    color: feedback.toLowerCase().includes("obrigat")
                      ? VERMELHO
                      : feedback.toLowerCase().includes("sucesso") ||
                        feedback.toLowerCase().includes("atualizada")
                      ? VERDE
                      : AZUL,
                  }}
                >
                  {feedback.toLowerCase().includes("obrigat") ? (
                    <AlertTriangle size={13} />
                  ) : feedback.toLowerCase().includes("sucesso") ||
                    feedback.toLowerCase().includes("atualizada") ? (
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
                  ? "Guardar edição"
                  : "Publicar atração"}
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
      <div className={`${inter.className} space-y-6`}>

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 anim-fade-up">
          <div>
            
            <h1 className={`${jakarta.className} text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight`}>
              Vitrine de atrações
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
              <Sparkles size={14} style={{ color: AMBAR }} />
              {atracoes.length} ponto{atracoes.length !== 1 ? "s" : ""} turístico
              {atracoes.length !== 1 ? "s" : ""} em exibição
            </p>
          </div>

          <button
            onClick={abrirFormNovo}
            className={`${jakarta.className} self-start sm:self-auto text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5`}
            style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_ESCURO})` }}
          >
            <Plus size={14} /> Nova atração
          </button>
        </div>

        {/* Busca */}
        {atracoes.length > 0 && (
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
                    {atracoesFiltradas.length}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-slate-800 font-bold">{atracoes.length}</strong>{" "}
                  atração(ões)
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Buscar nome, tipo ou descrição..."
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
            <p className="text-xs text-slate-400 font-medium">A carregar atrações...</p>
          </div>
        ) : atracoesFiltradas.length === 0 ? (
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
              {busca ? "Nenhum resultado" : "Nenhuma atração cadastrada"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-5">
              {busca
                ? "Ajusta a pesquisa para encontrares atrações."
                : "Cria a primeira atração para aparecer na vitrine do portal."}
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
                <Plus size={14} /> Nova atração
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {atracoesFiltradas.map((a, idx) => (
              <article
                key={a.id}
                style={{ animationDelay: `${120 + idx * 30}ms` }}
                className="relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 anim-fade-up group"
              >
                {/* Barra gradiente */}
                <div
                  className="h-0.5"
                  style={{
                    background: a.ativo
                      ? `linear-gradient(90deg, ${AZUL}, ${AZUL_ESCURO})`
                      : `linear-gradient(90deg, #64748B, #94A3B8)`,
                  }}
                />

                {/* Thumbnail */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {a.imagem_url ? (
                    <img
                      src={a.imagem_url}
                      alt={a.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white"
                      style={{
                        background: `linear-gradient(135deg, ${AMBAR}, ${AMBAR_LIGHT})`,
                      }}
                    >
                      <MapPin size={36} className="opacity-40" />
                    </div>
                  )}

                  {/* Overlay de tipo (top-right) */}
                  <div className="absolute top-4 right-4">
                    <TipoBadge tipo={a.tipo} />
                  </div>
                </div>

                {/* Corpo */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3
                      className={`${jakarta.className} text-base font-bold text-slate-900 line-clamp-2 leading-snug flex-1`}
                    >
                      {a.nome}
                    </h3>
                  </div>

                  {a.descricao && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {a.descricao}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span
                      className={`${jakarta.className} text-sm font-extrabold`}
                      style={{ color: a.preco_entrada > 0 ? AMBAR : VERDE }}
                    >
                      {a.preco_entrada > 0
                        ? `R$ ${Number(a.preco_entrada).toFixed(2)}`
                        : "Grátis"}
                    </span>
                    <StatusBadge ativo={a.ativo} />
                    {a.galeria && a.galeria.length > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                        style={{ background: "#F1F5F9", color: "#475569" }}
                      >
                        <Layers size={9} /> {a.galeria.length}
                      </span>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirFormEditar(a)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#0078D4] hover:bg-[#0078D4]/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#D13438] hover:bg-red-50 transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {a.link_google_maps && (
                      <a
                        href={a.link_google_maps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold flex items-center gap-1 transition-colors"
                        style={{ color: AZUL }}
                      >
                        Ver no mapa <ExternalLink size={11} />
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