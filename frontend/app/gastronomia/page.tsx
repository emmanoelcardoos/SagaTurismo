// app/gastronomia/page.tsx
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import GastronomiaClient, { type Restaurante } from "./GastronomiaClient";

const BASE_URL = "https://turismo.saogeraldodoaraguaia.pa.gov.br";

// ── 1. SEO estático ──
export const metadata: Metadata = {
  title: "Gastronomia em São Geraldo do Araguaia — Restaurantes e Sabores Locais",
  description:
    "Descubra a culinária típica de São Geraldo do Araguaia - PA: peixes do Rio Araguaia, galinha caipira e sabores da Amazônia paraense. Restaurantes, lanchonetes e quitandas locais.",
  keywords: [
    "gastronomia São Geraldo do Araguaia",
    "restaurantes São Geraldo do Araguaia",
    "comida típica Pará",
    "peixe do Rio Araguaia",
    "galinha caipira Pará",
    "culinária amazônica",
    "onde comer em São Geraldo do Araguaia",
    "sabores do Araguaia",
    "gastronomia paraense",
  ],
  alternates: {
    canonical: `${BASE_URL}/gastronomia`,
  },
  openGraph: {
    title: "Gastronomia em São Geraldo do Araguaia",
    description:
      "Peixes do Rio Araguaia, galinha caipira e sabores da Amazônia paraense. Conheça os restaurantes e quitandas locais.",
    url: `${BASE_URL}/gastronomia`,
    siteName: "Turismo São Geraldo do Araguaia",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://images.pexels.com/photos/19781596/pexels-photo-19781596.jpeg",
        width: 1200,
        height: 630,
        alt: "Gastronomia de São Geraldo do Araguaia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gastronomia em São Geraldo do Araguaia",
    description:
      "Peixes do Rio Araguaia, galinha caipira e sabores da Amazônia paraense.",
  },
};

// ── Revalida a cada 1h ──
export const revalidate = 3600;

// ── 2. Página (Server Component) ──
export default async function GastronomiaPage() {
  const { data: restaurantes } = await supabase
    .from("gastronomia")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  const lista = (restaurantes ?? []) as Restaurante[];

  // ── 3. JSON-LD — ItemList com Restaurant para cada ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Gastronomia em São Geraldo do Araguaia",
    description:
      "Restaurantes, lanchonetes e quitandas em São Geraldo do Araguaia - PA.",
    numberOfItems: lista.length,
    itemListElement: lista.map((rest, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Restaurant",
        name: rest.titulo,
        description: rest.descricao_curta,
        image: rest.imagem_url,
        servesCuisine: ["Brasileira", "Amazônica", "Paraense"],
        address: {
          "@type": "PostalAddress",
          addressLocality: "São Geraldo do Araguaia",
          addressRegion: "PA",
          addressCountry: "BR",
        },
        telephone: rest.whatsapp || undefined,
        url: rest.link_google_maps || undefined,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GastronomiaClient restaurantes={lista} />
    </>
  );
}