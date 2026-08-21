'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Menu, X, ChevronDown, ArrowLeft, Loader2, CalendarDays, User as UserIcon } from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM ──
type BlogPost = {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  imagem_url: string;
  data_publicacao: string;
  autor?: string;
  categoria?: string;
};

// ── HEADER SÓLIDO (Específico para páginas de leitura) ──
function SolidHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuGroups = [
  { 
    label: 'Descobrir', 
    links: ['Atrativos', 'História', 'Biodiversidade', 'Comunidades', 'Galeria', 'Eventos'] 
  },
  { 
    label: 'Planejar', 
    links: ['Hospedagens', 'Gastronomia', 'Agências', 'Informações', 'CAT'] 
  },
  { 
    label: 'Institucional', 
    links: ['SEMTUR', 'COMTUR', 'Parceiros'] 
  },
];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 transition-all duration-500">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
        <div className="flex-1">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
              <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center justify-center gap-12">
          {menuGroups.map((group) => (
            <div key={group.label} className="relative group py-2">
              <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-[#00577C] transition-colors`}>
                {group.label} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-2xl p-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50 flex flex-row items-center gap-1">
                {group.links.map((link) => (
                  <Link key={link} href={`/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} className={`${jakarta.className} block px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#00577C] hover:bg-slate-50 rounded-xl transition-all whitespace-nowrap`}>
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex-1 flex justify-end items-center gap-4">
          <Link href="/cadastro" className={`hidden lg:inline-flex ${jakarta.className} px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#F9C400] text-[#002f40] hover:scale-105 transition-all shadow-sm`}>
            Residente
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden text-[#00577C] hover:bg-slate-100 transition-all duration-300">
            {isMobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-6 shadow-2xl lg:hidden z-50 max-h-[85vh] overflow-y-auto">
          {menuGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-3">
              <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.2em] text-[#00577C] border-b border-slate-100 pb-2`}>{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.links.map((link) => (
                  <Link key={link} href={`/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} font-bold text-slate-700 text-sm bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 hover:text-[#00577C] hover:bg-slate-100 transition-colors`}>
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

// ── COMPONENTE PRINCIPAL ──
export default function BlogPostPage() {
  const params = useParams();
  const id = params?.id as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2069";

  useEffect(() => {
    async function fetchPost() {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('blog')
        .select('*')
        .eq('id', id)
        .single();

      if (data) setPost(data as BlogPost);
      if (error) console.error("Erro ao buscar post:", error);
      
      setLoading(false);
    }
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF7]">
        <Loader2 className="w-12 h-12 animate-spin text-[#00577C]" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF7] text-center px-6">
        <h1 className={`${jakarta.className} text-4xl font-black text-slate-900 mb-4`}>Artigo não encontrado</h1>
        <Link href="/blog" className="text-[#00577C] font-bold underline underline-offset-4">
          Voltar ao Blog
        </Link>
      </div>
    );
  }

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '';
    const date = new Date(dataStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col`}>
      <SolidHeader />

      <main className="flex-1 w-full max-w-[900px] mx-auto px-6 pt-32 md:pt-40 pb-20">
        
        <Link href="/blog" className="inline-flex items-center gap-2 text-[#00577C] hover:text-slate-900 transition-colors font-bold text-sm mb-8 md:mb-12">
          <ArrowLeft size={16} /> Voltar ao Blog
        </Link>

        {/* Cabeçalho do Artigo */}
        <header className="mb-8 md:mb-10">
          <h1 className={`${jakarta.className} text-[2.5rem] md:text-[4rem] font-black text-slate-900 leading-[1.1] tracking-tight mb-6`}>
            {post.titulo}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 border-l-2 border-[#F9C400] pl-4">
            {post.data_publicacao && (
              <span className="flex items-center gap-1.5">
                <CalendarDays size={16} /> {formatarData(post.data_publicacao)}
              </span>
            )}
            {post.autor && (
              <span className="flex items-center gap-1.5">
                <UserIcon size={16} /> {post.autor}
              </span>
            )}
          </div>
        </header>

        {/* Imagem Principal */}
        <div className="relative w-full aspect-video md:aspect-[21/9] rounded-2xl md:rounded-[2rem] overflow-hidden bg-slate-100 mb-10 md:mb-16">
          <Image 
            src={post.imagem_url || FALLBACK_IMAGE} 
            alt={post.titulo} 
            fill 
            className="object-cover" 
            priority
          />
        </div>

        {/* Conteúdo do Artigo */}
        <article className="prose prose-slate prose-lg md:prose-xl max-w-none text-slate-700 leading-relaxed marker:text-slate-800">
          {/* Se usar tags HTML na base de dados, utilize o dangerouslySetInnerHTML. Caso contrário, use o texto direto com whitespace-pre-wrap */}
          <div dangerouslySetInnerHTML={{ __html: post.conteudo }} className="whitespace-pre-wrap" />
        </article>
      </main>

      {/* ── FOOTER INSTITUCIONAL ── */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-[#FDFCF7] text-left mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1 text-center md:text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">© 2026 Prefeitura Munícipal de São Geraldo do Araguaia - PA</p>
              <p className="text-[10px] font-bold text-slate-400/80">CNPJ: 10.249.241/0001-22</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}