"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

// ─── Paleta ───────────────────────────────────────────────────────────────────
// Fundo:        slate-50 / white
// Primário:     teal-700 (azul petróleo)  #0f766e
// Acento:       emerald-600 (verde)       #059669
// Superfície:   white / slate-100
// Bordas:       slate-200
// Texto:        slate-800 / slate-500

// ─── Types ────────────────────────────────────────────────────────────────────

interface Evento {
  id: string;
  titulo: string;
  subtitulo: string | null;
  descricao: string | null;
  data: string;
  horario: string | null;
  duracao: string | null;
  local: string;
  imagem_url: string | null;
  categoria: string;
  preco: string | null;
  classificacao: string | null;
  link_bilheteira: string | null;
  destaque: boolean;
}

interface Passeio {
  id: string;
  titulo: string;
  descricao_curta: string | null;
  imagem_principal: string | null;
  data_passeio: string;
  horario_saida: string | null;
  ponto_encontro: string | null;
  nome_guia: string | null;
  valor_total: number;
  vagas_totais: number;
  vagas_disponiveis: number;
  ativo: boolean;
  categoria: string | null;
}

interface Parceiro {
  id: string;
  nome_negocio: string;
  tipo_parceiro: string;
  email: string;
  telefone: string | null;
  status: string;
  criado_em: string;
}

const CATEGORIAS_EVENTO = [
  "Aventura", "Turismo", "Ecoturismo", "Festividade",
  "Gastronomia", "Cultura", "Lazer", "Esporte", "Verão",
];

