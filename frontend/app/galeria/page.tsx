'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, Menu, Loader2, X, ZoomIn, Camera 
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// Tipagem baseada na tabela 'galeria'
type Foto = {
  id: string;
  titulo: string;
  imagem_url: string;
  ano: string;
  categoria: string;
};

export default function GaleriaPage() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Estado para o Modal de imagem em ecrã inteiro (Lightbox)
  const [fotoExpandida, setFotoExpandida] = useState<Foto | null>(null);

  useEffect(() => {
    async function fetchFotos() {
      try {
        const { data, error } = await supabase
          .from('galeria')
          .select('*')
          .order('ano', { ascending: false }); // Traz os anos mais recentes primeiro

        if (error) throw new Error("Erro ao buscar a galeria na base de dados.");
        
        if (data) setFotos(data);
      } catch (err: any) {
        setErro(err.message || "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    }

    fetchFotos();
  }, []);

  // Lógica de visibilidade do Header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 80) setShowHeader(true);
      else if (currentScrollY > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Função para agrupar as fotos pela coluna "categoria"
  // Ex: Cria um bloco para "Pesca Esportiva", outro para "Praia da Gaivota 2025"
  const fotosAgrupadas = fotos.reduce((acc, foto) => {
    const cat = foto.categoria || 'Outros Registos';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(foto);
    return acc;
  }, {} as Record<string, Foto[]>);

  return (
    <main className={`${inter.className} min-h-screen bg-slate-50 text-slate-900`}>
      
      {/* HEADER INSTITUCIONAL */}
      <header
        className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56">
              <Image src="/logop.png" alt="Prefeitura de São Geraldo do Araguaia" fill priority className="object-contain object-left" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 lg:block">
              <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Secretaria de Turismo de São Geraldo do Araguaia
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
            <Link href="/#eventos" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Eventos</Link>
            <Link href="/#hoteis" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Hotéis</Link>
            <Link href="/#historia" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">História</Link>
            <a href="https://saogeraldodoaraguaia.pa.gov.br" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Governo</a>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">
              Cartão Residente
            </Link>
          </nav>
          <button className="rounded-xl border border-slate-200 p-2 md:hidden">
            <Menu className="h-5 w-5 text-[#00577C]" />
          </button>
        </div>
      </header>

      {/* HERO DA GALERIA */}
      <section className="bg-[#00577C] pt-40 pb-24 px-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#F9C400]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="mx-auto max-w-7xl relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 text-[#F9C400] mb-6 backdrop-blur-md">
            <Camera size={32} />
          </div>
          <h1 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white tracking-tight mb-6`}>
            Nossas Memórias
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-medium">
            Explore as paisagens, os festivais e os momentos inesquecíveis que marcam a história de São Geraldo do Araguaia.
          </p>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL: SECÇÕES DE FOTOS */}
      <section className="py-16 px-5 min-h-[50vh]">
        <div className="mx-auto max-w-7xl">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#00577C]">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="font-bold uppercase tracking-widest text-sm">A carregar galeria...</p>
            </div>
          ) : erro ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Ups! Algo correu mal.</h2>
              <p className="text-slate-500">{erro}</p>
            </div>
          ) : fotos.length === 0 ? (
            <div className="text-center py-20">
              <Camera className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-500">Galeria Vazia</h2>
              <p className="text-slate-400">Ainda não existem fotos publicadas.</p>
            </div>
          ) : (
            // RENDERIZAR OS ÁLBUNS
            <div className="space-y-24">
              {Object.entries(fotosAgrupadas).map(([categoria, fotosDaCategoria]) => (
                <div key={categoria} className="space-y-8">
                  {/* Título da Secção (Álbum) */}
                  <div className="flex items-center gap-4">
                    <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-[#00577C] uppercase tracking-tighter`}>
                      {categoria}
                    </h2>
                    <div className="h-px bg-slate-200 flex-1 mt-2"></div>
                  </div>

                  {/* Grid de Fotos desta categoria */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {fotosDaCategoria.map((foto) => (
                      <div 
                        key={foto.id} 
                        className="group relative aspect-square rounded-[2rem] overflow-hidden bg-slate-200 cursor-pointer shadow-sm hover:shadow-xl transition-all"
                        onClick={() => setFotoExpandida(foto)}
                      >
                        <Image 
                          src={foto.imagem_url} 
                          alt={foto.titulo || categoria} 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                        {/* Overlay Escuro com Ícone de Zoom */}
                        <div className="absolute inset-0 bg-[#00577C]/0 group-hover:bg-[#00577C]/40 transition-colors duration-300 flex items-center justify-center">
                          <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-10 h-10 scale-50 group-hover:scale-100" />
                        </div>
                        {/* Legenda */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-slate-900/90 to-transparent translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <p className="text-white font-bold text-sm line-clamp-1">{foto.titulo}</p>
                          <p className="text-[#F9C400] text-xs font-black uppercase mt-1">{foto.ano}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MODAL / LIGHTBOX (ECRÃ INTEIRO) */}
      {fotoExpandida && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in duration-200">
          
          <button 
            onClick={() => setFotoExpandida(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
          >
            <X size={24} />
          </button>

          <div className="relative w-full max-w-5xl aspect-video rounded-[2rem] overflow-hidden shadow-2xl bg-slate-900">
            <Image 
              src={fotoExpandida.imagem_url} 
              alt={fotoExpandida.titulo} 
              fill 
              className="object-contain" 
            />
          </div>

          <div className="absolute bottom-10 left-0 right-0 text-center">
            <p className={`${jakarta.className} text-2xl font-black text-white`}>{fotoExpandida.titulo}</p>
            <p className="text-[#F9C400] font-bold uppercase tracking-widest text-sm mt-2">
              {fotoExpandida.categoria} • {fotoExpandida.ano}
            </p>
          </div>
        </div>
      )}

      {/* FOOTER INSTITUCIONAL */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
               <img src="/logop.png" alt="Prefeitura SGA" className="h-20 object-contain" />
               <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">São Geraldo do Araguaia <br/> "Cidade Amada, seguindo em frente"</p>
            </div>
            
            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Gestão Executiva</h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Prefeito: <br/><b>Jefferson Douglas de Jesus Oliveira</b></li>
                <li>Vice-Prefeito: <br/><b>Marcos Antônio Candido de Lucena</b></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Turismo (SEMTUR)</h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Secretária: <br/><b>Micheli Stephany de Souza</b></li>
                <li>Contato: <b>(94) 98145-2067</b></li>
                <li>Email: <b>setursaga@gmail.com</b></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Equipe Técnica</h5>
              <ul className="text-sm text-slate-500 space-y-2 font-medium">
                <li>• Adriana da Luz Lima</li>
                <li>• Carmelita Luz da Silva</li>
                <li>• Diego Silva Costa</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center pt-10 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Secretaria Municipal de Turismo - São Geraldo do Araguaia (PA)</p>
          </div>
        </div>
      </footer>
    </main>
  );
}