import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { Bebas_Neue, DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { CartProvider } from "@/lib/cart/CartContext";
import { createStaticClient } from "@/lib/supabase/static";
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

// Radio de bordes de tarjetas/recuadros, editable desde /admin/configuracion
// (columna configuracion_sitio.radio_tarjetas) — expuesto como variable CSS
// para que todos los componentes usen `rounded-[var(--radius-card)]` en vez
// de clases rounded-md/rounded-lg sueltas e inconsistentes entre sí.
//
// IMPORTANTE: usa el cliente SIN cookies (createStaticClient) y unstable_cache.
// El cliente con cookies (lib/supabase/server) llama a next/headers.cookies(),
// lo que fuerza renderizado dinámico (sin caché) en TODO el árbol que envuelve
// este layout raíz — es decir, en cada navegación del sitio entero, agregando
// una consulta a Supabase antes de poder pintar cualquier página. Con el
// cliente estático + cache de 60s, esto no bloquea la navegación.
const getRadioTarjetas = unstable_cache(
  async (): Promise<number> => {
    try {
      const supabase = createStaticClient();
      const { data } = await supabase
        .from("configuracion_sitio")
        .select("radio_tarjetas")
        .eq("id", 1)
        .single();
      return data?.radio_tarjetas ?? 16;
    } catch {
      return 16;
    }
  },
  ["radio-tarjetas"],
  { revalidate: 60 }
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const radioTarjetas = await getRadioTarjetas();

  return (
    <html lang="es" style={{ "--radius-card": `${radioTarjetas}px` } as React.CSSProperties}>
      <body
        className={`${fontDisplay.variable} ${fontImpact.variable} ${fontBody.variable} flex min-h-screen flex-col antialiased`}
      >
        <AnalyticsScripts />

        <CartProvider>
          <SiteChrome>{children}</SiteChrome>
        </CartProvider>
      </body>
    </html>
  );
}
