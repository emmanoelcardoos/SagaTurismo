// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // regenera a cada 1 hora

const BASE_URL = 'https://turismo.saogeraldodoaraguaia.pa.gov.br';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ════════════════════════════════════════════
  //  1. ROTAS ESTÁTICAS
  // ════════════════════════════════════════════
  const staticRoutes: MetadataRoute.Sitemap = [
    // ── Página principal ──
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },

    // ── Descobrir (alta prioridade) ──
    { url: `${BASE_URL}/atrativos`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/biodiversidade`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/historia`, lastModified: now, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${BASE_URL}/comunidades`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/galeria`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/eventos`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/roteiros`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/pesca-esportiva`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/apa`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },

    // ── Planejar ──
    { url: `${BASE_URL}/hospedagens`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/gastronomia`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/agencias`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/informacoes`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/cat`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/app-turismo`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },

    // ── Institucional ──
    { url: `${BASE_URL}/semtur`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/comtur`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/parceiros`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },

    // ── Blog e conteúdo ──
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },

    // ── Serviços ao cidadão ──
    { url: `${BASE_URL}/cadastro`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${BASE_URL}/contato`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${BASE_URL}/suporte`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/privacidade`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/termos`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // ════════════════════════════════════════════
  //  2. ROTAS DINÂMICAS (Supabase)
  // ════════════════════════════════════════════

  // ── Atrativos (MUDANÇA PARA SLUG) ──
  const { data: atracoes } = await supabase
    .from('atracoes')
    .select('slug') // 🔴 Buscamos o slug em vez do ID
    .eq('ativo', true)
    .order('ordem', { ascending: true, nullsFirst: false });

  const atracoesUrls: MetadataRoute.Sitemap = (atracoes ?? []).map((a) => ({
    url: `${BASE_URL}/atrativos/${a.slug}`, // 🔴 Usamos a propriedade slug
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // ── Comunidades (MUDANÇA PARA SLUG) ──
  const { data: comunidades } = await supabase
    .from('comunidades')
    .select('slug') // 🔴 Buscamos o slug
    .eq('ativo', true);

  const comunidadesUrls: MetadataRoute.Sitemap = (comunidades ?? []).map((c) => ({
    url: `${BASE_URL}/comunidades/${c.slug}`, // 🔴 Usamos a propriedade slug
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // ── Eventos (MUDANÇA PARA SLUG) ──
  const { data: eventos } = await supabase
    .from('eventos')
    .select('slug, data'); // 🔴 Buscamos o slug

  const eventosUrls: MetadataRoute.Sitemap = (eventos ?? []).map((e) => ({
    url: `${BASE_URL}/eventos/${e.slug}`, // 🔴 Usamos a propriedade slug
    lastModified: e.data ? new Date(e.data) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // ── Blog (Mantido com ID, a menos que mude a lógica do Blog também) ──
  const { data: posts } = await supabase
    .from('blog')
    .select('id, data_publicacao')
    .eq('ativo', true);

  const blogUrls: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${BASE_URL}/blog/${post.id}`,
    lastModified: post.data_publicacao ? new Date(post.data_publicacao) : now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // ── Notícias (Mantido com ID) ──
  const { data: noticias } = await supabase
    .from('noticias')
    .select('id, data_publicacao');

  const noticiasUrls: MetadataRoute.Sitemap = (noticias ?? []).map((n) => ({
    url: `${BASE_URL}/noticias/${n.id}`,
    lastModified: n.data_publicacao ? new Date(n.data_publicacao) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // ════════════════════════════════════════════
  //  3. COMBINAR TUDO
  // ════════════════════════════════════════════
  return [
    ...staticRoutes,
    ...atracoesUrls,
    ...comunidadesUrls,
    ...eventosUrls,
    ...blogUrls,
    ...noticiasUrls,
  ];
}