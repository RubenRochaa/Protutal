import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Teste no celular: libera o "npm run dev" para ser aberto por outro aparelho da rede local
  // (ex.: http://192.168.0.15:3000). Sem isso o Next bloqueia os arquivos de desenvolvimento.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  experimental: {
    serverActions: {
      // Padrão do Next é 1 MB. Os uploads aceitam até 10 MB + os outros campos do formulário
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
