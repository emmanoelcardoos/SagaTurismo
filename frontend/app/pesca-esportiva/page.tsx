// app/pesca-esportiva/page.tsx
import type { Metadata } from "next";
import PescaEsportivaClient from "./PescaEsportivaClient";

const BASE_URL = "https://turismo.saogeraldodoaraguaia.pa.gov.br";

// ── 1. SEO estático ──
export const metadata: Metadata = {
  title: "Pesca Esportiva no Rio Araguaia — Tucunaré em São Geraldo do Araguaia",
  description:
    "Pesca esportiva no Rio Araguaia, em São Geraldo do Araguaia - PA. Tucunaré, pesque-e-solte, Torpesaga e os melhores pesqueiros: pontas de ilhas, bocas de lagoas, remansos e pedrais.",
  keywords: [
    // Termos principais
    "pesca esportiva Rio Araguaia",
    "pesca esportiva São Geraldo do Araguaia",
    "pesca esportiva no Pará",
    "pesca esportiva na Amazônia",
    "tucunaré Rio Araguaia",
    "pesca de tucunaré",
    // Torneio
    "Torpesaga",
    "torneio de pesca São Geraldo do Araguaia",
    "torneio de pesca Rio Araguaia",
    // Pesque-e-solte
    "pesque e solte",
    "pesca sustentável",
    "pesca com isca artificial",
    // Localização
    "pesqueiros São Geraldo do Araguaia",
    "pesqueiros Rio Araguaia",
    "onde pescar no Rio Araguaia",
    "onde pescar no Pará",
    "o que fazer em São Geraldo do Araguaia",
    "o que fazer em Marabá",
    "o que fazer no Araguaia",
    // Região
    "Araguaia",
    "Xambioá",
    "Araguaína",
    "Tocantins",
    // Espécies complementares
    "pesca de piraíba",
    "pesca de pirarara",
    "pesca de jaú",
    "peixes do Araguaia",
  ],
  alternates: {
    canonical: `${BASE_URL}/pesca-esportiva`,
  },
  openGraph: {
    title: "Pesca Esportiva no Rio Araguaia — Tucunaré em São Geraldo",
    description:
      "Tucunaré, pesque-e-solte, Torpesaga e os melhores pesqueiros do Rio Araguaia. A experiência completa da pesca esportiva no Pará.",
    url: `${BASE_URL}/pesca-esportiva`,
    siteName: "Turismo São Geraldo do Araguaia",
    locale: "pt_BR",
    type: "article",
    images: [
      {
        url: "https://live.staticflickr.com/65535/55422310039_9391b93de9_k.jpg",
        width: 1200,
        height: 630,
        alt: "Pesca esportiva no Rio Araguaia — Torpesaga em São Geraldo do Araguaia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pesca Esportiva no Rio Araguaia",
    description:
      "Tucunaré, pesque-e-solte e o Torpesaga em São Geraldo do Araguaia, Pará.",
  },
};

// ── 2. Página (Server Component) ──
export default function PescaEsportivaPage() {
  // ── 3. JSON-LD: TouristAttraction + FAQ ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristAttraction",
        "@id": `${BASE_URL}/pesca-esportiva#attraction`,
        name: "Pesca Esportiva no Rio Araguaia",
        alternateName: "Torpesaga",
        description:
          "Experiência de pesca esportiva no Rio Araguaia, em São Geraldo do Araguaia - PA. Tucunaré com isca artificial, prática de pesque-e-solte e o torneio Torpesaga.",
        image: "https://live.staticflickr.com/65535/55422310039_9391b93de9_k.jpg",
        url: `${BASE_URL}/pesca-esportiva`,
        touristType: ["Pesca esportiva", "Ecoturismo", "Turismo de aventura"],
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
        isAccessibleForFree: false,
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Espécie principal",
            value: "Tucunaré",
          },
          {
            "@type": "PropertyValue",
            name: "Modalidade",
            value: "Pesque-e-solte com isca artificial",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${BASE_URL}/pesca-esportiva#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "Onde pescar tucunaré no Rio Araguaia?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "O Rio Araguaia, em São Geraldo do Araguaia (PA), é um dos melhores lugares do Brasil para pescar tucunaré. Os pesqueiros mais produtivos incluem pontas de ilhas, bocas de lagoas, pedras e remansos, galhadas, barrancos e vegetação marginal. A prática do pesque-e-solte é incentivada em toda a região.",
            },
          },
          {
            "@type": "Question",
            name: "O que é o Torpesaga?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "O Torpesaga é o torneio de pesca esportiva realizado em São Geraldo do Araguaia, no Rio Araguaia. Reúne pescadores esportivos de várias regiões e promove a prática do pesque-e-solte com tucunaré e outras espécies do Araguaia.",
            },
          },
          {
            "@type": "Question",
            name: "O que é pesque-e-solte?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Pesque-e-solte é a modalidade de pesca esportiva em que o peixe é capturado, medido e fotografado, e depois devolvido vivo à água. É uma prática sustentável que preserva as populações de peixes do Rio Araguaia e é incentivada em toda a região de São Geraldo do Araguaia.",
            },
          },
          {
            "@type": "Question",
            name: "Qual a melhor época para pescar no Rio Araguaia?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A melhor época para a pesca esportiva no Rio Araguaia é durante o período de seca, entre maio e setembro, quando o nível do rio baixa, as praias aparecem e os peixes se concentram em pesqueiros mais previsíveis. Nessa época também ocorrem os principais torneios, como o Torpesaga.",
            },
          },
          {
            "@type": "Question",
            name: "Quais peixes podem ser pescados no Rio Araguaia?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "O Rio Araguaia abriga uma grande diversidade de peixes para pesca esportiva. O tucunaré é o mais procurado, mas também há piraíba, pirarara, jaú, filhote, cachara, matrinxã, piranha e outras espécies. Todas as capturas seguem as normas de pesca esportiva e pesque-e-solte.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PescaEsportivaClient />
    </>
  );
}