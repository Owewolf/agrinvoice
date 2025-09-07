import { ProductCategory, PricingType } from '@/types';
import { Product, ProductTier } from '@/types/api';

export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string; description: string }[] = [
  { value: 'spraying', label: 'Spraying', description: 'Drone spraying services with tiered pricing' },
  { value: 'granular', label: 'Granular', description: 'Granular application with tiered pricing' },
  { value: 'travelling', label: 'Travelling', description: 'Travel charges per kilometer' },
  { value: 'imaging', label: 'Imaging', description: 'Aerial imaging services' },
  { value: 'accommodation', label: 'Accommodation', description: 'Accommodation services' }
];

export const PRICING_TYPES: { value: PricingType; label: string; description: string }[] = [
  { value: 'tiered', label: 'Tiered Pricing', description: 'Sliding scale based on quantity thresholds' },
  { value: 'flat', label: 'Flat Rate', description: 'Fixed rate per unit' },
  { value: 'per_km', label: 'Per Kilometer', description: 'Fixed rate per kilometer' }
];

export function generateSKU(category: ProductCategory, baseRate?: number): string {
  const categoryMap: Record<ProductCategory, string> = {
    spraying: 'SP',
    granular: 'GR',
    travelling: 'TR',
    imaging: 'IM',
    accommodation: 'AC'
  };
  
  const prefix = categoryMap[category] || 'PR';
  const rate = baseRate ? `_${baseRate}` : '';
  return `${prefix}${rate}`;
}

export function getUnitForCategory(category: ProductCategory, pricingType: PricingType): string {
  if (pricingType === 'per_km') return 'km';
  
  switch (category) {
    case 'spraying':
      return 'L/ha';
    case 'granular':
      return 'kg/ha';
    case 'travelling':
      return 'km';
    case 'imaging':
      return 'ha';
    case 'accommodation':
      return 'service';
    default:
      return 'unit';
  }
}

export function createDefaultProduct(category: ProductCategory): Partial<Product> {
  const unit = getUnitForCategory(category, category === 'travelling' ? 'per_km' : 'tiered');
  
  return {
    category,
    pricingType: category === 'travelling' ? 'per_km' : category === 'imaging' || category === 'accommodation' ? 'flat' : 'tiered',
    tiers: category === 'spraying' || category === 'granular' ? [
      { productId: '', threshold: 40, rate: 200 },
      { productId: '', threshold: 80, rate: 300 },
      { productId: '', threshold: 160, rate: 400 }
    ] : undefined,
    baseRate: category === 'imaging' ? 50 : category === 'travelling' ? 15 : category === 'accommodation' ? 500 : undefined,
    unit
  };
}

export function calculateProductCost(
  product: Product,
  quantity: number,
  additionalParams?: {
    speed?: number;
    flowRate?: number;
    sprayWidth?: number;
  }
): {
  appliedRate: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  appRate?: number;
} {
  console.log('🔢 Calculating cost for:', product.name, 'quantity:', quantity, 'params:', additionalParams);
  
  let appliedRate = 0;
  let appRate: number | undefined;

  switch (product.pricingType) {
    case 'flat':
      appliedRate = product.baseRate || 0;
      console.log('Flat rate applied:', appliedRate);
      break;
      
    case 'per_km':
      appliedRate = product.baseRate || 0;
      console.log('Per km rate applied:', appliedRate);
      break;
      
    case 'tiered':
      if (product.category === 'spraying' || product.category === 'granular') {
        if (additionalParams?.speed && additionalParams?.flowRate && additionalParams?.sprayWidth) {
          const areaPerMin = additionalParams.speed * additionalParams.sprayWidth * 60;
          appRate = Math.round(((additionalParams.flowRate / areaPerMin) * 10000) * 100) / 100;
          console.log('Application rate calculated:', appRate);
          
          if (product.tiers && product.tiers.length > 0) {
            const sortedTiers = [...product.tiers].sort((a, b) => a.threshold - b.threshold);
            console.log('Available tiers:', sortedTiers);
            
            if (appRate <= sortedTiers[0].threshold) {
              appliedRate = sortedTiers[0].rate;
              console.log('Using first tier rate:', appliedRate);
            } else {
              let found = false;
              for (let i = 0; i < sortedTiers.length - 1; i++) {
                const currentTier = sortedTiers[i];
                const nextTier = sortedTiers[i + 1];
                
                if (appRate <= nextTier.threshold) {
                  const slope = (nextTier.rate - currentTier.rate) / (nextTier.threshold - currentTier.threshold);
                  appliedRate = currentTier.rate + (appRate - currentTier.threshold) * slope;
                  console.log('Interpolated rate:', appliedRate);
                  found = true;
                  break;
                }
              }
              
              if (!found) {
                const lastTier = sortedTiers[sortedTiers.length - 1];
                const secondLastTier = sortedTiers[sortedTiers.length - 2];
                const slope = (lastTier.rate - secondLastTier.rate) / (lastTier.threshold - secondLastTier.threshold);
                appliedRate = lastTier.rate + (appRate - lastTier.threshold) * slope;
                console.log('Extrapolated rate:', appliedRate);
              }
            }
          }
        } else {
          console.log('Missing parameters for tiered calculation');
        }
      } else {
        if (product.tiers && product.tiers.length > 0) {
          const sortedTiers = [...product.tiers].sort((a, b) => a.threshold - b.threshold);
          
          if (quantity <= sortedTiers[0].threshold) {
            appliedRate = sortedTiers[0].rate;
          } else {
            let found = false;
            for (let i = 0; i < sortedTiers.length - 1; i++) {
              const currentTier = sortedTiers[i];
              const nextTier = sortedTiers[i + 1];
              
              if (quantity <= nextTier.threshold) {
                const slope = (nextTier.rate - currentTier.rate) / (nextTier.threshold - currentTier.threshold);
                appliedRate = currentTier.rate + (quantity - currentTier.threshold) * slope;
                found = true;
                break;
              }
            }
            
            if (!found) {
              const lastTier = sortedTiers[sortedTiers.length - 1];
              const secondLastTier = sortedTiers[sortedTiers.length - 2];
              const slope = (lastTier.rate - secondLastTier.rate) / (lastTier.threshold - secondLastTier.threshold);
              appliedRate = lastTier.rate + (quantity - lastTier.threshold) * slope;
            }
          }
        }
      }
      break;
  }

  const subtotal = quantity * appliedRate;
  
  let discountAmount = 0;
  if (product.discountThreshold && quantity > product.discountThreshold) {
    const discountableQuantity = quantity - product.discountThreshold;
    discountAmount = discountableQuantity * appliedRate * (product.discountRate || 0);
  }
  
  const total = subtotal - discountAmount;

  // Ensure appliedRate is a number
  const numericAppliedRate = typeof appliedRate === 'number' ? appliedRate : parseFloat(appliedRate);
  
  const result = {
    appliedRate: parseFloat(numericAppliedRate.toFixed(2)),
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    appRate
  };
  
  console.log('📊 Final calculation result:', result);
  return result;
}
