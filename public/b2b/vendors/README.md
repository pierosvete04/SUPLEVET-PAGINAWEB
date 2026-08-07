# Portal Suplevet

Portal interno de ventas. Un solo login que, según el rol de la cuenta, abre
el **panel administrable** o el **panel de vendedores**.

Reemplaza a los dos proyectos separados que había antes
(`PANEL ADMINISTRABLE` → `/administrador/` y `PANEL DE VENDEDORES` → `/reportes/`).

---

## Estructura

```
/
├── index.html              Login único. Resuelve el rol y redirige.
├── manifest.json           PWA (una sola app instalable)
├── sw.js                   Service worker con scope "/" para todo el portal
├── .htaccess               Caché, cabeceras de seguridad, HTTPS
├── assets/
│   ├── css/login.css       Estilos del login
│   ├── js/session.js       Sesión compartida: login, guard, refresh, logout
│   └── img/                Iconos de marca (compartidos)
├── admin/                  Panel administrable
│   ├── index.html
│   └── assets/{css,js}/
└── vendedor/               Panel de vendedores
    ├── index.html
    └── assets/{css,js}/
```

## Cómo funciona el acceso

1. El usuario entra a `/` y escribe correo y contraseña.
2. `session.js` autentica contra Supabase Auth.
3. Con el token, busca el `user.id`:
   - primero en `admins` (con `activo = true`) → **rol admin**
   - si no está, en `vendedores` → **rol vendedor**
   - si no está en ninguna → error explicando que la cuenta no tiene panel
4. Guarda la sesión en **una sola clave** (`suplevet_session`) y redirige
   a `/admin/` o `/vendedor/`.
5. Cada panel llama a `SVSession.require('<rol>')` al arrancar. Si no hay
   sesión, o si el rol no corresponde, el guard redirige él mismo.

Si un `id` existiera en las dos tablas, gana **admin**: es el permiso más
amplio y evita dejar a esa persona encerrada en el panel equivocado.

### Sesión

- **"Mantener la sesión abierta"** marcado → `localStorage` (sobrevive al cierre
  del navegador). Sin marcar → `sessionStorage` (se borra al cerrar la pestaña).
- El token se **renueva solo cada 45 minutos**. Antes expiraba a la hora y el
  panel empezaba a fallar en silencio.
- `getHeaders()` pide el token a la sesión en cada llamada, así que nunca
  usa uno caducado.
- Al cerrar sesión se revoca el refresh token en el servidor, no solo en el
  navegador.

## Reglas de negocio que conviene conocer

### Cobro parcial: en productos o en dinero

Un crédito se puede cobrar de dos formas, y las dos existen porque las dos pasan
en la calle:

- **En productos** — "me pagaron 5 de las 10 bolsas".
- **En dinero** — "me pagaron S/ 500 de los S/ 1000".

En modo dinero **el importe manda y es exacto**; las unidades se aproximan
dividiendo entre el precio unitario, porque `ventas.cantidad` es una columna de
enteros y no admite media bolsa. Lo que sí se garantiza siempre es que las dos
filas resultantes (la cobrada y el saldo) **suman el original tanto en dinero
como en unidades**, así que stock y contabilidad no se descuadran. Cuando el
monto no cae en un número redondo de unidades, la interfaz lo dice.

El saldo en dinero se calcula restando del total original, no multiplicando
unidades por precio: así el dinero se conserva aunque la fila no cumpla
`cantidad × precio = total`.

> La lógica está duplicada en `vendedor/assets/js/creditos.js` y
> `admin/assets/js/dashboard.js` (`cpCalcularReparto`). **Si cambias una,
> cambia la otra.**

### De quién es cada cliente

`esMiCliente()` (en `vendedor/assets/js/config.js`) es la regla única:

1. Si la veterinaria está **transferida** a alguien (`clientes_vet.vendedor_asignado_id`),
   manda la transferencia — aunque la zona no sea de esa persona. Y si está
   transferida a otro, no es suya aunque la zona sí lo sea.
2. Si no está transferida, manda la zona (`vendedores.zonas_asignadas`).
3. Un vendedor sin zonas asignadas ve todo.

La transferencia se asigna desde el panel admin, al editar una veterinaria.
Existe para casos como una sede fuera de la zona del vendedor que la empresa le
dio en exclusiva; antes eso se resolvía duplicando la fila con otra zona.

La misma regla está replicada en SQL como `cliente_es_mio(zona, asignado)` y es
la que aplica el RLS de `clientes_vet`. **Si cambias una, cambia la otra.**

## Cómo abrirlo en tu computadora

**Doble clic en `Iniciar Portal.bat`.** Levanta el servidor y abre el navegador
solo. Para cerrarlo, cierra la ventana negra.

> **No abras `index.html` con doble clic.** No va a funcionar. Con `file://` el
> navegador trata cada archivo como un origen distinto: el service worker no
> arranca, los saltos entre `/admin/` y `/vendedor/` fallan y las llamadas a
> Supabase quedan bloqueadas. Verás una lista de carpetas y errores de seguridad
> en la consola.

El `.bat` usa Node.js si está instalado (`tools/servidor.js`, que replica las
cabeceras de caché del `.htaccess` de producción) y si no, Python. Si no
encuentra ninguno, te dice cuál instalar. Si el puerto 8080 está ocupado, prueba
el siguiente hasta encontrar uno libre.

Ni `tools/` ni los `.bat` se suben al hosting: el workflow de deploy los excluye.

Alternativa manual, si prefieres la terminal:

```bash
node tools/servidor.js 8080
```

> El login necesita credenciales reales de Supabase: no hay modo demo.

## Despliegue

`.github/workflows/deploy.yml` sube todo por FTPS a Hostinger en cada push a
`main`. Necesita estos **secrets** en el repositorio:

| Secret | Qué es |
|---|---|
| `FTP_HOST` | Host FTP de Hostinger |
| `FTP_USER` | Usuario FTP |
| `FTP_PASS` | Contraseña FTP |
| `FTP_TARGET_DIR` | Carpeta destino, p. ej. `/portal/` |

### Antes del primer despliegue

1. Crear el repositorio en GitHub y configurar los cuatro secrets.
2. Decidir `FTP_TARGET_DIR`. Si reemplaza a una carpeta actual, avisar al
   equipo del cambio de enlace.
3. Los usuarios que ya tenían la PWA instalada del panel viejo tendrán que
   **desinstalarla y volver a instalarla**: el service worker anterior estaba
   registrado en otro scope y no se actualiza solo.

## Notas técnicas

- Sin build ni dependencias: HTML, CSS y JavaScript planos.
- Supabase se consume por REST directo (`/rest/v1/`), sin SDK.
- Los `?v=` en los `<script>` y `<link>` son el cache-buster. **Súbelos al
  editar un archivo**, o los navegadores servirán la versión vieja durante
  un año (así está configurada la caché en `.htaccess`).
- `sw.js`, `manifest.json` y los `.html` están excluidos de esa caché larga
  a propósito.
