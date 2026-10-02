import Image from 'next/image';

export default function SiteFooter() {
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