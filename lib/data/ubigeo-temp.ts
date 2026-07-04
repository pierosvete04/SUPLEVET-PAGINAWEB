// Dataset de ubigeo TEMPORAL y PARCIAL — solo cubre Lima Metropolitana (el
// mercado primario, PLAN.md sección "Mercado") para poder demostrar el flujo
// de selects en cascada. Falta cargar el dataset completo de Perú (24
// departamentos) antes de producción — ver pendiente operativo.
export const departamentos = ["Lima", "Arequipa", "Cusco", "La Libertad", "Piura", "Otro"] as const;

export const provinciasPorDepartamento: Record<string, string[]> = {
  Lima: ["Lima", "Callao"],
};

export const distritosPorProvincia: Record<string, string[]> = {
  Lima: [
    "Miraflores",
    "San Isidro",
    "Surco",
    "San Borja",
    "La Molina",
    "Barranco",
    "Jesús María",
    "Lince",
    "San Miguel",
    "Los Olivos",
  ],
  Callao: ["Callao Cercado", "Bellavista", "La Perla", "La Punta", "Ventanilla"],
};

// Zona por defecto para departamentos/distritos fuera de Lima Metropolitana
// (mientras no exista `envio_zonas`/`envio_tarifas`, PLAN.md sección 9).
export function esLimaMetropolitana(departamento: string, provincia: string): boolean {
  return departamento === "Lima" && (provincia === "Lima" || provincia === "Callao");
}
