import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bcahhdszzwearqaafhpa.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // El proxy de reoptimización de Next (/_next/image) hace timeout al pedir
    // archivos de Supabase Storage en este entorno (curl directo carga en <1s,
    // así que no es un problema del archivo ni de Supabase). Las fotos ya se
    // suben redimensionadas (PLAN.md sección 8.6-8.7), así que servirlas
    // directo desde el CDN de Supabase sin reprocesar es seguro y evita el bug.
    unoptimized: true,
  },
};

export default nextConfig;
