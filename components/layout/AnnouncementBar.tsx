// Franja superior desactivable (PLAN.md sección 16). Hoy son mensajes fijos;
// cuando exista `site_settings` en Supabase (Fase 4), este componente pasa a
// leer `activo`/`texto` de la base de datos en vez de la constante de abajo.

const MENSAJES = [
  "📦 Envíos a todo el Perú",
  "🐾 Especialistas en suplementos veterinarios",
  "💳 Aceptamos todas las tarjetas",
];

export function AnnouncementBar() {
  return (
    <div className="bg-secondary py-2 text-center font-body text-xs font-bold tracking-wide text-secondary-foreground md:text-sm">
      {MENSAJES.join("   ·   ")}
    </div>
  );
}
