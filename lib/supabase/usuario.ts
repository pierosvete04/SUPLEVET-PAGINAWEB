import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface UsuarioSesion {
  id: string;
  email: string | null;
}

// Identidad del visitante autenticado, verificando la FIRMA del token en el
// propio servidor en vez de preguntándole al servidor de Auth.
//
// Por qué existe: `supabase.auth.getUser()` es una llamada de RED a Supabase
// (us-west-2). Medido desde el origen de producción, cada viaje a Supabase
// cuesta entre 400 y 650 ms — y el portal la hacía en las 14 páginas, siempre
// como PRIMER paso, así que todo lo demás esperaba detrás.
//
// `getClaims()` valida el JWT con la clave pública del proyecto (ES256) y no
// sale a la red: el JWKS se descarga una vez y auth-js lo guarda en un caché
// global del proceso (GLOBAL_JWKS, 10 min de TTL), de modo que crear un cliente
// nuevo por request lo sigue reutilizando. Verificado sobre la versión instalada
// antes de escribir esto — si algún día el proyecto volviera a firmar con el
// secreto HS256 simétrico, getClaims haría fallback a red y esta optimización
// dejaría de rendir en silencio.
//
// LA CONTRAPARTIDA, que es una decisión tomada a conciencia: al no consultar al
// servidor de Auth, una sesión revocada a mano sigue siendo válida hasta que su
// token expire (1 hora). Para un portal de puntos y mascotas se aceptó ese
// riesgo a cambio de ~500 ms en cada pestaña. Si algún día se maneja algo más
// sensible acá, esto se revierte a getUser().
//
// `cache()` de React deduplica por request: el layout y la página se renderizan
// a la vez y ambos necesitan el usuario, pero la verificación ocurre una sola vez.
export const getUsuarioSesion = cache(async (): Promise<UsuarioSesion | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const sub = data?.claims?.sub;
  if (error || !sub) return null;

  const email = data?.claims?.email;
  return { id: sub, email: typeof email === "string" ? email : null };
});
