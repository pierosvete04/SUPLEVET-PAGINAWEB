"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface ProductoOpcion {
  slug: string;
  nombre: string;
}

interface BlogFiltersProps {
  productos: ProductoOpcion[];
}

// Filtros como estado de la URL (?producto=&orden=) — se puede compartir el
// link ya filtrado, y la pagina sigue siendo un Server Component (SEO).
export function BlogFilters({ productos }: BlogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-4 sm:justify-end">
      <div>
        <label
          htmlFor="filtro-producto"
          className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground"
        >
          Tipo de producto
        </label>
        <select
          id="filtro-producto"
          defaultValue={searchParams.get("producto") ?? ""}
          onChange={(e) => updateParam("producto", e.target.value)}
          className="rounded-lg border border-border bg-white px-4 py-2.5 font-body text-sm text-secondary"
        >
          <option value="">Todos</option>
          {productos.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="filtro-orden"
          className="mb-1 block font-body text-xs font-bold uppercase text-muted-foreground"
        >
          Ordenar por
        </label>
        <select
          id="filtro-orden"
          defaultValue={searchParams.get("orden") ?? "recientes"}
          onChange={(e) => updateParam("orden", e.target.value)}
          className="rounded-lg border border-border bg-white px-4 py-2.5 font-body text-sm text-secondary"
        >
          <option value="recientes">Más recientes</option>
          <option value="antiguos">Más antiguos</option>
        </select>
      </div>
    </div>
  );
}
