import { redirect } from "next/navigation";
import { getCurrentSession, roleHome } from "@/lib/auth";

/** Post-login redirect: admin → /admin/dashboard, pro → /pro/dashboard, b2c → /account */
export default async function AfterSignInPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  redirect(roleHome(session.role));
}
