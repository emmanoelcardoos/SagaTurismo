'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Menu, MapPin, ArrowRight, CalendarDays, Star,
  CheckCircle2, ChevronRight, ShieldCheck, Filter, Compass, Search, X
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
  valor_total: any;
  nome_guia: string;
  categoria?: string;
};

// ── UTILITÁRIOS ──
const parseValor = (valor: any): number => {
  if (!valor) return 0;
  if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;
  let str = String(valor).replace(/[^\d.,]/g, '');
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const formatarDataLocal = (dataStr: string) => {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1740";

export default function PasseiosPage() {
  const [passeios, setPasseios] = useState<Passeio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ── FILTROS ──
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  
  // ── CARROSSEL DO HERO ──
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  
  const categorias = ['Trilha', 'Balneário', 'Cachoeira', 'Ecoturismo', 'Camping', 'Aventura'];

  useEffect(() => {
    async function fetchPasseios() {
      const { data, error } = await supabase
        .from('passeios')
        .select('*')
        .eq('ativo', true)
        .order('data_passeio', { ascending: true });
      if (data) setPasseios(data);
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
      const matchesTermo = p.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
                           (p.descricao_curta && p.descricao_curta.toLowerCase().includes(termoBusca.toLowerCase()));
      const matchesCategoria = categoriasSelecionadas.length === 0 || (p.categoria && categoriasSelecionadas.includes(p.categoria));
      return matchesTermo && matchesCategoria;
    });
  }, [passeios, termoBusca, categoriasSelecionadas]);

  return (
    <main className={`${inter.className} min-h-screen flex flex-col bg-[#FDFCF7] text-slate-900`}>
      {/* Conteúdo principal (tudo excepto o footer) */}
      <div className="flex-1">
        {/* HEADER */}
        <header className="relative z-50 w-full bg-white border-b border-slate-200 py-4">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-3">
               <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
                  <Image src="/logop.png" alt="SagaTurismo" fill className="object-contain" />
               </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {['Hoteis', 'Pacotes', 'Rotas','Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'].map(item => (
                <Link key={item} href={`/${item.toLowerCase()}`} className={`${jakarta.className} text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
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
              <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Rotas Turísticas</Link>
              <Link href="/eventos" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Agenda Cultural</Link>
              <Link href="/pacotes" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Pacotes</Link>
              <Link href="/rotas" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Roteiros</Link>
              <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
              <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
              <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
              <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
            </div>
          )}
        </header>

        {/* ── HERO SECTION (CARROSSEL + SEARCH CARD) ── */}
        <section className="relative h-auto min-h-[500px] w-full flex flex-col justify-end pb-12 px-6">
          <div className="absolute inset-0 bg-[#002f40]">
            {passeios.length > 0 && passeios.map((p, i) => (
              <Image
                key={p.id}
                src={p.imagem_principal || FALLBACK_IMAGE}
                alt="Fundo"
                fill
                className={`object-cover transition-opacity duration-1000 ease-in-out ${
                  i === currentHeroSlide ? 'opacity-50' : 'opacity-0'
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-[#002f40] via-[#002f40]/40 to-transparent" />
          </div>

          <div className="relative z-10 w-full max-w-[1400px] mx-auto text-center md:text-left flex flex-col items-center md:items-start">
            <h1 className={`${jakarta.className} text-5xl md:text-7xl font-black text-white leading-[1.1] md:leading-[0.9] tracking-tight mb-8`}>
              <span className="text-[#F9C400]">Passeios Turísticos</span>
            </h1>

            {/* SEARCH CARD – mesmo estilo da página de hotéis */}
            <div className="relative w-full max-w-4xl bg-white shadow-2xl rounded-2xl md:rounded-2xl">
              <div className="flex flex-col md:flex-row">
                {/* Destino (fixo) */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 md:border-b-0 md:border-r flex-1">
                  <MapPin className="text-[#00577C] shrink-0" size={20} />
                  <div className="flex-1 text-left">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Destino</p>
                    <p className="font-bold text-sm text-slate-800">São Geraldo do Araguaia - PA</p>
                  </div>
                </div>

                {/* Campo de busca (o que procura?) */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 md:border-b-0 flex-1">
                  <Search className="text-[#00577C] shrink-0" size={20} />
                  <div className="flex-1 text-left">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">O que procura?</p>
                    <input
                      type="text"
                      placeholder="Ex: Trilha da Cachoeira, Balneário..."
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      className="w-full font-bold text-sm text-slate-800 outline-none placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Botão Pesquisar */}
                <div className="p-3 md:p-2 bg-white md:bg-transparent flex items-center">
                  <button
                    onClick={() => {}}
                    disabled={loading}
                    className="w-full md:w-auto px-4 md:px-10 py-4 bg-[#F9C400] hover:bg-[#e5b500] text-[#00577C] rounded-xl md:rounded-full font-black text-xs md:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Search size={16} className="md:w-5 md:h-5" />
                    Pesquisar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTEÚDO PRINCIPAL: FILTROS + LISTA */}
        <section className="mx-auto max-w-7xl px-6 pt-12 relative z-20">
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
                 <p className="text-xs text-green-800 font-medium leading-relaxed">Todos os guias responsáveis pelos passeios são credenciados pela Secretaria Municipal de Turismo.</p>
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
                  <button onClick={() => {setTermoBusca(''); setCategoriasSelecionadas([]);}} className="mt-4 text-[#00577C] font-bold underline">Limpar Filtros</button>
                </div>
              ) : (
                passeiosFiltrados.map((passeio) => (
                  <article key={passeio.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row overflow-hidden group">
                    
                    <div className="relative w-full md:w-80 h-64 md:h-auto shrink-0 overflow-hidden bg-slate-100">
                      <Image src={passeio.imagem_principal || FALLBACK_IMAGE} alt={passeio.titulo} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-5 left-5 bg-[#F9C400] text-[#00577C] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                        {passeio.categoria || 'Aventura'}
                      </div>
                    </div>

                    <div className="p-8 flex flex-col flex-1 text-left">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className={`${jakarta.className} text-3xl font-black text-[#00577C] leading-tight hover:underline cursor-pointer mb-2`}>
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

                      <div className="flex flex-wrap items-center gap-4 text-slate-500 mb-8">
                         <span className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                           <Compass size={14} className="text-[#00577C]"/> Guia: {passeio.nome_guia || 'Local'}
                         </span>
                         <span className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                           <CheckCircle2 size={14} className="text-[#00577C]"/> Bate e Volta
                         </span>
                      </div>

                      <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-1">Valor Justo</p>
                           <p className="text-xs font-bold text-slate-500">
                             Apoie o turismo local e os <br/> guias da região.
                           </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Por pessoa</p>
                           <p className={`${jakarta.className} text-4xl font-black text-[#009640] tabular-nums mb-4 leading-none`}>
                             {formatarMoeda(parseValor(passeio.valor_total || 0))}
                           </p>
                           <Link href={`/passeios/${passeio.id}`} className="bg-[#00577C] text-white px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-[#004a6b] transition-all shadow-xl hover:shadow-[#00577C]/20 flex items-center gap-3 hover:translate-x-1">
                             Ver Detalhes <ChevronRight size={20}/>
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

      {/* FOOTER - corrigido para ficar no fundo da página */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          
          {/* Bloco das logos */}
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

          {/* Bloco de contacto e selo */}
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