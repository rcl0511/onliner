// src/types/Medicine.ts
export interface Medicine {
  id: number;
  no: number;
  code: string;
  supplier: string;
  manufacturer: string;
  name: string;
  spec: string;
  basePrice: number;
  location: string;
  prevStock: number;
  prevAmount: number;
  inQty: number;
  inAmount: number;
  outQty: number;
  outAmount: number;
  stockQty: number;
  purchasedQty: number;
  unitPrice: number;
  basePricePercent: number;
  stockAmount: number;
  basePriceCode: string;
  remarks: string;
  standardCode: string;
  productLocation: string;
}
