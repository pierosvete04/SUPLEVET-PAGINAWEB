import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Compartido entre /api/admin/pedidos/crear y /api/mi-panel/pedidos/crear —
// ambos son "alguien del equipo arma un pedido a nombre de un cliente",
// solo cambia quién puede hacerlo y si aplica un cupón propio.

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface ItemBody {
  nombre: string;
  precio: number;
  cantidad: number;
  sku?: string;
  categoria?: string;
}

/** Mismo jsonb que guarda el checkout en pedidos.direccion_envio. */
export interface DireccionEnvioBody {
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

export interface BandanaBody {
  slug: string;
  talla: string | null;
}

export function esItemValido(item: unknown): item is ItemBody {
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

export function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function coordenada(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

export function normalizarDireccion(valor: unknown): DireccionEnvioBody | null {
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

export function normalizarBandanas(valor: unknown): BandanaBody[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((b) => {
    if (typeof b !== "object" || b === null) return [];
    const slug = texto((b as Record<string, unknown>).slug);
    if (!slug) return [];
    return [{ slug, talla: texto((b as Record<string, unknown>).talla) }];
  });
}

// El cliente elegido por búsqueda ya trae `cliente_id`. Cuando se arma uno
// nuevo desde el formulario ("+ Crear cliente nuevo") no queda como invitado:
// se le crea una cuenta real (sin password, sin OTP) para que `cliente_id`
// quede bien enlazado y sus SuplePoints/pedidos futuros caigan en la misma
// cuenta. El cliente entra cuando quiera con el login normal del sitio
// (código de 6 dígitos por correo) — no hace falta mandarle nada desde acá.
export async function resolverClienteId(
  supabase: SupabaseServerClient,
  params: { clienteId: string | null; email: string; nombre: string; apellido: string }
): Promise<{ id: string } | { error: string }> {
  if (params.clienteId) return { id: params.clienteId };

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

// Los datos que llegaron por interno se guardan también en el perfil del
// portal, igual que hace el checkout al confirmar: así la próxima compra (o
// su visita a /mi-cuenta/perfil) ya los trae cargados.
export async function guardarPerfil(
  supabase: SupabaseServerClient,
  clienteId: string,
  datos: { nombre: string; apellido: string; telefono: string | null; direccion: DireccionEnvioBody | null }
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
      perfil_completo: Boolean(datos.telefono && d?.direccion && d?.distrito && d?.departamento),
    })
    .eq("id", clienteId);

  // El perfil es un extra: si falla, el pedido igual tiene todos los datos en
  // direccion_envio, que es de donde salen el rótulo y el courier.
  if (error) {
    console.error("No se pudo actualizar el perfil del cliente del pedido manual:", error);
  }
}
