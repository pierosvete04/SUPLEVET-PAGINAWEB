// Uso: node scripts/preview-correos.mjs
// Renderiza los 16 correos transaccionales y arma una sola página HTML para
// revisarlos juntos antes de mandar nada real. El resultado se abre en el
// navegador; cada correo va en un <iframe> aislado para que los estilos de la
// galería no se mezclen con los del correo.
//
// No reemplaza a la prueba de envío: Gmail y Outlook recortan CSS que el
// navegador sí respeta (box-shadow, degradados). Esto sirve para revisar
// composición, jerarquía y textos; el envío real sirve para verificar cómo
// degrada cada cliente.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { render } from "@react-email/render";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const salidaDir = join(raiz, ".preview-correos");
mkdirSync(salidaDir, { recursive: true });

const WHATSAPP = "https://wa.me/51920723721?text=Hola%2C%20soy%20Piero";

// Cada entrada: archivo del template + props de ejemplo. Los datos son
// verosímiles a propósito (nombres reales de producto, montos con decimales,
// distritos de Lima) — con datos de relleno no se ven los problemas de
// desborde que sí aparecen con contenido real.
const CASOS = [
  ["pedido-confirmado", "Pedido recibido", {
    nombre: "Piero", numeroPedido: "W-1069",
    items: [
      { nombre: "Suplevet Articulaciones 150 g", cantidad: 2, precio: 89.9 },
      { nombre: "Suplevet Digestivo 90 g", cantidad: 1, precio: 64.5 },
    ],
    envio: 12,
    direccion: {
      nombreCompleto: "Piero Sánchez", direccion: "Calle Río Elba 132, Dpto 402",
      distrito: "La Molina, Lima", telefono: "920723721",
    },
  }],
  ["pago-en-verificacion", "Pago en verificación (Yape)", {
    nombre: "Piero", numeroPedido: "W-1069", metodoPago: "Yape", whatsappUrl: WHATSAPP,
  }],
  ["pago-en-verificacion", "Pago en verificación (contra entrega)", {
    nombre: "Piero", numeroPedido: "W-1069", metodoPago: "contra entrega", whatsappUrl: WHATSAPP,
  }],
  ["pago-confirmado", "Pago confirmado", {
    nombre: "Piero", numeroPedido: "W-1069", puntosGanados: 180, whatsappUrl: WHATSAPP,
  }],
  ["pago-rechazado", "Pago rechazado", {
    nombre: "Piero", numeroPedido: "W-1069",
    motivo: "tu tarjeta fue rechazada por el banco", whatsappUrl: WHATSAPP,
  }],
  ["pedido-cancelado", "Pedido cancelado", {
    nombre: "Piero", numeroPedido: "W-1069",
    motivo: "no llegamos a despacharlo", whatsappUrl: WHATSAPP,
  }],
  ["pedido-en-preparacion", "En preparación", { nombre: "Piero", numeroPedido: "W-1069" }],
  ["pedido-en-camino", "En camino", { nombre: "Piero", numeroPedido: "W-1069" }],
  ["pedido-devuelto", "Pedido devuelto", {
    nombre: "Piero", numeroPedido: "W-1069",
    motivo: "no hubo quien recibiera en la dirección", whatsappUrl: WHATSAPP,
  }],
  ["suplepoints-acreditados", "SuplePoints acreditados", {
    nombre: "Piero", puntosGanados: 180, origen: "tu pedido W-1069",
    saldoAnterior: 420, saldoNuevo: 600,
  }],
  ["canje-confirmado", "Canje confirmado", {
    nombre: "Piero", nombreCanje: "Descuento de S/20", puntosUsados: 500,
    codigoCanje: "SUPLE-4F2A9C", vigenciaDias: 30,
  }],
  // Un item con foto y otro sin ella, a propósito: así el preview muestra
  // también el marcador que reemplaza a la imagen faltante.
  ["carrito-abandonado", "Carrito abandonado", {
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
  ["libro-reclamacion-respondido", "Libro de reclamaciones", {
    nombre: "Piero", correlativo: "2026-0042", tipoSolicitud: "reclamo",
    respuesta: "Revisamos tu caso y procesamos el reenvío del pedido sin costo adicional.",
  }],
  ["otp-login", "Código de acceso (OTP)", { code: "482915" }],
  ["reset-password", "Restablecer contraseña", { confirmationUrl: "https://suplevet.pe/reset?token=demo" }],
  ["change-email", "Cambio de correo", { confirmationUrl: "https://suplevet.pe/confirm?token=demo" }],
];

// Los templates son .tsx con imports de "@/..." — se compilan a un bundle CJS
// temporal para poder importarlos desde Node sin levantar Next.
const entradas = [...new Set(CASOS.map(([archivo]) => archivo))];
const bundlePath = join(salidaDir, "templates.cjs");

await build({
  stdin: {
    contents: entradas
      .map((n, i) => `export { default as T${i} } from "../emails/${n}";`)
      .join("\n"),
    resolveDir: salidaDir,
    loader: "ts",
  },
  bundle: true,
  format: "cjs",
  platform: "node",
  jsx: "automatic",
  outfile: bundlePath,
  external: ["react", "react-dom", "@react-email/*"],
  logLevel: "error",
});

const { createRequire } = await import("node:module");
const modulos = createRequire(import.meta.url)(bundlePath);
const React = (await import("react")).default;

const tarjetas = [];
for (const [archivo, titulo, props] of CASOS) {
  const Componente = modulos[`T${entradas.indexOf(archivo)}`];
  const html = await render(React.createElement(Componente, props));
  tarjetas.push({ titulo, archivo, html });
  console.log(`  ${titulo}`);
}

const galeria = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Correos Suplevet — preview</title>
<style>
  :root { color-scheme: light; }
  body { margin:0; background:#15243a; font-family:'DM Sans',system-ui,sans-serif; color:#fff; }
  header { padding:28px 32px 8px; }
  h1 { margin:0; font-size:20px; letter-spacing:.02em; }
  p.sub { margin:6px 0 0; font-size:13px; color:rgba(255,255,255,.55); max-width:70ch; line-height:1.6; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(560px,1fr)); gap:24px; padding:24px 32px 60px; }
  .card { background:#1d3050; border-radius:16px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,.35); }
  .card h2 { margin:0; padding:14px 18px; font-size:13px; font-weight:700; letter-spacing:.06em;
             text-transform:uppercase; background:rgba(0,0,0,.22); display:flex;
             justify-content:space-between; align-items:center; }
  .card h2 code { font-size:10.5px; font-weight:400; color:rgba(255,255,255,.45); letter-spacing:0; }
  iframe { width:100%; height:900px; border:0; background:#F0EEEA; display:block; }
</style></head>
<body>
<header>
  <h1>Correos transaccionales · Suplevet</h1>
  <p class="sub">Render de navegador. Gmail y Outlook recortan parte del CSS (sombras y degradados),
  así que el envío real puede verse un paso más plano — la composición, la jerarquía y los textos
  sí son fieles.</p>
</header>
<div class="grid">
${tarjetas
  .map(
    (t) =>
      `<div class="card"><h2>${t.titulo}<code>${t.archivo}.tsx</code></h2>` +
      `<iframe srcdoc="${t.html.replace(/"/g, "&quot;")}"></iframe></div>`
  )
  .join("\n")}
</div>
</body></html>`;

const destino = join(salidaDir, "index.html");
writeFileSync(destino, galeria, "utf8");
console.log(`\nListo: ${destino}`);
