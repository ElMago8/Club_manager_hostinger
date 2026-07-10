const socios = [
  { id: 1, nroSocio: "CCM-001", nombre: "Martín Alvarez", dni: "32145678", estado: "activo", fechaIngreso: "2023-03-15", email: "martin@email.com", telefono: "11-4521-8832" },
  { id: 2, nroSocio: "CCM-002", nombre: "Laura Fernández", dni: "28934521", estado: "activo", fechaIngreso: "2023-05-20", email: "laura@email.com", telefono: "11-6734-2210" },
  { id: 3, nroSocio: "CCM-003", nombre: "Diego Romero", dni: "35421789", estado: "inactivo", fechaIngreso: "2023-01-10", email: "diego@email.com", telefono: "11-5532-9901" },
  { id: 4, nroSocio: "CCM-004", nombre: "Sofía Morales", dni: "30218743", estado: "activo", fechaIngreso: "2024-02-08", email: "sofia@email.com", telefono: "11-7845-3312" },
  { id: 5, nroSocio: "CCM-005", nombre: "Carlos Pérez", dni: "26789012", estado: "suspendido", fechaIngreso: "2022-11-30", email: "carlos@email.com", telefono: "11-4412-6678" },
  { id: 6, nroSocio: "CCM-006", nombre: "Ana González", dni: "33456789", estado: "activo", fechaIngreso: "2024-04-01", email: "ana@email.com", telefono: "11-9923-4401" },
  { id: 7, nroSocio: "CCM-007", nombre: "Lucía Torres", dni: "29012345", estado: "activo", fechaIngreso: "2023-08-15", email: "lucia@email.com", telefono: "11-3345-7712" },
  { id: 8, nroSocio: "CCM-008", nombre: "Pablo Sánchez", dni: "31678901", estado: "activo", fechaIngreso: "2024-01-20", email: "pablo@email.com", telefono: "11-8821-5543" },
];

const cultivo = {
  salas: [
    { id: 1, nombre: "Sala A - Vegetativo", estado: "activa", temperatura: 24, humedad: 65, plantas: 12 },
    { id: 2, nombre: "Sala B - Floración", estado: "activa", temperatura: 26, humedad: 55, plantas: 18 },
    { id: 3, nombre: "Sala C - Clones", estado: "activa", temperatura: 22, humedad: 70, plantas: 30 },
  ],
  plantas: [
    { id: 1, codigo: "PLT-001", strain: "White Widow", sala: "Sala A", fase: "vegetativo", semanas: 3, altura: 25, estado: "saludable" },
    { id: 2, codigo: "PLT-002", strain: "OG Kush", sala: "Sala A", fase: "vegetativo", semanas: 2, altura: 18, estado: "saludable" },
    { id: 3, codigo: "PLT-003", strain: "Amnesia Haze", sala: "Sala B", fase: "floracion", semanas: 6, altura: 80, estado: "saludable" },
    { id: 4, codigo: "PLT-004", strain: "Northern Lights", sala: "Sala B", fase: "floracion", semanas: 7, altura: 90, estado: "atencion" },
    { id: 5, codigo: "PLT-005", strain: "Blue Dream", sala: "Sala B", fase: "floracion", semanas: 5, altura: 70, estado: "saludable" },
    { id: 6, codigo: "PLT-006", strain: "White Widow", sala: "Sala C", fase: "clon", semanas: 1, altura: 8, estado: "saludable" },
  ],
  cosechas: [
    { id: 1, fecha: "2024-11-10", strain: "OG Kush", sala: "Sala B", gramos: 320, estado: "completada" },
    { id: 2, fecha: "2024-12-05", strain: "Amnesia Haze", sala: "Sala B", gramos: 410, estado: "completada" },
    { id: 3, fecha: "2025-01-20", strain: "Northern Lights", sala: "Sala B", gramos: 290, estado: "pendiente" },
  ],
};

const stock = [
  { id: 1, producto: "White Widow - Seco", categoria: "flor", cantidad: 850, unidad: "g", precioInterno: 1200, alertaMinima: 200, lote: "LOT-2024-11" },
  { id: 2, producto: "OG Kush - Seco", categoria: "flor", cantidad: 620, unidad: "g", precioInterno: 1400, alertaMinima: 200, lote: "LOT-2024-12" },
  { id: 3, producto: "Amnesia Haze - Seco", categoria: "flor", cantidad: 180, unidad: "g", precioInterno: 1300, alertaMinima: 200, lote: "LOT-2024-10" },
  { id: 4, producto: "Tierra Coco Mix", categoria: "insumo", cantidad: 40, unidad: "kg", precioInterno: 350, alertaMinima: 10, lote: null },
  { id: 5, producto: "Nutriente Bloom A+B", categoria: "insumo", cantidad: 8, unidad: "L", precioInterno: 2200, alertaMinima: 2, lote: null },
  { id: 6, producto: "Northern Lights - Seco", categoria: "flor", cantidad: 90, unidad: "g", precioInterno: 1100, alertaMinima: 200, lote: "LOT-2024-09" },
];

