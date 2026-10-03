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
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/atrativos`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/biodiversidade`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/historia`, lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${BASE_URL}/comunidades`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/galeria`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/eventos`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/hospedagens`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/gastronomia`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/agencias`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/informacoes`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contato`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${BASE_URL}/suporte`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/cadastro`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];

  // ════════════════════════════════════════════
  //  2. ROTAS DINÂMICAS (Supabase)
  // ════════════════════════════════════════════

  // ── Notícias ──
  const { data: noticias } = await supabase
    .from('noticias')
    .select('id, data_publicacao');

  const noticiasUrls: MetadataRoute.Sitemap = (noticias ?? []).map((n) => ({
    url: `${BASE_URL}/noticias/${n.id}`,
    lastModified: n.data_publicacao ? new Date(n.data_publicacao) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // ── Eventos ──
  const { data: eventos } = await supabase
    .from('eventos')
    .select('id, data');

  const eventosUrls: MetadataRoute.Sitemap = (eventos ?? []).map((e) => ({
    url: `${BASE_URL}/eventos/${e.id}`,
    lastModified: e.data ? new Date(e.data) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // ── Passeios ──
  const { data: passeios } = await supabase
    .from('passeios')
    .select('id, data_passeio')
    .eq('ativo', true);

  const passeiosUrls: MetadataRoute.Sitemap = (passeios ?? []).map((p) => ({
    url: `${BASE_URL}/passeios/${p.id}`,
    lastModified: p.data_passeio ? new Date(p.data_passeio) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // ── Blog ──
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

  // ── Hospedagens ──
  const { data: hoteis } = await supabase
    .from('hoteis')
    .select('id');

  const hoteisUrls: MetadataRoute.Sitemap = (hoteis ?? []).map((h) => ({
    url: `${BASE_URL}/hospedagens/${h.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // ════════════════════════════════════════════
  //  3. COMBINAR TUDO
  // ════════════════════════════════════════════
  return [
    ...staticRoutes,
    ...noticiasUrls,
    ...eventosUrls,
    ...passeiosUrls,
    ...blogUrls,
    ...hoteisUrls,
  ];
}