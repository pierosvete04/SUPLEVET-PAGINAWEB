import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { siteConfig } from "@/lib/site-config";

/**
 * Página pública que describe la aplicación interna de Suplevet que consume
 * las APIs de Google.
 *
 * Existe porque Google la exige: el campo "Página principal de la aplicación"
 * de la pantalla de consentimiento OAuth tiene que apuntar a una URL pública,
 * en un dominio verificado, que explique QUÉ HACE la app que pide los
 * permisos. La home de la tienda no sirve para eso — describe el producto que
 * vendemos, no la herramienta. Si se cambia la ruta de esta página, hay que
 * actualizar el campo en Google Cloud o la verificación se cae.
 */
export const metadata: Metadata = {
  title: "Integraciones con Google",
  description:
    "Cómo el panel interno de Suplevet usa las APIs de Google Search Console y Google Ads para investigar palabras clave.",
  alternates: { canonical: `${siteConfig.siteUrl}/legal/integraciones-google` },
};

export default function IntegracionesGooglePage() {
  return (
    <LegalDoc titulo="Integraciones con Google" actualizado="20 de agosto de 2026">
      <p>
        Esta página describe la aplicación interna que Suplevet utiliza para conectarse con los
        servicios de Google, y qué datos consulta a través de ellos.
      </p>

      <h2>Qué es la aplicación</h2>
      <p>
        Suplevet mantiene un panel de administración privado, alojado en este mismo dominio, que
        el equipo usa para gestionar la tienda. Dentro de ese panel existe un módulo de
        investigación de palabras clave, cuyo único fin es ayudarnos a decidir sobre qué temas
        escribir y cómo redactar los títulos y descripciones de las páginas de{" "}
        {siteConfig.siteUrl.replace("https://", "")}.
      </p>
      <p>
        La aplicación es de uso <strong>exclusivamente interno</strong>. No está disponible para
        el público, para nuestros clientes ni para terceros. Solo pueden acceder las cuentas del
        equipo de Suplevet que tienen rol de administrador, previa autenticación.
      </p>

      <h2>Qué servicios de Google utiliza</h2>
      <ul>
        <li>
          <strong>Google Search Console API.</strong> Consultamos, en modo de solo lectura, el
          rendimiento de nuestro propio sitio en el buscador: qué búsquedas muestran nuestras
          páginas, cuántas impresiones y clics reciben, y en qué posición promedio aparecen.
        </li>
        <li>
          <strong>Google Ads API (Keyword Planner).</strong> Consultamos ideas de palabras clave
          relacionadas y su volumen de búsqueda aproximado en Perú, para descubrir temas de
          interés sobre los que todavía no tenemos contenido publicado.
        </li>
      </ul>

      <h2>Qué NO hace la aplicación</h2>
      <ul>
        <li>No crea, modifica, pausa ni elimina campañas, anuncios ni presupuestos publicitarios.</li>
        <li>No accede a datos de ninguna cuenta que no sea la propia de Suplevet.</li>
        <li>No recopila información personal de visitantes ni de clientes a través de estas APIs.</li>
        <li>
          No comparte, vende ni cede a terceros ningún dato obtenido de las APIs de Google. La
          información se usa únicamente de forma interna, para nuestro propio trabajo editorial.
        </li>
      </ul>

      <h2>Datos que se conservan</h2>
      <p>
        De los resultados que devuelven estas APIs guardamos únicamente información agregada sobre
        búsquedas: el texto de la palabra clave, su volumen de búsqueda aproximado, el nivel de
        competencia y las métricas de rendimiento de nuestras propias páginas. No se trata de
        datos personales ni permite identificar a ninguna persona. Esta información se almacena en
        nuestra base de datos privada y solo es accesible para el mismo equipo interno.
      </p>

      <h2>Credenciales y seguridad</h2>
      <p>
        Las credenciales de acceso a las APIs de Google se guardan como variables de entorno en el
        servidor. Nunca se envían al navegador ni quedan expuestas en el código que se ejecuta del
        lado del cliente. Todas las llamadas a Google se realizan desde nuestro servidor, previa
        verificación de la sesión y del rol de la persona que las solicita.
      </p>

      <h2>Uso de los datos de Google</h2>
      <p>
        El uso que Suplevet hace de la información recibida de las APIs de Google se ajusta a la{" "}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Política de Datos de Usuario de los Servicios de API de Google
        </a>
        , incluidos sus requisitos de uso limitado.
      </p>

      <h2>Privacidad y contacto</h2>
      <p>
        El tratamiento general de datos personales en este sitio se describe en nuestra{" "}
        <a href="/legal/privacidad">Política de Privacidad</a>. Para cualquier consulta sobre esta
        integración puedes escribirnos a{" "}
        <a href={`mailto:${siteConfig.correoContacto}`}>{siteConfig.correoContacto}</a>.
      </p>
    </LegalDoc>
  );
}
