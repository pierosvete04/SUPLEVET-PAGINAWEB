"use client";

import { usePathname } from "next/navigation";

// Desvanecimiento sutil entre páginas — pedido explícito para que la navegación
// no se sienta como un salto brusco.
//
// Antes esto usaba framer-motion con <AnimatePresence mode="wait">. Se cambió a
// CSS por dos motivos, en este orden de importancia:
//
//   1. `mode="wait"` esperaba a que la página ANTERIOR terminara de desvanecerse
//      (180 ms) antes de siquiera montar la nueva. Sumado al render del servidor,
//      eso era ~360 ms de retraso puro encima de cada navegación, y el usuario lo
//      percibía como "la web tarda".
//
//   2. framer-motion se cargaba en TODAS las páginas del sitio público solo para
//      este fundido, y este componente era su único uso en todo el repo. Sacarlo
//      quita la librería entera del bundle del sitio público.
//
// El `key={pathname}` es lo que hace que funcione: al cambiar de ruta React
// desmonta y vuelve a montar el div, y el navegador reproduce la animación de
// entrada de nuevo. `animate-in fade-in` viene de tailwindcss-animate, que ya
// era una dependencia del proyecto.
//
// `motion-reduce:animate-none` respeta a quien pidió menos movimiento en su
// sistema — sin él, este fundido sería la única animación del sitio que ignora
// esa preferencia.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-in fade-in duration-200 motion-reduce:animate-none">
      {children}
    </div>
  );
}
