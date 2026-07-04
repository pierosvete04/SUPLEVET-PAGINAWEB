import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Política de envíos — Suplevet",
  description:
    "Tiempos y costos de envío de Suplevet a todo el Perú: Lima Metropolitana, costa, sierra y selva.",
};

// Contenido real de _context/05_Suplevet_Shipping_Operations.md — no inventado.
export default function EnviosPage() {
  return (
    <LegalDoc titulo="Política de Envíos" actualizado="4 de julio de 2026">
      <p>
        Realizamos envíos a todo el territorio peruano mediante operadores logísticos aliados y
        servicio de reparto propio en Lima Metropolitana.
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
            <td>24–48 horas hábiles</td>
            <td>Lima ciudad, Callao</td>
          </tr>
          <tr>
            <td>Costa y Sierra accesible</td>
            <td>48–72 horas hábiles</td>
            <td>Áncash, Arequipa, Cajamarca, Ica, Junín, La Libertad, Lambayeque, Lima Provincias, Piura, Tumbes</td>
          </tr>
          <tr>
            <td>Selva y acceso extendido</td>
            <td>72+ horas hábiles</td>
            <td>Amazonas, Apurímac, Ayacucho, Cusco, Huancavelica, Huánuco, Loreto, Madre de Dios, Moquegua, Pasco, Puno, San Martín, Tacna, Ucayali</td>
          </tr>
        </tbody>
      </table>

      <h2>Envío gratis</h2>
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
            <td>S/.150.00</td>
          </tr>
          <tr>
            <td>Costa y Sierra accesible</td>
            <td>S/.300.00</td>
          </tr>
          <tr>
            <td>Selva y zonas extendidas</td>
            <td>S/.450.00</td>
          </tr>
        </tbody>
      </table>

      <h2>Costos de envío (cuando no aplica envío gratis)</h2>
      <table>
        <thead>
          <tr>
            <th>Zona</th>
            <th>Costo de envío</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Lima Metropolitana</td>
            <td>S/.15.00</td>
          </tr>
          <tr>
            <td>Callao</td>
            <td>S/.20.00</td>
          </tr>
          <tr>
            <td>Lima Departamento</td>
            <td>S/.20.00</td>
          </tr>
          <tr>
            <td>Costa y Sierra accesible</td>
            <td>S/.25.00</td>
          </tr>
          <tr>
            <td>Selva y zonas extendidas</td>
            <td>S/.25.00</td>
          </tr>
        </tbody>
      </table>

      <h2>Consideraciones importantes</h2>
      <ul>
        <li>Los tiempos se cuentan desde la confirmación del pago.</li>
        <li>Pedidos de fin de semana o feriados se procesan el siguiente día hábil.</li>
        <li>En campañas o alta demanda, los tiempos pueden extenderse.</li>
        <li>No se garantizan franjas horarias específicas.</li>
        <li>En zonas alejadas, puede requerirse recojo en oficina de agencia interprovincial.</li>
        <li>El cliente es responsable de consignar correctamente su dirección y datos de contacto.</li>
      </ul>
    </LegalDoc>
  );
}
