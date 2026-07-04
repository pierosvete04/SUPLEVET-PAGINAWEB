import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { CartProvider } from "@/lib/cart/CartContext";

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

export const metadata: Metadata = {
  title: "Suplevet — Nutrición funcional para perros y gatos",
  description:
    "Suplemento hiperproteico de uso veterinario. Ayuda a fortalecer el sistema inmunológico, la digestión y la vitalidad de tu mascota.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${fontDisplay.variable} ${fontImpact.variable} ${fontBody.variable} flex min-h-screen flex-col antialiased`}
      >
        <CartProvider>
          <SiteChrome>{children}</SiteChrome>
        </CartProvider>
      </body>
    </html>
  );
}
