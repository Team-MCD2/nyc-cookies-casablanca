import { notFound } from "next/navigation";
import Image from "next/image";
import { getInvoiceByReference } from "@/lib/queries";
import { money, formatDate } from "@/lib/utils";
import { SITE } from "@/lib/site";

export default async function InvoicePrintPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const invoice = await getInvoiceByReference(reference);

  if (!invoice) return notFound();

  const pro = invoice.pro;
  const order = invoice.order;

  // Assuming items is available in the order, we need to fetch product details if possible.
  // For the sake of the print layout MVP, we will render the raw items data.
  // In a full implementation, the order items would be joined with product names.
  // We'll mock the names based on PIDs if we don't have the full join here.
  
  const subtotal = invoice.amount;
  // Facture example has TVA 20% if applicable. If the amount is TTC, then HT = TTC / 1.2
  // We'll assume the `amount` in DB is TTC, and TVA is 20%. 
  const totalHt = Math.round(subtotal / 1.2);
  const tva = subtotal - totalHt;

  return (
    <div className="bg-white text-black w-full min-h-screen p-10 font-sans print:p-0">
      {/* Header */}
      <header className="flex justify-between items-start mb-16">
        <div>
          <h1 className="text-3xl font-display text-black mb-2">Facture n°{invoice.id}</h1>
          <p className="text-gray-600">Date : {formatDate(invoice.issueDate)}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <Image src="/nyclogo.png" alt="NYC Cookies" width={100} height={100} className="mb-4" />
          <h2 className="text-2xl font-display text-black">{SITE.fullName}</h2>
          <p className="text-sm text-gray-600">{SITE.address.street}, {SITE.address.city}</p>
          <p className="text-sm text-gray-600">{SITE.email}</p>
          <p className="text-sm text-gray-600">{SITE.phoneDisplay}</p>
          <p className="text-sm text-gray-600">ICE: 003386290000042</p>
        </div>
      </header>

      {/* Client Info */}
      <section className="mb-12">
        <h3 className="text-xl border-b border-gray-300 pb-2 mb-4 inline-block">Facture adressée au client :</h3>
        <div>
          <p className="font-bold uppercase">{pro?.company}</p>
          <p className="text-gray-600 whitespace-pre-line">{pro?.address ?? "Adresse non renseignée"}</p>
          {pro?.ice && <p className="text-gray-600 mt-1">ICE: {pro.ice}</p>}
        </div>
      </section>

      {/* Table */}
      <table className="w-full mb-12 border-collapse">
        <thead>
          <tr className="bg-[#c2b29f] text-white">
            <th className="text-left p-3 border border-[#a89885]">Description</th>
            <th className="text-center p-3 border border-[#a89885] w-32">Quantité</th>
            <th className="text-right p-3 border border-[#a89885] w-40">Prix Unitaire</th>
            <th className="text-right p-3 border border-[#a89885] w-40">Total</th>
          </tr>
        </thead>
        <tbody>
          {order?.items.map((item: any, i: number) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="p-3 border-x border-gray-200">{item.name || item.pid || "Produit"}</td>
              <td className="p-3 text-center border-x border-gray-200">{item.qty}</td>
              <td className="p-3 text-right border-x border-gray-200">—</td>
              <td className="p-3 text-right border-x border-gray-200">—</td>
            </tr>
          ))}
          {!order?.items && (
            <tr className="border-b border-gray-200">
              <td className="p-3 border-x border-gray-200">Commande globale</td>
              <td className="p-3 text-center border-x border-gray-200">1</td>
              <td className="p-3 text-right border-x border-gray-200">{money(totalHt)}</td>
              <td className="p-3 text-right border-x border-gray-200">{money(totalHt)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-16">
        <table className="w-80 border-collapse">
          <tbody>
            <tr>
              <td className="p-2 border border-gray-300 font-bold text-right text-sm">TOTAL HORS TAXE</td>
              <td className="p-2 border border-gray-300 text-right">{totalHt} DH</td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300 font-bold text-right text-sm">TVA</td>
              <td className="p-2 border border-gray-300 text-right">{tva} DH</td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-300 font-bold text-right text-sm">TOTAL TTC</td>
              <td className="p-2 border border-gray-300 text-right font-bold">{invoice.amount} DH</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <footer>
        <p className="font-bold text-lg mb-4">Mode de paiement: Espèce ou virement bancaire</p>
        <div>
          <p className="text-gray-600 font-bold">Informations bancaires:</p>
          <p className="text-gray-600">Titulaire du compte: NYC COOKIES SARL</p>
          <p className="text-gray-600">IBAN: 007 780 0003559000000519 14</p>
        </div>
      </footer>

      {/* Print script */}
      <script dangerouslySetInnerHTML={{ __html: "window.print();" }} />
    </div>
  );
}
