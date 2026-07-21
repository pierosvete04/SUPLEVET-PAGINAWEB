import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Condiciones de uso del sitio web y de compra de productos Suplevet.",
  alternates: { canonical: `${siteConfig.siteUrl}/legal/terminos` },
};

export default function TerminosPage() {
  return (
    <LegalDoc titulo="Términos y Condiciones del Servicio" actualizado="5 de julio de 2026">
      <p>
        Bienvenido a Suplevet. Al acceder y utilizar nuestra tienda en línea y nuestros servicios,
        aceptas los siguientes Términos y Condiciones de Servicio. Te recomendamos leerlos
        detenidamente antes de realizar una compra.
      </p>

      <h2>1. Definiciones</h2>
      <ul>
        <li>
          <strong>&ldquo;Suplevet&rdquo;</strong>: se refiere a la empresa y su tienda en línea
          www.suplevet.pe, encargada de la venta de suplementos para mascotas.
        </li>
        <li>
          <strong>&ldquo;Cliente&rdquo;</strong>: persona que compra productos a través de la
          plataforma de Suplevet.
        </li>
        <li>
          <strong>&ldquo;Producto&rdquo;</strong>: cualquier suplemento o artículo veterinario
          ofrecido en nuestra tienda en línea.
        </li>
        <li>
          <strong>&ldquo;Pedido&rdquo;</strong>: toda solicitud de compra realizada por un cliente
          en nuestro sitio web.
        </li>
      </ul>

      <h2>2. Uso del sitio web</h2>
      <ul>
        <li>El cliente debe ser mayor de 18 años para realizar compras.</li>
        <li>La información proporcionada debe ser veraz y actualizada.</li>
        <li>No se permite el uso de la plataforma para actividades ilegales o fraudulentas.</li>
        <li>Suplevet se reserva el derecho de modificar estos términos en cualquier momento sin previo aviso.</li>
      </ul>

      <h2>3. Proceso de compra</h2>
      <p>
        <strong>Pedidos y confirmación.</strong> Una vez realizado el pedido y confirmado el pago,
        recibirás un correo con los detalles de la compra. Suplevet se reserva el derecho de
        rechazar pedidos por falta de disponibilidad de productos o problemas en la validación del
        pago.
      </p>
      <p>
        <strong>Precios y pagos.</strong> Todos los precios están en soles e incluyen impuestos
        aplicables. Métodos de pago aceptados: tarjeta de crédito/débito, transferencias bancarias
        y otros métodos disponibles en la tienda.
      </p>
      <p>
        <strong>Facturación.</strong> Si necesitas factura, debes solicitarla al momento de la
        compra proporcionando los datos fiscales correspondientes.
      </p>

      <h2>4. Envíos y entrega</h2>
      <p>
        <strong>Tiempo de entrega.</strong> Los tiempos de entrega varían según la ubicación y la
        disponibilidad del producto. Estimamos entregas entre 1 y 2 días hábiles dentro de Lima y
        hasta 4 días hábiles para envíos nacionales.
      </p>
      <p>
        <strong>Costos de envío.</strong> Los costos de envío se calculan al momento de la compra y
        dependen de la ubicación del cliente.
      </p>
      <p>
        <strong>Responsabilidad en la entrega.</strong> Suplevet no se hace responsable por
        retrasos causados por empresas de mensajería o eventos de fuerza mayor. En caso de
        problemas con la entrega, el cliente debe comunicarse dentro de 24-48 horas con nuestro
        equipo de atención al cliente.
      </p>

      <h2>5. Política de no devoluciones y reemplazo de producto</h2>
      <p>No se aceptan devoluciones ni cambios una vez realizada la compra.</p>
      <p>Solo se aplicará reemplazo de producto en los siguientes casos:</p>
      <ul>
        <li>El cliente recibió un producto diferente al solicitado.</li>
        <li>El producto llegó dañado de origen.</li>
      </ul>
      <p>Para solicitar un reemplazo:</p>
      <ul>
        <li>Notificarlo dentro de 12 horas después de recibir el producto.</li>
        <li>Enviar evidencia fotográfica del problema a ventas@suplevet.pe.</li>
      </ul>
      <p>
        Consulta el detalle completo en nuestra{" "}
        <a href="/legal/devoluciones" className="font-bold text-secondary">
          Política de Devoluciones y Reembolsos
        </a>
        .
      </p>

      <h2>6. Garantía de productos</h2>
      <p>
        Suplevet garantiza que todos sus productos son 100% originales y cumplen con estándares de
        calidad. No ofrecemos garantía en caso de uso inadecuado, almacenamiento incorrecto o
        expiración del producto.
      </p>

      <h2>7. Responsabilidad y uso del producto</h2>
      <p>
        Suplevet no sustituye el diagnóstico veterinario. Todos los productos deben ser
        administrados según las indicaciones del empaque o recomendación de un veterinario. No nos
        hacemos responsables por efectos adversos derivados del mal uso del producto.
      </p>

      <h2>8. Protección de datos personales</h2>
      <p>
        Suplevet protege la privacidad de sus clientes conforme a la Ley de Protección de Datos
        Personales. No compartimos información con terceros sin consentimiento del cliente. La
        información de pago está protegida con protocolos de seguridad SSL.
      </p>

      <h2>9. Propiedad intelectual</h2>
      <p>
        Todos los contenidos, imágenes, textos y diseños de Suplevet están protegidos por derechos
        de autor. Está prohibida la reproducción total o parcial del contenido sin autorización.
      </p>

      <h2>10. Modificaciones y cambios en los términos</h2>
      <p>
        Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios
        entrarán en vigor desde su publicación en la web.
      </p>

      <h2>11. Contacto y atención al cliente</h2>
      <p>Si tienes alguna duda sobre nuestros términos y condiciones, puedes contactarnos en:</p>
      <ul>
        <li>Correo: ventas@suplevet.pe</li>
        <li>Teléfono: 959 467 248</li>
        <li>Sitio web: www.suplevet.pe</li>
        <li>Horario de atención: Lunes a viernes de 9:00 AM - 6:00 PM</li>
      </ul>
      <p>Gracias por confiar en Suplevet y en nuestro compromiso con la salud de tu mascota.</p>
    </LegalDoc>
  );
}
