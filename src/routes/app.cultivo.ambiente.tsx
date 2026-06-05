import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getGrowBeds } from "@/services/growBedService";
import { getGrowRooms } from "@/services/growRoomService";
import { getMeasurements } from "@/services/measurementService";
import {
  calculateVPDPreview,
  createEnvironmentalLog,
  getEnvironmentalLogs,
  type EnvironmentalLogFilters,
  type VPDPreview,
} from "@/services/environmentalService";
import type { CultivationMeasurement, EnvironmentalLog, GrowBed, GrowRoom } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/ambiente")({
  head: () => ({ meta: [{ title: "Parametros ambientales · Cannabis Club Manager" }] }),
  component: EnvironmentalPage,
});

const VPD_STATUS_CLASS: Record<NonNullable<EnvironmentalLog["vpdStatus"]>, string> = {
  bajo: "border-sky-200 bg-sky-500/10 text-sky-700",
  optimo: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  alto: "border-amber-200 bg-amber-500/10 text-amber-700",
  critico: "border-red-200 bg-red-500/10 text-red-700",
};

type EnvironmentalForm = {
  roomId: string;
  bedId: string;
  batchId: string;
  date: string;
  time: string;
  airTempC: string;
  relativeHumidity: string;
  leafTempC: string;
  co2ppm: string;
  recordedByUserId: string;
  notes: string;
};

const initialForm: EnvironmentalForm = {
  roomId: "",
  bedId: "none",
  batchId: "",
  date: "2026-05-26",
  time: "09:00",
  airTempC: "25",
  relativeHumidity: "60",
  leafTempC: "",
  co2ppm: "",
  recordedByUserId: "user-cultivo-01",
  notes: "",
};

