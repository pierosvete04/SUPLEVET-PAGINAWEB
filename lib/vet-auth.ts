// El portal veterinario NO usa Supabase Auth (las vets no son usuarios en
// auth.users) — el login valida `codigo_acceso` contra la tabla `veterinarias`
// y las RPCs (buscar_cliente_por_qr, registrar_pedido_vet) son SECURITY
// DEFINER que revalidan ese código en cada llamada. Ver
// PORTAL DE CLIENTES/portal/SUPLEVET_PORTAL_VET.md sección 8.
const STORAGE_KEY = "suplevet_vet_sesion";

export interface VetSesion {
  codigoAcceso: string;
  veterinariaId: string;
  veterinariaNombre: string;
}

export function getVetSesion(): VetSesion | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VetSesion) : null;
  } catch {
    return null;
  }
}

export function setVetSesion(sesion: VetSesion): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
}

export function clearVetSesion(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
