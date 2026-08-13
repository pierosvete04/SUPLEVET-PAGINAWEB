# Sistema de artículos SEO/GEO con FAQ estructurada

Qué es esto: un sistema repetible para atacar un término de búsqueda específico
(ej. "lactoferrina para gatos", "calostro bovino en mascotas") con una página
que Google puede indexar y que Gemini/ChatGPT/AI Overviews puede citar
directamente.

Se armó por primera vez el 13-ago-2026, con el artículo
`lactoferrina-para-gatos` como caso real (no un ejemplo de prueba).

---

## 1. La idea en una frase

Cada término de dolor ("¿qué es X y para qué sirve en mi mascota?") se
resuelve con **un artículo del blog** que tiene:

1. Contenido informacional real (texto visible, con la pregunta como
   encabezado).
2. Un enlace directo al producto Suplevet que contiene ese ingrediente.
3. Una sección de **preguntas frecuentes** — visible en pantalla Y marcada
   como datos estructurados (`FAQPage`) para buscadores/IA.

Todo se crea desde `/admin/blog`, sin tocar código ni hacer deploy.

---

## 2. Visible vs. invisible — la distinción clave

| Parte | ¿Se ve en la página? | ¿Para quién es? |
|---|---|---|
| Texto del artículo (`contenido_html`) | Sí | Personas y buscadores |
| Acordeón de FAQ (clic para desplegar) | Sí | Personas |
| JSON-LD `FAQPage` (`<script type="application/ld+json">`) | No, es invisible en el HTML | Google, Gemini, ChatGPT, AI Overviews |
| JSON-LD `BlogPosting` / `Product` | No | Igual que arriba |

**Regla de oro:** el JSON-LD nunca debe decir algo que no esté también visible
en pantalla. Google penaliza el "structured data" que no coincide con el
contenido real. Por diseño, ambos (`PostFaq` visible y `faqPageSchema`
invisible) se arman a partir del **mismo array** `faqs` — nunca hay dos
copias del mismo texto que puedan desalinearse.

---

## 3. Piezas del sistema (archivos)

```
lib/data/blog-shared.ts        → tipo BlogFaq { pregunta, respuesta } y
                                  BlogPost.faqs
lib/schema-faq.ts               → faqPageSchema(faqs): arma el JSON-LD FAQPage
components/blog/PostFaq.tsx     → acordeón visible al final del artículo
app/blog/[slug]/page.tsx        → junta ambos: renderiza <PostFaq> y emite
                                  el <script type="application/ld+json">
components/admin/blog/
  PostEditor.tsx                 → UI en /admin/blog para agregar/quitar
                                  preguntas del artículo
```

Columna en base de datos: `blog_posts.faqs` (`jsonb`, default `[]`).
Formato: `[{"pregunta": "...", "respuesta": "..."}]`.

---

## 4. Cómo crear el próximo artículo (ej. "calostro bovino en mascotas")

1. Entra a `/admin/blog` → **Nuevo post**.
2. Completa:
   - **Título**: la pregunta o término que la gente busca
     (ej. "Calostro bovino para mascotas: qué es y para qué sirve").
   - **Contenido**: usa H2 por cada sub-pregunta real
     (qué es / beneficios / cuándo se necesita / en qué producto está).
     Enlaza al producto Suplevet correspondiente con `<a href="/productos/...">`.
   - **Producto relacionado**: selecciona el producto que contiene ese
     ingrediente (hoy solo existe "Suplevet", en 150g/250g).
   - **SEO → Meta título / Meta descripción**: que contengan el término
     exacto que la gente busca (el título ideal ronda 60 caracteres, la
     descripción 155).
   - **Preguntas frecuentes**: agrega 4-6 pares pregunta/respuesta. Cada
     pregunta debe ser una que alguien realmente escribiría en Google o le
     preguntaría a una IA. Respuestas cortas, directas, sin exagerar
     beneficios (mismo tono hedged — "ayuda a", "contribuye a" — que ya usa
     el resto del sitio, por regulación de suplementos).
3. **Publicar**.

Eso es todo — el acordeón visible y el `FAQPage` JSON-LD salen automáticos,
sin ningún paso extra.

---

## 5. Qué NO hace este sistema (para no generar falsas expectativas)

- **No garantiza posición en Google** ni que Gemini/ChatGPT te cite. Solo
  deja el contenido en el formato que esos sistemas *prefieren* leer.
- **No indexa solo** — hay que pedirle a Google que rastree la URL nueva
  desde Search Console (`Inspeccionar URL` → `Solicitar indexación`) después
  de cada deploy.
- **La velocidad de resultados no es inmediata.** Google puede tardar días o
  semanas. Los motores de IA suelen citar contenido que ya tiene algo de
  antigüedad/autoridad, no algo recién publicado.
- **No reemplaza autoridad externa.** Que un veterinario, blog de nutrición
  o foro externo mencione "lactoferrina" + "Suplevet" ayuda más al
  posicionamiento en IA que cualquier cambio dentro de la propia web.

---

## 6. Caso real ya publicado

- Slug: `lactoferrina-para-gatos`
- URL: `https://suplevet.pe/blog/lactoferrina-para-gatos`
- Producto vinculado: `suplevet-150g` (Suplevet, contiene lactoferrina real
  según `ingredientes_producto` en la base de datos)
- 5 preguntas frecuentes cargadas y visibles como acordeón + JSON-LD

Úsalo como plantilla de referencia para el próximo término.
