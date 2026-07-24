"use client";

import { useEffect, useState } from "react";

type Especie = "perro" | "gato" | "otro";

const cache: Partial<Record<"perro" | "gato", string[]>> = {};

function capitalizar(palabra: string): string {
  return palabra.charAt(0).toUpperCase() + palabra.slice(1);
}

async function cargarRazasPerro(): Promise<string[]> {
  const res = await fetch("https://dog.ceo/api/breeds/list/all");
  const data = await res.json();
  if (data.status !== "success") return [];
  const nombres: string[] = [];
  for (const [raza, subrazas] of Object.entries(data.message as Record<string, string[]>)) {
    if (subrazas.length === 0) {
      nombres.push(capitalizar(raza));
    } else {
      for (const sub of subrazas) nombres.push(`${capitalizar(sub)} ${capitalizar(raza)}`);
    }
  }
  return nombres.sort((a, b) => a.localeCompare(b, "es"));
}

async function cargarRazasGato(): Promise<string[]> {
  const res = await fetch("https://api.thecatapi.com/v1/breeds");
  const data = (await res.json()) as { name: string }[];
  return data.map((b) => b.name).sort((a, b) => a.localeCompare(b, "es"));
}

// Sugerencias de raza para el <datalist> del formulario de mascota — usa APIs
// públicas gratuitas y sin API key (dog.ceo para perros, TheCatAPI en modo
// anónimo para gatos). Es solo autocompletado: el campo sigue siendo texto
// libre, así que si la API falla o la especie es "otro" el cliente igual
// puede escribir lo que quiera.
export function useRazasSugeridas(especie: Especie): string[] {
  const [razas, setRazas] = useState<string[]>(especie === "otro" ? [] : (cache[especie] ?? []));

  useEffect(() => {
    if (especie === "otro") {
      setRazas([]);
      return;
    }
    const cacheada = cache[especie];
    if (cacheada) {
      setRazas(cacheada);
      return;
    }
    let cancelado = false;
    (especie === "perro" ? cargarRazasPerro() : cargarRazasGato())
      .then((nombres) => {
        cache[especie] = nombres;
        if (!cancelado) setRazas(nombres);
      })
      .catch(() => {
        if (!cancelado) setRazas([]);
      });
    return () => {
      cancelado = true;
    };
  }, [especie]);

  return razas;
}
