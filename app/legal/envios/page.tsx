import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Política de envíos",
  description:
    "Tiempos y costos de envío de Suplevet a todo el Perú: Lima Metropolitana, costa, sierra y selva.",
  alternates: { canonical: `${siteConfig.siteUrl}/legal/envios` },
};

export default function EnviosPage() {
  return (
    <LegalDoc titulo="Política de Envíos" actualizado="5 de julio de 2026">
      <p>
        La presente es la Política de Envío de la empresa NUTROVA FOR PETS S.A.C. (RUC:
        20613665995), con domicilio fiscal en Calle Río Elba 132, Lima, Perú; la cual se encuentra
        en armonía con la normativa vigente sobre protección de Datos Personales (Ley N.° 29733 y
        Decreto Supremo 003-2013-JUS).
      </p>
      <p>
        En este documento se detallan los tiempos estimados de entrega, condiciones de despacho,
        cobertura de envíos y beneficios asociados a compras realizadas a través de nuestros
        canales oficiales.
      </p>

      <h2>Cobertura de envíos</h2>
      <p>
        Realizamos envíos a todo el territorio peruano mediante operadores logísticos aliados y
        servicios de reparto propios en Lima Metropolitana. Los tiempos de entrega son estimados y
        pueden variar por factores climáticos, logísticos o de disponibilidad de transporte.
      </p>

      <h2>Tiempos de entrega</h2>
      <table>
        <thead>
          <tr>
            <th>Zona</th>
            <th>Tiempo estimado</th>
            <th>Departamentos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Lima Metropolitana y Callao</td>
            <td>24 a 48 horas hábiles</td>
            <td>Reparto directo o courier local</td>
          </tr>
          <tr>
            <td>Costa y Sierra accesible</td>
            <td>48 a 72 horas hábiles</td>
            <td>
              Áncash, Arequipa, Cajamarca, Ica, Junín, La Libertad, Lambayeque, Lima Provincias,
              Piura y Tumbes
            </td>
          </tr>
          <tr>
            <td>Selva y zonas de acceso logístico extendido</td>
            <td>Hasta 72 horas hábiles o más según destino específico</td>
            <td>
              Amazonas, Apurímac, Ayacucho, Cusco, Huancavelica, Huánuco, Loreto, Madre de Dios,
              Moquegua, Pasco, Puno, San Martín, Tacna y Ucayali
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Envío gratis</h2>
      <p>
        El beneficio de envío gratuito se activa automáticamente cuando el monto del pedido supera
        los siguientes valores:
      </p>
      <table>
        <thead>
          <tr>
            <th>Zona</th>
            <th>Monto mínimo para envío gratis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Lima Metropolitana y Callao</td>
            <td>S/.150</td>
          </tr>
          <tr>
            <td>Costa y Sierra accesible</td>
            <td>S/.300</td>
          </tr>
          <tr>
            <td>Selva y zonas logísticas extendidas</td>
            <td>S/.450</td>
          </tr>
        </tbody>
      </table>
      <p>
        Si el pedido no alcanza el monto mínimo, el costo de envío será calculado automáticamente
        según destino y peso del paquete.
      </p>

      <h2>Consideraciones importantes</h2>
      <ul>
        <li>Los tiempos de entrega se cuentan desde la confirmación del pago.</li>
        <li>Los pedidos realizados fines de semana o feriados se procesan el siguiente día hábil.</li>
        <li>En campañas, promociones o temporadas de alta demanda, los tiempos pueden extenderse.</li>
        <li>No realizamos entregas en horarios exactos ni garantizamos franjas horarias.</li>
        <li>
          En zonas alejadas, el envío puede realizarse mediante agencia interprovincial con recojo
          en oficina.
        </li>
        <li>
          El cliente es responsable de consignar correctamente su dirección y datos de contacto.
        </li>
      </ul>

      <h2>Contacto</h2>
      <p>
        Para consultas sobre tu envío puedes escribirnos a nuestros canales oficiales de atención o
        al WhatsApp de ventas.
      </p>
    </LegalDoc>
  );
}
