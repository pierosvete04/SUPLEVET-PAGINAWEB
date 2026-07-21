import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

// Bloquea a las cuentas de rol restringido (ej. "oportunidad_negocio", pensadas
// para personal externo) fuera de su única sección permitida, aunque escriban
// otra URL de /admin/* a mano. El resto de admins (rol admin/superadmin) no se
// ve afectado por este middleware.
const RUTAS_POR_ROL: Record<string, string> = {
  oportunidad_negocio: "/admin/oportunidad",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return response;

  const { data: admin } = await supabase
    .from("admins")
    .select("rol, activo")
    .eq("id", user.id)
    .maybeSingle();

  const rutaPermitida = admin?.activo ? RUTAS_POR_ROL[admin.rol ?? ""] : undefined;
  if (rutaPermitida && pathname !== rutaPermitida) {
    return NextResponse.redirect(new URL(rutaPermitida, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
