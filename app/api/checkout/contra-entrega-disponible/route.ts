import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ¿Se puede ofrecer pago contra entrega en este momento?
//
// Esto solo decide qué se MUESTRA en el checkout. La regla en sí vive en la
// función `contra_entrega_disponible()` de Postgres, que es también la que
// aplica `registrar_pedido_web` antes de insertar el pedido — así la UI y la
// validación real no se pueden desincronizar. Ver el comentario de la
// migración `validar_contra_entrega_en_registrar_pedido_web` para el porqué
// del mínimo de 2 paquetes de Dinsides.
//
// Se usa el service role solo para invocarla (la RLS de `pedidos` no deja al
// cliente ver pedidos ajenos) — la respuesta es un booleano sin ningún dato
// de otros clientes.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("contra_entrega_disponible");

    if (error) throw error;

    return NextResponse.json({ disponible: data === true });
  } catch (error: unknown) {
    console.error("Error consultando disponibilidad de contra entrega:", error);
    // Fail-closed: si no se puede verificar, mejor no ofrecer contra entrega
    // (ofrecerla sin recojo de Dinsides le cuesta plata al negocio).
    return NextResponse.json({ disponible: false });
  }
}
