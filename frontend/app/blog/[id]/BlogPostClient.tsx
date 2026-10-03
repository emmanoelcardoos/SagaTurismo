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

// ── LIMPEZA DO CONTEÚDO (Quill) ──
function limparConteudo(raw: string): string {
  if (!raw) return '<p>Conteúdo não disponível</p>';
  let html = raw;

  if (!html.includes('<p>') && !html.includes('<br>') && !html.includes('<div>') && !html.includes('<h')) {
    const paragraphs = html.split('\n\n').filter((p) => p.trim());
    if (paragraphs.length > 0) {
      html = paragraphs.map((p) => `<p>${p.trim()}</p>`).join('');
    } else if (html.trim()) {
      html = `<p>${html.trim()}</p>`;
    }
  }

  html = html.replace(/<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
  html = html.replace(/<\/p>\s*<br\s*\/?>\s*<p[^>]*>/gi, '</p><p>');
  html = html.replace(/<br\s*\/?>\s*<\/p>/gi, '</p>');
  html = html.replace(/&nbsp;/g, ' ');
  html = html.replace(/\s{2,}/g, ' ');

  return html;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2069';

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
      <article className="max-w-[800px] mx-auto px-4 sm:px-6">

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
            className={`${jakarta.className} text-[2rem] sm:text-[2.5rem] md:text-[3rem] leading-[1.1] font-black text-[#222222] mb-4 tracking-tight`}
          >
            {post.titulo}
          </h1>

          {post.resumo && post.resumo !== post.titulo && (
            <h2 className="text-lg sm:text-xl text-[#555555] font-normal leading-relaxed mb-6">
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
          className="noticia-conteudo text-[#333333]"
          dangerouslySetInnerHTML={{ __html: conteudoLimpo }}
        />

      </article>

      <style jsx global>{`
        .noticia-conteudo {
          font-family: Arial, Helvetica, sans-serif;
          word-break: break-word;
        }
        .noticia-conteudo p {
          font-size: 1.0625rem;
          line-height: 1.7;
          margin: 0 0 1rem 0;
          color: #333333;
        }
        .noticia-conteudo > p:last-child { margin-bottom: 0; }
        .noticia-conteudo h1,
        .noticia-conteudo h2,
        .noticia-conteudo h3,
        .noticia-conteudo h4 {
          color: #222222;
          font-weight: 700;
          margin: 1.75rem 0 0.875rem 0;
          line-height: 1.25;
        }
        .noticia-conteudo h1 { font-size: 1.75rem; }
        .noticia-conteudo h2 { font-size: 1.4rem; }
        .noticia-conteudo h3 { font-size: 1.2rem; }
        .noticia-conteudo h4 { font-size: 1.05rem; }
        .noticia-conteudo ul,
        .noticia-conteudo ol {
          padding-left: 1.75rem;
          margin: 0 0 1rem 0;
          font-size: 1.0625rem;
          line-height: 1.7;
        }
        .noticia-conteudo ul { list-style-type: disc; }
        .noticia-conteudo ol { list-style-type: decimal; }
        .noticia-conteudo li { margin-bottom: 0.35rem; }
        .noticia-conteudo strong,
        .noticia-conteudo b { font-weight: 700; color: #222222; }
        .noticia-conteudo a {
          color: #00577C;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .noticia-conteudo a:hover { color: #003d5a; }
        .noticia-conteudo img {
          display: block;
          width: 100%;
          height: auto;
          margin: 1.5rem 0 0.5rem 0;
          border-radius: 0.5rem;
        }
        .noticia-conteudo blockquote {
          border-left: 4px solid #F9C400;
          padding-left: 1.25rem;
          margin: 1.5rem 0;
          color: #555555;
          font-style: italic;
          font-size: 1.15rem;
          line-height: 1.6;
        }
        .noticia-conteudo iframe,
        .noticia-conteudo video {
          max-width: 100%;
          margin: 1.5rem 0;
          border-radius: 0.5rem;
        }
        .noticia-conteudo .katex { font-size: 1.05em; }
        .noticia-conteudo .ql-size-small { font-size: 0.875rem; }
        .noticia-conteudo .ql-size-large { font-size: 1.35rem; }
        .noticia-conteudo .ql-size-huge { font-size: 1.75rem; font-weight: 700; }
        .noticia-conteudo .ql-align-center { text-align: center; }
        .noticia-conteudo .ql-align-right { text-align: right; }
        .noticia-conteudo .ql-align-justify { text-align: justify; }
        .noticia-conteudo p:empty,
        .noticia-conteudo p > br:only-child { display: none; }
      `}</style>
    </main>
  );
}