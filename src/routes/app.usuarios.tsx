import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Check, Minus } from "lucide-react";
import { toast } from "sonner";
import type { AppUser, AppUserRole } from "@/types/inventory";

export const Route = createFileRoute("/app/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios y Roles · Cannabis Club Manager" }] }),
  component: UsuariosPage,
});

const ROLE_BADGE: Record<AppUserRole, string> = {
  Administrador: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Operador: "bg-blue-100 text-blue-800 border-blue-200",
  Auditor: "bg-amber-100 text-amber-800 border-amber-200",
};

const MODULES = [
  "Dashboard",
  "Socios",
  "Productos / Stock",
  "Movimientos",
  "Alertas",
  "Usuarios",
  "Auditoría",
  "Configuración",
] as const;

const PERMS = ["Ver", "Crear", "Editar", "Exportar"] as const;

type Matrix = Record<AppUserRole, Record<(typeof MODULES)[number], Record<(typeof PERMS)[number], boolean>>>;

function buildMatrix(): Matrix {
  const all = (v: boolean) =>
    Object.fromEntries(PERMS.map((p) => [p, v])) as Record<(typeof PERMS)[number], boolean>;
  const admin = Object.fromEntries(MODULES.map((m) => [m, all(true)])) as Matrix["Administrador"];
  const operador = Object.fromEntries(
    MODULES.map((m) => {
      const restricted = m === "Usuarios" || m === "Auditoría" || m === "Configuración";
      return [
        m,
        {
          Ver: !restricted || m === "Auditoría",
          Crear: !restricted && m !== "Dashboard",
          Editar: !restricted && m !== "Dashboard",
          Exportar: !restricted,
        },
      ];
    })
  ) as Matrix["Operador"];
  const auditor = Object.fromEntries(
    MODULES.map((m) => [m, { Ver: true, Crear: false, Editar: false, Exportar: true }])
  ) as Matrix["Auditor"];
  return { Administrador: admin, Operador: operador, Auditor: auditor };
}

const MATRIX = buildMatrix();

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

function UsuariosPage() {
  const { demoStore, version } = useDemo();

  const users = useMemo<AppUser[]>(() => {
    if (!demoStore) return [];
    return demoStore.getAppUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoStore, version]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === "active");
    return {
      activos: active.length,
      admins: active.filter((u) => u.role === "Administrador").length,
      operadores: active.filter((u) => u.role === "Operador").length,
      auditores: active.filter((u) => u.role === "Auditor").length,
      inactivos: users.filter((u) => u.status !== "active").length,
    };
  }, [users]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios y Roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión visual de usuarios internos y niveles de acceso.
          </p>
        </div>
        <Button
          onClick={() =>
            toast.info("La creación de usuarios reales se habilitará con backend.")
          }
        >
          Nuevo usuario
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Usuarios activos" value={stats.activos} />
        <StatCard label="Administradores" value={stats.admins} />
        <StatCard label="Operadores" value={stats.operadores} />
        <StatCard label="Auditores" value={stats.auditores} />
        <StatCard label="Inactivos" value={stats.inactivos} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipo interno</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ROLE_BADGE[u.role]}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        u.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {u.status === "active"
                        ? "Activo"
                        : u.status === "pending"
                        ? "Pendiente"
                        : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fmtDate(u.lastAccessAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        toast.info("Edición de usuarios disponible con backend real.")
                      }
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Sin usuarios cargados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matriz de permisos por rol</CardTitle>
          <p className="text-xs text-muted-foreground">
            Vista referencial. La aplicación real de permisos se implementará con backend.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {(Object.keys(MATRIX) as AppUserRole[]).map((role) => (
            <div key={role} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={ROLE_BADGE[role]}>
                  {role}
                </Badge>
              </div>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[220px]">Módulo</TableHead>
                      {PERMS.map((p) => (
                        <TableHead key={p} className="text-center">
                          {p}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULES.map((m) => (
                      <TableRow key={m}>
                        <TableCell className="font-medium">{m}</TableCell>
                        {PERMS.map((p) => (
                          <TableCell key={p} className="text-center">
                            {MATRIX[role][m][p] ? (
                              <Check className="mx-auto h-4 w-4 text-emerald-600" />
                            ) : (
                              <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
