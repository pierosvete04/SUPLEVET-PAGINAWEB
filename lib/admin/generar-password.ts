// Contraseña temporal legible para pasarle a alguien por WhatsApp/correo —
// sin 0/O/1/I/L para que no se confundan al transcribirla a mano.
export function generarPassword(): string {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let resultado = "";
  for (let i = 0; i < 10; i++) {
    resultado += caracteres[Math.floor(Math.random() * caracteres.length)];
  }
  return resultado;
}
