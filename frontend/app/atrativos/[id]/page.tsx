// app/atrativos/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AtracaoClient, { type Atracao, type PontoInteresse } from "./AtracaoClient";

const BASE_URL = "https://turismo.saogeraldodoaraguaia.pa.gov.br";

type Props = {
  params: Promise<{ id: string }>;
};

// ── 1. SEO dinâmico ──
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const { data: atracao } = await supabase
    .from("atracoes")
    .select("nome, descricao, imagem_url, tipo")
    .eq("id", id)
    .eq("ativo", true)
    .single();

  if (!atracao) {
    return {
      title: "Atração não encontrada",
      robots: { index: false, follow: false },
    };
  }

  const nomeLimpo = atracao.nome?.trim() ?? "Atrativo";
  const tipoLimpo = atracao.tipo?.trim() ?? "";

  const descricaoLimpa =
    atracao.descricao?.replace(/\s+/g, " ").trim().substring(0, 155) ||
    `${nomeLimpo}${tipoLimpo ? ` — ${tipoLimpo}` : ""} em São Geraldo do Araguaia, Pará.`;

  const url = `${BASE_URL}/atrativos/${id}`;
  const ogImage = atracao.imagem_url?.startsWith("http")
    ? atracao.imagem_url
    : `${BASE_URL}${atracao.imagem_url}`;

  return {
    title: nomeLimpo,
    description: descricaoLimpa,
    keywords: [
      nomeLimpo,
      tipoLimpo,
      "São Geraldo do Araguaia",
      "Serra das Andorinhas",
      "Serra dos Martírios",
      "Pará",
      "ecoturismo no Pará",
      "turismo no Araguaia",
    ].filter(Boolean),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${nomeLimpo} | Turismo São Geraldo do Araguaia`,
      description: descricaoLimpa,
      type: "article",
      url,
      siteName: "Turismo São Geraldo do Araguaia",
      locale: "pt_BR",
      images: atracao.imagem_url
        ? [{ url: ogImage, width: 1200, height: 630, alt: nomeLimpo }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: nomeLimpo,
      description: descricaoLimpa,
      images: atracao.imagem_url ? [ogImage] : undefined,
    },
  };
}

// ── 2. Página ──
export default async function AtracaoPage({ params }: Props) {
  const { id } = await params;

  const { data: atracao, error } = await supabase
    .from("atracoes")
    .select("*")
    .eq("id", id)
    .eq("ativo", true)
    .single();

  if (error || !atracao) notFound();

  const { data: pontos } = await supabase
    .from("atracao_pontos")
    .select("*")
    .eq("atracao_id", id);

  const nomeLimpo = atracao.nome?.trim() ?? "Atrativo";
  const descricaoLimpa =
    atracao.descricao?.replace(/\s+/g, " ").trim() ?? "";

  // ── 3. JSON-LD para o Google ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: nomeLimpo,
    description: descricaoLimpa.substring(0, 300),
    image: atracao.imagem_url,
    url: `${BASE_URL}/atrativos/${id}`,
    touristType: atracao.tipo ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: "São Geraldo do Araguaia",
      addressRegion: "PA",
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -6.4,
      longitude: -48.4,
    },
    isAccessibleForFree:
      Number(atracao.preco_entrada ?? 0) === 0 ? true : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AtracaoClient
        atracao={atracao as Atracao}
        pontos={(pontos ?? []) as PontoInteresse[]}
      />
    </>
  );
}