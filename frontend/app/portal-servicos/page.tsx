"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { 
  Calendar as CalendarIcon, Bell, CheckCircle2, Clock, Map, Package, Activity, AlertCircle,
  Upload, Image as ImageIcon, Save, Loader2, FileSpreadsheet, Utensils, MapPin, Phone, Plus, Trash2,
  Building2, Briefcase, Compass, Newspaper, Smartphone
} from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

if (typeof window !== "undefined") {
  window.katex = katex;
}

const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <p className="text-sm text-slate-400 p-4">A carregar editor de texto...</p>
});

// Configuração da barra de ferramentas (Opções que o utilizador vai ter)
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'script': 'sub'}, { 'script': 'super' }], // Importante para notações
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'align': [] }],
    ['link', 'image', 'video', 'formula'], // ◄── 'formula' adicionado aqui
    ['clean']
  ],
};

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── Tipos Limpos e Diretos ──────────────────────────────────────────────────

interface Evento {
  id: string; titulo: string; subtitulo: string | null; descricao: string | null;
  data: string; horario: string | null; duracao: string | null; local: string;
  imagem_url: string | null; categoria: string; preco: string | null;
  classificacao: string | null; link_bilheteira: string | null; destaque: boolean;
}

interface Atracao {
  id: string; nome: string; tipo: string; descricao: string; imagem_url: string;
  preco_entrada: number; asaas_wallet_id: string | null; whatsapp: string | null;
  link_google_maps: string | null; link_hospedagem: string | null; galeria: string[] | null;
}

interface Hotel {
  id: string; nome: string; tipo: string; descricao: string; estrelas: number;
  imagem_url: string; whatsapp: string | null; endereco: string | null;
  preco_medio: string | null; comodidades: string[] | null; galeria: string[] | null;
  ativo: boolean;
}

interface Agencia {
  id: string; nome: string; descricao_curta: string | null; sobre: string | null;
  capa_url: string | null; logo_url: string | null; cadastur: string | null;
  endereco: string | null; instagram: string | null; email: string | null;
  whatsapp: string | null; galeria: string[] | null; especialidades: any | null;
  ativo: boolean;
}

interface Gastronomia {
  id: string; titulo: string; descricao_curta: string; imagem_url: string;
  ordem: number; ativo: boolean; criado_em: string; whatsapp: string | null;
  link_google_maps: string | null; sobre_nos_texto: string | null;
  foto_equipe_url: string | null; galeria: string[] | null; cardapio: any[] | null;
}

interface Pedido {
  id: string; codigo_pedido: string; tipo_item: string; item_id: string;
  nome_cliente: string; cpf_cliente: string; email_cliente: string;
  valor_total: number; status_pagamento: string; criado_em: string;
}

// NOVO TIPO: Blog
interface BlogPost {
  id: string; titulo: string; resumo: string; conteudo: string;
  imagem_url: string | null; data_publicacao: string;
  ativo: boolean; autor: string | null; categoria: string | null;
  destaque: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function fmtData(iso: string) {
  if (!iso) return "—"; const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`;
}

function fmtDatetime(iso: string) {
  if (!iso) return "—"; const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Login ───────────────────────────────────────────────────────────────────

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
      // Faz apenas a verificação oficial e segura do Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password: senha });
      
      if (authError) throw new Error("Credenciais inválidas. Verifique o e-mail e a senha.");

      // Se passou pelo erro acima, o login foi um sucesso! Entra direto no painel:
      setRole("geral"); 
      
    } catch (error: any) {
      setErroLogin(error.message);
    } finally {
      setLoadingLogin(false);
    }
  }

  if (!role) {
    return (
      <div className={`${inter.className} min-h-screen bg-[#FDFCF7] flex items-center justify-center p-4`}>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center">
            <div className="relative w-32 h-16 mb-4"><Image src="/logop.png" alt="Logo" fill className="object-contain" priority /></div>
            <h1 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>CMS Institucional</h1>
            <p className="text-sm text-slate-500 mt-1">Gestão do Portal SagaTurismo</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <FormField label="E-mail de acesso"><input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErroLogin(""); }} className={inputCls} placeholder="admin@sagaturismo.com.br" required autoFocus /></FormField>
              <FormField label="Senha de acesso"><input type="password" value={senha} onChange={(e) => { setSenha(e.target.value); setErroLogin(""); }} className={inputCls} placeholder="••••••••" required />{erroLogin && <p className="text-red-500 text-xs mt-2 font-medium">{erroLogin}</p>}</FormField>
              <button type="submit" disabled={loadingLogin} className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white font-black rounded-lg py-3 text-sm transition shadow-sm uppercase tracking-widest mt-2 disabled:opacity-70">{loadingLogin ? "A verificar..." : "Entrar"}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard role={role} onLogout={() => { supabase.auth.signOut(); setRole(null); setEmail(""); setSenha(""); }} />;
}

// ─── Dashboard Base ──────────────────────────────────────────────────────────

