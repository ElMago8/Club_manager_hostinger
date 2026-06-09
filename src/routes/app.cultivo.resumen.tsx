import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/cultivo/resumen")({
  beforeLoad: () => {
    throw redirect({ to: "/app/cultivo", search: { section: "resumen" } });
  },
  component: () => null,
});
