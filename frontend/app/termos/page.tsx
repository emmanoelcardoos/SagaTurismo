'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Download, Menu, X, ChevronDown, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

/* -------------------------------------------------------------------------
 * SagaTurismo — Termos de Uso
 * Secretaria Municipal de Turismo de São Geraldo do Araguaia (SGA/PA)
 * ---------------------------------------------------------------------- */

const TOC = [
  { id: 'objeto', label: '1. Objeto e aceitação' },
  { id: 'definicoes', label: '2. Definições' },
  { id: 'elegibilidade', label: '3. Elegibilidade e cadastro' },
  { id: 'carteira', label: '4. Carteira Digital de Residente' },
  { id: 'validacao-ia', label: '5. Envio de documentos e validação por IA' },
  { id: 'obrigacoes', label: '6. Obrigações do usuário' },
  { id: 'uso-indevido', label: '7. Uso indevido e cancelamento' },
  { id: 'propriedade', label: '8. Propriedade intelectual' },
  { id: 'responsabilidade', label: '9. Limitação de responsabilidade' },
  { id: 'privacidade', label: '10. Privacidade e proteção de dados' },
  { id: 'alteracoes', label: '11. Alterações destes Termos' },
  { id: 'foro', label: '12. Legislação e foro' },
  { id: 'contato', label: '13. Contato' },
];

