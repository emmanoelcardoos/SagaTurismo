'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, ArrowLeft, MapPin, Calendar, Clock, 
  CheckCircle2, Bed, Compass, Ticket, Star, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ── TIPAGENS COMPLETAS ──
type Hotel = { id: string; nome: string; preco_medio: number; tipo: string; imagem_url: string; descricao: string; };
type Guia = { id: string; nome: string; preco_diaria: number; especialidade: string; imagem_url: string; descricao: string; };
type Atracao = { id: string; nome: string; preco_entrada: number; tipo: string; imagem_url: string; descricao: string; };

type Pacote = {
  id: string;
  titulo: string;
  descricao_curta: string;
  roteiro_detalhado: string;
  imagens_galeria: string[];
  imagem_principal: string;
  dias: number;
  noites: number;
  horarios_info: string;
  pacote_itens: {
    hoteis: Hotel | null;
    guias: Guia | null;
    atracoes: Atracao | null;
  }[];
};

export default function DetalhePacotePage() {
  const { id } = useParams();
  const router = useRouter();
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPacoteCompleto() {
      const { data, error } = await supabase
        .from('pacotes')
        .select(`
          *,
          pacote_itens (
            hoteis (*),
            guias (*),
            atracoes (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error("Erro:", error);
        router.push('/pacotes');
      } else {
        setPacote(data as any);
      }
      setLoading(false);
    }
    if (id) fetchPacoteCompleto();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-[#00577C] w-12 h-12" />
    </div>
  );

  if (!pacote) return null;

  // Cálculo do total
  const valorTotal = pacote.pacote_itens.reduce((acc, item) => {
    return acc + (item.hoteis?.preco_medio || 0) + (item.guias?.preco_diaria || 0) + (item.atracoes?.preco_entrada || 0);
  }, 0);

  return (
    <main className={`${inter.className} bg-white min-h-screen pb-32`}>
      {/* HEADER / BACK BUTTON */}
      <div className="fixed top-0 left-0 right-0 z-50 p-5 flex justify-between items-center pointer-events-none">
        <button 
          onClick={() => router.back()}
          className="bg-white/90 backdrop-blur shadow-lg p-3 rounded-full pointer-events-auto hover:scale-110 transition"
        >
          <ArrowLeft size={24} className="text-[#00577C]" />
        </button>
      </div>

      {/* HERO / GALERIA */}
      <section className="relative h-[60vh] w-full bg-slate-900">
        <Image 
          src={pacote.imagem_principal} 
          alt={pacote.titulo} 
          fill 
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 px-5">
          <div className="max-w-7xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#F9C400] text-[#00577C] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-xl">
              <Calendar size={14} /> {pacote.dias} dias e {pacote.noites} noites
            </div>
            <h1 className={`${jakarta.className} text-4xl md:text-6xl font-black text-slate-900 leading-tight`}>
              {pacote.titulo}
            </h1>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 grid lg:grid-cols-[1fr_400px] gap-12 mt-12">
        
        {/* COLUNA ESQUERDA: CONTEÚDO */}
        <div className="space-y-12">
          
          {/* SOBRE E HORÁRIOS */}
          <div>
            <h2 className={`${jakarta.className} text-2xl font-bold text-[#00577C] mb-6`}>Sobre esta experiência</h2>
            <p className="text-slate-600 leading-relaxed text-lg mb-8">
              {pacote.descricao_curta}
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#F9C400]">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Horários e Saída</p>
                  <p className="font-bold text-slate-700">{pacote.horarios_info || "A combinar"}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#009640]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Segurança</p>
                  <p className="font-bold text-slate-700">Seguro Viagem Incluso</p>
                </div>
              </div>
            </div>
          </div>

          {/* ROTEIRO DETALHADO */}
          <div className="bg-[#00577C]/5 rounded-[2.5rem] p-8 md:p-10 border border-[#00577C]/10">
            <h2 className={`${jakarta.className} text-2xl font-bold text-[#00577C] mb-8`}>Roteiro do Pacote</h2>
            <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-line leading-relaxed">
              {pacote.roteiro_detalhado || "Roteiro detalhado em breve..."}
            </div>
          </div>

          {/* O QUE ESTÁ INCLUSO (ITEMS DO SUPABASE) */}
          <div>
            <h2 className={`${jakarta.className} text-2xl font-bold text-slate-900 mb-8`}>Serviços Integrados</h2>
            <div className="grid gap-6">
              {pacote.pacote_itens.map((item, idx) => (
                <div key={idx} className="group">
                  {/* CARD DO GUIA */}
                  {item.guias && (
                    <div className="flex flex-col md:flex-row gap-6 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all">
                      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shrink-0">
                        <Image src={item.guias.imagem_url || '/placeholder.png'} alt={item.guias.nome} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-[#009640] uppercase tracking-widest bg-green-50 px-2 py-1 rounded">Guia Local Especialista</span>
                          <span className="font-black text-slate-900">R$ {item.guias.preco_diaria}/dia</span>
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 mb-2">{item.guias.nome}</h4>
                        <p className="text-sm text-slate-500 line-clamp-2">{item.guias.descricao}</p>
                        <div className="mt-4 flex gap-2">
                          <span className="text-xs bg-slate-100 px-3 py-1.5 rounded-full font-bold text-slate-600 italic">#{item.guias.especialidade}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CARD DO HOTEL */}
                  {item.hoteis && (
                    <div className="flex flex-col md:flex-row gap-6 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all mt-6">
                      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shrink-0">
                        <Image src={item.hoteis.imagem_url || '/placeholder.png'} alt={item.hoteis.nome} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-[#00577C] uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">Hospedagem Confirmada</span>
                          <span className="font-black text-slate-900">R$ {item.hoteis.preco_medio}/estadia</span>
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 mb-2">{item.hoteis.nome}</h4>
                        <p className="text-sm text-slate-500 line-clamp-2">{item.hoteis.descricao}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: RESUMO DE PREÇOS FIXO */}
        <aside>
          <div className="lg:sticky lg:top-24 bg-white rounded-[2rem] border-2 border-slate-100 p-8 shadow-2xl">
            <h3 className={`${jakarta.className} text-xl font-bold text-slate-900 mb-6`}>Resumo da Reserva</h3>
            
            <div className="space-y-4 mb-8">
              {pacote.pacote_itens.map((item, idx) => (
                <div key={idx} className="text-sm border-b border-slate-50 pb-3">
                  {item.hoteis && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hospedagem ({item.hoteis.nome})</span>
                      <span className="font-bold">R$ {item.hoteis.preco_medio}</span>
                    </div>
                  )}
                  {item.guias && (
                    <div className="flex justify-between mt-2">
                      <span className="text-slate-500">Guia ({item.guias.nome})</span>
                      <span className="font-bold">R$ {item.guias.preco_diaria}</span>
                    </div>
                  )}
                  {item.atracoes && (
                    <div className="flex justify-between mt-2">
                      <span className="text-slate-500">{item.atracoes.nome}</span>
                      <span className="font-bold">R$ {item.atracoes.preco_entrada}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-8">
              <span className="text-slate-400 font-bold uppercase text-xs">Valor Total</span>
              <span className={`${jakarta.className} text-3xl font-black text-[#009640]`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
              </span>
            </div>

            <button 
              onClick={() => {/* Aqui abres o teu modal de checkout que já criámos */}}
              className="w-full bg-[#00577C] hover:bg-[#004a6b] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              Comprar Pacote Agora <ChevronRight size={20} />
            </button>
            
            <p className="text-center text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-widest">
              Pagamento Processado via PagBank
            </p>
          </div>
        </aside>

      </div>
    </main>
  );
}