"use client";

// Reemplaza el patrón anterior `supabase.storage.from(bucket).upload(...)` +
// `.getPublicUrl(...)`: acá el navegador no tiene credenciales de R2, así que
// pide una URL de subida firmada a /api/admin/r2-upload-url (que valida que
// el usuario es un admin activo) y sube el archivo directo a R2 con esa URL.
export type CarpetaR2 =
  | "banners-fotos"
  | "productos-web-fotos"
  | "productos-web-videos"
  | "blog-fotos"
  | "cursos-contenido"
  | "testimonios-videos"
  | "pedidos-comprobantes";

// El PUT directo a R2 puede fallar por red o por CORS (el bucket solo
// autoriza ciertos orígenes — ver scripts/set-r2-cors.mjs). Un CORS block
// hace que el propio `fetch` rechace la promesa (no llega a haber respuesta
// que revisar con `.ok`), así que sin este try/catch esa excepción quedaba
// sin capturar y el caller (ej. MascotaFormDialog) se quedaba colgado en
// "Guardando…" para siempre en vez de avisar que la foto no se subió.
async function subirConUrlFirmada(
  endpoint: string,
  body: Record<string, string | undefined>,
  file: File
): Promise<string | null> {
  try {
    const urlRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!urlRes.ok) return null;

    const { uploadUrl, publicUrl, cacheControl } = (await urlRes.json()) as {
      uploadUrl: string;
      publicUrl: string;
      cacheControl?: string;
    };

    // Cache-Control viaja firmado en la URL (ver app/api/admin/r2-upload-url):
    // si no se reenvía tal cual, R2 responde 403 por firma inválida. Es lo que
    // hace que los archivos queden guardados con caché de larga duración en vez
    // de volver a descargarse en cada visita.
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        ...(cacheControl ? { "Cache-Control": cacheControl } : {}),
      },
      body: file,
    });
    if (!putRes.ok) return null;

    return publicUrl;
  } catch {
    return null;
  }
}

export async function uploadFileToR2(
  folder: CarpetaR2,
  file: File,
  subPath?: string
): Promise<string | null> {
  return subirConUrlFirmada(
    "/api/admin/r2-upload-url",
    { folder, subPath, fileName: file.name, contentType: file.type },
    file
  );
}

// Buckets que suben los clientes desde /mi-cuenta (no el admin) — ver
// app/api/portal/r2-upload-url, que exige que subPath empiece con el propio
// user.id en vez de validar contra la tabla admins.
export type CarpetaR2Portal = "mascotas-fotos" | "comunidad-fotos";

export async function uploadPortalFileToR2(
  folder: CarpetaR2Portal,
  file: File,
  subPath: string
): Promise<string | null> {
  return subirConUrlFirmada(
    "/api/portal/r2-upload-url",
    { folder, subPath, fileName: file.name, contentType: file.type },
    file
  );
}
