"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "./AnnouncementBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFloat } from "./WhatsAppFloat";

// El panel /admin es una herramienta interna (dashboard), no la tienda
// pública — no lleva AnnouncementBar/Header/Footer/WhatsApp del sitio
// emocional. Se decide acá (en vez de moviendo todo a un route group con
// root layout propio) para no reestructurar el árbol de rutas ya existente.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const esAdmin = pathname?.startsWith("/admin");

  if (esAdmin) return <>{children}</>;

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
