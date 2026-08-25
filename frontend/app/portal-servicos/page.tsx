"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { 
  Calendar as CalendarIcon, Bell, CheckCircle2, Clock, Map, Package, Activity, AlertCircle,
  Upload, Image as ImageIcon, Save, Loader2, FileSpreadsheet, Utensils, MapPin, Phone, Plus, Trash2,
  Building2, Briefcase, Compass, Newspaper, Smartphone, FileText, Users, ChevronDown
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
  ordem: number | null; ativo: boolean;
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

  return <AdminDashboard role={role} email={email} onLogout={() => { supabase.auth.signOut(); setRole(null); setEmail(""); setSenha(""); }} />;
}

// ─── Dashboard Base ──────────────────────────────────────────────────────────

function AdminDashboard({ role, email, onLogout }: { role: string; email: string; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const menuGroups = [
    {
      label: "Painel & Conteúdo",
      items: [
        { id: "dashboard",   label: "Painel Geral", icon: <Activity size={16} /> },
        { id: "blog",        label: "Blog/Notícias",icon: <Newspaper size={16} /> },
        { id: "eventos",     label: "Eventos",      icon: <CalendarIcon size={16} /> },
      ]
    },
    {
      label: "Turismo & Trade",
      items: [
        { id: "atracoes",    label: "Atrativos",    icon: <MapPin size={16} /> },
        { id: "comunidades", label: "Comunidades",  icon: <Compass size={16} /> },
        { id: "hoteis",      label: "Hotéis",       icon: <Building2 size={16} /> },
        { id: "gastronomia", label: "Gastronomia",  icon: <Utensils size={16} /> },
        { id: "agencias",    label: "Agências",     icon: <Briefcase size={16} /> },
      ]
    },
    {
      label: "Cidadão & Serviços",
      items: [
        { id: "aplicativo",  label: "Aplicativo",   icon: <Smartphone size={16} /> },
        { id: "newsletter",  label: "Newsletter",   icon: <Bell size={16} /> }, 
        { id: "reunioes",    label: "Reuniões COMTUR", icon: <FileText size={16} /> },
      ]
    }
  ];

  // ◄── TRAVA DE SEGURANÇA: Aba Restrita agora com Base de Residentes ──►
  if (email === "emmanoel.cardoso09@gmail.com" || email === "planejamentosaga@gmail.com") {
    menuGroups.push({
      label: "Admin Restrito",
      items: [
        { id: "emissao", label: "Emissão de Carteira", icon: <AlertCircle size={16} /> },
        { id: "residentes", label: "Base de Residentes", icon: <Users size={16} /> } // ◄── Nova Aba Adicionada
      ]
    });
  }

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-800`}>
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-28 h-8"><Image src="/logop.png" alt="Logo" fill className="object-contain object-left" priority /></div>
            <span className="hidden sm:block text-xs font-bold text-slate-500 border-l border-slate-200 pl-3 uppercase tracking-wider">Painel Administrativo</span>
          </div>
          <button onClick={onLogout} className="text-xs text-slate-500 hover:text-[#00577C] transition flex items-center gap-1.5 font-bold uppercase tracking-widest">Sair</button>
        </div>
        
        {/* SUB-HEADER: BARRA DE NAVEGAÇÃO AGRUPADA COM DROPDOWNS */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-2 py-2">
            {menuGroups.map((grupo, idx) => {
              const isActiveGroup = grupo.items.some(item => item.id === activeTab);
              return (
                <div key={idx} className="relative group">
                  <button className={`flex items-center gap-2 px-4 py-2 text-sm font-black rounded-xl transition-colors ${isActiveGroup ? 'bg-[#00577C]/10 text-[#00577C]' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'}`}>
                    {grupo.label} <ChevronDown size={14} className={`transition-transform group-hover:rotate-180 ${isActiveGroup ? 'text-[#00577C]' : 'text-slate-400'}`} />
                  </button>
                  
                  {/* Caixa do Dropdown */}
                  <div className="absolute left-0 top-full pt-2 hidden group-hover:flex flex-col w-56">
                    <div className="bg-white border border-slate-100 shadow-xl rounded-2xl p-2 flex flex-col gap-1">
                      {grupo.items.map(tab => (
                        <button 
                          key={tab.id} 
                          onClick={() => setActiveTab(tab.id)} 
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl w-full text-left transition-colors ${activeTab === tab.id ? 'bg-[#00577C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-[#00577C]'}`}
                        >
                          {tab.icon} {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* RENDERIZAÇÃO DAS ABAS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "dashboard"   && <TabDashboard />}
        {activeTab === "blog"        && <TabBlog />}
        {activeTab === "eventos"     && <TabEventos />}
        {activeTab === "atracoes"    && <TabAtracoes />}
        {activeTab === "comunidades" && <TabComunidades />}
        {activeTab === "gastronomia" && <TabGastronomia />}
        {activeTab === "hoteis"      && <TabHoteis />} 
        {activeTab === "agencias"    && <TabAgencias />}
        {activeTab === "reunioes"    && <TabReunioesComtur />}
        {activeTab === "newsletter"  && <TabNewsletter />}
        {activeTab === "aplicativo"  && <TabAplicativo />}
        {activeTab === "emissao"     && <TabEmissaoManual />}
        {activeTab === "residentes"  && <TabResidentes />} 
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
// EVENTOS - GESTÃO COMPLETA (EM LOTE E MANUAL/EDIÇÃO)
// ═══════════════════════════════════════════════════════════════════════════════

function TabEventos() {
  const [fase, setFase] = useState<'inicio' | 'preview' | 'salvando' | 'sucesso' | 'manual'>('inicio');
  const [eventosList, setEventosList] = useState<Evento[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  
  // ── ESTADOS DO CSV ──
  const [eventosPreview, setEventosPreview] = useState<any[]>([]);
  const [imagensMap, setImagensMap] = useState<{ [key: number]: File }>({});
  const [feedback, setFeedback] = useState("");

  // ── ESTADOS DO MANUAL & EDIÇÃO ──
  const [editando, setEditando] = useState<Evento | null>(null); // ◄── Novo estado para Edição
  const [formManual, setFormManual] = useState<any>({ destaque: false, categoria: 'Cultura' });
  const [imagemManual, setImagemManual] = useState<File | null>(null);
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    fetchEventos();
  }, []);

  async function fetchEventos() {
    setLoadingList(true);
    const hoje = new Date().toISOString().split('T')[0];

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
    setFeedback("A iniciar a sincronização com a base de dados...");
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

  // ── 3. ENVIO MANUAL & EDIÇÃO ──
  const abrirFormManual = () => {
    setEditando(null);
    setFormManual({ destaque: false, categoria: 'Cultura' });
    setImagemManual(null);
    setFeedback("");
    setFase('manual');
  };

  // ◄── Nova Função: Carrega os dados do evento antigo para o formulário
  const abrirFormEditar = (ev: Evento) => {
    setEditando(ev);
    setFormManual({
      titulo: ev.titulo || "",
      subtitulo: ev.subtitulo || "",
      descricao: ev.descricao || "",
      data: ev.data || "",
      horario: ev.horario || "",
      duracao: ev.duracao || "",
      local: ev.local || "",
      categoria: ev.categoria || "Cultura",
      preco: ev.preco || "",
      classificacao: ev.classificacao || "",
      link_bilheteira: ev.link_bilheteira || "",
      destaque: ev.destaque || false,
      imagem_url: ev.imagem_url || "" 
    });
    setImagemManual(null);
    setFeedback("");
    setFase('manual');
  };

  const handleSalvarManual = async () => {
    if (!formManual.titulo || !formManual.data || !formManual.local) {
      alert("Título, Data e Local são obrigatórios.");
      return;
    }
    setSavingManual(true);
    setFeedback("A guardar evento...");

    try {
      let imagem_url = formManual.imagem_url; // Mantém a imagem antiga se existir
      
      if (imagemManual) {
        const ext = imagemManual.name.split('.').pop();
        const nomeFicheiro = `evento_manual_${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('eventos').upload(nomeFicheiro, imagemManual);
        if (!uploadErr) {
          const { data: pubUrl } = supabase.storage.from('eventos').getPublicUrl(nomeFicheiro);
          imagem_url = pubUrl.publicUrl;
        } else {
          throw new Error("Erro ao fazer upload do cartaz.");
        }
      }

      const payload = {
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
      };

      let erroBd;

      // ◄── Lógica Inteligente (Insert vs Update) com bloqueio de Erro
      if (editando) {
        const { error } = await supabase.from('eventos').update(payload).eq('id', editando.id);
        erroBd = error;
      } else {
        const { error } = await supabase.from('eventos').insert([payload]);
        erroBd = error;
      }

      if (erroBd) throw new Error(erroBd.message);

      setFeedback(editando ? "✅ Evento atualizado com sucesso!" : "✅ Evento publicado com sucesso!");
      setFase('sucesso');
      
    } catch (err: any) {
      setFeedback(`❌ Erro: ${err.message}`);
    } finally {
      setSavingManual(false);
    }
  };

  const resetar = () => { 
    setFase('inicio'); 
    setEventosPreview([]); 
    setImagensMap({}); 
    setFeedback(""); 
    setEditando(null); 
    fetchEventos(); 
  };

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
                        <td className="px-4 py-3 text-right space-x-3">
                          {/* ◄── Botão Editar Novo ──► */}
                          <button onClick={() => abrirFormEditar(ev)} className="text-xs font-bold text-[#00577C] hover:underline">Editar</button>
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

      {/* TELA 2: FORMULÁRIO MANUAL & EDIÇÃO */}
      {fase === 'manual' && (
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 flex items-center gap-2`}>
              <CalendarIcon className="text-[#F9C400]" /> 
              {editando ? "Editar Evento" : "Construtor de Evento"}
            </h3>
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
                  <ImageIcon size={18} /> {imagemManual ? imagemManual.name : formManual.imagem_url ? "Substituir Cartaz Atual" : "Clique para anexar Cartaz"}
                </label>
                {/* ◄── Mostra a miniatura do cartaz antigo em caso de edição */}
                {formManual.imagem_url && !imagemManual && (
                  <img src={formManual.imagem_url} alt="Cartaz Atual" className="mt-3 h-24 w-auto object-cover rounded-xl border border-slate-200 shadow-sm" />
                )}
              </FormField>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
            {/* O Feedback agora vai ficar vermelho em caso de erro! */}
            <span className={`text-sm font-bold ${feedback.includes('❌') ? 'text-red-500' : 'text-[#009640]'}`}>{feedback}</span>
            <button onClick={handleSalvarManual} disabled={savingManual} className="bg-[#009640] hover:bg-green-700 text-white px-10 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all">
              {savingManual ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {editando ? "Guardar Edição" : "Publicar Evento"}
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
// HOTÉIS & POUSADAS (VITRINE SIMPLIFICADA)
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

  useEffect(() => { fetchHoteis(); }, []);

  async function fetchHoteis() {
    setLoading(true);
    const { data, error } = await supabase.from('hoteis').select('*').order('nome');
    setHoteis(data || []);
    setLoading(false);
  }

  function abrirNovo() {
    setEditando(null); 
    setForm(formVazio); 
    setImagemFile(null); 
    setGaleriaFiles([]); 
    setShowForm(true);
  }

  function abrirEditar(hotel: any) {
    setEditando(hotel);
    setForm({ 
      nome: hotel.nome, tipo: hotel.tipo, descricao: hotel.descricao || "", 
      estrelas: hotel.estrelas || 3, 
      whatsapp: hotel.whatsapp || "", // ◄── Agora lê diretamente da coluna 'whatsapp'
      endereco: hotel.endereco || "", instagram: hotel.instagram || "", 
      ativo: hotel.ativo ?? true 
    });
    setImagemFile(null); 
    setGaleriaFiles([]);
    setShowForm(true);
  }

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
    setSaving(true); setFeedback("A guardar alojamento...");

    try {
      let imagem_url = editando?.imagem_url || null;
      if (imagemFile) imagem_url = await uploadImagem(imagemFile, 'capas');

      let galeriaFinal = editando?.galeria || [];
      if (galeriaFiles.length > 0) {
        const novasUrls = [];
        for (const file of galeriaFiles) { const url = await uploadImagem(file, 'galeria'); if (url) novasUrls.push(url); }
        galeriaFinal = [...galeriaFinal, ...novasUrls];
      }

      // ◄── Payload limpo: mapeado para a coluna 'whatsapp' no banco
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
        galeria: galeriaFinal.length > 0 ? galeriaFinal : null
      };

      let erroBd;

      // ◄── TRAVA DE ERROS ATIVADA: Agora o código apanha qualquer rejeição da Base de Dados
      if (editando) {
        const { error } = await supabase.from('hoteis').update(payloadHotel).eq('id', editando.id);
        erroBd = error;
      } else {
        const { error } = await supabase.from('hoteis').insert([payloadHotel]);
        erroBd = error;
      }

      // Se a base de dados rejeitar, lança o erro real para o ecrã
      if (erroBd) throw new Error(erroBd.message);

      setFeedback(editando ? "✅ Hotel atualizado com sucesso!" : "✅ Hotel publicado com sucesso!");
      setTimeout(() => { setShowForm(false); setFeedback(""); fetchHoteis(); }, 2000);

    } catch (err: any) { 
      setFeedback(`❌ Erro: ${err.message}`); 
    } finally { 
      setSaving(false); 
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover permanentemente este alojamento?")) return;
    await supabase.from('hoteis').delete().eq('id', id); 
    fetchHoteis();
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
              <FormField label="Adicionar Fotos à Galeria (Opcional)">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 p-4 rounded-xl cursor-pointer hover:border-[#00577C] text-slate-500">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) setGaleriaFiles(Array.from(e.target.files)); }} />
                  <ImageIcon size={18} /> {galeriaFiles.length > 0 ? `${galeriaFiles.length} ficheiros novos` : 'Anexar Fotos extras'}
                </label>
              </FormField>
              <FormField label="Visibilidade"><select value={String(form.ativo)} onChange={e => setForm({...form, ativo: e.target.value === 'true'})} className={inputCls}><option value="true">Público (Ativo)</option><option value="false">Oculto</option></select></FormField>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
            {/* ◄── Feedback dinâmico: Fica vermelho em caso de erro ──► */}
            <span className={`text-sm font-bold ${feedback.includes('❌') ? 'text-red-500' : 'text-[#009640]'}`}>{feedback}</span>
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
// APLICATIVO
// ═══════════════════════════════════════════════════════════════════════════════

function TabAplicativo() {
  // Estados para as Notificações Push
  const [tokens, setTokens] = useState<any[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [feedbackPush, setFeedbackPush] = useState("");
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Estados para o Upload de Materiais
  const [tituloPdf, setTituloPdf] = useState("");
  const [descricaoPdf, setDescricaoPdf] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedbackPdf, setFeedbackPdf] = useState("");

  useEffect(() => {
    fetchTokens();
  }, []);

  async function fetchTokens() {
    setLoadingTokens(true);
    const { data } = await supabase.from("push_tokens").select("*").order("criado_em", { ascending: false });
    if (data) setTokens(data);
    setLoadingTokens(false);
  }

  async function handleDisparar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo || !mensagem) {
      alert("Preencha o título e a mensagem da notificação.");
      return;
    }
    if (tokens.length === 0) {
      alert("Nenhum telefone registrado na base de dados.");
      return;
    }
    if (!confirm(`Deseja disparar esta notificação para ${tokens.length} telefones?`)) return;

    setEnviando(true);
    setFeedbackPush("A comunicar com os servidores...");

    const mensagensPush = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title: titulo,
      body: mensagem,
      data: { portal: true },
    }));

    try {
      const response = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagens: mensagensPush })
      });

      if (!response.ok) throw new Error("Falha na API");

      setFeedbackPush(`Sucesso! Enviado para ${tokens.length} dispositivos.`);
      setTitulo(""); setMensagem("");
    } catch (err) {
      console.error(err);
      setFeedbackPush("Erro ao enviar notificação.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleUploadPdf(e: React.FormEvent) {
    e.preventDefault();
    if (!tituloPdf || !arquivo) {
      alert("Título e ficheiro PDF são obrigatórios!");
      return;
    }

    setUploading(true);
    setFeedbackPdf("A carregar ficheiro...");

    try {
      const fileExt = arquivo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `pdf/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('guias')
        .upload(filePath, arquivo);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('guias')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('guias_turisticos')
        .insert([{
          titulo: tituloPdf,
          descricao: descricaoPdf,
          arquivo_url: publicUrlData.publicUrl,
          categoria: 'Guia Digital'
        }]);

      if (dbError) throw dbError;

      setFeedbackPdf("✅ PDF publicado com sucesso!");
      setTituloPdf(""); setDescricaoPdf(""); setArquivo(null);
    } catch (err) {
      console.error(err);
      setFeedbackPdf("❌ Erro ao enviar o PDF.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER - mesmo padrão da TabAtracoes */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Gestão do Aplicativo</h2>
          <p className="text-xs text-slate-500 mt-1">Envie alertas em tempo real e disponibilize guias digitais para os utilizadores.</p>
        </div>
        <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-600">
          {tokens.length} dispositivos registados
        </span>
      </div>

      {/* SECÇÃO 1: NOTIFICAÇÕES PUSH - mesma estrutura da TabAtracoes */}
      <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
          <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 flex items-center gap-2`}>
            <Bell size={22} className="text-[#F9C400]" /> Notificações Push
          </h3>
        </div>

        <form onSubmit={handleDisparar} className="space-y-5">
          <FormField label="Título do Alerta *">
            <input 
              value={titulo} 
              onChange={e => setTitulo(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
              placeholder="Ex: 🌿 Novo artigo no Blog!" 
              required 
              maxLength={50} 
            />
          </FormField>

          <FormField label="Mensagem *">
            <textarea 
              rows={4} 
              value={mensagem} 
              onChange={e => setMensagem(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
              placeholder="Ex: Descubra as novidades..." 
              required 
              maxLength={150} 
            />
          </FormField>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-[#009640]">{feedbackPush}</span>
            <button 
              type="submit" 
              disabled={enviando || tokens.length === 0} 
              className="bg-[#00577C] hover:bg-[#004a6b] text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {enviando ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> A enviar...
                </>
              ) : (
                "Disparar Alerta"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECÇÃO 2: MATERIAIS E GUIAS DIGITAIS - mesmo padrão */}
      <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
          <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 flex items-center gap-2`}>
            <FileText size={22} className="text-[#00577C]" /> Disponibilizar Guias e Panfletos (PDF)
          </h3>
        </div>

        <form onSubmit={handleUploadPdf} className="space-y-5">
          <FormField label="Título do Material *">
            <input 
              value={tituloPdf} 
              onChange={e => setTituloPdf(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
              placeholder="Ex: Guia Turístico Oficial 2026" 
              required 
            />
          </FormField>

          <FormField label="Breve Descrição">
            <textarea 
              rows={3} 
              value={descricaoPdf} 
              onChange={e => setDescricaoPdf(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
              placeholder="Ex: Mapa completo com trilhas e pontos de apoio..." 
            />
          </FormField>

          <FormField label="Ficheiro PDF *">
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-6 rounded-xl cursor-pointer hover:border-[#00577C] transition-colors">
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={e => setArquivo(e.target.files?.[0] || null)} 
                required 
              />
              <FileText size={18} /> {arquivo ? arquivo.name : "Clique para anexar o PDF"}
            </label>
          </FormField>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-[#009640]">{feedbackPdf}</span>
            <button 
              type="submit" 
              disabled={uploading} 
              className="bg-[#009640] hover:bg-green-700 text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> A enviar...
                </>
              ) : (
                "Publicar PDF"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATRAÇÕES (Atualizado com Ordem e Galeria)
// ═══════════════════════════════════════════════════════════════════════════════

function TabAtracoes() {
  const [atracoes, setAtracoes] = useState<Atracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Atracao | null>(null);
  const [form, setForm] = useState<any>({});
  
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => { fetchAtracoes(); }, []);

  async function fetchAtracoes() {
    setLoading(true);
    const { data } = await supabase.from("atracoes").select("*").order("ordem", { ascending: true, nullsFirst: false });
    setAtracoes(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null); 
    setForm({ nome: "", tipo: "", descricao: "", imagem_url: "", preco_entrada: 0, whatsapp: "", link_google_maps: "", ordem: 0, ativo: true });
    setImagemFile(null); 
    setGaleriaFiles([]);
    setShowForm(true);
  }

  function abrirFormEditar(a: Atracao) {
    setEditando(a); 
    setForm({ ...a, ordem: a.ordem || 0 }); 
    setImagemFile(null); 
    setGaleriaFiles([]);
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

    let galeriaFinal = editando?.galeria || [];
    if (galeriaFiles.length > 0) {
      const novasUrls = [];
      for (const file of galeriaFiles) {
        const ext = file.name.split(".").pop();
        const path = `atracoes/galeria_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { error } = await supabase.storage.from("galeria").upload(path, file);
        if (!error) {
          const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
          novasUrls.push(pub.publicUrl);
        }
      }
      galeriaFinal = [...galeriaFinal, ...novasUrls];
    }
    
    const payload = { ...form, imagem_url, galeria: galeriaFinal.length > 0 ? galeriaFinal : null };
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
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Ordem de Exibição">
                  <input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) })} className={inputCls} placeholder="Ex: 1, 2, 3..." />
                </FormField>
                <FormField label="Visibilidade">
                  <select value={String(form.ativo)} onChange={(e) => setForm({ ...form, ativo: e.target.value === 'true' })} className={inputCls}>
                    <option value="true">Ativo / Público</option>
                    <option value="false">Oculto</option>
                  </select>
                </FormField>
              </div>
              <FormField label="Descrição Detalhada"><textarea value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={5} className={inputCls} placeholder="Descreva os encantos desta atração..." /></FormField>
            </div>
            
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Localização e Mídia</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="WhatsApp de Contato"><div className="relative"><Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={`${inputCls} pl-10`} placeholder="94 90000-0000" /></div></FormField>
                <FormField label="Link Google Maps"><div className="relative"><MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={form.link_google_maps || ""} onChange={(e) => setForm({ ...form, link_google_maps: e.target.value })} className={`${inputCls} pl-10`} placeholder="https://maps..." /></div></FormField>
              </div>
              <FormField label="Fotografia de Capa (Principal)">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-4 rounded-xl cursor-pointer hover:border-[#00577C] transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImagemFile(e.target.files?.[0] || null)} />
                  <ImageIcon size={18} /> {imagemFile ? imagemFile.name : form.imagem_url ? "Trocar Capa Atual" : "Anexar Capa"}
                </label>
                {form.imagem_url && !imagemFile && <img src={form.imagem_url} alt="Capa atual" className="mt-3 h-24 w-full object-cover rounded-xl border border-slate-200" />}
              </FormField>
              <FormField label="Adicionar Imagens à Galeria">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-4 rounded-xl cursor-pointer hover:border-[#00577C] transition-colors">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if(e.target.files) setGaleriaFiles(Array.from(e.target.files)); }} />
                  <ImageIcon size={18} /> {galeriaFiles.length > 0 ? `${galeriaFiles.length} ficheiros novos` : "Selecionar Múltiplas Fotos"}
                </label>
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
              <div key={a.id} className="bg-white rounded-[2rem] border border-slate-200 p-4 flex flex-col hover:shadow-xl transition-shadow relative">
                <div className="absolute -top-3 -left-3 bg-[#00577C] text-white w-8 h-8 flex items-center justify-center rounded-full font-black text-xs z-10 shadow-sm border-2 border-white">
                  {a.ordem || 0}
                </div>
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 mb-4">
                  <img src={a.imagem_url || "/placeholder.png"} alt={a.nome} className="object-cover w-full h-full" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-black text-[#00577C] shadow-sm uppercase">{a.tipo}</div>
                </div>
                <div className="px-2 pb-2 flex-1 flex flex-col">
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-800 mb-1`}>{a.nome}</h3>
                  <p className="text-xs font-bold text-[#009640] mb-3">R$ {(Number(a.preco_entrada) || 0).toFixed(2)}</p>
                  
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
// COMUNIDADES (NOVO - Uni as tabelas comunidades e comunidade_pontos)
// ═══════════════════════════════════════════════════════════════════════════════

function TabComunidades() {
  const [comunidades, setComunidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]); 
  const [pontos, setPontos] = useState<any[]>([]); 

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => { fetchComunidades(); }, []);

  async function fetchComunidades() {
    setLoading(true);
    const { data } = await supabase.from("comunidades").select("*").order("ordem", { ascending: true, nullsFirst: false });
    setComunidades(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null); 
    setForm({ titulo: "", descricao_curta: "", historia_texto: "", cultura_texto: "", ordem: 0, ativo: true });
    setImagemFile(null); 
    setGaleriaFiles([]);
    setPontos([]);
    setShowForm(true);
  }

  async function abrirFormEditar(c: any) {
    setEditando(c); 
    setForm({ ...c }); 
    setImagemFile(null); 
    setGaleriaFiles([]);
    
    const { data: ptData } = await supabase.from("comunidade_pontos").select("*").eq("comunidade_id", c.id).order("titulo");
    setPontos(ptData || []);
    setShowForm(true);
  }

  const addPonto = () => setPontos([...pontos, { id: null, titulo: "", tipo: "atração", link_destino: "", whatsapp: "", imagem_url: "", file: null }]);
  const removePonto = (index: number) => {
    const novos = [...pontos];
    if (novos[index].id) { novos[index]._deleted = true; } 
    else { novos.splice(index, 1); }
    setPontos(novos);
  };
  const handlePontoChange = (index: number, field: string, value: any) => {
    const novos = [...pontos]; novos[index] = { ...novos[index], [field]: value }; setPontos(novos);
  };

  async function handleSave() {
    if (!form.titulo) { setFeedback("Título obrigatório."); return; }
    setSaving(true); setFeedback("A processar...");
    
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
        const path = `galeria/com_gal_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { error } = await supabase.storage.from("galeria").upload(path, file);
        if (!error) {
          const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
          novasUrls.push(pub.publicUrl);
        }
      }
      galeriaFinal = [...galeriaFinal, ...novasUrls];
    }
    
    const payload = { 
      titulo: form.titulo, descricao_curta: form.descricao_curta, 
      historia_texto: form.historia_texto, cultura_texto: form.cultura_texto,
      ordem: form.ordem, ativo: form.ativo, imagem_url,
      galeria: galeriaFinal.length > 0 ? galeriaFinal : null 
    };

    let comunidadeId = editando?.id;

    if (editando) {
      await supabase.from("comunidades").update(payload).eq("id", comunidadeId);
    } else {
      const { data, error } = await supabase.from("comunidades").insert(payload).select().single();
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
          const path = `galeria/pt_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
          const { error } = await supabase.storage.from("galeria").upload(path, pt.file);
          if (!error) {
            const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
            ptImgUrl = pub.publicUrl;
          }
        }

        const ptPayload = {
          comunidade_id: comunidadeId, titulo: pt.titulo, tipo: pt.tipo, 
          link_destino: pt.link_destino, whatsapp: pt.whatsapp, imagem_url: ptImgUrl
        };

        if (pt.id) await supabase.from("comunidade_pontos").update(ptPayload).eq("id", pt.id);
        else await supabase.from("comunidade_pontos").insert(ptPayload);
      }
    }
    
    setFeedback("Comunidade salva com sucesso!");
    setTimeout(() => { setShowForm(false); setSaving(false); fetchComunidades(); setFeedback(""); }, 2000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta comunidade? Todos os pontos associados também serão apagados.")) return;
    await supabase.from("comunidade_pontos").delete().eq("comunidade_id", id);
    await supabase.from("comunidades").delete().eq("id", id); 
    fetchComunidades();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Gestão de Comunidades</h2>
          <p className="text-xs text-slate-500 mt-1">{comunidades.length} comunidades no portal</p>
        </div>
        <button onClick={abrirFormNovo} className="bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2">
          <Plus size={16} /> Nova Comunidade
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 flex items-center gap-2`}><Compass className="text-[#F9C400]" /> {editando ? "Editar Comunidade" : "Nova Comunidade"}</h3>
            <button onClick={() => setShowForm(false)} className="text-sm font-bold text-slate-400 hover:text-slate-800">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Identificação</h4>
              <FormField label="Nome da Comunidade *"><input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={inputCls} placeholder="Ex: Santa Cruz" /></FormField>
              <FormField label="Descrição Curta (Resumo)"><textarea value={form.descricao_curta || ""} onChange={(e) => setForm({ ...form, descricao_curta: e.target.value })} rows={3} className={inputCls} /></FormField>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Ordem de Exibição"><input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) })} className={inputCls} /></FormField>
                <FormField label="Status"><select value={String(form.ativo)} onChange={(e) => setForm({ ...form, ativo: e.target.value === 'true' })} className={inputCls}><option value="true">Público</option><option value="false">Oculto</option></select></FormField>
              </div>

              <FormField label="História da Comunidade"><textarea value={form.historia_texto || ""} onChange={(e) => setForm({ ...form, historia_texto: e.target.value })} rows={5} className={inputCls} /></FormField>
              <FormField label="Cultura / Curiosidades"><textarea value={form.cultura_texto || ""} onChange={(e) => setForm({ ...form, cultura_texto: e.target.value })} rows={3} className={inputCls} /></FormField>
            </div>
            
            <div className="space-y-5">
              <h4 className="font-black text-[#00577C] border-b pb-2">Mídia Oficial</h4>
              <FormField label="Fotografia de Capa (Principal)">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-4 rounded-xl cursor-pointer hover:border-[#00577C] transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImagemFile(e.target.files?.[0] || null)} />
                  <ImageIcon size={18} /> {imagemFile ? imagemFile.name : form.imagem_url ? "Trocar Capa Atual" : "Anexar Capa"}
                </label>
              </FormField>
              <FormField label="Adicionar Imagens à Galeria">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 p-4 rounded-xl cursor-pointer hover:border-[#00577C] transition-colors">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if(e.target.files) setGaleriaFiles(Array.from(e.target.files)); }} />
                  <ImageIcon size={18} /> {galeriaFiles.length > 0 ? `${galeriaFiles.length} ficheiros novos` : "Selecionar Fotos"}
                </label>
              </FormField>
            </div>
          </div>

          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-black text-[#00577C]">Pontos da Comunidade (Atrações, Pousadas, etc.)</h4>
              <button onClick={addPonto} className="text-xs font-bold text-[#009640] flex items-center gap-1"><Plus size={14}/> Adicionar Ponto</button>
            </div>
            <div className="space-y-3">
              {pontos.filter(p => !p._deleted).map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="w-full md:w-[25%]"><input type="text" value={item.titulo} onChange={e => handlePontoChange(index, 'titulo', e.target.value)} placeholder="Nome do Ponto" className={inputCls} /></div>
                  <div className="w-full md:w-[15%]">
                    <select value={item.tipo} onChange={e => handlePontoChange(index, 'tipo', e.target.value)} className={inputCls}>
                      <option value="atração">Atração</option><option value="hospedagem">Hospedagem</option><option value="gastronomia">Gastronomia</option><option value="artesanato">Artesanato</option>
                    </select>
                  </div>
                  <div className="w-full md:w-[20%]"><input type="text" value={item.whatsapp} onChange={e => handlePontoChange(index, 'whatsapp', e.target.value)} placeholder="WhatsApp" className={inputCls} /></div>
                  <div className="w-full md:w-[20%]"><input type="text" value={item.link_destino} onChange={e => handlePontoChange(index, 'link_destino', e.target.value)} placeholder="Link / URL" className={inputCls} /></div>
                  <div className="w-full md:w-[20%] flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-500 py-2 rounded-lg cursor-pointer text-xs font-bold">
                      <input type="file" accept="image/*" className="hidden" onChange={e => handlePontoChange(index, 'file', e.target.files?.[0] || null)} />
                      <Upload size={14}/> {item.file ? "Pronto ✓" : (item.imagem_url ? "Tem foto ✓" : "Foto")}
                    </label>
                    <button onClick={() => removePonto(index)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 border border-red-200"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
            <span className="text-sm font-bold text-[#009640]">{feedback}</span>
            <button onClick={handleSave} disabled={saving} className="bg-[#009640] hover:bg-green-700 text-white px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar Comunidade
            </button>
          </div>
        </div>
      ) : (
        loading ? <div className="py-12 flex justify-center"><Loader2 size={32} className="text-[#00577C] animate-spin" /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comunidades.map((c) => (
              <div key={c.id} className="bg-white rounded-[2rem] border border-slate-200 p-4 flex flex-col hover:shadow-xl transition-shadow relative">
                <div className="absolute -top-3 -left-3 bg-[#00577C] text-white w-8 h-8 flex items-center justify-center rounded-full font-black text-xs z-10 shadow-sm border-2 border-white">
                  {c.ordem || 0}
                </div>
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 mb-4">
                  <img src={c.imagem_url || "/placeholder.png"} alt={c.titulo} className="object-cover w-full h-full" />
                </div>
                <div className="px-2 pb-2 flex-1 flex flex-col">
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-800 mb-1`}>{c.titulo}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{c.descricao_curta}</p>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                    <button onClick={() => abrirFormEditar(c)} className="text-xs font-bold text-[#00577C] hover:underline">Editar Completo</button>
                    <button onClick={() => handleDelete(c.id)} className="text-xs font-bold text-red-500 hover:underline">Remover</button>
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
// REUNIÕES COMTUR (NOVO)
// ═══════════════════════════════════════════════════════════════════════════════

function TabReunioesComtur() {
  const [reunioes, setReunioes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => { fetchReunioes(); }, []);

  async function fetchReunioes() {
    setLoading(true);
    const { data } = await supabase.from("reunioes_comtur").select("*").order("criado_em", { ascending: false });
    setReunioes(data || []);
    setLoading(false);
  }

  function abrirFormNovo() {
    setEditando(null); 
    setForm({ mes_ano: "", ordem_reuniao: "", data_reuniao: "", status: "Agendada" });
    setShowForm(true);
  }

  function abrirFormEditar(r: any) {
    setEditando(r); 
    setForm({ ...r }); 
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.mes_ano || !form.ordem_reuniao) { setFeedback("Mês/Ano e Ordem são obrigatórios."); return; }
    setSaving(true);
    
    if (editando) await supabase.from("reunioes_comtur").update(form).eq("id", editando.id);
    else await supabase.from("reunioes_comtur").insert(form);
    
    setFeedback("Reunião salva com sucesso!");
    setTimeout(() => { setShowForm(false); setSaving(false); fetchReunioes(); setFeedback(""); }, 2000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este registo da Reunião?")) return;
    await supabase.from("reunioes_comtur").delete().eq("id", id); 
    fetchReunioes();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Reuniões COMTUR</h2>
          <p className="text-xs text-slate-500 mt-1">Gestão de transparência e pautas do Conselho Municipal de Turismo</p>
        </div>
        <button onClick={abrirFormNovo} className="bg-[#00577C] hover:bg-[#004a6b] text-white font-black text-sm px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2">
          <Plus size={16} /> Registar Reunião
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <h3 className={`${jakarta.className} text-xl font-black text-slate-800 flex items-center gap-2`}><Users className="text-[#F9C400]" /> {editando ? "Editar Reunião" : "Nova Reunião"}</h3>
            <button onClick={() => setShowForm(false)} className="text-sm font-bold text-slate-400 hover:text-slate-800">Cancelar</button>
          </div>

          <div className="space-y-5">
            <FormField label="Mês / Ano da Referência *"><input value={form.mes_ano || ""} onChange={(e) => setForm({ ...form, mes_ano: e.target.value })} className={inputCls} placeholder="Ex: Janeiro 2026" /></FormField>
            <FormField label="Ordem da Reunião *"><input value={form.ordem_reuniao || ""} onChange={(e) => setForm({ ...form, ordem_reuniao: e.target.value })} className={inputCls} placeholder="Ex: 1ª Reunião Ordinária" /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Data da Reunião"><input type="date" value={form.data_reuniao || ""} onChange={(e) => setForm({ ...form, data_reuniao: e.target.value })} className={inputCls} /></FormField>
              <FormField label="Status Atual">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                  <option value="Agendada">Agendada</option><option value="Realizada">Realizada</option><option value="Cancelada">Cancelada</option>
                </select>
              </FormField>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
            <span className="text-sm font-bold text-[#009640]">{feedback}</span>
            <button onClick={handleSave} disabled={saving} className="bg-[#009640] hover:bg-green-700 text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar Registo
            </button>
          </div>
        </div>
      ) : (
        loading ? <div className="py-12 flex justify-center"><Loader2 size={32} className="text-[#00577C] animate-spin" /></div> : (
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <Th>Mês / Ano</Th><Th>Ordem da Reunião</Th><Th>Data</Th><Th>Status</Th><Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {reunioes.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-800">{r.mes_ano}</td>
                    <td className="px-4 py-3 text-slate-600">{r.ordem_reuniao}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtData(r.data_reuniao)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'Realizada' ? 'bg-green-100 text-green-700' : r.status === 'Agendada' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                         <button onClick={() => abrirFormEditar(r)} className="text-xs font-bold text-[#00577C] hover:underline">Editar</button>
                         <button onClick={() => handleDelete(r.id)} className="text-xs font-bold text-red-500 hover:underline">Apagar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reunioes.length === 0 && (<tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Nenhum registo do COMTUR.</td></tr>)}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CENTRAL DE ADMINISTRAÇÃO DA CARTEIRA (CRM, REEMISSÃO E MANUAL)
// ═══════════════════════════════════════════════════════════════════════════════

function TabEmissaoManual() {
  // ── Estados do Buscador
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [loadingBusca, setLoadingBusca] = useState(false);
  
  // ── Estados de Acões (Reemissão 2ª Via)
  const [reemissaoId, setReemissaoId] = useState<string | null>(null);
  const [novoEmail, setNovoEmail] = useState("");
  const [metodoReemissao, setMetodoReemissao] = useState("dinheiro");
  
  const [loadingAcao, setLoadingAcao] = useState(false);
  const [feedbackAcao, setFeedbackAcao] = useState("");
  const [pixGerado, setPixGerado] = useState<{ qr: string, copiaCola: string, msg: string } | null>(null);

  // ── Estados da Emissão Manual (Do zero)
  const [form, setForm] = useState({ nome: "", cpf: "", email: "", data_nascimento: "" });
  const [foto, setFoto] = useState<File | null>(null);
  const [metodoNovaEmissao, setMetodoNovaEmissao] = useState("dinheiro");
  const [savingManual, setSavingManual] = useState(false);

  // ── Máscara Automática de CPF
  const mascaraCPF = (valor: string) => {
    return valor
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os primeiros 3 dígitos
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os segundos 3 dígitos
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca traço
      .replace(/(-\d{2})\d+?$/, '$1'); // Limita a 11 dígitos
  };

  // ─── 1. FUNÇÃO DE BUSCA ───
  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!busca.trim()) return;
    
    setLoadingBusca(true); setPixGerado(null); setFeedbackAcao(""); setReemissaoId(null);
    
    try {
      const resp = await fetch(`https://sagaturismo-production.up.railway.app/api/v1/residentes/buscar?q=${encodeURIComponent(busca)}`);
      if (!resp.ok) throw new Error("Falha na comunicação com o servidor.");
      
      const json = await resp.json();
      setResultados(json.dados || []);
      
      if (!json.dados || json.dados.length === 0) {
        setFeedbackAcao("Nenhum cidadão encontrado com esse Nome ou CPF.");
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackAcao(`❌ Erro na busca: ${err.message}`);
    } finally {
      setLoadingBusca(false);
    }
  }

  // ─── 2. CONFIRMAR REEMISSÃO (2ª VIA - R$ 5,00) ───
  async function handleConfirmarReemissao(residente: any) {
    if (!novoEmail) { alert("Insira o novo e-mail para envio."); return; }
    if (!confirm(`Confirmar emissão de 2ª via para ${residente.nome_completo}?`)) return;

    setLoadingAcao(true); setFeedbackAcao("A processar a 2ª Via..."); setPixGerado(null);

    try {
      // Atualiza a Base de Dados com o Novo Email
      const { error } = await supabase.from('rd_residentes').update({ email: novoEmail }).eq('id', residente.id);
      if (error) throw error;

      const reqBody = {
        nome_cliente: residente.nome_completo,
        cpf_cliente: residente.cpf,
        email_cliente: novoEmail,
        telefone_cliente: residente.telefone || "00000000000",
        foto_url: residente.foto_url,
        data_nascimento: residente.data_nascimento,
        token_id: residente.id,
        quantidade: 1,
        is_reemissao: true // ◄── Diz ao backend que é 2ª Via (Custa R$ 5)
      };

      if (metodoReemissao === "dinheiro") {
        // Dinheiro: Dispara logo o PDF
        const resp = await fetch('https://sagaturismo-production.up.railway.app/api/v1/pagamentos/carteira-gratuita', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reqBody)
        });
        if (!resp.ok) throw new Error("Erro ao disparar o e-mail.");
        setFeedbackAcao("✅ Pagamento em Dinheiro confirmado! A 2ª Via foi enviada por e-mail.");
      } else {
        // PIX: Gera Cobrança de R$ 5
        const resp = await fetch('https://sagaturismo-production.up.railway.app/api/v1/pagamentos/carteira-bb', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reqBody)
        });
        const data = await resp.json();
        if (!resp.ok || !data.sucesso) throw new Error("Falha ao gerar PIX.");
        setPixGerado({ qr: data.pix_qrcode_img, copiaCola: data.pix_copia_cola, msg: "PIX de R$ 5,00 gerado! O e-mail com a carteira será enviado automaticamente pelo banco." });
        setFeedbackAcao("");
      }
      setReemissaoId(null);
    } catch (err: any) {
      setFeedbackAcao(`❌ Erro: ${err.message}`);
    } finally {
      setLoadingAcao(false);
    }
  }

  // ─── 3. EMISSÃO MANUAL DO ZERO (R$ 20,00) ───
  async function handleEmitirManual(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.cpf || !form.email || !form.data_nascimento || !foto) {
      alert("Preenche todos os campos e anexa a foto."); return;
    }
    if (!confirm(`Forçar criação de cidadão e gerar nova carteira para ${form.nome}?`)) return;

    setSavingManual(true); setFeedbackAcao("A enviar fotografia para a galeria..."); setPixGerado(null);

    try {
      const ext = foto.name.split('.').pop();
      const path = `residentes/carteira_manual_${form.cpf.replace(/\D/g, '')}_${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage.from('galeria').upload(path, foto, { upsert: true });
      if (uploadError) throw new Error(uploadError.message);
      
      const { data: pubUrl } = supabase.storage.from('galeria').getPublicUrl(path);
      const fotoUrlCompleta = pubUrl.publicUrl;
      
      setFeedbackAcao("A registar cidadão no sistema...");

      const statusFinal = metodoNovaEmissao === "dinheiro" ? "ativo" : "aguardando_pagamento";

      const respResidente = await fetch('https://sagaturismo-production.up.railway.app/api/v1/residentes/emissao-manual', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome, cpf: form.cpf, email: form.email, 
          data_nascimento: form.data_nascimento, foto_url: fotoUrlCompleta,
          status: statusFinal
        })
      });

      if (!respResidente.ok) throw new Error("Erro ao registar cidadão no servidor.");
      const dadosResidente = await respResidente.json();
      const residenteId = dadosResidente.residente_id;

      const reqBody = {
        nome_cliente: form.nome, cpf_cliente: form.cpf, email_cliente: form.email,
        telefone_cliente: "00000000000", foto_url: fotoUrlCompleta, 
        data_nascimento: form.data_nascimento, token_id: residenteId, quantidade: 1,
        is_reemissao: false // ◄── Diz ao backend que é emissão nova (Custa R$ 20)
      };

      if (metodoNovaEmissao === "dinheiro") {
        const respCarteira = await fetch('https://sagaturismo-production.up.railway.app/api/v1/pagamentos/carteira-gratuita', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reqBody)
        });
        if (!respCarteira.ok) throw new Error("Erro no envio do e-mail.");
        setFeedbackAcao("✅ Cidadão criado e carteira enviada (Pagamento em Dinheiro).");
      } else {
        const respCarteira = await fetch('https://sagaturismo-production.up.railway.app/api/v1/pagamentos/carteira-bb', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reqBody)
        });
        const data = await respCarteira.json();
        if (!respCarteira.ok) throw new Error("Falha ao gerar PIX.");
        setPixGerado({ qr: data.pix_qrcode_img, copiaCola: data.pix_copia_cola, msg: "PIX de R$ 20,00 gerado! A carteira será enviada automaticamente após o pagamento." });
        setFeedbackAcao("");
      }

      setForm({ nome: "", cpf: "", email: "", data_nascimento: "" });
      setFoto(null);

    } catch (err: any) {
      console.error(err);
      setFeedbackAcao(`❌ Erro Manual: ${err.message}`);
    } finally {
      setSavingManual(false);
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-xl font-black text-[#00577C] flex items-center gap-2`}><AlertCircle size={20} /> Central de Gestão & Emissão</h2>
          <p className="text-xs text-slate-500 mt-1">Pesquise residentes para 2ª Via (R$ 5) ou emita novas carteiras do zero (R$ 20).</p>
        </div>
      </div>

      {/* ─── MODAL PIX GLOBAL ─── */}
      {pixGerado && (
        <div className="mb-6 p-6 border-2 border-green-400 bg-green-50 rounded-2xl flex flex-col items-center animate-in fade-in">
          <h4 className="font-black text-green-800 mb-2">Cobrança PIX Gerada (Banco do Brasil)</h4>
          <p className="text-xs text-green-700 mb-4 text-center font-medium">{pixGerado.msg}</p>
          <img src={pixGerado.qr} alt="QR Code PIX" className="w-48 h-48 rounded-xl border-4 border-white shadow-sm mb-4" />
          <div className="w-full max-w-md bg-white border border-green-200 rounded-lg p-3 flex gap-2">
            <input type="text" value={pixGerado.copiaCola} readOnly className="flex-1 text-xs text-slate-500 bg-transparent outline-none truncate" />
            <button onClick={() => { navigator.clipboard.writeText(pixGerado.copiaCola); alert("Copiado!"); }} className="text-xs font-bold text-green-700 hover:text-green-800">Copiar</button>
          </div>
          <button onClick={() => setPixGerado(null)} className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 underline">Fechar Janela PIX</button>
        </div>
      )}

      {/* ─── SECÇÃO 1: BUSCADOR CRM ─── */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
        <h3 className={`${jakarta.className} text-lg font-black text-slate-800 mb-4`}>🔍 Localizar Cidadão (Para 2ª Via)</h3>
        <form onSubmit={handleBuscar} className="flex gap-4 mb-6">
          <input 
            type="text" 
            value={busca} 
            onChange={(e) => setBusca(mascaraCPF(e.target.value))} // ◄── Máscara automática aplicada aqui!
            placeholder="Digite o Nome ou CPF (000.000.000-00)..." 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00577C]" 
          />
          <button type="submit" disabled={loadingBusca} className="bg-[#00577C] text-white px-8 rounded-xl font-black text-sm transition-all hover:bg-[#004a6b] disabled:opacity-50">
            {loadingBusca ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Procurar"}
          </button>
        </form>

        {feedbackAcao && !savingManual && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-bold text-center border ${feedbackAcao.includes('❌') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-[#009640] border-green-200'}`}>
            {feedbackAcao}
          </div>
        )}

        {resultados.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black text-xs uppercase">
                <tr><th className="p-4 text-left">Foto</th><th className="p-4 text-left">Dados do Cidadão</th><th className="p-4 text-left">Status</th><th className="p-4 text-right">Ação</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resultados.map((res) => (
                  <React.Fragment key={res.id}>
                    <tr className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 border border-slate-300">
                          {res.foto_url && res.foto_url.includes('http') ? (
                            <img src={res.foto_url} alt="Foto" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Sem Link</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{res.nome_completo}</p>
                        <p className="text-xs text-slate-500">{res.cpf} • {res.email}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-black tracking-wider ${res.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{res.status}</span>
                      </td>
                      <td className="p-4 text-right">
                        {/* ◄── Botão Único e Limpo para abrir as opções */}
                        <button onClick={() => { setReemissaoId(reemissaoId === res.id ? null : res.id); setNovoEmail(res.email); }} className="text-xs bg-[#00577C] hover:bg-[#004a6b] text-white font-black px-4 py-2 rounded-lg transition-colors uppercase shadow-sm">
                          {reemissaoId === res.id ? "Cancelar" : "Opções de 2ª Via"}
                        </button>
                      </td>
                    </tr>
                    
                    {/* ◄── BLOCO EXPANSÍVEL DE REEMISSÃO (DINHEIRO/PIX) ──► */}
                    {reemissaoId === res.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={4} className="p-6 border-b border-slate-200">
                          <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <FormField label="E-mail de Destino (Novo ou Atual)" className="flex-1">
                              <input type="email" value={novoEmail} onChange={e => setNovoEmail(e.target.value)} className={inputCls} />
                            </FormField>
                            <FormField label="Recebimento da Taxa (R$ 5,00)" className="flex-1">
                              <select value={metodoReemissao} onChange={e => setMetodoReemissao(e.target.value)} className={inputCls}>
                                <option value="dinheiro">Em Dinheiro (Envia E-mail na hora)</option>
                                <option value="pix">Pagamento via PIX (Gera QR Code)</option>
                              </select>
                            </FormField>
                            <button onClick={() => handleConfirmarReemissao(res)} disabled={loadingAcao} className="bg-[#009640] hover:bg-green-700 text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest shadow-md transition-all h-[38px] w-full md:w-auto">
                              Confirmar & Enviar 2ª Via
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-slate-300">
        <div className="flex-1 h-px bg-slate-200"></div><span className="text-xs font-black uppercase tracking-widest">OU</span><div className="flex-1 h-px bg-slate-200"></div>
      </div>

      {/* ─── SECÇÃO 2: EMISSÃO MANUAL (DO ZERO) ─── */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 max-w-3xl">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h3 className={`${jakarta.className} text-lg font-black text-[#00577C]`}>Emissão de Nova Carteira (Do Zero)</h3>
          <p className="text-xs text-slate-500 mt-1">Apenas para cidadãos sem registo ou acesso tecnológico.</p>
        </div>

        <form onSubmit={handleEmitirManual} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Nome Completo *"><input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className={inputCls} required /></FormField>
            <FormField label="CPF *">
              {/* ◄── Máscara automática aplicada aqui também! */}
              <input type="text" value={form.cpf} onChange={e => setForm({...form, cpf: mascaraCPF(e.target.value)})} className={inputCls} placeholder="000.000.000-00" required />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="E-mail (Para onde vai o PDF) *"><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputCls} required /></FormField>
            <FormField label="Data de Nascimento *"><input type="date" value={form.data_nascimento} onChange={e => setForm({...form, data_nascimento: e.target.value})} className={inputCls} required /></FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Foto do Cidadão (3x4) *">
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-600 p-2.5 rounded-xl cursor-pointer hover:border-[#00577C] text-sm font-bold transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={e => setFoto(e.target.files?.[0] || null)} required />
                <Upload size={16} /> {foto ? "Foto Carregada ✓" : "Anexar Fotografia"}
              </label>
            </FormField>
            <FormField label="Recebimento da Taxa (R$ 20,00)">
              <select value={metodoNovaEmissao} onChange={e => setMetodoNovaEmissao(e.target.value)} className={inputCls}>
                <option value="dinheiro">Em Dinheiro (Emissão Imediata)</option>
                <option value="pix">Pagamento via PIX (Gera QR Code)</option>
              </select>
            </FormField>
          </div>

          <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-[#009640]">{savingManual ? "A processar..." : feedbackAcao}</span>
            <button type="submit" disabled={savingManual || loadingAcao} className="bg-[#00577C] hover:bg-[#004a6b] text-white px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest shadow-md flex items-center gap-2 transition-all disabled:opacity-50">
              {savingManual ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} 
              {metodoNovaEmissao === "dinheiro" ? "Registar & Emitir (Dinheiro)" : "Registar & Gerar PIX (R$ 20)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE DE RESIDENTES (LISTAGEM RESTRITA ADMIN)
// ═══════════════════════════════════════════════════════════════════════════════

function TabResidentes() {
  const [residentes, setResidentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResidentes();
  }, []);

  async function fetchResidentes() {
    setLoading(true);
    // Busca apenas os campos necessários, ordenando pelos mais recentes
    const { data, error } = await supabase
      .from('rd_residentes')
      .select('id, nome_completo, cpf, email, status')
      .order('criado_at', { ascending: false });
      
    if (!error && data) {
      setResidentes(data);
    } else if (error) {
      console.error("Erro ao carregar residentes:", error.message);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${jakarta.className} text-xl font-black text-red-600 flex items-center gap-2`}>
            <Users size={20} /> Base de Residentes
          </h2>
          <p className="text-xs text-slate-500 mt-1">Listagem completa dos cidadãos registados na base de dados.</p>
        </div>
        <span className="text-xs font-black uppercase tracking-wider bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100">
          Total: {residentes.length} registos
        </span>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 size={32} className="text-red-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black text-xs uppercase">
                <tr>
                  <th className="p-5 text-left">Nome Completo</th>
                  <th className="p-5 text-left">CPF</th>
                  <th className="p-5 text-left">E-mail</th>
                  <th className="p-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {residentes.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 font-bold text-slate-800">{res.nome_completo}</td>
                    <td className="p-5 text-slate-600 font-medium">{res.cpf}</td>
                    <td className="p-5 text-slate-500">{res.email}</td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider ${
                        res.status === 'ativo' ? 'bg-green-100 text-green-700' : 
                        res.status === 'aguardando_pagamento' ? 'bg-amber-100 text-amber-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {residentes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-400 font-medium">
                      Nenhum residente encontrado na base de dados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}