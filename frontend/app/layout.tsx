import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script"; // ◄── 1. NOVA IMPORTAÇÃO AQUI
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// ◄── AQUI ESTÁ A CORREÇÃO DO TÍTULO E DESCRIÇÃO
export const metadata: Metadata = {
  title: " Visite São Geraldo do Araguaia",
  description: "Plataforma oficial de turismo e emissão da Carteira de Residente de São Geraldo do Araguaia - PA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ◄── IDIOMA CORRIGIDO PARA pt-BR
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ◄── 2. MICROSOFT CLARITY AQUI ──► */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "y5l0pw40z9");
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}