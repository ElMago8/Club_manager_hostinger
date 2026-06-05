import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Users } from "lucide-react";
import { useDemo } from "@/hooks/useDemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import type { Member, MemberStatus } from "@/types/inventory";

export const Route = createFileRoute("/app/socios")({
  head: () => ({ meta: [{ title: "Socios · Cannabis Club Manager" }] }),
  component: SociosPage,
});

const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Activo",
  pending: "Pendiente",
  suspended: "Suspendido",
  inactive: "Inactivo",
};

const STATUS_CLASS: Record<MemberStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  pending: "bg-amber-500/10 text-amber-700 border-amber-200",
  suspended: "bg-red-500/10 text-red-700 border-red-200",
  inactive: "bg-muted text-muted-foreground border-border",
};

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function docStatus(member: Member): "vigente" | "por_vencer" | "vencido" {
  const dCred = daysUntil(member.reprocannExpirationDate);
  const dMed = daysUntil(member.medicalDocumentExpirationDate);
  const min = Math.min(dCred, dMed);
  if (min < 0) return "vencido";
  if (min <= 30) return "por_vencer";
  return "vigente";
}

function SociosPage() {
  const { demoStore, version } = useDemo();
  const members = useMemo<Member[]>(
    () => (demoStore ? demoStore.getMembers() : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [demoStore, version],
  );

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | MemberStatus>("all");
  const [doc, setDoc] = useState<"all" | "vigente" | "por_vencer" | "vencido">("all");
  const [selected, setSelected] = useState<Member | null>(null);

  const stats = useMemo(() => {
    let active = 0, pending = 0, expiring = 0, nearQuota = 0;
    for (const m of members) {
      if (m.status === "active") active++;
      if (m.status === "pending") pending++;
      const d = Math.min(daysUntil(m.reprocannExpirationDate), daysUntil(m.medicalDocumentExpirationDate));
      if (d >= 0 && d <= 30) expiring++;
      if (m.status === "active" && m.monthlyQuotaGrams > 0 && m.currentMonthUsageGrams / m.monthlyQuotaGrams >= 0.8) nearQuota++;
    }
    return { total: members.length, active, pending, expiring, nearQuota };
  }, [members]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (status !== "all" && m.status !== status) return false;
      if (doc !== "all" && docStatus(m) !== doc) return false;
      if (!q) return true;
      return (
        m.fullName.toLowerCase().includes(q) ||
        m.credentialCode.toLowerCase().includes(q) ||
        m.dni.includes(q)
      );
    });
  }, [members, search, status, doc]);

  const cards = [
    { label: "Total de socios", value: stats.total },
    { label: "Activos", value: stats.active },
    { label: "Pendientes", value: stats.pending },
    { label: "Credenciales por vencer", value: stats.expiring },
    { label: "Cupos próximos al límite", value: stats.nearQuota },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Socios · Pacientes</h1>
          <p className="text-sm text-muted-foreground">Gestión visual de socios, cupos y documentación</p>
        </div>
        <Button className="gap-1.5" onClick={() => toast.info("La carga real de socios se habilitará cuando exista backend.")}>
          <Plus className="h-4 w-4" />
          Nuevo socio
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-9 pl-8 bg-card"
              placeholder="Buscar por nombre, credencial o DNI"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="h-9 bg-card"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="suspended">Suspendido</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={doc} onValueChange={(v) => setDoc(v as typeof doc)}>
            <SelectTrigger className="h-9 bg-card"><SelectValue placeholder="Documentación" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda la documentación</SelectItem>
              <SelectItem value="vigente">Vigente</SelectItem>
              <SelectItem value="por_vencer">Por vencer (≤30 días)</SelectItem>
              <SelectItem value="vencido">Vencida</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No hay socios que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Credencial</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Cupo mensual</TableHead>
                <TableHead>Uso del mes</TableHead>
                <TableHead>Vto. credencial</TableHead>
                <TableHead>Vto. doc. médico</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => {
                const usagePct = m.monthlyQuotaGrams > 0 ? Math.round((m.currentMonthUsageGrams / m.monthlyQuotaGrams) * 100) : 0;
                const credDays = daysUntil(m.reprocannExpirationDate);
                const medDays = daysUntil(m.medicalDocumentExpirationDate);
                return (
                  <TableRow key={m.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelected(m)}>
                    <TableCell className="font-medium">{m.fullName}</TableCell>
                    <TableCell className="font-mono text-xs">{m.credentialCode}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.dni}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_CLASS[m.status]}>{STATUS_LABEL[m.status]}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.monthlyQuotaGrams} g</TableCell>
                    <TableCell className="font-mono text-xs">
                      <span className={usagePct >= 80 ? "text-amber-700" : "text-foreground"}>
                        {m.currentMonthUsageGrams} g · {usagePct}%
                      </span>
                    </TableCell>
                    <TableCell className={`text-xs ${credDays < 0 ? "text-red-600" : credDays <= 30 ? "text-amber-700" : "text-muted-foreground"}`}>
                      {fmtDate(m.reprocannExpirationDate)}
                    </TableCell>
                    <TableCell className={`text-xs ${medDays < 0 ? "text-red-600" : medDays <= 30 ? "text-amber-700" : "text-muted-foreground"}`}>
                      {fmtDate(m.medicalDocumentExpirationDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(m); }}>
                        Ver detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <MemberDetailSheet member={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

interface DetailProps {
  member: Member | null;
  onClose: () => void;
}

function MemberDetailSheet({ member, onClose }: DetailProps) {
  const open = member !== null;
  if (!member) {
    return (
      <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent />
      </Sheet>
    );
  }
  const usagePct = member.monthlyQuotaGrams > 0
    ? Math.round((member.currentMonthUsageGrams / member.monthlyQuotaGrams) * 100)
    : 0;
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-[420px] sm:max-w-[460px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{member.fullName}</SheetTitle>
          <SheetDescription>Credencial {member.credentialCode}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5 text-sm">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Datos generales</h3>
            <Row label="Estado" value={STATUS_LABEL[member.status]} />
            <Row label="DNI" value={member.dni} mono />
            <Row label="Teléfono" value={member.phone} />
            <Row label="Email" value={member.email} />
            <Row label="Alta" value={fmtDate(member.registrationDate)} />
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cupo</h3>
            <Row label="Cupo mensual" value={`${member.monthlyQuotaGrams} g`} mono />
            <Row label="Uso del mes" value={`${member.currentMonthUsageGrams} g · ${usagePct}%`} mono />
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${usagePct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, usagePct)}%` }}
              />
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documentación</h3>
            <Row label="Vto. credencial" value={fmtDate(member.reprocannExpirationDate)} />
            <Row label="Vto. doc. médico" value={fmtDate(member.medicalDocumentExpirationDate)} />
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observaciones</h3>
            <p className="text-muted-foreground">{member.notes || "Sin observaciones."}</p>
          </section>

          <div className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-xs text-sky-800">
            La carga de documentación y edición real se habilitará cuando exista backend.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}
