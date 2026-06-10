import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getGrowBedsByRoom } from "@/services/growBedService";
import { getGrowRoomById, updateGrowRoomTechnicalConfig } from "@/services/growRoomService";
import { getMeasurementSummary } from "@/services/measurementService";
import type {
  GrowBed,
  GrowRoom,
  GrowRoomTechnicalConfig,
  MeasurementSummary,
  IrrigationSystem,
  LightingType,
  SensorType,
} from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/salas/$id")({
  head: () => ({ meta: [{ title: "Detalle de sala · Cannabis Club Manager" }] }),
  component: GrowRoomDetailPage,
});

const SENSOR_OPTIONS: SensorType[] = [
  "temperatura",
  "humedad",
  "co2",
  "vpd",
  "temperatura_hoja",
  "ph",
  "ec",
  "otro",
];

function boolValue(value: boolean): "si" | "no" {
  return value ? "si" : "no";
}

function displayBool(value: boolean): string {
  return value ? "Si" : "No";
}

function GrowRoomDetailPage() {
  const { id } = Route.useParams();
  const [room, setRoom] = useState<GrowRoom | null>(null);
  const [roomBeds, setRoomBeds] = useState<GrowBed[]>([]);
  const [measurementSummary, setMeasurementSummary] = useState<MeasurementSummary | null>(null);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    void Promise.all([getGrowRoomById(id), getGrowBedsByRoom(id), getMeasurementSummary({ roomId: id })]).then(([nextRoom, nextBeds, nextSummary]) => {
      setRoom(nextRoom);
      setRoomBeds(nextBeds);
      setMeasurementSummary(nextSummary);
    });
  }, [id]);

  const [form, setForm] = useState<GrowRoomTechnicalConfig | null>(null);

  useEffect(() => {
    if (room) setForm({ ...room.technicalConfig });
  }, [room]);

  const sensorLabel = useMemo(
    () => form?.installedSensors.map((sensor) => sensor.replace("_", " ")).join(", ") ?? "",
    [form],
  );

  if (!room || !form) {
    return (
      <div className="mx-auto max-w-[1000px] space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/cultivo/salas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">Sala no encontrada.</CardContent>
        </Card>
      </div>
    );
  }

  async function handleSave() {
    if (!room || !form) return;
    const updatedRoom = await updateGrowRoomTechnicalConfig(room.id, form);
    setRoom({ ...updatedRoom });
    setSavedMessage("Configuracion tecnica actualizada correctamente.");
  }

  function toggleSensor(sensor: SensorType) {
    setForm((current) => {
      if (!current) return current;
      const enabled = current.installedSensors.includes(sensor);
      return {
        ...current,
        installedSensors: enabled
          ? current.installedSensors.filter((item) => item !== sensor)
          : [...current.installedSensors, sensor],
      };
    });
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/app/cultivo/salas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Salas
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{room.name}</h1>
          <p className="text-sm text-muted-foreground">Ficha tecnica de sala y configuracion editable.</p>
        </div>
        <Badge variant="outline" className="capitalize">{room.status.replace("_", " ")}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ficha de sala</CardTitle>
            <CardDescription>Informacion operativa general.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground">Codigo</p>
                <p className="font-mono">{room.code}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="capitalize">{room.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                <p className="capitalize">{room.status.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Capacidad</p>
                <p className="font-mono">{room.capacity ?? "-"} plantas</p>
              </div>
              <div>
                <p className="text-muted-foreground">Responsable</p>
                <p>{room.responsibleUserId ?? "Sin asignar"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Observaciones</p>
                <p>{room.notes ?? "Sin observaciones"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuracion tecnica</CardTitle>
            <CardDescription>Resumen de equipamiento y sensores registrados.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <div><p className="text-muted-foreground">Iluminacion</p><p className="uppercase">{room.technicalConfig.lightingType}</p></div>
            <div><p className="text-muted-foreground">Potencia total</p><p className="font-mono">{room.technicalConfig.installedPowerWatts} W</p></div>
            <div><p className="text-muted-foreground">Ventilacion</p><p>{room.technicalConfig.ventilationSystem ?? "-"}</p></div>
            <div><p className="text-muted-foreground">Extraccion</p><p>{room.technicalConfig.extractionSystem ?? "-"}</p></div>
            <div><p className="text-muted-foreground">Riego</p><p className="capitalize">{room.technicalConfig.irrigationSystem}</p></div>
            <div><p className="text-muted-foreground">Aire acondicionado</p><p>{displayBool(room.technicalConfig.hasAirConditioning)}</p></div>
            <div><p className="text-muted-foreground">Deshumidificador</p><p>{displayBool(room.technicalConfig.hasDehumidifier)}</p></div>
            <div><p className="text-muted-foreground">Sensores</p><p>{sensorLabel}</p></div>
            <div className="md:col-span-2"><p className="text-muted-foreground">Observaciones tecnicas</p><p>{room.technicalConfig.notes ?? "-"}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de parametros</CardTitle>
          <CardDescription>Promedios y alertas quimicas de la sala.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Promedio PH liquido", measurementSummary?.averageLiquidPH ?? "-"],
            ["Promedio PH sustrato", measurementSummary?.averageSubstratePH ?? "-"],
            ["Promedio PPM liquido", measurementSummary?.averageLiquidPPM ?? "-"],
            ["Promedio PPM sustrato", measurementSummary?.averageSubstratePPM ?? "-"],
            ["Alertas", measurementSummary?.alertsCount ?? 0],
            ["Criticas", measurementSummary?.criticalCount ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-mono text-xl font-semibold">{value}</p>
            </div>
          ))}
          <div className="rounded-md border p-3 sm:col-span-2 lg:col-span-6">
            <p className="text-xs text-muted-foreground">Ultima medicion registrada</p>
            <p className="font-mono text-sm">
              {measurementSummary?.latestMeasurements[0]
                ? `${measurementSummary.latestMeasurements[0].date} ${measurementSummary.latestMeasurements[0].time}`
                : "Sin mediciones"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editar configuracion tecnica</CardTitle>
          <CardDescription>Actualiza la configuracion tecnica registrada para esta sala.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de iluminacion</Label>
              <Select
                value={form.lightingType}
                onValueChange={(value) => setForm({ ...form, lightingType: value as LightingType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="led">LED</SelectItem>
                  <SelectItem value="hps">HPS</SelectItem>
                  <SelectItem value="cmh">CMH</SelectItem>
                  <SelectItem value="mixta">Mixta</SelectItem>
                  <SelectItem value="otra">Otra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Potencia total instalada</Label>
              <Input
                type="number"
                min={0}
                value={form.installedPowerWatts}
                onChange={(event) => setForm({ ...form, installedPowerWatts: Number(event.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Sistema de ventilacion</Label>
              <Input
                value={form.ventilationSystem ?? ""}
                onChange={(event) => setForm({ ...form, ventilationSystem: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Sistema de extraccion</Label>
              <Input
                value={form.extractionSystem ?? ""}
                onChange={(event) => setForm({ ...form, extractionSystem: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Sistema de riego</Label>
              <Select
                value={form.irrigationSystem}
                onValueChange={(value) => setForm({ ...form, irrigationSystem: value as IrrigationSystem })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatico">Automatico</SelectItem>
                  <SelectItem value="mixto">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Aire acondicionado</Label>
                <Select
                  value={boolValue(form.hasAirConditioning)}
                  onValueChange={(value) => setForm({ ...form, hasAirConditioning: value === "si" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Si</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deshumidificador</Label>
                <Select
                  value={boolValue(form.hasDehumidifier)}
                  onValueChange={(value) => setForm({ ...form, hasDehumidifier: value === "si" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Si</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sensores instalados</Label>
            <div className="flex flex-wrap gap-2">
              {SENSOR_OPTIONS.map((sensor) => {
                const active = form.installedSensors.includes(sensor);
                return (
                  <Button
                    key={sensor}
                    type="button"
                    variant={active ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSensor(sensor)}
                    className="capitalize"
                  >
                    {sensor.replace("_", " ")}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["targetLiquidPHMin", "PH liquido min"],
              ["targetLiquidPHMax", "PH liquido max"],
              ["targetSubstratePHMin", "PH sustrato min"],
              ["targetSubstratePHMax", "PH sustrato max"],
              ["targetLiquidPPMMin", "PPM liquido min"],
              ["targetLiquidPPMMax", "PPM liquido max"],
              ["targetSubstratePPMMin", "PPM sustrato min"],
              ["targetSubstratePPMMax", "PPM sustrato max"],
            ].map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={form[key as keyof GrowRoomTechnicalConfig] as number | undefined ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      [key]: event.target.value === "" ? undefined : Number(event.target.value),
                    })
                  }
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Observaciones tecnicas</Label>
            <Textarea
              value={form.notes ?? ""}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar configuracion
            </Button>
            {savedMessage ? <p className="text-sm text-emerald-600">{savedMessage}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Camillas de la sala</CardTitle>
          <CardDescription>Relacion visual sala - camillas con datos registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Plantas actuales</TableHead>
                  <TableHead>Lote principal</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomBeds.map((bed) => (
                  <TableRow key={bed.id}>
                    <TableCell className="font-medium">{bed.name}</TableCell>
                    <TableCell className="font-mono text-xs">{bed.code}</TableCell>
                    <TableCell className="capitalize">{bed.status.replace("_", " ")}</TableCell>
                    <TableCell className="font-mono text-xs">{bed.maxPlants}</TableCell>
                    <TableCell className="font-mono text-xs">{bed.currentPlants}</TableCell>
                    <TableCell className="font-mono text-xs">{bed.mainBatchId ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/app/cultivo/camillas/$id" params={{ id: bed.id }}>Ver camilla</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
