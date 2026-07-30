// Filtro rápido "por mes" para las tablas del panel admin (Pedidos, Clientes).
// Es un atajo sobre el filtro de rango de fechas ya existente: al elegir un
// mes, solo llena fecha_desde/fecha_hasta con el primer y último día de ese
// mes — no es un filtro independiente en la consulta.
const MESES_HACIA_ATRAS = 24;

export interface OpcionMes {
  value: string; // "2026-07"
  label: string; // "Julio 2026"
}

function formatearFechaLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function mesActual(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
}

// Últimos `cantidad` meses (incluye el actual), del más reciente al más antiguo.
export function opcionesMes(cantidad: number = MESES_HACIA_ATRAS): OpcionMes[] {
  const ahora = new Date();
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const value = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    const etiqueta = fecha.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
    return { value, label: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1) };
  });
}

// Primer y último día del mes "YYYY-MM", en formato YYYY-MM-DD.
export function rangoMes(valor: string): { desde: string; hasta: string } {
  const [anio, mes] = valor.split("-").map(Number);
  const desde = new Date(anio, mes - 1, 1);
  const hasta = new Date(anio, mes, 0);
  return { desde: formatearFechaLocal(desde), hasta: formatearFechaLocal(hasta) };
}
