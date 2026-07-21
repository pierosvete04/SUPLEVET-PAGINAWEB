import sanitizeHtmlLib from "sanitize-html";

// El editor de blog (components/admin/blog/RichTextEditor.tsx) es un
// contentEditable simple basado en document.execCommand — un admin puede
// pegar HTML de cualquier origen ahí, no solo escribir con los botones de la
// barra de herramientas. Esto sanitiza ese HTML justo antes de renderizarlo
// en la página pública del post (dangerouslySetInnerHTML), como última capa
// de defensa si una cuenta de admin se ve comprometida o el contenido pegado
// trae algo más que negrita/cursiva/links.
//
// Se usa sanitize-html (sin jsdom) en vez de isomorphic-dompurify: jsdom trae
// una dependencia transitiva (html-encoding-sniffer -> @exodus/bytes) publicada
// como ESM-only, y el runtime serverless de Vercel no soporta require() de ESM
// (aunque en local sí, por eso el bug no aparecía en dev/build local).
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: sanitizeHtmlLib.defaults.allowedTags.concat(["img"]),
    allowedAttributes: {
      ...sanitizeHtmlLib.defaults.allowedAttributes,
      img: ["src", "alt", "width", "height"],
    },
  });
}
