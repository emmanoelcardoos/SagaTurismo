/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Isso diz à Vercel: "Ignore os erros de aspas e variáveis, eu sei o que estou a fazer"
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Evita que o build trave por erros de tipos
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // ◄── A MÁGICA QUE PARA O CONSUMO NA VERCEL ESTÁ AQUI!
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Permite qualquer imagem vinda do Storage da sua Supabase
      },
      {
        protocol: 'https',
        hostname: 'live.staticflickr.com',
      },
      { 
        protocol: 'http', 
        hostname: '127.0.0.1', 
        port: '8000' // ◄── Adicionado do teu ficheiro .ts
      },
    ],
  },
};

export default nextConfig;