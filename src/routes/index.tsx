import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDemo } from "@/hooks/useDemo";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import tickerLogo from "@/assets/Logo_CCM.png";

export const Route = createFileRoute("/")({
  component: AccessPage,
  head: () => ({
    meta: [
      { title: "Cannabis Club Manager · Acceso" },
      {
        name: "description",
        content:
          "Acceso al panel administrativo interno. Uso exclusivo de personal autorizado del club.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AccessPage() {
  const { enterDemoMode } = useDemo();
  const navigate = useNavigate();

  const handleEnterDemo = () => {
    enterDemoMode();
    navigate({ to: "/app/dashboard" });
  };

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      {/* Fondo sutil */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--color-muted)_0%,_var(--color-background)_55%)]"
      />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <img
            src={tickerLogo}
            alt=""
            aria-hidden="true"
            className="h-[52px] w-[52px] shrink-0 object-contain"
          />
          <span className="text-sm font-semibold tracking-tight">Cannabis Club Manager</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] font-medium uppercase tracking-widest text-muted-foreground sm:inline">
            Sistema interno
          </span>
          <ThemeToggle />
        </div>
      </header>

      <section className="mx-auto flex max-w-md flex-col items-stretch px-5 pt-8 pb-16 sm:pt-16">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            Acceso restringido
          </div>

          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Panel administrativo del club
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Gestión interna de socios, stock, movimientos, alertas y auditoría.
            Uso exclusivo del personal autorizado.
          </p>

          <div className="my-6 h-px bg-border" />

          <div className="space-y-3">
            <label
              htmlFor="usuario"
              className="block text-xs font-medium text-muted-foreground"
            >
              Usuario operativo
            </label>
            <input
              id="usuario"
              type="text"
              disabled
              placeholder="No disponible en demostración"
              className="h-10 w-full rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground placeholder:text-muted-foreground/70"
            />
            <label
              htmlFor="clave"
              className="block text-xs font-medium text-muted-foreground"
            >
              Clave interna
            </label>
            <input
              id="clave"
              type="password"
              disabled
              placeholder="••••••••"
              className="h-10 w-full rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground placeholder:text-muted-foreground/70"
            />
          </div>

          <button
            type="button"
            onClick={handleEnterDemo}
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
          >
            Ingresar al entorno de demostración
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Esta versión opera con datos ficticios. No procesa información real
            de socios ni de stock. La autenticación, auditoría persistente y la
            integración con organismos de control se incorporan en etapas
            posteriores.
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          v0.1 · entorno de pruebas internas · {new Date().getFullYear()}
        </p>
      </section>
    </main>
  );
}
