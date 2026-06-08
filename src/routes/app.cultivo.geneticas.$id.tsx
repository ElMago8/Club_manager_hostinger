import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Leaf, Save, Sparkles, Tag, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GeneticsProfileSlider, normalizeGeneticsProfile } from "@/components/cultivation/GeneticsProfileSlider";
import { getGeneticsById, updateGenetics } from "@/services/geneticsService";
import type { Genetics } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/geneticas/$id")({
  head: () => ({ meta: [{ title: "Editar genetica - Cannabis Club Manager" }] }),
  component: EditGeneticsPage,
});

type GeneticsForm = Omit<Genetics, "id">;

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function EditGeneticsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<GeneticsForm>({
    name: "",
    breeder: "",
    type: "feminizada",
    dominantProfile: "hibrida",
    thcPercent: undefined,
    sativaPercent: 50,
    indicaPercent: 50,
    taste: "",
    effect: "",
    aroma: "",
    notes: "",
  });

  useEffect(() => {
    async function loadGenetics() {
      try {
        const genetics = await getGeneticsById(id);
        const profile = normalizeGeneticsProfile(genetics.sativaPercent, genetics.indicaPercent);
        setForm({
          name: genetics.name,
          breeder: genetics.breeder ?? "",
          type: genetics.type,
          dominantProfile: genetics.dominantProfile,
          thcPercent: genetics.thcPercent,
          ...profile,
          taste: genetics.taste ?? "",
          effect: genetics.effect ?? "",
          aroma: genetics.aroma ?? "",
          notes: genetics.notes ?? "",
        });
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "No se pudo cargar la genetica.");
      } finally {
        setLoading(false);
      }
    }

    void loadGenetics();
  }, [id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("El nombre de la genetica es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      const profile = normalizeGeneticsProfile(form.sativaPercent, form.indicaPercent);
      await updateGenetics(id, {
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
      setError(nextError instanceof Error ? nextError.message : "No se pudo actualizar la genetica.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1000px] space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/cultivo/geneticas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geneticas
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">Cargando genetica...</CardContent>
        </Card>
      </div>
    );
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
        <h1 className="text-2xl font-semibold tracking-tight">Editar genetica</h1>
        <p className="text-sm text-muted-foreground">Ficha tecnica de variedad.</p>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      ) : null}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Datos de genetica</CardTitle>
            <CardDescription>Actualiza las especificaciones principales de la variedad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="grid gap-3 border-b py-3 md:grid-cols-[220px_1fr] md:items-center">
              <Label htmlFor="name" className="flex items-center gap-2 font-semibold">
                <Leaf className="h-4 w-4 text-muted-foreground" />
                Genetica
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Blueberry x Thin Mint Girl Scout Cookies x Sunset Sherbert"
              />
            </div>

            <div className="grid gap-3 border-b py-3 md:grid-cols-[220px_1fr] md:items-center">
              <Label htmlFor="breeder" className="flex items-center gap-2 font-semibold">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Breeder
              </Label>
              <Input
                id="breeder"
                value={form.breeder ?? ""}
                onChange={(event) => setForm({ ...form, breeder: event.target.value })}
                placeholder="Banco o criador"
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
                Tipo
              </Label>
              <Select value={form.type} onValueChange={(type) => setForm({ ...form, type: type as Genetics["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="feminizada">Feminizada</SelectItem>
                  <SelectItem value="automatica">Automatica</SelectItem>
                  <SelectItem value="esqueje">Esqueje</SelectItem>
                  <SelectItem value="desconocida">Desconocida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 border-b py-3 md:grid-cols-[220px_1fr] md:items-center">
              <Label className="flex items-center gap-2 font-semibold">
                <Leaf className="h-4 w-4 text-muted-foreground" />
                Perfil Sativa / Indica
              </Label>
              <GeneticsProfileSlider
                sativaPercent={form.sativaPercent}
                indicaPercent={form.indicaPercent}
                onChange={(profile) => setForm({ ...form, ...profile })}
              />
            </div>

            <div className="grid gap-3 border-b py-3 md:grid-cols-[220px_1fr] md:items-center">
              <Label htmlFor="taste" className="flex items-center gap-2 font-semibold">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Sabor
              </Label>
              <Input
                id="taste"
                value={form.taste ?? ""}
                onChange={(event) => setForm({ ...form, taste: event.target.value })}
                placeholder="Dulce, terroso, citrico"
              />
            </div>

            <div className="grid gap-3 border-b py-3 md:grid-cols-[220px_1fr] md:items-center">
              <Label htmlFor="effect" className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                Efecto
              </Label>
              <Input
                id="effect"
                value={form.effect ?? ""}
                onChange={(event) => setForm({ ...form, effect: event.target.value })}
                placeholder="Lucido, energetico, creativo"
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
                placeholder="Fresco, frutal, frutos rojos"
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
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
