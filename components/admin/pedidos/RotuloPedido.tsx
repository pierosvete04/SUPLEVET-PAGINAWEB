"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PedidoAdmin } from "@/lib/data/pedidos-admin";
import { cobraAlEntregar } from "@/lib/data/productos-shared";
import { etiquetaCorta } from "@/lib/documento";
import { COURIER_POR_DEFECTO, nombreCourier } from "@/lib/couriers";
import {
  fechaComoInput,
  fechaDesdeInput,
  fechaEntregaEstimada,
  formatFechaRotulo,
} from "@/lib/rotulo";

type Orientacion = "horizontal" | "vertical";

// Ancho físico del rollo térmico y ancho realmente imprimible dentro de él
// (los cabezales de 80 mm no llegan a los bordes). LARGO_MM es el lado largo
// del rótulo, el que corre a lo largo del papel cuando se imprime girado.
const ROLLO_MM = 80;
const ANCHO_UTIL_MM = 72;
const LARGO_MM = 124;

// El rótulo NO lleva dirección a propósito: la guía de Dinsides indica poner
// dirección y referencia solo en el registro web, no en la etiqueta del
// paquete. La ubicación exacta se le pasa al courier desde el panel (botón
// "Copiar link" en la tarjeta de dirección), no impresa acá.
interface DireccionConDocumento {
  distrito?: string;
  provincia?: string;
  departamento?: string;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
}

