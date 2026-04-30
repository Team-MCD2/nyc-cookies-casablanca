"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, Mail, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { InputGroup } from "@/components/ui/input";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import { deleteCustomer } from "@/lib/actions";
import { money, formatDate } from "@/lib/utils";
import type { Customer } from "@/lib/types";

interface Props {
  customers: Customer[];
}

export function CustomersClient({ customers }: Props) {
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q),
    );
  }, [customers, query]);

  if (customers.length === 0) {
    return (
      <Empty title="Aucun client B2C">
        Les clients apparaîtront ici dès qu'ils créeront un compte sur la boutique.
        <br />
        <span className="text-text-muted">
          Les comptes Clerk avec rôle <code className="font-mono">b2c</code> sont liés
          automatiquement à leur première visite connectée.
        </span>
      </Empty>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:max-w-sm sm:flex-1">
          <InputGroup
            icon={<Search className="h-4 w-4" />}
            placeholder="Rechercher un client par nom, email, téléphone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="text-[0.85rem] text-text-3">
          {filtered.length} affiché{filtered.length > 1 ? "s" : ""} sur {customers.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Empty title="Aucun résultat">Aucun client ne correspond à votre recherche.</Empty>
      ) : (
        <Card className="p-0">
          <TableWrap className="rounded-none border-0">
            <Table>
              <Thead>
                <Tr>
                  <Th>Client</Th>
                  <Th>Contact</Th>
                  <Th className="text-right">Commandes</Th>
                  <Th className="text-right">Dépensé</Th>
                  <Th>Inscrit</Th>
                  <Th>Lien Clerk</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size="sm" />
                        <span className="font-semibold">{c.name}</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5 text-[0.88rem]">
                        <Mail className="h-3.5 w-3.5 text-text-muted" /> {c.email}
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-[0.85rem] text-text-3">
                          <Phone className="h-3.5 w-3.5 text-text-muted" /> {c.phone}
                        </div>
                      )}
                    </Td>
                    <Td className="text-right tabular-nums">{c.orders}</Td>
                    <Td className="text-right tabular-nums">{money(c.spent)}</Td>
                    <Td className="text-[0.88rem] text-text-3">{formatDate(c.createdAt)}</Td>
                    <Td>
                      {c.clerkUserId ? (
                        <Badge variant="success" dot>
                          Lié
                        </Badge>
                      ) : (
                        <Badge variant="neutral" dot>
                          Non lié
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmDelete(c)}
                          title="Supprimer ce profil"
                          aria-label="Supprimer"
                          className="hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableWrap>
        </Card>
      )}

      <DeleteCustomerModal
        customer={confirmDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </>
  );
}

function DeleteCustomerModal({
  customer,
  onClose,
}: {
  customer: Customer | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onDelete() {
    if (!customer) return;
    start(async () => {
      try {
        await deleteCustomer(customer.id);
        toast({ title: "Profil supprimé", message: customer.name, type: "success" });
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
      open={!!customer}
      onClose={onClose}
      title="Supprimer le profil client"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={pending}>
            {pending ? "Suppression…" : "Supprimer"}
          </Button>
        </>
      }
    >
      <p className="text-text-2">
        Confirmer la suppression du profil de{" "}
        <strong className="text-text">{customer?.name}</strong> ?
      </p>
      <p className="mt-2 text-[0.88rem] text-text-3">
        Cela supprime uniquement la <em>fiche client</em> côté Supabase. Le compte Clerk
        n'est pas affecté — pour supprimer le compte d'authentification, utilisez la
        page <strong>Utilisateurs</strong>.
      </p>
    </Modal>
  );
}
