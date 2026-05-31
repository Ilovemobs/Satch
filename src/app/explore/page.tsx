import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  if (!prisma) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Database Not Connected</h2>
        <p className="text-zinc-500">Set DATABASE_URL in your environment to enable the marketplace.</p>
      </div>
    );
  }

  const [drawings, auctions] = await Promise.all([
    prisma.drawing.findMany({
      where: { isMinted: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        owner: { select: { id: true, username: true } },
        auction: { select: { id: true, status: true, currentBid: true, endTime: true } },
      },
    }),
    prisma.auction.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        drawing: { select: { id: true, title: true, thumbnail: true } },
        seller: { select: { id: true, username: true } },
        _count: { select: { bids: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-bold mb-4">Active Auctions</h2>
        {auctions.length === 0 ? (
          <p className="text-zinc-500">No active auctions right now.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {auctions.map((auction) => (
              <Link
                key={auction.id}
                href={`/auction/${auction.id}`}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden hover:border-zinc-700 transition-colors"
              >
                <div className="aspect-[4/3] bg-zinc-800 flex items-center justify-center overflow-hidden">
                  {auction.drawing.thumbnail ? (
                    <img src={auction.drawing.thumbnail} alt={auction.drawing.title} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-zinc-600 text-sm">No preview</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-sm truncate group-hover:text-amber-500 transition-colors">
                    {auction.drawing.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">by {auction.seller.username}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-500">
                      {auction.currentBid} SATS
                    </span>
                    <span className="text-xs text-zinc-500">
                      {auction._count.bids} bids
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Recent Minted Drawings</h2>
        {drawings.length === 0 ? (
          <p className="text-zinc-500">No drawings minted yet. Be the first!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {drawings.map((drawing) => (
              <Link
                key={drawing.id}
                href={`/drawing/${drawing.id}`}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden hover:border-zinc-700 transition-colors"
              >
                <div className="aspect-[4/3] bg-zinc-800 flex items-center justify-center overflow-hidden">
                  {drawing.thumbnail ? (
                    <img src={drawing.thumbnail} alt={drawing.title} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-zinc-600 text-sm">No preview</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-sm truncate group-hover:text-amber-500 transition-colors">
                    {drawing.title}
                  </h3>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">by {drawing.owner.username}</span>
                    {drawing.auction ? (
                      <span className="text-xs text-amber-600">
                        {drawing.auction.status === "ACTIVE" ? "On auction" : "Sold"}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">Not for sale</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
