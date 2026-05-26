"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Rota {
  id: string;
  titulo: string;
  descricao_curta: string;
  descricao_longa: string | null;
  imagem_url: string | null;
  ordem: number;
  ativo: boolean;
  criado_em: string;
  duracao: string | null;
  dificuldade: string | null;
  grupo: string | null;
  guia: string | null;
  galeria: string[] | null;
  como_chegar: string | null;
}

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
  descricao_completa: string | null;
  imagem_principal: string | null;
  imagens_galeria: string[] | null;
  data_passeio: string;
  horario_saida: string | null;
  ponto_encontro: string | null;
  coordenadas_google_maps: string | null;
  nome_guia: string | null;
  guia_id: string | null;
  valor_total: number;
  taxa_prefeitura: number;
  vagas_totais: number;
  vagas_disponiveis: number;
  ativo: boolean;
  destaque: boolean;
  created_at: string;
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

interface Pedido {
  id: string;
  codigo_pedido: string;
  tipo_item: string;
  item_id: string;
  nome_cliente: string;
  cpf_cliente: string;
  email_cliente: string;
  valor_total: number;
  metodo_pagamento: string;
  status_pagamento: string;
  criado_em: string;
  data_checkin: string | null;
  data_checkout: string | null;
  endereco_completo: string | null;
  quantidade: number;
  telefone_cliente: string | null;
  data_nascimento: string | null;
  foto_url: string | null;
  hotel_id: string | null;
  guia_id: string | null;
  tipo_quarto: string | null;
  checkin_realizado_em: string | null;
  checkout_realizado_em: string | null;
  nome_item: string | null;
  repasse_hotel: number;
  repasse_guia: number;
  taxa_prefeitura: number;
  quantidade_pessoas: number | null;
  quantidade_quartos: number | null;
  hospedes_extras: any[] | null;
  quarto_tipo_id: string | null;
}

interface TaxaServico {
  tipo_servico: string;
  porcentagem: number;
}

interface Pacote {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_principal: string;
  dias: number;
  noites: number;
  ativo: boolean;
  roteiro_detalhado: string | null;
  imagens_galeria: string[] | null;
  horarios_info: string | null;
  preco: number;
  categoria: string;
  vagas_totais: number;
  vagas_vendidas: number;
  parceiro_id: string | null;
  agencia_id: string | null;
}

interface Hotel {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  estrelas: number;
  imagem_url: string;
  whatsapp: string | null;
  endereco: string | null;
  preco_medio: string | null;
  comodidades: string[] | null;
  galeria: string[] | null;
  pagbank_recebedor_id: string | null;
  quarto_standard_nome: string | null;
  quarto_standard_preco: number;
  quarto_luxo_nome: string | null;
  quarto_luxo_preco: number;
  quarto_standard_comodidades: string[] | null;
  quarto_luxo_comodidades: string[] | null;
  quarto_standard_imagens: string[] | null;
  quarto_luxo_imagens: string[] | null;
  politicas: any | null;
  contatos: any | null;
  avaliacoes_info: any | null;
  porcentagem_acompanhante: number;
  max_parcelas_sem_juros: number;
}

interface Gastronomia {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_url: string;
  ordem: number;
  ativo: boolean;
  criado_em: string;
  whatsapp: string | null;
  link_google_maps: string | null;
  sobre_nos_texto: string | null;
  foto_equipe_url: string | null;
  galeria: string[] | null;
  cardapio: any[] | null;
}

interface Atracao {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  imagem_url: string;
  preco_entrada: number;
  pagbank_recebedor_id: string | null;
  whatsapp: string | null;
  link_google_maps: string | null;
  link_hospedagem: string | null;
  galeria: string[] | null;
}

// ─── Constantes ────────────────────────────────────────────────────────────────

const CATEGORIAS_EVENTO = [
  "Aventura", "Turismo", "Ecoturismo", "Festividade",
  "Gastronomia", "Cultura", "Lazer", "Esporte", "Verão",
];

const DURACAO_OPCOES = [
  "1–2 horas", "2–3 horas", "3–4 horas", "4–6 horas", "6–8 horas", "8+ horas"
];
const DIFICULDADE_OPCOES = ["Fácil", "Moderada", "Difícil", "Extremo"];
const GRUPO_OPCOES = ["Sem limite", "Até 8 pessoas", "Até 15 pessoas", "Até 30 pessoas"];
const GUIA_OPCOES = ["Recomendado", "Obrigatório", "Não necessário"];

const EMPTY_ROTA = {
  titulo: "",
  descricao_curta: "",
  descricao_longa: null,
  imagem_url: null,
  ativo: true,
  duracao: null,
  dificuldade: null,
  grupo: null,
  guia: null,
  galeria: null,
  como_chegar: null,
};

// ─── Helpers & micro-components ───────────────────────────────────────────────

const inputCls = "w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#00577C] focus:ring-2 focus:ring-[#00577C]/20 transition placeholder:text-slate-400";

function FormField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><label className="block text-xs font-black text-slate-500 mb-1 uppercase tracking-wider">{label}</label>{children}</div>;
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider ${className}`}>{children}</th>;
}

function Skeleton({ rows }: { rows: number }) {
  return <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-14 bg-slate-50 border-b border-slate-100 animate-pulse" />)}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ativo: "bg-[#009640]/10 text-[#009640] border-[#009640]/20",
    inativo: "bg-slate-100 text-slate-500 border-slate-200",
    pendente: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${styles[status] || styles.inativo}`}>{status}</span>;
}

