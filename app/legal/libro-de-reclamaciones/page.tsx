import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { LibroReclamacionesClient } from "./LibroReclamacionesClient";

// Server Component solo para poder exportar metadata — el contenido en sí
// (formulario con estado, Supabase client-side) vive en
// LibroReclamacionesClient.tsx porque un archivo "use client" no puede
// exportar `metadata` en Next.js.
export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description:
    "Registra un reclamo o queja conforme al Código de Protección y Defensa del Consumidor (Ley N.° 29571).",
  alternates: { canonical: `${siteConfig.siteUrl}/legal/libro-de-reclamaciones` },
};

export default function LibroReclamacionesPage() {
  return <LibroReclamacionesClient />;
}
