export type RoomType =
  | "vegetativo"
  | "floracion"
  | "madres"
  | "esquejes"
  | "secado"
  | "curado";

export type RoomStatus =
  | "activa"
  | "limpieza"
  | "mantenimiento"
  | "fuera_de_uso";

export type IrrigationSystem =
  | "manual"
  | "automatico"
  | "mixto";

export type LightingType =
  | "led"
  | "hps"
  | "cmh"
  | "mixta"
  | "otra";

export type SensorType =
  | "temperatura"
  | "humedad"
  | "co2"
  | "vpd"
  | "temperatura_hoja"
  | "ph"
  | "ec"
  | "otro";

export type BedStatus =
  | "vacia"
  | "activa"
  | "limpieza"
  | "mantenimiento"
  | "fuera_de_uso";

export type PlantOrigin =
  | "semilla"
  | "esqueje"
  | "madre_interna"
  | "compra_externa"
  | "otro";

export type PlantStage =
  | "esqueje"
  | "vegetativo"
  | "floracion"
  | "cosecha"
  | "secado"
  | "curado"
  | "liberado"
  | "descartado";

export type PlantStatus =
  | "normal"
  | "observacion"
  | "alerta"
  | "descartada"
  | "cosechada";

export interface GrowRoomTechnicalConfig {
  lightingType: LightingType;
  installedPowerWatts: number;
  ventilationSystem?: string;
  extractionSystem?: string;
  irrigationSystem: IrrigationSystem;
  hasAirConditioning: boolean;
  hasDehumidifier: boolean;
  installedSensors: SensorType[];
  targetLiquidPHMin?: number;
  targetLiquidPHMax?: number;
  targetSubstratePHMin?: number;
  targetSubstratePHMax?: number;
  targetLiquidPPMMin?: number;
  targetLiquidPPMMax?: number;
  targetSubstratePPMMin?: number;
  targetSubstratePPMMax?: number;
  notes?: string;
}

export interface GrowRoom {
  id: string;
  name: string;
  code: string;
  type: RoomType;
  status: RoomStatus;
  capacity?: number;
  responsibleUserId?: string;
  technicalConfig: GrowRoomTechnicalConfig;
  notes?: string;
}

export interface GrowBed {
  id: string;
  name: string;
  code: string;
  roomId: string;
  status: BedStatus;
  maxPlants: number;
  currentPlants: number;
  mainBatchId?: string;
  responsibleUserId?: string;
  notes?: string;
}

export interface Genetics {
  id: string;
  name: string;
  breeder?: string;
  type: "regular" | "feminizada" | "automatica" | "esqueje" | "desconocida";
  dominantProfile: "indica" | "sativa" | "hibrida" | "desconocida";
  thcPercent?: number;
  sativaPercent?: number;
  indicaPercent?: number;
  taste?: string;
  effect?: string;
  aroma?: string;
  notes?: string;
}

export interface MotherPlant {
  id: string;
  code: string;
  name?: string;
  geneticsId: string;
  geneticsName: string;
  roomId?: string;
  bedId?: string;
  status: "activa" | "observacion" | "descartada" | "archivada";
  sanitaryStatus?: "bueno" | "preventivo" | "observacion" | "critico";
  startDate: string;
  lastCutDate?: string;
  availableClones?: number;
  origin?: string;
  notes?: string;
}

export interface Plant {
  id: string;
  internalCode: string;
  plantName?: string;
  roomId: string;
  bedId: string;
  bedPosition: number;
  batchId?: string;
  cycleId?: string;
  geneticsId?: string;
  geneticsName?: string;
  motherPlantId?: string;
  motherPlantCode?: string;
  origin: PlantOrigin;
  stage: PlantStage;
  status: PlantStatus;
  startDate: string;
  stageStartDate?: string;
  potCode?: string;
  potSizeLiters?: number;
  potType?: string;
  substrate?: string;
  notes?: string;
}

export interface EnvironmentalLog {
  id: string;
  roomId: string;
  bedId?: string;
  batchId?: string;
  date: string;
  time: string;
  airTempC: number;
  relativeHumidity: number;
  leafTempC?: number;
  co2ppm?: number;
  calculatedVPD?: number;
  vpdStatus?: "bajo" | "optimo" | "alto" | "critico";
  recordedByUserId: string;
  notes?: string;
}

export type MeasurementType =
  | "substrate"
  | "liquid_input"
  | "runoff"
  | "mixed"
  | "corrective"
  | "routine_check";

export type MeasurementRelatedModule =
  | "room"
  | "bed"
  | "plant"
  | "mother"
  | "irrigation"
  | "environmental"
  | "general";

export type MeasurementStatus = "normal" | "observation" | "alert" | "critical";

export type MeasurementMethod = "manual_meter" | "drops" | "lab" | "sensor" | "estimated" | "other";

export interface CultivationMeasurement {
  id: string;
  measurementType: MeasurementType;
  date: string;
  time: string;
  roomId?: string;
  bedId?: string;
  plantId?: string;
  motherPlantId?: string;
  batchId?: string;
  relatedModule: MeasurementRelatedModule;
  substratePH?: number;
  substratePPM?: number;
  substrateEC?: number;
  liquidPH?: number;
  liquidPPM?: number;
  liquidEC?: number;
  runoffPH?: number;
  runoffPPM?: number;
  runoffEC?: number;
  waterTempC?: number;
  substrateTempC?: number;
  measurementMethod?: MeasurementMethod;
  responsibleName?: string;
  status: MeasurementStatus;
  notes?: string;
}

export interface MeasurementSummary {
  latestMeasurements: CultivationMeasurement[];
  outOfRangeMeasurements: CultivationMeasurement[];
  averageLiquidPH: number | null;
  averageSubstratePH: number | null;
  averageLiquidPPM: number | null;
  averageSubstratePPM: number | null;
  alertsCount: number;
  criticalCount: number;
}
