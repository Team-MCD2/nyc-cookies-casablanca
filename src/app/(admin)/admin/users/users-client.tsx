"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Search, ShieldCheck, Trash2, Briefcase, User as UserIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { InputGroup } from "@/components/ui/input";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import { setUserRole, deleteClerkUser } from "@/lib/actions";
import { formatDate } from "@/lib/utils";
import type { ClerkUserSummary, Role } from "@/lib/types";

type RoleFilter = "all" | Role;

const ROLE_META: Record<Role, { label: string; variant: "danger" | "accent" | "info"; icon: React.FC<{ className?: string }> }> = {
  admin: { label: "Admin", variant: "danger", icon: ShieldCheck },
  pro:   { label: "Pro",   variant: "accent", icon: Briefcase },
  b2c:   { label: "Sans accès", variant: "info",  icon: UserIcon },
};

interface PendingRoleChange {
  user: ClerkUserSummary;
  next: Role;
}

interface Props {
  users: ClerkUserSummary[];
  currentUserId: string | null;
}

export function UsersClient({ users, currentUserId }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [confirmDelete, setConfirmDelete] = useState<ClerkUserSummary | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (filter !== "all" && u.role !== filter) return false;
      if (!q) return true;
      return (
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    });
  }, [users, query, filter]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:max-w-sm sm:flex-1">
          <InputGroup
            icon={<Search className="h-4 w-4" />}
            placeholder="Nom, email, user_id…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border bg-surface-2 p-1 text-[0.85rem]">
          {(["all", "admin", "pro"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                "rounded-full px-3 py-1.5 font-medium transition-colors " +
                (filter === f
                  ? "bg-accent text-white"
                  : "text-text-2 hover:bg-surface-3 hover:text-text")
              }
            >
              {f === "all" ? "Tous" : ROLE_META[f].label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty title="Aucun utilisateur">
          {query || filter !== "all"
            ? "Aucun utilisateur ne correspond aux critères."
            : "Personne n'a encore créé de compte sur la plateforme."}
        </Empty>
      ) : (
        <Card className="p-0">
          <TableWrap className="rounded-none border-0">
            <Table>
              <Thead>
                <Tr>
                  <Th>Utilisateur</Th>
                  <Th>Email</Th>
                  <Th>Rôle</Th>
                  <Th>Inscrit</Th>
                  <Th>Dernière connexion</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    isSelf={currentUserId === u.id}
                    onDelete={() => setConfirmDelete(u)}
                    onRoleRequest={(next) => setPendingChange({ user: u, next })}
                  />
                ))}
              </Tbody>
            </Table>
          </TableWrap>
        </Card>
      )}

      <ChangeRoleModal
        change={pendingChange}
        isSelf={pendingChange ? pendingChange.user.id === currentUserId : false}
        onClose={() => setPendingChange(null)}
      />
      <DeleteUserModal user={confirmDelete} onClose={() => setConfirmDelete(null)} />
    </>
  );
}

// =============================================================================
// Row with role-change controls
// =============================================================================

function UserRow({
  user,
  isSelf,
  onDelete,
  onRoleRequest,
}: {
  user: ClerkUserSummary;
  isSelf: boolean;
  onDelete: () => void;
  onRoleRequest: (next: Role) => void;
}) {
  const meta = ROLE_META[user.role];
  const Icon = meta.icon;
  const displayName = user.name?.trim() || user.email?.split("@")[0] || "—";

  return (
    <Tr>
      <Td>
        <div className="flex items-center gap-3">
          <Avatar name={displayName} size="sm" />
          <div className="min-w-0">
            <div className="font-semibold flex items-center gap-2">
              <span className="truncate">{displayName}</span>
              {isSelf && (
                <Badge variant="neutral" dot={false} className="px-2 py-0.5 text-[0.65rem]">
                  Vous
                </Badge>
              )}
            </div>
            <div className="font-mono text-[0.72rem] text-text-muted truncate">{user.id}</div>
          </div>
        </div>
      </Td>
      <Td className="text-[0.9rem] text-text-2">{user.email ?? "—"}</Td>
      <Td>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={meta.variant}>
            <Icon className="h-3 w-3" /> {meta.label}
          </Badge>
        </div>
      </Td>
      <Td className="text-[0.88rem] text-text-3">{formatDate(user.createdAt)}</Td>
      <Td className="text-[0.88rem] text-text-3">
        {user.lastSignInAt ? formatDate(user.lastSignInAt) : <span className="text-text-muted">jamais</span>}
      </Td>
      <Td>
        <div className="flex justify-end gap-1">
          <RoleSwitcher
            currentRole={user.role}
            disabled={isSelf}
            onChange={onRoleRequest}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isSelf}
            title={isSelf ? "Vous ne pouvez pas vous supprimer" : "Supprimer l'utilisateur"}
            aria-label="Supprimer l'utilisateur"
            className="hover:bg-danger-soft hover:text-danger disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Td>
    </Tr>
  );
}

