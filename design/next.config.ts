import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Padrão do Next é 1 MB. Os uploads aceitam até 10 MB + os outros campos do formulário
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
