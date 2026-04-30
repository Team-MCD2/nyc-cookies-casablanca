"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import {
  Field,
  Label,
  Input,
  InputGroup,
  Select,
  Textarea,
  Checkbox,
  FieldError,
  FieldHelp,
} from "@/components/ui/input";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import { upsertProduct, deleteProduct } from "@/lib/actions";
import { money } from "@/lib/utils";
import type { Product, ProductCategory } from "@/lib/types";

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  cookie: "Cookie",
  box: "Box",
  icecream: "Ice Cream",
};

interface Props {
  products: Product[];
}

export function ProductsClient({ products }: Props) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:max-w-sm sm:flex-1">
          <InputGroup
            icon={<Search className="h-4 w-4" />}
            placeholder="Rechercher un produit, une description, un id…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Nouveau produit
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Empty title="Aucun produit">
          {query
            ? "Aucun produit ne correspond à votre recherche."
            : "Commencez par ajouter votre premier produit."}
        </Empty>
      ) : (
        <Card className="p-0">
          <TableWrap className="rounded-none border-0">
            <Table>
              <Thead>
                <Tr>
                  <Th>Produit</Th>
                  <Th>Catégorie</Th>
                  <Th className="text-right">Prix</Th>
                  <Th className="text-right">Stock</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[0.85rem] text-text-3 line-clamp-1">
                        {p.desc || <span className="italic">Sans description</span>}
                      </div>
                      <div className="mt-0.5 font-mono text-[0.72rem] text-text-muted">
                        {p.id}
                      </div>
                    </Td>
                    <Td>
                      <Badge variant="neutral">{CATEGORY_LABEL[p.category]}</Badge>
                    </Td>
                    <Td className="text-right tabular-nums">{money(p.price)}</Td>
                    <Td className="text-right tabular-nums">
                      <span
                        className={
                          p.stock <= 0
                            ? "text-danger"
                            : p.stock < 20
                              ? "text-warning"
                              : ""
                        }
                      >
                        {p.stock}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant={p.active ? "success" : "neutral"}>
                        {p.active ? "Actif" : "Inactif"}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(p)}
                          aria-label="Modifier"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmDelete(p)}
                          aria-label="Supprimer"
                          title="Supprimer"
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

      <ProductFormModal
        key={editing?.id ?? (creating ? "new" : "closed")}
        open={creating || !!editing}
        product={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />

      <DeleteConfirmModal
        product={confirmDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </>
  );
}

// =============================================================================
// Form modal (create + edit)
// =============================================================================

interface FormModalProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

function ProductFormModal({ open, product, onClose }: FormModalProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!product;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: isEdit ? product!.id : String(fd.get("id") ?? "").trim(),
      name: String(fd.get("name") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim(),
      category: String(fd.get("category") ?? "cookie") as ProductCategory,
      price_mad: Number(fd.get("price_mad") ?? 0),
      stock: Number(fd.get("stock") ?? 0),
      active: fd.get("active") === "on",
    };

    if (!payload.id) {
      setError("L'identifiant est requis (ex : p_soho).");
      return;
    }
    if (!payload.name) {
      setError("Le nom est requis.");
      return;
    }

    start(async () => {
      try {
        await upsertProduct(payload);
        toast({
          title: isEdit ? "Produit modifié" : "Produit créé",
          message: `${payload.name} (${payload.id})`,
          type: "success",
        });
        onClose();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue.");
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Modifier "${product!.name}"` : "Nouveau produit"}
      size="md"
    >
      <form onSubmit={onSubmit} className="stack">
        <Field>
          <Label htmlFor="id">Identifiant</Label>
          <Input
            id="id"
            name="id"
            placeholder="p_soho"
            defaultValue={product?.id ?? ""}
            disabled={isEdit}
            required
            pattern="[a-z0-9_]+"
          />
          <FieldHelp>
            {isEdit
              ? "L'identifiant ne peut pas être modifié."
              : "Lettres minuscules, chiffres et _ uniquement (ex : p_soho)."}
          </FieldHelp>
        </Field>

        <Field>
          <Label htmlFor="name">Nom du produit</Label>
          <Input
            id="name"
            name="name"
            placeholder="Soho"
            defaultValue={product?.name ?? ""}
            required
          />
        </Field>

        <Field>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Beurre noisette, pépites de chocolat noir 70%."
            defaultValue={product?.desc ?? ""}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field>
            <Label htmlFor="category">Catégorie</Label>
            <Select
              id="category"
              name="category"
              defaultValue={product?.category ?? "cookie"}
              required
            >
              <option value="cookie">Cookie</option>
              <option value="box">Box</option>
              <option value="icecream">Ice Cream</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="price_mad">Prix (MAD)</Label>
            <Input
              id="price_mad"
              name="price_mad"
              type="number"
              min={0}
              step={1}
              defaultValue={product?.price ?? 28}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              min={0}
              step={1}
              defaultValue={product?.stock ?? 0}
              required
            />
          </Field>
        </div>

        <Checkbox name="active" defaultChecked={product?.active ?? true}>
          Produit actif (visible à la boutique)
        </Checkbox>

        {error && <FieldError>{error}</FieldError>}

        <div className="mt-2 flex flex-wrap justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le produit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// =============================================================================
// Delete confirmation
// =============================================================================

function DeleteConfirmModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onDelete() {
    if (!product) return;
    start(async () => {
      try {
        await deleteProduct(product.id);
        toast({
          title: "Produit supprimé",
          message: product.name,
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
      open={!!product}
      onClose={onClose}
      title="Supprimer le produit"
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
        Confirmer la suppression de <strong className="text-text">{product?.name}</strong> ?
      </p>
      <p className="mt-2 text-[0.88rem] text-text-3">
        Cette action est définitive. Le produit disparaîtra immédiatement de la boutique
        publique. Les commandes passées ne sont pas affectées.
      </p>
    </Modal>
  );
}
