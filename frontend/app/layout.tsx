// app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { LayoutClient } from "./layout-client";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://turismo.saogeraldodoaraguaia.pa.gov.br"),

  title: {
    default:
      "Turismo São Geraldo do Araguaia | Serra das Andorinhas e Rio Araguaia",
    template: "%s | Turismo São Geraldo do Araguaia",
  },

  description:
    "Descubra São Geraldo do Araguaia - PA. Parque Estadual Serra dos Martírios/Andorinhas, Cachoeira Três Quedas, praias do Rio Araguaia, pinturas rupestres, Guerrilha do Araguaia e o melhor do ecoturismo no Pará.",

  keywords: [

    // ==========================================
    // SERRA / PARQUE
    // ==========================================

    "Serra das Andorinhas",
    "Serra dos Martírios",
    "Serra das Andorinhas São Geraldo do Araguaia",
    "Serra dos Martírios São Geraldo do Araguaia",
    "Parque Estadual Serra dos Martírios Andorinhas",
    "Parque Estadual Serra dos Martírios Andorinhas PA",
    "PESAM",
    "PESAM Pará",
    "PESAM São Geraldo do Araguaia",
    "Parque Estadual Serra dos Martírios Andorinhas turismo",
    "Serra das Andorinhas turismo",
    "Serra das Andorinhas turismo no Pará",
    "Serra dos Martírios turismo",
    "visitar Serra das Andorinhas",
    "visitar Serra dos Martírios",
    "trilhas Serra das Andorinhas",
    "trilhas Serra dos Martírios",
    "trilhas no PESAM",
    "turismo de natureza Serra das Andorinhas",
    "ecoturismo Serra das Andorinhas",
    "aventura Serra das Andorinhas",
    "guia Serra das Andorinhas",
    "guia PESAM",
    "passeio Serra das Andorinhas",
    "roteiro Serra das Andorinhas",

    // ==========================================
    // ATRATIVOS / CACHOEIRAS / CAVERNAS
    // ==========================================

    "Cachoeira Três Quedas",
    "Cachoeira das Três Quedas",
    "Três Quedas São Geraldo do Araguaia",
    "Cachoeira Três Quedas Pará",
    "Cachoeiras em São Geraldo do Araguaia",
    "cachoeiras perto de São Geraldo do Araguaia",
    "cachoeiras no Araguaia",
    "Casa de Pedra",
    "Casa de Pedra São Geraldo do Araguaia",
    "Casa de Pedra Serra das Andorinhas",
    "Casa de Pedra Pará",
    "Caverna das Andorinhas",
    "Caverna das Andorinhas Pará",
    "Caverna das Andorinhas São Geraldo do Araguaia",
    "cavernas em São Geraldo do Araguaia",
    "cavernas na Serra das Andorinhas",
    "cavernas no Pará",
    "Rancho Bela Serra",
    "Rancho Bela Serra São Geraldo do Araguaia",
    "atrativos turísticos São Geraldo do Araguaia",
    "pontos turísticos São Geraldo do Araguaia",
    "lugares para conhecer em São Geraldo do Araguaia",
    "lugares para visitar em São Geraldo do Araguaia",
    "passeios em São Geraldo do Araguaia",

    // ==========================================
    // RIO ARAGUAIA / PRAIAS / NATUREZA
    // ==========================================

    "Rio Araguaia",
    "Rio Araguaia Pará",
    "Rio Araguaia São Geraldo do Araguaia",
    "turismo no Rio Araguaia",
    "praias do Rio Araguaia",
    "praias em São Geraldo do Araguaia",
    "Praia da Gaivota",
    "Praia da Gaivota São Geraldo do Araguaia",
    "Praia da Gaivota Pará",
    "Praia de Santa Cruz",
    "Praia de Santa Cruz São Geraldo do Araguaia",
    "Praia de Santa Cruz Pará",
    "Praia de Ilha de Campo",
    "Ilha de Campo São Geraldo do Araguaia",
    "Praia de Ilha de Campo Pará",
    "Remanso dos Botos",
    "Remanso dos Botos São Geraldo do Araguaia",
    "botos do Araguaia",
    "observação de botos no Araguaia",
    "praias de água doce no Pará",
    "praias fluviais no Pará",
    "praias do Araguaia no Pará",
    "temporada de praia São Geraldo do Araguaia",
    "verão no Araguaia",
    "pesca no Rio Araguaia",
    "pôr do sol no Rio Araguaia",
    "natureza no Rio Araguaia",

    // ==========================================
    // ARQUEOLOGIA / PINTURAS RUPESTRES
    // ==========================================

    "pinturas rupestres na Amazônia",
    "pinturas rupestres no Pará",
    "pinturas rupestres São Geraldo do Araguaia",
    "pinturas rupestres Serra das Andorinhas",
    "pinturas rupestres Serra dos Martírios",
    "arte rupestre no Pará",
    "arte rupestre na Amazônia",
    "sítios arqueológicos São Geraldo do Araguaia",
    "sítios arqueológicos no Pará",
    "sítio arqueológico Serra das Andorinhas",
    "patrimônio arqueológico Pará",
    "patrimônio arqueológico São Geraldo do Araguaia",
    "arqueologia no Pará",
    "arqueologia na Amazônia",
    "arqueologia Serra das Andorinhas",
    "história da Serra das Andorinhas",
    "história da Serra dos Martírios",
    "vestígios arqueológicos no Araguaia",

    // ==========================================
    // HISTÓRIA / GUERRILHA DO ARAGUAIA
    // ==========================================

    "Guerrilha do Araguaia",
    "Guerrilha do Araguaia São Geraldo do Araguaia",
    "Guerrilha do Araguaia Pará",
    "história da Guerrilha do Araguaia",
    "história de São Geraldo do Araguaia",
    "história do Araguaia",
    "memória da Guerrilha do Araguaia",
    "lugares históricos da Guerrilha do Araguaia",
    "patrimônio histórico São Geraldo do Araguaia",
    "patrimônio cultural São Geraldo do Araguaia",
    "história do Pará",

    // ==========================================
    // O QUE FAZER / GUIAS / ROTEIROS
    // ==========================================

    "o que fazer em São Geraldo do Araguaia",
    "o que fazer em São Geraldo do Araguaia PA",
    "o que visitar em São Geraldo do Araguaia",
    "pontos turísticos de São Geraldo do Araguaia",
    "pontos turísticos São Geraldo do Araguaia PA",
    "turismo em São Geraldo do Araguaia",
    "turismo São Geraldo do Araguaia PA",
    "roteiro São Geraldo do Araguaia",
    "roteiro turístico São Geraldo do Araguaia",
    "roteiro de viagem São Geraldo do Araguaia",
    "viagem para São Geraldo do Araguaia",
    "viajar para São Geraldo do Araguaia",
    "destinos turísticos no Pará",
    "destinos de natureza no Pará",
    "destinos de ecoturismo no Pará",
    "lugares turísticos no Pará",
    "melhores passeios São Geraldo do Araguaia",
    "passeios turísticos São Geraldo do Araguaia",
    "tour São Geraldo do Araguaia",
    "turismo de aventura São Geraldo do Araguaia",
    "ecoturismo São Geraldo do Araguaia",
    "turismo de natureza São Geraldo do Araguaia",

    // ==========================================
    // PLANEJAMENTO DA VIAGEM
    // ==========================================

    "como chegar em São Geraldo do Araguaia",
    "como chegar a São Geraldo do Araguaia",
    "como chegar na Serra das Andorinhas",
    "como chegar no PESAM",
    "como chegar ao Parque Estadual Serra dos Martírios Andorinhas",
    "distância até São Geraldo do Araguaia",
    "São Geraldo do Araguaia como chegar",
    "São Geraldo do Araguaia de carro",
    "São Geraldo do Araguaia de avião",
    "aeroporto perto de São Geraldo do Araguaia",
    "quando visitar São Geraldo do Araguaia",
    "melhor época para visitar São Geraldo do Araguaia",
    "melhor época para visitar Serra das Andorinhas",
    "clima São Geraldo do Araguaia",
    "tempo São Geraldo do Araguaia",
    "temporada de praias São Geraldo do Araguaia",
    "quanto custa viajar para São Geraldo do Araguaia",
    "viagem São Geraldo do Araguaia",
    "fim de semana em São Geraldo do Araguaia",
    "feriado em São Geraldo do Araguaia",
    "o que levar para Serra das Andorinhas",
    "o que levar para trilha no PESAM",

    // ==========================================
    // HOSPEDAGEM
    // ==========================================

    "onde ficar em São Geraldo do Araguaia",
    "onde se hospedar em São Geraldo do Araguaia",
    "hospedagem São Geraldo do Araguaia",
    "hotéis em São Geraldo do Araguaia",
    "hotel São Geraldo do Araguaia",
    "pousadas em São Geraldo do Araguaia",
    "pousada São Geraldo do Araguaia",
    "onde dormir em São Geraldo do Araguaia",
    "acomodação São Geraldo do Araguaia",
    "hospedagem perto da Serra das Andorinhas",
    "pousada perto da Serra das Andorinhas",
    "hotel perto do PESAM",

    // ==========================================
    // GUIAS / TURISMO RECEPTIVO
    // ==========================================

    "guia turístico São Geraldo do Araguaia",
    "guia de turismo São Geraldo do Araguaia",
    "guia local São Geraldo do Araguaia",
    "guia Serra das Andorinhas",
    "guia Serra dos Martírios",
    "guia PESAM",
    "agência de turismo São Geraldo do Araguaia",
    "agência de turismo no Araguaia",
    "turismo receptivo São Geraldo do Araguaia",
    "passeio guiado Serra das Andorinhas",
    "trilha guiada Serra das Andorinhas",
    "trilha com guia PESAM",
    "excursão São Geraldo do Araguaia",
    "passeios São Geraldo do Araguaia",

    // ==========================================
    // FAMÍLIA / AVENTURA / EXPERIÊNCIAS
    // ==========================================

    "turismo para família São Geraldo do Araguaia",
    "passeios em família São Geraldo do Araguaia",
    "trilhas São Geraldo do Araguaia",
    "trilhas no Pará",
    "trilhas na Amazônia",
    "aventura no Araguaia",
    "turismo de aventura no Pará",
    "ecoturismo no Pará",
    "ecoturismo na Amazônia",
    "turismo de natureza no Pará",
    "turismo de natureza na Amazônia",
    "experiências na Amazônia",
    "experiências no Araguaia",
    "banho de cachoeira São Geraldo do Araguaia",
    "banho de rio São Geraldo do Araguaia",
    "observação da natureza São Geraldo do Araguaia",
    "fotografia de natureza São Geraldo do Araguaia",

    // ==========================================
    // CIDADE / REGIÃO
    // ==========================================

    "São Geraldo do Araguaia",
    "São Geraldo do Araguaia PA",
    "São Geraldo do Araguaia Pará",
    "turismo em São Geraldo do Araguaia Pará",
    "cidade de São Geraldo do Araguaia",
    "Araguaia Pará",
    "região do Araguaia Pará",
    "sudeste do Pará turismo",
    "turismo no sudeste do Pará",
    "turismo no sul do Pará",
    "turismo no Pará",
    "turismo na Amazônia",

    // ==========================================
    // MARABÁ / XAMBIOÁ / ARAGUAÍNA
    // ==========================================

    "o que fazer em Marabá",
    "turismo em Marabá",
    "pontos turísticos de Marabá",
    "Marabá São Geraldo do Araguaia",
    "como ir de Marabá para São Geraldo do Araguaia",
    "distância Marabá São Geraldo do Araguaia",

    "Xambioá",
    "turismo em Xambioá",
    "o que fazer em Xambioá",
    "Xambioá Tocantins",
    "São Geraldo do Araguaia Xambioá",
    "como ir de Xambioá para São Geraldo do Araguaia",

    "Araguaína",
    "turismo em Araguaína",
    "Araguaína São Geraldo do Araguaia",
    "como ir de Araguaína para São Geraldo do Araguaia",
    "distância Araguaína São Geraldo do Araguaia",

    // ==========================================
    // PONTE / ACESSO / CONEXÃO REGIONAL
    // ==========================================

    "Ponte São Geraldo do Araguaia",
    "Ponte do Araguaia São Geraldo do Araguaia",
    "ponte São Geraldo do Araguaia Xambioá",
    "travessia do Rio Araguaia",
    "Rio Araguaia Xambioá",
    "Rio Araguaia São Geraldo do Araguaia",
    "acesso São Geraldo do Araguaia",
    "acesso Serra das Andorinhas",

    // ==========================================
    // BUSCAS LONG TAIL
    // ==========================================

    "lugares para conhecer no Araguaia",
    "lugares para conhecer no Pará",
    "lugares para conhecer na Amazônia",
    "lugares para viajar no Pará",
    "lugares para viajar no Araguaia",
    "destinos para viajar no Pará",
    "destinos para viajar na Amazônia",
    "destinos de aventura no Pará",
    "destinos de natureza no Araguaia",
    "destinos de ecoturismo na Amazônia",
    "viagem de aventura no Pará",
    "viagem de natureza no Pará",
    "roteiro de ecoturismo no Pará",
    "roteiro de ecoturismo na Amazônia",
    "roteiro pelo Araguaia",
    "roteiro de viagem pelo Araguaia",
    "o que conhecer no Araguaia",
    "o que fazer no Araguaia",
    "o que visitar no Araguaia",
    "turismo fora do comum no Pará",
    "turismo de aventura no Araguaia",
    "turismo sustentável no Pará",
    "turismo sustentável na Amazônia"

  ],

  authors: [{ name: "Prefeitura de São Geraldo do Araguaia" }],
  creator: "Prefeitura de São Geraldo do Araguaia",
  publisher: "Prefeitura de São Geraldo do Araguaia",

  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://turismo.saogeraldodoaraguaia.pa.gov.br",
    siteName: "Turismo São Geraldo do Araguaia",
    title:
      "Turismo São Geraldo do Araguaia | Serra das Andorinhas e Rio Araguaia",
    description:
      "Parque Estadual Serra dos Martírios/Andorinhas, Cachoeira Três Quedas, praias do Rio Araguaia e o melhor do ecoturismo no Pará.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Serra das Andorinhas — São Geraldo do Araguaia",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Turismo São Geraldo do Araguaia",
    description:
      "Serra das Andorinhas, Cachoeira Três Quedas, praias do Rio Araguaia.",
    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: "https://turismo.saogeraldodoaraguaia.pa.gov.br",
  },

  verification: {
    google: "nDEIZaezlrlrS7GolzE7ySvUPM9aCRNKRU1OMaN_UvI",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${inter.variable}`}>
      <body className={`${inter.className} bg-[#FDFCF7] text-slate-900 min-h-screen flex flex-col antialiased`}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}