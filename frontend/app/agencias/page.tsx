'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu, MapPin, Search, ShieldCheck, 
  X, ArrowRight, Building2, Briefcase, ChevronDown, AtSign
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM ──
type Agencia = {
  id: string;
  nome: string;
  descricao_curta?: string;
  capa_url?: string;
  logo_url?: string;
  cadastur?: string;
  endereco?: string;
  instagram?: string;
  ativo: boolean;
};

// ── UTILS (SKELETON) ──
function AgenciaCardSkeleton() {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-4 flex flex-col md:flex-row overflow-hidden animate-pulse shadow-sm gap-6">
      <div className="w-full h-48 md:w-[320px] md:h-auto bg-slate-100 rounded-3xl shrink-0" />
      <div className="p-4 md:p-6 flex flex-col flex-1 gap-4">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-8 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-full mt-4" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="mt-auto pt-6 flex justify-end">
          <div className="h-12 bg-slate-200 rounded-full w-40" />
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──
function AgenciasPageContent() {
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filtros Visuais
  const [termoBusca, setTermoBusca] = useState('');
  const [apenasComCadastur, setApenasComCadastur] = useState(false);

  useEffect(() => {
    async function fetchAgencias() {
      const { data } = await supabase.from('agencias').select('*').eq('ativo', true).order('nome');
      if (data) setAgencias(data as Agencia[]);
      setLoading(false);
    }
    fetchAgencias();
  }, []);

  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1533240332313-0cb49f47c0a8";

  const limparFiltros = () => { 
    setTermoBusca(''); 
    setApenasComCadastur(false); 
    setIsMobileFiltersOpen(false); 
  };

  const agenciasFiltradas = useMemo(() => {
    return agencias.filter(a => {
      if (apenasComCadastur && !a.cadastur) return false;
      if (termoBusca && !a.nome.toLowerCase().includes(termoBusca.toLowerCase())) return false;
      return true;
    });
  }, [agencias, apenasComCadastur, termoBusca]);

  const menuItens = ['Hoteis', 'Agencias', 'Rotas', 'Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'];

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 pb-32`}>
      
      {/* ── HEADER ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
             </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {menuItens.map(item => (
              <Link key={item} href={`/${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
              Cartão Residente
            </Link>
          </nav>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl lg:hidden z-50">
            {menuItens.map(item => (
              <Link key={item} href={`/${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2 transition-colors`}>
                {item}
              </Link>
            ))}
            <Link href="/cadastro"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>
              Cartão Residente
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO SECTION COM FOTO DA CIDADE ── */}
      <section className="relative h-auto min-h-[400px] w-full flex flex-col justify-end pb-12 px-6">
        <div className="absolute inset-0 bg-[#002f40]">
          <Image
            src="https://live.staticflickr.com/65535/54668340687_2c7f6b5c39_4k.jpg"
            alt="Paisagem de São Geraldo do Araguaia"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002f40] via-[#002f40]/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto text-center md:text-left flex flex-col items-center md:items-start pt-20">
          <h1 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-[1.1] md:leading-[0.9] tracking-tight mb-4`}>
            Agências <span className="text-[#F9C400]">Parceiras</span>
          </h1>
          <p className="text-white/80 text-lg font-medium max-w-2xl text-center md:text-left">
            Conheça os operadores turísticos oficiais de São Geraldo do Araguaia e escolha quem vai organizar a sua próxima aventura.
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <ChevronDown size={18} className="animate-bounce" style={{ color: 'rgba(249,196,0,0.35)' }} />
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL (LISTA + FILTROS) ── */}
      <section className="mx-auto max-w-[1400px] px-6 pt-12">
        {/* Botão Filtros Mobile */}
        <div className="lg:hidden mb-6">
           <button onClick={() => setIsMobileFiltersOpen(true)} className="w-full bg-white border border-slate-200 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-slate-700 shadow-sm">
             <Search size={18} /> Buscar Agências
           </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          

          {/* LISTA DE AGÊNCIAS */}
          <div className="flex-1 w-full space-y-8">
            <h2 className={`${jakarta.className} text-3xl font-black text-slate-800 mb-6`}>{agenciasFiltradas.length} Agências Listadas</h2>

            {loading ? (
               <>
                 {[...Array(3)].map((_, i) => <AgenciaCardSkeleton key={i} />)}
               </>
            ) : agenciasFiltradas.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                 <Briefcase size={40} className="mx-auto text-slate-300 mb-4" />
                 <p className="font-bold text-slate-500">Sem resultados para estes filtros.</p>
               </div>
            ) : (
               <>
                 {agenciasFiltradas.map((agencia, index) => {
                    // Decide qual imagem usar (prioriza a logo na listagem)
                    const imagemExibida = agencia.logo_url || agencia.capa_url || FALLBACK_IMAGE;

                    return (
                      <article key={agencia.id} className={`animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all p-4 flex flex-col md:flex-row gap-6 md:gap-10 overflow-hidden`} style={{ animationDelay: `${index * 150}ms` }}>
                         
                         {/* CONTAINER RETANGULAR SEM CORTES (object-contain) */}
                         <div className="relative w-full h-56 md:w-[320px] md:h-auto rounded-3xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100 flex items-center justify-center p-6 group cursor-pointer">
                            <Image 
                              src={imagemExibida} 
                              alt={agencia.nome} 
                              fill 
                              className="object-contain p-6 transition-transform duration-700 group-hover:scale-105" 
                            />
                         </div>

                         {/* TEXTOS E INFORMAÇÕES */}
                         <div className="flex-1 py-4 pr-4 flex flex-col">
                            
                            
                            <h3 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-2`}>{agencia.nome}</h3>
                            
                            {agencia.endereco && (
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-4">
                                <MapPin size={14}/> {agencia.endereco}
                              </div>
                            )}

                            <p className="text-slate-500 font-medium text-sm leading-relaxed line-clamp-2 mb-6">
                              {agencia.descricao_curta || 'Descubra os melhores roteiros e experiências com esta agência parceira oficial do município.'}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mb-8">
                               {agencia.cadastur && (
                                 <span className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                                   Cadastur: {agencia.cadastur}
                                 </span>
                               )}
                               {agencia.instagram && (
                                 <span className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#00577C] flex items-center gap-1.5">
                                   <AtSign size={12} /> {agencia.instagram.replace('https://instagram.com/', '').replace('/', '')}
                                 </span>
                               )}
                            </div>

                            <div className="mt-auto border-t border-slate-100 pt-6 flex flex-col sm:flex-row sm:items-end justify-end gap-4">
                               <Link 
                                 href={`/agencias/${agencia.id}`}
                                 className={`w-full sm:w-auto px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-[#00577C] text-white hover:bg-[#004a6b] shadow-lg hover:shadow-xl hover:-translate-y-1`}
                               >
                                 Ver Pacotes <ArrowRight size={16}/>
                               </Link>
                            </div>
                         </div>
                      </article>
                    );
                 })}
               </>
            )}
          </div>
        </div>
      </section>

      {/* FILTROS MOBILE */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileFiltersOpen(false)} />
           <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-6 pb-10 flex flex-col max-h-[85vh] text-left animate-in slide-in-from-bottom-full">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                 <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 flex items-center gap-2`}><Search size={24} className="text-[#00577C]"/> Buscar</h3>
                 <button onClick={() => setIsMobileFiltersOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><X size={20} /></button>
              </div>
              <div className="overflow-y-auto flex-1 hide-scrollbar">
                 <div className="mb-8">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Nome da Agência</p>
                   <input 
                     type="text" 
                     placeholder="Digite o nome..." 
                     value={termoBusca}
                     onChange={(e) => setTermoBusca(e.target.value)}
                     className="w-full border border-slate-200 rounded-xl px-4 py-4 text-base text-slate-700 outline-none"
                   />
                 </div>
                 <div className="pt-8 border-t border-slate-100">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Segurança</p>
                   <label className="flex items-center gap-3 cursor-pointer group">
                     <input type="checkbox" checked={apenasComCadastur} onChange={()=>setApenasComCadastur(!apenasComCadastur)} className="w-6 h-6 rounded-md border-slate-300 text-[#00577C]" />
                     <span className="text-base font-bold text-slate-600 flex items-center gap-2">
                       Apenas com Cadastur <ShieldCheck size={16} className="text-[#009640]"/>
                     </span>
                   </label>
                 </div>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-auto">
                 <button onClick={() => setIsMobileFiltersOpen(false)} className="w-full bg-[#00577C] text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg">Ver Resultados ({agenciasFiltradas.length})</button>
              </div>
           </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left mt-20">
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
    </div>
  );
}

export default function AgenciasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFCF7]" />}>
      <AgenciasPageContent />
    </Suspense>
  );
}