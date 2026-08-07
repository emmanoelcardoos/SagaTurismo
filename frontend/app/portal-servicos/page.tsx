"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { 
  Calendar, Bell, CheckCircle2, Clock, Map, Package, Activity, AlertCircle,
  Upload, Image as ImageIcon, Save, Loader2, FileSpreadsheet, Utensils, MapPin, Phone, Plus, Trash2 
} from 'lucide-react';

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Rota {
  id: string; titulo: string; descricao_curta: string; descricao_longa: string | null;
  imagem_url: string | null; ordem: number; ativo: boolean; criado_em: string;
  duracao: string | null; dificuldade: string | null; grupo: string | null;
  guia: string | null; galeria: string[] | null; como_chegar: string | null;
}

interface Evento {
  id: string; titulo: string; subtitulo: string | null; descricao: string | null;
  data: string; horario: string | null; duracao: string | null; local: string;
  imagem_url: string | null; categoria: string; preco: string | null;
  classificacao: string | null; link_bilheteira: string | null; destaque: boolean;
}

interface Passeio {
  id: string; titulo: string; descricao_curta: string | null; descricao_completa: string | null;
  imagem_principal: string | null; imagens_galeria: string[] | null; data_passeio: string;
  horario_saida: string | null; ponto_encontro: string | null; coordenadas_google_maps: string | null;
  nome_guia: string | null; guia_id: string | null; valor_total: number; taxa_prefeitura: number;
  vagas_totais: number; vagas_disponiveis: number; ativo: boolean; destaque: boolean;
  created_at: string; categoria: string | null;
}

interface Parceiro {
  id: string; nome_negocio: string; tipo_parceiro: string; email: string;
  telefone: string | null; status: string; criado_em: string;
}

interface Pedido {
  id: string; codigo_pedido: string; tipo_item: string; item_id: string;
  nome_cliente: string; cpf_cliente: string; email_cliente: string;
  valor_total: number; metodo_pagamento: string; status_pagamento: string;
  criado_em: string; data_checkin: string | null; data_checkout: string | null;
  endereco_completo: string | null; quantidade: number; telefone_cliente: string | null;
  data_nascimento: string | null; foto_url: string | null; hotel_id: string | null;
  guia_id: string | null; tipo_quarto: string | null; checkin_realizado_em: string | null;
  checkout_realizado_em: string | null; nome_item: string | null; repasse_hotel: number;
  repasse_guia: number; taxa_prefeitura: number; quantidade_pessoas: number | null;
  quantidade_quartos: number | null; hospedes_extras: any[] | null; quarto_tipo_id: string | null;
}

interface TaxaServico { tipo_servico: string; porcentagem: number; }

interface Pacote {
  id: string; titulo: string; descricao_curta: string; imagem_principal: string;
  dias: number; noites: number; ativo: boolean; roteiro_detalhado: string | null;
  imagens_galeria: string[] | null; horarios_info: string | null; preco: number;
  categoria: string; vagas_totais: number; vagas_vendidas: number;
  parceiro_id: string | null; agencia_id: string | null;
}

interface Hotel {
  id: string; nome: string; tipo: string; descricao: string; estrelas: number;
  imagem_url: string; whatsapp: string | null; endereco: string | null;
  preco_medio: string | null; comodidades: string[] | null; galeria: string[] | null;
  pagbank_recebedor_id: string | null; quarto_standard_nome: string | null;
  quarto_standard_preco: number; quarto_luxo_nome: string | null; quarto_luxo_preco: number;
  quarto_standard_comodidades: string[] | null; quarto_luxo_comodidades: string[] | null;
  quarto_standard_imagens: string[] | null; quarto_luxo_imagens: string[] | null;
  politicas: any | null; contatos: any | null; avaliacoes_info: any | null;
  porcentagem_acompanhante: number; max_parcelas_sem_juros: number;
}

interface Gastronomia {
  id: string; titulo: string; descricao_curta: string; imagem_url: string;
  ordem: number; ativo: boolean; criado_em: string; whatsapp: string | null;
  link_google_maps: string | null; sobre_nos_texto: string | null;
  foto_equipe_url: string | null; galeria: string[] | null; cardapio: any[] | null;
}

interface Atracao {
  id: string; nome: string; tipo: string; descricao: string; imagem_url: string;
  preco_entrada: number; pagbank_recebedor_id: string | null; whatsapp: string | null;
  link_google_maps: string | null; link_hospedagem: string | null; galeria: string[] | null;
}

// ─── Constantes ────────────────────────────────────────────────────────────────

const DURACAO_OPCOES = ["1–2 horas", "2–3 horas", "3–4 horas", "4–6 horas", "6–8 horas", "8+ horas"];
const DIFICULDADE_OPCOES = ["Fácil", "Moderada", "Difícil", "Extremo"];
const GRUPO_OPCOES = ["Sem limite", "Até 8 pessoas", "Até 15 pessoas", "Até 30 pessoas"];
const GUIA_OPCOES = ["Recomendado", "Obrigatório", "Não necessário"];

