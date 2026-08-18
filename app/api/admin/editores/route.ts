import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Crea la cuenta de un editor de un solo paso: usuario de Supabase Auth +
// fila en `admins` (rol "editor") + fila en `editores`. Los cupones se le
// asignan después, por separado, desde /admin/editores/[id] — un editor
// puede tener varios a lo largo del tiempo (ver migración panel_editores_*).
//
// Va con Service Role porque `admins` no tiene política de INSERT para
// sesiones normales (las cuentas admin siempre se crearon a mano) — por eso
// el guard de abajo verifica el rol a mano en vez de dejárselo a RLS.
// El DNI se pide para dejar identidad real del editor (se consulta contra
// RENIEC vía Decolecta en el formulario — ver /api/documento/consultar), no
// solo un nombre tipeado a mano.
const bodySchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  dni: z.string().trim().regex(/^\d{8}$/, "El DNI debe tener 8 dígitos"),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
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
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { nombre, dni, email, password } = parsed.data;

  const adminClient = createAdminClient();

  const { data: dniEnUso } = await adminClient.from("editores").select("id").eq("dni", dni).maybeSingle();
  if (dniEnUso) {
    return NextResponse.json({ error: "Ya existe un editor registrado con ese DNI." }, { status: 409 });
  }

  const { data: creado, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, dni, rol: "editor" },
  });
  if (authError || !creado.user) {
    const yaExiste = authError?.code === "email_exists";
    return NextResponse.json(
      { error: yaExiste ? "Ya existe una cuenta con ese correo." : (authError?.message ?? "No se pudo crear la cuenta") },
      { status: yaExiste ? 409 : 500 }
    );
  }

  const editorId = creado.user.id;

  const { error: adminRowError } = await adminClient.from("admins").insert({
    id: editorId,
    nombre,
    usuario: email,
    // La columna es legado (NOT NULL) de un sistema previo que guardaba la
    // contraseña en texto plano — el login real es 100% Supabase Auth (ver
    // app/admin/login/page.tsx), así que acá no se guarda ningún secreto.
    contrasena: "(cuenta gestionada por Supabase Auth)",
    rol: "editor",
    activo: true,
  });

  const { error: editorRowError } = adminRowError
    ? { error: null as null }
    : await adminClient.from("editores").insert({ id: editorId, dni });

  if (adminRowError || editorRowError) {
    // Sin esto quedaría un usuario de Auth huérfano, sin fila en admins/editores,
    // que no podría iniciar sesión pero tampoco se vería en ningún listado.
    await adminClient.auth.admin.deleteUser(editorId);
    return NextResponse.json(
      { error: (adminRowError ?? editorRowError)?.message ?? "No se pudo crear el editor" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: editorId });
}
