import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Reglamento del Portal de Clientes y SuplePoints",
  description:
    "Reglas de uso del Portal de Clientes de Suplevet y del programa de fidelización SuplePoints: cuentas, niveles, vigencia y canje de puntos.",
  alternates: { canonical: `${siteConfig.siteUrl}/legal/reglamento-portal` },
};

export default function ReglamentoPortalPage() {
  return (
    <LegalDoc titulo="Reglamento del Portal de Clientes y SuplePoints" actualizado="24 de julio de 2026">
      <p>
        Este reglamento regula el uso del Portal de Clientes de Suplevet (
        <strong>&ldquo;Mi Cuenta&rdquo;</strong>) y de su programa de fidelización{" "}
        <strong>SuplePoints</strong>. Al crear una cuenta o participar del programa, aceptas estas
        condiciones, además de nuestros{" "}
        <a href="/legal/terminos" className="font-bold text-secondary">
          Términos y Condiciones del Servicio
        </a>
        .
      </p>

      <h2>1. Cuenta de cliente</h2>
      <ul>
        <li>Cada cliente puede tener una sola cuenta, asociada a un único correo electrónico.</li>
        <li>
          Los datos de la cuenta (nombre, teléfono, mascotas registradas) deben ser veraces y
          corresponder al titular real de la cuenta.
        </li>
        <li>
          No está permitido crear cuentas duplicadas ni usar datos de terceros para acceder a
          beneficios de bienvenida, referidos o promociones más de una vez.
        </li>
        <li>
          El acceso al portal es personal e intransferible. El titular es responsable de la
          confidencialidad de sus credenciales de ingreso.
        </li>
      </ul>

      <h2>2. Qué son los SuplePoints</h2>
      <p>
        Los SuplePoints son puntos de fidelización sin valor monetario. No son dinero, no se pueden
        cambiar por efectivo y solo pueden usarse dentro de la tienda de Suplevet, en las
        condiciones descritas en este reglamento.
      </p>
      <p>
        <strong>Los SuplePoints son personales e intransferibles.</strong> No se pueden transferir,
        ceder, regalar ni combinar puntos entre distintas cuentas de cliente, bajo ninguna
        circunstancia. Cada cliente solo puede ganar y usar los puntos acreditados en su propia
        cuenta.
      </p>

      <h2>3. Saldo canjeable e histórico</h2>
      <p>Cada cuenta tiene dos contadores independientes:</p>
      <ul>
        <li>
          <strong>Saldo canjeable:</strong> los puntos disponibles para usar en el Catálogo de
          Recompensas. Baja cada vez que canjeas una recompensa.
        </li>
        <li>
          <strong>Puntos histórico:</strong> la suma total de todos los puntos que has ganado desde
          tu último reinicio anual. Nunca baja al canjear — es el que define tu nivel.
        </li>
      </ul>
      <p>
        Por eso, usar tus puntos en una recompensa nunca te hace bajar de nivel: solo afecta tu
        saldo canjeable.
      </p>

      <h2>4. Niveles del programa</h2>
      <p>
        Tu nivel se calcula automáticamente según tus puntos histórico acumulados en el año en
        curso:
      </p>
      <ul>
        <li>
          <strong>Básico</strong> (0 pts) — acceso completo al portal y al programa.
        </li>
        <li>
          <strong>Silver</strong> (desde 500 pts) — descuento adicional en tus compras.
        </li>
        <li>
          <strong>Gold</strong> (desde 1,500 pts) — envíos prioritarios.
        </li>
        <li>
          <strong>Diamond</strong> (desde 4,000 pts) — beneficios VIP.
        </li>
      </ul>
      <p>
        Suplevet puede ajustar los umbrales, nombres y beneficios de cada nivel en cualquier
        momento; los cambios se reflejan directamente en el portal.
      </p>

      <h2>5. Cómo se ganan puntos</h2>
      <p>
        Los puntos se acreditan automáticamente por acciones como tu primera compra, registrar a
        tus mascotas, completar tu perfil, dejar reseñas verificadas de productos comprados,
        referir amigos que completen su primera compra, responder encuestas de satisfacción,
        cumpleaños de tus mascotas, aniversario como cliente y compras recurrentes, entre otras.
      </p>
      <p>
        La lista vigente de formas de ganar puntos, su valor en puntos y sus límites (por ejemplo,
        cantidad máxima de referidos o reseñas que otorgan puntos por año) se muestran de forma
        actualizada en la sección &ldquo;Cómo ganar más puntos&rdquo; de tu Portal de Clientes, y
        pueden cambiar sin previo aviso.
      </p>

      <h2>6. Canje de recompensas</h2>
      <ul>
        <li>
          Cada canje genera un código de un solo uso, personal e intransferible, que debes aplicar
          en tu propia compra dentro de la tienda online.
        </li>
        <li>Los puntos usados en un canje no se devuelven, salvo error atribuible a Suplevet.</li>
        <li>
          Suplevet puede fijar una fecha de vencimiento para un código de canje; pasado ese plazo,
          el código deja de ser válido y los puntos usados no se reembolsan.
        </li>
        <li>
          Suplevet se reserva el derecho de anular un canje y descontar o revertir los puntos
          correspondientes en caso de error del sistema o uso indebido.
        </li>
      </ul>

      <h2>7. Vigencia y reinicio anual</h2>
      <p>
        El programa funciona por año calendario, al estilo de un programa de viajero frecuente.
        Cada <strong>1 de enero</strong>, tanto tu saldo canjeable como tus puntos histórico se
        reinician a cero para todos los clientes por igual, y tu nivel vuelve a Básico. A partir de
        ese momento vuelves a acumular puntos y a subir de nivel durante el nuevo año.
      </p>
      <p>Los códigos de canje pendientes de uso no se conservan de un año a otro.</p>

      <h2>8. Uso indebido del programa</h2>
      <p>
        Suplevet puede suspender una cuenta, anular puntos o cancelar canjes cuando detecte:
      </p>
      <ul>
        <li>Cuentas duplicadas o creadas para obtener beneficios repetidos.</li>
        <li>Reseñas falsas o que no corresponden a una compra real.</li>
        <li>Referidos fraudulentos (auto-referidos o cuentas falsas).</li>
        <li>
          Cualquier intento de manipular, revender o transferir puntos, códigos de canje o cuentas
          fuera de lo permitido en este reglamento.
        </li>
      </ul>

      <h2>9. Otros beneficios del Portal de Clientes</h2>
      <p>
        Además de SuplePoints, el portal puede incluir contenidos y funciones adicionales para
        clientes registrados (por ejemplo, carnet digital de tus mascotas, cursos, plan semanal o
        ranking de la comunidad). Estos contenidos son un beneficio del portal y pueden agregarse,
        modificarse o retirarse por Suplevet en cualquier momento, sin que ello afecte tu saldo de
        SuplePoints.
      </p>

      <h2>10. Modificaciones a este reglamento</h2>
      <p>
        Suplevet puede modificar este reglamento, el catálogo de recompensas, las formas de ganar
        puntos y los niveles del programa en cualquier momento. Los cambios entran en vigencia
        desde su publicación en esta página.
      </p>

      <h2>11. Contacto</h2>
      <p>Si tienes dudas sobre tu cuenta o tus SuplePoints, puedes contactarnos en:</p>
      <ul>
        <li>Correo: ventas@suplevet.pe</li>
        <li>Teléfono: 959 467 248</li>
        <li>Horario de atención: Lunes a viernes de 9:00 AM - 6:00 PM</li>
      </ul>
    </LegalDoc>
  );
}
