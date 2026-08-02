// Helpers de formato compartidos por las páginas del portal de clientes —
// puertos directos de PORTAL DE CLIENTES/portal/assets/js/utils.js.
export function formatFecha(str: string | null): string {
  if (!str) return "";
  // Fechas sin hora (columnas `date`, ej. "2026-02-10") las parsea Date() como
  // medianoche UTC; en horario de Perú (UTC-5) eso cae en el día anterior al
  // formatear en local. Forzamos medianoche local solo cuando no trae hora —
  // los timestamps completos (created_at) se parsean tal cual.
  const fecha = str.includes("T") ? new Date(str) : new Date(`${str}T00:00:00`);
  // timeZone explícito: el servidor (Vercel) corre en UTC, así que sin esto
  // un timestamp completo (created_at) se muestra en la fecha UTC en vez de
  // la de Perú — un pedido de las 21:11 del 1 de agosto (hora Perú) queda
  // como 02:11 del 2 de agosto en UTC y se mostraba "02 ago" en vez de "01 ago".
  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Lima",
  });
}

export function formatFechaCumple(str: string | null): string {
  if (!str) return "";
  return new Date(`${str}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

export function formatFechaRelativa(str: string): string {
  const segundos = Math.floor((Date.now() - new Date(str).getTime()) / 1000);
  if (segundos < 60) return "hace un momento";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  return formatFecha(str);
}

export function calcularEdad(fechaNacimiento: string | null): string {
  if (!fechaNacimiento) return "";
  const hoy = new Date();
  const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
  const anios = hoy.getFullYear() - nacimiento.getFullYear();
  const meses = hoy.getMonth() - nacimiento.getMonth();
  if (anios === 0) return `${Math.max(0, meses)} meses`;
  return anios === 1 ? "1 año" : `${anios} años`;
}
