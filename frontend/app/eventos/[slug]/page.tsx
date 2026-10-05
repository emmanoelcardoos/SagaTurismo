// app/eventos/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EventoClient, { type Evento, type EventoNav } from "./EventoClient";

// 🔴 ESTA É A LINHA MÁGICA QUE DESATIVA O CACHE E OBRIGA A LER DADOS FRESCOS
export const revalidate = 0;

const BASE_URL = "https://turismo.saogeraldodoaraguaia.pa.gov.br";

type Props = {
  params: Promise<{ slug: string }>;
};

// ── 1. SEO dinâmico ──
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const { data: evento } = await supabase
    .from("eventos")
    .select("titulo, subtitulo, descricao, imagem_url, data, local, categoria")
    .eq("slug", slug)
    .single();

  if (!evento) {
    return {
      title: "Evento não encontrado",
      robots: { index: false, follow: false },
    };
  }

  const tituloLimpo = evento.titulo?.trim() ?? "Evento";
  const localLimpo = evento.local?.trim() ?? "São Geraldo do Araguaia";

  // Formata data para aparecer na descrição
  let dataFormatada = "";
  if (evento.data) {
    const d = new Date(evento.data + "T00:00:00");
    const meses = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
    ];
    dataFormatada = `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  }

  const descricao =
    evento.descricao?.replace(/\s+/g, " ").trim().substring(0, 155) ||
    `${tituloLimpo} — ${dataFormatada} em ${localLimpo}. Confira a programação completa e informações no portal de turismo de São Geraldo do Araguaia.`;

  const url = `${BASE_URL}/eventos/${slug}`;
  const ogImage = evento.imagem_url?.startsWith("http")
    ? evento.imagem_url
    : evento.imagem_url
    ? `${BASE_URL}${evento.imagem_url}`
    : undefined;

  return {
    title: tituloLimpo,
    description: descricao,
    keywords: [
      tituloLimpo,
      evento.categoria,
      "eventos São Geraldo do Araguaia",
      "agenda cultural Pará",
      "eventos no Araguaia",
      "o que fazer em São Geraldo do Araguaia",
      localLimpo,
    ].filter(Boolean) as string[],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${tituloLimpo} | Eventos São Geraldo do Araguaia`,
      description: descricao,
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
      description: descricao,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

// ── 2. Página ──
export default async function EventoPage({ params }: Props) {
  const { slug } = await params;

  // Evento atual
  const { data: evento, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !evento) notFound();

  // Navegação anterior/próximo
  const { data: allEvents } = await supabase
    .from("eventos")
    .select("id, slug, titulo")
    .order("data", { ascending: true });

  let eventoAnterior: EventoNav | null = null;
  let eventoProximo: EventoNav | null = null;

  if (allEvents) {
    const currentIndex = allEvents.findIndex((e) => e.slug === slug);
    if (currentIndex > 0) {
      eventoAnterior = allEvents[currentIndex - 1] as EventoNav;
    }
    if (currentIndex !== -1 && currentIndex < allEvents.length - 1) {
      eventoProximo = allEvents[currentIndex + 1] as EventoNav;
    }
  }

  // ── 3. JSON-LD para o Google ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: evento.titulo,
    description: evento.descricao?.substring(0, 300),
    image: evento.imagem_url,
    startDate: evento.data,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: evento.local ?? "São Geraldo do Araguaia",
      address: {
        "@type": "PostalAddress",
        addressLocality: "São Geraldo do Araguaia",
        addressRegion: "PA",
        addressCountry: "BR",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Prefeitura de São Geraldo do Araguaia",
      url: BASE_URL,
    },
    offers: evento.preco && evento.preco.toLowerCase() !== "gratuito"
      ? {
          "@type": "Offer",
          price: evento.preco,
          priceCurrency: "BRL",
          url: evento.link_bilheteira ?? `${BASE_URL}/eventos/${slug}`,
          availability: "https://schema.org/InStock",
        }
      : {
          "@type": "Offer",
          price: "0",
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
        },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EventoClient
        evento={evento as Evento}
        eventoAnterior={eventoAnterior}
        eventoProximo={eventoProximo}
      />
    </>
  );
}