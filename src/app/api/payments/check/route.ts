import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPayment } from "@/lib/lightning";

export async function GET(request: NextRequest) {
  const paymentHash = request.nextUrl.searchParams.get("paymentHash");
  if (!paymentHash) {
    return Response.json({ error: "Missing paymentHash" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { paymentHash },
  });

  if (!payment) {
    return Response.json({ error: "Payment not found" }, { status: 404 });
  }

  const status = await checkPayment(paymentHash);

  if (status.paid && payment.status === "PENDING") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETE", settledAt: new Date() },
    });
  }

  return Response.json({
    paid: status.paid,
    status: status.paid ? "COMPLETE" : "PENDING",
  });
}