export function RotuloPedido({ pedido }: { pedido: PedidoAdmin }) {
  const [codigo, setCodigo] = useState(pedido.codigo_rotulo ?? "");
  const [fecha, setFecha] = useState(fechaComoInput(fechaEntregaEstimada(pedido.zona_envio)));
  const [orientacion, setOrientacion] = useState<Orientacion>("horizontal");
  const [guardando, setGuardando] = useState(false);

  const dir = (pedido.direccion_envio ?? {}) as DireccionConDocumento;
  const cobrar = cobraAlEntregar(pedido.forma_pago);
  const numeroPedido = pedido.shopify_order_number ?? `W-${pedido.id.slice(0, 8)}`;
  const documento = dir.numeroDocumento
    ? `${etiquetaCorta(dir.tipoDocumento)} ${dir.numeroDocumento}`
    : null;
  // Distrito es lo que el motorizado usa para armar su ruta; si el pedido es
  // de provincia (Shalom) el distrito solo no basta, así que se agrega la
  // ciudad para que la agencia de destino quede clara.
  const zonaEntrega = [dir.distrito, dir.departamento && dir.departamento !== dir.distrito ? dir.departamento : null]
    .filter(Boolean)
    .join(" — ");

  // Dinsides rastrea el paquete por SU código, así que sin ese número el
  // rótulo no sirve y no se deja imprimir. Los demás couriers no lo exigen:
  // ahí el campo es opcional y, si se deja vacío, el rótulo cae al número de
  // pedido para que la etiqueta igual quede identificable.
  const courierId = pedido.courier ?? COURIER_POR_DEFECTO;
  const courierNombre = nombreCourier(courierId, pedido.courier_otro);
  const courierEsDinsides = courierId === "dinsides";
  const codigoLimpio = codigo.trim();
  const faltaCodigo = courierEsDinsides && !codigoLimpio;

  // El código va al pedido para no volver a escribirlo si hay que reimprimir
  // el rótulo (paquete dañado, etiqueta despegada, segundo intento de entrega).
  async function imprimir() {
    if (faltaCodigo) return;
    if (codigoLimpio !== (pedido.codigo_rotulo ?? "")) {
      setGuardando(true);
      await createClient()
        .from("pedidos")
        .update({ codigo_rotulo: codigoLimpio || null })
        .eq("id", pedido.id);
      setGuardando(false);
    }
    window.print();
  }

  return (
    <div className="pantalla-rotulo min-h-screen bg-soft-gray font-body">
      <style>{`
        @media print {
          @page {
            size: ${orientacion === "horizontal" ? `${ROLLO_MM}mm ${LARGO_MM}mm` : `${ROLLO_MM}mm auto`};
            margin: 0;
          }
          html, body { background: #fff !important; margin: 0; padding: 0; }
          .no-imprimir { display: none !important; }
          /* El min-h-screen de pantalla añadiría papel en blanco de más en una
             impresora de rollo continuo, que corta donde termina el contenido. */
          .pantalla-rotulo { min-height: 0 !important; background: #fff !important; }
          .hoja-rotulo {
            display: block;
            position: relative;
            margin: 0;
            padding: 0;
            background: #fff;
            ${orientacion === "horizontal" ? `width: ${ROLLO_MM}mm; height: ${LARGO_MM}mm;` : ""}
          }
          .rotulo {
            ${
              orientacion === "horizontal"
                ? // Se ancla arriba a la izquierda y se gira sobre esa misma
                  // esquina, en vez de centrarlo: centrado, cualquier papel más
                  // alto que el rótulo deja margen en blanco arriba, y en una
                  // térmica de rollo ese margen es papel desperdiciado en cada
                  // impresión. El translateY compensa que rotar -90° sobre la
                  // esquina superior izquierda deja el bloque por encima del
                  // origen.
                  `position: absolute; top: 0; left: ${(ROLLO_MM - ANCHO_UTIL_MM) / 2}mm;
                   transform-origin: top left;
                   transform: translateY(${LARGO_MM}mm) rotate(-90deg);`
                : `margin: 0 auto;`
            }
            box-shadow: none;
          }
        }
      `}</style>

      <div className="no-imprimir mx-auto flex max-w-3xl flex-col gap-4 p-6">
        <Link
          href={`/admin/pedidos/${pedido.id}`}
          className="flex w-fit items-center gap-1 text-sm font-medium text-secondary"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al pedido {numeroPedido}
        </Link>

        <div className="rounded-lg border bg-white p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="codigo-rotulo">
                Código ID del paquete{" "}
                {courierEsDinsides ? (
                  <span className="font-normal text-destructive">· obligatorio para Dinsides</span>
                ) : (
                  <span className="font-normal text-muted-foreground">· opcional</span>
                )}
              </Label>
              <Input
                id="codigo-rotulo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej. 14074656"
                autoFocus
                aria-invalid={faltaCodigo}
                className={faltaCodigo ? "border-destructive" : undefined}
              />
              <p className="text-xs text-muted-foreground">
                {courierEsDinsides
                  ? "Escribe el código que te dio Dinsides: sin él no pueden rastrear el paquete."
                  : `Opcional con ${courierNombre}. Si lo dejas vacío, el rótulo usa el número de pedido (${numeroPedido}).`}
              </p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="fecha-rotulo">Fecha de entrega</Label>
              <Input
                id="fecha-rotulo"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Calculada por la zona de envío. Puedes ajustarla.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
            <div className="flex rounded-md border p-0.5">
              {(["horizontal", "vertical"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrientacion(o)}
                  className={`rounded px-3 py-1.5 text-xs font-bold capitalize ${
                    orientacion === o ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>

            <Button onClick={imprimir} disabled={guardando || faltaCodigo}>
              <Printer className="h-4 w-4" /> {guardando ? "Guardando…" : "Imprimir rótulo"}
            </Button>

            <p className={`text-xs ${faltaCodigo ? "font-medium text-destructive" : "text-muted-foreground"}`}>
              {faltaCodigo
                ? "Escribe el código de Dinsides para poder imprimir."
                : "Papel térmico de 80 mm. Si la horizontal sale cortada, usa vertical."}
            </p>
          </div>
        </div>
      </div>

      <div className="hoja-rotulo flex justify-center p-6">
        <Rotulo
          codigo={codigoLimpio || (courierEsDinsides ? "—" : numeroPedido)}
          destinatario={pedido.cliente_nombre ?? "—"}
          telefono={pedido.cliente_telefono ?? "—"}
          documento={documento}
          zonaEntrega={zonaEntrega || "—"}
          cobrar={cobrar}
          monto={Number(pedido.total)}
          fechaEntrega={formatFechaRotulo(fechaDesdeInput(fecha))}
          courier={nombreCourier(pedido.courier ?? COURIER_POR_DEFECTO, pedido.courier_otro)}
          orientacion={orientacion}
        />
      </div>
    </div>
  );
}

interface RotuloProps {
  codigo: string;
  destinatario: string;
  telefono: string;
  documento: string | null;
  zonaEntrega: string;
  cobrar: boolean;
  monto: number;
  fechaEntrega: string;
  courier: string | null;
  orientacion: Orientacion;
}

// 72 mm es el ancho realmente imprimible de un rollo de 80 mm. En horizontal
// el rótulo se gira 90° al imprimir, así que ese ancho pasa a ser el ALTO y el
// largo (124 mm) corre a lo largo del papel — que es lo que permite letras más
// grandes. En vertical el rótulo mide 72 mm de ancho y crece hacia abajo.
// Todo en negro puro y sin grises: las térmicas no tienen medios tonos.
const MEDIDAS = {
  horizontal: {
    ancho: `${LARGO_MM}mm`,
    alto: `${ANCHO_UTIL_MM}mm`,
    nombre: "17pt",
    telefono: "15pt",
    monto: "18pt",
  },
  vertical: {
    ancho: `${ANCHO_UTIL_MM}mm`,
    alto: "auto",
    nombre: "14pt",
    telefono: "13pt",
    monto: "16pt",
  },
} as const;

function Rotulo({
  codigo,
  destinatario,
  telefono,
  documento,
  zonaEntrega,
  cobrar,
  monto,
  fechaEntrega,
  courier,
  orientacion,
}: RotuloProps) {
  const m = MEDIDAS[orientacion];
  const esVertical = orientacion === "vertical";
  return (
    <div
      className="rotulo bg-white text-black shadow-md"
      style={{
        width: m.ancho,
        height: m.alto,
        border: "0.8mm solid #000",
        padding: "3mm",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, Helvetica, sans-serif",
        lineHeight: 1.15,
      }}
    >
      {/* A 72 mm de ancho el encabezado no entra en una sola fila: en vertical
          el código baja a su propia línea para no salirse del papel. */}
      <div
        style={{
          display: "flex",
          alignItems: esVertical ? "flex-start" : "center",
          flexDirection: esVertical ? "column" : "row",
          gap: esVertical ? "1.5mm" : "3mm",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "2.5mm", flex: 1, minWidth: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/variantes/variante-30-horizontal-negro.png"
            alt="Suplevet"
            style={{ height: esVertical ? "7mm" : "9mm", width: "auto", objectFit: "contain" }}
          />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "7pt", letterSpacing: "0.5pt", margin: 0 }}>REMITENTE</p>
            <p style={{ fontSize: "11pt", fontWeight: 700, margin: 0 }}>SUPLEVET</p>
          </div>
        </div>
        {courier && (
          <div style={{ minWidth: 0, textAlign: esVertical ? "left" : "right" }}>
            <p style={{ fontSize: "7pt", letterSpacing: "0.5pt", margin: 0 }}>ENVÍO POR</p>
            <p style={{ fontSize: "11pt", fontWeight: 700, margin: 0, textTransform: "uppercase" }}>
              {courier}
            </p>
          </div>
        )}

        <div style={{ textAlign: esVertical ? "left" : "right", width: esVertical ? "100%" : "auto" }}>
          <p style={{ fontSize: "7pt", letterSpacing: "0.5pt", margin: 0 }}>CÓDIGO ID</p>
          <p
            style={{
              fontSize: "16pt",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "0.5pt",
              overflowWrap: "anywhere",
            }}
          >
            {codigo}
          </p>
        </div>
      </div>

      <div style={{ borderTop: "0.5mm solid #000", margin: "2.5mm 0" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2mm" }}>
        <Campo etiqueta="DESTINATARIO" valor={destinatario} tamano={m.nombre} />
        <div style={{ display: "flex", gap: esVertical ? "2mm" : "4mm", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 40%", minWidth: 0 }}>
            <Campo etiqueta="TELÉFONO" valor={telefono} tamano={m.telefono} />
          </div>
          {documento && (
            <div style={{ flex: "1 1 40%", minWidth: 0 }}>
              <Campo etiqueta="DOCUMENTO" valor={documento} tamano="11pt" />
            </div>
          )}
        </div>
        <Campo etiqueta="DISTRITO DE ENTREGA" valor={zonaEntrega} tamano={m.telefono} />
      </div>

      <div
        style={{
          display: "flex",
          gap: "2.5mm",
          marginTop: "2mm",
          flexDirection: esVertical ? "column" : "row",
        }}
      >
        <div
          style={{
            flex: 1.4,
            minWidth: 0,
            // Contra entrega va en negativo (fondo negro) para que el
            // motorizado no pueda confundirlo con un paquete ya pagado.
            background: cobrar ? "#000" : "#fff",
            color: cobrar ? "#fff" : "#000",
            border: "0.5mm solid #000",
            padding: "1.8mm 2.5mm",
          }}
        >
          <p style={{ fontSize: "7pt", letterSpacing: "0.5pt", margin: 0 }}>
            {cobrar ? "COBRAR AL ENTREGAR" : "ESTADO DE PAGO"}
          </p>
          <p style={{ fontSize: cobrar ? m.monto : "12pt", fontWeight: 700, margin: 0 }}>
            {cobrar ? `S/ ${monto.toFixed(2)}` : "PAGADO — NO COBRAR"}
          </p>
        </div>

        <div style={{ flex: 1, minWidth: 0, border: "0.5mm solid #000", padding: "1.8mm 2.5mm" }}>
          <p style={{ fontSize: "7pt", letterSpacing: "0.5pt", margin: 0 }}>FECHA DE ENTREGA</p>
          <p style={{ fontSize: "14pt", fontWeight: 700, margin: 0 }}>{fechaEntrega}</p>
        </div>
      </div>
    </div>
  );
}

function Campo({ etiqueta, valor, tamano }: { etiqueta: string; valor: string; tamano: string }) {
  return (
    <div>
      <p style={{ fontSize: "7pt", letterSpacing: "0.5pt", margin: 0 }}>{etiqueta}</p>
      <p
        style={{
          fontSize: tamano,
          fontWeight: 700,
          margin: 0,
          textTransform: "uppercase",
          overflowWrap: "anywhere",
        }}
      >
        {valor}
      </p>
    </div>
  );
}
