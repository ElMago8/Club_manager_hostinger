/**
 * Seed idempotente — Fase 2.1: Usuarios, Roles y Permisos
 *
 * ATENCIÓN: Las contraseñas aquí son solo para desarrollo local.
 * Deben cambiarse antes de desplegar en producción.
 *
 * Ejecutar: npx prisma db seed  (desde /server)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Permisos por módulo ──────────────────────────────────────────────────────

const PERMISOS: Array<{ clavePermiso: string; modulo: string; accion: string; descripcion?: string }> = [
  // Dashboard
  { clavePermiso: "dashboard.ver",      modulo: "dashboard",       accion: "ver",      descripcion: "Ver el dashboard" },
  { clavePermiso: "dashboard.exportar", modulo: "dashboard",       accion: "exportar", descripcion: "Exportar datos del dashboard" },
  // Cultivo
  { clavePermiso: "cultivo.ver",        modulo: "cultivo",         accion: "ver",      descripcion: "Ver módulo de cultivo" },
  { clavePermiso: "cultivo.crear",      modulo: "cultivo",         accion: "crear",    descripcion: "Crear registros de cultivo" },
  { clavePermiso: "cultivo.editar",     modulo: "cultivo",         accion: "editar",   descripcion: "Editar registros de cultivo" },
  { clavePermiso: "cultivo.eliminar",   modulo: "cultivo",         accion: "eliminar", descripcion: "Eliminar registros de cultivo" },
  { clavePermiso: "cultivo.exportar",   modulo: "cultivo",         accion: "exportar", descripcion: "Exportar datos de cultivo" },
  // Socios
  { clavePermiso: "socios.ver",         modulo: "socios",          accion: "ver",      descripcion: "Ver socios" },
  { clavePermiso: "socios.crear",       modulo: "socios",          accion: "crear",    descripcion: "Crear socios" },
  { clavePermiso: "socios.editar",      modulo: "socios",          accion: "editar",   descripcion: "Editar socios" },
  { clavePermiso: "socios.eliminar",    modulo: "socios",          accion: "eliminar", descripcion: "Eliminar socios" },
  { clavePermiso: "socios.exportar",    modulo: "socios",          accion: "exportar", descripcion: "Exportar socios" },
  // Productos / Stock
  { clavePermiso: "productos_stock.ver",      modulo: "productos_stock", accion: "ver",      descripcion: "Ver productos y stock" },
  { clavePermiso: "productos_stock.crear",    modulo: "productos_stock", accion: "crear",    descripcion: "Crear productos" },
  { clavePermiso: "productos_stock.editar",   modulo: "productos_stock", accion: "editar",   descripcion: "Editar productos" },
  { clavePermiso: "productos_stock.eliminar", modulo: "productos_stock", accion: "eliminar", descripcion: "Eliminar productos" },
  { clavePermiso: "productos_stock.exportar", modulo: "productos_stock", accion: "exportar", descripcion: "Exportar productos" },
  // Movimientos
  { clavePermiso: "movimientos.ver",      modulo: "movimientos", accion: "ver",      descripcion: "Ver movimientos" },
  { clavePermiso: "movimientos.crear",    modulo: "movimientos", accion: "crear",    descripcion: "Crear movimientos" },
  { clavePermiso: "movimientos.editar",   modulo: "movimientos", accion: "editar",   descripcion: "Editar movimientos" },
  { clavePermiso: "movimientos.eliminar", modulo: "movimientos", accion: "eliminar", descripcion: "Eliminar movimientos" },
  { clavePermiso: "movimientos.exportar", modulo: "movimientos", accion: "exportar", descripcion: "Exportar movimientos" },
  // Alertas
  { clavePermiso: "alertas.ver",      modulo: "alertas", accion: "ver",      descripcion: "Ver alertas" },
  { clavePermiso: "alertas.crear",    modulo: "alertas", accion: "crear",    descripcion: "Crear alertas" },
  { clavePermiso: "alertas.editar",   modulo: "alertas", accion: "editar",   descripcion: "Editar alertas" },
  { clavePermiso: "alertas.eliminar", modulo: "alertas", accion: "eliminar", descripcion: "Eliminar alertas" },
  { clavePermiso: "alertas.exportar", modulo: "alertas", accion: "exportar", descripcion: "Exportar alertas" },
  // Usuarios y Roles
  { clavePermiso: "usuarios_roles.ver",      modulo: "usuarios_roles", accion: "ver",      descripcion: "Ver usuarios y roles" },
  { clavePermiso: "usuarios_roles.crear",    modulo: "usuarios_roles", accion: "crear",    descripcion: "Crear usuarios" },
  { clavePermiso: "usuarios_roles.editar",   modulo: "usuarios_roles", accion: "editar",   descripcion: "Editar usuarios y roles" },
  { clavePermiso: "usuarios_roles.eliminar", modulo: "usuarios_roles", accion: "eliminar", descripcion: "Eliminar usuarios" },
  { clavePermiso: "usuarios_roles.exportar", modulo: "usuarios_roles", accion: "exportar", descripcion: "Exportar usuarios" },
  // Auditoría
  { clavePermiso: "auditoria.ver",      modulo: "auditoria", accion: "ver",      descripcion: "Ver auditoría" },
  { clavePermiso: "auditoria.exportar", modulo: "auditoria", accion: "exportar", descripcion: "Exportar auditoría" },
  // Configuración
  { clavePermiso: "configuracion.ver",    modulo: "configuracion", accion: "ver",    descripcion: "Ver configuración" },
  { clavePermiso: "configuracion.editar", modulo: "configuracion", accion: "editar", descripcion: "Editar configuración" },
];

// ─── Permisos por rol ─────────────────────────────────────────────────────────

const PERMISOS_OPERADOR = new Set([
  "dashboard.ver",
  "cultivo.ver", "cultivo.crear", "cultivo.editar", "cultivo.exportar",
  "socios.ver", "socios.crear", "socios.editar", "socios.exportar",
  "productos_stock.ver", "productos_stock.crear", "productos_stock.editar", "productos_stock.exportar",
  "movimientos.ver", "movimientos.crear", "movimientos.exportar",
  "alertas.ver", "alertas.editar",
  "auditoria.ver",
]);

const PERMISOS_AUDITOR = new Set([
  "dashboard.ver", "dashboard.exportar",
  "cultivo.ver", "cultivo.exportar",
  "socios.ver", "socios.exportar",
  "productos_stock.ver", "productos_stock.exportar",
  "movimientos.ver", "movimientos.exportar",
  "alertas.ver", "alertas.exportar",
  "usuarios_roles.ver", "usuarios_roles.exportar",
  "auditoria.ver", "auditoria.exportar",
  "configuracion.ver",
]);

// ─── Usuarios de prueba ───────────────────────────────────────────────────────
// ATENCIÓN: Solo para desarrollo. Cambiar antes de producción.

const USUARIOS_SEED = [
  { codigoUsuario: "USR-0001", username: "admin",     nombre: "Administrador", apellido: "Sistema",  password: "Admin123!",    slug: "administrador" },
  { codigoUsuario: "USR-0002", username: "cultivo01", nombre: "Operador",      apellido: "Cultivo",  password: "Cultivo123!",  slug: "operador" },
  { codigoUsuario: "USR-0003", username: "stock01",   nombre: "Operador",      apellido: "Stock",    password: "Stock123!",    slug: "operador" },
  { codigoUsuario: "USR-0004", username: "auditor01", nombre: "Auditor",       apellido: "Interno",  password: "Auditor123!",  slug: "auditor" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Iniciando seed Fase 2.1 — Usuarios, Roles y Permisos...");

  // 1. Upsert permisos
  for (const permiso of PERMISOS) {
    await prisma.permiso.upsert({
      where: { clavePermiso: permiso.clavePermiso },
      update: { modulo: permiso.modulo, accion: permiso.accion, descripcion: permiso.descripcion },
      create: permiso,
    });
  }
  console.log(`  ✓ ${PERMISOS.length} permisos creados/actualizados`);

  // 2. Upsert roles
  const rolDefs = [
    { slug: "administrador", nombre: "Administrador", descripcion: "Acceso completo al sistema." },
    { slug: "operador",      nombre: "Operador",      descripcion: "Gestión operativa diaria del club, cultivo, socios, stock y movimientos, sin administrar usuarios ni configuración crítica." },
    { slug: "auditor",       nombre: "Auditor",       descripcion: "Acceso principalmente de lectura, revisión y exportación para control interno." },
  ];

  for (const rol of rolDefs) {
    await prisma.rol.upsert({
      where: { slug: rol.slug },
      update: { nombre: rol.nombre, descripcion: rol.descripcion },
      create: rol,
    });
  }
  console.log("  ✓ 3 roles creados/actualizados (administrador, operador, auditor)");

  // 3. Asignar permisos a roles
  const allPermisos = await prisma.permiso.findMany();
  const permisoMap = new Map(allPermisos.map((p) => [p.clavePermiso, p.id]));

  const roles = await prisma.rol.findMany();
  const rolMap = new Map(roles.map((r) => [r.slug, r.id]));

  for (const permiso of allPermisos) {
    const adminRolId = rolMap.get("administrador")!;
    await prisma.rolPermiso.upsert({
      where: { rolId_permisoId: { rolId: adminRolId, permisoId: permiso.id } },
      update: {},
      create: { rolId: adminRolId, permisoId: permiso.id },
    });
  }

  for (const clave of PERMISOS_OPERADOR) {
    const permisoId = permisoMap.get(clave);
    const rolId = rolMap.get("operador")!;
    if (!permisoId) continue;
    await prisma.rolPermiso.upsert({
      where: { rolId_permisoId: { rolId, permisoId } },
      update: {},
      create: { rolId, permisoId },
    });
  }

  for (const clave of PERMISOS_AUDITOR) {
    const permisoId = permisoMap.get(clave);
    const rolId = rolMap.get("auditor")!;
    if (!permisoId) continue;
    await prisma.rolPermiso.upsert({
      where: { rolId_permisoId: { rolId, permisoId } },
      update: {},
      create: { rolId, permisoId },
    });
  }
  console.log("  ✓ Permisos asignados a roles");

  // 4. Upsert usuarios de prueba
  for (const u of USUARIOS_SEED) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const usuario = await prisma.usuario.upsert({
      where: { username: u.username },
      update: { nombre: u.nombre, apellido: u.apellido, codigoUsuario: u.codigoUsuario },
      create: {
        codigoUsuario: u.codigoUsuario,
        username: u.username,
        nombre: u.nombre,
        apellido: u.apellido,
        passwordHash,
        estado: "activo",
      },
    });

    const rolId = rolMap.get(u.slug)!;
    await prisma.usuarioRol.upsert({
      where: { usuarioId_rolId: { usuarioId: usuario.id, rolId } },
      update: {},
      create: { usuarioId: usuario.id, rolId },
    });
  }
  console.log("  ✓ 4 usuarios de prueba creados/actualizados");

  // 5. Socios de prueba
  const hoy = new Date();
  const fecha = (offsetDays: number) => new Date(hoy.getTime() + offsetDays * 86_400_000);

  const SOCIOS_SEED = [
    {
      codigoSocio: "SOC-0001",
      nombre: "Juan",
      apellido: "Pérez",
      dni: "30111222",
      fechaNacimiento: new Date("1988-05-10"),
      telefono: "1123456789",
      email: "juan.perez@club-demo.local",
      localidad: "CABA",
      provincia: "Buenos Aires",
      estado: "activo",
      cupoMensualGramos: 40,
      observaciones: "Socio fundador.",
    },
    {
      codigoSocio: "SOC-0002",
      nombre: "María",
      apellido: "Gómez",
      dni: "28555777",
      fechaNacimiento: new Date("1992-11-20"),
      telefono: "1134567890",
      email: "maria.gomez@club-demo.local",
      localidad: "Rosario",
      provincia: "Santa Fe",
      estado: "activo",
      cupoMensualGramos: 30,
    },
    {
      codigoSocio: "SOC-0003",
      nombre: "Carlos",
      apellido: "Rodríguez",
      dni: "33777888",
      fechaNacimiento: new Date("1985-03-15"),
      telefono: "2994567890",
      email: "carlos.rodriguez@club-demo.local",
      localidad: "Mar del Plata",
      provincia: "Buenos Aires",
      estado: "pendiente",
      cupoMensualGramos: 25,
      observaciones: "Documentación en trámite.",
    },
    {
      codigoSocio: "SOC-0004",
      nombre: "Ana",
      apellido: "Martínez",
      dni: "25999888",
      fechaNacimiento: new Date("1980-07-22"),
      telefono: "3514567890",
      email: "ana.martinez@club-demo.local",
      localidad: "Córdoba",
      provincia: "Córdoba",
      estado: "suspendido",
      cupoMensualGramos: 20,
      observaciones: "Suspendido por falta de documentación vigente.",
    },
  ];

  for (const s of SOCIOS_SEED) {
    await prisma.socio.upsert({
      where: { codigoSocio: s.codigoSocio },
      update: {
        nombre: s.nombre,
        apellido: s.apellido,
        email: s.email,
        telefono: s.telefono,
        localidad: s.localidad,
        provincia: s.provincia,
        estado: s.estado,
        cupoMensualGramos: s.cupoMensualGramos,
        observaciones: s.observaciones ?? null,
      },
      create: s,
    });
  }
  console.log("  ✓ 4 socios de prueba creados/actualizados");

  // 6. Documentos de prueba (upsert por socio + tipo único para cada socio)
  const soc1 = await prisma.socio.findUnique({ where: { codigoSocio: "SOC-0001" } });
  const soc2 = await prisma.socio.findUnique({ where: { codigoSocio: "SOC-0002" } });
  const soc3 = await prisma.socio.findUnique({ where: { codigoSocio: "SOC-0003" } });
  const soc4 = await prisma.socio.findUnique({ where: { codigoSocio: "SOC-0004" } });

  const DOCS_SEED: Array<{
    socioId: number;
    tipoDocumento: string;
    numeroDocumento?: string;
    fechaVencimiento?: Date;
    estado: string;
  }> = [
    // SOC-0001 — credencial + REPROCANN + cert. médico vigentes
    {
      socioId: soc1!.id,
      tipoDocumento: "credencial",
      numeroDocumento: "CRED-0001",
      estado: "vigente",
    },
    {
      socioId: soc1!.id,
      tipoDocumento: "reprocann",
      numeroDocumento: "REP-001-2025",
      fechaVencimiento: fecha(180),
      estado: "vigente",
    },
    {
      socioId: soc1!.id,
      tipoDocumento: "certificado_medico",
      numeroDocumento: "CM-001",
      fechaVencimiento: fecha(210),
      estado: "vigente",
    },
    // SOC-0002 — credencial + REPROCANN por vencer
    {
      socioId: soc2!.id,
      tipoDocumento: "credencial",
      numeroDocumento: "CRED-0002",
      estado: "vigente",
    },
    {
      socioId: soc2!.id,
      tipoDocumento: "reprocann",
      numeroDocumento: "REP-002-2025",
      fechaVencimiento: fecha(20),
      estado: "por_vencer",
    },
    {
      socioId: soc2!.id,
      tipoDocumento: "certificado_medico",
      fechaVencimiento: fecha(90),
      estado: "vigente",
    },
    // SOC-0003 — documentos pendientes
    {
      socioId: soc3!.id,
      tipoDocumento: "reprocann",
      estado: "pendiente",
    },
    {
      socioId: soc3!.id,
      tipoDocumento: "certificado_medico",
      estado: "pendiente",
    },
    // SOC-0004 — REPROCANN y cert. médico vencidos
    {
      socioId: soc4!.id,
      tipoDocumento: "reprocann",
      numeroDocumento: "REP-004-2024",
      fechaVencimiento: fecha(-60),
      estado: "vencido",
    },
    {
      socioId: soc4!.id,
      tipoDocumento: "certificado_medico",
      fechaVencimiento: fecha(-10),
      estado: "vencido",
    },
  ];

  for (const doc of DOCS_SEED) {
    const existing = await prisma.documentoSocio.findFirst({
      where: { socioId: doc.socioId, tipoDocumento: doc.tipoDocumento },
    });
    if (!existing) {
      await prisma.documentoSocio.create({ data: doc });
    } else {
      await prisma.documentoSocio.update({
        where: { id: existing.id },
        data: { fechaVencimiento: doc.fechaVencimiento, estado: doc.estado, numeroDocumento: doc.numeroDocumento },
      });
    }
  }
  console.log("  ✓ Documentos de prueba creados/actualizados");

  console.log("");
  console.log("✅ Seed completado.");
  console.log("   RECORDATORIO: Cambiar contraseñas antes de producción.");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
