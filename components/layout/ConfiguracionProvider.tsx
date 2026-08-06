"use client";

import { createContext, useContext } from "react";
import {
  CONFIGURACION_POR_DEFECTO,
  type ConfiguracionSitioCliente,
} from "@/lib/configuracion-cliente";

// Reparte la configuración del sitio a los componentes cliente que la usan
// (Header, Footer, WhatsAppFloat, Faq, formularios), leyéndola UNA vez en el
// servidor en vez de una vez por componente en el navegador.
//
// Antes cada consumidor llamaba a un hook que hacía su propio useEffect + su
// propia consulta a Supabase. Como Header monta dos WhatsappCta (la barra normal
// y la condensada), el sitio pedía la MISMA fila cuatro veces por página, en
// cascada: 690, 996, 1378 y 1814 ms medidos en producción (ago 2026). Todo eso
// para un dato idéntico que además el servidor ya tenía a mano.
//
// El valor por defecto del contexto es CONFIGURACION_POR_DEFECTO en vez de null
// a propósito: los paneles (/admin, /mi-cuenta, /vet) no montan este provider
// porque no muestran el chrome del sitio público, y si algún componente
// compartido termina usándose ahí, debe recibir los valores de site-config.ts
// en lugar de reventar por contexto ausente.
const ConfiguracionContext = createContext<ConfiguracionSitioCliente>(CONFIGURACION_POR_DEFECTO);

export function ConfiguracionProvider({
  configuracion,
  children,
}: {
  configuracion: ConfiguracionSitioCliente;
  children: React.ReactNode;
}) {
  return (
    <ConfiguracionContext.Provider value={configuracion}>{children}</ConfiguracionContext.Provider>
  );
}

export function useConfiguracionContext(): ConfiguracionSitioCliente {
  return useContext(ConfiguracionContext);
}
