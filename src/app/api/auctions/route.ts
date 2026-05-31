import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "ACTIVE";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [auctions, total] = await Promise.all([
    prisma.auction.findMany({
      where: { status },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        drawing: {
          select: { id: true, title: true, thumbnail: true },
        },
        seller: { select: { id: true, username: true } },
        winner: { select: { id: true, username: true } },
        _count: { select: { bids: true } },
      },
    }),
    prisma.auction.count({ where: { status } }),
  ]);

  return Response.json({ auctions, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { drawingId, startingBid, durationHours } = body;

  if (!drawingId || !startingBid || !durationHours) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const drawing = await prisma.drawing.findUnique({ where: { id: drawingId } });
  if (!drawing) {
    return Response.json({ error: "Drawing not found" }, { status: 404 });
  }
  if (drawing.ownerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.auction.findUnique({ where: { drawingId } });
  if (existing) {
    return Response.json({ error: "Auction already exists for this drawing" }, { status: 400 });
  }

  const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  const auction = await prisma.auction.create({
    data: {
      drawingId,
      startingBid,
      currentBid: startingBid,
      endTime,
      sellerId: session.user.id,
    },
    include: {
      drawing: { select: { id: true, title: true, thumbnail: true } },
      seller: { select: { id: true, username: true } },
    },
  });

  return Response.json(auction, { status: 201 });
}
