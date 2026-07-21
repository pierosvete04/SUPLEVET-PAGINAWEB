"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { PuntoSerieTiempo } from "@/lib/data/dashboard-admin";

const config: ChartConfig = {
  ingresos: { label: "Ingresos (S/.)", color: "#EA8C43" },
  pedidos: { label: "Pedidos", color: "#253C61" },
};

function formatFechaCorta(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

export function RevenueChart({ datos }: { datos: PuntoSerieTiempo[] }) {
  if (datos.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Sin datos en este periodo.</p>;
  }

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <AreaChart data={datos} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="fecha" tickFormatter={formatFechaCorta} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis yAxisId="ingresos" tickLine={false} axisLine={false} width={64} tickFormatter={(v) => `S/.${v}`} />
        <YAxis yAxisId="pedidos" orientation="right" tickLine={false} axisLine={false} width={36} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => formatFechaCorta(String(v))} />} />
        <Area
          yAxisId="ingresos"
          dataKey="ingresos"
          type="monotone"
          fill="var(--color-ingresos)"
          fillOpacity={0.2}
          stroke="var(--color-ingresos)"
        />
        <Area
          yAxisId="pedidos"
          dataKey="pedidos"
          type="monotone"
          fill="var(--color-pedidos)"
          fillOpacity={0.1}
          stroke="var(--color-pedidos)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
