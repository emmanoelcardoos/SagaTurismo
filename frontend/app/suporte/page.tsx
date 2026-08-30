'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase'; // ◄── IMPORTAÇÃO DO SUPABASE ADICIONADA
import { 
  Menu, X, ChevronDown, User, Mail, Phone, 
  FileText, UploadCloud, ArrowRight, CheckCircle2, 
  AlertCircle, ShieldCheck 
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── MOTOR DE ANIMAÇÕES ──
function useScrollAnimation(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);
  return { ref, isVisible };
}

function Reveal({ children, className = "", anim = "up", delay = 0 }: { children: ReactNode; className?: string; anim?: "up" | "left" | "right" | "zoom" | "fade"; delay?: number; }) {
  const { ref, isVisible } = useScrollAnimation();
  const hidden: Record<string, string> = {
    up: "opacity-0 translate-y-16",
    left: "opacity-0 translate-x-16",
    right: "opacity-0 -translate-x-16",
    zoom: "opacity-0 scale-90",
    fade: "opacity-0",
  };
  return (
    <div ref={ref}
      className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0 scale-100" : hidden[anim]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── HEADER INTELIGENTE TRANSPARENTE ──
function Header() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isHeaderSolid = isScrolled || isHovered || isMobileMenuOpen;

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 50);
      if (y < 80) setShowHeader(true);
      else if (y > lastScrollY) setShowHeader(false);
      else setShowHeader(true);
      setLastScrollY(y);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
    <header
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'} ${isHeaderSolid ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent border-b border-transparent'}`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 relative">
        <div className="flex-1">
          <Link href="/" className="inline-flex items-center gap-3 transition-all duration-300">
            <div className="relative h-10 w-28 md:h-12 md:w-36 shrink-0">
              <Image src="/logop.png" alt="SagaTurismo" fill className={`object-contain transition-all duration-300 ${!isHeaderSolid ? 'brightness-0 invert' : ''}`} />
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center justify-center gap-12">
          {menuGroups.map((group) => (
            <div key={group.label} className="relative group py-2">
              <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] transition-colors ${isHeaderSolid ? 'text-slate-600 group-hover:text-[#00577C]' : 'text-white group-hover:text-[#F9C400] drop-shadow-md'}`}>
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
          <Link href="/cadastro"
            className={`hidden lg:inline-flex ${jakarta.className} px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm ${isHeaderSolid ? 'bg-[#F9C400] text-[#002f40]' : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'}`}>
            Residente
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`rounded-xl p-2 lg:hidden transition-all duration-300 ${isHeaderSolid ? 'text-[#00577C] hover:bg-slate-100' : 'text-white hover:bg-white/20'}`}>
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

