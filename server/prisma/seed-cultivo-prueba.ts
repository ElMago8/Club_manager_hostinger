import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  const salas = await Promise.all([
    prisma.salaCultivo.upsert({
      where: { codigoSala: "SALA-VEG-01" },
      update: {
        nombre: "Sala Vegetativo",
        tipo: "vegetativo",
        estado: "activa",
        descripcion: "Sala destinada a crecimiento vegetativo y preparacion de plantas jovenes.",
        potenciaWatts: 600,
        tipoRiego: "manual",
        tieneAireAcondicionado: true,
        tieneDeshumidificador: false,
        sensores: "Temperatura, humedad",
      },
      create: {
        codigoSala: "SALA-VEG-01",
        nombre: "Sala Vegetativo",
        tipo: "vegetativo",
        estado: "activa",
        descripcion: "Sala destinada a crecimiento vegetativo y preparacion de plantas jovenes.",
        potenciaWatts: 600,
        tipoRiego: "manual",
        tieneAireAcondicionado: true,
        tieneDeshumidificador: false,
        sensores: "Temperatura, humedad",
      },
    }),
    prisma.salaCultivo.upsert({
      where: { codigoSala: "SALA-FLOR-01" },
      update: {
        nombre: "Sala Floracion 1",
        tipo: "floracion",
        estado: "activa",
        descripcion: "Sala destinada a floracion y seguimiento de produccion.",
        potenciaWatts: 1200,
        tipoRiego: "manual",
        tieneAireAcondicionado: true,
        tieneDeshumidificador: true,
        sensores: "Temperatura, humedad, VPD",
      },
      create: {
        codigoSala: "SALA-FLOR-01",
        nombre: "Sala Floracion 1",
        tipo: "floracion",
        estado: "activa",
        descripcion: "Sala destinada a floracion y seguimiento de produccion.",
        potenciaWatts: 1200,
        tipoRiego: "manual",
        tieneAireAcondicionado: true,
        tieneDeshumidificador: true,
        sensores: "Temperatura, humedad, VPD",
      },
    }),
  ]);

  const salaVegetativo = salas.find((sala) => sala.codigoSala === "SALA-VEG-01");
  const salaFloracion = salas.find((sala) => sala.codigoSala === "SALA-FLOR-01");
  if (!salaVegetativo || !salaFloracion) throw new Error("No se pudieron preparar las salas de cultivo.");

  const camillas = await Promise.all([
    prisma.camilla.upsert({
      where: { codigoCamilla: "CAM-VEG-01" },
      update: {
        salaCultivoId: salaVegetativo.id,
        nombre: "Camilla Vegetativo 1",
        estado: "activa",
        capacidadMaximaPlantas: 12,
        descripcion: "Camilla para plantas en etapa vegetativa.",
      },
      create: {
        codigoCamilla: "CAM-VEG-01",
        salaCultivoId: salaVegetativo.id,
        nombre: "Camilla Vegetativo 1",
        estado: "activa",
        capacidadMaximaPlantas: 12,
        descripcion: "Camilla para plantas en etapa vegetativa.",
      },
    }),
    prisma.camilla.upsert({
      where: { codigoCamilla: "CAM-FLOR-01" },
      update: {
        salaCultivoId: salaFloracion.id,
        nombre: "Camilla Floracion 1",
        estado: "activa",
        capacidadMaximaPlantas: 16,
        descripcion: "Camilla para plantas en etapa de floracion.",
      },
      create: {
        codigoCamilla: "CAM-FLOR-01",
        salaCultivoId: salaFloracion.id,
        nombre: "Camilla Floracion 1",
        estado: "activa",
        capacidadMaximaPlantas: 16,
        descripcion: "Camilla para plantas en etapa de floracion.",
      },
    }),
  ]);

  const camillaVegetativo = camillas.find((camilla) => camilla.codigoCamilla === "CAM-VEG-01");
  const camillaFloracion = camillas.find((camilla) => camilla.codigoCamilla === "CAM-FLOR-01");
  if (!camillaVegetativo || !camillaFloracion) throw new Error("No se pudieron preparar las camillas.");

  const geneticas = await Promise.all([
    prisma.genetica.upsert({
      where: { codigoGenetica: "GEN-001" },
      update: {
        nombre: "Lemon Haze",
        breeder: "Green House Seeds",
        tipo: "hibrida",
        thcEstimado: 22,
        cbdEstimado: 0.5,
        sativaPorcentaje: 70,
        indicaPorcentaje: 30,
        tiempoFloracionDias: 65,
        estado: "activa",
        sabor: "citrico, limon, dulce",
        efecto: "energetico, creativo, cerebral",
        aroma: "limon, incienso, fresco",
        descripcion: "Hibrida con predominancia sativa, reconocida por su perfil citrico.",
        observaciones: "Buena respuesta en vegetativo y estructura ramificada.",
      },
      create: {
        codigoGenetica: "GEN-001",
        nombre: "Lemon Haze",
        breeder: "Green House Seeds",
        tipo: "hibrida",
        thcEstimado: 22,
        cbdEstimado: 0.5,
        sativaPorcentaje: 70,
        indicaPorcentaje: 30,
        tiempoFloracionDias: 65,
        estado: "activa",
        sabor: "citrico, limon, dulce",
        efecto: "energetico, creativo, cerebral",
        aroma: "limon, incienso, fresco",
        descripcion: "Hibrida con predominancia sativa, reconocida por su perfil citrico.",
        observaciones: "Buena respuesta en vegetativo y estructura ramificada.",
      },
    }),
    prisma.genetica.upsert({
      where: { codigoGenetica: "GEN-002" },
      update: {
        nombre: "Gorilla Glue #4",
        breeder: "GG Strains",
        tipo: "hibrida",
        thcEstimado: 26,
        cbdEstimado: 0.3,
        sativaPorcentaje: 50,
        indicaPorcentaje: 50,
        tiempoFloracionDias: 63,
        estado: "activa",
        sabor: "terroso, pino, chocolate",
        efecto: "relajante, potente, corporal",
        aroma: "diesel, tierra, resina",
        descripcion: "Genetica hibrida muy resinosa y de alta potencia.",
        observaciones: "Requiere control de humedad en floracion por densidad floral.",
      },
      create: {
        codigoGenetica: "GEN-002",
        nombre: "Gorilla Glue #4",
        breeder: "GG Strains",
        tipo: "hibrida",
        thcEstimado: 26,
        cbdEstimado: 0.3,
        sativaPorcentaje: 50,
        indicaPorcentaje: 50,
        tiempoFloracionDias: 63,
        estado: "activa",
        sabor: "terroso, pino, chocolate",
        efecto: "relajante, potente, corporal",
        aroma: "diesel, tierra, resina",
        descripcion: "Genetica hibrida muy resinosa y de alta potencia.",
        observaciones: "Requiere control de humedad en floracion por densidad floral.",
      },
    }),
    prisma.genetica.upsert({
      where: { codigoGenetica: "GEN-003" },
      update: {
        nombre: "Critical",
        breeder: "Royal Queen Seeds",
        tipo: "hibrida indica",
        thcEstimado: 19,
        cbdEstimado: 0.4,
        sativaPorcentaje: 40,
        indicaPorcentaje: 60,
        tiempoFloracionDias: 55,
        estado: "activa",
        sabor: "dulce, especiado, herbal",
        efecto: "relajante, equilibrado, fisico",
        aroma: "dulce, skunk, especias",
        descripcion: "Variedad productiva de floracion rapida y estructura compacta.",
        observaciones: "Apta para ciclos cortos y produccion estable.",
      },
      create: {
        codigoGenetica: "GEN-003",
        nombre: "Critical",
        breeder: "Royal Queen Seeds",
        tipo: "hibrida indica",
        thcEstimado: 19,
        cbdEstimado: 0.4,
        sativaPorcentaje: 40,
        indicaPorcentaje: 60,
        tiempoFloracionDias: 55,
        estado: "activa",
        sabor: "dulce, especiado, herbal",
        efecto: "relajante, equilibrado, fisico",
        aroma: "dulce, skunk, especias",
        descripcion: "Variedad productiva de floracion rapida y estructura compacta.",
        observaciones: "Apta para ciclos cortos y produccion estable.",
      },
    }),
    prisma.genetica.upsert({
      where: { codigoGenetica: "GEN-004" },
      update: {
        nombre: "Gelato",
        breeder: "Cookie Fam Genetics",
        tipo: "hibrida",
        thcEstimado: 24,
        cbdEstimado: 0.2,
        sativaPorcentaje: 45,
        indicaPorcentaje: 55,
        tiempoFloracionDias: 60,
        estado: "activa",
        sabor: "cremoso, dulce, frutos rojos",
        efecto: "euforico, relajante, balanceado",
        aroma: "dulce, vainilla, frutos rojos",
        descripcion: "Hibrida moderna con perfil aromatico dulce y buena produccion de resina.",
        observaciones: "Buena candidata para seleccion de madres por perfil organoleptico.",
      },
      create: {
        codigoGenetica: "GEN-004",
        nombre: "Gelato",
        breeder: "Cookie Fam Genetics",
        tipo: "hibrida",
        thcEstimado: 24,
        cbdEstimado: 0.2,
        sativaPorcentaje: 45,
        indicaPorcentaje: 55,
        tiempoFloracionDias: 60,
        estado: "activa",
        sabor: "cremoso, dulce, frutos rojos",
        efecto: "euforico, relajante, balanceado",
        aroma: "dulce, vainilla, frutos rojos",
        descripcion: "Hibrida moderna con perfil aromatico dulce y buena produccion de resina.",
        observaciones: "Buena candidata para seleccion de madres por perfil organoleptico.",
      },
    }),
  ]);

  const geneticaByCode = new Map(geneticas.map((genetica) => [genetica.codigoGenetica, genetica]));

  const madres = await Promise.all([
    prisma.madre.upsert({
      where: { codigoMadre: "MAD-001" },
      update: {
        nombreMadre: "Lemon Madre A",
        geneticaId: geneticaByCode.get("GEN-001")!.id,
        salaCultivoId: salaVegetativo.id,
        camillaId: camillaVegetativo.id,
        estado: "activa",
        estadoSanitario: "bueno",
        fechaInicio: daysFromNow(-120),
        fechaUltimoCorte: daysFromNow(-15),
        cantidadEsquejesDisponibles: 8,
        origen: "seleccion_propia",
        observaciones: "Madre vigorosa con buena respuesta a podas y esquejes.",
      },
      create: {
        codigoMadre: "MAD-001",
        nombreMadre: "Lemon Madre A",
        geneticaId: geneticaByCode.get("GEN-001")!.id,
        salaCultivoId: salaVegetativo.id,
        camillaId: camillaVegetativo.id,
        estado: "activa",
        estadoSanitario: "bueno",
        fechaInicio: daysFromNow(-120),
        fechaUltimoCorte: daysFromNow(-15),
        cantidadEsquejesDisponibles: 8,
        origen: "seleccion_propia",
        observaciones: "Madre vigorosa con buena respuesta a podas y esquejes.",
      },
    }),
    prisma.madre.upsert({
      where: { codigoMadre: "MAD-002" },
      update: {
        nombreMadre: "Gorilla Madre B",
        geneticaId: geneticaByCode.get("GEN-002")!.id,
        salaCultivoId: salaVegetativo.id,
        camillaId: camillaVegetativo.id,
        estado: "activa",
        estadoSanitario: "preventivo",
        fechaInicio: daysFromNow(-100),
        fechaUltimoCorte: daysFromNow(-10),
        cantidadEsquejesDisponibles: 6,
        origen: "clon seleccionado",
        observaciones: "Madre resinosa, mantener control preventivo por densidad foliar.",
      },
      create: {
        codigoMadre: "MAD-002",
        nombreMadre: "Gorilla Madre B",
        geneticaId: geneticaByCode.get("GEN-002")!.id,
        salaCultivoId: salaVegetativo.id,
        camillaId: camillaVegetativo.id,
        estado: "activa",
        estadoSanitario: "preventivo",
        fechaInicio: daysFromNow(-100),
        fechaUltimoCorte: daysFromNow(-10),
        cantidadEsquejesDisponibles: 6,
        origen: "clon seleccionado",
        observaciones: "Madre resinosa, mantener control preventivo por densidad foliar.",
      },
    }),
    prisma.madre.upsert({
      where: { codigoMadre: "MAD-003" },
      update: {
        nombreMadre: "Critical Madre C",
        geneticaId: geneticaByCode.get("GEN-003")!.id,
        salaCultivoId: salaVegetativo.id,
        camillaId: camillaVegetativo.id,
        estado: "activa",
        estadoSanitario: "bueno",
        fechaInicio: daysFromNow(-90),
        fechaUltimoCorte: daysFromNow(-20),
        cantidadEsquejesDisponibles: 10,
        origen: "semilla feminizada seleccionada",
        observaciones: "Madre estable, buena produccion de esquejes y floracion rapida.",
      },
      create: {
        codigoMadre: "MAD-003",
        nombreMadre: "Critical Madre C",
        geneticaId: geneticaByCode.get("GEN-003")!.id,
        salaCultivoId: salaVegetativo.id,
        camillaId: camillaVegetativo.id,
        estado: "activa",
        estadoSanitario: "bueno",
        fechaInicio: daysFromNow(-90),
        fechaUltimoCorte: daysFromNow(-20),
        cantidadEsquejesDisponibles: 10,
        origen: "semilla feminizada seleccionada",
        observaciones: "Madre estable, buena produccion de esquejes y floracion rapida.",
      },
    }),
  ]);

  const madreByCode = new Map(madres.map((madre) => [madre.codigoMadre, madre]));

  const lote = await prisma.loteCultivo.upsert({
    where: { codigoLote: "LOT-2026-001" },
    update: {
      geneticaId: geneticaByCode.get("GEN-001")!.id,
      salaCultivoId: salaFloracion.id,
      fechaInicio: daysFromNow(-35),
      fechaInicioFloracion: daysFromNow(-10),
      fechaEstimadaCosecha: daysFromNow(50),
      estado: "floracion",
      observaciones: "Lote de prueba para validar flujo de cultivo con plantas provenientes de distintas madres.",
    },
    create: {
      codigoLote: "LOT-2026-001",
      geneticaId: geneticaByCode.get("GEN-001")!.id,
      salaCultivoId: salaFloracion.id,
      fechaInicio: daysFromNow(-35),
      fechaInicioFloracion: daysFromNow(-10),
      fechaEstimadaCosecha: daysFromNow(50),
      estado: "floracion",
      observaciones: "Lote de prueba para validar flujo de cultivo con plantas provenientes de distintas madres.",
    },
  });

  const plantasData = [
    {
      codigoPlanta: "PLT-0001",
      nombrePlanta: "Lemon Haze 01",
      geneticaCode: "GEN-001",
      madreCode: "MAD-001",
      posicionCamilla: 1,
      macetaCodigo: "MAC-001",
      observaciones: "Planta vigorosa, buen desarrollo apical.",
    },
    {
      codigoPlanta: "PLT-0002",
      nombrePlanta: "Lemon Haze 02",
      geneticaCode: "GEN-001",
      madreCode: "MAD-001",
      posicionCamilla: 2,
      macetaCodigo: "MAC-002",
      observaciones: "Buen color foliar y entrenudos parejos.",
    },
    {
      codigoPlanta: "PLT-0003",
      nombrePlanta: "Gorilla Glue 01",
      geneticaCode: "GEN-002",
      madreCode: "MAD-002",
      posicionCamilla: 3,
      macetaCodigo: "MAC-003",
      observaciones: "Estructura compacta, controlar humedad en floracion.",
    },
    {
      codigoPlanta: "PLT-0004",
      nombrePlanta: "Gorilla Glue 02",
      geneticaCode: "GEN-002",
      madreCode: "MAD-002",
      posicionCamilla: 4,
      macetaCodigo: "MAC-004",
      observaciones: "Buen vigor lateral, candidata para seguimiento de produccion.",
    },
    {
      codigoPlanta: "PLT-0005",
      nombrePlanta: "Critical 01",
      geneticaCode: "GEN-003",
      madreCode: "MAD-003",
      posicionCamilla: 5,
      macetaCodigo: "MAC-005",
      observaciones: "Floracion rapida, estructura uniforme.",
    },
    {
      codigoPlanta: "PLT-0006",
      nombrePlanta: "Gelato 01",
      geneticaCode: "GEN-004",
      madreCode: "MAD-003",
      posicionCamilla: 6,
      macetaCodigo: "MAC-006",
      observaciones: "Planta de prueba para evaluar perfil aromatico Gelato dentro del lote.",
    },
  ];

  const plantas = await Promise.all(
    plantasData.map((planta) =>
      prisma.planta.upsert({
        where: { codigoPlanta: planta.codigoPlanta },
        update: {
          nombrePlanta: planta.nombrePlanta,
          loteCultivoId: lote.id,
          geneticaId: geneticaByCode.get(planta.geneticaCode)!.id,
          madreId: madreByCode.get(planta.madreCode)!.id,
          camillaId: camillaFloracion.id,
          posicionCamilla: planta.posicionCamilla,
          origen: "esqueje",
          etapa: "floracion",
          estado: "activa",
          fechaInicio: daysFromNow(-35),
          fechaInicioEtapa: daysFromNow(-10),
          macetaCodigo: planta.macetaCodigo,
          macetaLitros: 10,
          tipoMaceta: "geotextil",
          sustrato: "coco/perlita",
          observaciones: planta.observaciones,
        },
        create: {
          codigoPlanta: planta.codigoPlanta,
          nombrePlanta: planta.nombrePlanta,
          loteCultivoId: lote.id,
          geneticaId: geneticaByCode.get(planta.geneticaCode)!.id,
          madreId: madreByCode.get(planta.madreCode)!.id,
          camillaId: camillaFloracion.id,
          posicionCamilla: planta.posicionCamilla,
          origen: "esqueje",
          etapa: "floracion",
          estado: "activa",
          fechaInicio: daysFromNow(-35),
          fechaInicioEtapa: daysFromNow(-10),
          macetaCodigo: planta.macetaCodigo,
          macetaLitros: 10,
          tipoMaceta: "geotextil",
          sustrato: "coco/perlita",
          observaciones: planta.observaciones,
        },
      }),
    ),
  );

  console.info("Seed de cultivo de prueba aplicado correctamente.");
  console.table([
    { tabla: "salas_cultivo", registros: salas.length },
    { tabla: "camillas", registros: camillas.length },
    { tabla: "geneticas", registros: geneticas.length },
    { tabla: "madres", registros: madres.length },
    { tabla: "lotes_cultivo", registros: 1 },
    { tabla: "plantas", registros: plantas.length },
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
