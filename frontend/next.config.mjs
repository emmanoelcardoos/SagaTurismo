/** @type {import('next').NextConfig} */
const nextConfig = {
  // Esta configuração ignora erros de Linting (como variáveis não usadas e aspas)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Esta configuração ignora erros de TypeScript se existirem
  typescript: {
    ignoreBuildErrors: true,
  },
  // Opcional: Se usares imagens externas, podes precisar de configurar os domínios
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
};

export default nextConfig;