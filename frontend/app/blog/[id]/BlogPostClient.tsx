// app/blog/[id]/BlogPostClient.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { ArrowLeft, Link as LinkIcon, Eye } from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export type BlogPost = {
  id: string;
  titulo: string;
  resumo?: string;
  conteudo: string;
  imagem_url: string;
  data_publicacao: string;
  autor?: string;
  categoria?: string;
  creditos_imagem?: string;
  visualizacoes?: number;
  updated_at?: string;
};

// ── LIMPEZA SUAVE DO CONTEÚDO ──
// Antes: substituía espaços, &nbsp;, e apagava <p><br></p> — destruía formatação.
// Agora: apenas normaliza casos realmente problemáticos, preserva o HTML do editor.
function limparConteudo(raw: string): string {
  if (!raw) return '<p>Conteúdo não disponível</p>';
  let html = raw;

  // Se for texto puro (sem tags de bloco), transforma em parágrafos
  const temTagsDeBloco = /<(p|br|div|h[1-6]|ul|ol|blockquote|pre|img|figure)\b/i.test(html);
  if (!temTagsDeBloco) {
    const paragraphs = html
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    html = paragraphs.length
      ? paragraphs.map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')
      : `<p>${html.trim()}</p>`;
  }

  // Remove APENAS parágrafos completamente vazios (sem <br>, sem &nbsp;)
  html = html.replace(/<p[^>]*>\s*<\/p>/gi, '');

  // Remove <br> soltos entre blocos (ex: "</p><br><p>") que criam gaps
  html = html.replace(/<\/p>\s*<br\s*\/?>\s*<p[^>]*>/gi, '</p><p>');

  // Remove <br> no fim de parágrafos
  html = html.replace(/<br\s*\/?>\s*<\/p>/gi, '</p>');

  // Remove linhas em branco entre tags, mas preserva dentro de <pre>
  html = html.replace(/>\s+</g, '><');

  return html.trim();
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2069';

export default function BlogPostClient({ post }: { post: BlogPost }) {
  // ── Incrementa visualizações (client-side, uma vez por sessão) ──
  useEffect(() => {
    const key = `viewed_blog_${post.id}`;
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, '1');

    (async () => {
      try {
        const novasViews = (post.visualizacoes || 0) + 1;
        await supabase
          .from('blog')
          .update({ visualizacoes: novasViews })
          .eq('id', post.id);
      } catch {
        // coluna pode não existir — ignorar
      }
    })();
  }, [post.id, post.visualizacoes]);

  // ── Formatação de data estilo G1: "03/09/2026 20h41" ──
  const formatarDataHora = (dataString?: string) => {
    if (!dataString) return '';
    try {
      const dataObj = new Date(dataString);
      const dia = String(dataObj.getDate()).padStart(2, '0');
      const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
      const ano = dataObj.getFullYear();
      const hora = String(dataObj.getHours()).padStart(2, '0');
      const minuto = String(dataObj.getMinutes()).padStart(2, '0');

      if (hora === '00' && minuto === '00') {
        return `${dia}/${mes}/${ano}`;
      }
      return `${dia}/${mes}/${ano} ${hora}h${minuto}`;
    } catch {
      return dataString;
    }
  };

  const shareWhatsApp = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      const text = encodeURIComponent(`*${post.titulo}*\n\nLeia mais em:\n${url}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    }
  };

  const copyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const conteudoLimpo = limparConteudo(post.conteudo);

  return (
    <main className={`${inter.className} min-h-screen bg-white font-sans pt-28 pb-32`}>
      <article className="max-w-[760px] mx-auto px-4 sm:px-6">

        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[#00577C] font-semibold text-sm hover:underline"
          >
            <ArrowLeft size={16} /> Voltar ao Blog
          </Link>
        </div>

        <header className="mb-8">
          {post.categoria && (
            <span className="inline-block bg-[#F9C400] text-[#002f40] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              {post.categoria}
            </span>
          )}

          <h1
            className={`${jakarta.className} text-[2rem] sm:text-[2.4rem] md:text-[2.75rem] leading-[1.15] font-black text-[#222222] mb-4 tracking-tight`}
          >
            {post.titulo}
          </h1>

          {post.resumo && post.resumo !== post.titulo && (
            <h2 className="text-[1.15rem] sm:text-[1.25rem] text-[#555555] font-normal leading-[1.55] mb-6">
              {post.resumo}
            </h2>
          )}

          <div className="border-t border-slate-200 pt-4 mt-6">
            <p className="text-[0.95rem] text-[#333333] mb-1">
              Por <strong>{post.autor || 'Assessoria de Turismo'}</strong> — São Geraldo do Araguaia
            </p>
            <p className="text-[0.85rem] text-[#777777] flex items-center gap-1 flex-wrap">
              {post.data_publicacao && formatarDataHora(post.data_publicacao)}
              {post.updated_at && (
                <>
                  <span className="hidden sm:inline mx-1">·</span>
                  <span>Atualizado {formatarDataHora(post.updated_at)}</span>
                </>
              )}
            </p>
          </div>
        </header>

        {/* Barra de Partilha */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-y border-slate-200 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={shareWhatsApp}
              className="w-10 h-10 rounded-full bg-transparent border border-slate-200 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
              title="Compartilhar no WhatsApp"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
            </button>
            <button
              className="w-10 h-10 rounded-full bg-transparent border border-slate-200 flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-colors"
              title="Compartilhar no Facebook"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              className="w-10 h-10 rounded-full bg-transparent border border-slate-200 flex items-center justify-center text-[#1DA1F2] hover:bg-[#1DA1F2] hover:text-white transition-colors"
              title="Compartilhar no Twitter/X"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              onClick={copyLink}
              className="w-10 h-10 rounded-full bg-transparent border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-500 hover:text-white transition-colors"
              title="Copiar Link"
            >
              <LinkIcon size={18} />
            </button>
          </div>

          {post.visualizacoes !== undefined && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Eye size={16} />
              <span>{post.visualizacoes}</span>
            </div>
          )}
        </div>

        {/* Imagem Principal */}
        <figure className="mb-10">
          <div className="relative w-full aspect-[16/9] bg-slate-100 mb-2 overflow-hidden rounded-lg">
            <Image
              src={post.imagem_url || FALLBACK_IMAGE}
              alt={`${post.titulo} — São Geraldo do Araguaia, Pará`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 800px) 100vw, 800px"
            />
          </div>
          <figcaption className="text-[0.8rem] text-[#777777] leading-relaxed">
            {post.titulo} — Foto: {post.creditos_imagem || 'Assessoria de Turismo'}
          </figcaption>
        </figure>

        {/* Corpo do Texto */}
        <div
          className="noticia-conteudo"
          dangerouslySetInnerHTML={{ __html: conteudoLimpo }}
        />

      </article>

      <style jsx global>{`
        /* ═══════════════════════════════════════════════════════
           CONTEÚDO DA NOTÍCIA — estilos normalizados
           ═══════════════════════════════════════════════════════ */
        .noticia-conteudo {
          font-family: 'Inter', Arial, Helvetica, sans-serif;
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #333333;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        /* ── Reset de espaços entre blocos ── */
        .noticia-conteudo > *:first-child {
          margin-top: 0 !important;
        }
        .noticia-conteudo > *:last-child {
          margin-bottom: 0 !important;
        }

        /* ── Parágrafos ── */
        .noticia-conteudo p {
          margin: 0 0 1.1em 0;
          padding: 0;
        }
        /* Parágrafo vazio (só <br> ou &nbsp;) — não criar gap gigante */
        .noticia-conteudo p:empty,
        .noticia-conteudo p:has(> br:only-child) {
          display: none;
        }

        /* ── Títulos ── */
        .noticia-conteudo h1,
        .noticia-conteudo h2,
        .noticia-conteudo h3,
        .noticia-conteudo h4 {
          color: #1a1a1a;
          font-weight: 700;
          margin: 1.6em 0 0.6em 0;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }
        .noticia-conteudo h1 { font-size: 1.75rem; }
        .noticia-conteudo h2 { font-size: 1.45rem; }
        .noticia-conteudo h3 { font-size: 1.2rem; }
        .noticia-conteudo h4 { font-size: 1.05rem; }
        .noticia-conteudo h1 + p,
        .noticia-conteudo h2 + p,
        .noticia-conteudo h3 + p,
        .noticia-conteudo h4 + p {
          margin-top: 0;
        }

        /* ── Listas ── */
        .noticia-conteudo ul,
        .noticia-conteudo ol {
          padding-left: 1.6em;
          margin: 0 0 1.1em 0;
        }
        .noticia-conteudo ul { list-style: disc; }
        .noticia-conteudo ol { list-style: decimal; }
        .noticia-conteudo li {
          margin: 0.25em 0;
          padding-left: 0.25em;
        }
        .noticia-conteudo li > p {
          margin: 0;
        }
        .noticia-conteudo li::marker {
          color: #00577C;
          font-weight: 600;
        }

        /* ── Ênfase ── */
        .noticia-conteudo strong,
        .noticia-conteudo b {
          font-weight: 700;
          color: #1a1a1a;
        }
        .noticia-conteudo em,
        .noticia-conteudo i {
          font-style: italic;
        }
        .noticia-conteudo u {
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .noticia-conteudo s,
        .noticia-conteudo strike {
          text-decoration: line-through;
          opacity: 0.8;
        }

        /* ── Links ── */
        .noticia-conteudo a {
          color: #00577C;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.15s ease;
        }
        .noticia-conteudo a:hover {
          color: #002f40;
        }

        /* ── Imagens ── */
        .noticia-conteudo img {
          display: block;
          max-width: 100% !important;
          height: auto !important;
          margin: 1.5em auto 0.5em auto;
          border-radius: 0.5rem;
        }
        /* Imagens com estilo inline de width (Quill) — respeitar, mas limitar */
        .noticia-conteudo img[style*="width"] {
          max-width: 100%;
        }

        /* ── Bloco de citação ── */
        .noticia-conteudo blockquote {
          border-left: 4px solid #F9C400;
          background: #FDFCF7;
          padding: 0.75em 1.25em;
          margin: 1.5em 0;
          color: #555555;
          font-style: italic;
          font-size: 1.1rem;
          line-height: 1.6;
          border-radius: 0 6px 6px 0;
        }
        .noticia-conteudo blockquote p:last-child {
          margin-bottom: 0;
        }

        /* ── Código ── */
        .noticia-conteudo code {
          background: #F1F5F9;
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: #0F172A;
        }
        .noticia-conteudo pre {
          background: #0F172A;
          color: #E2E8F0;
          padding: 1em 1.25em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1.5em 0;
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .noticia-conteudo pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }

        /* ── Separador ── */
        .noticia-conteudo hr {
          border: none;
          border-top: 1px solid #E5E7EB;
          margin: 2em 0;
        }

        /* ── Mídia incorporada ── */
        .noticia-conteudo iframe,
        .noticia-conteudo video {
          display: block;
          max-width: 100%;
          width: 100%;
          margin: 1.5em 0;
          border-radius: 0.5rem;
          border: none;
        }

        /* ── Fórmulas (KaTeX) ── */
        .noticia-conteudo .katex {
          font-size: 1.05em;
        }
        .noticia-conteudo .katex-display {
          margin: 1em 0;
          overflow-x: auto;
          overflow-y: hidden;
        }

        /* ── Classes utilitárias do Quill ── */
        .noticia-conteudo .ql-size-small { font-size: 0.875rem; }
        .noticia-conteudo .ql-size-large { font-size: 1.35rem; }
        .noticia-conteudo .ql-size-huge { font-size: 1.75rem; font-weight: 700; }

        .noticia-conteudo .ql-align-center { text-align: center; }
        .noticia-conteudo .ql-align-right { text-align: right; }
        .noticia-conteudo .ql-align-justify { text-align: justify; }

        .noticia-conteudo .ql-indent-1 { padding-left: 2em; }
        .noticia-conteudo .ql-indent-2 { padding-left: 4em; }
        .noticia-conteudo .ql-indent-3 { padding-left: 6em; }
        .noticia-conteudo .ql-indent-4 { padding-left: 8em; }

        /* ── Color / background inline do Quill preservados ── */
        .noticia-conteudo [style*="background-color"] {
          padding: 0.1em 0.2em;
          border-radius: 3px;
        }

        /* ── Tabelas ── */
        .noticia-conteudo table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
          font-size: 0.95rem;
        }
        .noticia-conteudo th,
        .noticia-conteudo td {
          border: 1px solid #E5E7EB;
          padding: 0.6em 0.85em;
          text-align: left;
        }
        .noticia-conteudo th {
          background: #F3F4F6;
          font-weight: 700;
          color: #1a1a1a;
        }

        /* ── Responsivo ── */
        @media (max-width: 640px) {
          .noticia-conteudo {
            font-size: 1rem;
            line-height: 1.7;
          }
          .noticia-conteudo h1 { font-size: 1.5rem; }
          .noticia-conteudo h2 { font-size: 1.3rem; }
          .noticia-conteudo h3 { font-size: 1.1rem; }
          .noticia-conteudo blockquote {
            font-size: 1.05rem;
            padding: 0.6em 1em;
          }
        }
      `}</style>
    </main>
  );
}