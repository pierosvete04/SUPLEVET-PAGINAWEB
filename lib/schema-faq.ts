import type { BlogFaq } from "@/lib/data/blog-shared";

/**
 * Arma el JSON-LD schema.org FAQPage a partir de las mismas preguntas que se
 * muestran en pantalla. Google (y los motores de IA que citan resultados,
 * como AI Overviews o Gemini) exige que el texto marcado coincida con el
 * texto visible — por eso este builder recibe exactamente las `faqs` que
 * también renderiza el acordeón, nunca una copia aparte.
 * Ver: https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */
export function faqPageSchema(faqs: BlogFaq[]) {
  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.pregunta,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.respuesta,
      },
    })),
  };
}
