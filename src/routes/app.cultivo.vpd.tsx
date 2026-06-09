import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Pencil, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VpdCalculator } from "@/components/cultivation/VpdCalculator";
import { generateVPDTable, getVPDStatus } from "@/utils/vpdCalculator";

export const Route = createFileRoute("/app/cultivo/vpd")({
  head: () => ({ meta: [{ title: "Tabla VPD · Cannabis Club Manager" }] }),
  component: VPDTablePage,
});

const HUMIDITIES = [40, 45, 50, 55, 60, 65, 70, 75, 80];

const STORAGE_KEY = "vpd_ranges_v1";

type RangeValue = { min: number; max: number };

const RANGE_META = [
  { label: "Esquejes / plántulas", borderColor: "border-yellow-400 dark:border-yellow-500", labelColor: "text-yellow-600 dark:text-yellow-400" },
  { label: "Vegetativo",           borderColor: "border-stone-500 dark:border-stone-400",   labelColor: "text-stone-600 dark:text-stone-400" },
  { label: "Inicio flora",         borderColor: "border-violet-400 dark:border-violet-500", labelColor: "text-violet-600 dark:text-violet-400" },
  { label: "Flora media",          borderColor: "border-slate-400 dark:border-slate-500",   labelColor: "text-slate-500 dark:text-slate-400" },
  { label: "Final flora",          borderColor: "border-rose-400 dark:border-rose-500",     labelColor: "text-rose-600 dark:text-rose-400" },
] as const;

const DEFAULT_RANGES: RangeValue[] = [
  { min: 0.4, max: 0.8 },
  { min: 0.8, max: 1.2 },
  { min: 1.0, max: 1.3 },
  { min: 1.2, max: 1.5 },
  { min: 1.3, max: 1.5 },
];

function loadRanges(): RangeValue[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RANGES;
    const parsed = JSON.parse(raw) as RangeValue[];
    if (Array.isArray(parsed) && parsed.length === DEFAULT_RANGES.length) return parsed;
  } catch { /* ignorar */ }
  return DEFAULT_RANGES;
}

function saveRanges(ranges: RangeValue[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ranges));
}

const STATUS_CLASS = {
  bajo:   "bg-sky-500/10 text-sky-700",
  optimo: "bg-emerald-500/10 text-emerald-700",
  alto:   "bg-amber-500/10 text-amber-700",
  critico:"bg-red-500/10 text-red-700",
};

function fmtRange(r: RangeValue) {
  return `${r.min} – ${r.max}`;
}

function VPDTablePage() {
  const table = useMemo(
    () => generateVPDTable({ humidities: HUMIDITIES, leafOffset: 0 }),
    [],
  );

  const [ranges, setRanges] = useState<RangeValue[]>(() => loadRanges());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ min: string; max: string }[]>([]);

  function startEdit() {
    setDraft(ranges.map((r) => ({ min: String(r.min), max: String(r.max) })));
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft([]);
  }

  function setDraftField(idx: number, field: "min" | "max", value: string) {
    setDraft((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function commitEdit() {
    const next: RangeValue[] = draft.map((d, i) => {
      const min = parseFloat(d.min);
      const max = parseFloat(d.max);
      return {
        min: isNaN(min) ? DEFAULT_RANGES[i].min : Math.round(min * 100) / 100,
        max: isNaN(max) ? DEFAULT_RANGES[i].max : Math.round(max * 100) / 100,
      };
    });
    setRanges(next);
    saveRanges(next);
    setEditing(false);
    setDraft([]);
  }

  function resetDefaults() {
    setRanges(DEFAULT_RANGES);
    saveRanges(DEFAULT_RANGES);
    setEditing(false);
    setDraft([]);
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tabla VPD</h1>
        <p className="text-sm text-muted-foreground">
          Matriz técnica de VPD y calculadora interactiva.
        </p>
      </header>

      {/* Bloque principal: tabla + calculadora */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Matriz VPD</CardTitle>
            <CardDescription>Valores en kPa por temperatura ambiente y humedad relativa. Temperatura de hoja = temperatura de aire.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Temp. / HR</TableHead>
                    {HUMIDITIES.map((humidity) => (
                      <TableHead key={humidity} className="text-center">{humidity}%</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.map((row) => (
                    <TableRow key={row.temperature}>
                      <TableCell className="font-mono font-medium whitespace-nowrap">{row.temperature} °C</TableCell>
                      {row.values.map((cell) => {
                        const status = getVPDStatus(cell.vpd);
                        return (
                          <TableCell key={cell.humidity} className="text-center">
                            <span className={`inline-flex min-w-14 justify-center rounded-md px-2 py-1 font-mono text-xs ${STATUS_CLASS[status]}`}>
                              {cell.vpd}
                            </span>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <VpdCalculator />
      </div>

      {/* Bloque inferior: rangos kPa */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rangos kPa</CardTitle>
              <CardDescription className="mt-1">Valores de referencia por etapa de cultivo.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={resetDefaults} title="Restaurar valores por defecto">
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Restaurar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={commitEdit}>
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Guardar
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={startEdit}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {RANGE_META.map((meta, idx) => (
              <div
                key={meta.label}
                className={`flex flex-col gap-2 rounded-lg border-l-4 bg-muted/40 px-4 py-3 ${meta.borderColor}`}
              >
                <span className={`text-xs font-semibold uppercase tracking-wide ${meta.labelColor}`}>
                  {meta.label}
                </span>

                {editing ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={draft[idx]?.min ?? ""}
                      onChange={(e) => setDraftField(idx, "min", e.target.value)}
                      className="h-8 w-full font-mono text-sm"
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">–</span>
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={draft[idx]?.max ?? ""}
                      onChange={(e) => setDraftField(idx, "max", e.target.value)}
                      className="h-8 w-full font-mono text-sm"
                    />
                  </div>
                ) : (
                  <>
                    <span className="font-mono text-lg font-bold leading-none text-foreground">
                      {fmtRange(ranges[idx])}
                    </span>
                    <span className="text-xs text-muted-foreground">kPa</span>
                  </>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <p className="mt-3 text-xs text-muted-foreground">
              Los valores se guardan en este navegador. Usá "Restaurar" para volver a los valores por defecto.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Aviso técnico */}
      <Card className="border-amber-200 bg-amber-500/5 dark:border-amber-900 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <CardTitle>Aviso técnico</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>El VPD te dice si la planta está transpirando bien, poco o demasiado según la temperatura y la humedad.</p>
          <p>El VPD se expresa en kPa. Ese número indica qué tan fuerte el ambiente hace transpirar a la planta.</p>
          <ul className="space-y-1 pl-4">
            <li><span className="font-medium text-sky-600 dark:text-sky-400">kPa bajo:</span> la planta transpira poco por exceso de humedad.</li>
            <li><span className="font-medium text-emerald-600 dark:text-emerald-400">kPa ideal:</span> la planta transpira y absorbe bien.</li>
            <li><span className="font-medium text-amber-600 dark:text-amber-400">kPa alto:</span> el ambiente está seco/caliente y la planta puede estresarse.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
