import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { BorradorNotice } from "@/components/legal/BorradorNotice";

export const metadata: Metadata = {
  title: "Política de Cookies — Suplevet",
  description: "Cómo usamos cookies y tecnologías similares en este sitio.",
};

export default function CookiesPage() {
  return (
    <LegalDoc titulo="Política de Cookies" actualizado="4 de julio de 2026">
      <BorradorNotice />
      <p>
        Usamos cookies y tecnologías similares para que el sitio funcione correctamente, recordar
        tu carrito de compras, y entender cómo se usa el sitio para mejorarlo.
      </p>

      <h2>1. Cookies esenciales</h2>
      <p>
        Necesarias para el funcionamiento del sitio: mantener tu sesión iniciada y el contenido de
        tu carrito de compras. No pueden desactivarse.
      </p>

      <h2>2. Cookies de análisis</h2>
      <p>
        Usamos Google Analytics y Google Tag Manager para entender cómo los visitantes usan el
        sitio (páginas vistas, productos de interés) y así mejorar la experiencia de compra.
      </p>

      <h2>3. Cómo gestionar las cookies</h2>
      <p>
        Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar el
        funcionamiento del carrito de compras y el checkout.
      </p>
    </LegalDoc>
  );
}
