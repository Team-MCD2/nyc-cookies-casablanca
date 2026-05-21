import { redirect } from "next/navigation";

/** Alias français → route anglaise (évite redirection login sur URL inexistante). */
export default function ProFacturesRedirect() {
  redirect("/pro/invoices");
}
