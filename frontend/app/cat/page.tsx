"use client";

import React from 'react';
import Image from 'next/image';
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { MapPin, Phone, Mail, Clock, Info } from 'lucide-react';

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function CatPage() {
  // URL de imagem de exemplo para o CAT
  const HERO_IMAGE = "https://uaancbywueikvvhhzjop.supabase.co/storage/v1/object/public/herosections/herocat.HEIC";

  return (
    <main className={`${inter.className} bg-[#FDFCF7] min-h-screen text-slate-900 overflow-x-hidden`}>

      {/* ── HERO SECTION PADRÃO ── */}
      <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src={HERO_IMAGE} 
            alt="CAT São Geraldo do Araguaia" 
            fill 
            className="object-cover" 
            priority 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-16 max-w-5xl mx-auto">
          <h1 className={`${jakarta.className} text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl leading-none`}>
            CAT
          </h1>
          <p className="text-white/95 text-lg md:text-2xl font-medium mt-6 drop-shadow-lg max-w-3xl">
            Centro de Atendimento ao Turista
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
      <section className="max-w-[800px] mx-auto px-6 py-16 md:py-24">
        
        {/* Título e Introdução */}
        <div className="mb-12">
          <h2 className={`${jakarta.className} text-3xl font-black text-slate-800 mb-6 flex items-center gap-3`}>
            <Info className="text-[#F9C400]" size={32} />
            Bem-vindo ao CAT
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed text-justify">
            Localizado em um ponto estratégico da cidade, o Centro de Atendimento ao Turista (CAT) oferece todas as informações necessárias sobre hospedagens, roteiros, atrativos e serviços turísticos em São Geraldo do Araguaia. A nossa equipe está pronta para garantir que a sua experiência na nossa região seja inesquecível.
          </p>
        </div>

        {/* Cartão de Contactos */}
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-slate-100">
          <div className="space-y-8">
            
            {/* Endereço */}
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-2xl shrink-0">
                <MapPin className="text-[#00577C]" size={24} />
              </div>
              <div>
                <h3 className={`${jakarta.className} font-black text-lg text-slate-800`}>Localização</h3>
                <p className="text-slate-600 mt-2">Rua: </p>
                <p className="text-slate-600">Bairro: </p>
                <p className="text-slate-600">Referência: </p>
              </div>
            </div>

            {/* Horário */}
            <div className="flex items-start gap-4">
              <div className="bg-amber-50 p-3 rounded-2xl shrink-0">
                <Clock className="text-[#F9C400]" size={24} />
              </div>
              <div>
                <h3 className={`${jakarta.className} font-black text-lg text-slate-800`}>Horário de Atendimento</h3>
                <p className="text-slate-600 mt-2"></p>
              </div>
            </div>

            {/* Telefones */}
            <div className="flex items-start gap-4">
              <div className="bg-green-50 p-3 rounded-2xl shrink-0">
                <Phone className="text-emerald-600" size={24} />
              </div>
              <div>
                <h3 className={`${jakarta.className} font-black text-lg text-slate-800`}>Telefones</h3>
                <p className="text-slate-600 mt-2"></p>
                <p className="text-slate-600"></p>
              </div>
            </div>

            {/* E-mails */}
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-2xl shrink-0">
                <Mail className="text-[#00577C]" size={24} />
              </div>
              <div>
                <h3 className={`${jakarta.className} font-black text-lg text-slate-800`}>E-mails</h3>
                <p className="text-[#00577C] hover:underline cursor-pointer mt-2"></p>
                <p className="text-[#00577C] hover:underline cursor-pointer"></p>
              </div>
            </div>

          </div>
        </div>

      </section>
    </main>
  );
}