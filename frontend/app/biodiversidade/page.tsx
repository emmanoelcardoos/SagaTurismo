// app/biodiversidade/page.tsx
import type { Metadata } from "next";
import BiodiversidadeClient from "./BiodiversidadeClient";

const BASE_URL = "https://turismo.saogeraldodoaraguaia.pa.gov.br";

// ── 1. SEO estático ──
export const metadata: Metadata = {
  title: "Serra das Andorinhas e Serra dos Martírios — Parque Estadual no Pará",
  description:
    "Conheça o Parque Estadual Serra dos Martírios/Andorinhas (PESAM), em São Geraldo do Araguaia - PA: 12.000 hectares de transição entre Amazônia e Cerrado, mais de 300 espécies de fauna, 11 cachoeiras, pinturas rupestres e o Rio Araguaia.",
  keywords: [
    // Nomes do parque
    "Serra das Andorinhas",
    "Serra dos Martírios",
    "Parque Estadual Serra dos Martírios Andorinhas",
    "Parque Estadual Serra das Andorinhas",
    "PESAM",
    // Termos de pesquisa diretos
    "serra das andorinhas pará",
    "serra dos martírios",
    "serra das andorinhas são geraldo do araguaia",
    "cachoeiras em São Geraldo do Araguaia",
    "cachoeiras no Pará",
    "o que fazer em São Geraldo do Araguaia",
    "o que fazer em Marabá",
    "o que fazer no Araguaia",
    // Contexto ecológico
    "ecoturismo no Pará",
    "ecoturismo na Amazônia",
    "biodiversidade amazônica",
    "biodiversidade do cerrado",
    "transição amazônia cerrado",
    "corredor ecológico",
    // Patrimônio
    "pinturas rupestres na Amazônia",
    "pinturas rupestres no Pará",
    "patrimônio arqueológico Pará",
    "sítios arqueológicos amazônia",
    // Fauna
    "onça-pintada",
    "lobo-guará",
    "boto-cor-de-rosa",
    "arara-canindé",
    "tucano-toco",
    // Flora
    "castanheira",
    "ipê-amarelo",
    "buritizeiro",
    // Referências de região
    "Guerrilha do Araguaia",
    "Rio Araguaia",
    "ponte São Geraldo do Araguaia",
    "Xambioá",
    "Araguaína",
  ],
  alternates: {
    canonical: `${BASE_URL}/biodiversidade`,
  },
  openGraph: {
    title: "Serra das Andorinhas — Parque Estadual no Pará",
    description:
      "12.000 hectares de transição Amazônia-Cerrado, mais de 300 espécies, 11 cachoeiras e pinturas rupestres milenares.",
    url: `${BASE_URL}/biodiversidade`,
    siteName: "Turismo São Geraldo do Araguaia",
    locale: "pt_BR",
    type: "article",
    images: [
      {
        url: "https://images.pexels.com/photos/18064280/pexels-photo-18064280.jpeg",
        width: 1200,
        height: 630,
        alt: "Serra das Andorinhas — Parque Estadual Serra dos Martírios, São Geraldo do Araguaia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Serra das Andorinhas — Parque Estadual no Pará",
    description:
      "Transição Amazônia-Cerrado, 11 cachoeiras, +300 espécies e pinturas rupestres milenares.",
  },
};

// ── 2. Página (Server Component) ──
export default function BiodiversidadePage() {
  // ── JSON-LD: TouristAttraction + ProtectedArea + FAQ ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TouristAttraction", "NatureReserve"],
        "@id": `${BASE_URL}/biodiversidade#park`,
        name: "Parque Estadual Serra dos Martírios/Andorinhas",
        alternateName: ["Serra das Andorinhas", "PESAM", "Serra dos Martírios"],
        description:
          "Parque Estadual de 12.000 hectares que protege a transição entre a Floresta Amazônica e o Cerrado brasileiro, com mais de 300 espécies catalogadas, 11 cachoeiras, sítios arqueológicos e pinturas rupestres.",
        image: "https://images.pexels.com/photos/18064280/pexels-photo-18064280.jpeg",
        url: `${BASE_URL}/biodiversidade`,
        touristType: [
          "Ecoturismo",
          "Turismo de aventura",
          "Observação de aves",
          "Turismo arqueológico",
        ],
        address: {
          "@type": "PostalAddress",
          addressLocality: "São Geraldo do Araguaia",
          addressRegion: "PA",
          addressCountry: "BR",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: -6.35,
          longitude: -48.42,
          elevation: 1100,
        },
        openingHours: "Diariamente, mediante agendamento com a SEMTUR",
        isAccessibleForFree: false,
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Área protegida",
            value: "12.000 hectares",
          },
          {
            "@type": "PropertyValue",
            name: "Altitude máxima",
            value: "1.100 metros",
          },
          {
            "@type": "PropertyValue",
            name: "Espécies catalogadas",
            value: "Mais de 300",
          },
          {
            "@type": "PropertyValue",
            name: "Cachoeiras",
            value: "11",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${BASE_URL}/biodiversidade#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "O que é a Serra das Andorinhas?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A Serra das Andorinhas, oficialmente Parque Estadual Serra dos Martírios/Andorinhas (PESAM), é uma unidade de conservação de 12.000 hectares em São Geraldo do Araguaia, no Pará. Criada em 1995, protege a transição entre a Floresta Amazônica e o Cerrado brasileiro, com mais de 300 espécies de fauna, 11 cachoeiras e sítios arqueológicos com pinturas rupestres.",
            },
          },
          {
            "@type": "Question",
            name: "Onde fica a Serra das Andorinhas?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A Serra das Andorinhas fica no município de São Geraldo do Araguaia, no sudeste do Pará, próxima à divisa com o Tocantins e ao Rio Araguaia. Está a aproximadamente 26 km do centro da cidade, com acesso pela BR-153.",
            },
          },
          {
            "@type": "Question",
            name: "Como visitar a Serra das Andorinhas?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A visitação é feita com acompanhamento de guias e condutores credenciados pelo IDEFLOR-Bio. Grupos escolares têm entrada gratuita mediante agendamento com a SEMTUR de São Geraldo do Araguaia. Há cachoeiras de diferentes níveis de acesso, das mais fáceis às mais remotas.",
            },
          },
          {
            "@type": "Question",
            name: "Quais cachoeiras existem na Serra das Andorinhas?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A Serra das Andorinhas abriga mais de 11 cachoeiras, entre elas: Cachoeira Riacho Fundo, Cachoeira Piscinão do Honorato, Cachoeira do Poção, Cachoeira da Visagem, Cachoeira do Espelho e Cachoeira da Vargem Grande. As mais famosas são a Cachoeira Três Quedas e a Casa de Pedra, que também tem valor arqueológico.",
            },
          },
          {
            "@type": "Question",
            name: "A Serra das Andorinhas tem pinturas rupestres?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Sim. A Serra das Andorinhas possui importantes sítios arqueológicos com pinturas rupestres, especialmente na Casa de Pedra, que é um dos pontos de maior valor histórico e cultural do parque. Esses registros atestam a presença humana milenar na região do Rio Araguaia.",
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
      <BiodiversidadeClient />
    </>
  );
}