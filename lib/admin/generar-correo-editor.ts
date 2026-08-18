// Correo interno del editor: {nombre de pila}.{apellido paterno}@suplevetedit.pe
// — no es un buzón real (nunca se le manda nada ahí, es solo el usuario para
// iniciar sesión en /admin/login), así que el dominio no necesita existir de
// verdad. Nunca se le pide al admin que lo escriba: sale solo del nombre y
// apellido que trae RENIEC al consultar el DNI.
const DOMINIO_EDITORES = "suplevetedit.pe";

function normalizarToken(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // quita tildes (RENIEC devuelve mayúsculas con acentos)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

export function generarCorreoEditor(nombrePila: string, apellidoPaterno: string): string {
  const pila = normalizarToken(nombrePila.trim().split(/\s+/)[0] ?? "");
  const apellido = normalizarToken(apellidoPaterno.trim().split(/\s+/)[0] ?? "");
  if (!pila || !apellido) return "";
  return `${pila}.${apellido}@${DOMINIO_EDITORES}`;
}
