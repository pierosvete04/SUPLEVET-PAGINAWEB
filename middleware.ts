import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

// Bloquea a las cuentas de rol restringido (ej. "oportunidad_negocio", pensadas
// para personal externo) fuera de su sección permitida (y sus subrutas, ej.
// /admin/oportunidad/postulaciones), aunque escriban otra URL de /admin/* a
// mano. El resto de admins (rol admin/superadmin) no se ve afectado.
const PREFIJO_POR_ROL: Record<string, string> = {
  oportunidad_negocio: "/admin/oportunidad",
  editor: "/admin/mi-panel",
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

  // getClaims() en vez de getUser(): verifica la firma del JWT acá mismo con la
  // clave pública del proyecto (ES256) en lugar de preguntarle al servidor de
  // Auth. Este middleware corre en CADA request de /admin — incluidas las
  // navegaciones entre pestañas — y cada viaje a Supabase (us-west-2) cuesta
  // 400-650 ms desde el origen, así que era medio segundo antes de que la
  // página empezara siquiera a cargar sus datos.
  //
  // Sigue renovando la sesión: getClaims() llama por dentro a getSession(), que
  // refresca el token si venció y dispara el setAll de cookies de acá arriba.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) return response;

  // El rol viaja dentro del token (app_metadata.rol_admin), sincronizado por el
  // trigger `trg_sincronizar_rol_admin_en_jwt`. Leerlo de acá evita la segunda
  // consulta a Supabase que este middleware hacía en cada request.
  const appMetadata = claims.app_metadata as { rol_admin?: string | null } | undefined;
  let rol = appMetadata?.rol_admin;

  // `undefined` significa que el token es anterior a esa migración (o que quien
  // entra no es admin). Ahí sí se consulta la tabla, para no dejar sin
  // restricción a una sesión vieja que todavía no renovó su token.
  if (rol === undefined) {
    const { data: admin } = await supabase
      .from("admins")
      .select("rol, activo")
      .eq("id", claims.sub)
      .maybeSingle();
    rol = admin?.activo ? admin.rol : null;
  }

  // OJO con el desfase: si a alguien se le cambia el rol, su token sigue
  // trayendo el anterior hasta que venza (1 h). Eso solo afecta a la navegación
  // del panel, no al acceso a los datos: las políticas RLS se apoyan en
  // is_admin(), que lee la tabla `admins` en vivo, y el layout vuelve a
  // comprobar el rol contra la base en cada carga completa.
  const prefijoPermitido = rol ? PREFIJO_POR_ROL[rol] : undefined;
  if (prefijoPermitido && pathname !== prefijoPermitido && !pathname.startsWith(`${prefijoPermitido}/`)) {
    return NextResponse.redirect(new URL(prefijoPermitido, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
