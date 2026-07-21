"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "./AnnouncementBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFloat } from "./WhatsAppFloat";
import { PageTransition } from "./PageTransition";

// /admin, /mi-cuenta y /vet son paneles con su propio shell (sidebar/login a
// pantalla completa) — no la tienda pública, así que no llevan
// AnnouncementBar/Header/Footer/WhatsApp del sitio emocional. Se decide acá
// (en vez de moviendo todo a un route group con root layout propio) para no
// reestructurar el árbol de rutas ya existente.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const esPanel =
    pathname?.startsWith("/admin") || pathname?.startsWith("/mi-cuenta") || pathname?.startsWith("/vet");

  if (esPanel) return <>{children}</>;

  return (
    <>
      {/* Visible solo al recibir foco de teclado (Tab) — deja saltar el menú
          completo (Ofertas/Productos/Nosotros/Blog/Contáctanos/...) que se
          repite en cada página. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-secondary focus:px-4 focus:py-2 focus:font-body focus:text-sm focus:font-bold focus:text-white focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Saltar al contenido
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main-content" className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
