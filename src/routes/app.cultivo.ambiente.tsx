import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useSortable } from "@/hooks/useSortable";
import { SortHead } from "@/components/ui/sort-head";
import { getGrowBeds } from "@/services/growBedService";
import { getGrowRooms } from "@/services/growRoomService";
import {
  calculateVPDPreview,
  createEnvironmentalLog,
  getEnvironmentalLogs,
  type EnvironmentalLogFilters,
  type VPDPreview,
} from "@/services/environmentalService";
import type { EnvironmentalLog, GrowBed, GrowRoom } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/ambiente")({
  head: () => ({ meta: [{ title: "Parametros ambientales · Cannabis Club Manager" }] }),
  component: EnvironmentalPage,
});

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
  const [form, setForm] = useState<EnvironmentalForm>(initialForm);
  const [preview, setPreview] = useState<VPDPreview | null>(null);
  const [filters, setFilters] = useState({
    dateFrom: "",
    roomId: "all",
    bedId: "all",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void Promise.all([getGrowRooms(), getGrowBeds()]).then(([nextRooms, nextBeds]) => {
      setRooms(nextRooms);
      setBeds(nextBeds);
      setForm((current) => ({ ...current, roomId: nextRooms[0]?.id ?? "" }));
    });
  }, []);

  useEffect(() => {
    void refreshLogs(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateFrom, filters.roomId, filters.bedId]);

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
    if (nextFilters.roomId !== "all") serviceFilters.roomId = nextFilters.roomId;
    if (nextFilters.bedId !== "all") serviceFilters.bedId = nextFilters.bedId;

    setLogs(await getEnvironmentalLogs(serviceFilters));
  }

  async function handleCreateLog() {
    try {
      setSaving(true);
      setMessage("");
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
      setMessage("Registro guardado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el registro.");
    } finally {
      setSaving(false);
    }
  }

  function roomName(roomId: string): string {
    return rooms.find((room) => room.id === roomId)?.name ?? roomId;
  }

  function bedName(bedId?: string): string {
    if (!bedId) return "-";
    return beds.find((bed) => bed.id === bedId)?.name ?? bedId;
  }

  const flatLogs = useMemo(() => logs.map((l) => ({
    ...l,
    _roomName: rooms.find((r) => r.id === l.roomId)?.name ?? l.roomId,
    _bedName:  l.bedId ? (beds.find((b) => b.id === l.bedId)?.name ?? "-") : "-",
  })), [logs, rooms, beds]);

  const { sorted, col: sCol, dir: sDir, toggle: sort } = useSortable(flatLogs);

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

      <div className="space-y-4">
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
                <DateInput value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
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
                <Label>CO2 ppm <span className="font-normal text-muted-foreground">(opcional)</span></Label>
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
              <p className="text-xs text-muted-foreground">VPD calculado</p>
              <p className="font-mono text-2xl font-semibold">{preview ? `${preview.calculatedVPD} kPa` : "-"}</p>
            </div>

            {message ? (
              <p className={`rounded-md border px-3 py-2 text-sm ${message.startsWith("Registro") ? "border-emerald-200 bg-emerald-500/10 text-emerald-700" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
                {message}
              </p>
            ) : null}
            <Button onClick={() => void handleCreateLog()} className="w-full gap-2" disabled={!form.roomId || saving}>
              <Plus className="h-4 w-4" />
              {saving ? "Guardando..." : "Registrar parametro"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial ambiental</CardTitle>
            <CardDescription>Filtros locales sobre registros mock.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <DateInput
                value={filters.dateFrom}
                onChange={(v) => setFilters({ ...filters, dateFrom: v })}
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
            </div>

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead label="Fecha"   sortKey="date"             col={sCol} dir={sDir} onSort={sort} />
                    <SortHead label="Hora"    sortKey="time"             col={sCol} dir={sDir} onSort={sort} />
                    <SortHead label="Sala"    sortKey="_roomName"        col={sCol} dir={sDir} onSort={sort} />
                    <SortHead label="Camilla" sortKey="_bedName"         col={sCol} dir={sDir} onSort={sort} />
                    <SortHead label="Temp."   sortKey="airTempC"         col={sCol} dir={sDir} onSort={sort} />
                    <SortHead label="HR"      sortKey="relativeHumidity" col={sCol} dir={sDir} onSort={sort} />
                    <SortHead label="Hoja"    sortKey="leafTempC"        col={sCol} dir={sDir} onSort={sort} />
                    <SortHead label="CO2"     sortKey="co2ppm"           col={sCol} dir={sDir} onSort={sort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((log) => (
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
