import { Link } from "@tanstack/react-router";
import {
  Sprout, Leaf, Boxes, FlaskConical, Files, TrendingUp,
  Timer, CalendarDays, ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type LeafItem = { icon: React.ComponentType<{ className?: string }>; label: string };
type Branch = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  items?: LeafItem[];
};

const BRANCHES: Branch[] = [
  {
    icon: Leaf,
    title: "Genéticas",
    description: "Variedades, madres y propagación.",
    items: [
      { icon: Sprout, label: "Ficha de genéticas" },
      { icon: Leaf, label: "Madres y esquejes" },
    ],
  },
  {
    icon: Boxes,
    title: "Lotes",
    description: "Trazabilidad documental, controles y rendimiento.",
    items: [
      { icon: FlaskConical, label: "Control de calidad · laboratorio" },
      { icon: Files, label: "Archivos asociados a lotes" },
      { icon: TrendingUp, label: "Rendimientos por lote" },
    ],
  },
  {
    icon: Timer,
    title: "Curado avanzado",
    description: "Seguimiento de curado, estabilización y liberación por lote.",
  },
  {
    icon: CalendarDays,
    title: "Calendario operativo",
    description: "Tareas técnicas y operativas del equipo.",
  },
];

export function CultivoTraceabilityBlock() {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Cultivo · Trazabilidad avanzada
            </h2>
            <p className="text-sm text-muted-foreground">
              Control técnico, trazabilidad y seguimiento productivo.
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/app/cultivo">
            Ir a cultivo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <Card className="rounded-xl border bg-card shadow-xs">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {BRANCHES.map((b) => (
              <div
                key={b.title}
                className="flex flex-col rounded-lg border border-border/70 bg-background/40 p-4"
              >
                <div className="flex items-center gap-2">
                  <b.icon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">{b.title}</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>

                {b.items && b.items.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-l border-border/70 pl-3">
                    {b.items.map((it) => (
                      <li key={it.label} className="flex items-center gap-2 text-xs text-foreground/90">
                        <it.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{it.label}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 border-t border-border/60 pt-3">
                  <Link
                    to="/app/cultivo"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Ver módulo <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