function AdminDashboard({ role, onLogout }: { role: "geral" | "turismo" | "meio_ambiente"; onLogout: () => void }) {
  // Adicionamos o separador BLOG
  const allowedTabs = [
    { id: "dashboard",   label: "Painel Geral", icon: <Activity size={18} /> },
    { id: "blog",        label: "Blog/Notícias",icon: <Newspaper size={18} /> },
    { id: "newsletter",  label: "Newsletter",   icon: <Bell size={18} /> }, 
    { id: "notificacoes",label: "App Notificações",icon: <Smartphone size={18} /> },
    { id: "eventos",     label: "Eventos",      icon: <CalendarIcon size={18} /> },
    { id: "atracoes",    label: "Atrativos",     icon: <MapPin size={18} /> },
    { id: "hoteis",      label: "Hotéis",       icon: <Building2 size={18} /> },
    { id: "gastronomia", label: "Gastronomia",  icon: <Utensils size={18} /> },
    { id: "agencias",    label: "Agências",     icon: <Briefcase size={18} /> },
    { id: "pedidos",     label: "Pedidos",      icon: <CheckCircle2 size={18} /> },
  ];

  const [activeTab, setActiveTab] = useState<string>("dashboard");

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-800`}>
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-28 h-8"><Image src="/logop.png" alt="Logo" fill className="object-contain object-left" priority /></div>
            <span className="hidden sm:block text-xs font-bold text-slate-500 border-l border-slate-200 pl-3 uppercase tracking-wider">Painel Administrativo</span>
          </div>
          <button onClick={onLogout} className="text-xs text-slate-500 hover:text-[#00577C] transition flex items-center gap-1.5 font-bold uppercase tracking-widest">Sair</button>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 min-w-max py-2">
            {allowedTabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-black rounded-xl transition ${activeTab === tab.id ? "bg-[#00577C] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "dashboard"   && <TabDashboard />}
        {activeTab === "blog"        && <TabBlog />}
        {activeTab === "eventos"     && <TabEventos />}
        {activeTab === "atracoes"    && <TabAtracoes />}
        {activeTab === "gastronomia" && <TabGastronomia />}
        {activeTab === "pedidos"     && <TabPedidos />}
        {activeTab === "hoteis"      && <TabHoteis />} 
        {activeTab === "agencias"    && <TabAgencias />}
        {activeTab === "newsletter" && <TabNewsletter />}
        {activeTab === "notificacoes" && <TabNotificacoes />}
      </main>
    </div>
  );
}

// ─── Aba: Dashboard (Simplificada) ───────────────────────────────────────────

function TabDashboard() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [stats, setStats] = useState({ hoteis: 0, agencias: 0, restaurantes: 0, atracoes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregarDashboard(); }, []);

  async function carregarDashboard() {
    setLoading(true);
    const hoje = new Date();
    const daquiA7Dias = new Date(); daquiA7Dias.setDate(hoje.getDate() + 7);
    const hojeIso = hoje.toISOString().split('T')[0];
    const daquiA7DiasIso = daquiA7Dias.toISOString().split('T')[0];

    // Busca Eventos da Semana
    const { data: eventosData } = await supabase.from('eventos').select('titulo, data, local').gte('data', hojeIso).lte('data', daquiA7DiasIso).order('data', { ascending: true });
    setEventos(eventosData || []);

    // Conta os Registos Ativos
    const { count: cAtracoes } = await supabase.from('atracoes').select('*', { count: 'exact', head: true });
    const { count: cHoteis } = await supabase.from('hoteis').select('*', { count: 'exact', head: true });
    const { count: cAgencias } = await supabase.from('agencias').select('*', { count: 'exact', head: true });
    const { count: cRest } = await supabase.from('gastronomia').select('*', { count: 'exact', head: true });

    setStats({ 
      atracoes: cAtracoes || 0, hoteis: cHoteis || 0, 
      agencias: cAgencias || 0, restaurantes: cRest || 0 
    });
    setLoading(false);
  }

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#00577C]" size={32}/></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-50 text-[#00577C] rounded-2xl flex items-center justify-center mb-3"><MapPin size={24}/></div>
          <span className={`${jakarta.className} text-3xl font-black text-slate-800`}>{stats.atracoes}</span>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Atrativos</span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-3"><Building2 size={24}/></div>
          <span className={`${jakarta.className} text-3xl font-black text-slate-800`}>{stats.hoteis}</span>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Hotéis</span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-green-50 text-[#009640] rounded-2xl flex items-center justify-center mb-3"><Utensils size={24}/></div>
          <span className={`${jakarta.className} text-3xl font-black text-slate-800`}>{stats.restaurantes}</span>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Restaurantes</span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3"><Briefcase size={24}/></div>
          <span className={`${jakarta.className} text-3xl font-black text-slate-800`}>{stats.agencias}</span>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Agências</span>
        </div>
      </div>

      {/* Próximos Eventos */}
      <section className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm max-w-3xl mx-auto">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="bg-[#00577C]/10 text-[#00577C] p-2 rounded-xl"><CalendarIcon size={20}/></div>
          <h3 className={`${jakarta.className} text-xl font-black text-slate-800`}>Eventos Municipais (Próximos 7 Dias)</h3>
        </div>
        {eventos.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={40} className="mx-auto text-slate-200 mb-3"/>
            <p className="font-bold text-slate-400">Agenda livre.</p>
            <p className="text-xs text-slate-400">Nenhum evento programado para esta semana.</p>
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
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1"><MapPin size={12}/> {ev.local}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOG / NOTÍCIAS
// ═══════════════════════════════════════════════════════════════════════════════

function TabBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<BlogPost | null>(null);
  const [modoEditor, setModoEditor] = useState<'visual' | 'codigo'>('visual');
  
  const formVazio = { 
    titulo: "", resumo: "", conteudo: "", legenda_imagem_capa: "", // ◄── Novo
    data_publicacao: new Date().toISOString().split('T')[0], 
    autor: "Redação", categoria: "Turismo", 
    ativo: true, destaque: false 
  };
  const [form, setForm] = useState<any>(formVazio);
  
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data } = await supabase.from("blog").select("*").order("data_publicacao", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null); setForm(formVazio); setImagemFile(null); setShowForm(true);
  }

  function abrirFormEditar(post: BlogPost) {
    setEditando(post); setForm({ ...post }); setImagemFile(null); setShowForm(true);
  }

  async function toggleAtivo(id: string, estadoAtual: boolean) {
    await supabase.from("blog").update({ ativo: !estadoAtual }).eq("id", id);
    fetchPosts();
  }

  async function handleSave() {
    if (!form.titulo || !form.conteudo) { setFeedback("Título e Conteúdo são obrigatórios."); return; }
    setSaving(true); setFeedback("Salvando...");
    
    let imagem_url = editando?.imagem_url || null;
    
    if (imagemFile) {
      const ext = imagemFile.name.split(".").pop();
      const path = `blog/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("galeria").upload(path, imagemFile, { upsert: true }); // Pode usar outro bucket se preferir
      if (!error) {
        const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
        imagem_url = pub.publicUrl;
      }
    }
    
    const payload = { ...form, imagem_url };
    
    if (editando) await supabase.from("blog").update(payload).eq("id", editando.id);
    else await supabase.from("blog").insert(payload);
    
    setFeedback(editando ? "Artigo atualizado com sucesso!" : "Novo artigo publicado!");
    setTimeout(() => { setShowForm(false); setSaving(false); fetchPosts(); setFeedback(""); }, 2000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja apagar este artigo permanentemente?")) return;
    await supabase.from("blog").delete().eq("id", id); 
    fetchPosts();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Gestão do Blog</h2>
          <p className="text-xs text-slate-500 mt-1">{posts.length} artigos publicados</p>
        </div>
        <button onClick={abrirFormNovo} className="bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2">
          <Plus size={16} /> Novo Artigo
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 flex items-center gap-2`}>
              <Newspaper className="text-[#F9C400]" /> {editando ? "Editar Artigo" : "Escrever Novo Artigo"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-sm font-bold text-slate-400 hover:text-slate-800">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-8">
            <div className="lg:col-span-2 space-y-5">
              <FormField label="Título da Notícia/Artigo *"><input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={inputCls} placeholder="Ex: Novo roteiro descoberto..." /></FormField>
              <FormField label="Resumo Breve"><textarea value={form.resumo || ""} onChange={(e) => setForm({ ...form, resumo: e.target.value })} rows={2} className={inputCls} placeholder="Uma breve frase sobre o artigo" /></FormField>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                  Conteúdo Completo *
                </label>
                {/* Abas de troca de modo */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    type="button"
                    onClick={() => setModoEditor('visual')}
                    className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-md transition-all ${modoEditor === 'visual' ? 'bg-white text-[#00577C] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Modo Visual
                  </button>
                  <button 
                    type="button"
                    onClick={() => setModoEditor('codigo')}
                    className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-md transition-all ${modoEditor === 'codigo' ? 'bg-white text-[#00577C] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    HTML / LaTeX Bruto
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {modoEditor === 'visual' ? (
                  <ReactQuill 
                    theme="snow" 
                    value={form.conteudo || ""} 
                    onChange={(content) => setForm({ ...form, conteudo: content })} 
                    modules={quillModules}
                    placeholder="Escreva a sua notícia, adicione fotos ou fórmulas (botão fx)..."
                    className="h-[400px] mb-12" 
                  />
                ) : (
                  <textarea 
                    value={form.conteudo || ""}
                    onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                    className="w-full h-[450px] p-4 bg-slate-900 text-green-400 font-mono text-sm focus:outline-none"
                    placeholder="<p>Insira seu código HTML ou marcações LaTeX aqui...</p>"
                  />
                )}
              </div>
            </div>
            
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Detalhes & Publicação</h4>
              <FormField label="Autor"><input value={form.autor || ""} onChange={(e) => setForm({ ...form, autor: e.target.value })} className={inputCls} placeholder="Ex: Redação, Nome..." /></FormField>
              <FormField label="Categoria"><input value={form.categoria || ""} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputCls} placeholder="Ex: Turismo, Eventos..." /></FormField>
              <FormField label="Data de Publicação *"><input type="date" value={form.data_publicacao} onChange={(e) => setForm({ ...form, data_publicacao: e.target.value })} className={inputCls} /></FormField>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Visibilidade"><select value={String(form.ativo)} onChange={(e) => setForm({ ...form, ativo: e.target.value === 'true' })} className={inputCls}><option value="true">Público</option><option value="false">Oculto</option></select></FormField>
                <FormField label="Destaque?"><select value={String(form.destaque)} onChange={(e) => setForm({ ...form, destaque: e.target.value === 'true' })} className={inputCls}><option value="false">Não</option><option value="true">Sim</option></select></FormField>
              </div>

              <FormField label="Imagem de Capa">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-6 rounded-xl cursor-pointer hover:border-[#00577C] transition-colors text-center text-xs">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImagemFile(e.target.files?.[0] || null)} />
                  <ImageIcon size={18} /> {imagemFile ? imagemFile.name : form.imagem_url ? "Trocar imagem atual" : "Anexar Imagem"}
                </label>
                {form.imagem_url && !imagemFile && <img src={form.imagem_url} alt="Capa atual" className="mt-3 h-24 w-full object-cover rounded-xl border border-slate-200" />}
              </FormField>

              <FormField label="Legenda / Créditos da Capa" className="mt-4">
                <input 
                  value={form.legenda_imagem_capa || ""} 
                  onChange={(e) => setForm({ ...form, legenda_imagem_capa: e.target.value })} 
                  className={inputCls} 
                  placeholder="Ex: Foto por João Silva / Parque Nacional..." 
                />
              </FormField>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
            <span className="text-sm font-bold text-[#009640]">{feedback}</span>
            <button onClick={handleSave} disabled={saving} className="bg-[#009640] hover:bg-green-700 text-white px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Publicar Artigo
            </button>
          </div>
        </div>
      ) : (
        loading ? <div className="py-12 flex justify-center"><Loader2 size={32} className="text-[#00577C] animate-spin" /></div> : (
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <Th className="w-16">Capa</Th><Th>Título do Artigo</Th><Th>Categoria</Th><Th>Data</Th><Th>Status</Th><Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3"><img src={post.imagem_url || "/placeholder.png"} alt={post.titulo} className="w-10 h-10 rounded-lg object-cover" /></td>
                    <td className="px-4 py-3"><p className="font-bold text-slate-800 line-clamp-1">{post.titulo}</p><p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{post.resumo}</p></td>
                    <td className="px-4 py-3 text-slate-600">{post.categoria || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtData(post.data_publicacao)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleAtivo(post.id, post.ativo)} className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full transition-colors ${post.ativo ? 'text-[#009640] bg-green-50 hover:bg-green-100' : 'text-slate-500 bg-slate-200 hover:bg-slate-300'}`}>
                        {post.ativo ? "Público" : "Oculto"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                         <button onClick={() => abrirFormEditar(post)} className="text-xs font-bold text-[#00577C] hover:underline">Editar</button>
                         <button onClick={() => handleDelete(post.id)} className="text-xs font-bold text-red-500 hover:underline">Remover</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (<tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Nenhum artigo publicado no blog.</td></tr>)}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEWSLETTER COMERCIAL
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// NEWSLETTER COMERCIAL (HTML LIVRE)
// ═══════════════════════════════════════════════════════════════════════════════

