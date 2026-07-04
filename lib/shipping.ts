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

export function encontrarZonaPorDepartamento(
  zonas: EnvioZona[],
  departamento: string
): EnvioZona | undefined {
  return zonas.find((z) => z.departamentos.includes(departamento));
}

export function calcularCostoEnvio(zona: EnvioZona, subtotal: number): number {
  return subtotal >= zona.monto_minimo_gratis ? 0 : zona.costo_envio;
}

export function montoFaltanteParaGratis(zona: EnvioZona, subtotal: number): number {
  return Math.max(0, zona.monto_minimo_gratis - subtotal);
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
