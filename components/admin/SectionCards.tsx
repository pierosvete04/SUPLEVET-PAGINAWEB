import { ShoppingBag, DollarSign, Users, Package } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/data/dashboard-admin";

interface SectionCardsProps {
  stats: DashboardStats;
}

export function SectionCards({ stats }: SectionCardsProps) {
  const items = [
    {
      label: "Total de pedidos",
      valor: stats.totalPedidos.toString(),
      icon: ShoppingBag,
    },
    {
      label: "Ingresos (pagados)",
      valor: `S/.${stats.ingresosTotales.toFixed(2)}`,
      icon: DollarSign,
    },
    {
      label: "Clientes registrados",
      valor: stats.totalClientes.toString(),
      icon: Users,
    },
    {
      label: "Productos activos",
      valor: stats.productosActivos.toString(),
      icon: Package,
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
          <CardTitle className="px-6 pb-6 text-2xl font-semibold tabular-nums">
            {item.valor}
          </CardTitle>
        </Card>
      ))}
    </div>
  );
}
