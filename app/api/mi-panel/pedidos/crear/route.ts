import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  esItemValido,
  guardarPerfil,
  normalizarBandanas,
  normalizarDireccion,
  resolverClienteId,
  texto,
  type ItemBody,
} from "@/lib/pedidos/manual-pedido";

// Pedido creado a mano por un editor (venta cerrada por WhatsApp/DM a partir
// de su cupón). A diferencia de /api/admin/pedidos/crear, acá SÍ hace falta
// el RPC registrar_pedido_web: un editor no tiene permiso de INSERT directo
// en `pedidos` para cualquier cupón (RLS lo limita a los suyos — ver
// es_cupon_de_editor()), y el RPC es quien calcula el descuento real.
//
// El guard de abajo no es opcional: registrar_pedido_web es SECURITY DEFINER
// y no valida por sí solo que el código pertenezca a quien llama — si no se
// verificara acá, cualquier editor podría facturar con el cupón de otro.
const FORMAS_PAGO_VALIDAS = ["tarjeta", "yape_plin", "transferencia"] as const;
const ZONAS_ENVIO_VALIDAS = ["lima", "costa_sierra", "selva"] as const;

interface RpcResultado {
  ok: boolean;
  error?: string;
  pedido_id?: string;
  numero?: string;
  total?: number;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: admin } = await supabase.from("admins").select("rol, activo").eq("id", user.id).maybeSingle();
  if (!admin?.activo || admin.rol !== "editor") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  // El cupón es OPCIONAL: el editor puede armar una venta sin aplicarle
  // descuento al cliente (ej. ya viene con el precio acordado por otro
  // lado). Eso sí — si manda uno, tiene que ser suyo. Ojo con la
  // implicación: sin cupón, el pedido no queda atribuido a este editor en
  // ningún lado del panel (Historial/Analíticas se filtran por cupón), pero
  // el pedido igual se crea.
  const codigoCupon = texto(body.codigo_cupon)?.toUpperCase() ?? null;
  if (codigoCupon) {
    const { data: cuponPropio } = await supabase
      .from("cupones")
      .select("id")
      .eq("editor_id", user.id)
      .eq("codigo", codigoCupon)
      .maybeSingle();
    if (!cuponPropio) {
      return NextResponse.json({ error: "Ese cupón no es tuyo." }, { status: 403 });
    }
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
  const formaPago = FORMAS_PAGO_VALIDAS.includes(body.forma_pago) ? body.forma_pago : "yape_plin";

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

  const { data: resultado, error } = await supabase.rpc("registrar_pedido_web", {
    p_cliente_id: clienteResuelto.id,
    p_productos: productos,
    p_subtotal: subtotal,
    p_costo_envio: costoEnvio,
    p_forma_pago: formaPago,
    p_codigo_descuento: codigoCupon,
    p_zona_envio: zonaEnvio,
    p_direccion_envio: direccionEnvio,
    p_cliente_nombre: clienteNombre,
    p_cliente_telefono: clienteTelefono,
    p_regalo_bandana: null,
    p_regalo_bandanas: bandanas.length > 0 ? bandanas : null,
    // Sin esto, un pedido creado sin cupón (codigoCupon opcional) queda sin
    // ninguna forma de que el propio editor lo vuelva a leer — ni RLS por
    // cupón ni por cliente_id (no es su cuenta) se lo permiten.
    p_creado_por: user.id,
  });

  const rpc = resultado as RpcResultado | null;
  if (error || !rpc?.ok) {
    return NextResponse.json({ error: rpc?.error ?? error?.message ?? "No se pudo crear el pedido" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, pedido_id: rpc.pedido_id, numero_pedido: rpc.numero });
}
