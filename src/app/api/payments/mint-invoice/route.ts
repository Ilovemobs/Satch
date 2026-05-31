import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInvoice } from "@/lib/lightning";
import { MINT_COST_SATS } from "@/lib/utils";

export async function POST(_request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await createInvoice(
    MINT_COST_SATS,
    "Mint a drawing on Satch"
  );

  const payment = await prisma.payment.create({
    data: {
      amountSats: MINT_COST_SATS,
      type: "MINT",
      status: "PENDING",
      invoice: invoice.paymentRequest,
      paymentHash: invoice.paymentHash,
      description: "Mint a drawing on Satch",
      userId: session.user.id,
    },
  });

  return Response.json({
    paymentHash: payment.paymentHash,
    invoice: payment.invoice,
    amount: MINT_COST_SATS,
    paymentId: payment.id,
  });
}
