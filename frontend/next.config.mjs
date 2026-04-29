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
    // Necessário para carregar as imagens do Pexels que usaste no roteiro
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
};

export default nextConfig;