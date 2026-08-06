import type { SupabaseClient } from "@supabase/supabase-js";

// Algoritmo de envío real — reemplaza el cálculo de 2 niveles hardcodeado que
// vivía duplicado en ShippingStep.tsx y en app/checkout/page.tsx. Única fuente
// de verdad: la tabla `envio_zonas` (editable desde /admin/envios), tanto para
// el checkout público como para el panel admin.
export interface EnvioZona {
  id: string;
  nombre: string;
  departamentos: string[];
  /** Tiempo del delivery motorizado. */
  tiempo_estimado: string;
  monto_minimo_gratis: number;
  /** Tarifa del motorizado (Dinsides). En Lima/Callao la pisa envio_distritos. */
  costo_envio: number;
  /** Tarifa plana de Agencia Shalom para la zona. */
  costo_shalom: number;
  /** Tiempo estimado cuando el envío va por Shalom (siempre mayor). */
  tiempo_shalom: string;
  orden: number;
  activo: boolean;
}

/** Cómo llega el pedido. Lo elige el cliente en el checkout y cambia la tarifa. */
export type MetodoEnvio = "motorizado" | "shalom";

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

// El precio depende del método elegido, no solo de la zona: Shalom cobra una
// tarifa plana por zona (más barata, con recojo en agencia y más días) y el
// motorizado cobra por distrito según la tarifa de Dinsides. El umbral de
// envío gratis es el mismo para ambos — es una promesa comercial de la zona,
// no del courier.
export function calcularCostoEnvio(
  zona: EnvioZona,
  subtotal: number,
  costoDistrito?: number,
  metodo: MetodoEnvio = "motorizado"
): number {
  if (subtotal >= zona.monto_minimo_gratis) return 0;
  if (metodo === "shalom") return Number(zona.costo_shalom);
  return costoDistrito ?? Number(zona.costo_envio);
}

/** Tarifa y plazo de cada método disponible en la zona, para mostrarlos juntos
 *  en el checkout y que la persona compare antes de elegir. */
export function tarifaDeMetodo(
  zona: EnvioZona,
  subtotal: number,
  costoDistrito: number | undefined,
  metodo: MetodoEnvio
): { costo: number; tiempo: string } {
  return {
    costo: calcularCostoEnvio(zona, subtotal, costoDistrito, metodo),
    tiempo: metodo === "shalom" ? zona.tiempo_shalom : zona.tiempo_estimado,
  };
}

export function montoFaltanteParaGratis(zona: EnvioZona, subtotal: number): number {
  return Math.max(0, zona.monto_minimo_gratis - subtotal);
}

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
