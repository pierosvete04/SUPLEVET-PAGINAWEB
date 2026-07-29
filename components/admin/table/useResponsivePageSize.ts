"use client";

import { useEffect, useState } from "react";

const BREAKPOINTS = [
  { minWidth: 1280, pageSize: 20 },
  { minWidth: 768, pageSize: 15 },
  { minWidth: 0, pageSize: 10 },
];

function pageSizeForWidth(width: number): number {
  return BREAKPOINTS.find((b) => width >= b.minWidth)!.pageSize;
}

/**
 * Filas por página según el ancho de pantalla, para minimizar el uso de
 * paginación en monitores grandes (ver BREAKPOINTS arriba).
 */
export function useResponsivePageSize(): number {
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const onResize = () => setPageSize(pageSizeForWidth(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return pageSize;
}
