import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
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
import { getMotherPlants } from "@/services/motherPlantService";
import { getPlants } from "@/services/plantService";
import {
  createMeasurement,
  getLocalMeasurementStatus,
  getMeasurements,
  getMeasurementSummary,
  type MeasurementFilters,
} from "@/services/measurementService";
import type {
  CultivationMeasurement,
  GrowBed,
  GrowRoom,
  MeasurementMethod,
  MeasurementStatus,
  MeasurementType,
  MotherPlant,
  Plant,
} from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/mediciones")({
  head: () => ({ meta: [{ title: "Mediciones pH / PPM - Cannabis Club Manager" }] }),
  component: MeasurementsPage,
});

type MeasurementForm = {
  measurementType: MeasurementType;
  date: string;
  time: string;
  roomId: string;
  bedId: string;
  plantId: string;
  motherPlantId: string;
  batchId: string;
  substratePH: string;
  substratePPM: string;
  substrateEC: string;
  liquidPH: string;
  liquidPPM: string;
  liquidEC: string;
  runoffPH: string;
  runoffPPM: string;
  runoffEC: string;
  waterTempC: string;
  substrateTempC: string;
  measurementMethod: MeasurementMethod;
  responsibleName: string;
  notes: string;
};

const initialForm: MeasurementForm = {
  measurementType: "mixed",
  date: "2026-05-30",
  time: "09:00",
  roomId: "none",
  bedId: "none",
  plantId: "none",
  motherPlantId: "none",
  batchId: "",
  substratePH: "",
  substratePPM: "",
  substrateEC: "",
  liquidPH: "",
  liquidPPM: "",
  liquidEC: "",
  runoffPH: "",
  runoffPPM: "",
  runoffEC: "",
  waterTempC: "",
  substrateTempC: "",
  measurementMethod: "gota",
  responsibleName: "Operador demo",
  notes: "",
};

const STATUS_LABEL: Record<MeasurementStatus, string> = {
  normal: "Normal",
  observation: "Observacion",
  alert: "Alerta",
  critical: "Critico",
};

const STATUS_CLASS: Record<MeasurementStatus, string> = {
  normal: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  observation: "border-sky-200 bg-sky-500/10 text-sky-700",
  alert: "border-amber-200 bg-amber-500/10 text-amber-700",
  critical: "border-red-200 bg-red-500/10 text-red-700",
};

const TYPE_LABEL: Record<MeasurementType, string> = {
  substrate: "Sustrato",
  liquid_input: "Liquido entrada",
  runoff: "Drenaje",
  mixed: "Mixta",
  corrective: "Correctiva",
  routine_check: "Control rutinario",
};

const METHOD_LABEL: Record<MeasurementMethod, string> = {
  gota: "Gota",
  sensor: "Sensor",
  riego_continuo: "Riego continuo",
  riego_manual: "Riego manual",
  otro: "Otro",
};

function optionalNumber(value: string) {
  return value === "" ? undefined : Number(value);
}

function latestValue(measurements: CultivationMeasurement[], key: keyof CultivationMeasurement) {
  return measurements.find((item) => typeof item[key] === "number")?.[key] as number | undefined;
}

function statusBadge(status: MeasurementStatus) {
  return <Badge variant="outline" className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</Badge>;
}

