import type { Metadata } from "next";
import localFont from "next/font/local";
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
        {children}
      </body>
    </html>
  );
}