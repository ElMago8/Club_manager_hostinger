import { Construction } from "lucide-react";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  scopeNote?: string;
}

/**
 * Pantalla sobria para módulos del MVP que aún están en preparación visual.
 * Sin datos, sin acciones. Solo declara el alcance del módulo.
 */
export function ModulePlaceholder({ title, description, scopeNote }: ModulePlaceholderProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      </header>

      <section className="rounded-xl border border-dashed border-border bg-card p-6 shadow-xs sm:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <Construction className="h-3 w-3" />
          Módulo visual en preparación
        </div>

        <h2 className="text-base font-semibold">Próximamente en esta vista</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          La estructura de este módulo está reservada. La interfaz se incorpora
          en una etapa posterior junto con los formularios, tablas y filtros
          correspondientes.
        </p>

        {scopeNote && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {scopeNote}
          </p>
        )}

        <div className="mt-6 rounded-md bg-muted/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
          Esta versión opera con datos ficticios. No existe backend, base de
          datos ni autenticación real. Toda la información se reinicia al
          cerrar la sesión de demostración.
        </div>
      </section>
    </div>
  );
}
