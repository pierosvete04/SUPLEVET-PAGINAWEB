import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Activar/desactivar un editor y/o resetearle la contraseña. Va con Service
// Role por lo mismo que la creación: `admins` solo tiene política de UPDATE
// para la propia fila (admin_update -> id = auth.uid()), así que un admin no
// puede tocar la fila de otro admin/editor desde el cliente — y el cambio de
// contraseña usa la API de Auth, que ya es 100% Service Role.
//
// El editor nunca puede cambiar su propia contraseña por su cuenta: no hay
// "olvidé mi contraseña" en /admin/login (ver app/admin/login/page.tsx) — el
// único camino es que un admin se la resetee acá.
const bodySchema = z.object({
  activo: z.boolean().optional(),
  password: z.string().min(8).max(72).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("rol, activo")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin?.activo || !["admin", "superadmin"].includes(admin.rol ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success || (parsed.data.activo === undefined && parsed.data.password === undefined)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Confirma que el id es realmente un editor ANTES de tocar nada — evita que
  // este endpoint se use para resetear la contraseña de un admin/superadmin.
  const { data: esEditor } = await adminClient.from("editores").select("id").eq("id", id).maybeSingle();
  if (!esEditor) {
    return NextResponse.json({ error: "Editor no encontrado" }, { status: 404 });
  }

  if (parsed.data.password !== undefined) {
    const { error: passwordError } = await adminClient.auth.admin.updateUserById(id, {
      password: parsed.data.password,
    });
    if (passwordError) {
      return NextResponse.json({ error: passwordError.message }, { status: 500 });
    }
  }

  if (parsed.data.activo !== undefined) {
    const { error } = await adminClient
      .from("admins")
      .update({ activo: parsed.data.activo })
      .eq("id", id)
      .eq("rol", "editor");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
