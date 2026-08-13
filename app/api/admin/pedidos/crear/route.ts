import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarPedidoTelegram } from "@/lib/notificaciones/pedido-telegram";

// Pedido creado a mano desde /admin/pedidos/nuevo (venta telefónica, WhatsApp,
// etc). El INSERT directo en `pedidos` ya está permitido por RLS para
// cualquier sesión admin ("Solo admin inserta pedidos" -> is_admin()), así
// que no hace falta el RPC registrar_pedido_web (ese es SECURITY DEFINER
// solo porque el cliente final no tiene permiso de INSERT).
const FORMAS_PAGO_VALIDAS = ["tarjeta", "yape_plin", "transferencia", "contra_entrega"] as const;
const ESTADOS_PAGO_VALIDOS = ["pendiente_verificacion", "pagado"] as const;
const ZONAS_ENVIO_VALIDAS = ["lima", "costa_sierra", "selva"] as const;

// Yape/Plin y transferencia no tienen procesador que confirme el pago solo
// (a diferencia de tarjeta vía Mercado Pago) — si el admin ya lo marca como
// "pagado" al crear el pedido, el comprobante es la única evidencia de que
// realmente se cobró, así que se exige antes de guardar.
const FORMAS_QUE_EXIGEN_COMPROBANTE = ["yape_plin", "transferencia"] as const;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface ItemBody {
  nombre: string;
  precio: number;
  cantidad: number;
  sku?: string;
  categoria?: string;
}

/** Mismo jsonb que guarda el checkout en pedidos.direccion_envio. */
interface DireccionEnvioBody {
  direccion: string | null;
  direccionSecundaria: string | null;
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  codigoPostal: string | null;
  metodoEnvio: string | null;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  lat: number | null;
  lng: number | null;
}

interface BandanaBody {
  slug: string;
  talla: string | null;
}

function esItemValido(item: unknown): item is ItemBody {
  if (typeof item !== "object" || item === null) return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i.nombre === "string" &&
    i.nombre.trim().length > 0 &&
    typeof i.precio === "number" &&
    i.precio >= 0 &&
    typeof i.cantidad === "number" &&
    Number.isInteger(i.cantidad) &&
    i.cantidad >= 1
  );
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function coordenada(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

// El formulario del panel es el mismo componente del checkout (ShippingStep),
// así que llega el objeto completo: dirección + ubigeo + documento + las
// coordenadas de Google, que son lo que el equipo le pasa al courier.
function normalizarDireccion(valor: unknown): DireccionEnvioBody | null {
  if (typeof valor !== "object" || valor === null) return null;
  const d = valor as Record<string, unknown>;
  const direccion: DireccionEnvioBody = {
    direccion: texto(d.direccion),
    direccionSecundaria: texto(d.direccionSecundaria),
    distrito: texto(d.distrito),
    provincia: texto(d.provincia),
    departamento: texto(d.departamento),
    codigoPostal: texto(d.codigoPostal),
    metodoEnvio: texto(d.metodoEnvio),
    tipoDocumento: texto(d.tipoDocumento),
    numeroDocumento: texto(d.numeroDocumento),
    lat: coordenada(d.lat),
    lng: coordenada(d.lng),
  };
  const tieneAlgo = Object.values(direccion).some((v) => v !== null);
  return tieneAlgo ? direccion : null;
}

function normalizarBandanas(valor: unknown): BandanaBody[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((b) => {
    if (typeof b !== "object" || b === null) return [];
    const slug = texto((b as Record<string, unknown>).slug);
    if (!slug) return [];
    return [{ slug, talla: texto((b as Record<string, unknown>).talla) }];
  });
}

// El cliente elegido por búsqueda ya trae `cliente_id`. Cuando el admin arma
// uno nuevo desde el formulario ("+ Crear cliente nuevo") no queda como
// invitado: se le crea una cuenta real (sin password, sin OTP) para que
// `cliente_id` quede bien enlazado y sus SuplePoints/pedidos futuros caigan
// en la misma cuenta. El cliente entra cuando quiera con el login normal del
// sitio (código de 6 dígitos por correo, ver LoginPanel) — no hace falta
// mandarle nada desde acá.
async function resolverClienteId(
  supabase: SupabaseServerClient,
  params: { clienteId: string | null; email: string; nombre: string; apellido: string }
): Promise<{ id: string } | { error: string }> {
  if (params.clienteId) return { id: params.clienteId };

  // Red de seguridad por si el admin tipeó el correo de alguien que ya tiene
  // cuenta sin pasar por el buscador — evita crear una cuenta duplicada.
  const { data: existente } = await supabase
    .from("admin_clientes_resumen")
    .select("id")
    .ilike("email", params.email)
    .maybeSingle();
  if (existente) return { id: existente.id };

  const admin = createAdminClient();
  const { data: creado, error: createError } = await admin.auth.admin.createUser({
    email: params.email,
    email_confirm: true,
    user_metadata: { nombre: params.nombre, apellido: params.apellido },
  });

  if (createError || !creado.user) {
    // Condición de carrera: alguien creó la cuenta entre el select y el
    // createUser. Se reintenta la búsqueda antes de reportar error.
    const { data: reintento } = await supabase
      .from("admin_clientes_resumen")
      .select("id")
      .ilike("email", params.email)
      .maybeSingle();
    if (reintento) return { id: reintento.id };
    return { error: createError?.message ?? "No se pudo crear la cuenta del cliente" };
  }

  return { id: creado.user.id };
}

// Los datos que el cliente mandó por interno se guardan también en su perfil
// del portal, igual que hace el checkout al confirmar: así su próxima compra
// (o su visita a /mi-cuenta/perfil) ya los trae cargados y no se los volvemos
// a pedir. El trigger on_auth_user_created ya dejó la fila creada.
async function guardarPerfil(
  supabase: SupabaseServerClient,
  clienteId: string,
  datos: {
    nombre: string;
    apellido: string;
    telefono: string | null;
    direccion: DireccionEnvioBody | null;
  }
) {
  const d = datos.direccion;
  const { error } = await supabase
    .from("clientes_perfil")
    .update({
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono,
      direccion: d?.direccion ?? null,
      distrito: d?.distrito ?? null,
      provincia: d?.provincia ?? null,
      ciudad: d?.departamento ?? null,
      codigo_postal: d?.codigoPostal ?? null,
      lat: d?.lat ?? null,
      lng: d?.lng ?? null,
      tipo_documento: d?.numeroDocumento ? d.tipoDocumento : null,
      numero_documento: d?.numeroDocumento ?? null,
      perfil_completo: Boolean(
        datos.telefono && d?.direccion && d?.distrito && d?.departamento
      ),
    })
    .eq("id", clienteId);

  // El perfil es un extra: si falla, el pedido igual tiene todos los datos en
  // direccion_envio, que es de donde salen el rótulo y el courier.
  if (error) {
    console.error("No se pudo actualizar el perfil del cliente del pedido manual:", error);
  }
}

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
