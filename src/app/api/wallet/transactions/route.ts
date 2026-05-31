import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      drawing: { select: { id: true, title: true } },
    },
  });

  const bids = await prisma.bid.findMany({
    where: { bidderId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      auction: {
        select: {
          id: true,
          status: true,
          drawing: { select: { id: true, title: true } },
        },
      },
    },
  });

  return Response.json({ payments, bids });
}