function tipoEmoji(tipo: string) {
  const map: Record<string, string> = { hotel: "🏨", passeios: "🥾", pacotes: "📦", guia: "🧭" };
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

// ─── Componente Principal com Login ───────────────────────────────────────────

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
      <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex items-center justify-center p-4`}>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center">
            <div className="relative w-32 h-16 mb-4">
              <Image src="/logop.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <h1 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Portal de Serviços</h1>
            <p className="text-sm text-slate-500 mt-1">Secretaria Municipal de Turismo</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">
                  Senha de acesso
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setErroLogin(""); }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#00577C] focus:ring-2 focus:ring-[#00577C]/20 transition"
                  placeholder="••••••••"
                  autoFocus
                />
                {erroLogin && <p className="text-red-500 text-xs mt-1.5">{erroLogin}</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white font-black rounded-lg py-2.5 text-sm transition shadow-sm uppercase tracking-widest"
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
  const [activeTab, setActiveTab] = useState<
    "rotas" | "eventos" | "passeios" | "parceiros" | "taxas" | "pedidos" | "pacotes" | "hoteis" | "gastronomia" | "atracoes"
  >("rotas");

  const tabs = [
    { id: "rotas",       label: "Rotas Turísticas", icon: "🗺️" },
    { id: "eventos",     label: "Eventos",          icon: "📅" },
    { id: "passeios",    label: "Passeios",         icon: "🥾" },
    { id: "parceiros",   label: "Parceiros",        icon: "🤝" },
    { id: "taxas",       label: "Taxas de Serviço", icon: "💰" },
    { id: "pedidos",     label: "Pedidos",          icon: "🛒" },
    { id: "pacotes",     label: "Pacotes",          icon: "🎒" },
    { id: "hoteis",      label: "Hotéis",           icon: "🏨" },
    { id: "gastronomia", label: "Gastronomia",      icon: "🍽️" },
    { id: "atracoes",    label: "Atrações",         icon: "🏞️" },
  ] as const;

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-800`}>
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
            className="text-xs text-slate-500 hover:text-[#00577C] transition flex items-center gap-1.5 font-bold uppercase tracking-widest"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-black border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-[#F9C400] text-[#00577C]"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "rotas"       && <TabRotas />}
        {activeTab === "eventos"     && <TabEventos />}
        {activeTab === "passeios"    && <TabPasseiosAdmin />}
        {activeTab === "parceiros"   && <TabParceiros />}
        {activeTab === "taxas"       && <TabTaxasServico />}
        {activeTab === "pedidos"     && <TabPedidos />}
        {activeTab === "pacotes"     && <TabPacotes />}
        {activeTab === "hoteis"      && <TabHoteis />}
        {activeTab === "gastronomia" && <TabGastronomia />}
        {activeTab === "atracoes"    && <TabAtracoes />}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROTAS
// ═══════════════════════════════════════════════════════════════════════════════

function TabRotas() {
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Rota | null>(null);
  const [form, setForm] = useState<any>(EMPTY_ROTA);
  const [imagemCapaFile, setImagemCapaFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const fileCapaRef = useRef<HTMLInputElement>(null);
  const fileGaleriaRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchRotas(); }, []);

  async function fetchRotas() {
    setLoading(true);
    const { data } = await supabase.from("rotas").select("*").order("ordem", { ascending: true });
    setRotas(data || []);
    setLoading(false);
  }

  async function getProximaOrdem() {
    const { data } = await supabase
      .from("rotas")
      .select("ordem")
      .order("ordem", { ascending: false })
      .limit(1);
    if (data && data.length > 0) return data[0].ordem + 1;
    return 1;
  }

  function abrirFormNovo() {
    setEditando(null);
    setForm(EMPTY_ROTA);
    setImagemCapaFile(null);
    setGaleriaFiles([]);
    setShowForm(true);
  }

  function abrirFormEditar(rota: Rota) {
    setEditando(rota);
    setForm({
      titulo: rota.titulo,
      descricao_curta: rota.descricao_curta,
      descricao_longa: rota.descricao_longa,
      imagem_url: rota.imagem_url,
      ativo: rota.ativo,
      duracao: rota.duracao,
      dificuldade: rota.dificuldade,
      grupo: rota.grupo,
      guia: rota.guia,
      galeria: rota.galeria,
      como_chegar: rota.como_chegar,
    });
    setImagemCapaFile(null);
    setGaleriaFiles([]);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.titulo || !form.descricao_curta) {
      setFeedback("Título e descrição curta são obrigatórios.");
      return;
    }
    setSaving(true);

    let imagem_url = form.imagem_url;
    if (imagemCapaFile) {
      const ext = imagemCapaFile.name.split(".").pop();
      const path = `rotas/capa/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("rotas").upload(path, imagemCapaFile, { upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("rotas").getPublicUrl(path);
        imagem_url = pub.publicUrl;
      }
    }

    let galeriaUrls: string[] = form.galeria ? [...form.galeria] : [];
    for (const file of galeriaFiles) {
      const ext = file.name.split(".").pop();
      const path = `rotas/galeria/${Date.now()}-${Math.random()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("rotas").upload(path, file, { upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("rotas").getPublicUrl(path);
        galeriaUrls.push(pub.publicUrl);
      }
    }

    const payload = {
      ...form,
      imagem_url,
      galeria: galeriaUrls.length ? galeriaUrls : (form.galeria || null),
    };

    if (editando) {
      await supabase.from("rotas").update(payload).eq("id", editando.id);
      setFeedback("Rota atualizada!");
    } else {
      const novaOrdem = await getProximaOrdem();
      await supabase.from("rotas").insert({ ...payload, ordem: novaOrdem });
      setFeedback("Rota criada!");
    }

    setShowForm(false);
    setSaving(false);
    fetchRotas();
    setTimeout(() => setFeedback(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta rota permanentemente?")) return;
    setDeletingId(id);
    await supabase.from("rotas").delete().eq("id", id);
    setDeletingId(null);
    fetchRotas();
  }

  const f = (field: keyof typeof form, value: any) =>
    setForm((prev: any) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Rotas Turísticas</h2>
          <p className="text-xs text-slate-500">{rotas.length} rotas cadastradas</p>
        </div>
        <div className="flex items-center gap-3">
          {feedback && <span className="text-xs text-[#009640] font-bold">{feedback}</span>}
          <button
            onClick={abrirFormNovo}
            className="bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5 uppercase tracking-wider"
          >
            <span className="text-base leading-none">+</span> Nova rota
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className={`${jakarta.className} font-black text-slate-800`}>
                {editando ? "Editar rota" : "Nova rota"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 transition text-lg leading-none">✕</button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Título *" className="md:col-span-2">
                <input value={form.titulo} onChange={(e) => f("titulo", e.target.value)} className={inputCls} />
              </FormField>
              <FormField label="Descrição curta *" className="md:col-span-2">
                <textarea value={form.descricao_curta} onChange={(e) => f("descricao_curta", e.target.value)} rows={2} className={inputCls + " resize-none"} />
              </FormField>
              <FormField label="Descrição longa" className="md:col-span-2">
                <textarea value={form.descricao_longa || ""} onChange={(e) => f("descricao_longa", e.target.value || null)} rows={5} className={inputCls + " resize-none"} />
              </FormField>
              <FormField label="Ativo">
                <select value={String(form.ativo)} onChange={(e) => f("ativo", e.target.value === "true")} className={inputCls}>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </FormField>
              <FormField label="Duração">
                <select value={form.duracao || ""} onChange={(e) => f("duracao", e.target.value || null)} className={inputCls}>
                  <option value="">Selecione</option>
                  {DURACAO_OPCOES.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </FormField>
              <FormField label="Dificuldade">
                <select value={form.dificuldade || ""} onChange={(e) => f("dificuldade", e.target.value || null)} className={inputCls}>
                  <option value="">Selecione</option>
                  {DIFICULDADE_OPCOES.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </FormField>
              <FormField label="Grupo">
                <select value={form.grupo || ""} onChange={(e) => f("grupo", e.target.value || null)} className={inputCls}>
                  <option value="">Selecione</option>
                  {GRUPO_OPCOES.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </FormField>
              <FormField label="Guia">
                <select value={form.guia || ""} onChange={(e) => f("guia", e.target.value || null)} className={inputCls}>
                  <option value="">Selecione</option>
                  {GUIA_OPCOES.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </FormField>
              <FormField label="Como chegar" className="md:col-span-2">
                <textarea value={form.como_chegar || ""} onChange={(e) => f("como_chegar", e.target.value || null)} rows={3} className={inputCls + " resize-none"} />
              </FormField>
              <FormField label="Imagem de capa" className="md:col-span-2">
                {form.imagem_url && !imagemCapaFile && (
                  <img src={form.imagem_url} alt="Capa atual" className="h-24 w-auto rounded-lg mb-2 object-cover border border-slate-200" />
                )}
                {imagemCapaFile && <p className="text-xs text-[#00577C] mb-1">📎 {imagemCapaFile.name}</p>}
                <input ref={fileCapaRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImagemCapaFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => fileCapaRef.current?.click()} className="text-xs border border-dashed border-slate-300 hover:border-[#00577C] text-slate-400 hover:text-[#00577C] px-3 py-2 rounded-lg transition w-full">
                  {imagemCapaFile ? "Trocar imagem" : "Escolher imagem de capa"}
                </button>
              </FormField>
              <FormField label="Galeria de imagens" className="md:col-span-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.galeria?.map((url: string, idx: number) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden">
                      <img src={url} alt={`galeria-${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {galeriaFiles.map((file, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center text-xs">
                      📷 {file.name.slice(0, 8)}
                    </div>
                  ))}
                </div>
                <input ref={fileGaleriaRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => setGaleriaFiles(Array.from(e.target.files || []))} />
                <button type="button" onClick={() => fileGaleriaRef.current?.click()} className="text-xs border border-dashed border-slate-300 hover:border-[#00577C] text-slate-400 hover:text-[#00577C] px-3 py-2 rounded-lg transition w-full">
                  Adicionar imagens à galeria
                </button>
              </FormField>
            </div>
            <div className="flex gap-2 p-5 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm transition disabled:opacity-50 shadow-sm uppercase tracking-wider">
                {saving ? "Salvando…" : editando ? "Salvar alterações" : "Criar rota"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton rows={4} />
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <Th>Ordem</Th>
                <Th>Rota</Th>
                <Th>Duração</Th>
                <Th>Dificuldade</Th>
                <Th>Grupo</Th>
                <Th>Guia</Th>
                <Th>Ativo</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {rotas.map((rota) => (
                <tr key={rota.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-mono text-slate-600">{rota.ordem}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {rota.imagem_url ? (
                        <img src={rota.imagem_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">🗺️</div>
                      )}
                      <div>
                        <p className="font-medium text-slate-800 leading-tight">{rota.titulo}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{rota.descricao_curta}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{rota.duracao || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{rota.dificuldade || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{rota.grupo || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{rota.guia || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${rota.ativo ? "bg-[#009640]/10 text-[#009640] border-[#009640]/20" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {rota.ativo ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => abrirFormEditar(rota)} className="text-xs text-[#00577C] hover:text-[#004a6b] border border-[#00577C]/20 hover:border-[#00577C]/40 bg-[#00577C]/5 hover:bg-[#00577C]/10 px-2.5 py-1 rounded-md transition font-medium">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(rota.id)} disabled={deletingId === rota.id} className="text-xs text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition disabled:opacity-40">
                        {deletingId === rota.id ? "…" : "Remover"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rotas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">
                    Nenhuma rota cadastrada.
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

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTOS
// ═══════════════════════════════════════════════════════════════════════════════

function TabEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Evento | null>(null);
  const [form, setForm] = useState<Omit<Evento, "id">>({
    titulo: "", subtitulo: null, descricao: null, data: "",
    horario: null, duracao: null, local: "", imagem_url: null,
    categoria: "Turismo", preco: null, classificacao: null,
    link_bilheteira: null, destaque: false,
  });
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
    setForm({
      titulo: "", subtitulo: null, descricao: null, data: "",
      horario: null, duracao: null, local: "", imagem_url: null,
      categoria: "Turismo", preco: null, classificacao: null,
      link_bilheteira: null, destaque: false,
    });
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
      const { error: upErr } = await supabase.storage.from("eventos").upload(path, imagemFile, { upsert: true });
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Eventos</h2>
          <p className="text-xs text-slate-500">{eventos.length} eventos cadastrados</p>
        </div>
        <div className="flex items-center gap-3">
          {feedback && <span className="text-xs text-[#009640] font-bold">{feedback}</span>}
          <button
            onClick={abrirFormNovo}
            className="bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5 uppercase tracking-wider"
          >
            <span className="text-base leading-none">+</span> Novo evento
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className={`${jakarta.className} font-black text-slate-800`}>
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
                <textarea value={form.descricao || ""} onChange={(e) => f("descricao", e.target.value || null)} rows={3} className={inputCls + " resize-none"} />
              </FormField>
              <FormField label="Imagem de Capa" className="sm:col-span-2">
                {form.imagem_url && !imagemFile && <img src={form.imagem_url} alt="" className="h-24 w-auto rounded-lg mb-2 object-cover" />}
                {imagemFile && <p className="text-xs text-[#00577C] mb-1">📎 {imagemFile.name}</p>}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImagemFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs border border-dashed border-slate-300 hover:border-[#00577C] text-slate-400 hover:text-[#00577C] px-3 py-2 rounded-lg transition w-full">
                  {imagemFile ? "Trocar imagem" : "Escolher imagem"}
                </button>
              </FormField>
              <FormField label="" className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.destaque} onChange={(e) => f("destaque", e.target.checked)} className="accent-[#F9C400] w-4 h-4" />
                  <span className="text-sm text-slate-600">Marcar como destaque</span>
                </label>
              </FormField>
            </div>
            <div className="flex gap-2 p-5 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm transition disabled:opacity-50 shadow-sm uppercase tracking-wider">
                {saving ? "Salvando…" : editando ? "Salvar alterações" : "Criar evento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton rows={6} />
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <Th>Evento</Th><Th>Data</Th><Th>Local</Th><Th>Categoria</Th><Th>Destaque</Th><Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((ev) => (
                <tr key={ev.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {ev.imagem_url ? <img src={ev.imagem_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">📅</div>}
                      <div><p className="font-medium text-slate-800">{ev.titulo}</p>{ev.subtitulo && <p className="text-xs text-slate-400">{ev.subtitulo}</p>}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtData(ev.data)}</td>
                  <td className="px-4 py-3 text-slate-600">{ev.local}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-[#00577C]/10 text-[#00577C] border border-[#00577C]/20 px-2 py-0.5 rounded-full font-medium">{ev.categoria}</span></td>
                  <td className="px-4 py-3 text-center">{ev.destaque ? <span className="text-[#F9C400] text-base">★</span> : <span className="text-slate-200 text-base">★</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => abrirFormEditar(ev)} className="text-xs text-[#00577C] hover:text-[#004a6b] border border-[#00577C]/20 hover:border-[#00577C]/40 bg-[#00577C]/5 hover:bg-[#00577C]/10 px-2.5 py-1 rounded-md transition font-medium">Editar</button>
                      <button onClick={() => handleDelete(ev.id)} disabled={deletingId === ev.id} className="text-xs text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition disabled:opacity-40">{deletingId === ev.id ? "…" : "Remover"}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {eventos.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Nenhum evento cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PASSEIOS
// ═══════════════════════════════════════════════════════════════════════════════

function TabPasseiosAdmin() {
  const [passeios, setPasseios] = useState<Passeio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Passeio | null>(null);
  const [form, setForm] = useState<any>({});
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const fileCapaRef = useRef<HTMLInputElement>(null);
  const fileGaleriaRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPasseios(); }, []);

  async function fetchPasseios() {
    setLoading(true);
    const { data } = await supabase.from("passeios").select("*").order("created_at", { ascending: false });
    setPasseios(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null);
    setForm({
      titulo: "", descricao_curta: null, descricao_completa: null, imagem_principal: null,
      imagens_galeria: null, data_passeio: "", horario_saida: null, ponto_encontro: null,
      coordenadas_google_maps: null, nome_guia: null, guia_id: null, valor_total: 0,
      taxa_prefeitura: 0, vagas_totais: 0, vagas_disponiveis: 0, ativo: true, destaque: false,
      categoria: null
    });
    setImagemFile(null);
    setGaleriaFiles([]);
    setShowForm(true);
  }

  function abrirFormEditar(p: Passeio) {
    setEditando(p);
    setForm({ ...p });
    setImagemFile(null);
    setGaleriaFiles([]);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.titulo || !form.data_passeio) {
      setFeedback("Título e data do passeio são obrigatórios.");
      return;
    }
    setSaving(true);
    let imagem_principal = form.imagem_principal;
    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const path = `passeios/capas/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("imagens-passeios").upload(path, imagemFile, { upsert: true });
      if (!error) {
        const { data: pub } = supabase.storage.from("imagens-passeios").getPublicUrl(path);
        imagem_principal = pub.publicUrl;
      }
    }
    let galeriaUrls: string[] = form.imagens_galeria ? [...form.imagens_galeria] : [];
    for (const file of galeriaFiles) {
      const ext = file.name.split(".").pop();
      const path = `passeios/galeria/${Date.now()}-${Math.random()}.${ext}`;
      const { error } = await supabase.storage.from("imagens-passeios").upload(path, file, { upsert: true });
      if (!error) {
        const { data: pub } = supabase.storage.from("imagens-passeios").getPublicUrl(path);
        galeriaUrls.push(pub.publicUrl);
      }
    }
    const payload = { ...form, imagem_principal, imagens_galeria: galeriaUrls.length ? galeriaUrls : form.imagens_galeria };
    if (editando) {
      await supabase.from("passeios").update(payload).eq("id", editando.id);
      setFeedback("Passeio atualizado!");
    } else {
      await supabase.from("passeios").insert({ ...payload, vagas_disponiveis: payload.vagas_totais });
      setFeedback("Passeio criado!");
    }
    setShowForm(false);
    setSaving(false);
    fetchPasseios();
    setTimeout(() => setFeedback(""), 3000);
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from("passeios").update({ ativo: !ativo }).eq("id", id);
    fetchPasseios();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este passeio permanentemente?")) return;
    await supabase.from("passeios").delete().eq("id", id);
    fetchPasseios();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Passeios</h2>
          <p className="text-xs text-slate-500">{passeios.length} passeios cadastrados</p>
        </div>
        <div className="flex items-center gap-3">
          {feedback && <span className="text-xs text-[#009640] font-bold">{feedback}</span>}
          <button onClick={abrirFormNovo} className="bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
            <span className="text-base leading-none">+</span> Novo passeio
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className={`${jakarta.className} font-black text-slate-800`}>{editando ? "Editar passeio" : "Novo passeio"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Título *" className="md:col-span-2">
                <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={inputCls} />
              </FormField>
              <FormField label="Descrição curta" className="md:col-span-2">
                <textarea value={form.descricao_curta || ""} onChange={(e) => setForm({ ...form, descricao_curta: e.target.value })} rows={2} className={inputCls} />
              </FormField>
              <FormField label="Descrição completa" className="md:col-span-2">
                <textarea value={form.descricao_completa || ""} onChange={(e) => setForm({ ...form, descricao_completa: e.target.value })} rows={5} className={inputCls} />
              </FormField>
              <FormField label="Data *">
                <input type="date" value={form.data_passeio} onChange={(e) => setForm({ ...form, data_passeio: e.target.value })} className={inputCls} />
              </FormField>
              <FormField label="Horário de saída">
                <input type="time" value={form.horario_saida || ""} onChange={(e) => setForm({ ...form, horario_saida: e.target.value })} className={inputCls} />
              </FormField>
              <FormField label="Ponto de encontro">
                <input value={form.ponto_encontro || ""} onChange={(e) => setForm({ ...form, ponto_encontro: e.target.value })} className={inputCls} />
              </FormField>
              <FormField label="Coordenadas (Google Maps)">
                <input value={form.coordenadas_google_maps || ""} onChange={(e) => setForm({ ...form, coordenadas_google_maps: e.target.value })} placeholder="-6.395361, -48.567222" className={inputCls} />
              </FormField>
              <FormField label="Nome do guia">
                <input value={form.nome_guia || ""} onChange={(e) => setForm({ ...form, nome_guia: e.target.value })} className={inputCls} />
              </FormField>
              <FormField label="Valor total (R$)">
                <input type="number" step="0.01" value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: parseFloat(e.target.value) })} className={inputCls} />
              </FormField>
              <FormField label="Taxa da prefeitura (R$)">
                <input type="number" step="0.01" value={form.taxa_prefeitura} onChange={(e) => setForm({ ...form, taxa_prefeitura: parseFloat(e.target.value) })} className={inputCls} />
              </FormField>
              <FormField label="Vagas totais">
                <input type="number" value={form.vagas_totais} onChange={(e) => setForm({ ...form, vagas_totais: parseInt(e.target.value) })} className={inputCls} />
              </FormField>
              <FormField label="Categoria">
                <input value={form.categoria || ""} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputCls} />
              </FormField>
              <FormField label="Destaque">
                <select value={String(form.destaque)} onChange={(e) => setForm({ ...form, destaque: e.target.value === "true" })} className={inputCls}>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </FormField>
              <FormField label="Ativo">
                <select value={String(form.ativo)} onChange={(e) => setForm({ ...form, ativo: e.target.value === "true" })} className={inputCls}>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </FormField>
              <FormField label="Imagem de capa" className="md:col-span-2">
                {form.imagem_principal && !imagemFile && <img src={form.imagem_principal} alt="capa" className="h-24 rounded-lg mb-2 object-cover" />}
                <input ref={fileCapaRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImagemFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => fileCapaRef.current?.click()} className="text-xs border border-dashed border-slate-300 hover:border-[#00577C] px-3 py-2 rounded-lg w-full">
                  {imagemFile ? "Trocar imagem" : "Escolher imagem de capa"}
                </button>
              </FormField>
            </div>
            <div className="flex gap-2 p-5 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm disabled:opacity-50 shadow-sm uppercase tracking-wider">
                {saving ? "Salvando…" : editando ? "Salvar alterações" : "Criar passeio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton rows={5} />
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <Th>Imagem</Th><Th>Passeio</Th><Th>Data</Th><Th>Valor</Th><Th>Vagas</Th><Th>Ativo</Th><Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {passeios.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3"><img src={p.imagem_principal || "/placeholder.png"} alt={p.titulo} className="w-12 h-12 rounded-lg object-cover" /></td>
                  <td className="px-4 py-3"><div className="font-medium">{p.titulo}</div><div className="text-xs text-slate-400 line-clamp-1">{p.descricao_curta}</div></td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtData(p.data_passeio)}</td>
                  <td className="px-4 py-3">R$ {p.valor_total.toFixed(2)}</td>
                  <td className="px-4 py-3">{p.vagas_disponiveis}/{p.vagas_totais}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleAtivo(p.id, p.ativo)} className={`text-xs px-2 py-1 rounded-full font-medium ${p.ativo ? "bg-[#009640]/10 text-[#009640]" : "bg-slate-100 text-slate-500"}`}>
                      {p.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => abrirFormEditar(p)} className="text-xs text-[#00577C] border border-[#00577C]/20 bg-[#00577C]/5 px-2 py-1 rounded-md">Editar</button>
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 border border-red-200 bg-red-50 px-2 py-1 rounded-md">Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARCEIROS
// ═══════════════════════════════════════════════════════════════════════════════

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

  const filtered = filtro === "todos" ? parceiros : parceiros.filter((p) => p.tipo_parceiro === filtro);
  const pendentes = parceiros.filter((p) => p.status === "pendente");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Gestão de Parceiros</h2>
          <p className="text-xs text-slate-500">{parceiros.length} parceiros · {pendentes.length} pendente(s)</p>
        </div>
        {feedback && <span className="text-xs text-[#009640] font-bold">{feedback}</span>}
      </div>

      {pendentes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-700 mb-3">⏳ {pendentes.length} parceiro(s) aguardando validação</p>
          <div className="space-y-2">
            {pendentes.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white border border-amber-100 rounded-lg px-3 py-2">
                <div><p className="text-sm text-slate-800 font-medium">{p.nome_negocio}</p><p className="text-xs text-slate-500">{p.email} · {p.tipo_parceiro}</p></div>
                <button onClick={() => alterarStatus(p.id, "ativo")} disabled={actionId === p.id} className="text-xs bg-[#009640] hover:bg-[#007a33] text-white font-semibold px-3 py-1 rounded-md transition shadow-sm">Aprovar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 flex-wrap">
        {tipos.map((t) => (
          <button key={t} onClick={() => setFiltro(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition border ${filtro === t ? "bg-[#00577C] text-white border-[#00577C]" : "text-slate-500 border-slate-200 hover:border-[#00577C]/40 hover:text-[#00577C] bg-white"}`}>
            {t === "todos" ? `Todos (${parceiros.length})` : `${t} (${parceiros.filter(p => p.tipo_parceiro === t).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton rows={4} />
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50"><Th>Parceiro</Th><Th>Tipo</Th><Th>Contacto</Th><Th>Registado em</Th><Th>Estado</Th><Th className="text-right">Ações</Th></tr></thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-[#00577C]/10 border border-[#00577C]/20 flex items-center justify-center text-sm">{tipoEmoji(p.tipo_parceiro)}</div><span className="font-medium text-slate-800">{p.nome_negocio}</span></div></td>
                  <td className="px-4 py-3"><span className="text-xs bg-[#00577C]/10 text-[#00577C] border border-[#00577C]/20 px-2 py-0.5 rounded-full font-medium capitalize">{p.tipo_parceiro}</span></td>
                  <td className="px-4 py-3 text-slate-500 text-xs"><div>{p.email}</div>{p.telefone && <div>{p.telefone}</div>}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{fmtDatetime(p.criado_em)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {p.status === "ativo"
                        ? <button onClick={() => alterarStatus(p.id, "inativo")} disabled={actionId === p.id} className="text-xs text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-md">Desativar</button>
                        : <button onClick={() => alterarStatus(p.id, "ativo")} disabled={actionId === p.id} className="text-xs text-[#009640] hover:text-[#007a33] border border-emerald-200 hover:border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md font-medium">Ativar</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAXAS DE SERVIÇO
// ═══════════════════════════════════════════════════════════════════════════════

function TabTaxasServico() {
  const [taxas, setTaxas] = useState<TaxaServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => { fetchTaxas(); }, []);

  async function fetchTaxas() {
    setLoading(true);
    const { data } = await supabase.from("taxas_servicos").select("*");
    setTaxas(data || []);
    setLoading(false);
  }

  async function updateTaxa(tipo: string, porcentagem: number) {
    setSaving(true);
    await supabase.from("taxas_servicos").upsert({ tipo_servico: tipo, porcentagem });
    setFeedback(`Taxa para ${tipo} atualizada!`);
    fetchTaxas();
    setSaving(false);
    setTimeout(() => setFeedback(""), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Taxas de Serviço</h2>
          <p className="text-xs text-slate-500">Percentuais aplicados sobre cada tipo de serviço (hotel, passeio, pacote)</p>
        </div>
        {feedback && <span className="text-xs text-[#009640] font-bold">{feedback}</span>}
      </div>

      {loading ? (
        <Skeleton rows={3} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <Th>Tipo de Serviço</Th><Th>Taxa (%)</Th><Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {taxas.map((taxa) => (
                <tr key={taxa.tipo_servico} className="border-b border-slate-100">
                  <td className="px-4 py-3 capitalize font-medium">{taxa.tipo_servico}</td>
                  <td className="px-4 py-3">
                    <input type="number" step="0.01" defaultValue={taxa.porcentagem} onBlur={(e) => updateTaxa(taxa.tipo_servico, parseFloat(e.target.value))} className="w-24 px-2 py-1 border border-slate-200 rounded-lg" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => updateTaxa(taxa.tipo_servico, taxa.porcentagem)} className="text-xs text-[#00577C] border border-[#00577C]/20 px-2 py-1 rounded-md">Salvar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PEDIDOS
// ═══════════════════════════════════════════════════════════════════════════════

function TabPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  useEffect(() => { fetchPedidos(); }, []);

  async function fetchPedidos() {
    setLoading(true);
    const { data } = await supabase.from("pedidos").select("*").order("criado_em", { ascending: false });
    setPedidos(data || []);
    setLoading(false);
  }

  const filtered = pedidos.filter(p =>
    (filtroStatus === "todos" || p.status_pagamento === filtroStatus) &&
    (filtroTipo === "todos" || p.tipo_item === filtroTipo)
  );

  const statusCores: Record<string, string> = {
    pago: "bg-[#009640]/10 text-[#009640]",
    aguardando: "bg-amber-100 text-amber-700",
    cancelado: "bg-red-100 text-red-600"
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Pedidos</h2>
          <p className="text-xs text-slate-500">Total: {pedidos.length} pedidos</p>
        </div>
        <div className="flex gap-2">
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1">
            <option value="todos">Todos os status</option>
            <option value="pago">Pago</option>
            <option value="aguardando">Aguardando</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1">
            <option value="todos">Todos os tipos</option>
            <option value="hotel">Hotel</option>
            <option value="passeio">Passeio</option>
            <option value="pacote">Pacote</option>
            <option value="carteira">Carteira</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Skeleton rows={6} />
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <Th>Código</Th><Th>Cliente</Th><Th>Tipo</Th><Th>Item</Th><Th>Valor</Th><Th>Status</Th><Th>Data</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.codigo_pedido}</td>
                  <td className="px-4 py-3"><div>{p.nome_cliente}</div><div className="text-xs text-slate-400">{p.email_cliente}</div></td>
                  <td className="px-4 py-3 capitalize">{p.tipo_item}</td>
                  <td className="px-4 py-3">{p.nome_item || "—"}</td>
                  <td className="px-4 py-3 font-semibold">R$ {p.valor_total.toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCores[p.status_pagamento] || "bg-slate-100"}`}>{p.status_pagamento}</span></td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{fmtDatetime(p.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PACOTES
// ═══════════════════════════════════════════════════════════════════════════════

function TabPacotes() {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Pacote | null>(null);
  const [form, setForm] = useState<any>({});
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPacotes(); }, []);

  async function fetchPacotes() {
    setLoading(true);
    const { data } = await supabase.from("pacotes").select("*").order("titulo");
    setPacotes(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null);
    setForm({ titulo: "", descricao_curta: "", imagem_principal: "", dias: 1, noites: 1, ativo: true, roteiro_detalhado: null, imagens_galeria: null, horarios_info: null, preco: 0, categoria: "Aventura", vagas_totais: 0, vagas_vendidas: 0, parceiro_id: null, agencia_id: null });
    setImagemFile(null);
    setShowForm(true);
  }

  function abrirFormEditar(p: Pacote) {
    setEditando(p);
    setForm({ ...p });
    setImagemFile(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.titulo || !form.preco) {
      setFeedback("Título e preço são obrigatórios.");
      return;
    }
    setSaving(true);
    let imagem_principal = form.imagem_principal;
    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const path = `pacotes/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("imagens-pacotes").upload(path, imagemFile, { upsert: true });
      if (!error) {
        const { data: pub } = supabase.storage.from("imagens-pacotes").getPublicUrl(path);
        imagem_principal = pub.publicUrl;
      }
    }
    const payload = { ...form, imagem_principal };
    if (editando) {
      await supabase.from("pacotes").update(payload).eq("id", editando.id);
      setFeedback("Pacote atualizado!");
    } else {
      await supabase.from("pacotes").insert(payload);
      setFeedback("Pacote criado!");
    }
    setShowForm(false);
    setSaving(false);
    fetchPacotes();
    setTimeout(() => setFeedback(""), 3000);
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from("pacotes").update({ ativo: !ativo }).eq("id", id);
    fetchPacotes();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este pacote?")) return;
    await supabase.from("pacotes").delete().eq("id", id);
    fetchPacotes();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Pacotes</h2><p className="text-xs text-slate-500">{pacotes.length} pacotes</p></div>
        <div className="flex gap-3">{feedback && <span className="text-xs text-[#009640] font-bold">{feedback}</span>}<button onClick={abrirFormNovo} className="bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm px-4 py-2 rounded-lg">+ Novo pacote</button></div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Título *" className="md:col-span-2"><input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={inputCls} /></FormField>
              <FormField label="Descrição curta" className="md:col-span-2"><textarea value={form.descricao_curta || ""} onChange={(e) => setForm({ ...form, descricao_curta: e.target.value })} rows={2} className={inputCls} /></FormField>
              <FormField label="Dias"><input type="number" value={form.dias} onChange={(e) => setForm({ ...form, dias: parseInt(e.target.value) })} className={inputCls} /></FormField>
              <FormField label="Noites"><input type="number" value={form.noites} onChange={(e) => setForm({ ...form, noites: parseInt(e.target.value) })} className={inputCls} /></FormField>
              <FormField label="Preço (R$)"><input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: parseFloat(e.target.value) })} className={inputCls} /></FormField>
              <FormField label="Categoria"><input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputCls} /></FormField>
              <FormField label="Vagas totais"><input type="number" value={form.vagas_totais} onChange={(e) => setForm({ ...form, vagas_totais: parseInt(e.target.value) })} className={inputCls} /></FormField>
              <FormField label="Ativo"><select value={String(form.ativo)} onChange={(e) => setForm({ ...form, ativo: e.target.value === "true" })} className={inputCls}><option value="true">Sim</option><option value="false">Não</option></select></FormField>
              <FormField label="Imagem principal" className="md:col-span-2">
                {form.imagem_principal && !imagemFile && <img src={form.imagem_principal} className="h-20 rounded-lg mb-2 object-cover" />}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImagemFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => fileRef.current?.click()} className="text-xs border border-dashed border-slate-300 hover:border-[#00577C] px-3 py-2 rounded-lg w-full">Escolher imagem</button>
              </FormField>
            </div>
            <div className="flex gap-2 p-5 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-[#00577C] text-white font-black">{saving ? "Salvando…" : editando ? "Salvar" : "Criar"}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <Skeleton rows={4} /> : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead><tr className="border-b bg-slate-50"><Th>Imagem</Th><Th>Título</Th><Th>Dias</Th><Th>Preço</Th><Th>Ativo</Th><Th className="text-right">Ações</Th></tr></thead>
            <tbody>{pacotes.map(p => (
              <tr key={p.id} className="border-b">
                <td className="px-4 py-3"><img src={p.imagem_principal || "/placeholder.png"} className="w-10 h-10 rounded-lg object-cover" /></td>
                <td className="px-4 py-3 font-medium">{p.titulo}</td>
                <td className="px-4 py-3">{p.dias} dias</td>
                <td className="px-4 py-3">R$ {p.preco.toFixed(2)}</td>
                <td className="px-4 py-3"><button onClick={() => toggleAtivo(p.id, p.ativo)} className={`text-xs px-2 py-1 rounded-full ${p.ativo ? "bg-[#009640]/10 text-[#009640]" : "bg-slate-100 text-slate-500"}`}>{p.ativo ? "Ativo" : "Inativo"}</button></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => abrirFormEditar(p)} className="text-xs text-[#00577C] border border-[#00577C]/20 px-2 py-1 rounded-md">Editar</button>
                  <button onClick={() => handleDelete(p.id)} className="ml-2 text-xs text-red-500 border border-red-200 px-2 py-1 rounded-md">Remover</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOTÉIS
// ═══════════════════════════════════════════════════════════════════════════════

function TabHoteis() {
  const [hoteis, setHoteis] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHoteis(); }, []);

  async function fetchHoteis() {
    setLoading(true);
    const { data } = await supabase.from("hoteis").select("*").order("nome");
    setHoteis(data || []);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Hotéis e Alojamentos</h2>
          <p className="text-xs text-slate-500">{hoteis.length} unidades</p>
        </div>
      </div>
      {loading ? <Skeleton rows={5} /> : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead><tr className="border-b bg-slate-50"><Th>Imagem</Th><Th>Nome</Th><Th>Tipo</Th><Th>Estrelas</Th><Th>Preço médio</Th><Th>WhatsApp</Th></tr></thead>
            <tbody>{hoteis.map(h => (
              <tr key={h.id} className="border-b">
                <td className="px-4 py-3"><img src={h.imagem_url || "/placeholder.png"} className="w-10 h-10 rounded-lg object-cover" /></td>
                <td className="px-4 py-3 font-medium">{h.nome}</td>
                <td className="px-4 py-3 capitalize">{h.tipo}</td>
                <td className="px-4 py-3">{"★".repeat(h.estrelas)}</td>
                <td className="px-4 py-3">{h.preco_medio || "—"}</td>
                <td className="px-4 py-3">{h.whatsapp || "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GASTRONOMIA
// ═══════════════════════════════════════════════════════════════════════════════

function TabGastronomia() {
  const [restaurantes, setRestaurantes] = useState<Gastronomia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Gastronomia | null>(null);
  const [form, setForm] = useState<any>({});
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchRestaurantes(); }, []);

  async function fetchRestaurantes() {
    setLoading(true);
    const { data } = await supabase.from("gastronomia").select("*").order("ordem");
    setRestaurantes(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null);
    setForm({ titulo: "", descricao_curta: "", imagem_url: "", ordem: 0, ativo: true, whatsapp: null, link_google_maps: null, sobre_nos_texto: null, foto_equipe_url: null, galeria: null, cardapio: null });
    setImagemFile(null);
    setShowForm(true);
  }

  function abrirFormEditar(r: Gastronomia) {
    setEditando(r);
    setForm({ ...r });
    setImagemFile(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.titulo) { setFeedback("Título obrigatório."); return; }
    setSaving(true);
    let imagem_url = form.imagem_url;
    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const path = `gastronomia/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("galeria").upload(path, imagemFile, { upsert: true });
      if (!error) {
        const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
        imagem_url = pub.publicUrl;
      }
    }
    const payload = { ...form, imagem_url };
    if (editando) await supabase.from("gastronomia").update(payload).eq("id", editando.id);
    else await supabase.from("gastronomia").insert(payload);
    setFeedback(editando ? "Restaurante atualizado!" : "Restaurante criado!");
    setShowForm(false);
    setSaving(false);
    fetchRestaurantes();
    setTimeout(() => setFeedback(""), 3000);
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from("gastronomia").update({ ativo: !ativo }).eq("id", id);
    fetchRestaurantes();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este restaurante?")) return;
    await supabase.from("gastronomia").delete().eq("id", id);
    fetchRestaurantes();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Gastronomia</h2><p className="text-xs text-slate-500">{restaurantes.length} restaurantes</p></div>
        <button onClick={abrirFormNovo} className="bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm px-4 py-2 rounded-lg">+ Novo restaurante</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-4">
            <FormField label="Título"><input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={inputCls} /></FormField>
            <FormField label="Descrição curta"><textarea value={form.descricao_curta || ""} onChange={(e) => setForm({ ...form, descricao_curta: e.target.value })} rows={2} className={inputCls} /></FormField>
            <FormField label="Ordem"><input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) })} className={inputCls} /></FormField>
            <FormField label="Ativo"><select value={String(form.ativo)} onChange={(e) => setForm({ ...form, ativo: e.target.value === "true" })} className={inputCls}><option value="true">Sim</option><option value="false">Não</option></select></FormField>
            <FormField label="WhatsApp"><input value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inputCls} /></FormField>
            <FormField label="Link Google Maps"><input value={form.link_google_maps || ""} onChange={(e) => setForm({ ...form, link_google_maps: e.target.value })} className={inputCls} /></FormField>
            <FormField label="Imagem"><input ref={fileRef} type="file" accept="image/*" onChange={(e) => setImagemFile(e.target.files?.[0] || null)} className={inputCls} /></FormField>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-[#00577C] text-white rounded-lg font-black">{saving ? "Salvando…" : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <Skeleton rows={4} /> : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead><tr className="border-b bg-slate-50"><Th>Imagem</Th><Th>Título</Th><Th>Ordem</Th><Th>Ativo</Th><Th className="text-right">Ações</Th></tr></thead>
            <tbody>{restaurantes.map(r => (
              <tr key={r.id} className="border-b">
                <td className="px-4 py-3"><img src={r.imagem_url || "/placeholder.png"} className="w-10 h-10 rounded-lg object-cover" /></td>
                <td className="px-4 py-3 font-medium">{r.titulo}</td>
                <td className="px-4 py-3">{r.ordem}</td>
                <td className="px-4 py-3"><button onClick={() => toggleAtivo(r.id, r.ativo)} className={`text-xs px-2 py-1 rounded-full ${r.ativo ? "bg-[#009640]/10 text-[#009640]" : "bg-slate-100 text-slate-500"}`}>{r.ativo ? "Ativo" : "Inativo"}</button></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => abrirFormEditar(r)} className="text-xs text-[#00577C] border border-[#00577C]/20 px-2 py-1 rounded-md">Editar</button>
                  <button onClick={() => handleDelete(r.id)} className="ml-2 text-xs text-red-500 border border-red-200 px-2 py-1 rounded-md">Remover</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATRAÇÕES
// ═══════════════════════════════════════════════════════════════════════════════

function TabAtracoes() {
  const [atracoes, setAtracoes] = useState<Atracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Atracao | null>(null);
  const [form, setForm] = useState<any>({});
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAtracoes(); }, []);

  async function fetchAtracoes() {
    setLoading(true);
    const { data } = await supabase.from("atracoes").select("*").order("nome");
    setAtracoes(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null);
    setForm({ nome: "", tipo: "", descricao: "", imagem_url: "", preco_entrada: 0, pagbank_recebedor_id: null, whatsapp: null, link_google_maps: null, link_hospedagem: null, galeria: null });
    setImagemFile(null);
    setShowForm(true);
  }

  function abrirFormEditar(a: Atracao) {
    setEditando(a);
    setForm({ ...a });
    setImagemFile(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.nome) { setFeedback("Nome obrigatório."); return; }
    setSaving(true);
    let imagem_url = form.imagem_url;
    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const path = `atracoes/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("galeria").upload(path, imagemFile, { upsert: true });
      if (!error) {
        const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
        imagem_url = pub.publicUrl;
      }
    }
    const payload = { ...form, imagem_url };
    if (editando) await supabase.from("atracoes").update(payload).eq("id", editando.id);
    else await supabase.from("atracoes").insert(payload);
    setFeedback(editando ? "Atração atualizada!" : "Atração criada!");
    setShowForm(false);
    setSaving(false);
    fetchAtracoes();
    setTimeout(() => setFeedback(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta atração?")) return;
    await supabase.from("atracoes").delete().eq("id", id);
    fetchAtracoes();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Atrações</h2><p className="text-xs text-slate-500">{atracoes.length} atrações</p></div>
        <button onClick={abrirFormNovo} className="bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm px-4 py-2 rounded-lg">+ Nova atração</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-4">
            <FormField label="Nome"><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} /></FormField>
            <FormField label="Tipo"><input value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputCls} /></FormField>
            <FormField label="Descrição"><textarea value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} className={inputCls} /></FormField>
            <FormField label="Preço de entrada (R$)"><input type="number" step="0.01" value={form.preco_entrada} onChange={(e) => setForm({ ...form, preco_entrada: parseFloat(e.target.value) })} className={inputCls} /></FormField>
            <FormField label="WhatsApp"><input value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inputCls} /></FormField>
            <FormField label="Link Google Maps"><input value={form.link_google_maps || ""} onChange={(e) => setForm({ ...form, link_google_maps: e.target.value })} className={inputCls} /></FormField>
            <FormField label="Imagem"><input ref={fileRef} type="file" accept="image/*" onChange={(e) => setImagemFile(e.target.files?.[0] || null)} className={inputCls} /></FormField>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-[#00577C] text-white rounded-lg font-black">{saving ? "Salvando…" : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <Skeleton rows={4} /> : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead><tr className="border-b bg-slate-50"><Th>Imagem</Th><Th>Nome</Th><Th>Tipo</Th><Th>Preço</Th><Th className="text-right">Ações</Th></tr></thead>
            <tbody>{atracoes.map(a => (
              <tr key={a.id} className="border-b">
                <td className="px-4 py-3"><img src={a.imagem_url || "/placeholder.png"} className="w-10 h-10 rounded-lg object-cover" /></td>
                <td className="px-4 py-3 font-medium">{a.nome}</td>
                <td className="px-4 py-3">{a.tipo}</td>
                <td className="px-4 py-3">R$ {a.preco_entrada.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => abrirFormEditar(a)} className="text-xs text-[#00577C] border border-[#00577C]/20 px-2 py-1 rounded-md">Editar</button>
                  <button onClick={() => handleDelete(a.id)} className="ml-2 text-xs text-red-500 border border-red-200 px-2 py-1 rounded-md">Remover</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}