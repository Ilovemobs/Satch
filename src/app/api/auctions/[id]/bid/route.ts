import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInvoice } from "@/lib/lightning";
import { PLATFORM_FEE_PERCENT } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { amount } = body;

  if (!amount || amount < 0) {
    return Response.json({ error: "Invalid bid amount" }, { status: 400 });
  }

  const auction = await prisma.auction.findUnique({ where: { id } });
  if (!auction) {
    return Response.json({ error: "Auction not found" }, { status: 404 });
  }
  if (auction.status !== "ACTIVE") {
    return Response.json({ error: "Auction is not active" }, { status: 400 });
  }
  if (auction.sellerId === session.user.id) {
    return Response.json({ error: "Cannot bid on your own auction" }, { status: 400 });
  }
  if (new Date() >= auction.endTime) {
    return Response.json({ error: "Auction has ended" }, { status: 400 });
  }

  const minBid = auction.currentBid + auction.minBidIncrement;
  if (amount < minBid) {
    return Response.json({
      error: `Bid must be at least ${minBid} SATS`,
      minBid,
    }, { status: 400 });
  }

  const invoice = await createInvoice(amount, `Bid on auction ${id}`);

  const payment = await prisma.payment.create({
    data: {
      amountSats: amount,
      type: "BID",
      status: "PENDING",
      invoice: invoice.paymentRequest,
      paymentHash: invoice.paymentHash,
      description: `Bid on auction ${id}`,
      userId: session.user.id,
    },
  });

  const bid = await prisma.bid.create({
    data: {
      amount,
      auctionId: id,
      bidderId: session.user.id,
      paymentId: payment.id,
    },
    include: {
      bidder: { select: { id: true, username: true } },
      payment: true,
    },
  });

  await prisma.auction.update({
    where: { id },
    data: { currentBid: amount },
  });

  return Response.json({
    bid,
    invoice: payment.invoice,
    paymentHash: payment.paymentHash,
    amount,
  }, { status: 201 });
}
