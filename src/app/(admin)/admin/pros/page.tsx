import { PageHeader } from "@/components/ui/misc";
import { listPros, listInvitations, listProRequests, syncAllProsStatsToDb } from "@/lib/queries";
import { syncProsFromClerk } from "@/lib/auth";
import { ProsClient } from "./pros-client";

export const dynamic = "force-dynamic";

export default async function AdminProsPage() {
  // Backfill any pro Clerk users that don't yet have a Supabase row.
  // Idempotent — safe to run on every page render.
  await syncProsFromClerk().catch(() => undefined);
  await syncAllProsStatsToDb().catch(() => undefined);

  const [pros, invitations, proRequests] = await Promise.all([
    listPros().catch(() => []),
    listInvitations().catch(() => []),
    listProRequests().catch(() => []),
  ]);
  const pendingInvites = invitations.filter((i) => !i.used);

  return (
    <>
      <PageHeader
        title="Clients pros"
        eyebrow="Clientèle B2B"
        subtitle={
          pros.length === 0 && pendingInvites.length === 0 && proRequests.length === 0
            ? "Invitez vos premiers partenaires pros."
            : `${pros.length} pro${pros.length > 1 ? "s" : ""} · ${pendingInvites.length} invitation${pendingInvites.length > 1 ? "s" : ""} en attente · ${proRequests.filter(r => r.status === "pending").length} demande(s) en attente.`
        }
      />
      <ProsClient pros={pros} invitations={pendingInvites} proRequests={proRequests} />
    </>
  );
}