function TabNewsletter() {
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Campos Simplificados
  const [assunto, setAssunto] = useState("");
  const [textoHtml, setTextoHtml] = useState("");

  useEffect(() => {
    fetchInscritos();
  }, []);

  async function fetchInscritos() {
    setLoading(true);
    const { data, error } = await supabase.from("newsletter_inscritos").select("*").order("criado_em", { ascending: false });
    if (data) setInscritos(data);
    setLoading(false);
  }

  async function handleDisparar(e: React.FormEvent) {
    e.preventDefault();
    if (!assunto || !textoHtml) {
      alert("Preencha o assunto e cole o código HTML da newsletter.");
      return;
    }

    if (inscritos.length === 0) {
      alert("Não existem e-mails cadastrados na base de dados para envio.");
      return;
    }

    if (!confirm(`Tem a certeza que deseja disparar esta newsletter para ${inscritos.length} inscritos?`)) {
      return;
    }

    setEnviando(true);
    setFeedback("A preparar disparos em lote...");

    const listaEmails = inscritos.map(i => i.email);

    try {
      const response = await fetch('https://sagaturismo-production.up.railway.app/api/v1/newsletter/disparar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: listaEmails,
          assunto,
          texto_html: textoHtml
        })
      });

      if (response.ok) {
        setFeedback(`Sucesso! Newsletter disparada para ${inscritos.length} destinatários.`);
        setAssunto(""); setTextoHtml("");
      } else {
        setFeedback("Erro ao disparar e-mails pelo servidor.");
      }
    } catch (err) {
      setFeedback("Erro de conexão com o servidor de disparo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Campanhas de Newsletter</h2>
          <p className="text-xs text-slate-500 mt-1">Total de {inscritos.length} utilizadores inscritos para receber novidades.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULÁRIO DE DISPARO (CÓDIGO LIVRE) */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
          <h3 className={`${jakarta.className} text-lg font-black text-slate-800 mb-6 flex items-center gap-2`}>
            <Bell size={18} className="text-[#F9C400]" /> Disparo de E-mail (Código Livre)
          </h3>

          <form onSubmit={handleDisparar} className="space-y-5">
            <FormField label="Assunto do E-mail (O que aparece na caixa de entrada) *">
              <input value={assunto} onChange={e => setAssunto(e.target.value)} className={inputCls} placeholder="Ex: Descubra as novas cachoeiras 🌿" required />
            </FormField>

            <FormField label="Código HTML Completo (Cole aqui o código do seu editor) *">
              <textarea 
                rows={16} 
                value={textoHtml} 
                onChange={e => setTextoHtml(e.target.value)} 
                className={`${inputCls} font-mono text-xs bg-slate-900 text-green-400 p-4`} 
                placeholder="<!DOCTYPE html><html>..." 
                required 
              />
            </FormField>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-[#009640]">{feedback}</span>
              <button type="submit" disabled={enviando} className="bg-[#00577C] hover:bg-[#004a6b] text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md flex items-center gap-2 disabled:opacity-50 transition-all">
                {enviando ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />} Disparar para {inscritos.length} Inscritos
              </button>
            </div>
          </form>
        </div>

        {/* LISTAGEM RÁPIDA DOS INSCRITOS */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col h-fit">
          <h4 className={`${jakarta.className} text-sm font-black text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100`}>
            Base de Leads Capturados
          </h4>
          
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-[#00577C]" size={24} /></div>
          ) : inscritos.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Nenhum e-mail inscrito na newsletter até ao momento.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {inscritos.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col">
                  <span className="text-xs font-bold text-slate-700 truncate">{item.email}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Cadastrado em: {fmtData(item.criado_em?.split('T')[0])}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTOS - GESTÃO COMPLETA (EM LOTE E MANUAL)
// ═══════════════════════════════════════════════════════════════════════════════

function TabEventos() {
  const [fase, setFase] = useState<'inicio' | 'preview' | 'salvando' | 'sucesso' | 'manual'>('inicio');
  const [eventosList, setEventosList] = useState<Evento[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  
  // ── ESTADOS DO CSV ──
  const [eventosPreview, setEventosPreview] = useState<any[]>([]);
  const [imagensMap, setImagensMap] = useState<{ [key: number]: File }>({});
  const [feedback, setFeedback] = useState("");

  // ── ESTADOS DO MANUAL ──
  const [formManual, setFormManual] = useState<any>({ destaque: false, categoria: 'Cultura' });
  const [imagemManual, setImagemManual] = useState<File | null>(null);
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    fetchEventos();
  }, []);

  async function fetchEventos() {
    setLoadingList(true);
    
    // 1. Pega a data de hoje e formata para 'YYYY-MM-DD' (ex: 2026-08-07)
    const hoje = new Date().toISOString().split('T')[0];

    // 2. Busca apenas eventos de hoje em diante (.gte = greater than or equal)
    // E muda a ordem para 'ascending: true' (para mostrar o evento mais próximo primeiro)
    const { data } = await supabase
      .from('eventos')
      .select('*')
      .gte('data', hoje)
      .order('data', { ascending: true });
      
    setEventosList(data || []);
    setLoadingList(false);
  }

  async function handleDeleteEvento(id: string) {
    if(!confirm("Remover este evento permanentemente?")) return;
    await supabase.from('eventos').delete().eq('id', id);
    fetchEventos();
  }

  // ── 1. MOTOR DE LEITURA DO CSV ──
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

  // ── 2. ENVIO EM LOTE (CSV) ──
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

  // ── 3. ENVIO MANUAL ──
  const abrirFormManual = () => {
    setFormManual({ destaque: false, categoria: 'Cultura' });
    setImagemManual(null);
    setFase('manual');
  };

  const handleSalvarManual = async () => {
    if (!formManual.titulo || !formManual.data || !formManual.local) {
      alert("Título, Data e Local são obrigatórios.");
      return;
    }
    setSavingManual(true);
    setFeedback("A publicar evento...");

    let imagem_url = "";
    if (imagemManual) {
      const ext = imagemManual.name.split('.').pop();
      const nomeFicheiro = `evento_manual_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('eventos').upload(nomeFicheiro, imagemManual);
      if (!uploadErr) {
        const { data: pubUrl } = supabase.storage.from('eventos').getPublicUrl(nomeFicheiro);
        imagem_url = pubUrl.publicUrl;
      }
    }

    const { error: dbError } = await supabase.from('eventos').insert([{
      titulo: formManual.titulo,
      subtitulo: formManual.subtitulo || null,
      descricao: formManual.descricao || null,
      data: formManual.data,
      horario: formManual.horario || null,
      duracao: formManual.duracao || null,
      local: formManual.local,
      categoria: formManual.categoria,
      preco: formManual.preco || null,
      classificacao: formManual.classificacao || null,
      link_bilheteira: formManual.link_bilheteira || null,
      imagem_url: imagem_url || null,
      destaque: String(formManual.destaque) === 'true'
    }]);

    if (dbError) {
      alert("Erro ao salvar: " + dbError.message);
      setSavingManual(false);
      return;
    }

    setFeedback("Evento manual publicado com sucesso!");
    setFase('sucesso');
    setSavingManual(false);
  };

  const resetar = () => { setFase('inicio'); setEventosPreview([]); setImagensMap({}); setFeedback(""); fetchEventos(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Gestão de Eventos</h2>
          <p className="text-xs text-slate-500 mt-1">Ferramenta exclusiva da Prefeitura para o calendário da cidade.</p>
        </div>
        {fase !== 'inicio' && (<button onClick={resetar} className="text-xs text-slate-500 font-bold hover:text-slate-800 underline">Cancelar e Voltar</button>)}
      </div>

      {/* TELA 1: ESCOLHA DE MÉTODO (CSV ou MANUAL) + TABELA DE EVENTOS */}
      {fase === 'inicio' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opção Lote */}
            <div className="border-2 border-dashed border-slate-300 rounded-[2rem] p-10 text-center bg-white hover:bg-slate-50 transition-colors relative group flex flex-col items-center justify-center">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="w-16 h-16 bg-[#00577C]/10 text-[#00577C] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform mb-4"><FileSpreadsheet size={32} /></div>
              <h3 className={`${jakarta.className} text-xl font-black text-slate-800`}>Importação em Lote</h3>
              <p className="text-xs font-medium text-slate-500 mt-2">Arraste o seu ficheiro CSV (Excel) para carregar dezenas de eventos de uma só vez.</p>
              <button className="mt-6 bg-[#00577C] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md">Selecionar CSV</button>
            </div>

            {/* Opção Manual */}
            <div className="border border-slate-200 rounded-[2rem] p-10 text-center bg-white hover:shadow-xl transition-all flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-[#009640]/10 text-[#009640] rounded-2xl flex items-center justify-center mb-4"><Plus size={32} /></div>
              <h3 className={`${jakarta.className} text-xl font-black text-slate-800`}>Cadastro Manual</h3>
              <p className="text-xs font-medium text-slate-500 mt-2">Crie um evento único preenchendo o formulário completo de publicação.</p>
              <button onClick={abrirFormManual} className="mt-6 bg-[#009640] hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-colors">Criar Evento Manual</button>
            </div>
          </div>

          <div className="pt-4">
            <h3 className={`${jakarta.className} text-lg font-black text-[#00577C] mb-4`}>Eventos Cadastrados</h3>
            {loadingList ? (
              <Skeleton rows={5} />
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <Th>Cartaz</Th><Th>Título</Th><Th>Data</Th><Th>Local</Th><Th>Categoria</Th><Th className="text-right">Ações</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventosList.map((ev) => (
                      <tr key={ev.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="px-4 py-3"><img src={ev.imagem_url || "/placeholder.png"} alt={ev.titulo} className="w-10 h-10 rounded-lg object-cover" /></td>
                        <td className="px-4 py-3 font-medium text-slate-800">{ev.titulo}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtData(ev.data)}</td>
                        <td className="px-4 py-3 text-slate-600">{ev.local}</td>
                        <td className="px-4 py-3 text-slate-600">{ev.categoria}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteEvento(ev.id)} className="text-xs text-red-500 hover:text-red-600 border border-red-200 bg-red-50 px-2.5 py-1 rounded-md transition">Remover</button>
                        </td>
                      </tr>
                    ))}
                    {eventosList.length === 0 && (<tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Nenhum evento cadastrado.</td></tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TELA 2: FORMULÁRIO MANUAL */}
      {fase === 'manual' && (
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 flex items-center gap-2`}><CalendarIcon className="text-[#F9C400]" /> Construtor de Evento</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-4">
              <h4 className="font-black text-[#00577C] border-b pb-2">Informações Base</h4>
              <FormField label="Título do Evento *"><input value={formManual.titulo || ""} onChange={(e) => setFormManual({ ...formManual, titulo: e.target.value })} className={inputCls} placeholder="Ex: Festival de Verão" /></FormField>
              <FormField label="Subtítulo"><input value={formManual.subtitulo || ""} onChange={(e) => setFormManual({ ...formManual, subtitulo: e.target.value })} className={inputCls} placeholder="Frase de chamariz..." /></FormField>
              <FormField label="Descrição"><textarea value={formManual.descricao || ""} onChange={(e) => setFormManual({ ...formManual, descricao: e.target.value })} rows={4} className={inputCls} /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Categoria"><input value={formManual.categoria || ""} onChange={(e) => setFormManual({ ...formManual, categoria: e.target.value })} className={inputCls} placeholder="Ex: Música, Cultura..." /></FormField>
                <FormField label="Destaque?">
                  <select value={String(formManual.destaque)} onChange={(e) => setFormManual({ ...formManual, destaque: e.target.value })} className={inputCls}>
                    <option value="false">Não</option><option value="true">Sim (Banner Principal)</option>
                  </select>
                </FormField>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-black text-[#00577C] border-b pb-2">Logística e Mídia</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Data *"><input type="date" value={formManual.data || ""} onChange={(e) => setFormManual({ ...formManual, data: e.target.value })} className={inputCls} /></FormField>
                <FormField label="Horário de Início"><input type="time" value={formManual.horario || ""} onChange={(e) => setFormManual({ ...formManual, horario: e.target.value })} className={inputCls} /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Duração Estimada"><input value={formManual.duracao || ""} onChange={(e) => setFormManual({ ...formManual, duracao: e.target.value })} className={inputCls} placeholder="Ex: 3 dias, 4 horas..." /></FormField>
                <FormField label="Classificação Etária"><input value={formManual.classificacao || ""} onChange={(e) => setFormManual({ ...formManual, classificacao: e.target.value })} className={inputCls} placeholder="Ex: Livre, +18..." /></FormField>
              </div>
              <FormField label="Local do Evento *"><div className="relative"><MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={formManual.local || ""} onChange={(e) => setFormManual({ ...formManual, local: e.target.value })} className={`${inputCls} pl-9`} placeholder="Ex: Praça Central" /></div></FormField>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Preço (Deixe vazio se grátis)"><input value={formManual.preco || ""} onChange={(e) => setFormManual({ ...formManual, preco: e.target.value })} className={inputCls} placeholder="R$ 50,00" /></FormField>
                <FormField label="Link Bilheteira"><input value={formManual.link_bilheteira || ""} onChange={(e) => setFormManual({ ...formManual, link_bilheteira: e.target.value })} className={inputCls} placeholder="https://..." /></FormField>
              </div>

              <FormField label="Cartaz Oficial (Imagem)">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-4 rounded-xl cursor-pointer hover:border-[#00577C] transition-colors mt-1">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImagemManual(e.target.files?.[0] || null)} />
                  <ImageIcon size={18} /> {imagemManual ? imagemManual.name : "Clique para anexar Cartaz"}
                </label>
              </FormField>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
            <span className="text-sm font-bold text-[#009640]">{feedback}</span>
            <button onClick={handleSalvarManual} disabled={savingManual} className="bg-[#009640] hover:bg-green-700 text-white px-10 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all">
              {savingManual ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Publicar Evento
            </button>
          </div>
        </div>
      )}

      {/* TELA 3: PREVIEW DO CSV */}
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

      {/* TELA 4: FEEDBACK DE SALVAMENTO */}
      {(fase === 'salvando' || fase === 'sucesso') && (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
          {fase === 'salvando' ? (<Loader2 size={48} className="mx-auto text-[#00577C] animate-spin mb-6" />) : (<CheckCircle2 size={48} className="mx-auto text-[#009640] mb-6" />)}
          <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-2`}>{fase === 'salvando' ? 'A Sincronizar Calendário...' : 'Evento(s) Guardado(s) com Sucesso!'}</h3>
          <p className="text-slate-500 font-medium mb-8">{feedback}</p>
          {fase === 'sucesso' && (<button onClick={resetar} className="bg-[#00577C] text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-md">Voltar ao Início</button>)}
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
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1"><option value="todos">Todos os tipos</option><option value="hotel">Hotel</option><option value="passeio">Passeio</option><option value="pacote">Pacote</option><option value="carteira">Carteira</option></select>
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
// HOTÉIS & POUSADAS
// ═══════════════════════════════════════════════════════════════════════════════

function TabHoteis() {
  const [hoteis, setHoteis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const formVazio = { nome: "", tipo: "Hotel", descricao: "", estrelas: 3, whatsapp: "", endereco: "", instagram: "", ativo: true };
  const [form, setForm] = useState(formVazio);
  const [editando, setEditando] = useState<any | null>(null);
  
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [comodidadesTexto, setComodidadesTexto] = useState("");
  
  const [quartos, setQuartos] = useState<any[]>([{ id: null, nome: "", preco: "", desc: "", file: null, imagem_url: "" }]);

  useEffect(() => { fetchHoteis(); }, []);

  async function fetchHoteis() {
    setLoading(true);
    
    // 1. Vai buscar os hotéis
    const { data: hoteisData, error: hoteisError } = await supabase.from('hoteis').select('*').order('nome');
    
    // 2. Vai buscar TODOS os quartos à tabela correta no SINGULAR
    const { data: quartosData, error: quartosError } = await supabase.from('tipos_quarto').select('*');

    if (hoteisData) {
      // 3. Junta os quartos ao hotel correspondente
      const hoteisComQuartos = hoteisData.map(hotel => {
        const quartosDoHotel = (quartosData || []).filter((q: any) => q.hotel_id === hotel.id);
        return { ...hotel, tipos_quarto: quartosDoHotel };
      });
      setHoteis(hoteisComQuartos);
    } else {
      setHoteis([]);
    }
    
    setLoading(false);
  }

  function abrirNovo() {
    setEditando(null); setForm(formVazio); setImagemFile(null); setGaleriaFiles([]); 
    setComodidadesTexto(""); setQuartos([{ id: null, nome: "", preco: "", desc: "", file: null, imagem_url: "" }]);
    setShowForm(true);
  }

  function abrirEditar(hotel: any) {
    setEditando(hotel);
    setForm({ nome: hotel.nome, tipo: hotel.tipo, descricao: hotel.descricao, estrelas: hotel.estrelas || 3, whatsapp: hotel.whatsapp || "", endereco: hotel.endereco || "", instagram: hotel.instagram || "", ativo: hotel.ativo ?? true });
    setImagemFile(null); setGaleriaFiles([]);
    setComodidadesTexto(hotel.comodidades ? hotel.comodidades.join(", ") : "");
    
    // Mapeia os quartos que foram injetados no fetchHoteis
    let quartosParsed = [];
    if (hotel.tipos_quarto && Array.isArray(hotel.tipos_quarto)) {
      quartosParsed = hotel.tipos_quarto.map((q: any) => ({
        id: q.id,
        nome: q.nome_quarto || q.nome || "", 
        preco: q.preco_quarto || q.preco_base || "",
        desc: q.descricao || "",
        imagem_url: q.imagem_url || "",
        file: null
      }));
    }
    
    setQuartos(quartosParsed.length > 0 ? quartosParsed : [{ id: null, nome: "", preco: "", desc: "", file: null, imagem_url: "" }]);
    setShowForm(true);
  }

  const addQuarto = () => setQuartos([...quartos, { id: null, nome: "", preco: "", desc: "", file: null, imagem_url: "" }]);
  
  const removeQuarto = async (index: number) => {
    const quarto = quartos[index];
    if (quarto.id) {
      if (!confirm("Tem a certeza que deseja remover este quarto permanentemente da base de dados?")) return;
      // Apaga o quarto da tabela no SINGULAR
      await supabase.from('tipos_quarto').delete().eq('id', quarto.id);
    }
    setQuartos(quartos.filter((_, i) => i !== index));
  };

  const handleQuartoChange = (index: number, field: string, value: any) => {
    const novos = [...quartos]; novos[index] = { ...novos[index], [field]: value }; setQuartos(novos);
  };

  async function uploadImagem(file: File, pasta: string): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const path = `${pasta}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from('hoteis').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('hoteis').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSalvar() {
    if (!form.nome) { alert("Nome do estabelecimento é obrigatório."); return; }
    setSaving(true); setFeedback("A guardar ficheiros e alojamento...");

    try {
      let imagem_url = editando?.imagem_url || null;
      if (imagemFile) imagem_url = await uploadImagem(imagemFile, 'capas');

      let galeriaFinal = editando?.galeria || [];
      if (galeriaFiles.length > 0) {
        const novasUrls = [];
        for (const file of galeriaFiles) { const url = await uploadImagem(file, 'galeria'); if (url) novasUrls.push(url); }
        galeriaFinal = [...galeriaFinal, ...novasUrls];
      }

      const comodidadesArray = comodidadesTexto.split(',').map(c => c.trim()).filter(c => c);

      // 1. Gravar o Hotel
      const payloadHotel = { 
        ...form, 
        imagem_url, 
        galeria: galeriaFinal.length > 0 ? galeriaFinal : null,
        comodidades: comodidadesArray.length > 0 ? comodidadesArray : null
      };

      let hotelId = editando?.id;

      if (editando) {
        await supabase.from('hoteis').update(payloadHotel).eq('id', hotelId);
      } else {
        const { data: novoHotel, error: insertError } = await supabase.from('hoteis').insert([payloadHotel]).select('id').single();
        if (insertError) throw insertError;
        hotelId = novoHotel.id;
      }

      // 2. Gravar os Quartos na Tabela 'tipos_quarto'
      for (const q of quartos) {
        if (!q.nome.trim()) continue; 

        let qUrl = q.imagem_url;
        if (q.file) {
          const uploadedUrl = await uploadImagem(q.file, 'quartos');
          if (uploadedUrl) qUrl = uploadedUrl;
        }

        const payloadQuarto = {
          hotel_id: hotelId,
          nome_quarto: q.nome,
          preco_quarto: parseFloat(q.preco) || 0,
          descricao: q.desc,
          imagem_url: qUrl,
          capacidade: 2, 
          estoque_total: 1 
        };

        if (q.id) {
          // Grava no SINGULAR
          await supabase.from('tipos_quarto').update(payloadQuarto).eq('id', q.id);
        } else {
          // Grava no SINGULAR
          await supabase.from('tipos_quarto').insert([payloadQuarto]);
        }
      }

      setFeedback(editando ? "Hotel atualizado!" : "Hotel publicado!");
      setTimeout(() => { setShowForm(false); setFeedback(""); fetchHoteis(); }, 2000);
    } catch (err: any) { alert("Erro ao salvar: " + err.message); setFeedback(""); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover permanentemente? Os quartos associados também serão apagados.")) return;
    await supabase.from('hoteis').delete().eq('id', id); fetchHoteis();
  }

  async function toggleAtivo(id: string, estadoAtual: boolean) {
    await supabase.from('hoteis').update({ ativo: !estadoAtual }).eq('id', id);
    fetchHoteis();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Vitrine de Hotéis</h2><p className="text-xs text-slate-500 mt-1">{hoteis.length} alojamentos</p></div>
        <button onClick={abrirNovo} className="bg-[#00577C] text-white font-black text-sm px-5 py-2.5 rounded-xl flex items-center gap-2"><Plus size={16} /> Novo Hotel</button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-8 border-b pb-4"><h3 className={`${jakarta.className} text-2xl font-black text-slate-800`}><Building2 className="text-[#F9C400] inline mr-2"/>{editando ? "Editar Alojamento" : "Novo Alojamento"}</h3><button onClick={() => setShowForm(false)} className="text-sm font-bold text-slate-400">Cancelar</button></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Informações Principais</h4>
              <FormField label="Nome *"><input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className={inputCls} /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Tipo"><select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className={inputCls}><option>Hotel</option><option>Pousada</option><option>Pensão</option><option>Resort</option></select></FormField>
                {form.tipo === 'Hotel' && <FormField label="Estrelas"><input type="number" min="1" max="5" value={form.estrelas} onChange={e => setForm({...form, estrelas: parseInt(e.target.value)})} className={inputCls} /></FormField>}
              </div>
              <FormField label="Descrição"><textarea rows={4} value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className={inputCls} /></FormField>
              <FormField label="Comodidades (Separadas por vírgula)"><input type="text" placeholder="Ex: Piscina, Wi-Fi..." value={comodidadesTexto} onChange={e => setComodidadesTexto(e.target.value)} className={inputCls} /></FormField>
            </div>
            
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Contatos e Mídia</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="WhatsApp"><div className="relative"><Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} className={`${inputCls} pl-10`} /></div></FormField>
                <FormField label="Instagram"><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">@</span><input type="text" value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} className={`${inputCls} pl-9`} /></div></FormField>
              </div>
              <FormField label="Endereço"><div className="relative"><MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} className={`${inputCls} pl-10`} /></div></FormField>
              
              <FormField label="Foto Principal (Vitrine)">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 p-4 rounded-xl cursor-pointer hover:border-[#00577C] text-slate-500">
                  <input type="file" accept="image/*" className="hidden" onChange={e => setImagemFile(e.target.files?.[0] || null)} />
                  <ImageIcon size={18} /> {imagemFile ? imagemFile.name : (editando?.imagem_url ? 'Substituir Imagem' : 'Anexar Imagem')}
                </label>
              </FormField>
              <FormField label="Adicionar Fotos à Galeria">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 p-4 rounded-xl cursor-pointer hover:border-[#00577C] text-slate-500">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) setGaleriaFiles(Array.from(e.target.files)); }} />
                  <ImageIcon size={18} /> {galeriaFiles.length > 0 ? `${galeriaFiles.length} ficheiros novos` : 'Anexar Fotos'}
                </label>
              </FormField>
              <FormField label="Visibilidade"><select value={String(form.ativo)} onChange={e => setForm({...form, ativo: e.target.value === 'true'})} className={inputCls}><option value="true">Público (Ativo)</option><option value="false">Oculto</option></select></FormField>
            </div>
          </div>

          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between border-b pb-2"><h4 className="font-black text-[#00577C]">Quartos Disponíveis</h4><button onClick={addQuarto} className="text-xs font-bold text-[#009640] flex items-center gap-1"><Plus size={14}/> Adicionar Quarto</button></div>
            <div className="space-y-4">
              {quartos.map((item, index) => (
                <div key={index} className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 w-full"><input type="text" value={item.nome} onChange={e => handleQuartoChange(index, 'nome', e.target.value)} placeholder="Ex: Suíte Casal" className={inputCls} /></div>
                    <div className="flex-[2] w-full"><input type="text" value={item.desc} onChange={e => handleQuartoChange(index, 'desc', e.target.value)} placeholder="Breve descrição ou itens" className={inputCls} /></div>
                    <div className="w-full md:w-40"><input type="text" value={item.preco} onChange={e => handleQuartoChange(index, 'preco', e.target.value)} placeholder="R$ / diária" className={inputCls} /></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-500 py-2 rounded-lg cursor-pointer text-xs font-bold hover:border-[#00577C] transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleQuartoChange(index, 'file', e.target.files?.[0] || null)} />
                      <Upload size={14}/> {item.file ? "Foto pronta ✓" : (item.imagem_url ? "Tem foto ✓" : "Anexar Foto do Quarto")}
                    </label>
                    <button onClick={() => removeQuarto(index)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 border border-red-200"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
            <span className="text-sm font-bold text-[#009640]">{feedback}</span>
            <button onClick={handleSalvar} disabled={saving} className="bg-[#009640] text-white px-10 py-4 rounded-xl font-black text-sm shadow-lg flex items-center gap-2">{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar Hotel</button>
          </div>
        </div>
      ) : (
        loading ? (<div className="py-12 flex justify-center"><Loader2 size={32} className="text-[#00577C] animate-spin" /></div>) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hoteis.map((hotel) => (
              <div key={hotel.id} className={`bg-white rounded-[2rem] border border-slate-200 p-4 flex flex-col hover:shadow-xl transition-all ${!hotel.ativo && 'opacity-60 bg-slate-50'}`}>
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 mb-4">
                  <img src={hotel.imagem_url || "/placeholder.png"} alt={hotel.nome} className="object-cover w-full h-full" />
                </div>
                <div className="px-2 pb-2 flex-1 flex flex-col">
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-800 mb-1`}>{hotel.nome}</h3>
                  <p className="text-xs font-medium text-slate-500 line-clamp-1 mb-4">{hotel.endereco}</p>
                  
                  <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center w-full">
                      <button onClick={() => toggleAtivo(hotel.id, hotel.ativo)} className={`text-[10px] font-black uppercase px-2 py-1 rounded-md transition-colors ${hotel.ativo ? 'text-[#009640] bg-green-50 hover:bg-green-100' : 'text-slate-500 bg-slate-200 hover:bg-slate-300'}`}>
                        {hotel.ativo ? "Público ✓" : "Oculto ✕"}
                      </button>
                      <div className="flex gap-3">
                        <button onClick={() => abrirEditar(hotel)} className="text-xs font-bold text-[#00577C] hover:underline">Editar</button>
                        <button onClick={() => handleDelete(hotel.id)} className="text-xs font-bold text-red-500 hover:underline">Remover</button>
                      </div>
                    </div>
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
// GASTRONOMIA
// ═══════════════════════════════════════════════════════════════════════════════

function TabGastronomia() {
  const [restaurantes, setRestaurantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const formVazio = { titulo: "", descricao_curta: "", whatsapp: "", link_google_maps: "", ativo: true };
  const [form, setForm] = useState(formVazio);
  const [editando, setEditando] = useState<any | null>(null);

  const [imagemUrlFile, setImagemUrlFile] = useState<File | null>(null);
  const [imagemCapaFile, setImagemCapaFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  
  // Especialidades (Título + Imagem Upload)
  const [especialidades, setEspecialidades] = useState<any[]>([{ titulo: "", file: null, imagem_url: "" }]);

  useEffect(() => { fetchRestaurantes(); }, []);

  async function fetchRestaurantes() {
    setLoading(true);
    const { data } = await supabase.from('gastronomia').select('*').order('ordem', { ascending: true });
    setRestaurantes(data || []);
    setLoading(false);
  }

  function abrirNovo() {
    setEditando(null); setForm(formVazio); 
    setImagemUrlFile(null); setImagemCapaFile(null); setGaleriaFiles([]); 
    setEspecialidades([{ titulo: "", file: null, imagem_url: "" }]);
    setShowForm(true);
  }

  function abrirEditar(rest: any) {
    setEditando(rest);
    setForm({ titulo: rest.titulo, descricao_curta: rest.descricao_curta || "", whatsapp: rest.whatsapp || "", link_google_maps: rest.link_google_maps || "", ativo: rest.ativo ?? true });
    setImagemUrlFile(null); setImagemCapaFile(null); setGaleriaFiles([]);
    
    let espParsed = [];
    if (typeof rest.especialidades === 'string') { try { espParsed = JSON.parse(rest.especialidades); } catch(e){} } 
    else if (Array.isArray(rest.especialidades)) { espParsed = rest.especialidades; }
    
    setEspecialidades(espParsed.length > 0 ? espParsed.map((e: any) => ({ ...e, file: null })) : [{ titulo: "", file: null, imagem_url: "" }]);
    setShowForm(true);
  }

  const addEsp = () => setEspecialidades([...especialidades, { titulo: "", file: null, imagem_url: "" }]);
  const removeEsp = (index: number) => setEspecialidades(especialidades.filter((_, i) => i !== index));
  const handleEspChange = (index: number, field: string, value: any) => {
    const novos = [...especialidades]; novos[index] = { ...novos[index], [field]: value }; setEspecialidades(novos);
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
    if (!form.titulo) { alert("Nome é obrigatório!"); return; }
    setSaving(true); setFeedback("A enviar imagens...");

    try {
      let imagem_url = editando?.imagem_url || null;
      if (imagemUrlFile) imagem_url = await uploadImagem(imagemUrlFile, 'vitrine');
      
      let imagem_capa = editando?.imagem_capa || null;
      if (imagemCapaFile) imagem_capa = await uploadImagem(imagemCapaFile, 'capas');

      let galeriaFinal = editando?.galeria || [];
      if (galeriaFiles.length > 0) {
        const novasUrls = [];
        for (const file of galeriaFiles) { const url = await uploadImagem(file, 'galeria'); if (url) novasUrls.push(url); }
        galeriaFinal = [...galeriaFinal, ...novasUrls];
      }

      // Upload das fotos de especialidades
      const espLimpos = [];
      for (const esp of especialidades) {
        if (!esp.titulo.trim()) continue;
        let espUrl = esp.imagem_url;
        if (esp.file) {
          const uploadedUrl = await uploadImagem(esp.file, 'especialidades');
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
        especialidades: espLimpos.length > 0 ? espLimpos : null 
      };

      if (editando) await supabase.from('gastronomia').update(payload).eq('id', editando.id);
      else await supabase.from('gastronomia').insert([{ ...payload, ordem: restaurantes.length + 1 }]);

      setFeedback("Salvo com sucesso!");
      setTimeout(() => { setShowForm(false); setFeedback(""); fetchRestaurantes(); }, 2000);
    } catch (err: any) { alert("Erro ao salvar: " + err.message); setFeedback(""); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover da vitrine?")) return;
    await supabase.from('gastronomia').delete().eq('id', id); fetchRestaurantes();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Vitrine Gastronómica</h2><p className="text-xs text-slate-500 mt-1">{restaurantes.length} estabelecimentos</p></div>
        <button onClick={abrirNovo} className="bg-[#00577C] text-white font-black text-sm px-5 py-2.5 rounded-xl flex items-center gap-2"><Plus size={16} /> Novo Restaurante</button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-8 border-b pb-4"><h3 className={`${jakarta.className} text-2xl font-black text-slate-800`}><Utensils className="text-[#F9C400] inline mr-2"/>{editando ? "Editar Restaurante" : "Novo Restaurante"}</h3><button onClick={() => setShowForm(false)} className="text-sm font-bold text-slate-400">Cancelar</button></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Informações Básicas</h4>
              <FormField label="Nome do Estabelecimento *"><input type="text" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} className={inputCls} /></FormField>
              <FormField label="Descrição Curta"><textarea rows={3} value={form.descricao_curta} onChange={e => setForm({...form, descricao_curta: e.target.value})} className={inputCls} /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="WhatsApp"><div className="relative"><Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} className={`${inputCls} pl-10`} /></div></FormField>
                <FormField label="Endereço"><div className="relative"><MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={form.link_google_maps} onChange={e => setForm({...form, link_google_maps: e.target.value})} className={`${inputCls} pl-10`} /></div></FormField>
              </div>
              <FormField label="Visibilidade"><select value={String(form.ativo)} onChange={e => setForm({...form, ativo: e.target.value === 'true'})} className={inputCls}><option value="true">Público (Ativo)</option><option value="false">Oculto</option></select></FormField>
            </div>
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Fotografias</h4>
              <FormField label="Foto da Vitrine (Card principal)">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-4 rounded-xl cursor-pointer hover:border-[#00577C]">
                  <input type="file" accept="image/*" className="hidden" onChange={e => setImagemUrlFile(e.target.files?.[0] || null)} />
                  <ImageIcon size={18} /> {imagemUrlFile ? imagemUrlFile.name : (editando?.imagem_url ? 'Substituir Imagem' : 'Anexar Imagem')}
                </label>
              </FormField>
              <FormField label="Foto de Capa (Página interna)">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-4 rounded-xl cursor-pointer hover:border-[#00577C]">
                  <input type="file" accept="image/*" className="hidden" onChange={e => setImagemCapaFile(e.target.files?.[0] || null)} />
                  <ImageIcon size={18} /> {imagemCapaFile ? imagemCapaFile.name : (editando?.imagem_capa ? 'Substituir Capa' : 'Anexar Capa')}
                </label>
              </FormField>
              <FormField label="Adicionar à Galeria de Fotos">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-4 rounded-xl cursor-pointer hover:border-[#00577C]">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) setGaleriaFiles(Array.from(e.target.files)); }} />
                  <ImageIcon size={18} /> {galeriaFiles.length > 0 ? `${galeriaFiles.length} fotos novas` : 'Anexar Fotos'}
                </label>
              </FormField>
            </div>
          </div>
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between border-b pb-2"><h4 className="font-black text-[#00577C]">Especialidades / Destaques do Cardápio</h4><button onClick={addEsp} className="text-xs font-bold text-[#009640] flex items-center gap-1"><Plus size={14}/> Adicionar Especialidade</button></div>
            <div className="space-y-3">
              {especialidades.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="w-full md:flex-1"><input type="text" value={item.titulo} onChange={e => handleEspChange(index, 'titulo', e.target.value)} placeholder="Ex: Carnes Nobres" className={inputCls} /></div>
                  <div className="w-full md:flex-1 flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-500 py-2 rounded-lg cursor-pointer text-xs font-bold">
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleEspChange(index, 'file', e.target.files?.[0] || null)} />
                      <Upload size={14}/> {item.file ? "Foto pronta ✓" : (item.imagem_url ? "Tem foto ✓" : "Anexar Foto")}
                    </label>
                    <button onClick={() => removeEsp(index)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 border border-red-200"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
            <span className="text-sm font-bold text-[#009640]">{feedback}</span>
            <button onClick={handleSalvar} disabled={saving} className="bg-[#009640] text-white px-10 py-4 rounded-xl font-black text-sm shadow-lg flex items-center gap-2">{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar Restaurante</button>
          </div>
        </div>
      ) : (
        loading ? (<div className="py-12 flex justify-center"><Loader2 size={32} className="text-[#00577C] animate-spin" /></div>) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurantes.map((rest) => (
              <div key={rest.id} className={`bg-white rounded-[2rem] border border-slate-200 p-4 flex flex-col hover:shadow-xl ${!rest.ativo && 'opacity-60'}`}>
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 mb-4"><img src={rest.imagem_url || "/placeholder.png"} alt={rest.titulo} className="object-cover w-full h-full" /></div>
                <div className="px-2 pb-2 flex-1 flex flex-col">
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-800 mb-1`}>{rest.titulo}</h3>
                  <p className="text-xs font-medium text-slate-500 line-clamp-2 mb-4">{rest.descricao_curta}</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100"><button onClick={() => abrirEditar(rest)} className="text-xs font-bold text-[#00577C] hover:underline">Editar</button><button onClick={() => handleDelete(rest.id)} className="text-xs font-bold text-red-500 hover:underline">Remover</button></div>
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
// AGÊNCIAS
// ═══════════════════════════════════════════════════════════════════════════════

function TabAgencias() {
  const [agencias, setAgencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const formVazio = { nome: "", descricao_curta: "", sobre: "", cadastur: "", endereco: "", instagram: "", whatsapp: "", ativo: true };
  const [form, setForm] = useState(formVazio);
  const [editando, setEditando] = useState<any | null>(null);
  
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  
  const [especialidades, setEspecialidades] = useState<any[]>([{ nome: "", file: null, imagem_url: "" }]);

  useEffect(() => { fetchAgencias(); }, []);

  async function fetchAgencias() {
    setLoading(true);
    const { data } = await supabase.from('agencias').select('*').order('nome');
    setAgencias(data || []);
    setLoading(false);
  }

  // NOVA FUNÇÃO: Ativar/Desativar rapidamente com um clique
  async function toggleAtivo(id: string, estadoAtual: boolean) {
    await supabase.from('agencias').update({ ativo: !estadoAtual }).eq('id', id);
    fetchAgencias();
  }

  function abrirNovo() {
    setEditando(null); setForm(formVazio); 
    setCapaFile(null); setLogoFile(null); setGaleriaFiles([]); 
    setEspecialidades([{ nome: "", file: null, imagem_url: "" }]);
    setShowForm(true);
  }

  function abrirEditar(ag: any) {
    setEditando(ag);
    setForm({ nome: ag.nome, descricao_curta: ag.descricao_curta || "", sobre: ag.sobre || "", cadastur: ag.cadastur || "", endereco: ag.endereco || "", instagram: ag.instagram || "", whatsapp: ag.whatsapp || "", ativo: ag.ativo ?? true });
    setCapaFile(null); setLogoFile(null); setGaleriaFiles([]);
    
    let espParsed = [];
    if (typeof ag.especialidades === 'string') { try { espParsed = JSON.parse(ag.especialidades); } catch(e){} } 
    else if (Array.isArray(ag.especialidades)) { espParsed = ag.especialidades; }
    
    setEspecialidades(espParsed.length > 0 ? espParsed.map((e: any) => ({ ...e, file: null })) : [{ nome: "", file: null, imagem_url: "" }]);
    setShowForm(true);
  }

  const addEsp = () => setEspecialidades([...especialidades, { nome: "", file: null, imagem_url: "" }]);
  const removeEsp = (index: number) => setEspecialidades(especialidades.filter((_, i) => i !== index));
  const handleEspChange = (index: number, field: string, value: any) => {
    const novos = [...especialidades]; novos[index] = { ...novos[index], [field]: value }; setEspecialidades(novos);
  };

  async function uploadImagem(file: File, pasta: string): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const path = `${pasta}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from('agencias').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('agencias').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSalvar() {
    if (!form.nome) { alert("Nome da agência é obrigatório."); return; }
    setSaving(true); setFeedback("A processar ficheiros...");

    try {
      let capa_url = editando?.capa_url || null;
      if (capaFile) capa_url = await uploadImagem(capaFile, 'capas');
      
      let logo_url = editando?.logo_url || null;
      if (logoFile) logo_url = await uploadImagem(logoFile, 'logos');

      let galeriaFinal = editando?.galeria || [];
      if (galeriaFiles.length > 0) {
        const novasUrls = [];
        for (const file of galeriaFiles) { const url = await uploadImagem(file, 'fotos'); if (url) novasUrls.push(url); }
        galeriaFinal = [...galeriaFinal, ...novasUrls];
      }

      const espLimpos = [];
      for (const esp of especialidades) {
        if (!esp.nome.trim()) continue;
        let espUrl = esp.imagem_url;
        if (esp.file) {
          const uploadedUrl = await uploadImagem(esp.file, 'especialidades');
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
        especialidades: espLimpos.length > 0 ? espLimpos : null
      };

      if (editando) await supabase.from('agencias').update(payload).eq('id', editando.id);
      else await supabase.from('agencias').insert([payload]);

      setFeedback("Agência salva com sucesso!");
      setTimeout(() => { setShowForm(false); setFeedback(""); fetchAgencias(); }, 2000);
    } catch (err: any) { alert("Erro ao salvar: " + err.message); setFeedback(""); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta agência permanentemente?")) return;
    await supabase.from('agencias').delete().eq('id', id); fetchAgencias();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Diretório de Agências</h2><p className="text-xs text-slate-500 mt-1">{agencias.length} agências registadas</p></div>
        <button onClick={abrirNovo} className="bg-[#00577C] text-white font-black text-sm px-5 py-2.5 rounded-xl flex items-center gap-2"><Plus size={16} /> Nova Agência</button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-8 border-b pb-4"><h3 className={`${jakarta.className} text-2xl font-black text-slate-800`}><Briefcase className="text-[#F9C400] inline mr-2"/>{editando ? "Editar Agência" : "Nova Agência Oficial"}</h3><button onClick={() => setShowForm(false)} className="text-sm font-bold text-slate-400">Cancelar</button></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Informações da Empresa</h4>
              <FormField label="Nome da Agência *"><input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className={inputCls} /></FormField>
              <FormField label="Cadastur (Registo)"><input type="text" value={form.cadastur} onChange={e => setForm({...form, cadastur: e.target.value})} className={inputCls} placeholder="XX.XXXXXX.XX-X" /></FormField>
              <FormField label="Resumo (Aparece no Cartão)"><textarea rows={2} value={form.descricao_curta} onChange={e => setForm({...form, descricao_curta: e.target.value})} className={inputCls} /></FormField>
              <FormField label="História / Sobre a Agência"><textarea rows={5} value={form.sobre} onChange={e => setForm({...form, sobre: e.target.value})} className={inputCls} /></FormField>
            </div>
            
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Contatos e Identidade Visual</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="WhatsApp"><div className="relative"><Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} className={`${inputCls} pl-10`} /></div></FormField>
                <FormField label="Instagram"><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">@</span><input type="text" value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} className={`${inputCls} pl-9`} /></div></FormField>
              </div>
              <FormField label="Endereço Físico"><input type="text" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} className={inputCls} /></FormField>
              <FormField label="Visibilidade"><select value={String(form.ativo)} onChange={e => setForm({...form, ativo: e.target.value === 'true'})} className={inputCls}><option value="true">Público (Ativo)</option><option value="false">Oculto</option></select></FormField>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Logotipo">
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 p-4 rounded-xl cursor-pointer hover:border-[#00577C] text-slate-500 text-xs text-center">
                    <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                    {logoFile ? "Pronta ✓" : (editando?.logo_url ? "Substituir" : "Anexar Logo")}
                  </label>
                </FormField>
                <FormField label="Capa do Perfil">
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 p-4 rounded-xl cursor-pointer hover:border-[#00577C] text-slate-500 text-xs text-center">
                    <input type="file" accept="image/*" className="hidden" onChange={e => setCapaFile(e.target.files?.[0] || null)} />
                    {capaFile ? "Pronta ✓" : (editando?.capa_url ? "Substituir" : "Anexar Capa")}
                  </label>
                </FormField>
              </div>
              
              <FormField label="Adicionar Fotos à Galeria">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 p-4 rounded-xl cursor-pointer hover:border-[#00577C] text-slate-500 text-xs text-center">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) setGaleriaFiles(Array.from(e.target.files)); }} />
                  {galeriaFiles.length > 0 ? `${galeriaFiles.length} imagens novas` : 'Selecionar Fotos'}
                </label>
              </FormField>
            </div>
          </div>

          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between border-b pb-2"><h4 className="font-black text-[#00577C]">Especialidades da Agência</h4><button onClick={addEsp} className="text-xs font-bold text-[#009640] flex items-center gap-1"><Plus size={14}/> Adicionar Especialidade</button></div>
            <div className="space-y-3">
              {especialidades.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="w-full md:flex-1"><input type="text" value={item.nome} onChange={e => handleEspChange(index, 'nome', e.target.value)} placeholder="Nome (Ex: Trilhas)" className={inputCls} /></div>
                  <div className="w-full md:flex-1 flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-500 py-2 rounded-lg cursor-pointer text-xs font-bold">
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleEspChange(index, 'file', e.target.files?.[0] || null)} />
                      <Upload size={14}/> {item.file ? "Foto pronta ✓" : (item.imagem_url ? "Tem foto ✓" : "Anexar Foto")}
                    </label>
                    <button onClick={() => removeEsp(index)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 border border-red-200"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
            <span className="text-sm font-bold text-[#009640]">{feedback}</span>
            <button onClick={handleSalvar} disabled={saving} className="bg-[#009640] text-white px-10 py-4 rounded-xl font-black text-sm shadow-lg flex items-center gap-2">{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar Agência</button>
          </div>
        </div>
      ) : (
        loading ? (<div className="py-12 flex justify-center"><Loader2 size={32} className="text-[#00577C] animate-spin" /></div>) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {agencias.map((ag) => (
              <div key={ag.id} className={`bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col hover:shadow-xl text-center ${!ag.ativo && 'opacity-60 bg-slate-50'}`}>
                <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border-4 border-slate-100 shadow-sm flex items-center justify-center bg-slate-50">
                  {ag.logo_url ? <img src={ag.logo_url} className="object-cover w-full h-full" /> : <Briefcase className="text-slate-300"/>}
                </div>
                <div className="pt-4 flex-1 flex flex-col">
                  <h3 className={`${jakarta.className} text-lg font-black text-slate-800 mb-1`}>{ag.nome}</h3>
                  <p className="text-xs font-medium text-slate-500 line-clamp-1 mb-4">{ag.cadastur ? `Cadastur: ${ag.cadastur}` : 'Turismo Legal'}</p>
                  
                  {/* BOTÕES DE AÇÃO COM O TOGGLE ATIVO/INATIVO */}
                  <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center w-full">
                      <button onClick={() => toggleAtivo(ag.id, ag.ativo)} className={`text-[10px] font-black uppercase px-2 py-1 rounded-md transition-colors ${ag.ativo ? 'text-[#009640] bg-green-50 hover:bg-green-100' : 'text-slate-500 bg-slate-200 hover:bg-slate-300'}`}>
                        {ag.ativo ? "Público ✓" : "Oculto ✕"}
                      </button>
                      <div className="flex gap-3">
                        <button onClick={() => abrirEditar(ag)} className="text-xs font-bold text-[#00577C] hover:underline">Editar</button>
                        <button onClick={() => handleDelete(ag.id)} className="text-xs font-bold text-red-500 hover:underline">Remover</button>
                      </div>
                    </div>
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

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICAÇÕES PUSH (APP)
// ═══════════════════════════════════════════════════════════════════════════════

function TabNotificacoes() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    fetchTokens();
  }, []);

  async function fetchTokens() {
    setLoading(true);
    const { data } = await supabase.from("push_tokens").select("*").order("criado_em", { ascending: false });
    if (data) setTokens(data);
    setLoading(false);
  }

  async function handleDisparar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo || !mensagem) {
      alert("Preencha o título e a mensagem da notificação.");
      return;
    }
    if (tokens.length === 0) {
      alert("Nenhum telemóvel registado na base de dados para receber notificações.");
      return;
    }
    if (!confirm(`Deseja disparar esta notificação para ${tokens.length} telemóveis?`)) return;

    setEnviando(true);
    setFeedback("A comunicar com os servidores da Expo...");

    // Cria as mensagens no formato exigido pela Expo
    const mensagensPush = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title: titulo,
      body: mensagem,
      data: { portal: true }, // Dados extra (pode ser usado no futuro para abrir o blog ao clicar)
    }));

    // A Expo recomenda enviar em lotes de 100 no máximo. Vamos dividir!
    const chunks = [];
    for (let i = 0; i < mensagensPush.length; i += 100) {
      chunks.push(mensagensPush.slice(i, i + 100));
    }

    try {
      for (const chunk of chunks) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });
      }
      setFeedback(`Sucesso! Notificação enviada para ${tokens.length} dispositivos.`);
      setTitulo(""); setMensagem("");
    } catch (err) {
      console.error(err);
      setFeedback("Erro ao tentar contactar os servidores de envio.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Notificações Push (App)</h2>
          <p className="text-xs text-slate-500 mt-1">Acorde os telemóveis dos turistas e moradores com alertas em tempo real.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULÁRIO DE DISPARO */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
          <h3 className={`${jakarta.className} text-lg font-black text-slate-800 mb-6 flex items-center gap-2`}>
            <Smartphone size={18} className="text-[#F9C400]" /> Nova Notificação
          </h3>

          <form onSubmit={handleDisparar} className="space-y-5">
            <FormField label="Título do Alerta (Obrigatório) *">
              <input value={titulo} onChange={e => setTitulo(e.target.value)} className={inputCls} placeholder="Ex: 🌿 Novo artigo no Blog!" required maxLength={50} />
            </FormField>

            <FormField label="Mensagem / Subtítulo (Obrigatório) *">
              <textarea 
                rows={3} 
                value={mensagem} 
                onChange={e => setMensagem(e.target.value)} 
                className={inputCls} 
                placeholder="Ex: Descubra as maravilhas arqueológicas da Serra das Andorinhas. Leia já." 
                required 
                maxLength={150}
              />
            </FormField>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-[#009640]">{feedback}</span>
              <button type="submit" disabled={enviando || tokens.length === 0} className="bg-[#00577C] hover:bg-[#004a6b] text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md flex items-center gap-2 disabled:opacity-50 transition-all">
                {enviando ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />} 
                {tokens.length === 0 ? "Sem utilizadores" : `Disparar Alerta (${tokens.length})`}
              </button>
            </div>
          </form>
        </div>

        {/* ESTATÍSTICAS DOS TOKENS */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col h-fit">
          <h4 className={`${jakarta.className} text-sm font-black text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100`}>
            Instalações da App
          </h4>
          
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-[#00577C]" size={24} /></div>
          ) : (
            <div className="text-center py-6">
              <Smartphone size={48} className="mx-auto text-slate-200 mb-3" />
              <span className={`${jakarta.className} text-4xl font-black text-slate-800`}>{tokens.length}</span>
              <p className="text-xs text-slate-400 mt-2 font-medium">Telemóveis com permissão<br/>para receber notificações.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}