import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await autoCloseAuction(id);

  const auction = await prisma.auction.findUnique({
    where: { id },
    include: {
      drawing: {
        select: { id: true, title: true, description: true, canvasData: true, thumbnail: true },
      },
      seller: { select: { id: true, username: true } },
      winner: { select: { id: true, username: true } },
      bids: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { bidder: { select: { id: true, username: true } } },
      },
    },
  });

  if (!auction) {
    return Response.json({ error: "Auction not found" }, { status: 404 });
  }

  return Response.json(auction);
}

async function autoCloseAuction(auctionId: string) {
  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction || auction.status !== "ACTIVE") return;
  if (new Date() < auction.endTime) return;

  const highestBid = await prisma.bid.findFirst({
    where: { auctionId },
    orderBy: { amount: "desc" },
    include: { payment: true },
  });

  await prisma.auction.update({
    where: { id: auctionId },
    data: {
      status: "ENDED",
      winnerId: highestBid?.bidderId || null,
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auction = await prisma.auction.findUnique({ where: { id } });
  if (!auction) {
    return Response.json({ error: "Auction not found" }, { status: 404 });
  }
  if (auction.sellerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (auction.status !== "ACTIVE") {
    return Response.json({ error: "Cannot cancel ended auction" }, { status: 400 });
  }

  await prisma.auction.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return Response.json({ success: true });
}
