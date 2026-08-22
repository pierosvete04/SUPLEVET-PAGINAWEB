import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ERROR_NO_CONFIGURADO,
  obtenerConsultas,
  rangoPorDefecto,
  searchConsoleConfigurado,
} from "@/lib/search-console";

/** Filas por lote en el upsert — evita mandar un payload gigante de una vez. */
const TAMANO_LOTE = 500;

/**
 * Trae de Search Console las consultas de los últimos 28 días y las vuelca en
 * `seo_keywords`.
 *
 * El upsert manda solo las columnas de métricas a propósito: `estado`,
 * `producto_id` y `notas` quedan fuera del payload, así que una consulta ya
 * marcada como "aplicada" o "descartada" conserva esa marca cuando Google
 * vuelve a reportarla. Si se incluyeran, cada sincronización borraría el
 * trabajo del admin.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: admin } = await supabase.from("admins").select("rol, activo").eq("id", user.id).maybeSingle();
  if (!admin?.activo || !["admin", "superadmin"].includes(admin.rol ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!searchConsoleConfigurado()) {
    return NextResponse.json({ error: ERROR_NO_CONFIGURADO }, { status: 503 });
  }

  const rango = rangoPorDefecto();

  let consultas;
  try {
    consultas = await obtenerConsultas(rango);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "error desconocido";
    return NextResponse.json({ error: `Search Console: ${mensaje}` }, { status: 502 });
  }

  if (consultas.length === 0) {
    return NextResponse.json({
      ok: true,
      sincronizadas: 0,
      rango,
      aviso:
        "Google no devolvió ninguna consulta para este período. Si la propiedad se verificó hace poco, " +
        "los datos tardan unos días en aparecer.",
    });
  }

  // La posición actual de cada consulta pasa a ser la "anterior" de esta
  // ronda: es lo que permite mostrar la flecha de subió/bajó sin guardar un
  // histórico completo.
  const { data: previas } = await supabase.from("seo_keywords").select("consulta, posicion");
  const posicionPrevia = new Map((previas ?? []).map((p) => [p.consulta, p.posicion]));

  const ahora = new Date().toISOString();
  const filas = consultas.map((c) => ({
    consulta: c.consulta.toLowerCase().trim(),
    impresiones: c.impresiones,
    clics: c.clics,
    ctr: c.ctr,
    posicion: c.posicion,
    posicion_anterior: posicionPrevia.get(c.consulta.toLowerCase().trim()) ?? null,
    pagina: c.pagina,
    origen: "search_console",
    periodo_desde: rango.desde,
    periodo_hasta: rango.hasta,
    actualizada_at: ahora,
  }));

  for (let i = 0; i < filas.length; i += TAMANO_LOTE) {
    const lote = filas.slice(i, i + TAMANO_LOTE);
    const { error } = await supabase.from("seo_keywords").upsert(lote, { onConflict: "consulta" });
    if (error) {
      return NextResponse.json({ error: `Al guardar: ${error.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, sincronizadas: filas.length, rango });
}
