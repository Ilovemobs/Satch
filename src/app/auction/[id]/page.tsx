import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AuctionClient } from "./AuctionClient";

export const dynamic = "force-dynamic";

export default async function AuctionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const auction = await prisma.auction.findUnique({
    where: { id },
    include: {
      drawing: {
        select: { id: true, title: true, description: true, thumbnail: true },
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

  if (!auction) notFound();

  const isSeller = session?.user?.id === auction.sellerId;
  const now = new Date();
  const ended = now >= auction.endTime;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="aspect-[4/3] bg-zinc-800 flex items-center justify-center">
            {auction.drawing.thumbnail ? (
              <img src={auction.drawing.thumbnail} alt={auction.drawing.title} className="object-contain w-full h-full" />
            ) : (
              <div className="p-8 text-center">
                <p className="text-zinc-500">No preview available</p>
              </div>
            )}
          </div>
        </div>

        <AuctionClient
          auction={JSON.parse(JSON.stringify(auction))}
          userId={session?.user?.id || null}
          isSeller={isSeller}
          ended={ended}
        />
      </div>
    </div>
  );
}
