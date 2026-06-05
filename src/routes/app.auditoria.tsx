import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDemo } from "@/hooks/useDemo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditEntry, AuditLevel } from "@/types/inventory";

export const Route = createFileRoute("/app/auditoria")({
  head: () => ({ meta: [{ title: "Auditoría · Cannabis Club Manager" }] }),
  component: AuditoriaPage,
});

const LEVEL_LABEL: Record<AuditLevel, string> = {
  informativo: "Informativo",
  medio: "Medio",
  critico: "Crítico",
};

const LEVEL_BADGE: Record<AuditLevel, string> = {
  informativo: "bg-blue-50 text-blue-700 border-blue-200",
  medio: "bg-amber-50 text-amber-700 border-amber-200",
  critico: "bg-red-50 text-red-700 border-red-200",
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function AuditoriaPage() {
  const { demoStore, version } = useDemo();
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const entries = useMemo<AuditEntry[]>(() => {
    if (!demoStore) return [];
    return demoStore.getAuditEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoStore, version]);

  const users = useMemo(
    () => Array.from(new Set(entries.map((e) => e.user))).sort(),
    [entries]
  );
  const modules = useMemo(
    () => Array.from(new Set(entries.map((e) => e.module))).sort(),
    [entries]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (userFilter !== "all" && e.user !== userFilter) return false;
      if (moduleFilter !== "all" && e.module !== moduleFilter) return false;
      if (levelFilter !== "all" && e.level !== levelFilter) return false;
      if (q) {
        const hay = `${e.action} ${e.entityName} ${e.detail} ${e.user} ${e.module}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, search, userFilter, moduleFilter, levelFilter]);

  const stats = useMemo(() => {
    const today = entries.filter((e) => isToday(e.timestamp));
    const last = entries[0];
    return {
      hoy: today.length,
      criticos: entries.filter((e) => e.level === "critico").length,
      usuariosHoy: new Set(today.map((e) => e.user)).size,
      ultima: last ? fmtDateTime(last.timestamp) : "Sin registros",
    };
  }, [entries]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Auditoría</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro visual de acciones importantes realizadas en el sistema.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Acciones de hoy" value={String(stats.hoy)} />
        <StatCard label="Cambios críticos" value={String(stats.criticos)} />
        <StatCard label="Usuarios activos hoy" value={String(stats.usuariosHoy)} />
        <StatCard label="Última acción" value={stats.ultima} small />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input
              placeholder="Buscar acción, entidad, detalle…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los módulos</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="informativo">Informativo</SelectItem>
                <SelectItem value="medio">Medio</SelectItem>
                <SelectItem value="critico">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Bitácora · {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead>Nivel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {fmtDateTime(e.timestamp)}
                    </TableCell>
                    <TableCell className="font-medium">{e.user}</TableCell>
                    <TableCell className="text-muted-foreground">{e.role}</TableCell>
                    <TableCell>{e.action}</TableCell>
                    <TableCell className="text-muted-foreground">{e.module}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{e.entityType}</span>
                      <div className="font-mono text-xs">{e.entityName}</div>
                    </TableCell>
                    <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                      {e.detail}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={LEVEL_BADGE[e.level]}>
                        {LEVEL_LABEL[e.level]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Sin registros para los filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p
          className={
            small
              ? "mt-1 font-mono text-sm font-medium"
              : "mt-1 font-mono text-2xl font-semibold"
          }
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
