-- Add shipping_mad column to public.invoices table
ALTER TABLE "public"."invoices" ADD COLUMN "shipping_mad" integer NOT NULL DEFAULT 0;
