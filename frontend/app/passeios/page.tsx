'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Menu, MapPin, CalendarDays,
  ChevronRight, ShieldCheck, Filter, Search, X, ChevronDown
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGENS ──
type Passeio = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_principal: string;
  data_passeio: string;
  nome_guia: string;
  categoria?: string;
  guia_id?: string;
  guia_imagem?: string; // ◄── Imagem vinda da tabela de guias
};

// ── UTILITÁRIOS ──
const formatarDataLocal = (dataStr: string) => {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1740";
const FALLBACK_GUIA_IMAGE = "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1887";

export default function PasseiosPage() {
  const [passeios, setPasseios] = useState<Passeio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ── FILTROS ──
  
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  
  // ── CARROSSEL DO HERO ──
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  
  const categorias = ['Trilha', 'Balneário', 'Cachoeira', 'Ecoturismo', 'Camping', 'Aventura'];

  useEffect(() => {
    async function fetchPasseios() {
      // 1. Busca os passeios ativos
      const { data: passeiosData, error } = await supabase
        .from('passeios')
        .select('*')
        .eq('ativo', true)
        .order('data_passeio', { ascending: true });
        
      if (error) console.error("Erro ao carregar passeios:", error);

      if (passeiosData && passeiosData.length > 0) {
        // 2. Extrai os IDs únicos dos guias
        const guiasIds = [...new Set(passeiosData.map(p => p.guia_id).filter(Boolean))];
        
        // 3. Busca a foto e nome na tabela de guias
        const { data: guiasData } = await supabase
          .from('guias')
          .select('id, nome, imagem_url')
          .in('id', guiasIds);

        // 4. Mapeia e cruza a informação
        const passeiosMapeados = passeiosData.map(p => {
          const guia = guiasData?.find(g => g.id === p.guia_id);
          return {
            ...p,
            nome_guia: guia?.nome || p.nome_guia || 'Guia Local',
            guia_imagem: guia?.imagem_url || null
          };
        });

        setPasseios(passeiosMapeados);
      } else {
        setPasseios([]);
      }
      setLoading(false);
    }
    fetchPasseios();
  }, []);

  // Rotação do carrossel
  useEffect(() => {
    if (passeios.length <= 1) return;
    const timer = setInterval(() => setCurrentHeroSlide((prev) => (prev + 1) % passeios.length), 6000);
    return () => clearInterval(timer);
  }, [passeios.length]);

  useEffect(() => {
    const handleScroll = () => {
      const cur = window.scrollY;
      setShowHeader(cur < 80 || cur < lastScrollY);
      setLastScrollY(cur);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleCategoria = (cat: string) => {
    setCategoriasSelecionadas(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const passeiosFiltrados = useMemo(() => {
    return passeios.filter(p => {
      return categoriasSelecionadas.length === 0 || (p.categoria && categoriasSelecionadas.includes(p.categoria));
    });
  }, [passeios, categoriasSelecionadas]);

  return (
    <main className={`${inter.className} min-h-screen flex flex-col bg-[#FDFCF7] text-slate-900`}>
      {/* Conteúdo principal (tudo excepto o footer) */}
      <div className="flex-1">
        {/* ── HEADER EDITORIAL (CENTRALIZADO & DROPDOWN) ── */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${lastScrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}>
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
            <div className="flex-1">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                  <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
                </div>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center justify-center gap-12">
              {[
                { label: 'Conhecer', links: ['Atrativos', 'Rotas', 'História', 'Biodiversidade', 'Galeria'] },
                { label: 'Viver', links: ['Passeios', 'Eventos', 'Comunidades', 'Aldeias'] },
                { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
              ].map((group) => (
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
              <Link href="/cadastro" className={`hidden lg:inline-flex ${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
                Residente
              </Link>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </header>

        {/* ── HERO EDITORIAL SOFT & CLEAN (SEM BARRA DE PESQUISA) ── */}
        <section className="relative pt-6 pb-12 md:pt-10 md:pb-20 px-6 bg-[#FDFCF7] overflow-hidden mt-[72px] md:mt-[80px]">
          {/* Background Graphics */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F9C400]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#00577C]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center relative z-10">
            
            <div className="lg:col-span-5 flex flex-col items-center text-center lg:items-start lg:text-left">
              

              <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6`}>
                Passeios<br />
                <span className="italic text-[#F9C400]">Turísticos.</span>
              </h1>

              <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium mb-10 text-justify md:text-left">
                Descubra os recantos mais exclusivos com guias locais credenciados. Conecte-se com a natureza com total segurança e conforto.
              </p>
            </div>

            <div className="lg:col-span-7 w-full mt-4 lg:mt-0">
               <div className="relative w-full h-[400px] md:h-[500px] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-[4px] border-white z-10 group">
                 <Image 
                   src="https://live.staticflickr.com/65535/54668340687_2c7f6b5c39_4k.jpg" 
                   alt="Passeios Turísticos" 
                   fill 
                   className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]" 
                   priority 
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent" />
               </div>
            </div>
          </div>
        </section>

        {/* CONTEÚDO PRINCIPAL: FILTROS + LISTA (COM ESPAÇAMENTO REFORÇADO NO FUNDO) */}
        <section className="mx-auto max-w-7xl px-6 py-12 pb-24 lg:pb-32 relative z-20">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* BARRA LATERAL DE FILTROS */}
            <aside className="w-full lg:w-72 shrink-0 space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                <h3 className={`${jakarta.className} text-xl font-black text-slate-900 mb-8 flex items-center gap-3`}>
                  <Filter size={20} className="text-[#00577C]"/> Filtros
                </h3>
                
                <div className="mb-8">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Categorias de Passeio</p>
                  <div className="space-y-4">
                    {categorias.map(cat => (
                      <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={categoriasSelecionadas.includes(cat)}
                          onChange={() => toggleCategoria(cat)}
                          className="w-5 h-5 rounded-md border-slate-300 text-[#00577C] focus:ring-[#00577C]" 
                        />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-[#00577C] transition-colors">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Banner de Segurança */}
              <div className="bg-[#e6f4ea] border border-[#009640]/20 rounded-[2.5rem] p-8 text-center shadow-sm">
                 <ShieldCheck className="mx-auto mb-4 text-[#009640]" size={40} />
                 <p className="text-base font-black text-[#009640] mb-2">Aviso de Segurança</p>
                 <p className="text-xs text-green-800 font-medium leading-relaxed">Todos os guias responsáveis pelos passeios são credenciados pelo CADASTUR junto ao Ministério do Turismo.</p>
              </div>
            </aside>

            {/* LISTA DE PASSEIOS */}
            <div className="flex-1 w-full space-y-8">
              <div className="flex items-center justify-between mb-2">
                 <h2 className={`${jakarta.className} text-3xl font-black text-slate-800`}>Aventuras Disponíveis</h2>
                 {!loading && <p className="text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-200">{passeiosFiltrados.length} opções</p>}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-200 shadow-sm">
                  <Loader2 className="animate-spin text-[#00577C] mb-4" size={48}/>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscando aventuras...</p>
                </div>
              ) : passeiosFiltrados.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <Search size={40} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-bold text-slate-500">Nenhuma aventura atende aos filtros selecionados.</p>
                  <button onClick={() => setCategoriasSelecionadas([])} className="mt-4 text-[#00577C] font-bold underline">Limpar Filtros</button>
                </div>
              ) : (
                passeiosFiltrados.map((passeio) => (
                  <article key={passeio.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row overflow-hidden group">
                    
                    <div className="relative w-full md:w-80 h-64 md:h-auto shrink-0 overflow-hidden bg-slate-100">
                      <Image src={passeio.imagem_principal || FALLBACK_IMAGE} alt={passeio.titulo} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-5 left-5 bg-[#F9C400] text-[#00577C] px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">
                        {passeio.categoria || 'Aventura'}
                      </div>
                    </div>

                    <div className="p-8 flex flex-col flex-1 text-left">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className={`${jakarta.className} text-2xl md:text-3xl font-black text-[#00577C] leading-tight hover:underline cursor-pointer mb-3`}>
                            <Link href={`/passeios/${passeio.id}`}>{passeio.titulo}</Link>
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-[#009640] mb-5 bg-green-50 px-3 py-1.5 rounded-lg self-start">
                        <CalendarDays size={14} /> Agendado para {formatarDataLocal(passeio.data_passeio)}
                      </div>
                      
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-6 font-medium pr-4">
                        {passeio.descricao_curta}
                      </p>

                      <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        {/* GUIA INFO */}
                        <div className="flex items-center gap-3">
                           <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-100 shrink-0">
                              <Image src={passeio.guia_imagem || FALLBACK_GUIA_IMAGE} alt={passeio.nome_guia} fill className="object-cover" />
                           </div>
                           <div>
                             <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Guia Oficial</p>
                             <p className={`${jakarta.className} text-sm font-bold text-slate-800 line-clamp-1`}>{passeio.nome_guia}</p>
                           </div>
                        </div>

                        {/* BOTÃO */}
                        <div className="text-right flex flex-col items-end w-full sm:w-auto">
                           <Link href={`/passeios/${passeio.id}`} className="w-full sm:w-auto bg-[#00577C] text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#004a6b] transition-all shadow-md flex items-center justify-center gap-2">
                             Ver Detalhes <ChevronRight size={18}/>
                           </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de São Geraldo do Araguaia" width={140} height={50} className="object-contain" />
            </div>
            
            <div className="text-left space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                © 2026 Secretaria Municipal de Turismo - SGA | Todos os direitos reservados
              </p>
              <p className="text-[10px] font-bold text-slate-400/80">
                CNPJ: 10.249.241/0001-22
              </p>
            </div>
          </div>

          <div className="flex gap-10">
            <div className="text-left border-l-2 border-slate-100 pl-9">
              <p className="text-[10px] font-black text-[#00577C] uppercase mb-1">Contato Oficial</p>
              <p className="text-xs font-bold text-slate-500 tracking-tight">setursaga@gmail.com</p>
            </div>
            <ShieldCheck size={40} className="text-[#009640] opacity-30" />
          </div>
        </div>
      </footer>
    </main>
  );
}