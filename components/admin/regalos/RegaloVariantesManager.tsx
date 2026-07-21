"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Gift, Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getVariantesDeRegalo, type RegaloVariante } from "@/lib/regalo-variantes";
import type { Regalo } from "@/lib/regalos";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VarianteForm } from "@/components/admin/regalos/VarianteForm";
import { BrandedLoader } from "@/components/ui/branded-loader";

interface RegaloVariantesManagerProps {
  regaloId: string;
}

export function RegaloVariantesManager({ regaloId }: RegaloVariantesManagerProps) {
  const [regalo, setRegalo] = useState<Regalo | null>(null);
  const [variantes, setVariantes] = useState<RegaloVariante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [varianteForm, setVarianteForm] = useState<{ variante: RegaloVariante | null } | null>(null);

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
            Diseños/variantes que el cliente puede elegir para este regalo.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Variantes</h3>
        <Button size="sm" onClick={() => setVarianteForm({ variante: null })}>
          <Plus className="h-4 w-4" /> Nueva variante
        </Button>
      </div>

      {variantes.length === 0 ? (
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
              {variantes.map((variante) => (
                <div key={variante.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-soft-gray">
                      {variante.imagen ? (
                        <Image src={variante.imagen} alt="" fill className="object-cover" sizes="40px" />
                      ) : (
                        <Gift className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{variante.nombre}</p>
                      <Badge color={variante.activo ? "verde" : "gris"}>
                        {variante.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setVarianteForm({ variante })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => borrarVariante(variante.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {varianteForm && (
        <VarianteForm
          regaloId={regaloId}
          variante={varianteForm.variante}
          siguienteOrden={variantes.length}
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
