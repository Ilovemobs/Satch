import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ownerId = searchParams.get("ownerId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = ownerId ? { ownerId } : {};

  const [drawings, total] = await Promise.all([
    prisma.drawing.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, username: true } },
        auction: { select: { id: true, status: true, currentBid: true, endTime: true } },
      },
    }),
    prisma.drawing.count({ where }),
  ]);

  return Response.json({ drawings, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, canvasData, thumbnail, paymentHash } = body;

  if (!title || !canvasData || !paymentHash) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { paymentHash },
  });

  if (!payment || payment.status !== "COMPLETE") {
    return Response.json({ error: "Payment not confirmed" }, { status: 402 });
  }

  const drawing = await prisma.drawing.create({
    data: {
      title,
      description: description || "",
      canvasData,
      thumbnail: thumbnail || null,
      isMinted: true,
      ownerId: session.user.id,
      mintPayment: { connect: { id: payment.id } },
    },
    include: {
      owner: { select: { id: true, username: true } },
    },
  });

  return Response.json(drawing, { status: 201 });
}
