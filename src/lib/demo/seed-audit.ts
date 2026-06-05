import type { AuditEntry, AuditLevel } from "@/types/inventory";

const ts = (daysAgo: number, hour = 10, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

interface Template {
  action: string;
  module: string;
  entityType: string;
  entityName: string;
  detail: string;
  level: AuditLevel;
  role: AuditEntry["role"];
  user: string;
}

const templates: Template[] = [
  { action: "Inicio de sesión", module: "Sistema", entityType: "Sesión", entityName: "admin.club", detail: "Acceso desde panel interno.", level: "informativo", role: "Administrador", user: "admin.club" },
  { action: "Registro de dispensa", module: "Movimientos", entityType: "Movimiento", entityName: "MOV-2026001", detail: "Dispensa autorizada a socio HC-0007.", level: "informativo", role: "Operador", user: "op.lucia" },
  { action: "Registro de cosecha", module: "Movimientos", entityType: "Movimiento", entityName: "MOV-2026014", detail: "Entrada de 320 g desde Sala Cultivo A.", level: "informativo", role: "Operador", user: "op.matias" },
  { action: "Ajuste de stock", module: "Productos", entityType: "Producto", entityName: "LOT-FL-2026-002", detail: "Ajuste de -8 g registrado tras reconciliación.", level: "medio", role: "Operador", user: "op.romina" },
  { action: "Merma registrada", module: "Movimientos", entityType: "Movimiento", entityName: "MOV-2026032", detail: "Merma de 4 g en Lote LOT-FL-2026-006.", level: "medio", role: "Operador", user: "op.lucia" },
  { action: "Alta de socio", module: "Socios", entityType: "Socio", entityName: "HC-0033", detail: "Nuevo socio dado de alta con cupo de 40 g.", level: "informativo", role: "Administrador", user: "admin.club" },
  { action: "Suspensión de socio", module: "Socios", entityType: "Socio", entityName: "HC-0009", detail: "Socio suspendido por documentación vencida.", level: "critico", role: "Administrador", user: "admin.club" },
  { action: "Actualización de cupo", module: "Socios", entityType: "Socio", entityName: "HC-0012", detail: "Cupo mensual ajustado de 40 g a 60 g.", level: "medio", role: "Administrador", user: "admin.club" },
  { action: "Resolución de alerta", module: "Alertas", entityType: "Alerta", entityName: "Stock bajo · Aceite Nocturno", detail: "Alerta marcada como resuelta tras reposición.", level: "informativo", role: "Operador", user: "op.matias" },
  { action: "Consulta de auditoría", module: "Auditoría", entityType: "Reporte", entityName: "Reporte mensual", detail: "Exportación de bitácora del mes.", level: "informativo", role: "Auditor", user: "audit.club" },
  { action: "Cambio de configuración", module: "Configuración", entityType: "Parámetro", entityName: "Mínimo por defecto", detail: "Stock mínimo por defecto actualizado.", level: "medio", role: "Administrador", user: "admin.club" },
  { action: "Alta de usuario", module: "Usuarios", entityType: "Usuario", entityName: "op.romina", detail: "Nuevo operador habilitado.", level: "medio", role: "Administrador", user: "admin.club" },
];

export function generateAudit(): AuditEntry[] {
  const entries: AuditEntry[] = [];
  for (let i = 0; i < 40; i++) {
    const t = templates[i % templates.length];
    const daysAgo = Math.floor((i / 40) * 28);
    const hour = 9 + (i % 9);
    const min = (i * 7) % 60;
    entries.push({
      id: `aud-${String(i + 1).padStart(3, "0")}`,
      timestamp: ts(daysAgo, hour, min),
      user: t.user,
      role: t.role,
      action: t.action,
      module: t.module,
      entityType: t.entityType,
      entityName: t.entityName,
      detail: t.detail,
      level: t.level,
    });
  }
  return entries;
}
