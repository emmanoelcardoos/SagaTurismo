// app/hospedagens/page.tsx
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import HoteisClient, { type Hotel } from "./HoteisClient";

const BASE_URL = "https://turismo.saogeraldodoaraguaia.pa.gov.br";

// ── 1. SEO estático (a página é sempre a mesma) ──
export const metadata: Metadata = {
  title: "Hospedagens em São Geraldo do Araguaia — Hotéis e Pousadas",
  description:
    "Encontre hotéis, pousadas e áreas de camping em São Geraldo do Araguaia - PA. Opções para todos os estilos de viagem, próximas à Serra das Andorinhas e ao Rio Araguaia.",
  keywords: [
    "hospedagem São Geraldo do Araguaia",
    "hotéis São Geraldo do Araguaia",
    "pousadas São Geraldo do Araguaia",
    "onde ficar em São Geraldo do Araguaia",
    "camping Serra das Andorinhas",
    "hospedagem Pará",
    "hospedagem Rio Araguaia",
    "pousada Serra das Andorinhas",
  ],
  alternates: {
    canonical: `${BASE_URL}/hospedagens`,
  },
  openGraph: {
    title: "Hospedagens em São Geraldo do Araguaia",
    description:
      "Hotéis, pousadas e camping em São Geraldo do Araguaia - PA, próximos à Serra das Andorinhas e ao Rio Araguaia.",
    url: `${BASE_URL}/hospedagens`,
    siteName: "Turismo São Geraldo do Araguaia",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/herosections/herohoteis.jpg",
        width: 1200,
        height: 630,
        alt: "Hospedagens em São Geraldo do Araguaia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hospedagens em São Geraldo do Araguaia",
    description:
      "Hotéis, pousadas e camping em São Geraldo do Araguaia - PA.",
  },
};

// ── Revalida o conteúdo a cada 1h (novos hotéis aparecem automaticamente) ──
export const revalidate = 3600;

// ── 2. Página (Server Component) ──
export default async function HoteisPage() {
  const { data: hoteis } = await supabase
    .from("hoteis")
    .select("*")
    .eq("ativo", true)
    .order("nome");

  const lista = (hoteis ?? []) as Hotel[];

  // ── 3. JSON-LD — ItemList com todas as hospedagens ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Hospedagens em São Geraldo do Araguaia",
    description:
      "Hotéis, pousadas e áreas de camping em São Geraldo do Araguaia - PA.",
    numberOfItems: lista.length,
    itemListElement: lista.map((hotel, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "LodgingBusiness",
        name: hotel.nome,
        description: hotel.descricao?.substring(0, 200),
        image: hotel.imagem_url,
        address: {
          "@type": "PostalAddress",
          streetAddress: hotel.endereco || undefined,
          addressLocality: "São Geraldo do Araguaia",
          addressRegion: "PA",
          addressCountry: "BR",
        },
        telephone: hotel.whatsapp || undefined,
        starRating: hotel.estrelas
          ? {
              "@type": "Rating",
              ratingValue: hotel.estrelas,
              bestRating: 5,
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
      <HoteisClient hoteis={lista} />
    </>
  );
}