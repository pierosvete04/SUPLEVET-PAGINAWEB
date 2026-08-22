"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Lightbulb, Plus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Idea {
  consulta: string;
  volumenMensual: number;
  competencia: "baja" | "media" | "alta" | null;
}

const COLOR_COMPETENCIA = {
  baja: "verde",
  media: "naranja",
  alta: "rojo",
} as const;

interface IdeasKeywordsProps {
  /** Consultas ya guardadas, para no ofrecer agregar algo que ya está. */
  yaGuardadas: Set<string>;
  /** Se llama tras guardar para que la tabla principal se refresque. */
  onGuardada: () => void;
}

/**
 * Buscador de keywords relacionadas (Google Ads Keyword Planner).
 *
 * Search Console solo muestra consultas donde el sitio YA aparece. Este panel
 * cubre el hueco: descubre términos con demanda donde todavía no hay ninguna
 * presencia, que es justamente donde están los temas de contenido nuevos.
 */
export function IdeasKeywords({ yaGuardadas, onGuardada }: IdeasKeywordsProps) {
  const [semilla, setSemilla] = useState("");
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState<string | null>(null);

  async function buscar() {
    const termino = semilla.trim();
    if (!termino) return;

    setBuscando(true);
    // Se admiten varias semillas separadas por coma: Google devuelve mejores
    // ideas cuando ve varias formas de nombrar lo mismo.
    const semillas = termino.split(",").map((s) => s.trim()).filter(Boolean);

    const res = await fetch("/api/admin/keywords/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semillas }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data?.error ?? "No se pudieron traer las ideas.");
      setIdeas(null);
    } else {
      setIdeas(data.ideas);
      if (data.recortadas > 0) {
        toast.info(`Se usaron las primeras semillas; ${data.recortadas} quedaron fuera.`);
      }
      if (data.ideas.length === 0) {
        toast.info("Google no devolvió ideas para esa semilla.");
      }
    }
    setBuscando(false);
  }

  async function guardar(idea: Idea) {
    setGuardando(idea.consulta);
    const { error } = await createClient()
      .from("seo_keywords")
      .upsert(
        {
          consulta: idea.consulta,
          volumen_mensual: idea.volumenMensual,
          competencia: idea.competencia,
          origen: "keyword_planner",
        },
        { onConflict: "consulta" }
      );

    if (error) {
      toast.error("No se pudo guardar la keyword.");
    } else {
      toast.success(`"${idea.consulta}" agregada.`);
      onGuardada();
    }
    setGuardando(null);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4" />
            Buscar keywords relacionadas
          </h3>
          <p className="text-xs text-muted-foreground">
            Escribe un producto o un problema y Google devuelve términos parecidos con su volumen de búsqueda en
            Perú. Sirve para descubrir temas donde todavía no apareces — algo que Search Console no puede mostrar.
            Separa varias semillas con comas.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            value={semilla}
            onChange={(e) => setSemilla(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void buscar();
            }}
            placeholder="mi perro no come, suplemento para perros desnutridos…"
            className="max-w-xl bg-white"
          />
          <Button onClick={buscar} disabled={buscando || !semilla.trim()}>
            <Sparkles className={`h-4 w-4 ${buscando ? "animate-pulse" : ""}`} />
            {buscando ? "Buscando…" : "Buscar ideas"}
          </Button>
        </div>

        {ideas && ideas.length > 0 && (
          <div className="max-h-96 overflow-y-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Keyword</th>
                  <th className="px-3 py-2 text-right font-medium">Búsquedas/mes</th>
                  <th className="px-3 py-2 text-left font-medium">Competencia</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {ideas.map((idea) => {
                  const guardada = yaGuardadas.has(idea.consulta);
                  return (
                    <tr key={idea.consulta} className="border-t">
                      <td className="px-3 py-2">{idea.consulta}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {idea.volumenMensual.toLocaleString("es-PE")}
                      </td>
                      <td className="px-3 py-2">
                        {idea.competencia && (
                          <Badge color={COLOR_COMPETENCIA[idea.competencia]}>{idea.competencia}</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {guardada ? (
                          <span className="text-xs text-muted-foreground">Ya está</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => guardar(idea)}
                            disabled={guardando === idea.consulta}
                          >
                            <Plus className="h-3 w-3" />
                            Agregar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
