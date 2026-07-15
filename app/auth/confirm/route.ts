import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { asegurarClienteInicializado } from "@/lib/data/portal/cliente";
import { createClient } from "@/lib/supabase/server";

// Confirma los enlaces de recuperación de contraseña y cambio de correo que
// arma el Edge Function send-auth-email (?token_hash=&type=), a diferencia
// de app/auth/callback/route.ts que maneja el ?code= de OAuth/PKCE.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/mi-cuenta";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error && data.user) {
      const { esNuevo } = await asegurarClienteInicializado(supabase, data.user);
      const destino = esNuevo ? "/mi-cuenta/bienvenida" : next;
      return NextResponse.redirect(`${origin}${destino}`);
    }
  }

  return NextResponse.redirect(`${origin}/mi-cuenta/login?error=confirm`);
}
