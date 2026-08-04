import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMercadoPagoPreferenceClient } from "@/lib/mercadopago";
import { siteConfig } from "@/lib/site-config";
import { getVariantesPorSlugs } from "@/lib/regalo-variantes";

interface ItemPedido {
  nombre: string;
  cantidad: number;
}

// Título del ítem que Mercado Pago muestra en "Detalles del pago" — se arma
// con los productos reales del pedido (y el/los regalo(s), si tiene) en vez
// de un genérico "Pedido {numero}", para que el cliente reconozca su compra
// en el checkout. MP trunca/ignora títulos muy largos, así que se limita a
// 250 caracteres.
function construirTituloPago(
  numero: string,
  productos: ItemPedido[],
  nombresRegalo: string[]
): string {
  const listaProductos = productos
    .map((p) => (p.cantidad > 1 ? `${p.nombre} x${p.cantidad}` : p.nombre))
    .join(", ");
  const partes = [listaProductos || `Pedido ${numero}`];
  if (nombresRegalo.length > 0) partes.push(`Regalo: Bandana ${nombresRegalo.join(", ")}`);

  const titulo = `${partes.join(" + ")} — Suplevet`;
  return titulo.length > 250 ? `${titulo.slice(0, 249)}…` : titulo;
}

// MP recomienda mandar nombre y apellido por separado (payer.name/surname) en
// vez de solo el nombre completo — mejora la tasa de aprobación porque ayuda
// a su motor antifraude a validar al comprador. cliente_nombre no separa
// nombres de apellidos en la BD, así que se parte por el primer espacio:
// todo lo anterior es "nombre", el resto es "apellido" (suficiente para el
// caso común de nombres peruanos con uno o dos apellidos).
function partirNombreCompleto(nombreCompleto: string | null): { name?: string; surname?: string } {
  const limpio = nombreCompleto?.trim();
  if (!limpio) return {};
  const [name, ...resto] = limpio.split(/\s+/);
  return { name, surname: resto.length > 0 ? resto.join(" ") : undefined };
}

