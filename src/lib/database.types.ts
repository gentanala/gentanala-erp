// Database Types for Gentanala Mini ERP
// Generated from schema design

export type UserRole = 'super_admin' | 'workshop_admin';
export type ProductType = 'watch' | 'card_holder' | 'phone_case' | 'accessory';
export type OrderSource = 'whatsapp' | 'shopee' | 'tokopedia' | 'custom';
export type OrderStatus = 'pending' | 'production' | 'qc' | 'packing' | 'sent' | 'cancelled';
export type OrderType = 'stock' | 'custom';
export type ProductionStatus = 'planned' | 'in_progress' | 'qc' | 'done' | 'stocked' | 'cancelled';
export type MovementType = 'in' | 'out' | 'adjust' | 'sale' | 'prod_result';
export type PriorityLevel = 'normal' | 'urgent';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  type: ProductType;
  collection: string | null;
  variant: string | null;
  sale_price: number;
  cost_price: number; // HPP - hidden for workshop_admin
  current_stock: number;
  min_stock_threshold: number;
  image_urls: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: string;
  cost_per_unit: number;
  current_stock: number;
  min_stock_threshold: number;
  supplier_info: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  notes: string | null;
  order_count: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_snapshot: CustomerSnapshot | null;
  source: OrderSource;
  type: OrderType;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total_amount: number;
  shipping_address: string | null;
  shipping_method: string | null;
  tracking_number: string | null;
  order_date: string;
  shipped_date: string | null;
  internal_notes: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CustomerSnapshot {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_snapshot: ProductSnapshot;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  line_total: number;
  customization_details: Record<string, unknown> | null;
  created_at: string;
}

export interface ProductSnapshot {
  sku: string;
  name: string;
  image_url?: string;
}

export interface ProductionRun {
  id: string;
  spk_number: string;
  product_id: string | null;
  quantity_planned: number;
  quantity_completed: number;
  quantity_rejected: number;
  status: ProductionStatus;
  priority: PriorityLevel;
  order_id: string | null;
  assigned_to: string | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  production_notes: string | null;
  qc_notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface InventoryMovement {
  id: string;
  product_id: string | null;
  material_id: string | null;
  type: MovementType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  unit_cost: number | null;
  total_cost: number | null;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  type: 'invoice' | 'quotation';
  order_id: string | null;
  customer_snapshot: CustomerSnapshot;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  issued_date: string;
  due_date: string | null;
  paid_date: string | null;
  pdf_url: string | null;
  notes: string | null;
  terms: string | null;
  created_at: string;
  created_by: string | null;
}

export interface InvoiceItem {
  sku: string;
  name: string;
  qty: number;
  price: number;
  total: number;
}

export interface StockAdjustment {
  id: string;
  adjustment_number: string;
  product_id: string | null;
  stock_system: number;
  stock_physical: number;
  difference: number;
  reason: string;
  notes: string | null;
  movement_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  created_by: string | null;
}

// ============================================
// VISUAL MES (Manufacturing Execution System)
// ============================================

export type StageLogicType = 'passthrough' | 'split' | 'merge' | 'exit';
export type SalesChannel = 'shopee' | 'tokopedia' | 'whatsapp' | 'offline' | 'b2b' | 'kol_gift';
export type KanbanItemStatus = 'active' | 'consumed' | 'sold' | 'rejected';

export const SALES_CHANNEL_LABELS: Record<SalesChannel, string> = {
  shopee: 'Shopee',
  tokopedia: 'Tokopedia',
  whatsapp: 'WhatsApp',
  offline: 'Offline / Toko',
  b2b: 'B2B',
  kol_gift: 'KOL / Gift',
};

export type MaterialCategoryFilter = 'raw' | 'wip' | 'finished';

export interface WorkflowStage {
  id: string;
  name: string;
  order: number;
  logicType: StageLogicType;
  defaultYield?: number;                      // for split stages
  mergeInputCount?: number;                   // for merge stages (min components)
  allowedMaterialCategories?: MaterialCategoryFilter[];  // which master-data categories can be added here
  exitChannels?: SalesChannel[];              // for exit stages — which channels are enabled
  emoji?: string;                             // visual indicator
  color: { bg: string; border: string; text: string; dot: string };
}

export interface WorkflowBlueprint {
  id: string;
  name: string;
  productType: string;
  description?: string;
  stages: WorkflowStage[];
  created_at: string;
}

export interface KanbanItem {
  id: string;
  name: string;
  emoji?: string;
  sku: string | null;
  stageId: string;
  quantity: number;
  price: number;
  collection: string | null;
  thumbnailUrl: string | null;
  parentId: string | null;     // ID of parent if created by split
  childIds: string[];          // IDs of children if split
  mergedFrom: string[];        // IDs of source items if merged
  status: KanbanItemStatus;
  salesChannel: SalesChannel | null;
  created_at: string;
  updated_at: string;
  metadata?: {
    targetBomSku?: string; // Indicates this item is an active assembly targeting a FG SKU
    bomProgress?: Record<string, number>; // How many of each component SKU have been added
    [key: string]: any;
  };
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: 'moved' | 'split' | 'merged' | 'sold' | 'added' | 'rejected';
  item_name: string;
  from_stage: string | null;
  to_stage: string;
  logicType: StageLogicType;
  metadata?: {
    consumed?: number;
    yield?: number;
    childCount?: number;
    mergedItems?: string[];
    salesChannel?: SalesChannel;
    salePrice?: number;
    rejectedQty?: number;
  };
}

export const STAGE_LOGIC_CONFIG: Record<StageLogicType, { label: string; emoji: string; color: string }> = {
  passthrough: { label: 'Passthrough', emoji: '➡️', color: 'text-blue-600' },
  split: { label: 'Split', emoji: '✂️', color: 'text-amber-600' },
  merge: { label: 'Merge', emoji: '🔧', color: 'text-purple-600' },
  exit: { label: 'Exit/Sales', emoji: '💰', color: 'text-emerald-600' },
};

// Database response types for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id'>>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'order_count' | 'total_spent'>;
        Update: Partial<Omit<Customer, 'id'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Order, 'id'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id' | 'created_at'>;
        Update: Partial<Omit<OrderItem, 'id'>>;
      };
      production_runs: {
        Row: ProductionRun;
        Insert: Omit<ProductionRun, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProductionRun, 'id'>>;
      };
      inventory_movements: {
        Row: InventoryMovement;
        Insert: Omit<InventoryMovement, 'id' | 'created_at'>;
        Update: Partial<Omit<InventoryMovement, 'id'>>;
      };
      invoices: {
        Row: Invoice;
        Insert: Omit<Invoice, 'id' | 'created_at'>;
        Update: Partial<Omit<Invoice, 'id'>>;
      };
      materials: {
        Row: Material;
        Insert: Omit<Material, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Material, 'id'>>;
      };
      stock_adjustments: {
        Row: StockAdjustment;
        Insert: Omit<StockAdjustment, 'id' | 'created_at'>;
        Update: Partial<Omit<StockAdjustment, 'id'>>;
      };
    };
  };
}
