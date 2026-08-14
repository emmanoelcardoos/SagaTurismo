'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { 
  MapPin, Menu, Ticket, CalendarDays, Loader2, X, Clock, Info, Navigation, ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// ── FONTES PADRÃO DO SITE ──
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

// ── TIPAGEM ──
type Evento = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  imagem_url: string;
  categoria: string;
  horario?: string;
  duracao?: string;
  preco?: string;
  classificacao?: string;
  link_bilheteira?: string;
};

export default function EventoDetalhePage({ params }: { params: { id: string } }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // FETCH REAL NA SUPABASE
  useEffect(() => {
    async function fetchEventoReal() {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', params.id)
          .single(); 

        if (error) throw new Error("Erro ao buscar o evento na base de dados.");
        if (data) setEvento(data);
        else setErro("Evento não encontrado.");
      } catch (err: any) {
        setErro(err.message || "Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) fetchEventoReal();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#002f40] text-white">
        <Loader2 className="w-16 h-16 animate-spin mb-6 text-[#F9C400]" />
        <p className={`${jakarta.className} font-black uppercase tracking-widest text-sm`}>Carregando evento...</p>
      </div>
    );
  }

  if (erro || !evento) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF7] text-slate-900 px-6 text-center">
        <CalendarDays className="w-20 h-20 text-slate-300 mb-6" />
        <h1 className={`${jakarta.className} text-5xl font-black mb-4 text-[#00577C]`}>Evento Indisponível</h1>
        <p className="text-slate-500 mb-10 max-w-md text-lg">{erro || "Não foi possível carregar os detalhes do evento solicitado."}</p>
        <Link href="/eventos" className="bg-[#F9C400] text-[#00577C] px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 transition-transform">
          Voltar à Agenda
        </Link>
      </div>
    );
  }

  // Formatação de Datas
  const dataObj = new Date(evento.data + 'T00:00:00'); 
  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const diaSemana = diasSemana[dataObj.getDay()];
  const diaMes = String(dataObj.getDate()).padStart(2, '0');
  const mesExtenso = meses[dataObj.getMonth()];
  const ano = dataObj.getFullYear();

  // ── MENU GROUPS ──
  const menuGroups = [
    { label: 'Conhecer', links: ['Atrativos', 'Rotas', 'História', 'Biodiversidade', 'Galeria'] },
    { label: 'Viver', links: ['Passeios', 'Eventos', 'Comunidades', 'Aldeias'] },
    { label: 'Planejar', links: ['Hotéis', 'Gastronomia', 'Agências', 'Informações', 'Parceiros'] }
  ];

  return (
    <main className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 overflow-x-hidden`}>
      
      {/* ── HEADER EDITORIAL (CENTRALIZADO & DROPDOWN) ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all duration-500">
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

        {/* Menu Mobile */}
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
            <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-3">
              <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} bg-[#F9C400] text-[#002f40] font-black px-4 py-4 rounded-xl text-center uppercase tracking-widest text-xs shadow-md`}>
                Cartão Residente
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION (MANTIDA IGUAL AO ORIGINAL) ── */}
      <section className="relative h-[50vh] md:h-[70vh] flex items-end pb-14 overflow-hidden bg-[#002f40] mt-[72px] md:mt-[80px]">
        {evento.imagem_url ? (
          <Image 
            src={evento.imagem_url} 
            alt={evento.titulo} 
            fill 
            className="object-cover opacity-90" 
            priority 
          />
        ) : (
          <div className="absolute inset-0 bg-[#00577C] opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#002f40] via-[#002f40]/40 to-transparent" />
        
        <div className="relative z-10 max-w-[1400px] mx-auto w-full px-6 pb-16 lg:pb-24">
          <br />
          {evento.categoria && (
            <span className={`${jakarta.className} inline-block bg-[#F9C400] text-[#002f40] px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest mb-4 shadow-lg`}>
              {evento.categoria}
            </span>
          )}
          
          <h1 className={`${jakarta.className} text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight max-w-4xl drop-shadow-2xl`}>
            {evento.titulo}
          </h1>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <section className="relative z-20 bg-[#FDFCF7] -mt-16 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] py-20 px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Lado Esquerdo: Barra de Informações */}
          <aside className="w-full lg:w-[350px] shrink-0">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 lg:-mt-32 relative z-30">
              
              {/* Data */}
              <div className="flex items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                 <div className="text-center">
                    <p className={`${jakarta.className} text-5xl md:text-6xl font-black text-[#009640] leading-none tracking-tighter`}>{diaMes}</p>
                    <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2`}>{mesExtenso}</p>
                 </div>
                 <div className="w-px h-16 bg-slate-100" />
                 <div>
                    <p className={`${jakarta.className} font-bold text-slate-900`}>{diaSemana}</p>
                    <p className="text-sm font-medium text-slate-500">{ano}</p>
                 </div>
              </div>

              {/* Informações Rápidas */}
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#00577C]/5 flex items-center justify-center text-[#00577C] shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-slate-400`}>Horário</p>
                    <p className={`${jakarta.className} font-bold text-slate-900 mt-1`}>{evento.horario || 'Consulte o programa'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F9C400]/10 flex items-center justify-center text-[#d9a000] shrink-0">
                    <Info size={18} />
                  </div>
                  <div>
                    <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-slate-400`}>Duração & Preço</p>
                    <p className={`${jakarta.className} font-bold text-slate-900 mt-1`}>{evento.duracao || 'N/D'} • {evento.preco || 'Gratuito'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#009640]/10 flex items-center justify-center text-[#009640] shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-widest text-slate-400`}>Classificação</p>
                    <p className={`${jakarta.className} font-bold text-slate-900 mt-1`}>{evento.classificacao || 'Livre / Todas as idades'}</p>
                  </div>
                </div>
              </div>

              {/* Botão de Bilheteira */}
              {evento.link_bilheteira && (
                <div className="mt-10 pt-10 border-t border-slate-100">
                  <Link 
                    href={evento.link_bilheteira} 
                    target="_blank"
                    className={`${jakarta.className} w-full flex items-center justify-center gap-3 bg-[#00577C] text-white px-8 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#004a6b] hover:shadow-lg transition-all`}
                  >
                    <Ticket size={18} /> Obter Bilhete
                  </Link>
                </div>
              )}
            </div>
          </aside>

          {/* Lado Direito: Descrição e Mapa */}
          <div className="flex-1 max-w-4xl space-y-20">
            
            {/* Seção Sobre o Evento */}
            <div>
              <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-8 flex items-center gap-4`}>
                <span className="w-8 h-1 bg-[#F9C400] rounded-full" /> Sobre o Evento
              </h2>
              <div className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                {evento.descricao || "Este evento não possui descrição detalhada no momento. Para mais informações, contate a Secretaria Municipal de Turismo."}
              </div>
            </div>

            {/* Seção Localização - com fundo soft (cor alterada) */}
            <div>
              <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-8 flex items-center gap-4`}>
                <span className="w-8 h-1 bg-[#009640] rounded-full" /> Onde Vai Acontecer
              </h2>
              
              <div className="bg-white p-4 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col md:flex-row gap-6">
                
                {/* Informação do Local - fundo soft (azul claro) */}
                <div className="w-full md:w-1/3 bg-[#E8F0F5] rounded-[2rem] p-8 text-slate-800 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#00577C]/10 rounded-full blur-[40px] pointer-events-none" />
                  <MapPin className="w-12 h-12 text-[#00577C] mb-6 relative z-10" />
                  <p className={`${jakarta.className} text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 relative z-10`}>Localização</p>
                  <p className={`${jakarta.className} text-2xl md:text-3xl font-black mb-6 relative z-10`}>{evento.local || 'São Geraldo do Araguaia'}</p>
                  <Link href={`https://maps.google.com/maps?q=${encodeURIComponent((evento.local || '') + ' São Geraldo do Araguaia, Pará')}`} target="_blank" className={`${jakarta.className} inline-flex items-center gap-2 text-[#00577C] font-bold text-xs uppercase tracking-widest relative z-10 hover:gap-4 transition-all`}>
                    Obter Direções <Navigation size={14} />
                  </Link>
                </div>

                {/* Google Maps iframe */}
                <div className="w-full md:w-2/3 h-[300px] md:h-auto rounded-[2rem] overflow-hidden bg-slate-100">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent((evento.local || 'São Geraldo do Araguaia') + ', Pará, Brasil')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  ></iframe>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ── FOOTER INSTITUCIONAL INTEGRADO ── */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-[#FDFCF7] text-left mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              <Image src="/logop.png" alt="SagaTurismo" width={160} height={50} className="object-contain" />
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <Image src="/prefeitura.png" alt="Prefeitura de São Geraldo do Araguaia" width={140} height={50} className="object-contain" />
            </div>
            <div className="text-left space-y-1 text-center md:text-left">
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