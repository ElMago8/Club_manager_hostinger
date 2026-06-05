import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Activity, BarChart3, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CultivoTraceabilityBlock } from "@/components/dashboard/club/CultivoTraceabilityBlock";
import { ClubKpiGrid } from "@/components/dashboard/club/ClubKpiGrid";
import { ClubAlertsPanel } from "@/components/dashboard/club/ClubAlertsPanel";
import { ClubRecentMovements } from "@/components/dashboard/club/ClubRecentMovements";
import { ClubDistribution } from "@/components/dashboard/club/ClubDistribution";
import { ClubUpcomingExpirations } from "@/components/dashboard/club/ClubUpcomingExpirations";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

import { useDemo } from "@/hooks/useDemo";
import { useOnboarding, type TourStep } from "@/hooks/useOnboarding";

const TOUR_STEPS: TourStep[] = [
  { title: "Bienvenido a Cannabis Club Manager", description: "Recorrido breve por las secciones principales del panel interno." },
  { target: "sidebar", title: "Navegación", description: "Usá la barra lateral para moverte entre socios, productos, movimientos y configuración." },
  { target: "metrics", title: "Resumen operativo", description: "Indicadores clave del club: socios, stock, dispensas, alertas y vencimientos." },
  { target: "search", title: "Búsqueda rápida", description: "Presioná CMD+K (o Ctrl+K) para buscar socios, productos y movimientos." },
  { title: "Listo", description: "Explorá el panel libremente o repetí el recorrido cuando lo necesites." },
];

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard · Cannabis Club Manager" }] }),
});

function DashboardPage() {
  const { demoStore, isDemo } = useDemo();

  const items = demoStore?.getItems() ?? [];
  const movements = demoStore?.getMovements() ?? [];
  const members = demoStore?.getMembers() ?? [];
  const categories = demoStore?.getCategories() ?? [];
  const alerts = demoStore?.getNotifications() ?? [];

  const tour = useOnboarding("dashboard");

  useEffect(() => {
    if (isDemo && !tour.hasCompleted) {
      const timer = setTimeout(() => tour.startTour(), 500);
      return () => clearTimeout(timer);
    }
  }, [isDemo, tour.hasCompleted]);

  const handleTourComplete = () => {
    tour.completeTour();
    toast.success("Recorrido finalizado.");
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Resumen operativo</h1>
        <p className="text-sm text-muted-foreground">
          Panorama interno del club: socios, stock, dispensas y alertas vigentes.
        </p>
      </div>

      <ClubKpiGrid members={members} items={items} movements={movements} alerts={alerts} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        <div data-tour="needs-attention" className="min-h-0">
          <ClubAlertsPanel alerts={alerts} />
        </div>
        <div className="min-h-0">
          <ClubUpcomingExpirations members={members} />
        </div>
      </div>

      <ClubRecentMovements movements={movements} items={items} />

      <ClubDistribution items={items} categories={categories} members={members} />

      <CultivoTraceabilityBlock />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Próximas capacidades</h2>
          <p className="text-sm text-muted-foreground">Funcionalidades planificadas para futuras versiones.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border bg-background shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <Badge variant="secondary">Coming soon</Badge>
              </div>
              <CardTitle className="pt-2 text-sm font-medium">Archivos asociados a lotes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Permitir asociar informes, fotos, controles y documentos internos a cada lote.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="rounded-xl border bg-background shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <Badge variant="secondary">Coming soon</Badge>
              </div>
              <CardTitle className="pt-2 text-sm font-medium">Integración futura con sensores</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Preparado para conectar mediciones automáticas de temperatura, humedad, VPD u otros parámetros.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="rounded-xl border bg-background shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <Badge variant="secondary">Coming soon</Badge>
              </div>
              <CardTitle className="pt-2 text-sm font-medium">Reportes comparativos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Comparar rendimiento por lote, genética, sala, ciclo e incidencias.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="rounded-xl border bg-background shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <Badge variant="secondary">Coming soon</Badge>
              </div>
              <CardTitle className="pt-2 text-sm font-medium">Costos productivos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Registrar costos básicos por ciclo para evaluar eficiencia productiva.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      <OnboardingTour
        steps={TOUR_STEPS}
        currentStep={tour.currentStep}
        isActive={tour.isActive}
        onNext={tour.next}
        onBack={tour.back}
        onSkip={tour.skipTour}
        onComplete={handleTourComplete}
      />
    </div>
  );
}
