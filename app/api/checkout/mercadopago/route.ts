import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMercadoPagoPreferenceClient } from "@/lib/mercadopago";
import { siteConfig } from "@/lib/site-config";
import { getVariantePorSlug } from "@/lib/regalo-variantes";

interface ItemPedido {
  nombre: string;
  cantidad: number;
}

// Título del ítem que Mercado Pago muestra en "Detalles del pago" — se arma
// con los productos reales del pedido (y el regalo, si tiene) en vez de un
// genérico "Pedido {numero}", para que el cliente reconozca su compra en el
// checkout. MP trunca/ignora títulos muy largos, así que se limita a 250
// caracteres.
function construirTituloPago(
  numero: string,
  productos: ItemPedido[],
  nombreRegalo: string | null
): string {
  const listaProductos = productos
    .map((p) => (p.cantidad > 1 ? `${p.nombre} x${p.cantidad}` : p.nombre))
    .join(", ");
  const partes = [listaProductos || `Pedido ${numero}`];
  if (nombreRegalo) partes.push(`Regalo: Bandana ${nombreRegalo}`);

  const titulo = `${partes.join(" + ")} — Suplevet`;
  return titulo.length > 250 ? `${titulo.slice(0, 249)}…` : titulo;
}

// Llamado por app/checkout/page.tsx justo después de registrar_pedido_web()
// cuando el método elegido es "tarjeta". Crea la preferencia de Checkout Pro
// para ESE pedido puntual y devuelve el link al que se redirige al cliente
// para pagar con tarjeta de crédito/débito.
//
// El pedido se relee de la BD (no se confía en montos que mande el navegador)
// — la RLS "Cliente ve sus pedidos" ya garantiza que solo el dueño del pedido
// (o un admin) puede leerlo, así que un cliente no puede generar una
// preferencia para el pedido de otra persona.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const pedidoId = body?.pedidoId;
  if (typeof pedidoId !== "string" || !pedidoId) {
    return NextResponse.json({ error: "pedidoId requerido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select(
      "id, shopify_order_number, total, cliente_email, cliente_nombre, forma_pago, estado_pago, productos, regalo_bandana"
    )
    .eq("id", pedidoId)
    .maybeSingle();

  if (error || !pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  if (pedido.forma_pago !== "tarjeta") {
    return NextResponse.json({ error: "Este pedido no usa pago con tarjeta" }, { status: 400 });
  }
  if (pedido.estado_pago !== "pendiente_verificacion") {
    return NextResponse.json({ error: "Este pedido ya fue procesado" }, { status: 400 });
  }

  // Origen de la request (localhost en desarrollo, dominio real en
  // producción) — sirve para que MP redirija de vuelta al mismo entorno
  // desde el que se inició la compra. El webhook, en cambio, siempre apunta
  // al dominio de producción (es el único servidor públicamente alcanzable).
  const origin = new URL(request.url).origin;
  // auto_return exige que back_urls.success sea una URL pública HTTPS
  // alcanzable — con un origin de localhost, MP rechaza la preferencia
  // entera (400 "auto_return invalid"), así que en local se omite y el
  // cliente vuelve a la tienda manualmente en vez de con redirect automático.
  const puedeAutoRetornar = origin.startsWith("https://");
  // En modo prueba NO se envía el email real del cliente como payer: si ese
  // correo pertenece a una cuenta real de Mercado Pago, la preferencia queda
  // ligada a una "parte real" y el pago de prueba falla con "Una de las
  // partes con la que intentas hacer el pago es de prueba" (verificado
  // experimentalmente el 2026-07-22). Quitar MERCADOPAGO_MODO_PRUEBA del
  // entorno (o ponerla en false) al pasar a credenciales productivas.
  const esModoPrueba = process.env.MERCADOPAGO_MODO_PRUEBA === "true";
  const numero = pedido.shopify_order_number ?? pedido.id;
  const productos = Array.isArray(pedido.productos) ? (pedido.productos as ItemPedido[]) : [];
  const regalo = await getVariantePorSlug(supabase, pedido.regalo_bandana);
  const tituloPago = construirTituloPago(numero, productos, regalo?.nombre ?? null);

  try {
    const preference = await getMercadoPagoPreferenceClient().create({
      body: {
        items: [
          {
            id: pedido.id,
            title: tituloPago,
            quantity: 1,
            unit_price: Number(pedido.total),
            currency_id: "PEN",
          },
        ],
        payer: esModoPrueba
          ? {
              // Correo ficticio estilo test user — no puede coincidir con
              // ninguna cuenta real de MP para que el pago de prueba pase.
              name: "Comprador Prueba",
              email: "comprador_prueba@testuser.com",
            }
          : {
              name: pedido.cliente_nombre ?? undefined,
              email: pedido.cliente_email ?? undefined,
            },
        external_reference: pedido.id,
        statement_descriptor: "SUPLEVET",
        back_urls: {
          success: `${origin}/checkout/exito?pedido=${pedido.id}`,
          pending: `${origin}/checkout/exito?pedido=${pedido.id}`,
          failure: `${origin}/checkout/exito?pedido=${pedido.id}`,
        },
        ...(puedeAutoRetornar ? { auto_return: "approved" as const } : {}),
        notification_url: `${siteConfig.siteUrl}/api/webhooks/mercadopago`,
        binary_mode: true,
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" },
            { id: "atm" },
            { id: "bank_transfer" },
            { id: "digital_wallet" },
          ],
        },
      },
    });

    const initPoint = preference.init_point ?? preference.sandbox_init_point;
    if (!initPoint) {
      return NextResponse.json({ error: "Mercado Pago no devolvió un link de pago" }, { status: 502 });
    }

    return NextResponse.json({ initPoint });
  } catch (mpError: unknown) {
    console.error("Error creando preferencia de Mercado Pago:", mpError);
    return NextResponse.json({ error: "No se pudo iniciar el pago con Mercado Pago" }, { status: 502 });
  }
}
