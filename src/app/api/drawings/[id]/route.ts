import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const drawing = await prisma.drawing.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, username: true } },
      auction: {
        include: {
          bids: {
            orderBy: { createdAt: "desc" },
            take: 50,
            include: { bidder: { select: { id: true, username: true } } },
          },
          winner: { select: { id: true, username: true } },
        },
      },
    },
  });

  if (!drawing) {
    return Response.json({ error: "Drawing not found" }, { status: 404 });
  }

  return Response.json(drawing);
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

  const drawing = await prisma.drawing.findUnique({ where: { id } });

  if (!drawing) {
    return Response.json({ error: "Drawing not found" }, { status: 404 });
  }

  if (drawing.ownerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const auction = await prisma.auction.findUnique({ where: { drawingId: id } });
  if (auction) {
    return Response.json({ error: "Cannot delete drawing with active auction" }, { status: 400 });
  }

  await prisma.drawing.delete({ where: { id } });

  return Response.json({ success: true });
}
