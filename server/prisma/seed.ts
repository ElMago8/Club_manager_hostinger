import { PrismaClient } from "@prisma/client";
import { calculateVPD, getVPDStatus } from "../src/utils/vpdCalculator.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.cultivationMeasurement.deleteMany();
  await prisma.irrigationLog.deleteMany();
  await prisma.operationalTask.deleteMany();
  await prisma.environmentalLog.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.motherPlant.deleteMany();
  await prisma.genetics.deleteMany();
  await prisma.growBed.deleteMany();

  const bedA = await prisma.growBed.create({
    data: {
      name: "Camilla A",
      code: "BED-MOCK-A",
      roomId: "room-floracion-1",
      status: "active",
      maxPlants: 20,
      notes: "Camilla ficticia para desarrollo local.",
    },
  });

  const bedB = await prisma.growBed.create({
    data: {
      name: "Camilla B",
      code: "BED-MOCK-B",
      roomId: "room-vegetativo-1",
      status: "active",
      maxPlants: 15,
      notes: "Camilla ficticia para desarrollo local.",
    },
  });

  const geneticsA = await prisma.genetics.create({
    data: {
      name: "Genetica Mock A",
      breeder: "Banco ficticio",
      type: "feminized",
      dominantProfile: "hybrid",
      notes: "Dato ficticio para seed local.",
    },
  });

  const geneticsB = await prisma.genetics.create({
    data: {
      name: "Genetica Mock B",
      breeder: "Banco ficticio",
      type: "clone",
      dominantProfile: "indica",
      notes: "Dato ficticio para seed local.",
    },
  });

  const motherA = await prisma.motherPlant.create({
    data: {
      code: "MOTHER-MOCK-A",
      geneticsId: geneticsA.id,
      roomId: "room-vegetativo-1",
      status: "active",
      startDate: new Date("2026-01-10"),
      notes: "Madre ficticia para desarrollo local.",
    },
  });

  const motherB = await prisma.motherPlant.create({
    data: {
      code: "MOTHER-MOCK-B",
      geneticsId: geneticsB.id,
      roomId: "room-vegetativo-1",
      status: "observation",
      startDate: new Date("2026-02-15"),
      notes: "Madre ficticia para desarrollo local.",
    },
  });

  const plantA = await prisma.plant.create({
    data: {
      internalCode: "PLANT-MOCK-A-001",
      bedId: bedA.id,
      bedPosition: 1,
      batchId: "BATCH-MOCK-001",
      geneticsId: geneticsA.id,
      motherPlantId: motherA.id,
      origin: "internal_mother",
      stage: "flowering",
      status: "normal",
      startDate: new Date("2026-04-20"),
      stageStartDate: new Date("2026-05-05"),
      potCode: "BED-MOCK-A-POT-001",
      potSizeLiters: 10,
      potType: "geotextil",
      substrate: "coco",
    },
  });

  const plantB = await prisma.plant.create({
    data: {
      internalCode: "PLANT-MOCK-A-002",
      bedId: bedA.id,
      bedPosition: 2,
      batchId: "BATCH-MOCK-001",
      geneticsId: geneticsA.id,
      motherPlantId: motherA.id,
      origin: "clone",
      stage: "flowering",
      status: "observation",
      startDate: new Date("2026-04-21"),
      stageStartDate: new Date("2026-05-05"),
      potCode: "BED-MOCK-A-POT-002",
      potSizeLiters: 10,
      potType: "geotextil",
      substrate: "coco",
      notes: "Observacion ficticia.",
    },
  });

  await prisma.plant.create({
    data: {
      internalCode: "PLANT-MOCK-B-001",
      bedId: bedB.id,
      bedPosition: 1,
      batchId: "BATCH-MOCK-002",
      geneticsId: geneticsB.id,
      motherPlantId: motherB.id,
      origin: "clone",
      stage: "vegetative",
      status: "normal",
      startDate: new Date("2026-05-10"),
      stageStartDate: new Date("2026-05-18"),
      potCode: "BED-MOCK-B-POT-001",
      potSizeLiters: 7,
      potType: "plastica",
      substrate: "sustrato ficticio",
    },
  });

  for (const log of [
    { bedId: bedA.id, date: new Date("2026-05-26"), time: "09:00", airTempC: 25.8, relativeHumidity: 58, leafTempC: 24.6, co2ppm: 720, stage: "flowering" },
    { bedId: bedB.id, date: new Date("2026-05-26"), time: "10:30", airTempC: 24.1, relativeHumidity: 66, leafTempC: undefined, co2ppm: 610, stage: "vegetative" },
  ]) {
    const calculatedVPD = calculateVPD(log);
    await prisma.environmentalLog.create({
      data: {
        bedId: log.bedId,
        batchId: "BATCH-MOCK",
        date: log.date,
        time: log.time,
        airTempC: log.airTempC,
        relativeHumidity: log.relativeHumidity,
        leafTempC: log.leafTempC,
        co2ppm: log.co2ppm,
        calculatedVPD,
        vpdStatus: getVPDStatus(calculatedVPD, log.stage),
        notes: "Registro ambiental ficticio.",
      },
    });
  }

  await prisma.irrigationLog.createMany({
    data: [
      {
        bedId: bedA.id,
        plantId: plantA.id,
        batchId: "BATCH-MOCK-001",
        date: new Date("2026-05-26"),
        time: "11:00",
        irrigationType: "manual",
        litersPrepared: 20,
        litersApplied: 18,
        phIn: 6.2,
        ppmIn: 950,
        ecIn: 1.5,
        phRunoff: 6.4,
        ppmRunoff: 1100,
        ecRunoff: 1.8,
        substratePH: 6.4,
        substratePPM: 1100,
        substrateEC: 1.7,
        runoffPercentage: 12,
        recipeName: "Receta ficticia A",
        nutrientsNotes: "Notas ficticias.",
        responsibleName: "Operador mock",
      },
      {
        bedId: bedA.id,
        plantId: plantB.id,
        batchId: "BATCH-MOCK-001",
        date: new Date("2026-05-27"),
        time: "11:20",
        irrigationType: "water_only",
        litersPrepared: 15,
        litersApplied: 14,
        phIn: 6.1,
        ppmIn: 520,
        ecIn: 0.2,
        responsibleName: "Operador mock",
      },
    ],
  });

  await prisma.cultivationMeasurement.createMany({
    data: [
      {
        measurementType: "mixed",
        date: new Date("2026-05-26"),
        time: "12:00",
        roomId: "room-floracion-1",
        bedId: bedA.id,
        plantId: plantA.id,
        batchId: "BATCH-MOCK-001",
        relatedModule: "bed",
        liquidPH: 6.1,
        liquidPPM: 950,
        liquidEC: 1.5,
        substratePH: 6.4,
        substratePPM: 1100,
        substrateEC: 1.7,
        measurementMethod: "manual_meter",
        responsibleName: "Operador mock",
        status: "normal",
        notes: "Medicion ficticia normal para Camilla A.",
      },
      {
        measurementType: "substrate",
        date: new Date("2026-05-26"),
        time: "12:30",
        roomId: "room-vegetativo-1",
        motherPlantId: motherA.id,
        relatedModule: "mother",
        substratePH: 6.5,
        substratePPM: 1200,
        substrateEC: 1.8,
        measurementMethod: "manual_meter",
        responsibleName: "Tecnico mock",
        status: "normal",
        notes: "Madre Mock A con parametros normales.",
      },
      {
        measurementType: "liquid_input",
        date: new Date("2026-05-27"),
        time: "10:00",
        roomId: "room-vegetativo-1",
        bedId: bedB.id,
        batchId: "BATCH-MOCK-002",
        relatedModule: "bed",
        liquidPH: 5.35,
        liquidPPM: 1450,
        liquidEC: 2.0,
        measurementMethod: "manual_meter",
        responsibleName: "Operador mock",
        status: "observation",
        notes: "Medicion ficticia en observacion.",
      },
      {
        measurementType: "substrate",
        date: new Date("2026-05-27"),
        time: "16:00",
        roomId: "room-floracion-1",
        bedId: bedA.id,
        plantId: plantB.id,
        batchId: "BATCH-MOCK-001",
        relatedModule: "plant",
        substratePH: 7.15,
        substratePPM: 1700,
        substrateEC: 2.2,
        measurementMethod: "sensor",
        responsibleName: "Tecnico mock",
        status: "observation",
        notes: "Medicion ficticia de seguimiento.",
      },
      {
        measurementType: "mixed",
        date: new Date("2026-05-28"),
        time: "11:10",
        roomId: "room-vegetativo-1",
        bedId: bedB.id,
        batchId: "BATCH-MOCK-002",
        relatedModule: "bed",
        liquidPH: 7.3,
        liquidPPM: 1800,
        substratePH: 7.5,
        substratePPM: 2100,
        measurementMethod: "manual_meter",
        responsibleName: "Operador mock",
        status: "alert",
        notes: "Camilla B en alerta ficticia.",
      },
      {
        measurementType: "runoff",
        date: new Date("2026-05-28"),
        time: "18:30",
        roomId: "room-floracion-1",
        bedId: bedA.id,
        plantId: plantA.id,
        batchId: "BATCH-MOCK-001",
        relatedModule: "irrigation",
        runoffPH: 4.6,
        runoffPPM: 2700,
        runoffEC: 3.4,
        measurementMethod: "manual_meter",
        responsibleName: "Tecnico mock",
        status: "critical",
        notes: "Medicion critica ficticia para validar alertas.",
      },
    ],
  });

  await prisma.operationalTask.createMany({
    data: [
      { title: "Revisar sala Floracion 1", description: "Control operativo ficticio de sala.", taskType: "environmental_check", priority: "high", status: "pending", dueDate: new Date("2026-05-29"), dueTime: "14:00", assignedToName: "Operador demo", roomId: "room-floracion-1", relatedModule: "cultivation" },
      { title: "Medir parametros de drenaje", description: "Registro ficticio de drenaje.", taskType: "drainage_check", priority: "medium", status: "in_progress", dueDate: new Date("2026-05-29"), dueTime: "17:30", assignedToName: "Operador demo", bedId: bedA.id, relatedModule: "bed" },
      { title: "Inspeccion sanitaria", description: "Revision sanitaria ficticia.", taskType: "sanitary_inspection", priority: "critical", status: "pending", dueDate: new Date("2026-05-30"), dueTime: "09:00", assignedToName: "Tecnico demo", roomId: "room-floracion-1", relatedModule: "cultivation" },
      { title: "Preparar cosecha", description: "Preparacion ficticia de cosecha.", taskType: "harvest_preparation", priority: "medium", status: "pending", dueDate: new Date("2026-06-01"), dueTime: "08:00", assignedToName: "Equipo cultivo", batchId: "BATCH-MOCK-001", relatedModule: "cultivation" },
      { title: "Registrar riego en Camilla B", description: "Carga operativa ficticia.", taskType: "irrigation", priority: "medium", status: "pending", dueDate: new Date("2026-05-29"), dueTime: "11:00", assignedToName: "Operador demo", bedId: bedB.id, relatedModule: "irrigation" },
      { title: "Control de VPD en Vegetativo", description: "Control ambiental ficticio.", taskType: "environmental_check", priority: "high", status: "pending", dueDate: new Date("2026-05-29"), dueTime: "12:00", assignedToName: "Tecnico demo", roomId: "room-vegetativo-1", relatedModule: "environmental" },
      { title: "Revisar planta en observacion", description: "Revision ficticia de planta observada.", taskType: "sanitary_inspection", priority: "high", status: "pending", dueDate: new Date("2026-05-29"), dueTime: "15:00", assignedToName: "Tecnico demo", plantId: plantB.id, relatedModule: "plant" },
      { title: "Limpieza de sala", description: "Limpieza operativa ficticia.", taskType: "cleaning", priority: "low", status: "pending", dueDate: new Date("2026-06-02"), dueTime: "10:00", assignedToName: "Equipo cultivo", roomId: "room-floracion-1", relatedModule: "general" },
      { title: "Control de madres", description: "Revision ficticia de madres.", taskType: "sanitary_inspection", priority: "medium", status: "pending", dueDate: new Date("2026-06-03"), dueTime: "09:30", assignedToName: "Tecnico demo", roomId: "room-vegetativo-1", relatedModule: "cultivation" },
      { title: "Revision de stock de insumos", description: "Control ficticio de insumos.", taskType: "inventory_check", priority: "medium", status: "pending", dueDate: new Date("2026-06-04"), dueTime: "16:00", assignedToName: "Operador demo", relatedModule: "stock" },
    ],
  });
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
