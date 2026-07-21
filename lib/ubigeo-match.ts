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
 * Si el nombre es ambiguo (varios departamentos tienen un distrito con ese
 * nombre) devuelve null a propósito: es preferible que la persona elija a que
 * le autocompletemos mal la zona de envío, porque de eso depende el precio.
 */
export function ubicarDistrito(nombreDistrito: string | null): UbicacionUbigeo | null {
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

  return coincidencias.length === 1 ? coincidencias[0] : null;
}
