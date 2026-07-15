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
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
