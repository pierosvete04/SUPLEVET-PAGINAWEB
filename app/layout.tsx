import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { LimpiarParametrosTracking } from "@/components/analytics/LimpiarParametrosTracking";
import { ConsoleBanner } from "@/components/branding/ConsoleBanner";
import { ConfiguracionProvider } from "@/components/layout/ConfiguracionProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { CartProvider } from "@/lib/cart/CartContext";
import { mapConfiguracionCliente } from "@/lib/configuracion-cliente";
import { getConfiguracionPublica } from "@/lib/data/publico";
import { siteConfig } from "@/lib/site-config";

// Manier Bold es la fuente de marca real (PLAN.md sección 2), pero no está
// disponible en Google Fonts y todavía no se recibieron los archivos licenciados.
// Fraunces se usa como reemplazo temporal (mismo espíritu serif editorial) —
// pendiente operativo: reemplazar por Manier Bold real vía next/font/local.
const fontDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

const fontImpact = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-impact",
});

const fontBody = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
});

const OG_IMAGE_FALLBACK =
  "https://bcahhdszzwearqaafhpa.supabase.co/storage/v1/object/public/productos-web-fotos/suplevet-150g/lifestyle-perro.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: "SUPLEVET — Nutrición para tus mascotas",
    template: "%s — Suplevet",
  },
  description:
    "Suplemento hiperproteico de uso veterinario. Ayuda a fortalecer el sistema inmunológico, la digestión y la vitalidad de tu mascota.",
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "Suplevet",
    title: "SUPLEVET — Nutrición para tus mascotas",
    description:
      "Suplemento hiperproteico de uso veterinario. Ayuda a fortalecer el sistema inmunológico, la digestión y la vitalidad de tu mascota.",
    images: [{ url: OG_IMAGE_FALLBACK, width: 1200, height: 1200 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SUPLEVET — Nutrición para tus mascotas",
    description:
      "Suplemento hiperproteico de uso veterinario. Ayuda a fortalecer el sistema inmunológico, la digestión y la vitalidad de tu mascota.",
    images: [OG_IMAGE_FALLBACK],
  },
};

// Una sola lectura de configuracion_sitio para todo el árbol. De acá salen dos
// cosas que antes costaban consultas separadas:
//
//   - `radio_tarjetas`, el radio de bordes editable desde /admin/configuracion,
//     expuesto como variable CSS para que los componentes usen
//     `rounded-[var(--radius-card)]` en vez de clases sueltas e inconsistentes.
//   - La config que consumen los componentes cliente (WhatsApp, redes, datos
//     legales), que antes cada uno pedía por su cuenta desde el navegador — la
//     misma fila hasta cuatro veces por página. Ver ConfiguracionProvider.
//
// IMPORTANTE: getConfiguracionPublica usa el cliente SIN cookies y caché (ver
// lib/data/publico.ts). El cliente con cookies (lib/supabase/server) llama a
// next/headers.cookies(), lo que forzaría renderizado dinámico en TODO el árbol
// que envuelve este layout raíz — o sea, mataría el prerender del sitio entero.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getConfiguracionPublica();
  const radioTarjetas = config?.radio_tarjetas ?? 16;

  return (
    <html lang="es" style={{ "--radius-card": `${radioTarjetas}px` } as React.CSSProperties}>
      <body
        className={`${fontDisplay.variable} ${fontImpact.variable} ${fontBody.variable} flex min-h-screen flex-col antialiased`}
      >
        {/* Red de seguridad para .scroll-reveal (globals.css): sin JS el
            observador nunca marca las secciones como visibles y quedarían en
            opacity:0 para siempre. */}
        <noscript>
          <style>{`.scroll-reveal { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>

        <SplashScreen />
        <AnalyticsScripts />
        <LimpiarParametrosTracking />
        <ConsoleBanner />

        <ConfiguracionProvider configuracion={mapConfiguracionCliente(config)}>
          <CartProvider>
            <SiteChrome>{children}</SiteChrome>
          </CartProvider>
        </ConfiguracionProvider>
      </body>
    </html>
  );
}
