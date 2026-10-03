// app/blog/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BlogPostClient, { type BlogPost } from "./BlogPostClient";

const BASE_URL = "https://turismo.saogeraldodoaraguaia.pa.gov.br";

type Props = {
  params: Promise<{ id: string }>;
};

// ── Remove tags HTML para usar na meta description ──
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// ── 1. SEO dinâmico ──
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const { data: post } = await supabase
    .from("blog")
    .select("titulo, resumo, conteudo, imagem_url, data_publicacao, autor, categoria, ativo")
    .eq("id", id)
    .eq("ativo", true)
    .single();

  if (!post) {
    return {
      title: "Artigo não encontrado",
      robots: { index: false, follow: false },
    };
  }

  const tituloLimpo = post.titulo?.trim() ?? "Artigo";

  // Prefere o resumo; senão extrai do conteúdo
  const descricaoFonte =
    post.resumo?.trim() ||
    (post.conteudo ? stripHtml(post.conteudo).substring(0, 155) : "");

  const descricao =
    descricaoFonte.length > 155
      ? descricaoFonte.substring(0, 155) + "..."
      : descricaoFonte ||
        `${tituloLimpo} — Blog do Turismo de São Geraldo do Araguaia, Pará.`;

  const url = `${BASE_URL}/blog/${id}`;
  const ogImage = post.imagem_url?.startsWith("http")
    ? post.imagem_url
    : post.imagem_url
    ? `${BASE_URL}${post.imagem_url}`
    : undefined;

  return {
    title: tituloLimpo,
    description: descricao,
    keywords: [
      tituloLimpo,
      post.categoria,
      "blog turismo São Geraldo do Araguaia",
      "notícias turismo Pará",
      "Serra das Andorinhas",
      "Rio Araguaia",
      "ecoturismo no Pará",
    ].filter(Boolean) as string[],
    authors: post.autor ? [{ name: post.autor }] : undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: tituloLimpo,
      description: descricao,
      type: "article",
      url,
      siteName: "Turismo São Geraldo do Araguaia",
      locale: "pt_BR",
      publishedTime: post.data_publicacao,
      authors: post.autor ? [post.autor] : undefined,
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: tituloLimpo }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: tituloLimpo,
      description: descricao,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

// ── 2. Página ──
export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;

  const { data: post, error } = await supabase
    .from("blog")
    .select("*")
    .eq("id", id)
    .eq("ativo", true)
    .single();

  if (error || !post) notFound();

  // ── 3. JSON-LD para o Google ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.titulo,
    description: post.resumo || undefined,
    image: post.imagem_url ? [post.imagem_url] : undefined,
    datePublished: post.data_publicacao,
    dateModified: post.updated_at || post.data_publicacao,
    author: {
      "@type": "Organization",
      name: post.autor || "Assessoria de Turismo de São Geraldo do Araguaia",
    },
    publisher: {
      "@type": "Organization",
      name: "Prefeitura de São Geraldo do Araguaia",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logop.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/${id}`,
    },
    articleSection: post.categoria || "Turismo",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient post={post as BlogPost} />
    </>
  );
}