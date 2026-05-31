const { randomUUID } = require("crypto");

interface MockInvoice {
  paymentHash: string;
  paymentRequest: string;
  amount: number;
  status: "PENDING" | "COMPLETE" | "FAILED";
  createdAt: Date;
}

const invoices = new Map<string, MockInvoice>();

export async function createInvoice(amountSats: number, memo?: string) {
  if (process.env.MOCK_LIGHTNING === "true") {
    const paymentHash = randomUUID();
    const invoice: MockInvoice = {
      paymentHash,
      paymentRequest: `lnbc${amountSats}n1mock${paymentHash.slice(0, 20)}`,
      amount: amountSats,
      status: "PENDING",
      createdAt: new Date(),
    };
    invoices.set(paymentHash, invoice);

    setTimeout(() => {
      const inv = invoices.get(paymentHash);
      if (inv && inv.status === "PENDING") {
        inv.status = "COMPLETE";
      }
    }, 8000);

    return invoice;
  }

  throw new Error("Real Lightning Network not configured");
}

export async function checkPayment(paymentHash: string) {
  if (process.env.MOCK_LIGHTNING === "true") {
    const invoice = invoices.get(paymentHash);
    if (!invoice) return { paid: false, settled: null };
    return { paid: invoice.status === "COMPLETE", settled: invoice.status === "COMPLETE" ? new Date().toISOString() : null };
  }

  throw new Error("Real Lightning Network not configured");
}

export async function getInvoiceStatus(paymentHash: string) {
  if (process.env.MOCK_LIGHTNING === "true") {
    const invoice = invoices.get(paymentHash);
    if (!invoice) return null;
    return { paid: invoice.status === "COMPLETE" };
  }

  throw new Error("Real Lightning Network not configured");
}
