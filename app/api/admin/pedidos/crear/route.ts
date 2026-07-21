import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { zonaEnvioSlug } from "@/lib/shipping";

// Pedido creado a mano desde /admin/pedidos/nuevo (venta telefónica, WhatsApp,
// etc). El INSERT directo en `pedidos` ya está permitido por RLS para
// cualquier sesión admin ("Solo admin inserta pedidos" -> is_admin()), así
// que no hace falta el RPC registrar_pedido_web (ese es SECURITY DEFINER
// solo porque el cliente final no tiene permiso de INSERT).
const FORMAS_PAGO_VALIDAS = ["tarjeta", "yape_plin", "transferencia", "contra_entrega"] as const;
const ESTADOS_PAGO_VALIDOS = ["pendiente_verificacion", "pagado"] as const;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface ItemBody {
  nombre: string;
  precio: number;
  cantidad: number;
  sku?: string;
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

// El cliente elegido por búsqueda ya trae `cliente_id`. Cuando el admin arma
// uno nuevo desde el formulario ("+ Crear cliente nuevo") no queda como
// invitado: se le crea una cuenta real (sin password, sin OTP) para que
// `cliente_id` quede bien enlazado y sus SuplePoints/pedidos futuros caigan
// en la misma cuenta. El cliente entra cuando quiera con el login normal del
// sitio (código de 6 dígitos por correo, ver LoginPanel) — no hace falta
// mandarle nada desde acá.
async function resolverClienteId(
  supabase: SupabaseServerClient,
  params: {
    clienteId: string | null;
    email: string;
    nombre: string;
    apellido: string;
    telefono: string | null;
    departamento: string | null;
    distrito: string | null;
    direccion: string | null;
  }
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

  // El trigger on_auth_user_created ya insertó la fila vacía en
  // clientes_perfil (ver [[project-suplevet-shared-supabase]]) — acá solo se
  // completa con los datos que el admin ya tiene a mano.
  await supabase
    .from("clientes_perfil")
    .update({
      nombre: params.nombre,
      apellido: params.apellido,
      telefono: params.telefono,
      direccion: params.direccion,
      distrito: params.distrito,
      ciudad: params.departamento,
      perfil_completo: Boolean(
        params.telefono && params.direccion && params.distrito && params.departamento
      ),
    })
    .eq("id", creado.user.id);

  return { id: creado.user.id };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const clienteEmail = typeof body.cliente_email === "string" ? body.cliente_email.trim() : "";
  const clienteNombre = typeof body.cliente_nombre === "string" ? body.cliente_nombre.trim() : "";
  const clienteApellido = typeof body.cliente_apellido === "string" ? body.cliente_apellido.trim() : "";
  const clienteTelefono = typeof body.cliente_telefono === "string" && body.cliente_telefono.trim() ? body.cliente_telefono.trim() : null;
  const clienteId = typeof body.cliente_id === "string" ? body.cliente_id : null;
  const productos = Array.isArray(body.productos) ? body.productos : [];
  const costoEnvio = typeof body.costo_envio === "number" && body.costo_envio >= 0 ? body.costo_envio : 0;
  const departamento = typeof body.departamento === "string" && body.departamento.trim() ? body.departamento.trim() : null;
  const distrito = typeof body.distrito === "string" && body.distrito.trim() ? body.distrito.trim() : null;
  const direccion = typeof body.direccion === "string" && body.direccion.trim() ? body.direccion.trim() : null;
  const formaPago = FORMAS_PAGO_VALIDAS.includes(body.forma_pago) ? body.forma_pago : null;
  const estadoPago = ESTADOS_PAGO_VALIDOS.includes(body.estado_pago) ? body.estado_pago : "pendiente_verificacion";

  if (!clienteEmail || !/^\S+@\S+\.\S+$/.test(clienteEmail)) {
    return NextResponse.json({ error: "Email de cliente inválido" }, { status: 400 });
  }
  if (!clienteNombre) {
    return NextResponse.json({ error: "Nombre de cliente requerido" }, { status: 400 });
  }
  if (productos.length === 0 || !productos.every(esItemValido)) {
    return NextResponse.json({ error: "Agrega al menos un producto válido" }, { status: 400 });
  }

  const subtotal = productos.reduce((acc: number, i: ItemBody) => acc + i.precio * i.cantidad, 0);
  const total = subtotal + costoEnvio;

  const supabase = await createClient();
  const clienteResuelto = await resolverClienteId(supabase, {
    clienteId,
    email: clienteEmail,
    nombre: clienteNombre,
    apellido: clienteApellido,
    telefono: clienteTelefono,
    departamento,
    distrito,
    direccion,
  });
  if ("error" in clienteResuelto) {
    return NextResponse.json({ error: clienteResuelto.error }, { status: 500 });
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
      zona_envio: departamento ? zonaEnvioSlug(departamento) : null,
      direccion_envio: departamento || distrito || direccion ? { departamento, distrito, direccion } : null,
    })
    .select("id")
    .single();

  if (error || !pedido) {
    return NextResponse.json(
      { error: error?.message ?? "No se pudo crear el pedido" },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true, pedido_id: pedido.id });
}