// =============================================================================
// Role pill switcher (3 buttons: Admin / Pro / Client)
// =============================================================================

function RoleSwitcher({
  currentRole,
  disabled,
  onChange,
}: {
  currentRole: Role;
  disabled: boolean;
  onChange: (role: Role) => void;
}) {
  const roles: Role[] = ["admin", "pro"];
  return (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-border bg-surface-2 text-[0.78rem]">
      {roles.map((r) => {
        const active = currentRole === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            disabled={disabled || active}
            className={
              "px-2.5 py-1.5 font-semibold uppercase tracking-[0.05em] transition-colors " +
              (active
                ? "bg-accent text-white cursor-default"
                : "text-text-3 hover:bg-surface-3 hover:text-text disabled:opacity-40 disabled:cursor-not-allowed")
            }
            title={`Définir comme ${ROLE_META[r].label}`}
          >
            {ROLE_META[r].label}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// Confirm role change
// =============================================================================

function ChangeRoleModal({
  change,
  isSelf,
  onClose,
}: {
  change: PendingRoleChange | null;
  isSelf: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onConfirm() {
    if (!change) return;
    const { user, next } = change;
    start(async () => {
      try {
        await setUserRole(user.id, next);
        toast({
          title: "Rôle mis à jour",
          message: `${user.name ?? user.email} → ${ROLE_META[next].label}`,
          type: "success",
        });
        onClose();
        router.refresh();
      } catch (err) {
        toast({
          title: "Erreur",
          message: err instanceof Error ? err.message : "Échec du changement de rôle.",
          type: "danger",
        });
      }
    });
  }

  if (!change) return null;
  const { user, next } = change;
  const from = ROLE_META[user.role];
  const to = ROLE_META[next];
  const losingAdmin = user.role === "admin" && next !== "admin";
  const FromIcon = from.icon;
  const ToIcon = to.icon;
  const displayName = user.name?.trim() || user.email || user.id;

  return (
    <Modal
      open={!!change}
      onClose={onClose}
      title="Changer le rôle"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button
            variant={losingAdmin ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Application…" : "Confirmer"}
          </Button>
        </>
      }
    >
      <p className="text-text-2">
        <strong className="text-text">{displayName}</strong> passera de{" "}
        <Badge variant={from.variant}>
          <FromIcon className="h-3 w-3" /> {from.label}
        </Badge>{" "}
        à{" "}
        <Badge variant={to.variant}>
          <ToIcon className="h-3 w-3" /> {to.label}
        </Badge>
        .
      </p>

      {next === "admin" && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-[0.85rem] text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Cet utilisateur aura accès complet à la console : produits, commandes,
            clients, factures et gestion des autres utilisateurs.
          </span>
        </div>
      )}

      {losingAdmin && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-danger/40 bg-danger-soft p-3 text-[0.85rem] text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Cet utilisateur perdra l'accès à <code>/admin/*</code> immédiatement.
            {isSelf && " Vous-même perdrez l'accès à cette page."}
          </span>
        </div>
      )}

      {next === "pro" && user.role !== "pro" && (
        <p className="mt-2 text-[0.85rem] text-text-3">
          Une fiche société sera créée automatiquement à sa prochaine connexion
          (modifiable depuis <strong>Clients pros</strong>).
        </p>
      )}
    </Modal>
  );
}

// =============================================================================
// Delete confirmation
// =============================================================================

function DeleteUserModal({
  user,
  onClose,
}: {
  user: ClerkUserSummary | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onDelete() {
    if (!user) return;
    start(async () => {
      try {
        await deleteClerkUser(user.id);
        toast({
          title: "Utilisateur supprimé",
          message: user.email ?? user.id,
          type: "success",
        });
        onClose();
        router.refresh();
      } catch (err) {
        toast({
          title: "Erreur",
          message: err instanceof Error ? err.message : "Échec de la suppression.",
          type: "danger",
        });
      }
    });
  }

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title="Supprimer l'utilisateur"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={pending}>
            {pending ? "Suppression…" : "Supprimer définitivement"}
          </Button>
        </>
      }
    >
      <p className="text-text-2">
        Confirmer la suppression de{" "}
        <strong className="text-text">{user?.name ?? user?.email ?? "ce compte"}</strong> ?
      </p>
      <p className="mt-2 text-[0.88rem] text-text-3">
        Le compte Clerk sera supprimé définitivement, ainsi que tout profil
        client / pro associé. Les commandes et factures historiques restent
        conservées (pour traçabilité comptable).
      </p>
    </Modal>
  );
}
