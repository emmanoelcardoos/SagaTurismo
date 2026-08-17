'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, MapPin,
  CheckCircle2, Compass, ShieldCheck, X,
  Map, ChevronLeft, ChevronRight as ChevronRightIcon, ZoomIn, Menu, MessageCircle,
  ChevronDown, Briefcase, AlertCircle
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1740";
const FALLBACK_AGENCIA_LOGO = "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1887";

const getArraySeguro = (item: any): string[] => {
  if (!item) return [];
  if (Array.isArray(item)) return item;
  if (typeof item === 'string') {
    try {
      const parsed = JSON.parse(item);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      if (item.startsWith('{') && item.endsWith('}')) {
        return item.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^"/, '').replace(/"$/, ''));
      }
    }
  }
  return [];
};

const gerarUrlMapa = (coordenadasStr: string) => {
  if (!coordenadasStr) return '';
  if (coordenadasStr.startsWith('http')) return coordenadasStr;
  if (coordenadasStr.includes(',')) {
    const [lat, lon] = coordenadasStr.split(',').map(s => s.trim());
    if (!isNaN(Number(lat)) && !isNaN(Number(lon))) {
      return `https://maps.google.com/maps?q=${lat},${lon}&hl=pt-BR&z=15&output=embed`;
    }
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(coordenadasStr)}&hl=pt-BR&z=15&output=embed`;
};

const gerarLinkWhatsApp = (telefone: string | undefined, mensagem: string) => {
  if (!telefone) return '#';
  let numeroLimpo = telefone.replace(/\D/g, ''); 
  if (numeroLimpo.length < 10) return '#';
  if (!numeroLimpo.startsWith('55')) numeroLimpo = `55${numeroLimpo}`; 
  return `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
};

type Agencia = {
  id: string;
  nome: string;
  descricao_curta: string;
  logo_url: string;
  whatsapp?: string;
  sobre?: string; // pode existir
  capa_url?: string;
  cadastur?: string;
  instagram?: string;
  email?: string;
  endereco?: string;
};

type Passeio = {
  id: string;
  titulo: string;
  descricao_curta: string;
  descricao_completa: string;
  imagem_principal: string;
  imagens_galeria: string[] | string;
  ponto_encontro: string;
  coordenadas_google_maps: string;
  agencia_id: string | null;
  categoria: string;
};

