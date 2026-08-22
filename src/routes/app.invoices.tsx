import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Plus, Download, Send, Trash2 } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/nanti/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/invoices")({
  head: () => ({
    meta: [
      { title: "Invoice · NANTI" },
      { name: "description", content: "Buat dan kelola invoice profesional." },
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
  template: "minimal" | "modern" | "premium";
}

const statusColors: Record<string, string> = {
  draft: "bg-secondary text-muted-foreground",
  sent: "bg-blue-50 text-blue-600",
  paid: "bg-green-50 text-green-600",
  overdue: "bg-red-50 text-red-600",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Terkirim",
  paid: "Lunas",
  overdue: "Terlambat",
};

function InvoicesPage() {
  const [showForm, setShowForm] = useState(false);
  const [invoices] = useState<Invoice[]>([]);

  const [form, setForm] = useState({
    clientName: "",
    dueDate: "",
    items: [{ id: "1", description: "", quantity: 1, unitPrice: 0, amount: 0 }] as InvoiceItem[],
    notes: "",
    template: "modern" as "minimal" | "modern" | "premium",
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
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const subtotal = form.items.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * 0.11;
  const total = subtotal + tax;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div>
      <PageHeader
        title="Invoice"
        subtitle="Buat dan kelola invoice profesional"
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 size-4" />
            Buat Invoice
          </Button>
        }
      />

      {!showForm && invoices.length === 0 && (
        <EmptyState
          title="Belum ada invoice"
          hint="Klik 'Buat Invoice' untuk membuat invoice pertama Anda."
        />
      )}

      {showForm && (
        <div className="rise space-y-6">
          <div className="card-soft p-5">
            <h2 className="mb-4 text-[14px] font-semibold">Detail Invoice</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-[13px]">Nama Klien</Label>
                <Input
                  className="mt-1.5 bg-surface"
                  placeholder="PT ABC Export"
                  value={form.clientName}
                  onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-[13px]">Tanggal Jatuh Tempo</Label>
                <Input
                  type="date"
                  className="mt-1.5 bg-surface"
                  value={form.dueDate}
                  onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="card-soft p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold">Item</h2>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1 size-3" /> Tambah Item
              </Button>
            </div>
            <div className="space-y-3">
              {form.items.map((item, i) => (
                <div key={item.id} className="flex gap-2">
                  <Input
                    className="flex-1 bg-surface"
                    placeholder="Deskripsi"
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                  />
                  <Input
                    type="number"
                    className="w-20 bg-surface"
                    placeholder="Qty"
                    value={item.quantity || ""}
                    onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                  />
                  <Input
                    type="number"
                    className="w-32 bg-surface"
                    placeholder="Harga"
                    value={item.unitPrice || ""}
                    onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                  />
                  <span className="flex items-center text-[13px] text-muted-foreground">
                    {formatCurrency(item.amount)}
                  </span>
                  {form.items.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeItem(i)}>
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card-soft p-5">
            <h2 className="mb-4 text-[14px] font-semibold">Template</h2>
            <div className="grid grid-cols-3 gap-3">
              {(["minimal", "modern", "premium"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((p) => ({ ...p, template: t }))}
                  className={cn(
                    "rounded-xl border p-4 text-center transition-colors",
                    form.template === t
                      ? "border-primary bg-accent/50"
                      : "border-border bg-surface hover:border-primary/40",
                  )}
                >
                  <FileText className="mx-auto mb-2 size-6 text-muted-foreground" />
                  <p className="text-[13px] font-medium capitalize">{t}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card-soft p-5">
            <h2 className="mb-4 text-[14px] font-semibold">Ringkasan</h2>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PPN (11%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                toast.success("Invoice disimpan sebagai draft");
                setShowForm(false);
              }}
            >
              Simpan Draft
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
                      template: form.template,
                      companyName: "NANTI",
                    }),
                  });

                  if (!response.ok) throw new Error("Gagal generate PDF");

                  const html = await response.text();
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    setTimeout(() => printWindow.print(), 500);
                  }
                  toast.success("Invoice berhasil dibuat");
                } catch {
                  toast.error("Gagal membuat invoice");
                }
              }}
            >
              <Download className="mr-1 size-4" /> Download PDF
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Batal
            </Button>
          </div>
        </div>
      )}

      {!showForm && invoices.length > 0 && (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-primary/30"
            >
              <FileText className="size-5 text-muted-foreground" />
              <div className="flex-1">
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
                  {inv.clientName} · {formatCurrency(inv.total)}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm">
                  <Download className="size-3.5" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Send className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
