'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // IMPORTADO
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
  Sparkles,
  CalendarDays,
  Users,
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

import CPFInput from '@/components/ui/CPFInput';
import FileUploader from '@/components/ui/FileUploader';
import { cadastrarResidente, type CadastroResponse } from '@/lib/api';
import imageCompression from 'browser-image-compression';

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

  // Validação Titular
  if (!nome.trim() || nome.trim().length < 3) errs.nome = 'Nome completo obrigatório.';
  const rawCPF = cpf.replace(/\D/g, '');
  if (rawCPF.length !== 11) errs.cpf = 'CPF inválido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'E-mail inválido.';
  if (!data_nascimento) errs.data_nascimento = 'Data de nascimento obrigatória.';
  if (!arquivo) errs.arquivo = 'Envie o comprovante de residência.';
  if (!foto) errs.foto = 'Envie sua foto de rosto (selfie).';

  // Validação Dependentes
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
          <div className="relative h-12 w-36 shrink-0 sm:h-16 sm:w-56">
            <Image src="/logop.png" alt="Prefeitura SGA" fill priority className="object-contain object-left" />
          </div>
          <div className="hidden border-l border-slate-200 pl-4 lg:block">
            <p className={`${jakarta.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria Municipal de Turismo</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link href="/roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Rota Turística</Link>
          <a href="/#hoteis" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Hotéis</a>
          <a href="/#historia" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">História</a>
          <a href="https://saogeraldodoaraguaia.pa.gov.br" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#00577C]/20 px-5 py-3 text-sm font-bold text-[#00577C] transition hover:bg-[#00577C] hover:text-white">
            Governo <ExternalLink className="h-4 w-4" />
          </a>
        </nav>

        <button className="rounded-xl border border-slate-200 p-2 md:hidden">
          <Menu className="h-5 w-5 text-[#00577C]" />
        </button>
      </div>
    </header>
  );
}

export default function CadastroPage() {
  const router = useRouter(); // INICIALIZADO
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
  const [result, setResult] = useState<CadastroResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

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

    const errs = validate(nome, cpf, email, dataNascimento, arquivo, foto, dependentes, hasDependentes);
    if (Object.keys(errs).length) {
      setErrors(errs);
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
      
      // ── REDIRECIONAMENTO IMEDIATO SE SUCESSO ──
      if (res.status === 'sucesso' && res.token) {
        router.push(`/carteira/${res.token}`);
      } else {
        setResult(res);
      }
    } catch (err: any) {
      // ── TRATAMENTO DO ERRO DE CPF DUPLICADO (23505) ──
      const errorMsg = err.message || '';
      if (errorMsg.includes('23505') || errorMsg.includes('already exists')) {
        setApiError("Este CPF já possui uma solicitação ativa. Por favor, consulte o status ou utilize outro CPF.");
      } else {
        setApiError('Erro ao processar cadastro. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── ESTADO DE REPROVADO OU ERRO DA IA ──
  if (result && result.status !== 'sucesso') {
    return (
      <main className={`${inter.className} min-h-screen bg-slate-50 text-slate-900`}>
        <Header />
        <section className="flex min-h-screen items-center justify-center px-4 py-28 sm:px-5">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-2xl sm:p-8">
            <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50`}>
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <span className={`mb-5 inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] bg-red-50 text-red-700`}>
              Solicitação recusada
            </span>
            <h1 className={`${jakarta.className} mb-4 text-4xl font-bold text-red-700`}>
              Não foi possível aprovar
            </h1>
            <p className="mx-auto mb-8 max-w-md leading-relaxed text-slate-600">
               {result.mensagem}
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setResult(null); setApiError(null); }} className="rounded-full bg-[#00577C] px-8 py-4 font-bold text-white transition hover:bg-[#004766]">
                Tentar novamente
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

      {/* HERO SECTION - TOTALMENTE MANTIDO */}
      <section className="relative overflow-hidden pt-24 text-white sm:pt-28">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/17835411/pexels-photo-17835411.jpeg?_gl=1*i2axa5*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0NTE1JGo0OCRsMCRoMA..')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#00577C]/95 via-[#00577C]/75 to-[#009640]/45" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-5 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className={`${jakarta.className} text-4xl font-extrabold leading-[0.98] sm:text-5xl md:text-7xl`}>
              Solicite seu Cartão Digital de Residente.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
              Envie seus dados, comprovante em imagem e selfie para validar o benefício de{' '}
              <strong className="text-[#F9C400]">50% de desconto</strong> para si e para a sua família.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/20 bg-white/15 p-5 backdrop-blur-xl sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F9C400] text-[#00577C]">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-extrabold sm:text-xl">Processo simples e seguro</p>
                <p className="text-sm text-white/70">Verificação digital para moradores</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Aprovação rápida', 'Verificação por IA', 'Pacote Família'].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#F9C400]" />
                  <span className="text-sm font-bold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BARRA DE PROGRESSO - MANTIDA */}
      <section className="border-b border-slate-200 bg-white py-5">
        <div className="mx-auto grid max-w-5xl gap-3 px-4 sm:px-5 md:grid-cols-3">
          {[['01', 'Dados pessoais'], ['02', 'Verificação'], ['03', 'Pagamento e Emissão']].map(([step, label]) => (
            <div key={step} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00577C] text-sm font-black text-white">{step}</span>
              <span className="text-sm font-bold text-slate-700">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FORMULÁRIO PRINCIPAL */}
      <section className="bg-slate-50 px-4 py-10 sm:px-5 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <form onSubmit={handleSubmit} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 sm:rounded-[2.5rem]">
            <div className="grid lg:grid-cols-2">
              
              <section className="border-b border-slate-200 p-5 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
                <div className="mb-8 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00577C] text-white">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className={`${jakarta.className} text-3xl font-bold text-[#00577C]`}>Dados do Titular</h2>
                    <p className="text-sm text-slate-500">Informações principais do residente</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Nome completo *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ex: João da Silva Santos"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white"
                      />
                    </div>
                    {errors.nome && <p className="text-xs font-semibold text-red-500">⚠ {errors.nome}</p>}
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <CPFInput value={cpf} onChange={setCpf} error={errors.cpf} />
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-[0.16em] text-slate-500">E-mail *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00577C] focus:bg-white"
                        />
                      </div>
                      {errors.email && <p className="text-xs font-semibold text-red-500">⚠ {errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Data de nascimento *</label>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#00577C]">
                        <CalendarDays className="h-5 w-5" /> Selecione sua data
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <select value={dia} onChange={(e) => setDia(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-2 py-4 text-sm font-black text-slate-700 outline-none">
                          <option value="">Dia</option>
                          {days.map((d) => <option key={d} value={String(d).padStart(2, '0')}>{d}</option>)}
                        </select>
                        <select value={mes} onChange={(e) => setMes(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-2 py-4 text-sm font-black text-slate-700 outline-none">
                          <option value="">Mês</option>
                          {months.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <select value={ano} onChange={(e) => setAno(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-2 py-4 text-sm font-black text-slate-700 outline-none">
                          <option value="">Ano</option>
                          {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    {errors.data_nascimento && <p className="text-xs font-semibold text-red-500">⚠ {errors.data_nascimento}</p>}
                  </div>
                </div>

                {/* PACOTE FAMÍLIA */}
                <div className="mt-10 border-t border-slate-100 pt-8 text-left">
                  <div className="mb-6 flex items-start gap-4 p-5 rounded-3xl border border-[#F9C400]/40 bg-[#F9C400]/10">
                    <Users className="mt-1 h-6 w-6 shrink-0 text-[#00577C]" />
                    <div className="flex-1">
                      <h3 className="font-bold text-[#00577C]">Pacote Família</h3>
                      <p className="text-sm text-slate-600 mb-3 mt-1">Deseja adicionar dependentes do seu grupo familiar?</p>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={hasDependentes} onChange={(e) => setHasDependentes(e.target.checked)} className="w-5 h-5 text-[#00577C] rounded-md border-slate-300" />
                        <span className="font-bold text-slate-800">Sim, adicionar dependentes</span>
                      </label>
                      {hasDependentes && (
                        <div className="mt-4 pt-4 border-t border-[#F9C400]/20">
                          <label className="block text-xs font-black uppercase text-slate-500 mb-2">Quantos dependentes?</label>
                          <select value={numDependentes} onChange={(e) => setNumDependentes(Number(e.target.value))} className="rounded-2xl border border-slate-200 p-3 text-sm font-bold">
                            {[1,2,3,4].map(n => <option key={n} value={n}>{n} dependente{n>1?'s':''}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasDependentes && dependentes.map((dep, index) => (
                    <div key={dep.id} className="mt-6 p-5 sm:p-6 rounded-3xl border border-slate-200 bg-slate-50 space-y-4">
                      <h4 className="font-bold text-[#00577C] mb-2 border-b border-slate-200 pb-2 text-left">Dependente {index + 1}</h4>
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nome Completo</label>
                        <input type="text" placeholder="Nome completo" value={dep.nome} onChange={(e) => updateDependente(index, 'nome', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">CPF</label>
                        <CPFInput value={dep.cpf} onChange={(val) => updateDependente(index, 'cpf', val)} error={errors.dependentes?.[index]?.cpf} />
                      </div>
                      <div className="flex gap-2">
                        <select value={dep.dia} onChange={(e) => updateDependente(index, 'dia', e.target.value)} className="flex-1 rounded-xl border p-3 text-xs font-bold">{days.map(d => <option key={d} value={String(d).padStart(2,'0')}>{d}</option>)}</select>
                        <select value={dep.mes} onChange={(e) => updateDependente(index, 'mes', e.target.value)} className="flex-1 rounded-xl border p-3 text-xs font-bold">{months.map(([v]) => <option key={v} value={v}>{v}</option>)}</select>
                        <select value={dep.ano} onChange={(e) => updateDependente(index, 'ano', e.target.value)} className="flex-1 rounded-xl border p-3 text-xs font-bold">{years.map(y => <option key={y} value={String(y)}>{y}</option>)}</select>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* COLUNA DIREITA: VERIFICAÇÃO E REGRAS - TOTALMENTE MANTIDO */}
              <section className="p-5 sm:p-8 lg:p-10 bg-slate-50 lg:bg-transparent text-left">
                <div className="mb-8 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#009640] text-white"><FileCheck2 size={24} /></div>
                  <div><h2 className={`${jakarta.className} text-3xl font-bold text-[#00577C]`}>Verificação</h2><p className="text-sm text-slate-500">Envie imagens oficiais</p></div>
                </div>

                {/* CAIXA DE REGRAS EXPLICADAS - MANTIDO */}
                <div className="mb-8 space-y-4 text-left">
                  <div className="rounded-3xl border border-[#007FA3]/20 bg-[#007FA3]/5 p-5">
                    <div className="mb-3 flex gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-[#007FA3]" /><p className="text-sm font-bold text-[#00577C]">Regras de Verificação</p></div>
                    <ul className="ml-8 list-disc space-y-1.5 text-xs text-slate-600 font-medium">
                      <li>O documento deve provar vínculo com <strong className="text-[#00577C]">São Geraldo do Araguaia - PA</strong>.</li>
                      <li>Deve ser recente (máximo 90 dias) e estar legível.</li>
                      <li>Deve estar no <strong className="text-[#00577C]">seu nome</strong> ou familiar com mesmo sobrenome.</li>
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-[#009640]/20 bg-[#EAF8F0] p-5">
                    <div className="mb-3 flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-[#009640]" /><p className="text-sm font-bold text-[#009640]">Documentos Aceitos</p></div>
                    <ul className="ml-8 list-disc space-y-1 text-xs text-slate-600 font-medium">
                      <li>Energia (Equatorial), Água (Cosanpa) ou Internet fixa.</li>
                      <li>Matrícula escolar ou contrato com empresa local.</li>
                      <li>Cartão SUS ou declaração de UBS local.</li>
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
                    <div className="mb-3 flex gap-3"><XCircle className="h-5 w-5 shrink-0 text-red-500" /><p className="text-sm font-bold text-red-600">Não Aceitos</p></div>
                    <ul className="ml-8 list-disc space-y-1 text-xs text-slate-600 font-medium">
                      <li>Boletos genéricos ou compras online.</li>
                      <li>Contratos sem firma reconhecida.</li>
                      <li>Apenas foto de RG/CPF (Sem morada).</li>
                    </ul>
                  </div>
                </div>

                {/* UPLOADS - MANTIDO */}
                <div className="grid gap-6 text-left">
                  <div className="rounded-3xl border border-[#F9C400]/40 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00577C] text-white"><ShieldCheck size={20} /></div>
                      <div><p className="text-xs font-black uppercase text-slate-700 tracking-widest">Comprovante de residência *</p></div>
                    </div>
                    <FileUploader onFileSelect={setArquivo} error={errors.arquivo} />
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 mb-4 flex gap-2"><Camera size={16}/> Selfie do Titular *</p>
                      <FileUploader onFileSelect={setFoto} error={errors.foto} />
                    </div>

                    {hasDependentes && dependentes.map((dep, index) => (
                      <div key={dep.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm text-left">
                        <p className="text-xs font-bold text-slate-500 mb-4 flex gap-2"><Camera size={16}/> Selfie: {dep.nome || `Dependente ${index+1}`} *</p>
                        <FileUploader onFileSelect={(f) => updateDependente(index, 'foto', f)} error={errors.dependentes?.[index]?.foto} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="border-t border-slate-200 bg-white p-5 sm:p-10 text-left">
              {apiError && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 p-5 text-sm font-bold text-red-700 border border-red-100 animate-in shake duration-500">
                  <XCircle className="h-5 w-5 shrink-0" /> {apiError}
                </div>
              )}

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#009640]" /> Dados Protegidos</span>
                  <span>·</span><span>Análise por IA</span><span>·</span><span>Emissão Digital</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#F9C400] px-10 py-5 text-lg font-black text-[#00577C] shadow-2xl transition hover:-translate-y-1 hover:bg-[#ffd633] disabled:opacity-60 sm:w-auto"
                >
                  {loading ? (
                    <><Loader2 className="h-6 w-6 animate-spin" /> Analisando...</>
                  ) : (
                    <><Users className="h-6 w-6" /> Finalizar e Enviar <ArrowRight className="h-6 w-6" /></>
                  )}
                </button>
              </div>
            </div>
          </form>

          <footer className="mt-20 pt-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 opacity-30 grayscale">
             <Image src="/logop.png" alt="SGA" width={140} height={50} className="object-contain" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">© 2026 · São Geraldo do Araguaia (PA)</p>
          </footer>
        </div>
      </section>
    </main>
  );
}