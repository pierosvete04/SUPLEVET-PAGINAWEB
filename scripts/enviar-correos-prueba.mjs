// Uso: node scripts/enviar-correos-prueba.mjs <correo-destino>
// Manda un correo real de cada tipo para revisar cómo se ven en Gmail /
// Outlook / Apple Mail, que es lo único que el preview de navegador
// (scripts/preview-correos.mjs) no puede comprobar: esos clientes recortan
// box-shadow y degradados.
//
// Usa el MISMO sendTransactionalEmail que las rutas de producción, no una
// copia — así el asunto, el remitente y el render son exactamente los que
// recibe un cliente. Los tres correos de auth NO se mandan desde acá: viven
// en el Edge Function `send-auth-email` y se disparan con
// scripts/enviar-correos-auth-prueba.mjs.
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";

const destino = process.argv[2];
if (!destino) {
  console.error("Falta el correo destino: node scripts/enviar-correos-prueba.mjs tucorreo@ejemplo.com");
  process.exit(1);
}

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(raiz, ".preview-correos");
mkdirSync(tmp, { recursive: true });

// Las variables de .env.local no las carga Node solo (Next las inyecta).
for (const linea of readFileSync(join(raiz, ".env.local"), "utf8").split("\n")) {
  const l = linea.trim();
  if (!l || l.startsWith("#") || !l.includes("=")) continue;
  const i = l.indexOf("=");
  process.env[l.slice(0, i)] = l.slice(i + 1).replace(/^"|"$/g, "");
}
// El aviso interno de ventas normalmente va a ventas@suplevet.pe; para la
// prueba se redirige al mismo destino que el resto.
process.env.VENTAS_NOTIFICATION_EMAIL = destino;

const bundle = join(tmp, "envio.cjs");
await build({
  stdin: {
    contents: `
      export { sendTransactionalEmail } from "@/lib/emails/send";
      export { notificarEquipoVentas } from "@/lib/emails/notificar-ventas";
      export { whatsappPedido } from "@/lib/whatsapp-mensajes";
    `,
    resolveDir: raiz,
    loader: "ts",
  },
  bundle: true,
  format: "cjs",
  platform: "node",
  jsx: "automatic",
  outfile: bundle,
  alias: { "@": raiz },
  external: ["react", "react-dom", "resend", "@react-email/*"],
  logLevel: "error",
});

const { sendTransactionalEmail, notificarEquipoVentas, whatsappPedido } =
  createRequire(import.meta.url)(bundle);

// Los enlaces de WhatsApp se construyen con el MISMO whatsappPedido() que usan
// las rutas de producción, nunca a mano. La primera versión de este script
// ponía un `https://wa.me/51920723721` pelado y los correos de prueba llegaron
// sin mensaje prellenado — parecía un bug del producto cuando en realidad el
// bug estaba acá, en los datos de prueba.
const ctx = { nombre: "Piero", numeroPedido: "W-1069" };

// Un caso por cada `tipo` de EmailPayload, más las dos variantes del correo de
// verificación (Yape y contra entrega) que renderizan cuerpos distintos.
// El correo de pedido recibido cambia de cuerpo según cómo se pagó, así que se
// prueban los tres caminos: el que espera voucher, el de contra entrega y el de
// tarjeta (que no pide nada al cliente).
const PEDIDO_BASE = {
  ...ctx,
  items: [
    { nombre: "Suplevet Articulaciones 150 g", cantidad: 2, precio: 89.9 },
    { nombre: "Suplevet Digestivo 90 g", cantidad: 1, precio: 64.5 },
  ],
  subtotal: 244.3, envio: 12, descuento: 20, total: 236.3,
  direccion: {
    nombreCompleto: "Piero Sánchez", direccion: "Calle Río Elba 132 — Dpto 402",
    distrito: "La Molina, Lima", telefono: "920723721",
  },
};

