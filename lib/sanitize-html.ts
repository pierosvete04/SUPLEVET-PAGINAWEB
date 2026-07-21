import DOMPurify from "isomorphic-dompurify";

// El editor de blog (components/admin/blog/RichTextEditor.tsx) es un
// contentEditable simple basado en document.execCommand — un admin puede
// pegar HTML de cualquier origen ahí, no solo escribir con los botones de la
// barra de herramientas. Esto sanitiza ese HTML justo antes de renderizarlo
// en la página pública del post (dangerouslySetInnerHTML), como última capa
// de defensa si una cuenta de admin se ve comprometida o el contenido pegado
// trae algo más que negrita/cursiva/links.
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
