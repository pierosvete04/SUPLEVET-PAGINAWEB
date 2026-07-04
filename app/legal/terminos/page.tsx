import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { BorradorNotice } from "@/components/legal/BorradorNotice";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Suplevet",
  description: "Condiciones de uso del sitio web y de compra de productos Suplevet.",
};

export default function TerminosPage() {
  return (
    <LegalDoc titulo="Términos y Condiciones" actualizado="4 de julio de 2026">
      <BorradorNotice />
      <p>
        Este sitio es operado por {siteConfig.legal.razonSocial} (RUC {siteConfig.legal.ruc}). Al
        usar este sitio y comprar nuestros productos, aceptas los siguientes términos.
      </p>

      <h2>1. Productos</h2>
      <p>
        Suplevet es un suplemento nutricional de uso veterinario, no un medicamento. No reemplaza
        la alimentación diaria de tu mascota ni sustituye una consulta veterinaria.
      </p>

      <h2>2. Precios y pagos</h2>
      <p>
        Los precios se muestran en soles peruanos (S/.) e incluyen IGV. Aceptamos tarjeta (vía
        Mercado Pago), Yape, Plin y transferencia bancaria. Los pedidos pagados por Yape/Plin/
        transferencia quedan pendientes de verificación hasta confirmar el comprobante.
      </p>

      <h2>3. Envíos</h2>
      <p>
        Ver nuestra{" "}
        <a href="/legal/envios" className="font-bold text-primary">
          Política de Envíos
        </a>{" "}
        para tiempos y costos según tu zona.
      </p>

      <h2>4. Cambios y devoluciones</h2>
      <p>
        Si tu producto llega dañado o incorrecto, contáctanos dentro de las 48 horas siguientes a
        la entrega para coordinar el cambio o devolución correspondiente.
      </p>

      <h2>5. Programa SuplePoints</h2>
      <p>
        Cada compra acredita puntos según las reglas vigentes del programa de fidelización,
        visibles en tu cuenta del portal de clientes.
      </p>

      <h2>6. Libro de Reclamaciones</h2>
      <p>
        Como consumidor, tienes derecho a registrar un reclamo o queja en nuestro{" "}
        <a href="/legal/libro-de-reclamaciones" className="font-bold text-primary">
          Libro de Reclamaciones
        </a>
        .
      </p>
    </LegalDoc>
  );
}
