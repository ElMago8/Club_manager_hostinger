import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useDemo } from "@/hooks/useDemo";
import { DeleteConfirmDialog } from "@/components/cultivation/DeleteConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const EMPTY_FORM = { name: "", email: "", role: "Operador" as AppUserRole, status: "active" as AppUser["status"] };

function UsuariosPage() {
  const { demoStore, bumpVersion, version } = useDemo();

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

  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function openNew() {
    setForm(EMPTY_FORM);
    setNewOpen(true);
  }

  function openEdit(user: AppUser) {
    setForm({ name: user.name, email: user.email, role: user.role, status: user.status });
    setEditTarget(user);
  }

  function handleSaveNew() {
    if (!demoStore || !form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    setTimeout(() => {
      demoStore.addAppUser({
        id: crypto.randomUUID(),
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        status: form.status,
        lastAccessAt: new Date().toISOString(),
      });
      bumpVersion();
      setNewOpen(false);
      setSaving(false);
    }, 300);
  }

  function handleSaveEdit() {
    if (!demoStore || !editTarget || !form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    setTimeout(() => {
      demoStore.updateAppUser(editTarget.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        status: form.status,
      });
      bumpVersion();
      setEditTarget(null);
      setSaving(false);
    }, 300);
  }

  function handleDelete() {
    if (!demoStore || !deleteTarget) return;
    demoStore.deleteAppUser(deleteTarget.id);
    bumpVersion();
    setDeleteTarget(null);
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios y Roles</h1>
          <p className="text-sm text-muted-foreground">
            Gestión visual de usuarios internos y niveles de acceso.
          </p>
        </div>
        <Button className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" />
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
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-emerald-700 hover:text-emerald-800"
                        onClick={() => openEdit(u)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(u)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
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

      {/* Dialog: Nuevo usuario */}
      <Dialog open={newOpen} onOpenChange={(open) => { if (!saving) setNewOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
          </DialogHeader>
          <UserForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNew} disabled={saving || !form.name.trim() || !form.email.trim()}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar usuario */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => { if (!saving && !open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          <UserForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving || !form.name.trim() || !form.email.trim()}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        entityLabel="usuario"
        itemName={deleteTarget?.name}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function UserForm({
  form,
  onChange,
}: {
  form: typeof EMPTY_FORM;
  onChange: (f: typeof EMPTY_FORM) => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label>Nombre</Label>
        <Input
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="Nombre completo"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => onChange({ ...form, email: e.target.value })}
          placeholder="usuario@ejemplo.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Rol</Label>
        <Select value={form.role} onValueChange={(v) => onChange({ ...form, role: v as AppUserRole })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Administrador">Administrador</SelectItem>
            <SelectItem value="Operador">Operador</SelectItem>
            <SelectItem value="Auditor">Auditor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Estado</Label>
        <Select value={form.status} onValueChange={(v) => onChange({ ...form, status: v as AppUser["status"] })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