export default function PasseioDetalhePage() {
  const { id } = useParams();
  const router = useRouter();

  const [passeio, setPasseio] = useState<Passeio | null>(null);
  const [agenciaInfo, setAgenciaInfo] = useState<Agencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState<number | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
      if (currentScrollY < 80) setShowHeader(true);
      else if (currentScrollY > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('passeios')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          setErro('Passeio não encontrado.');
          setLoading(false);
          return;
        }
        setPasseio(data as Passeio);

        // Se o passeio tiver uma agência associada, buscamos os dados dela
        if (data.agencia_id) {
          const { data: agData, error: agError } = await supabase
            .from('agencias')
            .select('*')
            .eq('id', data.agencia_id)
            .single();
            
          if (!agError && agData) {
            setAgenciaInfo(agData as Agencia);
          } else {
            console.warn('Agência não encontrada para o ID:', data.agencia_id);
            // Não definimos erro, apenas mantemos agenciaInfo como null
          }
        } else {
          console.warn('Este passeio não tem agencia_id definido.');
        }
      } catch (err) {
        console.error("Falha ao carregar passeio:", err);
        setErro('Ocorreu um erro inesperado ao carregar o passeio.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id, router]);

  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: [ 'Eventos', 'Comunidades'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  const galeriaCombinada = passeio ? [
    ...(passeio.imagem_principal ? [passeio.imagem_principal] : []),
    ...getArraySeguro(passeio.imagens_galeria)
  ] : [];

  const fecharGaleria = () => setFotoExpandidaIndex(null);
  const proximaFoto = (e: React.MouseEvent) => { e.stopPropagation(); setFotoExpandidaIndex((prev) => (prev! + 1) % galeriaCombinada.length); };
  const fotoAnterior = (e: React.MouseEvent) => { e.stopPropagation(); setFotoExpandidaIndex((prev) => (prev! - 1 + galeriaCombinada.length) % galeriaCombinada.length); };

  if (!mounted || loading) {
    return (
      <div className={`${inter.className} min-h-screen flex flex-col items-center justify-center bg-white text-[#00577C]`}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold uppercase tracking-widest text-xs">Preparando expedição...</p>
      </div>
    );
  }

  if (erro || !passeio) {
    return (
      <div className={`${inter.className} min-h-screen flex flex-col items-center justify-center bg-[#FDFCF7] text-center px-6`}>
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className={`${jakarta.className} text-3xl font-black text-slate-800 mb-4`}>Passeio não disponível</h1>
        <p className="text-slate-500 mb-6 max-w-md">{erro || 'Este passeio pode ter sido removido ou o link está incorreto.'}</p>
        <Link href="/passeios" className="bg-[#00577C] text-white px-6 py-3 rounded-full text-sm font-bold transition-colors hover:bg-[#004a6b]">
          Voltar aos passeios
        </Link>
      </div>
    );
  }

  return (
    <div className={`${inter.className} min-h-screen flex flex-col bg-[#FDFCF7] text-slate-900`}>

      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-slate-200'}`}>
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
            <Link href="/cadastro" className={`hidden lg:inline-flex ${jakarta.className} bg-[#F9C400] text-[#002f40] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-sm`}>
              Residente
            </Link>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden bg-slate-50 text-[#00577C] hover:bg-slate-100 transition-colors">
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-6 shadow-2xl lg:hidden z-50 max-h-[85vh] overflow-y-auto">
            <Link href="/passeios" className={`${jakarta.className} font-black text-slate-700 text-lg border-b border-slate-100 pb-2`}>← Voltar aos Passeios</Link>
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
            <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-3">
              <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md`}>
                Cartão Residente
              </Link>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1">
        <div className="w-full h-[40vh] md:h-[60vh] relative bg-[#002f40] overflow-hidden mt-[72px] md:mt-[80px]">
          <Link href="/passeios" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-bold text-slate-800 bg-white/90 backdrop-blur-sm hover:bg-white px-4 py-2 rounded-full shadow-lg transition-colors">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <Image
            src={passeio.imagem_principal || FALLBACK_IMAGE}
            alt={passeio.titulo}
            fill
            className="object-cover opacity-80"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002f40]/90 via-[#002f40]/40 to-transparent" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-5 py-12 flex flex-col lg:flex-row items-start gap-12 relative z-10 -mt-20">
          <div className="flex-1 w-full min-w-0 flex flex-col gap-10">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="bg-[#F9C400] text-[#00577C] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {passeio.categoria || 'Aventura'}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                  <MapPin size={15} className="text-[#009640]" /> São Geraldo do Araguaia, PA
                </span>
              </div>

              <h1 className={`${jakarta.className} text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-8`}>
                {passeio.titulo}
              </h1>

              {passeio.ponto_encontro && (
                <div className="mb-10 border-t border-b border-slate-100 py-6">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                     <MapPin size={14} className="text-[#00577C]"/> Ponto de Encontro da Expedição
                   </p>
                   <p className="font-bold text-slate-800 leading-tight">{passeio.ponto_encontro}</p>
                </div>
              )}

              <div className="mb-8">
                <h3 className={`${jakarta.className} text-2xl font-black text-[#00577C] mb-4`}>Sobre a Experiência</h3>
                <p className="text-lg text-slate-500 italic font-medium border-l-4 border-[#009640] pl-5 mb-6">{passeio.descricao_curta}</p>
                <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                  {passeio.descricao_completa || "Junte-se a nós numa aventura inesquecível pelas belezas naturais e culturais da nossa região. Garantimos segurança, acompanhamento e momentos que ficarão na memória."}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[420px] shrink-0 lg:self-start">
            <div className="lg:sticky lg:top-32 space-y-6">

              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200">
                <h3 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-2`}>
                   Pronto para a Aventura?
                </h3>
                <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
                  Entre em contacto direto com a agência parceira para verificar as condições, consultar os valores e agendar a sua expedição.
                </p>

                <a 
                  href={gerarLinkWhatsApp(agenciaInfo?.whatsapp || '550000000000', `Olá! Vi o passeio "${passeio.titulo}" no Portal Oficial de Turismo de São Geraldo do Araguaia e gostaria de mais informações.`)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`${jakarta.className} w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2`}
                >
                  <MessageCircle size={24} /> Falar no WhatsApp
                </a>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5"><ShieldCheck size={14} className="text-[#009640]" /> Turismo Transparente</p>
                  <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">O Portal Municipal atua como vitrine para fortalecer o turismo local. A negociação e o pagamento são feitos diretamente e de forma segura com os parceiros credenciados.</p>
                </div>
              </div>

              {/* ── CARD DA AGÊNCIA (AGORA COM DADOS REAIS E FALLBACKS MELHORES) ── */}
              <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-200">
                <h3 className={`${jakarta.className} text-xl font-black text-slate-900 mb-5 flex items-center gap-2`}>
                  <Briefcase size={22} className="text-[#00577C]" />
                  Agência Parceira
                </h3>
                <div className="flex flex-col items-center text-center">
                  {agenciaInfo ? (
                    <>
                      <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-sm border-4 border-slate-50 mb-4 bg-white flex items-center justify-center">
                        {agenciaInfo.logo_url ? (
                          <img 
                            src={agenciaInfo.logo_url} 
                            alt={agenciaInfo.nome}
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              // Se a imagem falhar, substitui pelo ícone
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentNode;
                              if (parent) {
                                const icon = document.createElement('span');
                                icon.className = 'text-slate-300';
                                icon.innerHTML = '<svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>';
                                parent.appendChild(icon);
                              }
                            }}
                          />
                        ) : (
                          <Briefcase size={40} className="text-slate-300" />
                        )}
                      </div>
                      <h4 className={`${jakarta.className} text-xl font-black text-slate-800`}>
                        {agenciaInfo.nome}
                      </h4>
                      <p className="text-slate-500 text-sm leading-relaxed mt-3 mb-5 text-center line-clamp-3">
                        {agenciaInfo.descricao_curta || 'Especialistas em criar experiências inesquecíveis em São Geraldo do Araguaia.'}
                      </p>
                      <Link href={`/agencias/${agenciaInfo.id}`} className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#00577C] text-xs font-black uppercase tracking-widest py-3.5 rounded-xl transition-colors block text-center">
                        Ver Perfil Completo
                      </Link>
                    </>
                  ) : (
                    <div className="py-6">
                      <Briefcase size={40} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-500">Esta agência não está disponível no momento.</p>
                      <p className="text-xs text-slate-400 mt-2">ID do passeio: {passeio.id}</p>
                    </div>
                  )}
                </div>
              </div>

              {passeio.coordenadas_google_maps && (
                <div className="bg-white p-5 rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#00577C] flex items-center gap-2">
                      <MapPin size={14} className="text-[#009640]" /> Ponto de Encontro
                    </p>
                    <Map className="text-slate-300" size={18}/>
                  </div>
                  <div className="w-full h-[200px] rounded-2xl overflow-hidden bg-slate-100 relative pointer-events-none sm:pointer-events-auto border border-slate-100">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={gerarUrlMapa(passeio.coordenadas_google_maps)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {galeriaCombinada.length > 0 && (
          <div className="mx-auto w-full max-w-7xl px-5 pb-20 relative z-10">
            <div className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-xl border border-slate-100">
              <h3 className={`${jakarta.className} text-3xl font-black text-[#00577C] mb-8 flex items-center gap-3`}>
                <ZoomIn className="text-[#F9C400]" size={28} />
                Galeria de Imagens
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {galeriaCombinada.slice(0, 12).map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setFotoExpandidaIndex(idx)}
                    className={`relative rounded-2xl overflow-hidden shadow-sm group bg-slate-200 cursor-pointer ${
                      idx === 0 ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2 aspect-square' : 'aspect-square'
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`Galeria ${idx + 1}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-[#00577C]/0 group-hover:bg-[#00577C]/40 transition-colors duration-300 flex items-center justify-center">
                      <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-10 h-10 scale-50 group-hover:scale-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {fotoExpandidaIndex !== null && galeriaCombinada.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-5 animate-in fade-in duration-200"
          onClick={fecharGaleria}
        >
          <button onClick={fecharGaleria} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
            <X size={24} />
          </button>
          <button onClick={fotoAnterior} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
            <ChevronLeft size={32} />
          </button>
          <div
            className="relative w-full max-w-6xl aspect-video rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image src={galeriaCombinada[fotoExpandidaIndex]} alt={`Visualização ${fotoExpandidaIndex + 1}`} fill className="object-contain" />
          </div>
          <button onClick={proximaFoto} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
            <ChevronRightIcon size={32} />
          </button>
          <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
            <p className="text-white font-bold tracking-widest text-sm bg-black/60 inline-block px-5 py-2 rounded-full backdrop-blur-sm">
              {fotoExpandidaIndex + 1} de {galeriaCombinada.length}
            </p>
          </div>
        </div>
      )}

      <footer className="py-20 px-8 border-t border-slate-200 bg-[#FDFCF7] text-left mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de SGA" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1 text-center md:text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                © 2026 Secretaria Municipal de Turismo - SGA
              </p>
              <p className="text-[10px] font-bold text-slate-400/80">
                CNPJ: 10.249.241/0001-22
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}