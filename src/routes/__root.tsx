import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { DemoProvider } from "@/contexts/DemoContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "robots", content: "noindex, nofollow" },
      { title: "Cannabis Club Manager" },
      {
        name: "description",
        content:
          "Sistema administrativo interno para clubes cannábicos registrados. Gestión de socios, stock, movimientos, alertas y auditoría.",
      },
      { property: "og:title", content: "Cannabis Club Manager" },
      {
        property: "og:description",
        content:
          "Plataforma privada de gestión operativa para clubes cannábicos registrados.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <DemoProvider>
      <RoleProvider>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
        <Toaster position="bottom-right" richColors />
      </RoleProvider>
    </DemoProvider>
  );
}
