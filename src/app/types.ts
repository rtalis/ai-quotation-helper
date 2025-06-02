export interface SupplierItem {
    description: string;
    price: number;
    quantity?: number;
    manufacturer?: string;
    matchConfidence?: string;
  }
  
  export interface SupplierQuotation {
    supplier: string;
    items: SupplierItem[];
  }
  
  export interface ReferenceData {
    items: {
      description: string;
      referencePrice: number;
      quantity: number;
      unit: string;
      manufacturer?: string;
      code?: string;
    }[];
    totalValue?: number;
  }
  
  export interface ComparisonResult {
    items: Array<{
      code?: string;
      description: string;
      quantity: number;
      unit: string;
      bestPrice: number;
      pricePerUnit: number;
      supplier: string;
      manufacturer: string;
      matchConfidence: string;
      originalPrice: number;
      savings: number;
      allQuotes: Array<{
        supplier: string;
        price: number;
        totalPrice: number;
        description: string;
        manufacturer: string;
        matchConfidence: string;
      }>;
    }>;
    allQuotes: any[];
    supplierTotals: Record<string, number>;
    totalOriginal: number;
    totalBest: number;
    totalSavings: number;
  }