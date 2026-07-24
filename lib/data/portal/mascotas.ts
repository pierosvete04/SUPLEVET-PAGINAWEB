export type TipoCondicionMedica = "alergia" | "enfermedad_cronica" | "cirugia" | "otro";

export interface CondicionMedica {
  tipo: TipoCondicionMedica;
  descripcion: string;
  fecha: string | null;
}

export const TIPOS_CONDICION_MEDICA: Record<TipoCondicionMedica, string> = {
  alergia: "Alergia",
  enfermedad_cronica: "Enfermedad crónica",
  cirugia: "Cirugía",
  otro: "Otro",
};

export interface Familiar {
  relacion: string;
  nombre: string;
}

export interface Mascota {
  id: string;
  cliente_id: string;
  nombre: string;
  especie: "perro" | "gato" | "otro";
  especie_otro: string | null;
  raza: string | null;
  fecha_nacimiento: string | null;
  peso_kg: number;
  genero: "macho" | "hembra" | null;
  condiciones_medicas: CondicionMedica[];
  descripcion: string | null;
  foto_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  color_texto: string | null;
  color_etiqueta: string | null;
  familiares: Familiar[];
  activa: boolean;
  created_at: string;
}

export type TipoEventoSalud =
  | "vacuna"
  | "desparasitacion"
  | "consulta"
  | "medicamento"
  | "bano"
  | "otro";

export interface MascotaEvento {
  id: string;
  mascota_id: string;
  cliente_id: string;
  tipo: TipoEventoSalud;
  titulo: string;
  detalle: string | null;
  fecha: string;
  created_at: string;
}

export interface DetalleEventoSalud {
  producto?: string;
  veterinario?: string;
  proxima_fecha?: string;
  notas?: string;
}

export function parseDetalleEventoSalud(raw: string | null): DetalleEventoSalud {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const TIPOS_SALUD: Record<TipoEventoSalud, { label: string; emoji: string }> = {
  vacuna: { label: "Vacuna", emoji: "💉" },
  desparasitacion: { label: "Desparasitación", emoji: "🪱" },
  consulta: { label: "Consulta vet.", emoji: "🩺" },
  medicamento: { label: "Medicamento", emoji: "💊" },
  bano: { label: "Baño / Grooming", emoji: "🛁" },
  otro: { label: "Otro cuidado", emoji: "❤️" },
};

export const COLORES_MASCOTA = ["#EA8C43", "#99D3DA", "#253C61", "#2b676d", "#c46e25", "#6fb5be"];
