import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Leaf, Save, Sparkles, Tag, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createGenetics } from "@/services/geneticsService";
import type { Genetics } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/geneticas/nueva")({
  head: () => ({ meta: [{ title: "Nueva genetica - Cannabis Club Manager" }] }),
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
    type: "feminizada",
    dominantProfile: "hibrida",
    thcPercent: undefined,
    sativaPercent: undefined,
    indicaPercent: undefined,
    taste: "",
    effect: "",
    aroma: "",
    notes: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("El nombre de la genetica es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      await createGenetics({
        ...form,
        name: form.name.trim(),
        breeder: form.breeder?.trim() || undefined,
        taste: form.taste?.trim() || undefined,
        effect: form.effect?.trim() || undefined,
        aroma: form.aroma?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
      await navigate({ to: "/app/cultivo/geneticas" });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo crear la genetica.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/app/cultivo/geneticas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geneticas
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva genetica</h1>
        <p className="text-sm text-muted-foreground">Ficha tecnica de variedad para asociarla luego a plantas o madres.</p>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      ) : null}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Crear genetica</CardTitle>
            <CardDescription>Completa las especificaciones principales de la variedad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="grid gap-3 border-b py-3 md:grid-cols-[220px_1fr] md:items-center">
              <Label htmlFor="name" className="flex items-center gap-2 font-semibold">
                <Leaf className="h-4 w-4 text-muted-foreground" />
                Genetics
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Blueberry x Thin Mint Girl Scout Cookies x Sunset Sherbert"
              />
            </div>

            <div className="grid gap-3 border-b py-3 md:grid-cols-[220px_1fr] md:items-center">
              <Label htmlFor="thcPercent" className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
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

            <div className="grid gap-3 border-b py-3 md:grid-cols-[220px_1fr] md:items-center">
              <Label className="flex items-center gap-2 font-semibold">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Type
              </Label>
              <Select value={form.type} onValueChange={(type) => setForm({ ...form, type: type as Genetics["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="feminizada">Feminised</SelectItem>
                  <SelectItem value="automatica">Automatic</SelectItem>
                  <SelectItem value="esqueje">Clone</SelectItem>
                  <SelectItem value="desconocida">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 border-b py-3 md:grid-cols-[220px_1fr] md:items-center">
              <Label htmlFor="sativaPercent" className="flex items-center gap-2 font-semibold">
                <Leaf className="h-4 w-4 text-muted-foreground" />
                Sativa %
              </Label>
              <Input
                id="sativaPercent"
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.sativaPercent ?? ""}
                onChange={(event) => setForm({ ...form, sativaPercent: optionalNumber(event.target.value) })}
                placeholder="40"
              />
            </div>

            <div className="grid gap-3 border-b py-3 md:grid-cols-[220px_1fr] md:items-center">
              <Label htmlFor="indicaPercent" className="flex items-center gap-2 font-semibold">
                <Leaf className="h-4 w-4 text-muted-foreground" />
                Indica %
              </Label>
              <Input
                id="indicaPercent"
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.indicaPercent ?? ""}
                onChange={(event) => setForm({ ...form, indicaPercent: optionalNumber(event.target.value) })}
                placeholder="60"
              />
            </div>

            <div className="grid gap-3 border-b py-3 md:grid-cols-[220px_1fr] md:items-center">
              <Label htmlFor="taste" className="flex items-center gap-2 font-semibold">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Taste
              </Label>
              <Input
                id="taste"
                value={form.taste ?? ""}
                onChange={(event) => setForm({ ...form, taste: event.target.value })}
                placeholder="Sweet, Earthy, Citrus"
              />
            </div>

            <div className="grid gap-3 border-b py-3 md:grid-cols-[220px_1fr] md:items-center">
              <Label htmlFor="effect" className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                Effect
              </Label>
              <Input
                id="effect"
                value={form.effect ?? ""}
                onChange={(event) => setForm({ ...form, effect: event.target.value })}
                placeholder="Clear headed, Energetic, Creative"
              />
            </div>

            <div className="grid gap-3 border-b py-3 md:grid-cols-[220px_1fr] md:items-center">
              <Label htmlFor="aroma" className="flex items-center gap-2 font-semibold">
                <Wind className="h-4 w-4 text-muted-foreground" />
                Aroma
              </Label>
              <Input
                id="aroma"
                value={form.aroma ?? ""}
                onChange={(event) => setForm({ ...form, aroma: event.target.value })}
                placeholder="Fresh, Fruity, Berry"
              />
            </div>

            <div className="grid gap-3 py-3 md:grid-cols-[220px_1fr]">
              <Label htmlFor="notes" className="flex items-center gap-2 pt-2 font-semibold">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                Observacion
              </Label>
              <Textarea
                id="notes"
                value={form.notes ?? ""}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Notas internas sobre cultivo, comportamiento o trazabilidad."
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Guardando..." : "Guardar genetica"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
