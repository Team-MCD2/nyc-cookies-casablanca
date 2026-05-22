import { clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Product,
  Customer,
  Pro,
  Order,
  Invoice,
  Invitation,
  ProRequest,
  ProductCategory,
  OrderStatus,
  Role,
  ClerkUserSummary,
} from "@/lib/types";

/** Map a snake_case row from Supabase into camelCase domain object. */
function rowToProduct(r: any): Product {
  return {
    id: r.id,
    name: r.name,
    desc: r.description ?? "",
    price: r.price_mad,
    category: r.category as ProductCategory,
    stock: r.stock ?? 0,
    active: r.active ?? true,
    imageUrl: r.image_url ?? null,
  };
}

function rowToCustomer(r: any): Customer {
  return {
    id: r.id,
    clerkUserId: r.clerk_user_id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    createdAt: r.created_at?.slice(0, 10) ?? "",
    orders: r.orders_count ?? 0,
    spent: r.total_spent ?? 0,
  };
}

type ProStats = { ordersCount: number; totalSpent: number; outstanding: number };

function applyProStats(pro: Pro, stats?: ProStats): Pro {
  if (!stats) return pro;
  return {
    ...pro,
    ordersCount: stats.ordersCount,
    totalSpent: stats.totalSpent,
    outstanding: stats.outstanding,
  };
}

/** Agrège commandes + factures impayées (source de vérité pour CMDS / CA / encours). */
async function loadProStatsMap(
  sb: ReturnType<typeof createAdminClient>,
): Promise<Map<string, ProStats>> {
  const map = new Map<string, ProStats>();

  const { data: orders } = await sb
    .from("orders")
    .select("pro_id, total_mad")
    .eq("customer_type", "pro")
    .not("pro_id", "is", null);

  for (const o of orders ?? []) {
    const id = o.pro_id as string;
    const cur = map.get(id) ?? { ordersCount: 0, totalSpent: 0, outstanding: 0 };
    cur.ordersCount += 1;
    cur.totalSpent += o.total_mad ?? 0;
    map.set(id, cur);
  }

  const { data: invoices } = await sb
    .from("invoices")
    .select("pro_id, amount_mad, status")
    .not("pro_id", "is", null)
    .in("status", ["upcoming", "overdue"]);

  for (const inv of invoices ?? []) {
    const id = inv.pro_id as string;
    const cur = map.get(id) ?? { ordersCount: 0, totalSpent: 0, outstanding: 0 };
    cur.outstanding += inv.amount_mad ?? 0;
    map.set(id, cur);
  }

  return map;
}

function rowToPro(r: any): Pro {
  return {
    id: r.id,
    clerkUserId: r.clerk_user_id,
    company: r.company,
    contactName: r.contact_name,
    email: r.email,
    phone: r.phone,
    address: r.address,
    ice: r.ice,
    paymentTerms: r.payment_terms_days ?? 30,
    status: r.status,
    createdAt: r.created_at?.slice(0, 10) ?? "",
    ordersCount: r.orders_count ?? 0,
    totalSpent: r.total_spent ?? 0,
    outstanding: r.outstanding_mad ?? 0,
  };
}

function rowToOrder(r: any): Order {
  return {
    id: r.reference,
    customerId: r.customer_id ?? r.pro_id ?? "",
    customerType: r.customer_type,
    date: r.created_at?.slice(0, 10) ?? "",
    items: r.items ?? [],
    total: r.total_mad,
    status: r.status as OrderStatus,
    payment: r.payment ?? "pending",
  };
}

function rowToInvoice(r: any): Invoice {
  return {
    id: r.reference,
    proId: r.pro_id,
    customerId: r.customer_id,
    orderId: r.order_id,
    issueDate: r.issue_date,
    dueDate: r.due_date,
    amount: r.amount_mad,
    status: r.status,
    sentToClient: r.sent_to_client ?? false,
    tvaRate: r.tva_rate != null ? Number(r.tva_rate) : null,
    amountHt: r.amount_ht_mad ?? null,
    shippingMad: r.shipping_mad ?? null,
  };
}

function rowToInvitation(r: any): Invitation {
  return {
    token: r.token,
    company: r.company,
    contactName: r.contact_name,
    email: r.email,
    createdAt: r.created_at?.slice(0, 10) ?? "",
    used: !!r.used_at,
  };
}

// ---------- Products ----------
export async function listProducts() {
  const sb = createAdminClient();
  const { data, error } = await sb.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToProduct);
}

export async function listActiveProducts() {
  const all = await listProducts();
  return all.filter((p) => p.active);
}

export async function getProduct(id: string) {
  const sb = createAdminClient();
  const { data } = await sb.from("products").select("*").eq("id", id).maybeSingle();
  return data ? rowToProduct(data) : null;
}

// ---------- Customers / Pros ----------
export async function listCustomers() {
  const sb = createAdminClient();
  const { data } = await sb.from("customers").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(rowToCustomer);
}

export async function listPros() {
  const sb = createAdminClient();
  const [{ data }, stats] = await Promise.all([
    sb.from("pros").select("*").order("created_at", { ascending: false }),
    loadProStatsMap(sb),
  ]);
  return (data ?? []).map((r) => applyProStats(rowToPro(r), stats.get(r.id)));
}

export async function getProById(id: string) {
  const sb = createAdminClient();
  const [{ data }, stats] = await Promise.all([
    sb.from("pros").select("*").eq("id", id).maybeSingle(),
    loadProStatsMap(sb),
  ]);
  return data ? applyProStats(rowToPro(data), stats.get(data.id)) : null;
}

