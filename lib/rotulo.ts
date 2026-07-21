// Datos del rótulo que se pega en el paquete. Todo sale del pedido salvo el
// código del courier, que el equipo escribe al despachar.

// Días hábiles de tránsito por zona — coinciden con el "tiempo estimado" que
// se le promete al cliente en checkout (envio_zonas.tiempo_estimado): Lima y
// Callao 24–48h, costa/sierra 48–72h, selva 72h+. Se toma el extremo superior
// para no prometer en el rótulo una fecha más optimista que la del checkout.
const DIAS_HABILES_POR_ZONA: Record<string, number> = {
  lima: 2,
  costa_sierra: 3,
  selva: 4,
};

const DIAS_HABILES_POR_DEFECTO = 3;

function esFinDeSemana(fecha: Date): boolean {
  const dia = fecha.getDay();
  return dia === 0 || dia === 6;
}

export function sumarDiasHabiles(desde: Date, dias: number): Date {
  const resultado = new Date(desde);
  let restantes = dias;
  while (restantes > 0) {
    resultado.setDate(resultado.getDate() + 1);
    if (!esFinDeSemana(resultado)) restantes -= 1;
  }
  return resultado;
}

export function fechaEntregaEstimada(zonaEnvio: string | null, desde: Date = new Date()): Date {
  const dias = zonaEnvio ? DIAS_HABILES_POR_ZONA[zonaEnvio] ?? DIAS_HABILES_POR_DEFECTO : DIAS_HABILES_POR_DEFECTO;
  return sumarDiasHabiles(desde, dias);
}

export function formatFechaRotulo(fecha: Date): string {
  const dd = String(fecha.getDate()).padStart(2, "0");
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${fecha.getFullYear()}`;
}

/** Valor ISO (yyyy-mm-dd) para un <input type="date">. */
export function fechaComoInput(fecha: Date): string {
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mm}-${dd}`;
}

/** Parsea yyyy-mm-dd como fecha local (new Date("2026-07-20") daría UTC y se corre un día). */
export function fechaDesdeInput(valor: string): Date {
  const [anio, mes, dia] = valor.split("-").map(Number);
  return new Date(anio, (mes ?? 1) - 1, dia ?? 1);
}
