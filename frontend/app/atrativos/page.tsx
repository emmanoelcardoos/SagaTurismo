// app/atrativos/page.tsx
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import AtrativosClient, { type Atracao } from "./AtrativosClient";

const BASE_URL = "https://turismo.saogeraldodoaraguaia.pa.gov.br";

// ── 1. SEO estático ──
export const metadata: Metadata = {
  title: "Atrativos Turísticos de São Geraldo do Araguaia — Serra das Andorinhas e Rio Araguaia",
  description:
    "Conheça os principais atrativos de São Geraldo do Araguaia - PA: Casa de Pedra, Cachoeira Três Quedas, Serra das Andorinhas, pinturas rupestres, praias do Rio Araguaia e muito mais.",
  keywords: [
    "atrativos São Geraldo do Araguaia",
    "o que visitar em São Geraldo do Araguaia",
    "Serra das Andorinhas",
    "Serra dos Martírios",
    "Casa de Pedra",
    "Cachoeira Três Quedas",
    "pinturas rupestres Pará",
    "patrimônio arqueológico Amazônia",
    "Rio Araguaia",
    "praias do Rio Araguaia",
    "ecoturismo no Pará",
    "turismo na Amazônia",
    "o que fazer em Marabá",
    "o que fazer no Araguaia",
  ],
  alternates: {
    canonical: `${BASE_URL}/atrativos`,
  },
  openGraph: {
    title: "Atrativos Turísticos de São Geraldo do Araguaia",
    description:
      "Casa de Pedra, Cachoeira Três Quedas, Serra das Andorinhas, pinturas rupestres e praias do Rio Araguaia.",
    url: `${BASE_URL}/atrativos`,
    siteName: "Turismo São Geraldo do Araguaia",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://res.cloudinary.com/uu8kd8vs/image/upload/f_auto,q_auto/heroatrativos",
        width: 1200,
        height: 630,
        alt: "Atrativos de São Geraldo do Araguaia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Atrativos Turísticos de São Geraldo do Araguaia",
    description:
      "Serra das Andorinhas, Cachoeira Três Quedas, praias do Rio Araguaia e pinturas rupestres.",
  },
};

// ── Revalida a cada 1h ──
export const revalidate = 3600;

// ── 2. Página (Server Component) ──
export default async function AtrativosPage() {
  const { data: atracoes } = await supabase
    .from("atracoes")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true, nullsFirst: false });

  const lista = (atracoes ?? []) as Atracao[];

  // ── 3. JSON-LD — ItemList + TouristAttraction ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Atrativos Turísticos de São Geraldo do Araguaia",
    description:
      "Principais atrativos naturais e culturais de São Geraldo do Araguaia - PA.",
    numberOfItems: lista.length,
    itemListElement: lista.map((atracao, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "TouristAttraction",
        name: atracao.nome,
        description: atracao.descricao?.replace(/\s+/g, " ").substring(0, 200),
        image: atracao.imagem_url,
        url: `${BASE_URL}/atrativos/${atracao.id}`,
        touristType: atracao.tipo || undefined,
        address: {
          "@type": "PostalAddress",
          addressLocality: "São Geraldo do Araguaia",
          addressRegion: "PA",
          addressCountry: "BR",
        },
        isAccessibleForFree:
          atracao.preco_entrada !== undefined
            ? Number(atracao.preco_entrada) === 0
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
      <AtrativosClient atracoes={lista} />
    </>
  );
}