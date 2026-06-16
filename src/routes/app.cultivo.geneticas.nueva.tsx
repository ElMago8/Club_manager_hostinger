import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Leaf, Save, Sparkles, Tag, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GeneticsProfileSlider, normalizeGeneticsProfile } from "@/components/cultivation/GeneticsProfileSlider";
import { createGenetics } from "@/services/geneticsService";
import type { CannabinoidProfile, Genetics } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/geneticas/nueva")({
  head: () => ({ meta: [{ title: "Nueva genética - Cannabis Club Manager" }] }),
  component: NewGeneticsPage,
});

type GeneticsForm = Omit<Genetics, "id">;

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function NewGeneticsPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<GeneticsForm>({
    name: "",
    breeder: "",
    origin: undefined,
    type: "feminizada",
    dominantProfile: "hibrida",
    cannabinoidProfile: undefined,
    thcPercent: undefined,
    cbdPercent: undefined,
    floweringTimeDays: undefined,
    sativaPercent: 50,
    indicaPercent: 50,
    taste: "",
    effect: "",
    aroma: "",
    description: "",
    notes: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("El nombre de la genética es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      const profile = normalizeGeneticsProfile(form.sativaPercent, form.indicaPercent);
      await createGenetics({
        ...form,
        ...profile,
        name: form.name.trim(),
        breeder: form.breeder?.trim(),
        taste: form.taste?.trim(),
        effect: form.effect?.trim(),
        aroma: form.aroma?.trim(),
        notes: form.notes?.trim(),
      });
      await navigate({ to: "/app/cultivo/geneticas" });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo crear la genética.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-4">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/app/cultivo/geneticas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Genéticas
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva genética</h1>
        <p className="text-sm text-muted-foreground">Ficha técnica de variedad para asociarla luego a plantas o madres.</p>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      ) : null}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Crear genética</CardTitle>
            <CardDescription>Completá las especificaciones principales de la variedad.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 lg:grid-cols-[minmax(0,0.575fr)_minmax(0,0.575fr)_minmax(320px,0.85fr)]">
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:col-span-2 lg:col-start-1">
                Datos de variedad
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:col-start-3 lg:row-start-1">
                Medicion
              </div>

              <div className="md:col-span-2 space-y-1 lg:col-span-2 lg:col-start-1 lg:row-start-2">
                <Label htmlFor="name" className="flex items-center gap-1.5 text-sm font-semibold">
                  <Leaf className="h-3.5 w-3.5 text-muted-foreground" />
                  Genética
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Blueberry x Thin Mint Girl Scout Cookies x Sunset Sherbert"
                />
              </div>

              <div className="space-y-1 lg:col-span-2 lg:col-start-1 lg:row-start-3">
                <Label htmlFor="breeder" className="flex items-center gap-1.5 text-sm font-semibold">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Breeder
                </Label>
                <Input
                  id="breeder"
                  value={form.breeder ?? ""}
                  onChange={(event) => setForm({ ...form, breeder: event.target.value })}
                  placeholder="Banco o criador"
                />
              </div>
              <div className="space-y-1 lg:col-start-1 lg:row-start-4">
                <Label className="flex items-center gap-1.5 text-sm font-semibold">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Origen
                </Label>
                <Select
                  value={form.origin ?? ""}
                  onValueChange={(v) => setForm({ ...form, origin: v === "" ? undefined : v as Genetics["origin"] })}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar origen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semilla">Semilla</SelectItem>
                    <SelectItem value="madre">Madre</SelectItem>
                    <SelectItem value="esqueje">Esqueje</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 lg:col-start-3 lg:row-start-2">
                <Label htmlFor="thcPercent" className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  THC %
                </Label>
                <Input
                  id="thcPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.thcPercent ?? ""}
                  onChange={(event) => setForm({ ...form, thcPercent: optionalNumber(event.target.value) })}
                  placeholder="26"
                />
              </div>
              <div className="space-y-1 lg:col-start-3 lg:row-start-3">
                <Label htmlFor="cbdPercent" className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  CBD %
                </Label>
                <Input
                  id="cbdPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.cbdPercent ?? ""}
                  onChange={(event) => setForm({ ...form, cbdPercent: optionalNumber(event.target.value) })}
                  placeholder="0.5"
                />
              </div>

              <div className="space-y-1 lg:col-start-3 lg:row-start-4">
                <Label htmlFor="floweringTimeDays" className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  Tiempo de floración (días)
                </Label>
                <Input
                  id="floweringTimeDays"
                  type="number"
                  min="1"
                  max="365"
                  step="1"
                  value={form.floweringTimeDays ?? ""}
                  onChange={(event) => setForm({ ...form, floweringTimeDays: optionalNumber(event.target.value) })}
                  placeholder="Ej: 63"
                />
              </div>
              <div className="space-y-1 lg:col-start-2 lg:row-start-4">
                <Label className="flex items-center gap-1.5 text-sm font-semibold">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Tipo
                </Label>
                <Select value={form.type} onValueChange={(type) => setForm({ ...form, type: type as Genetics["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="feminizada">Feminizada</SelectItem>
                    <SelectItem value="automatica">Automática</SelectItem>
                    <SelectItem value="esqueje">Esqueje</SelectItem>
                    <SelectItem value="desconocida">Desconocida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 lg:col-start-1 lg:row-start-5">
                <Label className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  Perfil cannabinoide
                </Label>
                <Select
                  value={form.cannabinoidProfile ?? "desconocida"}
                  onValueChange={(v) => setForm({ ...form, cannabinoidProfile: v === "desconocida" ? undefined : v as CannabinoidProfile })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desconocida">Desconocida</SelectItem>
                    <SelectItem value="thc_dominante">THC dominante</SelectItem>
                    <SelectItem value="cbd_dominante">CBD dominante</SelectItem>
                    <SelectItem value="balanceada_thc_cbd">Balanceada THC:CBD</SelectItem>
                    <SelectItem value="cbg">CBG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 lg:col-start-2 lg:row-start-5">
                <Label htmlFor="aroma" className="flex items-center gap-1.5 text-sm font-semibold">
                  <Wind className="h-3.5 w-3.5 text-muted-foreground" />
                  Aroma
                </Label>
                <Input
                  id="aroma"
                  value={form.aroma ?? ""}
                  onChange={(event) => setForm({ ...form, aroma: event.target.value })}
                  placeholder="Fresco, frutal, frutos rojos"
                />
              </div>

              <div className="space-y-1 lg:col-start-1 lg:row-start-6">
                <Label htmlFor="taste" className="flex items-center gap-1.5 text-sm font-semibold">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Sabor
                </Label>
                <Input
                  id="taste"
                  value={form.taste ?? ""}
                  onChange={(event) => setForm({ ...form, taste: event.target.value })}
                  placeholder="Dulce, terroso, cítrico"
                />
              </div>
              <div className="space-y-1 lg:col-start-2 lg:row-start-6">
                <Label htmlFor="effect" className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  Efecto
                </Label>
                <Input
                  id="effect"
                  value={form.effect ?? ""}
                  onChange={(event) => setForm({ ...form, effect: event.target.value })}
                  placeholder="Lúcido, energético, creativo"
                />
              </div>

              <div className="space-y-1 lg:col-start-3 lg:row-start-5 lg:row-span-2">
                <Label className="flex items-center gap-1.5 text-sm font-semibold">
                  <Leaf className="h-3.5 w-3.5 text-muted-foreground" />
                  Perfil Sativa / Indica
                </Label>
                <GeneticsProfileSlider
                  sativaPercent={form.sativaPercent}
                  indicaPercent={form.indicaPercent}
                  onChange={(profile) => setForm({ ...form, ...profile })}
                />
              </div>

              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:col-span-2 lg:col-span-3 lg:col-start-1 lg:row-start-7">
                Detalle
              </div>

              <div className="space-y-1 md:col-span-2 lg:col-span-3 lg:col-start-1">
                <Label htmlFor="description" className="flex items-center gap-1.5 text-sm font-semibold">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Descripción general de la variedad."
                />
              </div>

              <div className="space-y-1 md:col-span-2 lg:col-span-3 lg:col-start-1">
                <Label htmlFor="notes" className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  Observación
                </Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={form.notes ?? ""}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Notas internas sobre cultivo, comportamiento o trazabilidad."
                />
              </div>

              <div className="md:col-span-2 flex justify-end pt-1 lg:col-span-3">
                <Button type="submit" disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Guardando..." : "Guardar genética"}
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
