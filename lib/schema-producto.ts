import { esDepartamentoProvincia, type EnvioDistrito, type EnvioZona } from "@/lib/shipping";

// Piezas de JSON-LD (schema.org) que acompañan a la oferta de cada ficha de
// producto. Google las pide para las "fichas de comerciantes": sin ellas
// marca los avisos "Falta el campo shippingDetails" y "Falta el campo
// hasMerchantReturnPolicy" en Search Console, y el resultado de búsqueda sale
// sin el costo de envío ni las condiciones de devolución.
//
// Todo sale de datos reales: las zonas y tarifas vienen de la tabla
// envio_zonas / envio_distritos (editables desde /admin/envios), no de valores
// escritos a mano acá que se desactualizarían al primer cambio de tarifa.

const PAIS = "PE";
const MONEDA = "PEN";

/** Días hábiles que tarda el pedido en salir del almacén. Los pedidos de fin
 *  de semana o feriado se procesan el siguiente día hábil (ver /legal/envios). */
const DIAS_PREPARACION = { min: 0, max: 1 };

/** Tope declarado cuando la zona dice "72+ horas" y no da un máximo cerrado. */
const DIAS_TRANSITO_MAXIMO_ABIERTO = 5;

interface RangoDias {
  min: number;
  max: number;
}

// Convierte el texto libre de tiempo estimado al rango en días que espera
// schema.org. Los plazos se escriben a mano en /admin/envios y conviven las
// dos unidades: el motorizado en horas ("24–48 horas hábiles") y Shalom en
// días ("3 a 4 días hábiles"). Se detecta la unidad por la palabra, porque
// asumir horas convertía "3 a 4 días" en "1 día".
// Ante cualquier formato inesperado se cae a un rango amplio en vez de
// romper el JSON-LD.
export function diasDeTransito(tiempoEstimado: string): RangoDias {
  const numeros = tiempoEstimado.match(/\d+/g)?.map(Number) ?? [];
  if (numeros.length === 0) return { min: 1, max: DIAS_TRANSITO_MAXIMO_ABIERTO };

  const enHoras = /hora/i.test(tiempoEstimado);
  const aDias = (n: number) => (enHoras ? Math.max(1, Math.round(n / 24)) : Math.max(1, n));
  const min = aDias(numeros[0]);
  const max = numeros.length > 1 ? aDias(numeros[1]) : DIAS_TRANSITO_MAXIMO_ABIERTO;
  return { min, max: Math.max(min, max) };
}

// Tarifa que se declara para una zona. Se usa el MÁXIMO aplicable (el costo
// plano de la zona vs. los overrides por distrito de Dinsides) a propósito:
// declarar de menos y luego cobrar más en el checkout es motivo de sanción de
// Google; declarar el techo real nunca lo es. El envío sale gratis pasando el
// monto mínimo de la zona, pero eso depende del carrito completo y no de un
// producto suelto, así que no se puede afirmar acá.
function tarifaMaximaDeZona(zona: EnvioZona, distritos: EnvioDistrito[]): number {
  const overrides = distritos
    .filter((d) => d.zona_id === zona.id)
    .map((d) => Number(d.costo_envio));
  return Math.max(Number(zona.costo_envio), ...overrides);
}

function opcionDeEnvio(
  zona: EnvioZona,
  etiqueta: string,
  tarifa: number,
  tiempoEstimado: string
) {
  const transito = diasDeTransito(tiempoEstimado);
  return {
    "@type": "OfferShippingDetails",
    // Distingue las dos ofertas de la misma región en el panel de Google.
    shippingLabel: etiqueta,
    shippingRate: { "@type": "MonetaryAmount", value: tarifa, currency: MONEDA },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: PAIS,
      addressRegion: zona.departamentos,
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: DIAS_PREPARACION.min,
        maxValue: DIAS_PREPARACION.max,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: transito.min,
        maxValue: transito.max,
        unitCode: "DAY",
      },
    },
  };
}

/** Un OfferShippingDetails por cada opción de envío realmente ofrecida: el
 *  motorizado (solo donde llega) y la Agencia Shalom (en todo el país). */
export function detallesEnvioSchema(zonas: EnvioZona[], distritos: EnvioDistrito[]) {
  return zonas.flatMap((zona) => {
    const opciones = [
      opcionDeEnvio(zona, "Agencia Shalom", Number(zona.costo_shalom), zona.tiempo_shalom),
    ];
    // El motorizado solo existe donde el checkout lo ofrece: Lima
    // Metropolitana y Callao. Declararlo en provincia sería anunciar un
    // servicio que la persona no puede elegir.
    if (!zona.departamentos.every(esDepartamentoProvincia)) {
      opciones.unshift(
        opcionDeEnvio(
          zona,
          "Delivery motorizado",
          tarifaMaximaDeZona(zona, distritos),
          zona.tiempo_estimado
        )
      );
    }
    return opciones;
  });
}

// La política publicada en /legal/devoluciones es explícita: "todas las ventas
// son finales y no aceptamos devoluciones de mercancía". El reemplazo por
// producto dañado o equivocado existe, pero en schema.org eso no es una
// devolución (returns), es la garantía por defecto — declarar una ventana de
// devolución que no existe sería declarar en falso ante Google.
export const politicaDevolucionesSchema = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: PAIS,
  returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
} as const;
