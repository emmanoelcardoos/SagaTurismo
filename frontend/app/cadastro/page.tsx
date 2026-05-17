'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Mail,
  Camera,
  ArrowRight,
  ShieldCheck,
  Info,
  Menu,
  ExternalLink,
  FileCheck2,
  CalendarDays,
  Users,
  Wallet,
  X
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

import CPFInput from '@/components/ui/CPFInput';
import FileUploader from '@/components/ui/FileUploader';
import { cadastrarResidente, type CadastroResponse } from '@/lib/api';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

type DependenteData = {
  id: string;
  nome: string;
  cpf: string;
  dia: string;
  mes: string;
  ano: string;
  foto: File | null;
};

type FieldErrors = {
  nome?: string;
  cpf?: string;
  email?: string;
  data_nascimento?: string;
  arquivo?: string;
  foto?: string;
  dependentes?: { [key: number]: { nome?: string; cpf?: string; data_nascimento?: string; foto?: string } };
};

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

function validate(
  nome: string,
  cpf: string,
  email: string,
  data_nascimento: string,
  arquivo: File | null,
  foto: File | null,
  dependentes: DependenteData[],
  hasDependentes: boolean
): FieldErrors {
  const errs: FieldErrors = { dependentes: {} };

  if (!nome.trim() || nome.trim().length < 3) errs.nome = 'Nome completo obrigatório.';
  const rawCPF = cpf.replace(/\D/g, '');
  if (rawCPF.length !== 11) errs.cpf = 'CPF inválido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'E-mail inválido.';
  if (!data_nascimento) errs.data_nascimento = 'Data de nascimento obrigatória.';
  if (!arquivo) errs.arquivo = 'Envie o comprovante de residência.';
  if (!foto) errs.foto = 'Envie sua foto de rosto (selfie).';

  if (hasDependentes && dependentes.length > 0) {
    dependentes.forEach((dep, index) => {
      const depErrs: any = {};
      if (!dep.nome.trim() || dep.nome.trim().length < 3) depErrs.nome = 'Nome obrigatório.';
      const rawDepCPF = dep.cpf.replace(/\D/g, '');
      if (rawDepCPF.length !== 11) depErrs.cpf = 'CPF inválido.';
      if (!dep.dia || !dep.mes || !dep.ano) depErrs.data_nascimento = 'Data incompleta.';
      if (!dep.foto) depErrs.foto = 'Foto obrigatória.';

      if (Object.keys(depErrs).length > 0) {
        errs.dependentes![index] = depErrs;
      }
    });
  }

  if (Object.keys(errs.dependentes!).length === 0) {
    delete errs.dependentes;
  }

  return errs;
}

function Header() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${
        showHeader ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4 text-left">
          <div className="relative h-10 w-28 sm:h-12 sm:w-36 md:h-16 md:w-56 shrink-0">
            <Image src="/logop.png" alt="Prefeitura SGA" fill priority className="object-contain object-left" />
          </div>
          <div className="hidden border-l border-slate-200 pl-4 lg:block">
            <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria Municipal de Turismo</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
          <Link href="/hoteis" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Alojamentos</Link>
          <Link href="/pacotes" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Pacotes</Link>
          <a href="https://saogeraldodoaraguaia.pa.gov.br" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#00577C]/20 px-5 py-3 text-sm font-bold text-[#00577C] transition hover:bg-[#00577C] hover:text-white">
            Portal do Governo <ExternalLink className="h-4 w-4" />
          </a>
        </nav>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-xl border border-slate-200 p-2 md:hidden bg-slate-50 text-[#00577C]"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-[100%] left-0 w-full bg-white border-b border-slate-200 p-5 flex flex-col gap-4 shadow-xl md:hidden animate-in slide-in-from-top-4">
          <Link href="/roteiro" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Rota Turística</Link>
          <Link href="/pacotes" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Pacotes</Link>
          <Link href="/passeios" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Passeios</Link>
          <Link href="/aldeias" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Aldeias</Link>
          <Link href="/hoteis" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-lg">Hospedagem</Link>
        </div>
      )}
    </header>
  );
}

