import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getGenetics } from "@/services/geneticsService";
import { getPlants } from "@/services/plantService";
import type { Genetics, Plant } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/geneticas")({
  head: () => ({ meta: [{ title: "Geneticas - Cannabis Club Manager" }] }),
  component: GeneticsPage,
});

function GeneticsPage() {
  const location = useLocation();
  const [genetics, setGenetics] = useState<Genetics[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);

  useEffect(() => {
    async function loadData() {
      const [nextGenetics, nextPlants] = await Promise.all([getGenetics(), getPlants()]);
      setGenetics(nextGenetics);
      setPlants(nextPlants);
    }

    void loadData();
  }, []);

  const plantCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const plant of plants) {
      if (plant.geneticsId) counts.set(plant.geneticsId, (counts.get(plant.geneticsId) ?? 0) + 1);
    }
    return counts;
  }, [plants]);

  if (location.pathname !== "/app/cultivo/geneticas") {
    return <Outlet />;
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Geneticas</h1>
          <p className="text-sm text-muted-foreground">Listado operativo de geneticas asociadas a plantas y madres.</p>
        </header>

        <Button asChild className="gap-2">
          <Link to="/app/cultivo/geneticas/nueva">
            <Plus className="h-4 w-4" />
            Nueva genetica
          </Link>
        </Button>
      </div>

      <section className="space-y-3">
        <div className="space-y-1 border-l-2 border-primary/60 pl-3">
          <h2 className="text-lg font-semibold tracking-tight">Listado de geneticas</h2>
          <p className="text-sm text-muted-foreground">
            Catalogo de variedades, perfil dominante y cantidad de plantas asociadas.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Geneticas registradas</CardTitle>
            <CardDescription>Conteos calculados desde plantas mock.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Breeder</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Perfil dominante</TableHead>
                    <TableHead>Plantas asociadas</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {genetics.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.breeder ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{item.type}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{item.dominantProfile}</TableCell>
                      <TableCell className="font-mono text-xs">{plantCounts.get(item.id) ?? 0}</TableCell>
                      <TableCell className="max-w-[320px] truncate text-muted-foreground">{item.notes ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
