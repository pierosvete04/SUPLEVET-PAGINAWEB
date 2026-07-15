import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Política de Devoluciones y Reembolsos",
  description:
    "Condiciones de reemplazo de producto de Suplevet: productos dañados o entregados por error.",
};

export default function DevolucionesPage() {
  return (
    <LegalDoc titulo="Política de Devoluciones y Reembolsos de Producto" actualizado="5 de julio de 2026">
      <p>
        En Suplevet, garantizamos la calidad y seguridad de nuestros productos para el bienestar de
        tu mascota. Por esta razón, todas las ventas son finales y no aceptamos devoluciones de
        mercancía.
      </p>
      <p>Sin embargo, aplicamos reemplazo de producto en los siguientes casos específicos:</p>
      <ul>
        <li>Si el cliente recibe un producto diferente al solicitado.</li>
        <li>Si el producto llega dañado de origen.</li>
      </ul>

      <h2>1. Condiciones para reemplazo de producto</h2>
      <p>
        Para hacer válido el reemplazo, el cliente deberá reportarlo a nuestros medios de contacto
        de manera inmediata al momento de la recepción del pedido o en un plazo no mayor a 12
        horas, contado a partir del horario de entrega.
      </p>
      <p>
        Al recibir tu pedido, te pedimos que revises inmediatamente el estado del producto para
        asegurarte de que está correcto y en óptimas condiciones.
      </p>
      <p>Para solicitar un reemplazo, el cliente deberá proporcionar:</p>
      <ul>
        <li>Foto del producto recibido, mostrando el daño o error.</li>
        <li>Foto del empaque original y número de lote del producto.</li>
        <li>Número de pedido y comprobante de compra.</li>
      </ul>

      <h2>2. Proceso de reemplazo</h2>
      <p>
        Una vez validada la solicitud, procederemos a generar un cupón por el monto del valor del
        producto afectado, que podrá ser utilizado en una nueva compra de reposición a través de
        nuestra tienda online. El reemplazo se realizará exclusivamente mediante cupón de crédito,
        no se emitirán reembolsos en efectivo o a tarjeta de crédito/débito.
      </p>

      <h2>3. Pedidos fuera de Lima o envíos nacionales</h2>
      <p>
        Para clientes que realicen pedidos fuera de Lima o envíos nacionales, el proceso de
        reemplazo se gestionará directamente con Suplevet. El cliente deberá proporcionar todas las
        evidencias solicitadas para el cumplimiento del procedimiento de reemplazo.
      </p>

      <h2>4. Contacto y atención al cliente</h2>
      <p>Si tienes alguna duda sobre nuestra política, puedes contactarnos en:</p>
      <ul>
        <li>Correo: ventas@suplevet.pe</li>
        <li>Teléfono: 943 116 820</li>
        <li>Horario de atención: Lunes a viernes de 9:00 AM - 6:00 PM</li>
      </ul>
      <p>Gracias por confiar en Suplevet y en nuestro compromiso con la salud de tu mascota.</p>
    </LegalDoc>
  );
}
