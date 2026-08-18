"use client";

import { useEffect, useState } from "react";

/**
 * "Dashboard personalizado": qué columnas de una tabla de métricas se
 * muestran, elegido por cada usuario y recordado en su navegador (no hay
 * una sola configuración impuesta — el admin arma la suya, cada editor la
 * suya). Todas las columnas empiezan visibles ("sube todas las métricas")
 * y el usuario apaga las que no le interesan.
 */
export function useColumnasVisibles<T extends string>(storageKey: string, columnasDisponibles: readonly T[]) {
  const [visibles, setVisibles] = useState<Set<T>>(new Set(columnasDisponibles));
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(storageKey);
      if (guardado) {
        const lista = JSON.parse(guardado) as string[];
        setVisibles(new Set(lista.filter((c): c is T => (columnasDisponibles as readonly string[]).includes(c))));
      }
    } catch {
      // localStorage puede fallar (modo privado, cuota) — se queda con todas visibles.
    }
    setCargado(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!cargado) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(Array.from(visibles)));
    } catch {
      // idem
    }
  }, [storageKey, visibles, cargado]);

  function toggle(columna: T, mostrar: boolean) {
    setVisibles((prev) => {
      const copia = new Set(prev);
      if (mostrar) copia.add(columna);
      else copia.delete(columna);
      return copia;
    });
  }

  return { visibles, toggle };
}
