import type { Metadata } from "next";

// robots.ts ya bloquea el rastreo de /admin, pero esta meta tag es la segunda
// capa: si algún buscador llega a /admin/login (la única página del panel
// alcanzable sin sesión) por un link externo, esta etiqueta le dice
// explícitamente que no la indexe ni siga sus enlaces.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
