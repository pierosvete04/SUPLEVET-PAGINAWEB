"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { ConteoEstado } from "@/lib/data/dashboard-admin";
import type { BadgeColor } from "@/components/admin/Badge";

const COLOR_HEX: Record<BadgeColor, string> = {
  verde: "#16a34a",
  naranja: "#ea580c",
  rojo: "#dc2626",
  gris: "#6b7280",
  azul: "#2563eb",
  celeste: "#0284c7",
};

export function EstadoBarChart({ datos, titulo }: { datos: ConteoEstado[]; titulo: string }) {
  const config: ChartConfig = { cantidad: { label: titulo } };

  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={datos} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={150} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="cantidad" radius={4}>
          {datos.map((d) => (
            <Cell key={d.estado} fill={COLOR_HEX[d.color]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
