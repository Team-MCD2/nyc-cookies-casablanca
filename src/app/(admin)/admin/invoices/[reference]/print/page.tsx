import { notFound } from "next/navigation";
import Image from "next/image";
import { getInvoiceByReference, listProducts } from "@/lib/queries";
import { money, formatDate } from "@/lib/utils";
import { SITE } from "@/lib/site";

export default async function InvoicePrintPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const invoice = await getInvoiceByReference(reference);

  if (!invoice) return notFound();

  const pro = invoice.pro;
  const customer = invoice.customer;
  const order = invoice.order;

  const clientName = pro?.company || customer?.name || "Client";
  const clientContact = pro ? pro.contactName : (customer?.name || "—");
  const clientEmail = pro?.email || customer?.email || "—";
  const clientPhone = pro?.phone || customer?.phone || "—";
  const clientAddress = pro?.address || "—";
  const clientIce = pro?.ice || null;

  // VAT Logic: only if pro has ICE
  const hasTva = !!clientIce;
  const totalTtc = invoice.amount;
  const totalHt = hasTva ? Math.round(totalTtc / 1.2) : totalTtc;
  const tvaAmount = totalTtc - totalHt;

  // Resolve product names and prices for order items
  const products = await listProducts();
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const orderItemsExtended = order?.items.map((item: any) => {
    const prod = productMap[item.pid];
    const name = prod?.name || item.name || item.pid || "Produit NYC Cookies";
    const unitPrice = prod?.price || 0;
    const total = unitPrice * item.qty;
    return {
      name,
      qty: item.qty,
      unitPrice,
      total,
    };
  }) || [];

  const itemsToRender = orderItemsExtended.length > 0
    ? orderItemsExtended
    : [{ name: "Commande NYC Cookies", qty: 1, unitPrice: totalTtc, total: totalTtc }];

  return (
    <div className="bg-white text-[#2b2b2b] min-h-screen p-8 sm:p-12 font-sans antialiased selection:bg-[#c0b09c]/20 max-w-4xl mx-auto print:p-0 print:mx-0 print:max-w-none">
      {/* Print Trigger Button (Only visible on screen, hidden in print) */}
      <div className="mb-6 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-[#c0b09c] hover:bg-[#b0a08c] text-white px-5 py-2 rounded shadow font-medium transition duration-150 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimer la facture (PDF)
        </button>
      </div>

      {/* Corporate Styled Invoice Sheet */}
      <div className="border border-gray-100 p-8 sm:p-12 rounded-lg shadow-sm print:border-none print:shadow-none print:p-0">
        
        {/* En-tête */}
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="font-serif text-4xl uppercase tracking-wider text-[#3c362f] mb-1 font-light">
              FACTURE
            </h1>
            <p className="font-mono text-sm text-gray-500 tracking-wider">REF: {invoice.id}</p>
          </div>
          <div className="flex flex-col items-end">
            <Image
              src="/nyclogo.png"
              alt="NYC Cookies Logo"
              width={75}
              height={75}
              className="rounded-full border border-gray-200 p-1 mb-2"
            />
            <h2 className="font-serif text-lg font-bold text-[#3c362f] tracking-wide">
              {SITE.fullName}
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-[240px] text-right leading-relaxed">
              {SITE.address.street}, {SITE.address.city}
            </p>
            <p className="text-xs text-gray-400 mt-1">ICE: 003386290000042</p>
          </div>
        </header>

        {/* Separator line styled after the color #c0b09c */}
        <div className="border-b border-[#c0b09c]/40 my-6" />

        {/* Meta / Details Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-sm">
          <div>
            <span className="block text-[0.7rem] uppercase tracking-wider text-gray-400 font-bold mb-2">
              DÉTAILS DE FACTURATION
            </span>
            <div className="space-y-1.5 text-gray-700">
              <p><span className="font-medium text-gray-900">Date d'émission :</span> {formatDate(invoice.issueDate)}</p>
              <p><span className="font-medium text-gray-900">Date d'échéance :</span> {formatDate(invoice.dueDate)}</p>
              <p><span className="font-medium text-gray-900">Mode de règlement :</span> Espèces ou Virement</p>
            </div>
          </div>
          <div>
            <span className="block text-[0.7rem] uppercase tracking-wider text-gray-400 font-bold mb-2">
              FACTURÉ À
            </span>
            <div className="space-y-1.5 text-gray-700">
              <h3 className="font-serif text-base font-bold text-gray-900 uppercase">
                {clientName}
              </h3>
              {pro && <p className="text-xs text-gray-500">Contact: {clientContact}</p>}
              <p className="text-xs leading-relaxed max-w-[280px]">{clientAddress}</p>
              {clientIce && (
                <p className="font-mono text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded inline-block">
                  ICE: {clientIce}
                </p>
              )}
              <p className="text-xs text-gray-500 pt-0.5">Tél: {clientPhone} | Email: {clientEmail}</p>
            </div>
          </div>
        </div>

        {/* Table of items with beautiful #c0b09c headers */}
        <div className="mb-10 overflow-hidden rounded border border-gray-200/80">
          <table className="w-full border-collapse text-sm text-left">
            <thead>
              <tr className="bg-[#c0b09c] text-white font-serif tracking-wider text-xs uppercase border-b border-[#c0b09c]">
                <th className="p-3 border-r border-[#c0b09c]/40 font-medium">Description</th>
                <th className="p-3 border-r border-[#c0b09c]/40 text-center w-24 font-medium">Quantité</th>
                <th className="p-3 border-r border-[#c0b09c]/40 text-right w-36 font-medium">Prix Unitaire</th>
                <th className="p-3 text-right w-40 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {itemsToRender.map((li, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition duration-150"
                >
                  <td className="p-3 border-r border-gray-100 font-medium text-gray-900">
                    {li.name}
                  </td>
                  <td className="p-3 border-r border-gray-100 text-center font-mono text-gray-800">
                    {li.qty}
                  </td>
                  <td className="p-3 border-r border-gray-100 text-right font-mono text-gray-600">
                    {money(li.unitPrice)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-gray-900">
                    {money(li.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Table */}
        <div className="flex justify-end mb-12">
          <table className="w-72 border-collapse text-sm text-gray-700">
            <tbody>
              {hasTva ? (
                <>
                  <tr className="border-b border-gray-100">
                    <td className="p-2.5 text-gray-400 font-bold uppercase text-xs text-right">TOTAL HORS TAXE</td>
                    <td className="p-2.5 font-mono text-right text-gray-800 font-medium">{money(totalHt)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-2.5 text-gray-400 font-bold uppercase text-xs text-right">TVA (20%)</td>
                    <td className="p-2.5 font-mono text-right text-gray-800 font-medium">{money(tvaAmount)}</td>
                  </tr>
                  <tr className="bg-[#c0b09c]/10">
                    <td className="p-3 text-[#3c362f] font-serif font-bold text-sm text-right">TOTAL TTC</td>
                    <td className="p-3 font-mono text-right font-bold text-[#3c362f] text-base">{money(totalTtc)}</td>
                  </tr>
                </>
              ) : (
                <tr className="bg-[#c0b09c]/10">
                  <td className="p-4 text-[#3c362f] font-serif font-bold text-sm text-right uppercase tracking-wider">TOTAL NET</td>
                  <td className="p-4 font-mono text-right font-bold text-[#3c362f] text-lg">{money(totalTtc)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Separator line before bank details */}
        <div className="border-b border-gray-100 my-6" />

        {/* Bank & Payment Info */}
        <footer className="text-xs text-gray-500 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div>
            <h4 className="font-serif font-bold text-gray-800 mb-2 uppercase tracking-wide">
              CONDITIONS DE RÈGLEMENT
            </h4>
            <p>Le règlement s'effectue par espèces à la livraison ou par virement bancaire sous les conditions convenues.</p>
            <p className="mt-2 text-gray-400">NYC Cookies Casablanca — ICE: 003386290000042</p>
          </div>
          <div>
            <h4 className="font-serif font-bold text-gray-800 mb-2 uppercase tracking-wide">
              INFORMATIONS BANCAIRES
            </h4>
            <div className="bg-gray-50 border border-gray-100 p-3 rounded font-mono space-y-1 text-gray-600">
              <p><span className="text-gray-400">Titulaire:</span> NYC COOKIES SARL</p>
              <p><span className="text-gray-400">Banque:</span> Attijariwafa Bank</p>
              <p className="text-xs break-all"><span className="text-gray-400">IBAN:</span> 007 780 0003559000000519 14</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Auto print trigger */}
      <script dangerouslySetInnerHTML={{ __html: "window.print();" }} />
    </div>
  );
}
