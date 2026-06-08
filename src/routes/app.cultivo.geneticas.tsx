import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/cultivation/DeleteConfirmDialog";
import { ExpandableTextCell } from "@/components/cultivation/ExpandableTextCell";
import { CultivationStatusMessage } from "@/components/cultivation/RelationshipWarning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteGenetics, getGenetics } from "@/services/geneticsService";
import type { Genetics } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/geneticas")({
  head: () => ({ meta: [{ title: "Geneticas - Cannabis Club Manager" }] }),
  component: GeneticsPage,
});

function GeneticsPage() {
  const location = useLocation();
  const [genetics, setGenetics] = useState<Genetics[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Genetics | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const nextGenetics = await getGenetics();
      setGenetics(nextGenetics);
    }

    void loadData();
  }, []);

  if (location.pathname !== "/app/cultivo/geneticas") {
    return <Outlet />;
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      await deleteGenetics(deleteTarget.id);
      setGenetics((current) => current.filter((genetic) => genetic.id !== deleteTarget.id));
      setDeleteTarget(null);
      setMessage("Genetica eliminada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar la genetica.");
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Geneticas</h1>
          <p className="text-sm text-muted-foreground">Listado operativo de geneticas registradas.</p>
        </header>

        <Button asChild className="gap-2">
          <Link to="/app/cultivo/geneticas/nueva">
            <Plus className="h-4 w-4" />
            Nueva genetica
          </Link>
        </Button>
      </div>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Geneticas registradas</CardTitle>
            <CardDescription>Datos cargados desde el modulo de cultivo.</CardDescription>
            {message ? <CultivationStatusMessage message={message} /> : null}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border [&_td]:text-center [&_th]:text-center">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Breeder</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>THC %</TableHead>
                    <TableHead>Sativa %</TableHead>
                    <TableHead>Indica %</TableHead>
                    <TableHead>Sabor</TableHead>
                    <TableHead>Efecto</TableHead>
                    <TableHead>Aroma</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {genetics.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Link to="/app/cultivo/geneticas/$id" params={{ id: item.id }} className="hover:underline">
                          {item.name}
                        </Link>
                      </TableCell>
                      <TableCell>{item.breeder ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{item.type}</Badge>
                      </TableCell>
                      <TableCell>{typeof item.thcPercent === "number" ? `${item.thcPercent}%` : "-"}</TableCell>
                      <TableCell>
                        {typeof item.sativaPercent === "number" ? (
                          <Badge className="border-green-500/40 bg-green-500/10 text-green-700 hover:bg-green-500/10 dark:text-green-300">
                            {item.sativaPercent}%
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {typeof item.indicaPercent === "number" ? (
                          <Badge className="border-violet-500/40 bg-violet-500/10 text-violet-700 hover:bg-violet-500/10 dark:text-violet-300">
                            {item.indicaPercent}%
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{item.taste ?? "-"}</TableCell>
                      <TableCell>{item.effect ?? "-"}</TableCell>
                      <TableCell>{item.aroma ?? "-"}</TableCell>
                      <TableCell>
                        <ExpandableTextCell title={`Observaciones de ${item.name}`} text={item.notes} className="max-w-[180px]" />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1 whitespace-nowrap">
                          <Button asChild variant="ghost" size="sm" className="gap-1 text-emerald-700 hover:text-emerald-800">
                            <Link to="/app/cultivo/geneticas/$id" params={{ id: item.id }}>
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        entityLabel="genetica"
        itemName={deleteTarget?.name}
        description={`Estas por eliminar la genetica ${deleteTarget?.name ?? ""}. Si esta asociada a madres, lotes o plantas, la base puede impedir la eliminacion.`}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
