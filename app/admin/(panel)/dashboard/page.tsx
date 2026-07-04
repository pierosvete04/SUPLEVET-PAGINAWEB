import Link from "next/link";
import { getDashboardStats } from "@/lib/data/dashboard-admin";
import { SectionCards } from "@/components/admin/SectionCards";
import { Badge } from "@/components/admin/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BADGE_ESTADO_PAGO, formatFechaPedido } from "@/lib/data/pedidos-admin";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      <SectionCards stats={stats} />

      <Card>
        <CardHeader>
          <CardTitle>Pedidos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° pedido</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado del pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.pedidosRecientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sin pedidos todavía.
                  </TableCell>
                </TableRow>
              ) : (
                stats.pedidosRecientes.map((p) => {
                  const pago = BADGE_ESTADO_PAGO[p.estado_pago];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/pedidos/${p.id}`} className="text-primary hover:underline">
                          {p.shopify_order_number ?? `W-${p.id.slice(0, 8)}`}
                        </Link>
                      </TableCell>
                      <TableCell>{formatFechaPedido(p.created_at)}</TableCell>
                      <TableCell>{p.cliente_nombre ?? p.cliente_email}</TableCell>
                      <TableCell>S/.{Number(p.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge color={pago.color}>{pago.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