export default function TermosDeUsoPage() {
  return (
    <div className={`${inter.className} flex min-h-screen flex-col bg-[#FDFCF7] text-slate-800`}>
      <Header />

      <main className="flex-1 mt-[72px] md:mt-[80px]">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          {/* Cabeçalho da página */}
          <div className="mb-10 flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between print:hidden">
            <div>
              <h1 className={`${jakarta.className} mt-4 text-4xl font-black tracking-tight text-[#00577C] md:text-5xl`}>
                Termos de Uso
              </h1>
              <p className="mt-4 text-sm text-slate-500 font-medium">
                Plataforma SagaTurismo · Última atualização: 03 de Agosto de 2026 · Versão preliminar 0.2
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className={`${jakarta.className} inline-flex items-center justify-center gap-2 rounded-full bg-[#00577C] px-6 py-3.5 text-xs uppercase tracking-widest font-black text-white shadow-lg shadow-[#00577C]/20 transition hover:bg-[#004a6b] hover:-translate-y-0.5`}
            >
              <Download className="h-4 w-4" />
              Baixar PDF
            </button>
          </div>

          <div className="lg:grid lg:grid-cols-[1fr_260px] lg:items-start lg:gap-12">
            {/* Conteúdo */}
            <article className="min-w-0 divide-y divide-slate-200">
              <Section id="objeto" number="1" title="Objeto e aceitação dos Termos">
                <P>
                  Estes Termos de Uso (&quot;Termos&quot;) regulam o acesso e a utilização da plataforma
                  SagaTurismo (&quot;Plataforma&quot;), disponibilizada pela Secretaria Municipal de
                  Turismo de São Geraldo do Araguaia, Estado do Pará (&quot;Secretaria&quot; ou
                  &quot;Município&quot;), destinada à emissão da Carteira Digital de Residente e à
                  divulgação de serviços e atrativos turísticos do município.
                </P>
                <P>
                  Ao acessar a Plataforma, preencher o cadastro ou solicitar a Carteira Digital de
                  Residente, o usuário declara ter lido, compreendido e aceitado integralmente estes
                  Termos e a{' '}
                  <Link href="/privacidade" className="font-black text-[#00577C] underline underline-offset-2">
                    Política de Privacidade
                  </Link>{' '}
                  da Plataforma. Caso não concorde com qualquer disposição, o usuário não deve utilizar a
                  Plataforma.
                </P>
              </Section>

              <Section id="definicoes" number="2" title="Definições">
                <Ul>
                  <Li>
                    <strong>Plataforma:</strong> o sistema SagaTurismo, incluindo o site, aplicativo e
                    demais canais digitais operados pela Secretaria.
                  </Li>
                  <Li>
                    <strong>Usuário / Titular:</strong> pessoa física que acessa a Plataforma e/ou solicita
                    a Carteira Digital de Residente.
                  </Li>
                  <Li>
                    <strong>Carteira Digital de Residente:</strong> documento eletrônico emitido pela
                    Plataforma que identifica o usuário como residente do município para fins de acesso a
                    benefícios turísticos.
                  </Li>
                  <Li>
                    <strong>Comprovante de Residência:</strong> documento apto a atestar domicílio no
                    município de São Geraldo do Araguaia.
                  </Li>
                </Ul>
              </Section>

              <Section id="elegibilidade" number="3" title="Elegibilidade e cadastro">
                <P>Para solicitar a Carteira Digital de Residente, o usuário deve:</P>
                <Ul>
                  <Li>Comprovar residência efetiva no município de São Geraldo do Araguaia/PA;</Li>
                  <Li>Ser maior de 18 anos ou, se menor, ser representado por responsável legal;</Li>
                  <Li>
                    Fornecer informações verdadeiras, completas e atualizadas durante o cadastro, incluindo
                    nome completo, CPF, data de nascimento e e-mail;
                  </Li>
                  <Li>Enviar selfie e comprovante de residência aptos à verificação automatizada.</Li>
                </Ul>
                <P>
                  Cada CPF pode estar associado a apenas uma Carteira Digital de Residente ativa. Cadastros
                  duplicados ou com indícios de fraude poderão ser recusados ou cancelados a qualquer
                  tempo.
                </P>
              </Section>

              <Section id="carteira" number="4" title="Da Carteira Digital de Residente e do benefício">
                <P>
                  A Carteira Digital de Residente, quando aprovada, concede ao titular desconto de até{' '}
                  <strong>50% (cinquenta por cento)</strong> especificamente na entrada do <strong>Parque Cachoeira Três Quedas</strong>. Outros serviços e atrativos turísticos oferecidos
                  por estabelecimentos parceiros cadastrados na Plataforma não estão incluídos neste benefício temporariamente.
                </P>
                <Ul>
                  <Li>
                    O percentual, as condições e a lista de estabelecimentos parceiros podem ser alterados
                    pela Secretaria a qualquer momento, mediante aviso na Plataforma;
                  </Li>
                  <Li>
                    A aplicação do desconto depende da adesão e disponibilidade do estabelecimento parceiro
                    no momento do uso;
                  </Li>
                  <Li>
                    A carteira é pessoal e intransferível, devendo ser apresentada, quando solicitado,
                    juntamente com documento oficial com foto para fins de fiscalização.
                  </Li>
                </Ul>
              </Section>

              <Section id="validacao-ia" number="5" title="Do envio de documentos e do processo de validação">
                <P>
                  Para emissão da carteira, o usuário envia uma <strong>selfie</strong> (foto do rosto) e um{' '}
                  <strong>comprovante de residência</strong>. É fundamental que o usuário compreenda como
                  esses arquivos são tratados:
                </P>
                <Ul>
                  <Li>
                    A análise é <strong>inteiramente automatizada</strong>, realizada por um sistema de
                    Inteligência Artificial, que extrai os dados dos documentos e valida sua autenticidade
                    e consistência com as informações do cadastro;
                  </Li>
                  <Li>
                    <strong>Nenhum servidor, funcionário, estagiário ou terceiro</strong> visualiza,
                    baixa, imprime ou armazena manualmente a selfie ou o comprovante de residência
                    enviados;
                  </Li>
                  <Li>
                    Concluída a análise automatizada — com aprovação ou reprovação — os arquivos originais
                    do comprovante de residência e da selfie são{' '}
                    <strong>excluídos permanente e irreversivelmente</strong> dos servidores de
                    processamento;
                  </Li>
                  <Li>
                    Em caso de aprovação, permanecem armazenados apenas a fotografia de rosto aprovada
                    (utilizada na carteira), o nome, o CPF e o e-mail do titular, estritamente para gerar a
                    carteira digital e permitir sua fiscalização;
                  </Li>
                  <Li>
                    Caso a IA não consiga validar os documentos, a solicitação será recusada e o usuário
                    poderá reenviar novos documentos.
                  </Li>
                </Ul>
                <P>
                  Mais detalhes sobre esse tratamento constam na{' '}
                  <Link href="/privacidade" className="font-black text-[#00577C] underline underline-offset-2">
                    Política de Privacidade
                  </Link>
                  , que integra estes Termos.
                </P>
              </Section>

              <Section id="obrigacoes" number="6" title="Obrigações do usuário">
                <Ul>
                  <Li>Fornecer informações e documentos verdadeiros, exatos e atualizados;</Li>
                  <Li>Utilizar a Plataforma e a carteira exclusivamente para fins pessoais e lícitos;</Li>
                  <Li>Não utilizar documentos, fotos ou dados de terceiros sem autorização;</Li>
                  <Li>Zelar pela guarda de eventuais credenciais de acesso à Plataforma;</Li>
                  <Li>
                    Comunicar à Secretaria caso identifique uso indevido de sua carteira ou de seus dados.
                  </Li>
                </Ul>
              </Section>

              <Section id="uso-indevido" number="7" title="Uso indevido, suspensão e cancelamento">
                <P>
                  A Secretaria poderá suspender ou cancelar, a qualquer tempo e sem aviso prévio, a
                  Carteira Digital de Residente nas seguintes hipóteses:
                </P>
                <Ul>
                  <Li>Fornecimento de informações falsas ou documentos adulterados;</Li>
                  <Li>Empréstimo, cessão ou uso da carteira por pessoa diversa do titular;</Li>
                  <Li>Perda superveniente da condição de residente do município;</Li>
                  <Li>Uso fraudulento ou que viole estes Termos ou a legislação vigente.</Li>
                </Ul>
                <P>
                  As condutas acima não excluem a adoção de medidas administrativas e legais cabíveis pelo
                  Município.
                </P>
              </Section>

              <Section id="propriedade" number="8" title="Propriedade intelectual">
                <P>
                  A marca SagaTurismo, seu logotipo, layout, textos, códigos e demais elements da
                  Plataforma são de titularidade do Município de São Geraldo do Araguaia ou de terceiros
                  que autorizaram seu uso, sendo vedada a reprodução, cópia ou utilização não autorizada,
                  total ou parcial, para quaisquer fins.
                </P>
              </Section>

              <Section id="responsabilidade" number="9" title="Limitação de responsabilidade">
                <Ul>
                  <Li>
                    A Plataforma é disponibilizada &quot;como está&quot;, podendo apresentar
                    indisponibilidades temporárias para manutenção, atualização ou por motivos alheios ao
                    controle da Secretaria;
                  </Li>
                  <Li>
                    A Secretaria não garante a adesão contínua de estabelecimentos parceiros, tampouco se
                    responsabiliza por eventual recusa indevida na aplicação do desconto por parte desses
                    estabelecimentos, cabendo ao usuário reportar o ocorrido para apuração;
                  </Li>
                  <Li>
                    O usuário é o único responsável pela veracidade dos dados e documentos fornecidos.
                  </Li>
                </Ul>
              </Section>

              <Section id="privacidade" number="10" title="Privacidade e proteção de dados">
                <P>
                  O tratamento de dados pessoais realizado pela Plataforma observa a Lei nº 13.709/2018
                  (Lei Geral de Proteção de Dados — LGPD) e está detalhado na{' '}
                  <Link href="/privacidade" className="font-black text-[#00577C] underline underline-offset-2">
                    Política de Privacidade
                  </Link>
                  , documento que integra estes Termos e deve ser lido em conjunto com eles.
                </P>
              </Section>

              <Section id="alteracoes" number="11" title="Alterações destes Termos">
                <P>
                  A Secretaria poderá alterar estes Termos a qualquer momento, para adequação legal,
                  operacional ou de segurança, publicando a versão atualizada nesta mesma página, com
                  indicação da data de revisão. O uso continuado da Plataforma após eventuais alterações
                  implica concordância com o novo texto.
                </P>
              </Section>

              <Section id="foro" number="12" title="Legislação aplicável e foro">
                <P>
                  Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro
                  da Comarca de São Geraldo do Araguaia, Estado do Pará, para dirimir quaisquer controvérsias
                  decorrentes destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja.
                </P>
              </Section>

              <Section id="contato" number="13" title="Contato">
                <P>
                  Dúvidas sobre estes Termos podem ser encaminhadas à Secretaria Municipal de Turismo de
                  São Geraldo do Araguaia pelos canais oficiais divulgados na Plataforma.
                </P>
              </Section>
            </article>

            {/* Sumário lateral (desktop) */}
            <TableOfContents />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* --------------------------------- UI bits -------------------------------- */

function TableOfContents() {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-28 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className={`${jakarta.className} mb-3 text-xs font-black uppercase tracking-wide text-slate-400`}>
          Nesta página
        </p>
        <nav className="space-y-2.5 text-sm font-bold">
          {TOC.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="block text-slate-600 transition hover:text-[#00577C]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function Section({ id, number, title, children }: { id: string; number: string; title: string; children: ReactNode; }) {
  return (
    <section id={id} className="scroll-mt-28 py-8 first:pt-0">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#00577C]/10 text-sm font-black text-[#00577C]">
          {number}
        </span>
        <div className="min-w-0 flex-1 pt-1.5">
          <h2 className={`${jakarta.className} text-xl font-black tracking-tight text-slate-900 md:text-2xl`}>{title}</h2>
          <div className="mt-4 space-y-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed font-medium text-slate-600">{children}</p>;
}

function Ul({ children }: { children: ReactNode }) {
  return <ul className="space-y-3">{children}</ul>;
}

function Li({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-[#009640]" />
      <span className="leading-relaxed font-medium text-slate-600">{children}</span>
    </li>
  );
}

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuGroups = [
  { label: 'Descobrir', links: ['Atrativos', 'História', 'Biodiversidade', 'Galeria'] },
  { label: 'Viver Cultural', links: ['Comunidades'] },
  { label: 'Planejar', links: ['Hospedagens', 'Gastronomia', 'Agências', 'Informações', 'CAT'] },
  { label: 'Institucional', links: ['SEMTUR', 'COMTUR', 'Parceiros'] },
];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 transition-all duration-500 print:hidden">
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
              <button className={`${jakarta.className} flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#00577C] transition-colors`}>
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
          <Link href="/cadastro" className={`hidden lg:inline-flex ${jakarta.className} px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#F9C400] text-[#002f40] hover:scale-105 transition-all shadow-sm`}>
            Residente
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-xl p-2 lg:hidden text-[#00577C] hover:bg-slate-100 transition-all duration-300">
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