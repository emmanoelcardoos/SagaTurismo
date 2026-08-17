'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, LogOut, Map, 
  Plus, Compass, ArrowRight, CheckCircle2, Star, Image as ImageIcon, MapPin
} from 'lucide-react';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

type Passeio = {
  id: string;
  titulo: string;
  descricao_curta: string;
  imagem_principal?: string;
  ativo?: boolean;
};

export default function DashboardAgenciaPage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [passeios, setPasseios] = useState<Passeio[]>([]);

  // ── ESTADOS DOS DESTAQUES ──
  const [destaque1, setDestaque1] = useState<string>('');
  const [destaque2, setDestaque2] = useState<string>('');
  const [salvandoDestaques, setSalvandoDestaques] = useState(false);
  const [mensagemDestaques, setMensagemDestaques] = useState('');

  // 1. VALIDAÇÃO DE SESSÃO DA AGÊNCIA
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const nome = localStorage.getItem("nome_negocio");
    const tipo = localStorage.getItem("tipo_parceiro"); 

    if (!id || (tipo !== 'agencia' && tipo !== 'semtur' && tipo !== 'pacote')) {
      router.push('/parceiros');
    } else {
      setParceiroId(id);
      setNomeNegocio(nome || 'Agência de Turismo');
    }
  }, [router]);

  // 2. CARREGAR DADOS DA VITRINE
  useEffect(() => {
    if (!parceiroId) return;

    async function carregarDashboard() {
      try {
        const { data: agenciaData } = await supabase
          .from('agencias')
          .select('nome, logo_url, destaque_1_id, destaque_2_id')
          .eq('id', parceiroId)
          .single();

        if (agenciaData) {
           if (agenciaData.nome) setNomeNegocio(agenciaData.nome);
           if (agenciaData.logo_url && agenciaData.logo_url.trim() !== '') {
             setLogoUrl(agenciaData.logo_url);
           } else {
             setLogoUrl(null);
           }
           setDestaque1(agenciaData.destaque_1_id || '');
           setDestaque2(agenciaData.destaque_2_id || '');
        }

        const { data: dadosPasseios, error: errPasseios } = await supabase
          .from('passeios')
          .select('id, titulo, descricao_curta, imagem_principal, ativo')
          .eq('agencia_id', parceiroId);

        if (!errPasseios && dadosPasseios) {
          setPasseios(dadosPasseios as Passeio[]);
        }

      } catch (error) {
        console.error("Erro ao carregar a vitrine:", error);
      } finally {
        setLoading(false);
      }
    }
    
    carregarDashboard();
  }, [parceiroId]);

  // 3. FUNÇÃO PARA SALVAR OS DESTAQUES
  const handleSalvarDestaques = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoDestaques(true);
    setMensagemDestaques('');
    try {
      const { error } = await supabase
        .from('agencias')
        .update({ 
          destaque_1_id: destaque1 || null, 
          destaque_2_id: destaque2 || null 
        })
        .eq('id', parceiroId);

      if (error) throw error;
      setMensagemDestaques('Vitrine atualizada com sucesso!');
    } catch (err) {
      setMensagemDestaques('Erro ao atualizar os destaques.');
    } finally {
      setSalvandoDestaques(false);
      setTimeout(() => setMensagemDestaques(''), 4000);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/parceiros');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF7] text-[#00577C]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest text-slate-500">A preparar o seu estúdio...</p>
      </div>
    );
  }

  const IMG_FALLBACK = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1721";

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col`}>
      
      {/* HEADER DA AGÊNCIA */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo da marca (clicável para a homepage) */}
            <Link href="/" className="hidden sm:block relative h-10 w-32 border-r border-slate-200 pr-6">
              <Image src="/logop.png" alt="SagaTurismo" fill priority className="object-contain object-left" />
            </Link>
            
            {/* Bloco da Agência com a sua logo (usando img nativa para compatibilidade) */}
            <div className="flex items-center gap-3">
              {logoUrl && logoUrl.trim() !== '' && !logoError ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 bg-white shadow-sm flex-shrink-0">
                  <img 
                    src={logoUrl} 
                    alt={nomeNegocio} 
                    className="w-full h-full object-cover object-center"
                    onError={() => setLogoError(true)}
                  />
                </div>
              ) : (
                <div className="bg-[#00577C] text-white p-2.5 rounded-xl shadow-lg">
                  <Compass size={20} />
                </div>
              )}
              <div>
                <h1 className={`${jakarta.className} font-black text-slate-900 text-lg md:text-xl leading-none`}>{nomeNegocio}</h1>
                <p className="text-[10px] font-black uppercase text-[#F9C400] tracking-[0.2em] mt-0.5">Painel de Vitrine</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/parceiros/dashboard-agencia/disponibilidade" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-[#009640] hover:bg-green-700 px-5 py-2.5 rounded-full shadow-md transition-all active:scale-95">
              <Plus size={14} /> <span className="hidden sm:inline">Novo Passeio</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center justify-center w-10 h-10 md:w-auto md:px-5 md:py-2.5 rounded-full text-slate-500 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm transition-all">
              <LogOut size={16} className="md:mr-2" /> <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-10 py-10 flex-1 space-y-12">
        
        {/* ── CONFIGURAÇÕES DA VITRINE (OS 2 DESTAQUES) ── */}
        <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col lg:flex-row gap-10">
           <div className="flex-1 text-left max-w-md">
             <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-50 text-amber-500 p-3 rounded-xl shadow-inner border border-amber-100"><Star size={24} className="fill-amber-400"/></div>
                <h2 className={`${jakarta.className} text-2xl font-black text-slate-800`}>A Sua Vitrine</h2>
             </div>
             <p className="text-sm font-medium text-slate-500 leading-relaxed">
               A sua agência tem uma página pública exclusiva. Escolha os seus <span className="font-bold text-slate-800">dois melhores passeios</span> para ganharem destaque máximo no topo do seu perfil, atraindo imediatamente a atenção dos turistas.
             </p>
           </div>
           
           <div className="flex-[1.5] w-full bg-[#FDFCF7] border border-slate-200 p-6 md:p-8 rounded-3xl text-left shadow-inner">
             <form onSubmit={handleSalvarDestaques} className="flex flex-col gap-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dropdown Destaque 1 */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><Star size={12}/> Destaque Principal 1</label>
                    <select 
                      value={destaque1} 
                      onChange={(e) => setDestaque1(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#00577C] transition-colors shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="">Nenhum destaque selecionado</option>
                      {passeios.map(p => (
                        <option key={`d1-${p.id}`} value={p.id}>{p.titulo}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dropdown Destaque 2 */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><Star size={12}/> Destaque Principal 2</label>
                    <select 
                      value={destaque2} 
                      onChange={(e) => setDestaque2(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#00577C] transition-colors shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="">Nenhum destaque selecionado</option>
                      {passeios.map(p => (
                        <option key={`d2-${p.id}`} value={p.id}>{p.titulo}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                  <div className="h-6">
                    {mensagemDestaques && (
                      <p className={`text-xs font-bold ${mensagemDestaques.includes('Erro') ? 'text-red-500' : 'text-[#009640]'} flex items-center gap-1.5 animate-in fade-in`}>
                        <CheckCircle2 size={14}/> {mensagemDestaques}
                      </p>
                    )}
                  </div>
                  <button type="submit" disabled={salvandoDestaques} className="w-full sm:w-auto bg-[#00577C] hover:bg-[#004a6b] disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl shadow-md transition-all active:scale-95">
                    {salvandoDestaques ? 'A Guardar...' : 'Atualizar Vitrine'}
                  </button>
                </div>
             </form>
           </div>
        </section>

        {/* LISTAGEM DE PASSEIOS DA VITRINE */}
        <section>
           <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
             <div>
                <h2 className={`${jakarta.className} text-2xl font-black text-slate-800`}>As Suas Expedições</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Todos os passeios e roteiros que publicou para a cidade.</p>
             </div>
           </div>

           {passeios.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-[2rem] p-16 text-center flex flex-col items-center shadow-sm">
                 <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                    <ImageIcon size={40} className="text-slate-300" />
                 </div>
                 <h3 className={`${jakarta.className} text-2xl font-black text-slate-800 mb-3`}>Vitrine Vazia</h3>
                 <p className="text-slate-500 font-medium text-base max-w-md mb-8">A sua página ainda não tem nenhum atrativo publicado. Comece a encantar os turistas criando o seu primeiro passeio.</p>
                 <Link href="/parceiros/dashboard-agencia/disponibilidade" className="bg-[#009640] text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-colors shadow-lg active:scale-95">
                    Criar o Primeiro Passeio
                 </Link>
              </div>
           ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {passeios.map(passeio => (
                    <div key={passeio.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                       <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                          <Image src={passeio.imagem_principal || IMG_FALLBACK} alt={passeio.titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            <div className="bg-white/95 backdrop-blur text-slate-700 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                              {passeio.ativo !== false ? 'Visível' : 'Oculto'}
                            </div>
                            {(destaque1 === passeio.id || destaque2 === passeio.id) && (
                              <div className="bg-[#F9C400] text-amber-900 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                                <Star size={10} className="fill-amber-900"/> Destaque
                              </div>
                            )}
                          </div>
                       </div>
                       
                       <div className="p-6 flex-1 flex flex-col text-left">
                          <h3 className={`${jakarta.className} text-lg font-black text-slate-900 leading-tight mb-2 line-clamp-2`}>
                             {passeio.titulo}
                          </h3>
                          
                          <p className="text-xs font-medium text-slate-500 line-clamp-3 mb-6 flex-1">
                             {passeio.descricao_curta || 'Sem descrição cadastrada.'}
                          </p>

                          <Link 
                            href={`/parceiros/dashboard-agencia/disponibilidade?id=${passeio.id}`}
                            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#00577C] text-xs font-black uppercase tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                          >
                             Editar Passeio <ArrowRight size={14} />
                          </Link>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </section>

      </div>
    </div>
  );
}