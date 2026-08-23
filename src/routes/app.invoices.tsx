import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Plus, Download, Trash2 } from "lucide-react";
import { PageHeader, EmptyState, Section } from "@/components/nanti/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices - NANTI" },
      { name: "description", content: "Create and manage professional invoices." },
    ],
  }),
  component: InvoicesPage,
});

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue";
}

const statusColors: Record<string, string> = {
  draft: "bg-secondary text-muted-foreground",
  sent: "bg-blue-50 text-blue-600",
  paid: "bg-green-50 text-green-600",
  overdue: "bg-red-50 text-red-600",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};

function InvoicesPage() {
  const [showForm, setShowForm] = useState(false);
  const [invoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState({
    clientName: "",
    dueDate: "",
    items: [{ id: "1", description: "", quantity: 1, unitPrice: 0, amount: 0 }] as InvoiceItem[],
    notes: "",
  });

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        items[index].amount = items[index].quantity * items[index].unitPrice;
      }
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0, amount: 0 },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const subtotal = form.items.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * 0.11;
  const total = subtotal + tax;

  const fmt = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Create and manage professional invoices"
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 size-4" />
            {showForm ? "Cancel" : "New Invoice"}
          </Button>
        }
      />

      {!showForm && invoices.length === 0 && (
        <EmptyState title="No invoices yet" hint="Click 'New Invoice' to create your first one." />
      )}

      {showForm && (
        <div className="max-w-xl space-y-6">
          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-[13px]">Client</Label>
                <Input
                  className="mt-1.5"
                  placeholder="PT ABC Export"
                  value={form.clientName}
                  onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-[13px]">Due Date</Label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={form.dueDate}
                  onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Items
              </h2>
              <button
                onClick={addItem}
                className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
              >
                + Add item
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={item.id} className="flex gap-2">
                  <Input
                    className="flex-1"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                  />
                  <Input
                    type="number"
                    className="w-20"
                    placeholder="Qty"
                    value={item.quantity || ""}
                    onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                  />
                  <Input
                    type="number"
                    className="w-32"
                    placeholder="Price"
                    value={item.unitPrice || ""}
                    onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                  />
                  <span className="flex items-center text-[13px] text-muted-foreground">
                    {fmt(item.amount)}
                  </span>
                  {form.items.length > 1 && (
                    <button
                      onClick={() => removeItem(i)}
                      className="text-muted-foreground/40 hover:text-muted-foreground"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Summary
            </h2>
            <div className="space-y-1.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (11%)</span>
                <span>{fmt(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
          </section>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                toast.success("Invoice saved as draft");
                setShowForm(false);
              }}
            >
              Save Draft
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch("/api/invoices/pdf", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
                      clientName: form.clientName || "Client",
                      date: new Date().toLocaleDateString("id-ID"),
                      dueDate: form.dueDate || "-",
                      items: form.items.filter((i) => i.description),
                      subtotal,
                      tax,
                      total,
                      currency: "IDR",
                      notes: form.notes,
                      template: "modern",
                      companyName: "NANTI",
                    }),
                  });
                  if (!response.ok) throw new Error("Failed");
                  const html = await response.text();
                  const w = window.open("", "_blank");
                  if (w) {
                    w.document.write(html);
                    w.document.close();
                    setTimeout(() => w.print(), 500);
                  }
                  toast.success("Invoice created");
                } catch {
                  toast.error("Failed to create invoice");
                }
              }}
            >
              <Download className="mr-1 size-4" /> PDF
            </Button>
          </div>
        </div>
      )}

      {!showForm && invoices.length > 0 && (
        <Section count={invoices.length}>
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 px-1 py-3">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium">{inv.invoiceNumber}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      statusColors[inv.status],
                    )}
                  >
                    {statusLabels[inv.status]}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground">
                  {inv.clientName} - {fmt(inv.total)}
                </p>
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}
