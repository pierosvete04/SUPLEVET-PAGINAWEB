"use client";

import { useConfiguracionContext } from "@/components/layout/ConfiguracionProvider";
import type { ConfiguracionSitioCliente } from "@/lib/configuracion-cliente";

export type { ConfiguracionSitioCliente } from "@/lib/configuracion-cliente";

// Config pública editable desde /admin/configuracion.
//
// El hook mantiene la misma firma de siempre para no tocar a sus consumidores,
// pero ya NO consulta Supabase: ahora lee del contexto que llena app/layout.tsx
// con una única lectura cacheada en el servidor (ver ConfiguracionProvider).
//
// Además de ahorrar las consultas repetidas, esto elimina el parpadeo que tenía
// la versión anterior: como los datos llegaban en un useEffect, el primer
// render usaba los valores de site-config.ts y luego se reemplazaban por los de
// la base. Si alguien había cambiado el WhatsApp desde el panel, durante ese
// instante el botón apuntaba al número viejo. Ahora el HTML ya sale con el
// valor correcto.
export function useConfiguracionSitio(): ConfiguracionSitioCliente {
  return useConfiguracionContext();
}
