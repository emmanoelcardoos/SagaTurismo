'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu, MapPin, ShieldCheck, X, ArrowLeft, ArrowRight,
  AtSign, Mail, Phone, Clock, Compass, AlertCircle, Loader2, Briefcase
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
  sobre?: string;
  capa_url?: string;
  logo_url?: string;
  cadastur?: string;
  endereco?: string;
  instagram?: string;
  email?: string;
  whatsapp?: string;
  ativo: boolean;
};

type Pacote = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_principal?: string; // Corrigido para imagem_principal
  duracao?: string;
  preco?: number;
};

// ── COMPONENTE PRINCIPAL ──
function AgenciaIdPageContent() {
  const params = useParams();
  const id = params.id as string;

  const [agencia, setAgencia] = useState<Agencia | null>(null);
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      // 1. Busca os dados da agência
      const { data: agenciaData } = await supabase
        .from('agencias')
        .select('*')
        .eq('id', id)
        .single();

      if (agenciaData) {
        setAgencia(agenciaData as Agencia);
        
        // 2. Busca os pacotes vinculados a esta agência
        const { data: pacotesData } = await supabase
          .from('pacotes')
          .select('*')
          .eq('agencia_id', id)
          .eq('ativo', true);
          
        if (pacotesData) setPacotes(pacotesData as Pacote[]);
      }
      
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const FALLBACK_CAPA = "https://images.unsplash.com/photo-1533240332313-0cb49f47c0a8";
  const FALLBACK_PACOTE = "https://live.staticflickr.com/65535/54668340687_2c7f6b5c39_4k.jpg";

  const menuItens = ['Hoteis', 'Agencias', 'Rotas', 'Passeios', 'Aldeias', 'Eventos', 'Biodiversidade', 'Gastronomia', 'Comunidades'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#00577C]" size={48} />
        <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">A carregar agência...</p>
      </div>
    );
  }

  if (!agencia) {
    return (
      <div className="min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center text-center px-6">
        <AlertCircle size={64} className="text-slate-300 mb-6" />
        <h1 className={`${jakarta.className} text-3xl font-black text-slate-800 mb-4`}>Agência não encontrada</h1>
        <p className="text-slate-500 mb-8 max-w-md">Não conseguimos localizar esta agência. Ela pode ter sido removida ou o link está incorreto.</p>
        <Link href="/agencias" className="bg-[#00577C] text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#004a6b] transition-colors flex items-center gap-2">
          <ArrowLeft size={16} /> Voltar para Agências
        </Link>
      </div>
    );
  }

  const mapQuery = encodeURIComponent(`${agencia.endereco || agencia.nome}, São Geraldo do Araguaia, Pará, Brasil`);
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    // Removido o pb-32 daqui para consertar o footer flutuando
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col`}>
      
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

      {/* ── HERO DA AGÊNCIA (CAPA E LOGO RESTRUTURADOS) ── */}
      <section className="relative w-full bg-white border-b border-slate-100">
        {/* Capa */}
        <div className="relative h-[25vh] md:h-[35vh] min-h-[200px] w-full bg-[#002f40]">
          <Image
            src={agencia.capa_url || FALLBACK_CAPA}
            alt={`Capa da ${agencia.nome}`}
            fill
            className="object-cover opacity-80"
          />
          <div className="absolute top-6 left-6 md:left-12 z-10">
            <Link href="/agencias" className="inline-flex items-center gap-2 bg-white/40 hover:bg-white/60 backdrop-blur-md px-4 py-2 rounded-full text-slate-900 text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
              <ArrowLeft size={14} /> Voltar
            </Link>
          </div>
        </div>

        {/* Informações do Perfil (Layout corrigido: Só a logo sobe) */}
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 pb-10">
            
            {/* Logo puxada pra cima da capa */}
            <div className="-mt-16 md:-mt-24 relative z-10 w-32 h-32 md:w-48 md:h-48 rounded-full border-[6px] border-white bg-white overflow-hidden shadow-md shrink-0 flex items-center justify-center">
              {agencia.logo_url ? (
                <Image src={agencia.logo_url} alt={`Logo ${agencia.nome}`} fill className="object-contain p-3" />
              ) : (
                <Briefcase size={48} className="text-slate-300" />
              )}
            </div>
            
            {/* Textos alinhados normalmente na faixa branca */}
            <div className="pt-2 md:pt-6 flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
            
              </div>
              <h1 className={`${jakarta.className} text-4xl md:text-5xl font-black text-slate-900 leading-tight`}>{agencia.nome}</h1>
              <p className="text-slate-500 font-medium mt-2 max-w-2xl text-sm md:text-base">
                {agencia.descricao_curta || 'Especialistas em criar experiências inesquecíveis em São Geraldo do Araguaia.'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL (SOBRE E PACOTES) + SIDEBAR ── */}
      <section className="flex-1 max-w-[1400px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start w-full">
        
        {/* COLUNA ESQUERDA (Sobre + Pacotes) */}
        <div className="lg:col-span-8 space-y-16">
          
          {/* Sobre a Agência */}
          {agencia.sobre && (
            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100">
              <h2 className={`${jakarta.className} text-2xl font-black text-slate-900 mb-6 flex items-center gap-3`}>
                <Briefcase size={24} className="text-[#00577C]" /> Sobre a Agência
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                {agencia.sobre}
              </div>
            </div>
          )}

          {/* Pacotes da Agência */}
          <div>
            <h2 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-8`}>
              Pacotes Oferecidos ({pacotes.length})
            </h2>

            {pacotes.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
                <Compass size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className={`${jakarta.className} text-xl font-bold text-slate-700 mb-2`}>Nenhum pacote disponível</h3>
                <p className="text-slate-500 text-sm">Esta agência ainda não publicou pacotes na plataforma.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pacotes.map((pacote) => (
                  <Link href={`/pacotes/${pacote.id}`} key={pacote.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col">
                    <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                      <Image 
                        // Corrigido para imagem_principal
                        src={pacote.imagem_principal || FALLBACK_PACOTE} 
                        alt={pacote.titulo} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      {pacote.preco && (
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl font-black text-[#009640] shadow-sm">
                          R$ {pacote.preco.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className={`${jakarta.className} text-lg font-black text-slate-900 mb-2 group-hover:text-[#00577C] transition-colors line-clamp-2`}>
                        {pacote.titulo}
                      </h3>
                      <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed flex-1">
                        {pacote.descricao_curta}
                      </p>
                      <div className="border-t border-slate-100 pt-4 flex items-center justify-between mt-auto">
                        
                        <span className="text-[#00577C] font-black text-[10px] uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Ver Detalhes <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA (Sidebar Contatos e Mapa) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Card de Contato */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 lg:sticky lg:top-28">
            <h3 className={`${jakarta.className} text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4`}>
              Informações de Contato
            </h3>

            <div className="space-y-5 mb-8">
              {agencia.endereco && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-[#00577C]">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Endereço</p>
                    <p className="text-sm font-medium text-slate-700 leading-tight">{agencia.endereco}</p>
                  </div>
                </div>
              )}

              {agencia.email && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-[#00577C]">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">E-mail</p>
                    <a href={`mailto:${agencia.email}`} className="text-sm font-medium text-slate-700 hover:text-[#00577C] break-all">
                      {agencia.email}
                    </a>
                  </div>
                </div>
              )}

              {agencia.instagram && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-[#00577C]">
                    <AtSign size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Instagram</p>
                    <a href={agencia.instagram} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-700 hover:text-[#00577C]">
                      @{agencia.instagram.replace('https://instagram.com/', '').replace('/', '')}
                    </a>
                  </div>
                </div>
              )}

              {agencia.cadastur && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0 text-[#009640]">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Cadastur</p>
                    <p className="text-sm font-black text-slate-700">{agencia.cadastur}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botão WhatsApp */}
            {agencia.whatsapp ? (
              <a 
                href={`https://wa.me/55${agencia.whatsapp.replace(/\D/g, '')}?text=Olá! Encontrei a ${agencia.nome} no portal SagaTurismo e gostaria de mais informações.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#009640] hover:bg-[#007a33] text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-1"
              >
                <Phone size={18} />
                Falar no WhatsApp
              </a>
            ) : (
              <button disabled className="w-full bg-slate-100 text-slate-400 py-4 rounded-xl font-black text-sm uppercase tracking-widest cursor-not-allowed">
                WhatsApp Indisponível
              </button>
            )}

            {/* Mapa do Google Incorporado */}
            <div className="mt-8 pt-6 border-t border-slate-100">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Localização no Mapa</p>
               <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
                 <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight={0} 
                    marginWidth={0} 
                    src={mapsEmbedUrl}
                    title={`Mapa da agência ${agencia.nome}`}
                    className="absolute inset-0"
                 />
               </div>
            </div>

          </div>
        </aside>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-white text-left mt-auto">
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

export default function AgenciaIdPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFCF7]" />}>
      <AgenciaIdPageContent />
    </Suspense>
  );
}