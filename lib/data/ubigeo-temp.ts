// Distritos reales, pero solo para Lima Metropolitana y Callao (mercado
// primario) — el resto de departamentos del Perú usa un campo de texto libre
// para provincia/distrito en el checkout (ver ShippingStep.tsx). La lista de
// departamentos en sí es real y completa (lib/shipping.ts).
export const distritosPorDepartamento: Record<string, string[]> = {
  "Lima Metropolitana": [
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
