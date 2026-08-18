import { ShoppingBag, DollarSign, Package } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EditorStatCardsProps {
  ventasTotal: number;
  pedidosCount: number;
  unidadesCount: number;
}

// Dashboard rápido del editor (admin viéndolo o el propio editor en su
// panel): sin monto de comisión a propósito — solo ventas/unidades, el pago
// al editor se acuerda y se hace aparte.
export function EditorStatCards({ ventasTotal, pedidosCount, unidadesCount }: EditorStatCardsProps) {
  const items = [
    { label: "Ventas generadas", valor: `S/.${ventasTotal.toFixed(2)}`, icon: DollarSign },
    { label: "Pedidos", valor: pedidosCount.toString(), icon: ShoppingBag },
    { label: "Unidades vendidas", valor: unidadesCount.toString(), icon: Package },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>{item.label}</CardDescription>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardTitle className="px-6 pb-6 text-2xl font-semibold tabular-nums">{item.valor}</CardTitle>
        </Card>
      ))}
    </div>
  );
}
