export interface LibroReclamacion {
  id: string;
  correlativo: number;
  cliente_id: string | null;
  tipo_solicitud: "reclamo" | "queja";
  consumidor_nombre: string;
  consumidor_tipo_doc: string;
  consumidor_num_doc: string;
  consumidor_telefono: string | null;
  consumidor_email: string;
  consumidor_domicilio: string | null;
  es_menor: boolean;
  apoderado_nombre: string | null;
  apoderado_num_doc: string | null;
  tipo_bien: "producto" | "servicio";
  bien_descripcion: string | null;
  monto_reclamado: number | null;
  detalle: string;
  pedido_consumidor: string;
  estado: "pendiente" | "en_proceso" | "resuelto";
  respuesta_proveedor: string | null;
  respondido_at: string | null;
  created_at: string;
}

export const BADGE_ESTADO_RECLAMO = {
  pendiente: { color: "naranja" as const, label: "Pendiente" },
  en_proceso: { color: "azul" as const, label: "En proceso" },
  resuelto: { color: "verde" as const, label: "Resuelto" },
};

export const LABEL_TIPO_SOLICITUD = {
  reclamo: "Reclamo",
  queja: "Queja",
};

export function formatCorrelativoReclamo(correlativo: number, creadoEn: string): string {
  return `${new Date(creadoEn).getFullYear()}-${String(correlativo).padStart(6, "0")}`;
}

// Ley N.° 29571 exige responder en un plazo máximo de 15 días hábiles. No hay
// calendario de feriados acá (aproximación por semanas), pero como los
// feriados solo restan días hábiles, esto nunca subestima el plazo vencido.
const PLAZO_DIAS_HABILES = 15;

export function diasHabilesTranscurridos(creadoEn: string): number {
  const inicio = new Date(creadoEn);
  inicio.setHours(0, 0, 0, 0);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let dias = 0;
  const cursor = new Date(inicio);
  while (cursor < hoy) {
    cursor.setDate(cursor.getDate() + 1);
    const diaSemana = cursor.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) dias++;
  }
  return dias;
}

export function reclamoVencido(reclamo: Pick<LibroReclamacion, "created_at" | "estado">): boolean {
  return reclamo.estado !== "resuelto" && diasHabilesTranscurridos(reclamo.created_at) > PLAZO_DIAS_HABILES;
}

export { PLAZO_DIAS_HABILES };
