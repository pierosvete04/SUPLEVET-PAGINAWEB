import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/emails/send";
import { siteConfig, whatsappLink } from "@/lib/site-config";

// Llamado por el botón Confirmar/Rechazar de app/admin/(panel)/pedidos/[id] en
// vez del UPDATE directo desde el cliente — así el correo de resultado
// (pago_confirmado / pago_error) se puede mandar server-side sin exponer
// RESEND_API_KEY al navegador del admin. El UPDATE en sí lo sigue autorizando
// la misma RLS de siempre ("Solo admin actualiza pedidos" -> is_admin()); acá
// no se duplica esa verificación, se reutiliza la política.
const ESTADOS_VALIDOS = ["pagado", "rechazado"] as const;
type EstadoPago = (typeof ESTADOS_VALIDOS)[number];

function esEstadoValido(valor: unknown): valor is EstadoPago {
  return typeof valor === "string" && (ESTADOS_VALIDOS as readonly string[]).includes(valor);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!esEstadoValido(body?.estado)) {
    return NextResponse.json({ error: "estado inválido" }, { status: 400 });
  }
  const estado = body.estado;

  const supabase = await createClient();
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .update({ estado_pago: estado })
    .eq("id", id)
    .select("cliente_email, cliente_nombre, shopify_order_number")
    .maybeSingle();

  if (error || !pedido) {
    return NextResponse.json(
      { error: error?.message ?? "No autorizado o pedido no encontrado" },
      { status: 403 }
    );
  }

  if (!pedido.cliente_email) {
    return NextResponse.json({ ok: true });
  }

  const numeroPedido = pedido.shopify_order_number ?? "";
  const nombre = pedido.cliente_nombre ?? "cliente";

  const { error: sendError } =
    estado === "pagado"
      ? await sendTransactionalEmail(pedido.cliente_email, {
          tipo: "pago_confirmado",
          data: { nombre, numeroPedido, puntosGanados: 0 },
        })
      : await sendTransactionalEmail(pedido.cliente_email, {
          tipo: "pago_error",
          data: {
            nombre,
            numeroPedido,
            motivo: "no pudimos validar tu comprobante de pago",
            whatsappUrl: whatsappLink(
              siteConfig.whatsappB2C,
              `Hola, tuve un problema con el pago de mi pedido ${numeroPedido}`
            ),
          },
        });

  if (sendError) {
    console.error("No se pudo enviar el correo de estado de pago:", sendError);
  }

  return NextResponse.json({ ok: true });
}
