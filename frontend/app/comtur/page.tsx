"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { MapPin, Phone, Mail, Clock, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

interface Reuniao {
  id: string;
  mes_ano: string;
  ordem_reuniao: string;
  data_reuniao: string;
}

export default function ComturPage() {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [loadingReunioes, setLoadingReunioes] = useState(true);

  // Carregar Reuniões do Supabase
  useEffect(() => {
    async function fetchReunioes() {
      try {
        const { data, error } = await supabase
          .from('reunioes_comtur')
          .select('*')
          .order('data_reuniao', { ascending: true });

        if (data) setReunioes(data);
      } catch (err) {
        console.error("Erro ao carregar reuniões:", err);
      } finally {
        setLoadingReunioes(false);
      }
    }
    fetchReunioes();
  }, []);

  // URL da imagem de fundo
  const HERO_IMAGE = "https://images.pexels.com/photos/36020698/pexels-photo-36020698.jpeg?_gl=1*43rddg*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3ODczMjQ2MTUkbzEwNiRnMSR0MTc4NzMyNDY5NyRqNDMkbDAkaDA.";

  return (
    <main className={`${inter.className} bg-[#FDFCF7] min-h-screen text-slate-900 overflow-x-hidden`}>

      {/* ── HERO SECTION PADRÃO ── */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src={HERO_IMAGE} 
            alt="COMTUR São Geraldo do Araguaia" 
            fill 
            className="object-cover" 
            priority 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            COMTUR
          </h1>
          <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
            Conselho Municipal de Turismo de São Geraldo do Araguaia
          </p>
        </div>

        {/* ── ONDA DE TRANSIÇÃO ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[20px] md:h-[45px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,115.54,191.13,97.8,235.34,84.7,279.16,71.21,321.39,56.44Z" fill="#FDFCF7"></path>
          </svg>
        </div>
      </section>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <section className="max-w-[1000px] mx-auto px-6 py-16 md:py-24">
        
        {/* Introdução */}
        <div className="prose prose-slate max-w-none mb-16">
          <p className="text-slate-600 text-lg leading-relaxed text-justify">
            O Conselho Municipal de Turismo de São Geraldo do Araguaia – COMTUR tem por objetivo implementar a Política Municipal de Turismo, junto à Secretaria Municipal de Turismo, como órgão consultivo e de assessoramento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          
          {/* Informações de Contacto */}
          <div className="space-y-8">
            <h2 className={`${jakarta.className} text-2xl font-black text-[#00577C] border-b border-slate-200 pb-4`}>
              Informações de Contato
            </h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <MapPin className="text-[#F9C400] shrink-0 mt-1" size={24} />
                <div>
                  <p className="font-bold text-slate-800">Endereço:</p>
                  <p className="text-slate-600 mt-1">Av. Antônio Pedrosa</p>
                  <p className="text-slate-600">Vila Administrativa, Alto BEC - São Geraldo do Araguaia-PA</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Phone className="text-[#F9C400] shrink-0 mt-1" size={24} />
                <div>
                  <p className="font-bold text-slate-800">Telefone:</p>
                  <p className="text-slate-600 mt-1">(94) 98420-5736</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Mail className="text-[#F9C400] shrink-0 mt-1" size={24} />
                <div>
                  <p className="font-bold text-slate-800">Email:</p>
                  <a 
                    href="mailto:turismo@saogeraldodoaraguaia.pa.gov.br" 
                    className="text-[#00577C] font-medium mt-1 hover:underline inline-block"
                  >
                    turismo@saogeraldodoaraguaia.pa.gov.br
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <Clock className="text-[#F9C400] shrink-0 mt-1" size={24} />
                <div>
                  <p className="font-bold text-slate-800">Horário de funcionamento:</p>
                  <p className="text-slate-600 mt-1">Segunda a Sexta, das 8h às 14h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Calendário de Reuniões (Dinâmico do Supabase) */}
          <div>
            <h2 className={`${jakarta.className} text-2xl font-black text-[#00577C] border-b border-slate-200 pb-4 mb-8 flex items-center gap-3`}>
              <Calendar className="text-[#F9C400]" size={28} />
              Calendário de Reuniões
            </h2>

            {loadingReunioes ? (
              <div className="text-slate-400 text-sm animate-pulse">A carregar calendário...</div>
            ) : reunioes.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
                O calendário de reuniões será disponibilizado em breve.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {reunioes.map((reuniao) => (
                  <div key={reuniao.id} className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-800">{reuniao.mes_ano}</span>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-6 font-medium text-[#00577C]">{reuniao.ordem_reuniao}</span>
                      <span>{reuniao.data_reuniao}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        </div>
      </section>
    </main>
  );
}