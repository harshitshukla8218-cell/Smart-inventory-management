export type UserRole = 'admin' | 'inventory' | 'procurement' | 'sales' | 'management';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id?: string;
  department?: { id: string; name: string };
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  address?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand?: string;
  model_number?: string;
  description?: string;
  category_id?: string;
  category?: Category;
  unit_price: number;
  image_url?: string;
  is_active: boolean;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  product: Product;
  warehouse_id: string;
  warehouse: Warehouse;
  total_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  incoming_quantity: number;
  damaged_quantity: number;
  min_stock_level: number;
  reorder_level: number;
  last_updated?: string;
}

export interface InventoryTransaction {
  id: string;
  inventory_id: string;
  transaction_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_type?: string;
  notes?: string;
  created_at: string;
}

export type PlatformType = 'AMAZON' | 'FLIPKART' | 'MEESHO' | 'OTHER';

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  rating: number;
  is_active: boolean;
}

export interface VendorProduct {
  id: string;
  vendor_id: string;
  vendor?: Vendor;
  product_id: string;
  product?: Product;
  external_product_name: string;
  unit_price: number;
  available_quantity: number;
  delivery_days_estimate: number;
  delivery_charges: number;
  product_url?: string;
  product_image_url?: string;
  platform: PlatformType;
  rating: number;
}

export type ProcurementStatus =
  | 'PENDING_REVIEW'
  | 'UNDER_EVALUATION'
  | 'VENDOR_SELECTED'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'PO_CREATED'
  | 'ORDERED'
  | 'SHIPPED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ProcurementRequest {
  id: string;
  request_number: string;
  product_id: string;
  product?: Product;
  required_quantity: number;
  available_quantity: number;
  shortage_quantity: number;
  status: ProcurementStatus;
  requested_by: string;
  requester?: User;
  assigned_to?: string;
  assignee?: User;
  selected_vendor_id?: string;
  selected_vendor?: Vendor;
  estimated_total_cost?: number;
  sales_order_id?: string;
  notes?: string;
  created_at: string;
}

export type POStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'ORDERED'
  | 'SHIPPED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  product?: Product;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor?: Vendor;
  procurement_request_id?: string;
  procurement_request?: ProcurementRequest;
  status: POStatus;
  order_date: string;
  expected_delivery_date?: string;
  payment_status: string;
  total_amount: number;
  notes?: string;
  items?: PurchaseOrderItem[];
  created_at: string;
}

export interface WarehouseReceiptItem {
  id: string;
  product_id: string;
  product?: Product;
  expected_quantity: number;
  received_quantity: number;
  damaged_quantity: number;
  condition: 'GOOD' | 'DAMAGED' | 'PARTIAL';
  notes?: string;
}

export interface WarehouseReceipt {
  id: string;
  receipt_number: string;
  purchase_order_id?: string;
  purchase_order?: PurchaseOrder;
  warehouse_id: string;
  warehouse?: Warehouse;
  received_by: string;
  receiver?: User;
  receipt_date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL';
  notes?: string;
  items?: WarehouseReceiptItem[];
}

export type SalesOrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PROCESSING'
  | 'PARTIALLY_ALLOCATED'
  | 'FULLY_ALLOCATED'
  | 'AWAITING_STOCK'
  | 'COMPLETED'
  | 'CANCELLED';

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  product?: Product;
  quantity_requested: number;
  quantity_allocated: number;
  quantity_pending: number;
  unit_price: number;
  notes?: string;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: SalesOrderStatus;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  warehouse_id?: string;
  warehouse?: Warehouse;
  items?: SalesOrderItem[];
  created_at: string;
  notes?: string;
}

export interface ProductAllocation {
  id: string;
  sales_order_id: string;
  sales_order?: SalesOrder;
  product_id: string;
  product?: Product;
  inventory_id: string;
  inventory?: InventoryItem;
  quantity_allocated: number;
  allocated_at: string;
  status: 'ACTIVE' | 'RELEASED' | 'FULFILLED' | 'CANCELLED';
  notes?: string;
}

export interface AppNotification {
  id: string;
  user_id?: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
}

export interface DashboardKPIs {
  total_products: number;
  available_stock: number;
  out_of_stock: number;
  low_stock: number;
  pending_procurement: number;
  active_purchase_orders: number;
  incoming_warehouse: number;
  pending_sales_orders: number;
  allocated_products: number;
  completed_orders: number;
}
