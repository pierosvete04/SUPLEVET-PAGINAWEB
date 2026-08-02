import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { nombreCourier } from "@/lib/couriers";
import { brand } from "@/emails/components/brand";
import { enviarMensajeTelegram, escaparHtml, telegramConfigurado } from "./telegram";

// Arma el aviso de Telegram con el detalle completo del pedido. A diferencia
// del correo a ventas (que resume), acá va todo: cliente, documento, dirección
// exacta, productos línea por línea, regalos, desglose de totales y el estado
// real del pago. El pedido se relee de la BD con Service Role en vez de
// recibirlo por parámetro, así el mensaje siempre refleja lo guardado — sin
// importar qué campos tenía a mano el endpoint que dispara el aviso.

export type EventoPedidoTelegram =
  | "nuevo_pedido"
  | "pago_confirmado"
  | "pago_rechazado"
  | "pago_cancelado";

const TITULO_POR_EVENTO: Record<EventoPedidoTelegram, string> = {
  nuevo_pedido: "🛒 NUEVO PEDIDO",
  pago_confirmado: "✅ PAGO CONFIRMADO",
  pago_rechazado: "❌ PAGO RECHAZADO",
  pago_cancelado: "⚠️ PAGO CANCELADO",
};

const FORMA_PAGO_LABEL: Record<string, string> = {
  yape_plin: "Yape / Plin",
  transferencia: "Transferencia bancaria",
  tarjeta: "Tarjeta (Mercado Pago)",
  contra_entrega: "Contra entrega",
};

const ESTADO_PAGO_LABEL: Record<string, string> = {
  pagado: "✅ Pagado",
  pendiente_verificacion: "⏳ Pendiente de verificación",
  rechazado: "❌ Rechazado",
  cancelado: "⚠️ Cancelado",
};

const METODO_ENVIO_LABEL: Record<string, string> = {
  motorizado: "Motorizado a domicilio",
  agencia: "Agencia (recojo en Shalom)",
  shalom: "Agencia Shalom",
};

interface ProductoPedido {
  sku?: string | null;
  nombre?: string | null;
  precio?: number | null;
  cantidad?: number | null;
  categoria?: string | null;
}

interface BandanaPedido {
  slug?: string | null;
  talla?: string | null;
}

interface DireccionEnvio {
  direccion?: string | null;
  direccionSecundaria?: string | null;
  distrito?: string | null;
  provincia?: string | null;
  departamento?: string | null;
  codigoPostal?: string | null;
  metodoEnvio?: string | null;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  lat?: number | null;
  lng?: number | null;
}

const CAMPOS_PEDIDO = `
  shopify_order_number, created_at, cliente_nombre, cliente_email, cliente_telefono,
  forma_pago, estado_pago, estado_preparacion, captura_pago_url, productos,
  direccion_envio, zona_envio, courier, courier_otro, subtotal, descuento_monto,
  codigo_descuento, total, regalo_bandanas, codigo_rotulo
`;

function soles(monto: number): string {
  return `S/ ${monto.toFixed(2)}`;
}

