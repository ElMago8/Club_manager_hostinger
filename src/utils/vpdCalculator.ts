export function saturationVaporPressure(tempC: number): number {
  return 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

export function calculateVPD({
  airTempC,
  relativeHumidity,
  leafTempC,
  defaultLeafOffset = -2.8,
}: {
  airTempC: number;
  relativeHumidity: number;
  leafTempC?: number;
  defaultLeafOffset?: number;
}): number {
  const actualLeafTemp = leafTempC ?? airTempC + defaultLeafOffset;
  const svpLeaf = saturationVaporPressure(actualLeafTemp);
  const svpAir = saturationVaporPressure(airTempC);
  const actualVaporPressure = svpAir * (relativeHumidity / 100);
  return Number((svpLeaf - actualVaporPressure).toFixed(2));
}

export function getVPDStatus(
  vpd: number,
  stage?: string,
): "bajo" | "optimo" | "alto" | "critico" {
  if (stage === "esqueje" || stage === "vegetativo") {
    if (vpd < 0.6) return "critico";
    if (vpd < 0.8) return "bajo";
    if (vpd <= 1.1) return "optimo";
    if (vpd <= 1.4) return "alto";
    return "critico";
  }

  if (stage === "floracion") {
    if (vpd < 0.8) return "critico";
    if (vpd < 1.0) return "bajo";
    if (vpd <= 1.6) return "optimo";
    if (vpd <= 1.9) return "alto";
    return "critico";
  }

  if (vpd < 0.6) return "critico";
  if (vpd < 0.8) return "bajo";
  if (vpd <= 1.4) return "optimo";
  if (vpd <= 1.8) return "alto";
  return "critico";
}

export function generateVPDTable({
  temperatures = [20, 22, 24, 26, 28, 30],
  humidities = [40, 45, 50, 55, 60, 65, 70, 75, 80],
  leafOffset = 0,
}: {
  temperatures?: number[];
  humidities?: number[];
  leafOffset?: number;
}) {
  return temperatures.map((temperature) => ({
    temperature,
    values: humidities.map((humidity) => ({
      humidity,
      vpd: calculateVPD({
        airTempC: temperature,
        relativeHumidity: humidity,
        leafTempC: temperature + leafOffset,
      }),
    })),
  }));
}
