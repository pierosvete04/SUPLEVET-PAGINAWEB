// ══════════════════════════════════════════════════════════════
// Servidor local para desarrollo — Portal Suplevet
//
// El portal NO funciona abriendo index.html con doble clic: en file://
// el navegador trata cada archivo como un origen distinto, así que el
// service worker no arranca, los saltos entre /admin/ y /vendedor/ fallan
// y las llamadas a Supabase quedan bloqueadas.
//
// Esto levanta un servidor real en localhost. Replica las cabeceras del
// .htaccess de producción para que lo que pruebas aquí se comporte igual
// que lo desplegado.
//
// No se sube al hosting: el workflow de deploy excluye la carpeta tools/.
// ══════════════════════════════════════════════════════════════
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO_INICIAL = parseInt(process.argv[2], 10) || 8080;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8'
};

// Igual que en producción: el service worker, el manifest y el HTML nunca
// se cachean, o el navegador se queda con una versión vieja para siempre.
function sinCache(rel) {
  const base = path.basename(rel);
  return base === 'sw.js' || base === 'manifest.json' || rel.endsWith('.html');
}

function servir(req, res) {
  let rel;
  try {
    // URL nativa en vez de url.parse(), que está deprecada y sacaba un aviso
    // feo en la consola cada vez que arrancaba el servidor.
    rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    res.writeHead(400); res.end('Peticion mal formada'); return;
  }

  if (rel.endsWith('/')) rel += 'index.html';

  // Nadie sale de la carpeta del proyecto por mucho ../ que ponga.
  const destino = path.join(RAIZ, path.normalize(rel).replace(/^(\.\.[\\/])+/, ''));
  if (!destino.startsWith(RAIZ)) {
    res.writeHead(403); res.end('Fuera del proyecto'); return;
  }

  fs.stat(destino, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1><p>No existe: ' + rel + '</p><p><a href="/">Volver al inicio</a></p>');
      return;
    }
    const ext = path.extname(destino).toLowerCase();
    const cabeceras = {
      'Content-Type': TIPOS[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'X-Content-Type-Options': 'nosniff'
    };
    cabeceras['Cache-Control'] = sinCache(rel) ? 'no-store' : 'public, max-age=60';

    res.writeHead(200, cabeceras);
    fs.createReadStream(destino).pipe(res).on('error', () => res.end());
  });
}

// Si el puerto está ocupado, prueba el siguiente en vez de morir.
function arrancar(puerto, intentos) {
  const srv = http.createServer(servir);
  srv.on('error', (e) => {
    if (e.code === 'EADDRINUSE' && intentos > 0) {
      arrancar(puerto + 1, intentos - 1);
    } else {
      console.error('\n  No se pudo abrir el servidor: ' + e.message + '\n');
      process.exit(1);
    }
  });
  srv.listen(puerto, '127.0.0.1', () => {
    const dir = 'http://localhost:' + puerto + '/';
    console.log('');
    console.log('  Portal Suplevet listo');
    console.log('  ' + dir);
    console.log('');
    console.log('  Cierra esta ventana para detener el servidor.');
    console.log('');
    // Abre el navegador por defecto.
    require('child_process').exec('start "" "' + dir + '"', { shell: 'cmd.exe' });
  });
}

arrancar(PUERTO_INICIAL, 20);