// cliente_telefono se guarda como el número local de 9 dígitos, sin el
// código de país — MP separa área/país y número en payer.phone.
function telefonoPayer(cliente_telefono: string | null): { area_code: string; number: string } | undefined {
  const numero = cliente_telefono?.trim();
  return numero ? { area_code: "51", number: numero } : undefined;
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
      "id, shopify_order_number, total, cliente_email, cliente_nombre, cliente_telefono, forma_pago, estado_pago, productos, regalo_bandana, regalo_bandanas"
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

  // Origen de la request (dominio real, preview de Vercel, o localhost/IP en
  // desarrollo) — por defecto se usa para que MP redirija de vuelta al mismo
  // entorno desde el que se inició la compra (ej. probar desde el preview de
  // Vercel sin que el webhook apunte a producción).
  //
  // PERO solo si es un origen "confiable": dominio real de producción o
  // preview de Vercel. Antes se aceptaba cualquier origen con protocolo
  // https:// sin más validación — eso dejaba pasar cosas como
  // "https://0.0.0.0:3000" (un servidor local con HTTPS activado), que técnicamente
  // pasa el chequeo pero no es alcanzable ni por el navegador del cliente ni
  // por los servidores de Mercado Pago. Resultado real (2026-08-04): un pago
  // de producción se cobró bien, pero el cliente cayó en un ERR_ADDRESS_INVALID
  // en vez de ver /checkout/exito, y el webhook nunca pudo notificar el pago.
  // Con la validación de dominio, cualquier origen no confiable (localhost,
  // 0.0.0.0, IPs, o cualquier otra cosa) cae siempre al dominio de producción
  // — el cliente SIEMPRE termina en una página real que carga, nunca en un
  // error de dirección inválida.
  function esOrigenConfiable(origenCandidato: string): boolean {
    try {
      const { protocol, hostname } = new URL(origenCandidato);
      if (protocol !== "https:") return false;
      if (hostname === new URL(siteConfig.siteUrl).hostname) return true;
      return hostname.endsWith(".vercel.app");
    } catch {
      return false;
    }
  }
  const origenSolicitado = new URL(request.url).origin;
  const origin = esOrigenConfiable(origenSolicitado) ? origenSolicitado : siteConfig.siteUrl;
  // `origin` ya es siempre un dominio real y alcanzable (producción o preview
  // de Vercel) por la validación de arriba, así que auto_return puede ir
  // siempre activo — ya no hace falta omitirlo para localhost.
  // En modo prueba NO se envía el email real del cliente como payer: si ese
  // correo pertenece a una cuenta real de Mercado Pago, la preferencia queda
  // ligada a una "parte real" y el pago de prueba falla con "Una de las
  // partes con la que intentas hacer el pago es de prueba" (verificado
  // experimentalmente el 2026-07-22). Quitar MERCADOPAGO_MODO_PRUEBA del
  // entorno (o ponerla en false) al pasar a credenciales productivas.
  const esModoPrueba = process.env.MERCADOPAGO_MODO_PRUEBA === "true";
  const numero = pedido.shopify_order_number ?? pedido.id;
  const productos = Array.isArray(pedido.productos) ? (pedido.productos as ItemPedido[]) : [];
  const slugsBandanas = Array.isArray(pedido.regalo_bandanas)
    ? (pedido.regalo_bandanas as { slug: string }[]).map((b) => b.slug)
    : pedido.regalo_bandana
      ? [pedido.regalo_bandana]
      : [];
  const regalos = await getVariantesPorSlugs(supabase, slugsBandanas);
  const tituloPago = construirTituloPago(numero, productos, regalos.map((r) => r.nombre));

  try {
    const preference = await getMercadoPagoPreferenceClient().create({
      body: {
        items: [
          {
            id: pedido.id,
            title: tituloPago,
            // Descripción extendida del ítem (distinta del título) — uno de
            // los campos que pide el checklist de calidad de MP para
            // optimizar la tasa de aprobación de pagos.
            description: `Suplementos y accesorios para el cuidado nutricional de mascotas — Pedido ${numero}, Suplevet.`,
            quantity: 1,
            unit_price: Number(pedido.total),
            currency_id: "PEN",
          },
        ],
        payer: esModoPrueba
          ? {
              // Correo ficticio estilo test user — no puede coincidir con
              // ninguna cuenta real de MP para que el pago de prueba pase.
              name: "Comprador",
              surname: "Prueba",
              email: "comprador_prueba@testuser.com",
            }
          : {
              ...partirNombreCompleto(pedido.cliente_nombre),
              email: pedido.cliente_email ?? undefined,
              phone: telefonoPayer(pedido.cliente_telefono),
            },
        external_reference: pedido.id,
        statement_descriptor: "SUPLEVET",
        back_urls: {
          success: `${origin}/checkout/exito?pedido=${pedido.id}`,
          pending: `${origin}/checkout/exito?pedido=${pedido.id}`,
          failure: `${origin}/checkout/exito?pedido=${pedido.id}`,
        },
        auto_return: "approved",
        notification_url: `${origin}/api/webhooks/mercadopago`,
        binary_mode: true,
        payment_methods: {
          // Solo tarjeta de crédito/débito — se excluyen explícitamente
          // todos los demás payment_type_id que existen en la API de MP para
          // que esta preferencia (que ya nació con forma_pago "tarjeta") no
          // ofrezca ninguna alternativa (efectivo, transferencia, billetera,
          // etc.) en la pantalla de Checkout Pro.
          // "account_money" (saldo en cuenta de MP) no se puede incluir acá
          // — la API responde 400 "account_money cannot be excluded" si se
          // intenta (probado en producción el 2026-08-01).
          excluded_payment_types: [
            { id: "ticket" },
            { id: "atm" },
            { id: "bank_transfer" },
            { id: "digital_wallet" },
            { id: "prepaid_card" },
            { id: "digital_currency" },
            { id: "voucher_card" },
            { id: "crypto_transfer" },
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