const EMPTY_EVENTO: Omit<Evento, "id"> = {
  titulo: "", subtitulo: null, descricao: null, data: "",
  horario: null, duracao: null, local: "", imagem_url: null,
  categoria: "Turismo", preco: null, classificacao: null,
  link_bilheteira: null, destaque: false,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PortalServicos() {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [erroLogin, setErroLogin] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (senha === process.env.NEXT_PUBLIC_PASSWORD_ADMIN) {
      setAutenticado(true);
    } else {
      setErroLogin("Senha incorreta.");
    }
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative w-32 h-16 mb-4">
              <Image
                src="/logop.png"
                alt="Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-semibold text-teal-800">Portal de Serviços</h1>
            <p className="text-sm text-slate-500 mt-1">Secretaria Municipal de Turismo</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Senha de acesso
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setErroLogin(""); }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                  placeholder="••••••••"
                  autoFocus
                />
                {erroLogin && <p className="text-red-500 text-xs mt-1.5">{erroLogin}</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-teal-700 hover:bg-teal-600 text-white font-semibold rounded-lg py-2.5 text-sm transition shadow-sm"
              >
                Entrar
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={() => setAutenticado(false)} />;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"eventos" | "passeios" | "parceiros">("eventos");

  const tabs = [
    { id: "eventos",   label: "Eventos",               icon: "📅" },
    { id: "passeios",  label: "Aprovação de Passeios",  icon: "🥾" },
    { id: "parceiros", label: "Parceiros",              icon: "🤝" },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-28 h-8">
              <Image src="/logop.png" alt="Logo" fill className="object-contain object-left" priority />
            </div>
            <span className="hidden sm:block text-xs text-slate-400 border-l border-slate-200 pl-3">
              Portal de Serviços
            </span>
          </div>
          <button
            onClick={onLogout}
            className="text-xs text-slate-500 hover:text-teal-700 transition flex items-center gap-1.5 font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "eventos"   && <TabEventos />}
        {activeTab === "passeios"  && <TabPasseios />}
        {activeTab === "parceiros" && <TabParceiros />}
      </main>
    </div>
  );
}

// ─── Tab Eventos ──────────────────────────────────────────────────────────────

function TabEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Evento | null>(null);
  const [form, setForm] = useState<Omit<Evento, "id">>(EMPTY_EVENTO);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchEventos(); }, []);

  async function fetchEventos() {
    setLoading(true);
    const { data } = await supabase.from("eventos").select("*").order("data");
    setEventos(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null);
    setForm(EMPTY_EVENTO);
    setImagemFile(null);
    setShowForm(true);
  }

  function abrirFormEditar(ev: Evento) {
    setEditando(ev);
    setForm({
      titulo: ev.titulo, subtitulo: ev.subtitulo, descricao: ev.descricao,
      data: ev.data, horario: ev.horario, duracao: ev.duracao, local: ev.local,
      imagem_url: ev.imagem_url, categoria: ev.categoria, preco: ev.preco,
      classificacao: ev.classificacao, link_bilheteira: ev.link_bilheteira,
      destaque: ev.destaque,
    });
    setImagemFile(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.titulo || !form.data || !form.local) {
      setFeedback("Título, data e local são obrigatórios.");
      return;
    }
    setSaving(true);
    let imagem_url = form.imagem_url;

    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const path = `eventos/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("eventos")
        .upload(path, imagemFile, { upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("eventos").getPublicUrl(path);
        imagem_url = pub.publicUrl;
      }
    }

    const payload = { ...form, imagem_url };

    if (editando) {
      await supabase.from("eventos").update(payload).eq("id", editando.id);
    } else {
      await supabase.from("eventos").insert(payload);
    }

    setFeedback(editando ? "Evento atualizado!" : "Evento criado!");
    setShowForm(false);
    setSaving(false);
    fetchEventos();
    setTimeout(() => setFeedback(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este evento?")) return;
    setDeletingId(id);
    await supabase.from("eventos").delete().eq("id", id);
    setDeletingId(null);
    fetchEventos();
  }

  const f = (field: keyof typeof form, val: string | boolean | null) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Eventos</h2>
          <p className="text-xs text-slate-500">{eventos.length} eventos cadastrados</p>
        </div>
        <div className="flex items-center gap-3">
          {feedback && <span className="text-xs text-emerald-600 font-medium">{feedback}</span>}
          <button
            onClick={abrirFormNovo}
            className="bg-teal-700 hover:bg-teal-600 text-white font-semibold text-sm px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span> Novo evento
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">
                {editando ? "Editar evento" : "Novo evento"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 transition text-lg leading-none">✕</button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Título *" className="sm:col-span-2">
                <input value={form.titulo} onChange={(e) => f("titulo", e.target.value)} className={inputCls} />
              </FormField>
              <FormField label="Subtítulo">
                <input value={form.subtitulo || ""} onChange={(e) => f("subtitulo", e.target.value || null)} className={inputCls} />
              </FormField>
              <FormField label="Local *">
                <input value={form.local} onChange={(e) => f("local", e.target.value)} className={inputCls} />
              </FormField>
              <FormField label="Data *">
                <input type="date" value={form.data} onChange={(e) => f("data", e.target.value)} className={inputCls} />
              </FormField>
              <FormField label="Horário">
                <input type="time" value={form.horario || ""} onChange={(e) => f("horario", e.target.value || null)} className={inputCls} />
              </FormField>
              <FormField label="Categoria">
                <select value={form.categoria} onChange={(e) => f("categoria", e.target.value)} className={inputCls}>
                  {CATEGORIAS_EVENTO.map((c) => <option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Preço">
                <input value={form.preco || ""} onChange={(e) => f("preco", e.target.value || null)} placeholder="gratuito" className={inputCls} />
              </FormField>
              <FormField label="Link Bilheteira">
                <input value={form.link_bilheteira || ""} onChange={(e) => f("link_bilheteira", e.target.value || null)} className={inputCls} />
              </FormField>
              <FormField label="Descrição" className="sm:col-span-2">
                <textarea
                  value={form.descricao || ""}
                  onChange={(e) => f("descricao", e.target.value || null)}
                  rows={3}
                  className={inputCls + " resize-none"}
                />
              </FormField>
              <FormField label="Imagem de Capa" className="sm:col-span-2">
                {form.imagem_url && !imagemFile && (
                  <img src={form.imagem_url} alt="" className="h-24 w-auto rounded-lg mb-2 object-cover" />
                )}
                {imagemFile && (
                  <p className="text-xs text-teal-600 mb-1">📎 {imagemFile.name}</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImagemFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs border border-dashed border-slate-300 hover:border-teal-400 text-slate-400 hover:text-teal-600 px-3 py-2 rounded-lg transition w-full"
                >
                  {imagemFile ? "Trocar imagem" : "Escolher imagem"}
                </button>
              </FormField>
              <FormField label="" className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.destaque}
                    onChange={(e) => f("destaque", e.target.checked)}
                    className="accent-teal-600 w-4 h-4"
                  />
                  <span className="text-sm text-slate-600">Marcar como destaque</span>
                </label>
              </FormField>
            </div>
            {feedback && <p className="px-5 text-sm text-red-500">{feedback}</p>}
            <div className="flex gap-2 p-5 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-semibold text-sm transition disabled:opacity-50 shadow-sm">
                {saving ? "Salvando…" : editando ? "Salvar alterações" : "Criar evento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <Skeleton rows={6} />
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <Th>Evento</Th>
                <Th>Data</Th>
                <Th>Local</Th>
                <Th>Categoria</Th>
                <Th>Destaque</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((ev) => (
                <tr key={ev.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {ev.imagem_url ? (
                        <img src={ev.imagem_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">
                          📅
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-800 leading-tight">{ev.titulo}</p>
                        {ev.subtitulo && <p className="text-xs text-slate-400">{ev.subtitulo}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtData(ev.data)}</td>
                  <td className="px-4 py-3 text-slate-600">{ev.local}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full font-medium">
                      {ev.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {ev.destaque
                      ? <span className="text-amber-400 text-base">★</span>
                      : <span className="text-slate-200 text-base">★</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirFormEditar(ev)}
                        className="text-xs text-teal-700 hover:text-teal-800 border border-teal-200 hover:border-teal-400 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-md transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        disabled={deletingId === ev.id}
                        className="text-xs text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition disabled:opacity-40"
                      >
                        {deletingId === ev.id ? "…" : "Remover"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {eventos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                    Nenhum evento cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Tab Passeios ─────────────────────────────────────────────────────────────

function TabPasseios() {
  const [passeios, setPasseios] = useState<Passeio[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => { fetchPasseios(); }, []);

  async function fetchPasseios() {
    setLoading(true);
    const { data } = await supabase
      .from("passeios")
      .select("*")
      .eq("ativo", false)
      .order("created_at", { ascending: false });
    setPasseios(data || []);
    setLoading(false);
  }

  async function aprovar(id: string) {
    setActionId(id);
    await supabase.from("passeios").update({ ativo: true }).eq("id", id);
    setFeedback("Passeio aprovado!");
    setActionId(null);
    fetchPasseios();
    setTimeout(() => setFeedback(""), 3000);
  }

  async function reprovar(id: string) {
    if (!confirm("Reprovar e remover este passeio?")) return;
    setActionId(id);
    await supabase.from("passeios").delete().eq("id", id);
    setFeedback("Passeio reprovado e removido.");
    setActionId(null);
    fetchPasseios();
    setTimeout(() => setFeedback(""), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Aprovação de Passeios</h2>
          <p className="text-xs text-slate-500">{passeios.length} passeio(s) aguardando aprovação</p>
        </div>
        {feedback && <span className="text-xs text-emerald-600 font-medium">{feedback}</span>}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-72 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : passeios.length === 0 ? (
        <EmptyState icon="✅" title="Tudo aprovado" desc="Não há passeios pendentes de aprovação." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {passeios.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
              {/* Badge pendente */}
              <div className="relative h-40 bg-slate-100">
                {p.imagem_principal ? (
                  <img src={p.imagem_principal} alt={p.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl">🖼</div>
                )}
                <span className="absolute top-2 left-2 text-xs bg-white/90 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full font-medium backdrop-blur-sm shadow-sm">
                  {p.categoria || "—"}
                </span>
                <span className="absolute top-2 right-2 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                  Pendente
                </span>
              </div>

              <div className="p-4 flex-1 space-y-1">
                <h3 className="font-semibold text-slate-800 leading-tight">{p.titulo}</h3>
                {p.descricao_curta && (
                  <p className="text-xs text-slate-500 line-clamp-2">{p.descricao_curta}</p>
                )}
                <div className="pt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide text-[10px] font-semibold">Data</span>
                    <p className="text-slate-700 mt-0.5">{fmtData(p.data_passeio)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide text-[10px] font-semibold">Horário</span>
                    <p className="text-slate-700 mt-0.5">{p.horario_saida || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide text-[10px] font-semibold">Guia</span>
                    <p className="text-slate-700 mt-0.5">{p.nome_guia || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide text-[10px] font-semibold">Valor</span>
                    <p className="text-emerald-600 font-semibold mt-0.5">R$ {p.valor_total.toFixed(2)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 uppercase tracking-wide text-[10px] font-semibold">Local de encontro</span>
                    <p className="text-slate-700 mt-0.5">{p.ponto_encontro || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide text-[10px] font-semibold">Vagas</span>
                    <p className="text-slate-700 mt-0.5">{p.vagas_totais}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 p-4 border-t border-slate-100">
                <button
                  onClick={() => reprovar(p.id)}
                  disabled={actionId === p.id}
                  className="flex-1 py-2 rounded-lg text-sm border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-40 font-medium"
                >
                  Reprovar
                </button>
                <button
                  onClick={() => aprovar(p.id)}
                  disabled={actionId === p.id}
                  className="flex-1 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-40 shadow-sm"
                >
                  {actionId === p.id ? "…" : "Aprovar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab Parceiros ────────────────────────────────────────────────────────────

function TabParceiros() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>("todos");
  const [actionId, setActionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const tipos = ["todos", "hotel", "passeios", "pacotes", "guia"];

  useEffect(() => { fetchParceiros(); }, []);

  async function fetchParceiros() {
    setLoading(true);
    const { data } = await supabase.from("parceiros").select("*").order("criado_em", { ascending: false });
    setParceiros(data || []);
    setLoading(false);
  }

  async function alterarStatus(id: string, novoStatus: "ativo" | "inativo") {
    setActionId(id);
    await supabase.from("parceiros").update({ status: novoStatus }).eq("id", id);
    setActionId(null);
    setFeedback(novoStatus === "ativo" ? "Parceiro ativado." : "Parceiro desativado.");
    fetchParceiros();
    setTimeout(() => setFeedback(""), 3000);
  }

  const filtered = filtro === "todos"
    ? parceiros
    : parceiros.filter((p) => p.tipo_parceiro === filtro);

  const pendentes = parceiros.filter((p) => p.status === "pendente");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Gestão de Parceiros</h2>
          <p className="text-xs text-slate-500">{parceiros.length} parceiros · {pendentes.length} pendente(s)</p>
        </div>
        {feedback && <span className="text-xs text-emerald-600 font-medium">{feedback}</span>}
      </div>

      {/* Pendentes banner */}
      {pendentes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-700 mb-3">
            ⏳ {pendentes.length} parceiro(s) aguardando validação
          </p>
          <div className="space-y-2">
            {pendentes.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white border border-amber-100 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm text-slate-800 font-medium">{p.nome_negocio}</p>
                  <p className="text-xs text-slate-500">{p.email} · {p.tipo_parceiro}</p>
                </div>
                <button
                  onClick={() => alterarStatus(p.id, "ativo")}
                  disabled={actionId === p.id}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1 rounded-md transition shadow-sm"
                >
                  Aprovar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {tipos.map((t) => (
          <button
            key={t}
            onClick={() => setFiltro(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition border ${
              filtro === t
                ? "bg-teal-700 text-white border-teal-700"
                : "text-slate-500 border-slate-200 hover:border-teal-300 hover:text-teal-700 bg-white"
            }`}
          >
            {t === "todos"
              ? `Todos (${parceiros.length})`
              : `${t} (${parceiros.filter(p => p.tipo_parceiro === t).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <Skeleton rows={4} />
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <Th>Parceiro</Th>
                <Th>Tipo</Th>
                <Th>Contacto</Th>
                <Th>Registado em</Th>
                <Th>Estado</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-sm shrink-0">
                        {tipoEmoji(p.tipo_parceiro)}
                      </div>
                      <span className="font-medium text-slate-800">{p.nome_negocio}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full font-medium capitalize">
                      {p.tipo_parceiro}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    <div>{p.email}</div>
                    {p.telefone && <div>{p.telefone}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {fmtDatetime(p.criado_em)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {p.status === "ativo" ? (
                        <button
                          onClick={() => alterarStatus(p.id, "inativo")}
                          disabled={actionId === p.id}
                          className="text-xs text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-md transition disabled:opacity-40"
                        >
                          Desativar
                        </button>
                      ) : (
                        <button
                          onClick={() => alterarStatus(p.id, "ativo")}
                          disabled={actionId === p.id}
                          className="text-xs text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition disabled:opacity-40 font-medium"
                        >
                          Ativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                    Nenhum parceiro nesta categoria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Helpers & micro-components ───────────────────────────────────────────────

const inputCls =
  "w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition placeholder:text-slate-400";

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-slate-50 border-b border-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-400 mt-1">{desc}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ativo:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    inativo:  "bg-slate-100 text-slate-500 border-slate-200",
    pendente: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${map[status] || map.inativo}`}>
      {status}
    </span>
  );
}

function tipoEmoji(tipo: string) {
  const map: Record<string, string> = {
    hotel: "🏨", passeios: "🥾", pacotes: "📦", guia: "🧭",
  };
  return map[tipo] || "🤝";
}

function fmtData(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function fmtDatetime(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
