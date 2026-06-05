import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Item, StockMovement } from "@/types/inventory";
import { MovementType } from "@/types/inventory";

interface Props {
  movements: StockMovement[];
  items: Item[];
}

const TYPE_LABEL: Record<MovementType, string> = {
  [MovementType.Received]: "Cosecha · Entrada",
  [MovementType.Shipped]: "Dispensa",
  [MovementType.Adjusted]: "Ajuste · Merma",
  [MovementType.Transferred]: "Traslado",
};

export function ClubRecentMovements({ movements, items }: Props) {
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const rows = [...movements]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Últimos movimientos</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="pr-6">Responsable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => {
              const item = itemMap.get(m.itemId);
              const qty = Math.abs(m.quantity);
              return (
                <TableRow key={m.id}>
                  <TableCell className="pl-6 text-xs text-muted-foreground">
                    {format(new Date(m.createdAt), "dd/MM HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{TYPE_LABEL[m.type]}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm">{item?.name ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {qty} {item?.unit ?? ""}
                  </TableCell>
                  <TableCell className="pr-6 text-xs text-muted-foreground">{m.performedBy}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
