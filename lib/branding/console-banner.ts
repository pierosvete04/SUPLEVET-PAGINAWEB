// Paleta real de marca (ver app/globals.css: secondary=azul marino #253C61,
// primary=naranja #EA8C43, accent=celeste #99D3DA).
const styles = {
  wordmark: "font-size:26px;font-weight:bold;color:#253C61;letter-spacing:1px;",
  tagline: "font-size:13px;color:#5b7a94;",
  warningTitle: "font-size:13px;font-weight:bold;color:#EA8C43;",
  warningBody: "font-size:12px;color:#8a8a8a;",
  footer: "font-size:11px;color:#99D3DA;",
};

// Banner de marca en la consola del navegador. Es decorativo — no oculta ni
// protege nada (todo el JS del cliente es visible igual); incluye la
// advertencia estándar contra estafas de self-XSS (pegar código ajeno acá).
export function logConsoleBanner(): void {
  console.log("%c🐾 Suplevet", styles.wordmark);
  console.log("%cNutrición veterinaria con ciencia y cariño", styles.tagline);
  console.log(
    "%c⚠ ¿Alguien te pidió pegar algo aquí?\n%cEsta consola es para desarrolladores. Si copiaste código de otra persona para pegarlo acá, es una estafa (se llama self-XSS) — ciérrala y no lo hagas.",
    styles.warningTitle,
    styles.warningBody
  );
  console.log("%c¿Te gusta mirar bajo el capó? Escríbenos: ventas@suplevet.pe", styles.footer);
}