const EMPTY_ROTA = {
  titulo: "", descricao_curta: "", descricao_longa: null, imagem_url: null, ativo: true,
  duracao: null, dificuldade: null, grupo: null, guia: null, galeria: null, como_chegar: null,
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

// ─── Componente Principal com Login via Supabase RPC ─────────────────────────

export default function PortalServicos() {
  const [role, setRole] = useState<"geral" | "turismo" | "meio_ambiente" | null>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erroLogin, setErroLogin] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErroLogin("");
    setLoadingLogin(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha,
      });

      if (authError) throw new Error("Credenciais inválidas no sistema principal.");

      const { data: roleData, error: roleError } = await supabase.rpc("verificar_login_admin", {
        p_email: email,
        p_senha: senha,
      });

      if (roleError) throw roleError;

      if (roleData) {
        setRole(roleData as "geral" | "turismo" | "meio_ambiente");
      } else {
        setErroLogin("Usuário sem permissões administrativas.");
      }
    } catch (error) {
      console.error("Erro ao verificar login:", error);
      setErroLogin("E-mail ou senha incorretos.");
    } finally {
      setLoadingLogin(false);
    }
  }

  if (!role) {
    return (
      <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex items-center justify-center p-4`}>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center">
            <div className="relative w-32 h-16 mb-4">
              <Image src="/logop.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <h1 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Portal de Serviços</h1>
            <p className="text-sm text-slate-500 mt-1">Acesso Administrativo</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">E-mail de acesso</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErroLogin(""); }} className={inputCls} placeholder="admin@sagaturismo.com.br" required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">Senha de acesso</label>
                <input type="password" value={senha} onChange={(e) => { setSenha(e.target.value); setErroLogin(""); }} className={inputCls} placeholder="••••••••" required />
                {erroLogin && <p className="text-red-500 text-xs mt-2 font-medium">{erroLogin}</p>}
              </div>
              <button type="submit" disabled={loadingLogin} className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white font-black rounded-lg py-3 text-sm transition shadow-sm uppercase tracking-widest mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {loadingLogin ? "Verificando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard role={role} onLogout={() => { supabase.auth.signOut(); setRole(null); setEmail(""); setSenha(""); }} />;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function AdminDashboard({ role, onLogout }: { role: "geral" | "turismo" | "meio_ambiente"; onLogout: () => void }) {
  const allTabs = [
    { id: "dashboard",   label: "Painel Geral",     icon: "📊" },
    { id: "rotas",       label: "Rotas Turísticas", icon: "🗺️" },
    { id: "eventos",     label: "Eventos",          icon: "📅" },
    { id: "passeios",    label: "Passeios",         icon: "🥾" },
    { id: "pacotes",     label: "Pacotes",          icon: "🎒" },
    { id: "atracoes",    label: "Atrações",         icon: "🏞️" },
    { id: "parceiros",   label: "Parceiros",        icon: "🤝" },
    { id: "hoteis",      label: "Hotéis",           icon: "🏨" },
    { id: "gastronomia", label: "Gastronomia",      icon: "🍽️" },
    { id: "taxas",       label: "Taxas de Serviço", icon: "💰" },
    { id: "pedidos",     label: "Pedidos",          icon: "🛒" },
  ] as const;

  const allowedTabs = allTabs.filter(tab => {
    if (role === "geral") return true; 
    if (role === "turismo") return ["dashboard", "rotas", "eventos", "passeios", "pacotes", "atracoes"].includes(tab.id);
    if (role === "meio_ambiente") return ["dashboard", "parceiros", "taxas", "pedidos", "hoteis", "gastronomia"].includes(tab.id);
    return false;
  });

  const [activeTab, setActiveTab] = useState<string>(allowedTabs[0].id);

  const nomeSecretaria = role === "turismo" ? "Sec. de Turismo" : role === "meio_ambiente" ? "Sec. de Meio Ambiente" : "Administração Geral";

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-800`}>
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-28 h-8"><Image src="/logop.png" alt="Logo" fill className="object-contain object-left" priority /></div>
            <span className="hidden sm:block text-xs font-bold text-slate-500 border-l border-slate-200 pl-3 uppercase tracking-wider">{nomeSecretaria}</span>
          </div>
          <button onClick={onLogout} className="text-xs text-slate-500 hover:text-[#00577C] transition flex items-center gap-1.5 font-bold uppercase tracking-widest">Sair</button>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 min-w-max">
            {allowedTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-black border-b-2 transition ${activeTab === tab.id ? "border-[#F9C400] text-[#00577C]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
              >
                <span>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "dashboard"   && <TabDashboard />}
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
// DASHBOARD CENTRAL
// ═══════════════════════════════════════════════════════════════════════════════

function TabDashboard() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [pendentes, setPendentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ parceiros: 0, hoteis: 0 });

  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => { carregarDashboard(); }, []);

  async function carregarDashboard() {
    setLoading(true);
    const hoje = new Date();
    const daquiA7Dias = new Date();
    daquiA7Dias.setDate(hoje.getDate() + 7);
    
    const hojeIso = hoje.toISOString().split('T')[0];
    const daquiA7DiasIso = daquiA7Dias.toISOString().split('T')[0];

    const { data: eventosData } = await supabase.from('eventos').select('titulo, data, local').gte('data', hojeIso).lte('data', daquiA7DiasIso).order('data', { ascending: true });
    setEventos(eventosData || []);

    const { data: passeiosData } = await supabase.from('passeios').select('id, titulo, parceiro_id').eq('status', 'pendente');
    const { data: pacotesData } = await supabase.from('pacotes').select('id, titulo, parceiro_id').eq('status', 'pendente');
    const { data: parceirosPendentes } = await supabase.from('parceiros').select('id, nome_negocio, tipo_parceiro').eq('status', 'pendente');

    const listaPendentes = [
      ...(passeiosData || []).map(p => ({ ...p, tipo: 'passeios', icone: Map })),
      ...(pacotesData || []).map(p => ({ ...p, tipo: 'pacotes', icone: Package })),
      ...(parceirosPendentes || []).map(p => ({ ...p, titulo: p.nome_negocio, tipo: 'parceiros', icone: Bell }))
    ];
    setPendentes(listaPendentes);

    const { count: countParceiros } = await supabase.from('parceiros').select('*', { count: 'exact', head: true }).eq('status', 'ativo');
    const { count: countHoteis } = await supabase.from('hoteis').select('*', { count: 'exact', head: true });
    setStats({ parceiros: countParceiros || 0, hoteis: countHoteis || 0 });
    
    setLoading(false);
  }

  async function aprovarItem(id: string, tabela: string) {
    if (!confirm(`Deseja aprovar este item e publicá-lo no portal?`)) return;
    const statusValue = tabela === 'parceiros' ? 'ativo' : 'aprovado';
    await supabase.from(tabela).update({ status: statusValue }).eq('id', id);
    carregarDashboard(); 
  }

  if (loading) return <div className="py-20 flex justify-center"><Activity className="animate-spin text-[#00577C]" size={32}/></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <div className="bg-amber-100 text-amber-600 p-2 rounded-xl"><Bell size={20}/></div>
            <h3 className={`${jakarta.className} text-xl font-black text-slate-800`}>Fila de Aprovação</h3>
            {pendentes.length > 0 && <span className="ml-auto bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-full">{pendentes.length}</span>}
          </div>

          {pendentes.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 size={40} className="mx-auto text-slate-200 mb-3"/>
              <p className="font-bold text-slate-400">Tudo em dia!</p>
              <p className="text-xs text-slate-400">Nenhum passeio ou pacote aguardando aprovação.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendentes.map((item, idx) => {
                const Icon = item.icone;
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-xl shadow-sm text-slate-400"><Icon size={16}/></div>
                      <div>
                        <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-0.5">Novo {item.tipo.slice(0, -1)}</p>
                        <p className="font-bold text-sm text-slate-800 line-clamp-1">{item.titulo}</p>
                      </div>
                    </div>
                    <button onClick={() => aprovarItem(item.id, item.tipo)} className="bg-[#009640] hover:bg-green-700 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shadow-sm">Aprovar</button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <div className="bg-[#00577C]/10 text-[#00577C] p-2 rounded-xl"><Calendar size={20}/></div>
            <h3 className={`${jakarta.className} text-xl font-black text-slate-800`}>Eventos (Próximos 7 Dias)</h3>
          </div>

          {eventos.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={40} className="mx-auto text-slate-200 mb-3"/>
              <p className="font-bold text-slate-400">Agenda livre.</p>
              <p className="text-xs text-slate-400">Nenhum evento municipal programado para esta semana.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {eventos.map((ev, idx) => {
                const [ano, mes, dia] = ev.data.split('-');
                return (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                    <div className="bg-white border border-blue-100 rounded-xl w-14 h-14 flex flex-col items-center justify-center shrink-0 shadow-sm">
                      <span className="text-[10px] font-black uppercase text-[#00577C] leading-none mb-1">{new Date(ev.data).toLocaleString('pt-BR', { month: 'short' })}</span>
                      <span className={`${jakarta.className} text-xl font-black text-slate-900 leading-none`}>{dia}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{ev.titulo}</p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1"><Map size={12}/> {ev.local}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROTAS - CONSTRUTOR DE VITRINE
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
  const [feedback, setFeedback] = useState("");

  useEffect(() => { fetchRotas(); }, []);

  async function fetchRotas() {
    setLoading(true);
    const { data } = await supabase.from("rotas").select("*").order("ordem", { ascending: true });
    setRotas(data || []);
    setLoading(false);
  }

  async function getProximaOrdem() {
    const { data } = await supabase.from("rotas").select("ordem").order("ordem", { ascending: false }).limit(1);
    if (data && data.length > 0) return data[0].ordem + 1;
    return 1;
  }

  function abrirFormNovo() {
    setEditando(null); setForm(EMPTY_ROTA); setImagemCapaFile(null); setGaleriaFiles([]); setShowForm(true);
  }

  function abrirFormEditar(rota: Rota) {
    setEditando(rota);
    setForm({ titulo: rota.titulo, descricao_curta: rota.descricao_curta, descricao_longa: rota.descricao_longa, imagem_url: rota.imagem_url, ativo: rota.ativo, duracao: rota.duracao, dificuldade: rota.dificuldade, grupo: rota.grupo, guia: rota.guia, galeria: rota.galeria, como_chegar: rota.como_chegar });
    setImagemCapaFile(null); setGaleriaFiles([]); setShowForm(true);
  }

  async function handleSave() {
    if (!form.titulo || !form.descricao_curta) { setFeedback("Título e descrição curta são obrigatórios."); return; }
    setSaving(true); setFeedback("Salvando...");

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

    const payload = { ...form, imagem_url, galeria: galeriaUrls.length ? galeriaUrls : (form.galeria || null) };

    if (editando) await supabase.from("rotas").update(payload).eq("id", editando.id);
    else {
      const novaOrdem = await getProximaOrdem();
      await supabase.from("rotas").insert({ ...payload, ordem: novaOrdem });
    }

    setFeedback(editando ? "Rota atualizada com sucesso!" : "Rota publicada!");
    setTimeout(() => { setShowForm(false); setSaving(false); fetchRotas(); setFeedback(""); }, 2000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta rota permanentemente?")) return;
    await supabase.from("rotas").delete().eq("id", id); 
    fetchRotas();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Vitrine de Rotas</h2>
          <p className="text-xs text-slate-500 mt-1">{rotas.length} roteiros em exibição</p>
        </div>
        <button onClick={abrirFormNovo} className="bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2">
          <Plus size={16} /> Novo Roteiro
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 flex items-center gap-2`}>
              <Map className="text-[#F9C400]" /> {editando ? "Editar Rota" : "Construtor de Página de Rota"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-sm font-bold text-slate-400 hover:text-slate-800">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
            {/* Esquerda: Textos */}
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Informações da Rota</h4>
              <FormField label="Título da Rota *"><input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={inputCls} placeholder="Ex: Rota das Cachoeiras" /></FormField>
              <FormField label="Descrição Curta (Resumo) *"><textarea value={form.descricao_curta} onChange={(e) => setForm({ ...form, descricao_curta: e.target.value })} rows={2} className={inputCls} placeholder="Aparece no cartão principal..." /></FormField>
              <FormField label="Descrição Longa (História)"><textarea value={form.descricao_longa || ""} onChange={(e) => setForm({ ...form, descricao_longa: e.target.value })} rows={4} className={inputCls} placeholder="Conte todos os detalhes deste roteiro..." /></FormField>
              <FormField label="Como Chegar (Instruções)"><textarea value={form.como_chegar || ""} onChange={(e) => setForm({ ...form, como_chegar: e.target.value })} rows={3} className={inputCls} placeholder="Ex: Acesso pela via BR..."/></FormField>
            </div>
            
            {/* Direita: Tags e Mídia */}
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Especificações e Mídia</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Duração"><select value={form.duracao || ""} onChange={(e) => setForm({ ...form, duracao: e.target.value })} className={inputCls}><option value="">Selecione</option>{DURACAO_OPCOES.map(opt => <option key={opt}>{opt}</option>)}</select></FormField>
                <FormField label="Dificuldade"><select value={form.dificuldade || ""} onChange={(e) => setForm({ ...form, dificuldade: e.target.value })} className={inputCls}><option value="">Selecione</option>{DIFICULDADE_OPCOES.map(opt => <option key={opt}>{opt}</option>)}</select></FormField>
                <FormField label="Tamanho do Grupo"><select value={form.grupo || ""} onChange={(e) => setForm({ ...form, grupo: e.target.value })} className={inputCls}><option value="">Selecione</option>{GRUPO_OPCOES.map(opt => <option key={opt}>{opt}</option>)}</select></FormField>
                <FormField label="Exigência de Guia"><select value={form.guia || ""} onChange={(e) => setForm({ ...form, guia: e.target.value })} className={inputCls}><option value="">Selecione</option>{GUIA_OPCOES.map(opt => <option key={opt}>{opt}</option>)}</select></FormField>
              </div>
              
              <FormField label="Imagem de Capa">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-4 rounded-xl cursor-pointer hover:border-[#00577C] transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImagemCapaFile(e.target.files?.[0] || null)} />
                  <ImageIcon size={18} /> {imagemCapaFile ? imagemCapaFile.name : form.imagem_url ? "Trocar imagem atual" : "Clique para anexar Capa da Rota"}
                </label>
              </FormField>

              <FormField label="Galeria de Fotos do Local (Múltiplas)">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-4 rounded-xl cursor-pointer hover:border-[#00577C] transition-colors">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) setGaleriaFiles(Array.from(e.target.files)); }} />
                  <ImageIcon size={18} /> {galeriaFiles.length > 0 ? `${galeriaFiles.length} fotos selecionadas` : "Selecionar várias fotos para galeria"}
                </label>
              </FormField>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
            <span className="text-sm font-bold text-[#009640]">{feedback}</span>
            <button onClick={handleSave} disabled={saving} className="bg-[#009640] hover:bg-green-700 text-white px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Publicar Rota
            </button>
          </div>
        </div>
      ) : (
        loading ? <div className="py-12 flex justify-center"><Loader2 size={32} className="text-[#00577C] animate-spin" /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rotas.map((rota) => (
              <div key={rota.id} className={`bg-white rounded-[2rem] border border-slate-200 p-4 flex flex-col hover:shadow-xl transition-all ${!rota.ativo ? 'opacity-60 grayscale-[30%]' : ''}`}>
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 mb-4">
                  <img src={rota.imagem_url || "/placeholder.png"} alt={rota.titulo} className="object-cover w-full h-full" />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-black text-[#00577C] shadow-sm uppercase">{rota.dificuldade || 'Turismo'}</div>
                </div>
                <div className="px-2 pb-2 flex-1 flex flex-col">
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-800 mb-1`}>{rota.titulo}</h3>
                  <p className="text-xs font-medium text-slate-500 line-clamp-2 mb-4">{rota.descricao_curta}</p>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                    <button onClick={() => abrirFormEditar(rota)} className="text-xs font-bold text-[#00577C] hover:underline">Editar Rota</button>
                    <button onClick={() => handleDelete(rota.id)} className="text-xs font-bold text-red-500 hover:underline">Remover</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTOS
// ═══════════════════════════════════════════════════════════════════════════════

function TabEventos() {
  const [fase, setFase] = useState<'inicio' | 'preview' | 'salvando' | 'sucesso'>('inicio');
  const [eventosPreview, setEventosPreview] = useState<any[]>([]);
  const [imagensMap, setImagensMap] = useState<{ [key: number]: File }>({});
  const [feedback, setFeedback] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processarCSV(text);
    };
    reader.readAsText(file);
  };

  const processarCSV = (csvText: string) => {
    const linhas = csvText.split('\n').filter(linha => linha.trim() !== '');
    if (linhas.length < 2) { alert("O ficheiro parece estar vazio ou sem os cabeçalhos."); return; }

    const cabecalhos = linhas[0].toLowerCase().split(',').map(c => c.trim());
    const eventosLidos = [];
    
    for (let i = 1; i < linhas.length; i++) {
      const valores = linhas[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const evento: any = {};
      cabecalhos.forEach((cabecalho, index) => {
        let valor = valores[index] ? valores[index].trim() : '';
        if (valor.startsWith('"') && valor.endsWith('"')) valor = valor.substring(1, valor.length - 1);
        evento[cabecalho] = valor;
      });
      if (evento.titulo) eventosLidos.push({ ...evento, destaque: false, data: evento.data || null });
    }
    setEventosPreview(eventosLidos);
    setFase('preview');
  };

  const handleImagemChange = (index: number, file: File) => setImagensMap(prev => ({ ...prev, [index]: file }));

  const handleSalvarTudo = async () => {
    setFase('salvando');
    setFeedback("A iniciar a sincronização com o banco de dados...");
    let sucessos = 0;

    for (let i = 0; i < eventosPreview.length; i++) {
      const evento = eventosPreview[i];
      const imagemFile = imagensMap[i];
      let imagem_url = "";

      try {
        setFeedback(`A processar o evento: ${evento.titulo} (${i + 1}/${eventosPreview.length})...`);
        if (imagemFile) {
          const ext = imagemFile.name.split('.').pop();
          const nomeFicheiro = `evento_${Date.now()}_${i}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from('eventos').upload(nomeFicheiro, imagemFile);
          if (!uploadErr) {
            const { data: pubUrl } = supabase.storage.from('eventos').getPublicUrl(nomeFicheiro);
            imagem_url = pubUrl.publicUrl;
          }
        }
        const { error: dbError } = await supabase.from('eventos').insert([{
          titulo: evento.titulo, subtitulo: evento.subtitulo || null, descricao: evento.descricao || null,
          data: evento.data || null, horario: evento.horario || null, local: evento.local || null,
          categoria: evento.categoria || 'Cultura', preco: evento.preco || null, imagem_url: imagem_url || null, destaque: false
        }]);
        if (dbError) console.error(`Erro ao salvar ${evento.titulo}:`, dbError);
        else sucessos++;
      } catch (err) {
        console.error(`Falha fatal no evento ${evento.titulo}:`, err);
      }
    }
    setFeedback(`${sucessos} de ${eventosPreview.length} eventos foram guardados com sucesso!`);
    setFase('sucesso');
  };

  const resetar = () => { setFase('inicio'); setEventosPreview([]); setImagensMap({}); setFeedback(""); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Gestão de Eventos (Em Lote)</h2><p className="text-xs text-slate-500 mt-1">Ferramenta exclusiva da Prefeitura para popular o calendário anual.</p></div>
        {fase !== 'inicio' && (<button onClick={resetar} className="text-xs text-slate-500 font-bold hover:text-slate-800 underline">Cancelar e Voltar</button>)}
      </div>

      {fase === 'inicio' && (
        <div className="border-2 border-dashed border-slate-300 rounded-[2rem] p-12 text-center bg-white hover:bg-slate-50 transition-colors relative group">
          <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-[#00577C]/10 text-[#00577C] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><FileSpreadsheet size={32} /></div>
            <div>
              <p className={`${jakarta.className} text-lg font-black text-slate-800`}>Arraste o seu ficheiro CSV de Eventos</p>
              <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm mx-auto">Certifique-se que o Excel tem o cabeçalho: <br/><code className="text-xs bg-slate-100 p-1 rounded font-bold text-[#00577C]">titulo, descricao, data, local, categoria</code></p>
            </div>
            <button className="mt-4 bg-[#00577C] text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-md">Selecionar Ficheiro do Computador</button>
          </div>
        </div>
      )}

      {fase === 'preview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
             <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
             <div><p className="text-sm font-bold text-amber-800">Foram identificados {eventosPreview.length} eventos no ficheiro!</p><p className="text-xs text-amber-700 mt-1">Anexe as fotos oficiais de cada um abaixo e clique no botão verde para guardar tudo no portal.</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                <tr><th className="p-4 border-b">Festa / Evento</th><th className="p-4 border-b">Data e Local</th><th className="p-4 border-b">Categoria</th><th className="p-4 border-b">Upload do Cartaz</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventosPreview.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-4"><p className="font-bold text-slate-900">{ev.titulo}</p><p className="text-xs text-slate-500 line-clamp-1">{ev.descricao}</p></td>
                    <td className="p-4 text-xs font-bold text-slate-600"><p>{ev.data}</p><p className="text-slate-400 font-medium">{ev.local}</p></td>
                    <td className="p-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-black uppercase">{ev.categoria || 'Geral'}</span></td>
                    <td className="p-4">
                       <label className="flex items-center justify-center gap-2 border border-slate-200 hover:border-[#00577C] bg-white text-slate-600 hover:text-[#00577C] px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs font-bold">
                         <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files) handleImagemChange(idx, e.target.files[0]); }} />
                         <ImageIcon size={14} />{imagensMap[idx] ? <span className="text-[#009640]">Imagem Selecionada ✓</span> : <span>Anexar Foto</span>}
                       </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-200">
             <button onClick={handleSalvarTudo} className="bg-[#009640] hover:bg-green-700 text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all"><Save size={18} /> Salvar {eventosPreview.length} Eventos no Portal</button>
          </div>
        </div>
      )}

      {(fase === 'salvando' || fase === 'sucesso') && (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
          {fase === 'salvando' ? (<Loader2 size={48} className="mx-auto text-[#00577C] animate-spin mb-6" />) : (<CheckCircle2 size={48} className="mx-auto text-[#009640] mb-6" />)}
          <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-2`}>{fase === 'salvando' ? 'A Sincronizar Calendário...' : 'Sincronização Concluída!'}</h3>
          <p className="text-slate-500 font-medium mb-8">{feedback}</p>
          {fase === 'sucesso' && (<button onClick={resetar} className="bg-[#00577C] text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-md">Importar mais Eventos</button>)}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PASSEIOS (Apenas Auditoria)
// ═══════════════════════════════════════════════════════════════════════════════

function TabPasseiosAdmin() {
  const [passeios, setPasseios] = useState<Passeio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPasseios(); }, []);

  async function fetchPasseios() {
    setLoading(true);
    const { data } = await supabase.from("passeios").select("*").order("created_at", { ascending: false });
    setPasseios(data || []);
    setLoading(false);
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from("passeios").update({ ativo: !ativo }).eq("id", id);
    fetchPasseios();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este passeio permanentemente do portal?")) return;
    await supabase.from("passeios").delete().eq("id", id);
    fetchPasseios();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Auditoria de Passeios</h2>
          <p className="text-xs text-slate-500">{passeios.length} passeios listados pelos parceiros</p>
        </div>
      </div>

      {loading ? (
        <Skeleton rows={5} />
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <Th>Imagem</Th><Th>Passeio</Th><Th>Data</Th><Th>Valor</Th><Th>Vagas</Th><Th>Visibilidade</Th><Th className="text-right">Ações</Th>
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
                      {p.ativo ? "Público" : "Oculto"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
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
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome_negocio: "", tipo_parceiro: "hotel", email: "", telefone: "" });

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

  function abrirFormNovo() {
    setForm({ nome_negocio: "", tipo_parceiro: "hotel", email: "", telefone: "" });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.nome_negocio || !form.email) {
      setFeedback("Nome do negócio e e-mail são obrigatórios."); return;
    }
    setSaving(true);
    const { error } = await supabase.from("parceiros").insert({
      nome_negocio: form.nome_negocio, tipo_parceiro: form.tipo_parceiro, email: form.email,
      telefone: form.telefone || null, status: "pendente"
    });

    if (error) { alert("Erro ao cadastrar parceiro: " + error.message); setSaving(false); return; }

    setFeedback("Parceiro pré-cadastrado com sucesso!");
    setShowForm(false); setSaving(false); fetchParceiros(); setTimeout(() => setFeedback(""), 3000);
  }

  const filtered = filtro === "todos" ? parceiros : parceiros.filter((p) => p.tipo_parceiro === filtro);
  const pendentes = parceiros.filter((p) => p.status === "pendente");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Gestão de Parceiros</h2><p className="text-xs text-slate-500">{parceiros.length} parceiros · {pendentes.length} pendente(s)</p></div>
        <div className="flex items-center gap-3">
          {feedback && <span className="text-xs text-[#009640] font-bold">{feedback}</span>}
          <button onClick={abrirFormNovo} className="bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5 uppercase tracking-wider"><span className="text-base leading-none">+</span> Novo parceiro</button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className={`${jakarta.className} font-black text-slate-800`}>Pré-cadastrar Parceiro</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 transition text-lg leading-none">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <FormField label="Nome do Negócio *"><input value={form.nome_negocio} onChange={(e) => setForm({ ...form, nome_negocio: e.target.value })} className={inputCls} placeholder="Ex: Pousada Paraíso" /></FormField>
              <FormField label="Tipo de Parceiro"><select value={form.tipo_parceiro} onChange={(e) => setForm({ ...form, tipo_parceiro: e.target.value })} className={inputCls}><option value="hotel">Hotel</option><option value="passeios">Passeios</option><option value="pacotes">Pacotes</option><option value="guia">Guia</option></select></FormField>
              <FormField label="E-mail *"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="contato@empresa.com" /></FormField>
              <FormField label="Telefone / WhatsApp"><input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className={inputCls} placeholder="(00) 00000-0000" /></FormField>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-2"><p className="text-xs text-blue-700 font-medium">Após cadastrar, a empresa deverá ir à página de "Ativar Conta" e usar este e-mail para criar a sua senha.</p></div>
            </div>
            <div className="flex gap-2 p-5 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm transition disabled:opacity-50 shadow-sm uppercase tracking-wider">{saving ? "Salvando…" : "Cadastrar"}</button>
            </div>
          </div>
        </div>
      )}

      {pendentes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-700 mb-3">⏳ {pendentes.length} parceiro(s) aguardando ativação de senha</p>
          <div className="space-y-2">
            {pendentes.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white border border-amber-100 rounded-lg px-3 py-2">
                <div><p className="text-sm text-slate-800 font-medium">{p.nome_negocio}</p><p className="text-xs text-slate-500">{p.email} · {p.tipo_parceiro}</p></div>
                <button onClick={() => alterarStatus(p.id, "ativo")} disabled={actionId === p.id} className="text-xs bg-[#009640] hover:bg-[#007a33] text-white font-semibold px-3 py-1 rounded-md transition shadow-sm">Aprovar Manualmente</button>
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

      {loading ? <Skeleton rows={4} /> : (
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
  const [feedback, setFeedback] = useState("");

  useEffect(() => { fetchTaxas(); }, []);

  async function fetchTaxas() {
    setLoading(true);
    const { data } = await supabase.from("taxas_servicos").select("*");
    setTaxas(data || []);
    setLoading(false);
  }

  async function updateTaxa(tipo: string, porcentagem: number) {
    await supabase.from("taxas_servicos").upsert({ tipo_servico: tipo, porcentagem });
    setFeedback(`Taxa para ${tipo} atualizada!`);
    fetchTaxas();
    setTimeout(() => setFeedback(""), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Taxas de Serviço</h2><p className="text-xs text-slate-500">Percentuais aplicados sobre cada tipo de serviço</p></div>
        {feedback && <span className="text-xs text-[#009640] font-bold">{feedback}</span>}
      </div>

      {loading ? <Skeleton rows={3} /> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200 bg-slate-50"><Th>Tipo de Serviço</Th><Th>Taxa (%)</Th><Th className="text-right">Ações</Th></tr></thead>
            <tbody>
              {taxas.map((taxa) => (
                <tr key={taxa.tipo_servico} className="border-b border-slate-100">
                  <td className="px-4 py-3 capitalize font-medium">{taxa.tipo_servico}</td>
                  <td className="px-4 py-3"><input type="number" step="0.01" defaultValue={taxa.porcentagem} onBlur={(e) => updateTaxa(taxa.tipo_servico, parseFloat(e.target.value))} className="w-24 px-2 py-1 border border-slate-200 rounded-lg" /></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => updateTaxa(taxa.tipo_servico, taxa.porcentagem)} className="text-xs text-[#00577C] border border-[#00577C]/20 px-2 py-1 rounded-md">Salvar</button></td>
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

  const filtered = pedidos.filter(p => (filtroStatus === "todos" || p.status_pagamento === filtroStatus) && (filtroTipo === "todos" || p.tipo_item === filtroTipo));
  const statusCores: Record<string, string> = { pago: "bg-[#009640]/10 text-[#009640]", aguardando: "bg-amber-100 text-amber-700", cancelado: "bg-red-100 text-red-600" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Pedidos</h2><p className="text-xs text-slate-500">Total: {pedidos.length} pedidos</p></div>
        <div className="flex gap-2">
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1"><option value="todos">Todos os status</option><option value="pago">Pago</option><option value="aguardando">Aguardando</option><option value="cancelado">Cancelado</option></select>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1"><option value="todos">Todos os tipos</option><option value="hotel">Hotel</option><option value="passeio">Passeio</option><option value="pacote">Pacote</option></select>
        </div>
      </div>

      {loading ? <Skeleton rows={6} /> : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead><tr className="border-b border-slate-200 bg-slate-50"><Th>Código</Th><Th>Cliente</Th><Th>Tipo</Th><Th>Item</Th><Th>Valor</Th><Th>Status</Th><Th>Data</Th></tr></thead>
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
// PACOTES (Apenas Auditoria)
// ═══════════════════════════════════════════════════════════════════════════════

function TabPacotes() {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPacotes(); }, []);

  async function fetchPacotes() {
    setLoading(true);
    const { data } = await supabase.from("pacotes").select("*").order("titulo");
    setPacotes(data || []);
    setLoading(false);
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from("pacotes").update({ ativo: !ativo }).eq("id", id);
    fetchPacotes();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este pacote permanentemente do portal?")) return;
    await supabase.from("pacotes").delete().eq("id", id);
    fetchPacotes();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Auditoria de Pacotes</h2><p className="text-xs text-slate-500">{pacotes.length} pacotes listados pelos parceiros</p></div>
      </div>

      {loading ? <Skeleton rows={4} /> : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead><tr className="border-b bg-slate-50"><Th>Imagem</Th><Th>Título</Th><Th>Dias</Th><Th>Preço</Th><Th>Visibilidade</Th><Th className="text-right">Ações</Th></tr></thead>
            <tbody>{pacotes.map(p => (
              <tr key={p.id} className="border-b">
                <td className="px-4 py-3"><img src={p.imagem_principal || "/placeholder.png"} className="w-10 h-10 rounded-lg object-cover" /></td>
                <td className="px-4 py-3 font-medium">{p.titulo}</td>
                <td className="px-4 py-3">{p.dias} dias</td>
                <td className="px-4 py-3">R$ {p.preco.toFixed(2)}</td>
                <td className="px-4 py-3"><button onClick={() => toggleAtivo(p.id, p.ativo)} className={`text-xs px-2 py-1 rounded-full ${p.ativo ? "bg-[#009640]/10 text-[#009640]" : "bg-slate-100 text-slate-500"}`}>{p.ativo ? "Público" : "Oculto"}</button></td>
                <td className="px-4 py-3 text-right">
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
  const [hoteis, setHoteis] = useState<any[]>([]);
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchHoteis(); fetchParceirosAtivos(); }, []);

  async function fetchHoteis() {
    setLoading(true);
    const { data } = await supabase.from("hoteis").select("*, parceiros(nome_negocio)").order("nome");
    setHoteis(data || []);
    setLoading(false);
  }

  async function fetchParceirosAtivos() {
    const { data } = await supabase.from("parceiros").select("id, nome_negocio, tipo_parceiro").eq("status", "ativo");
    setParceiros(data || []);
  }

  function abrirFormNovo() {
    setEditando(null); setForm({ nome: "", tipo: "Pousada", descricao: "", estrelas: 3, parceiro_id: "", imagem_url: "" });
    setImagemFile(null); setShowForm(true);
  }

  function abrirFormEditar(h: any) {
    setEditando(h); setForm({ ...h }); setImagemFile(null); setShowForm(true);
  }

  async function handleSave() {
    if (!form.nome || !form.parceiro_id) { setFeedback("Nome do hotel e Parceiro são obrigatórios."); return; }
    setSaving(true);
    
    let imagem_url = form.imagem_url;
    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const path = `capas/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("hoteis").upload(path, imagemFile, { upsert: true });
      if (!upErr) { const { data: pub } = supabase.storage.from("hoteis").getPublicUrl(path); imagem_url = pub.publicUrl; }
    }

    const payload = { nome: form.nome, tipo: form.tipo, descricao: form.descricao, estrelas: form.estrelas, parceiro_id: form.parceiro_id, imagem_url: imagem_url };

    if (editando) {
      await supabase.from("hoteis").update(payload).eq("id", editando.id);
      setFeedback("Hotel atualizado!");
    } else {
      await supabase.from("hoteis").insert(payload);
      setFeedback("Hotel pré-cadastrado!");
    }

    setShowForm(false); setSaving(false); fetchHoteis(); setTimeout(() => setFeedback(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este hotel permanentemente?")) return;
    await supabase.from("hoteis").delete().eq("id", id);
    fetchHoteis();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Hotéis e Alojamentos</h2><p className="text-xs text-slate-500">{hoteis.length} unidades cadastradas</p></div>
        <div className="flex gap-3">
          {feedback && <span className="text-xs text-[#009640] font-bold">{feedback}</span>}
          <button onClick={abrirFormNovo} className="bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm px-4 py-2 rounded-lg transition">+ Novo Hotel</button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-4">
            <div className="flex justify-between border-b pb-3"><h3 className="font-black text-slate-800">Cadastro Inicial de Hotel</h3><button onClick={() => setShowForm(false)} className="text-slate-400">✕</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nome do Estabelecimento *"><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} /></FormField>
              <FormField label="Tipo"><select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputCls}><option value="Hotel">Hotel</option><option value="Pousada">Pousada</option><option value="Resort">Resort</option><option value="Hostel">Hostel</option></select></FormField>
              <FormField label="Parceiro Dono (Obrigatório) *" className="md:col-span-2">
                <select value={form.parceiro_id} onChange={(e) => setForm({ ...form, parceiro_id: e.target.value })} className={inputCls}>
                  <option value="">Selecione o parceiro ativo...</option>
                  {parceiros.map(p => (<option key={p.id} value={p.id}>{p.nome_negocio} ({p.tipo_parceiro})</option>))}
                </select>
              </FormField>
              <FormField label="Descrição Curta" className="md:col-span-2"><textarea value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} className={inputCls} /></FormField>
              <FormField label="Estrelas"><input type="number" min="1" max="5" value={form.estrelas} onChange={(e) => setForm({ ...form, estrelas: parseInt(e.target.value) })} className={inputCls} /></FormField>
              <FormField label="Foto Principal (Capa)">
                {form.imagem_url && !imagemFile && <img src={form.imagem_url} alt="Capa" className="h-12 rounded mb-2 object-cover" />}
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setImagemFile(e.target.files?.[0] || null)} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()} className="text-xs border border-dashed border-slate-300 px-3 py-2 rounded-lg w-full">Escolher Imagem</button>
              </FormField>
            </div>
            <div className="flex gap-2 border-t pt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border rounded-lg text-sm text-slate-600">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-[#00577C] text-white font-black text-sm rounded-lg">{saving ? "Salvando…" : "Salvar Casca Inicial"}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <Skeleton rows={5} /> : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead><tr className="border-b bg-slate-50"><Th>Foto</Th><Th>Nome</Th><Th>Parceiro</Th><Th>Tipo</Th><Th className="text-right">Ações</Th></tr></thead>
            <tbody>{hoteis.map(h => (
              <tr key={h.id} className="border-b">
                <td className="px-4 py-3"><img src={h.imagem_url || "/placeholder.png"} className="w-10 h-10 rounded-lg object-cover" /></td>
                <td className="px-4 py-3 font-medium">{h.nome}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{h.parceiros?.nome_negocio || "Sem dono"}</td>
                <td className="px-4 py-3 capitalize">{h.tipo}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => abrirFormEditar(h)} className="text-xs text-[#00577C] border border-[#00577C]/20 px-2 py-1 rounded-md">Editar</button>
                  <button onClick={() => handleDelete(h.id)} className="ml-2 text-xs text-red-500 border border-red-200 px-2 py-1 rounded-md">Remover</button>
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
// GASTRONOMIA
// ═══════════════════════════════════════════════════════════════════════════════

function TabGastronomia() {
  const [restaurantes, setRestaurantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState({ titulo: "", descricao_curta: "", sobre_nos_texto: "", whatsapp: "", link_google_maps: "", ordem: 1, ativo: true });
  const [imagemPrincipal, setImagemPrincipal] = useState<File | null>(null);
  const [fotoEquipe, setFotoEquipe] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [cardapio, setCardapio] = useState([{ prato: "", desc: "", preco: "" }]);

  useEffect(() => { fetchRestaurantes(); }, []);

  async function fetchRestaurantes() {
    setLoading(true);
    const { data } = await supabase.from('gastronomia').select('*').order('ordem', { ascending: true });
    setRestaurantes(data || []);
    setLoading(false);
  }

  function abrirNovoFormulario() {
    setForm({ titulo: "", descricao_curta: "", sobre_nos_texto: "", whatsapp: "", link_google_maps: "", ordem: restaurantes.length + 1, ativo: true });
    setImagemPrincipal(null); setFotoEquipe(null); setGaleriaFiles([]); setCardapio([{ prato: "", desc: "", preco: "" }]); setShowForm(true);
  }

  const addPrato = () => setCardapio([...cardapio, { prato: "", desc: "", preco: "" }]);
  const removePrato = (index: number) => setCardapio(cardapio.filter((_, i) => i !== index));
  const handlePratoChange = (index: number, field: string, value: string) => {
    const novoCardapio = [...cardapio]; novoCardapio[index] = { ...novoCardapio[index], [field]: value }; setCardapio(novoCardapio);
  };

  async function uploadImagem(file: File, pasta: string): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const path = `${pasta}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from('gastronomia').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('gastronomia').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSalvar() {
    if (!form.titulo) { alert("O nome do restaurante é obrigatório!"); return; }
    setSaving(true); setFeedback("A enviar fotografias...");

    try {
      let urlPrincipal = ""; if (imagemPrincipal) urlPrincipal = await uploadImagem(imagemPrincipal, 'capas') || "";
      let urlEquipe = ""; if (fotoEquipe) urlEquipe = await uploadImagem(fotoEquipe, 'equipes') || "";
      const urlsGaleria: string[] = [];
      for (const file of galeriaFiles) { const url = await uploadImagem(file, 'galeria'); if (url) urlsGaleria.push(url); }
      const cardapioLimpo = cardapio.filter(c => c.prato.trim() !== "");

      setFeedback("A guardar restaurante na base de dados...");
      const payload = { ...form, imagem_url: urlPrincipal || null, foto_equipe_url: urlEquipe || null, galeria: urlsGaleria.length > 0 ? urlsGaleria : null, cardapio: cardapioLimpo.length > 0 ? cardapioLimpo : null };
      const { error } = await supabase.from('gastronomia').insert([payload]);
      if (error) throw error;

      setFeedback("Restaurante publicado com sucesso!");
      setTimeout(() => { setShowForm(false); setFeedback(""); fetchRestaurantes(); }, 2000);
    } catch (err: any) { alert("Erro ao salvar: " + err.message); setFeedback(""); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este restaurante da vitrine?")) return;
    await supabase.from('gastronomia').delete().eq('id', id); fetchRestaurantes();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Vitrine Gastronômica</h2><p className="text-xs text-slate-500 mt-1">{restaurantes.length} estabelecimentos</p></div>
        <button onClick={abrirNovoFormulario} className="bg-[#00577C] text-white font-black text-sm px-5 py-2.5 rounded-xl flex items-center gap-2"><Plus size={16} /> Novo Restaurante</button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-8 border-b pb-4"><h3 className={`${jakarta.className} text-2xl font-black text-slate-800`}><Utensils className="text-[#F9C400] inline mr-2"/>Construtor de Página</h3><button onClick={() => setShowForm(false)} className="text-sm font-bold text-slate-400">Cancelar</button></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Informações Básicas</h4>
              <FormField label="Nome do Estabelecimento *"><input type="text" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} className={inputCls} /></FormField>
              <FormField label="Descrição Curta"><textarea rows={2} value={form.descricao_curta} onChange={e => setForm({...form, descricao_curta: e.target.value})} className={inputCls} /></FormField>
              <FormField label="A Nossa História (Sobre Nós)"><textarea rows={4} value={form.sobre_nos_texto} onChange={e => setForm({...form, sobre_nos_texto: e.target.value})} className={inputCls} /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="WhatsApp"><div className="relative"><Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} className={`${inputCls} pl-10`} /></div></FormField>
                <FormField label="Google Maps"><div className="relative"><MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={form.link_google_maps} onChange={e => setForm({...form, link_google_maps: e.target.value})} className={`${inputCls} pl-10`} /></div></FormField>
              </div>
            </div>
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Fotografias</h4>
              <FormField label="Foto Principal (Capa)">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-4 rounded-xl cursor-pointer hover:border-[#00577C] transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={e => setImagemPrincipal(e.target.files?.[0] || null)} />
                  <ImageIcon size={18} /> {imagemPrincipal ? imagemPrincipal.name : 'Clique para anexar Capa'}
                </label>
              </FormField>
              <FormField label="Foto da Equipe / Local">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-4 rounded-xl cursor-pointer hover:border-[#00577C] transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={e => setFotoEquipe(e.target.files?.[0] || null)} />
                  <ImageIcon size={18} /> {fotoEquipe ? fotoEquipe.name : 'Clique para anexar Foto da Equipe'}
                </label>
              </FormField>
              <FormField label="Galeria de Pratos">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-4 rounded-xl cursor-pointer hover:border-[#00577C] transition-colors">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) setGaleriaFiles(Array.from(e.target.files)); }} />
                  <ImageIcon size={18} /> {galeriaFiles.length > 0 ? `${galeriaFiles.length} imagens selecionadas` : 'Selecionar várias fotos'}
                </label>
              </FormField>
            </div>
          </div>
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between border-b pb-2"><h4 className="font-black text-[#00577C]">Destaques do Cardápio</h4><button onClick={addPrato} className="text-xs font-bold text-[#009640] flex items-center gap-1 hover:underline"><Plus size={14}/> Adicionar Prato</button></div>
            <div className="space-y-3">
              {cardapio.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex-1 w-full"><input type="text" value={item.prato} onChange={e => handlePratoChange(index, 'prato', e.target.value)} placeholder="Nome do Prato" className={inputCls} /></div>
                  <div className="flex-[2] w-full"><input type="text" value={item.desc} onChange={e => handlePratoChange(index, 'desc', e.target.value)} placeholder="Descrição" className={inputCls} /></div>
                  <div className="w-full md:w-40 flex gap-2"><input type="text" value={item.preco} onChange={e => handlePratoChange(index, 'preco', e.target.value)} placeholder="R$ 85,00" className={inputCls} /><button onClick={() => removePrato(index)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 border border-red-200"><Trash2 size={18} /></button></div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
            <span className="text-sm font-bold text-[#009640]">{feedback}</span>
            <button onClick={handleSalvar} disabled={saving} className="bg-[#009640] text-white px-10 py-4 rounded-xl font-black text-sm shadow-lg flex items-center gap-2">{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Publicar Restaurante</button>
          </div>
        </div>
      ) : (
        loading ? (<div className="py-12 flex justify-center"><Loader2 size={32} className="text-[#00577C] animate-spin" /></div>) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurantes.map((rest) => (
              <div key={rest.id} className="bg-white rounded-[2rem] border border-slate-200 p-4 flex flex-col hover:shadow-xl transition-shadow">
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 mb-4"><img src={rest.imagem_url || "/logop.png"} alt={rest.titulo} className="object-cover w-full h-full" /></div>
                <div className="px-2 pb-2 flex-1 flex flex-col">
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-800 mb-1`}>{rest.titulo}</h3>
                  <p className="text-xs font-medium text-slate-500 line-clamp-2 mb-4">{rest.descricao_curta}</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100"><span className="text-[10px] font-black uppercase text-[#009640] flex items-center gap-1"><Utensils size={12}/> Ativo na Vitrine</span><button onClick={() => handleDelete(rest.id)} className="text-xs font-bold text-red-500 hover:underline">Remover</button></div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATRAÇÕES - CONSTRUTOR DE VITRINE
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

  useEffect(() => { fetchAtracoes(); }, []);

  async function fetchAtracoes() {
    setLoading(true);
    const { data } = await supabase.from("atracoes").select("*").order("nome");
    setAtracoes(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null); 
    setForm({ nome: "", tipo: "", descricao: "", imagem_url: "", preco_entrada: 0, whatsapp: "", link_google_maps: "" });
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
    
    setFeedback(editando ? "Atração atualizada!" : "Atração publicada com sucesso!");
    setTimeout(() => { setShowForm(false); setSaving(false); fetchAtracoes(); setFeedback(""); }, 2000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta atração da vitrine?")) return;
    await supabase.from("atracoes").delete().eq("id", id); 
    fetchAtracoes();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Vitrine de Atrações</h2>
          <p className="text-xs text-slate-500 mt-1">{atracoes.length} pontos turísticos em exibição</p>
        </div>
        <button onClick={abrirFormNovo} className="bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2">
          <Plus size={16} /> Nova Atração
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 flex items-center gap-2`}>
              <MapPin className="text-[#F9C400]" /> {editando ? "Editar Atração" : "Construtor de Página da Atração"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-sm font-bold text-slate-400 hover:text-slate-800">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Informações Principais</h4>
              <FormField label="Nome da Atração *"><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} placeholder="Ex: Mirante da Serra" /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Tipo"><input value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputCls} placeholder="Ex: Natureza, Museu..." /></FormField>
                <FormField label="Preço de entrada (R$)"><input type="number" step="0.01" value={form.preco_entrada} onChange={(e) => setForm({ ...form, preco_entrada: parseFloat(e.target.value) })} className={inputCls} /></FormField>
              </div>
              <FormField label="Descrição Detalhada"><textarea value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={5} className={inputCls} placeholder="Descreva os encantos desta atração..." /></FormField>
            </div>
            
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Localização e Mídia</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="WhatsApp de Contato"><div className="relative"><Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={`${inputCls} pl-10`} placeholder="94 90000-0000" /></div></FormField>
                <FormField label="Link Google Maps"><div className="relative"><MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={form.link_google_maps || ""} onChange={(e) => setForm({ ...form, link_google_maps: e.target.value })} className={`${inputCls} pl-10`} placeholder="https://maps..." /></div></FormField>
              </div>
              <FormField label="Fotografia de Capa">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-6 rounded-xl cursor-pointer hover:border-[#00577C] transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImagemFile(e.target.files?.[0] || null)} />
                  <ImageIcon size={18} /> {imagemFile ? imagemFile.name : form.imagem_url ? "Trocar imagem atual" : "Clique para anexar Capa da Atração"}
                </label>
                {form.imagem_url && !imagemFile && <img src={form.imagem_url} alt="Capa atual" className="mt-3 h-24 w-full object-cover rounded-xl border border-slate-200" />}
              </FormField>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
            <span className="text-sm font-bold text-[#009640]">{feedback}</span>
            <button onClick={handleSave} disabled={saving} className="bg-[#009640] hover:bg-green-700 text-white px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Publicar Atração
            </button>
          </div>
        </div>
      ) : (
        loading ? <div className="py-12 flex justify-center"><Loader2 size={32} className="text-[#00577C] animate-spin" /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {atracoes.map((a) => (
              <div key={a.id} className="bg-white rounded-[2rem] border border-slate-200 p-4 flex flex-col hover:shadow-xl transition-shadow">
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 mb-4">
                  <img src={a.imagem_url || "/placeholder.png"} alt={a.nome} className="object-cover w-full h-full" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-black text-[#00577C] shadow-sm uppercase">{a.tipo}</div>
                </div>
                <div className="px-2 pb-2 flex-1 flex flex-col">
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-800 mb-1`}>{a.nome}</h3>
                  <p className="text-xs font-bold text-[#009640] mb-3">R$ {a.preco_entrada.toFixed(2)}</p>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                    <button onClick={() => abrirFormEditar(a)} className="text-xs font-bold text-[#00577C] hover:underline">Editar Atração</button>
                    <button onClick={() => handleDelete(a.id)} className="text-xs font-bold text-red-500 hover:underline">Remover</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}