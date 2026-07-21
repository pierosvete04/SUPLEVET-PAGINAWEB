import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/emails/send";

// Llamado por el selector de "Estado de preparación" en
// app/admin/(panel)/pedidos/[id]. Cada transición manda un aviso al cliente
// (salvo el estado inicial "no_preparado", que no es una notificación útil).
// Cuando el nuevo estado es "entregado", además de actualizar la fila dispara
// acreditar_puntos_pedido_web() (SuplePoints se acreditan a la entrega, no al
// pago — SuplePoints_Documento_Corporativo.docx §6, para evitar fraude por
// devolución inmediata) y manda el correo puntos_acreditados con el saldo real
// en vez del aviso genérico de entrega.
const ESTADOS_VALIDOS = ["no_preparado", "en_preparacion", "preparado", "entregado", "devuelto"] as const;
type EstadoPreparacion = (typeof ESTADOS_VALIDOS)[number];

function esEstadoValido(valor: unknown): valor is EstadoPreparacion {
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
    .update({ estado_preparacion: estado })
    .eq("id", id)
    .select("cliente_email, cliente_nombre, shopify_order_number")
    .maybeSingle();

  if (error || !pedido) {
    return NextResponse.json(
      { error: error?.message ?? "No autorizado o pedido no encontrado" },
      { status: 403 }
    );
  }

  if (estado !== "entregado") {
    if (pedido.cliente_email && estado !== "no_preparado") {
      const numeroPedido = pedido.shopify_order_number ?? "";
      const nombre = pedido.cliente_nombre ?? "cliente";

      const { error: sendError } =
        estado === "en_preparacion"
          ? await sendTransactionalEmail(pedido.cliente_email, {
              tipo: "pedido_en_preparacion",
              data: { nombre, numeroPedido },
            })
          : estado === "preparado"
            ? await sendTransactionalEmail(pedido.cliente_email, {
                tipo: "pedido_en_camino",
                data: { nombre, numeroPedido },
              })
            : await sendTransactionalEmail(pedido.cliente_email, {
                tipo: "pedido_devuelto",
                data: { nombre, numeroPedido },
              });

      if (sendError) {
        console.error("No se pudo enviar el correo de estado de preparación:", sendError);
      }
    }

    return NextResponse.json({ ok: true });
  }

  // acreditar_puntos_pedido_web ya trae su propio candado is_admin() + chequeo
  // de idempotencia (pedidos.puntos_acreditados > 0) — no se duplica acá.
  const { data: resultado, error: rpcError } = await supabase.rpc("acreditar_puntos_pedido_web", {
    p_pedido_id: id,
  });

  if (rpcError || !resultado?.ok) {
    console.error("No se pudo acreditar SuplePoints del pedido:", rpcError ?? resultado?.error);
    return NextResponse.json({ ok: true, puntos: false });
  }

  if (resultado.ya_procesado || !pedido.cliente_email) {
    return NextResponse.json({ ok: true, puntos: !!resultado.ya_procesado });
  }

  const { error: sendError } = await sendTransactionalEmail(pedido.cliente_email, {
    tipo: "puntos_acreditados",
    data: {
      nombre: pedido.cliente_nombre ?? "cliente",
      puntosGanados: resultado.puntos,
      saldoAnterior: resultado.saldo_anterior,
      saldoNuevo: resultado.saldo_nuevo,
      origen: `tu pedido ${pedido.shopify_order_number ?? ""}`,
    },
  });

  if (sendError) {
    console.error("No se pudo enviar el correo de puntos acreditados:", sendError);
  }

  return NextResponse.json({ ok: true, puntos: true, detalle: resultado });
}
