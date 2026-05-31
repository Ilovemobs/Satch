import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [activeAuctions, totalDrawings, totalUsers] = await Promise.all([
    prisma.auction.count({ where: { status: "ACTIVE" } }),
    prisma.drawing.count({ where: { isMinted: true } }),
    prisma.user.count(),
  ]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-12">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Trade Your Art for
          <span className="text-amber-500"> Bitcoin</span>
        </h1>
        <p className="mt-6 text-lg text-zinc-400">
          Create a drawing for just <span className="font-semibold text-amber-400">100 SATS</span>,
          mint it on the platform, and sell it to the highest bidder in a live auction.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/draw"
            className="rounded-xl bg-amber-600 px-8 py-3 font-semibold text-white hover:bg-amber-500 transition-colors"
          >
            Start Drawing
          </Link>
          <Link
            href="/explore"
            className="rounded-xl border border-zinc-700 px-8 py-3 font-semibold text-zinc-300 hover:border-zinc-500 transition-colors"
          >
            Explore Art
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 text-center">
        <div>
          <div className="text-3xl font-bold text-amber-500">{activeAuctions}</div>
          <div className="text-sm text-zinc-500 mt-1">Active Auctions</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-amber-500">{totalDrawings}</div>
          <div className="text-sm text-zinc-500 mt-1">Minted Drawings</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-amber-500">{totalUsers}</div>
          <div className="text-sm text-zinc-500 mt-1">Artists</div>
        </div>
      </div>

      <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
        <h2 className="text-xl font-semibold mb-4">How it works</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-600/20 text-amber-500 font-bold">1</div>
            <h3 className="font-medium mb-1">Draw</h3>
            <p className="text-sm text-zinc-500">Create a drawing on our canvas with brushes, shapes, and colors.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-600/20 text-amber-500 font-bold">2</div>
            <h3 className="font-medium mb-1">Mint</h3>
            <p className="text-sm text-zinc-500">Pay 100 SATS via Lightning to mint your artwork on the platform.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-600/20 text-amber-500 font-bold">3</div>
            <h3 className="font-medium mb-1">Sell</h3>
            <p className="text-sm text-zinc-500">Start an auction and let bidders compete for your creation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
