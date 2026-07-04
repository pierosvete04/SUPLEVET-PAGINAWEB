import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { BorradorNotice } from "@/components/legal/BorradorNotice";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Política de Privacidad — Suplevet",
  description: "Cómo Suplevet recopila, usa y protege tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <LegalDoc titulo="Política de Privacidad" actualizado="4 de julio de 2026">
      <BorradorNotice />
      <p>
        {siteConfig.legal.razonSocial} (RUC {siteConfig.legal.ruc}), con domicilio en{" "}
        {siteConfig.legal.domicilioFiscal}, es responsable del tratamiento de los datos personales
        que nos proporcionas a través de este sitio web, en armonía con la Ley N.° 29733 de
        Protección de Datos Personales y su Reglamento.
      </p>

      <h2>1. Datos que recopilamos</h2>
      <p>
        Nombre, correo electrónico, teléfono, dirección de envío y datos de pago necesarios para
        procesar tus pedidos, además de datos de tus mascotas si los registras voluntariamente en
        el portal de clientes.
      </p>

      <h2>2. Finalidad del tratamiento</h2>
      <ul>
        <li>Procesar y entregar tus pedidos.</li>
        <li>Gestionar tu cuenta y el programa de fidelización SuplePoints.</li>
        <li>Enviarte comunicaciones sobre tu pedido (correo y WhatsApp).</li>
        <li>Atender consultas, reclamos y quejas.</li>
        <li>Mejorar nuestros productos y servicios.</li>
      </ul>

      <h2>3. Con quién compartimos tus datos</h2>
      <p>
        No vendemos tus datos personales. Los compartimos únicamente con proveedores necesarios
        para operar el servicio (procesador de pagos, empresas de mensajería, proveedor de
        infraestructura en la nube), bajo acuerdos de confidencialidad.
      </p>

      <h2>4. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición (derechos
        ARCO) escribiéndonos a {siteConfig.legal.correoAtencion}.
      </p>

      <h2>5. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables para proteger tus datos personales
        contra acceso no autorizado, pérdida o alteración.
      </p>
    </LegalDoc>
  );
}