function MeasurementsPage() {
  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [beds, setBeds] = useState<GrowBed[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [mothers, setMothers] = useState<MotherPlant[]>([]);
  const [measurements, setMeasurements] = useState<CultivationMeasurement[]>([]);
  const [form, setForm] = useState<MeasurementForm>(initialForm);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    roomId: "all",
    bedId: "all",
    plantId: "all",
    motherPlantId: "all",
    measurementType: "all",
    status: "all",
  });
  const [message, setMessage] = useState("");

  async function loadMeasurements(nextFilters = filters) {
    const apiFilters: MeasurementFilters = {};
    if (nextFilters.dateFrom) apiFilters.dateFrom = nextFilters.dateFrom;
    if (nextFilters.dateTo) apiFilters.dateTo = nextFilters.dateTo;
    if (nextFilters.roomId !== "all") apiFilters.roomId = nextFilters.roomId;
    if (nextFilters.bedId !== "all") apiFilters.bedId = nextFilters.bedId;
    if (nextFilters.plantId !== "all") apiFilters.plantId = nextFilters.plantId;
    if (nextFilters.motherPlantId !== "all") apiFilters.motherPlantId = nextFilters.motherPlantId;
    if (nextFilters.measurementType !== "all") apiFilters.measurementType = nextFilters.measurementType as MeasurementType;
    if (nextFilters.status !== "all") apiFilters.status = nextFilters.status as MeasurementStatus;
    setMeasurements(await getMeasurements(apiFilters));
  }

  useEffect(() => {
    void Promise.all([getGrowRooms(), getGrowBeds(), getPlants(), getMotherPlants()]).then(
      ([nextRooms, nextBeds, nextPlants, nextMothers]) => {
        setRooms(nextRooms);
        setBeds(nextBeds);
        setPlants(nextPlants);
        setMothers(nextMothers);
      },
    );
  }, []);

  useEffect(() => {
    void loadMeasurements(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateFrom, filters.dateTo, filters.roomId, filters.bedId, filters.plantId, filters.motherPlantId, filters.measurementType, filters.status]);

  const summary = useMemo(() => {
    const latest = measurements.slice(0, 6);
    return {
      latestMeasurements: latest,
      latestLiquidPH: latestValue(measurements, "liquidPH"),
      latestSubstratePH: latestValue(measurements, "substratePH"),
      latestLiquidPPM: latestValue(measurements, "liquidPPM"),
      latestSubstratePPM: latestValue(measurements, "substratePPM"),
      alertsCount: measurements.filter((item) => item.status === "alert").length,
      criticalCount: measurements.filter((item) => item.status === "critical").length,
    };
  }, [measurements]);

  const previewStatus = getLocalMeasurementStatus({
    substratePH: optionalNumber(form.substratePH),
    substratePPM: optionalNumber(form.substratePPM),
    liquidPH: optionalNumber(form.liquidPH),
    liquidPPM: optionalNumber(form.liquidPPM),
  });

  function roomName(id?: string) {
    if (!id) return "-";
    return rooms.find((room) => room.id === id)?.name ?? id;
  }

  function bedName(id?: string) {
    if (!id) return "-";
    return beds.find((bed) => bed.id === id)?.name ?? id;
  }

  function plantName(id?: string) {
    if (!id) return "-";
    return plants.find((plant) => plant.id === id)?.internalCode ?? id;
  }

  function motherName(id?: string) {
    if (!id) return "-";
    return mothers.find((mother) => mother.id === id)?.code ?? id;
  }

  async function handleSave() {
    if (!form.date || !form.time) {
      setMessage("Fecha y hora son obligatorias.");
      return;
    }

    const payload = {
      measurementType: form.measurementType,
      date: form.date,
      time: form.time,
      roomId: form.roomId === "none" ? undefined : form.roomId,
      bedId: form.bedId === "none" ? undefined : form.bedId,
      plantId: form.plantId === "none" ? undefined : form.plantId,
      motherPlantId: form.motherPlantId === "none" ? undefined : form.motherPlantId,
      batchId: form.batchId || undefined,
      relatedModule: form.motherPlantId !== "none" ? "mother" : form.plantId !== "none" ? "plant" : form.bedId !== "none" ? "bed" : "general",
      substratePH: optionalNumber(form.substratePH),
      substratePPM: optionalNumber(form.substratePPM),
      substrateEC: optionalNumber(form.substrateEC),
      liquidPH: optionalNumber(form.liquidPH),
      liquidPPM: optionalNumber(form.liquidPPM),
      liquidEC: optionalNumber(form.liquidEC),
      runoffPH: optionalNumber(form.runoffPH),
      runoffPPM: optionalNumber(form.runoffPPM),
      runoffEC: optionalNumber(form.runoffEC),
      waterTempC: optionalNumber(form.waterTempC),
      substrateTempC: optionalNumber(form.substrateTempC),
      measurementMethod: form.measurementMethod,
      responsibleName: form.responsibleName || undefined,
      notes: form.notes || undefined,
    } as const;

    const created = await createMeasurement(payload);
    setMeasurements((current) => [created, ...current]);
    setForm((current) => ({ ...initialForm, roomId: current.roomId, bedId: current.bedId }));
    setMessage(`Medicion guardada con estado ${STATUS_LABEL[created.status]}.`);
  }

  useEffect(() => {
    void getMeasurementSummary().catch(() => undefined);
  }, []);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Mediciones pH / PPM</h1>
        <p className="text-sm text-muted-foreground">Control quimico de liquidos, sustrato y drenaje.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ["Ultimo pH liquido", summary.latestLiquidPH ?? "-"],
          ["Ultimo pH sustrato", summary.latestSubstratePH ?? "-"],
          ["Ultimo PPM liquido", summary.latestLiquidPPM ?? "-"],
          ["Ultimo PPM sustrato", summary.latestSubstratePPM ?? "-"],
          ["Mediciones en alerta", summary.alertsCount],
          ["Mediciones criticas", summary.criticalCount],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="font-mono text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[440px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva medicion</CardTitle>
            <CardDescription>El estado se calcula automaticamente al guardar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Tipo de medicion</Label>
                <Select value={form.measurementType} onValueChange={(measurementType) => setForm({ ...form, measurementType: measurementType as MeasurementType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div>
              <div className="space-y-2"><Label>Hora</Label><Input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Sala</Label>
                <Select value={form.roomId} onValueChange={(roomId) => setForm({ ...form, roomId, bedId: "none" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Sin sala</SelectItem>{rooms.map((room) => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Camilla</Label><Select value={form.bedId} onValueChange={(bedId) => setForm({ ...form, bedId })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sin camilla</SelectItem>{beds.map((bed) => <SelectItem key={bed.id} value={bed.id}>{bed.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Planta</Label><Select value={form.plantId} onValueChange={(plantId) => setForm({ ...form, plantId })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sin planta</SelectItem>{plants.map((plant) => <SelectItem key={plant.id} value={plant.id}>{plant.internalCode}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Madre</Label><Select value={form.motherPlantId} onValueChange={(motherPlantId) => setForm({ ...form, motherPlantId })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sin madre</SelectItem>{mothers.map((mother) => <SelectItem key={mother.id} value={mother.id}>{mother.code}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Lote</Label><Input value={form.batchId} onChange={(event) => setForm({ ...form, batchId: event.target.value })} /></div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2"><Label>pH sustrato</Label><Input type="number" min={0} max={14} value={form.substratePH} onChange={(event) => setForm({ ...form, substratePH: event.target.value })} /></div>
              <div className="space-y-2"><Label>PPM sustrato</Label><Input type="number" min={0} value={form.substratePPM} onChange={(event) => setForm({ ...form, substratePPM: event.target.value })} /></div>
              <div className="space-y-2"><Label>EC sustrato</Label><Input type="number" min={0} value={form.substrateEC} onChange={(event) => setForm({ ...form, substrateEC: event.target.value })} /></div>
              <div className="space-y-2"><Label>pH liquido</Label><Input type="number" min={0} max={14} value={form.liquidPH} onChange={(event) => setForm({ ...form, liquidPH: event.target.value })} /></div>
              <div className="space-y-2"><Label>PPM liquido</Label><Input type="number" min={0} value={form.liquidPPM} onChange={(event) => setForm({ ...form, liquidPPM: event.target.value })} /></div>
              <div className="space-y-2"><Label>EC liquido</Label><Input type="number" min={0} value={form.liquidEC} onChange={(event) => setForm({ ...form, liquidEC: event.target.value })} /></div>
              <div className="space-y-2"><Label>pH drenaje</Label><Input type="number" min={0} max={14} value={form.runoffPH} onChange={(event) => setForm({ ...form, runoffPH: event.target.value })} /></div>
              <div className="space-y-2"><Label>PPM drenaje</Label><Input type="number" min={0} value={form.runoffPPM} onChange={(event) => setForm({ ...form, runoffPPM: event.target.value })} /></div>
              <div className="space-y-2"><Label>EC drenaje</Label><Input type="number" min={0} value={form.runoffEC} onChange={(event) => setForm({ ...form, runoffEC: event.target.value })} /></div>
              <div className="space-y-2"><Label>Temp. agua</Label><Input type="number" min={0} max={50} value={form.waterTempC} onChange={(event) => setForm({ ...form, waterTempC: event.target.value })} /></div>
              <div className="space-y-2"><Label>Temp. sustrato</Label><Input type="number" min={0} max={50} value={form.substrateTempC} onChange={(event) => setForm({ ...form, substrateTempC: event.target.value })} /></div>
              <div className="space-y-2">
                <Label>Metodo</Label>
                <Select value={form.measurementMethod} onValueChange={(measurementMethod) => setForm({ ...form, measurementMethod: measurementMethod as MeasurementMethod })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(METHOD_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2"><Label>Responsable</Label><Input value={form.responsibleName} onChange={(event) => setForm({ ...form, responsibleName: event.target.value })} /></div>
            <div className="space-y-2"><Label>Observaciones</Label><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <span>Estado previsto</span>
              {statusBadge(previewStatus)}
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button className="w-full gap-2" onClick={handleSave}><Plus className="h-4 w-4" />Guardar medicion</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
            <CardDescription>Mediciones por sala, camilla, planta, madre y lote.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
              <Input type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} />
              <Input type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} />
              <Select value={filters.roomId} onValueChange={(roomId) => setFilters({ ...filters, roomId })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas las salas</SelectItem>{rooms.map((room) => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}</SelectContent></Select>
              <Select value={filters.bedId} onValueChange={(bedId) => setFilters({ ...filters, bedId })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas las camillas</SelectItem>{beds.map((bed) => <SelectItem key={bed.id} value={bed.id}>{bed.name}</SelectItem>)}</SelectContent></Select>
              <Select value={filters.measurementType} onValueChange={(measurementType) => setFilters({ ...filters, measurementType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos los tipos</SelectItem>{Object.entries(TYPE_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
              <Select value={filters.status} onValueChange={(status) => setFilters({ ...filters, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos los estados</SelectItem>{Object.entries(STATUS_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead><TableHead>Hora</TableHead><TableHead>Tipo</TableHead><TableHead>Sala</TableHead><TableHead>Camilla</TableHead><TableHead>Planta/Madre</TableHead><TableHead>pH liq.</TableHead><TableHead>PPM liq.</TableHead><TableHead>pH sust.</TableHead><TableHead>PPM sust.</TableHead><TableHead>pH dren.</TableHead><TableHead>PPM dren.</TableHead><TableHead>Estado</TableHead><TableHead>Responsable</TableHead><TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {measurements.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.time}</TableCell>
                      <TableCell>{TYPE_LABEL[item.measurementType]}</TableCell>
                      <TableCell>{roomName(item.roomId)}</TableCell>
                      <TableCell>{bedName(item.bedId)}</TableCell>
                      <TableCell>{item.plantId ? plantName(item.plantId) : motherName(item.motherPlantId)}</TableCell>
                      <TableCell className="font-mono text-xs">{item.liquidPH ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{item.liquidPPM ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{item.substratePH ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{item.substratePPM ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{item.runoffPH ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{item.runoffPPM ?? "-"}</TableCell>
                      <TableCell>{statusBadge(item.status)}</TableCell>
                      <TableCell>{item.responsibleName ?? "-"}</TableCell>
                      <TableCell><Button variant="ghost" size="sm" disabled>Ver</Button></TableCell>
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
