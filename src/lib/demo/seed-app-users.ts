import type { AppUser } from "@/types/inventory";

const ts = (daysAgo: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export function generateAppUsers(): AppUser[] {
  return [
    { id: "usr-01", name: "Admin Club", email: "admin.club@hipnosis-demo.local", role: "Administrador", status: "active", lastAccessAt: ts(0, 9) },
    { id: "usr-02", name: "Lucía Operadora", email: "op.lucia@hipnosis-demo.local", role: "Operador", status: "active", lastAccessAt: ts(0, 11) },
    { id: "usr-03", name: "Matías Operador", email: "op.matias@hipnosis-demo.local", role: "Operador", status: "active", lastAccessAt: ts(1, 14) },
    { id: "usr-04", name: "Romina Operadora", email: "op.romina@hipnosis-demo.local", role: "Operador", status: "active", lastAccessAt: ts(2, 16) },
    { id: "usr-05", name: "Auditoría Club", email: "audit.club@hipnosis-demo.local", role: "Auditor", status: "active", lastAccessAt: ts(3, 10) },
    { id: "usr-06", name: "Operador Suplente", email: "op.suplente@hipnosis-demo.local", role: "Operador", status: "inactive", lastAccessAt: ts(45, 12) },
  ];
}
