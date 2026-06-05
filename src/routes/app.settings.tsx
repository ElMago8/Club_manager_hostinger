import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Configuración · Cannabis Club Manager" }] }),
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Parámetros visuales del club. Esta pantalla es demostrativa: los
          cambios no se persisten ni se sincronizan con backend.
        </p>
      </div>

      <Tabs defaultValue="club" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="club">Datos del club</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
          <TabsTrigger value="security">Seguridad futura</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones futuras</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="club"><ClubSection /></TabsContent>
          <TabsContent value="preferences"><PreferencesSection /></TabsContent>
          <TabsContent value="security"><SecuritySection /></TabsContent>
          <TabsContent value="integrations"><IntegrationsSection /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ClubSection() {
  const [form, setForm] = useState({
    name: "Hipnosis Cannabis Club",
    email: "contacto@hipnosis-demo.local",
    phone: "+54 11 5555 0100",
    address: "Av. Ficticia 1234, CABA · Argentina",
    admin: "Admin Club",
  });
  const upd = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Datos del club</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nombre del club">
          <Input value={form.name} onChange={(e) => upd("name", e.target.value)} />
        </Field>
        <Field label="Email de contacto">
          <Input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} />
        </Field>
        <Field label="Teléfono">
          <Input value={form.phone} onChange={(e) => upd("phone", e.target.value)} />
        </Field>
        <Field label="Responsable administrativo">
          <Input value={form.admin} onChange={(e) => upd("admin", e.target.value)} />
        </Field>
        <Field label="Dirección" className="md:col-span-2">
          <Input value={form.address} onChange={(e) => upd("address", e.target.value)} />
        </Field>
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={() => toast.success("Datos guardados (demo, sin persistencia).")}>
            Guardar cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PreferencesSection() {
  const [form, setForm] = useState({
    displayName: "Cannabis Club Manager",
    theme: "system",
    minStock: 10,
    alertDays: 7,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preferencias</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nombre visible del sistema">
          <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </Field>
        <Field label="Tema visual">
          <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Automático (sistema)</SelectItem>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Oscuro</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Stock mínimo global">
          <Input type="number" min={0} value={form.minStock}
            onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
        </Field>
        <Field label="Días de anticipación para alertas">
          <Input type="number" min={1} value={form.alertDays}
            onChange={(e) => setForm({ ...form, alertDays: Number(e.target.value) })} />
        </Field>
        <Field label="Unidad principal">
          <Select value="g" disabled>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="g">Gramos (g)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={() => toast.success("Preferencias guardadas (demo).")}>
            Guardar preferencias
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecuritySection() {
  const items = [
    { title: "Autenticación en dos pasos (2FA)", desc: "Verificación adicional al iniciar sesión." },
    { title: "Bloqueo por inactividad", desc: "Cerrar sesión automáticamente tras período sin uso." },
    { title: "Exportaciones con contraseña", desc: "Proteger archivos exportados con clave." },
    { title: "Backups cifrados", desc: "Resguardos periódicos cifrados de la información del club." },
  ];
  return <FutureCard title="Seguridad futura" items={items} />;
}

function IntegrationsSection() {
  const items = [
    { title: "ARCA / AFIP", desc: "Vinculación con organismos fiscales para registros formales." },
    { title: "Backup externo", desc: "Resguardo automático a almacenamiento externo." },
    { title: "Sincronización", desc: "Sincronización entre sedes o dispositivos." },
    { title: "App de escritorio", desc: "Cliente nativo para Windows / macOS / Linux." },
  ];
  return <FutureCard title="Integraciones futuras" items={items} />;
}

function FutureCard({
  title,
  items,
}: {
  title: string;
  items: { title: string; desc: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {title}
          <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
            Disponible con backend
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {items.map((it) => (
          <div key={it.title} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{it.title}</p>
              <p className="text-xs text-muted-foreground">{it.desc}</p>
            </div>
            <Switch checked={false} disabled aria-label={it.title} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
