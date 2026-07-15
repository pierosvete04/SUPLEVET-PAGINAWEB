export interface LogroConfig {
  id: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  icon: string;
  condicion_tipo: string | null;
  condicion_valor: number | null;
  orden: number | null;
  activo: boolean;
}

export interface ClienteLogro {
  logro_clave: string;
}

export const NOMBRE_NIVEL: Record<string, string> = {
  basico: "Básico",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
};

export const SIGUIENTE_NIVEL: Record<string, string | null> = {
  basico: "silver",
  silver: "gold",
  gold: "diamond",
  diamond: null,
};

export const UMBRAL_NIVEL: Record<string, number> = {
  basico: 0,
  silver: 500,
  gold: 1500,
  diamond: 4000,
};
