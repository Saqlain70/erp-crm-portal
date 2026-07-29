export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: CustomerType;
  address?: string | null;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  followUps?: FollowUp[];
  challans?: SalesChallan[];
}

export interface FollowUp {
  id: string;
  note: string;
  followUpDate?: string | null;
  createdAt: string;
  createdBy?: { name: string };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
  unitPrice: string;
  currentStock: number;
  minStockAlertQty: number;
  location?: string | null;
  imageUrl?: string | null;
  stockMovements?: StockMovement[];
}

export interface StockMovement {
  id: string;
  quantity: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  createdAt: string;
  createdBy?: { name: string };
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id: string;
  productId: string;
  productNameSnap: string;
  productSkuSnap: string;
  unitPriceSnap: string;
  quantity: number;
  lineTotal: string;
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: Customer | { name: string; mobile: string };
  totalQuantity: number;
  status: ChallanStatus;
  createdAt: string;
  items: ChallanItem[];
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}
