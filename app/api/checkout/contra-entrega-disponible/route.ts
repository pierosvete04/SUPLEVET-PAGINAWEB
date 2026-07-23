import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ¿Se puede ofrecer pago contra entrega en este momento?
//
// Dinsides solo recoge los paquetes a domicilio (gratis) cuando hay 2 o más
// pedidos en la salida; con un único pedido el delivery saldría por InDriver,
// donde no hay cobro contra entrega. Por eso la opción solo se habilita si YA
// existe al menos otro pedido motorizado pendiente de despachar: el pedido
// nuevo sería el segundo paquete del recojo.
//
// Cuenta como "pendiente de despachar" todo pedido de zona Lima (motorizado)
// que aún no fue entregado ni devuelto y cuyo pago no fue rechazado ni
// cancelado. Los pagos por verificar de Yape/transferencia sí cuentan (casi
// siempre se confirman); los de tarjeta NO — un pedido de tarjeta que sigue
// "pendiente_verificacion" suele ser un checkout abandonado en Mercado Pago
// y nunca va a salir a reparto.
//
// Se usa el service role solo para CONTAR (la RLS de `pedidos` no deja al
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
    const { count, error } = await admin
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("zona_envio", "lima")
      .in("estado_preparacion", ["no_preparado", "en_preparacion", "preparado"])
      .or("estado_pago.eq.pagado,and(estado_pago.eq.pendiente_verificacion,forma_pago.neq.tarjeta)");

    if (error) throw error;

    return NextResponse.json({ disponible: (count ?? 0) >= 1 });
  } catch (error: unknown) {
    console.error("Error consultando disponibilidad de contra entrega:", error);
    // Fail-closed: si no se puede verificar, mejor no ofrecer contra entrega
    // (ofrecerla sin recojo de Dinsides le cuesta plata al negocio).
    return NextResponse.json({ disponible: false });
  }
}
