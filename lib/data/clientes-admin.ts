export interface ClienteResumen {
  id: string;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  distrito: string | null;
  ciudad: string | null;
  created_at: string;
  email: string;
  saldo_actual: number | null;
  nivel: string | null;
  total_compras: number | null;
  ultima_compra_at: string | null;
}

export const BADGE_NIVEL: Record<string, "gris" | "celeste" | "naranja" | "azul"> = {
  basico: "gris",
  silver: "celeste",
  gold: "naranja",
  diamond: "azul",
};

export function formatFecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}
