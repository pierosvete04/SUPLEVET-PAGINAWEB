import type { SupabaseClient } from "@supabase/supabase-js";

// Algoritmo de envío real — reemplaza el cálculo de 2 niveles hardcodeado que
// vivía duplicado en ShippingStep.tsx y en app/checkout/page.tsx. Única fuente
// de verdad: la tabla `envio_zonas` (editable desde /admin/envios), tanto para
// el checkout público como para el panel admin.
export interface EnvioZona {
  id: string;
  nombre: string;
  departamentos: string[];
  tiempo_estimado: string;
  monto_minimo_gratis: number;
  costo_envio: number;
  orden: number;
  activo: boolean;
}

// Override de costo_envio por distrito puntual (courier Dinsides) — algunos
// departamentos como Lima Metropolitana y Callao no tienen un costo plano
// real, sino que varía según el distrito exacto de entrega. Cuando no hay
// fila en envio_distritos para el distrito elegido, se usa el costo_envio
// plano de la zona (departamentos fuera de Lima/Callao, o distritos nuevos
// que Dinsides todavía no ha tarifado).
export interface EnvioDistrito {
  id: string;
  zona_id: string;
  distrito: string;
  costo_envio: number;
  activo: boolean;
}

export async function getZonasEnvioActivas(
  supabase: SupabaseClient
): Promise<EnvioZona[]> {
  const { data } = await supabase
    .from("envio_zonas")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });
  return (data as EnvioZona[]) ?? [];
}

export async function getDistritosEnvioActivos(
  supabase: SupabaseClient
): Promise<EnvioDistrito[]> {
  const { data } = await supabase
    .from("envio_distritos")
    .select("*")
    .eq("activo", true);
  return (data as EnvioDistrito[]) ?? [];
}

export function encontrarZonaPorDepartamento(
  zonas: EnvioZona[],
  departamento: string
): EnvioZona | undefined {
  return zonas.find((z) => z.departamentos.includes(departamento));
}

export function encontrarCostoDistrito(
  distritos: EnvioDistrito[],
  zona: EnvioZona | undefined,
  distrito: string
): number | undefined {
  if (!zona || !distrito) return undefined;
  return distritos.find((d) => d.zona_id === zona.id && d.distrito === distrito)?.costo_envio;
}

export function calcularCostoEnvio(
  zona: EnvioZona,
  subtotal: number,
  costoDistrito?: number
): number {
  return subtotal >= zona.monto_minimo_gratis ? 0 : costoDistrito ?? zona.costo_envio;
}

export function montoFaltanteParaGratis(zona: EnvioZona, subtotal: number): number {
  return Math.max(0, zona.monto_minimo_gratis - subtotal);
}

// Tarifa plana de Agencia Shalom para "provincia" (todo departamento fuera de
// Lima Metropolitana/Callao, incluida Lima Provincias) — pisa el costo_envio
// de zona y cualquier override de envio_distritos, porque Shalom cobra un
// flete nacional único sin importar la distancia real. El delivery motorizado
// no se ofrece fuera de Lima/Callao (no llega), así que en estos
// departamentos Shalom es el único método de envío disponible.
export const COSTO_SHALOM_PROVINCIA = 12;

export function esDepartamentoProvincia(departamento: string): boolean {
  return !!departamento && departamento !== "Lima Metropolitana" && departamento !== "Callao";
}

// La columna `pedidos.zona_envio` tiene un CHECK legado que solo acepta
// 'lima' | 'costa_sierra' | 'selva' (agrupación previa a las 5 zonas actuales
// de envio_zonas) — se deriva del nombre de la zona real al momento de
// registrar el pedido, sin tocar el constraint existente en una tabla
// compartida con otros sistemas.
export function zonaEnvioSlug(nombreZona: string): "lima" | "costa_sierra" | "selva" {
  if (nombreZona.includes("Lima") || nombreZona.includes("Callao")) return "lima";
  if (/costa|sierra/i.test(nombreZona)) return "costa_sierra";
  return "selva";
}

// Lista de departamentos para el select del checkout — Lima se divide en 3
// zonas de envío reales (Metropolitana / Callao / Provincias), igual que en
// _context/05_Suplevet_Shipping_Operations.md y en la semilla de envio_zonas.
export const departamentosCheckout = [
  "Lima Metropolitana",
  "Callao",
  "Lima Provincias",
  "Amazonas",
  "Áncash",
  "Apurímac",
  "Arequipa",
  "Ayacucho",
  "Cajamarca",
  "Cusco",
  "Huancavelica",
  "Huánuco",
  "Ica",
  "Junín",
  "La Libertad",
  "Lambayeque",
  "Loreto",
  "Madre de Dios",
  "Moquegua",
  "Pasco",
  "Piura",
  "Puno",
  "San Martín",
  "Tacna",
  "Tumbes",
  "Ucayali",
] as const;
