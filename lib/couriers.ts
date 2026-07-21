// Empresas de entrega. Se elige en /admin/pedidos/[id] al despachar, no en el
// checkout: para el cliente el envío es "motorizado" o "Agencia Shalom" y el
// costo sale de la zona/distrito — qué empresa lo lleva es interno y puede
// cambiar pedido a pedido (Uber e inDriver, por ejemplo, cobran por distancia
// variable, así que no se pueden ofrecer con tarifa fija en la tienda).
export type Courier = "dinsides" | "shalom" | "olva" | "uber" | "indriver" | "propia" | "otro";

export const COURIER_POR_DEFECTO: Courier = "dinsides";

export const COURIERS: { id: Courier; label: string }[] = [
  { id: "dinsides", label: "Dinsides" },
  { id: "shalom", label: "Shalom" },
  { id: "olva", label: "Olva Courier" },
  { id: "uber", label: "Uber" },
  { id: "indriver", label: "inDriver" },
  { id: "propia", label: "Entrega propia" },
  { id: "otro", label: "Otro" },
];

/** Nombre a mostrar; para "otro" usa el texto libre que escribió el equipo. */
export function nombreCourier(
  courier: string | null | undefined,
  courierOtro?: string | null
): string | null {
  if (!courier) return null;
  if (courier === "otro") return courierOtro?.trim() || "Otro courier";
  return COURIERS.find((c) => c.id === courier)?.label ?? courier;
}
