// Radix bloquea los clicks del resto de la página poniendo
// `pointer-events: none` en el <body> mientras hay un Select o un diálogo
// abierto, y lo quita al cerrarlo. Cuando un Select abre un diálogo desde su
// onValueChange, los dos se cierran casi a la vez y el orden de limpieza se
// cruza: el último en soltar el body nunca corre y el estilo se queda pegado.
//
// Efecto en el panel: cambias el estado de pago de un pedido, se guarda bien
// y a partir de ahí la tabla queda "congelada" — no se puede abrir el detalle
// ni tocar nada, y hay que recargar. Reportado el 22-ago-2026.
//
// Esto lo suelta a mano. Se revisa varias veces durante medio segundo porque
// el diálogo tarda en desmontarse (tiene animación de salida): un solo intento
// inmediato lo encuentra todavía en pantalla y no hace nada, que fue
// exactamente el primer intento de arreglo.

const REINTENTOS_MS = [0, 60, 150, 350, 600];

/** Solo cuenta un overlay realmente abierto: los que están cerrándose llevan
 * data-state="closed" y su `pointer-events: none` ya no le sirve a nadie. */
function hayOverlayAbierto(): boolean {
  return !!document.querySelector(
    '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"], [data-radix-popper-content-wrapper] [data-state="open"]'
  );
}

export function liberarInteraccion(): void {
  if (typeof document === "undefined") return;

  for (const espera of REINTENTOS_MS) {
    setTimeout(() => {
      if (hayOverlayAbierto()) return;
      if (document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "";
      }
    }, espera);
  }
}
