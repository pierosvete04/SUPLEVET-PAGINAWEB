// Avisa al servidor que el contenido público cambió, para que las páginas
// cacheadas (lib/data/publico.ts) se regeneren en la siguiente visita en vez de
// seguir sirviendo lo viejo hasta que venza el TTL.
//
// Se llama DESPUÉS de que la escritura a Supabase salió bien, desde los
// formularios de /admin que tocan contenido que se ve en el sitio público.
//
// Deliberadamente no lanza ni bloquea: si la revalidación falla, el dato YA se
// guardó correctamente y lo único que pasa es que el sitio tarda un poco más en
// reflejarlo. Convertir eso en un error visible haría creer al editor que no se
// guardó nada, que es peor que la demora.
export async function revalidarSitioPublico(): Promise<void> {
  try {
    await fetch("/api/revalidar", { method: "POST" });
  } catch {
    // silencio intencional — ver comentario de arriba
  }
}
