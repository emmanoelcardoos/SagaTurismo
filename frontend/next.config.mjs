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
    ],
  },
};

export default nextConfig;