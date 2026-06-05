import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Category, Item, Member } from "@/types/inventory";

interface Props {
  items: Item[];
  categories: Category[];
  members: Member[];
}

const MEMBER_STATUS: Array<{ key: Member["status"]; label: string; color: string }> = [
  { key: "active", label: "Activo", color: "bg-stock-healthy" },
  { key: "pending", label: "Pendiente", color: "bg-stock-low" },
  { key: "suspended", label: "Suspendido", color: "bg-stock-out" },
  { key: "inactive", label: "Inactivo", color: "bg-muted-foreground" },
];

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground">{label}</span>
        <span className="font-mono text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ClubDistribution({ items, categories, members }: Props) {
  const totalStock = items.reduce((s, i) => s + i.currentStock, 0);
  const byCat = categories.map((c) => ({
    name: c.name,
    value: items.filter((i) => i.categoryId === c.id).reduce((s, i) => s + i.currentStock, 0),
  }));
  const totalMembers = members.length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Stock por categoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {byCat.map((c) => (
            <Bar key={c.name} label={c.name} value={c.value} total={totalStock} color="bg-primary" />
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Socios por estado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MEMBER_STATUS.map((s) => (
            <Bar
              key={s.key}
              label={s.label}
              value={members.filter((m) => m.status === s.key).length}
              total={totalMembers}
              color={s.color}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
