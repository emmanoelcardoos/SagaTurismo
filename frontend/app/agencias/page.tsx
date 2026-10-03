// app/agencias/page.tsx
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import AgenciasClient, { type Agencia } from "./AgenciasClient";

const BASE_URL = "https://turismo.saogeraldodoaraguaia.pa.gov.br";

// ── 1. SEO estático ──
export const metadata: Metadata = {
  title: "Agências de Turismo em São Geraldo do Araguaia — Guias e Operadores",
  description:
    "Conheça as agências de turismo, guias credenciados e operadores locais de São Geraldo do Araguaia - PA. Roteiros para a Serra das Andorinhas, Rio Araguaia, cachoeiras e pinturas rupestres.",
  keywords: [
    "agências de turismo São Geraldo do Araguaia",
    "guias turísticos São Geraldo do Araguaia",
    "operadores turísticos Pará",
    "guia Serra das Andorinhas",
    "agência ecoturismo Pará",
    "guia Rio Araguaia",
    "passeios São Geraldo do Araguaia",
    "turismo de aventura Pará",
    "condutores de trilha PESAM",
  ],
  alternates: {
    canonical: `${BASE_URL}/agencias`,
  },
  openGraph: {
    title: "Agências de Turismo em São Geraldo do Araguaia",
    description:
      "Guias credenciados e operadores locais para roteiros na Serra das Andorinhas e no Rio Araguaia.",
    url: `${BASE_URL}/agencias`,
    siteName: "Turismo São Geraldo do Araguaia",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/herosections/heroagencias.jpg",
        width: 1200,
        height: 630,
        alt: "Agências de turismo em São Geraldo do Araguaia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agências de Turismo em São Geraldo do Araguaia",
    description:
      "Guias credenciados e operadores locais no Pará.",
  },
};

// ── Revalida a cada 1h ──
export const revalidate = 3600;

// ── 2. Página (Server Component) ──
export default async function AgenciasPage() {
  const { data: agencias } = await supabase
    .from("agencias")
    .select("*")
    .eq("ativo", true)
    .order("nome");

  const lista = (agencias ?? []) as Agencia[];

  // ── 3. JSON-LD — ItemList com TravelAgency ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Agências de Turismo em São Geraldo do Araguaia",
    description:
      "Guias credenciados, operadores e agências de turismo em São Geraldo do Araguaia - PA.",
    numberOfItems: lista.length,
    itemListElement: lista.map((agencia, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "TravelAgency",
        name: agencia.nome,
        description: agencia.descricao_curta,
        image: agencia.logo_url || agencia.capa_url,
        address: {
          "@type": "PostalAddress",
          streetAddress: agencia.endereco || undefined,
          addressLocality: "São Geraldo do Araguaia",
          addressRegion: "PA",
          addressCountry: "BR",
        },
        telephone: agencia.whatsapp || agencia.telefone || undefined,
        identifier: agencia.cadastur
          ? {
              "@type": "PropertyValue",
              name: "Cadastur",
              value: agencia.cadastur,
            }
          : undefined,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AgenciasClient agencias={lista} />
    </>
  );
}