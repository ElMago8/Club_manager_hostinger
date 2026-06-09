import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type VpdLevel = "bajo" | "optimo_veg" | "optimo_flora" | "alto" | "critico";

const TEMP_MIN = 10;
const TEMP_MAX = 40;
const TEMP_STEP = 0.5;
const TEMP_DEFAULT = 25;

const HUM_MIN = 20;
const HUM_MAX = 90;
const HUM_STEP = 1;
const HUM_DEFAULT = 60;

const LEVEL_CONFIG: Record<VpdLevel, { label: string; description: string; result: string; track: string; accent: string }> = {
  bajo: {
    label: "Bajo",
    description: "Ambiente húmedo, revisar ventilación y transpiración.",
    result: "border-sky-200 bg-sky-500/10 text-sky-800 dark:text-sky-300",
    track: "bg-sky-200 dark:bg-sky-900",
    accent: "#0ea5e9",
  },
  optimo_veg: {
    label: "Óptimo vegetativo",
    description: "Rango cómodo para crecimiento vegetativo.",
    result: "border-emerald-200 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    track: "bg-emerald-200 dark:bg-emerald-900",
    accent: "#10b981",
  },
  optimo_flora: {
    label: "Óptimo floración",
    description: "Rango útil para floración con buen control ambiental.",
    result: "border-green-200 bg-green-500/10 text-green-800 dark:text-green-300",
    track: "bg-green-200 dark:bg-green-900",
    accent: "#22c55e",
  },
  alto: {
    label: "Alto",
    description: "Ambiente seco, revisar humedad y estrés hídrico.",
    result: "border-amber-200 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    track: "bg-amber-200 dark:bg-amber-900",
    accent: "#f59e0b",
  },
  critico: {
    label: "Crítico",
    description: "Riesgo de estrés. Ajustar temperatura o humedad.",
    result: "border-red-200 bg-red-500/10 text-red-800 dark:text-red-300",
    track: "bg-red-200 dark:bg-red-900",
    accent: "#ef4444",
  },
};

function calcVpd(tempC: number, humidity: number): number {
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  return Math.round(svp * (1 - humidity / 100) * 100) / 100;
}

function classify(vpd: number): VpdLevel {
  if (vpd < 0.8) return "bajo";
  if (vpd < 1.2) return "optimo_veg";
  if (vpd < 1.6) return "optimo_flora";
  if (vpd < 2.0) return "alto";
  return "critico";
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function RangeSlider({
  min,
  max,
  step,
  value,
  accent,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  accent: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative flex items-center py-1">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: accent, opacity: 0.5 }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        style={{ accentColor: accent }}
      />
      <div
        className="pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white shadow-md"
        style={{
          left: `calc(${pct}% - 8px)`,
          backgroundColor: accent,
        }}
      />
    </div>
  );
}

export function VpdCalculator() {
  const [temp, setTemp] = useState(TEMP_DEFAULT);
  const [hum, setHum] = useState(HUM_DEFAULT);
  const [tempStr, setTempStr] = useState(String(TEMP_DEFAULT));
  const [humStr, setHumStr] = useState(String(HUM_DEFAULT));

  const vpd = calcVpd(temp, hum);
  const level = classify(vpd);
  const cfg = LEVEL_CONFIG[level];

  function commitTemp(str: string) {
    const n = parseFloat(str);
    const safe = isNaN(n) ? TEMP_DEFAULT : clamp(n, TEMP_MIN, TEMP_MAX);
    setTemp(safe);
    setTempStr(String(safe));
  }

  function commitHum(str: string) {
    const n = parseFloat(str);
    const safe = isNaN(n) ? HUM_DEFAULT : clamp(n, HUM_MIN, HUM_MAX);
    setHum(safe);
    setHumStr(String(safe));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora VPD</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Temperatura */}
        <div className="space-y-2">
          <Label>Temperatura del aire (°C)</Label>
          <Input
            type="number"
            min={TEMP_MIN}
            max={TEMP_MAX}
            step={TEMP_STEP}
            value={tempStr}
            onChange={(e) => {
              setTempStr(e.target.value);
              const n = parseFloat(e.target.value);
              if (!isNaN(n)) setTemp(clamp(n, TEMP_MIN, TEMP_MAX));
            }}
            onBlur={() => commitTemp(tempStr)}
          />
          <RangeSlider
            min={TEMP_MIN}
            max={TEMP_MAX}
            step={TEMP_STEP}
            value={temp}
            accent={cfg.accent}
            onChange={(v) => { setTemp(v); setTempStr(String(v)); }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{TEMP_MIN} °C</span>
            <span className="font-medium text-foreground">{temp} °C</span>
            <span>{TEMP_MAX} °C</span>
          </div>
        </div>

        {/* Humedad */}
        <div className="space-y-2">
          <Label>Humedad relativa (%RH)</Label>
          <Input
            type="number"
            min={HUM_MIN}
            max={HUM_MAX}
            step={HUM_STEP}
            value={humStr}
            onChange={(e) => {
              setHumStr(e.target.value);
              const n = parseFloat(e.target.value);
              if (!isNaN(n)) setHum(clamp(n, HUM_MIN, HUM_MAX));
            }}
            onBlur={() => commitHum(humStr)}
          />
          <RangeSlider
            min={HUM_MIN}
            max={HUM_MAX}
            step={HUM_STEP}
            value={hum}
            accent={cfg.accent}
            onChange={(v) => { setHum(v); setHumStr(String(v)); }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{HUM_MIN}%</span>
            <span className="font-medium text-foreground">{hum}%</span>
            <span>{HUM_MAX}%</span>
          </div>
        </div>

        {/* Resultado */}
        <div className={`rounded-lg border p-4 transition-colors ${cfg.result}`}>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-60">VPD actual</p>
          <p className="mt-1 font-mono text-4xl font-bold leading-none">
            {vpd.toFixed(2)}
            <span className="ml-1 text-lg font-normal opacity-70">kPa</span>
          </p>
          <div className="mt-3 border-t border-current/10 pt-3">
            <p className="font-semibold">{cfg.label}</p>
            <p className="mt-0.5 text-sm opacity-75">{cfg.description}</p>
          </div>
        </div>

        {/* Barra de rangos */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Rangos de referencia</p>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            <div className="flex-[0.8] bg-sky-400/70" title="Bajo < 0.8" />
            <div className="flex-[0.4] bg-emerald-400/70" title="Óptimo veg 0.8–1.2" />
            <div className="flex-[0.4] bg-green-400/70" title="Óptimo flora 1.2–1.6" />
            <div className="flex-[0.4] bg-amber-400/70" title="Alto 1.6–2.0" />
            <div className="flex-[1] bg-red-400/70" title="Crítico > 2.0" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>0.8</span>
            <span>1.2</span>
            <span>1.6</span>
            <span>2.0</span>
            <span>+</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
