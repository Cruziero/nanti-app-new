import { createFileRoute, json } from "@tanstack/react-router";
import type { InvoiceTemplate } from "@/lib/nanti-types";

export const Route = createFileRoute("/api/invoices/pdf")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const {
            invoiceNumber,
            clientName,
            clientAddress,
            date,
            dueDate,
            items,
            subtotal,
            tax,
            total,
            currency,
            notes,
            template = "modern",
            companyName,
            companyAddress,
            companyEmail,
            companyPhone,
          } = body;

          const formatCurrency = (amount: number) =>
            new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: currency || "IDR",
              minimumFractionDigits: 0,
            }).format(amount);

          const html = generateInvoiceHTML({
            invoiceNumber,
            clientName,
            clientAddress,
            date,
            dueDate,
            items,
            subtotal,
            tax,
            total,
            currency,
            notes,
            template,
            companyName,
            companyAddress,
            companyEmail,
            companyPhone,
            formatCurrency,
          });

          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
            },
          });
        } catch (error) {
          return json({ error: "Failed to generate invoice" }, { status: 500 });
        }
      },
    },
  },
});

interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  clientAddress?: string;
  date: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes?: string;
  template: InvoiceTemplate;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  formatCurrency: (amount: number) => string;
}

function generateInvoiceHTML(data: InvoiceData): string {
  const {
    invoiceNumber,
    clientName,
    clientAddress,
    date,
    dueDate,
    items,
    subtotal,
    tax,
    total,
    notes,
    template,
    companyName = "NANTI",
    companyAddress: compAddr,
    companyEmail: compEmail,
    companyPhone: compPhone,
    formatCurrency,
  } = data;

  const styles = getTemplateStyles(template);
  const accent = template === "premium" ? "#1a1a2e" : template === "modern" ? "#0d9488" : "#374151";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1a1a1a;
      background: white;
      font-size: 13px;
      line-height: 1.5;
    }
    
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      ${styles.headerStyle}
    }
    
    .company-info h1 {
      font-size: 24px;
      font-weight: 700;
      color: ${accent};
      margin-bottom: 8px;
    }
    
    .company-info p {
      color: #6b7280;
      font-size: 12px;
      line-height: 1.6;
    }
    
    .invoice-meta {
      text-align: right;
    }
    
    .invoice-meta h2 {
      font-size: 32px;
      font-weight: 300;
      color: ${accent};
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    
    .invoice-meta .number {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-top: 4px;
    }
    
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
      padding: 20px;
      background: ${template === "premium" ? "#f8fafc" : template === "modern" ? "#f0fdfa" : "#f9fafb"};
      border-radius: 8px;
    }
    
    .meta-item label {
      display: block;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9ca3af;
      margin-bottom: 4px;
    }
    
    .meta-item span {
      font-size: 13px;
      font-weight: 500;
      color: #1a1a1a;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    
    thead th {
      text-align: left;
      padding: 12px 16px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: white;
      background: ${accent};
    }
    
    thead th:last-child {
      text-align: right;
    }
    
    thead th:nth-child(2),
    thead th:nth-child(3) {
      text-align: center;
    }
    
    tbody td {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    
    tbody td:last-child {
      text-align: right;
      font-weight: 500;
    }
    
    tbody td:nth-child(2),
    tbody td:nth-child(3) {
      text-align: center;
    }
    
    tbody tr:nth-child(even) {
      background: ${template === "premium" ? "#f8fafc" : "transparent"};
    }
    
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    
    .totals-box {
      width: 250px;
      padding: 16px;
      background: ${template === "premium" ? "#f8fafc" : template === "modern" ? "#f0fdfa" : "#f9fafb"};
      border-radius: 8px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 13px;
    }
    
    .totals-row.total {
      border-top: 2px solid ${accent};
      margin-top: 8px;
      padding-top: 12px;
      font-weight: 700;
      font-size: 16px;
      color: ${accent};
    }
    
    .notes {
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 32px;
    }
    
    .notes h3 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .notes p {
      font-size: 12px;
      color: #4b5563;
    }
    
    .footer {
      text-align: center;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 11px;
    }
    
    @media print {
      .invoice { padding: 20px; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="company-info">
        <h1>${companyName}</h1>
        ${compAddr ? `<p>${compAddr}</p>` : ""}
        ${compEmail ? `<p>${compEmail}</p>` : ""}
        ${compPhone ? `<p>${compPhone}</p>` : ""}
      </div>
      <div class="invoice-meta">
        <h2>Invoice</h2>
        <div class="number">${invoiceNumber}</div>
      </div>
    </div>
    
    <div class="meta-grid">
      <div class="meta-item">
        <label>Klien</label>
        <span>${clientName}</span>
        ${clientAddress ? `<br><span style="font-size:12px;color:#6b7280">${clientAddress}</span>` : ""}
      </div>
      <div class="meta-item">
        <label>Tanggal Invoice</label>
        <span>${date}</span>
      </div>
      <div class="meta-item">
        <label>Jatuh Tempo</label>
        <span>${dueDate}</span>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Deskripsi</th>
          <th>Qty</th>
          <th>Harga Satuan</th>
          <th>Jumlah</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item) => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unitPrice)}</td>
          <td>${formatCurrency(item.amount)}</td>
        </tr>`,
          )
          .join("")}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>PPN (11%)</span>
          <span>${formatCurrency(tax)}</span>
        </div>
        <div class="totals-row total">
          <span>Total</span>
          <span>${formatCurrency(total)}</span>
        </div>
      </div>
    </div>
    
    ${
      notes
        ? `
    <div class="notes">
      <h3>Catatan</h3>
      <p>${notes}</p>
    </div>`
        : ""
    }
    
    <div class="footer">
      <p>Invoice ini dibuat oleh NANTI · nanti-app.vercel.app</p>
    </div>
  </div>
</body>
</html>`;
}

function getTemplateStyles(template: InvoiceTemplate) {
  switch (template) {
    case "premium":
      return {
        headerStyle: "padding-bottom: 24px; border-bottom: 3px solid #1a1a2e;",
      };
    case "modern":
      return {
        headerStyle: "padding-bottom: 16px; border-bottom: 2px solid #0d9488;",
      };
    case "minimal":
    default:
      return {
        headerStyle: "padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;",
      };
  }
}
