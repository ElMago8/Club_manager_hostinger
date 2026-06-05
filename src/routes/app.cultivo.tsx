import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, CalendarClock, FileText, Leaf, Sprout, TestTube, Timer, TrendingUp, Warehouse } from "lucide-react";
import { Cell, Label, Pie, PieChart } from "recharts";

type CultivoSection = "resumen" | "trazabilidad" | "lotes" | "rendimientos" | "inventario" | "calendario";

export const Route = createFileRoute("/app/cultivo")({
  head: () => ({
    meta: [
      { title: "Cultivo · Cannabis Club Manager" },
      { name: "description", content: "Trazabilidad y seguimiento de cultivo interno." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { section?: CultivoSection } => {
    const section = search.section;
    if (
      section === "resumen" ||
      section === "trazabilidad" ||
      section === "lotes" ||
      section === "rendimientos" ||
      section === "inventario" ||
      section === "calendario"
    ) {
      return { section };
    }
    return {};
  },
  component: CultivoPage,
});

type Priority = "alta" | "media" | "baja";
type TaskStatus = "pendiente" | "en curso" | "completada";

const tareas: Array<{
  tarea: string;
  responsable: string;
  prioridad: Priority;
  estado: TaskStatus;
  fecha: string;
}> = [
  { tarea: "Revisar sala Floración 1", responsable: "M. López", prioridad: "alta", estado: "pendiente", fecha: "Hoy · 14:00" },
  { tarea: "Medir parámetros de drenaje", responsable: "J. Pérez", prioridad: "media", estado: "en curso", fecha: "Hoy · 17:30" },
  { tarea: "Inspección sanitaria", responsable: "S. Gómez", prioridad: "alta", estado: "pendiente", fecha: "Mañana · 09:00" },
  { tarea: "Preparar cosecha", responsable: "R. Díaz", prioridad: "media", estado: "pendiente", fecha: "Jue · 08:00" },
];

const geneticas: Array<{
  genetica: string;
  tipo: string;
  rendimiento: string;
  estado: string;
  notas: string;
}> = [
  { genetica: "Northern Lights", tipo: "Índica", rendimiento: "450 g/m²", estado: "activa", notas: "Buen comportamiento en sala 2." },
  { genetica: "Amnesia Haze", tipo: "Sativa", rendimiento: "500 g/m²", estado: "activa", notas: "Sensible a humedad alta." },
  { genetica: "Critical +", tipo: "Híbrida", rendimiento: "550 g/m²", estado: "en prueba", notas: "Ciclo corto · revisar floración." },
  { genetica: "White Widow", tipo: "Híbrida", rendimiento: "480 g/m²", estado: "archivada", notas: "Reemplazada por lote nuevo." },
];

const madres: Array<{
  madre: string;
  sanitario: "óptimo" | "observación" | "tratamiento";
  esquejes: number;
  revision: string;
}> = [
  { madre: "Madre NL-01", sanitario: "óptimo", esquejes: 24, revision: "Vie · 10:00" },
  { madre: "Madre AH-02", sanitario: "observación", esquejes: 12, revision: "Hoy · 16:00" },
  { madre: "Madre CR-03", sanitario: "óptimo", esquejes: 30, revision: "Lun · 09:30" },
  { madre: "Madre WW-04", sanitario: "tratamiento", esquejes: 0, revision: "Mié · 11:00" },
];

type QCStatus = "Aprobado" | "Pendiente" | "Observado" | "Retenido";

const controlesCalidad: Array<{
  lote: string;
  tipo: string;
  estado: QCStatus;
  fecha: string;
  resultado: string;
  archivo: string;
}> = [
  { lote: "FL-2026-05-KB01", tipo: "Metales pesados", estado: "Aprobado", fecha: "2026-05-10", resultado: "< 0,5 ppm", archivo: "Informe metales pesados · PDF" },
  { lote: "FL-2026-05-KB01", tipo: "Microbiología", estado: "Aprobado", fecha: "2026-05-11", resultado: "Negativo", archivo: "Microbiología lote FL-2026-05-KB01 · PDF" },
  { lote: "FL-2026-04-AH02", tipo: "Potencia", estado: "Observado", fecha: "2026-05-08", resultado: "18,2 % THC", archivo: "Potencia lote FL-2026-04-AH02 · PDF" },
  { lote: "FL-2026-04-AH02", tipo: "Pesticidas", estado: "Retenido", fecha: "2026-05-09", resultado: "Traza detectada", archivo: "Pesticidas lote FL-2026-04-AH02 · PDF" },
  { lote: "FL-2026-03-WW03", tipo: "Humedad", estado: "Pendiente", fecha: "2026-05-12", resultado: "En análisis", archivo: "Humedad lote FL-2026-03-WW03 · PDF" },
];

const archivosLotes: Array<{
  lote: string;
  tipoArchivo: string;
  nombre: string;
  estado: "Activo" | "Archivado";
  fecha: string;
}> = [
  { lote: "FL-2026-05-KB01", tipoArchivo: "Informe laboratorio", nombre: "Lab-FL-2026-05-KB01.pdf", estado: "Activo", fecha: "2026-05-10" },
  { lote: "FL-2026-05-KB01", tipoArchivo: "Foto de lote", nombre: "Foto-FL-2026-05-KB01-01.jpg", estado: "Activo", fecha: "2026-05-09" },
  { lote: "FL-2026-04-AH02", tipoArchivo: "Registro técnico", nombre: "Reg-Tec-FL-2026-04-AH02.pdf", estado: "Activo", fecha: "2026-04-28" },
  { lote: "FL-2026-04-AH02", tipoArchivo: "Acta interna", nombre: "Acta-FL-2026-04-AH02.pdf", estado: "Archivado", fecha: "2026-04-15" },
  { lote: "FL-2026-03-WW03", tipoArchivo: "Control sanitario", nombre: "Sanitario-FL-2026-03-WW03.pdf", estado: "Activo", fecha: "2026-03-20" },
];

type CuradoStatus = "En curado" | "Liberado" | "Retenido" | "Observado";

const rendimientosLote: Array<{
  lote: string;
  genetica: string;
  sala: string;
  pesoSeco: string;
  merma: string;
  diasFlora: number;
  incidencias: string;
  estado: CuradoStatus;
}> = [
  { lote: "FL-2026-05-KB01", genetica: "Critical +", sala: "Sala A", pesoSeco: "2.340 g", merma: "8,2 %", diasFlora: 58, incidencias: "Ninguna", estado: "Liberado" },
  { lote: "FL-2026-04-AH02", genetica: "Amnesia Haze", sala: "Sala B", pesoSeco: "1.890 g", merma: "12,1 %", diasFlora: 65, incidencias: "Mildiu leve", estado: "Retenido" },
  { lote: "FL-2026-03-WW03", genetica: "White Widow", sala: "Sala A", pesoSeco: "2.120 g", merma: "9,5 %", diasFlora: 60, incidencias: "Ninguna", estado: "Liberado" },
  { lote: "FL-2026-02-NL01", genetica: "Northern Lights", sala: "Sala C", pesoSeco: "1.560 g", merma: "15,3 %", diasFlora: 55, incidencias: "Plagas menores", estado: "Observado" },
];

const rendimientosGenetica: Array<{
  genetica: string;
  promedio: string;
  lotesCompletados: number;
  incidencias: string;
  estado: string;
}> = [
  { genetica: "Critical +", promedio: "550 g/m²", lotesCompletados: 6, incidencias: "Baja", estado: "Óptima" },
  { genetica: "Northern Lights", promedio: "450 g/m²", lotesCompletados: 8, incidencias: "Baja", estado: "Óptima" },
  { genetica: "Amnesia Haze", promedio: "480 g/m²", lotesCompletados: 4, incidencias: "Media", estado: "En revisión" },
  { genetica: "White Widow", promedio: "480 g/m²", lotesCompletados: 5, incidencias: "Baja", estado: "Óptima" },
];

const rendimientosSala: Array<{
  sala: string;
  lotesCompletados: number;
  pesoSecoTotal: string;
  incidencias: string;
  promedio: string;
}> = [
  { sala: "Sala A", lotesCompletados: 7, pesoSecoTotal: "14.200 g", incidencias: "Baja", promedio: "2.028 g/lote" },
  { sala: "Sala B", lotesCompletados: 5, pesoSecoTotal: "9.800 g", incidencias: "Media", promedio: "1.960 g/lote" },
  { sala: "Sala C", lotesCompletados: 3, pesoSecoTotal: "5.100 g", incidencias: "Alta", promedio: "1.700 g/lote" },
];

const curadoAvanzado: Array<{
  lote: string;
  genetica: string;
  fechaIngreso: string;
  diasCurado: number;
  pesoSecoFinal: string;
  estado: CuradoStatus;
  observaciones: string;
}> = [
  { lote: "FL-2026-05-KB01", genetica: "Critical +", fechaIngreso: "2026-05-10", diasCurado: 14, pesoSecoFinal: "2.340 g", estado: "En curado", observaciones: "Humedad estable · 62 % RH" },
  { lote: "FL-2026-04-AH02", genetica: "Amnesia Haze", fechaIngreso: "2026-04-28", diasCurado: 26, pesoSecoFinal: "1.890 g", estado: "Retenido", observaciones: "Esperando resultado de laboratorio." },
  { lote: "FL-2026-03-WW03", genetica: "White Widow", fechaIngreso: "2026-03-15", diasCurado: 45, pesoSecoFinal: "2.120 g", estado: "Liberado", observaciones: "Aprobado para stock." },
  { lote: "FL-2026-02-NL01", genetica: "Northern Lights", fechaIngreso: "2026-02-20", diasCurado: 60, pesoSecoFinal: "1.560 g", estado: "Observado", observaciones: "Revisar olor antes de liberar." },
];

const STOCK_COLORS = ["#0f766e", "#f59e0b", "#2563eb", "#dc2626", "#7c3aed"];

function parseGramValue(value: string): number {
  return Number(value.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")) || 0;
}

const stockPorGenetica = Array.from(
  curadoAvanzado.reduce((stockMap, row) => {
    stockMap.set(row.genetica, (stockMap.get(row.genetica) ?? 0) + parseGramValue(row.pesoSecoFinal));
    return stockMap;
  }, new Map<string, number>()),
).map(([genetica, cantidad], index) => ({
  genetica,
  cantidad,
  fill: STOCK_COLORS[index % STOCK_COLORS.length],
}));

const stockTotal = stockPorGenetica.reduce((total, item) => total + item.cantidad, 0);

const stockChartConfig = {
  cantidad: {
    label: "Stock",
  },
} satisfies ChartConfig;

function priorityVariant(p: Priority): "default" | "secondary" | "destructive" {
  if (p === "alta") return "destructive";
  if (p === "media") return "default";
  return "secondary";
}

function statusVariant(s: TaskStatus): "default" | "secondary" | "outline" {
  if (s === "en curso") return "default";
  if (s === "completada") return "secondary";
  return "outline";
}

function sanitaryVariant(s: "óptimo" | "observación" | "tratamiento"): "default" | "secondary" | "destructive" {
  if (s === "óptimo") return "secondary";
  if (s === "observación") return "default";
  return "destructive";
}

function qcStatusVariant(s: QCStatus): "default" | "secondary" | "outline" | "destructive" {
  if (s === "Aprobado") return "secondary";
  if (s === "Observado") return "default";
  if (s === "Retenido") return "destructive";
  return "outline";
}

function curadoVariant(s: CuradoStatus): "default" | "secondary" | "outline" | "destructive" {
  if (s === "Liberado") return "secondary";
  if (s === "En curado") return "default";
  if (s === "Retenido") return "destructive";
  return "outline";
}

function CultivoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { section } = Route.useSearch();
  const activeSection = section ?? "resumen";

  if (location.pathname !== "/app/cultivo") {
    return <Outlet />;
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cultivo</h1>
        <p className="text-sm text-muted-foreground">
          Seguimiento operativo de salas, genéticas y trazabilidad interna.
        </p>
      </header>

      <Tabs
        value={activeSection}
        onValueChange={(value) =>
          navigate({ to: "/app/cultivo", search: { section: value as CultivoSection } })
        }
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="trazabilidad">Trazabilidad avanzada</TabsTrigger>
          <TabsTrigger value="lotes">Lotes</TabsTrigger>
          <TabsTrigger value="rendimientos">Rendimientos</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="calendario">Calendario operativo</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del cultivo</CardTitle>
              <CardDescription>
                Vista previa · próximamente se mostrarán métricas operativas de salas y ciclos.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Esta sección es un preview visual. Los datos reales se conectarán cuando exista backend.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trazabilidad" className="space-y-10">
          {/* === GENÉTICAS === */}
          <section className="space-y-4">
            <div className="space-y-1 border-l-2 border-primary/60 pl-3">
              <h2 className="text-lg font-semibold tracking-tight">Genéticas</h2>
              <p className="text-sm text-muted-foreground">
                Seguimiento técnico de variedades, madres, esquejes y comportamiento observado.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Ficha de genéticas</CardTitle>
                </div>
                <CardDescription>Catálogo interno de variedades en uso o evaluación.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Genética</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Rendimiento estimado</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Notas internas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {geneticas.map((g) => (
                        <TableRow key={g.genetica}>
                          <TableCell className="font-medium">{g.genetica}</TableCell>
                          <TableCell>{g.tipo}</TableCell>
                          <TableCell className="font-mono text-xs">{g.rendimiento}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{g.estado}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{g.notas}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Madres y esquejes</CardTitle>
                </div>
                <CardDescription>Seguimiento sanitario de plantas madre y propagación.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Planta madre</TableHead>
                        <TableHead>Estado sanitario</TableHead>
                        <TableHead>Esquejes generados</TableHead>
                        <TableHead>Próxima revisión</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {madres.map((m) => (
                        <TableRow key={m.madre}>
                          <TableCell className="font-medium">{m.madre}</TableCell>
                          <TableCell>
                            <Badge variant={sanitaryVariant(m.sanitario)}>{m.sanitario}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{m.esquejes}</TableCell>
                          <TableCell className="text-muted-foreground">{m.revision}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>

        </TabsContent>

        <TabsContent value="lotes" className="space-y-4">
          {/* === LOTES === */}
          <section className="space-y-4">
            <div className="space-y-1 border-l-2 border-primary/60 pl-3">
              <h2 className="text-lg font-semibold tracking-tight">Lotes</h2>
              <p className="text-sm text-muted-foreground">
                Trazabilidad documental, controles de calidad y rendimiento productivo por lote.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Control de calidad / laboratorio</CardTitle>
                </div>
                <CardDescription>Registro visual de controles por lote y tipo de análisis.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Tipo de control</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Archivo</TableHead>
                        <TableHead className="w-[120px]">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {controlesCalidad.map((c) => (
                        <TableRow key={`${c.lote}-${c.tipo}`}>
                          <TableCell className="font-mono text-xs font-medium">{c.lote}</TableCell>
                          <TableCell>{c.tipo}</TableCell>
                          <TableCell>
                            <Badge variant={qcStatusVariant(c.estado)}>{c.estado}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{c.fecha}</TableCell>
                          <TableCell>{c.resultado}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{c.archivo}</TableCell>
                          <TableCell>
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground opacity-60 cursor-not-allowed"
                              title="Ver informe (mock)"
                            >
                              <FileText className="h-3 w-3" />
                              Ver informe
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Archivos asociados a lotes</CardTitle>
                </div>
                <CardDescription>Documentación técnica y registros vinculados a lotes de cultivo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Tipo de archivo</TableHead>
                        <TableHead>Nombre del archivo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivosLotes.map((a) => (
                        <TableRow key={`${a.lote}-${a.nombre}`}>
                          <TableCell className="font-mono text-xs font-medium">{a.lote}</TableCell>
                          <TableCell>{a.tipoArchivo}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.nombre}</TableCell>
                          <TableCell>
                            <Badge variant={a.estado === "Activo" ? "secondary" : "outline"}>{a.estado}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{a.fecha}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="rendimientos" className="space-y-4">
          <section className="flex flex-col gap-4">
            <div className="space-y-1 border-l-2 border-primary/60 pl-3">
              <h2 className="text-lg font-semibold tracking-tight">Rendimientos</h2>
              <p className="text-sm text-muted-foreground">
                Indicadores visuales de rendimiento por sala, genÃ©tica y lote.
              </p>
            </div>

            <Card className="order-3">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Rendimientos por lote</CardTitle>
                </div>
                <CardDescription>Métricas de producción y merma por lote finalizado.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Genética</TableHead>
                        <TableHead>Sala</TableHead>
                        <TableHead>Peso seco</TableHead>
                        <TableHead>Merma %</TableHead>
                        <TableHead>Días flora</TableHead>
                        <TableHead>Incidencias</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rendimientosLote.map((r) => (
                        <TableRow key={r.lote}>
                          <TableCell className="font-mono text-xs font-medium">{r.lote}</TableCell>
                          <TableCell>{r.genetica}</TableCell>
                          <TableCell>{r.sala}</TableCell>
                          <TableCell className="font-mono text-xs">{r.pesoSeco}</TableCell>
                          <TableCell className="font-mono text-xs">{r.merma}</TableCell>
                          <TableCell className="font-mono text-xs">{r.diasFlora}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{r.incidencias}</TableCell>
                          <TableCell>
                            <Badge variant={curadoVariant(r.estado)}>{r.estado}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="order-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Rendimiento por genética</CardTitle>
                </div>
                <CardDescription>Promedio de producción e incidencias por variedad.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Genética</TableHead>
                        <TableHead>Rendimiento promedio</TableHead>
                        <TableHead>Lotes completados</TableHead>
                        <TableHead>Incidencias</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rendimientosGenetica.map((r) => (
                        <TableRow key={r.genetica}>
                          <TableCell className="font-medium">{r.genetica}</TableCell>
                          <TableCell className="font-mono text-xs">{r.promedio}</TableCell>
                          <TableCell className="font-mono text-xs">{r.lotesCompletados}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{r.incidencias}</TableCell>
                          <TableCell>
                            <Badge variant={r.estado === "Óptima" ? "secondary" : "outline"}>{r.estado}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="order-1">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Rendimiento por sala</CardTitle>
                </div>
                <CardDescription>Consolidado de producción e incidencias por sala de cultivo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sala</TableHead>
                        <TableHead>Lotes completados</TableHead>
                        <TableHead>Peso seco total</TableHead>
                        <TableHead>Incidencias</TableHead>
                        <TableHead>Rendimiento promedio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rendimientosSala.map((r) => (
                        <TableRow key={r.sala}>
                          <TableCell className="font-medium">{r.sala}</TableCell>
                          <TableCell className="font-mono text-xs">{r.lotesCompletados}</TableCell>
                          <TableCell className="font-mono text-xs">{r.pesoSecoTotal}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{r.incidencias}</TableCell>
                          <TableCell className="font-mono text-xs">{r.promedio}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>

        </TabsContent>

        <TabsContent value="inventario" className="space-y-4">
          <section className="space-y-4">
            <div className="space-y-1 border-l-2 border-primary/60 pl-3">
              <h2 className="text-lg font-semibold tracking-tight">Inventario</h2>
              <p className="text-sm text-muted-foreground">
                Stock visual por genÃ©tica y seguimiento interno de curado por lote.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Stock</CardTitle>
                </div>
                <CardDescription>DistribuciÃ³n visual del stock ficticio disponible por genÃ©tica.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-[minmax(260px,360px)_1fr] lg:items-center">
                  <ChartContainer config={stockChartConfig} className="mx-auto aspect-square h-[240px]">
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel nameKey="genetica" />}
                      />
                      <Pie
                        data={stockPorGenetica}
                        dataKey="cantidad"
                        nameKey="genetica"
                        innerRadius={64}
                        outerRadius={92}
                        strokeWidth={4}
                      >
                        {stockPorGenetica.map((item) => (
                          <Cell key={item.genetica} fill={item.fill} />
                        ))}
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                  <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">
                                    {stockTotal.toLocaleString("es-AR")}
                                  </tspan>
                                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 22} className="fill-muted-foreground text-xs">
                                    g totales
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Stock total</p>
                      <p className="font-mono text-2xl font-semibold">{stockTotal.toLocaleString("es-AR")} g</p>
                    </div>

                    <div className="grid gap-2">
                      {stockPorGenetica.map((item) => (
                        <div key={item.genetica} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <span className="flex min-w-0 items-center gap-2 text-sm">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: item.fill }}
                            />
                            <span className="truncate">{item.genetica}</span>
                          </span>
                          <span className="font-mono text-sm">{item.cantidad.toLocaleString("es-AR")} g</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Curado avanzado</CardTitle>
                </div>
                <CardDescription>Seguimiento visual del tiempo de curado y estado de liberaciÃ³n por lote.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>GenÃ©tica</TableHead>
                        <TableHead>Fecha ingreso</TableHead>
                        <TableHead>DÃ­as en curado</TableHead>
                        <TableHead>Peso seco final</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {curadoAvanzado.map((c) => (
                        <TableRow key={c.lote}>
                          <TableCell className="font-mono text-xs font-medium">{c.lote}</TableCell>
                          <TableCell>{c.genetica}</TableCell>
                          <TableCell className="text-muted-foreground">{c.fechaIngreso}</TableCell>
                          <TableCell className="font-mono text-xs">{c.diasCurado}</TableCell>
                          <TableCell className="font-mono text-xs">{c.pesoSecoFinal}</TableCell>
                          <TableCell>
                            <Badge variant={curadoVariant(c.estado)}>{c.estado}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{c.observaciones}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="calendario" className="space-y-4">
          {/* === CALENDARIO OPERATIVO === */}
          <section className="space-y-4">
            <div className="space-y-1 border-l-2 border-primary/60 pl-3">
              <h2 className="text-lg font-semibold tracking-tight">Calendario operativo</h2>
              <p className="text-sm text-muted-foreground">
                El calendario operativo completo ahora funciona con backend real.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Calendario operativo</CardTitle>
                </div>
                <CardDescription>Tareas, filtros, estados y acciones conectadas a la API local.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Abrí la vista completa para crear tareas, filtrar, marcar en curso, completar o cancelar.
                </p>
                <Button asChild>
                  <Link to="/app/cultivo/calendario">Abrir calendario operativo</Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
