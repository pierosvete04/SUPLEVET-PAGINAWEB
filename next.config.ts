import type { NextConfig } from "next";

// No se incluye Content-Security-Policy acá a propósito: escribir una CSP
// correcta requiere enumerar con precisión cada origen que carga el sitio
// (GTM, GA, Supabase Storage, WhatsApp, fuentes) y un error rompe silenciosamente
// analytics o imágenes en producción. Los headers de abajo son de bajo riesgo
// (no dependen de ninguna lista de orígenes) y suben el puntaje de Lighthouse
// "Best Practices" sin ese riesgo — la CSP queda como tarea aparte, más lenta
// y con su propio testing.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // isomorphic-dompurify (lib/sanitize-html.ts, usado solo en app/blog/[slug])
  // depende de jsdom, que el tracer de Vercel no empaqueta bien para funciones
  // serverless (funciona en build/dev local porque ahí sí existe node_modules
  // completo) — esto le dice a Next que lo resuelva vía require() en runtime
  // en vez de intentar bundlearlo, que es la causa del 500 solo en esa ruta.
  serverExternalPackages: ["isomorphic-dompurify"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bcahhdszzwearqaafhpa.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