function aNumero(valor: unknown): number {
  const numero = typeof valor === "string" ? Number.parseFloat(valor) : Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

/**
 * Nombres de bandana desde `regalo_variantes`. El slug guardado en el pedido
 * ("sandia-s") ya lleva la talla pegada, así que derivarlo del slug daría
 * "Sandia s (talla S)" — se busca el nombre real del catálogo y solo se cae al
 * slug si la variante fue borrada. Sin filtro de `activo`: un diseño
 * descontinuado igual tiene que mostrarse en pedidos viejos.
 */
async function nombresBandanas(
  supabase: SupabaseClient,
  bandanas: BandanaPedido[]
): Promise<string[]> {
  const slugs = bandanas.map((b) => b.slug).filter((slug): slug is string => Boolean(slug));
  if (slugs.length === 0) return [];

  const { data } = await supabase.from("regalo_variantes").select("slug, nombre").in("slug", slugs);
  const porSlug = new Map((data ?? []).map((v) => [v.slug as string, v.nombre as string]));

  return bandanas.map((bandana) => {
    const nombre = porSlug.get(bandana.slug ?? "") ?? bandana.slug ?? "Bandana";
    return bandana.talla ? `${nombre} (talla ${bandana.talla})` : nombre;
  });
}

function bloqueCliente(pedido: Record<string, unknown>, direccion: DireccionEnvio): string {
  const lineas = [
    `<b>👤 CLIENTE</b>`,
    escaparHtml(String(pedido.cliente_nombre ?? "Sin nombre")),
    `✉️ ${escaparHtml(String(pedido.cliente_email ?? "—"))}`,
  ];

  const telefono = pedido.cliente_telefono ? String(pedido.cliente_telefono) : null;
  if (telefono) {
    // wa.me quiere el número sin espacios ni símbolos; Perú va con prefijo 51.
    const soloDigitos = telefono.replace(/\D/g, "");
    const numeroWa = soloDigitos.length === 9 ? `51${soloDigitos}` : soloDigitos;
    lineas.push(`📱 ${escaparHtml(telefono)} — <a href="https://wa.me/${numeroWa}">WhatsApp</a>`);
  }

  if (direccion.numeroDocumento) {
    const tipo = (direccion.tipoDocumento ?? "doc").toUpperCase();
    lineas.push(`🪪 ${escaparHtml(tipo)} ${escaparHtml(direccion.numeroDocumento)}`);
  }

  return lineas.join("\n");
}

function bloqueProductos(productos: ProductoPedido[], bandanas: string[]): string {
  const lineas = [`<b>📦 PRODUCTOS</b>`];

  for (const producto of productos) {
    const cantidad = aNumero(producto.cantidad) || 1;
    const precio = aNumero(producto.precio);
    const nombre = escaparHtml(producto.nombre ?? producto.sku ?? "Producto");
    lineas.push(`• ${cantidad}× ${nombre} — ${soles(precio * cantidad)}`);
  }
  if (productos.length === 0) lineas.push("• (sin detalle de productos)");

  if (bandanas.length > 0) {
    lineas.push(`🎁 Bandanas: ${escaparHtml(bandanas.join(", "))}`);
  }

  return lineas.join("\n");
}

function bloqueEntrega(
  direccion: DireccionEnvio,
  zonaEnvio: string | null,
  courier: string | null
): string {
  const lineas = [`<b>🚚 ENTREGA</b>`];

  lineas.push(escaparHtml(direccion.direccion ?? "Sin dirección registrada"));
  if (direccion.direccionSecundaria?.trim()) {
    lineas.push(`Int./Ref.: ${escaparHtml(direccion.direccionSecundaria.trim())}`);
  }

  const ubicacion = [direccion.distrito, direccion.provincia, direccion.departamento]
    .filter(Boolean)
    .join(", ");
  if (ubicacion) lineas.push(escaparHtml(ubicacion));

  const metodo = direccion.metodoEnvio
    ? METODO_ENVIO_LABEL[direccion.metodoEnvio] ?? direccion.metodoEnvio
    : null;
  const detalleEnvio = [metodo, zonaEnvio ? `zona ${zonaEnvio}` : null].filter(Boolean).join(" · ");
  if (detalleEnvio) lineas.push(escaparHtml(detalleEnvio));

  if (courier) lineas.push(`Courier: ${escaparHtml(courier)}`);

  if (typeof direccion.lat === "number" && typeof direccion.lng === "number") {
    lineas.push(
      `📍 <a href="https://www.google.com/maps?q=${direccion.lat},${direccion.lng}">Ver ubicación en Maps</a>`
    );
  }

  return lineas.join("\n");
}

function bloqueTotales(pedido: Record<string, unknown>): string {
  const subtotal = aNumero(pedido.subtotal);
  const descuento = aNumero(pedido.descuento_monto);
  const total = aNumero(pedido.total);
  // El costo de envío no se guarda en su propia columna: se deriva de lo que
  // sobra del total una vez descontados productos y promoción.
  const envio = Math.max(0, Number((total - subtotal + descuento).toFixed(2)));

  const lineas = [`<b>💰 TOTALES</b>`, `Subtotal: ${soles(subtotal)}`];

  if (descuento > 0) {
    const codigo = pedido.codigo_descuento ? ` (${escaparHtml(String(pedido.codigo_descuento))})` : "";
    lineas.push(`Descuento${codigo}: −${soles(descuento)}`);
  }
  lineas.push(`Envío: ${envio > 0 ? soles(envio) : "Gratis"}`);
  lineas.push(`<b>TOTAL: ${soles(total)}</b>`);

  return lineas.join("\n");
}

function bloquePago(pedido: Record<string, unknown>): string {
  const formaPago = String(pedido.forma_pago ?? "");
  const estadoPago = String(pedido.estado_pago ?? "");

  const lineas = [
    `<b>💳 PAGO</b>`,
    `Método: ${escaparHtml(FORMA_PAGO_LABEL[formaPago] ?? formaPago ?? "—")}`,
    `Estado: ${ESTADO_PAGO_LABEL[estadoPago] ?? escaparHtml(estadoPago || "—")}`,
  ];

  if (pedido.captura_pago_url) {
    lineas.push(`🧾 <a href="${escaparHtml(String(pedido.captura_pago_url))}">Ver comprobante</a>`);
  }
  if (pedido.codigo_rotulo) {
    lineas.push(`🏷️ Rótulo: ${escaparHtml(String(pedido.codigo_rotulo))}`);
  }

  return lineas.join("\n");
}

function fechaLima(valor: unknown): string {
  const fecha = valor ? new Date(String(valor)) : new Date();
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(fecha);
}

/**
 * Aviso de Telegram con el detalle completo de un pedido.
 *
 * Best-effort por diseño: si Telegram no está configurado o falla, devuelve el
 * error para que quien llama lo loguee, pero nunca lanza — el pedido ya está
 * registrado y el cliente ya recibió su correo.
 */
export async function notificarPedidoTelegram(
  evento: EventoPedidoTelegram,
  pedidoId: string
): Promise<{ error: string | null }> {
  if (!telegramConfigurado()) {
    return { error: null }; // sin configurar: silencioso, no es una falla.
  }

  const supabase = createAdminClient();
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select(CAMPOS_PEDIDO)
    .eq("id", pedidoId)
    .maybeSingle();

  if (error || !pedido) {
    return { error: error?.message ?? "Pedido no encontrado" };
  }

  const datos = pedido as Record<string, unknown>;
  const direccion = (datos.direccion_envio ?? {}) as DireccionEnvio;
  const productos = Array.isArray(datos.productos) ? (datos.productos as ProductoPedido[]) : [];
  const bandanas = await nombresBandanas(
    supabase,
    Array.isArray(datos.regalo_bandanas) ? (datos.regalo_bandanas as BandanaPedido[]) : []
  );
  const numeroPedido = String(datos.shopify_order_number ?? "").trim() || "sin número";
  const courier = nombreCourier(
    datos.courier as string | null,
    datos.courier_otro as string | null
  );

  const mensaje = [
    `<b>${TITULO_POR_EVENTO[evento]} — #${escaparHtml(numeroPedido)}</b>`,
    `🕐 ${escaparHtml(fechaLima(datos.created_at))}`,
    "",
    bloqueCliente(datos, direccion),
    "",
    bloquePago(datos),
    "",
    bloqueProductos(productos, bandanas),
    "",
    bloqueEntrega(direccion, datos.zona_envio as string | null, courier),
    "",
    bloqueTotales(datos),
    "",
    `🔗 <a href="${brand.siteUrl}/admin/pedidos/${pedidoId}">Abrir en el panel</a>`,
  ].join("\n");

  return enviarMensajeTelegram(mensaje);
}
