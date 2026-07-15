// Helpers de formato compartidos por las páginas del portal de clientes —
// puertos directos de PORTAL DE CLIENTES/portal/assets/js/utils.js.
export function formatFecha(str: string | null): string {
  if (!str) return "";
  return new Date(str).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatFechaCumple(str: string | null): string {
  if (!str) return "";
  return new Date(`${str}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
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