const CASOS = [
  ["pedido_confirmado", {
    ...PEDIDO_BASE, metodoPago: "Yape",
    whatsappUrl: whatsappPedido("enviarVoucher", ctx),
  }],
  ["pedido_confirmado", {
    ...PEDIDO_BASE, numeroPedido: "W-1070", metodoPago: "contra entrega",
    whatsappUrl: whatsappPedido("coordinarEntrega", { ...ctx, numeroPedido: "W-1070" }),
  }],
  ["pedido_confirmado", {
    ...PEDIDO_BASE, numeroPedido: "W-1071", metodoPago: "tarjeta",
    whatsappUrl: whatsappPedido("enviarVoucher", { ...ctx, numeroPedido: "W-1071" }),
  }],
  ["pago_confirmado", {
    ...ctx, puntosGanados: 180,
    whatsappUrl: whatsappPedido("coordinarEntrega", ctx),
  }],
  ["pago_error", {
    ...ctx, motivo: "tu tarjeta fue rechazada por el banco",
    whatsappUrl: whatsappPedido("problemaPago", {
      ...ctx, motivo: "tu tarjeta fue rechazada por el banco",
    }),
  }],
  ["pago_cancelado", {
    ...ctx, motivo: "no llegamos a despacharlo",
    whatsappUrl: whatsappPedido("pedidoCancelado", {
      ...ctx, motivo: "no llegamos a despacharlo",
    }),
  }],
  ["pedido_en_preparacion", { nombre: "Piero", numeroPedido: "W-1069" }],
  ["pedido_en_camino", { nombre: "Piero", numeroPedido: "W-1069" }],
  ["pedido_devuelto", {
    ...ctx, motivo: "no hubo quien recibiera en la dirección",
    whatsappUrl: whatsappPedido("reenvio", {
      ...ctx, motivo: "no hubo quien recibiera en la dirección",
    }),
  }],
  ["puntos_acreditados", {
    nombre: "Piero", puntosGanados: 180, origen: "tu pedido W-1069",
    saldoAnterior: 420, saldoNuevo: 600,
  }],
  ["canje_confirmado", {
    nombre: "Piero", nombreCanje: "Descuento de S/20", puntosUsados: 500,
    codigoCanje: "SUPLE-4F2A9C", vigenciaDias: 30,
  }],
  // Un item con foto y otro sin ella, a propósito: así la prueba también
  // ejercita el marcador que reemplaza a la imagen faltante.
  ["carrito_abandonado", {
    nombre: "Piero",
    items: [
      {
        nombre: "Suplevet Articulaciones 150 g", cantidad: 2, precio: 89.9,
        imagen: "https://pub-ad8cb8681bd8458ba537a43f6735a89d.r2.dev/productos-web-fotos/suplevet-150g/hero-estudio.png",
      },
      { nombre: "Suplevet Digestivo 90 g", cantidad: 1, precio: 64.5 },
    ],
    subtotal: 244.3, puntos: 61,
  }],
  ["libro_reclamacion_respondido", {
    nombre: "Piero", correlativo: "2026-0042", tipoSolicitud: "reclamo",
    respuesta: "Revisamos tu caso y procesamos el reenvío del pedido sin costo adicional.",
  }],
];

// Resend limita a 2 peticiones por segundo en el plan base: sin pausa, la
// mitad de los envíos vuelve con 429 y el correo nunca sale.
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// Filtro opcional para reenviar solo unos cuantos y no volver a llenar la
// bandeja: `node scripts/enviar-correos-prueba.mjs correo@x.com pago_ devuelto`
// manda solo los tipos que contengan alguno de esos textos. Sin filtro, manda
// todos (incluidos los avisos internos de ventas).
const filtros = process.argv.slice(3);
const coincide = (t) => filtros.length === 0 || filtros.some((f) => t.includes(f));

let ok = 0;
const fallos = [];

for (const [tipo, data] of CASOS) {
  if (!coincide(tipo)) continue;
  const etiqueta = `${tipo}${data.metodoPago ? ` (${data.metodoPago})` : ""}`;
  const { error } = await sendTransactionalEmail(destino, { tipo, data });
  if (error) {
    fallos.push([etiqueta, error]);
    console.log(`  FALLO  ${etiqueta} — ${error}`);
  } else {
    ok++;
    console.log(`  ok     ${etiqueta}`);
  }
  await pausa(700);
}

// Aviso interno al equipo de ventas: plantilla y destinatario distintos, por
// eso no pasa por sendTransactionalEmail.
for (const evento of ["nuevo_pedido", "pago_confirmado", "pago_rechazado", "pago_cancelado"]) {
  if (!coincide("interno_ventas")) continue;
  const { error } = await notificarEquipoVentas(evento, {
    pedidoId: "00000000-0000-0000-0000-000000000069",
    numeroPedido: "W-1069",
    clienteNombre: "Piero Sánchez",
    clienteEmail: destino,
    clienteTelefono: "920723721",
    metodoPago: "Yape",
    total: 256.3,
  });
  const etiqueta = `interno_ventas (${evento})`;
  if (error) {
    fallos.push([etiqueta, error]);
    console.log(`  FALLO  ${etiqueta} — ${error}`);
  } else {
    ok++;
    console.log(`  ok     ${etiqueta}`);
  }
  await pausa(700);
}

console.log(`\n${ok} enviados a ${destino}, ${fallos.length} con error.`);
if (fallos.length) process.exitCode = 1;
