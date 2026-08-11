'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  ArrowLeft, MapPin, Star, CheckCircle2, 
  Loader2, Menu, X, Bed, Users, Phone, Mail, Globe,
  MessageCircle, Image as ImageIcon, ShieldCheck
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── UTILITÁRIOS ──
const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

// ── TIPOS ──
type QuartoFisico = {
  id: string;
  nome_quarto: string;
  preco_quarto: number;
  descricao: string;
  capacidade: number;
  imagem_url: string;
};

type Hotel = {
  id: string; 
  nome: string; 
  tipo: string; 
  descricao: string; 
  estrelas: number; 
  imagem_url: string;
  endereco?: string; 
  whatsapp?: string;
  comodidades?: string[]; 
  galeria?: string[];
  contatos?: {
    telefone?: string; email?: string; website?: string;
  };
};

// ── FUNÇÃO MÁGICA DO WHATSAPP ──
const gerarLinkWhatsApp = (telefone: string | undefined, mensagem: string) => {
  if (!telefone) return '#';
  let numeroLimpo = telefone.replace(/\D/g, ''); 
  if (numeroLimpo.length < 10) return '#';
  if (!numeroLimpo.startsWith('55')) numeroLimpo = `55${numeroLimpo}`; 
  
  return `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
};

function HotelDetalheContent() {
  const { id } = useParams();

  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ── DADOS DO BANCO ──
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [quartosDb, setQuartosDb] = useState<QuartoFisico[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // ── ESTADOS DO FORMULÁRIO DE AVALIAÇÃO ──
  const [nomeAutor, setNomeAutor] = useState('');
  const [nacionalidade, setNacionalidade] = useState('BR');
  const [notaForm, setNotaForm] = useState<number>(10);
  const [comentario, setComentario] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [mensagemAvaliacao, setMensagemAvaliacao] = useState('');

  const handleEnviarAvaliacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeAutor || !comentario) return;
    setEnviandoAvaliacao(true);
    
    try {
      const { data, error } = await supabase.from('avaliacoes_hoteis').insert([{
        hotel_id: id,
        nome_autor: nomeAutor,
        nacionalidade: nacionalidade,
        nota: notaForm,
        comentario: comentario
      }]).select();
      
      if (error) throw error;
      
      if (data) setAvaliacoes([data[0], ...avaliacoes]);
      setMensagemAvaliacao('Avaliação publicada com sucesso! Obrigado.');
      setNomeAutor(''); setComentario(''); setNotaForm(10);
      setTimeout(() => setMensagemAvaliacao(''), 5000);
    } catch (err) {
      setMensagemAvaliacao('Erro ao publicar avaliação. Tente novamente.');
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // CARREGAMENTO INICIAL: HOTEL, QUARTOS E AVALIAÇÕES
  useEffect(() => {
    async function fetchHotelEQuartos() {
      try {
        const { data: hotelData, error: hotelError } = await supabase.from('hoteis').select('*').eq('id', id).single();
        if (hotelError) throw new Error("Erro ao buscar a hospedagem.");
        
        const { data: quartosData, error: quartosError } = await supabase.from('tipos_quarto').select('*').eq('hotel_id', id).order('preco_quarto', { ascending: true });
        if (quartosError) throw new Error("Erro ao mapear o inventário de quartos.");

        const { data: avaliacoesData } = await supabase.from('avaliacoes_hoteis').select('*').eq('hotel_id', id).order('criado_em', { ascending: false });

        if (hotelData) {
          setHotel(hotelData);
          setQuartosDb(quartosData || []);
          setAvaliacoes(avaliacoesData || []);
        } else {
          setErro("Hospedagem não encontrada.");
        }
      } catch (err: any) {
        setErro(err.message || "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchHotelEQuartos();
  }, [id]);

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

  const notaMedia = avaliacoes.length > 0 
    ? (avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoes.length).toFixed(1) 
    : 'N/A';

  const imagensGaleria = hotel?.galeria?.length 
    ? hotel.galeria 
    : [hotel?.imagem_url, ...quartosDb.map(q => q.imagem_url)].filter(Boolean).slice(0, 5);

  if (!mounted || loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]">
      <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin mb-4 text-[#00577C]" />
      <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs">A carregar informações da hospedagem...</p>
    </div>
  );

  if (erro || !hotel) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-6 text-center">
      <h1 className="text-2xl md:text-3xl font-black mb-4 text-[#00577C]">Alojamento Não Encontrado</h1>
      <p className="text-slate-500 mb-8 max-w-md text-sm md:text-base">{erro}</p>
      <Link href="/hoteis" className="bg-[#00577C] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg">Voltar aos Hotéis</Link>
    </div>
  );

  return (
    <div className={`${inter.className} min-h-screen bg-[#F5F7FA] text-slate-900 flex flex-col`}>
      
      {/* ── HEADER ── */}
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
            <Link href="/roteiro" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Roteiros</Link>
            <Link href="/biodiversidade" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Biodiversidade</Link>
            <Link href="/gastronomia" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Gastronomia</Link>
            <Link href="/comunidades" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>Comunidades</Link>
            <Link href="/cadastro" className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md mt-2`}>Cartão Residente</Link>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <div className="w-full h-[60vh] md:h-[60vh] relative bg-[#002f40]">
        <Link href="/hoteis" className="absolute top-4 md:top-6 left-4 md:left-6 z-20 flex items-center gap-2 text-xs md:text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-lg transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <Image src={hotel.imagem_url} alt={hotel.nome} fill className="object-cover opacity-70" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-6 md:bottom-10 left-5 md:left-16 z-20 text-left pr-5">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
             <span className="bg-[#F9C400] text-[#00577C] px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-md">{hotel.tipo}</span>
             <div className="flex gap-0.5 md:gap-1">
                {Array.from({ length: hotel.estrelas }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 md:h-4 md:w-4 fill-[#F9C400] text-[#F9C400]" />)}
             </div>
          </div>
          <h1 className={`${jakarta.className} text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg`}>{hotel.nome}</h1>
        </div>
      </div>

      {/* ── ESTRUTURA PRINCIPAL ── */}
      <div className="mx-auto w-full max-w-7xl px-4 md:px-5 py-8 md:py-12 flex flex-col gap-10 md:gap-14 relative z-10">
        
        {/* LINHA 1: ACOMODAÇÕES + WHATSAPP */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          
          <div className="flex-1 w-full min-w-0">
            {/* ── ACOMODAÇÕES (Catálogo) ── */}
            <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden text-left">
               <div className="bg-slate-50 p-5 md:p-6 border-b border-slate-200">
                 <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-[#00577C]`}>Acomodações Oferecidas</h3>
                 <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Conheça as opções de quartos disponíveis neste estabelecimento.</p>
               </div>
               
               <div className="p-4 md:p-6 flex flex-col gap-6 md:gap-8">
                  {quartosDb.length === 0 ? (
                    <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-500 font-bold text-sm">A lista de quartos não está disponível no momento.</p>
                    </div>
                  ) : (
                    quartosDb.map((quarto) => (
                      <div key={quarto.id} className="border border-slate-200 rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-sm flex flex-col bg-white">
                         <div className="flex justify-between items-center p-4 md:p-5 bg-slate-50 border-b border-slate-200">
                           <h4 className={`${jakarta.className} font-black text-base md:text-lg text-[#00577C] uppercase`}>{quarto.nome_quarto}</h4>
                         </div>
                         
                         <div className="flex flex-col xl:flex-row">
                            <div className="w-full xl:w-3/5 p-4 md:p-5 border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col">
                               <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 md:mb-4 bg-slate-200">
                                  <Image src={quarto.imagem_url || hotel.imagem_url} alt={quarto.nome_quarto} fill className="object-cover" />
                               </div>
                               <p className="text-xs text-slate-500 mb-4 leading-relaxed">{quarto.descricao || 'Acomodação confortável e equipada para garantir o seu bem-estar.'}</p>
                               <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs text-[#00577C] font-bold mt-auto">
                                  <span className="flex items-center gap-1.5"><Users size={12}/> Capacidade: {quarto.capacidade} pessoa(s)</span>
                                  <span className="flex items-center gap-1.5"><Bed size={12}/> Camas Confortáveis</span>
                               </div>
                            </div>
                            
                            <div className="w-full xl:w-2/5 flex flex-col">
                               <div className="flex-1 p-6 flex flex-col justify-center items-center xl:items-end bg-slate-50/50">
                                  <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Preços a partir de</p>
                                  <p className={`${jakarta.className} text-2xl md:text-4xl font-black text-[#009640] leading-none`}>
                                    {formatarMoeda(quarto.preco_quarto)}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-bold mt-2">por diária</p>
                               </div>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </section>
          </div>

          {/* ◄── CARD WHATSAPP (LATERAL DIREITA) ──► */}
          <div className="w-full lg:w-[380px] shrink-0 h-fit lg:self-start relative z-30">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-200 text-left lg:sticky lg:top-28">
               <h3 className={`${jakarta.className} text-xl font-black text-slate-900 mb-2`}>
                  Interessado no Alojamento?
               </h3>
               <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
                 Entre em contacto direto com o proprietário para verificar a disponibilidade de quartos, consultar valores e tirar dúvidas.
               </p>

               <a 
                 href={gerarLinkWhatsApp(hotel.whatsapp || hotel.contatos?.telefone, `Olá! Vi o "${hotel.nome}" no Portal Oficial de Turismo de São Geraldo do Araguaia e gostaria de consultar a disponibilidade.`)} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className={`${jakarta.className} w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 md:py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2`}
               >
                 <MessageCircle size={22} /> Falar no WhatsApp
               </a>

               <div className="mt-6 text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Turismo Transparente</p>
                 <p className="text-[11px] text-slate-500 mt-2">O Portal Municipal não cobra taxas. A negociação é feita diretamente consigo e o proprietário.</p>
               </div>
            </div>
          </div>
        </div>

        {/* LINHA 2: GALERIA DE IMAGENS (FULL WIDTH) */}
        {imagensGaleria.length > 0 && (
          <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm p-5 md:p-10 text-left w-full">
            <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-[#00577C] mb-6 flex items-center gap-2`}>
              <ImageIcon size={24} className="text-[#F9C400]" /> Galeria de Fotos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {imagensGaleria.map((img, i) => (
                <div key={i} className={`relative rounded-xl overflow-hidden bg-slate-100 ${i === 0 ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2 aspect-square' : 'aspect-square'}`}>
                  <Image src={img as string} alt={`Galeria ${i+1}`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LINHA 3: AVALIAÇÕES E CONTATOS (ALINHADOS À ESQUERDA) */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="flex-1 w-full min-w-0 flex flex-col gap-8 md:gap-10">
            
            {/* ── AVALIAÇÕES REAIS ABERTAS ── */}
            <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm p-5 md:p-10 text-left">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                 <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-[#00577C]`}>Avaliações dos hóspedes</h3>
                 <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <div className="bg-[#F9C400] text-[#00577C] text-xl font-black rounded-xl w-12 h-10 flex items-center justify-center shadow-sm">
                       {notaMedia}
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Média Geral</p>
                       <p className="text-xs font-bold text-slate-700">{avaliacoes.length} avaliações validadas</p>
                    </div>
                 </div>
               </div>
               
               <div className="flex flex-col lg:flex-row gap-10">
                  {/* LISTA DE COMENTÁRIOS DA COMUNIDADE */}
                  <div className="w-full lg:w-3/5 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                     {avaliacoes.length === 0 ? (
                        <p className="text-sm font-medium text-slate-400 italic bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">Seja o primeiro a avaliar esta acomodação!</p>
                     ) : (
                        avaliacoes.map((av) => (
                          <div key={av.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:bg-slate-100 transition-colors">
                             <div className="flex justify-between items-start mb-3">
                                <div>
                                   <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                      {av.nome_autor}
                                      <span className="text-lg" title="Nacionalidade">
                                        {av.nacionalidade === 'BR' ? '🇧🇷' : av.nacionalidade === 'PT' ? '🇵🇹' : av.nacionalidade === 'US' ? '🇺🇸' : '🌍'}
                                      </span>
                                   </p>
                                   <p className="text-[10px] text-slate-400 font-bold">{new Date(av.criado_em).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm text-xs font-black text-[#00577C]">
                                  <Star size={12} className="fill-[#F9C400] text-[#F9C400]"/> {av.nota}
                                </div>
                             </div>
                             <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">"{av.comentario}"</p>
                          </div>
                        ))
                     )}
                  </div>

                  {/* FORMULÁRIO PÚBLICO DE AVALIAÇÃO */}
                  <div className="w-full lg:w-2/5 border-t lg:border-t-0 lg:border-l border-slate-100 pt-8 lg:pt-0 lg:pl-8">
                     <h4 className={`${jakarta.className} text-base font-black text-slate-800 mb-4`}>Deixe a sua avaliação</h4>
                     <form onSubmit={handleEnviarAvaliacao} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Seu Nome</label>
                          <input required type="text" value={nomeAutor} onChange={e => setNomeAutor(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#00577C]" placeholder="Como deseja ser chamado?" />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">País</label>
                            <select value={nacionalidade} onChange={e => setNacionalidade(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#00577C]">
                              <option value="BR">🇧🇷 Brasil</option>
                              <option value="PT">🇵🇹 Portugal</option>
                              <option value="US">🇺🇸 Estados Unidos</option>
                              <option value="OUTRO">🌍 Outro</option>
                            </select>
                          </div>
                          <div className="w-24">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Nota (1 a 10)</label>
                            <input required type="number" min="1" max="10" value={notaForm} onChange={e => setNotaForm(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-center text-[#00577C] outline-none focus:border-[#00577C]" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Comentário</label>
                          <textarea required value={comentario} onChange={e => setComentario(e.target.value)} rows={3} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#00577C]" placeholder="Conte-nos como foi a sua estadia..." />
                        </div>
                        <button type="submit" disabled={enviandoAvaliacao} className="w-full bg-[#00577C] hover:bg-[#004466] text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-md disabled:opacity-50 active:scale-95">
                           {enviandoAvaliacao ? 'A Publicar...' : 'Publicar Avaliação'}
                        </button>
                        {mensagemAvaliacao && <p className="text-[11px] font-black text-[#009640] text-center uppercase tracking-wider">{mensagemAvaliacao}</p>}
                     </form>
                  </div>
               </div>
            </section>

            {/* ── INFORMAÇÕES DE CONTATO REAIS DO BANCO DE DADOS ── */}
            <section className="bg-[#002f40] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden text-left shadow-xl">
               <div className="absolute -right-10 -top-10 opacity-5"><Globe size={200}/></div>
               <h3 className={`${jakarta.className} text-xl md:text-2xl font-black mb-2 relative z-10`}>Informações de Contato</h3>
               <p className="text-xs text-white/60 mb-6 relative z-10">Fale diretamente com o estabelecimento oficial.</p>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/20 transition-colors">
                    <Phone className="text-[#F9C400] mb-3" size={24} />
                    <p className="text-[10px] text-white/50 uppercase tracking-widest">WhatsApp / Telefone</p>
                    <p className="font-bold text-sm truncate mt-1">
                      {hotel.whatsapp || hotel.contatos?.telefone || 'Não informado'}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/20 transition-colors">
                    <Mail className="text-[#F9C400] mb-3" size={24} />
                    <p className="text-[10px] text-white/50 uppercase tracking-widest">E-mail Oficial</p>
                    <p className="font-bold text-sm truncate mt-1">
                      {hotel.contatos?.email || 'Não informado'}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/20 transition-colors">
                    <Globe className="text-[#F9C400] mb-3" size={24} />
                    <p className="text-[10px] text-white/50 uppercase tracking-widest">Website</p>
                    <p className="font-bold text-sm truncate mt-1">
                      {hotel.contatos?.website || 'Não informado'}
                    </p>
                  </div>
               </div>
            </section>
          </div>
          
          {/* DIV FANTASMA para manter o alinhamento da esquerda face ao Topo */}
          <div className="hidden lg:block w-[380px] shrink-0"></div>
        </div>

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
    </div>
  );
}

export default function HotelDetalhePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#00577C]" />
        <p className="font-bold uppercase tracking-widest text-xs">A Sincronizar catálogo...</p>
      </div>
    }>
      <HotelDetalheContent />
    </Suspense>
  );
}