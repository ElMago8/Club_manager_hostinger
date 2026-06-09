import * as SliderPrimitive from "@radix-ui/react-slider";
import { Leaf } from "lucide-react";

import { cn } from "@/lib/utils";

interface GeneticsProfileSliderProps {
  sativaPercent?: number;
  indicaPercent?: number;
  onChange: (profile: { sativaPercent: number; indicaPercent: number }) => void;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function normalizeGeneticsProfile(sativaPercent?: number, indicaPercent?: number) {
  const sativa = Number.isFinite(sativaPercent)
    ? clampPercent(sativaPercent as number)
    : Number.isFinite(indicaPercent)
      ? 100 - clampPercent(indicaPercent as number)
      : 50;

  return {
    sativaPercent: sativa,
    indicaPercent: 100 - sativa,
  };
}

export function GeneticsProfileSlider({
  sativaPercent,
  indicaPercent,
  onChange,
}: GeneticsProfileSliderProps) {
  const profile = normalizeGeneticsProfile(sativaPercent, indicaPercent);

  function handleValueChange(value: number[]) {
    const sativa = clampPercent(value[0] ?? 50);
    onChange({
      sativaPercent: sativa,
      indicaPercent: 100 - sativa,
    });
  }

  return (
    <div className="rounded-md border bg-card/70 p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400">
          <Leaf className="h-4 w-4" />
          Sativa {profile.sativaPercent}%
        </div>
        <div className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          Balance genetico
        </div>
        <div className="flex items-center gap-2 font-semibold text-violet-600 dark:text-violet-400">
          <Leaf className="h-4 w-4 rotate-180" />
          Indica {profile.indicaPercent}%
        </div>
      </div>

      <SliderPrimitive.Root
        aria-label="Balance Sativa Indica"
        className="relative flex h-8 w-full touch-none select-none items-center"
        min={0}
        max={100}
        step={1}
        value={[profile.sativaPercent]}
        onValueChange={handleValueChange}
      >
        <SliderPrimitive.Track className="relative h-4 w-full grow overflow-hidden rounded-full border border-border bg-gradient-to-r from-[#22C55E] to-[#8B5CF6] shadow-inner">
          <div
            className="absolute inset-y-0 left-0 bg-[#22C55E]/30"
            style={{ width: `${profile.sativaPercent}%` }}
          />
          <div
            className="absolute inset-y-0 right-0 bg-[#8B5CF6]/30"
            style={{ width: `${profile.indicaPercent}%` }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block h-7 w-7 rounded-full border-2 border-background bg-foreground shadow-lg ring-2 ring-background transition-transform",
            "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        />
      </SliderPrimitive.Root>
    </div>
  );
}