export default function CadastroPage() {
  const router = useRouter(); 
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [foto, setFoto] = useState<File | null>(null);

  const [dia, setDia] = useState('');
  const [mes, setMes] = useState('');
  const [ano, setAno] = useState('');

  // Pacote Família
  const [hasDependentes, setHasDependentes] = useState(false);
  const [numDependentes, setNumDependentes] = useState(1);
  const [dependentes, setDependentes] = useState<DependenteData[]>([]);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  
  // Três estados distintos: Erro na API, Recusa da IA, ou Aprovado mas sem Token do Backend
  const [apiError, setApiError] = useState<string | null>(null);
  const [rejeicaoIA, setRejeicaoIA] = useState<{ mensagem: string } | null>(null);
  const [sucessoSemToken, setSucessoSemToken] = useState<{ mensagem: string } | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 110 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    ['01', 'Janeiro'], ['02', 'Fevereiro'], ['03', 'Março'], ['04', 'Abril'],
    ['05', 'Maio'], ['06', 'Junho'], ['07', 'Julho'], ['08', 'Agosto'],
    ['09', 'Setembro'], ['10', 'Outubro'], ['11', 'Novembro'], ['12', 'Dezembro'],
  ];

  useEffect(() => {
    if (dia && mes && ano) {
      setDataNascimento(`${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`);
    } else {
      setDataNascimento('');
    }
  }, [dia, mes, ano]);

  useEffect(() => {
    if (hasDependentes) {
      setDependentes((prev) => {
        const newDeps = [...prev];
        while (newDeps.length < numDependentes) {
          newDeps.push({ id: Math.random().toString(), nome: '', cpf: '', dia: '', mes: '', ano: '', foto: null });
        }
        return newDeps.slice(0, numDependentes);
      });
    } else {
      setDependentes([]);
    }
  }, [hasDependentes, numDependentes]);

  const updateDependente = (index: number, field: keyof DependenteData, value: any) => {
    const newDeps = [...dependentes];
    newDeps[index] = { ...newDeps[index], [field]: value };
    setDependentes(newDeps);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setRejeicaoIA(null);
    setSucessoSemToken(null);

    const errs = validate(nome, cpf, email, dataNascimento, arquivo, foto, dependentes, hasDependentes);
    if (Object.keys(errs).length) {
      setErrors(errs);
      window.scrollTo({ top: 400, behavior: 'smooth' });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const integrantes = [
        { tipo: 'titular', nome, cpf, email, data_nascimento: dataNascimento },
        ...dependentes.map(d => ({
          tipo: 'dependente',
          nome: d.nome,
          cpf: d.cpf,
          data_nascimento: `${d.ano}-${d.mes.padStart(2, '0')}-${d.dia.padStart(2, '0')}`
        }))
      ];

      const fotosArray = [foto!, ...dependentes.map(d => d.foto!)];
      const formData = new FormData();
      formData.append('integrantes', JSON.stringify(integrantes));
      formData.append('arquivo', arquivo!);
      
      fotosArray.forEach((f) => {
        formData.append('fotos', f);
      });

      const res = await cadastrarResidente(formData as any); 
      
      const textoMensagem = (res?.mensagem || '').toLowerCase();
      const isAprovadoBackend = 
        res?.status === 'sucesso' || 
        res?.sucesso === true || 
        !!res?.token || 
        textoMensagem.includes('validado') || 
        textoMensagem.includes('aprovado') ||
        textoMensagem.includes('redirecionando');

      if (isAprovadoBackend) {
        // Tenta encontrar o token de qualquer maneira
        const tokenFinal = res?.token || res?.dados?.token || res?.data?.token || res?.codigo_pedido || '';
        
        if (tokenFinal) {
           router.push(`/checkout-carteira?token=${tokenFinal}`);
        } else {
           // O BACKEND APROVOU, MAS NÃO ENVIOU O TOKEN. CAI AQUI PARA EVITAR A TELA VERMELHA ERRADA.
           setSucessoSemToken({
             mensagem: res?.mensagem || "O seu registo foi aprovado, mas o servidor não nos enviou o link para o pagamento."
           });
        }
      } else {
        // A IA REALMENTE REJEITOU
        setRejeicaoIA({
          mensagem: res?.mensagem || 'A nossa Inteligência Artificial não conseguiu aprovar a sua documentação. Verifique se as fotos estão nítidas e se comprovam a residência.'
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || '';
      if (errorMsg.includes('23505') || errorMsg.includes('already exists')) {
        setApiError("Este CPF já possui uma solicitação em andamento. Consulte o seu email ou utilize outro CPF.");
      } else {
        setApiError('A conexão com o servidor falhou ou a IA demorou muito a responder. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── ECRÃ VERDE: APROVADO, MAS SEM TOKEN DO BACKEND ──
  if (sucessoSemToken) {
    return (
      <main className={`${inter.className} min-h-screen bg-slate-50 text-slate-900`}>
        <Header />
        <section className="flex min-h-screen items-center justify-center px-4 py-28 sm:px-5">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-2xl sm:p-8 animate-in zoom-in-95 duration-300">
            <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-50`}>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <span className={`mb-5 inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] bg-green-50 text-green-700`}>
              Aprovado pela IA
            </span>
            <h1 className={`${jakarta.className} mb-4 text-3xl md:text-4xl font-bold text-green-700`}>
              Cadastro Validado com Sucesso!
            </h1>
            <p className="mx-auto mb-4 max-w-md leading-relaxed text-slate-600 font-medium">
               A tua documentação foi validada de forma irrepreensível, e o backend respondeu:
            </p>
            <div className="bg-slate-100 p-4 rounded-xl text-sm font-mono text-slate-700 mb-8 mx-auto max-w-md border border-slate-200">
               "{sucessoSemToken.mensagem}"
            </div>
            <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 max-w-md mx-auto mb-6 text-left">
               ⚠ <strong>Aviso Técnico:</strong> O backend não enviou a variável `token` no JSON de resposta. Sem o token, não é possível saltar para a página de checkout. Pede ao teu desenvolvedor para incluir o `token` ou `codigo_pedido` na resposta da API `/cadastrar`.
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => setSucessoSemToken(null)} className="rounded-full bg-slate-900 px-8 py-4 font-bold text-white transition hover:bg-black active:scale-95 shadow-lg">
                Voltar
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // ── ECRÃ VERMELHO: RECUSA REAL DA IA ──
  if (rejeicaoIA) {
    return (
      <main className={`${inter.className} min-h-screen bg-slate-50 text-slate-900`}>
        <Header />
        <section className="flex min-h-screen items-center justify-center px-4 py-28 sm:px-5">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-2xl sm:p-8 animate-in zoom-in-95 duration-300">
            <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50`}>
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <span className={`mb-5 inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] bg-red-50 text-red-700`}>
              Solicitação Retida
            </span>
            <h1 className={`${jakarta.className} mb-4 text-3xl md:text-4xl font-bold text-red-700`}>
              Análise Não Aprovada
            </h1>
            <p className="mx-auto mb-8 max-w-md leading-relaxed text-slate-600 font-medium">
               {rejeicaoIA.mensagem}
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setRejeicaoIA(null)} className="rounded-full bg-[#00577C] px-8 py-4 font-bold text-white transition hover:bg-[#004766] active:scale-95 shadow-lg">
                Corrigir e Enviar Novamente
              </button>
              <Link href="/" className="text-sm font-semibold text-slate-400 hover:text-slate-600">Voltar ao início</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`${inter.className} min-h-screen bg-white text-slate-900 text-left`}>
      <Header />

      {/* HERO SECTION CLEAN & RESPONSIVA */}
      <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 text-left bg-slate-900">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image 
            src="https://images.pexels.com/photos/17835411/pexels-photo-17835411.jpeg?_gl=1*i2axa5*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0NTE1JGo0OCRsMCRoMA.." 
            alt="SGA" 
            fill 
            className="object-cover opacity-60"
            priority 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002f40] via-[#002f40]/80 to-[#002f40]/20 md:bg-gradient-to-r md:from-[#002f40]/95 md:via-[#002f40]/50 md:to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#F9C400] text-[#00577C] px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-5 md:mb-6 shadow-sm">
              <Wallet size={14}/> Taxa de Emissão: R$ 20,00 / pessoa
            </div>
            
            <h1 className={`${jakarta.className} text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-4 md:mb-6`}>
              Cartão Digital de <span className="text-[#F9C400]">Residente.</span>
            </h1>
            
            <p className="max-w-xl text-sm sm:text-base md:text-lg text-white/90 font-medium leading-relaxed">
              Garanta seu benefício exclusivo de 50% de desconto no turismo local. Preencha seus dados e envie sua documentação para análise.
            </p>
          </div>
        </div>
      </section>

      {/* FORMULÁRIO PRINCIPAL */}
      <section className="bg-slate-50 px-4 py-10 md:py-16 sm:px-5">
        <div className="mx-auto max-w-7xl">
          <form onSubmit={handleSubmit} className="overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl">
            <div className="grid lg:grid-cols-2">
              
              <section className="border-b border-slate-200 p-6 sm:p-10 lg:border-b-0 lg:border-r">
                <div className="mb-8 md:mb-10 flex items-center gap-4">
                  <div className="flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#00577C] text-white">
                    <User className="h-6 w-6 md:h-7 md:w-7" />
                  </div>
                  <div>
                    <h2 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900`}>Dados do Titular</h2>
                    <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">Informações principais do residente</p>
                  </div>
                </div>

                <div className="grid gap-5 md:gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#00577C]">Nome completo *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ex: João da Silva Santos"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className={`w-full rounded-2xl border-2 bg-slate-50 py-3 md:py-4 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none transition-colors focus:bg-white ${errors.nome ? 'border-red-300 focus:border-red-500' : 'border-slate-100 hover:border-slate-200 focus:border-[#00577C]'}`}
                      />
                    </div>
                    {errors.nome && <p className="text-xs font-bold text-red-500 mt-1">⚠ {errors.nome}</p>}
                  </div>

                  <div className="grid gap-5 md:gap-6 sm:grid-cols-2">
                    <CPFInput value={cpf} onChange={setCpf} error={errors.cpf} />
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#00577C]">E-mail *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full rounded-2xl border-2 bg-slate-50 py-3 md:py-4 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none transition-colors focus:bg-white ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-100 hover:border-slate-200 focus:border-[#00577C]'}`}
                        />
                      </div>
                      {errors.email && <p className="text-xs font-bold text-red-500 mt-1">⚠ {errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#00577C]">Data de nascimento *</label>
                    <div className={`rounded-[1.5rem] md:rounded-3xl border-2 bg-slate-50 p-4 md:p-5 transition-colors ${errors.data_nascimento ? 'border-red-300' : 'border-slate-100'}`}>
                      <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-700">
                        <CalendarDays className="h-4 w-4 md:h-5 md:w-5 text-[#00577C]" /> Selecione sua data
                      </div>
                      <div className="grid grid-cols-3 gap-2 md:gap-3">
                        <select value={dia} onChange={(e) => setDia(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-2 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-700 outline-none cursor-pointer">
                          <option value="">Dia</option>
                          {days.map((d) => <option key={d} value={String(d).padStart(2, '0')}>{d}</option>)}
                        </select>
                        <select value={mes} onChange={(e) => setMes(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-2 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-700 outline-none cursor-pointer">
                          <option value="">Mês</option>
                          {months.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <select value={ano} onChange={(e) => setAno(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-2 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-700 outline-none cursor-pointer">
                          <option value="">Ano</option>
                          {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    {errors.data_nascimento && <p className="text-xs font-bold text-red-500 mt-1">⚠ {errors.data_nascimento}</p>}
                  </div>
                </div>

                {/* PACOTE FAMÍLIA */}
                <div className="mt-10 md:mt-12 border-t border-slate-100 pt-8 md:pt-10 text-left">
                  <div className="mb-6 flex flex-col md:flex-row md:items-start gap-4 p-5 md:p-6 rounded-3xl border-2 border-slate-100 bg-slate-50 transition-colors focus-within:border-[#F9C400]">
                    <Users className="md:mt-1 h-8 w-8 shrink-0 text-[#00577C]" />
                    <div className="flex-1">
                      <h3 className={`${jakarta.className} text-xl font-black text-[#00577C]`}>Dependentes</h3>
                      <p className="text-xs md:text-sm font-medium text-slate-500 mb-4 md:mb-5 mt-1">Deseja emitir também o cartão para os seus familiares?</p>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={hasDependentes} onChange={(e) => setHasDependentes(e.target.checked)} className="w-6 h-6 text-[#00577C] rounded-md border-slate-300 accent-[#00577C]" />
                        <span className="font-bold text-slate-800 text-sm md:text-base group-hover:text-[#00577C] transition-colors">Sim, adicionar dependentes</span>
                      </label>
                      {hasDependentes && (
                        <div className="mt-5 md:mt-6 pt-5 md:pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-top-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-3">Quantos dependentes?</label>
                          <select value={numDependentes} onChange={(e) => setNumDependentes(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white p-3 md:p-4 text-sm font-bold outline-none cursor-pointer">
                            {[1,2,3,4].map(n => <option key={n} value={n}>{n} familiar{n>1?'es':''}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasDependentes && dependentes.map((dep, index) => (
                    <div key={dep.id} className="mt-5 md:mt-6 p-5 md:p-6 rounded-3xl border-2 border-slate-100 bg-white space-y-4 md:space-y-5 animate-in fade-in zoom-in-95">
                      <h4 className="font-black text-slate-800 mb-2 flex items-center gap-2 text-sm md:text-base">
                         <span className="w-6 h-6 rounded-full bg-blue-50 text-[#00577C] flex items-center justify-center text-xs">{index + 1}</span> 
                         Familiar
                      </h4>
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Completo</label>
                        <input type="text" placeholder="Nome completo" value={dep.nome} onChange={(e) => updateDependente(index, 'nome', e.target.value)} className={`w-full rounded-xl border-2 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-colors focus:bg-white ${errors.dependentes?.[index]?.nome ? 'border-red-300 focus:border-red-500' : 'border-slate-100 hover:border-slate-200 focus:border-[#00577C]'}`} />
                        {errors.dependentes?.[index]?.nome && <p className="text-[10px] font-bold text-red-500">⚠ {errors.dependentes[index].nome}</p>}
                      </div>
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CPF</label>
                        <CPFInput value={dep.cpf} onChange={(val) => updateDependente(index, 'cpf', val)} error={errors.dependentes?.[index]?.cpf} />
                      </div>
                      <div className="space-y-2 text-left">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nascimento</label>
                         <div className="flex gap-2">
                           <select value={dep.dia} onChange={(e) => updateDependente(index, 'dia', e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 md:p-3 text-xs font-bold outline-none cursor-pointer">{days.map(d => <option key={d} value={String(d).padStart(2,'0')}>{d}</option>)}</select>
                           <select value={dep.mes} onChange={(e) => updateDependente(index, 'mes', e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 md:p-3 text-xs font-bold outline-none cursor-pointer">{months.map(([v]) => <option key={v} value={v}>{v}</option>)}</select>
                           <select value={dep.ano} onChange={(e) => updateDependente(index, 'ano', e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 md:p-3 text-xs font-bold outline-none cursor-pointer">{years.map(y => <option key={y} value={String(y)}>{y}</option>)}</select>
                         </div>
                         {errors.dependentes?.[index]?.data_nascimento && <p className="text-[10px] font-bold text-red-500">⚠ {errors.dependentes[index].data_nascimento}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* COLUNA DIREITA: VERIFICAÇÃO */}
              <section className="p-6 sm:p-10 bg-white text-left flex flex-col justify-between">
                <div>
                  <div className="mb-8 md:mb-10 flex items-center gap-4">
                    <div className="flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#009640] text-white"><FileCheck2 size={24} className="md:w-7 md:h-7" /></div>
                    <div>
                      <h2 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900`}>Verificação</h2>
                      <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">Envio de documentação oficial</p>
                    </div>
                  </div>

                  {/* CAIXA DE REGRAS EXPLICADAS */}
                  <div className="mb-8 md:mb-10 space-y-3 md:space-y-4 text-left">
                    <div className="rounded-2xl border-2 border-blue-50 bg-blue-50/50 p-5 md:p-6">
                      <div className="mb-3 md:mb-4 flex items-center gap-3"><Info className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-[#00577C]" /><p className="font-black text-[#00577C] text-sm md:text-base">Regras de Verificação</p></div>
                      <ul className="ml-7 md:ml-9 list-disc space-y-1.5 md:space-y-2 text-xs md:text-sm text-slate-600 font-medium">
                        <li>O documento deve provar vínculo com <strong className="text-[#00577C]">São Geraldo do Araguaia - PA</strong>.</li>
                        <li>Deve ser recente (máximo 90 dias) e estar legível.</li>
                        <li>Deve estar no <strong className="text-[#00577C]">seu nome</strong> ou familiar direto.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border-2 border-green-50 bg-green-50/50 p-5 md:p-6">
                      <div className="mb-3 md:mb-4 flex items-center gap-3"><CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-[#009640]" /><p className="font-black text-[#009640] text-sm md:text-base">Aceitamos</p></div>
                      <ul className="ml-7 md:ml-9 list-disc space-y-1.5 md:space-y-2 text-xs md:text-sm text-slate-600 font-medium">
                        <li>Contas (Energia, Água, Internet fixa).</li>
                        <li>Matrícula escolar ou contrato com empresa local.</li>
                        <li>Cartão SUS ou declaração de UBS local.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border-2 border-red-50 bg-red-50 p-5 md:p-6">
                      <div className="mb-3 md:mb-4 flex items-center gap-3"><XCircle className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-red-500" /><p className="font-black text-red-600 text-sm md:text-base">Não Aceitamos</p></div>
                      <ul className="ml-7 md:ml-9 list-disc space-y-1.5 md:space-y-2 text-xs md:text-sm text-slate-600 font-medium">
                        <li>Boletos genéricos ou compras online.</li>
                        <li>Contratos sem firma reconhecida.</li>
                        <li>Apenas foto de RG/CPF (pois não comprova a morada).</li>
                      </ul>
                    </div>
                  </div>

                  {/* UPLOADS */}
                  <div className="grid gap-5 md:gap-6 text-left mb-8 md:mb-10">
                    <div className={`rounded-3xl border-2 bg-slate-50 p-5 md:p-6 transition-colors ${errors.arquivo ? 'border-red-300' : 'border-slate-100 hover:border-slate-200'}`}>
                      <div className="mb-4 md:mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F9C400] text-[#00577C]"><ShieldCheck size={20} /></div>
                        <div><p className="text-[10px] font-black uppercase text-slate-600 tracking-widest leading-tight">Comprovante de residência *</p></div>
                      </div>
                      <FileUploader onFileSelect={setArquivo} error={errors.arquivo} />
                    </div>

                    <div className="space-y-5 md:space-y-6">
                      <div className={`rounded-3xl border-2 bg-slate-50 p-5 md:p-6 transition-colors ${errors.foto ? 'border-red-300' : 'border-slate-100 hover:border-slate-200'}`}>
                        <p className="text-xs font-black uppercase tracking-widest text-[#00577C] mb-4 md:mb-5 flex items-center gap-2"><Camera size={16} className="md:w-[18px] md:h-[18px]"/> Selfie do Titular *</p>
                        <FileUploader onFileSelect={setFoto} error={errors.foto} />
                      </div>

                      {hasDependentes && dependentes.map((dep, index) => (
                        <div key={dep.id} className={`rounded-3xl border-2 bg-slate-50 p-5 md:p-6 transition-colors ${errors.dependentes?.[index]?.foto ? 'border-red-300' : 'border-slate-100 hover:border-slate-200'}`}>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-600 mb-4 md:mb-5 flex items-center gap-2">
                             <Camera size={16} className="text-[#00577C] md:w-[18px] md:h-[18px]"/> 
                             Selfie: {dep.nome ? dep.nome.split(' ')[0] : `Familiar ${index+1}`} *
                          </p>
                          <FileUploader onFileSelect={(f) => updateDependente(index, 'foto', f)} error={errors.dependentes?.[index]?.foto} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* BARRA INFERIOR DE SUBMISSÃO */}
                <div className="border-t border-slate-100 pt-6 md:pt-8 mt-auto text-left">
                  {apiError && (
                    <div className="mb-5 md:mb-6 flex items-center gap-3 rounded-2xl bg-red-50 p-4 md:p-5 text-sm font-bold text-red-700 border border-red-100 animate-in shake duration-500 shadow-sm">
                      <XCircle className="h-5 w-5 shrink-0" /> {apiError}
                    </div>
                  )}

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 md:h-4 md:w-4 text-[#00577C]" /> Dados Protegidos</span>
                      <span className="hidden sm:block">·</span><span>Análise por IA</span><span className="hidden sm:block">·</span><span>Conexão Encriptada</span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#00577C] px-8 md:px-10 py-4 md:py-5 text-base md:text-lg font-black text-white shadow-xl shadow-blue-900/10 transition hover:-translate-y-1 hover:bg-[#004a6b] disabled:opacity-60 sm:w-auto"
                    >
                      {loading ? (
                        <><Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" /> Verificando...</>
                      ) : (
                        <><FileCheck2 className="h-5 w-5 md:h-6 md:w-6" /> Avançar para Verificação <ArrowRight className="h-5 w-5 md:h-6 md:w-6" /></>
                      )}
                    </button>
                  </div>
                </div>

              </section>
            </div>
          </form>

          <footer className="mt-16 md:mt-20 pt-8 md:pt-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 opacity-40 grayscale text-center md:text-left">
             <Image src="/logop.png" alt="SGA" width={120} height={40} className="object-contain" />
             <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">© 2026 · São Geraldo do Araguaia (PA)</p>
          </footer>
        </div>
      </section>
    </main>
  );
}