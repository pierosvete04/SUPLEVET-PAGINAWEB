import { distritosPorProvincia } from "@/lib/data/ubigeo";
import { departamentosCheckout } from "@/lib/shipping";

export interface UbicacionUbigeo {
  departamento: string;
  provincia: string;
  distrito: string;
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

// Google antepone "Provincia de …" / "Provincia Constitucional del Callao" al
// nombre de la provincia; nuestras claves de ubigeo usan el nombre a secas.
function normalizarProvincia(texto: string): string {
  return normalizar(texto).replace(/^provincia\s+(constitucional\s+)?(de\s+|del\s+)?/, "");
}

/**
 * Traduce el distrito que devuelve Google Places a la combinación
 * departamento/provincia/distrito de nuestros dropdowns.
 *
 * Se busca SOLO por distrito y no por los tres campos a la vez porque Google
 * es inconsistente con los niveles administrativos peruanos (el departamento a
 * veces viene como "Lima", a veces como "Provincia de Lima", y nuestras zonas
 * de envío usan nombres propios del negocio como "Lima Metropolitana"). El
 * nombre del distrito, en cambio, sí es confiable.
 *
 * Si el nombre solo aparece en un lugar, listo. Si es ambiguo (varios
 * departamentos tienen un distrito con ese nombre) se intenta desempatar con
 * la provincia que reporta Google. Si aun así queda ambiguo devuelve null a
 * propósito: es preferible que la persona elija a que le autocompletemos mal
 * la zona de envío, porque de eso depende el precio.
 */
export function ubicarDistrito(
  nombreDistrito: string | null,
  provinciaGoogle?: string | null
): UbicacionUbigeo | null {
  if (!nombreDistrito) return null;
  const buscado = normalizar(nombreDistrito);
  if (!buscado) return null;

  const coincidencias: UbicacionUbigeo[] = [];

  for (const [clave, distritos] of Object.entries(distritosPorProvincia)) {
    const [departamento, provincia] = clave.split("::");
    if (!(departamentosCheckout as readonly string[]).includes(departamento)) continue;

    const distrito = distritos.find((d) => normalizar(d) === buscado);
    if (distrito) coincidencias.push({ departamento, provincia, distrito });
  }

  if (coincidencias.length === 1) return coincidencias[0];

  if (coincidencias.length > 1 && provinciaGoogle) {
    const provinciaBuscada = normalizarProvincia(provinciaGoogle);
    const filtradas = coincidencias.filter((c) => normalizar(c.provincia) === provinciaBuscada);
    if (filtradas.length === 1) return filtradas[0];
  }

  return null;
}
