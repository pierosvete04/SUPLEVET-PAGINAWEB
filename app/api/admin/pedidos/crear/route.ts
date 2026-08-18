import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificarPedidoTelegram } from "@/lib/notificaciones/pedido-telegram";
import {
  esItemValido,
  guardarPerfil,
  normalizarBandanas,
  normalizarDireccion,
  resolverClienteId,
  texto,
  type BandanaBody,
  type ItemBody,
} from "@/lib/pedidos/manual-pedido";

// Pedido creado a mano desde /admin/pedidos/nuevo (venta telefónica, WhatsApp,
// etc). El INSERT directo en `pedidos` ya está permitido por RLS para
// cualquier sesión admin ("Solo admin inserta pedidos" -> is_admin()), así
// que no hace falta el RPC registrar_pedido_web (ese es SECURITY DEFINER
// solo porque el cliente final no tiene permiso de INSERT). El equivalente
// para editores sí pasa por el RPC — ver /api/mi-panel/pedidos/crear.
const FORMAS_PAGO_VALIDAS = ["tarjeta", "yape_plin", "transferencia", "contra_entrega"] as const;
const ESTADOS_PAGO_VALIDOS = ["pendiente_verificacion", "pagado"] as const;
const ZONAS_ENVIO_VALIDAS = ["lima", "costa_sierra", "selva"] as const;

// Yape/Plin y transferencia no tienen procesador que confirme el pago solo
// (a diferencia de tarjeta vía Mercado Pago) — si el admin ya lo marca como
// "pagado" al crear el pedido, el comprobante es la única evidencia de que
// realmente se cobró, así que se exige antes de guardar.
const FORMAS_QUE_EXIGEN_COMPROBANTE = ["yape_plin", "transferencia"] as const;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const clienteEmail = typeof body.cliente_email === "string" ? body.cliente_email.trim() : "";
  const clienteNombre = typeof body.cliente_nombre === "string" ? body.cliente_nombre.trim() : "";
  const clienteApellido = typeof body.cliente_apellido === "string" ? body.cliente_apellido.trim() : "";
  const clienteTelefono = texto(body.cliente_telefono);
  const clienteId = typeof body.cliente_id === "string" ? body.cliente_id : null;
  const productos = Array.isArray(body.productos) ? body.productos : [];
  const costoEnvio = typeof body.costo_envio === "number" && body.costo_envio >= 0 ? body.costo_envio : 0;
  const direccionEnvio = normalizarDireccion(body.direccion_envio);
  const zonaEnvio = ZONAS_ENVIO_VALIDAS.includes(body.zona_envio) ? body.zona_envio : null;
  const bandanas = normalizarBandanas(body.regalo_bandanas);
  const formaPago = FORMAS_PAGO_VALIDAS.includes(body.forma_pago) ? body.forma_pago : null;
  const estadoPago = ESTADOS_PAGO_VALIDOS.includes(body.estado_pago) ? body.estado_pago : "pendiente_verificacion";
  const capturaPagoUrl = texto(body.captura_pago_url);

  if (!clienteEmail || !/^\S+@\S+\.\S+$/.test(clienteEmail)) {
    return NextResponse.json({ error: "Email de cliente inválido" }, { status: 400 });
  }
  if (!clienteNombre) {
    return NextResponse.json({ error: "Nombre de cliente requerido" }, { status: 400 });
  }
  if (productos.length === 0 || !productos.every(esItemValido)) {
    return NextResponse.json({ error: "Agrega al menos un producto válido" }, { status: 400 });
  }
  if (
    estadoPago === "pagado" &&
    (FORMAS_QUE_EXIGEN_COMPROBANTE as readonly string[]).includes(formaPago ?? "") &&
    !capturaPagoUrl
  ) {
    return NextResponse.json(
      { error: "Adjunta el comprobante de pago antes de marcar el pedido como pagado." },
      { status: 400 }
    );
  }

  const subtotal = productos.reduce((acc: number, i: ItemBody) => acc + i.precio * i.cantidad, 0);
  const total = subtotal + costoEnvio;

  const supabase = await createClient();
  const clienteResuelto = await resolverClienteId(supabase, {
    clienteId,
    email: clienteEmail,
    nombre: clienteNombre,
    apellido: clienteApellido,
  });
  if ("error" in clienteResuelto) {
    return NextResponse.json({ error: clienteResuelto.error }, { status: 500 });
  }

  await guardarPerfil(supabase, clienteResuelto.id, {
    nombre: clienteNombre,
    apellido: clienteApellido,
    telefono: clienteTelefono,
    direccion: direccionEnvio,
  });

  // Las bandanas se reservan ANTES del insert para que el pedido nazca ya con
  // el regalo asignado (y el stock descontado). La función devuelve solo las
  // que quedaron reservadas de verdad; si alguna se agotó recién, se descarta
  // en silencio igual que en el checkout, sin tumbar la venta.
  let bandanasAsignadas: BandanaBody[] = [];
  if (bandanas.length > 0) {
    const { data: reservadas, error: errorBandanas } = await supabase.rpc("reservar_bandanas_regalo", {
      p_bandanas: bandanas,
    });
    if (errorBandanas) {
      return NextResponse.json(
        { error: `No se pudo reservar el regalo: ${errorBandanas.message}` },
        { status: 500 }
      );
    }
    bandanasAsignadas = (reservadas as BandanaBody[]) ?? [];
  }

  const { data: pedido, error } = await supabase
    .from("pedidos")
    .insert({
      cliente_id: clienteResuelto.id,
      cliente_email: clienteEmail,
      cliente_nombre: `${clienteNombre} ${clienteApellido}`.trim(),
      cliente_telefono: clienteTelefono,
      productos,
      subtotal,
      total,
      estado_pago: estadoPago,
      estado_preparacion: "no_preparado",
      forma_pago: formaPago,
      captura_pago_url: capturaPagoUrl,
      zona_envio: zonaEnvio,
      direccion_envio: direccionEnvio,
      regalo_bandana: bandanasAsignadas[0]?.slug ?? null,
      regalo_bandanas: bandanasAsignadas,
    })
    .select("id, numero_pedido")
    .single();

  if (error || !pedido) {
    return NextResponse.json(
      { error: error?.message ?? "No se pudo crear el pedido" },
      { status: 403 }
    );
  }

  // También avisa por Telegram las ventas cargadas a mano (teléfono, WhatsApp),
  // no solo las del checkout web — si no, el canal solo mostraría una parte de
  // las ventas y no serviría como fuente única.
  const { error: telegramError } = await notificarPedidoTelegram("nuevo_pedido", pedido.id);
  if (telegramError) {
    console.error("No se pudo enviar el aviso de Telegram del pedido manual:", telegramError);
  }

  return NextResponse.json({
    ok: true,
    pedido_id: pedido.id,
    numero_pedido: pedido.numero_pedido,
  });
}
