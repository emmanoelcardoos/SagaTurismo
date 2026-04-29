"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google"
import { motion } from "framer-motion"
import { 
  Compass, Waves, Tent, Camera, Utensils, 
  Star, MapPin, Trees, Bird, History, 
  CheckCircle2, ArrowRight, Info, ShieldCheck,
  Bed, Coffee, Map, Phone, Mail
} from "lucide-react"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
})

export default function SaoGeraldoAraguaiaPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [showHeader, setShowHeader] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    const controlHeader = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setShowHeader(false)
        } else {
          setShowHeader(true)
        }
        setLastScrollY(window.scrollY)
      }
    }
    window.addEventListener('scroll', controlHeader)
    return () => window.removeEventListener('scroll', controlHeader)
  }, [lastScrollY])

  return (
    <main className={`${jakarta.className} min-h-screen bg-white text-slate-900 overflow-x-hidden pt-20`}>
      
      {/* HEADER INSTITUCIONAL */}
      <header className={`fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-4">
            <div className="relative h-16 w-44 sm:w-56">
              <img src="/logop.png" alt="Prefeitura de São Geraldo do Araguaia" className="object-contain object-left h-full w-full" />
            </div>
            <div className="hidden border-l border-slate-200 pl-4 sm:block">
              <p className={`${playfair.className} text-2xl font-bold leading-none text-[#00577C]`}>SagaTurismo</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secretaria de Turismo de São Geraldo do Araguaia</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#roteiro" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Roteiro</a>
            <a href="#hospedagem" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Onde Ficar</a>
            <a href="#gastronomia" className="text-sm font-semibold text-slate-600 hover:text-[#00577C]">Onde Comer</a>
            <Link href="/cadastro" className="rounded-full bg-[#F9C400] px-5 py-3 text-sm font-bold text-[#00577C] shadow-lg transition hover:bg-[#ffd633]">Cartão do Residente</Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION CINEMÁTICA */}
      <section className="relative h-[95vh] w-full flex items-center justify-center">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/17835411/pexels-photo-17835411.jpeg?_gl=1*i2axa5*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0NTE1JGo0OCRsMCRoMA.." alt="Rio Araguaia" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#005274]/60 via-transparent to-white" />
        </div>
        <div className={`relative z-10 text-center px-4 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-5xl md:text-9xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl">Serra das Andorinhas</h1>
          <p className="text-xl md:text-3xl text-white font-medium max-w-4xl mx-auto drop-shadow-lg leading-relaxed">
            Descubra o paraíso místico da APA Araguaia. Sítios arqueológicos, cavernas, águas cristalinas e a alma ribeirinha do Pará.
          </p>
        </div>
      </section>

      {/* MEGA GALERIA VISUAL */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 h-[500px] rounded-[3rem] overflow-hidden shadow-2xl">
            <img src="https://images.pexels.com/photos/34752677/pexels-photo-34752677.jpeg?_gl=1*ot3u01*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDgzNjY3JGo1OCRsMCRoMA.." className="w-full h-full object-cover" alt="Formações Rochosas Serra" />
          </div>
          <div className="h-[500px] rounded-[3rem] overflow-hidden shadow-2xl">
            <img src="https://images.pexels.com/photos/33153425/pexels-photo-33153425.jpeg?_gl=1*skt2jp*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDgzNzAyJGoyMyRsMCRoMA.." className="w-full h-full object-cover" alt="Rio Araguaia Praia" />
          </div>
          <div className="grid grid-rows-2 gap-4 h-[500px]">
            <div className="rounded-[2rem] overflow-hidden shadow-xl"><img src="https://images.pexels.com/photos/31795800/pexels-photo-31795800.jpeg?_gl=1*109rv15*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDgzNzUwJGo0MCRsMCRoMA.." className="w-full h-full object-cover" alt="Cachoeira" /></div>
            <div className="rounded-[2rem] overflow-hidden shadow-xl"><img src="https://images.pexels.com/photos/32729989/pexels-photo-32729989.jpeg?_gl=1*1uw2rth*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDgzNzgyJGo4JGwwJGgw" className="w-full h-full object-cover" alt="Pôr do Sol" /></div>
          </div>
        </div>
      </section>

      {/* ROTEIRO QUELÔNIOS COMPLETO */}
      <section id="roteiro" className="py-24 px-6 bg-slate-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black text-[#00577C] tracking-tighter uppercase">O Roteiro Quelônios</h2>
            <p className="text-xl text-slate-500 mt-6 max-w-3xl mx-auto font-medium">A imersão definitiva na história e biodiversidade da região.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100 relative">
              <span className="absolute top-10 right-10 text-6xl font-black text-slate-50 opacity-10">01</span>
              <History className="text-[#F9C400] w-12 h-12 mb-8" />
              <h4 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">História Ancestral</h4>
              <p className="text-slate-600 leading-relaxed">Exploração profunda de sítios arqueológicos, cavernas e grutas. Descubra as figuras rupestres milenares que decoram as fendas rochosas da Serra, testemunhas de civilizações passadas.</p>
            </div>

            <div className="bg-[#00577C] p-12 rounded-[3.5rem] shadow-2xl text-white relative">
              <span className="absolute top-10 right-10 text-6xl font-black text-white/5">02</span>
              <Waves className="text-[#F9C400] w-12 h-12 mb-8" />
              <h4 className="text-2xl font-black mb-6 uppercase tracking-tight">Veraneio de Julho</h4>
              <p className="text-blue-100 leading-relaxed">Quando o Rio Araguaia baixa, as praias de areia branca surgem. É o palco principal para banhos revigorantes, acampamentos sob as estrelas e a prática da pesca esportiva sustentável.</p>
            </div>

            <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100 relative">
              <span className="absolute top-10 right-10 text-6xl font-black text-slate-50 opacity-10">03</span>
              <Trees className="text-emerald-500 w-12 h-12 mb-8" />
              <h4 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Ecossistema APA</h4>
              <p className="text-slate-600 leading-relaxed">Uma jornada pelos biomas Amazônia e Cerrado. Conheça o viveiro de mudas nativas (Cacau, Açaí, Caju) e os apiários de abelhas meliponas sem ferrão.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DE HOSPEDAGEM (HOTÉIS E CAMPINGS) */}
      <section id="hospedagem" className="py-24 px-6 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-4 mb-16">
            <div className="h-px bg-slate-200 flex-1"></div>
            <h2 className="text-4xl md:text-5xl font-black text-[#00577C] uppercase tracking-tight px-4">Estadias Exclusivas</h2>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group rounded-[3rem] overflow-hidden bg-slate-50 border border-slate-100 hover:shadow-2xl transition-all">
              <div className="h-72 overflow-hidden"><img src="https://images.pexels.com/photos/12434692/pexels-photo-12434692.jpeg?_gl=1*cihqj3*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0MTgyJGozMyRsMCRoMA.." className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Remanso" /></div>
              <div className="p-10">
                <h4 className="text-2xl font-black text-slate-900 mb-4">Remanso dos Botos</h4>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">Estrutura completa com quartos para pernoite, área de camping e banheiros. O local ideal para quem busca proximidade com a Praia do Remanso.</p>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                  <Bed className="text-[#00577C] w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#00577C]">Quartos & Camping</span>
                </div>
              </div>
            </div>

            <div className="group rounded-[3rem] overflow-hidden bg-slate-50 border border-slate-100 hover:shadow-2xl transition-all">
              <div className="h-72 overflow-hidden"><img src="https://images.pexels.com/photos/10601360/pexels-photo-10601360.jpeg?_gl=1*nnooiy*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0MjQ4JGoyOCRsMCRoMA.." className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Sapucaia" /></div>
              <div className="p-10">
                <h4 className="text-2xl font-black text-slate-900 mb-4">Camping da Sapucaia</h4>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">Apenas a 200m da Casa do Artesão. Localização privilegiada às margens do Araguaia para uma experiência de total contato com a natureza.</p>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                  <Tent className="text-[#00577C] w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#00577C]">Pé na Areia</span>
                </div>
              </div>
            </div>

            <div className="group rounded-[3rem] overflow-hidden bg-slate-50 border border-slate-100 hover:shadow-2xl transition-all">
              <div className="h-72 overflow-hidden"><img src="https://images.pexels.com/photos/19076031/pexels-photo-19076031.jpeg?_gl=1*lucbiz*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0MzIyJGo0NiRsMCRoMA.." className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Bela Vista" /></div>
              <div className="p-10">
                <h4 className="text-2xl font-black text-slate-900 mb-4">Sítio Bela Vista</h4>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">Propriedade da Sra. Vilma. Oferece camping sustentável, trilhas de birdwatching e vivência nos apiários locais.</p>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                  <Bird className="text-[#00577C] w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#00577C]">Eco-Living</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DE GASTRONOMIA (RESTAURANTES) */}
      <section id="gastronomia" className="py-24 px-6 bg-[#00577C] text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div>
                <span className="text-[#F9C400] font-bold uppercase tracking-widest text-sm mb-4 block">Sabores do Rio</span>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">Gastronomia <br/> Regional.</h2>
                <p className="text-xl text-blue-100 mt-6 leading-relaxed font-medium">Da pesca artesanal direto para a brasa. Ingredientes frescos com a herança culinária das comunidades ribeirinhas.</p>
              </div>

              <div className="grid gap-6">
                <div className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20 backdrop-blur-md">
                   <div className="flex justify-between items-start mb-4">
                     <h4 className="text-2xl font-black text-[#F9C400]">Restaurante Deus é Fiel</h4>
                     <Utensils className="w-6 h-6 text-white" />
                   </div>
                   <p className="text-sm text-blue-50 font-medium">Localizado na Vila Ilha de Campo. Serve café da manhã, almoço e jantar com pratos típicos como peixes do Araguaia e tempero caseiro.</p>
                </div>

                <div className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20 backdrop-blur-md">
                   <div className="flex justify-between items-start mb-4">
                     <h4 className="text-2xl font-black text-[#F9C400]">Restaurante Remanso</h4>
                     <Coffee className="w-6 h-6 text-white" />
                   </div>
                   <p className="text-sm text-blue-50 font-medium">Funciona aos finais de semana no Sítio Remanso dos Botos. Perfeito para uma refeição com vista privilegiada da praia.</p>
                </div>
              </div>
            </div>

            <div className="relative h-[700px] rounded-[4rem] overflow-hidden shadow-2xl">
               <img src="https://images.pexels.com/photos/28992199/pexels-photo-28992199.jpeg?_gl=1*1y9cw8p*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0MzcyJGo1OSRsMCRoMA.." className="w-full h-full object-cover" alt="Culinária Peixe" />
               <div className="absolute bottom-10 left-10 right-10 bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20">
                  <p className="text-white text-lg font-bold">O Segredo: Tucunaré na brasa preparado com ingredientes colhidos nas propriedades locais.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIVÊNCIAS RURAIS: DONA LEONILHA E VIVEIRO */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
           <div className="relative">
              <img src="https://images.pexels.com/photos/36645883/pexels-photo-36645883.jpeg?_gl=1*1iys60e*_ga*MTY5OTc2MjU5NS4xNzc0NzM1NjE2*_ga_8JE65Q40S6*czE3Nzc0ODA1MTIkbzI3JGcxJHQxNzc3NDg0NDQ4JGo0NSRsMCRoMA.." className="rounded-[4rem] h-[600px] w-full object-cover shadow-2xl" alt="Artesanato de Barro" />
              <div className="absolute -bottom-10 -right-10 bg-white p-10 rounded-[3rem] shadow-2xl max-w-xs border border-slate-100">
                 <h5 className="font-black text-slate-900 text-xl mb-2">Dona Leonilha</h5>
                 <p className="text-sm text-slate-500 font-medium">Aos 79 anos, mantém viva a arte dos souvenirs de barro replicando escrituras rupestres.</p>
              </div>
           </div>
           
           <div className="space-y-8">
              <span className="text-[#00577C] font-black uppercase tracking-widest text-xs">Patrimônio & Futuro</span>
              <h3 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">Mãos que Criam, <br/> Mudas que Crescem.</h3>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">Visite o Sítio Bom Sossego para conhecer a confecção de artesanato e o viveiro de mudas de cacau, açaí e caju — um projeto em parceria com IDEFLORBIO e CALMAP.</p>
              
              <div className="flex flex-wrap gap-4">
                 <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-full shadow-sm border border-slate-100">
                    <Star className="text-[#F9C400]" />
                    <span className="text-sm font-bold text-slate-700">Souvenirs Autênticos</span>
                 </div>
                 <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-full shadow-sm border border-slate-100">
                    <Trees className="text-emerald-500" />
                    <span className="text-sm font-bold text-slate-700">Plantio de Frutíferas</span>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* FOOTER INSTITUCIONAL COMPLETO */}
      <footer className="py-20 px-8 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
               <img src="/logop.png" alt="Prefeitura SGA" className="h-20 object-contain" />
               <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">São Geraldo do Araguaia <br/> "Cidade Amada, seguindo em frente"</p>
               <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[#00577C] border border-slate-100"><Phone size={18}/></div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[#00577C] border border-slate-100"><Mail size={18}/></div>
               </div>
            </div>
            
            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Gestão Executiva</h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Prefeito: <br/><b>Jefferson Douglas de Jesus Oliveira</b></li>
                <li>Vice-Prefeito: <br/><b>Marcos Antônio Candido de Lucena</b></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Turismo (SEMTUR)</h5>
              <ul className="text-sm text-slate-500 space-y-3 font-medium">
                <li>Secretária: <br/><b>Micheli Stephany de Souza</b></li>
                <li>Contato: <b>(94) 98145-2067</b></li>
                <li>Email: <b>setursaga@gmail.com</b></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-4">Equipe Técnica</h5>
              <ul className="text-sm text-slate-500 space-y-2 font-medium">
                <li>• Adriana da Luz Lima</li>
                <li>• Carmelita Luz da Silva</li>
                <li>• Diego Silva Costa</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center pt-10 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 FlightAndFun • São Geraldo do Araguaia (PA)</p>
          </div>
        </div>
      </footer>

    </main>
  )
}