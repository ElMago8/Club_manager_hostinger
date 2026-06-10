import { differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Member } from "@/types/inventory";

interface UpcomingExpiration {
  member: Member;
  kind: "Reprocann" | "Documento médico";
  date: string;
  daysLeft: number;
}

interface Props {
  members: Member[];
}

export function ClubUpcomingExpirations({ members }: Props) {
  const now = Date.now();
  const horizon = now + 60 * 86_400_000;
  const rows: UpcomingExpiration[] = [];

  for (const m of members) {
    if (m.reprocannExpirationDate) {
      const r = new Date(m.reprocannExpirationDate).getTime();
      if (r > now && r <= horizon) {
        rows.push({ member: m, kind: "Reprocann", date: m.reprocannExpirationDate, daysLeft: differenceInDays(r, now) });
      }
    }
    if (m.medicalDocumentExpirationDate) {
      const d = new Date(m.medicalDocumentExpirationDate).getTime();
      if (d > now && d <= horizon) {
        rows.push({ member: m, kind: "Documento médico", date: m.medicalDocumentExpirationDate, daysLeft: differenceInDays(d, now) });
      }
    }
  }

  rows.sort((a, b) => a.daysLeft - b.daysLeft);
  const top = rows.slice(0, 6);

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Vencimientos próximos</CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin vencimientos en los próximos 60 días.</p>
        ) : (
          <ul className="divide-y divide-border">
            {top.map((r, i) => {
              const tone = r.daysLeft <= 15 ? "bg-stock-out/10 text-stock-out border-stock-out/30" : "bg-stock-low/10 text-stock-low border-stock-low/30";
              return (
                <li key={`${r.member.id}-${r.kind}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.member.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.member.credentialCode} · {r.kind}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="outline" className={`text-[10px] ${tone}`}>
                      En {r.daysLeft} días
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(r.date).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
