import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let registrado = false;
let registradoSplitText = false;

// Registro único de ScrollTrigger — llamar desde componentes cliente antes de
// usar cualquier animación de scroll (components/shared/ScrollReveal.tsx).
export function registrarScrollTrigger() {
  if (registrado || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  registrado = true;
}

// Registro único de SplitText — usado por MaskedTextReveal.tsx para el efecto
// de texto enmascarado (gsap.com/demo/text-masking) en mensajes de bienvenida.
export function registrarSplitText() {
  if (registradoSplitText || typeof window === "undefined") return;
  gsap.registerPlugin(SplitText);
  registradoSplitText = true;
}

export { gsap, ScrollTrigger, SplitText };
