import { auth } from "@clerk/nextjs/server";
import { PageHeader, Empty } from "@/components/ui/misc";
import { listClerkUsers } from "@/lib/queries";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { userId } = await auth();

  let users = [] as Awaited<ReturnType<typeof listClerkUsers>>;
  let listError: string | null = null;
  try {
    users = await listClerkUsers();
  } catch (e) {
    listError = e instanceof Error ? e.message : "Échec du chargement.";
  }

  const counts = {
    total: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    pro: users.filter((u) => u.role === "pro").length,
    b2c: users.filter((u) => u.role === "b2c").length,
  };

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        eyebrow="Identités & rôles"
        subtitle={
          listError
            ? "Impossible de récupérer la liste des utilisateurs Clerk."
            : `${counts.total} compte${counts.total > 1 ? "s" : ""} · ${counts.admin} admin · ${counts.pro} pro · ${counts.b2c} client${counts.b2c > 1 ? "s" : ""}.`
        }
      />

      {listError ? (
        <Empty title="Erreur Clerk">{listError}</Empty>
      ) : (
        <UsersClient users={users} currentUserId={userId ?? null} />
      )}
    </>
  );
}