/** Recalcule et enregistre CMDS / CA / encours pour un pro (backfill + synchro). */
export async function syncProStatsToDb(proId: string) {
  const sb = createAdminClient();
  const stats = (await loadProStatsMap(sb)).get(proId) ?? {
    ordersCount: 0,
    totalSpent: 0,
    outstanding: 0,
  };
  await sb
    .from("pros")
    .update({
      orders_count: stats.ordersCount,
      total_spent: stats.totalSpent,
      outstanding_mad: stats.outstanding,
    })
    .eq("id", proId);
}

/** Recalcule les stats de tous les pros (idempotent). */
export async function syncAllProsStatsToDb() {
  const sb = createAdminClient();
  const [{ data: pros }, stats] = await Promise.all([
    sb.from("pros").select("id"),
    loadProStatsMap(sb),
  ]);
  await Promise.all(
    (pros ?? []).map((p) => {
      const s = stats.get(p.id) ?? { ordersCount: 0, totalSpent: 0, outstanding: 0 };
      return sb
        .from("pros")
        .update({
          orders_count: s.ordersCount,
          total_spent: s.totalSpent,
          outstanding_mad: s.outstanding,
        })
        .eq("id", p.id);
    }),
  );
}

// ---------- Orders ----------
export async function listOrders() {
  const sb = createAdminClient();
  const { data } = await sb.from("orders").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(rowToOrder);
}

export async function listOrdersForPro(proId: string) {
  const sb = createAdminClient();
  const { data } = await sb
    .from("orders")
    .select("*")
    .eq("pro_id", proId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToOrder);
}

export async function listOrdersForCustomer(customerId: string) {
  const sb = createAdminClient();
  const { data } = await sb
    .from("orders")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToOrder);
}

/**
 * Fetch a single order by reference, scoped to a given customer for safety.
 * Returns null when the reference is unknown or doesn't belong to the customer.
 */
export async function getOrderForCustomer(customerId: string, reference: string) {
  const sb = createAdminClient();
  const { data } = await sb
    .from("orders")
    .select("*")
    .eq("reference", reference)
    .eq("customer_id", customerId)
    .maybeSingle();
  return data ? rowToOrder(data) : null;
}

// ---------- Invoices ----------
export async function listInvoices() {
  const sb = createAdminClient();
  const { data } = await sb
    .from("invoices")
    .select("*, pros(*), customers(*)")
    .order("issue_date", { ascending: false });
  return (data ?? []).map((r: any) => ({
    ...rowToInvoice(r),
    pro: r.pros ? rowToPro(r.pros) : null,
    customer: r.customers ? rowToCustomer(r.customers) : null,
  }));
}

export async function listInvoicesForPro(proId: string) {
  const sb = createAdminClient();
  const { data } = await sb
    .from("invoices")
    .select("*")
    .eq("pro_id", proId)
    .eq("sent_to_client", true)
    .order("issue_date", { ascending: false });
  return (data ?? []).map(rowToInvoice);
}

export async function getInvoiceByReference(reference: string) {
  const sb = createAdminClient();
  const { data } = await sb
    .from("invoices")
    .select("*, pros(*), customers(*)")
    .eq("reference", reference)
    .maybeSingle();
  if (!data) return null;

  let orderData = null;
  if (data.order_id) {
    const { data: ord } = await sb.from("orders").select("*").eq("id", data.order_id).maybeSingle();
    if (ord) {
      orderData = rowToOrder(ord);
    }
  }

  return {
    ...rowToInvoice(data),
    pro: data.pros ? rowToPro(data.pros) : null,
    customer: data.customers ? rowToCustomer(data.customers) : null,
    order: orderData,
  };
}

// ---------- Invitations ----------
export async function listInvitations() {
  const sb = createAdminClient();
  const { data } = await sb.from("invitations").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(rowToInvitation);
}

export async function findInvitation(token: string) {
  const sb = createAdminClient();
  const { data } = await sb.from("invitations").select("*").eq("token", token).maybeSingle();
  return data ? rowToInvitation(data) : null;
}

// ---------- Pro Requests ----------
function rowToProRequest(r: any): ProRequest {
  return {
    id: r.id,
    company: r.company,
    contactName: r.contact_name,
    email: r.email,
    phone: r.phone,
    message: r.message,
    status: r.status,
    createdAt: r.created_at?.slice(0, 10) ?? "",
  };
}

export async function listProRequests() {
  const sb = createAdminClient();
  const { data } = await sb.from("pro_requests").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(rowToProRequest);
}


// ---------- Clerk users (admin only) ----------
const VALID_ROLES = ["admin", "pro", "b2c"] as const;

function coerceRole(value: unknown): Role {
  return typeof value === "string" && (VALID_ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : "b2c";
}

/**
 * Lists every Clerk user with their role + identity. Used by /admin/users to
 * let the admin promote / demote / delete users without leaving the app.
 */
export async function listClerkUsers(): Promise<ClerkUserSummary[]> {
  const clerk = await clerkClient();
  const list = await clerk.users.getUserList({ limit: 200, orderBy: "-created_at" });
  const users = Array.isArray(list) ? list : list?.data ?? [];
  return users.map((u: any) => ({
    id: u.id,
    name:
      u.fullName ||
      [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
      u.username ||
      null,
    email: u.primaryEmailAddress?.emailAddress ?? u.emailAddresses?.[0]?.emailAddress ?? null,
    imageUrl: u.imageUrl ?? null,
    role: coerceRole((u.publicMetadata as { role?: unknown } | undefined)?.role),
    createdAt:
      typeof u.createdAt === "number"
        ? new Date(u.createdAt).toISOString().slice(0, 10)
        : "",
    lastSignInAt:
      typeof u.lastSignInAt === "number"
        ? new Date(u.lastSignInAt).toISOString().slice(0, 10)
        : null,
  }));
}
