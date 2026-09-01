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
  FileCheck2,
  CalendarDays,
  Users,
  X,
  ChevronDown,
  UserPlus
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

import CPFInput from '@/components/ui/CPFInput';
import FileUploader from '@/components/ui/FileUploader';
import { cadastrarResidente } from '@/lib/api';

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

// ── HEADER INTELIGENTE PADRÃO ──
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
                {group.links.map((link) => {
                  const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                  return (
                    <Link key={link} href={path} className={`${jakarta.className} block px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#00577C] hover:bg-slate-50 rounded-xl transition-all whitespace-nowrap`}>
                      {link}
                    </Link>
                  );
                })}
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
                {group.links.map((link) => {
                  const path = `/${link.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
                  return (
                    <Link key={link} href={path} onClick={() => setIsMobileMenuOpen(false)} className={`${jakarta.className} font-bold text-slate-700 text-sm bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 hover:text-[#00577C] hover:bg-slate-100 transition-colors`}>
                      {link}
                    </Link>
                  );
                })}
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
  );
}

export default function CadastroPage() {
  const router = useRouter(); 
  
  // ── ESTADO DE NAVEGAÇÃO ──
  // 'selecao' = mostra os 2 blocos | 'novo' = formulário original | 'dependente' = formulário de novo dependente
  const [view, setView] = useState<'selecao' | 'novo' | 'dependente'>('selecao');

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

  // Campos específicos para o ecrã "Adicionar Dependente"
  const [cpfTitularExistente, setCpfTitularExistente] = useState('');
  const [vagasRestantes, setVagasRestantes] = useState<number | null>(null);
  const [nomeTitularEncontrado, setNomeTitularEncontrado] = useState('');
  const [checandoCpf, setChecandoCpf] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  
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
    if (hasDependentes || view === 'dependente') {
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
  }, [hasDependentes, numDependentes, view]);

  const updateDependente = (index: number, field: keyof DependenteData, value: any) => {
    const newDeps = [...dependentes];
    newDeps[index] = { ...newDeps[index], [field]: value };
    setDependentes(newDeps);
  };

  const formatarNome = (texto: string) => {
    return texto
      .toLowerCase()
      .split(' ')
      .map((palavra) => {
        if (palavra.length === 0) return palavra;
        if (['de', 'da', 'do', 'das', 'dos'].includes(palavra)) return palavra;
        return palavra.charAt(0).toUpperCase() + palavra.slice(1);
      })
      .join(' ');
  };

  // Validação Original do Novo Cadastro
  function validateNovoCadastro(): FieldErrors {
    const errs: FieldErrors = { dependentes: {} };
    if (!nome.trim() || nome.trim().length < 3) errs.nome = 'Nome completo obrigatório.';
    const rawCPF = cpf.replace(/\D/g, '');
    if (rawCPF.length !== 11) errs.cpf = 'CPF inválido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'E-mail inválido.';
    if (!dataNascimento) errs.data_nascimento = 'Data de nascimento obrigatória.';
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
        if (Object.keys(depErrs).length > 0) errs.dependentes![index] = depErrs;
      });
    }
    if (Object.keys(errs.dependentes!).length === 0) delete errs.dependentes;
    return errs;
  }

  // Validação para Adicionar Dependente Extra
  function validateDependenteExtra(): FieldErrors {
    const errs: FieldErrors = { dependentes: {} };
    const rawTitularCPF = cpfTitularExistente.replace(/\D/g, '');
    if (rawTitularCPF.length !== 11) errs.cpf = 'CPF do titular inválido.';

    dependentes.forEach((dep, index) => {
      const depErrs: any = {};
      if (!dep.nome.trim() || dep.nome.trim().length < 3) depErrs.nome = 'Nome obrigatório.';
      const rawDepCPF = dep.cpf.replace(/\D/g, '');
      if (rawDepCPF.length !== 11) depErrs.cpf = 'CPF inválido.';
      if (!dep.dia || !dep.mes || !dep.ano) depErrs.data_nascimento = 'Data incompleta.';
      if (!dep.foto) depErrs.foto = 'Foto obrigatória.';
      if (Object.keys(depErrs).length > 0) errs.dependentes![index] = depErrs;
    });

    if (Object.keys(errs.dependentes!).length === 0) delete errs.dependentes;
    return errs;
  }

  // Submit Original
  const handleSubmitNovoCadastro = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setRejeicaoIA(null);
    setSucessoSemToken(null);

    const errs = validateNovoCadastro();
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
      
      fotosArray.forEach((f) => formData.append('fotos', f));

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
        const tokenFinal = res?.token || res?.dados?.token || res?.data?.token || res?.codigo_pedido || '';
        if (typeof window !== 'undefined') {
           localStorage.setItem('saga_residente_nome', nome);
           localStorage.setItem('saga_residente_email', email);
           localStorage.setItem('saga_residente_quantidade', String(integrantes.length));
        }

        if (tokenFinal) {
           router.push(`/checkout-carteira?token=${tokenFinal}`);
        } else {
           setSucessoSemToken({
             mensagem: res?.mensagem || "O seu registro foi aprovado, mas o servidor não nos enviou o link para o pagamento."
           });
        }
      } else {
        setRejeicaoIA({
          mensagem: res?.mensagem || 'Infelizmente não foi possível aprovar a sua documentação. Verifique se as fotos estão nítidas e comprovam a residência.'
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || '';
      if (errorMsg.includes('23505') || errorMsg.includes('already exists')) {
        setApiError("Este CPF já possui uma solicitação em andamento. Consulte o seu email ou utilize outro CPF.");
      } else {
        setApiError('A conexão com o servidor falhou. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleConsultarTitular = async () => {
    setApiError(null);
    const rawCpf = cpfTitularExistente.replace(/\D/g, '');
    if (rawCpf.length !== 11) {
      setApiError('Por favor, digite um CPF válido com 11 dígitos.');
      return;
    }

    setChecandoCpf(true);
    try {
      const response = await fetch(`/api/v1/residentes/consultar-limite/${rawCpf}`);
      const data = await response.json();

      if (data.status === 'erro') {
        setApiError(data.mensagem);
        setVagasRestantes(null);
      } else {
        setNomeTitularEncontrado(data.nome_titular);
        setVagasRestantes(data.vagas_restantes);
        setNumDependentes(1); // Reseta a caixa seletora para 1
      }
    } catch (err) {
      setApiError('Erro ao consultar servidor. Tente novamente.');
    } finally {
      setChecandoCpf(false);
    }
  };

  // Submit Adicionar Dependente Extra
  const handleSubmitDependenteExtra = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setRejeicaoIA(null);
    setSucessoSemToken(null);

    const errs = validateDependenteExtra();
    if (Object.keys(errs).length) {
      setErrors(errs);
      window.scrollTo({ top: 400, behavior: 'smooth' });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const formMembros = dependentes.map(d => ({
        nome: d.nome,
        cpf: d.cpf,
        data_nascimento: `${d.ano}-${d.mes.padStart(2, '0')}-${d.dia.padStart(2, '0')}`
      }));

      const formData = new FormData();
      formData.append('cpf_titular', cpfTitularExistente);
      formData.append('integrantes', JSON.stringify(formMembros));
      dependentes.forEach(d => formData.append('fotos', d.foto!));

      // Chama a nova rota de adicionar-dependente
      const response = await fetch('/api/v1/residentes/adicionar-dependente', {
        method: 'POST',
        body: formData,
      });

      const res = await response.json();

      if (!response.ok || res.status === 'erro') {
        throw new Error(res.mensagem || 'Falha ao validar os dados. O titular já atingiu o limite de 4 dependentes ou o CPF não está ativo.');
      }

      const tokenFinal = res.token || res.titular_id;
      
      if (typeof window !== 'undefined') {
          // Armazenamos a quantidade de *novos* dependentes para cobrar o valor correto
          localStorage.setItem('saga_residente_quantidade', String(formMembros.length));
      }

      router.push(`/checkout-carteira?token=${tokenFinal}`);
      
    } catch (err: any) {
      setApiError(err.message || 'A conexão com o servidor falhou. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // ── ECRÃ VERDE ──
  if (sucessoSemToken) {
    return (
      <main className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-900`}>
        <Header />
        <div className="flex-1 flex items-center justify-center px-4 py-28 sm:px-5">
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
               ⚠ <strong>Aviso Técnico:</strong> O backend não enviou a variável `token` no JSON de resposta. Sem o token, não é possível saltar para a página de checkout.
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => setSucessoSemToken(null)} className="rounded-full bg-slate-900 px-8 py-4 font-bold text-white transition hover:bg-black active:scale-95 shadow-lg">
                Voltar
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── ECRÃ VERMELHO ──
  if (rejeicaoIA) {
    return (
      <main className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-900`}>
        <Header />
        <div className="flex-1 flex items-center justify-center px-4 py-28 sm:px-5">
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

              <div className="mt-4 pt-5 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-3">
                  Acha que houve algum engano na nossa análise automática?
                </p>
                <Link href="/suporte" className="inline-flex w-full items-center justify-center rounded-full border-2 border-slate-200 bg-white px-8 py-3.5 font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:scale-95">
                  Contatar Suporte
                </Link>
              </div>

              <Link href="/" className="mt-3 text-sm font-semibold text-slate-400 hover:text-slate-600">Voltar ao início</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`${inter.className} min-h-screen flex flex-col bg-white text-slate-900 text-left relative`}>
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="mb-6 -mt-10">
             <Loader2 className="h-20 w-20 text-[#00577C] animate-spin" />
          </div>
          <h2 className={`${jakarta.className} text-2xl md:text-3xl font-black text-[#00577C] mt-4`}>
            Documentação em análise...
          </h2>
          <p className="text-slate-500 mt-3 font-medium text-sm md:text-base max-w-md">
            Estamos processando os seus dados de forma segura. Isto levará apenas alguns segundos.
          </p>
        </div>
      )}

      <Header />

      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.pexels.com/photos/38049813/pexels-photo-38049813.jpeg?_gl=1*1ysrytv*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODcxNjc5NjYkbzEwNCRnMSR0MTc4NzE2OTEwOCRqNTkkbDAkaDA." 
            alt="Cartão Residente" 
            fill 
            className="object-cover"
            priority 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[7rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            Residente
          </h1>
          <p className="text-white/95 text-sm md:text-lg font-medium mt-6 drop-shadow-lg max-w-2xl">
            Garanta o seu benefício de 50% de desconto na Cachoeira Três Quedas.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ========================================================= */}
      {/* VISTA 1: ECRÃ DE SELEÇÃO INICIAL (OS DOIS BLOCOS LADO A LADO) */}
      {/* ========================================================= */}
      {view === 'selecao' && (
        <section className="bg-[#FDFCF7] px-4 py-10 md:py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-10 md:mb-14">
              <h2 className={`${jakarta.className} text-3xl md:text-4xl font-black text-slate-900 mb-4`}>O que deseja fazer?</h2>
              <p className="text-slate-500 font-medium max-w-xl mx-auto">Escolha abaixo se deseja emitir a sua primeira carteira de residente ou adicionar membros da família a uma carteira que você já possui.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              
              {/* BLOCO 1: NOVO CADASTRO */}
              <button 
                onClick={() => setView('novo')}
                className="group relative flex flex-col items-center text-center p-8 md:p-12 rounded-[2.5rem] bg-white border-[3px] border-slate-100 hover:border-[#00577C] hover:shadow-2xl transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-full bg-blue-50 text-[#00577C] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#00577C] group-hover:text-white transition-all">
                  <User size={36} strokeWidth={2.5} />
                </div>
                <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-3`}>Fazer Novo Cadastro</h3>
                <p className="text-sm text-slate-500 font-medium mb-8">
                  Para cidadãos que ainda não emitiram a Carteira Digital de Residente. Será necessário enviar comprovante de residência.
                </p>
                <div className="mt-auto flex items-center gap-2 text-[#00577C] font-bold uppercase tracking-widest text-xs">
                  Avançar <ArrowRight size={16} />
                </div>
              </button>

              {/* BLOCO 2: ADICIONAR DEPENDENTE */}
              <button 
                onClick={() => {
                  setView('dependente');
                  setNumDependentes(1);
                }}
                className="group relative flex flex-col items-center text-center p-8 md:p-12 rounded-[2.5rem] bg-white border-[3px] border-slate-100 hover:border-[#009640] hover:shadow-2xl transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-full bg-green-50 text-[#009640] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#009640] group-hover:text-white transition-all">
                  <UserPlus size={36} strokeWidth={2.5} />
                </div>
                <h3 className={`${jakarta.className} text-xl md:text-2xl font-black text-slate-900 mb-3`}>Adicionar Dependentes</h3>
                <p className="text-sm text-slate-500 font-medium mb-8">
                  Já tem a carteira ativa? Adicione os seus familiares usando a sua conta.
                </p>
                <div className="mt-auto flex items-center gap-2 text-[#009640] font-bold uppercase tracking-widest text-xs">
                  Avançar <ArrowRight size={16} />
                </div>
              </button>

            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* VISTA 2: FORMULÁRIO ORIGINAL (NOVO CADASTRO) */}
      {/* ========================================================= */}
      {view === 'novo' && (
        <section className="bg-[#FDFCF7] px-4 py-10 md:py-16 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <button onClick={() => setView('selecao')} className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
              ← Voltar à seleção
            </button>
            <form onSubmit={handleSubmitNovoCadastro} className="overflow-hidden rounded-[2.5rem] md:rounded-[3rem] border-[4px] border-white bg-white shadow-2xl shadow-slate-200/50">
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
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#00577C]">Nome completo (Primeiro e Último Nome)</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Ex: João Santos"
                          value={nome}
                          onChange={(e) => setNome(formatarNome(e.target.value))}
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

                  {/* PACOTE FAMÍLIA ORIGINAL */}
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
                          <input type="text" placeholder="Primeiro e Último Nome" value={dep.nome} onChange={(e) => updateDependente(index, 'nome', formatarNome(e.target.value))}className={`w-full rounded-xl border-2 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-colors focus:bg-white ${errors.dependentes?.[index]?.nome ? 'border-red-300 focus:border-red-500' : 'border-slate-100 hover:border-slate-200 focus:border-[#00577C]'}`} />
                          {errors.dependentes?.[index]?.nome && <p className="text-[10px] font-bold text-red-500">⚠ {errors.dependentes[index].nome}</p>}
                        </div>
                        <div className="space-y-2 text-left">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CPF</label>
                          <CPFInput value={dep.cpf} onChange={(val) => updateDependente(index, 'cpf', val)} error={errors.dependentes?.[index]?.cpf} />
                        </div>
                        <div className="space-y-2 text-left">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nascimento</label>
                           <div className="flex gap-2">
                             <select value={dep.dia} onChange={(e) => updateDependente(index, 'dia', e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 md:p-3 text-xs font-bold outline-none cursor-pointer">
                               <option value="">Dia</option>
                               {days.map(d => <option key={d} value={String(d).padStart(2,'0')}>{d}</option>)}
                             </select>
                             <select value={dep.mes} onChange={(e) => updateDependente(index, 'mes', e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 md:p-3 text-xs font-bold outline-none cursor-pointer">
                               <option value="">Mês</option>
                               {months.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                             </select>
                             <select value={dep.ano} onChange={(e) => updateDependente(index, 'ano', e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 md:p-3 text-xs font-bold outline-none cursor-pointer">
                               <option value="">Ano</option>
                               {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                             </select>
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

                    <div className="mb-8 md:mb-10 space-y-3 md:space-y-4 text-left">
                      <div className="rounded-2xl border-2 border-blue-50 bg-blue-50/50 p-5 md:p-6">
                        <div className="mb-3 md:mb-4 flex items-center gap-3"><Info className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-[#00577C]" /><p className="font-black text-[#00577C] text-sm md:text-base">Regras de Verificação</p></div>
                        <ul className="ml-7 md:ml-9 list-disc space-y-1.5 md:space-y-2 text-xs md:text-sm text-slate-600 font-medium">
                          <li><strong className="text-[#00577C]">Residentes (13 a 59 anos):</strong> Têm direito a 50% apresentando comprovante de morada no município.</li>
                          <li><strong className="text-[#00577C]">Crianças (até 12 anos) e Idosos (60+):</strong> Têm o benefício automático morando em qualquer lugar.</li>
                        </ul>
                      </div>

                      <div className="rounded-2xl border-2 border-green-50 bg-green-50/50 p-5 md:p-6">
                        <div className="mb-3 md:mb-4 flex items-center gap-3"><CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-[#009640]" /><p className="font-black text-[#009640] text-sm md:text-base">Documentos Aceitos</p></div>
                        <ul className="ml-7 md:ml-9 list-disc space-y-1.5 md:space-y-2 text-xs md:text-sm text-slate-600 font-medium">
                          <li><strong className="text-[#009640]">Para provar morada:</strong> Contas (Energia, Água, Internet) ou Título de Eleitor de São Geraldo do Araguaia.</li>
                          <li><strong className="text-[#009640]">Para comprovar idade:</strong> RG, CNH, Passaporte ou Certidão de Nascimento.</li>
                        </ul>
                      </div>
                    </div>

                    {/* UPLOADS */}
                    <div className="grid gap-5 md:gap-6 text-left mb-8 md:mb-10">
                      <div className={`rounded-3xl border-2 bg-slate-50 p-5 md:p-6 transition-colors ${errors.arquivo ? 'border-red-300' : 'border-slate-100 hover:border-slate-200'}`}>
                        <div className="mb-4 md:mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F9C400] text-[#00577C]"><ShieldCheck size={20} /></div>
                          <div><p className="text-[10px] font-black uppercase text-slate-600 tracking-widest leading-tight">Documento Comprobatório *</p></div>
                        </div>
                        <FileUploader onFileSelect={setArquivo} error={errors.arquivo} accept="application/pdf, image/jpeg, image/png" />
                      </div>

                      <div className="space-y-5 md:space-y-6">
                        <div className={`rounded-3xl border-2 bg-slate-50 p-5 md:p-6 transition-colors ${errors.foto ? 'border-red-300' : 'border-slate-100 hover:border-slate-200'}`}>
                          <p className="text-xs font-black uppercase tracking-widest text-[#00577C] mb-4 md:mb-5 flex items-center gap-2"><Camera size={16} className="md:w-[18px] md:h-[18px]"/> Selfie do Titular *</p>
                          <FileUploader onFileSelect={setFoto} error={errors.foto} accept="image/jpeg, image/png" />
                        </div>

                        {hasDependentes && dependentes.map((dep, index) => (
                          <div key={dep.id} className={`rounded-3xl border-2 bg-slate-50 p-5 md:p-6 transition-colors ${errors.dependentes?.[index]?.foto ? 'border-red-300' : 'border-slate-100 hover:border-slate-200'}`}>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-600 mb-4 md:mb-5 flex items-center gap-2">
                               <Camera size={16} className="text-[#00577C] md:w-[18px] md:h-[18px]"/> 
                               Selfie: {dep.nome ? dep.nome.split(' ')[0] : `Familiar ${index+1}`} *
                            </p>
                            <FileUploader onFileSelect={(f) => updateDependente(index, 'foto', f)} error={errors.dependentes?.[index]?.foto} accept="image/jpeg, image/png" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6 md:pt-8 mt-auto text-left">
                    {apiError && (
                      <div className="mb-5 md:mb-6 flex items-center gap-3 rounded-2xl bg-red-50 p-4 md:p-5 text-sm font-bold text-red-700 border border-red-100 animate-in shake duration-500 shadow-sm">
                        <XCircle className="h-5 w-5 shrink-0" /> {apiError}
                      </div>
                    )}

                    <div className="mb-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 md:p-5 text-xs font-medium text-slate-500 leading-relaxed shadow-sm">
                      <p>Ao clicar em <strong>"Avançar para Verificação"</strong>, concorda com a LGPD e a nossa política de privacidade.</p>
                    </div>

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#00577C] px-8 md:px-10 py-4 md:py-5 text-base md:text-lg font-black text-white shadow-xl shadow-blue-900/10 transition hover:-translate-y-1 hover:bg-[#004a6b] disabled:opacity-60 sm:w-auto">
                        {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Verificando...</> : <><FileCheck2 className="h-5 w-5" /> Avançar para Verificação <ArrowRight className="h-5 w-5" /></>}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* VISTA 3: FORMULÁRIO DE ADICIONAR APENAS DEPENDENTES EXTRA */}
      {/* ========================================================= */}
      {view === 'dependente' && (
        <section className="bg-[#FDFCF7] px-4 py-10 md:py-16 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <button onClick={() => setView('selecao')} className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
              ← Voltar à seleção
            </button>
            <form onSubmit={handleSubmitDependenteExtra} className="overflow-hidden rounded-[2.5rem] md:rounded-[3rem] border-[4px] border-white bg-white shadow-2xl shadow-slate-200/50 p-6 sm:p-10 text-left">
              
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#009640] text-white">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className={`${jakarta.className} text-2xl md:text-3xl font-black text-slate-900`}>Adicionar Familiares</h2>
                  <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">Vincule dependentes à sua carteira atual</p>
                </div>
              </div>

              {/* ETAPA 1: CONSULTAR CPF DO TITULAR */}
              <div className="mb-10 bg-slate-50 border border-slate-200 p-6 rounded-3xl">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-2">CPF do Titular da Conta *</label>
                <p className="text-xs text-slate-500 mb-4">Insira o CPF de quem já possui a carteira ATIVA no sistema.</p>
                <div className="flex flex-col md:flex-row gap-4 max-w-xl">
                  <div className="flex-1">
                    <CPFInput value={cpfTitularExistente} onChange={setCpfTitularExistente} error={errors.cpf} />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleConsultarTitular}
                    disabled={checandoCpf}
                    className="h-[52px] px-6 rounded-xl bg-[#00577C] text-white font-bold hover:bg-[#004766] transition disabled:opacity-50"
                  >
                    {checandoCpf ? 'Consultando...' : 'Consultar'}
                  </button>
                </div>
                {apiError && <p className="text-sm font-bold text-red-600 mt-3 animate-in fade-in">⚠ {apiError}</p>}
              </div>

              {/* ETAPA 2: RESULTADO E FORMULÁRIOS (SÓ APARECE SE VAGASRESTANTES FOR DIFERENTE DE NULL) */}
              {vagasRestantes !== null && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  {vagasRestantes === 0 ? (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 text-amber-800 text-center mb-6">
                      <XCircle className="h-10 w-10 mx-auto text-amber-500 mb-2" />
                      <h3 className="font-black text-lg mb-1">Limite Atingido</h3>
                      <p className="text-sm font-medium">Olá, {nomeTitularEncontrado.split(' ')[0]}. Você já possui 4 dependentes atrelados à sua conta. Não é possível adicionar mais familiares.</p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl bg-green-50 border border-green-200 p-5 text-green-800 mb-8 flex items-center gap-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                        <div>
                          <p className="font-bold text-sm">Olá, {nomeTitularEncontrado.split(' ')[0]}!</p>
                          <p className="text-xs font-medium">Você ainda pode adicionar <strong>{vagasRestantes} familiar(es)</strong> à sua carteira.</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-[#00577C] mb-3">Quantos dependentes deseja adicionar agora?</label>
                        <select 
                          value={numDependentes} 
                          onChange={(e) => setNumDependentes(Number(e.target.value))} 
                          className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-4 text-sm font-bold outline-none cursor-pointer focus:border-[#009640]"
                        >
                          {/* A MÁGICA DO DROPDOWN DINÂMICO AQUI */}
                          {Array.from({ length: vagasRestantes }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n} familiar{n > 1 ? 'es' : ''}</option>
                          ))}
                        </select>
                      </div>

                      {dependentes.map((dep, index) => (
                        <div key={dep.id} className="mt-5 md:mt-6 p-5 md:p-6 rounded-3xl border-2 border-slate-100 bg-white space-y-4 md:space-y-5">
                          <h4 className="font-black text-slate-800 mb-2 flex items-center gap-2 text-sm md:text-base">
                             <span className="w-6 h-6 rounded-full bg-green-50 text-[#009640] flex items-center justify-center text-xs">{index + 1}</span> 
                             Novo Familiar
                          </h4>
                          <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Completo</label>
                              <input type="text" placeholder="Primeiro e Último Nome" value={dep.nome} onChange={(e) => updateDependente(index, 'nome', formatarNome(e.target.value))}className={`w-full rounded-xl border-2 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-colors focus:bg-white ${errors.dependentes?.[index]?.nome ? 'border-red-300 focus:border-red-500' : 'border-slate-100 hover:border-slate-200 focus:border-[#009640]'}`} />
                              {errors.dependentes?.[index]?.nome && <p className="text-[10px] font-bold text-red-500">⚠ {errors.dependentes[index].nome}</p>}
                            </div>
                            <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CPF</label>
                              <CPFInput value={dep.cpf} onChange={(val) => updateDependente(index, 'cpf', val)} error={errors.dependentes?.[index]?.cpf} />
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-left">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nascimento</label>
                             <div className="flex gap-2">
                               <select value={dep.dia} onChange={(e) => updateDependente(index, 'dia', e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 md:p-3 text-xs font-bold outline-none cursor-pointer">
                                 <option value="">Dia</option>
                                 {days.map(d => <option key={d} value={String(d).padStart(2,'0')}>{d}</option>)}
                               </select>
                               <select value={dep.mes} onChange={(e) => updateDependente(index, 'mes', e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 md:p-3 text-xs font-bold outline-none cursor-pointer">
                                 <option value="">Mês</option>
                                 {months.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                               </select>
                               <select value={dep.ano} onChange={(e) => updateDependente(index, 'ano', e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 md:p-3 text-xs font-bold outline-none cursor-pointer">
                                 <option value="">Ano</option>
                                 {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                               </select>
                             </div>
                             {errors.dependentes?.[index]?.data_nascimento && <p className="text-[10px] font-bold text-red-500">⚠ {errors.dependentes[index].data_nascimento}</p>}
                          </div>

                          <div className={`rounded-3xl border-2 bg-slate-50 p-5 mt-4 transition-colors ${errors.dependentes?.[index]?.foto ? 'border-red-300' : 'border-slate-100 hover:border-slate-200'}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#009640] mb-3 flex items-center gap-2">
                               <Camera size={14}/> Foto 3x4 do Familiar *
                            </p>
                            <FileUploader onFileSelect={(f) => updateDependente(index, 'foto', f)} error={errors.dependentes?.[index]?.foto} accept="image/jpeg, image/png" />
                          </div>
                        </div>
                      ))}

                      <div className="border-t border-slate-100 pt-6 mt-8">
                        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#009640] px-8 py-4 text-base md:text-lg font-black text-white shadow-xl shadow-green-900/10 transition hover:-translate-y-1 hover:bg-[#007a33] disabled:opacity-60">
                          {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Adicionando...</> : <><FileCheck2 className="h-5 w-5" /> Adicionar e Avançar para Pagamento <ArrowRight className="h-5 w-5" /></>}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

            </form>
          </div>
        </section>
      )}

      {/* FOOTER */}
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
    </main>
  );
}