const facturacion = [
  { id: 1, nroMovimiento: "MOV-0001", socio: "Martín Alvarez", nroSocio: "CCM-001", fecha: "2025-01-05", producto: "White Widow", gramos: 30, monto: 36000, metodoPago: "efectivo", estado: "cobrado" },
  { id: 2, nroMovimiento: "MOV-0002", socio: "Laura Fernández", nroSocio: "CCM-002", fecha: "2025-01-07", producto: "OG Kush", gramos: 15, monto: 21000, metodoPago: "transferencia", estado: "cobrado" },
  { id: 3, nroMovimiento: "MOV-0003", socio: "Ana González", nroSocio: "CCM-006", fecha: "2025-01-08", producto: "Amnesia Haze", gramos: 20, monto: 26000, metodoPago: "efectivo", estado: "cobrado" },
  { id: 4, nroMovimiento: "MOV-0004", socio: "Sofía Morales", nroSocio: "CCM-004", fecha: "2025-01-10", producto: "White Widow", gramos: 25, monto: 30000, metodoPago: "transferencia", estado: "pendiente" },
  { id: 5, nroMovimiento: "MOV-0005", socio: "Pablo Sánchez", nroSocio: "CCM-008", fecha: "2025-01-12", producto: "OG Kush", gramos: 10, monto: 14000, metodoPago: "efectivo", estado: "cobrado" },
  { id: 6, nroMovimiento: "MOV-0006", socio: "Lucía Torres", nroSocio: "CCM-007", fecha: "2025-01-14", producto: "Northern Lights", gramos: 20, monto: 22000, metodoPago: "transferencia", estado: "cobrado" },
];

const auditoria = [
  { id: 1, fecha: "2025-01-14 18:32:11", usuario: "admin", accion: "LOGIN", detalle: "Inicio de sesión exitoso", ip: "192.168.1.10" },
  { id: 2, fecha: "2025-01-14 18:35:00", usuario: "admin", accion: "SOCIO_CREAR", detalle: "Nuevo socio registrado: Pablo Sánchez (CCM-008)", ip: "192.168.1.10" },
  { id: 3, fecha: "2025-01-14 18:40:22", usuario: "admin", accion: "MOVIMIENTO_CREAR", detalle: "Movimiento MOV-0006 registrado por $22.000", ip: "192.168.1.10" },
  { id: 4, fecha: "2025-01-13 10:15:44", usuario: "encargado", accion: "CULTIVO_ACTUALIZAR", detalle: "Planta PLT-004 marcada como atención", ip: "192.168.1.22" },
  { id: 5, fecha: "2025-01-13 09:00:00", usuario: "encargado", accion: "LOGIN", detalle: "Inicio de sesión exitoso", ip: "192.168.1.22" },
  { id: 6, fecha: "2025-01-12 16:20:33", usuario: "admin", accion: "STOCK_ACTUALIZAR", detalle: "Stock de Amnesia Haze actualizado: +180g (LOT-2024-10)", ip: "192.168.1.10" },
  { id: 7, fecha: "2025-01-10 11:05:18", usuario: "admin", accion: "SOCIO_SUSPENDER", detalle: "Socio CCM-005 suspendido", ip: "192.168.1.10" },
];

const dashboard = {
  resumen: {
    totalSocios: socios.length,
    sociosActivos: socios.filter(s => s.estado === "activo").length,
    plantasEnCultivo: cultivo.plantas.length,
    stockTotal: stock.filter(s => s.categoria === "flor").reduce((acc, s) => acc + s.cantidad, 0),
    recaudacionMes: facturacion.filter(f => f.estado === "cobrado").reduce((acc, f) => acc + f.monto, 0),
    movimientosMes: facturacion.length,
  },
  alertasStock: stock.filter(s => s.cantidad < s.alertaMinima),
  plantasAtencion: cultivo.plantas.filter(p => p.estado === "atencion"),
  ultimosMovimientos: facturacion.slice(-3).reverse(),
};

module.exports = { socios, cultivo, stock, facturacion, auditoria, dashboard };