// ── FOOTER INSTITUCIONAL ──
function Footer() {
  return (
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
              © 2026 Prefeitura Munícipal de São Geraldo do Araguaia - PA
            </p>
            <p className="text-[10px] font-bold text-slate-400/80">
              CNPJ: 10.249.241/0001-22
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── PÁGINA DE CONTATO ──
export default function ContatoPage() {
  const [form, setForm] = useState({
    nome: "", cpf: "", email: "", confirmarEmail: "", whatsapp: "",
    assunto: "Problema com a Emissão da Carteira", mensagem: ""
  });
  
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroValidacao, setErroValidacao] = useState("");

  const mascaraCPF = (valor: string) => {
    return valor.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleMudarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { setErroValidacao("O ficheiro deve ter no máximo 5MB."); return; }
      setArquivo(file); setErroValidacao("");
    }
  };

  // ◄── LÓGICA DE ENVIO CORRIGIDA COM SUPABASE + API ──►
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroValidacao("");

    if (form.email !== form.confirmarEmail) { setErroValidacao("Os e-mails não coincidem. Por favor, verifique a digitação."); return; }
    if (form.cpf.length < 14) { setErroValidacao("Por favor, introduza um CPF válido."); return; }

    setLoading(true);
    
    try {
      let arquivo_url = null;

      // 1. Fazer upload do ficheiro se existir (estamos usando a pasta 'galeria' para simplificar, mas crie uma 'suporte' se preferir)
      if (arquivo) {
        const ext = arquivo.name.split('.').pop();
        const path = `suporte/${Date.now()}_${form.cpf.replace(/\D/g, '')}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('galeria').upload(path, arquivo);
        
        if (!uploadError) {
          const { data: pubUrl } = supabase.storage.from('galeria').getPublicUrl(path);
          arquivo_url = pubUrl.publicUrl;
        } else {
            console.error("Erro no upload do anexo:", uploadError);
        }
      }

      // 2. Inserir queixa na tabela 'suporte'
      const { data: suporteData, error: dbError } = await supabase
        .from('suporte')
        .insert([{
          nome: form.nome,
          cpf: form.cpf,
          email: form.email,
          whatsapp: form.whatsapp,
          assunto: form.assunto,
          mensagem: form.mensagem,
          arquivo_url: arquivo_url
        }])
        .select()
        .single();

      if (dbError) throw new Error("Erro ao guardar solicitação no banco de dados.");

      // 3. Disparar o email de confirmação via API no Railway
      const protocolo = suporteData.protocolo;
      
      const response = await fetch('https://sagaturismo-production.up.railway.app/api/v1/suporte/novo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          nome: form.nome,
          protocolo: protocolo
        })
      });

      if (!response.ok) {
          console.warn("A solicitação foi salva, mas falhou ao disparar o e-mail de confirmação.");
      }

      setSucesso(true);
    } catch (error: any) {
      console.error(error);
      setErroValidacao("Ocorreu um erro ao enviar. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#00577C] focus:ring-2 focus:ring-[#00577C]/20 transition-all placeholder:text-slate-400 shadow-sm";
  const labelStyle = "block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider";

  if (sucesso) {
    return (
      <main className={`${inter.className} min-h-screen flex flex-col bg-[#FDFCF7] text-slate-900`}>
        <Header />
        <div className="flex-1 flex items-center justify-center p-6 pt-32">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-[#009640]" />
            </div>
            <h2 className={`${jakarta.className} text-2xl font-black text-slate-800 mb-3`}>Formulário Enviado!</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Recebemos a sua solicitação. Um e-mail de confirmação foi enviado para <strong>{form.email}</strong>. A nossa equipe analisará o seu caso o mais rápido possível.
            </p>
            <button onClick={() => window.location.reload()} className={`${jakarta.className} w-full bg-[#00577C] text-white font-black py-4 rounded-xl uppercase tracking-widest text-sm shadow-md hover:bg-[#004a6b] transition-colors`}>
              Voltar ao Início
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className={`${inter.className} min-h-screen flex flex-col bg-[#FDFCF7] text-slate-900`}>
      <Header />

      {/* ── HERO EDITORIAL GIGANTE (NO PADRÃO SEMTUR) ── */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.pexels.com/photos/9214628/pexels-photo-9214628.jpeg?_gl=1*1tanof8*_gcl_au*NDU0NDkxNDc2LjE3ODczNjc3NjI.*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODgxMTA3MDUkbzExNyRnMSR0MTc4ODExMDg4MyRqOSRsMCRoMA.."
            alt="Atendimento ao Cidadão"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto">
          <Reveal anim="zoom">
            <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[7rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
              SUPORTE
            </h1>
          </Reveal>
        </div>

        {/* ── ONDA DE TRANSIÇÃO (CORRESPONDENDO AO FUNDO FDFCF7) ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ── CORPO DA PÁGINA: FORMULÁRIO ── */}
      <section className="py-20 md:py-32 px-6 bg-[#FDFCF7]">
        <div className="max-w-[900px] mx-auto">
          
          <Reveal anim="up">
            <div className="mb-12 text-center max-w-2xl mx-auto">
              <h2 className={`${jakarta.className} text-3xl font-black text-slate-900 mb-4`}>Como podemos ajudar?</h2>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                Teve algum problema com a Carteira Digital ou não recebeu o e-mail? Preencha os dados abaixo com atenção e anexe o comprovante se necessário.
              </p>
            </div>
          </Reveal>

          <Reveal anim="up" delay={200}>
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* 1. Identificação */}
                <div className="space-y-5 border-b border-slate-100 pb-8">
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-900 flex items-center gap-2`}>
                    <User size={20} className="text-[#00577C]" /> 1. Identificação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelStyle}>Nome Completo *</label>
                      <input type="text" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className={inputStyle} placeholder="O seu nome completo" />
                    </div>
                    <div>
                      <label className={labelStyle}>CPF *</label>
                      <input type="text" required value={form.cpf} onChange={e => setForm({...form, cpf: mascaraCPF(e.target.value)})} className={inputStyle} placeholder="000.000.000-00" />
                    </div>
                  </div>
                </div>

                {/* 2. Contactos */}
                <div className="space-y-5 border-b border-slate-100 pb-8">
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-900 flex items-center gap-2`}>
                    <Mail size={20} className="text-[#00577C]" /> 2. Contato Seguro
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex gap-3 mb-2">
                    <ShieldCheck size={20} className="text-[#00577C] shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Para garantirmos que recebe o nosso retorno, por favor, verifique se o e-mail está escrito corretamente e <strong className="text-slate-900">sem espaços no final</strong>.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelStyle}>E-mail *</label>
                      <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputStyle} placeholder="exemplo@email.com" />
                    </div>
                    <div>
                      <label className={labelStyle}>Confirmar E-mail *</label>
                      <input type="email" required value={form.confirmarEmail} onChange={e => setForm({...form, confirmarEmail: e.target.value})} className={inputStyle} placeholder="Digite o e-mail novamente" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelStyle}>WhatsApp (Opcional)</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="tel" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} className={`${inputStyle} pl-10`} placeholder="(94) 00000-0000" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. O Problema */}
                <div className="space-y-5">
                  <h3 className={`${jakarta.className} text-xl font-black text-slate-900 flex items-center gap-2`}>
                    <FileText size={20} className="text-[#00577C]" /> 3. Detalhes do Problema
                  </h3>
                  <div>
                    <label className={labelStyle}>Assunto</label>
                    <select value={form.assunto} onChange={e => setForm({...form, assunto: e.target.value})} className={inputStyle}>
                      <option value="Problema com a Emissão da Carteira">Problema com a Emissão da Carteira</option>
                      <option value="Pagamento PIX efetuado e não recebi">Pagamento PIX efetuado e não recebi o e-mail</option>
                      <option value="Erro nos dados da carteira">Erro nos dados impressos na carteira</option>
                      <option value="Outro assunto">Outro assunto</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Descreva o que aconteceu *</label>
                    <textarea required rows={5} value={form.mensagem} onChange={e => setForm({...form, mensagem: e.target.value})} className={inputStyle} placeholder="Explique-nos detalhadamente como podemos ajudar..."></textarea>
                  </div>

                  {/* Upload de Comprovativo */}
                  <div>
                    <label className={labelStyle}>Comprovante de Pagamento (Opcional)</label>
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 hover:border-[#00577C] transition-colors cursor-pointer group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-[#00577C] mb-2 transition-colors" />
                        <p className="text-sm font-bold text-slate-600">{arquivo ? arquivo.name : "Clique para anexar arquivo"}</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, JPG ou PNG (Máx. 5MB)</p>
                      </div>
                      <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleMudarArquivo} />
                    </label>
                  </div>
                </div>

                {/* Mensagem de Erro e Botão */}
                <div className="pt-8 border-t border-slate-100">
                  {erroValidacao && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl mb-6 text-sm font-bold">
                      <AlertCircle size={18} /> {erroValidacao}
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className={`${jakarta.className} w-full md:w-auto md:min-w-[300px] mx-auto bg-[#00577C] hover:bg-[#004a6b] text-white font-black py-4 px-8 rounded-full uppercase tracking-widest text-sm shadow-md flex items-center justify-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    {loading ? "Processando..." : "Enviar Solicitação"} <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}