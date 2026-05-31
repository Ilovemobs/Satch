import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, createdAt: true },
  });

  if (!user) notFound();

  const [drawings, wonAuctions, sellerAuctions] = await Promise.all([
    prisma.drawing.findMany({
      where: { ownerId: id, isMinted: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        auction: { select: { id: true, status: true, currentBid: true } },
      },
    }),
    prisma.auction.findMany({
      where: { winnerId: id, status: "ENDED" },
      include: {
        drawing: { select: { id: true, title: true, thumbnail: true } },
      },
    }),
    prisma.auction.findMany({
      where: { sellerId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        drawing: { select: { id: true, title: true, thumbnail: true } },
        _count: { select: { bids: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{user.username}</h1>
        <p className="text-sm text-zinc-500">
          Joined {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Drawings ({drawings.length})</h2>
        {drawings.length === 0 ? (
          <p className="text-sm text-zinc-500">No drawings minted yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drawings.map((drawing) => (
              <Link
                key={drawing.id}
                href={`/drawing/${drawing.id}`}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden hover:border-zinc-700 transition-colors"
              >
                <div className="aspect-[4/3] bg-zinc-800 flex items-center justify-center">
                  {drawing.thumbnail ? (
                    <img src={drawing.thumbnail} alt={drawing.title} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-zinc-600 text-sm">{drawing.title}</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate group-hover:text-amber-500 transition-colors">
                    {drawing.title}
                  </p>
                  {drawing.auction && (
                    <p className="text-xs text-amber-500 mt-1">
                      {drawing.auction.status === "ACTIVE"
                        ? `${drawing.auction.currentBid} SATS · On auction`
                        : drawing.auction.status}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Auctions Won ({wonAuctions.length})</h2>
        {wonAuctions.length === 0 ? (
          <p className="text-sm text-zinc-500">No auctions won.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wonAuctions.map((auction) => (
              <Link
                key={auction.id}
                href={`/auction/${auction.id}`}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden hover:border-zinc-700 transition-colors"
              >
                <div className="aspect-[4/3] bg-zinc-800 flex items-center justify-center">
                  {auction.drawing.thumbnail ? (
                    <img src={auction.drawing.thumbnail} alt={auction.drawing.title} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-zinc-600 text-sm">{auction.drawing.title}</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate group-hover:text-amber-500">{auction.drawing.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
