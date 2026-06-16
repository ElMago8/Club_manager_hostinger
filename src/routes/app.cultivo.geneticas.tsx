import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Eye, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/cultivation/DeleteConfirmDialog";
import { ExpandableTextCell } from "@/components/cultivation/ExpandableTextCell";
import { CultivationStatusMessage } from "@/components/cultivation/RelationshipWarning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSortable } from "@/hooks/useSortable";
import { SortHead } from "@/components/ui/sort-head";
import { deleteGenetics, getGenetics } from "@/services/geneticsService";
import type { CannabinoidProfile, Genetics } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/geneticas")({
  head: () => ({ meta: [{ title: "Geneticas - Cannabis Club Manager" }] }),
  component: GeneticsPage,
});

const DOMINANT_LABEL: Record<Genetics["dominantProfile"], string> = {
  indica: "Índica",
  sativa: "Sativa",
  hibrida: "Híbrida",
  desconocida: "Desconocida",
};

const DOMINANT_CLASS: Record<Genetics["dominantProfile"], string> = {
  indica: "border-violet-200 bg-violet-500/10 text-violet-700",
  sativa: "border-green-200 bg-green-500/10 text-green-700",
  hibrida: "border-amber-200 bg-amber-500/10 text-amber-700",
  desconocida: "border-muted bg-muted text-muted-foreground",
};

const CANNABINOID_LABEL: Record<NonNullable<CannabinoidProfile>, string> = {
  thc_dominante: "THC dominante",
  cbd_dominante: "CBD dominante",
  balanceada_thc_cbd: "Balanceada THC:CBD",
  cbg: "CBG",
  desconocida: "Desconocida",
};

const CANNABINOID_CLASS: Record<NonNullable<CannabinoidProfile>, string> = {
  thc_dominante: "border-amber-200 bg-amber-500/10 text-amber-700",
  cbd_dominante: "border-sky-200 bg-sky-500/10 text-sky-700",
  balanceada_thc_cbd: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  cbg: "border-teal-200 bg-teal-500/10 text-teal-700",
  desconocida: "border-muted bg-muted text-muted-foreground",
};

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

  const { sorted, col: sCol, dir: sDir, toggle: sort } = useSortable(genetics);

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
                    <SortHead label="Nombre"             sortKey="name"              col={sCol} dir={sDir} onSort={sort} />
                    <SortHead label="Breeder"            sortKey="breeder"           col={sCol} dir={sDir} onSort={sort} />
                    <SortHead label="THC %"              sortKey="thcPercent"        col={sCol} dir={sDir} onSort={sort} />
                    <SortHead label="CBD %"              sortKey="cbdPercent"        col={sCol} dir={sDir} onSort={sort} />
                    <SortHead label="Sativa %"           sortKey="sativaPercent"     col={sCol} dir={sDir} onSort={sort} />
                    <SortHead label="Indica %"           sortKey="indicaPercent"     col={sCol} dir={sDir} onSort={sort} />
                    <SortHead label="Predominancia"      sortKey="dominantProfile"   col={sCol} dir={sDir} onSort={sort} />
                    <TableHead>Perfil cannabinoide</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Link to="/app/cultivo/geneticas/$id" params={{ id: item.id }} className="hover:underline">
                          {item.name}
                        </Link>
                      </TableCell>
                      <TableCell>{item.breeder ?? "-"}</TableCell>
                      <TableCell>{typeof item.thcPercent === "number" ? `${item.thcPercent}%` : "-"}</TableCell>
                      <TableCell>{typeof item.cbdPercent === "number" ? `${item.cbdPercent}%` : "-"}</TableCell>
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
                      <TableCell>
                        <Badge variant="outline" className={DOMINANT_CLASS[item.dominantProfile]}>
                          {DOMINANT_LABEL[item.dominantProfile]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.cannabinoidProfile ? (
                          <Badge variant="outline" className={CANNABINOID_CLASS[item.cannabinoidProfile]}>
                            {CANNABINOID_LABEL[item.cannabinoidProfile]}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <ExpandableTextCell title={`Observaciones de ${item.name}`} text={item.notes} className="max-w-[180px]" />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to="/app/cultivo/geneticas/$id" params={{ id: item.id }}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/app/cultivo/geneticas/$id" params={{ id: item.id }} search={{ mode: "edit" }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(item)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
