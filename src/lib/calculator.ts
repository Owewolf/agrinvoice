import { Settings, CalculationResult } from '@/types';

export function calculateCost(
  hectares: number,
  speed: number,
  flowRate: number,
  sprayWidth: number,
  settings: Settings
): CalculationResult {
  // Calculate application rate (L/ha) - matching Python formula exactly
  if (speed <= 0 || sprayWidth <= 0) {
    return {
      appRate: 0,
      costPerHa: 0,
      discountAmount: 0,
      totalCharge: 0
    };
  }
  
  const areaPerMin = speed * sprayWidth * 60;
  const appRate = Math.round(((flowRate / areaPerMin) * 10000) * 100) / 100;
  
  // Interpolate cost per hectare based on application rate
  let costPerHa: number;
  
  if (appRate <= settings.point1Lpha) {
    costPerHa = settings.point1Rate;
  } else if (appRate <= settings.point2Lpha) {
    // Linear interpolation between point1 and point2
    const slope = (settings.point2Rate - settings.point1Rate) / (settings.point2Lpha - settings.point1Lpha);
    costPerHa = settings.point1Rate + (appRate - settings.point1Lpha) * slope;
  } else if (appRate <= settings.point3Lpha) {
    // Linear interpolation between point2 and point3
    const slope = (settings.point3Rate - settings.point2Rate) / (settings.point3Lpha - settings.point2Lpha);
    costPerHa = settings.point2Rate + (appRate - settings.point2Lpha) * slope;
  } else {
    // Extrapolate beyond point3 using the last known slope
    const slope = (settings.point3Rate - settings.point2Rate) / (settings.point3Lpha - settings.point2Lpha);
    costPerHa = settings.point3Rate + (appRate - settings.point3Lpha) * slope;
  }
  
  // Tiered Hectare Discount Logic (matching Python exactly)
  let totalCharge = 0;
  let discountAmount = 0;
  const totalBeforeDiscount = hectares * costPerHa;
  
  if (hectares <= settings.discountThreshold) {
    totalCharge = totalBeforeDiscount;
  } else {
    // Only the portion above the threshold gets discounted
    const costOfDiscountedPortion = (hectares - settings.discountThreshold) * costPerHa;
    discountAmount = costOfDiscountedPortion * settings.discountRate;
    totalCharge = totalBeforeDiscount - discountAmount;
  }
  
  return {
    appRate: parseFloat(appRate.toFixed(2)),
    costPerHa: parseFloat(costPerHa.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    totalCharge: parseFloat(totalCharge.toFixed(2))
  };
}