/**
 * NYC Cookies — Domain types
 * Mirrors the Supabase schema (see /supabase/schema.sql).
 */

export type ProductCategory = "cookie" | "box" | "icecream";
export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid";
export type InvoiceStatus = "upcoming" | "paid" | "overdue";
export type ProStatus = "active" | "inactive";
export type CustomerType = "b2c" | "pro";
export type Role = "admin" | "pro" | "b2c";

export interface Product {
  id: string;
  name: string;
  desc: string;
  price: number;
  category: ProductCategory;
  stock: number;
  active: boolean;
  imageUrl?: string | null;
}

export interface Customer {
  id: string;
  clerkUserId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  orders: number;
  spent: number;
}

export interface Pro {
  id: string;
  clerkUserId?: string | null;
  company: string;
  contactName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  ice?: string | null;
  paymentTerms: number;
  status: ProStatus;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  outstanding: number;
}

export interface OrderItem {
  pid: string;
  qty: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerType: CustomerType;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  payment: PaymentStatus;
}

export interface Invoice {
  id: string;
  proId: string;
  orderId: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
}

export interface Invitation {
  token: string;
  company: string;
  contactName: string;
  email: string;
  createdAt: string;
  used: boolean;
}

/** Lightweight Clerk user view used by the admin users management page. */
export interface ClerkUserSummary {
  id: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  role: Role;
  createdAt: string;
  lastSignInAt: string | null;
}
