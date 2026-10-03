// app/comunidades/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ComunidadeClient, { type Comunidade, type PontoComunidade } from "./ComunidadeClient";

const BASE_URL = "https://turismo.saogeraldodoaraguaia.pa.gov.br";

type Props = {
  params: Promise<{ id: string }>;
};

// ── 1. SEO dinâmico ──
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const { data: comunidade } = await supabase
    .from("comunidades")
    .select("titulo, descricao_curta, historia_texto, imagem_url, ativo")
    .eq("id", id)
    .eq("ativo", true)
    .single();

  if (!comunidade) {
    return {
      title: "Comunidade não encontrada",
      robots: { index: false, follow: false },
    };
  }

  const tituloLimpo = comunidade.titulo?.trim() ?? "Comunidade";

  // Prefere a descrição curta; senão o início da história
  const descricaoFonte =
    comunidade.descricao_curta?.trim() ||
    comunidade.historia_texto?.replace(/\s+/g, " ").trim().substring(0, 155) ||
    "";

  const descricao =
    descricaoFonte ||
    `${tituloLimpo} — comunidade ribeirinha de São Geraldo do Araguaia, Pará. Conheça a história, cultura e tradições locais.`;

  const url = `${BASE_URL}/comunidades/${id}`;
  const ogImage = comunidade.imagem_url?.startsWith("http")
    ? comunidade.imagem_url
    : comunidade.imagem_url
    ? `${BASE_URL}${comunidade.imagem_url}`
    : undefined;

  return {
    title: tituloLimpo,
    description: descricao.substring(0, 160),
    keywords: [
      tituloLimpo,
      "comunidade ribeirinha São Geraldo do Araguaia",
      "comunidades do Rio Araguaia",
      "cultura ribeirinha Pará",
      "comunidades tradicionais Amazônia",
      "Rio Araguaia",
      "São Geraldo do Araguaia",
      "ecoturismo de base comunitária",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${tituloLimpo} | Comunidades São Geraldo do Araguaia`,
      description: descricao.substring(0, 160),
      type: "article",
      url,
      siteName: "Turismo São Geraldo do Araguaia",
      locale: "pt_BR",
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: tituloLimpo }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: tituloLimpo,
      description: descricao.substring(0, 160),
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

// ── 2. Página ──
export default async function ComunidadePage({ params }: Props) {
  const { id } = await params;

  const { data: comunidade, error } = await supabase
    .from("comunidades")
    .select("*")
    .eq("id", id)
    .eq("ativo", true)
    .single();

  if (error || !comunidade) notFound();

  const { data: pontos } = await supabase
    .from("comunidade_pontos")
    .select("*")
    .eq("comunidade_id", id);

  // ── 3. JSON-LD ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: comunidade.titulo,
    description:
      comunidade.descricao_curta ||
      comunidade.historia_texto?.substring(0, 200) ||
      undefined,
    image: comunidade.imagem_url,
    url: `${BASE_URL}/comunidades/${id}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "São Geraldo do Araguaia",
      addressRegion: "PA",
      addressCountry: "BR",
    },
    touristType: ["Ecoturismo", "Turismo cultural", "Turismo de base comunitária"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ComunidadeClient
        comunidade={comunidade as Comunidade}
        pontos={(pontos ?? []) as PontoComunidade[]}
      />
    </>
  );
}