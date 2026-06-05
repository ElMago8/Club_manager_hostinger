import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateVPDTable, getVPDStatus } from "@/utils/vpdCalculator";

export const Route = createFileRoute("/app/cultivo/vpd")({
  head: () => ({ meta: [{ title: "Tabla VPD · Cannabis Club Manager" }] }),
  component: VPDTablePage,
});

type OffsetMode = "same" | "minus" | "custom";

const HUMIDITIES = [40, 45, 50, 55, 60, 65, 70, 75, 80];

const STATUS_CLASS = {
  bajo: "bg-sky-500/10 text-sky-700",
  optimo: "bg-emerald-500/10 text-emerald-700",
  alto: "bg-amber-500/10 text-amber-700",
  critico: "bg-red-500/10 text-red-700",
};

function VPDTablePage() {
  const [mode, setMode] = useState<OffsetMode>("same");
  const [customOffset, setCustomOffset] = useState("-1.5");

  const leafOffset = useMemo(() => {
    if (mode === "minus") return -2.8;
    if (mode === "custom") return Number(customOffset) || 0;
    return 0;
  }, [customOffset, mode]);

  const table = useMemo(
    () => generateVPDTable({ humidities: HUMIDITIES, leafOffset }),
    [leafOffset],
  );

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tabla VPD</h1>
        <p className="text-sm text-muted-foreground">
          Matriz tecnica generada desde la utilidad compartida de calculo VPD.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Modo de temperatura de hoja</CardTitle>
          <CardDescription>Selecciona el offset usado para calcular cada celda.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[280px_220px_1fr] md:items-end">
          <div className="space-y-2">
            <Label>Modo</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as OffsetMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="same">Hoja = aire</SelectItem>
                <SelectItem value="minus">Hoja = aire - 2.8 C</SelectItem>
                <SelectItem value="custom">Offset personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Offset C</Label>
            <Input
              type="number"
              step="0.1"
              disabled={mode !== "custom"}
              value={customOffset}
              onChange={(event) => setCustomOffset(event.target.value)}
            />
          </div>
          <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            Offset aplicado: <span className="font-mono text-foreground">{leafOffset} C</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matriz VPD</CardTitle>
          <CardDescription>Valores expresados en kPa por temperatura ambiente y humedad relativa.</CardDescription>
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
                    <TableCell className="font-mono font-medium">{row.temperature} C</TableCell>
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

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Leyenda</CardTitle>
            <CardDescription>Rangos de referencia tecnica por etapa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span>Propagacion / vegetativo temprano</span>
              <Badge variant="secondary">0.8 a 1.0 kPa</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span>Vegetativo tardio / floracion temprana</span>
              <Badge variant="secondary">1.0 a 1.2 kPa</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span>Floracion media / tardia</span>
              <Badge variant="secondary">1.2 a 1.6 kPa</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <CardTitle>Aviso tecnico</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            El VPD es una referencia tecnica. Debe interpretarse junto con el estado real de la planta,
            riego, sanidad, temperatura, humedad y etapa del cultivo.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
