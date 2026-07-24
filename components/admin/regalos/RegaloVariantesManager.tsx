"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Gift, Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getVariantesDeRegalo, type RegaloVariante, type TallaBandana } from "@/lib/regalo-variantes";
import type { Regalo } from "@/lib/regalos";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VarianteForm } from "@/components/admin/regalos/VarianteForm";
import { BrandedLoader } from "@/components/ui/branded-loader";

const TALLAS: TallaBandana[] = ["S", "M", "L"];

interface RegaloVariantesManagerProps {
  regaloId: string;
}

interface GrupoDiseno {
  nombre: string;
  porTalla: Partial<Record<TallaBandana, RegaloVariante>>;
}

function agruparPorDiseno(variantes: RegaloVariante[]): GrupoDiseno[] {
  const grupos = new Map<string, GrupoDiseno>();
  for (const v of variantes) {
    const grupo = grupos.get(v.nombre) ?? { nombre: v.nombre, porTalla: {} };
    grupo.porTalla[v.talla] = v;
    grupos.set(v.nombre, grupo);
  }
  return Array.from(grupos.values());
}

export function RegaloVariantesManager({ regaloId }: RegaloVariantesManagerProps) {
  const [regalo, setRegalo] = useState<Regalo | null>(null);
  const [variantes, setVariantes] = useState<RegaloVariante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [varianteForm, setVarianteForm] = useState<{
    variante: RegaloVariante | null;
    nombreSugerido?: string;
    imagenSugerida?: string | null;
    tallaSugerida?: TallaBandana;
  } | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const supabase = createClient();
    const [{ data: regaloData }, variantesData] = await Promise.all([
      supabase.from("regalos").select("*").eq("id", regaloId).single(),
      getVariantesDeRegalo(supabase, regaloId),
    ]);
    setRegalo(regaloData as Regalo);
    setVariantes(variantesData);
    setCargando(false);
  }, [regaloId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function borrarVariante(id: string) {
    if (!confirm("¿Eliminar esta variante de regalo?")) return;
    await createClient().from("regalo_variantes").delete().eq("id", id);
    cargar();
  }

  if (cargando) return <BrandedLoader />;
  if (!regalo) return <p className="text-sm text-muted-foreground">Regalo no encontrado.</p>;

  const grupos = agruparPorDiseno(variantes);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/regalos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-lg font-semibold">{regalo.nombre}</h2>
          <p className="text-sm text-muted-foreground">
            Diseños y tallas (S, M, L) que el cliente puede elegir para este regalo.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Diseños</h3>
        <Button size="sm" onClick={() => setVarianteForm({ variante: null })}>
          <Plus className="h-4 w-4" /> Nuevo diseño
        </Button>
      </div>

      {grupos.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Este regalo todavía no tiene variantes. Crea la primera para que aparezca como opción en
            el carrito.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {grupos.map((grupo) => {
                const filaConImagen = TALLAS.map((t) => grupo.porTalla[t]).find((f) => f?.imagen);
                return (
                <div key={grupo.nombre} className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-soft-gray">
                      {filaConImagen?.imagen ? (
                        <Image
                          src={filaConImagen.imagen}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <Gift className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm font-medium">{grupo.nombre}</p>
                  </div>

                  <div className="flex flex-col gap-2 pl-[52px]">
                    {TALLAS.map((talla) => {
                      const fila = grupo.porTalla[talla];
                      if (!fila) {
                        const otraFila = TALLAS.map((t) => grupo.porTalla[t]).find(Boolean);
                        return (
                          <button
                            key={talla}
                            type="button"
                            onClick={() =>
                              setVarianteForm({
                                variante: null,
                                nombreSugerido: grupo.nombre,
                                imagenSugerida: otraFila?.imagen ?? null,
                                tallaSugerida: talla,
                              })
                            }
                            className="flex w-fit items-center gap-1 rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground hover:border-secondary hover:text-secondary"
                          >
                            <Plus className="h-3 w-3" /> Agregar talla {talla}
                          </button>
                        );
                      }
                      return (
                        <div key={talla} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Badge color="gris">{talla}</Badge>
                            <Badge color={fila.activo ? "verde" : "gris"}>
                              {fila.activo ? "Activo" : "Inactivo"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {fila.stock === null ? "Stock ilimitado" : `Stock: ${fila.stock}`}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setVarianteForm({ variante: fila })}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => borrarVariante(fila.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {varianteForm && (
        <VarianteForm
          regaloId={regaloId}
          variante={varianteForm.variante}
          siguienteOrden={grupos.length}
          nombreSugerido={varianteForm.nombreSugerido}
          imagenSugerida={varianteForm.imagenSugerida}
          tallaSugerida={varianteForm.tallaSugerida}
          onClose={() => setVarianteForm(null)}
          onSaved={() => {
            setVarianteForm(null);
            cargar();
          }}
        />
      )}
    </div>
  );
}
