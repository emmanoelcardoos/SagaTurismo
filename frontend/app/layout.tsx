import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
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
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        {/* ◄── COOKIEYES (LGPD) ──► */}
        <Script 
          id="cookieyes" 
          type="text/javascript" 
          src="https://cdn-cookieyes.com/client_data/ed210793799b866fb3b7f66db441506c/script.js" 
          strategy="beforeInteractive" 
        />

        {children}
      </body>
    </html>
  );
}