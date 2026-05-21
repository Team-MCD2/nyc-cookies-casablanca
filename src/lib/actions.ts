"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, requireSession } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { notifyAdmins } from "@/lib/whatsapp-bot";

// ---------- Schemas ----------
const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().default(""),
  category: z.enum(["cookie", "box", "icecream"]),
  price_mad: z.coerce.number().int().nonnegative(),
  stock: z.coerce.number().int().nonnegative().default(0),
  active: z.coerce.boolean().default(true),
});

const orderItemSchema = z.object({
  pid: z.string(),
  qty: z.coerce.number().int().positive(),
});

const newOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
});

// ---------- Helpers ----------
function nextRef(prefix: string, count: number) {
  const seq = (count + 1).toString().padStart(4, "0");
  return `${prefix}_${new Date().getFullYear()}_${seq}`;
}

// ---------- Products (admin only) ----------
export async function upsertProduct(input: z.input<typeof productSchema>) {
  await requireRole(["admin"]);
  const data = productSchema.parse(input);
  const sb = createAdminClient();
  const { error } = await sb.from("products").upsert(data, { onConflict: "id" });
  if (error) throw error;
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function deleteProduct(id: string) {
  await requireRole(["admin"]);
  const sb = createAdminClient();
  await sb.from("products").delete().eq("id", id);
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

// ---------- Orders ----------
export async function placeOrder(input: z.input<typeof newOrderSchema>) {
  const session = await requireSession();
  const parsed = newOrderSchema.parse(input);
  const sb = createAdminClient();

  // Resolve customer/pro row from Clerk user
  const isPro = session.role === "pro";
  const linkTable = isPro ? "pros" : "customers";
  const { data: linked } = await sb
    .from(linkTable)
    .select("id")
    .eq("clerk_user_id", session.userId)
    .maybeSingle();
  if (!linked) throw new Error("Profil utilisateur non trouvé.");

  // Compute total from current product prices
  const ids = parsed.items.map((i) => i.pid);
  const { data: products } = await sb.from("products").select("id, price_mad").in("id", ids);
  const priceMap = Object.fromEntries((products ?? []).map((p: any) => [p.id, p.price_mad]));
  const total = parsed.items.reduce((s, it) => s + (priceMap[it.pid] ?? 0) * it.qty, 0);

  const { count } = await sb.from("orders").select("*", { count: "exact", head: true });
  const reference = nextRef("ord", count ?? 0);

  const { data: ord, error } = await sb.from("orders").insert({
    reference,
    customer_type: isPro ? "pro" : "b2c",
    customer_id: isPro ? null : linked.id,
    pro_id: isPro ? linked.id : null,
    items: parsed.items,
    total_mad: total,
    status: "pending",
    payment: isPro ? "pending" : "paid",
  }).select("id").single();
  if (error) throw error;

  const { count: ic } = await sb.from("invoices").select("*", { count: "exact", head: true });
  const seq = ((ic ?? 0) + 1).toString().padStart(4, "0");
  const today = new Date();

  if (isPro) {
    const due = new Date(today.getTime() + 30 * 86400000);
    await sb.from("invoices").insert({
      reference: `INV-${today.getFullYear()}-${seq}`,
      pro_id: linked.id,
      customer_id: null,
      order_id: ord?.id ?? null,
      issue_date: today.toISOString().slice(0, 10),
      due_date: due.toISOString().slice(0, 10),
      amount_mad: total,
      status: "upcoming",
    });
  } else {
    await sb.from("invoices").insert({
      reference: `INV-${today.getFullYear()}-${seq}`,
      pro_id: null,
      customer_id: linked.id,
      order_id: ord?.id ?? null,
      issue_date: today.toISOString().slice(0, 10),
      due_date: today.toISOString().slice(0, 10),
      amount_mad: total,
      status: "paid",
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(isPro ? "/pro/orders" : "/shop");

  const clientType = isPro ? "Professionnel 💼" : "Particulier 🍪";
  const adminUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const orderMessage = `🔔 *NYC Cookies Casablanca*\n\n🛒 *Nouvelle commande* (${clientType})\n\n*Référence :* ${reference}\n*Montant :* ${total} MAD\n\n👉 ${adminUrl}/admin/orders`;
  await notifyAdmins(orderMessage);

  return { reference, total };
}

export async function advanceOrderStatus(reference: string) {
  await requireRole(["admin"]);
  const sb = createAdminClient();
  const { data: cur } = await sb.from("orders").select("status").eq("reference", reference).maybeSingle();
  if (!cur) return;
  const flow = ["pending", "preparing", "ready", "delivered"] as const;
  const idx = flow.indexOf(cur.status as any);
  const next = flow[Math.min(idx + 1, flow.length - 1)];
  await sb.from("orders").update({ status: next }).eq("reference", reference);
  revalidatePath("/admin/orders");
}

// ---------- Invoices ----------
export async function markInvoicePaid(reference: string) {
  await requireRole(["admin", "pro"]);
  const sb = createAdminClient();
  await sb.from("invoices").update({ status: "paid" }).eq("reference", reference);
  revalidatePath("/admin/invoices");
  revalidatePath("/pro/invoices");
}

// ---------- Invitations (admin) ----------
const inviteSchema = z.object({
  company: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1, "Numéro de téléphone requis"),
});

export async function createInvitation(input: z.input<typeof inviteSchema>) {
  await requireRole(["admin"]);
  const data = inviteSchema.parse(input);
  const sb = createAdminClient();
  const token =
    "inv_" +
    Math.random().toString(36).slice(2, 8).toUpperCase() +
    "-" +
    Date.now().toString(36).toUpperCase();
  const { error } = await sb.from("invitations").insert({
    token,
    company: data.company,
    contact_name: data.contactName,
    email: data.email,
    phone: data.phone,
  });
  if (error) throw error;
  revalidatePath("/admin/pros");
  return { token };
}

export async function deleteInvitation(token: string) {
  await requireRole(["admin"]);
  const sb = createAdminClient();
  const { error } = await sb.from("invitations").delete().eq("token", token);
  if (error) throw error;
  revalidatePath("/admin/pros");
}

// ---------- Pro Requests (public / admin) ----------
const proRequestSchema = z.object({
  company: z.string().min(1, "Nom de la société requis"),
  contactName: z.string().min(1, "Nom de contact requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(1, "Numéro de téléphone requis"),
  message: z.string().optional(),
});

export async function submitProRequest(input: z.input<typeof proRequestSchema>) {
  const data = proRequestSchema.parse(input);
  const sb = createAdminClient();

  const { error } = await sb.from("pro_requests").insert({
    company: data.company,
    contact_name: data.contactName,
    email: data.email,
    phone: data.phone,
    message: data.message ?? null,
    status: "pending",
  });
  if (error) throw error;

  const adminUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const proRequestMessage = `💼 *NYC Cookies Casablanca*\n\n📋 *Nouvelle demande compte Pro*\n\n*Société :* ${data.company}\n*Contact :* ${data.contactName}\n*Email :* ${data.email}\n*Téléphone :* ${data.phone}\n${data.message ? `*Message :* ${data.message}` : ""}\n\n👉 ${adminUrl}/admin/pros`;
  await notifyAdmins(proRequestMessage);

  revalidatePath("/admin/pros");
  return { success: true };
}

export async function updateProRequestStatus(id: string, status: "pending" | "approved" | "rejected") {
  await requireRole(["admin"]);
  const sb = createAdminClient();

  const { error } = await sb.from("pro_requests").update({ status }).eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/pros");
}

export async function deleteProRequest(id: string) {
  await requireRole(["admin"]);
  const sb = createAdminClient();

  const { error } = await sb.from("pro_requests").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/pros");
}


// ---------- Customers / Pros (admin) ----------
export async function deleteCustomer(id: string) {
  await requireRole(["admin"]);
  const sb = createAdminClient();
  const { error } = await sb.from("customers").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/customers");
  revalidatePath("/admin/users");
}

const proUpdateSchema = z.object({
  id: z.string().uuid(),
  company: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  ice: z.string().nullable().optional(),
  paymentTerms: z.coerce.number().int().min(0).max(365),
  status: z.enum(["active", "inactive"]),
});

export async function updatePro(input: z.input<typeof proUpdateSchema>) {
  await requireRole(["admin"]);
  const data = proUpdateSchema.parse(input);
  const sb = createAdminClient();
  const { error } = await sb
    .from("pros")
    .update({
      company: data.company,
      contact_name: data.contactName,
      email: data.email,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      ice: data.ice?.trim() || null,
      payment_terms_days: data.paymentTerms,
      status: data.status,
    })
    .eq("id", data.id);
  if (error) throw error;
  revalidatePath("/admin/pros");
  revalidatePath("/admin/users");
}

export async function deletePro(id: string) {
  await requireRole(["admin"]);
  const sb = createAdminClient();
  const { error } = await sb.from("pros").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/pros");
  revalidatePath("/admin/users");
}

// ---------- Clerk users (admin) ----------
const VALID_ROLES = ["admin", "pro", "b2c"] as const;

/**
 * Update a Clerk user's role via publicMetadata. The new role is enforced on
 * the next request (server components re-read publicMetadata, no logout
 * required).
 */
export async function setUserRole(clerkUserId: string, role: Role) {
  await requireRole(["admin"]);
  if (!VALID_ROLES.includes(role)) throw new Error(`Rôle invalide: ${role}`);

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  await clerk.users.updateUser(clerkUserId, {
    publicMetadata: { ...(user.publicMetadata ?? {}), role },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/pros");
}

/**
 * Hard-deletes a Clerk user AND any linked customer/pro row.
 * Use with caution — this is irreversible.
 */
export async function deleteClerkUser(clerkUserId: string) {
  const session = await requireRole(["admin"]);
  if (session.userId === clerkUserId) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
  }

  const sb = createAdminClient();
  await sb.from("customers").delete().eq("clerk_user_id", clerkUserId);
  await sb.from("pros").delete().eq("clerk_user_id", clerkUserId);

  const clerk = await clerkClient();
  await clerk.users.deleteUser(clerkUserId);

  revalidatePath("/admin/users");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/pros");
}

/** Simulate sending an invoice email to a pro client. */
export async function sendInvoiceEmail(reference: string) {
  const session = await requireSession();
  const sb = createAdminClient();

  const { data: inv } = await sb
    .from("invoices")
    .select("*, pros(*)")
    .eq("reference", reference)
    .maybeSingle();
  if (!inv) throw new Error("Facture introuvable.");

  if (session.role === "pro") {
    const { data: linkedPro } = await sb
      .from("pros")
      .select("id")
      .eq("clerk_user_id", session.userId)
      .maybeSingle();
    if (!linkedPro || linkedPro.id !== inv.pro_id) {
      throw new Error("Action non autorisée.");
    }
  }

  const targetEmail = inv.pros?.email;
  if (!targetEmail) throw new Error("Adresse email du client introuvable.");

  console.log(`[EMAIL SIMULATOR] Sending invoice ${inv.reference} to ${targetEmail}`);
  console.log(`[EMAIL SIMULATOR] Subject: Votre facture NYC Cookies - ${inv.reference}`);
  console.log(`[EMAIL SIMULATOR] Body: Bonjour ${inv.pros.company}, veuillez trouver ci-dessous le récapitulatif de votre facture ${inv.reference} d'un montant de ${inv.amount_mad} MAD.`);

  return {
    success: true,
    email: targetEmail,
    message: `La facture ${inv.reference} a été envoyée avec succès par mail à ${targetEmail} !`,
  };
}

/** Simulate sending an order receipt email to a B2C client. */
export async function sendOrderReceiptEmail(reference: string) {
  const session = await requireSession();
  const sb = createAdminClient();

  const { data: ord } = await sb
    .from("orders")
    .select("*, customers(*)")
    .eq("reference", reference)
    .maybeSingle();
  if (!ord) throw new Error("Commande introuvable.");

  if (session.role === "b2c") {
    const { data: linkedCustomer } = await sb
      .from("customers")
      .select("id")
      .eq("clerk_user_id", session.userId)
      .maybeSingle();
    if (!linkedCustomer || linkedCustomer.id !== ord.customer_id) {
      throw new Error("Action non autorisée.");
    }
  }

  const targetEmail = ord.customers?.email;
  if (!targetEmail) throw new Error("Adresse email du client introuvable.");

  console.log(`[EMAIL SIMULATOR] Sending order receipt ${ord.reference} to ${targetEmail}`);
  console.log(`[EMAIL SIMULATOR] Subject: Votre reçu de commande NYC Cookies - ${ord.reference}`);
  console.log(`[EMAIL SIMULATOR] Body: Bonjour ${ord.customers.name}, merci pour votre commande ! Référence : ${ord.reference}. Total : ${ord.total_mad} MAD.`);

  return {
    success: true,
    email: targetEmail,
    message: `Le reçu de la commande ${ord.reference} a été envoyé avec succès par mail à ${targetEmail} !`,
  };
}
