import { ShoppingBag, DollarSign, Receipt, UserPlus, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/data/dashboard-admin";

interface SectionCardsProps {
  stats: DashboardStats;
}

function Delta({ valor }: { valor: number | null }) {
  if (valor === null) {
    return <span className="text-xs font-medium text-muted-foreground">Sin dato previo</span>;
  }
  const positivo = valor >= 0;
  const Icono = positivo ? TrendingUp : TrendingDown;
  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${positivo ? "text-green-600" : "text-red-600"}`}
    >
      <Icono className="h-3.5 w-3.5" />
      {positivo ? "+" : ""}
      {valor.toFixed(1)}% vs. periodo anterior
    </span>
  );
}

export function SectionCards({ stats }: SectionCardsProps) {
  const items = [
    {
      label: "Total de pedidos",
      valor: stats.totalPedidos.toString(),
      icon: ShoppingBag,
      delta: stats.deltaPedidos,
    },
    {
      label: "Ingresos (pagados)",
      valor: `S/.${stats.ingresosTotales.toFixed(2)}`,
      icon: DollarSign,
      delta: stats.deltaIngresos,
    },
    {
      label: "Ticket promedio",
      valor: `S/.${stats.ticketPromedio.toFixed(2)}`,
      icon: Receipt,
      delta: stats.deltaTicket,
    },
    {
      label: "Clientes nuevos",
      valor: stats.clientesNuevos.toString(),
      icon: UserPlus,
      delta: stats.deltaClientesNuevos,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>{item.label}</CardDescription>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardTitle className="px-6 text-2xl font-semibold tabular-nums">{item.valor}</CardTitle>
          <div className="px-6 pb-6 pt-1">
            <Delta valor={item.delta} />
          </div>
        </Card>
      ))}
    </div>
  );
}
