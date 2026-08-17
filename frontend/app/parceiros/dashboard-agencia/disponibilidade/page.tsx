'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, Home, LogOut, Save, 
  AlertCircle, CheckCircle2, Type, 
  Upload, Image as ImageIcon, Compass, Images
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function CriarPasseioPage() {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  
  // Estados de Carregamento e Feedback
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  // Categorias Dinâmicas
  const [categoriasDb, setCategoriasDb] = useState<string[]>(['Aventura', 'Trilha', 'Ecológico', 'Cultural', 'Aquático']);

  // Ficheiros de Imagem
  const [arquivoCapa, setArquivoCapa] = useState<File | null>(null);
  const [arquivosGaleria, setArquivosGaleria] = useState<File[]>([]);

  // Campos do Formulário
  const [formData, setFormData] = useState({
    titulo: '',
    descricao_curta: '',
    descricao_completa: '',
    ponto_encontro: '',
    coordenadas_google_maps: '',
    categoria: 'Aventura'
  });

  // 1. VALIDAÇÃO DE ACESSO
  useEffect(() => {
    const id = localStorage.getItem("parceiro_id");
    const tipo = localStorage.getItem("tipo_parceiro"); 
    
    if (!id || (tipo !== 'agencia' && tipo !== 'semtur' && tipo !== 'pacote')) {
      router.push('/parceiros');
      return;
    }
    setParceiroId(id);

    async function puxarCategorias() {
      const { data } = await supabase.from('passeios').select('categoria');
      if (data) {
        const catsUnicas = Array.from(new Set(data.map(p => p.categoria).filter(Boolean))) as string[];
        if (catsUnicas.length > 0) {
          setCategoriasDb(catsUnicas);
          setFormData(prev => ({ ...prev, categoria: catsUnicas[0] }));
        }
      }
    }
    puxarCategorias();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArquivosGaleria(Array.from(e.target.files));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/parceiros');
  };

  // 2. FUNÇÃO DE LANÇAMENTO (DIRETO NA TABELA PASSEIOS)
  const handleLancarPasseio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoCapa) {
      setErro("A foto de capa é obrigatória para a vitrine.");
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      // 1. Upload da Capa Principal para o novo Bucket 'passeios'
      const nomeLimpo = limparNomeArquivo(arquivoCapa.name);
      const pathCapa = `vitrine/${parceiroId}_${Date.now()}_${nomeLimpo}`;
      
      const { error: errUploadCapa } = await supabase.storage.from('passeios').upload(pathCapa, arquivoCapa);
      if (errUploadCapa) throw new Error("Falha no upload da imagem da capa.");
      const { data: urlPublicaCapa } = supabase.storage.from('passeios').getPublicUrl(pathCapa);

      // 2. Upload da Galeria para o novo Bucket 'passeios'
      const urlsGaleria: string[] = [];
      if (arquivosGaleria.length > 0) {
        for (let i = 0; i < arquivosGaleria.length; i++) {
          const file = arquivosGaleria[i];
          const fileLimpo = limparNomeArquivo(file.name);
          const pathGaleria = `vitrine/galeria_${parceiroId}_${Date.now()}_${i}_${fileLimpo}`;
          
          const { error: errGaleria } = await supabase.storage.from('passeios').upload(pathGaleria, file);
          if (!errGaleria) {
            const { data: urlPublicaGaleria } = supabase.storage.from('passeios').getPublicUrl(pathGaleria);
            urlsGaleria.push(urlPublicaGaleria.publicUrl);
          }
        }
      }

      // 3. Inserção direta na tabela de passeios
      const { error: errInsert } = await supabase
        .from('passeios')
        .insert({
          titulo: formData.titulo,
          descricao_curta: formData.descricao_curta,
          descricao_completa: formData.descricao_completa,
          ponto_encontro: formData.ponto_encontro || null,
          coordenadas_google_maps: formData.coordenadas_google_maps || null,
          categoria: formData.categoria,
          imagem_principal: urlPublicaCapa.publicUrl,
          // Agora o Supabase e o JSONB aceitam a lista nativa do JavaScript!
          imagens_galeria: urlsGaleria.length > 0 ? urlsGaleria : null,
          agencia_id: parceiroId, 
          ativo: true
        });

      if (errInsert) throw errInsert;

      setSucesso(true);
      setTimeout(() => router.push('/parceiros/dashboard-agencia'), 2000);
      
    } catch (err: any) {
      console.error(err);
      setErro(err.message || "Falha ao publicar na vitrine.");
    } finally {
      setEnviando(false);
    }
  };

  const limparNomeArquivo = (nome: string) => 
    nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9.]/g, '_').replace(/_{2,}/g, '_');

  return (
    <div className={`${inter.className} min-h-screen bg-[#FDFCF7] text-slate-900 pb-20`}>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-10 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <Link href="/" className="relative h-10 w-28 md:w-36 shrink-0 transition-transform active:scale-95">
            <Image src="/logop.png" alt="SagaTurismo" fill priority className="object-contain object-left" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/parceiros/dashboard-agencia" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-full shadow-sm">
              <Home size={14} /> <span className="hidden sm:inline">Meu Painel</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-[#00577C] hover:bg-[#004a6b] px-4 py-2.5 rounded-full shadow-sm transition-colors">
              <LogOut size={14} /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 mt-12 space-y-8">
        <div className="text-center mb-10">
           <h1 className={`${jakarta.className} text-3xl md:text-4xl font-black text-[#00577C] tracking-tight mb-3`}>Publicar na Vitrine</h1>
           <p className="text-slate-500 font-medium">Preencha as informações abaixo para destacar a sua expedição no portal oficial de São Geraldo do Araguaia.</p>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl flex items-start gap-3 shadow-sm">
            <AlertCircle size={20} className="shrink-0 text-red-500 mt-0.5" />
            <p className="text-sm font-bold">{erro}</p>
          </div>
        )}

        {sucesso && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-5 rounded-2xl flex items-center gap-3 shadow-sm">
            <CheckCircle2 size={20} className="shrink-0 text-[#009640]" />
            <p className="text-sm font-bold">Passeio publicado com sucesso na vitrine!</p>
          </div>
        )}

        <form onSubmit={handleLancarPasseio} className="space-y-8">
          
          <section className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-10 shadow-sm space-y-6 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="bg-[#00577C] text-white p-2.5 rounded-xl"><Type size={20} /></div>
              <h2 className={`${jakarta.className} text-xl font-black text-slate-800`}>1. Dados Principais</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nome da Expedição *</label>
                <input required type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} placeholder="Ex: Trilha das Cachoeiras Perdidas" className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 text-base font-bold text-slate-800 outline-none focus:border-[#00577C] bg-slate-50/50 transition-colors" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Categoria Principal *</label>
                <select name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00577C] bg-slate-50/50 capitalize transition-colors">
                  {categoriasDb.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Ponto de Encontro</label>
                <input type="text" name="ponto_encontro" value={formData.ponto_encontro} onChange={handleInputChange} placeholder="Ex: CAT - Centro de Atendimento" className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00577C] bg-slate-50/50 transition-colors" />
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-10 shadow-sm space-y-6 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="bg-[#F9C400] text-amber-900 p-2.5 rounded-xl"><ImageIcon size={20} /></div>
              <h2 className={`${jakarta.className} text-xl font-black text-slate-800`}>2. Apresentação Visual</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Foto de Capa (Obrigatório) *</label>
                  <label className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-4 text-sm font-bold text-slate-500 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 hover:border-[#00577C] transition-all">
                    <Upload size={20} className="text-[#00577C]"/>
                    <span className="text-center truncate w-full px-4">{arquivoCapa ? arquivoCapa.name : 'Selecionar Capa'}</span>
                    <input required type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setArquivoCapa(e.target.files[0])} />
                  </label>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Galeria de Fotos (Opcional)</label>
                  <label className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-4 text-sm font-bold text-slate-500 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 hover:border-[#00577C] transition-all">
                    <Images size={20} className="text-[#F9C400]"/>
                    <span className="text-center truncate w-full px-4">
                      {arquivosGaleria.length > 0 ? `${arquivosGaleria.length} foto(s) selecionada(s)` : 'Selecionar várias fotos'}
                    </span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Resumo Curto (Para a Miniatura) *</label>
                <textarea required rows={2} name="descricao_curta" value={formData.descricao_curta} onChange={handleInputChange} placeholder="Descreva a experiência em 1 ou 2 frases chamativas..." className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 text-sm font-medium text-slate-700 outline-none focus:border-[#00577C] bg-slate-50/50 resize-none transition-colors" />
              </div>
              
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Roteiro Detalhado *</label>
                <textarea required rows={5} name="descricao_completa" value={formData.descricao_completa} onChange={handleInputChange} placeholder="Explique o passo a passo, o que está incluído, o que levar..." className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 text-sm font-medium text-slate-700 outline-none focus:border-[#00577C] bg-slate-50/50 transition-colors" />
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-slate-200 rounded-3xl p-6 gap-4 shadow-sm mt-8">
            <div className="flex items-center gap-3 text-slate-500">
               <Compass size={24} className="text-[#009640]"/>
               <p className="text-[10px] font-black uppercase tracking-widest max-w-[200px] leading-relaxed">
                 O seu passeio ficará visível publicamente de imediato.
               </p>
            </div>
            <button type="submit" disabled={enviando} className="w-full sm:w-auto bg-[#009640] hover:bg-green-700 disabled:opacity-50 disabled:bg-slate-400 text-white font-black text-xs uppercase tracking-widest px-10 py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-green-900/20 transition-all active:scale-95">
              {enviando ? <><Loader2 className="w-5 h-5 animate-spin"/> A Publicar...</> : <><Save size={18}/> Lançar na Vitrine</>}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}