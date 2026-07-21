// Documento de identidad del cliente. Es OPCIONAL a propósito: no todos los
// compradores tienen DNI (extranjeros con carnet, empresas con RUC), así que
// se pide como sugerencia para que el courier pueda validar la identidad en la
// entrega, no como requisito para comprar.
export type TipoDocumento = "dni" | "ce" | "pasaporte" | "ruc";

export const TIPOS_DOCUMENTO: { id: TipoDocumento; label: string; corto: string }[] = [
  { id: "dni", label: "DNI", corto: "DNI" },
  { id: "ce", label: "Carnet de extranjería", corto: "C.E." },
  { id: "pasaporte", label: "Pasaporte", corto: "Pasaporte" },
  { id: "ruc", label: "RUC", corto: "RUC" },
];

// Solo DNI y RUC se pueden consultar contra RENIEC/SUNAT; carnet de
// extranjería y pasaporte no tienen padrón público consultable.
export function esConsultable(tipo: TipoDocumento | ""): tipo is "dni" | "ruc" {
  return tipo === "dni" || tipo === "ruc";
}

export function largoEsperado(tipo: TipoDocumento | ""): number | null {
  if (tipo === "dni") return 8;
  if (tipo === "ruc") return 11;
  return null;
}

export function etiquetaCorta(tipo: TipoDocumento | string | null | undefined): string {
  return TIPOS_DOCUMENTO.find((t) => t.id === tipo)?.corto ?? "Doc.";
}

export interface DocumentoConsultado {
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
}

/** Devuelve null si no se pudo consultar (sin token, sin red, no encontrado). */
export async function consultarDocumento(
  tipo: TipoDocumento,
  numero: string
): Promise<{ datos: DocumentoConsultado | null; error: string | null }> {
  try {
    const r = await fetch("/api/documento/consultar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, numero }),
    });
    const d = await r.json().catch(() => null);
    if (!r.ok || !d?.ok) {
      return { datos: null, error: d?.error ?? "No pudimos consultar el documento" };
    }
    return {
      datos: { nombre: d.nombre, apellidos: d.apellidos, nombreCompleto: d.nombreCompleto },
      error: null,
    };
  } catch {
    return { datos: null, error: "Error de conexión" };
  }
}