function EnvironmentalPage() {
  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [beds, setBeds] = useState<GrowBed[]>([]);
  const [logs, setLogs] = useState<EnvironmentalLog[]>([]);
  const [chemicalMeasurements, setChemicalMeasurements] = useState<CultivationMeasurement[]>([]);
  const [form, setForm] = useState<EnvironmentalForm>(initialForm);
  const [preview, setPreview] = useState<VPDPreview | null>(null);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    roomId: "all",
    bedId: "all",
    vpdStatus: "all",
  });

  useEffect(() => {
    void Promise.all([getGrowRooms(), getGrowBeds(), getEnvironmentalLogs(), getMeasurements()]).then(
      ([nextRooms, nextBeds, nextLogs, nextMeasurements]) => {
        setRooms(nextRooms);
        setBeds(nextBeds);
        setLogs(nextLogs);
        setChemicalMeasurements(nextMeasurements.slice(0, 5));
        setForm((current) => ({ ...current, roomId: nextRooms[0]?.id ?? "" }));
      },
    );
  }, []);

  useEffect(() => {
    const airTempC = Number(form.airTempC);
    const relativeHumidity = Number(form.relativeHumidity);

    if (!Number.isFinite(airTempC) || !Number.isFinite(relativeHumidity)) {
      setPreview(null);
      return;
    }

    void calculateVPDPreview({
      airTempC,
      relativeHumidity,
      leafTempC: form.leafTempC ? Number(form.leafTempC) : undefined,
    }).then(setPreview);
  }, [form.airTempC, form.relativeHumidity, form.leafTempC]);

  const bedsForSelectedRoom = useMemo(
    () => beds.filter((bed) => bed.roomId === form.roomId),
    [beds, form.roomId],
  );

  const filteredBeds = useMemo(() => {
    if (filters.roomId === "all") return beds;
    return beds.filter((bed) => bed.roomId === filters.roomId);
  }, [beds, filters.roomId]);

  async function refreshLogs(nextFilters = filters) {
    const serviceFilters: EnvironmentalLogFilters = {};
    if (nextFilters.dateFrom) serviceFilters.dateFrom = nextFilters.dateFrom;
    if (nextFilters.dateTo) serviceFilters.dateTo = nextFilters.dateTo;
    if (nextFilters.roomId !== "all") serviceFilters.roomId = nextFilters.roomId;
    if (nextFilters.bedId !== "all") serviceFilters.bedId = nextFilters.bedId;
    if (nextFilters.vpdStatus !== "all") {
      serviceFilters.vpdStatus = nextFilters.vpdStatus as EnvironmentalLog["vpdStatus"];
    }

    setLogs(await getEnvironmentalLogs(serviceFilters));
  }

  async function handleCreateLog() {
    const newLog = await createEnvironmentalLog({
      roomId: form.roomId,
      bedId: form.bedId === "none" ? undefined : form.bedId,
      batchId: form.batchId || undefined,
      date: form.date,
      time: form.time,
      airTempC: Number(form.airTempC),
      relativeHumidity: Number(form.relativeHumidity),
      leafTempC: form.leafTempC ? Number(form.leafTempC) : undefined,
      co2ppm: form.co2ppm ? Number(form.co2ppm) : undefined,
      recordedByUserId: form.recordedByUserId,
      notes: form.notes || undefined,
    });

    setLogs((current) => [newLog, ...current]);
    setForm((current) => ({ ...current, notes: "" }));
  }

  function roomName(roomId: string): string {
    return rooms.find((room) => room.id === roomId)?.name ?? roomId;
  }

  function bedName(bedId?: string): string {
    if (!bedId) return "-";
    return beds.find((bed) => bed.id === bedId)?.name ?? bedId;
  }

  function leafTemperatureDisplay(log: EnvironmentalLog) {
    if (typeof log.leafTempC === "number") {
      return { value: `${log.leafTempC} C`, label: "medida", title: "Temperatura de hoja/canopia medida." };
    }
    if (typeof log.airTempC === "number") {
      return {
        value: `Estimada ${(log.airTempC - 2.8).toFixed(1)} C`,
        label: "estimada",
        title: "Temperatura estimada de hoja/canopia usada para calcular VPD",
      };
    }
    return { value: "Sin dato", label: "", title: "" };
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Parametros ambientales</h1>
        <p className="text-sm text-muted-foreground">
          Registro interno de temperatura, humedad, CO2 y VPD con datos ficticios.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo registro</CardTitle>
            <CardDescription>El VPD se calcula automaticamente antes de guardar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Sala</Label>
                <Select value={form.roomId} onValueChange={(roomId) => setForm({ ...form, roomId, bedId: "none" })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar sala" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Camilla opcional</Label>
                <Select value={form.bedId} onValueChange={(bedId) => setForm({ ...form, bedId })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin camilla</SelectItem>
                    {bedsForSelectedRoom.map((bed) => (
                      <SelectItem key={bed.id} value={bed.id}>{bed.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lote opcional</Label>
                <Input value={form.batchId} onChange={(event) => setForm({ ...form, batchId: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Temperatura ambiente C</Label>
                <Input type="number" value={form.airTempC} onChange={(event) => setForm({ ...form, airTempC: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Humedad relativa %</Label>
                <Input type="number" value={form.relativeHumidity} onChange={(event) => setForm({ ...form, relativeHumidity: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Temperatura hoja/canopia C</Label>
                <Input type="number" value={form.leafTempC} onChange={(event) => setForm({ ...form, leafTempC: event.target.value })} />
                <p className="text-xs text-muted-foreground">
                  La temperatura de hoja/canopia mejora la precision del VPD. Si no se carga, el sistema puede usar una estimacion.
                </p>
              </div>
              <div className="space-y-2">
                <Label>CO2 ppm</Label>
                <Input type="number" value={form.co2ppm} onChange={(event) => setForm({ ...form, co2ppm: event.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Responsable</Label>
                <Input value={form.recordedByUserId} onChange={(event) => setForm({ ...form, recordedByUserId: event.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Observaciones</Label>
                <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
              </div>
            </div>

            <div className="rounded-md border bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">VPD calculado</p>
                  <p className="font-mono text-2xl font-semibold">{preview ? `${preview.calculatedVPD} kPa` : "-"}</p>
                </div>
                {preview ? (
                  <Badge variant="outline" className={VPD_STATUS_CLASS[preview.vpdStatus]}>
                    {preview.vpdStatus}
                  </Badge>
                ) : null}
              </div>
            </div>

            <Button onClick={handleCreateLog} className="w-full gap-2" disabled={!form.roomId}>
              <Plus className="h-4 w-4" />
              Registrar parametro
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial ambiental</CardTitle>
            <CardDescription>Filtros locales sobre registros mock.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-5">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })}
              />
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })}
              />
              <Select value={filters.roomId} onValueChange={(roomId) => setFilters({ ...filters, roomId, bedId: "all" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las salas</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.bedId} onValueChange={(bedId) => setFilters({ ...filters, bedId })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las camillas</SelectItem>
                  {filteredBeds.map((bed) => (
                    <SelectItem key={bed.id} value={bed.id}>{bed.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.vpdStatus} onValueChange={(vpdStatus) => setFilters({ ...filters, vpdStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los VPD</SelectItem>
                  <SelectItem value="bajo">Bajo</SelectItem>
                  <SelectItem value="optimo">Optimo</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="critico">Critico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" onClick={() => void refreshLogs()} className="gap-2">
              <Activity className="h-4 w-4" />
              Aplicar filtros
            </Button>

            <div className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Parametros quimicos relacionados</p>
                <span className="text-xs text-muted-foreground">Ultimas mediciones</span>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {chemicalMeasurements.map((item) => (
                  <div key={item.id} className="rounded-md bg-muted/40 px-3 py-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="font-mono">{item.date} {item.time}</span>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      pH liq. {item.liquidPH ?? "-"} - PPM liq. {item.liquidPPM ?? "-"} - pH sust. {item.substratePH ?? "-"} - PPM sust. {item.substratePPM ?? "-"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <p className="border-b px-3 py-2 text-xs text-muted-foreground">
                La temperatura de hoja/canopia es opcional. Si no se mide, el sistema puede estimarla para calcular el VPD.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Sala</TableHead>
                    <TableHead>Camilla</TableHead>
                    <TableHead>Temp.</TableHead>
                    <TableHead>HR</TableHead>
                    <TableHead>Hoja</TableHead>
                    <TableHead>CO2</TableHead>
                    <TableHead>VPD</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{log.time}</TableCell>
                      <TableCell>{roomName(log.roomId)}</TableCell>
                      <TableCell>{bedName(log.bedId)}</TableCell>
                      <TableCell className="font-mono text-xs">{log.airTempC} C</TableCell>
                      <TableCell className="font-mono text-xs">{log.relativeHumidity} %</TableCell>
                      <TableCell className="text-xs" title={leafTemperatureDisplay(log).title}>
                        <span className="font-mono">{leafTemperatureDisplay(log).value}</span>
                        {leafTemperatureDisplay(log).label ? (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            {leafTemperatureDisplay(log).label}
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.co2ppm ?? "-"} ppm</TableCell>
                      <TableCell className="font-mono text-xs">{log.calculatedVPD ?? "-"} kPa</TableCell>
                      <TableCell>
                        {log.vpdStatus ? (
                          <Badge variant="outline" className={VPD_STATUS_CLASS[log.vpdStatus]}>
                            {log.vpdStatus}
                          </Badge>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
