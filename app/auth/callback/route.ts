import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { asegurarClienteInicializado } from "@/lib/data/portal/cliente";

// Callback de OAuth (Google) para el login del portal de clientes — Supabase
// redirige acá con ?code= tras el login en Google, y acá se intercambia por
// una sesión real (cookies) para que el resto de la app (Server Components
// incluidos) reconozca al usuario, igual que el flujo de OTP.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/mi-cuenta";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const { esNuevo } = await asegurarClienteInicializado(supabase, data.user);
      const destino = esNuevo ? "/mi-cuenta/bienvenida" : next;
      return NextResponse.redirect(`${origin}${destino}`);
    }
  }

  return NextResponse.redirect(`${origin}/mi-cuenta/login?error=oauth`);
}
